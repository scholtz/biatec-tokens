/**
 * cockpitHardeningAdapter.ts
 *
 * Hardening utilities for the compliance operations cockpit and case drill-down
 * flows. Adds explicit backend-backed state validation: stale data detection,
 * partial hydration scoring, evidence completeness classification, and
 * actionable operator guidance for degraded / partial-data conditions.
 *
 * Design principles
 * -----------------
 * - Fail-loud: stale, incomplete, or unverifiable data must produce visible
 *   operator-facing messaging, never silent fallback.
 * - Actionable: every degraded state includes a clear next-action description.
 * - Auth-classified: auth failures, network failures, and data gaps are
 *   surfaced with distinct messages so operators know who to contact.
 * - No wallet assumptions. Language is enterprise/compliance-oriented.
 *
 * References
 * ----------
 * - Issue #724: Harden compliance operations cockpit with backend-backed case truth
 * - liveComplianceIntegration.ts: upstream data loader
 * - caseDrillDown.ts: evidence group types
 */

import type { EvidenceGroup } from './caseDrillDown'
import type { WorkItem } from './complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Stale data detection
// ---------------------------------------------------------------------------

/** Freshness bands for cockpit data. */
export type StalenessLevel = 'fresh' | 'mild_stale' | 'stale' | 'severely_stale'

/** Threshold in milliseconds for each staleness band. */
export const STALENESS_THRESHOLDS_MS = {
  /** Data younger than this is considered fresh. */
  fresh: 5 * 60 * 1000,        // 5 minutes
  /** Mild stale: data is noticeable out-of-date for active operations. */
  mild_stale: 30 * 60 * 1000,  // 30 minutes
  /** Stale: operators may be working on outdated queue state. */
  stale: 2 * 60 * 60 * 1000,   // 2 hours
  // Beyond stale threshold = severely_stale
} as const

/**
 * Classify how stale cockpit data is based on its fetch timestamp.
 *
 * @param fetchedAt  ISO 8601 timestamp when the data was last fetched.
 * @param now        Current time in ms (defaults to Date.now()).
 * @returns          Staleness level.
 */
export function detectStaleness(fetchedAt: string | null | undefined, now: number = Date.now()): StalenessLevel {
  if (!fetchedAt) return 'severely_stale'
  const fetched = new Date(fetchedAt).getTime()
  if (isNaN(fetched)) return 'severely_stale'

  const ageMs = now - fetched
  if (ageMs < 0) return 'fresh' // clock skew — treat as fresh
  if (ageMs < STALENESS_THRESHOLDS_MS.fresh) return 'fresh'
  if (ageMs < STALENESS_THRESHOLDS_MS.mild_stale) return 'mild_stale'
  if (ageMs < STALENESS_THRESHOLDS_MS.stale) return 'stale'
  return 'severely_stale'
}

/**
 * Human-readable label for a staleness level.
 */
export const STALENESS_LABELS: Record<StalenessLevel, string> = {
  fresh: 'Live data',
  mild_stale: 'Data may be outdated',
  stale: 'Stale data — refresh recommended',
  severely_stale: 'Severely stale — data unreliable',
}

/**
 * Tailwind CSS classes for a staleness badge/indicator.
 */
export function stalenessBadgeClass(level: StalenessLevel): string {
  switch (level) {
    case 'fresh':
      return 'bg-green-900 text-green-200 border border-green-700'
    case 'mild_stale':
      return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'stale':
      return 'bg-orange-900/50 text-orange-300 border border-orange-700'
    case 'severely_stale':
      return 'bg-red-900/50 text-red-300 border border-red-700'
  }
}

/**
 * Whether this staleness level warrants showing a warning banner.
 * Fresh and mild-stale are informational only; stale+ requires visible alert.
 */
export function stalenessRequiresAlert(level: StalenessLevel): boolean {
  return level === 'stale' || level === 'severely_stale'
}

// ---------------------------------------------------------------------------
// Partial hydration scoring
// ---------------------------------------------------------------------------

/**
 * Result of scoring work items for partial hydration.
 * Indicates how many items have missing or incomplete core data.
 */
