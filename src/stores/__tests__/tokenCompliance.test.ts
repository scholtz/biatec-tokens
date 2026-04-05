/**
 * tokenCompliance store tests
 *
 * Targets uncovered branches:
 *   Line 53  — `if (parsed[tokenId].lastUpdated)` false branch (null lastUpdated in stored JSON)
 *   Lines 97–111 — false branch of `if (item)` in toggleChecklistItem (non-existent itemId)
 *                 AND `total > 0 ? ... : 0` false branch in getCompletionPercentage (empty checklist)
 *   Line 145 — `if (complianceData.value[tokenId])` false branch in resetTokenCompliance
 *               (tokenId not yet initialised)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTokenComplianceStore } from '../tokenCompliance'

const STORAGE_KEY = 'biatec_token_compliance'

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

// ─── loadFromStorage — null lastUpdated (line 53 false branch) ────────────────

describe('loadFromStorage — null lastUpdated in stored JSON', () => {
  it('handles a token whose stored lastUpdated is null without throwing (line 53 false branch)', () => {
    // Seed localStorage with a token where lastUpdated is null (falsy)
    const stored = {
      'token-null-date': {
        tokenId: 'token-null-date',
        checklist: [],
        lastUpdated: null,
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    // Store is initialised via loadFromStorage during creation
    const store = useTokenComplianceStore()

    // The token should be loaded even though its lastUpdated was null
    expect(store.complianceData['token-null-date']).toBeDefined()
    // lastUpdated should remain null (not converted to Date)
    expect(store.complianceData['token-null-date'].lastUpdated).toBeNull()
  })

  it('handles a token whose stored lastUpdated is missing (undefined → falsy)', () => {
    // lastUpdated omitted entirely from stored JSON
    const stored = {
      'token-no-date': {
        tokenId: 'token-no-date',
        checklist: [],
        // lastUpdated intentionally absent
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const store = useTokenComplianceStore()
    expect(store.complianceData['token-no-date']).toBeDefined()
  })

  it('loads nothing when localStorage key is absent (null raw)', () => {
    // No data in localStorage → complianceData stays empty
    const store = useTokenComplianceStore()
    expect(Object.keys(store.complianceData)).toHaveLength(0)
  })

  it('survives corrupt JSON in localStorage without throwing', () => {
    localStorage.setItem(STORAGE_KEY, 'NOT_VALID_JSON{{{')
    expect(() => useTokenComplianceStore()).not.toThrow()
  })
})

// ─── toggleChecklistItem — item not found (lines 97–102 false branch) ─────────

describe('toggleChecklistItem — non-existent itemId', () => {
  it('does nothing when itemId is not in the checklist (line 97 false branch)', () => {
    const store = useTokenComplianceStore()
    const before = store.getTokenCompliance('tok-a')
    const snapshotBefore = before.checklist.map((i) => ({ ...i }))

    store.toggleChecklistItem('tok-a', 'NONEXISTENT_ITEM_ID')

    const after = store.complianceData['tok-a']
    // Checklist must be unchanged
    after.checklist.forEach((item, idx) => {
      expect(item.completed).toBe(snapshotBefore[idx].completed)
    })
  })

  it('does not change lastUpdated when item is not found', () => {
    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('tok-b')
    const originalDate = compliance.lastUpdated.toISOString()

    store.toggleChecklistItem('tok-b', 'DOES_NOT_EXIST')

    expect(store.complianceData['tok-b'].lastUpdated.toISOString()).toBe(originalDate)
  })
})

// ─── getCompletionPercentage — empty checklist (line 111 false branch) ─────────

describe('getCompletionPercentage — empty checklist', () => {
  it('returns 0 when checklist has no items (total === 0, ternary false branch)', () => {
    const store = useTokenComplianceStore()

    // Manually inject a token with an empty checklist to hit the `total > 0 ? ... : 0` false branch
    store.complianceData['empty-tok'] = {
      tokenId: 'empty-tok',
      checklist: [],
      lastUpdated: new Date(),
    }

    const pct = store.getCompletionPercentage('empty-tok')
    expect(pct).toBe(0)
  })
})

// ─── resetTokenCompliance — token not initialised (line 145 false branch) ────

describe('resetTokenCompliance — tokenId not in complianceData', () => {
  it('does nothing when the tokenId has never been initialised (line 145 false branch)', () => {
    const store = useTokenComplianceStore()

    // 'ghost-token' has never been set → complianceData['ghost-token'] is undefined
    expect(store.complianceData['ghost-token']).toBeUndefined()

    // Should not throw and should leave complianceData unchanged
    expect(() => store.resetTokenCompliance('ghost-token')).not.toThrow()
    expect(store.complianceData['ghost-token']).toBeUndefined()
  })
})

// ─── getReadinessStatus — all thresholds ──────────────────────────────────────

describe('getReadinessStatus', () => {
  it('returns Ready when percentage >= 80', () => {
    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('tok-ready')
    // Mark 4 of 5 items complete → 80%
    compliance.checklist.slice(0, 4).forEach((item) => {
      store.toggleChecklistItem('tok-ready', item.id)
    })
    expect(store.getReadinessStatus('tok-ready')).toBe('Ready')
  })

  it('returns At Risk when 40 <= percentage < 80', () => {
    const store = useTokenComplianceStore()
    const compliance = store.getTokenCompliance('tok-risk')
    // Mark 2 of 5 → 40%
    compliance.checklist.slice(0, 2).forEach((item) => {
      store.toggleChecklistItem('tok-risk', item.id)
    })
    expect(store.getReadinessStatus('tok-risk')).toBe('At Risk')
  })

  it('returns Incomplete when percentage < 40', () => {
    const store = useTokenComplianceStore()
    // 0 of 5 → 0%
    expect(store.getReadinessStatus('tok-incomplete')).toBe('Incomplete')
  })
})

// ─── getReadinessBadgeVariant ─────────────────────────────────────────────────

describe('getReadinessBadgeVariant', () => {
  it('returns success for Ready', () => {
    const store = useTokenComplianceStore()
    expect(store.getReadinessBadgeVariant('Ready')).toBe('success')
  })

  it('returns warning for At Risk', () => {
    const store = useTokenComplianceStore()
    expect(store.getReadinessBadgeVariant('At Risk')).toBe('warning')
  })

  it('returns error for Incomplete', () => {
    const store = useTokenComplianceStore()
    expect(store.getReadinessBadgeVariant('Incomplete')).toBe('error')
  })
})

// ─── deleteTokenCompliance ────────────────────────────────────────────────────

describe('deleteTokenCompliance', () => {
  it('removes the token from complianceData', () => {
    const store = useTokenComplianceStore()
    store.getTokenCompliance('tok-del')
    expect(store.complianceData['tok-del']).toBeDefined()

    store.deleteTokenCompliance('tok-del')
    expect(store.complianceData['tok-del']).toBeUndefined()
  })

  it('is a no-op for a non-existent token', () => {
    const store = useTokenComplianceStore()
    expect(() => store.deleteTokenCompliance('never-existed')).not.toThrow()
  })
})
