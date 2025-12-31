
import { SampleStatus, Client, AnalysisRequest, Patient, Invoice, AuditLog, Department, LabSettings, User } from './types';

export const SCHEMA_VERSION = '1.0.1';

// Dynamic Date Helpers
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

const MOCK_META = {
  createdAt: daysAgo(30),
  updatedAt: daysAgo(1),
  createdBy: 'system_init'
};

// SHA-256 hash for 'admin123'
const DEFAULT_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

export const DEFAULT_SETTINGS: LabSettings = {
  name: 'M-Solutions LIMS',
  address: 'Suite 404, Techno City, Karachi, Pakistan',
  phone: '+92 21 34567890',
  email: 'admin@msolutions.pk',
  website: 'www.msolutions.pk',
  currency: 'PKR',
  timezone: 'Asia/Karachi',
  autoBackup: true,
  enforce2FA: false,
  notifications: {
    emailAlerts: true,
    smsAlerts: false,
    lowStockWarning: true,
    criticalResultAlert: true,
    dailyReport: false
  }
};

export const DEFAULT_USERS: User[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'Administrator',
    email: 'admin@msolutions.pk',
    passwordHash: DEFAULT_HASH,
    role: 'Super Admin',
    status: 'Active',
    lastLogin: hoursAgo(1),
    ...MOCK_META
  },
  {
    id: 'USR-PATH-01',
    name: 'Dr. Faisal Khan',
    email: 'faisal@msolutions.pk',
    passwordHash: DEFAULT_HASH,
    role: 'Pathologist',
    status: 'Active',
    lastLogin: daysAgo(1),
    ...MOCK_META
  },
  {
    id: 'USR-TECH-01',
    name: 'Sarah Ahmed',
    email: 'sarah@msolutions.pk',
    passwordHash: DEFAULT_HASH,
    role: 'Technician',
    status: 'Inactive',
    lastLogin: daysAgo(5),
    ...MOCK_META
  }
];

export const DEPARTMENTS: Department[] = [
  {
    id: 'BIO',
    name: 'Biochemistry',
    testCount: 3,
    ...MOCK_META,
    tests: [
      { code: 'LFT', name: 'Liver Function Test', price: 1200, departmentId: 'BIO', tatHours: 24, unit: 'U/L', referenceRange: '0 - 40' },
      { code: 'RFT', name: 'Renal Function Test', price: 1000, departmentId: 'BIO', tatHours: 24, unit: 'mg/dL', referenceRange: '0.6 - 1.2' },
      { code: 'GLU', name: 'Glucose (Random)', price: 300, departmentId: 'BIO', tatHours: 2, unit: 'mg/dL', referenceRange: '70 - 140' },
    ]
  },
  {
    id: 'HAEM',
    name: 'Haematology',
    testCount: 4,
    ...MOCK_META,
    tests: [
      { code: 'CBC', name: 'Complete Blood Count', price: 500, departmentId: 'HAEM', tatHours: 12, unit: '10^9/L', referenceRange: '4.0 - 11.0' },
      { code: 'APTT', name: 'APTT', price: 400, departmentId: 'HAEM', tatHours: 4, unit: 'sec', referenceRange: '25 - 35' },
      { code: 'BTCT', name: 'Bleeding & Clotting Time', price: 0, departmentId: 'HAEM', tatHours: 1, unit: 'min', referenceRange: '2 - 7' },
      { code: 'GROUP', name: 'Blood Grouping', price: 200, departmentId: 'HAEM', tatHours: 1, unit: '', referenceRange: 'N/A' },
    ]
  },
  {
    id: 'PATH',
    name: 'Clinical Pathology',
    testCount: 1,
    ...MOCK_META,
    tests: [
      { code: 'URINE', name: 'Urine Detail Examination', price: 350, departmentId: 'PATH', tatHours: 4, unit: '', referenceRange: 'N/A' },
    ]
  }
];

export const PATIENTS: Patient[] = [
  {
    id: 'PAT-HABI-001',
    mrn: '251121-001',
    firstName: 'Habibullah',
    lastName: 'Khan',
    age: 45,
    ageUnit: 'Year',
    dob: '1979-04-12',
    gender: 'Male',
    contact: '0300-1234567',
    ...MOCK_META,
    createdAt: daysAgo(15)
  },
  {
    id: 'PAT-SAMI-002',
    mrn: '251121-002',
    firstName: 'Samina',
    lastName: 'Ahmed',
    age: 32,
    ageUnit: 'Year',
    dob: '1992-08-25',
    gender: 'Female',
    contact: '0321-7654321',
    ...MOCK_META,
    createdAt: daysAgo(10)
  },
];

export const CLIENTS: Client[] = [
  { id: 'CL-SBCC-001', name: 'Shahani Bone Care Centre', code: 'SBCC', contactPerson: 'Dr. Shahani', email: 'info@shahani.pk', phone: '021-3456789', ...MOCK_META },
  { id: 'CL-KMC-002', name: 'Karachi Medical Center', code: 'KMC', contactPerson: 'Dr. Faisal', email: 'faisal@kmc.com.pk', phone: '021-9876543', ...MOCK_META },
];

export const MOCK_REQUESTS: AnalysisRequest[] = [
  {
    id: 'AR-24-001',
    clientId: 'CL-SBCC-001',
    patientId: 'PAT-HABI-001',
    sampleType: 'Blood',
    status: SampleStatus.VERIFIED,
    dateReceived: daysAgo(2).split('T')[0],
    priority: 'Normal',
    totalFee: 2500,
    discount: 0,
    paidAmount: 2500,
    dueAmount: 0,
    referrer: 'Self',
    ...MOCK_META,
    createdAt: daysAgo(2),
    analyses: [
      { keyword: 'CBC', title: 'Complete Blood Count', price: 500, unit: '10^9/L', status: 'Complete', result: '14.5', referenceRange: '4.0 - 11.0' }
    ]
  },
  {
    id: 'AR-24-002',
    clientId: 'CL-SBCC-001',
    patientId: 'PAT-SAMI-002',
    sampleType: 'Blood',
    status: SampleStatus.RECEIVED,
    dateReceived: hoursAgo(4).split('T')[0],
    priority: 'Urgent',
    totalFee: 1200,
    discount: 200,
    paidAmount: 1000,
    dueAmount: 0,
    referrer: 'Dr. Faisal',
    ...MOCK_META,
    createdAt: hoursAgo(4),
    analyses: [
      { keyword: 'LFT', title: 'Liver Function Test', price: 1200, unit: 'U/L', status: 'Pending', referenceRange: '0 - 40' }
    ]
  }
];

export const AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-INIT-1',
    timestamp: daysAgo(1),
    user: 'system',
    action: 'INITIALIZE',
    resourceType: 'System',
    resourceId: 'Global',
    correlationId: 'CID-BOOT-001',
    details: 'Laboratory information system initialized with seed data.'
  }
];
