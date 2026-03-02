import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  getCheckpointAge,
  isCheckpointExpired,
  getResumeMessage,
  isCheckpointResumable,
  type ActivationCheckpoint,
} from '../walletActivationCheckpoint'

// ── helpers ────────────────────────────────────────────────────────────────

function makeCheckpoint(overrides: Partial<ActivationCheckpoint> = {}): ActivationCheckpoint {
  return {
    journeyId: 'test_journey',
    step: 2,
    totalSteps: 4,
    completedSteps: [1],
    metadata: {},
    savedAt: new Date().toISOString(),
    version: 1,
    ...overrides,
  }
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('saveCheckpoint', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the saved checkpoint object', () => {
    const cp = saveCheckpoint('j1', 2, 4, [1])
    expect(cp.journeyId).toBe('j1')
    expect(cp.step).toBe(2)
    expect(cp.totalSteps).toBe(4)
    expect(cp.completedSteps).toEqual([1])
  })

  it('stores checkpoint in localStorage', () => {
    saveCheckpoint('j1', 2, 4, [1])
    const raw = localStorage.getItem('wallet_activation_checkpoint_j1')
    expect(raw).not.toBeNull()
  })

  it('sets version to 1', () => {
    const cp = saveCheckpoint('j1', 1, 4, [])
    expect(cp.version).toBe(1)
  })

  it('sets savedAt to current time (ISO string)', () => {
    const before = new Date()
    const cp = saveCheckpoint('j1', 1, 4, [])
    const after = new Date()
    const savedAt = new Date(cp.savedAt)
    expect(savedAt >= before).toBe(true)
    expect(savedAt <= after).toBe(true)
  })

  it('stores metadata', () => {
    const cp = saveCheckpoint('j1', 1, 4, [], { userId: 'u1' })
    expect(cp.metadata).toEqual({ userId: 'u1' })
  })

  it('makes a copy of completedSteps (mutation safety)', () => {
    const arr = [1, 2]
    const cp = saveCheckpoint('j1', 3, 4, arr)
    arr.push(3)
    expect(cp.completedSteps).toEqual([1, 2])
  })
})

describe('loadCheckpoint', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no checkpoint stored', () => {
    const result = loadCheckpoint('nonexistent')
    expect(result.checkpoint).toBeNull()
    expect(result.isExpired).toBe(false)
    expect(result.ageMinutes).toBe(0)
  })

  it('returns the stored checkpoint', () => {
    saveCheckpoint('j1', 2, 4, [1])
    const result = loadCheckpoint('j1')
    expect(result.checkpoint).not.toBeNull()
    expect(result.checkpoint!.step).toBe(2)
  })

  it('returns isExpired false for fresh checkpoint', () => {
    saveCheckpoint('j1', 2, 4, [1])
    const result = loadCheckpoint('j1')
    expect(result.isExpired).toBe(false)
  })

  it('returns isExpired true for old checkpoint exceeding maxAgeMinutes', () => {
    const oldDate = new Date(Date.now() - 61 * 60 * 1000) // 61 minutes ago
    const cp = makeCheckpoint({ journeyId: 'j1', savedAt: oldDate.toISOString() })
    localStorage.setItem('wallet_activation_checkpoint_j1', JSON.stringify(cp))
    const result = loadCheckpoint('j1', 60)
    expect(result.isExpired).toBe(true)
  })

  it('returns null for corrupted JSON', () => {
    localStorage.setItem('wallet_activation_checkpoint_bad', 'not-json')
    const result = loadCheckpoint('bad')
    expect(result.checkpoint).toBeNull()
  })

  it('uses 24-hour default expiry', () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000)
    const cp = makeCheckpoint({ journeyId: 'j1', savedAt: oneDayAgo.toISOString() })
    localStorage.setItem('wallet_activation_checkpoint_j1', JSON.stringify(cp))
    const result = loadCheckpoint('j1')
    expect(result.isExpired).toBe(true)
  })
})

describe('clearCheckpoint', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes checkpoint from localStorage', () => {
    saveCheckpoint('j1', 2, 4, [1])
    expect(localStorage.getItem('wallet_activation_checkpoint_j1')).not.toBeNull()
    clearCheckpoint('j1')
    expect(localStorage.getItem('wallet_activation_checkpoint_j1')).toBeNull()
  })

  it('does not throw when checkpoint does not exist', () => {
    expect(() => clearCheckpoint('nonexistent')).not.toThrow()
  })
})

