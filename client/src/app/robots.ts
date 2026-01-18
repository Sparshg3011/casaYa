import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/private/',
        '/*?*', // Disallow URLs with query parameters
      ],
    },
    sitemap: 'https://rentcasaya.com/sitemap.xml',
  };
} 