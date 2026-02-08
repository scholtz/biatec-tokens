<template>
  <Modal
    :show="show"
    @close="handleClose"
    size="lg"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <SparklesIcon class="w-6 h-6 text-purple-400" />
        <span>Upgrade Required</span>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Current Selection Message -->
      <div class="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <InformationCircleIcon class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-sm text-gray-300">
              <strong class="text-white">{{ feature }}</strong> requires the
              <strong class="text-blue-400">{{ requiredPlan }}</strong> plan or higher.
            </p>
            <p v-if="description" class="text-sm text-gray-400 mt-1">
              {{ description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Benefits of Upgrading -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-3">
          Why upgrade to {{ requiredPlan }}?
        </h3>
        <div class="space-y-3">
          <div
            v-for="benefit in benefits"
            :key="benefit"
            class="flex items-start gap-3"
          >
            <CheckCircleIcon class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span class="text-gray-300">{{ benefit }}</span>
          </div>
        </div>
      </div>

      <!-- Current vs Required Plan Comparison -->
      <div v-if="showComparison" class="border border-gray-700 rounded-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-800/50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-300">Feature</th>
              <th class="px-4 py-3 text-center text-sm font-semibold text-gray-300">Your Plan</th>
              <th class="px-4 py-3 text-center text-sm font-semibold text-blue-400">{{ requiredPlan }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            <tr v-for="item in comparisonItems" :key="item.feature">
              <td class="px-4 py-3 text-sm text-gray-300">{{ item.feature }}</td>
              <td class="px-4 py-3 text-center">
                <component
                  :is="item.current ? CheckIcon : XMarkIcon"
                  :class="item.current ? 'text-green-400' : 'text-gray-600'"
                  class="w-5 h-5 mx-auto"
                />
              </td>
              <td class="px-4 py-3 text-center">
                <CheckIcon class="w-5 h-5 text-green-400 mx-auto" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pricing Info -->
      <div class="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="text-sm text-gray-400">{{ requiredPlan }} Plan</p>
            <p class="text-3xl font-bold text-white">${{ price }}<span class="text-lg text-gray-400">/month</span></p>
          </div>
          <Badge variant="info" size="lg">
            Save {{ savings }} vs current
          </Badge>
        </div>
        <p class="text-xs text-gray-400">
          ✓ Cancel anytime · ✓ No hidden fees · ✓ Immediate access
        </p>
      </div>

      <!-- Risk Reduction Message -->
      <div class="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <ShieldCheckIcon class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-sm font-semibold text-green-400 mb-1">
              Reduce Legal Risk & Accelerate Deployment
            </p>
            <p class="text-xs text-gray-400">
              {{ requiredPlan }} plan includes enhanced compliance monitoring, automated reporting,
              and regulatory audit support to help you meet {{ regulatoryFramework }} requirements.
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 w-full">
        <Button
          variant="ghost"
          @click="handleClose"
          class="flex-1"
        >
          Maybe Later
        </Button>
        <Button
          variant="outline"
          @click="handleViewPlans"
          class="flex-1"
        >
          View All Plans
        </Button>
        <Button
          variant="primary"
          @click="handleUpgrade"
          :loading="loading"
          class="flex-1"
        >
          Upgrade Now
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscription'
import { stripeProducts } from '../stripe-config'
import Modal from './ui/Modal.vue'
import Button from './ui/Button.vue'
import Badge from './ui/Badge.vue'
import {
  SparklesIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface UpgradePromptProps {
  show: boolean
  feature: string
  requiredPlan: 'Basic Plan' | 'Professional Plan' | 'Enterprise Plan'
  description?: string
  benefits?: string[]
  showComparison?: boolean
  comparisonItems?: Array<{ feature: string; current: boolean }>
  regulatoryFramework?: string
}

const props = withDefaults(defineProps<UpgradePromptProps>(), {
  description: '',
  benefits: () => [],
  showComparison: true,
  comparisonItems: () => [],
  regulatoryFramework: 'MICA and EU'
})

const emit = defineEmits<{
  close: []
  upgrade: []
}>()

const router = useRouter()
const subscriptionStore = useSubscriptionStore()
const loading = ref(false)

const price = computed(() => {
  const product = stripeProducts.find(p => p.name === props.requiredPlan)
  return product?.price || 0
})

const savings = computed(() => {
  const current = subscriptionStore.currentProduct?.price || 0
  const required = price.value
  const diff = required - current
  if (diff > 0) {
    return `$${diff}/mo more value`
  }
  return 'immediate access'
})

const handleClose = () => {
  emit('close')
}

const handleViewPlans = () => {
  router.push('/subscription/pricing')
  emit('close')
}

const handleUpgrade = async () => {
  loading.value = true
  try {
    emit('upgrade')
    
    // Find the product for the required plan
    const product = stripeProducts.find(p => p.name === props.requiredPlan)
    if (product) {
      await subscriptionStore.createCheckoutSession(product.priceId, 'subscription')
    }
  } finally {
    loading.value = false
  }
}
</script>
