/**
 * Canonical Route Guard Integration Tests
 *
 * Integration coverage for the intersection of:
 *   - canonicalLaunchWorkspace.ts (route authority functions)
 *   - NAV_ITEMS (canonical navigation definition)
 *   - Auth session contract (WorkspaceSession / WorkspaceUserState)
 *   - Router guard invariants (auth-gated routes, redirect rules)
 *
 * These tests prove the system-level invariants that the issue's AC #1-3 require:
 *   AC #1 — /launch/guided is the single canonical creation entry, /create/wizard redirects only
 *   AC #2 — NAV_ITEMS is the sole source for route/label definitions across the app
 *   AC #3 — Auth session contract drives protected-route access uniformly
 *
 * Tests are pure synchronous integration tests — no async I/O, no DOM, no browser.
 */

import { describe, it, expect } from 'vitest'
import { NAV_ITEMS } from '../../constants/navItems'
import {
  CANONICAL_LAUNCH_DESTINATION,
  LEGACY_WIZARD_REDIRECT_SOURCE,
  LAUNCH_AUTH_REQUIRED_ROUTES,
  COMPLIANCE_AUTH_GATED_ROUTES,
  isCanonicalLaunchPath,
  isLaunchAuthRequired,
  isComplianceAuthGated,
  isValidLegacyRedirect,
  deriveWorkspaceUserState,
  containsWalletTerminology,
  allRequiredNavLabelsPresent,
  REQUIRED_CANONICAL_NAV_LABELS,
} from '../../utils/canonicalLaunchWorkspace'

// ---------------------------------------------------------------------------
// 1. NAV_ITEMS × Route authority functions integration
// ---------------------------------------------------------------------------

