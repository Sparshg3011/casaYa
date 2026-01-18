import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle, CreditCard, Loader, FileSignature, Minimize2, Maximize2 } from 'lucide-react';

interface LeaseSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyDetails: {
    title: string;
    rent: string;
  };
  onPaymentSuccess: () => void;
}

export default function LeaseSigningModal({ isOpen, onClose, propertyDetails, onPaymentSuccess }: LeaseSigningModalProps) {
  const [currentStep, setCurrentStep] = useState<'review' | 'sign' | 'payment' | 'card' | 'processing' | 'confirmed'>('review');
  const [cardDetails, setCardDetails] = useState({
    number: '4242 4242 4242 4242',
    expiry: '12/25',
    cvc: '123',
    name: 'John Doe'
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  const handleSignLease = () => {
    setCurrentStep('sign');
  };

  const handleProceedToPayment = () => {
    setCurrentStep('payment');
  };

  const handleShowCardForm = () => {
    setCurrentStep('card');
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('processing');
    // Simulate payment processing
    setTimeout(() => {
      setCurrentStep('confirmed');
      onPaymentSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {currentStep === 'review' && (
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
        )}

        {currentStep === 'payment' && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold">Complete Payment</h2>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className={`w-full ${isFullscreen ? 'h-[85vh]' : 'h-[50vh]'} bg-gray-100 rounded-xl overflow-hidden`}>
              <iframe
                src="/leases/AI-generated-lease.pdf"
                className="w-full h-full"
                title="Lease Preview"
              />
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/leases/AI-generated-lease.pdf';
                  link.download = 'lease-agreement.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors min-w-[180px]"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={handleSignLease}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors min-w-[180px]"
              >
                <FileSignature className="w-5 h-5" />
                Sign Lease Agreement
              </button>
            </div>
          </div>
        )}

        {currentStep === 'sign' && (
          <div className="space-y-6 text-center py-8">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <CheckCircle className="w-full h-full text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lease Signed Successfully!</h3>
            <p className="text-gray-600 mb-8">
              You've successfully signed the lease agreement. The next step is to complete the payment.
            </p>
            <button
              onClick={handleProceedToPayment}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        )}

        {currentStep === 'card' && (
          <div className="space-y-6">
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={cardDetails.cvc}
                    onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Pay ${parseInt(propertyDetails.rent.replace(/[^0-9]/g, '')) * 2}
              </button>
            </form>
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="py-12 text-center">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Processing Payment...</h3>
            <p className="text-gray-600">
              Please wait while we process your payment
            </p>
          </div>
        )}

        {currentStep === 'confirmed' && (
          <div className="space-y-6 text-center py-8">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <CheckCircle className="w-full h-full text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-8">
              Your payment has been processed successfully. We've sent a confirmation email with your receipt and next steps.
              <br /><br />
              Welcome to your new home!
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {currentStep === 'payment' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>First Month's Rent</span>
                  <span>{propertyDetails.rent}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Security Deposit</span>
                  <span>{propertyDetails.rent}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total Due</span>
                  <span>${parseInt(propertyDetails.rent.replace(/[^0-9]/g, '')) * 2}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Payment Details</span>
                <span className="text-gray-500 font-medium">Visa</span>
              </div>
              
              <input
                type="text"
                placeholder="Card Number"
                className="w-full px-3 py-2 border rounded-lg"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                required
              />
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="CVC"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={cardDetails.cvc}
                  onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                  required
                />
              </div>
              
              <input
                type="text"
                placeholder="Cardholder Name"
                className="w-full px-3 py-2 border rounded-lg"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                required
              />

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Pay ${parseInt(propertyDetails.rent.replace(/[^0-9]/g, '')) * 2}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 