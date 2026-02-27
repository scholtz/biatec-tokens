import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ComplianceGapList from '../ComplianceGapList.vue'
import type { ComplianceGap } from '../ComplianceGapList.vue'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const stubs = {
  Badge: {
    template: '<span class="badge"><slot></slot></span>',
    props: ['variant', 'size'],
  },
}

const criticalGap: ComplianceGap = {
  severity: 'critical',
  title: 'Missing KYC Documentation',
  description: 'KYC documents are required before deployment',
  remediation: 'Upload your identity verification documents',
  detectedAt: '2024-01-15T10:00:00Z',
}

const highGap: ComplianceGap = {
  severity: 'high',
  title: 'AML Check Incomplete',
  description: 'AML screening has not been completed',
  remediation: 'Complete AML screening process',
  detectedAt: '2024-01-15T10:00:00Z',
  affectedTokens: ['token-1', 'token-2'],
  actionUrl: '/compliance/aml',
  actionLabel: 'Start AML Check',
}

const mediumGap: ComplianceGap = {
  severity: 'medium',
  title: 'Whitepaper Needed',
  description: 'A whitepaper is recommended',
  remediation: 'Create and upload a whitepaper',
  detectedAt: '2024-01-15T10:00:00Z',
}

const lowGap: ComplianceGap = {
  severity: 'low',
  title: 'Logo Missing',
  description: 'Token logo is missing',
  remediation: 'Upload a token logo',
  detectedAt: '2024-01-15T10:00:00Z',
}

describe('ComplianceGapList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the component', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [] },
      global: { stubs },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should show empty state when no gaps', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain("All Clear!")
    expect(wrapper.text()).toContain('No compliance gaps detected')
  })

  it('should show "No gaps" badge when no gaps', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('No gaps')
  })

  it('should show gap count badge when gaps exist', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [criticalGap, highGap] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('2 gap(s)')
  })

  it('should display gap title', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [criticalGap] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Missing KYC Documentation')
  })

  it('should display gap description', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [criticalGap] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('KYC documents are required before deployment')
  })

  it('should display remediation guidance', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [criticalGap] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Upload your identity verification documents')
  })

  it('should sort gaps by severity: critical first', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [lowGap, criticalGap, mediumGap, highGap] },
      global: { stubs },
    })
    const text = wrapper.text()
    const criticalPos = text.indexOf('Missing KYC Documentation')
    const highPos = text.indexOf('AML Check Incomplete')
    const mediumPos = text.indexOf('Whitepaper Needed')
    const lowPos = text.indexOf('Logo Missing')
    expect(criticalPos).toBeLessThan(highPos)
    expect(highPos).toBeLessThan(mediumPos)
    expect(mediumPos).toBeLessThan(lowPos)
  })

  it('should show affected tokens', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [highGap] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('token-1')
    expect(wrapper.text()).toContain('token-2')
  })

  it('should show token name from tokenNameMap', () => {
    const wrapper = mount(ComplianceGapList, {
      props: {
        gaps: [highGap],
        tokenNameMap: { 'token-1': 'My Token', 'token-2': 'Other Token' },
      },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('My Token')
    expect(wrapper.text()).toContain('Other Token')
  })

  it('should show token ID when not in tokenNameMap', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [highGap] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('token-1')
  })

  it('should show +N more when more than 5 affected tokens', () => {
    const gapWithManyTokens: ComplianceGap = {
      ...highGap,
      affectedTokens: ['t1', 't2', 't3', 't4', 't5', 't6', 't7'],
    }
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [gapWithManyTokens] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('+2 more')
  })

  it('should show action button when actionUrl provided', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [highGap] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Start AML Check')
  })

  it('should navigate to internal route on action click', async () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [highGap] },
      global: { stubs },
    })
    const actionButton = wrapper.find('button')
    await actionButton.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/compliance/aml')
  })

  it('should open external URL in new tab', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const gapWithExternalUrl: ComplianceGap = {
      ...highGap,
      actionUrl: 'https://external.example.com',
    }
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [gapWithExternalUrl] },
      global: { stubs },
    })
    const actionButton = wrapper.find('button')
    await actionButton.trigger('click')
    expect(openSpy).toHaveBeenCalledWith('https://external.example.com', '_blank')
    openSpy.mockRestore()
  })

  it('should use "Take Action" as default action label', () => {
    const gapWithNoLabel: ComplianceGap = {
      ...highGap,
      actionLabel: undefined,
    }
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [gapWithNoLabel] },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Take Action')
  })

  it('should render critical severity gap with correct classes', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [criticalGap] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-red-500/30')
  })

  it('should render high severity gap', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [highGap] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-orange-500/30')
  })

  it('should render medium severity gap', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [mediumGap] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-yellow-500/30')
  })

  it('should render low severity gap', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [lowGap] },
      global: { stubs },
    })
    expect(wrapper.html()).toContain('border-blue-500/30')
  })

  it('should handle gaps without affectedTokens', () => {
    const wrapper = mount(ComplianceGapList, {
      props: { gaps: [criticalGap] },
      global: { stubs },
    })
    // Should not show "Affected tokens:" label
    expect(wrapper.text()).not.toContain('Affected tokens:')
  })
})
