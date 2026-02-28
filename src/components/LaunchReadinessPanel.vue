<template>
  <div
    class="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
    :class="compact ? 'p-4' : 'p-6'"
    data-testid="launch-readiness-panel"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3
          class="font-semibold text-white"
          :class="compact ? 'text-base' : 'text-lg'"
          data-testid="panel-title"
        >
          Launch Readiness
        </h3>
        <p v-if="!compact" class="text-sm text-gray-400 mt-0.5">
          Complete the steps below to launch your token
        </p>
      </div>

      <!-- Readiness Score Badge -->
      <div
        class="flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[64px]"
        :class="scoreBackgroundClass"
        data-testid="readiness-score"
        :aria-label="`Readiness score: ${report.readinessScore} out of 100`"
      >
        <span class="text-xl font-bold leading-none" :class="scoreTextClass">
          {{ report.readinessScore }}
        </span>
        <span class="text-xs mt-0.5" :class="scoreTextClass">/ 100</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div
      v-if="!compact"
      class="mb-4"
      data-testid="progress-bar-container"
    >
      <div class="flex justify-between text-xs text-gray-400 mb-1.5">
        <span>{{ report.completedCount }} of {{ report.totalCount }} steps complete</span>
        <span v-if="report.estimatedMinutesRemaining > 0" data-testid="time-remaining">
          ~{{ report.estimatedMinutesRemaining }} min remaining
        </span>
        <span v-else class="text-green-400">All steps done</span>
      </div>
      <div class="h-2 w-full rounded-full bg-white/10">
        <div
          class="h-2 rounded-full transition-all duration-500"
          :class="progressBarClass"
          :style="{ width: `${report.readinessScore}%` }"
          data-testid="progress-bar"
          role="progressbar"
          :aria-valuenow="report.readinessScore"
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>

    <!-- Checklist Items -->
    <ul class="space-y-2" data-testid="readiness-items-list" role="list">
      <li
        v-for="item in report.items"
        :key="item.id"
        class="flex items-start gap-3 rounded-lg p-2 transition-colors"
        :class="[
          item === report.nextActionItem ? 'bg-white/8 border border-white/15' : 'hover:bg-white/5',
          compact ? '' : 'p-3',
        ]"
        :data-testid="`readiness-item-${item.id}`"
        :aria-label="`${item.label}: ${getReadinessStatusLabel(item.status)}`"
      >
        <!-- Status Icon -->
        <span
          class="flex-shrink-0 mt-0.5 text-base leading-none"
          :class="getReadinessStatusColor(item.status)"
          :aria-label="getReadinessStatusLabel(item.status)"
          data-testid="status-icon"
        >
          <CheckCircleIcon v-if="item.status === 'ready'" class="w-5 h-5" />
          <ClockIcon v-else-if="item.status === 'in_progress'" class="w-5 h-5" />
          <ExclamationTriangleIcon v-else-if="item.status === 'needs_attention'" class="w-5 h-5" />
          <XCircleIcon v-else-if="item.status === 'blocked'" class="w-5 h-5" />
          <div v-else class="w-5 h-5 rounded-full border-2 border-current opacity-40" />
        </span>

        <!-- Item Details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="text-sm font-medium"
              :class="item.status === 'ready' ? 'text-gray-300 line-through' : 'text-white'"
            >
              {{ item.label }}
            </span>
            <span
              v-if="item === report.nextActionItem"
              class="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30"
              data-testid="next-action-badge"
            >
              Next step
            </span>
            <span
              v-if="!item.isRequired"
              class="text-xs text-gray-500"
            >
              Optional
            </span>
          </div>

          <p
            v-if="!compact"
            class="text-xs text-gray-400 mt-0.5 leading-relaxed"
          >
            {{ item.description }}
          </p>

          <!-- Time Estimate -->
          <span
            v-if="!compact && item.estimatedMinutes && item.status !== 'ready'"
            class="text-xs text-gray-500 mt-1 inline-block"
            data-testid="item-time-estimate"
          >
            ~{{ item.estimatedMinutes }} min
          </span>
        </div>

        <!-- Action Link -->
        <button
          v-if="item.actionLabel && item.actionRoute && item.status !== 'ready'"
          class="flex-shrink-0 text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
          data-testid="item-action-button"
          @click="handleItemAction(item)"
        >
          {{ item.actionLabel }}
        </button>
      </li>
    </ul>

    <!-- Primary CTA -->
    <div
      v-if="report.items.length > 0"
      class="mt-4 pt-4 border-t border-white/10"
      data-testid="cta-section"
    >
      <button
        class="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
        :class="ctaButtonClass"
        :disabled="ctaDisabled"
        data-testid="cta-button"
        @click="handleCTAClick"
      >
        {{ ctaLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import {
  computeOverallReadiness,
  getReadinessStatusColor,
  getReadinessStatusLabel,
  type ReadinessItem,
  type IssuerReadinessReport,
} from '../utils/launchReadiness'

const props = withDefaults(
  defineProps<{
    items: ReadinessItem[]
    compact?: boolean
  }>(),
  {
    compact: false,
  }
)

const emit = defineEmits<{
  action: [item: ReadinessItem]
  launch: []
}>()

const report = computed<IssuerReadinessReport>(() => computeOverallReadiness(props.items))

const scoreTextClass = computed(() => {
  const score = report.value.readinessScore
  if (score === 100) return 'text-green-400'
  if (score >= 75) return 'text-blue-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-gray-400'
})

const scoreBackgroundClass = computed(() => {
  const score = report.value.readinessScore
  if (score === 100) return 'bg-green-400/10 border border-green-400/20'
  if (score >= 75) return 'bg-blue-400/10 border border-blue-400/20'
  if (score >= 50) return 'bg-amber-400/10 border border-amber-400/20'
  return 'bg-white/5 border border-white/10'
})

const progressBarClass = computed(() => {
  const score = report.value.readinessScore
  if (score === 100) return 'bg-gradient-to-r from-green-500 to-green-400'
  if (score >= 75) return 'bg-gradient-to-r from-blue-500 to-blue-400'
  if (score >= 50) return 'bg-gradient-to-r from-amber-500 to-amber-400'
  return 'bg-gray-600'
})

const ctaLabel = computed(() => {
  if (report.value.canProceedToLaunch) return 'Request Token Launch →'
  if (report.value.overallStatus === 'blocked') return 'Resolve Blocking Issues First'
  if (report.value.overallStatus === 'needs_attention') return 'Fix Issues to Continue'
  if (report.value.overallStatus === 'in_progress') return 'Continue Setup'
  return 'Begin Setup'
})

const ctaDisabled = computed(() => {
  return report.value.overallStatus === 'blocked' && !report.value.canProceedToLaunch
})

const ctaButtonClass = computed(() => {
  if (report.value.canProceedToLaunch) {
    return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500'
  }
  if (ctaDisabled.value) {
    return 'bg-gray-700 text-gray-400 cursor-not-allowed focus:ring-gray-500'
  }
  return 'bg-white/10 hover:bg-white/15 text-white border border-white/10 focus:ring-white/30'
})

function handleItemAction(item: ReadinessItem) {
  emit('action', item)
}

function handleCTAClick() {
  if (ctaDisabled.value) return
  if (report.value.canProceedToLaunch) {
    emit('launch')
  } else if (report.value.nextActionItem) {
    emit('action', report.value.nextActionItem)
  }
}
</script>
