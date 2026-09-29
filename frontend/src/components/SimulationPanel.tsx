import React, { useState } from 'react';
import { Play, RotateCcw, Sparkles, Sliders, Zap, AlertTriangle, CloudSun, Radio } from 'lucide-react';
import { Station, SimulationState } from '../types';

interface SimulationPanelProps {
  stations: Station[];
  simState: SimulationState;
  onStartSimulation: (stationId: string, scenario: string, intensity: string) => Promise<void>;
  onResetSimulation: () => Promise<void>;
  isLoading: boolean;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  stations,
  simState,
  onStartSimulation,
  onResetSimulation,
  isLoading
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('AWS-003');
  const [scenario, setScenario] = useState<string>('sensor_spike');
  const [intensity, setIntensity] = useState<string>('medium');

  const handleStart = () => {
    onStartSimulation(selectedStation, scenario, intensity);
  };

  const handleQuickDemo = (demoType: string) => {
    if (demoType === 'spike') {
      setSelectedStation('AWS-003');
      setScenario('sensor_spike');
      setIntensity('medium');
      onStartSimulation('AWS-003', 'sensor_spike', 'medium');
    } else if (demoType === 'weather') {
      setSelectedStation('AWS-003');
      setScenario('weather_event');
      setIntensity('medium');
      onStartSimulation('AWS-003', 'weather_event', 'medium');
    } else if (demoType === 'drift') {
      setSelectedStation('AWS-003');
      setScenario('sensor_drift');
      setIntensity('medium');
      onStartSimulation('AWS-003', 'sensor_drift', 'medium');
    } else if (demoType === 'frozen') {
      setSelectedStation('AWS-003');
      setScenario('frozen_sensor');
      setIntensity('medium');
      onStartSimulation('AWS-003', 'frozen_sensor', 'medium');
    } else if (demoType === 'missing') {
      setSelectedStation('AWS-003');
      setScenario('missing_data');
      setIntensity('medium');
      onStartSimulation('AWS-003', 'missing_data', 'medium');
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              AWS SIMULATION CONTROL
              {simState.active && (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                  Simulation Live: {simState.scenario.replace('_', ' ')}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Inject controlled environmental anomalies or hardware faults to test the multi-tier detection pipeline
            </p>
          </div>
        </div>

        {/* Quick Demo Badge */}
        <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/70 px-2.5 py-1 rounded-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-semibold">SIH Judge Demo Mode</span>
        </div>
      </div>

      {/* Quick 1-Click Judge Demonstration Presets */}
      <div className="mb-5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          1-Click Demonstration Scenarios (Pre-configured for Presentation)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            onClick={() => handleQuickDemo('spike')}
            disabled={isLoading}
            className="flex flex-col text-left p-2.5 rounded-lg border bg-rose-950/30 border-rose-800/60 hover:bg-rose-900/40 hover:border-rose-600 transition group cursor-pointer"
          >
            <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Demo 1: Sensor Spike
            </span>
            <span className="text-xs font-semibold text-white mt-0.5">AWS-003 → 55°C</span>
            <span className="text-[10px] text-slate-400 mt-1">Classifies: SENSOR FAULT</span>
          </button>

          <button
            onClick={() => handleQuickDemo('weather')}
            disabled={isLoading}
            className="flex flex-col text-left p-2.5 rounded-lg border bg-sky-950/30 border-sky-800/60 hover:bg-sky-900/40 hover:border-sky-600 transition group cursor-pointer"
          >
            <span className="text-[10px] font-bold text-sky-400 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Demo 2: Weather Event
            </span>
            <span className="text-xs font-semibold text-white mt-0.5">Cluster Surge ~37°C</span>
            <span className="text-[10px] text-slate-400 mt-1">Classifies: WEATHER EVENT</span>
          </button>

          <button
            onClick={() => handleQuickDemo('drift')}
            disabled={isLoading}
            className="flex flex-col text-left p-2.5 rounded-lg border bg-amber-950/30 border-amber-800/60 hover:bg-amber-900/40 hover:border-amber-600 transition group cursor-pointer"
          >
            <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Demo 3: Sensor Drift
            </span>
            <span className="text-xs font-semibold text-white mt-0.5">Gradual +7°C Climb</span>
            <span className="text-[10px] text-slate-400 mt-1">Risk ↑ | Health ↓</span>
          </button>

          <button
            onClick={() => handleQuickDemo('frozen')}
            disabled={isLoading}
            className="flex flex-col text-left p-2.5 rounded-lg border bg-indigo-950/30 border-indigo-800/60 hover:bg-indigo-900/40 hover:border-indigo-600 transition group cursor-pointer"
          >
            <span className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Demo 4: Frozen Sensor
            </span>
            <span className="text-xs font-semibold text-white mt-0.5">Constant 31.2°C</span>
            <span className="text-[10px] text-slate-400 mt-1">Zero natural variance</span>
          </button>

          <button
            onClick={() => handleQuickDemo('missing')}
            disabled={isLoading}
            className="flex flex-col text-left p-2.5 rounded-lg border bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-500 transition group cursor-pointer"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Demo 5: Missing Data
            </span>
            <span className="text-xs font-semibold text-white mt-0.5">Telemetry Loss</span>
            <span className="text-[10px] text-slate-400 mt-1">Station marked OFFLINE</span>
          </button>
        </div>
      </div>

      {/* Manual Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        {/* Station Select */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Target AWS Station
          </label>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>
                {s.station_id} - {s.name} ({s.temperature ? `${s.temperature}°C` : 'OFFLINE'})
              </option>
            ))}
          </select>
        </div>

        {/* Scenario Select */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Simulation Scenario
          </label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="normal">1. Normal (Baseline Diurnal)</option>
            <option value="sensor_spike">2. Sensor Spike (Abrupt Extreme Surge)</option>
            <option value="sensor_drift">3. Sensor Drift (Linear Deviation)</option>
            <option value="frozen_sensor">4. Frozen Sensor (Constant Telemetry)</option>
            <option value="missing_data">5. Missing Data (Connection Timeout)</option>
            <option value="weather_event">6. Weather Event (Multi-station Coherent Shift)</option>
          </select>
        </div>

        {/* Intensity Select */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Intensity Level
          </label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="low">Low Intensity</option>
            <option value="medium">Medium Intensity (Recommended)</option>
            <option value="high">High Intensity (Severe)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md shadow-cyan-600/20 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>START SIMULATION</span>
          </button>

          <button
            onClick={onResetSimulation}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 text-xs font-semibold px-3 py-2.5 rounded-lg border border-slate-700 transition cursor-pointer"
            title="Reset all stations to clean baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>
    </div>
  );
};
