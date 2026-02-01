import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMarketplaceStore } from './marketplace';
import type { MarketplaceFilters } from './marketplace';

describe('useMarketplaceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Initial State', () => {
    it('should initialize with default filters', () => {
      const store = useMarketplaceStore();
      
      expect(store.filters).toEqual({
        network: 'All',
        complianceBadge: 'All',
        assetClass: 'All',
        search: '',
      });
    });

    it('should initialize with empty tokens array', () => {
      const store = useMarketplaceStore();
      
      expect(store.tokens).toEqual([]);
      expect(store.totalTokens).toBe(0);
    });

    it('should not be loading initially', () => {
      const store = useMarketplaceStore();
      
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('loadTokens', () => {
    it('should load mock tokens', async () => {
      const store = useMarketplaceStore();
      
      await store.loadTokens();
      
      expect(store.tokens.length).toBeGreaterThan(0);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set loading state during load', async () => {
      const store = useMarketplaceStore();
      
      const loadPromise = store.loadTokens();
      expect(store.loading).toBe(true);
      
      await loadPromise;
      expect(store.loading).toBe(false);
    });
  });

  describe('Filter Logic', () => {
    beforeEach(async () => {
      const store = useMarketplaceStore();
      await store.loadTokens();
    });

    it('should filter by network', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ network: 'VOI' });
      
      const voiTokens = store.filteredTokens;
      expect(voiTokens.every(token => token.network === 'VOI')).toBe(true);
    });

    it('should filter by MICA compliance', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ complianceBadge: 'MICA Compliant' });
      
      const micaTokens = store.filteredTokens;
      expect(micaTokens.every(token => token.isMicaCompliant === true)).toBe(true);
    });

    it('should filter by KYC requirement', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ complianceBadge: 'KYC Required' });
      
      const kycTokens = store.filteredTokens;
      expect(kycTokens.every(token => token.kycRequired === true)).toBe(true);
    });

    it('should filter by whitelist status', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ complianceBadge: 'Whitelisted' });
      
      const whitelistedTokens = store.filteredTokens;
      expect(whitelistedTokens.every(token => 
        token.whitelistStatus === 'enabled' || token.whitelistStatus === 'partial'
      )).toBe(true);
    });

    it('should filter by asset class FT', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ assetClass: 'FT' });
      
      const ftTokens = store.filteredTokens;
      expect(ftTokens.every(token => token.type === 'FT')).toBe(true);
    });

    it('should filter by asset class NFT', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ assetClass: 'NFT' });
      
      const nftTokens = store.filteredTokens;
      expect(nftTokens.every(token => token.type === 'NFT')).toBe(true);
    });

    it('should search by token name', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ search: 'MICA' });
      
      const searchResults = store.filteredTokens;
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.every(token => 
        token.name.toLowerCase().includes('mica') ||
        token.description.toLowerCase().includes('mica')
      )).toBe(true);
    });

    it('should search by token symbol', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ search: 'MEUR' });
      
      const searchResults = store.filteredTokens;
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(token => token.symbol === 'MEUR')).toBe(true);
    });

    it('should combine multiple filters', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({
        network: 'VOI',
        assetClass: 'FT',
        complianceBadge: 'MICA Compliant',
      });
      
      const filteredTokens = store.filteredTokens;
      expect(filteredTokens.every(token => 
        token.network === 'VOI' &&
        token.type === 'FT' &&
        token.isMicaCompliant === true
      )).toBe(true);
    });

    it('should handle no results', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ search: 'nonexistent-token-xyz-123' });
      
      expect(store.filteredTokens.length).toBe(0);
    });
  });

  describe('Filter Management', () => {
    it('should update filters', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ network: 'Aramid' });
      
      expect(store.filters.network).toBe('Aramid');
    });

    it('should partially update filters', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ network: 'VOI' });
      store.updateFilters({ assetClass: 'FT' });
      
      expect(store.filters.network).toBe('VOI');
      expect(store.filters.assetClass).toBe('FT');
      expect(store.filters.complianceBadge).toBe('All');
    });

    it('should reset filters', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({
        network: 'VOI',
        assetClass: 'FT',
        complianceBadge: 'MICA Compliant',
        search: 'test',
      });
      
      store.resetFilters();
      
      expect(store.filters).toEqual({
        network: 'All',
        complianceBadge: 'All',
        assetClass: 'All',
        search: '',
      });
    });
  });

  describe('URL Parameter Handling', () => {
    it('should set filters from URL params', () => {
      const store = useMarketplaceStore();
      
      const params = new URLSearchParams();
      params.set('network', 'VOI');
      params.set('compliance', 'MICA Compliant');
      params.set('assetClass', 'FT');
      params.set('search', 'test');
      
      store.setFiltersFromUrl(params);
      
      expect(store.filters.network).toBe('VOI');
      expect(store.filters.complianceBadge).toBe('MICA Compliant');
      expect(store.filters.assetClass).toBe('FT');
      expect(store.filters.search).toBe('test');
    });

    it('should ignore invalid URL params', () => {
      const store = useMarketplaceStore();
      
      const params = new URLSearchParams();
      params.set('invalid', 'value');
      
      store.setFiltersFromUrl(params);
      
      expect(store.filters).toEqual({
        network: 'All',
        complianceBadge: 'All',
        assetClass: 'All',
        search: '',
      });
    });

    it('should generate URL params from filters', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({
        network: 'VOI',
        complianceBadge: 'MICA Compliant',
        assetClass: 'FT',
        search: 'test',
      });
      
      const params = store.getUrlParams();
      
      expect(params.get('network')).toBe('VOI');
      expect(params.get('compliance')).toBe('MICA Compliant');
      expect(params.get('assetClass')).toBe('FT');
      expect(params.get('search')).toBe('test');
    });

    it('should not include default filters in URL params', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ network: 'VOI' });
      
      const params = store.getUrlParams();
      
      expect(params.get('network')).toBe('VOI');
      expect(params.has('compliance')).toBe(false);
      expect(params.has('assetClass')).toBe(false);
      expect(params.has('search')).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    beforeEach(async () => {
      const store = useMarketplaceStore();
      await store.loadTokens();
    });

    it('should calculate total tokens', () => {
      const store = useMarketplaceStore();
      
      expect(store.totalTokens).toBe(store.tokens.length);
    });

    it('should calculate filtered count', () => {
      const store = useMarketplaceStore();
      
      const initialCount = store.filteredCount;
      
      store.updateFilters({ network: 'VOI' });
      
      expect(store.filteredCount).toBeLessThanOrEqual(initialCount);
      expect(store.filteredCount).toBe(store.filteredTokens.length);
    });

    it('should update filtered count when filters change', () => {
      const store = useMarketplaceStore();
      
      const allCount = store.filteredCount;
      
      store.updateFilters({ assetClass: 'NFT' });
      const nftCount = store.filteredCount;
      
      expect(nftCount).toBeLessThan(allCount);
    });
  });
});
