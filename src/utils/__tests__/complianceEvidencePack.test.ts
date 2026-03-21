import { describe, it, expect } from 'vitest'
import {
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
  RELEASE_GRADE_LABEL,
  PERMISSIVE_GRADE_LABEL,
  OVERALL_STATUS_LABEL,
  type EvidenceStatus,
  type EvidenceSection,
  type ComplianceReportBundle,
} from '../complianceEvidencePack'

const ALL_STATUSES: EvidenceStatus[] = ['ready', 'warning', 'failed', 'pending', 'unavailable']

describe('complianceEvidencePack utilities', () => {
  describe('STATUS_LABELS', () => {
    it('has an entry for every EvidenceStatus', () => {
      for (const status of ALL_STATUSES) {
        expect(STATUS_LABELS[status]).toBeTruthy()
      }
    })

    it('ready label mentions release review', () => {
      expect(STATUS_LABELS.ready.toLowerCase()).toContain('release')
    })

    it('failed label mentions missing required evidence', () => {
      expect(STATUS_LABELS.failed.toLowerCase()).toContain('missing')
    })

    it('warning label mentions review', () => {
      expect(STATUS_LABELS.warning.toLowerCase()).toContain('review')
    })

    it('pending label communicates an in-progress state', () => {
      expect(STATUS_LABELS.pending).toBeTruthy()
      expect(typeof STATUS_LABELS.pending).toBe('string')
    })

    it('unavailable label communicates source unavailability', () => {
      expect(STATUS_LABELS.unavailable.toLowerCase()).toContain('unavailable')
    })
  })

  describe('STATUS_DESCRIPTIONS', () => {
    it('has a non-empty description for every EvidenceStatus', () => {
      for (const status of ALL_STATUSES) {
        expect(STATUS_DESCRIPTIONS[status]).toBeTruthy()
        expect(STATUS_DESCRIPTIONS[status].length).toBeGreaterThan(10)
      }
    })

    it('ready description implies positive outcome', () => {
      expect(STATUS_DESCRIPTIONS.ready.toLowerCase()).toContain('present')
    })

    it('failed description implies missing or non-meeting criteria', () => {
      const desc = STATUS_DESCRIPTIONS.failed.toLowerCase()
      expect(desc.includes('missing') || desc.includes('criteria')).toBe(true)
    })

    it('unavailable description mentions source or configuration', () => {
      const desc = STATUS_DESCRIPTIONS.unavailable.toLowerCase()
      expect(desc.includes('source') || desc.includes('configuration')).toBe(true)
    })
  })

  describe('RELEASE_GRADE_LABEL', () => {
    it('is a non-empty string', () => {
      expect(typeof RELEASE_GRADE_LABEL).toBe('string')
      expect(RELEASE_GRADE_LABEL.length).toBeGreaterThan(0)
    })

    it('mentions release', () => {
      expect(RELEASE_GRADE_LABEL.toLowerCase()).toContain('release')
    })
  })

  describe('PERMISSIVE_GRADE_LABEL', () => {
    it('is a non-empty string', () => {
      expect(typeof PERMISSIVE_GRADE_LABEL).toBe('string')
      expect(PERMISSIVE_GRADE_LABEL.length).toBeGreaterThan(0)
    })

    it('explicitly states it is NOT release sign-off', () => {
      const label = PERMISSIVE_GRADE_LABEL.toLowerCase()
      expect(label.includes('not') || label.includes('developer')).toBe(true)
    })
  })

  describe('OVERALL_STATUS_LABEL', () => {
    it('has an entry for every EvidenceStatus', () => {
      for (const status of ALL_STATUSES) {
        expect(OVERALL_STATUS_LABEL[status]).toBeTruthy()
      }
    })

    it('ready label communicates no critical blockers', () => {
      const label = OVERALL_STATUS_LABEL.ready.toLowerCase()
      expect(label.includes('ready') || label.includes('no critical')).toBe(true)
    })

    it('failed label communicates must-resolve blockers', () => {
      const label = OVERALL_STATUS_LABEL.failed.toLowerCase()
      expect(label.includes('blocker') || label.includes('resolve') || label.includes('critical')).toBe(true)
    })

    it('pending label communicates collection in progress', () => {
      const label = OVERALL_STATUS_LABEL.pending.toLowerCase()
      expect(label.includes('progress') || label.includes('pending') || label.includes('collecting')).toBe(true)
    })
  })

  describe('EvidenceSection type shape', () => {
    it('accepts a valid EvidenceSection object', () => {
      const section: EvidenceSection = {
        id: 'test-section',
        title: 'Test Section',
        status: 'ready',
        releaseGrade: true,
        summary: 'All checks passed.',
        details: ['Detail 1', 'Detail 2'],
        timestamp: '2024-01-01T00:00:00Z',
        actionLabel: null,
        actionPath: null,
      }
      expect(section.id).toBe('test-section')
      expect(section.releaseGrade).toBe(true)
      expect(section.status).toBe('ready')
    })
  })

  describe('ComplianceReportBundle type shape', () => {
    it('accepts a minimal ComplianceReportBundle object', () => {
      const bundle: ComplianceReportBundle = {
        generatedAt: '2024-01-01T00:00:00Z',
        launchName: 'Test Launch',
        overallStatus: 'pending',
        readinessScore: 42,
        jurisdiction: {
          configured: false,
          jurisdictions: [],
          restrictedCount: 0,
          permittedCount: 0,
          staleSince: null,
        },
        kycAml: {
          status: 'pending',
          kycRequired: true,
          amlRequired: true,
          providerConfigured: false,
          pendingReviewCount: 0,
          staleSince: null,
        },
        whitelist: {
          status: 'pending',
          whitelistRequired: false,
          approvedInvestorCount: 0,
          pendingInvestorCount: 0,
          activeWhitelistId: null,
          staleSince: null,
        },
        investorEligibility: {
          status: 'pending',
          accreditedRequired: false,
          retailPermitted: true,
          eligibilityCategories: [],
          staleSince: null,
        },
        evidenceSections: [],
        exportVersion: '1.0',
      }
      expect(bundle.exportVersion).toBe('1.0')
      expect(bundle.overallStatus).toBe('pending')
      expect(bundle.readinessScore).toBe(42)
    })
  })
})
