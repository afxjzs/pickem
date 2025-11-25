-- Expose pickem schema in PostgREST API
-- This migration ensures the pickem schema is accessible via the Supabase API
-- Note: This may need to be done manually in the Supabase Dashboard if SQL doesn't work

-- Grant usage on schema to API roles (if not already done)
GRANT USAGE ON SCHEMA pickem TO anon;
GRANT USAGE ON SCHEMA pickem TO authenticated;
GRANT USAGE ON SCHEMA pickem TO service_role;

-- Note: Exposing schemas in PostgREST is typically done via the Supabase Dashboard
-- Go to: Project Settings → API → Exposed schemas
-- Add: pickem
-- 
-- Or via the config.toml for local development (already done)
-- For production, this must be configured in the Dashboard

