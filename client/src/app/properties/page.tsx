'use client';

import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import Properties from '@/components/Properties';
import { PropertyProvider } from '@/context/PropertyContext';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function PropertiesPage() {
  const [userMode, setUserMode] = useState<string | null>(null);

  useEffect(() => {
    const mode = localStorage.getItem('userMode');
    setUserMode(mode);
  }, []);

  return (
    <PropertyProvider>
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold">Properties</h1>
            {userMode === 'tenant' && (
              <Link
                href="/favorites"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <Heart className="w-5 h-5" />
                My Favorites
              </Link>
            )}
          </div>
        </div>
        <SearchBar />
        <Properties />
      </main>
    </PropertyProvider>
  );
} 