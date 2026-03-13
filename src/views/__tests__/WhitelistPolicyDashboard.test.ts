import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { createRouter, createMemoryHistory } from "vue-router";
import { nextTick } from "vue";
import WhitelistPolicyDashboard from "../WhitelistPolicyDashboard.vue";
import { useWhitelistPolicyStore } from "../../stores/whitelistPolicy";

// ── Mock child components ──────────────────────────────────────────────────────

vi.mock("../../components/layout/MainLayout.vue", () => ({
  default: { name: "MainLayout", template: "<div><slot /></div>" },
}));
vi.mock("../../components/whitelist/PolicySummaryPanel.vue", () => ({
  default: {
    name: "PolicySummaryPanel",
    template: '<div data-testid="policy-summary-panel">Summary</div>',
    props: ["policy", "loading"],
  },
}));
vi.mock("../../components/whitelist/PolicyAuditCard.vue", () => ({
  default: {
    name: "PolicyAuditCard",
    template: '<div data-testid="policy-audit-card">Audit</div>',
    props: ["policy"],
  },
}));
vi.mock("../../components/whitelist/EligibilityInspector.vue", () => ({
  default: {
    name: "EligibilityInspector",
    template: '<div data-testid="eligibility-inspector">Inspector</div>',
    props: ["policy"],
  },
}));
vi.mock("../../components/whitelist/PolicyEditPanel.vue", () => ({
  default: {
    name: "PolicyEditPanel",
    template: '<div data-testid="policy-edit-panel">Edit Panel</div>',
    props: ["policy", "visible"],
    emits: ["close", "saved"],
  },
}));

// ── Mock policy data ───────────────────────────────────────────────────────────

const MOCK_POLICY = {
  id: "policy-001",
  tokenId: "token-001",
  version: "1.3",
  status: "active" as const,
  defaultBehavior: "allow_by_rule" as const,
  allowedJurisdictions: [{ code: "SK", name: "Slovakia" }],
  restrictedJurisdictions: [],
  blockedJurisdictions: [{ code: "US", name: "United States", reason: "SEC" }],
  allowedInvestorCategories: [
    { category: "retail", label: "Retail Investors", allowed: true, kycRequired: true },
  ],
  kycRequired: true,
  accreditationRequired: false,
  summary: "Test summary",
  lastUpdatedAt: "2026-03-01T10:00:00Z",
  lastUpdatedBy: "user-001",
  lastUpdatedByEmail: "compliance@company.com",
  createdAt: "2026-01-01T00:00:00Z",
  reviewStatus: "approved" as const,
  gaps: [],
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/compliance/policy", component: WhitelistPolicyDashboard }],
  });
}

function mountDashboard(storeOverrides: Record<string, unknown> = {}) {
  return mount(WhitelistPolicyDashboard, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            whitelistPolicy: {
              policy: null,
              isLoading: false,
              error: null,
              draft: null,
              eligibilityResult: null,
              isSaving: false,
              isCheckingEligibility: false,
              lastFetched: null,
              ...storeOverrides,
            },
          },
        }),
        makeRouter(),
      ],
    },
  });
}

