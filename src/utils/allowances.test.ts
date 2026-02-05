import { describe, it, expect } from "vitest";
import {
  isUnlimitedAllowance,
  formatAllowanceAmount,
  calculateEVMRiskLevel,
  calculateAVMRiskLevel,
  calculateActivityStatus,
  generateAllowanceId,
  getKnownSpenderName,
  formatAddress,
  isValidEthereumAddress,
  getRiskBadgeVariant,
  getActivityBadgeVariant,
  getRiskLevelLabel,
  getActivityStatusLabel,
} from "./allowances";
import type { EVMTokenAllowance, AVMAssetOptIn } from "../types/allowances";
import { AllowanceRiskLevel, AllowanceActivityStatus } from "../types/allowances";

describe("allowances utilities", () => {
  describe("isUnlimitedAllowance", () => {
    it("should return true for max uint256", () => {
      const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      expect(isUnlimitedAllowance(maxUint256)).toBe(true);
    });

    it("should return true for values above threshold", () => {
      const largeValue = "200000000000000000000000000000000000000";
      expect(isUnlimitedAllowance(largeValue)).toBe(true);
    });

    it("should return false for normal amounts", () => {
      const normalAmount = "1000000000000000000"; // 1 token with 18 decimals
      expect(isUnlimitedAllowance(normalAmount)).toBe(false);
    });

    it("should return false for zero", () => {
      expect(isUnlimitedAllowance("0")).toBe(false);
    });
  });

  describe("formatAllowanceAmount", () => {
    it("should format unlimited as 'Unlimited'", () => {
      const maxUint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      expect(formatAllowanceAmount(maxUint256, 18, "USDC")).toBe("Unlimited");
    });

    it("should format whole numbers correctly", () => {
      const amount = "1000000000"; // 1000 with 6 decimals
      expect(formatAllowanceAmount(amount, 6, "USDC")).toBe("1000 USDC");
    });

    it("should format decimals correctly", () => {
      const amount = "1500000"; // 1.5 with 6 decimals
      expect(formatAllowanceAmount(amount, 6, "USDC")).toBe("1.5 USDC");
    });

    it("should handle 18 decimals", () => {
      const amount = "1500000000000000000"; // 1.5 with 18 decimals
      expect(formatAllowanceAmount(amount, 18, "ETH")).toBe("1.5 ETH");
    });

    it("should trim trailing zeros", () => {
      const amount = "1500000000000000000"; // 1.5 with 18 decimals
      const result = formatAllowanceAmount(amount, 18, "ETH");
      expect(result).toBe("1.5 ETH");
    });
  });

  describe("calculateEVMRiskLevel", () => {
    it("should return critical for unlimited allowances", () => {
      const allowance: Partial<EVMTokenAllowance> = {
        isUnlimited: true,
      };
      expect(calculateEVMRiskLevel(allowance)).toBe("critical");
    });

    it("should return critical for high USD values", () => {
      const allowance: Partial<EVMTokenAllowance> = {
        isUnlimited: false,
        valueUSD: 15000,
      };
      expect(calculateEVMRiskLevel(allowance)).toBe("critical");
    });

    it("should return high for medium USD values", () => {
      const allowance: Partial<EVMTokenAllowance> = {
        isUnlimited: false,
        valueUSD: 5000,
      };
      expect(calculateEVMRiskLevel(allowance)).toBe("high");
    });

    it("should return medium for moderate USD values", () => {
      const allowance: Partial<EVMTokenAllowance> = {
        isUnlimited: false,
        valueUSD: 500,
      };
      expect(calculateEVMRiskLevel(allowance)).toBe("medium");
    });

    it("should return low for small USD values", () => {
      const allowance: Partial<EVMTokenAllowance> = {
        isUnlimited: false,
        valueUSD: 50,
      };
      expect(calculateEVMRiskLevel(allowance)).toBe("low");
    });

    it("should estimate risk when no USD value is available", () => {
      const allowance: Partial<EVMTokenAllowance> = {
        isUnlimited: false,
        allowanceAmount: "15000000000000000000000", // 15000 tokens with 18 decimals
        tokenDecimals: 18,
      };
      expect(calculateEVMRiskLevel(allowance)).toBe("high");
    });
  });

  describe("calculateAVMRiskLevel", () => {
    it("should return low risk for AVM opt-ins", () => {
      const allowance: Partial<AVMAssetOptIn> = {};
      expect(calculateAVMRiskLevel(allowance)).toBe("low");
    });
  });

  describe("calculateActivityStatus", () => {
    it("should return active for recent interactions", () => {
      const recentDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      expect(calculateActivityStatus(recentDate)).toBe(AllowanceActivityStatus.ACTIVE);
    });

    it("should return inactive for 30-90 day old interactions", () => {
      const inactiveDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
      expect(calculateActivityStatus(inactiveDate)).toBe(AllowanceActivityStatus.INACTIVE);
    });

    it("should return dormant for old interactions", () => {
      const dormantDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000); // 120 days ago
      expect(calculateActivityStatus(dormantDate)).toBe(AllowanceActivityStatus.DORMANT);
    });

    it("should return unknown when no date provided", () => {
      expect(calculateActivityStatus(undefined)).toBe(AllowanceActivityStatus.UNKNOWN);
    });
  });

  describe("generateAllowanceId", () => {
    it("should generate unique lowercase IDs", () => {
      const id = generateAllowanceId(
        "ethereum",
        "0xABCD1234",
        "0xEFGH5678",
        "0xTOKEN9999"
      );
      expect(id).toBe("ethereum-0xabcd1234-0xefgh5678-0xtoken9999");
    });

    it("should generate different IDs for different inputs", () => {
      const id1 = generateAllowanceId("ethereum", "0xA", "0xB", "0xC");
      const id2 = generateAllowanceId("ethereum", "0xA", "0xB", "0xD");
      expect(id1).not.toBe(id2);
    });
  });

  describe("getKnownSpenderName", () => {
    it("should return known spender name for Uniswap V3 on Ethereum", () => {
      const name = getKnownSpenderName(
        "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
        "ethereum"
      );
      expect(name).toBe("Uniswap V3 Router");
    });

    it("should handle uppercase addresses", () => {
      const name = getKnownSpenderName(
        "0x68B3465833FB72A70ECDF485E0E4C7BD8665FC45",
        "ethereum"
      );
      expect(name).toBe("Uniswap V3 Router");
    });

    it("should return undefined for unknown addresses", () => {
      const name = getKnownSpenderName(
        "0x0000000000000000000000000000000000000000",
        "ethereum"
      );
      expect(name).toBeUndefined();
    });
  });

  describe("formatAddress", () => {
    it("should format long addresses correctly", () => {
      const address = "0x1234567890abcdef1234567890abcdef12345678";
      expect(formatAddress(address)).toBe("0x1234...5678");
    });

    it("should not format short addresses", () => {
      const address = "0x12345";
      expect(formatAddress(address)).toBe("0x12345");
    });

    it("should allow custom start and end characters", () => {
      const address = "0x1234567890abcdef1234567890abcdef12345678";
      expect(formatAddress(address, 8, 6)).toBe("0x123456...345678");
    });
  });

  describe("isValidEthereumAddress", () => {
    it("should validate correct Ethereum addresses", () => {
      expect(isValidEthereumAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(true);
      expect(isValidEthereumAddress("0xABCDEF1234567890ABCDEF1234567890ABCDEF12")).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(isValidEthereumAddress("0x123")).toBe(false); // Too short
      expect(isValidEthereumAddress("1234567890abcdef1234567890abcdef12345678")).toBe(false); // No 0x prefix
      expect(isValidEthereumAddress("0xGHIJ567890abcdef1234567890abcdef12345678")).toBe(false); // Invalid hex
    });
  });

  describe("getRiskBadgeVariant", () => {
    it("should return correct variants for risk levels", () => {
      expect(getRiskBadgeVariant(AllowanceRiskLevel.CRITICAL)).toBe("error");
      expect(getRiskBadgeVariant(AllowanceRiskLevel.HIGH)).toBe("warning");
      expect(getRiskBadgeVariant(AllowanceRiskLevel.MEDIUM)).toBe("default");
      expect(getRiskBadgeVariant(AllowanceRiskLevel.LOW)).toBe("success");
    });
  });

  describe("getActivityBadgeVariant", () => {
    it("should return correct variants for activity statuses", () => {
      expect(getActivityBadgeVariant(AllowanceActivityStatus.ACTIVE)).toBe("success");
      expect(getActivityBadgeVariant(AllowanceActivityStatus.INACTIVE)).toBe("warning");
      expect(getActivityBadgeVariant(AllowanceActivityStatus.DORMANT)).toBe("default");
      expect(getActivityBadgeVariant(AllowanceActivityStatus.UNKNOWN)).toBe("default");
    });
  });

  describe("getRiskLevelLabel", () => {
    it("should return correct labels for risk levels", () => {
      expect(getRiskLevelLabel(AllowanceRiskLevel.CRITICAL)).toBe("Critical Risk");
      expect(getRiskLevelLabel(AllowanceRiskLevel.HIGH)).toBe("High Risk");
      expect(getRiskLevelLabel(AllowanceRiskLevel.MEDIUM)).toBe("Medium Risk");
      expect(getRiskLevelLabel(AllowanceRiskLevel.LOW)).toBe("Low Risk");
    });
  });

  describe("getActivityStatusLabel", () => {
    it("should return correct labels for activity statuses", () => {
      expect(getActivityStatusLabel(AllowanceActivityStatus.ACTIVE)).toBe("Recently Used");
      expect(getActivityStatusLabel(AllowanceActivityStatus.INACTIVE)).toBe("Inactive (30-90 days)");
      expect(getActivityStatusLabel(AllowanceActivityStatus.DORMANT)).toBe("Dormant (>90 days)");
      expect(getActivityStatusLabel(AllowanceActivityStatus.UNKNOWN)).toBe("Unknown");
    });
  });
});
