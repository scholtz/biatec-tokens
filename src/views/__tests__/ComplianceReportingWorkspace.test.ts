/**
 * Unit Tests: ComplianceReportingWorkspace — rendering / structure
 *
 * Covers WCAG semantics, data-testid anchors, aria-labelledby wiring,
 * wallet-free language, and loading/empty state rendering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import ComplianceReportingWorkspace from '../ComplianceReportingWorkspace.vue'

// ---------------------------------------------------------------------------
// Stubs & router setup
// ---------------------------------------------------------------------------

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

async function mountWorkspace() {
  const router = makeRouter()
  const wrapper = mount(ComplianceReportingWorkspace, {
    global: { plugins: [router] },
  })
  await router.isReady()
  await nextTick()
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// 1. Page structure
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — page structure', () => {
  it('renders a single h1 heading (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountWorkspace()
    const h1s = wrapper.findAll('h1')
    expect(h1s).toHaveLength(1)
  })

  it('h1 contains expected page title', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('h1').text()).toContain('Compliance Reporting Workspace')
  })

  it('has data-testid="compliance-reporting-workspace" on main container', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="compliance-reporting-workspace"]').exists()).toBe(true)
  })

  it('main container has role="region"', async () => {
    const wrapper = await mountWorkspace()
    const region = wrapper.find('[data-testid="compliance-reporting-workspace"]')
    expect(region.attributes('role')).toBe('region')
  })

  it('main container has aria-label', async () => {
    const wrapper = await mountWorkspace()
    const region = wrapper.find('[data-testid="compliance-reporting-workspace"]')
    expect(region.attributes('aria-label')).toBeTruthy()
  })

  it('skip link targeting #reporting-main is present (WCAG 2.4.1)', async () => {
    const wrapper = await mountWorkspace()
    const skipLink = wrapper.find('a[href="#reporting-main"]')
    expect(skipLink.exists()).toBe(true)
  })

  it('main content area has id="reporting-main"', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('#reporting-main').exists()).toBe(true)
  })

  it('has data-testid="reporting-header"', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="reporting-header"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. Loading state
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — loading state', () => {
  it('renders loading state before onMounted resolves', async () => {
    const router = makeRouter()
    const wrapper = mount(ComplianceReportingWorkspace, {
      global: { plugins: [router] },
    })
    // Before nextTick, isLoading=true
    const loading = wrapper.find('[data-testid="loading-state"]')
    expect(loading.exists()).toBe(true)
  })

  it('hides loading state after data is loaded', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. Overall status banner
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — overall status banner', () => {
  it('renders the overall status banner section', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="overall-status-banner"]').exists()).toBe(true)
  })

  it('section has aria-labelledby="overall-status-heading"', async () => {
    const wrapper = await mountWorkspace()
    const section = wrapper.find('[data-testid="overall-status-banner"]')
    expect(section.attributes('aria-labelledby')).toBe('overall-status-heading')
  })

  it('heading with id="overall-status-heading" is present', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('#overall-status-heading').exists()).toBe(true)
  })

  it('renders overall status label text', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="overall-status-label"]').exists()).toBe(true)
  })

  it('renders readiness score value element', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="readiness-score-value"]').exists()).toBe(true)
  })

  it('renders readiness score bar', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="readiness-score-bar"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 4. Subsection renders
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — subsections', () => {
  it('renders jurisdiction section with data-testid', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="jurisdiction-section"]').exists()).toBe(true)
  })

  it('jurisdiction section has aria-labelledby', async () => {
    const wrapper = await mountWorkspace()
    const section = wrapper.find('[data-testid="jurisdiction-section"]')
    expect(section.attributes('aria-labelledby')).toBe('jurisdiction-heading')
  })

  it('renders investor eligibility section', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="investor-eligibility-section"]').exists()).toBe(true)
  })

  it('investor eligibility section has aria-labelledby', async () => {
    const wrapper = await mountWorkspace()
    const section = wrapper.find('[data-testid="investor-eligibility-section"]')
    expect(section.attributes('aria-labelledby')).toBe('investor-eligibility-heading')
  })

  it('renders KYC/AML section', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="kyc-aml-section"]').exists()).toBe(true)
  })

  it('KYC/AML section has aria-labelledby', async () => {
    const wrapper = await mountWorkspace()
    const section = wrapper.find('[data-testid="kyc-aml-section"]')
    expect(section.attributes('aria-labelledby')).toBe('kyc-aml-heading')
  })

  it('renders whitelist section', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="whitelist-section"]').exists()).toBe(true)
  })

  it('whitelist section has aria-labelledby', async () => {
    const wrapper = await mountWorkspace()
    const section = wrapper.find('[data-testid="whitelist-section"]')
    expect(section.attributes('aria-labelledby')).toBe('whitelist-heading')
  })

  it('renders evidence summary section', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="evidence-summary-section"]').exists()).toBe(true)
  })

  it('evidence summary section has aria-labelledby', async () => {
    const wrapper = await mountWorkspace()
    const section = wrapper.find('[data-testid="evidence-summary-section"]')
    expect(section.attributes('aria-labelledby')).toBe('evidence-summary-heading')
  })

  it('renders export actions section', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="export-actions-section"]').exists()).toBe(true)
  })

  it('export section has aria-labelledby', async () => {
    const wrapper = await mountWorkspace()
    const section = wrapper.find('[data-testid="export-actions-section"]')
    expect(section.attributes('aria-labelledby')).toBe('export-heading')
  })
})

// ---------------------------------------------------------------------------
// 5. Export buttons
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — export buttons', () => {
  it('renders export JSON button', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="export-json-button"]').exists()).toBe(true)
  })

  it('renders export text report button', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="export-text-button"]').exists()).toBe(true)
  })

  it('renders copy to clipboard button', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="copy-clipboard-button"]').exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. Workspace navigation
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — workspace nav', () => {
  it('renders workspace-nav with correct aria-label', async () => {
    const wrapper = await mountWorkspace()
    const nav = wrapper.find('[data-testid="workspace-nav"]')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBeTruthy()
  })

  it('workspace nav has link to /compliance/launch', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-launch-console"]').exists()).toBe(true)
  })

  it('workspace nav has link to /compliance/setup', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-setup"]').exists()).toBe(true)
  })

  it('workspace nav has link to /compliance/evidence', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-evidence"]').exists()).toBe(true)
  })

  it('workspace nav has link to /compliance/policy', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-policy"]').exists()).toBe(true)
  })

  it('workspace nav has link to /compliance/release (release evidence)', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-release-evidence"]').exists()).toBe(true)
  })

  it('workspace nav has link to /compliance/onboarding (onboarding queue)', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-onboarding"]').exists()).toBe(true)
  })

  it('workspace nav has link to /compliance/approval (approval queue)', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-approval"]').exists()).toBe(true)
  })

  it('workspace nav has link to /compliance-monitoring', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-monitoring"]').exists()).toBe(true)
  })

  it('workspace nav has link to /compliance/reporting-center', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="nav-reporting-center"]').exists()).toBe(true)
  })

  it('workspace nav has all 10 source surface links', async () => {
    const wrapper = await mountWorkspace()
    const nav = wrapper.find('[data-testid="workspace-nav"]')
    const links = nav.findAll('a, [data-testid^="nav-"]')
    // Should have at least 10 links (launch, setup, evidence, release, onboarding,
    // approval, policy, monitoring, risk-report, reporting-center)
    expect(links.length).toBeGreaterThanOrEqual(10)
  })
})

// ---------------------------------------------------------------------------
// 7. Wallet-free language
// ---------------------------------------------------------------------------

describe('ComplianceReportingWorkspace — wallet-free language', () => {
  it('does not contain wallet connector UI text', async () => {
    const wrapper = await mountWorkspace()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    expect(html).not.toContain('connect wallet')
    expect(html).not.toContain('Not connected')
  })
})
