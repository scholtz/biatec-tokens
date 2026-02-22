<template>
  <div
    class="bg-white dark:bg-gray-900 border rounded-xl p-4"
    :class="containerClass"
    role="region"
    :aria-label="`Action readiness: ${canProceed ? 'ready' : 'not ready'}`"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <component :is="headerIcon" class="w-5 h-5" :class="headerIconClass" aria-hidden="true" />
        <h3 class="text-sm font-semibold" :class="headerTitleClass">
          {{ canProceed ? 'Ready to Proceed' : 'Action Blocked' }}
        </h3>
      </div>
      <Badge :variant="badgeVariant" size="sm">
        {{ passCount }}/{{ checks.length }} checks passed
      </Badge>
    </div>

    <!-- Check list -->
    <ul class="space-y-2" aria-label="Readiness checks">
      <li
        v-for="check in checks"
        :key="check.id"
        class="flex items-start gap-2"
      >
        <span class="flex-shrink-0 mt-0.5">
          <CheckCircleIcon
            v-if="check.status === 'pass'"
            class="w-4 h-4 text-green-500"
            aria-label="Passed"
          />
          <ExclamationTriangleIcon
            v-else-if="check.status === 'warning'"
            class="w-4 h-4 text-yellow-500"
            aria-label="Warning"
          />
          <XCircleIcon
            v-else
            class="w-4 h-4 text-red-500"
            aria-label="Failed"
          />
        </span>
        <div class="flex-1 min-w-0">
          <span class="text-sm" :class="checkLabelClass(check.status)">
            {{ check.label }}
          </span>
          <p v-if="check.message && check.status !== 'pass'" class="text-xs mt-0.5" :class="checkMessageClass(check.status)">
            {{ check.message }}
          </p>
          <router-link
            v-if="check.remediationPath && check.status === 'fail'"
            :to="check.remediationPath"
            class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded mt-0.5 inline-block"
          >
            {{ check.remediationLabel ?? 'Fix this' }} →
          </router-link>
        </div>
      </li>
    </ul>

    <!-- Proceed button slot -->
    <div v-if="canProceed && $slots.proceed" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <slot name="proceed" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/outline'
import Badge from '../ui/Badge.vue'
import type { ReadinessCheck, ReadinessCheckStatus } from '../../utils/portfolioOnboarding'

interface Props {
  checks: ReadinessCheck[]
  canProceed: boolean
}

const props = defineProps<Props>()

const passCount = computed(() => props.checks.filter((c) => c.status === 'pass').length)

const badgeVariant = computed(() => {
  if (props.canProceed) return 'success'
  const hasFailures = props.checks.some((c) => c.status === 'fail')
  return hasFailures ? 'error' : 'warning'
})

const containerClass = computed(() =>
  props.canProceed
    ? 'border-green-200 dark:border-green-800'
    : props.checks.some((c) => c.status === 'fail')
      ? 'border-red-200 dark:border-red-800'
      : 'border-yellow-200 dark:border-yellow-800',
)

const headerIcon = computed(() => (props.canProceed ? ShieldCheckIcon : ShieldExclamationIcon))

const headerIconClass = computed(() =>
  props.canProceed ? 'text-green-500' : 'text-red-500',
)

const headerTitleClass = computed(() =>
  props.canProceed
    ? 'text-green-800 dark:text-green-200'
    : 'text-red-800 dark:text-red-200',
)

function checkLabelClass(status: ReadinessCheckStatus): string {
  if (status === 'pass') return 'text-gray-700 dark:text-gray-300'
  if (status === 'warning') return 'text-yellow-800 dark:text-yellow-200 font-medium'
  return 'text-red-800 dark:text-red-200 font-medium'
}

function checkMessageClass(status: ReadinessCheckStatus): string {
  if (status === 'warning') return 'text-yellow-700 dark:text-yellow-300'
  return 'text-red-700 dark:text-red-300'
}
</script>
