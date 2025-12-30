import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { SampleStatus, AnalysisRequest } from '../types';
import { detectAnomalies } from '../services/geminiService';
import { formatDate } from '../utils/formatters';
import { 
  MoreVertical, Filter, Download, ExternalLink, Microscope, 
  FlaskConical, X, Save, CheckCircle2, Sparkles, AlertTriangle, Printer,
  Ban, Clock, FileCheck, RotateCcw, Edit2
} from 'lucide-react';

const SampleList: React.FC = () => {
  const { requests, clients, updateAnalysisResult, updateRequestStatus, rejectSample, resetSampleStatus, patients, settings } = useLab();
  
  // Refactor: Use ID instead of object copy to keep UI in sync with Context updates
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const selectedRequest = useMemo(() => requests.find(r => r.id === selectedRequestId) || null, [requests, selectedRequestId]);
  
  // Rejection State
  const [rejectingRequest, setRejectingRequest] = useState<AnalysisRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Print State
  const [reportToPrint, setReportToPrint] = useState<AnalysisRequest | null>(null);

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Verified'>('All');

  const filteredRequests = requests.filter(req => {
      // 1. Text Filter
      if (filterText) {
          const term = filterText.toLowerCase();
          const patient = patients.find(p => p.id === req.patientId);
          const client = clients.find(c => c.id === req.clientId);
          const matchesText = req.id.toLowerCase().includes(term) ||
              req.sampleType.toLowerCase().includes(term) ||
              patient?.firstName.toLowerCase().includes(term) ||
              patient?.lastName.toLowerCase().includes(term) ||
              client?.name.toLowerCase().includes(term);
          
          if (!matchesText) return false;
      }

      // 2. Tab Status Filter
      if (activeTab === 'Pending') {
          return req.status === SampleStatus.RECEIVED || req.status === SampleStatus.COLLECTED || req.status === SampleStatus.IN_LAB || req.status === SampleStatus.TESTING;
      }
      if (activeTab === 'Verified') {
          return req.status === SampleStatus.VERIFIED || req.status === SampleStatus.PUBLISHED;
      }
      
      return true;
  });

  const getStatusColor = (status: SampleStatus) => {
    switch (status) {
      case SampleStatus.PUBLISHED: return 'bg-green-100 text-green-700';
      case SampleStatus.TESTING: return 'bg-blue-100 text-blue-700';
      case SampleStatus.IN_LAB: return 'bg-purple-100 text-purple-700';
      case SampleStatus.VERIFIED: return 'bg-amber-100 text-amber-700';
      case SampleStatus.REJECTED: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Emergency': return 'text-red-600 font-bold';
      case 'Urgent': return 'text-amber-600 font-bold';
      default: return 'text-slate-500';
    }
  };

  const handleResultChange = (keyword: string, val: string) => {
    if (selectedRequest) {
      updateAnalysisResult(selectedRequest.id, keyword, val);
      // No local state update needed, Context update will trigger re-render via selectedRequest useMemo
    }
  };

  const finalizeResults = () => {
    if (selectedRequest) {
        updateRequestStatus(selectedRequest.id, SampleStatus.VERIFIED);
        setSelectedRequestId(null);
        setAiAnalysisResult(null);
    }
  };
  
  const handleRejectConfirm = () => {
      if (rejectingRequest && rejectionReason) {
          rejectSample(rejectingRequest.id, rejectionReason);
          setRejectingRequest(null);
          setRejectionReason('');
      }
  };

  const handleRestore = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to restore this rejected sample? It will move back to the Received queue.')) {
          resetSampleStatus(id);
      }
  };

  const handlePrint = () => {
      window.print();
  };

  const handleExport = () => {
      const headers = ['RequestID', 'Patient/Client', 'SampleType', 'Date', 'Status', 'Priority'];
      const rows = filteredRequests.map(req => {
          const p = patients.find(pt => pt.id === req.patientId);
          const c = clients.find(cl => cl.id === req.clientId);
          const name = c ? c.name : `${p?.firstName} ${p?.lastName}`;
          return [req.id, `"${name}"`, req.sampleType, req.dateReceived, req.status, req.priority];
      });
      
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sample_list_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const runAIAnalysis = async () => {
    if (!selectedRequest) return;
    
    setIsAnalyzing(true);
    setAiAnalysisResult(null);

    // Prepare data for the first filled result to demo
    const filledTest = selectedRequest.analyses.find(a => a.result && a.result.length > 0);
    
    if (!filledTest) {
      setAiAnalysisResult("Please enter at least one result value to analyze.");
      setIsAnalyzing(false);
      return;
    }

    const payload = {
      sampleType: selectedRequest.sampleType,
      title: filledTest.title,
      keyword: filledTest.keyword,
      result: filledTest.result,
      unit: filledTest.unit,
      range: filledTest.referenceRange || 'Standard'
    };

    const analysis = await detectAnomalies(payload);
    setAiAnalysisResult(analysis || "AI Service unavailable.");
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Workbench</h1>
          <p className="text-slate-500">Manage daily sample processing and results</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Tab Filters */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('All')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'All' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                <FlaskConical size={16} /> All Samples
            </button>
            <button 
                onClick={() => setActiveTab('Pending')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'Pending' ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                <Clock size={16} /> Pending Work
            </button>
            <button 
                onClick={() => setActiveTab('Verified')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'Verified' ? 'border-green-600 text-green-600 bg-green-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                <FileCheck size={16} /> Verified / Published
            </button>
        </div>

        {showFilters && (
            <div className="p-4 bg-slate-50 border-b border-slate-200 animate-in fade-in slide-in-from-top-2">
                <input 
                    autoFocus
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Filter by ID, Patient Name, or Client..."
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                />
            </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Request ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Client / Patient</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Sample Type</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Received</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Priority</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                            <Microscope size={48} className="mb-2 opacity-20" />
                            <p className="font-medium">No samples found for this filter.</p>
                        </div>
                    </td>
                </tr>
            ) : (
                filteredRequests.slice().reverse().map((req) => {
                const client = clients.find(c => c.id === req.clientId);
                const patient = patients.find(p => p.id === req.patientId);
                return (
                    <tr key={req.id} className={`hover:bg-slate-50 transition-colors group ${req.status === SampleStatus.REJECTED ? 'bg-red-50/50' : ''}`}>
                    <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-blue-600 flex items-center gap-1">
                        {req.id}
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        {client ? (
                        <div className="text-sm font-bold text-slate-700 flex items-center gap-1"><FlaskConical size={12}/> {client.name}</div>
                        ) : (
                        <div className="text-sm font-medium text-slate-700">{patient?.firstName} {patient?.lastName}</div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.sampleType}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(req.dateReceived)}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(req.status)}`}>
                        {req.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                        <span className={getPriorityColor(req.priority)}>{req.priority}</span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                        {req.status === SampleStatus.VERIFIED || req.status === SampleStatus.PUBLISHED ? (
                            <>
                                <button 
                                    onClick={() => setReportToPrint(req)}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-slate-200"
                                    title="Print Report"
                                >
                                    <Printer size={16} /> Print
                                </button>
                                <button 
                                    onClick={() => setSelectedRequestId(req.id)}
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                    title="Edit Result (Will revert to Testing)"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </>
                        ) : req.status === SampleStatus.REJECTED ? (
                            <button 
                                onClick={(e) => handleRestore(e, req.id)}
                                className="flex items-center gap-1 p-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-bold"
                                title="Undo Rejection"
                            >
                                <RotateCcw size={14} /> Restore
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setSelectedRequestId(req.id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                    title="Enter Results"
                                >
                                    <Microscope size={16} /> Enter
                                </button>
                                <button 
                                    onClick={() => setRejectingRequest(req)}
                                    className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                    title="Reject Sample"
                                >
                                    <Ban size={16} />
                                </button>
                            </>
                        )}
                    </td>
                    </tr>
                );
                })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Rejection Modal */}
      {rejectingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border-t-4 border-red-500">
                <div className="flex items-start gap-4 mb-4">
                   <div className="p-3 bg-red-100 rounded-full text-red-600">
                      <AlertTriangle size={24} />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-slate-900">Reject Sample?</h3>
                      <p className="text-sm text-slate-500 mt-1">
                         This will stop processing for request <span className="font-mono font-bold text-slate-700">{rejectingRequest.id}</span>.
                      </p>
                   </div>
                </div>
                
                <div className="mb-6">
                   <label className="text-xs font-bold text-slate-500 uppercase">Reason for Rejection</label>
                   <select 
                      className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                   >
                      <option value="">Select a reason...</option>
                      <option>Hemolyzed Sample</option>
                      <option>Clotted Sample</option>
                      <option>Insufficient Quantity (QNS)</option>
                      <option>Wrong Tube / Container</option>
                      <option>Label Mismatch</option>
                      <option>Sample Leaked</option>
                   </select>
                </div>

                <div className="flex gap-3">
                   <button onClick={() => setRejectingRequest(null)} className="flex-1 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                   <button onClick={handleRejectConfirm} disabled={!rejectionReason} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      Confirm Reject
                   </button>
                </div>
             </div>
          </div>
      )}

      {/* Result Entry Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <FlaskConical size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">Result Entry Worksheet</h3>
                    <p className="text-sm text-slate-500 flex gap-2">
                       <span className="font-mono font-bold text-slate-700">{selectedRequest.id}</span>
                       <span>•</span>
                       <span>{selectedRequest.priority} Priority</span>
                    </p>
                  </div>
               </div>
               <button onClick={() => { setSelectedRequestId(null); setAiAnalysisResult(null); }} className="text-slate-400 hover:text-red-500 transition-colors">
                 <X size={24} />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-8">
                   <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Patient ID</div>
                      <div className="font-bold text-slate-900">{selectedRequest.patientId}</div>
                   </div>
                   <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Sample Type</div>
                      <div className="font-bold text-slate-900">{selectedRequest.sampleType}</div>
                   </div>
                   <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Referrer</div>
                      <div className="font-bold text-slate-900">{selectedRequest.referrer}</div>
                   </div>
                   <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Current Status</div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(selectedRequest.status)}`}>
                         {selectedRequest.status}
                      </span>
                   </div>
                </div>

                {/* AI Banner */}
                {aiAnalysisResult && (
                  <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <Sparkles className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-indigo-900 text-sm">AI Analysis Report</h4>
                      <p className="text-sm text-indigo-700 mt-1">{aiAnalysisResult}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                          <th className="py-3 pl-2">Test Name</th>
                          <th className="py-3">Result Value</th>
                          <th className="py-3">Unit</th>
                          <th className="py-3">Ref. Range</th>
                          <th className="py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedRequest.analyses.map((test, i) => (
                          <tr key={test.keyword} className="hover:bg-slate-50/50">
                            <td className="py-4 pl-2">
                               <div className="font-bold text-slate-900">{test.title}</div>
                               <div className="text-xs font-mono text-slate-400">{test.keyword}</div>
                            </td>
                            <td className="py-4">
                               <input 
                                 autoFocus={i === 0}
                                 className="border border-slate-200 bg-white rounded-lg px-3 py-2 w-full max-w-[160px] font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                                 value={test.result || ''}
                                 onChange={(e) => handleResultChange(test.keyword, e.target.value)}
                                 placeholder="--"
                               />
                            </td>
                            <td className="py-4 text-sm text-slate-500 font-medium">
                               {test.unit || 'mg/dL'}
                            </td>
                            <td className="py-4 text-sm text-slate-500">
                               {test.referenceRange || '0.0 - 10.0'}
                            </td>
                            <td className="py-4 text-right">
                               {test.result ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                    <CheckCircle2 size={12} /> Entered
                                  </span>
                               ) : (
                                  <span className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded-full">Pending</span>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>

             <div className="px-8 py-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <button 
                     onClick={runAIAnalysis}
                     disabled={isAnalyzing}
                     className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                   >
                     {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <><Sparkles size={16} /> Audit with AI</>}
                   </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setSelectedRequestId(null); setAiAnalysisResult(null); }} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100">
                    Close
                  </button>
                  <button 
                    onClick={finalizeResults}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2"
                  >
                    <Save size={18} /> {selectedRequest.status === SampleStatus.VERIFIED ? 'Save Changes' : 'Verify & Submit'}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {reportToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in print-reset-parent">
           <div className="printable-document bg-white w-full max-w-3xl h-[90vh] shadow-2xl overflow-hidden flex flex-col relative rounded-xl print:max-w-none print:shadow-none print:rounded-none print:h-auto print:overflow-visible print:w-full">
              {/* Toolbar */}
              <div className="print-hidden p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-700">Print Preview</h3>
                 <div className="flex gap-2">
                    <button onClick={() => setReportToPrint(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Close</button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                       <Printer size={16} /> Print Report
                    </button>
                 </div>
              </div>

              {/* A4 Paper Canvas */}
              <div className="flex-1 overflow-y-auto bg-slate-100 p-8 print:p-0 print:bg-white print:overflow-visible">
                 <div className="bg-white w-full min-h-full shadow-lg p-12 mx-auto print:shadow-none print:w-full print:mx-0 print:p-12">
                    
                    {/* Report Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                       <div>
                          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">{settings.name}</h1>
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Laboratory & Diagnostic Centre</p>
                          <p className="text-xs text-slate-500 mt-2">{settings.address}</p>
                          <p className="text-xs text-slate-500">Ph: {settings.phone} | {settings.website}</p>
                       </div>
                       <div className="text-right">
                          <div className="bg-slate-900 text-white px-3 py-1 text-sm font-bold inline-block mb-2 print:text-black print:bg-transparent print:border print:border-black">FINAL REPORT</div>
                          <p className="text-xs font-mono text-slate-500">Report ID: {reportToPrint.id}</p>
                          <p className="text-xs font-mono text-slate-500">Printed: {new Date().toLocaleString()}</p>
                       </div>
                    </div>

                    {/* Patient Demographics */}
                    {(() => {
                        const p = patients.find(pat => pat.id === reportToPrint.patientId);
                        return (
                           <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm mb-8 bg-slate-50 p-4 border border-slate-100 rounded-lg print:border-none print:p-0 print:bg-transparent">
                              <div className="flex">
                                 <span className="w-24 font-bold text-slate-500 uppercase text-xs pt-0.5">Patient Name:</span>
                                 <span className="font-bold text-slate-900">{p?.title} {p?.firstName} {p?.lastName}</span>
                              </div>
                              <div className="flex">
                                 <span className="w-24 font-bold text-slate-500 uppercase text-xs pt-0.5">MRN:</span>
                                 <span className="font-mono text-slate-900">{p?.mrn}</span>
                              </div>
                              <div className="flex">
                                 <span className="w-24 font-bold text-slate-500 uppercase text-xs pt-0.5">Age / Gender:</span>
                                 <span className="text-slate-900">{p?.age} {p?.ageUnit} / {p?.gender}</span>
                              </div>
                              <div className="flex">
                                 <span className="w-24 font-bold text-slate-500 uppercase text-xs pt-0.5">Referred By:</span>
                                 <span className="text-slate-900">{reportToPrint.referrer}</span>
                              </div>
                              {p?.relationName && (
                                <div className="flex">
                                    <span className="w-24 font-bold text-slate-500 uppercase text-xs pt-0.5">{p.relationType}:</span>
                                    <span className="text-slate-900">{p.relationName}</span>
                                </div>
                              )}
                              <div className="flex">
                                 <span className="w-24 font-bold text-slate-500 uppercase text-xs pt-0.5">Date Rec:</span>
                                 <span className="text-slate-900">{formatDate(reportToPrint.dateReceived)}</span>
                              </div>
                           </div>
                        )
                    })()}

                    {/* Results Table */}
                    <div className="mb-8">
                       <h3 className="font-bold text-lg text-slate-900 border-b border-slate-200 pb-2 mb-4">
                          {reportToPrint.sampleType} Analysis
                       </h3>
                       <table className="w-full text-left text-sm">
                          <thead>
                             <tr className="border-b border-slate-300">
                                <th className="py-2 font-black text-slate-900 uppercase">Test Description</th>
                                <th className="py-2 font-black text-slate-900 uppercase text-center">Result</th>
                                <th className="py-2 font-black text-slate-900 uppercase">Unit</th>
                                <th className="py-2 font-black text-slate-900 uppercase">Reference Range</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {reportToPrint.analyses.map((test, i) => (
                                <tr key={i}>
                                   <td className="py-2 font-medium text-slate-800">{test.title}</td>
                                   <td className="py-2 font-bold text-slate-900 text-center">{test.result}</td>
                                   <td className="py-2 text-slate-600">{test.unit}</td>
                                   <td className="py-2 text-slate-600">{test.referenceRange}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-20 pt-8 border-t border-slate-200 flex justify-between items-end break-inside-avoid">
                       <div className="text-xs text-slate-400 max-w-xs">
                          <p>Electronically Verified Report.</p>
                          <p>This report is generated by {settings.name} and does not require a physical signature for verification.</p>
                       </div>
                       <div className="text-center">
                          <div className="h-12 w-32 mx-auto mb-2 border-b border-slate-900/20">
                             {/* Signature Placeholder */}
                             <div className="font-script text-2xl text-slate-900/80">Dr. Faisal</div>
                          </div>
                          <p className="font-bold text-sm text-slate-900">Dr. Faisal Khan</p>
                          <p className="text-xs text-slate-500 uppercase font-bold">Consultant Pathologist</p>
                       </div>
                    </div>

                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SampleList;