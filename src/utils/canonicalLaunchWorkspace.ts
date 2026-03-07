/**
 * Canonical Launch Workspace Utility
 *
 * Provides deterministic, testable helpers for:
 * - Workspace state derivation for guest and authenticated users
 * - Non-wallet business-language UI state classification
 * - Accessibility-compliant UX state labelling (WCAG 2.1 AA)
 * - Analytics event builders for key launch/compliance funnel steps
 * - Error message formatting following the what/why/how structure
 *
 * Design goals:
 * - Pure functions with no side effects (except noted localStorage helpers)
 * - Zero dependency on wallet connection concepts in user-facing outputs
 * - Deterministic: same inputs always produce same outputs
 * - Composable with router guard logic and E2E fixture setup
 *
 * Related files:
 * - src/utils/mvpCanonicalFlow.ts (canonical flow session helpers)
 * - src/utils/authFirstHardening.ts (auth-first routing invariants)
 * - src/utils/launchErrorMessages.ts (launch/auth error messages)
 * - src/utils/accessibilityTokens.ts (WCAG AA contrast tokens)
 * - src/utils/operationsErrorMessages.ts (operations-domain errors)
 *
 * Issue: MVP next step — accessibility-first canonical guided launch and compliance journey
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Workspace user state
// ---------------------------------------------------------------------------

/**
 * Represents the authentication and session state from the workspace perspective.
 * Uses business-language labels — no wallet/network terminology.
 */
export type WorkspaceUserState =
  | 'guest'         // Unauthenticated visitor — no session present
  | 'authenticated' // Valid active session present
  | 'expired';      // Session present but marked as disconnected/expired

/**
 * Session-like shape required for workspace state derivation.
 * Mirrors SessionContract from mvpCanonicalFlow.ts but is typed independently
 * so that workspace helpers do not depend on the full canonical flow import.
 */
export interface WorkspaceSession {
  address: string;
  email: string;
  isConnected: boolean;
}

/**
 * Derives the workspace user state from a raw session value.
 *
 * Priority order:
 * 1. null/undefined → 'guest'
 * 2. isConnected === false → 'expired'
 * 3. all required fields present → 'authenticated'
 *
 * @param session - Parsed session object or null/undefined
 * @returns WorkspaceUserState
 */
export function deriveWorkspaceUserState(session: WorkspaceSession | null | undefined): WorkspaceUserState {
  if (!session) return 'guest';
  if (typeof session.isConnected !== 'boolean') return 'guest';
  if (!session.isConnected) return 'expired';
  if (!session.address || !session.email) return 'guest';
  return 'authenticated';
}

// ---------------------------------------------------------------------------
// Workspace empty-state and info-state labels
// ---------------------------------------------------------------------------

/**
 * Business-language label configuration for empty and info states.
 * Never mentions wallets, network connection, or blockchain terminology.
 */
export interface WorkspaceStateLabel {
  /** Short heading (≤60 chars) for the state */
  heading: string;
  /** Supporting description (≤150 chars) explaining the state to a non-technical user */
  description: string;
  /** Primary CTA label for the action that resolves this state */
  ctaLabel: string;
  /** ARIA role for the containing element */
  ariaRole: 'status' | 'alert' | 'region';
  /** ARIA live region politeness setting */
  ariaLive: 'polite' | 'assertive' | 'off';
}

/**
 * Returns the workspace empty-state label for a guest user visiting the launch workspace.
 */
export function getGuestLaunchEmptyState(): WorkspaceStateLabel {
  return {
    heading: 'Sign in to start your token launch',
    description: 'Create an account or sign in to access the guided token launch workspace and compliance setup.',
    ctaLabel: 'Sign in',
    ariaRole: 'region',
    ariaLive: 'polite',
  };
}

/**
 * Returns the workspace info-state label for an authenticated user who has not
 * yet started a launch journey.
 */
export function getAuthenticatedLaunchReadyState(): WorkspaceStateLabel {
  return {
    heading: 'Ready to launch your token',
    description: 'Your issuer profile is active. Begin the guided launch to create a compliant token in under 30 minutes.',
    ctaLabel: 'Start guided launch',
    ariaRole: 'region',
    ariaLive: 'polite',
  };
}

