import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd

# Allow running as script from repo root
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.append(str(SCRIPT_DIR))

from utils import ensure_dirs

# Synthetic data generator for survival analysis on airport passenger steps.

DOMESTIC = ["CDG", "ORY", "LYS", "NCE", "BOD"]
INTERNATIONAL = ["JFK", "LHR", "FRA", "AMS", "DXB", "MAD", "FCO"]
AIRPORTS = DOMESTIC + INTERNATIONAL

STEP_WEIGHTS = [0.15, 0.14, 0.18, 0.10, 0.14, 0.12, 0.07, 0.06, 0.04]  # Steps 1..9

BASE_MEANS = {
    "domestic": {
        1: 6,   # Entree_Terminal
        2: 12,  # Enregistrement
        3: 18,  # Controle_Securite
        4: 4,   # Controle_Passeport (court en domestique)
        5: 18,  # Duty_Free
        6: 25,  # Porte_Embarquement
        7: 80,  # Vol
        8: 18,  # Recuperation_Bagages
        9: 8,   # Sortie_Aeroport
    },
    "international": {
        1: 7,
        2: 16,
        3: 20,
        4: 12,  # Passeport plus long
        5: 19,
        6: 27,
        7: 420,
        8: 28,
        9: 9,
    },
}

BASE_LOAD = {
    1: 25,
    2: 18,
    3: 40,
    4: 22,
    5: 35,
    6: 30,
    7: 80,
    8: 28,
    9: 20,
}


def lognorm_minutes(rng: np.random.Generator, mean: float, sigma: float = 0.35, min_val: float = 1.0) -> float:
    return max(min_val, rng.lognormal(np.log(mean), sigma))


def congestion_multiplier(ts: datetime, rng: np.random.Generator) -> float:
    hour = ts.hour
    dow = ts.weekday()
    peak = 1.25 if (6 <= hour <= 9) or (17 <= hour <= 20) else 1.0
    weekend = 1.1 if dow >= 5 else 1.0
    noise = rng.normal(1.0, 0.08)
    return max(0.85, min(1.8, peak * weekend * noise))


def generate_row(idx: int, start_date: datetime, day_span: int, rng: np.random.Generator) -> dict:
    entry_time = start_date + timedelta(days=int(rng.integers(0, day_span)), minutes=int(rng.integers(0, 24 * 60)))
    airport = rng.choice(AIRPORTS)
    flight_type = "domestic" if airport in DOMESTIC else "international"
    current_step = int(rng.choice(range(1, 10), p=STEP_WEIGHTS))

    c = congestion_multiplier(entry_time, rng)
    base_mean = BASE_MEANS[flight_type][current_step] * c
    true_duration = lognorm_minutes(rng, base_mean, sigma=0.4, min_val=2)

    # time spent already in current step
    spent_ratio = float(rng.uniform(0.05, 0.95))
    time_spent = max(0.5, spent_ratio * true_duration)

    # Determine event vs censoring
    censored = rng.random() < rng.uniform(0.10, 0.20)  # 10-20% censored
    if censored:
        remaining = max(0.5, true_duration - time_spent)
        # follow-up shorter than remaining -> right-censoring
        follow_up = max(0.5, remaining * rng.uniform(0.3, 0.8))
        target_time_remaining = follow_up
        event_observed = 0
    else:
        remaining = max(0.5, true_duration - time_spent)
        target_time_remaining = remaining
        event_observed = 1

    # Active users reflects congestion and step popularity
    lam = BASE_LOAD[current_step] * c
    active_users_in_step = int(rng.poisson(lam=lam))

    # Average step duration context (approx population mean around base_mean)
    avg_step_duration = lognorm_minutes(rng, mean=base_mean, sigma=0.2, min_val=2)

    return {
        "passenger_id": f"P{idx:05d}",
        "airport": airport,
        "flight_type": flight_type,
        "entry_time": entry_time.isoformat(timespec="minutes"),
        "current_step": current_step,
        "time_spent_current_step": round(time_spent, 2),
        "active_users_in_step": active_users_in_step,
        "avg_step_duration": round(avg_step_duration, 2),
        "target_time_remaining": round(target_time_remaining, 2),
        "event_observed": event_observed,
    }


def main():
    parser = argparse.ArgumentParser(description="Génère des données synthétiques pour survie (parcours passager)")
    parser.add_argument("--n", type=int, default=3000, help="Nombre de lignes à générer")
    parser.add_argument("--seed", type=int, default=42, help="Graine aléatoire")
    parser.add_argument("--start-date", type=str, default="2025-01-01", help="Date de départ (YYYY-MM-DD)")
    parser.add_argument("--days", type=int, default=30, help="Fenêtre de jours pour l'échantillonnage")
    parser.add_argument("--out", type=str, default=str(Path("data/raw/passengers_simulated.csv")), help="Chemin du CSV de sortie")
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)
    start_date = datetime.fromisoformat(args.start_date)

    out_path = Path(args.out)
    ensure_dirs([out_path.parent])

    rows = [generate_row(i, start_date, args.days, rng) for i in range(1, args.n + 1)]
    df = pd.DataFrame(rows)
    df.to_csv(out_path, index=False)
    print(f"OK - {len(df)} lignes écrites dans {out_path}")
    print(df.head())


if __name__ == "__main__":
    main()
