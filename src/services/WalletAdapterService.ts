/**
 * Unified Wallet Adapter Service
 * Provides a consistent interface for wallet operations across AVM and EVM chains
 * with enhanced error handling, retry logic, and telemetry
 */

import type { NetworkId, NetworkInfo } from '../composables/useWalletManager';
import { NETWORKS } from '../composables/useWalletManager';
import {
  WalletErrorType,
  type WalletError,
  getTroubleshootingSteps,
} from '../composables/walletState';
import { telemetryService } from './TelemetryService';

export interface WalletDetectionResult {
  available: boolean;
  walletIds: string[];
  errors: Map<string, string>;
}

export interface NetworkSwitchResult {
  success: boolean;
  previousNetwork: NetworkId;
  currentNetwork: NetworkId;
  requiresReconnection: boolean;
  error?: WalletError;
}

export interface BalanceRefreshResult {
  success: boolean;
  balance?: string;
  nativeBalance?: string;
  timestamp: Date;
  error?: WalletError;
}

/**
 * User-friendly error messages for wallet operations
 */
export const WALLET_ERROR_MESSAGES = {
  [WalletErrorType.PROVIDER_NOT_FOUND]: {
    title: 'Wallet Not Detected',
    message: 'Please ensure your wallet extension is installed and enabled.',
    actions: ['Install wallet', 'Refresh page', 'Try another wallet'],
  },
  [WalletErrorType.CONNECTION_REJECTED]: {
    title: 'Connection Declined',
    message: 'You declined the wallet connection request.',
    actions: ['Open your wallet and approve the connection', 'Try connecting again'],
  },
  [WalletErrorType.CONNECTION_TIMEOUT]: {
    title: 'Connection Timeout',
    message: 'The wallet connection request timed out.',
    actions: ['Check your internet connection', 'Make sure your wallet is responding', 'Try again'],
  },
  [WalletErrorType.NETWORK_SWITCH_FAILED]: {
    title: 'Network Switch Failed',
    message: 'Unable to switch to the requested network.',
    actions: ['Check if the network is supported by your wallet', 'Try switching manually in your wallet', 'Refresh and reconnect'],
  },
  [WalletErrorType.NETWORK_MISMATCH]: {
    title: 'Network Mismatch',
    message: 'Your wallet is connected to a different network.',
    actions: ['Switch to the correct network in your wallet', 'The UI network must match your wallet network'],
  },
  [WalletErrorType.WALLET_LOCKED]: {
    title: 'Wallet Locked',
    message: 'Your wallet is locked. Please unlock it to continue.',
    actions: ['Unlock your wallet', 'Enter your password in the wallet app'],
  },
  [WalletErrorType.PERMISSION_DENIED]: {
    title: 'Permission Denied',
    message: 'The wallet denied the necessary permissions.',
    actions: ['Grant permissions in your wallet', 'Check wallet settings for blocked sites'],
  },
  [WalletErrorType.UNKNOWN]: {
    title: 'Connection Error',
    message: 'An unexpected error occurred while connecting to the wallet.',
    actions: ['Try refreshing the page', 'Check your wallet for errors', 'Contact support if the issue persists'],
  },
};

/**
 * Get supported wallets for a given chain type
 */
export function getSupportedWallets(chainType: 'AVM' | 'EVM'): Array<{
  id: string;
  name: string;
  installUrl?: string;
  logo?: string;
}> {
  if (chainType === 'AVM') {
    return [
      {
        id: 'pera',
        name: 'Pera Wallet',
        installUrl: 'https://perawallet.app',
        logo: '/wallets/pera.svg',
      },
      {
        id: 'defly',
        name: 'Defly Wallet',
        installUrl: 'https://defly.app',
        logo: '/wallets/defly.svg',
      },
      {
        id: 'exodus',
        name: 'Exodus Wallet',
        installUrl: 'https://www.exodus.com/download',
        logo: '/wallets/exodus.svg',
      },
      {
        id: 'kibisis',
        name: 'Kibisis',
        installUrl: 'https://kibis.is',
        logo: '/wallets/kibisis.svg',
      },
      {
        id: 'lute',
        name: 'Lute Connect',
        installUrl: 'https://lute.app',
        logo: '/wallets/lute.svg',
      },
    ];
  } else {
    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        installUrl: 'https://metamask.io/download',
        logo: '/wallets/metamask.svg',
      },
      {
        id: 'walletconnect',
        name: 'WalletConnect',
        installUrl: 'https://walletconnect.com',
        logo: '/wallets/walletconnect.svg',
      },
    ];
  }
}

