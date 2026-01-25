import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, type WalletAccount } from "@txnlab/use-wallet-vue";
import { useAuthStore } from "../stores/auth";
import { AUTH_STORAGE_KEYS, WALLET_CONNECTION_STATE } from "../constants/auth";

export interface WalletState {
  isConnected: boolean;
  activeAddress: string | null;
  activeWallet: string | null;
  accounts: WalletAccount[];
  isConnecting: boolean;
  error: string | null;
}

export type NetworkId = "voi-mainnet" | "aramidmain" | "dockernet";

export interface NetworkInfo {
  id: NetworkId;
  name: string;
  displayName: string;
  algodUrl: string;
  genesisId: string;
  isTestnet: boolean;
}

export const NETWORKS: Record<NetworkId, NetworkInfo> = {
  "voi-mainnet": {
    id: "voi-mainnet",
    name: "voi-mainnet",
    displayName: "VOI Mainnet",
    algodUrl: "https://mainnet-api.voi.nodely.dev",
    genesisId: "voimain-v1.0",
    isTestnet: false,
  },
  aramidmain: {
    id: "aramidmain",
    name: "aramidmain",
    displayName: "Aramid Mainnet",
    algodUrl: "https://algod.aramidmain.a-wallet.net",
    genesisId: "aramidmain-v1.0",
    isTestnet: false,
  },
  dockernet: {
    id: "dockernet",
    name: "dockernet",
    displayName: "Dockernet (Local)",
    algodUrl: "http://localhost:4001",
    genesisId: "dockernet-v1",
    isTestnet: true,
  },
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
      networkInfo: computed(() => NETWORKS["voi-mainnet"]),
      formattedAddress: computed(() => null),
      walletState: ref({
        isConnected: false,
        activeAddress: null,
        activeWallet: null,
        accounts: [],
        isConnecting: false,
        error: null,
      }),
      currentNetwork: ref<NetworkId>("voi-mainnet"),
      connect: async () => {
        throw new Error("Wallet manager not available");
      },
      disconnect: async () => {},
      switchNetwork: async () => {},
      reconnect: async () => {},
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
  });

  const currentNetwork = ref<NetworkId>("voi-mainnet");
  const isReconnecting = ref(false);

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
   * Update wallet state from the wallet manager
   */
  const updateWalletState = () => {
    try {
      const activeAccount = wallet.activeAccount.value;
      const walletAccounts = wallet.activeWallet.value?.accounts || [];

      walletState.value = {
        isConnected: !!activeAccount,
        activeAddress: activeAccount?.address || null,
        activeWallet: wallet.activeWallet.value?.id || null,
        accounts: walletAccounts,
        isConnecting: false,
        error: null,
      };

      // Sync with auth store
      if (activeAccount) {
        authStore.connectWallet(activeAccount.address, {
          name: activeAccount.name || `User ${activeAccount.address.slice(0, 6)}...`,
        });
      }
    } catch (error) {
      console.error("Error updating wallet state:", error);
      walletState.value.error = error instanceof Error ? error.message : "Unknown error";
    }
  };

  /**
   * Connect to a specific wallet
   */
  const connect = async (walletId?: string) => {
    walletState.value.isConnecting = true;
    walletState.value.error = null;

    try {
      if (walletId) {
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
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      walletState.value.error = error instanceof Error ? error.message : "Failed to connect wallet";
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
      };

      // Clear auth store
      await authStore.signOut();

      // Clear persisted state
      localStorage.removeItem("wallet_connected");
      localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw error;
    }
  };

  /**
   * Switch to a different network
   */
  const switchNetwork = async (networkId: NetworkId) => {
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
      localStorage.setItem("selected_network", networkId);

      // Reconnect if was previously connected
      if (wasConnected && previousWalletId) {
        await connect(previousWalletId);
      }

      return network;
    } catch (error) {
      console.error("Failed to switch network:", error);
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
    const wasConnected = localStorage.getItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED) === WALLET_CONNECTION_STATE.CONNECTED;
    const savedWalletId = localStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID);
    const savedNetwork = localStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_NETWORK) as NetworkId;

    if (!wasConnected || !savedWalletId) {
      // Still restore network preference even if not connected
      if (savedNetwork && NETWORKS[savedNetwork]) {
        currentNetwork.value = savedNetwork;
      }
      return;
    }

    isReconnecting.value = true;

    try {
      // Restore network
      if (savedNetwork && NETWORKS[savedNetwork]) {
        currentNetwork.value = savedNetwork;
      }

      // Attempt reconnection
      await connect(savedWalletId);

      console.log("Successfully reconnected to wallet");
    } catch (error) {
      console.warn("Failed to reconnect wallet:", error);
      // Clear persisted state on reconnection failure
      localStorage.removeItem("wallet_connected");
      localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID);
    } finally {
      isReconnecting.value = false;
    }
  };

  /**
   * Setup event listeners
   */
  const setupListeners = () => {
    // Persist connection state when wallet is connected
    if (walletState.value.isConnected) {
      if (walletState.value.activeWallet) {
        localStorage.setItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED, WALLET_CONNECTION_STATE.CONNECTED);
        localStorage.setItem("active_wallet_id", walletState.value.activeWallet);
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

    // Wallet manager instance for advanced usage
    walletManager: wallet,
  };
}
