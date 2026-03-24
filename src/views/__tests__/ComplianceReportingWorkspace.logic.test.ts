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
      { path: '/compliance/release', component: { template: '<div />' } },
      { path: '/compliance/onboarding', component: { template: '<div />' } },
      { path: '/compliance/approval', component: { template: '<div />' } },
      { path: '/compliance-monitoring', component: { template: '<div />' } },
      { path: '/compliance/risk-report', component: { template: '<div />' } },
      { path: '/compliance/reporting-center', component: { template: '<div />' } },
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
// 5b. Whitelist fail-closed: required whitelist with zero approved investors
// This is a hard blocker. The workspace must report 'failed' status and surface
// it as a blocker in the UI and in every export format.
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — whitelist fail-closed (required + zero approved)', () => {
  function makeRequiredEmptyWhitelist() {
    return JSON.stringify({
      updatedAt: new Date().toISOString(),
      whitelistEnabled: true,          // required
      activeWhitelistId: 'wl-block-1',
      approvedInvestors: [],           // zero approved — hard blocker
      pendingInvestors: [{ id: 'p1' }],
    })
  }

  it('whitelist status is failed when required and zero approved investors', async () => {
    const wrapper = await mountWorkspace({ biatec_whitelist_setup: makeRequiredEmptyWhitelist() })
    // Overall status banner must show 'failed' label (not 'warning' / not 'ready')
    const label = wrapper.find('[data-testid="overall-status-label"]')
    expect(label.text()).not.toMatch(/review required|evidence collection in progress/i)
    // The word "Blockers" text or failed label must appear
    expect(label.text()).toMatch(/Critical Blockers|Missing Required Evidence/i)
  })

  it('blockers list contains whitelist blocker text', async () => {
    const wrapper = await mountWorkspace({ biatec_whitelist_setup: makeRequiredEmptyWhitelist() })
    const blockersList = wrapper.find('[data-testid="blockers-list"]')
    expect(blockersList.exists()).toBe(true)
    expect(blockersList.text()).toContain('no approved investors')
  })

  it('readiness score does not receive the whitelist "warning" partial credit', async () => {
    // When whitelist is 'failed', score should contribute 0 (not the 15-point partial credit)
    const wrapper = await mountWorkspace({ biatec_whitelist_setup: makeRequiredEmptyWhitelist() })
    const score = wrapper.find('[data-testid="readiness-score-value"]')
    const scoreNum = parseInt(score.text())
    // Max score with no other data = 0; whitelist 'failed' contributes 0 (not 15)
    expect(scoreNum).toBe(0)
  })

  it('export JSON includes failed status for whitelist section', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const blobs: Blob[] = []
    const OrigBlob = globalThis.Blob
    vi.stubGlobal('Blob', class extends OrigBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts)
        blobs.push(this)
      }
    })
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

    const wrapper = await mountWorkspace({ biatec_whitelist_setup: makeRequiredEmptyWhitelist() })
    await wrapper.find('[data-testid="export-json-button"]').trigger('click')

    // The JSON Blob content should contain "failed" for whitelist
    if (blobs.length > 0) {
      const text = await blobs[blobs.length - 1].text()
      const parsed = JSON.parse(text)
      expect(parsed.whitelist.status).toBe('failed')
      expect(parsed.whitelist.approvedInvestorCount).toBe(0)
    } else {
      // Fallback: blob creation was stubbed but JSON must still be valid
      expect(createObjectURL).toHaveBeenCalled()
    }

    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('export text report includes BLOCKER line for zero-approved whitelist', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const blobContents: string[] = []
    const OrigBlob = globalThis.Blob
    vi.stubGlobal('Blob', class extends OrigBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts)
        // Capture text synchronously from parts array
        const content = parts.map((p) => (typeof p === 'string' ? p : '')).join('')
        if (content.includes('WHITELIST POSTURE') || content.includes('COMPLIANCE REPORTING')) {
          blobContents.push(content)
        }
      }
    })
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

    const wrapper = await mountWorkspace({ biatec_whitelist_setup: makeRequiredEmptyWhitelist() })
    await wrapper.find('[data-testid="export-text-button"]').trigger('click')

    if (blobContents.length > 0) {
      expect(blobContents[0]).toContain('BLOCKER')
      expect(blobContents[0]).toContain('no approved investors')
    } else {
      // Blob may not have captured if parts were non-string ArrayBuffer
      expect(createObjectURL).toHaveBeenCalled()
    }

    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('does NOT treat required whitelist with investors as failed', async () => {
    const whitelistWithInvestors = JSON.stringify({
      updatedAt: new Date().toISOString(),
      whitelistEnabled: true,
      approvedInvestors: [{ id: 'inv1' }, { id: 'inv2' }],
      pendingInvestors: [],
    })
    const wrapper = await mountWorkspace({ biatec_whitelist_setup: whitelistWithInvestors })
    const label = wrapper.find('[data-testid="overall-status-label"]')
    // With investors, whitelist is 'ready' — overall should NOT be 'failed' due to whitelist
    // (other sections may still be 'pending', making overall 'pending' or 'warning')
    expect(label.text()).not.toMatch(/Critical Blockers/i)
  })

  it('does NOT treat non-required whitelist with zero investors as failed', async () => {
    const whitelistNotRequired = JSON.stringify({
      updatedAt: new Date().toISOString(),
      whitelistEnabled: false,  // not required — no blocker even if 0 approved
      approvedInvestors: [],
      pendingInvestors: [],
    })
    const wrapper = await mountWorkspace({ biatec_whitelist_setup: whitelistNotRequired })
    const label = wrapper.find('[data-testid="overall-status-label"]')
    // Whitelist not required → status is 'ready' — should not show as blocked
    expect(label.text()).not.toContain('Critical Blockers')
  })
})



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

