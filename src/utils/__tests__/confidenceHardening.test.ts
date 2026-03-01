/**
 * Unit Tests: Confidence Hardening Utility
 *
 * Validates all helpers in src/utils/confidenceHardening.ts:
 *   AC #1  Route canonicalization helpers classify and map paths correctly
 *   AC #2  Session validation rejects malformed data and accepts valid data
 *   AC #3  Session builders produce contract-compliant fixtures
 *   AC #4  Message quality validator enforces what/why/how structure
 *   AC #5  Deterministic wait helpers produce correct descriptors
 *   AC #6  Nav state assertions detect forbidden patterns and missing labels
 *   AC #7  Regression detectors catch anti-patterns in test source
 *   AC #8  Accessibility helpers detect WCAG AA violations
 *   AC #9  Confidence observability metrics are correctly computed
 *   AC #10 All helpers are pure (deterministic, side-effect-free where noted)
 *
 * Zero waitForTimeout, zero async I/O. All tests are synchronous.
 *
 * Issue: Next MVP — frontend confidence hardening for auth-first deterministic flows
 */

import { describe, it, expect } from 'vitest';
import {
  // Route canonicalization
  CANONICAL_TOKEN_CREATION_ROUTE,
  LEGACY_WIZARD_ROUTE,
  CANONICAL_OPERATIONS_ROUTE,
  CANONICAL_COMPLIANCE_ROUTE,
  DEPRECATED_ROUTES,
  isDeprecatedRoute,
  getCanonicalRedirectFor,
  isCanonicalTokenCreationRoute,
  findDeprecatedRouteViolations,
  // Auth session
  AUTH_SESSION_KEY,
  validateHardenedSession,
  buildHardenedSession,
  buildExpiredHardenedSession,
  isLiveSession,
  readAndValidateHardenedSession,
  // Message quality
  CONFIDENCE_MESSAGES,
  validateMessageQuality,
  type WhatWhyHow,
  // Deterministic wait helpers
  DESKTOP_VIEWPORT_MIN_WIDTH,
  READINESS_ANCHORS,
  isSemanticTimeout,
  STANDARD_READINESS_DESCRIPTORS,
  // Nav state assertions
  AUTHED_NAV_REQUIRED_LABELS,
  GUEST_NAV_REQUIRED_LABELS,
  NAV_FORBIDDEN_PATTERNS,
  findNavForbiddenPatterns,
  findMissingNavLabels,
  // Regression detectors
  LOCALSTORAGE_SEEDING_ANTI_PATTERNS,
  ARBITRARY_TIMEOUT_PATTERNS,
  containsLocalStorageAntiPattern,
  containsArbitraryTimeout,
  countArbitraryTimeouts,
  countTestSkips,
  containsWizardAsCanonical,
  // Accessibility
  REQUIRED_ARIA_ROLES,
  hasErrorAlertRole,
  hasStatusRole,
  hasMainLandmark,
  hasNavLandmark,
  hasSkipToContentLink,
  findAccessibilityViolations,
  // Observability
  computeHardeningMetrics,
  formatHardeningMetrics,
  type HardeningMetrics,
} from '../confidenceHardening';

// ---------------------------------------------------------------------------
// AC #1: Route canonicalization
// ---------------------------------------------------------------------------

describe('Route canonicalization constants', () => {
  it('CANONICAL_TOKEN_CREATION_ROUTE is /launch/guided', () => {
    expect(CANONICAL_TOKEN_CREATION_ROUTE).toBe('/launch/guided');
  });

  it('LEGACY_WIZARD_ROUTE is /create/wizard', () => {
    expect(LEGACY_WIZARD_ROUTE).toBe('/create/wizard');
  });

  it('CANONICAL_OPERATIONS_ROUTE is /operations', () => {
    expect(CANONICAL_OPERATIONS_ROUTE).toBe('/operations');
  });

  it('CANONICAL_COMPLIANCE_ROUTE is /compliance/setup', () => {
    expect(CANONICAL_COMPLIANCE_ROUTE).toBe('/compliance/setup');
  });

  it('DEPRECATED_ROUTES includes /create/wizard', () => {
    expect(DEPRECATED_ROUTES).toContain('/create/wizard');
  });

  it('DEPRECATED_ROUTES includes /create/token', () => {
    expect(DEPRECATED_ROUTES).toContain('/create/token');
  });

  it('DEPRECATED_ROUTES does not include /launch/guided', () => {
    expect(DEPRECATED_ROUTES).not.toContain('/launch/guided');
  });
});

describe('isDeprecatedRoute()', () => {
  it('returns true for /create/wizard', () => {
    expect(isDeprecatedRoute('/create/wizard')).toBe(true);
  });

  it('returns true for /create/token', () => {
    expect(isDeprecatedRoute('/create/token')).toBe(true);
  });

  it('returns false for /launch/guided', () => {
    expect(isDeprecatedRoute('/launch/guided')).toBe(false);
  });

  it('returns false for /operations', () => {
    expect(isDeprecatedRoute('/operations')).toBe(false);
  });

  it('returns false for / (home)', () => {
    expect(isDeprecatedRoute('/')).toBe(false);
  });

  it('strips query string before comparison', () => {
    expect(isDeprecatedRoute('/create/wizard?ref=email')).toBe(true);
  });

  it('strips trailing slash before comparison', () => {
    expect(isDeprecatedRoute('/create/wizard/')).toBe(true);
  });
});

