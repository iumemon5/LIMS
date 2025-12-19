
/**
 * @file types.ts
 * @description Domain entity definitions for the M-Solutions LIMS.
 * Adheres to ISO 17025 requirements for traceability and auditing.
 */

export enum SampleStatus {
  RECEIVED = 'Received',
  COLLECTED = 'Collected',
  IN_LAB = 'In Lab',
  TESTING = 'Testing',
  VERIFIED = 'Verified',
  PUBLISHED = 'Published',
  REJECTED = 'Rejected'
}

export type AgeUnit = 'Year' | 'Month' | 'Day';
export type Gender = 'Male' | 'Female' | 'Other';
export type Priority = 'Normal' | 'Urgent' | 'Emergency';

/**
 * Base interface for all persistent entities
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Patient extends BaseEntity {
  mrn: string;
  title?: string;
  firstName: string;
  lastName: string;
  relationType?: 'S/O' | 'D/O' | 'W/O' | 'H/O';
  relationName?: string;
  cnic?: string;
  address?: string;
  age: number;
  ageUnit: AgeUnit;
  gender: Gender;
  contact: string;
  email?: string;
  lastVisit?: string;
  dob: string;
}

export interface TestDefinition {
  code: string;
  name: string;
  price: number;
  departmentId: string;
  tatHours: number;
  unit?: string;
  referenceRange?: string;
}

export interface Department extends BaseEntity {
  name: string;
  testCount: number;
  tests: TestDefinition[];
}

export interface Client extends BaseEntity {
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface AnalysisPart {
  keyword: string;
  title: string;
  price: number;
  unit: string;
  status: 'Pending' | 'Complete' | 'Flagged';
  result?: string;
  referenceRange?: string;
  notes?: string;
}

export interface AnalysisRequest extends BaseEntity {
  clientId: string;
  patientId: string;
  sampleType: string;
  status: SampleStatus;
  dateReceived: string;
  priority: Priority;
  totalFee: number;
  discount: number;
  paidAmount: number;
  dueAmount: number;
  referrer: string;
  analyses: AnalysisPart[];
}

/**
 * Invoice interface for financial tracking
 */
export interface Invoice extends BaseEntity {
  requestId: string;
  clientId: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  dateIssued: string;
}

/**
 * Audit Log Entry (ISO 17025 compliant)
 */
export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: string; // JSON string of state before mutation
  after?: string;  // JSON string of state after mutation
  correlationId: string;
  details: string;
}

export interface InventoryItem extends BaseEntity {
  name: string;
  category: 'Reagent' | 'Consumable' | 'Equipment';
  lotNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  minLevel: number;
  location: string;
}

export interface Worksheet extends BaseEntity {
  name: string;
  departmentId: string;
  analyst: string;
  status: 'Open' | 'Closed';
  entries: {
    requestId: string;
    patientName: string;
    sampleType: string;
    priority: string;
  }[];
}

export interface Instrument extends BaseEntity {
  name: string;
  type: string;
  protocol: 'HL7' | 'ASTM' | 'CSV' | 'Proprietary';
  ipAddress: string;
  status: 'Online' | 'Offline' | 'Busy';
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  passwordHash?: string; // Storing hash instead of plaintext
  role: 'Super Admin' | 'Pathologist' | 'Technician' | 'Receptionist';
  status: 'Active' | 'Inactive';
  lastLogin?: string;
}

export interface LabSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  timezone: string;
  autoBackup: boolean;
  enforce2FA: boolean;
  notifications: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    lowStockWarning: boolean;
    criticalResultAlert: boolean;
    dailyReport: boolean;
  };
}
