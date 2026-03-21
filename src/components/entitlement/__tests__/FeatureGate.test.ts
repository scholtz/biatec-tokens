/**
 * Unit tests for FeatureGate component
 * Verifies entitlement-based conditional rendering and upgrade prompt behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import FeatureGate from "../FeatureGate.vue";
import { EntitlementService } from "../../../services/EntitlementService";
import { FeatureFlag, SubscriptionTier } from "../../../types/entitlement";

// Stub child components to avoid deep mounting complexity
vi.mock("../../../components/ui/Button.vue", () => ({
  default: { template: '<button><slot /></button>' },
}));
vi.mock("../../../components/ui/Modal.vue", () => ({
  default: {
    props: ['show'],
    template: '<div v-if="show" class="modal"><slot name="header" /><slot name="body" /><slot name="footer" /></div>',
    emits: ['close'],
  },
}));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const makeService = (allowed: boolean) => {
  const svc = EntitlementService.getInstance();
  vi.spyOn(svc, "checkFeatureAccess").mockReturnValue({
    allowed,
    reason: allowed ? undefined : "Requires Professional plan",
    requiredTier: allowed ? undefined : SubscriptionTier.PRO,
  });
  vi.spyOn(svc, "getUpgradePrompt").mockReturnValue({
    title: "Upgrade to Pro",
    message: "Unlock advanced compliance features",
    features: ["KYC integration", "AML screening"],
    ctaText: "Upgrade Now",
    ctaLink: "/subscription",
    tier: SubscriptionTier.PRO,
  });
  return svc;
};

describe("FeatureGate", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders slot content when feature is allowed", () => {
    makeService(true);
    const wrapper = mount(FeatureGate, {
      props: { feature: FeatureFlag.COMPLIANCE_KYC },
      slots: { default: '<span data-testid="content">KYC Dashboard</span>' },
    });
    expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    expect(wrapper.find(".feature-gate__blocked").exists()).toBe(false);
  });

  it("shows blocked UI when feature is not allowed", () => {
    makeService(false);
    const wrapper = mount(FeatureGate, {
      props: { feature: FeatureFlag.COMPLIANCE_KYC },
      slots: { default: '<span data-testid="content">KYC Dashboard</span>' },
    });
    expect(wrapper.find('[data-testid="content"]').exists()).toBe(false);
    expect(wrapper.find(".feature-gate__blocked").exists()).toBe(true);
  });

  it("shows 'Feature Locked' heading in blocked state", () => {
    makeService(false);
    const wrapper = mount(FeatureGate, {
      props: { feature: FeatureFlag.COMPLIANCE_KYC },
    });
    expect(wrapper.text()).toContain("Feature Locked");
  });

  it("shows the access result reason when blocked", () => {
    makeService(false);
    const wrapper = mount(FeatureGate, {
      props: { feature: FeatureFlag.COMPLIANCE_KYC },
    });
    expect(wrapper.text()).toContain("Requires Professional plan");
  });

  it("shows fallbackMessage when no reason is provided", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "checkFeatureAccess").mockReturnValue({
      allowed: false,
      reason: undefined,
      requiredTier: SubscriptionTier.PRO,
    });
    vi.spyOn(svc, "getUpgradePrompt").mockReturnValue({
      title: "Upgrade",
      message: "Upgrade",
      features: [],
      ctaText: "Upgrade",
      ctaLink: "/subscription",
      tier: SubscriptionTier.PRO,
    });

    const wrapper = mount(FeatureGate, {
      props: {
        feature: FeatureFlag.COMPLIANCE_KYC,
        fallbackMessage: "Custom fallback text",
      },
    });
    expect(wrapper.text()).toContain("Custom fallback text");
  });

  it("hides upgrade prompt when showUpgradePrompt is false", () => {
    makeService(false);
    const wrapper = mount(FeatureGate, {
      props: { feature: FeatureFlag.COMPLIANCE_KYC, showUpgradePrompt: false },
    });
    expect(wrapper.find(".feature-gate__blocked").exists()).toBe(false);
    expect(wrapper.find(".feature-gate__simple-message").exists()).toBe(true);
  });

  it("opens upgrade modal when 'View Upgrade Options' is clicked", async () => {
    makeService(false);
    const wrapper = mount(FeatureGate, {
      props: { feature: FeatureFlag.COMPLIANCE_KYC },
    });
    const btn = wrapper.find("button");
    if (btn.exists()) await btn.trigger("click");
    // Modal existence is now determined by showModal
    expect(wrapper.find(".modal").exists()).toBe(true);
  });

  it("renders without slot content in blocked state", () => {
    makeService(false);
    const wrapper = mount(FeatureGate, {
      props: { feature: FeatureFlag.API_ACCESS },
    });
    expect(wrapper.find(".feature-gate").exists()).toBe(true);
  });

  it("checks feature access using the provided feature flag", () => {
    const svc = makeService(true);
    mount(FeatureGate, {
      props: { feature: FeatureFlag.BATCH_DEPLOYMENT },
    });
    expect(svc.checkFeatureAccess).toHaveBeenCalledWith(FeatureFlag.BATCH_DEPLOYMENT);
  });
});
