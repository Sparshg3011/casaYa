'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, FileText, User, X, Maximize2, Minimize2, Download, UserCheck, Bed, Bath, Building, DollarSign, Calendar, Wallet, Plus } from 'lucide-react';
import ApplicationModal from '@/components/ApplicationModal';
import LeaseModal from '@/components/LeaseModal';
import ContractModal from '@/components/ContractModal';
import { clearNotification } from '@/lib/events';
import LeaseSigningModal from '@/components/LeaseSigningModal';
import useUserMode from '@/hooks/useUserMode';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import landlordApi, { Application as ImportedApplication, Property } from '@/lib/landlordApi';
import tenantApi, { TenantApplication } from '@/lib/tenantApi';
import { getImageUrl } from '@/utils/image';
import PropertyCard from '@/components/PropertyCard';
import { Card } from '@/components/ui/card';

type ApplicationStatus = 'Pending' | 'PENDING' | 'Approved' | 'APPROVED' | 'Rejected' | 'REJECTED';

type TenantDashboardApplication = {
  id: string;
  propertyId: string;
  name: string;
  property: string;
  date: string;
  status: string;
  landlordName?: string;
  landlordRating?: number;
  responseTime?: string;
  propertyDetails?: {
    rent: string;
    moveInDate: string;
    leaseLength: string;
  };
};