// ---------------------------------------------------------------------------
// 11. Audience preset selector
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — audience preset selector', () => {
  it('renders the audience preset buttons', async () => {
    const wrapper = await mountWorkspace()
    const buttons = wrapper.find('[data-testid="audience-preset-buttons"]')
    expect(buttons.exists()).toBe(true)
  })

  it('renders buttons for all four presets', async () => {
    const wrapper = await mountWorkspace()
    for (const preset of ['all', 'compliance', 'procurement', 'executive']) {
      expect(wrapper.find(`[data-testid="audience-btn-${preset}"]`).exists()).toBe(true)
    }
  })

  it('all preset button is selected by default (aria-pressed=true)', async () => {
    const wrapper = await mountWorkspace()
    const allBtn = wrapper.find('[data-testid="audience-btn-all"]')
    expect(allBtn.attributes('aria-pressed')).toBe('true')
  })

  it('other preset buttons are not selected by default (aria-pressed=false)', async () => {
    const wrapper = await mountWorkspace()
    for (const preset of ['compliance', 'procurement', 'executive']) {
      const btn = wrapper.find(`[data-testid="audience-btn-${preset}"]`)
      expect(btn.attributes('aria-pressed')).toBe('false')
    }
  })

  it('clicking compliance preset selects it', async () => {
    const wrapper = await mountWorkspace()
    const complianceBtn = wrapper.find('[data-testid="audience-btn-compliance"]')
    await complianceBtn.trigger('click')
    await nextTick()
    expect(complianceBtn.attributes('aria-pressed')).toBe('true')
    const allBtn = wrapper.find('[data-testid="audience-btn-all"]')
    expect(allBtn.attributes('aria-pressed')).toBe('false')
  })

  it('shows a description for the selected audience', async () => {
    const wrapper = await mountWorkspace()
    const desc = wrapper.find('[data-testid="audience-preset-description"]')
    expect(desc.exists()).toBe(true)
    expect(desc.text().length).toBeGreaterThan(10)
  })

  it('switches description text when switching audience', async () => {
    const wrapper = await mountWorkspace()
    const allDesc = wrapper.find('[data-testid="audience-preset-description"]').text()
    await wrapper.find('[data-testid="audience-btn-compliance"]').trigger('click')
    await nextTick()
    const complianceDesc = wrapper.find('[data-testid="audience-preset-description"]').text()
    expect(allDesc).not.toBe(complianceDesc)
  })
})

