/**
 * Unit tests for GuidedLaunch store state machine transitions
 *
 * Covers:
 * - Initial state
 * - Step data setters (setOrganizationProfile, setTokenIntent, etc.)
 * - Step progression / regression via goToStep / completeStep
 * - Draft persistence (saveDraft / loadDraft / clearDraft)
 * - canSubmit computed
 * - readinessScore computed (overallScore, blockers)
 * - Analytics / telemetry helpers
 * - submitLaunch happy path (mock)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from '../guidedLaunch'

// ── Mock launchTelemetryService to prevent network calls ──────────────────────
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

// ── Mock policy guardrails + idempotency utils ────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeOrg = () => ({
  organizationName: 'Acme Corp',
  organizationType: 'company' as const,
  jurisdiction: 'DE',
  contactName: 'Jane Doe',
  contactEmail: 'jane@acme.com',
  role: 'cto_tech' as const,
})

const makeIntent = () => ({
  tokenPurpose: 'Loyalty points',
  utilityType: 'loyalty_rewards' as const,
  targetAudience: 'b2c' as const,
  expectedHolders: '100_1000' as const,
  geographicScope: 'national' as const,
})

const makeCompliance = () => ({
  requiresMICA: false,
  requiresKYC: false,
  requiresAML: false,
  hasLegalReview: true,
  hasRiskAssessment: true,
  restrictedJurisdictions: [],
  whitelistRequired: false,
  riskAcknowledged: true,
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

const makeEconomics = () => ({
  totalSupply: 1_000_000,
  decimals: 6,
  initialDistribution: { team: 20, investors: 20, community: 50, reserve: 10 },
  burnMechanism: false,
  mintingAllowed: false,
})

describe('GuidedLaunch store — state machine', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts at step 0', () => {
    const store = useGuidedLaunchStore()
    expect(store.currentStep).toBe(0)
  })

  it('starts with 0 completed steps', () => {
    const store = useGuidedLaunchStore()
    expect(store.completedSteps).toBe(0)
  })

  it('starts with 0% progress', () => {
    const store = useGuidedLaunchStore()
    expect(store.progressPercentage).toBe(0)
  })

  it('has 7 steps total', () => {
    const store = useGuidedLaunchStore()
    expect(store.totalSteps).toBe(7)
  })

  it('starts with canSubmit = false', () => {
    const store = useGuidedLaunchStore()
    expect(store.canSubmit).toBe(false)
  })

  it('starts with overallScore between 0 and 100 (exact value depends on warnings bonus)', () => {
    const store = useGuidedLaunchStore()
    // Score formula: required(0/5)*70 + optional(0/1)*20 + noWarnings(10) = 10
    expect(store.readinessScore.overallScore).toBe(10)
  })

  it('blockers list is non-empty initially (all required steps incomplete)', () => {
    const store = useGuidedLaunchStore()
    expect(store.readinessScore.blockers.length).toBeGreaterThan(0)
  })

  it('hasDraftLoaded is false initially', () => {
    const store = useGuidedLaunchStore()
    expect(store.hasDraftLoaded).toBe(false)
  })

  it('isSubmitting is false initially', () => {
    const store = useGuidedLaunchStore()
    expect(store.isSubmitting).toBe(false)
  })

  // ── setOrganizationProfile ────────────────────────────────────────────────

  it('setOrganizationProfile stores profile in currentForm', () => {
    const store = useGuidedLaunchStore()
    const org = makeOrg()
    store.setOrganizationProfile(org)
    expect(store.currentForm.organizationProfile?.organizationName).toBe('Acme Corp')
  })

  it('setOrganizationProfile does NOT auto-mark step as complete (completeStep must be called)', () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(makeOrg())
    expect(store.stepStatuses[0].isComplete).toBe(false)
  })

  it('setOrganizationProfile saves draft to localStorage', () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(makeOrg())
    const draft = localStorage.getItem('biatec_guided_launch_draft')
    expect(draft).not.toBeNull()
  })

  // ── setTokenIntent ────────────────────────────────────────────────────────

  it('setTokenIntent stores intent in currentForm', () => {
    const store = useGuidedLaunchStore()
    store.setTokenIntent(makeIntent())
    expect(store.currentForm.tokenIntent?.tokenPurpose).toBe('Loyalty points')
  })

  // ── setSelectedTemplate ───────────────────────────────────────────────────

  it('setSelectedTemplate stores template in currentForm', () => {
    const store = useGuidedLaunchStore()
    store.setSelectedTemplate(makeTemplate())
    expect(store.currentForm.selectedTemplate?.id).toBe('loyalty-arc200')
  })

  // ── setTokenEconomics ─────────────────────────────────────────────────────

  it('setTokenEconomics stores economics in currentForm', () => {
    const store = useGuidedLaunchStore()
    store.setTokenEconomics(makeEconomics())
    expect(store.currentForm.tokenEconomics?.decimals).toBe(6)
  })

  // ── setComplianceReadiness ────────────────────────────────────────────────

  it('setComplianceReadiness stores compliance data in currentForm', () => {
    const store = useGuidedLaunchStore()
    store.setComplianceReadiness(makeCompliance())
    expect(store.currentForm.complianceReadiness?.requiresMICA).toBe(false)
  })

  // ── goToStep (forward / backward) ────────────────────────────────────────

  it('goToStep(3) advances current step to 3', () => {
    const store = useGuidedLaunchStore()
    store.goToStep(3)
    expect(store.currentStep).toBe(3)
  })

  it('goToStep(0) after advancing reverts to step 0', () => {
    const store = useGuidedLaunchStore()
    store.goToStep(4)
    store.goToStep(0)
    expect(store.currentStep).toBe(0)
  })

  it('goToStep with out-of-range index (negative) is ignored', () => {
    const store = useGuidedLaunchStore()
    store.goToStep(-1)
    expect(store.currentStep).toBe(0)
  })

  it('goToStep with out-of-range index (>= totalSteps) is ignored', () => {
    const store = useGuidedLaunchStore()
    store.goToStep(100)
    expect(store.currentStep).toBe(0)
  })

  // ── completeStep ──────────────────────────────────────────────────────────

  it('completeStep marks a step as complete when validation passes', () => {
    const store = useGuidedLaunchStore()
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    expect(store.stepStatuses[0].isComplete).toBe(true)
  })

  it('completeStep does NOT mark step as complete when validation fails', () => {
    const store = useGuidedLaunchStore()
    store.completeStep(0, { isValid: false, errors: ['Name required'], warnings: [] })
    expect(store.stepStatuses[0].isComplete).toBe(false)
  })

  it('completeStep adds step id to currentForm.completedSteps', () => {
    const store = useGuidedLaunchStore()
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    expect(store.currentForm.completedSteps).toContain('intent')
  })

  it('progressPercentage increases after completing steps', () => {
    const store = useGuidedLaunchStore()
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    expect(store.progressPercentage).toBeGreaterThan(0)
  })

  // ── Draft persistence ─────────────────────────────────────────────────────

  it('saveDraft writes to localStorage with correct key', () => {
    const store = useGuidedLaunchStore()
    store.saveDraft()
    const raw = localStorage.getItem('biatec_guided_launch_draft')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.version).toBe('1.0')
  })

  it('loadDraft restores form data from localStorage', () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(makeOrg())
    store.saveDraft()

    // Create a fresh store instance and load
    setActivePinia(createPinia())
    const freshStore = useGuidedLaunchStore()
    const loaded = freshStore.loadDraft()
    expect(loaded).toBe(true)
    expect(freshStore.currentForm.organizationProfile?.organizationName).toBe('Acme Corp')
  })

  it('loadDraft restores stepStatuses from localStorage', () => {
    const store = useGuidedLaunchStore()
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.saveDraft()

    setActivePinia(createPinia())
    const freshStore = useGuidedLaunchStore()
    freshStore.loadDraft()
    expect(freshStore.stepStatuses[0].isComplete).toBe(true)
  })

  it('loadDraft returns false when no draft in localStorage', () => {
    const store = useGuidedLaunchStore()
    const result = store.loadDraft()
    expect(result).toBe(false)
  })

  it('loadDraft accepts old drafts when version matches (age check is telemetry-only in current impl)', () => {
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    const oldDraft = {
      version: '1.0',
      form: {
        createdAt: oldDate,
        lastModified: oldDate,
        currentStep: 0,
        completedSteps: [],
        isSubmitted: false,
      },
      stepStatuses: [],
    }
    localStorage.setItem('biatec_guided_launch_draft', JSON.stringify(oldDraft))

    const store = useGuidedLaunchStore()
    // Current implementation only checks version field, not age; old draft is accepted
    const result = store.loadDraft()
    expect(result).toBe(true)
  })

  it('loadDraft rejects drafts with wrong version', () => {
    const stale = JSON.stringify({ version: '99.0', form: {}, stepStatuses: [] })
    localStorage.setItem('biatec_guided_launch_draft', stale)
    const store = useGuidedLaunchStore()
    const result = store.loadDraft()
    expect(result).toBe(false)
  })

  it('clearDraft removes the localStorage entry', () => {
    const store = useGuidedLaunchStore()
    store.saveDraft()
    expect(localStorage.getItem('biatec_guided_launch_draft')).not.toBeNull()
    store.clearDraft()
    expect(localStorage.getItem('biatec_guided_launch_draft')).toBeNull()
  })

  it('clearDraft resets completedSteps', () => {
    const store = useGuidedLaunchStore()
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.clearDraft()
    expect(store.stepStatuses[0].isComplete).toBe(false)
  })

  it('clearDraft resets currentStep to 0', () => {
    const store = useGuidedLaunchStore()
    store.goToStep(3)
    store.clearDraft()
    expect(store.currentStep).toBe(0)
  })

  // ── canSubmit ─────────────────────────────────────────────────────────────

  it('canSubmit is true when all required steps are complete', () => {
    const store = useGuidedLaunchStore()
    // Complete all non-optional steps (0=org, 1=intent, 2=compliance, 3=whitelist, 4=template, 6=review)
    ;[0, 1, 2, 3, 4, 6].forEach(i =>
      store.completeStep(i, { isValid: true, errors: [], warnings: [] }),
    )
    expect(store.canSubmit).toBe(true)
  })

  it('canSubmit is false when any required step is incomplete', () => {
    const store = useGuidedLaunchStore()
    ;[0, 1, 2, 3].forEach(i =>
      store.completeStep(i, { isValid: true, errors: [], warnings: [] }),
    )
    // step 6 (review) still incomplete
    expect(store.canSubmit).toBe(false)
  })

  // ── readinessScore ────────────────────────────────────────────────────────

  it('readinessScore.requiredStepsComplete counts required completed steps', () => {
    const store = useGuidedLaunchStore()
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    expect(store.readinessScore.requiredStepsComplete).toBe(1)
  })

  it('readinessScore.totalRequiredSteps is 6 (economics is optional)', () => {
    const store = useGuidedLaunchStore()
    expect(store.readinessScore.totalRequiredSteps).toBe(6)
  })

  it('readinessScore.overallScore is 100 when all required + optional complete', () => {
    const store = useGuidedLaunchStore()
    ;[0, 1, 2, 3, 4, 5, 6].forEach(i =>
      store.completeStep(i, { isValid: true, errors: [], warnings: [] }),
    )
    expect(store.readinessScore.overallScore).toBe(100)
  })

  it('readinessScore.blockers includes names of incomplete required steps', () => {
    const store = useGuidedLaunchStore()
    const blockerTexts = store.readinessScore.blockers.join(' ')
    expect(blockerTexts).toMatch(/Organization Profile/i)
  })

  it('readinessScore.blockers is empty when all required steps complete', () => {
    const store = useGuidedLaunchStore()
    ;[0, 1, 2, 3, 4, 6].forEach(i =>
      store.completeStep(i, { isValid: true, errors: [], warnings: [] }),
    )
    expect(store.readinessScore.blockers).toHaveLength(0)
  })

  // ── Analytics / telemetry ─────────────────────────────────────────────────

  it('initializeTelemetry calls launchTelemetryService.initialize', async () => {
    const { launchTelemetryService } = await import('../../services/launchTelemetry')
    const store = useGuidedLaunchStore()
    store.initializeTelemetry('user-42')
    expect(launchTelemetryService.initialize).toHaveBeenCalledWith('user-42')
  })

  it('startFlow calls launchTelemetryService.trackFlowStarted', async () => {
    const { launchTelemetryService } = await import('../../services/launchTelemetry')
    const store = useGuidedLaunchStore()
    store.startFlow('direct', 'homepage')
    expect(launchTelemetryService.trackFlowStarted).toHaveBeenCalled()
  })

  // ── submitLaunch ──────────────────────────────────────────────────────────

  it('submitLaunch returns success response with submissionId', async () => {
    const store = useGuidedLaunchStore()
    // Fill all required data
    store.setOrganizationProfile(makeOrg())
    store.setTokenIntent(makeIntent())
    store.setComplianceReadiness(makeCompliance())
    store.setSelectedTemplate(makeTemplate())
    store.setTokenEconomics(makeEconomics())
    ;[0, 1, 2, 3, 4, 6].forEach(i =>
      store.completeStep(i, { isValid: true, errors: [], warnings: [] }),
    )

    const response = await store.submitLaunch('user@example.com')
    expect(response.success).toBe(true)
    expect(typeof response.submissionId).toBe('string')
    expect(response.submissionId.length).toBeGreaterThan(0)
  })

  it('submitLaunch throws when canSubmit is false', async () => {
    const store = useGuidedLaunchStore()
    // Do not complete required steps — canSubmit will be false
    await expect(store.submitLaunch('user@example.com')).rejects.toThrow()
  })

  it('getTemplates returns array of templates', () => {
    const store = useGuidedLaunchStore()
    const templates = store.getTemplates()
    expect(Array.isArray(templates)).toBe(true)
    expect(templates.length).toBeGreaterThan(0)
  })
})
