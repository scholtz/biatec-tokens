/**
 * Settings View Tests
 * 
 * Tests for the Settings view component, covering network configuration UI,
 * accessibility, and product alignment (no wallet connector UI, email/password only).
 * 
 * Business value: Operator trust requires settings to be reliable and correctly
 * configured for backend network connections used in release evidence collection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import Settings from '../Settings.vue'

// Mock child components to isolate Settings tests
vi.mock('../../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div data-testid="main-layout"><slot /></div>',
  },
}))

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }, { path: '/settings', component: Settings }],
  })

const mountSettings = async (pinia?: ReturnType<typeof createTestingPinia>) => {
  const router = makeRouter()
  await router.push('/settings')
  await router.isReady()

  const p = pinia ?? createTestingPinia({ createSpy: vi.fn })

  const wrapper = mount(Settings, {
    global: {
      plugins: [p, router],
      stubs: {
        MainLayout: { template: '<div><slot /></div>' },
      },
    },
  })
  return { wrapper, router }
}

describe('Settings View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Settings heading', async () => {
    const { wrapper } = await mountSettings()
    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toContain('Settings')
  })

  it('contains network configuration section', async () => {
    const { wrapper } = await mountSettings()
    const html = wrapper.html()
    expect(html).toMatch(/Network Configuration/i)
  })

  it('shows Active Network radio group', async () => {
    const { wrapper } = await mountSettings()
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios.length).toBeGreaterThan(0)
  })

  it('shows Algod URL input field', async () => {
    const { wrapper } = await mountSettings()
    const algodInput = wrapper.find('#algod-url')
    expect(algodInput.exists()).toBe(true)
  })

  it('shows Indexer URL input field', async () => {
    const { wrapper } = await mountSettings()
    const indexerInput = wrapper.find('#indexer-url')
    expect(indexerInput.exists()).toBe(true)
  })

  it('contains export settings button', async () => {
    const { wrapper } = await mountSettings()
    const html = wrapper.html()
    expect(html).toMatch(/Export Settings|export/i)
  })

  it('does not render wallet connector UI (product alignment)', async () => {
    const { wrapper } = await mountSettings()
    const html = wrapper.html()
    expect(html).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  it('fieldset uses legend for network radio group (accessibility)', async () => {
    const { wrapper } = await mountSettings()
    const legend = wrapper.find('legend')
    expect(legend.exists()).toBe(true)
    expect(legend.text()).toMatch(/Active Network/i)
  })

  it('Algod URL input uses URL type for browser validation', async () => {
    const { wrapper } = await mountSettings()
    const algodInput = wrapper.find('#algod-url')
    expect(algodInput.attributes('type')).toBe('url')
  })

  it('Algod token input uses password type for security', async () => {
    const { wrapper } = await mountSettings()
    const tokenInput = wrapper.find('#algod-token')
    expect(tokenInput.exists()).toBe(true)
    expect(tokenInput.attributes('type')).toBe('password')
  })
})
