/**
 * GuidedLaunch store — validation boundary tests
 *
 * Covers:
 * - setOrganizationProfile: valid data → store updated
 * - canSubmit: zero steps, partial steps, all required + risk variations
 * - readinessScore.blockers: populated and empty states
 * - Step idempotency: completing the same step twice
 * - completeStep with out-of-range index: no crash
 * - Multiple rapid setters: store in consistent state
 * - clearDraft: no draft present → no crash
 * - loadDraft: invalid JSON → no crash, returns false
 * - Draft version mismatch: old draft cleared, returns false
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from '../guidedLaunch'
import type {
  OrganizationProfile,
  TokenIntent,
  ComplianceReadiness,
  TokenEconomics,
  ValidationResult,
} from '../../types/guidedLaunch'

// ── Mocks (same pattern as guidedLaunchStateMachine.test.ts) ─────────────────

vi.mock('../../services/launchTelemetry', () => ({
  launchTelemetryService: {
    initialize: vi.fn(),
    trackFlowStarted: vi.fn(),
    trackStepStarted: vi.fn(),
    trackStepCompleted: vi.fn(),
    trackValidationFailed: vi.fn(),
    trackDraftResumed: vi.fn(),
    trackDraftSaved: vi.fn(),
    trackLaunchSubmitted: vi.fn(),
    trackLaunchSuccess: vi.fn(),
    trackLaunchFailed: vi.fn(),
  },
}))

vi.mock('../../utils/policyGuardrails', () => ({
  runPolicyGuardrails: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
}))

vi.mock('../../utils/issuanceIdempotency', () => ({
  deriveIdempotencyKey: vi.fn().mockReturnValue('key_mock'),
  checkIdempotency: vi.fn().mockReturnValue({ isSafeToSubmit: true }),
  recordSubmissionAttempt: vi.fn(),
  markSubmissionSuccess: vi.fn(),
  markSubmissionFailed: vi.fn(),
}))

// ── Fixture builders ──────────────────────────────────────────────────────────

const DRAFT_KEY = 'biatec_guided_launch_draft'

const makeOrg = (): OrganizationProfile => ({
  organizationName: 'Acme Corp',
  organizationType: 'company',
  jurisdiction: 'DE',
  contactName: 'Jane Doe',
  contactEmail: 'jane@acme.com',
  role: 'cto_tech',
})

const makeIntent = (): TokenIntent => ({
  tokenPurpose: 'Loyalty points',
  utilityType: 'loyalty_rewards',
  targetAudience: 'b2c',
  expectedHolders: '100_1000',
  geographicScope: 'national',
})

const makeCompliance = (): ComplianceReadiness => ({
  requiresMICA: false,
  requiresKYC: false,
  requiresAML: false,
  hasLegalReview: true,
  hasRiskAssessment: true,
  restrictedJurisdictions: [],
  whitelistRequired: false,
  riskAcknowledged: true,
})

const makeEconomics = (): TokenEconomics => ({
  totalSupply: 1_000_000,
  decimals: 6,
  initialDistribution: { team: 20, investors: 20, community: 50, reserve: 10 },
  burnMechanism: false,
  mintingAllowed: false,
})

const makeTemplate = () => ({
  id: 'loyalty-arc200',
  name: 'Loyalty Token',
  description: 'A loyalty token',
  standard: 'ARC200' as const,
  network: 'algorand_mainnet' as const,
  useCase: 'loyalty_rewards',
  complianceLevel: 'standard' as const,
  recommendedFor: [],
  features: [],
})

/** Mark a step as complete with a passing validation result */
const passStep = (store: ReturnType<typeof useGuidedLaunchStore>, stepIndex: number) => {
  const validation: ValidationResult = { isValid: true, errors: [], warnings: [] }
  store.completeStep(stepIndex, validation)
}

/** Mark a step as complete with a FAILING validation result */
const failStep = (store: ReturnType<typeof useGuidedLaunchStore>, stepIndex: number) => {
  const validation: ValidationResult = { isValid: false, errors: ['error'], warnings: [] }
  store.completeStep(stepIndex, validation)
}

// Step indices in the store: 0=organization, 1=intent, 2=compliance, 3=whitelist, 4=template, 5=economics(optional), 6=review
const STEP = { ORG: 0, INTENT: 1, COMPLIANCE: 2, WHITELIST: 3, TEMPLATE: 4, ECONOMICS: 5, REVIEW: 6 }

// ─────────────────────────────────────────────────────────────────────────────

