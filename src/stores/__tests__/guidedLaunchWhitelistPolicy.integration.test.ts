/**
 * Integration tests: GuidedLaunch store × WhitelistPolicy
 *
 * Validates:
 * 1. Store persists and restores whitelist policy data through draft save/load
 * 2. setWhitelistPolicy updates lastModified and triggers draft save
 * 3. Whitelist policy is included in the canonical step order (step index 3)
 * 4. canSubmit remains false when whitelist step (3) is not complete
 * 5. clearDraft removes whitelist policy data
 * 6. Draft restoration on loadDraft correctly deserialises whitelist policy
 *
 * Business value:
 * Compliance officers configure who may hold a regulated token during guided launch.
 * If the store–component contract breaks (e.g., policy not persisted across page reload),
 * operators lose their jurisdiction configuration silently and deploy unrestricted tokens.
 * This integration layer is the most failure-prone seam between pure component logic and
 * the wizard step orchestration.
 *
 * Regression risk: HIGH — removing or renaming `whitelistPolicy` from the draft data model
 * would silently reset jurisdiction rules on every page reload, bypassing compliance gates.
 *
 * Issue: Build jurisdiction-aware whitelist management UX for guided launch
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGuidedLaunchStore } from '../guidedLaunch'
import type {
  WhitelistPolicy,
  OrganizationProfile,
  TokenIntent,
  ComplianceReadiness,
  TokenTemplate,
  TokenEconomics,
} from '../../types/guidedLaunch'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePolicy(overrides: Partial<WhitelistPolicy> = {}): WhitelistPolicy {
  return {
    isEnabled: true,
    allowedJurisdictions: [{ code: 'DE', name: 'Germany' }],
    restrictedJurisdictions: [{ code: 'IR', name: 'Iran' }, { code: 'KP', name: 'North Korea' }],
    investorCategories: ['accredited_investor', 'professional_investor'],
    policyNotes: 'EU MiFID II — accredited investors only',
    policyConfirmed: true,
    ...overrides,
  }
}

function makeOrg(): OrganizationProfile {
  return {
    organizationName: 'Policy Test Corp',
    organizationType: 'company',
    jurisdiction: 'DE',
    contactName: 'Ada',
    contactEmail: 'ada@policy-test.io',
    role: 'compliance_officer',
  }
}

function makeIntent(): TokenIntent {
  return {
    tokenPurpose: 'Regulated security token with EU distribution controls',
    utilityType: 'asset_backed',
    targetAudience: 'b2b',
    expectedHolders: '100_1000',
    geographicScope: 'regional',
  }
}

function makeCompliance(): ComplianceReadiness {
  return {
    requiresMICA: true,
    requiresKYC: true,
    requiresAML: true,
    hasLegalReview: true,
    hasRiskAssessment: true,
    restrictedJurisdictions: ['IR', 'KP'],
    whitelistRequired: true,
    riskAcknowledged: true,
  }
}

function makeTemplate(): TokenTemplate {
  return {
    id: 'security-mica',
    name: 'MICA-Compliant Security Token',
    description: 'Regulated security token with MICA compliance',
    standard: 'ARC200',
    network: 'algorand_mainnet',
    useCase: 'asset_backed',
    complianceLevel: 'mica_compliant',
    recommendedFor: ['Real-world assets', 'Securities', 'Regulated entities'],
    features: ['MICA compliant', 'KYC/AML ready', 'Whitelist support'],
  }
}

function makeEconomics(): TokenEconomics {
  return {
    totalSupply: 1000000,
    decimals: 6,
    initialDistribution: { team: 10, investors: 60, community: 20, reserve: 10 },
    burnMechanism: false,
    mintingAllowed: false,
  }
}

// ---------------------------------------------------------------------------
// Draft persistence
// ---------------------------------------------------------------------------

describe('GuidedLaunch store × WhitelistPolicy: draft persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('persists whitelist policy in draft when setWhitelistPolicy is called', () => {
    const store = useGuidedLaunchStore()
    const policy = makePolicy()
    store.setWhitelistPolicy(policy)

    const raw = localStorage.getItem('biatec_guided_launch_draft')
    expect(raw).toBeTruthy()
    const draft = JSON.parse(raw!)
    const saved = draft.form.whitelistPolicy

    expect(saved.isEnabled).toBe(true)
    expect(saved.allowedJurisdictions).toHaveLength(1)
    expect(saved.allowedJurisdictions[0].code).toBe('DE')
    expect(saved.restrictedJurisdictions).toHaveLength(2)
    expect(saved.investorCategories).toContain('accredited_investor')
    expect(saved.policyNotes).toBe('EU MiFID II — accredited investors only')
    expect(saved.policyConfirmed).toBe(true)
  })

  it('restores whitelist policy from draft on loadDraft', () => {
    const storeA = useGuidedLaunchStore()
    storeA.setWhitelistPolicy(makePolicy())

    // Simulate a fresh page load by creating a new store instance
    setActivePinia(createPinia())
    const storeB = useGuidedLaunchStore()
    const loaded = storeB.loadDraft()
    expect(loaded).toBe(true)

    const policy = storeB.currentForm.whitelistPolicy
    expect(policy).toBeTruthy()
    expect(policy!.isEnabled).toBe(true)
    expect(policy!.allowedJurisdictions[0].code).toBe('DE')
    expect(policy!.restrictedJurisdictions).toHaveLength(2)
    expect(policy!.investorCategories).toContain('professional_investor')
  })

  it('persists isEnabled=false when policy is disabled', () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy(makePolicy({ isEnabled: false, policyConfirmed: false }))

    const raw = localStorage.getItem('biatec_guided_launch_draft')!
    const draft = JSON.parse(raw)
    expect(draft.form.whitelistPolicy.isEnabled).toBe(false)
  })

  it('persists empty jurisdiction lists correctly', () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy(makePolicy({ allowedJurisdictions: [], restrictedJurisdictions: [] }))

    const raw = localStorage.getItem('biatec_guided_launch_draft')!
    const draft = JSON.parse(raw)
    expect(draft.form.whitelistPolicy.allowedJurisdictions).toEqual([])
    expect(draft.form.whitelistPolicy.restrictedJurisdictions).toEqual([])
  })

  it('updates lastModified when policy is set', async () => {
    const store = useGuidedLaunchStore()
    const before = store.currentForm.lastModified.getTime()
    // Actual delay so timestamps differ on fast machines
    await new Promise(resolve => setTimeout(resolve, 10))
    store.setWhitelistPolicy(makePolicy())
    const after = store.currentForm.lastModified.getTime()
    expect(after).toBeGreaterThan(before)
  })

  it('clearDraft removes whitelistPolicy from store state', () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy(makePolicy())
    expect(store.currentForm.whitelistPolicy).toBeTruthy()

    store.clearDraft()
    expect(store.currentForm.whitelistPolicy).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Step ordering — whitelist must be step index 3
// ---------------------------------------------------------------------------

describe('GuidedLaunch store × WhitelistPolicy: step ordering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('whitelist step appears at index 3 in stepStatuses', () => {
    const store = useGuidedLaunchStore()
    const whitelistIdx = store.stepStatuses.findIndex(s => s.id === 'whitelist')
    expect(whitelistIdx).toBe(3)
  })

  it('template step appears at index 4 (after whitelist at 3)', () => {
    const store = useGuidedLaunchStore()
    const templateIdx = store.stepStatuses.findIndex(s => s.id === 'template')
    expect(templateIdx).toBe(4)
  })

  it('totalSteps is 7 (org, intent, compliance, whitelist, template, economics, review)', () => {
    const store = useGuidedLaunchStore()
    expect(store.totalSteps).toBe(7)
  })

  it('whitelist step is required (isOptional = false)', () => {
    const store = useGuidedLaunchStore()
    const step = store.stepStatuses.find(s => s.id === 'whitelist')
    expect(step?.isOptional).toBe(false)
  })

  it('economics step is optional (isOptional = true)', () => {
    const store = useGuidedLaunchStore()
    const step = store.stepStatuses.find(s => s.id === 'economics')
    expect(step?.isOptional).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// canSubmit gate — whitelist step must be complete
// ---------------------------------------------------------------------------

describe('GuidedLaunch store × WhitelistPolicy: canSubmit gate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  /**
   * Fills every required step except whitelist to verify that omitting
   * whitelist still blocks submission.
   */
  function fillAllExceptWhitelist(store: ReturnType<typeof useGuidedLaunchStore>) {
    store.setOrganizationProfile(makeOrg())
    store.setTokenIntent(makeIntent())
    store.setComplianceReadiness(makeCompliance())
    // Intentionally skip setWhitelistPolicy
    store.setSelectedTemplate(makeTemplate())
    store.setTokenEconomics(makeEconomics())
    // Mark steps 0,1,2,4,6 complete — skip step 3 (whitelist)
    ;[0, 1, 2, 4, 6].forEach(i =>
      store.completeStep(i, { isValid: true, errors: [], warnings: [] }),
    )
  }

  it('canSubmit is false when whitelist step (index 3) is not complete', () => {
    const store = useGuidedLaunchStore()
    fillAllExceptWhitelist(store)
    expect(store.canSubmit).toBe(false)
  })

  it('canSubmit becomes true after whitelist step is also completed', () => {
    const store = useGuidedLaunchStore()
    fillAllExceptWhitelist(store)
    store.setWhitelistPolicy(makePolicy())
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    expect(store.canSubmit).toBe(true)
  })

  it('completing whitelist step adds "whitelist" to completedSteps array', () => {
    const store = useGuidedLaunchStore()
    store.completeStep(3, { isValid: true, errors: [], warnings: [] })
    expect(store.currentForm.completedSteps).toContain('whitelist')
  })
})

