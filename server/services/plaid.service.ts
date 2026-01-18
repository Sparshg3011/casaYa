import { Configuration, PlaidApi, CountryCode, Products, PlaidEnvironments } from 'plaid';
import { prisma } from '../models/prisma';
import dotenv from 'dotenv';
import { Prisma, Tenant } from '@prisma/client';

dotenv.config();

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Enhanced logging helper
const logPlaidResponse = (functionName: string, response: any) => {
  console.log(`\n=== Plaid API Response: ${functionName} ===`);
  console.log(JSON.stringify(response, null, 2));
  console.log('=====================================\n');
};

// Add debug logging helper
const logDebug = (functionName: string, message: string, data?: any) => {
  console.log(`\n[DEBUG] ${functionName}: ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('-----------------------------------');
};

const formatPhoneNumber = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Add country code if not present
  return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
};

const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',') as CountryCode[];

export const initiatePlaidVerification = async (supabaseId: string) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { supabaseId },
      select: { phone: true }
    });

    if (!tenant?.phone) {
      throw new Error('Phone number is required for verification');
    }

    const formattedPhone = formatPhoneNumber(tenant.phone);

    const config = {
      user: {
        client_user_id: supabaseId,
        phone_number: formattedPhone
      },
      client_name: 'RentCasaya',
      products: ['auth', 'identity', 'transactions'] as Products[],
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(config);
    logPlaidResponse('initiatePlaidVerification', response.data);
    return { linkToken: response.data.link_token };
  } catch (error) {
    console.error('Error creating Plaid link token:', error);
    throw error;
  }
};

export interface PlaidVerificationResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function verifyTenantIdentity(tenantId: string, accessToken: string): Promise<PlaidVerificationResult> {
  const fnName = 'verifyTenantIdentity';
  try {
    logDebug(fnName, 'Starting identity verification for tenant:', { tenantId });

    const identity = await plaidClient.identityGet({
      access_token: accessToken,
    });
    logPlaidResponse(fnName, identity.data);

    // Get the first owner's information
    const identityInfo = identity.data.accounts[0].owners[0];
    if (!identityInfo) {
      logDebug(fnName, 'No identity information found');
      return {
        success: false,
        message: 'No identity information found',
      };
    }

    logDebug(fnName, 'Found identity information:', {
      names: identityInfo.names,
      emails: identityInfo.emails,
      phones: identityInfo.phone_numbers,
      addresses: identityInfo.addresses
    });

    // Split the full name into first and last name
    const fullName = identityInfo.names[0];
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Get primary email and phone
    const primaryEmail = identityInfo.emails.find(e => e.primary)?.data || identityInfo.emails[0].data;
    const primaryPhone = identityInfo.phone_numbers.find(p => p.primary)?.data || identityInfo.phone_numbers[0].data;

    // Get primary address if available
    const primaryAddress = identityInfo.addresses.find(a => a.primary)?.data;

    const updateData = {
      identityVerified: true,
      identityVerifiedAt: new Date(),
      verifiedFirstName: firstName,
      verifiedLastName: lastName,
      verifiedEmail: primaryEmail,
      verifiedPhone: primaryPhone,
      currentAddress: primaryAddress ? 
        `${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.region} ${primaryAddress.postal_code}` : 
        undefined,
      plaidVerified: true,
      plaidVerifiedAt: new Date(),
      plaidAccessToken: accessToken,
      plaidItemId: identity.data.item.item_id,
      plaidInstitutionId: identity.data.item.institution_id,
      plaidInstitutionName: identity.data.item.institution_id,
      updatedAt: new Date(),
    } as const;

    logDebug(fnName, 'Updating tenant with verified identity:', updateData);

    await prisma.tenant.update({
      where: { supabaseId: tenantId },
      data: updateData as unknown as Prisma.TenantUpdateInput,
    });

    logDebug(fnName, 'Successfully updated tenant identity verification');

    return {
      success: true,
      message: 'Identity verification successful',
      data: {
        identity: {
          firstName,
          lastName,
          email: primaryEmail,
          phone: primaryPhone,
          address: primaryAddress,
        }
      },
    };
  } catch (error) {
    logDebug(fnName, 'Error during identity verification:', error);
    return {
      success: false,
      message: 'Failed to verify identity',
    };
  }
}

// Add type for bank account data
interface PlaidBankAccount {
  account_id: string;
  persistent_account_id: string;
  name: string;
  official_name?: string;
  mask: string;
  subtype: string;
  type: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
  };
  ownerName?: string;
  routing_number?: string;
  account_number_mask?: string;
}

export async function verifyTenantBankAccount(tenantId: string, accessToken: string): Promise<PlaidVerificationResult> {
  const fnName = 'verifyTenantBankAccount';
  try {
    logDebug(fnName, 'Starting bank account verification for tenant:', { tenantId });

    const auth = await plaidClient.authGet({
      access_token: accessToken,
    });
    logPlaidResponse(fnName + ' - auth', auth.data);

    const balance = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    });
    logPlaidResponse(fnName + ' - balance', balance.data);

    logDebug(fnName, 'Found bank accounts:', {
      count: balance.data.accounts.length,
      accountTypes: balance.data.accounts.map(a => a.type)
    });

    // Get identity information for owner's name
    const identity = await plaidClient.identityGet({
      access_token: accessToken,
    });

    // Construct bank accounts array with owner information
    const bankAccounts = balance.data.accounts.map(account => {
      const authNumbers = auth.data.numbers.ach.find(a => a.account_id === account.account_id);
      const accountOwner = identity.data.accounts
        .find(a => a.account_id === account.account_id)?.owners[0];
      
      const accountInfo = {
        account_id: account.account_id,
        persistent_account_id: account.persistent_account_id,
        name: account.name,
        official_name: account.official_name,
        mask: account.mask,
        subtype: account.subtype,
        type: account.type,
        balances: {
          available: account.balances.available,
          current: account.balances.current,
          iso_currency_code: account.balances.iso_currency_code
        },
        ownerName: accountOwner ? accountOwner.names[0] : undefined,
        routing_number: authNumbers?.routing,
        account_number_mask: authNumbers?.account?.slice(-4)
      };

      logDebug(fnName, `Processing account: ${account.name}`, {
        type: account.type,
        subtype: account.subtype,
        hasOwner: !!accountOwner,
        hasAuthNumbers: !!authNumbers
      });

      return accountInfo;
    });

    const updateData = {
      bankAccountVerified: true,
      bankAccountVerifiedAt: new Date(),
      bankAccounts: bankAccounts,
      plaidVerified: true,
      plaidVerifiedAt: new Date(),
      plaidAccessToken: accessToken,
      plaidItemId: balance.data.item.item_id,
      plaidInstitutionId: balance.data.item.institution_id,
      plaidInstitutionName: balance.data.item.institution_id,
      updatedAt: new Date(),
    } as const;

    logDebug(fnName, 'Updating tenant with verified bank accounts:', {
      accountCount: bankAccounts.length,
      verificationStatus: 'verified',
      timestamp: updateData.bankAccountVerifiedAt
    });

    await prisma.tenant.update({
      where: { supabaseId: tenantId },
      data: updateData as unknown as Prisma.TenantUpdateInput,
    });

    logDebug(fnName, 'Successfully updated tenant bank account verification');

    return {
      success: true,
      message: 'Bank account verification successful',
      data: {
        bankAccounts
      },
    };
  } catch (error) {
    logDebug(fnName, 'Error during bank account verification:', error);
    return {
      success: false,
      message: 'Failed to verify bank account',
    };
  }
}

export async function verifyTenantIncome(tenantId: string, accessToken: string): Promise<PlaidVerificationResult> {
  const fnName = 'verifyTenantIncome';
  try {
    logDebug(fnName, 'Starting income verification for tenant:', { tenantId });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const endDate = new Date();
    
    logDebug(fnName, 'Fetching transactions for date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const transactions = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      options: {
        include_personal_finance_category: true
      }
    });

    logPlaidResponse(fnName + ' - transactions', transactions.data);

    // Calculate monthly income from recurring deposits
    const deposits = transactions.data.transactions.filter(t => 
      t.amount < 0 && // Plaid uses negative for deposits
      (
        t.personal_finance_category?.primary === 'INCOME' ||
        t.category?.some(c => ['Payroll', 'Transfer', 'Deposit'].includes(c))
      )
    );

    logDebug(fnName, 'Found potential income deposits:', {
      totalDeposits: deposits.length,
      depositAmounts: deposits.map(d => Math.abs(d.amount))
    });

    let monthlyIncome = 0;
    if (deposits.length > 0) {
      // Group deposits by similar amounts
      const recurringDeposits = deposits.reduce((groups: { [key: string]: number[] }, t) => {
        const amount = Math.abs(t.amount);
        const key = Object.keys(groups).find(k => {
          const baseAmount = Number(k);
          return amount >= baseAmount * 0.95 && amount <= baseAmount * 1.05;
        });
        
        if (key) {
          groups[key].push(amount);
        } else {
          groups[amount.toString()] = [amount];
        }
        return groups;
      }, {});

      logDebug(fnName, 'Grouped recurring deposits:', recurringDeposits);

      // Find the most frequent recurring deposit amount
      let maxCount = 0;
      let likelyIncome = 0;

      Object.entries(recurringDeposits).forEach(([amount, values]) => {
        logDebug(fnName, `Analyzing deposit group: $${amount}`, {
          frequency: values.length,
          average: values.reduce((sum, v) => sum + v, 0) / values.length
        });

        if (values.length > maxCount) {
          maxCount = values.length;
          likelyIncome = values.reduce((sum, v) => sum + v, 0) / values.length;
        }
      });

      // Calculate monthly income based on frequency
      if (maxCount >= 6) {
        monthlyIncome = likelyIncome * 2.17;
        logDebug(fnName, 'Detected bi-weekly payment pattern', {
          baseAmount: likelyIncome,
          monthlyEstimate: monthlyIncome
        });
      } else if (maxCount >= 3) {
        monthlyIncome = likelyIncome;
        logDebug(fnName, 'Detected monthly payment pattern', {
          baseAmount: likelyIncome,
          monthlyEstimate: monthlyIncome
        });
      }
    }

    const annualIncome = monthlyIncome * 12;
    logDebug(fnName, 'Calculated income:', {
      monthly: monthlyIncome,
      annual: annualIncome
    });

    const updateData = {
      verifiedIncome: annualIncome,
      incomeVerifiedAt: new Date(),
      income: annualIncome,
      plaidVerified: true,
      plaidVerifiedAt: new Date(),
      plaidAccessToken: accessToken,
      plaidItemId: transactions.data.item.item_id,
      plaidInstitutionId: transactions.data.item.institution_id,
      plaidInstitutionName: transactions.data.item.institution_id,
      updatedAt: new Date(),
    } as const;

    logDebug(fnName, 'Updating tenant with verified income:', updateData);

    await prisma.tenant.update({
      where: { supabaseId: tenantId },
      data: updateData as unknown as Prisma.TenantUpdateInput,
    });

    logDebug(fnName, 'Successfully updated tenant income verification');

    return {
      success: true,
      message: 'Income verification successful',
      data: {
        income: {
          monthly: monthlyIncome,
          annual: annualIncome,
          frequency: monthlyIncome > 0 ? 'monthly' : 'unknown',
          confidence: monthlyIncome > 0 ? 'high' : 'low',
        },
        transactions: deposits.map(t => ({
          date: t.date,
          amount: Math.abs(t.amount),
          description: t.name,
          category: t.personal_finance_category?.primary
        }))
      },
    };
  } catch (error) {
    logDebug(fnName, 'Error during income verification:', error);
    return {
      success: false,
      message: 'Failed to verify income',
    };
  }
}

export async function createPlaidLinkToken(tenantId: string): Promise<string> {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: tenantId },
      client_name: 'Casaya Rental App',
      products: [Products.Auth, Products.Identity, Products.Transactions],
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en'
    });

    logPlaidResponse('createPlaidLinkToken', response.data);
    return response.data.link_token;
  } catch (error) {
    console.error('Failed to create link token:', error);
    throw error;
  }
}

export async function exchangePublicToken(publicToken: string): Promise<string> {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    logPlaidResponse('exchangePublicToken', response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to exchange public token:', error);
    throw error;
  }
}

export async function createSandboxPublicToken(): Promise<string> {
  try {
    const response = await plaidClient.sandboxPublicTokenCreate({
      institution_id: 'ins_109508',
      initial_products: [Products.Auth, Products.Identity, Products.Transactions]
    });

    logPlaidResponse('createSandboxPublicToken', response.data);
    return response.data.public_token;
  } catch (error) {
    console.error('Failed to create sandbox public token:', error);
    throw error;
  }
} 