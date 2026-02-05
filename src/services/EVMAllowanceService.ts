/**
 * Service for discovering and managing EVM token allowances
 * Uses browser's native ethereum provider (window.ethereum) via JSON-RPC
 */

import type {
  EVMTokenAllowance,
  AllowanceDiscoveryResult,
} from "../types/allowances";
import { AllowanceRiskLevel, AllowanceActivityStatus } from "../types/allowances";
import type { EVMNetworkId } from "../composables/useWalletManager";
import {
  isUnlimitedAllowance,
  formatAllowanceAmount,
  calculateEVMRiskLevel,
  generateAllowanceId,
  getKnownSpenderName,
} from "../utils/allowances";

// ERC-20 ABI fragments we need
const ERC20_ALLOWANCE_ABI = "0xdd62ed3e"; // allowance(address,address)
const ERC20_SYMBOL_ABI = "0x95d89b41"; // symbol()
const ERC20_NAME_ABI = "0x06fdde03"; // name()
const ERC20_DECIMALS_ABI = "0x313ce567"; // decimals()

/**
 * Call contract method via JSON-RPC
 */
async function callContract(
  contractAddress: string,
  data: string
): Promise<string> {
  if (!window.ethereum) {
    throw new Error("Ethereum provider not available");
  }

  try {
    const result = await window.ethereum.request({
      method: "eth_call",
      params: [
        {
          to: contractAddress,
          data: data,
        },
        "latest",
      ],
    });

    return result as string;
  } catch (error) {
    console.error(`Failed to call contract ${contractAddress}:`, error);
    throw error;
  }
}

/**
 * Encode address for function parameter
 */
function encodeAddress(address: string): string {
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;
  // Pad to 32 bytes (64 hex chars)
  return cleanAddress.padStart(64, "0");
}

/**
 * Decode uint256 from bytes
 */
function decodeUint256(hex: string): string {
  // Remove 0x prefix
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  // Convert hex to BigInt then to string
  return BigInt("0x" + cleanHex).toString();
}

/**
 * Decode string from bytes
 */
function decodeString(hex: string): string {
  try {
    // Remove 0x prefix
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    
    // Parse ABI encoded string
    // First 32 bytes = offset, next 32 bytes = length, rest = data
    const length = parseInt(cleanHex.slice(64, 128), 16);
    const dataHex = cleanHex.slice(128, 128 + length * 2);
    
    // Convert hex to string
    const bytes = dataHex.match(/.{1,2}/g) || [];
    return bytes
      .map((byte) => String.fromCharCode(parseInt(byte, 16)))
      .join("")
      .replace(/\0/g, ""); // Remove null bytes
  } catch (error) {
    console.error("Failed to decode string:", error);
    return "";
  }
}

/**
 * Get ERC-20 token metadata
 */
async function getTokenMetadata(
  tokenAddress: string
): Promise<{
  symbol: string;
  name: string;
  decimals: number;
}> {
  try {
    // Get symbol
    const symbolData = await callContract(
      tokenAddress,
      ERC20_SYMBOL_ABI
    );
    const symbol = decodeString(symbolData) || "UNKNOWN";

    // Get name
    const nameData = await callContract(tokenAddress, ERC20_NAME_ABI);
    const name = decodeString(nameData) || "Unknown Token";

    // Get decimals
    const decimalsData = await callContract(
      tokenAddress,
      ERC20_DECIMALS_ABI
    );
    const decimals = parseInt(decodeUint256(decimalsData));

    return { symbol, name, decimals };
  } catch (error) {
    console.error(`Failed to get token metadata for ${tokenAddress}:`, error);
    return {
      symbol: "UNKNOWN",
      name: "Unknown Token",
      decimals: 18,
    };
  }
}

/**
 * Get allowance for a specific token and spender
 */
async function getTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<string> {
  const data =
    ERC20_ALLOWANCE_ABI +
    encodeAddress(ownerAddress) +
    encodeAddress(spenderAddress);

  const result = await callContract(tokenAddress, data);
  return decodeUint256(result);
}

/**
 * Discover token allowances for a wallet address
 * Note: This is a simplified version. A full implementation would:
 * 1. Use blockchain indexers (like Etherscan API, The Graph, etc.)
 * 2. Scan past Approval events for the user's address
 * 3. Check each approval's current allowance value
 * 
 * For this implementation, we'll provide a method to check specific
 * token-spender pairs that can be called with known contracts.
 */
