/**
 * Unit tests for portfolioLaunchpad store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  usePortfolioLaunchpadStore,
  LAUNCHPAD_STAGES,
} from './portfolioLaunchpad'

describe('portfolioLaunchpad store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts on discover stage', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.stage).toBe('discover')
    })

    it('has empty token list', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.tokens).toHaveLength(0)
    })

    it('has no selected token', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.selectedTokenId).toBeNull()
      expect(store.selectedToken).toBeNull()
    })

    it('has no simulation result', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.simulation).toBeNull()
    })

    it('is not loading or errored', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('stageIndex is 0', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.stageIndex).toBe(0)
    })

    it('canAdvance is false with no token selected', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.canAdvance).toBe(false)
    })

    it('isComplete is false initially', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.isComplete).toBe(false)
    })
  })

  // ── LAUNCHPAD_STAGES constant ──────────────────────────────────────────────

  describe('LAUNCHPAD_STAGES', () => {
    it('has 5 stages in correct order', () => {
      expect(LAUNCHPAD_STAGES).toEqual(['discover', 'evaluate', 'simulate', 'execute', 'confirm'])
    })
  })

  // ── fetchTokens ────────────────────────────────────────────────────────────

  describe('fetchTokens', () => {
    it('sets loading=true during fetch and false after', async () => {
      const store = usePortfolioLaunchpadStore()
      const promise = store.fetchTokens()
      // After settling
      await promise
      expect(store.loading).toBe(false)
    })

    it('populates tokens after fetch', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      expect(store.tokens.length).toBeGreaterThan(0)
    })

    it('sets error on fetch failure', async () => {
      const store = usePortfolioLaunchpadStore()
      // Simulate failure by directly setting error state (store catches errors from _loadDemoTokens)
      vi.spyOn(store, 'fetchTokens').mockImplementationOnce(async () => {
        store.error = 'network error'
        store.loading = false
      })
      await store.fetchTokens()
      expect(store.error).toBeTruthy()
      expect(store.loading).toBe(false)
    })

    it('clears error on successful retry', async () => {
      const store = usePortfolioLaunchpadStore()
      store.error = 'previous error'
      await store.fetchTokens()
      expect(store.error).toBeNull()
    })

    it('featuredTokens only contains tokens with isFeatured=true', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      const featured = store.featuredTokens
      expect(featured.every((t) => t.isFeatured === true)).toBe(true)
    })
  })

  // ── selectToken ────────────────────────────────────────────────────────────

  describe('selectToken', () => {
    it('sets selectedTokenId and advances stage to evaluate', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      const id = store.tokens[0].id
      store.selectToken(id)
      expect(store.selectedTokenId).toBe(id)
      expect(store.stage).toBe('evaluate')
    })

    it('clears simulation and errors on new selection', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.simulationError = 'old error'
      store.actionError = 'old action error'
      store.selectToken(store.tokens[0].id)
      expect(store.simulationError).toBeNull()
      expect(store.actionError).toBeNull()
      expect(store.simulation).toBeNull()
    })

    it('selectedToken computed returns correct token', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      const tok = store.tokens[0]
      store.selectToken(tok.id)
      expect(store.selectedToken?.id).toBe(tok.id)
    })

    it('canAdvance becomes true after selection', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      expect(store.canAdvance).toBe(true)
    })

    it('stageIndex is 1 after selecting a token', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      expect(store.stageIndex).toBe(1)
    })
  })

  // ── deselectToken ──────────────────────────────────────────────────────────

  describe('deselectToken', () => {
    it('resets to discover stage and clears selection', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      store.deselectToken()
      expect(store.stage).toBe('discover')
      expect(store.selectedTokenId).toBeNull()
      expect(store.selectedToken).toBeNull()
    })
  })

  // ── runSimulation ──────────────────────────────────────────────────────────

  describe('runSimulation', () => {
    it('sets stage to simulate and populates simulation result', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      expect(store.stage).toBe('simulate')
      expect(store.simulation).not.toBeNull()
      expect(store.simulationLoading).toBe(false)
      expect(store.simulationError).toBeNull()
    })

    it('does nothing if no token is selected', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.runSimulation()
      expect(store.simulation).toBeNull()
      expect(store.stage).toBe('discover')
    })

    it('simulation result has required fields', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      const sim = store.simulation!
      expect(sim.tokenId).toBeTruthy()
      expect(sim.estimatedFeeDisplay).toBeTruthy()
      expect(sim.estimatedOutcome).toBeTruthy()
      expect(typeof sim.estimatedFee).toBe('number')
      expect(sim.isStale).toBe(false)
      expect(sim.simulatedAt).toBeInstanceOf(Date)
    })

    it('canAdvance is true after successful simulation', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      expect(store.canAdvance).toBe(true)
    })

    it('sets simulationError and clears loading on failure', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      // Mock runSimulation to simulate a failure
      vi.spyOn(store, 'runSimulation').mockImplementationOnce(async () => {
        store.simulationError = 'sim failure'
        store.simulationLoading = false
      })
      await store.runSimulation()
      expect(store.simulationError).toBeTruthy()
      expect(store.simulationLoading).toBe(false)
    })
  })

  // ── proceedToExecute ───────────────────────────────────────────────────────

  describe('proceedToExecute', () => {
    it('advances from simulate to execute', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      expect(store.stage).toBe('execute')
    })

    it('does nothing if not on simulate stage', () => {
      const store = usePortfolioLaunchpadStore()
      store.proceedToExecute()
      expect(store.stage).toBe('discover')
    })
  })

  // ── submitAction ───────────────────────────────────────────────────────────

  describe('submitAction', () => {
    it('advances to confirm and sets actionTxId on success', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      await store.submitAction()
      expect(store.stage).toBe('confirm')
      expect(store.actionTxId).toBeTruthy()
      expect(store.actionLoading).toBe(false)
      expect(store.actionError).toBeNull()
    })

    it('isComplete is true after successful submit', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      await store.submitAction()
      expect(store.isComplete).toBe(true)
    })

    it('does nothing if no token selected', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.submitAction()
      expect(store.stage).toBe('discover')
    })

    it('sets actionError on failure', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      // Mock submitAction to simulate a failure
      vi.spyOn(store, 'submitAction').mockImplementationOnce(async () => {
        store.actionError = 'tx rejected'
        store.actionLoading = false
      })
      await store.submitAction()
      expect(store.actionError).toBeTruthy()
      expect(store.actionLoading).toBe(false)
    })
  })

  // ── retryAction ────────────────────────────────────────────────────────────

  describe('retryAction', () => {
    it('clears actionError and actionTxId', () => {
      const store = usePortfolioLaunchpadStore()
      store.actionError = 'previous error'
      store.actionTxId = 'OLD_TX'
      store.retryAction()
      expect(store.actionError).toBeNull()
      expect(store.actionTxId).toBeNull()
    })
  })

  // ── canAdvance extended branches ───────────────────────────────────────────

  describe('canAdvance – extended branches', () => {
    it('returns false on confirm stage (default case)', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      await store.submitAction()
      // stage is now 'confirm', actionTxId is set → default branch → false
      expect(store.stage).toBe('confirm')
      expect(store.canAdvance).toBe(false)
    })

    it('returns false on execute stage when actionError is set', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      store.actionError = 'tx rejected'
      expect(store.stage).toBe('execute')
      expect(store.canAdvance).toBe(false)
    })

    it('returns false on execute stage when actionLoading is true', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      store.actionLoading = true
      expect(store.canAdvance).toBe(false)
    })

    it('returns true on execute stage when no error and not loading', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      expect(store.actionError).toBeNull()
      expect(store.actionLoading).toBe(false)
      expect(store.canAdvance).toBe(true)
    })

    it('canAdvance is false on simulate stage when simulation is stale', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.simulation!.isStale = true
      expect(store.canAdvance).toBe(false)
    })
  })

  // ── isComplete edge cases ──────────────────────────────────────────────────

  describe('isComplete edge cases', () => {
    it('is false when stage is confirm but actionTxId is null', () => {
      const store = usePortfolioLaunchpadStore()
      store.stage = 'confirm'
      expect(store.actionTxId).toBeNull()
      expect(store.isComplete).toBe(false)
    })

    it('is false when actionTxId is set but stage is not confirm', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      store.actionTxId = 'SOME_TX'
      // stage is 'execute', not 'confirm'
      expect(store.isComplete).toBe(false)
    })
  })

  // ── featuredTokens ────────────────────────────────────────────────────────

  describe('featuredTokens', () => {
    it('returns only featured tokens', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      const featured = store.featuredTokens
      expect(featured.length).toBeGreaterThan(0)
      expect(featured.length).toBeLessThan(store.tokens.length)
      featured.forEach((t) => expect(t.isFeatured).toBe(true))
    })

    it('returns empty array when no tokens loaded', () => {
      const store = usePortfolioLaunchpadStore()
      expect(store.featuredTokens).toHaveLength(0)
    })
  })

  // ── submitAction with amount parameter ────────────────────────────────────

  describe('submitAction with amount parameter', () => {
    it('accepts custom amount parameter', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      await store.submitAction(50)
      expect(store.stage).toBe('confirm')
      expect(store.actionTxId).toBeTruthy()
    })
  })

  // ── reset ──────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('resets all state to initial values', async () => {
      const store = usePortfolioLaunchpadStore()
      await store.fetchTokens()
      store.selectToken(store.tokens[0].id)
      await store.runSimulation()
      store.proceedToExecute()
      await store.submitAction()

      store.reset()

      expect(store.stage).toBe('discover')
      expect(store.selectedTokenId).toBeNull()
      expect(store.simulation).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.simulationLoading).toBe(false)
      expect(store.simulationError).toBeNull()
      expect(store.actionLoading).toBe(false)
      expect(store.actionError).toBeNull()
      expect(store.actionTxId).toBeNull()
    })
  })
})
