export interface TenantProfile {
  type: 'tenant';
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  verified: boolean;
  profileImage: string | null;
  socialLinks: {
    linkedin: string | null;
    facebook: string | null;
    instagram: string | null;
  };
  paymentInfo?: {
    cardLast4: string | null;
    cardBrand: string | null;
    cardExpiry: string | null;
  };
  profile?: {
    occupation: string | null;
    income: number | null;
    preferredMoveInDate: string | null;
    bio: string | null;
  };
  dateOfBirth: string | null;
  currentAddress: string | null;
  ssn: string | null;
  creditScore: number | null;
  lastCreditCheck: string | null;
  backgroundCheckStatus: string;
  isRenting: boolean;
  occupation: string | null;
  income: number | null;
  preferredMoveInDate: string | null;
  bio: string | null;
  
  // Bank account details
  bankName: string | null;
  bankAccountType: string | null;
  bankAccountBalance: number | null;
  bankAccountMask: string | null;
  plaidInstitutionName: string | null;
  
  // Verification statuses
  verifications: {
    identity: boolean;
    income: boolean;
    bankAccount: boolean;
    lastVerified?: string;
  };
  
  // Verified information
  verifiedFirstName: string | null;
  verifiedLastName: string | null;
  verifiedEmail: string | null;
  verifiedPhone: string | null;
  verifiedIncome: number | null;
  incomeVerifiedAt: string | null;
  identityVerifiedAt: string | null;
  bankAccountVerifiedAt: string | null;
  plaidVerifiedAt: string | null;
  
  applications?: {
    ongoing: number;
    rejected: number;
    completed: number;
  };
}

export interface TenantApplication {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  documents: {
    id: string;
    bankStatement: string;
    form410: string;
  };
  createdAt: string;
  property: {
    id: string;
    address: string;
    price: number;
    photos: string[];
    bedrooms: number;
    bathrooms: number;
    landlord: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
  };
}

export interface TenantVerificationStatus {
  plaidVerified: boolean;
  plaidVerifiedAt: string | null;
  identityVerified: boolean;
  identityVerifiedAt: string | null;
  bankAccountVerified: boolean;
  bankAccountVerifiedAt: string | null;
  verifiedIncome: number | null;
  incomeVerifiedAt: string | null;
} 