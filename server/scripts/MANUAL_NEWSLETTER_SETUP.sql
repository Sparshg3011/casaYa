-- =====================================================
-- NEWSLETTER SUBSCRIBERS TABLE SETUP
-- =====================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste this code > Run

-- Create newsletter_subscribers table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subscribed_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key" 
ON "public"."newsletter_subscribers"("email");

-- Enable Row Level Security
ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous newsletter signups" ON "public"."newsletter_subscribers";
DROP POLICY IF EXISTS "Allow service role full access" ON "public"."newsletter_subscribers";

-- Create policy to allow anonymous inserts (for newsletter signup from frontend)
CREATE POLICY "Allow anonymous newsletter signups" ON "public"."newsletter_subscribers"
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policy to allow service role full access (for backend operations)
CREATE POLICY "Allow service role full access" ON "public"."newsletter_subscribers"
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Verify the table was created successfully
SELECT 'Newsletter table setup completed successfully!' as status;
SELECT COUNT(*) as current_subscriber_count FROM "public"."newsletter_subscribers";