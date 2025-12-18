
import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  FileSpreadsheet, Plus, Filter, Search, 
  ChevronRight, Beaker, CheckCircle2, Lock, 
  FlaskConical, User, AlertCircle, X, Save
} from 'lucide-react';
import { SampleStatus, AnalysisRequest, Worksheet } from '../types';

const Worksheets: React.FC = () => {
  const { worksheets, departments, requests, patients, createWorksheet, updateAnalysisResult, updateRequestStatus, closeWorksheet, user } = useLab();
  
  // States
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [activeWorksheet, setActiveWorksheet] = useState<Worksheet | null>(null);

  // Helper: Find requests eligible for a worksheet (Pending/Received status + contains tests for dept)
  const eligibleRequests = useMemo(() => {
    if (!selectedDeptId) return [];
    const deptTests = departments.find(d => d.id === selectedDeptId)?.tests.map(t => t.code) || [];
    
    return requests.filter(req => {
       const hasDeptTest = req.analyses.some(a => deptTests.includes(a.keyword) && a.status !== 'Complete');
       return (req.status === SampleStatus.RECEIVED || req.status === SampleStatus.COLLECTED) && hasDeptTest;
    });
  }, [selectedDeptId, requests, departments]);

  const handleCreateWorksheet = () => {
     if (!selectedDeptId || selectedRequestIds.length === 0) return;

     const dept = departments.find(d => d.id === selectedDeptId);
     const id = `WS-${new Date().getFullYear()}-${String(worksheets.length + 1).padStart(4, '0')}`;
     
     const entries = selectedRequestIds.map(rid => {
        const req = requests.find(r => r.id === rid);
        const p = patients.find(pat => pat.id === req?.patientId);
        return {
           requestId: rid,
           patientName: `${p?.firstName} ${p?.lastName}`,
           sampleType: req?.sampleType || 'Unknown',
           priority: req?.priority || 'Normal'
        };
     });

     // Add missing metadata for BaseEntity compliance
     const timestamp = new Date().toISOString();
     const userName = user?.name || 'System';

     const newWS: Worksheet = {
        id,
        name: `${dept?.name} Run ${new Date().toLocaleDateString()}`,
        departmentId: selectedDeptId,
        analyst: userName, 
        status: 'Open',
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: userName,
        entries
     };

     createWorksheet(newWS);
     setView('list');
     setSelectedDeptId('');
     setSelectedRequestIds([]);
  };

  const toggleSelection = (id: string) => {
     if (selectedRequestIds.includes(id)) {
        setSelectedRequestIds(prev => prev.filter(i => i !== id));
     } else {
        setSelectedRequestIds(prev => [...prev, id]);
     }
  };

  const handleBatchVerify = () => {
     if (!activeWorksheet) return;
     // Update all requests in this worksheet to Verified
     activeWorksheet.entries.forEach(entry => {
        updateRequestStatus(entry.requestId, SampleStatus.VERIFIED);
     });
     closeWorksheet(activeWorksheet.id);
     setActiveWorksheet(null);
     setView('list');
  };

  // Render List View
  if (view === 'list') {
    return (
       <div className="space-y-6">
          <div className="flex justify-between items-end">
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Worksheets & Batches</h1>
                <p className="text-slate-500 font-medium mt-1">Group samples for instrument runs and batch entry</p>
             </div>
             <button 
               onClick={() => setView('create')}
               className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
             >
                <Plus size={18} /> New Worksheet
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {worksheets.length === 0 ? (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                   <FileSpreadsheet size={48} className="mb-4 opacity-50" />
                   <p className="font-bold">No active worksheets</p>
                   <p className="text-sm">Create a new worksheet to start batch processing</p>
                </div>
             ) : (
                worksheets.slice().reverse().map(ws => (
                   <div 
                     key={ws.id}
                     onClick={() => { setActiveWorksheet(ws); setView('detail'); }}
                     className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                   >
                      <div className="flex justify-between items-start mb-4">
                         <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileSpreadsheet size={20} />
                         </div>
                         <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                            ws.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                         }`}>
                            {ws.status}
                         </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{ws.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mb-4">{ws.id}</p>
                      
                      <div className="space-y-2 mb-4">
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Department</span>
                            <span className="font-bold text-slate-700">{departments.find(d => d.id === ws.departmentId)?.name}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Samples</span>
                            <span className="font-bold text-slate-700">{ws.entries.length}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Created</span>
                            <span className="font-medium text-slate-700">{ws.createdAt.split(',')[0]}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Analyst</span>
                            <span className="font-medium text-slate-700">{ws.analyst}</span>
                         </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-sm">
                         <span>Open Worksheet</span>
                         <ChevronRight size={16} />
                      </div>
                   </div>
                ))
             )}
          </div>
       </div>
    );
  }

  // Render Detail/Entry View
  if (view === 'detail' && activeWorksheet) {
     const dept = departments.find(d => d.id === activeWorksheet.departmentId);
     // Get all tests available in this department to create columns
     const columns = dept?.tests || [];

     return (
        <div className="flex flex-col h-[calc(100vh-140px)] -m-4">
           {/* Header */}
           <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                 <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                    <ChevronRight size={20} className="rotate-180" />
                 </button>
                 <div>
                    <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                       {activeWorksheet.name}
                       {activeWorksheet.status === 'Closed' && <Lock size={16} className="text-slate-400" />}
                    </h1>
                    <p className="text-sm text-slate-500 font-mono">{activeWorksheet.id} · {activeWorksheet.entries.length} Samples · {activeWorksheet.analyst}</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 {activeWorksheet.status === 'Open' && (
                    <button 
                       onClick={handleBatchVerify}
                       className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2"
                    >
                       <CheckCircle2 size={16} /> Close & Verify Batch
                    </button>
                 )}
              </div>
           </div>

           {/* Grid */}
           <div className="flex-1 overflow-auto bg-slate-50 p-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                             <th className="px-4 py-3 text-xs font-black uppercase text-slate-500 w-16 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">ID</th>
                             <th className="px-4 py-3 text-xs font-black uppercase text-slate-500 w-48 sticky left-16 bg-slate-50 z-10 border-r border-slate-200">Patient</th>
                             {columns.map(col => (
                                <th key={col.code} className="px-4 py-3 text-xs font-black uppercase text-slate-500 whitespace-nowrap min-w-[120px]">
                                   {col.name} ({col.code})
                                </th>
                             ))}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {activeWorksheet.entries.map(entry => {
                             const req = requests.find(r => r.id === entry.requestId);
                             if (!req) return null;

                             return (
                                <tr key={entry.requestId} className="hover:bg-blue-50/30 transition-colors">
                                   <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 sticky left-0 bg-white group-hover:bg-blue-50/30 border-r border-slate-100">
                                      {entry.requestId}
                                   </td>
                                   <td className="px-4 py-3 sticky left-16 bg-white group-hover:bg-blue-50/30 border-r border-slate-100">
                                      <div className="text-sm font-bold text-slate-900">{entry.patientName}</div>
                                      <div className="text-[10px] text-slate-400">{entry.priority}</div>
                                   </td>
                                   {columns.map(col => {
                                      const analysis = req.analyses.find(a => a.keyword === col.code);
                                      if (!analysis) return <td key={col.code} className="px-4 py-3 bg-slate-50/50"></td>;

                                      return (
                                         <td key={col.code} className="px-4 py-3">
                                            <input 
                                               disabled={activeWorksheet.status === 'Closed' || analysis.status === 'Complete'}
                                               className={`w-full border rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 ${
                                                  analysis.result ? 'border-green-300 bg-green-50 text-green-800' : 'border-slate-200'
                                               }`}
                                               placeholder="--"
                                               value={analysis.result || ''}
                                               onChange={e => updateAnalysisResult(req.id, col.code, e.target.value)}
                                            />
                                         </td>
                                      );
                                   })}
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  // Render Creation Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="font-bold text-lg text-slate-900">Create New Worksheet</h3>
             <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
             </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
             {/* Left: Department Selection */}
             <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Department</label>
                {departments.map(dept => (
                   <button
                     key={dept.id}
                     onClick={() => { setSelectedDeptId(dept.id); setSelectedRequestIds([]); }}
                     className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex justify-between items-center transition-all ${
                        selectedDeptId === dept.id 
                           ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                           : 'bg-white text-slate-600 hover:bg-slate-200'
                     }`}
                   >
                      {dept.name}
                      {selectedDeptId === dept.id && <ChevronRight size={16} />}
                   </button>
                ))}
             </div>

             {/* Right: Pending Samples */}
             <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                   <div>
                      <h4 className="font-bold text-slate-900">Pending Samples</h4>
                      <p className="text-xs text-slate-500">Select samples to add to this batch</p>
                   </div>
                   {selectedDeptId && (
                      <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                         {eligibleRequests.length} Available
                      </div>
                   )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                   {!selectedDeptId ? (
                      <div className="h-full flex items-center justify-center text-slate-400">
                         <div className="text-center">
                            <Filter size={48} className="mx-auto mb-2 opacity-20" />
                            <p>Select a department to view pending samples</p>
                         </div>
                      </div>
                   ) : eligibleRequests.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400">
                         <p>No pending samples for this department</p>
                      </div>
                   ) : (
                      <div className="space-y-2">
                         {eligibleRequests.map(req => {
                            const p = patients.find(pat => pat.id === req.patientId);
                            const isSelected = selectedRequestIds.includes(req.id);
                            
                            return (
                               <div 
                                 key={req.id}
                                 onClick={() => toggleSelection(req.id)}
                                 className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                                    isSelected 
                                       ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                                       : 'bg-white border-slate-200 hover:border-blue-300'
                                 }`}
                               >
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                     isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                                  }`}>
                                     {isSelected && <CheckCircle2 size={14} className="text-white" />}
                                  </div>
                                  <div className="flex-1">
                                     <div className="flex justify-between">
                                        <span className="font-bold text-slate-900">{p?.firstName} {p?.lastName}</span>
                                        <span className="font-mono text-xs text-slate-400">{req.id}</span>
                                     </div>
                                     <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Beaker size={12}/> {req.sampleType}</span>
                                        {req.priority === 'Emergency' && (
                                           <span className="text-red-600 font-bold flex items-center gap-1"><AlertCircle size={12}/> Emergency</span>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   )}
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                   <button onClick={() => setView('list')} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200">Cancel</button>
                   <button 
                     onClick={handleCreateWorksheet}
                     disabled={selectedRequestIds.length === 0}
                     className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                   >
                      Create Worksheet ({selectedRequestIds.length})
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Worksheets;
