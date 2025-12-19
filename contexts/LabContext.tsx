
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { 
  Patient, 
  AnalysisRequest, 
  Department, 
  SampleStatus, 
  InventoryItem, 
  Client, 
  TestDefinition, 
  AuditLog, 
  Worksheet, 
  Instrument,
  Priority,
  LabSettings,
  User
} from '../types';
import { PATIENTS, DEPARTMENTS, MOCK_REQUESTS, CLIENTS, AUDIT_LOGS, SCHEMA_VERSION, DEFAULT_SETTINGS, DEFAULT_USERS } from '../constants';

interface LabContextType {
  user: User | null; // The authenticated user
  patients: Patient[];
  requests: AnalysisRequest[];
  departments: Department[];
  inventory: InventoryItem[];
  clients: Client[];
  auditLogs: AuditLog[];
  worksheets: Worksheet[];
  instruments: Instrument[];
  users: User[];
  settings: LabSettings;
  
  // Auth Actions
  login: (email: string, password?: string) => boolean;
  logout: () => void;

  // Data Access Helpers
  getPatientById: (id: string) => Patient | undefined;
  getClientById: (id: string) => Client | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  
  // Mutations
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => string;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;
  
  addRequest: (request: Omit<AnalysisRequest, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => string;
  updateRequestStatus: (id: string, status: SampleStatus) => void;
  updateAnalysisResult: (requestId: string, keyword: string, result: string) => void;
  rejectSample: (requestId: string, reason: string) => void;
  
  updateStock: (itemId: string, quantity: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  
  addDepartment: (dept: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  addTest: (deptId: string, test: TestDefinition) => void;
  updateTest: (deptId: string, test: TestDefinition) => void;
  deleteTest: (deptId: string, testCode: string) => void;
  
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateClient: (client: Client) => void;
  
  recordPayment: (requestId: string, amount: number) => void;
  
  createWorksheet: (ws: Omit<Worksheet, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  closeWorksheet: (id: string) => void;

  addInstrument: (instrument: Omit<Instrument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  importInstrumentData: (data: {requestId: string, testCode: string, result: string}[]) => {success: number, failed: number};
  
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateUserStatus: (id: string, status: 'Active' | 'Inactive') => void;

  updateSettings: (newSettings: Partial<LabSettings>) => void;
  logReportGeneration: (reportType: string, format: string) => void;
  logQC: (instrument: string, result: string, details: string) => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

const generateSecureId = (prefix: string = 'ID'): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    try {
      const storedVersion = localStorage.getItem('lims_schema_version');
      if (storedVersion !== SCHEMA_VERSION) {
        console.warn(`Schema version mismatch (Stored: ${storedVersion}, App: ${SCHEMA_VERSION}). Performing soft-reset.`);
        localStorage.setItem('lims_schema_version', SCHEMA_VERSION);
        return defaultValue;
      }
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Persistence failure for ${key}:`, e);
      return defaultValue;
    }
  },
  set: <T,>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage error for ${key}:`, e);
    }
  }
};

export const LabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.get('lims_session_user', null));
  
  const [patients, setPatients] = useState<Patient[]>(() => storage.get('lims_patients', PATIENTS));
  const [requests, setRequests] = useState<AnalysisRequest[]>(() => storage.get('lims_requests', MOCK_REQUESTS));
  const [departments, setDepartments] = useState<Department[]>(() => storage.get('lims_departments', DEPARTMENTS));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => storage.get('lims_inventory', []));
  const [instruments, setInstruments] = useState<Instrument[]>(() => storage.get('lims_instruments', []));
  const [clients, setClients] = useState<Client[]>(() => storage.get('lims_clients', CLIENTS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storage.get('lims_auditLogs', AUDIT_LOGS));
  const [worksheets, setWorksheets] = useState<Worksheet[]>(() => storage.get('lims_worksheets', []));
  const [users, setUsers] = useState<User[]>(() => storage.get('lims_users', DEFAULT_USERS));
  const [settings, setSettings] = useState<LabSettings>(() => storage.get('lims_settings', DEFAULT_SETTINGS));

  useEffect(() => {
    storage.set('lims_session_user', user);
    storage.set('lims_patients', patients);
    storage.set('lims_requests', requests);
    storage.set('lims_departments', departments);
    storage.set('lims_inventory', inventory);
    storage.set('lims_instruments', instruments);
    storage.set('lims_clients', clients);
    storage.set('lims_auditLogs', auditLogs);
    storage.set('lims_worksheets', worksheets);
    storage.set('lims_users', users);
    storage.set('lims_settings', settings);
  }, [user, patients, requests, departments, inventory, instruments, clients, auditLogs, worksheets, users, settings]);

  const logAction = useCallback((
    action: string, 
    resourceType: string, 
    resourceId: string, 
    details: string,
    before?: any,
    after?: any
  ) => {
    const newLog: AuditLog = {
      id: generateSecureId('LOG'),
      timestamp: new Date().toISOString(),
      user: user?.name || 'System',
      action,
      resourceType,
      resourceId,
      before: before ? JSON.stringify(before) : undefined,
      after: after ? JSON.stringify(after) : undefined,
      correlationId: generateSecureId('CID'),
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [user]);

  // Auth Methods
  const login = (email: string, password?: string): boolean => {
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'Active');
      if (foundUser) {
          // Simple auth check. In a real app, this would use hashed passwords.
          if (foundUser.password && foundUser.password !== password) {
              return false;
          }
          const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
          setUser(updatedUser);
          setUsers(prev => prev.map(u => u.id === foundUser.id ? updatedUser : u));
          logAction('LOGIN', 'Session', foundUser.id, 'User logged in successfully');
          return true;
      }
      return false;
  };

  const logout = () => {
      if (user) logAction('LOGOUT', 'Session', user.id, 'User logged out');
      setUser(null);
  };

  const getPatientById = useCallback((id: string) => patients.find(p => p.id === id), [patients]);
  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getDepartmentById = useCallback((id: string) => departments.find(d => d.id === id), [departments]);

  const addPatient = useCallback((patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): string => {
    const ts = new Date().toISOString();
    const id = generateSecureId('PAT');
    const newPatient: Patient = { ...patientData, id, createdAt: ts, updatedAt: ts, createdBy: user?.name || 'System' };
    setPatients(prev => [newPatient, ...prev]);
    logAction('CREATE', 'Patient', newPatient.id, `Registered: ${newPatient.firstName}`, null, newPatient);
    return id;
  }, [logAction, user]);

  const updatePatient = useCallback((updatedPatient: Patient) => {
    const ts = new Date().toISOString();
    setPatients(prev => {
      const before = prev.find(p => p.id === updatedPatient.id);
      const updated = { ...updatedPatient, updatedAt: ts };
      logAction('UPDATE', 'Patient', updated.id, `Updated: ${updated.firstName}`, before, updated);
      return prev.map(p => p.id === updated.id ? updated : p);
    });
  }, [logAction]);

  const deletePatient = useCallback((id: string) => {
      setPatients(prev => {
          const target = prev.find(p => p.id === id);
          if (target) {
              logAction('DELETE', 'Patient', id, `Deleted: ${target.firstName}`, target, null);
          }
          return prev.filter(p => p.id !== id);
      });
  }, [logAction]);

  const addRequest = useCallback((requestData: Omit<AnalysisRequest, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): string => {
    const ts = new Date().toISOString();
    const id = generateSecureId('AR');
    const newRequest: AnalysisRequest = { ...requestData, id, createdAt: ts, updatedAt: ts, createdBy: user?.name || 'System' };
    setRequests(prev => [newRequest, ...prev]);
    logAction('CREATE', 'AnalysisRequest', newRequest.id, `Accessioning: ${newRequest.patientId}`, null, newRequest);
    return id;
  }, [logAction, user]);

  const updateRequestStatus = useCallback((id: string, status: SampleStatus) => {
    const ts = new Date().toISOString();
    setRequests(prev => {
      const before = prev.find(r => r.id === id);
      if (!before) return prev;
      const updated = { ...before, status, updatedAt: ts };
      logAction('STATUS_CHANGE', 'AnalysisRequest', id, `Moved to ${status}`, before, updated);
      return prev.map(r => r.id === id ? updated : r);
    });
  }, [logAction]);

  const updateAnalysisResult = useCallback((requestId: string, keyword: string, result: string) => {
    const ts = new Date().toISOString();
    setRequests(prev => {
      const targetReq = prev.find(r => r.id === requestId);
      if (!targetReq) return prev;
      const before = JSON.parse(JSON.stringify(targetReq));
      
      const updatedAnalyses = targetReq.analyses.map(analysis => 
        analysis.keyword === keyword ? { ...analysis, result, status: 'Complete' as const } : analysis
      );
      
      // Determine new status without regressing if already verified/published
      let newStatus = targetReq.status;
      
      // Only advance to TESTING automatically if currently in a pre-testing state
      if ([SampleStatus.RECEIVED, SampleStatus.COLLECTED, SampleStatus.IN_LAB].includes(targetReq.status)) {
          newStatus = SampleStatus.TESTING;
      }
      
      // Check if all analyses are now complete
      const allComplete = updatedAnalyses.every(a => a.status === 'Complete');
      
      // If all are complete and we were in TESTING phase, auto-advance to VERIFIED
      // This prevents stuck workflows
      if (allComplete && newStatus === SampleStatus.TESTING) {
          newStatus = SampleStatus.VERIFIED;
      }

      const updatedReq = { ...targetReq, analyses: updatedAnalyses, status: newStatus, updatedAt: ts };
      logAction('RESULT_ENTRY', 'AnalysisRequest', requestId, `Entered ${keyword}`, before, updatedReq);
      return prev.map(r => r.id === requestId ? updatedReq : r);
    });
  }, [logAction]);

  const rejectSample = useCallback((requestId: string, reason: string) => {
    const ts = new Date().toISOString();
    setRequests(prev => {
      const before = prev.find(r => r.id === requestId);
      if (!before) return prev;
      const updated = { ...before, status: SampleStatus.REJECTED, updatedAt: ts };
      logAction('REJECT', 'AnalysisRequest', requestId, reason, before, updated);
      return prev.map(r => r.id === requestId ? updated : r);
    });
  }, [logAction]);

  const updateStock = useCallback((itemId: string, quantity: number) => {
    const ts = new Date().toISOString();
    setInventory(prev => {
      const before = prev.find(i => i.id === itemId);
      if (!before) return prev;
      const updated = { ...before, quantity, updatedAt: ts };
      logAction('STOCK_ADJUST', 'Inventory', itemId, `Level: ${quantity}`, before, updated);
      return prev.map(i => i.id === itemId ? updated : i);
    });
  }, [logAction]);

  const addInventoryItem = useCallback((itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const ts = new Date().toISOString();
    const newItem: InventoryItem = { ...itemData, id: generateSecureId('INV'), createdAt: ts, updatedAt: ts, createdBy: user?.name || 'System' };
    setInventory(prev => [...prev, newItem]);
    logAction('CREATE', 'Inventory', newItem.id, newItem.name, null, newItem);
  }, [logAction, user]);

  const addDepartment = useCallback((deptData: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const ts = new Date().toISOString();
    const newDept: Department = { ...deptData, id: generateSecureId('DEPT'), createdAt: ts, updatedAt: ts, createdBy: user?.name || 'System' };
    setDepartments(prev => [...prev, newDept]);
    logAction('CREATE', 'Department', newDept.id, newDept.name, null, newDept);
  }, [logAction, user]);

  const addTest = useCallback((deptId: string, test: TestDefinition) => {
    const ts = new Date().toISOString();
    setDepartments(prev => prev.map(dept => {
      if (dept.id === deptId) {
        const before = { ...dept };
        const updated = { ...dept, tests: [...dept.tests, test], testCount: dept.testCount + 1, updatedAt: ts };
        logAction('CONFIG_CHANGE', 'Department', deptId, `Added: ${test.name}`, before, updated);
        return updated;
      }
      return dept;
    }));
  }, [logAction]);

  const updateTest = useCallback((deptId: string, updatedTest: TestDefinition) => {
    const ts = new Date().toISOString();
    setDepartments(prev => prev.map(dept => {
      if (dept.id === deptId) {
        const before = { ...dept };
        const newTests = dept.tests.map(t => t.code === updatedTest.code ? updatedTest : t);
        const updated = { ...dept, tests: newTests, updatedAt: ts };
        logAction('CONFIG_CHANGE', 'Department', deptId, `Updated: ${updatedTest.name}`, before, updated);
        return updated;
      }
      return dept;
    }));
  }, [logAction]);

  const deleteTest = useCallback((deptId: string, testCode: string) => {
    const ts = new Date().toISOString();
    setDepartments(prev => prev.map(dept => {
        if (dept.id === deptId) {
            const before = { ...dept };
            const newTests = dept.tests.filter(t => t.code !== testCode);
            const updated = { ...dept, tests: newTests, testCount: Math.max(0, dept.testCount - 1), updatedAt: ts };
            logAction('CONFIG_CHANGE', 'Department', deptId, `Deleted Test: ${testCode}`, before, updated);
            return updated;
        }
        return dept;
    }));
  }, [logAction]);

  const addClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const ts = new Date().toISOString();
    const newClient: Client = { ...clientData, id: generateSecureId('CLIENT'), createdAt: ts, updatedAt: ts, createdBy: user?.name || 'System' };
    setClients(prev => [...prev, newClient]);
    logAction('CREATE', 'Client', newClient.id, newClient.name, null, newClient);
  }, [logAction, user]);

