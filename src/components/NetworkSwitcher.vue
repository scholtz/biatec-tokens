<template>
  <div class="relative" ref="dropdownRef">
    <!-- Network Button -->
    <button
      @click="toggleDropdown"
      class="flex items-center space-x-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-biatec-accent/30 transition-all"
      :class="{ 'ring-2 ring-biatec-accent border-biatec-accent': isOpen }"
    >
      <span
        class="w-2 h-2 rounded-full"
        :class="networkStatusColor"
        :title="networkStatus"
      ></span>
      <div class="text-left">
        <div class="text-sm font-medium text-white flex items-center gap-2">
          {{ currentNetworkInfo.displayName }}
          <span
            v-if="!currentNetworkInfo.isTestnet"
            class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400"
          >
            Mainnet
          </span>
        </div>
        <div class="text-xs text-gray-400">{{ networkStatus }}</div>
      </div>
      <i class="pi pi-chevron-down text-gray-400 text-sm transition-transform" :class="{ 'rotate-180': isOpen }"></i>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 glass-effect rounded-xl shadow-2xl border border-white/10 p-2 z-50"
      >
        <!-- Current Network Info -->
        <div class="p-4 mb-2 bg-gradient-to-br from-white/5 to-white/10 rounded-lg border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-300 flex items-center gap-2">
              <i class="pi pi-server text-biatec-accent"></i>
              Current Network
            </span>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="currentNetworkInfo.isTestnet ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'"
            >
              {{ currentNetworkInfo.isTestnet ? 'Testnet' : 'Mainnet' }}
            </span>
          </div>
          <div class="text-white font-semibold mb-2">{{ currentNetworkInfo.displayName }}</div>
          <div class="text-xs text-gray-400 space-y-1">
            <div v-if="currentNetworkInfo.chainType === 'AVM'" class="flex items-center gap-2">
              <i class="pi pi-globe text-xs"></i>
              <span class="truncate">{{ currentNetworkInfo.algodUrl }}</span>
            </div>
            <div v-if="currentNetworkInfo.chainType === 'AVM'" class="flex items-center gap-2">
              <i class="pi pi-tag text-xs"></i>
              <span>{{ currentNetworkInfo.genesisId }}</span>
            </div>
            <div v-if="currentNetworkInfo.chainType === 'EVM'" class="flex items-center gap-2">
              <i class="pi pi-link text-xs"></i>
              <span class="truncate">{{ currentNetworkInfo.rpcUrl }}</span>
            </div>
            <div v-if="currentNetworkInfo.chainType === 'EVM'" class="flex items-center gap-2">
              <i class="pi pi-hashtag text-xs"></i>
              <span>Chain ID: {{ currentNetworkInfo.chainId }}</span>
            </div>
          </div>
        </div>

        <!-- Network List -->
        <div class="space-y-1">
          <!-- AVM Networks Section -->
          <div class="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
            AVM Chains (Algorand-based)
          </div>
          
          <button
            v-for="network in avmNetworks"
            :key="network.id"
            @click="handleNetworkSwitch(network.id)"
            :disabled="isSwitching || network.id === currentNetwork"
            class="w-full p-3 rounded-lg text-left transition-all group"
            :class="[
              network.id === currentNetwork
                ? 'bg-biatec-accent/20 border border-biatec-accent/50'
                : 'hover:bg-white/10 border border-transparent',
              isSwitching ? 'opacity-50 cursor-not-allowed' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-white font-medium text-sm">{{ network.displayName }}</span>
                  <span
                    v-if="network.id === currentNetwork"
                    class="px-1.5 py-0.5 text-xs font-medium rounded bg-biatec-accent/30 text-biatec-accent"
                  >
                    Active
                  </span>
                  <span
                    v-if="!network.isTestnet"
                    class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400"
                  >
                    Mainnet
                  </span>
                </div>
                <div class="text-xs text-gray-400">{{ network.genesisId }}</div>
              </div>
              <i
                v-if="network.id === currentNetwork"
                class="pi pi-check text-biatec-accent"
              ></i>
              <i
                v-else
                class="pi pi-chevron-right text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              ></i>
            </div>
          </button>

          <!-- EVM Networks Section -->
          <div class="px-2 py-1 mt-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
            EVM Chains (Ethereum-based)
          </div>
          
          <button
            v-for="network in evmNetworks"
            :key="network.id"
            @click="handleNetworkSwitch(network.id)"
            :disabled="isSwitching || network.id === currentNetwork"
            class="w-full p-3 rounded-lg text-left transition-all group"
            :class="[
              network.id === currentNetwork
                ? 'bg-biatec-accent/20 border border-biatec-accent/50'
                : 'hover:bg-white/10 border border-transparent',
              isSwitching ? 'opacity-50 cursor-not-allowed' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-white font-medium text-sm">{{ network.displayName }}</span>
                  <span
                    v-if="network.id === currentNetwork"
                    class="px-1.5 py-0.5 text-xs font-medium rounded bg-biatec-accent/30 text-biatec-accent"
                  >
                    Active
                  </span>
                  <span
                    v-if="!network.isTestnet"
                    class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400"
                  >
                    Mainnet
                  </span>
                </div>
                <div class="text-xs text-gray-400">Chain ID: {{ network.chainId }}</div>
              </div>
              <i
                v-if="network.id === currentNetwork"
                class="pi pi-check text-biatec-accent"
              ></i>
              <i
                v-else
                class="pi pi-chevron-right text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              ></i>
            </div>
          </button>
        </div>

        <!-- Warning -->
        <div v-if="isWalletConnected" class="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-yellow-400 text-sm mt-0.5"></i>
            <p class="text-xs text-gray-300">
              Switching networks will disconnect your current wallet. You'll need to reconnect after switching.
            </p>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="pi pi-times-circle text-red-400"></i>
            <p class="text-xs text-red-400">{{ error }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWalletManager, AVM_NETWORKS, EVM_NETWORKS, type NetworkId } from '../composables/useWalletManager'

const { currentNetwork, networkInfo: currentNetworkInfo, switchNetwork, isConnected: isWalletConnected } = useWalletManager()

const isOpen = ref(false)
const isSwitching = ref(false)
const error = ref<string | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const avmNetworks = computed(() => Object.values(AVM_NETWORKS))
const evmNetworks = computed(() => Object.values(EVM_NETWORKS))

const networkStatus = computed(() => {
  if (isSwitching.value) return 'Switching...'
  return 'Online'
})

const networkStatusColor = computed(() => {
  if (isSwitching.value) return 'bg-yellow-400 animate-pulse'
  return 'bg-green-400'
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  error.value = null
}

const handleNetworkSwitch = async (networkId: NetworkId) => {
  if (networkId === currentNetwork.value || isSwitching.value) {
    return
  }

  isSwitching.value = true
  error.value = null

  try {
    await switchNetwork(networkId)
    isOpen.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to switch network'
    console.error('Network switch error:', err)
  } finally {
    isSwitching.value = false
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && event.target && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
