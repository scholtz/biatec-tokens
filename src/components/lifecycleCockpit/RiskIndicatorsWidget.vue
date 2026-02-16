<template>
  <Card variant="glass" padding="lg">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
            <i class="pi pi-exclamation-triangle text-2xl text-red-400"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-white">Lifecycle Risk Indicators</h3>
            <p class="text-sm text-gray-400">Threshold-based monitoring</p>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!indicators" class="text-center py-8">
        <i class="pi pi-info-circle text-4xl text-gray-500 mb-2"></i>
        <p class="text-sm text-gray-400">No token deployed yet</p>
        <p class="text-xs text-gray-500 mt-1">Risk indicators will appear after token launch</p>
      </div>

      <!-- Risk Indicators -->
      <div v-else class="space-y-3">
        <!-- Concentration Risk -->
        <div
          :class="[
            'border rounded-lg p-4 transition-all',
            indicators.concentration.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
            indicators.concentration.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
            indicators.concentration.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
            indicators.concentration.severity === 'low' ? 'bg-blue-500/10 border-blue-500/30' :
            'bg-green-500/10 border-green-500/30',
            indicators.concentration.deepLink ? 'cursor-pointer hover:scale-[1.02]' : ''
          ]"
          @click="indicators.concentration.deepLink && $emit('navigate', indicators.concentration.deepLink)"
        >
          <RiskIndicatorCard :indicator="indicators.concentration" name="Holder Concentration" />
        </div>

        <!-- Inactivity Risk -->
        <div
          :class="[
            'border rounded-lg p-4 transition-all',
            indicators.inactivity.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
            indicators.inactivity.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
            indicators.inactivity.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
            indicators.inactivity.severity === 'low' ? 'bg-blue-500/10 border-blue-500/30' :
            'bg-green-500/10 border-green-500/30'
          ]"
        >
          <RiskIndicatorCard :indicator="indicators.inactivity" name="Holder Inactivity" />
        </div>

        <!-- Unusual Activity Risk -->
        <div
          :class="[
            'border rounded-lg p-4 transition-all',
            indicators.unusualActivity.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
            indicators.unusualActivity.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
            indicators.unusualActivity.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
            indicators.unusualActivity.severity === 'low' ? 'bg-blue-500/10 border-blue-500/30' :
            'bg-green-500/10 border-green-500/30'
          ]"
        >
          <RiskIndicatorCard :indicator="indicators.unusualActivity" name="Unusual Activity" />
        </div>

        <!-- Last Updated -->
        <div class="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
          Last updated: {{ formatTimestamp(indicators.lastUpdated) }}
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { LifecycleRiskIndicators } from '../../types/lifecycleCockpit'
import Card from '../ui/Card.vue'
import RiskIndicatorCard from './RiskIndicatorCard.vue'

defineProps<{
  indicators: LifecycleRiskIndicators | null
}>()

defineEmits<{
  navigate: [deepLink: string]
}>()

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>
