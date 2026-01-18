-- Create newsletter_subscribers table
-- Run this directly in your Supabase SQL editor

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

-- Create policy to allow anonymous inserts (for newsletter signup)
CREATE POLICY IF NOT EXISTS "Allow anonymous newsletter signups" ON "public"."newsletter_subscribers"
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policy to allow service role to read all
CREATE POLICY IF NOT EXISTS "Allow service role full access" ON "public"."newsletter_subscribers"
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);