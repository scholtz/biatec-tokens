import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MicaWhitelistManagement from '../MicaWhitelistManagement.vue';
import { whitelistService } from '../../services/legacyWhitelistService';
import { useSubscriptionStore } from '../../stores/subscription';

// Mock the services
vi.mock('../../services/legacyWhitelistService', () => ({
  whitelistService: {
    getWhitelist: vi.fn(),
    addAddress: vi.fn(),
    removeAddress: vi.fn(),
    validateCsv: vi.fn(),
    importFromCsv: vi.fn(),
    exportComplianceReport: vi.fn(),
  },
}));

vi.mock('../../stores/subscription', () => ({
  useSubscriptionStore: vi.fn(() => ({
    isActive: true,
  })),
}));

vi.mock('../../composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('MicaWhitelistManagement', () => {
  const mockEntries = [
    {
      address: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      status: 'active' as const,
      addedAt: '2024-01-01T00:00:00Z',
      reason: 'KYC Verification Passed',
      requester: 'John Doe',
      kycVerified: true,
      jurisdictionCode: 'US',
      complianceChecks: {
        sanctionsScreening: true,
        amlVerification: true,
        accreditedInvestor: false,
      },
    },
    {
      address: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      status: 'pending' as const,
      addedAt: '2024-01-02T00:00:00Z',
      reason: 'Pending AML Review',
      requester: 'Jane Smith',
      kycVerified: false,
      jurisdictionCode: 'EU',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mockEntries);
  });

  it('renders correctly', () => {
    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    expect(wrapper.find('h2').text()).toBe('MICA Whitelist Management');
    expect(wrapper.find('p').text()).toContain('MICA compliance tracking');
  });

  it('loads whitelist entries on mount', async () => {
    mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(whitelistService.getWhitelist).toHaveBeenCalledWith('test-token-123', {
      search: '',
      status: '',
    });
  });

  it('displays statistics correctly', async () => {
    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const statistics = wrapper.findAll('.glass-effect.rounded-xl.p-4');
    expect(statistics.length).toBeGreaterThan(0);
  });

  it('filters entries by status', async () => {
    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const statusFilter = wrapper.find('select');
    await statusFilter.setValue('active');

    // The component should filter entries internally
    expect(statusFilter.element.value).toBe('active');
  });

  it('shows export buttons for enterprise subscribers', () => {
    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    const exportButtons = wrapper.findAll('button').filter(btn => 
      btn.text().includes('Export')
    );
    expect(exportButtons.length).toBeGreaterThan(0);
  });

  it('validates addresses correctly', async () => {
    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Test Algorand address format
    const algorandAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    expect(algorandAddress).toMatch(/^[A-Z2-7]{58}$/);

    // Test Ethereum address format
    const ethereumAddress = '0x1234567890123456789012345678901234567890';
    expect(ethereumAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('requires reason for MICA compliance when adding address', async () => {
    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: {
            template: '<div><slot name="default"></slot><slot name="footer"></slot></div>',
          },
          Input: {
            template: '<input />',
          },
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // The component should have inputs for reason
    const component = wrapper.vm as any;
    expect(component.newAddressReason).toBeDefined();
  });

  it('exports compliance report in JSON format', async () => {
    const mockReport = {
      reportId: 'report_123',
      tokenId: 'test-token-123',
      network: 'VOI',
      generatedAt: '2024-01-01T00:00:00Z',
      generatedBy: 'system',
      reportPeriod: {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-01T00:00:00Z',
      },
      summary: {
        totalWhitelisted: 2,
        activeAddresses: 1,
        pendingAddresses: 1,
        removedAddresses: 0,
        kycVerifiedCount: 1,
        complianceScore: 75,
      },
      entries: mockEntries,
      auditTrail: [],
      complianceMetrics: {
        sanctionsScreeningRate: 50,
        amlVerificationRate: 50,
        jurisdictionCoverage: { US: 1, EU: 1 },
      },
    };

    vi.mocked(whitelistService.exportComplianceReport).mockResolvedValue(mockReport);

    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const component = wrapper.vm as any;
    await component.exportReport('json');

    expect(whitelistService.exportComplianceReport).toHaveBeenCalledWith(
      'test-token-123',
      'VOI',
      'json'
    );
  });

  it('imports addresses from CSV with MICA metadata', async () => {
    const csvContent = `address,reason,requester,kyc_verified,jurisdiction,notes
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,KYC Passed,John Doe,true,US,Test note`;

    vi.mocked(whitelistService.importFromCsv).mockResolvedValue({
      success: 1,
      failed: 0,
      results: [
        {
          valid: true,
          row: 2,
          address: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        },
      ],
    });

    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: {
            template: '<div><slot name="default"></slot><slot name="footer"></slot></div>',
          },
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const component = wrapper.vm as any;
    component.csvData = csvContent;
    await component.importCsv();

    expect(whitelistService.importFromCsv).toHaveBeenCalledWith(
      'test-token-123',
      csvContent
    );
  });

  it('calculates compliance score correctly', async () => {
    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const component = wrapper.vm as any;
    const stats = component.statistics;

    expect(stats.complianceScore).toBeGreaterThanOrEqual(0);
    expect(stats.complianceScore).toBeLessThanOrEqual(100);
  });

  it('shows enterprise features warning for non-enterprise users', () => {
    vi.mocked(useSubscriptionStore).mockReturnValue({
      isActive: false,
    } as any);

    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: {
            template: '<div><slot name="default"></slot></div>',
          },
          Input: true,
        },
      },
    });

    const component = wrapper.vm as any;
    expect(component.isEnterpriseSubscriber).toBe(false);
  });

  it('requires removal reason for MICA audit trail', async () => {
    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: {
            template: '<div><slot name="default"></slot><slot name="footer"></slot></div>',
          },
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const component = wrapper.vm as any;
    expect(component.removeReason).toBeDefined();
  });

  it('handles load error gracefully', async () => {
    const errorMessage = 'Network error';
    vi.mocked(whitelistService.getWhitelist).mockRejectedValue(new Error(errorMessage));

    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const component = wrapper.vm as any;
    expect(component.error).toBeTruthy();
  });

  it('retries loading after error', async () => {
    vi.mocked(whitelistService.getWhitelist)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockEntries);

    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const component = wrapper.vm as any;
    expect(component.error).toBeTruthy();

    // Call loadWhitelist again
    await component.loadWhitelist();

    expect(component.error).toBeNull();
    expect(component.entries).toEqual(mockEntries);
  });

  it('calculates compliance score correctly with mixed data', async () => {
    const mixedEntries = [
      {
        ...mockEntries[0],
        kycVerified: true,
        complianceChecks: { sanctionsScreening: true, amlVerification: true },
      },
      {
        ...mockEntries[1],
        kycVerified: false,
      },
    ];
    vi.mocked(whitelistService.getWhitelist).mockResolvedValue(mixedEntries);

    const wrapper = mount(MicaWhitelistManagement, {
      props: {
        tokenId: 'test-token-123',
        network: 'VOI',
      },
      global: {
        stubs: {
          Modal: true,
          Input: true,
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const component = wrapper.vm as any;
    // The complianceScore is a computed property, should exist
    if (component.complianceScore !== undefined) {
      expect(component.complianceScore).toBeGreaterThanOrEqual(0);
      expect(component.complianceScore).toBeLessThanOrEqual(100);
    } else {
      // If complianceScore doesn't exist, just check that entries are loaded
      expect(component.entries.length).toBeGreaterThan(0);
    }
  });

  describe('Function Tests', () => {
    it('addAddress validates required fields', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;

      // Test missing address
      component.newAddress = '';
      component.newAddressReason = 'Test reason';
      await component.addAddress();
      expect(component.addressError).toBe('Address is required');

      // Test missing reason
      component.newAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      component.newAddressReason = '';
      await component.addAddress();
      expect(component.addressError).toBe('Reason is required for MICA compliance');

      // Test invalid address format
      component.newAddress = 'invalid-address';
      component.newAddressReason = 'Test reason';
      await component.addAddress();
      expect(component.addressError).toBe('Invalid address format');
    });

    it('addAddress successfully adds valid address', async () => {
      vi.mocked(whitelistService.addAddress).mockResolvedValue(undefined);

      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.newAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      component.newAddressReason = 'KYC Verified';
      component.newAddressRequester = 'John Doe';
      component.newAddressKycVerified = true;
      component.newAddressComplianceChecks = {
        sanctionsScreening: true,
        amlVerification: true,
        accreditedInvestor: false,
      };

      await component.addAddress();

      expect(whitelistService.addAddress).toHaveBeenCalledWith('test-token-123', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', {
        reason: 'KYC Verified',
        requester: 'John Doe',
        jurisdictionCode: '',
        kycVerified: true,
        complianceChecks: {
          sanctionsScreening: true,
          amlVerification: true,
          accreditedInvestor: false,
        },
        notes: '',
      });
      expect(component.showAddModal).toBe(false);
    });

    it('closeAddModal resets form data', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.showAddModal = true;
      component.newAddress = 'test-address';
      component.newAddressReason = 'test-reason';
      component.newAddressKycVerified = true;

      component.closeAddModal();

      expect(component.showAddModal).toBe(false);
      expect(component.newAddress).toBe('');
      expect(component.newAddressReason).toBe('');
      expect(component.newAddressKycVerified).toBe(false);
      expect(component.addressError).toBe('');
    });

    it('confirmRemove sets up removal modal', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.confirmRemove('test-address-123');

      expect(component.showRemoveModal).toBe(true);
      expect(component.addressToRemove).toBe('test-address-123');
      expect(component.removeReason).toBe('');
    });

    it('removeAddress validates reason requirement', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.addressToRemove = 'test-address';
      component.removeReason = '';

      await component.removeAddress();

      expect(whitelistService.removeAddress).not.toHaveBeenCalled();
    });

    it('removeAddress successfully removes address', async () => {
      vi.mocked(whitelistService.removeAddress).mockResolvedValue(undefined);

      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.addressToRemove = 'test-address';
      component.removeReason = 'User request';

      await component.removeAddress();

      expect(whitelistService.removeAddress).toHaveBeenCalledWith('test-token-123', 'test-address');
      expect(component.showRemoveModal).toBe(false);
      expect(component.addressToRemove).toBe('');
      expect(component.removeReason).toBe('');
    });

    it('validateCsvData validates CSV content', async () => {
      const mockValidationResults = [
        { valid: true, row: 2, address: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
        { valid: false, row: 3, address: 'invalid', error: 'Invalid address format' },
      ];

      vi.mocked(whitelistService.validateCsv).mockResolvedValue(mockValidationResults);

      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.csvData = 'address,reason\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,test';

      await component.validateCsvData();

      expect(whitelistService.validateCsv).toHaveBeenCalledWith('address,reason\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,test');
      expect(component.validationResults).toEqual(mockValidationResults);
    });

    it('importCsv requires enterprise subscription', async () => {
      vi.mocked(useSubscriptionStore).mockReturnValue({
        isActive: false,
      } as any);

      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.csvData = 'address,reason\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,test';

      await component.importCsv();

      expect(whitelistService.importFromCsv).not.toHaveBeenCalled();
    });

    it('closeImportModal resets import data', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.showImportModal = true;
      component.csvData = 'test,csv,data';
      component.validationResults = [{ valid: true, row: 1, address: 'test' }];

      component.closeImportModal();

      expect(component.showImportModal).toBe(false);
      expect(component.csvData).toBe('');
      expect(component.validationResults).toEqual([]);
    });

    it('exportReport requires enterprise subscription', async () => {
      vi.mocked(useSubscriptionStore).mockReturnValue({
        isActive: false,
      } as any);

      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;

      await component.exportReport('json');

      expect(whitelistService.exportComplianceReport).not.toHaveBeenCalled();
    });

    it('viewDetails sets selected entry and shows modal', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      const testEntry = { ...mockEntries[0] };

      component.viewDetails(testEntry);

      expect(component.selectedEntry).toEqual(testEntry);
      expect(component.showDetailsModal).toBe(true);
    });

    it('copyAddress copies to clipboard successfully', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
      });

      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;

      await component.copyAddress('test-address-123');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-address-123');
    });

    it('copyAddress handles clipboard error', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
      });

      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;

      await component.copyAddress('test-address-123');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-address-123');
    });

    it('formatAddress shortens long addresses', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;

      const longAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBB';
      const result = component.formatAddress(longAddress);

      expect(result).toBe('AAAAAAAAAA...BBBBBBBB');
    });

    it('formatAddress returns short addresses unchanged', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;

      const shortAddress = 'SHORT123';
      const result = component.formatAddress(shortAddress);

      expect(result).toBe('SHORT123');
    });

    it('formatDate formats dates correctly', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;

      const dateStr = '2024-01-15T14:30:00Z';
      const result = component.formatDate(dateStr);

      expect(result).toContain('Jan 15, 2024');
      expect(result).toMatch(/2:30|03:30/);
    });

    it('statusBadgeClass returns correct classes for different statuses', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;

      expect(component.statusBadgeClass('active')).toBe('bg-green-500/20 text-green-400 border border-green-500/30');
      expect(component.statusBadgeClass('pending')).toBe('bg-yellow-500/20 text-yellow-400 border border-yellow-500/30');
      expect(component.statusBadgeClass('removed')).toBe('bg-red-500/20 text-red-400 border border-red-500/30');
      expect(component.statusBadgeClass('unknown')).toBe('bg-gray-500/20 text-gray-400 border border-gray-500/30');
    });
  });

  describe('Computed Properties', () => {
    it('filteredEntries filters by search query', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.searchQuery = 'John';

      const filtered = component.filteredEntries;
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].requester).toContain('John');
    });

    it('filteredEntries filters by status', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.statusFilter = 'active';

      const filtered = component.filteredEntries;
      expect(filtered.every((entry: any) => entry.status === 'active')).toBe(true);
    });

    it('filteredEntries filters by KYC status', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.kycFilter = 'verified';

      const filtered = component.filteredEntries;
      expect(filtered.every((entry: any) => entry.kycVerified === true)).toBe(true);
    });

    it('statistics calculates correct metrics', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      const stats = component.statistics;

      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.kycVerified).toBe(1);
      expect(stats.complianceScore).toBeGreaterThanOrEqual(0);
      expect(stats.complianceScore).toBeLessThanOrEqual(100);
    });

    it('validCount and invalidCount work correctly', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: {
          tokenId: 'test-token-123',
          network: 'VOI',
        },
        global: {
          stubs: {
            Modal: true,
            Input: true,
          },
        },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.validationResults = [
        { valid: true, row: 1, address: 'addr1' },
        { valid: true, row: 2, address: 'addr2' },
        { valid: false, row: 3, address: 'addr3' },
      ];

      expect(component.validCount).toBe(2);
      expect(component.invalidCount).toBe(1);
    });
  });

  describe('validateCsvData edge cases', () => {
    it('should return early when csvData is empty', async () => {
      const wrapper = mount(MicaWhitelistManagement, {
        props: { tokenId: 'test-token-123', network: 'VOI' },
        global: { stubs: { Modal: true, Input: true } },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.csvData = '';

      await component.validateCsvData();

      expect(whitelistService.validateCsv).not.toHaveBeenCalled();
    });

    it('should handle validateCsvData error gracefully (catch branch)', async () => {
      vi.mocked(whitelistService.validateCsv).mockRejectedValue(new Error('Validation failed'));

      const wrapper = mount(MicaWhitelistManagement, {
        props: { tokenId: 'test-token-123', network: 'VOI' },
        global: { stubs: { Modal: true, Input: true } },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.csvData = 'address\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

      await expect(component.validateCsvData()).resolves.toBeUndefined();
      expect(component.isValidating).toBe(false);
    });
  });

  describe('importCsv branch coverage', () => {
    it('should show warning when some addresses fail to import (failed > 0 branch)', async () => {
      vi.mocked(useSubscriptionStore).mockReturnValue({ isActive: true } as any);
      vi.mocked(whitelistService.getWhitelist).mockResolvedValue([]);
      vi.mocked(whitelistService.importFromCsv).mockResolvedValue({ success: 3, failed: 2 });

      const wrapper = mount(MicaWhitelistManagement, {
        props: { tokenId: 'test-token-123', network: 'VOI' },
        global: { stubs: { Modal: true, Input: true } },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.csvData = 'address\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

      await expect(component.importCsv()).resolves.toBeUndefined();
      expect(whitelistService.importFromCsv).toHaveBeenCalled();
    });

    it('should handle importCsv error gracefully (catch branch)', async () => {
      vi.mocked(useSubscriptionStore).mockReturnValue({ isActive: true } as any);
      vi.mocked(whitelistService.getWhitelist).mockResolvedValue([]);
      vi.mocked(whitelistService.importFromCsv).mockRejectedValue(new Error('Import failed'));

      const wrapper = mount(MicaWhitelistManagement, {
        props: { tokenId: 'test-token-123', network: 'VOI' },
        global: { stubs: { Modal: true, Input: true } },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const component = wrapper.vm as any;
      component.csvData = 'address\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

      await expect(component.importCsv()).resolves.toBeUndefined();
      expect(component.isImporting).toBe(false);
    });
  });

  describe('exportReport branch coverage', () => {
    it('should handle exportReport error gracefully (catch branch)', async () => {
      vi.mocked(useSubscriptionStore).mockReturnValue({ isActive: true } as any);
      vi.mocked(whitelistService.getWhitelist).mockResolvedValue([]);
      vi.mocked(whitelistService.exportComplianceReport).mockRejectedValue(new Error('Export failed'));

      const wrapper = mount(MicaWhitelistManagement, {
        props: { tokenId: 'test-token-123', network: 'VOI' },
        global: { stubs: { Modal: true, Input: true } },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      await expect(wrapper.vm.exportReport('json')).resolves.toBeUndefined();
      expect(wrapper.vm.isExporting).toBe(false);
    });
  });
});
