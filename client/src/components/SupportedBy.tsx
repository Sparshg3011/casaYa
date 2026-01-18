'use client';

import React from 'react';

export default function SupportedBy() {
  const partners = [
    {
      name: 'NVIDIA Inception Program',
      logo: '/nvidia-logo.png',
      alt: 'NVIDIA Inception Program Logo'
    },
    {
      name: 'Microsoft for Startups',
      logo: '/microsoft-logo.jpg',
      alt: 'Microsoft for Startups Logo'
    },
    {
      name: 'Google for Startups',
      logo: '/google-logo.png',
      alt: 'Google for Startups Logo'
    },
    {
      name: 'University of Toronto',
      logo: '/uoft-logo.png',
      alt: 'University of Toronto Logo'
    },
    {
      name: 'Centre for Entrepreneurship',
      logo: '/entrepreneurship-logo.png',
      alt: 'Centre for Entrepreneurship Logo'
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600"></div>
            <span className="font-medium">Our Partners</span>
          </div>
          <h2 className="text-4xl font-semibold">
            Supported <span className="text-blue-600">By</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're proud to be backed by industry leaders and prestigious institutions
            that share our vision for revolutionizing the rental property market.
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center">
          {partners.map((partner) => (
            <div 
              key={partner.name}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              <div className="aspect-[3/2] relative flex items-center justify-center">
                <img
                  src={partner.logo}
                  alt={partner.alt}
                  className="max-w-full max-h-full object-contain transition-transform duration-300"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        {/* <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Trusted by leading organizations in technology and education
          </p>
        </div> */}
      </div>
    </section>
  );
} 