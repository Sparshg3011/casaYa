'use client';

import { PropertyProvider } from '@/context/PropertyContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ToastProvider } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PropertyProvider>
        <FavoritesProvider>
          {children}
        </FavoritesProvider>
      </PropertyProvider>
    </ToastProvider>
  );
} 