import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory, useRouter } from 'vue-router'

// Mock telemetry service
vi.mock('../../services/TelemetryService', () => ({
  telemetryService: {
    trackOnboardingStepCompleted: vi.fn(),
    trackOnboardingCompleted: vi.fn(),
  },
}))

import OnboardingChecklist from '../OnboardingChecklist.vue'
import { telemetryService } from '../../services/TelemetryService'

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
      { path: '/discovery', name: 'DiscoveryDashboard', component: { template: '<div />' } },
      { path: '/marketplace', name: 'Marketplace', component: { template: '<div />' } },
    ],
  })

/**
 * Get the mock router that the most recently mounted component received via useRouter().
 * The global src/test/setup.ts mock creates a separate router object per useRouter() call,
 * so we must read it from the call records rather than from the test's createRouter() result.
 */
function getComponentRouter() {
  return vi.mocked(useRouter).mock.results.at(-1)?.value
}

async function mountChecklist(stateOverrides: Record<string, unknown> = {}) {
  const router = makeRouter()
  await router.isReady()
  // Default onboarding state — all false, completedAt null = not complete
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      onboarding: {
        state: {
          hasSeenWelcome: false,
          hasAuthenticated: false,
          hasSelectedStandards: false,
          hasSavedFilters: false,
          hasViewedToken: false,
          completedAt: null,
          preferredStandards: [],
          preferredChains: [],
          ...stateOverrides,
        },
        isOnboardingVisible: true,
      },
    },
  })
  const wrapper = mount(OnboardingChecklist, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  await nextTick()
  return { wrapper, router, pinia }
}

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the onboarding checklist when not complete', async () => {
    const { wrapper } = await mountChecklist()
    expect(document.body.querySelector('[data-testid="onboarding-checklist"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('does not render when completedAt is set (isOnboardingComplete)', async () => {
    const { wrapper } = await mountChecklist({ completedAt: '2026-01-01T00:00:00Z' })
    await nextTick()
    expect(document.body.querySelector('[data-testid="onboarding-checklist"]')).toBeNull()
    wrapper.unmount()
  })

  it('shows progress bar with correct aria attributes', async () => {
    // Set two steps as complete so progressPercentage = 40%
    const { wrapper } = await mountChecklist({ hasSeenWelcome: true, hasAuthenticated: true })
    const progressbar = document.body.querySelector('[role="progressbar"]')
    expect(progressbar).not.toBeNull()
    expect(progressbar?.getAttribute('aria-valuenow')).toBe('40')
    expect(progressbar?.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar?.getAttribute('aria-valuemax')).toBe('100')
    wrapper.unmount()
  })

  it('shows completedSteps / totalSteps text', async () => {
    const { wrapper } = await mountChecklist({ hasSeenWelcome: true, hasAuthenticated: true })
    const text = document.body.querySelector('[data-testid="onboarding-checklist"]')?.textContent || ''
    expect(text).toMatch(/2/)
    expect(text).toMatch(/5/)
    wrapper.unmount()
  })

  it('has accessible label on checklist region', async () => {
    const { wrapper } = await mountChecklist()
    const region = document.body.querySelector('[role="complementary"]')
    expect(region?.getAttribute('aria-label')).toBe('Onboarding checklist')
    wrapper.unmount()
  })

  it('renders toggle button for minimize/maximize', async () => {
    const { wrapper } = await mountChecklist()
    expect(document.body.querySelector('[data-testid="checklist-toggle-button"]')).not.toBeNull()
    wrapper.unmount()
  })

  // ── toggleMinimize ─────────────────────────────────────────────────────────

  it('toggleMinimize() flips isMinimized from false to true', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    expect(vm.isMinimized).toBe(false)
    vm.toggleMinimize()
    await nextTick()
    expect(vm.isMinimized).toBe(true)
    wrapper.unmount()
  })

  it('toggleMinimize() flips isMinimized back to false on second call', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.toggleMinimize()
    await nextTick()
    vm.toggleMinimize()
    await nextTick()
    expect(vm.isMinimized).toBe(false)
    wrapper.unmount()
  })

  it('toggle button updates aria-label when minimized', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    const btn = document.body.querySelector('[data-testid="checklist-toggle-button"]') as HTMLElement
    expect(btn?.getAttribute('aria-label')).toBe('Minimize checklist')
    vm.toggleMinimize()
    await nextTick()
    expect(btn?.getAttribute('aria-label')).toBe('Expand checklist')
    wrapper.unmount()
  })

  // ── handleComplete ─────────────────────────────────────────────────────────

  it('handleComplete() calls telemetry', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.handleComplete()
    await nextTick()
    expect(telemetryService.trackOnboardingCompleted).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('handleComplete() sets visible to false', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    expect(vm.visible).toBe(true)
    vm.handleComplete()
    await nextTick()
    expect(vm.visible).toBe(false)
    wrapper.unmount()
  })

  // ── handleStepClick ────────────────────────────────────────────────────────

  it('handleStepClick() returns early if step is already completed', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.handleStepClick({ id: 'welcome', title: 'Welcome', completed: true })
    await nextTick()
    expect(telemetryService.trackOnboardingStepCompleted).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('handleStepClick() calls telemetry for non-completed step', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.handleStepClick({ id: 'select-standards', title: 'Select Standards', completed: false })
    await nextTick()
    expect(telemetryService.trackOnboardingStepCompleted).toHaveBeenCalledOnce()
    expect(telemetryService.trackOnboardingStepCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ stepId: 'select-standards' }),
    )
    wrapper.unmount()
  })

  it('handleStepClick("authenticate") navigates to Home with showAuth=true', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.handleStepClick({ id: 'authenticate', title: 'Sign In', completed: false })
    await nextTick()
    // The global setup.ts mock returns a fresh router per useRouter() call.
    // Access the component's actual router via vi.mocked(useRouter).mock.results.
    const componentRouter = getComponentRouter()
    expect(componentRouter?.push).toHaveBeenCalledWith(
      expect.objectContaining({ query: { showAuth: 'true' } }),
    )
    wrapper.unmount()
  })

  it('handleStepClick("select-standards") navigates to DiscoveryDashboard', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.handleStepClick({ id: 'select-standards', title: 'Select Standards', completed: false })
    await nextTick()
    const componentRouter = getComponentRouter()
    expect(componentRouter?.push).toHaveBeenCalledWith({ name: 'DiscoveryDashboard' })
    wrapper.unmount()
  })

  it('handleStepClick("save-filters") navigates to DiscoveryDashboard', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.handleStepClick({ id: 'save-filters', title: 'Save Filters', completed: false })
    await nextTick()
    const componentRouter = getComponentRouter()
    expect(componentRouter?.push).toHaveBeenCalledWith({ name: 'DiscoveryDashboard' })
    wrapper.unmount()
  })

  it('handleStepClick("explore-tokens") navigates to Marketplace', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.handleStepClick({ id: 'explore-tokens', title: 'Explore Tokens', completed: false })
    await nextTick()
    const componentRouter = getComponentRouter()
    expect(componentRouter?.push).toHaveBeenCalledWith({ name: 'Marketplace' })
    wrapper.unmount()
  })

  it('handleStepClick("welcome") marks welcome step complete', async () => {
    const { wrapper } = await mountChecklist()
    const vm = wrapper.vm as any
    vm.handleStepClick({ id: 'welcome', title: 'Welcome', completed: false })
    await nextTick()
    expect(telemetryService.trackOnboardingStepCompleted).toHaveBeenCalled()
    wrapper.unmount()
  })

  // ── No wallet connector (product alignment) ────────────────────────────────

  it('does not render wallet-connector UI (product alignment)', async () => {
    const { wrapper } = await mountChecklist()
    expect(document.body.innerHTML).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    wrapper.unmount()
  })

  // ── initialize is called on mount ─────────────────────────────────────────

  it('calls onboardingStore.initialize() on mount', async () => {
    const { pinia } = await mountChecklist()
    const { useOnboardingStore } = await import('../../stores/onboarding')
    // Access store from the pinia instance
    const store = useOnboardingStore(pinia)
    expect(store.initialize).toHaveBeenCalled()
  })
})
