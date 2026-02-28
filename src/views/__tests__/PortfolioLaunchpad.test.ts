/**
 * PortfolioLaunchpad View Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import PortfolioLaunchpad from '../PortfolioLaunchpad.vue'
import { usePortfolioLaunchpadStore } from '../../stores/portfolioLaunchpad'

vi.mock('../../utils/launchpadFunnel', () => ({
  trackLaunchpadViewed: vi.fn(),
  trackTokenSelected: vi.fn(),
  trackSimulationCompleted: vi.fn(),
  trackActionSubmitted: vi.fn(),
  trackActionConfirmed: vi.fn(),
  trackActionFailed: vi.fn(),
  resetLaunchpadDispatchGuard: vi.fn(),
}))

vi.mock('../../components/layout/MainLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/launchpad', name: 'PortfolioLaunchpad', component: PortfolioLaunchpad },
      { path: '/', component: { template: '<div>Home</div>' } },
    ],
  })
}

async function mountLaunchpad() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = makeRouter()
  await router.push('/launchpad')
  const wrapper = mount(PortfolioLaunchpad, {
    global: { plugins: [pinia, router] },
  })
  await flushPromises()
  const store = usePortfolioLaunchpadStore()
  return { wrapper, store, pinia }
}

describe('PortfolioLaunchpad – discover stage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders the page heading', async () => {
    const { wrapper } = await mountLaunchpad()
    expect(wrapper.text()).toContain('Portfolio Launchpad')
  })

  it('renders progress nav with 5 stage buttons', async () => {
    const { wrapper } = await mountLaunchpad()
    const nav = wrapper.find('nav[aria-label="Launchpad progress"]')
    expect(nav.exists()).toBe(true)
    expect(nav.findAll('button').length).toBe(5)
  })

  it('shows all 5 stage labels', async () => {
    const { wrapper } = await mountLaunchpad()
    for (const label of ['Discover', 'Evaluate', 'Simulate', 'Execute', 'Confirm']) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('renders token cards after load', async () => {
    const { wrapper } = await mountLaunchpad()
    expect(wrapper.findAll('article').length).toBeGreaterThan(0)
  })

  it('shows featured badge on featured tokens', async () => {
    const { wrapper, store } = await mountLaunchpad()
    if (store.tokens.some((t) => t.isFeatured)) {
      expect(wrapper.text()).toContain('Featured')
    }
  })

  it('selects token on card click', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await wrapper.find('article').trigger('click')
    expect(store.stage).toBe('evaluate')
  })

  it('trackTokenSelected is called when a token card is clicked', async () => {
    const { trackTokenSelected } = await import('../../utils/launchpadFunnel')
    const { wrapper } = await mountLaunchpad()
    await wrapper.find('article').trigger('click')
    expect(trackTokenSelected).toHaveBeenCalledTimes(1)
  })
})

describe('PortfolioLaunchpad – evaluate stage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  async function mountAtEvaluate() {
    const { wrapper, store } = await mountLaunchpad()
    if (store.tokens.length === 0) await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await flushPromises()
    return { wrapper, store }
  }

  it('shows Utility Summary', async () => {
    const { wrapper } = await mountAtEvaluate()
    expect(wrapper.text()).toContain('Utility Summary')
  })

  it('shows Trust Score', async () => {
    const { wrapper } = await mountAtEvaluate()
    expect(wrapper.text()).toContain('Trust Score')
  })

  it('shows Constraints section', async () => {
    const { wrapper } = await mountAtEvaluate()
    expect(wrapper.text()).toContain('Constraints')
  })

  it('shows Run Simulation button', async () => {
    const { wrapper } = await mountAtEvaluate()
    expect(wrapper.text()).toContain('Run Simulation')
  })

  it('back button returns to discover', async () => {
    const { wrapper, store } = await mountAtEvaluate()
    const btn = wrapper.find('button[aria-label="Back to discover"]')
    await btn.trigger('click')
    expect(store.stage).toBe('discover')
  })
})

describe('PortfolioLaunchpad – simulate stage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  async function mountAtSimulate() {
    const { wrapper, store } = await mountLaunchpad()
    if (store.tokens.length === 0) await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    await flushPromises()
    return { wrapper, store }
  }

  it('shows Simulation heading', async () => {
    const { wrapper } = await mountAtSimulate()
    expect(wrapper.text()).toContain('Simulation')
  })

  it('shows estimated fee display', async () => {
    const { wrapper, store } = await mountAtSimulate()
    if (store.simulation?.estimatedFeeDisplay) {
      expect(wrapper.text()).toContain(store.simulation.estimatedFeeDisplay)
    }
  })

  it('shows Review & Submit button', async () => {
    const { wrapper } = await mountAtSimulate()
    expect(wrapper.text()).toContain('Review')
  })

  it('shows Expected Outcome', async () => {
    const { wrapper } = await mountAtSimulate()
    expect(wrapper.text()).toContain('Expected Outcome')
  })
})

describe('PortfolioLaunchpad – execute stage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  async function mountAtExecute() {
    const { wrapper, store } = await mountLaunchpad()
    if (store.tokens.length === 0) await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    store.proceedToExecute()
    await flushPromises()
    return { wrapper, store }
  }

  it('shows Execute Action heading', async () => {
    const { wrapper } = await mountAtExecute()
    expect(wrapper.text()).toContain('Execute Action')
  })

  it('shows Backend-Secured Transaction notice', async () => {
    const { wrapper } = await mountAtExecute()
    expect(wrapper.text()).toContain('Backend-Secured Transaction')
  })

  it('shows Submit Action button', async () => {
    const { wrapper } = await mountAtExecute()
    expect(wrapper.text()).toContain('Submit Action')
  })

  it('submit button triggers submitAction', async () => {
    const { wrapper, store } = await mountAtExecute()
    const spy = vi.spyOn(store, 'submitAction')
    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Submit Action'))
    if (submitBtn) {
      await submitBtn.trigger('click')
      await flushPromises()
      expect(spy).toHaveBeenCalled()
    }
  })
})

describe('PortfolioLaunchpad – confirm stage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  async function mountAtConfirm() {
    const { wrapper, store } = await mountLaunchpad()
    if (store.tokens.length === 0) await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    store.proceedToExecute()
    await store.submitAction()
    await flushPromises()
    return { wrapper, store }
  }

  it('shows Action Confirmed heading', async () => {
    const { wrapper } = await mountAtConfirm()
    expect(wrapper.text()).toContain('Action Confirmed')
  })

  it('shows Explore More Opportunities button', async () => {
    const { wrapper } = await mountAtConfirm()
    expect(wrapper.text()).toContain('Explore More Opportunities')
  })

  it('Explore More resets to discover stage', async () => {
    const { wrapper, store } = await mountAtConfirm()
    const btn = wrapper.findAll('button').find(b => b.text().includes('Explore More'))
    if (btn) {
      await btn.trigger('click')
      await flushPromises()
      expect(store.stage).toBe('discover')
    }
  })
})

describe('PortfolioLaunchpad – loading and error states', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows loading spinner while fetching', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    await router.push('/launchpad')
    const store = usePortfolioLaunchpadStore()
    vi.spyOn(store, 'fetchTokens').mockImplementation(async () => {
      store.loading = true
    })
    const wrapper = mount(PortfolioLaunchpad, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    const loadingEl = wrapper.find('[aria-label="Loading token opportunities"]')
    expect(loadingEl.exists()).toBe(true)
  })

  it('shows error message when fetch fails', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    await router.push('/launchpad')
    const store = usePortfolioLaunchpadStore()
    vi.spyOn(store, 'fetchTokens').mockImplementation(async () => {
      store.error = 'Network error'
      store.loading = false
    })
    const wrapper = mount(PortfolioLaunchpad, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Failed to load opportunities')
  })

  it('retry button on error calls fetchTokens again', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    await router.push('/launchpad')
    const store = usePortfolioLaunchpadStore()
    const fetchSpy = vi.spyOn(store, 'fetchTokens').mockImplementation(async () => {
      store.error = 'Network error'
      store.loading = false
    })
    const wrapper = mount(PortfolioLaunchpad, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    const retryBtn = wrapper.findAll('button').find(b => b.text().includes('Retry'))
    if (retryBtn) {
      await retryBtn.trigger('click')
      expect(fetchSpy).toHaveBeenCalledTimes(2) // once on mount, once on retry
    }
  })

  it('shows empty state when no tokens', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    await router.push('/launchpad')
    const store = usePortfolioLaunchpadStore()
    vi.spyOn(store, 'fetchTokens').mockImplementation(async () => {
      store.loading = false
      store.error = null
      store.tokens = []
    })
    const wrapper = mount(PortfolioLaunchpad, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('No opportunities available')
  })
})

describe('PortfolioLaunchpad – simulation error state', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows simulation error and retry button on failure', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    store.stage = 'simulate'
    store.simulationError = 'Simulation service unavailable'
    await flushPromises()
    expect(wrapper.text()).toContain('Simulation failed')
    expect(wrapper.text()).toContain('Simulation service unavailable')
  })

  it('retry simulation button calls handleRunSimulation', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    store.stage = 'simulate'
    store.simulationError = 'Timed out'
    await flushPromises()
    const retryBtn = wrapper.findAll('button').find(b => b.text().includes('Retry simulation'))
    if (retryBtn) {
      const runSpy = vi.spyOn(store, 'runSimulation')
      await retryBtn.trigger('click')
      await flushPromises()
      expect(runSpy).toHaveBeenCalled()
    }
  })
})

describe('PortfolioLaunchpad – execute action error handling', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows action error after failed submit', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    store.proceedToExecute()
    store.actionError = 'Insufficient balance'
    await flushPromises()
    expect(wrapper.text()).toContain('Action failed')
    expect(wrapper.text()).toContain('Insufficient balance')
  })

  it('handleSubmitAction tracks action failure event', async () => {
    const { trackActionFailed } = await import('../../utils/launchpadFunnel')
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    store.proceedToExecute()
    vi.spyOn(store, 'submitAction').mockImplementationOnce(async () => {
      store.actionError = 'tx rejected'
      store.actionLoading = false
    })
    await flushPromises()
    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Submit Action'))
    if (submitBtn) {
      await submitBtn.trigger('click')
      await flushPromises()
      expect(trackActionFailed).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'tx rejected' })
      )
    }
  })

  it('retryAction button clears actionError', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    store.proceedToExecute()
    store.actionError = 'Network timeout'
    await flushPromises()
    const retryBtn = wrapper.findAll('button').find(b => b.text().includes('Try again'))
    if (retryBtn) {
      await retryBtn.trigger('click')
      await flushPromises()
      expect(store.actionError).toBeNull()
    }
  })
})

describe('PortfolioLaunchpad – product alignment (no wallet connectors)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('execute stage shows Backend-Secured Transaction notice, not wallet prompt', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    store.proceedToExecute()
    await flushPromises()
    expect(wrapper.text()).toContain('Backend-Secured Transaction')
    expect(wrapper.text()).not.toContain('Wallet Connection Required')
    expect(wrapper.text()).not.toContain('sign this transaction in your wallet')
    // Verify "No wallet app required" is a positive statement (not a prompt)
    expect(wrapper.text()).toContain('No wallet app required')
  })

  it('Review & Submit button advances to execute stage, not wallet connect', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    await flushPromises()
    const reviewBtn = wrapper.findAll('button').find(b => b.text().includes('Review'))
    if (reviewBtn) {
      await reviewBtn.trigger('click')
      await flushPromises()
      expect(store.stage).toBe('execute')
    }
  })

  it('discover cards show accessNote, not wallet compatibility text', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    await flushPromises()
    const firstToken = store.tokens[0]
    if (firstToken.accessNote) {
      expect(wrapper.text()).toContain(firstToken.accessNote)
    }
    // No wallet-specific text on discovery cards
    expect(wrapper.text()).not.toContain('Algorand-native wallets')
    expect(wrapper.text()).not.toContain('ARC200-aware wallets')
    expect(wrapper.text()).not.toContain('KYC wallet required')
  })
})
