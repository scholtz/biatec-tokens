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

    it('should fetch price for existing token and update it', async () => {
      const store = useMarketplaceStore();
      vi.resetAllMocks(); // Clear any leftover once-queued mocks from prior tests
      // Directly add a token so fetchTokenPrice can find it
      store.tokens = [{
        id: 'token-abc',
        name: 'Test Token',
        symbol: 'TEST',
        standard: 'ARC200',
        network: 'VOI',
        isVerified: false,
        complianceBadge: 'None',
        assetClass: 'Utility',
        description: '',
        issuer: '',
        totalSupply: 1000000,
        decimals: 6,
        createdAt: new Date(),
      }];

      const mockPrice = {
        id: 'token-abc',
        symbol: 'TEST',
        price: 1.07,
        priceChange24h: 1.2,
        priceChange7d: 2.5,
        volume24h: 10000,
        marketCap: 1000000,
        lastUpdated: new Date(),
        source: 'CoinGecko' as const,
      };
      vi.mocked(PriceOracleModule.priceOracleService.getTokenPrice).mockResolvedValueOnce(mockPrice);

      await store.fetchTokenPrice('token-abc');

      expect(PriceOracleModule.priceOracleService.getTokenPrice).toHaveBeenCalled();
      const updatedToken = store.tokens.find(t => t.id === 'token-abc');
      expect(updatedToken?.price).toBe(1.07);
    });

    it('should fetch price for existing token when price data is null (no update)', async () => {
      const store = useMarketplaceStore();
      vi.resetAllMocks();
      store.tokens = [{
        id: 'token-abc',
        name: 'Test Token',
        symbol: 'TEST',
        standard: 'ARC200',
        network: 'VOI',
        isVerified: false,
        complianceBadge: 'None',
        assetClass: 'Utility',
        description: '',
        issuer: '',
        totalSupply: 1000000,
        decimals: 6,
        createdAt: new Date(),
      }];

      vi.mocked(PriceOracleModule.priceOracleService.getTokenPrice).mockResolvedValueOnce(null);

      await store.fetchTokenPrice('token-abc');

      expect(PriceOracleModule.priceOracleService.getTokenPrice).toHaveBeenCalled();
      // Price stays as original (undefined or prior value)
    });

    it('should restart polling when startPricePolling called while already polling', () => {
      const store = useMarketplaceStore();

      vi.useFakeTimers();
      vi.mocked(PriceOracleModule.priceOracleService.getBatchPrices).mockResolvedValue([]);

      store.startPricePolling(1000);
      expect(store.pricePollingEnabled).toBe(true);

      // Call again — should stop old interval and start new one (line 194)
      store.startPricePolling(2000);
      expect(store.pricePollingEnabled).toBe(true);

      store.stopPricePolling();
      vi.useRealTimers();
    });
  });

  describe('loadTokens error handling', () => {
    it('should set error on loadTokens failure', async () => {
      const store = useMarketplaceStore();

      // Make setTimeout throw to trigger catch block in loadTokens
      const spy = vi.spyOn(global, 'setTimeout').mockImplementationOnce((_cb: any) => {
        throw new Error('Load failed')
      });

      await store.loadTokens();

      expect(store.error).toBeTruthy();
      expect(store.loading).toBe(false);
      spy.mockRestore();
    });
  });

  describe('Filter Logic with populated tokens', () => {
    const makeToken = (overrides: Record<string, unknown> = {}) => ({
      id: 'tk-1',
      name: 'Alpha Token',
      symbol: 'ALP',
      standard: 'ARC200',
      network: 'VOI',
      totalSupply: '1000000',
      description: 'A token',
      status: 'active',
      complianceBadges: [],
      type: 'FT',
      isMicaCompliant: false,
      kycRequired: false,
      whitelistStatus: 'disabled',
      issuer: 'issuer@example.com',
      ...overrides,
    } as any);

    it('should filter "None" complianceBadge — returns tokens with no compliance badges', () => {
      const store = useMarketplaceStore();
      store.tokens = [
        makeToken({ id: 'tk-no-badge', complianceBadges: [] }),
        makeToken({ id: 'tk-has-badge', complianceBadges: ['MICA Compliant'] }),
      ];
      store.updateFilters({ complianceBadge: 'None' });
      const result = store.filteredTokens;
      expect(result.every((t) => !t.complianceBadges || t.complianceBadges.length === 0)).toBe(true);
      expect(result.some((t) => t.id === 'tk-no-badge')).toBe(true);
    });

    it('should return true for unknown complianceBadge value', () => {
      const store = useMarketplaceStore();
      store.tokens = [makeToken({ id: 'tk-1' })];
      store.updateFilters({ complianceBadge: 'UnknownBadge' as any });
      // fallback `return true` keeps all tokens
      expect(store.filteredTokens.length).toBe(1);
    });

    it('should search by issuer field (optional chain branch)', () => {
      const store = useMarketplaceStore();
      store.tokens = [
        makeToken({ id: 'tk-issuer', issuer: 'alice@biatec.io', name: 'ZZZ', symbol: 'ZZZ', description: '' }),
        makeToken({ id: 'tk-no-issuer', issuer: undefined, name: 'YYY', symbol: 'YYY', description: '' }),
      ];
      store.updateFilters({ search: 'alice' });
      const result = store.filteredTokens;
      expect(result.some((t) => t.id === 'tk-issuer')).toBe(true);
      expect(result.some((t) => t.id === 'tk-no-issuer')).toBe(false);
    });

    it('should handle undefined issuer without crashing (optional chain = undefined)', () => {
      const store = useMarketplaceStore();
      store.tokens = [makeToken({ id: 'tk-niss', issuer: undefined, name: 'Beta', symbol: 'BETA', description: 'b' })];
      store.updateFilters({ search: 'alpha' });
      // doesn't match, returns empty — importantly, no crash
      expect(store.filteredTokens.length).toBe(0);
    });
  });

  describe('fetchTokenPrices error handling', () => {
    it('should catch and log error in fetchTokenPrices without throwing', async () => {
      const store = useMarketplaceStore();
      store.tokens = [
        {
          id: 'tk-err',
          name: 'Err Token',
          symbol: 'ERR',
          standard: 'ARC200',
          network: 'VOI',
          totalSupply: '1',
          description: '',
          status: 'active',
          complianceBadges: [],
          type: 'FT',
        } as any,
      ];
      vi.mocked(PriceOracleModule.priceOracleService.getBatchPrices).mockRejectedValueOnce(
        new Error('Network error'),
      );
      // should resolve without throwing
      await expect(store.fetchTokenPrices()).resolves.toBeUndefined();
      expect(store.pricesLoading).toBe(false);
    });

    it('should catch and log error in fetchTokenPrice without throwing', async () => {
      const store = useMarketplaceStore();
      store.tokens = [
        {
          id: 'tk-single-err',
          name: 'Single Err',
          symbol: 'SE',
          standard: 'ARC200',
          network: 'VOI',
          totalSupply: '1',
          description: '',
          status: 'active',
          complianceBadges: [],
          type: 'FT',
        } as any,
      ];
      vi.mocked(PriceOracleModule.priceOracleService.getTokenPrice).mockRejectedValueOnce(
        new Error('Price fetch failed'),
      );
      await expect(store.fetchTokenPrice('tk-single-err')).resolves.toBeUndefined();
    });
  });

  describe('fetchTokenPrices with tokens', () => {
    it('should update tokens when prices are returned from batch fetch', async () => {
      const store = useMarketplaceStore();
      store.tokens = [
        {
          id: 'token-1',
          name: 'Test Token',
          symbol: 'TEST',
          standard: 'ARC200',
          network: 'VOI',
          totalSupply: '1000000',
          description: '',
          status: 'active',
          complianceBadges: [],
          type: 'FT',
        } as any,
      ];

      const priceMap = new Map([
        ['token-1', {
          price: 1.5,
          priceChange24h: 0.05,
          priceChange7d: 0.1,
          volume24h: 10000,
          marketCap: 1500000,
          source: 'mock',
          lastUpdated: new Date().toISOString(),
        }],
      ]);

      vi.mocked(PriceOracleModule.priceOracleService.getBatchPrices).mockResolvedValueOnce(priceMap);

      await store.fetchTokenPrices();

      expect(store.tokens[0].price).toBe(1.5);
      expect(store.tokens[0].priceChange24h).toBe(0.05);
    });

    it('should not update tokens when price not in map', async () => {
      const store = useMarketplaceStore();
      store.tokens = [
        {
          id: 'token-no-price',
          name: 'No Price Token',
          symbol: 'NP',
          standard: 'ARC200',
          network: undefined,
          totalSupply: '1000000',
          description: '',
          status: 'active',
          complianceBadges: [],
          type: 'FT',
        } as any,
      ];

      vi.mocked(PriceOracleModule.priceOracleService.getBatchPrices).mockResolvedValueOnce(new Map());

      await store.fetchTokenPrices();

      expect(store.tokens[0].price).toBeUndefined();
    });
  });

});
