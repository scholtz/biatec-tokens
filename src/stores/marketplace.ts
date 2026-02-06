import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Token } from "./tokens";
import { priceOracleService } from "../services/PriceOracleService";

export type Network = "All" | "VOI" | "Aramid" | "Algorand Mainnet" | "Algorand Testnet" | "Ethereum" | "Arbitrum" | "Base" | "Sepolia";
export type ComplianceBadge = "All" | "MICA Compliant" | "KYC Required" | "Whitelisted" | "None";
export type AssetClass = "All" | "FT" | "NFT";

export interface MarketplaceFilters {
  network: Network;
  complianceBadge: ComplianceBadge;
  assetClass: AssetClass;
  search: string;
}

export interface MarketplaceToken extends Token {
  price?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  volume24h?: number;
  marketCap?: number;
  priceSource?: string;
  priceLastUpdated?: Date;
  issuer?: string;
  whitelistStatus?: "enabled" | "disabled" | "partial";
  complianceBadges?: string[];
  network?: Network;
  isMicaCompliant?: boolean;
  kycRequired?: boolean;
  // Additional fields for discovery
  complianceStatus?: 'compliant' | 'partial' | 'pending' | 'non-compliant' | 'unknown';
  issuerType?: 'individual' | 'company' | 'enterprise' | 'dao' | 'verified';
  liquidity?: number;
  contractVerified?: boolean;
  issuerIdentityVerified?: boolean;
  auditCompleted?: boolean;
  riskFlags?: string[];
}

