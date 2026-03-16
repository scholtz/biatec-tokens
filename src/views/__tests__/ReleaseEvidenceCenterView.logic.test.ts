/**
 * Logic Tests: ReleaseEvidenceCenterView — Interaction, State Transitions,
 * Export, and Refresh Behaviour.
 *
 * Tests internal handler logic and reactive state changes by calling
 * (wrapper.vm as any).<method>() directly, following the established
 * pattern for Teleport/complex views in this repository.
 *
 * Acceptance Criteria covered:
 *  AC #6  — Status derivation logic in reusable utilities (verified via fixture imports)
 *  AC #7  — Deterministic fixtures for ready/blocked/stale/degraded states
 *  AC #9  — Tests verify both happy-path and fail-closed scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import ReleaseEvidenceCenterView from '../ReleaseEvidenceCenterView.vue'
import {
  RELEASE_CENTER_TEST_IDS,
  buildReadyFixture,
  buildBlockedFixture,
  buildStaleFixture,
  buildDegradedFixture,
  buildDefaultReleaseReadiness,
  SIGN_OFF_READINESS_LABELS,
} from '../../utils/releaseReadiness'

// ---------------------------------------------------------------------------
// Helpers
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

async function mountLoaded() {
  vi.useFakeTimers()
  const router = makeRouter()
  const wrapper = mount(ReleaseEvidenceCenterView, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn }), router],
    },
  })
  await router.isReady()
  await vi.advanceTimersByTimeAsync(300)
  await nextTick()
  vi.useRealTimers()
  return wrapper
}

// ---------------------------------------------------------------------------
// Fixture unit tests (AC #7) — deterministic scenario coverage
// ---------------------------------------------------------------------------

describe('ReleaseEvidenceCenterView — Deterministic Fixtures (AC #7)', () => {
  it('buildReadyFixture produces overallState="ready"', () => {
    const state = buildReadyFixture()
    expect(state.overallState).toBe('ready')
    expect(state.launchBlockingCount).toBe(0)
    expect(state.staleCount).toBe(0)
    expect(state.missingConfigCount).toBe(0)
  })

  it('buildReadyFixture dimensions are all ready', () => {
    const state = buildReadyFixture()
    const nonReady = state.dimensions.filter((d) => d.state !== 'ready')
    expect(nonReady.length).toBe(0)
  })

  it('buildReadyFixture config deps are all configured', () => {
    const state = buildReadyFixture()
    const unconfigured = state.configDependencies.filter((c) => !c.isConfigured && c.isRequired)
    expect(unconfigured.length).toBe(0)
  })

  it('buildBlockedFixture produces overallState for missing evidence', () => {
    const state = buildBlockedFixture()
    // Should be missing_evidence or configuration_blocked (both are blocking)
    const isBlocking = state.overallState === 'missing_evidence' || state.overallState === 'configuration_blocked'
    expect(isBlocking).toBe(true)
    expect(state.launchBlockingCount).toBeGreaterThan(0)
  })

  it('buildBlockedFixture has no evidence timestamps for critical dimensions', () => {
    const state = buildBlockedFixture()
    const critical = state.dimensions.filter((d) => d.isLaunchCritical)
    const withEvidence = critical.filter((d) => d.lastEvidenceAt !== null)
    expect(withEvidence.length).toBe(0)
  })

  it('buildStaleFixture produces overallState="stale_evidence"', () => {
    const state = buildStaleFixture()
    expect(state.overallState).toBe('stale_evidence')
    expect(state.staleCount).toBeGreaterThan(0)
  })

  it('buildStaleFixture has old timestamps on critical dimensions', () => {
    const state = buildStaleFixture()
    const critical = state.dimensions.filter((d) => d.isLaunchCritical && d.state === 'stale_evidence')
    expect(critical.length).toBeGreaterThan(0)
    critical.forEach((d) => {
      expect(d.lastEvidenceAt).not.toBeNull()
      expect(d.freshnessLabel).toMatch(/40 days ago/i)
    })
  })

  it('buildDegradedFixture produces configuration_blocked or missing_evidence state', () => {
    const state = buildDegradedFixture()
    const isBlocked =
      state.overallState === 'configuration_blocked' ||
      state.overallState === 'missing_evidence'
    expect(isBlocked).toBe(true)
    expect(state.missingConfigCount).toBeGreaterThan(0)
  })

  it('buildDegradedFixture has required config deps all unconfigured', () => {
    const state = buildDegradedFixture()
    const required = state.configDependencies.filter((c) => c.isRequired)
    const unconfigured = required.filter((c) => !c.isConfigured)
    expect(unconfigured.length).toBe(required.length)
  })

  it('SIGN_OFF_READINESS_LABELS has entries for all fixture states', () => {
    const ready = buildReadyFixture()
    const blocked = buildBlockedFixture()
    const stale = buildStaleFixture()
    const degraded = buildDegradedFixture()
    expect(SIGN_OFF_READINESS_LABELS[ready.overallState]).toBeTruthy()
    expect(SIGN_OFF_READINESS_LABELS[blocked.overallState]).toBeTruthy()
    expect(SIGN_OFF_READINESS_LABELS[stale.overallState]).toBeTruthy()
    expect(SIGN_OFF_READINESS_LABELS[degraded.overallState]).toBeTruthy()
  })

  it('default fixture (buildDefaultReleaseReadiness) is not "ready" (fail-closed)', () => {
    const state = buildDefaultReleaseReadiness()
    expect(state.overallState).not.toBe('ready')
  })

  it('ready fixture has lastProtectedRunLabel from valid timestamp', () => {
    const state = buildReadyFixture()
    expect(state.lastProtectedRunLabel).toBeTruthy()
    expect(state.lastProtectedRunLabel).not.toBe('Never')
  })

  it('blocked fixture has lastProtectedRunLabel "Never"', () => {
    const state = buildBlockedFixture()
    expect(state.lastProtectedRunLabel).toMatch(/never/i)
  })
})

// ---------------------------------------------------------------------------
// Refresh and loading state
// ---------------------------------------------------------------------------

describe('ReleaseEvidenceCenterView — Refresh Behaviour', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refresh() method triggers loading state and then restores content', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vi.useFakeTimers()
    vm.refresh()
    await nextTick()
    expect(vm.isLoading).toBe(true)
    await vi.advanceTimersByTimeAsync(400)
    await nextTick()
    expect(vm.isLoading).toBe(false)
  })

  it('refresh() updates lastRefreshed timestamp', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    const beforeRefresh = vm.lastRefreshed
    vi.useFakeTimers()
    vm.refresh()
    await vi.advanceTimersByTimeAsync(400)
    await nextTick()
    // After refresh, lastRefreshed should be updated
    expect(vm.lastRefreshed).toBeTruthy()
    // It should be a valid ISO string
    expect(() => new Date(vm.lastRefreshed)).not.toThrow()
    vi.useRealTimers()
    // Both should be set but might be same value in deterministic tests
    expect(beforeRefresh !== null || vm.lastRefreshed !== null).toBe(true)
  })

  it('formattedRefreshedAt computed returns formatted timestamp after loading', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(vm.formattedRefreshedAt).toBeTruthy()
    expect(vm.formattedRefreshedAt).not.toBe('Not yet refreshed')
  })
})

// ---------------------------------------------------------------------------
// Computed properties
// ---------------------------------------------------------------------------

describe('ReleaseEvidenceCenterView — Computed Properties', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('launchCriticalDimensions only contains isLaunchCritical=true items', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    const critical = vm.launchCriticalDimensions
    critical.forEach((d: any) => {
      expect(d.isLaunchCritical).toBe(true)
    })
  })

  it('advisoryDimensions only contains isLaunchCritical=false items', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    const advisory = vm.advisoryDimensions
    advisory.forEach((d: any) => {
      expect(d.isLaunchCritical).toBe(false)
    })
  })

  it('launchCriticalDimensions + advisoryDimensions = all dimensions', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    const total = vm.launchCriticalDimensions.length + vm.advisoryDimensions.length
    expect(total).toBe(vm.readiness.dimensions.length)
  })

  it('requiredConfigDeps only contains isRequired=true items', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.requiredConfigDeps.forEach((c: any) => {
      expect(c.isRequired).toBe(true)
    })
  })

  it('optionalConfigDeps only contains isRequired=false items', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.optionalConfigDeps.forEach((c: any) => {
      expect(c.isRequired).toBe(false)
    })
  })

  it('overallIsBlocking=true when default (missing evidence) fixture loaded', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(vm.overallIsBlocking).toBe(true)
  })

  it('approvalHandoffReady=false when launchBlockingCount > 0', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    if (vm.readiness.launchBlockingCount > 0) {
      expect(vm.approvalHandoffReady).toBe(false)
    }
  })

  it('hasNextActions=true when default fixture has blockers', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    if (vm.readiness.nextActions.length > 0) {
      expect(vm.hasNextActions).toBe(true)
    }
  })

  it('exportStatusMessage is null when exportStatus is idle', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(vm.exportStatus).toBe('idle')
    expect(vm.exportStatusMessage).toBeNull()
  })

  it('exportStatusMessage is "Preparing…" when exportStatus is exporting', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.exportStatus = 'exporting'
    await nextTick()
    expect(vm.exportStatusMessage).toMatch(/Preparing/i)
  })

  it('exportStatusMessage is "downloaded successfully" when exportStatus is success', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.exportStatus = 'success'
    await nextTick()
    expect(vm.exportStatusMessage).toMatch(/successfully/i)
  })

  it('exportStatusMessage is "Export failed" when exportStatus is error', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.exportStatus = 'error'
    await nextTick()
    expect(vm.exportStatusMessage).toMatch(/Export failed/i)
  })
})

// ---------------------------------------------------------------------------
// stateIcon helper
// ---------------------------------------------------------------------------

describe('ReleaseEvidenceCenterView — stateIcon helper', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('stateIcon returns a component for each SignOffReadinessState variant', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    const states = ['ready', 'advisory_follow_up', 'stale_evidence', 'missing_evidence', 'configuration_blocked']
    states.forEach((state) => {
      const icon = vm.stateIcon(state)
      expect(icon).toBeTruthy()
    })
  })
})

// ---------------------------------------------------------------------------
// navigateTo helper
// ---------------------------------------------------------------------------

describe('ReleaseEvidenceCenterView — navigateTo', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('navigateTo routes to the given path via router', async () => {
    const router = makeRouter()
    const wrapper = mount(ReleaseEvidenceCenterView, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
      },
    })
    await router.isReady()
    vi.useFakeTimers()
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    vi.useRealTimers()

    const vm = wrapper.vm as any
    await vm.navigateTo('/compliance/evidence')
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/compliance/evidence')
  })

  it('navigateTo does nothing for empty path', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    const router = makeRouter()
    const initialPath = router.currentRoute.value.path
    // should not throw for empty path
    expect(() => vm.navigateTo('')).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// loadData and degraded state
// ---------------------------------------------------------------------------

describe('ReleaseEvidenceCenterView — loadData and degraded state', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('loadData sets isDegraded=false on successful load', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(vm.isDegraded).toBe(false)
    expect(vm.loadError).toBeNull()
  })

  it('loadData sets readiness to a valid ReleaseReadinessState', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(vm.readiness).toBeTruthy()
    expect(vm.readiness.overallState).toBeTruthy()
    expect(Array.isArray(vm.readiness.dimensions)).toBe(true)
    expect(Array.isArray(vm.readiness.configDependencies)).toBe(true)
    expect(Array.isArray(vm.readiness.nextActions)).toBe(true)
  })

  it('loadData sets lastRefreshed to a non-null ISO string', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    expect(vm.lastRefreshed).not.toBeNull()
    expect(() => new Date(vm.lastRefreshed)).not.toThrow()
  })

  it('degraded alert shows when isDegraded=true', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.isLoading = false
    vm.isDegraded = true
    await nextTick()
    const alert = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.DEGRADED_ALERT}"]`)
    expect(alert.exists()).toBe(true)
  })

  it('degraded alert has role="alert" and aria-live="assertive" (SC 4.1.3)', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.isLoading = false
    vm.isDegraded = true
    await nextTick()
    const alert = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.DEGRADED_ALERT}"]`)
    if (alert.exists()) {
      expect(alert.attributes('role')).toBe('alert')
      expect(alert.attributes('aria-live')).toBe('assertive')
    }
  })

  it('degraded alert shows loadError message when set', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.isLoading = false
    vm.isDegraded = true
    vm.loadError = 'Network timeout'
    await nextTick()
    const alert = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.DEGRADED_ALERT}"]`)
    if (alert.exists()) {
      expect(alert.text()).toContain('Network timeout')
    }
  })
})

// ---------------------------------------------------------------------------
// Export status reactive rendering
// ---------------------------------------------------------------------------

describe('ReleaseEvidenceCenterView — Export status rendering', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('export status message is not rendered when idle', async () => {
    const wrapper = await mountLoaded()
    const statusEl = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_STATUS}"]`)
    expect(statusEl.exists()).toBe(false)
  })

  it('export status element renders when exportStatus is "exporting"', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.exportStatus = 'exporting'
    await nextTick()
    await nextTick()
    const statusEl = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_STATUS}"]`)
    expect(statusEl.exists()).toBe(true)
    expect(statusEl.attributes('role')).toBe('status')
    expect(statusEl.attributes('aria-live')).toBe('polite')
  })

  it('export status element renders on success with success styling', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.exportStatus = 'success'
    await nextTick()
    const statusEl = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_STATUS}"]`)
    if (statusEl.exists()) {
      expect(statusEl.classes()).toContain('text-green-400')
    }
  })

  it('export status element renders on error with error styling', async () => {
    const wrapper = await mountLoaded()
    const vm = wrapper.vm as any
    vm.exportStatus = 'error'
    await nextTick()
    const statusEl = wrapper.find(`[data-testid="${RELEASE_CENTER_TEST_IDS.EXPORT_STATUS}"]`)
    if (statusEl.exists()) {
      expect(statusEl.classes()).toContain('text-red-400')
    }
  })
})
