/**
 * Unit tests for signing utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseSigningError,
  createSuccessResult,
  createErrorResult,
  formatSigningResult,
  isUserCancellation,
  isRetryableError,
  waitForConfirmation,
} from "../signing";
import { SigningStatus } from "../../types/signing";

describe("Signing Utilities", () => {
  describe("parseSigningError", () => {
    it("should identify user cancellation from message", () => {
      const error = new Error("User rejected transaction");
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.USER_CANCELLED);
      expect(result.userMessage).toContain("cancelled");
    });

    it("should identify user cancellation from error code 4001", () => {
      const error = { code: 4001, message: "Transaction rejected" };
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.USER_CANCELLED);
    });

    it("should identify timeout errors", () => {
      const error = new Error("Request timed out");
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.TIMEOUT);
      expect(result.troubleshootingSteps).toContain("Check your internet connection");
    });

    it("should identify unsupported chain errors", () => {
      const error = new Error("Unsupported chain ID");
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.UNSUPPORTED_CHAIN);
      expect(result.userMessage).toContain("not supported");
    });

    it("should identify unsupported chain from error code 4902", () => {
      const error = { code: 4902, message: "Chain not added" };
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.UNSUPPORTED_CHAIN);
    });

    it("should identify network mismatch errors", () => {
      const error = new Error("Network mismatch detected");
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.NETWORK_MISMATCH);
      expect(result.troubleshootingSteps).toBeDefined();
    });

    it("should identify insufficient funds errors", () => {
      const error = new Error("Insufficient funds for transaction");
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.INSUFFICIENT_FUNDS);
      expect(result.userMessage).toContain("Insufficient funds");
    });

    it("should identify provider errors", () => {
      const error = new Error("RPC connection failed");
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.PROVIDER_ERROR);
      expect(result.troubleshootingSteps).toContain("Check your wallet app is running correctly");
    });

    it("should handle unknown errors", () => {
      const error = new Error("Something went wrong");
      const result = parseSigningError(error);

      expect(result.type).toBe(SigningStatus.UNKNOWN_ERROR);
      expect(result.troubleshootingSteps).toContain("Refresh the page and try again");
    });

    it("should include context in error message", () => {
      const error = new Error("Test error");
      const result = parseSigningError(error, "Custom Context");

      expect(result.message).toContain("Custom Context");
      expect(result.message).toContain("Test error");
    });

    it("should handle non-Error objects", () => {
      const error = "String error message";
      const result = parseSigningError(error);

      expect(result.originalError).toBeInstanceOf(Error);
      expect(result.message).toContain("String error message");
    });

    it("should preserve error codes", () => {
      const error = { code: "CUSTOM_ERROR", message: "Custom error" };
      const result = parseSigningError(error);

      expect(result.code).toBe("CUSTOM_ERROR");
    });
  });

  describe("createSuccessResult", () => {
    it("should create success result with data", () => {
      const data = { txHash: "0x123" };
      const result = createSuccessResult(data);

      expect(result.status).toBe(SigningStatus.SUCCESS);
      expect(result.data).toEqual(data);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.error).toBeUndefined();
    });

    it("should include optional metadata", () => {
      const data = { txHash: "0x123" };
      const metadata = { txId: "0xabc", network: "ethereum" };
      const result = createSuccessResult(data, metadata);

      expect(result.txId).toBe("0xabc");
      expect(result.network).toBe("ethereum");
    });
  });

  describe("createErrorResult", () => {
    it("should create error result", () => {
      const error = parseSigningError(new Error("Test error"));
      const result = createErrorResult(error);

      expect(result.status).toBe(error.type);
      expect(result.error).toEqual(error);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.data).toBeUndefined();
    });
  });

  describe("formatSigningResult", () => {
    it("should format success result with transaction ID", () => {
      const result = createSuccessResult({ txHash: "0x123" }, { txId: "0x123" });
      const formatted = formatSigningResult(result);

      expect(formatted).toContain("successfully");
      expect(formatted).toContain("0x123");
    });

    it("should format success result without transaction ID", () => {
      const result = createSuccessResult({ txHash: "0x123" });
      const formatted = formatSigningResult(result);

      expect(formatted).toContain("successfully");
    });

    it("should format error result with user message", () => {
      const error = parseSigningError(new Error("User rejected"));
      const result = createErrorResult(error);
      const formatted = formatSigningResult(result);

      expect(formatted).toBe(error.userMessage);
    });

    it("should format error result without user message", () => {
      const result = {
        status: SigningStatus.UNKNOWN_ERROR,
        timestamp: new Date(),
      };
      const formatted = formatSigningResult(result);

      expect(formatted).toContain("Failed");
    });
  });

  describe("isUserCancellation", () => {
    it("should return true for user cancellation", () => {
      const result = {
        status: SigningStatus.USER_CANCELLED,
        timestamp: new Date(),
      };

      expect(isUserCancellation(result)).toBe(true);
    });

    it("should return false for other statuses", () => {
      const result = {
        status: SigningStatus.SUCCESS,
        timestamp: new Date(),
      };

      expect(isUserCancellation(result)).toBe(false);
    });
  });

  describe("isRetryableError", () => {
    it("should return true for timeout errors", () => {
      expect(isRetryableError(SigningStatus.TIMEOUT)).toBe(true);
    });

    it("should return true for provider errors", () => {
      expect(isRetryableError(SigningStatus.PROVIDER_ERROR)).toBe(true);
    });

    it("should return true for network mismatch", () => {
      expect(isRetryableError(SigningStatus.NETWORK_MISMATCH)).toBe(true);
    });

    it("should return false for user cancellation", () => {
      expect(isRetryableError(SigningStatus.USER_CANCELLED)).toBe(false);
    });

    it("should return false for unsupported chain", () => {
      expect(isRetryableError(SigningStatus.UNSUPPORTED_CHAIN)).toBe(false);
    });

    it("should return false for success", () => {
      expect(isRetryableError(SigningStatus.SUCCESS)).toBe(false);
    });
  });

  describe("waitForConfirmation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should return true when confirmation succeeds", async () => {
      let callCount = 0;
      const getTxStatus = vi.fn(async () => {
        callCount++;
        return callCount >= 2; // Succeed on second call
      });

      const confirmPromise = waitForConfirmation(getTxStatus, 10000, 1000);

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await confirmPromise;

      expect(result).toBe(true);
      expect(getTxStatus).toHaveBeenCalledTimes(2);
    });

    it("should return false when timeout is reached", async () => {
      const getTxStatus = vi.fn(async () => false);

      const confirmPromise = waitForConfirmation(getTxStatus, 5000, 1000);

      // Fast-forward past timeout
      await vi.advanceTimersByTimeAsync(6000);

      const result = await confirmPromise;

      expect(result).toBe(false);
    });

    it("should handle errors in getTxStatus", async () => {
      const getTxStatus = vi.fn(async () => {
        throw new Error("Status check failed");
      });

      const confirmPromise = waitForConfirmation(getTxStatus, 5000, 1000);

      // Fast-forward past timeout
      await vi.advanceTimersByTimeAsync(6000);

      const result = await confirmPromise;

      expect(result).toBe(false);
    });

    it("should use custom poll interval", async () => {
      let callCount = 0;
      const getTxStatus = vi.fn(async () => {
        callCount++;
        return callCount >= 3;
      });

      const confirmPromise = waitForConfirmation(getTxStatus, 10000, 500);

      // Fast-forward with custom interval
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(500);

      const result = await confirmPromise;

      expect(result).toBe(true);
      expect(getTxStatus).toHaveBeenCalledTimes(3);
    });
  });
});
