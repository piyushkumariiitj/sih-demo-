from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict, Any
from datetime import datetime

from app.models.schemas import SimulationRequest
from app.services.data_service import data_service
from app.services.health_service import calculate_sensor_health
from app.simulation.simulator import simulator
from app.ml.detector import detector

router = APIRouter(prefix="/api")


@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "service": "SkyGuard AI Backend",
        "version": "1.0.0",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@router.get("/dashboard")
def get_dashboard_summary():
    stations = data_service.get_stations()
    total = len(stations)
    online = sum(1 for s in stations if s.get("status") != "OFFLINE")
    active_anomalies = sum(1 for s in stations if s.get("anomaly_status") in ["SENSOR FAULT", "WEATHER EVENT", "UNKNOWN ANOMALY"])
    weather_events = sum(1 for s in stations if s.get("anomaly_status") == "WEATHER EVENT")
    sensor_faults = sum(1 for s in stations if s.get("anomaly_status") == "SENSOR FAULT")
    high_risk_sensors = sum(1 for s in stations if s.get("maintenance_risk") == "HIGH")

    avg_health = round(sum(s.get("health_score", 100.0) for s in stations) / max(1, total), 1)

    return {
        "total_stations": total,
        "online_stations": online,
        "active_anomalies": active_anomalies,
        "weather_events": weather_events,
        "sensor_faults": sensor_faults,
        "high_risk_sensors": high_risk_sensors,
        "average_health": avg_health,
        "simulation_state": data_service.simulation_state,
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@router.get("/stations")
def get_all_stations():
    return data_service.get_stations()


@router.get("/stations/{station_id}")
def get_station_detail(station_id: str = Path(..., description="The Station ID (e.g. AWS-001)")):
    station = data_service.get_station(station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")

    history = data_service.get_station_readings(station_id)
    anomaly = data_service.get_station_anomaly(station_id)
    health = calculate_sensor_health(
        station_id=station_id,
        station_name=station["name"],
        anomaly_status=station.get("anomaly_status", "NORMAL"),
        fault_type=station.get("fault_type"),
        recent_anomalies=[anomaly] if anomaly and anomaly.get("is_anomaly") else [],
        is_offline=(station.get("status") == "OFFLINE")
    )

    return {
        "station": station,
        "anomaly": anomaly,
        "health": health,
        "readings": history[-24:] if history else []
    }


@router.get("/readings")
def get_all_readings():
    return data_service.get_all_readings()


@router.get("/readings/{station_id}")
def get_station_readings(station_id: str = Path(..., description="The Station ID")):
    readings = data_service.get_station_readings(station_id)
    if not readings:
        raise HTTPException(status_code=404, detail=f"No readings found for {station_id}")
    return readings


@router.get("/anomalies")
def get_anomalies():
    return data_service.get_anomalies()


@router.get("/alerts")
def get_alerts():
    return data_service.get_alerts()


@router.get("/stations/{station_id}/health")
def get_station_health(station_id: str = Path(..., description="The Station ID")):
    station = data_service.get_station(station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")

    anomaly = data_service.get_station_anomaly(station_id)
    return calculate_sensor_health(
        station_id=station_id,
        station_name=station["name"],
        anomaly_status=station.get("anomaly_status", "NORMAL"),
        fault_type=station.get("fault_type"),
        recent_anomalies=[anomaly] if anomaly and anomaly.get("is_anomaly") else [],
        is_offline=(station.get("status") == "OFFLINE")
    )


@router.post("/simulation/start")
def start_simulation(req: SimulationRequest):
    result = simulator.start_simulation(
        station_id=req.station_id or "AWS-003",
        scenario=req.scenario,
        intensity=req.intensity
    )
    return result


@router.post("/simulation/reset")
def reset_simulation():
    return simulator.reset_simulation()


@router.post("/analyze/{station_id}")
def analyze_station(station_id: str = Path(..., description="The Station ID")):
    station = data_service.get_station(station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")

    history = data_service.get_station_readings(station_id)
    is_offline = (station.get("status") == "OFFLINE")
    current_reading = history[-1] if history and not is_offline else None

    all_stations = data_service.get_stations()
    res = detector.analyze_station(
        station_id=station_id,
        current_reading=current_reading,
        reading_history=history,
        all_stations=all_stations,
        is_simulated_offline=is_offline
    )

    data_service.set_station_anomaly(station_id, res)
    health = calculate_sensor_health(
        station_id=station_id,
        station_name=station["name"],
        anomaly_status=res["classification"],
        fault_type=res["fault_type"],
        recent_anomalies=[res] if res["is_anomaly"] else [],
        is_offline=is_offline
    )
    data_service.update_station_health(
        station_id,
        health_score=health["health_score"],
        maintenance_risk=health["maintenance_risk"]
    )
    data_service.persist_to_disk()

    return {
        "station_id": station_id,
        "analysis": res,
        "health": health
    }
