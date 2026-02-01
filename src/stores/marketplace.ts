import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Token } from "./tokens";

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
  issuer?: string;
  whitelistStatus?: "enabled" | "disabled" | "partial";
  complianceBadges?: string[];
  network?: Network;
  isMicaCompliant?: boolean;
  kycRequired?: boolean;
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

  // Mock data for demonstration
  const mockTokens: MarketplaceToken[] = [
    {
      id: "marketplace-1",
      name: "MICA Stable EUR",
      symbol: "MEUR",
      standard: "ARC200",
      type: "FT",
      supply: 10000000,
      decimals: 6,
      description: "MICA-compliant EUR-pegged stablecoin for regulated markets",
      status: "deployed",
      createdAt: new Date("2024-01-15T10:00:00"),
      price: 1.05,
      priceChange24h: 0.5,
      issuer: "Biatec Finance",
      whitelistStatus: "enabled",
      complianceBadges: ["MICA Compliant", "KYC Required"],
      network: "VOI",
      isMicaCompliant: true,
      kycRequired: true,
      assetId: 123456,
    },
    {
      id: "marketplace-2",
      name: "Real Estate Token",
      symbol: "RET",
      standard: "ARC3FT",
      type: "FT",
      supply: 1000000,
      decimals: 2,
      description: "Tokenized real estate investment opportunity with quarterly dividends",
      status: "deployed",
      createdAt: new Date("2024-01-20T14:30:00"),
      price: 100.0,
      priceChange24h: 2.3,
      issuer: "PropChain LLC",
      whitelistStatus: "enabled",
      complianceBadges: ["Whitelisted", "KYC Required"],
      network: "Aramid",
      isMicaCompliant: false,
      kycRequired: true,
      assetId: 234567,
    },
    {
      id: "marketplace-3",
      name: "DeFi Governance Token",
      symbol: "DGT",
      standard: "ERC20",
      type: "FT",
      supply: 100000000,
      decimals: 18,
      description: "Governance token for decentralized finance protocol",
      status: "deployed",
      createdAt: new Date("2024-02-01T09:15:00"),
      price: 5.75,
      priceChange24h: -1.2,
      issuer: "DeFi Protocol",
      whitelistStatus: "disabled",
      complianceBadges: [],
      network: "Ethereum",
      isMicaCompliant: false,
      kycRequired: false,
      contractAddress: "0x1234567890abcdef",
    },
    {
      id: "marketplace-4",
      name: "Art Collection NFT",
      symbol: "ACNFT",
      standard: "ARC72",
      type: "NFT",
      supply: 1000,
      description: "Limited edition digital art collection by renowned artists",
      status: "deployed",
      createdAt: new Date("2024-01-10T16:45:00"),
      price: 50.0,
      priceChange24h: 5.8,
      issuer: "Art Gallery DAO",
      whitelistStatus: "partial",
      complianceBadges: ["MICA Compliant"],
      network: "VOI",
      isMicaCompliant: true,
      kycRequired: false,
      assetId: 345678,
    },
    {
      id: "marketplace-5",
      name: "Carbon Credit Token",
      symbol: "CCT",
      standard: "ARC200",
      type: "FT",
      supply: 5000000,
      decimals: 6,
      description: "Tokenized carbon credits for environmental impact",
      status: "deployed",
      createdAt: new Date("2024-01-25T11:20:00"),
      price: 15.0,
      priceChange24h: 3.1,
      issuer: "Green Finance",
      whitelistStatus: "enabled",
      complianceBadges: ["MICA Compliant", "Whitelisted"],
      network: "Aramid",
      isMicaCompliant: true,
      kycRequired: false,
      assetId: 456789,
    },
    {
      id: "marketplace-6",
      name: "Gaming Token",
      symbol: "GAME",
      standard: "ERC20",
      type: "FT",
      supply: 500000000,
      decimals: 18,
      description: "In-game currency for multiverse gaming ecosystem",
      status: "deployed",
      createdAt: new Date("2024-02-05T08:00:00"),
      price: 0.25,
      priceChange24h: -0.8,
      issuer: "GameVerse Studios",
      whitelistStatus: "disabled",
      complianceBadges: [],
      network: "Arbitrum",
      isMicaCompliant: false,
      kycRequired: false,
      contractAddress: "0xabcdef1234567890",
    },
  ];

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

  // Actions
  const loadTokens = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      tokens.value = mockTokens;
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
  };
});
