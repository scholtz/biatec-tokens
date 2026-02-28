<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div class="container-padding section-padding">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Billing History</h1>
          <p class="text-gray-400">View and download your invoices</p>
        </div>

        <!-- Auth guard -->
        <div v-if="!authStore.isAuthenticated">
          <Card variant="glass" padding="lg">
            <div class="text-center">
              <ArrowRightOnRectangleIcon class="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-white mb-2">Sign In Required</h3>
              <p class="text-gray-300 mb-4">Please sign in to view your billing history.</p>
              <Button @click="handleSignIn" variant="primary" size="lg">Sign In</Button>
            </div>
          </Card>
        </div>

        <template v-else>
          <!-- Failed Payment Banner -->
          <div v-if="hasFailedPayment" class="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-4" data-testid="failed-payment-banner">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="font-semibold text-red-300 mb-1">Payment Failed</h3>
              <p class="text-sm text-red-400 mb-3">
                Your last payment could not be processed. Please update your payment method to restore full access.
              </p>
              <Button @click="$router.push('/account/subscription')" variant="primary" size="sm" data-testid="update-payment-cta">
                Update Payment Method
              </Button>
            </div>
          </div>

          <!-- Invoice List -->
          <Card variant="default" padding="none" data-testid="invoice-list">
            <div class="px-6 py-4 border-b border-gray-700/50">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">Invoices</h2>
                <span class="text-sm text-gray-400">{{ invoices.length }} invoice{{ invoices.length !== 1 ? 's' : '' }}</span>
              </div>
            </div>

            <!-- Loading state -->
            <div v-if="loading" class="p-8 text-center" data-testid="loading-state">
              <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p class="text-gray-400">Loading invoices...</p>
            </div>

            <!-- Empty state -->
            <div v-else-if="invoices.length === 0" class="p-8 text-center" data-testid="empty-state">
              <DocumentTextIcon class="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 class="text-lg font-medium text-white mb-1">No invoices yet</h3>
              <p class="text-gray-400 text-sm">Your invoices will appear here once you subscribe to a plan.</p>
              <Button @click="$router.push('/subscription/pricing')" variant="primary" size="sm" class="mt-4">
                View Plans
              </Button>
            </div>

            <!-- Invoice rows -->
            <div v-else class="divide-y divide-gray-700/50">
              <div
                v-for="invoice in paginatedInvoices"
                :key="invoice.id"
                class="px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                data-testid="invoice-row"
              >
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p class="font-medium text-white text-sm" data-testid="invoice-description">
                      {{ invoice.description }}
                    </p>
                    <p class="text-gray-400 text-xs mt-0.5" data-testid="invoice-date">
                      {{ formatDate(invoice.date) }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <p class="font-semibold text-white text-sm" data-testid="invoice-amount">
                      ${{ invoice.amount.toFixed(2) }}
                    </p>
                    <Badge :variant="getStatusVariant(invoice.status)" size="sm" data-testid="invoice-status">
                      {{ invoice.status }}
                    </Badge>
                  </div>
                  <Button
                    v-if="invoice.status === 'Paid'"
                    @click="downloadInvoice(invoice)"
                    variant="outline"
                    size="sm"
                    data-testid="download-invoice-btn"
                  >
                    <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-700/50 flex items-center justify-between">
              <Button
                @click="currentPage--"
                variant="outline"
                size="sm"
                :disabled="currentPage === 1"
                data-testid="prev-page-btn"
              >
                Previous
              </Button>
              <span class="text-sm text-gray-400">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <Button
                @click="currentPage++"
                variant="outline"
                size="sm"
                :disabled="currentPage === totalPages"
                data-testid="next-page-btn"
              >
                Next
              </Button>
            </div>
          </Card>

          <!-- Back to Subscription -->
          <div class="mt-6">
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
import Badge from '../../components/ui/Badge.vue'
import {
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'

interface Invoice {
  id: string
  description: string
  date: Date
  amount: number
  status: 'Paid' | 'Open' | 'Void'
  pdfUrl?: string
}

const router = useRouter()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()

const loading = ref(false)
const invoices = ref<Invoice[]>([])
const currentPage = ref(1)
const perPage = 10

const hasFailedPayment = computed(() =>
  subscriptionStore.subscription?.subscription_status === 'past_due'
)

const totalPages = computed(() => Math.ceil(invoices.value.length / perPage))

const paginatedInvoices = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return invoices.value.slice(start, start + perPage)
})

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)

const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
  if (status === 'Paid') return 'success'
  if (status === 'Open') return 'warning'
  return 'error'
}

const handleSignIn = () => router.push({ name: 'Home', query: { showAuth: 'true' } })

const downloadInvoice = (invoice: Invoice) => {
  if (invoice.pdfUrl) {
    window.open(invoice.pdfUrl, '_blank')
  }
}

const fetchInvoices = async () => {
  loading.value = true
  try {
    // Simulate API call - in production this would call /api/invoices
    await new Promise(resolve => setTimeout(resolve, 500))

    const product = subscriptionStore.currentProduct
    if (!product) {
      invoices.value = []
      return
    }

    // Generate mock invoice history based on subscription
    const now = new Date()
    const mockInvoices: Invoice[] = []
    for (let i = 0; i < 6; i++) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      mockInvoices.push({
        id: `inv_${Date.now()}_${i}`,
        description: `${product.name} - ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        date,
        amount: product.price,
        status: i === 0 && subscriptionStore.subscription?.subscription_status === 'past_due' ? 'Open' : 'Paid',
        pdfUrl: i === 0 && subscriptionStore.subscription?.subscription_status === 'past_due' ? undefined : `https://invoice.stripe.com/i/mock_${Date.now()}_${i}`
      })
    }
    invoices.value = mockInvoices
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await subscriptionStore.fetchSubscription()
    await fetchInvoices()
  }
})
</script>
