<template>
  <Card variant="glass" padding="md" class="sticky top-24">
    <h3 class="text-lg font-semibold text-white mb-4">Readiness Score</h3>
    
    <!-- Score Circle -->
    <div class="flex items-center justify-center mb-6">
      <div class="relative w-32 h-32">
        <svg class="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            stroke-width="8"
            fill="none"
            class="text-gray-700"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            stroke-width="8"
            fill="none"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            class="transition-all duration-500"
            :class="scoreColor"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-3xl font-bold text-white">{{ score.overallScore }}</div>
            <div class="text-xs text-gray-400">/ 100</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Details -->
    <div class="space-y-3 mb-6">
      <div class="flex justify-between text-sm">
        <span class="text-gray-400">Required Steps:</span>
        <span class="text-white font-medium">
          {{ score.requiredStepsComplete }} / {{ score.totalRequiredSteps }}
        </span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-400">Optional Steps:</span>
        <span class="text-white font-medium">
          {{ score.optionalStepsComplete }} / {{ score.totalOptionalSteps }}
        </span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-400">Current Step:</span>
        <span class="text-white font-medium">
          {{ currentStep + 1 }} / {{ totalSteps }}
        </span>
      </div>
    </div>

    <!-- Blockers -->
    <div v-if="score.blockers.length > 0" class="mb-4">
      <div class="text-sm font-semibold text-red-400 mb-2">Blockers ({{ score.blockers.length }})</div>
      <div class="space-y-1">
        <div v-for="(blocker, index) in score.blockers.slice(0, 3)" :key="index" class="text-xs text-red-300 flex items-start">
          <span class="mr-1">•</span>
          <span>{{ blocker }}</span>
        </div>
        <div v-if="score.blockers.length > 3" class="text-xs text-red-400">
          +{{ score.blockers.length - 3 }} more
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="score.warnings.length > 0" class="mb-4">
      <div class="text-sm font-semibold text-yellow-400 mb-2">Warnings ({{ score.warnings.length }})</div>
      <div class="space-y-1">
        <div v-for="(warning, index) in score.warnings.slice(0, 2)" :key="index" class="text-xs text-yellow-300 flex items-start">
          <span class="mr-1">•</span>
          <span>{{ warning }}</span>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div v-if="score.recommendations.length > 0">
      <div class="text-sm font-semibold text-blue-400 mb-2">Recommendations</div>
      <div class="space-y-1">
        <div v-for="(rec, index) in score.recommendations.slice(0, 2)" :key="index" class="text-xs text-blue-300 flex items-start">
          <span class="mr-1">•</span>
          <span>{{ rec }}</span>
        </div>
      </div>
    </div>

    <!-- Status Badge -->
    <div class="mt-6 pt-4 border-t border-gray-700">
      <Badge
        :variant="score.blockers.length === 0 ? 'success' : 'warning'"
        size="lg"
        class="w-full justify-center"
      >
        {{ score.blockers.length === 0 ? 'Ready to Submit' : 'In Progress' }}
      </Badge>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReadinessScore } from '../../types/guidedLaunch'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'

const props = defineProps<{
  score: ReadinessScore
  currentStep: number
  totalSteps: number
}>()

const circumference = 2 * Math.PI * 56
const dashOffset = computed(() => {
  const percentage = props.score.overallScore / 100
  return circumference * (1 - percentage)
})

const scoreColor = computed(() => {
  if (props.score.overallScore >= 80) return 'text-green-500'
  if (props.score.overallScore >= 60) return 'text-yellow-500'
  return 'text-red-500'
})
</script>
