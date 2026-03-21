/**
 * Unit tests for UsageIndicator component
 * Verifies usage-against-limits display, progress bar, and upgrade prompts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import UsageIndicator from "../UsageIndicator.vue";
import { EntitlementService } from "../../../services/EntitlementService";
import { SubscriptionTier, FeatureFlag } from "../../../types/entitlement";
import type { Entitlement } from "../../../types/entitlement";

vi.mock("../../../components/ui/Badge.vue", () => ({
  default: {
    props: ["variant", "size"],
    template: '<span class="badge">{{ $slots.default?.()[0]?.children }}</span>',
  },
}));

const makeEntitlement = (override: Partial<Entitlement> = {}): Entitlement => ({
  tier: SubscriptionTier.PRO,
  features: [FeatureFlag.COMPLIANCE_KYC],
  limits: {
    tokensPerMonth: 100,
    deploymentPerDay: 50,
    whitelistAddresses: 5000,
    attestationsPerMonth: 200,
    apiCallsPerDay: 10000,
  },
  usage: {
    tokensThisMonth: 20,
    deploymentsToday: 5,
    whitelistAddresses: 500,
    attestationsThisMonth: 40,
    apiCallsToday: 2000,
    periodStart: new Date(),
    periodEnd: new Date(),
  },
  isActive: true,
  expiresAt: null,
  ...override,
});

describe("UsageIndicator", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders label correctly", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(makeEntitlement());

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens This Month" },
    });
    expect(wrapper.text()).toContain("Tokens This Month");
  });

  it("displays current / limit usage text", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(makeEntitlement());

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    expect(wrapper.text()).toContain("20 / 100");
  });

  it("shows 'Unlimited' badge when limit is null", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ limits: { tokensPerMonth: null, deploymentPerDay: 10, whitelistAddresses: 100, attestationsPerMonth: 50, apiCallsPerDay: 500 } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    expect(wrapper.text()).toContain("Unlimited");
    expect(wrapper.find(".usage-indicator__progress").exists()).toBe(false);
  });

  it("hides progress bar when unlimited", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ limits: { tokensPerMonth: null, deploymentPerDay: 10, whitelistAddresses: 100, attestationsPerMonth: 50, apiCallsPerDay: 500 } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    expect(wrapper.find(".usage-indicator__progress").exists()).toBe(false);
  });

  it("shows progress bar for limited resource", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(makeEntitlement());

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    expect(wrapper.find(".usage-indicator__progress").exists()).toBe(true);
  });

  it("applies green bar class when usage is below 80%", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ usage: { tokensThisMonth: 20, deploymentsToday: 0, whitelistAddresses: 0, attestationsThisMonth: 0, apiCallsToday: 0, periodStart: new Date(), periodEnd: new Date() } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    // 20/100 = 20%, should be green
    expect(wrapper.find(".usage-indicator__progress-bar--green").exists()).toBe(true);
  });

  it("applies yellow bar class when usage is 80-99%", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ usage: { tokensThisMonth: 85, deploymentsToday: 0, whitelistAddresses: 0, attestationsThisMonth: 0, apiCallsToday: 0, periodStart: new Date(), periodEnd: new Date() } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    // 85/100 = 85%, should be yellow
    expect(wrapper.find(".usage-indicator__progress-bar--yellow").exists()).toBe(true);
  });

  it("applies red bar class when usage is at 100%", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ usage: { tokensThisMonth: 100, deploymentsToday: 0, whitelistAddresses: 0, attestationsThisMonth: 0, apiCallsToday: 0, periodStart: new Date(), periodEnd: new Date() } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    // 100/100 = 100%, should be red
    expect(wrapper.find(".usage-indicator__progress-bar--red").exists()).toBe(true);
  });

  it("shows 'Limit Reached' badge at 100% usage", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ usage: { tokensThisMonth: 100, deploymentsToday: 0, whitelistAddresses: 0, attestationsThisMonth: 0, apiCallsToday: 0, periodStart: new Date(), periodEnd: new Date() } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    expect(wrapper.text()).toContain("Limit Reached");
  });

  it("shows near-limit warning message when approaching limit", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ usage: { tokensThisMonth: 90, deploymentsToday: 0, whitelistAddresses: 0, attestationsThisMonth: 0, apiCallsToday: 0, periodStart: new Date(), periodEnd: new Date() } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    expect(wrapper.find(".usage-indicator__info").exists()).toBe(true);
  });

  it("shows 'at limit' warning message when fully consumed", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ usage: { tokensThisMonth: 100, deploymentsToday: 0, whitelistAddresses: 0, attestationsThisMonth: 0, apiCallsToday: 0, periodStart: new Date(), periodEnd: new Date() } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    expect(wrapper.find(".usage-indicator__warning").exists()).toBe(true);
  });

  it("emits upgrade event when upgrade link is clicked at limit", async () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ usage: { tokensThisMonth: 100, deploymentsToday: 0, whitelistAddresses: 0, attestationsThisMonth: 0, apiCallsToday: 0, periodStart: new Date(), periodEnd: new Date() } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });

    await wrapper.find(".usage-indicator__upgrade-link").trigger("click");
    expect(wrapper.emitted("upgrade")).toBeDefined();
    expect(wrapper.emitted("upgrade")!.length).toBe(1);
  });

  it("hides warning and info sections when showUpgradePrompt is false", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(
      makeEntitlement({ usage: { tokensThisMonth: 100, deploymentsToday: 0, whitelistAddresses: 0, attestationsThisMonth: 0, apiCallsToday: 0, periodStart: new Date(), periodEnd: new Date() } })
    );

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens", showUpgradePrompt: false },
    });
    expect(wrapper.find(".usage-indicator__warning").exists()).toBe(false);
    expect(wrapper.find(".usage-indicator__info").exists()).toBe(false);
  });

  it("handles null entitlement gracefully", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(null);

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "tokensPerMonth", label: "Tokens" },
    });
    // Should render without crashing
    expect(wrapper.find(".usage-indicator").exists()).toBe(true);
    expect(wrapper.text()).toContain("0 /");
  });

  it("tracks deploymentPerDay correctly", () => {
    const svc = EntitlementService.getInstance();
    vi.spyOn(svc, "getEntitlement").mockReturnValue(makeEntitlement());

    const wrapper = mount(UsageIndicator, {
      props: { limitKey: "deploymentPerDay", label: "Deployments Today" },
    });
    // 5 / 50
    expect(wrapper.text()).toContain("5 / 50");
  });
});
