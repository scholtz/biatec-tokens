import { describe, it, expect } from 'vitest';
import {
  TokenStandard,
  TokenDeploymentRequest,
  TokenDeploymentResponse,
  TokenMetadata,
  ERC20DeploymentRequest,
  ARC3DeploymentRequest,
  ARC200DeploymentRequest,
  ARC1400DeploymentRequest,
  validateTokenDeploymentRequest,
  isERC20Request,
  isARC3Request,
  isARC200Request,
  isARC1400Request,
} from '../api';

describe('API Types', () => {
  describe('TokenStandard enum', () => {
    it('should have all expected token standards', () => {
      expect(TokenStandard.ERC20).toBe('ERC20');
      expect(TokenStandard.ARC3).toBe('ARC3');
      expect(TokenStandard.ARC200).toBe('ARC200');
      expect(TokenStandard.ARC1400).toBe('ARC1400');
    });
  });

  describe('ERC20DeploymentRequest', () => {
    it('should accept valid ERC20 deployment request', () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: 'MTK',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      expect(request.standard).toBe(TokenStandard.ERC20);
      expect(request.name).toBe('My Token');
      expect(request.symbol).toBe('MTK');
      expect(request.decimals).toBe(18);
    });

    it('should allow optional fields', () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: 'MTK',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
        description: 'A test token',
        icon: 'https://example.com/icon.png',
      };

      expect(request.description).toBe('A test token');
      expect(request.icon).toBe('https://example.com/icon.png');
    });
  });

  describe('ARC3DeploymentRequest', () => {
    it('should accept valid ARC3 deployment request', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'MNFT',
        total: 1,
        decimals: 0,
        url: 'ipfs://QmExample',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
        metadata: {
          name: 'My NFT',
          description: 'A test NFT',
          image: 'ipfs://QmImage',
          properties: {},
        },
      };

      expect(request.standard).toBe(TokenStandard.ARC3);
      expect(request.total).toBe(1);
      expect(request.metadata).toBeDefined();
    });

    it('should support fractional NFTs with total > 1', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'Fractional NFT',
        unitName: 'FNFT',
        total: 1000,
        decimals: 0,
        url: 'ipfs://QmExample',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      expect(request.total).toBe(1000);
    });
  });

  describe('ARC200DeploymentRequest', () => {
    it('should accept valid ARC200 deployment request', () => {
      const request: ARC200DeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'ARC200 Token',
        symbol: 'ARC',
        decimals: 6,
        totalSupply: '1000000',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      expect(request.standard).toBe(TokenStandard.ARC200);
      expect(request.symbol).toBe('ARC');
    });
  });

  describe('ARC1400DeploymentRequest', () => {
    it('should accept valid ARC1400 deployment request', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
        partitions: ['tranche-a', 'tranche-b'],
      };

      expect(request.standard).toBe(TokenStandard.ARC1400);
      expect(request.partitions).toHaveLength(2);
    });

    it('should require partitions field', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
        partitions: [],
      };

      expect(request.partitions).toBeDefined();
      expect(Array.isArray(request.partitions)).toBe(true);
    });
  });

  describe('TokenDeploymentResponse', () => {
    it('should accept valid deployment response', () => {
      const response: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_12345',
        tokenId: 'token_67890',
        contractAddress: '0x1234567890123456789012345678901234567890',
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.transactionId).toBe('txn_12345');
      expect(response.tokenId).toBe('token_67890');
    });

    it('should accept error response', () => {
      const response: TokenDeploymentResponse = {
        success: false,
        error: 'Deployment failed',
        errorCode: 'INSUFFICIENT_FUNDS',
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Deployment failed');
      expect(response.errorCode).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('Type Guard Functions', () => {
    it('isERC20Request should correctly identify ERC20 requests', () => {
      const erc20Request: TokenDeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: 'MTK',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      const arc3Request: TokenDeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'MNFT',
        total: 1,
        decimals: 0,
        url: 'ipfs://QmExample',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      expect(isERC20Request(erc20Request)).toBe(true);
      expect(isERC20Request(arc3Request)).toBe(false);
    });

    it('isARC3Request should correctly identify ARC3 requests', () => {
      const arc3Request: TokenDeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'MNFT',
        total: 1,
        decimals: 0,
        url: 'ipfs://QmExample',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      expect(isARC3Request(arc3Request)).toBe(true);
    });

    it('isARC200Request should correctly identify ARC200 requests', () => {
      const arc200Request: TokenDeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'ARC200 Token',
        symbol: 'ARC',
        decimals: 6,
        totalSupply: '1000000',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      expect(isARC200Request(arc200Request)).toBe(true);
    });

    it('isARC1400Request should correctly identify ARC1400 requests', () => {
      const arc1400Request: TokenDeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
        partitions: ['tranche-a'],
      };

      expect(isARC1400Request(arc1400Request)).toBe(true);
    });
  });

  describe('Validation Functions', () => {
    it('should validate correct ERC20 request', () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: 'MTK',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const request = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        // missing symbol, decimals, totalSupply, walletAddress
      } as any;

      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate correct ARC3 request', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'MNFT',
        total: 1,
        decimals: 0,
        url: 'ipfs://QmExample',
        walletAddress: 'AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKAAAABBBBCCCC',
      };

      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should validate decimal precision limits', () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: 'MTK',
        decimals: 25, // exceeds typical limit
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };

      const result = validateTokenDeploymentRequest(request);
      // Should warn about high decimals but still be valid
      expect(result.valid).toBe(true);
    });

    it('should warn on ERC20 decimals below 0', () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: 'MTK',
        decimals: -1,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Decimals')]));
    });

    it('should detect missing ERC20 symbol', () => {
      const request = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: '',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234567890123456789012345678901234567890',
      } as ERC20DeploymentRequest;
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('symbol')]));
    });

    it('should detect missing ERC20 total supply', () => {
      const request = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: 'MTK',
        decimals: 18,
        totalSupply: '0',
        walletAddress: '0x1234567890123456789012345678901234567890',
      } as ERC20DeploymentRequest;
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('supply')]));
    });

    it('should detect invalid Ethereum address format', () => {
      const request: ERC20DeploymentRequest = {
        standard: TokenStandard.ERC20,
        name: 'My Token',
        symbol: 'MTK',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: 'not-an-ethereum-address',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Ethereum')]));
    });

    it('should validate correct ARC3 request', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'NFT1',
        total: 1,
        decimals: 0,
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should detect missing ARC3 unit name', () => {
      const request = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: '',
        total: 1,
        decimals: 0,
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      } as ARC3DeploymentRequest;
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Unit name')]));
    });

    it('should detect ARC3 total <= 0', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'NFT1',
        total: 0,
        decimals: 0,
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Total')]));
    });

    it('should detect ARC3 negative decimals', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'NFT1',
        total: 1,
        decimals: -1,
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Decimals')]));
    });

    it('should detect invalid Algorand address in ARC3 (non-base32)', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'NFT1',
        total: 1,
        decimals: 0,
        walletAddress: 'invalid-lowercase-address-that-is-not-base32-format-here',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Algorand')]));
    });

    it('should warn when Algorand address length is not 58 in ARC3', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'NFT1',
        total: 1,
        decimals: 0,
        walletAddress: 'AAAA', // valid base32 chars but wrong length
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('58')]));
    });

    it('should validate correct ARC200 request', () => {
      const request: ARC200DeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'Arc200 Token',
        symbol: 'ARC2',
        decimals: 6,
        totalSupply: '1000000',
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should detect missing ARC200 symbol', () => {
      const request = {
        standard: TokenStandard.ARC200,
        name: 'Arc200 Token',
        symbol: '',
        decimals: 6,
        totalSupply: '1000000',
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      } as ARC200DeploymentRequest;
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('symbol')]));
    });

    it('should detect ARC200 negative decimals', () => {
      const request: ARC200DeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'Arc200 Token',
        symbol: 'ARC2',
        decimals: -1,
        totalSupply: '1000000',
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Decimals')]));
    });

    it('should detect ARC200 zero total supply', () => {
      const request: ARC200DeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'Arc200 Token',
        symbol: 'ARC2',
        decimals: 6,
        totalSupply: '0',
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('supply')]));
    });

    it('should detect invalid Algorand address in ARC200', () => {
      const request: ARC200DeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'Arc200 Token',
        symbol: 'ARC2',
        decimals: 6,
        totalSupply: '1000000',
        walletAddress: 'invalid-lowercase-not-base32-address-format-goes-here-x',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Algorand')]));
    });

    it('should warn when Algorand address length is not 58 in ARC200', () => {
      const request: ARC200DeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'Arc200 Token',
        symbol: 'ARC2',
        decimals: 6,
        totalSupply: '1000000',
        walletAddress: 'AAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('58')]));
    });

    it('should validate correct ARC1400 request', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        partitions: ['tranche-a', 'tranche-b'],
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should detect missing ARC1400 symbol', () => {
      const request = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: '',
        decimals: 0,
        totalSupply: '1000000',
        partitions: ['tranche-a'],
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      } as ARC1400DeploymentRequest;
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('symbol')]));
    });

    it('should detect missing ARC1400 partitions', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        partitions: [],
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('partition')]));
    });

    it('should detect ARC1400 negative decimals', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: -1,
        totalSupply: '1000000',
        partitions: ['tranche-a'],
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Decimals')]));
    });

    it('should detect ARC1400 zero total supply', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '0',
        partitions: ['tranche-a'],
        walletAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('supply')]));
    });

    it('should detect invalid Algorand address in ARC1400', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        partitions: ['tranche-a'],
        walletAddress: 'invalid-lowercase-not-base32-address-format-goes-here-x',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Algorand')]));
    });

    it('should warn when Algorand address length is not 58 in ARC1400', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        partitions: ['tranche-a'],
        walletAddress: 'AAAA',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('58')]));
    });

    it('should skip Algorand address validation for ARC3 when walletAddress is empty', () => {
      const request: ARC3DeploymentRequest = {
        standard: TokenStandard.ARC3,
        name: 'My NFT',
        unitName: 'NFT1',
        total: 1,
        decimals: 0,
        walletAddress: '',
      };
      const result = validateTokenDeploymentRequest(request);
      // Empty walletAddress skips address format check — no address error
      expect(result.errors).not.toEqual(expect.arrayContaining([expect.stringContaining('Algorand')]));
    });

    it('should skip Algorand address validation for ARC200 when walletAddress is empty', () => {
      const request: ARC200DeploymentRequest = {
        standard: TokenStandard.ARC200,
        name: 'Arc200 Token',
        symbol: 'ARC2',
        decimals: 6,
        totalSupply: '1000000',
        walletAddress: '',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.errors).not.toEqual(expect.arrayContaining([expect.stringContaining('Algorand')]));
    });

    it('should skip Algorand address validation for ARC1400 when walletAddress is empty', () => {
      const request: ARC1400DeploymentRequest = {
        standard: TokenStandard.ARC1400,
        name: 'Security Token',
        symbol: 'SEC',
        decimals: 0,
        totalSupply: '1000000',
        partitions: ['tranche-a'],
        walletAddress: '',
      };
      const result = validateTokenDeploymentRequest(request);
      expect(result.errors).not.toEqual(expect.arrayContaining([expect.stringContaining('Algorand')]));
    });
  });
});
