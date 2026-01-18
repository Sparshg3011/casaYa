'use client';

import { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import apiService from '@/lib/api';
import { Shield } from 'lucide-react';

interface PlaidVerificationButtonProps {
  onSuccess?: () => void;
  verificationStatus?: boolean;
  onVerificationComplete?: () => void;
}

// Format phone number to E.164 format
const formatPhoneNumber = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Add country code if not present
  return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
};

export default function PlaidVerificationButton({ 
  onSuccess,
  verificationStatus,
  onVerificationComplete
}: PlaidVerificationButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (verificationStatus === false || verificationStatus === undefined) {
      initializePlaid();
    }
  }, [verificationStatus]);

  const initializePlaid = async () => {
    try {
      setLoading(true);
      const response = await apiService.tenants.initiatePlaidVerification();
      setLinkToken(response.data.linkToken);
    } catch (error) {
      console.error('Error initializing Plaid:', error);
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: async (public_token) => {
      try {
        setLoading(true);
        await apiService.tenants.completePlaidVerification(public_token);
        onSuccess?.();
        onVerificationComplete?.();
      } catch (error) {
        console.error('Error completing Plaid verification:', error);
      } finally {
        setLoading(false);
      }
    },
    onExit: () => {
      console.log('User exited Plaid Link');
    },
    onEvent: (eventName, metadata) => {
      if (eventName === 'ERROR' && metadata.error_code === 'INVALID_PHONE_NUMBER') {
        console.error('Invalid phone number format');
      }
    },
  });

  if (verificationStatus === true) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
        <Shield className="w-5 h-5" />
        <span>Verified</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading || !linkToken}
      className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
        loading || !ready || !linkToken
          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      <Shield className="w-5 h-5" />
      {loading ? 'Loading...' : 'Verify'}
    </button>
  );
} 