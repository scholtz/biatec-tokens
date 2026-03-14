<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div class="container-padding section-padding">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Usage & Limits</h1>
          <p class="text-gray-400">Track your plan usage and see what's available</p>
        </div>

        <!-- Auth guard -->
        <div v-if="!authStore.isAuthenticated">
          <Card variant="glass" padding="lg">
            <div class="text-center">
              <ArrowRightOnRectangleIcon class="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-white mb-2">Sign In Required</h3>
              <p class="text-gray-300 mb-4">Please sign in to view your usage data.</p>
              <Button @click="handleSignIn" variant="primary" size="lg">Sign In</Button>
            </div>
          </Card>
        </div>

        <template v-else>
          <!-- Plan Summary -->
          <Card variant="default" padding="lg" class="mb-6" data-testid="plan-summary">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 class="text-lg font-semibold text-white mb-1">
                  Current Plan: <span data-testid="current-plan-name">{{ currentPlanName }}</span>
                </h2>
                <p v-if="subscriptionStore.currentPeriodEnd" class="text-sm text-gray-400">
                  Resets on {{ formatDate(subscriptionStore.currentPeriodEnd) }}
                </p>
              </div>
              <Button
                v-if="showUpgradePrompt"
                @click="$router.push('/subscription/pricing')"
                variant="primary"
                size="sm"
                data-testid="upgrade-prompt-btn"
              >
                Upgrade Plan
              </Button>
            </div>
          </Card>

          <!-- Usage Metrics -->
          <div class="space-y-4 mb-6">
            <!-- Tokens Created -->
            <Card variant="default" padding="lg" data-testid="tokens-usage-card">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="font-medium text-white">Tokens Created</h3>
                  <p class="text-sm text-gray-400 mt-0.5">This billing period</p>
                </div>
                <div class="text-right">
                  <span class="text-lg font-bold text-white" data-testid="tokens-used">
                    {{ usageData.tokensCreated }}
                  </span>
                  <span class="text-gray-400 text-sm">
                    /
                    <span data-testid="tokens-limit">{{ tokenLimitDisplay }}</span>
                  </span>
                </div>
              </div>

              <div class="w-full bg-gray-700 rounded-full h-2.5" role="progressbar" :aria-label="`Token usage: ${tokenUsagePercent}% of allowance used`" :aria-valuenow="tokenUsagePercent" aria-valuemin="0" aria-valuemax="100">
                <div
                  :class="getProgressColor(tokenUsagePercent)"
                  class="h-2.5 rounded-full transition-all duration-500"
                  :style="{ width: `${Math.min(tokenUsagePercent, 100)}%` }"
                  data-testid="tokens-progress-bar"
                ></div>
              </div>

              <!-- Threshold warning -->
              <div v-if="tokenUsagePercent >= 100" class="mt-3 flex items-center gap-2 text-red-400 text-sm" data-testid="tokens-at-limit-warning">
                <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0" />
                <span>You've reached your token limit. <button @click="$router.push('/subscription/pricing')" class="underline hover:no-underline">Upgrade to create more tokens.</button></span>
              </div>
              <div v-else-if="tokenUsagePercent >= 80" class="mt-3 flex items-center gap-2 text-yellow-400 text-sm" data-testid="tokens-approaching-limit-warning">
                <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0" />
                <span>You're approaching your token limit. <button @click="$router.push('/subscription/pricing')" class="underline hover:no-underline">Consider upgrading.</button></span>
              </div>
            </Card>

            <!-- Deployment Networks -->
            <Card variant="default" padding="lg" data-testid="networks-usage-card">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="font-medium text-white">Deployment Networks</h3>
                  <p class="text-sm text-gray-400 mt-0.5">Networks accessed this period</p>
                </div>
                <span class="text-sm text-gray-400 font-medium" data-testid="networks-available">
                  {{ availableNetworks }} available
                </span>
              </div>
              <div class="flex flex-wrap gap-2" data-testid="network-badges">
                <span
                  v-for="network in availableNetworkList"
                  :key="network"
                  class="px-2 py-1 text-xs rounded-md bg-gray-700 text-gray-300"
                >
                  {{ network }}
                </span>
              </div>
            </Card>

            <!-- API Calls (Professional+) -->
            <Card variant="default" padding="lg" data-testid="api-usage-card">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="font-medium text-white">API Calls</h3>
                  <p class="text-sm text-gray-400 mt-0.5">Last 30 days</p>
                </div>
                <div class="text-right">
                  <span v-if="hasApiAccess" class="text-lg font-bold text-white" data-testid="api-calls-used">
                    {{ usageData.apiCalls.toLocaleString() }}
                  </span>
                  <span v-else class="text-sm text-gray-500">Not available</span>
                </div>
              </div>

              <div v-if="hasApiAccess">
                <div class="w-full bg-gray-700 rounded-full h-2.5" role="progressbar" :aria-label="`API usage: ${apiUsagePercent}% of allowance used`" :aria-valuenow="apiUsagePercent" aria-valuemin="0" aria-valuemax="100">
                  <div
                    :class="getProgressColor(apiUsagePercent)"
                    class="h-2.5 rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(apiUsagePercent, 100)}%` }"
                    data-testid="api-progress-bar"
                  ></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  {{ usageData.apiCalls.toLocaleString() }} / {{ apiLimit.toLocaleString() }} calls
                </p>
              </div>
              <div v-else class="flex items-center gap-2 mt-2">
                <LockClosedIcon class="w-4 h-4 text-gray-500" />
                <span class="text-sm text-gray-500">
                  Upgrade to Professional to access the API.
                  <button @click="$router.push('/subscription/pricing')" class="text-blue-400 underline hover:no-underline">View plans</button>
                </span>
              </div>
            </Card>
          </div>

          <!-- Upgrade CTA if approaching limits -->
          <div v-if="showUpgradePrompt" class="mb-6">
            <Card variant="glass" padding="lg" data-testid="upgrade-cta-card">
              <div class="flex items-center gap-4 flex-wrap">
                <div class="flex-1">
                  <h3 class="font-semibold text-white mb-1">Approaching Plan Limits</h3>
                  <p class="text-sm text-gray-400">
                    Upgrade your plan to get higher limits, more networks, and additional features.
                  </p>
                </div>
                <Button
                  @click="$router.push('/subscription/pricing')"
                  variant="primary"
                  size="md"
                  data-testid="upgrade-cta-btn"
                >
                  Upgrade Now
                </Button>
              </div>
            </Card>
          </div>

          <!-- Back to Subscription -->
          <div>
            <Button @click="$router.push('/account/subscription')" variant="outline" size="sm" data-testid="back-to-subscription-btn">
              ← Back to Subscription
            </Button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useSubscriptionStore } from '../../stores/subscription'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import {
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon
} from '@heroicons/vue/24/outline'

