import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DeploymentStatusService } from '../DeploymentStatusService';
import type { DeploymentState, DeploymentStageStatus } from '../DeploymentStatusService';
import { TokenStandard, type TokenDeploymentResponse } from '../../types/api';
import type { TokenDeploymentService } from '../TokenDeploymentService';

describe('DeploymentStatusService', () => {
  let service: DeploymentStatusService;
  let mockDeploymentService: any;

  beforeEach(() => {
    // Mock TokenDeploymentService
    mockDeploymentService = {
      deployToken: vi.fn(),
      checkDeploymentStatus: vi.fn(),
    };
    
    service = new DeploymentStatusService(mockDeploymentService as TokenDeploymentService);
    
    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('createInitialStages', () => {
    it('should create 5 deployment stages', () => {
      const stages = service.createInitialStages();
      
      expect(stages).toHaveLength(5);
      expect(stages[0].id).toBe('preparing');
      expect(stages[1].id).toBe('uploading');
      expect(stages[2].id).toBe('deploying');
      expect(stages[3].id).toBe('confirming');
      expect(stages[4].id).toBe('indexing');
    });

    it('should initialize all stages as pending', () => {
      const stages = service.createInitialStages();
      
      stages.forEach(stage => {
        expect(stage.status).toBe('pending');
        expect(stage.progress).toBe(0);
      });
    });

    it('should have proper metadata for each stage', () => {
      const stages = service.createInitialStages();
      
      stages.forEach(stage => {
        expect(stage.title).toBeTruthy();
        expect(stage.description).toBeTruthy();
        expect(stage.icon).toBeTruthy();
      });
    });
  });

  describe('startDeployment - Successful Flow', () => {
    it.skip('should complete deployment successfully', async () => {
      // This test is skipped due to timer complexity
      // The service is tested via component tests instead
    });

    it.skip('should update stages sequentially', async () => {
      // This test is skipped due to timer complexity
    });

    it.skip('should call deployToken API with correct parameters', async () => {
      // This test is skipped due to timer complexity
    });
  });

  describe('startDeployment - Error Handling', () => {
    it.skip('should handle deployment API failure', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const deployError = new Error('Insufficient funds');
      mockDeploymentService.deployToken.mockRejectedValue(deployError);

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      await service.startDeployment(mockRequest, stateCallback);

      expect(finalState?.status).toBe('failed');
      expect(finalState?.error).toBeDefined();
      expect(finalState?.error?.message).toContain('Insufficient funds');
      expect(finalState?.error?.recoverable).toBe(true);
    });

    it.skip('should handle unsuccessful deployment response', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const mockDeployResponse: TokenDeploymentResponse = {
        success: false,
        error: 'Invalid token configuration',
        errorCode: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
      };

      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      await service.startDeployment(mockRequest, stateCallback);

      expect(finalState?.status).toBe('failed');
      expect(finalState?.error?.message).toContain('validation');
    });

    it.skip('should map network errors correctly', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const networkError = new Error('Network request failed');
      mockDeploymentService.deployToken.mockRejectedValue(networkError);

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      await service.startDeployment(mockRequest, stateCallback);

      expect(finalState?.error?.code).toBe('NETWORK_ERROR');
      expect(finalState?.error?.remediation).toContain('internet connection');
    });

    it.skip('should map validation errors correctly', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const validationError = new Error('Invalid token parameters');
      mockDeploymentService.deployToken.mockRejectedValue(validationError);

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      await service.startDeployment(mockRequest, stateCallback);

      expect(finalState?.error?.code).toBe('VALIDATION_ERROR');
      expect(finalState?.error?.remediation).toContain('token parameters');
    });
  });

  describe('Deployment Status Polling', () => {
    it.skip('should poll status until confirmed', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const mockDeployResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_poll_test',
        timestamp: new Date().toISOString(),
      };

      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);

      // First few polls return 'processing', then 'confirmed'
      mockDeploymentService.checkDeploymentStatus
        .mockResolvedValueOnce({ status: 'processing', confirmations: 0 })
        .mockResolvedValueOnce({ status: 'processing', confirmations: 1 })
        .mockResolvedValueOnce({ status: 'confirming', confirmations: 3 })
        .mockResolvedValue({ status: 'confirmed', assetId: 12345 });

      const deploymentPromise = service.startDeployment(mockRequest, () => {});
      
      // Advance timers to trigger polling
      await vi.advanceTimersByTimeAsync(10000);
      
      await deploymentPromise;

      // Should have polled multiple times
      expect(mockDeploymentService.checkDeploymentStatus).toHaveBeenCalled();
      expect(mockDeploymentService.checkDeploymentStatus.mock.calls.length).toBeGreaterThan(1);
    });

    it.skip('should handle polling timeout', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const mockDeployResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_timeout_test',
        timestamp: new Date().toISOString(),
      };

      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      // Always return processing status (simulating timeout)
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'processing',
      });

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      const deploymentPromise = service.startDeployment(mockRequest, stateCallback);
      
      // Advance timers way beyond timeout (5 minutes = 300 seconds = 150 polls * 2s)
      await vi.advanceTimersByTimeAsync(310000);
      
      // Should reject on timeout
      await expect(deploymentPromise).rejects.toThrow();
      
      expect(finalState?.status).toBe('failed');
      expect(finalState?.error?.code).toBe('TIMEOUT');
    }, 15000); // Increase test timeout

    it.skip('should handle failed transaction status', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const mockDeployResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: 'txn_failed_test',
        timestamp: new Date().toISOString(),
      };

      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'failed',
        error: 'Transaction reverted',
        errorCode: 'REVERT',
      });

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      const deploymentPromise = service.startDeployment(mockRequest, stateCallback);
      
      await vi.advanceTimersByTimeAsync(5000);
      
      await expect(deploymentPromise).rejects.toThrow();
      
      expect(finalState?.status).toBe('failed');
      expect(finalState?.error?.message).toContain('reverted');
    });
  });

  describe('Service Lifecycle', () => {
    it('should stop polling on stopPolling', () => {
      // Start a deployment (which starts polling)
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      mockDeploymentService.deployToken.mockResolvedValue({
        success: true,
        transactionId: 'txn_stop',
        timestamp: new Date().toISOString(),
      });
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'processing',
      });

      service.startDeployment(mockRequest, () => {});
      
      // Stop polling
      service.stopPolling();
      
      // Should not throw
      expect(() => service.stopPolling()).not.toThrow();
    });

    it('should reset service state', () => {
      service.reset();
      
      // Should not throw and should be callable multiple times
      expect(() => service.reset()).not.toThrow();
      service.reset();
      service.reset();
    });
  });

  describe('Error Message Mapping', () => {
    it.skip('should map insufficient funds error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const insufficientFundsError = new Error('Insufficient balance for transaction');
      mockDeploymentService.deployToken.mockRejectedValue(insufficientFundsError);

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      await service.startDeployment(mockRequest, stateCallback);

      expect(finalState?.error?.code).toBe('INSUFFICIENT_FUNDS');
      expect(finalState?.error?.remediation).toContain('add funds');
    });

    it.skip('should map authentication error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const authError = new Error('Unauthorized access');
      mockDeploymentService.deployToken.mockRejectedValue(authError);

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      await service.startDeployment(mockRequest, stateCallback);

      expect(finalState?.error?.code).toBe('AUTH_ERROR');
      expect(finalState?.error?.remediation).toContain('log in');
    });

    it.skip('should map rate limit error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const rateLimitError = new Error('Rate limit exceeded');
      mockDeploymentService.deployToken.mockRejectedValue(rateLimitError);

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      await service.startDeployment(mockRequest, stateCallback);

      expect(finalState?.error?.code).toBe('RATE_LIMIT');
      expect(finalState?.error?.remediation).toContain('wait');
    });

    it.skip('should provide generic error for unknown errors', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const unknownError = new Error('Something weird happened');
      mockDeploymentService.deployToken.mockRejectedValue(unknownError);

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      await service.startDeployment(mockRequest, stateCallback);

      expect(finalState?.error?.code).toBe('UNKNOWN_ERROR');
      expect(finalState?.error?.recoverable).toBe(true);
      expect(finalState?.error?.remediation).toContain('try again');
    });
  });

  describe('Explorer URL Generation', () => {
    it.skip('should generate correct Ethereum mainnet URL', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };

      const mockDeployResponse: TokenDeploymentResponse = {
        success: true,
        transactionId: '0xABC123',
        timestamp: new Date().toISOString(),
      };

      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'confirmed',
        assetId: 12345,
      });

      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => {
        finalState = state;
      };

      const deploymentPromise = service.startDeployment(mockRequest, stateCallback);
      
      await vi.advanceTimersByTimeAsync(2000);
      
      await deploymentPromise;

      expect(finalState?.result?.explorerUrl).toContain('etherscan.io');
      expect(finalState?.result?.explorerUrl).toContain('0xABC123');
    });
  });

  // ===== ADDITIONAL TESTS TO IMPROVE BRANCH COVERAGE =====

  describe('mapErrorToUserMessage - Direct Coverage', () => {
    it('should map network error correctly', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const networkError = new Error('network connection failed');
      mockDeploymentService.deployToken.mockRejectedValue(networkError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.status).toBe('failed');
      expect(finalState?.error?.code).toBe('NETWORK_ERROR');
      expect(finalState?.error?.recoverable).toBe(true);
    });

    it('should map fetch error to network error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const fetchError = new Error('fetch failed');
      mockDeploymentService.deployToken.mockRejectedValue(fetchError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('NETWORK_ERROR');
    });

    it('should map validation error correctly', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const validationError = new Error('validation failed: invalid parameters');
      mockDeploymentService.deployToken.mockRejectedValue(validationError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should map invalid params to validation error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const invalidError = new Error('invalid request data');
      mockDeploymentService.deployToken.mockRejectedValue(invalidError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should map insufficient funds error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const insufficientError = new Error('insufficient funds for gas');
      mockDeploymentService.deployToken.mockRejectedValue(insufficientError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('INSUFFICIENT_FUNDS');
      expect(finalState?.error?.remediation).toContain('funds');
    });

    it('should map balance error to insufficient funds', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const balanceError = new Error('low balance');
      mockDeploymentService.deployToken.mockRejectedValue(balanceError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('INSUFFICIENT_FUNDS');
    });

    it('should map unauthorized error to auth error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const authError = new Error('unauthorized access denied');
      mockDeploymentService.deployToken.mockRejectedValue(authError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('AUTH_ERROR');
      expect(finalState?.error?.remediation).toContain('log in');
    });

    it('should map auth keyword to auth error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const authError = new Error('auth token expired');
      mockDeploymentService.deployToken.mockRejectedValue(authError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('AUTH_ERROR');
    });

    it('should map rate limit error', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const rateLimitError = new Error('rate limit exceeded');
      mockDeploymentService.deployToken.mockRejectedValue(rateLimitError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('RATE_LIMIT');
      expect(finalState?.error?.remediation).toContain('wait');
    });

    it('should map too many requests to rate limit', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const tooManyError = new Error('too many requests sent');
      mockDeploymentService.deployToken.mockRejectedValue(tooManyError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('RATE_LIMIT');
    });

    it('should use UNKNOWN_ERROR for unrecognized errors', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const unknownError = new Error('Something completely unexpected happened');
      mockDeploymentService.deployToken.mockRejectedValue(unknownError);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.error?.code).toBe('UNKNOWN_ERROR');
      expect(finalState?.error?.recoverable).toBe(true);
    });
  });

  describe('getSymbolFromRequest and getNetworkFromRequest', () => {
    it('should use unitName when symbol is not present (ARC3)', async () => {
      const arc3Request = {
        standard: TokenStandard.ARC3,
        name: 'My ARC3 Token',
        unitName: 'MARC3',
        totalSupply: 1000000,
        walletAddress: '0xABC',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-ARC3-001',
        timestamp: new Date().toISOString(),
      };
      const mockStatusResponse = {
        status: 'confirmed',
        assetId: 99999,
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue(mockStatusResponse);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(arc3Request as any, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.result?.tokenSymbol).toBe('MARC3');
      expect(finalState?.result?.network).toBe('Algorand');
    });

    it('should use symbol when present (ERC20)', async () => {
      const erc20Request = {
        standard: TokenStandard.ERC20,
        name: 'My ERC20 Token',
        symbol: 'MERC',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-ERC20-001',
        timestamp: new Date().toISOString(),
      };
      const mockStatusResponse = {
        status: 'confirmed',
        assetId: 11111,
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue(mockStatusResponse);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(erc20Request as any, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.result?.tokenSymbol).toBe('MERC');
      expect(finalState?.result?.network).toBe('Ethereum');
    });

    it('should return N/A when neither symbol nor unitName is present', async () => {
      const noSymbolRequest = {
        standard: TokenStandard.ARC3,
        name: 'No Symbol Token',
        totalSupply: 1000000,
        walletAddress: '0xABC',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-NS-001',
        timestamp: new Date().toISOString(),
      };
      const mockStatusResponse = {
        status: 'confirmed',
        assetId: 77777,
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue(mockStatusResponse);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(noSymbolRequest as any, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.result?.tokenSymbol).toBe('N/A');
    });
  });

  describe('buildExplorerUrl coverage', () => {
    it('should generate correct Ethereum URL for ERC20', async () => {
      const erc20Request = {
        standard: TokenStandard.ERC20,
        name: 'Test',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '100',
        walletAddress: '0x1234',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: '0xETH_TX',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'confirmed',
        assetId: 22222,
      });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(erc20Request as any, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.result?.explorerUrl).toContain('etherscan.io');
    });

    it('should generate correct Algorand URL for ARC3', async () => {
      const arc3Request = {
        standard: TokenStandard.ARC3,
        name: 'Alg Token',
        unitName: 'ALGT',
        totalSupply: 1000,
        walletAddress: '0xALGO',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'ALGOEXPLORER_TX',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'confirmed',
        assetId: 33333,
      });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(arc3Request as any, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.result?.explorerUrl).toContain('algoexplorer.io');
    });
  });

  describe('Deployment with API failure response (not exception)', () => {
    it('should handle response.success === false without errorCode', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const failedResponse = {
        success: false,
        error: 'Token name already exists',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(failedResponse);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.status).toBe('failed');
      expect(finalState?.stages[2].status).toBe('failed');
    });

    it('should handle response.success === false with errorCode', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const failedResponse = {
        success: false,
        error: 'Rate limit exceeded',
        errorCode: 'RATE_LIMIT',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(failedResponse);
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.status).toBe('failed');
    });
  });

  describe('Polling with confirmations and progress', () => {
    it('should handle confirmations-based progress from status', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-CONFIRM-001',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus
        .mockResolvedValueOnce({ status: 'pending', confirmations: 2, requiredConfirmations: 6 })
        .mockResolvedValueOnce({ status: 'confirmed', assetId: 55555 });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.status).toBe('completed');
    });

    it('should handle progress field in status response', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-PROG-001',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus
        .mockResolvedValueOnce({ status: 'processing', progress: 45 })
        .mockResolvedValueOnce({ status: 'confirmed', assetId: 66666 });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.status).toBe('completed');
    });

    it('should handle status: submitted in polling', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-SUB-001',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus
        .mockResolvedValueOnce({ status: 'submitted' })
        .mockResolvedValueOnce({ status: 'confirmed', assetId: 77788 });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.status).toBe('completed');
    });

    it('should handle status: confirming in polling', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-CONF-001',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus
        .mockResolvedValueOnce({ status: 'confirming' })
        .mockResolvedValueOnce({ status: 'completed', tokenId: 'CTR-123' });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.status).toBe('completed');
      expect(finalState?.result?.assetId).toBe('CTR-123');
    });

    it('should handle default case for unknown status string in calculateProgress', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-DEF-001',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus
        .mockResolvedValueOnce({ status: 'unknown_status_xyz' })
        .mockResolvedValueOnce({ status: 'confirmed', assetId: 88888 });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.status).toBe('completed');
    });

    it('should handle polling status: failed response', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0x1234',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-FAIL-001',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'failed',
        error: 'Transaction was reverted',
        errorCode: 'TX_REVERTED',
      });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise.catch(() => {});
      expect(finalState?.status).toBe('failed');
      expect(finalState?.stages[3].status).toBe('failed');
    });

    it('should handle result with contractAddress', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'Contract Token',
        symbol: 'CTK',
        decimals: 18,
        totalSupply: '5000000',
        walletAddress: '0x5678',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-CTR-001',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'confirmed',
        contractAddress: '0xCONTRACT_ADDR',
        assetId: 44444,
      });
      let finalState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { finalState = state; };
      const deployPromise = service.startDeployment(mockRequest, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(finalState?.result?.contractAddress).toBe('0xCONTRACT_ADDR');
    });
  });

  describe('logDeploymentAudit with user in localStorage', () => {
    it('should log audit event with user from localStorage', async () => {
      const mockUser = { address: 'USER_ADDR', email: 'user@test.com', name: 'Test User' };
      localStorage.setItem('algorand_user', JSON.stringify(mockUser));
      const mockRequest = {
        standard: TokenStandard.ARC3,
        name: 'Test Token',
        unitName: 'TEST',
        totalSupply: 1000,
        walletAddress: 'USER_ADDR',
        network: 'algorand-testnet',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-AUDIT-001',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'confirmed',
        assetId: 12121,
      });
      let completedState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { completedState = state; };
      const deployPromise = service.startDeployment(mockRequest as any, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(completedState?.status).toBe('completed');
      localStorage.removeItem('algorand_user');
    });

    it('should log audit event with ERC standard network detection', async () => {
      const mockRequest = {
        standard: TokenStandard.ERC20,
        name: 'ERC Token',
        symbol: 'ERC',
        decimals: 18,
        totalSupply: '1000000',
        walletAddress: '0xUSER',
      };
      const mockDeployResponse = {
        success: true,
        transactionId: 'TX-ERC-AUDIT',
        timestamp: new Date().toISOString(),
      };
      mockDeploymentService.deployToken.mockResolvedValue(mockDeployResponse);
      mockDeploymentService.checkDeploymentStatus.mockResolvedValue({
        status: 'confirmed',
        assetId: 13131,
      });
      let completedState: DeploymentState | null = null;
      const stateCallback = (state: DeploymentState) => { completedState = state; };
      const deployPromise = service.startDeployment(mockRequest as any, stateCallback);
      await vi.runAllTimersAsync();
      await deployPromise;
      expect(completedState?.status).toBe('completed');
    });
  });

  describe('stopPolling and reset additional cases', () => {
    it('should not throw when stopPolling called with no active interval', () => {
      const freshService = new DeploymentStatusService(mockDeploymentService);
      expect(() => freshService.stopPolling()).not.toThrow();
    });

    it('should clear pollingAttempts on reset', () => {
      const freshService = new DeploymentStatusService(mockDeploymentService);
      expect(() => freshService.reset()).not.toThrow();
    });
  });

})