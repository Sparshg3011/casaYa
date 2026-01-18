import { useState, useEffect } from 'react';
import apiService from '@/lib/api';

export function useUserType() {
  const [userType, setUserType] = useState<'tenant' | 'landlord' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserType() {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await apiService.profiles.getLandlordProfile();
          if (response.data) {
            setUserType('landlord');
          } else {
            const tenantResponse = await apiService.profiles.getTenantProfile();
            if (tenantResponse.data) {
              setUserType('tenant');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user type:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserType();
  }, []);

  return { userType, isLoading };
} 