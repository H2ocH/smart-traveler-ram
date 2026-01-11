import argparse
import sys
from pathlib import Path
import joblib
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from lifelines import CoxPHFitter, WeibullAFTFitter
from lifelines.utils import concordance_index

# Allow running as script from repo root
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.append(str(SCRIPT_DIR))

from utils import ensure_dirs, load_json

PROC_PATH = Path("data/processed/survival_dataset.csv")
META_PATH = Path("data/processed/meta.json")
CHECKPOINT_DIR = Path("models/checkpoints")
PLOTS_DIR = Path("outputs/plots")
METRICS_PATH = Path("outputs/metrics.txt")


def fit_and_eval(model_type: str, df_step: pd.DataFrame, feature_cols):
    duration_col = "target_time_remaining"
    event_col = "event_observed"

    data = df_step[feature_cols + [duration_col, event_col]].copy()
    # Small ridge penalty to handle mild collinearity / singularity
    # and standardize columns for Cox if needed
    penalizer = 0.1

    if model_type == "cox":
        model = CoxPHFitter(penalizer=penalizer)
    elif model_type == "weibull":
        model = WeibullAFTFitter(penalizer=penalizer)
    else:
        raise ValueError("model_type must be 'cox' or 'weibull'")

    model.fit(data, duration_col=duration_col, event_col=event_col)

    if model_type == "cox":
        risk_scores = model.predict_partial_hazard(df_step[feature_cols])
    else:
        # Lower median => higher risk; negate for concordance ordering
        med_pred = model.predict_median(df_step[feature_cols])
        risk_scores = -med_pred

    c_index = concordance_index(df_step[duration_col], risk_scores, df_step[event_col])
    log_lik = float(model.log_likelihood_)

    return model, c_index, log_lik


def plot_survival(model, df_features: pd.DataFrame, step: int, path: Path):
    # Use the average feature vector as a reference curve
    ref_row = df_features.mean().to_frame().T
    surv = model.predict_survival_function(ref_row)

    plt.figure(figsize=(6, 4))
    sns.lineplot(x=surv.index, y=surv.iloc[:, 0])
    plt.xlabel("Minutes")
    plt.ylabel("Survival probability")
    plt.title(f"Step {step} survival curve")
    plt.tight_layout()
    ensure_dirs([path.parent])
    plt.savefig(path)
    plt.close()


def main():
    parser = argparse.ArgumentParser(description="Entraîne des modèles de survie par étape")
    parser.add_argument("--data", type=str, default=str(PROC_PATH), help="Chemin du CSV préprocessé")
    parser.add_argument("--meta", type=str, default=str(META_PATH), help="Chemin du fichier meta JSON")
    parser.add_argument("--model-type", type=str, default="cox", choices=["cox", "weibull"], help="Type de modèle")
    args = parser.parse_args()

    data_path = Path(args.data)
    meta_path = Path(args.meta)

    df = pd.read_csv(data_path)
    meta = load_json(meta_path)
    feature_cols = list(meta["feature_columns"])

    ensure_dirs([CHECKPOINT_DIR, PLOTS_DIR, METRICS_PATH.parent])

    lines = []

    for step in range(1, 10):
        df_step = df[df["current_step"] == step].reset_index(drop=True)
        if len(df_step) < 30:
            print(f"Step {step}: not enough data ({len(df_step)}) -> skipped")
            continue

        model, c_index, log_lik = fit_and_eval(args.model_type, df_step, feature_cols)

        ckpt_path = CHECKPOINT_DIR / f"{args.model_type}_step_{step}.pkl"
        joblib.dump(model, ckpt_path)

        plot_path = PLOTS_DIR / f"step_{step}_survival.png"
        plot_survival(model, df_step[feature_cols], step, plot_path)

        line = f"step={step}\tmodel={args.model_type}\tc_index={c_index:.4f}\tlog_lik={log_lik:.2f}\tn={len(df_step)}"
        lines.append(line)
        print(line)

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Metrics saved to {METRICS_PATH}")


if __name__ == "__main__":
    main()
