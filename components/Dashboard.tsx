
import React, { useMemo, useState, useEffect } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Activity, CheckCircle2, TrendingUp, ArrowRight, Microscope, SlidersHorizontal, Calendar, Download, Check, EyeOff, LayoutTemplate } from 'lucide-react';
import LabInsights from './LabInsights';
import { calculateOperations, calculateFinancials, getVolumeTrend, getDepartmentStats } from '../services/analyticsService';

interface DashboardProps {
    onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { requests, departments, auditLogs } = useLab();

  // Local View State with Persistence
  const [showConfig, setShowConfig] = useState(false);
  
  const [showFinancials, setShowFinancials] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dashboard_show_financials');
        return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [showActivity, setShowActivity] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dashboard_show_activity');
        return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem('dashboard_show_financials', JSON.stringify(showFinancials));
  }, [showFinancials]);

  useEffect(() => {
    localStorage.setItem('dashboard_show_activity', JSON.stringify(showActivity));
  }, [showActivity]);

  // Dynamic Stats Calculation using Shared Service
  const opsMetrics = useMemo(() => calculateOperations(requests), [requests]);
  const finMetrics = useMemo(() => calculateFinancials(requests), [requests]);
  const volumeData = useMemo(() => getVolumeTrend(requests), [requests]);
  const deptStats = useMemo(() => getDepartmentStats(requests, departments), [requests, departments]);
  
  // Last 3 logs for live stream
  const liveLogs = useMemo(() => auditLogs.slice(0, 3), [auditLogs]);

  const stats = [
    { label: 'Samples Received', value: opsMetrics.totalSamples.toString(), change: '+12%', icon: <Activity size={20} className="text-blue-600" />, trend: 'up' },
    { 
        label: 'Pending Samples', 
        value: opsMetrics.pendingSamples.toString(), 
        change: 'Active', 
        icon: <Microscope size={20} className="text-orange-600" />, 
        trend: 'neutral',
        action: () => onNavigate && onNavigate('samples') 
    },
    { label: 'Final Reports', value: opsMetrics.completedSamples.toString(), change: `${Math.round((opsMetrics.completedSamples/opsMetrics.totalSamples || 0)*100)}%`, icon: <CheckCircle2 size={20} className="text-emerald-600" />, trend: 'up' },
    { 
        label: 'Revenue (PKR)', 
        value: showFinancials ? (finMetrics.totalCollected/1000).toFixed(1) + 'k' : '****', 
        change: '+2%', 
        icon: showFinancials ? <TrendingUp size={20} className="text-rose-600" /> : <EyeOff size={20} className="text-slate-400" />, 
        trend: 'up' 
    },
  ];

  // Date for header
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const handleExport = () => {
    const csvContent = [
        ['Metric', 'Value', 'Trend'],
        ['Samples Received', opsMetrics.totalSamples, '+12%'],
        ['Pending Samples', opsMetrics.pendingSamples, 'Active'],
        ['Final Reports', opsMetrics.completedSamples, `${Math.round((opsMetrics.completedSamples/opsMetrics.totalSamples || 0)*100)}%`],
        ['Revenue', finMetrics.totalCollected, '+2%']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_snapshot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" onClick={() => setShowConfig(false)}>
      
      {/* Professional Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 z-20 relative">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 flex items-center gap-1.5 uppercase tracking-wide">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 System Online
              </span>
           </div>
           <p className="text-slate-500 text-sm font-medium">
              Real-time laboratory performance & workflow status
           </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden md:block text-right mr-2 border-r border-slate-100 pr-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Date</p>
              <div className="flex items-center gap-1.5 text-slate-700">
                 <Calendar size={14} className="text-slate-400" />
                 <span className="text-xs font-bold">{dateStr}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-2 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowConfig(!showConfig); }}
                className={`p-2 rounded-lg border transition-all ${showConfig ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-slate-500 hover:bg-slate-50 border-transparent hover:border-slate-200'}`} 
                title="View Settings"
              >
                  <SlidersHorizontal size={18} />
              </button>
              
              {/* Configuration Popover */}
              {showConfig && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-2 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 px-3 py-2 mb-1 border-b border-slate-50">
                        <LayoutTemplate size={14} className="text-slate-400"/>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View Preferences</span>
                    </div>
                    <button 
                        onClick={() => setShowFinancials(!showFinancials)}
                        className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors group"
                    >
                        <div className="flex flex-col">
                            <span>Financial Data</span>
                            <span className="text-[10px] text-slate-400">Show revenue & trends</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${showFinancials ? 'bg-blue-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all ${showFinancials ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </button>
                    <button 
                        onClick={() => setShowActivity(!showActivity)}
                        className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors group"
                    >
                         <div className="flex flex-col">
                            <span>Activity Widget</span>
                            <span className="text-[10px] text-slate-400">Recent system events</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${showActivity ? 'bg-blue-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all ${showActivity ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </button>
                </div>
              )}

              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
              >
                  <Download size={14} /> 
                  <span className="hidden sm:inline">Export Summary</span>
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={stat.action}
            className={`group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all ${stat.action ? 'cursor-pointer hover:border-blue-500 hover:shadow-lg' : 'cursor-default'}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">{stat.icon}</div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${
                stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 
                stat.trend === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'
              }`}>
                {stat.trend !== 'neutral' && <TrendingUp size={12} className={stat.trend === 'down' ? 'rotate-180' : ''} />}
                {stat.change}
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{stat.value}</p>
                {stat.action && <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Sample Volume Trends</h3>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Incoming</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
                   </div>
                </div>
             </div>
             <div className="h-[340px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={volumeData}>
                   <defs>
                     <linearGradient id="colorSamples" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '11px' }}
                   />
                   <Area type="monotone" dataKey="samples" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSamples)" />
                   <Area type="monotone" dataKey="published" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPub)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </div>
           
           <LabInsights />
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Department Workload</h3>
            <div className="space-y-8">
              {deptStats.length === 0 ? (
                 <div className="text-center text-slate-400 text-xs py-4">No data available</div>
              ) : (
                 deptStats.map((item, i) => (
                    <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{item.label}</span>
                        <span className="text-xs font-mono font-black text-slate-900">{Math.round((item.count/item.total)*100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${(item.count / item.total) * 100}%` }}></div>
                    </div>
                    </div>
                 ))
              )}
            </div>
          </div>

          {showActivity && (
            <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Recent Activity Log</h3>
              </div>
              <div className="space-y-6">
                  {liveLogs.length === 0 ? (
                      <div className="text-slate-500 text-xs text-center">No recent activity</div>
                  ) : (
                      liveLogs.map((log, i) => (
                      <div key={i} className="flex gap-4 items-start">
                          <div className="w-px h-10 bg-slate-800 mt-2"></div>
                          <div>
                          <p className="text-[11px] font-black text-slate-200">{log.user}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{log.action}: {log.resourceType}</p>
                          <p className="text-[9px] text-slate-600 font-mono mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                      </div>
                      ))
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
