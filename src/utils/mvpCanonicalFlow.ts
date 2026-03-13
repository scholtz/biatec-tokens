/**
 * MVP Canonical Flow Utility
 *
 * Provides deterministic, testable helpers for:
 * - Auth bootstrap with structured session contract validation (not raw localStorage seeding)
 * - Route-ready detection anchored to explicit DOM or network signals
 * - Navigation state assertions for guest vs authenticated users
 * - Guided launch step readiness checks and transition guards
 *
 * Design goals:
 * - Pure functions with no side effects (except noted localStorage helpers)
 * - Deterministic: same inputs always produce same outputs
 * - Zero dependency on arbitrary timeouts — callers use semantic waits
 * - Composable with router guard logic and E2E fixture setup
 *
 * Related files:
 * - src/utils/authFirstHardening.ts (auth-first routing invariants)
 * - src/utils/launchErrorMessages.ts (user-facing error messages)
 * - src/constants/auth.ts (AUTH_STORAGE_KEYS)
 * - src/constants/navItems.ts (canonical navigation source of truth)
 *
 * Issue: MVP confidence hardening – guided launch canonical flow and auth-realistic E2E
 */

// ---------------------------------------------------------------------------
// Session contract types
// ---------------------------------------------------------------------------

/**
 * Shape of the algorand_user session object stored in localStorage.
 * All fields are validated before the session is accepted as "live".
 */
export interface SessionContract {
  address: string;
  email: string;
  isConnected: boolean;
}

/**
 * Validation result for a session contract.
 */
export interface SessionValidationResult {
  valid: boolean;
  errors: string[];
  session: SessionContract | null;
}

// ---------------------------------------------------------------------------
// Auth bootstrap helpers
// ---------------------------------------------------------------------------

/**
 * Session storage key used by the auth store.
 */
export const MVP_SESSION_STORAGE_KEY = 'algorand_user';

/**
 * Draft storage key used by the guided launch store.
 */
export const MVP_GUIDED_LAUNCH_DRAFT_KEY = 'biatec_guided_launch_draft';

/**
 * Canonical session fixture for tests.
 * Produces a structured, validated session object rather than raw JSON strings.
 */
export function buildTestSession(overrides: Partial<SessionContract> = {}): SessionContract {
  return {
    address: 'MVP_TEST_ADDRESS',
    email: 'mvp-test@biatec.io',
    isConnected: true,
    ...overrides,
  };
}

/**
 * Builds a minimal expired session fixture (isConnected = false).
 * Use to simulate session expiry scenarios.
 */
export function buildExpiredSession(overrides: Partial<SessionContract> = {}): SessionContract {
  return buildTestSession({ isConnected: false, ...overrides });
}

/**
 * Validates a raw session value against the SessionContract shape.
 *
 * Returns a SessionValidationResult with:
 * - `valid`: true only if all required fields are present and correctly typed
 * - `errors`: human-readable list of violations
 * - `session`: the parsed session object if valid, otherwise null
 */
export function validateSessionContract(raw: unknown): SessionValidationResult {
  const errors: string[] = [];

  if (raw === null || raw === undefined) {
    return { valid: false, errors: ['session value is null or undefined'], session: null };
  }

  if (typeof raw !== 'object') {
    return { valid: false, errors: ['session value is not an object'], session: null };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj['address'] !== 'string' || obj['address'].trim() === '') {
    errors.push('address must be a non-empty string');
  }

  if (typeof obj['email'] !== 'string' || !obj['email'].includes('@')) {
    errors.push('email must be a valid email address');
  }

  if (typeof obj['isConnected'] !== 'boolean') {
    errors.push('isConnected must be a boolean');
  }

  if (errors.length > 0) {
    return { valid: false, errors, session: null };
  }

  return {
    valid: true,
    errors: [],
    session: {
      address: obj['address'] as string,
      email: obj['email'] as string,
      isConnected: obj['isConnected'] as boolean,
    },
  };
}

/**
 * Reads and validates the current session from localStorage.
 * Returns SessionValidationResult — callers can check `valid` before trusting session data.
 */
export function readAndValidateSession(): SessionValidationResult {
  try {
    const raw = localStorage.getItem(MVP_SESSION_STORAGE_KEY);
    if (!raw) {
      return { valid: false, errors: ['no session in storage'], session: null };
    }
    const parsed = JSON.parse(raw);
    return validateSessionContract(parsed);
  } catch {
    return { valid: false, errors: ['session JSON parse error'], session: null };
  }
}

