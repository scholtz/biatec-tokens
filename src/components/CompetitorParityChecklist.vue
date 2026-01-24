<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="pi pi-chart-bar text-purple-400"></i>
          Competitor Parity Tracker
        </h3>
        <p class="text-sm text-gray-400 mt-1">Track feature parity with leading Algorand tools</p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold text-purple-400">
          {{ completionPercentage }}%
        </div>
        <div class="text-xs text-gray-400">
          {{ completedCount }} / {{ totalCount }} features
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="relative h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
      <div 
        class="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
        :style="{ width: `${completionPercentage}%` }"
      ></div>
    </div>

    <!-- Competitor Sections -->
    <div class="space-y-4">
      <div 
        v-for="competitor in competitors" 
        :key="competitor.name"
        class="p-4 bg-white/5 rounded-lg border border-white/10"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-xl"
                 :class="competitor.colorClass">
              {{ competitor.icon }}
            </div>
            <div>
              <h4 class="font-semibold text-white">{{ competitor.name }}</h4>
              <p class="text-xs text-gray-400">{{ competitor.description }}</p>
            </div>
          </div>
          <div class="text-sm">
            <span :class="getCompletionClass(competitor)">
              {{ getCompletedFeatures(competitor) }}/{{ competitor.features.length }}
            </span>
          </div>
        </div>

        <!-- Features -->
        <div class="space-y-2 mt-3">
          <div
            v-for="feature in competitor.features"
            :key="feature.id"
            class="flex items-start gap-2 p-2 rounded hover:bg-white/5 transition-all"
          >
            <button
              @click="toggleFeature(feature.id)"
              :class="[
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                feature.completed
                  ? 'bg-purple-500 border-purple-500'
                  : 'border-gray-500 hover:border-purple-400'
              ]"
            >
              <i v-if="feature.completed" class="pi pi-check text-white text-xs"></i>
            </button>
            <div class="flex-1">
              <div class="text-sm text-gray-300">{{ feature.name }}</div>
              <div v-if="feature.note" class="text-xs text-gray-500 mt-1">{{ feature.note }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg mt-4">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-purple-400 mt-1"></i>
        <div class="flex-1 text-sm text-gray-300">
          <p class="mb-2">
            <strong class="text-white">Why track competitor parity?</strong>
          </p>
          <p class="text-xs text-gray-400">
            Understanding feature gaps against Pera, Defly, and Folks Finance helps prioritize development 
            and ensures Biatec Tokens remains competitive in the Algorand ecosystem. Check features as they're 
            implemented to track progress towards full feature parity.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface Feature {
  id: string;
  name: string;
  note?: string;
  completed: boolean;
}

interface Competitor {
  name: string;
  description: string;
  icon: string;
  colorClass: string;
  features: Feature[];
}

const STORAGE_KEY = 'biatec_competitor_parity_checklist';

const competitors = ref<Competitor[]>([
  {
    name: 'Pera Wallet',
    description: 'Self-custody wallet for Algorand assets',
    icon: '👛',
    colorClass: 'from-blue-500 to-cyan-500',
    features: [
      { id: 'pera-asa-support', name: 'Full ASA management (send, receive, opt-in)', completed: false },
      { id: 'pera-nft-gallery', name: 'NFT gallery view with metadata display', completed: false },
      { id: 'pera-walletconnect', name: 'WalletConnect dApp integration', completed: false },
      { id: 'pera-arc3-support', name: 'ARC-3 metadata display in wallet', completed: false },
      { id: 'pera-arc19-support', name: 'ARC-19 mutable NFT support', completed: false },
      { id: 'pera-arc69-support', name: 'ARC-69 on-chain metadata support', completed: false },
      { id: 'pera-multi-account', name: 'Multi-account management', completed: false },
      { id: 'pera-qr-codes', name: 'QR code generation for receiving', completed: false },
    ],
  },
  {
    name: 'Defly Wallet',
    description: 'DeFi-focused trading wallet',
    icon: '🦋',
    colorClass: 'from-purple-500 to-pink-500',
    features: [
      { id: 'defly-dex-aggregator', name: 'DEX aggregator for best swap rates', completed: false },
      { id: 'defly-portfolio-tracking', name: 'Advanced portfolio analytics', completed: false },
      { id: 'defly-asa-trading', name: 'In-wallet ASA trading interface', completed: false },
      { id: 'defly-price-charts', name: 'Real-time price charts and market data', completed: false },
      { id: 'defly-transaction-history', name: 'Detailed transaction history with filters', completed: false },
      { id: 'defly-watchlist', name: 'Custom token watchlist', completed: false },
      { id: 'defly-swap-routing', name: 'Optimal swap routing across DEXs', completed: false },
    ],
  },
  {
    name: 'Folks Finance',
    description: 'Leading Algorand DeFi protocol',
    icon: '🏦',
    colorClass: 'from-green-500 to-emerald-500',
    features: [
      { id: 'folks-lending', name: 'Token lending/borrowing functionality', completed: false },
      { id: 'folks-staking', name: 'Token staking with rewards', completed: false },
      { id: 'folks-liquidity-pools', name: 'Liquidity pool creation and management', completed: false },
      { id: 'folks-cross-chain', name: 'Cross-chain lending (xChain)', completed: false },
      { id: 'folks-governance', name: 'Governance token integration', completed: false },
      { id: 'folks-yield-farming', name: 'Yield farming opportunities', completed: false },
      { id: 'folks-collateral', name: 'Multi-token collateral support', completed: false },
      { id: 'folks-flash-loans', name: 'Flash loan capabilities', note: 'Advanced DeFi feature', completed: false },
    ],
  },
]);

const completedCount = computed(() => {
  return competitors.value.reduce((total, competitor) => {
    return total + competitor.features.filter(f => f.completed).length;
  }, 0);
});

const totalCount = computed(() => {
  return competitors.value.reduce((total, competitor) => {
    return total + competitor.features.length;
  }, 0);
});

const completionPercentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((completedCount.value / totalCount.value) * 100);
});

const toggleFeature = (featureId: string) => {
  for (const competitor of competitors.value) {
    const feature = competitor.features.find(f => f.id === featureId);
    if (feature) {
      feature.completed = !feature.completed;
      saveToLocalStorage();
      break;
    }
  }
};

const getCompletedFeatures = (competitor: Competitor) => {
  return competitor.features.filter(f => f.completed).length;
};

const getCompletionClass = (competitor: Competitor) => {
  const completed = getCompletedFeatures(competitor);
  const total = competitor.features.length;
  const percentage = (completed / total) * 100;
  
  if (percentage === 100) return 'text-green-400 font-semibold';
  if (percentage >= 50) return 'text-yellow-400 font-semibold';
  return 'text-gray-400';
};

const saveToLocalStorage = () => {
  const data = competitors.value.map(competitor => ({
    name: competitor.name,
    features: competitor.features.map(f => ({
      id: f.id,
      completed: f.completed,
    })),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Merge stored data with current structure
      for (const storedCompetitor of data) {
        const competitor = competitors.value.find(c => c.name === storedCompetitor.name);
        if (competitor) {
          for (const storedFeature of storedCompetitor.features) {
            const feature = competitor.features.find(f => f.id === storedFeature.id);
            if (feature) {
              feature.completed = storedFeature.completed;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to load competitor parity checklist from localStorage:', error);
  }
};

// Watch for changes and auto-save
watch(competitors, () => {
  saveToLocalStorage();
}, { deep: true });

// Load from localStorage on mount
onMounted(() => {
  loadFromLocalStorage();
});
</script>
