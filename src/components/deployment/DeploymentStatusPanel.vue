<template>
  <div
    class="deployment-status-panel rounded-xl border p-4 space-y-4"
    :class="panelClass"
    data-testid="deployment-status-panel"
    :aria-label="`Deployment status: ${lifecycleLabel}`"
    role="region"
  >
    <!-- Header: lifecycle state -->
    <div class="flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        :class="iconContainerClass"
        aria-hidden="true"
      >
        <svg
          v-if="state === 'Completed'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
          data-testid="icon-completed"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <svg
          v-else-if="state === 'Failed'"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
          data-testid="icon-failed"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg
          v-else
          class="w-5 h-5 animate-spin"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          data-testid="icon-in-progress"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white" data-testid="lifecycle-label">
          {{ lifecycleLabel }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400" data-testid="lifecycle-description">
          {{ lifecycleDescription }}
        </p>
      </div>
    </div>

    <!-- Idempotency replay notice -->
    <div
      v-if="isIdempotentReplay"
      class="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-300"
      role="alert"
      data-testid="idempotency-replay-notice"
    >
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      <span>
        This token was already deployed. Your existing deployment has been returned — no duplicate was created.
      </span>
    </div>

    <!-- Error: user guidance (no raw error codes exposed).
         Always shows when state === 'Failed' — uses backend-provided guidance
         when available, otherwise falls back to a generic actionable message. -->
    <div
      v-if="state === 'Failed'"
      class="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300"
      role="alert"
      data-testid="error-guidance"
    >
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <span data-testid="error-guidance-text">{{ displayedErrorGuidance }}</span>
    </div>

    <!-- Progress steps: lifecycle pipeline -->
    <div class="space-y-2" data-testid="lifecycle-steps">
      <div
        v-for="step in LIFECYCLE_STEPS"
        :key="step.state"
        class="flex items-center gap-3"
        :data-testid="`step-${step.state.toLowerCase()}`"
      >
        <!-- Step indicator -->
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold transition-colors"
          :class="stepIndicatorClass(step.state)"
        >
          <svg
            v-if="isStepCompleted(step.state)"
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span v-else>{{ step.index }}</span>
        </div>

        <!-- Step label -->
        <span
          class="text-xs transition-colors"
          :class="stepLabelClass(step.state)"
        >
          {{ step.label }}
        </span>
      </div>
    </div>

    <!-- Success: asset ID + audit trail link -->
    <div
      v-if="state === 'Completed' && assetId"
      class="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2"
      data-testid="success-section"
    >
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Asset ID:
        <span class="font-mono font-semibold text-gray-900 dark:text-white ml-1" data-testid="asset-id">
          {{ assetId }}
        </span>
      </p>
      <a
        v-if="auditTrailUrl"
        :href="auditTrailUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        data-testid="audit-trail-link"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
        View compliance audit trail
      </a>
    </div>

    <!-- Completed without asset ID: backend confirmation pending.
         Prevents misleading silence when deployment is confirmed but assetId
         has not yet been relayed to the frontend. -->
    <div
      v-else-if="state === 'Completed' && !assetId"
      class="pt-2 border-t border-gray-200 dark:border-gray-700"
      data-testid="success-section-pending-asset"
    >
      <p class="text-xs text-gray-500 dark:text-gray-400" data-testid="pending-asset-message">
        Your token has been deployed. Visit your dashboard to view the deployment details and your asset ID.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DeploymentLifecycleState } from '../../lib/api/backendDeploymentContract'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  /** Current deployment lifecycle state */
  state: DeploymentLifecycleState
  /** Previous state before failure — used to show completed steps leading up to failure */
  previousState?: DeploymentLifecycleState
  /** True when this response is an idempotency replay */
  isIdempotentReplay?: boolean
  /** Asset ID of the deployed token (shown on Completed) */
  assetId?: string
  /** User-friendly error guidance (no raw error codes) */
  errorGuidance?: string
  /** URL to the compliance audit trail */
  auditTrailUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  previousState: undefined,
  isIdempotentReplay: false,
  assetId: undefined,
  errorGuidance: undefined,
  auditTrailUrl: undefined,
})