/**
 * Detect available wallets
 */
export async function detectAvailableWallets(chainType: 'AVM' | 'EVM'): Promise<WalletDetectionResult> {
  const result: WalletDetectionResult = {
    available: false,
    walletIds: [],
    errors: new Map(),
  };

  const supportedWallets = getSupportedWallets(chainType);

  for (const wallet of supportedWallets) {
    try {
      // For EVM wallets, check window.ethereum
      if (chainType === 'EVM') {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
          result.walletIds.push(wallet.id);
          result.available = true;
        } else {
          result.errors.set(wallet.id, 'Provider not found');
        }
      }
      // For AVM wallets, this would integrate with @txnlab/use-wallet-vue
      // The detection is already handled in useWalletManager
    } catch (error) {
      result.errors.set(wallet.id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  telemetryService.track('wallet_detection_completed', {
    chain_type: chainType,
    available_count: result.walletIds.length,
    total_checked: supportedWallets.length,
  });

  return result;
}

/**
 * Get user-friendly error message for wallet error
 */
export function getWalletErrorMessage(error: WalletError): {
  title: string;
  message: string;
  actions: string[];
  troubleshooting: string[];
} {
  const errorInfo = WALLET_ERROR_MESSAGES[error.type] || WALLET_ERROR_MESSAGES[WalletErrorType.UNKNOWN];
  const troubleshooting = getTroubleshootingSteps(error.type);

  return {
    title: errorInfo.title,
    message: error.message || errorInfo.message,
    actions: errorInfo.actions,
    troubleshooting,
  };
}

/**
 * Validate network switch requirements
 */
export function validateNetworkSwitch(
  fromNetwork: NetworkId,
  toNetwork: NetworkId
): {
  valid: boolean;
  requiresReconnection: boolean;
  crossChain: boolean;
  warnings: string[];
} {
  const from = NETWORKS[fromNetwork];
  const to = NETWORKS[toNetwork];

  if (!from || !to) {
    return {
      valid: false,
      requiresReconnection: false,
      crossChain: false,
      warnings: ['Invalid network configuration'],
    };
  }

  const crossChain = from.chainType !== to.chainType;
  const requiresReconnection = crossChain;
  const warnings: string[] = [];

  if (crossChain) {
    warnings.push(`Switching from ${from.chainType} to ${to.chainType} requires disconnecting your wallet`);
  }

  if (to.isTestnet && !from.isTestnet) {
    warnings.push('You are switching to a testnet. Assets on this network have no real value.');
  }

  if (!to.isTestnet && from.isTestnet) {
    warnings.push('You are switching to mainnet. Be careful when transacting with real assets.');
  }

  return {
    valid: true,
    requiresReconnection,
    crossChain,
    warnings,
  };
}

/**
 * Format network info for display
 */
export function formatNetworkInfo(network: NetworkInfo): {
  name: string;
  badge: string;
  badgeColor: string;
  chainType: string;
  details: string;
} {
  return {
    name: network.displayName,
    badge: network.isTestnet ? 'Testnet' : 'Mainnet',
    badgeColor: network.isTestnet ? 'yellow' : 'green',
    chainType: network.chainType,
    details:
      network.chainType === 'AVM'
        ? `Genesis: ${network.genesisId}`
        : `Chain ID: ${network.chainId}`,
  };
}

/**
 * Create a timeout wrapper for wallet operations
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Retry an operation with telemetry
 */
export async function retryWithTelemetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      telemetryService.track(`${operationName}_success`, {
        attempt,
        duration_ms: duration,
      });

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      telemetryService.track(`${operationName}_retry`, {
        attempt,
        error: lastError.message,
        will_retry: attempt < maxRetries,
      });

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  telemetryService.track(`${operationName}_failed`, {
    attempts: maxRetries,
    error: lastError?.message,
  });

  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}
