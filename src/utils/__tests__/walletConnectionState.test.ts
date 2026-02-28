/**
 * Unit tests for walletConnectionState
 */

import { describe, it, expect } from 'vitest'
import type { AlgorandUser } from '../../stores/auth'
import {
  deriveConnectionState,
  buildReconnectingState,
  buildErrorState,
  buildConnectingState,
  classifyConnectionError,
  isNetworkSupported,
  networksMatch,
  SUPPORTED_NETWORKS,
} from '../walletConnectionState'

// ─── helpers ─────────────────────────────────────────────────────────────────

const mockUser: AlgorandUser = {
  address: 'ALGO_TEST_ADDRESS_1234',
  email: 'test@example.com',
  provisioningStatus: 'active',
  canDeploy: true,
}

// ─── deriveConnectionState ────────────────────────────────────────────────────

describe('deriveConnectionState', () => {
  it('returns disconnected when not authenticated', () => {
    const state = deriveConnectionState(false, null)
    expect(state.phase).toBe('disconnected')
    expect(state.isOperational).toBe(false)
    expect(state.canReconnect).toBe(true)
    expect(state.isBusy).toBe(false)
  })

  it('returns disconnected when authenticated flag false even with user object', () => {
    const state = deriveConnectionState(false, mockUser)
    expect(state.phase).toBe('disconnected')
  })

  it('returns disconnected when user is null even if authenticated flag true', () => {
    const state = deriveConnectionState(true, null)
    expect(state.phase).toBe('disconnected')
  })

  it('returns restoring when isRestoring is true', () => {
    const state = deriveConnectionState(false, null, true)
    expect(state.phase).toBe('restoring')
    expect(state.isBusy).toBe(true)
    expect(state.canReconnect).toBe(false)
  })

  it('returns connected when authenticated and no network mismatch', () => {
    const state = deriveConnectionState(true, mockUser)
    expect(state.phase).toBe('connected')
    expect(state.isOperational).toBe(true)
    expect(state.isBusy).toBe(false)
  })

  it('returns connected when active and expected network are the same', () => {
    const state = deriveConnectionState(true, mockUser, false, 'algorand-mainnet', 'algorand-mainnet')
    expect(state.phase).toBe('connected')
  })

  it('returns mismatch when active network differs from expected', () => {
    const state = deriveConnectionState(true, mockUser, false, 'algorand-mainnet', 'algorand-testnet')
    expect(state.phase).toBe('mismatch')
    expect(state.isOperational).toBe(false)
    expect(state.canReconnect).toBe(true)
    expect(state.networkMismatch).toBeDefined()
    expect(state.networkMismatch?.lastKnownNetwork).toBe('algorand-mainnet')
    expect(state.networkMismatch?.currentNetwork).toBe('algorand-testnet')
  })

  it('mismatch resolution message mentions the expected network', () => {
    const state = deriveConnectionState(true, mockUser, false, 'voi', 'ethereum')
    expect(state.networkMismatch?.resolution).toContain('Ethereum')
  })

  it('returns connected when only one of active/expected networks is provided', () => {
    // No expected network → no mismatch possible
    const state = deriveConnectionState(true, mockUser, false, 'voi', undefined)
    expect(state.phase).toBe('connected')
  })

  it('has meaningful phaseLabel for each phase', () => {
    const disconnected = deriveConnectionState(false, null)
    expect(disconnected.phaseLabel).toBe('Not connected')

    const connected = deriveConnectionState(true, mockUser)
    expect(connected.phaseLabel).toBe('Connected')
  })

  it('provides actionLabel for disconnected phase', () => {
    const state = deriveConnectionState(false, null)
    expect(state.actionLabel).toBe('Sign in')
  })

  it('provides no actionLabel for connected phase', () => {
    const state = deriveConnectionState(true, mockUser)
    expect(state.actionLabel).toBeNull()
  })

  it('provides actionLabel for mismatch phase', () => {
    const state = deriveConnectionState(true, mockUser, false, 'voi', 'ethereum')
    expect(state.actionLabel).toBe('Switch network')
  })
})

// ─── buildReconnectingState ───────────────────────────────────────────────────

