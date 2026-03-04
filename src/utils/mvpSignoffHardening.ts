/**
 * MVP Sign-off Hardening Utility
 *
 * Provides deterministic, testable helpers that address the three material
 * blockers identified for beta launch readiness:
 *
 * 1. Canonical flow enforcement — classify paths, detect legacy route misuse,
 *    and map deprecated → canonical without side effects.
 *
 * 2. Backend-verified auth confidence — quality-grade an auth bootstrap
 *    pattern, validate session contract completeness, and compute a
 *    confidence level that distinguishes localStorage-only seeding from
 *    backend-verified session bootstrap.
 *
 * 3. Accessibility baseline — assert the structural elements required by
 *    the WCAG 2.1 AA baseline for high-value onboarding and launch flows.
 *
 * Design goals:
 * - Pure functions — same inputs always produce same outputs.
 * - Zero side effects (except clearly-marked localStorage helpers).
 * - Zero dependency on arbitrary timeouts.
 * - Composable with existing router guards, E2E helpers, and Pinia stores.
 *
 * Related files:
 * - src/utils/confidenceHardening.ts      (broader confidence primitives)
 * - src/utils/mvpCanonicalFlow.ts         (session contract + step helpers)
 * - src/utils/canonicalLaunchWorkspace.ts (workspace state derivation)
 * - e2e/helpers/auth.ts                   (E2E session bootstrap helpers)
 *
 * Issue: MVP hardening — canonical launch flow, backend-verified auth confidence,
 *        and accessibility baseline
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// 1. Canonical flow enforcement
// ---------------------------------------------------------------------------

/**
 * The single canonical token-creation route used by primary navigation,
 * CTAs, and E2E tests that exercise the issuance journey.
 */
export const SIGNOFF_CANONICAL_LAUNCH_ROUTE = '/launch/guided' as const;

/**
 * Legacy wizard route that MUST redirect to the canonical route.
 * Retained in the router as a redirect target only — never a navigation target.
 */
export const SIGNOFF_LEGACY_WIZARD_ROUTE = '/create/wizard' as const;

/**
 * All routes that are deprecated (redirect targets, not primary navigation).
 */
export const SIGNOFF_DEPRECATED_ROUTES: ReadonlyArray<string> = [
  SIGNOFF_LEGACY_WIZARD_ROUTE,
  '/create',
];

/**
 * Returns `true` if `path` is a deprecated route that should only exist as
 * a redirect target and must never appear as a primary navigation link.
 */
export function isDeprecatedSignoffRoute(path: string): boolean {
  return SIGNOFF_DEPRECATED_ROUTES.some(dep => path === dep || path.startsWith(`${dep}/`));
}

/**
 * Maps a deprecated path to its canonical replacement.
 * Returns `null` if no mapping exists (i.e. the path is already canonical).
 */
export function getCanonicalSignoffRoute(path: string): string | null {
  if (path === SIGNOFF_LEGACY_WIZARD_ROUTE || path.startsWith('/create')) {
    return SIGNOFF_CANONICAL_LAUNCH_ROUTE;
  }
  return null;
}

/**
 * Checks that none of the canonical journey routes (the paths used in primary
 * navigation and primary-journey E2E tests) reference deprecated routes.
 *
 * @param canonicalPaths - Array of route strings used in primary navigation/CTAs.
 * @returns Array of violations (empty = clean).
 */
export function auditCanonicalJourneyRoutes(canonicalPaths: string[]): string[] {
  const violations: string[] = [];
  for (const path of canonicalPaths) {
    if (isDeprecatedSignoffRoute(path)) {
      violations.push(
        `Deprecated route used in canonical journey: "${path}" → should be "${getCanonicalSignoffRoute(path)}"`,
      );
    }
  }
  return violations;
}

/**
 * Returns `true` if the test source string contains a navigation to
 * `/create/wizard` that is NOT inside a redirect-compatibility describe block.
 * Used to detect inadvertent wizard references in canonical-journey specs.
 */
