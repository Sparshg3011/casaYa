import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rentcasaya.com';

  // Define your main routes
  const routes = [
    '',
    '/properties',
    '/landlord',
    '/tenant',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // TODO: Add dynamic routes for properties
  // const properties = await fetchProperties();
  // const propertyRoutes = properties.map((property) => ({
  //   url: `${baseUrl}/properties/${property.id}`,
  //   lastModified: new Date(property.updatedAt),
  //   changeFrequency: 'daily' as const,
  //   priority: 0.9,
  // }));

  return [...routes];
} 