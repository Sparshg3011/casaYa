import { CheckCircle2, XCircle } from 'lucide-react';

interface VerificationStatusProps {
  isVerified: boolean;
  verifiedDate: string | null | undefined;
}

export default function VerificationStatus({ isVerified, verifiedDate }: VerificationStatusProps) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {isVerified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {isVerified ? 'Verified' : 'Not Verified'}
    </div>
  );
} 