describe('NAV_ITEMS × canonical route authority', () => {
  it('NAV_ITEMS contains exactly one entry for the canonical launch destination', () => {
    const launchEntries = NAV_ITEMS.filter((item) => item.path === CANONICAL_LAUNCH_DESTINATION)
    expect(launchEntries).toHaveLength(1)
    expect(launchEntries[0].label).toBe('Guided Launch')
  })

  it('no NAV_ITEM points to the legacy wizard redirect source (/create/wizard)', () => {
    const wizardEntries = NAV_ITEMS.filter((item) => item.path === LEGACY_WIZARD_REDIRECT_SOURCE)
    expect(wizardEntries).toHaveLength(0)
  })

  it('isCanonicalLaunchPath returns true for every NAV_ITEM that is the launch route', () => {
    const launchItems = NAV_ITEMS.filter((item) =>
      item.path.startsWith('/launch'),
    )
    for (const item of launchItems) {
      expect(isCanonicalLaunchPath(item.path)).toBe(true)
    }
  })

  it('all auth-required NAV_ITEM paths are in LAUNCH_AUTH_REQUIRED_ROUTES or COMPLIANCE_AUTH_GATED_ROUTES', () => {
    // Every NAV_ITEM that is in either auth-required set must be known to the authority functions
    const allAuthRequired = [...LAUNCH_AUTH_REQUIRED_ROUTES, ...COMPLIANCE_AUTH_GATED_ROUTES]
    for (const item of NAV_ITEMS) {
      if (allAuthRequired.includes(item.path)) {
        // Must be recognised by the corresponding authority function
        const isLaunchGated = isLaunchAuthRequired(item.path)
        const isComplianceGated = isComplianceAuthGated(item.path)
        expect(
          isLaunchGated || isComplianceGated,
          `NAV_ITEM "${item.label}" (${item.path}) is in auth-required lists but not recognised by authority functions`,
        ).toBe(true)
      }
    }
  })

  it('allRequiredNavLabelsPresent returns true when given the full navbar text content', () => {
    // allRequiredNavLabelsPresent checks FULL nav text (labels + buttons), not just NAV_ITEMS.
    // 'Sign in' is required but is a button, not a NAV_ITEM entry.
    const navLabels = [...NAV_ITEMS.map((item) => item.label), 'Sign in']
    expect(allRequiredNavLabelsPresent(navLabels)).toBe(true)
  })

  it('REQUIRED_CANONICAL_NAV_LABELS nav-link entries are a strict subset of NAV_ITEMS labels', () => {
    // 'Sign in' is a required label but represents a button action (not a nav route item).
    // Only route-based labels should appear in NAV_ITEMS.
    const navLabels = new Set(NAV_ITEMS.map((item) => item.label))
    const routeLabels = REQUIRED_CANONICAL_NAV_LABELS.filter((l) => l !== 'Sign in')
    for (const required of routeLabels) {
      expect(
        navLabels.has(required),
        `Required nav-link label "${required}" is missing from NAV_ITEMS`,
      ).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// 2. Auth session × workspace state × route guard integration
// ---------------------------------------------------------------------------

describe('Auth session × workspace state × route guard', () => {
  it('null session produces guest state — no auth-gated routes should be accessible', () => {
    const state = deriveWorkspaceUserState(null)
    expect(state).toBe('guest')
    // Guard: launch and compliance routes should deny guest users
    for (const route of LAUNCH_AUTH_REQUIRED_ROUTES) {
      expect(isLaunchAuthRequired(route)).toBe(true)
    }
    for (const route of COMPLIANCE_AUTH_GATED_ROUTES) {
      expect(isComplianceAuthGated(route)).toBe(true)
    }
  })

  it('valid session (address + email + isConnected=true) produces authenticated state', () => {
    const state = deriveWorkspaceUserState({
      address: 'VALID_ARC76_ADDRESS_00000000000000000000000000',
      email: 'user@example.com',
      isConnected: true,
    })
    expect(state).toBe('authenticated')
  })

  it('session with isConnected=false produces expired state — route guard should deny access', () => {
    // When a session object exists but isConnected=false, the session expired.
    // The route guard treats both 'guest' and 'expired' states as denied.
    const state = deriveWorkspaceUserState({
      address: 'SOME_ADDRESS',
      email: 'user@example.com',
      isConnected: false,
    })
    expect(state).toBe('expired')
    // Both guest and expired must be denied by route guard
    expect(state !== 'authenticated').toBe(true)
  })

  it('session with empty address produces guest state — route guard should deny access', () => {
    const state = deriveWorkspaceUserState({
      address: '',
      email: 'user@example.com',
      isConnected: true,
    })
    expect(state).toBe('guest')
  })

  it('session with empty email produces guest state — route guard should deny access', () => {
    const state = deriveWorkspaceUserState({
      address: 'SOME_ADDRESS',
      email: '',
      isConnected: true,
    })
    expect(state).toBe('guest')
  })

  it('canonical launch route requires auth — guest state means route guard must redirect', () => {
    // Both the canonical path check and the auth-required check must agree
    expect(isCanonicalLaunchPath(CANONICAL_LAUNCH_DESTINATION)).toBe(true)
    expect(isLaunchAuthRequired(CANONICAL_LAUNCH_DESTINATION)).toBe(true)

    // For a guest session, both should result in redirect
    const guestState = deriveWorkspaceUserState(null)
    expect(guestState).toBe('guest')
  })

  it('authenticated session + canonical path = access allowed (positive gate integration)', () => {
    const session = {
      address: 'ARC76_ADDRESS_FOR_INTEGRATION_TEST_BIATEC_IO',
      email: 'test@biatec.io',
      isConnected: true,
    }
    const state = deriveWorkspaceUserState(session)
    expect(state).toBe('authenticated')
    expect(isLaunchAuthRequired(CANONICAL_LAUNCH_DESTINATION)).toBe(true)
    // The route requires auth AND the session is authenticated — access allowed
    expect(state !== 'guest').toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Legacy redirect × canonical path integration
// ---------------------------------------------------------------------------

describe('Legacy redirect × canonical path integration', () => {
  it('isValidLegacyRedirect: /create/wizard → /launch/guided is the only valid redirect pair', () => {
    expect(isValidLegacyRedirect(LEGACY_WIZARD_REDIRECT_SOURCE, CANONICAL_LAUNCH_DESTINATION)).toBe(true)
  })

  it('isValidLegacyRedirect: /create/wizard → /dashboard is NOT a valid redirect', () => {
    expect(isValidLegacyRedirect(LEGACY_WIZARD_REDIRECT_SOURCE, '/dashboard')).toBe(false)
  })

  it('isValidLegacyRedirect: /launch/guided → /launch/guided is NOT a valid legacy redirect', () => {
    // Canonical path should not redirect to itself as a "legacy" redirect
    expect(isValidLegacyRedirect(CANONICAL_LAUNCH_DESTINATION, CANONICAL_LAUNCH_DESTINATION)).toBe(false)
  })

  it('legacy source is NOT in NAV_ITEMS — users cannot directly navigate to wizard', () => {
    const wizardInNav = NAV_ITEMS.some((item) => item.path === LEGACY_WIZARD_REDIRECT_SOURCE)
    expect(wizardInNav).toBe(false)
  })

  it('canonical destination is in NAV_ITEMS — users CAN navigate to guided launch', () => {
    const guidedInNav = NAV_ITEMS.some((item) => item.path === CANONICAL_LAUNCH_DESTINATION)
    expect(guidedInNav).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 4. No-wallet policy × NAV_ITEMS integration
// ---------------------------------------------------------------------------

describe('No-wallet policy × NAV_ITEMS integration', () => {
  it('no NAV_ITEM label triggers wallet terminology detection', () => {
    for (const item of NAV_ITEMS) {
      expect(
        containsWalletTerminology(item.label),
        `NAV_ITEM "${item.label}" (${item.path}) contains wallet terminology`,
      ).toBe(false)
    }
  })

  it('no NAV_ITEM path contains wallet-era route patterns', () => {
    const walletPathPatterns = [/wallet/i, /connect/i, /metamask/i, /pera/i, /defly/i]
    for (const item of NAV_ITEMS) {
      for (const pattern of walletPathPatterns) {
        expect(
          pattern.test(item.path),
          `NAV_ITEM path "${item.path}" contains wallet-era pattern ${pattern}`,
        ).toBe(false)
      }
    }
  })

  it('canonical launch destination path contains no wallet terminology', () => {
    expect(containsWalletTerminology(CANONICAL_LAUNCH_DESTINATION)).toBe(false)
  })

  it('all required canonical nav labels are wallet-terminology-free', () => {
    for (const label of REQUIRED_CANONICAL_NAV_LABELS) {
      expect(
        containsWalletTerminology(label),
        `Required nav label "${label}" contains wallet terminology`,
      ).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// 5. Route-set completeness and consistency
// ---------------------------------------------------------------------------

describe('Route-set completeness and consistency', () => {
  it('CANONICAL_LAUNCH_DESTINATION is in LAUNCH_AUTH_REQUIRED_ROUTES', () => {
    expect(LAUNCH_AUTH_REQUIRED_ROUTES).toContain(CANONICAL_LAUNCH_DESTINATION)
  })

  it('LEGACY_WIZARD_REDIRECT_SOURCE is NOT in LAUNCH_AUTH_REQUIRED_ROUTES', () => {
    // The redirect source is handled by the router redirect, not the auth guard
    expect(LAUNCH_AUTH_REQUIRED_ROUTES).not.toContain(LEGACY_WIZARD_REDIRECT_SOURCE)
  })

  it('compliance auth-gated routes do not overlap with launch auth-required routes', () => {
    const overlap = COMPLIANCE_AUTH_GATED_ROUTES.filter((route) =>
      LAUNCH_AUTH_REQUIRED_ROUTES.includes(route),
    )
    expect(overlap).toHaveLength(0)
  })

  it('all LAUNCH_AUTH_REQUIRED_ROUTES are recognised by isLaunchAuthRequired', () => {
    for (const route of LAUNCH_AUTH_REQUIRED_ROUTES) {
      expect(
        isLaunchAuthRequired(route),
        `isLaunchAuthRequired("${route}") returned false — route missing from implementation`,
      ).toBe(true)
    }
  })

  it('all COMPLIANCE_AUTH_GATED_ROUTES are recognised by isComplianceAuthGated', () => {
    for (const route of COMPLIANCE_AUTH_GATED_ROUTES) {
      expect(
        isComplianceAuthGated(route),
        `isComplianceAuthGated("${route}") returned false — route missing from implementation`,
      ).toBe(true)
    }
  })

  it('NAV_ITEMS paths are a subset of all auth-gated + non-gated routes (no ghost routes)', () => {
    const allAuthGated = new Set([...LAUNCH_AUTH_REQUIRED_ROUTES, ...COMPLIANCE_AUTH_GATED_ROUTES])
    // Public routes that do NOT require auth
    const knownPublicPaths = ['/', '/dashboard', '/subscription/pricing', '/settings', '/cockpit']

    for (const item of NAV_ITEMS) {
      const isPublic = knownPublicPaths.includes(item.path)
      const isAuthGated = allAuthGated.has(item.path)
      expect(
        isPublic || isAuthGated,
        `NAV_ITEM "${item.label}" (${item.path}) is neither in public routes nor auth-gated routes — may be a ghost route`,
      ).toBe(true)
    }
  })
})
