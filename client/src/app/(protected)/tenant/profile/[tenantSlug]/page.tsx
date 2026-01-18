'use client';

import React from 'react';
import { X, Bell, CheckCircle, XCircle, FileText, User, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

type TenantProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  backgroundCheckStatus: string;
  plaidVerified: boolean;
  identityVerified: boolean;
  bankAccountVerified: boolean;
  verifiedIncome: number;
  creditScore?: number;
  occupation?: string;
  currentAddress?: string;
  bio?: string;
  preferredMoveInDate?: string;
  statedIncome?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  bankAccount?: {
    bankName: string;
    accountType: string;
    currentBalance: number;
    accountNumber: string;
    lastVerified: string;
  };
  identityVerification?: {
    verifiedFullName: string;
    verifiedEmail: string;
    verifiedPhone: string;
    lastVerified: string;
  };
  backgroundCheck?: {
    status: string;
    creditScore?: string;
    lastCreditCheck?: string;
  };
};

export default function TenantProfilePage({ params }: { params: { tenantId: string } }) {
  const router = useRouter();
  const [tenant, setTenant] = React.useState<TenantProfile>({
    id: params.tenantId,
    firstName: "Alberta",
    lastName: "Bobbeth Charleson",
    email: "accountholder0@example.com",
    phone: "1112223333",
    backgroundCheckStatus: "Not Started",
    plaidVerified: true,
    identityVerified: true,
    bankAccountVerified: true,
    verifiedIncome: 0,
    creditScore: undefined,
    bankAccount: {
      bankName: "Plaid Checking",
      accountType: "checking",
      currentBalance: 110,
      accountNumber: "****0000",
      lastVerified: "2/3/2025"
    },
    identityVerification: {
      verifiedFullName: "Alberta Bobbeth Charleson",
      verifiedEmail: "accountholder0@example.com",
      verifiedPhone: "1112223333",
      lastVerified: "2/3/2025"
    },
    backgroundCheck: {
      status: "Not Started",
      creditScore: "Not provided",
      lastCreditCheck: "Not provided"
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-semibold">Tenant Profile</h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 shadow-sm space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{tenant.firstName} {tenant.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{tenant.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{tenant.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupation</p>
                <p className="font-medium">{tenant.occupation || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Address</p>
                <p className="font-medium">{tenant.currentAddress || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Preferred Move-in Date</p>
                <p className="font-medium">{tenant.preferredMoveInDate || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bio</h3>
            <p className="text-gray-600">{tenant.bio || 'Not provided'}</p>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Social Links</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium mb-2">LinkedIn</p>
                <p className="text-sm text-gray-600">
                  {tenant.socialLinks?.linkedin ? (
                    <a 
                      href={tenant.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  ) : (
                    'Not Available'
                  )}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium mb-2">Facebook</p>
                <p className="text-sm text-gray-600">
                  {tenant.socialLinks?.facebook ? (
                    <a 
                      href={tenant.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  ) : (
                    'Not Available'
                  )}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium mb-2">Instagram</p>
                <p className="text-sm text-gray-600">
                  {tenant.socialLinks?.instagram ? (
                    <a 
                      href={tenant.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  ) : (
                    'Not Available'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
            <div className="space-y-6">
              {/* Bank Account Verification */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium mb-1">Bank Account Verification</h4>
                    <p className="text-sm text-gray-500">Verify your bank account to enable rent payments</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tenant.bankAccountVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.bankAccountVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                
                {tenant.bankAccount && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium">{tenant.bankAccount.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Type</p>
                      <p className="font-medium">{tenant.bankAccount.accountType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Balance</p>
                      <p className="font-medium">${tenant.bankAccount.currentBalance}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium">{tenant.bankAccount.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Verified</p>
                      <p className="font-medium">{tenant.bankAccount.lastVerified}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Identity Verification */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium mb-1">Identity Verification</h4>
                    <p className="text-sm text-gray-500">Verify your identity to enhance trust</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tenant.identityVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.identityVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>

                {tenant.identityVerification && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Verified Full Name</p>
                      <p className="font-medium">{tenant.identityVerification.verifiedFullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verified Email</p>
                      <p className="font-medium">{tenant.identityVerification.verifiedEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verified Phone</p>
                      <p className="font-medium">{tenant.identityVerification.verifiedPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Verified</p>
                      <p className="font-medium">{tenant.identityVerification.lastVerified}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Income Verification */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium mb-1">Income Verification</h4>
                    <p className="text-sm text-gray-500">Verify your income to qualify for properties</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tenant.verifiedIncome ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.verifiedIncome ? 'Verified' : 'Not Verified'}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">Annual Income</p>
                  <p className="font-medium">
                    {tenant.verifiedIncome ? 
                      `$${tenant.verifiedIncome.toLocaleString()}` : 
                      'Not Verified'
                    }
                  </p>
                </div>
              </div>

              {/* Background Check */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium mb-1">Background Check</h4>
                    <p className="text-sm text-gray-500">Background check status and credit information</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tenant.backgroundCheckStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.backgroundCheckStatus === 'completed' ? 'Verified' : 'Not Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Background Check Status</p>
                    <p className="font-medium">
                      {tenant.backgroundCheck?.status || tenant.backgroundCheckStatus || 'Not Started'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Credit Score</p>
                    <p className="font-medium">
                      {tenant.backgroundCheck?.creditScore || tenant.creditScore || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Credit Check</p>
                    <p className="font-medium">
                      {tenant.backgroundCheck?.lastCreditCheck || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 