/**
 * Unit tests for launchpadFunnel.ts
 *
 * Verifies that each tracking helper:
 * - Emits exactly once per unique key (idempotency)
 * - Does not throw when analyticsService is unavailable
 * - Accepts all required payload fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  LAUNCHPAD_EVENTS,
  resetLaunchpadDispatchGuard,
  trackLaunchpadViewed,
  trackTokenSelected,
  trackSimulationCompleted,
  trackWalletConnected,
  trackActionSubmitted,
  trackActionConfirmed,
  trackActionFailed,
} from '../launchpadFunnel'

// Mock analyticsService so we don't make real network calls
vi.mock('../../services/analytics', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  },
}))

import { analyticsService } from '../../services/analytics'

function mockTrack() {
  return vi.mocked(analyticsService.trackEvent)
}

describe('launchpadFunnel – LAUNCHPAD_EVENTS constants', () => {
  it('exports all required event name constants', () => {
    expect(LAUNCHPAD_EVENTS.LAUNCHPAD_VIEWED).toBe('launchpad_viewed')
    expect(LAUNCHPAD_EVENTS.TOKEN_SELECTED).toBe('token_selected')
    expect(LAUNCHPAD_EVENTS.SIMULATION_COMPLETED).toBe('simulation_completed')
    expect(LAUNCHPAD_EVENTS.WALLET_CONNECTED).toBe('wallet_connected')
    expect(LAUNCHPAD_EVENTS.ACTION_SUBMITTED).toBe('action_submitted')
    expect(LAUNCHPAD_EVENTS.ACTION_CONFIRMED).toBe('action_confirmed')
    expect(LAUNCHPAD_EVENTS.ACTION_FAILED).toBe('action_failed')
  })
})

describe('launchpadFunnel – resetLaunchpadDispatchGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLaunchpadDispatchGuard()
  })

  it('allows re-emission of events after reset', () => {
    trackLaunchpadViewed({ tokenCount: 3 })
    expect(mockTrack()).toHaveBeenCalledTimes(1)

    // Second call should be deduped
    trackLaunchpadViewed({ tokenCount: 3 })
    expect(mockTrack()).toHaveBeenCalledTimes(1)

    // After reset, emission should fire again
    resetLaunchpadDispatchGuard()
    trackLaunchpadViewed({ tokenCount: 3 })
    expect(mockTrack()).toHaveBeenCalledTimes(2)
  })
})

describe('launchpadFunnel – trackLaunchpadViewed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLaunchpadDispatchGuard()
  })

  it('calls analyticsService.trackEvent with correct event name', () => {
    trackLaunchpadViewed({ tokenCount: 5 })
    expect(mockTrack()).toHaveBeenCalledTimes(1)
    const call = mockTrack().mock.calls[0][0]
    expect(call.event).toBe('launchpad_viewed')
    expect(call.category).toBe('Launchpad')
  })

  it('includes tokenCount in metadata', () => {
    trackLaunchpadViewed({ tokenCount: 7, source: 'navbar' })
    const call = mockTrack().mock.calls[0][0]
    expect(call.tokenCount).toBe(7)
    expect(call.source).toBe('navbar')
  })

  it('fires only once per session (idempotent)', () => {
    trackLaunchpadViewed({ tokenCount: 1 })
    trackLaunchpadViewed({ tokenCount: 2 })
    trackLaunchpadViewed({ tokenCount: 3 })
    expect(mockTrack()).toHaveBeenCalledTimes(1)
  })
})

describe('launchpadFunnel – trackTokenSelected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLaunchpadDispatchGuard()
  })

  it('emits token_selected event', () => {
    trackTokenSelected({ tokenId: 'usdc-algo', tokenSymbol: 'USDC', network: 'Algorand Mainnet', stage: 'evaluate' })
    expect(mockTrack()).toHaveBeenCalledTimes(1)
    expect(mockTrack().mock.calls[0][0].event).toBe('token_selected')
  })

  it('is idempotent per tokenId', () => {
    trackTokenSelected({ tokenId: 'usdc-algo', tokenSymbol: 'USDC', network: 'Algorand Mainnet', stage: 'evaluate' })
    trackTokenSelected({ tokenId: 'usdc-algo', tokenSymbol: 'USDC', network: 'Algorand Mainnet', stage: 'evaluate' })
    expect(mockTrack()).toHaveBeenCalledTimes(1)
  })

  it('fires separately for different tokenIds', () => {
    trackTokenSelected({ tokenId: 'usdc-algo', tokenSymbol: 'USDC', network: 'Algorand Mainnet', stage: 'evaluate' })
    trackTokenSelected({ tokenId: 'biatec', tokenSymbol: 'BIATEC', network: 'Algorand Mainnet', stage: 'evaluate' })
    expect(mockTrack()).toHaveBeenCalledTimes(2)
  })

  it('includes all payload fields in metadata', () => {
    trackTokenSelected({ tokenId: 'tok1', tokenSymbol: 'TOK', network: 'VOI', stage: 'evaluate' })
    const call = mockTrack().mock.calls[0][0]
    expect(call.tokenId).toBe('tok1')
    expect(call.tokenSymbol).toBe('TOK')
    expect(call.network).toBe('VOI')
    expect(call.stage).toBe('evaluate')
  })
})

describe('launchpadFunnel – trackSimulationCompleted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLaunchpadDispatchGuard()
  })

  it('emits simulation_completed event', () => {
    trackSimulationCompleted({ tokenId: 'tok1', estimatedFee: 0.001, estimatedOutcome: 'ok', durationMs: 120 })
    expect(mockTrack().mock.calls[0][0].event).toBe('simulation_completed')
  })

  it('is idempotent per tokenId', () => {
    trackSimulationCompleted({ tokenId: 'tok1', estimatedFee: 0.001, estimatedOutcome: 'ok', durationMs: 120 })
    trackSimulationCompleted({ tokenId: 'tok1', estimatedFee: 0.001, estimatedOutcome: 'ok', durationMs: 130 })
    expect(mockTrack()).toHaveBeenCalledTimes(1)
  })
})

describe('launchpadFunnel – trackWalletConnected', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLaunchpadDispatchGuard()
  })

  it('emits wallet_connected event', () => {
    trackWalletConnected({ tokenId: 'tok1', walletType: 'pera', chainId: 'mainnet' })
    expect(mockTrack().mock.calls[0][0].event).toBe('wallet_connected')
  })

  it('works without optional fields', () => {
    expect(() => trackWalletConnected({ tokenId: 'tok1' })).not.toThrow()
  })
})

describe('launchpadFunnel – trackActionSubmitted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLaunchpadDispatchGuard()
  })

  it('emits action_submitted event', () => {
    trackActionSubmitted({ tokenId: 'tok1', actionType: 'acquire', amount: 100 })
    expect(mockTrack().mock.calls[0][0].event).toBe('action_submitted')
  })

  it('is idempotent per tokenId', () => {
    trackActionSubmitted({ tokenId: 'tok1', actionType: 'acquire' })
    trackActionSubmitted({ tokenId: 'tok1', actionType: 'acquire' })
    expect(mockTrack()).toHaveBeenCalledTimes(1)
  })
})

describe('launchpadFunnel – trackActionConfirmed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLaunchpadDispatchGuard()
  })

  it('emits action_confirmed event', () => {
    trackActionConfirmed({ tokenId: 'tok1', txId: 'TX123', durationMs: 2000 })
    expect(mockTrack().mock.calls[0][0].event).toBe('action_confirmed')
  })

  it('is idempotent per txId', () => {
    trackActionConfirmed({ tokenId: 'tok1', txId: 'TX123', durationMs: 2000 })
    trackActionConfirmed({ tokenId: 'tok1', txId: 'TX123', durationMs: 2000 })
    expect(mockTrack()).toHaveBeenCalledTimes(1)
  })

  it('fires for different txIds', () => {
    trackActionConfirmed({ tokenId: 'tok1', txId: 'TX1', durationMs: 100 })
    trackActionConfirmed({ tokenId: 'tok1', txId: 'TX2', durationMs: 100 })
    expect(mockTrack()).toHaveBeenCalledTimes(2)
  })
})

describe('launchpadFunnel – trackActionFailed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLaunchpadDispatchGuard()
  })

  it('emits action_failed event', () => {
    trackActionFailed({ tokenId: 'tok1', reason: 'insufficient balance', code: 'ERR_BALANCE' })
    expect(mockTrack().mock.calls[0][0].event).toBe('action_failed')
  })

  it('works without optional code field', () => {
    expect(() => trackActionFailed({ tokenId: 'tok1', reason: 'wallet rejected' })).not.toThrow()
  })

  it('is idempotent per tokenId+reason', () => {
    trackActionFailed({ tokenId: 'tok1', reason: 'chain mismatch' })
    trackActionFailed({ tokenId: 'tok1', reason: 'chain mismatch' })
    expect(mockTrack()).toHaveBeenCalledTimes(1)
  })

  it('fires for different reasons', () => {
    trackActionFailed({ tokenId: 'tok1', reason: 'insufficient balance' })
    trackActionFailed({ tokenId: 'tok1', reason: 'chain mismatch' })
    expect(mockTrack()).toHaveBeenCalledTimes(2)
  })
})
