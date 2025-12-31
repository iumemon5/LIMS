import React, { createContext, useContext } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { PatientProvider, usePatient } from './PatientContext';
import { LabOpsProvider, useLabOps } from './LabOpsContext';

// We explicitly re-export the contexts if needed, but primarily we want the Provider and the Hook.

export const LabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <AuthProvider>
            <PatientProvider>
                <LabOpsProvider>
                    {children}
                </LabOpsProvider>
            </PatientProvider>
        </AuthProvider>
    );
};

// Facade Hook: Aggregates all contexts into the original monolithic interface
// to ensure backward compatibility with existing components.
export const useLab = () => {
    const auth = useAuth();
    const patient = usePatient();
    const ops = useLabOps();

    return {
        ...auth,
        ...patient,
        ...ops
    };
};