import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('../../components/ui/Card.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))
vi.mock('../../components/ui/Button.vue', () => ({
  default: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'variant', 'size'],
    emits: ['click'],
  },
}))
vi.mock('../../components/ui/Badge.vue', () => ({
  default: { template: '<span><slot /></span>', props: ['variant', 'size'] },
}))
vi.mock('../../stores/onboarding', () => ({
  useOnboardingStore: vi.fn(() => ({
    currentStep: 0,
    isComplete: false,
    completeOnboarding: vi.fn(),
  })),
}))
vi.mock('../../stripe-config', () => ({
  stripeProducts: [
    { id: 'prod_basic', name: 'Basic', price: 29 },
    { id: 'prod_pro', name: 'Professional', price: 99 },
    { id: 'prod_ent', name: 'Enterprise', price: 299 },
  ],
}))

import OnboardingFlow from '../OnboardingFlow.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/onboarding', component: { template: '<div />' } },
      { path: '/launch/guided', component: { template: '<div />' } },
    ],
  })

describe('OnboardingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountView() {
    const router = makeRouter()
    await router.push('/onboarding')
    await router.isReady()

    return mount(OnboardingFlow, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          ShieldCheckIcon: { template: '<span />' },
          DocumentCheckIcon: { template: '<span />' },
          SparklesIcon: { template: '<span />' },
          CheckIcon: { template: '<span />' },
          CheckCircleIcon: { template: '<span />' },
          InformationCircleIcon: { template: '<span />' },
        },
      },
    })
  }

  it('renders the welcome heading', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toMatch(/welcome to biatec tokens|let's set up/i)
  })

  it('shows step 1 of 4 progress indicator', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toMatch(/step 1 of 4/i)
  })

  it('shows 0% complete initially', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toMatch(/0% complete/i)
  })

  it('does not show wallet-connector UI (product alignment)', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('renders organization name input on first step', async () => {
    const wrapper = await mountView()
    // First step has organization name field
    const input = wrapper.find('input[type="text"], input:not([type])')
    expect(input.exists()).toBe(true)
  })

  it('has token type selection options on first or second step', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()
    // Token type options appear somewhere in the form
    expect(text).toMatch(/fungible token|nft collection|security token|utility token/i)
  })

  it('shows progress bar element', async () => {
    const wrapper = await mountView()
    // Progress bar is a div with style width attribute
    const progressBar = wrapper.find('[class*="transition-all"]')
    expect(progressBar.exists()).toBe(true)
  })
})
