import React from 'react';
import { X, User, Mail, Phone, DollarSign, Briefcase, Home, CheckCircle, XCircle } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    id: string;
    name: string;
    property: string;
    date: string;
    status: string;
    creditScore?: number;
    backgroundCheck?: string;
    income?: string;
    occupation?: string;
    currentAddress?: string;
    tenant?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      backgroundCheckStatus: string;
      plaidVerified: boolean;
      identityVerified: boolean;
      bankAccountVerified: boolean;
      verifiedIncome: number;
    };
  } | null;
}

export default function ApplicationModal({ isOpen, onClose, application }: ApplicationModalProps) {
  if (!isOpen || !application) return null;

  const verificationItems = [
    {
      label: 'Identity Verification',
      verified: application.tenant?.identityVerified || false,
      icon: User
    },
    {
      label: 'Background Check',
      verified: application.tenant?.backgroundCheckStatus === 'completed',
      icon: CheckCircle
    },
    {
      label: 'Bank Account',
      verified: application.tenant?.bankAccountVerified || false,
      icon: DollarSign
    },
    {
      label: 'Income Verification',
      verified: application.tenant?.plaidVerified || false,
      icon: Briefcase
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold">Application Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Property Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Property Information</h3>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-lg font-medium">{application.property}</p>
            <p className="text-gray-600">Application Date: {application.date}</p>
          </div>
        </div>

        {/* Tenant Profile */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Tenant Profile</h3>
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span>{application.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span>{application.tenant?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span>{application.tenant?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="font-medium mb-3">Financial Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <span>Annual Income: {application.income}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gray-500" />
                    <span>Occupation: {application.occupation || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-gray-500" />
                    <span>Current Address: {application.currentAddress || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {verificationItems.map((item, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-xl p-4 text-center"
              >
                <div className="flex justify-center mb-2">
                  {item.verified ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-gray-500">
                  {item.verified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Credit and Background */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Credit & Background Check</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium mb-2">Credit Score</h4>
              <p className="text-2xl font-semibold">
                {application.creditScore || 'Not available'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium mb-2">Background Check Status</h4>
              <p className={`text-lg font-medium ${
                application.backgroundCheck === 'completed' 
                  ? 'text-green-600' 
                  : 'text-yellow-600'
              }`}>
                {application.backgroundCheck === 'completed' 
                  ? 'Completed' 
                  : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
