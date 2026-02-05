/**
 * Utility functions for token allowance management
 */

import type {
  EVMTokenAllowance,
  AVMAssetOptIn,
  AllowanceRiskLevel,
  AllowanceActivityStatus,
} from "../types/allowances";
import type { NetworkId } from "../composables/useWalletManager";

// Maximum safe integer that can be represented in JavaScript
const MAX_UINT256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

// Threshold for considering an allowance "unlimited" (2^256 - 1 or close to it)
const UNLIMITED_THRESHOLD = "100000000000000000000000000000000000000"; // 10^38

/**
 * Determine if an allowance amount is effectively unlimited
 */
export function isUnlimitedAllowance(amount: string): boolean {
  try {
    const amountBigInt = BigInt(amount);
    const thresholdBigInt = BigInt(UNLIMITED_THRESHOLD);
    return amountBigInt >= thresholdBigInt;
  } catch {
    return false;
  }
}

/**
 * Format allowance amount to human-readable string
 */
export function formatAllowanceAmount(
  amount: string,
  decimals: number,
  symbol: string
): string {
  if (isUnlimitedAllowance(amount)) {
    return "Unlimited";
  }

  try {
    const amountBigInt = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholePart = amountBigInt / divisor;
    const fractionalPart = amountBigInt % divisor;

    if (fractionalPart === BigInt(0)) {
      return `${wholePart.toString()} ${symbol}`;
    }

    // Show up to 6 decimal places
    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    const trimmedFractional = fractionalStr.slice(0, 6).replace(/0+$/, "");

    if (trimmedFractional) {
      return `${wholePart}.${trimmedFractional} ${symbol}`;
    }

    return `${wholePart} ${symbol}`;
  } catch (e) {
    console.error("Error formatting allowance amount:", e);
    return `${amount} (raw) ${symbol}`;
  }
}

/**
 * Calculate risk level for EVM token allowance
 */
export function calculateEVMRiskLevel(allowance: Partial<EVMTokenAllowance>): AllowanceRiskLevel {
  // Unlimited allowances are always critical risk
  if (allowance.isUnlimited) {
    return "critical";
  }

  // If we have USD value, use that for risk assessment
  if (allowance.valueUSD !== undefined) {
    if (allowance.valueUSD > 10000) {
      return "critical";
    } else if (allowance.valueUSD > 1000) {
      return "high";
    } else if (allowance.valueUSD > 100) {
      return "medium";
    } else {
      return "low";
    }
  }

  // If no USD value, try to estimate based on amount
  // This is a fallback and won't be very accurate
  if (allowance.allowanceAmount && allowance.tokenDecimals !== undefined) {
    try {
      const amountBigInt = BigInt(allowance.allowanceAmount);
      const divisor = BigInt(10 ** allowance.tokenDecimals);
      const wholePart = Number(amountBigInt / divisor);

      // Rough heuristic: assume stablecoin-like value
      if (wholePart > 10000) {
        return "high";
      } else if (wholePart > 1000) {
        return "medium";
      } else {
        return "low";
      }
    } catch {
      return "medium"; // Default to medium if we can't parse
    }
  }

  return "medium"; // Default
}

/**
 * Calculate risk level for AVM asset opt-in
 */
export function calculateAVMRiskLevel(_allowance: Partial<AVMAssetOptIn>): AllowanceRiskLevel {
  // AVM doesn't have traditional allowances, so risk is generally lower
  // Opt-in itself is not risky, but we can check if the asset is frozen
  // or has other concerning properties

  // For now, return low risk as AVM opt-ins are generally safe
  return "low";
}

/**
 * Determine activity status based on last interaction time
 */
export function calculateActivityStatus(
  lastInteractionTime?: Date
): AllowanceActivityStatus {
  if (!lastInteractionTime) {
    return "unknown";
  }

  const now = new Date();
  const daysSinceLastInteraction = Math.floor(
    (now.getTime() - lastInteractionTime.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastInteraction < 30) {
    return "active";
  } else if (daysSinceLastInteraction < 90) {
    return "inactive";
  } else {
    return "dormant";
  }
}

/**
 * Generate unique ID for an allowance
 */
export function generateAllowanceId(
  networkId: NetworkId,
  ownerAddress: string,
  spenderAddress: string,
  tokenIdentifier: string // Token address for EVM, asset ID for AVM
): string {
  return `${networkId}-${ownerAddress}-${spenderAddress}-${tokenIdentifier}`.toLowerCase();
}

/**
 * Get spender name from known contracts (can be extended with API)
 */
export function getKnownSpenderName(address: string, networkId: NetworkId): string | undefined {
  const knownSpenders: Record<string, Record<string, string>> = {
    ethereum: {
      "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap V3 Router",
      "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "Uniswap V2 Router",
      "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Protocol",
      "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch V5 Router",
    },
    base: {
      "0x2626664c2603336e57b271c5c0b26f421741e481": "Uniswap V3 Router",
    },
    arbitrum: {
      "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap V3 Router",
    },
  };

  const normalizedAddress = address.toLowerCase();
  return knownSpenders[networkId]?.[normalizedAddress];
}

/**
 * Format blockchain address for display
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get risk badge color
 */
export function getRiskBadgeVariant(
  riskLevel: AllowanceRiskLevel
): "danger" | "warning" | "default" | "success" {
  switch (riskLevel) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "default";
    case "low":
      return "success";
  }
}

/**
 * Get activity badge color
 */
export function getActivityBadgeVariant(
  activityStatus: AllowanceActivityStatus
): "success" | "warning" | "default" {
  switch (activityStatus) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "dormant":
      return "default";
    case "unknown":
      return "default";
  }
}

/**
 * Get user-friendly risk level label
 */
export function getRiskLevelLabel(riskLevel: AllowanceRiskLevel): string {
  switch (riskLevel) {
    case "critical":
      return "Critical Risk";
    case "high":
      return "High Risk";
    case "medium":
      return "Medium Risk";
    case "low":
      return "Low Risk";
  }
}

/**
 * Get user-friendly activity status label
 */
export function getActivityStatusLabel(activityStatus: AllowanceActivityStatus): string {
  switch (activityStatus) {
    case "active":
      return "Recently Used";
    case "inactive":
      return "Inactive (30-90 days)";
    case "dormant":
      return "Dormant (>90 days)";
    case "unknown":
      return "Unknown";
  }
}
