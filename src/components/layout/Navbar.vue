<template>
  <!-- Skip to main content — WCAG 2.1 AA: provides keyboard shortcut to bypass navigation -->
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:text-sm focus:font-medium focus:rounded-br-lg"
  >
    Skip to main content
  </a>
  <nav class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800" role="navigation" aria-label="Main navigation">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo — aria-label required on mobile where both img and text span are hidden sm:block -->
        <router-link to="/" aria-label="Biatec Tokens Home" class="flex items-center space-x-3 group">
          <img src="../../assets/logo-icon.svg" alt="Biatec Tokens Logo" class="h-14 w-auto hidden sm:block" />
          <div class="hidden sm:block">
            <span class="text-xl font-bold text-gray-900 dark:text-white">Biatec Tokens</span>
          </div>
        </router-link>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-1" data-testid="desktop-nav-items">
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
          <!-- Trial Status Badge -->
          <div v-else-if="authStore.isAuthenticated && subscriptionStore.isInTrial" class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span class="text-xs font-medium text-blue-700 dark:text-blue-300">
              Trial · {{ subscriptionStore.trialDaysRemaining }}d left
            </span>
          </div>
          <!-- Past Due Badge -->
          <div v-else-if="authStore.isAuthenticated && subscriptionStore.subscription?.subscription_status === 'past_due'" class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
            <div class="w-2 h-2 rounded-full bg-red-500"></div>
            <span class="text-xs font-medium text-red-700 dark:text-red-300">Past Due</span>
          </div>

          <!-- Sign In Button (when not authenticated) -->
          <div v-if="!authStore.isAuthenticated">
            <button
              @click="handleSignInClick"
              aria-label="Sign in to your account"
              class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <ArrowRightOnRectangleIcon class="w-5 h-5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          </div>

          <!-- User Menu -->
          <div v-else class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              :aria-expanded="showUserMenu"
              aria-haspopup="menu"
              :aria-label="`User account menu for ${authStore.arc76email || 'account'}`"
            >
              <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white text-sm font-medium">
                  {{ authStore.account.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.arc76email }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatAddress(authStore.account) }}</p>
              </div>
              <ChevronDownIcon class="w-4 h-4 text-gray-500" aria-hidden="true" />
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
              <div
                v-if="showUserMenu"
                role="menu"
                aria-label="User account options"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
              >
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700" role="none">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.arc76email }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatAddress(authStore.account) }}</p>
                </div>
                <router-link to="/account/security" @click="showUserMenu = false" role="menuitem" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
                  Security Center
                </router-link>
                <router-link to="/subscription/pricing" @click="showUserMenu = false" role="menuitem" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
                  Subscription
                </router-link>
                <router-link to="/account/billing" @click="showUserMenu = false" role="menuitem" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
                  Billing History
                </router-link>
                <router-link to="/account/usage" @click="showUserMenu = false" role="menuitem" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
                  Usage &amp; Limits
                </router-link>
                <router-link to="/settings" @click="showUserMenu = false" role="menuitem" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
                  Settings
                </router-link>
                <button @click="handleSignOut" role="menuitem" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">Sign Out</button>
              </div>
            </Transition>
          </div>

          <!-- Mobile Menu Button -->
          <button
            ref="mobileMenuBtnRef"
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            :aria-expanded="showMobileMenu"
            aria-controls="mobile-nav-menu"
            :aria-label="showMobileMenu ? 'Close navigation menu' : 'Open navigation menu'"
            data-testid="mobile-menu-toggle"
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
import { ref, onMounted, onUnmounted } from "vue";
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
  RocketLaunchIcon,
  ShieldCheckIcon,
  CommandLineIcon,
  BuildingOfficeIcon,
  CubeIcon,
} from "@heroicons/vue/24/outline";
import type { FunctionalComponent, SVGAttributes } from "vue";
import EmailAuthModal from "../EmailAuthModal.vue";
import { useAuthStore } from "../../stores/auth";
import { NAV_ITEMS } from "../../constants/navItems";

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const authStore = useAuthStore();
const subscriptionStore = useSubscriptionStore();

const showMobileMenu = ref(false);
const showUserMenu = ref(false);
const showAuthModal = ref(false);

/** Template ref for the mobile menu toggle button — used to restore focus after Escape closes the menu (WCAG SC 2.1.2). */
const mobileMenuBtnRef = ref<HTMLButtonElement | null>(null);

/** Icon mapping for canonical nav items — kept local so navItems.ts stays dependency-free. */
const NAV_ICONS: Record<string, FunctionalComponent<SVGAttributes>> = {
  "/": HomeIcon,
  "/launch/guided": RocketLaunchIcon,
  "/launch/workspace": RocketLaunchIcon,
  "/dashboard": ChartBarIcon,
  "/portfolio": CubeIcon,
  "/operations": BuildingOfficeIcon,
  "/cockpit": CommandLineIcon,
  "/compliance/launch": ShieldCheckIcon,
  "/compliance/setup": ShieldCheckIcon,
  "/settings": Cog6ToothIcon,
};

/** Canonical navigation items derived from single source of truth (navItems.ts). */
const navigationItems = NAV_ITEMS.map((item) => ({
  name: item.label,
  path: item.path,
  icon: NAV_ICONS[item.path] ?? HomeIcon,
}));

const isActiveRoute = (path: string) => {
  return route.path === path;
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

/** Closes open menus when Escape is pressed — WCAG SC 2.1.1 (Keyboard). Restores focus to the invoking control — WCAG SC 2.1.2 (No Keyboard Trap). */
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    const mobileWasOpen = showMobileMenu.value;
    showMobileMenu.value = false;
    showUserMenu.value = false;
    // Return focus to the mobile menu toggle button when that menu was open,
    // so keyboard users are not left at an unpredictable focus position.
    if (mobileWasOpen && mobileMenuBtnRef.value) {
      mobileMenuBtnRef.value.focus();
    }
  }
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
  document.addEventListener("keydown", handleKeyDown);
  if (authStore.isAuthenticated) {
    await subscriptionStore.fetchSubscription();
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});
</script>
