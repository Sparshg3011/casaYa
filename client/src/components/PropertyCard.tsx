'use client';

import React from 'react';
import Image from 'next/image';
import { Bed, Bath, Home, Heart } from 'lucide-react';
import Link from 'next/link';
import { useFavorites } from '@/context/FavoritesContext';
import { getImageUrl } from '@/utils/image';

interface PropertyCardProps {
  property: {
    id?: string;
    propertyId?: string;
    address: string;
    price: number;
    bedrooms: number;
    bathrooms?: number;
    photos?: string[];
    type?: string;
    isLeased?: boolean;
  };
}

const PropertyCard = React.memo(({ property }: PropertyCardProps) => {
  const propertyId = property.id || property.propertyId;
  const { address, price, bedrooms, bathrooms, photos, type } = property;
  const { addToFavorites, removeFromFavorites, isPropertyFavorited, loading } = useFavorites();
  const [userMode, setUserMode] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Get the user mode from localStorage
    const mode = localStorage.getItem('userMode');
    setUserMode(mode);
  }, []);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    if (!propertyId) return; // Guard against undefined propertyId
    if (isPropertyFavorited(propertyId)) {
      await removeFromFavorites(propertyId);
    } else {
      await addToFavorites(propertyId);
    }
  };
  
  if (!propertyId) return null; // Don't render if no valid ID

  return (
    <Link href={`/properties/${propertyId}`} className="block h-full">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow h-[250px] flex flex-col">
        <div className="relative h-36 w-full flex-shrink-0">
          <Image
            src={photos && photos[0] ? getImageUrl(photos[0]) : '/sample-house.jpg'}
            alt={address}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          {userMode === 'tenant' && (
            <button
              onClick={handleFavoriteClick}
              disabled={loading}
              className={`absolute top-2 right-2 p-2 rounded-full ${
                isPropertyFavorited(propertyId)
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              } transition-colors`}
            >
              <Heart
                className={`w-4 h-4 ${isPropertyFavorited(propertyId) ? 'fill-current' : ''}`}
              />
            </button>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-semibold text-base mb-1 line-clamp-1">{address}</h3>
          <div className="flex items-center gap-4 text-gray-600 mb-1">
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span className="text-sm">{bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span className="text-sm">{bathrooms?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
          <div className="mt-auto">
            <span className="font-bold text-lg text-blue-600">${price.toLocaleString()}/mo</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default PropertyCard;