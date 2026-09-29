export interface Station {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADING' | 'FAULT';
  temperature: number | null;
  pressure: number | null;
  humidity: number | null;
  last_seen: string | null;
  anomaly_status: 'NORMAL' | 'SENSOR FAULT' | 'WEATHER EVENT' | 'UNKNOWN ANOMALY';
  fault_type?: string | null;
  confidence: number;
  health_score: number;
  maintenance_risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Reading {
  station_id: string;
  timestamp: string;
  full_timestamp?: string;
  temperature: number;
  pressure: number;
  humidity: number;
  is_anomaly?: boolean;
  anomaly_type?: string | null;
}

export interface AnomalyResult {
  station_id: string;
  timestamp: string;
  is_anomaly: boolean;
  classification: 'NORMAL' | 'SENSOR FAULT' | 'WEATHER EVENT' | 'UNKNOWN ANOMALY';
  fault_type?: string | null;
  confidence: number;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomaly_score: number;
  scores: {
    temporal?: number;
    spatial?: number;
    multivariate?: number;
    sensor?: number;
    iforest?: number;
    composite?: number;
  };
  explanation: string;
  explanation_points: string[];
  nearby_comparison?: Array<{
    station_id: string;
    name: string;
    distance_km: number;
    temperature: number | null;
    pressure: number | null;
    humidity: number | null;
    status: string;
  }>;
}

export interface Alert {
  alert_id: string;
  station_id: string;
  station_name: string;
  timestamp: string;
  classification: string;
  fault_type?: string | null;
  title: string;
  message: string;
  severity: string;
  confidence: number;
  explanation: string;
}

export interface HealthStatus {
  station_id: string;
  station_name: string;
  health_score: number;
  maintenance_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: string;
  recommendation: string;
  anomaly_count: number;
  fault_breakdown: {
    spike: number;
    drift: number;
    frozen: number;
    missing: number;
    other: number;
  };
}

export interface SimulationState {
  active: boolean;
  scenario: string;
  station_id: string;
  intensity: string;
  started_at: string | null;
}

export interface DashboardStats {
  total_stations: number;
  online_stations: number;
  active_anomalies: number;
  weather_events: number;
  sensor_faults: number;
  high_risk_sensors: number;
  average_health: number;
  simulation_state: SimulationState;
  last_updated: string;
}
