<template>
  <div class="account-switcher" v-if="accounts.length > 0">
    <div class="relative">
      <button
        @click="isOpen = !isOpen"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span class="text-white text-sm font-medium">
            {{ activeAccountInitial }}
          </span>
        </div>
        <div class="hidden sm:block text-left">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ formatAddress(activeAddress || '') }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ accounts.length }} account{{ accounts.length !== 1 ? 's' : '' }}
          </p>
        </div>
        <i 
          class="pi text-xs text-gray-500 dark:text-gray-400 transition-transform"
          :class="isOpen ? 'pi-chevron-up' : 'pi-chevron-down'"
        ></i>
      </button>

      <!-- Accounts Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-96 overflow-y-auto"
        >
          <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
              Select Account
            </h4>
          </div>

          <div
            v-for="(account, index) in accounts"
            :key="account.address"
            @click="switchAccount(account.address)"
            class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20': account.address === activeAddress }"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span class="text-white font-medium">
                  {{ getAccountInitial(account.address) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Account {{ index + 1 }}
                  </p>
                  <Badge
                    v-if="account.address === activeAddress"
                    variant="success"
                    class="text-xs"
                  >
                    Active
                  </Badge>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <code class="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                    {{ formatAddress(account.address) }}
                  </code>
                  <button
                    @click.stop="copyAddress(account.address)"
                    class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    :title="'Copy address'"
                  >
                    <i class="pi pi-copy text-xs text-gray-500"></i>
                  </button>
                </div>
              </div>
              <i 
                v-if="account.address === activeAddress"
                class="pi pi-check text-green-600 dark:text-green-400"
              ></i>
            </div>

            <!-- Account Balance Preview -->
            <div v-if="accountBalances.has(account.address)" class="mt-2 pl-13">
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Balance: 
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ formatBalance(accountBalances.get(account.address)!) }}
                </span>
                ALGO
              </div>
            </div>
          </div>

          <!-- Add Account Option (if supported) -->
          <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
            <button
              @click="handleAddAccount"
              class="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
            >
              <i class="pi pi-plus mr-2"></i>
              Connect Another Account
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWalletManager } from '../composables/useWalletManager'
import Badge from './ui/Badge.vue'

const { accounts, activeAddress, setActiveAccount } = useWalletManager()
const isOpen = ref(false)
const accountBalances = ref(new Map<string, number>())

const activeAccountInitial = computed(() => {
  if (!activeAddress.value) return '?'
  return activeAddress.value.charAt(0).toUpperCase()
})

const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getAccountInitial = (address: string): string => {
  return address.charAt(0).toUpperCase()
}

const formatBalance = (balance: number): string => {
  return (balance / 1_000_000).toFixed(4)
}

const switchAccount = async (address: string) => {
  try {
    await setActiveAccount(address)
    isOpen.value = false
  } catch (error) {
    console.error('Failed to switch account:', error)
  }
}

const copyAddress = async (address: string) => {
  try {
    await navigator.clipboard.writeText(address)
    // Address copied successfully - could add toast notification via global event bus
  } catch (error) {
    console.error('Failed to copy address:', error)
  }
}

const handleAddAccount = () => {
  isOpen.value = false
  // Future enhancement: trigger wallet connect modal to add additional accounts
  // This would emit an event or update global state to open the WalletConnectModal
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value) {
    const target = event.target as HTMLElement
    if (!target.closest('.account-switcher')) {
      isOpen.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for account changes to update balances
watch(accounts, async () => {
  // Here you could fetch balances for all accounts
  // For now, we'll leave it as a placeholder
}, { immediate: true })
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
</style>
