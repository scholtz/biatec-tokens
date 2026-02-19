/**
 * Cockpit Timeline Utility Tests
 *
 * Tests for timestamp formatting, actor display normalisation,
 * sorting, filtering, and grouping helpers.
 */

import { describe, it, expect } from 'vitest'
import {
  formatTimelineTimestamp,
  formatTimelineTimestampFull,
  formatActorDisplay,
  getCategoryMeta,
  sortEntriesNewestFirst,
  filterEntriesWithinDays,
  groupEntriesByDate,
} from '../cockpitTimeline'
import type { TimelineEntry } from '../../types/lifecycleCockpit'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(id: string, tsOffset: number): TimelineEntry {
  return {
    id,
    category: 'transfer',
    title: `Entry ${id}`,
    impactSummary: 'Test impact',
    actor: 'alice@example.com',
    timestamp: new Date(Date.now() - tsOffset),
  }
}

// ─── formatTimelineTimestamp ──────────────────────────────────────────────────

describe('formatTimelineTimestamp', () => {
  const now = new Date('2024-06-15T12:00:00Z')

  it('returns "Just now" for < 60 seconds ago', () => {
    const ts = new Date(now.getTime() - 30_000)
    expect(formatTimelineTimestamp(ts, now)).toBe('Just now')
  })

  it('returns "1 minute ago" for exactly 1 minute ago', () => {
    const ts = new Date(now.getTime() - 60_000)
    expect(formatTimelineTimestamp(ts, now)).toBe('1 minute ago')
  })

  it('returns "3 minutes ago" for 3 minutes ago', () => {
    const ts = new Date(now.getTime() - 3 * 60_000)
    expect(formatTimelineTimestamp(ts, now)).toBe('3 minutes ago')
  })

  it('returns "1 hour ago" for exactly 1 hour ago', () => {
    const ts = new Date(now.getTime() - 60 * 60_000)
    expect(formatTimelineTimestamp(ts, now)).toBe('1 hour ago')
  })

  it('returns "5 hours ago" for 5 hours ago', () => {
    const ts = new Date(now.getTime() - 5 * 60 * 60_000)
    expect(formatTimelineTimestamp(ts, now)).toBe('5 hours ago')
  })

  it('returns "Yesterday" for exactly 1 day ago', () => {
    const ts = new Date(now.getTime() - 24 * 60 * 60_000)
    expect(formatTimelineTimestamp(ts, now)).toBe('Yesterday')
  })

  it('returns a date string for older dates', () => {
    const ts = new Date(now.getTime() - 7 * 24 * 60 * 60_000)
    const result = formatTimelineTimestamp(ts, now)
    // Should be something like "Jun 8" — not a relative time
    expect(result).not.toContain('minute')
    expect(result).not.toContain('hour')
    expect(result).not.toContain('Just now')
    expect(result).not.toContain('Yesterday')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ─── formatTimelineTimestampFull ──────────────────────────────────────────────

describe('formatTimelineTimestampFull', () => {
  it('returns a non-empty string', () => {
    const result = formatTimelineTimestampFull(new Date('2024-06-15T12:00:00Z'))
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes year, month, day', () => {
    const result = formatTimelineTimestampFull(new Date('2024-06-15T12:00:00Z'))
    expect(result).toContain('2024')
    expect(result).toMatch(/Jun|June/)
  })
})

// ─── formatActorDisplay ───────────────────────────────────────────────────────

describe('formatActorDisplay', () => {
  it('truncates long blockchain addresses', () => {
    const addr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN' // 40 chars
    const result = formatActorDisplay(addr)
    expect(result).toBe('ABCD…KLMN')
  })

  it('shows local part for email addresses', () => {
    expect(formatActorDisplay('alice@example.com')).toBe('alice')
  })

  it('returns System for empty string', () => {
    expect(formatActorDisplay('')).toBe('System')
  })

  it('returns System for whitespace-only string', () => {
    expect(formatActorDisplay('   ')).toBe('System')
  })

  it('returns System for "system" (case-insensitive)', () => {
    expect(formatActorDisplay('system')).toBe('System')
    expect(formatActorDisplay('SYSTEM')).toBe('System')
  })

  it('returns value as-is for regular short names', () => {
    expect(formatActorDisplay('Alice')).toBe('Alice')
  })

  it('returns value as-is for medium-length strings', () => {
    expect(formatActorDisplay('service-account-1')).toBe('service-account-1')
  })
})

// ─── getCategoryMeta ──────────────────────────────────────────────────────────

describe('getCategoryMeta', () => {
  it('returns meta for mint category', () => {
    const meta = getCategoryMeta('mint')
    expect(meta.icon).toContain('pi')
    expect(meta.label).toBe('Mint')
    expect(meta.colour).toBeTruthy()
  })

  it('returns meta for burn category', () => {
    const meta = getCategoryMeta('burn')
    expect(meta.label).toBe('Burn')
  })

  it('returns meta for compliance category', () => {
    const meta = getCategoryMeta('compliance')
    expect(meta.label).toBe('Compliance')
  })

  it('returns meta for all categories', () => {
    const categories = [
      'mint', 'burn', 'transfer', 'compliance',
      'configuration', 'deployment', 'role_change', 'metadata_update',
    ] as const
    for (const cat of categories) {
      const meta = getCategoryMeta(cat)
      expect(meta.icon).toBeTruthy()
      expect(meta.label).toBeTruthy()
      expect(meta.colour).toBeTruthy()
    }
  })
})

// ─── sortEntriesNewestFirst ───────────────────────────────────────────────────

describe('sortEntriesNewestFirst', () => {
  it('returns entries sorted newest-first', () => {
    const older = makeEntry('a', 60_000 * 30)  // 30 min ago
    const newer = makeEntry('b', 60_000 * 5)   // 5 min ago
    const oldest = makeEntry('c', 60_000 * 60) // 60 min ago

    const sorted = sortEntriesNewestFirst([older, newest, oldest])
    // newest is b (5 min), then a (30 min), then c (60 min)
    expect(sorted[0].id).toBe('b')
    expect(sorted[1].id).toBe('a')
    expect(sorted[2].id).toBe('c')
  })

  it('does not mutate the original array', () => {
    const entries = [makeEntry('x', 1000), makeEntry('y', 500)]
    const original = [...entries]
    sortEntriesNewestFirst(entries)
    expect(entries[0].id).toBe(original[0].id)
  })

  it('handles empty array', () => {
    expect(sortEntriesNewestFirst([])).toEqual([])
  })
})

// Fix: "newest" in the test was used before assignment — reference `newer` as `newest`
const newest = makeEntry('b', 60_000 * 5)

// ─── filterEntriesWithinDays ──────────────────────────────────────────────────

describe('filterEntriesWithinDays', () => {
  it('returns only entries within the specified number of days', () => {
    const now = new Date()
    const today = makeEntry('today', 60_000) // 1 min ago
    const sevenDaysAgo: TimelineEntry = {
      ...makeEntry('week', 0),
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60_000),
    }
    const tenDaysAgo: TimelineEntry = {
      ...makeEntry('old', 0),
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60_000),
    }

    const result = filterEntriesWithinDays([today, sevenDaysAgo, tenDaysAgo], 8, now)
    expect(result.map((e) => e.id)).toContain('today')
    expect(result.map((e) => e.id)).toContain('week')
    expect(result.map((e) => e.id)).not.toContain('old')
  })

  it('returns empty array when no entries match', () => {
    const now = new Date()
    const old: TimelineEntry = {
      ...makeEntry('old', 0),
      timestamp: new Date(now.getTime() - 90 * 24 * 60 * 60_000),
    }
    expect(filterEntriesWithinDays([old], 30, now)).toHaveLength(0)
  })
})

// ─── groupEntriesByDate ───────────────────────────────────────────────────────

describe('groupEntriesByDate', () => {
  it('groups entries by calendar date newest-first', () => {
    const now = new Date()

    // Two entries today, one yesterday
    const t1 = { ...makeEntry('t1', 1000), timestamp: new Date(now.getTime() - 1000) }
    const t2 = { ...makeEntry('t2', 2000), timestamp: new Date(now.getTime() - 2000) }
    const y1: TimelineEntry = {
      ...makeEntry('y1', 0),
      timestamp: new Date(now.getTime() - 25 * 60 * 60_000), // ~25h ago = yesterday
    }

    const groups = groupEntriesByDate([t1, t2, y1])

    expect(groups.length).toBeGreaterThanOrEqual(2)
    expect(groups[0].dateLabel).toBe('Today')
    expect(groups[0].entries).toHaveLength(2)
  })

  it('handles empty input', () => {
    expect(groupEntriesByDate([])).toHaveLength(0)
  })

  it('labels the most recent group as Today', () => {
    const entry = makeEntry('now', 60_000)
    const groups = groupEntriesByDate([entry])
    expect(groups[0].dateLabel).toBe('Today')
  })
})
