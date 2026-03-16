/**
 * Unit Tests — complianceCaseNormalizer.ts
 *
 * Tests cover:
 * - Status label maps (CASE_STATUS_LABELS, RISK_LEVEL_LABELS, etc.)
 * - mapCaseStatusToStageStatus — all status codes including fail-closed edge cases
 * - mapRiskLevelToBlockerSeverity — all risk levels including UNKNOWN
 * - isCaseStatusBlocking — launch-blocking cases
 * - isScreeningOutcomeConcerning — AML/sanctions flags
 * - isJurisdictionOutcomeBlocking — restricted/prohibited jurisdictions
 * - isEvidenceStatusDeficient — missing/stale/rejected evidence
 * - isEvidenceFreshnessFailing — staleness window calculation
 * - isEvidenceExpired — document expiry
 * - normaliseCaseSummary — operator-readable case summary
 * - normaliseCaseDetail — full case detail normalisation
 * - normaliseCohortReadinessToStages — cohort → OnboardingStage[] conversion
 * - normaliseCohortReadinessSummary — cohort → operator-readable summary
 * - buildDegradedOnboardingStages — fail-closed degraded state
 */

import { describe, it, expect } from 'vitest'
import {
  CASE_STATUS_LABELS,
  RISK_LEVEL_LABELS,
  EVIDENCE_STATUS_LABELS,
  JURISDICTION_OUTCOME_LABELS,
  SCREENING_OUTCOME_LABELS,
  mapCaseStatusToStageStatus,
  mapRiskLevelToBlockerSeverity,
  isCaseStatusBlocking,
  isScreeningOutcomeConcerning,
  isJurisdictionOutcomeBlocking,
  isEvidenceStatusDeficient,
  isEvidenceFreshnessFailing,
  isEvidenceExpired,
  normaliseCaseSummary,
  normaliseCaseDetail,
  normaliseCohortReadinessToStages,
  normaliseCohortReadinessSummary,
  buildDegradedOnboardingStages,
} from '../complianceCaseNormalizer'
import type {
  BackendComplianceCaseListItem,
  BackendComplianceCaseDetail,
  BackendCohortReadiness,
} from '../../lib/api/complianceCaseManagement'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MOCK_CASE: BackendComplianceCaseListItem = {
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

const MOCK_DETAIL: BackendComplianceCaseDetail = {
  ...MOCK_CASE,
  kycDetail: {
    verificationMethod: 'eKYC',
    verifiedAt: '2025-10-15T10:00:00Z',
    verifiedBy: 'Jane Reviewer',
    discrepancyNotes: null,
  },
  amlDetail: {
    screeningProvider: 'Provider X',
    screenedAt: '2025-10-15T11:00:00Z',
    flagReason: null,
    resolvedAt: null,
    resolvedBy: null,
    escalationNotes: null,
  },
  jurisdictionEntries: [
    {
      jurisdictionCode: 'GB',
      jurisdictionName: 'United Kingdom',
      outcome: 'PERMITTED',
      restrictionReason: null,
      checkedAt: '2025-10-20T00:00:00Z',
    },
    {
      jurisdictionCode: 'KP',
      jurisdictionName: 'North Korea',
      outcome: 'PROHIBITED',
      restrictionReason: 'Sanctioned jurisdiction under OFAC',
      checkedAt: '2025-10-20T00:00:00Z',
    },
  ],
  evidenceItems: [
    {
      id: 'ev-001',
      documentType: 'Passport',
      status: 'PRESENT',
      lastVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      expiresAt: null,
      reviewedBy: 'Jane',
      documentUrl: 'https://example.com/passport',
      reviewerNotes: 'Valid document',
    },
    {
      id: 'ev-002',
      documentType: 'Certificate of Incorporation',
      status: 'MISSING',
      lastVerifiedAt: null,
      expiresAt: null,
      reviewedBy: null,
      documentUrl: null,
      reviewerNotes: null,
    },
  ],
  remediationTasks: [
    {
      id: 'task-001',
      title: 'Obtain missing certificate of incorporation',
      description: 'Request the document from ACME Holdings',
      isBlocking: true,
      dueAt: '2025-12-01T00:00:00Z',
      assignedTo: 'John Operator',
      status: 'OPEN',
    },
  ],
  riskNotes: 'Medium risk — additional scrutiny applied.',
  lastReviewedAt: '2025-10-25T00:00:00Z',
  internalNotes: 'Under standard review cycle.',
}

const MOCK_COHORT_READY: BackendCohortReadiness = {
  cohortId: 'cohort-001',
  cohortName: 'Token Launch Alpha',
  overallStatus: 'READY',
  totalCases: 10,
  completedCases: 10,
  blockedCases: 0,
  pendingCases: 0,
  staleCases: 0,
  readinessScore: 100,
  cohortBlockers: [],
  computedAt: '2025-11-01T12:00:00Z',
}

const MOCK_COHORT_BLOCKED: BackendCohortReadiness = {
  cohortId: 'cohort-002',
  cohortName: 'Token Launch Beta',
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
      title: 'KYC documentation missing for 2 entities',
      reason: 'Two investors have not submitted KYC documents.',
      affectedCaseIds: ['case-001', 'case-002'],
      severity: 'HIGH',
      remediationPath: '/compliance/setup',
    },
    {
      id: 'blk-002',
      title: 'AML flag unresolved for Meridian Fund',
      reason: 'Sanctions watchlist hit requires manual review.',
      affectedCaseIds: ['case-003'],
      severity: 'CRITICAL',
      remediationPath: '/compliance/reporting',
    },
  ],
  computedAt: '2025-11-01T12:00:00Z',
}

