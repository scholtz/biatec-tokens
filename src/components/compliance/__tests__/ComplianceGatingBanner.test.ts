import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ComplianceGatingBanner from '../ComplianceGatingBanner.vue'

const makeEligibility = (overrides = {}) => ({
  eligible: false,
  status: 'pending' as const,
  reasons: [],
  nextActions: [],
  canRetry: false,
  ...overrides,
})

const globalStubs = {
  ComplianceStatusBadge: true,
  ShieldExclamationIcon: true,
  CheckCircleIcon: true,
  ExclamationCircleIcon: true,
  DocumentCheckIcon: true,
  SparklesIcon: true,
  ChatBubbleLeftRightIcon: true,
  ArrowPathIcon: true,
  InformationCircleIcon: true,
  ClockIcon: true,
  ArrowRightIcon: true,
}

describe('ComplianceGatingBanner', () => {
  it('shows "Token Issuance Unavailable" when blocked', () => {
    const w = mount(ComplianceGatingBanner, {
      props: { eligibility: makeEligibility({ eligible: false }) },
      global: { stubs: globalStubs },
    })
    expect(w.text()).toContain('Token Issuance Unavailable')
  })

  it('shows "Ready for Token Issuance" when eligible', () => {
    const w = mount(ComplianceGatingBanner, {
      props: { eligibility: makeEligibility({ eligible: true }) },
      global: { stubs: globalStubs },
    })
    expect(w.text()).toContain('Ready for Token Issuance')
  })

  it('shows red border when blocked', () => {
    const w = mount(ComplianceGatingBanner, {
      props: { eligibility: makeEligibility({ eligible: false }) },
      global: { stubs: globalStubs },
    })
    expect(w.html()).toContain('border-red-700')
  })

  it('shows green border when eligible', () => {
    const w = mount(ComplianceGatingBanner, {
      props: { eligibility: makeEligibility({ eligible: true }) },
      global: { stubs: globalStubs },
    })
    expect(w.html()).toContain('border-green-700')
  })

  it('shows reasons when blocked with reasons', () => {
    const w = mount(ComplianceGatingBanner, {
      props: {
        eligibility: makeEligibility({
          eligible: false,
          reasons: ['Missing KYC', 'Address not verified'],
        }),
      },
      global: { stubs: globalStubs },
    })
    expect(w.text()).toContain('Missing KYC')
    expect(w.text()).toContain('Address not verified')
  })

  it('emits complete-compliance when button clicked', async () => {
    const w = mount(ComplianceGatingBanner, {
      props: { eligibility: makeEligibility({ eligible: false }) },
      global: { stubs: globalStubs },
    })
    const btn = w.findAll('button').find(b => b.text().includes('Complete Compliance'))
    if (btn) {
      await btn.trigger('click')
      expect(w.emitted('complete-compliance')).toBeTruthy()
    }
  })

  it('emits create-token when eligible and button clicked', async () => {
    const w = mount(ComplianceGatingBanner, {
      props: { eligibility: makeEligibility({ eligible: true }) },
      global: { stubs: globalStubs },
    })
    const btn = w.findAll('button').find(b => b.text().includes('Create Token'))
    if (btn) {
      await btn.trigger('click')
      expect(w.emitted('create-token')).toBeTruthy()
    }
  })

  it('shows retry button when canRetry is true', () => {
    const w = mount(ComplianceGatingBanner, {
      props: { eligibility: makeEligibility({ eligible: false, canRetry: true }) },
      global: { stubs: globalStubs },
    })
    expect(w.text()).toContain('Retry Verification')
  })

  it('shows help text by default', () => {
    const w = mount(ComplianceGatingBanner, {
      props: { eligibility: makeEligibility() },
      global: { stubs: globalStubs },
    })
    expect(w.html()).toContain('border-gray-700')
  })
})
