/**
 * Unit Tests: AttestationsDashboard
 *
 * Validates rendering, access control, and network-selection behaviour.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import AttestationsDashboard from '../AttestationsDashboard.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/dashboard', name: 'Dashboard', component: { template: '<div />' } },
      { path: '/attestations', name: 'AttestationsDashboard', component: { template: '<div />' } },
    ],
  })

const mountDashboard = (isAuthenticated = true) => {
  const router = makeRouter()
  return mount(AttestationsDashboard, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              isConnected: isAuthenticated,
              user: isAuthenticated ? { address: 'TEST_ADDR', email: 'test@test.com' } : null,
            },
          },
        }),
        router,
      ],
      stubs: {
        MainLayout: { template: '<div><slot /></div>' },
        AttestationsList: { template: '<div data-testid="attestations-list" />' },
      },
    },
  })
}

describe('AttestationsDashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── Heading structure ────────────────────────────────────────────────────

  it('renders the "Compliance Attestations" heading', () => {
    const wrapper = mountDashboard()
    expect(wrapper.text()).toContain('Compliance Attestations')
  })

  it('renders a single h1 for screen-reader orientation', () => {
    const wrapper = mountDashboard()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
  })

  // ── Access control ───────────────────────────────────────────────────────

  it('shows main content when user is authenticated', () => {
    const wrapper = mountDashboard(true)
    expect(wrapper.text()).not.toContain('Access Restricted')
  })

  it('shows access-restricted message when user is not authenticated', () => {
    const wrapper = mountDashboard(false)
    expect(wrapper.text()).toContain('Access Restricted')
  })

  it('shows Go to Dashboard button when access is restricted', () => {
    const wrapper = mountDashboard(false)
    const buttons = wrapper.findAll('button')
    const goButton = buttons.find(b => b.text().includes('Dashboard'))
    expect(goButton).toBeDefined()
  })

  // ── Network selector ─────────────────────────────────────────────────────

  it('renders All Networks network button when authenticated', () => {
    const wrapper = mountDashboard(true)
    expect(wrapper.text()).toContain('All Networks')
  })

  it('renders VOI network button when authenticated', () => {
    const wrapper = mountDashboard(true)
    expect(wrapper.text()).toContain('VOI')
  })

  it('renders Aramid network button when authenticated', () => {
    const wrapper = mountDashboard(true)
    expect(wrapper.text()).toContain('Aramid')
  })

  it('switches selected network when a network button is clicked', async () => {
    const wrapper = mountDashboard(true)
    const voiBtn = wrapper.findAll('button').find(b => b.text() === 'VOI')
    expect(voiBtn).toBeDefined()
    await voiBtn!.trigger('click')
    // After clicking VOI, the active state would switch; we verify via vm
    const vm = wrapper.vm as any
    expect(vm.selectedNetwork).toBe('VOI')
  })

  it('starts with All Networks selected', () => {
    const wrapper = mountDashboard(true)
    const vm = wrapper.vm as any
    expect(vm.selectedNetwork).toBe('All Networks')
  })

  // ── No wallet connector UI ───────────────────────────────────────────────

  it('does not contain wallet connector UI', () => {
    const wrapper = mountDashboard(true)
    const text = wrapper.html()
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})
