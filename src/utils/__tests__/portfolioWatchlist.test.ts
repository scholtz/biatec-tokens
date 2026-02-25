/**
 * portfolioWatchlist utility tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  WATCHLIST_STORAGE_KEY,
  loadWatchlist,
  saveWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  restoreWatchlistFromStorage,
} from '../portfolioWatchlist'
import type { WatchlistEntry } from '../../../types/portfolioIntelligence'

// ─── localStorage mock ────────────────────────────────────────────────────────

const storageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

beforeEach(() => {
  storageMock.clear()
  vi.stubGlobal('localStorage', storageMock)
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const entry = (overrides: Partial<WatchlistEntry> = {}): WatchlistEntry => ({
  assetId: 'usdc-algo',
  symbol: 'USDC',
  name: 'USD Coin',
  network: 'Algorand',
  addedAt: new Date('2024-01-01'),
  ...overrides,
})

// ─── addToWatchlist ───────────────────────────────────────────────────────────

describe('addToWatchlist', () => {
  it('adds a new entry', () => {
    const result = addToWatchlist([], { assetId: 'a', symbol: 'A', name: 'A Token', network: 'Algorand' })
    expect(result).toHaveLength(1)
    expect(result[0].assetId).toBe('a')
  })

  it('assigns addedAt date', () => {
    const result = addToWatchlist([], { assetId: 'a', symbol: 'A', name: 'A Token', network: 'Algorand' })
    expect(result[0].addedAt).toBeInstanceOf(Date)
  })

  it('deduplicates by assetId + network', () => {
    const initial = [entry()]
    const result = addToWatchlist(initial, { assetId: 'usdc-algo', symbol: 'USDC', name: 'USD Coin', network: 'Algorand' })
    expect(result).toHaveLength(1)
  })

  it('allows same assetId on different network', () => {
    const initial = [entry({ network: 'Algorand' })]
    const result = addToWatchlist(initial, { assetId: 'usdc-algo', symbol: 'USDC', name: 'USD Coin', network: 'Ethereum' })
    expect(result).toHaveLength(2)
  })

  it('preserves existing entries', () => {
    const initial = [entry()]
    const result = addToWatchlist(initial, { assetId: 'btc', symbol: 'BTC', name: 'Bitcoin', network: 'Ethereum' })
    expect(result).toHaveLength(2)
    expect(result[0].assetId).toBe('usdc-algo')
  })
})

// ─── removeFromWatchlist ──────────────────────────────────────────────────────

describe('removeFromWatchlist', () => {
  it('removes matching entry', () => {
    const initial = [entry(), entry({ assetId: 'btc', network: 'Ethereum' })]
    const result = removeFromWatchlist(initial, 'btc', 'Ethereum')
    expect(result).toHaveLength(1)
    expect(result[0].assetId).toBe('usdc-algo')
  })

  it('no-op for non-existent entry', () => {
    const initial = [entry()]
    const result = removeFromWatchlist(initial, 'nonexistent', 'Algorand')
    expect(result).toHaveLength(1)
  })

  it('requires both assetId and network to match', () => {
    const initial = [entry({ assetId: 'usdc-algo', network: 'Algorand' })]
    const result = removeFromWatchlist(initial, 'usdc-algo', 'Ethereum')
    expect(result).toHaveLength(1)
  })
})

// ─── isInWatchlist ────────────────────────────────────────────────────────────

describe('isInWatchlist', () => {
  it('returns true when entry exists', () => {
    expect(isInWatchlist([entry()], 'usdc-algo', 'Algorand')).toBe(true)
  })

  it('returns false when entry does not exist', () => {
    expect(isInWatchlist([entry()], 'nonexistent', 'Algorand')).toBe(false)
  })

  it('returns false for wrong network', () => {
    expect(isInWatchlist([entry()], 'usdc-algo', 'Ethereum')).toBe(false)
  })

  it('returns false for empty list', () => {
    expect(isInWatchlist([], 'usdc-algo', 'Algorand')).toBe(false)
  })
})

// ─── loadWatchlist / saveWatchlist ────────────────────────────────────────────

describe('loadWatchlist', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadWatchlist()).toEqual([])
  })

  it('round-trips through localStorage', () => {
    const entries = [entry()]
    saveWatchlist(entries)
    const loaded = loadWatchlist()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].assetId).toBe('usdc-algo')
  })

  it('handles corrupt JSON gracefully', () => {
    storageMock.setItem(WATCHLIST_STORAGE_KEY, 'NOT_JSON')
    expect(() => loadWatchlist()).not.toThrow()
    expect(loadWatchlist()).toEqual([])
  })

  it('parses addedAt as Date', () => {
    saveWatchlist([entry()])
    const loaded = loadWatchlist()
    expect(loaded[0].addedAt).toBeInstanceOf(Date)
  })
})

describe('saveWatchlist', () => {
  it('saves to localStorage under correct key', () => {
    saveWatchlist([entry()])
    expect(storageMock.getItem(WATCHLIST_STORAGE_KEY)).toBeTruthy()
  })

  it('overwrites previous save', () => {
    saveWatchlist([entry()])
    saveWatchlist([entry({ assetId: 'new' })])
    const loaded = loadWatchlist()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].assetId).toBe('new')
  })
})

// ─── restoreWatchlistFromStorage ──────────────────────────────────────────────

describe('restoreWatchlistFromStorage', () => {
  it('returns empty array when nothing stored', () => {
    expect(restoreWatchlistFromStorage()).toEqual([])
  })

  it('returns stored entries', () => {
    saveWatchlist([entry()])
    const result = restoreWatchlistFromStorage()
    expect(result).toHaveLength(1)
  })
})
