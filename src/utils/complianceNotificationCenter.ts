/**
 * Compliance Notification Center — core data model, normalization, and business logic.
 *
 * Provides typed event models, severity mapping, freshness calculations,
 * notification grouping, queue health summaries, and fail-closed state
 * derivation for the notification center and event timeline surfaces.
 *
 * Design principles:
 * - Fail-closed: unknown, delayed, stale, or missing data → degraded / blocked, never healthy.
 * - Operator language: labels use business terminology, not backend jargon.
 * - Deterministic: pure functions, no side-effects, deterministic mock fixtures.
 * - Aligned with backend contract semantics (scholtz/BiatecTokensApi#617).
 */

// ---------------------------------------------------------------------------
// Enums & Literal Unions
// ---------------------------------------------------------------------------

/** Broad category of a compliance event. */
export type ComplianceEventCategory =
  | 'investor_onboarding'
  | 'kyc_review'
  | 'aml_screening'
  | 'sanctions_escalation'
  | 'evidence_export'
  | 'release_evidence'
  | 'compliance_proof'
  | 'webhook_delivery'
  | 'system'

/** Operator-facing severity. Ordered from most to least urgent. */
export type EventSeverity =
  | 'blocked'
  | 'action_needed'
  | 'waiting_on_provider'
  | 'review_complete'
  | 'informational'

/** Feed ingestion health. */
export type FeedHealth = 'healthy' | 'stale' | 'degraded' | 'unavailable'

/** Notification read / unread state. */
export type ReadState = 'unread' | 'read'

/** Freshness bucket for aging analysis. */
export type FreshnessBucket = 'fresh' | 'recent' | 'aging' | 'stale' | 'critical'

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

/** A single compliance event / notification. */
export interface ComplianceEvent {
  id: string
  title: string
  description: string
  category: ComplianceEventCategory
  severity: EventSeverity
  readState: ReadState
  timestamp: string // ISO-8601
  actor: string
  actorType: 'operator' | 'system' | 'provider' | 'automation'
  /** Recommended next operator action. Null when no action is required. */
  nextAction: string | null
  /** Navigation target for drill-down. */
  drillDownPath: string | null
  /** Whether this event blocks issuance. */
  isLaunchBlocking: boolean
  /** Optional case / entity reference for cross-linking. */
  caseRef: string | null
}

/** Timeline entry for a case-level chronological view. */
export interface TimelineEntry {
  id: string
  timestamp: string // ISO-8601
  actor: string
  actorType: 'operator' | 'system' | 'provider' | 'automation'
  transition: string
  description: string
  nextAction: string | null
  category: ComplianceEventCategory
  severity: EventSeverity
}

/** Queue-level summary for the notification center header. */
export interface QueueSummary {
  total: number
  unread: number
  blocked: number
  actionNeeded: number
  waitingOnProvider: number
  reviewComplete: number
  staleCount: number
  oldestUnresolvedDays: number
}

/** Overall notification center state. */
export interface NotificationCenterState {
  feedHealth: FeedHealth
  lastRefreshedAt: string | null // ISO-8601
  events: ComplianceEvent[]
  queueSummary: QueueSummary
  feedHealthMessage: string
}

// ---------------------------------------------------------------------------
// Filter Model
// ---------------------------------------------------------------------------

export interface NotificationFilters {
  category: ComplianceEventCategory | 'all'
  severity: EventSeverity | 'all'
  freshness: FreshnessBucket | 'all'
  readState: ReadState | 'all'
}

export const DEFAULT_FILTERS: NotificationFilters = {
  category: 'all',
  severity: 'all',
  freshness: 'all',
  readState: 'all',
}

// ---------------------------------------------------------------------------
// Label Maps — operator language
// ---------------------------------------------------------------------------

export const SEVERITY_LABELS: Record<EventSeverity, string> = {
  blocked: 'Blocked — Issuance halted',
  action_needed: 'Action needed',
  waiting_on_provider: 'Waiting on provider',
  review_complete: 'Review complete',
  informational: 'Informational',
}

