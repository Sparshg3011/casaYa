'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import apiService from '@/lib/api';
import type { PropertyData, PropertyResponse } from '@/lib/api';
import { Info, Mail, Lock, Loader, Home, User as UserIcon, MapPin, Building, Calendar, DollarSign, Ruler, BedDouble, Bath, Thermometer, WashingMachine } from 'lucide-react';

const PROPERTY_TYPES = ['House', 'Apartment', 'Condo', 'Villa'];
const HEATING_AC_OPTIONS = ['Heating Only', 'AC Only', 'Both', 'None'];
const LAUNDRY_OPTIONS = ['In-Unit', 'Shared', 'None'];

const libraries: ("places")[] = ["places"];

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });
  const [formData, setFormData] = useState<PropertyData>({
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    price: 0,
    propertyType: 'House',
    style: 'Detached',
    floorNumber: undefined,
    unitNumber: '',
    availableDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
    totalSquareFeet: undefined,
    bedrooms: 1,
    bathrooms: 1,
    roomDetails: {},
    hasParking: false,
    parkingSpaces: undefined,
    heatingAndAC: 'Both',
    laundryType: 'In-Unit',
    hasMicrowave: false,
    hasRefrigerator: false,
    isPetFriendly: false,
    hasBasement: false,
    description: '',
    lat: 0,
    lng: 0,
  });

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.3,            // Reduce to 300KB per image
      maxWidthOrHeight: 1024,    // Further reduce max dimension
      useWebWorker: true,
      initialQuality: 0.6,       // Start with 60% quality
      alwaysKeepResolution: false,
      fileType: 'image/jpeg',    // Convert all images to JPEG for better compression
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      // Use .jpg extension for consistency
      const fileName = file.name.replace(/\.[^/.]+$/, "") + '.jpg';
      return new File([compressedFile], fileName, { type: 'image/jpeg' });
    } catch (err) {
      console.error('Error compressing image:', err);
      return file;
    }
  };

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      if (fileList.length > 10) {
        setError('Maximum 10 photos allowed');
        return;
      }

      setLoading(true);
      try {
        // Compress all images in parallel
        const compressedFiles = await Promise.all(
          fileList.map(file => compressImage(file))
        );
        setPhotos(compressedFiles);
      } catch (err) {
        console.error('Error processing images:', err);
        setError('Error processing images. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, []);

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
          lat: place.geometry?.location?.lat?.() || 0,
          lng: place.geometry?.location?.lng?.() || 0,
        }));
      }
    }
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Debug logging
    console.log('Form submission - Property Type:', formData.propertyType);
    console.log('Form submission - Unit Number:', formData.unitNumber);
    console.log('Full form data:', formData);

    // Validate address fields
    if (!formData.address?.trim()) {
      setError('Street address is required');
      setLoading(false);
      return;
    }

    if (!formData.city?.trim() || !formData.state?.trim() || !formData.postalCode?.trim() || !formData.country?.trim()) {
      setError('All address fields (street address, city, state/province, postal code, and country) are required');
      setLoading(false);
      return;
    }

    // Validate unit number for apartments and condos
    if (['Apartment', 'Condo'].includes(formData.propertyType)) {
      const unitNumber = formData.unitNumber?.trim();
      console.log('Validating unit number:', unitNumber);
      
      if (!unitNumber) {
        console.log('Unit number validation failed - empty or undefined');
        setError('Unit number is required for apartments and condos');
        setLoading(false);
        return;
      }

      // Create a new object to ensure we're not mutating the original state
      const updatedFormData = {
        ...formData,
        unitNumber: unitNumber
      };
      console.log('Updated form data:', updatedFormData);

      try {
        console.log('Sending request with data:', updatedFormData);
        const { data } = await apiService.landlord.addProperty(updatedFormData);
        const propertyId = data.id;

        // Then, if there are photos, upload them
        if (photos.length > 0) {
          const formData = new FormData();
          photos.forEach(photo => {
            formData.append('photos', photo);
          });
          
          await apiService.landlord.uploadPropertyPhotos(propertyId, formData);
        }

        router.push('/properties');
      } catch (err: any) {
        console.error('Error creating property:', err.response?.data || err);
        setError(err.response?.data?.error || err.message || 'Failed to create property');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // For non-apartment/condo properties
      const { data } = await apiService.landlord.addProperty(formData);
      const propertyId = data.id;

      // Then, if there are photos, upload them
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => {
          formData.append('photos', photo);
        });
        
        await apiService.landlord.uploadPropertyPhotos(propertyId, formData);
      }

      router.push('/properties');
    } catch (err: any) {
      console.error('Error creating property:', err.response?.data || err);
      setError(err.response?.data?.error || err.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <style jsx global>{`
        /* Remove spinners from number inputs */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 pt-2">
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
      
      {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Location</h2>
              <p className="text-sm text-gray-500 mt-1">All address fields are required</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={onLoad}
                        onPlaceChanged={handlePlaceSelect}
                        restrictions={{ country: "ca" }}
                      >
                        <input
                          type="text"
                          required
                          placeholder="Enter your address"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Loading Google Places..."
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Property Details Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Property Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Home className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      required
                      value={formData.propertyType}
                      onChange={e => {
                        const newType = e.target.value;
                        console.log('Property type changing to:', newType);
                        setFormData(prev => {
                          const newData = {
                            ...prev,
                            propertyType: newType,
                          };
                          
                          if (['Apartment', 'Condo'].includes(newType)) {
                            // Keep existing values if switching between Apartment and Condo
                            if (['Apartment', 'Condo'].includes(prev.propertyType)) {
                              console.log('Keeping existing unit number:', prev.unitNumber);
                              return newData;
                            }
                            // Initialize values for new Apartment/Condo selection
                            console.log('Initializing new unit number');
                            return {
                              ...newData,
                              floorNumber: 0,
                              unitNumber: '',
                            };
                          } else {
                            // Reset values when switching to non-Apartment/Condo
                            console.log('Resetting unit number');
                            return {
                              ...newData,
                              floorNumber: undefined,
                              unitNumber: '',
                            };
                          }
                        });
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      {PROPERTY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(formData.propertyType === 'Apartment' || formData.propertyType === 'Condo') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.floorNumber || ''}
                          onChange={e => {
                            const value = Number(e.target.value);
                            if (value >= 0) {
                              setFormData(prev => ({ ...prev, floorNumber: value }));
                            }
                          }}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.unitNumber}
                          onChange={e => {
                            const value = e.target.value;
                            console.log('Unit number changed to:', value);
                            setFormData(prev => ({ ...prev, unitNumber: value }));
                          }}
                          onBlur={e => {
                            const value = e.target.value.trim();
                            if (value === '') {
                              setError('Unit number cannot be empty');
                              return;
                            }
                            setFormData(prev => ({ ...prev, unitNumber: value }));
                          }}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          placeholder="Enter unit number"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      required
                      value={formData.availableDate.split('T')[0]}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        availableDate: e.target.value + 'T00:00:00.000Z'
                      }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Square Feet</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Ruler className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.totalSquareFeet || ''}
                      onChange={e => {
                        const value = Number(e.target.value);
                        if (value >= 0) {
                          setFormData(prev => ({ ...prev, totalSquareFeet: value }));
                        }
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      required
                      min="400"
                      value={formData.price || ''}
                      onChange={e => {
                        const value = e.target.value;
                        setFormData(prev => ({ 
                          ...prev, 
                          price: value === '' ? 0 : Number(value)
                        }));
                      }}
                      onBlur={e => {
                        const value = Number(e.target.value);
                        if (!value || value < 400) {
                          setFormData(prev => ({ ...prev, price: 400 }));
                        }
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Enter price (min. $400)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Rooms & Features Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Rooms & Features</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BedDouble className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.bedrooms}
                      onChange={e => {
                        const value = Number(e.target.value);
                        if (value >= 1) {
                          setFormData(prev => ({ ...prev, bedrooms: value }));
                        }
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Bath className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      required
                      min="0.5"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={e => {
                        const value = Number(e.target.value);
                        if (value >= 0.5 && value % 0.5 === 0) {
                          setFormData(prev => ({ ...prev, bathrooms: value }));
                        }
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heating & AC</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Thermometer className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      required
                      value={formData.heatingAndAC}
                      onChange={e => setFormData(prev => ({ ...prev, heatingAndAC: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      {HEATING_AC_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Laundry</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <WashingMachine className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      required
                      value={formData.laundryType}
                      onChange={e => setFormData(prev => ({ ...prev, laundryType: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      {LAUNDRY_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasParking"
                      checked={formData.hasParking}
                      onChange={e => setFormData(prev => ({ ...prev, hasParking: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasParking" className="ml-2 text-sm text-gray-700">
                      Has Parking
                    </label>
                  </div>
                  {formData.hasParking && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parking Spaces</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.parkingSpaces || ''}
                          onChange={e => {
                            const value = Number(e.target.value);
                            if (value >= 1) {
                              setFormData(prev => ({ ...prev, parkingSpaces: value }));
                            }
                          }}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasMicrowave"
                      checked={formData.hasMicrowave}
                      onChange={e => setFormData(prev => ({ ...prev, hasMicrowave: e.target.checked }))}
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
                      checked={formData.hasRefrigerator}
                      onChange={e => setFormData(prev => ({ ...prev, hasRefrigerator: e.target.checked }))}
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
                      checked={formData.isPetFriendly}
                      onChange={e => setFormData(prev => ({ ...prev, isPetFriendly: e.target.checked }))}
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
                        checked={formData.hasBasement}
                        onChange={e => setFormData(prev => ({ ...prev, hasBasement: e.target.checked }))}
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
          </section>

          {/* Description Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Description</h2>
            </div>
            <div className="p-6">
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={4}
                placeholder="Describe your property..."
              />
            </div>
          </section>

          {/* Photos Section */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Photos</h2>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="photos" className="block text-sm font-medium">
                    Property Photos
                  </label>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-blue-600 cursor-help" />
                    <span className="invisible group-hover:visible absolute left-6 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      Please take updated images of the property
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  id="photos"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="w-full"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {loading && <p className="text-gray-500 text-sm">Processing images...</p>}
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 