import React from 'react';
import { Radio, AlertOctagon, CloudRain, Wrench, ShieldAlert, Cpu } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Stations',
      value: stats.total_stations,
      subtitle: 'Virtual AWS Cluster',
      icon: Radio,
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
      badge: '10 Nodes',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800'
    },
    {
      title: 'Online Stations',
      value: stats.online_stations,
      subtitle: `${stats.total_stations - stats.online_stations} Station Offline`,
      icon: Cpu,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      badge: `${Math.round((stats.online_stations / Math.max(1, stats.total_stations)) * 100)}% Live`,
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
    },
    {
      title: 'Active Anomalies',
      value: stats.active_anomalies,
      subtitle: 'Requiring Triage',
      icon: AlertOctagon,
      color: stats.active_anomalies > 0
        ? 'from-amber-500/25 to-yellow-500/10 border-amber-500/40 text-amber-400'
        : 'from-slate-800 to-slate-900 border-slate-700/60 text-slate-400',
      badge: stats.active_anomalies > 0 ? 'Action Needed' : 'Nominal',
      badgeColor: stats.active_anomalies > 0 ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-800 text-slate-300 border-slate-700'
    },
    {
      title: 'Weather Events',
      value: stats.weather_events,
      subtitle: 'Spatially Coherent',
      icon: CloudRain,
      color: stats.weather_events > 0
        ? 'from-sky-500/25 to-indigo-500/10 border-sky-500/40 text-sky-400'
        : 'from-slate-800 to-slate-900 border-slate-700/60 text-slate-400',
      badge: 'Natural Shift',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-800'
    },
    {
      title: 'Sensor Faults',
      value: stats.sensor_faults,
      subtitle: 'Isolated Hardware Failure',
      icon: ShieldAlert,
      color: stats.sensor_faults > 0
        ? 'from-rose-500/25 to-red-500/10 border-rose-500/40 text-rose-400'
        : 'from-slate-800 to-slate-900 border-slate-700/60 text-slate-400',
      badge: stats.sensor_faults > 0 ? 'Hardware Issue' : 'All Clear',
      badgeColor: stats.sensor_faults > 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-slate-800 text-slate-300 border-slate-700'
    },
    {
      title: 'High Risk Sensors',
      value: stats.high_risk_sensors,
      subtitle: 'Health Score < 60',
      icon: Wrench,
      color: stats.high_risk_sensors > 0
        ? 'from-purple-500/25 to-pink-500/10 border-purple-500/40 text-purple-400'
        : 'from-slate-800 to-slate-900 border-slate-700/60 text-slate-400',
      badge: stats.high_risk_sensors > 0 ? 'Urgent Service' : 'Low Risk',
      badgeColor: stats.high_risk_sensors > 0 ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-slate-800 text-slate-300 border-slate-700'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border bg-gradient-to-b ${card.color} shadow-sm backdrop-blur-sm transition-all hover:translate-y-[-2px]`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                {card.badge}
              </span>
              <Icon className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-2xl font-bold font-heading text-white tracking-tight">
              {card.value}
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
              {card.title}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
};
