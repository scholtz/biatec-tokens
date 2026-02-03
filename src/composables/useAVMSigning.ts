/**
 * AVM Chain Signing Composable
 * Handles deterministic signing for Algorand, VOI, and Aramid networks
 */

import algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet-vue";
import {
  SigningStatus,
  type SigningResult,
  type SigningOptions,
  type Signer,
  type AVMTransaction,
  type TransactionToSign,
} from "../types/signing";
import { parseSigningError, createSuccessResult, createErrorResult, waitForConfirmation } from "../utils/signing";
import { telemetryService } from "../services/TelemetryService";
import { AVM_NETWORKS, type AVMNetworkId } from "./useWalletManager";

/**
 * Composable for AVM chain signing operations
 */
export function useAVMSigning(): Signer {
  let wallet: any = null;
  let walletAvailable = true;

  try {
    wallet = useWallet();
  } catch (error) {
    console.warn("AVM wallet not available:", error);
    walletAvailable = false;
  }

  /**
   * Get current connected address
   */
  const getAddress = (): string | null => {
    if (!walletAvailable || !wallet?.activeAccount?.value) {
      return null;
    }
    return wallet.activeAccount.value.address;
  };

  /**
   * Check if signer is ready
   */
  const isReady = (): boolean => {
    return walletAvailable && !!wallet?.activeAccount?.value;
  };

  /**
   * Check if network is supported
   */
  const supportsNetwork = (network: string): boolean => {
    return Object.keys(AVM_NETWORKS).includes(network);
  };

  /**
   * Sign a single AVM transaction
   */
  const sign = async (transaction: TransactionToSign, options?: SigningOptions): Promise<SigningResult> => {
    const startTime = Date.now();
    const timeout = options?.timeout || 60000;

    // Validate transaction type
    if (transaction.type !== "avm") {
      const error = parseSigningError(new Error("Invalid transaction type for AVM signing"), "AVM Sign");
      telemetryService.track("avm_signing_error", {
        error_type: error.type,
        network: transaction.network,
      });
      return createErrorResult(error);
    }

    const avmTx = transaction as AVMTransaction;

    // Check if wallet is ready
    if (!isReady()) {
      const error = parseSigningError(new Error("AVM wallet not connected"), "AVM Sign");
      telemetryService.track("avm_signing_error", {
        error_type: error.type,
        network: transaction.network,
      });
      return createErrorResult(error);
    }

    // Check if network is supported
    if (!supportsNetwork(transaction.network)) {
      const error = parseSigningError(new Error(`Network ${transaction.network} not supported`), "AVM Sign");
      error.type = SigningStatus.UNSUPPORTED_CHAIN;
      telemetryService.track("avm_signing_error", {
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

      // Sign transaction
      const signPromise = (async () => {
        if (!wallet.activeWallet.value) {
          throw new Error("No active wallet");
        }

        // Get the transaction object
        const txn = avmTx.data.txn;

        // Use the wallet's sign transaction method
        const signedTxns = await wallet.activeWallet.value.signTransactions([
          {
            txn: algosdk.encodeUnsignedTransaction(txn),
          },
        ]);

        if (!signedTxns || signedTxns.length === 0) {
          throw new Error("No signed transactions returned");
        }

        return signedTxns[0];
      })();

      // Race between signing and timeout
      const signedTxn = await Promise.race([signPromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      // Track successful signing
      telemetryService.track("avm_signing_success", {
        network: transaction.network,
        duration_ms: duration,
        from: transaction.from,
      });

      // If confirmation is required, wait for it
      if (options?.requireConfirmation && signedTxn) {
        const network = AVM_NETWORKS[transaction.network as AVMNetworkId];
        const algodClient = new algosdk.Algodv2("", network.algodUrl, "");

        try {
          const txResponse = await algodClient.sendRawTransaction(signedTxn).do();
          const txId = txResponse.txid as string; // Note: algosdk uses lowercase 'txid'

          const confirmed = await waitForConfirmation(async () => {
            try {
              await algosdk.waitForConfirmation(algodClient, txId, 4);
              return true;
            } catch {
              return false;
            }
          }, 30000);

          if (confirmed) {
            telemetryService.track("avm_transaction_confirmed", {
              network: transaction.network,
              tx_id: txId,
            });

            return createSuccessResult(signedTxn, {
              txId,
              network: transaction.network,
            });
          }
        } catch (error) {
          console.warn("Failed to confirm transaction:", error);
          // Still return success since signing succeeded
        }
      }

      return createSuccessResult(signedTxn, {
        network: transaction.network,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const signingError = parseSigningError(error, "AVM Sign");

      // Track signing failure
      telemetryService.track("avm_signing_failure", {
        network: transaction.network,
        error_type: signingError.type,
        error_message: signingError.message,
        duration_ms: duration,
      });

      return createErrorResult(signingError);
    }
  };

  /**
   * Sign multiple AVM transactions (batch)
   */
  const signBatch = async (transactions: TransactionToSign[], options?: SigningOptions): Promise<SigningResult[]> => {
    const startTime = Date.now();
    const timeout = options?.timeout || 60000;

    // Validate all transactions are AVM
    if (transactions.some((tx) => tx.type !== "avm")) {
      const error = parseSigningError(new Error("All transactions must be AVM type for batch signing"), "AVM Batch Sign");
      const errorResult = createErrorResult(error);
      return transactions.map(() => errorResult);
    }

    // Check if wallet is ready
    if (!isReady()) {
      const error = parseSigningError(new Error("AVM wallet not connected"), "AVM Batch Sign");
      const errorResult = createErrorResult(error);
      return transactions.map(() => errorResult);
    }

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Batch signing timeout")), timeout);
      });

      // Sign batch
      const signPromise = (async () => {
        if (!wallet.activeWallet.value) {
          throw new Error("No active wallet");
        }

        const txnsToSign = transactions.map((tx) => {
          const avmTx = tx as AVMTransaction;
          return {
            txn: algosdk.encodeUnsignedTransaction(avmTx.data.txn),
          };
        });

        const signedTxns = await wallet.activeWallet.value.signTransactions(txnsToSign);

        if (!signedTxns || signedTxns.length !== transactions.length) {
          throw new Error("Unexpected number of signed transactions returned");
        }

        return signedTxns;
      })();

      // Race between signing and timeout
      const signedTxns = await Promise.race([signPromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      // Track successful batch signing
      telemetryService.track("avm_batch_signing_success", {
        count: transactions.length,
        duration_ms: duration,
      });

      // Return array of successful results
      return signedTxns.map((signedTxn: Uint8Array, index: number) => {
        return createSuccessResult(signedTxn, {
          network: transactions[index].network,
        });
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const signingError = parseSigningError(error, "AVM Batch Sign");

      // Track batch signing failure
      telemetryService.track("avm_batch_signing_failure", {
        count: transactions.length,
        error_type: signingError.type,
        error_message: signingError.message,
        duration_ms: duration,
      });

      // Return array of error results
      const errorResult = createErrorResult(signingError);
      return transactions.map(() => errorResult);
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
