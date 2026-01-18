import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

async function executeSQL() {
  try {
    // Drop functions one by one
    console.log('Dropping existing functions...');
    await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS verify_landlord_application(text, text);');
    await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS verify_landlord_application(uuid, uuid);');
    console.log('Drop SQL executed successfully');

    // Then execute the create function SQL
    const createSqlPath = path.join(__dirname, 'verify_landlord_application.sql');
    const createSqlContent = fs.readFileSync(createSqlPath, 'utf8');

    console.log('Executing create SQL:', createSqlContent);
    await prisma.$executeRawUnsafe(createSqlContent);
    console.log('Create SQL executed successfully');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

executeSQL(); 