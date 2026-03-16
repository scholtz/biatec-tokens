/**
 * Compliance Case Management API Client
 *
 * Typed TypeScript client for the compliance case management and ongoing
 * monitoring endpoints. Connects the investor onboarding workspace and
 * approval cockpit to live backend case data.
 *
 * Endpoints:
 *   GET  /api/v1/compliance/cases               — list compliance cases with filters
 *   GET  /api/v1/compliance/cases/{id}           — get single case detail
 *   GET  /api/v1/compliance/cases/{id}/evidence  — get evidence items for a case
 *   GET  /api/v1/compliance/cohorts/{id}/readiness — get cohort launch-readiness summary
 *   GET  /api/v1/compliance/monitoring/dashboard  — get operator dashboard summary
 *   POST /api/v1/compliance/cases/{id}/remediation — submit remediation action
 *
 * Auth: All endpoints require a Bearer token from the email/password login flow.
 *
 * Design principles:
 * - Fail-closed: any API error or unexpected response returns a degraded/blocked state,
 *   never a falsely-ready state.
 * - No wallet assumptions. All types use enterprise compliance terminology.
 * - Normalization of backend states to operator language is handled by
 *   complianceCaseNormalizer.ts, not here.
 */

// ---------------------------------------------------------------------------
// Backend case status codes (raw API values)
// ---------------------------------------------------------------------------

/** Raw case status strings returned by the backend API. */
export type BackendCaseStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'AWAITING_DOCUMENTS'
  | 'ESCALATED'
  | 'APPROVED'
  | 'CONDITIONALLY_APPROVED'
  | 'REJECTED'
  | 'STALE'
  | 'ARCHIVED'
  | 'UNKNOWN'

/** Raw risk level codes returned by the backend API. */
export type BackendRiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'UNKNOWN'

/** Raw evidence status codes. */
export type BackendEvidenceStatus =
  | 'PRESENT'
  | 'MISSING'
  | 'STALE'
  | 'PENDING_UPLOAD'
  | 'REJECTED'
  | 'UNKNOWN'

/** Raw jurisdiction outcome codes. */
export type BackendJurisdictionOutcome =
  | 'PERMITTED'
  | 'RESTRICTED'
  | 'PROHIBITED'
  | 'UNDER_REVIEW'
  | 'UNKNOWN'

/** Raw screening outcome codes. */
export type BackendScreeningOutcome =
  | 'CLEAR'
  | 'FLAGGED'
  | 'WATCHLIST_HIT'
  | 'SANCTIONS_HIT'
  | 'PENDING'
  | 'UNKNOWN'

// ---------------------------------------------------------------------------
// Evidence item
// ---------------------------------------------------------------------------

export interface BackendEvidenceItem {
  /** Unique evidence item identifier. */
  id: string
  /** Human-readable document type label. */
  documentType: string
  /** Raw status code. */
  status: BackendEvidenceStatus
  /** ISO 8601 timestamp when this evidence was last verified or uploaded. */
  lastVerifiedAt: string | null
  /** ISO 8601 expiry date if the document has a validity window. */
  expiresAt: string | null
  /** Reviewer who last actioned this item. */
  reviewedBy: string | null
  /** Optional download/view URL for the evidence document. */
  documentUrl: string | null
  /** Human-readable notes from the reviewer. */
  reviewerNotes: string | null
}

// ---------------------------------------------------------------------------
// Remediation task
// ---------------------------------------------------------------------------

export interface BackendRemediationTask {
  /** Unique task identifier. */
  id: string
  /** Short title describing the remediation action required. */
  title: string
  /** Detailed description of what the operator needs to do. */
  description: string
  /** Whether this task must be completed before the case can advance. */
  isBlocking: boolean
  /** ISO 8601 due date, null if not time-constrained. */
  dueAt: string | null
  /** Identity of the assigned reviewer/operator, null if unassigned. */
  assignedTo: string | null
  /** Current task completion status. */
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'OVERDUE'
}

