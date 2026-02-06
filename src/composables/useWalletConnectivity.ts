/**
 * Enhanced Wallet Connectivity Composable
 * Provides a high-level interface for wallet operations with improved UX
 * Integrates with WalletAdapterService for consistent error handling
 * Includes automatic reconnection and connection stability monitoring
 */

import { ref, computed, watch, onUnmounted } from 'vue';
import { useWalletManager, type NetworkId } from './useWalletManager';
import { useEVMWallet } from './useEVMWallet';
import { NETWORKS } from './useWalletManager';
import {
  getSupportedWallets,
  detectAvailableWallets,
  getWalletErrorMessage,
  validateNetworkSwitch,
  type WalletDetectionResult,
} from '../services/WalletAdapterService';
import { WalletConnectionState } from './walletState';
import { telemetryService } from '../services/TelemetryService';
import { walletRecoveryService } from '../services/WalletRecoveryService';

export interface WalletOption {
  id: string;
  name: string;
  available: boolean;
  installUrl?: string;
  logo?: string;
  chainType: 'AVM' | 'EVM';
}

export interface NetworkSwitchOptions {
  showWarnings: boolean;
  requiresReconnection: boolean;
  warnings: string[];
}

export interface ConnectionError {
  title: string;
  message: string;
  actions: string[];
  troubleshooting: string[];
  canRetry: boolean;
  alternativeWallets: WalletOption[];
}

/**
 * Enhanced wallet connectivity composable
 */
