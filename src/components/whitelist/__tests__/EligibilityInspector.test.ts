import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { nextTick } from "vue";
import EligibilityInspector from "../EligibilityInspector.vue";
import { useWhitelistPolicyStore } from "../../../stores/whitelistPolicy";
import type { WhitelistPolicy } from "../../../stores/whitelistPolicy";

const MOCK_POLICY: WhitelistPolicy = {
  id: "p1",
  tokenId: "t1",
  version: "1.0",
  status: "active",
  defaultBehavior: "allow_by_rule",
  allowedJurisdictions: [{ code: "SK", name: "Slovakia" }],
  restrictedJurisdictions: [{ code: "PL", name: "Poland", reason: "Pending review" }],
  blockedJurisdictions: [{ code: "US", name: "United States", reason: "SEC" }],
  allowedInvestorCategories: [
    { category: "retail", label: "Retail Investors", allowed: true, kycRequired: true },
    { category: "professional", label: "Professional Investors", allowed: true, kycRequired: false },
    { category: "qualified", label: "Qualified Investors", allowed: false, kycRequired: true },
  ],
  kycRequired: true,
  accreditationRequired: false,
  summary: "Test summary",
  lastUpdatedAt: "2026-01-01T00:00:00Z",
  lastUpdatedBy: "user",
  lastUpdatedByEmail: "user@test.com",
  createdAt: "2026-01-01T00:00:00Z",
  reviewStatus: "approved",
  gaps: [],
};

function mountInspector(storeOverrides: Record<string, unknown> = {}) {
  return mount(EligibilityInspector, {
    props: { policy: MOCK_POLICY },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            whitelistPolicy: {
              eligibilityResult: null,
              isCheckingEligibility: false,
              ...storeOverrides,
            },
          },
        }),
      ],
    },
  });
}

describe("EligibilityInspector", () => {
  // ── Form elements ─────────────────────────────────────────────────────────────

  describe("form elements", () => {
    it("renders jurisdiction search input", () => {
      const wrapper = mountInspector();
      expect(wrapper.find("#jurisdiction-select").exists()).toBe(true);
    });

    it("renders investor category select", () => {
      const wrapper = mountInspector();
      expect(wrapper.find("#investor-category").exists()).toBe(true);
    });

    it("renders check eligibility button", () => {
      const wrapper = mountInspector();
      const btn = wrapper.find('button[aria-label="Check eligibility"]');
      expect(btn.exists()).toBe(true);
    });

    it("check button is disabled when no selection", () => {
      const wrapper = mountInspector();
      const btn = wrapper.find('button[aria-label="Check eligibility"]');
      expect(btn.attributes("disabled")).toBeDefined();
    });

    it("shows all investor categories from policy", () => {
      const wrapper = mountInspector();
      const options = wrapper.findAll("#investor-category option");
      // Placeholder + 3 categories
      expect(options.length).toBe(4);
    });

    it("has accessible aria-label on container", () => {
      const wrapper = mountInspector();
      expect(wrapper.attributes("aria-label")).toBe("Eligibility inspector");
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────────────

  describe("loading state", () => {
    it("shows spinner text when checking eligibility", () => {
      const wrapper = mountInspector({ isCheckingEligibility: true });
      expect(wrapper.text()).toContain("Checking");
    });

    it("button is disabled while checking", () => {
      const wrapper = mountInspector({ isCheckingEligibility: true });
      const btn = wrapper.find('button[aria-label="Check eligibility"]');
      expect(btn.attributes("disabled")).toBeDefined();
    });
  });

  // ── Result panel ──────────────────────────────────────────────────────────────

  describe("result display", () => {
    const ALLOWED_RESULT = {
      jurisdictionCode: "SK",
      jurisdictionName: "Slovakia",
      investorCategory: "retail",
      decision: "allowed" as const,
      reasons: [
        { code: "JURISDICTION_ALLOWED", message: "Slovakia is on the approved list.", severity: "info" as const },
      ],
      simulatedAt: new Date().toISOString(),
    };

    const DENIED_RESULT = {
      ...ALLOWED_RESULT,
      jurisdictionCode: "US",
      jurisdictionName: "United States",
      decision: "denied" as const,
      reasons: [
        { code: "JURISDICTION_BLOCKED", message: "United States is blocked.", severity: "blocking" as const },
      ],
    };

    const REVIEW_RESULT = {
      ...ALLOWED_RESULT,
      jurisdictionCode: "PL",
      jurisdictionName: "Poland",
      decision: "requires_review" as const,
      reasons: [
        { code: "JURISDICTION_RESTRICTED", message: "Poland is under review.", severity: "warning" as const },
      ],
    };

    it("shows ALLOWED decision badge", () => {
      const wrapper = mountInspector({ eligibilityResult: ALLOWED_RESULT });
      expect(wrapper.text()).toContain("allowed");
    });

    it("shows DENIED decision badge", () => {
      const wrapper = mountInspector({ eligibilityResult: DENIED_RESULT });
      expect(wrapper.text()).toContain("denied");
    });

    it("shows REQUIRES REVIEW decision badge", () => {
      const wrapper = mountInspector({ eligibilityResult: REVIEW_RESULT });
      expect(wrapper.text()).toContain("requires review");
    });

    it("shows reason messages", () => {
      const wrapper = mountInspector({ eligibilityResult: ALLOWED_RESULT });
      expect(wrapper.text()).toContain("Slovakia is on the approved list.");
    });

    it("shows blocking reason message", () => {
      const wrapper = mountInspector({ eligibilityResult: DENIED_RESULT });
      expect(wrapper.text()).toContain("United States is blocked.");
    });

    it("shows Clear button when result is present", () => {
      const wrapper = mountInspector({ eligibilityResult: ALLOWED_RESULT });
      expect(wrapper.find('button[aria-label="Clear eligibility result"]').exists()).toBe(true);
    });

    it("Clear button calls store.clearEligibility", async () => {
      const wrapper = mountInspector({ eligibilityResult: ALLOWED_RESULT });
      const store = useWhitelistPolicyStore();
      await wrapper.find('button[aria-label="Clear eligibility result"]').trigger("click");
      expect(store.clearEligibility).toHaveBeenCalled();
    });

    it("result panel has aria-live attribute", () => {
      const wrapper = mountInspector({ eligibilityResult: ALLOWED_RESULT });
      const panel = wrapper.find('[aria-live="polite"]');
      expect(panel.exists()).toBe(true);
    });

    it("does not show result panel when no result", () => {
      const wrapper = mountInspector({ eligibilityResult: null });
      expect(wrapper.find('[aria-label="Eligibility result"]').exists()).toBe(false);
    });
  });

  // ── Jurisdiction dropdown ─────────────────────────────────────────────────────

  describe("jurisdiction dropdown", () => {
    it("shows dropdown list on input focus", async () => {
      const wrapper = mountInspector();
      const input = wrapper.find("#jurisdiction-select");
      await input.trigger("focus");
      await nextTick();
      expect(wrapper.find("#jurisdiction-options").exists()).toBe(true);
    });

    it("filters jurisdictions by search text", async () => {
      const wrapper = mountInspector();
      const input = wrapper.find("#jurisdiction-select");
      await input.trigger("focus");
      await input.setValue("Slo");
      await nextTick();
      const options = wrapper.findAll('[role="option"]');
      expect(options.some((o) => o.text().includes("Slovakia"))).toBe(true);
    });
  });
});
