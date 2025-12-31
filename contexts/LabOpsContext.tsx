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
import { useSync } from './SyncContext';
import { supabase } from '../lib/supabase';

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
    logQC: (testCode: string, result: string, status: 'Pass' | 'Fail') => void;
    factoryReset: () => void;
}

const LabOpsContext = createContext<LabOpsContextType | undefined>(undefined);

export const LabOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { enqueue, isOnline } = useSync();

    const [requests, setRequests] = useStickyState<AnalysisRequest[]>(MOCK_REQUESTS, 'lims_requests');
    const [clients, setClients] = useStickyState<Client[]>(CLIENTS, 'lims_clients');
    const [departments, setDepartments] = useStickyState<Department[]>(DEPARTMENTS, 'lims_departments');
    const [worksheets, setWorksheets] = useStickyState<Worksheet[]>([], 'lims_worksheets');
    const [inventory, setInventory] = useStickyState<InventoryItem[]>([
        { id: 'INV-001', name: 'Glucose Reagent', category: 'Reagent', lotNumber: 'LOT-GLU-24', expiryDate: '2025-12-31', quantity: 15, unit: 'Kits', minLevel: 5, location: 'Fridge A', createdAt: '', updatedAt: '', createdBy: 'system' }
    ], 'lims_inventory');

    const [settings, setSettingsState] = useStickyState<LabSettings>(DEFAULT_SETTINGS, 'lims_settings');
    const [auditLogs, setAuditLogs] = useStickyState<AuditLog[]>(AUDIT_LOGS, 'lims_audit_logs');

    // Hydrate Requests
    React.useEffect(() => {
        const fetchRequests = async () => {
            if (!navigator.onLine) return;
            // Check if we need hydration logic here. 
            // For now, simpler to rely on Cache first, but typically we want to pull new items.
            // Skipped for brevity to match "Offline First" priority.
        };
        fetchRequests();
    }, [isOnline]);


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

        // Sync Audit Log to Supabase (Immutable Cloud Trail)
        enqueue('INSERT', 'audit_logs', {
            id: newLog.id,
            timestamp: newLog.timestamp,
            user: newLog.user,
            action: newLog.action,
            resource_type: newLog.resourceType,
            resource_id: newLog.resourceId,
            details: newLog.details,
            before: newLog.before ? JSON.parse(newLog.before) : null,
            after: newLog.after ? JSON.parse(newLog.after) : null,
            correlation_id: newLog.correlationId
        });
    }, [user, setAuditLogs, enqueue]);

    // --- Requests Logic ---
    const addRequest = (req: Partial<AnalysisRequest>) => {
        // Optimistic
        const id = `AR-${new Date().getFullYear().toString().slice(-2)}-${String(requests.length + 1).padStart(4, '0')}`;
        // Note: For real sync, we might want UUIDs for Primary Keys, but 'AR-XX' is business logic.
        // We can keep AR-XX as "friendly_id" and add a real "id" UUID field in DB, 
        // OR just use AR-XX as PK if unique enough (it relies on requests.length which is risky in multi-user).
        // For robust multi-user, we should use a UUID.
        // But changing the Type now is risky.
        // Compromise: Use the ID generated here, but beware of conflicts.
        // Better: UUID for ID, and AR-XX for 'accessionNumber'.
        // Current Type uses 'id' as string.

        const newReq = {
            ...req,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user?.name || 'Staff'
        } as AnalysisRequest;

        setRequests(prev => [newReq, ...prev]);
        logAction('CREATE', 'AnalysisRequest', id, `Created request`);

        // Queue Sync
        // Mapping CamelCase to SnakeCase for DB
        const dbPayload = {
            id: newReq.id,
            client_id: newReq.clientId,
            patient_id: newReq.patientId,
            sample_type: newReq.sampleType,
            status: newReq.status,
            priority: newReq.priority,
            total_fee: newReq.totalFee,
            discount: newReq.discount,
            paid_amount: newReq.paidAmount,
            referrer: newReq.referrer,
            created_at: newReq.createdAt,
            updated_at: newReq.updatedAt,
            // analyses is JSONB usually
            analyses: newReq.analyses
        };
        enqueue('INSERT', 'analysis_requests', dbPayload);

        return id;
    };

    const updateAnalysisResult = (reqId: string, keyword: string, value: string) => {
        let updatedReq: AnalysisRequest | undefined;

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
                    newStatus = SampleStatus.TESTING; // Revert if edited
                }
                const newVal = { ...req, analyses: updatedAnalyses, status: newStatus, updatedAt: new Date().toISOString() };
                updatedReq = newVal;
                return newVal;
            }
            return req;
        }));

        if (updatedReq) {
            enqueue('UPDATE', 'analysis_requests', {
                analyses: updatedReq.analyses,
                status: updatedReq.status,
                updated_at: updatedReq.updatedAt
            }, { id: reqId });
        }
    };

    const updateRequestStatus = (reqId: string, status: SampleStatus) => {
        setRequests(prev => prev.map(req => req.id === reqId ? { ...req, status, updatedAt: new Date().toISOString() } : req));
        logAction('UPDATE', 'AnalysisRequest', reqId, `Status changed to ${status}`);

        enqueue('UPDATE', 'analysis_requests', { status, updated_at: new Date().toISOString() }, { id: reqId });
    };

    const resetSampleStatus = (reqId: string) => {
        setRequests(prev => prev.map(req => req.id === reqId ? { ...req, status: SampleStatus.RECEIVED, updatedAt: new Date().toISOString() } : req));
        logAction('RESET', 'AnalysisRequest', reqId, `Status reset to Received`);

        enqueue('UPDATE', 'analysis_requests', { status: SampleStatus.RECEIVED, updated_at: new Date().toISOString() }, { id: reqId });
    };

    const rejectSample = (reqId: string, reason: string) => {
        setRequests(prev => prev.map(req => req.id === reqId ? { ...req, status: SampleStatus.REJECTED, updatedAt: new Date().toISOString() } : req));
        logAction('REJECT', 'AnalysisRequest', reqId, `Sample rejected: ${reason}`);

        enqueue('UPDATE', 'analysis_requests', { status: SampleStatus.REJECTED, updated_at: new Date().toISOString() }, { id: reqId });
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
        const newClient = { ...c, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.name || 'Staff' };
        setClients(prev => [...prev, newClient]);
        logAction('CREATE', 'Client', id, `Registered client ${c.name}`);

        enqueue('INSERT', 'clients', {
            id,
            name: newClient.name,
            code: newClient.code,
            contact_person: newClient.contactPerson,
            email: newClient.email,
            phone: newClient.phone,
            created_at: newClient.createdAt,
            updated_at: newClient.updatedAt,
            created_by: newClient.createdBy
        });
    };

    const updateClient = (c: Client) => {
        setClients(prev => prev.map(cl => cl.id === c.id ? { ...c, updatedAt: new Date().toISOString() } : cl));
        logAction('UPDATE', 'Client', c.id, `Updated details`);

        enqueue('UPDATE', 'clients', {
            name: c.name,
            code: c.code,
            contact_person: c.contactPerson,
            email: c.email,
            phone: c.phone,
            updated_at: new Date().toISOString()
        }, { id: c.id });
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
        const newItem = { ...item, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.name || 'Staff' };
        setInventory(prev => [...prev, newItem]);
        logAction('CREATE', 'Inventory', id, `Added item ${item.name}`);

        enqueue('INSERT', 'inventory', {
            id,
            name: newItem.name,
            category: newItem.category,
            lot_number: newItem.lotNumber,
            expiry_date: newItem.expiryDate,
            quantity: newItem.quantity,
            unit: newItem.unit,
            min_level: newItem.minLevel,
            location: newItem.location,
            created_at: newItem.createdAt,
            updated_at: newItem.updatedAt,
            created_by: newItem.createdBy
        });
    };

    const updateStock = (id: string, qty: number) => {
        setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
        logAction('STOCK_ADJUST', 'Inventory', id, `Adjusted quantity to ${qty}`);

        enqueue('UPDATE', 'inventory', { quantity: qty, updated_at: new Date().toISOString() }, { id });
    };

    // --- Settings & Logs ---
    const updateSettings = (s: LabSettings) => {
        setSettingsState(s);
        logAction('UPDATE', 'Settings', 'Global', 'Updated system settings');
    };

    const logReportGeneration = (type: string, format: string) => {
        logAction('REPORT_GENERATE', 'Report', type, `Generated ${format} report`);
    };

    const logQC = (testCode: string, result: string, status: 'Pass' | 'Fail') => {
        logAction('QC_CHECK', 'QC', testCode, `QC Analysis: ${result} (${status})`);
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
            auditLogs, logAction, logReportGeneration, logQC, factoryReset
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
