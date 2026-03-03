<template>
  <div
    class="rounded-lg border border-yellow-600/60 bg-yellow-900/20 p-5 space-y-4"
    data-testid="transaction-preview-panel"
    role="region"
    aria-labelledby="tx-preview-heading"
  >
    <!-- Heading -->
    <div class="flex items-center gap-2">
      <ExclamationTriangleIcon class="w-5 h-5 text-yellow-400 flex-shrink-0" aria-hidden="true" />
      <h3 id="tx-preview-heading" class="text-base font-semibold text-yellow-300">
        Transaction Preview
      </h3>
    </div>

    <!-- Irreversible action notice -->
    <div
      class="rounded bg-red-900/40 border border-red-700/50 px-4 py-3 flex items-start gap-2"
      role="alert"
      data-testid="irreversible-notice"
    >
      <ShieldExclamationIcon class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-sm text-red-300">
        <strong class="font-semibold">This action is irreversible.</strong>
        Once submitted, the token deployment cannot be undone. Ensure all settings are correct
        before proceeding.
      </p>
    </div>

    <!-- Fee breakdown -->
    <div class="space-y-2" data-testid="fee-breakdown">
      <h4 class="text-sm font-semibold text-gray-300">Estimated Fees</h4>
      <div class="rounded bg-gray-800/60 border border-gray-700/50 divide-y divide-gray-700/40 text-sm">
        <div class="flex justify-between items-center px-4 py-2">
          <span class="text-gray-400">Deployment fee</span>
          <span class="text-white font-mono" data-testid="fee-deployment">{{ deploymentFee }}</span>
        </div>
        <div class="flex justify-between items-center px-4 py-2">
          <span class="text-gray-400">ARC compliance check</span>
          <span class="text-white font-mono" data-testid="fee-compliance">{{ complianceFee }}</span>
        </div>
        <div class="flex justify-between items-center px-4 py-2">
          <span class="text-gray-400">Network fee</span>
          <span class="text-white font-mono" data-testid="fee-network">{{ networkFee }}</span>
        </div>
        <div class="flex justify-between items-center px-4 py-2 bg-gray-700/30">
          <span class="text-gray-200 font-semibold">Estimated total</span>
          <span class="text-green-400 font-mono font-semibold" data-testid="fee-total">{{ totalFee }}</span>
        </div>
      </div>
      <p class="text-xs text-gray-500">
        Fees are estimates and may vary slightly at time of submission. All amounts in ALGO.
      </p>
    </div>

    <!-- Token summary -->
    <div class="grid grid-cols-2 gap-2 text-sm" data-testid="token-summary">
      <div class="bg-gray-800/50 rounded px-3 py-2">
        <span class="text-gray-400 block text-xs">Token name</span>
        <span class="text-white font-medium" data-testid="summary-token-name">{{ tokenName || '—' }}</span>
      </div>
      <div class="bg-gray-800/50 rounded px-3 py-2">
        <span class="text-gray-400 block text-xs">Standard</span>
        <span class="text-white font-medium" data-testid="summary-token-standard">{{ tokenStandard || '—' }}</span>
      </div>
      <div class="bg-gray-800/50 rounded px-3 py-2">
        <span class="text-gray-400 block text-xs">Network</span>
        <span class="text-white font-medium" data-testid="summary-network">{{ network || '—' }}</span>
      </div>
      <div class="bg-gray-800/50 rounded px-3 py-2">
        <span class="text-gray-400 block text-xs">Total supply</span>
        <span class="text-white font-medium" data-testid="summary-total-supply">
          {{ totalSupply != null ? totalSupply.toLocaleString() : '—' }}
        </span>
      </div>
    </div>

    <!-- Risk acknowledgment checkbox -->
    <div
      class="flex items-start gap-3 rounded bg-gray-800/50 border border-gray-700/50 px-4 py-3"
      data-testid="risk-acknowledgment-container"
    >
      <input
        id="tx-preview-risk-ack"
        v-model="internalAcknowledged"
        type="checkbox"
        class="mt-0.5 h-4 w-4 rounded border-gray-500 bg-gray-700 text-yellow-400 focus:ring-yellow-500 focus:ring-2 cursor-pointer"
        :aria-describedby="'tx-preview-risk-ack-hint'"
        data-testid="risk-acknowledgment-checkbox"
        @change="onAcknowledgmentChange"
      />
      <div>
        <label
          for="tx-preview-risk-ack"
          class="text-sm text-gray-200 font-medium cursor-pointer select-none"
        >
          I acknowledge that this deployment is irreversible and all settings are correct.
        </label>
        <p
          id="tx-preview-risk-ack-hint"
          class="text-xs text-gray-400 mt-0.5"
        >
          You must confirm before the submit button becomes available.
        </p>
        <p
          v-if="showAckError"
          role="alert"
          class="text-xs text-red-400 mt-1"
          data-testid="risk-ack-error"
        >
          Please acknowledge the risk before submitting.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/vue/24/outline'

const props = withDefaults(
  defineProps<{
    tokenName: string
    tokenStandard: string
    network: string
    totalSupply: number
    /** External control over acknowledged state (for two-way binding) */
    acknowledged?: boolean
  }>(),
  {
    acknowledged: false,
  },
)

const emit = defineEmits<{
  'update:acknowledged': [value: boolean]
}>()

// Fee estimates (mock values — real values come from backend at submission)
const deploymentFee = '0.001 ALGO'
const complianceFee = '0.001 ALGO'
const networkFee = '0.001 ALGO'
const totalFee = '0.003 ALGO'

const internalAcknowledged = ref(props.acknowledged)
const showAckError = ref(false)

watch(
  () => props.acknowledged,
  (val) => {
    internalAcknowledged.value = val
  },
)

function onAcknowledgmentChange(): void {
  showAckError.value = false
  emit('update:acknowledged', internalAcknowledged.value)
}

/**
 * Validate and surface error if acknowledgment is missing.
 * Called by parent before submit.
 */
function validate(): boolean {
  if (!internalAcknowledged.value) {
    showAckError.value = true
    return false
  }
  return true
}

defineExpose({ validate })
</script>
