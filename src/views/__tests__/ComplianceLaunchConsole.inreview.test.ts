/**
 * Unit tests: ComplianceLaunchConsole — in_review gate state and error-catch branches
 *
 * These branches (lines 452, 465, 471, 485) are logically unreachable from the
 * current Pinia store because calculateReadiness always produces either
 * (isReadyForDeploy=true, blockers=[]) OR (isReadyForDeploy=false, blockers.length>0).
 * The in_review gate (isReadyForDeploy=false AND blockers.length=0) is defensive
 * forward-compatibility code for future API-driven assessment sources.
 *
 * To test these paths we mock deriveReadinessModel at the module level so
 * ComplianceLaunchConsole receives the exact gate state we need.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'

// ---------------------------------------------------------------------------
// Module-level mock: override deriveReadinessModel before importing the view
// ---------------------------------------------------------------------------
vi.mock('../../utils/complianceLaunchReadiness', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    // Will be replaced per-test via vi.mocked(deriveReadinessModel).mockReturnValue
    deriveReadinessModel: vi.fn(),
  }
})

// Imports after mock declaration (vitest hoists vi.mock calls automatically)
import ComplianceLaunchConsole from '../ComplianceLaunchConsole.vue'
import { deriveReadinessModel } from '../../utils/complianceLaunchReadiness'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/compliance/launch', name: 'ComplianceLaunchConsole', component: { template: '<div />' } },
      { path: '/compliance/setup', name: 'ComplianceSetupWorkspace', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div />' } },
    ],
  })

/** Builds a minimal ReadinessModel stub */
function makeReadinessStub(overrides: Partial<{
  gate: string
  primaryAction: string
  totalBlockers: number
  readinessScore: number
  isReadyForDeploy: boolean
  lastChecked: Date | null
}> = {}) {
  return {
    gate: 'in_review',
    primaryAction: 'resolve_blockers',
    domains: [],
    totalBlockers: 0,
    readinessScore: 50,
    isReadyForDeploy: false,
    lastChecked: new Date(),
    ...overrides,
  } as any
}

const mountConsole = () => {
  const router = makeRouter()
  const wrapper = mount(ComplianceLaunchConsole, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
    },
  })
  return { wrapper, router }
}

// ---------------------------------------------------------------------------
// in_review gate state (lines 465, 471, 485)
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — in_review gate branches', () => {
  beforeEach(() => {
    vi.mocked(deriveReadinessModel).mockReturnValue(makeReadinessStub())
  })

  it('renders in_review gate description (line 465)', async () => {
    const { wrapper } = mountConsole()
    await nextTick()
    const description = wrapper.find('[data-testid="gate-state-description"]')
    expect(description.exists()).toBe(true)
    expect(description.text()).toMatch(/Review in progress|complete remaining domains/i)
  })

  it('bannerBorderClass returns yellow border for in_review gate (line 485)', async () => {
    const { wrapper } = mountConsole()
    await nextTick()
    const banner = wrapper.find('[data-testid="readiness-banner"]')
    expect(banner.exists()).toBe(true)
    // The banner should have the yellow border class for in_review
    expect(banner.classes().join(' ')).toMatch(/yellow|in_review/)
  })

  it('default case in gateStateDescription returns empty string (line 471)', async () => {
    // Force an unknown gate value (reaches the default: return '' branch)
    vi.mocked(deriveReadinessModel).mockReturnValue(makeReadinessStub({ gate: 'unknown_future_state' as any }))
    const { wrapper } = mountConsole()
    await nextTick()
    const description = wrapper.find('[data-testid="gate-state-description"]')
    // When gate is unknown, description renders empty string (no text)
    expect(description.text()).toBe('')
  })

  it('bannerBorderClass returns default border for unknown gate (lines 486-487)', async () => {
    vi.mocked(deriveReadinessModel).mockReturnValue(makeReadinessStub({ gate: 'unknown_future_state' as any }))
    const { wrapper } = mountConsole()
    await nextTick()
    const banner = wrapper.find('[data-testid="readiness-banner"]')
    expect(banner.exists()).toBe(true)
    // Default border class (border-white/10) applied when gate is unknown
    const html = wrapper.html()
    expect(html).toContain('border-white')
  })
})

// ---------------------------------------------------------------------------
// Error catch in formattedLastChecked (line 452)
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — formattedLastChecked error catch (line 452)', () => {
  it('returns "—" when lastChecked.toLocaleTimeString throws (line 452)', async () => {
    // Create a Date-like object whose toLocaleTimeString throws
    const badDate = {
      toLocaleTimeString: () => { throw new Error('Intl format error') },
    }
    vi.mocked(deriveReadinessModel).mockReturnValue(
      makeReadinessStub({ lastChecked: badDate as unknown as Date }),
    )
    const { wrapper } = mountConsole()
    await nextTick()
    // The view renders formattedLastChecked; error catch returns '—'
    const html = wrapper.html()
    // The fallback dash should appear in the header timestamp area
    expect(html).toContain('—')
  })
})

// ---------------------------------------------------------------------------
// in_review gate: primary CTA renders "Resolve Blockers"
// ---------------------------------------------------------------------------

describe('ComplianceLaunchConsole — in_review CTA rendering', () => {
  beforeEach(() => {
    vi.mocked(deriveReadinessModel).mockReturnValue(makeReadinessStub())
  })

  it('shows primary CTA (not launch-token) when gate is in_review', async () => {
    const { wrapper } = mountConsole()
    await nextTick()
    const launchBtn = wrapper.find('[data-testid="launch-token-button"]')
    const primaryBtn = wrapper.find('[data-testid="primary-cta-button"]')
    // in_review produces primaryAction='resolve_blockers' → primary-cta shown
    expect(launchBtn.exists()).toBe(false)
    expect(primaryBtn.exists()).toBe(true)
  })

  it('gate state label shows in_review label when gate is in_review', async () => {
    const { wrapper } = mountConsole()
    await nextTick()
    const html = wrapper.html()
    // GATE_STATE_LABELS.in_review = 'In Review' (or similar)
    expect(html).toMatch(/In Review|in.?review|In.?Progress/i)
  })
})
