<template>
  <Card class="wallet-info">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Wallet Information
        </h3>
        <button
          @click="refresh"
          :disabled="isLoading"
          class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <i :class="['pi pi-refresh', { 'pi-spin': isLoading }]"></i>
        </button>
      </div>

      <!-- Wallet Connected State -->
      <div v-if="isConnected && activeAddress">
        <!-- Account Address -->
        <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Active Account
          </div>
          <div class="flex items-center justify-between gap-2">
            <code class="text-sm text-gray-900 dark:text-white font-mono truncate">
              {{ formattedAddress }}
            </code>
            <button
              @click="copyAddress"
              class="p-1.5 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Copy address"
            >
              <i class="pi pi-copy text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Network Info -->
        <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Network
          </div>
          <div class="flex items-center gap-2">
            <div 
              class="w-2 h-2 rounded-full"
              :class="networkInfo?.isTestnet ? 'bg-yellow-500' : 'bg-green-500'"
            ></div>
            <span class="text-sm text-gray-900 dark:text-white font-medium">
              {{ networkInfo?.displayName || 'Unknown' }}
            </span>
          </div>
        </div>

        <!-- Algo Balance -->
        <div class="p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Balance
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formattedAlgoBalance }}
            </span>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              ALGO
            </span>
          </div>
        </div>

        <!-- Asset Holdings -->
        <div v-if="hasAssets" class="space-y-2">
          <div class="text-xs font-medium text-gray-500 dark:text-gray-400">
            Asset Holdings ({{ accountBalance.assets.length }})
          </div>
          <div class="max-h-48 overflow-y-auto space-y-2">
            <div
              v-for="asset in accountBalance.assets.slice(0, 5)"
              :key="asset.assetId"
              class="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ asset.assetName || asset.unitName || `Asset #${asset.assetId}` }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    ID: {{ asset.assetId }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ formatAmount(asset.amount, asset.decimals) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ asset.unitName || '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            v-if="accountBalance.assets.length > 5"
            class="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            View all {{ accountBalance.assets.length }} assets
          </button>
        </div>

        <div v-else class="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
          No asset holdings
        </div>

        <!-- Error State -->
        <div v-if="accountBalance.error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-red-500"></i>
            <div class="flex-1">
              <div class="text-sm font-medium text-red-600 dark:text-red-400">
                Failed to load balance
              </div>
              <div class="text-xs text-red-500 dark:text-red-400 mt-1">
                {{ accountBalance.error }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Not Connected State -->
      <div v-else class="text-center py-6">
        <i class="pi pi-wallet text-4xl text-gray-400 mb-3"></i>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Connect your wallet to view balance
        </p>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from './ui/Card.vue'
import { useWalletManager } from '../composables/useWalletManager'
import { useTokenBalance } from '../composables/useTokenBalance'

const { isConnected, activeAddress, formattedAddress, networkInfo } = useWalletManager()
const { 
  accountBalance, 
  isLoading, 
  hasAssets, 
  formattedAlgoBalance, 
  refresh 
} = useTokenBalance()

const formatAmount = (amount: number, decimals: number): string => {
  const divisor = Math.pow(10, decimals)
  return (amount / divisor).toFixed(decimals)
}

const copyAddress = async () => {
  if (activeAddress.value) {
    try {
      await navigator.clipboard.writeText(activeAddress.value)
      // Address copied successfully - could add toast notification via global event bus
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }
}
</script>

<style scoped>
.wallet-info {
  @apply transition-all duration-200;
}
</style>
