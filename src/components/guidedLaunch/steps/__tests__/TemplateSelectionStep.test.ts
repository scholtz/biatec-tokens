/**
 * Unit tests for TemplateSelectionStep
 *
 * Validates that:
 * - Heading and description are rendered
 * - Templates from the store are displayed (when available)
 * - selectTemplate() selects a template and emits 'update'
 * - handleSubmit() emits 'complete' only when a template is selected
 * - Continue button is disabled when no template selected
 * - onMounted restores existing selectedTemplate from store
 * - formatNetwork converts snake_case to Title Case
 *
 * Business value: Template selection is a critical step in the guided launch wizard.
 * Regression risk: Broken selection prevents all subsequent guided launch steps.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from '../../../../stores/guidedLaunch'
import TemplateSelectionStep from '../TemplateSelectionStep.vue'

const ButtonStub = {
  name: 'Button',
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  props: ['disabled', 'variant', 'size', 'fullWidth', 'full-width'],
  emits: ['click'],
}
const BadgeStub = { name: 'Badge', template: '<span><slot /></span>', props: ['variant', 'size'] }

const mountStep = (pinia?: ReturnType<typeof createPinia>) =>
  mount(TemplateSelectionStep, {
    global: { stubs: { Button: ButtonStub, Badge: BadgeStub }, plugins: pinia ? [pinia] : [] },
  })

describe('TemplateSelectionStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders Select Token Template heading', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('Select Token Template')
  })

  it('renders descriptive subheading', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('template')
  })

  it('renders Continue button', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('Continue')
  })

  // ── Validation ─────────────────────────────────────────────────────────────

  it('Continue button is disabled when no template is selected', () => {
    const wrapper = mountStep()
    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('handleSubmit does not emit complete when no template selected', async () => {
    const wrapper = mountStep()
    const vm = wrapper.vm as any
    vm.handleSubmit()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('complete')).toBeFalsy()
  })

  // ── Selection ──────────────────────────────────────────────────────────────

  it('selectTemplate sets selected template and emits update', async () => {
    const wrapper = mountStep()
    const vm = wrapper.vm as any
    const mockTemplate = { id: 't1', name: 'Test Template', description: 'desc', standard: 'ASA', network: 'algorand_mainnet', complianceLevel: 'standard', recommendedFor: ['Business'] }
    vm.selectTemplate(mockTemplate)
    await wrapper.vm.$nextTick()
    expect(vm.selectedTemplate).toEqual(mockTemplate)
    const updates = wrapper.emitted('update')
    expect(updates).toBeTruthy()
    expect(updates![0][0]).toEqual(mockTemplate)
  })

  it('handleSubmit emits complete when template is selected', async () => {
    const wrapper = mountStep()
    const vm = wrapper.vm as any
    const mockTemplate = { id: 't2', name: 'Loyalty Token', description: 'desc', standard: 'ARC19', network: 'algorand_testnet', complianceLevel: 'mica_compliant', recommendedFor: ['SME'] }
    vm.selectedTemplate = mockTemplate
    await wrapper.vm.$nextTick()
    vm.handleSubmit()
    await wrapper.vm.$nextTick()
    const complete = wrapper.emitted('complete')
    expect(complete).toBeTruthy()
    expect(complete![0][0]).toHaveProperty('isValid', true)
  })

  // ── formatNetwork ──────────────────────────────────────────────────────────

  it('formatNetwork converts snake_case to Title Case', () => {
    const wrapper = mountStep()
    const vm = wrapper.vm as any
    expect(vm.formatNetwork('algorand_mainnet')).toBe('Algorand Mainnet')
    expect(vm.formatNetwork('algorand_testnet')).toBe('Algorand Testnet')
    expect(vm.formatNetwork('voi')).toBe('Voi')
  })

  // ── Store Integration ──────────────────────────────────────────────────────

  it('loads templates from store on mount', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useGuidedLaunchStore()
    vi.spyOn(store, 'getTemplates').mockReturnValue([
      { id: 'tmpl1', name: 'Corp Token', description: 'Corporate', standard: 'ARC200', network: 'algorand_mainnet', complianceLevel: 'standard', recommendedFor: ['Corp'] } as any,
    ])
    const wrapper = mount(TemplateSelectionStep, {
      global: { stubs: { Button: ButtonStub, Badge: BadgeStub }, plugins: [pinia] },
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    expect(vm.templates.length).toBe(1)
    expect(vm.templates[0].name).toBe('Corp Token')
  })

  it('restores previously selected template from store on mount', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useGuidedLaunchStore()
    const existing = { id: 'existing', name: 'Existing', description: 'd', standard: 'ASA', network: 'voi', complianceLevel: 'standard', recommendedFor: [] } as any
    store.currentForm.selectedTemplate = existing
    vi.spyOn(store, 'getTemplates').mockReturnValue([])
    const wrapper = mount(TemplateSelectionStep, {
      global: { stubs: { Button: ButtonStub, Badge: BadgeStub }, plugins: [pinia] },
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    expect(vm.selectedTemplate).toEqual(existing)
  })
})
