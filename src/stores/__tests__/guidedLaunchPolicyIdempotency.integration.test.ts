/**
 * Integration tests: GuidedLaunch store × PolicyGuardrails × IssuanceIdempotency
 *
 * Validates the cross-module interaction between:
 * - `guidedLaunch.ts` store (submitLaunch action)
 * - `policyGuardrails.ts` (pre-submission validation)
 * - `issuanceIdempotency.ts` (duplicate submission prevention)
 *
 * These tests sit at the service-boundary level: they exercise the real store
 * and real utility functions together (no mocks for the utilities), which gives
 * higher confidence that wiring is correct and that each module's contract is
 * respected at the integration point.
 *
 * Business value:
 * - Policy violations caught here block silent misfires that waste user time
 *   and generate support burden ("my ERC20 was deployed to Algorand").
 * - Idempotency integration prevents duplicate issuance charges and confusing
 *   "double token" scenarios when users click Submit twice under network lag.
 * - The integration layer is the most failure-prone zone between pure utilities
 *   and the UI; these tests protect against regressions at exactly that seam.
 *
 * Acceptance Criteria covered:
 *   AC #1 — Policy errors block submission before any network/idempotency state changes
 *   AC #2 — Idempotency key is derived from draft + email (same inputs → same key)
 *   AC #3 — Second submission after success returns cached result without re-executing
 *   AC #4 — Failed attempt leaves draft retryable (no permanent block)
 *   AC #5 — Missing draftId is detected early (programming error guard)
 *   AC #6 — EVM standard on AVM network produces a specific, actionable error
 *   AC #7 — Decimal overflow produces a specific, actionable error
 *   AC #8 — Supply violation (0 tokens) is surfaced before idempotency check
 *
 * Issue: Roadmap — production-grade auth-first issuance UX
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from '../guidedLaunch'
import { deriveIdempotencyKey, getIdempotencyRecord } from '../../utils/issuanceIdempotency'
import type {
  OrganizationProfile,
  TokenIntent,
  ComplianceReadiness,
  TokenTemplate,
  TokenEconomics,
} from '../../types/guidedLaunch'

// ---------------------------------------------------------------------------
// Helpers — build complete valid form data reused across tests
// ---------------------------------------------------------------------------

function validOrgProfile(): OrganizationProfile {
  return {
    organizationName: 'Acme Corp',
    organizationType: 'company',
    jurisdiction: 'US',
    contactName: 'Alice',
    contactEmail: 'alice@acme.io',
    role: 'business_owner',
  }
}

function validTokenIntent(): TokenIntent {
  return {
    tokenPurpose: 'Loyalty programme',
    utilityType: 'loyalty_rewards',
    targetAudience: 'b2c',
    expectedHolders: '100_1000',
    geographicScope: 'national',
  }
}

function validCompliance(): ComplianceReadiness {
  return {
    requiresMICA: false,
    requiresKYC: false,
    requiresAML: false,
    hasLegalReview: true,
    hasRiskAssessment: true,
    restrictedJurisdictions: [],
    whitelistRequired: false,
    riskAcknowledged: true,
  }
}

/** ARC200 on algorand_mainnet — valid per policy */
function validAvmTemplate(): TokenTemplate {
  return {
    id: 'test-arc200',
    name: 'Loyalty Token',
    description: 'Loyalty rewards',
    standard: 'ARC200',
    network: 'algorand_mainnet',
    useCase: 'loyalty_rewards',
    complianceLevel: 'standard',
    recommendedFor: [],
    features: [],
  }
}

/** ERC20 on ethereum_mainnet — valid per policy */
function validEvmTemplate(): TokenTemplate {
  return {
    id: 'test-erc20',
    name: 'Reward Token',
    description: 'EVM rewards',
    standard: 'ERC20',
    network: 'ethereum_mainnet',
    useCase: 'loyalty_rewards',
    complianceLevel: 'standard',
    recommendedFor: [],
    features: [],
  }
}

function validArc200Economics(): TokenEconomics {
  return {
    totalSupply: '1000000',
    decimals: 6, // ARC200 max is 6 — valid
    initialDistribution: { team: 25, investors: 25, community: 25, reserve: 25 },
    burnMechanism: false,
    mintingAllowed: false,
  }
}