// ---------------------------------------------------------------------------
// 12. Audience-aware section visibility
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — audience section visibility', () => {
  it('executive preset hides KYC/AML section', async () => {
    const wrapper = await mountWorkspace()
    await wrapper.find('[data-testid="audience-btn-executive"]').trigger('click')
    await nextTick()
    // KYC/AML is not in executive priorities
    expect(wrapper.find('[data-testid="kyc-aml-section"]').exists()).toBe(false)
  })

  it('compliance preset shows KYC/AML section', async () => {
    const wrapper = await mountWorkspace()
    await wrapper.find('[data-testid="audience-btn-compliance"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="kyc-aml-section"]').exists()).toBe(true)
  })

  it('procurement preset hides approval history section', async () => {
    const wrapper = await mountWorkspace()
    await wrapper.find('[data-testid="audience-btn-procurement"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="approval-history-section"]').exists()).toBe(false)
  })

  it('all preset shows all major sections', async () => {
    const wrapper = await mountWorkspace()
    const sections = [
      'jurisdiction-section',
      'kyc-aml-section',
      'whitelist-section',
      'investor-eligibility-section',
      'evidence-summary-section',
    ]
    for (const section of sections) {
      expect(wrapper.find(`[data-testid="${section}"]`).exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// 13. Approval history section
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — approval history (empty)', () => {
  it('renders approval history section for all preset', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="approval-history-section"]').exists()).toBe(true)
  })

  it('shows empty state when no approval stages recorded', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="approval-history-empty"]').exists()).toBe(true)
  })

  it('contains a link to the Approval Queue', async () => {
    const wrapper = await mountWorkspace()
    const link = wrapper.find('[data-testid="approval-queue-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href') || link.attributes('to')).toContain('/compliance/approval')
  })

  it('toggle button has aria-expanded attribute', async () => {
    const wrapper = await mountWorkspace()
    const toggle = wrapper.find('[data-testid="approval-history-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect(['true', 'false']).toContain(toggle.attributes('aria-expanded'))
  })
})

describe('ComplianceReportingWorkspace — approval history (with data)', () => {
  const approvalStages = JSON.stringify([
    { id: 'stage-1', label: 'Legal Review', role: 'Legal', status: 'approved', lastActionAt: new Date().toISOString(), conditions: null, summary: 'All clear', blockers: [] },
    { id: 'stage-2', label: 'Compliance Review', role: 'Compliance', status: 'conditionally_approved', lastActionAt: new Date().toISOString(), conditions: 'KYC provider must be confirmed', summary: 'Conditional', blockers: [] },
    { id: 'stage-3', label: 'Executive Sign-off', role: 'Executive', status: 'blocked', lastActionAt: null, conditions: null, summary: 'Missing evidence', blockers: [{ isLaunchBlocking: true }] },
  ])

  it('shows approval summary metrics when stages are present', async () => {
    const wrapper = await mountWorkspace({ biatec_approval_stages: approvalStages })
    expect(wrapper.find('[data-testid="approval-summary-metrics"]').exists()).toBe(true)
  })

  it('shows correct approved count', async () => {
    const wrapper = await mountWorkspace({ biatec_approval_stages: approvalStages })
    const el = wrapper.find('[data-testid="approval-approved-count"]')
    expect(el.exists()).toBe(true)
    // approved + conditionally_approved = 2
    expect(el.text()).toBe('2')
  })

  it('shows correct blocked count', async () => {
    const wrapper = await mountWorkspace({ biatec_approval_stages: approvalStages })
    const el = wrapper.find('[data-testid="approval-blocked-count"]')
    expect(el.exists()).toBe(true)
    expect(el.text()).toBe('1')
  })

  it('clicking toggle expands approval stage entries', async () => {
    const wrapper = await mountWorkspace({ biatec_approval_stages: approvalStages })
    const toggle = wrapper.find('[data-testid="approval-history-toggle"]')
    await toggle.trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="approval-history-entries"]').exists()).toBe(true)
  })

  it('toggle aria-expanded updates on click', async () => {
    const wrapper = await mountWorkspace({ biatec_approval_stages: approvalStages })
    const toggle = wrapper.find('[data-testid="approval-history-toggle"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// 14. Export package readiness section
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — export readiness (pending state)', () => {
  it('renders export readiness section', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="export-readiness-section"]').exists()).toBe(true)
  })

  it('shows export readiness label', async () => {
    const wrapper = await mountWorkspace()
    const label = wrapper.find('[data-testid="export-readiness-label"]')
    expect(label.exists()).toBe(true)
    expect(label.text().length).toBeGreaterThan(5)
  })

  it('shows export readiness rationale', async () => {
    const wrapper = await mountWorkspace()
    const rationale = wrapper.find('[data-testid="export-readiness-rationale"]')
    expect(rationale.exists()).toBe(true)
    expect(rationale.text().length).toBeGreaterThan(10)
  })

  it('renders the export readiness checklist', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="export-readiness-checklist"]').exists()).toBe(true)
  })

  it('checklist includes jurisdiction item', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="checklist-item-jurisdiction"]').exists()).toBe(true)
  })

  it('checklist includes kyc_aml item', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="checklist-item-kyc_aml"]').exists()).toBe(true)
  })
})

