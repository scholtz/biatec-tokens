import { ref, computed } from "vue";
import type { NetworkId } from "./useWalletManager";
import { NETWORKS } from "./useWalletManager";

export type DeploymentStatus = "idle" | "preparing" | "signing" | "submitting" | "confirming" | "success" | "error";

export interface DeploymentStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
  description?: string;
}

export interface DeploymentState {
  status: DeploymentStatus;
  networkId: NetworkId | null;
  tokenId: string | null;
  transactionId: string | null;
  error: string | null;
  steps: DeploymentStep[];
  progress: number; // 0-100
  startTime: number | null;
  completionTime: number | null;
}

export interface DeploymentFeeEstimate {
  networkFee: string;
  platformFee: string;
  total: string;
  currency: string;
}

/**
 * Composable for tracking token deployment status across all networks
 * Supports both AVM and EVM chain deployments
 */
export function useDeploymentTracking() {
  const deploymentState = ref<DeploymentState>({
    status: "idle",
    networkId: null,
    tokenId: null,
    transactionId: null,
    error: null,
    steps: [],
    progress: 0,
    startTime: null,
    completionTime: null,
  });

  // Computed properties
  const isDeploying = computed(() => {
    return ["preparing", "signing", "submitting", "confirming"].includes(deploymentState.value.status);
  });

  const isComplete = computed(() => {
    return deploymentState.value.status === "success";
  });

  const hasError = computed(() => {
    return deploymentState.value.status === "error";
  });

  const canRetry = computed(() => {
    return hasError.value && deploymentState.value.networkId !== null;
  });

  const networkInfo = computed(() => {
    if (!deploymentState.value.networkId) return null;
    return NETWORKS[deploymentState.value.networkId] || null;
  });

  const currentStep = computed(() => {
    return deploymentState.value.steps.find((s) => s.status === "active");
  });

  /**
   * Get deployment steps for a specific chain type
   */
  const getDeploymentSteps = (networkId: NetworkId): DeploymentStep[] => {
    const network = NETWORKS[networkId];
    
    if (network.chainType === "AVM") {
      return [
        {
          id: "prepare",
          label: "Prepare Transaction",
          status: "pending",
          description: "Creating token asset on Algorand",
        },
        {
          id: "sign",
          label: "Sign Transaction",
          status: "pending",
          description: "Waiting for wallet signature",
        },
        {
          id: "submit",
          label: "Submit to Network",
          status: "pending",
          description: "Broadcasting transaction to Algorand",
        },
        {
          id: "confirm",
          label: "Confirm Transaction",
          status: "pending",
          description: "Waiting for network confirmation",
        },
      ];
    } else {
      // EVM chains
      return [
        {
          id: "prepare",
          label: "Prepare Contract",
          status: "pending",
          description: "Preparing smart contract deployment",
        },
        {
          id: "sign",
          label: "Sign Transaction",
          status: "pending",
          description: "Waiting for wallet signature",
        },
        {
          id: "submit",
          label: "Deploy Contract",
          status: "pending",
          description: "Deploying smart contract to blockchain",
        },
        {
          id: "confirm",
          label: "Confirm Deployment",
          status: "pending",
          description: "Waiting for block confirmation",
        },
      ];
    }
  };

  /**
   * Get fee estimate for deployment on a specific network
   */
  const getFeeEstimate = (networkId: NetworkId): DeploymentFeeEstimate => {
    const network = NETWORKS[networkId];
    
    if (network.chainType === "AVM") {
      // AVM networks (Algorand-based)
      if (networkId === "algorand-mainnet") {
        return {
          networkFee: "0.001",
          platformFee: "0.000",
          total: "0.001",
          currency: "ALGO",
        };
      } else if (networkId === "voi-mainnet") {
        return {
          networkFee: "0.001",
          platformFee: "0.000",
          total: "0.001",
          currency: "VOI",
        };
      } else if (networkId === "aramidmain") {
        return {
          networkFee: "0.001",
          platformFee: "0.000",
          total: "0.001",
          currency: "ALGO",
        };
      } else {
        // Testnet
        return {
          networkFee: "0.001",
          platformFee: "0.000",
          total: "0.001",
          currency: "ALGO",
        };
      }
    } else {
      // EVM networks
      if (networkId === "ethereum") {
        return {
          networkFee: "0.002",
          platformFee: "0.000",
          total: "0.002",
          currency: "ETH",
        };
      } else if (networkId === "arbitrum") {
        return {
          networkFee: "0.0001",
          platformFee: "0.000",
          total: "0.0001",
          currency: "ETH",
        };
      } else if (networkId === "base") {
        return {
          networkFee: "0.00005",
          platformFee: "0.000",
          total: "0.00005",
          currency: "ETH",
        };
      } else if (networkId === "sepolia") {
        return {
          networkFee: "0.002",
          platformFee: "0.000",
          total: "0.002",
          currency: "ETH",
        };
      }
      
      // Should never reach here if all EVM networks are handled
      throw new Error(`Fee estimate not configured for network: ${networkId}`);
    }
  };

  /**
   * Start deployment process
   */
  const startDeployment = (networkId: NetworkId) => {
    deploymentState.value = {
      status: "preparing",
      networkId,
      tokenId: null,
      transactionId: null,
      error: null,
      steps: getDeploymentSteps(networkId),
      progress: 0,
      startTime: Date.now(),
      completionTime: null,
    };

    // Mark first step as active
    if (deploymentState.value.steps.length > 0) {
      deploymentState.value.steps[0].status = "active";
    }
  };

  /**
   * Update deployment status to next step
   */
  const nextStep = () => {
    const steps = deploymentState.value.steps;
    const currentIndex = steps.findIndex((s) => s.status === "active");

    if (currentIndex >= 0) {
      // Mark current step as completed
      steps[currentIndex].status = "completed";

      // Update progress
      deploymentState.value.progress = Math.round(((currentIndex + 1) / steps.length) * 100);

      // Move to next step
      if (currentIndex + 1 < steps.length) {
        steps[currentIndex + 1].status = "active";
        
        // Update status based on step
        const nextStepId = steps[currentIndex + 1].id;
        if (nextStepId === "sign") {
          deploymentState.value.status = "signing";
        } else if (nextStepId === "submit") {
          deploymentState.value.status = "submitting";
        } else if (nextStepId === "confirm") {
          deploymentState.value.status = "confirming";
        }
      } else {
        // All steps completed
        deploymentState.value.status = "success";
        deploymentState.value.progress = 100;
        deploymentState.value.completionTime = Date.now();
      }
    }
  };

  /**
   * Set transaction ID
   */
  const setTransactionId = (txId: string) => {
    deploymentState.value.transactionId = txId;
  };

  /**
   * Set token ID
   */
  const setTokenId = (tokenId: string) => {
    deploymentState.value.tokenId = tokenId;
  };

  /**
   * Set error state
   */
  const setError = (error: string) => {
    deploymentState.value.status = "error";
    deploymentState.value.error = error;
    deploymentState.value.completionTime = Date.now();

    // Mark current step as error
    const currentIndex = deploymentState.value.steps.findIndex((s) => s.status === "active");
    if (currentIndex >= 0) {
      deploymentState.value.steps[currentIndex].status = "error";
    }
  };

  /**
   * Reset deployment state
   */
  const reset = () => {
    deploymentState.value = {
      status: "idle",
      networkId: null,
      tokenId: null,
      transactionId: null,
      error: null,
      steps: [],
      progress: 0,
      startTime: null,
      completionTime: null,
    };
  };

  /**
   * Get block explorer URL for transaction
   */
  const getExplorerUrl = (): string | null => {
    if (!deploymentState.value.transactionId || !deploymentState.value.networkId) {
      return null;
    }

    const network = NETWORKS[deploymentState.value.networkId];
    const txId = deploymentState.value.transactionId;

    if (network.chainType === "AVM") {
      // Algorand-based explorers
      if (deploymentState.value.networkId === "algorand-mainnet") {
        return `https://algoexplorer.io/tx/${txId}`;
      } else if (deploymentState.value.networkId === "voi-mainnet") {
        return `https://voi.observer/explorer/transaction/${txId}`;
      } else if (deploymentState.value.networkId === "aramidmain") {
        return `https://explorer.aramid.finance/transaction/${txId}`;
      } else if (deploymentState.value.networkId === "algorand-testnet") {
        return `https://testnet.algoexplorer.io/tx/${txId}`;
      }
    } else if (network.chainType === "EVM") {
      return `${network.blockExplorerUrl}/tx/${txId}`;
    }

    return null;
  };

  return {
    // State
    deploymentState,
    isDeploying,
    isComplete,
    hasError,
    canRetry,
    networkInfo,
    currentStep,

    // Actions
    startDeployment,
    nextStep,
    setTransactionId,
    setTokenId,
    setError,
    reset,
    getFeeEstimate,
    getExplorerUrl,
  };
}
