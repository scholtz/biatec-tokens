/**
 * EnterpriseGuideView Tests
 * 
 * Tests for the Enterprise Decision Guide view, which helps operators select
 * the right token standard for regulated enterprise use cases.
 * 
 * Business value: Operators choosing the wrong token standard delays compliance
 * and revenue. This view directly supports the product alignment goal of
 * serving non-crypto-native enterprise customers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import EnterpriseGuideView from '../EnterpriseGuideView.vue'

// Stub complex sub-components
vi.mock('../../components/EnterpriseDecisionGuide.vue', () => ({
  default: {
    name: 'EnterpriseDecisionGuide',
    template: '<div data-testid="enterprise-decision-guide">Decision Guide Content</div>',
  },
}))

vi.mock('../../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div data-testid="main-layout"><slot /></div>',
  },
}))

vi.mock('../../components/ui/Button.vue', () => ({
  default: {
    name: 'Button',
    template: '<button><slot /><slot name="icon" /></button>',
  },
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/enterprise-guide', component: EnterpriseGuideView },
      { path: '/token-standards', component: { template: '<div />' } },
    ],
  })

describe('EnterpriseGuideView', () => {
  let router: ReturnType<typeof makeRouter>

  beforeEach(async () => {
    vi.clearAllMocks()
    router = makeRouter()
    await router.push('/enterprise-guide')
    await router.isReady()
  })

  const mountView = () =>
    mount(EnterpriseGuideView, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), router],
        stubs: {
          MainLayout: { template: '<div><slot /></div>' },
          RouterLink: { template: '<a><slot /></a>' },
          Button: { template: '<button><slot /><slot name="icon" /></button>' },
          EnterpriseDecisionGuide: { template: '<div data-testid="enterprise-decision-guide">Decision Guide</div>' },
          ChartBarSquareIcon: { template: '<span />' },
        },
      },
    })

  it('renders the Enterprise Decision Guide heading', () => {
    const wrapper = mountView()
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Enterprise Decision Guide')
  })

  it('renders descriptive text for operators', () => {
    const wrapper = mountView()
    const html = wrapper.html()
    expect(html).toMatch(/token standard|enterprise/i)
  })

  it('includes the EnterpriseDecisionGuide component', () => {
    const wrapper = mountView()
    const guide = wrapper.find('[data-testid="enterprise-decision-guide"]')
    expect(guide.exists()).toBe(true)
  })

  it('provides a link to Full Comparison (token standards)', () => {
    const wrapper = mountView()
    const html = wrapper.html()
    expect(html).toMatch(/Full Comparison|token-standards/i)
  })

  it('does not render wallet connector UI (product alignment)', () => {
    const wrapper = mountView()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})
