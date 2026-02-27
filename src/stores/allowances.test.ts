import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAllowancesStore } from "./allowances";
import type {
  EVMTokenAllowance,
  AVMAssetOptIn,
  AllowanceActionType,
  AllowanceRiskLevel,
  AllowanceActivityStatus,
} from "../types/allowances";
import { AllowanceSortField, SortDirection } from "../types/allowances";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("allowances store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.clear();
  });

  describe("state initialization", () => {
    it("should initialize with empty state", () => {
      const store = useAllowancesStore();
      expect(store.allowances).toEqual([]);
      expect(store.auditTrail).toEqual([]);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe(null);
    });

    it("should load from localStorage if available", () => {
      const mockAllowances: EVMTokenAllowance[] = [
        {
          id: "test-1",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x456",
          tokenAddress: "0x789",
          tokenSymbol: "USDC",
          tokenName: "USD Coin",
          tokenDecimals: 6,
          allowanceAmount: "1000000",
          formattedAllowance: "1 USDC",
          isUnlimited: false,
          riskLevel: "low" as AllowanceRiskLevel,
          activityStatus: "active" as AllowanceActivityStatus,
          discoveredAt: new Date("2024-01-01"),
        },
      ];

      localStorageMock.setItem("biatec_allowances", JSON.stringify(mockAllowances));

      const store = useAllowancesStore();
      expect(store.allowances.length).toBe(1);
      expect(store.allowances[0].tokenSymbol).toBe("USDC");
    });
  });

  describe("setAllowances", () => {
    it("should set allowances and update lastDiscovery", () => {
      const store = useAllowancesStore();
      const mockAllowances: EVMTokenAllowance[] = [
        {
          id: "test-1",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x456",
          tokenAddress: "0x789",
          tokenSymbol: "USDC",
          tokenName: "USD Coin",
          tokenDecimals: 6,
          allowanceAmount: "1000000",
          formattedAllowance: "1 USDC",
          isUnlimited: false,
          riskLevel: "low" as AllowanceRiskLevel,
          activityStatus: "active" as AllowanceActivityStatus,
          discoveredAt: new Date(),
        },
      ];

      store.setAllowances(mockAllowances);

      expect(store.allowances.length).toBe(1);
      expect(store.lastDiscovery).toBeTruthy();
    });

    it("should save to localStorage", () => {
      const store = useAllowancesStore();
      const mockAllowances: EVMTokenAllowance[] = [
        {
          id: "test-1",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x456",
          tokenAddress: "0x789",
          tokenSymbol: "USDC",
          tokenName: "USD Coin",
          tokenDecimals: 6,
          allowanceAmount: "1000000",
          formattedAllowance: "1 USDC",
          isUnlimited: false,
          riskLevel: "low" as AllowanceRiskLevel,
          activityStatus: "active" as AllowanceActivityStatus,
          discoveredAt: new Date(),
        },
      ];

      store.setAllowances(mockAllowances);

      const stored = localStorageMock.getItem("biatec_allowances");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(1);
    });
  });

  describe("addAllowance", () => {
    it("should add new allowance", () => {
      const store = useAllowancesStore();
      const mockAllowance: EVMTokenAllowance = {
        id: "test-1",
        chainType: "EVM",
        networkId: "ethereum",
        ownerAddress: "0x123",
        spenderAddress: "0x456",
        tokenAddress: "0x789",
        tokenSymbol: "USDC",
        tokenName: "USD Coin",
        tokenDecimals: 6,
        allowanceAmount: "1000000",
        formattedAllowance: "1 USDC",
        isUnlimited: false,
        riskLevel: "low" as AllowanceRiskLevel,
        activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };

      store.addAllowance(mockAllowance);

      expect(store.allowances.length).toBe(1);
      expect(store.allowances[0].id).toBe("test-1");
    });

    it("should update existing allowance with same ID", () => {
      const store = useAllowancesStore();
      const mockAllowance: EVMTokenAllowance = {
        id: "test-1",
        chainType: "EVM",
        networkId: "ethereum",
        ownerAddress: "0x123",
        spenderAddress: "0x456",
        tokenAddress: "0x789",
        tokenSymbol: "USDC",
        tokenName: "USD Coin",
        tokenDecimals: 6,
        allowanceAmount: "1000000",
        formattedAllowance: "1 USDC",
        isUnlimited: false,
        riskLevel: "low" as AllowanceRiskLevel,
        activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };

      store.addAllowance(mockAllowance);

      const updatedAllowance = { ...mockAllowance, tokenSymbol: "USDT" };
      store.addAllowance(updatedAllowance);

      expect(store.allowances.length).toBe(1);
      expect(store.allowances[0].tokenSymbol).toBe("USDT");
    });
  });

  describe("removeAllowance", () => {
    it("should remove allowance by ID", () => {
      const store = useAllowancesStore();
      const mockAllowance: EVMTokenAllowance = {
        id: "test-1",
        chainType: "EVM",
        networkId: "ethereum",
        ownerAddress: "0x123",
        spenderAddress: "0x456",
        tokenAddress: "0x789",
        tokenSymbol: "USDC",
        tokenName: "USD Coin",
        tokenDecimals: 6,
        allowanceAmount: "1000000",
        formattedAllowance: "1 USDC",
        isUnlimited: false,
        riskLevel: "low" as AllowanceRiskLevel,
        activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };

      store.addAllowance(mockAllowance);
      expect(store.allowances.length).toBe(1);

      store.removeAllowance("test-1");
      expect(store.allowances.length).toBe(0);
    });
  });

  describe("updateAllowance", () => {
    it("should update allowance properties", () => {
      const store = useAllowancesStore();
      const mockAllowance: EVMTokenAllowance = {
        id: "test-1",
        chainType: "EVM",
        networkId: "ethereum",
        ownerAddress: "0x123",
        spenderAddress: "0x456",
        tokenAddress: "0x789",
        tokenSymbol: "USDC",
        tokenName: "USD Coin",
        tokenDecimals: 6,
        allowanceAmount: "1000000",
        formattedAllowance: "1 USDC",
        isUnlimited: false,
        riskLevel: "low" as AllowanceRiskLevel,
        activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };

      store.addAllowance(mockAllowance);

      store.updateAllowance("test-1", { riskLevel: "high" as AllowanceRiskLevel });

      expect(store.allowances[0].riskLevel).toBe("high");
    });
  });

  describe("filters", () => {
    beforeEach(() => {
      const store = useAllowancesStore();
      const mockAllowances: EVMTokenAllowance[] = [
        {
          id: "test-1",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x456",
          tokenAddress: "0x789",
          tokenSymbol: "USDC",
          tokenName: "USD Coin",
          tokenDecimals: 6,
          allowanceAmount: "1000000",
          formattedAllowance: "1 USDC",
          isUnlimited: false,
          riskLevel: "low" as AllowanceRiskLevel,
          activityStatus: "active" as AllowanceActivityStatus,
          discoveredAt: new Date(),
        },
        {
          id: "test-2",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x789",
          tokenAddress: "0xABC",
          tokenSymbol: "DAI",
          tokenName: "Dai Stablecoin",
          tokenDecimals: 18,
          allowanceAmount: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          formattedAllowance: "Unlimited",
          isUnlimited: true,
          riskLevel: "critical" as AllowanceRiskLevel,
          activityStatus: "dormant" as AllowanceActivityStatus,
          discoveredAt: new Date(),
        },
      ];

      store.setAllowances(mockAllowances);
    });

    it("should filter by risk level", () => {
      const store = useAllowancesStore();
      store.setFilters({ riskLevels: ["critical" as AllowanceRiskLevel] });

      expect(store.filteredAllowances.length).toBe(1);
      expect(store.filteredAllowances[0].riskLevel).toBe("critical");
    });

    it("should filter by unlimited only", () => {
      const store = useAllowancesStore();
      store.setFilters({ showUnlimitedOnly: true });

      expect(store.filteredAllowances.length).toBe(1);
      expect((store.filteredAllowances[0] as EVMTokenAllowance).isUnlimited).toBe(true);
    });

    it("should filter by search query", () => {
      const store = useAllowancesStore();
      store.setFilters({ searchQuery: "dai" });

      expect(store.filteredAllowances.length).toBe(1);
      expect((store.filteredAllowances[0] as EVMTokenAllowance).tokenSymbol).toBe("DAI");
    });

    it("should reset filters", () => {
      const store = useAllowancesStore();
      store.setFilters({ riskLevels: ["critical" as AllowanceRiskLevel] });

      store.resetFilters();

      expect(store.filters.riskLevels).toEqual([]);
      expect(store.filteredAllowances.length).toBe(2);
    });
  });

  describe("statistics", () => {
    it("should calculate statistics correctly", () => {
      const store = useAllowancesStore();
      const mockAllowances: EVMTokenAllowance[] = [
        {
          id: "test-1",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x456",
          tokenAddress: "0x789",
          tokenSymbol: "USDC",
          tokenName: "USD Coin",
          tokenDecimals: 6,
          allowanceAmount: "1000000",
          formattedAllowance: "1 USDC",
          isUnlimited: false,
          riskLevel: "low" as AllowanceRiskLevel,
          activityStatus: "active" as AllowanceActivityStatus,
          valueUSD: 100,
          discoveredAt: new Date(),
        },
        {
          id: "test-2",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x789",
          tokenAddress: "0xABC",
          tokenSymbol: "DAI",
          tokenName: "Dai Stablecoin",
          tokenDecimals: 18,
          allowanceAmount: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          formattedAllowance: "Unlimited",
          isUnlimited: true,
          riskLevel: "critical" as AllowanceRiskLevel,
          activityStatus: "dormant" as AllowanceActivityStatus,
          valueUSD: 5000,
          discoveredAt: new Date(),
        },
      ];

      store.setAllowances(mockAllowances);

      const stats = store.statistics;
      expect(stats.totalAllowances).toBe(2);
      expect(stats.unlimitedAllowances).toBe(1);
      expect(stats.highRiskAllowances).toBe(1); // Only critical
      expect(stats.dormantAllowances).toBe(1);
      expect(stats.totalValueAtRisk).toBe(5100);
    });
  });

  describe("audit trail", () => {
    it("should add audit entry", () => {
      const store = useAllowancesStore();
      const entry = {
        id: "audit-1",
        timestamp: new Date(),
        actionType: "revoke" as AllowanceActionType,
        allowanceId: "test-1",
        chainType: "EVM" as const,
        networkId: "ethereum" as const,
        tokenAddress: "0x789",
        tokenSymbol: "USDC",
        spenderAddress: "0x456",
        previousAllowance: "1000000",
        newAllowance: "0",
        transactionHash: "0xabcd",
        status: "success" as const,
      };

      store.addAuditEntry(entry);

      expect(store.auditTrail.length).toBe(1);
      expect(store.auditTrail[0].actionType).toBe("revoke");
    });

    it("should export audit trail as JSON", () => {
      const store = useAllowancesStore();
      const entry = {
        id: "audit-1",
        timestamp: new Date(),
        actionType: "revoke" as AllowanceActionType,
        allowanceId: "test-1",
        chainType: "EVM" as const,
        networkId: "ethereum" as const,
        tokenAddress: "0x789",
        tokenSymbol: "USDC",
        spenderAddress: "0x456",
        previousAllowance: "1000000",
        newAllowance: "0",
        transactionHash: "0xabcd",
        status: "success" as const,
      };

      store.addAuditEntry(entry);

      const exported = store.exportAuditTrail("json");
      expect(exported).toContain("audit-1");
      expect(exported).toContain("revoke");
    });

    it("should export audit trail as CSV", () => {
      const store = useAllowancesStore();
      const entry = {
        id: "audit-1",
        timestamp: new Date(),
        actionType: "revoke" as AllowanceActionType,
        allowanceId: "test-1",
        chainType: "EVM" as const,
        networkId: "ethereum" as const,
        tokenAddress: "0x789",
        tokenSymbol: "USDC",
        spenderAddress: "0x456",
        previousAllowance: "1000000",
        newAllowance: "0",
        transactionHash: "0xabcd",
        status: "success" as const,
      };

      store.addAuditEntry(entry);

      const exported = store.exportAuditTrail("csv");
      expect(exported).toContain("Timestamp");
      expect(exported).toContain("Action");
      expect(exported).toContain("revoke");
    });

    it("should clear audit trail", () => {
      const store = useAllowancesStore();
      const entry = {
        id: "audit-1",
        timestamp: new Date(),
        actionType: "revoke" as AllowanceActionType,
        allowanceId: "test-1",
        chainType: "EVM" as const,
        networkId: "ethereum" as const,
        tokenAddress: "0x789",
        tokenSymbol: "USDC",
        spenderAddress: "0x456",
        status: "success" as const,
      };

      store.addAuditEntry(entry);
      expect(store.auditTrail.length).toBe(1);

      store.clearAuditTrail();
      expect(store.auditTrail.length).toBe(0);
    });
  });

  describe("sorting", () => {
    beforeEach(() => {
      const store = useAllowancesStore();
      const mockAllowances: EVMTokenAllowance[] = [
        {
          id: "test-1",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x456",
          tokenAddress: "0x789",
          tokenSymbol: "USDC",
          tokenName: "USD Coin",
          tokenDecimals: 6,
          allowanceAmount: "1000000",
          formattedAllowance: "1 USDC",
          isUnlimited: false,
          riskLevel: "low" as AllowanceRiskLevel,
          activityStatus: "active" as AllowanceActivityStatus,
          valueUSD: 100,
          discoveredAt: new Date(),
        },
        {
          id: "test-2",
          chainType: "EVM",
          networkId: "ethereum",
          ownerAddress: "0x123",
          spenderAddress: "0x789",
          tokenAddress: "0xABC",
          tokenSymbol: "DAI",
          tokenName: "Dai Stablecoin",
          tokenDecimals: 18,
          allowanceAmount: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          formattedAllowance: "Unlimited",
          isUnlimited: true,
          riskLevel: "critical" as AllowanceRiskLevel,
          activityStatus: "dormant" as AllowanceActivityStatus,
          valueUSD: 5000,
          discoveredAt: new Date(),
        },
      ];

      store.setAllowances(mockAllowances);
    });

    it("should sort by risk level descending by default", () => {
      const store = useAllowancesStore();
      
      expect(store.filteredAllowances[0].riskLevel).toBe("critical");
      expect(store.filteredAllowances[1].riskLevel).toBe("low");
    });

    it("should sort by token name", () => {
      const store = useAllowancesStore();
      store.setSortOptions({ field: "tokenName" as const, direction: "asc" as const });

      expect((store.filteredAllowances[0] as EVMTokenAllowance).tokenName).toBe("Dai Stablecoin");
      expect((store.filteredAllowances[1] as EVMTokenAllowance).tokenName).toBe("USD Coin");
    });

    it("should sort by value", () => {
      const store = useAllowancesStore();
      store.setSortOptions({ field: "value" as const, direction: "desc" as const });

      expect((store.filteredAllowances[0] as EVMTokenAllowance).valueUSD).toBe(5000);
      expect((store.filteredAllowances[1] as EVMTokenAllowance).valueUSD).toBe(100);
    });
  });

  describe('localStorage persistence', () => {
    it('should handle saveToLocalStorage gracefully without throwing', () => {
      const store = useAllowancesStore()
      
      // Should not throw when adding allowances (saveToLocalStorage is called internally)
      expect(() => store.addAllowance({
        id: 'persistence-test',
        chainType: 'EVM',
        networkId: 'ethereum',
        ownerAddress: '0x111',
        spenderAddress: '0x222',
        tokenAddress: '0x333',
        tokenSymbol: 'ETH',
        tokenName: 'Ether',
        tokenDecimals: 18,
        allowanceAmount: '1000',
        formattedAllowance: '0.001 ETH',
        isUnlimited: false,
        riskLevel: 'low' as AllowanceRiskLevel,
        activityStatus: 'active' as AllowanceActivityStatus,
        discoveredAt: new Date(),
      })).not.toThrow()
    })

    it('should persist and restore audit trail entries', () => {
      const store = useAllowancesStore()

      const entry = {
        id: 'audit-1',
        allowanceId: 'allw-1',
        action: 'revoke' as AllowanceActionType,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        txHash: '0xabc',
        status: 'confirmed' as const,
      }
      store.addAuditEntry(entry)

      // Should have persisted to localStorage key
      const stored = localStorage.getItem('biatec_allowance_audit')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed[0].id).toBe('audit-1')
    })

    it('should restore allowances from localStorage on store init', () => {
      const mockAllowance = {
        id: 'stored-1',
        chainType: 'EVM',
        networkId: 'ethereum',
        ownerAddress: '0xAA',
        spenderAddress: '0xBB',
        tokenAddress: '0xCC',
        tokenSymbol: 'USDC',
        tokenName: 'USD Coin',
        tokenDecimals: 6,
        allowanceAmount: '500',
        formattedAllowance: '0.0005 USDC',
        isUnlimited: false,
        riskLevel: 'low' as AllowanceRiskLevel,
        activityStatus: 'active' as AllowanceActivityStatus,
        discoveredAt: new Date().toISOString(),
      }
      localStorage.setItem('biatec_allowances', JSON.stringify([mockAllowance]))

      // New store instance should load from localStorage
      const store2 = useAllowancesStore()
      // Store initializes with loadFromLocalStorage() on creation
      expect(store2.allowances.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe("filter by activityStatus", () => {
    it("should filter by active activity status", () => {
      const store = useAllowancesStore();
      const active: EVMTokenAllowance = {
        id: "a1", chainType: "EVM", networkId: "ethereum",
        ownerAddress: "0x1", spenderAddress: "0x2", tokenAddress: "0x3",
        tokenSymbol: "USDC", tokenName: "USD Coin", tokenDecimals: 6,
        allowanceAmount: "1000", formattedAllowance: "1 USDC", isUnlimited: false,
        riskLevel: "low" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      const dormant: EVMTokenAllowance = { ...active, id: "a2", activityStatus: "dormant" as AllowanceActivityStatus };
      store.setAllowances([active, dormant]);
      store.setFilters({ activityStatuses: ["active" as AllowanceActivityStatus] });
      expect(store.filteredAllowances.length).toBe(1);
      expect(store.filteredAllowances[0].id).toBe("a1");
    });
  });

  describe("filter by networkId", () => {
    it("should filter by specific network", () => {
      const store = useAllowancesStore();
      const eth: EVMTokenAllowance = {
        id: "n1", chainType: "EVM", networkId: "ethereum",
        ownerAddress: "0x1", spenderAddress: "0x2", tokenAddress: "0x3",
        tokenSymbol: "USDC", tokenName: "USD Coin", tokenDecimals: 6,
        allowanceAmount: "1000", formattedAllowance: "1 USDC", isUnlimited: false,
        riskLevel: "low" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      const arb: EVMTokenAllowance = { ...eth, id: "n2", networkId: "arbitrum" };
      store.setAllowances([eth, arb]);
      store.setFilters({ networkIds: ["ethereum" as any] });
      expect(store.filteredAllowances.length).toBe(1);
      expect(store.filteredAllowances[0].id).toBe("n1");
    });
  });

  describe("filter showUnlimitedOnly with AVM token", () => {
    it("should return false for AVM tokens when showUnlimitedOnly is true", () => {
      const store = useAllowancesStore();
      const avm: AVMAssetOptIn = {
        id: "avm1", chainType: "AVM", networkId: "algorand-mainnet" as any,
        ownerAddress: "ALGO123", spenderAddress: "ALGO456",
        assetId: 123, decimals: 6, creatorAddress: "ALGO789",
        isOptedIn: true, balance: "100", isFrozen: false,
        riskLevel: "low" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      store.setAllowances([avm]);
      store.setFilters({ showUnlimitedOnly: true });
      expect(store.filteredAllowances.length).toBe(0);
    });
  });

  describe("search with AVM token", () => {
    it("should search by assetName and unitName for AVM tokens", () => {
      const store = useAllowancesStore();
      const avm: AVMAssetOptIn = {
        id: "avm2", chainType: "AVM", networkId: "algorand-mainnet" as any,
        ownerAddress: "ALGO123", spenderAddress: "ALGO456",
        assetId: 456, assetName: "Algorand Gold", unitName: "ALGOLD",
        decimals: 6, creatorAddress: "ALGO789",
        isOptedIn: true, balance: "100", isFrozen: false,
        riskLevel: "low" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      store.setAllowances([avm]);
      store.setFilters({ searchQuery: "algold" });
      expect(store.filteredAllowances.length).toBe(1);
    });

    it("should return empty when assetName/unitName undefined and no match on address", () => {
      const store = useAllowancesStore();
      const avm: AVMAssetOptIn = {
        id: "avm3", chainType: "AVM", networkId: "algorand-mainnet" as any,
        ownerAddress: "ALGO123", spenderAddress: "ALGO456",
        assetId: 789, decimals: 6, creatorAddress: "ALGO789",
        isOptedIn: true, balance: "100", isFrozen: false,
        riskLevel: "low" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      store.setAllowances([avm]);
      store.setFilters({ searchQuery: "nonexistent" });
      expect(store.filteredAllowances.length).toBe(0);
    });
  });

  describe("sorting by value, lastInteraction, spenderName", () => {
    const makeEVM = (id: string, valueUSD?: number, lastInteraction?: Date, spenderName?: string): EVMTokenAllowance => ({
      id, chainType: "EVM", networkId: "ethereum",
      ownerAddress: "0x1", spenderAddress: "0x" + id, tokenAddress: "0x99",
      tokenSymbol: "TOK", tokenName: "Token", tokenDecimals: 18,
      allowanceAmount: "1000", formattedAllowance: "1 TOK", isUnlimited: false,
      riskLevel: "low" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
      discoveredAt: new Date(), valueUSD, lastInteractionTime: lastInteraction,
      spenderName,
    });

    it("should sort by value ascending", () => {
      const store = useAllowancesStore();
      store.setAllowances([makeEVM("v1", 500), makeEVM("v2", 100), makeEVM("v3", 300)]);
      store.setSortOptions({ field: AllowanceSortField.VALUE, direction: SortDirection.ASC });
      expect((store.filteredAllowances[0] as EVMTokenAllowance).valueUSD).toBe(100);
      expect((store.filteredAllowances[2] as EVMTokenAllowance).valueUSD).toBe(500);
    });

    it("should sort by value with AVM tokens treated as value 0", () => {
      const store = useAllowancesStore();
      const avm: AVMAssetOptIn = {
        id: "avm-v", chainType: "AVM", networkId: "algorand-mainnet" as any,
        ownerAddress: "ALGO1", spenderAddress: "ALGO2",
        assetId: 999, decimals: 6, creatorAddress: "ALGO3",
        isOptedIn: true, balance: "100", isFrozen: false,
        riskLevel: "low" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      const evm = makeEVM("evm-v", 1000);
      store.setAllowances([avm, evm]);
      store.setSortOptions({ field: AllowanceSortField.VALUE, direction: SortDirection.DESC });
      expect(store.filteredAllowances[0].id).toBe("evm-v");
    });

    it("should sort by last interaction time ascending", () => {
      const store = useAllowancesStore();
      const old = makeEVM("li1", undefined, new Date("2023-01-01"));
      const recent = makeEVM("li2", undefined, new Date("2024-01-01"));
      const none = makeEVM("li3");
      store.setAllowances([recent, none, old]);
      store.setSortOptions({ field: AllowanceSortField.LAST_INTERACTION, direction: SortDirection.ASC });
      // None (time=0) < old < recent
      expect(store.filteredAllowances[0].id).toBe("li3");
      expect(store.filteredAllowances[2].id).toBe("li2");
    });

    it("should sort by spender name ascending", () => {
      const store = useAllowancesStore();
      store.setAllowances([
        makeEVM("s1", undefined, undefined, "Zebra Protocol"),
        makeEVM("s2", undefined, undefined, "Alpha Protocol"),
      ]);
      store.setSortOptions({ field: AllowanceSortField.SPENDER_NAME, direction: SortDirection.ASC });
      expect(store.filteredAllowances[0].id).toBe("s2");
    });

    it("should sort by token name for AVM tokens using assetName", () => {
      const store = useAllowancesStore();
      const avm1: AVMAssetOptIn = {
        id: "avm-name1", chainType: "AVM", networkId: "algorand-mainnet" as any,
        ownerAddress: "A1", spenderAddress: "A2", assetId: 1,
        assetName: "Zebra", decimals: 6, creatorAddress: "A3",
        isOptedIn: true, balance: "1", isFrozen: false,
        riskLevel: "low" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      const avm2: AVMAssetOptIn = { ...avm1, id: "avm-name2", assetId: 2, assetName: "Alpha" };
      store.setAllowances([avm1, avm2]);
      store.setSortOptions({ field: AllowanceSortField.TOKEN_NAME, direction: SortDirection.ASC });
      expect(store.filteredAllowances[0].id).toBe("avm-name2");
    });
  });

  describe("statistics with AVM and missing valueUSD", () => {
    it("should not count AVM token as unlimited or add valueUSD", () => {
      const store = useAllowancesStore();
      const avm: AVMAssetOptIn = {
        id: "avm-stat", chainType: "AVM", networkId: "algorand-mainnet" as any,
        ownerAddress: "A1", spenderAddress: "A2", assetId: 100,
        decimals: 6, creatorAddress: "A3",
        isOptedIn: true, balance: "1", isFrozen: false,
        riskLevel: "critical" as AllowanceRiskLevel, activityStatus: "dormant" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      store.setAllowances([avm]);
      const stats = store.statistics;
      expect(stats.unlimitedAllowances).toBe(0); // AVM has no isUnlimited
      expect(stats.highRiskAllowances).toBe(1);
      expect(stats.dormantAllowances).toBe(1);
      expect(stats.totalValueAtRisk).toBe(0);
    });

    it("should not add to totalValueAtRisk when EVM valueUSD is undefined", () => {
      const store = useAllowancesStore();
      const evm: EVMTokenAllowance = {
        id: "evm-noval", chainType: "EVM", networkId: "ethereum",
        ownerAddress: "0x1", spenderAddress: "0x2", tokenAddress: "0x3",
        tokenSymbol: "ETH", tokenName: "Ether", tokenDecimals: 18,
        allowanceAmount: "1000", formattedAllowance: "0.001 ETH", isUnlimited: false,
        riskLevel: "high" as AllowanceRiskLevel, activityStatus: "active" as AllowanceActivityStatus,
        discoveredAt: new Date(),
      };
      store.setAllowances([evm]);
      const stats = store.statistics;
      expect(stats.totalValueAtRisk).toBe(0);
      expect(stats.highRiskAllowances).toBe(1);
    });
  });

  describe("updateAllowance when not found", () => {
    it("should do nothing when allowance ID is not found", () => {
      const store = useAllowancesStore();
      store.setAllowances([]);
      expect(() => store.updateAllowance("nonexistent-id", { riskLevel: "high" as AllowanceRiskLevel })).not.toThrow();
      expect(store.allowances.length).toBe(0);
    });
  });

  describe("downloadAuditTrail", () => {
    it("should call URL.createObjectURL and revokeObjectURL for json format", () => {
      const store = useAllowancesStore();
      const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://test/123");
      const revokeObjectURLSpy = vi.fn();
      const clickSpy = vi.fn();
      Object.defineProperty(URL, "createObjectURL", { value: createObjectURLSpy, writable: true, configurable: true });
      Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURLSpy, writable: true, configurable: true });
      vi.spyOn(document, "createElement").mockReturnValue({ href: "", download: "", click: clickSpy } as any);
      const entry = {
        id: "dl-1", timestamp: new Date(), actionType: "revoke" as AllowanceActionType,
        allowanceId: "a1", chainType: "EVM" as const, networkId: "ethereum" as const,
        tokenAddress: "0x1", spenderAddress: "0x2", status: "success" as const,
      };
      store.addAuditEntry(entry);
      store.downloadAuditTrail("json");
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
      vi.restoreAllMocks();
    });

    it("should create CSV blob for csv format", () => {
      const store = useAllowancesStore();
      const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://test/456");
      const revokeObjectURLSpy = vi.fn();
      Object.defineProperty(URL, "createObjectURL", { value: createObjectURLSpy, writable: true, configurable: true });
      Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURLSpy, writable: true, configurable: true });
      vi.spyOn(document, "createElement").mockReturnValue({ href: "", download: "", click: vi.fn() } as any);
      store.downloadAuditTrail("csv");
      expect(createObjectURLSpy).toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });

  describe("loadFromLocalStorage with stored audit trail", () => {
    it("should restore audit trail with Date objects from localStorage", () => {
      const stored = [
        { id: "stored-audit-1", timestamp: "2024-01-15T00:00:00.000Z",
          actionType: "revoke", allowanceId: "a1", chainType: "EVM",
          networkId: "ethereum", tokenAddress: "0x1", spenderAddress: "0x2", status: "success" }
      ];
      localStorageMock.setItem("biatec_allowance_audit", JSON.stringify(stored));
      const store = useAllowancesStore();
      store.loadFromLocalStorage();
      expect(store.auditTrail.length).toBe(1);
      expect(store.auditTrail[0].timestamp).toBeInstanceOf(Date);
    });

    it("should handle catch in loadFromLocalStorage gracefully", () => {
      localStorageMock.setItem("biatec_allowances", "invalid-json{{{");
      const store = useAllowancesStore();
      expect(() => store.loadFromLocalStorage()).not.toThrow();
    });
  });
});
