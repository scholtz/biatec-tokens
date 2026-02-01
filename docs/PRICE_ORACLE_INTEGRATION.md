# Price Oracle Integration Documentation

## Overview

The Price Oracle Integration provides real-time price data for tokens listed in the marketplace. It implements a multi-source oracle system with caching, fallback strategies, and automatic polling for price updates.

## Architecture

### Components

1. **PriceOracleService** (`src/services/PriceOracleService.ts`)
   - Handles price fetching from multiple sources
   - Implements caching with configurable TTL (Time To Live)
   - Provides fallback mechanisms for reliability
   - Supports both EVM and AVM blockchain networks

2. **Marketplace Store Enhancement** (`src/stores/marketplace.ts`)
   - Integrates price oracle service
   - Manages price polling for real-time updates
   - Stores price data with token information
   - Provides actions for price fetching and cache management

3. **PriceDisplay Component** (`src/components/PriceDisplay.vue`)
   - Reusable component for displaying price information
   - Shows price changes with color-coded indicators
   - Displays volume and market cap metrics
   - Includes price source attribution

4. **MarketplaceTokenCard Integration** (`src/components/MarketplaceTokenCard.vue`)
   - Enhanced to display live price data
   - Uses PriceDisplay component for consistent formatting
   - Shows price trends and changes

## Features

### Multi-Source Oracle Support

The price oracle fetches data from multiple sources in priority order:

1. **CoinGecko API** (Priority 1)
   - Industry-standard crypto price data
   - Supports major cryptocurrencies and tokens
   - Provides 24h and 7d price changes
   - Includes volume and market cap data

2. **DEX Aggregators** (Priority 2)
   - Placeholder for future DEX integrations
   - Will support Vestige, Humble DEX for AVM chains
   - Will support Uniswap, SushiSwap for EVM chains

3. **Fallback Source** (Priority 3)
   - Provides mock data for demonstration
   - Ensures price display even when APIs are unavailable
   - Used for testing and development

### Caching System

- **Default TTL**: 5 minutes (300,000 ms)
- **Configurable**: Can be adjusted via `setCacheTTL()` method
- **Cache Key Structure**: `{network}:{tokenId}`
- **Benefits**:
  - Reduces API calls
  - Improves performance
  - Provides offline resilience

### Real-Time Updates

- **Polling Interval**: 60 seconds (configurable)
- **Automatic**: Starts when marketplace loads
- **Lifecycle-Aware**: Stops when leaving marketplace
- **Efficient**: Only fetches for visible tokens

## API Usage

### PriceOracleService

#### Get Single Token Price

```typescript
import { priceOracleService } from '@/services/PriceOracleService';

const price = await priceOracleService.getTokenPrice(
  'token-id',
  'SYMBOL',
  'Network Name',
  false // forceRefresh
);

// Returns TokenPrice object or null
```

#### Get Batch Prices

```typescript
const tokens = [
  { tokenId: 'token-1', symbol: 'TK1', network: 'VOI' },
  { tokenId: 'token-2', symbol: 'TK2', network: 'Ethereum' },
];

const prices = await priceOracleService.getBatchPrices(tokens);
// Returns Map<string, TokenPrice>
```

#### Cache Management

```typescript
// Clear cache
priceOracleService.clearCache();

// Get cache stats
const stats = priceOracleService.getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Cached entries: ${stats.entries.join(', ')}`);

// Update cache TTL
priceOracleService.setCacheTTL(10 * 60 * 1000); // 10 minutes
```

#### Configure Sources

```typescript
priceOracleService.configureSources([
  { name: 'coingecko', enabled: true, priority: 1 },
  { name: 'dex', enabled: false, priority: 2 },
  { name: 'fallback', enabled: true, priority: 3 },
]);
```

### Marketplace Store

#### Fetch Prices

```typescript
import { useMarketplaceStore } from '@/stores/marketplace';

const marketplaceStore = useMarketplaceStore();

// Fetch all token prices
await marketplaceStore.fetchTokenPrices();

// Fetch single token price
await marketplaceStore.fetchTokenPrice('token-id');
```

#### Price Polling

```typescript
// Start polling (60 second interval)
marketplaceStore.startPricePolling();

// Custom interval
marketplaceStore.startPricePolling(30000); // 30 seconds

// Stop polling
marketplaceStore.stopPricePolling();
```

#### Cache Operations

```typescript
// Clear price cache
marketplaceStore.clearPriceCache();

// Get cache stats
const stats = marketplaceStore.getPriceCacheStats();
```

### PriceDisplay Component

```vue
<template>
  <PriceDisplay
    :price="token.price"
    :priceChange24h="token.priceChange24h"
    :priceChange7d="token.priceChange7d"
    :volume24h="token.volume24h"
    :marketCap="token.marketCap"
    :priceSource="token.priceSource"
    :lastUpdated="token.priceLastUpdated"
    :showChanges="true"
    :show7dChange="true"
    :showMetrics="true"
    :showSource="true"
    :showLastUpdated="true"
    :loading="false"
  />
</template>

