import numpy as np
from typing import List, Dict, Any, Tuple


def check_frozen_sensor(readings: List[float], min_samples: int = 5) -> Tuple[bool, float, Dict[str, Any]]:
    """
    Checks if sensor readings are frozen (constant or negligible variation).
    Returns (is_frozen, score [0..1], details).
    """
    if len(readings) < min_samples:
        return False, 0.0, {"reason": "Insufficient samples"}

    recent = readings[-min_samples:]
    std_val = float(np.std(recent))
    ptp_val = float(np.ptp(recent))  # peak to peak (max - min)

    # If peak-to-peak difference is less than 0.05 over 5+ readings, it's frozen
    is_frozen = ptp_val <= 0.05
    score = 1.0 if is_frozen else 0.0

    return is_frozen, score, {
        "recent_samples": recent,
        "peak_to_peak": round(ptp_val, 4),
        "std_dev": round(std_val, 4),
        "is_frozen": is_frozen
    }


def check_sensor_drift(
    readings: List[float],
    min_samples: int = 5,
    drift_slope_thresh: float = 0.5
) -> Tuple[bool, float, Dict[str, Any]]:
    """
    Checks for monotonic or linear sensor drift away from baseline.
    Returns (is_drifting, score [0..1], details).
    """
    if len(readings) < min_samples:
        return False, 0.0, {"reason": "Insufficient samples"}

    recent = readings[-min_samples:]
    x = np.arange(len(recent))
    y = np.array(recent)

    # Linear fit
    slope, intercept = np.polyfit(x, y, 1)
    # Correlation coefficient
    r_matrix = np.corrcoef(x, y)
    r_val = r_matrix[0, 1] if not np.isnan(r_matrix[0, 1]) else 0.0

    # Drift occurs when slope is significant (>0.4°C per step) and strongly linear (|r| > 0.90)
    is_drifting = abs(slope) >= drift_slope_thresh and abs(r_val) >= 0.88
    drift_score = min(1.0, (abs(slope) / 1.5) * abs(r_val)) if is_drifting else 0.0

    return bool(is_drifting), float(drift_score), {
        "slope": round(float(slope), 3),
        "r_correlation": round(float(r_val), 3),
        "total_drift_range": round(float(recent[-1] - recent[0]), 2),
        "is_drifting": bool(is_drifting)
    }


def check_sudden_spike(
    current: float,
    previous: float,
    threshold: float = 12.0
) -> Tuple[bool, float, Dict[str, Any]]:
    """
    Checks for sudden 1-step unphysical spike.
    """
    delta = abs(current - previous)
    is_spike = delta >= threshold
    spike_score = min(1.0, delta / (threshold * 2.0)) if is_spike else 0.0

    return bool(is_spike), float(spike_score), {
        "step_delta": round(float(delta), 2),
        "threshold": threshold,
        "is_spike": bool(is_spike)
    }