/**
 * Returns the workspace info-state label for a user with an expired session.
 */
export function getExpiredSessionState(): WorkspaceStateLabel {
  return {
    heading: 'Your session has ended',
    description: 'For your security, your session expired after a period of inactivity. Sign in again to continue where you left off.',
    ctaLabel: 'Sign in again',
    ariaRole: 'alert',
    ariaLive: 'assertive',
  };
}

/**
 * Returns the workspace info-state for compliance setup awaiting completion.
 */
export function getCompliancePendingState(): WorkspaceStateLabel {
  return {
    heading: 'Compliance setup in progress',
    description: 'Complete the compliance readiness checklist to unlock token deployment. Each step is saved automatically.',
    ctaLabel: 'Continue compliance setup',
    ariaRole: 'status',
    ariaLive: 'polite',
  };
}

/**
 * Returns the workspace info-state for deployment pending review.
 */
export function getDeploymentPendingState(): WorkspaceStateLabel {
  return {
    heading: 'Deployment request submitted',
    description: 'Your token deployment request is being processed. You will be notified when it is complete.',
    ctaLabel: 'View deployment status',
    ariaRole: 'status',
    ariaLive: 'polite',
  };
}

/**
 * Resolves the most appropriate workspace state label for a user state and context.
 *
 * @param userState - Derived user state
 * @param context - Launch context: 'launch' | 'compliance' | 'deployment'
 * @returns WorkspaceStateLabel
 */
export function resolveWorkspaceLabel(
  userState: WorkspaceUserState,
  context: 'launch' | 'compliance' | 'deployment' = 'launch',
): WorkspaceStateLabel {
  if (userState === 'guest') return getGuestLaunchEmptyState();
  if (userState === 'expired') return getExpiredSessionState();
  // authenticated
  if (context === 'compliance') return getCompliancePendingState();
  if (context === 'deployment') return getDeploymentPendingState();
  return getAuthenticatedLaunchReadyState();
}

// ---------------------------------------------------------------------------
// Non-wallet terminology enforcement
// ---------------------------------------------------------------------------

/**
 * Patterns that must never appear in primary navigation and launch context banners.
 * These are wallet-era UX artifacts that violate the non-crypto-native product requirement.
 */
export const FORBIDDEN_WALLET_PATTERNS: ReadonlyArray<RegExp> = [
  /connect\s+wallet/i,
  /wallet\s+connect/i,
  /not\s+connected/i,
  /wallet\s+required/i,
  /no\s+wallet/i,
  /network\s+required/i,
  /select\s+network/i,
  /switch\s+network/i,
  /metamask/i,
  /pera\s+wallet/i,
  /defly/i,
  /walletconnect/i,
];

/**
 * Returns true if the given text contains any wallet-era pattern that should not
 * appear in user-facing launch or compliance surfaces.
 *
 * @param text - UI text to inspect
 */