type LandlordApplication = {
  id: string;
  propertyId: string;
  status: ApplicationStatus;
  createdAt: string;
  tenant: {
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
};

type LandlordDashboardApplication = {
  id: string;
  propertyId: string;
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
};

type Rental = {
  id: string;
  property: string;
  propertyId: string;
  tenantName: string;
  date: string;
  status: string;
  rentDue: string;
  nextPayment: string;
  leaseEnd: string;
};

// Add this type definition for tenant profile modal
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

export default function DashboardPage() {
  const { userMode, isLoading } = useUserMode();
  const [isClient, setIsClient] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [contractGenerated, setContractGenerated] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview'>('upload');
  const [notificationCount, setNotificationCount] = useState(0);
  const [showLeaseSigningModal, setShowLeaseSigningModal] = useState(false);
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]);
  
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeRentals, setActiveRentals] = useState<Rental[]>([]);
  const [landlordApplications, setLandlordApplications] = useState<LandlordDashboardApplication[]>([]);
  const [acceptedApplications, setAcceptedApplications] = useState<LandlordDashboardApplication[]>([]);
  const [pastApplications, setPastApplications] = useState<LandlordDashboardApplication[]>([]);
  const [tenantApplications, setTenantApplications] = useState<{
    pending: TenantDashboardApplication[];
    accepted: TenantDashboardApplication[];
    past: TenantDashboardApplication[];
  }>({
    pending: [],
    accepted: [],
    past: []
  });

  const [showTenantProfile, setShowTenantProfile] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantProfile | null>({
    id: "Alberta",
    firstName: "Alberta",
    lastName: "Bobbeth Charleson",
    email: "accountholder0@example.com",
    phone: "1112223333",
    backgroundCheckStatus: "Not Started",
    plaidVerified: true,
    identityVerified: true,
    bankAccountVerified: true,
    verifiedIncome: 0, // Not verified
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
  
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (userMode === 'landlord') {
      fetchLandlordData();
      const interval = setInterval(fetchLandlordData, 30000);
      return () => clearInterval(interval);
    } else if (userMode === 'tenant') {
      fetchTenantData();
      const interval = setInterval(fetchTenantData, 30000);
      return () => clearInterval(interval);
    }
  }, [userMode]);

  const fetchLandlordData = async () => {
    try {
      setIsLoadingApplications(true);
      const propertiesResponse = await landlordApi.getLandlordProperties();
      const properties = propertiesResponse.data.properties;
      setProperties(properties);

      const pending: LandlordDashboardApplication[] = [];
      const accepted: LandlordDashboardApplication[] = [];
      const past: LandlordDashboardApplication[] = [];
      
      for (const property of properties) {
        try {
          // Get all applications for the property
          const applicationsResponse = await landlordApi.getPropertyApplications(property.id);
          const applications = applicationsResponse.data.applications;

          // Map and filter applications based on their status
          applications.forEach((app: LandlordApplication) => {
            const mappedApp = {
            id: app.id,
            propertyId: property.id,
            name: `${app.tenant.firstName} ${app.tenant.lastName}`,
            property: property.address,
            date: new Date(app.createdAt).toLocaleDateString(),
              status: app.status,
            creditScore: app.tenant.backgroundCheckStatus === 'completed' ? 720 : undefined,
            backgroundCheck: app.tenant.backgroundCheckStatus,
            income: app.tenant.verifiedIncome ? `$${app.tenant.verifiedIncome.toLocaleString()}` : 'Not verified',
            occupation: 'Not provided',
            currentAddress: 'Not provided',
            tenant: {
              firstName: app.tenant.firstName,
              lastName: app.tenant.lastName,
              email: app.tenant.email,
              phone: app.tenant.phone,
              backgroundCheckStatus: app.tenant.backgroundCheckStatus,
              plaidVerified: app.tenant.plaidVerified,
              identityVerified: app.tenant.identityVerified,
              bankAccountVerified: app.tenant.bankAccountVerified,
              verifiedIncome: app.tenant.verifiedIncome
            }
            };

            // Add to appropriate array based on exact status match
            switch (app.status) {
              case 'PENDING':
              case 'Pending':
                pending.push(mappedApp);
                break;
              case 'APPROVED':
              case 'Approved':
                accepted.push(mappedApp);
                break;
              case 'REJECTED':
              case 'Rejected':
                past.push(mappedApp);
                break;
              default:
                console.warn(`Unknown application status: ${app.status}`);
            }
          });
        } catch (error) {
          console.error(`Error fetching applications for property ${property.id}:`, error);
        }
      }

      setLandlordApplications(pending);
      setAcceptedApplications(accepted);
      setPastApplications(past);
      setNotificationCount(pending.length);
    } catch (error) {
      console.error('Error fetching landlord data:', error);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const fetchTenantData = async () => {
    try {
      setIsLoadingApplications(true);
      const response = await tenantApi.getApplications();
      const allApplications = response.data.applications;

      const applications = {
        pending: allApplications
        .filter(app => app.status === 'Pending')
        .map((app: TenantApplication) => ({
          id: app.id,
          propertyId: app.propertyId,
          name: app.property.address,
          property: app.property.address,
          date: new Date(app.createdAt).toLocaleDateString(),
          status: app.status.toLowerCase(),
          landlordName: `${app.property.landlord.firstName} ${app.property.landlord.lastName}`,
          landlordRating: app.property.landlord.rating || 4.5,
          responseTime: app.property.landlord.responseTime || 'Usually responds within 24h',
          propertyDetails: {
            rent: `$${app.property.price}/month`,
            moveInDate: 'Flexible',
            leaseLength: '12 months'
            }
          })),
        accepted: allApplications
        .filter(app => app.status === 'Approved')
        .map((app: TenantApplication) => ({
          id: app.id,
          propertyId: app.propertyId,
          name: app.property.address,
          property: app.property.address,
          date: new Date(app.createdAt).toLocaleDateString(),
          status: 'accepted',
          landlordName: `${app.property.landlord.firstName} ${app.property.landlord.lastName}`,
          landlordRating: app.property.landlord.rating || 4.5,
          propertyDetails: {
            rent: `$${app.property.price}/month`,
            moveInDate: 'Flexible',
            leaseLength: '12 months'
            }
          })),
        past: allApplications
        .filter(app => app.status === 'Rejected')
        .map((app: TenantApplication) => ({
          id: app.id,
          propertyId: app.propertyId,
          name: app.property.address,
          property: app.property.address,
          date: new Date(app.createdAt).toLocaleDateString(),
          status: 'rejected',
            landlordName: `${app.property.landlord.firstName} ${app.property.landlord.lastName}`
          }))
      };

      setTenantApplications(applications);
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleAcceptTenant = async (applicationId: string, propertyId: string) => {
    try {
      await landlordApi.updateApplicationStatus(propertyId, applicationId, 'Approved');
      fetchLandlordData();
    } catch (error) {
      console.error('Error accepting tenant:', error);
    }
  };

  const handleRejectTenant = async (applicationId: string, propertyId: string) => {
    try {
      await landlordApi.updateApplicationStatus(propertyId, applicationId, 'Rejected');
      fetchLandlordData();
    } catch (error) {
      console.error('Error rejecting tenant:', error);
    }
  };

  const handleContractGenerated = () => {
    setContractGenerated(true);
    setShowContractModal(false);
    setShowPdfPreview(true);
    setCurrentStep('preview');
  };

  const handlePreviewLease = () => {
    setShowPdfPreview(true);
  };

  const handleBack = () => {
    setShowPdfPreview(false);
    setShowContractModal(true);
    setCurrentStep('upload');
  };

  const handleAcceptInModal = () => {
    if (selectedApplication) {
      setLandlordApplications(prev => [...prev, selectedApplication]);
    }
  };

  const handleReviewDetails = () => {
    setShowApplicationModal(true);
    setNotificationCount(0);
    clearNotification();
  };

  const handlePaymentSuccess = (applicationId: string) => {
    const application = tenantApplications.pending.find(app => app.id === applicationId);
    if (!application) return;

    const newRental = {
      id: Date.now().toString(),
      property: application.property,
      propertyId: application.propertyId,
      tenantName: application.name,
      date: new Date().toISOString().split('T')[0],
      status: "active",
      rentDue: "1st of each month",
      nextPayment: "$1,800",
      leaseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    };

    setTenantApplications(prev => ({
      ...prev,
      pending: prev.pending.filter(app => app.id !== applicationId)
    }));
  };

  const handleRevokeApplication = async (applicationId: string) => {
    try {
      await tenantApi.revokeApplication(applicationId);
      fetchTenantData();
    } catch (error) {
      console.error('Error revoking application:', error);
    }
  };

  // Update the handleViewProfile function
  const handleViewProfile = (tenant: TenantProfile) => {
    // Create a URL-friendly version of the tenant's name
    const tenantSlug = `${tenant.firstName}-${tenant.lastName}`.toLowerCase().replace(/\s+/g, '-');
    router.push(`/tenant/profile/${tenantSlug}`);
  };

  const handleViewDocuments = (applicationId: string) => {
    router.push(`/landlord/view-documents/${applicationId}`);
  };

  if (isLoading || isLoadingApplications) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  const filteredLandlordApplications = selectedProperty === 'all'
    ? landlordApplications
    : landlordApplications.filter(app => app.propertyId === selectedProperty);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          {isClient && (
            <h1 className="text-3xl font-semibold">
              {userMode === 'tenant' ? 'Tenant Dashboard' : 'Landlord Dashboard'}
            </h1>
          )}
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            {userMode === 'landlord' && notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </div>
        </div>

        {userMode === 'landlord' ? (
          <>
            {/* Property Filter and Upload Button */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.address}
                  </option>
                ))}
              </select>
              
              {userMode === 'landlord' && (
                <button
                  onClick={() => router.push('/properties/upload')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Upload Property
                </button>
              )}
            </div>

            {/* Landlord Applications Sections */}
            <div className="space-y-8">
              {/* Pending Applications */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">
                  Pending Applications
                  {filteredLandlordApplications.length > 0 && (
              <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      {filteredLandlordApplications.length} pending
              </span>
            )}
          </h2>
          
          <div className="space-y-4">
                  {filteredLandlordApplications.length === 0 ? (
                    <div className="text-center py-12">
                      <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No Applications</h3>
                      <p className="text-gray-500">There are no pending applications at this time.</p>
                    </div>
                  ) : (
                    filteredLandlordApplications.map((application) => (
                      <Card key={application.id} className="p-6 hover:border-blue-500 transition-colors">
                        {/* First Row - Name, Property, and Date */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold">{application.name}</h3>
                              <p className="text-gray-600 text-sm">{application.property}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                              Pending Review
                            </span>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              {application.date}
                            </div>
                          </div>
                        </div>

                        {/* Second Row - Summary Information */}
                        <div className="grid grid-cols-4 gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <p className="text-sm text-gray-500">Background Check</p>
                            </div>
                            <p className="font-medium ml-6">
                              {application.tenant?.backgroundCheckStatus === 'completed' ? (
                                <span className="text-green-600">Completed</span>
                              ) : (
                                <span className="text-yellow-600">Not Started</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-4 h-4 text-gray-500" />
                              <p className="text-sm text-gray-500">Credit Score</p>
                            </div>
                            <p className="font-medium ml-6">
                              {application.creditScore ? (
                                <span className="text-green-600">{application.creditScore}</span>
                              ) : (
                                'Not Available'
                              )}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <p className="text-sm text-gray-500">Annual Income</p>
                            </div>
                            <p className="font-medium ml-6">{application.income}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Wallet className="w-4 h-4 text-gray-500" />
                              <p className="text-sm text-gray-500">Bank Balance</p>
                            </div>
                            <p className="font-medium ml-6">
                              {application.tenant?.bankAccountVerified ? (
                                <span className="text-green-600">Verified</span>
                              ) : (
                                'Not Verified'
                              )}
                            </p>
          </div>
        </div>

                        {/* Third Row - Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptTenant(application.id, application.propertyId)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectTenant(application.id, application.propertyId)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleViewProfile(application.tenant as TenantProfile)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            View Profile
                          </button>
                          <button
                            onClick={() => handleViewDocuments(application.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Documents
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Accepted Applications */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">
                  Accepted Applications
                  {acceptedApplications.length > 0 && (
                    <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {acceptedApplications.length} accepted
                    </span>
                  )}
                </h2>
                
                <div className="space-y-4">
                  {acceptedApplications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No accepted applications at the moment.
                    </p>
                  ) : (
                    acceptedApplications.map((application) => (
                      <div 
                        key={application.id}
                        className="border border-gray-200 rounded-2xl p-6 hover:border-blue-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{application.name}</h3>
                            <p className="text-gray-600">{application.property}</p>
                          </div>
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Ready for Lease
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="text-gray-600 text-sm">Background Check</p>
                            <p className="font-medium text-green-600">{application.tenant?.backgroundCheckStatus}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Credit Score</p>
                            <p className="font-medium">{application.creditScore || 'Not Available'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Annual Income</p>
                            <p className="font-medium">{application.income}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Accepted Date</p>
                            <p className="font-semibold">{application.date}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowApplicationModal(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:border-blue-600 hover:text-blue-600 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => handleViewDocuments(application.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Documents
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Past Applications */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">
                  Past Applications
                  {pastApplications.length > 0 && (
                    <span className="ml-2 text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {pastApplications.length} total
                    </span>
                  )}
                </h2>
                
                <div className="space-y-4">
                  {pastApplications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No past applications to show.
                    </p>
                  ) : (
                    pastApplications.map((application) => (
                      <div 
                        key={application.id}
                        className="border border-gray-200 rounded-2xl p-6 hover:border-blue-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{application.name}</h3>
                            <p className="text-gray-600">{application.property}</p>
                          </div>
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            <XCircle className="w-4 h-4" />
                            Rejected
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-600 text-sm">Application Date</p>
                            <p className="font-semibold">{application.date}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Credit Score</p>
                            <p className="font-semibold">{application.creditScore || 'Not available'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Income</p>
                            <p className="font-semibold">{application.income}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleViewDocuments(application.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Documents
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

        {/* My Properties Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                My Properties
                    {properties.length > 0 && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {properties.length} total
                  </span>
                )}
              </h2>
            </div>
            
                {properties.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't uploaded any properties yet.</p>
                <button
                  onClick={() => router.push('/properties/upload')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  Upload Your First Property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties
                  .filter(property => !property.isLeased)
                  .map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
              </div>
            )}
          </div>

        {/* Active Rentals Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mt-8">
          <h2 className="text-2xl font-semibold mb-6">
            Active Rentals
            {activeRentals.length > 0 && (
              <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {activeRentals.length} active
              </span>
            )}
          </h2>
          
          <div className="space-y-4">
                  {activeRentals.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No active rentals at the moment.</p>
                  ) : (
                    activeRentals.map((rental) => (
                      <div 
                        key={rental.id}
                        className="border border-gray-200 rounded-2xl p-6 hover:border-blue-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{rental.property}</h3>
                            <p className="text-gray-600">Tenant: {rental.tenantName}</p>
          </div>
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Active Lease
                          </span>
        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-gray-600 text-sm">Rent Due</p>
                            <p className="font-semibold">{rental.rentDue}</p>
      </div>
                          <div>
                            <p className="text-gray-600 text-sm">Next Payment</p>
                            <p className="font-semibold">{rental.nextPayment}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Lease Start</p>
                            <p className="font-semibold">{rental.date}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Lease End</p>
                            <p className="font-semibold">{rental.leaseEnd}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Tenant Applications Sections */}
            <div className="space-y-8">
              {/* Pending Applications */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">
                  My Applications
                  {tenantApplications.pending.length > 0 && (
                    <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      {tenantApplications.pending.length} in review
                    </span>
                  )}
                </h2>
                
                <div className="space-y-4">
                  {tenantApplications.pending.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No active applications at the moment.
                    </p>
                  ) : (
                    tenantApplications.pending.map(application => (
                      <div 
                        key={application.id}
                        className="border border-gray-200 rounded-2xl p-6 hover:border-blue-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{application.name}</h3>
                            <p className="text-gray-600">Landlord: {application.landlordName}</p>
                          </div>
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            Under Review
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="text-gray-600 text-sm">Monthly Rent</p>
                            <p className="font-semibold">{application.propertyDetails?.rent}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Move-in Date</p>
                            <p className="font-semibold">{application.propertyDetails?.moveInDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Lease Length</p>
                            <p className="font-semibold">{application.propertyDetails?.leaseLength}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Application Date</p>
                            <p className="font-semibold">{application.date}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={() => handleRevokeApplication(application.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Revoke Application
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Accepted Applications */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">
                  My Applications
                  {tenantApplications.accepted.length > 0 && (
                    <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {tenantApplications.accepted.length} accepted
                    </span>
                  )}
                </h2>
                
                <div className="space-y-4">
                  {tenantApplications.accepted.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No accepted applications at the moment.
                    </p>
                  ) : (
                    tenantApplications.accepted.map(application => (
                      <div 
                        key={application.id}
                        className="border border-gray-200 rounded-2xl p-6 hover:border-blue-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{application.name}</h3>
                            <p className="text-gray-600">Landlord: {application.landlordName}</p>
                          </div>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            Ready for Lease
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="text-gray-600 text-sm">Monthly Rent</p>
                            <p className="font-semibold">{application.propertyDetails?.rent}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Move-in Date</p>
                            <p className="font-semibold">{application.propertyDetails?.moveInDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Lease Length</p>
                            <p className="font-semibold">{application.propertyDetails?.leaseLength}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Application Date</p>
                            <p className="font-semibold">{application.date}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={() => handleRevokeApplication(application.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Revoke Application
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Past Applications */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">
                  My Applications
                  {tenantApplications.past.length > 0 && (
                    <span className="ml-2 text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {tenantApplications.past.length} total
                    </span>
                  )}
                </h2>
                
                <div className="space-y-4">
                  {tenantApplications.past.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No past applications to show.
                    </p>
                  ) : (
                    tenantApplications.past.map(application => (
                      <div 
                        key={application.id}
                        className="border border-gray-200 rounded-2xl p-6 hover:border-blue-600 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{application.name}</h3>
                            <p className="text-gray-600">Landlord: {application.landlordName}</p>
                          </div>
                          <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            Not Selected
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="text-gray-600 text-sm">Monthly Rent</p>
                            <p className="font-semibold">{application.propertyDetails?.rent}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Move-in Date</p>
                            <p className="font-semibold">{application.propertyDetails?.moveInDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Lease Length</p>
                            <p className="font-semibold">{application.propertyDetails?.leaseLength}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Application Date</p>
                            <p className="font-semibold">{application.date}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Application Modal */}
      <ApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        application={selectedApplication}
      />

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        onAccept={handleAcceptInModal}
      />
    </div>
  );
}

const PdfPreviewModal = ({ 
  isOpen, 
  onClose,
  onAccept 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAccept: () => void;
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/leases/AI-generated-lease.pdf';
    link.download = 'AI-generated-lease.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleAccept = () => {
    setIsAccepted(true);
    onAccept();
  };

  if (isAccepted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl p-8 max-w-xl w-full text-center">
          <button 
            onClick={onClose}
            className="absolute right-4 sm:right-6 top-4 sm:top-6 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="py-16">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <CheckCircle className="w-full h-full text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Tenant Accepted!</h3>
            <p className="text-gray-600 mb-8">
              The lease agreement has been sent to the tenant for final signature and payment.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white rounded-3xl p-8 transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 m-0 rounded-none max-w-none' 
          : 'max-w-2xl w-full my-auto relative min-h-fit max-h-[90vh]'
      } overflow-y-auto`}>
        <button 
          onClick={onClose}
          className="absolute right-4 sm:right-6 top-4 sm:top-6 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-1 flex items-center justify-center gap-2">
            <h2 className="text-2xl font-semibold">Lease Agreement Preview</h2>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className={`w-full ${isFullscreen ? 'h-[85vh]' : 'h-[50vh]'} mb-6`}>
          <iframe
            src="/leases/AI-generated-lease.pdf"
            className="w-full h-full rounded-lg border border-gray-200"
            title="Lease Agreement Preview"
          />
        </div>

        <div className="max-w-md mx-auto space-y-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors min-w-[180px]"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors min-w-[180px]"
            >
              <UserCheck className="w-5 h-5" />
              Accept Tenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
