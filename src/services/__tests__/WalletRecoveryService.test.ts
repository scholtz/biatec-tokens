/**
 * Tests for WalletRecoveryService
 * Validates automatic reconnection logic and connection health monitoring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WalletRecoveryService } from '../WalletRecoveryService'

describe('WalletRecoveryService', () => {
  let service: WalletRecoveryService
  let mockReconnectCallback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    service = new WalletRecoveryService({
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 500,
      backoffMultiplier: 2,
      connectionCheckIntervalMs: 1000,
    })
    mockReconnectCallback = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    service.destroy()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Recovery Attempts', () => {
    it('should successfully recover on first attempt', async () => {
      mockReconnectCallback.mockResolvedValueOnce(undefined)
      service.setReconnectCallback(mockReconnectCallback)

      const promise = service.attemptRecovery('pera')
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe(true)
      expect(mockReconnectCallback).toHaveBeenCalledTimes(1)
      expect(mockReconnectCallback).toHaveBeenCalledWith('pera')
    })

    it('should retry with exponential backoff on failure', async () => {
      mockReconnectCallback
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined)
      
      service.setReconnectCallback(mockReconnectCallback)

      const promise = service.attemptRecovery('defly')
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe(true)
      expect(mockReconnectCallback).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries exhausted', async () => {
      mockReconnectCallback.mockRejectedValue(new Error('Connection failed'))
      service.setReconnectCallback(mockReconnectCallback)

      const promise = service.attemptRecovery('exodus')
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe(false)
      expect(mockReconnectCallback).toHaveBeenCalledTimes(3) // maxRetries
    })

    it('should not start recovery if already in progress', async () => {
      mockReconnectCallback.mockImplementation(() => new Promise(() => {})) // Never resolves
      service.setReconnectCallback(mockReconnectCallback)

      const promise1 = service.attemptRecovery('pera')
      const promise2 = service.attemptRecovery('pera')

      await vi.runAllTimersAsync()

      expect(await promise2).toBe(false) // Second attempt should fail immediately
      expect(mockReconnectCallback).toHaveBeenCalledTimes(1) // Only first attempt called
    })

    it('should update recovery state during attempts', async () => {
      mockReconnectCallback.mockRejectedValue(new Error('Connection failed'))
      service.setReconnectCallback(mockReconnectCallback)

      service.attemptRecovery('kibisis')
      
      const state = service.getRecoveryState()
      expect(state.isRecovering).toBe(true)

      await vi.runAllTimersAsync()

      const finalState = service.getRecoveryState()
      expect(finalState.isRecovering).toBe(false)
      expect(finalState.attemptCount).toBe(3)
      expect(finalState.lastError).toBeInstanceOf(Error)
    })
  })

  describe('Health Checks', () => {
    it('should detect connection loss and trigger recovery', async () => {
      let isConnected = true
      const onConnectionLost = vi.fn()
      
      service.startHealthChecks(
        () => isConnected,
        onConnectionLost,
        () => 'pera'
      )

      // Simulate connection loss
      isConnected = false

      await vi.advanceTimersByTimeAsync(1000) // Trigger health check

      expect(onConnectionLost).toHaveBeenCalledWith('pera')
    })

    it('should not trigger recovery if still connected', async () => {
      const onConnectionLost = vi.fn()
      
      service.startHealthChecks(
        () => true, // Always connected
        onConnectionLost,
        () => 'pera'
      )

      await vi.advanceTimersByTimeAsync(5000) // Multiple checks

      expect(onConnectionLost).not.toHaveBeenCalled()
    })

    it('should not trigger recovery if already recovering', async () => {
      mockReconnectCallback.mockImplementation(() => new Promise(() => {})) // Never resolves
      service.setReconnectCallback(mockReconnectCallback)
      
      const onConnectionLost = vi.fn()
      service.startHealthChecks(
        () => false, // Disconnected
        onConnectionLost
      )

      // Start recovery
      service.attemptRecovery('pera')

      await vi.advanceTimersByTimeAsync(1000)

      expect(onConnectionLost).not.toHaveBeenCalled()
    })

    it('should stop health checks when requested', async () => {
      const onConnectionLost = vi.fn()
      
      service.startHealthChecks(
        () => false, // Disconnected
        onConnectionLost
      )

      service.stopHealthChecks()

      await vi.advanceTimersByTimeAsync(2000)

      expect(onConnectionLost).not.toHaveBeenCalled()
    })
  })

  describe('Configuration', () => {
    it('should respect max delay limit', () => {
      const service = new WalletRecoveryService({
        initialDelayMs: 100,
        maxDelayMs: 500,
        backoffMultiplier: 2,
        maxRetries: 10,
        connectionCheckIntervalMs: 1000,
      })

      // After many attempts, delay should cap at maxDelayMs
      const delay = service['calculateBackoffDelay'](10)
      expect(delay).toBeLessThanOrEqual(500)
    })
  })

  describe('Cleanup', () => {
    it('should clear state and callbacks on destroy', () => {
      service.setReconnectCallback(mockReconnectCallback)
      service.startHealthChecks(() => true, vi.fn())

      service.destroy()

      const state = service.getRecoveryState()
      expect(state.isRecovering).toBe(false)
      expect(state.attemptCount).toBe(0)
    })

    it('should reset recovery state', () => {
      const state = service.getRecoveryState()
      state.isRecovering = true
      state.attemptCount = 5
      state.lastError = new Error('Test')

      service.reset()

      const resetState = service.getRecoveryState()
      expect(resetState.isRecovering).toBe(false)
      expect(resetState.attemptCount).toBe(0)
      expect(resetState.lastError).toBeNull()
    })
  })
})
