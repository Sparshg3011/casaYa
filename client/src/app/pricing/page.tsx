import React from 'react';
import { CheckCircle, Phone } from 'lucide-react';

const PricingPage = () => {
  const plans = [
    {
      name: 'Tenant',
      price: 'Free',
      description: 'Perfect for renters looking for their next home',
      features: [
        'Browse only verified rentals',
        'Fill out one application and reuse it anytime',
        'Instant "yes/no" pre-qualification',
        'Sign your lease online, on any device',
        'Pay rent online with reminders',
        'Chat with your landlord and send maintenance requests in-app'
      ],
      buttonText: 'Create Tenant Account',
      buttonLink: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ29Z577M706_d338sPXIwBXa-zzKuyemmsDD1a3FlkoG-wfvA9s3a8iZDJXOebP74C_c5nZUnzR',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      popular: false
    },
    {
      name: 'Landlord',
      price: 'CA $20',
      period: '/ month',
      description: 'Everything tenants get plus professional landlord tools',
      features: [
        'Everything tenants get plus:',
        'Post unlimited listings; CasaYa pushes them to major sites',
        'AI handles inquiries and books showings for you',
        'Built-in screening: credit, income & background checks',
        'Auto-create leases and capture e-signatures',
        'Collect rent online, set late-fee rules, direct deposit to your bank',
        'Track maintenance tickets and chat with tenants in one place',
        'Email & chat support (24-hour response)'
      ],
      buttonText: 'Subscribe Now',
      buttonLink: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ29Z577M706_d338sPXIwBXa-zzKuyemmsDD1a3FlkoG-wfvA9s3a8iZDJXOebP74C_c5nZUnzR',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Advanced features for large portfolios and property management companies',
      features: [
        'Everything in Landlord plus:',
        'Volume discounts for large portfolios',
        'Company dashboard with roles & permissions (SSO support)',
        'API and native links to Yardi, AppFolio, Buildium, Zapier, and more',
        'White-label tenant portal with your branding',
        'Advanced analytics, rent-increase and renewal tools',
        'Dedicated Customer Success Manager & priority phone/chat support',
        'Data migration and white-glove onboarding'
      ],
      buttonText: 'Book a Call',
      buttonLink: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ29Z577M706_d338sPXIwBXa-zzKuyemmsDD1a3FlkoG-wfvA9s3a8iZDJXOebP74C_c5nZUnzR',
      buttonColor: 'bg-blue-700 hover:bg-blue-800',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whether you're a tenant, landlord, or enterprise, we have the perfect plan for your needs
          </p>
        </div>

        {        /* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg p-8 flex flex-col h-full ${
                plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {plan.price}
                  {plan.period && <span className="text-lg text-gray-500">{plan.period}</span>}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <div className="mb-8 flex-grow">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
                      <span className={`text-gray-700 ${
                        feature.includes('Everything') ? 'font-semibold' : ''
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center mt-auto">
                <a
                  href={plan.buttonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${plan.buttonColor} transition-colors duration-200`}
                >
                  {plan.buttonText}
                </a>
              </div>
            </div>
          ))}
        </div>



        {/* Contact Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Have Questions?
          </h2>
          <p className="text-gray-600 mb-8">
            Our team is here to help you choose the right plan for your needs
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            <Phone className="h-5 w-5 mr-2" />
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 