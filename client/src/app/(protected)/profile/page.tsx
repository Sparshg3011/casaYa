'use client';

import { useEffect, useState, useRef } from 'react';
import { User, X, Camera, Briefcase, Phone, Mail, MapPin, Calendar, DollarSign, FileText, Link as LinkIcon, Shield, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import apiService from '@/lib/api';
import type { LandlordProfile, PropertyResponse, VerificationStatusResponse } from '@/lib/api';
import type { TenantProfile } from '@/types/tenant';
import useUserMode from '@/hooks/useUserMode';
import EditTenantProfileModal from '@/components/EditTenantProfileModal';
import EditLandlordProfileModal from '@/components/EditLandlordProfileModal';
import PlaidVerificationButton from '@/components/PlaidVerificationButton';
import { Card } from '@/components/ui/card';
import VerificationStatus from '@/components/VerificationStatus';

interface InfoItemProps {
  label: string;
  value: string | number | null | undefined;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className="space-y-1">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || 'Not provided'}</p>
  </div>
);

const isTenantProfile = (profile: LandlordProfile | TenantProfile): profile is TenantProfile => {
  return profile.type === 'tenant';
};

export default function ProfilePage() {
  const [landlordProfile, setLandlordProfile] = useState<LandlordProfile | null>(null);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<boolean>(false);
  const { userMode, isLoading } = useUserMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userMode) {
      fetchProfile();
      if (userMode === 'tenant') {
        fetchVerificationStatus();
      }
    }
  }, [userMode]);

  const fetchProfile = async () => {
    try {
      if (userMode === 'landlord') {
        const { data: landlordData } = await apiService.landlord.getProfile();
        const { data: properties } = await apiService.landlord.getProperties();
        setLandlordProfile({
          ...landlordData,
          properties: (properties || []) as PropertyResponse[]
        });
      } else if (userMode === 'tenant') {
        const { data } = await apiService.tenants.getProfile();
        setTenantProfile(data as TenantProfile);
      }
    } catch (error) {
      // Error handling without console.error
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const { data } = await apiService.tenants.getVerificationStatus();
      const isFullyVerified = data.plaidVerified && data.identityVerified && data.bankAccountVerified;
      setVerificationStatus(isFullyVerified);
    } catch (error) {
      // Error handling without console.error
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('Profile image too large. Maximum size is 5MB. Please try a smaller image.');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      if (userMode === 'landlord') {
        await apiService.landlord.uploadProfileImage(formData);
      } else {
        await apiService.tenants.uploadProfileImage(formData);
      }
      
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (isLoading || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const currentProfile = userMode === 'landlord' ? landlordProfile : tenantProfile;

  if (!currentProfile) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const renderSocialLinks = () => {
    if (!currentProfile?.socialLinks) {
      return null;
    }

    const socialLinks = [
      {
        name: 'LinkedIn',
        url: currentProfile.socialLinks.linkedin,
        icon: <LinkIcon className="w-4 h-4" />
      },
      {
        name: 'Facebook',
        url: currentProfile.socialLinks.facebook,
        icon: <LinkIcon className="w-4 h-4" />
      },
      {
        name: 'Instagram',
        url: currentProfile.socialLinks.instagram,
        icon: <LinkIcon className="w-4 h-4" />
      },
      ...(userMode === 'landlord' && 'website' in currentProfile.socialLinks ? [
        {
          name: 'Website',
          url: currentProfile.socialLinks.website,
          icon: <LinkIcon className="w-4 h-4" />
        }
      ] : [])
    ];

    return (
      <div className="lg:col-span-3">
        <h3 className="text-lg font-semibold mb-4">Social Links</h3>
        <div className="flex flex-wrap gap-4">
          {socialLinks.map(({ name, url, icon }) => (
            url ? (
              <a
                key={name}
                href={url}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {icon}
                {name}
              </a>
            ) : (
              <div
                key={name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed"
              >
                {icon}
                {name}
                <span className="text-xs">(Not Available)</span>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  const renderVerificationSection = () => {
    if (userMode !== 'tenant') return null;

    return (
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-gray-400" />
        <div className="flex-grow">
          <p className="text-sm text-gray-500">Income Verification</p>
          <div className="mt-1">
            <PlaidVerificationButton
              verificationStatus={verificationStatus}
              onVerificationComplete={() => {
                fetchVerificationStatus();
                fetchProfile();
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderBankDetails = () => {
    if (userMode !== 'tenant' || !tenantProfile?.verifications?.bankAccount) return null;

    return (
      <div className="lg:col-span-3 mt-8">
        <h3 className="text-lg font-semibold mb-4">Bank Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Bank Details</h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-gray-500">Bank Name:</span>{' '}
                <span className="font-medium">{tenantProfile.bankName || 'Not available'}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Account Type:</span>{' '}
                <span className="font-medium capitalize">{tenantProfile.bankAccountType || 'Not available'}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Account Number:</span>{' '}
                <span className="font-medium">****{tenantProfile.bankAccountMask || 'XXXX'}</span>
              </p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Verification Status</h4>
            <div className="space-y-2">
              {Object.entries(tenantProfile.verifications).map(([key, value]) => {
                if (key === 'lastVerified') return null;
                return (
                  <p key={key} className="text-sm">
                    <span className="text-gray-500 capitalize">{key} Verified:</span>{' '}
                    <span className={`font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                      {value ? 'Yes' : 'No'}
                    </span>
                  </p>
                );
              })}
              {tenantProfile.verifications.lastVerified && (
                <p className="text-sm">
                  <span className="text-gray-500">Last Verified:</span>{' '}
                  <span className="font-medium">
                    {new Date(tenantProfile.verifications.lastVerified).toLocaleDateString()}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVerificationDetails = () => {
    if (!tenantProfile) return null;

    return (
      <div className="lg:col-span-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Verified Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Verification Sections - Only show for tenant profiles */}
            {userMode === 'tenant' && tenantProfile && (
              <div className="space-y-6">
                {/* Bank Account Verification */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Bank Account Verification</h3>
                      <p className="text-muted-foreground">Verify your bank account to enable rent payments</p>
                    </div>
                    <VerificationStatus 
                      isVerified={!!tenantProfile?.bankAccountVerifiedAt}
                      verifiedDate={tenantProfile?.bankAccountVerifiedAt}
                    />
                  </div>
                  {tenantProfile?.bankAccountVerifiedAt ? (
                    <>
                      <h4 className="font-medium mb-4">Primary Bank Account</h4>
                      <div className="space-y-4">
                        <InfoItem label="Bank Name" value={tenantProfile.bankName} />
                        <InfoItem label="Account Type" value={tenantProfile.bankAccountType} />
                        <InfoItem 
                          label="Current Balance" 
                          value={tenantProfile.bankAccountBalance !== null ? 
                            `$${tenantProfile.bankAccountBalance.toLocaleString()}` : 
                            'Not available'
                          } 
                        />
                        <InfoItem 
                          label="Account Number" 
                          value={tenantProfile.bankAccountMask ? 
                            `****${tenantProfile.bankAccountMask}` : 
                            null
                          } 
                        />
                        <InfoItem 
                          label="Last Verified" 
                          value={tenantProfile.bankAccountVerifiedAt ? 
                            new Date(tenantProfile.bankAccountVerifiedAt).toLocaleDateString() : 
                            null
                          } 
                        />
                      </div>
                    </>
                  ) : null}
                </Card>

                {/* Identity Verification */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Identity Verification</h3>
                      <p className="text-muted-foreground">Verify your identity to enhance trust</p>
                    </div>
                    <VerificationStatus 
                      isVerified={!!tenantProfile?.identityVerifiedAt}
                      verifiedDate={tenantProfile?.identityVerifiedAt}
                    />
                  </div>
                  {tenantProfile?.identityVerifiedAt ? (
                    <div className="space-y-4">
                      <InfoItem 
                        label="Verified Full Name" 
                        value={tenantProfile?.verifiedFirstName && tenantProfile?.verifiedLastName ? 
                          `${tenantProfile.verifiedFirstName} ${tenantProfile.verifiedLastName}` : 
                          null
                        } 
                      />
                      <InfoItem label="Verified Email" value={tenantProfile?.verifiedEmail} />
                      <InfoItem label="Verified Phone" value={tenantProfile?.verifiedPhone} />
                      <InfoItem 
                        label="Last Verified" 
                        value={tenantProfile?.identityVerifiedAt ? 
                          new Date(tenantProfile.identityVerifiedAt).toLocaleDateString() : 
                          null
                        } 
                      />
                    </div>
                  ) : null}
                </Card>

                {/* Income Verification */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Income Verification</h3>
                      <p className="text-muted-foreground">Verify your income to qualify for properties</p>
                    </div>
                    <VerificationStatus 
                      isVerified={!!tenantProfile?.incomeVerifiedAt}
                      verifiedDate={tenantProfile?.incomeVerifiedAt}
                    />
                  </div>
                  {tenantProfile?.incomeVerifiedAt ? (
                    <div className="space-y-4">
                      <InfoItem 
                        label="Verified Annual Income" 
                        value={tenantProfile?.verifiedIncome ? 
                          `$${tenantProfile.verifiedIncome.toLocaleString()}` : 
                          null
                        } 
                      />
                      <InfoItem 
                        label="Last Verified" 
                        value={tenantProfile?.incomeVerifiedAt ? 
                          new Date(tenantProfile.incomeVerifiedAt).toLocaleDateString() : 
                          null
                        } 
                      />
                    </div>
                  ) : null}
                </Card>

                {/* Background Check Status */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Background Check</h3>
                      <p className="text-muted-foreground">Background check status and credit information</p>
                    </div>
                    <VerificationStatus 
                      isVerified={tenantProfile?.backgroundCheckStatus === 'Completed'}
                      verifiedDate={tenantProfile?.lastCreditCheck}
                    />
                  </div>
                  <div className="space-y-4">
                    <InfoItem label="Background Check Status" value={tenantProfile?.backgroundCheckStatus} />
                    <InfoItem label="Credit Score" value={tenantProfile?.creditScore} />
                    <InfoItem 
                      label="Last Credit Check" 
                      value={tenantProfile?.lastCreditCheck ? 
                        new Date(tenantProfile.lastCreditCheck).toLocaleDateString() : 
                        null
                      } 
                    />
                  </div>
                </Card>

                {/* Single Verification Button */}
                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Verify Your Information</h3>
                    <p className="text-gray-600 mb-4">
                      {!tenantProfile.bankAccountVerifiedAt || !tenantProfile.identityVerifiedAt || !tenantProfile.incomeVerifiedAt ? 
                        'Complete your verification to unlock all features' : 
                        'Update your verification information'
                      }
                    </p>
                    <PlaidVerificationButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">My Profile</h1>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {/* Profile Content */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Profile Header with Image */}
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white p-2">
                  <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden relative">
                    {currentProfile?.profileImage ? (
                      <img
                        src={currentProfile.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors"
                  disabled={uploadingImage}
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 px-8 pb-8">
            <div className="space-y-6">
              {/* Basic Information Section */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>
                
                {userMode === 'landlord' && landlordProfile ? (
                  // Landlord Profile
                  <div className="space-y-4">
                    <InfoItem label="Full Name" value={`${landlordProfile.firstName} ${landlordProfile.lastName}`} />
                    <InfoItem label="Email" value={landlordProfile.email} />
                    <InfoItem label="Phone" value={landlordProfile.phone} />
                    <InfoItem label="Company Name" value={landlordProfile.businessInfo?.companyName} />
                    <InfoItem label="Business Address" value={landlordProfile.businessInfo?.businessAddress} />
                    <InfoItem label="Bio" value={landlordProfile.profile?.bio} />
                    <InfoItem 
                      label="Years of Experience" 
                      value={landlordProfile.profile?.yearsOfExperience ? 
                        `${landlordProfile.profile.yearsOfExperience} years` : 
                        null
                      } 
                    />
                    {renderSocialLinks()}
                  </div>
                ) : userMode === 'tenant' && tenantProfile ? (
                  // Tenant Profile
                  <div className="space-y-4">
                    <InfoItem label="Full Name" value={`${tenantProfile.firstName} ${tenantProfile.lastName}`} />
                    <InfoItem label="Email" value={tenantProfile.email} />
                    <InfoItem label="Phone" value={tenantProfile.phone} />
                    <InfoItem label="Occupation" value={tenantProfile.occupation} />
                    <InfoItem 
                      label="Annual Income (Stated)" 
                      value={tenantProfile.income ? `$${tenantProfile.income.toLocaleString()}` : null} 
                    />
                    <InfoItem label="Current Address" value={tenantProfile.currentAddress} />
                    <InfoItem 
                      label="Preferred Move-in Date" 
                      value={tenantProfile.preferredMoveInDate ? 
                        new Date(tenantProfile.preferredMoveInDate).toLocaleDateString() : 
                        null
                      } 
                    />
                    <InfoItem label="Bio" value={tenantProfile.bio} />
                    {renderSocialLinks()}
                  </div>
                ) : (
                  // Fallback for invalid state
                  <div className="text-gray-500">Invalid profile state</div>
                )}
              </Card>

              {/* Verification Sections - Only show for tenant profiles */}
              {userMode === 'tenant' && tenantProfile && (
                <div className="space-y-6">
                  {/* Bank Account Verification */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Bank Account Verification</h3>
                        <p className="text-muted-foreground">Verify your bank account to enable rent payments</p>
                      </div>
                      <VerificationStatus 
                        isVerified={!!tenantProfile?.bankAccountVerifiedAt}
                        verifiedDate={tenantProfile?.bankAccountVerifiedAt}
                      />
                    </div>
                    {tenantProfile?.bankAccountVerifiedAt ? (
                      <>
                        <h4 className="font-medium mb-4">Primary Bank Account</h4>
                        <div className="space-y-4">
                          <InfoItem label="Bank Name" value={tenantProfile.bankName} />
                          <InfoItem label="Account Type" value={tenantProfile.bankAccountType} />
                          <InfoItem 
                            label="Current Balance" 
                            value={tenantProfile.bankAccountBalance !== null ? 
                              `$${tenantProfile.bankAccountBalance.toLocaleString()}` : 
                              'Not available'
                            } 
                          />
                          <InfoItem 
                            label="Account Number" 
                            value={tenantProfile.bankAccountMask ? 
                              `****${tenantProfile.bankAccountMask}` : 
                              null
                            } 
                          />
                          <InfoItem 
                            label="Last Verified" 
                            value={tenantProfile.bankAccountVerifiedAt ? 
                              new Date(tenantProfile.bankAccountVerifiedAt).toLocaleDateString() : 
                              null
                            } 
                          />
                        </div>
                      </>
                    ) : null}
                  </Card>

                  {/* Identity Verification */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Identity Verification</h3>
                        <p className="text-muted-foreground">Verify your identity to enhance trust</p>
                      </div>
                      <VerificationStatus 
                        isVerified={!!tenantProfile?.identityVerifiedAt}
                        verifiedDate={tenantProfile?.identityVerifiedAt}
                      />
                    </div>
                    {tenantProfile?.identityVerifiedAt ? (
                      <div className="space-y-4">
                        <InfoItem 
                          label="Verified Full Name" 
                          value={tenantProfile?.verifiedFirstName && tenantProfile?.verifiedLastName ? 
                            `${tenantProfile.verifiedFirstName} ${tenantProfile.verifiedLastName}` : 
                            null
                          } 
                        />
                        <InfoItem label="Verified Email" value={tenantProfile?.verifiedEmail} />
                        <InfoItem label="Verified Phone" value={tenantProfile?.verifiedPhone} />
                        <InfoItem 
                          label="Last Verified" 
                          value={tenantProfile?.identityVerifiedAt ? 
                            new Date(tenantProfile.identityVerifiedAt).toLocaleDateString() : 
                            null
                          } 
                        />
                      </div>
                    ) : null}
                  </Card>

                  {/* Income Verification */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Income Verification</h3>
                        <p className="text-muted-foreground">Verify your income to qualify for properties</p>
                      </div>
                      <VerificationStatus 
                        isVerified={!!tenantProfile?.incomeVerifiedAt}
                        verifiedDate={tenantProfile?.incomeVerifiedAt}
                      />
                    </div>
                    {tenantProfile?.incomeVerifiedAt ? (
                      <div className="space-y-4">
                        <InfoItem 
                          label="Verified Annual Income" 
                          value={tenantProfile?.verifiedIncome ? 
                            `$${tenantProfile.verifiedIncome.toLocaleString()}` : 
                            null
                          } 
                        />
                        <InfoItem 
                          label="Last Verified" 
                          value={tenantProfile?.incomeVerifiedAt ? 
                            new Date(tenantProfile.incomeVerifiedAt).toLocaleDateString() : 
                            null
                          } 
                        />
                      </div>
                    ) : null}
                  </Card>

                  {/* Background Check Status */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Background Check</h3>
                        <p className="text-muted-foreground">Background check status and credit information</p>
                      </div>
                      <VerificationStatus 
                        isVerified={tenantProfile?.backgroundCheckStatus === 'Completed'}
                        verifiedDate={tenantProfile?.lastCreditCheck}
                      />
                    </div>
                    <div className="space-y-4">
                      <InfoItem label="Background Check Status" value={tenantProfile?.backgroundCheckStatus} />
                      <InfoItem label="Credit Score" value={tenantProfile?.creditScore} />
                      <InfoItem 
                        label="Last Credit Check" 
                        value={tenantProfile?.lastCreditCheck ? 
                          new Date(tenantProfile.lastCreditCheck).toLocaleDateString() : 
                          null
                        } 
                      />
                    </div>
                  </Card>

                  {/* Single Verification Button */}
                  <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Verify Your Information</h3>
                      <p className="text-gray-600 mb-4">
                        {!tenantProfile.bankAccountVerifiedAt || !tenantProfile.identityVerifiedAt || !tenantProfile.incomeVerifiedAt ? 
                          'Complete your verification to unlock all features' : 
                          'Update your verification information'
                        }
                      </p>
                      <PlaidVerificationButton />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {userMode === 'tenant' ? (
                <EditTenantProfileModal
                  profile={tenantProfile!}
                  onClose={() => setShowEditModal(false)}
                  onSave={async (data) => {
                    try {
                      await apiService.tenants.updateProfile(data);
                      await fetchProfile();
                      setShowEditModal(false);
                    } catch (error) {
                      // Error handling without console.error
                    }
                  }}
                />
              ) : (
                <EditLandlordProfileModal
                  profile={landlordProfile!}
                  onClose={() => setShowEditModal(false)}
                  onSave={async (data) => {
                    try {
                      await apiService.profiles.updateLandlordProfile(data);
                      await fetchProfile();
                      setShowEditModal(false);
                    } catch (error) {
                      // Error handling without console.error
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 