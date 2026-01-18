export const generatePropertyJsonLd = (property: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `https://rentcasaya.com/properties/${property.id}`,
    datePosted: property.createdAt,
    image: property.images?.[0],
    price: {
      '@type': 'MonetaryAmount',
      currency: 'CAD',
      value: property.price,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.province,
      postalCode: property.postalCode,
      addressCountry: 'CA',
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.squareFeet,
      unitCode: 'FTK',
    },
  };
};

export const generateOrganizationJsonLd = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RentCasaYa',
    url: 'https://rentcasaya.com',
    logo: 'https://rentcasaya.com/logo.png',
    sameAs: [
      'https://facebook.com/rentcasaya',
      'https://twitter.com/rentcasaya',
      'https://linkedin.com/company/rentcasaya',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-XXX-XXX-XXXX',
      contactType: 'customer service',
      availableLanguage: ['English', 'French'],
    },
  };
}; 