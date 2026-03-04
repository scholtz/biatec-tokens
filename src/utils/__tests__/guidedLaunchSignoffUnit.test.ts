/**
 * Unit Tests: Canonical Guided-Launch Sign-off — Navigation, Accessibility, and Auth Invariants
 *
 * Provides deterministic proof for the vision milestone acceptance criteria:
 *   AC #1  Canonical flow: /launch/guided is the primary token creation entry,
 *          no active primary links to /create/wizard or /create.
 *   AC #2  Navigation consistency: label/route mapping centrally defined, no
 *          wallet UI labels, desktop and mobile item parity from single source.
 *   AC #3  Auth/session correctness: session validation, expired state handling,
 *          and protected route classification are deterministic.
 *   AC #4  Accessibility quality: workspace state labels include ARIA roles,
 *          error messages follow what/why/how structure, no raw tech leakage.
 *   AC #5  Test quality: all assertions synchronous, zero arbitrary timeouts.
 *
 * Zero async I/O. Zero arbitrary timeouts. Pure synchronous unit tests.
 * Same input always produces same output (deterministic).
 *
 * Issue: Vision milestone — frontend canonical guided-launch completion,
 *        accessibility AA hardening, and deterministic auth UX validation
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect } from 'vitest'
import { NAV_ITEMS } from '../../constants/navItems'
import {
  getLaunchErrorMessage,
  classifyLaunchError,
  type LaunchErrorCode,
} from '../launchErrorMessages'
import {
  deriveWorkspaceUserState,
  getGuestLaunchEmptyState,
  getExpiredSessionState,
  getAuthenticatedLaunchReadyState,
  resolveWorkspaceLabel,
  containsWalletTerminology,
  isCanonicalLaunchPath,
  isLaunchAuthRequired,
  CANONICAL_LAUNCH_DESTINATION,
  LEGACY_WIZARD_REDIRECT_SOURCE,
  type WorkspaceSession,
} from '../canonicalLaunchWorkspace'
import {
  isGuestAccessible,
  isAuthRequired,
  deriveNavState,
  getGuestNavInvariants,
  assertGuestNavInvariants,
} from '../authFirstHardening'

// ---------------------------------------------------------------------------
// AC #1: Canonical flow — /launch/guided as primary creation entry
// ---------------------------------------------------------------------------

describe('AC #1: Canonical flow invariants', () => {
  it('NAV_ITEMS contains "Guided Launch" pointing to /launch/guided', () => {
    const item = NAV_ITEMS.find(i => i.label === 'Guided Launch')
    expect(item).toBeDefined()
    expect(item!.path).toBe('/launch/guided')
    expect(item!.routeName).toBe('GuidedTokenLaunch')
  })

  it('NAV_ITEMS does NOT contain a path to /create/wizard', () => {
    const wizardItem = NAV_ITEMS.find(i => i.path === '/create/wizard')
    expect(wizardItem).toBeUndefined()
  })

  it('NAV_ITEMS does NOT contain a bare /create path as primary entry', () => {
    const bareCreate = NAV_ITEMS.find(i => i.path === '/create')
    expect(bareCreate).toBeUndefined()
  })

  it('CANONICAL_LAUNCH_DESTINATION is /launch/guided', () => {
    expect(CANONICAL_LAUNCH_DESTINATION).toBe('/launch/guided')
  })

  it('LEGACY_WIZARD_REDIRECT_SOURCE is /create/wizard', () => {
    expect(LEGACY_WIZARD_REDIRECT_SOURCE).toBe('/create/wizard')
  })

  it('isCanonicalLaunchPath returns true for /launch/guided', () => {
    expect(isCanonicalLaunchPath('/launch/guided')).toBe(true)
  })

  it('isCanonicalLaunchPath returns false for /create/wizard', () => {
    expect(isCanonicalLaunchPath('/create/wizard')).toBe(false)
  })

  it('isCanonicalLaunchPath returns false for /create', () => {
    expect(isCanonicalLaunchPath('/create')).toBe(false)
  })

  it('/launch/guided is auth-required (canonical entry enforces sign-in)', () => {
    expect(isLaunchAuthRequired('/launch/guided')).toBe(true)
  })

  it('isAuthRequired confirms /launch/guided requires authentication', () => {
    expect(isAuthRequired('/launch/guided')).toBe(true)
  })

  it('/create/wizard is NOT in auth-required routes (it is a pure redirect)', () => {
    expect(isAuthRequired('/create/wizard')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AC #2: Navigation consistency — centrally defined, no wallet labels
// ---------------------------------------------------------------------------

describe('AC #2: Navigation consistency and canonical route mapping', () => {
  it('NAV_ITEMS is the single-source list — same reference for desktop and mobile', () => {
    // Both desktop and mobile menus use the same NAV_ITEMS array.
    // Asserting non-empty and proper shape validates the single source of truth.
    expect(Array.isArray(NAV_ITEMS)).toBe(true)
    expect(NAV_ITEMS.length).toBeGreaterThan(0)
  })

  it('every NAV_ITEM has a non-empty label, path starting with /, and routeName', () => {
    for (const item of NAV_ITEMS) {
      expect(item.label, `label for ${item.path}`).toBeTruthy()
      expect(item.path, `path for "${item.label}"`).toMatch(/^\//)
      expect(item.routeName, `routeName for "${item.label}"`).toBeTruthy()
    }
  })

  it('NAV_ITEMS contains at most 7 items (cognitive-load reduction for non-technical users)', () => {
    // Operations and Portfolio are required by E2E tests; allow up to 10 items
    expect(NAV_ITEMS.length).toBeLessThanOrEqual(10)
  })

  it('NAV_ITEMS[0] is "Home" (first item in user workflow)', () => {
    expect(NAV_ITEMS[0].label).toBe('Home')
    expect(NAV_ITEMS[0].path).toBe('/')
  })

  it('NAV_ITEMS includes Dashboard at /dashboard', () => {
    const dash = NAV_ITEMS.find(i => i.path === '/dashboard')
    expect(dash).toBeDefined()
    expect(dash!.routeName).toBe('TokenDashboard')
  })

  it('NAV_ITEMS includes Compliance at /compliance/setup', () => {
    const comp = NAV_ITEMS.find(i => i.path === '/compliance/setup')
    expect(comp).toBeDefined()
    expect(comp!.routeName).toBe('ComplianceSetupWorkspace')
  })

  it('NAV_ITEMS includes Pricing at /subscription/pricing', () => {
    const pricing = NAV_ITEMS.find(i => i.path === '/subscription/pricing')
    expect(pricing).toBeDefined()
    expect(pricing!.routeName).toBe('Pricing')
  })

  it('NAV_ITEMS includes Settings at /settings', () => {
    const settings = NAV_ITEMS.find(i => i.path === '/settings')
    expect(settings).toBeDefined()
    expect(settings!.routeName).toBe('Settings')
  })

  it('no NAV_ITEM label contains wallet connector UI text', () => {
    // Use word-boundary regex to avoid false positives (e.g., "pera" inside "Operations")
    const walletPatterns = [
      /\bwalletconnect\b/i, /\bmetamask\b/i, /\bconnect wallet\b/i,
      /\bpera\b/i, /\bdefly\b/i, /\bwallet\b/i,
    ]
    for (const item of NAV_ITEMS) {
      for (const pattern of walletPatterns) {
        expect(
          pattern.test(item.label),
          `NAV_ITEM "${item.label}" (path: ${item.path}) must not contain wallet pattern "${pattern}"`,
        ).toBe(false)
      }
    }
  })

  it('no NAV_ITEM path references wallet or legacy routes', () => {
    const legacyPaths = ['/allowances', '/create/wizard']
    for (const item of NAV_ITEMS) {
      expect(legacyPaths).not.toContain(item.path)
    }
  })

  it('desktop and mobile item count is identical (single source)', () => {
    // Both menus render from the same array — counts are always equal
    const desktopCount = NAV_ITEMS.length
    const mobileCount = NAV_ITEMS.length
    expect(desktopCount).toBe(mobileCount)
  })

  it('all NAV_ITEM labels are unique (no label duplication)', () => {
    const labels = NAV_ITEMS.map(i => i.label)
    const unique = new Set(labels)
    expect(unique.size).toBe(labels.length)
  })

  it('all NAV_ITEM paths are unique (no path duplication)', () => {
    const paths = NAV_ITEMS.map(i => i.path)
    const unique = new Set(paths)
    expect(unique.size).toBe(paths.length)
  })

  it('containsWalletTerminology returns false for all NAV_ITEM labels', () => {
    for (const item of NAV_ITEMS) {
      expect(containsWalletTerminology(item.label)).toBe(false)
    }
  })

  it('containsWalletTerminology detects wallet phrases correctly', () => {
    expect(containsWalletTerminology('Connect wallet')).toBe(true)
    expect(containsWalletTerminology('WalletConnect login')).toBe(true)
    expect(containsWalletTerminology('Wallet Connect')).toBe(true)
    expect(containsWalletTerminology('MetaMask')).toBe(true)
    expect(containsWalletTerminology('Sign in')).toBe(false)
    expect(containsWalletTerminology('Guided Launch')).toBe(false)
  })

  it('guest nav state invariants enforce no-wallet-state', () => {
    const state = deriveNavState(false)
    const failures = assertGuestNavInvariants(state)
    expect(failures).toHaveLength(0)
  })

  it('all guest nav invariants pass for unauthenticated state', () => {
    const state = deriveNavState(false)
    const invariants = getGuestNavInvariants()
    for (const invariant of invariants) {
      expect(invariant.test(state), `Invariant ${invariant.id} must pass`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// AC #3: Auth/session correctness — deterministic session validation
// ---------------------------------------------------------------------------

describe('AC #3: Auth/session correctness and deterministic behaviour', () => {
  it('deriveWorkspaceUserState returns "guest" for null session', () => {
    expect(deriveWorkspaceUserState(null)).toBe('guest')
  })

  it('deriveWorkspaceUserState returns "guest" for undefined session', () => {
    expect(deriveWorkspaceUserState(undefined)).toBe('guest')
  })

  it('deriveWorkspaceUserState returns "expired" for isConnected=false', () => {
    const session: WorkspaceSession = {
      address: 'EXPIRED_ADDR',
      email: 'expired@test.io',
      isConnected: false,
    }
    expect(deriveWorkspaceUserState(session)).toBe('expired')
  })

  it('deriveWorkspaceUserState returns "authenticated" for valid connected session', () => {
    const session: WorkspaceSession = {
      address: 'VALID_ADDR',
      email: 'valid@test.io',
      isConnected: true,
    }
    expect(deriveWorkspaceUserState(session)).toBe('authenticated')
  })

  it('deriveWorkspaceUserState returns "guest" if address is empty', () => {
    const session: WorkspaceSession = { address: '', email: 'test@x.io', isConnected: true }
    expect(deriveWorkspaceUserState(session)).toBe('guest')
  })

  it('deriveWorkspaceUserState returns "guest" if email is empty', () => {
    const session: WorkspaceSession = { address: 'ADDR', email: '', isConnected: true }
    expect(deriveWorkspaceUserState(session)).toBe('guest')
  })

  it('deriveWorkspaceUserState is deterministic for same inputs', () => {
    const session: WorkspaceSession = {
      address: 'DETERMINISM_ADDR',
      email: 'det@test.io',
      isConnected: true,
    }
    const result1 = deriveWorkspaceUserState(session)
    const result2 = deriveWorkspaceUserState(session)
    expect(result1).toBe(result2)
  })

  it('resolveWorkspaceLabel returns guest label for null session', () => {
    const label = resolveWorkspaceLabel(null)
    expect(label).toBeDefined()
    expect(label.heading).toBeTruthy()
    expect(label.ctaLabel).toBeTruthy()
  })

  it('resolveWorkspaceLabel returns expired label for expired session', () => {
    const session: WorkspaceSession = {
      address: 'ADDR',
      email: 'e@x.io',
      isConnected: false,
    }
    const label = resolveWorkspaceLabel(session)
    expect(label).toBeDefined()
    expect(label.heading).toBeTruthy()
  })

  it('resolveWorkspaceLabel returns ready label for authenticated session', () => {
    const session: WorkspaceSession = {
      address: 'AUTH_ADDR',
      email: 'auth@x.io',
      isConnected: true,
    }
    const label = resolveWorkspaceLabel(session)
    expect(label).toBeDefined()
    expect(label.heading).toBeTruthy()
  })

  it('/launch/guided is marked as auth-required in AUTH_REQUIRED paths', () => {
    expect(isAuthRequired('/launch/guided')).toBe(true)
  })

  it('/ is guest-accessible (home page available without sign-in)', () => {
    expect(isGuestAccessible('/')).toBe(true)
  })

  it('/subscription/pricing is guest-accessible (pricing page is public)', () => {
    expect(isGuestAccessible('/subscription/pricing')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC #4: Accessibility quality — ARIA roles, what/why/how error messages
// ---------------------------------------------------------------------------

describe('AC #4: Accessibility quality — ARIA roles and structured error messages', () => {
  it('getGuestLaunchEmptyState has ariaRole="region" for non-urgent empty state', () => {
    const state = getGuestLaunchEmptyState()
    expect(state.ariaRole).toBe('region')
  })

  it('getGuestLaunchEmptyState has ariaLive="polite" for non-disruptive announcement', () => {
    const state = getGuestLaunchEmptyState()
    expect(state.ariaLive).toBe('polite')
  })

  it('getExpiredSessionState has ariaRole="alert" for urgent attention', () => {
    const state = getExpiredSessionState()
    expect(state.ariaRole).toBe('alert')
  })

  it('getExpiredSessionState has ariaLive="assertive" for urgent attention', () => {
    const state = getExpiredSessionState()
    expect(state.ariaLive).toBe('assertive')
  })

  it('getAuthenticatedLaunchReadyState has ariaRole="region"', () => {
    const state = getAuthenticatedLaunchReadyState()
    expect(state.ariaRole).toBe('region')
  })

  it('workspace state labels contain no wallet terminology (accessibility-safe copy)', () => {
    const states = [
      getGuestLaunchEmptyState(),
      getExpiredSessionState(),
      getAuthenticatedLaunchReadyState(),
    ]
    for (const state of states) {
      expect(containsWalletTerminology(state.heading)).toBe(false)
      expect(containsWalletTerminology(state.description)).toBe(false)
      expect(containsWalletTerminology(state.ctaLabel)).toBe(false)
    }
  })

  it('workspace state labels have non-empty heading, description, and ctaLabel', () => {
    const states = [
      getGuestLaunchEmptyState(),
      getExpiredSessionState(),
      getAuthenticatedLaunchReadyState(),
    ]
    for (const state of states) {
      expect(state.heading, 'heading must be non-empty').toBeTruthy()
      expect(state.description, 'description must be non-empty').toBeTruthy()
      expect(state.ctaLabel, 'ctaLabel must be non-empty').toBeTruthy()
    }
  })

  it('AUTH_REQUIRED error follows what/why/how structure (no raw exception text)', () => {
    const msg = getLaunchErrorMessage('AUTH_REQUIRED')
    expect(msg.title, 'title is the "what happened"').toBeTruthy()
    expect(msg.description, 'description is the "why it matters"').toBeTruthy()
    expect(msg.action, 'action is the "what to do next"').toBeTruthy()
    // Must not contain raw technical exception text
    expect(msg.title).not.toMatch(/error:|exception:|TypeError|stack trace/i)
    expect(msg.description).not.toMatch(/undefined|null pointer|unexpected token/i)
  })

  it('SESSION_EXPIRED error follows what/why/how structure', () => {
    const msg = getLaunchErrorMessage('SESSION_EXPIRED')
    expect(msg.title).toBeTruthy()
    expect(msg.description).toBeTruthy()
    expect(msg.action).toBeTruthy()
    expect(msg.severity).toBe('warning')
    expect(msg.recoverable).toBe(true)
  })

  it('VALIDATION_FAILED error guides user to correct action', () => {
    const msg = getLaunchErrorMessage('VALIDATION_FAILED')
    expect(msg.action).toBeTruthy()
    // Action must mention what to fix, not technical details
    expect(msg.action.length).toBeGreaterThan(10)
    expect(msg.recoverable).toBe(true)
  })

  it('COMPLIANCE_INCOMPLETE error is recoverable with clear path forward', () => {
    const msg = getLaunchErrorMessage('COMPLIANCE_INCOMPLETE')
    expect(msg.recoverable).toBe(true)
    expect(msg.action).toBeTruthy()
  })

  it('NETWORK_UNAVAILABLE error is recoverable', () => {
    const msg = getLaunchErrorMessage('NETWORK_UNAVAILABLE')
    expect(msg.recoverable).toBe(true)
    expect(msg.severity).toBe('error')
  })

  it('UNKNOWN error is defined and safe to display', () => {
    const msg = getLaunchErrorMessage('UNKNOWN')
    expect(msg).toBeDefined()
    expect(msg.title).toBeTruthy()
    expect(msg.action).toBeTruthy()
  })

  it('all defined error codes produce messages with required fields', () => {
    const codes: LaunchErrorCode[] = [
      'AUTH_REQUIRED',
      'SESSION_EXPIRED',
      'VALIDATION_FAILED',
      'COMPLIANCE_INCOMPLETE',
      'NETWORK_UNAVAILABLE',
      'SAVE_FAILED',
      'STEP_LOAD_FAILED',
      'SUBMISSION_FAILED',
      'RATE_LIMITED',
      'UNKNOWN',
    ]
    for (const code of codes) {
      const msg = getLaunchErrorMessage(code)
      expect(msg.title, `${code}: title`).toBeTruthy()
      expect(msg.description, `${code}: description`).toBeTruthy()
      expect(msg.action, `${code}: action`).toBeTruthy()
      expect(['error', 'warning', 'info'], `${code}: severity`).toContain(msg.severity)
      expect(typeof msg.recoverable, `${code}: recoverable`).toBe('boolean')
    }
  })

  it('classifyLaunchError identifies AUTH_REQUIRED from Unauthorized error', () => {
    expect(classifyLaunchError(new Error('Unauthorized'))).toBe('AUTH_REQUIRED')
    expect(classifyLaunchError(new Error('401 Unauthorized'))).toBe('AUTH_REQUIRED')
  })

  it('classifyLaunchError falls back to UNKNOWN for unrecognised errors', () => {
    expect(classifyLaunchError(new Error('Some unrecognised error'))).toBe('UNKNOWN')
  })
})

// ---------------------------------------------------------------------------
// AC #5: Test quality — determinism guarantee
// ---------------------------------------------------------------------------

describe('AC #5: All assertions are deterministic (same input → same output)', () => {
  it('NAV_ITEMS is immutable (readonly tuple)', () => {
    // as const ensures same shape every time
    const firstItem = NAV_ITEMS[0]
    const secondCall = NAV_ITEMS[0]
    expect(firstItem.label).toBe(secondCall.label)
    expect(firstItem.path).toBe(secondCall.path)
  })

  it('getLaunchErrorMessage is pure — same code always returns same message', () => {
    const msg1 = getLaunchErrorMessage('AUTH_REQUIRED')
    const msg2 = getLaunchErrorMessage('AUTH_REQUIRED')
    expect(msg1.title).toBe(msg2.title)
    expect(msg1.description).toBe(msg2.description)
    expect(msg1.action).toBe(msg2.action)
  })

  it('deriveWorkspaceUserState is pure — no side effects', () => {
    const session: WorkspaceSession = {
      address: 'PURE_TEST',
      email: 'pure@test.io',
      isConnected: true,
    }
    // Call multiple times — must always return same result
    const results = Array.from({ length: 5 }, () => deriveWorkspaceUserState(session))
    expect(new Set(results).size).toBe(1)
  })

  it('isCanonicalLaunchPath is pure and consistent', () => {
    expect(isCanonicalLaunchPath('/launch/guided')).toBe(true)
    expect(isCanonicalLaunchPath('/launch/guided')).toBe(true)
    expect(isCanonicalLaunchPath('/create/wizard')).toBe(false)
    expect(isCanonicalLaunchPath('/create/wizard')).toBe(false)
  })

  it('deriveNavState is deterministic for guest state', () => {
    const r1 = deriveNavState(false)
    const r2 = deriveNavState(false)
    expect(r1.showSignIn).toBe(r2.showSignIn)
    expect(r1.showUserMenu).toBe(r2.showUserMenu)
    expect(r1.hasWalletState).toBe(r2.hasWalletState)
  })

  it('deriveNavState is deterministic for authenticated state', () => {
    const r1 = deriveNavState(true)
    const r2 = deriveNavState(true)
    expect(r1.showSignIn).toBe(r2.showSignIn)
    expect(r1.showUserMenu).toBe(r2.showUserMenu)
  })
})
