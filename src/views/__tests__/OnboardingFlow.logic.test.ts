/**
 * OnboardingFlow.logic.test.ts
 *
 * Tests for the internal functions and computed properties of OnboardingFlow.vue.
 * Covers step navigation, canProceed validation, plan recommendation,
 * localStorage persistence, and lifecycle auth-guard.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

// ── Stubs ────────────────────────────────────────────────────────────────────
vi.mock('../../components/ui/Card.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../components/ui/Button.vue', () => ({
  default: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'variant', 'size', 'full-width'],
    emits: ['click'],
  },
}))
vi.mock('../../components/ui/Badge.vue', () => ({
  default: { template: '<span><slot /></span>', props: ['variant'] },
}))
vi.mock('../../stripe-config', () => ({
  stripeProducts: [
    { id: 'prod_basic', name: 'Basic', tier: 'basic', price: 29 },
    { id: 'prod_pro', name: 'Professional', tier: 'professional', price: 99 },
    { id: 'prod_ent', name: 'Enterprise', tier: 'enterprise', price: 299 },
  ],
}))

import OnboardingFlow from '../OnboardingFlow.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedLaunch', component: { template: '<div />' } },
      { path: '/subscription/pricing', name: 'Pricing', component: { template: '<div />' } },
      { path: '/onboarding', name: 'Onboarding', component: { template: '<div />' } },
    ],
  })

async function mountFlow(
  authOverrides: Record<string, unknown> = {},
  storeOverrides: Record<string, unknown> = {},
) {
  const router = makeRouter()
  await router.push('/onboarding')
  await router.isReady()

  const wrapper = mount(OnboardingFlow, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            onboarding: {
              isOnboardingComplete: false,
              steps: [],
              markStepComplete: vi.fn(),
              setPreferredChains: vi.fn(),
              completeOnboarding: vi.fn(),
              initialize: vi.fn(),
              ...storeOverrides,
            },
            auth: {
              user: { address: 'TEST_ADDR', email: 'test@example.com' },
              isConnected: true,
              isAuthenticated: true,
              ...authOverrides,
            },
          },
        }),
        router,
      ],
    },
  })
  await nextTick()
  return { wrapper, router }
}

describe('OnboardingFlow — logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without crashing', async () => {
    const { wrapper } = await mountFlow()
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('starts on step 0', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    expect(vm.currentStep).toBe(0)
    wrapper.unmount()
  })

  it('does not show wallet-connector UI (product alignment)', async () => {
    const { wrapper } = await mountFlow()
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    wrapper.unmount()
  })

  // ── canProceed: step 0 ────────────────────────────────────────────────────

  it('canProceed is false on step 0 when form is empty', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    expect(vm.currentStep).toBe(0)
    expect(vm.canProceed).toBe(false)
    wrapper.unmount()
  })

  it('canProceed is true on step 0 when all required fields filled', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.organizationName = 'Acme Corp'
    vm.formData.role = 'compliance_officer'
    vm.formData.intendedTokenType = 'security'
    await nextTick()
    expect(vm.canProceed).toBe(true)
    wrapper.unmount()
  })

  it('canProceed is false on step 0 when organizationName is whitespace', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.organizationName = '   '
    vm.formData.role = 'analyst'
    vm.formData.intendedTokenType = 'fungible'
    await nextTick()
    expect(vm.canProceed).toBe(false)
    wrapper.unmount()
  })

  // ── canProceed: step 1 ────────────────────────────────────────────────────

  it('canProceed is false on step 1 when no networks selected', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    // Fill step 0 and advance
    vm.formData.organizationName = 'Corp'
    vm.formData.role = 'admin'
    vm.formData.intendedTokenType = 'utility'
    vm.currentStep = 1
    await nextTick()
    expect(vm.canProceed).toBe(false)
    wrapper.unmount()
  })

  it('canProceed is true on step 1 when networks are selected', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.currentStep = 1
    vm.formData.selectedNetworks = ['algorand_testnet']
    await nextTick()
    expect(vm.canProceed).toBe(true)
    wrapper.unmount()
  })

  // ── canProceed: step 2+ always true ───────────────────────────────────────

  it('canProceed is always true on step 2', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.currentStep = 2
    await nextTick()
    expect(vm.canProceed).toBe(true)
    wrapper.unmount()
  })

  it('canProceed is always true on step 3', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.currentStep = 3
    await nextTick()
    expect(vm.canProceed).toBe(true)
    wrapper.unmount()
  })

  // ── nextStep() ────────────────────────────────────────────────────────────

  it('nextStep() increments currentStep when canProceed is true', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.organizationName = 'Acme'
    vm.formData.role = 'analyst'
    vm.formData.intendedTokenType = 'security'
    await nextTick()
    vm.nextStep()
    await nextTick()
    expect(vm.currentStep).toBe(1)
    wrapper.unmount()
  })

  it('nextStep() does not advance when canProceed is false', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    // step 0 with empty form → canProceed false
    vm.nextStep()
    await nextTick()
    expect(vm.currentStep).toBe(0)
    wrapper.unmount()
  })

  it('nextStep() marks "welcome" complete when advancing to step 1', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.organizationName = 'Acme'
    vm.formData.role = 'analyst'
    vm.formData.intendedTokenType = 'security'
    await nextTick()
    vm.nextStep() // 0 → 1
    await nextTick()
    const { useOnboardingStore } = await import('../../stores/onboarding')
    const store = useOnboardingStore()
    expect(store.markStepComplete).toHaveBeenCalledWith('welcome')
    wrapper.unmount()
  })

  it('nextStep() calls setPreferredChains when advancing from step 1 to 2', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.currentStep = 1
    vm.formData.selectedNetworks = ['algorand_testnet', 'voi']
    await nextTick()
    vm.nextStep() // 1 → 2
    await nextTick()
    const { useOnboardingStore } = await import('../../stores/onboarding')
    const store = useOnboardingStore()
    expect(store.setPreferredChains).toHaveBeenCalledWith(['algorand_testnet', 'voi'])
    wrapper.unmount()
  })

  it('nextStep() does not advance past step 3 (totalSteps - 1)', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.currentStep = 3
    vm.nextStep()
    await nextTick()
    expect(vm.currentStep).toBe(3)
    wrapper.unmount()
  })

  // ── previousStep() ────────────────────────────────────────────────────────

  it('previousStep() decrements currentStep', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.currentStep = 2
    vm.previousStep()
    await nextTick()
    expect(vm.currentStep).toBe(1)
    wrapper.unmount()
  })

  it('previousStep() does not go below 0', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.currentStep = 0
    vm.previousStep()
    await nextTick()
    expect(vm.currentStep).toBe(0)
    wrapper.unmount()
  })

  // ── recommendedPlan ───────────────────────────────────────────────────────

  it('recommendedPlan returns basic when no special networks selected', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.selectedNetworks = ['algorand_testnet']
    await nextTick()
    expect(vm.recommendedPlan.tier).toBe('basic')
    wrapper.unmount()
  })

  it('recommendedPlan returns professional when mainnet selected', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.selectedNetworks = ['algorand_mainnet']
    await nextTick()
    expect(vm.recommendedPlan.tier).toBe('professional')
    wrapper.unmount()
  })

  it('recommendedPlan returns enterprise when enterprise networks selected', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.selectedNetworks = ['ethereum_mainnet']
    await nextTick()
    expect(vm.recommendedPlan.tier).toBe('enterprise')
    wrapper.unmount()
  })

  it('recommendedPlan returns enterprise for arbitrum', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.selectedNetworks = ['arbitrum']
    await nextTick()
    expect(vm.recommendedPlan.tier).toBe('enterprise')
    wrapper.unmount()
  })

  it('recommendedPlan returns professional when only mainnet (no advanced compliance) selected', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.selectedNetworks = ['algorand_mainnet']
    vm.formData.requiresMICA = false
    vm.formData.requiresKYC = false
    await nextTick()
    // hasMainnetNeeds true, needsAdvancedCompliance false → professional
    expect(vm.recommendedPlan.tier).toBe('professional')
    wrapper.unmount()
  })

  it('recommendedPlan returns enterprise when MICA+KYC+mainnet selected', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.selectedNetworks = ['algorand_mainnet']
    vm.formData.requiresMICA = true
    vm.formData.requiresKYC = true
    await nextTick()
    // needsAdvancedCompliance && hasMainnetNeeds → enterprise
    expect(vm.recommendedPlan.tier).toBe('enterprise')
    wrapper.unmount()
  })

  // ── saveOnboardingData ────────────────────────────────────────────────────

  it('saveOnboardingData() persists form to localStorage', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.formData.organizationName = 'Test Org'
    vm.formData.role = 'analyst'
    vm.formData.intendedTokenType = 'security'
    await vm.saveOnboardingData()
    const saved = JSON.parse(localStorage.getItem('biatec_onboarding_data') || '{}')
    expect(saved.organizationName).toBe('Test Org')
    expect(saved.role).toBe('analyst')
    wrapper.unmount()
  })

  // ── handleSelectRecommendedPlan ───────────────────────────────────────────

  it('handleSelectRecommendedPlan() advances to step 3', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    vm.currentStep = 2
    await vm.handleSelectRecommendedPlan()
    await nextTick()
    expect(vm.currentStep).toBe(3)
    wrapper.unmount()
  })

  it('handleSelectRecommendedPlan() calls completeOnboarding()', async () => {
    const { wrapper } = await mountFlow()
    const vm = wrapper.vm as any
    await vm.handleSelectRecommendedPlan()
    const { useOnboardingStore } = await import('../../stores/onboarding')
    const store = useOnboardingStore()
    expect(store.completeOnboarding).toHaveBeenCalled()
    wrapper.unmount()
  })

  // ── Navigation helpers ────────────────────────────────────────────────────

  it('viewAllPlans() navigates to /subscription/pricing', async () => {
    const { wrapper, router } = await mountFlow()
    const vm = wrapper.vm as any
    vm.viewAllPlans()
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/subscription/pricing')
    wrapper.unmount()
  })

  it('startTokenCreation() navigates to /launch/guided', async () => {
    const { wrapper, router } = await mountFlow()
    const vm = wrapper.vm as any
    vm.startTokenCreation()
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/launch/guided')
    wrapper.unmount()
  })

  it('goToDashboard() navigates to /dashboard', async () => {
    const { wrapper, router } = await mountFlow()
    const vm = wrapper.vm as any
    vm.goToDashboard()
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/dashboard')
    wrapper.unmount()
  })
})
