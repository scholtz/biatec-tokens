import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TokenComplianceSummaryCard from '../TokenComplianceSummaryCard.vue';
import type { Token } from '../../../stores/tokens';
import type { ComplianceGaps } from '../TokenComplianceSummaryCard.vue';

// Mock components
import { defineComponent } from 'vue';
const MockBadge = defineComponent({ name: 'Badge', template: '<span><slot /></span>' });
const MockRiskIndicatorBadge = defineComponent({ 
  name: 'RiskIndicatorBadge', 
  props: ['riskLevel'],
  template: '<span>{{ riskLevel }}</span>' 
});

describe('TokenComplianceSummaryCard Component', () => {
  let mockToken: Token;

  beforeEach(() => {
    mockToken = {
      id: 'token-1',
      name: 'Test Token',
      symbol: 'TEST',
      standard: 'ARC200',
      type: 'FT',
      supply: 1000000,
      decimals: 6,
      description: 'A test token',
      status: 'deployed',
      createdAt: new Date(),
      assetId: 12345,
      complianceMetadata: {
        issuerLegalName: 'Test Corp',
        issuerRegistrationNumber: '123456',
        issuerJurisdiction: 'US',
        micaTokenClassification: 'utility',
        tokenPurpose: 'Test purposes',
        kycRequired: true,
        complianceContactEmail: 'compliance@test.com',
        micaReady: true,
        whitelistRequired: true,
        jurisdictionRestrictions: ['CN', 'RU'],
        issuerVerified: true,
      },
      attestationMetadata: {
        enabled: true,
        attestations: [
          {
            id: 'att-1',
            type: 'kyc_aml',
            status: 'verified',
            verifiedAt: new Date().toISOString(),
          },
          {
            id: 'att-2',
            type: 'jurisdiction',
            status: 'verified',
            verifiedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as any;
  });

  describe('Component Rendering', () => {
    it('should render token name and symbol', () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('Test Token');
      expect(wrapper.text()).toContain('TEST');
    });

    it('should render asset ID', () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('12345');
    });

    it('should show "N/A" when asset ID is missing', () => {
      const tokenWithoutAssetId = { ...mockToken, assetId: undefined };
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: tokenWithoutAssetId,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('N/A');
    });
  });

  describe('MICA Readiness Calculation', () => {
    it('should calculate 100% MICA score for fully compliant token', () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('100% compliant');
      expect(wrapper.text()).toContain('MICA Ready');
    });

    it('should show 0% for token without compliance metadata', () => {
      const tokenWithoutCompliance = { ...mockToken, complianceMetadata: undefined };
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: tokenWithoutCompliance,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('0% compliant');
      expect(wrapper.text()).toContain('Non-Compliant');
    });

    it('should show partial compliance for incomplete metadata', () => {
      const partialToken = {
        ...mockToken,
        complianceMetadata: {
          ...mockToken.complianceMetadata,
          micaReady: false,
          issuerVerified: false,
        },
      } as any;

      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: partialToken,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('50% compliant');
    });
  });

  describe('Attestation Coverage', () => {
    it('should calculate attestation percentage correctly', () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      // 2 out of 5 attestation types = 40%
      expect(wrapper.text()).toContain('40%');
      expect(wrapper.text()).toContain('2 of 5 attestation types');
    });

    it('should show 0% when no attestations exist', () => {
      const tokenWithoutAttestations = { ...mockToken, attestationMetadata: undefined };
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: tokenWithoutAttestations,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('0%');
      expect(wrapper.text()).toContain('0 of 5 attestation types');
    });
  });

  describe('Audit Trail Coverage', () => {
    it('should display audit entry count', () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
          auditEntryCount: 15,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('15 audit entries recorded');
    });

    it('should calculate coverage based on audit entries', () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
          auditEntryCount: 5, // 5/10 * 100 = 50%
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('50%');
    });

    it('should cap audit coverage at 100%', () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
          auditEntryCount: 50, // More than 10 should still show 100%
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('100%');
    });
  });

  describe('Compliance Gaps', () => {
    it('should display gaps when provided', () => {
      const gaps: ComplianceGaps = {
        missingAttestations: ['kyc_aml', 'accredited_investor'],
        incompleteJurisdiction: true,
        expiredEvidence: false,
        failedValidations: [],
      };

      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
          gaps,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.text()).toContain('gap(s) detected');
      expect(wrapper.text()).toContain('Missing 2 required attestation(s)');
      expect(wrapper.text()).toContain('Jurisdiction restrictions not fully configured');
    });

    it('should not show gaps section when no gaps exist', () => {
      const noGaps: ComplianceGaps = {
        missingAttestations: [],
        incompleteJurisdiction: false,
        expiredEvidence: false,
        failedValidations: [],
      };

      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
          gaps: noGaps,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      // Should not contain gap warning icon
      const text = wrapper.text();
      expect(text).not.toContain('gap(s) detected');
    });
  });

  describe('Risk Level Calculation', () => {
    it('should calculate low risk for fully compliant token', () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
          auditEntryCount: 15,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      // RiskIndicatorBadge should receive 'low' as prop
      expect(wrapper.findComponent(MockRiskIndicatorBadge).props('riskLevel')).toBe('low');
    });

    it('should calculate high risk for non-compliant token', () => {
      const nonCompliantToken = {
        ...mockToken,
        complianceMetadata: undefined,
        attestationMetadata: undefined,
      };

      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: nonCompliantToken,
          auditEntryCount: 0,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      expect(wrapper.findComponent(MockRiskIndicatorBadge).props('riskLevel')).toBe('high');
    });
  });

  describe('User Actions', () => {
    it('should emit view-details event when clicking View Details', async () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      const viewDetailsButton = wrapper.findAll('button').find(btn => btn.text().includes('View Details'));
      await viewDetailsButton?.trigger('click');

      expect(wrapper.emitted('view-details')).toBeTruthy();
      expect(wrapper.emitted('view-details')?.[0]).toEqual(['token-1']);
    });

    it('should emit export-evidence event when clicking Export', async () => {
      const wrapper = mount(TokenComplianceSummaryCard, {
        props: {
          token: mockToken,
        },
        global: {
          components: {
            Badge: MockBadge,
            RiskIndicatorBadge: MockRiskIndicatorBadge,
          },
        },
      });

      const exportButton = wrapper.findAll('button').find(btn => btn.text().includes('Export'));
      await exportButton?.trigger('click');

      expect(wrapper.emitted('export-evidence')).toBeTruthy();
      expect(wrapper.emitted('export-evidence')?.[0]).toEqual(['token-1']);
    });
  });
});