export interface PartialHydrationScore {
  /** Total number of work items evaluated. */
  totalItems: number
  /** Count of items with complete data. */
  fullyHydratedCount: number
  /** Count of items with missing or incomplete data. */
  partialCount: number
  /** 0–1 ratio of fully hydrated items to total. */
  hydrationRatio: number
  /** True when the ratio falls below the warning threshold. */
  isPartiallyHydrated: boolean
  /** Human-readable description of the partial-hydration condition. */
  reason: string | null
}

/** Ratio below which partial hydration should trigger an operator warning. */
export const PARTIAL_HYDRATION_THRESHOLD = 0.8

/**
 * Score the partial hydration state of the current work queue.
 *
 * "Partial hydration" means some work items are missing fields that the cockpit
 * needs to make authoritative ownership, SLA, or stage decisions. This can
 * happen when the backend returns a subset of data (e.g., 429 throttling),
 * when some items are very recent and not yet fully indexed, or when a
 * sync job has partially failed.
 */
export function scorePartialHydration(workItems: WorkItem[]): PartialHydrationScore {
  if (workItems.length === 0) {
    return {
      totalItems: 0,
      fullyHydratedCount: 0,
      partialCount: 0,
      hydrationRatio: 1,
      isPartiallyHydrated: false,
      reason: null,
    }
  }

  const partialItems = workItems.filter(isWorkItemPartiallyHydrated)
  const fullyHydratedCount = workItems.length - partialItems.length
  const hydrationRatio = fullyHydratedCount / workItems.length
  const isPartiallyHydrated = hydrationRatio < PARTIAL_HYDRATION_THRESHOLD

  const reason = isPartiallyHydrated
    ? `${partialItems.length} of ${workItems.length} work items are missing critical data (ownership, SLA, or stage). Queue metrics may be incomplete.`
    : null

  return {
    totalItems: workItems.length,
    fullyHydratedCount,
    partialCount: partialItems.length,
    hydrationRatio,
    isPartiallyHydrated,
    reason,
  }
}

/**
 * Classify a single WorkItem as partially hydrated.
 * A work item is considered partial when key operational fields are absent.
 */
export function isWorkItemPartiallyHydrated(item: WorkItem): boolean {
  // Ownership must be a defined state
  if (!item.ownership) return true
  // Stage must be present and not generic intake (indicates unprocessed)
  if (!item.stage) return true
  // Title must be more than a bare case ID
  if (!item.title || item.title.trim().length < 5) return true
  return false
}

// ---------------------------------------------------------------------------
// Evidence completeness classification
// ---------------------------------------------------------------------------

/** Evidence completeness level for a case. */
export type EvidenceCompletenessLevel =
  | 'complete'
  | 'minor_gaps'
  | 'significant_gaps'
  | 'critical_gaps'
  | 'unavailable'

export interface EvidenceCompletenessResult {
  level: EvidenceCompletenessLevel
  /** Human-readable label for displaying in the UI. */
  label: string
  /** Tailwind classes for the badge. */
  badgeClass: string
  /** Operator-visible description of what is missing. */
  missingItems: string[]
  /** Actionable guidance for the operator. */
  nextAction: string
}

/**
 * Classify the completeness of evidence groups for a case.
 *
 * Uses each group's pre-derived `overallStatus` (from caseDrillDown.ts) to
 * produce a prioritised completeness level:
 *   degraded  → critical_gaps  (backend data unavailable for that group)
 *   missing   → significant_gaps (required evidence not yet submitted/present)
 *   stale     → minor_gaps     (evidence exists but may be outdated)
 *   available → complete
 *
 * Also collects item-level detail for operator-visible missing-item lists.
 */
