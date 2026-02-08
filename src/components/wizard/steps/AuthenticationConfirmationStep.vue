<template>
  <WizardStep
    title="Welcome to Biatec Tokens"
    description="Your account is ready. Let's create your first compliant token."
    :validation-errors="errors"
    :show-errors="showErrors"
  >
    <!-- Authentication Status Card -->
    <div class="space-y-6">
      <!-- Account Verified Badge -->
      <div class="flex items-center justify-center py-8">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500 mb-4 animate-pulse-slow">
            <i class="pi pi-check text-green-400 text-4xl"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Account Verified
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            You're authenticated and ready to create tokens
          </p>
        </div>
      </div>

      <!-- Account Information -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-user text-biatec-accent"></i>
          Account Information
        </h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-gray-700">
            <span class="text-sm text-gray-500 dark:text-gray-400">Email</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ userEmail }}</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-gray-700">
            <span class="text-sm text-gray-500 dark:text-gray-400">Authentication Method</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <i class="pi pi-shield-check text-green-400"></i>
              Email & Password (ARC76)
            </span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
            <span class="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
              <i class="pi pi-check-circle"></i>
              Active
            </span>
          </div>
        </div>
      </div>

      <!-- No Wallet Required Notice -->
      <div class="p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
          <div>
            <h5 class="text-sm font-semibold text-blue-400 mb-2">No Wallet or Blockchain Knowledge Required</h5>
            <p class="text-sm text-gray-300 mb-3">
              Unlike traditional blockchain platforms, Biatec Tokens handles all the technical complexity for you. 
              You won't need to manage wallets, gas fees, or understand blockchain terminology.
            </p>
            <ul class="text-sm text-gray-400 space-y-1">
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400 text-xs"></i>
                <span>Backend handles all blockchain operations</span>
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400 text-xs"></i>
                <span>No transaction fees to worry about</span>
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400 text-xs"></i>
                <span>Enterprise-grade security and compliance</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- What's Next -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-list text-biatec-accent"></i>
          What's Next
        </h4>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-biatec-accent/20 flex items-center justify-center">
              <span class="text-sm font-semibold text-biatec-accent">1</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Choose Your Plan</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Select a subscription that fits your needs</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <span class="text-sm font-semibold text-gray-400">2</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Configure Your Token</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Choose network, standard, and token details</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <span class="text-sm font-semibold text-gray-400">3</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Review Compliance</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Ensure regulatory requirements are met</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <span class="text-sm font-semibold text-gray-400">4</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Deploy Your Token</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">We handle the deployment automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../stores/auth'
import WizardStep from '../WizardStep.vue'

const authStore = useAuthStore()

const showErrors = ref(false)
const errors = ref<string[]>([])

const userEmail = computed(() => {
  return authStore.user?.email || authStore.arc76email || 'Not available'
})

onMounted(() => {
  // Validate that user is authenticated
  if (!authStore.isAuthenticated) {
    errors.value = ['You must be logged in to access the token creation wizard']
    showErrors.value = true
  }
})

// This step is always valid if user is authenticated
const isValid = computed(() => authStore.isAuthenticated)

defineExpose({
  isValid,
})
</script>
