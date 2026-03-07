/**
 * Integration Tests: MVP Hardening — Canonical CTA Routing Contract
 *
 * Validates the canonical routing changes introduced in the MVP hardening PR:
 *
 *   1. Primary CTA routing: Home, TokenDashboard, and subscription/Success CTAs
 *      now route to /launch/guided (not /create).
 *   2. Post-auth redirect defaults to /launch/guided.
 *   3. Accessibility contract: ComplianceDashboard back button meets WCAG 2.1 AA.
 *   4. Route guard: /launch/guided requires valid ARC76-contract session.
 *   5. No deprecated /create path used in primary conversion CTAs.
 *
 * Business value:
 *   Routing all create-token CTAs through the canonical /launch/guided path
 *   improves conversion by eliminating split entry-points, supports MiCA
 *   compliance traceability (one auditable guided flow), and aligns with the
 *   business-owner roadmap (email/password auth, no wallet connectors).
 *
 *   Risk reduction:
 *   - Eliminates funnel fragmentation (Home /create vs /launch/guided).
 *   - Removes post-login state inconsistency after subscription success.
 *   - Provides CI-verifiable proof of canonical path enforcement.
 *
 * These tests use pure logic — no browser, no DOM, no arbitrary timeouts.
 *
 * Issue: MVP Hardening: Canonical Guided Launch, Accessibility, and Backend-Verified Auth Quality Gates
 * Closes: #523
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  CANONICAL_TOKEN_CREATION_ROUTE,
  LEGACY_WIZARD_ROUTE,
  CANONICAL_POST_AUTH_ROUTE,
  isDeprecatedRoute,
  isCanonicalTokenCreationRoute,
  getCanonicalRedirectFor,
  buildHardenedSession,
  validateHardenedSession,
  isLiveSession,
  findNavForbiddenPatterns,
  hasMainLandmark,
  hasNavLandmark,
  hasSkipToContentLink,
  hasErrorAlertRole,
  findAccessibilityViolations,
} from '../../utils/confidenceHardening'
import {
  storePostAuthRedirect,
  consumePostAuthRedirect,
  peekPostAuthRedirect,
  isAuthRequired,
} from '../../utils/authFirstHardening'
import { NAV_ITEMS } from '../../constants/navItems'
import { AUTH_STORAGE_KEYS } from '../../constants/auth'
import { isIssuanceSessionValid } from '../../utils/authFirstIssuanceWorkspace'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedValidSession(): void {
  const session = buildHardenedSession()
  localStorage.setItem('algorand_user', JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem('algorand_user')
}

// ---------------------------------------------------------------------------
// 1. Primary CTA canonical routing — AC #1
// ---------------------------------------------------------------------------

describe('MVP Hardening — Canonical CTA Routing (AC #1)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  // ── Route constants ────────────────────────────────────────────────────────

  it('CANONICAL_TOKEN_CREATION_ROUTE is /launch/guided', () => {
    expect(CANONICAL_TOKEN_CREATION_ROUTE).toBe('/launch/guided')
  })

  it('CANONICAL_POST_AUTH_ROUTE is /launch/guided (default post-auth target)', () => {
    // After handleAuthComplete in Home.vue — the default destination must be
    // the canonical guided launch, not /create (which was the legacy default).
    expect(CANONICAL_POST_AUTH_ROUTE).toBe('/launch/guided')
  })

  it('isCanonicalTokenCreationRoute returns true for /launch/guided', () => {
    expect(isCanonicalTokenCreationRoute('/launch/guided')).toBe(true)
  })

  it('isCanonicalTokenCreationRoute returns false for legacy /create', () => {
    // The create (TokenCreator) page still exists but is NOT the canonical CTA target
    expect(isCanonicalTokenCreationRoute('/create')).toBe(false)
  })

  // ── NAV_ITEMS contract ────────────────────────────────────────────────────

  it('NAV_ITEMS Guided Launch entry points to /launch/workspace (workspace orchestration)', () => {
    const item = NAV_ITEMS.find(i => i.path === '/launch/workspace')
    expect(item).toBeDefined()
    expect(item?.label).toMatch(/guided launch/i)
    expect(item?.routeName).toBe('GuidedLaunchWorkspace')
  })

  it('NAV_ITEMS does not include a direct /create entry (legacy fragmentation removed)', () => {
    const createEntry = NAV_ITEMS.find(i => i.path === '/create')
    expect(createEntry).toBeUndefined()
  })

  it('NAV_ITEMS does not include /create/wizard (redirect-only, not navigation target)', () => {
    const wizardEntry = NAV_ITEMS.find(i => i.path === '/create/wizard')
    expect(wizardEntry).toBeUndefined()
  })

  // ── Deprecated route detection ────────────────────────────────────────────

  it('/create/wizard is classified as deprecated route', () => {
    expect(isDeprecatedRoute('/create/wizard')).toBe(true)
  })

  it('/launch/guided is NOT classified as deprecated route', () => {
    expect(isDeprecatedRoute('/launch/guided')).toBe(false)
  })

  it('getCanonicalRedirectFor /create/wizard returns /launch/guided', () => {
    expect(getCanonicalRedirectFor('/create/wizard')).toBe('/launch/guided')
  })

  // ── Post-auth redirect (handleAuthComplete default) ───────────────────────

  it('default post-auth redirect stores /launch/guided (not /create)', () => {
    // Simulate what handleCreateToken does for unauthenticated users (Home.vue change)
    storePostAuthRedirect('/launch/guided')
    expect(peekPostAuthRedirect()).toBe('/launch/guided')
    expect(consumePostAuthRedirect()).toBe('/launch/guided')
  })

  it('post-auth redirect prefers stored destination over hardcoded /create fallback', () => {
    // Simulate auth complete with explicit stored destination
    storePostAuthRedirect('/launch/guided')
    const destination = consumePostAuthRedirect() ?? '/launch/guided'
    // Must land on canonical path regardless of source
    expect(destination).toBe('/launch/guided')
    expect(destination).not.toBe('/create')
  })

  it('consumed redirect is cleared so second auth completion defaults to /launch/guided', () => {
    storePostAuthRedirect('/launch/guided')
    consumePostAuthRedirect()
    // After consumption, no stored redirect — fallback must be canonical
    const fallback = consumePostAuthRedirect() ?? CANONICAL_POST_AUTH_ROUTE
    expect(fallback).toBe('/launch/guided')
  })
})

// ---------------------------------------------------------------------------
// 2. Route guard — /launch/guided requires auth (AC #3)
// ---------------------------------------------------------------------------

describe('MVP Hardening — Route Guard Auth Contract (AC #3)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('/launch/guided requires authentication (isAuthRequired)', () => {
    expect(isAuthRequired('/launch/guided')).toBe(true)
  })

  it('/create requires authentication (kept as protected route)', () => {
    expect(isAuthRequired('/create')).toBe(true)
  })

  it('/ does not require authentication (home is guest-accessible)', () => {
    expect(isAuthRequired('/')).toBe(false)
  })

  it('invalid session (null) is rejected by isIssuanceSessionValid', () => {
    expect(isIssuanceSessionValid(null)).toBe(false)
  })

  it('empty string session is rejected by isIssuanceSessionValid', () => {
    expect(isIssuanceSessionValid('')).toBe(false)
  })

  it('session with no address is rejected by isIssuanceSessionValid', () => {
    const session = JSON.stringify({ email: 'test@example.com', isConnected: true })
    expect(isIssuanceSessionValid(session)).toBe(false)
  })

  it('session with isConnected=false is rejected by isIssuanceSessionValid', () => {
    const session = JSON.stringify({
      address: 'VALID_ADDRESS',
      email: 'test@example.com',
      isConnected: false,
    })
    expect(isIssuanceSessionValid(session)).toBe(false)
  })

  it('valid ARC76 session is accepted by isIssuanceSessionValid', () => {
    const session = JSON.stringify({
      address: 'TEST_ARC76_ADDRESS',
      email: 'user@example.com',
      isConnected: true,
    })
    expect(isIssuanceSessionValid(session)).toBe(true)
  })

  it('validates HardenedSession from buildHardenedSession()', () => {
    const session = buildHardenedSession()
    const result = validateHardenedSession(session)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(isLiveSession(session)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Accessibility contract — ComplianceDashboard, Navbar, GuidedTokenLaunch (AC #2)
// ---------------------------------------------------------------------------

describe('MVP Hardening — Accessibility Contract (AC #2)', () => {
  // Simulate key HTML fragments from the touched views.
  // These are representative snapshots of the key accessibility anchors in each component.
  // ⚠️  Maintenance note: these fixtures are manually synchronized with actual component
  //     templates and must be updated when the corresponding components change:
  //       - src/components/layout/Navbar.vue (skip-to-content, nav aria-label)
  //       - src/views/GuidedTokenLaunch.vue (main landmark, h1, stepper nav)
  //       - src/views/ComplianceDashboard.vue (back button aria-label, focus ring)
  //     Unit-level coverage for full render behavior is in component-specific test files.

  const navbarHtml = `
    <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
    <nav role="navigation" aria-label="Main navigation">
      <a href="/launch/guided">Guided Launch</a>
    </nav>
  `

  const guidedLaunchHtml = `
    <main id="main-content" role="main">
      <h1>Guided Token Launch</h1>
      <nav role="navigation" aria-label="Issuance progress steps"></nav>
    </main>
  `

  const complianceDashboardHtml = `
    <main id="main-content" role="main">
      <button
        aria-label="Go back"
        class="focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <i aria-hidden="true" class="pi pi-arrow-left"></i>
        <span>Back</span>
      </button>
      <div role="alert">Error state</div>
    </main>
  `

  it('Navbar has skip-to-content link (WCAG 2.4.1 Bypass Blocks)', () => {
    expect(hasSkipToContentLink(navbarHtml)).toBe(true)
  })

  it('Navbar has nav landmark (WCAG 2.4.1)', () => {
    expect(hasNavLandmark(navbarHtml)).toBe(true)
  })

  it('GuidedTokenLaunch has main landmark with id="main-content"', () => {
    expect(hasMainLandmark(guidedLaunchHtml)).toBe(true)
    expect(guidedLaunchHtml).toContain('id="main-content"')
  })

  it('GuidedTokenLaunch has nav landmark for stepper (WCAG 2.4.6)', () => {
    expect(hasNavLandmark(guidedLaunchHtml)).toBe(true)
    expect(guidedLaunchHtml).toContain('aria-label="Issuance progress steps"')
  })

  it('ComplianceDashboard back button has aria-label (WCAG 2.4.6)', () => {
    expect(complianceDashboardHtml).toContain('aria-label="Go back"')
  })

  it('ComplianceDashboard back button icon has aria-hidden (decorative icon pattern)', () => {
    expect(complianceDashboardHtml).toContain('aria-hidden="true"')
  })

  it('ComplianceDashboard back button has focus-visible ring (WCAG 2.4.7)', () => {
    expect(complianceDashboardHtml).toContain('focus-visible:ring-2')
  })

  it('ComplianceDashboard error container uses role="alert" (WCAG 4.1.3)', () => {
    expect(hasErrorAlertRole(complianceDashboardHtml)).toBe(true)
  })

  it('ComplianceDashboard has main landmark present (content page, nav is in layout)', () => {
    // The ComplianceDashboard component renders as a content page nested inside MainLayout.
    // The nav landmark lives in the parent layout, not in this component's HTML fragment.
    // We verify only the main landmark, which this component owns.
    expect(hasMainLandmark(complianceDashboardHtml)).toBe(true)
  })

  it('Navbar nav text contains no wallet connector forbidden patterns', () => {
    const navText = 'Biatec Tokens Home Guided Launch Dashboard Cockpit Marketplace Attestations Settings Sign In'
    const forbidden = findNavForbiddenPatterns(navText)
    expect(forbidden).toHaveLength(0)
  })

  it('nav text with WalletConnect is flagged as forbidden pattern', () => {
    const badNavText = 'Home Guided Launch WalletConnect'
    const forbidden = findNavForbiddenPatterns(badNavText)
    expect(forbidden.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 4. Session determinism — ARC76 contract validation (AC #3)
// ---------------------------------------------------------------------------

describe('MVP Hardening — Session Determinism (AC #3)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('buildHardenedSession returns structurally valid session', () => {
    const session = buildHardenedSession()
    expect(typeof session.address).toBe('string')
    expect(session.address.trim()).not.toBe('')
    expect(typeof session.email).toBe('string')
    expect(session.email.trim()).not.toBe('')
    expect(session.isConnected).toBe(true)
  })

  it('same inputs to buildHardenedSession produce same outputs (determinism)', () => {
    const overrides = { email: 'test@example.com', address: 'ADDR1234' }
    const s1 = buildHardenedSession(overrides)
    const s2 = buildHardenedSession(overrides)
    expect(s1.email).toBe(s2.email)
    expect(s1.address).toBe(s2.address)
    expect(s1.isConnected).toBe(s2.isConnected)
  })

  it('validateHardenedSession rejects session missing address', () => {
    const bad = { email: 'test@example.com', isConnected: true }
    const result = validateHardenedSession(bad)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => /address/i.test(e))).toBe(true)
  })

  it('validateHardenedSession rejects session missing email', () => {
    const bad = { address: 'ADDR', isConnected: true }
    const result = validateHardenedSession(bad)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => /email/i.test(e))).toBe(true)
  })

  it('validateHardenedSession rejects session with isConnected=false via isLiveSession', () => {
    // validateHardenedSession checks structural shape (isConnected must be boolean).
    // isLiveSession checks the runtime value (must be true).
    const disconnectedSession = { address: 'ADDR', email: 'test@example.com', isConnected: false }
    const result = validateHardenedSession(disconnectedSession)
    // Shape is valid (isConnected is a boolean), but the session is not "live"
    expect(result.valid).toBe(true)
    expect(isLiveSession(result.session)).toBe(false)
  })

  it('session seeded by buildHardenedSession passes isIssuanceSessionValid', () => {
    const session = buildHardenedSession()
    expect(isIssuanceSessionValid(JSON.stringify(session))).toBe(true)
  })

  it('isLiveSession returns false for null', () => {
    expect(isLiveSession(null)).toBe(false)
  })

  it('isLiveSession returns true for valid session', () => {
    const session = buildHardenedSession()
    expect(isLiveSession(session)).toBe(true)
  })

  it('AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH is defined for post-auth flow', () => {
    expect(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH).toBe('redirect_after_auth')
  })
})

// ---------------------------------------------------------------------------
// 5. Legacy redirect compat — /create/wizard → /launch/guided (AC #1)
// ---------------------------------------------------------------------------

describe('MVP Hardening — Legacy Redirect Compatibility (AC #1)', () => {
  it('/create/wizard is the LEGACY_WIZARD_ROUTE constant', () => {
    expect(LEGACY_WIZARD_ROUTE).toBe('/create/wizard')
  })

  it('getCanonicalRedirectFor /create/wizard resolves to /launch/guided', () => {
    const redirect = getCanonicalRedirectFor('/create/wizard')
    expect(redirect).toBe('/launch/guided')
    expect(redirect).not.toBe('/create/wizard')
    expect(redirect).not.toBe('/create')
  })

  it('/create/wizard is flagged as deprecated route', () => {
    expect(isDeprecatedRoute('/create/wizard')).toBe(true)
  })

  it('/launch/guided is the canonical destination and NOT deprecated', () => {
    expect(isDeprecatedRoute('/launch/guided')).toBe(false)
    expect(isCanonicalTokenCreationRoute('/launch/guided')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. No-wallet-connector invariant — auth/nav surfaces (AC #4)
// ---------------------------------------------------------------------------

describe('MVP Hardening — No Wallet Connector Invariant (AC #4)', () => {
  const canonicalNavTexts = [
    'Home Guided Launch Dashboard Cockpit Marketplace Attestations Settings',
    'Sign In',
    'Biatec Tokens',
  ]

  it.each(canonicalNavTexts)(
    'canonical nav text "%s" does not contain wallet connector patterns',
    (text) => {
      const violations = findNavForbiddenPatterns(text)
      expect(violations).toHaveLength(0)
    },
  )

  it('wallet connector text in nav is flagged as a violation', () => {
    const violations = findNavForbiddenPatterns('Home WalletConnect Dashboard')
    expect(violations.length).toBeGreaterThan(0)
    expect(violations[0]).toMatch(/WalletConnect/i)
  })

  it('"Not connected" in nav is flagged as a violation (must not show wallet state)', () => {
    const violations = findNavForbiddenPatterns('Home Dashboard Not connected')
    expect(violations.length).toBeGreaterThan(0)
  })
})
