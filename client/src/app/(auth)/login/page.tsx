'use client';

import { useState, useEffect, Suspense } from 'react';
import { Mail, Lock, Loader, Home, User as UserIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiService from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface AuthResponseData {
  token: string;
}

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [userType, setUserType] = useState<'tenant' | 'landlord' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  useEffect(() => {
    // Handle security errors from recovery flow
    const errorCode = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    
    if (errorCode && errorMessage) {
      setError(decodeURIComponent(errorMessage));
      
      // Clear error params from URL
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  }, [searchParams]);

  // Check password strength as user types
  const validatePassword = (value: string) => {
    setPassword(value);
    setPasswordValidation({
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      hasMinLength: value.length >= 8,
    });
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

  const handleForgotPassword = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const email = formData.get('email') as string;
      if (!email || !userType) {
        setError('Please enter your email address and select user type');
        return;
      }

      await apiService.auth.forgotPassword(email, userType);
      setSuccessMessage('Password reset instructions have been sent to your email');
      setIsForgotPassword(false);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError(error.response?.data?.error || 'Failed to process password reset request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!userType) return;
    
    try {
      setIsGoogleLoading(true);
      // Store the selected user type and signup state before redirecting
      localStorage.setItem('pendingUserType', userType);
      localStorage.setItem('isSignUp', isSignUp.toString());
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAction = async (formData: FormData) => {
    if (!userType) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;

      if (isSignUp) {
        // Validate password requirements before submitting
        const isPasswordValid = Object.values(passwordValidation).every(Boolean);
        if (!isPasswordValid) {
          setError('Please ensure your password meets all requirements');
          setIsLoading(false);
          return;
        }

        const signupData = {
          email,
          password,
          firstName,
          lastName,
          userType
        } as const; // Use const assertion to preserve literal type

        try {
          const response = userType === 'tenant' 
            ? await apiService.auth.tenantSignup(signupData)
            : await apiService.auth.landlordSignup(signupData);

          // If signup is successful (201 status)
          if (response.status === 201) {
            // Try to login automatically after successful signup
            try {
              const loginResponse = await (userType === 'tenant' 
                ? apiService.auth.tenantLogin(email, password)
                : apiService.auth.landlordLogin(email, password));

              if (loginResponse.data?.token) {
                localStorage.setItem('token', loginResponse.data.token);
                localStorage.setItem('userMode', userType);
                router.push('/dashboard');
              } else {
                setError('Account created successfully. Please log in.');
                setIsSignUp(false); // Switch to login form
              }
            } catch (loginError) {
              setError('Account created successfully. Please log in.');
              setIsSignUp(false); // Switch to login form
            }
          } else {
            setError('Signup failed. Please try again.');
          }
        } catch (error: any) {
          console.error('Signup error:', error.response?.data);
          
          // Handle specific error cases
          if (error.response?.data?.error?.includes('Unique constraint failed on the fields: (`email`)')) {
            setError('An account with this email already exists. Please try logging in instead.');
            // Optionally switch to login form
            setIsSignUp(false);
          } else {
            setError(error.response?.data?.error || error.response?.data?.message || 'Failed to create account');
          }
        }
      } else {
        try {
          const response = await (userType === 'tenant' 
            ? apiService.auth.tenantLogin(email, password)
            : apiService.auth.landlordLogin(email, password));

          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userMode', userType);
            router.push('/dashboard');
          } else {
            setError('Invalid credentials');
          }
        } catch (error: any) {
          console.error('Login error details:', error.response?.data);
          localStorage.removeItem('token');
          setError(error.response?.data?.error || 'Invalid credentials');
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      console.error('Error response:', error.response?.data);
      
      // Show the specific error message from the server
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         'An error occurred during authentication';
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold">Reset Password</h2>
            <p className="mt-2 text-gray-600">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              <p className="font-medium mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
              <p className="font-medium mb-1">Success</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            handleForgotPassword(new FormData(e.currentTarget));
          }} className="space-y-6">
            {/* User Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('tenant')}
                  className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    userType === 'tenant' 
                      ? 'border-blue-600 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Home className={`w-6 h-6 ${userType === 'tenant' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${userType === 'tenant' ? 'text-blue-600' : 'text-gray-600'}`}>
                    Tenant
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('landlord')}
                  className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    userType === 'landlord' 
                      ? 'border-blue-600 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <UserIcon className={`w-6 h-6 ${userType === 'landlord' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${userType === 'landlord' ? 'text-blue-600' : 'text-gray-600'}`}>
                    Landlord
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter your email"
                />
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
                'Send Reset Instructions'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">
            {!userType ? 'Welcome to CasaYa' : isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-gray-600">
            {!userType 
              ? 'Please select your user type to continue'
              : isSignUp 
                ? 'Sign up to start your journey with CasaYa'
                : 'Please enter your details to login'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            <p className="font-medium mb-1">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
            <p className="font-medium mb-1">Success</p>
            <p className="text-sm">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!userType) return;
          handleAction(new FormData(e.currentTarget));
        }} className="space-y-6">
          {/* Name Fields - Only show during signup */}
          {isSignUp && (
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
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
                    isSignUp && password && getPasswordStrength().strength === 100 ? 'border-green-500' : ''
                  }`}
                  placeholder="Enter your password"
                />
              </div>

              {/* Password strength indicator and requirements - Only show during signup */}
              {isSignUp && (
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
              )}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Select your user type</span>
            </div>
          </div>

          {/* User Type Selection - Show for both login and signup */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType('tenant')}
                className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  userType === 'tenant' 
                    ? 'border-blue-600 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-blue-600 hover:bg-gray-50'
                }`}
              >
                <Home className={`w-6 h-6 ${userType === 'tenant' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${userType === 'tenant' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Tenant
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUserType('landlord')}
                className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                  userType === 'landlord' 
                    ? 'border-blue-600 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-blue-600 hover:bg-gray-50'
                }`}
              >
                <UserIcon className={`w-6 h-6 ${userType === 'landlord' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${userType === 'landlord' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Landlord
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !userType}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              isSignUp ? 'Sign Up' : 'Login'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || !userType}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-4 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            isGoogleLoading || !userType ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>{isGoogleLoading ? 'Signing in...' : `Continue with Google as ${userType || 'user'}`}</span>
        </button>

        {/* Add Forgot Password link before the footer */}
        {!isSignUp && userType && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(true);
                setError(null);
              }}
              className="text-blue-600 hover:text-blue-700 transition-colors text-sm"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Footer */}
        {userType && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Login'
                : 'Don\'t have an account? Sign up'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}