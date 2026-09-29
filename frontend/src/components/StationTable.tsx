import React from 'react';
import { Station } from '../types';
import { ExternalLink, ShieldAlert, CloudRain, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

interface StationTableProps {
  stations: Station[];
  onSelectStation: (stationId: string) => void;
  selectedStationId?: string;
}

export const StationTable: React.FC<StationTableProps> = ({
  stations,
  onSelectStation,
  selectedStationId
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">● ONLINE</span>;
      case 'DEGRADING':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">▲ DEGRADING</span>;
      case 'FAULT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">✖ FAULT</span>;
      case 'OFFLINE':
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">○ OFFLINE</span>;
    }
  };

  const getAnomalyBadge = (anomalyStatus: string, faultType?: string | null) => {
    switch (anomalyStatus) {
      case 'SENSOR FAULT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            SENSOR FAULT {faultType ? `(${faultType})` : ''}
          </span>
        );
      case 'WEATHER EVENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-950/80 text-sky-300 border border-sky-700/80">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            WEATHER EVENT
          </span>
        );
      case 'UNKNOWN ANOMALY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            UNKNOWN
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            NORMAL
          </span>
        );
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">LOW</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-md">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white font-heading tracking-wide uppercase">
            Live Station Overview (10 Virtual AWS Nodes)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry, spatial consistency checks, and multi-tier anomaly classifications
          </p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
          Click any row to view diagnostic telemetry & charts
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
            <tr>
              <th className="py-3 px-4">Station ID & Name</th>
              <th className="py-3 px-3">Temperature</th>
              <th className="py-3 px-3">Pressure</th>
              <th className="py-3 px-3">Humidity</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-3">Confidence</th>
              <th className="py-3 px-4">Sensor Health</th>
              <th className="py-3 px-3">Maint. Risk</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {stations.map((st) => {
              const isSelected = st.station_id === selectedStationId;
              const isFault = st.anomaly_status === 'SENSOR FAULT';
              const isWeather = st.anomaly_status === 'WEATHER EVENT';

              return (
                <tr
                  key={st.station_id}
                  onClick={() => onSelectStation(st.station_id)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-l-4 border-l-cyan-500'
                      : isFault
                      ? 'bg-rose-950/20 hover:bg-rose-950/40'
                      : isWeather
                      ? 'bg-sky-950/20 hover:bg-sky-950/40'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-sans font-bold text-white text-xs">{st.station_id}</div>
                    <div className="font-sans text-[11px] text-slate-400">{st.name}</div>
                  </td>
                  <td className="py-3 px-3">
                    {st.temperature !== null ? (
                      <span className={`font-semibold ${
                        st.temperature > 50 ? 'text-rose-400 text-sm font-bold' : 'text-slate-200'
                      }`}>
                        {st.temperature}°C
                      </span>
                    ) : (
                      <span className="text-slate-500">--</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {st.pressure !== null ? `${st.pressure} hPa` : '--'}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {st.humidity !== null ? `${st.humidity}%` : '--'}
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(st.status)}
                  </td>
                  <td className="py-3 px-4">
                    {getAnomalyBadge(st.anomaly_status, st.fault_type)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-300 font-semibold">{st.confidence}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-200">{st.health_score}/100</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            st.health_score >= 80
                              ? 'bg-emerald-500'
                              : st.health_score >= 60
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${st.health_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {getRiskBadge(st.maintenance_risk)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStation(st.station_id);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/80 px-2.5 py-1 rounded-md transition"
                    >
                      <span>Analyze</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
