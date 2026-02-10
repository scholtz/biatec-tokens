<template>
  <div class="glass-effect rounded-2xl p-8 max-w-5xl mx-auto mb-12 animate-fade-in" data-testid="landing-entry-module">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Get Started with Biatec Tokens
      </h2>
      <p class="text-gray-600 dark:text-gray-300 text-lg">
        Choose how you'd like to begin exploring token opportunities
      </p>
    </div>

    <!-- Two-column layout - Changed to single column for wallet-free authentication -->
    <div class="grid grid-cols-1 gap-6 mb-8 max-w-xl mx-auto">
      <!-- Email Sign Up Path (Primary) -->
      <button
        @click="handleEmailSignup"
        class="group relative overflow-hidden rounded-xl border-2 border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 text-left hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        aria-label="Sign up with email - recommended for new users"
        data-testid="email-signup-button"
      >
        <div class="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-bl-lg">
          Recommended
        </div>
        
        <div class="flex items-start gap-4 mb-4">
          <div class="w-12 h-12 rounded-xl bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-envelope text-2xl text-white"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Start with Email
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Perfect for exploring the platform. No wallet needed to get started—connect one later when you're ready.
            </p>
          </div>
        </div>

        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <i class="pi pi-check-circle text-green-500"></i>
            <span>Browse all tokens and standards</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <i class="pi pi-check-circle text-green-500"></i>
            <span>Save filters and preferences</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <i class="pi pi-check-circle text-green-500"></i>
            <span>View compliance information</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <i class="pi pi-lock"></i>
            <span class="italic">Authenticate later to create tokens</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
            Get Started
          </span>
          <i class="pi pi-arrow-right text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform"></i>
        </div>
      </button>

      <!-- Wallet Connect Path - Hidden for MVP wallet-free authentication -->
      <button
        v-if="false"
        @click="handleWalletConnect"
        class="group relative overflow-hidden rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-8 text-left hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        aria-label="Sign in with wallet - for users ready to create tokens"
        data-testid="wallet-connect-button"
      >
        <div class="flex items-start gap-4 mb-4">
          <div class="w-12 h-12 rounded-xl bg-purple-500 dark:bg-purple-600 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-wallet text-2xl text-white"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Sign In with Email
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              For users ready to create and deploy tokens. Authenticate with your email and password.
            </p>
          </div>
        </div>

        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <i class="pi pi-check-circle text-green-500"></i>
            <span>Full platform access</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <i class="pi pi-check-circle text-green-500"></i>
            <span>Create and deploy tokens</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <i class="pi pi-check-circle text-green-500"></i>
            <span>Manage your portfolio</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <i class="pi pi-check-circle text-green-500"></i>
            <span>Access advanced features</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-purple-600 dark:text-purple-400 font-semibold group-hover:gap-2 transition-all">
            Sign In
          </span>
          <i class="pi pi-arrow-right text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform"></i>
        </div>
      </button>
    </div>

    <!-- Info Footer -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
        <div class="text-sm text-gray-700 dark:text-gray-300">
          <strong class="text-blue-600 dark:text-blue-400">New to blockchain tokens?</strong>
          <p class="mt-1">
            Start with email to explore without any commitments. You can always connect a wallet later when you're ready to create tokens. 
            No prior wallet experience required to browse the platform.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOnboardingStore } from '../stores/onboarding'
import { telemetryService } from '../services/TelemetryService'

interface Emits {
  (e: 'email-signup'): void
  (e: 'wallet-connect'): void
}

const emit = defineEmits<Emits>()
const onboardingStore = useOnboardingStore()

const handleEmailSignup = () => {
  telemetryService.trackEmailSignupStarted({ source: 'landing_entry_module' })
  telemetryService.trackOnboardingStarted({ source: 'email_path' })
  
  // Mark welcome as seen and show onboarding
  onboardingStore.markStepComplete('welcome')
  onboardingStore.showOnboarding()
  
  emit('email-signup')
}

const handleWalletConnect = () => {
  telemetryService.trackOnboardingStarted({ source: 'wallet_path' })
  
  // Mark welcome as seen and trigger wallet connection
  onboardingStore.markStepComplete('welcome')
  
  emit('wallet-connect')
}
</script>

<style scoped>
/* Ensure smooth animations */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>
