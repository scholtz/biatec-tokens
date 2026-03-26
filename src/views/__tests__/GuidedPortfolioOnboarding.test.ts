/**
 * Unit Tests: GuidedPortfolioOnboarding
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useRoute: vi.fn(() => ({ params: {}, query: {} })),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('../../services/analytics', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

vi.mock('../../utils/portfolioOnboarding', () => ({
  deriveOnboardingSteps: vi.fn(() => []),
  getNextStep: vi.fn(() => null),
  calculateOnboardingProgress: vi.fn(() => 0),
  computePortfolioDeltas: vi.fn(() => []),
  savePortfolioSnapshot: vi.fn(),
  loadPortfolioSnapshot: vi.fn(() => null),
  evaluateActionReadiness: vi.fn(() => ({ checks: [], canProceed: false })),
  buildOnboardingAnalyticsPayload: vi.fn((event: string) => ({ event })),
}))

import GuidedPortfolioOnboarding from '../GuidedPortfolioOnboarding.vue'
import { analyticsService } from '../../services/analytics'
import * as portfolioOnboarding from '../../utils/portfolioOnboarding'

const mountView = () =>
  mount(GuidedPortfolioOnboarding, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: { user: null, isConnected: false },
            tokens: { tokens: [] },
          },
        }),
      ],
      stubs: {
        MainLayout: { template: '<div><slot /></div>' },
        GuidedNextStepModule: true,
        ActionReadinessIndicator: { template: '<div><slot name="proceed" /></div>' },
        PortfolioContinuityPanel: true,
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })

describe('GuidedPortfolioOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('mounts and renders the page heading "Portfolio Onboarding"', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Portfolio Onboarding')
  })

  it('does NOT show the return-user banner for new users (no snapshot)', async () => {
    vi.mocked(portfolioOnboarding.loadPortfolioSnapshot).mockReturnValue(null)
    const wrapper = mountView()
    await nextTick()
    const banner = wrapper.find('[role="status"]')
    expect(banner.exists()).toBe(false)
  })

  it('shows the return-user welcome banner when previousSnapshot is loaded', async () => {
    vi.mocked(portfolioOnboarding.loadPortfolioSnapshot).mockReturnValue({
      tokenCount: 2,
      deployedCount: 1,
      complianceScore: 80,
      capturedAt: new Date().toISOString(),
    })
    const wrapper = mountView()
    await nextTick()
    const banner = wrapper.find('[role="status"]')
    expect(banner.exists()).toBe(true)
    expect(wrapper.text()).toContain('Welcome back')
  })

  it('renders the quick actions section when onboarding is complete (progress=100%)', async () => {
    vi.mocked(portfolioOnboarding.calculateOnboardingProgress).mockReturnValue(100)
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.text()).toContain('Quick Actions')
  })

  it('does NOT render quick actions when onboarding is incomplete', async () => {
    vi.mocked(portfolioOnboarding.calculateOnboardingProgress).mockReturnValue(50)
    const wrapper = mountView()
    await nextTick()
    expect(wrapper.text()).not.toContain('Quick Actions')
  })

  it('calls analyticsService.trackEvent with onboarding_started on mount for new users', async () => {
    vi.mocked(portfolioOnboarding.loadPortfolioSnapshot).mockReturnValue(null)
    vi.mocked(portfolioOnboarding.buildOnboardingAnalyticsPayload).mockImplementation(
      (event: string) => ({ event }),
    )
    mountView()
    await nextTick()
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'onboarding_started' }),
    )
  })

  it('calls analyticsService.trackEvent with return_session_started for returning users', async () => {
    vi.mocked(portfolioOnboarding.loadPortfolioSnapshot).mockReturnValue({
      tokenCount: 1,
      deployedCount: 0,
      complianceScore: 60,
      capturedAt: new Date().toISOString(),
    })
    vi.mocked(portfolioOnboarding.buildOnboardingAnalyticsPayload).mockImplementation(
      (event: string) => ({ event }),
    )
    mountView()
    await nextTick()
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'return_session_started' }),
    )
  })

  it('calls savePortfolioSnapshot on mount', async () => {
    mountView()
    await nextTick()
    expect(portfolioOnboarding.savePortfolioSnapshot).toHaveBeenCalled()
  })
})
