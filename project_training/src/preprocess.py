import argparse
import sys
from pathlib import Path
import pandas as pd

# Allow running as script from repo root
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.append(str(SCRIPT_DIR))

from utils import ensure_dirs, save_json

RAW_PATH = Path("data/raw/passengers_simulated.csv")
PROC_PATH = Path("data/processed/survival_dataset.csv")
META_PATH = Path("data/processed/meta.json")


def compute_hour(entry_time_str: str) -> int:
    # entry_time is isoformat string: YYYY-MM-DDTHH:MM
    return int(entry_time_str[11:13])


def main():
    parser = argparse.ArgumentParser(description="Prépare les données de survie (encodage one-hot)")
    parser.add_argument("--raw", type=str, default=str(RAW_PATH), help="Chemin du CSV brut")
    parser.add_argument("--out", type=str, default=str(PROC_PATH), help="Chemin du CSV préprocessé")
    parser.add_argument("--meta", type=str, default=str(META_PATH), help="Chemin du fichier meta JSON")
    args = parser.parse_args()

    raw_path = Path(args.raw)
    out_path = Path(args.out)
    meta_path = Path(args.meta)

    ensure_dirs([out_path.parent, meta_path.parent])

    df = pd.read_csv(raw_path)

    # hour_of_day
    df["hour_of_day"] = df["entry_time"].apply(compute_hour)

    # Base feature columns
    feature_cols = [
        "time_spent_current_step",
        "active_users_in_step",
        "avg_step_duration",
        "hour_of_day",
    ]

    # One-hot encode categorical with drop_first to avoid colinéarité (réduit le piège de somme=1)
    df = pd.get_dummies(
        df,
        columns=["flight_type", "airport"],
        prefix=["flight_type", "airport"],
        drop_first=True,
    )

    # Build final feature list after dummies (ensure deterministic order)
    dummy_cols = [c for c in df.columns if c.startswith("flight_type_") or c.startswith("airport_")]
    feature_cols = feature_cols + sorted(dummy_cols)

    target_cols = ["target_time_remaining", "event_observed", "current_step", "passenger_id", "entry_time"]
    final_cols = feature_cols + target_cols

    df = df[final_cols]

    df.to_csv(out_path, index=False)

    meta = {
        "feature_columns": feature_cols,
        "flight_type_columns": [c for c in dummy_cols if c.startswith("flight_type_")],
        "airport_columns": [c for c in dummy_cols if c.startswith("airport_")],
        "encoding_drop_first": True,
        "encoding_reference": {
            "flight_type": "first (alphabetical)",
            "airport": "first (alphabetical)",
        },
    }
    save_json(meta, meta_path)

    print(f"Préprocessing terminé. Sauvé: {out_path} (n={len(df)})")
    print(f"Colonnes de features: {feature_cols}")


if __name__ == "__main__":
    main()
