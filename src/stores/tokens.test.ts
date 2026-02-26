import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTokenStore } from './tokens';

describe('Token Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty tokens array', () => {
    const store = useTokenStore();
    
    expect(store.tokens).toEqual([]);
    expect(store.totalTokens).toBe(0);
    expect(store.deployedTokens).toBe(0);
    expect(store.failedTokens).toBe(0);
  });

  it('should have 10 token standards available', () => {
    const store = useTokenStore();
    
    expect(store.tokenStandards).toHaveLength(10);
    expect(store.tokenStandards.map(s => s.name)).toContain('ASA');
    expect(store.tokenStandards.map(s => s.name)).toContain('ARC19');
    expect(store.tokenStandards.map(s => s.name)).toContain('ARC69');
    expect(store.tokenStandards.map(s => s.name)).toContain('ARC200');
    expect(store.tokenStandards.map(s => s.name)).toContain('ARC72');
  });

  it('should create token with valid data', async () => {
    const store = useTokenStore();
    
    const tokenData = {
      name: 'Test Token',
      symbol: 'TEST',
      standard: 'ASA' as const,
      type: 'FT' as const,
      supply: 1000000,
      decimals: 6,
      description: 'A test token',
    };
    
    const token = await store.createToken(tokenData);
    
    expect(token).toBeDefined();
    expect(token.name).toBe('Test Token');
    expect(token.symbol).toBe('TEST');
    expect(token.status).toBe('deployed');
    expect(store.tokens).toHaveLength(1);
    expect(store.totalTokens).toBe(1);
  });

  it('should update token counts correctly', async () => {
    const store = useTokenStore();
    
    await store.createToken({
      name: 'Token 1',
      symbol: 'TK1',
      standard: 'ASA' as const,
      type: 'FT' as const,
      supply: 1000,
      description: 'Token 1',
    });
    
    await store.createToken({
      name: 'Token 2',
      symbol: 'TK2',
      standard: 'ARC200' as const,
      type: 'FT' as const,
      supply: 2000,
      description: 'Token 2',
    });
    
    expect(store.totalTokens).toBe(2);
    expect(store.deployedTokens).toBe(2);
  });

  it('should delete token by id', async () => {
    const store = useTokenStore();
    
    const token = await store.createToken({
      name: 'Test Token',
      symbol: 'TEST',
      standard: 'ASA' as const,
      type: 'FT' as const,
      supply: 1000,
      description: 'Test',
    });
    
    expect(store.totalTokens).toBe(1);
    
    store.deleteToken(token.id);
    
    expect(store.totalTokens).toBe(0);
    expect(store.tokens).toHaveLength(0);
  });

  it('should update token status', async () => {
    const store = useTokenStore();
    
    const token = await store.createToken({
      name: 'Test Token',
      symbol: 'TEST',
      standard: 'ASA' as const,
      type: 'FT' as const,
      supply: 1000,
      description: 'Test',
    });
    
    store.updateTokenStatus(token.id, 'failed');
    
    expect(store.tokens[0].status).toBe('failed');
    expect(store.failedTokens).toBe(1);
    expect(store.deployedTokens).toBe(0);
  });

  it('should group tokens by standard', async () => {
    const store = useTokenStore();
    
    await store.createToken({
      name: 'ASA Token',
      symbol: 'ASA1',
      standard: 'ASA' as const,
      type: 'FT' as const,
      supply: 1000,
      description: 'ASA Token',
    });
    
    await store.createToken({
      name: 'ARC200 Token',
      symbol: 'ARC1',
      standard: 'ARC200' as const,
      type: 'FT' as const,
      supply: 2000,
      description: 'ARC200 Token',
    });
    
    const grouped = store.tokensByStandard;
    
    expect(grouped['ASA']).toHaveLength(1);
    expect(grouped['ARC200']).toHaveLength(1);
  });

  describe('Token Templates', () => {
    it('should have 21 token templates available (16 standard + 5 RWA)', () => {
      const store = useTokenStore();
      
      expect(store.tokenTemplates).toHaveLength(21);
      expect(store.tokenTemplates).toBeDefined();
    });

    it('should have VOI utility token template', () => {
      const store = useTokenStore();
      
      const voiUtility = store.tokenTemplates.find(t => t.id === 'voi-utility-token');
      
      expect(voiUtility).toBeDefined();
      expect(voiUtility?.name).toBe('VOI Utility Token');
      expect(voiUtility?.standard).toBe('ARC3FT');
      expect(voiUtility?.type).toBe('FT');
      expect(voiUtility?.network).toBe('VOI');
      expect(voiUtility?.micaCompliant).toBe(true);
      expect(voiUtility?.defaults.supply).toBe(1000000);
      expect(voiUtility?.defaults.decimals).toBe(6);
      expect(voiUtility?.useCases).toContain('Platform rewards');
    });

    it('should have Aramid payment token template', () => {
      const store = useTokenStore();
      
      const aramidPayment = store.tokenTemplates.find(t => t.id === 'aramid-payment-token');
      
      expect(aramidPayment).toBeDefined();
      expect(aramidPayment?.name).toBe('Aramid Payment Token');
      expect(aramidPayment?.standard).toBe('ARC3FT');
      expect(aramidPayment?.network).toBe('Aramid');
      expect(aramidPayment?.micaCompliant).toBe(true);
      expect(aramidPayment?.defaults.supply).toBe(10000000);
      expect(aramidPayment?.defaults.decimals).toBe(8);
    });

    it('should have VOI security token template with ARC200 standard', () => {
      const store = useTokenStore();
      
      const voiSecurity = store.tokenTemplates.find(t => t.id === 'voi-security-token');
      
      expect(voiSecurity).toBeDefined();
      expect(voiSecurity?.standard).toBe('ARC200');
      expect(voiSecurity?.type).toBe('FT');
      expect(voiSecurity?.micaCompliant).toBe(true);
      expect(voiSecurity?.defaults.decimals).toBe(0);
    });

    it('should have fractional NFT template marked as non-MICA compliant', () => {
      const store = useTokenStore();
      
      const fractionalNFT = store.tokenTemplates.find(t => t.id === 'aramid-fractional-nft');
      
      expect(fractionalNFT).toBeDefined();
      expect(fractionalNFT?.micaCompliant).toBe(false);
      expect(fractionalNFT?.standard).toBe('ARC3FNFT');
      expect(fractionalNFT?.type).toBe('NFT');
      expect(fractionalNFT?.compliance).toContain('legal review');
    });

    it('should have cross-chain bridge token for both networks', () => {
      const store = useTokenStore();
      
      const bridgeToken = store.tokenTemplates.find(t => t.id === 'cross-chain-bridge-token');
      
      expect(bridgeToken).toBeDefined();
      expect(bridgeToken?.network).toBe('Both');
      expect(bridgeToken?.standard).toBe('ARC200');
      expect(bridgeToken?.micaCompliant).toBe(true);
    });

    it('should have algorithmic stablecoin template with high decimals', () => {
      const store = useTokenStore();
      
      const stablecoin = store.tokenTemplates.find(t => t.id === 'both-arc200-algorithmic-stablecoin');
      
      expect(stablecoin).toBeDefined();
      expect(stablecoin?.defaults.decimals).toBe(18);
      expect(stablecoin?.network).toBe('Both');
      expect(stablecoin?.standard).toBe('ARC200');
    });

    it('should have NFT templates with appropriate supply', () => {
      const store = useTokenStore();
      
      const nftCollection = store.tokenTemplates.find(t => t.id === 'voi-nft-collection');
      const fractionalNFT = store.tokenTemplates.find(t => t.id === 'aramid-fractional-nft');
      
      expect(nftCollection?.defaults.supply).toBe(1);
      expect(fractionalNFT?.defaults.supply).toBe(1000000);
    });

    it('should provide compliance guidance for all templates', () => {
      const store = useTokenStore();
      
      store.tokenTemplates.forEach(template => {
        expect(template.compliance).toBeDefined();
        expect(template.compliance.length).toBeGreaterThan(0);
        expect(template.guidance).toBeDefined();
        expect(template.guidance.length).toBeGreaterThan(0);
      });
    });

    it('should provide use cases for all templates', () => {
      const store = useTokenStore();
      
      store.tokenTemplates.forEach(template => {
        expect(template.useCases).toBeDefined();
        expect(template.useCases.length).toBeGreaterThan(0);
      });
    });

    it('should filter templates by network', () => {
      const store = useTokenStore();
      
      const voiTemplates = store.tokenTemplates.filter(t => t.network === 'VOI');
      const aramidTemplates = store.tokenTemplates.filter(t => t.network === 'Aramid');
      const bothTemplates = store.tokenTemplates.filter(t => t.network === 'Both');
      
      expect(voiTemplates.length).toBeGreaterThan(0);
      expect(aramidTemplates.length).toBeGreaterThan(0);
      expect(bothTemplates.length).toBeGreaterThan(0);
    });

    it('should filter templates by MICA compliance', () => {
      const store = useTokenStore();
      
      const compliantTemplates = store.tokenTemplates.filter(t => t.micaCompliant);
      const nonCompliantTemplates = store.tokenTemplates.filter(t => !t.micaCompliant);
      
      expect(compliantTemplates.length).toBe(20);
      expect(nonCompliantTemplates.length).toBe(1);
    });

    it('should have VOI ARC-200 utility token template', () => {
      const store = useTokenStore();
      
      const voiArc200Utility = store.tokenTemplates.find(t => t.id === 'voi-arc200-utility');
      
      expect(voiArc200Utility).toBeDefined();
      expect(voiArc200Utility?.name).toBe('VOI ARC-200 Utility Token');
      expect(voiArc200Utility?.standard).toBe('ARC200');
      expect(voiArc200Utility?.type).toBe('FT');
      expect(voiArc200Utility?.network).toBe('VOI');
      expect(voiArc200Utility?.micaCompliant).toBe(true);
      expect(voiArc200Utility?.defaults.supply).toBe(10000000);
      expect(voiArc200Utility?.defaults.decimals).toBe(6);
    });

    it('should have Aramid ARC-200 payment token template', () => {
      const store = useTokenStore();
      
      const aramidArc200Payment = store.tokenTemplates.find(t => t.id === 'aramid-arc200-payment');
      
      expect(aramidArc200Payment).toBeDefined();
      expect(aramidArc200Payment?.name).toBe('Aramid ARC-200 Payment Token');
      expect(aramidArc200Payment?.standard).toBe('ARC200');
      expect(aramidArc200Payment?.network).toBe('Aramid');
      expect(aramidArc200Payment?.defaults.supply).toBe(50000000);
      expect(aramidArc200Payment?.defaults.decimals).toBe(8);
    });

    it('should have VOI ARC-200 governance token template', () => {
      const store = useTokenStore();
      
      const voiArc200Governance = store.tokenTemplates.find(t => t.id === 'voi-arc200-governance');
      
      expect(voiArc200Governance).toBeDefined();
      expect(voiArc200Governance?.standard).toBe('ARC200');
      expect(voiArc200Governance?.network).toBe('VOI');
      expect(voiArc200Governance?.defaults.supply).toBe(100000000);
    });

    it('should have Aramid ARC-200 stablecoin template', () => {
      const store = useTokenStore();
      
      const aramidArc200Stablecoin = store.tokenTemplates.find(t => t.id === 'aramid-arc200-stablecoin');
      
      expect(aramidArc200Stablecoin).toBeDefined();
      expect(aramidArc200Stablecoin?.standard).toBe('ARC200');
      expect(aramidArc200Stablecoin?.network).toBe('Aramid');
      expect(aramidArc200Stablecoin?.compliance).toContain('MICA');
    });

    it('should have VOI ARC-200 rewards token template', () => {
      const store = useTokenStore();
      
      const voiArc200Rewards = store.tokenTemplates.find(t => t.id === 'voi-arc200-rewards');
      
      expect(voiArc200Rewards).toBeDefined();
      expect(voiArc200Rewards?.standard).toBe('ARC200');
      expect(voiArc200Rewards?.network).toBe('VOI');
    });

    it('should have Aramid ARC-200 security token template', () => {
      const store = useTokenStore();
      
      const aramidArc200Security = store.tokenTemplates.find(t => t.id === 'aramid-arc200-security');
      
      expect(aramidArc200Security).toBeDefined();
      expect(aramidArc200Security?.standard).toBe('ARC200');
      expect(aramidArc200Security?.network).toBe('Aramid');
      expect(aramidArc200Security?.defaults.decimals).toBe(0);
      expect(aramidArc200Security?.compliance).toContain('whitelisting');
    });

    it('should have all ARC-200 templates marked as MICA compliant', () => {
      const store = useTokenStore();
      
      const arc200Templates = store.tokenTemplates.filter(t => t.standard === 'ARC200');
      
      expect(arc200Templates.length).toBeGreaterThan(0);
      expect(arc200Templates.every(t => t.micaCompliant)).toBe(true);
    });

    it('should have network-specific compliance guidance for ARC-200 templates', () => {
      const store = useTokenStore();
      
      const voiArc200 = store.tokenTemplates.filter(t => t.standard === 'ARC200' && t.network === 'VOI');
      const aramidArc200 = store.tokenTemplates.filter(t => t.standard === 'ARC200' && t.network === 'Aramid');
      
      expect(voiArc200.length).toBeGreaterThan(0);
      expect(aramidArc200.length).toBeGreaterThan(0);
      
      // VOI templates should have different guidance than Aramid templates
      const voiCompliance = voiArc200[0].compliance;
      const aramidCompliance = aramidArc200[0].compliance;
      
      expect(voiCompliance).toBeDefined();
      expect(aramidCompliance).toBeDefined();
    });
  });

  describe('RWA Token Presets', () => {
    it('should have 5 RWA compliance presets', () => {
      const store = useTokenStore();
      
      expect(store.rwaTokenTemplates).toHaveLength(5);
      expect(store.rwaTokenTemplates.every(t => t.isRwaPreset === true)).toBe(true);
    });

    it('should have standard non-RWA templates', () => {
      const store = useTokenStore();
      
      expect(store.standardTokenTemplates).toHaveLength(16);
      expect(store.standardTokenTemplates.every(t => !t.isRwaPreset)).toBe(true);
    });

    it('should have total of 21 templates (16 standard + 5 RWA)', () => {
      const store = useTokenStore();
      
      expect(store.tokenTemplates).toHaveLength(21);
    });

    it('should have RWA security token with whitelist features', () => {
      const store = useTokenStore();
      
      const securityToken = store.rwaTokenTemplates.find(t => t.id === 'rwa-security-token');
      
      expect(securityToken).toBeDefined();
      expect(securityToken?.name).toBe('RWA Security Token (Whitelisted)');
      expect(securityToken?.isRwaPreset).toBe(true);
      expect(securityToken?.rwaFeatures?.whitelistEnabled).toBe(true);
      expect(securityToken?.rwaFeatures?.transferRestrictions).toBe(true);
      expect(securityToken?.rwaFeatures?.issuerControls).toBe(true);
      expect(securityToken?.rwaFeatures?.kycRequired).toBe(true);
      expect(securityToken?.rwaFeatures?.jurisdictionRestrictions).toBe(true);
      expect(securityToken?.micaCompliant).toBe(true);
      expect(securityToken?.complianceImplications).toBeDefined();
      expect(securityToken?.complianceImplications?.length).toBeGreaterThan(0);
    });

    it('should have RWA real estate token', () => {
      const store = useTokenStore();
      
      const realEstateToken = store.rwaTokenTemplates.find(t => t.id === 'rwa-real-estate-token');
      
      expect(realEstateToken).toBeDefined();
      expect(realEstateToken?.name).toBe('RWA Real Estate Token');
      expect(realEstateToken?.network).toBe('Aramid');
      expect(realEstateToken?.rwaFeatures?.whitelistEnabled).toBe(true);
      expect(realEstateToken?.rwaFeatures?.kycRequired).toBe(true);
      expect(realEstateToken?.complianceImplications?.some(i => 
        i.includes('accredited investor')
      )).toBe(true);
    });

    it('should have RWA e-money token with reserve requirements', () => {
      const store = useTokenStore();
      
      const eMoneyToken = store.rwaTokenTemplates.find(t => t.id === 'rwa-emoney-token');
      
      expect(eMoneyToken).toBeDefined();
      expect(eMoneyToken?.name).toBe('RWA E-Money Token');
      expect(eMoneyToken?.network).toBe('Aramid');
      expect(eMoneyToken?.rwaFeatures?.whitelistEnabled).toBe(true);
      expect(eMoneyToken?.rwaFeatures?.transferRestrictions).toBe(false);
      expect(eMoneyToken?.rwaFeatures?.issuerControls).toBe(true);
      expect(eMoneyToken?.complianceImplications?.some(i => 
        i.includes('e-money institution authorization')
      )).toBe(true);
      expect(eMoneyToken?.complianceImplications?.some(i => 
        i.includes('1:1 fiat reserves')
      )).toBe(true);
    });

    it('should have RWA carbon credit token', () => {
      const store = useTokenStore();
      
      const carbonToken = store.rwaTokenTemplates.find(t => t.id === 'rwa-carbon-credit');
      
      expect(carbonToken).toBeDefined();
      expect(carbonToken?.name).toBe('RWA Carbon Credit Token');
      expect(carbonToken?.network).toBe('VOI');
      expect(carbonToken?.rwaFeatures?.whitelistEnabled).toBe(false);
      expect(carbonToken?.rwaFeatures?.transferRestrictions).toBe(true);
      expect(carbonToken?.rwaFeatures?.kycRequired).toBe(false);
      expect(carbonToken?.complianceImplications?.some(i => 
        i.toLowerCase().includes('carbon credit') || i.toLowerCase().includes('registry')
      )).toBe(true);
    });

    it('should have RWA supply chain asset token', () => {
      const store = useTokenStore();
      
      const supplyChainToken = store.rwaTokenTemplates.find(t => t.id === 'rwa-supply-chain-token');
      
      expect(supplyChainToken).toBeDefined();
      expect(supplyChainToken?.name).toBe('RWA Supply Chain Asset Token');
      expect(supplyChainToken?.network).toBe('Both');
      expect(supplyChainToken?.rwaFeatures?.whitelistEnabled).toBe(true);
      expect(supplyChainToken?.rwaFeatures?.issuerControls).toBe(true);
      expect(supplyChainToken?.complianceImplications?.some(i => 
        i.includes('supply chain participants')
      )).toBe(true);
    });

    it('should have compliance implications for all RWA presets', () => {
      const store = useTokenStore();
      
      store.rwaTokenTemplates.forEach(preset => {
        expect(preset.complianceImplications).toBeDefined();
        expect(preset.complianceImplications?.length).toBeGreaterThan(5);
        expect(preset.rwaFeatures).toBeDefined();
      });
    });

    it('should have detailed compliance guidance for RWA presets', () => {
      const store = useTokenStore();
      
      store.rwaTokenTemplates.forEach(preset => {
        expect(preset.compliance).toBeDefined();
        expect(preset.compliance.length).toBeGreaterThan(50);
        expect(preset.guidance).toBeDefined();
        expect(preset.guidance.length).toBeGreaterThan(30);
      });
    });

    it('should have appropriate use cases for RWA presets', () => {
      const store = useTokenStore();
      
      store.rwaTokenTemplates.forEach(preset => {
        expect(preset.useCases).toBeDefined();
        expect(preset.useCases.length).toBeGreaterThan(2);
      });
    });

    it('should use appropriate token standards for RWA presets', () => {
      const store = useTokenStore();
      
      const standards = store.rwaTokenTemplates.map(t => t.standard);
      
      // RWA presets should use ARC200 or ARC3FT for advanced features
      expect(standards.every(s => s === 'ARC200' || s === 'ARC3FT')).toBe(true);
    });

    it('should mark all RWA presets as MICA compliant', () => {
      const store = useTokenStore();
      
      store.rwaTokenTemplates.forEach(preset => {
        expect(preset.micaCompliant).toBe(true);
      });
    });

    it('should have RWA features with correct structure', () => {
      const store = useTokenStore();
      
      store.rwaTokenTemplates.forEach(preset => {
        expect(preset.rwaFeatures).toBeDefined();
        expect(typeof preset.rwaFeatures?.whitelistEnabled).toBe('boolean');
        expect(typeof preset.rwaFeatures?.transferRestrictions).toBe('boolean');
        expect(typeof preset.rwaFeatures?.issuerControls).toBe('boolean');
        expect(typeof preset.rwaFeatures?.kycRequired).toBe('boolean');
        expect(typeof preset.rwaFeatures?.jurisdictionRestrictions).toBe('boolean');
      });
    });

    it('should filter RWA presets from standard templates correctly', () => {
      const store = useTokenStore();
      
      const allTemplates = store.tokenTemplates;
      const rwaTemplates = store.rwaTokenTemplates;
      const standardTemplates = store.standardTokenTemplates;
      
      expect(allTemplates.length).toBe(rwaTemplates.length + standardTemplates.length);
      
      // Check no overlap
      const rwaIds = rwaTemplates.map(t => t.id);
      const standardIds = standardTemplates.map(t => t.id);
      
      const overlap = rwaIds.filter(id => standardIds.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('null-path edge cases', () => {
    it('should not throw when deleteToken is called with a non-existent id', () => {
      const store = useTokenStore();
      // No tokens in store — should be a no-op
      expect(() => store.deleteToken('non-existent-id')).not.toThrow();
      expect(store.tokens).toHaveLength(0);
    });

    it('should not throw when updateTokenStatus is called with a non-existent id', () => {
      const store = useTokenStore();
      // No tokens in store — should be a no-op (the if (token) branch is false)
      expect(() => store.updateTokenStatus('non-existent-id', 'failed')).not.toThrow();
      expect(store.tokens).toHaveLength(0);
    });

    it('should only update matching token when updateTokenStatus is called', async () => {
      const store = useTokenStore();
      const t1 = await store.createToken({
        name: 'Token A', symbol: 'A', standard: 'ASA' as const,
        type: 'FT' as const, supply: 100, description: '',
      });
      const t2 = await store.createToken({
        name: 'Token B', symbol: 'B', standard: 'ASA' as const,
        type: 'FT' as const, supply: 100, description: '',
      });
      store.updateTokenStatus(t1.id, 'failed');
      // t1 updated, t2 unchanged
      expect(store.tokens.find(t => t.id === t1.id)?.status).toBe('failed');
      expect(store.tokens.find(t => t.id === t2.id)?.status).toBe('deployed');
      // Calling with non-existent id still doesn't affect existing tokens
      store.updateTokenStatus('ghost-id', 'deploying');
      expect(store.tokens.find(t => t.id === t1.id)?.status).toBe('failed');
      expect(store.tokens.find(t => t.id === t2.id)?.status).toBe('deployed');
    });
  });
});
