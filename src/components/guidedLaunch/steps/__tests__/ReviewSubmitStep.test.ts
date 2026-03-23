/**
 * Unit tests for ReviewSubmitStep
 *
 * Validates that:
 * - Heading and Readiness Score section are rendered
 * - canSubmit is false when blockers present or risk not acknowledged
 * - canSubmit is true when no blockers AND risk acknowledged
 * - handleSubmit emits 'submit' only when canSubmit is true
 * - Blockers list is shown when readinessScore has blockers
 * - Warnings list is shown when readinessScore has warnings
 *
 * Business value: The ReviewSubmitStep is the final gate before token launch.
 * Correct validation ensures users cannot submit without acknowledging risks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReviewSubmitStep from '../ReviewSubmitStep.vue'

const CardStub = { name: 'Card', template: '<div><slot /></div>', props: ['variant', 'padding'] }
const BadgeStub = { name: 'Badge', template: '<span><slot /></span>', props: ['variant', 'size'] }
const ButtonStub = {
  name: 'Button',
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  props: ['disabled', 'variant', 'size', 'fullWidth', 'full-width'],
  emits: ['click'],
}
const TransactionPreviewPanelStub = {
  name: 'TransactionPreviewPanel',
  template: '<div data-testid="tx-preview"><slot /></div>',
  props: ['acknowledged', 'tokenName', 'tokenStandard', 'network', 'totalSupply', 'decimals', 'managementAddress'],
  emits: ['update:acknowledged'],
  methods: { validate: () => true },
}

const makeReadinessScore = (overrides = {}) => ({
  overallScore: 100,
  requiredStepsComplete: 5,
  totalRequiredSteps: 5,
  blockers: [] as string[],
  warnings: [] as string[],
  ...overrides,
})

const makeFormData = () => ({
  organizationProfile: null,
  tokenIntent: null,
  selectedTemplate: null,
  whitelistPolicy: null,
  tokenEconomics: null,
  complianceReadiness: null,
  stepStatuses: {},
})

const mountStep = (readinessScore = makeReadinessScore(), formData = makeFormData()) =>
  mount(ReviewSubmitStep, {
    props: { readinessScore, formData },
    global: {
      plugins: [createPinia()],
      stubs: {
        Card: CardStub,
        Badge: BadgeStub,
        Button: ButtonStub,
        TransactionPreviewPanel: TransactionPreviewPanelStub,
      },
    },
  })

describe('ReviewSubmitStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders Review & Submit heading', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('Review')
    expect(wrapper.text()).toContain('Submit')
  })

  it('renders Readiness Score section', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('Readiness Score')
  })

  it('displays overall score percentage', () => {
    const wrapper = mountStep(makeReadinessScore({ overallScore: 80 }))
    expect(wrapper.text()).toContain('80%')
  })

  it('displays required steps fraction', () => {
    const wrapper = mountStep(makeReadinessScore({ requiredStepsComplete: 4, totalRequiredSteps: 5 }))
    expect(wrapper.text()).toContain('4')
    expect(wrapper.text()).toContain('5')
  })

  // ── Blockers & Warnings ────────────────────────────────────────────────────

  it('shows blockers section when blockers present', () => {
    const wrapper = mountStep(makeReadinessScore({ blockers: ['Missing compliance'] }))
    expect(wrapper.text()).toContain('Blockers')
    expect(wrapper.text()).toContain('Missing compliance')
  })

  it('does not show blockers section when no blockers', () => {
    const wrapper = mountStep(makeReadinessScore({ blockers: [] }))
    expect(wrapper.text()).not.toContain('Blockers:')
  })

  it('shows warnings section when warnings present', () => {
    const wrapper = mountStep(makeReadinessScore({ warnings: ['Optional field empty'] }))
    expect(wrapper.text()).toContain('Warnings')
    expect(wrapper.text()).toContain('Optional field empty')
  })

  it('does not show warnings section when no warnings', () => {
    const wrapper = mountStep(makeReadinessScore({ warnings: [] }))
    expect(wrapper.text()).not.toContain('Warnings:')
  })

  // ── canSubmit Logic ────────────────────────────────────────────────────────

  it('canSubmit is false when blockers present', () => {
    const wrapper = mountStep(makeReadinessScore({ blockers: ['blocker'] }))
    const vm = wrapper.vm as any
    expect(vm.canSubmit).toBe(false)
  })

  it('canSubmit is false when no blockers but risk not acknowledged', () => {
    const wrapper = mountStep(makeReadinessScore({ blockers: [] }))
    const vm = wrapper.vm as any
    vm.riskAcknowledged = false
    expect(vm.canSubmit).toBe(false)
  })

  it('canSubmit is true when no blockers and risk acknowledged', async () => {
    const wrapper = mountStep(makeReadinessScore({ blockers: [] }))
    const vm = wrapper.vm as any
    vm.riskAcknowledged = true
    await wrapper.vm.$nextTick()
    expect(vm.canSubmit).toBe(true)
  })

  // ── Submission ─────────────────────────────────────────────────────────────

  it('handleSubmit emits submit event when canSubmit is true', async () => {
    const wrapper = mountStep(makeReadinessScore({ blockers: [] }))
    const vm = wrapper.vm as any
    vm.riskAcknowledged = true
    await wrapper.vm.$nextTick()
    vm.handleSubmit()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('handleSubmit does not emit submit when canSubmit is false', async () => {
    const wrapper = mountStep(makeReadinessScore({ blockers: ['blocker'] }))
    const vm = wrapper.vm as any
    vm.handleSubmit()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('submit')).toBeFalsy()
  })
})
