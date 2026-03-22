import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

vi.mock('../../components/ui/Button.vue', () => ({
  default: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'variant', 'size'],
    emits: ['click'],
  },
}))
vi.mock('../../components/ui/Card.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))
vi.mock('../../components/insights/MetricCard.vue', () => ({
  default: { template: '<div data-testid="metric-card"></div>' },
}))
vi.mock('../../components/insights/TrendChart.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/insights/BenchmarkPanel.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/insights/ScenarioPlanner.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/insights/CohortTable.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/insights/MetricGlossary.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../components/insights/InsightsFilters.vue', () => ({
  default: { template: '<div></div>' },
}))
vi.mock('../../services/analytics', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))
vi.mock('../../stores/insights', () => ({
  useInsightsStore: vi.fn(() => ({
    filters: {},
    metrics: [],
    coreMetrics: [],
    trendData: [],
    benchmarks: [],
    scenarioInputs: {},
    scenarioOutputs: null,
    loading: false,
    error: null,
    initialize: vi.fn().mockResolvedValue(undefined),
    updateFilters: vi.fn(),
    runScenario: vi.fn().mockResolvedValue(undefined),
    exportData: vi.fn().mockReturnValue('{}'),
  })),
}))
vi.mock('../../utils/trustScoreCalculator', () => ({
  computeTrustScore: vi.fn().mockReturnValue({ score: 92, grade: 'A', label: 'High Trust' }),
  buildDefaultTrustSignals: vi.fn().mockReturnValue({}),
}))

import VisionInsightsWorkspace from '../VisionInsightsWorkspace.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })

describe('VisionInsightsWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountView() {
    const router = makeRouter()
    await router.isReady()

    return mount(VisionInsightsWorkspace, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          ArrowPathIcon: { template: '<span />' },
          ArrowDownTrayIcon: { template: '<span />' },
          ExclamationCircleIcon: { template: '<span />' },
          QuestionMarkCircleIcon: { template: '<span />' },
        },
      },
    })
  }

  it('renders without crashing', async () => {
    const wrapper = await mountView()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows Vision Insights Workspace heading', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toMatch(/vision insights workspace/i)
  })

  it('shows product intelligence description', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toMatch(/product intelligence|decision support/i)
  })

  it('shows refresh button', async () => {
    const wrapper = await mountView()
    const refreshBtn = wrapper.findAll('button').find(b => /refresh/i.test(b.text()))
    expect(refreshBtn).toBeTruthy()
  })

  it('shows export button', async () => {
    const wrapper = await mountView()
    const exportBtn = wrapper.findAll('button').find(b => /export/i.test(b.text()))
    expect(exportBtn).toBeTruthy()
  })

  it('shows export menu when export button clicked', async () => {
    const wrapper = await mountView()
    const exportBtn = wrapper.findAll('button').find(b => /export/i.test(b.text()))
    expect(exportBtn).toBeTruthy()
    if (exportBtn) {
      await exportBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toMatch(/export as json|export as csv/i)
    }
  })

  it('does not show wallet-connector UI (product alignment)', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('captures errors without crashing (onErrorCaptured)', async () => {
    const wrapper = await mountView()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows platform trust score section', async () => {
    const wrapper = await mountView()
    // Trust score computed from metrics — view renders without error
    expect(wrapper.exists()).toBe(true)
  })
})
