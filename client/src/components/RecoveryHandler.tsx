'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';

interface SecurityError {
  code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'SERVER_ERROR';
  message: string;
}

function RecoveryHandlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleRecoveryFlow = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      const expiresAt = params.get('expires_at');

      // Basic security checks
      let securityError: SecurityError | null = null;

      // Check token format (should be a valid JWT)
      if (!accessToken || accessToken.split('.').length !== 3) {
        securityError = {
          code: 'INVALID_TOKEN',
          message: 'Invalid recovery link format'
        };
      }
      // Check token expiry
      else if (expiresAt && parseInt(expiresAt) < Date.now() / 1000) {
        securityError = {
          code: 'EXPIRED_TOKEN',
          message: 'Recovery link has expired'
        };
      }

      if (securityError) {
        // Clear the hash for security
        window.history.replaceState(null, '', window.location.pathname);
        // Redirect with error
        router.push(`/login?error=${securityError.code}&message=${encodeURIComponent(securityError.message)}`);
        return;
      }

      if (accessToken && type === 'recovery') {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            // Handle server-side auth errors
            const serverError: SecurityError = {
              code: 'SERVER_ERROR',
              message: error.message || 'Invalid or expired recovery link'
            };
            window.history.replaceState(null, '', window.location.pathname);
            router.push(`/login?error=${serverError.code}&message=${encodeURIComponent(serverError.message)}`);
            return;
          }
          
          // Success path
          window.history.replaceState(null, '', window.location.pathname);
          router.push('/reset-password');
        } catch (error) {
          // Handle unexpected errors
          const unexpectedError: SecurityError = {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred'
          };
          window.history.replaceState(null, '', window.location.pathname);
          router.push(`/login?error=${unexpectedError.code}&message=${encodeURIComponent(unexpectedError.message)}`);
        }
      }
    };

    handleRecoveryFlow();
  }, [router, searchParams]);

  return null;
}

export function RecoveryHandler() {
  return (
    <Suspense fallback={null}>
      <RecoveryHandlerContent />
    </Suspense>
  );
} 
