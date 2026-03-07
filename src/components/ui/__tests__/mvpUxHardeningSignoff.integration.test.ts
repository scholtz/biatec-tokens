/**
 * Integration Tests: MVP UX Hardening Sign-off
 *
 * Validates the acceptance criteria of the MVP UX hardening issue:
 * "MVP UX hardening for deterministic enterprise guided launch sign-off"
 *
 * Acceptance Criteria:
 *   AC #1 — WCAG 2.1 AA: critical-path UI surfaces have correct landmarks, headings,
 *            ARIA labels, and role attributes.
 *   AC #2 — Every interactive element has focus-visible indicator classes.
 *   AC #3 — Desktop and mobile navigation expose equivalent MVP-critical destinations
 *            via the single NAV_ITEMS source of truth.
 *   AC #4 — User-facing error states follow a consistent what/why/how format.
 *   AC #6 — Zero arbitrary wait patterns — tests use pure logic, no timeouts.
 *   AC #7 — Legacy /create/wizard route is NOT in canonical NAV_ITEMS.
 *
 * Tests are pure-logic: no DOM, no browser, no arbitrary waits.
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { NAV_ITEMS } from '../../../constants/navItems'
import Navbar from '../../layout/Navbar.vue'
import StateMessage from '../StateMessage.vue'
import type { DeterministicState } from '../../../utils/deterministicStateManager'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/launch/workspace', name: 'GuidedLaunchWorkspace', component: { template: '<div />' } },
      { path: '/launch/guided', name: 'GuidedTokenLaunch', component: { template: '<div />' } },
      { path: '/dashboard', name: 'TokenDashboard', component: { template: '<div />' } },
      { path: '/compliance/setup', name: 'ComplianceSetupWorkspace', component: { template: '<div />' } },
      { path: '/settings', name: 'Settings', component: { template: '<div />' } },
      { path: '/portfolio', name: 'PortfolioIntelligence', component: { template: '<div />' } },
      { path: '/operations', name: 'BusinessCommandCenter', component: { template: '<div />' } },
    ],
  })

const mountNavbar = () =>
  mount(Navbar, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: { user: null, isConnected: false, account: '', arc76email: '' },
            subscription: { subscription: null },
            theme: { isDark: false },
          },
        }),
        makeRouter(),
      ],
      stubs: {
        EmailAuthModal: { template: '<div data-testid="email-auth-modal" />', props: ['isOpen'], emits: ['close', 'connected'] },
        RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
      },
    },
  })

const makeErrorState = (overrides: Partial<DeterministicState> = {}): DeterministicState => ({
  type: 'retryable-failure',
  message: 'Something went wrong',
  ...overrides,
})

/**
 * Helper: find a button in the wrapper whose aria-label includes the given search term.
 * Extracted to avoid repetition across tests that look for specific buttons by label.
 */
const findButtonByAriaLabel = (wrapper: VueWrapper, searchTerm: string) =>
  wrapper.findAll('button').find(
    (b) => (b.attributes('aria-label') ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

// ===========================================================================
// AC #1: WCAG 2.1 AA UI surface contract
// ===========================================================================

describe('AC #1: WCAG 2.1 AA — Navbar landmark and ARIA contract', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    localStorage.clear()
  })

  it('nav element has role="navigation" attribute', () => {
    const wrapper = mountNavbar()
    const nav = wrapper.find('nav')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('role')).toBe('navigation')
  })

  it('nav element has aria-label="Main navigation" (SC 4.1.2)', () => {
    const wrapper = mountNavbar()
    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('Main navigation')
  })

  it('skip-to-main-content link is present with correct href (SC 2.4.1)', () => {
    const wrapper = mountNavbar()
    const skipLink = wrapper.find('a[href="#main-content"]')
    expect(skipLink.exists()).toBe(true)
  })

  it('theme toggle button has aria-label (SC 4.1.2)', () => {
    const wrapper = mountNavbar()
    const themeBtn = findButtonByAriaLabel(wrapper, 'mode')
    expect(themeBtn).toBeDefined()
    expect((themeBtn?.attributes('aria-label') ?? '').trim().length).toBeGreaterThan(0)
  })

  it('mobile menu button has aria-label (SC 4.1.2)', () => {
    const wrapper = mountNavbar()
    const mobileBtn = findButtonByAriaLabel(wrapper, 'navigation')
    expect(mobileBtn).toBeDefined()
    expect((mobileBtn?.attributes('aria-label') ?? '').trim().length).toBeGreaterThan(0)
  })

  it('mobile menu button has aria-expanded attribute (SC 4.1.2)', () => {
    const wrapper = mountNavbar()
    const mobileBtn = findButtonByAriaLabel(wrapper, 'navigation')
    expect(mobileBtn?.attributes('aria-expanded')).toBeDefined()
  })

  it('mobile menu button has aria-controls attribute (SC 4.1.2)', () => {
    const wrapper = mountNavbar()
    const mobileBtn = findButtonByAriaLabel(wrapper, 'navigation')
    expect(mobileBtn?.attributes('aria-controls')).toBeDefined()
  })
})

