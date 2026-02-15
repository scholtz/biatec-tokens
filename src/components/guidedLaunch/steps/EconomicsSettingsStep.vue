<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-white mb-2">Economics Settings</h2>
      <p class="text-gray-300">Configure token supply and distribution</p>
      <Badge variant="info" class="mt-2">Optional Step</Badge>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Total Supply</label>
        <input v-model="formData.totalSupply" type="text" class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white" placeholder="1000000" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Decimals</label>
        <input v-model.number="formData.decimals" type="number" min="0" max="18" class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white" />
      </div>

      <div class="pt-4 border-t border-gray-700">
        <h3 class="text-lg font-semibold text-white mb-4">Initial Distribution (%)</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-sm text-gray-300 mb-1">Team</label><input v-model.number="formData.initialDistribution.team" type="number" min="0" max="100" class="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white" /></div>
          <div><label class="block text-sm text-gray-300 mb-1">Investors</label><input v-model.number="formData.initialDistribution.investors" type="number" min="0" max="100" class="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white" /></div>
          <div><label class="block text-sm text-gray-300 mb-1">Community</label><input v-model.number="formData.initialDistribution.community" type="number" min="0" max="100" class="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white" /></div>
          <div><label class="block text-sm text-gray-300 mb-1">Reserve</label><input v-model.number="formData.initialDistribution.reserve" type="number" min="0" max="100" class="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white" /></div>
        </div>
        <p v-if="distributionTotal !== 100" class="mt-2 text-sm text-yellow-400">Total must equal 100% (currently {{ distributionTotal }}%)</p>
      </div>

      <Button type="submit" variant="primary" size="lg" full-width>Continue to Review<i class="pi pi-arrow-right ml-2"></i></Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGuidedLaunchStore } from '../../../stores/guidedLaunch'
import type { TokenEconomics, ValidationResult } from '../../../types/guidedLaunch'
import Button from '../../ui/Button.vue'
import Badge from '../../ui/Badge.vue'

const guidedLaunchStore = useGuidedLaunchStore()
const emit = defineEmits<{ complete: [validation: ValidationResult], update: [economics: TokenEconomics] }>()

const formData = ref<TokenEconomics>({
  totalSupply: '1000000',
  decimals: 6,
  initialDistribution: { team: 20, investors: 20, community: 40, reserve: 20 },
  burnMechanism: false,
  mintingAllowed: false,
})

const distributionTotal = computed(() => {
  const dist = formData.value.initialDistribution
  return dist.team + dist.investors + dist.community + dist.reserve
})

const handleSubmit = () => {
  const warnings = []
  if (distributionTotal.value !== 100) warnings.push('Distribution should total 100%')
  
  emit('update', formData.value)
  emit('complete', { isValid: true, errors: [], warnings })
}

watch(formData, (newData) => { emit('update', newData) }, { deep: true })

onMounted(() => {
  const existing = guidedLaunchStore.currentForm.tokenEconomics
  if (existing) formData.value = { ...existing }
})
</script>
