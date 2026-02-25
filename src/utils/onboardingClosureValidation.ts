/**
 * Onboarding Accessibility Closure Validation
 *
 * Provides deterministic helpers for validating that the auth-first onboarding
 * milestone is complete and all acceptance criteria are met in CI-stable tests.
 *
 * This utility is the "closure layer" over authFirstHardening.ts — it validates
 * that ALL milestone acceptance criteria are satisfied as a single coherent check.
 *
 * Design goals:
 * - Pure functions only (no side effects except where noted for localStorage)
 * - Deterministic: same inputs always produce same outputs
 * - Maps directly to issue acceptance criteria for traceability
 *
 * Issue: Frontend next milestone — deterministic auth-first onboarding and
 *        accessibility closure (#477)
 *
 * Roadmap reference: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import {
  isAuthRequired,
  isGuestAccessible,
  GUEST_ACCESSIBLE_PATHS,
  AUTH_REQUIRED_PATHS,
} from './authFirstHardening';

// ---------------------------------------------------------------------------
// Closure route coverage
// ---------------------------------------------------------------------------

/**
 * Token creation entry points that MUST enforce auth-first behavior.
 * AC #1: All primary token creation entry points enforce auth-first behavior.
 */
export const TOKEN_CREATION_ENTRY_POINTS: ReadonlyArray<string> = [
  '/create',
  '/create/batch',
  '/launch/guided',
];

/**
 * Compliance entry points that MUST enforce auth-first behavior.
 * AC #1: Compliance workspace entry enforces auth gating.
 */
export const COMPLIANCE_ENTRY_POINTS: ReadonlyArray<string> = [
  '/compliance/setup',
  '/compliance/orchestration',
  '/compliance/whitelists',
  '/compliance-monitoring',
];

/**
 * Returns true if all token creation entry points require authentication.
 * Validates AC #1 at the configuration level.
 */
export function allTokenCreationEntryPointsRequireAuth(): boolean {
  return TOKEN_CREATION_ENTRY_POINTS.every((path) => isAuthRequired(path));
}

/**
 * Returns true if all compliance entry points require authentication.
 */
export function allComplianceEntryPointsRequireAuth(): boolean {
  return COMPLIANCE_ENTRY_POINTS.every((path) => isAuthRequired(path));
}

/**
 * Returns any token creation entry points that are incorrectly guest-accessible.
 * An empty array means the configuration is correct.
 */
export function getUnprotectedCreationPaths(): string[] {
  return TOKEN_CREATION_ENTRY_POINTS.filter(
    (path) => !isAuthRequired(path) || isGuestAccessible(path),
  );
}

// ---------------------------------------------------------------------------
// Session state classification
// ---------------------------------------------------------------------------

/**
 * Describes the state of the user's auth session.
 * Used to produce correct UI guidance messages and redirect behavior.
 */
export type SessionState =
  | 'authenticated'
  | 'unauthenticated'
  | 'session_expired'
  | 'invalid';

/**
 * Derives the session state from available localStorage signals.
 * Mirrors what the router guard and auth store do at runtime.
 *
 * @returns SessionState based on current localStorage contents
 */
export function deriveSessionState(): SessionState {
  const userJson = localStorage.getItem('algorand_user');
  if (!userJson) return 'unauthenticated';

  try {
    const user = JSON.parse(userJson);
    if (!user || typeof user !== 'object') return 'invalid';
    if (!user.address || !user.email) return 'invalid';
    if (user.isConnected === false) return 'session_expired';
    if (user.isConnected === true) return 'authenticated';
    return 'invalid';
  } catch {
    return 'invalid';
  }
}

/**
 * Returns whether the current session is valid for auth-gated routes.
 */
export function isSessionActive(): boolean {
  return deriveSessionState() === 'authenticated';
}

// ---------------------------------------------------------------------------
// Onboarding journey model
// ---------------------------------------------------------------------------

/**
 * Represents a step in the auth-first onboarding closure journey.
 * AC #1: Demonstrates the complete path from unauthenticated to token creation.
 */
export interface OnboardingJourneyStep {
  /** Step identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Route path for this step */
  path: string;
  /** Whether auth is required for this step */
  requiresAuth: boolean;
  /** Whether this step is a redirect (no direct content) */
  isRedirect: boolean;
}

/**
 * Returns the canonical onboarding closure journey steps.
 * This models the complete user flow from homepage to token creation.
 *
 * AC #1: Demonstrates deterministic auth-first routing throughout.
 */
export function buildOnboardingClosureJourney(): OnboardingJourneyStep[] {
  return [
    {
      id: 'homepage',
      label: 'Homepage (guest entry point)',
      path: '/',
      requiresAuth: false,
      isRedirect: false,
    },
    {
      id: 'guided-launch-attempt',
      label: 'Attempt guided launch (triggers auth gate)',
      path: '/launch/guided',
      requiresAuth: true,
      isRedirect: false,
    },
    {
      id: 'auth-redirect',
      label: 'Auth redirect (home with showAuth=true)',
      path: '/?showAuth=true',
      requiresAuth: false,
      isRedirect: true,
    },
    {
      id: 'post-auth-resume',
      label: 'Resume after login (return to intended destination)',
      path: '/launch/guided',
      requiresAuth: true,
      isRedirect: false,
    },
  ];
}

