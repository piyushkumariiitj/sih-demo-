import React from 'react';
import { Alert } from '../types';
import { Bell, ShieldAlert, CloudRain, AlertTriangle, Clock } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
  onSelectStation: (stationId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onSelectStation }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-white font-heading tracking-wide uppercase">
            Active Alerts & Triage Stream
          </h3>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          {alerts.length} Events
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No active anomaly alerts. All 10 AWS stations operating nominally.
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {alerts.map((alt) => {
            const isFault = alt.classification === 'SENSOR FAULT';
            const isWeather = alt.classification === 'WEATHER EVENT';

            return (
              <div
                key={alt.alert_id}
                onClick={() => onSelectStation(alt.station_id)}
                className={`p-3.5 rounded-lg border transition cursor-pointer ${
                  isFault
                    ? 'bg-rose-950/25 border-rose-800/60 hover:bg-rose-950/40 hover:border-rose-600'
                    : isWeather
                    ? 'bg-sky-950/25 border-sky-800/60 hover:bg-sky-950/40 hover:border-sky-600'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      isFault
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : isWeather
                        ? 'bg-sky-950 text-sky-300 border-sky-700'
                        : 'bg-amber-950 text-amber-300 border-amber-700'
                    }`}>
                      {alt.classification}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {alt.station_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{alt.timestamp.split(' ')[1] || alt.timestamp}</span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-200 mb-1">
                  {alt.title}
                </div>

                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {alt.explanation}
                </p>

                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-cyan-400 font-semibold font-mono">
                    Confidence: {alt.confidence}%
                  </span>
                  <span className={`font-bold ${
                    alt.severity === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    Severity: {alt.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
