'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { useProperties } from '@/context/PropertyContext';

export default function SearchBar() {
  const { types, categories, bedrooms, filters, setFilters } = useProperties();
  const [showTypes, setShowTypes] = useState(false);
  const [showBedrooms, setShowBedrooms] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Close dropdowns when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTypes(false);
        setShowBedrooms(false);
        setShowCategories(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DropdownButton = ({ 
    label, 
    value, 
    onClick, 
    onClear 
  }: { 
    label: string;
    value: string | number | null;
    onClick: () => void;
    onClear: () => void;
  }) => (
    <button 
      className="flex items-center justify-between w-full px-6 py-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
      onClick={onClick}
    >
      <span className={`${value ? 'text-gray-900' : 'text-gray-500'} group-hover:text-gray-900`}>
        {value || label}
      </span>
      <div className="flex items-center gap-2">
        {value && (
          <X 
            className="w-4 h-4 text-gray-400 hover:text-gray-600" 
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          />
        )}
        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
      </div>
    </button>
  );

  const DropdownItem = ({ 
    label, 
    onClick 
  }: { 
    label: string;
    onClick: () => void;
  }) => (
    <button
      className="w-full px-6 py-2.5 text-left hover:bg-gray-50 text-gray-700 transition-colors"
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 mb-6 relative z-10" ref={dropdownRef}>
      <div className="bg-white rounded-[32px] shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center">
          {/* Types Dropdown */}
          <div className="relative">
            <DropdownButton
              label="Property Type"
              value={filters.type}
              onClick={() => {
                setShowTypes(!showTypes);
                setShowBedrooms(false);
                setShowCategories(false);
              }}
              onClear={() => setFilters(prev => ({ ...prev, type: '' }))}
            />
            
            {showTypes && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl py-2 border border-gray-100 animate-fadeIn z-50">
                <DropdownItem
                  label="All Types"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, type: '' }));
                    setShowTypes(false);
                  }}
                />
                {types.map((type) => (
                  <DropdownItem
                    key={type}
                    label={type}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, type }));
                      setShowTypes(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bedrooms Dropdown */}
          <div className="relative">
            <DropdownButton
              label="Bedrooms"
              value={filters.bedroom ? `${filters.bedroom} Bed${filters.bedroom > 1 ? 's' : ''}` : null}
              onClick={() => {
                setShowBedrooms(!showBedrooms);
                setShowTypes(false);
                setShowCategories(false);
              }}
              onClear={() => setFilters(prev => ({ ...prev, bedroom: null }))}
            />
            
            {showBedrooms && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl py-2 border border-gray-100 animate-fadeIn z-50">
                <DropdownItem
                  label="Any Bedrooms"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, bedroom: null }));
                    setShowBedrooms(false);
                  }}
                />
                {bedrooms.map((num) => (
                  <DropdownItem
                    key={num}
                    label={`${num} Bedroom${num > 1 ? 's' : ''}`}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, bedroom: num }));
                      setShowBedrooms(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Categories Dropdown */}
          <div className="relative">
            <DropdownButton
              label="Category"
              value={filters.category}
              onClick={() => {
                setShowCategories(!showCategories);
                setShowTypes(false);
                setShowBedrooms(false);
              }}
              onClear={() => setFilters(prev => ({ ...prev, category: '' }))}
            />
            
            {showCategories && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl py-2 border border-gray-100 animate-fadeIn z-50">
                <DropdownItem
                  label="All Categories"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, category: '' }));
                    setShowCategories(false);
                  }}
                />
                {categories.map((category) => (
                  <DropdownItem
                    key={category}
                    label={category}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, category }));
                      setShowCategories(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search properties"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-gray-700 placeholder-gray-500 
                  focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white pr-10 transition-all"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </button>
              )}
            </div>
            <button className="bg-blue-600 w-12 h-12 rounded-full hover:bg-blue-700 transition-colors 
              flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transform">
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}