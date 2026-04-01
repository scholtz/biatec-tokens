import { describe, it, expect } from 'vitest'
import {
  classifyFreshness,
  deriveFeedHealth,
  buildFeedHealthMessage,
  deriveQueueSummary,
  filterEvents,
  sortEventsByPriority,
  groupTimelineByDate,
  formatRelativeTime,
  deriveNotificationCenterState,
  severityRank,
  severityBadgeClass,
  feedHealthBannerClass,
  categoryIconName,
  SEVERITY_LABELS,
  CATEGORY_LABELS,
  FEED_HEALTH_LABELS,
  FRESHNESS_LABELS,
  DEFAULT_FILTERS,
  NOTIFICATION_CENTER_TEST_IDS,
  MOCK_EVENTS_HEALTHY,
  MOCK_EVENTS_MIXED,
  MOCK_EVENTS_DEGRADED,
  MOCK_TIMELINE_ENTRIES,
  MOCK_REFRESHED_AT,
  buildMockEventsMixed,
  buildMockTimelineEntries,
  type ComplianceEvent,
  type NotificationFilters,
  type EventSeverity,
  type FeedHealth,
  type ComplianceEventCategory,
  type FreshnessBucket,
} from '../complianceNotificationCenter'

// Fixed reference point for deterministic tests
const NOW = new Date('2026-03-27T15:00:00.000Z')