/**
 * Writes a validated session to localStorage.
 * Returns false if the session does not pass contract validation.
 */
export function writeValidatedSession(session: SessionContract): boolean {
  const result = validateSessionContract(session);
  if (!result.valid) {
    return false;
  }
  localStorage.setItem(MVP_SESSION_STORAGE_KEY, JSON.stringify(session));
  return true;
}

/**
 * Clears the session from localStorage.
 */
export function clearSession(): void {
  localStorage.removeItem(MVP_SESSION_STORAGE_KEY);
}

/**
 * Returns whether there is a valid, connected session.
 */
export function hasLiveSession(): boolean {
  const result = readAndValidateSession();
  return result.valid && (result.session?.isConnected ?? false) === true;
}

// ---------------------------------------------------------------------------
// Canonical flow constants
// ---------------------------------------------------------------------------

/**
 * The canonical route for token creation.
 * All entry-point tests and helper code must reference this constant.
 */
export const CANONICAL_LAUNCH_ROUTE = '/launch/guided';

/**
 * The legacy wizard route that must redirect to CANONICAL_LAUNCH_ROUTE.
 * Only redirect-compatibility tests should reference this.
 */
export const LEGACY_WIZARD_ROUTE = '/create/wizard';

/**
 * Ordered list of canonical guided launch step identifiers.
 * Matches the guided launch store step configuration.
 */
export const GUIDED_LAUNCH_STEPS = [
  'organization',
  'intent',
  'compliance',
  'whitelist',
  'template',
  'economics',
  'review',
] as const;

export type GuidedLaunchStep = (typeof GUIDED_LAUNCH_STEPS)[number];

/**
 * Total step count for the guided launch flow.
 */
export const GUIDED_LAUNCH_STEP_COUNT = GUIDED_LAUNCH_STEPS.length;

// ---------------------------------------------------------------------------
// Guided launch step helpers
// ---------------------------------------------------------------------------

/**
 * Returns the 0-based index of a step in the canonical step order.
 * Returns -1 if the step identifier is not recognised.
 */
export function getStepIndex(step: GuidedLaunchStep): number {
  return GUIDED_LAUNCH_STEPS.indexOf(step);
}

/**
 * Returns whether a step index is within the valid range.
 */
export function isValidStepIndex(index: number): boolean {
  return index >= 0 && index < GUIDED_LAUNCH_STEP_COUNT;
}

/**
 * Returns whether the given step can transition to the next step,
 * given the set of completed step indices.
 */
export function canAdvanceFromStep(currentIndex: number, completedSteps: number[]): boolean {
  if (!isValidStepIndex(currentIndex)) return false;
  // Cannot advance beyond the last step
  if (currentIndex >= GUIDED_LAUNCH_STEP_COUNT - 1) return false;
  // Current step must be in completed set
  return completedSteps.includes(currentIndex);
}

/**
 * Returns whether all required (non-optional) steps are complete.
 * The 'economics' step (index 5) is optional.
 */
export function areRequiredStepsComplete(completedSteps: number[]): boolean {
  const OPTIONAL_STEP_INDEX = GUIDED_LAUNCH_STEPS.indexOf('economics');
  return GUIDED_LAUNCH_STEPS.every((_step, index) => {
    if (index === OPTIONAL_STEP_INDEX) return true; // optional step
    return completedSteps.includes(index);
  });
}

// ---------------------------------------------------------------------------
// Route readiness detection
// ---------------------------------------------------------------------------

/**
 * Selector anchors used as route-ready signals.
 * Tests should use these constants to avoid hardcoded selector strings.
 */
export const ROUTE_READY_ANCHORS = {
  /** The main <h1> heading on the guided launch page */
  GUIDED_LAUNCH_TITLE: '[data-testid="guided-launch-title"], h1',
  /** Progress tracker shown once the page is fully mounted */
  STEP_PROGRESS: '[data-testid="step-progress"], [aria-label*="progress"]',
  /** Navigation bar — proves the shell has hydrated */
  NAV_BAR: 'nav[role="navigation"], nav[aria-label="Main navigation"]',
  /** Sign In button — proves guest state is visible in nav */
  SIGN_IN_BUTTON: 'button[aria-label="Sign in"], button:has-text("Sign In")',
  /** User menu — proves authenticated state is visible in nav */
  USER_MENU: 'button[aria-label="User menu"], [data-testid="user-menu"]',
} as const;

/**
 * Returns whether a path is the canonical launch route.
 */
