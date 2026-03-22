import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import TokenDiscoveryJourney from '../TokenDiscoveryJourney.vue'

vi.mock('../../layout/MainLayout.vue', () => ({
  default: { name: 'MainLayout', template: '<div><slot /></div>' }
}))
vi.mock('../../components/ui/Card.vue', () => ({
  default: { name: 'Card', template: '<div><slot /></div>', props: ['variant', 'padding'] }
}))
vi.mock('../../components/ui/Button.vue', () => ({
  default: { name: 'Button', template: '<button><slot /></button>', props: ['variant'] }
}))
vi.mock('../../components/ui/Badge.vue', () => ({
  default: { name: 'Badge', template: '<span><slot /></span>', props: ['variant', 'size'] }
}))
vi.mock('../../components/discovery/CategoryCard.vue', () => ({
  default: {
    name: 'CategoryCard',
    template: '<div data-testid="category-card">{{ category?.name }}</div>',
    props: ['category', 'selected']
  }
}))
vi.mock('../../components/discovery/OpportunityCard.vue', () => ({
  default: {
    name: 'OpportunityCard',
    template: '<div data-testid="opportunity-card">{{ opportunity?.title }}</div>',
    props: ['opportunity']
  }
}))
vi.mock('../../services/CompetitiveTelemetryService', () => ({
  CompetitiveTelemetryService: {
    getInstance: () => ({
      startJourney: vi.fn(),
      trackFeatureDiscovery: vi.fn(),
    })
  }
}))
vi.mock('../../services/analytics', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  }
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div></div>' } },
      { path: '/token-standards', name: 'TokenStandards', component: { template: '<div></div>' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div></div>' } },
      { path: '/discovery', name: 'TokenDiscoveryJourney', component: { template: '<div></div>' } },
    ]
  })

describe('TokenDiscoveryJourney', () => {
  let router: ReturnType<typeof makeRouter>

  beforeEach(() => {
    router = makeRouter()
  })

  it('renders the discovery heading', async () => {
    const wrapper = mount(TokenDiscoveryJourney, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router
        ]
      }
    })
    await router.isReady()
    expect(wrapper.text()).toContain('Discover')
  })

  it('renders category cards for token standard discovery', async () => {
    const wrapper = mount(TokenDiscoveryJourney, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router
        ]
      }
    })
    await router.isReady()
    const categoryCards = wrapper.findAll('[data-testid="category-card"]')
    expect(categoryCards.length).toBeGreaterThan(0)
  })

  it('renders opportunity cards with telemetry-driven recommendations', async () => {
    const wrapper = mount(TokenDiscoveryJourney, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router
        ]
      }
    })
    await router.isReady()
    const opportunityCards = wrapper.findAll('[data-testid="opportunity-card"]')
    expect(opportunityCards.length).toBeGreaterThan(0)
  })

  it('shows call-to-action for comparing standards', async () => {
    const wrapper = mount(TokenDiscoveryJourney, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router
        ]
      }
    })
    await router.isReady()
    expect(wrapper.text()).toContain('Compare')
  })

  it('does not render wallet connector UI (product alignment: email/password only)', async () => {
    const wrapper = mount(TokenDiscoveryJourney, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router
        ]
      }
    })
    await router.isReady()
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('shows Token Opportunity heading as the hero title', async () => {
    const wrapper = mount(TokenDiscoveryJourney, {
      global: {
        plugins: [
          createTestingPinia({ createSpy: vi.fn }),
          router
        ]
      }
    })
    await router.isReady()
    expect(wrapper.text()).toMatch(/Discover|Token Opportunity/i)
  })
})
