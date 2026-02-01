import axios, { AxiosInstance } from "axios";

/**
 * Price data for a token
 */
export interface TokenPrice {
  tokenId: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChange7d?: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdated: Date;
  source: string;
}

/**
 * Cache entry for price data
 */
interface PriceCacheEntry {
  data: TokenPrice;
  expiresAt: number;
}

/**
 * Oracle source configuration
 */
interface OracleSource {
  name: string;
  enabled: boolean;
  priority: number;
}

/**
 * Service for fetching real-time token prices from multiple oracle sources
 * Implements caching, fallback strategies, and multi-chain support
 */
export class PriceOracleService {
  private cache: Map<string, PriceCacheEntry>;
  private axiosInstance: AxiosInstance;
  private cacheTTL: number; // milliseconds
  private sources: OracleSource[];

  /**
   * Creates a new PriceOracleService instance
   * @param cacheTTL - Cache time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(cacheTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
    this.axiosInstance = axios.create({
      timeout: 10000,
    });

    // Configure oracle sources by priority
    this.sources = [
      { name: "coingecko", enabled: true, priority: 1 },
      { name: "dex", enabled: true, priority: 2 },
      { name: "fallback", enabled: true, priority: 3 },
    ];
  }

  /**
   * Gets the price for a single token with caching
   * @param tokenId - Unique identifier for the token
   * @param symbol - Token symbol (e.g., "ALGO", "ETH")
   * @param network - Network identifier (e.g., "VOI", "Ethereum")
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns Token price data or null if unavailable
   */
  async getTokenPrice(
    tokenId: string,
    symbol: string,
    network: string,
    forceRefresh: boolean = false
  ): Promise<TokenPrice | null> {
    const cacheKey = this.getCacheKey(tokenId, network);

    // Check cache first
    if (!forceRefresh) {
      const cachedPrice = this.getFromCache(cacheKey);
      if (cachedPrice) {
        return cachedPrice;
      }
    }

    // Fetch from oracle sources
    try {
      const price = await this.fetchPriceFromSources(tokenId, symbol, network);
      if (price) {
        this.setCache(cacheKey, price);
        return price;
      }
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
    }

    return null;
  }

  /**
   * Gets prices for multiple tokens in a batch
   * @param tokens - Array of token identifiers with symbols and networks
   * @returns Map of tokenId to price data
   */
  async getBatchPrices(
    tokens: Array<{ tokenId: string; symbol: string; network: string }>
  ): Promise<Map<string, TokenPrice>> {
    const results = new Map<string, TokenPrice>();

    // Fetch prices concurrently with error handling
    const promises = tokens.map(async ({ tokenId, symbol, network }) => {
      try {
        const price = await this.getTokenPrice(tokenId, symbol, network);
        if (price) {
          results.set(tokenId, price);
        }
      } catch (error) {
        console.warn(`Failed to fetch price for ${symbol}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Fetches price from multiple sources with fallback
   */
  private async fetchPriceFromSources(
    tokenId: string,
    symbol: string,
    network: string
  ): Promise<TokenPrice | null> {
    const enabledSources = this.sources
      .filter((s) => s.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const source of enabledSources) {
      try {
        const price = await this.fetchFromSource(source.name, tokenId, symbol, network);
        if (price) {
          return price;
        }
      } catch (error) {
        console.warn(`Source ${source.name} failed for ${symbol}:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * Fetches price from a specific source
   */
  private async fetchFromSource(
    source: string,
    tokenId: string,
    symbol: string,
    network: string
  ): Promise<TokenPrice | null> {
    switch (source) {
      case "coingecko":
        return this.fetchFromCoinGecko(tokenId, symbol, network);
      case "dex":
        return this.fetchFromDEX(tokenId, symbol, network);
      case "fallback":
        return this.fetchFromFallback(tokenId, symbol, network);
      default:
        return null;
    }
  }

  /**
   * Fetches price from CoinGecko API
   */
  private async fetchFromCoinGecko(
    tokenId: string,
    symbol: string,
    network: string
  ): Promise<TokenPrice | null> {
    try {
      // Map token symbols to CoinGecko IDs
      const coinGeckoId = this.mapToCoinGeckoId(symbol, network);
      if (!coinGeckoId) {
        return null;
      }

      const response = await this.axiosInstance.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: coinGeckoId,
            vs_currencies: "usd",
            include_24hr_change: true,
            include_7d_change: true,
            include_24h_vol: true,
            include_market_cap: true,
          },
        }
      );

      const data = response.data[coinGeckoId];
      if (!data) {
        return null;
      }

      return {
        tokenId,
        symbol,
        price: data.usd || 0,
        priceChange24h: data.usd_24h_change || 0,
        priceChange7d: data.usd_7d_change || 0,
        volume24h: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
        lastUpdated: new Date(),
        source: "CoinGecko",
      };
    } catch (error) {
      console.warn(`CoinGecko fetch failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetches price from DEX aggregators
   */
  private async fetchFromDEX(
    _tokenId: string,
    _symbol: string,
    network: string
  ): Promise<TokenPrice | null> {
    // Simulate DEX price fetch (would integrate with actual DEX APIs)
    // For AVM chains: Vestige, Humble DEX
    // For EVM chains: Uniswap, SushiSwap
    try {
      // Mock implementation - in production, integrate with actual DEX APIs
      if (network === "VOI" || network === "Aramid" || network === "Algorand Mainnet") {
        // AVM DEX integration would go here
        return null;
      } else if (network === "Ethereum" || network === "Arbitrum" || network === "Base") {
        // EVM DEX integration would go here
        return null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fallback price source with mock data for demonstration
   */
  private async fetchFromFallback(
    tokenId: string,
    symbol: string,
    _network: string
  ): Promise<TokenPrice | null> {
    // Fallback to mock data for demonstration
    // In production, this could be a secondary price feed or historical average
    const mockPrices: Record<string, number> = {
      ALGO: 0.18,
      VOI: 0.05,
      ETH: 2300.0,
      BTC: 45000.0,
      USDT: 1.0,
      USDC: 1.0,
    };

    const basePrice = mockPrices[symbol] || 1.0;
    const randomChange = (Math.random() - 0.5) * 10; // -5% to +5%

    return {
      tokenId,
      symbol,
      price: basePrice * (1 + randomChange / 100),
      priceChange24h: randomChange,
      priceChange7d: randomChange * 2,
      volume24h: Math.random() * 1000000,
      marketCap: basePrice * 1000000 * (1 + randomChange / 100),
      lastUpdated: new Date(),
      source: "Fallback",
    };
  }

  /**
   * Maps token symbols to CoinGecko IDs
   */
  private mapToCoinGeckoId(symbol: string, _network: string): string | null {
    const mapping: Record<string, string> = {
      ALGO: "algorand",
      ETH: "ethereum",
      BTC: "bitcoin",
      USDT: "tether",
      USDC: "usd-coin",
      VOI: "voi-network",
      // Add more mappings as needed
    };

    return mapping[symbol] || null;
  }

  /**
   * Gets data from cache if not expired
   */
  private getFromCache(key: string): TokenPrice | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Sets data in cache with expiration
   */
  private setCache(key: string, data: TokenPrice): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.cacheTTL,
    });
  }

  /**
   * Generates cache key for a token
   */
  private getCacheKey(tokenId: string, network: string): string {
    return `${network}:${tokenId}`;
  }

  /**
   * Clears all cached prices
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Updates cache TTL
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }

  /**
   * Configures oracle sources
   */
  configureSources(sources: OracleSource[]): void {
    this.sources = sources;
  }
}

// Export singleton instance
export const priceOracleService = new PriceOracleService();
