<template>
  <nav class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center space-x-3 group">
          <img src="../../assets/logo-icon.svg" alt="Biatec Tokens Logo" class="h-14 w-auto hidden sm:block" />
          <div class="hidden sm:block">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Biatec Tokens</h1>
          </div>
        </router-link>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-1">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.path"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors relative group"
            :class="
              isActiveRoute(item.path)
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            "
          >
            <component :is="item.icon" class="w-4 h-4 inline mr-2" />
            {{ item.name }}
          </router-link>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-3">
          <!-- Theme Toggle -->
          <button
            @click="themeStore.toggleTheme()"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <SunIcon v-if="themeStore.isDark" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
          </button>

          <!-- Subscription Status -->
          <div v-if="authStore.isAuthenticated && subscriptionStore.currentProduct" class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
            <div class="w-2 h-2 rounded-full bg-green-500"></div>
            <span class="text-xs font-medium text-green-700 dark:text-green-300">{{ subscriptionStore.currentProduct.name }}</span>
          </div>

          <!-- Wallet Status Badge - Hidden for MVP wallet-free authentication (AC #4) -->
          <!-- Per business-owner-roadmap.md: "remove this display as frontend should work without wallet connection requirement" -->
          <!-- Uncomment the section below and the handler functions if wallet UI is needed in the future
          <div class="hidden sm:block">
            <WalletStatusBadge
              :connection-state="walletManager.walletState?.value?.connectionState"
              :network-info="walletManager.networkInfo?.value"
              :address="walletManager.activeAddress?.value"
              :formatted-address="walletManager.formattedAddress?.value"
              :has-error="!!walletManager.walletState?.value?.lastError"
              :is-compact="false"
              @click="handleStatusBadgeClick"
              @error-click="handleErrorClick"
            />
          </div>
          -->

          <!-- Sign In Button (when not authenticated) -->
          <div v-if="!authStore.isAuthenticated">
            <button
              @click="handleWalletClick"
              class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors"
            >
              <ArrowRightOnRectangleIcon class="w-5 h-5" />
              <span>Sign In</span>
            </button>
          </div>

          <!-- User Menu -->
          <div v-else class="relative">
            <button @click="showUserMenu = !showUserMenu" class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white text-sm font-medium">
                  {{ authStore.account.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.arc76email }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatAddress(authStore.account) }}</p>
              </div>
              <ChevronDownIcon class="w-4 h-4 text-gray-500" />
            </button>

            <!-- User Dropdown -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.arc76email }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatAddress(authStore.account) }}</p>
                </div>
                <router-link to="/account/security" @click="showUserMenu = false" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  Security Center
                </router-link>
                <router-link to="/subscription/pricing" @click="showUserMenu = false" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  Subscription
                </router-link>
                <router-link to="/settings" @click="showUserMenu = false" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  Settings
                </router-link>
                <button @click="handleSignOut" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Sign Out</button>
              </div>
            </Transition>
          </div>

          <!-- Mobile Menu Button -->
          <button
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bars3Icon v-if="!showMobileMenu" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Wallet Connect Modal -->
    <WalletConnectModal :is-open="showWalletModal" @close="showWalletModal = false" @connected="handleWalletConnected" />

    <!-- Wallet Recovery Panel Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showRecoveryPanel" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="showRecoveryPanel = false">
          <WalletRecoveryPanel
            :session-info="loadWalletSession()"
            :is-reconnecting="walletManager.isReconnecting?.value || false"
            :recovery-error="walletManager.walletState?.value?.error || null"
            @reconnect="handleRecoveryReconnect"
            @start-fresh="handleStartFresh"
            @show-guide="() => {}"
            @show-diagnostics="() => { showRecoveryPanel = false; showDiagnosticsPanel = true; }"
          />
        </div>
      </Transition>
    </Teleport>

    <!-- Wallet Diagnostics Panel Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDiagnosticsPanel" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="showDiagnosticsPanel = false">
          <WalletDiagnosticsPanel
            :diagnostic-data="diagnosticData"
            @close="showDiagnosticsPanel = false"
            @refresh="handleDiagnosticsRefresh"
            @copied="() => {}"
          />
        </div>
      </Transition>
    </Teleport>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="showMobileMenu" class="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div class="px-4 py-3 space-y-1">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.path"
            @click="showMobileMenu = false"
            class="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="
              isActiveRoute(item.path)
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            "
          >
            <component :is="item.icon" class="w-5 h-5 mr-3" />
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useThemeStore } from "../../stores/theme";
import { useSubscriptionStore } from "../../stores/subscription";
import { useAVMAuthentication } from "algorand-authentication-component-vue";
import { AUTH_STORAGE_KEYS } from "../../constants/auth";
import { HomeIcon, PlusCircleIcon, ChartBarIcon, Cog6ToothIcon, SunIcon, MoonIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, UserCircleIcon, CurrencyDollarIcon } from "@heroicons/vue/24/outline";
import WalletConnectModal from "../WalletConnectModal.vue";
// import WalletStatusBadge from "../WalletStatusBadge.vue"; // Hidden for MVP wallet-free auth (AC #4)
import WalletRecoveryPanel from "../WalletRecoveryPanel.vue";
import WalletDiagnosticsPanel from "../WalletDiagnosticsPanel.vue";
import { useWalletManager } from "../../composables/useWalletManager";
import { collectDiagnosticData, loadWalletSession } from "../../services/WalletSessionService";

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const { authStore, logout } = useAVMAuthentication();
const subscriptionStore = useSubscriptionStore();
const walletManager = useWalletManager();

