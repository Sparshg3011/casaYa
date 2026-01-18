'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Home, DollarSign, Crown, ChevronLeft, ChevronRight, Zap, Eye, Lightbulb, Users } from 'lucide-react';

export default function Vision() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-white" />,
      title: "Efficiency",
      description: <>We eliminate <span className="font-semibold">tedious tasks</span> so landlords can <span className="font-semibold">focus on growing their portfolios</span> and tenants can move in with <span className="font-semibold">minimal wait time</span>.</>
    },
    {
      icon: <Eye className="w-6 h-6 text-white" />,
      title: "Transparency",
      description: <>From <span className="font-semibold">clear pricing structures</span> to <span className="font-semibold">easy-to-read lease agreements</span>, our goal is to <span className="font-semibold">build trust</span> through open communication.</>
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-white" />,
      title: "Innovation",
      description: <>CasaYa is <span className="font-semibold">constantly evolving</span>. We integrate <span className="font-semibold">new technologies</span> and <span className="font-semibold">user feedback</span> to deliver an even smarter, more intuitive platform.</>
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: "Customer-Centric",
      description: <>Both <span className="font-semibold">landlords and renters</span> are at the heart of everything we do, and we're dedicated to <span className="font-semibold">streamlining every interaction</span> for a positive experience.</>
    }
  ];

  // Duplicate the features array for infinite scroll
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

      // Reset scroll position when reaching the end or beginning
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

  // Set initial scroll position
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth / 3;
    }
  }, []);

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600"></div>
              <span className="font-medium">Our Vision</span>
            </div>
            <h2 className="text-5xl font-semibold leading-tight">
              The <span className="text-blue-600">values</span> that drive<br />
              everything we do
            </h2>
            {/* Free Property Listing Promotion */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-xl shadow-lg">
              <p className="text-xl font-bold">🏠 List your property for FREE!</p>
              <p className="text-sm opacity-90">Join our growing community of Canadian landlords</p>
            </div>
            {/* <button className="bg-black text-white px-8 py-3 rounded-full text-lg hover:bg-gray-800 transition-colors">
              Learn more
            </button> */}
          </div>
          
          <div className="relative">
            {/* Mobile scroll buttons */}
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 lg:hidden bg-white/80 p-2 rounded-full shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 lg:hidden bg-white/80 p-2 rounded-full shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex lg:block overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-6 px-6 lg:mx-0 lg:px-0 gap-6"
            >
              <div className="hidden lg:block space-y-12">
                {features.map((feature, index) => (
                  <div key={feature.title} className="flex gap-6">
                    <div className="bg-blue-600 p-4 rounded-2xl h-fit shrink-0">
                      {feature.icon}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex lg:hidden gap-6">
                {duplicatedFeatures.map((feature, index) => (
                  <div 
                    key={`${feature.title}-${index}`}
                    className="flex gap-6 min-w-[85vw] snap-start"
                  >
                    <div className="bg-blue-600 p-4 rounded-2xl h-fit shrink-0">
                      {feature.icon}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 