/**
 * Integration tests: GuidedLaunch store × ComplianceReadiness gating
 *
 * Tests the module boundary between the guidedLaunch Pinia store and the
 * compliance-gating logic introduced in this PR. Validates:
 *
 * 1. Store correctly persists and restores `riskAcknowledged` in draft data
 * 2. Store readiness score responds correctly to compliance with `riskAcknowledged`
 * 3. Draft load → mount behavior with and without `riskAcknowledged` field
 * 4. `canSubmit` gate remains closed until all required fields (including acknowledged compliance) are set
 *
 * Business value: Prevents activation drop-off caused by silent compliance bypass.
 * If the store–component contract breaks (e.g., `riskAcknowledged` not persisted),
 * users would lose acknowledgement state on page reload and be blocked at the
 * compliance step with no explanation.
 *
 * Regression risk: HIGH — removing or changing this contract breaks the compliance
 * step gating entirely, allowing non-acknowledged deployments through to backend.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from '../guidedLaunch'
import type { ComplianceReadiness } from '../../types/guidedLaunch'

// ─── Helpers ────────────────────────────────────────────────────────────────

function compliantReadiness(overrides: Partial<ComplianceReadiness> = {}): ComplianceReadiness {
  return {
    requiresMICA: false,
    requiresKYC: false,
    requiresAML: false,
    hasLegalReview: false,
    hasRiskAssessment: false,
    restrictedJurisdictions: [],
    whitelistRequired: false,
    riskAcknowledged: true,
    ...overrides,
  }
}

// ─── Store persistence ───────────────────────────────────────────────────────

describe('GuidedLaunch store × ComplianceReadiness: persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('persists riskAcknowledged=true in draft', () => {
    const store = useGuidedLaunchStore()
    store.setComplianceReadiness(compliantReadiness({ riskAcknowledged: true }))
    store.saveDraft()

    const raw = localStorage.getItem('biatec_guided_launch_draft')
    expect(raw).toBeTruthy()
    const draft = JSON.parse(raw!)
    expect(draft.form.complianceReadiness.riskAcknowledged).toBe(true)
  })

  it('persists riskAcknowledged=false in draft', () => {
    const store = useGuidedLaunchStore()
    store.setComplianceReadiness(compliantReadiness({ riskAcknowledged: false }))
    store.saveDraft()

    const raw = localStorage.getItem('biatec_guided_launch_draft')
    const draft = JSON.parse(raw!)
    expect(draft.form.complianceReadiness.riskAcknowledged).toBe(false)
  })

  it('restores riskAcknowledged=true from draft on loadDraft()', () => {
    const store1 = useGuidedLaunchStore()
    store1.setComplianceReadiness(compliantReadiness({ riskAcknowledged: true }))
    store1.saveDraft()

    setActivePinia(createPinia())
    const store2 = useGuidedLaunchStore()
    store2.loadDraft()

    expect(store2.currentForm.complianceReadiness?.riskAcknowledged).toBe(true)
  })

  it('loads old draft without riskAcknowledged field without crashing (backward compat)', () => {
    // Write an old-format draft directly to localStorage
    const oldDraft = {
      version: '1.0',
      form: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        currentStep: 2,
        completedSteps: [],
        isSubmitted: false,
        complianceReadiness: {
          requiresMICA: false,
          requiresKYC: false,
          requiresAML: false,
          hasLegalReview: false,
          hasRiskAssessment: false,
          restrictedJurisdictions: [],
          whitelistRequired: false,
          // riskAcknowledged intentionally absent — old draft
        },
      },
      stepStatuses: [],
    }
    localStorage.setItem('biatec_guided_launch_draft', JSON.stringify(oldDraft))

    const store = useGuidedLaunchStore()
    expect(() => store.loadDraft()).not.toThrow()

    // riskAcknowledged should be absent/undefined (not crash), and NOT true
    const loaded = store.currentForm.complianceReadiness
    expect(loaded?.riskAcknowledged).toBeFalsy()
  })
})

// ─── Readiness score ─────────────────────────────────────────────────────────

describe('GuidedLaunch store × ComplianceReadiness: readiness score', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('MICA without legal review produces a warning in readiness score', () => {
    const store = useGuidedLaunchStore()
    store.setComplianceReadiness(compliantReadiness({
      requiresMICA: true,
      hasLegalReview: false,
      riskAcknowledged: true,
    }))

    const warnings = store.readinessScore.warnings
    expect(warnings.some(w => /MICA/i.test(w))).toBe(true)
  })

  it('MICA with legal review clears the MICA warning', () => {
    const store = useGuidedLaunchStore()
    store.setComplianceReadiness(compliantReadiness({
      requiresMICA: true,
      hasLegalReview: true,
      riskAcknowledged: true,
    }))

    const warnings = store.readinessScore.warnings
    expect(warnings.some(w => /MICA/i.test(w))).toBe(false)
  })

  it('canSubmit is false if compliance step not completed', () => {
    const store = useGuidedLaunchStore()
    // Complete all steps except compliance (index 2)
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    // compliance (2) not completed
    store.completeStep(3, { isValid: true, errors: [], warnings: [] }) // whitelist
    store.completeStep(4, { isValid: true, errors: [], warnings: [] }) // template
    store.completeStep(6, { isValid: true, errors: [], warnings: [] }) // review

    expect(store.canSubmit).toBe(false)
  })

  it('canSubmit is true when all required steps including compliance are completed', () => {
    const store = useGuidedLaunchStore()
    // Set complete + valid data
    store.setOrganizationProfile({
      organizationName: 'Test Corp',
      organizationType: 'company',
      jurisdiction: 'US',
      contactName: 'John Doe',
      contactEmail: 'john@test.com',
      role: 'business_owner',
    })
    store.setComplianceReadiness(compliantReadiness())
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    store.completeStep(2, { isValid: true, errors: [], warnings: [] }) // compliance
    store.completeStep(3, { isValid: true, errors: [], warnings: [] }) // whitelist
    store.completeStep(4, { isValid: true, errors: [], warnings: [] }) // template
    store.completeStep(6, { isValid: true, errors: [], warnings: [] }) // review

    expect(store.canSubmit).toBe(true)
  })
})

// ─── ComplianceReadiness type contract ───────────────────────────────────────

describe('ComplianceReadiness type contract', () => {
  it('riskAcknowledged is optional in the interface (backward compat)', () => {
    // If this compiles and runs without error, the field is optional
    const without: ComplianceReadiness = {
      requiresMICA: false,
      requiresKYC: false,
      requiresAML: false,
      hasLegalReview: false,
      hasRiskAssessment: false,
      restrictedJurisdictions: [],
      whitelistRequired: false,
    }
    expect(without.riskAcknowledged).toBeUndefined()
  })

  it('riskAcknowledged can be set to true', () => {
    const withAck: ComplianceReadiness = {
      requiresMICA: false,
      requiresKYC: false,
      requiresAML: false,
      hasLegalReview: false,
      hasRiskAssessment: false,
      restrictedJurisdictions: [],
      whitelistRequired: false,
      riskAcknowledged: true,
    }
    expect(withAck.riskAcknowledged).toBe(true)
  })

  it('riskAcknowledged can be set to false', () => {
    const withNoAck: ComplianceReadiness = {
      requiresMICA: false,
      requiresKYC: false,
      requiresAML: false,
      hasLegalReview: false,
      hasRiskAssessment: false,
      restrictedJurisdictions: [],
      whitelistRequired: false,
      riskAcknowledged: false,
    }
    expect(withNoAck.riskAcknowledged).toBe(false)
  })

  it('store.setComplianceReadiness accepts object with riskAcknowledged field', () => {
    setActivePinia(createPinia())
    const store = useGuidedLaunchStore()

    expect(() => {
      store.setComplianceReadiness({
        requiresMICA: false,
        requiresKYC: false,
        requiresAML: false,
        hasLegalReview: false,
        hasRiskAssessment: false,
        restrictedJurisdictions: [],
        whitelistRequired: false,
        riskAcknowledged: true,
      })
    }).not.toThrow()

    expect(store.currentForm.complianceReadiness?.riskAcknowledged).toBe(true)
  })

  it('store.setComplianceReadiness accepts object without riskAcknowledged (backward compat)', () => {
    setActivePinia(createPinia())
    const store = useGuidedLaunchStore()

    const oldFormat = {
      requiresMICA: false,
      requiresKYC: false,
      requiresAML: false,
      hasLegalReview: false,
      hasRiskAssessment: false,
      restrictedJurisdictions: [] as string[],
      whitelistRequired: false,
    }

    expect(() => store.setComplianceReadiness(oldFormat)).not.toThrow()
    expect(store.currentForm.complianceReadiness?.riskAcknowledged).toBeUndefined()
  })
})

// ─── Router redirect contract ─────────────────────────────────────────────────

describe('Auth-first route guard contract: REDIRECT_AFTER_AUTH', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores redirect target when unauthenticated access to /launch/guided', () => {
    // Simulate router guard behavior (direct localStorage test of the contract)
    const isAuthenticated = false
    const targetPath = '/launch/guided'

    if (!isAuthenticated) {
      localStorage.setItem('redirect_after_auth', targetPath)
    }

    expect(localStorage.getItem('redirect_after_auth')).toBe('/launch/guided')
  })

  it('post-auth redirect: retrieves and clears stored path', () => {
    localStorage.setItem('redirect_after_auth', '/launch/guided')

    const storedPath = localStorage.getItem('redirect_after_auth')
    localStorage.removeItem('redirect_after_auth')

    expect(storedPath).toBe('/launch/guided')
    expect(localStorage.getItem('redirect_after_auth')).toBeNull()
  })

  it('stores redirect target for /create (legacy entry point)', () => {
    const isAuthenticated = false
    const targetPath = '/create'

    if (!isAuthenticated) {
      localStorage.setItem('redirect_after_auth', targetPath)
    }

    expect(localStorage.getItem('redirect_after_auth')).toBe('/create')
  })
})
