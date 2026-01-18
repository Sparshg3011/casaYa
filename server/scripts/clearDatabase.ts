import { prisma } from '../models/prisma';

async function clearDatabase() {
  try {
    // Delete in order of dependencies to avoid foreign key constraint issues
    console.log('Clearing database...');

    // First, delete tables with foreign keys to other tables
    console.log('Deleting ApplicationNotes...');
    await prisma.applicationNote.deleteMany();

    console.log('Deleting PaymentHistory...');
    await prisma.paymentHistory.deleteMany();

    console.log('Deleting Favorites...');
    await prisma.favorite.deleteMany();

    console.log('Deleting Applications...');
    await prisma.application.deleteMany();

    console.log('Deleting Properties...');
    await prisma.property.deleteMany();

    // Finally, delete the main tables
    console.log('Deleting Tenants...');
    await prisma.tenant.deleteMany();

    console.log('Deleting Landlords...');
    await prisma.landlord.deleteMany();

    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
clearDatabase(); 