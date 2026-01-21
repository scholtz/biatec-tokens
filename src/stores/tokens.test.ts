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

  it('should have 8 token standards available', () => {
    const store = useTokenStore();
    
    expect(store.tokenStandards).toHaveLength(8);
    expect(store.tokenStandards.map(s => s.name)).toContain('ASA');
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
    it('should have 8 token templates available', () => {
      const store = useTokenStore();
      
      expect(store.tokenTemplates).toHaveLength(8);
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

    it('should have stablecoin template with high decimals', () => {
      const store = useTokenStore();
      
      const stablecoin = store.tokenTemplates.find(t => t.id === 'stablecoin-template');
      
      expect(stablecoin).toBeDefined();
      expect(stablecoin?.defaults.decimals).toBe(18);
      expect(stablecoin?.network).toBe('Both');
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
      
      expect(compliantTemplates.length).toBe(7);
      expect(nonCompliantTemplates.length).toBe(1);
    });
  });
});
