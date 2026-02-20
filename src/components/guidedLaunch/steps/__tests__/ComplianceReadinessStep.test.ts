/**
 * Unit tests for ComplianceReadinessStep
 *
 * Validates that:
 * - Mandatory risk acknowledgement blocks step progression (AC3)
 * - MICA + missing legal review blocks progression (AC3)
 * - User-friendly guidance messages appear for missing requirements (AC3/AC4)
 * - Valid state allows completion (happy path)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ComplianceReadinessStep from '../ComplianceReadinessStep.vue'

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

  it('renders the compliance heading', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('Compliance Readiness')
  })

  it('shows acknowledgement checkbox on render', () => {
    const wrapper = mountStep()
    const checkbox = wrapper.find('#risk-acknowledgement')
    expect(checkbox.exists()).toBe(true)
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
  })

  it('continue button is disabled without acknowledgement', () => {
    const wrapper = mountStep()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('continue button becomes enabled after acknowledgement is checked', async () => {
    const wrapper = mountStep()
    const checkbox = wrapper.find('#risk-acknowledgement')
    await checkbox.setValue(true)
    await wrapper.vm.$nextTick()

    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('does not emit complete when acknowledgement is missing', async () => {
    const wrapper = mountStep()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('complete')).toBeFalsy()
  })

  it('shows acknowledgement error message after submit attempt without acknowledgement', async () => {
    const wrapper = mountStep()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    // Should show the error alert
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toMatch(/required|acknowledge/i)
  })

  it('emits complete with isValid=true when acknowledged and MICA not enabled', async () => {
    const wrapper = mountStep()
    const checkbox = wrapper.find('#risk-acknowledgement')
    await checkbox.setValue(true)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('complete')
    expect(emitted).toBeTruthy()
    const [validation] = emitted![0] as [{ isValid: boolean; errors: string[] }][]
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('blocks proceed when MICA is enabled but legal review is not done', async () => {
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

  it('shows MICA guidance when MICA enabled but legal review missing', async () => {
    const wrapper = mountStep()

    // Enable MICA without legal review
    const micaCheckbox = wrapper.find('input[type="checkbox"]')
    await micaCheckbox.setValue(true)
    await wrapper.vm.$nextTick()

    // Guidance should mention legal review action
    expect(wrapper.text()).toMatch(/action required|legal review/i)
  })

  it('emits complete with isValid=true when MICA + legal review + acknowledged', async () => {
    const wrapper = mountStep()

    // Get all checkboxes
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    // requiresMICA is first, hasLegalReview is fourth (index 3)
    const micaCheckbox = checkboxes[0]
    const legalReviewCheckbox = checkboxes[3]
    const ackCheckbox = wrapper.find('#risk-acknowledgement')

    await micaCheckbox.setValue(true)
    await legalReviewCheckbox.setValue(true)
    await ackCheckbox.setValue(true)
    await wrapper.vm.$nextTick()

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('complete')
    expect(emitted).toBeTruthy()
    const [validation] = emitted![0] as [{ isValid: boolean; errors: string[] }][]
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('emits update when any checkbox changes', async () => {
    const wrapper = mountStep()
    const kycCheckbox = wrapper.findAll('input[type="checkbox"]')[1]
    await kycCheckbox.setValue(true)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update')).toBeTruthy()
  })
})
