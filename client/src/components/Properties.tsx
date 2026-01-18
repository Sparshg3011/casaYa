'use client';

import React from 'react';
import PropertyCard from './PropertyCard';
import { useProperties } from '@/context/PropertyContext';

export default function Properties() {
  const { filteredProperties } = useProperties();

  return (
    <div className="px-4 py-8 md:px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <PropertyCard 
            key={`property-${property.id || property.propertyId}`}
            property={{
              ...property,
              id: property.id || property.propertyId,
              photos: property.photos || undefined
            }} 
          />
        ))}
      </div>
    </div>
  );
}