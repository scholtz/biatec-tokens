<template>
  <Transition name="slide-down">
    <div
      v-if="shouldShow"
      data-testid="api-health-banner"
      role="alert"
      aria-live="polite"
      :class="bannerClasses"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <!-- Icon and Message -->
          <div class="flex items-center gap-3 flex-1">
            <!-- Status Icon -->
            <div class="flex-shrink-0">
              <svg
                v-if="isSlow"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="isUnreachable"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>

            <!-- Message -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">
                <span v-if="isSlow">
                  API is responding slowly
                </span>
                <span v-else-if="isUnreachable">
                  API is unreachable
                </span>
              </p>
              <p v-if="error && isUnreachable" class="text-xs mt-1 text-white">
                {{ error }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <!-- Retry Button (only for unreachable) -->
            <button
              v-if="isUnreachable"
              data-testid="retry-button"
              :disabled="isChecking"
              :aria-label="isChecking ? 'Retrying...' : 'Retry connection'"
              @click="handleRetry"
              class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 hover:bg-white/20 text-white focus:ring-white/50"
            >
              <div
                v-if="isChecking"
                class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              ></div>
              <svg
                v-else
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{{ isChecking ? 'Retrying...' : 'Retry' }}</span>
            </button>

            <!-- Dismiss Button -->
            <button
              data-testid="dismiss-button"
              aria-label="Dismiss banner"
              @click="handleDismiss"
              class="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-white/10 text-white/80 hover:text-white focus:ring-white/50"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useApiHealth, ApiHealthStatus } from '../composables/useApiHealth';

// Use the health check composable
const {
  status,
  isHealthy,
  isSlow,
  isUnreachable,
  isChecking,
  error,
  checkHealth,
  startPolling,
  stopPolling,
} = useApiHealth();

// Dismissal state
const isDismissed = ref(false);
const dismissedStatus = ref<ApiHealthStatus | null>(null);

// Show banner if not healthy and not dismissed for current status
const shouldShow = computed(() => {
  if (isHealthy.value) return false;
  if (!isDismissed.value) return true;
  
  // Show again if status changed from what was dismissed
  return dismissedStatus.value !== status.value;
});

// Banner styling based on status
const bannerClasses = computed(() => {
  const base = 'w-full transition-all duration-300';
  
  if (isSlow.value) {
    return `${base} bg-gradient-to-r from-amber-600 to-orange-600 text-white`;
  }
  
  if (isUnreachable.value) {
    return `${base} bg-gradient-to-r from-red-600 to-red-700 text-white`;
  }
  
  return base;
});

// Watch for status changes to reset dismissal
watch(status, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus && isDismissed.value) {
    // If status changed from dismissed state, show banner again
    if (dismissedStatus.value !== newStatus) {
      isDismissed.value = false;
    }
  }
});

// Handle retry button click
const handleRetry = async () => {
  await checkHealth();
};

// Handle dismiss button click
const handleDismiss = () => {
  isDismissed.value = true;
  dismissedStatus.value = status.value;
};

// Lifecycle hooks
onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
