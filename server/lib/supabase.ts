// server/lib/supabase.ts
// @iker592 Supabase init file

import { createClient } from '@supabase/supabase-js';
import type { Bucket } from '@supabase/storage-js';

export function createSupabaseClient(useServiceRole: boolean = false) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY! 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (useServiceRole) {
    console.log('Creating admin client with service role');
    console.log('Using URL:', supabaseUrl);
    // Log first and last few characters of the key for debugging
    console.log('Key preview:', supabaseKey ? `${supabaseKey.substring(0, 4)}...${supabaseKey.substring(supabaseKey.length - 4)}` : 'missing');
  }

  const client = createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: useServiceRole ? {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        } : undefined
      }
    }
  );

  if (useServiceRole) {
    // Test the client with a simpler query
    client
      .from('Application')
      .select('count')
      .limit(0)
      .then(({ error }) => {
        if (error) {
          console.error('Admin client test failed:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('Admin client test successful - database access confirmed');
        }
      });
  }
  
  return client;
}

// Export a default instance for general use (with anon key)
export const supabase = createSupabaseClient();

export async function ensureStorageBuckets() {
  try {
    // Use service role for admin operations
    const adminSupabase = createSupabaseClient(true);
    
    // Check if profile-images bucket exists
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    
    // Create profile-images bucket if it doesn't exist
    const profileImagesBucket = buckets?.find((b: Bucket) => b.name === 'profile-images'); 
    if (!profileImagesBucket) {
      const { error } = await adminSupabase.storage.createBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });
      
      if (error) {
        console.error('Error creating profile-images bucket:', error);
        throw error;
      }
      console.log('Created profile-images bucket');
    }

    // Create property-photos bucket if it doesn't exist
    const propertyPhotosBucket = buckets?.find((b: Bucket) => b.name === 'property-photos');
    if (!propertyPhotosBucket) {
      const { error } = await adminSupabase.storage.createBucket('property-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });
      
      if (error) {
        console.error('Error creating property-photos bucket:', error);
        throw error;
      }
      console.log('Created property-photos bucket');
    }

    // Create application-documents bucket if it doesn't exist
    const applicationDocsBucket = buckets?.find((b: Bucket) => b.name === 'application-documents');
    if (!applicationDocsBucket) {
      const { error } = await adminSupabase.storage.createBucket('application-documents', {
        public: true,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif'
        ],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });
      
      if (error) {
        console.error('Error creating application-documents bucket:', error);
        throw error;
      }
      console.log('Created application-documents bucket');
    }
  } catch (error) {
    console.error('Error ensuring storage buckets:', error);
    throw error;
  }
}
