import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, type WalletAccount } from "@txnlab/use-wallet-vue";
import { useAuthStore } from "../stores/auth";
import { AUTH_STORAGE_KEYS, WALLET_CONNECTION_STATE } from "../constants/auth";
import { telemetryService } from "../services/TelemetryService";
import { WalletConnectionState, WalletErrorType, type WalletError, parseWalletError, retryWithBackoff, DEFAULT_RETRY_CONFIG, getTroubleshootingSteps } from "./walletState";
import { saveWalletSession, loadWalletSession, clearWalletSession, updateSessionActivity, logConnectionEvent } from "../services/WalletSessionService";

export interface WalletState {
  isConnected: boolean;
  activeAddress: string | null;
  activeWallet: string | null;
  accounts: WalletAccount[];
  isConnecting: boolean;
  error: string | null;
  connectionState: WalletConnectionState;
  lastError: WalletError | null;
  balanceLastUpdated: Date | null;
}

export type ChainType = "AVM" | "EVM";

export type AVMNetworkId = "algorand-mainnet" | "voi-mainnet" | "aramidmain" | "algorand-testnet" | "dockernet";
export type EVMNetworkId = "ethereum" | "arbitrum" | "base" | "sepolia";
export type NetworkId = AVMNetworkId | EVMNetworkId;

export interface BaseNetworkInfo {
  id: NetworkId;
  name: string;
  displayName: string;
  isTestnet: boolean;
  isAdvanced?: boolean; // For networks like VOI/Aramid that are mainnets but advanced
  chainType: ChainType;
}

export interface AVMNetworkInfo extends BaseNetworkInfo {
  chainType: "AVM";
  algodUrl: string;
  genesisId: string;
}

