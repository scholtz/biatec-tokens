/**
 * Journey State Contract
 *
 * Provides deterministic helpers for validating and enforcing the critical
 * MVP journey state contract: login → setup → compliance → launch.
 *
 * Business context: Non-technical enterprise users expect predictable,
 * resumable workflows. This utility encodes the pre/postconditions for each
 * journey stage so that any drift (missing auth, stale step state, invalid
 * session) is caught early and produces a clear, actionable user message.
 *
 * Design goals:
 * - Pure functions — same inputs always produce same outputs.
 * - Zero side effects (localStorage helpers are clearly isolated).
 * - Deterministic: encodes explicit preconditions and postconditions per step.
 * - Composable with router guards, Pinia stores, and E2E test fixtures.
 *
 * Related files:
 * - src/utils/mvpSignoffHardening.ts    (route and auth quality helpers)
 * - src/utils/deterministicStateManager.ts (state representation types)
 * - src/router/index.ts                 (applies requiresAuth meta)
 * - e2e/helpers/auth.ts                 (E2E session bootstrap helpers)
 *
 * Issue: MVP frontend sign-off — deterministic launch journey, accessibility
 *        parity, and Playwright reliability hardening
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Journey stage definitions
// ---------------------------------------------------------------------------

/**
 * The ordered stages of the critical MVP token-issuance journey.
 * Each stage has explicit preconditions and postconditions.
 */
export type JourneyStage =
  | 'unauthenticated'
  | 'authenticated'
  | 'setup'
  | 'compliance'
  | 'launch'
  | 'complete';

/**
 * A lightweight session snapshot used to evaluate preconditions.
 * Mirrors the fields the router guard and issuance workspace check.
 */
export interface JourneySession {
  /** ARC76 Algorand address. */
  address: string;
  /** User's email — required for ARC76 session. */
  email: string;
  /** Whether the session is active/connected. */
  isConnected: boolean;
}

/**
 * Precondition result — indicates whether a session satisfies the
 * requirements to enter a given journey stage.
 */
export interface PreconditionResult {
  /** True if all preconditions are satisfied. */
  satisfied: boolean;
  /** Human-readable failure reason, or null if satisfied. */
  failureReason: string | null;
  /** Suggested recovery action for the user. */
  recoveryAction: string | null;
}

// ---------------------------------------------------------------------------
// Session validation
// ---------------------------------------------------------------------------

/**
 * Returns true if the session has a non-empty address AND email AND isConnected.
 * This is the minimum required for any authenticated journey stage.
 */
export function isSessionValid(session: JourneySession | null | undefined): boolean {
  if (!session) return false;
  return (
    typeof session.address === 'string' &&
    session.address.trim().length > 0 &&
    typeof session.email === 'string' &&
    session.email.trim().length > 0 &&
    session.isConnected === true
  );
}

/**
 * Returns a structurally valid "empty" session used as a null object
 * when no session is present (avoids null checks throughout codebase).
 */
export function createEmptySession(): JourneySession {
  return { address: '', email: '', isConnected: false };
}

// ---------------------------------------------------------------------------
// Precondition evaluation per stage
// ---------------------------------------------------------------------------

/**
 * Checks the preconditions required to enter the given journey stage.
 *
 * | Stage          | Required                                           |
 * |----------------|---------------------------------------------------|
 * | unauthenticated| (no preconditions — always enterable)             |
 * | authenticated  | session.isConnected && address && email            |
 * | setup          | same as authenticated                              |
 * | compliance     | same as authenticated                              |
 * | launch         | same as authenticated                              |
 * | complete       | same as authenticated                              |
 */
export function checkJourneyPreconditions(
  stage: JourneyStage,
  session: JourneySession | null | undefined,
): PreconditionResult {
  if (stage === 'unauthenticated') {
    return { satisfied: true, failureReason: null, recoveryAction: null };
  }

  if (!isSessionValid(session)) {
    return {
      satisfied: false,
      failureReason: 'An active session is required to continue. Please sign in.',
      recoveryAction: 'Sign in with your email and password to continue.',
    };
  }

  return { satisfied: true, failureReason: null, recoveryAction: null };
}