describe('getCheckpointAge', () => {
  it('returns 0 for checkpoint saved now', () => {
    const cp = makeCheckpoint({ savedAt: new Date().toISOString() })
    expect(getCheckpointAge(cp)).toBe(0)
  })

  it('returns approximately correct minutes for older checkpoints', () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: thirtyMinutesAgo.toISOString() })
    const age = getCheckpointAge(cp)
    expect(age).toBeGreaterThanOrEqual(29)
    expect(age).toBeLessThanOrEqual(31)
  })
})

describe('isCheckpointExpired', () => {
  it('returns false for fresh checkpoint', () => {
    const cp = makeCheckpoint()
    expect(isCheckpointExpired(cp)).toBe(false)
  })

  it('returns true for checkpoint older than maxAgeMinutes', () => {
    const old = new Date(Date.now() - 61 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: old.toISOString() })
    expect(isCheckpointExpired(cp, 60)).toBe(true)
  })

  it('returns false for checkpoint exactly at maxAgeMinutes boundary', () => {
    const boundary = new Date(Date.now() - 59 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: boundary.toISOString() })
    expect(isCheckpointExpired(cp, 60)).toBe(false)
  })
})

describe('getResumeMessage', () => {
  it('returns step info for fresh checkpoint (< 1 min)', () => {
    const cp = makeCheckpoint({ step: 2, totalSteps: 4 })
    const msg = getResumeMessage(cp)
    expect(msg).toContain('step 2')
    expect(msg).toContain('4')
  })

  it('returns minutes message for checkpoint 5 minutes old', () => {
    const fiveAgo = new Date(Date.now() - 5 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: fiveAgo.toISOString(), step: 3, totalSteps: 4 })
    const msg = getResumeMessage(cp)
    expect(msg).toMatch(/5 minutes? ago/i)
    expect(msg).toContain('step 3')
  })

  it('returns hours message for checkpoint 2 hours old', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: twoHoursAgo.toISOString(), step: 1, totalSteps: 4 })
    const msg = getResumeMessage(cp)
    expect(msg).toMatch(/2 hours? ago/i)
  })

  it('returns days message for checkpoint 2 days old', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: twoDaysAgo.toISOString() })
    const msg = getResumeMessage(cp)
    expect(msg).toMatch(/2 days? ago/i)
  })

  it('uses singular for 1 minute', () => {
    const oneMinAgo = new Date(Date.now() - 1 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: oneMinAgo.toISOString() })
    const msg = getResumeMessage(cp)
    expect(msg).toMatch(/1 minute ago/i)
  })

  it('uses singular for 1 hour', () => {
    const oneHourAgo = new Date(Date.now() - 61 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: oneHourAgo.toISOString() })
    const msg = getResumeMessage(cp)
    expect(msg).toMatch(/1 hour ago/i)
  })

  it('uses singular for 1 day', () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000)
    const cp = makeCheckpoint({ savedAt: oneDayAgo.toISOString() })
    const msg = getResumeMessage(cp)
    expect(msg).toMatch(/1 day ago/i)
  })
})

describe('isCheckpointResumable', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns false when checkpoint is null', () => {
    expect(isCheckpointResumable({ checkpoint: null, isExpired: false, ageMinutes: 0 })).toBe(false)
  })

  it('returns false when checkpoint is expired', () => {
    const cp = makeCheckpoint({ step: 2 })
    expect(isCheckpointResumable({ checkpoint: cp, isExpired: true, ageMinutes: 1500 })).toBe(false)
  })

  it('returns false when checkpoint is on step 1', () => {
    const cp = makeCheckpoint({ step: 1 })
    expect(isCheckpointResumable({ checkpoint: cp, isExpired: false, ageMinutes: 0 })).toBe(false)
  })

  it('returns true for valid, non-expired, step > 1 checkpoint', () => {
    const cp = makeCheckpoint({ step: 2 })
    expect(isCheckpointResumable({ checkpoint: cp, isExpired: false, ageMinutes: 5 })).toBe(true)
  })

  it('round-trip: save then load is resumable from step 3', () => {
    saveCheckpoint('rt_journey', 3, 4, [1, 2])
    const result = loadCheckpoint('rt_journey')
    expect(isCheckpointResumable(result)).toBe(true)
  })
})
