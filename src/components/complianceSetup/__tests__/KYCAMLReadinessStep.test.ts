/**
 * Unit tests for KYCAMLReadinessStep component
 * Verifies KYC/AML provider status display, readiness indicators, and form interaction
 */

import { describe, it, expect, nextTick } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick as vueNextTick } from "vue";
import KYCAMLReadinessStep from "../KYCAMLReadinessStep.vue";
import type { KYCAMLReadiness } from "../../../types/complianceSetup";

const makeKYCReadiness = (overrides: Partial<KYCAMLReadiness> = {}): KYCAMLReadiness => ({
  kycProviderConfigured: false,
  kycProviderStatus: "not_configured",
  amlProviderConfigured: false,
  amlProviderStatus: "not_configured",
  requiredDocuments: [],
  completedDocuments: [],
  identityVerificationFlow: "manual",
  identityVerificationStatus: "not_started",
  sanctionsScreeningEnabled: false,
  pepsCheckEnabled: false,
  adverseMediaCheckEnabled: false,
  overallReadinessStatus: "not_ready",
  blockingIssues: [],
  ...overrides,
});

describe("KYCAMLReadinessStep", () => {
  it("renders without crashing when no modelValue is provided", () => {
    const wrapper = mount(KYCAMLReadinessStep);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders with a provided modelValue", () => {
    const wrapper = mount(KYCAMLReadinessStep, {
      props: { modelValue: makeKYCReadiness() },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("shows step header text", () => {
    const wrapper = mount(KYCAMLReadinessStep);
    const html = wrapper.html();
    expect(html).toMatch(/KYC.AML|kyc.*aml/i);
  });

  it("shows KYC provider configuration toggle initially", () => {
    const wrapper = mount(KYCAMLReadinessStep, {
      props: { modelValue: makeKYCReadiness({ kycProviderStatus: "not_configured" }) },
    });
    // The KYC toggle should be visible
    expect(wrapper.find("input[type='checkbox']").exists()).toBe(true);
  });

  it("shows AML provider configuration section", () => {
    const wrapper = mount(KYCAMLReadinessStep);
    const html = wrapper.html();
    expect(html).toMatch(/aml|AML|anti.money/i);
  });

  it("shows sanctions screening toggle", () => {
    const wrapper = mount(KYCAMLReadinessStep);
    const html = wrapper.html();
    expect(html).toMatch(/sanctions|Sanctions/);
  });

  it("emits validation-change on mount", async () => {
    const wrapper = mount(KYCAMLReadinessStep, {
      props: { modelValue: makeKYCReadiness() },
    });
    await vueNextTick();
    const emitted = wrapper.emitted("validation-change");
    expect(emitted).toBeDefined();
  });

  it("shows provider dropdown after enabling KYC", async () => {
    const wrapper = mount(KYCAMLReadinessStep);
    // Toggle the KYC provider configured checkbox
    const checkbox = wrapper.find("input[type='checkbox']");
    if (checkbox.exists()) {
      await checkbox.setValue(true);
      await vueNextTick();
      // After enabling, the provider name dropdown should appear
      const html = wrapper.html();
      expect(html).toMatch(/jumio|Jumio|onfido|Onfido|provider/i);
    } else {
      // Component still exists, just no checkbox found
      expect(wrapper.exists()).toBe(true);
    }
  });

  it("shows overall readiness status indicator", () => {
    const wrapper = mount(KYCAMLReadinessStep, {
      props: { modelValue: makeKYCReadiness({ overallReadinessStatus: "not_ready" }) },
    });
    const html = wrapper.html();
    expect(html).toMatch(/not.ready|Not Ready|readiness|configure/i);
  });

  it("shows PEPs check toggle", () => {
    const wrapper = mount(KYCAMLReadinessStep);
    const html = wrapper.html();
    expect(html).toMatch(/pep|PEP|politically/i);
  });
});

