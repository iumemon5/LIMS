import React, { createContext, useContext } from 'react';
import { Patient } from '../types';
import { PATIENTS } from '../constants';
import { useStickyState } from '../hooks/useStickyState';
import { useAuth } from './AuthContext';

interface PatientContextType {
    patients: Patient[];
    addPatient: (patient: Partial<Patient>) => string;
    updatePatient: (patient: Patient) => void;
    deletePatient: (id: string) => void;
    getPatientById: (id: string) => Patient | undefined;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [patients, setPatients] = useStickyState<Patient[]>(PATIENTS, 'lims_patients');
    const { user } = useAuth(); // Access user for 'createdBy' if needed

    const addPatient = (p: Partial<Patient>) => {
        const id = `PAT-${Date.now()}`;
        const newPatient = {
            ...p,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user?.name || 'Staff'
        } as Patient;
        setPatients(prev => [newPatient, ...prev]);
        return id;
    };

    const updatePatient = (p: Patient) => {
        setPatients(prev => prev.map(pat => pat.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : pat));
    };

    const deletePatient = (id: string) => {
        setPatients(prev => prev.filter(p => p.id !== id));
    };

    const getPatientById = (id: string) => patients.find(p => p.id === id);

    return (
        <PatientContext.Provider value={{
            patients, addPatient, updatePatient, deletePatient, getPatientById
        }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatient = () => {
    const context = useContext(PatientContext);
    if (!context) throw new Error('usePatient must be used within PatientProvider');
    return context;
};
