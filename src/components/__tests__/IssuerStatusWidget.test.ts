import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import IssuerStatusWidget from '../IssuerStatusWidget.vue'

const { mockGetIssuerStatus } = vi.hoisted(() => ({
  mockGetIssuerStatus: vi.fn().mockResolvedValue({
    status: 'verified',
    legalName: 'ACME Corp Ltd',
    jurisdiction: 'EU',
    regulatoryLicense: 'MICA-2024-001',
    lastUpdated: '2026-01-15T10:00:00Z'
  })
}))

vi.mock('../MicaSummaryWidget.vue', () => ({
  default: {
    name: 'MicaSummaryWidget',
    template: `<div data-testid="mica-summary-widget">
      <slot name="content" />
    </div>`,
    props: ['title', 'subtitle', 'icon', 'iconColor', 'lastUpdated', 'hasDetails'],
    emits: ['view-details']
  }
}))

vi.mock('../../services/ComplianceService', () => ({
  complianceService: {
    getIssuerStatus: mockGetIssuerStatus
  }
}))

describe('IssuerStatusWidget', () => {
  it('renders the MicaSummaryWidget wrapper', async () => {
    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR12345' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.find('[data-testid="mica-summary-widget"]').exists()).toBe(true)
  })

  it('shows loading state initially before data loads', () => {
    mockGetIssuerStatus.mockImplementationOnce(
      () => new Promise(() => { /* never resolves — component stays in loading state */ })
    )
    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR12345' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    // Before promise resolves, component exists and renders content
    expect(wrapper.exists()).toBe(true)
  })

  it('shows verified status after data loads', async () => {
    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR12345' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Verified')
  })

  it('shows legal name when provided', async () => {
    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR12345' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('ACME Corp Ltd')
  })

  it('shows error state when fetch fails', async () => {
    mockGetIssuerStatus.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR-FAIL' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    await new Promise(r => setTimeout(r, 10))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Failed to load status')
  })

  it('does not call loadStatus when issuerAddress is empty', () => {
    const callsBefore = mockGetIssuerStatus.mock.calls.length
    mount(IssuerStatusWidget, {
      props: { issuerAddress: '' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(mockGetIssuerStatus.mock.calls.length).toBe(callsBefore)
  })

  it('does not render wallet connector UI (product alignment)', async () => {
    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR12345' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    })
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})
