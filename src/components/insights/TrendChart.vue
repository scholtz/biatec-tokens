<template>
  <Card variant="glass" padding="md">
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-white">{{ label }}</h3>
      
      <!-- Loading State -->
      <div v-if="!data || data.length === 0" class="flex items-center justify-center py-8">
        <p class="text-sm text-gray-500">Loading trend data...</p>
      </div>

      <!-- Chart SVG -->
      <div v-else class="relative h-48">
        <svg class="w-full h-full" :viewBox="`0 0 ${width} ${height}`">
          <!-- Grid lines -->
          <g class="grid-lines">
            <line
              v-for="i in 5"
              :key="`grid-${i}`"
              :x1="0"
              :y1="(i - 1) * (height / 4)"
              :x2="width"
              :y2="(i - 1) * (height / 4)"
              class="stroke-gray-700"
              stroke-width="1"
            />
          </g>

          <!-- Area fill -->
          <path
            :d="areaPath"
            class="fill-blue-500/20"
          />

          <!-- Line -->
          <path
            :d="linePath"
            class="stroke-blue-400"
            stroke-width="2"
            fill="none"
          />

          <!-- Data points -->
          <circle
            v-for="(point, index) in chartPoints"
            :key="`point-${index}`"
            :cx="point.x"
            :cy="point.y"
            r="3"
            class="fill-blue-400 hover:fill-blue-300 cursor-pointer"
            @mouseenter="showTooltip(index)"
            @mouseleave="hideTooltip"
          />
        </svg>

        <!-- Tooltip -->
        <div
          v-if="tooltipVisible && tooltipData"
          class="absolute bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white shadow-xl pointer-events-none"
          :style="{ left: `${tooltipX}px`, top: `${tooltipY}px` }"
        >
          <div class="font-medium">{{ tooltipData.label }}</div>
          <div class="text-gray-400">{{ tooltipData.value.toFixed(2) }}</div>
        </div>
      </div>

      <!-- X-axis labels -->
      <div v-if="data && data.length > 0" class="flex justify-between text-xs text-gray-500">
        <span>{{ firstLabel }}</span>
        <span>{{ lastLabel }}</span>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from '../ui/Card.vue'
import type { TrendDataPoint } from '../../stores/insights'

interface Props {
  metricId: string
  label: string
  data: TrendDataPoint[]
}

const props = defineProps<Props>()

const width = 400
const height = 150
const padding = 10

const tooltipVisible = ref(false)
const tooltipIndex = ref<number | null>(null)
const tooltipX = ref(0)
const tooltipY = ref(0)

const chartPoints = computed(() => {
  if (!props.data || props.data.length === 0) return []

  const values = props.data.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue || 1

  return props.data.map((point, index) => {
    const x = padding + (index / (props.data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((point.value - minValue) / range) * (height - 2 * padding)
    return { x, y, value: point.value, label: point.label || '' }
  })
})

const linePath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  
  let path = `M ${chartPoints.value[0].x} ${chartPoints.value[0].y}`
  
  for (let i = 1; i < chartPoints.value.length; i++) {
    path += ` L ${chartPoints.value[i].x} ${chartPoints.value[i].y}`
  }
  
  return path
})

const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  
  let path = `M ${chartPoints.value[0].x} ${height - padding}`
  path += ` L ${chartPoints.value[0].x} ${chartPoints.value[0].y}`
  
  for (let i = 1; i < chartPoints.value.length; i++) {
    path += ` L ${chartPoints.value[i].x} ${chartPoints.value[i].y}`
  }
  
  path += ` L ${chartPoints.value[chartPoints.value.length - 1].x} ${height - padding}`
  path += ' Z'
  
  return path
})

const firstLabel = computed(() => {
  if (!props.data || props.data.length === 0) return ''
  const date = new Date(props.data[0].timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const lastLabel = computed(() => {
  if (!props.data || props.data.length === 0) return ''
  const date = new Date(props.data[props.data.length - 1].timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const tooltipData = computed(() => {
  if (tooltipIndex.value === null) return null
  return chartPoints.value[tooltipIndex.value]
})

function showTooltip(index: number) {
  tooltipIndex.value = index
  tooltipVisible.value = true
  
  const point = chartPoints.value[index]
  tooltipX.value = point.x + 10
  tooltipY.value = point.y - 10
}

function hideTooltip() {
  tooltipVisible.value = false
  tooltipIndex.value = null
}
</script>
