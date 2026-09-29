from typing import Dict, Any, List


def calculate_sensor_health(
    station_id: str,
    station_name: str,
    anomaly_status: str,
    fault_type: str = None,
    recent_anomalies: List[Dict[str, Any]] = None,
    is_offline: bool = False
) -> Dict[str, Any]:
    """
    Computes Sensor Health Score (0-100) and Maintenance Risk.
    """
    if recent_anomalies is None:
        recent_anomalies = []

    score = 100.0
    fault_breakdown = {
        "spike": 0,
        "drift": 0,
        "frozen": 0,
        "missing": 0,
        "other": 0
    }

    # Count recent faults
    for a in recent_anomalies:
        ft = (a.get("fault_type") or "").upper()
        if "SPIKE" in ft:
            fault_breakdown["spike"] += 1
            score -= 6.0
        elif "DRIFT" in ft:
            fault_breakdown["drift"] += 1
            score -= 8.0
        elif "FROZEN" in ft:
            fault_breakdown["frozen"] += 1
            score -= 10.0
        elif "MISSING" in ft:
            fault_breakdown["missing"] += 1
            score -= 12.0
        else:
            fault_breakdown["other"] += 1
            score -= 4.0

    # Active status impact
    if is_offline:
        score -= 50.0
        fault_breakdown["missing"] += 1
    elif anomaly_status == "SENSOR FAULT":
        ft = (fault_type or "").upper()
        if "FROZEN" in ft:
            score -= 38.0
        elif "SPIKE" in ft:
            score -= 32.0
        elif "DRIFT" in ft:
            score -= 28.0
        else:
            score -= 25.0
    elif anomaly_status == "WEATHER EVENT":
        # Genuine weather events do NOT degrade sensor hardware health!
        # This is a core SIH requirement.
        score -= 0.0

    score = max(5.0, min(100.0, score))
    final_score = round(score, 1)

    if final_score >= 80.0:
        maintenance_risk = "LOW"
        status = "HEALTHY"
        recommendation = "Sensor telemetry nominal. Hardware operates within optimal tolerances."
    elif final_score >= 60.0:
        maintenance_risk = "MEDIUM"
        status = "DEGRADING"
        recommendation = "Telemetry variance detected. Schedule routine field inspection and calibration."
    else:
        maintenance_risk = "HIGH"
        status = "CRITICAL / FAULT"
        recommendation = "High failure probability. Immediate sensor replacement or transducer recalibration required."

    return {
        "station_id": station_id,
        "station_name": station_name,
        "health_score": final_score,
        "maintenance_risk": maintenance_risk,
        "status": status,
        "recommendation": recommendation,
        "anomaly_count": len(recent_anomalies),
        "fault_breakdown": fault_breakdown
    }