interface UsageData {
  tokensCreated: number
  apiCalls: number
}

const router = useRouter()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()

const usageData = ref<UsageData>({
  tokensCreated: 0,
  apiCalls: 0
})

const apiLimit = 10000

const currentPlanName = computed(() =>
  subscriptionStore.currentProduct?.name ?? 'Free'
)

const tokenLimit = computed(() => {
  const limit = subscriptionStore.currentProduct?.tokenLimit
  if (!limit) return 5 // Free tier default
  if (limit === 'unlimited') return Infinity
  return limit
})

const tokenLimitDisplay = computed(() =>
  tokenLimit.value === Infinity ? 'Unlimited' : tokenLimit.value.toString()
)

const tokenUsagePercent = computed(() => {
  if (tokenLimit.value === Infinity) return 0
  return Math.round((usageData.value.tokensCreated / tokenLimit.value) * 100)
})

const apiUsagePercent = computed(() =>
  Math.round((usageData.value.apiCalls / apiLimit) * 100)
)

const hasApiAccess = computed(() =>
  ['professional', 'enterprise'].includes(subscriptionStore.currentProduct?.tier ?? '')
)

const availableNetworkList = computed(() =>
  subscriptionStore.currentProduct?.networks ?? ['Algorand Testnet']
)

const availableNetworks = computed(() => availableNetworkList.value.length)

const showUpgradePrompt = computed(() =>
  tokenUsagePercent.value >= 80 && tokenLimit.value !== Infinity
)

const getProgressColor = (percent: number): string => {
  if (percent >= 100) return 'bg-red-500'
  if (percent >= 80) return 'bg-yellow-500'
  return 'bg-blue-500'
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)

const handleSignIn = () => router.push({ name: 'Home', query: { showAuth: 'true' } })

const loadUsageData = async () => {
  // Simulate loading usage from conversion metrics in the subscription store
  const metrics = subscriptionStore.conversionMetrics
  usageData.value = {
    tokensCreated: metrics.successfulCreations,
    apiCalls: metrics.tokenCreationAttempts * 12 // Approximate API calls based on creation attempts
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await subscriptionStore.fetchSubscription()
    await loadUsageData()
  }
})
</script>
