<template>
  <nav class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800" role="navigation" aria-label="Main navigation">
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
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            :class="
              isActiveRoute(item.path)
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            "
            :aria-current="isActiveRoute(item.path) ? 'page' : undefined"
          >
            <component :is="item.icon" class="w-4 h-4 inline mr-2" aria-hidden="true" />
            {{ item.name }}
          </router-link>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-3">
          <!-- Theme Toggle -->
          <button
            @click="themeStore.toggleTheme()"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            :aria-label="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <SunIcon v-if="themeStore.isDark" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
          </button>

          <!-- Subscription Status -->
          <div v-if="authStore.isAuthenticated && subscriptionStore.currentProduct" class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
            <div class="w-2 h-2 rounded-full bg-green-500"></div>
            <span class="text-xs font-medium text-green-700 dark:text-green-300">{{ subscriptionStore.currentProduct.name }}</span>
          </div>

          <!-- Sign In Button (when not authenticated) -->
          <div v-if="!authStore.isAuthenticated">
            <button
              @click="handleSignInClick"
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
            class="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            :aria-expanded="showMobileMenu"
            aria-controls="mobile-nav-menu"
            :aria-label="showMobileMenu ? 'Close navigation menu' : 'Open navigation menu'"
          >
            <Bars3Icon v-if="!showMobileMenu" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Authentication Modal (Email/Password only) -->
    <EmailAuthModal :is-open="showAuthModal" @close="showAuthModal = false" @connected="handleAuthSuccess" />

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="showMobileMenu" id="mobile-nav-menu" class="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div class="px-4 py-3 space-y-1">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.path"
            @click="showMobileMenu = false"
            class="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
            :class="
              isActiveRoute(item.path)
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            "
            :aria-current="isActiveRoute(item.path) ? 'page' : undefined"
          >
            <component :is="item.icon" class="w-5 h-5 mr-3" aria-hidden="true" />
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useThemeStore } from "../../stores/theme";
import { useSubscriptionStore } from "../../stores/subscription";
import { AUTH_STORAGE_KEYS } from "../../constants/auth";
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  CommandLineIcon,
} from "@heroicons/vue/24/outline";
import EmailAuthModal from "../EmailAuthModal.vue";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const authStore = useAuthStore();
const subscriptionStore = useSubscriptionStore();

const showMobileMenu = ref(false);
const showUserMenu = ref(false);
const showAuthModal = ref(false);

const navigationItems = [
  { name: "Home", path: "/", icon: HomeIcon },
  { name: "Cockpit", path: "/cockpit", icon: CommandLineIcon },
  { name: "Guided Launch", path: "/launch/guided", icon: RocketLaunchIcon },
  { name: "Compliance", path: "/compliance/setup", icon: ShieldCheckIcon },
  { name: "Dashboard", path: "/dashboard", icon: ChartBarIcon },
  { name: "Insights", path: "/insights", icon: ChartPieIcon },
  { name: "Pricing", path: "/subscription/pricing", icon: CurrencyDollarIcon },
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
  await authStore.signOut();
  router.push("/");
};

const handleSignInClick = () => {
  showAuthModal.value = true;
};

const handleAuthSuccess = (_data: { address: string; walletId: string; network: string }) => {
  showAuthModal.value = false;

  // Check if there's a redirect path stored (AC #6)
  const redirectPath = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
  if (redirectPath) {
    localStorage.removeItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    router.push(redirectPath);
  }

  // The Arc76 authentication component will handle the authentication
};

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await subscriptionStore.fetchSubscription();
  }
});
</script>