export function classifyEvidenceCompleteness(groups: EvidenceGroup[]): EvidenceCompletenessResult {
  if (groups.length === 0) {
    return {
      level: 'unavailable',
      label: 'Evidence unavailable',
      badgeClass: 'bg-gray-800 text-gray-400 border border-gray-600',
      missingItems: ['All evidence groups failed to load'],
      nextAction:
        'Check backend connectivity or contact your platform administrator. Do not approve this case until evidence is confirmed.',
    }
  }

  // Collect item-level descriptions for the missing-item display list
  const missingItems: string[] = []
  let totalItems = 0

  for (const group of groups) {
    for (const item of group.items) {
      totalItems++
      if (item.status === 'missing' || item.status === 'degraded') {
        missingItems.push(`${group.label}: ${item.label}`)
      }
    }
  }

  if (totalItems === 0) {
    return {
      level: 'unavailable',
      label: 'Evidence unavailable',
      badgeClass: 'bg-gray-800 text-gray-400 border border-gray-600',
      missingItems: ['No evidence records found'],
      nextAction:
        'Request the investor to upload required documents, or contact support if this error persists.',
    }
  }

  // Priority 1 — any group has degraded overall status (backend completely unavailable)
  const degradedGroups = groups.filter((g) => g.overallStatus === 'degraded')
  if (degradedGroups.length > 0) {
    return {
      level: 'critical_gaps',
      label: `Critical: evidence data unavailable (${degradedGroups.length} group${degradedGroups.length !== 1 ? 's' : ''})`,
      badgeClass: 'bg-red-900/50 text-red-300 border border-red-700',
      missingItems,
      nextAction: `${degradedGroups.length} evidence group(s) could not be loaded from the backend. This case cannot be approved until all evidence is accessible. Check backend connectivity and contact your platform administrator.`,
    }
  }

  // Priority 2 — any group has missing overall status (required docs not present)
  const missingGroups = groups.filter((g) => g.overallStatus === 'missing')
  if (missingGroups.length > 0) {
    return {
      level: 'significant_gaps',
      label: `Evidence missing in ${missingGroups.length} group${missingGroups.length !== 1 ? 's' : ''}`,
      badgeClass: 'bg-orange-900/50 text-orange-300 border border-orange-700',
      missingItems,
      nextAction: `${missingGroups.length} evidence group(s) have missing documents. Review each group below and contact the investor or your AML provider to resolve the gaps before proceeding.`,
    }
  }

  // Priority 3 — some evidence is stale (exists but may be outdated)
  const staleGroups = groups.filter((g) => g.overallStatus === 'stale')
  if (staleGroups.length > 0) {
    const staleItems = groups.flatMap((g) =>
      g.items.filter((i) => i.status === 'stale').map((i) => `${g.label}: ${i.label}`),
    )
    return {
      level: 'minor_gaps',
      label: `${staleGroups.length} evidence group${staleGroups.length !== 1 ? 's' : ''} may be outdated`,
      badgeClass: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
      missingItems: staleItems,
      nextAction: `${staleGroups.length} evidence group(s) contain stale data. Verify with the investor and refresh stale documents before making an approval decision.`,
    }
  }

  return {
    level: 'complete',
    label: 'All evidence confirmed',
    badgeClass: 'bg-green-900/40 text-green-300 border border-green-700',
    missingItems: [],
    nextAction: 'All evidence groups are complete and verified. This case is ready for the next approval stage.',
  }
}

// ---------------------------------------------------------------------------
// Degraded state operator guidance
// ---------------------------------------------------------------------------

/** Urgency level for an operator guidance message. */
export type GuidanceUrgency = 'critical' | 'high' | 'medium' | 'low'

/**
 * Actionable operator guidance for degraded / partial-data cockpit states.
 * Provides: headline, detail, specific next action, and urgency classification.
 */
export interface OperatorGuidance {
  headline: string
  detail: string
  nextAction: string
  urgency: GuidanceUrgency
  /** CSS classes for the guidance panel. */
  panelClass: string
}

/** Error classification for backend failures. */
export type BackendErrorKind =
  | 'auth_missing'
  | 'auth_expired'
  | 'auth_forbidden'
  | 'network_failure'
  | 'timeout'
  | 'server_error'
  | 'partial_data'
  | 'unknown'

/**
 * Classify a backend error message into a structured error kind.
 * Used to produce distinct operator-visible messages per failure type.
 */
export function classifyBackendError(errorMessage: string | null | undefined): BackendErrorKind {
  if (!errorMessage) return 'unknown'
  const msg = errorMessage.toLowerCase()
  if (msg.includes('no authentication') || msg.includes('no bearer') || msg.includes('no token')) return 'auth_missing'
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('token expired') || msg.includes('session expired')) return 'auth_expired'
  if (msg.includes('403') || msg.includes('forbidden') || msg.includes('access denied')) return 'auth_forbidden'
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('408')) return 'timeout'
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection') || msg.includes('econnrefused')) return 'network_failure'
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('server error')) return 'server_error'
  if (msg.includes('partial') || msg.includes('incomplete') || msg.includes('not all')) return 'partial_data'
  return 'unknown'
}

