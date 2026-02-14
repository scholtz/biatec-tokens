<template>
  <Card variant="glass" padding="md">
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-white">Competitor Benchmarks</h3>
      
      <div v-if="benchmarks.length === 0" class="text-center py-8 text-gray-500">
        <p class="text-sm">No benchmark data available</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left py-2 text-gray-400 font-medium">Project</th>
              <th class="text-right py-2 text-gray-400 font-medium">Adoption</th>
              <th class="text-right py-2 text-gray-400 font-medium">Retention</th>
              <th class="text-right py-2 text-gray-400 font-medium">Tx Quality</th>
              <th class="text-right py-2 text-gray-400 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            <!-- Your Project Row -->
            <tr class="border-b border-gray-700 bg-blue-900/20">
              <td class="py-3 text-white">
                Your Token
                <Badge variant="info" size="sm" class="ml-2">You</Badge>
              </td>
              <td class="text-right text-white">
                {{ formatMetric(currentMetrics.adoption) }}
              </td>
              <td class="text-right text-white">
                {{ formatMetric(currentMetrics.retention) }}
              </td>
              <td class="text-right text-white">
                {{ formatMetric(currentMetrics.txQuality) }}
              </td>
              <td class="text-right text-gray-400 text-xs">Internal</td>
            </tr>

            <!-- Competitor Rows -->
            <tr
              v-for="benchmark in benchmarks"
              :key="benchmark.id"
              class="border-b border-gray-700 hover:bg-gray-800/50"
            >
              <td class="py-3 text-white">{{ benchmark.name }}</td>
              <td class="text-right text-gray-300">
                {{ formatMetric(benchmark.metrics.adoption) }}
                <span
                  v-if="benchmark.metrics.adoption"
                  :class="getComparisonClass(currentMetrics.adoption, benchmark.metrics.adoption)"
                  class="ml-1 text-xs"
                >
                  {{ getComparisonText(currentMetrics.adoption, benchmark.metrics.adoption) }}
                </span>
              </td>
              <td class="text-right text-gray-300">
                {{ formatMetric(benchmark.metrics.retention) }}
                <span
                  v-if="benchmark.metrics.retention"
                  :class="getComparisonClass(currentMetrics.retention, benchmark.metrics.retention)"
                  class="ml-1 text-xs"
                >
                  {{ getComparisonText(currentMetrics.retention, benchmark.metrics.retention) }}
                </span>
              </td>
              <td class="text-right text-gray-300">
                {{ formatMetric(benchmark.metrics.txQuality) }}
                <span
                  v-if="benchmark.metrics.txQuality"
                  :class="getComparisonClass(currentMetrics.txQuality, benchmark.metrics.txQuality)"
                  class="ml-1 text-xs"
                >
                  {{ getComparisonText(currentMetrics.txQuality, benchmark.metrics.txQuality) }}
                </span>
              </td>
              <td class="text-right text-gray-400 text-xs">
                {{ benchmark.source }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="text-xs text-gray-500">
        <p>Data sources and update frequency may vary. Last updated: {{ lastUpdated }}</p>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'
import type { CompetitorBenchmark } from '../../stores/insights'

interface Props {
  benchmarks: CompetitorBenchmark[]
  currentMetrics: Record<string, number | string>
}

const props = defineProps<Props>()

const lastUpdated = computed(() => {
  if (props.benchmarks.length === 0) return 'N/A'
  const date = new Date(props.benchmarks[0].lastUpdated)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

function formatMetric(value: number | string | undefined): string {
  if (value === undefined || value === null) return '-'
  
  if (typeof value === 'string') return value
  
  return value.toLocaleString()
}

function getComparisonClass(yours: number | string, theirs: number): string {
  const yourValue = typeof yours === 'string' ? parseFloat(yours.replace(/,/g, '')) : yours
  
  if (isNaN(yourValue)) return 'text-gray-400'
  
  if (yourValue > theirs) return 'text-green-400'
  if (yourValue < theirs) return 'text-red-400'
  return 'text-gray-400'
}

function getComparisonText(yours: number | string, theirs: number): string {
  const yourValue = typeof yours === 'string' ? parseFloat(yours.replace(/,/g, '')) : yours
  
  if (isNaN(yourValue)) return ''
  
  const diff = ((yourValue - theirs) / theirs) * 100
  
  if (diff > 0) return `+${diff.toFixed(0)}%`
  if (diff < 0) return `${diff.toFixed(0)}%`
  return '='
}
</script>