export function containsWalletTerminology(text: string): boolean {
  return FORBIDDEN_WALLET_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Returns the set of forbidden wallet patterns found in the given text.
 *
 * @param text - UI text to inspect
 */
export function findWalletPatterns(text: string): RegExp[] {
  return FORBIDDEN_WALLET_PATTERNS.filter((pattern) => pattern.test(text));
}

/**
 * Labels that are REQUIRED in the primary navigation for the canonical non-wallet experience.
 * Used to assert that the navigation contains the expected business-language labels.
 * "Guided Launch" is the canonical token creation entry point in the rendered navigation.
 */
export const REQUIRED_CANONICAL_NAV_LABELS: ReadonlyArray<string> = [
  'Guided Launch',
  'Sign in',
];

/**
 * Returns true if a navigation label string contains all required canonical labels.
 * Performs case-insensitive matching on the label list.
 *
 * @param labels - Array of navigation label strings
 */
export function allRequiredNavLabelsPresent(labels: string[]): boolean {
  const lower = labels.map((l) => l.toLowerCase());
  return REQUIRED_CANONICAL_NAV_LABELS.every((required) =>
    lower.some((l) => l.includes(required.toLowerCase())),
  );
}

// ---------------------------------------------------------------------------
// Accessibility UX state classification
// ---------------------------------------------------------------------------

/**
 * WCAG 2.1 AA keyboard-navigability classification for a given surface context.
 * Used in assertions and documentation generation.
 */
export interface AccessibilityUXState {
  /** True if the primary CTA is keyboard reachable via Tab */
  primaryCtaKeyboardReachable: boolean;
  /** True if all interactive controls carry visible focus indicators */
  focusIndicatorsVisible: boolean;
  /** True if semantic headings are present (h1 for page, h2 for sections) */
  semanticHeadingsPresent: boolean;
  /** True if error messages use role="alert" or aria-live="assertive" */
  errorsUseAlertRole: boolean;
  /** True if step progress is communicated to screen readers */
  stepProgressAnnounced: boolean;
  /** True if all images and icons carry aria-hidden or alt text */
  iconsAccessible: boolean;
  /** Computed summary: all criteria met */
  meetsBaselineAA: boolean;
}

/**
 * Builds an AccessibilityUXState representing a fully compliant launch surface.
 * Use as the expected value in unit tests for compliance assertions.
 */
export function buildCompliantAccessibilityState(): AccessibilityUXState {
  return {
    primaryCtaKeyboardReachable: true,
    focusIndicatorsVisible: true,
    semanticHeadingsPresent: true,
    errorsUseAlertRole: true,
    stepProgressAnnounced: true,
    iconsAccessible: true,
    meetsBaselineAA: true,
  };
}

/**
 * Validates an AccessibilityUXState and returns a list of violations.
 * An empty array indicates full WCAG 2.1 AA compliance.
 *
 * @param state - The AccessibilityUXState to validate
 */
export function getAccessibilityViolations(state: AccessibilityUXState): string[] {
  const violations: string[] = [];
  if (!state.primaryCtaKeyboardReachable)
    violations.push('Primary CTA is not keyboard reachable (Tab order missing)');
  if (!state.focusIndicatorsVisible)
    violations.push('Focus indicators not visible on interactive elements');
  if (!state.semanticHeadingsPresent)
    violations.push('Semantic headings missing (h1 for page title, h2 for sections)');
  if (!state.errorsUseAlertRole)
    violations.push('Error messages do not use role="alert" or aria-live="assertive"');
  if (!state.stepProgressAnnounced)
    violations.push('Step progress is not announced to screen readers');
  if (!state.iconsAccessible)
    violations.push('Icons and decorative images lack aria-hidden="true" or alt text');
  return violations;
}

/**
 * Returns true when the state has zero accessibility violations.
 */
export function isAccessibilityCompliant(state: AccessibilityUXState): boolean {
  return getAccessibilityViolations(state).length === 0;
}

// ---------------------------------------------------------------------------
// Analytics funnel event builders
// ---------------------------------------------------------------------------

/**
 * Event names for the canonical launch/compliance funnel.
 * Names follow the verb_noun pattern used in existing analytics taxonomy.
 */
export const LAUNCH_FUNNEL_EVENTS = {
  LAUNCH_STARTED: 'launch_started',
  LAUNCH_STEP_COMPLETED: 'launch_step_completed',
  COMPLIANCE_CHECK_VISITED: 'compliance_check_visited',
  COMPLIANCE_CHECK_COMPLETED: 'compliance_check_completed',
  DEPLOY_REQUEST_SUBMITTED: 'deploy_request_submitted',
} as const;

export type LaunchFunnelEvent = (typeof LAUNCH_FUNNEL_EVENTS)[keyof typeof LAUNCH_FUNNEL_EVENTS];

/**
 * Shape of a canonical launch analytics event payload.
 * All fields are optional except for `event` and `timestamp`.
 * No sensitive or PII fields are present.
 */
export interface LaunchAnalyticsEvent {
  /** Event name from LAUNCH_FUNNEL_EVENTS */
  event: LaunchFunnelEvent;
  /** ISO 8601 timestamp of when the event occurred */
  timestamp: string;
  /** Step index (0-based) for step-level events; omitted for journey-level events */
  stepIndex?: number;
  /** Step name in lowercase-kebab form (e.g. 'organization', 'compliance') */
  stepName?: string;
  /** Subscription plan context (non-identifying): 'basic' | 'professional' | 'enterprise' | 'trial' */
  planContext?: 'basic' | 'professional' | 'enterprise' | 'trial';
  /** Session identifier (opaque, non-PII) for funnel deduplication */
  sessionId?: string;
}

/**
 * Builds a launch_started event payload.
 *
 * @param opts - Optional metadata
 */
export function buildLaunchStartedEvent(
  opts: { planContext?: LaunchAnalyticsEvent['planContext']; sessionId?: string } = {},
): LaunchAnalyticsEvent {
  return {
    event: LAUNCH_FUNNEL_EVENTS.LAUNCH_STARTED,
    timestamp: new Date().toISOString(),
    planContext: opts.planContext,
    sessionId: opts.sessionId,
  };
}

/**
 * Builds a launch_step_completed event payload.
 *
 * @param stepIndex - 0-based step index
 * @param stepName - Step name identifier
 * @param opts - Optional metadata
 */
export function buildStepCompletedEvent(
  stepIndex: number,
  stepName: string,
  opts: { planContext?: LaunchAnalyticsEvent['planContext']; sessionId?: string } = {},
): LaunchAnalyticsEvent {
  return {
    event: LAUNCH_FUNNEL_EVENTS.LAUNCH_STEP_COMPLETED,
    timestamp: new Date().toISOString(),
    stepIndex,
    stepName: stepName.toLowerCase().replace(/\s+/g, '-'),
    planContext: opts.planContext,
    sessionId: opts.sessionId,
  };
}

/**
 * Builds a compliance_check_visited event payload.
 *
 * @param opts - Optional metadata
 */
export function buildComplianceVisitedEvent(
  opts: { planContext?: LaunchAnalyticsEvent['planContext']; sessionId?: string } = {},
): LaunchAnalyticsEvent {
  return {
    event: LAUNCH_FUNNEL_EVENTS.COMPLIANCE_CHECK_VISITED,
    timestamp: new Date().toISOString(),
    planContext: opts.planContext,
    sessionId: opts.sessionId,
  };
}

/**
 * Builds a compliance_check_completed event payload.
 *
 * @param opts - Optional metadata
 */
export function buildComplianceCompletedEvent(
  opts: { planContext?: LaunchAnalyticsEvent['planContext']; sessionId?: string } = {},
): LaunchAnalyticsEvent {
  return {
    event: LAUNCH_FUNNEL_EVENTS.COMPLIANCE_CHECK_COMPLETED,
    timestamp: new Date().toISOString(),
    planContext: opts.planContext,
    sessionId: opts.sessionId,
  };
}

/**
 * Builds a deploy_request_submitted event payload.
 *
 * @param opts - Optional metadata
 */
export function buildDeployRequestEvent(
  opts: { planContext?: LaunchAnalyticsEvent['planContext']; sessionId?: string } = {},
): LaunchAnalyticsEvent {
  return {
    event: LAUNCH_FUNNEL_EVENTS.DEPLOY_REQUEST_SUBMITTED,
    timestamp: new Date().toISOString(),
    planContext: opts.planContext,
    sessionId: opts.sessionId,
  };
}

/**
 * Validates that a LaunchAnalyticsEvent does not contain sensitive fields.
 * Returns a list of violations. An empty array means the payload is safe.
 *
 * @param event - The event to validate
 */
export function validateEventPayload(event: LaunchAnalyticsEvent): string[] {
  const violations: string[] = [];
  const eventStr = JSON.stringify(event).toLowerCase();
  const sensitivePatterns = [
    'password', 'secret', 'privatekey', 'mnemonic', 'seedphrase',
    'accesstoken', 'refreshtoken', 'apikey', 'taxid', 'creditcard',
  ];
  for (const pattern of sensitivePatterns) {
    if (eventStr.includes(pattern)) {
      violations.push(`Event payload contains sensitive field: ${pattern}`);
    }
  }
  return violations;
}

/**
 * Returns true when the event is emitted exactly once per stage transition.
 * Validates that the event timestamp is within an acceptable recency window.
 * Use in tests with a controlled `now` parameter.
 *
 * @param event - The analytics event to check
 * @param maxAgeMs - Maximum age in milliseconds (default: 5000)
 * @param now - Reference time for staleness check (default: Date.now())
 */
export function isEventRecentlyEmitted(
  event: LaunchAnalyticsEvent,
  maxAgeMs = 5000,
  now = Date.now(),
): boolean {
  const ts = new Date(event.timestamp).getTime();
  if (Number.isNaN(ts)) return false;
  return now - ts <= maxAgeMs && ts <= now;
}

// ---------------------------------------------------------------------------
// Compliance step error messages (what/why/how)
// ---------------------------------------------------------------------------

/**
 * Error codes specific to the compliance setup journey.
 */
export type ComplianceJourneyErrorCode =
  | 'JURISDICTION_REQUIRED'
  | 'KYC_INCOMPLETE'
  | 'DOCUMENT_MISSING'
  | 'RISK_ASSESSMENT_PENDING'
  | 'WHITELIST_REQUIRED'
  | 'AML_CHECK_FAILED'
  | 'COMPLIANCE_EXPIRED'
  | 'DUPLICATE_SUBMISSION'
  | 'COMPLIANCE_UNKNOWN';

/**
 * Structured compliance error message following the what/why/how pattern.
 */
export interface ComplianceErrorMessage {
  /** Short title: what happened */
  title: string;
  /** Why this matters for the user's token launch */
  description: string;
  /** Specific next action to resolve the issue */
  action: string;
  /** Whether the user can self-serve the resolution */
  selfServiceable: boolean;
  /** Severity for UI styling */
  severity: 'error' | 'warning' | 'info';
}

const COMPLIANCE_ERROR_REGISTRY: Record<ComplianceJourneyErrorCode, ComplianceErrorMessage> = {
  JURISDICTION_REQUIRED: {
    title: 'Jurisdiction not selected',
    description: 'Regulatory requirements vary by jurisdiction. Selecting one is required to determine your compliance obligations.',
    action: 'Choose your issuing jurisdiction from the dropdown before continuing.',
    selfServiceable: true,
    severity: 'warning',
  },
  KYC_INCOMPLETE: {
    title: 'Identity verification incomplete',
    description: 'Token issuance requires identity verification under applicable regulations. Your issuance cannot proceed until this is complete.',
    action: 'Complete the identity verification steps in your issuer profile to continue.',
    selfServiceable: true,
    severity: 'error',
  },
  DOCUMENT_MISSING: {
    title: 'Required document not uploaded',
    description: 'One or more compliance documents are required for your jurisdiction and token type.',
    action: 'Upload the missing documents in the Documents section of your compliance checklist.',
    selfServiceable: true,
    severity: 'warning',
  },
  RISK_ASSESSMENT_PENDING: {
    title: 'Risk assessment not completed',
    description: 'A risk assessment is required for regulated token issuance. This protects you and your investors.',
    action: 'Complete the risk disclosure questions in Step 3 of the compliance setup.',
    selfServiceable: true,
    severity: 'warning',
  },
  WHITELIST_REQUIRED: {
    title: 'Transfer whitelist not configured',
    description: 'Your selected token type requires a transfer whitelist to restrict token holders to verified investors.',
    action: 'Set up a transfer whitelist in the Compliance step before submitting your launch request.',
    selfServiceable: true,
    severity: 'warning',
  },
  AML_CHECK_FAILED: {
    title: 'Anti-money laundering check did not pass',
    description: 'An automated AML screening check flagged an issue with your account. This must be resolved before deployment.',
    action: 'Contact support at support@biatec.io with your account email to resolve this check.',
    selfServiceable: false,
    severity: 'error',
  },
  COMPLIANCE_EXPIRED: {
    title: 'Compliance status has expired',
    description: 'Your previously completed compliance checks have expired and need to be renewed.',
    action: 'Revisit the compliance setup and re-confirm the expired steps to renew your status.',
    selfServiceable: true,
    severity: 'warning',
  },
  DUPLICATE_SUBMISSION: {
    title: 'A similar submission already exists',
    description: 'A compliance submission with the same details was already received. Duplicate submissions are not processed.',
    action: 'Check your compliance status in the dashboard. If you believe this is an error, contact support.',
    selfServiceable: false,
    severity: 'info',
  },
  COMPLIANCE_UNKNOWN: {
    title: 'Compliance check could not complete',
    description: 'An unexpected issue prevented the compliance check from running.',
    action: 'Refresh the page and try again. If the problem persists, contact support at support@biatec.io.',
    selfServiceable: true,
    severity: 'error',
  },
};

/**
 * Returns the structured compliance error message for a given error code.
 *
 * @param code - ComplianceJourneyErrorCode
 */
export function getComplianceErrorMessage(code: ComplianceJourneyErrorCode): ComplianceErrorMessage {
  return COMPLIANCE_ERROR_REGISTRY[code];
}

/**
 * Maps a raw error or string to a ComplianceJourneyErrorCode.
 * Inspects the message for known patterns to select the most appropriate code.
 *
 * @param error - Raw error from a failed compliance operation
 */
export function classifyComplianceError(error: unknown): ComplianceJourneyErrorCode {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (msg.includes('jurisdiction')) return 'JURISDICTION_REQUIRED';
  if (msg.includes('kyc') || msg.includes('identity') || msg.includes('verification')) return 'KYC_INCOMPLETE';
  if (msg.includes('document') || msg.includes('upload') || msg.includes('missing file')) return 'DOCUMENT_MISSING';
  if (msg.includes('risk') || msg.includes('disclosure')) return 'RISK_ASSESSMENT_PENDING';
  if (msg.includes('whitelist') || msg.includes('transfer restriction')) return 'WHITELIST_REQUIRED';
  if (msg.includes('aml') || msg.includes('anti-money') || msg.includes('screening')) return 'AML_CHECK_FAILED';
  if (msg.includes('expired') || msg.includes('expir')) return 'COMPLIANCE_EXPIRED';
  if (msg.includes('duplicate') || msg.includes('already exists')) return 'DUPLICATE_SUBMISSION';

  return 'COMPLIANCE_UNKNOWN';
}

// ---------------------------------------------------------------------------
// Legacy redirect assertion helpers
// ---------------------------------------------------------------------------

/**
 * The legacy wizard route that must redirect to the canonical guided launch.
 */
export const LEGACY_WIZARD_REDIRECT_SOURCE = '/create/wizard';

/**
 * The canonical guided launch destination.
 */
export const CANONICAL_LAUNCH_DESTINATION = '/launch/guided';

/**
 * Returns true if the given route pair represents a valid legacy-to-canonical redirect.
 * Used in router configuration assertions and E2E redirect tests.
 *
 * @param fromPath - The path being navigated from
 * @param toPath - The path being navigated to
 */
export function isValidLegacyRedirect(fromPath: string, toPath: string): boolean {
  return fromPath === LEGACY_WIZARD_REDIRECT_SOURCE && toPath === CANONICAL_LAUNCH_DESTINATION;
}

/**
 * Returns true if a given path is the canonical launch route or the workspace orchestration entry.
 */
export function isCanonicalLaunchPath(path: string): boolean {
  return path === CANONICAL_LAUNCH_DESTINATION || path === '/launch/workspace';
}

// ---------------------------------------------------------------------------
// Route coverage invariants for testing
// ---------------------------------------------------------------------------

/**
 * All compliance routes that must be auth-gated in the canonical experience.
 * Used to assert consistent compliance setup behaviour across the router configuration.
 */
export const COMPLIANCE_AUTH_GATED_ROUTES: ReadonlyArray<string> = [
  '/compliance/launch',
  '/compliance/setup',
  '/compliance/orchestration',
  '/compliance-monitoring',
  '/compliance/whitelists',
];

/**
 * Returns true if the given path is in the compliance auth-gated set.
 */
export function isComplianceAuthGated(path: string): boolean {
  return COMPLIANCE_AUTH_GATED_ROUTES.includes(path);
}

/**
 * Launch routes that must require authentication.
 */
export const LAUNCH_AUTH_REQUIRED_ROUTES: ReadonlyArray<string> = [
  '/launch/guided',
  '/launch/workspace',
  '/create',
  '/create/batch',
];

/**
 * Returns true if the given path is a launch route that requires authentication.
 */
export function isLaunchAuthRequired(path: string): boolean {
  return LAUNCH_AUTH_REQUIRED_ROUTES.includes(path);
}