// ---------------------------------------------------------------------------
// Jurisdiction entry
// ---------------------------------------------------------------------------

export interface BackendJurisdictionEntry {
  /** ISO 3166-1 alpha-2 or alpha-3 country code. */
  jurisdictionCode: string
  /** Human-readable country or region name. */
  jurisdictionName: string
  /** Outcome of the jurisdiction eligibility check. */
  outcome: BackendJurisdictionOutcome
  /** Reason for restriction or prohibition, null if permitted. */
  restrictionReason: string | null
  /** ISO 8601 timestamp of the last jurisdiction policy check. */
  checkedAt: string | null
}

// ---------------------------------------------------------------------------
// Compliance case (list item — lighter payload)
// ---------------------------------------------------------------------------

export interface BackendComplianceCaseListItem {
  /** Unique case identifier. */
  id: string
  /** Display reference number shown to operators. */
  referenceNumber: string
  /** Name of the investor or entity under review. */
  entityName: string
  /** Entity type for display purposes. */
  entityType: 'INDIVIDUAL' | 'CORPORATE' | 'FUND' | 'OTHER'
  /** Current case status. */
  status: BackendCaseStatus
  /** Current risk rating. */
  riskLevel: BackendRiskLevel
  /** KYC screening outcome. */
  kycOutcome: 'APPROVED' | 'PENDING' | 'FAILED' | 'NOT_STARTED' | 'UNKNOWN'
  /** AML screening outcome. */
  amlOutcome: BackendScreeningOutcome
  /** Reviewer/owner assigned to this case. */
  assignedReviewer: string | null
  /** ISO 8601 timestamp of last activity on this case. */
  lastActivityAt: string | null
  /** ISO 8601 timestamp when the case was created. */
  createdAt: string
  /** Whether any blockers on this case prevent launch advancement. */
  hasLaunchBlockers: boolean
  /** Count of open remediation tasks. */
  openTaskCount: number
  /** Whether any evidence is stale or missing. */
  hasStaleEvidence: boolean
}

// ---------------------------------------------------------------------------
// Compliance case (detail — full payload)
// ---------------------------------------------------------------------------

export interface BackendComplianceCaseDetail extends BackendComplianceCaseListItem {
  /** Full KYC review details. */
  kycDetail: {
    verificationMethod: string | null
    verifiedAt: string | null
    verifiedBy: string | null
    discrepancyNotes: string | null
  }
  /** Full AML screening details. */
  amlDetail: {
    screeningProvider: string | null
    screenedAt: string | null
    flagReason: string | null
    resolvedAt: string | null
    resolvedBy: string | null
    escalationNotes: string | null
  }
  /** Jurisdiction eligibility outcomes. */
  jurisdictionEntries: BackendJurisdictionEntry[]
  /** Evidence items attached to this case. */
  evidenceItems: BackendEvidenceItem[]
  /** Open and resolved remediation tasks. */
  remediationTasks: BackendRemediationTask[]
  /** Compliance officer risk notes. */
  riskNotes: string | null
  /** ISO 8601 timestamp when case was last reviewed. */
  lastReviewedAt: string | null
  /** Internal reviewer notes. */
  internalNotes: string | null
}

// ---------------------------------------------------------------------------
// Cohort readiness summary
// ---------------------------------------------------------------------------

/** Launch-readiness summary for a cohort of investors/cases. */
export interface BackendCohortReadiness {
  /** Cohort identifier (e.g. a token launch ID or project ID). */
  cohortId: string
  /** Human-readable cohort name. */
  cohortName: string
  /** Overall readiness status. */
  overallStatus: 'READY' | 'BLOCKED' | 'PARTIALLY_READY' | 'STALE' | 'NOT_STARTED' | 'UNKNOWN'
  /** Total number of cases in the cohort. */
  totalCases: number
  /** Number of fully approved/complete cases. */
  completedCases: number
  /** Number of cases currently blocked. */
  blockedCases: number
  /** Number of cases pending review. */
  pendingCases: number
  /** Number of cases with stale evidence. */
  staleCases: number
  /** Readiness score 0–100. */
  readinessScore: number
  /** List of specific launch-blocking issues at the cohort level. */
  cohortBlockers: Array<{
    id: string
    title: string
    reason: string
    affectedCaseIds: string[]
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
    remediationPath: string | null
  }>
  /** ISO 8601 timestamp of the last cohort readiness computation. */
  computedAt: string
}

