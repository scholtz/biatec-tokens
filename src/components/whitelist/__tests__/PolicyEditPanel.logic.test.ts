/**
 * Logic tests for PolicyEditPanel.vue
 *
 * Covers the interactive state-machine paths that DOM-event tests miss in
 * happy-dom's Teleport environment: addJurisdiction (known + custom fallback),
 * removeJurisdiction, toggleCategory, toggleKyc, changeSummary branches
 * (kycRequired, accreditationRequired, defaultBehavior), and handleConfirmSave
 * wiring.
 *
 * These tests use `(wrapper.vm as any)` to call internal script-setup functions
 * directly, which is the recognised pattern for Teleport components where DOM
 * event dispatch does not reliably reach Vue-registered listeners in happy-dom.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { nextTick } from "vue";
import PolicyEditPanel from "../PolicyEditPanel.vue";
import { useWhitelistPolicyStore } from "../../../stores/whitelistPolicy";
import type { WhitelistPolicy } from "../../../stores/whitelistPolicy";

const MOCK_POLICY: WhitelistPolicy = {
  id: "p1",
  tokenId: "t1",
  version: "1.0",
  status: "active",
  defaultBehavior: "allow_by_rule",
  allowedJurisdictions: [{ code: "SK", name: "Slovakia" }],
  restrictedJurisdictions: [{ code: "PL", name: "Poland" }],
  blockedJurisdictions: [{ code: "US", name: "United States", reason: "SEC" }],
  allowedInvestorCategories: [
    { category: "retail", label: "Retail Investors", allowed: true, kycRequired: true },
    { category: "professional", label: "Professional Investors", allowed: true, kycRequired: false },
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

function mountPanel() {
  return mount(PolicyEditPanel, {
    props: { policy: MOCK_POLICY, visible: true },
    attachTo: document.body,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: { whitelistPolicy: { isSaving: false } },
        }),
      ],
    },
  });
}

describe("PolicyEditPanel — interaction logic", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // ── addJurisdiction ──────────────────────────────────────────────────────────

  describe("addJurisdiction", () => {
    it("adds a known country (by name) to the allowed list", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // Open the add-input for allowed list
      vm.activeAddInput = "allowedJurisdictions";
      vm.addCountrySearch = "Germany";
      await nextTick();

      vm.addJurisdiction("allowedJurisdictions");
      await nextTick();

      const added = vm.localDraft.allowedJurisdictions.find((j: { code: string; name: string }) => j.code === "DE");
      expect(added).toBeTruthy();
      expect(added.name).toBe("Germany");
      // Search field should be cleared
      expect(vm.addCountrySearch).toBe("");
      wrapper.unmount();
    });

    it("adds a known country (by ISO code) to the blocked list", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.activeAddInput = "blockedJurisdictions";
      vm.addCountrySearch = "FR"; // France by code
      await nextTick();

      vm.addJurisdiction("blockedJurisdictions");
      await nextTick();

      const added = vm.localDraft.blockedJurisdictions.find((j: { code: string; name: string }) => j.code === "FR");
      expect(added).toBeTruthy();
      expect(added.name).toBe("France");
      wrapper.unmount();
    });

    it("uses custom fallback for unrecognised country name", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.activeAddInput = "allowedJurisdictions";
      vm.addCountrySearch = "Terraformare"; // Not in ALL_JURISDICTIONS
      await nextTick();

      vm.addJurisdiction("allowedJurisdictions");
      await nextTick();

      // Fallback: first-two-chars uppercase = "TE"
      const added = vm.localDraft.allowedJurisdictions.find((j: { code: string; name: string }) => j.code === "TE");
      expect(added).toBeTruthy();
      expect(added.name).toBe("Terraformare");
      wrapper.unmount();
    });

    it("does not add duplicate country", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // SK is already in allowedJurisdictions
      vm.activeAddInput = "allowedJurisdictions";
      vm.addCountrySearch = "Slovakia";
      await nextTick();

      const countBefore = vm.localDraft.allowedJurisdictions.length;
      vm.addJurisdiction("allowedJurisdictions");
      await nextTick();

      expect(vm.localDraft.allowedJurisdictions.length).toBe(countBefore);
      wrapper.unmount();
    });

    it("does nothing if addCountrySearch is empty", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.activeAddInput = "allowedJurisdictions";
      vm.addCountrySearch = "  "; // whitespace only
      await nextTick();

      const countBeforeEmpty = vm.localDraft.allowedJurisdictions.length;
      vm.addJurisdiction("allowedJurisdictions");
      await nextTick();

      expect(vm.localDraft.allowedJurisdictions.length).toBe(countBeforeEmpty);
      wrapper.unmount();
    });

    it("closes add input after successful add", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.activeAddInput = "allowedJurisdictions";
      vm.addCountrySearch = "Germany";
      await nextTick();

      vm.addJurisdiction("allowedJurisdictions");
      await nextTick();

      expect(vm.activeAddInput).toBeNull();
      wrapper.unmount();
    });
  });

  // ── removeJurisdiction ───────────────────────────────────────────────────────

  describe("removeJurisdiction", () => {
    it("removes country from allowed list", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      expect(vm.localDraft.allowedJurisdictions.find((j: { code: string }) => j.code === "SK")).toBeTruthy();
      vm.removeJurisdiction("allowedJurisdictions", "SK");
      await nextTick();

      expect(vm.localDraft.allowedJurisdictions.find((j: { code: string }) => j.code === "SK")).toBeUndefined();
      wrapper.unmount();
    });

    it("removes country from blocked list", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.removeJurisdiction("blockedJurisdictions", "US");
      await nextTick();

      expect(vm.localDraft.blockedJurisdictions.find((j: { code: string }) => j.code === "US")).toBeUndefined();
      wrapper.unmount();
    });

    it("does nothing when localDraft is null", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.localDraft = null;
      // Should not throw
      expect(() => vm.removeJurisdiction("allowedJurisdictions", "SK")).not.toThrow();
      wrapper.unmount();
    });
  });

  // ── toggleCategory ───────────────────────────────────────────────────────────

  describe("toggleCategory", () => {
    it("flips the allowed flag on investor category", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      const before = vm.localDraft.allowedInvestorCategories[0].allowed; // true
      vm.toggleCategory(0);
      await nextTick();

      expect(vm.localDraft.allowedInvestorCategories[0].allowed).toBe(!before);
      wrapper.unmount();
    });

    it("toggles back to original on second call", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      const orig = vm.localDraft.allowedInvestorCategories[1].allowed;
      vm.toggleCategory(1);
      vm.toggleCategory(1);
      await nextTick();

      expect(vm.localDraft.allowedInvestorCategories[1].allowed).toBe(orig);
      wrapper.unmount();
    });

    it("does nothing when localDraft is null", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.localDraft = null;
      expect(() => vm.toggleCategory(0)).not.toThrow();
      wrapper.unmount();
    });
  });

  // ── toggleKyc ────────────────────────────────────────────────────────────────

  describe("toggleKyc", () => {
    it("flips kycRequired on investor category", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      const before = vm.localDraft.allowedInvestorCategories[0].kycRequired; // true
      vm.toggleKyc(0);
      await nextTick();

      expect(vm.localDraft.allowedInvestorCategories[0].kycRequired).toBe(!before);
      wrapper.unmount();
    });

    it("does nothing when localDraft is null", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.localDraft = null;
      expect(() => vm.toggleKyc(0)).not.toThrow();
      wrapper.unmount();
    });
  });

  // ── changeSummary computed ───────────────────────────────────────────────────

  describe("changeSummary", () => {
    it("includes kycRequired change when global KYC is toggled", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // Toggle global kycRequired (originally true → false)
      vm.localDraft.kycRequired = false;
      await nextTick();

      expect(vm.changeSummary).toContain("Global KYC: Disabled");
      wrapper.unmount();
    });

    it("includes accreditationRequired change when toggled", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // Toggle accreditationRequired (originally false → true)
      vm.localDraft.accreditationRequired = true;
      await nextTick();

      expect(vm.changeSummary).toContain("Accreditation: Enabled");
      wrapper.unmount();
    });

    it("includes defaultBehavior change when changed", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // Change from allow_by_rule → deny_all
      vm.localDraft.defaultBehavior = "deny_all";
      await nextTick();

      expect(vm.changeSummary.some((s: string) => s.includes("Default behavior"))).toBe(true);
      wrapper.unmount();
    });

    it("includes investor category allow change", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // Disable retail investors
      vm.localDraft.allowedInvestorCategories[0].allowed = false;
      await nextTick();

      expect(vm.changeSummary.some((s: string) => s.includes("Disable participation"))).toBe(true);
      wrapper.unmount();
    });

    it("includes investor category KYC change", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // Toggle KYC for professional (originally false → true)
      vm.localDraft.allowedInvestorCategories[1].kycRequired = true;
      await nextTick();

      expect(vm.changeSummary.some((s: string) => s.includes("KYC requirement"))).toBe(true);
      wrapper.unmount();
    });

    it("includes jurisdiction removal in summary", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // Remove Slovakia from allowed
      vm.localDraft.allowedJurisdictions = [];
      await nextTick();

      expect(vm.changeSummary).toContain("Remove Slovakia from Allowed list");
      wrapper.unmount();
    });

    it("includes jurisdiction addition in summary", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      // Add Germany to blocked
      vm.localDraft.blockedJurisdictions = [
        ...vm.localDraft.blockedJurisdictions,
        { code: "DE", name: "Germany" },
      ];
      await nextTick();

      expect(vm.changeSummary).toContain("Add Germany to Blocked list");
      wrapper.unmount();
    });

    it("returns empty array when localDraft is null", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.localDraft = null;
      await nextTick();

      expect(vm.changeSummary).toEqual([]);
      wrapper.unmount();
    });
  });

  // ── handleConfirmSave ─────────────────────────────────────────────────────────

  describe("handleConfirmSave", () => {
    it("calls store.startEdit, updateDraft, and saveDraft", async () => {
      const wrapper = mountPanel();
      const store = useWhitelistPolicyStore();
      await nextTick();
      const vm = wrapper.vm as any;

      await vm.handleConfirmSave();
      await nextTick();

      expect(store.startEdit).toHaveBeenCalled();
      expect(store.updateDraft).toHaveBeenCalled();
      expect(store.saveDraft).toHaveBeenCalled();
      wrapper.unmount();
    });

    it("emits saved and close after save", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      await vm.handleConfirmSave();
      await nextTick();

      expect(wrapper.emitted("saved")).toBeTruthy();
      expect(wrapper.emitted("close")).toBeTruthy();
      wrapper.unmount();
    });

    it("does nothing when localDraft is null", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;
      const store = useWhitelistPolicyStore();

      vm.localDraft = null;
      await vm.handleConfirmSave();
      await nextTick();

      expect(store.saveDraft).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  // ── toggleAddInput ────────────────────────────────────────────────────────────

  describe("toggleAddInput", () => {
    it("opens input for given list key", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.toggleAddInput("allowedJurisdictions");
      await nextTick();

      expect(vm.activeAddInput).toBe("allowedJurisdictions");
      wrapper.unmount();
    });

    it("closes input on second call for same key", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.toggleAddInput("allowedJurisdictions");
      await nextTick();
      vm.toggleAddInput("allowedJurisdictions");
      await nextTick();

      expect(vm.activeAddInput).toBeNull();
      wrapper.unmount();
    });

    it("switches to different key without closing", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const vm = wrapper.vm as any;

      vm.toggleAddInput("allowedJurisdictions");
      await nextTick();
      vm.toggleAddInput("blockedJurisdictions");
      await nextTick();

      expect(vm.activeAddInput).toBe("blockedJurisdictions");
      wrapper.unmount();
    });
  });

  // ── Accessibility: Teleport structure ────────────────────────────────────────

  describe("accessibility", () => {
    it("renders dialog with aria-modal=true", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute("aria-modal")).toBe("true");
      wrapper.unmount();
    });

    it("renders tablist with correct aria-label", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const tablist = document.body.querySelector('[role="tablist"]');
      expect(tablist?.getAttribute("aria-label")).toBe("Policy edit sections");
      wrapper.unmount();
    });
  });
});
