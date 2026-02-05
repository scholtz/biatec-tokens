/**
 * Composable for managing token allowances across EVM and AVM chains
 * Integrates with wallet lifecycle and provides reactive allowance data
 */

import { ref, computed, watch } from "vue";
import { useAllowancesStore } from "../stores/allowances";
import { useUnifiedWallet } from "./useUnifiedWallet";
import {
  discoverEVMAllowances,
  revokeEVMAllowance,
  reduceEVMAllowance,
  getCommonDeFiContracts,
} from "../services/EVMAllowanceService";
import type { EVMNetworkId } from "./useWalletManager";
import { AllowanceActionType } from "../types/allowances";

export function useAllowances() {
  const allowancesStore = useAllowancesStore();
  const unifiedWallet = useUnifiedWallet();

  const isDiscovering = ref(false);
  const discoveryError = ref<string | null>(null);

  // Computed properties from store
  const allowances = computed(() => allowancesStore.filteredAllowances);
  const statistics = computed(() => allowancesStore.statistics);
  const auditTrail = computed(() => allowancesStore.auditTrail);

  /**
   * Discover allowances for the currently connected wallet
   */
  const discoverAllowances = async () => {
    if (!unifiedWallet.isConnected.value || !unifiedWallet.activeAddress.value) {
      discoveryError.value = "Wallet not connected";
      return;
    }

    const networkId = unifiedWallet.selectedNetwork.value;
    const networkInfo = unifiedWallet.networkInfo.value;

    if (!networkInfo) {
      discoveryError.value = "Network information not available";
      return;
    }

    // Only support EVM chains for now
    if (networkInfo.chainType !== "EVM") {
      discoveryError.value = "Allowance discovery is currently only supported for EVM chains";
      return;
    }

    isDiscovering.value = true;
    discoveryError.value = null;
    allowancesStore.setLoading(true);

    try {
      // Get common DeFi contracts for this network
      const commonContracts = getCommonDeFiContracts(networkId as EVMNetworkId);
      
      // Build list of token-spender pairs to check
      const pairs: Array<{ tokenAddress: string; spenderAddress: string }> = [];
      
      for (const contract of commonContracts) {
        for (const tokenAddress of contract.commonTokens) {
          pairs.push({
            tokenAddress,
            spenderAddress: contract.spenderAddress,
          });
        }
      }

      // Discover allowances
      const result = await discoverEVMAllowances(
        unifiedWallet.activeAddress.value,
        networkId as EVMNetworkId,
        networkInfo.chainId,
        pairs
      );

      // Update store
      allowancesStore.setAllowances(result.allowances);

      if (result.errors && result.errors.length > 0) {
        console.warn("Some allowances could not be discovered:", result.errors);
      }
    } catch (error) {
      console.error("Failed to discover allowances:", error);
      discoveryError.value =
        error instanceof Error ? error.message : "Failed to discover allowances";
      allowancesStore.setError(discoveryError.value);
    } finally {
      isDiscovering.value = false;
      allowancesStore.setLoading(false);
    }
  };

  /**
   * Revoke a specific allowance (set to 0)
   */
  const revokeAllowance = async (allowanceId: string) => {
    const allowance = allowancesStore.allowances.find((a) => a.id === allowanceId);
    
    if (!allowance) {
      throw new Error("Allowance not found");
    }

    if (allowance.chainType !== "EVM") {
      throw new Error("Only EVM allowances can be revoked");
    }

    if (!unifiedWallet.activeAddress.value) {
      throw new Error("Wallet not connected");
    }

    try {
      // Add audit entry for pending transaction
      const auditId = `audit-${Date.now()}`;
      allowancesStore.addAuditEntry({
        id: auditId,
        timestamp: new Date(),
        actionType: AllowanceActionType.REVOKE,
        allowanceId,
        chainType: "EVM",
        networkId: allowance.networkId,
        tokenAddress: allowance.tokenAddress,
        tokenSymbol: allowance.tokenSymbol,
        spenderAddress: allowance.spenderAddress,
        spenderName: allowance.spenderName,
        previousAllowance: allowance.allowanceAmount,
        newAllowance: "0",
        status: "pending",
      });

      // Execute revoke transaction
      const result = await revokeEVMAllowance(
        allowance.tokenAddress,
        allowance.spenderAddress,
        unifiedWallet.activeAddress.value
      );

      // Update audit entry with success
      const auditEntry = allowancesStore.auditTrail.find((e) => e.id === auditId);
      if (auditEntry) {
        auditEntry.status = "success";
        auditEntry.transactionHash = result.transactionHash;
      }

      // Remove allowance from store (or update to 0)
      allowancesStore.removeAllowance(allowanceId);

      return result;
    } catch (error) {
      // Update audit entry with failure
      const auditEntry = allowancesStore.auditTrail.find(
        (e) => e.allowanceId === allowanceId && e.status === "pending"
      );
      if (auditEntry) {
        auditEntry.status = "failed";
        auditEntry.errorMessage =
          error instanceof Error ? error.message : "Transaction failed";
      }

      throw error;
    }
  };

  /**
   * Reduce allowance to a specific amount
   */
  const reduceAllowance = async (allowanceId: string, newAmount: string) => {
    const allowance = allowancesStore.allowances.find((a) => a.id === allowanceId);
    
    if (!allowance) {
      throw new Error("Allowance not found");
    }

    if (allowance.chainType !== "EVM") {
      throw new Error("Only EVM allowances can be reduced");
    }

    if (!unifiedWallet.activeAddress.value) {
      throw new Error("Wallet not connected");
    }

    try {
      // Add audit entry for pending transaction
      const auditId = `audit-${Date.now()}`;
      allowancesStore.addAuditEntry({
        id: auditId,
        timestamp: new Date(),
        actionType: AllowanceActionType.REDUCE,
        allowanceId,
        chainType: "EVM",
        networkId: allowance.networkId,
        tokenAddress: allowance.tokenAddress,
        tokenSymbol: allowance.tokenSymbol,
        spenderAddress: allowance.spenderAddress,
        spenderName: allowance.spenderName,
        previousAllowance: allowance.allowanceAmount,
        newAllowance: newAmount,
        status: "pending",
      });

      // Execute reduce transaction
      const result = await reduceEVMAllowance(
        allowance.tokenAddress,
        allowance.spenderAddress,
        unifiedWallet.activeAddress.value,
        newAmount
      );

      // Update audit entry with success
      const auditEntry = allowancesStore.auditTrail.find((e) => e.id === auditId);
      if (auditEntry) {
        auditEntry.status = "success";
        auditEntry.transactionHash = result.transactionHash;
      }

      // Update allowance in store
      allowancesStore.updateAllowance(allowanceId, {
        allowanceAmount: newAmount,
      });

      return result;
    } catch (error) {
      // Update audit entry with failure
      const auditEntry = allowancesStore.auditTrail.find(
        (e) => e.allowanceId === allowanceId && e.status === "pending"
      );
      if (auditEntry) {
        auditEntry.status = "failed";
        auditEntry.errorMessage =
          error instanceof Error ? error.message : "Transaction failed";
      }

      throw error;
    }
  };

  /**
   * Clear all allowances (e.g., on wallet disconnect)
   */
  const clearAllowances = () => {
    allowancesStore.clearAllowances();
    discoveryError.value = null;
  };

  // Watch for wallet connection changes and clear allowances on disconnect
  watch(
    () => unifiedWallet.isConnected.value,
    (isConnected) => {
      if (!isConnected) {
        clearAllowances();
      }
    }
  );

  // Watch for network changes and trigger re-discovery
  watch(
    () => unifiedWallet.selectedNetwork.value,
    () => {
      if (unifiedWallet.isConnected.value) {
        // Clear old allowances when network changes
        clearAllowances();
      }
    }
  );

  return {
    // State
    allowances,
    statistics,
    auditTrail,
    isDiscovering,
    discoveryError,
    isLoading: computed(() => allowancesStore.isLoading),

    // Actions
    discoverAllowances,
    revokeAllowance,
    reduceAllowance,
    clearAllowances,

    // Store actions exposed
    setFilters: allowancesStore.setFilters,
    resetFilters: allowancesStore.resetFilters,
    setSortOptions: allowancesStore.setSortOptions,
    exportAuditTrail: allowancesStore.exportAuditTrail,
    downloadAuditTrail: allowancesStore.downloadAuditTrail,
  };
}
