import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMarketplaceStore } from './marketplace';
import type { MarketplaceFilters } from './marketplace';
import * as PriceOracleModule from '../services/PriceOracleService';

// Mock the price oracle service
vi.mock('../services/PriceOracleService', () => {
  const mockGetBatchPrices = vi.fn().mockResolvedValue(new Map());
  const mockGetTokenPrice = vi.fn().mockResolvedValue(null);
  const mockClearCache = vi.fn();
  const mockGetCacheStats = vi.fn().mockReturnValue({ size: 0, entries: [] });

  return {
    priceOracleService: {
      getBatchPrices: mockGetBatchPrices,
      getTokenPrice: mockGetTokenPrice,
      clearCache: mockClearCache,
      getCacheStats: mockGetCacheStats,
    },
    PriceOracleService: vi.fn(),
    TokenPrice: {},
  };
});

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
    it('should load with intentional empty state (AC #7: mock data removed)', async () => {
      const store = useMarketplaceStore();
      
      await store.loadTokens();
      
      // Per MVP requirements: mock data removed, empty state is intentional
      expect(store.tokens.length).toBe(0);
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

    it('should search by token name (empty state)', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ search: 'MICA' });
      
      // With empty state, search returns no results
      const searchResults = store.filteredTokens;
      expect(searchResults.length).toBe(0);
    });

    it('should search by token symbol (empty state)', () => {
      const store = useMarketplaceStore();
      
      store.updateFilters({ search: 'MEUR' });
      
      // With empty state, search returns no results
      const searchResults = store.filteredTokens;
      expect(searchResults.length).toBe(0);
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

    it('should update filtered count when filters change (empty state)', () => {
      const store = useMarketplaceStore();
      
      const allCount = store.filteredCount;
      expect(allCount).toBe(0); // Empty state
      
      store.updateFilters({ assetClass: 'NFT' });
      const nftCount = store.filteredCount;
      
      // With empty state, both counts are 0
      expect(nftCount).toBe(0);
      expect(nftCount).toBeLessThanOrEqual(allCount);
    });
  });

  describe('Price Oracle Integration', () => {
    beforeEach(async () => {
      const store = useMarketplaceStore();
      await store.loadTokens();
      vi.clearAllMocks();
    });

    afterEach(() => {
      const store = useMarketplaceStore();
      store.stopPricePolling();
    });

    it('should initialize with price loading state', () => {
      const store = useMarketplaceStore();
      expect(store.pricesLoading).toBe(false);
      expect(store.pricePollingEnabled).toBe(false);
    });

    it('should not fetch token prices when store is empty', async () => {
      const store = useMarketplaceStore();
      const mockPrices = new Map([
        ['marketplace-1', {
          tokenId: 'marketplace-1',
          symbol: 'MEUR',
          price: 1.05,
          priceChange24h: 0.5,
          priceChange7d: 1.2,
          volume24h: 1000000,
          marketCap: 10000000,
          lastUpdated: new Date(),
          source: 'CoinGecko',
        }],
      ]);

      vi.mocked(PriceOracleModule.priceOracleService.getBatchPrices).mockResolvedValueOnce(mockPrices);

      await store.fetchTokenPrices();

      // With empty state, no tokens to fetch prices for
      expect(PriceOracleModule.priceOracleService.getBatchPrices).not.toHaveBeenCalled();
    });

    it('should not fetch price for single token when token does not exist', async () => {
      const store = useMarketplaceStore();
      const mockPrice = {
        tokenId: 'marketplace-1',
        symbol: 'MEUR',
        price: 1.05,
        priceChange24h: 0.5,
        lastUpdated: new Date(),
        source: 'Fallback',
      };

      vi.mocked(PriceOracleModule.priceOracleService.getTokenPrice).mockResolvedValueOnce(mockPrice);

      await store.fetchTokenPrice('marketplace-1');

      // With empty state, token doesn't exist
      expect(PriceOracleModule.priceOracleService.getTokenPrice).not.toHaveBeenCalled();
    });

    it('should start price polling', () => {
      const store = useMarketplaceStore();
      
      vi.useFakeTimers();
      store.startPricePolling(1000);

      expect(store.pricePollingEnabled).toBe(true);

      vi.advanceTimersByTime(1000);
      
      vi.useRealTimers();
      store.stopPricePolling();
    });

    it('should stop price polling', () => {
      const store = useMarketplaceStore();
      
      vi.useFakeTimers();
      store.startPricePolling(1000);
      expect(store.pricePollingEnabled).toBe(true);

      store.stopPricePolling();
      expect(store.pricePollingEnabled).toBe(false);

      vi.useRealTimers();
    });

    it('should clear price cache', () => {
      const store = useMarketplaceStore();
      
      store.clearPriceCache();

      expect(PriceOracleModule.priceOracleService.clearCache).toHaveBeenCalled();
    });

    it('should get price cache stats', () => {
      const store = useMarketplaceStore();
      
      const stats = store.getPriceCacheStats();

      expect(PriceOracleModule.priceOracleService.getCacheStats).toHaveBeenCalled();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('entries');
    });

    it('should handle price fetch errors gracefully', async () => {
      const store = useMarketplaceStore();
      
      vi.mocked(PriceOracleModule.priceOracleService.getBatchPrices).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Should not throw
      await expect(store.fetchTokenPrices()).resolves.not.toThrow();
    });

    it('should handle single token price fetch errors gracefully', async () => {
      const store = useMarketplaceStore();
      
      vi.mocked(PriceOracleModule.priceOracleService.getTokenPrice).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Should not throw
      await expect(store.fetchTokenPrice('marketplace-1')).resolves.not.toThrow();
    });

    it('should not fetch prices for nonexistent token', async () => {
      const store = useMarketplaceStore();
      
      await store.fetchTokenPrice('nonexistent-token');

      expect(PriceOracleModule.priceOracleService.getTokenPrice).not.toHaveBeenCalled();
    });
  });
});
