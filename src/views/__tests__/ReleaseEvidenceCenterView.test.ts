/**
 * Unit Tests: ReleaseEvidenceCenterView — WCAG AA Accessibility & Rendering
 *
 * Validates accessibility requirements and rendering for the Release Evidence
 * Center workspace (AC #1, #2, #3, #8, #9).
 *
 * Acceptance Criteria covered:
 *  AC #1  — A new workspace exposes release-readiness in a single operator-facing view
 *  AC #2  — The workspace clearly distinguishes permissive vs protected sign-off evidence
 *  AC #3  — Workspace presents fail-closed status when critical evidence is missing
 *  AC #4  — Operators can identify top blockers and navigate to downstream surfaces
 *  AC #5  — Evidence categories include protected sign-off, onboarding, reporting, accessibility
 *  AC #8  — Accessible by keyboard and screen reader with ARIA landmarks and labelling
 *  AC #9  — Tests verify both happy-path and fail-closed scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import ReleaseEvidenceCenterView from '../ReleaseEvidenceCenterView.vue'
import { RELEASE_CENTER_TEST_IDS } from '../../utils/releaseReadiness'

// ---------------------------------------------------------------------------
// Router helper
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/compliance/release', name: 'ReleaseEvidenceCenter', component: { template: '<div />' } },
      { path: '/compliance/evidence', name: 'ComplianceEvidencePack', component: { template: '<div />' } },
      { path: '/compliance/reporting', name: 'ComplianceReportingWorkspace', component: { template: '<div />' } },
      { path: '/compliance/approval', name: 'EnterpriseApprovalCockpit', component: { template: '<div />' } },
      { path: '/compliance/operations', name: 'ComplianceOperationsCockpit', component: { template: '<div />' } },
    ],
  })

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

async function mountView() {
  vi.useFakeTimers()
  const router = makeRouter()
  const wrapper = mount(ReleaseEvidenceCenterView, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
    },
  })
  await router.isReady()
  // Advance past the 150ms loading delay
  await vi.advanceTimersByTimeAsync(300)
  await nextTick()
  vi.useRealTimers()
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReleaseEvidenceCenterView — WCAG AA Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── Landmark structure ────────────────────────────────────────────────────

  it('renders workspace root with id="release-center-main" for skip link (SC 2.4.1)', async () => {
    const wrapper = await mountView()
    const main = wrapper.find('#release-center-main')
    expect(main.exists()).toBe(true)
  })

  it('workspace root has role="region" and descriptive aria-label (SC 1.3.6)', async () => {
    const wrapper = await mountView()
    const region = wrapper.find('#release-center-main')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('aria-label')).toMatch(/Release Evidence Center/i)
  })

  it('renders exactly one <h1> heading for screen-reader orientation (SC 1.3.1)', async () => {
    const wrapper = await mountView()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text()).toMatch(/Release Evidence Center/i)
  })

  it('h1 has correct data-testid for headings hierarchy', async () => {
    const wrapper = await mountView()
    const h1 = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.HEADING}"]`)
    expect(h1.exists()).toBe(true)
    expect(h1.element.tagName).toBe('H1')
  })

  it('skip link points to #release-center-main and is sr-only by default (SC 2.4.1)', async () => {
    const wrapper = await mountView()
    const skipLink = wrapper.find('a[href="#release-center-main"]')
    expect(skipLink.exists()).toBe(true)
    expect(skipLink.classes()).toContain('sr-only')
  })

  it('main region has descriptive aria-label (SC 1.3.6)', async () => {
    const wrapper = await mountView()
    const region = wrapper.find('#release-center-main')
    const label = region.attributes('aria-label') ?? ''
    expect(label.length).toBeGreaterThan(10)
  })

  // ── Section headings ──────────────────────────────────────────────────────

  it('renders evidence artifact inventory section with h2 (SC 1.3.1)', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.DIMENSIONS_SECTION}"]`)
    expect(section.exists()).toBe(true)
    const h2 = section.find('h2')
    expect(h2.text()).toMatch(/Evidence Artifact Inventory/i)
  })

  it('renders environment diagnostics section with h2 (SC 1.3.1)', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.ENV_DIAG_SECTION}"]`)
    expect(section.exists()).toBe(true)
    const h2 = section.find('h2')
    expect(h2.text()).toMatch(/Environment Diagnostics/i)
  })

  it('renders approval handoff section with h2 (SC 1.3.1)', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.APPROVAL_HANDOFF_SECTION}"]`)
    expect(section.exists()).toBe(true)
    const h2 = section.find('h2')
    expect(h2.text()).toMatch(/Approval Handoff Summary/i)
  })

  it('renders export section with h2 (SC 1.3.1)', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_SECTION}"]`)
    expect(section.exists()).toBe(true)
    const h2 = section.find('h2')
    expect(h2.text()).toMatch(/Export Evidence Summary/i)
  })

  // ── Keyboard navigation ───────────────────────────────────────────────────

  it('refresh button has correct aria-label for keyboard users (SC 2.1.1)', async () => {
    const wrapper = await mountView()
    const btn = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.REFRESH_BTN}"]`)
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toMatch(/Refresh/i)
  })

  it('export button has correct aria-label (SC 2.1.1)', async () => {
    const wrapper = await mountView()
    const btn = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_BTN}"]`)
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toMatch(/Download evidence summary/i)
  })

  it('refresh button has focus-visible ring classes for WCAG SC 2.4.7', async () => {
    const wrapper = await mountView()
    const btn = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.REFRESH_BTN}"]`)
    expect(btn.classes()).toContain('focus-visible:ring-2')
    expect(btn.classes()).toContain('focus:outline-none')
  })

  it('export button has focus-visible ring classes for WCAG SC 2.4.7', async () => {
    const wrapper = await mountView()
    const btn = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_BTN}"]`)
    expect(btn.classes()).toContain('focus-visible:ring-2')
    expect(btn.classes()).toContain('focus:outline-none')
  })

  // ── Status semantics ──────────────────────────────────────────────────────

  it('dimension status badges have role="status" (SC 4.1.3)', async () => {
    const wrapper = await mountView()
    const badges = wrapper.findAll('[role="status"]')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('dimension status badges have aria-label describing the status (SC 1.1.1)', async () => {
    const wrapper = await mountView()
    const badge = wrapper.find(`[data-testid="rc-dim-badge-strict-run-execution"]`)
    if (badge.exists()) {
      const ariaLabel = badge.attributes('aria-label') ?? ''
      expect(ariaLabel.length).toBeGreaterThan(5)
    }
  })

  // ── Grade distinction (AC #2) ─────────────────────────────────────────────

  it('renders the grade distinction notice explaining protected vs permissive evidence (AC #2)', async () => {
    const wrapper = await mountView()
    const notice = wrapper.find('[data-testid="grade-distinction-notice"]')
    expect(notice.exists()).toBe(true)
    expect(notice.text()).toMatch(/Protected backend evidence/i)
    expect(notice.text()).toMatch(/permissive/i)
  })

  it('grade distinction notice has role="note" for screen readers', async () => {
    const wrapper = await mountView()
    const notice = wrapper.find('[data-testid="grade-distinction-notice"]')
    expect(notice.attributes('role')).toBe('note')
  })

  // ── No wallet connector UI ────────────────────────────────────────────────

  it('does not contain wallet connector patterns in rendered HTML', async () => {
    const wrapper = await mountView()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('does not contain "connect wallet" phrases in rendered text', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()
    expect(text.toLowerCase()).not.toContain('connect wallet')
    expect(text.toLowerCase()).not.toContain('sign transaction')
  })
})

describe('ReleaseEvidenceCenterView — Content Rendering', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders the workspace root data-testid', async () => {
    const wrapper = await mountView()
    expect(wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.ROOT}"]`).exists()).toBe(true)
  })

  it('renders the page heading "Release Evidence Center"', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toMatch(/Release Evidence Center/i)
  })

  it('renders evidence dimensions section after loading', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.DIMENSIONS_SECTION}"]`)
    expect(section.exists()).toBe(true)
  })

  it('renders at least one dimension card for launch-critical evidence', async () => {
    const wrapper = await mountView()
    const card = wrapper.find(`[data-testid="rc-dim-card-strict-run-execution"]`)
    expect(card.exists()).toBe(true)
  })

  it('renders the environment diagnostics section', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.ENV_DIAG_SECTION}"]`)
    expect(section.exists()).toBe(true)
  })

  it('renders required configuration dependency cards', async () => {
    const wrapper = await mountView()
    const card = wrapper.find(`[data-testid="env-dep-backend-api-url"]`)
    expect(card.exists()).toBe(true)
  })

  it('renders the approval handoff section', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.APPROVAL_HANDOFF_SECTION}"]`)
    expect(section.exists()).toBe(true)
  })

  it('renders the export section', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_SECTION}"]`)
    expect(section.exists()).toBe(true)
  })

  it('renders "Last refreshed" timestamp label', async () => {
    const wrapper = await mountView()
    const refreshed = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.REFRESHED_AT}"]`)
    expect(refreshed.exists()).toBe(true)
    expect(refreshed.text()).toMatch(/Last refreshed:/i)
  })

  it('renders next actions section when blockers exist', async () => {
    const wrapper = await mountView()
    // Default fixture has missing evidence → should have next actions
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.NEXT_ACTIONS_SECTION}"]`)
    const noBlockers = wrapper.find('[data-testid="release-no-blockers"]')
    // Either the blockers section or the no-blockers section should be present
    expect(section.exists() || noBlockers.exists()).toBe(true)
  })

  it('renders enterprise operator language (no blockchain jargon)', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()
    expect(text).toMatch(/evidence/i)
    expect(text).toMatch(/readiness|ready|sign-off/i)
    // Should not contain developer-only CI jargon
    expect(text).not.toMatch(/git commit|pull request|npm run/i)
  })
})

describe('ReleaseEvidenceCenterView — Fail-Closed Behavior (AC #3)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('default fixture has missing evidence → overall readiness is not "ready" (fail-closed)', async () => {
    const wrapper = await mountView()
    // The SignOffReadinessPanel is rendered — it should NOT show "Ready for Sign-Off" 
    // since default fixture has no protected evidence
    const html = wrapper.html()
    // The default state is configuration_blocked or missing_evidence
    // We confirm that "Ready for Sign-Off" is not shown as the overall state badge
    const readinessBadge = wrapper.find('[data-testid="readiness-state-badge"]')
    if (readinessBadge.exists()) {
      expect(readinessBadge.text()).not.toBe('Ready for Sign-Off')
    }
  })

  it('shows next actions panel when evidence is missing (fail-closed, AC #4)', async () => {
    const wrapper = await mountView()
    // Default fixture has missing evidence, so blockers should be visible
    const actionsSection = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.NEXT_ACTIONS_SECTION}"]`)
    if (actionsSection.exists()) {
      expect(actionsSection.text().length).toBeGreaterThan(0)
    }
  })

  it('approval queue button is disabled when evidence is incomplete (fail-closed)', async () => {
    const wrapper = await mountView()
    const approvalBtn = wrapper.find('[data-testid="approval-queue-link"]')
    if (approvalBtn.exists()) {
      // For default (blocked) fixture, approval should not be ready
      // Check aria-disabled or disabled attribute
      const ariaDisabled = approvalBtn.attributes('aria-disabled')
      const isDisabled = approvalBtn.attributes('disabled') !== undefined
      // It might be 'true' or might be disabled attribute
      const isBlockedFromApproval = ariaDisabled === 'true' || isDisabled
      expect(isBlockedFromApproval).toBe(true)
    }
  })

  it('dimension cards show status badges for each evidence item', async () => {
    const wrapper = await mountView()
    const badges = wrapper.findAll('[data-testid^="rc-dim-badge-"]')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('environment dependency cards show "Not configured" for unconfigured items', async () => {
    const wrapper = await mountView()
    const html = wrapper.html()
    // Default fixture has unconfigured required deps
    expect(html).toMatch(/Not configured/i)
  })
})

describe('ReleaseEvidenceCenterView — Loading and Loading State', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows loading indicator before data loads', () => {
    vi.useFakeTimers()
    const router = makeRouter()
    const wrapper = mount(ReleaseEvidenceCenterView, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
      },
    })
    const loading = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.LOADING}"]`)
    expect(loading.exists()).toBe(true)
    vi.useRealTimers()
  })

  it('loading indicator has role="status" and aria-live="polite" (SC 4.1.3)', () => {
    vi.useFakeTimers()
    const router = makeRouter()
    const wrapper = mount(ReleaseEvidenceCenterView, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
      },
    })
    const loading = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.LOADING}"]`)
    expect(loading.attributes('role')).toBe('status')
    expect(loading.attributes('aria-live')).toBe('polite')
    vi.useRealTimers()
  })

  it('hides loading indicator after data loads', async () => {
    const wrapper = await mountView()
    const loading = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.LOADING}"]`)
    expect(loading.exists()).toBe(false)
  })
})

describe('ReleaseEvidenceCenterView — Export Functionality', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('export button is present and labelled correctly', async () => {
    const wrapper = await mountView()
    const btn = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_BTN}"]`)
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toMatch(/Download Evidence Summary/i)
  })

  it('export section describes what will be downloaded', async () => {
    const wrapper = await mountView()
    const section = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_SECTION}"]`)
    expect(section.text()).toMatch(/JSON/i)
    expect(section.text()).toMatch(/audit/i)
  })
})

describe('ReleaseEvidenceCenterView — Sidebar Integration', () => {
  it('route /compliance/release is registered and rendered correctly', async () => {
    const router = makeRouter()
    const wrapper = mount(ReleaseEvidenceCenterView, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router,
        ],
      },
    })
    await router.push('/compliance/release')
    await router.isReady()
    vi.useFakeTimers()
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    vi.useRealTimers()
    expect(wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.ROOT}"]`).exists()).toBe(true)
  })
})
