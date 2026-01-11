"""
Module temps réel pour la synchronisation avec le dashboard.
Lit l'état courant des passagers, prédit les temps restants, et retourne du JSON.

Usage:
  python src/realtime.py --input data/dashboard_state.json --output outputs/predictions.json
  python src/realtime.py --watch --input data/dashboard_state.json --interval 5
"""
import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.append(str(SCRIPT_DIR))

from predictor import JourneyPredictor, STEP_NAMES, DEFAULT_DURATIONS


def load_dashboard_state(path: Path) -> Dict:
    """
    Charge l'état du dashboard depuis un fichier JSON.
    Format attendu:
    {
      "timestamp": "2025-01-15T09:30:00",
      "active_users_by_step": {1: 25, 2: 18, ...},
      "avg_durations_by_step": {1: 6, 2: 12, ...},
      "passengers": [
        {
          "passenger_id": "P00001",
          "current_step": 3,
          "airport": "CDG",
          "flight_type": "international",
          "entry_time": "2025-01-15T07:30:00",
          "time_spent_current_step": 12.5,
          "active_users_in_step": 35,
          "avg_step_duration": 20
        },
        ...
      ]
    }
    """
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_predictions(predictions: Dict, path: Path):
    """Sauvegarde les prédictions en JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(predictions, f, indent=2, ensure_ascii=False)


def extract_hour(entry_time: str) -> int:
    """Extrait l'heure depuis une chaîne ISO datetime."""
    try:
        return int(entry_time[11:13])
    except (IndexError, ValueError):
        return datetime.now().hour


def run_predictions(predictor: JourneyPredictor, state: Dict) -> Dict:
    """
    Exécute les prédictions pour tous les passagers du dashboard.
    Retourne un dictionnaire JSON-serializable.
    """
    passengers = state.get("passengers", [])
    active_users_by_step = state.get("active_users_by_step", {})
    avg_durations_by_step = state.get("avg_durations_by_step", {})
    timestamp = state.get("timestamp", datetime.now().isoformat())

    # Convertir les clés en int si elles sont des strings (JSON)
    active_users_by_step = {int(k): v for k, v in active_users_by_step.items()}
    avg_durations_by_step = {int(k): v for k, v in avg_durations_by_step.items()}

    results = []
    for p in passengers:
        passenger_id = p.get("passenger_id", "unknown")
        current_step = p.get("current_step", 1)
        airport = p.get("airport", "CDG")
        flight_type = p.get("flight_type", "domestic")
        entry_time = p.get("entry_time", "")
        hour_of_day = extract_hour(entry_time) if entry_time else datetime.now().hour
        time_spent = p.get("time_spent_current_step", 0.0)
        active_in_step = p.get("active_users_in_step", active_users_by_step.get(current_step, 30))
        avg_dur = p.get("avg_step_duration", avg_durations_by_step.get(current_step, 15))

        pred = predictor.predict_full_journey(
            passenger_id=passenger_id,
            current_step=current_step,
            airport=airport,
            flight_type=flight_type,
            hour_of_day=hour_of_day,
            time_spent_current_step=time_spent,
            active_users_in_step=active_in_step,
            avg_step_duration=avg_dur,
            active_users_by_step=active_users_by_step,
            avg_durations_by_step=avg_durations_by_step,
        )
        results.append(pred)

    # Statistiques globales
    total_passengers = len(results)
    avg_total_remaining = sum(r["total_remaining_minutes"] for r in results) / max(1, total_passengers)
    by_step_count = {}
    for r in results:
        s = r["current_step"]
        by_step_count[s] = by_step_count.get(s, 0) + 1

    return {
        "timestamp": timestamp,
        "prediction_time": datetime.now().isoformat(),
        "model_type": predictor.model_type,
        "total_passengers": total_passengers,
        "avg_total_remaining_minutes": round(avg_total_remaining, 1),
        "passengers_by_step": {STEP_NAMES.get(k, f"Step_{k}"): v for k, v in sorted(by_step_count.items())},
        "predictions": results,
    }


def main():
    parser = argparse.ArgumentParser(description="Prédictions temps réel pour le dashboard")
    parser.add_argument("--input", type=str, default="data/dashboard_state.json", help="Fichier JSON d'entrée (état dashboard)")
    parser.add_argument("--output", type=str, default="outputs/predictions.json", help="Fichier JSON de sortie")
    parser.add_argument("--model-type", type=str, default="cox", choices=["cox", "weibull"], help="Type de modèle")
    parser.add_argument("--watch", action="store_true", help="Mode surveillance continue")
    parser.add_argument("--interval", type=int, default=5, help="Intervalle de rafraîchissement en secondes (mode watch)")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    print(f"Chargement des modèles ({args.model_type})...")
    predictor = JourneyPredictor(model_type=args.model_type)
    print(f"Modèles chargés: {list(predictor.models.keys())}")

    if args.watch:
        print(f"Mode surveillance: lecture de {input_path} toutes les {args.interval}s. Ctrl+C pour arrêter.")
        try:
            while True:
                if input_path.exists():
                    state = load_dashboard_state(input_path)
                    predictions = run_predictions(predictor, state)
                    save_predictions(predictions, output_path)
                    print(f"[{predictions['prediction_time']}] {predictions['total_passengers']} passagers, avg_remaining={predictions['avg_total_remaining_minutes']} min")
                else:
                    print(f"Fichier {input_path} introuvable, attente...")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nArrêt du mode surveillance.")
    else:
        if not input_path.exists():
            print(f"Erreur: fichier {input_path} introuvable.")
            sys.exit(1)
        state = load_dashboard_state(input_path)
        predictions = run_predictions(predictor, state)
        save_predictions(predictions, output_path)
        print(f"Prédictions sauvegardées dans {output_path}")
        print(f"Total passagers: {predictions['total_passengers']}")
        print(f"Temps restant moyen: {predictions['avg_total_remaining_minutes']} min")


if __name__ == "__main__":
    main()
