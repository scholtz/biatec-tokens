/**
 * Unit Tests — ComplianceCaseManagementClient
 *
 * Tests cover:
 * - listCases, getCase, getCaseEvidence, getCohortReadiness, getMonitoringDashboard
 * - submitRemediationAction (POST)
 * - HTTP error mapping (401, 403, 404, 500, network failure)
 * - Query parameter building for listCases
 * - Fail-closed: error states return ok:false with guidance, not ok:true
 * - createComplianceCaseClient factory (null when no bearer token)
 * - mapHttpError edge cases
 *
 * Mock strategy: global `fetch` is replaced per test with vi.stubGlobal.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  ComplianceCaseManagementClient,
  createComplianceCaseClient,
} from '../complianceCaseManagement'
import type {
  BackendComplianceCaseListItem,
  BackendComplianceCaseDetail,
  BackendCohortReadiness,
  BackendMonitoringDashboard,
} from '../complianceCaseManagement'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchOk(body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
}

function makeFetchError(status: number, body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  })
}

function makeFetchNetworkError(message: string): ReturnType<typeof vi.fn> {
  return vi.fn().mockRejectedValue(new Error(message))
}

const BASE = 'https://api.test.biatec.io'
const TOKEN = 'test-bearer-token'

function makeClient(): ComplianceCaseManagementClient {
  return new ComplianceCaseManagementClient(BASE, TOKEN)
}

const MOCK_CASE_LIST_ITEM: BackendComplianceCaseListItem = {
  id: 'case-001',
  referenceNumber: 'REF-001',
  entityName: 'ACME Holdings',
  entityType: 'CORPORATE',
  status: 'UNDER_REVIEW',
  riskLevel: 'MEDIUM',
  kycOutcome: 'APPROVED',
  amlOutcome: 'CLEAR',
  assignedReviewer: 'Jane Compliance',
  lastActivityAt: '2025-11-01T10:00:00Z',
  createdAt: '2025-10-01T09:00:00Z',
  hasLaunchBlockers: false,
  openTaskCount: 0,
  hasStaleEvidence: false,
}

const MOCK_COHORT_READINESS: BackendCohortReadiness = {
  cohortId: 'cohort-001',
  cohortName: 'Token Launch Alpha',
  overallStatus: 'BLOCKED',
  totalCases: 10,
  completedCases: 7,
  blockedCases: 2,
  pendingCases: 1,
  staleCases: 0,
  readinessScore: 70,
  cohortBlockers: [
    {
      id: 'blk-001',
      title: 'KYC missing for 2 entities',
      reason: 'Two investors have not submitted required KYC documents.',
      affectedCaseIds: ['case-001', 'case-002'],
      severity: 'HIGH',
      remediationPath: '/compliance/setup',
    },
  ],
  computedAt: '2025-11-01T12:00:00Z',
}

const MOCK_DASHBOARD: BackendMonitoringDashboard = {
  openCaseCount: 5,
  criticalRiskCount: 1,
  overdueTaskCount: 2,
  expiringEvidenceCount: 3,
  cohortSummaries: [MOCK_COHORT_READINESS],
  asOf: '2025-11-01T12:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ComplianceCaseManagementClient', () => {

  // ── listCases ──────────────────────────────────────────────────────────────

  describe('listCases', () => {
    it('returns paginated case list on success', async () => {
      const body = { cases: [MOCK_CASE_LIST_ITEM], totalCount: 1, page: 1, pageSize: 20 }
      vi.stubGlobal('fetch', makeFetchOk(body))
      const result = await makeClient().listCases()
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.cases).toHaveLength(1)
      expect(result.data.cases[0].id).toBe('case-001')
    })

    it('builds correct query string when filters provided', async () => {
      const body = { cases: [], totalCount: 0, page: 1, pageSize: 10 }
      const mockFetch = makeFetchOk(body)
      vi.stubGlobal('fetch', mockFetch)
      await makeClient().listCases({ cohortId: 'c1', status: 'BLOCKED', riskLevel: 'HIGH', hasLaunchBlockers: true, pageSize: 10, page: 2 })
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('cohortId=c1')
      expect(url).toContain('status=BLOCKED')
      expect(url).toContain('riskLevel=HIGH')
      expect(url).toContain('hasLaunchBlockers=true')
      expect(url).toContain('pageSize=10')
      expect(url).toContain('page=2')
    })

    it('returns ok:false on 401', async () => {
      vi.stubGlobal('fetch', makeFetchError(401, {}))
      const result = await makeClient().listCases()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('Unauthorized')
      expect(result.error.httpStatus).toBe(401)
    })

    it('returns ok:false on 403', async () => {
      vi.stubGlobal('fetch', makeFetchError(403, {}))
      const result = await makeClient().listCases()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('Forbidden')
    })

    it('returns ok:false on 500 (service unavailable)', async () => {
      vi.stubGlobal('fetch', makeFetchError(500, {}))
      const result = await makeClient().listCases()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('ServiceUnavailable')
      expect(result.error.userGuidance).toContain('temporarily unavailable')
    })

    it('returns ok:false on network error with guidance', async () => {
      vi.stubGlobal('fetch', makeFetchNetworkError('ECONNREFUSED'))
      const result = await makeClient().listCases()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('NetworkError')
      expect(result.error.userGuidance).toContain('Unable to reach')
    })
  })

  // ── getCase ────────────────────────────────────────────────────────────────

  describe('getCase', () => {
    it('returns case detail on success', async () => {
      const detail: BackendComplianceCaseDetail = {
        ...MOCK_CASE_LIST_ITEM,
        kycDetail: { verificationMethod: 'eKYC', verifiedAt: '2025-10-15T10:00:00Z', verifiedBy: 'Jane', discrepancyNotes: null },
        amlDetail: { screeningProvider: 'Provider X', screenedAt: '2025-10-15T11:00:00Z', flagReason: null, resolvedAt: null, resolvedBy: null, escalationNotes: null },
        jurisdictionEntries: [],
        evidenceItems: [],
        remediationTasks: [],
        riskNotes: null,
        lastReviewedAt: '2025-10-20T00:00:00Z',
        internalNotes: null,
      }
      vi.stubGlobal('fetch', makeFetchOk(detail))
      const result = await makeClient().getCase('case-001')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.id).toBe('case-001')
    })

    it('returns ok:false on 404', async () => {
      vi.stubGlobal('fetch', makeFetchError(404, { message: 'Not found' }))
      const result = await makeClient().getCase('case-999')
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('NotFound')
    })

    it('URL-encodes the case ID', async () => {
      const mockFetch = makeFetchOk({})
      vi.stubGlobal('fetch', mockFetch)
      await makeClient().getCase('case id with spaces')
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('case%20id%20with%20spaces')
    })
  })

  // ── getCaseEvidence ─────────────────────────────────────────────────────────

  describe('getCaseEvidence', () => {
    it('returns evidence items on success', async () => {
      const body = { items: [{ id: 'ev-001', documentType: 'Passport', status: 'PRESENT', lastVerifiedAt: '2025-10-01T00:00:00Z', expiresAt: null, reviewedBy: 'Jane', documentUrl: null, reviewerNotes: null }] }
      vi.stubGlobal('fetch', makeFetchOk(body))
      const result = await makeClient().getCaseEvidence('case-001')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.items).toHaveLength(1)
    })

    it('returns ok:false on 500', async () => {
      vi.stubGlobal('fetch', makeFetchError(500, {}))
      const result = await makeClient().getCaseEvidence('case-001')
      expect(result.ok).toBe(false)
    })
  })

  // ── getCohortReadiness ──────────────────────────────────────────────────────

  describe('getCohortReadiness', () => {
    it('returns cohort readiness on success', async () => {
      vi.stubGlobal('fetch', makeFetchOk(MOCK_COHORT_READINESS))
      const result = await makeClient().getCohortReadiness('cohort-001')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.cohortId).toBe('cohort-001')
      expect(result.data.overallStatus).toBe('BLOCKED')
    })

    it('URL-encodes the cohort ID', async () => {
      const mockFetch = makeFetchOk(MOCK_COHORT_READINESS)
      vi.stubGlobal('fetch', mockFetch)
      await makeClient().getCohortReadiness('cohort id')
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('cohort%20id')
    })

    it('returns ok:false on network failure', async () => {
      vi.stubGlobal('fetch', makeFetchNetworkError('timeout'))
      const result = await makeClient().getCohortReadiness('c1')
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('NetworkError')
    })
  })

  // ── getMonitoringDashboard ──────────────────────────────────────────────────

  describe('getMonitoringDashboard', () => {
    it('returns dashboard data on success', async () => {
      vi.stubGlobal('fetch', makeFetchOk(MOCK_DASHBOARD))
      const result = await makeClient().getMonitoringDashboard()
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.openCaseCount).toBe(5)
      expect(result.data.cohortSummaries).toHaveLength(1)
    })

    it('returns ok:false on 401 with sign-in guidance', async () => {
      vi.stubGlobal('fetch', makeFetchError(401, {}))
      const result = await makeClient().getMonitoringDashboard()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.userGuidance).toContain('sign in')
    })

    it('returns ok:false on 500 with degraded guidance', async () => {
      vi.stubGlobal('fetch', makeFetchError(500, {}))
      const result = await makeClient().getMonitoringDashboard()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.userGuidance).toContain('degraded')
    })
  })

  // ── submitRemediationAction ────────────────────────────────────────────────

  describe('submitRemediationAction', () => {
    const successBody = {
      success: true,
      updatedTask: {
        id: 'task-001',
        title: 'Obtain missing KYC documents',
        description: 'Request updated ID from ACME Holdings',
        isBlocking: true,
        dueAt: null,
        assignedTo: null,
        status: 'RESOLVED' as const,
      },
    }

    it('returns success result on 200', async () => {
      vi.stubGlobal('fetch', makeFetchOk(successBody))
      const result = await makeClient().submitRemediationAction('case-001', 'task-001', 'RESOLVED', 'Resolved by operator')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.success).toBe(true)
      expect(result.data.updatedTask.status).toBe('RESOLVED')
    })

    it('sends POST with correct body', async () => {
      const mockFetch = makeFetchOk(successBody)
      vi.stubGlobal('fetch', mockFetch)
      await makeClient().submitRemediationAction('case-001', 'task-001', 'ESCALATED', 'Needs legal review')
      const [, options] = mockFetch.mock.calls[0]
      expect(options.method).toBe('POST')
      const body = JSON.parse(options.body)
      expect(body.taskId).toBe('task-001')
      expect(body.action).toBe('ESCALATED')
      expect(body.notes).toBe('Needs legal review')
    })

    it('sends null notes when omitted', async () => {
      const mockFetch = makeFetchOk(successBody)
      vi.stubGlobal('fetch', mockFetch)
      await makeClient().submitRemediationAction('case-001', 'task-001', 'NOTE_ADDED')
      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.notes).toBeNull()
    })

    it('returns ok:false on 403 (forbidden)', async () => {
      vi.stubGlobal('fetch', makeFetchError(403, {}))
      const result = await makeClient().submitRemediationAction('case-001', 'task-001', 'RESOLVED')
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('Forbidden')
    })

    it('returns ok:false on network error during POST', async () => {
      vi.stubGlobal('fetch', makeFetchNetworkError('ECONNREFUSED'))
      const result = await makeClient().submitRemediationAction('case-001', 'task-001', 'RESOLVED')
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.userGuidance).toContain('Unable to submit')
    })
  })

  // ── HTTP error mapping ─────────────────────────────────────────────────────

  describe('HTTP error mapping edge cases', () => {
    it('maps 422 (unknown status) to UnknownError with message extracted', async () => {
      vi.stubGlobal('fetch', makeFetchError(422, { message: 'Validation failed for field X' }))
      const result = await makeClient().listCases()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('UnknownError')
      expect(result.error.userGuidance).toContain('Validation failed for field X')
    })

    it('maps 503 to ServiceUnavailable (>=500 branch)', async () => {
      vi.stubGlobal('fetch', makeFetchError(503, {}))
      const result = await makeClient().listCases()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('ServiceUnavailable')
    })

    it('handles null JSON response body gracefully (json parse failure)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      }))
      const result = await makeClient().listCases()
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error.errorCode).toBe('ServiceUnavailable')
    })
  })

  // ── Authorization header ───────────────────────────────────────────────────

  describe('Authorization header', () => {
    it('sends Bearer token on every GET request', async () => {
      const mockFetch = makeFetchOk(MOCK_DASHBOARD)
      vi.stubGlobal('fetch', mockFetch)
      await makeClient().getMonitoringDashboard()
      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers['Authorization']).toBe(`Bearer ${TOKEN}`)
    })

    it('sends Bearer token on POST requests', async () => {
      const mockFetch = makeFetchOk({ success: true, updatedTask: {} })
      vi.stubGlobal('fetch', mockFetch)
      await makeClient().submitRemediationAction('c', 't', 'RESOLVED')
      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers['Authorization']).toBe(`Bearer ${TOKEN}`)
    })
  })

  // ── Base URL trailing slash ────────────────────────────────────────────────

  describe('base URL handling', () => {
    it('strips trailing slash from base URL', async () => {
      const client = new ComplianceCaseManagementClient('https://api.test.io/', TOKEN)
      const mockFetch = makeFetchOk(MOCK_DASHBOARD)
      vi.stubGlobal('fetch', mockFetch)
      await client.getMonitoringDashboard()
      const [url] = mockFetch.mock.calls[0]
      // After the scheme (https://) there should be no double slashes
      const pathPart = url.replace('https://', '')
      expect(pathPart).not.toContain('//')
      expect(url).toContain('/api/v1/compliance/monitoring/dashboard')
    })
  })
})

// ---------------------------------------------------------------------------
// createComplianceCaseClient factory
// ---------------------------------------------------------------------------

describe('createComplianceCaseClient', () => {
  it('returns null when bearerToken is null', () => {
    expect(createComplianceCaseClient(null)).toBeNull()
  })

  it('returns null when bearerToken is undefined', () => {
    expect(createComplianceCaseClient(undefined)).toBeNull()
  })

  it('returns null when bearerToken is empty string', () => {
    expect(createComplianceCaseClient('')).toBeNull()
  })

  it('returns a client when bearerToken is provided', () => {
    const client = createComplianceCaseClient('my-token')
    expect(client).not.toBeNull()
    expect(client).toBeInstanceOf(ComplianceCaseManagementClient)
  })
})
