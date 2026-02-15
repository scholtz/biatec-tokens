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

      <div v-if="formData.requiresMICA" class="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
        <p class="text-sm text-yellow-200">
          <strong>MICA Compliance Note:</strong> Ensure you have completed legal review and have proper registration. This will require additional documentation during deployment.
        </p>
      </div>

      <Button type="submit" variant="primary" size="lg" full-width>
        Continue to Template Selection
        <i class="pi pi-arrow-right ml-2"></i>
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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
})

const handleSubmit = () => {
  const warnings = []
  if (formData.value.requiresMICA && !formData.value.hasLegalReview) {
    warnings.push('MICA compliance typically requires legal review')
  }
  
  const validation: ValidationResult = {
    isValid: true,
    errors: [],
    warnings,
  }
  
  emit('update', formData.value)
  emit('complete', validation)
}

watch(formData, (newData) => { emit('update', newData) }, { deep: true })

onMounted(() => {
  const existing = guidedLaunchStore.currentForm.complianceReadiness
  if (existing) formData.value = { ...existing }
})
</script>
