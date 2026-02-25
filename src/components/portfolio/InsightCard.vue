<template>
  <article
    role="article"
    :aria-label="`Insight: ${insight.title}`"
    class="p-4 rounded-xl border transition-colors"
    :class="cardClasses"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <!-- Severity badge -->
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2"
          :class="badgeClasses"
        >
          {{ severityLabel }}
        </span>

        <!-- Title -->
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ insight.title }}</h4>

        <!-- Description -->
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
          {{ insight.description }}
        </p>

        <!-- Action button -->
        <div v-if="insight.actionLabel" class="mt-3">
          <button
            @click="$emit('clicked', insight)"
            class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline-offset-2 hover:underline"
            :aria-label="`${insight.actionLabel} for insight: ${insight.title}`"
          >
            {{ insight.actionLabel }} →
          </button>
        </div>
      </div>

      <!-- Dismiss button -->
      <button
        v-if="insight.dismissible"
        @click="$emit('dismissed', insight)"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded"
        aria-label="Dismiss insight"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PortfolioInsight } from '../../types/portfolioIntelligence'

interface Props {
  insight: PortfolioInsight
}

const props = defineProps<Props>()

defineEmits<{
  clicked: [insight: PortfolioInsight]
  dismissed: [insight: PortfolioInsight]
}>()

const severityLabel = computed(() => {
  const labels: Record<string, string> = {
    info: 'Info',
    warning: 'Warning',
    critical: 'Critical',
  }
  return labels[props.insight.severity] ?? props.insight.severity
})

const badgeClasses = computed(() => {
  const classes: Record<string, string> = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  }
  return classes[props.insight.severity] ?? ''
})

const cardClasses = computed(() => {
  const classes: Record<string, string> = {
    info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50',
    warning: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50',
    critical: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50',
  }
  return classes[props.insight.severity] ?? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
})
</script>
