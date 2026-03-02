import { describe, it, expect } from 'vitest'
import {
  detectContextChange,
  isOperationBlocked,
  requiresUserAcknowledgement,
  getContextChangeToastText,
  buildContextSnapshot,
  type WalletContextSnapshot,
} from '../walletNetworkChangeHandler'

// ─── Helper: build a snapshot ─────────────────────────────────────────────────

function snap(
  address: string | null,
  network: string | null,
  sessionId?: string | null,
): WalletContextSnapshot {
  return { accountAddress: address, network, sessionId: sessionId ?? null }
}

// ─── no_change ────────────────────────────────────────────────────────────────

describe('detectContextChange — no_change', () => {
  it('returns no_change when both snapshots are identical', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR1', 'algorand'))
    expect(result.kind).toBe('no_change')
    expect(result.impact).toBe('none')
    expect(result.shouldPauseCurrentOperation).toBe(false)
    expect(result.requiresReauth).toBe(false)
  })

  it('returns no_change when address casing differs (case-insensitive)', () => {
    const result = detectContextChange(snap('addr1', 'algorand'), snap('ADDR1', 'ALGORAND'))
    expect(result.kind).toBe('no_change')
  })

  it('no_change result has null action label and route', () => {
    const result = detectContextChange(snap('A', 'algorand'), snap('A', 'algorand'))
    expect(result.actionLabel).toBeNull()
    expect(result.actionRoute).toBeNull()
  })

  it('returns no_change when both snapshots have null address and network', () => {
    const result = detectContextChange(snap(null, null), snap(null, null))
    expect(result.kind).toBe('no_change')
  })
})

// ─── session_cleared ──────────────────────────────────────────────────────────

describe('detectContextChange — session_cleared', () => {
  it('detects session cleared when address goes from non-null to null', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap(null, null))
    expect(result.kind).toBe('session_cleared')
    expect(result.impact).toBe('blocking')
    expect(result.shouldPauseCurrentOperation).toBe(true)
    expect(result.requiresReauth).toBe(true)
  })

  it('session_cleared provides sign-in action', () => {
    const result = detectContextChange(snap('ADDR1', 'ethereum'), snap(null, null))
    expect(result.actionLabel).toMatch(/sign in/i)
    expect(result.actionRoute).toBe('/')
  })

  it('session_cleared title is user-friendly', () => {
    const result = detectContextChange(snap('ADDR1', 'voi'), snap(null, null))
    expect(result.title).toMatch(/session ended/i)
  })
})

// ─── session_restored ─────────────────────────────────────────────────────────

describe('detectContextChange — session_restored', () => {
  it('detects session restored when address goes from null to non-null', () => {
    const result = detectContextChange(snap(null, null), snap('ADDR1', 'algorand'))
    expect(result.kind).toBe('session_restored')
    expect(result.impact).toBe('informational')
    expect(result.shouldPauseCurrentOperation).toBe(false)
    expect(result.requiresReauth).toBe(false)
  })

  it('session_restored has null action label (no action required)', () => {
    const result = detectContextChange(snap(null, null), snap('ADDR1', 'algorand'))
    expect(result.actionLabel).toBeNull()
  })

  it('session_restored message contains shortened address', () => {
    const result = detectContextChange(snap(null, null), snap('ABCDEFGHIJKLMNOP', 'algorand'))
    expect(result.message).toContain('ABCDEF')
  })

  it('session_restored message handles short addresses without truncation', () => {
    const result = detectContextChange(snap(null, null), snap('SHORT', 'algorand'))
    expect(result.message).toContain('SHORT')
  })
})

// ─── account_changed ──────────────────────────────────────────────────────────

describe('detectContextChange — account_changed', () => {
  it('detects account change when address differs on same network', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR2', 'algorand'))
    expect(result.kind).toBe('account_changed')
    expect(result.impact).toBe('blocking')
  })

  it('account_changed pauses current operation', () => {
    const result = detectContextChange(snap('ADDR1', 'ethereum'), snap('ADDR2', 'ethereum'))
    expect(result.shouldPauseCurrentOperation).toBe(true)
  })

  it('account_changed does not require full re-auth (different from session_cleared)', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR2', 'algorand'))
    expect(result.requiresReauth).toBe(false)
  })

  it('account_changed provides continue action', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR2', 'algorand'))
    expect(result.actionLabel).toBeTruthy()
  })

  it('account_changed message includes new address (truncated)', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('NEWADDRESSXYZ', 'algorand'))
    expect(result.message).toContain('NEWADD')
  })
})

// ─── network_changed ──────────────────────────────────────────────────────────

describe('detectContextChange — network_changed', () => {
  it('detects network change when network differs for same account', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR1', 'ethereum'))
    expect(result.kind).toBe('network_changed')
    expect(result.impact).toBe('warning')
  })

  it('network_changed does not pause operation (warning only)', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR1', 'ethereum'))
    expect(result.shouldPauseCurrentOperation).toBe(false)
  })

  it('network_changed does not require re-auth', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR1', 'voi'))
    expect(result.requiresReauth).toBe(false)
  })

  it('network_changed message references both old and new network', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR1', 'ethereum'))
    expect(result.message).toContain('algorand')
    expect(result.message).toContain('ethereum')
  })

  it('network_changed routes to guided launch for configuration check', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR1', 'base'))
    expect(result.actionRoute).toBe('/launch/guided')
  })
})

