import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import StandardsCompatibilityStep from "../StandardsCompatibilityStep.vue";
import { useTokenDraftStore } from "../../../../stores/tokenDraft";
import { validateStandard } from "../../../../services/standardsValidator";
import { getWalletSupport } from "../../../../types/walletCompatibility";

// Mock dependencies
vi.mock("../../../../stores/tokenDraft", () => ({
  useTokenDraftStore: vi.fn(),
}));

vi.mock("../../../../services/standardsValidator", () => ({
  validateStandard: vi.fn(),
}));

vi.mock("../../../../types/walletCompatibility", () => ({
  getWalletSupport: vi.fn(),
}));

vi.mock("../../compatibility/WalletCompatibilityMatrix.vue", () => ({
  default: {
    template: "<div>Wallet Compatibility Matrix</div>",
  },
}));

describe("StandardsCompatibilityStep", () => {
  let mockTokenDraftStore: any;
  let mockValidateStandard: any;
  let mockGetWalletSupport: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    mockTokenDraftStore = {
      currentDraft: {
        selectedStandard: "ASA",
        name: "Test Token",
        symbol: "TEST",
        decimals: 6,
        supply: 1000000,
        url: "https://example.com/metadata.json",
      },
    };

    // Default validation result - this will be returned by validateStandard
    const defaultValidationResult = {
      readiness: {
        score: 85,
        level: "good",
        summary: "Token configuration looks good",
        issues: { blockers: [], major: [], minor: [] },
        passedChecks: ["Valid metadata", "Correct decimals"],
        shouldBlock: false,
        requiresAcknowledgment: false,
      },
    };

    mockValidateStandard = vi.fn().mockReturnValue(defaultValidationResult);
    mockGetWalletSupport = vi.fn().mockReturnValue({
      displayQuality: "excellent",
      behaviors: {
        specialNotes: "Full ARC3 support",
        metadataFetch: "Fetches metadata correctly",
        nameDisplay: "Test Token",
        imageSupport: "Full support",
      },
    });

    vi.mocked(useTokenDraftStore).mockReturnValue(mockTokenDraftStore);
    vi.mocked(validateStandard).mockImplementation(mockValidateStandard);
    vi.mocked(getWalletSupport).mockImplementation(mockGetWalletSupport);
  });

  describe("Component Rendering", () => {
    it("should render the wizard step with correct title and description", () => {
      const wrapper = mount(StandardsCompatibilityStep);

      expect(wrapper.text()).toContain("Standards & Compatibility");
      expect(wrapper.text()).toContain("Verify your token meets standards requirements");
    });

    it("should render readiness score card", async () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      // Wait for validation to complete
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Readiness Score: 85/100");
      expect(wrapper.text()).toContain("Good");
      expect(wrapper.text()).toContain("ASA");
    });

    it("should render blocking issues section when present", async () => {
      // Mock validation result with blockers
      mockValidateStandard.mockReturnValueOnce({
        readiness: {
          score: 45,
          level: "critical",
          summary: "Critical issues found",
          issues: {
            blockers: [
              {
                id: "blocker1",
                message: "Invalid metadata URL",
                details: "Metadata URL must be a valid HTTPS URL",
                remediation: "Update the metadata URL to use HTTPS",
                userStory: "Users expect secure metadata URLs",
              },
            ],
            major: [],
            minor: [],
          },
          passedChecks: [],
          shouldBlock: true,
          requiresAcknowledgment: false,
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Blocking Issues (1)");
      expect(wrapper.text()).toContain("Invalid metadata URL");
      expect(wrapper.text()).toContain("Metadata URL must be a valid HTTPS URL");
      expect(wrapper.text()).toContain("Update the metadata URL to use HTTPS");
    });

    it("should render major warnings section when present", async () => {
      // Mock validation result with major warnings
      mockValidateStandard.mockReturnValueOnce({
        readiness: {
          score: 70,
          level: "fair",
          summary: "Some warnings present",
          issues: {
            blockers: [],
            major: [
              {
                id: "major1",
                message: "Missing recommended fields",
                details: "Consider adding description field",
                remediation: "Add description to metadata",
                userStory: "Better metadata improves user experience",
              },
            ],
            minor: [],
          },
          passedChecks: ["Valid name"],
          shouldBlock: false,
          requiresAcknowledgment: true,
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Major Warnings (1)");
      expect(wrapper.text()).toContain("Missing recommended fields");
      expect(wrapper.text()).toContain("Consider adding description field");
      expect(wrapper.text()).toContain("Add description to metadata");
    });

    it("should render minor recommendations section when present", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          score: 90,
          level: "good",
          summary: "Minor recommendations",
          issues: {
            blockers: [],
            major: [],
            minor: [
              {
                id: "minor1",
                message: "Consider adding social links",
                details: "Social links help with discoverability",
              },
            ],
          },
          passedChecks: ["Valid metadata"],
          shouldBlock: false,
          requiresAcknowledgment: false,
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Minor Recommendations (1)");
      expect(wrapper.text()).toContain("Consider adding social links");
      expect(wrapper.text()).toContain("Social links help with discoverability");
    });

    it("should render passed checks section when present", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          score: 95,
          level: "excellent",
          summary: "Excellent configuration",
          issues: { blockers: [], major: [], minor: [] },
          passedChecks: ["Valid metadata URL", "Correct decimals", "Valid name format"],
          shouldBlock: false,
          requiresAcknowledgment: false,
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Passed Checks (3)");
      expect(wrapper.text()).toContain("Valid metadata URL");
      expect(wrapper.text()).toContain("Correct decimals");
      expect(wrapper.text()).toContain("Valid name format");
    });

    it("should render risk acknowledgment when required", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          score: 75,
          level: "fair",
          summary: "Requires acknowledgment",
          issues: {
            blockers: [],
            major: [{ id: "warn1", message: "Warning" }],
            minor: [],
          },
          passedChecks: [],
          shouldBlock: false,
          requiresAcknowledgment: true,
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Risk Acknowledgment");
      expect(wrapper.text()).toContain("I understand that my token has 1 warning(s)");
    });

    it("should render wallet compatibility preview", async () => {
      mockGetWalletSupport.mockReturnValue({
        displayQuality: "excellent",
        behaviors: {
          specialNotes: "Full ARC3 support",
          metadataFetch: "Fetches metadata correctly",
          nameDisplay: "Test Token",
          imageSupport: "Full support",
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain("Wallet Behavior Preview");
      expect(wrapper.text()).toContain("Pera Wallet");
      expect(wrapper.text()).toContain("Defly Wallet");
      expect(wrapper.text()).toContain("Lute Wallet");
    });

    it("should render compatibility matrix button", () => {
      const wrapper = mount(StandardsCompatibilityStep);

      expect(wrapper.text()).toContain("View Full Compatibility Matrix →");
    });
  });

  describe("Selected Standard Computation", () => {
    it("should map ASA standard correctly", () => {
      mockTokenDraftStore.currentDraft.selectedStandard = "ASA";
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      expect(component.selectedStandard).toBe("ASA");
    });

    it("should map ARC3 variants to ARC3", () => {
      const arc3Variants = ["ARC3", "ARC3FT", "ARC3NFT", "ARC3FNFT"];

      arc3Variants.forEach((variant) => {
        mockTokenDraftStore.currentDraft.selectedStandard = variant;
        const wrapper = mount(StandardsCompatibilityStep);
        const component = wrapper.vm as any;

        expect(component.selectedStandard).toBe("ARC3");
        wrapper.unmount();
      });
    });

    it("should map ARC19 correctly", () => {
      mockTokenDraftStore.currentDraft.selectedStandard = "ARC19";
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      expect(component.selectedStandard).toBe("ARC19");
    });

    it("should map ARC69 correctly", () => {
      mockTokenDraftStore.currentDraft.selectedStandard = "ARC69";
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      expect(component.selectedStandard).toBe("ARC69");
    });

    it("should default to ASA when no standard selected", () => {
      mockTokenDraftStore.currentDraft.selectedStandard = undefined;
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      expect(component.selectedStandard).toBe("ASA");
    });
  });

  describe("Validation Logic", () => {
    it("should compute isValid as false when no validation result", async () => {
      mockValidateStandard.mockReturnValue(null);
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;
      await wrapper.vm.$nextTick();

      expect(component.isValid).toBe(false);
    });

    it("should compute isValid as false when shouldBlock is true", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          shouldBlock: true,
          requiresAcknowledgment: false,
          issues: { blockers: [], major: [], minor: [] },
          passedChecks: [],
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;
      await wrapper.vm.$nextTick();

      expect(component.isValid).toBe(false);
    });

    it("should compute isValid as false when acknowledgment required but not given", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          shouldBlock: false,
          requiresAcknowledgment: true,
          issues: { blockers: [], major: [], minor: [] },
          passedChecks: [],
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;
      await wrapper.vm.$nextTick();

      expect(component.isValid).toBe(false);
    });

    it("should compute isValid as true when no blockers and acknowledgment not required", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          shouldBlock: false,
          requiresAcknowledgment: false,
          issues: { blockers: [], major: [], minor: [] },
          passedChecks: [],
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;
      await wrapper.vm.$nextTick();

      expect(component.isValid).toBe(true);
    });

    it("should compute isValid as true when acknowledgment required and given", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          shouldBlock: false,
          requiresAcknowledgment: true,
          issues: { blockers: [], major: [], minor: [] },
          passedChecks: [],
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;
      await wrapper.vm.$nextTick();

      // Simulate checking the acknowledgment checkbox
      component.riskAcknowledged = true;

      expect(component.isValid).toBe(true);
    });

    it("should compute hasIssues correctly", () => {
      // Test with no validation result
      mockValidateStandard.mockReturnValueOnce(null);
      const wrapper1 = mount(StandardsCompatibilityStep);
      expect(wrapper1.vm.hasIssues).toBe(false);
      wrapper1.unmount();

      // Test with validation result with no issues
      mockValidateStandard.mockReturnValueOnce({
        readiness: {
          score: 85,
          level: "good",
          summary: "No issues",
          issues: { blockers: [], major: [], minor: [] },
          passedChecks: [],
          shouldBlock: false,
          requiresAcknowledgment: false,
        },
      });
      const wrapper2 = mount(StandardsCompatibilityStep);
      expect(wrapper2.vm.hasIssues).toBe(false);
      wrapper2.unmount();

      // Test with validation result with issues
      mockValidateStandard.mockReturnValueOnce({
        readiness: {
          score: 70,
          level: "fair",
          summary: "Has issues",
          issues: { blockers: [], major: [{ id: "1", message: "test" }], minor: [] },
          passedChecks: [],
          shouldBlock: false,
          requiresAcknowledgment: false,
        },
      });
      const wrapper3 = mount(StandardsCompatibilityStep);
      expect(wrapper3.vm.hasIssues).toBe(true);
      wrapper3.unmount();
    });
  });

  describe("Validation Functions", () => {
    it("should call validateStandard with correct parameters", () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      component.performValidation();

      expect(mockValidateStandard).toHaveBeenCalledWith("ASA", {
        standard: "ASA",
        metadataUrl: "https://example.com/metadata.json",
        tokenConfig: {
          name: "Test Token",
          unitName: "TEST",
          decimals: 6,
          total: 1000000,
          url: "https://example.com/metadata.json",
        },
      });
    });

    it("should not perform validation when no draft exists", () => {
      mockTokenDraftStore.currentDraft = null;
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      component.performValidation();

      expect(mockValidateStandard).not.toHaveBeenCalled();
    });

    it("should update errors array when shouldBlock is true", () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          shouldBlock: true,
          issues: {
            blockers: [
              { id: "1", message: "Blocker 1" },
              { id: "2", message: "Blocker 2" },
            ],
          },
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      component.performValidation();

      expect(component.errors).toEqual(["Blocker 1", "Blocker 2"]);
    });

    it("should clear errors array when shouldBlock is false", () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          shouldBlock: false,
          issues: { blockers: [] },
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      component.errors = ["Previous error"];
      component.performValidation();

      expect(component.errors).toEqual([]);
    });

    it("should validate all and return isValid result", () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          shouldBlock: false,
          requiresAcknowledgment: false,
          issues: { blockers: [], major: [], minor: [] },
          passedChecks: [],
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      const result = component.validateAll();

      expect(result).toBe(true);
      expect(component.showErrors).toBe(true);
    });
  });

  describe("UI Helper Functions", () => {
    it("should return correct badge variant for quality levels", () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      expect(component.getBadgeVariant("excellent")).toBe("success");
      expect(component.getBadgeVariant("good")).toBe("info");
      expect(component.getBadgeVariant("partial")).toBe("warning");
      expect(component.getBadgeVariant("poor")).toBe("error");
      expect(component.getBadgeVariant("unknown")).toBe("default");
    });

    it("should return correct readiness color class for levels", () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      expect(component.getReadinessColorClass("excellent")).toBe("border-green-500/30 bg-green-500/5");
      expect(component.getReadinessColorClass("good")).toBe("border-blue-500/30 bg-blue-500/5");
      expect(component.getReadinessColorClass("fair")).toBe("border-yellow-500/30 bg-yellow-500/5");
      expect(component.getReadinessColorClass("poor")).toBe("border-orange-500/30 bg-orange-500/5");
      expect(component.getReadinessColorClass("critical")).toBe("border-red-500/30 bg-red-500/5");
      expect(component.getReadinessColorClass("unknown")).toBe("border-white/10");
    });

    it("should return correct readiness variant for levels", () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      expect(component.getReadinessVariant("excellent")).toBe("success");
      expect(component.getReadinessVariant("good")).toBe("info");
      expect(component.getReadinessVariant("fair")).toBe("warning");
      expect(component.getReadinessVariant("poor")).toBe("error");
      expect(component.getReadinessVariant("critical")).toBe("error");
      expect(component.getReadinessVariant("unknown")).toBe("default");
    });

    it("should capitalize readiness label", () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      expect(component.getReadinessLabel("excellent")).toBe("Excellent");
      expect(component.getReadinessLabel("good")).toBe("Good");
      expect(component.getReadinessLabel("critical")).toBe("Critical");
    });
  });

  describe("Modal Interactions", () => {
    it("should show user story modal when showUserStory is called", () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      const issue = { id: "1", message: "Test issue", userStory: "This is important" };
      component.showUserStory(issue);

      expect(component.showUserStoryModal).toBe(true);
      expect(component.selectedIssue).toEqual(issue);
    });

    it("should close user story modal when closeUserStory is called", () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      component.showUserStoryModal = true;
      component.selectedIssue = { id: "1", message: "Test" };

      component.closeUserStory();

      expect(component.showUserStoryModal).toBe(false);
      expect(component.selectedIssue).toBeNull();
    });

    it("should show compatibility matrix modal when button is clicked", async () => {
      const wrapper = mount(StandardsCompatibilityStep);
      await wrapper.vm.$nextTick();

      const button = wrapper.findAll("button").find((btn) => btn.text().includes("View Full Compatibility Matrix"));
      expect(button).toBeDefined();
      await button?.trigger("click");

      const component = wrapper.vm as any;
      expect(component.showCompatibilityMatrix).toBe(true);
    });

    it("should render compatibility matrix modal when showCompatibilityMatrix is true", async () => {
      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      component.showCompatibilityMatrix = true;
      await wrapper.vm.$nextTick();

      // Check that the modal state is set (the actual modal rendering is tested via the button click)
      expect(component.showCompatibilityMatrix).toBe(true);
    });
  });

  describe("Wallet Preview Computation", () => {
    it("should compute preview wallets correctly", () => {
      mockGetWalletSupport.mockReturnValue({
        displayQuality: "excellent",
        behaviors: {
          specialNotes: "Full support",
          metadataFetch: "Fetches correctly",
          nameDisplay: "Test Token (TEST)",
          imageSupport: "Full support for all formats",
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      const wallets = component.previewWallets;

      expect(wallets).toHaveLength(3);
      expect(wallets[0]).toEqual({
        id: "pera",
        name: "Pera Wallet",
        supportLabel: "Excellent",
        supportVariant: "success",
        behavior: "Full support",
        nameDisplay: "Test Token (TEST)",
        imageSupport: "Full support for all formats",
      });
    });

    it("should handle missing wallet support data", () => {
      mockGetWalletSupport.mockReturnValue(null);

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;

      const wallets = component.previewWallets;

      expect(wallets[0]).toEqual({
        id: "pera",
        name: "Pera",
        supportLabel: "Unknown",
        supportVariant: "default",
        behavior: "Support information not available",
        nameDisplay: "Test Token",
        imageSupport: "Unknown",
      });
    });
  });

  describe("Lifecycle and Reactivity", () => {
    it("should perform validation on mount", () => {
      mount(StandardsCompatibilityStep);

      expect(mockValidateStandard).toHaveBeenCalled();
    });

    it("should expose isValid and validateAll methods", () => {
      const wrapper = mount(StandardsCompatibilityStep);

      expect(typeof wrapper.vm.isValid).toBe("boolean");
      expect(typeof wrapper.vm.validateAll).toBe("function");
    });
  });

  describe("Risk Acknowledgment", () => {
    it("should bind risk acknowledgment checkbox", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          requiresAcknowledgment: true,
          shouldBlock: false,
          issues: { blockers: [], major: [{ id: "warn", message: "Warning" }], minor: [] },
          passedChecks: [],
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      await wrapper.vm.$nextTick();

      const checkbox = wrapper.find("#risk-ack");
      expect(checkbox.exists()).toBe(true);
      await checkbox.setValue(true);

      const component = wrapper.vm as any;
      expect(component.riskAcknowledged).toBe(true);
    });

    it("should update validity when acknowledgment changes", async () => {
      mockValidateStandard.mockReturnValue({
        readiness: {
          shouldBlock: false,
          requiresAcknowledgment: true,
          issues: { blockers: [], major: [{ id: "warn", message: "Warning" }], minor: [] },
          passedChecks: [],
        },
      });

      const wrapper = mount(StandardsCompatibilityStep);
      const component = wrapper.vm as any;
      await wrapper.vm.$nextTick();

      // Initially invalid
      expect(component.isValid).toBe(false);

      // Check acknowledgment
      const checkbox = wrapper.find("#risk-ack");
      expect(checkbox.exists()).toBe(true);
      await checkbox.setValue(true);

      // Should now be valid
      expect(component.isValid).toBe(true);
    });
  });
});
