import React from 'react';
import { ShieldAlert, Activity, RefreshCw, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  backendConnected: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendConnected,
  isRefreshing,
  onRefresh,
  lastUpdated
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Logo and Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-heading">
                SKYGUARD <span className="text-cyan-400">AI</span>
              </h1>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                SIH26073 Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI/ML-Based Intelligent Anomaly Detection for Automatic Weather Stations (AWS)
            </p>
          </div>
        </div>

        {/* Connection status and actions */}
        <div className="flex items-center gap-3">
          {/* Backend Status indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            backendConnected
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              backendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`} />
            <span>{backendConnected ? 'Engine Online' : 'Backend Offline'}</span>
          </div>

          {/* Workflow Badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] text-slate-300">
              DETECT → DIFFERENTIATE → EXPLAIN → MONITOR
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
            title="Refresh latest AWS telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
