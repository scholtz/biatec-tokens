<template>
  <nav class="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo -->
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br from-biatec-accent to-biatec-teal rounded-xl flex items-center justify-center shadow-lg">
            <span class="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">Biatec Tokens</h1>
            <p class="text-sm text-gray-300">Next-Gen Tokenization</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link
            to="/"
            class="text-white hover:text-biatec-accent transition-colors duration-200 font-medium text-lg relative group"
            :class="{ 'text-biatec-accent': $route.name === 'Home' }"
          >
            Home
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-biatec-accent transition-all duration-200 group-hover:w-full" :class="{ 'w-full': $route.name === 'Home' }"></span>
          </router-link>
          <router-link
            to="/create"
            class="text-white hover:text-biatec-accent transition-colors duration-200 font-medium text-lg relative group"
            :class="{ 'text-biatec-accent': $route.name === 'TokenCreator' }"
          >
            Create Token
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-biatec-accent transition-all duration-200 group-hover:w-full" :class="{ 'w-full': $route.name === 'TokenCreator' }"></span>
          </router-link>
          <router-link
            to="/dashboard"
            class="text-white hover:text-biatec-accent transition-colors duration-200 font-medium text-lg relative group"
            :class="{ 'text-biatec-accent': $route.name === 'TokenDashboard' }"
          >
            Dashboard
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-biatec-accent transition-all duration-200 group-hover:w-full" :class="{ 'w-full': $route.name === 'TokenDashboard' }"></span>
          </router-link>
          <router-link
            to="/marketplace"
            class="text-white hover:text-biatec-accent transition-colors duration-200 font-medium text-lg relative group"
            :class="{ 'text-biatec-accent': $route.name === 'Marketplace' }"
          >
            Marketplace
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-biatec-accent transition-all duration-200 group-hover:w-full" :class="{ 'w-full': $route.name === 'Marketplace' }"></span>
          </router-link>
          <router-link
            to="/attestations"
            class="text-white hover:text-biatec-accent transition-colors duration-200 font-medium text-lg relative group"
            :class="{ 'text-biatec-accent': $route.name === 'AttestationsDashboard' }"
          >
            Attestations
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-biatec-accent transition-all duration-200 group-hover:w-full" :class="{ 'w-full': $route.name === 'AttestationsDashboard' }"></span>
          </router-link>
          <router-link
            to="/allowances"
            class="text-white hover:text-biatec-accent transition-colors duration-200 font-medium text-lg relative group"
            :class="{ 'text-biatec-accent': $route.name === 'AllowanceCenter' }"
          >
            Permissions
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-biatec-accent transition-all duration-200 group-hover:w-full" :class="{ 'w-full': $route.name === 'AllowanceCenter' }"></span>
          </router-link>
          <router-link
            to="/settings"
            class="text-white hover:text-biatec-accent transition-colors duration-200 font-medium text-lg relative group"
            :class="{ 'text-biatec-accent': $route.name === 'Settings' }"
          >
            Settings
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-biatec-accent transition-all duration-200 group-hover:w-full" :class="{ 'w-full': $route.name === 'Settings' }"></span>
          </router-link>
        </div>

        <!-- Account Section -->
        <div class="flex items-center space-x-4">
          <!-- Network Switcher -->
          <NetworkSwitcher class="hidden sm:flex" />
          
          <!-- Account Button -->
          <div class="relative">
            <button
              @click="handleWalletClick"
              :disabled="walletState.isConnecting"
              class="btn-primary px-6 py-3 rounded-xl text-white font-medium text-sm flex items-center space-x-2 disabled:opacity-50 relative"
            >
              <i class="pi pi-user text-lg"></i>
              <span>{{ authButtonText }}</span>
              <i v-if="isConnected" class="pi pi-chevron-down text-sm"></i>
            </button>

            <!-- Account Menu Dropdown -->
            <Transition name="dropdown">
              <div
                v-if="showAccountMenu && isConnected"
                class="absolute right-0 mt-2 w-64 glass-effect rounded-xl shadow-2xl border border-white/10 p-2 z-50"
              >
                <div class="p-3 border-b border-white/10 mb-2">
                  <div class="text-xs text-gray-400 mb-1">{{ AUTH_UI_COPY.CONNECTED_ADDRESS }}</div>
                  <div class="text-sm text-white font-mono break-all">{{ activeAddress }}</div>
                </div>
                
                <router-link
                  to="/account/security"
                  @click="showAccountMenu = false"
                  class="w-full p-3 rounded-lg text-left hover:bg-blue-500/10 transition-colors flex items-center gap-3 text-white mb-1"
                >
                  <i class="pi pi-shield"></i>
                  <span class="font-medium">{{ AUTH_UI_COPY.SECURITY_CENTER }}</span>
                </router-link>
                
                <button
                  @click="handleDisconnect"
                  class="w-full p-3 rounded-lg text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400"
                >
                  <i class="pi pi-sign-out"></i>
                  <span class="font-medium">{{ AUTH_UI_COPY.SIGN_OUT }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Login Modal -->
        <WalletConnectModal
          :is-open="showWalletModal"
          @close="showWalletModal = false"
          @connected="handleConnected"
        />

        <!-- Onboarding Wizard -->
        <WalletOnboardingWizard
          :is-open="showOnboardingWizard"
          @close="showOnboardingWizard = false"
          @complete="handleConnected"
        />

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="md:hidden p-3 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <i class="pi pi-bars text-xl"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="showMobileMenu" class="md:hidden glass-effect border-t border-white/10">
      <div class="px-4 py-4 space-y-2">
        <router-link
          to="/"
          @click="toggleMobileMenu"
          class="block px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
        >
          Home
        </router-link>
        <router-link
          to="/create"
          @click="toggleMobileMenu"
          class="block px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
        >
          Create Token
        </router-link>
        <router-link
          to="/dashboard"
          @click="toggleMobileMenu"
          class="block px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
        >
          Dashboard
        </router-link>
        <router-link
          to="/attestations"
          @click="toggleMobileMenu"
          class="block px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
        >
          Attestations
        </router-link>
        <router-link
          to="/settings"
          @click="toggleMobileMenu"
          class="block px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
        >
          Settings
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWalletManager } from '../composables/useWalletManager'
import { AUTH_STORAGE_KEYS, WALLET_CONNECTION_STATE } from '../constants/auth'
import { AUTH_UI_COPY } from '../constants/uiCopy'
import { telemetryService } from '../services/TelemetryService'
import WalletConnectModal from './WalletConnectModal.vue'
import WalletOnboardingWizard from './WalletOnboardingWizard.vue'
import NetworkSwitcher from './NetworkSwitcher.vue'