/**
 * Returns the canonical route for a given journey stage.
 * Used by the router guard to determine where to redirect an authenticated user.
 */
export function getStageRoute(stage: Exclude<JourneyStage, 'unauthenticated'>): string {
  const routes: Record<Exclude<JourneyStage, 'unauthenticated'>, string> = {
    authenticated: '/',
    setup: '/compliance/setup',
    compliance: '/compliance/setup',
    launch: '/launch/guided',
    complete: '/dashboard',
  };
  return routes[stage];
}

/**
 * Returns the journey stage that best describes where a user is based on
 * their session state. Used for analytics and progress UI.
 */
export function deriveJourneyStage(session: JourneySession | null | undefined): JourneyStage {
  if (!isSessionValid(session)) return 'unauthenticated';
  return 'authenticated';
}

// ---------------------------------------------------------------------------
// Transition validation
// ---------------------------------------------------------------------------

/**
 * A pair of journey stages representing a state transition.
 */
export interface JourneyTransition {
  from: JourneyStage;
  to: JourneyStage;
}

/**
 * Valid forward transitions in the journey.
 * Backward navigation is always allowed (user can revisit earlier stages).
 */
const VALID_FORWARD_TRANSITIONS: ReadonlyArray<JourneyTransition> = [
  { from: 'unauthenticated', to: 'authenticated' },
  { from: 'authenticated', to: 'setup' },
  { from: 'authenticated', to: 'launch' },
  { from: 'setup', to: 'compliance' },
  { from: 'compliance', to: 'launch' },
  { from: 'launch', to: 'complete' },
  // Direct jump allowed (user resumes from dashboard)
  { from: 'authenticated', to: 'compliance' },
  { from: 'authenticated', to: 'complete' },
  { from: 'setup', to: 'launch' },
];

/**
 * Returns true if the forward transition from `from` to `to` is valid
 * in the MVP journey model.
 *
 * Backward transitions (to an earlier stage) are always valid.
 * The order is: unauthenticated < authenticated < setup < compliance < launch < complete.
 */
export function isValidJourneyTransition(transition: JourneyTransition): boolean {
  const stageOrder: JourneyStage[] = [
    'unauthenticated',
    'authenticated',
    'setup',
    'compliance',
    'launch',
    'complete',
  ];

  const fromIndex = stageOrder.indexOf(transition.from);
  const toIndex = stageOrder.indexOf(transition.to);

  // Backward transitions always valid
  if (toIndex < fromIndex) return true;

  // Same stage — no-op, treat as valid
  if (fromIndex === toIndex) return true;

  // Forward transitions — must be in the allowed list
  return VALID_FORWARD_TRANSITIONS.some(
    (t) => t.from === transition.from && t.to === transition.to,
  );
}

// ---------------------------------------------------------------------------
// Error message helpers
// ---------------------------------------------------------------------------

/**
 * Returns a user-facing error message for a failed precondition check.
 * Messages follow the what/why/how structure for WCAG 3.3.1 compliance.
 */
export function getJourneyErrorMessage(result: PreconditionResult): string {
  if (result.satisfied) return '';
  const reason = result.failureReason ?? 'An error occurred.';
  const action = result.recoveryAction ?? 'Please try again.';
  return `${reason} ${action}`;
}

/**
 * Returns true if the error message follows the what/why/how structure:
 * - Must be non-empty
 * - Must end with a sentence (contains at least one period or question mark)
 * - Must be at least 20 characters (meaningful guidance, not just "Error")
 */
export function isWellFormedErrorMessage(message: string): boolean {
  if (!message || message.trim().length < 20) return false;
  return /[.?!]/.test(message);
}
