"""
Moteur de prédiction pour le parcours passager.
Charge tous les modèles entraînés et fournit des prédictions par étape + total.
"""
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import joblib
import pandas as pd
import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.append(str(SCRIPT_DIR))

from utils import load_json, build_feature_vector, trapezoid_expectations

# Noms des étapes pour le JSON de sortie
STEP_NAMES = {
    1: "Entree_Terminal",
    2: "Enregistrement",
    3: "Controle_Securite",
    4: "Controle_Passeport",
    5: "Duty_Free",
    6: "Porte_Embarquement",
    7: "Vol",
    8: "Recuperation_Bagages",
    9: "Sortie_Aeroport",
}

# Durées moyennes de référence par étape (minutes) - utilisées si pas de modèle
DEFAULT_DURATIONS = {
    "domestic": {1: 6, 2: 12, 3: 18, 4: 4, 5: 18, 6: 25, 7: 80, 8: 18, 9: 8},
    "international": {1: 7, 2: 16, 3: 20, 4: 12, 5: 19, 6: 27, 7: 420, 8: 28, 9: 9},
}

# Référence congestion : croissance monotone (puissance) sans plateau rapide
CONGESTION_REF = 30  # passagers actifs de référence
CONGESTION_GAMMA = 0.8  # sensibilité (1.0 = linéaire, <1 = sous-linéaire)
CONGESTION_FLOOR = 0.5
CONGESTION_CAP = 6.0  # plafond plus haut pour éviter la saturation précoce


class JourneyPredictor:
    """
    Charge les modèles de survie et prédit le temps restant
    pour l'étape courante et les étapes suivantes.
    """

    def __init__(self, model_type: str = "cox", checkpoint_dir: Path = None, meta_path: Path = None):
        self.model_type = model_type
        self.checkpoint_dir = checkpoint_dir or Path("models/checkpoints")
        self.meta_path = meta_path or Path("data/processed/meta.json")
        self.models: Dict[int, object] = {}
        self.meta: Dict = {}
        self._load_models()

    def _load_models(self):
        """Charge tous les modèles disponibles (step 1..9)."""
        self.meta = load_json(self.meta_path)
        for step in range(1, 10):
            ckpt = self.checkpoint_dir / f"{self.model_type}_step_{step}.pkl"
            if ckpt.exists():
                self.models[step] = joblib.load(ckpt)

    def predict_step(
        self,
        step: int,
        airport: str,
        flight_type: str,
        hour_of_day: int,
        time_spent_current_step: float,
        active_users_in_step: float,
        avg_step_duration: float,
    ) -> Tuple[float, float]:
        """
        Prédit le temps restant pour une étape donnée.
        Retourne (mean_remaining, median_remaining) en minutes.
        """
        if step not in self.models:
            # Fallback: durée moyenne - temps passé
            base = DEFAULT_DURATIONS.get(flight_type, DEFAULT_DURATIONS["domestic"]).get(step, 10)
            remaining = max(0.5, base - time_spent_current_step)
            return remaining, remaining

        X = build_feature_vector(
            meta=self.meta,
            airport=airport,
            flight_type=flight_type,
            hour_of_day=hour_of_day,
            time_spent_current_step=time_spent_current_step,
            active_users_in_step=active_users_in_step,
            avg_step_duration=avg_step_duration,
        )

        model = self.models[step]
        surv = model.predict_survival_function(X)
        mean_surv, median_surv = trapezoid_expectations(surv)

        # Appliquer un facteur congestion monotone (puissance du ratio actifs)
        ratio = max(0.0, active_users_in_step) / max(1.0, CONGESTION_REF)
        cong_factor = np.power(ratio, CONGESTION_GAMMA)
        cong_factor = max(CONGESTION_FLOOR, min(CONGESTION_CAP, cong_factor))

        mean_surv *= cong_factor
        median_surv *= cong_factor

        return max(0.5, mean_surv), max(0.5, median_surv)

    def predict_future_steps(
        self,
        current_step: int,
        airport: str,
        flight_type: str,
        hour_of_day: int,
        active_users_by_step: Dict[int, float],
        avg_durations_by_step: Dict[int, float],
    ) -> Dict[int, float]:
        """
        Prédit la durée totale de chaque étape future (à partir de current_step+1).
        Retourne {step: estimated_duration}.
        """
        results = {}
        for step in range(current_step + 1, 10):
            active = active_users_by_step.get(step, 30)
            avg_dur = avg_durations_by_step.get(step, DEFAULT_DURATIONS[flight_type][step])
            # Pour les étapes futures, time_spent = 0
            mean_dur, _ = self.predict_step(
                step=step,
                airport=airport,
                flight_type=flight_type,
                hour_of_day=hour_of_day,
                time_spent_current_step=0.0,
                active_users_in_step=active,
                avg_step_duration=avg_dur,
            )
            results[step] = mean_dur
        return results

    def predict_full_journey(
        self,
        passenger_id: str,
        current_step: int,
        airport: str,
        flight_type: str,
        hour_of_day: int,
        time_spent_current_step: float,
        active_users_in_step: float,
        avg_step_duration: float,
        active_users_by_step: Optional[Dict[int, float]] = None,
        avg_durations_by_step: Optional[Dict[int, float]] = None,
    ) -> Dict:
        """
        Prédit le temps restant pour l'étape courante, les étapes futures,
        et le temps total restant du parcours.
        """
        # Étape courante
        mean_current, median_current = self.predict_step(
            step=current_step,
            airport=airport,
            flight_type=flight_type,
            hour_of_day=hour_of_day,
            time_spent_current_step=time_spent_current_step,
            active_users_in_step=active_users_in_step,
            avg_step_duration=avg_step_duration,
        )

        # Étapes futures
        if active_users_by_step is None:
            active_users_by_step = {s: 30 for s in range(1, 10)}
        if avg_durations_by_step is None:
            avg_durations_by_step = {s: DEFAULT_DURATIONS[flight_type][s] for s in range(1, 10)}

        future_steps = self.predict_future_steps(
            current_step=current_step,
            airport=airport,
            flight_type=flight_type,
            hour_of_day=hour_of_day,
            active_users_by_step=active_users_by_step,
            avg_durations_by_step=avg_durations_by_step,
        )

        total_remaining = mean_current + sum(future_steps.values())

        return {
            "passenger_id": passenger_id,
            "current_step": current_step,
            "current_step_name": STEP_NAMES.get(current_step, f"Step_{current_step}"),
            "time_spent_current_step": round(time_spent_current_step, 1),
            "remaining_current_step_mean": round(mean_current, 1),
            "remaining_current_step_median": round(median_current, 1),
            "future_steps": {
                STEP_NAMES.get(s, f"Step_{s}"): round(d, 1) for s, d in future_steps.items()
            },
            "total_remaining_minutes": round(total_remaining, 1),
            "airport": airport,
            "flight_type": flight_type,
            "hour_of_day": hour_of_day,
            "active_users_in_step": active_users_in_step,
        }
