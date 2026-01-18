'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '@/lib/api';
import type { PropertyResponse } from '@/lib/api';

// Update the interface at the top of the file
interface ExtendedPropertyResponse {
  id: string;
  propertyId?: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  photos: string[] | null;
  type: string;
  category?: string;
  isLeased: boolean;
  description: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  availableDate: string;
  totalSquareFeet: number | null;
  hasParking: boolean;
  parkingSpaces: number | null;
  heatingAndAC: string;
  laundryType: string;
  hasMicrowave: boolean;
  hasRefrigerator: boolean;
  isPetFriendly: boolean;
  hasBasement: boolean | null;
  landlord: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface PropertyContextType {
  properties: ExtendedPropertyResponse[];
  filteredProperties: ExtendedPropertyResponse[];
  loading: boolean;
  error: string | null;
  types: string[];
  categories: string[];
  bedrooms: number[];
  filters: {
    type: string;
    bedroom: number | null;
    category: string;
    search: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    type: string;
    bedroom: number | null;
    category: string;
    search: string;
  }>>;
  setFilteredProperties: (properties: ExtendedPropertyResponse[]) => void;
  fetchProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const initialFilters = {
    type: '',
    bedroom: null as number | null,
    category: '',
    search: ''
  };

  const [filters, setFilters] = useState(initialFilters);
  const [properties, setProperties] = useState<ExtendedPropertyResponse[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<ExtendedPropertyResponse[]>([]);
  const [types] = useState<string[]>(['House', 'Villa', 'Apartment', 'Condo']);
  const [categories] = useState<string[]>(['Luxury', 'Modern', 'Traditional', 'Contemporary']);
  const [bedrooms] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      const response = await apiService.properties.getAll();
      
      let propertiesToSet: ExtendedPropertyResponse[] = [];
      
      if (Array.isArray(response.data)) {
        propertiesToSet = response.data.map((p: any) => ({
          id: p.id || p.propertyId,
          address: p.address,
          price: p.price,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          photos: p.photos || null,
          type: p.propertyType,
          category: '',
          isLeased: false,
          description: p.description || '',
          city: p.city,
          state: p.state,
          postalCode: p.postalCode,
          country: p.country,
          availableDate: p.availableDate,
          totalSquareFeet: p.totalSquareFeet,
          hasParking: p.hasParking,
          parkingSpaces: p.parkingSpaces,
          heatingAndAC: p.heatingAndAC,
          laundryType: p.laundryType,
          hasMicrowave: p.hasMicrowave,
          hasRefrigerator: p.hasRefrigerator,
          isPetFriendly: p.isPetFriendly,
          hasBasement: p.hasBasement,
          landlord: p.landlord
        }));
      } else if (response.data && typeof response.data === 'object' && 'properties' in response.data) {
        const properties = (response.data as { properties: any[] }).properties;
        propertiesToSet = properties.map((p: any) => ({
          id: p.id || p.propertyId,
          address: p.address,
          price: p.price,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          photos: p.photos || null,
          type: p.propertyType,
          category: '',
          isLeased: false,
          description: p.description || '',
          city: p.city,
          state: p.state,
          postalCode: p.postalCode,
          country: p.country,
          availableDate: p.availableDate,
          totalSquareFeet: p.totalSquareFeet,
          hasParking: p.hasParking,
          parkingSpaces: p.parkingSpaces,
          heatingAndAC: p.heatingAndAC,
          laundryType: p.laundryType,
          hasMicrowave: p.hasMicrowave,
          hasRefrigerator: p.hasRefrigerator,
          isPetFriendly: p.isPetFriendly,
          hasBasement: p.hasBasement,
          landlord: p.landlord
        }));
      }

      setProperties(propertiesToSet);
      setFilteredProperties(propertiesToSet);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setFilteredProperties([]);
      setError(error.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Filter properties based on filters
  useEffect(() => {
    let result = [...properties];

    if (filters.type) {
      result = result.filter(property => property.type === filters.type);
    }

    if (filters.bedroom) {
      result = result.filter(property => property.bedrooms === filters.bedroom);
    }

    if (filters.category) {
      result = result.filter(property => property.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(property =>
        property.address.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProperties(result);
  }, [filters, properties]);

  return (
    <PropertyContext.Provider value={{
      properties,
      filteredProperties,
      loading,
      error,
      types,
      categories,
      bedrooms,
      filters,
      setFilters,
      setFilteredProperties,
      fetchProperties
    }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertyProvider');
  }
  return context;
} 