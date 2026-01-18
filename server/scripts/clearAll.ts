import { prisma } from '../models/prisma';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Using the correct env variable name
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function clearSupabaseStorage() {
  try {
    console.log('Clearing Supabase Storage...');
    
    // Delete all objects in profile-images bucket
    console.log('Clearing profile-images bucket...');
    const { data: profileImages, error: profileError } = await supabaseAdmin.storage
      .emptyBucket('profile-images');
    if (profileError) throw profileError;
    
    // Delete all objects in application-documents bucket
    console.log('Clearing application-documents bucket...');
    const { data: appDocs, error: appError } = await supabaseAdmin.storage
      .emptyBucket('application-documents');
    if (appError) throw appError;

    // Delete all objects in property-photos bucket
    console.log('Clearing property-photos bucket...');
    const { data: propertyPhotos, error: propertyError } = await supabaseAdmin.storage
      .emptyBucket('property-photos');
    if (propertyError) throw propertyError;

    console.log('All storage buckets cleared successfully!');
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

async function clearSupabaseAuth() {
  try {
    console.log('Clearing Supabase Auth Users...');
    
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Delete each user
    for (const user of users.users) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;
    }

    console.log('Auth users cleared successfully!');
  } catch (error) {
    console.error('Error clearing auth users:', error);
    throw error;
  }
}

async function clearDatabase() {
  try {
    console.log('Clearing Database...');

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
    throw error;
  }
}

async function clearAll() {
  try {
    // Clear everything in sequence
    await clearSupabaseStorage();
    await clearSupabaseAuth();
    await clearDatabase();
    
    console.log('Everything cleared successfully!');
  } catch (error) {
    console.error('Error during clearing process:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
clearAll(); 