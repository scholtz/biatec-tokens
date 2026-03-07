/**
 * Integration Tests: Auth-First Navigation Invariants
 *
 * Tests the complete auth-first navigation contract across session states:
 *   1. Guest user: correct nav state, no wallet UI, sign-in visible
 *   2. Authenticated user: user menu visible, sign-in hidden
 *   3. Redirect preservation: intended destination stored before auth redirect
 *   4. Post-auth continuation: stored redirect consumed correctly
 *   5. Nav item parity: same items for both guest and authenticated states
 *
 * These tests use the authFirstHardening utility as a behavioral contract.
 * They do NOT use waitForTimeout() — all assertions are synchronous or
 * use deterministic state derivation.
 *
 * Maps to Acceptance Criteria:
 * - AC #1: All entry points enforce deterministic auth-first routing
 * - AC #2: Guest nav has no wallet/network states
 * - AC #3: No test relies on /create/wizard as canonical flow
 * - AC #7: CI passes with no newly introduced skipped tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  deriveNavState,
  assertGuestNavInvariants,
  storePostAuthRedirect,
  consumePostAuthRedirect,
  peekPostAuthRedirect,
  isAuthRequired,
  isGuestAccessible,
  AUTH_FIRST_TEST_IDS,
} from '../../utils/authFirstHardening';
import { AUTH_STORAGE_KEYS } from '../../constants/auth';
import { NAV_ITEMS } from '../../constants/navItems';

// ---------------------------------------------------------------------------
// Helpers simulating router guard behavior
// ---------------------------------------------------------------------------

function simulateGuardAccess(
  path: string,
  requiresAuth: boolean,
  routeName?: string
): { allowed: boolean; redirect?: { path: string; query: Record<string, string> } } {
  if (!requiresAuth) return { allowed: true };
  if (routeName === 'TokenDashboard') return { allowed: true };

  const user = localStorage.getItem('algorand_user');
  if (!user) {
    storePostAuthRedirect(path);
    return { allowed: false, redirect: { path: '/', query: { showAuth: 'true' } } };
  }
  return { allowed: true };
}

function simulateLogin(email: string, address: string): void {
  localStorage.setItem('algorand_user', JSON.stringify({ address, email, isConnected: true }));
}

function simulateLogout(): void {
  localStorage.removeItem('algorand_user');
}

function isLoggedIn(): boolean {
  return !!localStorage.getItem('algorand_user');
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Auth-First Navigation Invariants Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── Guest state invariants ────────────────────────────────────────────────

  it('should pass all guest nav invariants when user is not logged in', () => {
    const state = deriveNavState(false);
    const failures = assertGuestNavInvariants(state);
    expect(failures).toHaveLength(0);
  });

  it('should show Sign In button and hide user menu for guest', () => {
    const state = deriveNavState(false);
    expect(state.showSignIn).toBe(true);
    expect(state.showUserMenu).toBe(false);
  });

  it('should never expose wallet-centric state in guest or auth mode (AC #2)', () => {
    const guest = deriveNavState(false);
    const auth = deriveNavState(true);
    expect(guest.hasWalletState).toBe(false);
    expect(auth.hasWalletState).toBe(false);
  });

  it('should include Guided Launch as the canonical create entry in nav items', () => {
    const state = deriveNavState(false);
    const guidedLaunchItem = state.items.find((item) => item.path === '/launch/workspace');
    expect(guidedLaunchItem).toBeDefined();
    expect(guidedLaunchItem?.routeName).toBe('GuidedLaunchWorkspace');
  });

  // ── Authenticated state invariants ────────────────────────────────────────

  it('should show user menu and hide sign-in for authenticated user', () => {
    simulateLogin('user@example.com', 'TEST_ADDRESS_001');
    const state = deriveNavState(true);
    expect(state.showUserMenu).toBe(true);
    expect(state.showSignIn).toBe(false);
  });

  it('should show subscription badge only when authenticated AND subscribed', () => {
    expect(deriveNavState(true, true).showSubscriptionBadge).toBe(true);
    expect(deriveNavState(true, false).showSubscriptionBadge).toBe(false);
    expect(deriveNavState(false, false).showSubscriptionBadge).toBe(false);
  });

  it('should expose the same nav items for guest and authenticated users', () => {
    const guestState = deriveNavState(false);
    const authState = deriveNavState(true);
    expect(guestState.items).toEqual(authState.items);
  });

  // ── Auth-first redirect flow ──────────────────────────────────────────────

  it('should redirect unauthenticated access to /launch/guided and store destination (AC #1)', () => {
    const result = simulateGuardAccess('/launch/guided', true, 'GuidedTokenLaunch');
    expect(result.allowed).toBe(false);
    expect(result.redirect?.query?.showAuth).toBe('true');
    expect(peekPostAuthRedirect()).toBe('/launch/guided');
  });

  it('should redirect unauthenticated access to /create and store destination', () => {
    const result = simulateGuardAccess('/create', true, 'TokenCreator');
    expect(result.allowed).toBe(false);
    expect(peekPostAuthRedirect()).toBe('/create');
  });

  it('should redirect unauthenticated access to /cockpit and store destination', () => {
    const result = simulateGuardAccess('/cockpit', true, 'LifecycleCockpit');
    expect(result.allowed).toBe(false);
    expect(peekPostAuthRedirect()).toBe('/cockpit');
  });

  it('should allow unauthenticated access to / without storing redirect', () => {
    const result = simulateGuardAccess('/', false, 'Home');
    expect(result.allowed).toBe(true);
    expect(peekPostAuthRedirect()).toBeNull();
  });

  it('should allow unauthenticated access to /marketplace', () => {
    const result = simulateGuardAccess('/marketplace', false, 'Marketplace');
    expect(result.allowed).toBe(true);
  });

  it('should allow access to /dashboard without auth (special exception)', () => {
    // TokenDashboard is exempt: shows empty state for unauthenticated users
    const result = simulateGuardAccess('/dashboard', true, 'TokenDashboard');
    expect(result.allowed).toBe(true);
  });

  // ── Post-auth continuation flow ───────────────────────────────────────────

  it('should resume correct destination after login (AC #1)', () => {
    // Step 1: Guard fires, stores intended path
    simulateGuardAccess('/launch/guided', true, 'GuidedTokenLaunch');
    expect(peekPostAuthRedirect()).toBe('/launch/guided');

    // Step 2: User logs in
    simulateLogin('user@example.com', 'TEST_ADDRESS');
    expect(isLoggedIn()).toBe(true);

    // Step 3: Post-login redirect consumer picks up the stored path
    const redirectPath = consumePostAuthRedirect();
    expect(redirectPath).toBe('/launch/guided');

    // Step 4: Stored redirect is cleared after consumption
    expect(peekPostAuthRedirect()).toBeNull();
  });

  it('should handle multiple sequential redirects correctly (last destination wins)', () => {
    // Simulate two back-to-back access attempts
    storePostAuthRedirect('/create');
    storePostAuthRedirect('/launch/guided'); // overwrites first
    expect(peekPostAuthRedirect()).toBe('/launch/guided');
  });

  it('should not store / as redirect destination (meaningless)', () => {
    storePostAuthRedirect('/');
    expect(peekPostAuthRedirect()).toBeNull();
  });

  it('should use AUTH_STORAGE_KEYS constant for redirect storage', () => {
    storePostAuthRedirect('/cockpit');
    // Verify the underlying key used matches the project constant
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    expect(raw).toBe('/cockpit');
  });

  // ── Legacy route compatibility (AC #3) ───────────────────────────────────

  it('canonical nav should not include /create/wizard as a nav destination', () => {
    const hasWizardPath = NAV_ITEMS.some(
      (item) => (item as { path: string }).path === '/create/wizard'
    );
    expect(hasWizardPath).toBe(false);
  });

  it('canonical workspace entry should point to /launch/workspace not /create/wizard', () => {
    const createTokenItem = NAV_ITEMS.find((item) => item.label === 'Guided Launch');
    expect(createTokenItem?.path).toBe('/launch/workspace');
    expect(createTokenItem?.path).not.toBe('/create/wizard');
    expect(createTokenItem?.path).not.toBe('/create');
  });

  // ── Route classification alignment ───────────────────────────────────────

  it('should classify all routes that require auth in the router as auth-required', () => {
    const authRoutes = [
      '/create',
      '/create/batch',
      '/launch/guided',
      '/cockpit',
      '/settings',
      '/compliance/setup',
      '/attestations',
      '/portfolio',
    ];
    for (const route of authRoutes) {
      expect(isAuthRequired(route)).toBe(true);
    }
  });

  it('should classify public routes as guest-accessible', () => {
    const publicRoutes = ['/', '/marketplace', '/token-standards', '/subscription/pricing'];
    for (const route of publicRoutes) {
      expect(isGuestAccessible(route)).toBe(true);
    }
  });

  // ── Test ID anchor contract ───────────────────────────────────────────────

  it('should have stable test ID constants for E2E anchors', () => {
    expect(AUTH_FIRST_TEST_IDS.SIGN_IN_BUTTON).toBe('auth-sign-in-btn');
    expect(AUTH_FIRST_TEST_IDS.NAV_GUIDED_LAUNCH).toBe('nav-guided-launch');
    expect(AUTH_FIRST_TEST_IDS.ONBOARDING_ERROR_BANNER).toBe('onboarding-error-banner');
  });

  // ── Logout clears auth state ──────────────────────────────────────────────

  it('should reflect unauthenticated state after logout', () => {
    simulateLogin('user@example.com', 'TEST_ADDRESS');
    expect(isLoggedIn()).toBe(true);

    simulateLogout();
    expect(isLoggedIn()).toBe(false);

    // Guard should redirect after logout
    const result = simulateGuardAccess('/launch/guided', true, 'GuidedTokenLaunch');
    expect(result.allowed).toBe(false);
  });
});
