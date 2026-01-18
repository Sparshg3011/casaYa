'use client';

import { useState, useEffect, Suspense } from 'react';
import { Lock, Loader } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { AuthError, Session, AuthChangeEvent } from '@supabase/supabase-js';

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check session and handle recovery immediately
    const init = async () => {
      console.log('Initializing reset password page');
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);

      if (!session) {
        // If no session, check for recovery token in URL
        const hash = window.location.hash;
        if (hash) {
          console.log('Found hash in URL:', hash);
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            console.log('Setting session from URL parameters');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (error) {
              console.error('Error setting session:', error);
              setError('Invalid or expired recovery link');
              setTimeout(() => router.push('/login'), 3000);
              return;
            }
          } else {
            console.log('No access token found in URL');
            setError('Invalid recovery link');
            setTimeout(() => router.push('/login'), 3000);
            return;
          }
        } else {
          console.log('No hash found in URL and no session');
          setError('Invalid or expired recovery link');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change in reset password:', { event, session });
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    init();
  }, [router]);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  // Check password strength as user types
  const validatePassword = (value: string) => {
    setPassword(value);
    setPasswordsMatch(value === confirmPassword);
    setPasswordValidation({
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      hasMinLength: value.length >= 8,
    });
  };

  const validateConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    setPasswordsMatch(password === value);
  };

  // Calculate overall password strength
  const getPasswordStrength = () => {
    const validations = Object.values(passwordValidation);
    const trueCount = validations.filter(Boolean).length;
    if (trueCount === 0) return { strength: 0, color: 'bg-gray-200' };
    if (trueCount <= 2) return { strength: 20, color: 'bg-red-500' };
    if (trueCount === 3) return { strength: 40, color: 'bg-orange-500' };
    if (trueCount === 4) return { strength: 80, color: 'bg-yellow-500' };
    return { strength: 100, color: 'bg-green-500' };
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate password requirements
      const isPasswordValid = Object.values(passwordValidation).every(Boolean);
      if (!isPasswordValid) {
        setError('Please ensure your password meets all requirements');
        setIsLoading(false);
        return;
      }

      if (!passwordsMatch) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      setSuccess(true);
      
      // Sign out after successful password reset
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-green-600">Password Reset Successful!</h2>
            <p className="mt-2 text-gray-600">
              Your password has been successfully reset. You will be redirected to the login page in a few seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">Reset Your Password</h2>
          <p className="mt-2 text-gray-600">
            Please enter your new password
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            <p className="font-medium mb-1">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => validatePassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                    password && getPasswordStrength().strength === 100 ? 'border-green-500' : ''
                  }`}
                  placeholder="Enter your new password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => validateConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                    confirmPassword && passwordsMatch ? 'border-green-500' : confirmPassword ? 'border-red-500' : ''
                  }`}
                  placeholder="Confirm your new password"
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="mt-1 text-sm text-green-600">Passwords match</p>
              )}
            </div>
          </div>

          {/* Password strength indicator and requirements */}
          <div className="mt-2 space-y-2">
            {/* Strength bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getPasswordStrength().color}`}
                style={{ width: `${getPasswordStrength().strength}%` }}
              />
            </div>

            {/* Requirements list */}
            <div className="space-y-1 text-sm">
              <p className={`flex items-center gap-1 ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`text-xs ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordValidation.hasMinLength ? '✓' : '○'}
                </span>
                At least 8 characters
              </p>
              <p className={`flex items-center gap-1 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordValidation.hasUpperCase ? '✓' : '○'}
                </span>
                One uppercase letter
              </p>
              <p className={`flex items-center gap-1 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`text-xs ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordValidation.hasLowerCase ? '✓' : '○'}
                </span>
                One lowercase letter
              </p>
              <p className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordValidation.hasNumber ? '✓' : '○'}
                </span>
                One number
              </p>
              <p className={`flex items-center gap-1 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordValidation.hasSpecialChar ? '✓' : '○'}
                </span>
                One special character
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
} 
