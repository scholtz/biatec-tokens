/**
 * liveComplianceIntegration.test.ts
 *
 * Unit tests for the live compliance backend integration layer.
 * Covers:
 * - backendCaseToWorkItem() status/stage/ownership mapping
 * - loadLiveOperatorWorkQueue() success, auth-missing, and backend-error paths
 * - loadLiveCaseDrillDown() success, auth-missing, and backend-error paths
 * - buildDrillDownFromNormalisedDetail() state construction
 * - submitLiveEscalation() success and error paths
 * - dataSourceLabel() and dataSourceBadgeClass() helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  backendCaseToWorkItem,
  loadLiveOperatorWorkQueue,
  loadLiveCaseDrillDown,
  buildDrillDownFromNormalisedDetail,
  submitLiveEscalation,
  dataSourceLabel,
  dataSourceBadgeClass,
  type DataSource,
} from '../liveComplianceIntegration'
import type {
  BackendComplianceCaseListItem,
} from '../../lib/api/complianceCaseManagement'
import type { NormalisedCaseDetail } from '../complianceCaseNormalizer'
import type { WorkItem } from '../complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../lib/api/complianceCaseManagement', () => {
  const mockListCases = vi.fn()
  const mockGetCase = vi.fn()
  const mockSubmitRemediationAction = vi.fn()

  const createComplianceCaseClient = vi.fn(() => ({
    listCases: mockListCases,
    getCase: mockGetCase,
    submitRemediationAction: mockSubmitRemediationAction,
  }))

  return {
    createComplianceCaseClient,
    __mockListCases: mockListCases,
    __mockGetCase: mockGetCase,
    __mockSubmitRemediationAction: mockSubmitRemediationAction,
  }
})

vi.mock('../complianceCaseNormalizer', () => ({
  normaliseCaseDetail: vi.fn((detail: Record<string, unknown>) => detail),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBackendCase(overrides: Partial<BackendComplianceCaseListItem> = {}): BackendComplianceCaseListItem {
  return {
    id: 'case-001',
    referenceNumber: 'BT-2026-001',
    entityName: 'Thorngate Capital',
    entityType: 'Corporate',
    status: 'UNDER_REVIEW',
    riskLevel: 'MEDIUM',
    assignedReviewer: 'jane.doe@biatec.io',
    createdAt: '2026-01-15T09:00:00.000Z',
    lastActivityAt: '2026-03-01T12:00:00.000Z',
    openTaskCount: 2,
    hasLaunchBlockers: false,
    ...overrides,
  }
}

function makeWorkItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'wi-001',
    title: 'Test Case',
    stage: 'kyc_aml',
    status: 'in_progress',
    ownership: 'assigned_to_team',
    lastActionAt: '2026-03-01T12:00:00.000Z',
    dueAt: '2026-03-05T12:00:00.000Z',
    workspacePath: '/compliance/operations',
    note: null,
    isLaunchBlocking: false,
    ...overrides,
  }
}

function makeNormalisedDetail(overrides: Partial<NormalisedCaseDetail> = {}): NormalisedCaseDetail {
  return {
    summary: {
      id: 'case-001',
      referenceNumber: 'BT-2026-001',
      entityName: 'Thorngate Capital',
      entityType: 'Corporate',
      status: 'UNDER_REVIEW',
      riskLevel: 'MEDIUM',
      kycApproved: true,
      amlClear: true,
      isHighRisk: false,
    },
    evidenceItems: [],
    jurisdictionEntries: [],
    remediationTasks: [],
    reviewNotes: [],
    hasStaleEvidence: false,
    hasUnresolvedAMLFlags: false,
    evidencePackComplete: true,
    kycVerifiedAt: '2026-03-01T09:00:00.000Z',
    kycVerifiedBy: 'KYC Officer',
    kycDiscrepancyNotes: null,
    amlScreenedAt: '2026-03-02T11:00:00.000Z',
    amlScreeningProvider: 'ComplyAdvantage',
    amlFlagReason: null,
    amlEscalationNotes: null,
    internalNotes: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// backendCaseToWorkItem
// ---------------------------------------------------------------------------

describe('backendCaseToWorkItem', () => {
  it('maps UNDER_REVIEW status to in_progress WorkItemStatus', () => {
    const raw = makeBackendCase({ status: 'UNDER_REVIEW' })
    const item = backendCaseToWorkItem(raw)
    expect(item.status).toBe('in_progress')
  })

  it('maps ESCALATED status to escalated WorkItemStatus', () => {
    const raw = makeBackendCase({ status: 'ESCALATED' })
    const item = backendCaseToWorkItem(raw)
    expect(item.status).toBe('escalated')
  })

  it('maps APPROVED status to complete WorkItemStatus', () => {
    const raw = makeBackendCase({ status: 'APPROVED' })
    const item = backendCaseToWorkItem(raw)
    expect(item.status).toBe('complete')
  })

  it('maps REJECTED status to blocked WorkItemStatus', () => {
    const raw = makeBackendCase({ status: 'REJECTED' })
    const item = backendCaseToWorkItem(raw)
    expect(item.status).toBe('blocked')
  })

  it('maps PENDING status to open WorkItemStatus', () => {
    const raw = makeBackendCase({ status: 'PENDING' })
    const item = backendCaseToWorkItem(raw)
    expect(item.status).toBe('open')
  })

  it('maps AWAITING_DOCUMENTS status to pending_review', () => {
    const raw = makeBackendCase({ status: 'AWAITING_DOCUMENTS' })
    const item = backendCaseToWorkItem(raw)
    expect(item.status).toBe('pending_review')
  })

  it('constructs title from entityName and entityType', () => {
    const raw = makeBackendCase({ entityName: 'Thorngate Capital', entityType: 'Corporate' })
    const item = backendCaseToWorkItem(raw)
    expect(item.title).toContain('Thorngate Capital')
    expect(item.title).toContain('Corporate')
  })

  it('falls back to reference number when entityName is absent', () => {
    const raw = makeBackendCase({ entityName: undefined as unknown as string })
    const item = backendCaseToWorkItem(raw)
    expect(item.title).toContain('BT-2026-001')
  })

  it('sets isLaunchBlocking correctly', () => {
    const blocking = backendCaseToWorkItem(makeBackendCase({ hasLaunchBlockers: true }))
    const nonBlocking = backendCaseToWorkItem(makeBackendCase({ hasLaunchBlockers: false }))
    expect(blocking.isLaunchBlocking).toBe(true)
    expect(nonBlocking.isLaunchBlocking).toBe(false)
  })

  it('includes open task count in note when tasks exist', () => {
    const raw = makeBackendCase({ openTaskCount: 3, hasLaunchBlockers: false })
    const item = backendCaseToWorkItem(raw)
    expect(item.note).toContain('3 open tasks')
  })

  it('sets null note when no open tasks and no blockers', () => {
    const raw = makeBackendCase({ openTaskCount: 0, hasLaunchBlockers: false })
    const item = backendCaseToWorkItem(raw)
    expect(item.note).toBeNull()
  })

  it('maps ESCALATED status to escalated ownership', () => {
    const raw = makeBackendCase({ status: 'ESCALATED' })
    const item = backendCaseToWorkItem(raw)
    expect(item.ownership).toBe('escalated')
  })

  it('maps null reviewer to unassigned ownership', () => {
    const raw = makeBackendCase({ assignedReviewer: null, status: 'PENDING' })
    const item = backendCaseToWorkItem(raw)
    expect(item.ownership).toBe('unassigned')
  })

  it('maps present reviewer to assigned_to_team ownership', () => {
    const raw = makeBackendCase({ assignedReviewer: 'reviewer@example.com', status: 'UNDER_REVIEW' })
    const item = backendCaseToWorkItem(raw)
    expect(item.ownership).toBe('assigned_to_team')
  })

  it('derives SLA due date 72h from lastActivityAt', () => {
    const lastActivity = '2026-03-01T12:00:00.000Z'
    const raw = makeBackendCase({ lastActivityAt: lastActivity })
    const item = backendCaseToWorkItem(raw)
    expect(item.dueAt).toBeTruthy()
    const due = new Date(item.dueAt!).getTime()
    const base = new Date(lastActivity).getTime()
    expect(due - base).toBe(72 * 60 * 60 * 1000)
  })
})

// ---------------------------------------------------------------------------
// loadLiveOperatorWorkQueue
// ---------------------------------------------------------------------------

describe('loadLiveOperatorWorkQueue', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockListCases: any

  beforeEach(async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    mockListCases = mod.__mockListCases
    vi.clearAllMocks()
  })

  it('returns mock degraded result when no token provided', async () => {
    const result = await loadLiveOperatorWorkQueue(null)
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
    expect(result.degradedReason).toContain('No authentication token')
  })

  it('returns mock degraded result when token is empty string', async () => {
    const result = await loadLiveOperatorWorkQueue('')
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
  })

  it('returns live data when backend call succeeds', async () => {
    const cases = [makeBackendCase()]
    mockListCases.mockResolvedValueOnce({ ok: true, data: { cases, totalCount: 1, page: 1, pageSize: 50 } })

    const result = await loadLiveOperatorWorkQueue('valid-token')
    expect(result.source).toBe('live')
    expect(result.isDegraded).toBe(false)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe('case-001')
  })

  it('converts multiple cases to WorkItem[]', async () => {
    const cases = [
      makeBackendCase({ id: 'c1', status: 'PENDING' }),
      makeBackendCase({ id: 'c2', status: 'ESCALATED' }),
      makeBackendCase({ id: 'c3', status: 'APPROVED' }),
    ]
    mockListCases.mockResolvedValueOnce({ ok: true, data: { cases, totalCount: 3, page: 1, pageSize: 50 } })

    const result = await loadLiveOperatorWorkQueue('valid-token')
    expect(result.data).toHaveLength(3)
    expect(result.data[0].status).toBe('open')
    expect(result.data[1].status).toBe('escalated')
    expect(result.data[2].status).toBe('complete')
  })

  it('returns mock degraded when backend returns error result', async () => {
    mockListCases.mockResolvedValueOnce({
      ok: false,
      error: { httpStatus: 500, errorCode: 'ServiceUnavailable', userGuidance: 'Service down' },
    })

    const result = await loadLiveOperatorWorkQueue('valid-token')
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
    expect(result.degradedReason).toContain('500')
  })

  it('returns mock degraded when backend throws exception', async () => {
    mockListCases.mockRejectedValueOnce(new Error('Network failure'))

    const result = await loadLiveOperatorWorkQueue('valid-token')
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
    expect(result.degradedReason).toContain('Network failure')
  })

  it('includes fetchedAt ISO timestamp', async () => {
    const result = await loadLiveOperatorWorkQueue(null)
    expect(result.fetchedAt).toBeTruthy()
    expect(() => new Date(result.fetchedAt)).not.toThrow()
    expect(new Date(result.fetchedAt).getTime()).toBeGreaterThan(0)
  })

  it('returns mock degraded when API client factory returns null', async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    const mockCreateClient = mod.createComplianceCaseClient as ReturnType<typeof vi.fn>
    mockCreateClient.mockReturnValueOnce(null)

    const result = await loadLiveOperatorWorkQueue('valid-token')
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
    expect(result.degradedReason).toContain('API client')
  })
})

// ---------------------------------------------------------------------------
// loadLiveCaseDrillDown
// ---------------------------------------------------------------------------

describe('loadLiveCaseDrillDown', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGetCase: any

  beforeEach(async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    mockGetCase = mod.__mockGetCase
    const normalizerMod = await import('../complianceCaseNormalizer') as Record<string, unknown>
    ;(normalizerMod.normaliseCaseDetail as ReturnType<typeof vi.fn>).mockImplementation((d: unknown) => {
      if (d && typeof d === 'object') return { ...d as Record<string, unknown>, ...makeNormalisedDetail() }
      return makeNormalisedDetail()
    })
    vi.clearAllMocks()
  })

  it('returns degraded mock result when no token provided', async () => {
    const item = makeWorkItem()
    const result = await loadLiveCaseDrillDown('case-001', item, null)
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
    expect(result.data).toBeNull()
  })

  it('returns degraded mock result when token is empty string', async () => {
    const item = makeWorkItem()
    const result = await loadLiveCaseDrillDown('case-001', item, '')
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
  })

  it('returns live drill-down state when backend call succeeds', async () => {
    const item = makeWorkItem()
    const backendDetail = { id: 'case-001', status: 'UNDER_REVIEW' }
    mockGetCase.mockResolvedValueOnce({ ok: true, data: backendDetail })

    const result = await loadLiveCaseDrillDown('case-001', item, 'valid-token')
    expect(result.source).toBe('live')
    expect(result.data).not.toBeNull()
  })

  it('returns degraded when backend returns error', async () => {
    const item = makeWorkItem()
    mockGetCase.mockResolvedValueOnce({
      ok: false,
      error: { httpStatus: 404, errorCode: 'NotFound', userGuidance: 'Case not found' },
    })

    const result = await loadLiveCaseDrillDown('case-001', item, 'valid-token')
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
    expect(result.degradedReason).toContain('404')
  })

  it('returns degraded when backend throws', async () => {
    const item = makeWorkItem()
    mockGetCase.mockRejectedValueOnce(new Error('timeout'))

    const result = await loadLiveCaseDrillDown('case-001', item, 'valid-token')
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
    expect(result.degradedReason).toContain('timeout')
  })

  it('returns mock degraded when API client factory returns null', async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    const mockCreateClient = mod.createComplianceCaseClient as ReturnType<typeof vi.fn>
    mockCreateClient.mockReturnValueOnce(null)

    const item = makeWorkItem()
    const result = await loadLiveCaseDrillDown('case-001', item, 'valid-token')
    expect(result.source).toBe('mock')
    expect(result.isDegraded).toBe(true)
    expect(result.data).toBeNull()
    expect(result.degradedReason).toContain('unavailable')
  })
})

// ---------------------------------------------------------------------------
// buildDrillDownFromNormalisedDetail
// ---------------------------------------------------------------------------

describe('buildDrillDownFromNormalisedDetail', () => {
  it('returns a CaseDrillDownState with the correct item reference', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail()
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.item).toBe(workItem)
  })

  it('contains non-empty evidence groups', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail()
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.evidenceGroups.length).toBeGreaterThan(0)
  })

  it('returns isDegraded=false when detail has no stale evidence or AML flags', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({ hasStaleEvidence: false, hasUnresolvedAMLFlags: false })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.isDegraded).toBe(false)
  })

  it('returns isDegraded=true when detail has stale evidence', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({ hasStaleEvidence: true, hasUnresolvedAMLFlags: false })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.isDegraded).toBe(true)
  })

  it('returns isDegraded=true when detail has unresolved AML flags', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({ hasStaleEvidence: false, hasUnresolvedAMLFlags: true })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.isDegraded).toBe(true)
  })

  it('isReadyForApproval=false when isDegraded=true', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({ hasStaleEvidence: true })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.isReadyForApproval).toBe(false)
  })

  it('produces timeline events', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail()
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.timeline.length).toBeGreaterThan(0)
  })

  it('produces approval history records', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail()
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.approvalHistory.length).toBeGreaterThan(0)
  })

  it('produces non-empty escalation options', () => {
    const workItem = makeWorkItem({ status: 'escalated', stage: 'remediation' })
    const detail = makeNormalisedDetail()
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.escalationOptions.length).toBeGreaterThan(0)
  })

  it('produces a non-empty nextAction string', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail()
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    expect(state.nextAction.length).toBeGreaterThan(0)
  })

  it('includes jurisdiction entries as approval_history evidence items', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      jurisdictionEntries: [
        { jurisdictionCode: 'DE', jurisdictionName: 'Germany', isBlocking: false, outcomeLabel: 'Permitted', restrictionReason: null },
        { jurisdictionCode: 'CN', jurisdictionName: 'China', isBlocking: true, outcomeLabel: 'Restricted', restrictionReason: 'Restricted jurisdiction' },
      ],
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const approvalGroup = state.evidenceGroups.find((g) => g.category === 'approval_history')
    expect(approvalGroup).toBeTruthy()
    expect(approvalGroup!.items.length).toBe(2)
    expect(approvalGroup!.items[1].note).toContain('Restriction')
  })

  it('shows export package as missing when evidencePackComplete=false', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({ evidencePackComplete: false })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const exportGroup = state.evidenceGroups.find((g) => g.category === 'export_regulator_package')
    expect(exportGroup).toBeTruthy()
    expect(exportGroup!.items[0].status).toBe('missing')
  })

  it('shows export package as available when evidencePackComplete=true', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({ evidencePackComplete: true })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const exportGroup = state.evidenceGroups.find((g) => g.category === 'export_regulator_package')
    expect(exportGroup!.items[0].status).toBe('available')
  })

  it('includes internal notes as timeline event when present', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({ internalNotes: 'Investor provided updated documents' })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const noteEvent = state.timeline.find((e) => e.detail === 'Investor provided updated documents')
    expect(noteEvent).toBeTruthy()
  })

  it('includes remediation tasks as timeline events', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      remediationTasks: [
        { id: 't1', title: 'Request updated passport', description: 'Passport expired', isOverdue: false, isBlocking: false, dueAt: null, assignedTo: 'ops@biatec.io' },
        { id: 't2', title: 'AML re-screen required', description: 'Watchlist hit', isOverdue: true, isBlocking: true, dueAt: null, assignedTo: null },
      ],
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const overdueEvent = state.timeline.find((e) => e.summary.includes('[OVERDUE]'))
    expect(overdueEvent).toBeTruthy()
    expect(overdueEvent!.isSignificant).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// submitLiveEscalation
// ---------------------------------------------------------------------------

describe('submitLiveEscalation', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSubmitRemediationAction: any

  beforeEach(async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    mockSubmitRemediationAction = mod.__mockSubmitRemediationAction
    vi.clearAllMocks()
  })

  it('returns success=false when no token', async () => {
    const result = await submitLiveEscalation(
      { caseId: 'case-001', reason: 'aml_flag', note: '', destination: 'Senior Reviewer' },
      null,
    )
    expect(result.success).toBe(false)
    expect(result.source).toBe('mock')
    expect(result.errorMessage).toContain('No authentication token')
  })

  it('returns success=true when backend call succeeds', async () => {
    mockSubmitRemediationAction.mockResolvedValueOnce({
      ok: true,
      data: { success: true, updatedTask: { id: 'task-1' } },
    })

    const result = await submitLiveEscalation(
      { caseId: 'case-001', reason: 'aml_flag', note: 'AML flag raised', destination: 'AML Team' },
      'valid-token',
    )
    expect(result.success).toBe(true)
    expect(result.source).toBe('live')
    expect(result.errorMessage).toBeNull()
  })

  it('returns success=false when backend returns error', async () => {
    mockSubmitRemediationAction.mockResolvedValueOnce({
      ok: false,
      error: { httpStatus: 403, errorCode: 'Forbidden', userGuidance: 'Insufficient permissions' },
    })

    const result = await submitLiveEscalation(
      { caseId: 'case-001', reason: 'sanctions_hit', note: '', destination: 'Legal' },
      'valid-token',
    )
    expect(result.success).toBe(false)
    expect(result.source).toBe('live')
    expect(result.errorMessage).toContain('403')
  })

  it('returns success=false when backend throws', async () => {
    mockSubmitRemediationAction.mockRejectedValueOnce(new Error('connection refused'))

    const result = await submitLiveEscalation(
      { caseId: 'case-001', reason: 'other', note: '', destination: 'Operations Lead' },
      'valid-token',
    )
    expect(result.success).toBe(false)
    expect(result.errorMessage).toContain('connection refused')
  })
})

// ---------------------------------------------------------------------------
// dataSourceLabel / dataSourceBadgeClass
// ---------------------------------------------------------------------------

describe('dataSourceLabel', () => {
  it('returns "Live backend data" for live non-degraded', () => {
    expect(dataSourceLabel('live', false)).toBe('Live backend data')
  })

  it('returns partial degraded label for live degraded', () => {
    const label = dataSourceLabel('live', true)
    expect(label).toContain('Live')
    expect(label).toContain('degraded')
  })

  it('returns demo data label for mock source', () => {
    const label = dataSourceLabel('mock', true)
    expect(label).toContain('Demo')
  })

  it('returns demo label for mock non-degraded', () => {
    const label = dataSourceLabel('mock', false)
    expect(label).toContain('Demo')
  })
})

describe('dataSourceBadgeClass', () => {
  it('returns green class for live non-degraded', () => {
    const cls = dataSourceBadgeClass('live', false)
    expect(cls).toContain('green')
  })

  it('returns yellow class for live degraded', () => {
    const cls = dataSourceBadgeClass('live', true)
    expect(cls).toContain('yellow')
  })

  it('returns gray class for mock', () => {
    const cls = dataSourceBadgeClass('mock', false)
    expect(cls).toContain('gray')
  })

  it('returns gray class for mock degraded', () => {
    const cls = dataSourceBadgeClass('mock', true)
    expect(cls).toContain('gray')
  })
})

// ---------------------------------------------------------------------------
// buildDrillDownFromNormalisedDetail — uncovered evidence-group branches
// ---------------------------------------------------------------------------

function makeEvidenceItem(
  overrides: Partial<{
    id: string
    documentType: string
    statusLabel: string
    isDeficient: boolean
    isExpired: boolean
    isFreshnessFailing: boolean
    lastVerifiedLabel: string
    reviewedBy: string
    reviewerNotes: string
    documentUrl: string | null
  }> = {},
) {
  return {
    id: 'ev-001',
    documentType: 'KYC Passport',
    statusLabel: 'Valid',
    isDeficient: false,
    isExpired: false,
    isFreshnessFailing: false,
    lastVerifiedLabel: '1 day ago',
    reviewedBy: 'Officer A',
    reviewerNotes: '',
    documentUrl: null,
    ...overrides,
  }
}

describe('buildDrillDownFromNormalisedDetail — evidence group stale/placeholder branches', () => {
  it('KYC item with isExpired=true produces stale evidence status', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      evidenceItems: [
        makeEvidenceItem({ id: 'ev-kyc-exp', documentType: 'KYC Passport', isExpired: true }),
      ],
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const kycGroup = state.evidenceGroups.find((g) => g.category === 'identity_kyc')
    expect(kycGroup).toBeTruthy()
    expect(kycGroup!.items[0].status).toBe('stale')
  })

  it('KYC item with isDeficient=true produces stale evidence status', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      evidenceItems: [
        makeEvidenceItem({ id: 'ev-kyc-def', documentType: 'Identity Card', isDeficient: true }),
      ],
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const kycGroup = state.evidenceGroups.find((g) => g.category === 'identity_kyc')
    expect(kycGroup!.items.length).toBe(1)
    expect(kycGroup!.items[0].status).toBe('stale')
  })

  it('AML item with isDeficient=true produces stale evidence status', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      evidenceItems: [
        makeEvidenceItem({
          id: 'ev-aml-def',
          documentType: 'AML Screening Report',
          isDeficient: true,
          reviewerNotes: 'Watchlist match found',
        }),
      ],
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const amlGroup = state.evidenceGroups.find((g) => g.category === 'aml_sanctions')
    expect(amlGroup).toBeTruthy()
    expect(amlGroup!.items.length).toBe(1)
    expect(amlGroup!.items[0].status).toBe('stale')
  })

  it('no AML evidence items uses placeholder with amlClear=false → stale status', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      evidenceItems: [],
      summary: {
        id: 'case-001',
        referenceNumber: 'BT-2026-001',
        entityName: 'Thorngate Capital',
        entityType: 'Corporate',
        status: 'UNDER_REVIEW',
        riskLevel: 'MEDIUM',
        kycApproved: true,
        amlClear: false,
        isHighRisk: false,
      },
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const amlGroup = state.evidenceGroups.find((g) => g.category === 'aml_sanctions')
    expect(amlGroup).toBeTruthy()
    expect(amlGroup!.items.length).toBe(1)
    expect(amlGroup!.items[0].id).toContain('aml-placeholder')
    // amlClear=false → placeholder status is 'stale' (not cleared)
    expect(amlGroup!.items[0].status).toBe('stale')
  })
})

// ---------------------------------------------------------------------------
// submitLiveEscalation — client factory returns null branch
// ---------------------------------------------------------------------------

describe('submitLiveEscalation — client unavailable branch', () => {
  it('returns success=false when API client factory returns null', async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    const mockCreateClient = mod.createComplianceCaseClient as ReturnType<typeof vi.fn>
    mockCreateClient.mockReturnValueOnce(null)

    const result = await submitLiveEscalation(
      { caseId: 'case-001', reason: 'aml_flag', note: '', destination: 'Senior Reviewer' },
      'valid-bearer-token',
    )
    expect(result.success).toBe(false)
    expect(result.source).toBe('mock')
    expect(result.errorMessage).toContain('unavailable')
  })
})

// ---------------------------------------------------------------------------
// Branch coverage for uncovered lines 578, 605-621, 700
// ---------------------------------------------------------------------------

describe('buildDrillDownFromNormalisedDetail — approval history branches (lines 605-621)', () => {
  it('skips KYC approval record when kycVerifiedAt is "Not verified" (if false branch)', () => {
    const workItem = makeWorkItem()
    // kycVerifiedAt === 'Not verified' → the if-block is skipped → no KYC approval record
    const detail = makeNormalisedDetail({ kycVerifiedAt: 'Not verified', amlScreenedAt: 'Not screened' })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    // approvalHistory should be empty since both conditions are false
    expect(state.approvalHistory).toHaveLength(0)
  })

  it('skips AML approval record when amlScreenedAt is "Not screened" (if false branch)', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({ amlScreenedAt: 'Not screened' })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    // Only KYC record should be present (amlScreenedAt skipped)
    const hasAml = state.approvalHistory.some((r) => r.role === 'AML Screening System')
    expect(hasAml).toBe(false)
  })

  it('creates "returned" KYC decision and uses "discrepancy noted" fallback when kycApproved=false and kycDiscrepancyNotes=null', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      summary: {
        id: 'case-001', referenceNumber: 'BT-2026-001', entityName: 'Thorngate Capital',
        entityType: 'Corporate', status: 'UNDER_REVIEW', riskLevel: 'MEDIUM',
        kycApproved: false, amlClear: true, isHighRisk: false,
      },
      kycDiscrepancyNotes: null,  // triggers the || 'discrepancy noted' fallback
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const kycRecord = state.approvalHistory.find((r) => r.role === 'KYC Compliance Officer')
    expect(kycRecord).toBeDefined()
    expect(kycRecord!.decision).toBe('returned')
    expect(kycRecord!.note).toContain('discrepancy noted')
  })

  it('creates "returned" KYC decision with actual kycDiscrepancyNotes when non-null', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      summary: {
        id: 'case-001', referenceNumber: 'BT-2026-001', entityName: 'Thorngate Capital',
        entityType: 'Corporate', status: 'UNDER_REVIEW', riskLevel: 'MEDIUM',
        kycApproved: false, amlClear: true, isHighRisk: false,
      },
      kycDiscrepancyNotes: 'Passport photo mismatch',
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const kycRecord = state.approvalHistory.find((r) => r.role === 'KYC Compliance Officer')
    expect(kycRecord!.note).toContain('Passport photo mismatch')
  })

  it('creates "escalated" AML decision and uses "potential match found" fallback when amlClear=false and amlFlagReason=null', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      summary: {
        id: 'case-001', referenceNumber: 'BT-2026-001', entityName: 'Thorngate Capital',
        entityType: 'Corporate', status: 'UNDER_REVIEW', riskLevel: 'MEDIUM',
        kycApproved: true, amlClear: false, isHighRisk: false,
      },
      amlFlagReason: null,             // triggers the || 'potential match found' fallback
      amlScreeningProvider: null,      // triggers the ?? 'AML System' fallback
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const amlRecord = state.approvalHistory.find((r) => r.role === 'AML Screening System')
    expect(amlRecord).toBeDefined()
    expect(amlRecord!.decision).toBe('escalated')
    expect(amlRecord!.note).toContain('potential match found')
    expect(amlRecord!.actor).toBe('AML System')  // ?? fallback
  })
})

describe('buildDrillDownFromNormalisedDetail — timeline remediation task branches (line 578)', () => {
  it('uses "Operations Team" fallback when task.assignedTo is null and null description (lines 576-578)', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      remediationTasks: [
        // description: null exercises task.description ?? null right branch (line 578)
        { id: 't-null-desc', title: 'Review account', description: null, isOverdue: false, isBlocking: false, dueAt: null, assignedTo: null },
      ],
    })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const taskEvent = state.timeline.find((e) => e.summary.includes('Review account'))
    expect(taskEvent).toBeDefined()
    expect(taskEvent!.actor).toBe('Operations Team')  // assignedTo ?? 'Operations Team' right branch
    expect(taskEvent!.detail).toBeNull()              // description ?? null right branch
  })
})

describe('submitLiveEscalation — non-Error throw (line 700)', () => {
  it('returns "Unknown error" message when a non-Error value is thrown', async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    const mockSubmitRemediationAction = mod.__mockSubmitRemediationAction as ReturnType<typeof vi.fn>
    // Throw a non-Error (string) to exercise the `err instanceof Error` false branch
    mockSubmitRemediationAction.mockRejectedValueOnce('plain string error')
    const result = await submitLiveEscalation(
      { caseId: 'case-001', reason: 'other', note: '', destination: 'Ops' },
      'valid-token',
    )
    expect(result.success).toBe(false)
    expect(result.errorMessage).toContain('Unknown error')
  })
})