export const CATEGORY_LABELS: Record<ComplianceEventCategory, string> = {
  investor_onboarding: 'Investor Onboarding',
  kyc_review: 'KYC Review',
  aml_screening: 'AML Screening',
  sanctions_escalation: 'Sanctions Escalation',
  evidence_export: 'Evidence Export',
  release_evidence: 'Release Evidence',
  compliance_proof: 'Compliance Proof',
  webhook_delivery: 'Webhook Delivery',
  system: 'System',
}

export const FEED_HEALTH_LABELS: Record<FeedHealth, string> = {
  healthy: 'Event feed operational',
  stale: 'Event data may be outdated — last update exceeded freshness threshold',
  degraded: 'Operating in limited-data mode — some events may be missing',
  unavailable: 'Event feed unavailable — compliance state cannot be confirmed',
}

export const FRESHNESS_LABELS: Record<FreshnessBucket, string> = {
  fresh: 'Less than 1 hour',
  recent: '1–24 hours',
  aging: '1–3 days',
  stale: '3–7 days',
  critical: 'Over 7 days',
}

// ---------------------------------------------------------------------------
// Severity ordering (for sorting: lower index = more urgent)
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: EventSeverity[] = [
  'blocked',
  'action_needed',
  'waiting_on_provider',
  'review_complete',
  'informational',
]

export function severityRank(s: EventSeverity): number {
  const idx = SEVERITY_ORDER.indexOf(s)
  return idx >= 0 ? idx : SEVERITY_ORDER.length
}

// ---------------------------------------------------------------------------
// Freshness Calculation
// ---------------------------------------------------------------------------

const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

/**
 * Classify a timestamp into a freshness bucket.
 * Fail-closed: null / invalid → 'critical'.
 */
export function classifyFreshness(
  isoTimestamp: string | null | undefined,
  now: Date = new Date(),
): FreshnessBucket {
  if (!isoTimestamp) return 'critical'
  const ts = new Date(isoTimestamp)
  if (isNaN(ts.getTime())) return 'critical'
  const ageMs = now.getTime() - ts.getTime()
  if (ageMs < 0) return 'fresh' // future timestamps treated as fresh
  if (ageMs < HOUR_MS) return 'fresh'
  if (ageMs < DAY_MS) return 'recent'
  if (ageMs < 3 * DAY_MS) return 'aging'
  if (ageMs < 7 * DAY_MS) return 'stale'
  return 'critical'
}

/**
 * Derive feed health from a last-refreshed timestamp.
 * Fail-closed: null → 'unavailable'.
 */
export function deriveFeedHealth(
  lastRefreshedAt: string | null | undefined,
  now: Date = new Date(),
): FeedHealth {
  if (!lastRefreshedAt) return 'unavailable'
  const ts = new Date(lastRefreshedAt)
  if (isNaN(ts.getTime())) return 'unavailable'
  const ageMs = now.getTime() - ts.getTime()
  if (ageMs < 0) return 'healthy'
  if (ageMs < 5 * MINUTE_MS) return 'healthy' // < 5 minutes
  if (ageMs < 30 * MINUTE_MS) return 'stale' // 5-30 minutes
  if (ageMs < 2 * HOUR_MS) return 'degraded' // 30 min - 2 hours
  return 'unavailable' // > 2 hours
}

/**
 * Build the operator-facing message for current feed health.
 */
export function buildFeedHealthMessage(
  feedHealth: FeedHealth,
  lastRefreshedAt: string | null,
): string {
  if (feedHealth === 'unavailable') {
    return 'Event feed is unavailable. Compliance state cannot be confirmed. Contact your administrator.'
  }
  if (feedHealth === 'degraded') {
    return 'Operating in limited-data mode. Some compliance events may be delayed or missing.'
  }
  if (feedHealth === 'stale') {
    const label = lastRefreshedAt ? formatRelativeTime(lastRefreshedAt) : 'unknown'
    return `Event data may be outdated (last update: ${label}). Refresh to get latest compliance state.`
  }
  return 'Event feed operational. Showing latest compliance activity.'
}