const { isConnected, activeAddress, formattedAddress, disconnect, walletState } = useWalletManager()

const showMobileMenu = ref(false)
const showWalletModal = ref(false)
const showOnboardingWizard = ref(false)
const showAccountMenu = ref(false)
const loginStartTime = ref<number | null>(null)

// Check if user has completed onboarding before
const hasCompletedOnboarding = computed(() => {
  return localStorage.getItem(AUTH_STORAGE_KEYS.ONBOARDING_COMPLETED) === WALLET_CONNECTION_STATE.CONNECTED
})

const authButtonText = computed(() => {
  if (walletState.value.isConnecting) return AUTH_UI_COPY.SIGNING_IN
  if (isConnected.value && formattedAddress.value) return formattedAddress.value
  return AUTH_UI_COPY.SIGN_IN
})

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const handleWalletClick = () => {
  if (isConnected.value) {
    // Toggle account menu when authenticated
    showAccountMenu.value = !showAccountMenu.value
  } else {
    // Track login started
    loginStartTime.value = Date.now()
    telemetryService.trackLoginStarted({ source: 'navbar' })
    
    // Show authentication modal when not authenticated
    // Show onboarding wizard for first-time users, otherwise simple modal
    if (hasCompletedOnboarding.value) {
      showWalletModal.value = true
    } else {
      showOnboardingWizard.value = true
    }
  }
}

const handleDisconnect = async () => {
  try {
    await disconnect()
    showAccountMenu.value = false
  } catch (error) {
    console.error('Failed to disconnect:', error)
  }
}

const handleConnected = () => {
  showWalletModal.value = false
  showOnboardingWizard.value = false
  
  // Track login completed with duration
  if (loginStartTime.value) {
    const durationMs = Date.now() - loginStartTime.value
    const { currentNetwork } = useWalletManager()
    telemetryService.trackLoginCompleted({
      walletId: walletState.value.activeWallet || 'unknown',
      network: currentNetwork.value || 'unknown',
      durationMs
    })
    loginStartTime.value = null
  }
}
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
