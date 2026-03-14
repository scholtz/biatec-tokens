import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PolicySummaryPanel from "../PolicySummaryPanel.vue";
import type { WhitelistPolicy } from "../../../stores/whitelistPolicy";
import { nextTick } from "vue";

const MOCK_POLICY: WhitelistPolicy = {
  id: "p1",
  tokenId: "t1",
  version: "1.0",
  status: "active",
  defaultBehavior: "allow_by_rule",
  allowedJurisdictions: [
    { code: "SK", name: "Slovakia" },
    { code: "CZ", name: "Czechia" },
    { code: "DE", name: "Germany" },
  ],
  restrictedJurisdictions: [{ code: "PL", name: "Poland", reason: "Under review" }],
  blockedJurisdictions: [
    { code: "US", name: "United States" },
    { code: "CN", name: "China" },
  ],
  allowedInvestorCategories: [
    { category: "retail", label: "Retail Investors", allowed: true, kycRequired: true },
    { category: "professional", label: "Professional Investors", allowed: true, kycRequired: true },
    { category: "institutional", label: "Institutional Investors", allowed: false, kycRequired: false },
  ],
  kycRequired: true,
  accreditationRequired: false,
  summary: "Retail investors from Slovakia, Czechia and Germany are eligible.",
  lastUpdatedAt: "2026-01-15T09:00:00Z",
  lastUpdatedBy: "user-001",
  lastUpdatedByEmail: "compliance@company.com",
  createdAt: "2026-01-01T00:00:00Z",
  reviewStatus: "approved",
  gaps: [],
};

describe("PolicySummaryPanel", () => {
  // ── Loading skeleton ────────────────────────────────────────────────────────

  describe("loading state", () => {
    it("shows loading skeleton when loading=true", () => {
      const wrapper = mount(PolicySummaryPanel, {
        props: { policy: MOCK_POLICY, loading: true },
      });
      // Loading state uses aria-hidden on visual skeleton + sr-only role="status" for AT
      expect(wrapper.find('[aria-hidden="true"].animate-pulse').exists()).toBe(true);
    });

    it("shows animate-pulse while loading", () => {
      const wrapper = mount(PolicySummaryPanel, {
        props: { policy: MOCK_POLICY, loading: true },
      });
      expect(wrapper.find(".animate-pulse").exists()).toBe(true);
    });

    it("hides summary text while loading", () => {
      const wrapper = mount(PolicySummaryPanel, {
        props: { policy: MOCK_POLICY, loading: true },
      });
      expect(wrapper.text()).not.toContain("Retail investors");
    });
  });

  // ── Loaded state ─────────────────────────────────────────────────────────────

  describe("loaded state", () => {
    function mountPanel() {
      return mount(PolicySummaryPanel, {
        props: { policy: MOCK_POLICY },
      });
    }

    it("renders without loading prop (default false)", () => {
      const wrapper = mountPanel();
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false);
    });

    it("shows the policy summary text", () => {
      const wrapper = mountPanel();
      expect(wrapper.text()).toContain("Retail investors from Slovakia");
    });

    it("shows allowed jurisdiction count metric", () => {
      const wrapper = mountPanel();
      expect(wrapper.text()).toContain("3"); // 3 allowed jurisdictions
    });

    it("shows blocked jurisdiction count metric", () => {
      const wrapper = mountPanel();
      expect(wrapper.text()).toContain("2"); // 2 blocked
    });

    it("shows enabled investor categories count", () => {
      const wrapper = mountPanel();
      // 2 categories with allowed=true
      expect(wrapper.text()).toContain("2");
    });

    it("shows 'Healthy' status badge when no gaps", () => {
      const wrapper = mountPanel();
      expect(wrapper.text()).toContain("Healthy");
    });

    it("shows 'Warnings' status badge for warning gaps", () => {
      const policyWithGap: WhitelistPolicy = {
        ...MOCK_POLICY,
        gaps: [{ id: "g1", severity: "warning", message: "Missing jurisdiction reason" }],
      };
      const wrapper = mount(PolicySummaryPanel, { props: { policy: policyWithGap } });
      expect(wrapper.text()).toContain("Warnings");
    });

    it("shows 'Critical' status badge for error gaps", () => {
      const policyWithError: WhitelistPolicy = {
        ...MOCK_POLICY,
        gaps: [{ id: "g1", severity: "error", message: "No investors allowed" }],
      };
      const wrapper = mount(PolicySummaryPanel, { props: { policy: policyWithError } });
      expect(wrapper.text()).toContain("Critical");
    });

    it("shows last updated email", () => {
      const wrapper = mountPanel();
      expect(wrapper.text()).toContain("compliance@company.com");
    });

    it("renders gap warning messages when gaps present", () => {
      const policyWithGap: WhitelistPolicy = {
        ...MOCK_POLICY,
        gaps: [{ id: "g1", severity: "warning", message: "Missing jurisdiction reason" }],
      };
      const wrapper = mount(PolicySummaryPanel, { props: { policy: policyWithGap } });
      expect(wrapper.text()).toContain("Missing jurisdiction reason");
    });

    it("has an accessible aria-label", () => {
      const wrapper = mountPanel();
      expect(wrapper.attributes("aria-label")).toBe("Policy summary panel");
    });

    it("expand button toggles how-it-works section", async () => {
      const wrapper = mountPanel();
      const btn = wrapper.find('button[aria-controls="policy-explanation"]');
      expect(btn.exists()).toBe(true);
      await btn.trigger("click");
      await nextTick();
      expect(wrapper.find("#policy-explanation").isVisible()).toBe(true);
    });

    it("explanation includes default behavior description", async () => {
      const wrapper = mountPanel();
      const btn = wrapper.find('button[aria-controls="policy-explanation"]');
      await btn.trigger("click");
      await nextTick();
      expect(wrapper.text()).toContain("Apply Rules");
    });
  });
});
