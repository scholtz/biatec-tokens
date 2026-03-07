/**
 * Auth-First Hardening Utility
 *
 * Provides deterministic, testable helpers for enforcing and inspecting
 * the auth-first navigation model required for MVP sign-off.
 *
 * Design goals:
 * - Pure functions with no side effects (except where noted for localStorage)
 * - Deterministic: same inputs always produce same outputs
 * - Composable with router guard logic and E2E fixture setup
 *
 * Related files:
 * - src/router/index.ts (router guard implementation)
 * - src/constants/navItems.ts (canonical navigation source of truth)
 * - src/constants/auth.ts (AUTH_STORAGE_KEYS)
 * - src/utils/launchErrorMessages.ts (user-facing error messages)
 *
 * Issue: Frontend milestone – auth-first accessibility and onboarding confidence hardening
 */

import { AUTH_STORAGE_KEYS } from '../constants/auth';
import { NAV_ITEMS, type NavItem } from '../constants/navItems';

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

/**
 * Routes that are explicitly accessible to unauthenticated (guest) users.
 * These correspond to the router routes that do NOT carry `meta.requiresAuth`.
 *
 * This list mirrors the router configuration in src/router/index.ts and is
 * used by tests to assert guest-accessible invariants without importing the
 * full router.
 */
export const GUEST_ACCESSIBLE_PATHS: ReadonlyArray<string> = [
  '/',
  '/token-standards',
  '/enterprise-guide',
  '/marketplace',
  '/discovery',
  '/discovery/journey',
  '/subscription/pricing',
  '/subscription/cancel',
];

/**
 * Routes that require authentication (mirror of meta.requiresAuth routes).
 * Excludes /dashboard which is a special exception (public empty state).
 */
export const AUTH_REQUIRED_PATHS: ReadonlyArray<string> = [
  '/create',
  '/create/batch',
  '/tokens/:id',
  '/activation/wallet',
  '/settings',
  '/compliance/:id?',
  '/compliance/orchestration',
  '/compliance-monitoring',
  '/compliance/whitelists',
  '/compliance/setup',
  '/compliance/launch',
  '/attestations',
  '/insights',
  '/launch/guided',
  '/launch/workspace',
  '/cockpit',
  '/account/security',
  '/onboarding',
  '/portfolio/onboarding',
  '/portfolio',
  '/enterprise/onboarding',
  '/subscription/success',
];

/**
 * Returns whether a concrete path is in the guest-accessible list.
 * Performs exact match for static paths; dynamic segments are not resolved here.
 */
export function isGuestAccessible(path: string): boolean {
  return GUEST_ACCESSIBLE_PATHS.includes(path);
}

/**
 * Returns whether a path requires authentication.
 * Checks static paths only; dynamic segments (`:id`) are not resolved.
 */
export function isAuthRequired(path: string): boolean {
  // Strip query parameters and trailing slash for comparison
  const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/';
  return AUTH_REQUIRED_PATHS.some((p) => {
    // Exact match for static paths
    if (!p.includes(':')) return p === cleanPath;
    // Prefix match for parameterized paths
    const prefix = p.split('/:')[0];
    return cleanPath.startsWith(prefix);
  });
}

// ---------------------------------------------------------------------------
// Navigation state derivation
// ---------------------------------------------------------------------------

/**
 * Describes the logical state of the top navigation bar for a given auth context.
 */
export interface NavState {
  /** Items visible in the main nav (desktop + mobile) */
  items: ReadonlyArray<NavItem>;
  /** True if the Sign In button should be rendered */
  showSignIn: boolean;
  /** True if the user menu (avatar + dropdown) should be rendered */
  showUserMenu: boolean;
  /** True if the subscription status badge should be rendered */
  showSubscriptionBadge: boolean;
  /** WCAG-compliant aria-label for the navigation landmark */
  navAriaLabel: string;
  /** No wallet-centric status text should appear */
  hasWalletState: false;
}

/**
 * Derives the expected navigation state for a given authentication context.
 * Used by both unit tests and runtime assertions.
 *
 * @param isAuthenticated - Whether the user is currently authenticated
 * @param hasActiveSubscription - Whether the user has an active subscription
 * @returns Deterministic NavState for the given context
 */
export function deriveNavState(
  isAuthenticated: boolean,
  hasActiveSubscription = false
): NavState {
  return {
    items: NAV_ITEMS,
    showSignIn: !isAuthenticated,
    showUserMenu: isAuthenticated,
    showSubscriptionBadge: isAuthenticated && hasActiveSubscription,
    navAriaLabel: 'Main navigation',
    hasWalletState: false,
  };
}

// ---------------------------------------------------------------------------
// Guest navigation invariants
// ---------------------------------------------------------------------------

/**
 * Invariants that MUST hold for unauthenticated (guest) users.
 * Violations indicate a regression in the auth-first contract.
 */
export interface GuestNavInvariant {
  id: string;
  description: string;
  test: (state: NavState) => boolean;
}

/**
 * Returns the set of navigation invariants that must pass for guest users.
 * Each invariant is described and testable in isolation.
 */
