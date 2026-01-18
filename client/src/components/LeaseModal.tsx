import React, { useState } from 'react';
import { X, FileText, Download } from 'lucide-react';

interface LeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantDetails: any;
}

export default function LeaseModal({ isOpen, onClose, tenantDetails }: LeaseModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [leaseGenerated, setLeaseGenerated] = useState(false);

  const handleGenerateLease = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setLeaseGenerated(true);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold">Generate Lease Agreement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!isGenerating && !leaseGenerated ? (
          <div className="space-y-6">
            <p className="text-gray-600">
              Generate a legally-compliant lease agreement for {tenantDetails.name}. 
              The lease will be customized based on the property details and tenant information.
            </p>
            
            <button
              onClick={handleGenerateLease}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Generate Lease Agreement
            </button>
          </div>
        ) : isGenerating ? (
          <div className="py-12 text-center">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Generating Lease...</h3>
            <p className="text-gray-600">
              Our AI is creating a customized lease agreement
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[70vh]">
            <div className="h-full bg-gray-100 rounded-xl overflow-hidden">
              <iframe
                src="/leases/AI-generated-lease.pdf"
                className="w-full h-full"
                title="Lease Preview"
              />
            </div>
            <button
              onClick={() => {/* handle download */}}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Lease Agreement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}