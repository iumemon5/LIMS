import React, { createContext, useContext } from 'react';
import { Patient } from '../types';
import { PATIENTS } from '../constants';
import { useStickyState } from '../hooks/useStickyState';
import { useAuth } from './AuthContext';
import { useSync } from './SyncContext';
import { supabase } from '../lib/supabase';

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
    const { user } = useAuth();
    const { enqueue, isOnline } = useSync();

    // Hydrate from Supabase on load (if online)
    React.useEffect(() => {
        const fetchPatients = async () => {
            if (!navigator.onLine) return;
            // Only fetch if local cache is empty or we want to force sync? 
            // For Offline-first, we usually trust local, but we should fetch "new" stuff.
            // Simple strategy: Fetch all and merge? Or just replace if we trust cloud more?
            // "Offline First" usually means Local is master for UI, but Cloud is master for data.
            // Let's fetch and merge (simple version: replace cache if cloud has more data).

            const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
            if (!error && data && data.length > 0) {
                // Map snake_case from DB to camelCase if needed, or assume DB uses JSON matching
                // Assuming DB columns match TS types or we map them.
                // For this demo, we assume strict mapping.
                // We will merge: keep local "unsynced" changes? 
                // Complexity: High. 
                // Simple Path: If online, load from Cloud to ensure we have latest from other users.
                const mappedPatients = data.map((p: any) => ({
                    id: p.id,
                    mrn: p.mrn,
                    title: p.title || '',
                    firstName: p.first_name,
                    lastName: p.last_name,
                    relationType: p.relation_type,
                    relationName: p.relation_name,
                    cnic: p.cnic,
                    address: p.address,
                    age: p.age,
                    ageUnit: p.age_unit,
                    gender: p.gender,
                    contact: p.contact,
                    email: p.email,
                    dob: p.dob,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at,
                    createdBy: p.created_by
                } as Patient));
                setPatients(mappedPatients);
            }
        };
        fetchPatients();
    }, [isOnline]); // Re-fetch when coming back online

    const addPatient = (p: Partial<Patient>) => {
        // 1. Local Update (Optimistic)
        const id = crypto.randomUUID(); // Use UUID for DB compatibility
        const newPatient = {
            ...p,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user?.name || 'Staff'
        } as Patient;

        setPatients(prev => [newPatient, ...prev]);

        // 2. Queue for Sync
        const dbPayload = {
            id: newPatient.id,
            first_name: newPatient.firstName,
            last_name: newPatient.lastName,
            mrn: newPatient.mrn,
            dob: newPatient.dob,
            gender: newPatient.gender,
            contact: newPatient.contact, // Was phone
            email: newPatient.email,
            address: newPatient.address,
            // city removed
            age: newPatient.age,
            age_unit: newPatient.ageUnit,
            created_at: newPatient.createdAt,
            updated_at: newPatient.updatedAt,
            created_by: newPatient.createdBy
        };
        enqueue('INSERT', 'patients', dbPayload);

        return id;
    };

    const updatePatient = (p: Patient) => {
        const updated = { ...p, updatedAt: new Date().toISOString() };
        setPatients(prev => prev.map(pat => pat.id === p.id ? updated : pat));

        const dbPayload = {
            first_name: updated.firstName,
            last_name: updated.lastName,
            contact: updated.contact,
            email: updated.email,
            address: updated.address,
            age: updated.age,
            age_unit: updated.ageUnit,
            updated_at: updated.updatedAt
        };
        enqueue('UPDATE', 'patients', dbPayload, { id: p.id });
    };

    const deletePatient = (id: string) => {
        setPatients(prev => prev.filter(p => p.id !== id));
        enqueue('DELETE', 'patients', {}, { id });
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