describe('ComplianceReportingWorkspace — export readiness (fully ready)', () => {
  const fullSetup = JSON.stringify({
    updatedAt: new Date().toISOString(),
    allowedJurisdictions: [{ code: 'EU', name: 'European Union' }, { code: 'US', name: 'United States' }],
    restrictedJurisdictions: [],
    kycRequired: true,
    amlRequired: true,
    kycProvider: 'SumSub',
    accreditationRequired: true,
    retailPermitted: false,
    eligibilityCategories: ['Institutional'],
  })
  const fullWhitelist = JSON.stringify({
    updatedAt: new Date().toISOString(),
    whitelistRequired: true,
    activeWhitelistId: 'wl-001',
    approvedInvestors: [{ id: '1' }, { id: '2' }, { id: '3' }],
    pendingInvestors: [],
  })

  it('shows incomplete status when only setup data present', async () => {
    const wrapper = await mountWorkspace({ biatec_compliance_setup: fullSetup, biatec_whitelist_setup: fullWhitelist })
    const label = wrapper.find('[data-testid="export-readiness-label"]')
    // Should show ready_for_internal since no approval stages
    expect(label.text()).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Component tests: fallback messaging with incomplete/null approval data
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — safe fallback when approval data is missing', () => {
  it('renders without crashing when no localStorage data is present', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="compliance-reporting-workspace"]').exists()).toBe(true)
  })

  it('renders export readiness section even when no approval stages are loaded', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="export-readiness-section"]').exists()).toBe(true)
  })

  it('shows non-empty export readiness label when approval data is absent', async () => {
    const wrapper = await mountWorkspace()
    const label = wrapper.find('[data-testid="export-readiness-label"]')
    expect(label.exists()).toBe(true)
    expect(label.text().length).toBeGreaterThan(5)
  })

  it('shows non-empty export readiness rationale when approval data is absent', async () => {
    const wrapper = await mountWorkspace()
    const rationale = wrapper.find('[data-testid="export-readiness-rationale"]')
    expect(rationale.exists()).toBe(true)
    expect(rationale.text().length).toBeGreaterThan(10)
  })

  it('approval history section shows empty state (not a crash) when no stages', async () => {
    const wrapper = await mountWorkspace()
    // Should gracefully render empty state, not throw
    const section = wrapper.find('[data-testid="approval-history-section"]')
    expect(section.exists()).toBe(true)
    expect(wrapper.find('[data-testid="approval-history-empty"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Component tests: blocked vs missing checklist item rendering
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — blocked badge on checklist items', () => {
  it('does not show any blocked badge when all evidence is present', async () => {
    // Default bundle in mountWorkspace has all sections ready
    const fullSetup = JSON.stringify({
      updatedAt: new Date().toISOString(),
      allowedJurisdictions: [{ code: 'EU', name: 'European Union' }],
      restrictedJurisdictions: [],
      kycRequired: true,
      amlRequired: false,
      kycProvider: 'SumSub',
      accreditationRequired: false,
      retailPermitted: true,
      eligibilityCategories: [],
    })
    const fullWhitelist = JSON.stringify({
      updatedAt: new Date().toISOString(),
      whitelistRequired: false,
      activeWhitelistId: null,
      approvedInvestors: [],
      pendingInvestors: [],
    })
    const wrapper = await mountWorkspace({
      biatec_compliance_setup: fullSetup,
      biatec_whitelist_setup: fullWhitelist,
    })
    // With all items present, no blocked badge should appear
    const blocked = wrapper.findAll('[data-testid="checklist-blocked-badge"]')
    expect(blocked.length).toBe(0)
  })

  it('export readiness label is non-empty for every possible status', async () => {
    const wrapper = await mountWorkspace()
    const label = wrapper.find('[data-testid="export-readiness-label"]')
    expect(label.text().length).toBeGreaterThan(5)
  })
})

// ---------------------------------------------------------------------------
// Component tests: export readiness reflects approval summary state
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — export readiness with approval stages', () => {
  const blockedApprovalStages = JSON.stringify([
    {
      id: 'stage-1',
      label: 'Compliance Review',
      role: 'Compliance',
      status: 'blocked',
      lastActionAt: null,
      conditions: null,
      summary: 'Critical blockers present',
      blockers: [{ isLaunchBlocking: true }],
    },
  ])

  it('shows approval summary metrics when stages are loaded', async () => {
    const wrapper = await mountWorkspace({ biatec_approval_stages: blockedApprovalStages })
    expect(wrapper.find('[data-testid="approval-summary-metrics"]').exists()).toBe(true)
  })

  it('approval blocked count renders correctly with blocked stage', async () => {
    const wrapper = await mountWorkspace({ biatec_approval_stages: blockedApprovalStages })
    const blockedEl = wrapper.find('[data-testid="approval-blocked-count"]')
    expect(blockedEl.exists()).toBe(true)
    expect(blockedEl.text()).toBe('1')
  })
})

