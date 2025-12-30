import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, Patient, AnalysisRequest, Department, Client, 
  InventoryItem, Worksheet, Instrument, AuditLog, LabSettings,
  SampleStatus, TestDefinition, BaseEntity
} from '../types';
import { 
  DEFAULT_USERS, PATIENTS, MOCK_REQUESTS, DEPARTMENTS, 
  CLIENTS, DEFAULT_SETTINGS, AUDIT_LOGS 
} from '../constants';

// --- Persistence Helper ---
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== "undefined") {
      try {
        const stickyValue = window.localStorage.getItem(key);
        return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
      } catch (error) {
        console.warn(`Error reading ${key} from localStorage`, error);
        return defaultValue;
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error saving ${key} to localStorage`, error);
      }
    }
  }, [key, value]);

  return [value, setValue];
}

interface LabContextType {
  user: User | null;
  users: User[];
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUserStatus: (id: string, status: 'Active' | 'Inactive') => void;
  
  patients: Patient[];
  addPatient: (patient: Partial<Patient>) => string;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  
  requests: AnalysisRequest[];
  addRequest: (req: Partial<AnalysisRequest>) => string;
  updateAnalysisResult: (reqId: string, keyword: string, value: string) => void;
  updateRequestStatus: (reqId: string, status: SampleStatus) => void;
  resetSampleStatus: (reqId: string) => void;
  rejectSample: (reqId: string, reason: string) => void;
  recordPayment: (reqId: string, amount: number) => void;
  
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  
  departments: Department[];
  addDepartment: (dept: Omit<Department, keyof BaseEntity>) => void;
  addTest: (deptId: string, test: TestDefinition) => void;
  updateTest: (deptId: string, test: TestDefinition) => void;
  deleteTest: (deptId: string, code: string) => void;
  
  worksheets: Worksheet[];
  createWorksheet: (ws: Worksheet) => void;
  closeWorksheet: (id: string) => void;
  
  inventory: InventoryItem[];
  addInventoryItem: (item: InventoryItem) => void;
  updateStock: (id: string, quantity: number) => void;
  
  instruments: Instrument[];
  addInstrument: (inst: Instrument) => void;
  importInstrumentData: (data: any[]) => { success: number; failed: number };
  
  settings: LabSettings;
  updateSettings: (s: LabSettings) => void;
  
  auditLogs: AuditLog[];
  logQC: (instrument: string, result: string, notes: string) => void;
  logReportGeneration: (type: string, format: string) => void;
  
  factoryReset: () => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use sticky state for persistence
  const [user, setUser] = useStickyState<User | null>(null, 'lims_current_user');
  const [users, setUsers] = useStickyState<User[]>(DEFAULT_USERS, 'lims_users');
  const [patients, setPatients] = useStickyState<Patient[]>(PATIENTS, 'lims_patients');
  const [requests, setRequests] = useStickyState<AnalysisRequest[]>(MOCK_REQUESTS, 'lims_requests');
  const [clients, setClients] = useStickyState<Client[]>(CLIENTS, 'lims_clients');
  const [departments, setDepartments] = useStickyState<Department[]>(DEPARTMENTS, 'lims_departments');
  const [worksheets, setWorksheets] = useStickyState<Worksheet[]>([], 'lims_worksheets');
  
  const [inventory, setInventory] = useStickyState<InventoryItem[]>([
      { id: 'INV-001', name: 'Glucose Reagent', category: 'Reagent', lotNumber: 'LOT-GLU-24', expiryDate: '2025-12-31', quantity: 15, unit: 'Kits', minLevel: 5, location: 'Fridge A', createdAt: '', updatedAt: '', createdBy: 'system' }
  ], 'lims_inventory');
  
  const [instruments, setInstruments] = useStickyState<Instrument[]>([
      { id: 'INST-001', name: 'Cobas c311', type: 'Chemistry Analyzer', protocol: 'HL7', ipAddress: '192.168.1.50', status: 'Online', createdAt: '', updatedAt: '', createdBy: 'system' }
  ], 'lims_instruments');
  
  const [settings, setSettingsState] = useStickyState<LabSettings>(DEFAULT_SETTINGS, 'lims_settings');
  const [auditLogs, setAuditLogs] = useStickyState<AuditLog[]>(AUDIT_LOGS, 'lims_audit_logs');

  // Factory Reset
  const factoryReset = useCallback(() => {
    if (window.confirm("Are you sure? This will wipe all local data and restore defaults.")) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const logAction = useCallback((action: string, resourceType: string, resourceId: string, details: string, before?: any, after?: any) => {
    const newLog: AuditLog = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random()*1000)}`,
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

  // User Auth with Mock Hashing
  const login = (email: string, pass: string) => {
    // Simulate server-side hashing comparison
    const inputHash = btoa(pass); 
    const found = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.passwordHash === inputHash && 
        u.status === 'Active'
    );
    if (found) {
        setUser(found);
        logAction('LOGIN', 'User', found.id, 'User logged in');
        return true;
    }
    return false;
  };

  const logout = () => {
      if (user) logAction('LOGOUT', 'User', user.id, 'User logged out');
      setUser(null);
  };

  const addUser = (u: User) => {
      // Default new users to 'admin123' if not specified
      const newUser = { 
          ...u, 
          id: `USR-${Date.now()}`, 
          passwordHash: u.passwordHash || btoa('admin123'),
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(), 
          createdBy: user?.name || 'Admin' 
      };
      setUsers(prev => [...prev, newUser]);
      logAction('CREATE', 'User', newUser.id, `Created user ${u.name}`);
  };

  const updateUserStatus = (id: string, status: 'Active' | 'Inactive') => {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
      logAction('UPDATE', 'User', id, `Updated status to ${status}`);
  };

  // Patients
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
      logAction('CREATE', 'Patient', id, `Registered patient ${p.firstName} ${p.lastName}`);
      return id;
  };

  const updatePatient = (p: Patient) => {
      setPatients(prev => prev.map(pat => pat.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : pat));
      logAction('UPDATE', 'Patient', p.id, `Updated demographics`);
  };

  const deletePatient = (id: string) => {
      setPatients(prev => prev.filter(p => p.id !== id));
      logAction('DELETE', 'Patient', id, `Deleted record`);
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id);

  // Requests
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

              // 1. Auto-start: If status is "Received", "Collected" or "In Lab", result entry moves it to "Testing"
              if ([SampleStatus.RECEIVED, SampleStatus.COLLECTED, SampleStatus.IN_LAB].includes(req.status)) {
                  newStatus = SampleStatus.TESTING;
              }

              // 2. Auto-Revert: Any change to results of a Verified request downgrades it to Testing to ensure re-verification.
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

  // Payment Logic
  const recordPayment = useCallback((requestId: string, amount: number) => {
    if (amount <= 0) {
        console.warn("Payment amount must be positive.");
        return;
    }

    const ts = new Date().toISOString();
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const netTotal = req.totalFee - req.discount;
        const remainingBalance = Math.max(0, netTotal - req.paidAmount);
        
        // Cap payment at remaining balance to prevent overpayment
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

  // Clients
  const addClient = (c: Client) => {
      const id = `CL-${Date.now()}`;
      setClients(prev => [...prev, { ...c, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.name || 'Staff' }]);
      logAction('CREATE', 'Client', id, `Registered client ${c.name}`);
  };
  
  const updateClient = (c: Client) => {
      setClients(prev => prev.map(cl => cl.id === c.id ? { ...c, updatedAt: new Date().toISOString() } : cl));
      logAction('UPDATE', 'Client', c.id, `Updated details`);
  };

  // Departments & Tests
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

  // Worksheets
  const createWorksheet = (ws: Worksheet) => {
      setWorksheets(prev => [...prev, ws]);
      logAction('CREATE', 'Worksheet', ws.id, `Created worksheet ${ws.name}`);
  };

  const closeWorksheet = (id: string) => {
      setWorksheets(prev => prev.map(ws => ws.id === id ? { ...ws, status: 'Closed' as const } : ws));
      logAction('UPDATE', 'Worksheet', id, `Closed worksheet`);
  };

  // Inventory
  const addInventoryItem = (item: InventoryItem) => {
      const id = `INV-${Date.now()}`;
      setInventory(prev => [...prev, { ...item, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.name || 'Staff' }]);
      logAction('CREATE', 'Inventory', id, `Added item ${item.name}`);
  };

  const updateStock = (id: string, qty: number) => {
      setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
      logAction('STOCK_ADJUST', 'Inventory', id, `Adjusted quantity to ${qty}`);
  };

  // Instruments
  const addInstrument = (inst: Instrument) => {
      const id = `INST-${Date.now()}`;
      setInstruments(prev => [...prev, { ...inst, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: user?.name || 'Admin' }]);
      logAction('CREATE', 'Instrument', id, `Added instrument ${inst.name}`);
  };

  const importInstrumentData = (data: any[]) => {
      let success = 0;
      let failed = 0;
      
      const newRequests = [...requests];
      
      data.forEach(row => {
          const reqIndex = newRequests.findIndex(r => r.id === row.requestId);
          if (reqIndex >= 0) {
              const req = newRequests[reqIndex];
              const analysisIndex = req.analyses.findIndex(a => a.keyword === row.testCode);
              
              if (analysisIndex >= 0) {
                  // Update the specific analysis in the copied request
                  const updatedAnalyses = [...req.analyses];
                  updatedAnalyses[analysisIndex] = {
                      ...updatedAnalyses[analysisIndex],
                      result: row.result,
                      status: 'Complete'
                  };

                  // Check for Auto-Verification Eligibility
                  const newStatus = SampleStatus.TESTING;
                  
                  newRequests[reqIndex] = {
                      ...req,
                      analyses: updatedAnalyses,
                      status: newStatus,
                      updatedAt: new Date().toISOString()
                  };
                  success++;
              } else {
                  failed++;
              }
          } else {
              failed++;
          }
      });
      
      if (success > 0) {
          setRequests(newRequests);
          logAction('IMPORT', 'System', 'Bulk Import', `Imported ${success} results`);
      }
      
      return { success, failed };
  };

  // Settings
  const updateSettings = (s: LabSettings) => {
      setSettingsState(s);
      logAction('UPDATE', 'Settings', 'Global', 'Updated system settings');
  };

  // Logs
  const logQC = (instrument: string, result: string, notes: string) => {
      logAction('QC_RUN', instrument, instrument, `Result: ${result}. ${notes}`);
  };

  const logReportGeneration = (type: string, format: string) => {
      logAction('REPORT_GENERATE', 'Report', type, `Generated ${format} report`);
  };

  return (
    <LabContext.Provider value={{
      user, users, login, logout, addUser, updateUserStatus,
      patients, addPatient, updatePatient, deletePatient, getPatientById,
      requests, addRequest, updateAnalysisResult, updateRequestStatus, resetSampleStatus, rejectSample, recordPayment,
      clients, addClient, updateClient,
      departments, addDepartment, addTest, updateTest, deleteTest,
      worksheets, createWorksheet, closeWorksheet,
      inventory, addInventoryItem, updateStock,
      instruments, addInstrument, importInstrumentData,
      settings, updateSettings,
      auditLogs, logQC, logReportGeneration,
      factoryReset
    }}>
      {children}
    </LabContext.Provider>
  );
};

export const useLab = () => {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
};