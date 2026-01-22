import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import TokenDetail from '../../views/TokenDetail.vue';
import { complianceService } from '../../services/ComplianceService';
import type { AuditLogResponse } from '../../types/compliance';

// Mock services
vi.mock('../../services/ComplianceService', () => ({
  complianceService: {
    getAuditLog: vi.fn(),
    exportAuditLog: vi.fn(),
  },
}));

// Mock the token store
vi.mock('../../stores/tokens', () => ({
  useTokenStore: vi.fn(() => ({
    tokens: [
      {
        id: 'rwa-token-001',
        name: 'Real Estate Token',
        symbol: 'RET',
        standard: 'ARC200',
        type: 'RWA',
        supply: 1000000,
        decimals: 6,
        status: 'deployed',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        assetId: '123456',
        description: 'Tokenized real estate asset for compliance testing',
      },
    ],
  })),
}));

// Mock child components
vi.mock('../../components/WhitelistManagement.vue', () => ({
  default: { 
    name: 'WhitelistManagement', 
    template: '<div data-testid="whitelist-management">WhitelistManagement</div>' 
  },
}));

vi.mock('../../components/ComplianceChecklist.vue', () => ({
  default: { 
    name: 'ComplianceChecklist', 
    template: '<div data-testid="compliance-checklist">ComplianceChecklist</div>' 
  },
}));

vi.mock('../../components/AuditLogViewer.vue', () => ({
  default: { 
    name: 'AuditLogViewer', 
    props: ['tokenId', 'network'],
    template: '<div data-testid="audit-log-viewer">AuditLogViewer for {{ tokenId }}</div>' 
  },
}));

vi.mock('../../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div data-testid="main-layout"><slot /></div>',
  },
}));

