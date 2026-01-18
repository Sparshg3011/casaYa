'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyCard from '@/components/PropertyCard';
import apiService from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFavorites } from '@/context/FavoritesContext';

interface Property {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  photos: string[];
  landlord: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface FavoriteProperty {
  id: string;
  createdAt: string;
  property: Property;
}

interface FavoritesResponse {
  favorites: FavoriteProperty[];
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { favorites: favoritedIds } = useFavorites();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await apiService.tenants.getFavorites();
        const data = response.data as { favorites: FavoriteProperty[] };
        if (data?.favorites) {
          setFavorites(data.favorites);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setError('Failed to fetch favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [router, favoritedIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Error Loading Favorites</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Button */}
      <Link 
        href="/properties" 
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Properties
      </Link>

      {/* Header */}
      <div className="mb-8 mt-1">
        <h1 className="text-3xl font-bold">My Favorite Properties</h1>
        <p className="text-gray-600 mt-2">
          {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
        </p>
      </div>

      {/* Favorites Grid */}
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">You haven't saved any properties yet.</p>
          <Link 
            href="/properties"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <PropertyCard 
              key={favorite.id} 
              property={favorite.property}
            />
          ))}
        </div>
      )}
    </div>
  );
} 