/**
 * Build actionable operator guidance for a degraded cockpit state.
 *
 * Takes the degradation reason (from liveComplianceIntegration) and produces
 * a structured guidance object the operator can act on.
 */
export function buildDegradedOperatorGuidance(
  degradedReason: string | null | undefined,
  isPartiallyHydrated = false,
): OperatorGuidance {
  const kind = classifyBackendError(degradedReason)

  switch (kind) {
    case 'auth_missing':
      return {
        headline: 'Authentication required to load live data',
        detail: 'Your session may have expired or you are not signed in. The queue shown below is a read-only preview with fixed sample data.',
        nextAction: 'Sign out and sign back in to restore live backend connectivity. If the issue persists, contact your platform administrator.',
        urgency: 'high',
        panelClass: 'border-blue-700 bg-blue-900/20',
      }
    case 'auth_expired':
      return {
        headline: 'Session expired — live data unavailable',
        detail: 'Your authentication session has expired. Queue data shown below is from the last known state and may be out of date.',
        nextAction: 'Sign out and sign back in to restore live backend access. Do not make approval decisions based on expired session data.',
        urgency: 'critical',
        panelClass: 'border-red-700 bg-red-900/20',
      }
    case 'auth_forbidden':
      return {
        headline: 'Access denied to compliance case data',
        detail: 'Your account does not have permission to access the compliance case management API. You may be viewing a restricted queue.',
        nextAction: 'Contact your platform administrator to confirm your role permissions. Do not rely on this data for compliance decisions.',
        urgency: 'critical',
        panelClass: 'border-red-700 bg-red-900/20',
      }
    case 'timeout':
      return {
        headline: 'Backend data request timed out',
        detail: 'The compliance case API did not respond in time. Queue data below may be incomplete or from a previous load.',
        nextAction: 'Wait a moment and use the Refresh button to try again. If the timeout persists, contact your platform administrator.',
        urgency: 'high',
        panelClass: 'border-yellow-700 bg-yellow-900/20',
      }
    case 'network_failure':
      return {
        headline: 'Unable to reach compliance backend',
        detail: 'Network connectivity to the case management API is unavailable. Queue data shown is a placeholder and not operationally reliable.',
        nextAction: 'Check your network connection and use the Refresh button. If the issue persists, contact your platform administrator.',
        urgency: 'high',
        panelClass: 'border-yellow-700 bg-yellow-900/20',
      }
    case 'server_error':
      return {
        headline: 'Compliance backend returned a server error',
        detail: 'The case management API returned an error response. Queue data may be incomplete or unavailable.',
        nextAction: 'Use the Refresh button to retry. If the error persists, contact support and include the error details from the log.',
        urgency: 'high',
        panelClass: 'border-orange-700 bg-orange-900/20',
      }
    case 'partial_data':
      return {
        headline: 'Partial data loaded — some cases may be missing',
        detail: 'The backend returned an incomplete dataset. Not all work items could be loaded. Queue metrics may undercount the actual workload.',
        nextAction: 'Use the Refresh button to attempt a full reload. If partial data persists, contact your platform administrator to investigate the backend sync status.',
        urgency: 'medium',
        panelClass: 'border-yellow-700 bg-yellow-900/20',
      }
    default: {
      if (isPartiallyHydrated) {
        return {
          headline: 'Queue data is incomplete',
          detail: 'Some work items are missing key fields (ownership, SLA, or stage). Queue metrics below may not reflect the full operational picture.',
          nextAction: 'Use the Refresh button to reload. If the problem persists, check the backend sync status or contact your administrator.',
          urgency: 'medium',
          panelClass: 'border-yellow-700 bg-yellow-900/20',
        }
      }
      return {
        headline: 'Operations cockpit is in degraded mode',
        detail: degradedReason ?? 'Some queue metrics or work items may be unavailable or incomplete. Queue data shown is based on available frontend-derived state.',
        nextAction: 'Use the Refresh button to attempt to restore live data. If the issue persists, contact your platform administrator.',
        urgency: 'medium',
        panelClass: 'border-gray-600 bg-gray-800',
      }
    }
  }
}

/**
 * Build escalation-specific error guidance for modal error messages.
 * Translates raw API error messages into operator-friendly language.
 */
