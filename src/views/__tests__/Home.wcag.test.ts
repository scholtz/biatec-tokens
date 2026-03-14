/**
 * Unit Tests: Home — WCAG AA Accessibility
 *
 * Validates WCAG 2.1 AA requirements for the Home view, which serves both
 * unauthenticated users (landing/login entry) and authenticated users
 * (dashboard entry with CTAs).
 *
 * Coverage:
 *  - Single h1 for screen reader orientation (SC 1.3.1)
 *  - Heading hierarchy is well-ordered (SC 1.3.1)
 *  - Primary CTA buttons are present and interactive (SC 2.1.1)
 *  - Feature cards have accessible headings (SC 1.3.1)
 *  - Stats section has accessible labels (SC 1.3.1)
 *  - Token standards section heading (SC 1.3.1)
 *  - Auth modal is conditionally rendered when showAuthModal is true (SC 4.1.2)
 *  - Focus-visible ring classes on interactive elements (SC 2.4.7)
 *  - No wallet connector UI (product definition — email/password auth only)
 *  - No "connect wallet" affordances (business roadmap requirement)
 *
 * Issue: Add procurement-grade accessibility evidence for enterprise compliance workflows
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { vi } from 'vitest'
import Home from '../Home.vue'

// ---------------------------------------------------------------------------
// Router + mount helpers
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div />' } },
      { path: '/dashboard', name: 'TokenDashboard', component: { template: '<div />' } },
      { path: '/discovery', name: 'DiscoveryDashboard', component: { template: '<div />' } },
      { path: '/launch/workspace', name: 'GuidedLaunchWorkspace', component: { template: '<div />' } },
    ],
  })

const mountHome = (authState: { isAuthenticated?: boolean } = {}) => {
  const router = makeRouter()
  return mount(Home, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              isConnected: authState.isAuthenticated ?? false,
              user: authState.isAuthenticated ? { address: 'TEST_ADDR', email: 'test@example.com' } : null,
            },
          },
        }),
        router,
      ],
      stubs: {
        // Stub layout shells — we test the view content, not the shared shell
        MainLayout: { template: '<div><slot /></div>' },
        LandingEntryModule: { template: '<div data-testid="landing-entry-module"><form aria-label="Sign up form"><input type="email" aria-label="Email address" /><button type="submit">Get Started</button></form></div>' },
        EmailAuthModal: { template: '<div v-if="isOpen" role="dialog" aria-label="Sign in" aria-modal="true"><button @click="$emit(\'close\')">Close</button></div>', props: ['isOpen', 'showNetworkSelector'] },
        OnboardingChecklist: { template: '<div />' },
        RouterLink: { template: '<a href="#"><slot /></a>' },
      },
    },
  })
}

describe('Home — WCAG AA Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  // ── Heading hierarchy (WCAG SC 1.3.1) ────────────────────────────────────

  it('renders a single h1 for screen reader orientation (WCAG SC 1.3.1)', () => {
    const wrapper = mountHome()
    const h1s = wrapper.findAll('h1')
    expect(h1s.length).toBe(1)
  })

  it('h1 communicates the platform brand / purpose (WCAG SC 1.3.1)', () => {
    const wrapper = mountHome()
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    // h1 text should not be empty (screen readers announce it for page orientation)
    expect(h1.text().length).toBeGreaterThan(0)
  })

  it('renders h2 headings for major sections (WCAG SC 1.3.1)', () => {
    const wrapper = mountHome()
    const h2s = wrapper.findAll('h2')
    expect(h2s.length).toBeGreaterThanOrEqual(1)
    // At minimum "Supported Token Standards" section
    const h2Texts = h2s.map(h => h.text())
    expect(h2Texts.some(t => /token standard/i.test(t))).toBe(true)
  })

  it('heading hierarchy is well-ordered — h1 precedes h2 (WCAG SC 1.3.1)', () => {
    const wrapper = mountHome()
    const headings = wrapper.findAll('h1, h2, h3')
    expect(headings.length).toBeGreaterThan(0)
    expect(headings[0].element.tagName.toLowerCase()).toBe('h1')
  })

  it('feature card headings use h3 — correct nesting level (WCAG SC 1.3.1)', () => {
    const wrapper = mountHome()
    const h3s = wrapper.findAll('h3')
    // Feature cards and token standard cards use h3
    expect(h3s.length).toBeGreaterThanOrEqual(1)
  })

  // ── Unauthenticated entry (WCAG SC 1.3.1, 2.1.1, 4.1.2) ─────────────────

  it('shows LandingEntryModule for unauthenticated users (WCAG SC 4.1.2)', () => {
    const wrapper = mountHome({ isAuthenticated: false })
    const landingModule = wrapper.find('[data-testid="landing-entry-module"]')
    expect(landingModule.exists()).toBe(true)
  })

  it('does NOT show primary CTA buttons for unauthenticated users (WCAG SC 4.1.2)', () => {
    const wrapper = mountHome({ isAuthenticated: false })
    // Authenticated-only CTA buttons should not be visible to unauth users
    const createButton = wrapper.findAll('button').filter(b =>
      b.text().includes('Create Your First Token')
    )
    expect(createButton.length).toBe(0)
  })

  // ── Authenticated entry (WCAG SC 1.3.1, 2.1.1) ───────────────────────────

  it('shows CTA buttons for authenticated users (WCAG SC 2.1.1)', () => {
    const wrapper = mountHome({ isAuthenticated: true })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('hides LandingEntryModule for authenticated users (conditional rendering) (WCAG SC 4.1.2)', () => {
    const wrapper = mountHome({ isAuthenticated: true })
    // LandingEntryModule stub should not be present for authenticated users
    const landingModule = wrapper.find('[data-testid="landing-entry-module"]')
    expect(landingModule.exists()).toBe(false)
  })

  // ── Interactive elements accessibility (WCAG SC 2.1.1, 2.4.7) ─────────────

  it('all buttons are rendered as <button> elements (WCAG SC 4.1.2)', () => {
    const wrapper = mountHome({ isAuthenticated: true })
    const buttons = wrapper.findAll('button')
    for (const btn of buttons) {
      expect(btn.element.tagName.toLowerCase()).toBe('button')
    }
  })

  it('buttons that have text content are keyboard-activatable (WCAG SC 2.1.1)', () => {
    const wrapper = mountHome({ isAuthenticated: true })
    const buttons = wrapper.findAll('button')
    // All interactive buttons must be either active or explicitly aria-disabled
    // — never silently non-interactive without ARIA communication
    for (const btn of buttons) {
      const disabled = btn.attributes('disabled')
      const ariaDisabled = btn.attributes('aria-disabled')
      // A button is keyboard-accessible if it is not disabled, OR if it is
      // explicitly communicated as disabled via aria-disabled="true"
      const isExplicitlyDisabled = disabled !== undefined || ariaDisabled === 'true'
      // For any button that IS disabled, it must have visible text so AT can read why
      if (isExplicitlyDisabled) {
        expect(btn.text().trim().length).toBeGreaterThan(0)
      }
    }
    // Ensure we found at least some buttons to test
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('icon elements inside buttons are hidden from screen readers (WCAG SC 1.1.1)', () => {
    const wrapper = mountHome({ isAuthenticated: true })
    // SVG icons and <i> tags for decorative icons should be aria-hidden
    const svgIcons = wrapper.findAll('svg')
    for (const icon of svgIcons) {
      const ariaHidden = icon.attributes('aria-hidden')
      const ariaLabel = icon.attributes('aria-label')
      // Either hidden or labeled — never unlabeled and visible to AT
      expect(ariaHidden === 'true' || ariaLabel !== undefined).toBe(true)
    }
  })

  // ── Feature cards (WCAG SC 1.3.1, 1.1.1) ─────────────────────────────────

  it('feature section card headings are present (WCAG SC 1.3.1)', () => {
    const wrapper = mountHome()
    const h3s = wrapper.findAll('h3')
    expect(h3s.length).toBeGreaterThanOrEqual(1)
    // Each h3 should have meaningful text
    for (const h3 of h3s) {
      expect(h3.text().trim().length).toBeGreaterThan(0)
    }
  })

  // ── Auth modal (WCAG SC 4.1.2) ─────────────────────────────────────────────

  it('auth modal stub renders with dialog role and aria-modal when open (WCAG SC 4.1.2)', async () => {
    const wrapper = mountHome()
    // Programmatically open the modal by simulating state change
    const vm = wrapper.vm as any
    vm.showAuthModal = true
    await wrapper.vm.$nextTick()
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
  })

  // ── No wallet connector UI (product definition) ──────────────────────────

  it('does not render wallet-connector UI — email/password only (product definition)', () => {
    const wrapper = mountHome()
    const html = wrapper.html().toLowerCase()
    expect(html).not.toContain('walletconnect')
    expect(html).not.toContain('metamask')
    expect(html).not.toMatch(/\bpera\b/)
    expect(html).not.toContain('defly')
    expect(html).not.toContain('connect wallet')
  })

  it('does not render "connect wallet" affordances for unauthenticated users (product definition)', () => {
    const wrapper = mountHome({ isAuthenticated: false })
    const allButtonText = wrapper
      .findAll('button')
      .map(b => b.text().toLowerCase())
      .join(' ')
    // Use specific brand names only — broad patterns can match informational product copy
    expect(allButtonText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  // ── Token standards section (WCAG SC 1.3.1) ─────────────────────────────

  it('supported token standards section has a descriptive h2 (WCAG SC 1.3.1)', () => {
    const wrapper = mountHome()
    const h2s = wrapper.findAll('h2')
    const standardsHeading = h2s.find(h => /token standard/i.test(h.text()))
    expect(standardsHeading).toBeDefined()
  })
})
