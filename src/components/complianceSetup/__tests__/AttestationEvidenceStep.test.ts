/**
 * Unit tests for AttestationEvidenceStep component
 * Verifies attestation form rendering, evidence dialog, and validation emission
 */

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import AttestationEvidenceStep from "../AttestationEvidenceStep.vue";
import type { AttestationEvidence } from "../../../types/complianceSetup";

const makeEvidence = (overrides: Partial<AttestationEvidence> = {}): AttestationEvidence => ({
  attestations: [],
  evidenceReferences: [],
  legalReviewDate: undefined,
  auditTrailStart: undefined,
  complianceManagerName: "",
  complianceManagerTitle: "",
  ...overrides,
} as AttestationEvidence);

describe("AttestationEvidenceStep", () => {
  it("renders without crashing with no modelValue", () => {
    const wrapper = mount(AttestationEvidenceStep);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders with a provided modelValue", () => {
    const wrapper = mount(AttestationEvidenceStep, {
      props: { modelValue: makeEvidence() },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("shows attestation section heading", () => {
    const wrapper = mount(AttestationEvidenceStep);
    const html = wrapper.html();
    expect(html).toMatch(/attestation|Attestation|evidence|Evidence/i);
  });

  it("shows legal review date section", () => {
    const wrapper = mount(AttestationEvidenceStep);
    const html = wrapper.html();
    expect(html).toMatch(/legal.review|Legal Review|legal counsel/i);
  });

  it("shows evidence references section", () => {
    const wrapper = mount(AttestationEvidenceStep);
    const html = wrapper.html();
    expect(html).toMatch(/evidence|Evidence/i);
  });

  it("shows 'Add Evidence' or similar button", () => {
    const wrapper = mount(AttestationEvidenceStep);
    const html = wrapper.html();
    expect(html).toMatch(/add evidence|Add Evidence|add.*reference/i);
  });

  it("emits validation-change on mount", async () => {
    const wrapper = mount(AttestationEvidenceStep, {
      props: { modelValue: makeEvidence() },
    });
    await nextTick();
    expect(wrapper.emitted("validation-change")).toBeDefined();
  });

  it("shows audit trail section", () => {
    const wrapper = mount(AttestationEvidenceStep);
    const html = wrapper.html();
    expect(html).toMatch(/audit trail|Audit Trail|audit/i);
  });

  it("renders form inputs for attestation data", () => {
    const wrapper = mount(AttestationEvidenceStep);
    const inputs = wrapper.findAll("input, textarea, select");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("shows compliance badge eligibility section", () => {
    const wrapper = mount(AttestationEvidenceStep);
    const html = wrapper.html();
    expect(html).toMatch(/badge|Badge|compliance/i);
  });

  it("shows 'Add Evidence' dialog trigger button", () => {
    const wrapper = mount(AttestationEvidenceStep);
    const buttons = wrapper.findAll("button");
    const addBtn = buttons.find((b) => b.text().match(/add evidence|Add Evidence/i));
    expect(addBtn).toBeDefined();
  });
});