/**
 * Returns the total number of steps in the journey that require auth.
 */
export function countJourneyAuthGatedSteps(): number {
  return buildOnboardingClosureJourney().filter((s) => s.requiresAuth && !s.isRedirect).length;
}

// ---------------------------------------------------------------------------
// Navigation state quality checks
// ---------------------------------------------------------------------------

/**
 * Describes known wallet-era phrases that must not appear in the auth-first nav.
 * AC #3: Unauthenticated top nav must contain none of these phrases.
 */
export const FORBIDDEN_WALLET_PHRASES: ReadonlyArray<string> = [
  'not connected',
  'connect wallet',
  'WalletConnect',
  'Pera Wallet',
  'Defly',
  'MetaMask',
  'network status',
  'wallet address',
];

/**
 * Returns true if the given page content contains any forbidden wallet-era phrases.
 * Used by E2E tests and integration tests to validate AC #3.
 */
export function contentContainsForbiddenWalletPhrase(content: string): boolean {
  const lower = content.toLowerCase();
  return FORBIDDEN_WALLET_PHRASES.some((phrase) => lower.includes(phrase.toLowerCase()));
}

/**
 * Returns the list of forbidden wallet phrases found in the content.
 */
export function findForbiddenWalletPhrases(content: string): string[] {
  const lower = content.toLowerCase();
  return FORBIDDEN_WALLET_PHRASES.filter((phrase) => lower.includes(phrase.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Accessibility requirement mapping
// ---------------------------------------------------------------------------

/**
 * WCAG 2.1 AA requirements for each critical onboarding route.
 * AC #4: Critical onboarding/compliance screens pass accessibility checks.
 */
export interface RouteAccessibilityRequirement {
  /** The route path */
  path: string;
  /** WCAG success criteria that apply */
  wcagCriteria: string[];
  /** Whether a navigation landmark is required */
  requiresNavLandmark: boolean;
  /** Whether a main content landmark is required */
  requiresMainLandmark: boolean;
  /** Whether page title is required */
  requiresPageTitle: boolean;
  /** Whether focus management is required on load */
  requiresFocusManagement: boolean;
}

/**
 * Returns accessibility requirements for the given route.
 * Returns null for unrecognized routes.
 */
export function getRouteAccessibilityRequirements(
  path: string,
): RouteAccessibilityRequirement | null {
  const requirements: Record<string, RouteAccessibilityRequirement> = {
    '/': {
      path: '/',
      wcagCriteria: ['1.3.1', '2.1.1', '2.4.1', '2.4.2', '2.4.6', '4.1.2'],
      requiresNavLandmark: true,
      requiresMainLandmark: true,
      requiresPageTitle: true,
      requiresFocusManagement: false,
    },
    '/launch/guided': {
      path: '/launch/guided',
      wcagCriteria: ['1.3.1', '1.4.3', '2.1.1', '2.4.2', '2.4.6', '3.3.1', '4.1.2'],
      requiresNavLandmark: true,
      requiresMainLandmark: true,
      requiresPageTitle: true,
      requiresFocusManagement: true,
    },
    '/compliance/setup': {
      path: '/compliance/setup',
      wcagCriteria: ['1.3.1', '1.4.3', '2.1.1', '2.4.2', '2.4.3', '3.3.1', '3.3.2', '4.1.2'],
      requiresNavLandmark: true,
      requiresMainLandmark: true,
      requiresPageTitle: true,
      requiresFocusManagement: true,
    },
  };

  return requirements[path] ?? null;
}

/**
 * Returns all routes that have defined accessibility requirements.
 */
export function getAccessibilityAuditRoutes(): string[] {
  return ['/', '/launch/guided', '/compliance/setup'];
}

// ---------------------------------------------------------------------------
// Error classification and user guidance
// ---------------------------------------------------------------------------

/**
 * Onboarding-specific error categories for user guidance.
 * AC #6: Error/status messages are user-comprehensible, actionable,
 *         and free of raw technical leakage.
 */
export type OnboardingErrorCategory =
  | 'auth_required'
  | 'session_expired'
  | 'compliance_blocked'
  | 'network_error'
  | 'unknown';

/**
 * User guidance record for an onboarding error category.
 */
export interface OnboardingErrorGuidance {
  category: OnboardingErrorCategory;
  /** Short user-facing title (no technical jargon) */
  title: string;
  /** User-facing description (what happened) */
  description: string;
  /** Primary action the user should take */
  primaryAction: string;
  /** Whether the user can self-recover without support */
  selfRecoverable: boolean;
}

const GUIDANCE_MAP: Record<OnboardingErrorCategory, OnboardingErrorGuidance> = {
  auth_required: {
    category: 'auth_required',
    title: 'Sign in to continue',
    description: 'This step requires an account. Sign in to pick up where you left off.',
    primaryAction: 'Sign in',
    selfRecoverable: true,
  },
  session_expired: {
    category: 'session_expired',
    title: 'Your session has ended',
    description: 'For your security, you have been signed out. Sign in again to continue.',
    primaryAction: 'Sign in again',
    selfRecoverable: true,
  },
  compliance_blocked: {
    category: 'compliance_blocked',
    title: 'Compliance review required',
    description:
      'This token requires additional compliance setup before it can be deployed. Complete the required steps to continue.',
    primaryAction: 'Complete compliance setup',
    selfRecoverable: true,
  },
  network_error: {
    category: 'network_error',
    title: 'Connection problem',
    description:
      'We could not reach the server. Check your connection and try again.',
    primaryAction: 'Try again',
    selfRecoverable: true,
  },
  unknown: {
    category: 'unknown',
    title: 'Something went wrong',
    description: 'An unexpected problem occurred. Please try again or contact support if it continues.',
    primaryAction: 'Try again',
    selfRecoverable: false,
  },
};

/**
 * Returns user guidance for the given onboarding error category.
 * All titles and descriptions are user-comprehensible — no raw technical exceptions.
 */
export function getOnboardingErrorGuidance(
  category: OnboardingErrorCategory,
): OnboardingErrorGuidance {
  return GUIDANCE_MAP[category];
}

/**
 * Classifies an error object or string into an onboarding error category.
 * Always returns a category — never throws.
 */
export function classifyOnboardingError(
  error: unknown,
): OnboardingErrorCategory {
  if (!error) return 'unknown';

  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : JSON.stringify(error);

  const lower = message.toLowerCase();

  if (lower.includes('auth') || lower.includes('sign in') || lower.includes('unauthorized')) {
    return 'auth_required';
  }
  if (lower.includes('expired') || lower.includes('session') || lower.includes('timeout')) {
    return 'session_expired';
  }
  if (lower.includes('compliance') || lower.includes('blocked') || lower.includes('incomplete')) {
    return 'compliance_blocked';
  }
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('connection') ||
    lower.includes('offline')
  ) {
    return 'network_error';
  }

  return 'unknown';
}

// ---------------------------------------------------------------------------
// Closure milestone completeness check
// ---------------------------------------------------------------------------

/**
 * Maps each acceptance criterion to a testable predicate.
 * AC #7: Documentation/comments in tests describe why each assertion matters.
 */
export interface ClosureAC {
  /** Acceptance criterion identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Function that returns true when the AC is met */
  validate: () => boolean;
}

/**
 * Returns the set of programmatically-verifiable closure acceptance criteria.
 * Used in integration tests to validate the milestone configuration.
 *
 * Note: E2E behavioral criteria are validated in the E2E spec; these are
 * configuration-level criteria that can be checked in unit/integration tests.
 */
export function getClosureAcceptanceCriteria(): ClosureAC[] {
  return [
    {
      id: 'AC1-token-creation-auth',
      description: 'All token creation entry points require authentication',
      validate: allTokenCreationEntryPointsRequireAuth,
    },
    {
      id: 'AC1-compliance-auth',
      description: 'All compliance entry points require authentication',
      validate: allComplianceEntryPointsRequireAuth,
    },
    {
      id: 'AC2-no-unprotected-creation-paths',
      description: 'No token creation paths are guest-accessible',
      validate: () => getUnprotectedCreationPaths().length === 0,
    },
    {
      id: 'AC3-wizard-not-in-guest-paths',
      description: '/create/wizard is not in guest-accessible paths (it redirects)',
      validate: () => !GUEST_ACCESSIBLE_PATHS.includes('/create/wizard'),
    },
    {
      id: 'AC4-guided-launch-auth-required',
      description: '/launch/guided is in AUTH_REQUIRED_PATHS',
      validate: () => AUTH_REQUIRED_PATHS.includes('/launch/guided'),
    },
    {
      id: 'AC6-error-guidance-all-categories-covered',
      description: 'All onboarding error categories have user-facing guidance with no jargon',
      validate: () => {
        const categories: OnboardingErrorCategory[] = [
          'auth_required',
          'session_expired',
          'compliance_blocked',
          'network_error',
          'unknown',
        ];
        return categories.every((cat) => {
          const guidance = getOnboardingErrorGuidance(cat);
          // Title must be user-facing (no raw technical terms)
          const hasTitle = guidance.title.length > 0;
          const noJargon = !guidance.title.match(/error|exception|http|stack|trace/i);
          return hasTitle && noJargon;
        });
      },
    },
    {
      id: 'AC6-guidance-has-actions',
      description: 'All error guidance records include a primary action for users',
      validate: () => {
        const categories: OnboardingErrorCategory[] = [
          'auth_required',
          'session_expired',
          'compliance_blocked',
          'network_error',
          'unknown',
        ];
        return categories.every((cat) => {
          const guidance = getOnboardingErrorGuidance(cat);
          return guidance.primaryAction.length > 0;
        });
      },
    },
  ];
}

/**
 * Runs all closure acceptance criteria and returns any that fail.
 * An empty array means the milestone configuration is complete.
 */
export function validateClosureMilestone(): ClosureAC[] {
  return getClosureAcceptanceCriteria().filter((ac) => !ac.validate());
}
