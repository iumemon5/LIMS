-- MSolutions LIMS Supabase Schema
-- ISO 17025 Compliant

-- Enable pgcrypto for UUIDs if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
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

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
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

-- 3. Analysis Requests Table
CREATE TABLE IF NOT EXISTS public.analysis_requests (
    id TEXT PRIMARY KEY, -- AR-YY-XXXX format
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

-- 4. Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
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

-- 5. Audit Logs Table (Immutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    "user" TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details TEXT,
    before JSONB,
    after JSONB,
    correlation_id TEXT
);

-- Create updated_at triggers
CREATE TRIGGER set_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_requests_updated_at BEFORE UPDATE ON public.analysis_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Note on RLS:
-- For now, we assume simple access. 
-- In production, you MUST enable RLS and set policies.
-- ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON public.patients FOR ALL USING (true);