// ---------------------------------------------------------------------------
// Monitoring dashboard
// ---------------------------------------------------------------------------

export interface BackendMonitoringDashboard {
  /** Total open compliance cases. */
  openCaseCount: number
  /** Cases flagged as critical risk. */
  criticalRiskCount: number
  /** Cases with overdue remediation tasks. */
  overdueTaskCount: number
  /** Cases with evidence expiring within 14 days. */
  expiringEvidenceCount: number
  /** Cohort-level readiness summaries. */
  cohortSummaries: BackendCohortReadiness[]
  /** ISO 8601 timestamp of dashboard data. */
  asOf: string
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export interface ComplianceCaseApiError {
  /** HTTP status code, e.g. 401, 403, 404, 500. */
  httpStatus: number
  /** Machine-readable error code. */
  errorCode:
    | 'Unauthorized'
    | 'Forbidden'
    | 'NotFound'
    | 'ValidationError'
    | 'ServiceUnavailable'
    | 'NetworkError'
    | 'UnknownError'
  /** Human-readable guidance for the operator UI. */
  userGuidance: string
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ComplianceCaseApiError }

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * Typed client for the compliance case management backend endpoints.
 *
 * All methods return `ApiResult<T>`, never throw. Consumers should treat
 * `ok: false` as a degraded/unavailable state and show the operator a clear
 * message rather than silently pretending data is available.
 */
export class ComplianceCaseManagementClient {
  private readonly baseUrl: string
  private readonly bearerToken: string

