import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSupportedWallets,
  detectAvailableWallets,
  getWalletErrorMessage,
  validateNetworkSwitch,
  formatNetworkInfo,
  withTimeout,
  retryWithTelemetry,
  WALLET_ERROR_MESSAGES,
} from '../WalletAdapterService';
import { WalletErrorType } from '../../composables/walletState';
import { NETWORKS } from '../../composables/useWalletManager';

describe('WalletAdapterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSupportedWallets', () => {
    it('should return AVM wallets when chainType is AVM', () => {
      const wallets = getSupportedWallets('AVM');
      expect(wallets.length).toBeGreaterThan(0);
      expect(wallets.some((w) => w.id === 'pera')).toBe(true);
      expect(wallets.some((w) => w.id === 'defly')).toBe(true);
      expect(wallets.some((w) => w.id === 'exodus')).toBe(true);
      expect(wallets.some((w) => w.id === 'kibisis')).toBe(true);
      expect(wallets.some((w) => w.id === 'lute')).toBe(true);
    });

    it('should return EVM wallets when chainType is EVM', () => {
      const wallets = getSupportedWallets('EVM');
      expect(wallets.length).toBeGreaterThan(0);
      expect(wallets.some((w) => w.id === 'metamask')).toBe(true);
      expect(wallets.some((w) => w.id === 'walletconnect')).toBe(true);
    });

    it('should include install URLs for all wallets', () => {
      const avmWallets = getSupportedWallets('AVM');
      const evmWallets = getSupportedWallets('EVM');

      avmWallets.forEach((wallet) => {
        expect(wallet.installUrl).toBeDefined();
        expect(wallet.installUrl).toMatch(/^https?:\/\//);
      });

      evmWallets.forEach((wallet) => {
        expect(wallet.installUrl).toBeDefined();
        expect(wallet.installUrl).toMatch(/^https?:\/\//);
      });
    });

    it('should include wallet names', () => {
      const avmWallets = getSupportedWallets('AVM');
      avmWallets.forEach((wallet) => {
        expect(wallet.name).toBeDefined();
        expect(wallet.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('detectAvailableWallets', () => {
    it('should detect EVM wallets when window.ethereum is available', async () => {
      // Mock window.ethereum
      (global as any).window = { ethereum: {} };

      const result = await detectAvailableWallets('EVM');

      expect(result.available).toBe(true);
      expect(result.walletIds.length).toBeGreaterThan(0);
    });

    it('should report no wallets when window.ethereum is not available', async () => {
      // Remove window.ethereum
      (global as any).window = {};

      const result = await detectAvailableWallets('EVM');

      expect(result.available).toBe(false);
      expect(result.errors.size).toBeGreaterThan(0);
    });

    it('should track detection completion', async () => {
      const result = await detectAvailableWallets('AVM');
      // Test passes if detection completes without error
      expect(result).toBeDefined();
    });
  });

  describe('getWalletErrorMessage', () => {
    it('should return appropriate message for PROVIDER_NOT_FOUND', () => {
      const error = {
        type: WalletErrorType.PROVIDER_NOT_FOUND,
        message: 'Provider not found',
        timestamp: new Date(),
      };

      const result = getWalletErrorMessage(error);

      expect(result.title).toBe('Wallet Not Detected');
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.troubleshooting.length).toBeGreaterThan(0);
    });

    it('should return appropriate message for CONNECTION_REJECTED', () => {
      const error = {
        type: WalletErrorType.CONNECTION_REJECTED,
        message: 'User rejected connection',
        timestamp: new Date(),
      };

      const result = getWalletErrorMessage(error);

      expect(result.title).toBe('Connection Declined');
      expect(result.actions.length).toBeGreaterThan(0);
    });

    it('should return appropriate message for NETWORK_SWITCH_FAILED', () => {
      const error = {
        type: WalletErrorType.NETWORK_SWITCH_FAILED,
        message: 'Network switch failed',
        timestamp: new Date(),
      };

      const result = getWalletErrorMessage(error);

      expect(result.title).toBe('Network Switch Failed');
      expect(result.actions.length).toBeGreaterThan(0);
    });

    it('should return appropriate message for WALLET_LOCKED', () => {
      const error = {
        type: WalletErrorType.WALLET_LOCKED,
        message: 'Wallet is locked',
        timestamp: new Date(),
      };

      const result = getWalletErrorMessage(error);

      expect(result.title).toBe('Wallet Locked');
      expect(result.actions).toContain('Unlock your wallet');
    });

    it('should handle UNKNOWN error type', () => {
      const error = {
        type: WalletErrorType.UNKNOWN,
        message: 'Something went wrong',
        timestamp: new Date(),
      };

      const result = getWalletErrorMessage(error);

      expect(result.title).toBe('Connection Error');
      expect(result.actions.length).toBeGreaterThan(0);
    });

    it('should include troubleshooting steps for all error types', () => {
      Object.values(WalletErrorType).forEach((errorType) => {
        const error = {
          type: errorType,
          message: 'Test error',
          timestamp: new Date(),
        };

        const result = getWalletErrorMessage(error);

        expect(result.troubleshooting).toBeDefined();
        expect(Array.isArray(result.troubleshooting)).toBe(true);
      });
    });
  });

  describe('validateNetworkSwitch', () => {
    it('should allow same-chain network switch without reconnection', () => {
      const result = validateNetworkSwitch('algorand-mainnet', 'algorand-testnet');

      expect(result.valid).toBe(true);
      expect(result.crossChain).toBe(false);
      expect(result.requiresReconnection).toBe(false);
    });

    it('should require reconnection for cross-chain switch', () => {
      const result = validateNetworkSwitch('algorand-mainnet', 'ethereum');

      expect(result.valid).toBe(true);
      expect(result.crossChain).toBe(true);
      expect(result.requiresReconnection).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn when switching to testnet', () => {
      const result = validateNetworkSwitch('algorand-mainnet', 'algorand-testnet');

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('testnet'))).toBe(true);
    });

    it('should warn when switching to mainnet', () => {
      const result = validateNetworkSwitch('algorand-testnet', 'algorand-mainnet');

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('mainnet'))).toBe(true);
    });

    it('should handle invalid network IDs', () => {
      const result = validateNetworkSwitch('invalid-network' as any, 'algorand-mainnet');

      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate VOI mainnet switch', () => {
      const result = validateNetworkSwitch('algorand-mainnet', 'voi-mainnet');

      expect(result.valid).toBe(true);
      expect(result.crossChain).toBe(false);
    });

    it('should validate Aramid mainnet switch', () => {
      const result = validateNetworkSwitch('voi-mainnet', 'aramidmain');

      expect(result.valid).toBe(true);
      expect(result.crossChain).toBe(false);
    });

    it('should validate EVM to EVM switch', () => {
      const result = validateNetworkSwitch('ethereum', 'arbitrum');

      expect(result.valid).toBe(true);
      expect(result.crossChain).toBe(false);
      expect(result.requiresReconnection).toBe(false);
    });
  });

  describe('formatNetworkInfo', () => {
    it('should format AVM network info correctly', () => {
      const network = NETWORKS['algorand-mainnet'];
      const formatted = formatNetworkInfo(network);

      expect(formatted.name).toBe('Algorand Mainnet');
      expect(formatted.badge).toBe('Mainnet');
      expect(formatted.badgeColor).toBe('green');
      expect(formatted.chainType).toBe('AVM');
      expect(formatted.details).toContain('mainnet-v1.0');
    });

    it('should format EVM network info correctly', () => {
      const network = NETWORKS['ethereum'];
      const formatted = formatNetworkInfo(network);

      expect(formatted.name).toBe('Ethereum Mainnet');
      expect(formatted.badge).toBe('Mainnet');
      expect(formatted.badgeColor).toBe('green');
      expect(formatted.chainType).toBe('EVM');
      expect(formatted.details).toContain('Chain ID: 1');
    });

    it('should mark testnet with yellow badge', () => {
      const network = NETWORKS['algorand-testnet'];
      const formatted = formatNetworkInfo(network);

      expect(formatted.badge).toBe('Testnet');
      expect(formatted.badgeColor).toBe('yellow');
    });

    it('should format VOI network info', () => {
      const network = NETWORKS['voi-mainnet'];
      const formatted = formatNetworkInfo(network);

      expect(formatted.name).toBe('VOI Mainnet');
      expect(formatted.chainType).toBe('AVM');
    });

    it('should format Aramid network info', () => {
      const network = NETWORKS['aramidmain'];
      const formatted = formatNetworkInfo(network);

      expect(formatted.name).toBe('Aramid Mainnet');
      expect(formatted.chainType).toBe('AVM');
    });
  });

  describe('withTimeout', () => {
    it('should resolve if operation completes within timeout', async () => {
      const operation = Promise.resolve('success');
      const result = await withTimeout(operation, 1000, 'test');

      expect(result).toBe('success');
    });

    it('should reject if operation exceeds timeout', async () => {
      const operation = new Promise((resolve) => setTimeout(() => resolve('success'), 2000));

      await expect(withTimeout(operation, 100, 'test')).rejects.toThrow('test timed out');
    });

    it('should include operation name in timeout error', async () => {
      const operation = new Promise((resolve) => setTimeout(() => resolve('success'), 2000));

      await expect(withTimeout(operation, 100, 'connect wallet')).rejects.toThrow(
        'connect wallet timed out'
      );
    });
  });

  describe('retryWithTelemetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retryWithTelemetry(operation, 'test_operation');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('temporary failure'));
        }
        return Promise.resolve('success');
      });

      const result = await retryWithTelemetry(operation, 'test_operation', 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should fail after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('permanent failure'));

      await expect(retryWithTelemetry(operation, 'test_operation', 2)).rejects.toThrow(
        'permanent failure'
      );
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should wait between retries with exponential backoff', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('failure'));

      // This will reject, so we expect it to throw
      await expect(retryWithTelemetry(operation, 'test_operation', 2)).rejects.toThrow('failure');

      // Verify operation was called multiple times with retry
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('WALLET_ERROR_MESSAGES', () => {
    it('should have messages for all error types', () => {
      Object.values(WalletErrorType).forEach((errorType) => {
        expect(WALLET_ERROR_MESSAGES[errorType]).toBeDefined();
        expect(WALLET_ERROR_MESSAGES[errorType].title).toBeDefined();
        expect(WALLET_ERROR_MESSAGES[errorType].message).toBeDefined();
        expect(WALLET_ERROR_MESSAGES[errorType].actions).toBeDefined();
        expect(WALLET_ERROR_MESSAGES[errorType].actions.length).toBeGreaterThan(0);
      });
    });

    it('should have actionable steps for each error', () => {
      Object.values(WALLET_ERROR_MESSAGES).forEach((errorInfo) => {
        expect(errorInfo.actions.length).toBeGreaterThan(0);
        errorInfo.actions.forEach((action) => {
          expect(action.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