export function getGuestNavInvariants(): GuestNavInvariant[] {
  return [
    {
      id: 'show-sign-in',
      description: 'Sign In button must be visible for guest users',
      test: (state) => state.showSignIn === true,
    },
    {
      id: 'no-user-menu',
      description: 'User menu must not be visible for guest users',
      test: (state) => state.showUserMenu === false,
    },
    {
      id: 'no-subscription-badge',
      description: 'Subscription badge must not be visible for guest users',
      test: (state) => state.showSubscriptionBadge === false,
    },
    {
      id: 'no-wallet-state',
      description: 'No wallet-centric state must appear (email/password auth only)',
      test: (state) => state.hasWalletState === false,
    },
    {
      id: 'has-nav-items',
      description: 'Navigation items must be present for guest users',
      test: (state) => state.items.length > 0,
    },
    {
      id: 'guided-launch-in-nav',
      description: 'Guided Launch (canonical workspace entry) must be in nav items',
      test: (state) => state.items.some((item) => item.path === '/launch/workspace'),
    },
    {
      id: 'aria-label-present',
      description: 'Navigation landmark must have an aria-label for screen readers',
      test: (state) => state.navAriaLabel.length > 0,
    },
  ];
}

/**
 * Runs all guest navigation invariants against a given NavState.
 * Returns the list of failing invariants (empty = all pass).
 */
export function assertGuestNavInvariants(state: NavState): GuestNavInvariant[] {
  return getGuestNavInvariants().filter((invariant) => !invariant.test(state));
}

// ---------------------------------------------------------------------------
// Auth-first redirect management
// ---------------------------------------------------------------------------

/**
 * Stores the intended destination path before redirecting to auth.
 * Mirrors the logic in the router guard.
 */
export function storePostAuthRedirect(path: string): void {
  if (path && path !== '/') {
    localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, path);
  }
}

/**
 * Retrieves and clears the stored post-auth redirect path.
 * Returns null if no redirect is stored or if the stored path is empty.
 */
export function consumePostAuthRedirect(): string | null {
  const path = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
  if (path) {
    localStorage.removeItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    return path;
  }
  return null;
}

/**
 * Peeks at the stored post-auth redirect without removing it.
 */
export function peekPostAuthRedirect(): string | null {
  return localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
}

// ---------------------------------------------------------------------------
// Onboarding step readiness
// ---------------------------------------------------------------------------

/**
 * Canonical onboarding steps for the guided token launch flow.
 * Mirrors the step sequence in GuidedTokenLaunch.vue.
 */
export type OnboardingStep =
  | 'organization'
  | 'token-basics'
  | 'compliance'
  | 'network'
  | 'review'
  | 'deploy';

/**
 * Describes the readiness state of an onboarding step.
 */
export interface OnboardingStepReadiness {
  step: OnboardingStep;
  isReady: boolean;
  /** Human-readable reason if not ready */
  blockedReason?: string;
}

/**
 * Returns whether an onboarding step is a recognized step name.
 */
export function isValidOnboardingStep(step: string): step is OnboardingStep {
  const validSteps: OnboardingStep[] = [
    'organization',
    'token-basics',
    'compliance',
    'network',
    'review',
    'deploy',
  ];
  return validSteps.includes(step as OnboardingStep);
}

/**
 * Returns the index of an onboarding step (0-based).
 * Returns -1 if the step is not recognized.
 */
export function getOnboardingStepIndex(step: OnboardingStep): number {
  const order: OnboardingStep[] = [
    'organization',
    'token-basics',
    'compliance',
    'network',
    'review',
    'deploy',
  ];
  return order.indexOf(step);
}

/**
 * Returns whether the second step is a valid progression from the first.
 * Steps must be traversed in order; skipping is not allowed.
 */
export function isValidStepProgression(from: OnboardingStep, to: OnboardingStep): boolean {
  const fromIdx = getOnboardingStepIndex(from);
  const toIdx = getOnboardingStepIndex(to);
  return toIdx === fromIdx + 1;
}

// ---------------------------------------------------------------------------
// UI anchor data attributes (for deterministic E2E selection)
// ---------------------------------------------------------------------------

/**
 * Data attributes used as stable test anchors in auth-first components.
 * Using data-testid attributes ensures tests don't rely on text content
 * or CSS classes that may change with redesigns.
 */
export const AUTH_FIRST_TEST_IDS = {
  SIGN_IN_BUTTON: 'auth-sign-in-btn',
  USER_MENU_TRIGGER: 'auth-user-menu-btn',
  USER_EMAIL_DISPLAY: 'auth-user-email',
  AUTH_MODAL: 'auth-modal',
  AUTH_EMAIL_INPUT: 'auth-email-input',
  AUTH_PASSWORD_INPUT: 'auth-password-input',
  AUTH_SUBMIT_BUTTON: 'auth-submit-btn',
  NAV_GUIDED_LAUNCH: 'nav-guided-launch',
  NAV_MAIN: 'nav-main',
  ONBOARDING_STEP_INDICATOR: 'onboarding-step-indicator',
  ONBOARDING_ERROR_BANNER: 'onboarding-error-banner',
} as const;

export type AuthFirstTestId = (typeof AUTH_FIRST_TEST_IDS)[keyof typeof AUTH_FIRST_TEST_IDS];
