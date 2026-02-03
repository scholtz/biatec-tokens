<template>
  <div class="container-padding section-padding">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Unlock the full potential of token creation with our premium subscription
        </p>
      </div>

      <!-- Current Subscription Status -->
      <div v-if="authStore.isAuthenticated && subscriptionStore.subscription" class="mb-8">
        <Card variant="glass" padding="md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Current Plan</h3>
              <p class="text-gray-600 dark:text-gray-400">
                {{ subscriptionStore.currentProduct?.name || 'Free Plan' }}
                <Badge 
                  v-if="subscriptionStore.isActive" 
                  variant="success" 
                  size="sm" 
                  class="ml-2"
                >
                  Active
                </Badge>
              </p>
            </div>
            <div v-if="subscriptionStore.currentPeriodEnd" class="text-right">
              <p class="text-sm text-gray-500 dark:text-gray-400">Next billing</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatDate(subscriptionStore.currentPeriodEnd) }}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Authentication Notice -->
      <div v-if="!authStore.isAuthenticated" class="mb-8">
        <Card variant="glass" padding="md">
          <div class="text-center">
            <WalletIcon class="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sign In Required</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Please sign in to your account to manage your subscription and access premium features
            </p>
          </div>
        </Card>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <!-- Free Plan -->
        <Card variant="default" padding="lg" class="relative">
          <div class="text-center">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free Plan</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
              <span class="text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <ul class="space-y-3 mb-8 text-left">
              <li class="flex items-center">
                <CheckIcon class="w-5 h-5 text-green-500 mr-3" />
                <span class="text-gray-600 dark:text-gray-300">Create up to 3 tokens</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="w-5 h-5 text-green-500 mr-3" />
                <span class="text-gray-600 dark:text-gray-300">Basic token standards</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="w-5 h-5 text-green-500 mr-3" />
                <span class="text-gray-600 dark:text-gray-300">Community support</span>
              </li>
            </ul>
            <Button
              variant="outline"
              size="lg"
              full-width
              disabled
            >
              Current Plan
            </Button>
          </div>
        </Card>

        <!-- Premium Plan -->
        <Card variant="elevated" padding="lg" class="relative border-2 border-blue-500">
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge variant="info" size="lg" class="px-4 py-1">Most Popular</Badge>
          </div>
          
          <div class="text-center">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Monthly Subscription</h3>
            <div class="mb-6">
              <span class="text-4xl font-bold text-gray-900 dark:text-white">$50</span>
              <span class="text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <ul class="space-y-3 mb-8 text-left">
              <li class="flex items-center">
                <CheckIcon class="w-5 h-5 text-green-500 mr-3" />
                <span class="text-gray-600 dark:text-gray-300">Unlimited token creation</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="w-5 h-5 text-green-500 mr-3" />
                <span class="text-gray-600 dark:text-gray-300">All token standards</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="w-5 h-5 text-green-500 mr-3" />
                <span class="text-gray-600 dark:text-gray-300">Advanced features</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="w-5 h-5 text-green-500 mr-3" />
                <span class="text-gray-600 dark:text-gray-300">Priority support</span>
              </li>
              <li class="flex items-center">
                <CheckIcon class="w-5 h-5 text-green-500 mr-3" />
                <span class="text-gray-600 dark:text-gray-300">API access</span>
              </li>
            </ul>
            <Button
              @click="handleSubscribe"
              variant="primary"
              size="lg"
              :loading="subscriptionStore.loading"
              :disabled="!authStore.isAuthenticated || subscriptionStore.isActive"
              full-width
            >
              {{ getSubscribeButtonText() }}
            </Button>
          </div>
        </Card>
      </div>

      <!-- Features Comparison -->
      <div class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Feature Comparison</h2>
        <Card variant="default" padding="none">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Feature
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Free
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="feature in features" :key="feature.name">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {{ feature.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <component 
                      :is="feature.free ? CheckIcon : XMarkIcon" 
                      :class="feature.free ? 'text-green-500' : 'text-red-500'"
                      class="w-5 h-5 mx-auto"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <CheckIcon class="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <!-- FAQ Section -->
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <Card
            v-for="faq in faqs"
            :key="faq.question"
            variant="default"
            padding="md"
            class="cursor-pointer"
            @click="faq.open = !faq.open"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ faq.question }}</h3>
              <ChevronDownIcon 
                :class="{ 'rotate-180': faq.open }"
                class="w-5 h-5 text-gray-500 transition-transform"
              />
            </div>
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <p v-if="faq.open" class="mt-3 text-gray-600 dark:text-gray-300">{{ faq.answer }}</p>
            </Transition>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSubscriptionStore } from '../../stores/subscription'
import { telemetryService } from '../../services/TelemetryService'
import { stripeProducts } from '../../stripe-config'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import {
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  WalletIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()
const upgradeStartTime = ref<number | null>(null)

const features = [
  { name: 'Token Creation', free: true },
  { name: 'Basic Standards (ARC3)', free: true },
  { name: 'Advanced Standards (ARC200, ARC72, ERC20, ERC721)', free: false },
  { name: 'Unlimited Tokens', free: false },
  { name: 'API Access', free: false },
  { name: 'Priority Support', free: false },
  { name: 'Advanced Analytics', free: false }
]

const faqs = ref([
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
    open: false
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards including Visa, MasterCard, and American Express through Stripe.',
    open: false
  },
  {
    question: 'Is there a free trial?',
    answer: 'We offer a generous free plan that allows you to create up to 3 tokens. You can upgrade to premium anytime.',
    open: false
  },
  {
    question: 'Can I change my plan later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
    open: false
  }
])

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const getSubscribeButtonText = () => {
  if (!authStore.isAuthenticated) {
    return 'Sign In to Subscribe'
  }
  if (subscriptionStore.isActive) {
    return 'Already Subscribed'
  }
  return 'Subscribe Now'
}

const handleSubscribe = async () => {
  if (!authStore.isAuthenticated) {
    // User needs to authenticate first
    return
  }

  const currentPlan = subscriptionStore.currentProduct?.name || 'free'
  const monthlyProduct = stripeProducts.find(p => p.interval === 'month')
  
  if (monthlyProduct) {
    // Track upgrade started
    upgradeStartTime.value = Date.now()
    telemetryService.trackPlanUpgradeStarted({
      fromPlan: currentPlan,
      toPlan: monthlyProduct.name,
      source: 'pricing_page'
    })
    
    await subscriptionStore.createCheckoutSession(monthlyProduct.priceId, 'subscription')
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await subscriptionStore.fetchSubscription()
  }
})
</script>