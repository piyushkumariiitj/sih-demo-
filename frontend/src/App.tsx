import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Station, Reading, AnomalyResult, Alert, HealthStatus, DashboardStats } from './types';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { SimulationPanel } from './components/SimulationPanel';
import { StationTable } from './components/StationTable';
import { ExplainabilityPanel } from './components/ExplainabilityPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { ChartsSection } from './components/ChartsSection';
import { StationDetailModal } from './components/StationDetailModal';
import { AlertTriangle, Sparkles, ShieldAlert, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS-003');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_stations: 10,
    online_stations: 10,
    active_anomalies: 0,
    weather_events: 0,
    sensor_faults: 0,
    high_risk_sensors: 0,
    average_health: 100.0,
    simulation_state: {
      active: false,
      scenario: 'normal',
      station_id: 'AWS-003',
      intensity: 'medium',
      started_at: null
    },
    last_updated: ''
  });

  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingSim, setIsLoadingSim] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Fetch all primary dashboard telemetry
  const loadDashboardData = useCallback(async () => {
    try {
      const [dashStats, stList, alertList] = await Promise.all([
        api.getDashboard(),
        api.getStations(),
        api.getAlerts()
      ]);

      setStats(dashStats);
      setStations(stList);
      setAlerts(alertList);
      setBackendConnected(true);
      setBackendError(null);

      // Refresh selected station details
      const activeSid = selectedStationId || 'AWS-003';
      const detail = await api.getStationDetail(activeSid).catch(() => null);
      if (detail) {
        setSelectedStation(detail.station);
        setAnomalyResult(detail.anomaly);
        setHealthStatus(detail.health);
        setReadings(detail.readings);
      }
    } catch (err: any) {
      console.error('Failed to connect to SkyGuard AI backend:', err);
      setBackendConnected(false);
      setBackendError('Backend unavailable. Please start FastAPI server (uvicorn main:app).');
    }
  }, [selectedStationId]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Optional background sync every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadDashboardData();
    }, 8000);
    return () => clearInterval(timer);
  }, [loadDashboardData]);

  // When user clicks a station in table
  const handleSelectStation = async (stationId: string) => {
    setSelectedStationId(stationId);
    try {
      const detail = await api.getStationDetail(stationId);
      setSelectedStation(detail.station);
      setAnomalyResult(detail.anomaly);
      setHealthStatus(detail.health);
      setReadings(detail.readings);
    } catch (err) {
      console.error('Failed to load station detail:', err);
    }
  };

  // Open detail modal
  const handleOpenDetailModal = async (stationId: string) => {
    await handleSelectStation(stationId);
    setIsDetailModalOpen(true);
  };

  // Start simulation
  const handleStartSimulation = async (stationId: string, scenario: string, intensity: string) => {
    setIsLoadingSim(true);
    try {
      const res = await api.startSimulation(stationId, scenario, intensity);
      setSelectedStationId(stationId);
      await loadDashboardData();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsLoadingSim(false);
    }
  };

  // Reset simulation
  const handleResetSimulation = async () => {
    setIsLoadingSim(true);
    try {
      await api.resetSimulation();
      await loadDashboardData();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsLoadingSim(false);
    }
  };

  // Run analysis on station
  const handleRunAnalysis = async (stationId: string) => {
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeStation(stationId);
      setAnomalyResult(res.analysis);
      setHealthStatus(res.health);
      await loadDashboardData();
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        backendConnected={backendConnected}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lastUpdated={stats.last_updated}
      />

      {/* Backend Unavailable Error Banner (Section 24) */}
      {!backendConnected && (
        <div className="bg-rose-950 border-b border-rose-800 text-rose-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full text-xs sm:text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {backendError || 'Backend unavailable. Please start FastAPI server (run: python -m uvicorn app.main:app --port 8000).'}
            </span>
          </div>
          <button
            onClick={loadDashboardData}
            className="text-xs bg-rose-900 hover:bg-rose-800 text-white font-semibold px-3 py-1 rounded border border-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Top 6 KPI Metric Cards */}
        <StatsCards stats={stats} />

        {/* Interactive Simulation & Demo Control Panel */}
        <SimulationPanel
          stations={stations}
          simState={stats.simulation_state}
          onStartSimulation={handleStartSimulation}
          onResetSimulation={handleResetSimulation}
          isLoading={isLoadingSim}
        />

        {/* 2-Column Responsive Diagnostic Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Station Table + Recharts Visualizer */}
          <div className="lg:col-span-7 space-y-6">
            <StationTable
              stations={stations}
              onSelectStation={handleOpenDetailModal}
              selectedStationId={selectedStationId}
            />

            <ChartsSection
              stationReadings={readings}
              selectedStation={selectedStation}
              anomalyResult={anomalyResult}
              allStations={stations}
            />
          </div>

          {/* Right Column (5 cols): Explainable AI (XAI) + Alerts Panel */}
          <div className="lg:col-span-5 space-y-6">
            <ExplainabilityPanel
              anomalyResult={anomalyResult}
              stationName={selectedStation?.name}
            />

            <AlertsPanel
              alerts={alerts}
              onSelectStation={handleSelectStation}
            />
          </div>
        </div>
      </main>

      {/* Station Detail Diagnostic Modal */}
      {isDetailModalOpen && selectedStation && (
        <StationDetailModal
          station={selectedStation}
          readings={readings}
          anomaly={anomalyResult}
          health={healthStatus}
          onClose={() => setIsDetailModalOpen(false)}
          onRunAnalysis={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SkyGuard AI – SIH26073 Automated Weather Station Intelligent Anomaly Detection</span>
          <span className="font-mono text-[11px] text-slate-400">
            Pipeline: Temporal • Spatial • Multivariate • Isolation Forest • Transparent XAI
          </span>
        </div>
      </footer>
    </div>
  );
};
export default App;
