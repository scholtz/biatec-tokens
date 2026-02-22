<template>
  <div
    class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
    role="region"
    aria-label="Portfolio continuity panel"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <ChartBarIcon class="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">Portfolio Since Last Visit</h2>
      </div>
      <!-- Freshness indicator -->
      <span class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <ClockIcon class="w-3.5 h-3.5" aria-hidden="true" />
        <span v-if="snapshotAge">{{ snapshotAge }}</span>
        <span v-else>No prior data</span>
      </span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8" aria-live="polite" aria-label="Loading portfolio data">
      <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading portfolio data…</span>
    </div>

    <!-- Empty state: no previous snapshot -->
    <div v-else-if="!hasPreviousSnapshot" class="text-center py-8">
      <SparklesIcon class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" aria-hidden="true" />
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">First visit detected</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
        Your portfolio snapshot will be saved now so you can track changes on your next visit.
      </p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" role="alert">
      <div class="flex items-start gap-2">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p class="text-sm font-medium text-red-800 dark:text-red-200">{{ error }}</p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1">Try refreshing the page to reload portfolio data.</p>
        </div>
      </div>
    </div>

    <!-- Delta indicators -->
    <div v-else-if="deltas.length > 0" class="grid grid-cols-3 gap-4">
      <div
        v-for="delta in deltas"
        :key="delta.indicator"
        class="rounded-xl p-4 border"
        :class="deltaCardClass(delta)"
      >
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
          {{ delta.indicator }}
        </p>
        <p class="text-2xl font-bold" :class="deltaValueClass(delta)">
          {{ delta.current }}
        </p>
        <div class="flex items-center gap-1 mt-1">
          <component
            :is="deltaArrowIcon(delta)"
            class="w-3.5 h-3.5 flex-shrink-0"
            :class="deltaArrowClass(delta)"
            aria-hidden="true"
          />
          <span class="text-xs font-medium" :class="deltaChangeClass(delta)">
            {{ delta.formattedChange }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">since last visit</span>
        </div>
      </div>
    </div>

    <!-- Suggested actions -->
    <div v-if="suggestedActions.length > 0 && !loading" class="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Suggested Actions
      </p>
      <div class="flex flex-wrap gap-2">
        <router-link
          v-for="action in suggestedActions"
          :key="action.label"
          :to="action.path"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          :class="action.variant === 'primary'
            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'"
        >
          <component :is="action.icon" class="w-3.5 h-3.5" aria-hidden="true" />
          {{ action.label }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'
import type { PortfolioDelta } from '../../utils/portfolioOnboarding'
import { formatSnapshotAge } from '../../utils/portfolioOnboarding'

import type { Component } from 'vue'

interface SuggestedAction {
  label: string
  path: string
  icon: Component
  variant?: 'primary' | 'secondary'
}

interface Props {
  deltas: PortfolioDelta[]
  snapshotCapturedAt?: string
  hasPreviousSnapshot: boolean
  loading?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: undefined,
  snapshotCapturedAt: undefined,
})

const snapshotAge = computed(() =>
  props.snapshotCapturedAt ? formatSnapshotAge(props.snapshotCapturedAt) : null,
)

// Derive suggested actions from delta context
const suggestedActions = computed<SuggestedAction[]>(() => {
  const actions: SuggestedAction[] = []

  const tokenDelta = props.deltas.find((d) => d.indicator === 'Tokens Created')
  const deployDelta = props.deltas.find((d) => d.indicator === 'Deployed Tokens')
  const compDelta = props.deltas.find((d) => d.indicator === 'Compliance Score')

  // Suggest guided launch when no tokens created
  if (!tokenDelta || tokenDelta.current === 0) {
    actions.push({ label: 'Create First Token', path: '/launch/guided', icon: RocketLaunchIcon, variant: 'primary' })
  }

  // Suggest deployment when token exists but not deployed
  if (tokenDelta && tokenDelta.current > 0 && deployDelta && deployDelta.current === 0) {
    actions.push({ label: 'Deploy Token', path: '/cockpit', icon: RocketLaunchIcon, variant: 'primary' })
  }

  // Suggest compliance when score is low
  if (compDelta && compDelta.current < 70) {
    actions.push({ label: 'Improve Compliance', path: '/compliance/setup', icon: ShieldCheckIcon })
  }

  // Always offer a view dashboard shortcut if user has tokens
  if (tokenDelta && tokenDelta.current > 0) {
    actions.push({ label: 'View Dashboard', path: '/dashboard', icon: EyeIcon })
  }

  return actions.slice(0, 3) // cap at 3
})

// ─── Delta styling helpers ────────────────────────────────────────────────────

function deltaCardClass(delta: PortfolioDelta): string {
  if (delta.direction === 'up') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  if (delta.direction === 'down') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
}

function deltaValueClass(delta: PortfolioDelta): string {
  if (delta.direction === 'up') return 'text-green-700 dark:text-green-300'
  if (delta.direction === 'down') return 'text-red-700 dark:text-red-300'
  return 'text-gray-900 dark:text-white'
}

function deltaArrowIcon(delta: PortfolioDelta) {
  if (delta.direction === 'up') return ArrowUpIcon
  if (delta.direction === 'down') return ArrowDownIcon
  return MinusIcon
}

function deltaArrowClass(delta: PortfolioDelta): string {
  if (delta.direction === 'up') return 'text-green-500'
  if (delta.direction === 'down') return 'text-red-500'
  return 'text-gray-400'
}

function deltaChangeClass(delta: PortfolioDelta): string {
  if (delta.direction === 'up') return 'text-green-600 dark:text-green-400'
  if (delta.direction === 'down') return 'text-red-600 dark:text-red-400'
  return 'text-gray-400 dark:text-gray-500'
}
</script>
