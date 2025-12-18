
import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { ShieldCheck, History, FileCheck, ClipboardList, Play, Check, X, FileText, Activity, AlertTriangle, Plus } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

const Compliance: React.FC = () => {
  const { auditLogs, logQC } = useLab();
  
  const [selectedSop, setSelectedSop] = useState<string | null>(null);
  const [isQCModalOpen, setIsQCModalOpen] = useState(false);
  const [qcForm, setQcForm] = useState({
      instrument: 'Chemistry Analyzer',
      lotNumber: '',
      result: 'Pass',
      notes: ''
  });

  // Derived QC Status from Audit Logs
  const qcStatus = useMemo(() => {
    const instruments = ['Chemistry Analyzer', 'Blood Gas Module', 'Microscopy Station'];
    const statusMap: Record<string, { status: string, time: string, user: string }> = {};

    instruments.forEach(inst => {
        // Find latest QC_RUN log for this instrument
        // We look for QC_RUN actions on these specific instruments
        const latestLog = auditLogs.find(l => l.action === 'QC_RUN' && l.resourceId === inst);
        if (latestLog) {
            const isPass = latestLog.details.includes('Pass');
            const isFail = latestLog.details.includes('Fail');
            statusMap[inst] = {
                status: isPass ? 'Passed' : isFail ? 'Failed' : 'Unknown',
                time: latestLog.timestamp,
                user: latestLog.user
            };
        } else {
            statusMap[inst] = { status: 'Pending', time: '', user: '' };
        }
    });
    return statusMap;
  }, [auditLogs]);

  const handleRunQC = (e: React.FormEvent) => {
      e.preventDefault();
      logQC(qcForm.instrument, qcForm.result, `Lot: ${qcForm.lotNumber}. ${qcForm.notes}`);
      setIsQCModalOpen(false);
      setQcForm({ instrument: 'Chemistry Analyzer', lotNumber: '', result: 'Pass', notes: '' });
  };

  // Mock SOP Content
  const sops = {
    accessioning: {
      title: "SOP-ACC-01: Sample Accessioning",
      content: `1. Verify patient identity using two unique identifiers (Name, MRN).\n2. Check sample container integrity and volume.\n3. Label sample immediately with barcode.\n4. Log receipt time in LIMS.\n5. Rejection criteria: Hemolysis, Clotted, QNS.`
    },
    validation: {
      title: "SOP-VAL-02: Result Validation",
      content: `1. Review instrument flags and critical values.\n2. Correlate with patient history and previous results.\n3. For critical values, repeat test and notify clinician immediately.\n4. Electronic signature required for final release.`
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance & QC</h1>
          <p className="text-slate-500 font-medium">Audit trails, ISO 15189 logs, and QC verification</p>
        </div>
        <button 
            onClick={() => setIsQCModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
            <Activity size={18} /> Run Daily QC
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <History size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-900">System Audit Trail</h3>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No audit logs available yet.</div>
            ) : (
                auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 flex items-start gap-4 transition-colors">
                    <div className="text-[10px] font-mono font-bold text-slate-400 mt-1 w-32 shrink-0">{formatDateTime(log.timestamp)}</div>
                    <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{log.user}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action === 'REJECT' || (log.action === 'QC_RUN' && log.details.includes('Fail')) ? 'bg-red-100 text-red-700' :
                            log.action === 'FINANCE' || (log.action === 'QC_RUN' && log.details.includes('Pass')) ? 'bg-green-100 text-green-700' :
                            log.action === 'CREATE' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-500'
                        }`}>{log.action}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                    <p className="text-[10px] text-blue-500 mt-1 font-mono tracking-tight">{log.resourceType} :: {log.resourceId}</p>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="text-green-600" size={20} />
              <h3 className="font-bold text-slate-900">QC Status (Daily)</h3>
            </div>
            <div className="space-y-4">
              {['Chemistry Analyzer', 'Blood Gas Module', 'Microscopy Station'].map(inst => {
                  const data = qcStatus[inst];
                  const isPass = data.status === 'Passed';
                  const isFail = data.status === 'Failed';
                  const isPending = data.status === 'Pending';
                  
                  return (
                    <div key={inst} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <span className="text-slate-700 font-bold block">{inst}</span>
                            {!isPending && <span className="text-[10px] text-slate-400">Last: {formatDateTime(data.time).split(',')[1]}</span>}
                        </div>
                        <span className={`font-black uppercase text-[10px] flex items-center gap-1 ${
                            isPass ? 'text-green-600' : isFail ? 'text-red-600' : 'text-amber-600'
                        }`}>
                            {isPass ? <Check size={12} /> : isFail ? <X size={12} /> : <Activity size={12} />}
                            {data.status}
                        </span>
                    </div>
                  );
              })}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <ClipboardList size={20} /> Standard Operating Procedures
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              All analysis performed must adhere to documented SOP-v2.1. Audit logs are synced with cloud encryption for HIPAA compliance.
            </p>
            <div className="space-y-2">
              <div 
                onClick={() => setSelectedSop('accessioning')}
                className="p-3 bg-slate-800 rounded-lg text-xs flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <span className="font-bold">Accessioning SOP</span>
                <span className="text-blue-400 font-bold text-[10px]">READ</span>
              </div>
              <div 
                onClick={() => setSelectedSop('validation')}
                className="p-3 bg-slate-800 rounded-lg text-xs flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <span className="font-bold">Result Validation SOP</span>
                <span className="text-blue-400 font-bold text-[10px]">READ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QC Entry Modal */}
      {isQCModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-lg text-slate-900">Run Quality Control</h3>
                   <button onClick={() => setIsQCModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                   </button>
                </div>
                <form onSubmit={handleRunQC} className="space-y-4">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Instrument</label>
                       <select 
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={qcForm.instrument}
                          onChange={e => setQcForm({...qcForm, instrument: e.target.value})}
                       >
                          <option>Chemistry Analyzer</option>
                          <option>Blood Gas Module</option>
                          <option>Microscopy Station</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Control Lot Number</label>
                       <input 
                         className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                         placeholder="LOT-QC-2024-X"
                         value={qcForm.lotNumber}
                         onChange={e => setQcForm({...qcForm, lotNumber: e.target.value})}
                         required
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Result Status</label>
                       <div className="flex gap-2 mt-1">
                          <button 
                             type="button"
                             onClick={() => setQcForm({...qcForm, result: 'Pass'})}
                             className={`flex-1 py-2 rounded-lg font-bold text-sm border ${qcForm.result === 'Pass' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500'}`}
                          >
                             Pass
                          </button>
                          <button 
                             type="button"
                             onClick={() => setQcForm({...qcForm, result: 'Fail'})}
                             className={`flex-1 py-2 rounded-lg font-bold text-sm border ${qcForm.result === 'Fail' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-500'}`}
                          >
                             Fail
                          </button>
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Notes / Deviation</label>
                       <textarea 
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          rows={2}
                          placeholder="Optional comments..."
                          value={qcForm.notes}
                          onChange={e => setQcForm({...qcForm, notes: e.target.value})}
                       />
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-lg transition-all mt-2">
                       Submit QC Record
                    </button>
                </form>
             </div>
          </div>
      )}

      {/* SOP Modal */}
      {selectedSop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-900">{sops[selectedSop as keyof typeof sops].title}</h3>
                      <button onClick={() => setSelectedSop(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 flex gap-2">
                          <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                          <p className="text-xs text-amber-800">
                              Reading this SOP is logged for compliance. Ensure you understand all steps before proceeding.
                          </p>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                          {sops[selectedSop as keyof typeof sops].content}
                      </pre>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button 
                        onClick={() => setSelectedSop(null)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md"
                      >
                          Acknowledge & Close
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Compliance;
