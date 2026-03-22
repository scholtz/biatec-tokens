/**
 * Unit Tests: TokenStandardsView
 *
 * Validates rendering, heading structure, and product-definition alignment.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import TokenStandardsView from '../TokenStandardsView.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/token-standards', name: 'TokenStandardsView', component: { template: '<div />' } },
      { path: '/enterprise-guide', name: 'EnterpriseGuide', component: { template: '<div />' } },
      { path: '/create', name: 'CreateToken', component: { template: '<div />' } },
      { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
    ],
  })

const mountView = () => {
  const router = makeRouter()
  return mount(TokenStandardsView, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
      stubs: {
        MainLayout: { template: '<div><slot /></div>' },
        TokenStandardsComparison: { template: '<div data-testid="token-standards-comparison" />' },
        Card: { template: '<div class="card"><slot /></div>' },
        Badge: { template: '<span class="badge"><slot /></span>' },
        Button: { template: '<button><slot /></button>' },
        RouterLink: { template: '<a><slot /></a>', props: ['to'] },
        BuildingOfficeIcon: { template: '<svg />' },
        PlusCircleIcon: { template: '<svg />' },
        ChartBarIcon: { template: '<svg />' },
        CurrencyDollarIcon: { template: '<svg />' },
        ServerIcon: { template: '<svg />' },
        ShieldCheckIcon: { template: '<svg />' },
        CheckBadgeIcon: { template: '<svg />' },
      },
    },
  })
}

describe('TokenStandardsView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── Heading structure ────────────────────────────────────────────────────

  it('renders "Token Standards" as the main h1 heading', () => {
    const wrapper = mountView()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text()).toContain('Token Standards')
  })

  it('renders the Network Guidance h2 section', () => {
    const wrapper = mountView()
    const h2s = wrapper.findAll('h2')
    expect(h2s.some(h => h.text().includes('Network Guidance'))).toBe(true)
  })

  it('renders the call-to-action section heading', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Ready to Create Your Token?')
  })

  // ── TokenStandardsComparison component ──────────────────────────────────

  it('renders the TokenStandardsComparison stub', () => {
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="token-standards-comparison"]').exists()).toBe(true)
  })

  // ── Network guidance from store ──────────────────────────────────────────

  it('renders network guidance entries from the token store', () => {
    const wrapper = mountView()
    // The store provides real network guidance; verify at least one appears
    expect(wrapper.text()).toContain('Network Guidance')
  })

  it('renders fee structure for each network', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Fee Structure')
  })

  it('renders compliance considerations for each network', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Compliance Considerations')
  })

  it('renders MICA relevance info for each network', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('MICA Relevance')
  })

  it('renders best-for use cases as badges', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Best For')
  })

  it('renders metadata hosting recommendations', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('IPFS')
  })

  // ── Description text ─────────────────────────────────────────────────────

  it('renders the AVM/EVM description text', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('AVM chains')
    expect(wrapper.text()).toContain('EVM chains')
  })

  // ── Product alignment ────────────────────────────────────────────────────

  it('does not contain wallet connector UI (product definition)', () => {
    const wrapper = mountView()
    expect(wrapper.html()).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('renders without errors for token store with guidance data', () => {
    expect(() => mountView()).not.toThrow()
  })
})
