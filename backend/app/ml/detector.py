import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from sklearn.ensemble import IsolationForest

from app.ml.temporal import calculate_temporal_score
from app.ml.spatial import calculate_spatial_score
from app.ml.multivariate import calculate_multivariate_score
from app.ml.sensor_checks import check_frozen_sensor, check_sensor_drift, check_sudden_spike
from app.ml.explain import generate_explanation


class SkyGuardAnomalyDetector:
    def __init__(self):
        self.iforest = IsolationForest(
            n_estimators=50,
            contamination=0.08,
            random_state=42
        )
        self._init_baseline_model()

    def _init_baseline_model(self):
        """Fit Isolation Forest on synthetic normal AWS baseline data."""
        np.random.seed(42)
        # Features: [temperature, pressure, humidity, delta_temp, spatial_diff]
        n_samples = 400
        normal_t = np.random.normal(31.5, 2.0, n_samples)
        normal_p = np.random.normal(1008.0, 3.0, n_samples)
        normal_rh = np.random.normal(63.0, 6.0, n_samples)
        normal_dt = np.random.normal(0.2, 0.4, n_samples)
        normal_sd = np.random.normal(0.6, 0.5, n_samples)

        X_normal = np.column_stack([normal_t, normal_p, normal_rh, normal_dt, normal_sd])
        self.iforest.fit(X_normal)

    def analyze_station(
        self,
        station_id: str,
        current_reading: Optional[Dict[str, Any]],
        reading_history: List[Dict[str, Any]],
        all_stations: List[Dict[str, Any]],
        is_simulated_offline: bool = False
    ) -> Dict[str, Any]:
        """
        Complete DETECT -> DIFFERENTIATE -> EXPLAIN pipeline for a station.
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Check for Missing Data / Offline
        if is_simulated_offline or current_reading is None:
            summary, points = generate_explanation(
                classification="SENSOR FAULT",
                fault_type="MISSING DATA",
                target_station_id=station_id,
                target_value=0.0,
                scores={"temporal": 1.0, "spatial": 1.0, "multivariate": 1.0, "sensor": 1.0, "iforest": 1.0},
                temporal_metrics={},
                spatial_metrics={},
                multivariate_metrics={},
                neighbors=[]
            )
            return {
                "station_id": station_id,
                "timestamp": now_str,
                "is_anomaly": True,
                "classification": "SENSOR FAULT",
                "fault_type": "MISSING DATA",
                "confidence": 96.0,
                "severity": "HIGH",
                "anomaly_score": 1.0,
                "scores": {
                    "temporal": 1.0,
                    "spatial": 1.0,
                    "multivariate": 1.0,
                    "sensor": 1.0,
                    "iforest": 1.0
                },
                "explanation": summary,
                "explanation_points": points,
                "nearby_comparison": []
            }

        temp = float(current_reading.get("temperature", 31.0))
        pres = float(current_reading.get("pressure", 1008.0))
        hum = float(current_reading.get("humidity", 62.0))

        temp_history = [float(r["temperature"]) for r in reading_history if "temperature" in r and r["temperature"] is not None]
        hum_history = [float(r["humidity"]) for r in reading_history if "humidity" in r and r["humidity"] is not None]

        prev_temp = temp_history[-2] if len(temp_history) >= 2 else temp
        prev_hum = hum_history[-2] if len(hum_history) >= 2 else hum

        # 2. Check Frozen Sensor
        is_frozen, frozen_score, frozen_details = check_frozen_sensor(temp_history, min_samples=5)
        if is_frozen:
            summary, points = generate_explanation(
                classification="SENSOR FAULT",
                fault_type="FROZEN SENSOR",
                target_station_id=station_id,
                target_value=temp,
                scores={"sensor": 1.0},
                temporal_metrics={"step_delta": 0.0},
                spatial_metrics={},
                multivariate_metrics={},
                neighbors=[]
            )
            return {
                "station_id": station_id,
                "timestamp": now_str,
                "is_anomaly": True,
                "classification": "SENSOR FAULT",
                "fault_type": "FROZEN SENSOR",
                "confidence": 98.0,
                "severity": "HIGH",
                "anomaly_score": 0.95,
                "scores": {
                    "temporal": 0.1,
                    "spatial": 0.2,
                    "multivariate": 0.2,
                    "sensor": 1.0,
                    "iforest": 0.8
                },
                "explanation": summary,
                "explanation_points": points,
                "nearby_comparison": []
            }

        # 3. Check Sensor Drift
        is_drifting, drift_score, drift_details = check_sensor_drift(temp_history, min_samples=5)

        # 4. Check Sudden Spike
        is_spike, spike_score, spike_details = check_sudden_spike(temp, prev_temp, threshold=10.0)

        # 5. Temporal Analysis
        temporal_score, temporal_metrics = calculate_temporal_score(temp, temp_history, "temperature")

        # 6. Spatial Analysis
        target_station_dict = {
            "station_id": station_id,
            "temperature": temp,
            "pressure": pres,
            "humidity": hum
        }
        spatial_dev_score, spatial_consistency, neighbors, spatial_metrics = calculate_spatial_score(
            target_station_dict, all_stations, param="temperature", k=4
        )

        # 7. Multivariate Analysis
        mv_score, mv_metrics = calculate_multivariate_score(temp, pres, hum, prev_temp, prev_hum)

        # 8. Isolation Forest Feature Assessment
        dt_val = abs(temp - prev_temp)
        sd_val = spatial_metrics.get("absolute_spatial_diff", 0.5)
        feature_vec = np.array([[temp, pres, hum, dt_val, sd_val]])
        raw_iforest_score = float(-self.iforest.score_samples(feature_vec)[0])
        # Normalize roughly [0.35..0.75] -> [0..1]
        iforest_norm = float(np.clip((raw_iforest_score - 0.40) / 0.35, 0.0, 1.0))

        # 9. Behavior composite
        sensor_behavior_score = max(drift_score, spike_score)

        # 10. Composite Anomaly Score Fusion
        # Weights: temporal (0.20), spatial_dev (0.35), multivariate (0.20), sensor (0.15), iforest (0.10)
        composite_score = (
            0.20 * temporal_score +
            0.35 * spatial_dev_score +
            0.20 * mv_score +
            0.15 * sensor_behavior_score +
            0.10 * iforest_norm
        )
        composite_score = float(np.clip(composite_score, 0.0, 1.0))

        scores_dict = {
            "temporal": round(temporal_score, 2),
            "spatial": round(spatial_dev_score, 2),
            "multivariate": round(mv_score, 2),
            "sensor": round(sensor_behavior_score, 2),
            "iforest": round(iforest_norm, 2),
            "composite": round(composite_score, 2)
        }

        # Regional baseline evaluation
        baseline_temp = 31.5
        target_baseline_delta = abs(temp - baseline_temp)
        neighbor_median = spatial_metrics.get("neighbor_median", temp)
        neighbor_baseline_delta = abs(neighbor_median - baseline_temp)

        # A regional weather shift condition:
        # Both target and surrounding cluster shifted away from regional baseline together,
        # and spatial consistency is high while spatial deviation is low.
        is_regional_weather_shift = (
            target_baseline_delta >= 3.0 and
            neighbor_baseline_delta >= 2.5 and
            spatial_dev_score <= 0.38 and
            spatial_consistency >= 0.65
        )

        # 11. Classification Rules (Differentiate Weather Event vs Sensor Fault)
        is_anomaly = False
        classification = "NORMAL"
        fault_type = None
        confidence = 0.0
        severity = "NONE"

        # Check conditions
        if is_spike or (spatial_dev_score > 0.65 and spatial_consistency < 0.35):
            # Classic sensor spike: target is way off, neighbors stable
            is_anomaly = True
            classification = "SENSOR FAULT"
            fault_type = "SENSOR SPIKE"
            severity = "HIGH" if temp > 48.0 or abs(temp - prev_temp) > 15.0 else "MEDIUM"
            confidence = round(min(98.0, 88.0 + spatial_dev_score * 8.0 + spike_score * 4.0), 1)

        elif is_drifting and spatial_consistency < 0.40:
            # Monotonic drift isolated to this station
            is_anomaly = True
            classification = "SENSOR FAULT"
            fault_type = "SENSOR DRIFT"
            severity = "HIGH" if drift_score > 0.7 else "MEDIUM"
            confidence = round(min(95.0, 84.0 + drift_score * 10.0), 1)

        elif is_regional_weather_shift:
            # Regional weather event detected across AWS cluster
            is_anomaly = True
            classification = "WEATHER EVENT"
            fault_type = "REGIONAL WEATHER SHIFT"
            confidence = round(min(96.0, 88.0 + spatial_consistency * 8.0), 1)
            severity = "HIGH" if target_baseline_delta > 5.5 else "MEDIUM"
            composite_score = max(composite_score, 0.62)

        elif composite_score > 0.35:
            is_anomaly = True
            # Differentiate: Do neighbors also corroborate the shift?
            if spatial_consistency >= 0.65 and spatial_metrics.get("neighbor_count", 0) >= 2:
                classification = "WEATHER EVENT"
                fault_type = "REGIONAL WEATHER SHIFT"
                confidence = round(min(97.0, 85.0 + spatial_consistency * 10.0), 1)
                severity = "HIGH" if abs(temp - 31.0) > 6.0 else "MEDIUM"
            elif spatial_dev_score >= 0.50:
                classification = "SENSOR FAULT"
                fault_type = "ISOLATED SENSOR FAULT"
                confidence = round(min(96.0, 82.0 + spatial_dev_score * 12.0), 1)
                severity = "HIGH"
            else:
                classification = "UNKNOWN ANOMALY"
                fault_type = "AMBIGUOUS ANOMALY"
                confidence = 62.0
                severity = "LOW"

        else:
            classification = "NORMAL"
            confidence = round(max(90.0, 100.0 - composite_score * 40.0), 1)
            severity = "NONE"

        # 12. Generate Explainability
        summary, points = generate_explanation(
            classification=classification,
            fault_type=fault_type or "NONE",
            target_station_id=station_id,
            target_value=temp,
            scores=scores_dict,
            temporal_metrics=temporal_metrics,
            spatial_metrics=spatial_metrics,
            multivariate_metrics=mv_metrics,
            neighbors=neighbors
        )

        return {
            "station_id": station_id,
            "timestamp": now_str,
            "is_anomaly": is_anomaly,
            "classification": classification,
            "fault_type": fault_type,
            "confidence": confidence,
            "severity": severity,
            "anomaly_score": round(composite_score, 3),
            "scores": scores_dict,
            "explanation": summary,
            "explanation_points": points,
            "nearby_comparison": neighbors
        }


# Global detector instance
detector = SkyGuardAnomalyDetector()
