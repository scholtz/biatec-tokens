<template>
  <div>
    <!-- Header with count badge -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Insights</h3>
      <span
        v-if="!loading && insights.length > 0"
        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        aria-label="`${visibleInsights.length} insight${visibleInsights.length !== 1 ? 's' : ''}`"
      >
        {{ visibleInsights.length }}
      </span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" aria-live="polite" class="space-y-3">
      <div v-for="n in 3" :key="n" class="animate-pulse p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="visibleInsights.length === 0" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400 text-sm">No insights at this time.</p>
    </div>

    <!-- Insight cards -->
    <div v-else class="space-y-3">
      <InsightCard
        v-for="insight in visibleInsights"
        :key="insight.id"
        :insight="insight"
        @clicked="$emit('insightClicked', $event)"
        @dismissed="$emit('insightDismissed', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InsightCard from './InsightCard.vue'
import type { PortfolioInsight } from '../../types/portfolioIntelligence'

interface Props {
  insights: PortfolioInsight[]
  loading: boolean
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxVisible: undefined,
})

defineEmits<{
  insightClicked: [insight: PortfolioInsight]
  insightDismissed: [insight: PortfolioInsight]
}>()

const visibleInsights = computed(() => {
  if (props.maxVisible !== undefined) {
    return props.insights.slice(0, props.maxVisible)
  }
  return props.insights
})
</script>
