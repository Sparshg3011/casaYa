-- =====================================================
-- FIX NEWSLETTER PERMISSIONS
-- =====================================================
-- Run this in your Supabase SQL Editor to fix the permission issues

-- First, let's check if the table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'newsletter_subscribers';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous newsletter signups" ON "public"."newsletter_subscribers";
DROP POLICY IF EXISTS "Allow service role full access" ON "public"."newsletter_subscribers";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."newsletter_subscribers";
DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."newsletter_subscribers";

-- Disable RLS temporarily to test
ALTER TABLE "public"."newsletter_subscribers" DISABLE ROW LEVEL SECURITY;

-- Test insert (this should work now)
-- You can test by running: INSERT INTO newsletter_subscribers (name, email, subscribed_at, updated_at) VALUES ('Test', 'test@test.com', NOW(), NOW());

-- Re-enable RLS with proper policies
ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Enable all operations for service role" ON "public"."newsletter_subscribers"
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated and anonymous users" ON "public"."newsletter_subscribers"
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Enable read for service role" ON "public"."newsletter_subscribers"
    FOR SELECT TO service_role
    USING (true);

-- Grant explicit permissions to service role
GRANT ALL ON "public"."newsletter_subscribers" TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'newsletter_subscribers';

SELECT 'Newsletter permissions fixed successfully!' as status;