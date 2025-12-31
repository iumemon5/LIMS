import React, { useRef, useEffect } from 'react';
import { Search, ChevronRight, User, Phone, Wallet, X, UserPlus } from 'lucide-react';
import { Patient } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PatientSearchProps {
    selectedPatient: Patient | null;
    setSelectedPatient: (patient: Patient | null) => void;
    patientSearch: string;
    setPatientSearch: (term: string) => void;
    filteredPatients: Patient[];
    activePatientIndex: number;
    setActivePatientIndex: (index: number | ((prev: number) => number)) => void;
    handleOpenPatientModal: () => void;
    previousDues: number;
    inputRef: React.RefObject<HTMLInputElement>;
}

const PatientSearch: React.FC<PatientSearchProps> = ({
    selectedPatient,
    setSelectedPatient,
    patientSearch,
    setPatientSearch,
    filteredPatients,
    activePatientIndex,
    setActivePatientIndex,
    handleOpenPatientModal,
    previousDues,
    inputRef
}) => {
    return (
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
                        ref={inputRef}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                        placeholder="Search by MRN, Name, CNIC or Phone..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (filteredPatients.length === 0) return;

                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setActivePatientIndex(prev => prev < filteredPatients.length - 1 ? prev + 1 : prev);
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setActivePatientIndex(prev => prev > 0 ? prev - 1 : 0);
                            } else if (e.key === 'Enter' && activePatientIndex >= 0) {
                                e.preventDefault();
                                const p = filteredPatients[activePatientIndex];
                                if (p) {
                                    setSelectedPatient(p);
                                    setPatientSearch('');
                                    setActivePatientIndex(-1);
                                }
                            }
                        }}
                    />
                    {filteredPatients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden max-h-60 overflow-y-auto">
                            {filteredPatients.map((p, idx) => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelectedPatient(p); setPatientSearch(''); }}
                                    className={`w-full text-left px-4 py-3 flex items-center justify-between border-b border-slate-50 last:border-0 ${idx === activePatientIndex ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'hover:bg-slate-50'
                                        }`}
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
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 relative group overflow-hidden">
                    <div className="flex justify-between items-start">
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

                    {/* Previous Dues Alert */}
                    {previousDues > 0 && (
                        <div className="mt-4 flex items-center gap-3 bg-red-100 border border-red-200 rounded-lg p-3 text-red-800 animate-in fade-in slide-in-from-top-1">
                            <div className="p-1.5 bg-red-200 rounded-full text-red-700">
                                <Wallet size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-wide opacity-80">Outstanding Balance</p>
                                <p className="font-black text-lg">{formatCurrency(previousDues)}</p>
                            </div>
                            <div className="text-xs font-bold text-red-700 bg-white/50 px-2 py-1 rounded">
                                Collect Dues
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PatientSearch;
