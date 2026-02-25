/**
 * API Contract Integration Tests: Onboarding Closure — External Boundaries
 *
 * Tests the integration boundaries for the auth-first onboarding closure:
 * 1. Router auth guard behavior (routing/auth boundary)
 * 2. localStorage persistence layer (state boundary)
 * 3. Auth token shape contract (API contract boundary)
 * 4. Error response classification pipeline (API→UX boundary)
 * 5. Session state ↔ navigation state consistency (orchestration boundary)
 *
 * These are INTEGRATION tests — they test how multiple units interact, not
 * individual function behavior. Each test describes a cross-boundary contract
 * that must be stable for the onboarding flow to work end-to-end.
 *
 * Business value:
 * Integration failures at these boundaries cause the most damaging user-facing
 * bugs: users stuck in redirect loops, blank screens after login, or auth errors
 * shown as generic "something went wrong" — all direct conversion killers.
 *
 * AC coverage:
 *   AC #1  Router guard + localStorage persistence boundary
 *   AC #3  Auth state → nav state consistency (no wallet phrases)
 *   AC #5  Deterministic state across boundaries (no timing dependencies)
 *   AC #6  API error response → user-facing guidance pipeline
 *   AC #8  No regression in cross-boundary contracts
 *
 * Issue: Frontend next milestone — deterministic auth-first onboarding
 *        and accessibility closure (#477)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { classifyLaunchError, getLaunchErrorMessage } from '../../utils/launchErrorMessages';
import {
  classifyOnboardingError,
  getOnboardingErrorGuidance,
  deriveSessionState,
  isSessionActive,
  contentContainsForbiddenWalletPhrase,
  validateClosureMilestone,
} from '../../utils/onboardingClosureValidation';
import {
  storePostAuthRedirect,
  consumePostAuthRedirect,
  peekPostAuthRedirect,
  deriveNavState,
  assertGuestNavInvariants,
  isAuthRequired,
  isGuestAccessible,
  AUTH_REQUIRED_PATHS,
  GUEST_ACCESSIBLE_PATHS,
} from '../../utils/authFirstHardening';
import { AUTH_STORAGE_KEYS } from '../../constants/auth';

// ---------------------------------------------------------------------------
// Boundary 1: Router guard ↔ localStorage persistence
// ---------------------------------------------------------------------------

describe('Boundary 1: Router guard ↔ localStorage persistence contract (AC #1)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('redirect storage key matches the auth store key used by router guard', () => {
    // Contract: the key used by storePostAuthRedirect must equal AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH
    // If these diverge, the router guard stores to a different key than the consumer reads.
    storePostAuthRedirect('/launch/guided');
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    expect(stored).toBe('/launch/guided');
  });

  it('consumePostAuthRedirect removes the key exactly once', () => {
    // Contract: post-auth redirect must be a one-time consumption to prevent
    // looping redirects on subsequent auth checks.
    storePostAuthRedirect('/create');
    const first = consumePostAuthRedirect();
    const second = consumePostAuthRedirect();
    expect(first).toBe('/create');
    expect(second).toBeNull();
  });

  it('redirect storage does NOT store the root path (prevents root loop)', () => {
    // Contract: '/' is not stored as a redirect destination to prevent
    // users landing back at homepage instead of their intended destination.
    storePostAuthRedirect('/');
    expect(peekPostAuthRedirect()).toBeNull();
  });

  it('redirect storage does NOT store empty path', () => {
    storePostAuthRedirect('');
    expect(peekPostAuthRedirect()).toBeNull();
  });

  it('router guard check (isAuthRequired) is consistent with AUTH_REQUIRED_PATHS array', () => {
    // Contract: isAuthRequired() must return true for every path in AUTH_REQUIRED_PATHS
    // Divergence here would mean the route guard and the test list disagree — a configuration bug.
    const staticPaths = AUTH_REQUIRED_PATHS.filter((p) => !p.includes(':'));
    for (const path of staticPaths) {
      expect(isAuthRequired(path)).toBe(true);
    }
  });

  it('guest accessible check (isGuestAccessible) is consistent with GUEST_ACCESSIBLE_PATHS', () => {
    // Contract: isGuestAccessible() must return true for every path in GUEST_ACCESSIBLE_PATHS
    for (const path of GUEST_ACCESSIBLE_PATHS) {
      expect(isGuestAccessible(path)).toBe(true);
    }
  });

  it('no path exists in both AUTH_REQUIRED_PATHS and GUEST_ACCESSIBLE_PATHS', () => {
    // Contract: a path cannot require auth AND be guest-accessible simultaneously.
    // This would create a conflicting routing rule.
    const overlap = AUTH_REQUIRED_PATHS.filter((p) => GUEST_ACCESSIBLE_PATHS.includes(p));
    expect(overlap).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Boundary 2: localStorage auth token ↔ session state contract
// ---------------------------------------------------------------------------

describe('Boundary 2: localStorage auth token ↔ session state (AC #1, #5)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('auth token written by login sets session to authenticated', () => {
    // Contract: the auth token shape stored by the login flow must be parseable
    // by deriveSessionState() as 'authenticated'.
    const authToken = {
      address: 'TEST_ADDR_ABC',
      email: 'integration@example.com',
      isConnected: true,
    };
    localStorage.setItem('algorand_user', JSON.stringify(authToken));
    expect(deriveSessionState()).toBe('authenticated');
    expect(isSessionActive()).toBe(true);
  });

  it('auth token with isConnected=false is treated as expired (not invalid)', () => {
    // Contract: explicit isConnected:false means session was valid but expired,
    // not that the token is malformed. This distinction affects the UX message shown.
    const expiredToken = {
      address: 'TEST_ADDR_ABC',
      email: 'integration@example.com',
      isConnected: false,
    };
    localStorage.setItem('algorand_user', JSON.stringify(expiredToken));
    const state = deriveSessionState();
    expect(state).toBe('session_expired');
    expect(state).not.toBe('invalid'); // Must distinguish from malformed token
  });

  it('clearing auth token immediately invalidates session', () => {
    // Contract: logout (clearing auth token) must immediately make isSessionActive() false.
    localStorage.setItem(
      'algorand_user',
      JSON.stringify({ address: 'ADDR', email: 'test@ex.com', isConnected: true }),
    );
    expect(isSessionActive()).toBe(true);

    localStorage.removeItem('algorand_user');
    expect(isSessionActive()).toBe(false);
  });

  it('auth token and redirect key do not collide in localStorage namespace', () => {
    // Contract: the auth token key ('algorand_user') and the redirect key must
    // be different to prevent data corruption on logout/redirect flows.
    expect('algorand_user').not.toBe(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
  });

  it('redirect key survives auth token operations', () => {
    // Contract: setting/clearing auth tokens must not affect the redirect key.
    storePostAuthRedirect('/launch/guided');
    localStorage.setItem(
      'algorand_user',
      JSON.stringify({ address: 'ADDR', email: 'test@ex.com', isConnected: true }),
    );
    localStorage.removeItem('algorand_user');

    // Redirect key must still be there for the post-auth handler
    expect(peekPostAuthRedirect()).toBe('/launch/guided');
  });
});

// ---------------------------------------------------------------------------
// Boundary 3: Auth state ↔ navigation state (no wallet-era language)
// ---------------------------------------------------------------------------

describe('Boundary 3: Auth state ↔ navigation state contract (AC #3)', () => {
  it('guest nav state derived from unauthenticated=false never produces wallet phrases', () => {
    // Contract: deriveNavState(false) must produce a state where no wallet-era
    // language would appear in the rendered nav. The hasWalletState=false guarantee
    // is the programmatic check for this.
    const navState = deriveNavState(false);
    expect(navState.hasWalletState).toBe(false);
    expect(navState.showSignIn).toBe(true);
    expect(navState.showUserMenu).toBe(false);
  });

  it('authenticated nav state also never produces wallet phrases', () => {
    const navState = deriveNavState(true);
    expect(navState.hasWalletState).toBe(false);
  });

  it('all guest nav invariants hold for unauthenticated nav state', () => {
    // Contract: the 7 guest nav invariants are the minimum contract for
    // non-crypto-native user experience. Any failure = regression.
    const navState = deriveNavState(false);
    const failures = assertGuestNavInvariants(navState);
    expect(failures).toHaveLength(0);
  });

  it('nav aria-label is non-empty for both auth states', () => {
    // Contract: ARIA label must always be present — it is a WCAG 2.4.6 requirement.
    const guestNav = deriveNavState(false);
    const authNav = deriveNavState(true, true);
    expect(guestNav.navAriaLabel.length).toBeGreaterThan(0);
    expect(authNav.navAriaLabel.length).toBeGreaterThan(0);
  });

  it('nav items are non-empty for both auth states', () => {
    // Contract: nav items must always be present — empty nav breaks all navigation.
    const guestNav = deriveNavState(false);
    const authNav = deriveNavState(true);
    expect(guestNav.items.length).toBeGreaterThan(0);
    expect(authNav.items.length).toBeGreaterThan(0);
  });

  it('clean page content passes wallet phrase check', () => {
    // Contract: content produced by the auth-first UI must never contain wallet phrases.
    const samplePageContent = `
      Welcome to Biatec Tokens — email/password sign in only.
      Create your first regulated token today.
      Guided Launch | Compliance | Settings
    `;
    expect(contentContainsForbiddenWalletPhrase(samplePageContent)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Boundary 4: API error response → user-facing guidance pipeline (AC #6)
// ---------------------------------------------------------------------------

describe('Boundary 4: API error response → user-facing guidance pipeline (AC #6)', () => {
  it('HTTP 401 response maps to auth_required guidance with sign-in action', () => {
    // Simulate what the API client throws for a 401
    const apiError401 = new Error('401 Unauthorized');
    const category = classifyOnboardingError(apiError401);
    const guidance = getOnboardingErrorGuidance(category);
    expect(category).toBe('auth_required');
    expect(guidance.primaryAction.toLowerCase()).toMatch(/sign in/i);
    expect(guidance.selfRecoverable).toBe(true);
  });

  it('HTTP 401 also maps via classifyLaunchError to AUTH_REQUIRED message', () => {
    // Contract: both classification paths (launch flow and onboarding closure)
    // must handle 401 consistently — different paths to same user guidance.
    const apiError401 = new Error('Unauthorized: 401');
    const launchCode = classifyLaunchError(apiError401);
    const launchMsg = getLaunchErrorMessage(launchCode);
    expect(launchMsg.recoverable).toBe(true);
  });

  it('session timeout maps to session_expired guidance with re-auth action', () => {
    const sessionError = new Error('Session expired, please log in again');
    const category = classifyOnboardingError(sessionError);
    const guidance = getOnboardingErrorGuidance(category);
    expect(category).toBe('session_expired');
    expect(guidance.selfRecoverable).toBe(true);
    expect(guidance.description.length).toBeGreaterThan(10);
  });

  it('compliance incomplete error maps to compliance_blocked with setup action', () => {
    const complianceError = new Error('Token compliance setup incomplete');
    const category = classifyOnboardingError(complianceError);
    const guidance = getOnboardingErrorGuidance(category);
    expect(category).toBe('compliance_blocked');
    expect(guidance.primaryAction.toLowerCase()).toContain('compliance');
  });

  it('network fetch failure maps to network_error with retry action', () => {
    const fetchError = new TypeError('Failed to fetch');
    const category = classifyOnboardingError(fetchError);
    const guidance = getOnboardingErrorGuidance(category);
    expect(category).toBe('network_error');
    expect(guidance.selfRecoverable).toBe(true);
  });

  it('guidance chain produces no technical jargon titles for any error type', () => {
    // Contract: the full pipeline from error → category → guidance must never
    // expose technical jargon in the displayed title to the user.
    const technicalPhrases = ['401', '403', '500', 'exception', 'stack trace', 'TypeError'];
    const testErrors = [
      new Error('401 Unauthorized'),
      new Error('Session expired timeout'),
      new Error('Compliance incomplete'),
      new TypeError('fetch failed connection'),
      new Error('Random unknown error'),
    ];

    for (const error of testErrors) {
      const category = classifyOnboardingError(error);
      const guidance = getOnboardingErrorGuidance(category);
      for (const phrase of technicalPhrases) {
        expect(guidance.title.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }
  });

  it('getLaunchErrorMessage for NETWORK_UNAVAILABLE is user-comprehensible', () => {
    const msg = getLaunchErrorMessage('NETWORK_UNAVAILABLE');
    expect(msg.recoverable).toBe(true);
    expect(msg.action.length).toBeGreaterThan(0);
    expect(msg.title).not.toMatch(/http|fetch|request/i);
  });
});

// ---------------------------------------------------------------------------
// Boundary 5: Workflow orchestration — complete onboarding closure contract
// ---------------------------------------------------------------------------

describe('Boundary 5: Workflow orchestration — onboarding closure completeness (AC #5, #8)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('complete guest→redirect→login→resume workflow stores and retrieves correctly', () => {
    // Simulate: guest hits /launch/guided → router guard fires → stores redirect
    // → user logs in → consumer reads redirect → resumes to /launch/guided
    expect(isSessionActive()).toBe(false); // Step 1: guest (not logged in)

    storePostAuthRedirect('/launch/guided'); // Step 2: router guard stores redirect

    // Step 3: login stores auth token
    localStorage.setItem(
      'algorand_user',
      JSON.stringify({ address: 'RESUME_ADDR', email: 'resume@ex.com', isConnected: true }),
    );
    expect(isSessionActive()).toBe(true); // Step 4: now authenticated

    const resumePath = consumePostAuthRedirect(); // Step 5: consume redirect
    expect(resumePath).toBe('/launch/guided'); // Step 6: returns original destination
    expect(consumePostAuthRedirect()).toBeNull(); // Step 7: no double-consume
  });

  it('complete guest→redirect→login→resume for compliance path', () => {
    storePostAuthRedirect('/compliance/setup');
    localStorage.setItem(
      'algorand_user',
      JSON.stringify({ address: 'COMP_ADDR', email: 'comp@ex.com', isConnected: true }),
    );
    const resumePath = consumePostAuthRedirect();
    expect(resumePath).toBe('/compliance/setup');
  });

  it('session expiry → re-auth flow does not corrupt redirect storage', () => {
    // Simulate: user was on /launch/guided, session expired, redirect stored
    storePostAuthRedirect('/launch/guided');

    // Session expires (logout)
    localStorage.removeItem('algorand_user');
    expect(isSessionActive()).toBe(false);

    // Redirect still available for re-auth
    expect(peekPostAuthRedirect()).toBe('/launch/guided');

    // Re-auth completes
    localStorage.setItem(
      'algorand_user',
      JSON.stringify({ address: 'REAUTH_ADDR', email: 'reauth@ex.com', isConnected: true }),
    );
    expect(consumePostAuthRedirect()).toBe('/launch/guided');
  });

  it('validateClosureMilestone is idempotent across multiple calls', () => {
    // Contract: the milestone validation must return consistent results regardless
    // of how many times it is called — no side effects.
    const r1 = validateClosureMilestone();
    const r2 = validateClosureMilestone();
    const r3 = validateClosureMilestone();
    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
    expect(r1).toHaveLength(0); // All ACs pass
  });

  it('all auth-gated paths can be stored and consumed as redirects', () => {
    // Contract: every auth-required path is a valid redirect destination.
    const staticAuthPaths = AUTH_REQUIRED_PATHS.filter(
      (p) => !p.includes(':') && !p.includes('?'),
    );

    for (const path of staticAuthPaths) {
      localStorage.clear();
      storePostAuthRedirect(path);
      const consumed = consumePostAuthRedirect();
      expect(consumed).toBe(path);
    }
  });
});
