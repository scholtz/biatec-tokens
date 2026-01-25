import { ref, computed, onUnmounted, getCurrentInstance } from "vue";
import { healthCheck } from "../services/apiClient";

/**
 * API health status enum
 */
export enum ApiHealthStatus {
  Healthy = "healthy",
  Slow = "slow",
  Unreachable = "unreachable",
}

/**
 * Composable for monitoring API health status with automatic polling and backoff
 *
 * Features:
 * - Automatic health check polling
 * - Exponential backoff on failures
 * - Slow response detection
 * - Manual retry capability
 *
 * @example
 * ```ts
 * const { status, isHealthy, checkHealth, startPolling } = useApiHealth();
 *
 * // Start automatic polling
 * startPolling();
 *
 * // Manual health check
 * await checkHealth();
 * ```
 */
export function useApiHealth() {
  // State
  const status = ref<ApiHealthStatus>(ApiHealthStatus.Healthy);
  const isChecking = ref(false);
  const lastChecked = ref<string | null>(null);
  const error = ref<string | null>(null);

  // Polling configuration
  const NORMAL_INTERVAL = 30000; // 30 seconds
  const SLOW_THRESHOLD = 5000; // 5 seconds
  const INITIAL_BACKOFF = 5000; // 5 seconds
  const MAX_BACKOFF = 60000; // 60 seconds
  const BACKOFF_MULTIPLIER = 2;

  let pollingTimer: ReturnType<typeof setTimeout> | null = null;
  let currentBackoff = INITIAL_BACKOFF;
  let isPolling = false;

  // Computed properties
  const isHealthy = computed(() => status.value === ApiHealthStatus.Healthy);
  const isSlow = computed(() => status.value === ApiHealthStatus.Slow);
  const isUnreachable = computed(() => status.value === ApiHealthStatus.Unreachable);

  /**
   * Performs a health check on the API
   * Measures response time and updates status accordingly
   */
  async function checkHealth(): Promise<void> {
    if (isChecking.value) {
      return;
    }

    isChecking.value = true;
    const startTime = Date.now();

    try {
      await healthCheck();
      const responseTime = Date.now() - startTime;

      // Update status based on response time
      if (responseTime > SLOW_THRESHOLD) {
        status.value = ApiHealthStatus.Slow;
      } else {
        status.value = ApiHealthStatus.Healthy;
      }

      // Clear error on success
      error.value = null;

      // Reset backoff on successful check
      currentBackoff = INITIAL_BACKOFF;
    } catch (err: unknown) {
      status.value = ApiHealthStatus.Unreachable;
      error.value = err instanceof Error ? err.message : "Unknown error";

      // Increase backoff for next poll
      currentBackoff = Math.min(currentBackoff * BACKOFF_MULTIPLIER, MAX_BACKOFF);
    } finally {
      lastChecked.value = new Date().toISOString();
      isChecking.value = false;
    }
  }

  /**
   * Starts automatic polling with backoff strategy
   */
  function startPolling(): void {
    // Prevent multiple polling intervals
    if (isPolling) {
      return;
    }

    isPolling = true;

    // Schedule next check
    const scheduleNextCheck = () => {
      const interval = status.value === ApiHealthStatus.Healthy ? NORMAL_INTERVAL : currentBackoff;

      pollingTimer = setTimeout(async () => {
        await checkHealth();
        scheduleNextCheck();
      }, interval);
    };

    // Perform immediate check and schedule next
    checkHealth().then(() => {
      scheduleNextCheck();
    });
  }

  /**
   * Stops automatic polling
   */
  function stopPolling(): void {
    if (pollingTimer !== null) {
      clearTimeout(pollingTimer);
      pollingTimer = null;
    }
    isPolling = false;
  }

  // Cleanup on component unmount (only if called within a component)
  if (getCurrentInstance()) {
    onUnmounted(() => {
      stopPolling();
    });
  }

  return {
    // State
    status,
    isChecking,
    lastChecked,
    error,

    // Computed
    isHealthy,
    isSlow,
    isUnreachable,

    // Methods
    checkHealth,
    startPolling,
    stopPolling,
  };
}