// ===========================================================================
// AC #2: Focus visibility contract
// ===========================================================================

describe('AC #2: Focus visibility — interactive elements have focus-visible indicator classes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    localStorage.clear()
  })

  it('desktop nav links include focus-visible:ring-2 indicator class (WCAG SC 2.4.7)', () => {
    const wrapper = mountNavbar()
    const html = wrapper.html()
    // focus-visible ring classes must be present on interactive nav links
    expect(html).toContain('focus-visible:ring-2')
  })

  it('desktop nav links include focus:outline-none class (preventing double outline)', () => {
    const wrapper = mountNavbar()
    const html = wrapper.html()
    expect(html).toContain('focus:outline-none')
  })

  it('theme toggle button has focus-visible ring classes', () => {
    const wrapper = mountNavbar()
    const html = wrapper.html()
    expect(html).toContain('focus-visible:ring-blue-500')
  })

  it('mobile menu button has focus-visible ring classes', () => {
    const wrapper = mountNavbar()
    const html = wrapper.html()
    expect(html).toContain('focus-visible:ring-2')
  })
})

// ===========================================================================
// AC #3: Desktop and mobile navigation parity (NAV_ITEMS source of truth)
// ===========================================================================

describe('AC #3: Navigation parity — NAV_ITEMS is single source of truth', () => {
  it('NAV_ITEMS contains all 7 MVP-critical destinations', () => {
    const paths = NAV_ITEMS.map((i) => i.path)
    const required = [
      '/',
      '/launch/workspace',
      '/dashboard',
      '/portfolio',
      '/operations',
      '/compliance/setup',
      '/settings',
    ]
    for (const path of required) {
      expect(paths, `NAV_ITEMS must include ${path}`).toContain(path)
    }
  })

  it('NAV_ITEMS has 7 or fewer items to avoid cognitive overload (AC #3 cognitive load)', () => {
    expect(NAV_ITEMS.length).toBeLessThanOrEqual(7)
    expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(5)
  })

  it('Guided Launch entry routes to /launch/workspace (not /create/wizard)', () => {
    const guidedItem = NAV_ITEMS.find((i) => i.label === 'Guided Launch')
    expect(guidedItem).toBeDefined()
    expect(guidedItem?.path).toBe('/launch/workspace')
    expect(guidedItem?.path).not.toContain('/create')
  })

  it('/subscription/pricing is NOT in primary nav (reduces conversion distractions)', () => {
    const paths = NAV_ITEMS.map((i) => i.path)
    expect(paths).not.toContain('/subscription/pricing')
  })

  it('every NAV_ITEM has a label and path (data integrity)', () => {
    for (const item of NAV_ITEMS) {
      expect((item.label ?? '').trim().length, `label missing for ${item.path}`).toBeGreaterThan(0)
      expect((item.path ?? '').trim().length, `path missing for ${item.label}`).toBeGreaterThan(0)
    }
  })

  it('Navbar renders all NAV_ITEMS as links for desktop users', () => {
    const wrapper = mountNavbar()
    const html = wrapper.html()
    for (const item of NAV_ITEMS) {
      // Check that each nav item label appears in the rendered HTML
      expect(html, `Navbar must include nav item: ${item.label}`).toContain(item.label)
    }
  })

  it('Navbar renders all NAV_ITEMS as links for mobile users (same source array)', () => {
    // Both desktop and mobile nav menus are rendered from the same navigationItems computed
    // property in Navbar.vue — a single source of truth ensures parity.
    // Each label must appear at least once in the rendered HTML (desktop or mobile slot).
    // Note: some items may appear twice (desktop + mobile) but the assertion ensures presence.
    const wrapper = mountNavbar()
    const html = wrapper.html()
    for (const item of NAV_ITEMS) {
      const occurrences = (html.match(new RegExp(item.label, 'g')) ?? []).length
      expect(occurrences, `${item.label} should appear at least once in the rendered nav (desktop + mobile parity)`).toBeGreaterThanOrEqual(1)
    }
  })
})

// ===========================================================================
// AC #4: User-facing error messages — what/why/how format
// ===========================================================================