describe('getCanonicalRedirectFor()', () => {
  it('maps /create/wizard to /launch/guided', () => {
    expect(getCanonicalRedirectFor('/create/wizard')).toBe('/launch/guided');
  });

  it('maps /create/wizard/step-1 to /launch/guided', () => {
    expect(getCanonicalRedirectFor('/create/wizard/step-1')).toBe('/launch/guided');
  });

  it('maps /create/token to /launch/guided', () => {
    expect(getCanonicalRedirectFor('/create/token')).toBe('/launch/guided');
  });

  it('returns null for a non-deprecated path', () => {
    expect(getCanonicalRedirectFor('/launch/guided')).toBeNull();
  });

  it('returns null for /operations', () => {
    expect(getCanonicalRedirectFor('/operations')).toBeNull();
  });
});

describe('isCanonicalTokenCreationRoute()', () => {
  it('returns true for /launch/guided', () => {
    expect(isCanonicalTokenCreationRoute('/launch/guided')).toBe(true);
  });

  it('returns false for /create/wizard', () => {
    expect(isCanonicalTokenCreationRoute('/create/wizard')).toBe(false);
  });

  it('strips query string before comparison', () => {
    expect(isCanonicalTokenCreationRoute('/launch/guided?step=2')).toBe(true);
  });

  it('returns false for /launch', () => {
    expect(isCanonicalTokenCreationRoute('/launch')).toBe(false);
  });
});

describe('findDeprecatedRouteViolations()', () => {
  it('returns empty array for a clean URL', () => {
    expect(findDeprecatedRouteViolations('/launch/guided')).toEqual([]);
  });

  it('detects /create/wizard in a URL', () => {
    const violations = findDeprecatedRouteViolations('http://localhost/create/wizard');
    expect(violations).toContain('/create/wizard');
  });

  it('detects /create/token in a URL', () => {
    const violations = findDeprecatedRouteViolations('http://localhost/create/token');
    expect(violations).toContain('/create/token');
  });

  it('returns multiple violations when multiple deprecated routes appear', () => {
    const violations = findDeprecatedRouteViolations('/create/wizard and /create/token');
    expect(violations.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// AC #2 & #3: Auth session realism
// ---------------------------------------------------------------------------

describe('AUTH_SESSION_KEY', () => {
  it('equals algorand_user', () => {
    expect(AUTH_SESSION_KEY).toBe('algorand_user');
  });
});

describe('validateHardenedSession()', () => {
  it('returns valid for a complete session', () => {
    const result = validateHardenedSession({
      address: 'ADDR123',
      email: 'test@example.com',
      isConnected: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.session).not.toBeNull();
  });

  it('returns invalid for null', () => {
    const result = validateHardenedSession(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns invalid for undefined', () => {
    const result = validateHardenedSession(undefined);
    expect(result.valid).toBe(false);
  });

  it('returns invalid when address is missing', () => {
    const result = validateHardenedSession({ email: 'test@e.com', isConnected: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('address'))).toBe(true);
  });

  it('returns invalid when email is missing', () => {
    const result = validateHardenedSession({ address: 'ADDR', isConnected: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('email'))).toBe(true);
  });

  it('returns invalid when isConnected is not a boolean', () => {
    const result = validateHardenedSession({
      address: 'ADDR',
      email: 'e@e.com',
      isConnected: 'true',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('isConnected'))).toBe(true);
  });

  it('returns invalid when address is an empty string', () => {
    const result = validateHardenedSession({ address: '', email: 'e@e.com', isConnected: true });
    expect(result.valid).toBe(false);
  });

  it('populates session field when valid', () => {
    const result = validateHardenedSession({ address: 'A', email: 'e@e.com', isConnected: false });
    expect(result.session).toMatchObject({ address: 'A', email: 'e@e.com', isConnected: false });
  });
});

describe('buildHardenedSession()', () => {
  it('returns a valid session by default', () => {
    const session = buildHardenedSession();
    const validation = validateHardenedSession(session);
    expect(validation.valid).toBe(true);
  });

  it('has isConnected: true by default', () => {
    expect(buildHardenedSession().isConnected).toBe(true);
  });

  it('applies overrides', () => {
    const session = buildHardenedSession({ email: 'custom@example.com' });
    expect(session.email).toBe('custom@example.com');
  });

  it('is deterministic', () => {
    expect(buildHardenedSession()).toEqual(buildHardenedSession());
  });
});

describe('buildExpiredHardenedSession()', () => {
  it('has isConnected: false', () => {
    expect(buildExpiredHardenedSession().isConnected).toBe(false);
  });

  it('still has valid address and email', () => {
    const session = buildExpiredHardenedSession();
    expect(session.address).toBeTruthy();
    expect(session.email).toBeTruthy();
  });

  it('applies overrides on top of expired defaults', () => {
    const session = buildExpiredHardenedSession({ address: 'CUSTOM' });
    expect(session.address).toBe('CUSTOM');
    expect(session.isConnected).toBe(false);
  });
});

describe('isLiveSession()', () => {
  it('returns true for a valid connected session', () => {
    expect(isLiveSession({ address: 'A', email: 'e@e.com', isConnected: true })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isLiveSession(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isLiveSession(undefined)).toBe(false);
  });

  it('returns false when isConnected is false', () => {
    expect(isLiveSession({ address: 'A', email: 'e@e.com', isConnected: false })).toBe(false);
  });

  it('returns false when address is empty', () => {
    expect(isLiveSession({ address: '', email: 'e@e.com', isConnected: true })).toBe(false);
  });

  it('returns false when email is empty', () => {
    expect(isLiveSession({ address: 'A', email: '', isConnected: true })).toBe(false);
  });
});

describe('readAndValidateHardenedSession()', () => {
  it('returns invalid for null input', () => {
    const result = readAndValidateHardenedSession(null);
    expect(result.valid).toBe(false);
  });

  it('returns invalid for non-JSON string', () => {
    const result = readAndValidateHardenedSession('not-json{');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('JSON'))).toBe(true);
  });

  it('returns valid for a valid JSON session string', () => {
    const session = buildHardenedSession();
    const result = readAndValidateHardenedSession(JSON.stringify(session));
    expect(result.valid).toBe(true);
    expect(result.session).toMatchObject(session);
  });

  it('returns invalid for a JSON object missing fields', () => {
    const result = readAndValidateHardenedSession(JSON.stringify({ address: 'A' }));
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #4: Message quality
// ---------------------------------------------------------------------------

describe('validateMessageQuality()', () => {
  it('passes for a complete, clean what/why/how message', () => {
    const msg: WhatWhyHow = {
      what: 'Sign in to continue',
      why: 'This step requires a verified account.',
      how: 'Use your email and password to sign in.',
    };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('fails when what is empty', () => {
    const msg: WhatWhyHow = { what: '', why: 'reason', how: 'action' };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('what'))).toBe(true);
  });

  it('fails when why is empty', () => {
    const msg: WhatWhyHow = { what: 'thing', why: '', how: 'action' };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('why'))).toBe(true);
  });

  it('fails when how is empty', () => {
    const msg: WhatWhyHow = { what: 'thing', why: 'reason', how: '' };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('how'))).toBe(true);
  });

  it('fails when what exceeds 80 chars', () => {
    const what = 'A'.repeat(81);
    const result = validateMessageQuality({ what, why: 'r', how: 'a' });
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("'what' exceeds 80 chars"))).toBe(true);
  });

  it('fails when why exceeds 120 chars', () => {
    const why = 'B'.repeat(121);
    const result = validateMessageQuality({ what: 'w', why, how: 'a' });
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("'why' exceeds 120 chars"))).toBe(true);
  });

  it('fails when how exceeds 100 chars', () => {
    const how = 'C'.repeat(101);
    const result = validateMessageQuality({ what: 'w', why: 'r', how });
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("'how' exceeds 100 chars"))).toBe(true);
  });

  it('fails when message contains "wallet" jargon', () => {
    const msg: WhatWhyHow = { what: 'Connect your wallet', why: 'reason', how: 'action' };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('jargon'))).toBe(true);
  });

  it('fails when message contains "blockchain" jargon', () => {
    const msg: WhatWhyHow = {
      what: 'Blockchain error',
      why: 'reason',
      how: 'action',
    };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(false);
  });

  it('fails when message contains "private key" jargon', () => {
    const msg: WhatWhyHow = {
      what: 'thing',
      why: 'reason',
      how: 'Enter your private key to sign',
    };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(false);
  });

  it('fails when message contains "Pera Wallet" jargon', () => {
    const msg: WhatWhyHow = {
      what: 'Open Pera Wallet to sign',
      why: 'reason',
      how: 'action',
    };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(false);
  });
});