const MOCK_COHORT_STALE: BackendCohortReadiness = {
  ...MOCK_COHORT_READY,
  cohortId: 'cohort-003',
  overallStatus: 'STALE',
  staleCases: 3,
  readinessScore: 60,
}

const MOCK_COHORT_PARTIAL: BackendCohortReadiness = {
  cohortId: 'cohort-004',
  cohortName: 'Token Launch Gamma',
  overallStatus: 'PARTIALLY_READY',
  totalCases: 10,
  completedCases: 6,
  blockedCases: 0,
  pendingCases: 4,
  staleCases: 0,
  readinessScore: 60,
  cohortBlockers: [],
  computedAt: '2025-11-01T12:00:00Z',
}

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

describe('CASE_STATUS_LABELS', () => {
  it('covers all known status codes', () => {
    const statuses = ['PENDING', 'UNDER_REVIEW', 'AWAITING_DOCUMENTS', 'ESCALATED', 'APPROVED',
      'CONDITIONALLY_APPROVED', 'REJECTED', 'STALE', 'ARCHIVED', 'UNKNOWN'] as const
    for (const s of statuses) {
      expect(CASE_STATUS_LABELS[s]).toBeTruthy()
    }
  })
})

describe('RISK_LEVEL_LABELS', () => {
  it('covers all risk levels', () => {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN'] as const
    for (const l of levels) {
      expect(RISK_LEVEL_LABELS[l]).toBeTruthy()
    }
  })
})

describe('EVIDENCE_STATUS_LABELS', () => {
  it('covers all evidence statuses', () => {
    const statuses = ['PRESENT', 'MISSING', 'STALE', 'PENDING_UPLOAD', 'REJECTED', 'UNKNOWN'] as const
    for (const s of statuses) {
      expect(EVIDENCE_STATUS_LABELS[s]).toBeTruthy()
    }
  })
})

describe('JURISDICTION_OUTCOME_LABELS', () => {
  it('covers all outcomes', () => {
    const outcomes = ['PERMITTED', 'RESTRICTED', 'PROHIBITED', 'UNDER_REVIEW', 'UNKNOWN'] as const
    for (const o of outcomes) {
      expect(JURISDICTION_OUTCOME_LABELS[o]).toBeTruthy()
    }
  })
})

