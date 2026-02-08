<template>
  <WizardStep
    title="Choose Your Subscription Plan"
    description="Select a plan to unlock token creation features and deploy your tokens."
    :validation-errors="errors"
    :show-errors="showErrors"
    help-text="All plans include compliant token creation with MICA readiness checks. You can upgrade or downgrade at any time."
  >
    <div class="space-y-6">
      <!-- Subscription Status Banner -->
      <div 
        v-if="subscriptionStore.isActive"
        class="p-5 bg-green-500/10 border border-green-500/30 rounded-lg"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-check-circle text-green-400 text-2xl"></i>
          <div>
            <p class="text-sm font-semibold text-green-400">Active Subscription</p>
            <p class="text-xs text-gray-300">
              You have an active {{ subscriptionStore.currentProduct?.name || 'subscription' }} plan
            </p>
          </div>
        </div>
      </div>

      <!-- Inactive Subscription Warning -->
      <div 
        v-else
        class="p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-yellow-400 text-xl mt-0.5"></i>
          <div>
            <p class="text-sm font-semibold text-yellow-400 mb-1">Subscription Required</p>
            <p class="text-xs text-gray-300">
              You need an active subscription to deploy tokens. Please select a plan below to continue.
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="subscriptionStore.loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-3"></i>
          <p class="text-sm text-gray-400">Loading subscription plans...</p>
        </div>
      </div>

      <!-- Pricing Plans -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Basic Plan -->
        <div
          :class="[
            'relative glass-effect rounded-xl p-6 border-2 transition-all duration-200 cursor-pointer hover:scale-105',
            selectedPlan === 'basic' ? 'border-biatec-accent shadow-lg' : 'border-white/10'
          ]"
          @click="selectPlan('basic')"
        >
          <div v-if="selectedPlan === 'basic'" class="absolute top-4 right-4">
            <i class="pi pi-check-circle text-biatec-accent text-2xl"></i>
          </div>
          
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Basic</h3>
            <div class="mb-4">
              <span class="text-4xl font-bold text-gray-900 dark:text-white">$29</span>
              <span class="text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Perfect for startups and small projects</p>
          </div>

          <ul class="space-y-3 mb-6">
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Up to 5 token deployments/month</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Basic compliance checks</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Email support</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Standard templates</span>
            </li>
          </ul>

          <button
            @click.stop="selectAndProceed('basic')"
            :class="[
              'w-full py-3 rounded-lg font-medium transition-colors duration-200',
              selectedPlan === 'basic'
                ? 'bg-biatec-accent text-gray-900 hover:bg-biatec-accent/90'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            ]"
          >
            {{ selectedPlan === 'basic' ? 'Selected' : 'Select Plan' }}
          </button>
        </div>

        <!-- Professional Plan (Recommended) -->
        <div
          :class="[
            'relative glass-effect rounded-xl p-6 border-2 transition-all duration-200 cursor-pointer hover:scale-105',
            selectedPlan === 'professional' ? 'border-biatec-accent shadow-2xl' : 'border-biatec-accent/50'
          ]"
          @click="selectPlan('professional')"
        >
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span class="px-4 py-1 bg-biatec-accent text-gray-900 rounded-full text-xs font-bold">
              RECOMMENDED
            </span>
          </div>

          <div v-if="selectedPlan === 'professional'" class="absolute top-4 right-4">
            <i class="pi pi-check-circle text-biatec-accent text-2xl"></i>
          </div>
          
          <div class="text-center mb-6 mt-2">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Professional</h3>
            <div class="mb-4">
              <span class="text-4xl font-bold text-gray-900 dark:text-white">$99</span>
              <span class="text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">For growing businesses</p>
          </div>

          <ul class="space-y-3 mb-6">
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Up to 25 token deployments/month</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Advanced MICA compliance</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Priority email & chat support</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Premium templates</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Batch deployment</span>
            </li>
          </ul>

          <button
            @click.stop="selectAndProceed('professional')"
            :class="[
              'w-full py-3 rounded-lg font-medium transition-colors duration-200',
              selectedPlan === 'professional'
                ? 'bg-biatec-accent text-gray-900 hover:bg-biatec-accent/90'
                : 'bg-biatec-accent/80 text-gray-900 hover:bg-biatec-accent'
            ]"
          >
            {{ selectedPlan === 'professional' ? 'Selected' : 'Select Plan' }}
          </button>
        </div>

        <!-- Enterprise Plan -->
        <div
          :class="[
            'relative glass-effect rounded-xl p-6 border-2 transition-all duration-200 cursor-pointer hover:scale-105',
            selectedPlan === 'enterprise' ? 'border-biatec-accent shadow-lg' : 'border-white/10'
          ]"
          @click="selectPlan('enterprise')"
        >
          <div v-if="selectedPlan === 'enterprise'" class="absolute top-4 right-4">
            <i class="pi pi-check-circle text-biatec-accent text-2xl"></i>
          </div>
          
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enterprise</h3>
            <div class="mb-4">
              <span class="text-4xl font-bold text-gray-900 dark:text-white">$299</span>
              <span class="text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">For large-scale operations</p>
          </div>

          <ul class="space-y-3 mb-6">
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Unlimited token deployments</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Full MICA compliance suite</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>24/7 priority support</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Custom templates</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>Dedicated account manager</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-gray-300">
              <i class="pi pi-check text-green-400 mt-0.5"></i>
              <span>API access</span>
            </li>
          </ul>

          <button
            @click.stop="selectAndProceed('enterprise')"
            :class="[
              'w-full py-3 rounded-lg font-medium transition-colors duration-200',
              selectedPlan === 'enterprise'
                ? 'bg-biatec-accent text-gray-900 hover:bg-biatec-accent/90'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            ]"
          >
            {{ selectedPlan === 'enterprise' ? 'Selected' : 'Select Plan' }}
          </button>
        </div>
      </div>

      <!-- Trial Notice -->
      <div class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div class="flex items-center gap-3">
          <i class="pi pi-info-circle text-blue-400"></i>
          <p class="text-sm text-gray-300">
            <span class="font-semibold">14-day free trial</span> on all plans. No credit card required to start.
          </p>
        </div>
      </div>
    </div>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSubscriptionStore } from '../../../stores/subscription'
import WizardStep from '../WizardStep.vue'

interface Emits {
  (e: 'plan-selected', plan: string): void
}

const emit = defineEmits<Emits>()

const subscriptionStore = useSubscriptionStore()

const selectedPlan = ref<string>('')
const showErrors = ref(false)
const errors = ref<string[]>([])

const selectPlan = (plan: string) => {
  selectedPlan.value = plan
  showErrors.value = false
  errors.value = []
  emit('plan-selected', plan)
}

const selectAndProceed = (plan: string) => {
  selectPlan(plan)
  // Emit analytics event
  emitAnalyticsEvent('subscription_selected', { plan })
}

const emitAnalyticsEvent = (eventName: string, payload: any) => {
  console.log('[Analytics]', eventName, payload)
  // In production, this would integrate with analytics provider
}

const isValid = computed(() => {
  // If user already has active subscription, step is valid
  if (subscriptionStore.isActive) {
    return true
  }
  // Otherwise, they must select a plan
  return selectedPlan.value !== ''
})

onMounted(async () => {
  // Fetch subscription status
  await subscriptionStore.fetchSubscription()
  
  // If already active, auto-validate
  if (subscriptionStore.isActive && subscriptionStore.currentProduct) {
    selectedPlan.value = subscriptionStore.currentProduct.name.toLowerCase()
  }
})

defineExpose({
  isValid,
})
</script>
