
import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Search, Plus, Trash2, User, Calendar, 
  CreditCard, Save, Printer, ChevronRight, 
  Stethoscope, Phone, AlertCircle, X, CheckCircle2,
  Building2, Beaker, UserPlus
} from 'lucide-react';
import { TestDefinition, Patient, SampleStatus, Client, AnalysisRequest } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Invoice } from './Invoice';

const Accessioning: React.FC = () => {
  const { patients, departments, clients, addRequest, addPatient, settings, getPatientById } = useLab();
  
  // State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  
  const [testSearch, setTestSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<TestDefinition[]>([]);
  
  // New Fields
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // Default to null (Walk-in)
  const [sampleType, setSampleType] = useState<string>('Blood');
  const [referrer, setReferrer] = useState<string>('Self');
  const [priority, setPriority] = useState<string>('Normal');

  const [discount, setDiscount] = useState<string>('0');
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<AnalysisRequest | null>(null);

  // Quick Patient Add State
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    title: 'Mr.',
    firstName: '',
    lastName: '',
    age: '' as number | string,
    ageUnit: 'Year',
    gender: 'Male',
    contact: '',
    relationType: 'S/O',
    relationName: ''
  });

  // Computed
  const subtotal = selectedTests.reduce((acc, t) => acc + t.price, 0);
  const total = Math.max(0, subtotal - Number(discount));
  const balance = Math.max(0, total - Number(amountPaid));

  const filteredTests = useMemo(() => {
    if (!testSearch) return [];
    return departments.flatMap(d => d.tests).filter(t => 
      t.name.toLowerCase().includes(testSearch.toLowerCase()) || 
      t.code.toLowerCase().includes(testSearch.toLowerCase())
    ).slice(0, 5);
  }, [testSearch, departments]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return [];
    return patients.filter(p => 
      p.firstName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.lastName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.mrn.includes(patientSearch) ||
      (p.cnic && p.cnic.includes(patientSearch))
    );
  }, [patientSearch, patients]);

  // Handlers
  const handleAddTest = (test: TestDefinition) => {
    if (!selectedTests.find(t => t.code === test.code)) {
      setSelectedTests([...selectedTests, test]);
    }
    setTestSearch('');
  };

  const handleRemoveTest = (code: string) => {
    setSelectedTests(selectedTests.filter(t => t.code !== code));
  };

  const handleReset = () => {
    setSelectedPatient(null);
    setSelectedClient(null);
    setSelectedTests([]);
    setDiscount('0');
    setAmountPaid('0');
    setSampleType('Blood');
    setReferrer('Self');
    setPriority('Normal');
    setPatientSearch('');
    setTestSearch('');
    setCreatedRequest(null);
  };

  const handleSave = (shouldPrint: boolean = false) => {
    if (!selectedPatient || selectedTests.length === 0) return;

    // Billing Validation
    const discountVal = Number(discount);
    const paidVal = Number(amountPaid);

    if (discountVal < 0) {
        alert("Error: Discount cannot be negative.");
        return;
    }
    if (paidVal < 0) {
        alert("Error: Payment amount cannot be negative.");
        return;
    }
    if (discountVal > subtotal) {
        alert("Error: Discount cannot exceed subtotal amount.");
        return;
    }
    if (paidVal > (subtotal - discountVal)) {
        alert("Error: Payment amount cannot exceed the total payable.");
        return;
    }

    const newRequestData = {
      clientId: selectedClient?.id || 'WALK-IN',
      patientId: selectedPatient.id,
      sampleType: sampleType,
      status: SampleStatus.RECEIVED,
      dateReceived: new Date().toISOString().split('T')[0],
      priority: priority as any,
      totalFee: subtotal, // Store raw total, discount applied on top
      discount: discountVal,
      paidAmount: paidVal,
      dueAmount: balance,
      referrer: referrer,
      analyses: selectedTests.map(t => ({
        keyword: t.code,
        title: t.name,
        price: t.price,
        unit: t.unit || '',
        referenceRange: t.referenceRange || '',
        status: 'Pending' as const
      }))
    };

    // Capture the generated ID returned from Context
    const generatedId = addRequest(newRequestData);

    if (shouldPrint) {
        // Use the real ID for the invoice preview
        setCreatedRequest({
            ...newRequestData,
            id: generatedId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'Current User'
        });
    } else {
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            handleReset();
        }, 2000);
    }
  };

  const handleOpenPatientModal = () => {
    if (patientSearch && /[a-zA-Z]/.test(patientSearch)) {
        const parts = patientSearch.trim().split(/\s+/);
        setNewPatient(prev => ({
            ...prev,
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || '',
            title: 'Mr.',
            age: '' as number | string,
            ageUnit: 'Year',
            gender: 'Male',
            contact: '',
            relationType: 'S/O',
            relationName: ''
        }));
    } else {
        setNewPatient({
            title: 'Mr.',
            firstName: '',
            lastName: '',
            age: '' as number | string,
            ageUnit: 'Year',
            gender: 'Male',
            contact: '',
            relationType: 'S/O',
            relationName: ''
        });
    }
    setIsPatientModalOpen(true);
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mrn = `MRN-${Date.now().toString().slice(-6)}`;
    const today = new Date();
    const ageVal = Number(newPatient.age);
    if (newPatient.ageUnit === 'Year') {
       today.setFullYear(today.getFullYear() - ageVal);
    } else if (newPatient.ageUnit === 'Month') {
       today.setMonth(today.getMonth() - ageVal);
    } else {
       today.setDate(today.getDate() - ageVal);
    }
    const dob = today.toISOString().split('T')[0];

    const payload: any = {
      mrn,
      dob,
      firstName: newPatient.firstName,
      lastName: newPatient.lastName,
      title: newPatient.title,
      gender: newPatient.gender,
      age: ageVal,
      ageUnit: newPatient.ageUnit,
      contact: newPatient.contact,
      relationType: newPatient.relationType,
      relationName: newPatient.relationName,
      address: '',
      cnic: ''
    };

    // Use returned ID to set active patient
    const newId = addPatient(payload);
    setIsPatientModalOpen(false);
    
    // Fetch the newly created patient object using the ID
    // We delay slightly to ensure state propagation if needed, but context update is usually immediate in this simple model
    setTimeout(() => {
        const createdPatient = getPatientById(newId);
        if (createdPatient) {
            setSelectedPatient(createdPatient);
            setPatientSearch('');
        }
    }, 50);
    
    // Reset form
    setNewPatient({
      title: 'Mr.',
      firstName: '',
      lastName: '',
      age: '',
      ageUnit: 'Year',
      gender: 'Male',
      contact: '',
      relationType: 'S/O',
      relationName: ''
    });
  };

  // Invoice Modal Render
  if (createdRequest && selectedPatient) {
      return (
          <Invoice 
            request={createdRequest} 
            patient={selectedPatient} 
            settings={settings}
            onClose={() => {
                setCreatedRequest(null);
                handleReset();
            }} 
          />
      );
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Registration Complete!</h2>
        <p className="text-slate-500 font-medium text-lg">Analysis request has been queued successfully.</p>
        <button 
          onClick={() => setShowSuccess(false)}
          className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
        >
          Start New Case
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 -m-8 overflow-hidden">
      {/* LEFT PANEL: Data Entry */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
        
        {/* 1. Patient Selection Section */}
        <div className="p-8 border-b border-slate-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
              Patient & Visit Details
            </h2>
            <button 
              onClick={handleOpenPatientModal}
              className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <UserPlus size={14} /> New Patient
            </button>
          </div>

          {!selectedPatient ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="text-slate-400" size={18} />
              </div>
              <input 
                type="text"
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                placeholder="Search by MRN, Name, CNIC or Phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              {filteredPatients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden max-h-60 overflow-y-auto">
                  {filteredPatients.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setPatientSearch(''); }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                        <div className="flex gap-2">
                            <p className="text-xs text-slate-500 font-mono">{p.mrn}</p>
                            {p.relationName && <p className="text-xs text-slate-400">({p.relationType} {p.relationName})</p>}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold border border-blue-100 shadow-sm">
                  {selectedPatient.firstName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {selectedPatient.title} {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><User size={12} /> {selectedPatient.gender}, {selectedPatient.age} {selectedPatient.ageUnit}</span>
                    <span className="flex items-center gap-1"><Phone size={12} /> {selectedPatient.contact}</span>
                    {selectedPatient.relationName && (
                        <span className="text-slate-400">| {selectedPatient.relationType} {selectedPatient.relationName}</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Clinical Info Inputs (Only visible when patient selected) */}
          <div className={`grid grid-cols-2 gap-4 mt-4 transition-all duration-300 ${selectedPatient ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Referrer / Doctor</label>
              <div className="relative">
                <Stethoscope size={14} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={referrer}
                  onChange={e => setReferrer(e.target.value)}
                  placeholder="Self / Consultant" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Client (Payer)</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-3 text-slate-400" />
                <select 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  onChange={e => {
                    const client = clients.find(c => c.id === e.target.value);
                    setSelectedClient(client || null);
                  }}
                  value={selectedClient?.id || ''}
                >
                  <option value="">Walk-in / Private</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Priority Level</label>
              <div className="relative">
                <AlertCircle size={14} className="absolute left-3 top-3 text-slate-400" />
                <select 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option>Normal</option>
                  <option>Urgent</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>
             <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Sample Type</label>
              <div className="relative">
                <Beaker size={14} className="absolute left-3 top-3 text-slate-400" />
                <select 
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  value={sampleType}
                  onChange={e => setSampleType(e.target.value)}
                >
                  <option>Blood</option>
                  <option>Urine</option>
                  <option>Swab</option>
                  <option>Stool</option>
                  <option>Tissue</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Test Selection Section */}
        <div className="flex-1 p-8 bg-slate-50 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
              Analysis Request
            </h2>
            <span className="text-xs font-medium text-slate-500">{selectedTests.length} items selected</span>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="Search test name, code or department..."
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
            />
            
            {/* Search Dropdown */}
            {testSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-40 max-h-64 overflow-y-auto">
                {filteredTests.map(test => (
                  <button 
                    key={test.code}
                    onClick={() => handleAddTest(test)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between border-b border-slate-50 group"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{test.name}</p>
                      <p className="text-xs text-slate-500 font-mono group-hover:text-blue-600">{test.code}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700">{formatCurrency(test.price)}</span>
                      <Plus size={16} className="text-blue-600" />
                    </div>
                  </button>
                ))}
                {filteredTests.length === 0 && (
                   <div className="p-4 text-center text-sm text-slate-500">No tests found matching "{testSearch}"</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Tests List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {selectedTests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <Search size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Search and add tests to build the request</p>
              </div>
            ) : (
              selectedTests.map((test, index) => (
                <div key={`${test.code}-${index}`} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 font-mono">
                      {test.code}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{test.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Dept: {test.departmentId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-700">{formatCurrency(test.price)}</span>
                    <button 
                      onClick={() => handleRemoveTest(test.code)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Financial Summary & Actions */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-2 text-slate-900 mb-1">
             <Calendar size={16} className="text-blue-600" />
             <span className="text-sm font-bold">Today</span>
           </div>
           <div className="text-xs text-slate-500 font-medium">New Receipt</div>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
           {/* Detailed Test Breakdown */}
           <div className="space-y-2 max-h-48 overflow-y-auto mb-2 border-b border-slate-100 pb-4">
               {selectedTests.length === 0 ? (
                   <p className="text-xs text-slate-400 italic">No tests selected...</p>
               ) : (
                   selectedTests.map((t, i) => (
                     <div key={i} className="flex justify-between text-xs items-center">
                         <span className="text-slate-600 truncate pr-2 font-medium">{t.name}</span>
                         <span className="font-bold font-mono text-slate-900 whitespace-nowrap">{formatCurrency(t.price)}</span>
                     </div>
                 ))
               )}
           </div>

           {/* Summary Block */}
           <div className="space-y-3">
             <div className="flex justify-between items-center text-sm text-slate-600">
               <span className="border-b border-dashed border-slate-300 pb-0.5 cursor-help">Discount</span>
               <div className="flex items-center w-24">
                 <span className="text-slate-400 mr-1">-</span>
                 <input 
                   type="number"
                   min="0"
                   className="w-full text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none text-orange-600 font-medium"
                   value={discount}
                   onChange={(e) => setDiscount(e.target.value)}
                 />
               </div>
             </div>
             
             <div className="h-px bg-slate-100 my-4"></div>
             
             <div className="flex justify-between items-center">
               <span className="text-base font-bold text-slate-900">Total Payable</span>
               <span className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(total)}</span>
             </div>
           </div>

           {/* Payment Block */}
           <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
             <div className="flex items-center gap-2 mb-2">
               <CreditCard size={16} className="text-slate-500" />
               <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Details</span>
             </div>
             
             <div className="space-y-1">
               <label className="text-xs text-slate-500 font-medium">Amount Received</label>
               <div className="relative">
                 <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">Rs.</span>
                 <input 
                   type="number"
                   min="0"
                   className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-green-700 focus:ring-2 focus:ring-green-500 outline-none"
                   value={amountPaid}
                   onChange={(e) => setAmountPaid(e.target.value)}
                 />
               </div>
             </div>

             <div className="flex justify-between items-center pt-2">
               <span className="text-xs font-bold text-slate-500 uppercase">Balance Due</span>
               <span className={`text-lg font-black ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                 {formatCurrency(balance)}
               </span>
             </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
          <button 
            onClick={() => handleSave(false)}
            disabled={!selectedPatient || selectedTests.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98]"
          >
             <Save size={20} />
             <span>Confirm & Generate Bill</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => handleSave(true)}
                disabled={!selectedPatient || selectedTests.length === 0}
                className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 text-xs disabled:opacity-50"
             >
               <Printer size={16} /> Save & Print
             </button>
             <button 
                onClick={handleReset}
                className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 text-xs"
             >
               <X size={16} /> Cancel
             </button>
          </div>
        </div>
      </div>

      {/* Quick Add Patient Modal */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg text-slate-900">Quick Patient Registration</h3>
                 <button onClick={() => setIsPatientModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleCreatePatient} className="space-y-4">
                 
                 <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newPatient.title}
                          onChange={e => setNewPatient({...newPatient, title: e.target.value})}
                        >
                           <option>Mr.</option>
                           <option>Mrs.</option>
                           <option>Ms.</option>
                           <option>Dr.</option>
                           <option>Baby</option>
                        </select>
                     </div>
                     <div className="col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                        <input 
                          required
                          autoFocus
                          placeholder="e.g. Muhammad Ali"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newPatient.firstName}
                          onChange={e => setNewPatient({...newPatient, firstName: e.target.value, lastName: ''})}
                        />
                     </div>
                 </div>

                 <div className="grid grid-cols-4 gap-3">
                     <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Relation</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newPatient.relationType}
                          onChange={e => setNewPatient({...newPatient, relationType: e.target.value})}
                        >
                           <option>S/O</option>
                           <option>D/O</option>
                           <option>W/O</option>
                           <option>H/O</option>
                        </select>
                     </div>
                     <div className="col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Relative Name</label>
                        <input 
                          placeholder="e.g. Father/Husband Name"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newPatient.relationName}
                          onChange={e => setNewPatient({...newPatient, relationName: e.target.value})}
                        />
                     </div>
                 </div>

                 <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Age</label>
                      <input 
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPatient.age}
                        onChange={e => setNewPatient({...newPatient, age: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Unit</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPatient.ageUnit}
                        onChange={e => setNewPatient({...newPatient, ageUnit: e.target.value})}
                      >
                        <option>Year</option><option>Month</option><option>Day</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Gender</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPatient.gender}
                        onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                      >
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number</label>
                    <input 
                      required
                      placeholder="03xx-xxxxxxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      value={newPatient.contact}
                      onChange={e => setNewPatient({...newPatient, contact: e.target.value})}
                    />
                 </div>

                 <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all mt-2">
                     Create Patient Record
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Accessioning;
