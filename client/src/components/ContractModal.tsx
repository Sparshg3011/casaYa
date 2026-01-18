import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Upload, File, Info, Check, Maximize2, Minimize2, CheckCircle, Download, Edit3 } from 'lucide-react';
import useUserMode from '@/hooks/useUserMode';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyDetails: {
    title: string;
    location: string;
    price: number;
  };
  onContractGenerated: () => void;
  initialStep?: 'upload' | 'generating' | 'preview' | 'submitted';
  preUploadedDocs?: boolean;
  mode?: 'tenant' | 'landlord';
  source?: 'property' | 'dashboard';
}

export default function ContractModal({ isOpen, onClose, propertyDetails, onContractGenerated, initialStep = 'upload', preUploadedDocs = false, mode = 'tenant', source = 'property' }: ContractModalProps) {
  const { userMode, isLoading } = useUserMode();
  const [step, setStep] = useState<'upload' | 'generating' | 'preview' | 'submitted'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const fileListRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [otherState, setOtherState] = useState(null);

  React.useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setFiles([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (fileListRef.current) {
      fileListRef.current.scrollTop = fileListRef.current.scrollHeight;
    }
  }, [files]);

  useEffect(() => {
    if (preUploadedDocs && files.length === 0) {
      setFiles([
        new (window.File as any)([new Blob([""])], "tenant_id.pdf", { type: "application/pdf" }),
        new (window.File as any)([new Blob([""])], "form_410.pdf", { type: "application/pdf" })
      ]);
    }
  }, [preUploadedDocs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('generating');
    
    setTimeout(() => {
      if (mode === 'tenant') {
        setStep('submitted');
      } else {
        setStep('preview');
      }
      onContractGenerated();
    }, 3000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/leases/AI-generated-lease.pdf';
    link.download = 'AI-generated-lease.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handlePreview = () => {
    setShowPdf(true);
  };

  const requiredDocuments = [
    { id: 'id', name: 'ID or Passport' },
    { id: 'Form410', name: 'Form 410' }
  ];

  const getCheckedDocuments = (totalFiles: number) => {
    return requiredDocuments.slice(0, totalFiles);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSubmitApplication = () => {
    setStep('submitted');
  };

  const handleAccept = () => {
    onClose();
  };

  if (!isOpen) return null;
  if (isLoading) return null;

  const isLandlord = userMode === 'landlord';

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

        {step === 'upload' && (
          <>
            <div className="flex items-center mb-6 pr-8 sm:pr-0">
              <h2 className="text-2xl font-semibold">Review and Upload Documents</h2>
              <div className="relative ml-2 group">
                <Info className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 p-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg invisible group-hover:visible transition-all duration-300 z-50">
                  Our AI will safely evaluate your documents and extract the necessary information to generate the lease agreement. 
                  <br></br>To ensure privacy, your documents will not be saved.
                </div>
              </div>
            </div>
            <div className="relative ml-2 group font-semibold mb-2">
              Uploaded documents:
            </div>
            <div className="ml-2 space-y-2 mb-6">
              {requiredDocuments.map((doc, index) => (
                <div key={doc.id} className="flex items-center gap-2">
                  <span>{doc.name}</span>
                  {index < files.length && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4 max-h-[40vh] overflow-y-auto" ref={fileListRef}>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <label 
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
                    ${isDragging 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-600'
                    }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`w-8 h-8 mb-2 transition-colors duration-200 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={files.length < 2}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-300 disabled:cursor-not-allowed sticky bottom-0"
              >
                {source === 'property' ? 'Submit Application' : (userMode === 'landlord' ? 'Generate Lease' : 'Submit Application')}
              </button>
            </form>
          </>
        )}

        {step === 'generating' && (
          <div className="py-16 text-center">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <h3 className="text-2xl font-semibold mb-2">Generating Lease...</h3>
            <p className="text-gray-600">
              Our AI is analyzing the documents and creating the lease agreement
            </p>
          </div>
        )}

        {step === 'preview' && (
          <div className="text-center">
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
            
            <div className="flex justify-center gap-4 mt-6">
              <button 
                onClick={() => {/* handle download */}}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors min-w-[200px]"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              
              <button
                onClick={() => {/* handle sign */}}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors min-w-[200px]"
              >
                <Edit3 className="w-5 h-5" />
                Sign Lease Agreement
              </button>
            </div>
          </div>
        )}

        {step === 'submitted' && (
          <div className="py-16 text-center">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <CheckCircle className="w-full h-full text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Application Submitted!</h3>
            <p className="text-gray-600 mb-8">
              Your application has been submitted. We will run a quick background check and get back to you. <br></br>
              Please review, download and/or resubmit if needed.
            </p>
            <button
              onClick={handleAccept}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 