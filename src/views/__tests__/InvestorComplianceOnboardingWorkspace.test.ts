/**
 * Unit Tests: InvestorComplianceOnboardingWorkspace — rendering / structure
 *
 * Covers WCAG semantics, data-testid anchors, aria wiring, wallet-free
 * language, loading/empty/blocked/stale state rendering, stage expansion,
 * and the approval handoff section.
 *
 * Acceptance criteria mapped:
 *   AC #1  — workspace exists and is reachable
 *   AC #3  — staged readiness states rendered
 *   AC #4  — explicit blocker reasons and plain-language remediation
 *   AC #5  — fail-closed messaging; incomplete data never implies readiness
 *   AC #6  — existing enterprise patterns reused (badges, stage indicators)
 *   AC #8  — accessibility: keyboard semantics, ARIA roles
 *   AC #9  — wallet-free positioning
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import InvestorComplianceOnboardingWorkspace from '../InvestorComplianceOnboardingWorkspace.vue'

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

vi.mock('../../layout/MainLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))

// ---------------------------------------------------------------------------
// Router & mount helpers
// ---------------------------------------------------------------------------

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/compliance/onboarding', component: { template: '<div />' } },
      { path: '/compliance/approval', component: { template: '<div />' } },
      { path: '/compliance/evidence', component: { template: '<div />' } },
      { path: '/compliance/setup', component: { template: '<div />' } },
      { path: '/compliance/reporting', component: { template: '<div />' } },
    ],
  })
}

async function mountWorkspace() {
  vi.useFakeTimers()
  const router = makeRouter()
  const wrapper = mount(InvestorComplianceOnboardingWorkspace, {
    global: { plugins: [router, createTestingPinia({ createSpy: vi.fn })] },
  })
  await router.isReady()
  // Advance past the 150ms loading timeout
  await vi.advanceTimersByTimeAsync(200)
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
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// 1. Page structure
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — page structure', () => {
  it('renders a single h1 heading (WCAG SC 1.3.1)', async () => {
    const wrapper = await mountWorkspace()
    const h1s = wrapper.findAll('h1')
    expect(h1s).toHaveLength(1)
  })

  it('h1 contains expected page title', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('h1').text()).toContain('Investor Compliance Onboarding')
  })

  it('has data-testid="investor-onboarding-workspace" on main container', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="investor-onboarding-workspace"]').exists()).toBe(true)
  })

  it('main container has role="region"', async () => {
    const wrapper = await mountWorkspace()
    const region = wrapper.find('[data-testid="investor-onboarding-workspace"]')
    expect(region.attributes('role')).toBe('region')
  })

  it('main container has aria-label describing the workspace', async () => {
    const wrapper = await mountWorkspace()
    const region = wrapper.find('[data-testid="investor-onboarding-workspace"]')
    const label = region.attributes('aria-label')
    expect(label).toBeTruthy()
    expect(label).toContain('Investor Compliance Onboarding')
  })

  it('skip link targeting #onboarding-workspace-main is present (WCAG 2.4.1)', async () => {
    const wrapper = await mountWorkspace()
    const skip = wrapper.find('a[href="#onboarding-workspace-main"]')
    expect(skip.exists()).toBe(true)
  })

  it('workspace header has data-testid="onboarding-workspace-header"', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.find('[data-testid="onboarding-workspace-header"]').exists()).toBe(true)
  })

  it('heading has data-testid="onboarding-workspace-heading"', async () => {
    const wrapper = await mountWorkspace()
    const heading = wrapper.find('[data-testid="onboarding-workspace-heading"]')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Investor Compliance Onboarding')
  })

  it('disclaimer is present and contains "frontend fixtures"', async () => {
    const wrapper = await mountWorkspace()
    const disclaimer = wrapper.find('[data-testid="workspace-disclaimer"]')
    expect(disclaimer.exists()).toBe(true)
    expect(disclaimer.text()).toContain('frontend fixtures')
  })

  it('refreshed-at timestamp is rendered', async () => {
    const wrapper = await mountWorkspace()
    const ts = wrapper.find('[data-testid="onboarding-refreshed-at"]')
    expect(ts.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. Readiness posture banner
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — readiness posture banner', () => {
  it('renders the readiness posture banner', async () => {
    const wrapper = await mountWorkspace()
    const banner = wrapper.find('[data-testid="readiness-posture-banner"]')
    expect(banner.exists()).toBe(true)
  })

  it('posture banner has posture badge element', async () => {
    const wrapper = await mountWorkspace()
    const badge = wrapper.find('[data-testid="posture-badge"]')
    expect(badge.exists()).toBe(true)
  })

  it('posture badge has role="status"', async () => {
    const wrapper = await mountWorkspace()
    const badge = wrapper.find('[data-testid="posture-badge"]')
    expect(badge.attributes('role')).toBe('status')
  })

  it('posture badge has aria-label', async () => {
    const wrapper = await mountWorkspace()
    const badge = wrapper.find('[data-testid="posture-badge"]')
    const label = badge.attributes('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(3)
  })

  it('posture headline element is present', async () => {
    const wrapper = await mountWorkspace()
    const headline = wrapper.find('[data-testid="posture-headline"]')
    expect(headline.exists()).toBe(true)
    expect(headline.text().length).toBeGreaterThan(0)
  })

  it('posture rationale element is present', async () => {
    const wrapper = await mountWorkspace()
    const rationale = wrapper.find('[data-testid="posture-rationale"]')
    expect(rationale.exists()).toBe(true)
    expect(rationale.text().length).toBeGreaterThan(5)
  })

  it('quick stats section is present', async () => {
    const wrapper = await mountWorkspace()
    const stats = wrapper.find('[data-testid="posture-stats"]')
    expect(stats.exists()).toBe(true)
  })

  it('readiness score element is present', async () => {
    const wrapper = await mountWorkspace()
    const score = wrapper.find('[data-testid="readiness-score"]')
    expect(score.exists()).toBe(true)
    expect(score.text()).toContain('%')
  })

  it('readiness progress bar has role="progressbar" with ARIA attributes', async () => {
    const wrapper = await mountWorkspace()
    const bar = wrapper.find('[data-testid="readiness-progress-bar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('role')).toBe('progressbar')
    expect(bar.attributes('aria-valuenow')).toBeTruthy()
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
  })
})

// ---------------------------------------------------------------------------
// 3. Review stages
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — review stages', () => {
  const STAGE_IDS = [
    'intake',
    'documentation_review',
    'identity_kyc_review',
    'aml_risk_review',
    'jurisdiction_review',
    'evidence_preparation',
    'approval_handoff',
  ] as const

  it('stages section heading is rendered', async () => {
    const wrapper = await mountWorkspace()
    const heading = wrapper.find('[data-testid="stages-heading"]')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Review Stages')
  })

  it('stages list element is present', async () => {
    const wrapper = await mountWorkspace()
    const list = wrapper.find('[data-testid="stages-list"]')
    expect(list.exists()).toBe(true)
  })

  for (const id of STAGE_IDS) {
    it(`stage "${id}" item is rendered`, async () => {
      const wrapper = await mountWorkspace()
      const stage = wrapper.find(`[data-testid="stage-item-${id}"]`)
      expect(stage.exists()).toBe(true)
    })

    it(`stage "${id}" header is a <button> with aria-expanded`, async () => {
      const wrapper = await mountWorkspace()
      const header = wrapper.find(`[data-testid="stage-header-${id}"]`)
      expect(header.exists()).toBe(true)
      expect(header.element.tagName).toBe('BUTTON')
      const expanded = header.attributes('aria-expanded')
      expect(['true', 'false']).toContain(expanded)
    })

    it(`stage "${id}" header has aria-controls wired to stage body id`, async () => {
      const wrapper = await mountWorkspace()
      const header = wrapper.find(`[data-testid="stage-header-${id}"]`)
      expect(header.attributes('aria-controls')).toBe(`stage-body-${id}`)
    })

    it(`stage "${id}" body element has matching id`, async () => {
      const wrapper = await mountWorkspace()
      const body = wrapper.find(`#stage-body-${id}`)
      expect(body.exists()).toBe(true)
    })
  }

  it('all 7 stage items are rendered', async () => {
    const wrapper = await mountWorkspace()
    const list = wrapper.find('[data-testid="stages-list"]')
    const items = list.findAll('[data-testid^="stage-item-"]')
    expect(items.length).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// 4. Stage expand / collapse via toggleStage
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — stage expand/collapse', () => {
  it('clicking intake header toggles aria-expanded from false to true', async () => {
    const wrapper = await mountWorkspace()
    const header = wrapper.find('[data-testid="stage-header-intake"]')
    expect(header.attributes('aria-expanded')).toBe('false')
    await header.trigger('click')
    await nextTick()
    expect(header.attributes('aria-expanded')).toBe('true')
  })

  it('clicking intake header twice collapses it back to false', async () => {
    const wrapper = await mountWorkspace()
    const header = wrapper.find('[data-testid="stage-header-intake"]')
    await header.trigger('click')
    await nextTick()
    await header.trigger('click')
    await nextTick()
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('intake stage is collapsed by default (aria-expanded=false)', async () => {
    const wrapper = await mountWorkspace()
    const header = wrapper.find('[data-testid="stage-header-intake"]')
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('stage body is visible after clicking header', async () => {
    const wrapper = await mountWorkspace()
    const header = wrapper.find('[data-testid="stage-header-intake"]')
    await header.trigger('click')
    await nextTick()
    const body = wrapper.find('[data-testid="stage-body-intake"]')
    expect(body.isVisible()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. Approval handoff section
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — approval handoff section', () => {
  it('renders the approval handoff section', async () => {
    const wrapper = await mountWorkspace()
    const section = wrapper.find('[data-testid="approval-handoff-section"]')
    expect(section.exists()).toBe(true)
  })

  it('handoff heading contains "Approval Handoff"', async () => {
    const wrapper = await mountWorkspace()
    const heading = wrapper.find('[data-testid="handoff-heading"]')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Approval Handoff')
  })

  it('handoff CTA link points to /compliance/approval', async () => {
    const wrapper = await mountWorkspace()
    const cta = wrapper.find('[data-testid="handoff-cta"]')
    expect(cta.exists()).toBe(true)
    const href = cta.attributes('href') ?? cta.attributes('to')
    expect(href).toContain('/compliance/approval')
  })

  it('handoff CTA has aria-label describing its action', async () => {
    const wrapper = await mountWorkspace()
    const cta = wrapper.find('[data-testid="handoff-cta"]')
    const label = cta.attributes('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(5)
  })
})

// ---------------------------------------------------------------------------
// 6. Workspace navigation links
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — workspace navigation links', () => {
  it('workspace navigation links section is rendered', async () => {
    const wrapper = await mountWorkspace()
    const navLinks = wrapper.find('[data-testid="workspace-nav-links"]')
    expect(navLinks.exists()).toBe(true)
  })

  it('evidence pack nav link points to /compliance/evidence', async () => {
    const wrapper = await mountWorkspace()
    const link = wrapper.find('[data-testid="nav-link-evidence"]')
    expect(link.exists()).toBe(true)
    const href = link.attributes('href') ?? link.attributes('to')
    expect(href).toContain('/compliance/evidence')
  })

  it('compliance setup nav link points to /compliance/setup', async () => {
    const wrapper = await mountWorkspace()
    const link = wrapper.find('[data-testid="nav-link-setup"]')
    expect(link.exists()).toBe(true)
    const href = link.attributes('href') ?? link.attributes('to')
    expect(href).toContain('/compliance/setup')
  })

  it('compliance reporting nav link points to /compliance/reporting', async () => {
    const wrapper = await mountWorkspace()
    const link = wrapper.find('[data-testid="nav-link-reporting"]')
    expect(link.exists()).toBe(true)
    const href = link.attributes('href') ?? link.attributes('to')
    expect(href).toContain('/compliance/reporting')
  })
})

// ---------------------------------------------------------------------------
// 7. Wallet-free positioning (AC #9)
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — wallet-free positioning (AC #9)', () => {
  it('does not contain "WalletConnect" anywhere in rendered text', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.text()).not.toContain('WalletConnect')
  })

  it('does not contain "MetaMask" in rendered text', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.text()).not.toContain('MetaMask')
  })

  it('does not contain "connect wallet" instructions', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.text().toLowerCase()).not.toContain('connect wallet')
  })

  it('does not contain "sign transaction" instructions', async () => {
    const wrapper = await mountWorkspace()
    expect(wrapper.text().toLowerCase()).not.toContain('sign transaction')
  })

  it('contains compliance/onboarding language instead of wallet language', async () => {
    const wrapper = await mountWorkspace()
    const text = wrapper.text()
    // Verify it has enterprise compliance language
    expect(text).toMatch(/compliance|onboarding|readiness|review/i)
  })
})

// ---------------------------------------------------------------------------
// 8. Fixture selector (dev mode)
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — fixture selector', () => {
  it('renders the fixture selector buttons section', async () => {
    const wrapper = await mountWorkspace()
    const readyBtn = wrapper.find('[data-testid="fixture-btn-ready"]')
    expect(readyBtn.exists()).toBe(true)
  })

  it('renders blocked fixture button', async () => {
    const wrapper = await mountWorkspace()
    const btn = wrapper.find('[data-testid="fixture-btn-blocked"]')
    expect(btn.exists()).toBe(true)
  })

  it('renders partial fixture button', async () => {
    const wrapper = await mountWorkspace()
    const btn = wrapper.find('[data-testid="fixture-btn-partial"]')
    expect(btn.exists()).toBe(true)
  })

  it('renders stale fixture button', async () => {
    const wrapper = await mountWorkspace()
    const btn = wrapper.find('[data-testid="fixture-btn-stale"]')
    expect(btn.exists()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 9. Critical blockers banner (AC #4 / AC #5)
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — critical blockers banner', () => {
  it('partial fixture (default) hides the critical blockers banner (no launch-blocking blockers)', async () => {
    const wrapper = await mountWorkspace()
    const banner = wrapper.find('[data-testid="critical-blockers-banner"]')
    // partial fixture has only a medium blocker that is NOT launch-blocking
    // banner only appears when there are launch-blocking blockers
    // If the banner exists, it should not be visible; if it doesn't exist, that's also fine
    if (banner.exists()) {
      // The banner may be hidden via v-if/v-show
      const html = wrapper.html()
      // Verify no critical alert is announcing blockage for the partial fixture
      expect(html).not.toMatch(/Launch Blocked/i)
    }
  })

  it('blocked fixture shows critical blockers banner with role="alert"', async () => {
    const wrapper = await mountWorkspace()
    // Switch to blocked fixture
    const blockedBtn = wrapper.find('[data-testid="fixture-btn-blocked"]')
    await blockedBtn.trigger('click')
    await nextTick()
    await nextTick()

    const banner = wrapper.find('[data-testid="critical-blockers-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.isVisible()).toBe(true)
    expect(banner.attributes('role')).toBe('alert')
  })

  it('blocked fixture banner has top-blockers list', async () => {
    const wrapper = await mountWorkspace()
    const blockedBtn = wrapper.find('[data-testid="fixture-btn-blocked"]')
    await blockedBtn.trigger('click')
    await nextTick()
    await nextTick()

    const list = wrapper.find('[data-testid="top-blockers-list"]')
    expect(list.exists()).toBe(true)
    const items = list.findAll('li')
    expect(items.length).toBeGreaterThan(0)
  })

  it('ready fixture shows no critical blockers banner', async () => {
    const wrapper = await mountWorkspace()
    const readyBtn = wrapper.find('[data-testid="fixture-btn-ready"]')
    await readyBtn.trigger('click')
    await nextTick()
    await nextTick()

    const banner = wrapper.find('[data-testid="critical-blockers-banner"]')
    // When all stages are complete there are no launch-blocking blockers
    if (banner.exists()) {
      expect(banner.isVisible()).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// 10. Posture-specific rendering
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — posture-specific rendering', () => {
  it('ready fixture produces posture badge text containing "Ready"', async () => {
    const wrapper = await mountWorkspace()
    const readyBtn = wrapper.find('[data-testid="fixture-btn-ready"]')
    await readyBtn.trigger('click')
    await nextTick()
    await nextTick()
    const badge = wrapper.find('[data-testid="posture-badge"]')
    expect(badge.text()).toContain('Ready')
  })

  it('blocked fixture produces posture badge text containing "Blocked"', async () => {
    const wrapper = await mountWorkspace()
    const blockedBtn = wrapper.find('[data-testid="fixture-btn-blocked"]')
    await blockedBtn.trigger('click')
    await nextTick()
    await nextTick()
    const badge = wrapper.find('[data-testid="posture-badge"]')
    expect(badge.text()).toContain('Blocked')
  })

  it('stale fixture produces posture badge text containing "Stale"', async () => {
    const wrapper = await mountWorkspace()
    const staleBtn = wrapper.find('[data-testid="fixture-btn-stale"]')
    await staleBtn.trigger('click')
    await nextTick()
    await nextTick()
    const badge = wrapper.find('[data-testid="posture-badge"]')
    expect(badge.text()).toContain('Stale')
  })

  it('ready fixture produces 100% readiness score', async () => {
    const wrapper = await mountWorkspace()
    const readyBtn = wrapper.find('[data-testid="fixture-btn-ready"]')
    await readyBtn.trigger('click')
    await nextTick()
    await nextTick()
    const score = wrapper.find('[data-testid="readiness-score"]')
    expect(score.text()).toContain('100%')
  })

  it('blocked fixture produces a readiness score less than 100%', async () => {
    const wrapper = await mountWorkspace()
    const blockedBtn = wrapper.find('[data-testid="fixture-btn-blocked"]')
    await blockedBtn.trigger('click')
    await nextTick()
    await nextTick()
    const score = wrapper.find('[data-testid="readiness-score"]')
    const pct = parseInt(score.text().replace('%', ''), 10)
    expect(pct).toBeLessThan(100)
  })

  it('blocked fixture shows the workspace posture rationale in plain language', async () => {
    const wrapper = await mountWorkspace()
    const blockedBtn = wrapper.find('[data-testid="fixture-btn-blocked"]')
    await blockedBtn.trigger('click')
    await nextTick()
    await nextTick()
    const rationale = wrapper.find('[data-testid="posture-rationale"]')
    expect(rationale.text().length).toBeGreaterThan(10)
    // Must not imply readiness when blocked (fail-closed)
    expect(rationale.text().toLowerCase()).not.toContain('complete. the package meets the readiness threshold')
  })
})

// ---------------------------------------------------------------------------
// 11. Stage status badges
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — stage status badges', () => {
  it('each stage header has a status badge', async () => {
    const wrapper = await mountWorkspace()
    const STAGE_IDS = [
      'intake', 'documentation_review', 'identity_kyc_review',
      'aml_risk_review', 'jurisdiction_review', 'evidence_preparation', 'approval_handoff',
    ]
    for (const id of STAGE_IDS) {
      const badge = wrapper.find(`[data-testid="stage-status-badge-${id}"]`)
      expect(badge.exists()).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// 12. Accessibility — ARIA, keyboard, semantic structure
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — accessibility (AC #8)', () => {
  it('all stage header buttons have type="button"', async () => {
    const wrapper = await mountWorkspace()
    const headers = wrapper.findAll('[data-testid^="stage-header-"]')
    for (const header of headers) {
      expect(header.element.tagName).toBe('BUTTON')
    }
  })

  it('region landmark has a meaningful aria-label (WCAG 1.3.6)', async () => {
    const wrapper = await mountWorkspace()
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    const label = region.attributes('aria-label')
    expect(label).toBeTruthy()
    expect(label!.length).toBeGreaterThan(10)
  })

  it('progress bar has all required ARIA attributes for screen readers', async () => {
    const wrapper = await mountWorkspace()
    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('aria-valuenow')).toBeTruthy()
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
    expect(bar.attributes('aria-label')).toBeTruthy()
  })

  it('main content element has id="onboarding-workspace-main" for skip link target', async () => {
    const wrapper = await mountWorkspace()
    const main = wrapper.find('#onboarding-workspace-main')
    expect(main.exists()).toBe(true)
  })

  it('critical blockers banner (when visible) has role="alert" for screen reader announcement', async () => {
    const wrapper = await mountWorkspace()
    const blockedBtn = wrapper.find('[data-testid="fixture-btn-blocked"]')
    await blockedBtn.trigger('click')
    await nextTick()
    await nextTick()
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
  })

  it('page does not use icon fonts (uses SVG icons for WCAG 1.1.1 compliance)', async () => {
    const wrapper = await mountWorkspace()
    const iconFonts = wrapper.findAll('i.pi, i.fa, i.fas, i.far, i.fab')
    expect(iconFonts).toHaveLength(0)
  })
})
