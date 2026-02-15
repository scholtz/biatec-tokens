/**
 * Unit tests for OrganizationProfileStep component
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OrganizationProfileStep from '../OrganizationProfileStep.vue'
import { useGuidedLaunchStore } from '../../../../stores/guidedLaunch'

describe('OrganizationProfileStep', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render the component with heading', () => {
    const wrapper = mount(OrganizationProfileStep)
    expect(wrapper.find('h2').text()).toBe('Organization Profile')
  })

  it('should render all required fields', () => {
    const wrapper = mount(OrganizationProfileStep)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.findAll('select').length).toBeGreaterThan(0)
  })

  it('should display info box', () => {
    const wrapper = mount(OrganizationProfileStep)
    const infoBox = wrapper.text()
    expect(infoBox).toContain('Why we need this information')
  })

  it('should start with disabled submit button', () => {
    const wrapper = mount(OrganizationProfileStep)
    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('should validate email format', async () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    vm.formData.contactEmail = 'invalid-email'
    await wrapper.vm.$nextTick()
    vm.validateField('contactEmail')
    await wrapper.vm.$nextTick()
    expect(vm.fieldErrors.contactEmail).toBeDefined()
  })

  it('should show warning for missing registration number', () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    vm.formData.organizationName = 'Test'
    vm.formData.organizationType = 'company'
    vm.formData.jurisdiction = 'US'
    vm.formData.contactName = 'John'
    vm.formData.contactEmail = 'john@test.com'
    vm.formData.role = 'business_owner'
    const validation = vm.validateForm()
    expect(validation.isValid).toBe(true)
    expect(validation.warnings.length).toBeGreaterThan(0)
  })

  it('should load existing data from store', async () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile({
      organizationName: 'Existing Company',
      organizationType: 'company',
      jurisdiction: 'US',
      contactName: 'Jane',
      contactEmail: 'jane@test.com',
      role: 'cfo_finance',
    })
    const wrapper = mount(OrganizationProfileStep)
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    expect(vm.formData.organizationName).toBe('Existing Company')
  })

  it('should have accessibility labels', () => {
    const wrapper = mount(OrganizationProfileStep)
    const labels = wrapper.findAll('label')
    expect(labels.length).toBeGreaterThan(0)
  })
})
