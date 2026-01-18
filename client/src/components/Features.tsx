'use client'
import React, { useRef, useEffect, useState } from 'react';
import { Clock, Zap, Shield, Layout, Rocket, CheckCircle, Lock, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Features() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'landlord' | 'tenant'>('landlord');

  const landlordFeatures = [
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Time Savings",
      description: "CasaYa handles listing, scheduling showings, screening tenants, and more."
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "Increased Efficiency",
      description: "AI-driven automation reduces paperwork and manual follow-ups."
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Verified Tenants",
      description: "The platform conducts comprehensive background checks and screenings."
    },
    {
      icon: <Layout className="w-8 h-8 text-blue-600" />,
      title: "End-to-End Support",
      description: "From initial inquiries to rent collection, the entire leasing process is centralized in one place."
    }
  ];

  const tenantFeatures = [
    {
      icon: <Rocket className="w-8 h-8 text-blue-600" />,
      title: "Fast Application Process",
      description: "AI-enabled screening provides quicker responses and approvals."
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
      title: "Verified Landlords",
      description: "Rent with confidence knowing that all landlords are thoroughly vetted."
    },
    {
      icon: <Lock className="w-8 h-8 text-blue-600" />,
      title: "Secure Online Transactions",
      description: "Sign leases and make rent payments seamlessly through CasaYa's secure platform."
    },
    {
      icon: <Search className="w-8 h-8 text-blue-600" />,
      title: "Customizable Property Search",
      description: "Easily find properties tailored to your lifestyle—filter listings by criteria like a 30-minute public transport commute from work."
    }
  ];

  const features = activeTab === 'landlord' ? landlordFeatures : tenantFeatures;
  const duplicatedFeatures = [...features, ...features, ...features];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current && !isScrolling) {
      setIsScrolling(true);
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth;
      const newScrollLeft = container.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (container.scrollLeft === 0) {
          container.scrollTo({
            left: container.scrollWidth / 3,
            behavior: 'auto'
          });
        } else if (container.scrollLeft >= (container.scrollWidth - container.clientWidth - 10)) {
          container.scrollTo({
            left: container.scrollWidth / 3,
            behavior: 'auto'
          });
        }
        setIsScrolling(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth / 3;
    }
  }, [activeTab]);

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600"></div>
            <span className="font-medium">Features</span>
          </div>
          <h2 className="text-4xl font-semibold">
            Benefits for <span className="text-blue-600">Everyone</span>
          </h2>
          
          {/* Tab Switcher */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setActiveTab('landlord')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-colors ${
                activeTab === 'landlord'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              For Landlords
            </button>
            <button
              onClick={() => setActiveTab('tenant')}
              className={`px-6 py-3 rounded-full text-lg font-medium transition-colors ${
                activeTab === 'tenant'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              For Tenants
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-[48px] p-8 md:p-16 relative">
          {/* Mobile scroll buttons */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 md:hidden bg-white/80 p-2 rounded-full shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 md:hidden bg-white/80 p-2 rounded-full shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-12">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="bg-white p-6 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {feature.icon}
                <h3 className="text-2xl font-medium">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile Scroll */}
          <div 
            ref={scrollContainerRef}
            className="flex md:hidden gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
          >
            {duplicatedFeatures.map((feature, index) => (
              <div 
                key={`${feature.title}-${index}`}
                className="min-w-[85vw] bg-white p-6 rounded-2xl space-y-4 shadow-sm snap-start"
              >
                {feature.icon}
                <h3 className="text-2xl font-medium">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 