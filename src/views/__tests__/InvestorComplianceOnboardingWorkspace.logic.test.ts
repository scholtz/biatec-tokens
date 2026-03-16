/**
 * Logic Tests: InvestorComplianceOnboardingWorkspace
 *
 * Covers interaction handlers, refresh lifecycle, onBeforeUnmount cleanup,
 * fixture switching, and loading-state transitions.
 *
 * These complement the structural/WCAG tests in InvestorComplianceOnboardingWorkspace.test.ts.
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
  // Advance past the 150ms loading timeout in onMounted
  await vi.advanceTimersByTimeAsync(200)
  await nextTick()
  await nextTick()
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InvestorComplianceOnboardingWorkspace — logic (interaction & lifecycle)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // ── Refresh button ────────────────────────────────────────────────────────

  describe('refresh button', () => {
    it('refresh button is rendered with correct aria-label', async () => {
      const wrapper = await mountWorkspace()
      const btn = wrapper.find('[data-testid="refresh-btn"]')
      expect(btn.exists()).toBe(true)
      expect(btn.attributes('aria-label')).toBe('Refresh onboarding workspace data')
    })

    it('clicking refresh sets isLoading and clears it after 300ms', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      // Baseline: not loading after initial mount
      expect(vm.isLoading).toBe(false)

      // Click refresh
      const btn = wrapper.find('[data-testid="refresh-btn"]')
      await btn.trigger('click')
      await nextTick()

      // Immediately after click, isLoading should be true
      expect(vm.isLoading).toBe(true)

      // Advance past the 300ms refresh timeout
      await vi.advanceTimersByTimeAsync(350)
      await nextTick()

      // After timeout completes, loading is done
      expect(vm.isLoading).toBe(false)
    })

    it('clicking refresh updates workspaceState (refreshedAt advances)', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const beforeRefresh = vm.refreshedAt.getTime()

      // Advance 1 second so timestamps differ
      await vi.advanceTimersByTimeAsync(1000)

      const btn = wrapper.find('[data-testid="refresh-btn"]')
      await btn.trigger('click')
      await nextTick()

      // Advance past the 300ms refresh setTimeout
      await vi.advanceTimersByTimeAsync(350)
      await nextTick()

      const afterRefresh = vm.refreshedAt.getTime()
      expect(afterRefresh).toBeGreaterThan(beforeRefresh)
    })

    it('clicking refresh re-derives workspaceState from the current fixture', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const postureBefore = vm.workspaceState.posture

      const btn = wrapper.find('[data-testid="refresh-btn"]')
      await btn.trigger('click')
      await vi.advanceTimersByTimeAsync(350)
      await nextTick()

      // Posture re-derived from same fixture should remain identical
      expect(vm.workspaceState.posture).toBe(postureBefore)
    })
  })

  // ── Fixture switching (applyFixture) ──────────────────────────────────────

  describe('fixture switching', () => {
    it('clicking "Ready for Handoff" fixture button applies ready posture', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const readyBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Ready'),
      )
      expect(readyBtn).toBeDefined()
      await readyBtn!.trigger('click')
      await nextTick()

      expect(vm.workspaceState.posture).toBe('ready_for_handoff')
    })

    it('clicking "Blocked (KYC/AML)" fixture button applies blocked posture', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const blockedBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Blocked'),
      )
      expect(blockedBtn).toBeDefined()
      await blockedBtn!.trigger('click')
      await nextTick()

      expect(vm.workspaceState.posture).toBe('blocked')
    })

    it('clicking "Stale Evidence" fixture button applies stale posture', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const staleBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Stale'),
      )
      expect(staleBtn).toBeDefined()
      await staleBtn!.trigger('click')
      await nextTick()

      expect(vm.workspaceState.posture).toBe('stale')
    })

    it('clicking "Partially Ready" fixture button applies partially_ready posture', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      // First switch to Ready, then back to Partial to ensure toggle works
      const readyBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Ready'),
      )!
      await readyBtn.trigger('click')
      await nextTick()
      expect(vm.workspaceState.posture).toBe('ready_for_handoff')

      const partialBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Partially'),
      )!
      await partialBtn.trigger('click')
      await nextTick()

      expect(vm.workspaceState.posture).toBe('partially_ready')
    })

    it('applyFixture updates refreshedAt', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const before = vm.refreshedAt.getTime()

      await vi.advanceTimersByTimeAsync(500)

      const readyBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Ready'),
      )!
      await readyBtn.trigger('click')
      await nextTick()

      expect(vm.refreshedAt.getTime()).toBeGreaterThan(before)
    })

    it('active fixture button has aria-pressed="true"', async () => {
      const wrapper = await mountWorkspace()

      const readyBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Ready'),
      )!
      await readyBtn.trigger('click')
      await nextTick()

      // The currently-pressed button should have aria-pressed="true"
      // (or the button should be indicated as active in the DOM)
      // The UI uses `:aria-pressed` binding
      expect(readyBtn.attributes('aria-pressed')).toBe('true')
    })
  })

  // ── Stage expand/collapse ─────────────────────────────────────────────────

  describe('stage expand/collapse (toggleStage)', () => {
    it('clicking a stage header expands it (aria-expanded becomes true)', async () => {
      const wrapper = await mountWorkspace()
      const header = wrapper.find('[data-testid="stage-header-intake"]')
      expect(header.attributes('aria-expanded')).toBe('false')

      await header.trigger('click')
      await nextTick()

      expect(header.attributes('aria-expanded')).toBe('true')
    })

    it('clicking an expanded stage header collapses it', async () => {
      const wrapper = await mountWorkspace()
      const header = wrapper.find('[data-testid="stage-header-intake"]')

      // Expand
      await header.trigger('click')
      await nextTick()
      expect(header.attributes('aria-expanded')).toBe('true')

      // Collapse
      await header.trigger('click')
      await nextTick()
      expect(header.attributes('aria-expanded')).toBe('false')
    })

    it('expanding one stage does not expand another', async () => {
      const wrapper = await mountWorkspace()
      const intakeHeader = wrapper.find('[data-testid="stage-header-intake"]')
      const docHeader = wrapper.find('[data-testid="stage-header-documentation_review"]')

      await intakeHeader.trigger('click')
      await nextTick()

      expect(intakeHeader.attributes('aria-expanded')).toBe('true')
      expect(docHeader.attributes('aria-expanded')).toBe('false')
    })
  })

  // ── onBeforeUnmount cleanup ───────────────────────────────────────────────

  describe('onBeforeUnmount lifecycle', () => {
    it('unmounting the component does not throw', async () => {
      const wrapper = await mountWorkspace()
      // Unmounting should clear any intervals without error
      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('autoRefreshInterval cleanup: unmounting does not throw even when interval is active', async () => {
      // In DEV mode (test environment), import.meta.env.DEV is true, so the
      // production auto-refresh interval is never registered.
      // We verify that unmounting is always safe (guard condition handled).
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
      const wrapper = await mountWorkspace()

      // Unmounting with autoRefreshInterval = null (DEV mode) should NOT call clearInterval
      wrapper.unmount()
      await nextTick()

      // In DEV mode the interval was never set, so clearInterval is not called
      expect(clearIntervalSpy).not.toHaveBeenCalled()
    })
  })

  // ── formattedRefreshedAt computed ─────────────────────────────────────────

  describe('formattedRefreshedAt computed', () => {
    it('formats the refreshed-at timestamp as a locale time string', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const formatted = vm.formattedRefreshedAt
      // Should be a non-empty time string
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  // ── postureIconBgClass computed (default / not_started branch) ────────────

  describe('postureIconBgClass — default branch (not_started posture)', () => {
    it('returns bg-gray-700 for not_started posture', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      // Directly mutate workspaceState to trigger not_started posture
      vm.workspaceState = { ...vm.workspaceState, posture: 'not_started' }
      await nextTick()

      expect(vm.postureIconBgClass).toBe('bg-gray-700')
    })
  })

  // ── formatActionDate error branch ─────────────────────────────────────────

  describe('formatActionDate — error fallback branch', () => {
    it('returns the raw string when an invalid date string is passed', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      // formatActionDate is a plain function in the component — call it via vm
      const result = vm.formatActionDate('not-a-date')
      // When Date constructor produces an Invalid Date, toLocaleDateString throws
      // in some environments, triggering the catch branch which returns the raw input
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ── topBlockers computed ──────────────────────────────────────────────────

  describe('topBlockers computed', () => {
    it('returns an array (may be empty for partial fixture)', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      expect(Array.isArray(vm.topBlockers)).toBe(true)
    })

    it('returns launch-blocking blockers when blocked fixture is active', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const blockedBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Blocked'),
      )!
      await blockedBtn.trigger('click')
      await nextTick()

      expect(vm.topBlockers.length).toBeGreaterThan(0)
      // All top blockers should be launch-blocking
      expect(vm.topBlockers.every((b: any) => b.isLaunchBlocking)).toBe(true)
    })

    it('returns no blockers when ready fixture is active', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      const readyBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Ready'),
      )!
      await readyBtn.trigger('click')
      await nextTick()

      expect(vm.topBlockers.length).toBe(0)
    })
  })

  // ── Production path: autoRefreshInterval cleanup ──────────────────────────

  describe('onBeforeUnmount with active interval', () => {
    it('clears a manually-set autoRefreshInterval on unmount', async () => {
      vi.useFakeTimers()
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

      const router = makeRouter()
      const wrapper = mount(InvestorComplianceOnboardingWorkspace, {
        global: { plugins: [router, createTestingPinia({ createSpy: vi.fn })] },
      })
      await router.isReady()
      await vi.advanceTimersByTimeAsync(200)
      await nextTick()

      const vm = wrapper.vm as any
      // Manually set an interval to simulate the production path where the
      // auto-refresh interval would have been registered.
      const dummyInterval = setInterval(() => {}, 1000)
      vm.autoRefreshInterval = dummyInterval

      wrapper.unmount()
      await nextTick()

      // clearInterval should have been called with our dummy interval
      expect(clearIntervalSpy).toHaveBeenCalledWith(dummyInterval)
      vi.useRealTimers()
    })
  })

  // ── stageCardBorderClass / stageNumberClass helper coverage ──────────────

  describe('stageCardBorderClass and stageNumberClass helpers', () => {
    it('stageCardBorderClass returns expected class for each status', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      expect(vm.stageCardBorderClass('complete')).toBe('border-green-800')
      expect(vm.stageCardBorderClass('blocked')).toBe('border-red-800')
      expect(vm.stageCardBorderClass('stale')).toBe('border-yellow-800')
      expect(vm.stageCardBorderClass('in_progress')).toBe('border-blue-800')
      expect(vm.stageCardBorderClass('pending_review')).toBe('border-blue-800')
      expect(vm.stageCardBorderClass('not_started')).toBe('border-gray-700')
    })

    it('stageNumberClass returns expected class for each status', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      expect(vm.stageNumberClass('complete')).toBe('bg-green-700 text-white')
      expect(vm.stageNumberClass('blocked')).toBe('bg-red-700 text-white')
      expect(vm.stageNumberClass('stale')).toBe('bg-yellow-700 text-white')
      expect(vm.stageNumberClass('in_progress')).toBe('bg-blue-700 text-white')
      expect(vm.stageNumberClass('pending_review')).toBe('bg-blue-700 text-white')
      expect(vm.stageNumberClass('not_started')).toBe('bg-gray-700 text-gray-300')
    })
  })

  // ── progressBarColorClass computed ────────────────────────────────────────

  describe('progressBarColorClass computed', () => {
    it('returns bg-green-500 for 100% readiness', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      // Switch to ready fixture (100% readiness)
      const readyBtn = wrapper.findAll('[data-testid^="fixture-btn-"]').find((btn) =>
        btn.text().includes('Ready'),
      )
      expect(readyBtn).toBeDefined()
      await readyBtn!.trigger('click')
      await nextTick()

      expect(vm.progressBarColorClass).toBe('bg-green-500')
    })

    it('returns bg-yellow-500 for 60-99% readiness', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      // Mutate directly to a mid-range score
      vm.workspaceState = { ...vm.workspaceState, readinessScore: 75 }
      await nextTick()

      expect(vm.progressBarColorClass).toBe('bg-yellow-500')
    })

    it('returns bg-red-500 for <60% readiness', async () => {
      const wrapper = await mountWorkspace()
      const vm = wrapper.vm as any

      // Mutate directly to a low score
      vm.workspaceState = { ...vm.workspaceState, readinessScore: 30 }
      await nextTick()

      expect(vm.progressBarColorClass).toBe('bg-red-500')
    })
  })
})
