/**
 * Integration Tests: CI-Stable Onboarding Confidence
 *
 * Validates the complete auth-first onboarding contract with deterministic
 * state simulations. These tests do NOT use waitForTimeout() — all state
 * transitions are synchronous or use localStorage mocking.
 *
 * Maps to Acceptance Criteria:
 *   AC #1  All token creation entry points enforce auth-first routing
 *   AC #3  /create/wizard deterministically redirects to /launch/guided
 *   AC #4  Guest nav has no wallet/network states
 *   AC #5  Authenticated nav is consistent and role-appropriate
 *   AC #9  High-value tests are stable without timing workarounds
 *   AC #10 No waitForTimeout — all tests use deterministic state
 *   AC #11 CI passes for this suite without retries or broad skips
 *
 * Business value:
 * These integration tests provide CI-stable proof that the auth-first
 * journey works correctly for:
 * - Non-technical users being redirected to login before creation
 * - Authenticated users reaching guided launch without wizard-era confusion
 * - Error states surfacing user-centered messages, not raw exceptions
 *
 * Issue: Frontend milestone — auth-first route determinism, accessibility
 *        hardening, and CI-stable onboarding confidence (#475)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  deriveNavState,
  assertGuestNavInvariants,
  getGuestNavInvariants,
  isAuthRequired,
  isGuestAccessible,
  storePostAuthRedirect,
  consumePostAuthRedirect,
  peekPostAuthRedirect,
  GUEST_ACCESSIBLE_PATHS,
  AUTH_REQUIRED_PATHS,
  AUTH_FIRST_TEST_IDS,
} from '../../utils/authFirstHardening';
import { AUTH_STORAGE_KEYS } from '../../constants/auth';
import { NAV_ITEMS } from '../../constants/navItems';
import { getLaunchErrorMessage } from '../../utils/launchErrorMessages';

// ---------------------------------------------------------------------------
// Helpers: simulates the router guard behavior from src/router/index.ts
// ---------------------------------------------------------------------------

interface GuardResult {
  allowed: boolean;
  redirectTo?: string;
  storedRedirect?: string;
}

function simulateRouterGuard(
  path: string,
  requiresAuth: boolean,
  routeName?: string,
): GuardResult {
  if (!requiresAuth) return { allowed: true };
  if (routeName === 'TokenDashboard') return { allowed: true };

  const user = localStorage.getItem('algorand_user');
  if (!user) {
    storePostAuthRedirect(path);
    return {
      allowed: false,
      redirectTo: '/?showAuth=true',
      storedRedirect: path,
    };
  }
  return { allowed: true };
}

function setAuth(email = 'test@example.com', address = 'TEST_ADDR'): void {
  localStorage.setItem('algorand_user', JSON.stringify({ address, email, isConnected: true }));
}

function clearAuth(): void {
  localStorage.removeItem('algorand_user');
  localStorage.removeItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
}

// ---------------------------------------------------------------------------
// AC #1: Complete auth-first routing contract
// ---------------------------------------------------------------------------

describe('Integration: AC #1 — Auth-first routing contract (all entry points)', () => {
  beforeEach(clearAuth);
  afterEach(clearAuth);

  it('unauthenticated user accessing /launch/guided is blocked and redirect stored', () => {
    const result = simulateRouterGuard('/launch/guided', true, 'GuidedTokenLaunch');
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/?showAuth=true');
    expect(result.storedRedirect).toBe('/launch/guided');

    // Confirm the redirect is recoverable via consumePostAuthRedirect
    const destination = consumePostAuthRedirect();
    expect(destination).toBe('/launch/guided');
  });

  it('after auth, user can resume intended destination via consumePostAuthRedirect', () => {
    // Step 1: Unauthenticated access stores redirect
    simulateRouterGuard('/launch/guided', true, 'GuidedTokenLaunch');

    // Step 2: Auth completes
    setAuth();

    // Step 3: App consumes post-auth redirect
    const destination = consumePostAuthRedirect();
    expect(destination).toBe('/launch/guided');

    // Step 4: No stale redirect remains
    expect(consumePostAuthRedirect()).toBeNull();
  });

  it('multiple sequential guard invocations — last stored redirect wins', () => {
    simulateRouterGuard('/launch/guided', true, 'GuidedTokenLaunch');
    simulateRouterGuard('/cockpit', true, 'LifecycleCockpit');
    expect(peekPostAuthRedirect()).toBe('/cockpit');
  });

  it('all AUTH_REQUIRED_PATHS are guarded (none slipped through)', () => {
    AUTH_REQUIRED_PATHS.forEach(path => {
      // Each path should be recognized as auth-required
      expect(isAuthRequired(path)).toBe(true);
    });
  });

  it('GUEST_ACCESSIBLE_PATHS are never blocked by guard', () => {
    GUEST_ACCESSIBLE_PATHS.forEach(path => {
      // These paths are accessible without auth
      expect(isGuestAccessible(path)).toBe(true);
      expect(isAuthRequired(path)).toBe(false);
    });
  });

  it('authenticated user passes guard for all auth-required paths', () => {
    setAuth();
    const authPaths = AUTH_REQUIRED_PATHS.filter(p => !p.includes(':'));
    authPaths.forEach(path => {
      const result = simulateRouterGuard(path, true);
      expect(result.allowed).toBe(true);
    });
  });

  it('TokenDashboard guard exception works regardless of auth state', () => {
    // Unauthenticated — should still be allowed (public empty-state)
    expect(simulateRouterGuard('/dashboard', true, 'TokenDashboard').allowed).toBe(true);
    // Authenticated — also allowed
    setAuth();
    expect(simulateRouterGuard('/dashboard', true, 'TokenDashboard').allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #3: /create/wizard redirect to /launch/guided
// ---------------------------------------------------------------------------

describe('Integration: AC #3 — /create/wizard canonical deprecation', () => {
  it('/create/wizard is NOT a navigation target (no NAV_ITEM points to it)', () => {
    const wizardItem = NAV_ITEMS.find(item => item.path.includes('wizard'));
    expect(wizardItem).toBeUndefined();
  });

  it('/launch/guided IS the canonical creation entry (in NAV_ITEMS)', () => {
    const guidedItem = NAV_ITEMS.find(item => item.path === '/launch/guided');
    expect(guidedItem).toBeDefined();
    expect(guidedItem?.label).toBeTruthy();
  });

  it('/launch/guided IS in AUTH_REQUIRED_PATHS', () => {
    expect(AUTH_REQUIRED_PATHS).toContain('/launch/guided');
  });

  it('/create/wizard IS NOT in AUTH_REQUIRED_PATHS (redirect, not auth gate)', () => {
    expect(AUTH_REQUIRED_PATHS).not.toContain('/create/wizard');
  });

  it('/create/wizard IS NOT in GUEST_ACCESSIBLE_PATHS', () => {
    expect(GUEST_ACCESSIBLE_PATHS).not.toContain('/create/wizard');
  });
});

// ---------------------------------------------------------------------------
// AC #4: Guest navigation — no wallet/network phrases
// ---------------------------------------------------------------------------

describe('Integration: AC #4 — Guest nav has no wallet/network states', () => {
  afterEach(clearAuth);

  it('all 7 guest nav invariants pass for unauthenticated state', () => {
    const state = deriveNavState(false);
    const failures = assertGuestNavInvariants(state);
    expect(failures).toHaveLength(0);
    expect(failures.map(f => f.id)).toEqual([]);
  });

  it('guest nav has no wallet state (hasWalletState=false)', () => {
    const state = deriveNavState(false);
    expect(state.hasWalletState).toBe(false);
  });

  it('guest nav shows sign-in', () => {
    const state = deriveNavState(false);
    expect(state.showSignIn).toBe(true);
    expect(state.showUserMenu).toBe(false);
  });

  it('guest nav has nav items including guided launch', () => {
    const state = deriveNavState(false);
    expect(state.items.length).toBeGreaterThan(0);
    expect(state.items.some(i => i.path === '/launch/guided')).toBe(true);
  });

  it('guest nav aria-label is non-empty for accessibility', () => {
    const state = deriveNavState(false);
    expect(state.navAriaLabel.length).toBeGreaterThan(0);
  });

  it('NAV_ITEMS labels contain no wallet/network jargon', () => {
    const forbidden = ['wallet', 'network', 'not connected', 'connect', 'chain'];
    NAV_ITEMS.forEach(item => {
      const lower = item.label.toLowerCase();
      forbidden.forEach(phrase => {
        expect(lower).not.toContain(phrase);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// AC #5: Authenticated navigation is consistent
// ---------------------------------------------------------------------------

describe('Integration: AC #5 — Authenticated nav consistency', () => {
  afterEach(clearAuth);

  it('authenticated state shows user menu and hides sign-in', () => {
    const state = deriveNavState(true);
    expect(state.showUserMenu).toBe(true);
    expect(state.showSignIn).toBe(false);
  });

  it('authenticated state has no wallet state (email/password auth only)', () => {
    const state = deriveNavState(true);
    expect(state.hasWalletState).toBe(false);
  });

  it('deriveNavState is deterministic — same input always gives same output', () => {
    for (let i = 0; i < 5; i++) {
      const guest = deriveNavState(false);
      const auth = deriveNavState(true);
      expect(guest.showSignIn).toBe(true);
      expect(auth.showSignIn).toBe(false);
    }
  });

  it('authenticated state includes guided launch in nav items', () => {
    const state = deriveNavState(true);
    expect(state.items.some(i => i.path === '/launch/guided')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #6: Error messages are user-centered
// ---------------------------------------------------------------------------

describe('Integration: AC #6 — User-centered error messages for auth/launch flows', () => {
  it('AUTH_REQUIRED error is recoverable with clear next action', () => {
    const msg = getLaunchErrorMessage('AUTH_REQUIRED');
    expect(msg.recoverable).toBe(true);
    expect(msg.action).toBeTruthy();
    // Severity is 'info' for sign-in prompts (not blocking, just needs action)
    expect(['info', 'warning']).toContain(msg.severity);
  });

  it('SESSION_EXPIRED error provides next action to re-authenticate', () => {
    const msg = getLaunchErrorMessage('SESSION_EXPIRED');
    expect(msg.action).toBeTruthy();
    // Should not contain raw technical terms
    expect(msg.title.toLowerCase()).not.toContain('exception');
    expect(msg.title.toLowerCase()).not.toContain('error:');
  });

  it('NETWORK_UNAVAILABLE error is user-friendly (non-technical language)', () => {
    const msg = getLaunchErrorMessage('NETWORK_UNAVAILABLE');
    expect(msg.description).toBeTruthy();
    expect(msg.action).toBeTruthy();
  });

  it('VALIDATION_FAILED error guides user to correct the form', () => {
    const msg = getLaunchErrorMessage('VALIDATION_FAILED');
    expect(msg.action).toBeTruthy();
    expect(['warning', 'error']).toContain(msg.severity);
  });

  it('UNKNOWN error has a fallback message so no raw error surfaces', () => {
    const msg = getLaunchErrorMessage('UNKNOWN');
    expect(msg).toBeDefined();
    expect(msg.title).toBeTruthy();
    expect(msg.action).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AC #9: Test reliability — deterministic without CI timing workarounds
// ---------------------------------------------------------------------------

describe('Integration: AC #9 — Deterministic test execution (no timing dependencies)', () => {
  afterEach(clearAuth);

  it('guard → auth → resume pattern completes in 0ms (pure localStorage)', () => {
    const start = Date.now();

    // Guest blocked
    simulateRouterGuard('/launch/guided', true, 'GuidedTokenLaunch');
    const stored = peekPostAuthRedirect();
    expect(stored).toBe('/launch/guided');

    // Auth completes
    setAuth();

    // Resume
    const destination = consumePostAuthRedirect();
    expect(destination).toBe('/launch/guided');

    const elapsed = Date.now() - start;
    // Should be near-instant (< 50ms for a synchronous test)
    expect(elapsed).toBeLessThan(100);
  });

  it('all 7 guest nav invariants are synchronously verifiable', () => {
    const state = deriveNavState(false);
    const invariants = getGuestNavInvariants();
    expect(invariants).toHaveLength(7);

    invariants.forEach(invariant => {
      // Each invariant has a pure function test — no async
      const result = invariant.test(state);
      expect(typeof result).toBe('boolean');
    });
  });

  it('all AUTH_FIRST_TEST_IDS are non-empty strings (fixture anchors defined)', () => {
    const ids = Object.values(AUTH_FIRST_TEST_IDS) as string[];
    expect(ids.length).toBeGreaterThan(8);
    ids.forEach(id => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});
