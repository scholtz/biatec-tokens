/**
 * Whitelist and Jurisdiction Management Store
 * Manages state for compliance whitelist workflows
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { whitelistService } from "../services/whitelistService";
import type {
  WhitelistEntry,
  WhitelistFilters,
  WhitelistSummary,
  JurisdictionRule,
  JurisdictionCoverage,
  JurisdictionConflict,
  CreateWhitelistEntryRequest,
  UpdateWhitelistEntryRequest,
  ApproveWhitelistEntryRequest,
  RejectWhitelistEntryRequest,
  RequestMoreInfoRequest,
  BulkImportRequest,
  BulkImportResponse,
  CsvValidationResult,
} from "../types/whitelist";

export const useWhitelistStore = defineStore("whitelist", () => {
  // State
  const entries = ref<WhitelistEntry[]>([]);
  const selectedEntry = ref<WhitelistEntry | null>(null);
  const summary = ref<WhitelistSummary | null>(null);
  const jurisdictionRules = ref<JurisdictionRule[]>([]);
  const jurisdictionCoverage = ref<JurisdictionCoverage | null>(null);
  const conflicts = ref<JurisdictionConflict[]>([]);

  const isLoading = ref(false);
  const isLoadingSummary = ref(false);
  const isLoadingJurisdictions = ref(false);
  const error = ref<string | null>(null);

  const filters = ref<WhitelistFilters>({
    page: 1,
    perPage: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const pagination = ref({
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
  });

  // Computed
  const hasEntries = computed(() => entries.value.length > 0);
  const hasJurisdictionRules = computed(() => jurisdictionRules.value.length > 0);
  const hasConflicts = computed(() => conflicts.value.length > 0);
  const criticalConflicts = computed(() => conflicts.value.filter((c) => c.severity === "error"));

  // Actions
  async function fetchWhitelistEntries() {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await whitelistService.getWhitelistEntries(filters.value);
      entries.value = response.data;
      pagination.value = {
        total: response.total,
        page: response.page,
        perPage: response.perPage,
        totalPages: response.totalPages,
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load whitelist entries";
      console.error("Error fetching whitelist entries:", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchWhitelistSummary() {
    isLoadingSummary.value = true;
    error.value = null;

    try {
      summary.value = await whitelistService.getWhitelistSummary();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load summary";
      console.error("Error fetching whitelist summary:", err);
    } finally {
      isLoadingSummary.value = false;
    }
  }

  async function fetchWhitelistEntry(id: string): Promise<WhitelistEntry | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const entry = await whitelistService.getWhitelistEntry(id);
      selectedEntry.value = entry;
      return entry;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load entry";
      console.error("Error fetching whitelist entry:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function createWhitelistEntry(request: CreateWhitelistEntryRequest): Promise<WhitelistEntry | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const newEntry = await whitelistService.createWhitelistEntry(request);

      // Optimistically add to entries
      entries.value.unshift(newEntry);

      // Refresh summary
      await fetchWhitelistSummary();

      return newEntry;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to create entry";
      console.error("Error creating whitelist entry:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateWhitelistEntry(id: string, request: UpdateWhitelistEntryRequest): Promise<WhitelistEntry | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const updatedEntry = await whitelistService.updateWhitelistEntry(id, request);

      // Update in entries array
      const index = entries.value.findIndex((e) => e.id === id);
      if (index !== -1 && updatedEntry) {
        entries.value[index] = updatedEntry;
      }

      // Update selected entry if it's the one being updated
      if (selectedEntry.value?.id === id) {
        selectedEntry.value = updatedEntry;
      }

      return updatedEntry;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to update entry";
      console.error("Error updating whitelist entry:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function approveWhitelistEntry(request: ApproveWhitelistEntryRequest): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const updatedEntry = await whitelistService.approveWhitelistEntry(request);

      // Update in entries array
      const index = entries.value.findIndex((e) => e.id === request.id);
      if (index !== -1 && updatedEntry) {
        entries.value[index] = updatedEntry;
      }

      // Update selected entry
      if (selectedEntry.value?.id === request.id) {
        selectedEntry.value = updatedEntry;
      }

      // Refresh summary
      await fetchWhitelistSummary();

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to approve entry";
      console.error("Error approving whitelist entry:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function rejectWhitelistEntry(request: RejectWhitelistEntryRequest): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const updatedEntry = await whitelistService.rejectWhitelistEntry(request);

      // Update in entries array
      const index = entries.value.findIndex((e) => e.id === request.id);
      if (index !== -1 && updatedEntry) {
        entries.value[index] = updatedEntry;
      }

      // Update selected entry
      if (selectedEntry.value?.id === request.id) {
        selectedEntry.value = updatedEntry;
      }

      // Refresh summary
      await fetchWhitelistSummary();

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to reject entry";
      console.error("Error rejecting whitelist entry:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function requestMoreInfo(request: RequestMoreInfoRequest): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const updatedEntry = await whitelistService.requestMoreInfo(request);

      // Update in entries array
      const index = entries.value.findIndex((e) => e.id === request.id);
      if (index !== -1) {
        entries.value[index] = updatedEntry;
      }

      // Update selected entry
      if (selectedEntry.value?.id === request.id) {
        selectedEntry.value = updatedEntry;
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to request info";
      console.error("Error requesting more info:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function validateCsv(file: File): Promise<CsvValidationResult | null> {
    isLoading.value = true;
    error.value = null;

    try {
      return await whitelistService.validateCsv(file);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to validate CSV";
      console.error("Error validating CSV:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function bulkImport(request: BulkImportRequest): Promise<BulkImportResponse | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await whitelistService.bulkImport(request);

      // Refresh entries and summary
      await fetchWhitelistEntries();
      await fetchWhitelistSummary();

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to import entries";
      console.error("Error bulk importing entries:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchJurisdictionRules() {
    isLoadingJurisdictions.value = true;
    error.value = null;

    try {
      jurisdictionRules.value = await whitelistService.getJurisdictionRules();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load jurisdiction rules";
      console.error("Error fetching jurisdiction rules:", err);
    } finally {
      isLoadingJurisdictions.value = false;
    }
  }

  async function fetchJurisdictionCoverage() {
    isLoadingJurisdictions.value = true;
    error.value = null;

    try {
      jurisdictionCoverage.value = await whitelistService.getJurisdictionCoverage();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load jurisdiction coverage";
      console.error("Error fetching jurisdiction coverage:", err);
    } finally {
      isLoadingJurisdictions.value = false;
    }
  }

  async function createJurisdictionRule(rule: Omit<JurisdictionRule, "id" | "createdAt" | "updatedAt">): Promise<JurisdictionRule | null> {
    isLoadingJurisdictions.value = true;
    error.value = null;

    try {
      const newRule = await whitelistService.createJurisdictionRule(rule);
      jurisdictionRules.value.push(newRule);
      await fetchJurisdictionCoverage();
      return newRule;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to create jurisdiction rule";
      console.error("Error creating jurisdiction rule:", err);
      return null;
    } finally {
      isLoadingJurisdictions.value = false;
    }
  }

  async function updateJurisdictionRule(id: string, updates: Partial<JurisdictionRule>): Promise<JurisdictionRule | null> {
    isLoadingJurisdictions.value = true;
    error.value = null;

    try {
      const updatedRule = await whitelistService.updateJurisdictionRule(id, updates);
      const index = jurisdictionRules.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        jurisdictionRules.value[index] = updatedRule;
      }
      await fetchJurisdictionCoverage();
      return updatedRule;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to update jurisdiction rule";
      console.error("Error updating jurisdiction rule:", err);
      return null;
    } finally {
      isLoadingJurisdictions.value = false;
    }
  }

  async function deleteJurisdictionRule(id: string): Promise<boolean> {
    isLoadingJurisdictions.value = true;
    error.value = null;

    try {
      await whitelistService.deleteJurisdictionRule(id);
      jurisdictionRules.value = jurisdictionRules.value.filter((r) => r.id !== id);
      await fetchJurisdictionCoverage();
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to delete jurisdiction rule";
      console.error("Error deleting jurisdiction rule:", err);
      return false;
    } finally {
      isLoadingJurisdictions.value = false;
    }
  }

  async function checkJurisdictionConflicts(tokenProgramId?: string) {
    isLoadingJurisdictions.value = true;
    error.value = null;

    try {
      conflicts.value = await whitelistService.checkJurisdictionConflicts(tokenProgramId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to check conflicts";
      console.error("Error checking jurisdiction conflicts:", err);
    } finally {
      isLoadingJurisdictions.value = false;
    }
  }

  function setFilters(newFilters: Partial<WhitelistFilters>) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      page: 1,
      perPage: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
  }

  function clearError() {
    error.value = null;
  }

  function selectEntry(entry: WhitelistEntry | null) {
    selectedEntry.value = entry;
  }

  return {
    // State
    entries,
    selectedEntry,
    summary,
    jurisdictionRules,
    jurisdictionCoverage,
    conflicts,
    isLoading,
    isLoadingSummary,
    isLoadingJurisdictions,
    error,
    filters,
    pagination,

    // Computed
    hasEntries,
    hasJurisdictionRules,
    hasConflicts,
    criticalConflicts,

    // Actions
    fetchWhitelistEntries,
    fetchWhitelistSummary,
    fetchWhitelistEntry,
    createWhitelistEntry,
    updateWhitelistEntry,
    approveWhitelistEntry,
    rejectWhitelistEntry,
    requestMoreInfo,
    validateCsv,
    bulkImport,
    fetchJurisdictionRules,
    fetchJurisdictionCoverage,
    createJurisdictionRule,
    updateJurisdictionRule,
    deleteJurisdictionRule,
    checkJurisdictionConflicts,
    setFilters,
    resetFilters,
    clearError,
    selectEntry,
  };
});
