/**
 * Wallet Recovery Service
 * Handles automatic reconnection for dropped wallet connections
 * Implements exponential backoff and connection stability monitoring
 */

import { ref } from 'vue'
import { telemetryService } from './TelemetryService'

export interface RecoveryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  connectionCheckIntervalMs: number
}

export interface RecoveryState {
  isRecovering: boolean
  attemptCount: number
  lastAttemptTime: Date | null
  lastError: Error | null
}

const DEFAULT_CONFIG: RecoveryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  connectionCheckIntervalMs: 30000, // Check connection health every 30s
}

export class WalletRecoveryService {
  private config: RecoveryConfig
  private recoveryState = ref<RecoveryState>({
    isRecovering: false,
    attemptCount: 0,
    lastAttemptTime: null,
    lastError: null,
  })
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null
  private onReconnectCallback: ((walletId?: string) => Promise<void>) | null = null

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Register reconnection callback
   */
  setReconnectCallback(callback: (walletId?: string) => Promise<void>) {
    this.onReconnectCallback = callback
  }

  /**
   * Calculate backoff delay for retry attempt
   */
  private calculateBackoffDelay(attempt: number): number {
    const delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1)
    return Math.min(delay, this.config.maxDelayMs)
  }

  /**
   * Attempt to recover wallet connection
   */
  async attemptRecovery(walletId?: string): Promise<boolean> {
    if (!this.onReconnectCallback) {
      console.warn('WalletRecoveryService: No reconnect callback registered')
      return false
    }

    if (this.recoveryState.value.isRecovering) {
      console.log('WalletRecoveryService: Recovery already in progress')
      return false
    }

    this.recoveryState.value.isRecovering = true
    this.recoveryState.value.attemptCount = 0
    this.recoveryState.value.lastError = null

    telemetryService.track('wallet_recovery_started', {
      wallet_id: walletId,
      max_retries: this.config.maxRetries,
    })

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      this.recoveryState.value.attemptCount = attempt
      this.recoveryState.value.lastAttemptTime = new Date()

      try {
        telemetryService.track('wallet_recovery_attempt', {
          attempt,
          wallet_id: walletId,
        })

        await this.onReconnectCallback(walletId)

        // Success!
        this.recoveryState.value.isRecovering = false
        telemetryService.track('wallet_recovery_success', {
          attempt,
          wallet_id: walletId,
        })
        return true
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        this.recoveryState.value.lastError = err

        telemetryService.track('wallet_recovery_attempt_failed', {
          attempt,
          wallet_id: walletId,
          error: err.message,
        })

        if (attempt < this.config.maxRetries) {
          // Wait before next attempt
          const delay = this.calculateBackoffDelay(attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // All retries exhausted
    this.recoveryState.value.isRecovering = false
    telemetryService.track('wallet_recovery_failed', {
      total_attempts: this.config.maxRetries,
      wallet_id: walletId,
      last_error: this.recoveryState.value.lastError?.message,
    })

    return false
  }

  /**
   * Start periodic connection health checks
   */
  startHealthChecks(
    isConnectedFn: () => boolean,
    onConnectionLost: (walletId?: string) => void,
    walletIdFn?: () => string | undefined
  ) {
    if (this.healthCheckInterval) {
      console.warn('WalletRecoveryService: Health checks already running')
      return
    }

    telemetryService.track('wallet_health_checks_started', {
      interval_ms: this.config.connectionCheckIntervalMs,
    })

    this.healthCheckInterval = setInterval(() => {
      const wasConnected = isConnectedFn()
      
      // Only check if we think we should be connected but aren't
      if (!wasConnected && !this.recoveryState.value.isRecovering) {
        telemetryService.track('wallet_connection_lost_detected')
        const walletId = walletIdFn?.()
        onConnectionLost(walletId)
      }
    }, this.config.connectionCheckIntervalMs)
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      telemetryService.track('wallet_health_checks_stopped')
    }
  }

  /**
   * Get current recovery state
   */
  getRecoveryState(): RecoveryState {
    return this.recoveryState.value
  }

  /**
   * Reset recovery state
   */
  reset() {
    this.recoveryState.value = {
      isRecovering: false,
      attemptCount: 0,
      lastAttemptTime: null,
      lastError: null,
    }
  }

  /**
   * Cleanup and stop all operations
   */
  destroy() {
    this.stopHealthChecks()
    this.reset()
    this.onReconnectCallback = null
  }
}

// Singleton instance for global use
export const walletRecoveryService = new WalletRecoveryService()
