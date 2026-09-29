import numpy as np
from typing import Dict, Any, Tuple


def calculate_multivariate_score(
    temperature: float,
    pressure: float,
    humidity: float,
    prev_temperature: float = None,
    prev_humidity: float = None
) -> Tuple[float, Dict[str, Any]]:
    """
    Evaluates physical consistency among Temperature, Pressure, and Relative Humidity.
    Returns (multivariate_anomaly_score [0..1], metrics).
    """
    reasons = []
    score = 0.0

    # 1. Physical range bounds
    if temperature < -10.0 or temperature > 52.0:
        score += 0.5
        reasons.append(f"Temperature ({temperature}°C) violates realistic regional limits (-10 to 52°C)")

    if pressure < 940.0 or pressure > 1050.0:
        score += 0.5
        reasons.append(f"Atmospheric pressure ({pressure} hPa) out of plausible boundary (940 to 1050 hPa)")

    if humidity < 0.0 or humidity > 100.0:
        score += 0.6
        reasons.append(f"Relative humidity ({humidity}%) out of physical range (0-100%)")

    # 2. Psychrometric coupling:
    # If temperature spiked abruptly (+10°C or more) but humidity remained identical (delta < 2%),
    # that is physically abnormal for an ambient air mass change.
    if prev_temperature is not None and prev_humidity is not None:
        delta_t = temperature - prev_temperature
        delta_rh = humidity - prev_humidity

        # If temperature spiked hugely (e.g. +20°C) with no corresponding humidity drop
        if delta_t > 15.0 and abs(delta_rh) < 5.0:
            score += 0.4
            reasons.append("Extreme thermal jump without expected psychrometric humidity adjustment")
        elif delta_t > 10.0 and delta_rh > 10.0:
            # Both temp and humidity spiking simultaneously without rain/front
            score += 0.25
            reasons.append("Uncorrelated simultaneous rise of extreme heat and high moisture")

    # 3. Combined multivariate baseline covariance:
    # Normal regional center: T ~ 32°C, P ~ 1008 hPa, RH ~ 62%
    # Normalized Euclidean distance in feature space:
    t_norm = (temperature - 32.0) / 6.0
    p_norm = (pressure - 1008.0) / 4.0
    rh_norm = (humidity - 62.0) / 15.0

    dist = np.sqrt(t_norm**2 + p_norm**2 + rh_norm**2)
    feature_space_score = min(1.0, float(dist / 4.0))

    final_score = float(np.clip(max(score, feature_space_score * 0.7), 0.0, 1.0))

    metrics = {
        "feature_distance": round(float(dist), 2),
        "physical_violations": reasons,
        "is_multivariate_inconsistent": bool(final_score > 0.45)
    }

    return final_score, metrics
