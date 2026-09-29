import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
STATIONS_FILE = os.path.join(DATA_DIR, "stations.json")
READINGS_FILE = os.path.join(DATA_DIR, "readings.json")

INITIAL_STATIONS = [
    {"station_id": "AWS-001", "name": "Pune City Central", "latitude": 18.5204, "longitude": 73.8567, "elevation": 560.0, "base_t": 31.4, "base_p": 1008.2, "base_rh": 64.0},
    {"station_id": "AWS-002", "name": "Shivajinagar Station", "latitude": 18.5308, "longitude": 73.8475, "elevation": 558.0, "base_t": 31.8, "base_p": 1007.8, "base_rh": 63.0},
    {"station_id": "AWS-003", "name": "Pashan Observatory", "latitude": 18.5372, "longitude": 73.7928, "elevation": 575.0, "base_t": 31.1, "base_p": 1008.5, "base_rh": 65.0},
    {"station_id": "AWS-004", "name": "Kothrud South", "latitude": 18.5074, "longitude": 73.8077, "elevation": 570.0, "base_t": 32.0, "base_p": 1007.5, "base_rh": 62.0},
    {"station_id": "AWS-005", "name": "Hadapsar Industrial", "latitude": 18.5089, "longitude": 73.9260, "elevation": 555.0, "base_t": 32.5, "base_p": 1006.9, "base_rh": 60.0},
    {"station_id": "AWS-006", "name": "Pimpri-Chinchwad Tech", "latitude": 18.6298, "longitude": 73.7997, "elevation": 565.0, "base_t": 31.7, "base_p": 1008.1, "base_rh": 63.0},
    {"station_id": "AWS-007", "name": "Bhosari Sector 7", "latitude": 18.6247, "longitude": 73.8475, "elevation": 562.0, "base_t": 32.2, "base_p": 1007.6, "base_rh": 61.0},
    {"station_id": "AWS-008", "name": "Hinjewadi Infotech", "latitude": 18.5913, "longitude": 73.7389, "elevation": 580.0, "base_t": 31.3, "base_p": 1008.7, "base_rh": 66.0},
    {"station_id": "AWS-009", "name": "Katraj Hilltop", "latitude": 18.4575, "longitude": 73.8677, "elevation": 610.0, "base_t": 30.9, "base_p": 1009.2, "base_rh": 67.0},
    {"station_id": "AWS-010", "name": "Viman Nagar North", "latitude": 18.5679, "longitude": 73.9143, "elevation": 556.0, "base_t": 32.1, "base_p": 1007.3, "base_rh": 62.0}
]


class DataService:
    def __init__(self):
        self.stations: Dict[str, Dict[str, Any]] = {}
        self.readings: Dict[str, List[Dict[str, Any]]] = {}
        self.alerts: List[Dict[str, Any]] = []
        self.anomaly_results: Dict[str, Dict[str, Any]] = {}
        self.simulation_state: Dict[str, Any] = {
            "active": False,
            "scenario": "normal",
            "station_id": "AWS-003",
            "intensity": "medium",
            "started_at": None
        }
        self.initialize_data()

    def initialize_data(self):
        """Initializes or resets stations and baseline time-series history."""
        os.makedirs(DATA_DIR, exist_ok=True)
        self.stations.clear()
        self.readings.clear()
        self.alerts.clear()
        self.anomaly_results.clear()

        now = datetime.now()

        for s in INITIAL_STATIONS:
            sid = s["station_id"]
            self.stations[sid] = {
                "station_id": sid,
                "name": s["name"],
                "latitude": s["latitude"],
                "longitude": s["longitude"],
                "elevation": s["elevation"],
                "status": "ONLINE",
                "temperature": s["base_t"],
                "pressure": s["base_p"],
                "humidity": s["base_rh"],
                "last_seen": now.strftime("%Y-%m-%d %H:%M:%S"),
                "anomaly_status": "NORMAL",
                "fault_type": None,
                "confidence": 95.0,
                "health_score": 100.0,
                "maintenance_risk": "LOW"
            }

            # Generate 24 historical points (each 15 minutes apart)
            history = []
            for i in range(24, 0, -1):
                t_time = now - timedelta(minutes=i * 15)
                # Small diurnal sine wave + tiny noise
                diurnal_t = 1.2 * (1 - abs((i % 12) - 6) / 6)
                t_val = round(s["base_t"] - diurnal_t + (hash(f"{sid}_{i}") % 7 - 3) * 0.08, 1)
                p_val = round(s["base_p"] + (hash(f"{sid}_p_{i}") % 5 - 2) * 0.1, 1)
                rh_val = round(s["base_rh"] + diurnal_t * 1.5 + (hash(f"{sid}_rh_{i}") % 5 - 2) * 0.3, 1)

                history.append({
                    "station_id": sid,
                    "timestamp": t_time.strftime("%H:%M"),
                    "full_timestamp": t_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "temperature": t_val,
                    "pressure": p_val,
                    "humidity": rh_val,
                    "is_anomaly": False,
                    "anomaly_type": None
                })

            # Append current point
            history.append({
                "station_id": sid,
                "timestamp": now.strftime("%H:%M"),
                "full_timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
                "temperature": s["base_t"],
                "pressure": s["base_p"],
                "humidity": s["base_rh"],
                "is_anomaly": False,
                "anomaly_type": None
            })

            self.readings[sid] = history

        self.persist_to_disk()

    def persist_to_disk(self):
        """Optionally mirror in-memory state to data/stations.json & readings.json."""
        try:
            with open(STATIONS_FILE, "w", encoding="utf-8") as f:
                json.dump(list(self.stations.values()), f, indent=2)
            with open(READINGS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.readings, f, indent=2)
        except Exception:
            pass  # in-memory is source of truth

    def get_stations(self) -> List[Dict[str, Any]]:
        return list(self.stations.values())

    def get_station(self, station_id: str) -> Optional[Dict[str, Any]]:
        return self.stations.get(station_id)

    def get_all_readings(self) -> Dict[str, List[Dict[str, Any]]]:
        return self.readings

    def get_station_readings(self, station_id: str) -> List[Dict[str, Any]]:
        return self.readings.get(station_id, [])

    def get_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        return sorted(self.alerts, key=lambda a: a["timestamp"], reverse=True)[:limit]

    def add_alert(self, alert: Dict[str, Any]):
        self.alerts.insert(0, alert)
        if len(self.alerts) > 100:
            self.alerts = self.alerts[:100]

    def clear_alerts(self):
        self.alerts.clear()

    def get_anomalies(self) -> List[Dict[str, Any]]:
        return [res for res in self.anomaly_results.values() if res.get("is_anomaly")]

    def get_station_anomaly(self, station_id: str) -> Optional[Dict[str, Any]]:
        return self.anomaly_results.get(station_id)

    def set_station_anomaly(self, station_id: str, result: Dict[str, Any]):
        self.anomaly_results[station_id] = result
        if station_id in self.stations:
            st = self.stations[station_id]
            st["anomaly_status"] = result.get("classification", "NORMAL")
            st["fault_type"] = result.get("fault_type")
            st["confidence"] = result.get("confidence", 0.0)

    def update_station_health(self, station_id: str, health_score: float, maintenance_risk: str):
        if station_id in self.stations:
            self.stations[station_id]["health_score"] = health_score
            self.stations[station_id]["maintenance_risk"] = maintenance_risk


# Global data service singleton
data_service = DataService()