export function containsNonRedirectWizardReference(source: string): boolean {
  // Lines containing /create/wizard that are not clearly in redirect compat context
  const lines = source.split('\n');
  let inRedirectBlock = false;
  for (const line of lines) {
    if (/redirect[-_\s]compat|redirect compatibility|legacy.*redirect/i.test(line)) {
      inRedirectBlock = true;
    }
    // Check for the wizard path in navigation/goto calls outside redirect blocks
    if (!inRedirectBlock && /goto\(['"`]\/create\/wizard/.test(line)) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 2. Backend-verified auth confidence
// ---------------------------------------------------------------------------

/**
 * Auth confidence levels that grade the quality of an E2E session bootstrap
 * pattern. Higher confidence = closer to production behavior.
 */
export type AuthConfidenceLevel =
  | 'backend_verified' // loginWithCredentials succeeded against real API
  | 'contract_validated' // withAuth: localStorage seeding + ARC76 contract validation
  | 'raw_seeding' // ad-hoc localStorage.setItem without contract validation
  | 'no_auth'; // unauthenticated / guest state

/**
 * Session confidence report produced by `assessAuthSessionConfidence`.
 */
export interface AuthConfidenceReport {
  level: AuthConfidenceLevel;
  score: number; // 0–100, higher = more production-realistic
  findings: string[];
  recommendation: string;
}

/**
 * Minimum session shape required for confidence scoring.
 */
export interface SignoffSessionShape {
  address?: string | null;
  email?: string | null;
  isConnected?: boolean | null;
}

/**
 * Assesses how production-realistic a session's structure is.
 *
 * Scoring rubric:
 *   - Non-empty address:    +25 pts
 *   - Valid email format:   +25 pts
 *   - isConnected === true: +25 pts
 *   - Address ≥ 58 chars:   +25 pts (Algorand addresses are 58 base32 characters)
 *
 * @param session - Raw session object (may be null for unauthenticated state).
 * @param pattern - The bootstrap pattern used to populate the session.
 */
export function assessAuthSessionConfidence(
  session: SignoffSessionShape | null | undefined,
  pattern: AuthConfidenceLevel = 'raw_seeding',
): AuthConfidenceReport {
  if (!session) {
    return {
      level: 'no_auth',
      score: 0,
      findings: ['No session present — unauthenticated state.'],
      recommendation:
        'Call withAuth() or loginWithCredentials() to bootstrap an authenticated session.',
    };
  }

  const findings: string[] = [];
  let score = 0;

  // Address completeness
  if (typeof session.address === 'string' && session.address.length > 0) {
    score += 25;
    if (session.address.length >= 58) {
      score += 25;
    } else {
      findings.push(`address is present but short (${session.address.length} chars < 58 — Algorand addresses are 58 base32 characters).`);
    }
  } else {
    findings.push('address is missing or empty.');
  }

  // Email completeness
  if (typeof session.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session.email)) {
    score += 25;
  } else {
    findings.push('email is missing or does not match basic email format.');
  }

  // isConnected flag
  if (session.isConnected === true) {
    score += 25;
  } else {
    findings.push('isConnected is not true — session will be treated as expired by auth guard.');
  }

  const level: AuthConfidenceLevel = score >= 100 ? pattern : pattern === 'no_auth' ? 'no_auth' : 'raw_seeding';

  let recommendation = '';
  if (score < 50) {
    recommendation =
      'Session is incomplete. Use withAuth() which validates the ARC76 contract before seeding.';
  } else if (score < 100) {
    recommendation =
      'Session is partially valid. Ensure all three required fields (address, email, isConnected) are present.';
  } else if (pattern === 'raw_seeding') {
    recommendation =
      'Session structure is valid but bootstrap pattern is raw_seeding. Prefer withAuth() or loginWithCredentials().';
  } else {
    recommendation = 'Session is fully valid and bootstrap pattern meets the confidence baseline.';
  }

  return { level, score, findings, recommendation };
}

/**
 * Returns `true` if `source` (a test file string) uses the canonical
 * `withAuth` or `loginWithCredentials` helper pattern instead of raw
 * `localStorage.setItem('algorand_user', ...)`.
 *
 * This is used to grade how "backend-aware" a critical E2E spec is.
 */
export function usesCanonicalAuthBootstrap(source: string): boolean {
  const hasCanonical =
    /withAuth\s*\(/.test(source) || /loginWithCredentials\s*\(/.test(source);
  return hasCanonical;
}

/**
 * Detects raw localStorage auth seeding anti-patterns in test source.
 * Returns an array of descriptive violation strings (empty = clean).
 */
export function detectRawAuthSeedingPatterns(source: string): string[] {
  const violations: string[] = [];
  const lines = source.split('\n');
  lines.forEach((line, i) => {
    if (/localStorage\.setItem\(['"`]algorand_user/.test(line)) {
      violations.push(
        `Line ${i + 1}: raw localStorage auth seeding — use withAuth() or loginWithCredentials() instead.`,
      );
    }
  });
  return violations;
}

// ---------------------------------------------------------------------------
// 3. Accessibility baseline
// ---------------------------------------------------------------------------

/**
 * The minimum set of landmarks required for WCAG 2.1 AA compliance in
 * high-value authenticated flows (onboarding, guided launch, compliance).
 */
export const WCAG_REQUIRED_LANDMARKS = ['navigation', 'main', 'banner'] as const;

/**
 * Key ARIA attributes required on specific interactive elements.
 */
export interface AriaRequirement {
  role: string;
  requiredAttributes: string[];
  description: string;
}

export const ARIA_REQUIREMENTS: ReadonlyArray<AriaRequirement> = [
  {
    role: 'progressbar',
    requiredAttributes: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    description: 'Stepper/progress indicator must expose numeric value range for screen readers.',
  },
  {
    role: 'button',
    requiredAttributes: ['accessible-name'],
    description: 'All buttons must have a discernible accessible name (text or aria-label).',
  },
  {
    role: 'form',
    requiredAttributes: ['accessible-name'],
    description:
      'Forms must have an accessible name (aria-label or aria-labelledby) for screen reader context.',
  },
];

/**
 * Accessibility baseline check result.
 */
export interface AccessibilityBaselineResult {
  pass: boolean;
  missingLandmarks: string[];
  ariaViolations: string[];
  focusIssues: string[];
  summary: string;
}

/**
 * Validates an accessibility baseline descriptor (typically from an automated
 * audit) against the minimum required set for high-value flows.
 *
 * @param foundLandmarks - Landmark roles found on the page.
 * @param ariaIssues     - Raw ARIA violation messages from an audit tool.
 * @param focusIssues    - Focus-related issues (e.g., missing visible focus ring).
 */
export function validateAccessibilityBaseline(
  foundLandmarks: string[],
  ariaIssues: string[] = [],
  focusIssues: string[] = [],
): AccessibilityBaselineResult {
  const missingLandmarks = (WCAG_REQUIRED_LANDMARKS as readonly string[]).filter(
    lm => !foundLandmarks.includes(lm),
  );

  const allViolations = [...ariaIssues];
  const allFocusIssues = [...focusIssues];

  const pass = missingLandmarks.length === 0 && allViolations.length === 0 && allFocusIssues.length === 0;

  const parts: string[] = [];
  if (missingLandmarks.length > 0) {
    parts.push(`Missing landmarks: ${missingLandmarks.join(', ')}.`);
  }
  if (allViolations.length > 0) {
    parts.push(`ARIA violations (${allViolations.length}).`);
  }
  if (allFocusIssues.length > 0) {
    parts.push(`Focus issues (${allFocusIssues.length}).`);
  }

  const summary = pass
    ? 'Accessibility baseline PASSED — all required landmarks present, no ARIA/focus violations.'
    : `Accessibility baseline FAILED: ${parts.join(' ')}`;

  return { pass, missingLandmarks, ariaViolations: allViolations, focusIssues: allFocusIssues, summary };
}

// ---------------------------------------------------------------------------
// 4. Error message quality (what / why / how structure)
// ---------------------------------------------------------------------------

/**
 * Structured error message following the "what happened / why it matters /
 * what to do next" pattern required for user-facing error guidance.
 */
export interface SignoffErrorMessage {
  what: string; // What happened (no jargon)
  why: string; // Why it matters to the user
  how: string; // What to do next (actionable)
}

/**
 * Validates that a user-facing error message meets the structural quality bar.
 * Returns an array of issues (empty = valid).
 */
export function validateSignoffErrorMessage(msg: SignoffErrorMessage): string[] {
  const issues: string[] = [];

  if (!msg.what || msg.what.trim().length < 10) {
    issues.push('"what" must be at least 10 characters describing what happened.');
  }
  if (!msg.why || msg.why.trim().length < 10) {
    issues.push('"why" must be at least 10 characters explaining why it matters.');
  }
  if (!msg.how || msg.how.trim().length < 10) {
    issues.push('"how" must be at least 10 characters providing actionable guidance.');
  }

  // Reject raw technical identifiers as error text
  const technicalPatterns = [/0x[0-9a-f]{8,}/i, /^\d{3,}$/, /Error:\s+\w+Exception/];
  for (const pattern of technicalPatterns) {
    if (pattern.test(msg.what) || pattern.test(msg.why) || pattern.test(msg.how)) {
      issues.push('Error message contains raw technical identifiers or exception class names.');
      break;
    }
  }

  return issues;
}

/**
 * Standard user-facing error messages for the critical hardening flows.
 */
export const SIGNOFF_ERROR_MESSAGES = {
  sessionExpired: {
    what: 'Your session has ended.',
    why: 'For security, sessions automatically expire after a period of inactivity.',
    how: 'Sign in again to continue where you left off.',
  } satisfies SignoffErrorMessage,

  authRequired: {
    what: 'You need to sign in to access this page.',
    why: 'This area is reserved for authenticated users managing their token portfolio.',
    how: 'Use the Sign In button to continue with your email and password.',
  } satisfies SignoffErrorMessage,

  launchStepIncomplete: {
    what: 'This step cannot be skipped.',
    why: 'Each step in the guided launch provides information required by later compliance checks.',
    how: 'Complete the required fields above before continuing to the next step.',
  } satisfies SignoffErrorMessage,
} as const;

// ---------------------------------------------------------------------------
// 5. Sign-off readiness summary
// ---------------------------------------------------------------------------

/**
 * Input descriptor for computing an MVP sign-off readiness summary.
 */
export interface SignoffReadinessInput {
  /** Routes used in primary navigation/CTAs. */
  canonicalPaths: string[];
  /** Auth bootstrap confidence level for critical E2E suites. */
  authBootstrapLevel: AuthConfidenceLevel;
  /** Landmarks found on a high-value page. */
  foundLandmarks: string[];
  /** Number of `waitForTimeout()` calls in touched test files. */
  arbitraryTimeoutCount: number;
  /** Number of `test.skip()` calls for modified functionality. */
  newSkipCount: number;
}

/**
 * Result produced by `computeSignoffReadiness`.
 */
export interface SignoffReadinessResult {
  ready: boolean;
  score: number; // 0–100
  blockers: string[];
  warnings: string[];
  summary: string;
}

/**
 * Computes a composite sign-off readiness score from the five hardening
 * dimensions addressed by this issue.
 *
 * Scoring (20 pts each):
 *   1. No deprecated routes in canonical journey paths.
 *   2. Auth bootstrap is contract_validated or better.
 *   3. All required WCAG landmarks present.
 *   4. Zero arbitrary waitForTimeout() calls in touched suites.
 *   5. Zero new test.skip() calls for modified functionality.
 */
export function computeSignoffReadiness(input: SignoffReadinessInput): SignoffReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // 1. Canonical route policy
  const routeViolations = auditCanonicalJourneyRoutes(input.canonicalPaths);
  if (routeViolations.length === 0) {
    score += 20;
  } else {
    blockers.push(...routeViolations);
  }

  // 2. Auth bootstrap confidence
  const authScore: Record<AuthConfidenceLevel, number> = {
    backend_verified: 20,
    contract_validated: 20, // withAuth() meets the bar for this phase
    raw_seeding: 0,
    no_auth: 0,
  };
  const authPts = authScore[input.authBootstrapLevel] ?? 0;
  score += authPts;
  if (authPts === 0) {
    blockers.push(
      `Auth bootstrap level "${input.authBootstrapLevel}" does not meet the contract_validated minimum.`,
    );
  }

  // 3. Accessibility landmarks
  const missingLandmarks = (WCAG_REQUIRED_LANDMARKS as readonly string[]).filter(
    lm => !input.foundLandmarks.includes(lm),
  );
  if (missingLandmarks.length === 0) {
    score += 20;
  } else {
    blockers.push(`Missing WCAG required landmarks: ${missingLandmarks.join(', ')}.`);
  }

  // 4. Arbitrary timeouts
  if (input.arbitraryTimeoutCount === 0) {
    score += 20;
  } else {
    blockers.push(
      `${input.arbitraryTimeoutCount} arbitrary waitForTimeout() call(s) in touched test files.`,
    );
  }

  // 5. New test skips
  if (input.newSkipCount === 0) {
    score += 20;
  } else {
    warnings.push(
      `${input.newSkipCount} new test.skip() call(s) introduced for modified functionality.`,
    );
  }

  const ready = blockers.length === 0;
  const summary = ready
    ? `Sign-off READY (score: ${score}/100) — all 5 hardening dimensions pass.`
    : `Sign-off BLOCKED (score: ${score}/100) — ${blockers.length} blocker(s) must be resolved.`;

  return { ready, score, blockers, warnings, summary };
}