describe('buildReconnectingState', () => {
  it('returns reconnecting phase', () => {
    const state = buildReconnectingState()
    expect(state.phase).toBe('reconnecting')
    expect(state.isBusy).toBe(true)
    expect(state.isOperational).toBe(false)
    expect(state.canReconnect).toBe(false)
  })
})

// ─── buildErrorState ─────────────────────────────────────────────────────────

describe('buildErrorState', () => {
  it('returns error phase with error details', () => {
    const error = {
      code: 'network_error' as const,
      message: 'No internet',
      recoverable: true,
      recoveryAction: 'Retry',
    }
    const state = buildErrorState(error)
    expect(state.phase).toBe('error')
    expect(state.errorDetails).toEqual(error)
    expect(state.canReconnect).toBe(true)
  })
})

// ─── buildConnectingState ─────────────────────────────────────────────────────

describe('buildConnectingState', () => {
  it('returns connecting phase', () => {
    const state = buildConnectingState()
    expect(state.phase).toBe('connecting')
    expect(state.isBusy).toBe(true)
  })
})

// ─── classifyConnectionError ─────────────────────────────────────────────────

describe('classifyConnectionError', () => {
  it('classifies session expiry', () => {
    const info = classifyConnectionError(new Error('Session expired'))
    expect(info.code).toBe('session_expired')
    expect(info.recoverable).toBe(false)
  })

  it('classifies auth failure', () => {
    const info = classifyConnectionError(new Error('auth failed: invalid credentials'))
    expect(info.code).toBe('auth_failed')
    expect(info.recoverable).toBe(false)
  })

  it('classifies provisioning error', () => {
    const info = classifyConnectionError(new Error('provisioning not complete'))
    expect(info.code).toBe('provisioning_error')
    expect(info.recoverable).toBe(true)
  })

  it('classifies network/fetch error', () => {
    const info = classifyConnectionError(new Error('network timeout'))
    expect(info.code).toBe('network_error')
    expect(info.recoverable).toBe(true)
  })

  it('classifies unknown error as generic', () => {
    const info = classifyConnectionError(new Error('something totally weird'))
    expect(info.code).toBe('unknown')
    expect(info.recoverable).toBe(true)
  })

  it('handles non-Error objects', () => {
    const info = classifyConnectionError('plain string error')
    expect(info.code).toBe('unknown')
  })

  it('handles null/undefined', () => {
    const info = classifyConnectionError(null)
    expect(info.code).toBe('unknown')
  })

  it('provides a non-empty recovery action for all codes', () => {
    const errors = [
      new Error('session expired'),
      new Error('auth failed'),
      new Error('provisioning error'),
      new Error('network error'),
      new Error('random'),
    ]
    for (const e of errors) {
      const info = classifyConnectionError(e)
      expect(info.recoveryAction.length).toBeGreaterThan(0)
    }
  })
})

// ─── isNetworkSupported ───────────────────────────────────────────────────────

describe('isNetworkSupported', () => {
  it('recognises all supported networks', () => {
    for (const network of SUPPORTED_NETWORKS) {
      expect(isNetworkSupported(network)).toBe(true)
    }
  })

  it('normalises underscores to dashes', () => {
    expect(isNetworkSupported('algorand_mainnet')).toBe(true)
  })

  it('normalises uppercase', () => {
    expect(isNetworkSupported('Ethereum')).toBe(true)
  })

  it('returns false for unknown network', () => {
    expect(isNetworkSupported('solana')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isNetworkSupported('')).toBe(false)
  })
})

// ─── networksMatch ────────────────────────────────────────────────────────────

describe('networksMatch', () => {
  it('matches identical network ids', () => {
    expect(networksMatch('algorand-mainnet', 'algorand-mainnet')).toBe(true)
  })

  it('matches despite underscore vs dash difference', () => {
    expect(networksMatch('algorand_mainnet', 'algorand-mainnet')).toBe(true)
  })

  it('matches despite casing difference', () => {
    expect(networksMatch('VOI', 'voi')).toBe(true)
  })

  it('does not match different networks', () => {
    expect(networksMatch('voi', 'ethereum')).toBe(false)
  })

  it('does not match partial names', () => {
    expect(networksMatch('algo', 'algorand-mainnet')).toBe(false)
  })
})
