import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AuditEvidenceExport from '../AuditEvidenceExport.vue'
import type { Token } from '../../../stores/tokens'

const mockToken: Token = {
  id: 'token-1',
  name: 'Test Token',
  symbol: 'TST',
  standard: 'asa',
  network: 'algorand-testnet',
  description: '',
  totalSupply: 1000000,
  decimals: 0,
  status: 'active',
  createdAt: '2024-01-15',
  assetId: 12345,
}

describe('AuditEvidenceExport', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the component', () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display "Audit Evidence Export" heading', () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    expect(wrapper.text()).toContain('Audit Evidence Export')
  })

  it('should show available tokens in dropdown', () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [mockToken] },
    })
    const select = wrapper.find('select')
    expect(select.text()).toContain('Test Token')
  })

  it('should be valid when no dates set', () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    expect(vm.isValid).toBe(true)
  })

  it('should be invalid when start date is after end date', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    vm.filters.startDate = '2024-12-31'
    vm.filters.endDate = '2024-01-01'
    await wrapper.vm.$nextTick()
    expect(vm.isValid).toBe(false)
    expect(vm.validationError).toContain('Start date must be before end date')
  })

  it('should be valid when start date is before end date', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    vm.filters.startDate = '2024-01-01'
    vm.filters.endDate = '2024-12-31'
    await wrapper.vm.$nextTick()
    expect(vm.isValid).toBe(true)
  })

  it('should show preview when handlePreview is called with valid state', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [mockToken] },
    })
    const vm = wrapper.vm as any
    vm.handlePreview()
    await wrapper.vm.$nextTick()
    expect(vm.showPreview).toBe(true)
  })

  it('should not show preview when validation fails', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    vm.filters.startDate = '2024-12-31'
    vm.filters.endDate = '2024-01-01'
    await wrapper.vm.$nextTick()
    vm.handlePreview()
    expect(vm.showPreview).toBe(false)
  })

  it('should calculate token count for all tokens when no token filter', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [mockToken, { ...mockToken, id: 'token-2', name: 'Token 2', symbol: 'TK2' }] },
    })
    const vm = wrapper.vm as any
    vm.handlePreview()
    await wrapper.vm.$nextTick()
    expect(vm.previewData.tokenCount).toBe(2)
  })

  it('should calculate token count as 1 when specific token filter set', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [mockToken] },
    })
    const vm = wrapper.vm as any
    vm.filters.tokenId = 'token-1'
    vm.handlePreview()
    await wrapper.vm.$nextTick()
    expect(vm.previewData.tokenCount).toBe(1)
  })

  it('should calculate estimated size in KB for small exports', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [mockToken] },
    })
    const vm = wrapper.vm as any
    vm.filters.tokenId = 'token-1'
    vm.handlePreview()
    await wrapper.vm.$nextTick()
    expect(vm.previewData.estimatedSize).toContain('KB')
  })

  it('should calculate estimated size in MB for large exports', async () => {
    const manyTokens = Array.from({ length: 200 }, (_, i) => ({
      ...mockToken,
      id: `token-${i}`,
      name: `Token ${i}`,
    }))
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: manyTokens },
    })
    const vm = wrapper.vm as any
    vm.handlePreview()
    await wrapper.vm.$nextTick()
    expect(vm.previewData.estimatedSize).toContain('MB')
  })

  it('should show "All time" start date in preview when not set', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [mockToken] },
    })
    const vm = wrapper.vm as any
    vm.handlePreview()
    await wrapper.vm.$nextTick()
    expect(vm.previewData.dateRange).toContain('All time')
  })

  it('should emit export event on handleExport', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [mockToken] },
    })
    const vm = wrapper.vm as any
    const exportPromise = vm.handleExport()
    vi.advanceTimersByTime(1500)
    await exportPromise
    expect(wrapper.emitted('export')).toBeTruthy()
    const [[format]] = wrapper.emitted('export') as any[]
    expect(format).toBe('csv')
  })

  it('should not export when validation fails', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    vm.filters.startDate = '2024-12-31'
    vm.filters.endDate = '2024-01-01'
    await wrapper.vm.$nextTick()
    await vm.handleExport()
    expect(wrapper.emitted('export')).toBeFalsy()
  })

  it('should set successMessage after successful export', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    const exportPromise = vm.handleExport()
    vi.advanceTimersByTime(1500)
    await exportPromise
    await wrapper.vm.$nextTick()
    expect(vm.successMessage).toContain('exported successfully')
  })

  it('should clear successMessage after 5 seconds', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    const exportPromise = vm.handleExport()
    vi.advanceTimersByTime(1500)
    await exportPromise
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()
    expect(vm.successMessage).toBe('')
  })

  it('should reset showPreview and successMessage when filters change', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [mockToken] },
    })
    const vm = wrapper.vm as any
    vm.handlePreview()
    vm.successMessage = 'Exported!'
    await wrapper.vm.$nextTick()
    expect(vm.showPreview).toBe(true)
    
    vm.filters.category = 'kyc'
    await wrapper.vm.$nextTick()
    expect(vm.showPreview).toBe(false)
    expect(vm.successMessage).toBe('')
  })

  it('should show format options for CSV and JSON', () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    expect(wrapper.text()).toContain('CSV')
    expect(wrapper.text()).toContain('JSON')
  })

  it('should change selectedFormat to json', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    vm.selectedFormat = 'json'
    await wrapper.vm.$nextTick()
    expect(vm.selectedFormat).toBe('json')
  })

  it('should handle export and reset isExporting', async () => {
    const wrapper = mount(AuditEvidenceExport, {
      props: { availableTokens: [] },
    })
    const vm = wrapper.vm as any
    const exportPromise = vm.handleExport()
    expect(vm.isExporting).toBe(true)
    vi.advanceTimersByTime(1500)
    await exportPromise
    expect(vm.isExporting).toBe(false)
  })
})