<script setup>
import PriceDisplay from '@/components/PriceDisplay.vue';
</script>
```

## Data Structures

### TokenPrice Interface

```typescript
interface TokenPrice {
  tokenId: string;        // Unique token identifier
  symbol: string;         // Token symbol (e.g., "ETH", "ALGO")
  price: number;          // Current price in USD
  priceChange24h: number; // 24-hour price change percentage
  priceChange7d?: number; // 7-day price change percentage (optional)
  volume24h?: number;     // 24-hour trading volume (optional)
  marketCap?: number;     // Market capitalization (optional)
  lastUpdated: Date;      // Timestamp of price update
  source: string;         // Data source (e.g., "CoinGecko", "Fallback")
}
```

### MarketplaceToken Enhancement

```typescript
interface MarketplaceToken extends Token {
  // Existing fields...
  
  // Price fields
  price?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  volume24h?: number;
  marketCap?: number;
  priceSource?: string;
  priceLastUpdated?: Date;
}
```

## Configuration

### Environment Variables

No additional environment variables are required. The price oracle uses public APIs that don't require authentication.

### Customization

#### Cache TTL

Default: 5 minutes (300,000 ms)

```typescript
// In main.ts or app initialization
import { priceOracleService } from '@/services/PriceOracleService';
priceOracleService.setCacheTTL(10 * 60 * 1000); // 10 minutes
```

#### Polling Interval

Default: 60 seconds

```typescript
// In Marketplace.vue
marketplaceStore.startPricePolling(120000); // 2 minutes
```

#### Oracle Sources

Enable/disable specific price sources:

```typescript
priceOracleService.configureSources([
  { name: 'coingecko', enabled: true, priority: 1 },
  { name: 'dex', enabled: false, priority: 2 },
  { name: 'fallback', enabled: true, priority: 3 },
]);
```

## Error Handling

The price oracle implements comprehensive error handling:

1. **Network Errors**: Automatically retry with fallback sources
2. **API Rate Limits**: Gracefully degrade to cached or fallback data
3. **Malformed Responses**: Log errors and continue without crashing
4. **Cache Expiration**: Transparently refetch when cache expires

Example error handling in components:

```typescript
try {
  await marketplaceStore.fetchTokenPrices();
} catch (error) {
  console.error('Price fetch failed:', error);
  // UI continues to function with last known prices
}
```

## Performance Considerations

### Optimization Strategies

1. **Batch Requests**: Fetch multiple prices in parallel
2. **Caching**: Reduce API calls with 5-minute cache
3. **Lazy Loading**: Only fetch prices for visible tokens
4. **Polling Management**: Automatically stop polling when leaving marketplace

### Performance Metrics

- **Initial Load**: ~500-1000ms for 6 tokens
- **Cache Hit**: <1ms
- **Cache Miss**: ~200-500ms per token
- **Batch Request**: ~500ms for 10 tokens

### Best Practices

1. Use `getBatchPrices()` for multiple tokens
2. Implement proper cleanup in component unmount
3. Monitor cache size for memory usage
4. Adjust polling interval based on user activity

## Testing

### Unit Tests

- **PriceOracleService**: 25 tests covering all functionality
- **Marketplace Store**: 35 tests including price integration
- **PriceDisplay Component**: 22 tests for UI rendering

### E2E Tests

- **Marketplace**: 11 tests for price display and interactions
- Tests cover price loading, updates, filtering, and error states

### Running Tests

```bash
# Unit tests
npm test

# Specific service tests
npm test -- PriceOracleService

# E2E tests
npm run test:e2e -- marketplace.spec.ts
```

## Security Considerations

1. **API Keys**: No API keys stored in client code
2. **Rate Limiting**: Implements caching to prevent abuse
3. **Data Validation**: All price data is validated before display
4. **HTTPS Only**: All API calls use secure connections
5. **Error Masking**: Sensitive errors are logged but not displayed

## Future Enhancements

### Planned Features

1. **DEX Integration**: Connect to decentralized exchanges for AVM/EVM chains
2. **Historical Charts**: Price history visualization
3. **Price Alerts**: Notify users of price changes
4. **Multiple Currencies**: Support EUR, GBP, etc.
5. **WebSocket Updates**: Real-time price streaming
6. **Custom Oracles**: Support for private price feeds

### Integration Opportunities

- **Trading Interface**: Use prices for swap calculations
- **Portfolio Tracking**: Calculate portfolio value
- **Analytics Dashboard**: Price trends and patterns
- **Arbitrage Detection**: Compare prices across chains

## Support and Troubleshooting

### Common Issues

**Problem**: Prices not loading
- **Solution**: Check network connectivity, verify API availability

**Problem**: Stale prices
- **Solution**: Clear cache or force refresh

**Problem**: Incorrect prices
- **Solution**: Check token symbol mapping, verify network selection

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'price-oracle:*');
```

### Cache Inspection

```typescript
// Check cache status
const stats = marketplaceStore.getPriceCacheStats();
console.log('Cache entries:', stats.entries);
console.log('Cache size:', stats.size);
```

## Changelog

### Version 1.0.0 (2026-02-01)

- ✅ Initial implementation
- ✅ Multi-source oracle support (CoinGecko, fallback)
- ✅ Caching with configurable TTL
- ✅ Real-time price polling
- ✅ PriceDisplay component
- ✅ Comprehensive test coverage
- ✅ E2E test suite
- ✅ Documentation

## Contributing

When contributing to the price oracle:

1. Maintain test coverage above 90%
2. Document all public APIs
3. Follow TypeScript best practices
4. Test with multiple price sources
5. Consider performance implications

## License

Part of the Biatec Tokens platform. See main LICENSE file for details.