  constructor(baseUrl: string, bearerToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.bearerToken = bearerToken
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.bearerToken}`,
    }
  }

  private mapHttpError(status: number, body: unknown): ComplianceCaseApiError {
    if (status === 401) {
      return {
        httpStatus: 401,
        errorCode: 'Unauthorized',
        userGuidance: 'Your session has expired or you are not authorised. Please sign in again.',
      }
    }
    if (status === 403) {
      return {
        httpStatus: 403,
        errorCode: 'Forbidden',
        userGuidance: 'You do not have permission to access compliance case data.',
      }
    }
    if (status === 404) {
      return {
        httpStatus: 404,
        errorCode: 'NotFound',
        userGuidance: 'The requested compliance record was not found.',
      }
    }
    if (status >= 500) {
      return {
        httpStatus: status,
        errorCode: 'ServiceUnavailable',
        userGuidance:
          'The compliance case management service is temporarily unavailable. Case data cannot be trusted until the service recovers. Launch readiness is degraded.',
      }
    }
    const detail = typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message: unknown }).message)
      : undefined
    return {
      httpStatus: status,
      errorCode: 'UnknownError',
      userGuidance: detail ?? 'An unexpected error occurred while loading compliance data.',
    }
  }

  private async fetchJson<T>(path: string): Promise<ApiResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: this.headers(),
      })
      let body: unknown
      try {
        body = await response.json()
      } catch {
        body = null
      }
      if (!response.ok) {
        return { ok: false, error: this.mapHttpError(response.status, body) }
      }
      return { ok: true, data: body as T }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      return {
        ok: false,
        error: {
          httpStatus: 0,
          errorCode: 'NetworkError',
          userGuidance: `Unable to reach the compliance service: ${message}. Please check your connection and try again.`,
        },
      }
    }
  }

  private async postJson<TBody, TResponse>(
    path: string,
    body: TBody,
  ): Promise<ApiResult<TResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      })
      let responseBody: unknown
      try {
        responseBody = await response.json()
      } catch {
        responseBody = null
      }
      if (!response.ok) {
        return { ok: false, error: this.mapHttpError(response.status, responseBody) }
      }
      return { ok: true, data: responseBody as TResponse }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      return {
        ok: false,
        error: {
          httpStatus: 0,
          errorCode: 'NetworkError',
          userGuidance: `Unable to submit remediation action: ${message}.`,
        },
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * List compliance cases, optionally filtered.
   *
   * @param params  Optional query parameters.
   */
  async listCases(params?: {
    cohortId?: string
    status?: BackendCaseStatus
    riskLevel?: BackendRiskLevel
    hasLaunchBlockers?: boolean
    pageSize?: number
    page?: number
  }): Promise<ApiResult<{ cases: BackendComplianceCaseListItem[]; totalCount: number; page: number; pageSize: number }>> {
    const query = new URLSearchParams()
    if (params?.cohortId) query.set('cohortId', params.cohortId)
    if (params?.status) query.set('status', params.status)
    if (params?.riskLevel) query.set('riskLevel', params.riskLevel)
    if (params?.hasLaunchBlockers !== undefined) query.set('hasLaunchBlockers', String(params.hasLaunchBlockers))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    if (params?.page) query.set('page', String(params.page))
    const qs = query.toString()
    return this.fetchJson(`/api/v1/compliance/cases${qs ? `?${qs}` : ''}`)
  }

  /**
   * Get the full detail record for a single compliance case.
   *
   * @param caseId  The unique case identifier.
   */
  async getCase(caseId: string): Promise<ApiResult<BackendComplianceCaseDetail>> {
    return this.fetchJson(`/api/v1/compliance/cases/${encodeURIComponent(caseId)}`)
  }

  /**
   * Get evidence items for a specific compliance case.
   *
   * @param caseId  The unique case identifier.
   */
  async getCaseEvidence(caseId: string): Promise<ApiResult<{ items: BackendEvidenceItem[] }>> {
    return this.fetchJson(`/api/v1/compliance/cases/${encodeURIComponent(caseId)}/evidence`)
  }

  /**
   * Get the launch-readiness summary for a cohort.
   *
   * @param cohortId  The cohort identifier (typically a token launch project ID).
   */
  async getCohortReadiness(cohortId: string): Promise<ApiResult<BackendCohortReadiness>> {
    return this.fetchJson(`/api/v1/compliance/cohorts/${encodeURIComponent(cohortId)}/readiness`)
  }

  /**
   * Get the operator monitoring dashboard summary.
   * Returns aggregate counts, expiring evidence, and cohort summaries.
   */
  async getMonitoringDashboard(): Promise<ApiResult<BackendMonitoringDashboard>> {
    return this.fetchJson('/api/v1/compliance/monitoring/dashboard')
  }

  /**
   * Submit a remediation action for a compliance case.
   *
   * @param caseId      The unique case identifier.
   * @param taskId      The remediation task being actioned.
   * @param action      The action taken ('RESOLVED' | 'ESCALATED' | 'NOTE_ADDED').
   * @param notes       Optional operator notes attached to the action.
   */
  async submitRemediationAction(
    caseId: string,
    taskId: string,
    action: 'RESOLVED' | 'ESCALATED' | 'NOTE_ADDED',
    notes?: string,
  ): Promise<ApiResult<{ success: boolean; updatedTask: BackendRemediationTask }>> {
    return this.postJson(
      `/api/v1/compliance/cases/${encodeURIComponent(caseId)}/remediation`,
      { taskId, action, notes: notes ?? null },
    )
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a ComplianceCaseManagementClient using the app's runtime configuration.
 *
 * Uses `VITE_API_BASE_URL` when available, falling back to the production API.
 * Returns `null` when no bearer token is provided (unauthenticated context).
 */
export function createComplianceCaseClient(
  bearerToken: string | null | undefined,
): ComplianceCaseManagementClient | null {
  if (!bearerToken) return null
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL as string
    : 'https://api.tokens.biatec.io'
  return new ComplianceCaseManagementClient(baseUrl, bearerToken)
}
