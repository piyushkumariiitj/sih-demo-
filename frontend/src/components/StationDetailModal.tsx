import React, { useState } from 'react';
import { Station, Reading, AnomalyResult, HealthStatus } from '../types';
import {
  X,
  Play,
  Activity,
  MapPin,
  Clock,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  CloudRain,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface StationDetailModalProps {
  station: Station;
  readings: Reading[];
  anomaly: AnomalyResult | null;
  health: HealthStatus | null;
  onClose: () => void;
  onRunAnalysis: (stationId: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  readings,
  anomaly,
  health,
  onClose,
  onRunAnalysis,
  isAnalyzing
}) => {
  const isFault = station.anomaly_status === 'SENSOR FAULT';
  const isWeather = station.anomaly_status === 'WEATHER EVENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white font-heading">
                {station.station_id} – {station.name}
              </h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isFault
                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                  : isWeather
                  ? 'bg-sky-950 text-sky-300 border-sky-700'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}>
                {station.anomaly_status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Lat: {station.latitude}°N, Lon: {station.longitude}°E
              </span>
              <span>Elevation: {station.elevation}m</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Last Ping: {station.last_seen || 'Active'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRunAnalysis(station.station_id)}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'RUN ANALYSIS'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Temperature</div>
            <div className={`text-xl font-bold font-mono ${
              (station.temperature ?? 0) > 50 ? 'text-rose-400' : 'text-white'
            }`}>
              {station.temperature !== null ? `${station.temperature}°C` : 'OFFLINE'}
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Pressure</div>
            <div className="text-xl font-bold font-mono text-white">
              {station.pressure !== null ? `${station.pressure} hPa` : '--'}
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Humidity</div>
            <div className="text-xl font-bold font-mono text-white">
              {station.humidity !== null ? `${station.humidity}%` : '--'}
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Sensor Health</div>
            <div className={`text-xl font-bold font-mono ${
              station.health_score >= 80 ? 'text-emerald-400' : station.health_score >= 60 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {station.health_score}/100
            </div>
          </div>
        </div>

        {/* Anomaly & Explanation Section */}
        {anomaly && (
          <div className={`p-4 rounded-xl border mb-5 ${
            isFault ? 'bg-rose-950/20 border-rose-800' : isWeather ? 'bg-sky-950/20 border-sky-800' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                AI Diagnostic & Explainability
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                Confidence: {anomaly.confidence}% | Severity: {anomaly.severity}
              </span>
            </div>
            <p className="text-xs text-slate-200 mb-3">{anomaly.explanation}</p>
            <div className="space-y-1.5">
              {anomaly.explanation_points.map((pt, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini History Chart */}
        <div className="mb-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Recent 24-Period Temperature Trend
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" unit="°C" domain={['dataMin - 2', 'dataMax + 4']} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health & Maintenance Recommendation */}
        {health && (
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase text-white">Maintenance Advisory</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                health.maintenance_risk === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                  : health.maintenance_risk === 'MEDIUM'
                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}>
                RISK: {health.maintenance_risk}
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">{health.recommendation}</p>
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-slate-400 font-mono">
              <div className="bg-slate-900 p-1.5 rounded">Spikes: {health.fault_breakdown.spike}</div>
              <div className="bg-slate-900 p-1.5 rounded">Drifts: {health.fault_breakdown.drift}</div>
              <div className="bg-slate-900 p-1.5 rounded">Frozen: {health.fault_breakdown.frozen}</div>
              <div className="bg-slate-900 p-1.5 rounded">Missing: {health.fault_breakdown.missing}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
