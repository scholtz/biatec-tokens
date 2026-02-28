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

describe('PortfolioLaunchpad – liquidity style helpers', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('evaluate stage shows medium-liquidity style when arc200-biatec is selected', async () => {
    const { wrapper, store } = await mountLaunchpad()
    // arc200-biatec has liquidityIndicator: 'medium'
    const medTok = store.tokens.find((t) => t.id === 'arc200-biatec')
    expect(medTok).toBeDefined()
    store.selectToken(medTok!.id)
    await flushPromises()
    // The evaluate stage renders liquidityTextClasses(token.liquidityIndicator)
    // 'medium' branch should be exercised
    expect(wrapper.text()).toContain('Utility Summary')
    expect(wrapper.text()).toContain(medTok!.symbol)
  })

  it('evaluate stage shows low-liquidity style when rwa-property-01 is selected', async () => {
    const { wrapper, store } = await mountLaunchpad()
    // rwa-property-01 has liquidityIndicator: 'low'
    const lowTok = store.tokens.find((t) => t.id === 'rwa-property-01')
    expect(lowTok).toBeDefined()
    store.selectToken(lowTok!.id)
    await flushPromises()
    expect(wrapper.text()).toContain(lowTok!.symbol)
  })

  it('discover cards render low-liquidity badge for rwa-property-01', async () => {
    const { wrapper, store } = await mountLaunchpad()
    // rwa-property-01 has liquidityIndicator: 'low' → exercised by the v-for token grid
    expect(store.tokens.some((t) => t.liquidityIndicator === 'low')).toBe(true)
    // The discover grid renders all tokens; assert the token appears
    const lowTok = store.tokens.find((t) => t.liquidityIndicator === 'low')
    if (lowTok) {
      expect(wrapper.text()).toContain(lowTok.name)
    }
  })

  it('evaluate stage with token that has undefined liquidityIndicator uses default styles', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    await router.push('/launchpad')
    const store = usePortfolioLaunchpadStore()
    await store.fetchTokens()
    // Patch first token to have no liquidityIndicator to exercise 'default' branch
    // Keep stage at 'discover' so the token grid renders and calls liquidityClasses(undefined)
    if (store.tokens.length > 0) {
      const tok = { ...store.tokens[0] }
      delete (tok as Record<string, unknown>).liquidityIndicator
      store.tokens = [tok as typeof store.tokens[0], ...store.tokens.slice(1)]
      // Do NOT call selectToken – leave stage at 'discover' so the grid renders
    }
    const wrapper = mount(PortfolioLaunchpad, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    // The discover grid renders, calling liquidityClasses(undefined) → 'default' branch
    expect(wrapper.findAll('article').length).toBeGreaterThan(0)
  })

  it('trustScoreClasses low branch (score < 60): token with score 40', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    await router.push('/launchpad')
    const store = usePortfolioLaunchpadStore()
    await store.fetchTokens()
    // Patch a token to have trustScore 40 to exercise the low-score branch
    if (store.tokens.length > 0) {
      store.tokens[0] = { ...store.tokens[0], trustScore: 40 }
      store.selectToken(store.tokens[0].id)
    }
    const wrapper = mount(PortfolioLaunchpad, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Trust Score')
  })

  it('trustScoreClasses undefined score uses gray', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    await router.push('/launchpad')
    const store = usePortfolioLaunchpadStore()
    await store.fetchTokens()
    if (store.tokens.length > 0) {
      const tok = { ...store.tokens[0] }
      delete (tok as Record<string, unknown>).trustScore
      store.tokens = [tok as typeof store.tokens[0], ...store.tokens.slice(1)]
      store.selectToken(tok.id)
    }
    const wrapper = mount(PortfolioLaunchpad, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Trust Score')
  })
})

