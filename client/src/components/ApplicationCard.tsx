import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface ApplicationCardProps {
  application: {
    id: string;
    propertyId: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      backgroundCheckStatus: string;
      plaidVerified: boolean;
      identityVerified: boolean;
      bankAccountVerified: boolean;
      verifiedIncome: number;
    };
  };
  onApprove?: (applicationId: string, propertyId: string) => void;
  onReject?: (applicationId: string, propertyId: string) => void;
  onViewProfile: (tenant: any) => void;
  onViewDocuments: (applicationId: string) => void;
}

const ApplicationCard = ({ 
  application, 
  onApprove, 
  onReject, 
  onViewProfile, 
  onViewDocuments 
}: ApplicationCardProps) => {
  const statusStyles = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    Pending: <Clock className="w-4 h-4" />,
    Approved: <CheckCircle className="w-4 h-4" />,
    Rejected: <XCircle className="w-4 h-4" />
  };

  const verificationStatus = {
    identity: application.tenant.identityVerified,
    bank: application.tenant.bankAccountVerified,
    background: application.tenant.backgroundCheckStatus === 'completed',
    income: application.tenant.verifiedIncome > 0
  };

  return (
    <Card className="p-6 shadow-md hover:border-blue-500 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">
            {application.tenant.firstName} {application.tenant.lastName}
          </h3>
          <p className="text-gray-600">{application.tenant.email}</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${statusStyles[application.status]}`}>
          {statusIcons[application.status]}
          {application.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Application Date</p>
          <p className="font-medium">{formatDate(application.createdAt)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Verified Income</p>
          <p className="font-medium">
            {application.tenant.verifiedIncome > 0 
              ? `$${application.tenant.verifiedIncome.toLocaleString()}/year` 
              : 'Not Verified'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded text-xs ${verificationStatus.identity ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          Identity {verificationStatus.identity ? '✓' : '?'}
        </span>
        <span className={`px-2 py-1 rounded text-xs ${verificationStatus.bank ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          Bank Account {verificationStatus.bank ? '✓' : '?'}
        </span>
        <span className={`px-2 py-1 rounded text-xs ${verificationStatus.background ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          Background Check {verificationStatus.background ? '✓' : '?'}
        </span>
        <span className={`px-2 py-1 rounded text-xs ${verificationStatus.income ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          Income Verified {verificationStatus.income ? '✓' : '?'}
        </span>
      </div>

      <div className="flex gap-3">
        {application.status === 'Pending' && onApprove && onReject && (
          <>
            <button
              onClick={() => onApprove(application.id, application.propertyId)}
              className="flex-1 bg-green-600 text-white rounded-xl py-2 hover:bg-green-700 transition"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(application.id, application.propertyId)}
              className="flex-1 bg-red-600 text-white rounded-xl py-2 hover:bg-red-700 transition"
            >
              Reject
            </button>
          </>
        )}
        <button
          onClick={() => onViewProfile(application.tenant)}
          className="flex-1 bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700 transition"
        >
          View Profile
        </button>
        <button
          onClick={() => onViewDocuments(application.id)}
          className="flex-1 bg-gray-600 text-white rounded-xl py-2 hover:bg-gray-700 transition"
        >
          Documents
        </button>
      </div>
    </Card>
  );
};

export default ApplicationCard; 