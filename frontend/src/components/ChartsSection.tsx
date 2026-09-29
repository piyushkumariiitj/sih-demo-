import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { Reading, Station, AnomalyResult } from '../types';
import { Thermometer, Gauge, Droplets, BarChart2, Activity } from 'lucide-react';

interface ChartsSectionProps {
  stationReadings: Reading[];
  selectedStation: Station | null;
  anomalyResult: AnomalyResult | null;
  allStations: Station[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  stationReadings,
  selectedStation,
  anomalyResult,
  allStations
}) => {
  const [activeTab, setActiveTab] = useState<'temp' | 'pressure' | 'humidity' | 'spatial'>('temp');

  const stationName = selectedStation ? selectedStation.name : 'All Stations';
  const stationId = selectedStation ? selectedStation.station_id : 'AWS-003';

  // Spatial comparison data
  const spatialData = anomalyResult?.nearby_comparison?.map((n) => ({
    name: n.station_id,
    targetTemp: selectedStation?.temperature ?? 0,
    neighborTemp: n.temperature ?? 0,
    distance: n.distance_km
  })) || allStations.slice(0, 5).map((s) => ({
    name: s.station_id,
    targetTemp: selectedStation?.temperature ?? 0,
    neighborTemp: s.temperature ?? 0,
    distance: 5.0
  }));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white font-heading tracking-wide uppercase">
              Telemetry Analytics & Diagnostics
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">
              {stationId} ({stationName})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            24-point time-series history and spatial correlation metrics
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('temp')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'temp'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>

          <button
            onClick={() => setActiveTab('pressure')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'pressure'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Pressure</span>
          </button>

          <button
            onClick={() => setActiveTab('humidity')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'humidity'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Humidity</span>
          </button>

          <button
            onClick={() => setActiveTab('spatial')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              activeTab === 'spatial'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Spatial Comparison</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {activeTab === 'temp' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stationReadings} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={['dataMin - 2', 'dataMax + 4']} unit="°C" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val} °C`, 'Temperature']}
              />
              <ReferenceLine y={45} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'Critical Threshold (45°C)', fill: '#f43f5e', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#tempGradient)"
                dot={(props: any) => {
                  const isAnomaly = props.payload.is_anomaly || props.payload.temperature > 50;
                  if (isAnomaly) {
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={6}
                        fill="#ff0055"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle cx={props.cx} cy={props.cy} r={2} fill="#f43f5e" />;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'pressure' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stationReadings} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="presGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={['dataMin - 3', 'dataMax + 3']} unit=" hPa" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val} hPa`, 'Pressure']}
              />
              <Area type="monotone" dataKey="pressure" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#presGradient)" dot={{ r: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'humidity' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stationReadings} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val}%`, 'Relative Humidity']}
              />
              <Area type="monotone" dataKey="humidity" stroke="#2dd4bf" strokeWidth={2.5} fillOpacity={1} fill="url(#humGradient)" dot={{ r: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'spatial' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spatialData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" unit="°C" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="targetTemp" name={`Target (${stationId})`} fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="neighborTemp" name="Neighbor Stations" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
