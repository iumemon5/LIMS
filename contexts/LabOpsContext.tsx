import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import {
    AnalysisRequest, Department, Client, InventoryItem, Worksheet, AuditLog, LabSettings,
    SampleStatus, TestDefinition, BaseEntity
} from '../types';
import {
    MOCK_REQUESTS, DEPARTMENTS, CLIENTS, DEFAULT_SETTINGS, AUDIT_LOGS
} from '../constants';
import { useStickyState } from '../hooks/useStickyState';
import { useAuth } from './AuthContext';

interface LabOpsContextType {
    // Requests
    requests: AnalysisRequest[];
    addRequest: (req: Partial<AnalysisRequest>) => string;
    updateAnalysisResult: (reqId: string, keyword: string, value: string) => void;
    updateRequestStatus: (reqId: string, status: SampleStatus) => void;
    resetSampleStatus: (reqId: string) => void;
    rejectSample: (reqId: string, reason: string) => void;
    recordPayment: (reqId: string, amount: number) => void;

    // Clients
    clients: Client[];
    addClient: (client: Client) => void;
    updateClient: (client: Client) => void;

    // Departments
    departments: Department[];
    addDepartment: (dept: Omit<Department, keyof BaseEntity>) => void;
    addTest: (deptId: string, test: TestDefinition) => void;
    updateTest: (deptId: string, test: TestDefinition) => void;
    deleteTest: (deptId: string, code: string) => void;

    // Worksheets
    worksheets: Worksheet[];
    createWorksheet: (ws: Worksheet) => void;
    closeWorksheet: (id: string) => void;

    // Inventory
    inventory: InventoryItem[];
    addInventoryItem: (item: InventoryItem) => void;
    updateStock: (id: string, quantity: number) => void;

    // Settings & Logs
    settings: LabSettings;
    updateSettings: (s: LabSettings) => void;
    auditLogs: AuditLog[];
    logAction: (action: string, resourceType: string, resourceId: string, details: string, before?: any, after?: any) => void;
    logReportGeneration: (type: string, format: string) => void;
    factoryReset: () => void;
}

const LabOpsContext = createContext<LabOpsContextType | undefined>(undefined);