describe('CONFIDENCE_MESSAGES catalogue', () => {
  const messageKeys = Object.keys(CONFIDENCE_MESSAGES) as Array<keyof typeof CONFIDENCE_MESSAGES>;

  messageKeys.forEach((key) => {
    it(`CONFIDENCE_MESSAGES.${key} passes quality validation`, () => {
      const result = validateMessageQuality(CONFIDENCE_MESSAGES[key]);
      expect(result.valid).toBe(true);
    });
  });

  it('authRequired message exists and is non-empty', () => {
    expect(CONFIDENCE_MESSAGES.authRequired.what).toBeTruthy();
    expect(CONFIDENCE_MESSAGES.authRequired.why).toBeTruthy();
    expect(CONFIDENCE_MESSAGES.authRequired.how).toBeTruthy();
  });

  it('sessionExpired message exists and is non-empty', () => {
    expect(CONFIDENCE_MESSAGES.sessionExpired.what).toBeTruthy();
  });

  it('legacyRouteRedirected message exists and is non-empty', () => {
    expect(CONFIDENCE_MESSAGES.legacyRouteRedirected.what).toBeTruthy();
  });

  it('complianceIncomplete message exists and is non-empty', () => {
    expect(CONFIDENCE_MESSAGES.complianceIncomplete.what).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AC #5: Deterministic wait helpers
// ---------------------------------------------------------------------------

describe('DESKTOP_VIEWPORT_MIN_WIDTH', () => {
  it('is 1024', () => {
    expect(DESKTOP_VIEWPORT_MIN_WIDTH).toBe(1024);
  });
});

describe('READINESS_ANCHORS', () => {
  it('has a pageHeading anchor', () => {
    expect(READINESS_ANCHORS.pageHeading).toBeTruthy();
  });

  it('has a navbar anchor', () => {
    expect(READINESS_ANCHORS.navbar).toBeTruthy();
  });

  it('has a guidedLaunchStep anchor', () => {
    expect(READINESS_ANCHORS.guidedLaunchStep).toBeTruthy();
  });

  it('has an errorAlert anchor', () => {
    expect(READINESS_ANCHORS.errorAlert).toBeTruthy();
  });
});

describe('isSemanticTimeout()', () => {
  it('returns true for 5000 (minimum boundary)', () => {
    expect(isSemanticTimeout(5000)).toBe(true);
  });

  it('returns true for 15000 (typical CI timeout)', () => {
    expect(isSemanticTimeout(15000)).toBe(true);
  });

  it('returns true for 45000 (auth-required route timeout)', () => {
    expect(isSemanticTimeout(45000)).toBe(true);
  });

  it('returns true for 60000 (maximum boundary)', () => {
    expect(isSemanticTimeout(60000)).toBe(true);
  });

  it('returns false for 1000 (too small — arbitrary)', () => {
    expect(isSemanticTimeout(1000)).toBe(false);
  });

  it('returns false for 3000 (below minimum — likely arbitrary)', () => {
    expect(isSemanticTimeout(3000)).toBe(false);
  });

  it('returns false for 90000 (above maximum — excessively long)', () => {
    expect(isSemanticTimeout(90000)).toBe(false);
  });
});

describe('STANDARD_READINESS_DESCRIPTORS', () => {
  it('has a pageLoad descriptor', () => {
    expect(STANDARD_READINESS_DESCRIPTORS.pageLoad).toBeTruthy();
    expect(STANDARD_READINESS_DESCRIPTORS.pageLoad.signal).toBe('network_idle');
  });

  it('has an authRouteReady descriptor with long timeout', () => {
    expect(STANDARD_READINESS_DESCRIPTORS.authRouteReady.recommendedTimeoutMs).toBeGreaterThanOrEqual(30000);
  });

  it('has a stepTransition descriptor', () => {
    expect(STANDARD_READINESS_DESCRIPTORS.stepTransition).toBeTruthy();
    expect(STANDARD_READINESS_DESCRIPTORS.stepTransition.signal).toBe('element_visible');
  });

  it('all descriptors have non-empty descriptions', () => {
    Object.entries(STANDARD_READINESS_DESCRIPTORS).forEach(([key, descriptor]) => {
      expect(descriptor.description, `Descriptor ${key} must have a description`).toBeTruthy();
    });
  });

  it('all descriptors have semantic timeouts', () => {
    Object.entries(STANDARD_READINESS_DESCRIPTORS).forEach(([key, descriptor]) => {
      expect(
        isSemanticTimeout(descriptor.recommendedTimeoutMs),
        `Descriptor ${key} timeout ${descriptor.recommendedTimeoutMs}ms must be semantic`,
      ).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// AC #6: Nav state assertions
// ---------------------------------------------------------------------------

describe('AUTHED_NAV_REQUIRED_LABELS', () => {
  it('contains Guided Launch', () => {
    expect(AUTHED_NAV_REQUIRED_LABELS).toContain('Guided Launch');
  });

  it('contains Operations', () => {
    expect(AUTHED_NAV_REQUIRED_LABELS).toContain('Operations');
  });
});

describe('GUEST_NAV_REQUIRED_LABELS', () => {
  it('contains Sign in', () => {
    expect(GUEST_NAV_REQUIRED_LABELS).toContain('Sign in');
  });
});

describe('findNavForbiddenPatterns()', () => {
  it('returns empty array for clean nav text', () => {
    const violations = findNavForbiddenPatterns('Guided Launch | Compliance | Sign in');
    expect(violations).toHaveLength(0);
  });

  it('detects "connect wallet"', () => {
    const violations = findNavForbiddenPatterns('Connect Wallet');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('detects "Not connected"', () => {
    const violations = findNavForbiddenPatterns('Not connected to Algorand');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('detects WalletConnect (case-insensitive)', () => {
    const violations = findNavForbiddenPatterns('WalletConnect integration available');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('detects MetaMask', () => {
    const violations = findNavForbiddenPatterns('Use MetaMask');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('detects wallet address leak', () => {
    const violations = findNavForbiddenPatterns('Wallet address: ADDR123');
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe('findMissingNavLabels()', () => {
  it('returns empty for guest nav containing Sign in', () => {
    expect(findMissingNavLabels('Sign in | Home', 'guest')).toHaveLength(0);
  });

  it('returns ["Sign in"] when missing from guest nav', () => {
    expect(findMissingNavLabels('Home | Pricing', 'guest')).toContain('Sign in');
  });

  it('returns empty for authenticated nav containing all required labels', () => {
    const navText = 'Guided Launch | Operations | Settings';
    expect(findMissingNavLabels(navText, 'authenticated')).toHaveLength(0);
  });

  it('returns missing labels for authenticated nav', () => {
    const missing = findMissingNavLabels('Home | Settings', 'authenticated');
    expect(missing).toContain('Guided Launch');
    expect(missing).toContain('Operations');
  });
});

// ---------------------------------------------------------------------------
// AC #7: Regression detectors
// ---------------------------------------------------------------------------

describe('containsLocalStorageAntiPattern()', () => {
  it('returns false for clean session bootstrap code', () => {
    const src = `await page.addInitScript((s) => { localStorage.setItem('algorand_user', JSON.stringify(s)) }, session)`;
    expect(containsLocalStorageAntiPattern(src)).toBe(false);
  });

  it('returns true for raw single-quoted string setItem anti-pattern', () => {
    const src = `localStorage.setItem('algorand_user', '{"address":"A","email":"e@e.com","isConnected":true}')`;
    expect(containsLocalStorageAntiPattern(src)).toBe(true);
  });

  it('returns true for raw double-quoted string setItem anti-pattern', () => {
    const src = `localStorage.setItem("algorand_user", "some-json-value")`;
    expect(containsLocalStorageAntiPattern(src)).toBe(true);
  });
});

describe('containsArbitraryTimeout()', () => {
  it('returns false for clean code without waitForTimeout', () => {
    const src = `await expect(heading).toBeVisible({ timeout: 15000 })`;
    expect(containsArbitraryTimeout(src)).toBe(false);
  });

  it('returns true for waitForTimeout(1000)', () => {
    const src = `await page.waitForTimeout(1000)`;
    expect(containsArbitraryTimeout(src)).toBe(true);
  });

  it('returns true for waitForTimeout(5000)', () => {
    const src = `await page.waitForTimeout(5000)`;
    expect(containsArbitraryTimeout(src)).toBe(true);
  });
});

describe('countArbitraryTimeouts()', () => {
  it('returns 0 for clean code', () => {
    expect(countArbitraryTimeouts('await expect(x).toBeVisible()')).toBe(0);
  });

  it('counts individual calls', () => {
    const src = `
      await page.waitForTimeout(1000)
      await page.waitForTimeout(2000)
      await page.waitForTimeout(3000)
    `;
    expect(countArbitraryTimeouts(src)).toBe(3);
  });
});

describe('countTestSkips()', () => {
  it('returns 0 when no test.skip exists', () => {
    expect(countTestSkips('test("name", async () => {})')).toBe(0);
  });

  it('counts test.skip calls', () => {
    const src = `
      test.skip(!!process.env.CI, 'reason 1')
      test.skip(!!process.env.CI, 'reason 2')
    `;
    expect(countTestSkips(src)).toBe(2);
  });
});

describe('containsWizardAsCanonical()', () => {
  it('returns false for clean code without wizard references', () => {
    expect(containsWizardAsCanonical('navigate("/launch/guided")')).toBe(false);
  });

  it('returns true for href to /create/wizard', () => {
    expect(containsWizardAsCanonical('<a href="/create/wizard">Start</a>')).toBe(true);
  });

  it('returns true for router.push to /create/wizard', () => {
    expect(containsWizardAsCanonical("router.push('/create/wizard')")).toBe(true);
  });

  it('returns false for redirect test that uses /create/wizard as a goto target', () => {
    // goto is allowed in redirect tests — not in the forbidden patterns
    const redirectTestSrc = `await page.goto('/create/wizard')`;
    expect(containsWizardAsCanonical(redirectTestSrc)).toBe(false);
  });

  it('returns true for path: "/create/wizard" in route definition', () => {
    expect(containsWizardAsCanonical("path: '/create/wizard'")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #8: Accessibility helpers
// ---------------------------------------------------------------------------

describe('hasErrorAlertRole()', () => {
  it('returns true for role="alert"', () => {
    expect(hasErrorAlertRole('<div role="alert">Error message</div>')).toBe(true);
  });

  it('returns true for role=\'alert\' (single quotes)', () => {
    expect(hasErrorAlertRole("<div role='alert'>Error</div>")).toBe(true);
  });

  it('returns false when role="alert" is absent', () => {
    expect(hasErrorAlertRole('<div class="error">No role</div>')).toBe(false);
  });
});

describe('hasStatusRole()', () => {
  it('returns true for role="status"', () => {
    expect(hasStatusRole('<div role="status">Loading...</div>')).toBe(true);
  });

  it('returns false when absent', () => {
    expect(hasStatusRole('<div>No status</div>')).toBe(false);
  });
});

describe('hasMainLandmark()', () => {
  it('returns true for <main> element', () => {
    expect(hasMainLandmark('<main><h1>Title</h1></main>')).toBe(true);
  });

  it('returns true for role="main"', () => {
    expect(hasMainLandmark('<div role="main">Content</div>')).toBe(true);
  });

  it('returns false when absent', () => {
    expect(hasMainLandmark('<div>No main</div>')).toBe(false);
  });
});

describe('hasNavLandmark()', () => {
  it('returns true for <nav> element', () => {
    expect(hasNavLandmark('<nav><ul><li>Home</li></ul></nav>')).toBe(true);
  });

  it('returns true for role="navigation"', () => {
    expect(hasNavLandmark('<div role="navigation">Nav</div>')).toBe(true);
  });

  it('returns false when absent', () => {
    expect(hasNavLandmark('<div>No nav</div>')).toBe(false);
  });
});

describe('hasSkipToContentLink()', () => {
  it('returns true for href="#main"', () => {
    expect(hasSkipToContentLink('<a href="#main">Skip</a>')).toBe(true);
  });

  it('returns true for href="#content"', () => {
    expect(hasSkipToContentLink('<a href="#content">Skip</a>')).toBe(true);
  });

  it('returns true for href="#maincontent"', () => {
    expect(hasSkipToContentLink('<a href="#maincontent">Skip</a>')).toBe(true);
  });

  it('returns true for href="#main-content" (canonical Navbar pattern)', () => {
    expect(hasSkipToContentLink('<a href="#main-content">Skip to main content</a>')).toBe(true);
  });

  it('returns false when absent', () => {
    expect(hasSkipToContentLink('<div>No skip link</div>')).toBe(false);
  });
});

describe('findAccessibilityViolations()', () => {
  it('returns empty array for fully accessible HTML', () => {
    const html = '<nav><ul><li>Home</li></ul></nav><main><h1>Title</h1></main>';
    expect(findAccessibilityViolations(html)).toHaveLength(0);
  });

  it('reports missing <main> landmark', () => {
    const html = '<nav><ul></ul></nav><div>Content</div>';
    const violations = findAccessibilityViolations(html);
    expect(violations).toContain('Missing <main> landmark');
  });

  it('reports missing <nav> landmark', () => {
    const html = '<main><h1>Title</h1></main>';
    const violations = findAccessibilityViolations(html);
    expect(violations).toContain('Missing <nav> landmark');
  });

  it('reports both violations when both are missing', () => {
    const html = '<div>No landmarks</div>';
    const violations = findAccessibilityViolations(html);
    expect(violations.length).toBe(2);
  });
});

describe('REQUIRED_ARIA_ROLES', () => {
  it('specifies alert for errorContainer', () => {
    expect(REQUIRED_ARIA_ROLES.errorContainer).toBe('alert');
  });

  it('specifies status for statusContainer', () => {
    expect(REQUIRED_ARIA_ROLES.statusContainer).toBe('status');
  });
});

// ---------------------------------------------------------------------------
// AC #9: Confidence observability
// ---------------------------------------------------------------------------

describe('computeHardeningMetrics()', () => {
  it('returns all-zero metrics for fully hardened sources', () => {
    const sources = [
      'await expect(heading).toBeVisible({ timeout: 15000 })',
      'const session = buildHardenedSession()',
    ];
    const metrics = computeHardeningMetrics(sources);
    expect(metrics.arbitraryTimeouts).toBe(0);
    expect(metrics.testSkips).toBe(0);
    expect(metrics.deprecatedRouteViolations).toBe(0);
    expect(metrics.localStorageSeedingViolations).toBe(0);
    expect(metrics.isFullyHardened).toBe(true);
  });

  it('counts arbitrary timeouts across sources', () => {
    const sources = [
      'await page.waitForTimeout(1000)',
      'await page.waitForTimeout(2000)',
    ];
    const metrics = computeHardeningMetrics(sources);
    expect(metrics.arbitraryTimeouts).toBe(2);
    expect(metrics.isFullyHardened).toBe(false);
  });

  it('counts test skips', () => {
    const sources = [
      "test.skip(!!process.env.CI, 'reason')",
    ];
    const metrics = computeHardeningMetrics(sources);
    expect(metrics.testSkips).toBe(1);
    expect(metrics.isFullyHardened).toBe(false);
  });

  it('counts deprecated route violations', () => {
    const sources = [
      'navigate to /create/wizard page',
    ];
    const metrics = computeHardeningMetrics(sources);
    expect(metrics.deprecatedRouteViolations).toBeGreaterThan(0);
    expect(metrics.isFullyHardened).toBe(false);
  });

  it('counts localStorage seeding violations per source file', () => {
    const sources = [
      `localStorage.setItem('algorand_user', '{"address":"A","email":"e@e.com","isConnected":true}')`,
      `localStorage.setItem("algorand_user", "some-value-here")`,
    ];
    const metrics = computeHardeningMetrics(sources);
    expect(metrics.localStorageSeedingViolations).toBe(2);
    expect(metrics.isFullyHardened).toBe(false);
  });
});

describe('formatHardeningMetrics()', () => {
  it('returns a string containing all metric fields', () => {
    const metrics: HardeningMetrics = {
      arbitraryTimeouts: 5,
      testSkips: 2,
      deprecatedRouteViolations: 1,
      localStorageSeedingViolations: 3,
      isFullyHardened: false,
    };
    const formatted = formatHardeningMetrics(metrics);
    expect(formatted).toContain('Arbitrary timeouts: 5');
    expect(formatted).toContain('Test skips (CI): 2');
    expect(formatted).toContain('Deprecated route violations: 1');
    expect(formatted).toContain('localStorage seeding violations: 3');
    expect(formatted).toContain('Hardening incomplete');
  });

  it('marks fully hardened metrics as ✅', () => {
    const metrics: HardeningMetrics = {
      arbitraryTimeouts: 0,
      testSkips: 0,
      deprecatedRouteViolations: 0,
      localStorageSeedingViolations: 0,
      isFullyHardened: true,
    };
    const formatted = formatHardeningMetrics(metrics);
    expect(formatted).toContain('Fully hardened');
  });
});

// ---------------------------------------------------------------------------
// AC #10: Purity / determinism
// ---------------------------------------------------------------------------

describe('Determinism: helpers produce identical output for identical input', () => {
  it('buildHardenedSession() is deterministic', () => {
    const a = buildHardenedSession({ email: 'same@example.com' });
    const b = buildHardenedSession({ email: 'same@example.com' });
    expect(a).toEqual(b);
  });

  it('validateHardenedSession() is deterministic', () => {
    const input = { address: 'A', email: 'e@e.com', isConnected: true };
    expect(validateHardenedSession(input)).toEqual(validateHardenedSession(input));
  });

  it('isDeprecatedRoute() is deterministic', () => {
    expect(isDeprecatedRoute('/create/wizard')).toBe(isDeprecatedRoute('/create/wizard'));
  });

  it('findNavForbiddenPatterns() is deterministic', () => {
    const navText = 'Connect Wallet | Not connected';
    expect(findNavForbiddenPatterns(navText)).toEqual(findNavForbiddenPatterns(navText));
  });

  it('computeHardeningMetrics() is deterministic for same sources', () => {
    const sources = ['await page.waitForTimeout(1000)', 'clean code'];
    expect(computeHardeningMetrics(sources)).toEqual(computeHardeningMetrics(sources));
  });
});

// ---------------------------------------------------------------------------
// Additional edge-case coverage — route canonicalization
// ---------------------------------------------------------------------------

describe('Route canonicalization — edge cases and boundary conditions', () => {
  it('isDeprecatedRoute() returns false for empty string', () => {
    expect(isDeprecatedRoute('')).toBe(false);
  });

  it('isDeprecatedRoute() returns false for unrelated route with wizard substring elsewhere', () => {
    // /wizard alone is not in DEPRECATED_ROUTES
    expect(isDeprecatedRoute('/wizard')).toBe(false);
  });

  it('getCanonicalRedirectFor() returns null for /', () => {
    expect(getCanonicalRedirectFor('/')).toBeNull();
  });

  it('getCanonicalRedirectFor() returns null for /compliance/setup', () => {
    expect(getCanonicalRedirectFor('/compliance/setup')).toBeNull();
  });

  it('findDeprecatedRouteViolations() returns empty for URL with only /launch', () => {
    expect(findDeprecatedRouteViolations('/launch')).toHaveLength(0);
  });

  it('findDeprecatedRouteViolations() is case-sensitive for deprecated paths', () => {
    // Paths are case-sensitive in URLs — /Create/Wizard is NOT the deprecated path
    expect(findDeprecatedRouteViolations('/Create/Wizard')).toHaveLength(0);
  });

  it('CANONICAL_TOKEN_CREATION_ROUTE starts with /', () => {
    expect(CANONICAL_TOKEN_CREATION_ROUTE.startsWith('/')).toBe(true);
  });

  it('LEGACY_WIZARD_ROUTE starts with /', () => {
    expect(LEGACY_WIZARD_ROUTE.startsWith('/')).toBe(true);
  });

  it('DEPRECATED_ROUTES is a readonly array with at least one entry', () => {
    expect(DEPRECATED_ROUTES.length).toBeGreaterThan(0);
  });

  it('isCanonicalTokenCreationRoute() returns false for sub-path of canonical route', () => {
    // /launch/guided/step-1 is NOT the canonical route itself
    expect(isCanonicalTokenCreationRoute('/launch/guided/step-1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Additional edge-case coverage — session validation
// ---------------------------------------------------------------------------

describe('Session validation — edge cases and boundary conditions', () => {
  it('validateHardenedSession() rejects a string value', () => {
    const result = validateHardenedSession('not-an-object');
    expect(result.valid).toBe(false);
  });

  it('validateHardenedSession() rejects a number value', () => {
    const result = validateHardenedSession(42);
    expect(result.valid).toBe(false);
  });

  it('validateHardenedSession() rejects an array value', () => {
    const result = validateHardenedSession([]);
    expect(result.valid).toBe(false);
  });

  it('validateHardenedSession() accumulates multiple errors', () => {
    const result = validateHardenedSession({ address: '', email: '' });
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it('validateHardenedSession() accepts isConnected: false as structurally valid', () => {
    const result = validateHardenedSession({ address: 'A', email: 'e@e.com', isConnected: false });
    expect(result.valid).toBe(true);
    expect(result.session?.isConnected).toBe(false);
  });

  it('buildHardenedSession() address is non-empty by default', () => {
    expect(buildHardenedSession().address.trim()).not.toBe('');
  });

  it('buildHardenedSession() email contains @', () => {
    expect(buildHardenedSession().email).toContain('@');
  });

  it('readAndValidateHardenedSession() handles JSON array input gracefully', () => {
    const result = readAndValidateHardenedSession(JSON.stringify([]));
    // Array is not a valid session object
    expect(result.valid).toBe(false);
  });

  it('readAndValidateHardenedSession() handles JSON null gracefully', () => {
    const result = readAndValidateHardenedSession(JSON.stringify(null));
    expect(result.valid).toBe(false);
  });

  it('readAndValidateHardenedSession() returns valid for expired session', () => {
    // Expired session is structurally valid, just not "live"
    const expired = buildExpiredHardenedSession();
    const result = readAndValidateHardenedSession(JSON.stringify(expired));
    expect(result.valid).toBe(true);
    expect(result.session?.isConnected).toBe(false);
    expect(isLiveSession(result.session)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Additional edge-case coverage — message quality
// ---------------------------------------------------------------------------

describe('Message quality — edge cases and boundary conditions', () => {
  it('validateMessageQuality() passes for message exactly at 80/120/100 char limits', () => {
    const msg: WhatWhyHow = {
      what: 'A'.repeat(80),
      why: 'B'.repeat(120),
      how: 'C'.repeat(100),
    };
    const result = validateMessageQuality(msg);
    // Should pass (limits are inclusive)
    expect(result.violations.filter((v) => v.includes('exceeds'))).toHaveLength(0);
  });

  it('validateMessageQuality() does not flag "operational" or "password" as jargon', () => {
    const msg: WhatWhyHow = {
      what: 'Operational check required',
      why: 'Password verification is needed.',
      how: 'Enter your email and password.',
    };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(true);
  });

  it('validateMessageQuality() does not flag "operations" as jargon', () => {
    const msg: WhatWhyHow = {
      what: 'Monitor progress in your operations dashboard',
      why: 'Operations require active monitoring.',
      how: 'Go to the operations view.',
    };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(true);
  });

  it('validateMessageQuality() flags "seed phrase" as jargon', () => {
    const msg: WhatWhyHow = {
      what: 'Enter your seed phrase',
      why: 'Required.',
      how: 'Type it in.',
    };
    const result = validateMessageQuality(msg);
    expect(result.valid).toBe(false);
  });

  it('CONFIDENCE_MESSAGES has at least 4 entries', () => {
    expect(Object.keys(CONFIDENCE_MESSAGES).length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// Additional edge-case coverage — nav assertions
// ---------------------------------------------------------------------------

describe('Nav assertions — edge cases and boundary conditions', () => {
  it('findNavForbiddenPatterns() returns empty for empty string', () => {
    expect(findNavForbiddenPatterns('')).toHaveLength(0);
  });

  it('NAV_FORBIDDEN_PATTERNS contains at least 5 patterns', () => {
    expect(NAV_FORBIDDEN_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it('GUEST_NAV_REQUIRED_LABELS has at least one entry', () => {
    expect(GUEST_NAV_REQUIRED_LABELS.length).toBeGreaterThan(0);
  });

  it('AUTHED_NAV_REQUIRED_LABELS has at least two entries', () => {
    expect(AUTHED_NAV_REQUIRED_LABELS.length).toBeGreaterThanOrEqual(2);
  });

  it('findMissingNavLabels() for empty nav text returns all required labels for guest', () => {
    const missing = findMissingNavLabels('', 'guest');
    expect(missing.length).toBe(GUEST_NAV_REQUIRED_LABELS.length);
  });

  it('findMissingNavLabels() for empty nav text returns all required labels for authenticated', () => {
    const missing = findMissingNavLabels('', 'authenticated');
    expect(missing.length).toBe(AUTHED_NAV_REQUIRED_LABELS.length);
  });
});

// ---------------------------------------------------------------------------
// Additional edge-case coverage — accessibility helpers
// ---------------------------------------------------------------------------

describe('Accessibility helpers — edge cases and boundary conditions', () => {
  it('findAccessibilityViolations() handles empty string input', () => {
    const violations = findAccessibilityViolations('');
    expect(violations.length).toBeGreaterThan(0); // Empty HTML has no landmarks
  });

  it('hasSkipToContentLink() handles empty string', () => {
    expect(hasSkipToContentLink('')).toBe(false);
  });

  it('hasErrorAlertRole() handles empty string', () => {
    expect(hasErrorAlertRole('')).toBe(false);
  });

  it('hasStatusRole() handles empty string', () => {
    expect(hasStatusRole('')).toBe(false);
  });

  it('hasMainLandmark() accepts <main> with attributes', () => {
    expect(hasMainLandmark('<main id="content" class="page">')).toBe(true);
  });

  it('hasNavLandmark() accepts <nav> with attributes', () => {
    expect(hasNavLandmark('<nav id="main-nav" aria-label="Primary">')).toBe(true);
  });

  it('REQUIRED_ARIA_ROLES.navigationLandmark is navigation', () => {
    expect(REQUIRED_ARIA_ROLES.navigationLandmark).toBe('navigation');
  });

  it('REQUIRED_ARIA_ROLES.mainLandmark is main', () => {
    expect(REQUIRED_ARIA_ROLES.mainLandmark).toBe('main');
  });
});

// ---------------------------------------------------------------------------
// Additional edge-case coverage — regression detectors
// ---------------------------------------------------------------------------

describe('Regression detectors — edge cases and boundary conditions', () => {
  it('countArbitraryTimeouts() handles empty string', () => {
    expect(countArbitraryTimeouts('')).toBe(0);
  });

  it('countTestSkips() handles empty string', () => {
    expect(countTestSkips('')).toBe(0);
  });

  it('containsWizardAsCanonical() returns false for empty string', () => {
    expect(containsWizardAsCanonical('')).toBe(false);
  });

  it('containsArbitraryTimeout() returns false for empty string', () => {
    expect(containsArbitraryTimeout('')).toBe(false);
  });

  it('LOCALSTORAGE_SEEDING_ANTI_PATTERNS has at least 2 patterns', () => {
    expect(LOCALSTORAGE_SEEDING_ANTI_PATTERNS.length).toBeGreaterThanOrEqual(2);
  });

  it('ARBITRARY_TIMEOUT_PATTERNS has at least 1 pattern', () => {
    expect(ARBITRARY_TIMEOUT_PATTERNS.length).toBeGreaterThanOrEqual(1);
  });

  it('containsWizardAsCanonical() detects navigateTo() call', () => {
    const src = `navigateTo('/create/wizard')`;
    expect(containsWizardAsCanonical(src)).toBe(true);
  });

  it('containsWizardAsCanonical() detects router.push() call', () => {
    const src = `router.push('/create/wizard')`;
    expect(containsWizardAsCanonical(src)).toBe(true);
  });

  it('containsLocalStorageAntiPattern() returns false for JSON.stringify wrapping', () => {
    const modern = `localStorage.setItem('algorand_user', JSON.stringify(session))`;
    expect(containsLocalStorageAntiPattern(modern)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Additional edge-case coverage — observability
// ---------------------------------------------------------------------------

describe('Confidence observability — edge cases and boundary conditions', () => {
  it('computeHardeningMetrics() returns all-zero for empty sources array', () => {
    const metrics = computeHardeningMetrics([]);
    expect(metrics.arbitraryTimeouts).toBe(0);
    expect(metrics.testSkips).toBe(0);
    expect(metrics.isFullyHardened).toBe(true);
  });

  it('computeHardeningMetrics() handles source with only comments', () => {
    const src = '// This is a comment about wizards and wallets';
    const metrics = computeHardeningMetrics([src]);
    // Comments can still trigger detectors — that is expected behavior
    expect(metrics).toBeDefined();
  });

  it('formatHardeningMetrics() returns a multi-line string', () => {
    const metrics = computeHardeningMetrics([]);
    const formatted = formatHardeningMetrics(metrics);
    expect(formatted.split('\n').length).toBeGreaterThan(3);
  });

  it('HardeningMetrics.isFullyHardened is false if any metric is non-zero', () => {
    const metrics = computeHardeningMetrics(['await page.waitForTimeout(1000)']);
    expect(metrics.isFullyHardened).toBe(false);
  });
});