describe('complianceNotificationCenter', () => {
  // =========================================================================
  // Label Maps
  // =========================================================================
  describe('label maps', () => {
    it('SEVERITY_LABELS covers all severities', () => {
      const severities: EventSeverity[] = [
        'blocked',
        'action_needed',
        'waiting_on_provider',
        'review_complete',
        'informational',
      ]
      for (const s of severities) {
        expect(SEVERITY_LABELS[s]).toBeTruthy()
      }
    })

    it('CATEGORY_LABELS covers all categories', () => {
      const categories: ComplianceEventCategory[] = [
        'investor_onboarding',
        'kyc_review',
        'aml_screening',
        'sanctions_escalation',
        'evidence_export',
        'release_evidence',
        'compliance_proof',
        'webhook_delivery',
        'system',
      ]
      for (const c of categories) {
        expect(CATEGORY_LABELS[c]).toBeTruthy()
      }
    })

    it('FEED_HEALTH_LABELS covers all health states', () => {
      const states: FeedHealth[] = ['healthy', 'stale', 'degraded', 'unavailable']
      for (const s of states) {
        expect(FEED_HEALTH_LABELS[s]).toBeTruthy()
      }
    })

    it('FRESHNESS_LABELS covers all freshness buckets', () => {
      const buckets: FreshnessBucket[] = ['fresh', 'recent', 'aging', 'stale', 'critical']
      for (const b of buckets) {
        expect(FRESHNESS_LABELS[b]).toBeTruthy()
      }
    })
  })

  // =========================================================================
  // severityRank
  // =========================================================================
  describe('severityRank', () => {
    it('blocked is most urgent (rank 0)', () => {
      expect(severityRank('blocked')).toBe(0)
    })

    it('informational is least urgent', () => {
      expect(severityRank('informational')).toBe(4)
    })

    it('blocked < action_needed < waiting < review_complete < informational', () => {
      expect(severityRank('blocked')).toBeLessThan(severityRank('action_needed'))
      expect(severityRank('action_needed')).toBeLessThan(severityRank('waiting_on_provider'))
      expect(severityRank('waiting_on_provider')).toBeLessThan(severityRank('review_complete'))
      expect(severityRank('review_complete')).toBeLessThan(severityRank('informational'))
    })

    it('returns SEVERITY_ORDER.length for unknown severity (fail-closed fallback)', () => {
      // Unknown severities get the worst rank so they sort to the bottom
      expect(severityRank('unknown_severity' as EventSeverity)).toBe(5)
    })
  })

  // =========================================================================
  // classifyFreshness
  // =========================================================================
  describe('classifyFreshness', () => {
    it('returns critical for null timestamp (fail-closed)', () => {
      expect(classifyFreshness(null, NOW)).toBe('critical')
    })

    it('returns critical for undefined timestamp (fail-closed)', () => {
      expect(classifyFreshness(undefined, NOW)).toBe('critical')
    })

    it('returns critical for invalid timestamp (fail-closed)', () => {
      expect(classifyFreshness('not-a-date', NOW)).toBe('critical')
    })

    it('returns fresh for timestamp < 1 hour ago', () => {
      const thirtyMinAgo = new Date(NOW.getTime() - 30 * 60_000).toISOString()
      expect(classifyFreshness(thirtyMinAgo, NOW)).toBe('fresh')
    })

    it('returns recent for timestamp 1-24 hours ago', () => {
      const sixHoursAgo = new Date(NOW.getTime() - 6 * 3_600_000).toISOString()
      expect(classifyFreshness(sixHoursAgo, NOW)).toBe('recent')
    })

    it('returns aging for timestamp 1-3 days ago', () => {
      const twoDaysAgo = new Date(NOW.getTime() - 2 * 86_400_000).toISOString()
      expect(classifyFreshness(twoDaysAgo, NOW)).toBe('aging')
    })

    it('returns stale for timestamp 3-7 days ago', () => {
      const fiveDaysAgo = new Date(NOW.getTime() - 5 * 86_400_000).toISOString()
      expect(classifyFreshness(fiveDaysAgo, NOW)).toBe('stale')
    })

    it('returns critical for timestamp > 7 days ago', () => {
      const tenDaysAgo = new Date(NOW.getTime() - 10 * 86_400_000).toISOString()
      expect(classifyFreshness(tenDaysAgo, NOW)).toBe('critical')
    })

    it('returns fresh for future timestamp', () => {
      const future = new Date(NOW.getTime() + 60_000).toISOString()
      expect(classifyFreshness(future, NOW)).toBe('fresh')
    })
  })

  // =========================================================================
  // deriveFeedHealth
  // =========================================================================
  describe('deriveFeedHealth', () => {
    it('returns unavailable for null (fail-closed)', () => {
      expect(deriveFeedHealth(null, NOW)).toBe('unavailable')
    })

    it('returns unavailable for undefined (fail-closed)', () => {
      expect(deriveFeedHealth(undefined, NOW)).toBe('unavailable')
    })

    it('returns unavailable for invalid date (fail-closed)', () => {
      expect(deriveFeedHealth('bad-date', NOW)).toBe('unavailable')
    })

    it('returns healthy for < 5 minutes old', () => {
      const twoMinAgo = new Date(NOW.getTime() - 2 * 60_000).toISOString()
      expect(deriveFeedHealth(twoMinAgo, NOW)).toBe('healthy')
    })

    it('returns stale for 5-30 minutes old', () => {
      const tenMinAgo = new Date(NOW.getTime() - 10 * 60_000).toISOString()
      expect(deriveFeedHealth(tenMinAgo, NOW)).toBe('stale')
    })

    it('returns degraded for 30min - 2hr old', () => {
      const oneHourAgo = new Date(NOW.getTime() - 60 * 60_000).toISOString()
      expect(deriveFeedHealth(oneHourAgo, NOW)).toBe('degraded')
    })

    it('returns unavailable for > 2 hours old', () => {
      const threeHoursAgo = new Date(NOW.getTime() - 3 * 3_600_000).toISOString()
      expect(deriveFeedHealth(threeHoursAgo, NOW)).toBe('unavailable')
    })

    it('returns healthy for future timestamp', () => {
      const future = new Date(NOW.getTime() + 60_000).toISOString()
      expect(deriveFeedHealth(future, NOW)).toBe('healthy')
    })
  })

  // =========================================================================
  // buildFeedHealthMessage
  // =========================================================================
  describe('buildFeedHealthMessage', () => {
    it('returns unavailable message when feed is unavailable', () => {
      const msg = buildFeedHealthMessage('unavailable', null)
      expect(msg).toContain('unavailable')
      expect(msg).toContain('cannot be confirmed')
    })

    it('returns degraded message when feed is degraded', () => {
      const msg = buildFeedHealthMessage('degraded', MOCK_REFRESHED_AT)
      expect(msg).toContain('limited-data mode')
    })

    it('returns stale message with last update time', () => {
      const msg = buildFeedHealthMessage('stale', MOCK_REFRESHED_AT)
      expect(msg).toContain('outdated')
      expect(msg).toContain('last update')
    })

    it('returns healthy message when feed is healthy', () => {
      const msg = buildFeedHealthMessage('healthy', MOCK_REFRESHED_AT)
      expect(msg).toContain('operational')
    })

    it('returns "unknown" label when stale and lastRefreshedAt is null', () => {
      const msg = buildFeedHealthMessage('stale', null)
      expect(msg).toContain('unknown')
      expect(msg).toContain('outdated')
    })
  })

  // =========================================================================
  // deriveQueueSummary
  // =========================================================================
  describe('deriveQueueSummary', () => {
    it('returns zero counts for empty events', () => {
      const summary = deriveQueueSummary([], NOW)
      expect(summary.total).toBe(0)
      expect(summary.unread).toBe(0)
      expect(summary.blocked).toBe(0)
      expect(summary.actionNeeded).toBe(0)
      expect(summary.waitingOnProvider).toBe(0)
      expect(summary.reviewComplete).toBe(0)
      expect(summary.staleCount).toBe(0)
    })

    it('counts healthy events correctly', () => {
      const summary = deriveQueueSummary(MOCK_EVENTS_HEALTHY, NOW)
      expect(summary.total).toBe(3)
      expect(summary.unread).toBe(1)
      expect(summary.reviewComplete).toBe(1)
    })

    it('counts mixed severity events correctly', () => {
      const summary = deriveQueueSummary(MOCK_EVENTS_MIXED, NOW)
      expect(summary.total).toBe(7)
      expect(summary.blocked).toBe(1)
      expect(summary.actionNeeded).toBe(2)
      expect(summary.waitingOnProvider).toBe(1)
      expect(summary.reviewComplete).toBe(1)
    })

    it('counts stale events based on timestamp freshness', () => {
      const summary = deriveQueueSummary(MOCK_EVENTS_MIXED, NOW)
      // evt-013 is 7+ days old, should be stale or critical
      expect(summary.staleCount).toBe(1) // evt-013 is 7+ days old (critical freshness)
    })

    it('calculates oldest unresolved days', () => {
      const summary = deriveQueueSummary(MOCK_EVENTS_MIXED, NOW)
      // evt-013 is ~7 days old
      expect(summary.oldestUnresolvedDays).toBe(7) // evt-013 is exactly 7+ days old
    })

    it('tracks oldest unresolved age across multiple unresolved events', () => {
      // Two blocked events at different ages; the function is order-independent —
      // it always finds the maximum age regardless of input order.
      const older: ComplianceEvent = {
        id: 'age-old',
        title: 'Old blocked event',
        description: 'Older event',
        severity: 'blocked',
        category: 'sanctions_screening',
        timestamp: new Date(NOW.getTime() - 14 * 86_400_000).toISOString(), // 14 days ago
        readState: 'unread',
        isLaunchBlocking: true,
        actor: 'test@biatec.io',
        transition: 'Status changed',
        nextAction: 'Review',
        drillDownPath: null,
      }
      const newer: ComplianceEvent = {
        id: 'age-new',
        title: 'Newer blocked event',
        description: 'Newer event',
        severity: 'blocked',
        category: 'sanctions_screening',
        timestamp: new Date(NOW.getTime() - 2 * 86_400_000).toISOString(), // 2 days ago
        readState: 'unread',
        isLaunchBlocking: true,
        actor: 'test@biatec.io',
        transition: 'Status changed',
        nextAction: 'Review',
        drillDownPath: null,
      }
      // Order [older, newer]: older age (14d) set first, newer (2d) doesn't update
      const summary1 = deriveQueueSummary([older, newer], NOW)
      expect(summary1.oldestUnresolvedDays).toBe(14)

      // Order [newer, older]: newer age (2d) set first, older (14d) updates max
      const summary2 = deriveQueueSummary([newer, older], NOW)
      expect(summary2.oldestUnresolvedDays).toBe(14)
    })

    it('does not count review_complete or informational toward oldest unresolved', () => {
      const reviewEvent: ComplianceEvent = {
        id: 'resolved-1',
        title: 'Review complete',
        description: 'Resolved',
        severity: 'review_complete',
        category: 'kyc_review',
        timestamp: new Date(NOW.getTime() - 30 * 86_400_000).toISOString(), // 30 days ago
        readState: 'read',
        isLaunchBlocking: false,
        actor: 'test@biatec.io',
        transition: 'Review completed',
        nextAction: null,
        drillDownPath: null,
      }
      const summary = deriveQueueSummary([reviewEvent], NOW)
      expect(summary.oldestUnresolvedDays).toBe(0)
    })
  })

  // =========================================================================
  // filterEvents
  // =========================================================================
  describe('filterEvents', () => {
    it('returns all events with default (all) filters', () => {
      const filtered = filterEvents(MOCK_EVENTS_MIXED, DEFAULT_FILTERS, NOW)
      expect(filtered.length).toBe(MOCK_EVENTS_MIXED.length)
    })

    it('filters by category', () => {
      const filters: NotificationFilters = { ...DEFAULT_FILTERS, category: 'kyc_review' }
      const filtered = filterEvents(MOCK_EVENTS_MIXED, filters, NOW)
      expect(filtered.every((e) => e.category === 'kyc_review')).toBe(true)
    })

    it('filters by severity', () => {
      const filters: NotificationFilters = { ...DEFAULT_FILTERS, severity: 'blocked' }
      const filtered = filterEvents(MOCK_EVENTS_MIXED, filters, NOW)
      expect(filtered.every((e) => e.severity === 'blocked')).toBe(true)
      expect(filtered.length).toBe(1)
    })

    it('filters by read state', () => {
      const filters: NotificationFilters = { ...DEFAULT_FILTERS, readState: 'unread' }
      const filtered = filterEvents(MOCK_EVENTS_MIXED, filters, NOW)
      expect(filtered.every((e) => e.readState === 'unread')).toBe(true)
    })

    it('filters by freshness bucket', () => {
      const filters: NotificationFilters = { ...DEFAULT_FILTERS, freshness: 'critical' }
      const filtered = filterEvents(MOCK_EVENTS_MIXED, filters, NOW)
      // evt-013 is 7+ days old (critical)
      expect(filtered.length).toBe(1) // evt-013 is the only critical freshness event
    })

    it('combines multiple filters', () => {
      const filters: NotificationFilters = {
        category: 'sanctions_escalation',
        severity: 'blocked',
        freshness: 'all',
        readState: 'unread',
      }
      const filtered = filterEvents(MOCK_EVENTS_MIXED, filters, NOW)
      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe('evt-010')
    })

    it('returns empty for impossible filter combination', () => {
      const filters: NotificationFilters = {
        category: 'system',
        severity: 'blocked',
        freshness: 'all',
        readState: 'all',
      }
      const filtered = filterEvents(MOCK_EVENTS_MIXED, filters, NOW)
      expect(filtered.length).toBe(0)
    })
  })

  // =========================================================================
  // sortEventsByPriority
  // =========================================================================
  describe('sortEventsByPriority', () => {
    it('sorts by severity first (blocked first)', () => {
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      expect(sorted[0].severity).toBe('blocked')
    })

    it('does not mutate original array', () => {
      const original = [...MOCK_EVENTS_MIXED]
      sortEventsByPriority(MOCK_EVENTS_MIXED)
      expect(MOCK_EVENTS_MIXED).toEqual(original)
    })

    it('sorts by timestamp within same severity (newest first)', () => {
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      // MOCK_EVENTS_MIXED has exactly 2 action_needed events: evt-011 (2026-03-27) and evt-013 (2026-03-20)
      const actionNeeded = sorted.filter((e) => e.severity === 'action_needed')
      expect(actionNeeded.length).toBe(2)
      // evt-011 (newer) should come before evt-013 (older)
      expect(new Date(actionNeeded[0].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(actionNeeded[1].timestamp).getTime(),
      )
    })
  })

  // =========================================================================
  // groupTimelineByDate
  // =========================================================================
  describe('groupTimelineByDate', () => {
    it('groups entries by date', () => {
      const groups = groupTimelineByDate(MOCK_TIMELINE_ENTRIES, NOW)
      expect(groups.length).toBe(2) // Today (tl-001, tl-002, tl-003) + Yesterday (tl-004)
    })

    it('labels today correctly', () => {
      const groups = groupTimelineByDate(MOCK_TIMELINE_ENTRIES, NOW)
      const todayGroup = groups.find((g) => g.dateLabel === 'Today')
      expect(todayGroup).toBeTruthy()
    })

    it('labels yesterday correctly', () => {
      const groups = groupTimelineByDate(MOCK_TIMELINE_ENTRIES, NOW)
      const yesterdayGroup = groups.find((g) => g.dateLabel === 'Yesterday')
      expect(yesterdayGroup).toBeTruthy()
    })

    it('sorts entries newest first within each group', () => {
      const groups = groupTimelineByDate(MOCK_TIMELINE_ENTRIES, NOW)
      for (const group of groups) {
        for (let i = 1; i < group.entries.length; i++) {
          const prevTs = new Date(group.entries[i - 1].timestamp).getTime()
          const currTs = new Date(group.entries[i].timestamp).getTime()
          expect(prevTs).toBeGreaterThanOrEqual(currTs)
        }
      }
    })

    it('returns empty for empty entries', () => {
      const groups = groupTimelineByDate([], NOW)
      expect(groups.length).toBe(0)
    })

    it('labels dates older than yesterday with month and day format', () => {
      // Create entries for a date 5 days ago (neither today nor yesterday)
      const fiveDaysAgo = new Date(NOW.getTime() - 5 * 86_400_000)
      const oldEntry = {
        id: 'tl-old-001',
        timestamp: fiveDaysAgo.toISOString(),
        actor: 'test@biatec.io',
        actorType: 'operator' as const,
        transition: 'Old event',
        description: 'An old timeline event for date label testing.',
        nextAction: null,
        category: 'system' as const,
        severity: 'informational' as const,
      }
      const groups = groupTimelineByDate([oldEntry], NOW)
      expect(groups.length).toBe(1)
      // Should use "Mon DD" format (e.g., "Mar 22")
      expect(groups[0].dateLabel).not.toBe('Today')
      expect(groups[0].dateLabel).not.toBe('Yesterday')
      expect(groups[0].dateLabel).toMatch(/\w{3}\s+\d{1,2}/)
    })

    it('groups entries from multiple different older dates', () => {
      const threeDaysAgo = new Date(NOW.getTime() - 3 * 86_400_000)
      const fiveDaysAgo = new Date(NOW.getTime() - 5 * 86_400_000)
      const entries = [
        {
          id: 'tl-multi-001',
          timestamp: threeDaysAgo.toISOString(),
          actor: 'test1@biatec.io',
          actorType: 'operator' as const,
          transition: 'Event A',
          description: 'Three days ago.',
          nextAction: null,
          category: 'kyc_review' as const,
          severity: 'action_needed' as const,
        },
        {
          id: 'tl-multi-002',
          timestamp: fiveDaysAgo.toISOString(),
          actor: 'test2@biatec.io',
          actorType: 'system' as const,
          transition: 'Event B',
          description: 'Five days ago.',
          nextAction: null,
          category: 'aml_screening' as const,
          severity: 'informational' as const,
        },
      ]
      const groups = groupTimelineByDate(entries, NOW)
      expect(groups.length).toBe(2)
      // Both should have formatted date labels (not Today or Yesterday)
      for (const g of groups) {
        expect(g.dateLabel).not.toBe('Today')
        expect(g.dateLabel).not.toBe('Yesterday')
      }
    })
  })

  // =========================================================================
  // formatRelativeTime
  // =========================================================================
  describe('formatRelativeTime', () => {
    it('returns "Just now" for < 1 minute ago', () => {
      const thirtySecAgo = new Date(NOW.getTime() - 30_000).toISOString()
      expect(formatRelativeTime(thirtySecAgo, NOW)).toBe('Just now')
    })

    it('returns minutes ago for < 1 hour', () => {
      const fiveMinAgo = new Date(NOW.getTime() - 5 * 60_000).toISOString()
      expect(formatRelativeTime(fiveMinAgo, NOW)).toBe('5 minutes ago')
    })

    it('returns singular minute', () => {
      const oneMinAgo = new Date(NOW.getTime() - 60_000).toISOString()
      expect(formatRelativeTime(oneMinAgo, NOW)).toBe('1 minute ago')
    })

    it('returns hours ago for < 1 day', () => {
      const threeHrsAgo = new Date(NOW.getTime() - 3 * 3_600_000).toISOString()
      expect(formatRelativeTime(threeHrsAgo, NOW)).toBe('3 hours ago')
    })

    it('returns singular "1 hour ago" for exactly 1 hour', () => {
      const oneHrAgo = new Date(NOW.getTime() - 3_600_000).toISOString()
      expect(formatRelativeTime(oneHrAgo, NOW)).toBe('1 hour ago')
    })

    it('returns Yesterday for 1-2 days ago', () => {
      const oneDayAgo = new Date(NOW.getTime() - 30 * 3_600_000).toISOString()
      expect(formatRelativeTime(oneDayAgo, NOW)).toBe('Yesterday')
    })

    it('returns days ago for 2-7 days', () => {
      const fourDaysAgo = new Date(NOW.getTime() - 4 * 86_400_000).toISOString()
      expect(formatRelativeTime(fourDaysAgo, NOW)).toBe('4 days ago')
    })

    it('returns singular "2 days ago" for exactly 2 days', () => {
      const twoDaysAgo = new Date(NOW.getTime() - 2 * 86_400_000).toISOString()
      expect(formatRelativeTime(twoDaysAgo, NOW)).toBe('2 days ago')
    })

    it('returns date string for > 7 days', () => {
      const tenDaysAgo = new Date(NOW.getTime() - 10 * 86_400_000).toISOString()
      const result = formatRelativeTime(tenDaysAgo, NOW)
      expect(result).toMatch(/\w+ \d+/) // e.g. "Mar 17"
    })

    it('returns date string for exactly 7 days', () => {
      const sevenDaysAgo = new Date(NOW.getTime() - 7 * 86_400_000).toISOString()
      const result = formatRelativeTime(sevenDaysAgo, NOW)
      expect(result).toMatch(/\w+ \d+/) // e.g. "Mar 20"
    })

    it('returns Unknown for invalid timestamp', () => {
      expect(formatRelativeTime('not-a-date', NOW)).toBe('Unknown')
    })

    it('returns "Just now" for future timestamp', () => {
      const future = new Date(NOW.getTime() + 60_000).toISOString()
      expect(formatRelativeTime(future, NOW)).toBe('Just now')
    })

    it('returns "Just now" for timestamp exactly now', () => {
      expect(formatRelativeTime(NOW.toISOString(), NOW)).toBe('Just now')
    })

    it('returns Unknown for empty string', () => {
      expect(formatRelativeTime('', NOW)).toBe('Unknown')
    })
  })

  // =========================================================================
  // deriveNotificationCenterState
  // =========================================================================
  describe('deriveNotificationCenterState', () => {
    it('derives healthy state with valid events and recent refresh', () => {
      const recentRefresh = new Date(NOW.getTime() - 2 * 60_000).toISOString() // 2 min ago
      const state = deriveNotificationCenterState(MOCK_EVENTS_HEALTHY, recentRefresh, NOW)
      expect(state.feedHealth).toBe('healthy')
      expect(state.events.length).toBe(3)
      expect(state.queueSummary.total).toBe(3)
      expect(state.feedHealthMessage).toContain('operational')
    })

    it('derives unavailable state when lastRefreshedAt is null', () => {
      const state = deriveNotificationCenterState(MOCK_EVENTS_HEALTHY, null, NOW)
      expect(state.feedHealth).toBe('unavailable')
      expect(state.feedHealthMessage).toContain('unavailable')
    })

    it('derives degraded state with empty events and old refresh', () => {
      const oldRefresh = new Date(NOW.getTime() - 3 * 3_600_000).toISOString()
      const state = deriveNotificationCenterState(MOCK_EVENTS_DEGRADED, oldRefresh, NOW)
      expect(state.feedHealth).toBe('unavailable')
      expect(state.queueSummary.total).toBe(0)
    })

    it('sorts events by priority in derived state', () => {
      const state = deriveNotificationCenterState(MOCK_EVENTS_MIXED, MOCK_REFRESHED_AT, NOW)
      expect(state.events[0].severity).toBe('blocked')
    })

    it('preserves lastRefreshedAt in state', () => {
      const state = deriveNotificationCenterState(MOCK_EVENTS_HEALTHY, MOCK_REFRESHED_AT, NOW)
      expect(state.lastRefreshedAt).toBe(MOCK_REFRESHED_AT)
    })
  })

  // =========================================================================
  // CSS Helper Classes
  // =========================================================================
  describe('severityBadgeClass', () => {
    it('returns red classes for blocked', () => {
      expect(severityBadgeClass('blocked')).toContain('red')
    })

    it('returns orange classes for action_needed', () => {
      expect(severityBadgeClass('action_needed')).toContain('orange')
    })

    it('returns yellow classes for waiting_on_provider', () => {
      expect(severityBadgeClass('waiting_on_provider')).toContain('yellow')
    })

    it('returns green classes for review_complete', () => {
      expect(severityBadgeClass('review_complete')).toContain('green')
    })

    it('returns blue classes for informational', () => {
      expect(severityBadgeClass('informational')).toContain('blue')
    })
  })

  describe('feedHealthBannerClass', () => {
    it('returns green for healthy', () => {
      expect(feedHealthBannerClass('healthy')).toContain('green')
    })

    it('returns yellow for stale', () => {
      expect(feedHealthBannerClass('stale')).toContain('yellow')
    })

    it('returns orange for degraded', () => {
      expect(feedHealthBannerClass('degraded')).toContain('orange')
    })

    it('returns red for unavailable', () => {
      expect(feedHealthBannerClass('unavailable')).toContain('red')
    })
  })

  describe('categoryIconName', () => {
    it('maps all categories to icon names', () => {
      const categories: ComplianceEventCategory[] = [
        'investor_onboarding',
        'kyc_review',
        'aml_screening',
        'sanctions_escalation',
        'evidence_export',
        'release_evidence',
        'compliance_proof',
        'webhook_delivery',
        'system',
      ]
      for (const cat of categories) {
        expect(categoryIconName(cat)).toBeTruthy()
        expect(typeof categoryIconName(cat)).toBe('string')
      }
    })
  })

  // =========================================================================
  // Test IDs
  // =========================================================================
  describe('NOTIFICATION_CENTER_TEST_IDS', () => {
    it('has all required test IDs', () => {
      expect(NOTIFICATION_CENTER_TEST_IDS.ROOT).toBeTruthy()
      expect(NOTIFICATION_CENTER_TEST_IDS.HEADING).toBeTruthy()
      expect(NOTIFICATION_CENTER_TEST_IDS.FEED_HEALTH_BANNER).toBeTruthy()
      expect(NOTIFICATION_CENTER_TEST_IDS.QUEUE_SUMMARY).toBeTruthy()
      expect(NOTIFICATION_CENTER_TEST_IDS.EVENT_LIST).toBeTruthy()
      expect(NOTIFICATION_CENTER_TEST_IDS.EMPTY_STATE).toBeTruthy()
      expect(NOTIFICATION_CENTER_TEST_IDS.TIMELINE_ROOT).toBeTruthy()
    })
  })

  // =========================================================================
  // Mock Fixtures Validation
  // =========================================================================
  describe('mock fixtures', () => {
    it('MOCK_EVENTS_HEALTHY has 3 events', () => {
      expect(MOCK_EVENTS_HEALTHY.length).toBe(3)
    })

    it('MOCK_EVENTS_MIXED has 7 events (5 with nextAction, 2 without)', () => {
      expect(MOCK_EVENTS_MIXED.length).toBe(7)
      expect(MOCK_EVENTS_MIXED.filter(e => e.nextAction === null).length).toBe(2)
      expect(MOCK_EVENTS_MIXED.filter(e => e.nextAction !== null).length).toBe(5)
    })

    it('MOCK_EVENTS_DEGRADED is empty', () => {
      expect(MOCK_EVENTS_DEGRADED.length).toBe(0)
    })

    it('MOCK_TIMELINE_ENTRIES has 4 entries', () => {
      expect(MOCK_TIMELINE_ENTRIES.length).toBe(4)
    })

    it('all healthy events have valid ISO timestamps', () => {
      for (const ev of MOCK_EVENTS_HEALTHY) {
        expect(isNaN(new Date(ev.timestamp).getTime())).toBe(false)
      }
    })

    it('all mixed events have valid ISO timestamps', () => {
      for (const ev of MOCK_EVENTS_MIXED) {
        expect(isNaN(new Date(ev.timestamp).getTime())).toBe(false)
      }
    })

    it('mock events contain launch-blocking events in mixed set', () => {
      const blocking = MOCK_EVENTS_MIXED.filter((e) => e.isLaunchBlocking)
      expect(blocking.length).toBe(2) // evt-010 and evt-013 are launch-blocking
    })

    it('MOCK_REFRESHED_AT is a valid ISO timestamp', () => {
      expect(isNaN(new Date(MOCK_REFRESHED_AT).getTime())).toBe(false)
    })
  })

  // =========================================================================
  // DEFAULT_FILTERS
  // =========================================================================
  describe('DEFAULT_FILTERS', () => {
    it('has all fields set to "all"', () => {
      expect(DEFAULT_FILTERS.category).toBe('all')
      expect(DEFAULT_FILTERS.severity).toBe('all')
      expect(DEFAULT_FILTERS.freshness).toBe('all')
      expect(DEFAULT_FILTERS.readState).toBe('all')
    })
  })

  // =========================================================================
  // Integration: state derivation edge cases
  // =========================================================================
  describe('state derivation edge cases', () => {
    it('derives stale feed health for refresh 10 minutes ago', () => {
      const staleRefresh = new Date(NOW.getTime() - 10 * 60_000).toISOString()
      const state = deriveNotificationCenterState(MOCK_EVENTS_HEALTHY, staleRefresh, NOW)
      expect(state.feedHealth).toBe('stale')
      expect(state.feedHealthMessage).toContain('outdated')
    })

    it('derives degraded feed health for refresh 60 minutes ago', () => {
      const degradedRefresh = new Date(NOW.getTime() - 60 * 60_000).toISOString()
      const state = deriveNotificationCenterState(MOCK_EVENTS_HEALTHY, degradedRefresh, NOW)
      expect(state.feedHealth).toBe('degraded')
      expect(state.feedHealthMessage).toContain('limited-data')
    })

    it('derives unavailable feed health for refresh 3 hours ago', () => {
      const oldRefresh = new Date(NOW.getTime() - 3 * 3_600_000).toISOString()
      const state = deriveNotificationCenterState(MOCK_EVENTS_HEALTHY, oldRefresh, NOW)
      expect(state.feedHealth).toBe('unavailable')
      expect(state.feedHealthMessage).toContain('unavailable')
    })

    it('queue summary counts stale events based on timestamp age', () => {
      const summary = deriveQueueSummary(MOCK_EVENTS_MIXED, NOW)
      // evt-013 from 2026-03-20 is 7 days old = critical freshness → counted as stale
      // All other events are from 2026-03-27 (same day as NOW) → fresh
      expect(summary.staleCount).toBe(1)
    })

    it('queue summary tracks oldest unresolved event age in days', () => {
      const summary = deriveQueueSummary(MOCK_EVENTS_MIXED, NOW)
      // evt-013 from 2026-03-20T10:00:00Z → NOW 2026-03-27T15:00:00Z = 7 days, 5 hours
      // Math.floor(7.2 * DAY_MS / DAY_MS) = 7
      expect(summary.oldestUnresolvedDays).toBe(7)
    })

    it('filterEvents with category=all and severity=all returns all events', () => {
      const all = filterEvents(MOCK_EVENTS_MIXED, DEFAULT_FILTERS, NOW)
      expect(all.length).toBe(MOCK_EVENTS_MIXED.length)
    })

    it('filterEvents with readState=read returns only read events', () => {
      const readFilter: NotificationFilters = { ...DEFAULT_FILTERS, readState: 'read' }
      const result = filterEvents(MOCK_EVENTS_MIXED, readFilter, NOW)
      const expected = MOCK_EVENTS_MIXED.filter(e => e.readState === 'read').length
      expect(result.length).toBe(expected)
    })

    it('filterEvents with readState=unread returns only unread events', () => {
      const unreadFilter: NotificationFilters = { ...DEFAULT_FILTERS, readState: 'unread' }
      const result = filterEvents(MOCK_EVENTS_MIXED, unreadFilter, NOW)
      const expected = MOCK_EVENTS_MIXED.filter(e => e.readState === 'unread').length
      expect(result.length).toBe(expected)
    })

    it('filterEvents with freshness=fresh returns only fresh events', () => {
      const freshFilter: NotificationFilters = { ...DEFAULT_FILTERS, freshness: 'fresh' }
      const result = filterEvents(MOCK_EVENTS_MIXED, freshFilter, NOW)
      // Fresh events are those with timestamps < 1 hour from NOW
      for (const ev of result) {
        const ageMs = NOW.getTime() - new Date(ev.timestamp).getTime()
        expect(ageMs).toBeLessThan(3_600_000)
      }
    })

    it('filterEvents with freshness=critical returns only critical-age events', () => {
      const criticalFilter: NotificationFilters = { ...DEFAULT_FILTERS, freshness: 'critical' }
      const result = filterEvents(MOCK_EVENTS_MIXED, criticalFilter, NOW)
      // Critical events are those with timestamps >= 7 days old
      for (const ev of result) {
        const ageMs = NOW.getTime() - new Date(ev.timestamp).getTime()
        expect(ageMs).toBeGreaterThanOrEqual(7 * 86_400_000)
      }
    })

    it('filterEvents with combined severity and category', () => {
      const combo: NotificationFilters = { ...DEFAULT_FILTERS, severity: 'blocked', category: 'sanctions_escalation' }
      const result = filterEvents(MOCK_EVENTS_MIXED, combo, NOW)
      const expected = MOCK_EVENTS_MIXED.filter(e => e.severity === 'blocked' && e.category === 'sanctions_escalation').length
      expect(result.length).toBe(expected)
    })

    it('sortEventsByPriority sorts by severity first, then by timestamp', () => {
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      // Verify severity ordering: each event's severity rank should be <= next event's
      for (let i = 0; i < sorted.length - 1; i++) {
        const rankA = severityRank(sorted[i].severity)
        const rankB = severityRank(sorted[i + 1].severity)
        if (rankA === rankB) {
          // Same severity — newer timestamp should come first
          const tsA = new Date(sorted[i].timestamp).getTime()
          const tsB = new Date(sorted[i + 1].timestamp).getTime()
          expect(tsA).toBeGreaterThanOrEqual(tsB)
        } else {
          expect(rankA).toBeLessThan(rankB)
        }
      }
    })

    it('sortEventsByPriority returns empty array for empty input', () => {
      expect(sortEventsByPriority([]).length).toBe(0)
    })

    it('sortEventsByPriority returns single-element array unchanged', () => {
      const single = [MOCK_EVENTS_MIXED[0]]
      const sorted = sortEventsByPriority(single)
      expect(sorted.length).toBe(1)
      expect(sorted[0].id).toBe(single[0].id)
    })

    it('buildFeedHealthMessage returns correct stale message with null lastRefreshedAt', () => {
      const msg = buildFeedHealthMessage('stale', null)
      expect(msg).toContain('outdated')
      expect(msg).toContain('unknown')
    })

    it('buildFeedHealthMessage returns correct healthy message', () => {
      const msg = buildFeedHealthMessage('healthy', MOCK_REFRESHED_AT)
      expect(msg).toContain('operational')
    })

    it('buildFeedHealthMessage returns correct degraded message', () => {
      const msg = buildFeedHealthMessage('degraded', MOCK_REFRESHED_AT)
      expect(msg).toContain('limited-data')
    })

    it('classifyFreshness returns aging for 2-day-old timestamp', () => {
      const twoDays = new Date(NOW.getTime() - 2 * 86_400_000).toISOString()
      expect(classifyFreshness(twoDays, NOW)).toBe('aging')
    })

    it('classifyFreshness returns recent for 12-hour-old timestamp', () => {
      const halfDay = new Date(NOW.getTime() - 12 * 3_600_000).toISOString()
      expect(classifyFreshness(halfDay, NOW)).toBe('recent')
    })

    it('deriveFeedHealth returns healthy for future timestamp', () => {
      const future = new Date(NOW.getTime() + 60_000).toISOString()
      expect(deriveFeedHealth(future, NOW)).toBe('healthy')
    })

    it('deriveFeedHealth returns stale for 15-minute-old refresh', () => {
      const fifteenMin = new Date(NOW.getTime() - 15 * 60_000).toISOString()
      expect(deriveFeedHealth(fifteenMin, NOW)).toBe('stale')
    })

    it('deriveFeedHealth returns degraded for 90-minute-old refresh', () => {
      const ninetyMin = new Date(NOW.getTime() - 90 * 60_000).toISOString()
      expect(deriveFeedHealth(ninetyMin, NOW)).toBe('degraded')
    })

    it('SEVERITY_LABELS has human-readable labels for all severities', () => {
      expect(SEVERITY_LABELS.blocked).toBe('Blocked — Issuance halted')
      expect(SEVERITY_LABELS.action_needed).toBe('Action needed')
      expect(SEVERITY_LABELS.waiting_on_provider).toBe('Waiting on provider')
      expect(SEVERITY_LABELS.review_complete).toBe('Review complete')
      expect(SEVERITY_LABELS.informational).toBe('Informational')
    })

    it('CATEGORY_LABELS has human-readable labels for all categories', () => {
      expect(CATEGORY_LABELS.investor_onboarding).toBeTruthy()
      expect(CATEGORY_LABELS.kyc_review).toBeTruthy()
      expect(CATEGORY_LABELS.aml_screening).toBeTruthy()
      expect(CATEGORY_LABELS.sanctions_escalation).toBeTruthy()
      expect(CATEGORY_LABELS.evidence_export).toBeTruthy()
      expect(CATEGORY_LABELS.release_evidence).toBeTruthy()
      expect(CATEGORY_LABELS.compliance_proof).toBeTruthy()
      expect(CATEGORY_LABELS.webhook_delivery).toBeTruthy()
      expect(CATEGORY_LABELS.system).toBeTruthy()
    })

    it('FEED_HEALTH_LABELS has labels for all health states', () => {
      expect(FEED_HEALTH_LABELS.healthy).toBeTruthy()
      expect(FEED_HEALTH_LABELS.stale).toBeTruthy()
      expect(FEED_HEALTH_LABELS.degraded).toBeTruthy()
      expect(FEED_HEALTH_LABELS.unavailable).toBeTruthy()
    })

    it('FRESHNESS_LABELS has labels for all freshness buckets', () => {
      expect(FRESHNESS_LABELS.fresh).toBeTruthy()
      expect(FRESHNESS_LABELS.recent).toBeTruthy()
      expect(FRESHNESS_LABELS.aging).toBeTruthy()
      expect(FRESHNESS_LABELS.stale).toBeTruthy()
      expect(FRESHNESS_LABELS.critical).toBeTruthy()
    })
  })

  // =========================================================================
  // null-nextAction events (close v-if branch gap — ComplianceEvent.nextAction: string | null)
  // =========================================================================
  describe('null-nextAction event handling', () => {
    it('MOCK_EVENTS_MIXED contains events with null nextAction', () => {
      const nullNextActions = MOCK_EVENTS_MIXED.filter(e => e.nextAction === null)
      expect(nullNextActions.length).toBe(2)
      expect(nullNextActions[0].id).toBe('evt-015')
      expect(nullNextActions[1].id).toBe('evt-016')
    })

    it('null-nextAction events have correct categories', () => {
      const evt015 = MOCK_EVENTS_MIXED.find(e => e.id === 'evt-015')
      const evt016 = MOCK_EVENTS_MIXED.find(e => e.id === 'evt-016')
      expect(evt015?.category).toBe('kyc_review')
      expect(evt016?.category).toBe('aml_screening')
    })

    it('null-nextAction events have informational severity', () => {
      const nullNextActions = MOCK_EVENTS_MIXED.filter(e => e.nextAction === null)
      for (const evt of nullNextActions) {
        expect(evt.severity).toBe('informational')
      }
    })

    it('null-nextAction events are included in deriveQueueSummary total', () => {
      const summary = deriveQueueSummary(MOCK_EVENTS_MIXED, NOW)
      expect(summary.total).toBe(7)
    })

    it('null-nextAction events pass through filterEvents with default filters', () => {
      const filtered = filterEvents(MOCK_EVENTS_MIXED, DEFAULT_FILTERS, NOW)
      const nullNextActions = filtered.filter(e => e.nextAction === null)
      expect(nullNextActions.length).toBe(2)
    })

    it('null-nextAction events can be filtered by category', () => {
      const filters: NotificationFilters = { ...DEFAULT_FILTERS, category: 'aml_screening' }
      const filtered = filterEvents(MOCK_EVENTS_MIXED, filters, NOW)
      const nullEvt = filtered.find(e => e.id === 'evt-016')
      expect(nullEvt).toBeTruthy()
      expect(nullEvt?.nextAction).toBeNull()
    })

    it('null-nextAction events can be filtered by severity=informational', () => {
      const filters: NotificationFilters = { ...DEFAULT_FILTERS, severity: 'informational' }
      const filtered = filterEvents(MOCK_EVENTS_MIXED, filters, NOW)
      expect(filtered.filter(e => e.nextAction === null).length).toBe(2)
    })

    it('null-nextAction events are sorted correctly by priority', () => {
      const sorted = sortEventsByPriority(MOCK_EVENTS_MIXED)
      // Informational events should be at the end (lowest priority)
      const lastTwo = sorted.slice(-2)
      for (const evt of lastTwo) {
        expect(evt.severity).toBe('informational')
      }
    })

    it('evt-016 has null drillDownPath alongside null nextAction', () => {
      const evt = MOCK_EVENTS_MIXED.find(e => e.id === 'evt-016')
      expect(evt?.nextAction).toBeNull()
      expect(evt?.drillDownPath).toBeNull()
    })

    it('evt-015 has non-null drillDownPath with null nextAction', () => {
      const evt = MOCK_EVENTS_MIXED.find(e => e.id === 'evt-015')
      expect(evt?.nextAction).toBeNull()
      expect(evt?.drillDownPath).toBe('/compliance/onboarding')
    })

    it('deriveNotificationCenterState includes null-nextAction events in state', () => {
      const state = deriveNotificationCenterState(MOCK_EVENTS_MIXED, MOCK_REFRESHED_AT, NOW)
      const nullEvents = state.events.filter(e => e.nextAction === null)
      expect(nullEvents.length).toBe(2)
    })
  })
})

// ===========================================================================
// buildMockEventsMixed — relative-timestamp builder (April 2026 addition)
// These tests ensure freshness buckets remain stable regardless of run date.
// ===========================================================================
describe('buildMockEventsMixed', () => {
  it('returns exactly 7 events', () => {
    expect(buildMockEventsMixed().length).toBe(7)
  })

  it('preserves the same IDs as the static MOCK_EVENTS_MIXED fixture', () => {
    const ids = buildMockEventsMixed().map(e => e.id)
    expect(ids).toEqual(['evt-010', 'evt-011', 'evt-012', 'evt-013', 'evt-014', 'evt-015', 'evt-016'])
  })

  it('evt-013 always classifies as critical freshness (173 h offset)', () => {
    const anchor = new Date()
    const events = buildMockEventsMixed(anchor)
    const evt013 = events.find(e => e.id === 'evt-013')!
    // 173 hours > 7 days threshold → critical
    expect(classifyFreshness(evt013.timestamp, anchor)).toBe('critical')
  })

  it('evt-010 always classifies as fresh (15 min offset)', () => {
    const anchor = new Date()
    const events = buildMockEventsMixed(anchor)
    const evt010 = events.find(e => e.id === 'evt-010')!
    expect(classifyFreshness(evt010.timestamp, anchor)).toBe('fresh')
  })

  it('exactly 1 event has critical freshness at any anchor date', () => {
    const anchor = new Date()
    const events = buildMockEventsMixed(anchor)
    const critical = events.filter(e => classifyFreshness(e.timestamp, anchor) === 'critical')
    expect(critical.length).toBe(1)
    expect(critical[0].id).toBe('evt-013')
  })

  it('exactly 1 blocked event (isLaunchBlocking sanctions escalation)', () => {
    const events = buildMockEventsMixed()
    expect(events.filter(e => e.severity === 'blocked').length).toBe(1)
  })

  it('exactly 2 launch-blocking events', () => {
    const events = buildMockEventsMixed()
    expect(events.filter(e => e.isLaunchBlocking).length).toBe(2)
  })

  it('exactly 3 unread events', () => {
    const events = buildMockEventsMixed()
    expect(events.filter(e => e.readState === 'unread').length).toBe(3)
  })

  it('exactly 2 null-nextAction events', () => {
    const events = buildMockEventsMixed()
    expect(events.filter(e => e.nextAction === null).length).toBe(2)
  })

  it('exactly 5 events with drillDownPath', () => {
    const events = buildMockEventsMixed()
    expect(events.filter(e => e.drillDownPath !== null).length).toBe(5)
  })

  it('staleCount from deriveQueueSummary is exactly 1 regardless of anchor', () => {
    const anchor = new Date()
    const events = buildMockEventsMixed(anchor)
    const summary = deriveQueueSummary(events, anchor)
    // evt-013 is always in the critical bucket (173h offset)
    expect(summary.staleCount).toBe(1)
  })

  it('accepts a custom anchor date and produces correct relative offsets', () => {
    const customAnchor = new Date('2030-06-15T12:00:00.000Z')
    const events = buildMockEventsMixed(customAnchor)
    const evt010 = events.find(e => e.id === 'evt-010')!
    const ageMs = customAnchor.getTime() - new Date(evt010.timestamp).getTime()
    // Should be exactly 15 min in ms
    expect(ageMs).toBe(15 * 60 * 1000)
  })
})

// ===========================================================================
// buildMockTimelineEntries — relative-timestamp builder (April 2026 addition)
// ===========================================================================
describe('buildMockTimelineEntries', () => {
  it('returns exactly 4 entries', () => {
    expect(buildMockTimelineEntries().length).toBe(4)
  })

  it('preserves the same IDs as the static MOCK_TIMELINE_ENTRIES fixture', () => {
    const ids = buildMockTimelineEntries().map(e => e.id)
    expect(ids).toEqual(['tl-001', 'tl-002', 'tl-003', 'tl-004'])
  })

  it('produces exactly 2 date groups (Today and Yesterday) when grouped', () => {
    const anchor = new Date()
    const entries = buildMockTimelineEntries(anchor)
    const groups = groupTimelineByDate(entries, anchor)
    expect(groups.length).toBe(2)
  })

  it('Today group has exactly 3 entries', () => {
    const anchor = new Date()
    const entries = buildMockTimelineEntries(anchor)
    const groups = groupTimelineByDate(entries, anchor)
    const today = groups.find(g => g.dateLabel === 'Today')!
    expect(today).toBeDefined()
    expect(today.entries.length).toBe(3)
  })

  it('Yesterday group has exactly 1 entry', () => {
    const anchor = new Date()
    const entries = buildMockTimelineEntries(anchor)
    const groups = groupTimelineByDate(entries, anchor)
    const yesterday = groups.find(g => g.dateLabel === 'Yesterday')!
    expect(yesterday).toBeDefined()
    expect(yesterday.entries.length).toBe(1)
  })

  it('tl-004 always falls in Yesterday group (23 h offset)', () => {
    const anchor = new Date()
    const entries = buildMockTimelineEntries(anchor)
    const groups = groupTimelineByDate(entries, anchor)
    const yesterday = groups.find(g => g.dateLabel === 'Yesterday')!
    expect(yesterday.entries[0].id).toBe('tl-004')
  })

  it('accepts a custom anchor date and generates offsets relative to it', () => {
    const customAnchor = new Date('2030-06-15T12:00:00.000Z')
    const entries = buildMockTimelineEntries(customAnchor)
    const tl001 = entries.find(e => e.id === 'tl-001')!
    const ageMs = customAnchor.getTime() - new Date(tl001.timestamp).getTime()
    // tl-001 is 10 min in ms
    expect(ageMs).toBe(10 * 60 * 1000)
  })
})