export function useWalletConnectivity() {
  const avmWallet = useWalletManager();
  const evmWallet = useEVMWallet();

  // State
  const selectedNetwork = ref<NetworkId>('voi-mainnet');
  const detectionResult = ref<WalletDetectionResult | null>(null);
  const isDetecting = ref(false);
  const connectionError = ref<ConnectionError | null>(null);
  const networkSwitchInProgress = ref(false);

  // Computed
  const chainType = computed(() => {
    const network = NETWORKS[selectedNetwork.value];
    return network?.chainType || 'AVM';
  });

  const activeWallet = computed(() => {
    return chainType.value === 'EVM' ? evmWallet : avmWallet;
  });

  const isConnected = computed(() => activeWallet.value.isConnected.value);
  
  const connectionState = computed(() => activeWallet.value.walletState.value.connectionState);

  const activeAddress = computed(() => activeWallet.value.activeAddress.value);

  const formattedAddress = computed(() => activeWallet.value.formattedAddress.value);

  const networkInfo = computed(() => NETWORKS[selectedNetwork.value]);

  const isConnecting = computed(() => {
    return (
      connectionState.value === WalletConnectionState.CONNECTING ||
      connectionState.value === WalletConnectionState.DETECTING ||
      connectionState.value === WalletConnectionState.RECONNECTING
    );
  });

  const isSwitchingNetwork = computed(() => {
    return connectionState.value === WalletConnectionState.SWITCHING_NETWORK || networkSwitchInProgress.value;
  });

  const hasFailed = computed(() => {
    return connectionState.value === WalletConnectionState.FAILED;
  });

  /**
   * Get available wallet options for current chain type
   */
  const availableWallets = computed((): WalletOption[] => {
    const wallets = getSupportedWallets(chainType.value);
    return wallets.map((wallet) => ({
      ...wallet,
      available: detectionResult.value?.walletIds.includes(wallet.id) || false,
      chainType: chainType.value,
    }));
  });

  /**
   * Get alternative wallets (those not currently selected but available)
   */
  const alternativeWallets = computed((): WalletOption[] => {
    const currentWalletId = chainType.value === 'EVM' 
      ? evmWallet.walletState.value.activeAddress 
      : avmWallet.activeWallet.value;
    
    return availableWallets.value.filter((w) => {
      return w.available && w.id !== currentWalletId;
    });
  });

  /**
   * Detect available wallets
   */
  const detectWallets = async () => {
    isDetecting.value = true;
    telemetryService.track('wallet_detection_started', { chain_type: chainType.value });

    try {
      const result = await detectAvailableWallets(chainType.value);
      detectionResult.value = result;

      telemetryService.track('wallet_detection_completed', {
        chain_type: chainType.value,
        available_count: result.walletIds.length,
        available_wallets: result.walletIds,
      });

      return result;
    } catch (error) {
      console.error('Wallet detection failed:', error);
      telemetryService.track('wallet_detection_failed', {
        chain_type: chainType.value,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      isDetecting.value = false;
    }
  };

  /**
   * Connect wallet with enhanced error handling
   */
  const connect = async (walletId?: string) => {
    connectionError.value = null;
    const startTime = Date.now();

    telemetryService.track('wallet_connect_attempt', {
      wallet_id: walletId,
      network: selectedNetwork.value,
      chain_type: chainType.value,
    });

    try {
      await activeWallet.value.connect(walletId);

      const duration = Date.now() - startTime;
      telemetryService.track('wallet_connect_success', {
        wallet_id: walletId || 'auto',
        network: selectedNetwork.value,
        duration_ms: duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Wallet connection failed:', error);

      // Parse error and create user-friendly message
      const lastError = activeWallet.value.walletState.value.lastError;
      if (lastError) {
        const errorInfo = getWalletErrorMessage(lastError);
        connectionError.value = {
          ...errorInfo,
          canRetry: true,
          alternativeWallets: alternativeWallets.value,
        };
      } else {
        connectionError.value = {
          title: 'Connection Failed',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          actions: ['Try again', 'Refresh the page'],
          troubleshooting: [],
          canRetry: true,
          alternativeWallets: alternativeWallets.value,
        };
      }

      telemetryService.track('wallet_connect_failed', {
        wallet_id: walletId,
        network: selectedNetwork.value,
        error_type: lastError?.type,
        error_message: lastError?.message,
        duration_ms: duration,
      });

      throw error;
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnect = async () => {
    connectionError.value = null;

    telemetryService.track('wallet_disconnect_attempt', {
      network: selectedNetwork.value,
      chain_type: chainType.value,
    });

    try {
      await activeWallet.value.disconnect();

      telemetryService.track('wallet_disconnect_success', {
        network: selectedNetwork.value,
      });
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      telemetryService.track('wallet_disconnect_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  /**
   * Switch network with validation
   */
  const switchNetwork = async (
    networkId: NetworkId
  ): Promise<NetworkSwitchOptions> => {
    const fromNetwork = selectedNetwork.value;
    
    // Validate the switch
    const validation = validateNetworkSwitch(fromNetwork, networkId);
    
    if (!validation.valid) {
      throw new Error(validation.warnings.join('. '));
    }

    networkSwitchInProgress.value = true;
    connectionError.value = null;

    telemetryService.track('network_switch_attempt', {
      from_network: fromNetwork,
      to_network: networkId,
      cross_chain: validation.crossChain,
      requires_reconnection: validation.requiresReconnection,
    });

    try {
      // Handle network switching based on chain type
      if (chainType.value === 'EVM') {
        // For EVM, we need to handle network switching differently
        // since switchNetwork expects EVMNetworkId
        const targetNetwork = NETWORKS[networkId];
        if (targetNetwork.chainType !== 'EVM') {
          throw new Error('Cannot switch EVM wallet to non-EVM network');
        }
        // For now, EVM network switching requires disconnection and reconnection
        // as cross-chain switches are not directly supported
        selectedNetwork.value = networkId;
      } else {
        // AVM wallet supports direct network switching
        await avmWallet.switchNetwork(networkId);
        selectedNetwork.value = networkId;
      }

      telemetryService.track('network_switch_success', {
        from_network: fromNetwork,
        to_network: networkId,
      });

      return {
        showWarnings: validation.warnings.length > 0,
        requiresReconnection: validation.requiresReconnection,
        warnings: validation.warnings,
      };
    } catch (error) {
      console.error('Network switch failed:', error);

      const lastError = activeWallet.value.walletState.value.lastError;
      if (lastError) {
        const errorInfo = getWalletErrorMessage(lastError);
        connectionError.value = {
          ...errorInfo,
          canRetry: true,
          alternativeWallets: [],
        };
      }

      telemetryService.track('network_switch_failed', {
        from_network: fromNetwork,
        to_network: networkId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    } finally {
      networkSwitchInProgress.value = false;
    }
  };

  /**
   * Retry failed connection
   */
  const retryConnection = async () => {
    connectionError.value = null;
    const walletId = chainType.value === 'EVM' 
      ? 'metamask' 
      : avmWallet.activeWallet.value || undefined;

    telemetryService.track('wallet_retry_connection', {
      wallet_id: walletId,
      network: selectedNetwork.value,
    });

    try {
      await connect(walletId);
    } catch (error) {
      // Error already handled in connect()
    }
  };

  /**
   * Clear connection error
   */
  const clearError = () => {
    connectionError.value = null;
  };

  /**
   * Refresh account and balance
   */
  const refreshAccount = async () => {
    telemetryService.track('account_refresh_attempt', {
      network: selectedNetwork.value,
      address: activeAddress.value,
    });

    try {
      if (chainType.value === 'EVM') {
        // EVM wallet doesn't have updateWalletState, handle refresh differently
        // The wallet state is automatically managed by the EVM wallet
      } else if (avmWallet.updateWalletState) {
        await avmWallet.updateWalletState();
      }

      telemetryService.track('account_refresh_success', {
        network: selectedNetwork.value,
      });
    } catch (error) {
      console.error('Account refresh failed:', error);
      telemetryService.track('account_refresh_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Initialize - detect wallets on mount and setup recovery
   */
  const initialize = async () => {
    // Restore network from localStorage
    const savedNetwork = localStorage.getItem('selected_network') as NetworkId;
    if (savedNetwork && NETWORKS[savedNetwork]) {
      selectedNetwork.value = savedNetwork;
    }

    // Detect available wallets
    await detectWallets();

    // Setup auto-reconnection
    walletRecoveryService.setReconnectCallback(async (walletId) => {
      await connect(walletId)
    })

    // Start health checks if already connected
    if (isConnected.value) {
      startConnectionMonitoring()
    }
  };

  /**
   * Start monitoring connection health
   */
  const startConnectionMonitoring = () => {
    walletRecoveryService.startHealthChecks(
      () => isConnected.value,
      (walletId) => {
        telemetryService.track('wallet_connection_lost', {
          wallet_id: walletId,
          network: selectedNetwork.value
        })
        // Attempt automatic recovery
        walletRecoveryService.attemptRecovery(walletId)
      },
      () => {
        const walletId = chainType.value === 'EVM' ? 'metamask' : avmWallet.activeWallet.value
        return walletId || undefined
      }
    )
  }

  /**
   * Stop monitoring connection health
   */
  const stopConnectionMonitoring = () => {
    walletRecoveryService.stopHealthChecks()
  }

  // Watch for network changes and re-detect wallets
  watch(selectedNetwork, async (newNetwork) => {
    localStorage.setItem('selected_network', newNetwork);
    await detectWallets();
  });

  // Watch connection state to manage monitoring
  watch(isConnected, (connected) => {
    if (connected) {
      startConnectionMonitoring()
    } else {
      stopConnectionMonitoring()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopConnectionMonitoring()
  })

  return {
    // State
    selectedNetwork,
    isConnected,
    connectionState,
    activeAddress,
    formattedAddress,
    networkInfo,
    isConnecting,
    isSwitchingNetwork,
    hasFailed,
    connectionError,
    availableWallets,
    alternativeWallets,
    isDetecting,
    chainType,

    // Actions
    initialize,
    detectWallets,
    connect,
    disconnect,
    switchNetwork,
    retryConnection,
    refreshAccount,
    clearError,

    // Wallet instances
    avmWallet,
    evmWallet,
  };
}
