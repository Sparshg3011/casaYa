import axios from 'axios';

interface EquifaxConfig {
  clientId: string;
  apiUrl: string;
  accessToken?: string;
  tokenExpiresAt?: Date;
}

interface CreditScoreResponse {
  score: number;
  status: string;
  reportDate: string;
}

export class EquifaxService {
  private config: EquifaxConfig;
  private isDevelopment: boolean;

  constructor() {
    this.config = {
      clientId: process.env.EQUIFAX_API_KEY || '',
      apiUrl: process.env.EQUIFAX_API_URL || ''
    };
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.config.accessToken && this.config.tokenExpiresAt && this.config.tokenExpiresAt > new Date()) {
        return this.config.accessToken;
      }

      console.log('Generating new Equifax access token...');
      
      // Get new token using client credentials flow
      const tokenResponse = await axios.post(
        'https://api.equifax.com/oauth2/v1/token',
        new URLSearchParams({
          'grant_type': 'client_credentials',
          'scope': '@https://api.equifax.com/personal/consumer-data-suite/v1/creditScore'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          auth: {
            username: this.config.clientId,
            password: '' // No client secret needed for test environment
          }
        }
      );

      console.log('Token response:', tokenResponse.data);

      if (!tokenResponse.data.access_token) {
        throw new Error('No access token received from Equifax');
      }

      const accessToken = tokenResponse.data.access_token;
      this.config.accessToken = accessToken;
      this.config.tokenExpiresAt = new Date(Date.now() + (tokenResponse.data.expires_in * 1000));

      return accessToken;
    } catch (error: any) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to get access token');
    }
  }

  private getMockCreditScore(ssn: string): CreditScoreResponse {
    // Generate a deterministic but random-looking score based on SSN
    // Last 4 digits of SSN will influence the score for testing different scenarios
    const lastFour = parseInt(ssn.slice(-4));
    let baseScore = 500 + (lastFour % 350); // Score between 500-850

    return {
      score: baseScore,
      status: 'Success',
      reportDate: new Date().toISOString()
    };
  }

  async getTenantCreditScore(
    firstName: string,
    lastName: string,
    ssn: string,
    dateOfBirth: string,
    address: string
  ): Promise<CreditScoreResponse> {
    // Use mock data if in development mode
    if (this.isDevelopment && process.env.USE_MOCK_CREDIT_SCORE === 'true') {
      console.log('Using mock credit score data');
      return this.getMockCreditScore(ssn);
    }

    try {
      // Get fresh access token
      const accessToken = await this.getAccessToken();
      console.log('Using access token:', accessToken.substring(0, 10) + '...');

      // Make API call
      const response = await axios.post(
        `${this.config.apiUrl}/creditScore`,
        {
          consumer: {
            firstName,
            lastName,
            ssn,
            dateOfBirth,
            currentAddress: {
              streetAddress: address
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Credit score response:', response.data);

      return {
        score: response.data.creditScore || response.data.score,
        status: response.data.status || 'Success',
        reportDate: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error fetching credit score:', error);
      console.error('Error response:', error.response?.data);
      throw new Error('Failed to fetch credit score');
    }
  }
} 