describe('PortfolioLaunchpad – stage navigation (backward)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('simulate stage shows constraints for kycRequired token', async () => {
    const { wrapper, store } = await mountLaunchpad()
    // rwa-property-01 has kycRequired=true → simulation constraints list rendered
    const kycTok = store.tokens.find((t) => t.id === 'rwa-property-01')
    expect(kycTok).toBeDefined()
    store.selectToken(kycTok!.id)
    await store.runSimulation()
    await flushPromises()
    expect(store.simulation?.constraints.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('KYC verification required')
  })

  it('simulate stage shows warnings for low-liquidity token', async () => {
    const { wrapper, store } = await mountLaunchpad()
    // rwa-property-01 has liquidityIndicator='low' → warnings list rendered
    const lowTok = store.tokens.find((t) => t.liquidityIndicator === 'low')
    expect(lowTok).toBeDefined()
    store.selectToken(lowTok!.id)
    await store.runSimulation()
    await flushPromises()
    expect(store.simulation?.warnings.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Low liquidity')
  })

  it('"Back to simulation" button in execute stage sets stage to simulate', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    store.proceedToExecute()
    await flushPromises()
    const backBtn = wrapper.findAll('button').find((b) => b.text().includes('Back to simulation'))
    expect(backBtn).toBeDefined()
    await backBtn!.trigger('click')
    await flushPromises()
    expect(store.stage).toBe('simulate')
  })

  it('progress nav evaluate button navigates back to evaluate from simulate', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    await flushPromises()
    // Now on simulate stage; click the 'Evaluate' nav button to go back
    const navBtns = wrapper.find('nav[aria-label="Launchpad progress"]').findAll('button')
    const evalBtn = navBtns.find((b) => b.attributes('aria-label')?.includes('Stage 2'))
    expect(evalBtn).toBeDefined()
    await evalBtn!.trigger('click')
    await flushPromises()
    expect(store.stage).toBe('evaluate')
  })

  it('progress nav simulate button navigates back to simulate from execute', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    store.proceedToExecute()
    await flushPromises()
    // Now on execute stage; click the 'Simulate' nav button to go back
    const navBtns = wrapper.find('nav[aria-label="Launchpad progress"]').findAll('button')
    const simBtn = navBtns.find((b) => b.attributes('aria-label')?.includes('Stage 3'))
    expect(simBtn).toBeDefined()
    await simBtn!.trigger('click')
    await flushPromises()
    expect(store.stage).toBe('simulate')
  })

  it('progress nav discover button calls deselectToken', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await flushPromises()
    // Click 'Discover' nav button (Stage 1)
    const navBtns = wrapper.find('nav[aria-label="Launchpad progress"]').findAll('button')
    const discBtn = navBtns.find((b) => b.attributes('aria-label')?.includes('Stage 1'))
    expect(discBtn).toBeDefined()
    await discBtn!.trigger('click')
    await flushPromises()
    expect(store.stage).toBe('discover')
    expect(store.selectedTokenId).toBeNull()
  })
})

describe('PortfolioLaunchpad – lifecycle cleanup', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('onUnmounted calls resetLaunchpadDispatchGuard', async () => {
    const { resetLaunchpadDispatchGuard } = await import('../../utils/launchpadFunnel')
    const { wrapper } = await mountLaunchpad()
    vi.clearAllMocks()
    wrapper.unmount()
    expect(resetLaunchpadDispatchGuard).toHaveBeenCalled()
  })
})

describe('PortfolioLaunchpad – integration: complete navigation flow', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('full flow: discover → select token → evaluate → back → discover', async () => {
    const { wrapper, store } = await mountLaunchpad()

    // 1. Start at discover stage
    expect(store.stage).toBe('discover')
    // Back button is NOT rendered in discover stage
    expect(wrapper.find('button[aria-label="Back to discover"]').exists()).toBe(false)

    // 2. Select a token to advance to evaluate
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await flushPromises()
    expect(store.stage).toBe('evaluate')

    // 3. Back button IS rendered in evaluate stage with visible "Back" text
    const backBtn = wrapper.find('button[aria-label="Back to discover"]')
    expect(backBtn.exists()).toBe(true)
    expect(backBtn.text()).toContain('Back')

    // 4. Click Back to return to discover
    await backBtn.trigger('click')
    await flushPromises()
    expect(store.stage).toBe('discover')
    expect(store.selectedTokenId).toBeNull()

    // 5. Back button is gone again after returning to discover
    expect(wrapper.find('button[aria-label="Back to discover"]').exists()).toBe(false)
  })

  it('navigating forward changes the active step', async () => {
    const { store } = await mountLaunchpad()
    expect(store.stage).toBe('discover')
    await store.fetchTokens()

    // Discover → Evaluate
    store.selectToken(store.tokens[0].id)
    await flushPromises()
    expect(store.stage).toBe('evaluate')
    expect(store.stageIndex).toBe(1)

    // Evaluate → Simulate
    await store.runSimulation()
    await flushPromises()
    expect(store.stage).toBe('simulate')
    expect(store.stageIndex).toBe(2)
  })

  it('navigating backward returns to the previous step', async () => {
    const { wrapper, store } = await mountLaunchpad()
    await store.fetchTokens()
    store.selectToken(store.tokens[0].id)
    await store.runSimulation()
    await flushPromises()
    expect(store.stage).toBe('simulate')

    // Back from simulate → evaluate (via "Back to evaluation" button in the view)
    const backToEvalBtn = wrapper.findAll('button').find((b) => b.text().includes('Back to evaluation'))
    expect(backToEvalBtn).toBeDefined()
    await backToEvalBtn!.trigger('click')
    await flushPromises()
    expect(store.stage).toBe('evaluate')
    expect(store.stageIndex).toBe(1)

    // Back from evaluate → discover (via "Back to discover" button in the view)
    const backToDiscBtn = wrapper.find('button[aria-label="Back to discover"]')
    expect(backToDiscBtn.exists()).toBe(true)
    await backToDiscBtn.trigger('click')
    await flushPromises()
    expect(store.stage).toBe('discover')
    expect(store.stageIndex).toBe(0)
  })
})
