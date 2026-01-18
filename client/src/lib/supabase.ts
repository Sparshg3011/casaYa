import { createClient } from '@supabase/supabase-js';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Get site URL for the current environment
const getSiteUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? 'https://rentcasaya-client.vercel.app'
    : 'http://localhost:3000';
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'x-application-name': 'rentcasaya'
    }
  }
});

// Configure auth options for password reset
export const resetPasswordForEmail = async (email: string) => {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/reset-password`
  });
}; 
