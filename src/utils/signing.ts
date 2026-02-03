/**
 * Signing utilities for error handling and result formatting
 */

import {
  SigningStatus,
  type SigningResult,
  type SigningError,
} from "../types/signing";

/**
 * Parse error into SigningError
 */
export function parseSigningError(error: unknown, context?: string): SigningError {
  const originalError = error instanceof Error ? error : new Error(String(error));
  const message = originalError.message.toLowerCase();
  const errorCode = (error as any)?.code;

  // Determine error type based on message content and error codes
  let type = SigningStatus.UNKNOWN_ERROR;
  let userMessage = "An unexpected error occurred while signing the transaction.";
  let troubleshootingSteps: string[] = [];

  // User cancellation (most common)
  if (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("user cancelled") ||
    message.includes("cancelled by user") ||
    message.includes("rejected by user") ||
    errorCode === 4001 || // EIP-1193 user rejection
    errorCode === "ACTION_REJECTED"
  ) {
    type = SigningStatus.USER_CANCELLED;
    userMessage = "Transaction was cancelled by user.";
    troubleshootingSteps = [
      "Approve the transaction in your wallet to proceed",
      "Make sure you're ready to sign before initiating the transaction",
    ];
  }
  // Timeout
  else if (message.includes("timeout") || message.includes("timed out")) {
    type = SigningStatus.TIMEOUT;
    userMessage = "Transaction signing timed out. Please try again.";
    troubleshootingSteps = [
      "Check your internet connection",
      "Ensure your wallet app is responsive",
      "Try again with a longer timeout",
    ];
  }
  // Unsupported chain
  else if (
    message.includes("unsupported chain") ||
    message.includes("chain not supported") ||
    message.includes("wrong network") ||
    errorCode === 4902 // EIP-1193 unrecognized chain
  ) {
    type = SigningStatus.UNSUPPORTED_CHAIN;
    userMessage = "This network is not supported by your wallet.";
    troubleshootingSteps = [
      "Add the network to your wallet",
      "Switch to a supported network",
      "Contact support if you believe this network should be supported",
    ];
  }
  // Network mismatch
  else if (
    message.includes("network mismatch") ||
    message.includes("wrong chain") ||
    message.includes("chain id mismatch")
  ) {
    type = SigningStatus.NETWORK_MISMATCH;
    userMessage = "Your wallet is connected to a different network.";
    troubleshootingSteps = [
      "Switch your wallet to the correct network",
      "Disconnect and reconnect to the correct network",
    ];
  }
  // Insufficient funds
  else if (
    message.includes("insufficient funds") ||
    message.includes("insufficient balance") ||
    message.includes("not enough") ||
    errorCode === "INSUFFICIENT_FUNDS"
  ) {
    type = SigningStatus.INSUFFICIENT_FUNDS;
    userMessage = "Insufficient funds to complete this transaction.";
    troubleshootingSteps = [
      "Add more funds to your wallet",
      "Reduce the transaction amount",
      "Check if you have enough for gas fees",
    ];
  }
  // Provider error
  else if (
    message.includes("provider") ||
    message.includes("rpc") ||
    message.includes("connection failed")
  ) {
    type = SigningStatus.PROVIDER_ERROR;
    userMessage = "Wallet provider encountered an error.";
    troubleshootingSteps = [
      "Check your wallet app is running correctly",
      "Refresh the page and try again",
      "Try switching to a different RPC endpoint",
    ];
  }

  return {
    type,
    message: context ? `${context}: ${originalError.message}` : originalError.message,
    code: errorCode,
    originalError,
    userMessage,
    troubleshootingSteps:
      troubleshootingSteps.length > 0
        ? troubleshootingSteps
        : ["Refresh the page and try again", "Contact support if the issue persists"],
  };
}

/**
 * Create a successful signing result
 */
export function createSuccessResult<T>(data: T, metadata?: { txId?: string; network?: string }): SigningResult<T> {
  return {
    status: SigningStatus.SUCCESS,
    data,
    timestamp: new Date(),
    txId: metadata?.txId,
    network: metadata?.network,
  };
}

/**
 * Create an error signing result
 */
export function createErrorResult(error: SigningError): SigningResult {
  return {
    status: error.type,
    error,
    timestamp: new Date(),
  };
}

/**
 * Format signing result for display
 */
export function formatSigningResult(result: SigningResult): string {
  if (result.status === SigningStatus.SUCCESS) {
    return result.txId ? `Transaction signed successfully. ID: ${result.txId}` : "Transaction signed successfully.";
  }

  if (result.error?.userMessage) {
    return result.error.userMessage;
  }

  return "Failed to sign transaction.";
}

/**
 * Check if a signing result represents a user cancellation
 */
export function isUserCancellation(result: SigningResult): boolean {
  return result.status === SigningStatus.USER_CANCELLED;
}

/**
 * Check if a signing error is retryable
 */
export function isRetryableError(status: SigningStatus): boolean {
  return [SigningStatus.TIMEOUT, SigningStatus.PROVIDER_ERROR, SigningStatus.NETWORK_MISMATCH].includes(status);
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForConfirmation(
  getTxStatus: () => Promise<boolean>,
  timeoutMs: number = 60000,
  pollIntervalMs: number = 2000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const confirmed = await getTxStatus();
      if (confirmed) {
        return true;
      }
    } catch (error) {
      console.warn("Error checking transaction status:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return false;
}
