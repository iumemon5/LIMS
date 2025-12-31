-- Add missing columns to audit_logs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'before') THEN
        ALTER TABLE public.audit_logs ADD COLUMN "before" JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'after') THEN
        ALTER TABLE public.audit_logs ADD COLUMN "after" JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'correlation_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN correlation_id TEXT;
    END IF;
END $$;