  const updateClient = useCallback((updatedClient: Client) => {
    const ts = new Date().toISOString();
    setClients(prev => {
        const before = prev.find(c => c.id === updatedClient.id);
        const updated = { ...updatedClient, updatedAt: ts };
        logAction('UPDATE', 'Client', updated.id, `Updated Info: ${updated.name}`, before, updated);
        return prev.map(c => c.id === updated.id ? updated : c);
    });
  }, [logAction]);

  const recordPayment = useCallback((requestId: string, amount: number) => {
    // Validate inputs
    if (amount <= 0) {
        console.error("Invalid payment amount: must be positive.");
        return;
    }

    const ts = new Date().toISOString();
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        // Prevent overpayment
        if (amount > req.dueAmount + 0.01) { // small tolerance for float math
             console.warn("Payment exceeds due amount. Transaction aborted.");
             return req; 
        }

        const before = { ...req };
        const newPaid = req.paidAmount + amount;
        const newDue = Math.max(0, (req.totalFee - req.discount) - newPaid);
        const updated = { ...req, paidAmount: newPaid, dueAmount: newDue, updatedAt: ts };
        logAction('FINANCE', 'AnalysisRequest', requestId, `Payment: ${amount}`, before, updated);
        return updated;
      }
      return req;
    }));
  }, [logAction]);

  const createWorksheet = useCallback((wsData: Omit<Worksheet, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const ts = new Date().toISOString();
    const newWS: Worksheet = { ...wsData, id: generateSecureId('WS'), createdAt: ts, updatedAt: ts, createdBy: user?.name || 'System' };
    setWorksheets(prev => [newWS, ...prev]);
    setRequests(prev => prev.map(req => {
      if (newWS.entries.find(e => e.requestId === req.id)) {
        return { ...req, status: SampleStatus.IN_LAB, updatedAt: ts };
      }
      return req;
    }));
    logAction('CREATE', 'Worksheet', newWS.id, newWS.departmentId, null, newWS);
  }, [logAction, user]);

  const closeWorksheet = useCallback((id: string) => {
    const ts = new Date().toISOString();
    setWorksheets(prev => prev.map(ws => {
      if (ws.id === id) {
        const before = { ...ws };
        const updated = { ...ws, status: 'Closed' as const, updatedAt: ts };
        logAction('WS_CLOSE', 'Worksheet', id, 'Closed', before, updated);
        return updated;
      }
      return ws;
    }));
  }, [logAction]);

  const addInstrument = useCallback((instrumentData: Omit<Instrument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const ts = new Date().toISOString();
    const newInst: Instrument = { ...instrumentData, id: generateSecureId('INST'), createdAt: ts, updatedAt: ts, createdBy: user?.name || 'System' };
    setInstruments(prev => [...prev, newInst]);
    logAction('CREATE', 'Instrument', newInst.id, `Provisioned: ${newInst.name}`, null, newInst);
  }, [logAction, user]);

  const importInstrumentData = useCallback((data: {requestId: string, testCode: string, result: string}[]) => {
    let success = 0;
    let failed = 0;
    data.forEach(item => {
      const req = requests.find(r => r.id === item.requestId);
      if (req && req.analyses.some(a => a.keyword === item.testCode)) {
        updateAnalysisResult(item.requestId, item.testCode, item.result);
        success++;
      } else {
        failed++;
      }
    });
    if (success > 0) logAction('IMPORT', 'Instrument', 'BATCH', `Imported ${success} results`, null, { success, failed });
    return { success, failed };
  }, [requests, updateAnalysisResult, logAction]);

  const addUser = useCallback((userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const ts = new Date().toISOString();
    const newUser: User = { ...userData, id: generateSecureId('USR'), createdAt: ts, updatedAt: ts, createdBy: user?.name || 'System' };
    setUsers(prev => [...prev, newUser]);
    logAction('CREATE', 'User', newUser.id, `Created User: ${newUser.name}`, null, newUser);
  }, [logAction, user]);

  const updateUserStatus = useCallback((id: string, status: 'Active' | 'Inactive') => {
    const ts = new Date().toISOString();
    setUsers(prev => {
        const before = prev.find(u => u.id === id);
        const updated = { ...before!, status, updatedAt: ts };
        logAction('UPDATE', 'User', id, `Status change: ${status}`, before, updated);
        return prev.map(u => u.id === id ? updated : u);
    });
  }, [logAction]);

  const updateSettings = useCallback((newSettings: Partial<LabSettings>) => {
    setSettings(prev => {
       const updated = { ...prev, ...newSettings };
       logAction('CONFIG_CHANGE', 'System', 'Settings', 'Updated Lab Configuration', prev, updated);
       return updated;
    });
  }, [logAction]);

  const logReportGeneration = useCallback((reportType: string, format: string) => {
    logAction('REPORT_GENERATE', 'Report', reportType, `Generated ${format} report`, null, { format });
  }, [logAction]);

  const logQC = useCallback((instrument: string, result: string, details: string) => {
    logAction('QC_RUN', 'Instrument', instrument, `Result: ${result}. ${details}`, null, { result });
  }, [logAction]);

  return (
    <LabContext.Provider value={{ 
      user, login, logout,
      patients, requests, departments, inventory, clients, auditLogs, worksheets, instruments, settings, users,
      getPatientById, getClientById, getDepartmentById,
      addPatient, updatePatient, deletePatient,
      addRequest, updateRequestStatus, updateAnalysisResult, rejectSample,
      updateStock, addInventoryItem, addDepartment, addTest, updateTest, deleteTest,
      addClient, updateClient, recordPayment,
      createWorksheet, closeWorksheet, addInstrument, importInstrumentData, updateSettings,
      addUser, updateUserStatus, logReportGeneration, logQC
    }}>
      {children}
    </LabContext.Provider>
  );
};

export const useLab = () => {
  const context = useContext(LabContext);
  if (context === undefined) throw new Error('useLab must be used within a LabProvider');
  return context;
};
