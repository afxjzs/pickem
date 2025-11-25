-- Create pickem schema for shared Supabase project
-- This schema isolates pickem app data from doug-is app data (which uses public schema)

-- Create the pickem schema
CREATE SCHEMA IF NOT EXISTS pickem;

-- Grant usage on schema to authenticated and anon roles
GRANT USAGE ON SCHEMA pickem TO authenticated;
GRANT USAGE ON SCHEMA pickem TO anon;

-- Grant usage on schema to service role (for service role clients)
GRANT USAGE ON SCHEMA pickem TO service_role;

-- Grant create privileges so tables can be created in this schema
GRANT CREATE ON SCHEMA pickem TO service_role;

