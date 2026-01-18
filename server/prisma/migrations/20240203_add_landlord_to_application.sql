-- Add landlordId column to Application table
ALTER TABLE "public"."Application" ADD COLUMN "landlordId" text;

-- Update existing applications with landlordId from Property
UPDATE "public"."Application" a
SET "landlordId" = p."landlordId"
FROM "public"."Property" p
WHERE a."propertyId" = p.id;

-- Make landlordId not null after updating existing records
ALTER TABLE "public"."Application" ALTER COLUMN "landlordId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "public"."Application" 
ADD CONSTRAINT "Application_landlordId_fkey" 
FOREIGN KEY ("landlordId") REFERENCES "public"."Landlord"("supabaseId") ON DELETE RESTRICT ON UPDATE CASCADE; 