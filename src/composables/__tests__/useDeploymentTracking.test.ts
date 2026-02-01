import { describe, it, expect, beforeEach } from "vitest";
import { useDeploymentTracking } from "../useDeploymentTracking";

describe("useDeploymentTracking", () => {
  let tracker: ReturnType<typeof useDeploymentTracking>;

  beforeEach(() => {
    tracker = useDeploymentTracking();
  });

  describe("Initial State", () => {
    it("should start in idle state", () => {
      expect(tracker.deploymentState.value.status).toBe("idle");
      expect(tracker.isDeploying.value).toBe(false);
      expect(tracker.isComplete.value).toBe(false);
      expect(tracker.hasError.value).toBe(false);
    });

    it("should have no network or transaction info initially", () => {
      expect(tracker.deploymentState.value.networkId).toBeNull();
      expect(tracker.deploymentState.value.transactionId).toBeNull();
      expect(tracker.deploymentState.value.tokenId).toBeNull();
    });
  });

  describe("Starting Deployment", () => {
    it("should initialize deployment for AVM network", () => {
      tracker.startDeployment("voi-mainnet");

      expect(tracker.deploymentState.value.status).toBe("preparing");
      expect(tracker.deploymentState.value.networkId).toBe("voi-mainnet");
      expect(tracker.deploymentState.value.steps.length).toBe(4);
      expect(tracker.isDeploying.value).toBe(true);
    });

    it("should initialize deployment for EVM network", () => {
      tracker.startDeployment("ethereum");

      expect(tracker.deploymentState.value.status).toBe("preparing");
      expect(tracker.deploymentState.value.networkId).toBe("ethereum");
      expect(tracker.deploymentState.value.steps.length).toBe(4);
      expect(tracker.isDeploying.value).toBe(true);
    });

    it("should set start time", () => {
      const before = Date.now();
      tracker.startDeployment("voi-mainnet");
      const after = Date.now();

      expect(tracker.deploymentState.value.startTime).toBeGreaterThanOrEqual(before);
      expect(tracker.deploymentState.value.startTime).toBeLessThanOrEqual(after);
    });

    it("should mark first step as active", () => {
      tracker.startDeployment("voi-mainnet");

      const firstStep = tracker.deploymentState.value.steps[0];
      expect(firstStep.status).toBe("active");
    });
  });

  describe("Step Progression", () => {
    beforeEach(() => {
      tracker.startDeployment("voi-mainnet");
    });

    it("should progress through steps correctly", () => {
      // Initial: prepare step is active
      expect(tracker.currentStep.value?.id).toBe("prepare");
      expect(tracker.deploymentState.value.progress).toBe(0);

      // Move to sign step
      tracker.nextStep();
      expect(tracker.currentStep.value?.id).toBe("sign");
      expect(tracker.deploymentState.value.status).toBe("signing");
      expect(tracker.deploymentState.value.progress).toBe(25);

      // Move to submit step
      tracker.nextStep();
      expect(tracker.currentStep.value?.id).toBe("submit");
      expect(tracker.deploymentState.value.status).toBe("submitting");
      expect(tracker.deploymentState.value.progress).toBe(50);

      // Move to confirm step
      tracker.nextStep();
      expect(tracker.currentStep.value?.id).toBe("confirm");
      expect(tracker.deploymentState.value.status).toBe("confirming");
      expect(tracker.deploymentState.value.progress).toBe(75);

      // Complete
      tracker.nextStep();
      expect(tracker.isComplete.value).toBe(true);
      expect(tracker.deploymentState.value.progress).toBe(100);
    });

    it("should mark completed steps correctly", () => {
      tracker.nextStep();
      tracker.nextStep();

      const steps = tracker.deploymentState.value.steps;
      expect(steps[0].status).toBe("completed");
      expect(steps[1].status).toBe("completed");
      expect(steps[2].status).toBe("active");
      expect(steps[3].status).toBe("pending");
    });

    it("should set completion time when finished", () => {
      tracker.nextStep();
      tracker.nextStep();
      tracker.nextStep();

      expect(tracker.deploymentState.value.completionTime).toBeNull();

      tracker.nextStep();

      expect(tracker.deploymentState.value.completionTime).toBeGreaterThan(0);
    });
  });

  describe("Transaction and Token IDs", () => {
    beforeEach(() => {
      tracker.startDeployment("voi-mainnet");
    });

    it("should set transaction ID", () => {
      const txId = "ABC123XYZ";
      tracker.setTransactionId(txId);

      expect(tracker.deploymentState.value.transactionId).toBe(txId);
    });

    it("should set token ID", () => {
      const tokenId = "12345";
      tracker.setTokenId(tokenId);

      expect(tracker.deploymentState.value.tokenId).toBe(tokenId);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      tracker.startDeployment("voi-mainnet");
      tracker.nextStep(); // Move to sign step
    });

    it("should set error state", () => {
      const errorMessage = "User rejected transaction";
      tracker.setError(errorMessage);

      expect(tracker.deploymentState.value.status).toBe("error");
      expect(tracker.deploymentState.value.error).toBe(errorMessage);
      expect(tracker.hasError.value).toBe(true);
      expect(tracker.canRetry.value).toBe(true);
    });

    it("should mark current step as error", () => {
      tracker.setError("Test error");

      const steps = tracker.deploymentState.value.steps;
      expect(steps[0].status).toBe("completed");
      expect(steps[1].status).toBe("error");
      expect(steps[2].status).toBe("pending");
    });

    it("should set completion time on error", () => {
      tracker.setError("Test error");

      expect(tracker.deploymentState.value.completionTime).toBeGreaterThan(0);
    });
  });

  describe("Fee Estimates", () => {
    it("should provide fee estimate for Algorand Mainnet", () => {
      const fee = tracker.getFeeEstimate("algorand-mainnet");

      expect(fee.currency).toBe("ALGO");
      expect(parseFloat(fee.total)).toBeGreaterThan(0);
    });

    it("should provide fee estimate for VOI Mainnet", () => {
      const fee = tracker.getFeeEstimate("voi-mainnet");

      expect(fee.currency).toBe("VOI");
      expect(parseFloat(fee.total)).toBeGreaterThan(0);
    });

    it("should provide fee estimate for Ethereum", () => {
      const fee = tracker.getFeeEstimate("ethereum");

      expect(fee.currency).toBe("ETH");
      expect(parseFloat(fee.total)).toBeGreaterThan(0);
    });

    it("should provide fee estimate for Arbitrum", () => {
      const fee = tracker.getFeeEstimate("arbitrum");

      expect(fee.currency).toBe("ETH");
      expect(parseFloat(fee.networkFee)).toBeLessThan(parseFloat(tracker.getFeeEstimate("ethereum").networkFee));
    });

    it("should provide fee estimate for Base", () => {
      const fee = tracker.getFeeEstimate("base");

      expect(fee.currency).toBe("ETH");
      expect(parseFloat(fee.networkFee)).toBeLessThan(parseFloat(tracker.getFeeEstimate("ethereum").networkFee));
    });

    it("should have lower fees for L2 networks", () => {
      const ethFee = parseFloat(tracker.getFeeEstimate("ethereum").networkFee);
      const arbFee = parseFloat(tracker.getFeeEstimate("arbitrum").networkFee);
      const baseFee = parseFloat(tracker.getFeeEstimate("base").networkFee);

      expect(arbFee).toBeLessThan(ethFee);
      expect(baseFee).toBeLessThan(ethFee);
    });
  });

  describe("Explorer URLs", () => {
    it("should return null when no transaction ID", () => {
      tracker.startDeployment("voi-mainnet");

      expect(tracker.getExplorerUrl()).toBeNull();
    });

    it("should generate explorer URL for Algorand Mainnet", () => {
      tracker.startDeployment("algorand-mainnet");
      tracker.setTransactionId("ABC123");

      const url = tracker.getExplorerUrl();
      expect(url).toContain("algoexplorer.io");
      expect(url).toContain("ABC123");
    });

    it("should generate explorer URL for VOI Mainnet", () => {
      tracker.startDeployment("voi-mainnet");
      tracker.setTransactionId("XYZ789");

      const url = tracker.getExplorerUrl();
      expect(url).toContain("voi.observer");
      expect(url).toContain("XYZ789");
    });

    it("should generate explorer URL for Ethereum", () => {
      tracker.startDeployment("ethereum");
      tracker.setTransactionId("0x123abc");

      const url = tracker.getExplorerUrl();
      expect(url).toContain("etherscan.io");
      expect(url).toContain("0x123abc");
    });

    it("should generate explorer URL for Arbitrum", () => {
      tracker.startDeployment("arbitrum");
      tracker.setTransactionId("0xdef456");

      const url = tracker.getExplorerUrl();
      expect(url).toContain("arbiscan.io");
      expect(url).toContain("0xdef456");
    });

    it("should generate explorer URL for Base", () => {
      tracker.startDeployment("base");
      tracker.setTransactionId("0x789ghi");

      const url = tracker.getExplorerUrl();
      expect(url).toContain("basescan.org");
      expect(url).toContain("0x789ghi");
    });
  });

  describe("Reset", () => {
    it("should reset to initial state", () => {
      tracker.startDeployment("voi-mainnet");
      tracker.nextStep();
      tracker.setTransactionId("ABC123");
      tracker.setTokenId("12345");

      tracker.reset();

      expect(tracker.deploymentState.value.status).toBe("idle");
      expect(tracker.deploymentState.value.networkId).toBeNull();
      expect(tracker.deploymentState.value.transactionId).toBeNull();
      expect(tracker.deploymentState.value.tokenId).toBeNull();
      expect(tracker.deploymentState.value.steps).toEqual([]);
      expect(tracker.deploymentState.value.progress).toBe(0);
      expect(tracker.isDeploying.value).toBe(false);
    });
  });

  describe("Network Info", () => {
    it("should return null when no network selected", () => {
      expect(tracker.networkInfo.value).toBeNull();
    });

    it("should return network info when deployment started", () => {
      tracker.startDeployment("ethereum");

      expect(tracker.networkInfo.value).not.toBeNull();
      expect(tracker.networkInfo.value?.id).toBe("ethereum");
      expect(tracker.networkInfo.value?.displayName).toBe("Ethereum Mainnet");
    });
  });

  describe("Deployment Steps - AVM vs EVM", () => {
    it("should have different step descriptions for AVM networks", () => {
      tracker.startDeployment("voi-mainnet");

      const steps = tracker.deploymentState.value.steps;
      expect(steps[0].description).toContain("Algorand");
      expect(steps[2].description).toContain("Algorand");
    });

    it("should have different step descriptions for EVM networks", () => {
      tracker.startDeployment("ethereum");

      const steps = tracker.deploymentState.value.steps;
      expect(steps[0].description).toContain("contract");
      expect(steps[2].description).toContain("contract");
    });
  });
});
