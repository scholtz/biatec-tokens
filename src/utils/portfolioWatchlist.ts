/**
 * Portfolio Watchlist Utilities
 *
 * Persistence helpers for the user's pinned asset watchlist.
 * Data is stored in localStorage under a versioned key to allow
 * future schema migrations without silent corruption.
 */

import type { WatchlistEntry } from '../types/portfolioIntelligence'

export const WATCHLIST_STORAGE_KEY = 'portfolio_watchlist_v1'
export const PORTFOLIO_ONBOARDING_COMPLETED_KEY = 'portfolio_onboarding_completed_v1'

// ─── Persistence ──────────────────────────────────────────────────────────────

export function loadWatchlist(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    return parsed.map((entry) => ({
      assetId: String(entry.assetId ?? ''),
      symbol: String(entry.symbol ?? ''),
      name: String(entry.name ?? ''),
      network: String(entry.network ?? ''),
      addedAt: new Date(String(entry.addedAt ?? new Date().toISOString())),
    }))
  } catch {
    return []
  }
}

export function saveWatchlist(entries: WatchlistEntry[]): void {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(entries))
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

export function addToWatchlist(
  entries: WatchlistEntry[],
  asset: Omit<WatchlistEntry, 'addedAt'>,
): WatchlistEntry[] {
  // Deduplicate by assetId + network
  const alreadyExists = entries.some(
    (e) => e.assetId === asset.assetId && e.network === asset.network,
  )
  if (alreadyExists) return entries

  return [...entries, { ...asset, addedAt: new Date() }]
}

export function removeFromWatchlist(
  entries: WatchlistEntry[],
  assetId: string,
  network: string,
): WatchlistEntry[] {
  return entries.filter((e) => !(e.assetId === assetId && e.network === network))
}

export function isInWatchlist(
  entries: WatchlistEntry[],
  assetId: string,
  network: string,
): boolean {
  return entries.some((e) => e.assetId === assetId && e.network === network)
}

/** Alias for loadWatchlist with explicit error handling. */
export function restoreWatchlistFromStorage(): WatchlistEntry[] {
  try {
    return loadWatchlist()
  } catch {
    return []
  }
}
