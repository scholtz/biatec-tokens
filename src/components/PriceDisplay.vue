<template>
  <div class="price-display">
    <!-- Main Price -->
    <div class="flex items-baseline space-x-2">
      <span class="price-value text-xl font-bold text-white">
        ${{ formatPrice(price) }}
      </span>
      
      <!-- Price Source Badge -->
      <span v-if="showSource && priceSource" class="text-xs text-gray-400">
        {{ priceSource }}
      </span>
    </div>

    <!-- Price Changes -->
    <div v-if="showChanges" class="flex items-center space-x-3 mt-1">
      <!-- 24h Change -->
      <div
        v-if="priceChange24h !== undefined"
        :class="[
          'flex items-center space-x-1 text-sm font-medium',
          priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
        ]"
      >
        <i :class="priceChange24h >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="text-xs"></i>
        <span>{{ Math.abs(priceChange24h).toFixed(2) }}%</span>
        <span class="text-xs text-gray-400">(24h)</span>
      </div>

      <!-- 7d Change -->
      <div
        v-if="priceChange7d !== undefined && show7dChange"
        :class="[
          'flex items-center space-x-1 text-sm font-medium',
          priceChange7d >= 0 ? 'text-green-400' : 'text-red-400'
        ]"
      >
        <i :class="priceChange7d >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="text-xs"></i>
        <span>{{ Math.abs(priceChange7d).toFixed(2) }}%</span>
        <span class="text-xs text-gray-400">(7d)</span>
      </div>
    </div>

    <!-- Additional Metrics -->
    <div v-if="showMetrics" class="grid grid-cols-2 gap-3 mt-3">
      <!-- Volume 24h -->
      <div v-if="volume24h !== undefined">
        <p class="text-xs text-gray-400">Volume (24h)</p>
        <p class="text-sm text-white font-medium">${{ formatLargeNumber(volume24h) }}</p>
      </div>

      <!-- Market Cap -->
      <div v-if="marketCap !== undefined">
        <p class="text-xs text-gray-400">Market Cap</p>
        <p class="text-sm text-white font-medium">${{ formatLargeNumber(marketCap) }}</p>
      </div>
    </div>

    <!-- Last Updated -->
    <div v-if="showLastUpdated && lastUpdated" class="mt-2">
      <p class="text-xs text-gray-400">
        <i class="pi pi-clock mr-1"></i>
        Updated {{ formatTimeAgo(lastUpdated) }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center space-x-2 mt-2">
      <i class="pi pi-spin pi-spinner text-biatec-accent text-xs"></i>
      <span class="text-xs text-gray-400">Updating price...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  price: number;
  priceChange24h?: number;
  priceChange7d?: number;
  volume24h?: number;
  marketCap?: number;
  priceSource?: string;
  lastUpdated?: Date;
  showChanges?: boolean;
  show7dChange?: boolean;
  showMetrics?: boolean;
  showSource?: boolean;
  showLastUpdated?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showChanges: true,
  show7dChange: false,
  showMetrics: false,
  showSource: false,
  showLastUpdated: false,
  loading: false,
});

const formatPrice = (price: number): string => {
  if (price < 0.01) {
    return price.toFixed(6);
  } else if (price < 1) {
    return price.toFixed(4);
  } else {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
};

const formatLargeNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  } else if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  } else if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  }
};
</script>

<style scoped>
.price-display {
  display: flex;
  flex-direction: column;
}
</style>