// ─── account_and_network_changed ─────────────────────────────────────────────

describe('detectContextChange — account_and_network_changed', () => {
  it('detects both address and network change', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR2', 'ethereum'))
    expect(result.kind).toBe('account_and_network_changed')
    expect(result.impact).toBe('blocking')
  })

  it('blocks operation when both change', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR2', 'ethereum'))
    expect(result.shouldPauseCurrentOperation).toBe(true)
    expect(result.requiresReauth).toBe(true)
  })

  it('routes to settings for review', () => {
    const result = detectContextChange(snap('ADDR1', 'algorand'), snap('ADDR2', 'ethereum'))
    expect(result.actionRoute).toBe('/settings')
  })
})

// ─── Prev/next snapshots preserved in result ─────────────────────────────────

describe('detectContextChange — snapshot preservation', () => {
  it('preserves prev and next snapshots in result', () => {
    const prev = snap('ADDR1', 'algorand')
    const next = snap('ADDR2', 'algorand')
    const result = detectContextChange(prev, next)
    expect(result.prev).toEqual(prev)
    expect(result.next).toEqual(next)
  })
})

// ─── isOperationBlocked ───────────────────────────────────────────────────────

describe('isOperationBlocked', () => {
  it('returns true for session_cleared result', () => {
    const result = detectContextChange(snap('ADDR1', 'algo'), snap(null, null))
    expect(isOperationBlocked(result)).toBe(true)
  })

  it('returns true for account_changed result', () => {
    const result = detectContextChange(snap('ADDR1', 'algo'), snap('ADDR2', 'algo'))
    expect(isOperationBlocked(result)).toBe(true)
  })

  it('returns false for network_changed (warning only)', () => {
    const result = detectContextChange(snap('ADDR1', 'algo'), snap('ADDR1', 'eth'))
    expect(isOperationBlocked(result)).toBe(false)
  })

  it('returns false for no_change', () => {
    const result = detectContextChange(snap('A', 'algo'), snap('A', 'algo'))
    expect(isOperationBlocked(result)).toBe(false)
  })
})

// ─── requiresUserAcknowledgement ─────────────────────────────────────────────

describe('requiresUserAcknowledgement', () => {
  it('returns true for blocking impact', () => {
    const result = detectContextChange(snap('A1', 'algo'), snap(null, null))
    expect(requiresUserAcknowledgement(result)).toBe(true)
  })

  it('returns true when requiresReauth is true', () => {
    const result = detectContextChange(snap('A1', 'algo'), snap('A2', 'eth'))
    expect(requiresUserAcknowledgement(result)).toBe(true)
  })

  it('returns false for informational impact', () => {
    const result = detectContextChange(snap(null, null), snap('ADDR1', 'algo'))
    expect(requiresUserAcknowledgement(result)).toBe(false)
  })

  it('returns false for no_change', () => {
    const result = detectContextChange(snap('A', 'algo'), snap('A', 'algo'))
    expect(requiresUserAcknowledgement(result)).toBe(false)
  })
})

// ─── getContextChangeToastText ────────────────────────────────────────────────

describe('getContextChangeToastText', () => {
  it('returns empty string for no_change', () => {
    const result = detectContextChange(snap('A', 'algo'), snap('A', 'algo'))
    expect(getContextChangeToastText(result)).toBe('')
  })

  it('returns non-empty string for account_changed', () => {
    const result = detectContextChange(snap('A1', 'algo'), snap('A2', 'algo'))
    expect(getContextChangeToastText(result).length).toBeGreaterThan(0)
  })

  it('returns non-empty string for network_changed', () => {
    const result = detectContextChange(snap('A1', 'algo'), snap('A1', 'eth'))
    expect(getContextChangeToastText(result).length).toBeGreaterThan(0)
  })

  it('returns non-empty string for session_cleared', () => {
    const result = detectContextChange(snap('A1', 'algo'), snap(null, null))
    expect(getContextChangeToastText(result).length).toBeGreaterThan(0)
  })
})

// ─── buildContextSnapshot ─────────────────────────────────────────────────────

describe('buildContextSnapshot', () => {
  it('returns null snapshot for null user', () => {
    const snapshot = buildContextSnapshot(null)
    expect(snapshot.accountAddress).toBeNull()
    expect(snapshot.network).toBeNull()
    expect(snapshot.sessionId).toBeNull()
  })

  it('maps user address and network correctly', () => {
    const snapshot = buildContextSnapshot({ address: 'MY_ADDR', network: 'algorand' })
    expect(snapshot.accountAddress).toBe('MY_ADDR')
    expect(snapshot.network).toBe('algorand')
  })

  it('defaults to null for missing address', () => {
    const snapshot = buildContextSnapshot({ network: 'voi' })
    expect(snapshot.accountAddress).toBeNull()
    expect(snapshot.network).toBe('voi')
  })

  it('defaults to null for missing network', () => {
    const snapshot = buildContextSnapshot({ address: 'ADDR1' })
    expect(snapshot.network).toBeNull()
  })

  it('maps sessionId when provided', () => {
    const snapshot = buildContextSnapshot({ address: 'A', network: 'algo', sessionId: 'sess-123' })
    expect(snapshot.sessionId).toBe('sess-123')
  })

  it('defaults sessionId to null when not provided', () => {
    const snapshot = buildContextSnapshot({ address: 'A', network: 'algo' })
    expect(snapshot.sessionId).toBeNull()
  })
})
