import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import TokenDetail from "./TokenDetail.vue";
import { useTokenStore } from "../stores/tokens";

// Mock the token store
vi.mock("../stores/tokens", () => ({
  useTokenStore: vi.fn(() => ({
    tokens: [
      {
        id: "token123",
        name: "Test Token",
        symbol: "TEST",
        standard: "ARC-200",
        type: "RWA",
        supply: 1000000,
        decimals: 6,
        status: "deployed",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        assetId: "123456",
      },
    ],
  })),
}));

// Mock child components
vi.mock("../components/WhitelistManagement.vue", () => ({
  default: { name: "WhitelistManagement", template: "<div>WhitelistManagement</div>" },
}));

vi.mock("../components/ComplianceChecklist.vue", () => ({
  default: { name: "ComplianceChecklist", template: "<div>ComplianceChecklist</div>" },
}));

vi.mock("../components/AuditLogViewer.vue", () => ({
  default: { name: "AuditLogViewer", template: "<div>AuditLogViewer</div>" },
}));

vi.mock("../layout/MainLayout.vue", () => ({
  default: {
    name: "MainLayout",
    template: "<div><slot /></div>",
  },
}));

describe("TokenDetail", () => {
  let router: any;

  beforeEach(() => {
    vi.clearAllMocks();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/token/:id",
          name: "TokenDetail",
          component: TokenDetail,
        },
      ],
    });
  });

  describe("Component Rendering", () => {
    it("should render the component", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find("h1").text()).toContain("Test Token");
    });

    it("should render all tabs including Audit Trail", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabButtons = wrapper.findAll("button").filter((btn) => btn.classes().includes("border-b-2"));

      // Check that all 4 tabs are present
      expect(tabButtons.length).toBe(4);

      // Check tab labels
      const tabTexts = tabButtons.map((btn) => btn.text());
      expect(tabTexts).toContain("Overview");
      expect(tabTexts).toContain("Whitelist");
      expect(tabTexts).toContain("Compliance");
      expect(tabTexts).toContain("Audit Trail");
    });

    it("should display Overview tab by default", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Check that token details are shown (Overview content)
      expect(wrapper.text()).toContain("Token Details");
      expect(wrapper.text()).toContain("Total Supply");
    });
  });

  describe("Tab Navigation", () => {
    it("should switch to Whitelist tab when clicked", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabButtons = wrapper.findAll("button").filter((btn) => btn.classes().includes("border-b-2"));
      const whitelistTab = tabButtons.find((btn) => btn.text().includes("Whitelist"));

      if (whitelistTab) {
        await whitelistTab.trigger("click");
        await flushPromises();

        expect(wrapper.text()).toContain("WhitelistManagement");
      }
    });

    it("should switch to Compliance tab when clicked", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabButtons = wrapper.findAll("button").filter((btn) => btn.classes().includes("border-b-2"));
      const complianceTab = tabButtons.find((btn) => btn.text().includes("Compliance"));

      if (complianceTab) {
        await complianceTab.trigger("click");
        await flushPromises();

        expect(wrapper.text()).toContain("ComplianceChecklist");
      }
    });

    it("should switch to Audit Trail tab when clicked", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabButtons = wrapper.findAll("button").filter((btn) => btn.classes().includes("border-b-2"));
      const auditTab = tabButtons.find((btn) => btn.text().includes("Audit Trail"));

      if (auditTab) {
        await auditTab.trigger("click");
        await flushPromises();

        expect(wrapper.text()).toContain("AuditLogViewer");
      }
    });

    it("should highlight active tab correctly", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabButtons = wrapper.findAll("button").filter((btn) => btn.classes().includes("border-b-2"));
      const auditTab = tabButtons.find((btn) => btn.text().includes("Audit Trail"));

      if (auditTab) {
        await auditTab.trigger("click");
        await flushPromises();

        // Check that the audit tab has the active class
        expect(auditTab.classes()).toContain("border-biatec-accent");
      }
    });
  });

  describe("Token Data Display", () => {
    it("should display token information correctly", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain("Test Token");
      expect(wrapper.text()).toContain("TEST");
      expect(wrapper.text()).toContain("ARC-200");
      expect(wrapper.text()).toContain("1,000,000");
    });

    it("should display deployed status badge", async () => {
      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain("deployed");
    });
  });
});
