/**
 * Confidence Hardening Utility
 *
 * Provides deterministic, testable helpers that address the core frontend quality
 * gap: brittle test patterns, legacy flow ambiguity, and non-realistic auth seeding.
 *
 * Covers:
 * - Route canonicalization: detect legacy paths, assert canonical paths, map redirects
 * - Auth session realism: structured session bootstrap (contract-validated, not raw strings)
 * - Message quality: what/why/how checker for user-facing messages
 * - Deterministic wait helpers: semantic readiness signals (replaces waitForTimeout patterns)
 * - Top-nav state assertions: guest vs authenticated rendering invariants
 * - Regression detectors: catch prohibited labels, deprecated path constants, seeding anti-patterns
 * - Accessibility readiness: WCAG keyboard-traversal and focus checks
 *
 * Design goals:
 * - Pure functions with no side effects (localStorage helpers are clearly marked)
 * - Deterministic: same inputs → same outputs, always
 * - Zero dependency on arbitrary timeouts — consumers use semantic waits
 * - Composable with router guards, E2E fixture setup, and Pinia stores
 * - No wallet/blockchain/network jargon in any user-facing output
 *
 * Related files:
 * - src/utils/mvpCanonicalFlow.ts       (session contract + guided-launch step helpers)
 * - src/utils/authFirstHardening.ts     (route classification + nav invariants)
 * - src/utils/canonicalLaunchWorkspace.ts (workspace state derivation)
 * - src/utils/launchErrorMessages.ts    (user-facing error messages)
 * - src/utils/operationsErrorMessages.ts (operations-domain errors)
 * - src/router/index.ts                 (router guard implementation)
 *
 * Issue: Next MVP — frontend confidence hardening for auth-first deterministic flows
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Route canonicalization
// ---------------------------------------------------------------------------

/**
 * The single canonical token-creation entry route.
 * All navigation CTAs and test assertions must target this path.
 */
export const CANONICAL_TOKEN_CREATION_ROUTE = '/launch/guided';

/**
 * Legacy wizard route that must redirect to the canonical route.
 * This must never appear as a primary navigation target.
 */
export const LEGACY_WIZARD_ROUTE = '/create/wizard';

/**
 * The canonical operations / command-center route.
 */
export const CANONICAL_OPERATIONS_ROUTE = '/operations';

/**
 * The canonical compliance setup route.
 */
export const CANONICAL_COMPLIANCE_ROUTE = '/compliance/setup';

/**
 * The canonical dashboard route after successful authentication.
 */
export const CANONICAL_POST_AUTH_ROUTE = '/launch/guided';

/**
 * Explicit list of deprecated route paths that must redirect and never be
 * primary navigation targets. Tests fail if these appear as href values in
 * canonical navigation.
 */
export const DEPRECATED_ROUTES: ReadonlyArray<string> = [
  '/create/wizard',
  '/create/token',
];

/**
 * Returns true if the given path is a deprecated canonical route that must
 * redirect to a current canonical path.
 */
export function isDeprecatedRoute(path: string): boolean {
  const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/';
  return DEPRECATED_ROUTES.some((d) => cleanPath === d || cleanPath.startsWith(d + '/'));
}

/**
 * Returns the canonical redirect target for a deprecated route, or null if
 * the path is not deprecated.
 */
export function getCanonicalRedirectFor(path: string): string | null {
  if (path === LEGACY_WIZARD_ROUTE || path.startsWith(LEGACY_WIZARD_ROUTE + '/')) {
    return CANONICAL_TOKEN_CREATION_ROUTE;
  }
  if (path === '/create/token' || path.startsWith('/create/token/')) {
    return CANONICAL_TOKEN_CREATION_ROUTE;
  }
  return null;
}

/**
 * Returns true if the given path is the canonical token creation route.
 */
export function isCanonicalTokenCreationRoute(path: string): boolean {
  const cleanPath = path.split('?')[0];
  return cleanPath === CANONICAL_TOKEN_CREATION_ROUTE;
}

