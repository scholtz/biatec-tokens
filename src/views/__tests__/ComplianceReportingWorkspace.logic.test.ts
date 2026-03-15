/**
 * Logic Tests: ComplianceReportingWorkspace
 *
 * Tests for computed logic, data loading from localStorage, export generation,
 * stale evidence detection, status derivation, and type exports.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'

// ---------------------------------------------------------------------------
// Type/constant exports from utility
// ---------------------------------------------------------------------------

import {
  OVERALL_STATUS_LABEL,
  STATUS_LABELS,
  type ComplianceReportBundle,
  type JurisdictionSummary,
  type KYCAMLSummary,
  type WhitelistSummary,
  type InvestorEligibilitySummary,
} from '../../utils/complianceEvidencePack'

vi.mock('../../layout/MainLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/compliance/reporting', component: { template: '<div />' } },
      { path: '/compliance/setup', component: { template: '<div />' } },
      { path: '/compliance/launch', component: { template: '<div />' } },
      { path: '/compliance/evidence', component: { template: '<div />' } },
      { path: '/compliance/policy', component: { template: '<div />' } },
    ],
  })
}

import ComplianceReportingWorkspace from '../ComplianceReportingWorkspace.vue'

async function mountWorkspace(localStorageData?: Record<string, string>) {
  const router = makeRouter()

  // Use actual localStorage.setItem — more reliable than prototype spy in happy-dom
  if (localStorageData) {
    for (const [key, value] of Object.entries(localStorageData)) {
      localStorage.setItem(key, value)
    }
  }

  const wrapper = mount(ComplianceReportingWorkspace, {
    global: { plugins: [router] },
  })
  await router.isReady()
  await nextTick()
  await nextTick()
  return wrapper
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// 1. Exported constants
// ---------------------------------------------------------------------------

describe('complianceEvidencePack — OVERALL_STATUS_LABEL exports', () => {
  it('exports OVERALL_STATUS_LABEL for all EvidenceStatus values', () => {
    expect(OVERALL_STATUS_LABEL.ready).toBeTruthy()
    expect(OVERALL_STATUS_LABEL.warning).toBeTruthy()
    expect(OVERALL_STATUS_LABEL.failed).toBeTruthy()
    expect(OVERALL_STATUS_LABEL.pending).toBeTruthy()
    expect(OVERALL_STATUS_LABEL.unavailable).toBeTruthy()
  })

  it('ready label indicates no critical blockers', () => {
    expect(OVERALL_STATUS_LABEL.ready).toContain('No Critical Blockers')
  })

  it('failed label indicates blockers must be resolved', () => {
    expect(OVERALL_STATUS_LABEL.failed).toMatch(/Critical Blockers|Resolved/i)
  })

  it('warning label mentions review required', () => {
    expect(OVERALL_STATUS_LABEL.warning).toMatch(/Review/i)
  })

  it('pending label mentions evidence collection', () => {
    expect(OVERALL_STATUS_LABEL.pending).toMatch(/Progress|Pending|Collection/i)
  })
})

// ---------------------------------------------------------------------------
// 2. Empty state (no localStorage data)
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — empty state (no data)', () => {
  it('renders without errors when no localStorage data exists', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows overall status label when no data', async () => {
    const wrapper = await mountWorkspace()
    const label = wrapper.find('[data-testid="overall-status-label"]')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBeTruthy()
  })

  it('shows 0% readiness score when no data', async () => {
    const wrapper = await mountWorkspace()
    const score = wrapper.find('[data-testid="readiness-score-value"]')
    expect(score.text()).toContain('0%')
  })

  it('shows jurisdiction not-configured badge when no data', async () => {
    const wrapper = await mountWorkspace()
    const badge = wrapper.find('[data-testid="jurisdiction-configured-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('Not Configured')
  })

  it('shows jurisdiction empty message when no data', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="jurisdiction-empty"]').exists()).toBe(true)
  })

  it('shows evidence empty message when no sections', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="evidence-empty"]').exists()).toBe(true)
  })

  it('shows what-to-do-next guidance when not ready', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="next-steps-guidance"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Jurisdiction data from localStorage
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — jurisdiction data loading', () => {
  const setupData = JSON.stringify({
    updatedAt: new Date().toISOString(),
    allowedJurisdictions: [
      { code: 'DE', name: 'Germany' },
      { code: 'AT', name: 'Austria' },
    ],
    restrictedJurisdictions: [
      { code: 'US', name: 'United States' },
    ],
  })

  it('shows configured badge when jurisdiction data present', async () => {
    const wrapper = await mountWorkspace({ biatec_compliance_setup: setupData })
    const badge = wrapper.find('[data-testid="jurisdiction-configured-badge"]')
    expect(badge.text()).toContain('Configured')
  })

  it('shows permitted count from setup data', async () => {
    const wrapper = await mountWorkspace({ biatec_compliance_setup: setupData })
    const count = wrapper.find('[data-testid="permitted-count"]')
    expect(count.text()).toBe('2')
  })

  it('shows restricted count from setup data', async () => {
    const wrapper = await mountWorkspace({ biatec_compliance_setup: setupData })
    const count = wrapper.find('[data-testid="restricted-count"]')
    expect(count.text()).toBe('1')
  })

  it('displays jurisdiction names', async () => {
    const wrapper = await mountWorkspace({ biatec_compliance_setup: setupData })
    const list = wrapper.find('[data-testid="jurisdiction-list"]')
    expect(list.exists()).toBe(true)
    expect(list.text()).toContain('Germany')
  })
})

// ---------------------------------------------------------------------------
// 4. KYC/AML data loading
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — KYC/AML data loading', () => {
  it('shows pending review count when kycAml has pending reviews', async () => {
    const kycData = JSON.stringify({
      updatedAt: new Date().toISOString(),
      providerConfigured: true,
      pendingReviews: [{ id: 'r1' }, { id: 'r2' }],
    })
    const wrapper = await mountWorkspace({ biatec_kyc_aml_setup: kycData })
    const pendingEl = wrapper.find('[data-testid="kyc-pending-count"]')
    expect(pendingEl.exists()).toBe(true)
    expect(pendingEl.text()).toContain('2')
  })

  it('does not show pending count when no reviews pending', async () => {
    const kycData = JSON.stringify({
      updatedAt: new Date().toISOString(),
      providerConfigured: true,
      pendingReviews: [],
    })
    const wrapper = await mountWorkspace({ biatec_kyc_aml_setup: kycData })
    expect(wrapper.find('[data-testid="kyc-pending-count"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 5. Whitelist data loading
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — whitelist data loading', () => {
  it('shows approved investor count from whitelist data', async () => {
    const whitelistData = JSON.stringify({
      updatedAt: new Date().toISOString(),
      whitelistEnabled: true,
      activeWhitelistId: 'wl-abc-123',
      approvedInvestors: [{ id: 'inv1' }, { id: 'inv2' }, { id: 'inv3' }],
      pendingInvestors: [{ id: 'inv4' }],
    })
    const wrapper = await mountWorkspace({ biatec_whitelist_setup: whitelistData })
    const count = wrapper.find('[data-testid="approved-investor-count"]')
    expect(count.text()).toBe('3')
  })

  it('shows pending investor count', async () => {
    const whitelistData = JSON.stringify({
      updatedAt: new Date().toISOString(),
      whitelistEnabled: true,
      activeWhitelistId: 'wl-abc-123',
      approvedInvestors: [{ id: 'inv1' }],
      pendingInvestors: [{ id: 'inv4' }, { id: 'inv5' }],
    })
    const wrapper = await mountWorkspace({ biatec_whitelist_setup: whitelistData })
    const count = wrapper.find('[data-testid="pending-investor-count"]')
    expect(count.text()).toBe('2')
  })

  it('shows active whitelist ID', async () => {
    const whitelistData = JSON.stringify({
      updatedAt: new Date().toISOString(),
      whitelistEnabled: true,
      activeWhitelistId: 'wl-abc-123',
      approvedInvestors: [{ id: 'inv1' }],
      pendingInvestors: [],
    })
    const wrapper = await mountWorkspace({ biatec_whitelist_setup: whitelistData })
    const el = wrapper.find('[data-testid="active-whitelist-id"]')
    expect(el.text()).toContain('wl-abc-123')
  })
})

// ---------------------------------------------------------------------------
// 6. Stale evidence detection
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — stale evidence', () => {
  it('shows freshness warning for stale data (>24h old)', async () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const setupData = JSON.stringify({
      updatedAt: staleDate,
      allowedJurisdictions: [{ code: 'DE', name: 'Germany' }],
    })
    const wrapper = await mountWorkspace({ biatec_compliance_setup: setupData })
    const warnings = wrapper.findAll('[data-testid="freshness-warning"]')
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('does not show freshness warning for fresh data (<24h)', async () => {
    const freshDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    const setupData = JSON.stringify({
      updatedAt: freshDate,
      allowedJurisdictions: [{ code: 'DE', name: 'Germany' }],
    })
    const wrapper = await mountWorkspace({ biatec_compliance_setup: setupData })
    const warnings = wrapper.findAll('[data-testid="freshness-warning"]')
    expect(warnings.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 7. Readiness score calculation
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — readiness score', () => {
  it('score is 0 when no data configured', async () => {
    const wrapper = await mountWorkspace()
    const score = wrapper.find('[data-testid="readiness-score-value"]')
    expect(score.text()).toBe('0%')
  })

  it('score increases when jurisdiction is configured', async () => {
    const setupData = JSON.stringify({
      updatedAt: new Date().toISOString(),
      allowedJurisdictions: [{ code: 'DE', name: 'Germany' }],
      accreditationRequired: false,
      retailPermitted: true,
    })
    const wrapper = await mountWorkspace({ biatec_compliance_setup: setupData })
    const score = wrapper.find('[data-testid="readiness-score-value"]')
    const scoreNum = parseInt(score.text())
    expect(scoreNum).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 8. Export actions
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — export actions', () => {
  it('export JSON button triggers download on click', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

    const wrapper = await mountWorkspace()
    await wrapper.find('[data-testid="export-json-button"]').trigger('click')

    expect(createObjectURL).toHaveBeenCalled()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('clipboard copy button shows "Copied!" after click', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })

    const wrapper = await mountWorkspace()
    await wrapper.find('[data-testid="copy-clipboard-button"]').trigger('click')
    await nextTick()

    const btn = wrapper.find('[data-testid="copy-clipboard-button"]')
    expect(btn.text()).toContain('Copied!')
  })
})

// ---------------------------------------------------------------------------
// 9. Type structure validation
// ---------------------------------------------------------------------------

describe('ComplianceReportBundle type structure', () => {
  it('ComplianceReportBundle has all required fields at runtime (duck-typing)', () => {
    const bundle: ComplianceReportBundle = {
      generatedAt: new Date().toISOString(),
      launchName: null,
      overallStatus: 'pending',
      readinessScore: 0,
      jurisdiction: {
        configured: false,
        jurisdictions: [],
        restrictedCount: 0,
        permittedCount: 0,
        staleSince: null,
      },
      kycAml: {
        status: 'pending',
        kycRequired: false,
        amlRequired: false,
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
    expect(bundle.evidenceSections).toBeInstanceOf(Array)
  })
})

// ---------------------------------------------------------------------------
// 10. Partial data state
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — partial data state', () => {
  it('handles corrupt localStorage data gracefully', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('NOT_VALID_JSON:::')
    const wrapper = await mountWorkspace()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="compliance-reporting-workspace"]').exists()).toBe(true)
  })

  it('renders with partial setup data (only jurisdiction)', async () => {
    const setupData = JSON.stringify({
      updatedAt: new Date().toISOString(),
      allowedJurisdictions: [{ code: 'EU', name: 'European Union' }],
    })
    const wrapper = await mountWorkspace({ biatec_compliance_setup: setupData })
    expect(wrapper.find('[data-testid="jurisdiction-configured-badge"]').text()).toContain('Configured')
    expect(wrapper.find('[data-testid="whitelist-section"]').exists()).toBe(true)
  })
})
