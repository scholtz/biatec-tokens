<template>
  <div class="token-utility-guide space-y-6">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Token Standard Utility Guide
      </h2>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Choose the right token standard for your use case
      </p>
    </div>

    <!-- Quick Selector -->
    <Card>
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Find Your Perfect Standard
        </h3>
      </template>

      <div class="space-y-4">
        <!-- Use Case Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What type of token do you need?
          </label>
          <select
            v-model="selectedUseCase"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            @change="updateRecommendations"
          >
            <option value="">-- Select a use case --</option>
            <option
              v-for="useCase in Object.values(TokenUseCase)"
              :key="useCase"
              :value="useCase"
            >
              {{ getUseCaseDisplayName(useCase) }}
            </option>
          </select>
        </div>

        <!-- Additional Requirements -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="requiresCompliance"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              @change="updateRecommendations"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Requires regulatory compliance (MICA)
            </span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="costSensitive"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              @change="updateRecommendations"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Cost-sensitive (prefer low fees)
            </span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="requiresWideCompatibility"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              @change="updateRecommendations"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Maximum wallet compatibility
            </span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="requiresSmartContract"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              @change="updateRecommendations"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Needs smart contract features
            </span>
          </label>
        </div>

        <!-- Recommendations -->
        <div v-if="comparisons.length > 0" class="mt-6">
          <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Recommended Standards (Ranked)
          </h4>
          <div class="space-y-3">
            <div
              v-for="(comparison, index) in comparisons.slice(0, 3)"
              :key="comparison.standard"
              class="p-4 rounded-lg border-2"
              :class="[
                index === 0
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
              ]"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <Badge v-if="index === 0" variant="info" size="sm">
                    Best Match
                  </Badge>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ comparison.standard }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Match Score:</span>
                  <span class="font-bold text-lg" :class="getScoreColor(comparison.score)">
                    {{ comparison.score }}%
                  </span>
                </div>
              </div>

              <!-- Pros -->
              <div v-if="comparison.pros.length > 0" class="mb-2">
                <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Advantages:
                </div>
                <ul class="space-y-1">
                  <li
                    v-for="(pro, pIndex) in comparison.pros"
                    :key="pIndex"
                    class="text-sm text-green-700 dark:text-green-400 flex items-start gap-2"
                  >
                    <span class="mt-0.5">✓</span>
                    <span>{{ pro }}</span>
                  </li>
                </ul>
              </div>

              <!-- Cons -->
              <div v-if="comparison.cons.length > 0">
                <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Considerations:
                </div>
                <ul class="space-y-1">
                  <li
                    v-for="(con, cIndex) in comparison.cons"
                    :key="cIndex"
                    class="text-sm text-orange-700 dark:text-orange-400 flex items-start gap-2"
                  >
                    <span class="mt-0.5">!</span>
                    <span>{{ con }}</span>
                  </li>
                </ul>
              </div>

              <!-- View Details Button -->
              <Button
                variant="secondary"
                size="sm"
                class="mt-3"
                @click="viewStandardDetails(comparison.standard)"
              >
                View Full Details
              </Button>
            </div>
          </div>
        </div>

        <!-- No Selection State -->
        <div
          v-else
          class="text-center py-8 text-gray-500 dark:text-gray-400"
        >
          <p>Select a use case above to get personalized recommendations</p>
        </div>
      </div>
    </Card>

    <!-- All Standards Grid -->
    <div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        All Available Standards
      </h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenUtilityCard
          v-for="utility in Object.values(TOKEN_UTILITIES)"
          :key="utility.standard"
          :utility="utility"
          :show-examples="false"
          :show-limitations="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import TokenUtilityCard from './TokenUtilityCard.vue'
import { TOKEN_UTILITIES, TokenUseCase } from '../types/tokenUtility'
import type { UtilityComparison } from '../types/tokenUtility'
import {
  getUtilityComparisons,
  getUseCaseDisplayName,
} from '../utils/tokenUtilityRecommendations'

const selectedUseCase = ref<string>('')
const requiresCompliance = ref(false)
const costSensitive = ref(false)
const requiresWideCompatibility = ref(false)
const requiresSmartContract = ref(false)

const comparisons = ref<UtilityComparison[]>([])

function updateRecommendations() {
  if (!selectedUseCase.value) {
    comparisons.value = []
    return
  }

  comparisons.value = getUtilityComparisons({
    useCase: selectedUseCase.value as TokenUseCase,
    requiresCompliance: requiresCompliance.value,
    costSensitive: costSensitive.value,
    requiresWideCompatibility: requiresWideCompatibility.value,
    requiresSmartContract: requiresSmartContract.value,
  })
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-blue-600 dark:text-blue-400'
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-orange-600 dark:text-orange-400'
}

function viewStandardDetails(standard: string) {
  // Scroll to the standard card in the grid
  const element = document.querySelector(`[data-standard="${standard}"]`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
</script>
