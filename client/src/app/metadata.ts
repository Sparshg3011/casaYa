export const defaultMetadata = {
  title: {
    default: 'RentCasaYa - Smart Property Rental Platform for Verified Tenants',
    template: '%s | RentCasaYa'
  },
  description: 'RentCasaYa helps landlords lease properties faster with verified tenants. Automated credit checks, income verification, and background checks. Free listings, pay only when you close.',
  keywords: [
    'property rental',
    'Ontario rental',
    'Ontario Landlords',
    'Verify Tenants Ontario',
    'Credit Check Ontario',
    'Background Check Ontario',
    'Rent Collection Ontario',
    'Lease Signing Ontario',
    'tenant verification Ontario',
    'automated tenant screening',
    'landlord tenant matching',
    'risk-free tenant sourcing',
    'verify tenant credit score',
    'tenant background verification',
    'income verification for tenants',
    'automated rental verification',
    'paperless lease signing',
    'free rental listing Ontario',
    'tenant screening service',
    'landlord tools',
    'rental application',
    'property management',
    'AI rental matching',
    'digital lease contracts'
  ],
  authors: [{ name: 'CasaYa Team' }],
  creator: 'CasaYa',
  publisher: 'CasaYa',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://rentcasaya.com',
    siteName: 'RentCasaYa',
    title: 'RentCasaYa - Automated Tenant Verification Platform',
    description: 'Find verified tenants with automated credit checks, income verification, and background checks. List properties for free, pay only when you close.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RentCasaYa - Smart Property Rental Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentCasaYa - Automated Tenant Verification Platform',
    description: 'Find verified tenants with automated credit checks, income verification, and background checks. List properties for free, pay only when you close.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '-2oN7vY89OjqKz1kDs4uYKbT9Re0JSRm4GScqqVDFeA',
  },
};

export const generateMetadata = (
  title?: string,
  description?: string,
  imageUrl?: string
) => {
  return {
    ...defaultMetadata,
    ...(title && {
      title,
      openGraph: {
        ...defaultMetadata.openGraph,
        title,
      },
      twitter: {
        ...defaultMetadata.twitter,
        title,
      },
    }),
    ...(description && {
      description,
      openGraph: {
        ...defaultMetadata.openGraph,
        description,
      },
      twitter: {
        ...defaultMetadata.twitter,
        description,
      },
    }),
    ...(imageUrl && {
      openGraph: {
        ...defaultMetadata.openGraph,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title || defaultMetadata.title.default,
          },
        ],
      },
      twitter: {
        ...defaultMetadata.twitter,
        images: [imageUrl],
      },
    }),
  };
}; 