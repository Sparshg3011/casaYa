-- Grant schema usage to service role and authenticated users
GRANT USAGE ON SCHEMA public TO service_role, authenticated;

-- Grant table access to service role and authenticated users
GRANT ALL ON "public"."Application" TO service_role;
GRANT SELECT ON "public"."Application" TO authenticated;

-- Enable RLS on Application table
ALTER TABLE "public"."Application" ENABLE ROW LEVEL SECURITY;

-- Create policies for Application table
CREATE POLICY "Allow service role full access" ON "public"."Application"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow tenants to read their own applications
CREATE POLICY "Allow tenants to read own applications" ON "public"."Application"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "tenantId");

-- Allow landlords to read applications for their properties
CREATE POLICY "Allow landlords to read property applications" ON "public"."Application"
FOR SELECT
TO authenticated
USING (
    auth.uid()::text = "landlordId" OR
    EXISTS (
        SELECT 1 FROM "public"."Property" p
        WHERE p.id = "Application"."propertyId"
        AND p."landlordId" = auth.uid()::text
    )
);

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant access to storage bucket
GRANT ALL ON STORAGE BUCKET application-documents TO authenticated;

-- Storage bucket RLS policy
CREATE POLICY "Allow authenticated users to read application documents" ON STORAGE.OBJECTS
FOR ALL USING (
    bucket_id = 'application-documents' AND (
        EXISTS (
            SELECT 1 FROM "public"."Application" a
            WHERE (a."tenantId" = auth.uid()::text OR a."landlordId" = auth.uid()::text)
            AND storage.foldername(name) = a.id::text
        )
    )
); 