export interface EVMNetworkInfo extends BaseNetworkInfo {
  chainType: "EVM";
  chainId: number;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export type NetworkInfo = AVMNetworkInfo | EVMNetworkInfo;

export const AVM_NETWORKS: Record<AVMNetworkId, AVMNetworkInfo> = {
  "algorand-mainnet": {
    id: "algorand-mainnet",
    name: "algorand-mainnet",
    displayName: "Algorand Mainnet",
    algodUrl: "https://mainnet-api.4160.nodely.dev",
    genesisId: "mainnet-v1.0",
    isTestnet: false,
    chainType: "AVM",
  },
  "voi-mainnet": {
    id: "voi-mainnet",
    name: "voi-mainnet",
    displayName: "VOI Mainnet",
    algodUrl: "https://mainnet-api.voi.nodely.dev",
    genesisId: "voimain-v1.0",
    isTestnet: false,
    isAdvanced: true,
    chainType: "AVM",
  },
  aramidmain: {
    id: "aramidmain",
    name: "aramidmain",
    displayName: "Aramid Mainnet",
    algodUrl: "https://algod.aramidmain.a-wallet.net",
    genesisId: "aramidmain-v1.0",
    isTestnet: false,
    isAdvanced: true,
    chainType: "AVM",
  },
  "algorand-testnet": {
    id: "algorand-testnet",
    name: "algorand-testnet",
    displayName: "Algorand Testnet",
    algodUrl: "https://testnet-api.4160.nodely.dev",
    genesisId: "testnet-v1.0",
    isTestnet: true,
    chainType: "AVM",
  },
  dockernet: {
    id: "dockernet",
    name: "dockernet",
    displayName: "Dockernet (Local)",
    algodUrl: "http://localhost:4001",
    genesisId: "dockernet-v1",
    isTestnet: true,
    chainType: "AVM",
  },
};

export const EVM_NETWORKS: Record<EVMNetworkId, EVMNetworkInfo> = {
  ethereum: {
    id: "ethereum",
    name: "ethereum",
    displayName: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://ethereum.publicnode.com",
    blockExplorerUrl: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    isTestnet: false,
    chainType: "EVM",
  },
  arbitrum: {
    id: "arbitrum",
    name: "arbitrum",
    displayName: "Arbitrum One",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorerUrl: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    isTestnet: false,
    chainType: "EVM",
  },
  base: {
    id: "base",
    name: "base",
    displayName: "Base",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    blockExplorerUrl: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    isTestnet: false,
    chainType: "EVM",
  },
  sepolia: {
    id: "sepolia",
    name: "sepolia",
    displayName: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    isTestnet: true,
    chainType: "EVM",
  },
};

export const NETWORKS: Record<NetworkId, NetworkInfo> = {
  ...AVM_NETWORKS,
  ...EVM_NETWORKS,
};

/**
 * Composable for managing wallet connections and network switching
 * Integrates with @txnlab/use-wallet-vue and provides resilient connection handling
 */
export function useWalletManager() {
  let wallet: any = null;
  let walletAvailable = true;
  try {
    wallet = useWallet();
  } catch (error) {
    console.warn("Wallet manager not available:", error);
    walletAvailable = false;
  }

  if (!walletAvailable) {
    // Return mock implementation
    return {
      isConnected: computed(() => false),
      activeAddress: computed(() => null),
      activeWallet: computed(() => null),
      accounts: computed(() => []),
      networkInfo: computed(() => NETWORKS["algorand-mainnet"]),
      formattedAddress: computed(() => null),
      walletState: ref({
        isConnected: false,
        activeAddress: null,
        activeWallet: null,
        accounts: [],
        isConnecting: false,
        error: null,
        connectionState: WalletConnectionState.DISCONNECTED,
        lastError: null,
        balanceLastUpdated: null,
      }),
      currentNetwork: ref<NetworkId>("algorand-mainnet"),
      connect: async () => {
        throw new Error("Wallet manager not available");
      },
      disconnect: async () => {},
      switchNetwork: async () => {},
      reconnect: async () => {},
      retryConnection: async () => {},
    };
  }

  const authStore = useAuthStore();

  const walletState = ref<WalletState>({
    isConnected: false,
    activeAddress: null,
    activeWallet: null,
    accounts: [],
    isConnecting: false,
    error: null,
    connectionState: WalletConnectionState.DISCONNECTED,
    lastError: null,
    balanceLastUpdated: null,
  });

  // Load persisted network from localStorage, default to algorand-testnet (AC #1-2)
  const loadPersistedNetwork = (): NetworkId => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_NETWORK)
      if (stored && NETWORKS[stored as NetworkId]) {
        return stored as NetworkId
      }
    } catch (error) {
      console.warn('Failed to load persisted network:', error)
    }
    return 'algorand-testnet' // Default to Algorand testnet per AC #1
  }

  const currentNetwork = ref<NetworkId>(loadPersistedNetwork());
  const isReconnecting = ref(false);
  const previousState = ref<WalletConnectionState>(WalletConnectionState.DISCONNECTED);

  // Computed properties
  const isConnected = computed(() => (walletAvailable ? !!wallet.activeAccount.value : false));
  const activeAddress = computed(() => walletState.value.activeAddress);
  const activeWallet = computed(() => walletState.value.activeWallet);
  const accounts = computed(() => walletState.value.accounts);
  const networkInfo = computed(() => NETWORKS[currentNetwork.value]);
  const formattedAddress = computed(() => {
    if (!activeAddress.value) return null;
    return `${activeAddress.value.slice(0, 6)}...${activeAddress.value.slice(-4)}`;
  });

  /**
   * Transition wallet state and track telemetry
   */
  const transitionState = (newState: WalletConnectionState, error?: WalletError) => {
    const oldState = walletState.value.connectionState;
    previousState.value = oldState;
    walletState.value.connectionState = newState;

    if (error) {
      walletState.value.lastError = error;
      walletState.value.error = error.message;
    } else if (newState !== WalletConnectionState.FAILED) {
      walletState.value.lastError = null;
      walletState.value.error = null;
    }

    // Track state transition
    telemetryService.trackWalletStateTransition({
      fromState: oldState,
      toState: newState,
      walletId: walletState.value.activeWallet || undefined,
      network: currentNetwork.value,
    });

    console.log(`[Wallet] State transition: ${oldState} → ${newState}`);
  };

  /**
   * Update wallet state from the wallet manager
   */
  const updateWalletState = () => {
    try {
      const activeAccount = wallet.activeAccount.value;
      const walletAccounts = wallet.activeWallet.value?.accounts || [];

      const wasConnected = walletState.value.isConnected;
      const isNowConnected = !!activeAccount;

      walletState.value = {
        ...walletState.value,
        isConnected: isNowConnected,
        activeAddress: activeAccount?.address || null,
        activeWallet: wallet.activeWallet.value?.id || null,
        accounts: walletAccounts,
        isConnecting: false,
      };

      // Update connection state
      if (isNowConnected && !wasConnected) {
        transitionState(WalletConnectionState.CONNECTED);
      } else if (!isNowConnected && wasConnected) {
        transitionState(WalletConnectionState.DISCONNECTED);
      }

      // Sync with auth store
      if (activeAccount) {
        authStore.connectWallet(activeAccount.address, {
          name: activeAccount.name || `User ${activeAccount.address.slice(0, 6)}...`,
        });
      }
    } catch (error) {
      console.error("Error updating wallet state:", error);
      const walletError = parseWalletError(error, "Update wallet state");
      transitionState(WalletConnectionState.FAILED, walletError);
    }
  };

  /**
   * Detect wallet provider with retry logic
   */
  const detectWalletProvider = async (walletId: string): Promise<boolean> => {
    transitionState(WalletConnectionState.DETECTING);

    try {
      const result = await retryWithBackoff(
        async () => {
          const walletToConnect = wallet.wallets.value.find((w: any) => w.id === walletId);
          if (!walletToConnect) {
            throw new Error(`Wallet ${walletId} not found`);
          }
          if (!walletToConnect.isActive) {
            throw new Error(`Wallet ${walletId} is not active/installed`);
          }
          return true;
        },
        DEFAULT_RETRY_CONFIG,
        (attempt, error) => {
          telemetryService.trackWalletDetection({
            walletId,
            attempt,
            success: false,
            errorType: error.message,
          });
          console.log(`[Wallet] Detection retry ${attempt} for ${walletId}: ${error.message}`);
        },
      );

      telemetryService.trackWalletDetection({
        walletId,
        attempt: DEFAULT_RETRY_CONFIG.maxRetries,
        success: true,
      });

      return result;
    } catch (error) {
      const walletError = parseWalletError(error, `Detect ${walletId}`);
      transitionState(WalletConnectionState.FAILED, walletError);

      telemetryService.trackWalletConnectionFailure({
        walletId,
        errorType: walletError.type,
        errorMessage: walletError.message,
        diagnosticCode: walletError.diagnosticCode,
      });

      return false;
    }
  };

  /**
   * Connect to a specific wallet
   */
  const connect = async (walletId?: string) => {
    walletState.value.isConnecting = true;
    transitionState(WalletConnectionState.CONNECTING);
    logConnectionEvent("connect_initiated", `Wallet: ${walletId || "auto"}`);

    try {
      if (walletId) {
        // Detect wallet provider with retry
        const detected = await detectWalletProvider(walletId);
        if (!detected) {
          throw new Error(`Unable to detect wallet provider: ${walletId}`);
        }

        // Connect to specific wallet
        const walletToConnect = wallet.wallets.value.find((w: any) => w.id === walletId);
        if (walletToConnect) {
          await walletToConnect.connect();
        } else {
          throw new Error(`Wallet ${walletId} not found`);
        }
      } else {
        // Let user choose wallet
        const availableWallets = wallet.wallets.value.filter((w: any) => w.isActive);
        if (availableWallets.length > 0) {
          await availableWallets[0].connect();
        } else {
          throw new Error("No wallets available");
        }
      }

      updateWalletState();

      // Save session with expiry
      if (walletState.value.activeAddress && walletState.value.activeWallet) {
        saveWalletSession(
          walletState.value.activeWallet,
          currentNetwork.value,
          walletState.value.activeAddress
        );
        
        logConnectionEvent("connect_success", `Wallet: ${walletState.value.activeWallet}, Network: ${currentNetwork.value}`);

        // Track successful connection
        telemetryService.trackWalletConnect({
          walletId: walletState.value.activeWallet,
          network: currentNetwork.value,
          address: walletState.value.activeAddress,
        });
      }
    } catch (error) {
      console.error("Failed to authenticate:", error);
      const walletError = parseWalletError(error, "Authentication");
      transitionState(WalletConnectionState.FAILED, walletError);
      
      logConnectionEvent("connect_failed", `Error: ${walletError.message}`);

      telemetryService.trackWalletConnectionFailure({
        walletId,
        errorType: walletError.type,
        errorMessage: walletError.message,
        diagnosticCode: walletError.diagnosticCode,
      });

      walletState.value.isConnecting = false;
      throw error;
    }
  };

  /**
   * Disconnect current wallet
   */
  const disconnect = async () => {
    try {
      if (wallet.activeWallet.value) {
        await wallet.activeWallet.value.disconnect();
      }

      walletState.value = {
        isConnected: false,
        activeAddress: null,
        activeWallet: null,
        accounts: [],
        isConnecting: false,
        error: null,
        connectionState: WalletConnectionState.DISCONNECTED,
        lastError: null,
        balanceLastUpdated: null,
      };

      transitionState(WalletConnectionState.DISCONNECTED);

      // Clear session
      clearWalletSession();
      logConnectionEvent("disconnect", "Wallet disconnected");

      // Clear auth store
      await authStore.signOut();

      // Clear persisted state
      localStorage.removeItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED);
      localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID);
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw error;
    }
  };

  /**
   * Switch to a different network
   */
  const switchNetwork = async (networkId: NetworkId) => {
    const fromNetwork = currentNetwork.value;
    transitionState(WalletConnectionState.SWITCHING_NETWORK);

    try {
      const network = NETWORKS[networkId];
      if (!network) {
        throw new Error(`Network ${networkId} not found`);
      }

      // If wallet is connected, we need to reconnect to apply new network
      const wasConnected = walletState.value.isConnected;
      const previousWalletId = walletState.value.activeWallet;

      if (wasConnected) {
        await disconnect();
      }

      // Update network
      currentNetwork.value = networkId;
      localStorage.setItem(AUTH_STORAGE_KEYS.SELECTED_NETWORK, networkId);

      // Track network switch
      telemetryService.trackNetworkSwitch({
        fromNetwork,
        toNetwork: networkId,
      });

      // Reconnect if was previously connected
      if (wasConnected && previousWalletId) {
        await connect(previousWalletId);
      } else {
        transitionState(WalletConnectionState.DISCONNECTED);
      }

      return network;
    } catch (error) {
      console.error("Failed to switch network:", error);
      const walletError = parseWalletError(error, "Switch network");
      transitionState(WalletConnectionState.FAILED, walletError);

      telemetryService.trackNetworkSwitchFailure({
        fromNetwork,
        toNetwork: networkId,
        errorType: walletError.type,
        errorMessage: walletError.message,
      });

      throw error;
    }
  };

  /**
   * Set active account by address
   */
  const setActiveAccount = (address: string) => {
    try {
      if (wallet.activeWallet.value) {
        wallet.activeWallet.value.setActiveAccount(address);
        updateWalletState();
      }
    } catch (error) {
      console.error("Failed to set active account:", error);
      throw error;
    }
  };

  /**
   * Attempt to reconnect on page load
   */
  const attemptReconnect = async () => {
    // Try to load session from new session service
    const session = loadWalletSession();
    
    if (!session) {
      // Fallback to old localStorage approach
      const wasConnected = localStorage.getItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED) === WALLET_CONNECTION_STATE.CONNECTED;
      const savedWalletId = localStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID);
      const savedNetwork = localStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_NETWORK) as NetworkId;

      if (!wasConnected || !savedWalletId) {
        // Still restore network preference even if not connected
        if (savedNetwork && NETWORKS[savedNetwork]) {
          currentNetwork.value = savedNetwork;
        }
        transitionState(WalletConnectionState.DISCONNECTED);
        logConnectionEvent("reconnect_skipped", "No saved session");
        return;
      }

      isReconnecting.value = true;
      transitionState(WalletConnectionState.RECONNECTING);
      logConnectionEvent("reconnect_attempt", `Wallet: ${savedWalletId}, Network: ${savedNetwork}`);

      try {
        // Restore network
        if (savedNetwork && NETWORKS[savedNetwork]) {
          currentNetwork.value = savedNetwork;
        }

        // Attempt reconnection
        await connect(savedWalletId);

        console.log("Successfully reconnected session");
        logConnectionEvent("reconnect_success", "Session restored from legacy storage");
      } catch (error) {
        console.warn("Failed to reconnect session:", error);
        const walletError = parseWalletError(error, "Reconnect session");
        transitionState(WalletConnectionState.FAILED, walletError);
        logConnectionEvent("reconnect_failed", `Error: ${walletError.message}`);

        // Clear persisted state on reconnection failure
        localStorage.removeItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED);
        localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID);
        clearWalletSession();
      } finally {
        isReconnecting.value = false;
      }
      return;
    }

    // Use session service for reconnection
    isReconnecting.value = true;
    transitionState(WalletConnectionState.RECONNECTING);
    logConnectionEvent("reconnect_attempt", `Wallet: ${session.walletId}, Network: ${session.networkId}`);

    try {
      // Restore network
      if (NETWORKS[session.networkId]) {
        currentNetwork.value = session.networkId;
      }

      // Attempt reconnection
      await connect(session.walletId);

      console.log("Successfully reconnected session from session service");
      logConnectionEvent("reconnect_success", "Session restored");
      updateSessionActivity();
    } catch (error) {
      console.warn("Failed to reconnect session:", error);
      const walletError = parseWalletError(error, "Reconnect session");
      transitionState(WalletConnectionState.FAILED, walletError);
      logConnectionEvent("reconnect_failed", `Error: ${walletError.message}`);

      // Clear persisted state on reconnection failure
      clearWalletSession();
      localStorage.removeItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED);
      localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID);
    } finally {
      isReconnecting.value = false;
    }
  };

  /**
   * Retry connection after failure
   */
  const retryConnection = async (walletId?: string) => {
    const idToUse = walletId || walletState.value.activeWallet || undefined;
    if (!idToUse) {
      throw new Error("No wallet ID to retry");
    }

    // Clear previous error
    walletState.value.error = null;
    walletState.value.lastError = null;

    await connect(idToUse);
  };

  /**
   * Setup event listeners
   */
  const setupListeners = () => {
    // Persist connection state when wallet is connected
    if (walletState.value.isConnected) {
      if (walletState.value.activeWallet) {
        localStorage.setItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED, WALLET_CONNECTION_STATE.CONNECTED);
        localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID, walletState.value.activeWallet);
      }
    }

    // Cleanup function for event listeners
    return () => {
      // Placeholder for cleanup if needed in the future
    };
  };

  // Cleanup reference
  let cleanup: (() => void) | null = null;

  // Initialize on mount
  onMounted(async () => {
    cleanup = setupListeners();
    updateWalletState();
    await attemptReconnect();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (cleanup && typeof cleanup === "function") {
      cleanup();
    }
  });

  return {
    // State
    walletState,
    isConnected,
    activeAddress,
    activeWallet,
    accounts,
    formattedAddress,
    isReconnecting,
    currentNetwork,
    networkInfo,
    availableNetworks: NETWORKS,

    // Actions
    connect,
    disconnect,
    switchNetwork,
    setActiveAccount,
    updateWalletState,
    attemptReconnect,
    retryConnection,

    // Wallet manager instance for advanced usage
    walletManager: wallet,

    // Helper functions
    getTroubleshootingSteps: (errorType: WalletErrorType) => getTroubleshootingSteps(errorType),
  };
}