export const LabOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const [requests, setRequests] = useStickyState<AnalysisRequest[]>(MOCK_REQUESTS, 'lims_requests');
    const [clients, setClients] = useStickyState<Client[]>(CLIENTS, 'lims_clients');
    const [departments, setDepartments] = useStickyState<Department[]>(DEPARTMENTS, 'lims_departments');
    const [worksheets, setWorksheets] = useStickyState<Worksheet[]>([], 'lims_worksheets');
    const [inventory, setInventory] = useStickyState<InventoryItem[]>([
        { id: 'INV-001', name: 'Glucose Reagent', category: 'Reagent', lotNumber: 'LOT-GLU-24', expiryDate: '2025-12-31', quantity: 15, unit: 'Kits', minLevel: 5, location: 'Fridge A', createdAt: '', updatedAt: '', createdBy: 'system' }
    ], 'lims_inventory');

    const [settings, setSettingsState] = useStickyState<LabSettings>(DEFAULT_SETTINGS, 'lims_settings');
    const [auditLogs, setAuditLogs] = useStickyState<AuditLog[]>(AUDIT_LOGS, 'lims_audit_logs');

    // Helper for Logging
    const logAction = useCallback((action: string, resourceType: string, resourceId: string, details: string, before?: any, after?: any) => {
        const newLog: AuditLog = {
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            user: user?.name || 'System',
            action,
            resourceType,
            resourceId,
            details,
            correlationId: 'CID-' + Date.now(),
            before: before ? JSON.stringify(before) : undefined,
            after: after ? JSON.stringify(after) : undefined
        };
        setAuditLogs(prev => [newLog, ...prev]);
    }, [user, setAuditLogs]);

    // --- Requests Logic ---
    const addRequest = (req: Partial<AnalysisRequest>) => {
        const id = `AR-${new Date().getFullYear().toString().slice(-2)}-${String(requests.length + 1).padStart(4, '0')}`;
        const newReq = {
            ...req,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user?.name || 'Staff'
        } as AnalysisRequest;
        setRequests(prev => [newReq, ...prev]);
        logAction('CREATE', 'AnalysisRequest', id, `Created request`);
        return id;
    };

    const updateAnalysisResult = (reqId: string, keyword: string, value: string) => {
        setRequests(prev => prev.map(req => {
            if (req.id === reqId) {
                const status = value && value.trim() !== '' ? 'Complete' : 'Pending';
                const updatedAnalyses = req.analyses.map(a =>
                    a.keyword === keyword ? { ...a, result: value, status: status as 'Pending' | 'Complete' | 'Flagged' } : a
                );
                let newStatus = req.status;
                if ([SampleStatus.RECEIVED, SampleStatus.COLLECTED, SampleStatus.IN_LAB].includes(req.status)) {
                    newStatus = SampleStatus.TESTING;
                }
                if (req.status === SampleStatus.VERIFIED) {
                    newStatus = SampleStatus.TESTING;
                }
                return { ...req, analyses: updatedAnalyses, status: newStatus, updatedAt: new Date().toISOString() };
            }
            return req;
        }));
    };

    const updateRequestStatus = (reqId: string, status: SampleStatus) => {
        setRequests(prev => prev.map(req => req.id === reqId ? { ...req, status, updatedAt: new Date().toISOString() } : req));
        logAction('UPDATE', 'AnalysisRequest', reqId, `Status changed to ${status}`);
    };

    const resetSampleStatus = (reqId: string) => {
        setRequests(prev => prev.map(req => req.id === reqId ? { ...req, status: SampleStatus.RECEIVED, updatedAt: new Date().toISOString() } : req));
        logAction('RESET', 'AnalysisRequest', reqId, `Status reset to Received`);
    };

    const rejectSample = (reqId: string, reason: string) => {
        setRequests(prev => prev.map(req => req.id === reqId ? { ...req, status: SampleStatus.REJECTED, updatedAt: new Date().toISOString() } : req));
        logAction('REJECT', 'AnalysisRequest', reqId, `Sample rejected: ${reason}`);
    };

    const recordPayment = useCallback((requestId: string, amount: number) => {
        if (amount <= 0) return;
        const ts = new Date().toISOString();
        setRequests(prev => prev.map(req => {
            if (req.id === requestId) {
                const netTotal = req.totalFee - req.discount;
                const remainingBalance = Math.max(0, netTotal - req.paidAmount);
                const paymentToRecord = Math.min(amount, remainingBalance);
                if (paymentToRecord <= 0) return req;
                const before = { ...req };
                const newPaid = req.paidAmount + paymentToRecord;
                const newDue = Math.max(0, netTotal - newPaid);
                const updated = { ...req, paidAmount: newPaid, dueAmount: newDue, updatedAt: ts };
                logAction('FINANCE', 'AnalysisRequest', requestId, `Payment Recorded: ${paymentToRecord}`, before, updated);
                return updated;
            }
            return req;
        }));
    }, [logAction, setRequests]);

    // --- Clients ---
    const addClient = (c: Client) => {
        const id = `CL-${Date.now()}`;
        setClients(prev => [...prev, { ...c, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.name || 'Staff' }]);
        logAction('CREATE', 'Client', id, `Registered client ${c.name}`);
    };

    const updateClient = (c: Client) => {
        setClients(prev => prev.map(cl => cl.id === c.id ? { ...c, updatedAt: new Date().toISOString() } : cl));
        logAction('UPDATE', 'Client', c.id, `Updated details`);
    };

    // --- Departments ---
    const addDepartment = (dept: Omit<Department, keyof BaseEntity>) => {
        const id = dept.name.toUpperCase().slice(0, 4);
        setDepartments(prev => [...prev, { ...dept, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.name || 'Admin' }]);
        logAction('CREATE', 'Department', id, `Added department ${dept.name}`);
    };

    const addTest = (deptId: string, test: TestDefinition) => {
        setDepartments(prev => prev.map(d => {
            if (d.id === deptId) {
                return { ...d, tests: [...d.tests, test], testCount: d.testCount + 1 };
            }
            return d;
        }));
        logAction('UPDATE', 'Department', deptId, `Added test ${test.name}`);
    };

    const updateTest = (deptId: string, test: TestDefinition) => {
        setDepartments(prev => prev.map(d => {
            if (d.id === deptId) {
                return { ...d, tests: d.tests.map(t => t.code === test.code ? test : t) };
            }
            return d;
        }));
        logAction('UPDATE', 'Department', deptId, `Updated test ${test.code}`);
    };

    const deleteTest = (deptId: string, code: string) => {
        setDepartments(prev => prev.map(d => {
            if (d.id === deptId) {
                return { ...d, tests: d.tests.filter(t => t.code !== code), testCount: d.testCount - 1 };
            }
            return d;
        }));
        logAction('UPDATE', 'Department', deptId, `Deleted test ${code}`);
    };

    // --- Worksheets ---
    const createWorksheet = (ws: Worksheet) => {
        setWorksheets(prev => [...prev, ws]);
        logAction('CREATE', 'Worksheet', ws.id, `Created worksheet ${ws.name}`);
    };

    const closeWorksheet = (id: string) => {
        setWorksheets(prev => prev.map(ws => ws.id === id ? { ...ws, status: 'Closed' as const } : ws));
        logAction('UPDATE', 'Worksheet', id, `Closed worksheet`);
    };

    // --- Inventory ---
    const addInventoryItem = (item: InventoryItem) => {
        const id = `INV-${Date.now()}`;
        setInventory(prev => [...prev, { ...item, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.name || 'Staff' }]);
        logAction('CREATE', 'Inventory', id, `Added item ${item.name}`);
    };

    const updateStock = (id: string, qty: number) => {
        setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
        logAction('STOCK_ADJUST', 'Inventory', id, `Adjusted quantity to ${qty}`);
    };

    // --- Settings & Logs ---
    const updateSettings = (s: LabSettings) => {
        setSettingsState(s);
        logAction('UPDATE', 'Settings', 'Global', 'Updated system settings');
    };

    const logReportGeneration = (type: string, format: string) => {
        logAction('REPORT_GENERATE', 'Report', type, `Generated ${format} report`);
    };

    const factoryReset = useCallback(() => {
        if (window.confirm("Are you sure? This will wipe all local data and restore defaults.")) {
            localStorage.clear();
            window.location.reload();
        }
    }, []);

    return (
        <LabOpsContext.Provider value={{
            requests, addRequest, updateAnalysisResult, updateRequestStatus, resetSampleStatus, rejectSample, recordPayment,
            clients, addClient, updateClient,
            departments, addDepartment, addTest, updateTest, deleteTest,
            worksheets, createWorksheet, closeWorksheet,
            inventory, addInventoryItem, updateStock,
            settings, updateSettings,
            auditLogs, logAction, logReportGeneration, factoryReset
        }}>
            {children}
        </LabOpsContext.Provider>
    );
};

export const useLabOps = () => {
    const context = useContext(LabOpsContext);
    if (!context) throw new Error('useLabOps must be used within LabOpsProvider');
    return context;
};
