'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Favorite {
  id: string;
  createdAt: string;
  property: {
    id: string;
    address: string;
    price: number;
    photos: string[];
    bedrooms: number;
    bathrooms: number;
    landlord: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
}

interface FavoritesResponse {
  favorites: Favorite[];
}

interface FavoritesContextType {
  favorites: string[];
  addToFavorites: (propertyId: string) => Promise<void>;
  removeFromFavorites: (propertyId: string) => Promise<void>;
  isPropertyFavorited: (propertyId: string) => boolean;
  loading: boolean;
  error: string | null;
  initializeFavorites: (propertyIds: string[]) => void;
}

export const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  loading: false,
  error: null,
  addToFavorites: () => Promise.resolve(),
  removeFromFavorites: () => Promise.resolve(),
  isPropertyFavorited: () => false,
  initializeFavorites: () => {},
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const initializeFavorites = useCallback((propertyIds: string[]) => {
    setFavorites(propertyIds);
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await apiService.tenants.getFavorites();
      const data = response.data as FavoritesResponse;
      setFavorites(data.favorites.map(fav => fav.property.id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userMode = localStorage.getItem('userMode');
    
    if (token && userMode === 'tenant') {
      fetchFavorites();
    }
  }, []);

  const addToFavorites = async (propertyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userMode = localStorage.getItem('userMode');

      if (!token) {
        router.push('/login');
        return;
      }

      if (userMode !== 'tenant') {
        setError('Only tenants can add properties to favorites');
        return;
      }

      setLoading(true);
      await apiService.tenants.addToFavorites(propertyId);
      setFavorites(prev => {
        if (!prev.includes(propertyId)) {
          return [...prev, propertyId];
        }
        return prev;
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      setError('Failed to add to favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (propertyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userMode = localStorage.getItem('userMode');

      if (!token) {
        router.push('/login');
        return;
      }

      if (userMode !== 'tenant') {
        setError('Only tenants can remove properties from favorites');
        return;
      }

      setLoading(true);
      await apiService.tenants.removeFromFavorites(propertyId);
      setFavorites(prev => prev.filter(id => id !== propertyId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
      setError('Failed to remove from favorites');
    } finally {
      setLoading(false);
    }
  };

  const isPropertyFavorited = useCallback(
    (propertyId: string) => favorites.includes(propertyId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        error,
        addToFavorites,
        removeFromFavorites,
        isPropertyFavorited,
        initializeFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
} 