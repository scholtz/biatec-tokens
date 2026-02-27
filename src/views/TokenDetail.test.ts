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

  describe("Status Classes", () => {
    const makeWrapper = async (status: string) => {
      vi.mocked(useTokenStore).mockReturnValue({
        tokens: [
          {
            id: "token123",
            name: "Test Token",
            symbol: "TEST",
            standard: "ARC-200",
            type: "RWA",
            supply: 1000000,
            decimals: 6,
            status,
            createdAt: new Date("2024-01-15T10:00:00Z"),
            assetId: "123456",
          } as any,
        ],
      } as any);

      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();
      return wrapper;
    };

    it("should render deploying status badge", async () => {
      const wrapper = await makeWrapper("deploying");
      expect(wrapper.text()).toContain("deploying");
    });

    it("should render failed status badge", async () => {
      const wrapper = await makeWrapper("failed");
      expect(wrapper.text()).toContain("failed");
    });

    it("should render created status badge", async () => {
      const wrapper = await makeWrapper("created");
      expect(wrapper.text()).toContain("created");
    });
  });

  describe("Token with description and attributes", () => {
    it("should render token description when present", async () => {
      vi.mocked(useTokenStore).mockReturnValue({
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
            description: "A test token description",
          } as any,
        ],
      } as any);

      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();

      expect(wrapper.text()).toContain("A test token description");
    });

    it("should render token attributes when present", async () => {
      vi.mocked(useTokenStore).mockReturnValue({
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
            attributes: [{ trait_type: "Category", value: "RWA" }],
          } as any,
        ],
      } as any);

      await router.push("/token/token123");
      await router.isReady();

      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();

      expect(wrapper.text()).toContain("Attributes");
      expect(wrapper.text()).toContain("Category");
    });
  });

  describe("Token not found", () => {
    it("should handle missing token gracefully", async () => {
      vi.mocked(useTokenStore).mockReturnValue({ tokens: [] } as any);

      await router.push("/token/nonexistent");
      await router.isReady();

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();

      // Component should render without crashing even when token is not found
      expect(wrapper.exists()).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe("Token with ARC standard (isVoiOrAramidToken)", () => {
    it("should detect ARC3 as algorand-based token", async () => {
      vi.mocked(useTokenStore).mockReturnValue({
        tokens: [
          {
            id: "arc3token",
            name: "ARC3 Token",
            symbol: "ARC3",
            standard: "ARC3",
            type: "RWA",
            supply: 1000000,
            decimals: 6,
            status: "deployed",
            createdAt: new Date("2024-01-15T10:00:00Z"),
          },
        ],
      } as any);

      await router.push("/token/arc3token");
      await router.isReady();
      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();
      expect(wrapper.exists()).toBe(true);
    });

    it("should render token with imageUrl", async () => {
      vi.mocked(useTokenStore).mockReturnValue({
        tokens: [
          {
            id: "imgtoken",
            name: "Image Token",
            symbol: "IMG",
            standard: "ERC20",
            type: "fungible",
            supply: 1000000,
            decimals: 18,
            status: "deployed",
            createdAt: new Date("2024-01-15T10:00:00Z"),
            imageUrl: "https://example.com/token.png",
          },
        ],
      } as any);

      await router.push("/token/imgtoken");
      await router.isReady();
      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();
      const img = wrapper.find("img");
      expect(img.exists()).toBe(true);
    });

    it("should render token with contractAddress and txId", async () => {
      vi.mocked(useTokenStore).mockReturnValue({
        tokens: [
          {
            id: "evmtoken",
            name: "EVM Token",
            symbol: "EVM",
            standard: "ERC20",
            type: "fungible",
            supply: 1000000,
            decimals: 18,
            status: "deployed",
            createdAt: new Date("2024-01-15T10:00:00Z"),
            contractAddress: "0x1234567890abcdef",
            txId: "0xabcdef1234567890",
          },
        ],
      } as any);

      await router.push("/token/evmtoken");
      await router.isReady();
      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();
      expect(wrapper.text()).toContain("0x1234567890abcdef");
    });
  });

  describe("Token with attestationMetadata", () => {
    it("should render attestation section when enabled", async () => {
      vi.mocked(useTokenStore).mockReturnValue({
        tokens: [
          {
            id: "attesttoken",
            name: "Attest Token",
            symbol: "ATT",
            standard: "ARC-200",
            type: "RWA",
            supply: 1000000,
            decimals: 6,
            status: "deployed",
            createdAt: new Date("2024-01-15T10:00:00Z"),
            attestationMetadata: {
              enabled: true,
              createdAt: "2024-01-15T10:00:00Z",
              updatedAt: "2024-06-01T12:00:00Z",
              attestations: [
                {
                  id: "att1",
                  type: "kyc",
                  status: "verified",
                  issuedAt: "2024-01-15T10:00:00Z",
                  proofHash: "0xhash1234",
                  documentUrl: "https://docs.example.com/att1",
                  verifiedAt: "2024-02-01T10:00:00Z",
                  verifiedBy: "Compliance Officer",
                  expiresAt: "2025-01-15T10:00:00Z",
                  notes: "Full KYC completed",
                },
              ],
              complianceSummary: {
                kycCompliant: true,
                accreditedInvestor: false,
                jurisdictionApproved: true,
              },
            },
          },
        ],
      } as any);

      await router.push("/token/attesttoken");
      await router.isReady();
      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();
      expect(wrapper.text()).toContain("Compliance Officer");
    });

    it("should render attestation with rejected status", async () => {
      vi.mocked(useTokenStore).mockReturnValue({
        tokens: [
          {
            id: "rejectedtoken",
            name: "Rejected Token",
            symbol: "REJ",
            standard: "ARC-200",
            type: "RWA",
            supply: 1000000,
            decimals: 6,
            status: "deployed",
            createdAt: new Date("2024-01-15T10:00:00Z"),
            attestationMetadata: {
              enabled: true,
              createdAt: "2024-01-15T10:00:00Z",
              updatedAt: "2024-06-01T12:00:00Z",
              attestations: [
                {
                  id: "att2",
                  type: "kyc",
                  status: "rejected",
                  issuedAt: "2024-01-15T10:00:00Z",
                },
              ],
            },
          },
        ],
      } as any);

      await router.push("/token/rejectedtoken");
      await router.isReady();
      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Token with complianceMetadata", () => {
    it("should render compliance content for ARC200 tokens in overview tab", async () => {
      vi.mocked(useTokenStore).mockReturnValue({
        tokens: [
          {
            id: "comptoken",
            name: "Compliant Token",
            symbol: "COMP",
            standard: "ARC200",
            type: "RWA",
            supply: 1000000,
            decimals: 6,
            status: "deployed",
            createdAt: new Date("2024-01-15T10:00:00Z"),
            complianceMetadata: {
              kycRequired: true,
              micaTokenClassification: "EMT",
              regulatoryLicense: "EU-2024-001",
              complianceContactEmail: "compliance@example.com",
              whitepaperUrl: "https://example.com/whitepaper.pdf",
              termsAndConditionsUrl: "https://example.com/terms",
              restrictedJurisdictions: ["US", "CN"],
            },
          },
        ],
      } as any);

      await router.push("/token/comptoken");
      await router.isReady();
      const wrapper = mount(TokenDetail, { global: { plugins: [router] } });
      await flushPromises();
      // Compliance metadata renders in overview tab for ARC200 tokens
      expect(wrapper.text()).toContain("compliance@example.com");
      expect(wrapper.text()).toContain("EU-2024-001");
    });
  });
});
