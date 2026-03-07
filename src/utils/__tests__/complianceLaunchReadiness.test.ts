/**
 * Unit Tests: complianceLaunchReadiness adapter
 *
 * Tests for the pure readiness derivation functions used by ComplianceLaunchConsole.
 *
 * Coverage targets:
 *  - deriveReadinessModel: all-ready, one-blocked, multiple-needs-attention,
 *    all-not-started, transient API error fallback state
 *  - Primary action derivation: start_review / resolve_blockers / launch_token
 *  - Gate state derivation: not_started / in_review / blocked / ready
 *  - Blocker enrichment with what/why/how guidance
 *  - Analytics payload building
 *  - CTA label constants
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  deriveReadinessModel,
  buildComplianceAnalyticsEvent,
  dispatchComplianceAnalytics,
  PRIMARY_ACTION_LABELS,
  GATE_STATE_LABELS,
  DOMAIN_STATUS_LABELS,
} from '../complianceLaunchReadiness'
import type { ComplianceSetupStep, ReadinessAssessment } from '../../types/complianceSetup'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeStep = (
  id: string,
  overrides: Partial<ComplianceSetupStep> = {},
): ComplianceSetupStep => ({
  id,
  title: `Step ${id}`,
  description: `Description for ${id}`,
  status: 'not_started',
  isRequired: true,
  isComplete: false,
  isValid: false,
  ...overrides,
})

const makeAssessment = (
  overrides: Partial<ReadinessAssessment> = {},
): ReadinessAssessment => ({
  overallRisk: 'none',
  readinessScore: 100,
  isReadyForDeploy: true,
  blockers: [],
  warnings: [],
  recommendations: [],
  jurisdictionReady: true,
  whitelistReady: true,
  kycAMLReady: true,
  attestationReady: true,
  nextActions: [],
  ...overrides,
})

const allStepsComplete = (): ComplianceSetupStep[] => [
  makeStep('jurisdiction', { isComplete: true, status: 'completed' }),
  makeStep('whitelist', { isComplete: true, status: 'completed' }),
  makeStep('kyc_aml', { isComplete: true, status: 'completed' }),
  makeStep('attestation', { isComplete: true, status: 'completed' }),
  makeStep('summary', { isComplete: true, status: 'completed' }),
]

const allStepsNotStarted = (): ComplianceSetupStep[] => [
  makeStep('jurisdiction'),
  makeStep('whitelist'),
  makeStep('kyc_aml'),
  makeStep('attestation'),
  makeStep('summary'),
]

// ---------------------------------------------------------------------------
// Gate state derivation
// ---------------------------------------------------------------------------

describe('deriveReadinessModel — gate state', () => {
  it('returns gate=not_started when all steps are not_started', () => {
    const model = deriveReadinessModel(allStepsNotStarted(), makeAssessment({
      readinessScore: 0,
      isReadyForDeploy: false,
      blockers: [],
    }))
    expect(model.gate).toBe('not_started')
  })

  it('returns gate=ready when isReadyForDeploy=true and no steps all-not-started', () => {
    const model = deriveReadinessModel(allStepsComplete(), makeAssessment({
      readinessScore: 100,
      isReadyForDeploy: true,
      blockers: [],
    }))
    expect(model.gate).toBe('ready')
  })

  it('returns gate=blocked when there are critical blockers', () => {
    const steps = allStepsNotStarted()
    steps[0].status = 'blocked'
    const model = deriveReadinessModel(steps, makeAssessment({
      readinessScore: 20,
      isReadyForDeploy: false,
      blockers: [{
        id: 'blocker_jurisdiction_incomplete',
        severity: 'critical',
        category: 'jurisdiction' as any,
        title: 'Jurisdiction not completed',
        description: 'Must be completed',
        remediationSteps: ['Complete jurisdiction'],
        relatedStepId: 'jurisdiction',
        canAutoResolve: false,
      }],
    }))
    expect(model.gate).toBe('blocked')
  })

  it('returns gate=in_review when some steps complete but not all, no blockers', () => {
    const steps = allStepsNotStarted()
    steps[0].isComplete = true
    steps[0].status = 'completed'
    const model = deriveReadinessModel(steps, makeAssessment({
      readinessScore: 50,
      isReadyForDeploy: false,
      blockers: [],
    }))
    expect(model.gate).toBe('in_review')
  })
})

// ---------------------------------------------------------------------------
// Primary action derivation
// ---------------------------------------------------------------------------

describe('deriveReadinessModel — primary action', () => {
  it('returns start_review when gate is not_started', () => {
    const model = deriveReadinessModel(allStepsNotStarted(), makeAssessment({
      readinessScore: 0,
      isReadyForDeploy: false,
      blockers: [],
    }))
    expect(model.primaryAction).toBe('start_review')
  })

  it('returns launch_token when gate is ready', () => {
    const model = deriveReadinessModel(allStepsComplete(), makeAssessment({
      readinessScore: 100,
      isReadyForDeploy: true,
    }))
    expect(model.primaryAction).toBe('launch_token')
  })

  it('returns resolve_blockers when gate is blocked', () => {
    const steps = allStepsNotStarted()
    // Set one step to 'blocked' so the gate is 'blocked' (not 'not_started')
    steps[0].status = 'blocked'
    const model = deriveReadinessModel(steps, makeAssessment({
      readinessScore: 0,
      isReadyForDeploy: false,
      blockers: [{
        id: 'blocker_1',
        severity: 'critical',
        category: 'jurisdiction' as any,
        title: 'Problem',
        description: 'Fix it',
        remediationSteps: [],
        relatedStepId: 'jurisdiction',
        canAutoResolve: false,
      }],
    }))
    expect(model.primaryAction).toBe('resolve_blockers')
  })

  it('returns resolve_blockers when gate is in_review with blockers', () => {
    const steps = allStepsNotStarted()
    steps[0].isComplete = true
    steps[0].status = 'completed'
    const model = deriveReadinessModel(steps, makeAssessment({
      readinessScore: 30,
      isReadyForDeploy: false,
      blockers: [{
        id: 'b1',
        severity: 'high',
        category: 'whitelist' as any,
        title: 'Whitelist not set',
        description: 'desc',
        remediationSteps: [],
        relatedStepId: 'whitelist',
        canAutoResolve: false,
      }],
    }))
    expect(model.primaryAction).toBe('resolve_blockers')
  })
})

// ---------------------------------------------------------------------------
// Readiness score and deploy flag
// ---------------------------------------------------------------------------

describe('deriveReadinessModel — score and deploy flag', () => {
  it('passes through readinessScore from the assessment', () => {
    const model = deriveReadinessModel(allStepsComplete(), makeAssessment({ readinessScore: 85 }))
    expect(model.readinessScore).toBe(85)
  })

  it('passes through isReadyForDeploy from the assessment', () => {
    const model = deriveReadinessModel(allStepsComplete(), makeAssessment({ isReadyForDeploy: true }))
    expect(model.isReadyForDeploy).toBe(true)
  })

  it('totalBlockers equals assessment.blockers.length', () => {
    const model = deriveReadinessModel(allStepsNotStarted(), makeAssessment({
      isReadyForDeploy: false,
      blockers: [
        { id: 'b1', severity: 'critical', category: 'jurisdiction' as any, title: 't', description: 'd', remediationSteps: [], relatedStepId: 'jurisdiction', canAutoResolve: false },
        { id: 'b2', severity: 'high', category: 'whitelist' as any, title: 't', description: 'd', remediationSteps: [], relatedStepId: 'whitelist', canAutoResolve: false },
      ],
    }))
    expect(model.totalBlockers).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Domain cards
// ---------------------------------------------------------------------------

describe('deriveReadinessModel — domain cards', () => {
  it('creates one domain per step', () => {
    const model = deriveReadinessModel(allStepsNotStarted(), makeAssessment())
    expect(model.domains).toHaveLength(allStepsNotStarted().length)
  })

  it('domain.status is ready when step is complete', () => {
    const steps = [makeStep('jurisdiction', { isComplete: true, status: 'completed' })]
    const model = deriveReadinessModel(steps, makeAssessment())
    expect(model.domains[0].status).toBe('ready')
  })

  it('domain.status is blocked when step.status is blocked', () => {
    const steps = [makeStep('jurisdiction', { status: 'blocked' })]
    const model = deriveReadinessModel(steps, makeAssessment({ isReadyForDeploy: false, blockers: [] }))
    expect(model.domains[0].status).toBe('blocked')
  })

  it('domain.status is needs_attention when step is in_progress', () => {
    const steps = [makeStep('jurisdiction', { status: 'in_progress' })]
    const model = deriveReadinessModel(steps, makeAssessment({ isReadyForDeploy: false, blockers: [] }))
    expect(model.domains[0].status).toBe('needs_attention')
  })

  it('domain.status is not_started when step is not_started and not complete', () => {
    const steps = [makeStep('jurisdiction')]
    const model = deriveReadinessModel(steps, makeAssessment({ isReadyForDeploy: false, blockers: [] }))
    expect(model.domains[0].status).toBe('not_started')
  })

  it('known domain IDs have deepLink pointing to /compliance/setup', () => {
    const model = deriveReadinessModel(allStepsNotStarted(), makeAssessment())
    model.domains.forEach((d) => {
      expect(d.deepLink).toContain('/compliance/setup')
    })
  })

  it('unknown domain IDs get a fallback deepLink', () => {
    const steps = [makeStep('custom_step')]
    const model = deriveReadinessModel(steps, makeAssessment())
    expect(model.domains[0].deepLink).toContain('/compliance/setup')
  })
})

// ---------------------------------------------------------------------------
// Blocker enrichment
// ---------------------------------------------------------------------------

describe('deriveReadinessModel — blocker enrichment', () => {
  it('enriches _incomplete blockers with plain-language what/why/how', () => {
    const steps = [makeStep('jurisdiction')]
    const assessment = makeAssessment({
      isReadyForDeploy: false,
      readinessScore: 0,
      blockers: [{
        id: 'blocker_jurisdiction_incomplete',
        severity: 'critical',
        category: 'jurisdiction' as any,
        title: 'Jurisdiction & Policy not completed',
        description: 'Must complete before deploy',
        remediationSteps: [],
        relatedStepId: 'jurisdiction',
        canAutoResolve: false,
      }],
    })
    const model = deriveReadinessModel(steps, assessment)
    const blocker = model.domains[0].blockers[0]
    expect(blocker).toBeDefined()
    expect(blocker.what).toMatch(/not completed/i)
    expect(blocker.why).toBeTruthy()
    expect(blocker.how).toBeTruthy()
    expect(blocker.deepLink).toContain('/compliance/setup')
    expect(blocker.severity).toBe('critical')
  })

  it('enriches whitelist blocker with whitelist-specific guidance', () => {
    const steps = [makeStep('whitelist')]
    const assessment = makeAssessment({
      isReadyForDeploy: false,
      blockers: [{
        id: 'blocker_whitelist_incomplete',
        severity: 'high',
        category: 'whitelist' as any,
        title: 'Whitelist not complete',
        description: 'Must fix',
        remediationSteps: [],
        relatedStepId: 'whitelist',
        canAutoResolve: false,
      }],
    })
    const model = deriveReadinessModel(steps, assessment)
    const blocker = model.domains[0].blockers[0]
    expect(blocker.deepLink).toContain('whitelist')
  })

  it('enriches kyc blocker with KYC-specific guidance', () => {
    const steps = [makeStep('kyc_aml')]
    const assessment = makeAssessment({
      isReadyForDeploy: false,
      blockers: [{
        id: 'blocker_kyc_aml_incomplete',
        severity: 'critical',
        category: 'kyc_aml' as any,
        title: 'KYC not done',
        description: 'Must fix',
        remediationSteps: [],
        relatedStepId: 'kyc_aml',
        canAutoResolve: false,
      }],
    })
    const model = deriveReadinessModel(steps, assessment)
    const blocker = model.domains[0].blockers[0]
    expect(blocker.deepLink).toContain('kyc')
  })

  it('provides a generic fallback for unrecognised blocker patterns', () => {
    const steps = [makeStep('unknown_step')]
    const assessment = makeAssessment({
      isReadyForDeploy: false,
      blockers: [{
        id: 'blocker_unknown_step_field',
        severity: 'low',
        category: 'unknown_step' as any,
        title: 'Something went wrong',
        description: 'Fix this',
        remediationSteps: [],
        relatedStepId: 'unknown_step',
        canAutoResolve: false,
      }],
    })
    const model = deriveReadinessModel(steps, assessment)
    const blocker = model.domains[0].blockers[0]
    expect(blocker.what).toBeTruthy()
    expect(blocker.why).toBeTruthy()
    expect(blocker.how).toBeTruthy()
    expect(blocker.deepLink).toContain('/compliance')
  })
})

// ---------------------------------------------------------------------------
// Multi-domain blocked scenario
// ---------------------------------------------------------------------------

describe('deriveReadinessModel — multiple domains blocked', () => {
  it('accumulates blockers per domain when two domains are blocked', () => {
    const steps = allStepsNotStarted()
    const assessment = makeAssessment({
      readinessScore: 10,
      isReadyForDeploy: false,
      blockers: [
        { id: 'blocker_jurisdiction_incomplete', severity: 'critical', category: 'jurisdiction' as any, title: 'J', description: 'd', remediationSteps: [], relatedStepId: 'jurisdiction', canAutoResolve: false },
        { id: 'blocker_whitelist_incomplete', severity: 'high', category: 'whitelist' as any, title: 'W', description: 'd', remediationSteps: [], relatedStepId: 'whitelist', canAutoResolve: false },
      ],
    })
    const model = deriveReadinessModel(steps, assessment)
    const jurisdictionDomain = model.domains.find((d) => d.id === 'jurisdiction')!
    const whitelistDomain = model.domains.find((d) => d.id === 'whitelist')!
    expect(jurisdictionDomain.blockers.length).toBeGreaterThanOrEqual(1)
    expect(whitelistDomain.blockers.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// lastChecked timestamp
// ---------------------------------------------------------------------------

describe('deriveReadinessModel — lastChecked', () => {
  it('returns a Date for lastChecked', () => {
    const model = deriveReadinessModel(allStepsNotStarted(), makeAssessment())
    expect(model.lastChecked).toBeInstanceOf(Date)
  })
})

// ---------------------------------------------------------------------------
// Analytics helpers
// ---------------------------------------------------------------------------

describe('buildComplianceAnalyticsEvent', () => {
  it('builds a payload with the correct eventName and gate state', () => {
    const steps = allStepsComplete()
    const model = deriveReadinessModel(steps, makeAssessment({ readinessScore: 100, isReadyForDeploy: true }))
    const payload = buildComplianceAnalyticsEvent('compliance_console_viewed', model)
    expect(payload.eventName).toBe('compliance_console_viewed')
    expect(payload.gateState).toBe('ready')
    expect(payload.primaryAction).toBe('launch_token')
    expect(payload.totalBlockers).toBe(0)
    expect(payload.readinessScore).toBe(100)
    expect(typeof payload.timestampMs).toBe('number')
  })

  it('includes optional domainId and blockerId when provided', () => {
    const model = deriveReadinessModel(allStepsNotStarted(), makeAssessment({ isReadyForDeploy: false }))
    const payload = buildComplianceAnalyticsEvent('compliance_blocker_opened', model, {
      domainId: 'jurisdiction',
      blockerId: 'blocker_1',
    })
    expect(payload.domainId).toBe('jurisdiction')
    expect(payload.blockerId).toBe('blocker_1')
  })
})

describe('dispatchComplianceAnalytics', () => {
  it('dispatches a compliance:analytics CustomEvent on the window', () => {
    const events: CustomEvent[] = []
    const handler = (e: Event) => events.push(e as CustomEvent)
    window.addEventListener('compliance:analytics', handler)

    const model = deriveReadinessModel(allStepsNotStarted(), makeAssessment({ isReadyForDeploy: false }))
    const payload = buildComplianceAnalyticsEvent('compliance_console_viewed', model)
    dispatchComplianceAnalytics(payload)

    window.removeEventListener('compliance:analytics', handler)
    expect(events.length).toBe(1)
    expect(events[0].detail.eventName).toBe('compliance_console_viewed')
  })
})

// ---------------------------------------------------------------------------
// Label constants
// ---------------------------------------------------------------------------

describe('label constants', () => {
  it('PRIMARY_ACTION_LABELS covers all actions', () => {
    expect(PRIMARY_ACTION_LABELS.start_review).toBeTruthy()
    expect(PRIMARY_ACTION_LABELS.resolve_blockers).toBeTruthy()
    expect(PRIMARY_ACTION_LABELS.launch_token).toBeTruthy()
  })

  it('GATE_STATE_LABELS covers all gate states', () => {
    expect(GATE_STATE_LABELS.not_started).toBeTruthy()
    expect(GATE_STATE_LABELS.in_review).toBeTruthy()
    expect(GATE_STATE_LABELS.blocked).toBeTruthy()
    expect(GATE_STATE_LABELS.ready).toBeTruthy()
  })

  it('DOMAIN_STATUS_LABELS covers all statuses', () => {
    expect(DOMAIN_STATUS_LABELS.not_started).toBeTruthy()
    expect(DOMAIN_STATUS_LABELS.needs_attention).toBeTruthy()
    expect(DOMAIN_STATUS_LABELS.ready).toBeTruthy()
    expect(DOMAIN_STATUS_LABELS.blocked).toBeTruthy()
  })
})
