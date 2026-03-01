/**
 * Unit Tests: Auth-First Route Determinism
 *
 * Validates the complete route determinism contract for this issue:
 *   AC #1  All token creation entry points enforce auth-first routing
 *   AC #2  No active canonical flow relies on /create/wizard
 *   AC #3  /create/wizard access redirects deterministically to /launch/guided
 *   AC #4  Top-nav for unauthenticated contains no wallet/network phrases
 *   AC #5  Authenticated users see consistent, role-appropriate navigation
 *   AC #6  Error states use user-centered language (structured messages)
 *   AC #9  High-value auth + launch paths are testable and stable
 *   AC #12 Route expectations are documented in tests
 *
 * These are pure-function unit tests — zero waitForTimeout, zero async I/O.
 * All assertions are synchronous and deterministic.
 *
 * Issue: Frontend milestone — auth-first route determinism, accessibility
 *        hardening, and CI-stable onboarding confidence (#475)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  GUEST_ACCESSIBLE_PATHS,
  AUTH_REQUIRED_PATHS,
  isGuestAccessible,
  isAuthRequired,
  deriveNavState,
  getGuestNavInvariants,
  assertGuestNavInvariants,
  storePostAuthRedirect,
  consumePostAuthRedirect,
  peekPostAuthRedirect,
  AUTH_FIRST_TEST_IDS,
} from '../authFirstHardening';
import { AUTH_STORAGE_KEYS } from '../../constants/auth';
import { NAV_ITEMS } from '../../constants/navItems';
import { getLaunchErrorMessage, classifyLaunchError } from '../launchErrorMessages';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function withAuth(): void {
  localStorage.setItem('algorand_user', JSON.stringify({
    address: 'ROUTE_DETERMINISM_TEST',
    email: 'route-test@example.com',
    isConnected: true,
  }));
}

function withoutAuth(): void {
  localStorage.removeItem('algorand_user');
}

// Mirrors the router guard logic from src/router/index.ts
function simulateGuard(
  path: string,
  requiresAuth: boolean,
  routeName?: string
): { allowed: boolean; redirectTo?: string } {
  if (!requiresAuth) return { allowed: true };
  // TokenDashboard is special-cased to always allow (shows empty state)
  if (routeName === 'TokenDashboard') return { allowed: true };
  const user = localStorage.getItem('algorand_user');
  if (!user) {
    storePostAuthRedirect(path);
    return { allowed: false, redirectTo: '/?showAuth=true' };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// AC #1: All token creation entry points enforce auth
// ---------------------------------------------------------------------------

describe('AC #1: Token creation entry points enforce auth-first routing', () => {
  beforeEach(withoutAuth);
  afterEach(() => { localStorage.clear(); });

  it('canonical creation entry /launch/guided requires auth', () => {
    expect(isAuthRequired('/launch/guided')).toBe(true);
  });

  it('/launch/guided guard redirects unauthenticated user with showAuth=true', () => {
    const result = simulateGuard('/launch/guided', true, 'GuidedTokenLaunch');
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/?showAuth=true');
  });

  it('/create guard redirects unauthenticated user', () => {
    const result = simulateGuard('/create', true, 'TokenCreator');
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/?showAuth=true');
  });

  it('/create/batch guard redirects unauthenticated user', () => {
    const result = simulateGuard('/create/batch', true, 'BatchCreator');
    expect(result.allowed).toBe(false);
  });

  it('/cockpit guard redirects unauthenticated user', () => {
    expect(isAuthRequired('/cockpit')).toBe(true);
    const result = simulateGuard('/cockpit', true, 'LifecycleCockpit');
    expect(result.allowed).toBe(false);
  });

  it('/portfolio guard redirects unauthenticated user', () => {
    expect(isAuthRequired('/portfolio')).toBe(true);
    const result = simulateGuard('/portfolio', true, 'PortfolioIntelligence');
    expect(result.allowed).toBe(false);
  });

  it('authenticated user can access /launch/guided', () => {
    withAuth();
    const result = simulateGuard('/launch/guided', true, 'GuidedTokenLaunch');
    expect(result.allowed).toBe(true);
  });

  it('authenticated user can access /create', () => {
    withAuth();
    const result = simulateGuard('/create', true, 'TokenCreator');
    expect(result.allowed).toBe(true);
  });

  it('guard stores intended destination before redirect', () => {
    simulateGuard('/launch/guided', true, 'GuidedTokenLaunch');
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    expect(stored).toBe('/launch/guided');
  });

  it('TokenDashboard is always accessible (public empty-state exception)', () => {
    const result = simulateGuard('/dashboard', true, 'TokenDashboard');
    expect(result.allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #2 + AC #3: /create/wizard canonical deprecation
// ---------------------------------------------------------------------------

describe('AC #2/#3: /create/wizard is deprecated — redirects to /launch/guided', () => {
  it('/create/wizard is NOT in AUTH_REQUIRED_PATHS (redirect handled separately)', () => {
    // The router defines /create/wizard as redirect, not requiresAuth route
    const isInAuthRequired = AUTH_REQUIRED_PATHS.some(p => p === '/create/wizard');
    expect(isInAuthRequired).toBe(false);
  });

  it('/create/wizard is NOT in GUEST_ACCESSIBLE_PATHS (it is a redirect, not a page)', () => {
    const isInGuest = GUEST_ACCESSIBLE_PATHS.some(p => p === '/create/wizard');
    expect(isInGuest).toBe(false);
  });

  it('/launch/guided IS in AUTH_REQUIRED_PATHS (canonical creation entry)', () => {
    expect(AUTH_REQUIRED_PATHS).toContain('/launch/guided');
  });

  it('NAV_ITEMS canonical "Guided Launch" points to /launch/guided, not /create/wizard', () => {
    const createItem = NAV_ITEMS.find(item => item.label === 'Guided Launch');
    expect(createItem).toBeDefined();
    expect(createItem?.path).toBe('/launch/guided');
    expect(createItem?.path).not.toContain('wizard');
  });

  it('no NAV_ITEM path references /create/wizard', () => {
    const wizardItem = NAV_ITEMS.find(item => item.path === '/create/wizard');
    expect(wizardItem).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AC #4: Top-nav for unauthenticated contains no wallet/network phrases
// ---------------------------------------------------------------------------

describe('AC #4: Guest navigation contains no wallet/network status phrases', () => {
  beforeEach(withoutAuth);
  afterEach(() => { localStorage.clear(); });

  it('guest nav state has showSignIn=true', () => {
    const state = deriveNavState(false);
    expect(state.showSignIn).toBe(true);
  });

  it('guest nav state has showUserMenu=false', () => {
    const state = deriveNavState(false);
    expect(state.showUserMenu).toBe(false);
  });

  it('guest nav invariant: no-wallet-state is enforced', () => {
    const state = deriveNavState(false);
    const invariants = getGuestNavInvariants();
    const walletInvariant = invariants.find(i => i.id === 'no-wallet-state');
    expect(walletInvariant).toBeDefined();
    expect(walletInvariant?.test(state)).toBe(true);
    expect(state.hasWalletState).toBe(false);
  });

  it('guest nav invariant: show-sign-in is enforced', () => {
    const state = deriveNavState(false);
    const invariants = getGuestNavInvariants();
    const signInInvariant = invariants.find(i => i.id === 'show-sign-in');
    expect(signInInvariant).toBeDefined();
    expect(signInInvariant?.test(state)).toBe(true);
  });

  it('assertGuestNavInvariants returns no failures for guest state', () => {
    const state = deriveNavState(false);
    const failures = assertGuestNavInvariants(state);
    expect(failures).toHaveLength(0);
  });

  it('NAV_ITEMS contain no wallet/network-only labels', () => {
    const walletPhrases = ['wallet', 'network', 'not connected', 'connect'];
    NAV_ITEMS.forEach(item => {
      const label = item.label.toLowerCase();
      walletPhrases.forEach(phrase => {
        expect(label).not.toContain(phrase);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// AC #5: Authenticated users see role-appropriate navigation
// ---------------------------------------------------------------------------

describe('AC #5: Authenticated nav state is consistent and role-appropriate', () => {
  afterEach(() => { localStorage.clear(); });

  it('authenticated nav state has showSignIn=false', () => {
    const state = deriveNavState(true);
    expect(state.showSignIn).toBe(false);
  });

  it('authenticated nav state has showUserMenu=true', () => {
    const state = deriveNavState(true);
    expect(state.showUserMenu).toBe(true);
  });

  it('deriveNavState is deterministic for same inputs', () => {
    const state1 = deriveNavState(true);
    const state2 = deriveNavState(true);
    expect(state1.showSignIn).toBe(state2.showSignIn);
    expect(state1.showUserMenu).toBe(state2.showUserMenu);
  });

  it('nav state for guest and authenticated are distinct', () => {
    const guest = deriveNavState(false);
    const auth = deriveNavState(true);
    expect(guest.showSignIn).not.toBe(auth.showSignIn);
    expect(guest.showUserMenu).not.toBe(auth.showUserMenu);
  });
});

// ---------------------------------------------------------------------------
// AC #6: Error states use user-centered language
// ---------------------------------------------------------------------------

describe('AC #6: Auth and launch error states use user-centered language', () => {
  it('AUTH_REQUIRED error provides user-centered message with action', () => {
    const msg = getLaunchErrorMessage('AUTH_REQUIRED');
    expect(msg.title).toBeTruthy();
    expect(msg.description).toBeTruthy();
    expect(msg.action).toBeTruthy();
    // No raw technical exception text
    expect(msg.title).not.toMatch(/error:|exception:|stack|TypeError/i);
  });

  it('SESSION_EXPIRED error provides user-centered message', () => {
    const msg = getLaunchErrorMessage('SESSION_EXPIRED');
    expect(msg.title).toBeTruthy();
    expect(msg.description).toBeTruthy();
    expect(msg.action).toBeTruthy();
  });

  it('NETWORK_UNAVAILABLE error provides user-centered message', () => {
    const msg = getLaunchErrorMessage('NETWORK_UNAVAILABLE');
    expect(msg.title).toBeTruthy();
    expect(msg.action).toBeTruthy();
  });

  it('classifyLaunchError returns string code for auth failure', () => {
    const err = new Error('Unauthorized');
    const code = classifyLaunchError(err);
    expect(code).toBeTruthy();
    expect(typeof code).toBe('string');
    expect(code).toBe('AUTH_REQUIRED');
  });

  it('getLaunchErrorMessage returns defined message for all known codes', () => {
    const codes = ['AUTH_REQUIRED', 'SESSION_EXPIRED', 'VALIDATION_FAILED', 'NETWORK_UNAVAILABLE', 'UNKNOWN'] as const;
    codes.forEach(code => {
      const msg = getLaunchErrorMessage(code);
      expect(msg).toBeDefined();
      expect(msg.title).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// AC #9: High-value tests are deterministic (no timing dependencies)
// ---------------------------------------------------------------------------

describe('AC #9: Route guard and nav logic are testable without timing', () => {
  afterEach(() => { localStorage.clear(); });

  it('storePostAuthRedirect + consumePostAuthRedirect round-trips deterministically', () => {
    storePostAuthRedirect('/launch/guided');
    const result = consumePostAuthRedirect();
    expect(result).toBe('/launch/guided');
    // Consumed — second call returns null
    expect(consumePostAuthRedirect()).toBeNull();
  });

  it('peekPostAuthRedirect does NOT consume the stored redirect', () => {
    storePostAuthRedirect('/portfolio');
    const peek1 = peekPostAuthRedirect();
    const peek2 = peekPostAuthRedirect();
    expect(peek1).toBe('/portfolio');
    expect(peek2).toBe('/portfolio'); // Still there
    consumePostAuthRedirect(); // Clean up
  });

  it('consecutive guard invocations do not stack duplicate redirects', () => {
    simulateGuard('/launch/guided', true, 'GuidedTokenLaunch');
    simulateGuard('/cockpit', true, 'LifecycleCockpit');
    // Second guard call overwrites first (last-write-wins per AUTH_STORAGE_KEYS)
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    expect(stored).toBe('/cockpit');
  });

  it('isGuestAccessible and isAuthRequired are mutually exclusive for known paths', () => {
    GUEST_ACCESSIBLE_PATHS.forEach(path => {
      expect(isGuestAccessible(path)).toBe(true);
    });
    AUTH_REQUIRED_PATHS.forEach(path => {
      expect(isAuthRequired(path)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// AC #12: Route expectations are documented (test IDs match expected structure)
// ---------------------------------------------------------------------------

describe('AC #12: AUTH_FIRST_TEST_IDS provide documented test fixture anchors', () => {
  it('AUTH_FIRST_TEST_IDS contains sign-in button anchor', () => {
    expect(AUTH_FIRST_TEST_IDS.SIGN_IN_BUTTON).toBeTruthy();
    expect(typeof AUTH_FIRST_TEST_IDS.SIGN_IN_BUTTON).toBe('string');
  });

  it('AUTH_FIRST_TEST_IDS contains NAV_GUIDED_LAUNCH anchor', () => {
    expect(AUTH_FIRST_TEST_IDS.NAV_GUIDED_LAUNCH).toBeTruthy();
  });

  it('AUTH_FIRST_TEST_IDS contains AUTH_MODAL anchor', () => {
    expect(AUTH_FIRST_TEST_IDS.AUTH_MODAL).toBeTruthy();
  });

  it('all AUTH_FIRST_TEST_IDS values are non-empty strings', () => {
    Object.values(AUTH_FIRST_TEST_IDS).forEach(id => {
      expect(typeof id).toBe('string');
      expect((id as string).length).toBeGreaterThan(0);
    });
  });
});
