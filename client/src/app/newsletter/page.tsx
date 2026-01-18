'use client';

import { useState } from 'react';
import { Download, Mail, User, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';

// Define types for the API response
interface NewsletterResponse {
  success: boolean;
  message: string;
  downloadUrl?: string;
  error?: string;
}

const getApiUrl = () => {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL || '';
  
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:4000'
    : 'https://rentcasaya-server.vercel.app';
};

export default function NewsletterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    downloadUrl?: string;
  }>({ type: null, message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await axios.post(`${getApiUrl()}/api/newsletter/subscribe`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data as NewsletterResponse;

      if (data.success) {
        setStatus({
          type: 'success',
          message: data.message,
          downloadUrl: data.downloadUrl
        });
        setFormData({ name: '', email: '' });
        
        // Automatically trigger download if downloadUrl is provided
        if (data.downloadUrl) {
          const downloadUrl = data.downloadUrl;
          setTimeout(() => {
            triggerAutoDownload(downloadUrl);
          }, 500); // Small delay to ensure status is updated
        }
      } else {
        setStatus({
          type: 'error',
          message: data.error || data.message || 'Failed to subscribe'
        });
      }
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Network error. Please try again.';
      setStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAutoDownload = async (downloadUrl: string) => {
    try {
      setStatus(prev => ({
        ...prev,
        message: prev.message + ' Downloading your report...'
      }));

      const response = await axios.get(`${getApiUrl()}${downloadUrl}`, {
        responseType: 'blob'
      });

      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'RentCasaYa.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update status to show download completed
      setTimeout(() => {
        setStatus(prev => ({
          ...prev,
          message: 'Successfully subscribed! Your report has been downloaded.'
        }));
      }, 1000);
    } catch (error) {
      console.error('Auto-download error:', error);
      setStatus({
        type: 'error',
        message: 'Subscription successful, but download failed. Please contact support.'
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-[64px]">
      
      {/* Enhanced Multi-layer Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-50/50 to-pink-50/30"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-cyan-50/40 via-transparent to-blue-100/60"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Large floating orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-gradient-to-bl from-purple-300/25 via-pink-300/20 to-indigo-300/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-gradient-to-tr from-cyan-400/20 via-blue-400/15 to-indigo-400/25 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Medium floating elements */}
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-300/30 to-indigo-300/25 rounded-full blur-2xl animate-pulse delay-300"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-gradient-to-l from-purple-300/25 to-pink-300/20 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute top-2/3 left-1/6 w-24 h-24 bg-gradient-to-br from-cyan-300/30 to-blue-300/25 rounded-full blur-xl animate-pulse delay-200"></div>
        
        {/* Geometric patterns */}
        <div className="absolute top-20 right-20 w-16 h-16 border border-blue-200/40 rotate-45 animate-spin" style={{ animationDuration: '20s' }}></div>
        <div className="absolute bottom-32 left-16 w-12 h-12 border border-purple-200/40 rotate-12 animate-spin" style={{ animationDuration: '15s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-gradient-to-r from-indigo-300/40 to-blue-300/40 rotate-45 animate-bounce" style={{ animationDelay: '1s' }}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Floating dots */}
        <div className="absolute top-1/4 left-1/5 w-2 h-2 bg-blue-400/60 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/5 w-3 h-3 bg-purple-400/50 rounded-full animate-ping delay-500"></div>
        <div className="absolute bottom-1/4 left-2/3 w-1.5 h-1.5 bg-indigo-400/70 rounded-full animate-ping delay-1000"></div>
        
        {/* Light rays effect */}
        <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-blue-300/40 to-transparent rotate-12 animate-pulse delay-300"></div>
        <div className="absolute top-0 left-1/3 w-px h-24 bg-gradient-to-b from-purple-300/30 to-transparent -rotate-12 animate-pulse delay-700"></div>
        <div className="absolute top-0 right-1/3 w-px h-28 bg-gradient-to-b from-indigo-300/35 to-transparent rotate-6 animate-pulse delay-500"></div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4 relative z-10">
        <div className="w-full max-w-7xl">
          
          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/30 relative overflow-hidden">
            
            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-0">
              
              {/* Left Column - Description */}
              <div className="p-10 sm:p-12 lg:border-r border-gray-200/50">
                
                {/* Logo/Brand Section */}
                <div className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
                    Rent in Peace
                  </h1>
                  <p className="text-xl text-gray-700 font-medium leading-relaxed">
                    Get the practical know-how you need to protect your rentals without the information overload.
                  </p>
                </div>

                {/* What You'll Receive */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">What you'll receive when you sign up:</h2>
                  
                  <div className="space-y-6">
                    {/* Mini Report */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">FREE "10 Tips to Avoid Banned Tenants" mini-report</h3>
                        <p className="text-gray-600 leading-relaxed">
                          A quick, no-fluff checklist that shows you exactly how to screen applicants, spot red flags early, and keep problem renters out of your properties.
                        </p>
                      </div>
                    </div>

                    {/* Newsletter */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Rent in Peace newsletter (weekly)</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Bite-size updates on Ontario's rental market, policy changes, and landlord best practices, plus smart tech tips from CasaYa that save you time and maximise profit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why It Matters */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Why it matters:
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Spend less time dealing with tenant headaches and more time growing a stress-free, cash-flowing portfolio. Enter your email, grab the report, and start renting in peace today.
                  </p>
                </div>

              </div>

              {/* Right Column - Signup Form */}
              <div className="p-10 sm:p-12 relative">
                
                {/* Header */}
                <div className="text-center mb-10">
                  <div className="relative inline-block mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/25">
                      <Mail className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
                    Get Started Today
                  </h2>
                  
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Enter your details below to get instant access
                  </p>
                </div>

                {/* Status Messages */}
                {status.type && (
                  <div className={`mb-8 p-5 rounded-2xl flex items-center gap-4 ${
                    status.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-200' 
                      : 'bg-red-50 text-red-800 border-2 border-red-200'
                  }`}>
                    {status.type === 'success' ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <p className="font-medium">{status.message}</p>
                  </div>
                )}

                {/* Subscription Form */}
                {status.type !== 'success' && (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Name Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 block tracking-wide">
                        FULL NAME
                      </label>
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-14 pr-5 py-5 bg-gray-50/80 border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-900 placeholder-gray-500 text-lg font-medium hover:border-gray-300"
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 block tracking-wide">
                        EMAIL ADDRESS
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-14 pr-5 py-5 bg-gray-50/80 border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-900 placeholder-gray-500 text-lg font-medium hover:border-gray-300"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:hover:shadow-2xl text-lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Getting Report...
                        </>
                      ) : (
                        <>
                          <Download className="w-6 h-6" />
                          Get Free Report
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Success State - Show completion message */}
                {status.type === 'success' && (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/25">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Thank you for subscribing! Your report download should start automatically.
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-10 pt-8 border-t border-gray-200/50">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium">
                      Secure & spam-free guaranteed
                    </p>
                  </div>
                </div>

              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
} 