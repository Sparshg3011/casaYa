'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function useUserMode() {
  const [userMode, setUserMode] = useState<'tenant' | 'landlord' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const fetchUserMode = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const storedUserMode = localStorage.getItem('userMode') as 'tenant' | 'landlord' | null;
          
          if (storedUserMode === 'landlord') {
            const response = await apiService.profiles.getLandlordProfile();
            if (response.data) {
              setUserMode('landlord');
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('userMode');
              router.push('/login');
            }
          } else if (storedUserMode === 'tenant') {
            const response = await apiService.profiles.getTenantProfile();
            if (response.data) {
              setUserMode('tenant');
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('userMode');
              router.push('/login');
            }
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userMode');
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error fetching user mode:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userMode');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserMode();
  }, [router]);

  const logout = async () => {
    try {
      await apiService.auth.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('userMode');
      setIsLoggedIn(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userMode');
      setIsLoggedIn(false);
      router.push('/');
    }
  };

  return { userMode, isLoading, isLoggedIn, logout };
} 