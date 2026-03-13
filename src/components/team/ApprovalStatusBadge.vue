<template>
  <span
    :class="badgeClasses"
    :role="ariaRole"
    :aria-label="ariaLabel"
  >
    <i :class="iconClass" class="mr-1" aria-hidden="true"></i>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ApprovalState } from '../../types/approvalWorkflow'

interface Props {
  state: ApprovalState
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const LABELS: Record<ApprovalState, string> = {
  pending: 'Pending Review',
  in_review: 'In Review',
  approved: 'Approved',
  needs_changes: 'Needs Changes',
  blocked: 'Blocked',
  completed: 'Completed',
}

const COLOR_CLASSES: Record<ApprovalState, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700/50',
  in_review: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700/50',
  needs_changes: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700/50',
  blocked: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700/50',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50',
}

const ICON_CLASSES: Record<ApprovalState, string> = {
  pending: 'pi pi-clock',
  in_review: 'pi pi-eye',
  approved: 'pi pi-check-circle',
  needs_changes: 'pi pi-exclamation-triangle',
  blocked: 'pi pi-ban',
  completed: 'pi pi-check',
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

const label = computed(() => LABELS[props.state])

const iconClass = computed(() => ICON_CLASSES[props.state])

const ariaRole = computed<'status' | 'alert'>(() =>
  props.state === 'blocked' || props.state === 'needs_changes' ? 'alert' : 'status',
)

const ariaLabel = computed(() => `Approval status: ${label.value}`)

const badgeClasses = computed(() =>
  [
    'inline-flex items-center font-medium rounded-full',
    COLOR_CLASSES[props.state],
    SIZE_CLASSES[props.size],
  ].join(' '),
)
</script>
