import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAllowancesStore } from "./allowances";
import type {
  EVMTokenAllowance,
  AllowanceActionType,
  AllowanceRiskLevel,
  AllowanceActivityStatus,
} from "../types/allowances";

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
});