/**
 * Asserts that a given URL does not contain any deprecated route segment.
 * Returns an array of violations (empty if clean).
 */
export function findDeprecatedRouteViolations(url: string): string[] {
  return DEPRECATED_ROUTES.filter((d) => url.includes(d));
}

// ---------------------------------------------------------------------------
// Auth session realism
// ---------------------------------------------------------------------------

/**
 * Shape of the canonical auth session object.
 * All fields are required; missing fields indicate an invalid session.
 */
export interface HardenedSession {
  address: string;
  email: string;
  isConnected: boolean;
}

/**
 * Validation result for a hardened session.
 */
export interface SessionValidation {
  valid: boolean;
  errors: string[];
  session: HardenedSession | null;
}

/**
 * Storage key used by the auth store.
 */
export const AUTH_SESSION_KEY = 'algorand_user';

/**
 * Validates a raw session object against the HardenedSession contract.
 * Returns a SessionValidation result with all errors listed.
 */
export function validateHardenedSession(raw: unknown): SessionValidation {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Session must be a non-null object'], session: null };
  }

  const obj = raw as Record<string, unknown>;

  if (!obj.address || typeof obj.address !== 'string' || obj.address.trim() === '') {
    errors.push('address must be a non-empty string');
  }
  if (!obj.email || typeof obj.email !== 'string' || obj.email.trim() === '') {
    errors.push('email must be a non-empty string');
  }
  if (typeof obj.isConnected !== 'boolean') {
    errors.push('isConnected must be a boolean');
  }

  if (errors.length > 0) {
    return { valid: false, errors, session: null };
  }

  return {
    valid: true,
    errors: [],
    session: {
      address: obj.address as string,
      email: obj.email as string,
      isConnected: obj.isConnected as boolean,
    },
  };
}

/**
 * Builds a valid, connected hardened session fixture.
 * Produces a structured object rather than a raw JSON string — callers
 * should serialise with JSON.stringify before writing to localStorage.
 */
export function buildHardenedSession(overrides: Partial<HardenedSession> = {}): HardenedSession {
  return {
    address: 'CONFIDENCE_HARDENING_TEST_ADDRESS',
    email: 'confidence-hardening@biatec.io',
    isConnected: true,
    ...overrides,
  };
}

/**
 * Builds an expired session fixture (isConnected: false) to simulate
 * session expiry scenarios in tests.
 */
export function buildExpiredHardenedSession(overrides: Partial<HardenedSession> = {}): HardenedSession {
  return buildHardenedSession({ isConnected: false, ...overrides });
}

/**
 * Returns true if the provided session represents a live, connected user.
 */
export function isLiveSession(session: HardenedSession | null | undefined): boolean {
  if (!session) return false;
  return (
    session.isConnected === true &&
    typeof session.address === 'string' &&
    session.address.trim() !== '' &&
    typeof session.email === 'string' &&
    session.email.trim() !== ''
  );
}

/**
 * Reads and validates the session from the localStorage string.
 * Returns a SessionValidation result; never throws.
 */
export function readAndValidateHardenedSession(raw: string | null): SessionValidation {
  if (!raw) {
    return { valid: false, errors: ['No session found in storage'], session: null };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ['Session is not valid JSON'], session: null };
  }
  return validateHardenedSession(parsed);
}

// ---------------------------------------------------------------------------
// Message quality — what / why / how structure
// ---------------------------------------------------------------------------

/**
 * A user-facing message following the what/why/how structure.
 * Required for all error states, status notifications, and guidance copy.
 */
export interface WhatWhyHow {
  /** What happened — plain-language description of the event (≤80 chars) */
  what: string;
  /** Why it matters — consequence for the user (≤120 chars) */
  why: string;
  /** How to resolve it — next action the user should take (≤100 chars) */
  how: string;
}

/**
 * Validation result for a WhatWhyHow message.
 */
export interface MessageQualityResult {
  valid: boolean;
  violations: string[];
}

