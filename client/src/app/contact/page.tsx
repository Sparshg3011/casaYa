'use client';

import { Calendar, ArrowRight, Users, Building, Briefcase } from 'lucide-react';

export default function ContactPage() {
  const calendarUrl = 'https://calendar.app.google/ym7MqhW2TEWTkCpD9';

  const handleBookCall = () => {
    window.open(calendarUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 mb-6 tracking-tight leading-tight">
            Transform Your{' '}
            <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
              Property Business
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
            Streamline your rental operations with CasaYa
          </p>
        </div>

        {/* Main CTA Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 md:p-12 text-center mb-12 border border-blue-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-8">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Book Your Free Consultation
          </h2>
          
          <p className="text-lg text-gray-700 mb-8 max-w-lg mx-auto">
            Book a personalized demo and see how CasaYa can streamline your rental operations. 
            Perfect for property managers, realtors, and landlords.
          </p>
          
          <p className="text-sm text-gray-600 mb-10">
            30-minute Google Meet call • No commitment required
          </p>
          
          <button
            onClick={handleBookCall}
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Calendar className="w-5 h-5" />
            Schedule Your Call
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Who We Help - Simplified */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-8">
            Perfect for Property Professionals
          </h3>
          
          <div className="flex flex-wrap justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Property Managers</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              <span>Real Estate Agents</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Landlords</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 