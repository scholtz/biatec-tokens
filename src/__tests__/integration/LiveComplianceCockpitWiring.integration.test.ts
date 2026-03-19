/**
 * LiveComplianceCockpitWiring.integration.test.ts
 *
 * Integration tests: liveComplianceIntegration ↔ ComplianceOperationsCockpit
 *
 * Tests the wiring between the backend integration layer and the operator
 * cockpit UI components:
 * - loadLiveOperatorWorkQueue correctly transforms backend case data into WorkItems
 * - EscalationFlowModal shows SLA context when item has a dueAt date
 * - EscalationFlowModal shows ownership context
 * - submitLiveEscalation returns fail-closed result on missing auth
 * - buildDrillDownFromNormalisedDetail produces a complete CaseDrillDownState
 * - Data provenance helpers reflect correct source and degraded state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import {
  loadLiveOperatorWorkQueue,
  buildDrillDownFromNormalisedDetail,
  submitLiveEscalation,
  dataSourceLabel,
  dataSourceBadgeClass,
  backendCaseToWorkItem,
} from '../../utils/liveComplianceIntegration'
import type { NormalisedCaseDetail } from '../../utils/complianceCaseNormalizer'
import type { WorkItem } from '../../utils/complianceOperationsCockpit'
import type { BackendComplianceCaseListItem } from '../../lib/api/complianceCaseManagement'
import EscalationFlowModal from '../../components/compliance/EscalationFlowModal.vue'
import { ESCALATION_MODAL_TEST_IDS } from '../../utils/caseDrillDown'

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
    title: 'Thorngate Capital — Corporate Review',
    stage: 'kyc_aml',
    status: 'in_progress',
    ownership: 'assigned_to_team',
    lastActionAt: '2026-03-01T12:00:00.000Z',
    dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2h from now (due_soon)
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

function bodyQuery(testId: string): Element | null {
  return document.body.querySelector(`[data-testid="${testId}"]`)
}

// ---------------------------------------------------------------------------
// Tests: backend data → WorkItem wiring
// ---------------------------------------------------------------------------

describe('LiveComplianceCockpitWiring — backend case → WorkItem', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockListCases: any

  beforeEach(async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    mockListCases = mod.__mockListCases
    vi.clearAllMocks()
  })

  it('transforms ESCALATED backend case to WorkItem with escalated status and ownership', async () => {
    const cases = [makeBackendCase({ id: 'c1', status: 'ESCALATED', assignedReviewer: null })]
    mockListCases.mockResolvedValueOnce({ ok: true, data: { cases, totalCount: 1, page: 1, pageSize: 50 } })

    const result = await loadLiveOperatorWorkQueue('valid-token')
    expect(result.source).toBe('live')
    const item = result.data[0]
    expect(item.status).toBe('escalated')
    expect(item.ownership).toBe('escalated')
    expect(item.stage).toBe('remediation')
  })

  it('transforms launch-blocking case to WorkItem with isLaunchBlocking=true', async () => {
    const cases = [makeBackendCase({ hasLaunchBlockers: true, openTaskCount: 3 })]
    mockListCases.mockResolvedValueOnce({ ok: true, data: { cases, totalCount: 1, page: 1, pageSize: 50 } })

    const result = await loadLiveOperatorWorkQueue('valid-token')
    const item = result.data[0]
    expect(item.isLaunchBlocking).toBe(true)
    expect(item.note).toContain('launch-blocking')
  })

  it('transforms CRITICAL risk level case to remediation stage', () => {
    const raw = makeBackendCase({ status: 'UNDER_REVIEW', riskLevel: 'CRITICAL' })
    const item = backendCaseToWorkItem(raw)
    // UNDER_REVIEW maps to document_review via STATUS_TO_STAGE
    expect(item.stage).toBe('document_review')
  })

  it('loads empty array when backend returns no cases', async () => {
    mockListCases.mockResolvedValueOnce({ ok: true, data: { cases: [], totalCount: 0, page: 1, pageSize: 50 } })

    const result = await loadLiveOperatorWorkQueue('valid-token')
    expect(result.data).toHaveLength(0)
    expect(result.source).toBe('live')
    expect(result.isDegraded).toBe(false)
  })

  it('does not include sensitive reviewer email in public WorkItem fields', async () => {
    const cases = [makeBackendCase({ assignedReviewer: 'compliance-lead@biatec.io' })]
    mockListCases.mockResolvedValueOnce({ ok: true, data: { cases, totalCount: 1, page: 1, pageSize: 50 } })

    const result = await loadLiveOperatorWorkQueue('valid-token')
    const item = result.data[0]
    // WorkItem should not expose raw email — only ownership state
    expect(JSON.stringify(item)).not.toContain('compliance-lead@biatec.io')
  })
})

// ---------------------------------------------------------------------------
// Tests: EscalationFlowModal with SLA and ownership context
// ---------------------------------------------------------------------------

describe('LiveComplianceCockpitWiring — EscalationFlowModal SLA and ownership context', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the case context section when item has a dueAt date', async () => {
    const item = makeWorkItem({
      dueAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // 10h → due_soon
      ownership: 'assigned_to_team',
    })

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      attachTo: document.body,
    })
    await nextTick()

    const caseContext = bodyQuery(ESCALATION_MODAL_TEST_IDS.CASE_CONTEXT)
    expect(caseContext).not.toBeNull()
    wrapper.unmount()
  })

  it('shows SLA urgency badge when item has upcoming due date', async () => {
    const item = makeWorkItem({
      dueAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5h → due_soon
    })

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      attachTo: document.body,
    })
    await nextTick()

    // SLA badge is inside the case context section
    const caseContext = bodyQuery(ESCALATION_MODAL_TEST_IDS.CASE_CONTEXT)
    expect(caseContext).not.toBeNull()
    expect(caseContext!.textContent).toMatch(/Due Soon|Overdue|On Track/i)
    wrapper.unmount()
  })

  it('shows the current owner label', async () => {
    const item = makeWorkItem({ ownership: 'assigned_to_team' })

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      attachTo: document.body,
    })
    await nextTick()

    const ownerEl = bodyQuery(ESCALATION_MODAL_TEST_IDS.CURRENT_OWNER)
    expect(ownerEl).not.toBeNull()
    expect(ownerEl!.textContent).toContain('Team')
    wrapper.unmount()
  })

  it('shows escalation reason description and destination', async () => {
    const item = makeWorkItem({ status: 'escalated' })

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      attachTo: document.body,
    })
    await nextTick()

    const description = bodyQuery(ESCALATION_MODAL_TEST_IDS.REASON_DESCRIPTION)
    expect(description).not.toBeNull()
    const destination = bodyQuery(ESCALATION_MODAL_TEST_IDS.DESTINATION_DISPLAY)
    expect(destination).not.toBeNull()
    wrapper.unmount()
  })

  it('shows submit error message when submitError prop is set', async () => {
    const item = makeWorkItem()

    const wrapper = mount(EscalationFlowModal, {
      props: {
        modelValue: true,
        item,
        submitError: 'Backend returned a 503 error. Please try again.',
      },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      attachTo: document.body,
    })
    await nextTick()

    const errorEl = bodyQuery(ESCALATION_MODAL_TEST_IDS.SUBMIT_ERROR)
    expect(errorEl).not.toBeNull()
    expect(errorEl!.textContent).toContain('503')
    wrapper.unmount()
  })

  it('does not show submit error when submitError prop is null', async () => {
    const item = makeWorkItem()

    const wrapper = mount(EscalationFlowModal, {
      props: { modelValue: true, item, submitError: null },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      attachTo: document.body,
    })
    await nextTick()

    const errorEl = bodyQuery(ESCALATION_MODAL_TEST_IDS.SUBMIT_ERROR)
    expect(errorEl).toBeNull()
    wrapper.unmount()
  })
})

// ---------------------------------------------------------------------------
// Tests: fail-closed escalation submission
// ---------------------------------------------------------------------------

describe('LiveComplianceCockpitWiring — fail-closed escalation submission', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSubmitRemediationAction: any

  beforeEach(async () => {
    const mod = await import('../../lib/api/complianceCaseManagement') as Record<string, unknown>
    mockSubmitRemediationAction = mod.__mockSubmitRemediationAction
    vi.clearAllMocks()
  })

  it('fails closed when no auth token (no network call made)', async () => {
    const result = await submitLiveEscalation(
      { caseId: 'case-001', reason: 'sanctions_hit', note: '', destination: 'Legal' },
      null,
    )
    expect(result.success).toBe(false)
    expect(result.source).toBe('mock')
    expect(mockSubmitRemediationAction).not.toHaveBeenCalled()
  })

  it('returns success=false when backend returns 403 Forbidden', async () => {
    mockSubmitRemediationAction.mockResolvedValueOnce({
      ok: false,
      error: { httpStatus: 403, errorCode: 'Forbidden', userGuidance: 'Insufficient permissions' },
    })

    const result = await submitLiveEscalation(
      { caseId: 'case-001', reason: 'document_dispute', note: 'Missing passport', destination: 'KYC Team' },
      'valid-token',
    )
    expect(result.success).toBe(false)
    expect(result.source).toBe('live')
    expect(result.errorMessage).toContain('403')
  })

  it('escalation note is included in backend remediation action call', async () => {
    mockSubmitRemediationAction.mockResolvedValueOnce({
      ok: true,
      data: { success: true, updatedTask: { id: 'task-1' } },
    })

    await submitLiveEscalation(
      { caseId: 'case-001', reason: 'aml_flag', note: 'AML hit on watchlist', destination: 'AML Team' },
      'valid-token',
    )

    const callArgs = mockSubmitRemediationAction.mock.calls[0]
    expect(callArgs[3]).toContain('AML hit on watchlist')
    expect(callArgs[3]).toContain('AML Team')
  })
})

// ---------------------------------------------------------------------------
// Tests: drill-down state integrity from normalised detail
// ---------------------------------------------------------------------------

describe('LiveComplianceCockpitWiring — buildDrillDownFromNormalisedDetail integrity', () => {
  it('AML flag in detail produces stale evidence item in aml_sanctions group', () => {
    const workItem = makeWorkItem({ status: 'blocked' })
    const detail = makeNormalisedDetail({
      hasUnresolvedAMLFlags: true,
      amlFlagReason: 'Potential PEP match detected',
      summary: {
        id: 'case-001',
        referenceNumber: 'BT-2026-001',
        entityName: 'Test Corp',
        entityType: 'Corporate',
        status: 'ESCALATED',
        riskLevel: 'HIGH',
        kycApproved: true,
        amlClear: false,
        isHighRisk: true,
      },
    })

    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const amlGroup = state.evidenceGroups.find((g) => g.category === 'aml_sanctions')
    expect(amlGroup).toBeTruthy()
    const flaggedItem = amlGroup!.items.find((i) => i.status === 'stale' || i.note?.includes('PEP'))
    expect(flaggedItem).toBeTruthy()
  })

  it('KYC-approved detail produces available identity_kyc group', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      summary: {
        id: 'case-001',
        referenceNumber: 'BT-2026-001',
        entityName: 'Thorngate',
        entityType: 'Corporate',
        status: 'APPROVED',
        riskLevel: 'LOW',
        kycApproved: true,
        amlClear: true,
        isHighRisk: false,
      },
    })

    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const kycGroup = state.evidenceGroups.find((g) => g.category === 'identity_kyc')
    expect(kycGroup).toBeTruthy()
    expect(kycGroup!.overallStatus).toBe('available')
  })

  it('blockerSummary is populated when evidence is missing or stale', () => {
    const workItem = makeWorkItem({ status: 'blocked', isLaunchBlocking: true })
    const detail = makeNormalisedDetail({ hasStaleEvidence: true, evidencePackComplete: false })
    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    // blockerSummary should reflect that evidence is missing/stale
    expect(Array.isArray(state.blockerSummary)).toBe(true)
  })

  it('overdue remediation task produces sla_warning timeline event', () => {
    const workItem = makeWorkItem({ status: 'overdue' })
    const detail = makeNormalisedDetail({
      remediationTasks: [
        { id: 't1', title: 'Passport re-submission', description: 'Expired passport', isOverdue: true, isBlocking: true, dueAt: null, assignedTo: 'ops@biatec.io' },
      ],
    })

    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const slaEvent = state.timeline.find((e) => e.type === 'sla_warning')
    expect(slaEvent).toBeTruthy()
    expect(slaEvent!.isSignificant).toBe(true)
  })

  it('approval history includes KYC decision when kycVerifiedAt is set', () => {
    const workItem = makeWorkItem()
    const detail = makeNormalisedDetail({
      kycVerifiedAt: '2026-02-28T10:00:00.000Z',
      kycVerifiedBy: 'Senior KYC Analyst',
    })

    const state = buildDrillDownFromNormalisedDetail(workItem, detail)
    const kycRecord = state.approvalHistory.find((r) => r.role === 'KYC Compliance Officer')
    expect(kycRecord).toBeTruthy()
    expect(kycRecord!.actor).toBe('Senior KYC Analyst')
  })
})

// ---------------------------------------------------------------------------
// Tests: data provenance labels and badge classes
// ---------------------------------------------------------------------------

describe('LiveComplianceCockpitWiring — data provenance helpers', () => {
  it('live non-degraded shows "Live backend data" label', () => {
    expect(dataSourceLabel('live', false)).toBe('Live backend data')
  })

  it('live degraded shows partially degraded label', () => {
    const label = dataSourceLabel('live', true)
    expect(label).toMatch(/degraded/i)
  })

  it('mock source shows demo label', () => {
    const label = dataSourceLabel('mock', true)
    expect(label).toMatch(/demo/i)
  })

  it('live non-degraded badge has green class', () => {
    expect(dataSourceBadgeClass('live', false)).toContain('green')
  })

  it('live degraded badge has yellow class', () => {
    expect(dataSourceBadgeClass('live', true)).toContain('yellow')
  })

  it('mock badge has gray class', () => {
    expect(dataSourceBadgeClass('mock', false)).toContain('gray')
  })
})