describe('SCREENING_OUTCOME_LABELS', () => {
  it('covers all screening outcomes', () => {
    const outcomes = ['CLEAR', 'FLAGGED', 'WATCHLIST_HIT', 'SANCTIONS_HIT', 'PENDING', 'UNKNOWN'] as const
    for (const o of outcomes) {
      expect(SCREENING_OUTCOME_LABELS[o]).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// mapCaseStatusToStageStatus
// ---------------------------------------------------------------------------

describe('mapCaseStatusToStageStatus', () => {
  it('maps APPROVED → complete', () => {
    expect(mapCaseStatusToStageStatus('APPROVED')).toBe('complete')
  })
  it('maps CONDITIONALLY_APPROVED → pending_review', () => {
    expect(mapCaseStatusToStageStatus('CONDITIONALLY_APPROVED')).toBe('pending_review')
  })
  it('maps UNDER_REVIEW → in_progress', () => {
    expect(mapCaseStatusToStageStatus('UNDER_REVIEW')).toBe('in_progress')
  })
  it('maps AWAITING_DOCUMENTS → blocked (fail-closed)', () => {
    expect(mapCaseStatusToStageStatus('AWAITING_DOCUMENTS')).toBe('blocked')
  })
  it('maps ESCALATED → blocked (fail-closed)', () => {
    expect(mapCaseStatusToStageStatus('ESCALATED')).toBe('blocked')
  })
  it('maps PENDING → not_started', () => {
    expect(mapCaseStatusToStageStatus('PENDING')).toBe('not_started')
  })
  it('maps STALE → stale', () => {
    expect(mapCaseStatusToStageStatus('STALE')).toBe('stale')
  })
  it('maps REJECTED → blocked (fail-closed)', () => {
    expect(mapCaseStatusToStageStatus('REJECTED')).toBe('blocked')
  })
  it('maps ARCHIVED → blocked (fail-closed)', () => {
    expect(mapCaseStatusToStageStatus('ARCHIVED')).toBe('blocked')
  })
  it('maps UNKNOWN → blocked (fail-closed: unknown = blocked)', () => {
    expect(mapCaseStatusToStageStatus('UNKNOWN')).toBe('blocked')
  })
})

// ---------------------------------------------------------------------------
// mapRiskLevelToBlockerSeverity
// ---------------------------------------------------------------------------

describe('mapRiskLevelToBlockerSeverity', () => {
  it('maps CRITICAL → critical', () => {
    expect(mapRiskLevelToBlockerSeverity('CRITICAL')).toBe('critical')
  })
  it('maps HIGH → high', () => {
    expect(mapRiskLevelToBlockerSeverity('HIGH')).toBe('high')
  })
  it('maps MEDIUM → medium', () => {
    expect(mapRiskLevelToBlockerSeverity('MEDIUM')).toBe('medium')
  })
  it('maps LOW → informational', () => {
    expect(mapRiskLevelToBlockerSeverity('LOW')).toBe('informational')
  })
  it('maps UNKNOWN → high (fail-closed)', () => {
    expect(mapRiskLevelToBlockerSeverity('UNKNOWN')).toBe('high')
  })
})

// ---------------------------------------------------------------------------
// isCaseStatusBlocking
// ---------------------------------------------------------------------------

describe('isCaseStatusBlocking', () => {
  it('returns true for AWAITING_DOCUMENTS', () => {
    expect(isCaseStatusBlocking('AWAITING_DOCUMENTS')).toBe(true)
  })
  it('returns true for ESCALATED', () => {
    expect(isCaseStatusBlocking('ESCALATED')).toBe(true)
  })
  it('returns true for REJECTED', () => {
    expect(isCaseStatusBlocking('REJECTED')).toBe(true)
  })
  it('returns true for STALE', () => {
    expect(isCaseStatusBlocking('STALE')).toBe(true)
  })
  it('returns true for UNKNOWN (fail-closed)', () => {
    expect(isCaseStatusBlocking('UNKNOWN')).toBe(true)
  })
  it('returns false for APPROVED', () => {
    expect(isCaseStatusBlocking('APPROVED')).toBe(false)
  })
  it('returns false for UNDER_REVIEW', () => {
    expect(isCaseStatusBlocking('UNDER_REVIEW')).toBe(false)
  })
  it('returns false for PENDING', () => {
    expect(isCaseStatusBlocking('PENDING')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isScreeningOutcomeConcerning
// ---------------------------------------------------------------------------

describe('isScreeningOutcomeConcerning', () => {
  it('returns true for FLAGGED', () => {
    expect(isScreeningOutcomeConcerning('FLAGGED')).toBe(true)
  })
  it('returns true for WATCHLIST_HIT', () => {
    expect(isScreeningOutcomeConcerning('WATCHLIST_HIT')).toBe(true)
  })
  it('returns true for SANCTIONS_HIT', () => {
    expect(isScreeningOutcomeConcerning('SANCTIONS_HIT')).toBe(true)
  })
  it('returns false for CLEAR', () => {
    expect(isScreeningOutcomeConcerning('CLEAR')).toBe(false)
  })
  it('returns false for PENDING', () => {
    expect(isScreeningOutcomeConcerning('PENDING')).toBe(false)
  })
  it('returns false for UNKNOWN', () => {
    expect(isScreeningOutcomeConcerning('UNKNOWN')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isJurisdictionOutcomeBlocking
// ---------------------------------------------------------------------------

describe('isJurisdictionOutcomeBlocking', () => {
  it('returns true for RESTRICTED', () => {
    expect(isJurisdictionOutcomeBlocking('RESTRICTED')).toBe(true)
  })
  it('returns true for PROHIBITED', () => {
    expect(isJurisdictionOutcomeBlocking('PROHIBITED')).toBe(true)
  })
  it('returns false for PERMITTED', () => {
    expect(isJurisdictionOutcomeBlocking('PERMITTED')).toBe(false)
  })
  it('returns false for UNDER_REVIEW', () => {
    expect(isJurisdictionOutcomeBlocking('UNDER_REVIEW')).toBe(false)
  })
  it('returns false for UNKNOWN', () => {
    expect(isJurisdictionOutcomeBlocking('UNKNOWN')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isEvidenceStatusDeficient
// ---------------------------------------------------------------------------

describe('isEvidenceStatusDeficient', () => {
  it('returns true for MISSING (fail-closed)', () => {
    expect(isEvidenceStatusDeficient('MISSING')).toBe(true)
  })
  it('returns true for STALE', () => {
    expect(isEvidenceStatusDeficient('STALE')).toBe(true)
  })
  it('returns true for REJECTED', () => {
    expect(isEvidenceStatusDeficient('REJECTED')).toBe(true)
  })
  it('returns true for UNKNOWN (fail-closed)', () => {
    expect(isEvidenceStatusDeficient('UNKNOWN')).toBe(true)
  })
  it('returns false for PRESENT', () => {
    expect(isEvidenceStatusDeficient('PRESENT')).toBe(false)
  })
  it('returns false for PENDING_UPLOAD', () => {
    expect(isEvidenceStatusDeficient('PENDING_UPLOAD')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isEvidenceFreshnessFailing
// ---------------------------------------------------------------------------

describe('isEvidenceFreshnessFailing', () => {
  const makeItem = (overrides: Partial<Parameters<typeof isEvidenceFreshnessFailing>[0]>) => ({
    id: 'ev-test',
    documentType: 'Test',
    status: 'PRESENT' as const,
    lastVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    expiresAt: null,
    reviewedBy: null,
    documentUrl: null,
    reviewerNotes: null,
    ...overrides,
  })

  it('returns false for a recently verified PRESENT item', () => {
    expect(isEvidenceFreshnessFailing(makeItem({}))).toBe(false)
  })

  it('returns true for a MISSING item', () => {
    expect(isEvidenceFreshnessFailing(makeItem({ status: 'MISSING' }))).toBe(true)
  })

  it('returns true for a STALE status item', () => {
    expect(isEvidenceFreshnessFailing(makeItem({ status: 'STALE' }))).toBe(true)
  })

  it('returns true when lastVerifiedAt is null (fail-closed)', () => {
    expect(isEvidenceFreshnessFailing(makeItem({ lastVerifiedAt: null }))).toBe(true)
  })

  it('returns true when lastVerifiedAt is invalid date string (fail-closed)', () => {
    expect(isEvidenceFreshnessFailing(makeItem({ lastVerifiedAt: 'NOT_A_DATE' }))).toBe(true)
  })

  it('returns true when item is older than the staleness window', () => {
    const staleDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() // 40 days
    expect(isEvidenceFreshnessFailing(makeItem({ lastVerifiedAt: staleDate }), 30)).toBe(true)
  })

  it('returns false when item is within the custom staleness window', () => {
    const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    expect(isEvidenceFreshnessFailing(makeItem({ lastVerifiedAt: recentDate }), 30)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isEvidenceExpired
// ---------------------------------------------------------------------------

describe('isEvidenceExpired', () => {
  const makeItem = (expiresAt: string | null) => ({
    id: 'ev', documentType: 'T', status: 'PRESENT' as const,
    lastVerifiedAt: null, expiresAt, reviewedBy: null, documentUrl: null, reviewerNotes: null,
  })

  it('returns false when expiresAt is null', () => {
    expect(isEvidenceExpired(makeItem(null))).toBe(false)
  })

  it('returns false when expiry is in the future', () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    expect(isEvidenceExpired(makeItem(future))).toBe(false)
  })

  it('returns true when expiry is in the past', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // yesterday
    expect(isEvidenceExpired(makeItem(past))).toBe(true)
  })

  it('returns false for invalid date string (graceful)', () => {
    expect(isEvidenceExpired(makeItem('INVALID'))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// normaliseCaseSummary
// ---------------------------------------------------------------------------

describe('normaliseCaseSummary', () => {
  it('maps operator-readable status label', () => {
    const summary = normaliseCaseSummary(MOCK_CASE)
    expect(summary.statusLabel).toBe('Under Review')
  })

  it('maps APPROVED KYC → kycApproved: true', () => {
    const summary = normaliseCaseSummary(MOCK_CASE)
    expect(summary.kycApproved).toBe(true)
    expect(summary.kycOutcomeLabel).toBe('KYC Verified')
  })

  it('maps FAILED KYC → kycApproved: false', () => {
    const summary = normaliseCaseSummary({ ...MOCK_CASE, kycOutcome: 'FAILED' })
    expect(summary.kycApproved).toBe(false)
    expect(summary.kycOutcomeLabel).toBe('KYC Failed')
  })

  it('maps NOT_STARTED KYC label', () => {
    const summary = normaliseCaseSummary({ ...MOCK_CASE, kycOutcome: 'NOT_STARTED' })
    expect(summary.kycOutcomeLabel).toBe('KYC Not Started')
  })

  it('maps CLEAR AML → amlClear: true', () => {
    const summary = normaliseCaseSummary(MOCK_CASE)
    expect(summary.amlClear).toBe(true)
  })

  it('maps SANCTIONS_HIT AML → amlClear: false', () => {
    const summary = normaliseCaseSummary({ ...MOCK_CASE, amlOutcome: 'SANCTIONS_HIT' })
    expect(summary.amlClear).toBe(false)
    expect(summary.amlOutcomeLabel).toBe('Sanctions Match')
  })

  it('shows "Unassigned" when reviewerId is null', () => {
    const summary = normaliseCaseSummary({ ...MOCK_CASE, assignedReviewer: null })
    expect(summary.assignedReviewer).toBe('Unassigned')
  })

  it('shows "No recent activity" when lastActivityAt is null', () => {
    const summary = normaliseCaseSummary({ ...MOCK_CASE, lastActivityAt: null })
    expect(summary.lastActivityLabel).toBe('No recent activity')
  })

  it('marks isLaunchBlocking from hasLaunchBlockers', () => {
    const s1 = normaliseCaseSummary({ ...MOCK_CASE, hasLaunchBlockers: true })
    expect(s1.isLaunchBlocking).toBe(true)
    const s2 = normaliseCaseSummary({ ...MOCK_CASE, hasLaunchBlockers: false })
    expect(s2.isLaunchBlocking).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// normaliseCaseDetail
// ---------------------------------------------------------------------------

describe('normaliseCaseDetail', () => {
  it('flags hasJurisdictionConflicts when PROHIBITED jurisdiction exists', () => {
    const detail = normaliseCaseDetail(MOCK_DETAIL)
    expect(detail.hasJurisdictionConflicts).toBe(true)
  })

  it('flags hasStaleEvidence when any evidence item is MISSING', () => {
    const detail = normaliseCaseDetail(MOCK_DETAIL)
    expect(detail.hasStaleEvidence).toBe(true)
  })

  it('does not flag hasUnresolvedAMLFlags when AML is CLEAR', () => {
    const detail = normaliseCaseDetail(MOCK_DETAIL)
    expect(detail.hasUnresolvedAMLFlags).toBe(false)
  })

  it('flags hasUnresolvedAMLFlags when AML is FLAGGED and no resolvedAt', () => {
    const detail = normaliseCaseDetail({
      ...MOCK_DETAIL,
      amlOutcome: 'FLAGGED',
      amlDetail: { ...MOCK_DETAIL.amlDetail, flagReason: 'Watchlist hit', resolvedAt: null },
    })
    expect(detail.hasUnresolvedAMLFlags).toBe(true)
  })

  it('does not flag hasUnresolvedAMLFlags when AML is resolved', () => {
    const detail = normaliseCaseDetail({
      ...MOCK_DETAIL,
      amlOutcome: 'FLAGGED',
      amlDetail: { ...MOCK_DETAIL.amlDetail, flagReason: 'Watchlist hit', resolvedAt: '2025-10-20T00:00:00Z' },
    })
    expect(detail.hasUnresolvedAMLFlags).toBe(false)
  })

  it('marks evidencePackComplete as false when items are missing', () => {
    const detail = normaliseCaseDetail(MOCK_DETAIL)
    expect(detail.evidencePackComplete).toBe(false)
  })

  it('marks evidencePackComplete as true when all PRESENT and fresh', () => {
    const allPresent = {
      ...MOCK_DETAIL,
      evidenceItems: [{
        id: 'ev-001',
        documentType: 'Passport',
        status: 'PRESENT' as const,
        lastVerifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: null,
        reviewedBy: 'Jane',
        documentUrl: null,
        reviewerNotes: null,
      }],
    }
    const detail = normaliseCaseDetail(allPresent)
    expect(detail.evidencePackComplete).toBe(true)
  })

  it('uses "Not assigned" for null reviewedBy in evidence items', () => {
    const detail = normaliseCaseDetail({
      ...MOCK_DETAIL,
      evidenceItems: [{ ...MOCK_DETAIL.evidenceItems[0], reviewedBy: null }],
    })
    expect(detail.evidenceItems[0].reviewedBy).toBe('Not assigned')
  })

  it('normalises OPEN remediation task status', () => {
    const detail = normaliseCaseDetail(MOCK_DETAIL)
    expect(detail.remediationTasks[0].statusLabel).toBe('Open')
  })

  it('marks OVERDUE task correctly', () => {
    const detail = normaliseCaseDetail({
      ...MOCK_DETAIL,
      remediationTasks: [{ ...MOCK_DETAIL.remediationTasks[0], status: 'OVERDUE' as const }],
    })
    expect(detail.remediationTasks[0].isOverdue).toBe(true)
    expect(detail.remediationTasks[0].statusLabel).toBe('Overdue')
  })

  it('uses "Not assigned" for null assignedTo in remediation task', () => {
    const detail = normaliseCaseDetail({
      ...MOCK_DETAIL,
      remediationTasks: [{ ...MOCK_DETAIL.remediationTasks[0], assignedTo: null }],
    })
    expect(detail.remediationTasks[0].assignedTo).toBe('Unassigned')
  })

  it('uses "No due date" when dueAt is null', () => {
    const detail = normaliseCaseDetail({
      ...MOCK_DETAIL,
      remediationTasks: [{ ...MOCK_DETAIL.remediationTasks[0], dueAt: null }],
    })
    expect(detail.remediationTasks[0].dueDateLabel).toBe('No due date')
  })
})

// ---------------------------------------------------------------------------
// normaliseCohortReadinessToStages
// ---------------------------------------------------------------------------

describe('normaliseCohortReadinessToStages', () => {
  it('returns 7 stages for any cohort', () => {
    expect(normaliseCohortReadinessToStages(MOCK_COHORT_READY)).toHaveLength(7)
    expect(normaliseCohortReadinessToStages(MOCK_COHORT_BLOCKED)).toHaveLength(7)
    expect(normaliseCohortReadinessToStages(MOCK_COHORT_STALE)).toHaveLength(7)
  })

  it('marks approval_handoff as complete when cohort is READY', () => {
    const stages = normaliseCohortReadinessToStages(MOCK_COHORT_READY)
    const handoff = stages.find((s) => s.id === 'approval_handoff')
    expect(handoff?.status).toBe('complete')
  })

  it('marks approval_handoff as not_started when cohort is BLOCKED', () => {
    const stages = normaliseCohortReadinessToStages(MOCK_COHORT_BLOCKED)
    const handoff = stages.find((s) => s.id === 'approval_handoff')
    expect(handoff?.status).toBe('not_started')
  })

  it('marks approval_handoff as pending_review when PARTIALLY_READY', () => {
    const stages = normaliseCohortReadinessToStages(MOCK_COHORT_PARTIAL)
    const handoff = stages.find((s) => s.id === 'approval_handoff')
    expect(handoff?.status).toBe('pending_review')
  })

  it('adds stale blocker on documentation_review when staleCases > 0', () => {
    const stages = normaliseCohortReadinessToStages(MOCK_COHORT_STALE)
    const doc = stages.find((s) => s.id === 'documentation_review')
    expect(doc?.status).toBe('stale')
    expect(doc?.blockers).toHaveLength(1)
    expect(doc?.blockers[0].isLaunchBlocking).toBe(true)
  })

  it('maps KYC blocker to identity_kyc_review stage', () => {
    const stages = normaliseCohortReadinessToStages(MOCK_COHORT_BLOCKED)
    const kyc = stages.find((s) => s.id === 'identity_kyc_review')
    expect(kyc?.status).toBe('blocked')
    expect(kyc?.blockers.some((b) => b.title.toLowerCase().includes('kyc'))).toBe(true)
  })

  it('maps AML blocker to aml_risk_review stage', () => {
    const stages = normaliseCohortReadinessToStages(MOCK_COHORT_BLOCKED)
    const aml = stages.find((s) => s.id === 'aml_risk_review')
    expect(aml?.status).toBe('blocked')
    expect(aml?.blockers.some((b) => b.title.toLowerCase().includes('aml'))).toBe(true)
  })

  it('marks intake as complete when totalCases > 0', () => {
    const stages = normaliseCohortReadinessToStages(MOCK_COHORT_READY)
    const intake = stages.find((s) => s.id === 'intake')
    expect(intake?.status).toBe('complete')
  })

  it('marks intake as not_started when totalCases === 0', () => {
    const emptyCohort = { ...MOCK_COHORT_READY, totalCases: 0 }
    const stages = normaliseCohortReadinessToStages(emptyCohort)
    const intake = stages.find((s) => s.id === 'intake')
    expect(intake?.status).toBe('not_started')
  })

  it('provides approval handoff evidence link when READY', () => {
    const stages = normaliseCohortReadinessToStages(MOCK_COHORT_READY)
    const handoff = stages.find((s) => s.id === 'approval_handoff')
    expect(handoff?.evidenceLinks.some((l) => l.path === '/compliance/approval')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// normaliseCohortReadinessSummary
// ---------------------------------------------------------------------------

describe('normaliseCohortReadinessSummary', () => {
  it('marks isReadyForHandoff true for READY cohort', () => {
    const summary = normaliseCohortReadinessSummary(MOCK_COHORT_READY)
    expect(summary.isReadyForHandoff).toBe(true)
    expect(summary.statusLabel).toBe('Ready for Handoff')
  })

  it('marks isReadyForHandoff false for BLOCKED cohort', () => {
    const summary = normaliseCohortReadinessSummary(MOCK_COHORT_BLOCKED)
    expect(summary.isReadyForHandoff).toBe(false)
    expect(summary.hasLaunchBlockers).toBe(true)
  })

  it('headline mentions blocked cases for BLOCKED cohort', () => {
    const summary = normaliseCohortReadinessSummary(MOCK_COHORT_BLOCKED)
    expect(summary.headline).toContain('blocked')
  })

  it('headline mentions stale cases for STALE cohort', () => {
    const summary = normaliseCohortReadinessSummary(MOCK_COHORT_STALE)
    expect(summary.headline).toContain('Evidence has expired')
  })

  it('includes up to 5 blocker titles', () => {
    const summary = normaliseCohortReadinessSummary(MOCK_COHORT_BLOCKED)
    expect(summary.blockerTitles).toHaveLength(2) // only 2 blockers in fixture
    expect(summary.blockerTitles[0]).toContain('KYC')
  })

  it('readinessScore matches cohort value', () => {
    const summary = normaliseCohortReadinessSummary(MOCK_COHORT_READY)
    expect(summary.readinessScore).toBe(100)
  })

  it('produces a computedAtLabel string', () => {
    const summary = normaliseCohortReadinessSummary(MOCK_COHORT_READY)
    expect(summary.computedAtLabel).toBeTruthy()
    expect(summary.computedAtLabel).not.toBe('No recent activity')
  })

  it('correctly counts cases', () => {
    const summary = normaliseCohortReadinessSummary(MOCK_COHORT_BLOCKED)
    expect(summary.totalCases).toBe(10)
    expect(summary.blockedCases).toBe(2)
    expect(summary.pendingCases).toBe(1)
  })

  it('marks UNKNOWN status as not ready (fail-closed)', () => {
    const unknown = { ...MOCK_COHORT_READY, overallStatus: 'UNKNOWN' as const }
    const summary = normaliseCohortReadinessSummary(unknown)
    expect(summary.isReadyForHandoff).toBe(false)
    expect(summary.statusLabel).toContain('Unknown')
  })
})

// ---------------------------------------------------------------------------
// buildDegradedOnboardingStages
// ---------------------------------------------------------------------------

describe('buildDegradedOnboardingStages', () => {
  const reason = 'Compliance service returned 503 — temporarily unavailable.'
  const stages = buildDegradedOnboardingStages(reason)

  it('returns 7 stages', () => {
    expect(stages).toHaveLength(7)
  })

  it('all stages have status blocked (fail-closed)', () => {
    for (const stage of stages) {
      expect(stage.status).toBe('blocked')
    }
  })

  it('each stage has exactly 1 blocker with critical severity', () => {
    for (const stage of stages) {
      expect(stage.blockers).toHaveLength(1)
      expect(stage.blockers[0].severity).toBe('critical')
      expect(stage.blockers[0].isLaunchBlocking).toBe(true)
    }
  })

  it('blocker reason contains the provided reason string', () => {
    for (const stage of stages) {
      expect(stage.blockers[0].reason).toBe(reason)
    }
  })

  it('recommendedAction warns not to proceed until service recovers', () => {
    for (const stage of stages) {
      expect(stage.blockers[0].recommendedAction).toContain('Do not proceed')
    }
  })

  it('lastActionAt is null (no live data available)', () => {
    for (const stage of stages) {
      expect(stage.lastActionAt).toBeNull()
    }
  })
})
