<template>
  <Transition name="recovery-banner">
    <div
      v-if="isVisible"
      class="rounded-lg border border-orange-600/60 bg-orange-900/20 p-4"
      role="alert"
      aria-live="polite"
      data-testid="wallet-session-recovery-banner"
    >
      <div class="flex items-start gap-3">
        <ExclamationCircleIcon
          class="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />

        <div class="flex-1 min-w-0">
          <!-- Title + dismiss -->
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-sm font-semibold text-orange-300" data-testid="banner-title">
              {{ titleText }}
            </h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
              :aria-label="'Dismiss ' + titleText"
              data-testid="banner-dismiss"
              @click="dismiss"
            >
              <XMarkIcon class="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <!-- Explanation -->
          <p class="mt-1 text-sm text-orange-200/80" data-testid="banner-explanation">
            {{ explanationText }}
          </p>

          <!-- Network mismatch detail -->
          <div
            v-if="networkMismatch && expectedNetwork && currentNetwork"
            class="mt-2 text-xs text-orange-300/70 bg-orange-900/30 rounded px-2 py-1"
            data-testid="network-mismatch-detail"
          >
            Expected network:
            <strong class="font-semibold text-orange-200">{{ expectedNetwork }}</strong>
            — Current:
            <strong class="font-semibold text-orange-200">{{ currentNetwork }}</strong>
          </div>

          <!-- Actions -->
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
              data-testid="banner-restore-btn"
              @click="restoreSession"
            >
              <ArrowPathIcon class="w-3.5 h-3.5" aria-hidden="true" />
              Restore Session
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded bg-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              data-testid="banner-start-fresh-btn"
              @click="startFresh"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ExclamationCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

export type RecoveryReason = 'session_interrupted' | 'network_mismatch' | 'session_expired'

const props = withDefaults(
  defineProps<{
    isRecoveryNeeded: boolean
    reason?: RecoveryReason
    expectedNetwork?: string
    currentNetwork?: string
  }>(),
  {
    reason: 'session_interrupted',
    expectedNetwork: undefined,
    currentNetwork: undefined,
  },
)

const emit = defineEmits<{
  restore: []
  'start-fresh': []
  dismiss: []
}>()

const dismissed = ref(false)

const isVisible = computed(() => props.isRecoveryNeeded && !dismissed.value)

const networkMismatch = computed(() => props.reason === 'network_mismatch')

const titleText = computed<string>(() => {
  switch (props.reason) {
    case 'network_mismatch':
      return 'Network mismatch detected'
    case 'session_expired':
      return 'Session expired'
    default:
      return 'Session interrupted'
  }
})

const explanationText = computed<string>(() => {
  switch (props.reason) {
    case 'network_mismatch':
      return (
        'Your saved session was created on a different network. ' +
        'Restore the session to continue on the original network, or start fresh on the current one.'
      )
    case 'session_expired':
      return (
        'Your guided launch session has expired due to inactivity. ' +
        'You can restore your previous draft or start a new launch from scratch.'
      )
    default:
      return (
        'Your previous guided launch session was interrupted before completion. ' +
        'Restore your saved progress or start fresh to begin again.'
      )
  }
})

// Re-show banner when the parent toggles isRecoveryNeeded back on
watch(
  () => props.isRecoveryNeeded,
  (val) => {
    if (val) dismissed.value = false
  },
)

function dismiss(): void {
  dismissed.value = true
  emit('dismiss')
}

function restoreSession(): void {
  emit('restore')
}

function startFresh(): void {
  emit('start-fresh')
}
</script>

<style scoped>
.recovery-banner-enter-active,
.recovery-banner-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.recovery-banner-enter-from,
.recovery-banner-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