// ---------------------------------------------------------------------------
// Lifecycle step definitions (state machine order)
// ---------------------------------------------------------------------------

const LIFECYCLE_STEPS: Array<{
  state: DeploymentLifecycleState
  label: string
  index: number
}> = [
  { state: 'Pending', label: 'Pending', index: 1 },
  { state: 'Validated', label: 'Validated', index: 2 },
  { state: 'Submitted', label: 'Submitted', index: 3 },
  { state: 'Confirmed', label: 'Confirmed', index: 4 },
  { state: 'Completed', label: 'Completed', index: 5 },
]

const STATE_ORDER: Record<DeploymentLifecycleState, number> = {
  Pending: 1,
  Validated: 2,
  Submitted: 3,
  Confirmed: 4,
  Completed: 5,
  Failed: 0,
}

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const lifecycleLabel = computed((): string => {
  switch (props.state) {
    case 'Pending':
      return 'Preparing deployment…'
    case 'Validated':
      return 'Parameters validated'
    case 'Submitted':
      return 'Transaction submitted to network'
    case 'Confirmed':
      return 'Transaction confirmed on-chain'
    case 'Completed':
      return 'Deployment complete'
    case 'Failed':
      return 'Deployment failed'
  }
})

const lifecycleDescription = computed((): string => {
  switch (props.state) {
    case 'Pending':
      return 'Verifying your credentials and token parameters.'
    case 'Validated':
      return 'Token parameters passed all compliance checks.'
    case 'Submitted':
      return 'Your token creation transaction has been broadcast.'
    case 'Confirmed':
      return 'The blockchain has confirmed the transaction.'
    case 'Completed':
      return 'Your token has been successfully deployed.'
    case 'Failed':
      return 'The deployment could not be completed. Review the error details below.'
  }
})

/**
 * Error guidance shown in the prominent error-guidance box when state === 'Failed'.
 * Uses backend-provided guidance when available; falls back to a generic actionable
 * message so the user always has a next step — even if the backend returned no detail.
 *
 * This prevents the misleading pattern of showing "Deployment failed" with no
 * actionable context (the blocker identified in the strict sign-off lane review).
 */
const displayedErrorGuidance = computed((): string => {
  return (
    props.errorGuidance ??
    'An unexpected error occurred during deployment. Please check your dashboard for details or contact support if the issue persists.'
  )
})

const panelClass = computed((): string => {
  switch (props.state) {
    case 'Completed':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
    case 'Failed':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
    default:
      return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  }
})

const iconContainerClass = computed((): string => {
  switch (props.state) {
    case 'Completed':
      return 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300'
    case 'Failed':
      return 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300'
    default:
      return 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
  }
})

/** Returns true when a step is fully completed (current state has passed it) */
function isStepCompleted(stepState: DeploymentLifecycleState): boolean {
  if (props.state === 'Failed') {
    // Show completed steps based on previousState so users can see how far
    // the deployment got before it failed (e.g. Failed after Confirmed shows
    // Pending → Validated → Submitted → Confirmed all as green)
    if (!props.previousState) return false
    return STATE_ORDER[props.previousState] >= STATE_ORDER[stepState]
  }
  return STATE_ORDER[props.state] > STATE_ORDER[stepState]
}

/** Returns true when a step is the active (current) step */
function isStepActive(stepState: DeploymentLifecycleState): boolean {
  return props.state === stepState
}

function stepIndicatorClass(stepState: DeploymentLifecycleState): string {
  if (isStepCompleted(stepState)) {
    return 'bg-green-500 text-white'
  }
  if (isStepActive(stepState)) {
    return 'bg-blue-500 text-white'
  }
  return 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
}

function stepLabelClass(stepState: DeploymentLifecycleState): string {
  if (isStepCompleted(stepState)) {
    return 'text-green-700 dark:text-green-400 font-medium'
  }
  if (isStepActive(stepState)) {
    return 'text-blue-700 dark:text-blue-400 font-medium'
  }
  return 'text-gray-400 dark:text-gray-500'
}
</script>
