'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, ArrowLeft, Check, X, MapPin, Heart, Share2, Copy, Link as LinkIcon } from 'lucide-react';
import apiService from '@/lib/api';
import type { PropertyResponse } from '@/lib/api';
import Link from 'next/link';
import useUserMode from '@/hooks/useUserMode';
import PropertyApplicationModal from '@/components/PropertyApplicationModal';
import useFavorites from '@/hooks/useFavorites';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import ImageGallery from '@/components/ui/ImageGallery';
import { getImageUrl } from '@/utils/image';
import { useToast } from '@/components/ui/toast';
import PlaidVerificationButton from '@/components/PlaidVerificationButton';

interface Application {
  id: string;
  tenantId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
  };
  hasId: boolean;
  hasBankStatement: boolean;
  hasForm140: boolean;
}

// Extend PropertyResponse to include applications
interface ExtendedPropertyResponse extends PropertyResponse {
  applications?: Application[];
  unitNumber?: string;
}

function ApplicationsList({ propertyId }: { propertyId: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [propertyId]);

  const fetchApplications = async () => {
    try {
      const response = await apiService.landlord.getPropertyApplications(propertyId);
      const applicationsData = Array.isArray(response.data) ? response.data : 
        (response.data && typeof response.data === 'object' && 'applications' in response.data) ? 
        response.data.applications : [];
      setApplications(applicationsData as Application[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, status: 'Approved' | 'Rejected') => {
    try {
      await apiService.landlord.updateApplicationStatus(propertyId, applicationId, status);
      await fetchApplications(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating application status:', err);
    }
  };

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded" />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (applications.length === 0) return <div className="text-gray-500">No applications yet</div>;

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div key={application.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{application.tenant.firstName} {application.tenant.lastName}</h3>
              <p className="text-sm text-gray-600">{application.tenant.email}</p>
              <p className="text-sm text-gray-600">
                Applied on {new Date(application.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-2 space-x-2">
                {application.hasId && (
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    ID Verified
                  </span>
                )}
                {application.hasBankStatement && (
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Bank Statement
                  </span>
                )}
                {application.hasForm140 && (
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Form 140
                  </span>
                )}
              </div>
            </div>
            {application.status === 'Pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(application.id, 'Approved')}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleStatusUpdate(application.id, 'Rejected')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {application.status !== 'Pending' && (
              <span
                className={`px-2 py-1 text-sm rounded ${
                  application.status === 'Approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {application.status}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Add ShareModal component before the main PropertyDetailPage component
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyUrl: string;
  propertyTitle: string;
}

function ShareModal({ isOpen, onClose, propertyUrl, propertyTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: `Check out this property: ${propertyTitle}`,
          url: propertyUrl
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Share Property</h3>
        
        <div className="space-y-4">
          {/* Native Share Button - Only show if Web Share API is supported */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          )}
          
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Link
              </>
            )}
          </button>
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function PropertyDetailPage({ params }: { params: { propertyId: string } }) {
  const [property, setProperty] = useState<ExtendedPropertyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const router = useRouter();
  const { userMode, isLoading: isUserModeLoading } = useUserMode();
  const { addToFavorites, removeFromFavorites, isPropertyFavorited, loading: favoriteLoading } = useFavorites();
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserModeLoading) {
      fetchProperty();
      if (userMode === 'tenant') {
        checkApplication();
        checkVerificationStatus();
      }
    }
  }, [params.propertyId, userMode, isUserModeLoading]);

  const fetchProperty = async () => {
    try {
      const response = await apiService.properties.getPublicProperty(params.propertyId);
      
      if (response.data) {
        const propertyData = response.data;
        
        // Convert null values to undefined and ensure proper types
        const formattedData = {
          ...propertyData,
          floorNumber: propertyData.floorNumber ? Number(propertyData.floorNumber) : undefined,
          totalSquareFeet: propertyData.totalSquareFeet ? Number(propertyData.totalSquareFeet) : undefined,
          parkingSpaces: propertyData.parkingSpaces ? Number(propertyData.parkingSpaces) : undefined,
          unitNumber: propertyData.unitNumber || undefined,
          hasBasement: Boolean(propertyData.hasBasement),
          description: propertyData.description || '',
          photos: propertyData.photos || [],
        } as ExtendedPropertyResponse;
        
        setProperty(formattedData);
      }
    } catch (error) {
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplication = async () => {
    try {
      const response = await apiService.tenants.checkApplicationExists(params.propertyId);
      setHasApplied(response.data.hasApplied);
      setApplicationStatus(response.data.application?.status || null);
    } catch (err) {
      console.error('Error checking application:', err);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await apiService.tenants.getVerificationStatus();
      console.log('Tenant verification status:', response.data); // Debug log
      // A tenant is considered verified if they have both identity and bank account verified
      setIsVerified(response.data.identityVerified && response.data.bankAccountVerified);
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.landlord.deleteProperty(params.propertyId);
      router.push('/properties');
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const handleApplicationSuccess = () => {
    setShowApplicationModal(false);
    checkApplication();
  };

  const handleApplyClick = async () => {
    if (!isVerified) {
      toast({
        title: "Verification Required",
        description: "Please verify your account with Plaid before applying.",
        variant: "destructive"
      });
      setIsVerificationModalOpen(true);
      return;
    }

    // If tenant is verified, show application modal directly
    setIsModalOpen(true);
  };

  // Add this function before the return statement
  const getPropertyUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  if (loading || isUserModeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Property Not Found</h1>
        <p className="text-gray-600">The property you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
        <Link 
          href="/properties" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Link>

        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="flex justify-between items-start">
            <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full w-fit text-sm">
              For rent
            </span>
            {userMode === 'landlord' && (
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-semibold mt-1">{property.address}</h1>
          
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm sm:text-base">
              <span>{property.bedrooms} Bedrooms</span>
              <span className="hidden sm:inline">•</span>
              <span>{property.bathrooms?.toFixed(1) || 'Not specified'} Bathrooms</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mt-2 sm:mt-0">
              <MapPin className="w-5 h-5" />
              <span className="text-base">{property.address}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-4xl font-bold">$ {property.price}</h2>
          </div>
        </div>
      </div>

      {/* Main Image */}
      <div className="max-w-4xl mx-auto px-6 mt-4">
        {property.photos && property.photos.length > 0 ? (
          <ImageGallery images={property.photos} />
        ) : (
          <div className="w-full aspect-[16/9] rounded-t-3xl bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No images available</span>
          </div>
        )}
        
        {/* Action Buttons Bar */}
        <div className="grid grid-cols-4 divide-x divide-gray-200 border-x border-b border-gray-200 bg-white rounded-b-3xl">
          {/* 3D Tour Button - Coming Soon */}
          <div 
            className="flex flex-col items-center justify-center py-4 cursor-not-allowed opacity-60"
            title="Coming Soon!"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              className="stroke-gray-500 mb-2"
              fill="none"
            >
              <path d="M2.23,5.4H5.16a2,2,0,0,1,2,2h0a2,2,0,0,1-1.95,2H3.21"/>
              <path d="M2.23,13.22H5.16a2,2,0,0,0,2-2h0a2,2,0,0,0-1.95-2H3.21"/>
              <circle cx="12" cy="11.27" r="1.95"/>
              <path d="M10.05,11.27v-2A3.91,3.91,0,0,1,14,5.4h0"/>
              <rect x="16.89" y="5.4" width="3.91" height="7.82" rx="1.95"/>
              <line x1="22.75" y1="2.47" x2="22.75" y2="4.43"/>
              <path d="M1.25,15.18c0,1.92,3.91,3.9,8.85,3.85"/>
              <path d="M14,19c4.89.06,8.8-1.93,8.8-3.84"/>
              <polyline points="7.6 16.52 10.11 19.02 7.6 21.53"/>
            </svg>
            <span className="text-gray-500 font-medium">3D Tour</span>
            <span className="text-xs text-gray-400 mt-1">Coming Soon!</span>
          </div>

          {userMode === 'tenant' && (
            <button 
              onClick={handleApplyClick}
              className="flex flex-col items-center justify-center py-4 hover:bg-gray-50 transition-colors group"
              disabled={hasApplied}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="url(#gradient)" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`mb-2 ${hasApplied ? 'opacity-50' : ''}`}
              >
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="50%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 font-medium ${hasApplied ? 'opacity-50' : ''}`}>
                {hasApplied ? (applicationStatus === 'Pending' ? 'Applied' : applicationStatus) : 'Apply Now'}
              </span>
            </button>
          )}

          {userMode === 'tenant' && (
            <button 
              onClick={async () => {
                const isFavorited = isPropertyFavorited(params.propertyId);
                try {
                  if (isFavorited) {
                    await removeFromFavorites(params.propertyId);
                  } else {
                    await addToFavorites(params.propertyId);
                  }
                } catch (err) {
                  console.error('Error toggling favorite:', err);
                }
              }}
              disabled={favoriteLoading}
              className="flex flex-col items-center justify-center py-4 hover:bg-gray-50 transition-colors group"
            >
              <Heart
                className={`w-6 h-6 mb-2 ${
                  isPropertyFavorited(params.propertyId)
                    ? 'fill-red-500 stroke-red-500'
                    : 'stroke-blue-600 group-hover:stroke-blue-700'
                }`}
              />
              <span className={`font-medium ${
                isPropertyFavorited(params.propertyId)
                  ? 'text-red-500'
                  : 'text-blue-600 group-hover:text-blue-700'
              }`}>
                {isPropertyFavorited(params.propertyId) ? 'Saved' : 'Save'}
              </span>
            </button>
          )}

          {/* Share Button - Visible to all */}
          <button 
            className="flex flex-col items-center justify-center py-4 hover:bg-gray-50 transition-colors group"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-6 h-6 mb-2 stroke-blue-600 group-hover:stroke-blue-700" />
            <span className="text-blue-600 font-medium group-hover:text-blue-700">Share</span>
          </button>

          {userMode === 'landlord' && (
            <>
              {/* Status Button - For Landlords */}
              <button 
                className="flex flex-col items-center justify-center py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                  property.applications?.some(app => app.status === 'Approved') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {property.applications?.some(app => app.status === 'Approved') ? 'Rented' : 'Available'}
                </div>
                <span className="text-gray-600">Status</span>
              </button>

              {/* Update Details Button */}
              <button 
                onClick={() => setShowEditModal(true)}
                className="flex flex-col items-center justify-center py-4 hover:bg-gray-50 transition-colors group"
              >
                <Pencil className="w-6 h-6 mb-2 stroke-blue-600 group-hover:stroke-blue-700" />
                <span className="text-blue-600 font-medium group-hover:text-blue-700">Update</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-xl text-gray-600 leading-relaxed">
          {property.description || 'No description provided.'}
        </p>
      </div>

      {/* Property Details */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Details */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Property Details</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="divide-y divide-gray-200">
                <div className="flex items-center justify-between p-4">
                <span className="text-gray-600">Price</span>
                  <span className="font-medium">${property.price?.toLocaleString()}/month</span>
              </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-gray-600">Property Type</span>
                  <span className="font-medium">{property.propertyType || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-gray-600">Available From</span>
                  <span className="font-medium">
                    {property.availableDate ? new Date(property.availableDate.split('T')[0]).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-gray-600">Total Area</span>
                  <span className="font-medium">{property.totalSquareFeet ? `${property.totalSquareFeet.toLocaleString()} sq ft` : 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                <span className="text-gray-600">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms || 'Not specified'}</span>
              </div>
                <div className="flex items-center justify-between p-4">
                <span className="text-gray-600">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms?.toFixed(1) || 'Not specified'}</span>
              </div>
                {(property.propertyType === 'Apartment' || property.propertyType === 'Condo') && (
                  <div className="flex items-center justify-between p-4">
                    <span className="text-gray-600">Floor Number</span>
                    <span className="font-medium">{property.floorNumber || 'Not specified'}</span>
                  </div>
                )}
                {(property.propertyType === 'Apartment' || property.propertyType === 'Condo') && (
                  <div className="flex items-center justify-between p-4">
                    <span className="text-gray-600">Unit Number</span>
                    <span className="font-medium">{property.unitNumber || 'Not specified'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features & Amenities */}
            <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Features & Amenities</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${property.hasParking ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700">Parking {property.hasParking && property.parkingSpaces ? `(${property.parkingSpaces} spaces)` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${property.hasMicrowave ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700">Microwave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${property.hasRefrigerator ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700">Refrigerator</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${property.isPetFriendly ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700">Pet Friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${property.heatingAndAC !== 'None' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700">Heating & AC: {property.heatingAndAC || 'None'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${property.laundryType !== 'None' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700">Laundry: {property.laundryType || 'None'}</span>
                </div>
                {property.propertyType === 'House' && (
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${property.hasBasement ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-700">Basement</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Location</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="divide-y divide-gray-200">
                <div className="flex items-center justify-between p-4">
                  <span className="text-gray-600">Address</span>
                  <span className="font-medium">{property.address || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-gray-600">City</span>
                  <span className="font-medium">{property.city || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-gray-600">State/Province</span>
                  <span className="font-medium">{property.state || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-gray-600">Postal Code</span>
                  <span className="font-medium">{property.postalCode || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-gray-600">Country</span>
                  <span className="font-medium">{property.country || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {property.photos && property.photos.length > 1 && (
          <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-semibold">Photos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.photos.map((photo, index) => (
                <div 
                  key={index} 
                  className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                  onClick={() => {
                    const galleryElement = document.querySelector('[data-image-gallery]');
                    if (galleryElement) {
                      const openGalleryButton = galleryElement.querySelector(`[data-image-index="${index}"]`);
                      if (openGalleryButton) {
                        (openGalleryButton as HTMLElement).click();
                      }
                    }
                  }}
                >
                  <img 
                    src={getImageUrl(photo)}
                    alt={`${property.address} - ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Applications Section - Only show for landlords */}
      {userMode === 'landlord' && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Applications</h2>
            <ApplicationsList propertyId={params.propertyId} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && userMode === 'landlord' && (
        <EditPropertyModal
          property={property}
          onClose={() => setShowEditModal(false)}
          onSave={async (updatedData) => {
            try {
              await apiService.landlord.updateProperty(params.propertyId, updatedData);
              await fetchProperty();
              setShowEditModal(false);
            } catch (error) {
              console.error('Error updating property:', error);
            }
          }}
        />
      )}

      {showDeleteConfirm && userMode === 'landlord' && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          propertyAddress={property.address}
        />
      )}

      {/* Verification Modal */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Verification Required</h3>
            <p className="text-gray-600 mb-6">
              To apply for properties, you need to verify your income and identity through Plaid.
              This helps landlords make informed decisions and speeds up the application process.
            </p>
            <div className="space-y-4">
              <PlaidVerificationButton onSuccess={() => {
                setIsVerified(true);
                setIsVerificationModalOpen(false);
                // Show application modal immediately after verification
                setIsModalOpen(true);
              }} />
              <button
                onClick={() => setIsVerificationModalOpen(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      <PropertyApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={params.propertyId}
        onSuccess={handleApplicationSuccess}
      />

      {/* Add ShareModal before the closing div */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        propertyUrl={getPropertyUrl()}
        propertyTitle={property?.address || 'Property Listing'}
      />
    </div>
  );
}

interface EditPropertyModalProps {
  property: ExtendedPropertyResponse;
  onClose: () => void;
  onSave: (data: Partial<ExtendedPropertyResponse>) => void;
}

const PROPERTY_TYPES: string[] = ['House', 'Apartment', 'Condo', 'Villa'];
const HEATING_AC_OPTIONS: string[] = ['Heating Only', 'AC Only', 'Both', 'None'];
const LAUNDRY_OPTIONS: string[] = ['In-Unit', 'Shared', 'None'];

const libraries: ("places")[] = ["places"];

function EditPropertyModal({ property, onClose, onSave }: EditPropertyModalProps) {
  const [formData, setFormData] = useState({
    address: property.address,
    city: property.city,
    state: property.state,
    postalCode: property.postalCode,
    country: property.country,
    price: property.price,
    propertyType: property.propertyType,
    floorNumber: property.floorNumber ?? undefined,
    unitNumber: property.unitNumber ?? undefined,
    availableDate: property.availableDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    totalSquareFeet: property.totalSquareFeet ?? undefined,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    hasParking: property.hasParking,
    parkingSpaces: property.parkingSpaces ?? undefined,
    heatingAndAC: property.heatingAndAC,
    laundryType: property.laundryType,
    hasMicrowave: property.hasMicrowave,
    hasRefrigerator: property.hasRefrigerator,
    isPetFriendly: property.isPetFriendly,
    hasBasement: property.hasBasement,
    description: property.description || '',
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? value === '' ? undefined : Number(value)
          : value
    }));
  };

  const handlePlaceSelect = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location && place.address_components) {
        // Extract address components
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let postalCode = '';
        let country = '';

        place.address_components?.forEach((component: google.maps.GeocoderAddressComponent) => {
          const types = component.types;
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          }
        });

        setFormData(prev => ({
          ...prev,
          address: `${streetNumber} ${route}`.trim(),
          city,
          state,
          postalCode,
          country,
        }));
      }
    }
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add the time part to the date and ensure all number fields are properly typed
    const updatedData = {
      ...formData,
      availableDate: formData.availableDate + 'T00:00:00.000Z',
      price: Number(formData.price),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      totalSquareFeet: formData.totalSquareFeet ? Number(formData.totalSquareFeet) : undefined,
      floorNumber: formData.floorNumber ? Number(formData.floorNumber) : undefined,
      parkingSpaces: formData.hasParking && formData.parkingSpaces ? Number(formData.parkingSpaces) : undefined
    };
    onSave(updatedData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Edit Property</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={onLoad}
                      onPlaceChanged={handlePlaceSelect}
                      restrictions={{ country: "ca" }}
                    >
                      <input
                        type="text"
                        defaultValue={formData.address}
                        placeholder="Enter your address"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </Autocomplete>
                  ) : (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Loading Google Places..."
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State/Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Property Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700">Property Type</label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  >
                    {PROPERTY_TYPES.map((type: string) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                {(formData.propertyType === 'Apartment' || formData.propertyType === 'Condo') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Floor Number</label>
                    <input
                      type="number"
                      name="floorNumber"
                      value={formData.floorNumber || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                )}
                {(formData.propertyType === 'Apartment' || formData.propertyType === 'Condo') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Number</label>
                    <input
                      type="text"
                      name="unitNumber"
                      value={formData.unitNumber || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Date</label>
                  <input
                    type="date"
                    name="availableDate"
                    value={formData.availableDate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Square Feet</label>
                  <input
                    type="number"
                    name="totalSquareFeet"
                    value={formData.totalSquareFeet || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (per month)</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      min="400"
                      value={formData.price || ''}
                      onChange={handleChange}
                      onBlur={(e) => {
                        const value = Number(e.target.value);
                        if (!value || value < 400) {
                          setFormData(prev => ({ ...prev, price: 400 }));
                        }
                      }}
                      className="pl-7 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Enter price (min. $400)"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rooms & Features Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Rooms & Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={e => {
                    const value = Number(e.target.value);
                    // Only allow whole numbers or .5 increments
                    if (value % 0.5 === 0) {
                      handleChange({
                        ...e,
                        target: {
                          ...e.target,
                          value: value.toString(),
                          type: 'number',
                          name: 'bathrooms'
                        }
                      });
                    }
                  }}
                  min="0"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Heating & AC</label>
                  <select
                    name="heatingAndAC"
                    value={formData.heatingAndAC}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  >
                    {HEATING_AC_OPTIONS.map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Laundry</label>
                  <select
                    name="laundryType"
                    value={formData.laundryType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  >
                    {LAUNDRY_OPTIONS.map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasParking"
                      name="hasParking"
                      checked={formData.hasParking}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasParking" className="ml-2 text-sm text-gray-700">
                      Has Parking
                    </label>
                  </div>
                  {formData.hasParking && (
            <div>
                      <label className="block text-sm font-medium text-gray-700">Parking Spaces</label>
                      <input
                        type="number"
                        name="parkingSpaces"
                        value={formData.parkingSpaces || ''}
                        onChange={handleChange}
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasMicrowave"
                      name="hasMicrowave"
                      checked={formData.hasMicrowave}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasMicrowave" className="ml-2 text-sm text-gray-700">
                      Has Microwave
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasRefrigerator"
                      name="hasRefrigerator"
                      checked={formData.hasRefrigerator}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasRefrigerator" className="ml-2 text-sm text-gray-700">
                      Has Refrigerator
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPetFriendly"
                      name="isPetFriendly"
                      checked={formData.isPetFriendly}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPetFriendly" className="ml-2 text-sm text-gray-700">
                      Pet Friendly
                    </label>
                  </div>
                  {formData.propertyType === 'House' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hasBasement"
                        name="hasBasement"
                        checked={formData.hasBasement}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hasBasement" className="ml-2 text-sm text-gray-700">
                        Has Basement
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Describe your property..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ 
  onConfirm, 
  onCancel,
  propertyAddress 
}: { 
  onConfirm: () => void; 
  onCancel: () => void;
  propertyAddress: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-semibold mb-4">Delete Property</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the property at <strong>{propertyAddress}</strong>? 
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Property
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex justify-between items-start mb-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="aspect-video bg-gray-200 rounded animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 