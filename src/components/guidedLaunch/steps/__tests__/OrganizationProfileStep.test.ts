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

  it('should clear email error when valid email entered', async () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    // First set invalid email to create error
    vm.formData.contactEmail = 'invalid'
    vm.validateField('contactEmail')
    expect(vm.fieldErrors.contactEmail).toBeDefined()
    // Now set valid email and validate
    vm.formData.contactEmail = 'valid@test.com'
    vm.validateField('contactEmail')
    await wrapper.vm.$nextTick()
    expect(vm.fieldErrors.contactEmail).toBeUndefined()
  })

  it('should set error when organizationName is empty', async () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    vm.formData.organizationName = ''
    vm.validateField('organizationName')
    await wrapper.vm.$nextTick()
    expect(vm.fieldErrors.organizationName).toBeDefined()
  })

  it('should clear organizationName error when name is provided', async () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    // Set error first
    vm.formData.organizationName = ''
    vm.validateField('organizationName')
    expect(vm.fieldErrors.organizationName).toBeDefined()
    // Clear by providing a valid name
    vm.formData.organizationName = 'Test Corp'
    vm.validateField('organizationName')
    await wrapper.vm.$nextTick()
    expect(vm.fieldErrors.organizationName).toBeUndefined()
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

  it('should return errors when organizationName is missing', () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    vm.formData.organizationName = ''
    vm.formData.jurisdiction = 'US'
    vm.formData.contactName = 'John'
    vm.formData.contactEmail = 'john@test.com'
    vm.formData.role = 'business_owner'
    const validation = vm.validateForm()
    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Organization name is required')
  })

  it('should return errors when contactEmail format is invalid', () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    vm.formData.organizationName = 'Test'
    vm.formData.organizationType = 'company'
    vm.formData.jurisdiction = 'US'
    vm.formData.contactName = 'John'
    vm.formData.contactEmail = 'not-a-valid-email'
    vm.formData.role = 'business_owner'
    const validation = vm.validateForm()
    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Invalid email format')
  })

  it('should return error when contactEmail is empty', () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    vm.formData.organizationName = 'Test'
    vm.formData.organizationType = 'company'
    vm.formData.jurisdiction = 'US'
    vm.formData.contactName = 'John'
    vm.formData.contactEmail = ''
    vm.formData.role = 'business_owner'
    const validation = vm.validateForm()
    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Contact email is required')
  })

  it('handleSubmit emits complete and update events when form is valid', async () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    // Fill in valid form data
    vm.formData.organizationName = 'Valid Corp'
    vm.formData.organizationType = 'company'
    vm.formData.jurisdiction = 'US'
    vm.formData.contactName = 'Jane Doe'
    vm.formData.contactEmail = 'jane@validcorp.com'
    vm.formData.role = 'business_owner'
    await wrapper.vm.$nextTick()
    // Call handleSubmit
    vm.handleSubmit()
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted()
    expect(emitted.complete).toBeDefined()
    expect(emitted.update).toBeDefined()
  })

  it('handleSubmit does not emit complete when form is invalid', async () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    // Leave form in invalid state (empty required fields)
    vm.handleSubmit()
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted()
    expect(emitted.complete).toBeUndefined()
  })

  it('should emit update when form data changes (watch)', async () => {
    const wrapper = mount(OrganizationProfileStep)
    const vm = wrapper.vm as any
    // Change formData to trigger watch
    vm.formData.organizationName = 'Updated Name'
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted()
    expect(emitted.update).toBeDefined()
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
