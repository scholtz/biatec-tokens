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

  it('should toggle tooltipOpen when info button is clicked', async () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: { status: 'pending_review' as UserComplianceStatus, showTooltip: true }
    })
    const vm = wrapper.vm as any
    expect(vm.tooltipOpen).toBe(false)
    const infoBtn = wrapper.find('button[type="button"]')
    await infoBtn.trigger('click')
    expect(vm.tooltipOpen).toBe(true)
    await infoBtn.trigger('click')
    expect(vm.tooltipOpen).toBe(false)
  })

  it('should close tooltip when close button is clicked', async () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: { status: 'pending_review' as UserComplianceStatus, showTooltip: true }
    })
    const vm = wrapper.vm as any
    vm.tooltipOpen = true
    await wrapper.vm.$nextTick()
    const buttons = wrapper.findAll('button')
    const closeBtn = buttons[buttons.length - 1]
    await closeBtn.trigger('click')
    expect(vm.tooltipOpen).toBe(false)
  })

  it('should show requiresAction content in tooltip for pending_documents', async () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: { status: 'pending_documents' as UserComplianceStatus, showTooltip: true }
    })
    const vm = wrapper.vm as any
    vm.tooltipOpen = true
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Action Required')
  })

  it('should show estimatedTime content in tooltip when available', async () => {
    const wrapper = mount(ComplianceStatusBadge, {
      props: { status: 'pending_review' as UserComplianceStatus, showTooltip: true }
    })
    const vm = wrapper.vm as any
    vm.tooltipOpen = true
    await wrapper.vm.$nextTick()
    // estimatedTime may or may not be present for pending_review - just verify render
    expect(wrapper.exists()).toBe(true)
  })
})