export async function discoverEVMAllowances(
  ownerAddress: string,
  networkId: EVMNetworkId,
  _chainId: number,
  knownPairs: Array<{ tokenAddress: string; spenderAddress: string }>
): Promise<AllowanceDiscoveryResult> {
  const discoveredAt = new Date();
  const allowances: EVMTokenAllowance[] = [];
  const errors: string[] = [];

  for (const pair of knownPairs) {
    try {
      // Get token metadata
      const metadata = await getTokenMetadata(pair.tokenAddress);

      // Get allowance
      const allowanceAmount = await getTokenAllowance(
        pair.tokenAddress,
        ownerAddress,
        pair.spenderAddress
      );

      // Skip zero allowances
      if (allowanceAmount === "0") {
        continue;
      }

      const isUnlimited = isUnlimitedAllowance(allowanceAmount);
      const formattedAllowance = formatAllowanceAmount(
        allowanceAmount,
        metadata.decimals,
        metadata.symbol
      );

      const allowance: EVMTokenAllowance = {
        id: generateAllowanceId(
          networkId,
          ownerAddress,
          pair.spenderAddress,
          pair.tokenAddress
        ),
        chainType: "EVM",
        networkId,
        ownerAddress,
        spenderAddress: pair.spenderAddress,
        spenderName: getKnownSpenderName(pair.spenderAddress, networkId),
        tokenAddress: pair.tokenAddress,
        tokenSymbol: metadata.symbol,
        tokenName: metadata.name,
        tokenDecimals: metadata.decimals,
        allowanceAmount,
        formattedAllowance,
        isUnlimited,
        riskLevel: AllowanceRiskLevel.MEDIUM, // Will be calculated properly when USD value is available
        activityStatus: AllowanceActivityStatus.UNKNOWN, // Would need transaction history to determine
        discoveredAt,
      };

      // Calculate risk level
      allowance.riskLevel = calculateEVMRiskLevel(allowance);

      allowances.push(allowance);
    } catch (error) {
      console.error(
        `Failed to check allowance for ${pair.tokenAddress} -> ${pair.spenderAddress}:`,
        error
      );
      errors.push(
        `Failed to check ${pair.tokenAddress} -> ${pair.spenderAddress}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return {
    allowances,
    totalCount: allowances.length,
    discoveredAt,
    networkId,
    ownerAddress,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Revoke token allowance (set to 0)
 */
export async function revokeEVMAllowance(
  tokenAddress: string,
  spenderAddress: string,
  ownerAddress: string
): Promise<{ transactionHash: string }> {
  if (!window.ethereum) {
    throw new Error("Ethereum provider not available");
  }

  // ERC-20 approve function: approve(address,uint256)
  const APPROVE_FUNCTION = "0x095ea7b3";
  const data = APPROVE_FUNCTION + encodeAddress(spenderAddress) + "0".padStart(64, "0");

  try {
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: ownerAddress,
          to: tokenAddress,
          data: data,
        },
      ],
    });

    return { transactionHash: txHash as string };
  } catch (error) {
    console.error("Failed to revoke allowance:", error);
    throw error;
  }
}

/**
 * Reduce token allowance to a specific amount
 */
export async function reduceEVMAllowance(
  tokenAddress: string,
  spenderAddress: string,
  ownerAddress: string,
  newAmount: string // Raw amount as string (to handle BigInt)
): Promise<{ transactionHash: string }> {
  if (!window.ethereum) {
    throw new Error("Ethereum provider not available");
  }

  // ERC-20 approve function: approve(address,uint256)
  const APPROVE_FUNCTION = "0x095ea7b3";
  
  // Convert amount to hex (pad to 32 bytes)
  const amountHex = BigInt(newAmount).toString(16).padStart(64, "0");
  const data = APPROVE_FUNCTION + encodeAddress(spenderAddress) + amountHex;

  try {
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: ownerAddress,
          to: tokenAddress,
          data: data,
        },
      ],
    });

    return { transactionHash: txHash as string };
  } catch (error) {
    console.error("Failed to reduce allowance:", error);
    throw error;
  }
}

/**
 * Get common DeFi contracts for a network (for discovery)
 * This is a starter list - in production, this would come from an API
 */
export function getCommonDeFiContracts(networkId: EVMNetworkId): Array<{
  spenderAddress: string;
  spenderName: string;
  commonTokens: string[];
}> {
  const contracts: Record<string, Array<{
    spenderAddress: string;
    spenderName: string;
    commonTokens: string[];
  }>> = {
    ethereum: [
      {
        spenderAddress: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
        spenderName: "Uniswap V3 Router",
        commonTokens: [
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
          "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
          "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
        ],
      },
      {
        spenderAddress: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
        spenderName: "Uniswap V2 Router",
        commonTokens: [
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
          "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
        ],
      },
    ],
    base: [
      {
        spenderAddress: "0x2626664c2603336e57b271c5c0b26f421741e481",
        spenderName: "Uniswap V3 Router",
        commonTokens: [
          "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
        ],
      },
    ],
    arbitrum: [
      {
        spenderAddress: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
        spenderName: "Uniswap V3 Router",
        commonTokens: [
          "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum
          "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
        ],
      },
    ],
    sepolia: [],
  };

  return contracts[networkId] || [];
}
