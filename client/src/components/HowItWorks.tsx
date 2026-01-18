'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'landlord' | 'tenant'>('landlord');

  const landlordSteps = [
    {
      title: "List Your Property",
      description: "Create and list your property on our Marketplace with detailed information, photos, and virtual tours.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=3456&auto=format&fit=crop"
    },
    {
      title: "Tenant Applications",
      description: "Receive and manage tenant applications through our platform, with instant notifications and organized applicant tracking.",
      image: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=3000&auto=format&fit=crop"
    },
    {
      title: "Background Check & Risk Assessment",
      description: "Empower yourself with comprehensive tenant screening reports and risk analysis to make informed decisions.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=3456&auto=format&fit=crop"
    },
    {
      title: "Lease Generation & Payment Processing",
      description: "Generate lease agreements based on your terms and securely handle initial rent and deposit payments.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80"
    }
  ];

  const tenantSteps = [
    {
      title: "Find Your Ideal Property",
      description: "Browse listings with AI-powered insights on market trends, rental price predictions, and neighborhood analytics. Filter by location, amenities, and budget to make informed decisions.",
      image: "https://images.unsplash.com/photo-1507208773393-40d9fc670acf?q=80&w=3456&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      title: "Explore Virtual 360° Tours (Coming Soon)",
      description: "Experience immersive virtual walkthroughs of properties with our high-definition 360° tours, allowing you to explore every corner of your potential home from anywhere. This feature is currently in development and will be available soon.",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=3000&auto=format&fit=crop&q=80"
    },
    {
      title: "Verify Yourself & Apply",
      description: "Complete your profile verification and submit your rental application with just a few clicks. Our streamlined process makes it easy to apply to multiple properties while maintaining your privacy.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=3456&auto=format&fit=crop"
    },
    {
      title: "AI-Powered Smart Lease Generation",
      description: "Our advanced AI analyzes Canadian rental laws to generate a comprehensive, legally-compliant lease agreement tailored to your property and provincial regulations.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80"
    }
  ];

  const steps = activeTab === 'landlord' ? landlordSteps : tenantSteps;

  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600"></div>
            <span className="font-medium">Process</span>
          </div>
          <h2 className="text-4xl font-semibold">
            How It <span className="text-blue-600">Works</span>
          </h2>

          {/* Tab Switcher */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setActiveTab('landlord')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-colors ${
                activeTab === 'landlord'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              For Landlords
            </button>
            <button
              onClick={() => setActiveTab('tenant')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-colors ${
                activeTab === 'tenant'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              For Tenants
            </button>
          </div>
        </div>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <div 
              key={step.title}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } gap-12 items-center`}
            >
              {/* Image */}
              <div className="w-full lg:w-1/2">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="w-full lg:w-1/2 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-semibold">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-3xl font-semibold">{step.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 