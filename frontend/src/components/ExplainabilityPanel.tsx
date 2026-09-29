import React from 'react';
import { CheckCircle2, AlertOctagon, HelpCircle, Activity, Globe2, Layers, Cpu, Compass } from 'lucide-react';
import { AnomalyResult } from '../types';

interface ExplainabilityPanelProps {
  anomalyResult: AnomalyResult | null;
  stationName?: string;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  anomalyResult,
  stationName
}) => {
  if (!anomalyResult) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-center text-slate-400 text-xs">
        Select a station from the table or start a simulation to view transparent AI explainability.
      </div>
    );
  }

  const {
    station_id,
    classification,
    fault_type,
    confidence,
    severity,
    anomaly_score,
    scores,
    explanation,
    explanation_points
  } = anomalyResult;

  const isFault = classification === 'SENSOR FAULT';
  const isWeather = classification === 'WEATHER EVENT';

  return (
    <div className={`rounded-xl border p-5 shadow-lg backdrop-blur-md transition-all ${
      isFault
        ? 'bg-rose-950/20 border-rose-800/80'
        : isWeather
        ? 'bg-sky-950/20 border-sky-800/80'
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              EXPLAINABLE AI (XAI) DIAGNOSTIC
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              {station_id} {stationName ? `– ${stationName}` : ''}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white font-heading mt-0.5">
            WHY WAS THIS CLASSIFIED?
          </h3>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
            isFault
              ? 'bg-rose-950 text-rose-300 border-rose-700'
              : isWeather
              ? 'bg-sky-950 text-sky-300 border-sky-700'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            CONCLUSION: {classification} {fault_type ? `(${fault_type})` : ''}
          </div>
          <div className="px-3 py-1.5 rounded-lg border bg-slate-900 border-slate-700 text-xs font-mono text-cyan-400 font-bold">
            CONFIDENCE: {confidence}%
          </div>
        </div>
      </div>

      {/* Summary message */}
      <div className="mb-4 bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 text-xs leading-relaxed text-slate-200">
        <span className="font-semibold text-cyan-400">Diagnostic Summary: </span>
        {explanation}
      </div>

      {/* Rule & Signal Evidence Bullets */}
      <div className="mb-5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Validated Evidence & Analytical Signals:
        </div>
        <div className="space-y-2">
          {explanation_points.map((pt, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80"
            >
              <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                isFault ? 'text-rose-400' : isWeather ? 'text-sky-400' : 'text-emerald-400'
              }`} />
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Signal Radar / Metric Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase mb-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            Temporal
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {scores.temporal !== undefined ? scores.temporal : '--'}
          </div>
          <div className="text-[9px] text-slate-400">Rate of Change</div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase mb-1">
            <Globe2 className="w-3 h-3 text-cyan-400" />
            Spatial Dev
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {scores.spatial !== undefined ? scores.spatial : '--'}
          </div>
          <div className="text-[9px] text-slate-400">Neighbor consensus</div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase mb-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            Multivariate
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {scores.multivariate !== undefined ? scores.multivariate : '--'}
          </div>
          <div className="text-[9px] text-slate-400">T-P-RH Physics</div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase mb-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            Sensor Behav.
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {scores.sensor !== undefined ? scores.sensor : '--'}
          </div>
          <div className="text-[9px] text-slate-400">Spike/Drift/Freeze</div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 uppercase mb-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            Isolation Forest
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {scores.iforest !== undefined ? scores.iforest : '--'}
          </div>
          <div className="text-[9px] text-slate-400">Tree Partitioning</div>
        </div>
      </div>
    </div>
  );
};
