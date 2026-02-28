<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div class="container-padding section-padding">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Subscription Management</h1>
          <p class="text-gray-400">Manage your plan, payment method, and billing preferences</p>
        </div>

        <!-- Auth guard message -->
        <div v-if="!authStore.isAuthenticated" class="mb-8">
          <Card variant="glass" padding="lg">
            <div class="text-center">
              <ArrowRightOnRectangleIcon class="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-white mb-2">Sign In Required</h3>
              <p class="text-gray-300 mb-4">Please sign in to manage your subscription.</p>
              <Button @click="handleSignIn" variant="primary" size="lg">Sign In</Button>
            </div>
          </Card>
        </div>

        <template v-else>
          <!-- Past Due Banner -->
          <div v-if="isPastDue" class="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-4" data-testid="past-due-banner">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="font-semibold text-red-300 mb-1">Payment Past Due</h3>
              <p class="text-sm text-red-400 mb-3">
                Your account has a past-due payment. Some features are restricted until payment is resolved.
              </p>
              <Button @click="goToBilling" variant="primary" size="sm">Update Payment Method</Button>
            </div>
          </div>

          <!-- Current Plan Card -->
          <Card variant="default" padding="lg" class="mb-6" data-testid="current-plan-card">
            <div class="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 class="text-xl font-semibold text-white mb-1">Current Plan</h2>
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl font-bold text-white" data-testid="plan-name">
                    {{ currentPlanName }}
                  </span>
                  <Badge :variant="statusVariant" size="sm" data-testid="plan-status">
                    {{ statusLabel }}
                  </Badge>
                </div>
                <p v-if="subscriptionStore.currentProduct" class="text-gray-400 text-sm" data-testid="plan-price">
                  ${{ subscriptionStore.currentProduct.price }}/month
                </p>
                <p v-if="subscriptionStore.currentPeriodEnd" class="text-gray-400 text-sm mt-1" data-testid="next-billing-date">
                  Next billing: {{ formatDate(subscriptionStore.currentPeriodEnd) }}
                </p>
                <p v-if="cancelAtPeriodEnd" class="text-yellow-400 text-sm mt-1" data-testid="cancelling-notice">
                  Your subscription will end on {{ formatDate(subscriptionStore.currentPeriodEnd!) }}
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <Button
                  @click="goToPricing"
                  variant="primary"
                  size="sm"
                  data-testid="change-plan-btn"
                >
                  Change Plan
                </Button>
                <Button
                  v-if="!cancelAtPeriodEnd && subscriptionStore.isActive"
                  @click="confirmCancel"
                  variant="outline"
                  size="sm"
                  :loading="cancelLoading"
                  data-testid="cancel-subscription-btn"
                >
                  Cancel Subscription
                </Button>
                <Button
                  v-if="cancelAtPeriodEnd || !subscriptionStore.isActive"
                  @click="handleReactivate"
                  variant="primary"
                  size="sm"
                  :loading="reactivateLoading"
                  data-testid="reactivate-btn"
                >
                  Reactivate
                </Button>
              </div>
            </div>
          </Card>

          <!-- Payment Method Card -->
          <Card variant="default" padding="lg" class="mb-6" data-testid="payment-method-card">
            <h2 class="text-xl font-semibold text-white mb-4">Payment Method</h2>
            <div v-if="hasPaymentMethod" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <CreditCardIcon class="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <p class="text-white font-medium capitalize" data-testid="payment-brand">
                    {{ subscriptionStore.subscription?.payment_method_brand }}
                  </p>
                  <p class="text-gray-400 text-sm" data-testid="payment-last4">
                    •••• •••• •••• {{ subscriptionStore.subscription?.payment_method_last4 }}
                  </p>
                </div>
              </div>
              <Button
                @click="handleUpdatePayment"
                variant="outline"
                size="sm"
                data-testid="update-payment-btn"
              >
                Update
              </Button>
            </div>
            <div v-else class="flex items-center justify-between">
              <p class="text-gray-400">No payment method on file</p>
              <Button
                @click="handleUpdatePayment"
                variant="primary"
                size="sm"
                data-testid="add-payment-btn"
              >
                Add Payment Method
              </Button>
            </div>
          </Card>

          <!-- Quick Links -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card
              variant="glass"
              padding="md"
              class="cursor-pointer hover:border-blue-500/50 transition-colors"
              @click="$router.push('/account/billing')"
              data-testid="billing-history-link"
            >
              <div class="flex items-center gap-3">
                <DocumentTextIcon class="w-6 h-6 text-blue-400" />
                <div>
                  <h3 class="font-medium text-white">Billing History</h3>
                  <p class="text-sm text-gray-400">View invoices and payment history</p>
                </div>
                <ChevronRightIcon class="w-5 h-5 text-gray-500 ml-auto" />
              </div>
            </Card>

            <Card
              variant="glass"
              padding="md"
              class="cursor-pointer hover:border-blue-500/50 transition-colors"
              @click="$router.push('/account/usage')"
              data-testid="usage-tracking-link"
            >
              <div class="flex items-center gap-3">
                <ChartBarIcon class="w-6 h-6 text-purple-400" />
                <div>
                  <h3 class="font-medium text-white">Usage & Limits</h3>
                  <p class="text-sm text-gray-400">Monitor your plan usage</p>
                </div>
                <ChevronRightIcon class="w-5 h-5 text-gray-500 ml-auto" />
              </div>
            </Card>
          </div>

          <!-- Cancel Confirmation Modal -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="showCancelModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" data-testid="cancel-modal">
              <Card variant="elevated" padding="lg" class="max-w-md w-full">
                <div class="text-center">
                  <ExclamationTriangleIcon class="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 class="text-xl font-bold text-white mb-2">Cancel Subscription?</h3>
                  <p class="text-gray-300 mb-2">
                    Your subscription will remain active until
                    <span class="font-medium text-white">{{ formatDate(subscriptionStore.currentPeriodEnd!) }}</span>.
                  </p>
                  <p class="text-gray-400 text-sm mb-6">
                    After that date, you will lose access to premium features. You can reactivate at any time.
                  </p>
                  <div class="flex gap-3 justify-center">
                    <Button @click="showCancelModal = false" variant="outline" size="md">
                      Keep Subscription
                    </Button>
                    <Button
                      @click="executeCancellation"
                      variant="primary"
                      size="md"
                      :loading="cancelLoading"
                      data-testid="confirm-cancel-btn"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </Transition>
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
import Badge from '../../components/ui/Badge.vue'
import {
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()

const cancelLoading = ref(false)
const reactivateLoading = ref(false)
const showCancelModal = ref(false)

const cancelAtPeriodEnd = computed(() => subscriptionStore.subscription?.cancel_at_period_end ?? false)

const hasPaymentMethod = computed(() =>
  !!(subscriptionStore.subscription?.payment_method_last4)
)

const isPastDue = computed(() =>
  subscriptionStore.subscription?.subscription_status === 'past_due'
)

const currentPlanName = computed(() => {
  if (!subscriptionStore.subscription) return 'Free'
  return subscriptionStore.currentProduct?.name ?? 'Free'
})

const statusLabel = computed(() => {
  const status = subscriptionStore.subscription?.subscription_status
  if (!status || status === 'not_started') return 'Free'
  if (cancelAtPeriodEnd.value) return 'Cancelling'
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
})

const statusVariant = computed((): 'success' | 'warning' | 'error' | 'info' => {
  if (subscriptionStore.isActive && !cancelAtPeriodEnd.value) return 'success'
  if (isPastDue.value || cancelAtPeriodEnd.value) return 'warning'
  return 'info'
})

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)

const handleSignIn = () => router.push({ name: 'Home', query: { showAuth: 'true' } })
const goToPricing = () => router.push('/subscription/pricing')
const goToBilling = () => router.push('/account/billing')

const handleUpdatePayment = () => {
  // Navigate to pricing to update via checkout
  router.push('/subscription/pricing')
}

const confirmCancel = () => {
  showCancelModal.value = true
}

const executeCancellation = async () => {
  cancelLoading.value = true
  try {
    await subscriptionStore.cancelSubscription()
    showCancelModal.value = false
  } finally {
    cancelLoading.value = false
  }
}

const handleReactivate = async () => {
  reactivateLoading.value = true
  try {
    await subscriptionStore.reactivateSubscription()
  } finally {
    reactivateLoading.value = false
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await subscriptionStore.fetchSubscription()
  }
})
</script>
