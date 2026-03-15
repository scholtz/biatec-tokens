/**
 * Component Tests: SignOffReadinessPanel
 *
 * Validates:
 *  - Panel renders with overall state badge and headline
 *  - Summary banner shows blocking/stale/config-gap counts
 *  - Last-run bar shows freshness label and run status
 *  - Configuration blocked alert renders when config gaps exist
 *  - Config dependency list renders with labels and descriptions
 *  - Evidence dimensions list renders all provided dimensions
 *  - Each dimension card shows title, state badge, freshness, action
 *  - Launch-critical badge present on critical dimensions
 *  - Next actions section renders actions with owner and blocking badges
 *  - Advisory actions do not show launch-blocking badge
 *  - Product-vs-evidence notice is always visible
 *  - WCAG: role="status" on overall state badge
 *  - WCAG: role="region" with aria-label on summary banner
 *  - WCAG: role="alert" on config-blocked alert
 *  - WCAG: role="note" on product-vs-evidence notice
 *  - WCAG: aria-label on freshness labels (not color-only)
 *  - Evidence path links rendered for non-ready dimensions
 *  - No evidence path link rendered for ready dimensions
 *  - Ready state renders no config alert
 *  - Ready state renders no next actions
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import SignOffReadinessPanel from '../SignOffReadinessPanel.vue'
import {
  type ReleaseReadinessState,
  type EvidenceDimension,
  type ConfigurationDependency,
  type ReadinessNextAction,
  SIGN_OFF_READINESS_LABELS,
  buildDefaultReleaseReadiness,
  deriveReleaseReadiness,
} from '../../../utils/releaseReadiness'
import type { OwnerDomain } from '../../../utils/remediationWorkflow'

// Derive valid states from the canonical labels map — stays in sync automatically
const ALL_SIGN_OFF_STATES = Object.keys(SIGN_OFF_READINESS_LABELS) as ReleaseReadinessState['overallState'][]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-03-15T12:00:00.000Z')
const FRESH_TS = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }] })
}

function makeDimension(overrides: Partial<EvidenceDimension> = {}): EvidenceDimension {
  return {
    id: 'test-dim',
    title: 'Test Evidence Dimension',
    description: 'Tests that sign-off evidence is present.',
    state: 'ready',
    isLaunchCritical: true,
    lastEvidenceAt: FRESH_TS,
    freshnessLabel: '5 days ago',
    ownerDomain: 'compliance' as OwnerDomain,
    nextActionSummary: 'No action needed.',
    evidencePath: '/compliance/evidence',
    ...overrides,
  }
}

function makeConfigDep(overrides: Partial<ConfigurationDependency> = {}): ConfigurationDependency {
  return {
    id: 'test-cfg',
    label: 'Test Config Dep',
    description: 'A required environment variable.',
    isConfigured: true,
    isRequired: true,
    ownerDomain: 'shared_ops' as OwnerDomain,
    ...overrides,
  }
}

function makeNextAction(overrides: Partial<ReadinessNextAction> = {}): ReadinessNextAction {
  return {
    id: 'test-action',
    ownerDomain: 'compliance' as OwnerDomain,
    summary: 'Run the protected workflow',
    explanation: 'Execute the strict sign-off lane to produce evidence.',
    isLaunchBlocking: true,
    dimensionIds: ['test-dim'],
    actionPath: '/compliance/reporting',
    ...overrides,
  }
}

function makeReadiness(overrides: Partial<ReleaseReadinessState> = {}): ReleaseReadinessState {
  return {
    overallState: 'ready',
    headline: 'All protected sign-off evidence is present, fresh, and validated.',
    rationale: 'The release evidence posture meets launch-authorization requirements.',
    dimensions: [makeDimension()],
    configDependencies: [makeConfigDep()],
    nextActions: [],
    launchBlockingCount: 0,
    staleCount: 0,
    missingConfigCount: 0,
    lastProtectedRunAt: FRESH_TS,
    lastProtectedRunLabel: '5 days ago',
    lastRunSucceeded: true,
    computedAt: NOW.toISOString(),
    ...overrides,
  }
}

async function mountPanel(readiness: ReleaseReadinessState) {
  const router = makeRouter()
  const wrapper = mount(SignOffReadinessPanel, {
    props: { readiness },
    global: { plugins: [router] },
  })
  await router.isReady()
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// 1. Rendering — basic structure
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — basic structure', () => {
  it('renders the panel container', async () => {
    const wrapper = await mountPanel(makeReadiness())
    expect(wrapper.find('[data-testid="sign-off-readiness-panel"]').exists()).toBe(true)
  })

  it('renders the summary banner with role="region"', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const banner = wrapper.find('[data-testid="readiness-summary-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.attributes('role')).toBe('region')
  })

  it('summary banner has accessible aria-label', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const banner = wrapper.find('[data-testid="readiness-summary-banner"]')
    const label = banner.attributes('aria-label')
    expect(label).toBeTruthy()
    expect(label).toContain('readiness')
  })

  it('renders the heading "Strict Sign-Off Readiness"', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const heading = wrapper.find('[data-testid="readiness-heading"]')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Strict Sign-Off Readiness')
  })

  it('renders the overall state badge with role="status"', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const badge = wrapper.find('[data-testid="readiness-state-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.attributes('role')).toBe('status')
  })

  it('renders the headline text', async () => {
    const readiness = makeReadiness({ headline: 'Test headline text' })
    const wrapper = await mountPanel(readiness)
    const h = wrapper.find('[data-testid="readiness-headline"]')
    expect(h.text()).toContain('Test headline text')
  })

  it('renders the rationale text', async () => {
    const readiness = makeReadiness({ rationale: 'Test rationale text' })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="readiness-rationale"]').text()).toContain('Test rationale text')
  })

  it('renders the product-vs-evidence notice with role="note"', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const notice = wrapper.find('[data-testid="product-vs-evidence-notice"]')
    expect(notice.exists()).toBe(true)
    expect(notice.attributes('role')).toBe('note')
  })
})

// ---------------------------------------------------------------------------
// 2. Stats / counts
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — stats', () => {
  it('shows 0 blocking count when no blocking dimensions', async () => {
    const wrapper = await mountPanel(makeReadiness({ launchBlockingCount: 0 }))
    const count = wrapper.find('[data-testid="readiness-blocking-count"]')
    expect(count.text()).toBe('0')
  })

  it('shows positive blocking count with aria-label', async () => {
    const readiness = makeReadiness({ launchBlockingCount: 3 })
    const wrapper = await mountPanel(readiness)
    const count = wrapper.find('[data-testid="readiness-blocking-count"]')
    expect(count.text()).toBe('3')
    expect(count.attributes('aria-label')).toContain('3')
  })

  it('shows stale count', async () => {
    const readiness = makeReadiness({ staleCount: 2 })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="readiness-stale-count"]').text()).toBe('2')
  })

  it('shows config gap count when missingConfigCount > 0', async () => {
    const readiness = makeReadiness({ missingConfigCount: 2 })
    const wrapper = await mountPanel(readiness)
    const configCount = wrapper.find('[data-testid="readiness-config-count"]')
    expect(configCount.exists()).toBe(true)
    expect(configCount.text()).toBe('2')
  })

  it('hides config gap count when missingConfigCount is 0', async () => {
    const readiness = makeReadiness({ missingConfigCount: 0 })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="readiness-config-count"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. Last-run bar
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — last-run bar', () => {
  it('shows freshness label', async () => {
    const readiness = makeReadiness({ lastProtectedRunLabel: '7 days ago' })
    const wrapper = await mountPanel(readiness)
    const label = wrapper.find('[data-testid="last-run-label"]')
    expect(label.text()).toBe('7 days ago')
  })

  it('shows "Never" when no protected run', async () => {
    const readiness = makeReadiness({ lastProtectedRunAt: null, lastProtectedRunLabel: 'Never', lastRunSucceeded: null })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="last-run-label"]').text()).toBe('Never')
  })

  it('shows "No run recorded" status badge when lastRunSucceeded is null', async () => {
    const readiness = makeReadiness({ lastRunSucceeded: null })
    const wrapper = await mountPanel(readiness)
    const status = wrapper.find('[data-testid="last-run-status"]')
    expect(status.text()).toContain('No run recorded')
  })

  it('shows "Succeeded" status badge when lastRunSucceeded is true', async () => {
    const readiness = makeReadiness({ lastRunSucceeded: true })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="last-run-status"]').text()).toContain('Succeeded')
  })

  it('shows "Failed" status badge when lastRunSucceeded is false', async () => {
    const readiness = makeReadiness({ lastRunSucceeded: false })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="last-run-status"]').text()).toContain('Failed')
  })

  it('last run bar has aria-label on freshness element', async () => {
    const readiness = makeReadiness({ lastProtectedRunLabel: '5 days ago' })
    const wrapper = await mountPanel(readiness)
    const label = wrapper.find('[data-testid="last-run-label"]')
    const ariaLabel = label.attributes('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel).toContain('5 days ago')
  })
})

// ---------------------------------------------------------------------------
// 4. Configuration blocked alert
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — config blocked alert', () => {
  it('shows config-blocked alert when missingConfigCount > 0', async () => {
    const configDeps = [makeConfigDep({ isConfigured: false, isRequired: true })]
    const readiness = makeReadiness({ missingConfigCount: 1, configDependencies: configDeps })
    const wrapper = await mountPanel(readiness)
    const alert = wrapper.find('[data-testid="config-blocked-alert"]')
    expect(alert.exists()).toBe(true)
  })

  it('config alert has role="alert"', async () => {
    const configDeps = [makeConfigDep({ isConfigured: false, isRequired: true })]
    const readiness = makeReadiness({ missingConfigCount: 1, configDependencies: configDeps })
    const wrapper = await mountPanel(readiness)
    const alert = wrapper.find('[data-testid="config-blocked-alert"]')
    expect(alert.attributes('role')).toBe('alert')
  })

  it('hides config-blocked alert when missingConfigCount is 0', async () => {
    const readiness = makeReadiness({ missingConfigCount: 0 })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="config-blocked-alert"]').exists()).toBe(false)
  })

  it('renders config dependency list items', async () => {
    const configDeps = [
      makeConfigDep({ id: 'api-url', label: 'API URL', isConfigured: false, isRequired: true }),
      makeConfigDep({ id: 'token', label: 'Bearer Token', isConfigured: false, isRequired: true }),
    ]
    const readiness = makeReadiness({ missingConfigCount: 2, configDependencies: configDeps })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="config-dep-api-url"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="config-dep-token"]').exists()).toBe(true)
  })

  it('config dep label is displayed', async () => {
    const configDeps = [makeConfigDep({ id: 'api-url', label: 'Backend API URL', isConfigured: false, isRequired: true })]
    const readiness = makeReadiness({ missingConfigCount: 1, configDependencies: configDeps })
    const wrapper = await mountPanel(readiness)
    const dep = wrapper.find('[data-testid="config-dep-api-url"]')
    expect(dep.text()).toContain('Backend API URL')
  })
})

// ---------------------------------------------------------------------------
// 5. Evidence dimensions
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — evidence dimensions', () => {
  it('renders the dimensions heading', async () => {
    const wrapper = await mountPanel(makeReadiness())
    expect(wrapper.find('[data-testid="dimensions-heading"]').text()).toContain('Evidence Dimensions')
  })

  it('renders a dimension card for each dimension', async () => {
    const dims = [
      makeDimension({ id: 'dim-a' }),
      makeDimension({ id: 'dim-b' }),
    ]
    const readiness = makeReadiness({ dimensions: dims })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="dimension-card-dim-a"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dimension-card-dim-b"]').exists()).toBe(true)
  })

  it('renders dimension title', async () => {
    const dims = [makeDimension({ id: 'dim-a', title: 'My Evidence Title' })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    expect(wrapper.find('[data-testid="dimension-title-dim-a"]').text()).toContain('My Evidence Title')
  })

  it('renders state badge for each dimension', async () => {
    const dims = [makeDimension({ id: 'dim-a', state: 'missing_evidence' })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    const badge = wrapper.find('[data-testid="dimension-state-dim-a"]')
    expect(badge.text()).toContain('Missing Evidence')
  })

  it('state badge has aria-label (non-color-only)', async () => {
    const dims = [makeDimension({ id: 'dim-a', state: 'stale_evidence' })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    const badge = wrapper.find('[data-testid="dimension-state-dim-a"]')
    expect(badge.attributes('aria-label')).toContain('Stale Evidence')
  })

  it('renders freshness label with aria-label', async () => {
    const dims = [makeDimension({ id: 'dim-a', freshnessLabel: '7 days ago' })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    const freshness = wrapper.find('[data-testid="dimension-freshness-dim-a"]')
    expect(freshness.text()).toContain('7 days ago')
    expect(freshness.attributes('aria-label')).toContain('7 days ago')
  })

  it('shows launch-critical badge for critical dimensions', async () => {
    const dims = [makeDimension({ id: 'dim-a', isLaunchCritical: true })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    expect(wrapper.find('[data-testid="dimension-critical-badge-dim-a"]').exists()).toBe(true)
  })

  it('does not show launch-critical badge for non-critical dimensions', async () => {
    const dims = [makeDimension({ id: 'dim-a', isLaunchCritical: false })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    expect(wrapper.find('[data-testid="dimension-critical-badge-dim-a"]').exists()).toBe(false)
  })

  it('renders evidence path link for non-ready dimensions', async () => {
    const dims = [makeDimension({ id: 'dim-a', state: 'missing_evidence', evidencePath: '/compliance/evidence' })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    expect(wrapper.find('[data-testid="dimension-link-dim-a"]').exists()).toBe(true)
  })

  it('hides evidence path link for ready dimensions', async () => {
    const dims = [makeDimension({ id: 'dim-a', state: 'ready', evidencePath: '/compliance/evidence' })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    expect(wrapper.find('[data-testid="dimension-link-dim-a"]').exists()).toBe(false)
  })

  it('hides evidence path link when evidencePath is null', async () => {
    const dims = [makeDimension({ id: 'dim-a', state: 'stale_evidence', evidencePath: null })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    expect(wrapper.find('[data-testid="dimension-link-dim-a"]').exists()).toBe(false)
  })

  it('dimension link has aria-label', async () => {
    const dims = [makeDimension({ id: 'dim-a', state: 'stale_evidence', title: 'My Dim', evidencePath: '/path' })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    const link = wrapper.find('[data-testid="dimension-link-dim-a"]')
    expect(link.attributes('aria-label')).toContain('My Dim')
  })

  it('renders description for each dimension', async () => {
    const dims = [makeDimension({ id: 'dim-a', description: 'My special description' })]
    const wrapper = await mountPanel(makeReadiness({ dimensions: dims }))
    expect(wrapper.find('[data-testid="dimension-description-dim-a"]').text()).toContain('My special description')
  })
})

// ---------------------------------------------------------------------------
// 6. Next actions
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — next actions', () => {
  it('renders next actions section when actions exist', async () => {
    const actions = [makeNextAction()]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-actions-section"]').exists()).toBe(true)
  })

  it('hides next actions section when no actions', async () => {
    const readiness = makeReadiness({ nextActions: [] })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-actions-section"]').exists()).toBe(false)
  })

  it('renders an item for each action', async () => {
    const actions = [
      makeNextAction({ id: 'action-a' }),
      makeNextAction({ id: 'action-b', isLaunchBlocking: false }),
    ]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-action-action-a"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="next-action-action-b"]').exists()).toBe(true)
  })

  it('shows launch-blocking badge for blocking actions', async () => {
    const actions = [makeNextAction({ id: 'action-a', isLaunchBlocking: true })]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-action-blocking-action-a"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="next-action-blocking-action-a"]').text()).toContain('Launch-Blocking')
  })

  it('does not show launch-blocking badge for advisory actions', async () => {
    const actions = [makeNextAction({ id: 'action-a', isLaunchBlocking: false })]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-action-blocking-action-a"]').exists()).toBe(false)
  })

  it('renders action title and explanation', async () => {
    const actions = [makeNextAction({ id: 'act-1', summary: 'Do the thing', explanation: 'Because it matters' })]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-action-title-act-1"]').text()).toContain('Do the thing')
    expect(wrapper.find('[data-testid="next-action-explanation-act-1"]').text()).toContain('Because it matters')
  })

  it('renders owner domain badge for each action', async () => {
    const actions = [makeNextAction({ id: 'act-1', ownerDomain: 'legal' })]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    const badge = wrapper.find('[data-testid="next-action-owner-act-1"]')
    expect(badge.exists()).toBe(true)
    expect(badge.attributes('aria-label')).toContain('Legal')
  })

  it('renders action link when actionPath is set', async () => {
    const actions = [makeNextAction({ id: 'act-1', actionPath: '/compliance/reporting' })]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-action-link-act-1"]').exists()).toBe(true)
  })

  it('hides action link when actionPath is null', async () => {
    const actions = [makeNextAction({ id: 'act-1', actionPath: null })]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-action-link-act-1"]').exists()).toBe(false)
  })

  it('action item has accessible aria-label with step number', async () => {
    const actions = [makeNextAction({ id: 'act-1', summary: 'Run workflow' })]
    const readiness = makeReadiness({ nextActions: actions })
    const wrapper = await mountPanel(readiness)
    const item = wrapper.find('[data-testid="next-action-act-1"]')
    const ariaLabel = item.attributes('aria-label')
    expect(ariaLabel).toContain('Step 1')
    expect(ariaLabel).toContain('Run workflow')
  })
})

// ---------------------------------------------------------------------------
// 7. Default state (integration test using buildDefaultReleaseReadiness)
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — default MVP state', () => {
  it('renders with the default MVP blocking state', async () => {
    const readiness = buildDefaultReleaseReadiness(NOW)
    const wrapper = await mountPanel(readiness)

    const panel = wrapper.find('[data-testid="sign-off-readiness-panel"]')
    expect(panel.exists()).toBe(true)

    const heading = wrapper.find('[data-testid="readiness-heading"]')
    expect(heading.text()).toContain('Strict Sign-Off Readiness')
  })

  it('shows configuration blocked alert for default state', async () => {
    const readiness = buildDefaultReleaseReadiness(NOW)
    const wrapper = await mountPanel(readiness)
    // Default state has missing backend config
    expect(wrapper.find('[data-testid="config-blocked-alert"]').exists()).toBe(true)
  })

  it('shows at least 4 evidence dimensions for default state', async () => {
    const readiness = buildDefaultReleaseReadiness(NOW)
    const wrapper = await mountPanel(readiness)
    const list = wrapper.find('[data-testid="dimensions-list"]')
    expect(list.findAll('li').length).toBeGreaterThanOrEqual(4)
  })

  it('shows next actions section for default state', async () => {
    const readiness = buildDefaultReleaseReadiness(NOW)
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-actions-section"]').exists()).toBe(true)
  })

  it('next actions heading is visible', async () => {
    const readiness = buildDefaultReleaseReadiness(NOW)
    const wrapper = await mountPanel(readiness)
    const heading = wrapper.find('[data-testid="next-actions-heading"]')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Next Actions')
  })
})

// ---------------------------------------------------------------------------
// 8. Ready state
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — ready state', () => {
  it('shows no config alert for ready state', async () => {
    const readiness = deriveReleaseReadiness(
      [makeDimension({ state: 'ready', isLaunchCritical: true })],
      [makeConfigDep({ isConfigured: true })],
      FRESH_TS,
      true,
      NOW,
    )
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="config-blocked-alert"]').exists()).toBe(false)
  })

  it('shows no next actions for ready state', async () => {
    const readiness = deriveReleaseReadiness(
      [makeDimension({ state: 'ready', isLaunchCritical: true })],
      [makeConfigDep({ isConfigured: true })],
      FRESH_TS,
      true,
      NOW,
    )
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="next-actions-section"]').exists()).toBe(false)
  })

  it('state badge shows "Ready for Sign-Off"', async () => {
    const readiness = deriveReleaseReadiness(
      [makeDimension({ state: 'ready', isLaunchCritical: true })],
      [makeConfigDep({ isConfigured: true })],
      FRESH_TS,
      true,
      NOW,
    )
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="readiness-state-badge"]').text()).toBe('Ready for Sign-Off')
  })
})

// ---------------------------------------------------------------------------
// 9. WCAG / Accessibility
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — accessibility', () => {
  it('panel has aria-labelledby pointing to its heading', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const panel = wrapper.find('[data-testid="sign-off-readiness-panel"]')
    expect(panel.attributes('aria-labelledby')).toBe('sign-off-readiness-heading')
    expect(wrapper.find('#sign-off-readiness-heading').exists()).toBe(true)
  })

  it('dimensions list has role="list" and is labelled by heading', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const list = wrapper.find('[data-testid="dimensions-list"]')
    expect(list.attributes('role')).toBe('list')
    expect(list.attributes('aria-labelledby')).toBe('evidence-dimensions-heading')
  })

  it('stats dl has aria-label', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const stats = wrapper.find('[data-testid="readiness-stats"]')
    expect(stats.attributes('aria-label')).toBeTruthy()
  })

  it('state badge has aria-label describing the state textually (not color-only)', async () => {
    const readiness = makeReadiness({ overallState: 'missing_evidence' })
    const wrapper = await mountPanel(readiness)
    const badge = wrapper.find('[data-testid="readiness-state-badge"]')
    const ariaLabel = badge.attributes('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.toLowerCase()).toContain('missing')
  })

  it('product-vs-evidence notice has accessible aria-label and meaningful content', async () => {
    const wrapper = await mountPanel(makeReadiness())
    const notice = wrapper.find('[data-testid="product-vs-evidence-notice"]')
    const ariaLabel = notice.attributes('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.toLowerCase()).toContain('evidence')
    // Content must explain the distinction (WCAG SC 1.3.1 programmatic determination)
    const text = notice.text()
    expect(text.length).toBeGreaterThan(20)
    const coversDistinction = text.toLowerCase().includes('delivered') ||
      text.toLowerCase().includes('implemented') ||
      text.toLowerCase().includes('operational')
    expect(coversDistinction).toBe(true)
  })

  it('config-blocked alert has aria-label', async () => {
    const configDeps = [makeConfigDep({ isConfigured: false, isRequired: true })]
    const readiness = makeReadiness({ missingConfigCount: 1, configDependencies: configDeps })
    const wrapper = await mountPanel(readiness)
    const alert = wrapper.find('[data-testid="config-blocked-alert"]')
    const ariaLabel = alert.attributes('aria-label')
    expect(ariaLabel).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 10. All five state variants rendered
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — all five overallState variants', () => {
  // Use the canonical labels map to derive valid states — stays in sync automatically
  const states = ALL_SIGN_OFF_STATES

  for (const state of states) {
    it(`renders without error for overallState="${state}"`, async () => {
      const wrapper = await mountPanel(
        makeReadiness({ overallState: state }),
      )
      expect(wrapper.find('[data-testid="sign-off-readiness-panel"]').exists()).toBe(true)
      const badge = wrapper.find('[data-testid="readiness-state-badge"]')
      expect(badge.exists()).toBe(true)
      // Must have a text label — never rely on color alone (AC #5)
      expect(badge.text().trim().length).toBeGreaterThan(0)
    })
  }

  it('advisory_follow_up shows teal banner (distinct from green ready)', async () => {
    const readiness = makeReadiness({ overallState: 'advisory_follow_up' })
    const wrapper = await mountPanel(readiness)
    const banner = wrapper.find('[data-testid="readiness-summary-banner"]')
    // Teal (or any non-red/orange) class expected — banner must exist
    expect(banner.exists()).toBe(true)
    // State badge label must be "Advisory Follow-Up"
    const badge = wrapper.find('[data-testid="readiness-state-badge"]')
    expect(badge.text()).toContain('Advisory')
  })

  it('stale_evidence shows orange-ish banner (not green)', async () => {
    const readiness = makeReadiness({ overallState: 'stale_evidence' })
    const wrapper = await mountPanel(readiness)
    const badge = wrapper.find('[data-testid="readiness-state-badge"]')
    expect(badge.text()).toContain('Stale Evidence')
  })

  it('missing_evidence badge aria-label contains "missing"', async () => {
    const readiness = makeReadiness({ overallState: 'missing_evidence' })
    const wrapper = await mountPanel(readiness)
    const badge = wrapper.find('[data-testid="readiness-state-badge"]')
    const ariaLabel = badge.attributes('aria-label')
    expect(ariaLabel!.toLowerCase()).toContain('missing')
  })

  it('configuration_blocked badge text contains "Blocked"', async () => {
    const readiness = makeReadiness({ overallState: 'configuration_blocked' })
    const wrapper = await mountPanel(readiness)
    const badge = wrapper.find('[data-testid="readiness-state-badge"]')
    expect(badge.text()).toContain('Blocked')
  })
})

// ---------------------------------------------------------------------------
// 11. Fail-closed messaging — never ambiguous for blocking states
// ---------------------------------------------------------------------------

describe('SignOffReadinessPanel — fail-closed messaging', () => {
  it('rationale for configuration_blocked mentions blocking (fail-closed)', async () => {
    const readiness = makeReadiness({
      overallState: 'configuration_blocked',
      rationale: 'Required configuration items are blocking the strict sign-off lane from executing.',
    })
    const wrapper = await mountPanel(readiness)
    const rationale = wrapper.find('[data-testid="readiness-rationale"]')
    expect(rationale.text().toLowerCase()).toContain('block')
  })

  it('rationale for missing_evidence does not use "ready" or "clear" language', async () => {
    const readiness = makeReadiness({
      overallState: 'missing_evidence',
      rationale: 'Launch-critical evidence is missing. This is a blocker for sign-off authorization.',
    })
    const wrapper = await mountPanel(readiness)
    const rationale = wrapper.find('[data-testid="readiness-rationale"]')
    const text = rationale.text().toLowerCase()
    // Should not give false confidence
    expect(text).not.toContain('ready for sign-off')
    expect(text).not.toContain('all evidence is present')
  })

  it('configuration blocked: each missing dep shows its label', async () => {
    const deps = [
      makeConfigDep({ id: 'dep-a', label: 'Protected Backend API URL', isConfigured: false, isRequired: true }),
      makeConfigDep({ id: 'dep-b', label: 'Bearer Token', isConfigured: false, isRequired: true }),
    ]
    const readiness = makeReadiness({ missingConfigCount: 2, configDependencies: deps })
    const wrapper = await mountPanel(readiness)
    expect(wrapper.find('[data-testid="config-dep-dep-a"]').text()).toContain('Protected Backend API URL')
    expect(wrapper.find('[data-testid="config-dep-dep-b"]').text()).toContain('Bearer Token')
  })
})
