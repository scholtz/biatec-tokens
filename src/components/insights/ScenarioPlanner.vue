<template>
  <Card variant="glass" padding="md">
    <div class="space-y-6">
      <div>
        <h3 class="text-sm font-medium text-white mb-2">Model Your Growth Scenarios</h3>
        <p class="text-xs text-gray-400">
          Adjust parameters to see projected outcomes with confidence ranges
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Campaign Lift Input -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">
            Expected Campaign Lift (%)
          </label>
          <Input
            v-model.number="localInputs.campaignLift"
            type="number"
            placeholder="0"
            min="0"
            max="100"
          />
          <p class="text-xs text-gray-500 mt-1">
            Expected increase in adoption from marketing campaign
          </p>
        </div>

        <!-- Liquidity Contribution Input -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">
            Liquidity Contribution ($)
          </label>
          <Input
            v-model.number="localInputs.liquidityContribution"
            type="number"
            placeholder="0"
            min="0"
          />
          <p class="text-xs text-gray-500 mt-1">
            Additional liquidity to provide
          </p>
        </div>

        <!-- Retention Change Input -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">
            Retention Change (%)
          </label>
          <Input
            v-model.number="localInputs.retentionChange"
            type="number"
            placeholder="0"
            min="-100"
            max="100"
          />
          <p class="text-xs text-gray-500 mt-1">
            Expected change in user retention
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          @click="handleRunScenario"
          :disabled="loading || !isValidInput"
        >
          <span v-if="loading" class="flex items-center gap-2">
            <ArrowPathIcon class="w-4 h-4 animate-spin" />
            Running...
          </span>
          <span v-else>Run Scenario</span>
        </Button>

        <Button
          variant="secondary"
          size="md"
          @click="handleReset"
          :disabled="loading"
        >
          Reset
        </Button>

        <span v-if="!isValidInput" class="text-xs text-yellow-400">
          Please enter valid parameters
        </span>
      </div>

      <!-- Results -->
      <div v-if="outputs" class="border-t border-gray-700 pt-4">
        <h4 class="text-sm font-medium text-white mb-4">Projected Outcomes</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-800/50 rounded-lg p-4">
            <p class="text-xs text-gray-400 mb-1">Projected Adoption</p>
            <p class="text-2xl font-bold text-white">
              {{ outputs.projectedAdoption.toLocaleString() }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              Range: {{ outputs.confidenceRange.low.toLocaleString() }} - 
              {{ outputs.confidenceRange.high.toLocaleString() }}
            </p>
          </div>

          <div class="bg-gray-800/50 rounded-lg p-4">
            <p class="text-xs text-gray-400 mb-1">Projected Volume</p>
            <p class="text-2xl font-bold text-white">
              ${{ outputs.projectedVolume.toLocaleString() }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              Based on liquidity contribution
            </p>
          </div>

          <div class="bg-gray-800/50 rounded-lg p-4">
            <p class="text-xs text-gray-400 mb-1">Projected Retention</p>
            <p class="text-2xl font-bold text-white">
              {{ outputs.projectedRetention }}%
            </p>
            <p class="text-xs text-gray-500 mt-1">
              Adjusted user retention rate
            </p>
          </div>
        </div>

        <div class="mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
          <p class="text-xs text-blue-400">
            <strong>Note:</strong> These projections are based on historical data and industry benchmarks.
            Actual results may vary. Confidence ranges represent 85-115% of projected values.
          </p>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Card from '../ui/Card.vue'
import Input from '../ui/Input.vue'
import Button from '../ui/Button.vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import type { ScenarioInput, ScenarioOutput } from '../../stores/insights'

interface Props {
  inputs: ScenarioInput
  outputs: ScenarioOutput | null
  loading: boolean
}

interface Emits {
  (e: 'run', inputs: ScenarioInput): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localInputs = ref<ScenarioInput>({
  campaignLift: props.inputs.campaignLift,
  liquidityContribution: props.inputs.liquidityContribution,
  retentionChange: props.inputs.retentionChange,
})

watch(() => props.inputs, (newInputs) => {
  localInputs.value = { ...newInputs }
}, { deep: true })

const isValidInput = computed(() => {
  return (
    !isNaN(localInputs.value.campaignLift) &&
    !isNaN(localInputs.value.liquidityContribution) &&
    !isNaN(localInputs.value.retentionChange) &&
    localInputs.value.campaignLift >= 0 &&
    localInputs.value.campaignLift <= 100 &&
    localInputs.value.liquidityContribution >= 0 &&
    localInputs.value.retentionChange >= -100 &&
    localInputs.value.retentionChange <= 100
  )
})

function handleRunScenario() {
  if (!isValidInput.value) return
  emit('run', localInputs.value)
}

function handleReset() {
  localInputs.value = {
    campaignLift: 0,
    liquidityContribution: 0,
    retentionChange: 0,
  }
}
</script>
