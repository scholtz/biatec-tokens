<template>
  <div class="space-y-4">
    <!-- Balance Card -->
    <div class="glass-effect rounded-xl p-5 border border-white/10">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <i class="pi pi-wallet text-biatec-accent text-lg"></i>
          <h3 class="text-lg font-semibold text-white">Account Balance</h3>
        </div>
        <button
          @click="refreshBalance"
          :disabled="isRefreshing"
          class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh balance"
        >
          <i
            :class="['pi pi-refresh text-sm', { 'pi-spin': isRefreshing }]"
          ></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !balance" class="text-center py-6">
        <i class="pi pi-spin pi-spinner text-3xl text-gray-400 mb-2"></i>
        <p class="text-sm text-gray-400">Loading balance...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
      >
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-red-400 text-sm mt-0.5"></i>
          <div class="flex-1">
            <p class="text-sm text-red-400 font-medium">Failed to Load Balance</p>
            <p class="text-xs text-gray-400 mt-1">{{ error }}</p>
            <button
              @click="refreshBalance"
              class="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Balance Display -->
      <div v-else-if="balance !== null" class="space-y-3">
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold text-white">{{ formattedBalance }}</span>
          <span class="text-lg text-gray-400">{{ currencySymbol }}</span>
        </div>

        <!-- Balance Details -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="p-3 bg-white/5 rounded-lg">
            <p class="text-gray-400 text-xs mb-1">Available</p>
            <p class="text-white font-medium">{{ formattedBalance }} {{ currencySymbol }}</p>
          </div>
          <div class="p-3 bg-white/5 rounded-lg">
            <p class="text-gray-400 text-xs mb-1">Network</p>
            <p class="text-white font-medium">{{ networkName }}</p>
          </div>
        </div>

        <!-- Last Updated -->
        <div v-if="lastUpdated" class="flex items-center gap-2 text-xs text-gray-500">
          <i class="pi pi-clock"></i>
          <span>Updated {{ timeAgo }}</span>
        </div>

        <!-- Insufficient Balance Warning -->
        <div
          v-if="showInsufficientWarning"
          class="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-yellow-400 text-sm mt-0.5"></i>
            <div class="text-xs text-gray-300">
              <p class="font-semibold text-yellow-400 mb-1">Low Balance Warning</p>
              <p>
                Your balance may be insufficient for token deployment. 
                <span v-if="estimatedFee">
                  Estimated fee: <strong class="text-white">{{ estimatedFee }} {{ currencySymbol }}</strong>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- No Wallet Connected -->
      <div v-else class="text-center py-6">
        <i class="pi pi-wallet text-4xl text-gray-600 mb-3"></i>
        <p class="text-sm text-gray-400">Connect your wallet to view balance</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWalletManager } from '../composables/useWalletManager'
import { useTokenBalance } from '../composables/useTokenBalance'

interface Props {
  minimumBalance?: number
  estimatedFee?: string
  autoRefreshInterval?: number // in milliseconds
}

const props = withDefaults(defineProps<Props>(), {
  minimumBalance: 1,
  autoRefreshInterval: 30000, // 30 seconds
})

const walletManager = useWalletManager()
const tokenBalance = useTokenBalance()

const isRefreshing = ref(false)
const lastUpdated = ref<Date | null>(null)
const autoRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null)

// Computed properties
const balance = computed(() => tokenBalance.accountBalance.value.algoBalance / 1_000_000)
const isLoading = computed(() => tokenBalance.isLoading.value)
const error = computed(() => tokenBalance.accountBalance.value.error)

const formattedBalance = computed(() => {
  return balance.value.toFixed(6)
})

const currencySymbol = computed(() => {
  const networkInfo = walletManager.networkInfo.value
  if (!networkInfo) return 'ALGO'
  
  // Map network to currency symbol
  if (networkInfo.chainType === 'EVM') {
    return 'ETH'
  } else {
    // AVM chains
    if (networkInfo.name === 'voi-mainnet') return 'VOI'
    if (networkInfo.name === 'aramidmain') return 'ARAD'
    return 'ALGO'
  }
})

const networkName = computed(() => {
  return walletManager.networkInfo.value?.displayName || 'Unknown'
})

const showInsufficientWarning = computed(() => {
  if (balance.value === null) return false
  return balance.value < props.minimumBalance
})

const timeAgo = computed(() => {
  if (!lastUpdated.value) return ''
  
  const seconds = Math.floor((Date.now() - lastUpdated.value.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
})

// Methods
const refreshBalance = async () => {
  if (!walletManager.isConnected.value || isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await tokenBalance.refresh()
    lastUpdated.value = new Date()
  } catch (err) {
    console.error('Failed to refresh balance:', err)
  } finally {
    isRefreshing.value = false
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  
  if (props.autoRefreshInterval > 0) {
    autoRefreshTimer.value = setInterval(() => {
      if (walletManager.isConnected.value) {
        refreshBalance()
      }
    }, props.autoRefreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

// Watch for wallet connection changes
watch(
  () => walletManager.isConnected.value,
  (connected) => {
    if (connected) {
      refreshBalance()
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  },
  { immediate: true }
)

// Watch for network changes
watch(
  () => walletManager.currentNetwork.value,
  () => {
    if (walletManager.isConnected.value) {
      // Delay to allow network switch to complete
      setTimeout(() => {
        refreshBalance()
      }, 1000)
    }
  }
)

// Lifecycle
onMounted(() => {
  if (walletManager.isConnected.value) {
    refreshBalance()
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
