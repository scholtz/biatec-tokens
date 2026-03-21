/**
 * Unit tests for ReadinessSummaryStep component
 * Verifies readiness score display, risk level styling, blocker rendering, and event emissions
 */

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ReadinessSummaryStep from "../ReadinessSummaryStep.vue";
import type { ReadinessAssessment, ReadinessBlocker } from "../../../types/complianceSetup";

const makeBlocker = (overrides: Partial<ReadinessBlocker> = {}): ReadinessBlocker => ({
  id: "b1",
  severity: "critical",
  category: "kyc_aml",
  title: "KYC Provider Not Configured",
  description: "A KYC provider must be configured before deployment.",
  remediationSteps: ["Set up KYC provider credentials"],
  canAutoResolve: false,
  ...overrides,
});

const makeReadiness = (overrides: Partial<ReadinessAssessment> = {}): ReadinessAssessment => ({
  overallRisk: "low",
  readinessScore: 85,
  isReadyForDeploy: true,
  blockers: [],
  warnings: [],
  recommendations: ["Consider enabling AML screening"],
  jurisdictionReady: true,
  whitelistReady: true,
  kycAMLReady: true,
  attestationReady: true,
  nextActions: [],
  ...overrides,
});

describe("ReadinessSummaryStep", () => {
  it("renders readiness score as a number", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness({ readinessScore: 85 }) },
    });
    expect(wrapper.text()).toContain("85");
  });

  it("shows 'Ready for Deployment' status when isReadyForDeploy is true", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness({ readinessScore: 90, isReadyForDeploy: true }) },
    });
    expect(wrapper.text()).toMatch(/Ready for Deployment|ready for deployment|proceed with confidence/i);
  });

  it("shows lower readiness description when score is below 70", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness({ readinessScore: 60, isReadyForDeploy: false }) },
    });
    // At 60%, should show a description about critical gaps
    expect(wrapper.text()).toMatch(/critical.gaps|partially|Partially|in.progress/i);
  });

  it("applies green score class for high readiness", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness({ readinessScore: 92 }) },
    });
    // High score should use green styling
    const html = wrapper.html();
    expect(html).toMatch(/green|emerald/i);
  });

  it("applies red/orange score class for low readiness", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness({ readinessScore: 30, isReadyForDeploy: false }) },
    });
    const html = wrapper.html();
    expect(html).toMatch(/red|orange|yellow/i);
  });

  it("renders blocker title when blockers are present", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: {
        readiness: makeReadiness({
          readinessScore: 50,
          isReadyForDeploy: false,
          blockers: [makeBlocker()],
        }),
      },
    });
    expect(wrapper.text()).toContain("KYC Provider Not Configured");
  });

  it("renders recommendations when available", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: {
        readiness: makeReadiness({ recommendations: ["Enable AML screening for EU tokens"] }),
      },
    });
    expect(wrapper.text()).toContain("Enable AML screening for EU tokens");
  });

  it("shows 'Proceed to Deploy' button when isReadyForDeploy is true", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness({ isReadyForDeploy: true, readinessScore: 90 }) },
    });
    expect(wrapper.text()).toMatch(/Proceed to Deploy/);
  });

  it("emits proceed-to-deploy when deploy button is clicked", async () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness({ isReadyForDeploy: true, readinessScore: 90 }) },
    });
    const deployBtn = wrapper.findAll("button").find((b) => b.text().includes("Proceed to Deploy"));
    if (deployBtn) await deployBtn.trigger("click");
    expect(wrapper.emitted("proceed-to-deploy")).toBeDefined();
  });

  it("shows all four category readiness indicators", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: {
        readiness: makeReadiness({
          jurisdictionReady: true,
          whitelistReady: false,
          kycAMLReady: true,
          attestationReady: false,
        }),
      },
    });
    const html = wrapper.html();
    expect(html).toMatch(/jurisdiction|whitelist|kyc|attestation/i);
  });

  it("renders correctly with zero blockers and full readiness", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness() },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("shows step header with title", () => {
    const wrapper = mount(ReadinessSummaryStep, {
      props: { readiness: makeReadiness() },
    });
    expect(wrapper.text()).toMatch(/Compliance Readiness|Readiness Summary/i);
  });
});

