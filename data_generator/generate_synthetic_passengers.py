import argparse
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd

# Synthetic passenger journey generator tailored for survival analysis tasks.

domestic_airports = ["CDG", "ORY", "LYS", "NCE", "BOD"]
intl_airports = ["JFK", "LHR", "FRA", "AMS", "DXB", "MAD", "FCO"]
all_arrivals = domestic_airports + intl_airports
gates = [f"{g}{i}" for g in "ABCDEFGH" for i in range(1, 31)]
seat_letters = list("ABCDEF")
steps_order = [
    "Entree_Terminal",
    "Enregistrement",
    "Controle_Securite",
    "Controle_Passeport",
    "Duty_Free",
    "Porte_Embarquement",
    "Vol",
    "Recuperation_Bagages",
    "Sortie_Aeroport",
]


def lognorm_minutes(rng: np.random.Generator, mean: float, sigma: float = 0.35, min_val: float = 2.0) -> float:
    """Positive, right-skewed duration."""
    return max(min_val, rng.lognormal(np.log(mean), sigma))


def congestion_multiplier(ts: datetime, rng: np.random.Generator) -> float:
    hour = ts.hour
    dow = ts.weekday()
    peak = 1.3 if (6 <= hour <= 9) or (17 <= hour <= 20) else 1.0
    weekend = 1.1 if dow >= 5 else 1.0
    noise = rng.normal(1.0, 0.08)
    return max(0.85, min(1.8, peak * weekend * noise))


def format_duration(mins: float) -> str:
    return f"{int(round(mins))}m"


def make_passenger(idx: int, start_date: datetime, day_span: int, rng: np.random.Generator) -> dict:
    start_dt = start_date + timedelta(days=int(rng.integers(0, day_span)), minutes=int(rng.integers(5, 22 * 60)))
    dep_airport = rng.choice(domestic_airports)
    arr_airport = rng.choice([a for a in all_arrivals if a != dep_airport])
    is_intl = arr_airport not in domestic_airports
    gate = rng.choice(gates)
    flight_no = f"{rng.choice(['AF','TO','U2','KL','DL','EK'])}{rng.integers(100, 999)}"
    seat = f"{rng.integers(1, 41)}{rng.choice(seat_letters)}"

    c = congestion_multiplier(start_dt, rng)

    base = {
        "Entree_Terminal": 6,
        "Enregistrement": 12 if not is_intl else 16,
        "Controle_Securite": 18,
        "Controle_Passeport": 4 if not is_intl else 12,
        "Duty_Free": 18,
        "Porte_Embarquement": 25,
        "Vol": 80 if not is_intl else 420,
        "Recuperation_Bagages": 18 if not is_intl else 28,
        "Sortie_Aeroport": 8,
    }

    durations = {
        "Entree_Terminal": lognorm_minutes(rng, base["Entree_Terminal"] * c),
        "Enregistrement": lognorm_minutes(rng, base["Enregistrement"] * c),
        "Controle_Securite": lognorm_minutes(rng, base["Controle_Securite"] * c * 1.1),
        "Controle_Passeport": lognorm_minutes(rng, base["Controle_Passeport"] * c),
        "Duty_Free": lognorm_minutes(rng, base["Duty_Free"] * c * 1.05),
        "Porte_Embarquement": lognorm_minutes(rng, base["Porte_Embarquement"] * c),
        "Vol": lognorm_minutes(rng, base["Vol"], sigma=0.25, min_val=40 if is_intl else 30),
        "Recuperation_Bagages": lognorm_minutes(rng, base["Recuperation_Bagages"] * c),
        "Sortie_Aeroport": lognorm_minutes(rng, base["Sortie_Aeroport"] * c),
    }

    ground_before_flight = sum(durations[s] for s in steps_order if s not in {"Vol", "Recuperation_Bagages", "Sortie_Aeroport"})
    buffer_to_push = rng.uniform(10, 50)
    heure_decollage = start_dt + timedelta(minutes=ground_before_flight + buffer_to_push)
    heure_atterrissage = heure_decollage + timedelta(minutes=durations["Vol"])

    # Censure: 10-20% of passengers have an ongoing step.
    censored = rng.random() < rng.uniform(0.10, 0.20)
    step_c = rng.choice(steps_order) if censored else None
    step_values = {}

    for step in steps_order:
        d = durations[step]
        if step_c and step == step_c:
            prog = max(1, int(d * rng.uniform(0.25, 0.85)))
            step_values[step] = f"IN ({prog}m)"
        elif step_c and steps_order.index(step) > steps_order.index(step_c):
            step_values[step] = ""
        else:
            step_values[step] = format_duration(d)

    return {
        "Passager_ID": f"P{idx:05d}",
        "Date_Heure_Debut_Parcours": start_dt,
        "Vol": flight_no,
        "Siege": seat,
        "Porte": gate,
        "Aeroport_Depart": dep_airport,
        "Aeroport_Arrivee": arr_airport,
        "Heure_Decollage": heure_decollage,
        "Heure_Atterrissage": heure_atterrissage,
        **step_values,
    }


def generate_dataset(n: int, seed: int, start_date: datetime, day_span: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = [make_passenger(i, start_date, day_span, rng) for i in range(1, n + 1)]
    return pd.DataFrame(rows)


def main():
    parser = argparse.ArgumentParser(description="Génère un dataset synthétique de parcours passagers (survival-ready)")
    parser.add_argument("--n", type=int, default=1200, help="Nombre de passagers à générer")
    parser.add_argument("--seed", type=int, default=42, help="Graine aléatoire")
    parser.add_argument("--start-date", type=str, default="2025-01-01", help="Date de début (YYYY-MM-DD)")
    parser.add_argument("--days", type=int, default=30, help="Fenêtre de jours pour échantillonner les départs")
    parser.add_argument("--out", type=str, default="data/passagers_survie_synthetique.csv", help="Chemin de sortie CSV")
    args = parser.parse_args()

    start_date = datetime.fromisoformat(args.start_date)
    df = generate_dataset(args.n, args.seed, start_date, args.days)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"OK - {len(df)} lignes écrites dans {out_path}")
    print(df.head())


if __name__ == "__main__":
    main()
