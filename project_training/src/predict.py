import argparse
import sys
from pathlib import Path
import joblib
import pandas as pd

# Allow running as script from repo root
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.append(str(SCRIPT_DIR))

from utils import load_json, build_feature_vector, trapezoid_expectations

META_PATH = Path("data/processed/meta.json")
CHECKPOINT_DIR = Path("models/checkpoints")


def main():
    parser = argparse.ArgumentParser(description="Prédit le temps restant d'un passager pour une étape donnée")
    parser.add_argument("--model-type", type=str, default="cox", choices=["cox", "weibull"], help="Type de modèle")
    parser.add_argument("--step", type=int, required=True, help="Étape courante (1-9)")
    parser.add_argument("--airport", type=str, required=True, help="Code aéroport (ex: CDG)")
    parser.add_argument("--flight-type", type=str, required=True, choices=["domestic", "international"], help="Type de vol")
    parser.add_argument("--entry-time", type=str, required=True, help="Datetime ISO, ex: 2025-01-15T09:30:00")
    parser.add_argument("--time-spent", type=float, required=True, help="Minutes déjà passées dans l'étape")
    parser.add_argument("--active-users", type=float, required=True, help="Charge observée (passagers IN)")
    parser.add_argument("--avg-step-duration", type=float, required=True, help="Durée moyenne observée de l'étape")
    args = parser.parse_args()

    meta = load_json(META_PATH)
    ckpt_path = CHECKPOINT_DIR / f"{args.model_type}_step_{args.step}.pkl"
    if not ckpt_path.exists():
        raise FileNotFoundError(f"Modèle non trouvé: {ckpt_path}. Entraîner d'abord train_models.py")

    model = joblib.load(ckpt_path)

    # hour from entry_time
    hour = int(args.entry_time[11:13])

    X = build_feature_vector(
        meta=meta,
        airport=args.airport,
        flight_type=args.flight_type,
        hour_of_day=hour,
        time_spent_current_step=args.time_spent,
        active_users_in_step=args.active_users,
        avg_step_duration=args.avg_step_duration,
    )

    if args.model_type == "cox":
        surv = model.predict_survival_function(X)
        mean_surv, median_surv = trapezoid_expectations(surv)
        print(f"Step {args.step} | Cox | mean_remaining≈{mean_surv:.1f} min | median≈{median_surv:.1f} min")
    else:
        median_pred = float(model.predict_median(X))
        surv = model.predict_survival_function(X)
        mean_surv, _ = trapezoid_expectations(surv)
        print(f"Step {args.step} | Weibull | median_remaining≈{median_pred:.1f} min | mean≈{mean_surv:.1f} min")

    # For debug: show first values of survival curve
    print("Survival(t) head:")
    print(surv.head())


if __name__ == "__main__":
    main()
