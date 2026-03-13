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
  restrictedJurisdictions: [],
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

function mountPanel(props: { visible?: boolean } = {}) {
  return mount(PolicyEditPanel, {
    props: { policy: MOCK_POLICY, visible: props.visible ?? true },
    attachTo: document.body,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            whitelistPolicy: { isSaving: false },
          },
        }),
      ],
    },
  });
}

describe("PolicyEditPanel", () => {
  beforeEach(() => {
    // Clean up any Teleport content
    document.body.innerHTML = "";
  });

  // ── Visibility ────────────────────────────────────────────────────────────────

  describe("visibility", () => {
    it("renders panel content when visible=true", async () => {
      const wrapper = mountPanel({ visible: true });
      await nextTick();
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    });

    it("does not render panel content when visible=false", async () => {
      const wrapper = mountPanel({ visible: false });
      await nextTick();
      expect(document.body.querySelector('[role="dialog"]')).toBeNull();
      wrapper.unmount();
    });

    it("shows Edit Whitelist Policy heading", async () => {
      const wrapper = mountPanel({ visible: true });
      await nextTick();
      expect(document.body.textContent).toContain("Edit Whitelist Policy");
      wrapper.unmount();
    });
  });

  // ── Tabs ──────────────────────────────────────────────────────────────────────

  describe("tab navigation", () => {
    it("shows Jurisdictions tab by default", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const tab = document.body.querySelector('[role="tab"][aria-selected="true"]');
      expect(tab?.textContent?.trim()).toBe("Jurisdictions");
      wrapper.unmount();
    });

    it("shows tab buttons for all three sections", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const tabs = document.body.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(3);
      wrapper.unmount();
    });

    it("switches to Investor Categories tab on click", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const tabs = document.body.querySelectorAll('[role="tab"]');
      const catTab = Array.from(tabs).find((t) => t.textContent?.includes("Investor"));
      (catTab as HTMLElement)?.click();
      await nextTick();
      expect(catTab?.getAttribute("aria-selected")).toBe("true");
      wrapper.unmount();
    });

    it("switches to Settings tab on click", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const tabs = document.body.querySelectorAll('[role="tab"]');
      const settingsTab = Array.from(tabs).find((t) => t.textContent?.includes("Settings"));
      (settingsTab as HTMLElement)?.click();
      await nextTick();
      expect(settingsTab?.getAttribute("aria-selected")).toBe("true");
      wrapper.unmount();
    });
  });

  // ── Jurisdictions ─────────────────────────────────────────────────────────────

  describe("jurisdictions panel", () => {
    it("shows Slovakia chip in allowed list", async () => {
      const wrapper = mountPanel();
      await nextTick();
      expect(document.body.textContent).toContain("Slovakia");
      wrapper.unmount();
    });

    it("shows United States chip in blocked list", async () => {
      const wrapper = mountPanel();
      await nextTick();
      expect(document.body.textContent).toContain("United States");
      wrapper.unmount();
    });

    it("shows 'Add country' button for each list", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const addBtns = document.body.querySelectorAll(
        '[aria-label^="Add country to"]'
      );
      expect(addBtns.length).toBe(3);
      wrapper.unmount();
    });

    it("shows add input when Add country is clicked", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const addBtn = document.body.querySelector('[aria-label="Add country to Allowed"]') as HTMLElement;
      addBtn?.click();
      await nextTick();
      expect(document.body.querySelector('input[placeholder="Search country…"]')).not.toBeNull();
      wrapper.unmount();
    });
  });

  // ── Contradiction warnings ────────────────────────────────────────────────────

  describe("contradiction detection", () => {
    it("shows contradiction warning when country in multiple lists", async () => {
      const policyWithConflict: WhitelistPolicy = {
        ...MOCK_POLICY,
        // SK is in both allowed and blocked
        blockedJurisdictions: [
          { code: "SK", name: "Slovakia" },
          { code: "US", name: "United States" },
        ],
      };
      const wrapper = mount(PolicyEditPanel, {
        props: { policy: policyWithConflict, visible: true },
        attachTo: document.body,
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn, initialState: { whitelistPolicy: { isSaving: false } } })],
        },
      });
      await nextTick();
      expect(document.body.textContent).toContain("Contradiction detected");
      wrapper.unmount();
    });
  });

  // ── Preview step ──────────────────────────────────────────────────────────────

  describe("preview step", () => {
    it("shows Preview Changes button in footer", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const previewBtn = document.body.querySelector('[aria-label="Preview changes"]') as HTMLElement;
      expect(previewBtn).not.toBeNull();
      wrapper.unmount();
    });

    it("shows preview panel on Preview Changes click", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const previewBtn = document.body.querySelector('[aria-label="Preview changes"]') as HTMLElement;
      previewBtn?.click();
      await nextTick();
      expect(document.body.textContent).toContain("Preview Changes");
      expect(document.body.textContent).toContain("Save Policy");
      wrapper.unmount();
    });

    it("goes back from preview on Back button click", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const previewBtn = document.body.querySelector('[aria-label="Preview changes"]') as HTMLElement;
      previewBtn?.click();
      await nextTick();
      const backBtn = Array.from(document.body.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Back"
      ) as HTMLElement;
      backBtn?.click();
      await nextTick();
      // Preview panel gone, main editing resumed
      expect(document.body.querySelector('[aria-label="Preview changes"]')).not.toBeNull();
      wrapper.unmount();
    });
  });

  // ── Cancel ────────────────────────────────────────────────────────────────────

  describe("cancel", () => {
    it("emits close event on Cancel click", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const cancelBtn = document.body.querySelector('[aria-label="Cancel editing"]') as HTMLElement;
      cancelBtn?.click();
      await nextTick();
      expect(wrapper.emitted("close")).toBeTruthy();
      wrapper.unmount();
    });

    it("emits close event on X button click", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const closeBtn = document.body.querySelector('[aria-label="Close edit panel"]') as HTMLElement;
      closeBtn?.click();
      await nextTick();
      expect(wrapper.emitted("close")).toBeTruthy();
      wrapper.unmount();
    });

    it("calls store.cancelEdit on close", async () => {
      const wrapper = mountPanel();
      const store = useWhitelistPolicyStore();
      await nextTick();
      const cancelBtn = document.body.querySelector('[aria-label="Cancel editing"]') as HTMLElement;
      cancelBtn?.click();
      await nextTick();
      expect(store.cancelEdit).toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  // ── Save ──────────────────────────────────────────────────────────────────────

  describe("save flow", () => {
    it("Save Policy button is present in preview step", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const previewBtn = document.body.querySelector('[aria-label="Preview changes"]') as HTMLElement;
      previewBtn?.click();
      await nextTick();
      const saveBtn = document.body.querySelector('[aria-label="Save policy"]');
      expect(saveBtn).not.toBeNull();
      wrapper.unmount();
    });

    it("Save button disabled while isSaving", async () => {
      const wrapper = mount(PolicyEditPanel, {
        props: { policy: MOCK_POLICY, visible: true },
        attachTo: document.body,
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn, initialState: { whitelistPolicy: { isSaving: true } } })],
        },
      });
      await nextTick();
      const previewBtn = document.body.querySelector('[aria-label="Preview changes"]') as HTMLElement;
      previewBtn?.click();
      await nextTick();
      const saveBtn = document.body.querySelector('[aria-label="Save policy"]') as HTMLButtonElement;
      expect(saveBtn?.disabled).toBe(true);
      wrapper.unmount();
    });
  });
});
