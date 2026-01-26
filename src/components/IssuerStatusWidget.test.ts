import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import IssuerStatusWidget from './IssuerStatusWidget.vue'
import { complianceService } from '../services/ComplianceService'

vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    getIssuerStatus: vi.fn()
  }
}))

describe('IssuerStatusWidget Component', () => {
  const mockStatus = {
    issuerAddress: 'VOI123ABC',
    isVerified: true,
    status: 'verified' as const,
    legalName: 'Test Company Ltd.',
    registrationNumber: 'GB123456789',
    jurisdiction: 'United Kingdom',
    regulatoryLicense: 'FCA-123456',
    verifiedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastUpdated: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the widget', () => {
      vi.mocked(complianceService.getIssuerStatus).mockResolvedValue(mockStatus)

      const wrapper = mount(IssuerStatusWidget, {
        props: {
          issuerAddress: 'VOI123ABC'
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Issuer Status')
    })

    it('should display issuer details when loaded', async () => {
      vi.mocked(complianceService.getIssuerStatus).mockResolvedValue(mockStatus)

      const wrapper = mount(IssuerStatusWidget, {
        props: {
          issuerAddress: 'VOI123ABC'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Verified')
      expect(wrapper.text()).toContain('Test Company Ltd.')
      expect(wrapper.text()).toContain('United Kingdom')
    })

    it('should show error state when loading fails', async () => {
      vi.mocked(complianceService.getIssuerStatus).mockRejectedValue(
        new Error('Failed to load')
      )

      const wrapper = mount(IssuerStatusWidget, {
        props: {
          issuerAddress: 'VOI123ABC'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Failed to load status')
    })
  })

  describe('Status Display', () => {
    it('should show verified status with green color', async () => {
      vi.mocked(complianceService.getIssuerStatus).mockResolvedValue(mockStatus)

      const wrapper = mount(IssuerStatusWidget, {
        props: {
          issuerAddress: 'VOI123ABC'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('green')
      expect(wrapper.vm.getStatusLabel).toBe('Verified')
    })

    it('should show pending status with yellow color', async () => {
      vi.mocked(complianceService.getIssuerStatus).mockResolvedValue({
        ...mockStatus,
        isVerified: false,
        status: 'pending'
      })

      const wrapper = mount(IssuerStatusWidget, {
        props: {
          issuerAddress: 'VOI123ABC'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('yellow')
      expect(wrapper.vm.getStatusLabel).toBe('Pending Review')
    })

    it('should show incomplete status with orange color', async () => {
      vi.mocked(complianceService.getIssuerStatus).mockResolvedValue({
        ...mockStatus,
        isVerified: false,
        status: 'incomplete',
        missingFields: ['legalName', 'jurisdiction']
      })

      const wrapper = mount(IssuerStatusWidget, {
        props: {
          issuerAddress: 'VOI123ABC'
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(wrapper.vm.getIconColor).toBe('orange')
      expect(wrapper.vm.getStatusLabel).toBe('Incomplete')
    })
  })

  describe('Data Loading', () => {
    it('should call service with correct parameters', () => {
      vi.mocked(complianceService.getIssuerStatus).mockResolvedValue(mockStatus)

      mount(IssuerStatusWidget, {
        props: {
          issuerAddress: 'VOI123ABC'
        }
      })

      expect(complianceService.getIssuerStatus).toHaveBeenCalledWith('VOI123ABC')
    })

    it('should not load data if issuerAddress is missing', () => {
      mount(IssuerStatusWidget, {
        props: {
          issuerAddress: ''
        }
      })

      expect(complianceService.getIssuerStatus).not.toHaveBeenCalled()
    })
  })
})
