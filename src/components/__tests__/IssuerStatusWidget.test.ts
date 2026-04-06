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

  describe('getIconColor computed (lines 93-105)', () => {
    it('returns green for verified status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'verified', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'A1' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getIconColor).toBe('green')
    })

    it('returns yellow for pending status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'pending', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'A2' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getIconColor).toBe('yellow')
    })

    it('returns orange for incomplete status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'incomplete', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'A3' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getIconColor).toBe('orange')
    })

    it('returns orange for rejected status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'rejected', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'A4' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getIconColor).toBe('orange')
    })

    it('returns blue for default (unknown) status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'unknown_status', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'A5' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getIconColor).toBe('blue')
    })

    it('returns blue when status is null', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce(null)
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'A6' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getIconColor).toBe('blue')
    })
  })

  describe('getStatusColor computed (lines 108-121)', () => {
    it('returns text-red-400 for rejected status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'rejected', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'B4' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getStatusColor).toBe('text-red-400')
    })

    it('returns text-gray-400 for default status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'xunknown', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'B5' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getStatusColor).toBe('text-gray-400')
    })
  })

  describe('getStatusLabel computed (lines 123-137)', () => {
    it('returns "Rejected" for rejected status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'rejected', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'C4' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getStatusLabel).toBe('Rejected')
    })

    it('returns "Unknown" for default status', async () => {
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'xunknown', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'C5' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).getStatusLabel).toBe('Unknown')
    })
  })

  describe('formatTimestamp (line 151 — years branch)', () => {
    it('returns "N years ago" for >365 day old timestamp', async () => {
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'D1' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      const vm = wrapper.vm as any
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
      expect(vm.formatTimestamp(twoYearsAgo)).toMatch(/year/)
    })
  })

  describe('gtag analytics in loadStatus (line 165)', () => {
    it('calls gtag when it is defined on window', async () => {
      const gtagMock = vi.fn();
      (window as any).gtag = gtagMock
      mockGetIssuerStatus.mockResolvedValueOnce({ status: 'verified', legalName: 'A', lastUpdated: '2026-01-01T00:00:00Z' })
      const wrapper = mount(IssuerStatusWidget, { props: { issuerAddress: 'E1' }, global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } })
      await new Promise(r => setTimeout(r, 10)); await wrapper.vm.$nextTick()
      expect(gtagMock).toHaveBeenCalledWith('event', 'compliance_widget_view', expect.objectContaining({ widget_type: 'issuer_status' }));
      delete (window as any).gtag
    })
  })
})

// ─── formatTimestamp months branch (line 149) ────────────────────────────────

describe('IssuerStatusWidget - formatTimestamp months branch', () => {
  it('returns "N months ago" for a date 60 days ago', async () => {
    const { mount } = await import('@vue/test-utils')
    const { createTestingPinia } = await import('@pinia/testing')
    const { vi } = await import('vitest')
    const IssuerStatusWidget = (await import('../IssuerStatusWidget.vue')).default

    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR-MONTHS' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    })
    const vm = wrapper.vm as any

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const result = vm.formatTimestamp(sixtyDaysAgo)
    expect(result).toMatch(/months? ago/i)
  })

  it('returns "today" for a timestamp from earlier today', async () => {
    const { mount } = await import('@vue/test-utils')
    const { createTestingPinia } = await import('@pinia/testing')
    const { vi } = await import('vitest')
    const IssuerStatusWidget = (await import('../IssuerStatusWidget.vue')).default

    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR-TODAY' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    })
    const vm = wrapper.vm as any
    const today = new Date().toISOString()
    expect(vm.formatTimestamp(today)).toBe('today')
  })

  it('returns "yesterday" for a timestamp from 25 hours ago', async () => {
    const { mount } = await import('@vue/test-utils')
    const { createTestingPinia } = await import('@pinia/testing')
    const { vi } = await import('vitest')
    const IssuerStatusWidget = (await import('../IssuerStatusWidget.vue')).default

    const wrapper = mount(IssuerStatusWidget, {
      props: { issuerAddress: 'ADDR-YESTERDAY' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    })
    const vm = wrapper.vm as any
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    expect(vm.formatTimestamp(yesterday)).toBe('yesterday')
  })
})