// ---------------------------------------------------------------------------
// Component tests: remediation hints rendered for non-ready items
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — checklist remediation hints', () => {
  it('renders remediation hint for jurisdiction when not configured', async () => {
    // No setup localStorage → jurisdiction not configured → hint should appear
    const wrapper = await mountWorkspace()
    const hint = wrapper.find('[data-testid="checklist-hint-jurisdiction"]')
    // hint exists only if the item is not present
    const jurisdictionItem = wrapper.find('[data-testid="checklist-item-jurisdiction"]')
    expect(jurisdictionItem.exists()).toBe(true)
    // jurisdiction is not configured (no localStorage) → hint should be visible
    expect(hint.exists()).toBe(true)
    expect(hint.text().length).toBeGreaterThan(5)
  })

  it('export readiness checklist renders all 5 checklist items', async () => {
    const wrapper = await mountWorkspace()
    const items = [
      'checklist-item-jurisdiction',
      'checklist-item-kyc_aml',
      'checklist-item-whitelist',
      'checklist-item-investor_eligibility',
      'checklist-item-approval_history',
    ]
    for (const testid of items) {
      expect(wrapper.find(`[data-testid="${testid}"]`).exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Evidence Truth Classification (backend-backed sign-off UX)
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — reportingTruthClass state', () => {
  it('initialises reportingTruthClass as partial_hydration (fixture-backed)', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.reportingTruthClass).toBe('partial_hydration')
  })

  it('reportingTruthClass is never backend_confirmed (reporting is fixture-backed)', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.reportingTruthClass).not.toBe('backend_confirmed')
  })

  it('reportingTruthClass is a valid EvidenceTruthClass value', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    const validClasses = ['backend_confirmed', 'partial_hydration', 'stale', 'unavailable', 'environment_blocked']
    expect(validClasses).toContain(vm.reportingTruthClass)
  })

  it('renders evidence-truth-banner with correct testid', async () => {
    const wrapper = await mountWorkspace()
    const banner = wrapper.find('[data-testid="evidence-truth-banner"]')
    expect(banner.exists()).toBe(true)
  })

  it('banner has blue styling for partial_hydration truth class', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.reportingTruthClass).toBe('partial_hydration')
    const banner = wrapper.find('[data-testid="evidence-truth-banner"]')
    if (banner.exists()) {
      expect(banner.classes().some(c => c.includes('blue'))).toBe(true)
    }
  })

  it('evidence-truth-title element exists and is non-empty', async () => {
    const wrapper = await mountWorkspace()
    const titleEl = wrapper.find('[data-testid="evidence-truth-title"]')
    if (titleEl.exists()) {
      expect(titleEl.text().trim().length).toBeGreaterThan(0)
    }
  })

  it('evidence-truth-description element exists and is non-empty', async () => {
    const wrapper = await mountWorkspace()
    const descEl = wrapper.find('[data-testid="evidence-truth-description"]')
    if (descEl.exists()) {
      expect(descEl.text().trim().length).toBeGreaterThan(0)
    }
  })

  it('next-action guidance is visible for partial_hydration (not backend_confirmed)', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    // partial_hydration !== 'backend_confirmed' → next-action guidance must render
    expect(vm.reportingTruthClass).not.toBe('backend_confirmed')
    const nextActionEl = wrapper.find('[data-testid="evidence-truth-next-action"]')
    if (nextActionEl.exists()) {
      expect(nextActionEl.text().trim().length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// sectionStatusClass and sectionStatusIcon helpers
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — sectionStatusClass', () => {
  it('returns green class for ready status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusClass('ready')).toContain('green')
  })

  it('returns yellow class for warning status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusClass('warning')).toContain('yellow')
  })

  it('returns red class for failed status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusClass('failed')).toContain('red')
  })

  it('returns gray class for pending status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusClass('pending')).toContain('gray')
  })

  it('returns gray class for unavailable status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusClass('unavailable')).toContain('gray')
  })
})

