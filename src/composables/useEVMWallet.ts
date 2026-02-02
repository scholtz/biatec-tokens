import { ref, computed } from "vue";
import type { EVMNetworkId, EVMNetworkInfo } from "./useWalletManager";
import { EVM_NETWORKS } from "./useWalletManager";

export interface EVMWalletState {
  isConnected: boolean;
  activeAddress: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

/**
 * Composable for managing EVM wallet connections (MetaMask, etc.)
 * Uses the browser's native ethereum provider (window.ethereum)
 */
export function useEVMWallet() {
  const walletState = ref<EVMWalletState>({
    isConnected: false,
    activeAddress: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  // Check if ethereum provider is available
  const isEthereumAvailable = computed(() => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
  });

  // Computed properties
  const isConnected = computed(() => walletState.value.isConnected);
  const activeAddress = computed(() => walletState.value.activeAddress);
  const chainId = computed(() => walletState.value.chainId);
  const formattedAddress = computed(() => {
    if (!activeAddress.value) return null;
    return `${activeAddress.value.slice(0, 6)}...${activeAddress.value.slice(-4)}`;
  });

  // Get current network info
  const currentNetwork = computed((): EVMNetworkInfo | null => {
    if (!chainId.value) return null;
    const network = Object.values(EVM_NETWORKS).find((n) => n.chainId === chainId.value);
    return network || null;
  });

  /**
   * Connect to MetaMask or other EVM wallet
   */
  const connect = async () => {
    if (!isEthereumAvailable.value) {
      walletState.value.error = "No Ethereum wallet detected. Please install MetaMask or another EVM wallet.";
      throw new Error(walletState.value.error);
    }

    walletState.value.isConnecting = true;
    walletState.value.error = null;

    try {
      // Request account access
      const accounts = await window.ethereum!.request({
        method: "eth_requestAccounts",
      });

      // Get chain ID
      const chainIdHex = await window.ethereum!.request({
        method: "eth_chainId",
      });
      const chainIdNum = parseInt(chainIdHex, 16);

      walletState.value = {
        isConnected: true,
        activeAddress: accounts[0],
        chainId: chainIdNum,
        isConnecting: false,
        error: null,
      };

      // Setup event listeners
      setupEventListeners();
    } catch (error) {
      console.error("Failed to connect EVM wallet:", error);
      walletState.value.error = error instanceof Error ? error.message : "Failed to connect wallet";
      walletState.value.isConnecting = false;
      throw error;
    }
  };

  /**
   * Disconnect EVM wallet
   */
  const disconnect = async () => {
    walletState.value = {
      isConnected: false,
      activeAddress: null,
      chainId: null,
      isConnecting: false,
      error: null,
    };
  };

  /**
   * Switch to a different EVM network
   */
  const switchNetwork = async (networkId: EVMNetworkId) => {
    if (!isEthereumAvailable.value || !isConnected.value) {
      throw new Error("Wallet not connected");
    }

    const network = EVM_NETWORKS[networkId];
    if (!network) {
      throw new Error(`Network ${networkId} not found`);
    }

    try {
      // Try to switch to the network
      await window.ethereum!.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });

      walletState.value.chainId = network.chainId;
    } catch (error: any) {
      // If the network is not added to the wallet, add it
      if (error.code === 4902) {
        try {
          await window.ethereum!.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.displayName,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorerUrl],
              },
            ],
          });

          walletState.value.chainId = network.chainId;
        } catch (addError) {
          console.error("Failed to add network:", addError);
          throw addError;
        }
      } else {
        console.error("Failed to switch network:", error);
        throw error;
      }
    }
  };

  /**
   * Setup event listeners for account and network changes
   */
  const setupEventListeners = () => {
    if (!isEthereumAvailable.value) return;

    // Listen for account changes
    window.ethereum!.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnect();
      } else {
        walletState.value.activeAddress = accounts[0];
      }
    });

    // Listen for chain changes
    window.ethereum!.on("chainChanged", (chainIdHex: string) => {
      const chainIdNum = parseInt(chainIdHex, 16);
      walletState.value.chainId = chainIdNum;
      
      // Note: MetaMask recommends page reload on chain change
      // to avoid any inconsistent state. This is the recommended practice.
      console.warn("Network changed. Reloading page to ensure consistent state...");
      window.location.reload();
    });
  };

  /**
   * Attempt to reconnect on page load
   */
  const attemptReconnect = async () => {
    if (!isEthereumAvailable.value) return;

    try {
      // Check if already connected
      const accounts = await window.ethereum!.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const chainIdHex = await window.ethereum!.request({
          method: "eth_chainId",
        });
        const chainIdNum = parseInt(chainIdHex, 16);

        walletState.value = {
          isConnected: true,
          activeAddress: accounts[0],
          chainId: chainIdNum,
          isConnecting: false,
          error: null,
        };

        setupEventListeners();
      }
    } catch (error) {
      console.warn("Failed to reconnect EVM wallet:", error);
    }
  };

  return {
    // State
    walletState,
    isConnected,
    activeAddress,
    chainId,
    formattedAddress,
    currentNetwork,
    isEthereumAvailable,

    // Actions
    connect,
    disconnect,
    switchNetwork,
    attemptReconnect,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
