import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import DeploymentStatusStep from "../DeploymentStatusStep.vue";
import { useTokenDraftStore } from "../../../../stores/tokenDraft";

// Mock the service
const mockStartDeployment = vi.fn();
const mockStopPolling = vi.fn();
const mockReset = vi.fn();

vi.mock("../../../../services/DeploymentStatusService", () => {
  return {
    DeploymentStatusService: class {
      startDeployment = mockStartDeployment;
      stopPolling = mockStopPolling;
      reset = mockReset;
    },
  };
});

vi.mock("../../../../services/analytics", () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  },
}));

vi.mock("../../../../services/AuditTrailService", () => ({
  auditTrailService: {
    getDeploymentAuditTrail: vi.fn(),
    downloadAuditReport: vi.fn(),
  },
}));

// Stub the WizardStep component
const stubs = {
  WizardStep: {
    template: '<div><slot name="header"></slot><slot></slot></div>',
    props: ["title", "description", "helpText", "showErrors", "validationErrors"],
  },
};

describe("DeploymentStatusStep", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  describe("Timeline Rendering", () => {
    it("should render deployment timeline", () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      expect(wrapper.text()).toContain("Deployment Progress");
    });

    it("should display all deployment stages", () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      expect(wrapper.text()).toContain("Preparing Token");
      expect(wrapper.text()).toContain("Uploading Metadata");
      expect(wrapper.text()).toContain("Deploying to Blockchain");
      expect(wrapper.text()).toContain("Confirming Transaction");
      expect(wrapper.text()).toContain("Indexing Token");
    });

    it("should show stage descriptions", () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      expect(wrapper.text()).toContain("Validating token parameters");
      expect(wrapper.text()).toContain("Storing token metadata");
      expect(wrapper.text()).toContain("Submitting transaction");
    });
  });

  describe("Status Progression", () => {
    it("should start with pending status", () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      expect(vm.deploymentStatus).toBe("pending");
    });

    it("should show in-progress status during deployment", async () => {
      // Set up token draft
      const tokenDraftStore = useTokenDraftStore();
      tokenDraftStore.initializeDraft();
      tokenDraftStore.updateDraft({ name: "Test Token", symbol: "TST" });

      // Mock the startDeployment to call the callback with in-progress status
      mockStartDeployment.mockImplementation((request: any, callback: any) => {
        callback({
          status: "in-progress",
          stages: [
            { id: "preparing", title: "Preparing Token", status: "in-progress", progress: 50 },
            { id: "uploading", title: "Uploading Metadata", status: "pending" },
            { id: "deploying", title: "Deploying to Blockchain", status: "pending" },
            { id: "confirming", title: "Confirming Transaction", status: "pending" },
            { id: "indexing", title: "Indexing Token", status: "pending" },
          ],
        });
      });

      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      await vm.startDeployment();
      await wrapper.vm.$nextTick();

      expect(vm.deploymentStatus).toBe("in-progress");
      expect(vm.deploymentStages[0].status).toBe("in-progress");
      expect(vm.deploymentStages[0].progress).toBe(50);
    });

    it("should display progress bar for in-progress stage", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStages[0].status = "in-progress";
      vm.deploymentStages[0].progress = 50;
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("50%");
    });

    it("should show check icon for completed stages", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStages[0].status = "completed";
      await wrapper.vm.$nextTick();

      const checkIcon = wrapper.find(".pi-check");
      expect(checkIcon.exists()).toBe(true);
    });

    it("should show spinner for in-progress stages", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStages[0].status = "in-progress";
      await wrapper.vm.$nextTick();

      const spinner = wrapper.find(".pi-spinner");
      expect(spinner.exists()).toBe(true);
    });
  });

  describe("Success State", () => {
    it("should display success message when completed", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "completed";
      vm.deploymentResult = {
        tokenName: "Test Token",
        tokenSymbol: "TEST",
        network: "VOI",
        standard: "ASA",
        assetId: "123456",
        txId: "ABC123XYZ",
      };
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Token Deployed Successfully!");
    });

    it("should display deployment result details", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "completed";
      vm.deploymentResult = {
        tokenName: "Test Token",
        tokenSymbol: "TEST",
        network: "VOI",
        standard: "ASA",
        assetId: "123456",
        txId: "ABC123",
      };
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Test Token");
      expect(wrapper.text()).toContain("TEST");
      expect(wrapper.text()).toContain("VOI");
      expect(wrapper.text()).toContain("123456");
    });

    it("should show Download Summary button", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "completed";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Download Summary");
    });

    it("should show View on Explorer button", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "completed";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("View on Explorer");
    });
  });

  describe("Error State and Recovery", () => {
    it("should display error message when deployment fails", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "failed";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Deployment Failed");
    });

    it("should show retry button on failure", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "failed";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Retry Deployment");
    });

    it("should show save draft button on failure", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "failed";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Save Draft and Exit");
    });

    it("should show contact support button on failure", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "failed";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Contact Support");
    });

    it("should display error details for failed stage", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStages[0].status = "failed";
      vm.deploymentStages[0].error = "Connection timeout";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Connection timeout");
    });

    it("should show X icon for failed stages", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStages[0].status = "failed";
      await wrapper.vm.$nextTick();

      const failIcon = wrapper.find(".pi-times");
      expect(failIcon.exists()).toBe(true);
    });
  });

  describe("In Progress State", () => {
    it("should show in-progress notice", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "in-progress";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Deployment in Progress");
    });

    it("should display estimated time", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "in-progress";
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("30-60 seconds");
    });
  });

  describe("Helpful Information", () => {
    it("should display what happens next section", () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      expect(wrapper.text()).toContain("What Happens Next?");
    });

    it("should list post-deployment benefits", () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      expect(wrapper.text()).toContain("recorded on the blockchain");
      expect(wrapper.text()).toContain("view and manage your token");
      expect(wrapper.text()).toContain("email confirmation");
    });
  });

  describe("Interactive Features", () => {
    it("should provide copy functionality for asset ID", async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: {
          stubs,
        },
      });

      const vm = wrapper.vm as any;
      vm.deploymentStatus = "completed";
      vm.deploymentResult.assetId = "123456";
      await wrapper.vm.$nextTick();

      const copyButtons = wrapper.findAll("button").filter((btn) => btn.find(".pi-copy").exists());

      expect(copyButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Additional Function Coverage', () => {
    it('should call retryDeployment and reset stages', async () => {
      const wrapper = mount(DeploymentStatusStep, {
        global: { stubs },
      });
      const vm = wrapper.vm as any;
      // Set up failed state
      vm.deploymentStatus = 'failed';
      vm.deploymentError = { message: 'Test error', recoverable: true, remediation: 'Try again' };
      vm.deploymentStages[0].status = 'failed';
      vm.deploymentStages[0].error = 'Stage failed';
      await wrapper.vm.$nextTick();

      vm.retryDeployment();
      await wrapper.vm.$nextTick();

      // Stages should be reset to pending
      expect(vm.deploymentStages[0].status).toBe('pending');
      expect(vm.deploymentStages[0].error).toBeUndefined();
    });

    it('should call saveDraftAndExit without throwing', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      expect(() => vm.saveDraftAndExit()).not.toThrow();
    });

    it('should call contactSupport without throwing', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      expect(() => vm.contactSupport()).not.toThrow();
    });

    it('should call contactSupport with deploymentError code', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentError = { message: 'Error', code: 'RATE_LIMIT', recoverable: true, remediation: 'Wait' };
      expect(() => vm.contactSupport()).not.toThrow();
    });

    it('should call copyToClipboard without throwing', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true,
      });
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.copyToClipboard('test-text');
      expect(mockWriteText).toHaveBeenCalledWith('test-text');
    });

    it('should call formatAuditTime correctly', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      const result = vm.formatAuditTime('2024-01-15T10:30:45.000Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should compute isValid as true when deployment completed', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentStatus = 'completed';
      await wrapper.vm.$nextTick();
      expect(vm.isValid).toBe(true);
    });

    it('should compute isValid as false when deployment in-progress', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentStatus = 'in-progress';
      await wrapper.vm.$nextTick();
      expect(vm.isValid).toBe(false);
    });

    it('should compute isValid as false when deployment failed', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentStatus = 'failed';
      await wrapper.vm.$nextTick();
      expect(vm.isValid).toBe(false);
    });

    it('should call viewOnExplorer with explorerUrl present', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult.explorerUrl = 'https://algoexplorer.io/tx/TEST123';
      vm.viewOnExplorer();
      expect(openSpy).toHaveBeenCalledWith('https://algoexplorer.io/tx/TEST123', '_blank');
      openSpy.mockRestore();
    });

    it('should call viewOnExplorer with fallback Algorand URL when no explorerUrl', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult.explorerUrl = '';
      vm.deploymentResult.network = 'Algorand';
      vm.deploymentResult.assetId = '99999';
      vm.viewOnExplorer();
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('algoexplorer.io'), '_blank');
      openSpy.mockRestore();
    });

    it('should call viewOnExplorer with fallback Ethereum URL', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult.explorerUrl = '';
      vm.deploymentResult.network = 'Ethereum';
      vm.deploymentResult.assetId = '0xABCDEF';
      vm.viewOnExplorer();
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('etherscan.io'), '_blank');
      openSpy.mockRestore();
    });

    it('should call viewOnExplorer with fallback for unknown network', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult.explorerUrl = '';
      vm.deploymentResult.network = 'UnknownNetwork';
      vm.deploymentResult.assetId = '12345';
      vm.viewOnExplorer();
      expect(openSpy).toHaveBeenCalledWith('#', '_blank');
      openSpy.mockRestore();
    });

    it('should call viewOnExplorer with VOI fallback URL', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult.explorerUrl = '';
      vm.deploymentResult.network = 'VOI';
      vm.deploymentResult.assetId = '54321';
      vm.viewOnExplorer();
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('voi.observer'), '_blank');
      openSpy.mockRestore();
    });

    it('should toggleAuditTrail to true and load if empty', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult.assetId = 'ASSET-001';
      expect(vm.showAuditTrail).toBe(false);
      await vm.toggleAuditTrail();
      expect(vm.showAuditTrail).toBe(true);
    });

    it('should toggleAuditTrail to false', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.showAuditTrail = true;
      await vm.toggleAuditTrail();
      expect(vm.showAuditTrail).toBe(false);
    });

    it('should handle loadAuditTrail with no assetId gracefully', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult.assetId = '';
      // Should not throw
      await expect(vm.loadAuditTrail()).resolves.toBeUndefined();
    });

    it('should downloadAuditReport without throwing', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult.assetId = 'ASSET-001';
      vm.deploymentResult.tokenSymbol = 'TST';
      await expect(vm.downloadAuditReport()).resolves.not.toThrow();
    });

    it('should call downloadSummary without throwing when draft exists', async () => {
      const tokenDraftStore = useTokenDraftStore();
      tokenDraftStore.currentDraft = {
        projectSetup: { projectName: 'Test Project', organizationName: 'Test Org' },
        name: 'Test Token',
        symbol: 'TST',
        decimals: 18,
        totalSupply: '1000000',
      } as any;
      
      // Mock document.createElement for blob URLs
      const createObjectURL = vi.fn().mockReturnValue('blob:test-url');
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;
      
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('a'));
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('a'));
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult = {
        tokenName: 'Test Token',
        tokenSymbol: 'TST',
        network: 'Algorand',
        standard: 'ARC3',
        assetId: '12345',
        txId: 'TX-001',
      };
      
      expect(() => vm.downloadSummary()).not.toThrow();
      
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      clickSpy.mockRestore();
    });

    it('should call downloadSummary without throwing when draft is null', async () => {
      const tokenDraftStore = useTokenDraftStore();
      tokenDraftStore.currentDraft = null;
      
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
      global.URL.revokeObjectURL = vi.fn();
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('a'));
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('a'));
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;
      vm.deploymentResult = {
        tokenName: 'Test Token',
        tokenSymbol: 'TST',
        network: 'Algorand',
        standard: 'ARC3',
        assetId: '12345',
        txId: 'TX-001',
      };
      
      expect(() => vm.downloadSummary()).not.toThrow();
      vi.restoreAllMocks();
    });
  });

  describe('onUnmounted cleanup', () => {
    it('should cleanup pollingInterval and service on unmount', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;

      // Set a polling interval to test the truthy branch
      vm.pollingInterval = setInterval(() => {}, 1000);

      // Should not throw when unmounting
      expect(() => wrapper.unmount()).not.toThrow();
      expect(mockStopPolling).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();
    });

    it('should cleanup service on unmount even without pollingInterval', async () => {
      const wrapper = mount(DeploymentStatusStep, { global: { stubs } });
      const vm = wrapper.vm as any;

      // Ensure pollingInterval is null (falsy branch)
      vm.pollingInterval = null;

      expect(() => wrapper.unmount()).not.toThrow();
      expect(mockStopPolling).toHaveBeenCalled();
    });
  });

})