export const useMarketplaceStore = defineStore("marketplace", () => {
  // State
  const tokens = ref<MarketplaceToken[]>([]);
  const filters = ref<MarketplaceFilters>({
    network: "All",
    complianceBadge: "All",
    assetClass: "All",
    search: "",
  });
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pricesLoading = ref(false);
  const pricePollingEnabled = ref(false);
  const pricePollingInterval = ref<number | null>(null);

  // Mock data removed per MVP requirements (AC #7)
  // Previously contained 6 mock tokens for demonstration
  // Now using empty array to show intentional empty state
  const mockTokens: MarketplaceToken[] = [];

  // Computed
  const filteredTokens = computed(() => {
    let result = [...tokens.value];

    // Apply search filter
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase();
      result = result.filter(
        (token) =>
          token.name.toLowerCase().includes(searchLower) ||
          token.symbol.toLowerCase().includes(searchLower) ||
          token.description.toLowerCase().includes(searchLower) ||
          token.issuer?.toLowerCase().includes(searchLower)
      );
    }

    // Apply network filter
    if (filters.value.network !== "All") {
      result = result.filter((token) => token.network === filters.value.network);
    }

    // Apply compliance badge filter
    if (filters.value.complianceBadge !== "All") {
      result = result.filter((token) => {
        if (filters.value.complianceBadge === "MICA Compliant") {
          return token.isMicaCompliant === true;
        }
        if (filters.value.complianceBadge === "KYC Required") {
          return token.kycRequired === true;
        }
        if (filters.value.complianceBadge === "Whitelisted") {
          return token.whitelistStatus === "enabled" || token.whitelistStatus === "partial";
        }
        if (filters.value.complianceBadge === "None") {
          return !token.complianceBadges || token.complianceBadges.length === 0;
        }
        return true;
      });
    }

    // Apply asset class filter
    if (filters.value.assetClass !== "All") {
      result = result.filter((token) => token.type === filters.value.assetClass);
    }

    return result;
  });

  const totalTokens = computed(() => tokens.value.length);
  const filteredCount = computed(() => filteredTokens.value.length);

  /**
   * Fetches real-time prices for all tokens
   */
  const fetchTokenPrices = async (): Promise<void> => {
    if (tokens.value.length === 0) return;

    pricesLoading.value = true;

    try {
      const tokenData = tokens.value.map((token) => ({
        tokenId: token.id,
        symbol: token.symbol,
        network: token.network || "VOI",
      }));

      const prices = await priceOracleService.getBatchPrices(tokenData);

      // Update tokens with price data
      tokens.value = tokens.value.map((token) => {
        const priceData = prices.get(token.id);
        if (priceData) {
          return {
            ...token,
            price: priceData.price,
            priceChange24h: priceData.priceChange24h,
            priceChange7d: priceData.priceChange7d,
            volume24h: priceData.volume24h,
            marketCap: priceData.marketCap,
            priceSource: priceData.source,
            priceLastUpdated: priceData.lastUpdated,
          };
        }
        return token;
      });
    } catch (err) {
      console.error("Failed to fetch token prices:", err);
    } finally {
      pricesLoading.value = false;
    }
  };

  /**
   * Fetches price for a single token
   */
  const fetchTokenPrice = async (tokenId: string): Promise<void> => {
    const token = tokens.value.find((t) => t.id === tokenId);
    if (!token) return;

    try {
      const priceData = await priceOracleService.getTokenPrice(
        token.id,
        token.symbol,
        token.network || "VOI",
        true // force refresh
      );

      if (priceData) {
        // Update specific token
        const index = tokens.value.findIndex((t) => t.id === tokenId);
        if (index !== -1) {
          tokens.value[index] = {
            ...tokens.value[index],
            price: priceData.price,
            priceChange24h: priceData.priceChange24h,
            priceChange7d: priceData.priceChange7d,
            volume24h: priceData.volume24h,
            marketCap: priceData.marketCap,
            priceSource: priceData.source,
            priceLastUpdated: priceData.lastUpdated,
          };
        }
      }
    } catch (err) {
      console.error(`Failed to fetch price for token ${tokenId}:`, err);
    }
  };

  /**
   * Starts polling for price updates
   */
  const startPricePolling = (intervalMs: number = 60000): void => {
    if (pricePollingInterval.value) {
      stopPricePolling();
    }

    pricePollingEnabled.value = true;

    // Fetch immediately
    fetchTokenPrices();

    // Set up polling
    pricePollingInterval.value = window.setInterval(() => {
      if (pricePollingEnabled.value) {
        fetchTokenPrices();
      }
    }, intervalMs);
  };

  /**
   * Stops price polling
   */
  const stopPricePolling = (): void => {
    if (pricePollingInterval.value) {
      clearInterval(pricePollingInterval.value);
      pricePollingInterval.value = null;
    }
    pricePollingEnabled.value = false;
  };

  /**
   * Clears price cache
   */
  const clearPriceCache = (): void => {
    priceOracleService.clearCache();
  };

  /**
   * Gets price cache statistics
   */
  const getPriceCacheStats = () => {
    return priceOracleService.getCacheStats();
  };

  // Actions
  const loadTokens = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      tokens.value = mockTokens;

      // Fetch prices after loading tokens
      await fetchTokenPrices();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load tokens";
    } finally {
      loading.value = false;
    }
  };

  const updateFilters = (newFilters: Partial<MarketplaceFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = () => {
    filters.value = {
      network: "All",
      complianceBadge: "All",
      assetClass: "All",
      search: "",
    };
  };

  const setFiltersFromUrl = (params: URLSearchParams) => {
    const network = params.get("network") as Network | null;
    const complianceBadge = params.get("compliance") as ComplianceBadge | null;
    const assetClass = params.get("assetClass") as AssetClass | null;
    const search = params.get("search");

    if (network) filters.value.network = network;
    if (complianceBadge) filters.value.complianceBadge = complianceBadge;
    if (assetClass) filters.value.assetClass = assetClass;
    if (search) filters.value.search = search;
  };

  const getUrlParams = (): URLSearchParams => {
    const params = new URLSearchParams();
    if (filters.value.network !== "All") params.set("network", filters.value.network);
    if (filters.value.complianceBadge !== "All") params.set("compliance", filters.value.complianceBadge);
    if (filters.value.assetClass !== "All") params.set("assetClass", filters.value.assetClass);
    if (filters.value.search) params.set("search", filters.value.search);
    return params;
  };

  return {
    // State
    tokens,
    filters,
    loading,
    error,
    pricesLoading,
    pricePollingEnabled,

    // Computed
    filteredTokens,
    totalTokens,
    filteredCount,

    // Actions
    loadTokens,
    updateFilters,
    resetFilters,
    setFiltersFromUrl,
    getUrlParams,
    fetchTokenPrices,
    fetchTokenPrice,
    startPricePolling,
    stopPricePolling,
    clearPriceCache,
    getPriceCacheStats,
  };
});