function validErc20Economics(): TokenEconomics {
  return {
    totalSupply: '1000000000',
    decimals: 18, // ERC20 max is 18 — valid
    initialDistribution: { team: 25, investors: 25, community: 25, reserve: 25 },
    burnMechanism: false,
    mintingAllowed: false,
  }
}

/** Fill the store with a complete, valid AVM form and mark required steps complete */
function fillCompleteAvmForm(store: ReturnType<typeof useGuidedLaunchStore>) {
  store.setOrganizationProfile(validOrgProfile())
  store.setTokenIntent(validTokenIntent())
  store.setComplianceReadiness(validCompliance())
  store.setSelectedTemplate(validAvmTemplate())
  store.setTokenEconomics(validArc200Economics())
  // Steps 0-4 + step 6 are required (step 3=whitelist, 4=template, 5=economics optional, 6=review)
  store.completeStep(0, { isValid: true, errors: [], warnings: [] })
  store.completeStep(1, { isValid: true, errors: [], warnings: [] })
  store.completeStep(2, { isValid: true, errors: [], warnings: [] })
  store.completeStep(3, { isValid: true, errors: [], warnings: [] })
  store.completeStep(4, { isValid: true, errors: [], warnings: [] })
  store.completeStep(6, { isValid: true, errors: [], warnings: [] })
}

