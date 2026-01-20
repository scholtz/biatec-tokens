import { BiatecTokensApiClient } from './BiatecTokensApiClient';
import {
  TokenDeploymentRequest,
  TokenDeploymentResponse,
  TokenInfo,
  validateTokenDeploymentRequest,
} from '../types/api';

/**
 * Service for deploying and managing tokens via BiatecTokensApi backend
 */
export class TokenDeploymentService {
  private apiClient: BiatecTokensApiClient;

  constructor(apiClient?: BiatecTokensApiClient) {
    this.apiClient = apiClient || new BiatecTokensApiClient();
  }

  /**
   * Deploy a token to the blockchain
   * @param request - Token deployment request
   * @returns Deployment response with transaction details
   * @throws Error if validation fails or deployment encounters an error
   */
  async deployToken(request: TokenDeploymentRequest): Promise<TokenDeploymentResponse> {
    // Validate request before sending
    const validation = validateTokenDeploymentRequest(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Deployment warnings:', validation.warnings);
    }

    try {
      const response = await this.apiClient.post<TokenDeploymentResponse>(
        '/tokens/deploy',
        request
      );

      return response;
    } catch (error) {
      console.error('Token deployment failed:', error);
      throw error;
    }
  }

  /**
   * Check the status of a token deployment
   * @param transactionId - Transaction ID returned from deployment
   * @returns Deployment status information
   */
  async checkDeploymentStatus(transactionId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `/tokens/deploy/status/${transactionId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to check deployment status:', error);
      throw error;
    }
  }

  /**
   * List all deployed tokens for a wallet address
   * @param walletAddress - Wallet address to query
   * @returns List of deployed tokens
   */
  async listDeployedTokens(walletAddress: string): Promise<{ tokens: TokenInfo[] }> {
    try {
      const response = await this.apiClient.get<{ tokens: TokenInfo[] }>(
        `/tokens/wallet/${walletAddress}`
      );
      return response;
    } catch (error) {
      console.error('Failed to list deployed tokens:', error);
      throw error;
    }
  }

  /**
   * Get details of a specific token
   * @param tokenId - Token ID
   * @returns Token information
   */
  async getTokenDetails(tokenId: string): Promise<TokenInfo> {
    try {
      const response = await this.apiClient.get<TokenInfo>(`/tokens/${tokenId}`);
      return response;
    } catch (error) {
      console.error('Failed to get token details:', error);
      throw error;
    }
  }

  /**
   * Deploy multiple tokens in a batch
   * @param requests - Array of token deployment requests
   * @returns Array of deployment responses
   */
  async deployTokensBatch(
    requests: TokenDeploymentRequest[]
  ): Promise<TokenDeploymentResponse[]> {
    // Validate all requests first
    for (const request of requests) {
      const validation = validateTokenDeploymentRequest(request);
      if (!validation.valid) {
        throw new Error(
          `Validation failed for ${request.name}: ${validation.errors.join(', ')}`
        );
      }
    }

    try {
      // Deploy tokens sequentially to maintain order
      const results: TokenDeploymentResponse[] = [];
      for (const request of requests) {
        const response = await this.deployToken(request);
        results.push(response);
      }
      return results;
    } catch (error) {
      console.error('Batch deployment failed:', error);
      throw error;
    }
  }

  /**
   * Cancel or revoke a token deployment (if supported)
   * @param transactionId - Transaction ID to cancel
   * @returns Cancellation result
   */
  async cancelDeployment(transactionId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.delete<{ success: boolean }>(
        `/tokens/deploy/${transactionId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to cancel deployment:', error);
      throw error;
    }
  }

  /**
   * Update token metadata (if mutable)
   * @param tokenId - Token ID
   * @param metadata - New metadata
   * @returns Update result
   */
  async updateTokenMetadata(
    tokenId: string,
    metadata: Record<string, any>
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.put<{ success: boolean }>(
        `/tokens/${tokenId}/metadata`,
        metadata
      );
      return response;
    } catch (error) {
      console.error('Failed to update token metadata:', error);
      throw error;
    }
  }
}

/**
 * Default instance of the token deployment service
 */
export const tokenDeploymentService = new TokenDeploymentService();
