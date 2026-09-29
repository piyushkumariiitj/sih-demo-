from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class Reading(BaseModel):
    station_id: str
    timestamp: str
    temperature: float
    pressure: float
    humidity: float
    is_anomaly: bool = False
    anomaly_type: Optional[str] = None


class Station(BaseModel):
    station_id: str
    name: str
    latitude: float
    longitude: float
    elevation: float = 560.0
    status: str = "ONLINE"  # ONLINE, OFFLINE, DEGRADING, FAULT
    temperature: Optional[float] = None
    pressure: Optional[float] = None
    humidity: Optional[float] = None
    last_seen: Optional[str] = None
    anomaly_status: str = "NORMAL"  # NORMAL, SENSOR FAULT, WEATHER EVENT, UNKNOWN ANOMALY
    confidence: float = 0.0
    health_score: float = 100.0
    maintenance_risk: str = "LOW"  # LOW, MEDIUM, HIGH


class AnomalyResult(BaseModel):
    station_id: str
    timestamp: str
    is_anomaly: bool
    classification: str  # NORMAL, SENSOR FAULT, WEATHER EVENT, UNKNOWN ANOMALY
    fault_type: Optional[str] = None  # SENSOR SPIKE, SENSOR DRIFT, FROZEN SENSOR, MISSING DATA, WEATHER SHIFT
    confidence: float  # e.g., 94.0
    severity: str  # NONE, LOW, MEDIUM, HIGH, CRITICAL
    anomaly_score: float  # 0.0 to 1.0
    scores: Dict[str, float] = Field(default_factory=dict)  # temporal, spatial, multivariate, sensor, iforest
    explanation: str
    explanation_points: List[str] = Field(default_factory=list)
    nearby_comparison: List[Dict[str, Any]] = Field(default_factory=list)


class Alert(BaseModel):
    alert_id: str
    station_id: str
    station_name: str
    timestamp: str
    classification: str
    fault_type: Optional[str] = None
    title: str
    message: str
    severity: str
    confidence: float
    explanation: str


class HealthStatus(BaseModel):
    station_id: str
    station_name: str
    health_score: float
    maintenance_risk: str
    status: str
    recommendation: str
    anomaly_count: int
    fault_breakdown: Dict[str, int]
    history: List[Dict[str, Any]] = Field(default_factory=list)


class SimulationRequest(BaseModel):
    station_id: Optional[str] = "AWS-003"
    scenario: str = "normal"  # normal, sensor_spike, sensor_drift, frozen_sensor, missing_data, weather_event
    intensity: str = "medium"  # low, medium, high


class DashboardSummary(BaseModel):
    total_stations: int
    online_stations: int
    active_anomalies: int
    weather_events: int
    sensor_faults: int
    high_risk_sensors: int
    average_health: float
    last_updated: str