export function isCanonicalLaunchRoute(path: string): boolean {
  const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/';
  return cleanPath === CANONICAL_LAUNCH_ROUTE;
}

/**
 * Returns whether a path is the legacy wizard route that should redirect.
 */
export function isLegacyWizardRoute(path: string): boolean {
  const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/';
  return cleanPath === LEGACY_WIZARD_ROUTE;
}

// ---------------------------------------------------------------------------
// Navigation state contracts
// ---------------------------------------------------------------------------

/**
 * Expected nav labels visible to guest (unauthenticated) users.
 * These must match the canonical NAV_ITEMS that do not require auth.
 */
export const GUEST_NAV_VISIBLE_LABELS: ReadonlyArray<string> = [
  'Home',
  'Marketplace',
];

/**
 * Labels that must NOT appear in guest nav state.
 * Wallet-/network-centric terms are not part of the email/password MVP.
 */
export const GUEST_NAV_FORBIDDEN_PATTERNS: ReadonlyArray<RegExp> = [
  /wallet/i,
  /connected/i,
  /disconnect/i,
  /mainnet/i,
  /testnet/i,
  /algorand mainnet/i,
  /pera/i,
  /defly/i,
  /metamask/i,
  /walletconnect/i,
  /not connected/i,
];

/**
 * Returns true if the given text contains any forbidden guest-nav pattern.
 */
export function containsForbiddenGuestNavText(text: string): boolean {
  return GUEST_NAV_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Validates a nav text block for guest-state compliance.
 * Returns an array of matched forbidden patterns (empty = compliant).
 */
export function findForbiddenGuestNavPatterns(text: string): RegExp[] {
  return GUEST_NAV_FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(text));
}

// ---------------------------------------------------------------------------
// Guided launch draft helpers (for E2E test setup)
// ---------------------------------------------------------------------------

export interface GuidedLaunchDraftForm {
  createdAt: string;
  lastModified: string;
  currentStep: number;
  completedSteps: number[];
  isSubmitted: boolean;
  submissionError?: string;
  organizationProfile?: {
    organizationName: string;
    organizationType: string;
    jurisdiction: string;
    contactName: string;
    contactEmail: string;
    role: string;
  };
  tokenIntent?: Record<string, unknown>;
  complianceReadiness?: Record<string, unknown>;
  templateSelection?: Record<string, unknown>;
}

export interface GuidedLaunchDraft {
  version: string;
  form: GuidedLaunchDraftForm;
  stepStatuses: Array<{
    id: string;
    title: string;
    isComplete: boolean;
    isValid: boolean;
    isOptional: boolean;
  }>;
}

/**
 * Builds a minimal guided launch draft fixture for E2E test injection.
 * Starts at step 0 with no completed steps.
 */
export function buildMinimalDraft(overrides: Partial<GuidedLaunchDraftForm> = {}): GuidedLaunchDraft {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    form: {
      createdAt: now,
      lastModified: now,
      currentStep: 0,
      completedSteps: [],
      isSubmitted: false,
      ...overrides,
    },
    stepStatuses: GUIDED_LAUNCH_STEPS.map((id, index) => ({
      id,
      title: getStepTitle(id),
      isComplete: (overrides.completedSteps ?? []).includes(index),
      isValid: (overrides.completedSteps ?? []).includes(index),
      isOptional: id === 'economics',
    })),
  };
}

/**
 * Builds a draft fixture positioned at the given step with prior steps complete.
 */
export function buildDraftAtStep(stepIndex: number, formOverrides: Partial<GuidedLaunchDraftForm> = {}): GuidedLaunchDraft {
  const completedSteps = Array.from({ length: stepIndex }, (_, i) => i);
  return buildMinimalDraft({
    currentStep: stepIndex,
    completedSteps,
    ...formOverrides,
  });
}

/**
 * Returns a human-readable title for a guided launch step.
 */
export function getStepTitle(step: GuidedLaunchStep): string {
  const titles: Record<GuidedLaunchStep, string> = {
    organization: 'Organization Profile',
    intent: 'Token Intent',
    compliance: 'Compliance Readiness',
    whitelist: 'Whitelist Policy',
    template: 'Template Selection',
    economics: 'Economics Settings',
    review: 'Review & Submit',
  };
  return titles[step];
}

/**
 * Serialises a draft to a JSON string suitable for localStorage injection.
 */
export function serialiseDraft(draft: GuidedLaunchDraft): string {
  return JSON.stringify(draft);
}
