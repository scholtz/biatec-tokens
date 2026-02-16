<template>
  <Card variant="glass" padding="lg">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <i class="pi pi-check-circle text-2xl text-blue-400"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-white">Launch Readiness</h3>
            <p class="text-sm text-gray-400">Overall compliance and technical status</p>
          </div>
        </div>
        
        <!-- Readiness Badge -->
        <Badge
          :variant="status?.isLaunchReady ? 'success' : 'warning'"
          size="lg"
        >
          {{ status?.isLaunchReady ? 'Ready' : 'In Progress' }}
        </Badge>
      </div>

      <!-- Loading State -->
      <div v-if="!status" class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-3xl text-gray-500 mb-2"></i>
        <p class="text-sm text-gray-400">Loading readiness data...</p>
      </div>

      <!-- Readiness Score -->
      <div v-else class="space-y-4">
        <!-- Score Circle -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="relative w-24 h-24">
              <svg class="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  class="text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="dashOffset"
                  class="transition-all duration-500"
                  :class="scoreColor"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-2xl font-bold text-white">{{ status.overallScore }}</div>
                  <div class="text-xs text-gray-400">/ 100</div>
                </div>
              </div>
            </div>
            
            <div>
              <div class="text-sm text-gray-400 mb-1">Readiness Score</div>
              <div class="text-lg font-semibold text-white">
                {{ getScoreLabel(status.overallScore) }}
              </div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-xs text-gray-500">Next Review</div>
            <div class="text-sm text-gray-300">
              {{ status.nextReviewDate ? formatDate(status.nextReviewDate) : 'N/A' }}
            </div>
          </div>
        </div>

        <!-- Blockers -->
        <div v-if="status.blockers.length > 0" class="border-t border-gray-700 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-red-400 flex items-center gap-2">
              <i class="pi pi-exclamation-circle"></i>
              Blockers ({{ status.blockers.length }})
            </h4>
          </div>
          
          <div class="space-y-2">
            <div
              v-for="blocker in status.blockers.slice(0, 3)"
              :key="blocker.id"
              class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 hover:bg-red-500/20 transition-colors cursor-pointer"
              @click="$emit('navigate', blocker.deepLink)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="font-medium text-red-300 text-sm">{{ blocker.title }}</div>
                  <div class="text-xs text-red-400/80 mt-1">{{ blocker.description }}</div>
                  <div class="text-xs text-gray-400 mt-2">
                    <span class="font-medium">Impact:</span> {{ blocker.impact }}
                  </div>
                </div>
                <i class="pi pi-arrow-right text-red-400"></i>
              </div>
            </div>
            
            <div v-if="status.blockers.length > 3" class="text-xs text-red-400 text-center">
              +{{ status.blockers.length - 3 }} more blocker{{ status.blockers.length - 3 > 1 ? 's' : '' }}
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="status.warnings.length > 0" class="border-t border-gray-700 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-yellow-400 flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i>
              Warnings ({{ status.warnings.length }})
            </h4>
          </div>
          
          <div class="space-y-2">
            <div
              v-for="warning in status.warnings.slice(0, 2)"
              :key="warning.id"
              class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 hover:bg-yellow-500/20 transition-colors cursor-pointer"
              @click="warning.deepLink && $emit('navigate', warning.deepLink)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="font-medium text-yellow-300 text-sm">{{ warning.title }}</div>
                  <div class="text-xs text-yellow-400/80 mt-1">{{ warning.description }}</div>
                  <div class="text-xs text-gray-400 mt-2">
                    <span class="font-medium">Recommendation:</span> {{ warning.recommendation }}
                  </div>
                </div>
                <i v-if="warning.deepLink" class="pi pi-arrow-right text-yellow-400"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div v-if="status.recommendations.length > 0 && status.blockers.length === 0" class="border-t border-gray-700 pt-4">
          <h4 class="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <i class="pi pi-lightbulb"></i>
            Recommendations
          </h4>
          <ul class="space-y-1">
            <li
              v-for="(rec, index) in status.recommendations.slice(0, 3)"
              :key="index"
              class="text-xs text-blue-300 flex items-start gap-2"
            >
              <span class="text-blue-500 mt-0.5">•</span>
              <span>{{ rec }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReadinessStatus } from '../../types/lifecycleCockpit'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'

const props = defineProps<{
  status: ReadinessStatus | null
}>()

defineEmits<{
  navigate: [deepLink: string]
}>()

const circumference = 2 * Math.PI * 42
const dashOffset = computed(() => {
  if (!props.status) return circumference
  const percentage = props.status.overallScore / 100
  return circumference * (1 - percentage)
})

const scoreColor = computed(() => {
  if (!props.status) return 'text-gray-500'
  if (props.status.overallScore >= 80) return 'text-green-500'
  if (props.status.overallScore >= 60) return 'text-yellow-500'
  return 'text-red-500'
})

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Good'
  if (score >= 70) return 'Fair'
  if (score >= 60) return 'Needs Work'
  return 'Critical'
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
</script>
