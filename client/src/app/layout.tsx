import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientLayout from '@/components/ClientLayout';
import { Suspense } from 'react';
import { RecoveryHandler } from '@/components/RecoveryHandler';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CasaYa',
  description: 'Automated, end‑to‑end rental platform in Ontario—verify tenants with credit, income & background checks, streamline lease signing & rent collection.',
  icons: {
    icon: [
      { url: '/logo-casaya.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo-casaya.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/logo-casaya.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RecoveryHandler />
        <Suspense fallback={<div>Loading...</div>}>
          <ClientLayout>
            <Providers>
              <div className="min-h-screen bg-white">
                <Navbar />
                {children}
                <Footer />
              </div>
            </Providers>
          </ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}