<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-white mb-2">Token Intent & Use Case</h2>
      <p class="text-gray-300">Describe what you want to achieve with your token</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Token Purpose <span class="text-red-400">*</span>
        </label>
        <textarea
          v-model="formData.tokenPurpose"
          required
          rows="4"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Briefly describe what this token will be used for..."
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Utility Type <span class="text-red-400">*</span>
        </label>
        <select v-model="formData.utilityType" required class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
          <option value="">Select utility type...</option>
          <option value="loyalty_rewards">Loyalty & Rewards</option>
          <option value="access_rights">Access Rights</option>
          <option value="governance">Governance</option>
          <option value="payment">Payment</option>
          <option value="asset_backed">Asset-Backed</option>
          <option value="collectible">Collectible</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
        <select v-model="formData.targetAudience" class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
          <option value="b2b">B2B (Business to Business)</option>
          <option value="b2c">B2C (Business to Consumer)</option>
          <option value="internal">Internal / Employees</option>
          <option value="community">Community</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Expected Token Holders</label>
        <select v-model="formData.expectedHolders" class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
          <option value="under_100">Under 100</option>
          <option value="100_1000">100 - 1,000</option>
          <option value="1000_10000">1,000 - 10,000</option>
          <option value="over_10000">Over 10,000</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Geographic Scope</label>
        <select v-model="formData.geographicScope" class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
          <option value="local">Local</option>
          <option value="national">National</option>
          <option value="regional">Regional</option>
          <option value="global">Global</option>
        </select>
      </div>

      <Button type="submit" variant="primary" size="lg" full-width :disabled="!isFormValid">
        Continue to Compliance
        <i class="pi pi-arrow-right ml-2"></i>
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGuidedLaunchStore } from '../../../stores/guidedLaunch'
import type { TokenIntent, ValidationResult } from '../../../types/guidedLaunch'
import Button from '../../ui/Button.vue'

const guidedLaunchStore = useGuidedLaunchStore()

const emit = defineEmits<{
  complete: [validation: ValidationResult]
  update: [intent: TokenIntent]
}>()

const formData = ref<TokenIntent>({
  tokenPurpose: '',
  utilityType: 'loyalty_rewards',
  targetAudience: 'b2c',
  expectedHolders: '100_1000',
  geographicScope: 'national',
})

const isFormValid = computed(() => {
  return formData.value.tokenPurpose.trim() !== '' && formData.value.utilityType.length > 0
})

const handleSubmit = () => {
  const validation: ValidationResult = {
    isValid: isFormValid.value,
    errors: [],
    warnings: [],
  }
  
  if (validation.isValid) {
    emit('update', formData.value)
    emit('complete', validation)
  }
}

watch(formData, (newData) => { emit('update', newData) }, { deep: true })

onMounted(() => {
  const existing = guidedLaunchStore.currentForm.tokenIntent
  if (existing) formData.value = { ...existing }
})
</script>