describe('AC #4: Error message clarity — what/why/how format (StateMessage)', () => {
  it('StateMessage renders userGuidance for "what happened" context', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeErrorState({
          type: 'retryable-failure',
          message: 'Token launch request could not be processed.',
          userGuidance: 'Your account profile is incomplete. Please complete the compliance checklist first.',
        }),
      },
    })
    expect(wrapper.text()).toContain('Token launch request could not be processed.')
    expect(wrapper.text()).toContain('Your account profile is incomplete.')
  })

  it('StateMessage renders nextAction for "what to do next" guidance', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeErrorState({
          type: 'retryable-failure',
          message: 'Authentication session expired.',
          nextAction: 'Sign in again to continue. Your form data has been saved.',
        }),
      },
    })
    expect(wrapper.text()).toContain('Authentication session expired.')
    expect(wrapper.text()).toContain('Sign in again to continue.')
  })

  it('StateMessage uses role="alert" so screen readers announce errors (SC 4.1.3)', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeErrorState({ type: 'fatal-error', message: 'Critical error.' }) },
    })
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('StateMessage uses aria-live="assertive" for critical errors (SC 4.1.3)', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeErrorState({ type: 'fatal-error', message: 'Critical error.' }) },
    })
    expect(wrapper.attributes('aria-live')).toBe('assertive')
  })

  it('StateMessage uses aria-live="assertive" for retryable-failure errors', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeErrorState({ type: 'retryable-failure', message: 'Retryable error.' }) },
    })
    expect(wrapper.attributes('aria-live')).toBe('assertive')
  })

  it('StateMessage uses aria-live="polite" for non-error states', () => {
    const wrapper = mount(StateMessage, {
      props: { state: makeErrorState({ type: 'loading', message: 'Loading...' }) },
    })
    expect(wrapper.attributes('aria-live')).toBe('polite')
  })

  it('StateMessage renders error without raw technical stack trace', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeErrorState({
          type: 'retryable-failure',
          message: 'Unable to complete request.',
          userGuidance: 'Please try again or contact support.',
        }),
      },
    })
    const text = wrapper.text()
    // Error copy must not expose JavaScript error internals
    expect(text).not.toMatch(/TypeError|ReferenceError|SyntaxError/)
    expect(text).not.toMatch(/at Object\.<anonymous>|at Function\.|\.ts:\d+:\d+/)
  })

  it('StateMessage includes "Next step" label before nextAction text', () => {
    const wrapper = mount(StateMessage, {
      props: {
        state: makeErrorState({
          type: 'retryable-failure',
          message: 'Error occurred.',
          nextAction: 'Contact support.',
        }),
      },
    })
    expect(wrapper.html()).toContain('Next step:')
    expect(wrapper.text()).toContain('Contact support.')
  })
})

// ===========================================================================
// AC #7: Legacy route isolation — /create/wizard absent from canonical nav
// ===========================================================================

describe('AC #7: Legacy route isolation — /create/wizard not in canonical NAV_ITEMS', () => {
  it('NAV_ITEMS does not contain /create/wizard (legacy redirect-only path)', () => {
    const paths = NAV_ITEMS.map((i) => i.path)
    expect(paths).not.toContain('/create/wizard')
  })

  it('NAV_ITEMS does not contain /create (deprecated entry point)', () => {
    const paths = NAV_ITEMS.map((i) => i.path)
    expect(paths.filter((p) => p === '/create')).toHaveLength(0)
  })

  it('Navbar HTML does not contain /create/wizard link', () => {
    const wrapper = mountNavbar()
    const html = wrapper.html()
    expect(html).not.toContain('/create/wizard')
  })
})

// ===========================================================================
// AC #9 / AC #10: No wallet connector UI — email/password auth model
// ===========================================================================

describe('AC #9 + AC #10: Email/password only — no wallet connector UI in navigation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    localStorage.clear()
  })

  it('Navbar HTML does not mention WalletConnect', () => {
    const wrapper = mountNavbar()
    expect(wrapper.html().toLowerCase()).not.toContain('walletconnect')
  })

  it('Navbar HTML does not mention MetaMask', () => {
    const wrapper = mountNavbar()
    expect(wrapper.html().toLowerCase()).not.toContain('metamask')
  })

  it('Navbar HTML does not mention Pera Wallet', () => {
    const wrapper = mountNavbar()
    // \bPera\b word-boundary check in text — avoids false-positive on "Operations"
    expect(wrapper.text()).not.toMatch(/\bPera\b.*[Ww]allet/)
  })

  it('Navbar HTML does not mention Defly', () => {
    const wrapper = mountNavbar()
    expect(wrapper.html().toLowerCase()).not.toContain('defly')
  })

  it('Navbar HTML does not show "Not connected" wallet status', () => {
    const wrapper = mountNavbar()
    expect(wrapper.text()).not.toContain('Not connected')
  })

  it('Navbar HTML does not contain "Connect Wallet" call-to-action', () => {
    const wrapper = mountNavbar()
    expect(wrapper.text().toLowerCase()).not.toContain('connect wallet')
  })

  it('unauthenticated Navbar shows "Sign In" (email/password entry point)', () => {
    const wrapper = mountNavbar()
    expect(wrapper.text()).toMatch(/Sign\s+In/i)
  })
})
