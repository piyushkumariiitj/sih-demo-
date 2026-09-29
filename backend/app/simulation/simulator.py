import uuid
from datetime import datetime
from typing import Dict, Any, List

from app.services.data_service import data_service
from app.services.health_service import calculate_sensor_health
from app.ml.detector import detector
from app.ml.spatial import find_nearest_stations


class Simulator:
    def __init__(self):
        pass

    def run_full_analysis(self) -> Dict[str, Any]:
        """
        Runs anomaly detection and health scoring on all 10 stations.
        Generates alerts for any detected anomalies.
        """
        all_stations = data_service.get_stations()
        results = {}

        for st in all_stations:
            sid = st["station_id"]
            history = data_service.get_station_readings(sid)
            is_offline = (st.get("status") == "OFFLINE")

            # Prepare current reading dict
            current_reading = None
            if not is_offline and history:
                current_reading = history[-1]

            # Analyze
            res = detector.analyze_station(
                station_id=sid,
                current_reading=current_reading,
                reading_history=history,
                all_stations=all_stations,
                is_simulated_offline=is_offline
            )

            results[sid] = res
            data_service.set_station_anomaly(sid, res)

            # Health calculation
            health_info = calculate_sensor_health(
                station_id=sid,
                station_name=st["name"],
                anomaly_status=res["classification"],
                fault_type=res["fault_type"],
                recent_anomalies=[res] if res["is_anomaly"] else [],
                is_offline=is_offline
            )

            data_service.update_station_health(
                sid,
                health_score=health_info["health_score"],
                maintenance_risk=health_info["maintenance_risk"]
            )

            # Generate alert if anomaly
            if res["is_anomaly"]:
                alert_id = f"ALT-{sid}-{uuid.uuid4().hex[:6].upper()}"
                alert_title = f"{res['classification']}: {res['fault_type'] or 'Abnormal Reading'}"
                alert_msg = f"{sid} ({st['name']}) reported {st.get('temperature', 'N/A')}°C. {res['explanation']}"

                alert = {
                    "alert_id": alert_id,
                    "station_id": sid,
                    "station_name": st["name"],
                    "timestamp": res["timestamp"],
                    "classification": res["classification"],
                    "fault_type": res["fault_type"],
                    "title": alert_title,
                    "message": alert_msg,
                    "severity": res["severity"],
                    "confidence": res["confidence"],
                    "explanation": res["explanation"]
                }
                data_service.add_alert(alert)

        data_service.persist_to_disk()
        return results

    def start_simulation(
        self,
        station_id: str = "AWS-003",
        scenario: str = "normal",
        intensity: str = "medium"
    ) -> Dict[str, Any]:
        """
        Applies requested simulation scenario to target station(s) and executes detection.
        """
        now = datetime.now()
        now_hm = now.strftime("%H:%M")
        now_full = now.strftime("%Y-%m-%d %H:%M:%S")

        # First, ensure base state is clean
        data_service.initialize_data()
        data_service.clear_alerts()

        target = data_service.get_station(station_id)
        if not target:
            station_id = "AWS-003"
            target = data_service.get_station(station_id)

        history = data_service.get_station_readings(station_id)

        if scenario == "normal":
            # Baseline state
            pass

        elif scenario == "sensor_spike":
            # AWS-003 jumps to 55°C (or based on intensity)
            spike_temp = 55.0
            if intensity == "low":
                spike_temp = 46.0
            elif intensity == "high":
                spike_temp = 62.0

            target["temperature"] = spike_temp
            target["last_seen"] = now_full
            target["status"] = "FAULT"

            # Append spiked reading to history
            if history:
                history[-1]["temperature"] = spike_temp
                history[-1]["is_anomaly"] = True
                history[-1]["anomaly_type"] = "SENSOR SPIKE"

        elif scenario == "sensor_drift":
            # Gradual climb: 31.0 -> 32.5 -> 34.0 -> 35.5 -> 37.0 -> 38.8°C
            drift_vals = [31.2, 32.5, 34.0, 35.6, 37.2, 39.0]
            if intensity == "low":
                drift_vals = [31.2, 32.0, 33.0, 34.1, 35.2, 36.5]
            elif intensity == "high":
                drift_vals = [31.5, 33.5, 36.0, 38.5, 41.0, 44.0]

            # Overwrite last len(drift_vals) history points
            n = len(drift_vals)
            if len(history) >= n:
                for idx, val in enumerate(drift_vals):
                    h_idx = len(history) - n + idx
                    history[h_idx]["temperature"] = val
                    history[h_idx]["is_anomaly"] = (idx >= 3)
                    history[h_idx]["anomaly_type"] = "SENSOR DRIFT" if idx >= 3 else None

            target["temperature"] = drift_vals[-1]
            target["status"] = "DEGRADING"

        elif scenario == "frozen_sensor":
            # Repeated identical readings e.g. 31.2, 31.2, 31.2...
            frozen_val = 31.2
            n = 8
            if len(history) >= n:
                for idx in range(len(history) - n, len(history)):
                    history[idx]["temperature"] = frozen_val
                    history[idx]["is_anomaly"] = True
                    history[idx]["anomaly_type"] = "FROZEN SENSOR"

            target["temperature"] = frozen_val
            target["status"] = "FAULT"

        elif scenario == "missing_data":
            # Station stops producing readings / communication timeout
            target["status"] = "OFFLINE"
            target["temperature"] = None
            target["pressure"] = None
            target["humidity"] = None

        elif scenario == "weather_event":
            # Weather event affects multiple nearby stations together
            # E.g. heat wave / thunderstorm front:
            temp_shift = 5.8
            pres_shift = -3.2
            hum_shift = -12.0
            if intensity == "low":
                temp_shift = 4.0
                pres_shift = -2.0
            elif intensity == "high":
                temp_shift = 8.5
                pres_shift = -5.0

            # Find target and its nearest 4 neighbors
            all_st = data_service.get_stations()
            neighbors = find_nearest_stations(station_id, all_st, k=4)
            affected_ids = [station_id] + [n["station_id"] for n in neighbors]

            for sid in affected_ids:
                st = data_service.get_station(sid)
                if st:
                    orig_t = st.get("temperature", 31.5)
                    orig_p = st.get("pressure", 1008.0)
                    orig_rh = st.get("humidity", 63.0)

                    new_t = round(orig_t + temp_shift + (hash(sid) % 5 - 2) * 0.2, 1)
                    new_p = round(orig_p + pres_shift + (hash(sid) % 3 - 1) * 0.1, 1)
                    new_rh = round(max(20.0, orig_rh + hum_shift + (hash(sid) % 5 - 2) * 0.4), 1)

                    st["temperature"] = new_t
                    st["pressure"] = new_p
                    st["humidity"] = new_rh
                    st["status"] = "ONLINE"

                    st_hist = data_service.get_station_readings(sid)
                    if st_hist:
                        st_hist[-1]["temperature"] = new_t
                        st_hist[-1]["pressure"] = new_p
                        st_hist[-1]["humidity"] = new_rh
                        st_hist[-1]["is_anomaly"] = True
                        st_hist[-1]["anomaly_type"] = "WEATHER EVENT"

        # Update simulation status
        data_service.simulation_state = {
            "active": scenario != "normal",
            "scenario": scenario,
            "station_id": station_id,
            "intensity": intensity,
            "started_at": now_full
        }

        # Run pipeline
        results = self.run_full_analysis()

        return {
            "status": "success",
            "simulation": data_service.simulation_state,
            "target_result": results.get(station_id),
            "all_results": results
        }

    def reset_simulation(self) -> Dict[str, Any]:
        """Resets all stations and history to normal baseline."""
        data_service.initialize_data()
        data_service.clear_alerts()
        data_service.simulation_state = {
            "active": False,
            "scenario": "normal",
            "station_id": "AWS-003",
            "intensity": "medium",
            "started_at": None
        }
        results = self.run_full_analysis()
        return {
            "status": "success",
            "message": "Simulation reset. All AWS stations returned to normal baseline.",
            "all_results": results
        }


# Global simulator singleton
simulator = Simulator()
