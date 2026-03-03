<template>
  <div
    class="rounded-xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm p-6"
    data-testid="launch-funnel-metrics-panel"
    role="region"
    aria-label="Token launch funnel metrics"
  >
    <div class="flex items-center justify-between mb-5">
      <h3 class="text-base font-semibold text-white">
        Launch Funnel Metrics
      </h3>
      <span
        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="isLive ? 'bg-green-900/40 text-green-300 border border-green-700/40' : 'bg-gray-700/40 text-gray-400'"
        data-testid="live-indicator"
      >
        <span
          v-if="isLive"
          class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"
          aria-hidden="true"
        />
        {{ isLive ? 'Live' : 'Snapshot' }}
      </span>
    </div>

    <!-- Funnel stages -->
    <ol
      class="space-y-3"
      aria-label="Funnel stage breakdown"
      data-testid="funnel-stages"
    >
      <li
        v-for="stage in stages"
        :key="stage.id"
        class="flex items-center gap-3"
        :data-testid="`stage-${stage.id}`"
      >
        <!-- Stage colour indicator -->
        <span
          class="flex-shrink-0 w-2.5 h-2.5 rounded-full"
          :class="stageColour(stage)"
          aria-hidden="true"
        />
        <!-- Visually hidden status for screen readers so colour is not the only indicator -->
        <span class="sr-only">{{ stageStatusLabel(stage) }}</span>

        <!-- Name + count -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm text-gray-300 truncate">{{ stage.label }}</span>
            <span
              class="text-sm font-semibold text-white tabular-nums"
              :aria-label="`${stage.count} entries`"
            >{{ stage.count }}</span>
          </div>

          <!-- Fill bar -->
          <div
            class="mt-1 h-1.5 w-full rounded-full bg-gray-700"
            role="progressbar"
            :aria-valuenow="barWidth(stage)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${stage.label}: ${barWidth(stage)}% of entries`"
          >
            <div
              class="h-1.5 rounded-full transition-all duration-500"
              :class="barColour(stage)"
              :style="{ width: `${barWidth(stage)}%` }"
            />
          </div>
        </div>

        <!-- Rate badge -->
        <span
          v-if="stage.rateLabel"
          class="flex-shrink-0 text-xs tabular-nums px-1.5 py-0.5 rounded"
          :class="rateBadgeClass(stage)"
          :data-testid="`stage-rate-${stage.id}`"
        >{{ stage.rateLabel }}</span>
      </li>
    </ol>

    <!-- Summary row -->
    <div
      class="mt-5 pt-4 border-t border-gray-700/40 grid grid-cols-3 gap-3 text-center"
      data-testid="metrics-summary"
    >
      <div>
        <p class="text-xs text-gray-500 mb-0.5">Entered</p>
        <p class="text-lg font-bold text-white tabular-nums" data-testid="total-entered">
          {{ totalEntered }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-0.5">Completed</p>
        <p class="text-lg font-bold text-green-400 tabular-nums" data-testid="total-completed">
          {{ totalCompleted }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-0.5">Completion rate</p>
        <p
          class="text-lg font-bold tabular-nums"
          :class="completionRate >= 70 ? 'text-green-400' : completionRate >= 40 ? 'text-yellow-400' : 'text-red-400'"
          data-testid="completion-rate"
        >
          {{ completionRate }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FunnelStageMetric {
  /** Stable identifier used for data-testid and keying */
  id: string
  /** Human-readable label */
  label: string
  /** Number of users / sessions that entered this stage */
  count: number
  /** Number of failures at this stage (optional) */
  failures?: number
  /** Whether this stage is the final success state */
  isFinal?: boolean
}

// ─── Props ───────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** Ordered array of funnel stages, from entry to completion */
    stages: FunnelStageMetric[]
    /** Whether this panel is showing live data (vs. a static snapshot) */
    isLive?: boolean
  }>(),
  {
    isLive: false,
  }
)

// ─── Computed ────────────────────────────────────────────────────────────────

const totalEntered = computed(() =>
  props.stages.length > 0 ? props.stages[0].count : 0
)

const totalCompleted = computed(() => {
  const last = props.stages[props.stages.length - 1]
  return last ? last.count : 0
})

const completionRate = computed(() => {
  if (totalEntered.value === 0) return 0
  return Math.round((totalCompleted.value / totalEntered.value) * 100)
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function barWidth(stage: FunnelStageMetric): number {
  if (totalEntered.value === 0) return 0
  return Math.min(100, Math.round((stage.count / totalEntered.value) * 100))
}

/** Rate label to display next to a stage (failure rate if failures present) */
function stageWithRate(stage: FunnelStageMetric): FunnelStageMetric & { rateLabel: string | null } {
  if (stage.failures == null || stage.count === 0) {
    return { ...stage, rateLabel: null }
  }
  const failRate = Math.round((stage.failures / stage.count) * 100)
  return { ...stage, rateLabel: `${failRate}% err` }
}

const stages = computed(() =>
  props.stages.map(stageWithRate)
)

function stageColour(stage: (typeof stages.value)[number]): string {
  if (stage.isFinal) return 'bg-green-400'
  if (stage.failures != null && stage.count > 0) {
    const rate = stage.failures / stage.count
    if (rate > 0.2) return 'bg-red-400'
    if (rate > 0.05) return 'bg-yellow-400'
  }
  return 'bg-blue-400'
}

/** Screen-reader label for stage status (ensures colour is not the only indicator). */
function stageStatusLabel(stage: (typeof stages.value)[number]): string {
  if (stage.isFinal) return 'completed'
  if (stage.failures != null && stage.count > 0) {
    const rate = stage.failures / stage.count
    if (rate > 0.2) return 'high failure rate'
    if (rate > 0.05) return 'moderate failure rate'
  }
  return 'in progress'
}

function barColour(stage: (typeof stages.value)[number]): string {
  if (stage.isFinal) return 'bg-green-500'
  if (stage.failures != null && stage.count > 0) {
    const rate = stage.failures / stage.count
    if (rate > 0.2) return 'bg-red-500'
    if (rate > 0.05) return 'bg-yellow-500'
  }
  return 'bg-blue-500'
}

function rateBadgeClass(stage: (typeof stages.value)[number]): string {
  if (!stage.rateLabel) return ''
  if (stage.failures != null && stage.count > 0) {
    const rate = stage.failures / stage.count
    if (rate > 0.2) return 'bg-red-900/40 text-red-300 border border-red-700/40'
    if (rate > 0.05) return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40'
  }
  return 'bg-gray-700/40 text-gray-400'
}
</script>