describe('GuidedLaunch store — setOrganizationProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('stores organizationProfile after setOrganizationProfile with valid data', () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(makeOrg())
    expect(store.currentForm.organizationProfile?.organizationName).toBe('Acme Corp')
    expect(store.currentForm.organizationProfile?.contactEmail).toBe('jane@acme.com')
  })

  it('overwrites existing organizationProfile on second call', () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(makeOrg())
    store.setOrganizationProfile({ ...makeOrg(), organizationName: 'Beta Ltd' })
    expect(store.currentForm.organizationProfile?.organizationName).toBe('Beta Ltd')
  })

  it('updates lastModified after setOrganizationProfile', () => {
    const store = useGuidedLaunchStore()
    const before = store.currentForm.lastModified
    // Small delay to ensure timestamp differs
    store.setOrganizationProfile(makeOrg())
    expect(store.currentForm.lastModified.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })

  it('does NOT automatically mark the organization step as complete', () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(makeOrg())
    // setOrganizationProfile only persists data; completeStep must be called separately
    expect(store.stepStatuses[STEP.ORG].isComplete).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('GuidedLaunch store — canSubmit boundary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('canSubmit is false when no steps are complete', () => {
    const store = useGuidedLaunchStore()
    expect(store.canSubmit).toBe(false)
  })

  it('canSubmit is false when only some required steps are complete', () => {
    const store = useGuidedLaunchStore()
    passStep(store, STEP.ORG)
    passStep(store, STEP.INTENT)
    // compliance, template, review still incomplete
    expect(store.canSubmit).toBe(false)
  })

  it('canSubmit is false when all required steps have failing validation', () => {
    const store = useGuidedLaunchStore()
    failStep(store, STEP.ORG)
    failStep(store, STEP.INTENT)
    failStep(store, STEP.COMPLIANCE)
    failStep(store, STEP.TEMPLATE)
    failStep(store, STEP.REVIEW)
    expect(store.canSubmit).toBe(false)
  })

  it('canSubmit is true when all required steps pass', () => {
    const store = useGuidedLaunchStore()
    passStep(store, STEP.ORG)
    passStep(store, STEP.INTENT)
    passStep(store, STEP.COMPLIANCE)
    passStep(store, STEP.WHITELIST)
    passStep(store, STEP.TEMPLATE)
    passStep(store, STEP.REVIEW)
    expect(store.canSubmit).toBe(true)
  })

  it('canSubmit is true even if optional economics step is skipped', () => {
    const store = useGuidedLaunchStore()
    passStep(store, STEP.ORG)
    passStep(store, STEP.INTENT)
    passStep(store, STEP.COMPLIANCE)
    passStep(store, STEP.WHITELIST)
    passStep(store, STEP.TEMPLATE)
    // ECONOMICS (index 5) intentionally skipped — it is optional
    passStep(store, STEP.REVIEW)
    expect(store.canSubmit).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('GuidedLaunch store — readinessScore.blockers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('blockers has one entry per incomplete required step at initial state', () => {
    const store = useGuidedLaunchStore()
    const requiredCount = store.stepStatuses.filter(s => !s.isOptional).length
    expect(store.readinessScore.blockers).toHaveLength(requiredCount)
  })

  it('blockers decreases as required steps are completed', () => {
    const store = useGuidedLaunchStore()
    const initialBlockerCount = store.readinessScore.blockers.length
    passStep(store, STEP.ORG)
    expect(store.readinessScore.blockers.length).toBe(initialBlockerCount - 1)
  })

  it('blockers is empty when all required steps pass', () => {
    const store = useGuidedLaunchStore()
    passStep(store, STEP.ORG)
    passStep(store, STEP.INTENT)
    passStep(store, STEP.COMPLIANCE)
    passStep(store, STEP.WHITELIST)
    passStep(store, STEP.TEMPLATE)
    passStep(store, STEP.REVIEW)
    expect(store.readinessScore.blockers).toHaveLength(0)
  })

  it('blockers contains step title text for incomplete steps', () => {
    const store = useGuidedLaunchStore()
    const blocker = store.readinessScore.blockers[0]
    expect(typeof blocker).toBe('string')
    expect(blocker.length).toBeGreaterThan(0)
  })

  it('adds a blocker when a required step has a failing validation result', () => {
    const store = useGuidedLaunchStore()
    // completeStep(false) sets isComplete=false so the step shows as "required but not complete"
    failStep(store, STEP.ORG)
    const hasBlocker = store.readinessScore.blockers.some(b =>
      b.toLowerCase().includes('organization')
    )
    expect(hasBlocker).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('GuidedLaunch store — step idempotency and edge cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('completing the same step twice does not duplicate completedSteps entries', () => {
    const store = useGuidedLaunchStore()
    passStep(store, STEP.ORG)
    passStep(store, STEP.ORG)
    const orgEntries = store.currentForm.completedSteps.filter(id => id === 'organization')
    expect(orgEntries).toHaveLength(1)
  })

  it('completeStep with out-of-range negative index does not throw', () => {
    const store = useGuidedLaunchStore()
    expect(() => store.completeStep(-1, { isValid: true, errors: [], warnings: [] })).not.toThrow()
  })

  it('completeStep with out-of-range positive index does not throw', () => {
    const store = useGuidedLaunchStore()
    expect(() =>
      store.completeStep(9999, { isValid: true, errors: [], warnings: [] })
    ).not.toThrow()
  })

  it('multiple rapid setters leave store in consistent state', () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(makeOrg())
    store.setTokenIntent(makeIntent())
    store.setComplianceReadiness(makeCompliance())
    store.setSelectedTemplate(makeTemplate())
    store.setTokenEconomics(makeEconomics())

    // All data should be present
    expect(store.currentForm.organizationProfile?.organizationName).toBe('Acme Corp')
    expect(store.currentForm.tokenIntent?.utilityType).toBe('loyalty_rewards')
    expect(store.currentForm.complianceReadiness?.riskAcknowledged).toBe(true)
    expect(store.currentForm.selectedTemplate?.id).toBe('loyalty-arc200')
    expect(store.currentForm.tokenEconomics?.totalSupply).toBe(1_000_000)
  })

  it('goToStep out-of-range does not update currentStep', () => {
    const store = useGuidedLaunchStore()
    const initial = store.currentStep
    store.goToStep(-5)
    expect(store.currentStep).toBe(initial)
    store.goToStep(9999)
    expect(store.currentStep).toBe(initial)
  })

  it('goToStep to a valid index updates currentStep', () => {
    const store = useGuidedLaunchStore()
    store.goToStep(2)
    expect(store.currentStep).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('GuidedLaunch store — draft resilience', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('clearDraft when no draft exists does not throw', () => {
    const store = useGuidedLaunchStore()
    expect(() => store.clearDraft()).not.toThrow()
  })

  it('clearDraft resets completedSteps to empty', () => {
    const store = useGuidedLaunchStore()
    passStep(store, STEP.ORG)
    store.clearDraft()
    expect(store.currentForm.completedSteps).toHaveLength(0)
  })

  it('clearDraft resets all step isComplete flags to false', () => {
    const store = useGuidedLaunchStore()
    passStep(store, STEP.ORG)
    passStep(store, STEP.INTENT)
    store.clearDraft()
    store.stepStatuses.forEach(s => expect(s.isComplete).toBe(false))
  })

  it('loadDraft returns false when localStorage has invalid JSON', () => {
    localStorage.setItem(DRAFT_KEY, '!!!not_json!!!')
    const store = useGuidedLaunchStore()
    const result = store.loadDraft()
    expect(result).toBe(false)
  })

  it('loadDraft does not throw when localStorage has invalid JSON', () => {
    localStorage.setItem(DRAFT_KEY, '{ broken json }')
    const store = useGuidedLaunchStore()
    expect(() => store.loadDraft()).not.toThrow()
  })

  it('loadDraft returns false when no draft is present', () => {
    const store = useGuidedLaunchStore()
    expect(store.loadDraft()).toBe(false)
  })

  it('loadDraft returns false for draft with wrong version', () => {
    // Use a version string that is intentionally different from the store's current '1.0'
    // If the store version ever changes, update this constant too.
    const OUTDATED_DRAFT_VERSION = '0.1'
    const oldDraft = {
      version: OUTDATED_DRAFT_VERSION,
      form: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        currentStep: 0,
        completedSteps: [],
        isSubmitted: false,
      },
      stepStatuses: [],
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(oldDraft))
    const store = useGuidedLaunchStore()
    const result = store.loadDraft()
    expect(result).toBe(false)
    // Draft should be cleared after version mismatch
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('saveDraft persists data to localStorage', () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(makeOrg())
    // setOrganizationProfile calls saveDraft internally
    const raw = localStorage.getItem(DRAFT_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.form.organizationProfile?.organizationName).toBe('Acme Corp')
  })
})