/**
 * Validates a WhatWhyHow message against quality requirements:
 * - All three fields must be non-empty strings
 * - No field should contain wallet/blockchain/technical jargon
 * - 'what' ≤80 chars, 'why' ≤120 chars, 'how' ≤100 chars
 */
export function validateMessageQuality(msg: WhatWhyHow): MessageQualityResult {
  const violations: string[] = [];

  if (!msg.what || msg.what.trim() === '') violations.push("'what' must be non-empty");
  if (!msg.why || msg.why.trim() === '') violations.push("'why' must be non-empty");
  if (!msg.how || msg.how.trim() === '') violations.push("'how' must be non-empty");

  if (msg.what && msg.what.length > 80) {
    violations.push(`'what' exceeds 80 chars (${msg.what.length})`);
  }
  if (msg.why && msg.why.length > 120) {
    violations.push(`'why' exceeds 120 chars (${msg.why.length})`);
  }
  if (msg.how && msg.how.length > 100) {
    violations.push(`'how' exceeds 100 chars (${msg.how.length})`);
  }

  const jargonPatterns = [
    /\bwallet\b/i, /\bblockchain\b/i, /on-chain/i, /off-chain/i, /gas\s+fee/i,
    /private\s+key/i, /seed\s+phrase/i, /\bmnemonic\b/i, /\bledger\b/i,
    /\bmetamask\b/i, /\bpera\s+wallet\b/i, /\bdefly\b/i, /\bwalletconnect\b/i,
  ];

  const allText = `${msg.what} ${msg.why} ${msg.how}`;
  jargonPatterns.forEach((pattern) => {
    if (pattern.test(allText)) {
      violations.push(`Message contains prohibited jargon matching ${pattern}`);
    }
  });

  return { valid: violations.length === 0, violations };
}

/**
 * Catalogue of canonical confidence-hardening messages.
 * All messages follow the what/why/how structure and pass quality validation.
 */
export const CONFIDENCE_MESSAGES = {
  authRequired: {
    what: 'Sign in to continue',
    why: 'This step requires a verified account to protect your work.',
    how: 'Use your email and password to sign in, then return here.',
  } as WhatWhyHow,

  sessionExpired: {
    what: 'Your session has ended',
    why: 'Sessions expire automatically for account security.',
    how: 'Sign in again to resume where you left off.',
  } as WhatWhyHow,

  legacyRouteRedirected: {
    what: 'This page has moved',
    why: 'The token launch experience is now available at a new address.',
    how: 'You have been redirected to the updated launch workspace.',
  } as WhatWhyHow,

  complianceIncomplete: {
    what: 'Compliance setup is not complete',
    why: 'Launching a token requires all compliance checks to pass first.',
    how: 'Complete the compliance setup checklist before submitting.',
  } as WhatWhyHow,

  launchInProgress: {
    what: 'Your token launch is being prepared',
    why: 'This step may take a moment while details are being validated.',
    how: 'Wait for confirmation before proceeding to the next step.',
  } as WhatWhyHow,

  launchSuccess: {
    what: 'Token launch submitted successfully',
    why: 'Your token launch request has been received and queued for processing.',
    how: 'Monitor progress in your operations dashboard.',
  } as WhatWhyHow,
} as const;

// ---------------------------------------------------------------------------
// Deterministic wait pattern helpers
// ---------------------------------------------------------------------------

/**
 * The recommended viewport minimum width for desktop-mode rendering.
 * Tests asserting desktop-only elements should check for this condition.
 */
export const DESKTOP_VIEWPORT_MIN_WIDTH = 1024;

/**
 * DOM test-id constants for elements used as semantic readiness anchors.
 * E2E tests should wait for these IDs to be visible before asserting content.
 */
