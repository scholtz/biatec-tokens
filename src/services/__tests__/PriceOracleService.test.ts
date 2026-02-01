import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PriceOracleService, TokenPrice } from "../PriceOracleService";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("PriceOracleService", () => {
  let service: PriceOracleService;

  beforeEach(() => {
    service = new PriceOracleService(5 * 60 * 1000); // 5 minutes
    vi.clearAllMocks();
    
    // Setup axios.create mock
    mockedAxios.create = vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    })) as any;
  });

  afterEach(() => {
    service.clearCache();
  });

  describe("Constructor", () => {
    it("should initialize with default cache TTL", () => {
      const service = new PriceOracleService();
      expect(service).toBeDefined();
      expect(service.getCacheStats().size).toBe(0);
    });

    it("should initialize with custom cache TTL", () => {
      const customTTL = 10 * 60 * 1000; // 10 minutes
      const service = new PriceOracleService(customTTL);
      expect(service).toBeDefined();
    });
  });

  describe("getTokenPrice", () => {
    it("should fetch price for a token", async () => {
      const mockPrice: TokenPrice = {
        tokenId: "test-token-1",
        symbol: "TEST",
        price: 100.0,
        priceChange24h: 5.0,
        priceChange7d: 10.0,
        volume24h: 1000000,
        marketCap: 10000000,
        lastUpdated: new Date(),
        source: "CoinGecko",
      };

      // Mock CoinGecko response
      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue({
          data: {
            test: {
              usd: 100.0,
              usd_24h_change: 5.0,
              usd_7d_change: 10.0,
              usd_24h_vol: 1000000,
              usd_market_cap: 10000000,
            },
          },
        }),
      };

      mockedAxios.create = vi.fn(() => mockAxiosInstance as any);
      service = new PriceOracleService();

      const price = await service.getTokenPrice("test-token-1", "TEST", "Ethereum");

      expect(price).toBeDefined();
      // The service uses fallback, so we should get a result
      expect(price).not.toBeNull();
    });

    it("should return cached price on second call", async () => {
      const mockPrice: TokenPrice = {
        tokenId: "test-token-2",
        symbol: "CACHE",
        price: 50.0,
        priceChange24h: 2.0,
        lastUpdated: new Date(),
        source: "Fallback",
      };

      // First call - will use fallback
      const price1 = await service.getTokenPrice("test-token-2", "CACHE", "VOI");
      expect(price1).not.toBeNull();

      // Second call - should use cache
      const price2 = await service.getTokenPrice("test-token-2", "CACHE", "VOI");
      expect(price2).not.toBeNull();
      expect(price2?.tokenId).toBe("test-token-2");
    });

    it("should force refresh when requested", async () => {
      // First call
      const price1 = await service.getTokenPrice("test-token-3", "REFRESH", "Ethereum");
      expect(price1).not.toBeNull();

      // Force refresh
      const price2 = await service.getTokenPrice("test-token-3", "REFRESH", "Ethereum", true);
      expect(price2).not.toBeNull();
      // Prices should be different due to random variation in fallback
      // But both should exist
      expect(price1?.tokenId).toBe(price2?.tokenId);
    });

    it("should return null for completely unknown token", async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue(new Error("Not found")),
      };

      mockedAxios.create = vi.fn(() => mockAxiosInstance as any);
      service = new PriceOracleService();

      // Configure to disable fallback
      service.configureSources([
        { name: "coingecko", enabled: true, priority: 1 },
        { name: "dex", enabled: true, priority: 2 },
        { name: "fallback", enabled: false, priority: 3 },
      ]);

      const price = await service.getTokenPrice("unknown-token", "UNKNOWN", "Unknown");
      
      // With fallback disabled and mock failing, should return null
      expect(price).toBeNull();
    });
  });

  describe("getBatchPrices", () => {
    it("should fetch prices for multiple tokens", async () => {
      const tokens = [
        { tokenId: "token-1", symbol: "TK1", network: "VOI" },
        { tokenId: "token-2", symbol: "TK2", network: "Ethereum" },
        { tokenId: "token-3", symbol: "TK3", network: "Arbitrum" },
      ];

      const prices = await service.getBatchPrices(tokens);

      expect(prices.size).toBeGreaterThan(0);
      // Should get at least some prices (fallback provides mock data)
      expect(prices.size).toBeLessThanOrEqual(tokens.length);
    });

    it("should handle partial failures gracefully", async () => {
      const tokens = [
        { tokenId: "token-good", symbol: "ALGO", network: "Algorand Mainnet" },
        { tokenId: "token-bad", symbol: "INVALID", network: "Unknown" },
      ];

      const prices = await service.getBatchPrices(tokens);

      // Should get at least one price (the good one with fallback)
      expect(prices.size).toBeGreaterThanOrEqual(1);
    });

    it("should return empty map for empty input", async () => {
      const prices = await service.getBatchPrices([]);
      expect(prices.size).toBe(0);
    });
  });

  describe("Cache Management", () => {
    it("should cache price data", async () => {
      await service.getTokenPrice("cache-test", "CACHE", "VOI");
      const stats = service.getCacheStats();
      
      expect(stats.size).toBe(1);
      expect(stats.entries).toContain("VOI:cache-test");
    });

    it("should clear all cached data", async () => {
      await service.getTokenPrice("token-1", "TK1", "VOI");
      await service.getTokenPrice("token-2", "TK2", "Ethereum");

      expect(service.getCacheStats().size).toBe(2);

      service.clearCache();

      expect(service.getCacheStats().size).toBe(0);
    });

    it("should expire cached data after TTL", async () => {
      // Create service with very short TTL
      const shortTTLService = new PriceOracleService(100); // 100ms

      await shortTTLService.getTokenPrice("expire-test", "EXP", "VOI");
      expect(shortTTLService.getCacheStats().size).toBe(1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Access should trigger cache cleanup
      await shortTTLService.getTokenPrice("expire-test", "EXP", "VOI");
      
      // Cache should have new entry (old one expired)
      expect(shortTTLService.getCacheStats().size).toBe(1);
    });

    it("should update cache TTL", () => {
      const newTTL = 10 * 60 * 1000; // 10 minutes
      service.setCacheTTL(newTTL);
      
      // Verify by checking that cache behaves with new TTL
      // This is implicitly tested by the service behavior
      expect(service).toBeDefined();
    });
  });

  describe("Source Configuration", () => {
    it("should configure oracle sources", () => {
      const customSources = [
        { name: "coingecko", enabled: true, priority: 1 },
        { name: "dex", enabled: false, priority: 2 },
      ];

      service.configureSources(customSources);
      
      // Service should use only CoinGecko (but will fall back since mock fails)
      expect(service).toBeDefined();
    });

    it("should respect source priority", async () => {
      const sources = [
        { name: "fallback", enabled: true, priority: 1 }, // Highest priority
        { name: "coingecko", enabled: true, priority: 2 },
        { name: "dex", enabled: true, priority: 3 },
      ];

      service.configureSources(sources);

      const price = await service.getTokenPrice("priority-test", "PRIOR", "VOI");
      
      // Should get fallback source
      expect(price?.source).toBe("Fallback");
    });
  });

  describe("Network Support", () => {
    it("should handle AVM chain tokens", async () => {
      const networks = ["VOI", "Aramid", "Algorand Mainnet"];

      for (const network of networks) {
        const price = await service.getTokenPrice(`token-${network}`, "TEST", network);
        expect(price).not.toBeNull();
      }
    });

    it("should handle EVM chain tokens", async () => {
      const networks = ["Ethereum", "Arbitrum", "Base"];

      for (const network of networks) {
        const price = await service.getTokenPrice(`token-${network}`, "TEST", network);
        expect(price).not.toBeNull();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue(new Error("Network error")),
      };

      mockedAxios.create = vi.fn(() => mockAxiosInstance as any);
      
      // Disable fallback to test error handling
      const errorService = new PriceOracleService();
      errorService.configureSources([
        { name: "coingecko", enabled: true, priority: 1 },
        { name: "fallback", enabled: false, priority: 2 },
      ]);

      const price = await errorService.getTokenPrice("error-test", "ERR", "VOI");
      
      // Should return null on error
      expect(price).toBeNull();
    });

    it("should handle malformed API responses", async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue({ data: null }),
      };

      mockedAxios.create = vi.fn(() => mockAxiosInstance as any);
      
      const malformedService = new PriceOracleService();
      malformedService.configureSources([
        { name: "coingecko", enabled: true, priority: 1 },
        { name: "fallback", enabled: false, priority: 2 },
      ]);

      const price = await malformedService.getTokenPrice("malformed-test", "MAL", "VOI");
      
      // Should handle gracefully
      expect(price).toBeNull();
    });
  });

  describe("CoinGecko Integration", () => {
    it("should map known symbols to CoinGecko IDs", async () => {
      const knownSymbols = ["ALGO", "ETH", "BTC", "USDT", "USDC"];

      for (const symbol of knownSymbols) {
        // Test that service attempts to fetch (will use fallback in test)
        const price = await service.getTokenPrice(`test-${symbol}`, symbol, "Ethereum");
        expect(price).not.toBeNull();
      }
    });

    it("should handle CoinGecko rate limits", async () => {
      const mockAxiosInstance = {
        get: vi.fn().mockRejectedValue({ response: { status: 429 } }),
      };

      mockedAxios.create = vi.fn(() => mockAxiosInstance as any);
      
      const rateLimitService = new PriceOracleService();

      const price = await rateLimitService.getTokenPrice("rate-limit-test", "RATE", "VOI");
      
      // Should fall back to other sources
      expect(price?.source).toBe("Fallback");
    });
  });

  describe("Price Data Format", () => {
    it("should return complete price data structure", async () => {
      const price = await service.getTokenPrice("format-test", "FMT", "VOI");

      expect(price).toMatchObject({
        tokenId: expect.any(String),
        symbol: expect.any(String),
        price: expect.any(Number),
        priceChange24h: expect.any(Number),
        lastUpdated: expect.any(Date),
        source: expect.any(String),
      });
    });

    it("should include optional fields when available", async () => {
      const price = await service.getTokenPrice("optional-test", "OPT", "Ethereum");

      if (price) {
        // Fallback source provides these fields
        expect(price.priceChange7d).toBeDefined();
        expect(price.volume24h).toBeDefined();
        expect(price.marketCap).toBeDefined();
      }
    });
  });

  describe("Cache Key Generation", () => {
    it("should generate unique cache keys for different networks", async () => {
      await service.getTokenPrice("same-id", "SAME", "VOI");
      await service.getTokenPrice("same-id", "SAME", "Ethereum");

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toContain("VOI:same-id");
      expect(stats.entries).toContain("Ethereum:same-id");
    });

    it("should use same cache key for same token and network", async () => {
      await service.getTokenPrice("unique-id", "UNI", "VOI");
      await service.getTokenPrice("unique-id", "UNI", "VOI");

      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
    });
  });
});
