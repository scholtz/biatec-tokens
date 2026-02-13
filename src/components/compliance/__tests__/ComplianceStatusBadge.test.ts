import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ComplianceStatusBadge from '../ComplianceStatusBadge.vue'
import type { UserComplianceStatus } from '../../../types/compliance'

describe('ComplianceStatusBadge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render with not_started status', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'not_started' as UserComplianceStatus
      }
    })

    expect(wrapper.text()).toContain('Not Started')
    expect(wrapper.html()).toContain('bg-gray-')
  })

  it('should render with approved status and green color', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'approved' as UserComplianceStatus
      }
    })

    expect(wrapper.text()).toContain('Approved')
    expect(wrapper.html()).toContain('bg-green-')
  })

  it('should render with rejected status and red color', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'rejected' as UserComplianceStatus
      }
    })

    expect(wrapper.text()).toContain('Rejected')
    expect(wrapper.html()).toContain('bg-red-')
  })

  it('should render with pending_review status and yellow color', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'pending_review' as UserComplianceStatus
      }
    })

    expect(wrapper.text()).toContain('Under Review')
    expect(wrapper.html()).toContain('bg-yellow-')
  })

  it('should render with blocked_by_aml status', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'blocked_by_aml' as UserComplianceStatus
      }
    })

    expect(wrapper.text()).toContain('AML Block')
    expect(wrapper.html()).toContain('bg-red-')
  })

  it('should not show tooltip by default', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'approved' as UserComplianceStatus,
        showTooltip: false
      }
    })

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('should show tooltip button when showTooltip is true', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'approved' as UserComplianceStatus,
        showTooltip: true
      }
    })

    const infoButton = wrapper.find('button')
    expect(infoButton.exists()).toBe(true)
  })

  it('should apply animated class when animated prop is true', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'pending_review' as UserComplianceStatus,
        animated: true
      }
    })

    expect(wrapper.html()).toContain('animate-pulse')
  })

  it('should not apply animated class when animated prop is false', () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: {
        status: 'pending_review' as UserComplianceStatus,
        animated: false
      }
    })

    expect(wrapper.html()).not.toContain('animate-pulse')
  })

  it('should handle all status values without errors', () => {
    const statuses: UserComplianceStatus[] = [
      'not_started',
      'pending_documents',
      'pending_review',
      'approved',
      'rejected',
      'escalated',
      'blocked_by_aml',
      'expired'
    ]

    statuses.forEach(status => {
      const wrapper = mount(ComplianceStatusBadge, {
        props: { status }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text().length).toBeGreaterThan(0)
    })
  })
})