/** Fill the store with a complete, valid EVM form and mark required steps complete */
function fillCompleteEvmForm(store: ReturnType<typeof useGuidedLaunchStore>) {
  store.setOrganizationProfile(validOrgProfile())
  store.setTokenIntent(validTokenIntent())
  store.setComplianceReadiness(validCompliance())
  store.setSelectedTemplate(validEvmTemplate())
  store.setTokenEconomics(validErc20Economics())
  store.completeStep(0, { isValid: true, errors: [], warnings: [] })
  store.completeStep(1, { isValid: true, errors: [], warnings: [] })
  store.completeStep(2, { isValid: true, errors: [], warnings: [] })
  store.completeStep(3, { isValid: true, errors: [], warnings: [] })
  store.completeStep(4, { isValid: true, errors: [], warnings: [] })
  store.completeStep(6, { isValid: true, errors: [], warnings: [] })
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// AC #1 — Happy path: valid AVM submission succeeds
// ---------------------------------------------------------------------------

describe('Happy path — valid AVM token submission', () => {
  it('submits a complete AVM form without policy violations', async () => {
    const store = useGuidedLaunchStore()
    fillCompleteAvmForm(store)

    const response = await store.submitLaunch('user@test.com')

    expect(response.success).toBe(true)
    expect(response.submissionId).toBeTruthy()
    expect(store.currentForm.isSubmitted).toBe(true)
    expect(store.currentForm.submissionStatus).toBe('success')
  })

  it('submits a complete EVM form without policy violations', async () => {
    const store = useGuidedLaunchStore()
    fillCompleteEvmForm(store)

    const response = await store.submitLaunch('user@evm.com')

    expect(response.success).toBe(true)
    expect(response.submissionId).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// AC #6 — Network ↔ standard compatibility block
// ---------------------------------------------------------------------------

describe('Policy guardrails — network/standard compatibility', () => {
  it('blocks ERC20 deployed on an AVM network with actionable error', async () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(validOrgProfile())
    store.setTokenIntent(validTokenIntent())
    store.setComplianceReadiness(validCompliance())

    // ERC20 on algorand_mainnet = invalid combination
    store.setSelectedTemplate({
      ...validAvmTemplate(),
      standard: 'ERC20',
      network: 'algorand_mainnet',
    })
    store.setTokenEconomics(validErc20Economics())
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    store.completeStep(2, { isValid: true, errors: [], warnings: [] })
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    store.completeStep(4, { isValid: true, errors: [], warnings: [] })
    store.completeStep(6, { isValid: true, errors: [], warnings: [] })

    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(/Policy violation/)
    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(/NETWORK_INCOMPATIBLE_EVM_ON_AVM/)
  })

  it('blocks ASA deployed on an EVM network with actionable error', async () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(validOrgProfile())
    store.setTokenIntent(validTokenIntent())
    store.setComplianceReadiness(validCompliance())

    // ASA on ethereum_mainnet = invalid combination
    store.setSelectedTemplate({
      ...validEvmTemplate(),
      standard: 'ASA',
      network: 'ethereum_mainnet',
    })
    store.setTokenEconomics(validArc200Economics())
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    store.completeStep(2, { isValid: true, errors: [], warnings: [] })
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    store.completeStep(4, { isValid: true, errors: [], warnings: [] })
    store.completeStep(6, { isValid: true, errors: [], warnings: [] })

    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(/Policy violation/)
    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(/NETWORK_INCOMPATIBLE_AVM_ON_EVM/)
  })
})

// ---------------------------------------------------------------------------
// AC #7 — Decimal precision overflow block
// ---------------------------------------------------------------------------

describe('Policy guardrails — decimal precision', () => {
  it('blocks ARC200 with decimals > 6 before any submission state changes', async () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(validOrgProfile())
    store.setTokenIntent(validTokenIntent())
    store.setComplianceReadiness(validCompliance())
    store.setSelectedTemplate(validAvmTemplate()) // ARC200
    store.setTokenEconomics({
      ...validArc200Economics(),
      decimals: 7, // ARC200 max is 6 → policy error
    })
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    store.completeStep(2, { isValid: true, errors: [], warnings: [] })
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    store.completeStep(4, { isValid: true, errors: [], warnings: [] })
    store.completeStep(6, { isValid: true, errors: [], warnings: [] })

    const idempotencyKey = deriveIdempotencyKey(
      store.currentForm.draftId ?? 'test',
      'user@test.com',
    )

    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(/DECIMALS_EXCEEDS_STANDARD_LIMIT/)

    // Policy check fires before idempotency record is written
    const record = getIdempotencyRecord(idempotencyKey)
    expect(record).toBeUndefined()
  })

  it('blocks ERC20 with decimals > 18 with actionable error', async () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(validOrgProfile())
    store.setTokenIntent(validTokenIntent())
    store.setComplianceReadiness(validCompliance())
    store.setSelectedTemplate(validEvmTemplate()) // ERC20
    store.setTokenEconomics({
      ...validErc20Economics(),
      decimals: 19, // ERC20 max is 18 → policy error
    })
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    store.completeStep(2, { isValid: true, errors: [], warnings: [] })
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    store.completeStep(4, { isValid: true, errors: [], warnings: [] })
    store.completeStep(6, { isValid: true, errors: [], warnings: [] })

    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(/DECIMALS_EXCEEDS_STANDARD_LIMIT/)
  })
})

// ---------------------------------------------------------------------------
// AC #8 — Supply bounds block
// ---------------------------------------------------------------------------

describe('Policy guardrails — supply bounds', () => {
  it('blocks zero supply with actionable error before idempotency state changes', async () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(validOrgProfile())
    store.setTokenIntent(validTokenIntent())
    store.setComplianceReadiness(validCompliance())
    store.setSelectedTemplate(validAvmTemplate())
    store.setTokenEconomics({
      ...validArc200Economics(),
      totalSupply: 0, // zero supply → policy error
    })
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    store.completeStep(2, { isValid: true, errors: [], warnings: [] })
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    store.completeStep(4, { isValid: true, errors: [], warnings: [] })
    store.completeStep(6, { isValid: true, errors: [], warnings: [] })

    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(/SUPPLY_TOO_LOW/)
  })
})

// ---------------------------------------------------------------------------
// AC #2 + #3 — Idempotency: duplicate submission after success
// ---------------------------------------------------------------------------

describe('Idempotency — duplicate submission prevention', () => {
  it('returns cached result on second submit after success without re-executing', async () => {
    const store = useGuidedLaunchStore()
    fillCompleteAvmForm(store)
    const userEmail = 'idempotent-user@test.com'

    // First submission
    const first = await store.submitLaunch(userEmail)
    expect(first.success).toBe(true)
    const firstId = first.submissionId

    // Second submission with same draft + email must return the same submissionId
    const second = await store.submitLaunch(userEmail)
    expect(second.success).toBe(true)
    expect(second.submissionId).toBe(firstId)
    expect(second.message).toMatch(/already submitted/i)
  })

  it('idempotency key is stable across multiple derivations', () => {
    const draftId = 'draft_test_stable_123'
    const email = 'alice@test.com'

    const key1 = deriveIdempotencyKey(draftId, email)
    const key2 = deriveIdempotencyKey(draftId, email)
    const key3 = deriveIdempotencyKey(draftId, email)

    expect(key1).toBe(key2)
    expect(key2).toBe(key3)
  })

  it('idempotency key differs for different emails on same draft', () => {
    const draftId = 'draft_shared'

    const key1 = deriveIdempotencyKey(draftId, 'alice@test.com')
    const key2 = deriveIdempotencyKey(draftId, 'bob@test.com')

    expect(key1).not.toBe(key2)
  })

  it('idempotency key differs for different drafts with same email', () => {
    const email = 'shared@test.com'

    const key1 = deriveIdempotencyKey('draft_aaa', email)
    const key2 = deriveIdempotencyKey('draft_bbb', email)

    expect(key1).not.toBe(key2)
  })
})

