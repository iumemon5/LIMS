
import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  UserPlus, Search, Filter, ArrowUpDown, 
  Edit, History, ChevronLeft, ChevronRight, X,
  MapPin, Phone, CreditCard, AlertCircle, FileText,
  Trash2, Printer
} from 'lucide-react';
import { Patient, AgeUnit, Gender } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';

const PatientManagement: React.FC = () => {
  const { patients, requests, addPatient, updatePatient, deletePatient } = useLab();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState<Patient | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form State
  const initialPatientState: Partial<Patient> = {
    title: 'Mr.',
    firstName: '', 
    lastName: '', 
    relationType: 'S/O',
    relationName: '',
    cnic: '',
    address: '',
    age: 0, 
    ageUnit: 'Year', 
    gender: 'Male', 
    contact: ''
  };

  const [newPatient, setNewPatient] = useState<Partial<Patient>>(initialPatientState);

  // Filter Logic
  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(term) || 
      p.lastName.toLowerCase().includes(term) ||
      p.mrn.toLowerCase().includes(term) ||
      (p.cnic && p.cnic.includes(term)) ||
      (p.contact && p.contact.includes(term))
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
      if (newPage > 0 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(paginatedPatients.map(p => p.id));
      } else {
          setSelectedIds([]);
      }
  };

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleBulkDelete = () => {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} patient records? This action cannot be undone.`)) {
          selectedIds.forEach(id => deletePatient(id));
          setSelectedIds([]);
      }
  };

  const handleBulkPrint = () => {
      alert(`Sent ${selectedIds.length} patient barcodes to print queue.`);
      setSelectedIds([]);
  };

  // Duplicate / Similar Patient Detection
  const similarPatients = patients.filter(p => {
    if (isEditing) return false; // Don't show suggestions when editing
    if (!newPatient.firstName && !newPatient.cnic) return false;
    
    const nameMatch = newPatient.firstName && p.firstName.toLowerCase().includes(newPatient.firstName.toLowerCase());
    const cnicMatch = newPatient.cnic && p.cnic === newPatient.cnic;
    
    return nameMatch || cnicMatch;
  }).slice(0, 3);

  const calculateDobFromAge = (age: number, unit: AgeUnit) => {
    const today = new Date();
    if (unit === 'Year') {
       today.setFullYear(today.getFullYear() - age);
    } else if (unit === 'Month') {
       today.setMonth(today.getMonth() - age);
    } else {
       today.setDate(today.getDate() - age);
    }
    return today.toISOString().split('T')[0];
  };

  const handleCreateOrUpdatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && newPatient.id) {
        updatePatient(newPatient as Patient);
    } else {
        // ID generation delegated to Context
        const mrn = `MRN-${Date.now().toString().slice(-6)}`;
        const dob = calculateDobFromAge(newPatient.age || 0, newPatient.ageUnit || 'Year');
        
        addPatient({
          mrn, 
          dob,
          ...newPatient as Patient
        });
    }
    
    closeModal();
  };

  const openEditModal = (patient: Patient) => {
      setNewPatient(patient);
      setIsEditing(true);
      setIsModalOpen(true);
  };

  const openHistoryModal = (patient: Patient) => {
      setSelectedHistoryPatient(patient);
      setIsHistoryOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setIsEditing(false);
      setNewPatient(initialPatientState);
  };

  const formatCNIC = (value: string) => {
    // Basic formatting for Pakistani CNIC 12345-1234567-1
    const v = value.replace(/\D/g, '').slice(0, 13);
    if (v.length > 12) return `${v.slice(0, 5)}-${v.slice(5, 12)}-${v.slice(12)}`;
    if (v.length > 5) return `${v.slice(0, 5)}-${v.slice(5)}`;
    return v;
  };

  const getPatientHistory = () => {
     if (!selectedHistoryPatient) return [];
     return requests.filter(r => r.patientId === selectedHistoryPatient.id);
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Patient Directory</h1>
           <p className="text-slate-500 font-medium mt-1">Manage {patients.length} registered patient records</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
        >
           <UserPlus size={18} /> Add New Patient
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-transparent outline-none text-sm font-medium"
              placeholder="Search by name, MRN, CNIC or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
         </div>
         <div className="h-6 w-px bg-slate-200"></div>
         <button className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors">
            <Filter size={16} /> Filters
         </button>
      </div>

      {/* Data Table */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
         <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                     <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider w-12">
                        <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedIds.length > 0 && selectedIds.length === paginatedPatients.length}
                            onChange={handleSelectAll}
                        />
                     </th>
                     <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider cursor-pointer hover:text-blue-600 group">
                        <div className="flex items-center gap-1">Patient Name <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" /></div>
                     </th>
                     <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">MRN / ID</th>
                     <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Demographics</th>
                     <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Contact</th>
                     <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {paginatedPatients.map((patient) => (
                     <tr key={patient.id} className={`hover:bg-slate-50/80 transition-colors group ${selectedIds.includes(patient.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4">
                           <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedIds.includes(patient.id)}
                                onChange={() => handleSelectOne(patient.id)}
                           />
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                 {patient.firstName[0]}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{patient.title} {patient.firstName} {patient.lastName}</div>
                                {patient.relationName && (
                                   <div className="text-[10px] text-slate-500 font-medium">
                                     {patient.relationType} {patient.relationName}
                                   </div>
                                )}
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{patient.mrn}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                           {patient.gender}, {patient.age} {patient.ageUnit}s
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                           <div>{patient.contact}</div>
                           {patient.cnic && <div className="text-[10px] text-slate-400">{patient.cnic}</div>}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openEditModal(patient)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                                title="Edit Record"
                              >
                                 <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => openHistoryModal(patient)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                                title="Patient History"
                              >
                                 <History size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Pagination Footer */}
         <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/30">
            <span className="text-xs font-medium text-slate-500">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredPatients.length)} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} entries
            </span>
            <div className="flex items-center gap-2">
               <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
               >
                  <ChevronLeft size={14} />
               </button>
               <span className="text-xs font-bold text-slate-700 px-2">
                   Page {currentPage} of {Math.max(1, totalPages)}
               </span>
               <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
               >
                  <ChevronRight size={14} />
               </button>
            </div>
         </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-6 z-20">
              <span className="font-bold text-sm">{selectedIds.length} Selected</span>
              <div className="h-4 w-px bg-slate-700"></div>
              <div className="flex gap-2">
                  <button 
                    onClick={handleBulkPrint}
                    className="flex items-center gap-2 hover:text-blue-300 transition-colors text-sm font-bold"
                  >
                      <Printer size={16} /> Print Labels
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 hover:text-red-300 transition-colors text-sm font-bold ml-4"
                  >
                      <Trash2 size={16} /> Delete
                  </button>
              </div>
              <button 
                onClick={() => setSelectedIds([])}
                className="ml-2 p-1 hover:bg-slate-800 rounded-full"
              >
                  <X size={14} />
              </button>
          </div>
      )}

      {/* Add/Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">{isEditing ? 'Edit Patient' : 'Patient Registration'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdatePatient} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Name Section */}
              <div className="grid grid-cols-4 gap-4">
                 <div className="col-span-1 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
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
                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                    <input 
                      required
                      autoFocus
                      placeholder="e.g. Muhammad Ali"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newPatient.firstName}
                      onChange={e => setNewPatient({...newPatient, firstName: e.target.value, lastName: ''})}
                    />
                    {/* Similar Patients Suggestion */}
                    {similarPatients.length > 0 && (
                        <div className="absolute z-10 w-64 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                           <div className="bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                             <AlertCircle size={12} /> Similar Records Found
                           </div>
                           {similarPatients.map(match => (
                               <div 
                                 key={match.id} 
                                 className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                 onClick={() => openEditModal(match)}
                               >
                                  <div className="font-bold text-sm text-slate-900">{match.firstName} {match.lastName}</div>
                                  <div className="text-xs text-slate-500">{match.contact} · {match.mrn}</div>
                               </div>
                           ))}
                        </div>
                    )}
                 </div>
              </div>

              {/* Relation Section */}
              <div className="grid grid-cols-4 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Relation</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newPatient.relationType}
                      onChange={e => setNewPatient({...newPatient, relationType: e.target.value as any})}
                    >
                       <option>S/O</option>
                       <option>D/O</option>
                       <option>W/O</option>
                       <option>H/O</option>
                    </select>
                 </div>
                 <div className="col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Guardian / Relative Name</label>
                    <input 
                      placeholder="e.g. Ahmed Khan"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newPatient.relationName}
                      onChange={e => setNewPatient({...newPatient, relationName: e.target.value})}
                    />
                 </div>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPatient.age || ''}
                    onChange={e => setNewPatient({...newPatient, age: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPatient.ageUnit}
                    onChange={e => setNewPatient({...newPatient, ageUnit: e.target.value as AgeUnit})}
                  >
                    <option>Year</option><option>Month</option><option>Day</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPatient.gender}
                    onChange={e => setNewPatient({...newPatient, gender: e.target.value as Gender})}
                  >
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>

              {/* Identification & Contact */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <CreditCard size={12} /> CNIC (Optional)
                    </label>
                    <input 
                      placeholder="42101-xxxxxxx-x"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      value={newPatient.cnic}
                      onChange={e => setNewPatient({...newPatient, cnic: formatCNIC(e.target.value)})}
                      maxLength={15}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Phone size={12} /> Mobile Number
                    </label>
                    <input 
                      required
                      placeholder="03xx-xxxxxxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      value={newPatient.contact}
                      onChange={e => setNewPatient({...newPatient, contact: e.target.value})}
                    />
                 </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                     <MapPin size={12} /> Residential Address
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="House No, Street, Area, City"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={newPatient.address}
                    onChange={e => setNewPatient({...newPatient, address: e.target.value})}
                  />
              </div>

            </form>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
                <button type="button" onClick={closeModal} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleCreateOrUpdatePatient} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                    {isEditing ? 'Update Record' : 'Create Patient'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && selectedHistoryPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
             <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                   <div>
                      <h3 className="font-bold text-slate-900 text-lg">Patient History</h3>
                      <p className="text-xs text-slate-500">{selectedHistoryPatient.firstName} {selectedHistoryPatient.lastName}</p>
                   </div>
                   <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {getPatientHistory().length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <History size={48} className="mx-auto mb-2 opacity-20" />
                            <p className="font-medium">No previous records found</p>
                        </div>
                    ) : (
                        getPatientHistory().map(req => (
                            <div key={req.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{req.id}</span>
                                    <span className="text-xs text-slate-400">{formatDate(req.dateReceived)}</span>
                                </div>
                                <div className="space-y-2">
                                    {req.analyses.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <FileText size={14} className="text-slate-400" />
                                            {a.title}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className={`text-[10px] font-bold uppercase ${
                                        req.status === 'Verified' ? 'text-green-600' : 'text-slate-500'
                                    }`}>{req.status}</span>
                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(req.totalFee)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default PatientManagement;