const showMobileMenu = ref(false);
const showUserMenu = ref(false);
const showWalletModal = ref(false);
const showRecoveryPanel = ref(false);
const showDiagnosticsPanel = ref(false);

const navigationItems = [
  { name: "Home", path: "/", icon: HomeIcon },
  { name: "Create", path: "/create", icon: PlusCircleIcon },
  { name: "Dashboard", path: "/dashboard", icon: ChartBarIcon },
  { name: "Pricing", path: "/subscription/pricing", icon: CurrencyDollarIcon },
  { name: "Account", path: "/account", icon: UserCircleIcon },
  { name: "Settings", path: "/settings", icon: Cog6ToothIcon },
];

const isActiveRoute = (path: string) => {
  return route.path === path;
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const formatAddress = (address?: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const handleSignOut = async () => {
  showUserMenu.value = false;
  await logout();
  router.push("/");
};

const handleWalletClick = () => {
  showWalletModal.value = true;
};

const handleWalletConnected = (_data: { address: string; walletId: string; network: string }) => {
  showWalletModal.value = false;
  
  // Check if there's a redirect path stored (AC #6)
  const redirectPath = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
  if (redirectPath) {
    localStorage.removeItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    router.push(redirectPath);
  }
  
  // The Arc76 authentication component will handle the authentication
};

// Handler functions for WalletStatusBadge - Currently commented out as badge is hidden for MVP
// Uncomment these if WalletStatusBadge is re-enabled in the future
/*
const handleStatusBadgeClick = () => {
  // If not connected, show wallet modal
  if (!walletManager.isConnected?.value) {
    showWalletModal.value = true;
  } else {
    // If connected, show user menu
    showUserMenu.value = !showUserMenu.value;
  }
};

const handleErrorClick = () => {
  showDiagnosticsPanel.value = true;
};
*/


const handleRecoveryReconnect = async (data: { walletId: string; networkId: any }) => {
  try {
    await walletManager.switchNetwork?.(data.networkId);
    await walletManager.connect?.(data.walletId);
    showRecoveryPanel.value = false;
  } catch (error) {
    console.error('Recovery reconnection failed:', error);
  }
};

const handleStartFresh = () => {
  showRecoveryPanel.value = false;
  showWalletModal.value = true;
};

const handleDiagnosticsRefresh = () => {
  // Force recollection of diagnostic data by triggering a reactive update
  // The computed diagnosticData will automatically recalculate
  walletManager.updateWalletState?.();
};

const diagnosticData = computed(() => {
  return collectDiagnosticData({
    connectionState: walletManager.walletState?.value?.connectionState,
    currentNetwork: walletManager.currentNetwork?.value,
    activeAddress: walletManager.activeAddress?.value,
    activeWallet: walletManager.activeWallet?.value,
    lastError: walletManager.walletState?.value?.lastError,
  });
});

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await subscriptionStore.fetchSubscription();
  }
  
  // Check if we should show recovery panel on load
  const session = loadWalletSession();
  if (session && !walletManager.isConnected?.value) {
    // Optionally show recovery panel after a delay
    setTimeout(() => {
      if (!walletManager.isConnected?.value) {
        // Uncomment to auto-show recovery panel
        // showRecoveryPanel.value = true;
      }
    }, 2000);
  }
});
</script>
