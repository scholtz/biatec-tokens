<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-white mb-2">Compliance Readiness</h2>
      <p class="text-gray-300">Configure regulatory requirements for your token</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="space-y-3">
        <label class="flex items-center p-4 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50">
          <input type="checkbox" v-model="formData.requiresMICA" class="mr-3" />
          <div>
            <span class="text-white font-medium">MICA Compliance</span>
            <p class="text-sm text-gray-400">Markets in Crypto-Assets (EU regulation)</p>
          </div>
        </label>

        <label class="flex items-center p-4 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50">
          <input type="checkbox" v-model="formData.requiresKYC" class="mr-3" />
          <div>
            <span class="text-white font-medium">KYC Requirements</span>
            <p class="text-sm text-gray-400">Know Your Customer verification</p>
          </div>
        </label>

        <label class="flex items-center p-4 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50">
          <input type="checkbox" v-model="formData.requiresAML" class="mr-3" />
          <div>
            <span class="text-white font-medium">AML Compliance</span>
            <p class="text-sm text-gray-400">Anti-Money Laundering measures</p>
          </div>
        </label>

        <label class="flex items-center p-4 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50">
          <input type="checkbox" v-model="formData.hasLegalReview" class="mr-3" />
          <div>
            <span class="text-white font-medium">Legal Review Complete</span>
            <p class="text-sm text-gray-400">Token structure reviewed by legal counsel</p>
          </div>
        </label>

        <label class="flex items-center p-4 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50">
          <input type="checkbox" v-model="formData.hasRiskAssessment" class="mr-3" />
          <div>
            <span class="text-white font-medium">Risk Assessment Done</span>
            <p class="text-sm text-gray-400">Compliance risk analysis completed</p>
          </div>
        </label>

        <label class="flex items-center p-4 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50">
          <input type="checkbox" v-model="formData.whitelistRequired" class="mr-3" />
          <div>
            <span class="text-white font-medium">Whitelist Required</span>
            <p class="text-sm text-gray-400">Restrict transfers to approved addresses</p>
          </div>
        </label>
      </div>

      <!-- MICA guidance when enabled but legal review missing -->
      <div v-if="formData.requiresMICA && !formData.hasLegalReview" role="status" class="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
        <p class="text-sm text-yellow-200">
          <strong>Action required:</strong> MICA compliance requires a completed legal review.
          Please check "Legal Review Complete" above after your counsel has confirmed the token structure meets MICA requirements.
          You cannot proceed until this is done or MICA compliance is deselected.
        </p>
      </div>

      <!-- MICA informational guidance when both are checked -->
      <div v-else-if="formData.requiresMICA" class="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <p class="text-sm text-blue-200">
          <strong>MICA Compliance:</strong> Legal review is confirmed. Additional documentation will be required during deployment.
        </p>
      </div>

      <!-- Mandatory risk acknowledgement — blocks progression until checked -->
      <div class="border border-gray-600 rounded-lg p-4 bg-gray-800/20">
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            id="risk-acknowledgement"
            type="checkbox"
            v-model="formData.riskAcknowledged"
            class="mt-1 flex-shrink-0"
            aria-describedby="risk-acknowledgement-hint"
          />
          <div>
            <span class="text-white font-medium">I acknowledge the compliance requirements</span>
            <p id="risk-acknowledgement-hint" class="text-sm text-gray-400 mt-0.5">
              I understand the regulatory obligations selected above apply to my token and I accept
              responsibility for ensuring compliance before deployment.
            </p>
          </div>
        </label>

        <!-- Guidance message when checkbox is not checked and user tries to proceed -->
        <p
          v-if="showAcknowledgementError"
          role="alert"
          class="mt-3 text-sm text-red-300"
        >
          <strong>Required:</strong> You must acknowledge the compliance requirements to continue.
          This confirms you understand the obligations for your token deployment.
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :disabled="!canProceed"
      >
        Continue to Template Selection
        <i class="pi pi-arrow-right ml-2"></i>
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGuidedLaunchStore } from '../../../stores/guidedLaunch'
import type { ComplianceReadiness, ValidationResult } from '../../../types/guidedLaunch'
import Button from '../../ui/Button.vue'

const guidedLaunchStore = useGuidedLaunchStore()

const emit = defineEmits<{
  complete: [validation: ValidationResult]
  update: [compliance: ComplianceReadiness]
}>()

const formData = ref<ComplianceReadiness>({
  requiresMICA: false,
  requiresKYC: false,
  requiresAML: false,
  hasLegalReview: false,
  hasRiskAssessment: false,
  restrictedJurisdictions: [],
  whitelistRequired: false,
  riskAcknowledged: false,
})

/** Show acknowledgement error only after user has attempted to submit without it */
const showAcknowledgementError = ref(false)

/**
 * Blocks proceed when MICA is enabled but legal review is not done,
 * or when mandatory acknowledgement has not been checked.
 */
const canProceed = computed(() => {
  if (!formData.value.riskAcknowledged) return false
  if (formData.value.requiresMICA && !formData.value.hasLegalReview) return false
  return true
})

const handleSubmit = () => {
  if (!formData.value.riskAcknowledged) {
    showAcknowledgementError.value = true
    return
  }

  const errors: string[] = []
  const warnings: string[] = []

  if (formData.value.requiresMICA && !formData.value.hasLegalReview) {
    errors.push('MICA compliance requires legal review to be completed before proceeding')
  }

  const isValid = errors.length === 0

  const validation: ValidationResult = {
    isValid,
    errors,
    warnings,
  }

  emit('update', formData.value)
  emit('complete', validation)
}

watch(formData, (newData) => {
  // Clear error once acknowledged
  if (newData.riskAcknowledged) showAcknowledgementError.value = false
  emit('update', newData)
}, { deep: true })

onMounted(() => {
  const existing = guidedLaunchStore.currentForm.complianceReadiness
  if (existing) formData.value = { ...existing, riskAcknowledged: existing.riskAcknowledged ?? false }
})
</script>
