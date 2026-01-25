import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTokenStore } from '../../stores/tokens';

describe('ARC-200 Token Templates Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Template Availability', () => {
    it('should have 6 new ARC-200 templates in addition to existing ones', () => {
      const store = useTokenStore();
      
      const arc200Templates = store.tokenTemplates.filter(t => t.standard === 'ARC200');
      
      // Should have at least 8 ARC-200 templates (2 original + 6 new)
      expect(arc200Templates.length).toBeGreaterThanOrEqual(8);
      
      // Verify new templates exist
      const newTemplateIds = [
        'voi-arc200-utility',
        'aramid-arc200-payment',
        'voi-arc200-governance',
        'aramid-arc200-stablecoin',
        'voi-arc200-rewards',
        'aramid-arc200-security'
      ];
      
      newTemplateIds.forEach(id => {
        const template = store.tokenTemplates.find(t => t.id === id);
        expect(template).toBeDefined();
        expect(template?.standard).toBe('ARC200');
      });
    });

    it('should have all ARC-200 templates marked as fungible tokens', () => {
      const store = useTokenStore();
      
      const arc200Templates = store.tokenTemplates.filter(t => t.standard === 'ARC200');
      
      arc200Templates.forEach(template => {
        expect(template.type).toBe('FT');
      });
    });

    it('should have all ARC-200 templates marked as MICA compliant', () => {
      const store = useTokenStore();
      
      const arc200Templates = store.tokenTemplates.filter(t => t.standard === 'ARC200');
      
      arc200Templates.forEach(template => {
        expect(template.micaCompliant).toBe(true);
      });
    });
  });

  describe('Network-Specific Defaults - VOI Templates', () => {
    it('should have VOI ARC-200 Utility Token with DeFi-focused defaults', () => {
      const store = useTokenStore();
      
      const template = store.tokenTemplates.find(t => t.id === 'voi-arc200-utility');
      
      expect(template).toBeDefined();
      expect(template?.network).toBe('VOI');
      expect(template?.name).toBe('VOI ARC-200 Utility Token');
      expect(template?.defaults.supply).toBe(10000000);
      expect(template?.defaults.decimals).toBe(6);
      expect(template?.description).toContain('programmable');
      expect(template?.useCases).toContain('DeFi protocols');
      expect(template?.guidance).toContain('DeFi');
    });

    it('should have VOI ARC-200 Governance Token with voting features', () => {
      const store = useTokenStore();
      
      const template = store.tokenTemplates.find(t => t.id === 'voi-arc200-governance');
      
      expect(template).toBeDefined();
      expect(template?.network).toBe('VOI');
      expect(template?.name).toBe('VOI ARC-200 Governance Token');
      expect(template?.defaults.supply).toBe(100000000);
      expect(template?.defaults.decimals).toBe(6);
      expect(template?.description).toContain('voting');
      expect(template?.useCases).toContain('DAO voting');
      expect(template?.guidance).toContain('governance');
    });

    it('should have VOI ARC-200 Rewards Token with vesting controls', () => {
      const store = useTokenStore();
      
      const template = store.tokenTemplates.find(t => t.id === 'voi-arc200-rewards');
      
      expect(template).toBeDefined();
      expect(template?.network).toBe('VOI');
      expect(template?.name).toBe('VOI ARC-200 Rewards Token');
      expect(template?.defaults.supply).toBe(50000000);
      expect(template?.defaults.decimals).toBe(6);
      expect(template?.description).toContain('vesting');
      expect(template?.useCases).toContain('Staking rewards');
    });

    it('should have lower compliance overhead for VOI templates', () => {
      const store = useTokenStore();
      
      const voiTemplates = store.tokenTemplates.filter(
        t => t.standard === 'ARC200' && t.network === 'VOI'
      );
      
      voiTemplates.forEach(template => {
        // VOI templates should focus on utility/governance, not heavy regulations
        expect(template.compliance).not.toContain('mandatory whitelisting');
        expect(template.compliance).not.toContain('KYC/AML');
        expect(template.description).toBeDefined();
      });
    });
  });

  describe('Network-Specific Defaults - Aramid Templates', () => {
    it('should have Aramid ARC-200 Payment Token with compliance controls', () => {
      const store = useTokenStore();
      
      const template = store.tokenTemplates.find(t => t.id === 'aramid-arc200-payment');
      
      expect(template).toBeDefined();
      expect(template?.network).toBe('Aramid');
      expect(template?.name).toBe('Aramid ARC-200 Payment Token');
      expect(template?.defaults.supply).toBe(50000000);
      expect(template?.defaults.decimals).toBe(8); // Higher decimals for payments
      expect(template?.description).toContain('transfer controls');
      expect(template?.compliance).toContain('e-money');
      expect(template?.guidance).toContain('compliance controls');
    });

    it('should have Aramid ARC-200 Stablecoin with reserve management', () => {
      const store = useTokenStore();
      
      const template = store.tokenTemplates.find(t => t.id === 'aramid-arc200-stablecoin');
      
      expect(template).toBeDefined();
      expect(template?.network).toBe('Aramid');
      expect(template?.name).toBe('Aramid ARC-200 Stablecoin');
      expect(template?.defaults.supply).toBe(100000000);
      expect(template?.defaults.decimals).toBe(6);
      expect(template?.description).toContain('reserve management');
      expect(template?.compliance).toContain('MICA');
      expect(template?.compliance).toContain('e-money');
    });

    it('should have Aramid ARC-200 Security Token with mandatory controls', () => {
      const store = useTokenStore();
      
      const template = store.tokenTemplates.find(t => t.id === 'aramid-arc200-security');
      
      expect(template).toBeDefined();
      expect(template?.network).toBe('Aramid');
      expect(template?.name).toBe('Aramid ARC-200 Security Token');
      expect(template?.defaults.supply).toBe(1000000);
      expect(template?.defaults.decimals).toBe(0); // No decimals for securities
      expect(template?.description).toContain('whitelisting');
      expect(template?.compliance.toLowerCase()).toContain('mandatory');
      expect(template?.compliance).toContain('KYC/AML');
      expect(template?.guidance).toContain('legal opinion');
    });

    it('should have enhanced compliance features for Aramid templates', () => {
      const store = useTokenStore();
      
      const aramidTemplates = store.tokenTemplates.filter(
        t => t.standard === 'ARC200' && t.network === 'Aramid'
      );
      
      aramidTemplates.forEach(template => {
        // Aramid templates should have MICA-related compliance guidance
        expect(template.compliance).toContain('MICA');
        expect(template.compliance.length).toBeGreaterThan(50);
        expect(template.guidance).toBeDefined();
      });
    });
  });

  describe('Compliance Metadata Prefilling', () => {
    it('should have different compliance requirements for VOI vs Aramid', () => {
      const store = useTokenStore();
      
      const voiUtility = store.tokenTemplates.find(t => t.id === 'voi-arc200-utility');
      const aramidSecurity = store.tokenTemplates.find(t => t.id === 'aramid-arc200-security');
      
      expect(voiUtility).toBeDefined();
      expect(aramidSecurity).toBeDefined();
      
      // VOI should have lighter compliance requirements
      expect(voiUtility?.compliance.length).toBeLessThan(aramidSecurity?.compliance.length || 0);
      
      // Aramid should mention authorization and prospectus
      expect(aramidSecurity?.compliance).toContain('authorization');
    });

    it('should provide network-appropriate use cases', () => {
      const store = useTokenStore();
      
      const voiTemplates = store.tokenTemplates.filter(
        t => t.standard === 'ARC200' && t.network === 'VOI'
      );
      
      const aramidTemplates = store.tokenTemplates.filter(
        t => t.standard === 'ARC200' && t.network === 'Aramid'
      );
      
      // At least some VOI templates should focus on DeFi/governance/rewards
      const voiDeFiTemplates = voiTemplates.filter(template => {
        const useCasesStr = template.useCases.join(' ').toLowerCase();
        return useCasesStr.includes('defi') || 
               useCasesStr.includes('governance') || 
               useCasesStr.includes('staking') ||
               useCasesStr.includes('reward') ||
               useCasesStr.includes('gaming');
      });
      expect(voiDeFiTemplates.length).toBeGreaterThan(0);
      
      // At least some Aramid templates should focus on payments/compliance
      const aramidPaymentTemplates = aramidTemplates.filter(template => {
        const useCasesStr = template.useCases.join(' ').toLowerCase();
        return useCasesStr.includes('payment') || 
               useCasesStr.includes('securities') || 
               useCasesStr.includes('regulated') ||
               useCasesStr.includes('stable') ||
               useCasesStr.includes('compliance');
      });
      expect(aramidPaymentTemplates.length).toBeGreaterThan(0);
    });

    it('should have appropriate default supplies for each use case', () => {
      const store = useTokenStore();
      
      const governance = store.tokenTemplates.find(t => t.id === 'voi-arc200-governance');
      const security = store.tokenTemplates.find(t => t.id === 'aramid-arc200-security');
      
      // Governance tokens typically have higher supply for distribution
      expect(governance?.defaults.supply).toBe(100000000);
      
      // Security tokens typically have lower supply
      expect(security?.defaults.supply).toBe(1000000);
    });

    it('should have appropriate decimals for each use case', () => {
      const store = useTokenStore();
      
      const payment = store.tokenTemplates.find(t => t.id === 'aramid-arc200-payment');
      const security = store.tokenTemplates.find(t => t.id === 'aramid-arc200-security');
      
      // Payment tokens need higher precision
      expect(payment?.defaults.decimals).toBe(8);
      
      // Security tokens often have no decimals (whole shares)
      expect(security?.defaults.decimals).toBe(0);
    });
  });

  describe('Template Selection and Network Auto-Selection', () => {
    it('should correctly identify network for each template', () => {
      const store = useTokenStore();
      
      const voiTemplateIds = [
        'voi-arc200-utility',
        'voi-arc200-governance',
        'voi-arc200-rewards'
      ];
      
      const aramidTemplateIds = [
        'aramid-arc200-payment',
        'aramid-arc200-stablecoin',
        'aramid-arc200-security'
      ];
      
      voiTemplateIds.forEach(id => {
        const template = store.tokenTemplates.find(t => t.id === id);
        expect(template?.network).toBe('VOI');
      });
      
      aramidTemplateIds.forEach(id => {
        const template = store.tokenTemplates.find(t => t.id === id);
        expect(template?.network).toBe('Aramid');
      });
    });

    it('should have consistent naming convention for new templates', () => {
      const store = useTokenStore();
      
      const newArc200Templates = [
        'voi-arc200-utility',
        'aramid-arc200-payment',
        'voi-arc200-governance',
        'aramid-arc200-stablecoin',
        'voi-arc200-rewards',
        'aramid-arc200-security'
      ];
      
      newArc200Templates.forEach(id => {
        const template = store.tokenTemplates.find(t => t.id === id);
        expect(template).toBeDefined();
        
        // ID should follow pattern: network-arc200-type
        expect(id).toMatch(/^(voi|aramid)-arc200-[a-z]+$/);
        
        // Name should include network and ARC-200
        expect(template?.name).toContain('ARC-200');
        expect(template?.name).toMatch(/^(VOI|Aramid) ARC-200/);
      });
    });
  });

  describe('Integration with Existing Token Creation Flow', () => {
    it('should be compatible with standard token templates filtering', () => {
      const store = useTokenStore();
      
      // New ARC-200 templates should be in standardTokenTemplates (not RWA)
      const newArc200InStandard = store.standardTokenTemplates.filter(t => 
        t.id.includes('arc200') && 
        ['voi-arc200-utility', 'aramid-arc200-payment', 'voi-arc200-governance'].includes(t.id)
      );
      
      expect(newArc200InStandard.length).toBeGreaterThan(0);
      
      // They should NOT be in RWA templates
      const newArc200InRwa = store.rwaTokenTemplates.filter(t => 
        ['voi-arc200-utility', 'aramid-arc200-payment'].includes(t.id)
      );
      
      expect(newArc200InRwa.length).toBe(0);
    });

    it('should maintain separation between standard and RWA templates', () => {
      const store = useTokenStore();
      
      const totalTemplates = store.tokenTemplates.length;
      const standardCount = store.standardTokenTemplates.length;
      const rwaCount = store.rwaTokenTemplates.length;
      
      // All templates should be categorized
      expect(standardCount + rwaCount).toBe(totalTemplates);
      
      // No overlap
      const standardIds = new Set(store.standardTokenTemplates.map(t => t.id));
      const rwaIds = new Set(store.rwaTokenTemplates.map(t => t.id));
      
      rwaIds.forEach(id => {
        expect(standardIds.has(id)).toBe(false);
      });
    });
  });

  describe('MICA Compliance Guidance', () => {
    it('should provide clear MICA guidance for all ARC-200 templates', () => {
      const store = useTokenStore();
      
      const arc200Templates = store.tokenTemplates.filter(t => t.standard === 'ARC200');
      
      arc200Templates.forEach(template => {
        expect(template.compliance).toBeDefined();
        expect(template.compliance.length).toBeGreaterThan(0);
        expect(template.guidance).toBeDefined();
        expect(template.guidance.length).toBeGreaterThan(0);
      });
    });

    it('should differentiate compliance requirements by token type', () => {
      const store = useTokenStore();
      
      const utility = store.tokenTemplates.find(t => t.id === 'voi-arc200-utility');
      const payment = store.tokenTemplates.find(t => t.id === 'aramid-arc200-payment');
      const security = store.tokenTemplates.find(t => t.id === 'aramid-arc200-security');
      
      // Utility tokens have different requirements than payments or securities
      expect(utility?.compliance).not.toContain('e-money');
      expect(payment?.compliance).toContain('e-money');
      expect(security?.compliance).toContain('prospectus');
    });
  });
});