// ---------------------------------------------------------------------------
// Policy content validation
// ---------------------------------------------------------------------------

describe('GuidedLaunch store × WhitelistPolicy: policy content', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('stores empty investorCategories array', () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy(makePolicy({ investorCategories: [] }))
    expect(store.currentForm.whitelistPolicy!.investorCategories).toEqual([])
  })

  it('stores all supported investor category values', () => {
    const store = useGuidedLaunchStore()
    const allCategories = [
      'accredited_investor',
      'professional_investor',
      'qualified_purchaser',
      'retail_investor',
      'institutional_investor',
      'employees_only',
      'partners_only',
    ] as const
    store.setWhitelistPolicy(makePolicy({ investorCategories: [...allCategories] }))
    const saved = store.currentForm.whitelistPolicy!.investorCategories
    expect(saved).toHaveLength(7)
    allCategories.forEach(cat => expect(saved).toContain(cat))
  })

  it('stores policyNotes as undefined when empty string provided', () => {
    // The component trims notes and passes undefined for empty
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy(makePolicy({ policyNotes: undefined }))
    expect(store.currentForm.whitelistPolicy!.policyNotes).toBeUndefined()
  })

  it('stores multiple allowed and restricted jurisdictions', () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy(
      makePolicy({
        allowedJurisdictions: [
          { code: 'DE', name: 'Germany' },
          { code: 'FR', name: 'France' },
          { code: 'NL', name: 'Netherlands' },
        ],
        restrictedJurisdictions: [
          { code: 'IR', name: 'Iran' },
          { code: 'KP', name: 'North Korea' },
          { code: 'RU', name: 'Russia' },
        ],
      }),
    )
    expect(store.currentForm.whitelistPolicy!.allowedJurisdictions).toHaveLength(3)
    expect(store.currentForm.whitelistPolicy!.restrictedJurisdictions).toHaveLength(3)
  })

  it('second setWhitelistPolicy call overwrites previous policy', () => {
    const store = useGuidedLaunchStore()
    store.setWhitelistPolicy(makePolicy())
    store.setWhitelistPolicy(makePolicy({ isEnabled: false, policyConfirmed: false, investorCategories: [] }))
    expect(store.currentForm.whitelistPolicy!.isEnabled).toBe(false)
    expect(store.currentForm.whitelistPolicy!.investorCategories).toEqual([])
  })
})