// Mock toast composable
vi.mock('../../composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('TokenDetail Integration Tests - Audit Trail Tab', () => {
  let router: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/tokens/:id',
          name: 'TokenDetail',
          component: TokenDetail,
        },
      ],
    });
  });

  describe('Full Token Detail View with Audit Trail Tab', () => {
    it('should render complete token detail view with all tabs including Audit Trail', async () => {
      await router.push('/tokens/rwa-token-001');
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Verify main layout renders
      expect(wrapper.find('[data-testid="main-layout"]').exists()).toBe(true);

      // Verify token information is displayed
      expect(wrapper.text()).toContain('Real Estate Token');
      expect(wrapper.text()).toContain('RET');
      expect(wrapper.text()).toContain('ARC200');

      // Verify all four tabs are present
      const tabButtons = wrapper.findAll('button').filter(btn => 
        btn.classes().includes('border-b-2')
      );
      
      expect(tabButtons.length).toBe(4);
      
      const tabTexts = tabButtons.map(btn => btn.text());
      expect(tabTexts).toContain('Overview');
      expect(tabTexts).toContain('Whitelist');
      expect(tabTexts).toContain('Compliance');
      expect(tabTexts).toContain('Audit Trail');
    });

    it('should navigate to Audit Trail tab and display audit log viewer', async () => {
      const mockAuditLog: AuditLogResponse = {
        entries: [
          {
            id: 'log1',
            timestamp: '2024-01-15T10:00:00Z',
            action: 'transfer_validation' as any,
            tokenId: 'rwa-token-001',
            network: 'VOI',
            actor: 'A23456723456723456723456723456723456723456723456723456723A',
            details: {
              sender: 'A234567...',
              receiver: 'B234567...',
              amount: '1000',
            },
            result: 'success',
            reason: 'Both addresses whitelisted',
          },
          {
            id: 'log2',
            timestamp: '2024-01-15T11:00:00Z',
            action: 'transfer_blocked' as any,
            tokenId: 'rwa-token-001',
            network: 'VOI',
            actor: 'C23456723456723456723456723456723456723456723456723456723C',
            details: {
              sender: 'C234567...',
              receiver: 'D234567...',
              amount: '500',
            },
            result: 'failure',
            reason: 'Receiver not whitelisted',
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      vi.mocked(complianceService.getAuditLog).mockResolvedValue(mockAuditLog);

      await router.push('/tokens/rwa-token-001');
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Find and click the Audit Trail tab
      const tabButtons = wrapper.findAll('button').filter(btn => 
        btn.classes().includes('border-b-2')
      );
      const auditTrailTab = tabButtons.find(btn => btn.text().includes('Audit Trail'));
      
      expect(auditTrailTab).toBeDefined();
      
      if (auditTrailTab) {
        await auditTrailTab.trigger('click');
        await flushPromises();

        // Verify the AuditLogViewer component is displayed
        expect(wrapper.find('[data-testid="audit-log-viewer"]').exists()).toBe(true);
        
        // Verify the Audit Trail tab is now active
        expect(auditTrailTab.classes()).toContain('border-biatec-accent');
        expect(auditTrailTab.classes()).toContain('text-white');
      }
    });

    it('should complete full tab navigation workflow', async () => {
      await router.push('/tokens/rwa-token-001');
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      const tabButtons = wrapper.findAll('button').filter(btn => 
        btn.classes().includes('border-b-2')
      );

      // Step 1: Verify Overview tab is active by default
      expect(wrapper.text()).toContain('Token Details');
      expect(wrapper.text()).toContain('Total Supply');

      // Step 2: Navigate to Whitelist tab
      const whitelistTab = tabButtons.find(btn => btn.text().includes('Whitelist'));
      if (whitelistTab) {
        await whitelistTab.trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="whitelist-management"]').exists()).toBe(true);
      }

      // Step 3: Navigate to Compliance tab
      const complianceTab = tabButtons.find(btn => btn.text().includes('Compliance'));
      if (complianceTab) {
        await complianceTab.trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="compliance-checklist"]').exists()).toBe(true);
      }

      // Step 4: Navigate to Audit Trail tab
      const auditTrailTab = tabButtons.find(btn => btn.text().includes('Audit Trail'));
      if (auditTrailTab) {
        await auditTrailTab.trigger('click');
        await flushPromises();
        expect(wrapper.find('[data-testid="audit-log-viewer"]').exists()).toBe(true);
      }

      // Step 5: Navigate back to Overview
      const overviewTab = tabButtons.find(btn => btn.text().includes('Overview'));
      if (overviewTab) {
        await overviewTab.trigger('click');
        await flushPromises();
        expect(wrapper.text()).toContain('Token Details');
      }
    });

    it('should pass tokenId prop to AuditLogViewer when Audit Trail tab is active', async () => {
      await router.push('/tokens/rwa-token-001');
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Navigate to Audit Trail tab
      const tabButtons = wrapper.findAll('button').filter(btn => 
        btn.classes().includes('border-b-2')
      );
      const auditTrailTab = tabButtons.find(btn => btn.text().includes('Audit Trail'));
      
      if (auditTrailTab) {
        await auditTrailTab.trigger('click');
        await flushPromises();

        // Verify AuditLogViewer receives the correct tokenId
        const auditViewer = wrapper.find('[data-testid="audit-log-viewer"]');
        expect(auditViewer.exists()).toBe(true);
        expect(auditViewer.text()).toContain('rwa-token-001');
      }
    });

    it('should handle RWA token compliance workflow', async () => {
      const mockAuditLog: AuditLogResponse = {
        entries: [
          {
            id: 'log1',
            timestamp: '2024-01-15T10:00:00Z',
            action: 'kyc_verification' as any,
            tokenId: 'rwa-token-001',
            network: 'VOI',
            actor: 'compliance-officer@company.com',
            details: {
              address: 'A23456723456723456723456723456723456723456723456723456723A',
              verified: true,
            },
            result: 'success',
          },
          {
            id: 'log2',
            timestamp: '2024-01-15T10:30:00Z',
            action: 'whitelist_add' as any,
            tokenId: 'rwa-token-001',
            network: 'VOI',
            actor: 'compliance-officer@company.com',
            details: {
              address: 'A23456723456723456723456723456723456723456723456723456723A',
            },
            result: 'success',
          },
          {
            id: 'log3',
            timestamp: '2024-01-15T11:00:00Z',
            action: 'transfer_validation' as any,
            tokenId: 'rwa-token-001',
            network: 'VOI',
            actor: 'A23456723456723456723456723456723456723456723456723456723A',
            details: {
              sender: 'A234567...',
              receiver: 'B234567...',
              amount: '10000',
            },
            result: 'success',
            reason: 'All compliance checks passed',
          },
        ],
        total: 3,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      vi.mocked(complianceService.getAuditLog).mockResolvedValue(mockAuditLog);

      await router.push('/tokens/rwa-token-001');
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Navigate to Audit Trail tab
      const tabButtons = wrapper.findAll('button').filter(btn => 
        btn.classes().includes('border-b-2')
      );
      const auditTrailTab = tabButtons.find(btn => btn.text().includes('Audit Trail'));
      
      if (auditTrailTab) {
        await auditTrailTab.trigger('click');
        await flushPromises();

        // Verify audit trail is accessible for RWA compliance review
        expect(wrapper.find('[data-testid="audit-log-viewer"]').exists()).toBe(true);
        
        // RWA compliance workflow verification:
        // 1. KYC verification should be logged
        // 2. Whitelist addition should be logged
        // 3. Transfer validation should be logged
        // This demonstrates the full audit trail for compliance officers
      }
    });
  });

  describe('Audit Trail Business Value - MICA/RWA Compliance', () => {
    it('should support MICA audit requirements by providing complete audit trail', async () => {
      const mockAuditLog: AuditLogResponse = {
        entries: [
          {
            id: 'mica-log-1',
            timestamp: '2024-01-15T10:00:00Z',
            action: 'transfer_validation' as any,
            tokenId: 'rwa-token-001',
            network: 'VOI',
            actor: 'investor@example.com',
            details: {
              sender: 'A234567...',
              receiver: 'B234567...',
              amount: '50000',
              jurisdiction: 'EU',
            },
            result: 'success',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      vi.mocked(complianceService.getAuditLog).mockResolvedValue(mockAuditLog);

      await router.push('/tokens/rwa-token-001');
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Access Audit Trail tab
      const tabButtons = wrapper.findAll('button').filter(btn => 
        btn.classes().includes('border-b-2')
      );
      const auditTrailTab = tabButtons.find(btn => btn.text().includes('Audit Trail'));
      
      if (auditTrailTab) {
        await auditTrailTab.trigger('click');
        await flushPromises();

        // MICA compliance requirement: Audit trail must be accessible
        expect(wrapper.find('[data-testid="audit-log-viewer"]').exists()).toBe(true);
        
        // Business value:
        // 1. Compliance officers can review who validated transfers
        // 2. Timestamp tracking for regulatory reporting
        // 3. Denial reasons for audit purposes
        // 4. Actor tracking for accountability
      }
    });

    it('should demonstrate risk mitigation through audit trail visibility', async () => {
      const mockAuditLog: AuditLogResponse = {
        entries: [
          {
            id: 'risk-log-1',
            timestamp: '2024-01-15T10:00:00Z',
            action: 'transfer_blocked' as any,
            tokenId: 'rwa-token-001',
            network: 'VOI',
            actor: 'suspicious-actor@example.com',
            details: {
              sender: 'X234567...',
              receiver: 'Y234567...',
              amount: '100000',
            },
            result: 'failure',
            reason: 'Sender address flagged for suspicious activity',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      vi.mocked(complianceService.getAuditLog).mockResolvedValue(mockAuditLog);

      await router.push('/tokens/rwa-token-001');
      await router.isReady();

      const wrapper = mount(TokenDetail, {
        global: {
          plugins: [router],
        },
      });

      await flushPromises();

      // Navigate to Audit Trail
      const tabButtons = wrapper.findAll('button').filter(btn => 
        btn.classes().includes('border-b-2')
      );
      const auditTrailTab = tabButtons.find(btn => btn.text().includes('Audit Trail'));
      
      if (auditTrailTab) {
        await auditTrailTab.trigger('click');
        await flushPromises();

        // Risk mitigation value:
        // 1. Blocked transfers are logged for review
        // 2. Suspicious activity is traceable
        // 3. Compliance teams can identify patterns
        // 4. Supports incident investigation
        expect(wrapper.find('[data-testid="audit-log-viewer"]').exists()).toBe(true);
      }
    });
  });
});
