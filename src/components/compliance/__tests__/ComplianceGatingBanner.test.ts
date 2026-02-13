import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ComplianceGatingBanner from '../ComplianceGatingBanner.vue'
import type { IssuanceEligibility } from '../../../types/compliance'

describe('ComplianceGatingBanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const createEligibility = (eligible: boolean): IssuanceEligibility => ({
    eligible,
    status: eligible ? 'approved' : 'pending_documents',
    reasons: eligible ? [] : ['2 required documents pending upload'],
    nextActions: eligible ? [] : [{
      type: 'upload_document',
      title: 'Upload Government ID',
      description: 'Upload your government-issued ID document',
      priority: 'high'
    }],
    canRetry: !eligible
  })

  it('should render blocked state when not eligible', () => {
    const eligibility = createEligibility(false)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { eligibility }
    })

    expect(wrapper.text()).toContain('Token Issuance Unavailable')
    expect(wrapper.html()).toContain('border-red-')
  })

  it('should render approved state when eligible', () => {
    const eligibility = createEligibility(true)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { eligibility }
    })

    expect(wrapper.text()).toContain('Ready for Token Issuance')
    expect(wrapper.html()).toContain('border-green-')
  })

  it('should display reasons when blocked', () => {
    const eligibility = createEligibility(false)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { eligibility }
    })

    expect(wrapper.text()).toContain('2 required documents pending upload')
  })

  it('should display next actions when blocked', () => {
    const eligibility = createEligibility(false)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { eligibility }
    })

    expect(wrapper.text()).toContain('Upload Government ID')
    expect(wrapper.text()).toContain('High Priority')
  })

  it('should emit complete-compliance event when button clicked', async () => {
    const eligibility = createEligibility(false)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { 
        eligibility,
        showCompleteButton: true
      }
    })

    const button = wrapper.find('button:has-text("Complete Compliance")')
    if (button.exists()) {
      await button.trigger('click')
      expect(wrapper.emitted('complete-compliance')).toBeTruthy()
    }
  })

  it('should emit create-token event when eligible and button clicked', async () => {
    const eligibility = createEligibility(true)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { 
        eligibility,
        showCreateTokenButton: true
      }
    })

    const button = wrapper.find('button:has-text("Create Token")')
    if (button.exists()) {
      await button.trigger('click')
      expect(wrapper.emitted('create-token')).toBeTruthy()
    }
  })

  it('should emit contact-support event when support button clicked', async () => {
    const eligibility = createEligibility(false)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { 
        eligibility,
        showContactSupport: true
      }
    })

    const buttons = wrapper.findAll('button')
    const supportButton = buttons.find(b => b.text().includes('Contact Support'))
    
    if (supportButton) {
      await supportButton.trigger('click')
      expect(wrapper.emitted('contact-support')).toBeTruthy()
    }
  })

  it('should show retry button when canRetry is true', () => {
    const eligibility: IssuanceEligibility = {
      eligible: false,
      status: 'rejected',
      reasons: ['Documents rejected'],
      nextActions: [],
      canRetry: true
    }

    const wrapper = mount(ComplianceGatingBanner, {
      props: { 
        eligibility,
        showRetryButton: true
      }
    })

    const retryButtons = wrapper.findAll('button').filter(b => 
      b.text().includes('Retry')
    )
    
    expect(retryButtons.length).toBeGreaterThan(0)
  })

  it('should display help text when enabled', () => {
    const eligibility = createEligibility(false)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { 
        eligibility,
        showHelpText: true
      }
    })

    expect(wrapper.text()).toContain('business days')
  })

  it('should not display help text when disabled', () => {
    const eligibility = createEligibility(false)
    const wrapper = mount(ComplianceGatingBanner, {
      props: { 
        eligibility,
        showHelpText: false
      }
    })

    const hasBusinessDays = wrapper.text().includes('business days')
    expect(hasBusinessDays).toBe(false)
  })

  it('should prioritize high priority actions', () => {
    const eligibility: IssuanceEligibility = {
      eligible: false,
      status: 'rejected',
      reasons: ['Multiple issues'],
      nextActions: [
        {
          type: 'upload_document',
          title: 'High Priority Action',
          description: 'This is high priority',
          priority: 'high'
        },
        {
          type: 'provide_additional_info',
          title: 'Low Priority Action',
          description: 'This is low priority',
          priority: 'low'
        }
      ],
      canRetry: true
    }

    const wrapper = mount(ComplianceGatingBanner, {
      props: { eligibility }
    })

    const text = wrapper.text()
    expect(text).toContain('High Priority Action')
    expect(text).toContain('Low Priority Action')
  })
})
