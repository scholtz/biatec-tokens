import { ref, computed, watch } from "vue";
import { useTokenDraftStore } from "../stores/tokenDraft";
import { NetworkId, NetworkInfo, useNetworkStore } from "../stores/network";
import { useAuthStore } from "../stores/auth";

export interface NetworkMismatchWarning {
  severity: "error" | "warning" | "info";
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedAction?: string;
}

/**
 * Composable for detecting network mismatches and providing user guidance
 */
export function useNetworkValidation() {
  const tokenDraftStore = useTokenDraftStore();
  const networkStore = useNetworkStore();
  const authStore = useAuthStore();
  const networkMismatchDetected = ref(false);
  const mismatchWarnings = ref<NetworkMismatchWarning[]>([]);
  const lastValidationTime = ref<Date | null>(null);

  /**
   * Validate if current network matches requirements
   */
  const validateNetworkForTokenStandard = (standard: string | undefined, _currentNetwork: NetworkId): NetworkMismatchWarning | null => {
    if (!standard) return null;

    const networkInfo = networkStore.networkInfo;
    if (!networkInfo) return null;

    // Check if standard matches chain type
    const isEVMStandard = standard.startsWith("ERC");
    const isAVMStandard = standard.startsWith("ASA") || standard.startsWith("ARC");

    if (isEVMStandard && networkInfo.chainType !== "EVM") {
      return {
        severity: "error",
        title: "Network Mismatch",
        message: `${standard} tokens require an EVM network (Ethereum, Arbitrum, Base, or Sepolia). You are currently on ${networkInfo.displayName}.`,
        actionRequired: true,
        suggestedAction: "Switch to an EVM network before deploying",
      };
    }

    if (isAVMStandard && networkInfo.chainType !== "AVM") {
      return {
        severity: "error",
        title: "Network Mismatch",
        message: `${standard} tokens require an AVM network (Algorand, VOI, or Aramid). You are currently on ${networkInfo.displayName}.`,
        actionRequired: true,
        suggestedAction: "Switch to an AVM network before deploying",
      };
    }

    return null;
  };

  /**
   * Validate network for compliance requirements
   * Note: Currently treats all mainnet networks uniformly for compliance.
   * Future enhancement: Add network-specific compliance rules if regulatory
   * requirements differ across mainnet networks (e.g., jurisdiction-specific rules).
   */
  const validateComplianceRequirements = (networkInfo: NetworkInfo | null, hasComplianceMetadata: boolean): NetworkMismatchWarning | null => {
    if (!networkInfo) return null;

    // Mainnet networks should have compliance metadata for production tokens
    if (!networkInfo.isTestnet && !hasComplianceMetadata) {
      return {
        severity: "warning",
        title: "Compliance Metadata Missing",
        message: `You are deploying to ${networkInfo.displayName} (mainnet) without compliance metadata. This is recommended for production tokens.`,
        actionRequired: false,
        suggestedAction: "Add MICA compliance metadata before deploying",
      };
    }

    // Testnet warning
    if (networkInfo.isTestnet && hasComplianceMetadata) {
      return {
        severity: "info",
        title: "Testnet Deployment",
        message: `You are deploying to ${networkInfo.displayName} (testnet). This token is for testing only and has no real-world value.`,
        actionRequired: false,
      };
    }

    return null;
  };

  /**
   * Run comprehensive network validation
   */
  const validateCurrentNetwork = (): NetworkMismatchWarning[] => {
    const warnings: NetworkMismatchWarning[] = [];
    lastValidationTime.value = new Date();

    const currentNetwork = networkStore.networkInfo.id;
    const networkInfo = networkStore.networkInfo;
    const draft = tokenDraftStore.currentDraft;

    if (!networkInfo) {
      warnings.push({
        severity: "error",
        title: "Network Not Detected",
        message: "Unable to detect current network. Please reconnect your session.",
        actionRequired: true,
        suggestedAction: "Reconnect",
      });
      networkMismatchDetected.value = true;
      mismatchWarnings.value = warnings;
      return warnings;
    }

    // Validate token standard compatibility
    if (draft?.selectedStandard) {
      const standardWarning = validateNetworkForTokenStandard(draft.selectedStandard, currentNetwork);
      if (standardWarning) {
        warnings.push(standardWarning);
      }
    }

    // Validate compliance requirements
    const hasCompliance = !!(draft?.micaMetadata || draft?.attestationMetadata);
    const complianceWarning = validateComplianceRequirements(networkInfo, hasCompliance);
    if (complianceWarning) {
      warnings.push(complianceWarning);
    }

    // Check draft network compatibility
    if (draft && !tokenDraftStore.isDraftCompatibleWithNetwork(currentNetwork)) {
      warnings.push({
        severity: "error",
        title: "Draft Incompatible with Current Network",
        message: `Your token draft was created for a different network type. The selected standard is not compatible with ${networkInfo.displayName}.`,
        actionRequired: true,
        suggestedAction: "Select a compatible token standard or switch networks",
      });
    }

    networkMismatchDetected.value = warnings.some((w) => w.severity === "error");
    mismatchWarnings.value = warnings;
    return warnings;
  };

  /**
   * Check if deployment is safe to proceed
   */
  const canProceedWithDeployment = computed(() => {
    // Must have no error-level warnings
    const hasErrors = mismatchWarnings.value.some((w) => w.severity === "error");

    // Must be connected
    const isConnected = authStore.isAuthenticated;

    // Must have validated recently (within 10 seconds)
    const isRecentValidation = lastValidationTime.value ? Date.now() - lastValidationTime.value.getTime() < 10000 : false;

    return isConnected && !hasErrors && isRecentValidation;
  });

  /**
   * Get user-friendly network status message
   */
  const networkStatusMessage = computed(() => {
    const networkInfo = networkStore.networkInfo;
    if (!networkInfo) return "Network not detected";

    const networkType = networkInfo.isTestnet ? "Testnet" : "Mainnet";
    const chainType = networkInfo.chainType;

    return `${networkInfo.displayName} (${chainType} ${networkType})`;
  });

  /**
   * Watch for network changes and auto-validate
   */
  watch(
    () => networkStore.networkInfo.id,
    () => {
      if (authStore.isAuthenticated) {
        validateCurrentNetwork();
      }
    },
    { immediate: true },
  );

  /**
   * Watch for token draft changes and re-validate
   */
  watch(
    () => tokenDraftStore.currentDraft?.selectedStandard,
    () => {
      if (authStore.isAuthenticated) {
        validateCurrentNetwork();
      }
    },
  );

  return {
    // State
    networkMismatchDetected,
    mismatchWarnings,
    lastValidationTime,
    canProceedWithDeployment,
    networkStatusMessage,

    // Actions
    validateCurrentNetwork,
    validateNetworkForTokenStandard,
    validateComplianceRequirements,
  };
}
