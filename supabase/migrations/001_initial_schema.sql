-- ==============================================================================
-- TagSilo Pro - Supabase PostgreSQL Database Schema & Security Layer
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users & Subscription Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    picture TEXT,
    chrome_id TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'free', -- 'active', 'inactive', 'free', 'trialing', 'cancelled'
    tier TEXT NOT NULL DEFAULT 'free',                -- 'free', 'pro', 'enterprise'
    creem_customer_id TEXT,
    creem_subscription_id TEXT,
    license_key TEXT,
    daily_sync_count INT DEFAULT 0,
    last_sync_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for High-Speed Lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_chrome_id ON public.users(chrome_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_creem_customer_id ON public.users(creem_customer_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies (Deny Public Access, Allow Only Service Role / Backend)
-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role has full access to users table" ON public.users;
DROP POLICY IF EXISTS "Deny all public anonymous access" ON public.users;

-- Policy A: Grant full read/write privileges strictly to Supabase Service Role (Serverless Backend Functions)
CREATE POLICY "Service role has full access to users table"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy B: Deny all unauthenticated or client-side direct access (Must go through Vercel Functions)
CREATE POLICY "Deny all public anonymous access"
    ON public.users
    FOR ALL
    TO anon, authenticated
    USING (false);

-- 6. Trigger for Automatic Updated_At Timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Audit Webhook Events Table (Optional Logging)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to webhook_events"
    ON public.webhook_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