export const READINESS_ANCHORS = {
  /** Main page heading — signals the page has fully mounted */
  pageHeading: 'page-heading',
  /** Navigation bar — signals layout has rendered */
  navbar: 'navbar',
  /** Auth guard redirect complete — signals router guard has resolved */
  authRedirectComplete: 'auth-redirect-complete',
  /** Guided launch step — signals the step component has mounted */
  guidedLaunchStep: 'guided-launch-step',
  /** Compliance status card — signals compliance data has loaded */
  complianceStatusCard: 'compliance-status-card',
  /** Command center action card — signals command center has rendered */
  commandCenterCard: 'command-center-card',
  /** Error alert — signals an error state has been displayed */
  errorAlert: 'error-alert',
} as const;

/**
 * Returns true if the provided timeout value is within the accepted semantic
 * timeout range for CI environments.
 *
 * Semantic timeouts are:
 * - Minimum: 5000ms (enough for a render cycle)
 * - Maximum: 60000ms (CI-safe upper bound)
 *
 * Values outside this range indicate either an arbitrary sleep (too low) or
 * an excessively generous wait that masks test instability (too high).
 */
export function isSemanticTimeout(ms: number): boolean {
  return ms >= 5000 && ms <= 60000;
}

/**
 * Describes a semantic readiness assertion in plain language.
 * Use in test documentation and triage artifacts.
 */
export interface SemanticReadinessDescriptor {
  /** DOM signal type that indicates readiness */
  signal: 'element_visible' | 'url_changed' | 'network_idle' | 'function_true';
  /** Human-readable description of what the signal represents */
  description: string;
  /** Recommended timeout in milliseconds for CI environments */
  recommendedTimeoutMs: number;
}

/**
 * Standard readiness descriptors for critical flow steps.
 * Use these to document why a specific wait exists in test utilities.
 */
export const STANDARD_READINESS_DESCRIPTORS: Record<string, SemanticReadinessDescriptor> = {
  pageLoad: {
    signal: 'network_idle',
    description: 'Page HTML and critical assets have been received',
    recommendedTimeoutMs: 10000,
  },
  authRouteReady: {
    signal: 'element_visible',
    description: 'Auth-required page content is visible, confirming router guard passed',
    recommendedTimeoutMs: 45000,
  },
  authRedirect: {
    signal: 'url_changed',
    description: 'Router guard has redirected the unauthenticated user to the home page',
    recommendedTimeoutMs: 15000,
  },
  formReady: {
    signal: 'element_visible',
    description: 'Form fields are visible and interactive',
    recommendedTimeoutMs: 30000,
  },
  stepTransition: {
    signal: 'element_visible',
    description: 'Next wizard step heading is visible after form submit',
    recommendedTimeoutMs: 45000,
  },
  complianceDataLoaded: {
    signal: 'element_visible',
    description: 'Compliance status card has rendered with data from API',
    recommendedTimeoutMs: 30000,
  },
};

// ---------------------------------------------------------------------------
// Top-navigation state assertions
// ---------------------------------------------------------------------------

/**
 * Labels that must appear in the navigation for authenticated users.
 */
export const AUTHED_NAV_REQUIRED_LABELS: ReadonlyArray<string> = [
  'Guided Launch',
  'Operations',
];

/**
 * Labels that must appear in the navigation for guest (unauthenticated) users.
 */
export const GUEST_NAV_REQUIRED_LABELS: ReadonlyArray<string> = [
  'Sign in',
];

/**
 * Text patterns that must NEVER appear in the navigation for any user state.
 * These represent wallet/network terminology that contradicts the auth-first model.
 */
export const NAV_FORBIDDEN_PATTERNS: ReadonlyArray<RegExp> = [
  /connect\s+wallet/i,
  /not\s+connected/i,
  /network\s+status/i,
  /wallet\s+address/i,
  /pera\s+wallet/i,
  /defly/i,
  /walletconnect/i,
  /metamask/i,
];

/**
 * Returns violations found in the navigation text content.
 * An empty array means the nav text is clean.
 */
export function findNavForbiddenPatterns(navText: string): string[] {
  return NAV_FORBIDDEN_PATTERNS
    .filter((pattern) => pattern.test(navText))
    .map((pattern) => `Forbidden pattern found: ${pattern}`);
}

