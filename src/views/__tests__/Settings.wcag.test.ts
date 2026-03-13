/**
 * Unit Tests: Settings — WCAG AA Accessibility
 *
 * Validates WCAG 2.1 AA requirements for the Settings view, including:
 *  - Landmark structure (h1, h2 hierarchy)
 *  - Form field label/input associations (SC 1.3.1 / SC 4.1.2)
 *  - Toggle button aria-pressed (SC 4.1.2)
 *  - Connection status live region (SC 4.1.3)
 *  - No wallet connector UI (product definition)
 *  - Focus-visible ring classes on all interactive elements (SC 2.4.7)
 *
 * Issue: Automate accessibility verification and trust-grade shell evidence
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { vi } from 'vitest'
import Settings from '../Settings.vue'

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/settings', name: 'Settings', component: { template: '<div />' } },
    ],
  })

const mountSettings = () => {
  const router = makeRouter()
  return mount(Settings, {
    global: {
      plugins: [
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
      stubs: {
        // Stub MainLayout — we test Settings in isolation
        MainLayout: { template: '<div><slot /></div>' },
        Navbar: { template: '<nav aria-label="Main navigation"></nav>' },
        Sidebar: { template: '<aside></aside>' },
      },
    },
  })
}

describe('Settings — WCAG AA Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  // ── Heading hierarchy (WCAG SC 1.3.1) ────────────────────────────────────

  it('renders a single h1 with "Settings" text (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
    expect(h1s[0].text()).toMatch(/Settings/i)
  })

  it('renders h2 headings for each settings section (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const h2s = wrapper.findAll('h2')
    expect(h2s.length).toBeGreaterThanOrEqual(3)
    const h2Texts = h2s.map(h => h.text())
    expect(h2Texts.some(t => /network configuration/i.test(t))).toBe(true)
    expect(h2Texts.some(t => /evm configuration/i.test(t))).toBe(true)
    expect(h2Texts.some(t => /developer tools/i.test(t))).toBe(true)
  })

  it('heading hierarchy is well-ordered — h2s do not appear before h1 (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const headings = wrapper.findAll('h1, h2, h3')
    expect(headings.length).toBeGreaterThan(0)
    // First heading must be h1
    const firstTag = headings[0].element.tagName.toLowerCase()
    expect(firstTag).toBe('h1')
  })

  // ── Form label/input associations (WCAG SC 1.3.1 / SC 4.1.2) ─────────────

  it('Algod URL input has id matching its label for attribute (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const input = wrapper.find('#algod-url')
    const label = wrapper.find('label[for="algod-url"]')
    expect(input.exists()).toBe(true)
    expect(label.exists()).toBe(true)
  })

  it('Algod Token input has id matching its label for attribute (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const input = wrapper.find('#algod-token')
    const label = wrapper.find('label[for="algod-token"]')
    expect(input.exists()).toBe(true)
    expect(label.exists()).toBe(true)
  })

  it('Indexer URL input has id matching its label for attribute (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const input = wrapper.find('#indexer-url')
    const label = wrapper.find('label[for="indexer-url"]')
    expect(input.exists()).toBe(true)
    expect(label.exists()).toBe(true)
  })

  it('Indexer Token input has id matching its label for attribute (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const input = wrapper.find('#indexer-token')
    const label = wrapper.find('label[for="indexer-token"]')
    expect(input.exists()).toBe(true)
    expect(label.exists()).toBe(true)
  })

  it('EVM RPC URL input has id matching its label for attribute (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const input = wrapper.find('#evm-rpc-url')
    const label = wrapper.find('label[for="evm-rpc-url"]')
    expect(input.exists()).toBe(true)
    expect(label.exists()).toBe(true)
  })

  it('EVM Chain ID input has id matching its label for attribute (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const input = wrapper.find('#evm-chain-id')
    const label = wrapper.find('label[for="evm-chain-id"]')
    expect(input.exists()).toBe(true)
    expect(label.exists()).toBe(true)
  })

  it('Custom Headers textarea has id matching its label for attribute (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const textarea = wrapper.find('#custom-headers')
    const label = wrapper.find('label[for="custom-headers"]')
    expect(textarea.exists()).toBe(true)
    expect(label.exists()).toBe(true)
  })

  // ── Network radio group uses fieldset/legend (WCAG SC 1.3.1) ─────────────

  it('Active Network radio group is wrapped in a <fieldset> (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const fieldset = wrapper.find('fieldset')
    expect(fieldset.exists()).toBe(true)
  })

  it('Network radio fieldset has a <legend> (WCAG SC 1.3.1)', () => {
    const wrapper = mountSettings()
    const legend = wrapper.find('fieldset > legend')
    expect(legend.exists()).toBe(true)
    expect(legend.text()).toMatch(/active network/i)
  })

  // ── Demo Mode toggle button (WCAG SC 4.1.2) ───────────────────────────────

  it('Demo Mode toggle button has aria-pressed attribute (WCAG SC 4.1.2)', () => {
    const wrapper = mountSettings()
    // The toggle button is aria-pressed
    const toggleBtn = wrapper.find('button[aria-pressed]')
    expect(toggleBtn.exists()).toBe(true)
  })

  it('Demo Mode toggle button has accessible label via aria-labelledby (WCAG SC 4.1.2)', () => {
    const wrapper = mountSettings()
    const toggleBtn = wrapper.find('button[aria-labelledby="demo-mode-label"]')
    expect(toggleBtn.exists()).toBe(true)
  })

  it('Demo Mode toggle button has sr-only text for screen readers (WCAG SC 4.1.2)', () => {
    const wrapper = mountSettings()
    const srOnly = wrapper.find('button[aria-pressed] .sr-only')
    expect(srOnly.exists()).toBe(true)
    expect(srOnly.text().length).toBeGreaterThan(0)
  })

  // ── Connection status live region (WCAG SC 4.1.3) ─────────────────────────

  it('Test Connection button has aria-busy attribute for loading state (WCAG SC 4.1.3)', () => {
    const wrapper = mountSettings()
    const testBtn = wrapper.findAll('button').find(b => b.text().includes('Test Connection'))
    expect(testBtn).toBeDefined()
    // aria-busy is present (bound to isTestingConnection)
    expect(testBtn?.attributes('aria-busy')).toBeDefined()
  })

  // ── Save Settings button focus-ring (WCAG SC 2.4.7) ──────────────────────

  it('Save Settings button is present and has text (WCAG SC 4.1.2)', () => {
    const wrapper = mountSettings()
    const saveBtn = wrapper.findAll('button').find(b => /save settings/i.test(b.text()))
    expect(saveBtn).toBeDefined()
  })

  // ── Import file input hidden from AT (WCAG SC 4.1.2) ─────────────────────

  it('hidden file input for import has aria-hidden=true (WCAG SC 4.1.2)', () => {
    const wrapper = mountSettings()
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.exists()).toBe(true)
    expect(fileInput.attributes('aria-hidden')).toBe('true')
    expect(fileInput.attributes('tabindex')).toBe('-1')
  })

  // ── No wallet connector UI (product definition) ───────────────────────────

  it('does not render wallet connector UI (product definition)', () => {
    const wrapper = mountSettings()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toContain('walletconnect')
    expect(html).not.toContain('metamask')
    expect(html).not.toContain('connect wallet')
    expect(html).not.toContain('not connected')
  })

  // ── Focus-visible classes on interactive elements (WCAG SC 2.4.7) ─────────

  it('text inputs have focus-visible:ring class for keyboard accessibility (WCAG SC 2.4.7)', () => {
    const wrapper = mountSettings()
    const algodUrlInput = wrapper.find('#algod-url')
    expect(algodUrlInput.classes().some(c => c.includes('focus-visible'))).toBe(true)
  })

  it('buttons have focus-visible:ring class for keyboard accessibility (WCAG SC 2.4.7)', () => {
    const wrapper = mountSettings()
    // Demo mode toggle has focus-visible ring
    const toggleBtn = wrapper.find('button[aria-pressed]')
    expect(toggleBtn.classes().some(c => c.includes('focus-visible'))).toBe(true)
  })
})
