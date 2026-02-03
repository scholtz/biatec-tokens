/**
 * Unified signing types for deterministic wallet signing flows
 * Provides a consistent interface across AVM and EVM chains
 */

/**
 * Signing result status
 */
export enum SigningStatus {
  SUCCESS = "success",
  USER_CANCELLED = "user_cancelled",
  TIMEOUT = "timeout",
  UNSUPPORTED_CHAIN = "unsupported_chain",
  PROVIDER_ERROR = "provider_error",
  NETWORK_MISMATCH = "network_mismatch",
  INSUFFICIENT_FUNDS = "insufficient_funds",
  UNKNOWN_ERROR = "unknown_error",
}

/**
 * Unified signing result
 */
export interface SigningResult<T = any> {
  status: SigningStatus;
  data?: T;
  error?: SigningError;
  timestamp: Date;
  txId?: string;
  network?: string;
}

/**
 * Signing error details
 */
export interface SigningError {
  type: SigningStatus;
  message: string;
  code?: string | number;
  originalError?: Error;
  userMessage?: string; // User-friendly message
  troubleshootingSteps?: string[];
}

/**
 * Transaction to sign (generic)
 */
export interface TransactionToSign {
  type: "avm" | "evm";
  network: string;
  from: string;
  data: any; // Chain-specific transaction data
  metadata?: Record<string, any>;
}

/**
 * AVM-specific transaction
 */
export interface AVMTransaction extends TransactionToSign {
  type: "avm";
  data: {
    txn: any; // algosdk.Transaction
    message?: string;
  };
}

/**
 * EVM-specific transaction
 */
export interface EVMTransaction extends TransactionToSign {
  type: "evm";
  data: {
    to?: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
    nonce?: number;
  };
}

/**
 * Signing options
 */
export interface SigningOptions {
  timeout?: number; // Timeout in milliseconds (default: 60000)
  retryOnError?: boolean; // Allow retry on error (default: false)
  requireConfirmation?: boolean; // Wait for blockchain confirmation (default: false)
  metadata?: Record<string, any>; // Additional metadata for telemetry
}

/**
 * Signer interface
 */
export interface Signer {
  /**
   * Sign a transaction
   */
  sign(transaction: TransactionToSign, options?: SigningOptions): Promise<SigningResult>;

  /**
   * Sign multiple transactions (batch)
   */
  signBatch?(transactions: TransactionToSign[], options?: SigningOptions): Promise<SigningResult[]>;

  /**
   * Check if signer supports a specific network
   */
  supportsNetwork(network: string): boolean;

  /**
   * Get current signer address
   */
  getAddress(): string | null;

  /**
   * Check if signer is ready
   */
  isReady(): boolean;
}
