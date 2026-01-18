'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type NavbarEventDetail } from '@/lib/events';
import useUserMode from '@/hooks/useUserMode';
import apiService from '@/lib/api';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { userMode, isLoading } = useUserMode();

  // Check auth status on mount and when pathname or userMode changes
  useEffect(() => {
    function checkAuth() {
      try {
        const token = localStorage.getItem('token');
        const storedUserMode = localStorage.getItem('userMode');
        console.log('Auth Check:', { token: !!token, userMode: storedUserMode });
        setIsLoggedIn(!!token && !!storedUserMode);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoggedIn(false);
      }
    }
    checkAuth();

    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'userMode') {
        setIsLoggedIn(!!localStorage.getItem('token') && !!localStorage.getItem('userMode'));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname, userMode]); // Add userMode as a dependency

  const handleAuthAction = async () => {
    if (isLoggedIn) {
      try {
        await apiService.auth.logout();
        // Clear all auth-related data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('supabaseId');
        localStorage.removeItem('userMode');
        setIsLoggedIn(false);
        router.push('/');
      } catch (error) {
        console.error('Error logging out:', error);
        // Even if the server request fails, clear local storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('supabaseId');
        localStorage.removeItem('userMode');
        setIsLoggedIn(false);
        router.push('/');
      }
    } else {
      router.push('/login');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Move loading check here, after all hooks
  if (isLoading) {
    return <div className="h-16 bg-white shadow-sm"></div>;
  }

  // Get current page name
  const getCurrentPageName = () => {
    if (pathname === '/') return 'Home';
    if (pathname === '/about') return 'About';
    if (pathname === '/pricing') return 'Pricing';
    if (pathname === '/process') return 'Process';
    if (pathname === '/contact') return 'Contact';
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/profile') return 'Profile';
    if (pathname === '/properties') return 'Properties';
    if (pathname.startsWith('/properties/')) return 'Property';
    return 'Menu';
  };

  // Add property page check
  const isPropertyPage = pathname.startsWith('/properties/');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="px-4 py-3 flex items-center max-w-7xl mx-auto relative">
        {/* Logo */}
        <div className="w-[180px]">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-casaya.png" alt="CasaYa Logo" className="h-7 w-auto" />
            <span className="text-2xl font-semibold">CasaYa</span>
          </Link>
        </div>
        
        {/* Desktop Menu - centered */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="hover:text-blue-600 transition-colors whitespace-nowrap">Home</Link>
            <Link href="/properties" className="hover:text-blue-600 transition-colors whitespace-nowrap">Properties</Link>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors whitespace-nowrap">Pricing</Link>
            <Link href="/process" className="hover:text-blue-600 transition-colors whitespace-nowrap">Process</Link>
            <Link href="/about" className="hover:text-blue-600 transition-colors whitespace-nowrap">About</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors whitespace-nowrap">Contact</Link>
            {isLoggedIn && (
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors whitespace-nowrap">
                Dashboard
              </Link>
            )}
            {isLoggedIn && (
              <Link href="/profile" className="hover:text-blue-600 transition-colors whitespace-nowrap">
                Profile
              </Link>
            )}
          </div>
        </div>

        {/* Right side buttons */}
        <div className="w-[180px] flex items-center justify-end gap-3">
          {!isLoggedIn && (
            <div className="hidden md:flex bg-white text-red-600 border border-red-100 px-4 sm:px-6 py-2 rounded-full font-semibold shadow-sm hover:bg-red-50 transition-colors whitespace-nowrap text-sm sm:text-base items-center">
              <span className="mr-1">🍁</span>
              Built in Canada
            </div>
          )}
          <button 
            onClick={handleAuthAction} 
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden relative" ref={menuRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex items-center gap-2 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-lg whitespace-nowrap"
          >
            {getCurrentPageName()}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white shadow-lg rounded-lg py-2 z-50
                           animate-in fade-in slide-in-from-top-2 duration-200">
              <Link href="/" className="px-4 py-2 hover:bg-blue-50 transition-colors text-gray-700
                           hover:text-blue-600 flex items-center whitespace-nowrap"
                  onClick={() => setIsOpen(false)}>
                Home
              </Link>
              <Link href="/properties" className="px-4 py-2 hover:bg-blue-50 transition-colors text-gray-700
                              hover:text-blue-600 flex items-center whitespace-nowrap"
                  onClick={() => setIsOpen(false)}>
                Properties
              </Link>
              <Link href="/pricing" className="px-4 py-2 hover:bg-blue-50 transition-colors text-gray-700
                         hover:text-blue-600 flex items-center whitespace-nowrap"
                  onClick={() => setIsOpen(false)}>
                Pricing
              </Link>
              <Link href="/process" className="px-4 py-2 hover:bg-blue-50 transition-colors text-gray-700
                         hover:text-blue-600 flex items-center whitespace-nowrap"
                  onClick={() => setIsOpen(false)}>
                Process
              </Link>
              <Link href="/about" className="px-4 py-2 hover:bg-blue-50 transition-colors text-gray-700
                         hover:text-blue-600 flex items-center whitespace-nowrap"
                  onClick={() => setIsOpen(false)}>
                About
              </Link>
              <Link href="/contact" className="px-4 py-2 hover:bg-blue-50 transition-colors text-gray-700
                         hover:text-blue-600 flex items-center whitespace-nowrap"
                  onClick={() => setIsOpen(false)}>
                Contact
              </Link>
              {isLoggedIn && (
                <>
                  <Link href="/dashboard" className="px-4 py-2 hover:bg-blue-50 transition-colors text-gray-700
                           hover:text-blue-600 flex items-center whitespace-nowrap"
                      onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/profile" className="px-4 py-2 hover:bg-blue-50 transition-colors text-gray-700
                           hover:text-blue-600 flex items-center whitespace-nowrap"
                      onClick={() => setIsOpen(false)}>
                    Profile
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}