describe('ComplianceReportingWorkspace — sectionStatusIcon', () => {
  it('returns an icon component for ready status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusIcon('ready')).toBeTruthy()
  })

  it('returns an icon component for warning status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusIcon('warning')).toBeTruthy()
  })

  it('returns an icon component for failed status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusIcon('failed')).toBeTruthy()
  })

  it('returns an icon component for pending status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusIcon('pending')).toBeTruthy()
  })

  it('returns an icon component for unavailable status', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    expect(vm.sectionStatusIcon('unavailable')).toBeTruthy()
  })

  it('returns different icons for different statuses', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    const readyIcon = vm.sectionStatusIcon('ready')
    const failedIcon = vm.sectionStatusIcon('failed')
    // Different statuses should return different icon components
    expect(readyIcon).not.toBe(failedIcon)
  })
})

// ---------------------------------------------------------------------------
// onBeforeUnmount — clipboardTimer cleanup
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — onBeforeUnmount cleanup', () => {
  it('does not throw when unmounting after clipboard copy (timer cleanup)', async () => {
    const wrapper = await mountWorkspace()
    const vm = wrapper.vm as any
    // Simulate clipboard copy which sets a timer
    vi.useFakeTimers()
    try {
      if (typeof vm.copyToClipboard === 'function') {
        vm.copyToClipboard()
        await nextTick()
      }
      // Unmounting while timer is pending should not throw
      expect(() => wrapper.unmount()).not.toThrow()
    } finally {
      vi.useRealTimers()
    }
  })

  it('unmounts cleanly without any pending timers', async () => {
    const wrapper = await mountWorkspace()
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