describe("WhitelistPolicyDashboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Loading state ────────────────────────────────────────────────────────────

  describe("loading state", () => {
    it("renders loading skeleton when isLoading is true", () => {
      const wrapper = mountDashboard({ isLoading: true });
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);
    });

    it("shows animate-pulse class when loading", () => {
      const wrapper = mountDashboard({ isLoading: true });
      expect(wrapper.find(".animate-pulse").exists()).toBe(true);
    });

    it("does not show policy content while loading", () => {
      const wrapper = mountDashboard({ isLoading: true });
      expect(wrapper.find('[data-testid="policy-summary-panel"]').exists()).toBe(false);
    });
  });

  // ── Error state ──────────────────────────────────────────────────────────────

  describe("error state", () => {
    it("renders error state when error is set", () => {
      const wrapper = mountDashboard({ error: "Network error" });
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    });

    it("shows error message in error state", () => {
      const wrapper = mountDashboard({ error: "Failed to load policy" });
      expect(wrapper.text()).toContain("Failed to load policy");
    });

    it("has retry button in error state", () => {
      const wrapper = mountDashboard({ error: "Error" });
      expect(wrapper.find('[data-testid="retry-button"]').exists()).toBe(true);
    });

    it("calls fetchPolicy when retry button clicked", async () => {
      const wrapper = mountDashboard({ error: "Error" });
      const store = useWhitelistPolicyStore();
      await wrapper.find('[data-testid="retry-button"]').trigger("click");
      expect(store.fetchPolicy).toHaveBeenCalledWith("token-001");
    });
  });

  // ── Empty state ──────────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("renders empty state when no policy", () => {
      const wrapper = mountDashboard({ policy: null, isLoading: false, error: null });
      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
    });

    it("shows setup CTA in empty state", () => {
      const wrapper = mountDashboard({ policy: null });
      expect(wrapper.find('[data-testid="setup-policy-button"]').exists()).toBe(true);
    });

    it("calls fetchPolicy when setup CTA is clicked", async () => {
      const wrapper = mountDashboard({ policy: null });
      const store = useWhitelistPolicyStore();
      await wrapper.find('[data-testid="setup-policy-button"]').trigger("click");
      expect(store.fetchPolicy).toHaveBeenCalledWith("token-001");
    });
  });

  // ── Policy loaded ────────────────────────────────────────────────────────────

  describe("policy loaded", () => {
    it("renders policy summary panel when policy is loaded", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY, isLoading: false, error: null });
      expect(wrapper.find('[data-testid="policy-summary-panel"]').exists()).toBe(true);
    });

    it("renders policy audit card when policy is loaded", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.find('[data-testid="policy-audit-card"]').exists()).toBe(true);
    });

    it("renders allowed jurisdictions panel", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.find('[data-testid="allowed-jurisdictions-panel"]').exists()).toBe(true);
    });

    it("renders blocked jurisdictions panel", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.find('[data-testid="blocked-jurisdictions-panel"]').exists()).toBe(true);
    });

    it("shows jurisdiction chips for allowed regions", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.text()).toContain("Slovakia");
    });

    it("shows jurisdiction chips for blocked regions", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      const blockedPanel = wrapper.find('[data-testid="blocked-jurisdictions-panel"]');
      expect(blockedPanel.text()).toContain("United States");
    });

    it("shows edit policy button when loaded", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.find('[data-testid="edit-policy-button"]').exists()).toBe(true);
    });

    it("shows review eligibility button when loaded", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.find('[data-testid="review-eligibility-button"]').exists()).toBe(true);
    });
  });

  // ── Eligibility inspector toggle ─────────────────────────────────────────────

  describe("eligibility inspector", () => {
    it("hides eligibility inspector by default", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.find('[data-testid="eligibility-inspector"]').exists()).toBe(false);
    });

    it("shows eligibility inspector after clicking review button", async () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      await wrapper.find('[data-testid="review-eligibility-button"]').trigger("click");
      await nextTick();
      expect(wrapper.find('[data-testid="eligibility-inspector-container"]').exists()).toBe(true);
    });

    it("toggles eligibility inspector on second click", async () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      await wrapper.find('[data-testid="review-eligibility-button"]').trigger("click");
      await nextTick();
      await wrapper.find('[data-testid="review-eligibility-button"]').trigger("click");
      await nextTick();
      expect(wrapper.find('[data-testid="eligibility-inspector-container"]').exists()).toBe(false);
    });
  });

  // ── Edit panel ────────────────────────────────────────────────────────────────

  describe("edit panel", () => {
    it("calls fetchPolicy on mount", () => {
      const wrapper = mountDashboard();
      const store = useWhitelistPolicyStore();
      expect(store.fetchPolicy).toHaveBeenCalledWith("token-001");
    });

    it("shows page heading", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.find("h1").text()).toContain("Whitelist Policy Management");
    });

    it("shows edit panel when edit policy button is clicked", async () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      await wrapper.find('[data-testid="edit-policy-button"]').trigger("click");
      await nextTick();
      expect(wrapper.find('[data-testid="policy-edit-panel"]').exists()).toBe(true);
    });

    it("hides edit panel when close event is emitted", async () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      await wrapper.find('[data-testid="edit-policy-button"]').trigger("click");
      await nextTick();
      // The mock edit panel emits 'close' — parent sets showEditPanel = false (visible = false)
      const editPanel = wrapper.findComponent({ name: "PolicyEditPanel" });
      await editPanel.vm.$emit("close");
      await nextTick();
      // visible prop should now be false
      expect(editPanel.props("visible")).toBe(false);
    });

    it("hides edit panel when saved event is emitted", async () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      await wrapper.find('[data-testid="edit-policy-button"]').trigger("click");
      await nextTick();
      const editPanel = wrapper.findComponent({ name: "PolicyEditPanel" });
      await editPanel.vm.$emit("saved");
      await nextTick();
      // handlePolicySaved sets showEditPanel = false → visible = false
      expect(editPanel.props("visible")).toBe(false);
    });
  });

  // ── Policy gaps section ───────────────────────────────────────────────────────

  describe("policy gaps", () => {
    it("shows policy gaps section when hasGaps is true (via store)", () => {
      const policyWithGaps = {
        ...MOCK_POLICY,
        gaps: [
          { id: "gap-1", message: "No investor categories enabled", severity: "error" as const },
        ],
      };
      const wrapper = mountDashboard({ policy: policyWithGaps });
      expect(wrapper.text()).toContain("Policy Gaps");
      expect(wrapper.text()).toContain("No investor categories enabled");
    });

    it("does not show gaps section when policy has no gaps", () => {
      const wrapper = mountDashboard({ policy: MOCK_POLICY });
      expect(wrapper.find(".border-amber-700\\/30").exists()).toBe(false);
    });
  });
});