export function buildEscalationErrorGuidance(errorMessage: string | null | undefined): {
  headline: string
  detail: string
  isRetryable: boolean
} {
  const kind = classifyBackendError(errorMessage)

  switch (kind) {
    case 'auth_missing':
    case 'auth_expired':
      return {
        headline: 'Authentication required',
        detail: 'Your session has expired or you are not signed in. Please sign in and try again.',
        isRetryable: false,
      }
    case 'auth_forbidden':
      return {
        headline: 'Insufficient permissions',
        detail: 'Your account does not have permission to submit escalations. Contact your platform administrator.',
        isRetryable: false,
      }
    case 'timeout':
      return {
        headline: 'Request timed out',
        detail: 'The escalation request took too long. This may be a temporary backend issue. Please try again.',
        isRetryable: true,
      }
    case 'network_failure':
      return {
        headline: 'Network error',
        detail: 'Could not reach the escalation API. Check your connection and try again.',
        isRetryable: true,
      }
    default:
      return {
        headline: 'Escalation submission failed',
        detail: errorMessage ?? 'An unexpected error occurred. Please try again or contact support.',
        isRetryable: true,
      }
  }
}

// ---------------------------------------------------------------------------
// Data freshness label helpers (for the cockpit header)
// ---------------------------------------------------------------------------

/**
 * Format a human-readable freshness label for the "Last refreshed" area.
 * Includes how long ago the data was fetched.
 */
export function formatDataFreshnessLabel(fetchedAt: string | null | undefined, now: number = Date.now()): {
  label: string
  staleness: StalenessLevel
  ageMinutes: number | null
} {
  if (!fetchedAt) {
    return { label: 'Unknown', staleness: 'severely_stale', ageMinutes: null }
  }
  const fetched = new Date(fetchedAt).getTime()
  if (isNaN(fetched)) {
    return { label: 'Unknown', staleness: 'severely_stale', ageMinutes: null }
  }

  const ageMs = Math.max(0, now - fetched)
  const ageMinutes = Math.floor(ageMs / 60_000)
  const staleness = detectStaleness(fetchedAt, now)

  let label: string
  if (ageMinutes < 1) {
    label = 'Just now'
  } else if (ageMinutes < 60) {
    label = `${ageMinutes}m ago`
  } else {
    const ageHours = Math.floor(ageMinutes / 60)
    label = `${ageHours}h ago`
  }

  return { label, staleness, ageMinutes }
}

// ---------------------------------------------------------------------------
// COCKPIT_HARDENING_TEST_IDS
// Canonical data-testid constants for hardened UI elements.
// E2E tests must use these exact strings.
// ---------------------------------------------------------------------------

export const COCKPIT_HARDENING_TEST_IDS = {
  /** Stale data warning banner (shown when data is stale but not fully degraded). */
  STALE_DATA_BANNER: 'cockpit-stale-data-banner',
  /** Staleness badge in the page header. */
  STALENESS_BADGE: 'cockpit-staleness-badge',
  /** Partial hydration warning (some items missing fields). */
  PARTIAL_HYDRATION_NOTICE: 'cockpit-partial-hydration-notice',
  /** Enhanced degraded guidance panel. */
  DEGRADED_GUIDANCE_PANEL: 'cockpit-degraded-guidance-panel',
  /** Specific next-action text inside the degraded guidance panel. */
  DEGRADED_NEXT_ACTION: 'cockpit-degraded-next-action',
  /** Evidence completeness badge in the drill-down panel. */
  EVIDENCE_COMPLETENESS_BADGE: 'drill-evidence-completeness-badge',
  /** Missing evidence list in drill-down. */
  MISSING_EVIDENCE_LIST: 'drill-missing-evidence-list',
  /** Individual missing evidence item. */
  MISSING_EVIDENCE_ITEM: 'drill-missing-evidence-item',
  /** Escalation error guidance panel inside the modal. */
  ESCALATION_ERROR_GUIDANCE: 'escalation-error-guidance',
  /** Escalation error retry button. */
  ESCALATION_ERROR_RETRY_BTN: 'escalation-error-retry-btn',
} as const

export type CockpitHardeningTestId = typeof COCKPIT_HARDENING_TEST_IDS[keyof typeof COCKPIT_HARDENING_TEST_IDS]
