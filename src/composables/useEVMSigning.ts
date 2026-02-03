/**
 * EVM Chain Signing Composable
 * Handles deterministic signing for Ethereum, Arbitrum, Base, and other EVM networks
 */
import {
  SigningStatus,
  type SigningResult,
  type SigningOptions,
  type Signer,
  type EVMTransaction,
  type TransactionToSign,
} from "../types/signing";
import { parseSigningError, createSuccessResult, createErrorResult, waitForConfirmation } from "../utils/signing";
import { telemetryService } from "../services/TelemetryService";
import { EVM_NETWORKS, type EVMNetworkId } from "./useWalletManager";

/**
 * Composable for EVM chain signing operations
 */
export function useEVMSigning(): Signer {
  const isEthereumAvailable = typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  /**
   * Get current connected address
   */
  const getAddress = (): string | null => {
    if (!isEthereumAvailable) {
      return null;
    }

    // Check if we have cached accounts
    try {
      // This is synchronous access to the current account
      // Most wallets update window.ethereum.selectedAddress
      return (window.ethereum as any).selectedAddress || null;
    } catch {
      return null;
    }
  };

  /**
   * Check if signer is ready
   */
  const isReady = (): boolean => {
    return isEthereumAvailable && !!getAddress();
  };

  /**
   * Check if network is supported
   */
  const supportsNetwork = (network: string): boolean => {
    return Object.keys(EVM_NETWORKS).includes(network);
  };

  /**
   * Get current chain ID
   */
  const getCurrentChainId = async (): Promise<number | null> => {
    if (!isEthereumAvailable) {
      return null;
    }

    try {
      const chainIdHex = await window.ethereum!.request({
        method: "eth_chainId",
      });
      return parseInt(chainIdHex, 16);
    } catch {
      return null;
    }
  };

  /**
   * Verify network matches expected
   */
  const verifyNetwork = async (expectedNetwork: string): Promise<boolean> => {
    const network = EVM_NETWORKS[expectedNetwork as EVMNetworkId];
    if (!network) {
      return false;
    }

    const currentChainId = await getCurrentChainId();
    return currentChainId === network.chainId;
  };

  /**
   * Sign a single EVM transaction
   */
  const sign = async (transaction: TransactionToSign, options?: SigningOptions): Promise<SigningResult> => {
    const startTime = Date.now();
    const timeout = options?.timeout || 60000;

    // Validate transaction type
    if (transaction.type !== "evm") {
      const error = parseSigningError(new Error("Invalid transaction type for EVM signing"), "EVM Sign");
      telemetryService.track("evm_signing_error", {
        error_type: error.type,
        network: transaction.network,
      });
      return createErrorResult(error);
    }

    const evmTx = transaction as EVMTransaction;

    // Check if wallet is ready
    if (!isReady()) {
      const error = parseSigningError(new Error("EVM wallet not connected"), "EVM Sign");
      telemetryService.track("evm_signing_error", {
        error_type: error.type,
        network: transaction.network,
      });
      return createErrorResult(error);
    }

    // Check if network is supported
    if (!supportsNetwork(transaction.network)) {
      const error = parseSigningError(new Error(`Network ${transaction.network} not supported`), "EVM Sign");
      error.type = SigningStatus.UNSUPPORTED_CHAIN;
      telemetryService.track("evm_signing_error", {
        error_type: error.type,
        network: transaction.network,
      });
      return createErrorResult(error);
    }

    // Verify we're on the correct network
    const isCorrectNetwork = await verifyNetwork(transaction.network);
    if (!isCorrectNetwork) {
      const error = parseSigningError(new Error("Network mismatch. Please switch to the correct network in your wallet."), "EVM Sign");
      error.type = SigningStatus.NETWORK_MISMATCH;
      telemetryService.track("evm_signing_error", {
        error_type: error.type,
        network: transaction.network,
      });
      return createErrorResult(error);
    }

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Signing timeout")), timeout);
      });

      // Prepare transaction parameters
      const txParams: any = {
        from: transaction.from,
        to: evmTx.data.to,
        value: evmTx.data.value,
        data: evmTx.data.data,
      };

      // Add optional parameters
      if (evmTx.data.gasLimit) {
        txParams.gas = evmTx.data.gasLimit;
      }
      if (evmTx.data.gasPrice) {
        txParams.gasPrice = evmTx.data.gasPrice;
      }
      if (evmTx.data.nonce !== undefined) {
        txParams.nonce = `0x${evmTx.data.nonce.toString(16)}`;
      }

      // Sign transaction
      const signPromise = window.ethereum!.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      // Race between signing and timeout
      const txHash = await Promise.race([signPromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      // Track successful signing
      telemetryService.track("evm_signing_success", {
        network: transaction.network,
        duration_ms: duration,
        from: transaction.from,
        tx_hash: txHash,
      });

      // If confirmation is required, wait for it
      if (options?.requireConfirmation && txHash) {
        try {
          const confirmed = await waitForConfirmation(async () => {
            try {
              const receipt = await window.ethereum!.request({
                method: "eth_getTransactionReceipt",
                params: [txHash],
              });
              return !!receipt && receipt.blockNumber;
            } catch {
              return false;
            }
          }, 30000);

          if (confirmed) {
            telemetryService.track("evm_transaction_confirmed", {
              network: transaction.network,
              tx_hash: txHash,
            });
          }
        } catch (error) {
          console.warn("Failed to confirm transaction:", error);
          // Still return success since signing succeeded
        }
      }

      return createSuccessResult(txHash, {
        txId: txHash,
        network: transaction.network,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const signingError = parseSigningError(error, "EVM Sign");

      // Track signing failure
      telemetryService.track("evm_signing_failure", {
        network: transaction.network,
        error_type: signingError.type,
        error_message: signingError.message,
        duration_ms: duration,
      });

      return createErrorResult(signingError);
    }
  };

  /**
   * Sign multiple EVM transactions (sequential, as EVM doesn't support atomic batches natively)
   */
  const signBatch = async (transactions: TransactionToSign[], options?: SigningOptions): Promise<SigningResult[]> => {
    const results: SigningResult[] = [];

    // Validate all transactions are EVM
    if (transactions.some((tx) => tx.type !== "evm")) {
      const error = parseSigningError(new Error("All transactions must be EVM type for batch signing"), "EVM Batch Sign");
      const errorResult = createErrorResult(error);
      return transactions.map(() => errorResult);
    }

    // Check if wallet is ready
    if (!isReady()) {
      const error = parseSigningError(new Error("EVM wallet not connected"), "EVM Batch Sign");
      const errorResult = createErrorResult(error);
      return transactions.map(() => errorResult);
    }

    const startTime = Date.now();

    try {
      // Sign transactions sequentially
      for (const tx of transactions) {
        const result = await sign(tx, {
          ...options,
          requireConfirmation: false, // Don't wait for confirmation in batch
        });

        results.push(result);

        // If any transaction fails, stop the batch
        if (result.status !== SigningStatus.SUCCESS) {
          break;
        }
      }

      const duration = Date.now() - startTime;

      // If we signed all transactions successfully
      if (results.length === transactions.length && results.every((r) => r.status === SigningStatus.SUCCESS)) {
        telemetryService.track("evm_batch_signing_success", {
          count: transactions.length,
          duration_ms: duration,
        });
      } else {
        telemetryService.track("evm_batch_signing_partial", {
          count: transactions.length,
          successful: results.filter((r) => r.status === SigningStatus.SUCCESS).length,
          duration_ms: duration,
        });
      }

      // Fill remaining with error if we stopped early
      while (results.length < transactions.length) {
        const error = parseSigningError(new Error("Batch signing stopped due to previous failure"), "EVM Batch Sign");
        results.push(createErrorResult(error));
      }

      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      const signingError = parseSigningError(error, "EVM Batch Sign");

      // Track batch signing failure
      telemetryService.track("evm_batch_signing_failure", {
        count: transactions.length,
        successful: results.filter((r) => r.status === SigningStatus.SUCCESS).length,
        error_type: signingError.type,
        error_message: signingError.message,
        duration_ms: duration,
      });

      // Fill remaining with error
      const errorResult = createErrorResult(signingError);
      while (results.length < transactions.length) {
        results.push(errorResult);
      }

      return results;
    }
  };

  return {
    sign,
    signBatch,
    supportsNetwork,
    getAddress,
    isReady,
  };
}
