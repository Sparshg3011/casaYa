'use client';

import { useContext } from 'react';
import { FavoritesContext } from '@/context/FavoritesContext';

export default function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return {
    favorites: context.favorites,
    loading: context.loading,
    error: context.error,
    addToFavorites: context.addToFavorites,
    removeFromFavorites: context.removeFromFavorites,
    isPropertyFavorited: context.isPropertyFavorited,
    initializeFavorites: context.initializeFavorites,
  };
} 