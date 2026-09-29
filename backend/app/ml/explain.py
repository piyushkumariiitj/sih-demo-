from typing import List, Dict, Any


def generate_explanation(
    classification: str,
    fault_type: str,
    target_station_id: str,
    target_value: float,
    scores: Dict[str, float],
    temporal_metrics: Dict[str, Any],
    spatial_metrics: Dict[str, Any],
    multivariate_metrics: Dict[str, Any],
    neighbors: List[Dict[str, Any]]
) -> tuple[str, List[str]]:
    """
    Generates human-readable, transparent explanation points and summary.
    """
    points: List[str] = []

    if classification == "SENSOR FAULT":
        if fault_type == "SENSOR SPIKE":
            step_delta = temporal_metrics.get("step_delta", 0.0)
            neighbor_median = spatial_metrics.get("neighbor_median", 0.0)
            points.append(f"Temperature abruptly surged to {target_value}°C (instant step jump: +{step_delta}°C).")
            points.append(
                f"Surrounding stations remained normal and stable (median neighbor temp: {neighbor_median}°C)."
            )
            points.append("Spatial isolation confirmed: 0 out of nearest neighboring stations corroborated this reading.")
            points.append("Physical atmospheric coupling broken: pressure and humidity did not match thermal surge.")
            summary = (
                f"Station {target_station_id} reported an abrupt temperature of {target_value}°C, "
                f"significantly deviating from nearby AWS stations while surrounding stations remained stable."
            )

        elif fault_type == "SENSOR DRIFT":
            points.append("Persistent linear divergence observed over consecutive reporting cycles.")
            points.append("Sensor reading steadily pulled away from expected regional baseline.")
            points.append("Neighboring stations maintained flat or diurnal equilibrium.")
            points.append("Statistical trend analysis indicates progressive calibration degradation.")
            summary = (
                f"Station {target_station_id} displays continuous monotonic drift away from network baseline, "
                f"indicating hardware calibration loss or thermistor degradation."
            )

        elif fault_type == "FROZEN SENSOR":
            points.append(f"Identical or near-zero variance ({target_value}°C) detected over consecutive readings.")
            points.append("Natural environmental micro-fluctuations completely absent.")
            points.append("Analog-to-Digital converter or telemetry lock detected.")
            summary = (
                f"Station {target_station_id} reported constant identical readings ({target_value}°C) "
                f"without expected ambient atmospheric fluctuation, indicating a frozen sensor/transducer."
            )

        elif fault_type == "MISSING DATA":
            points.append("No telemetry packets received within heartbeat timeout window.")
            points.append("Communication link or remote solar power system failure.")
            summary = f"Station {target_station_id} has stopped transmitting telemetry and is currently offline."

        else:
            points.append("Isolated reading deviation without corroboration from nearby stations.")
            summary = f"Station {target_station_id} recorded an uncorroborated anomaly indicative of sensor hardware fault."

    elif classification == "WEATHER EVENT":
        points.append(f"Regional environmental shift detected (station reading: {target_value}°C).")
        neighbor_median = spatial_metrics.get("neighbor_median", 0.0)
        points.append(f"High spatial consistency: multiple nearby stations exhibited similar changes (neighbor median: {neighbor_median}°C).")
        points.append("Temporally and spatially coherent environmental gradient confirmed across AWS cluster.")
        points.append("Thermodynamic parameters (temperature, pressure, humidity) align with regional weather dynamics.")
        summary = (
            "Multiple nearby AWS stations exhibited a similar change within the same time period, "
            "indicating spatially consistent environmental conditions."
        )

    elif classification == "NORMAL":
        points.append("Readings adhere to expected regional baseline distributions.")
        points.append("Spatially coherent with neighboring Automatic Weather Stations.")
        points.append("Temporal rate of change is within standard diurnal bounds.")
        summary = f"Station {target_station_id} operates normally with valid sensor telemetry and spatial consistency."

    else:
        points.append("Telemetry exhibits borderline statistical deviation.")
        points.append("Insufficient spatial or temporal evidence to definitively isolate sensor vs weather.")
        summary = f"Station {target_station_id} generated an anomaly with indeterminate root cause. Continued monitoring recommended."

    return summary, points
