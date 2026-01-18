import React from 'react';
import { Twitter, Linkedin, Instagram, Facebook, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <h2 className="text-4xl font-semibold leading-tight">
              CasaYa
            </h2>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/rentcasaya?igsh=NTc4MTIwNjQ2YQ==" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://www.linkedin.com/company/casaya/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="https://x.com/RentCasaYa" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="https://www.facebook.com/61572377882292" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-gray-600">
              <li><Link href="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
              <li><Link href="/process" className="hover:text-blue-600 transition-colors">Our Process</Link></li>
              <li><Link href="/properties" className="hover:text-blue-600 transition-colors">Properties</Link></li>
              <li><Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link href="/newsletter" className="hover:text-blue-600 transition-colors">Newsletter</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Features</h3>
            <ul className="space-y-3 text-gray-600">
              <li><Link href="/process#virtual-tours" className="hover:text-blue-600 transition-colors">Virtual Tours</Link></li>
              <li><Link href="/process#smart-contracts" className="hover:text-blue-600 transition-colors">Smart Contracts</Link></li>
              <li><Link href="/process#market-insights" className="hover:text-blue-600 transition-colors">Market Insights</Link></li>
              <li><Link href="/support" className="hover:text-blue-600 transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <a href="tel:+16476078580" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  (647) 607-8580
                </a>
              </li>
              <li>
                <a href="mailto:Info@rentcasaya.com" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Info@rentcasaya.com
                </a>
              </li>
              <li>
                <a href="mailto:Support@rentcasaya.com" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Support@rentcasaya.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-gray-600">
          <p>Copyright ©2024 CasaYa. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link href="/" className="hover:text-blue-600 transition-colors">CasaYa</Link>
            <span>•</span>
            <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}