'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiService from '@/lib/api';
import type { UserData } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session to check if auth was successful
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('No session found');

        // Get the user type and signup state that was selected before OAuth redirect
        const userType = localStorage.getItem('pendingUserType') as 'tenant' | 'landlord';
        const isSignUp = localStorage.getItem('isSignUp') === 'true';
        if (!userType) throw new Error('User type not found');

        // Get user details from session
        const { user } = session;
        if (!user || !user.email) throw new Error('User data not found');

        // Extract user details from metadata
        const firstName = user.user_metadata?.full_name?.split(' ')[0] || 
                        user.user_metadata?.given_name || 
                        'Unknown';
        const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                        user.user_metadata?.family_name || 
                        'Unknown';

        try {
          if (isSignUp) {
            // Call the appropriate signup endpoint
            const signupData: UserData = {
              email: user.email,
              firstName,
              lastName,
              isOAuth: true,
              userType: userType
            };
            
            if (userType === 'tenant') {
              await apiService.auth.tenantSignup(signupData);
            } else {
              await apiService.auth.landlordSignup(signupData);
            }
          } else {
            // For login, we'll try to login directly
            if (userType === 'tenant') {
              await apiService.auth.tenantLogin(user.email, '');
            } else {
              await apiService.auth.landlordLogin(user.email, '');
            }
          }

          // Store the token and user type
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('userMode', userType);
          
          // Clean up
          localStorage.removeItem('pendingUserType');
          localStorage.removeItem('isSignUp');
          
          // Redirect to dashboard
          router.push('/dashboard');
        } catch (err: any) {
          // If user doesn't exist during login, try signing up
          if (!isSignUp && err.response?.status === 401) {
            const signupData: UserData = {
              email: user.email,
              firstName,
              lastName,
              isOAuth: true,
              userType: userType
            };
            
            if (userType === 'tenant') {
              await apiService.auth.tenantSignup(signupData);
            } else {
              await apiService.auth.landlordSignup(signupData);
            }
            
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('userMode', userType);
            localStorage.removeItem('pendingUserType');
            localStorage.removeItem('isSignUp');
            router.push('/dashboard');
          } 
          // If user already exists during signup, just log them in
          else if (isSignUp && err.response?.status === 400 && err.response?.data?.error?.includes('already exists')) {
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('userMode', userType);
            localStorage.removeItem('pendingUserType');
            localStorage.removeItem('isSignUp');
            router.push('/dashboard');
          } else {
            throw err;
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Authentication failed');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-red-600">Authentication Failed</h2>
            <p className="mt-2 text-gray-600">
              {error}. Redirecting you back to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-blue-600">Setting up your account...</h2>
          <p className="mt-2 text-gray-600">
            Please wait while we complete your registration.
          </p>
        </div>
      </div>
    </div>
  );
} 