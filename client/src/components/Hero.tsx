import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative bg-white">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white" />

      <div className="relative px-4 sm:px-6 py-16 sm:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left side - Text content */}
            <div className="text-left space-y-8">
              {/* Top Badge - First horizontal line of F */}
              <div className="space-y-3">
                {/* Built in Canada Badge - Mobile Only */}
                <div className="md:hidden flex items-center gap-2">
                  <span className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium border border-red-100">
                    <span className="mr-2">🍁</span>
                    Built in Canada
                  </span>
                </div>

                {/* Smart Property Management Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium border border-blue-100">
                    <span className="mr-2">🏠</span>
                    Smart Property Management
                  </span>
                </div>
              </div>
              
              {/* Main Heading - Second horizontal line of F */}
              <h1 className="text-3xl sm:text-6xl md:text-7xl font-semibold leading-[1.1] tracking-tight">
                Automating 
                <span className="text-blue-600"> Residential </span> 
                <br /> Real Estate 
              </h1>

              {/* Description - Third horizontal line of F */}
              <p className="text-gray-600 text-[18px] sm:text-xl leading-relaxed max-w-xl">
                Revolutionize your rental process—
                <span className="text-blue-600 font-medium">list your property for free</span> and let our AI 
                <span className="text-blue-600 font-medium"> automate tenant screening</span>, 
                <span className="text-blue-600 font-medium"> verify quality matches</span>, and 
                <span className="text-blue-600 font-medium"> secure digital contracts</span> instantly.
              </p>

              {/* CTA Button */}
              <div className="pt-1">
                <Link href="/login">
                  <button className="group bg-red-600 text-white px-6 py-3.5 rounded-full text-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2">
                    List Your Property For Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right side - Image with decorative elements */}
            <div className="relative">
              {/* Decorative pattern */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-50 rounded-full opacity-50 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-50 rounded-full opacity-50 blur-2xl" />
              
              {/* Main image container */}
              <div className="relative w-full aspect-[4/3] rounded-3xl sm:rounded-[48px] overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt="Modern home interior"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}