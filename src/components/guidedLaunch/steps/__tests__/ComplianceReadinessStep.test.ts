/**
 * Unit tests for ComplianceReadinessStep
 *
 * Validates that:
 * - Mandatory risk acknowledgement blocks step progression (AC3)
 * - MICA + missing legal review blocks progression (AC3)
 * - User-friendly guidance messages appear for missing requirements (AC3/AC4)
 * - Valid state allows completion (happy path)
 * - watch() correctly clears the acknowledgement error message (branch coverage)
 * - onMounted restores existing draft data including riskAcknowledged (backward compat)
 * - MICA + legal-review checked shows informational (not blocking) message
 *
 * Business value: Ensures non-crypto-native users are never blocked by cryptic errors
 * and always have a clear next action when compliance requirements are unmet.
 * Regression risk: Removing acknowledgement gate would allow unchecked deployment
 * requests, violating MICA and business-roadmap compliance-first requirements.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from '../../../../stores/guidedLaunch'
import ComplianceReadinessStep from '../ComplianceReadinessStep.vue'
import type { ComplianceReadiness } from '../../../../types/guidedLaunch'

// Minimal Button stub to avoid deep component rendering issues
const ButtonStub = {
  name: 'Button',
  template: '<button :disabled="disabled" :type="type"><slot /></button>',
  props: ['disabled', 'type', 'variant', 'size', 'fullWidth'],
}

const mountStep = () =>
  mount(ComplianceReadinessStep, {
    global: { stubs: { Button: ButtonStub } },
  })

describe('ComplianceReadinessStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders the compliance heading', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('Compliance Readiness')
  })

  it('shows acknowledgement checkbox on render with aria-describedby', () => {
    const wrapper = mountStep()
    const checkbox = wrapper.find('#risk-acknowledgement')
    expect(checkbox.exists()).toBe(true)
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    expect(checkbox.attributes('aria-describedby')).toBe('risk-acknowledgement-hint')
  })

  it('shows human-readable label text for the acknowledgement checkbox', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('I acknowledge the compliance requirements')
  })

  // ── AC3: Blocking gates ────────────────────────────────────────────────────

  it('continue button is disabled without acknowledgement (AC3)', () => {
    const wrapper = mountStep()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('continue button becomes enabled after acknowledgement is checked (AC3)', async () => {
    const wrapper = mountStep()
    const checkbox = wrapper.find('#risk-acknowledgement')
    await checkbox.setValue(true)
    await wrapper.vm.$nextTick()

    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('blocks proceed when MICA is enabled but legal review is not done (AC3)', async () => {
    const wrapper = mountStep()

    // Enable MICA without legal review
    const micaCheckbox = wrapper.find('input[type="checkbox"]')
    await micaCheckbox.setValue(true)
    await wrapper.vm.$nextTick()

    // Check acknowledgement
    const ackCheckbox = wrapper.find('#risk-acknowledgement')
    await ackCheckbox.setValue(true)
    await wrapper.vm.$nextTick()

    // Button should still be disabled (MICA requires legal review)
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('all four blocking conditions: riskAcknowledged=false, MICA=false → blocked (AC3)', () => {
    const wrapper = mountStep()
    // Default state: neither acknowledged nor MICA
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('riskAcknowledged=true, MICA=false → allowed (AC3)', async () => {
    const wrapper = mountStep()
    const ackCheckbox = wrapper.find('#risk-acknowledgement')
    await ackCheckbox.setValue(true)
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('riskAcknowledged=true, MICA=true, legalReview=false → blocked (AC3)', async () => {
    const wrapper = mountStep()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    // requiresMICA = index 0
    await checkboxes[0].setValue(true)
    await wrapper.find('#risk-acknowledgement').setValue(true)
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('riskAcknowledged=true, MICA=true, legalReview=true → allowed (AC3)', async () => {
    const wrapper = mountStep()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    // requiresMICA=0, hasLegalReview=3
    await checkboxes[0].setValue(true)
    await checkboxes[3].setValue(true)
    await wrapper.find('#risk-acknowledgement').setValue(true)
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  // ── AC4: User-friendly guidance ───────────────────────────────────────────

  it('does not emit complete when acknowledgement is missing (AC4)', async () => {
    const wrapper = mountStep()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('complete')).toBeFalsy()
  })

  it('shows acknowledgement error message after submit attempt without acknowledgement (AC4)', async () => {
    const wrapper = mountStep()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toMatch(/required|acknowledge/i)
  })

  it('acknowledgement error clears when user checks the checkbox (AC4, watch branch)', async () => {
    const wrapper = mountStep()
    // Trigger the error first
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    // Now check acknowledgement - watch() should clear the error
    await wrapper.find('#risk-acknowledgement').setValue(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows MICA action-required guidance when MICA enabled but legal review missing (AC4)', async () => {
    const wrapper = mountStep()
    const micaCheckbox = wrapper.find('input[type="checkbox"]')
    await micaCheckbox.setValue(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toMatch(/action required|legal review/i)
  })

  it('shows informational MICA message (not blocking text) when MICA + legal review both checked (AC4)', async () => {
    const wrapper = mountStep()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(true)  // requiresMICA
    await checkboxes[3].setValue(true)  // hasLegalReview
    await wrapper.vm.$nextTick()

    // "Action required" message should be gone; informational message should appear
    expect(wrapper.text()).not.toMatch(/action required/i)
    expect(wrapper.text()).toMatch(/legal review is confirmed|mica compliance/i)
  })

  // ── Happy path completions ────────────────────────────────────────────────

  it('emits complete with isValid=true when acknowledged and MICA not enabled', async () => {
    const wrapper = mountStep()
    await wrapper.find('#risk-acknowledgement').setValue(true)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('complete')
    expect(emitted).toBeTruthy()
    const validation = (emitted![0] as any[])[0] as { isValid: boolean; errors: string[] }
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('emits complete with isValid=true when MICA + legal review + acknowledged', async () => {
    const wrapper = mountStep()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(true)  // requiresMICA
    await checkboxes[3].setValue(true)  // hasLegalReview
    await wrapper.find('#risk-acknowledgement').setValue(true)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('complete')
    expect(emitted).toBeTruthy()
    const validation = (emitted![0] as any[])[0] as { isValid: boolean; errors: string[] }
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('emits complete with riskAcknowledged=true in update payload', async () => {
    const wrapper = mountStep()
    await wrapper.find('#risk-acknowledgement').setValue(true)
    await wrapper.vm.$nextTick()

    const updates = wrapper.emitted('update')
    expect(updates).toBeTruthy()
    const lastUpdate = updates![updates!.length - 1][0] as ComplianceReadiness
    expect(lastUpdate.riskAcknowledged).toBe(true)
  })

  // ── Backward compatibility (onMounted, existing drafts) ────────────────────

  it('loads existing compliance data from store including riskAcknowledged=true', async () => {
    const store = useGuidedLaunchStore()
    store.setComplianceReadiness({
      requiresMICA: false,
      requiresKYC: true,
      requiresAML: false,
      hasLegalReview: false,
      hasRiskAssessment: false,
      restrictedJurisdictions: [],
      whitelistRequired: false,
      riskAcknowledged: true,
    })

    const wrapper = mountStep()
    await wrapper.vm.$nextTick()

    // Continue button should be enabled because store has riskAcknowledged=true
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('loads existing compliance data without riskAcknowledged (old draft format, backward compat)', async () => {
    const store = useGuidedLaunchStore()
    // Simulate old draft without riskAcknowledged field
    const oldFormat: ComplianceReadiness = {
      requiresMICA: false,
      requiresKYC: false,
      requiresAML: false,
      hasLegalReview: false,
      hasRiskAssessment: false,
      restrictedJurisdictions: [],
      whitelistRequired: false,
      // riskAcknowledged intentionally absent (old draft)
    }
    store.setComplianceReadiness(oldFormat)

    const wrapper = mountStep()
    await wrapper.vm.$nextTick()

    // Should default to false (not crash), button should be disabled
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  // ── Reactivity: emits update ───────────────────────────────────────────────

  it('emits update when any checkbox changes', async () => {
    const wrapper = mountStep()
    const kycCheckbox = wrapper.findAll('input[type="checkbox"]')[1]
    await kycCheckbox.setValue(true)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update')).toBeTruthy()
  })

  it('emits update with riskAcknowledged=false when unchecked after checking', async () => {
    const wrapper = mountStep()
    const ackCheckbox = wrapper.find('#risk-acknowledgement')
    await ackCheckbox.setValue(true)
    await ackCheckbox.setValue(false)
    await wrapper.vm.$nextTick()

    const updates = wrapper.emitted('update')!
    const lastUpdate = updates[updates.length - 1][0] as ComplianceReadiness
    expect(lastUpdate.riskAcknowledged).toBe(false)
  })
})
