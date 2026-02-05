import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Allowance,
  EVMTokenAllowance,
  AVMAssetOptIn,
  AllowanceFilters,
  AllowanceSortOptions,
  AllowanceAuditEntry,
  AllowanceStatistics,
} from "../types/allowances";
import {
  AllowanceSortField,
  SortDirection,
  AllowanceRiskLevel,
  AllowanceActivityStatus,
} from "../types/allowances";

const STORAGE_KEY = "biatec_allowances";
const AUDIT_STORAGE_KEY = "biatec_allowance_audit";

export const useAllowancesStore = defineStore("allowances", () => {
  // State
  const allowances = ref<Allowance[]>([]);
  const auditTrail = ref<AllowanceAuditEntry[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastDiscovery = ref<Date | null>(null);

  // Filters and sorting
  const filters = ref<AllowanceFilters>({
    riskLevels: [],
    activityStatuses: [],
    networkIds: [],
    showUnlimitedOnly: false,
    searchQuery: "",
  });

  const sortOptions = ref<AllowanceSortOptions>({
    field: AllowanceSortField.RISK,
    direction: SortDirection.DESC,
  });

  // Computed: Filtered and sorted allowances
  const filteredAllowances = computed(() => {
    let result = [...allowances.value];

    // Apply risk level filter
    if (filters.value.riskLevels.length > 0) {
      result = result.filter((a) => filters.value.riskLevels.includes(a.riskLevel));
    }

    // Apply activity status filter
    if (filters.value.activityStatuses.length > 0) {
      result = result.filter((a) =>
        filters.value.activityStatuses.includes(a.activityStatus)
      );
    }

    // Apply network filter
    if (filters.value.networkIds.length > 0) {
      result = result.filter((a) => filters.value.networkIds.includes(a.networkId));
    }

    // Apply unlimited filter
    if (filters.value.showUnlimitedOnly) {
      result = result.filter((a) => {
        if (a.chainType === "EVM") {
          return (a as EVMTokenAllowance).isUnlimited;
        }
        return false;
      });
    }

    // Apply search query
    if (filters.value.searchQuery) {
      const query = filters.value.searchQuery.toLowerCase();
      result = result.filter((a) => {
        const tokenName =
          a.chainType === "EVM"
            ? (a as EVMTokenAllowance).tokenName
            : (a as AVMAssetOptIn).assetName || "";
        const tokenSymbol =
          a.chainType === "EVM"
            ? (a as EVMTokenAllowance).tokenSymbol
            : (a as AVMAssetOptIn).unitName || "";
        const spenderName = a.spenderName || "";

        return (
          tokenName.toLowerCase().includes(query) ||
          tokenSymbol.toLowerCase().includes(query) ||
          spenderName.toLowerCase().includes(query) ||
          a.spenderAddress.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.value.field) {
        case AllowanceSortField.RISK: {
          const riskOrder = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          break;
        }
        case AllowanceSortField.VALUE: {
          const aValue =
            a.chainType === "EVM" ? (a as EVMTokenAllowance).valueUSD || 0 : 0;
          const bValue =
            b.chainType === "EVM" ? (b as EVMTokenAllowance).valueUSD || 0 : 0;
          comparison = aValue - bValue;
          break;
        }
        case AllowanceSortField.LAST_INTERACTION: {
          const aTime = a.lastInteractionTime?.getTime() || 0;
          const bTime = b.lastInteractionTime?.getTime() || 0;
          comparison = aTime - bTime;
          break;
        }
        case AllowanceSortField.TOKEN_NAME: {
          const aName =
            a.chainType === "EVM"
              ? (a as EVMTokenAllowance).tokenName
              : (a as AVMAssetOptIn).assetName || "";
          const bName =
            b.chainType === "EVM"
              ? (b as EVMTokenAllowance).tokenName
              : (b as AVMAssetOptIn).assetName || "";
          comparison = aName.localeCompare(bName);
          break;
        }
        case AllowanceSortField.SPENDER_NAME: {
          const aSpender = a.spenderName || a.spenderAddress;
          const bSpender = b.spenderName || b.spenderAddress;
          comparison = aSpender.localeCompare(bSpender);
          break;
        }
      }

      return sortOptions.value.direction === SortDirection.ASC ? comparison : -comparison;
    });

    return result;
  });

  // Computed: Statistics
  const statistics = computed((): AllowanceStatistics => {
    const stats: AllowanceStatistics = {
      totalAllowances: allowances.value.length,
      unlimitedAllowances: 0,
      highRiskAllowances: 0,
      dormantAllowances: 0,
      totalValueAtRisk: 0,
    };

    allowances.value.forEach((allowance) => {
      // Count unlimited
      if (allowance.chainType === "EVM" && (allowance as EVMTokenAllowance).isUnlimited) {
        stats.unlimitedAllowances++;
      }

      // Count high risk (critical or high)
      if (
        allowance.riskLevel === AllowanceRiskLevel.CRITICAL ||
        allowance.riskLevel === AllowanceRiskLevel.HIGH
      ) {
        stats.highRiskAllowances++;
      }

      // Count dormant
      if (allowance.activityStatus === AllowanceActivityStatus.DORMANT) {
        stats.dormantAllowances++;
      }

      // Sum value at risk (EVM only)
      if (allowance.chainType === "EVM") {
        const evmAllowance = allowance as EVMTokenAllowance;
        if (evmAllowance.valueUSD) {
          stats.totalValueAtRisk = (stats.totalValueAtRisk || 0) + evmAllowance.valueUSD;
        }
      }
    });

    return stats;
  });

  // Actions
  const setAllowances = (newAllowances: Allowance[]) => {
    allowances.value = newAllowances;
    lastDiscovery.value = new Date();
    saveToLocalStorage();
  };

  const addAllowance = (allowance: Allowance) => {
    const existingIndex = allowances.value.findIndex((a) => a.id === allowance.id);
    if (existingIndex >= 0) {
      allowances.value[existingIndex] = allowance;
    } else {
      allowances.value.push(allowance);
    }
    saveToLocalStorage();
  };

  const removeAllowance = (allowanceId: string) => {
    allowances.value = allowances.value.filter((a) => a.id !== allowanceId);
    saveToLocalStorage();
  };

  const updateAllowance = (allowanceId: string, updates: Partial<Allowance>) => {
    const index = allowances.value.findIndex((a) => a.id === allowanceId);
    if (index >= 0) {
      const currentAllowance = allowances.value[index];
      // Type-safe update: only merge if types are compatible
      allowances.value[index] = { ...currentAllowance, ...updates } as Allowance;
      saveToLocalStorage();
    }
  };

  const clearAllowances = () => {
    allowances.value = [];
    lastDiscovery.value = null;
    saveToLocalStorage();
  };

  const setFilters = (newFilters: Partial<AllowanceFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = () => {
    filters.value = {
      riskLevels: [],
      activityStatuses: [],
      networkIds: [],
      showUnlimitedOnly: false,
      searchQuery: "",
    };
  };

  const setSortOptions = (newSortOptions: Partial<AllowanceSortOptions>) => {
    sortOptions.value = { ...sortOptions.value, ...newSortOptions };
  };

  const addAuditEntry = (entry: AllowanceAuditEntry) => {
    auditTrail.value.unshift(entry); // Add to beginning
    saveAuditTrailToLocalStorage();
  };

  const clearAuditTrail = () => {
    auditTrail.value = [];
    saveAuditTrailToLocalStorage();
  };

  const exportAuditTrail = (format: "csv" | "json"): string => {
    if (format === "json") {
      return JSON.stringify(auditTrail.value, null, 2);
    } else {
      // CSV format
      const headers = [
        "Timestamp",
        "Action",
        "Token",
        "Spender",
        "Previous Allowance",
        "New Allowance",
        "Transaction Hash",
        "Status",
      ];
      const rows = auditTrail.value.map((entry) => [
        entry.timestamp.toISOString(),
        entry.actionType,
        entry.tokenSymbol || entry.tokenAddress || entry.assetId || "",
        entry.spenderName || entry.spenderAddress,
        entry.previousAllowance || "",
        entry.newAllowance || "",
        entry.transactionHash || "",
        entry.status,
      ]);

      return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    }
  };

  const downloadAuditTrail = (format: "csv" | "json") => {
    const content = exportAuditTrail(format);
    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `allowance-audit-${new Date().toISOString()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage;
  };

  // Persistence
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allowances.value));
    } catch (e) {
      console.error("Failed to save allowances to localStorage:", e);
    }
  };

  const saveAuditTrailToLocalStorage = () => {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditTrail.value));
    } catch (e) {
      console.error("Failed to save audit trail to localStorage:", e);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restore dates
        allowances.value = parsed.map((a: Allowance) => ({
          ...a,
          discoveredAt: new Date(a.discoveredAt),
          lastInteractionTime: a.lastInteractionTime
            ? new Date(a.lastInteractionTime)
            : undefined,
        }));
      }

      const storedAudit = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (storedAudit) {
        const parsedAudit = JSON.parse(storedAudit);
        auditTrail.value = parsedAudit.map((entry: AllowanceAuditEntry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }
    } catch (e) {
      console.error("Failed to load allowances from localStorage:", e);
    }
  };

  // Initialize from localStorage on mount
  loadFromLocalStorage();

  return {
    // State
    allowances,
    auditTrail,
    isLoading,
    error,
    lastDiscovery,
    filters,
    sortOptions,

    // Computed
    filteredAllowances,
    statistics,

    // Actions
    setAllowances,
    addAllowance,
    removeAllowance,
    updateAllowance,
    clearAllowances,
    setFilters,
    resetFilters,
    setSortOptions,
    addAuditEntry,
    clearAuditTrail,
    exportAuditTrail,
    downloadAuditTrail,
    setLoading,
    setError,
    loadFromLocalStorage,
  };
});
