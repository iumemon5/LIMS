
import React, { useMemo, useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { calculateFinancials, getReferrerStats } from '../services/analyticsService';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  ArrowUpRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

const Reports: React.FC = () => {
  const { requests, patients, logReportGeneration, auditLogs } = useLab();
  const [successMsg, setSuccessMsg] = useState('');
  
  // View states
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [dateRange, setDateRange] = useState<'All' | '30Days'>('All');

  // Filter requests based on date range
  const filteredRequests = useMemo(() => {
      if (dateRange === 'All') return requests;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return requests.filter(r => new Date(r.dateReceived) >= cutoff);
  }, [requests, dateRange]);

  // Dynamic calculations via Service Layer
  const financials = useMemo(() => calculateFinancials(filteredRequests), [filteredRequests]);
  const referrerStats = useMemo(() => getReferrerStats(filteredRequests), [filteredRequests]);
  
  // Real generated report logs
  const generatedReports = useMemo(() => {
    const logs = auditLogs.filter(l => l.action === 'REPORT_GENERATE');
    return showAllLogs ? logs : logs.slice(0, 5);
  }, [auditLogs, showAllLogs]);
  
  const today = new Date().toISOString().split('T')[0];
  const totalPatients = patients.length;

  const handleGenerateReport = (type: string, dataFn: () => string) => {
    // 1. Generate CSV Data
    const csvContent = dataFn();
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    
    // 2. Trigger Download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type.replace(/\s+/g, '_')}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 3. Log Action
    logReportGeneration(type, 'CSV');
    setSuccessMsg(`Generated ${type}`);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  // CSV Generators
  const generateBusinessReport = () => {
     const headers = ['Metric', 'Value'];
     const rows = [
        ['Total Billed', financials.totalBilled],
        ['Total Collected', financials.totalCollected],
        ['Outstanding', financials.outstanding],
        ['Today Collected', financials.todayCollected],
        ['Recovery Rate', financials.recoveryRate.toFixed(2) + '%']
     ];
     return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generateReferrerReport = () => {
     const headers = ['Referrer Name', 'Total Requests'];
     const rows = referrerStats.ranking.map(r => [r[0], r[1]]);
     return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const generatePatientAudit = () => {
     const headers = ['MRN', 'Name', 'Age', 'Gender', 'Contact'];
     const rows = patients.map(p => [p.mrn, `"${p.firstName} ${p.lastName}"`, p.age, p.gender, p.contact]);
     return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const reportTypes = [
    { 
      title: 'Daily Business Report', 
      desc: `Total collection for today (${today}) is ${formatCurrency(financials.todayCollected)}.`, 
      value: formatCurrency(financials.todayCollected),
      icon: <TrendingUp className="text-green-600" />,
      action: () => handleGenerateReport('Daily Business Report', generateBusinessReport)
    },
    { 
      title: 'Registration Audit', 
      desc: `Currently managing ${totalPatients} patient records in the system.`, 
      value: `${totalPatients} Records`,
      icon: <Users className="text-blue-600" />,
      action: () => handleGenerateReport('Patient Registration Audit', generatePatientAudit)
    },
    { 
      title: 'Referrer Analysis', 
      desc: `Top source: ${referrerStats.topReferrer} with ${referrerStats.topCount} referrals.`, 
      value: `Top: ${referrerStats.topReferrer}`,
      icon: <FileText className="text-orange-600" />,
      action: () => handleGenerateReport('Referrer Analysis', generateReferrerReport)
    },
    { 
      title: 'Dept-wise Revenue', 
      desc: 'Financial performance breakdown across all active departments.', 
      value: 'View CSV',
      icon: <BarChart3 className="text-purple-600" />,
      action: () => handleGenerateReport('Department Revenue', generateBusinessReport)
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Intelligence & Reports</h1>
          <p className="text-slate-500 font-medium">Generate clinical and financial performance statements</p>
        </div>
        <div className="flex gap-3 items-center">
          {successMsg && (
             <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-right-2">
                <CheckCircle2 size={16} /> {successMsg}
             </div>
          )}
          <button 
            onClick={() => setDateRange(dateRange === 'All' ? '30Days' : 'All')}
            className={`flex items-center gap-2 border px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${
                dateRange === '30Days' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar size={18} /> {dateRange === '30Days' ? 'Last 30 Days' : 'All Time'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report, i) => (
          <div 
            key={i} 
            onClick={report.action}
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 transition-all cursor-pointer flex flex-col h-full active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:scale-110 transition-all">
              {report.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{report.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{report.desc}</p>
            <div className="mb-4">
               <span className="text-xl font-black text-slate-900 tracking-tight">{report.value}</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Generate CSV</span>
              <ArrowUpRight size={16} className="text-blue-600 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Report Generation History</h3>
          <button 
            onClick={() => setShowAllLogs(!showAllLogs)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            {showAllLogs ? 'Show Less' : 'View All Logs'}
          </button>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {generatedReports.length === 0 ? (
             <div className="p-8 text-center text-slate-400 text-sm font-medium">No reports generated yet.</div>
          ) : (
            generatedReports.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText size={20} />
                    </div>
                    <div>
                    <p className="text-sm font-bold text-slate-800">{log.resourceType}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{log.details} · {formatDateTime(log.timestamp)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black">CSV</span>
                    <span className="text-[10px] font-bold text-slate-400">by {log.user}</span>
                </div>
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
