import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenDeploymentService } from '../TokenDeploymentService';
import {
  TokenStandard,
  TokenDeploymentRequest,
  TokenDeploymentResponse,
  ERC20DeploymentRequest,
  ARC3DeploymentRequest,
  ARC200DeploymentRequest,
  ARC1400DeploymentRequest,
} from '../../types/api';

describe('TokenDeploymentService', () => {
  let service: TokenDeploymentService;
  let mockApiClient: any;

  beforeEach(() => {
    // Create a mock API client
    mockApiClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    
    // Pass mock API client to the service
    service = new TokenDeploymentService(mockApiClient as any);
  });

  describe('ERC20 Token Deployment', () => {
    it('should deploy ERC20 token successfully', async () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      const mockResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_123456',
        tokenId: 'token_789',
        contractAddress: '0xABCDEF1234567890',
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.deployToken(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tokens/deploy', request);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn_123456');
      expect(result.tokenId).toBe('token_789');
    });

    it('should handle ERC20 deployment errors', async () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      const mockErrorResponse: TokenDeploymentResponse = {
        success: false,
        error: 'Insufficient funds',
        errorCode: 'INSUFFICIENT_FUNDS',
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockErrorResponse);

      const result = await service.deployToken(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
      expect(result.errorCode).toBe('INSUFFICIENT_FUNDS');
    });

    it('should validate ERC20 request before deployment', async () => {
      const invalidRequest = {
        standard: TokenStandard.ERC20,
        name: '',
        // missing required fields
      } as any;

      await expect(service.deployToken(invalidRequest)).rejects.toThrow();
    });
  });

  describe('ARC3 Token Deployment', () => {
    it('should deploy ARC3 NFT successfully', async () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'Test NFT',
        unitName: 'TNFT',
        total: 1,
        decimals: 0,
        url: 'ipfs://QmTestHash',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      const mockResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_arc3_123',
        tokenId: 'nft_456',
        assetId: 12345,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.deployToken(request);

      expect(result.success).toBe(true);
      expect(result.assetId).toBe(12345);
    });

    it('should deploy fractional ARC3 NFT', async () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'Fractional NFT',
        unitName: 'FNFT',
        total: 1000,
        decimals: 0,
        url: 'ipfs://QmTestHash',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      const mockResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_arc3_frac_123',
        tokenId: 'fnft_456',
        assetId: 12346,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.deployToken(request);

      expect(result.success).toBe(true);
      expect(result.assetId).toBe(12346);
    });
  });

  describe('ARC200 Token Deployment', () => {
    it('should deploy ARC200 token successfully', async () => {
      const request: ARC200DeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'ARC200 Token',
        symbol: 'ARC',
        decimals: 6,
        totalSupply: '1000000',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      const mockResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_arc200_123',
        tokenId: 'arc200_789',
        appId: 54321,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.deployToken(request);

      expect(result.success).toBe(true);
      expect(result.appId).toBe(54321);
    });
  });

  describe('ARC1400 Token Deployment', () => {
    it('should deploy ARC1400 security token successfully', async () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
        partitions: ['tranche-a', 'tranche-b'],
      };

      const mockResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_arc1400_123',
        tokenId: 'sec_789',
        appId: 67890,
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await service.deployToken(request);

      expect(result.success).toBe(true);
      expect(result.appId).toBe(67890);
    });

    it('should require partitions for ARC1400', async () => {
      const invalidRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
        partitions: [], // Empty partitions
      } as ARC1400DeploymentRequest;

      await expect(service.deployToken(invalidRequest)).rejects.toThrow();
    });
  });

  describe('Token Status Check', () => {
    it('should check deployment status', async () => {
      const transactionId = 'txn_123456';
      const mockStatus = {
        transactionId,
        status: 'completed',
        tokenId: 'token_789',
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockStatus);

      const result = await service.checkDeploymentStatus(transactionId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tokens/deploy/status/${transactionId}`);
      expect(result.status).toBe('completed');
      expect(result.tokenId).toBe('token_789');
    });

    it('should handle pending deployments', async () => {
      const transactionId = 'txn_pending';
      const mockStatus = {
        transactionId,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };

      mockApiClient.get.mockResolvedValue(mockStatus);

      const result = await service.checkDeploymentStatus(transactionId);

      expect(result.status).toBe('pending');
    });
  });

  describe('List Deployed Tokens', () => {
    it('should list all deployed tokens for a wallet', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      const mockTokens = [
        {
          id: 'token_1',
          name: 'Token 1',
          standard: TokenStandard.ERC20,
          symbol: 'TK1',
        },
        {
          id: 'token_2',
          name: 'Token 2',
          standard: TokenStandard.ERC20,
          symbol: 'TK2',
        },
      ];

      mockApiClient.get.mockResolvedValue({ tokens: mockTokens });

      const result = await service.listDeployedTokens(walletAddress);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tokens/wallet/${walletAddress}`);
      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].id).toBe('token_1');
    });

    it('should handle empty token list', async () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      mockApiClient.get.mockResolvedValue({ tokens: [] });

      const result = await service.listDeployedTokens(walletAddress);

      expect(result.tokens).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(service.deployToken(request)).rejects.toThrow('Network error');
    });

    it('should handle API errors with proper error codes', async () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      const apiError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid request',
            code: 'VALIDATION_ERROR',
          },
        },
      };

      mockApiClient.post.mockRejectedValue(apiError);

      await expect(service.deployToken(request)).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 400,
        }),
      });
    });
  });

  describe('Batch Deployment', () => {
    it('should deploy multiple tokens in batch', async () => {
      const requests: TokenDeploymentRequest[] = [
        {
          standard: TokenStandard.ERC20,
          name: 'Token 1',
          symbol: 'TK1',
          decimals: 18,
          totalSupply: '1000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          standard: TokenStandard.ERC20,
          name: 'Token 2',
          symbol: 'TK2',
          decimals: 18,
          totalSupply: '2000000',
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
      ];

      const mockResponses = requests.map((req, i) => ({
        success: true,
        transactionId: `txn_${i}`,
        tokenId: `token_${i}`,
        timestamp: new Date().toISOString(),
      }));

      mockApiClient.post.mockImplementation((url, data) => {
        const index = requests.indexOf(data);
        return Promise.resolve(mockResponses[index]);
      });

      const results = await service.deployTokensBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });
});
