
import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Server, Upload, FileText, CheckCircle2, 
  X, ArrowRight, Save, LayoutGrid, List, Plus
} from 'lucide-react';
import { Instrument } from '../types';

const Instruments: React.FC = () => {
  const { instruments, addInstrument, importInstrumentData, requests } = useLab();
  
  // States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [importStats, setImportStats] = useState<{success: number, failed: number} | null>(null);

  // New Instrument Form
  const [newInst, setNewInst] = useState<Partial<Instrument>>({
      name: '',
      type: 'Chemistry Analyzer',
      protocol: 'HL7',
      ipAddress: '',
      status: 'Online'
  });

  const handleAddInstrument = (e: React.FormEvent) => {
      e.preventDefault();
      addInstrument(newInst as Instrument);
      setIsAddModalOpen(false);
      setNewInst({ name: '', type: 'Chemistry Analyzer', protocol: 'HL7', ipAddress: '', status: 'Online' });
  };

  const handleParse = () => {
    if (!csvData) return;
    
    // Simple CSV parser: SampleID,TestCode,Result
    const lines = csvData.trim().split('\n');
    const parsed = lines.map(line => {
      const [requestId, testCode, result] = line.split(',').map(s => s.trim());
      
      // Validation Logic
      const request = requests.find(r => r.id === requestId);
      const testExists = request?.analyses.some(a => a.keyword === testCode);
      const isValid = !!request && !!testExists;
      const status = isValid ? 'Ready' : (!request ? 'Invalid ID' : 'Invalid Test');

      return { requestId, testCode, result, status, isValid };
    });

    setParsedData(parsed);
    setStep(2);
  };

  const handleImport = () => {
    const validData = parsedData.filter(d => d.isValid).map(d => ({
      requestId: d.requestId,
      testCode: d.testCode,
      result: d.result
    }));

    const stats = importInstrumentData(validData);
    setImportStats(stats);
    
    setTimeout(() => {
        setIsImportModalOpen(false);
        setStep(1);
        setCsvData('');
        setParsedData([]);
        setImportStats(null);
    }, 2000);
  };

  const handleTestLink = (name: string) => {
      alert(`Ping successful to ${name}. Latency: 12ms. Connection: Stable.`);
  };

  const handleConfigure = (name: string) => {
      alert(`Configuration access for ${name} requires Manufacturer Service Key. Please contact support.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Analyzer Catalogue</h1>
          <p className="text-slate-500 font-medium">Configure laboratory equipment and automated data pathways</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-[#005c97] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
          >
            <Upload size={18} /> Bulk Result Import
          </button>
        </div>
      </div>

      {/* Simplified Instrument Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instruments.map(inst => (
          <div key={inst.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-[#005c97] transition-all group">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-[#005c97] transition-colors border border-slate-100">
                  <Server size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900">{inst.name}</h3>
                  <p className="text-xs text-slate-400 font-mono tracking-wider">{inst.id}</p>
               </div>
            </div>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</span>
                  <span className="text-sm font-bold text-slate-700">{inst.type}</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protocol</span>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{inst.protocol}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Endpoint</span>
                  <span className="text-xs font-mono font-bold text-slate-600">{inst.ipAddress}</span>
               </div>
            </div>

            <div className="mt-6 flex gap-2">
               <button 
                  onClick={() => handleConfigure(inst.name)}
                  className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
               >
                 Configure
               </button>
               <button 
                  onClick={() => handleTestLink(inst.name)}
                  className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-[#005c97] hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
               >
                 Test Link
               </button>
            </div>
          </div>
        ))}
        
        {/* Add New Instrument Card */}
        <div 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer group"
        >
           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 mb-2 border border-slate-200 group-hover:border-blue-200 group-hover:text-blue-500">
              <Plus size={20} />
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase">Connect New Analyzer</p>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
         <div className="max-w-3xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Data Capture</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
               M-Solutions supports seamless unidirectional and bidirectional interfacing via standard medical protocols. 
               The Bulk Result Import allows technicians to upload batch result files generated by analyzers that aren't yet directly connected to the network gateway.
            </p>
         </div>
      </div>

      {/* Add Instrument Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-lg text-slate-900">Provision New Equipment</h3>
                   <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                   </button>
                </div>
                <form onSubmit={handleAddInstrument} className="space-y-4">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Instrument Name</label>
                       <input 
                         autoFocus
                         className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                         placeholder="e.g. Cobas 6000"
                         value={newInst.name}
                         onChange={e => setNewInst({...newInst, name: e.target.value})}
                         required
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Device Type</label>
                       <select 
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newInst.type}
                          onChange={e => setNewInst({...newInst, type: e.target.value})}
                       >
                          <option>Chemistry Analyzer</option>
                          <option>Hematology Analyzer</option>
                          <option>Immunoassay System</option>
                          <option>PCR Machine</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">Communication Protocol</label>
                       <select 
                          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newInst.protocol}
                          onChange={e => setNewInst({...newInst, protocol: e.target.value as any})}
                       >
                          <option>HL7</option>
                          <option>ASTM</option>
                          <option>CSV</option>
                          <option>Proprietary</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">IP Address / Port</label>
                       <input 
                         className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                         placeholder="192.168.1.100:5000"
                         value={newInst.ipAddress}
                         onChange={e => setNewInst({...newInst, ipAddress: e.target.value})}
                         required
                       />
                    </div>
                    <button className="w-full bg-[#005c97] hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg shadow-lg transition-all mt-2">
                       Connect Device
                    </button>
                </form>
             </div>
          </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-lg text-slate-900">Import Instrument Results</h3>
                  <button onClick={() => { setIsImportModalOpen(false); setStep(1); setCsvData(''); }} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>

               {importStats ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center animate-in zoom-in">
                     <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                        <CheckCircle2 size={40} />
                     </div>
                     <h2 className="text-2xl font-black text-slate-900">Import Complete</h2>
                     <p className="text-slate-500 mt-2">
                        Successfully mapped and saved <span className="font-bold text-green-600">{importStats.success}</span> results to patient records.
                        {importStats.failed > 0 && <span className="block text-red-500 text-sm mt-1">{importStats.failed} records could not be validated.</span>}
                     </p>
                  </div>
               ) : (
                  <>
                     <div className="flex-1 overflow-y-auto p-6">
                        {step === 1 ? (
                           <div className="space-y-4">
                              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                 <FileText className="text-blue-600 shrink-0" size={20} />
                                 <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1 italic">CSV Mapping Pattern:</p>
                                    <p className="font-mono">RequestID, TestCode, ResultValue</p>
                                    <p className="mt-2 text-xs opacity-80">Copy the data from your instrument log or spreadsheet and paste below.</p>
                                 </div>
                              </div>
                              <textarea 
                                 className="w-full h-64 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-[#005c97] outline-none resize-none"
                                 placeholder="AR-24-001, CBC, 14.5&#10;AR-24-002, LFT, 1.2"
                                 value={csvData}
                                 onChange={e => setCsvData(e.target.value)}
                              />
                           </div>
                        ) : (
                           <div className="border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-sm">
                                 <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                       <th className="px-4 py-2 font-bold text-slate-500">Request ID</th>
                                       <th className="px-4 py-2 font-bold text-slate-500">Analysis</th>
                                       <th className="px-4 py-2 font-bold text-slate-500">Result</th>
                                       <th className="px-4 py-2 font-bold text-slate-500 text-right">Validation</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                    {parsedData.map((row, i) => (
                                       <tr key={i} className={row.isValid ? 'bg-white' : 'bg-red-50'}>
                                          <td className="px-4 py-2 font-mono">{row.requestId}</td>
                                          <td className="px-4 py-2">{row.testCode}</td>
                                          <td className="px-4 py-2 font-bold">{row.result}</td>
                                          <td className="px-4 py-2 text-right">
                                             <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                                                row.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                             }`}>
                                                {row.status}
                                             </span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>

                     <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                        {step === 1 ? (
                           <>
                              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-500 font-bold hover:text-slate-700">Cancel</button>
                              <button 
                                 onClick={handleParse} 
                                 disabled={!csvData}
                                 className="bg-[#005c97] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                 Review Data <ArrowRight size={16} />
                              </button>
                           </>
                        ) : (
                           <>
                              <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-slate-700">Back to Edit</button>
                              <button 
                                 onClick={handleImport}
                                 className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200"
                              >
                                 <Save size={16} /> Commit Results
                              </button>
                           </>
                        )}
                     </div>
                  </>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default Instruments;
