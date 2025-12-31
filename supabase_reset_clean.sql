-- DANGER: THIS SCRIPT DELETES ALL DATA
-- It resets the database schema to a known clean state matching the TypeScript application.

-- 1. Drop existing tables (Cascade deletes dependencies)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.analysis_requests CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.worksheets CASCADE;

-- 2. Create Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. Utility Functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Tables (Clean Slate)

-- Patients (UUID IDs)
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mrn TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    contact TEXT,
    email TEXT,
    address TEXT,
    age INTEGER,
    age_unit TEXT DEFAULT 'Year',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Clients (String IDs: "CL-...")
CREATE TABLE public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Analysis Requests (String IDs: "AR-...")
CREATE TABLE public.analysis_requests (
    id TEXT PRIMARY KEY, 
    client_id TEXT REFERENCES public.clients(id),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    sample_type TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT DEFAULT 'Normal',
    total_fee DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    referrer TEXT,
    analyses JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Inventory (String IDs: "INV-...")
CREATE TABLE public.inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    lot_number TEXT,
    expiry_date DATE,
    quantity DECIMAL(12,2) DEFAULT 0,
    unit TEXT,
    min_level DECIMAL(12,2) DEFAULT 0,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Audit Logs (String IDs to allow "LOG-..." or UUIDs)
CREATE TABLE public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    "user" TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details TEXT,
    "before" JSONB,
    "after" JSONB,
    correlation_id TEXT
);

-- 5. Triggers
CREATE TRIGGER set_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_requests_updated_at BEFORE UPDATE ON public.analysis_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 6. RLS (Optional but recommended - Basic Open Access)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.patients FOR ALL USING (true);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.clients FOR ALL USING (true);

ALTER TABLE public.analysis_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.analysis_requests FOR ALL USING (true);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.inventory FOR ALL USING (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.audit_logs FOR ALL USING (true);
