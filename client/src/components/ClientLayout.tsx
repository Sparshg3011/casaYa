'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Force reload if the reload parameter is present
    if (searchParams.get('reload')) {
      window.location.href = '/';
    }
  }, [searchParams]);

  return <>{children}</>;
} 