import { Station, Reading, AnomalyResult, Alert, HealthStatus, DashboardStats } from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown server error');
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async getDashboard(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard`);
    return handleResponse(res);
  },

  async getStations(): Promise<Station[]> {
    const res = await fetch(`${API_BASE}/stations`);
    return handleResponse(res);
  },

  async getStationDetail(stationId: string): Promise<{
    station: Station;
    anomaly: AnomalyResult | null;
    health: HealthStatus;
    readings: Reading[];
  }> {
    const res = await fetch(`${API_BASE}/stations/${stationId}`);
    return handleResponse(res);
  },

  async getReadings(stationId: string): Promise<Reading[]> {
    const res = await fetch(`${API_BASE}/readings/${stationId}`);
    return handleResponse(res);
  },

  async getAllReadings(): Promise<Record<string, Reading[]>> {
    const res = await fetch(`${API_BASE}/readings`);
    return handleResponse(res);
  },

  async getAnomalies(): Promise<AnomalyResult[]> {
    const res = await fetch(`${API_BASE}/anomalies`);
    return handleResponse(res);
  },

  async getAlerts(): Promise<Alert[]> {
    const res = await fetch(`${API_BASE}/alerts`);
    return handleResponse(res);
  },

  async getStationHealth(stationId: string): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/stations/${stationId}/health`);
    return handleResponse(res);
  },

  async startSimulation(
    stationId: string,
    scenario: string,
    intensity: string
  ): Promise<{
    status: string;
    simulation: any;
    target_result: AnomalyResult;
    all_results: Record<string, AnomalyResult>;
  }> {
    const res = await fetch(`${API_BASE}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        station_id: stationId,
        scenario,
        intensity
      })
    });
    return handleResponse(res);
  },

  async resetSimulation(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/simulation/reset`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async analyzeStation(stationId: string): Promise<{
    station_id: string;
    analysis: AnomalyResult;
    health: HealthStatus;
  }> {
    const res = await fetch(`${API_BASE}/analyze/${stationId}`, {
      method: 'POST'
    });
    return handleResponse(res);
  }
};
