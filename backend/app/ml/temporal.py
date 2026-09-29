import numpy as np
from typing import List, Dict, Any, Tuple


def calculate_temporal_score(
    current_value: float,
    recent_history: List[float],
    param_type: str = "temperature"
) -> Tuple[float, Dict[str, Any]]:
    """
    Evaluates temporal consistency against recent readings.
    Returns (temporal_anomaly_score [0..1], metrics_dict).
    """
    if not recent_history or len(recent_history) < 2:
        return 0.0, {"rate_of_change": 0.0, "z_score": 0.0, "mean": current_value}

    history_arr = np.array(recent_history)
    prev_value = history_arr[-1]
    step_delta = abs(current_value - prev_value)

    mean_val = float(np.mean(history_arr))
    std_val = float(np.std(history_arr))
    if std_val < 0.2:
        std_val = 0.5  # Prevent division by tiny variance

    z_score = abs(current_value - mean_val) / std_val

    # Thresholds based on parameter
    # For temperature: normal max step change is ~1.5 - 2.5°C
    if param_type == "temperature":
        max_normal_step = 3.0
        max_normal_z = 3.0
    elif param_type == "pressure":
        max_normal_step = 2.0
        max_normal_z = 3.0
    else:  # humidity
        max_normal_step = 10.0
        max_normal_z = 3.0

    # Step anomaly ratio
    step_score = min(1.0, step_delta / (max_normal_step * 3))
    z_score_norm = min(1.0, z_score / (max_normal_z * 2.5))

    # Composite temporal score
    temporal_score = 0.6 * step_score + 0.4 * z_score_norm

    metrics = {
        "step_delta": round(float(step_delta), 2),
        "z_score": round(float(z_score), 2),
        "recent_mean": round(mean_val, 2),
        "recent_std": round(std_val, 2),
        "is_temporal_anomaly": bool(temporal_score > 0.45 or step_delta > max_normal_step * 2)
    }

    return float(np.clip(temporal_score, 0.0, 1.0)), metrics