/**
 * Checks that the navigation contains all required labels for a given auth state.
 * Returns missing labels (empty array = all present).
 */
export function findMissingNavLabels(
  navText: string,
  authState: 'guest' | 'authenticated',
): string[] {
  const required =
    authState === 'authenticated' ? AUTHED_NAV_REQUIRED_LABELS : GUEST_NAV_REQUIRED_LABELS;
  return required.filter((label) => !navText.includes(label));
}

// ---------------------------------------------------------------------------
// Regression detectors
// ---------------------------------------------------------------------------

/**
 * Patterns that indicate localStorage-seeding anti-patterns in test code.
 * These should be replaced with structured session bootstrap helpers.
 * Matches: localStorage.setItem('algorand_user', '<any raw string literal>')
 */
export const LOCALSTORAGE_SEEDING_ANTI_PATTERNS: ReadonlyArray<RegExp> = [
  /localStorage\.setItem\(['"]algorand_user['"],\s*'[^)]+'\)/,
  /localStorage\.setItem\(['"]algorand_user['"],\s*`[^)]+`\)/,
  /localStorage\.setItem\(['"]algorand_user['"],\s*"[^)]+"\)/,
];

/**
 * Returns true if the provided test source code contains localStorage-seeding
 * anti-patterns that should be replaced with structured session bootstrapping.
 */
export function containsLocalStorageAntiPattern(testSource: string): boolean {
  return LOCALSTORAGE_SEEDING_ANTI_PATTERNS.some((pattern) => pattern.test(testSource));
}

/**
 * Patterns that indicate arbitrary timeout usage in E2E tests.
 * These should be replaced with semantic readiness assertions.
 */
export const ARBITRARY_TIMEOUT_PATTERNS: ReadonlyArray<RegExp> = [
  /waitForTimeout\(\d+\)/,
  /page\.waitForTimeout\(/,
];

/**
 * Returns true if the provided test source code contains arbitrary timeout patterns
 * that should be replaced with semantic readiness assertions.
 */
export function containsArbitraryTimeout(testSource: string): boolean {
  return ARBITRARY_TIMEOUT_PATTERNS.some((pattern) => pattern.test(testSource));
}

/**
 * Counts the number of arbitrary timeout calls in the provided test source.
 */
export function countArbitraryTimeouts(testSource: string): number {
  const matches = testSource.match(/waitForTimeout\(\d+\)/g);
  return matches ? matches.length : 0;
}

/**
 * Counts the number of `test.skip` calls in the provided test source.
 * CI-only skips are a regression risk — all skips should be investigated.
 */
export function countTestSkips(testSource: string): number {
  const matches = testSource.match(/test\.skip\s*\(/g);
  return matches ? matches.length : 0;
}

/**
 * Returns true if the provided source contains a reference to the deprecated
 * `/create/wizard` route as a primary navigation target (not as a redirect test).
 *
 * Redirect-test references are allowed; primary target references are not.
 */
export function containsWizardAsCanonical(source: string): boolean {
  // A "canonical" reference means the wizard is navigated to as a destination
  // (not as part of an explicit redirect test).
  // We detect the anti-pattern: href="/create/wizard" or navigateTo('/create/wizard')
  // outside of explicit redirect test contexts.
  const canonicalPatterns = [
    /href=["'`]\/create\/wizard["'`]/,
    /path:\s*["'`]\/create\/wizard["'`]/,
    /navigateTo\s*\(\s*["'`]\/create\/wizard["'`]/,
    /router\.push\s*\(\s*["'`]\/create\/wizard["'`]/,
    /replace\s*\(\s*["'`]\/create\/wizard["'`]/,
  ];
  return canonicalPatterns.some((p) => p.test(source));
}

// ---------------------------------------------------------------------------
// Accessibility readiness
// ---------------------------------------------------------------------------

/**
 * ARIA roles that must be present on specific error and status containers
 * to satisfy WCAG 2.1 AA live region requirements.
 */
export const REQUIRED_ARIA_ROLES = {
  errorContainer: 'alert',
  statusContainer: 'status',
  navigationLandmark: 'navigation',
  mainLandmark: 'main',
} as const;

/**
 * Returns true if the given HTML string contains an element with the expected
 * ARIA role for an error container.
 */
export function hasErrorAlertRole(html: string): boolean {
  return /role=["']alert["']/.test(html);
}

/**
 * Returns true if the given HTML string contains an element with the expected
 * ARIA role for a status container.
 */
export function hasStatusRole(html: string): boolean {
  return /role=["']status["']/.test(html);
}

/**
 * Returns true if the given HTML string contains a `<main>` landmark or an
 * element with role="main".
 */
export function hasMainLandmark(html: string): boolean {
  return /<main[\s>]/.test(html) || /role=["']main["']/.test(html);
}

/**
 * Returns true if the given HTML string contains a `<nav>` landmark or an
 * element with role="navigation".
 */
export function hasNavLandmark(html: string): boolean {
  return /<nav[\s>]/.test(html) || /role=["']navigation["']/.test(html);
}

/**
 * Returns true if the given HTML string contains a skip-to-content link
 * (WCAG 2.4.1 Bypass Blocks).
 */
export function hasSkipToContentLink(html: string): boolean {
  return /href=["']#(main|content|maincontent)["']/.test(html);
}

/**
 * Returns a list of WCAG AA structural violations found in the provided HTML.
 * An empty array means the HTML passes all structural checks.
 */
export function findAccessibilityViolations(html: string): string[] {
  const violations: string[] = [];
  if (!hasMainLandmark(html)) violations.push('Missing <main> landmark');
  if (!hasNavLandmark(html)) violations.push('Missing <nav> landmark');
  return violations;
}

// ---------------------------------------------------------------------------
// Confidence observability
// ---------------------------------------------------------------------------

/**
 * A hardening metrics snapshot describing the current state of test quality.
 */
export interface HardeningMetrics {
  /** Total number of arbitrary waitForTimeout() calls detected */
  arbitraryTimeouts: number;
  /** Total number of test.skip() calls detected */
  testSkips: number;
  /** Total number of deprecated route violations detected */
  deprecatedRouteViolations: number;
  /** Total number of localStorage seeding anti-patterns detected */
  localStorageSeedingViolations: number;
  /** Whether the metrics represent a fully hardened suite (all zeroes) */
  isFullyHardened: boolean;
}

/**
 * Computes a hardening metrics snapshot from the provided test sources.
 */
export function computeHardeningMetrics(sources: string[]): HardeningMetrics {
  const combined = sources.join('\n');

  const arbitraryTimeouts = countArbitraryTimeouts(combined);
  const testSkips = countTestSkips(combined);
  const deprecatedRouteViolations = findDeprecatedRouteViolations(combined).length;
  const localStorageSeedingViolations = sources.filter(containsLocalStorageAntiPattern).length;

  return {
    arbitraryTimeouts,
    testSkips,
    deprecatedRouteViolations,
    localStorageSeedingViolations,
    isFullyHardened:
      arbitraryTimeouts === 0 &&
      testSkips === 0 &&
      deprecatedRouteViolations === 0 &&
      localStorageSeedingViolations === 0,
  };
}

/**
 * Returns a human-readable summary string of the hardening metrics.
 * Use in test output and PR evidence artifacts.
 */
export function formatHardeningMetrics(metrics: HardeningMetrics): string {
  const lines = [
    `Hardening Metrics:`,
    `  Arbitrary timeouts: ${metrics.arbitraryTimeouts}`,
    `  Test skips (CI): ${metrics.testSkips}`,
    `  Deprecated route violations: ${metrics.deprecatedRouteViolations}`,
    `  localStorage seeding violations: ${metrics.localStorageSeedingViolations}`,
    `  Status: ${metrics.isFullyHardened ? '✅ Fully hardened' : '⚠️  Hardening incomplete'}`,
  ];
  return lines.join('\n');
}