// ---------------------------------------------------------------------------
// Queue Summary Derivation
// ---------------------------------------------------------------------------

/**
 * Derive queue summary from a list of events.
 */
export function deriveQueueSummary(
  events: ComplianceEvent[],
  now: Date = new Date(),
): QueueSummary {
  let unread = 0
  let blocked = 0
  let actionNeeded = 0
  let waitingOnProvider = 0
  let reviewComplete = 0
  let staleCount = 0
  let oldestUnresolvedMs = 0

  for (const ev of events) {
    if (ev.readState === 'unread') unread++
    switch (ev.severity) {
      case 'blocked':
        blocked++
        break
      case 'action_needed':
        actionNeeded++
        break
      case 'waiting_on_provider':
        waitingOnProvider++
        break
      case 'review_complete':
        reviewComplete++
        break
    }
    const freshness = classifyFreshness(ev.timestamp, now)
    if (freshness === 'stale' || freshness === 'critical') staleCount++

    if (ev.severity !== 'review_complete' && ev.severity !== 'informational') {
      const age = now.getTime() - new Date(ev.timestamp).getTime()
      if (age > oldestUnresolvedMs) oldestUnresolvedMs = age
    }
  }

  return {
    total: events.length,
    unread,
    blocked,
    actionNeeded,
    waitingOnProvider,
    reviewComplete,
    staleCount,
    oldestUnresolvedDays: Math.floor(oldestUnresolvedMs / DAY_MS),
  }
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Apply notification filters to an event list.
 */
export function filterEvents(
  events: ComplianceEvent[],
  filters: NotificationFilters,
  now: Date = new Date(),
): ComplianceEvent[] {
  return events.filter((ev) => {
    if (filters.category !== 'all' && ev.category !== filters.category) return false
    if (filters.severity !== 'all' && ev.severity !== filters.severity) return false
    if (filters.readState !== 'all' && ev.readState !== filters.readState) return false
    if (filters.freshness !== 'all') {
      const bucket = classifyFreshness(ev.timestamp, now)
      if (bucket !== filters.freshness) return false
    }
    return true
  })
}

/**
 * Sort events by severity (most urgent first), then by timestamp (newest first).
 */
export function sortEventsByPriority(events: ComplianceEvent[]): ComplianceEvent[] {
  return [...events].sort((a, b) => {
    const sevDiff = severityRank(a.severity) - severityRank(b.severity)
    if (sevDiff !== 0) return sevDiff
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
}

// ---------------------------------------------------------------------------
// Timeline Grouping
// ---------------------------------------------------------------------------

export interface TimelineGroup {
  dateLabel: string
  dateKey: string
  entries: TimelineEntry[]
}

/**
 * Group timeline entries by calendar date (YYYY-MM-DD) with human labels.
 */
export function groupTimelineByDate(
  entries: TimelineEntry[],
  now: Date = new Date(),
): TimelineGroup[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  const groups: Map<string, TimelineEntry[]> = new Map()
  for (const entry of sorted) {
    const d = new Date(entry.timestamp)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const arr = groups.get(key) ?? []
    arr.push(entry)
    groups.set(key, arr)
  }

  const todayKey = formatDateKey(now)
  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayKey = formatDateKey(yesterdayDate)

  const result: TimelineGroup[] = []
  for (const [key, groupEntries] of groups) {
    let dateLabel: string
    if (key === todayKey) dateLabel = 'Today'
    else if (key === yesterdayKey) dateLabel = 'Yesterday'
    else {
      const d = new Date(key + 'T00:00:00')
      dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    result.push({ dateLabel, dateKey: key, entries: groupEntries })
  }
  return result
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Relative Time Formatting
// ---------------------------------------------------------------------------

/**
 * Format an ISO timestamp as a relative human-readable label.
 */
export function formatRelativeTime(isoTimestamp: string, now: Date = new Date()): string {
  const ts = new Date(isoTimestamp)
  if (isNaN(ts.getTime())) return 'Unknown'
  const diffMs = now.getTime() - ts.getTime()
  if (diffMs < 0) return 'Just now'
  if (diffMs < MINUTE_MS) return 'Just now'
  if (diffMs < HOUR_MS) {
    const mins = Math.floor(diffMs / MINUTE_MS)
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  }
  if (diffMs < DAY_MS) {
    const hrs = Math.floor(diffMs / HOUR_MS)
    return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  }
  if (diffMs < 2 * DAY_MS) return 'Yesterday'
  if (diffMs < 7 * DAY_MS) {
    const days = Math.floor(diffMs / DAY_MS)
    return `${days} days ago`
  }
  return ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Full State Derivation
// ---------------------------------------------------------------------------

/**
 * Build the complete notification center state from raw inputs.
 * Fail-closed: if lastRefreshedAt is missing or feed is unhealthy, state reflects degradation.
 */
export function deriveNotificationCenterState(
  events: ComplianceEvent[],
  lastRefreshedAt: string | null,
  now: Date = new Date(),
): NotificationCenterState {
  const feedHealth = deriveFeedHealth(lastRefreshedAt, now)
  const feedHealthMessage = buildFeedHealthMessage(feedHealth, lastRefreshedAt)
  const queueSummary = deriveQueueSummary(events, now)
  return {
    feedHealth,
    lastRefreshedAt,
    events: sortEventsByPriority(events),
    queueSummary,
    feedHealthMessage,
  }
}

// ---------------------------------------------------------------------------
// CSS Helper Classes
// ---------------------------------------------------------------------------

export function severityBadgeClass(severity: EventSeverity): string {
  switch (severity) {
    case 'blocked':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
    case 'action_needed':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
    case 'waiting_on_provider':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
    case 'review_complete':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
    case 'informational':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
  }
}

export function feedHealthBannerClass(health: FeedHealth): string {
  switch (health) {
    case 'healthy':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
    case 'stale':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
    case 'degraded':
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300'
    case 'unavailable':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
  }
}

export function categoryIconName(category: ComplianceEventCategory): string {
  switch (category) {
    case 'investor_onboarding':
      return 'UserPlusIcon'
    case 'kyc_review':
      return 'IdentificationIcon'
    case 'aml_screening':
      return 'ShieldExclamationIcon'
    case 'sanctions_escalation':
      return 'ExclamationTriangleIcon'
    case 'evidence_export':
      return 'DocumentArrowDownIcon'
    case 'release_evidence':
      return 'DocumentCheckIcon'
    case 'compliance_proof':
      return 'ClipboardDocumentCheckIcon'
    case 'webhook_delivery':
      return 'ArrowPathIcon'
    case 'system':
      return 'CogIcon'
  }
}

// ---------------------------------------------------------------------------
// Data-testid Constants
// ---------------------------------------------------------------------------

export const NOTIFICATION_CENTER_TEST_IDS = {
  ROOT: 'notification-center-root',
  HEADING: 'notification-center-heading',
  DESCRIPTION: 'notification-center-description',
  FEED_HEALTH_BANNER: 'notification-center-feed-health',
  QUEUE_SUMMARY: 'notification-center-queue-summary',
  QUEUE_TOTAL: 'notification-center-queue-total',
  QUEUE_UNREAD: 'notification-center-queue-unread',
  QUEUE_BLOCKED: 'notification-center-queue-blocked',
  QUEUE_ACTION_NEEDED: 'notification-center-queue-action-needed',
  QUEUE_WAITING: 'notification-center-queue-waiting',
  QUEUE_STALE: 'notification-center-queue-stale',
  FILTER_CATEGORY: 'notification-center-filter-category',
  FILTER_SEVERITY: 'notification-center-filter-severity',
  FILTER_FRESHNESS: 'notification-center-filter-freshness',
  FILTER_READ_STATE: 'notification-center-filter-read-state',
  EVENT_LIST: 'notification-center-event-list',
  EVENT_ITEM: 'notification-center-event-item',
  EVENT_SEVERITY_BADGE: 'notification-center-severity-badge',
  EVENT_DRILL_DOWN: 'notification-center-drill-down',
  EMPTY_STATE: 'notification-center-empty-state',
  LOADING_STATE: 'notification-center-loading',
  TIMELINE_ROOT: 'notification-center-timeline-root',
  TIMELINE_GROUP: 'notification-center-timeline-group',
  TIMELINE_ENTRY: 'notification-center-timeline-entry',
  REFRESH_BUTTON: 'notification-center-refresh',
  LAST_UPDATED: 'notification-center-last-updated',
  EVENT_LAUNCH_BLOCKING: 'notification-center-launch-blocking',
} as const

// ---------------------------------------------------------------------------
// Mock Fixtures (deterministic, for testing)
// ---------------------------------------------------------------------------

export const MOCK_REFRESHED_AT = '2026-03-27T14:55:00.000Z'

/**
 * Build a set of mixed compliance events with timestamps relative to `anchor`
 * so that freshness buckets stay stable regardless of when tests run.
 *
 * Relative offsets (matching the original March 27 fixture):
 *   evt-010: 15 min ago  → fresh
 *   evt-011: 40 min ago  → fresh
 *   evt-012: 90 min ago  → recent
 *   evt-013: 173 hours ago (~7.2 days) → critical   ← always the stale/critical marker
 *   evt-014:  3 hours ago → recent
 *   evt-015:  3.5 hours ago → recent
 *   evt-016:  4 hours ago → recent
 */
export function buildMockEventsMixed(anchor: Date = new Date()): ComplianceEvent[] {
  const t = anchor.getTime()
  return [
    {
      id: 'evt-010',
      title: 'Sanctions screening escalation opened',
      description:
        'Investor Gamma Holdings matched a watchlist entry. Manual review required before onboarding can continue.',
      category: 'sanctions_escalation',
      severity: 'blocked',
      readState: 'unread',
      timestamp: new Date(t - 15 * MINUTE_MS).toISOString(),
      actor: 'System',
      actorType: 'system',
      nextAction: 'Review sanctions match and either clear or escalate to compliance lead.',
      drillDownPath: '/compliance/operations',
      isLaunchBlocking: true,
      caseRef: 'CASE-2001',
    },
    {
      id: 'evt-011',
      title: 'KYC document resubmission needed',
      description:
        'Identity document for Delta Fund investor was rejected due to low quality. Awaiting resubmission.',
      category: 'kyc_review',
      severity: 'action_needed',
      readState: 'unread',
      timestamp: new Date(t - 40 * MINUTE_MS).toISOString(),
      actor: 'kyc-provider@external.com',
      actorType: 'provider',
      nextAction: 'Contact investor to request higher-quality identity document.',
      drillDownPath: '/compliance/onboarding',
      isLaunchBlocking: false,
      caseRef: 'CASE-2002',
    },
    {
      id: 'evt-012',
      title: 'Webhook delivery delayed',
      description:
        'KYC provider webhook has not delivered results for investor Epsilon Corp after 45 minutes.',
      category: 'webhook_delivery',
      severity: 'waiting_on_provider',
      readState: 'unread',
      timestamp: new Date(t - 90 * MINUTE_MS).toISOString(),
      actor: 'System',
      actorType: 'system',
      nextAction:
        'Wait for provider delivery. If not received within 2 hours, check provider status page.',
      drillDownPath: null,
      isLaunchBlocking: false,
      caseRef: 'CASE-2003',
    },
    {
      id: 'evt-013',
      title: 'Release evidence freshness expired',
      description:
        'Release evidence package for Token Alpha has not been refreshed in over 7 days. Evidence may be stale.',
      category: 'release_evidence',
      severity: 'action_needed',
      readState: 'read',
      // Always 173 hours ago (~7.2 days) → critical freshness bucket
      timestamp: new Date(t - 173 * HOUR_MS).toISOString(),
      actor: 'System',
      actorType: 'automation',
      nextAction: 'Regenerate release evidence package from the Release Evidence Center.',
      drillDownPath: '/compliance/release',
      isLaunchBlocking: true,
      caseRef: null,
    },
    {
      id: 'evt-014',
      title: 'Investor onboarding completed',
      description:
        'All compliance checks for investor Zeta Partners passed. Ready for token allocation.',
      category: 'investor_onboarding',
      severity: 'review_complete',
      readState: 'read',
      timestamp: new Date(t - 3 * HOUR_MS).toISOString(),
      actor: 'compliance-lead@biatec.io',
      actorType: 'operator',
      nextAction: 'No action required. Investor cleared for allocation.',
      drillDownPath: '/compliance/onboarding',
      isLaunchBlocking: false,
      caseRef: 'CASE-2004',
    },
    {
      id: 'evt-015',
      title: 'KYC approved — standard review',
      description:
        'Investor Eta Holdings passed standard KYC review. Identity documents verified by provider.',
      category: 'kyc_review',
      severity: 'informational',
      readState: 'read',
      timestamp: new Date(t - 3.5 * HOUR_MS).toISOString(),
      actor: 'kyc-provider@external.com',
      actorType: 'provider',
      nextAction: null,
      drillDownPath: '/compliance/onboarding',
      isLaunchBlocking: false,
      caseRef: 'CASE-2005',
    },
    {
      id: 'evt-016',
      title: 'AML screening completed — no flags',
      description:
        'Automated AML screening returned clean results for investor Theta Corp. No further action needed.',
      category: 'aml_screening',
      severity: 'informational',
      readState: 'read',
      timestamp: new Date(t - 4 * HOUR_MS).toISOString(),
      actor: 'System',
      actorType: 'system',
      nextAction: null,
      drillDownPath: null,
      isLaunchBlocking: false,
      caseRef: 'CASE-2006',
    },
  ]
}

/**
 * Build timeline entries with timestamps relative to `anchor` so that
 * the "Today" / "Yesterday" grouping stays stable regardless of run date.
 *
 * Groups:
 *   Today    (3 entries): tl-001 (10 min), tl-002 (30 min), tl-003 (5 hours)
 *   Yesterday (1 entry): tl-004 (23 hours)
 */
export function buildMockTimelineEntries(anchor: Date = new Date()): TimelineEntry[] {
  const t = anchor.getTime()
  return [
    {
      id: 'tl-001',
      timestamp: new Date(t - 10 * MINUTE_MS).toISOString(),
      actor: 'compliance-analyst@biatec.io',
      actorType: 'operator',
      transition: 'KYC status changed: Pending Review → Approved',
      description: 'Identity verification documents reviewed and accepted.',
      nextAction: null,
      category: 'kyc_review',
      severity: 'review_complete',
    },
    {
      id: 'tl-002',
      timestamp: new Date(t - 30 * MINUTE_MS).toISOString(),
      actor: 'System',
      actorType: 'system',
      transition: 'AML screening completed',
      description: 'Automated screening returned no flags for this investor.',
      nextAction: null,
      category: 'aml_screening',
      severity: 'informational',
    },
    {
      id: 'tl-003',
      timestamp: new Date(t - 5 * HOUR_MS).toISOString(),
      actor: 'onboarding-team@biatec.io',
      actorType: 'operator',
      transition: 'Onboarding case created',
      description: 'New investor onboarding case initiated for compliance review.',
      nextAction: 'Submit identity documents for KYC verification.',
      category: 'investor_onboarding',
      severity: 'action_needed',
    },
    {
      id: 'tl-004',
      timestamp: new Date(t - 23 * HOUR_MS).toISOString(),
      actor: 'System',
      actorType: 'automation',
      transition: 'Evidence package scheduled',
      description: 'Quarterly evidence export scheduled for compliance reporting.',
      nextAction: 'Review evidence package when generated.',
      category: 'evidence_export',
      severity: 'informational',
    },
  ]
}

export const MOCK_EVENTS_HEALTHY: ComplianceEvent[] = [
  {
    id: 'evt-001',
    title: 'Investor KYC approved',
    description: 'KYC review for Acme Corp investor completed and approved by compliance analyst.',
    category: 'kyc_review',
    severity: 'review_complete',
    readState: 'unread',
    timestamp: '2026-03-27T14:50:00.000Z',
    actor: 'compliance-analyst@biatec.io',
    actorType: 'operator',
    nextAction: 'No action required. Investor can proceed to onboarding.',
    drillDownPath: '/compliance/onboarding',
    isLaunchBlocking: false,
    caseRef: 'CASE-1001',
  },
  {
    id: 'evt-002',
    title: 'AML screening clear',
    description: 'Automated AML screening completed with no flags for investor Beta Ltd.',
    category: 'aml_screening',
    severity: 'informational',
    readState: 'read',
    timestamp: '2026-03-27T14:30:00.000Z',
    actor: 'System',
    actorType: 'system',
    nextAction: 'No action required.',
    drillDownPath: null,
    isLaunchBlocking: false,
    caseRef: 'CASE-1002',
  },
  {
    id: 'evt-003',
    title: 'Evidence package generated',
    description: 'Compliance evidence package for Q1 2026 generated and ready for export.',
    category: 'evidence_export',
    severity: 'informational',
    readState: 'read',
    timestamp: '2026-03-27T13:00:00.000Z',
    actor: 'System',
    actorType: 'automation',
    nextAction: 'Review and download evidence package from the Evidence Center.',
    drillDownPath: '/compliance/evidence',
    isLaunchBlocking: false,
    caseRef: null,
  },
]

export const MOCK_EVENTS_MIXED: ComplianceEvent[] = [
  {
    id: 'evt-010',
    title: 'Sanctions screening escalation opened',
    description:
      'Investor Gamma Holdings matched a watchlist entry. Manual review required before onboarding can continue.',
    category: 'sanctions_escalation',
    severity: 'blocked',
    readState: 'unread',
    timestamp: '2026-03-27T14:45:00.000Z',
    actor: 'System',
    actorType: 'system',
    nextAction: 'Review sanctions match and either clear or escalate to compliance lead.',
    drillDownPath: '/compliance/operations',
    isLaunchBlocking: true,
    caseRef: 'CASE-2001',
  },
  {
    id: 'evt-011',
    title: 'KYC document resubmission needed',
    description:
      'Identity document for Delta Fund investor was rejected due to low quality. Awaiting resubmission.',
    category: 'kyc_review',
    severity: 'action_needed',
    readState: 'unread',
    timestamp: '2026-03-27T14:20:00.000Z',
    actor: 'kyc-provider@external.com',
    actorType: 'provider',
    nextAction: 'Contact investor to request higher-quality identity document.',
    drillDownPath: '/compliance/onboarding',
    isLaunchBlocking: false,
    caseRef: 'CASE-2002',
  },
  {
    id: 'evt-012',
    title: 'Webhook delivery delayed',
    description:
      'KYC provider webhook has not delivered results for investor Epsilon Corp after 45 minutes.',
    category: 'webhook_delivery',
    severity: 'waiting_on_provider',
    readState: 'unread',
    timestamp: '2026-03-27T13:30:00.000Z',
    actor: 'System',
    actorType: 'system',
    nextAction:
      'Wait for provider delivery. If not received within 2 hours, check provider status page.',
    drillDownPath: null,
    isLaunchBlocking: false,
    caseRef: 'CASE-2003',
  },
  {
    id: 'evt-013',
    title: 'Release evidence freshness expired',
    description:
      'Release evidence package for Token Alpha has not been refreshed in over 7 days. Evidence may be stale.',
    category: 'release_evidence',
    severity: 'action_needed',
    readState: 'read',
    timestamp: '2026-03-20T10:00:00.000Z',
    actor: 'System',
    actorType: 'automation',
    nextAction: 'Regenerate release evidence package from the Release Evidence Center.',
    drillDownPath: '/compliance/release',
    isLaunchBlocking: true,
    caseRef: null,
  },
  {
    id: 'evt-014',
    title: 'Investor onboarding completed',
    description:
      'All compliance checks for investor Zeta Partners passed. Ready for token allocation.',
    category: 'investor_onboarding',
    severity: 'review_complete',
    readState: 'read',
    timestamp: '2026-03-27T12:00:00.000Z',
    actor: 'compliance-lead@biatec.io',
    actorType: 'operator',
    nextAction: 'No action required. Investor cleared for allocation.',
    drillDownPath: '/compliance/onboarding',
    isLaunchBlocking: false,
    caseRef: 'CASE-2004',
  },
  {
    id: 'evt-015',
    title: 'KYC approved — standard review',
    description:
      'Investor Eta Holdings passed standard KYC review. Identity documents verified by provider.',
    category: 'kyc_review',
    severity: 'informational',
    readState: 'read',
    timestamp: '2026-03-27T11:30:00.000Z',
    actor: 'kyc-provider@external.com',
    actorType: 'provider',
    nextAction: null,
    drillDownPath: '/compliance/onboarding',
    isLaunchBlocking: false,
    caseRef: 'CASE-2005',
  },
  {
    id: 'evt-016',
    title: 'AML screening completed — no flags',
    description:
      'Automated AML screening returned clean results for investor Theta Corp. No further action needed.',
    category: 'aml_screening',
    severity: 'informational',
    readState: 'read',
    timestamp: '2026-03-27T11:00:00.000Z',
    actor: 'System',
    actorType: 'system',
    nextAction: null,
    drillDownPath: null,
    isLaunchBlocking: false,
    caseRef: 'CASE-2006',
  },
]

export const MOCK_EVENTS_DEGRADED: ComplianceEvent[] = []

export const MOCK_TIMELINE_ENTRIES: TimelineEntry[] = [
  {
    id: 'tl-001',
    timestamp: '2026-03-27T14:50:00.000Z',
    actor: 'compliance-analyst@biatec.io',
    actorType: 'operator',
    transition: 'KYC status changed: Pending Review → Approved',
    description: 'Identity verification documents reviewed and accepted.',
    nextAction: null,
    category: 'kyc_review',
    severity: 'review_complete',
  },
  {
    id: 'tl-002',
    timestamp: '2026-03-27T14:30:00.000Z',
    actor: 'System',
    actorType: 'system',
    transition: 'AML screening completed',
    description: 'Automated screening returned no flags for this investor.',
    nextAction: null,
    category: 'aml_screening',
    severity: 'informational',
  },
  {
    id: 'tl-003',
    timestamp: '2026-03-27T10:00:00.000Z',
    actor: 'onboarding-team@biatec.io',
    actorType: 'operator',
    transition: 'Onboarding case created',
    description: 'New investor onboarding case initiated for compliance review.',
    nextAction: 'Submit identity documents for KYC verification.',
    category: 'investor_onboarding',
    severity: 'action_needed',
  },
  {
    id: 'tl-004',
    timestamp: '2026-03-26T16:00:00.000Z',
    actor: 'System',
    actorType: 'automation',
    transition: 'Evidence package scheduled',
    description: 'Quarterly evidence export scheduled for compliance reporting.',
    nextAction: 'Review evidence package when generated.',
    category: 'evidence_export',
    severity: 'informational',
  },
]
