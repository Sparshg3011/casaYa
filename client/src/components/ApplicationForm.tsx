'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import apiService from '@/lib/api';

interface ApplicationFormProps {
  propertyId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function ApplicationForm({ propertyId, onSuccess, onClose }: ApplicationFormProps) {
  const [files, setFiles] = useState<{
    id: File | null;
    bankStatement: File | null;
    form410: File | null;
  }>({
    id: null,
    bankStatement: null,
    form410: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (type: 'id' | 'bankStatement' | 'form410', file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all required files are present
    if (!files.id || !files.bankStatement || !files.form410) {
      setError('Please upload all required documents');
      return;
    }

    setLoading(true);

    try {
      // First upload the documents
      const formData = new FormData();
      formData.append('idFile', files.id);
      formData.append('bankStatementFile', files.bankStatement);
      formData.append('form410File', files.form410);

      const response = await apiService.tenants.uploadApplicationDocuments(formData);
      const { documents } = response.data;

      // Then submit the application with the document URLs
      await apiService.tenants.applyToProperty(propertyId, documents);

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Apply for Property</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ID Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Government-issued ID
          </label>
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileChange('id', e.target.files?.[0] || null)}
                  accept="image/*,.pdf"
                />
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {files.id ? files.id.name : 'Upload your ID'}
                  </p>
                </div>
              </div>
            </label>
            {files.id && (
              <button
                type="button"
                onClick={() => handleFileChange('id', null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Bank Statement Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Statement
          </label>
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileChange('bankStatement', e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                />
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {files.bankStatement ? files.bankStatement.name : 'Upload bank statement'}
                  </p>
                </div>
              </div>
            </label>
            {files.bankStatement && (
              <button
                type="button"
                onClick={() => handleFileChange('bankStatement', null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Form 410 Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Form 410
          </label>
          <a 
            href="https://crm.agentlocator.ca/UserFiles/6396/files/(Ontario)%20410%20-%20Rental%20Application%20-%20Residential%20(5)%20(2).pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-4 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Download Form 410 Template
          </a>
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileChange('form410', e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                />
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {files.form410 ? files.form410.name : 'Upload Form 410'}
                  </p>
                </div>
              </div>
            </label>
            {files.form410 && (
              <button
                type="button"
                onClick={() => handleFileChange('form410', null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !files.id || !files.bankStatement || !files.form410}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white transition-colors ${
            loading || !files.id || !files.bankStatement || !files.form410
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
} 