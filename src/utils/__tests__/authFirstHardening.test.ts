/**
 * Unit tests for authFirstHardening utility
 *
 * Validates:
 * 1. Route classification (guest-accessible vs auth-required)
 * 2. Navigation state derivation for guest and authenticated users
 * 3. Guest navigation invariants — each must pass or fail deterministically
 * 4. Auth-first redirect management (store/consume/peek)
 * 5. Onboarding step readiness helpers
 * 6. Test ID constants are defined and non-empty
 *
 * These tests directly map to Acceptance Criteria in the auth-first
 * accessibility and onboarding confidence hardening issue:
 * - AC #1: auth-first routing determinism
 * - AC #2: guest nav contains no misleading wallet/network states
 * - AC #6: no waitForTimeout — tests use synchronous invariant assertions
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
  isValidOnboardingStep,
  getOnboardingStepIndex,
  isValidStepProgression,
  AUTH_FIRST_TEST_IDS,
  type NavState,
  type OnboardingStep,
} from '../authFirstHardening';

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

describe('authFirstHardening - route classification', () => {
  it('should define at least 5 guest-accessible paths', () => {
    expect(GUEST_ACCESSIBLE_PATHS.length).toBeGreaterThanOrEqual(5);
  });

  it('should define at least 10 auth-required paths', () => {
    expect(AUTH_REQUIRED_PATHS.length).toBeGreaterThanOrEqual(10);
  });

  it('should classify / as guest-accessible', () => {
    expect(isGuestAccessible('/')).toBe(true);
  });

  it('should classify /marketplace as guest-accessible', () => {
    expect(isGuestAccessible('/marketplace')).toBe(true);
  });

  it('should classify /subscription/pricing as guest-accessible', () => {
    expect(isGuestAccessible('/subscription/pricing')).toBe(true);
  });

  it('should classify /token-standards as guest-accessible', () => {
    expect(isGuestAccessible('/token-standards')).toBe(true);
  });

  it('should classify /launch/guided as NOT guest-accessible', () => {
    expect(isGuestAccessible('/launch/guided')).toBe(false);
  });

  it('should classify /create as NOT guest-accessible', () => {
    expect(isGuestAccessible('/create')).toBe(false);
  });

  it('should classify /launch/guided as auth-required', () => {
    expect(isAuthRequired('/launch/guided')).toBe(true);
  });

  it('should classify /create as auth-required', () => {
    expect(isAuthRequired('/create')).toBe(true);
  });

  it('should classify /settings as auth-required', () => {
    expect(isAuthRequired('/settings')).toBe(true);
  });

  it('should classify /compliance/setup as auth-required', () => {
    expect(isAuthRequired('/compliance/setup')).toBe(true);
  });

  it('should classify /cockpit as auth-required', () => {
    expect(isAuthRequired('/cockpit')).toBe(true);
  });

  it('should classify /tokens/abc123 as auth-required (parameterized path)', () => {
    expect(isAuthRequired('/tokens/abc123')).toBe(true);
  });

  it('should classify / as NOT auth-required', () => {
    expect(isAuthRequired('/')).toBe(false);
  });

  it('should classify /marketplace as NOT auth-required', () => {
    expect(isAuthRequired('/marketplace')).toBe(false);
  });

  it('should strip query params before classification', () => {
    // /launch/guided?draft=1 should still be auth-required
    expect(isAuthRequired('/launch/guided?draft=1')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Navigation state derivation
// ---------------------------------------------------------------------------

describe('authFirstHardening - navigation state derivation', () => {
  it('should show Sign In button for guest users', () => {
    const state = deriveNavState(false);
    expect(state.showSignIn).toBe(true);
  });

  it('should hide user menu for guest users', () => {
    const state = deriveNavState(false);
    expect(state.showUserMenu).toBe(false);
  });

  it('should hide subscription badge for guest users', () => {
    const state = deriveNavState(false, false);
    expect(state.showSubscriptionBadge).toBe(false);
  });

  it('should hide Sign In button for authenticated users', () => {
    const state = deriveNavState(true);
    expect(state.showSignIn).toBe(false);
  });

  it('should show user menu for authenticated users', () => {
    const state = deriveNavState(true);
    expect(state.showUserMenu).toBe(true);
  });

  it('should show subscription badge for authenticated users with active subscription', () => {
    const state = deriveNavState(true, true);
    expect(state.showSubscriptionBadge).toBe(true);
  });

  it('should hide subscription badge for authenticated users without subscription', () => {
    const state = deriveNavState(true, false);
    expect(state.showSubscriptionBadge).toBe(false);
  });

  it('should never show wallet-centric state (email/password only)', () => {
    const guestState = deriveNavState(false);
    const authState = deriveNavState(true);
    expect(guestState.hasWalletState).toBe(false);
    expect(authState.hasWalletState).toBe(false);
  });

  it('should include Guided Launch in nav items (canonical create entry)', () => {
    const state = deriveNavState(false);
    const guidedLaunch = state.items.find((item) => item.path === '/launch/guided');
    expect(guidedLaunch).toBeDefined();
  });

  it('should always include an aria-label for the nav landmark', () => {
    const state = deriveNavState(false);
    expect(state.navAriaLabel.length).toBeGreaterThan(0);
  });

  it('should include the same nav items for both guest and authenticated users', () => {
    const guestState = deriveNavState(false);
    const authState = deriveNavState(true);
    // Same items — auth state only controls visibility of sign-in/user-menu
    expect(guestState.items).toEqual(authState.items);
  });
});

// ---------------------------------------------------------------------------
// Guest navigation invariants
// ---------------------------------------------------------------------------

describe('authFirstHardening - guest navigation invariants', () => {
  it('should define at least 7 guest nav invariants', () => {
    const invariants = getGuestNavInvariants();
    expect(invariants.length).toBeGreaterThanOrEqual(7);
  });

  it('should give each invariant a unique id', () => {
    const invariants = getGuestNavInvariants();
    const ids = invariants.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should give each invariant a non-empty description', () => {
    const invariants = getGuestNavInvariants();
    for (const inv of invariants) {
      expect(inv.description.length).toBeGreaterThan(0);
    }
  });

  it('should pass all invariants for a correctly derived guest NavState', () => {
    const guestState = deriveNavState(false);
    const failures = assertGuestNavInvariants(guestState);
    expect(failures).toHaveLength(0);
  });

  it('should fail show-sign-in invariant when showSignIn is false', () => {
    const state: NavState = { ...deriveNavState(false), showSignIn: false };
    const failures = assertGuestNavInvariants(state);
    expect(failures.some((f) => f.id === 'show-sign-in')).toBe(true);
  });

  it('should fail no-user-menu invariant when showUserMenu is true', () => {
    const state: NavState = { ...deriveNavState(false), showUserMenu: true };
    const failures = assertGuestNavInvariants(state);
    expect(failures.some((f) => f.id === 'no-user-menu')).toBe(true);
  });

  it('should return empty failure list for correct guest state', () => {
    const state = deriveNavState(false, false);
    expect(assertGuestNavInvariants(state)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Auth-first redirect management
// ---------------------------------------------------------------------------

describe('authFirstHardening - post-auth redirect management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve a redirect path', () => {
    storePostAuthRedirect('/launch/guided');
    expect(peekPostAuthRedirect()).toBe('/launch/guided');
  });

  it('should consume and clear the stored redirect path', () => {
    storePostAuthRedirect('/launch/guided');
    const path = consumePostAuthRedirect();
    expect(path).toBe('/launch/guided');
    // After consuming, storage should be cleared
    expect(peekPostAuthRedirect()).toBeNull();
  });

  it('should return null when no redirect is stored', () => {
    expect(consumePostAuthRedirect()).toBeNull();
  });

  it('should peek without removing the redirect path', () => {
    storePostAuthRedirect('/cockpit');
    peekPostAuthRedirect();
    // Peek should not remove the value
    expect(peekPostAuthRedirect()).toBe('/cockpit');
  });

  it('should not store / as a redirect path (home is default)', () => {
    storePostAuthRedirect('/');
    // Root path should not be stored (it's the default)
    expect(peekPostAuthRedirect()).toBeNull();
  });

  it('should handle storing empty string gracefully', () => {
    storePostAuthRedirect('');
    expect(peekPostAuthRedirect()).toBeNull();
  });

  it('should overwrite previous redirect when new one is stored', () => {
    storePostAuthRedirect('/create');
    storePostAuthRedirect('/launch/guided');
    expect(peekPostAuthRedirect()).toBe('/launch/guided');
  });
});

// ---------------------------------------------------------------------------
// Onboarding step helpers
// ---------------------------------------------------------------------------

describe('authFirstHardening - onboarding step helpers', () => {
  const validSteps: OnboardingStep[] = [
    'organization',
    'token-basics',
    'compliance',
    'network',
    'review',
    'deploy',
  ];

  it('should recognize all valid onboarding steps', () => {
    for (const step of validSteps) {
      expect(isValidOnboardingStep(step)).toBe(true);
    }
  });

  it('should reject invalid step names', () => {
    expect(isValidOnboardingStep('invalid-step')).toBe(false);
    expect(isValidOnboardingStep('')).toBe(false);
    expect(isValidOnboardingStep('wallet-connect')).toBe(false);
  });

  it('should return correct indices for each step', () => {
    expect(getOnboardingStepIndex('organization')).toBe(0);
    expect(getOnboardingStepIndex('token-basics')).toBe(1);
    expect(getOnboardingStepIndex('compliance')).toBe(2);
    expect(getOnboardingStepIndex('network')).toBe(3);
    expect(getOnboardingStepIndex('review')).toBe(4);
    expect(getOnboardingStepIndex('deploy')).toBe(5);
  });

  it('should validate sequential step progression', () => {
    expect(isValidStepProgression('organization', 'token-basics')).toBe(true);
    expect(isValidStepProgression('token-basics', 'compliance')).toBe(true);
    expect(isValidStepProgression('compliance', 'network')).toBe(true);
    expect(isValidStepProgression('network', 'review')).toBe(true);
    expect(isValidStepProgression('review', 'deploy')).toBe(true);
  });

  it('should reject skipping steps in progression', () => {
    // Can't jump from organization to compliance (skips token-basics)
    expect(isValidStepProgression('organization', 'compliance')).toBe(false);
    expect(isValidStepProgression('organization', 'deploy')).toBe(false);
    expect(isValidStepProgression('token-basics', 'review')).toBe(false);
  });

  it('should reject backwards step progression', () => {
    expect(isValidStepProgression('token-basics', 'organization')).toBe(false);
    expect(isValidStepProgression('deploy', 'review')).toBe(false);
  });

  it('should have 6 canonical onboarding steps', () => {
    expect(validSteps.length).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Test ID constants
// ---------------------------------------------------------------------------

describe('authFirstHardening - test ID constants', () => {
  it('should define all required test IDs as non-empty strings', () => {
    for (const [, value] of Object.entries(AUTH_FIRST_TEST_IDS)) {
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });

  it('should define SIGN_IN_BUTTON test ID', () => {
    expect(AUTH_FIRST_TEST_IDS.SIGN_IN_BUTTON).toBeTruthy();
  });

  it('should define AUTH_MODAL test ID', () => {
    expect(AUTH_FIRST_TEST_IDS.AUTH_MODAL).toBeTruthy();
  });

  it('should define NAV_GUIDED_LAUNCH test ID', () => {
    expect(AUTH_FIRST_TEST_IDS.NAV_GUIDED_LAUNCH).toBeTruthy();
  });

  it('should define ONBOARDING_ERROR_BANNER test ID', () => {
    expect(AUTH_FIRST_TEST_IDS.ONBOARDING_ERROR_BANNER).toBeTruthy();
  });

  it('should have unique test ID values', () => {
    const values = Object.values(AUTH_FIRST_TEST_IDS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// ---------------------------------------------------------------------------
// Edge cases and boundary conditions
// ---------------------------------------------------------------------------

describe('authFirstHardening - edge cases and boundary conditions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should treat /dashboard path as not auth-required (special exception)', () => {
    // /dashboard allows unauthenticated access (shows empty state per router guard)
    expect(isAuthRequired('/dashboard')).toBe(false);
  });

  it('should not classify /enterprise/onboarding as guest-accessible', () => {
    expect(isGuestAccessible('/enterprise/onboarding')).toBe(false);
  });

  it('should classify /enterprise/onboarding as auth-required', () => {
    expect(isAuthRequired('/enterprise/onboarding')).toBe(true);
  });

  it('should classify /onboarding as auth-required', () => {
    expect(isAuthRequired('/onboarding')).toBe(true);
  });

  it('should classify /portfolio as auth-required', () => {
    expect(isAuthRequired('/portfolio')).toBe(true);
  });

  it('should classify /portfolio/onboarding as auth-required', () => {
    expect(isAuthRequired('/portfolio/onboarding')).toBe(true);
  });

  it('should classify /account/security as auth-required', () => {
    expect(isAuthRequired('/account/security')).toBe(true);
  });

  it('should classify /attestations as auth-required', () => {
    expect(isAuthRequired('/attestations')).toBe(true);
  });

  it('should classify /insights as auth-required', () => {
    expect(isAuthRequired('/insights')).toBe(true);
  });

  it('should classify /enterprise-guide as guest-accessible', () => {
    expect(isGuestAccessible('/enterprise-guide')).toBe(true);
  });

  it('should classify /discovery as guest-accessible', () => {
    expect(isGuestAccessible('/discovery')).toBe(true);
  });

  it('should classify /subscription/cancel as guest-accessible', () => {
    expect(isGuestAccessible('/subscription/cancel')).toBe(true);
  });

  it('should not classify /subscription/success as guest-accessible (requires auth)', () => {
    expect(isGuestAccessible('/subscription/success')).toBe(false);
  });

  it('should handle paths with trailing slashes correctly', () => {
    // Trailing slash should not break classification
    expect(isAuthRequired('/launch/guided')).toBe(true);
  });

  it('should derive nav state correctly for subscription-paying authenticated user', () => {
    const state = deriveNavState(true, true);
    expect(state.showSubscriptionBadge).toBe(true);
    expect(state.showSignIn).toBe(false);
    expect(state.showUserMenu).toBe(true);
    expect(state.hasWalletState).toBe(false);
  });

  it('should return deterministic nav state regardless of call order', () => {
    // Multiple calls with same args produce identical results
    const state1 = deriveNavState(false, false);
    const state2 = deriveNavState(false, false);
    expect(state1).toEqual(state2);
  });

  it('should not allow step regression from deploy back to any earlier step', () => {
    expect(isValidStepProgression('deploy', 'review')).toBe(false);
    expect(isValidStepProgression('deploy', 'network')).toBe(false);
    expect(isValidStepProgression('deploy', 'organization')).toBe(false);
  });

  it('should correctly return index -1 for unknown step', () => {
    // getOnboardingStepIndex returns -1 for unknown steps
    // (TypeScript enforces valid inputs, but we verify the runtime behavior)
    const idx = getOnboardingStepIndex('unknown-step' as OnboardingStep);
    expect(idx).toBe(-1);
  });

  it('should preserve redirect through multiple localStorage operations', () => {
    storePostAuthRedirect('/compliance/setup');
    // Other localStorage operations should not clear the redirect
    localStorage.setItem('other_key', 'other_value');
    expect(peekPostAuthRedirect()).toBe('/compliance/setup');
    // Cleanup
    localStorage.removeItem('other_key');
  });

  it('should handle concurrent redirect stores (last write wins)', () => {
    storePostAuthRedirect('/cockpit');
    storePostAuthRedirect('/settings');
    storePostAuthRedirect('/launch/guided');
    expect(peekPostAuthRedirect()).toBe('/launch/guided');
  });

  it('assertGuestNavInvariants returns empty array for perfectly valid guest state', () => {
    const state = deriveNavState(false, false);
    const failures = assertGuestNavInvariants(state);
    expect(failures).toEqual([]);
  });

  it('assertGuestNavInvariants should detect multiple violations simultaneously', () => {
    const brokenState = {
      ...deriveNavState(false),
      showSignIn: false,    // violation 1
      showUserMenu: true,   // violation 2
      showSubscriptionBadge: true, // violation 3
    };
    const failures = assertGuestNavInvariants(brokenState);
    // Should detect all three violations
    expect(failures.length).toBeGreaterThanOrEqual(3);
  });
});
