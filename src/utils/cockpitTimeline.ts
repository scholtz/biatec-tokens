/**
 * Cockpit Timeline Utilities
 *
 * Transformation helpers for timeline entries: timestamp formatting,
 * actor display normalisation, and category icon/colour mapping.
 * All functions are pure and deterministic.
 */

import type { TimelineEntry, TimelineEventCategory } from '../types/lifecycleCockpit'

// ─── Timestamp formatting ─────────────────────────────────────────────────────

/**
 * Returns a relative human-readable label for a timestamp, e.g.
 * "Just now", "3 minutes ago", "2 hours ago", "Yesterday", "Jan 15".
 */
export function formatTimelineTimestamp(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'

  // For older dates use a short date string
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

/**
 * Returns a full ISO-like display string for tooltips / accessibility labels.
 */
export function formatTimelineTimestampFull(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// ─── Actor normalisation ──────────────────────────────────────────────────────

/**
 * Produces a display-safe actor label.
 *
 * - Blockchain addresses (≥ 40 chars) are truncated: "ABCD…WXYZ"
 * - Email addresses show only the local part:          "alice"
 * - "system" / empty strings map to "System"
 * - Otherwise the raw value is returned as-is
 */
export function formatActorDisplay(actor: string): string {
  if (!actor || actor.trim() === '') return 'System'
  const trimmed = actor.trim()

  // Blockchain address heuristic
  if (trimmed.length >= 40 && /^[A-Z2-7]+$/i.test(trimmed)) {
    return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`
  }

  // Email address: show only local part
  if (trimmed.includes('@')) {
    return trimmed.split('@')[0]
  }

  if (trimmed.toLowerCase() === 'system') return 'System'

  return trimmed
}

// ─── Category metadata ────────────────────────────────────────────────────────

export interface CategoryMeta {
  /** PrimeVue icon class */
  icon: string
  /** Tailwind colour class for the icon */
  colour: string
  /** Human-readable label */
  label: string
}

const CATEGORY_META: Record<TimelineEventCategory, CategoryMeta> = {
  mint: { icon: 'pi pi-plus-circle', colour: 'text-green-400', label: 'Mint' },
  burn: { icon: 'pi pi-minus-circle', colour: 'text-red-400', label: 'Burn' },
  transfer: { icon: 'pi pi-arrow-right-arrow-left', colour: 'text-blue-400', label: 'Transfer' },
  compliance: { icon: 'pi pi-shield', colour: 'text-purple-400', label: 'Compliance' },
  configuration: { icon: 'pi pi-cog', colour: 'text-yellow-400', label: 'Configuration' },
  deployment: { icon: 'pi pi-cloud-upload', colour: 'text-teal-400', label: 'Deployment' },
  role_change: { icon: 'pi pi-user-edit', colour: 'text-orange-400', label: 'Role Change' },
  metadata_update: { icon: 'pi pi-file-edit', colour: 'text-indigo-400', label: 'Metadata Update' },
}

export function getCategoryMeta(category: TimelineEventCategory): CategoryMeta {
  return CATEGORY_META[category]
}

// ─── Sorting / filtering ──────────────────────────────────────────────────────

/**
 * Sorts timeline entries newest-first.
 */
export function sortEntriesNewestFirst(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Filters entries to those within the last N days.
 */
export function filterEntriesWithinDays(
  entries: TimelineEntry[],
  days: number,
  now: Date = new Date(),
): TimelineEntry[] {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return entries.filter((e) => e.timestamp >= cutoff)
}

/**
 * Groups entries by calendar date (YYYY-MM-DD) newest-first.
 */
export function groupEntriesByDate(
  entries: TimelineEntry[],
): Array<{ dateLabel: string; entries: TimelineEntry[] }> {
  const sorted = sortEntriesNewestFirst(entries)
  const groups: Map<string, TimelineEntry[]> = new Map()

  for (const entry of sorted) {
    const key = entry.timestamp.toISOString().slice(0, 10) // "YYYY-MM-DD"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  }

  return Array.from(groups.entries()).map(([key, dayEntries]) => {
    const date = new Date(key + 'T12:00:00Z') // noon to avoid TZ edge cases
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)

    let dateLabel: string
    if (key === today) dateLabel = 'Today'
    else if (key === yesterday) dateLabel = 'Yesterday'
    else {
      dateLabel = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
    }

    return { dateLabel, entries: dayEntries }
  })
}
