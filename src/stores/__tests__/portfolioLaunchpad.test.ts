/**
 * portfolioLaunchpad store tests
 *
 * Targets uncovered lines:
 *   122 — catch block in fetchTokens (both Error and non-Error arms)
 *   158 — catch block in runSimulation (both Error and non-Error arms)
 *   181 — catch block in submitAction (both Error and non-Error arms)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioLaunchpadStore } from '../portfolioLaunchpad'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mock Promise.resolve to reject once — causes the first `await Promise.resolve()` to throw. */
function rejectNextPromiseResolve(error: unknown) {
  vi.spyOn(Promise, 'resolve').mockImplementationOnce(
    () => Promise.reject(error) as unknown as Promise<undefined>,
  )
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── fetchTokens error paths (line 122) ──────────────────────────────────────

describe('fetchTokens — catch block', () => {
  it('sets error.message when _loadDemoTokens throws an Error instance (line 122, true branch)', async () => {
    const store = usePortfolioLaunchpadStore()
    rejectNextPromiseResolve(new Error('network timeout'))

    await store.fetchTokens()

    expect(store.error).toBe('network timeout')
    expect(store.loading).toBe(false)
  })

  it('sets fallback message when _loadDemoTokens throws a non-Error value (line 122, false branch)', async () => {
    const store = usePortfolioLaunchpadStore()
    rejectNextPromiseResolve('unexpected string error')

    await store.fetchTokens()

    expect(store.error).toBe('Failed to load token opportunities')
    expect(store.loading).toBe(false)
  })

  it('resets loading to false even after error (finally block)', async () => {
    const store = usePortfolioLaunchpadStore()
    rejectNextPromiseResolve(new Error('err'))

    expect(store.loading).toBe(false)
    await store.fetchTokens()
    expect(store.loading).toBe(false)
  })
})

// ─── runSimulation error paths (line 158) ────────────────────────────────────

describe('runSimulation — catch block', () => {
  async function storeWithToken() {
    const store = usePortfolioLaunchpadStore()
    // Load real demo tokens so selectedToken is non-null
    await store.fetchTokens()
    store.selectToken('usdc-algo')
    return store
  }

  it('sets simulationError.message when _simulateToken throws an Error (line 158, true branch)', async () => {
    const store = await storeWithToken()
    rejectNextPromiseResolve(new Error('simulation timed out'))

    await store.runSimulation()

    expect(store.simulationError).toBe('simulation timed out')
    expect(store.simulationLoading).toBe(false)
  })

  it('sets fallback message when _simulateToken throws a non-Error (line 158, false branch)', async () => {
    const store = await storeWithToken()
    rejectNextPromiseResolve(42)

    await store.runSimulation()

    expect(store.simulationError).toBe('Simulation failed')
    expect(store.simulationLoading).toBe(false)
  })

  it('does nothing when no token is selected', async () => {
    const store = usePortfolioLaunchpadStore()
    // selectedToken is null → early return
    await store.runSimulation()
    expect(store.simulationLoading).toBe(false)
    expect(store.simulationError).toBeNull()
  })
})

// ─── submitAction error paths (line 181) ─────────────────────────────────────

describe('submitAction — catch block', () => {
  async function storeReadyToSubmit() {
    const store = usePortfolioLaunchpadStore()
    await store.fetchTokens()
    store.selectToken('usdc-algo')
    return store
  }

  it('sets actionError.message when _submitTokenAction throws an Error (line 181, true branch)', async () => {
    const store = await storeReadyToSubmit()
    rejectNextPromiseResolve(new Error('backend unavailable'))

    await store.submitAction()

    expect(store.actionError).toBe('backend unavailable')
    expect(store.actionLoading).toBe(false)
    expect(store.actionTxId).toBeNull()
  })

  it('sets fallback message when _submitTokenAction throws a non-Error (line 181, false branch)', async () => {
    const store = await storeReadyToSubmit()
    rejectNextPromiseResolve({ code: 503 })

    await store.submitAction()

    expect(store.actionError).toBe('Action failed. Please try again.')
    expect(store.actionLoading).toBe(false)
  })

  it('does nothing when no token is selected', async () => {
    const store = usePortfolioLaunchpadStore()
    await store.submitAction()
    expect(store.actionLoading).toBe(false)
    expect(store.actionError).toBeNull()
  })
})

// ─── canAdvance — default/confirm stage (false branch) ───────────────────────

describe('canAdvance computed', () => {
  it('returns false when stage is confirm', async () => {
    const store = usePortfolioLaunchpadStore()
    await store.fetchTokens()
    store.selectToken('usdc-algo')
    await store.runSimulation()
    store.proceedToExecute()
    await store.submitAction() // advances to confirm stage
    expect(store.stage).toBe('confirm')
    expect(store.canAdvance).toBe(false)
  })
})

// ─── isComplete ───────────────────────────────────────────────────────────────

describe('isComplete', () => {
  it('returns true after successful submit on confirm stage', async () => {
    const store = usePortfolioLaunchpadStore()
    await store.fetchTokens()
    store.selectToken('usdc-algo')
    await store.runSimulation()
    store.proceedToExecute()
    await store.submitAction()
    expect(store.isComplete).toBe(true)
  })

  it('returns false in discover stage', () => {
    const store = usePortfolioLaunchpadStore()
    expect(store.isComplete).toBe(false)
  })
})
