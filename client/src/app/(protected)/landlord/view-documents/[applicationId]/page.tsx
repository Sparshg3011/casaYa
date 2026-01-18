'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Download, Eye, ArrowLeft, AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import landlordApi, { Application, ApplicationDocumentStatus } from '@/lib/landlordApi';

export default function ViewDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.applicationId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [documentStatus, setDocumentStatus] = useState<ApplicationDocumentStatus | null>(null);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the application details from the properties list
        const propertiesResponse = await landlordApi.getLandlordProperties();
        const properties = propertiesResponse.data.properties;
        
        let foundApplication: Application | null = null;
        
        // Find the application in the properties
        for (const property of properties) {
          const app = property.applications.find(a => a.id === applicationId);
          if (app) {
            foundApplication = app as Application;
            break;
          }
        }
        
        if (foundApplication) {
          setApplication(foundApplication);
          
          // Fetch document status
          const docResponse = await landlordApi.getApplicationDocuments(applicationId);
          setDocumentStatus(docResponse.data);
        } else {
          setError('Application not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load application details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [applicationId]);

  const handleDownload = async (documentType: 'id' | 'bankStatement' | 'form410') => {
    try {
      if (!application) return;
      
      const response = await landlordApi.downloadDocument(applicationId, documentType);
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download document. Please try again later.');
    }
  };

  const handleView = async (documentType: 'id' | 'bankStatement' | 'form410') => {
    try {
      if (!application) return;
      
      const response = await landlordApi.viewDocument(applicationId, documentType);
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setDocumentUrl(url);
      setViewingDocument(documentType);
    } catch (error) {
      alert('Failed to view document. Please try again later.');
    }
  };

  const closeViewer = () => {
    if (documentUrl) {
      window.URL.revokeObjectURL(documentUrl);
    }
    setDocumentUrl(null);
    setViewingDocument(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || 'Application not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-semibold mb-2">Application Documents</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-500">Tenant Name</p>
                <p className="font-medium">{`${application.tenant.firstName} ${application.tenant.lastName}`}</p>
              </div>
              <div>
                <p className="text-gray-500">Application Status</p>
                <p className="font-medium capitalize">{application.status.toLowerCase()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* ID Document */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium">ID Document</h3>
                    <p className="text-sm text-gray-500">
                      {documentStatus?.id.exists ? 'Uploaded' : 'Not Uploaded'}
                    </p>
                  </div>
                </div>
                {documentStatus?.id.exists ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView('id')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload('id')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <AlertCircle className="w-4 h-4" />
                    Not Available
                  </div>
                )}
              </div>
            </Card>

            {/* Bank Statement */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Bank Statement</h3>
                    <p className="text-sm text-gray-500">
                      {documentStatus?.bankStatement.exists ? 'Uploaded' : 'Not Uploaded'}
                    </p>
                  </div>
                </div>
                {documentStatus?.bankStatement.exists ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView('bankStatement')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload('bankStatement')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <AlertCircle className="w-4 h-4" />
                    Not Available
                  </div>
                )}
              </div>
            </Card>

            {/* Form 410 */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Form 410</h3>
                    <p className="text-sm text-gray-500">
                      {documentStatus?.form410.exists ? 'Uploaded' : 'Not Uploaded'}
                    </p>
                  </div>
                </div>
                {documentStatus?.form410.exists ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView('form410')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload('form410')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <AlertCircle className="w-4 h-4" />
                    Not Available
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && documentUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium capitalize">
                {viewingDocument.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <button
                onClick={closeViewer}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={documentUrl}
                className="w-full h-full rounded-lg"
                title={`${viewingDocument} Document`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 