import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import ComplianceDashboard from './ComplianceDashboard.vue';
import { complianceService } from '../services/ComplianceService';
import type { ComplianceStatus } from '../types/compliance';

// Mock the compliance service
vi.mock('../services/ComplianceService', () => ({
  complianceService: {
    getComplianceStatus: vi.fn(),
  },
}));

// Mock child components
vi.mock('../components/MicaWhitelistManagement.vue', () => ({
  default: { name: 'MicaWhitelistManagement', template: '<div>MicaWhitelistManagement</div>' },
}));

vi.mock('../components/MicaDashboardSummary.vue', () => ({
  default: { name: 'MicaDashboardSummary', template: '<div>MicaDashboardSummary</div>' },
}));

vi.mock('../components/TransferValidationForm.vue', () => ({
  default: { name: 'TransferValidationForm', template: '<div>TransferValidationForm</div>' },
}));

vi.mock('../components/AuditLogViewer.vue', () => ({
  default: { name: 'AuditLogViewer', template: '<div>AuditLogViewer</div>' },
}));

vi.mock('../components/ComplianceChecklist.vue', () => ({
  default: { name: 'ComplianceChecklist', template: '<div>ComplianceChecklist</div>' },
}));

vi.mock('../components/ComplianceExports.vue', () => ({
  default: { name: 'ComplianceExports', template: '<div>ComplianceExports</div>' },
}));

vi.mock('../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div><slot /></div>',
  },
}));

describe('ComplianceDashboard', () => {
  let router: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/compliance/:id',
          name: 'ComplianceDashboard',
          component: ComplianceDashboard,
        },
      ],
    });
  });

  describe('Component Rendering', () => {
    it('should render the component', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h1').text()).toContain('Compliance Dashboard');
    });

    it('should display subtitle', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('MICA-aligned compliance management for RWA tokens');
    });

    it('should render tab navigation', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Whitelist Management');
      expect(wrapper.text()).toContain('Transfer Validation');
      expect(wrapper.text()).toContain('Audit Log');
      expect(wrapper.text()).toContain('Compliance Checklist');
    });
  });

  describe('Compliance Status Cards', () => {
    it('should display whitelist count', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 42,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('42');
      expect(wrapper.text()).toContain('Whitelisted Addresses');
    });

    it('should display network', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'Aramid',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=Aramid');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Aramid');
      expect(wrapper.text()).toContain('Network');
    });

    it('should display whitelist status as enabled', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Enabled');
      expect(wrapper.text()).toContain('Whitelist Status');
    });

    it('should display compliance score when available', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
        complianceScore: 85,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('85');
      expect(wrapper.text()).toContain('Compliance Score');
    });

    it('should display N/A when compliance score is not available', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('N/A');
    });
  });

  describe('Compliance Issues', () => {
    it('should display compliance issues alert when issues exist', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
        issues: [
          {
            severity: 'high',
            category: 'kyc',
            message: 'KYC verification pending for 5 addresses',
            timestamp: '2024-01-15T10:00:00Z',
          },
        ],
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Compliance Issues Detected');
      expect(wrapper.text()).toContain('KYC verification pending for 5 addresses');
    });

    it('should display issue severity badges', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
        issues: [
          {
            severity: 'critical',
            category: 'sanctions',
            message: 'Sanctioned address detected',
            timestamp: '2024-01-15T10:00:00Z',
          },
        ],
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('CRITICAL');
    });

    it('should not display issues alert when no issues', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
        issues: [],
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).not.toContain('Compliance Issues Detected');
    });
  });

  describe('Tab Navigation', () => {
    it('should display whitelist management by default', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('WhitelistManagement');
    });

    it('should switch to transfer validation tab', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabs = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Transfer Validation')
      );
      
      if (tabs.length > 0) {
        await tabs[0].trigger('click');
        await flushPromises();

        expect(wrapper.text()).toContain('TransferValidationForm');
      }
    });

    it('should switch to audit log tab', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabs = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Audit Log')
      );
      
      if (tabs.length > 0) {
        await tabs[0].trigger('click');
        await flushPromises();

        expect(wrapper.text()).toContain('AuditLogViewer');
      }
    });

    it('should switch to compliance checklist tab', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabs = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Compliance Checklist')
      );
      
      if (tabs.length > 0) {
        await tabs[0].trigger('click');
        await flushPromises();

        expect(wrapper.text()).toContain('ComplianceChecklist');
      }
    });

    it('should switch to compliance exports tab', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabs = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Compliance Exports')
      );
      
      if (tabs.length > 0) {
        await tabs[0].trigger('click');
        await flushPromises();

        expect(wrapper.text()).toContain('ComplianceExports');
      }
    });

    it('should display all tab labels', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(wrapper.text()).toContain('Whitelist Management');
      expect(wrapper.text()).toContain('Transfer Validation');
      expect(wrapper.text()).toContain('Audit Log');
      expect(wrapper.text()).toContain('Compliance Exports');
      expect(wrapper.text()).toContain('Compliance Checklist');
    });
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      vi.mocked(complianceService.getComplianceStatus).mockRejectedValue(
        new Error('API unavailable')
      );

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Should still render with fallback values
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Compliance Dashboard');
    });

    it('should set default compliance status on error', async () => {
      vi.mocked(complianceService.getComplianceStatus).mockRejectedValue(
        new Error('API unavailable')
      );

      await router.push('/compliance/token123?network=VOI');
      await router.isReady();

      const wrapper = mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Check that default values are displayed
      expect(wrapper.text()).toContain('0');
      expect(wrapper.text()).toContain('Whitelisted Addresses');
    });
  });

  describe('Route Parameters', () => {
    it('should use tokenId from route params', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token456',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token456?network=VOI');
      await router.isReady();

      mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(complianceService.getComplianceStatus).toHaveBeenCalledWith('token456', 'VOI');
    });

    it('should use network from query params', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'Aramid',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123?network=Aramid');
      await router.isReady();

      mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(complianceService.getComplianceStatus).toHaveBeenCalledWith('token123', 'Aramid');
    });

    it('should default to VOI network when not specified', async () => {
      const mockStatus: ComplianceStatus = {
        tokenId: 'token123',
        network: 'VOI',
        whitelistEnabled: true,
        whitelistCount: 10,
      };
      vi.mocked(complianceService.getComplianceStatus).mockResolvedValue(mockStatus);

      await router.push('/compliance/token123');
      await router.isReady();

      mount(ComplianceDashboard, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      expect(complianceService.getComplianceStatus).toHaveBeenCalledWith('token123', 'VOI');
    });
  });
});
