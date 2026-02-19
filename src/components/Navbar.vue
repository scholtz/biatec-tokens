<template>
  <nav class="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10" role="navigation" aria-label="Main navigation">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo -->
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br from-biatec-accent to-biatec-teal rounded-xl flex items-center justify-center shadow-lg" aria-hidden="true">
            <span class="text-white font-bold text-xl">B</span>
          </div>
          <div>
            <span class="text-2xl font-bold text-white">Biatec Tokens</span>
            <p class="text-sm text-gray-400">Next-Gen Tokenization</p>
          </div>
        </div>

        <!-- Desktop Navigation Links (shared nav items - matches mobile exactly) -->
        <div class="hidden md:flex items-center space-x-8" role="menubar">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="text-white hover:text-biatec-accent transition-colors duration-200 font-medium text-lg relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-biatec-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-sm"
            :class="{ 'text-biatec-accent': isActive(item) }"
            :aria-current="isActive(item) ? 'page' : undefined"
            role="menuitem"
          >
            {{ item.label }}
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-biatec-accent transition-all duration-200 group-hover:w-full" :class="{ 'w-full': isActive(item) }" aria-hidden="true"></span>
          </router-link>
        </div>

        <!-- Account Section -->
        <div class="flex items-center space-x-4">
          <!-- Account Button -->
          <div class="relative">
            <button
              @click="handleWalletClick"
              class="btn-primary px-6 py-3 rounded-xl text-white font-medium text-sm flex items-center space-x-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              :aria-expanded="showAccountMenu"
              :aria-haspopup="authStore.isAuthenticated ? 'menu' : undefined"
              :aria-label="authStore.isAuthenticated ? `Account menu for ${authStore.formattedAddress}` : AUTH_UI_COPY.SIGN_IN"
            >
              <i class="pi pi-user text-lg" aria-hidden="true"></i>
              <span>{{ authButtonText }}</span>
              <i v-if="authStore.isAuthenticated" class="pi pi-chevron-down text-sm" aria-hidden="true"></i>
            </button>

            <!-- Account Menu Dropdown -->
            <Transition name="dropdown">
              <div v-if="showAccountMenu && authStore.isAuthenticated" class="absolute right-0 mt-2 w-64 glass-effect rounded-xl shadow-2xl border border-white/10 p-2 z-50" role="menu" aria-label="Account options">
                <div class="p-3 border-b border-white/10 mb-2">
                  <div class="text-xs text-gray-400 mb-1">{{ AUTH_UI_COPY.CONNECTED_ADDRESS }}</div>
                  <div class="text-sm text-white font-mono break-all" :title="authStore.account ?? undefined">{{ authStore.formattedAddress }}</div>
                </div>

                <router-link
                  to="/account/security"
                  @click="showAccountMenu = false"
                  class="w-full p-3 rounded-lg text-left hover:bg-blue-500/10 transition-colors flex items-center gap-3 text-white mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-biatec-accent rounded-lg"
                  role="menuitem"
                >
                  <i class="pi pi-shield" aria-hidden="true"></i>
                  <span class="font-medium">{{ AUTH_UI_COPY.SECURITY_CENTER }}</span>
                </router-link>

                <button @click="handleDisconnect" class="w-full p-3 rounded-lg text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400" role="menuitem">
                  <i class="pi pi-sign-out" aria-hidden="true"></i>
                  <span class="font-medium">{{ AUTH_UI_COPY.SIGN_OUT }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Sign-In Modal (Email/Password) -->
        <EmailAuthModal :is-open="showWalletModal" :show-network-selector="false" @close="showWalletModal = false" @connected="handleConnected" />

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="md:hidden p-3 rounded-xl text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          :aria-expanded="showMobileMenu"
          aria-controls="mobile-menu"
          :aria-label="showMobileMenu ? 'Close navigation menu' : 'Open navigation menu'"
        >
          <i :class="showMobileMenu ? 'pi pi-times' : 'pi pi-bars'" class="text-xl" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Menu (same items as desktop - single source of truth) -->
    <div v-if="showMobileMenu" id="mobile-menu" class="md:hidden glass-effect border-t border-white/10" role="menu" aria-label="Mobile navigation">
      <div class="px-4 py-4 space-y-2">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          @click="toggleMobileMenu"
          class="block px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-biatec-accent focus-visible:ring-inset"
          :class="{ 'bg-white/10 text-biatec-accent': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
          role="menuitem"
        >
          {{ item.label }}
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
// AUTH_STORAGE_KEYS removed - no longer used in this component
import { AUTH_UI_COPY } from "../constants/uiCopy";
import { telemetryService } from "../services/TelemetryService";
import EmailAuthModal from "./EmailAuthModal.vue";
import { useAuthStore } from "../stores/auth";
import { NAV_ITEMS, type NavItem } from "../constants/navItems";
// WalletOnboardingWizard removed per MVP requirements (wallet-free mode)
// NetworkSwitcher removed per MVP requirements (wallet-free mode)

const authStore = useAuthStore();
const route = useRoute();
const showMobileMenu = ref(false);
const showWalletModal = ref(false);
const showAccountMenu = ref(false);
const loginStartTime = ref<number | null>(null);

const navItems: readonly NavItem[] = NAV_ITEMS;

const isActive = (item: NavItem): boolean => route.name === item.routeName;

// hasCompletedOnboarding removed - no longer used per wallet-free mode

const authButtonText = computed(() => {
  if (authStore.isAuthenticated) return authStore.formattedAddress;
  return AUTH_UI_COPY.SIGN_IN;
});

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const handleWalletClick = () => {
  if (authStore.isAuthenticated) {
    // Toggle account menu when authenticated
    showAccountMenu.value = !showAccountMenu.value;
  } else {
    // Track login started
    loginStartTime.value = Date.now();
    telemetryService.trackLoginStarted({ source: "navbar" });

    // Show authentication modal for all users (email/password)
    showWalletModal.value = true;
  }
};

const handleDisconnect = async () => {
  try {
    await authStore.signOut();
    showAccountMenu.value = false;
  } catch (error) {
    console.error("Failed to disconnect:", error);
  }
};

const handleConnected = () => {
  showWalletModal.value = false;

  // Track login completed with duration
  if (loginStartTime.value) {
    const durationMs = Date.now() - loginStartTime.value;
    telemetryService.trackLoginCompleted({
      walletId: authStore.account || "unknown",
      network: "unknown",
      durationMs,
    });
    loginStartTime.value = null;
  }
};
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
