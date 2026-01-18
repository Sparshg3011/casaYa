import { PlaidVerificationResult } from './plaid.service';

interface Property {
  monthlyRent: number;
  propertyType?: string;
  location?: string;
}

interface ScoringBreakdown {
  income: number;
  bankHealth: number;
  identity: number;
  paymentHistory: number;
}

interface ScoringResult {
  score: number;
  breakdown: ScoringBreakdown;
  risk: 'Low' | 'Medium' | 'High';
  recommendation: 'Approve' | 'Further Review' | 'Decline';
  affordabilityRatio: number;
  maxRecommendedRent: number;
}

export function calculateIncomeScore(verificationResult: PlaidVerificationResult, property: Property): number {
  let score = 0;
  
  // Monthly Income to Rent Ratio (25 points)
  const monthlyIncome = verificationResult.data?.monthlyIncome || 0;
  const rentAmount = property.monthlyRent;
  const incomeRatio = monthlyIncome / rentAmount;
  
  if (incomeRatio >= 3.0) score += 25;        // Excellent: 3x or more
  else if (incomeRatio >= 2.5) score += 20;   // Very Good: 2.5-3x
  else if (incomeRatio >= 2.0) score += 15;   // Good: 2-2.5x
  else if (incomeRatio >= 1.5) score += 10;   // Fair: 1.5-2x
  else score += 5;                            // Poor: less than 1.5x
  
  // Income Stability (15 points)
  const transactions = verificationResult.data?.transactions?.transactions || [];
  const regularDeposits = transactions.filter((t: any) => 
    t.amount < 0 && t.personal_finance_category?.primary === "INCOME"
  );
  
  if (regularDeposits.length >= 6) score += 15;    // Very stable (3+ months of regular deposits)
  else if (regularDeposits.length >= 4) score += 10; // Moderately stable
  else if (regularDeposits.length >= 2) score += 5;  // Somewhat stable
  
  return score;
}

export function calculateBankHealthScore(verificationResult: PlaidVerificationResult, property: Property): number {
  let score = 0;
  
  // Average Balance Maintenance (15 points)
  const accounts = verificationResult.data?.transactions?.accounts || [];
  const checkingAccount = accounts.find((a: any) => a.subtype === "checking");
  const savingsAccount = accounts.find((a: any) => a.subtype === "savings");
  
  const totalBalance = (checkingAccount?.balances?.current || 0) + 
                      (savingsAccount?.balances?.current || 0);
  const monthlyRent = property.monthlyRent;
  
  if (totalBalance >= monthlyRent * 6) score += 15;     // 6+ months of rent
  else if (totalBalance >= monthlyRent * 3) score += 10; // 3-6 months of rent
  else if (totalBalance >= monthlyRent) score += 5;      // 1-3 months of rent
  
  // Account Diversity (10 points)
  const accountTypes = new Set(accounts.map((a: any) => a.type));
  if (accountTypes.size >= 3) score += 10;              // Multiple account types
  else if (accountTypes.size === 2) score += 5;         // Two account types
  
  // Transaction History (5 points)
  const transactions = verificationResult.data?.transactions?.transactions || [];
  const hasOverdraft = transactions.some((t: any) => 
    t.amount > (checkingAccount?.balances?.available || 0)
  );
  if (!hasOverdraft) score += 5;
  
  return score;
}

export function calculateIdentityScore(verificationResult: PlaidVerificationResult): number {
  let score = 0;
  
  // Identity Match (10 points)
  const accounts = verificationResult.data?.transactions?.accounts || [];
  const identity = accounts[0]?.owners?.[0];
  if (identity?.names && identity?.addresses && identity?.emails) score += 10;
  
  // Additional Verification Points (10 points)
  if (identity?.phone_numbers?.length > 0) score += 3;
  if (identity?.emails?.length > 0) score += 3;
  if (identity?.addresses?.length > 0) score += 4;
  
  return score;
}

export function calculatePaymentHistoryScore(verificationResult: PlaidVerificationResult): number {
  let score = 0;
  
  // Regular Bill Payments
  const transactions = verificationResult.data?.transactions?.transactions || [];
  const billPayments = transactions.filter((t: any) =>
    t.amount > 0 && t.personal_finance_category?.primary === "PAYMENT"
  );
  
  // Score based on number of regular bill payments
  if (billPayments.length >= 10) score += 10;      // Excellent payment history
  else if (billPayments.length >= 6) score += 7;   // Good payment history
  else if (billPayments.length >= 3) score += 4;   // Fair payment history
  else score += 0;                                 // Poor payment history
  
  return score;
}

export function calculateTenantScore(verificationResult: PlaidVerificationResult, property: Property): ScoringResult {
  // Calculate individual scores
  const incomeScore = calculateIncomeScore(verificationResult, property);
  const bankHealthScore = calculateBankHealthScore(verificationResult, property);
  const identityScore = calculateIdentityScore(verificationResult);
  const paymentHistoryScore = calculatePaymentHistoryScore(verificationResult);
  
  // Calculate total score (out of 100)
  const totalScore = incomeScore + bankHealthScore + identityScore + paymentHistoryScore;
  
  // Calculate affordability ratio
  const monthlyIncome = verificationResult.data?.monthlyIncome || 0;
  const affordabilityRatio = monthlyIncome / property.monthlyRent;
  
  // Determine risk level and recommendation
  let risk: 'Low' | 'Medium' | 'High';
  let recommendation: 'Approve' | 'Further Review' | 'Decline';
  
  if (totalScore >= 80 && affordabilityRatio >= 2.5) {
    risk = 'Low';
    recommendation = 'Approve';
  } else if (totalScore >= 60 && affordabilityRatio >= 2.0) {
    risk = 'Medium';
    recommendation = 'Further Review';
  } else {
    risk = 'High';
    recommendation = 'Decline';
  }
  
  return {
    score: totalScore,
    breakdown: {
      income: incomeScore,
      bankHealth: bankHealthScore,
      identity: identityScore,
      paymentHistory: paymentHistoryScore
    },
    risk,
    recommendation,
    affordabilityRatio,
    maxRecommendedRent: monthlyIncome * 0.4 // 40% of monthly income
  };
}

export function getPropertyCompatibility(monthlyIncome: number, propertyRent: number): {
  compatible: boolean;
  affordabilityRatio: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  maxRecommendedRent: number;
} {
  const affordabilityRatio = monthlyIncome / propertyRent;
  const maxRecommendedRent = monthlyIncome * 0.4; // 40% of monthly income
  
  let riskLevel: 'Low' | 'Medium' | 'High';
  if (affordabilityRatio >= 3.0) riskLevel = 'Low';
  else if (affordabilityRatio >= 2.5) riskLevel = 'Medium';
  else riskLevel = 'High';
  
  return {
    compatible: affordabilityRatio >= 2.5,
    affordabilityRatio,
    riskLevel,
    maxRecommendedRent
  };
} 