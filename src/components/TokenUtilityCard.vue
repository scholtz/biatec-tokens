<template>
  <Card class="token-utility-card">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ utility.standard }} Utility
        </h3>
        <Badge v-if="utility.complianceReady" variant="success">
          MICA Ready
        </Badge>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Description -->
      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ utility.description }}
      </p>

      <!-- Key Metrics -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Cost Profile -->
        <div class="flex items-center gap-2">
          <span :class="costDisplay.color" class="text-lg">{{ costDisplay.icon }}</span>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Transaction Cost</div>
            <div :class="costDisplay.color" class="text-sm font-medium">
              {{ costDisplay.text }}
            </div>
          </div>
        </div>

        <!-- Wallet Compatibility -->
        <div class="flex items-center gap-2">
          <span :class="walletDisplay.color" class="text-lg">{{ walletDisplay.icon }}</span>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Wallet Support</div>
            <div :class="walletDisplay.color" class="text-sm font-medium">
              {{ walletDisplay.text }}
            </div>
          </div>
        </div>
      </div>

      <!-- Use Cases -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Supported Use Cases
        </h4>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="useCase in utility.useCases"
            :key="useCase"
            variant="info"
            size="sm"
          >
            {{ getUseCaseDisplayName(useCase) }}
          </Badge>
        </div>
      </div>

      <!-- Features -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Key Features
        </h4>
        <ul class="space-y-1">
          <li
            v-for="(feature, index) in displayFeatures"
            :key="index"
            class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
          >
            <span class="text-green-500 mt-0.5">✓</span>
            <span>{{ feature }}</span>
          </li>
        </ul>
        <button
          v-if="utility.features.length > maxFeatures && !showAllFeatures"
          @click="showAllFeatures = true"
          class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
        >
          Show {{ utility.features.length - maxFeatures }} more features
        </button>
      </div>

      <!-- Best For -->
      <div v-if="utility.bestFor.length > 0">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Best For
        </h4>
        <ul class="space-y-1">
          <li
            v-for="(item, index) in utility.bestFor"
            :key="index"
            class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
          >
            <span class="text-blue-500 mt-0.5">→</span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <!-- Examples -->
      <div v-if="utility.examples.length > 0 && showExamples">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Example Use Cases
        </h4>
        <ul class="space-y-1">
          <li
            v-for="(example, index) in utility.examples"
            :key="index"
            class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
          >
            <span class="text-purple-500 mt-0.5">•</span>
            <span>{{ example }}</span>
          </li>
        </ul>
      </div>

      <!-- Limitations -->
      <div v-if="utility.limitations.length > 0 && showLimitations">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Considerations
        </h4>
        <ul class="space-y-1">
          <li
            v-for="(limitation, index) in utility.limitations"
            :key="index"
            class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
          >
            <span class="text-orange-500 mt-0.5">!</span>
            <span>{{ limitation }}</span>
          </li>
        </ul>
      </div>

      <!-- Networks -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Available Networks
        </h4>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="network in utility.networks"
            :key="network"
            variant="default"
            size="sm"
          >
            {{ network }}
          </Badge>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import type { TokenStandardUtility } from '../types/tokenUtility'
import {
  getUseCaseDisplayName,
  getCostProfileDisplay,
  getWalletCompatibilityDisplay,
} from '../utils/tokenUtilityRecommendations'

interface Props {
  utility: TokenStandardUtility
  maxFeatures?: number
  showExamples?: boolean
  showLimitations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxFeatures: 4,
  showExamples: true,
  showLimitations: true,
})

const showAllFeatures = ref(false)

const displayFeatures = computed(() => {
  if (showAllFeatures.value || props.utility.features.length <= props.maxFeatures) {
    return props.utility.features
  }
  return props.utility.features.slice(0, props.maxFeatures)
})

const costDisplay = computed(() => getCostProfileDisplay(props.utility.costProfile))
const walletDisplay = computed(() =>
  getWalletCompatibilityDisplay(props.utility.walletCompatibility)
)
</script>

<style scoped>
.token-utility-card {
  @apply transition-shadow;
}
.token-utility-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
</style>
