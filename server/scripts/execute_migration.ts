import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

async function executeMigration() {
  try {
    // Add landlordId column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."Application" ADD COLUMN IF NOT EXISTS "landlordId" text;
    `);
    console.log('Added landlordId column');

    // Update existing applications
    await prisma.$executeRawUnsafe(`
      UPDATE "public"."Application" a
      SET "landlordId" = p."landlordId"
      FROM "public"."Property" p
      WHERE a."propertyId" = p.id
      AND a."landlordId" IS NULL;
    `);
    console.log('Updated existing applications');

    // Make landlordId not null
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."Application" ALTER COLUMN "landlordId" SET NOT NULL;
    `);
    console.log('Made landlordId not null');

    // Drop existing constraint if it exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."Application" 
      DROP CONSTRAINT IF EXISTS "Application_landlordId_fkey";
    `);
    console.log('Dropped existing constraint');

    // Add foreign key constraint
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."Application" 
      ADD CONSTRAINT "Application_landlordId_fkey" 
      FOREIGN KEY ("landlordId") REFERENCES "public"."Landlord"("supabaseId") 
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
    console.log('Added foreign key constraint');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

executeMigration(); 