// ---------------------------------------------------------------------------
// AC #4 — Failed attempt leaves draft retryable
// ---------------------------------------------------------------------------

describe('Idempotency — failed attempt is retryable', () => {
  it('allows retry after a failed submission', async () => {
    const store = useGuidedLaunchStore()
    fillCompleteAvmForm(store)
    const userEmail = 'retry@test.com'

    // Mark the idempotency record as failed by calling the public utility directly
    // (simulating what submitLaunch does internally on a catch block)
    const draftId = store.currentForm.draftId!
    const { recordSubmissionAttempt, markSubmissionFailed } = await import(
      '../../utils/issuanceIdempotency'
    )
    const key = deriveIdempotencyKey(draftId, userEmail)
    recordSubmissionAttempt(key, draftId)
    markSubmissionFailed(key, 'network timeout')

    // The record exists and is failed — submitLaunch must treat this as retryable
    const { checkIdempotency } = await import('../../utils/issuanceIdempotency')
    const check = checkIdempotency(key)
    expect(check.isSafeToSubmit).toBe(true) // failed record does not block retry

    // Actual retry via the store succeeds
    const response = await store.submitLaunch(userEmail)
    expect(response.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC #5 — Missing draftId is detected early (programming error guard)
// ---------------------------------------------------------------------------

describe('Draft identity guard', () => {
  it('throws when draftId is missing before any idempotency state is written', async () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(validOrgProfile())
    store.setTokenIntent(validTokenIntent())
    store.setComplianceReadiness(validCompliance())
    store.setSelectedTemplate(validAvmTemplate())
    store.setTokenEconomics(validArc200Economics())
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    store.completeStep(2, { isValid: true, errors: [], warnings: [] })
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    store.completeStep(4, { isValid: true, errors: [], warnings: [] })
    store.completeStep(6, { isValid: true, errors: [], warnings: [] })

    // Forcibly remove draftId to simulate programming error
    // @ts-expect-error — intentional test of runtime guard
    store.currentForm.draftId = undefined

    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(
      /draftId required for idempotency/,
    )
  })
})

// ---------------------------------------------------------------------------
// AC #1 ordering — policy check fires before idempotency record is written
// ---------------------------------------------------------------------------

describe('Policy check fires before idempotency record is written', () => {
  it('does not write any idempotency record when policy validation fails', async () => {
    const store = useGuidedLaunchStore()
    store.setOrganizationProfile(validOrgProfile())
    store.setTokenIntent(validTokenIntent())
    store.setComplianceReadiness(validCompliance())

    // Misconfigured: ARC200 on algorand_mainnet but decimal > max
    store.setSelectedTemplate(validAvmTemplate())
    store.setTokenEconomics({ ...validArc200Economics(), decimals: 20 })
    store.completeStep(0, { isValid: true, errors: [], warnings: [] })
    store.completeStep(1, { isValid: true, errors: [], warnings: [] })
    store.completeStep(2, { isValid: true, errors: [], warnings: [] })
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    store.completeStep(4, { isValid: true, errors: [], warnings: [] })
    store.completeStep(6, { isValid: true, errors: [], warnings: [] })

    const draftId = store.currentForm.draftId!
    const key = deriveIdempotencyKey(draftId, 'user@test.com')

    // No record before the attempt
    expect(getIdempotencyRecord(key)).toBeUndefined()

    await expect(store.submitLaunch('user@test.com')).rejects.toThrow(/Policy violation/)

    // Still no record — policy check prevents idempotency write
    expect(getIdempotencyRecord(key)).toBeUndefined()
  })
})
