<template>
  <Card variant="glass" padding="md" class="hover:border-blue-500/50 transition-colors cursor-pointer">
    <div class="space-y-3">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-gray-400">{{ metric.label }}</p>
          <p class="text-2xl font-bold text-white mt-1">{{ metric.value }}</p>
        </div>
        
        <Tooltip :content="metric.definition">
          <QuestionMarkCircleIcon class="w-5 h-5 text-gray-500 hover:text-gray-400" />
        </Tooltip>
      </div>

      <div class="flex items-center gap-2">
        <component
          :is="trendIcon"
          class="w-4 h-4"
          :class="trendColorClass"
        />
        <span class="text-sm" :class="trendColorClass">
          {{ formatChange(metric.change) }}
        </span>
        <span class="text-xs text-gray-500">vs previous period</span>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '../ui/Card.vue'
import Tooltip from '../ui/Tooltip.vue'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/vue/24/outline'
import type { MetricData } from '../../stores/insights'

interface Props {
  metric: MetricData
}

const props = defineProps<Props>()

const trendIcon = computed(() => {
  switch (props.metric.trend) {
    case 'up':
      return ArrowTrendingUpIcon
    case 'down':
      return ArrowTrendingDownIcon
    default:
      return MinusIcon
  }
})

const trendColorClass = computed(() => {
  switch (props.metric.trend) {
    case 'up':
      return 'text-green-400'
    case 'down':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
})

function formatChange(change: number): string {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}
</script>
