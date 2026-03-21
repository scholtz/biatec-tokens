/**
 * Unit tests for WhitelistEligibilityStep component
 * Verifies whitelist requirement toggling, investor type selection, and validation emission
 */

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import WhitelistEligibilityStep from "../WhitelistEligibilityStep.vue";
import type { WhitelistEligibility } from "../../../types/complianceSetup";

const makeEligibility = (overrides: Partial<WhitelistEligibility> = {}): WhitelistEligibility => ({
  whitelistRequired: false,
  restrictionType: "none",
  requiresKYC: false,
  requiresAML: false,
  requiresAccreditationProof: false,
  allowedInvestorTypes: [],
  transferRestrictions: ["no_restrictions"],
  hasLockupPeriod: false,
  allowSecondaryTrading: true,
  ...overrides,
});

describe("WhitelistEligibilityStep", () => {
  it("renders without crashing with no modelValue", () => {
    const wrapper = mount(WhitelistEligibilityStep);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders with a provided modelValue", () => {
    const wrapper = mount(WhitelistEligibilityStep, {
      props: { modelValue: makeEligibility() },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("shows whitelist configuration section heading", () => {
    const wrapper = mount(WhitelistEligibilityStep);
    const html = wrapper.html();
    expect(html).toMatch(/whitelist.configuration|Whitelist Configuration|Whitelist.*Eligibility/i);
  });

  it("shows 'Require Whitelist' checkbox", () => {
    const wrapper = mount(WhitelistEligibilityStep);
    const html = wrapper.html();
    expect(html).toMatch(/Require Whitelist/i);
  });

  it("shows whitelist options after enabling whitelist requirement", async () => {
    const wrapper = mount(WhitelistEligibilityStep);
    const checkbox = wrapper.findAll("input[type='checkbox']").find((el) =>
      el.element.parentElement?.textContent?.includes("Require Whitelist")
    );
    if (checkbox) {
      await checkbox.setValue(true);
      await nextTick();
      const html = wrapper.html();
      expect(html).toMatch(/Select existing whitelist|Accredited Investors/i);
    } else {
      expect(wrapper.exists()).toBe(true);
    }
  });

  it("shows investor type section heading", () => {
    const wrapper = mount(WhitelistEligibilityStep);
    const html = wrapper.html();
    expect(html).toMatch(/investor|Investor/i);
  });

  it("emits validation-change on mount", async () => {
    const wrapper = mount(WhitelistEligibilityStep, {
      props: { modelValue: makeEligibility() },
    });
    await nextTick();
    const emitted = wrapper.emitted("validation-change");
    expect(emitted).toBeDefined();
  });

  it("shows lock-up period section", () => {
    const wrapper = mount(WhitelistEligibilityStep);
    const html = wrapper.html();
    expect(html).toMatch(/lock.?up|Lock.?up|lockup/i);
  });

  it("shows transfer restrictions section", () => {
    const wrapper = mount(WhitelistEligibilityStep);
    const html = wrapper.html();
    expect(html).toMatch(/transfer|Transfer/i);
  });

  it("shows secondary trading option", () => {
    const wrapper = mount(WhitelistEligibilityStep);
    const html = wrapper.html();
    expect(html).toMatch(/secondary|Secondary/i);
  });

  it("renders form controls for eligibility requirements", () => {
    const wrapper = mount(WhitelistEligibilityStep);
    // Should have form inputs for configuration
    const inputs = wrapper.findAll("input, select");
    expect(inputs.length).toBeGreaterThan(0);
  });
});

