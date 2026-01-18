'use client';

import { useState } from 'react';
import { X, Download, Maximize2, Minimize2 } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfPreviewModal({ isOpen, onClose }: PdfPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/leases/AI-generated-lease.pdf';
    link.download = 'AI-generated-lease.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white rounded-3xl p-8 transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 m-0 rounded-none max-w-none' 
          : 'max-w-xl w-full my-auto relative min-h-fit max-h-[90vh]'
      } overflow-y-auto`}>
        <button 
          onClick={onClose}
          className="absolute right-4 sm:right-6 top-4 sm:top-6 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-1 flex items-center justify-center gap-2">
            <h2 className="text-2xl font-semibold">Lease Agreement Preview</h2>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className={`w-full ${isFullscreen ? 'h-[85vh]' : 'h-[50vh]'} mb-6`}>
          <iframe
            src="/leases/AI-generated-lease.pdf"
            className="w-full h-full rounded-lg border border-gray-200"
            title="Lease Agreement Preview"
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
} 