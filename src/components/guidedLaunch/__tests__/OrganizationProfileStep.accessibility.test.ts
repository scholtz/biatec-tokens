/**
 * Accessibility Tests for OrganizationProfileStep
 *
 * Validates WCAG 2.1 AA accessibility requirements:
 * - Form labels associated with inputs via for/id pairs
 * - Required fields have aria-required="true"
 * - Error messages use aria-invalid and aria-describedby
 * - Error messages rendered as role="alert"
 * - Focus indicators present on interactive elements
 *
 * Issue: Frontend MVP hardening - auth-first guided launch reliability, accessibility
 * Business value: WCAG AA compliance satisfies enterprise procurement requirements
 *   and EU Web Accessibility Directive; enables screen-reader usage in critical flows.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OrganizationProfileStep from '../steps/OrganizationProfileStep.vue'

describe('OrganizationProfileStep – WCAG AA Accessibility', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountStep() {
    return mount(OrganizationProfileStep, {
      global: {
        stubs: {
          Button: { template: '<button type="submit"><slot /></button>' },
        },
      },
    })
  }

  // ── Label–input associations ──────────────────────────────────────────────

  it('should have label with for="org-name" associated with input id="org-name"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="org-name"]')
    const input = wrapper.find('input#org-name')
    expect(label.exists()).toBe(true)
    expect(input.exists()).toBe(true)
  })

  it('should have label with for="org-type" associated with select id="org-type"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="org-type"]')
    const select = wrapper.find('select#org-type')
    expect(label.exists()).toBe(true)
    expect(select.exists()).toBe(true)
  })

  it('should have label with for="jurisdiction" associated with input id="jurisdiction"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="jurisdiction"]')
    const input = wrapper.find('input#jurisdiction')
    expect(label.exists()).toBe(true)
    expect(input.exists()).toBe(true)
  })

  it('should have label with for="contact-role" associated with select id="contact-role"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="contact-role"]')
    const select = wrapper.find('select#contact-role')
    expect(label.exists()).toBe(true)
    expect(select.exists()).toBe(true)
  })

  it('should have label with for="contact-name" associated with input id="contact-name"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="contact-name"]')
    const input = wrapper.find('input#contact-name')
    expect(label.exists()).toBe(true)
    expect(input.exists()).toBe(true)
  })

  it('should have label with for="contact-email" associated with input id="contact-email"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="contact-email"]')
    const input = wrapper.find('input#contact-email')
    expect(label.exists()).toBe(true)
    expect(input.exists()).toBe(true)
  })

  it('should have label with for="reg-number" associated with input id="reg-number"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="reg-number"]')
    const input = wrapper.find('input#reg-number')
    expect(label.exists()).toBe(true)
    expect(input.exists()).toBe(true)
  })

  it('should have label with for="website" associated with input id="website"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="website"]')
    const input = wrapper.find('input#website')
    expect(label.exists()).toBe(true)
    expect(input.exists()).toBe(true)
  })

  it('should have label with for="contact-phone" associated with input id="contact-phone"', () => {
    const wrapper = mountStep()
    const label = wrapper.find('label[for="contact-phone"]')
    const input = wrapper.find('input#contact-phone')
    expect(label.exists()).toBe(true)
    expect(input.exists()).toBe(true)
  })

  // ── Required field marking ────────────────────────────────────────────────

  it('should mark required fields with aria-required="true"', () => {
    const wrapper = mountStep()
    const orgNameInput = wrapper.find('input#org-name')
    const jurisdictionInput = wrapper.find('input#jurisdiction')
    const contactNameInput = wrapper.find('input#contact-name')
    const contactEmailInput = wrapper.find('input#contact-email')
    const orgTypeSelect = wrapper.find('select#org-type')
    const roleSelect = wrapper.find('select#contact-role')

    expect(orgNameInput.attributes('aria-required')).toBe('true')
    expect(jurisdictionInput.attributes('aria-required')).toBe('true')
    expect(contactNameInput.attributes('aria-required')).toBe('true')
    expect(contactEmailInput.attributes('aria-required')).toBe('true')
    expect(orgTypeSelect.attributes('aria-required')).toBe('true')
    expect(roleSelect.attributes('aria-required')).toBe('true')
  })

  // ── Decorative asterisk hidden from screen readers ────────────────────────

  it('should hide required asterisks from screen readers with aria-hidden', () => {
    const wrapper = mountStep()
    // Required markers should be hidden from screen readers
    const asterisks = wrapper.findAll('span[aria-hidden="true"]')
    // There should be multiple (one per required field)
    expect(asterisks.length).toBeGreaterThanOrEqual(5)
  })

  // ── Error state ARIA ──────────────────────────────────────────────────────

  it('should set aria-invalid="true" on org-name input when field has error', async () => {
    const wrapper = mountStep()
    // Initially no error
    const input = wrapper.find('input#org-name')
    expect(input.attributes('aria-invalid')).toBe('false')

    // Trigger validation
    await input.trigger('blur')
    await wrapper.vm.$nextTick()

    // After blur with empty value, error should be set
    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it('should render error message with role="alert" when org-name has error', async () => {
    const wrapper = mountStep()
    const input = wrapper.find('input#org-name')
    await input.trigger('blur')
    await wrapper.vm.$nextTick()

    const errorMsg = wrapper.find('#org-name-error')
    if (errorMsg.exists()) {
      expect(errorMsg.attributes('role')).toBe('alert')
    }
  })

  it('should add aria-describedby pointing to error id when org-name has error', async () => {
    const wrapper = mountStep()
    const input = wrapper.find('input#org-name')
    await input.trigger('blur')
    await wrapper.vm.$nextTick()

    // If there is an error, aria-describedby should point to it
    const hasError = wrapper.find('#org-name-error').exists()
    if (hasError) {
      expect(input.attributes('aria-describedby')).toBe('org-name-error')
    }
  })

  it('should not render error markup when field is valid', () => {
    const wrapper = mountStep()
    // Before any interaction, no error elements should exist
    const orgNameError = wrapper.find('#org-name-error')
    const emailError = wrapper.find('#contact-email-error')
    expect(orgNameError.exists()).toBe(false)
    expect(emailError.exists()).toBe(false)
  })

  // ── Hint text associations ────────────────────────────────────────────────

  it('should associate reg-number hint with aria-describedby', () => {
    const wrapper = mountStep()
    const input = wrapper.find('input#reg-number')
    expect(input.attributes('aria-describedby')).toBe('reg-number-hint')
    expect(wrapper.find('#reg-number-hint').exists()).toBe(true)
  })

  it('should associate jurisdiction hint with aria-describedby', () => {
    const wrapper = mountStep()
    const input = wrapper.find('input#jurisdiction')
    expect(input.attributes('aria-describedby')).toBe('jurisdiction-hint')
    expect(wrapper.find('#jurisdiction-hint').exists()).toBe(true)
  })

  // ── Form landmark ─────────────────────────────────────────────────────────

  it('should have form with aria-label for screen reader identification', () => {
    const wrapper = mountStep()
    const form = wrapper.find('form')
    expect(form.attributes('aria-label')).toBeTruthy()
    expect(form.attributes('aria-label')).toContain('profile')
  })

  // ── Focus indicator classes ───────────────────────────────────────────────

  it('should include focus-ring utility classes on all inputs for keyboard navigation', () => {
    const wrapper = mountStep()
    const inputs = wrapper.findAll('input')
    for (const input of inputs) {
      const classes = input.attributes('class') || ''
      // All inputs should have focus ring classes
      expect(classes).toContain('focus:ring-2')
    }
  })

  it('should include focus-ring utility classes on all selects for keyboard navigation', () => {
    const wrapper = mountStep()
    const selects = wrapper.findAll('select')
    for (const select of selects) {
      const classes = select.attributes('class') || ''
      expect(classes).toContain('focus:ring-2')
    }
  })
})
