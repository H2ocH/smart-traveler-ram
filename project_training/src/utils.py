import json
from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd


def ensure_dirs(paths: List[Path]) -> None:
    """Create directories if they do not exist."""
    for p in paths:
        p.mkdir(parents=True, exist_ok=True)


def save_json(obj: Dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def load_json(path: Path) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def trapezoid_expectations(surv_df: pd.DataFrame) -> Tuple[float, float]:
    """
    Approximate mean and median survival from a survival function DataFrame (lifelines output).
    Returns (mean_minutes, median_minutes). Times assumed in same units as index (minutes here).
    """
    times = surv_df.index.values
    surv = surv_df.iloc[:, 0].values
    # Mean: area under survival curve (restricted mean)
    mean_val = float(np.trapz(surv, times))
    # Median: first time survival <= 0.5
    median_val = float(times[np.argmax(surv <= 0.5)]) if np.any(surv <= 0.5) else float(times[-1])
    return mean_val, median_val


def build_feature_vector(meta: Dict, airport: str, flight_type: str, hour_of_day: int,
                         time_spent_current_step: float, active_users_in_step: float,
                         avg_step_duration: float) -> pd.DataFrame:
    """Construct a single-row DataFrame aligned with training feature columns."""
    feature_cols = meta["feature_columns"]
    row = {col: 0.0 for col in feature_cols}
    row["time_spent_current_step"] = time_spent_current_step
    row["active_users_in_step"] = active_users_in_step
    row["avg_step_duration"] = avg_step_duration
    row["hour_of_day"] = hour_of_day
    ft_col = f"flight_type_{flight_type}"
    ap_col = f"airport_{airport}"
    if ft_col in row:
        row[ft_col] = 1.0
    if ap_col in row:
        row[ap_col] = 1.0
    return pd.DataFrame([row])[feature_cols]
