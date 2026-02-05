import { ref, computed, watch } from "vue";
import { useWalletManager, type NetworkId, type NetworkInfo, NETWORKS } from "./useWalletManager";
import { useEVMWallet } from "./useEVMWallet";

/**
 * Unified wallet manager that handles both AVM and EVM chains
 * Automatically switches between AVM and EVM wallet providers based on selected network
 */
export function useUnifiedWallet() {
  const avmWallet = useWalletManager();
  const evmWallet = useEVMWallet();

  const selectedNetwork = ref<NetworkId>("voi-mainnet");

  // Determine if current network is EVM or AVM
  const isEVMNetwork = computed(() => {
    const network = NETWORKS[selectedNetwork.value];
    return network?.chainType === "EVM";
  });

  const isAVMNetwork = computed(() => {
    const network = NETWORKS[selectedNetwork.value];
    return network?.chainType === "AVM";
  });

  // Unified state
  const isConnected = computed(() => {
    return isEVMNetwork.value ? evmWallet.isConnected.value : avmWallet.isConnected.value;
  });

  const activeAddress = computed(() => {
    return isEVMNetwork.value ? evmWallet.activeAddress.value : avmWallet.activeAddress.value;
  });

  const formattedAddress = computed(() => {
    return isEVMNetwork.value ? evmWallet.formattedAddress.value : avmWallet.formattedAddress.value;
  });

  const networkInfo = computed((): NetworkInfo | null => {
    return NETWORKS[selectedNetwork.value] || null;
  });

  const error = ref<string | null>(null);

  /**
   * Authenticate (EVM or AVM based on current network)
   */
  const connect = async () => {
    error.value = null;
    try {
      if (isEVMNetwork.value) {
        await evmWallet.connect();
      } else {
        await avmWallet.connect();
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to authenticate";
      throw err;
    }
  };

  /**
   * Sign out
   */
  const disconnect = async () => {
    error.value = null;
    try {
      if (isEVMNetwork.value) {
        await evmWallet.disconnect();
      } else {
        await avmWallet.disconnect();
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to sign out";
      throw err;
    }
  };

  /**
   * Switch network (handles cross-chain switching)
   */
  const switchNetwork = async (networkId: NetworkId) => {
    error.value = null;
    const targetNetwork = NETWORKS[networkId];
    
    if (!targetNetwork) {
      error.value = `Network ${networkId} not found`;
      throw new Error(error.value);
    }

    const wasConnected = isConnected.value;
    const fromChainType = NETWORKS[selectedNetwork.value]?.chainType;
    const toChainType = targetNetwork.chainType;

    try {
      // If switching between different chain types, disconnect first
      if (wasConnected && fromChainType !== toChainType) {
        await disconnect();
      }

      // Update selected network
      selectedNetwork.value = networkId;
      
      // Store selection in localStorage
      localStorage.setItem("selected_network", networkId);

      // If switching within same chain type and wallet supports it, switch network
      if (wasConnected && fromChainType === toChainType) {
        if (toChainType === "EVM") {
          await evmWallet.switchNetwork(networkId as Extract<NetworkId, { chainType: "EVM" }>);
        } else if (toChainType === "AVM") {
          await avmWallet.switchNetwork(networkId as Extract<NetworkId, { chainType: "AVM" }>);
        }
      }

      // If user was connected, reconnect to new network
      if (wasConnected && fromChainType !== toChainType) {
        // User needs to reconnect manually after chain type switch
        console.log("Please reconnect your wallet to the new network");
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to switch network";
      throw err;
    }
  };

  /**
   * Initialize wallet on mount
   */
  const initialize = async () => {
    // Restore network selection from localStorage
    const savedNetwork = localStorage.getItem("selected_network") as NetworkId;
    if (savedNetwork && NETWORKS[savedNetwork]) {
      selectedNetwork.value = savedNetwork;
    }

    // Attempt to reconnect
    try {
      if (isEVMNetwork.value) {
        await evmWallet.attemptReconnect();
      }
      // AVM wallet reconnection is handled by useWalletManager internally
    } catch (err) {
      console.warn("Failed to reconnect session:", err);
    }
  };

  // Watch for network changes to update sync state
  watch(selectedNetwork, (newNetwork) => {
    // Trigger any necessary updates when network changes
    console.log("Network changed to:", newNetwork);
  });

  return {
    // State
    selectedNetwork,
    isConnected,
    activeAddress,
    formattedAddress,
    networkInfo,
    isEVMNetwork,
    isAVMNetwork,
    error,
    
    // Wallet instances for advanced usage
    avmWallet,
    evmWallet,

    // Actions
    connect,
    disconnect,
    switchNetwork,
    initialize,
  };
}
