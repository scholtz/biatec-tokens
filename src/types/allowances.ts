import { ChainType, NetworkId } from "../stores/network";

/**
 * Risk level for allowances
 */
export enum AllowanceRiskLevel {
  CRITICAL = "critical", // Unlimited or very high allowance
  HIGH = "high", // High value at risk
  MEDIUM = "medium", // Moderate risk
  LOW = "low", // Low risk or small amounts
}

/**
 * Activity status for allowances
 */
export enum AllowanceActivityStatus {
  ACTIVE = "active", // Recently used (< 30 days)
  INACTIVE = "inactive", // Not used recently (30-90 days)
  DORMANT = "dormant", // Unused for long time (> 90 days)
  UNKNOWN = "unknown", // No interaction data available
}

/**
 * Base allowance interface
 */
export interface BaseAllowance {
  id: string; // Unique identifier for the allowance
  chainType: ChainType;
  networkId: NetworkId;
  ownerAddress: string; // User's wallet address
  spenderAddress: string; // Contract that has permission
  spenderName?: string; // Friendly name if known (e.g., "Uniswap V3 Router")
  spenderUrl?: string; // Link to dApp or contract info
  lastInteractionTime?: Date; // Last time this approval was used
  discoveredAt: Date; // When this allowance was first discovered
}

/**
 * EVM Token Allowance (ERC-20)
 */
export interface EVMTokenAllowance extends BaseAllowance {
  chainType: "EVM";
  tokenAddress: string; // ERC-20 token contract address
  tokenSymbol: string; // e.g., "USDC"
  tokenName: string; // e.g., "USD Coin"
  tokenDecimals: number;
  allowanceAmount: string; // Raw amount as string (to handle BigInt)
  formattedAllowance: string; // Human-readable amount
  isUnlimited: boolean; // True if allowance is effectively unlimited
  valueUSD?: number; // Estimated value at risk (if available)
  riskLevel: AllowanceRiskLevel;
  activityStatus: AllowanceActivityStatus;
}

/**
 * AVM Asset Opt-In (Algorand Standard Assets)
 * Note: AVM chains don't have traditional "allowances" like EVM
 * Instead, users must opt-in to assets, which is tracked here
 */
export interface AVMAssetOptIn extends BaseAllowance {
  chainType: "AVM";
  assetId: number; // ASA ID
  assetName?: string;
  unitName?: string; // Asset unit name
  decimals: number;
  creatorAddress: string; // Asset creator
  isOptedIn: boolean; // Whether user has opted in
  balance: string; // Current balance
  isFrozen: boolean; // Whether asset is frozen for this account
  riskLevel: AllowanceRiskLevel;
  activityStatus: AllowanceActivityStatus;
}

/**
 * Union type for all allowance types
 */
export type Allowance = EVMTokenAllowance | AVMAssetOptIn;

/**
 * Filter options for allowances
 */
export interface AllowanceFilters {
  riskLevels: AllowanceRiskLevel[];
  activityStatuses: AllowanceActivityStatus[];
  networkIds: NetworkId[];
  showUnlimitedOnly: boolean;
  searchQuery: string;
}

/**
 * Sort options for allowances
 */
export enum AllowanceSortField {
  RISK = "risk",
  VALUE = "value",
  LAST_INTERACTION = "lastInteraction",
  TOKEN_NAME = "tokenName",
  SPENDER_NAME = "spenderName",
}

export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

export interface AllowanceSortOptions {
  field: AllowanceSortField;
  direction: SortDirection;
}

/**
 * Audit trail entry for allowance changes
 */
export enum AllowanceActionType {
  REVOKE = "revoke",
  REDUCE = "reduce",
  APPROVE = "approve",
  DISCOVERED = "discovered",
}

export interface AllowanceAuditEntry {
  id: string; // Unique ID for the audit entry
  timestamp: Date;
  actionType: AllowanceActionType;
  allowanceId: string; // Reference to the allowance
  chainType: ChainType;
  networkId: NetworkId;
  tokenAddress?: string; // For EVM
  assetId?: number; // For AVM
  tokenSymbol?: string;
  spenderAddress: string;
  spenderName?: string;
  previousAllowance?: string; // Previous amount (if applicable)
  newAllowance?: string; // New amount (if applicable)
  transactionHash?: string; // Blockchain transaction hash
  gasUsed?: string; // Gas used for the transaction
  status: "pending" | "success" | "failed";
  errorMessage?: string;
}

/**
 * Allowance discovery result
 */
export interface AllowanceDiscoveryResult {
  allowances: Allowance[];
  totalCount: number;
  discoveredAt: Date;
  networkId: NetworkId;
  ownerAddress: string;
  errors?: string[];
}

/**
 * Statistics for allowance summary
 */
export interface AllowanceStatistics {
  totalAllowances: number;
  unlimitedAllowances: number;
  highRiskAllowances: number;
  dormantAllowances: number;
  totalValueAtRisk?: number; // USD value if available
}
