import React, { useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    Activity, CheckCircle2, TrendingUp, Microscope,
    Calendar, Download, SlidersHorizontal, ArrowUpRight,
    MoreHorizontal
} from 'lucide-react';
import LabInsights from './LabInsights';
import { calculateOperations, calculateFinancials, getVolumeTrend, getDepartmentStats } from '../services/analyticsService';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface DashboardProps {
    onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { requests, departments, auditLogs } = useLab();

    // Dynamic Stats Calculation
    const opsMetrics = useMemo(() => calculateOperations(requests), [requests]);
    const finMetrics = useMemo(() => calculateFinancials(requests), [requests]);
    const volumeData = useMemo(() => getVolumeTrend(requests), [requests]);
    const deptStats = useMemo(() => getDepartmentStats(requests, departments), [requests, departments]);

    // Last 3 logs for live stream
    const liveLogs = useMemo(() => auditLogs.slice(0, 3), [auditLogs]);

    // Date for header
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            System Online
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">Overview of today's laboratory performance.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end mr-2 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today</span>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <Calendar size={14} className="text-slate-400" />
                            <span>{dateStr}</span>
                        </div>
                    </div>
                    <button aria-label="Filter Settings" className="flex items-center justify-center p-2.5 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors">
                        <SlidersHorizontal size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* Metric 1 */}
                <div
                    onClick={() => onNavigate && onNavigate('samples')}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-100">
                            <Activity size={24} />
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                            <TrendingUp size={14} /> +12%
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Samples Received</span>
                        <span className="text-4xl font-black text-slate-900 tracking-tight">{opsMetrics.totalSamples}</span>
                    </div>
                </div>

                {/* Metric 2 */}
                <div
                    onClick={() => onNavigate && onNavigate('worksheets')}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-orange-100">
                            <Microscope size={24} />
                        </div>
                        {opsMetrics.pendingSamples > 10 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                                Critical
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                Normal
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Samples</span>
                        <span className="text-4xl font-black text-slate-900 tracking-tight">{opsMetrics.pendingSamples}</span>
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-100">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                            <TrendingUp size={14} /> +50%
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Final Reports</span>
                        <span className="text-4xl font-black text-slate-900 tracking-tight">{opsMetrics.completedSamples}</span>
                    </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-100">
                            <TrendingUp size={24} />
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                            <ArrowUpRight size={14} /> +2%
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Revenue (PKR)</span>
                        <span className="text-4xl font-black text-slate-900 tracking-tight">{(finMetrics.totalCollected / 1000).toFixed(1)}k</span>
                    </div>
                </div>
            </div>

            {/* Charts & Activity Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column (Charts + AI) */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* Chart Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Sample Volume Trends</h3>
                            <div className="flex items-center gap-6 text-xs font-medium">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
                                    <span className="text-slate-600 font-bold">Incoming</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                                    <span className="text-slate-600 font-bold">Completed</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSamples" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600, fontSize: '12px', padding: '12px' }}
                                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area type="monotone" dataKey="samples" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSamples)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                                    <Area type="monotone" dataKey="published" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPub)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AI Assistant */}
                    <LabInsights />
                </div>

                {/* Right Column (Workload + Activity) */}
                <div className="flex flex-col gap-6">

                    {/* Dept Workload */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Department Workload</h3>
                            <button className="text-slate-400 hover:text-blue-600 transition-colors"><MoreHorizontal size={20} /></button>
                        </div>
                        <div className="space-y-6">
                            {deptStats.slice(0, 4).map((item, i) => (
                                <div key={i} className="group cursor-pointer p-2 -mx-2 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-slate-700 uppercase">{item.label}</span>
                                        <span className="text-xs font-bold text-slate-900">{Math.round((item.count / item.total) * 100)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${(item.count / item.total) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                            {deptStats.length === 0 && <div className="text-center text-xs text-slate-400 py-4">No data available</div>}
                        </div>
                    </div>

                    {/* Live Activity Log (Dark) */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex-1 text-white flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Live Activity Log
                            </h3>
                            <span className="text-[10px] text-slate-500 font-mono">Real-time</span>
                        </div>

                        <div className="space-y-0 relative overflow-hidden flex-1">
                            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-700"></div>

                            {liveLogs.length === 0 ? (
                                <div className="text-slate-600 text-xs pl-6">Waiting for activity...</div>
                            ) : (
                                liveLogs.map((log, i) => (
                                    <div key={log.id} className="relative pl-6 pb-6 group last:pb-0">
                                        <div className={`absolute left-0 top-1.5 w-3 h-3 bg-slate-900 border-2 rounded-full z-10 transition-transform group-hover:scale-125 ${log.action.includes('REJECT') ? 'border-red-500' :
                                                log.action.includes('CREATE') ? 'border-blue-500' :
                                                    log.action.includes('QC') ? 'border-amber-500' :
                                                        'border-green-500'
                                            }`}></div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors truncate pr-2">{log.user}</span>
                                                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{formatDateTime(log.timestamp).split(',')[1]}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 leading-snug">{log.details}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;