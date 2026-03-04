/**
 * Unit Tests: MVP Sign-off Hardening Utility
 *
 * Validates all helpers in src/utils/mvpSignoffHardening.ts.
 *
 * AC #1 — Canonical route policy helpers classify paths correctly.
 * AC #2 — Auth confidence assessment grades session quality accurately.
 * AC #3 — Accessibility baseline validator detects missing landmarks/ARIA issues.
 * AC #4 — Error message quality validator enforces what/why/how structure.
 * AC #5 — Sign-off readiness scoring combines all five dimensions correctly.
 *
 * All tests are synchronous and deterministic. Zero I/O, zero side effects.
 *
 * Issue: MVP hardening — canonical launch flow, backend-verified auth confidence,
 *        and accessibility baseline
 */

import { describe, it, expect } from 'vitest';
import {
  // Route canonicalization
  SIGNOFF_CANONICAL_LAUNCH_ROUTE,
  SIGNOFF_LEGACY_WIZARD_ROUTE,
  SIGNOFF_DEPRECATED_ROUTES,
  isDeprecatedSignoffRoute,
  getCanonicalSignoffRoute,
  auditCanonicalJourneyRoutes,
  containsNonRedirectWizardReference,
  // Auth confidence
  assessAuthSessionConfidence,
  usesCanonicalAuthBootstrap,
  detectRawAuthSeedingPatterns,
  // Accessibility
  WCAG_REQUIRED_LANDMARKS,
  validateAccessibilityBaseline,
  // Error messages
  validateSignoffErrorMessage,
  SIGNOFF_ERROR_MESSAGES,
  // Readiness
  computeSignoffReadiness,
} from '../mvpSignoffHardening';

// ===========================================================================
// AC #1: Canonical route policy helpers
// ===========================================================================

describe('Route constants', () => {
  it('SIGNOFF_CANONICAL_LAUNCH_ROUTE is /launch/guided', () => {
    expect(SIGNOFF_CANONICAL_LAUNCH_ROUTE).toBe('/launch/guided');
  });

  it('SIGNOFF_LEGACY_WIZARD_ROUTE is /create/wizard', () => {
    expect(SIGNOFF_LEGACY_WIZARD_ROUTE).toBe('/create/wizard');
  });

  it('SIGNOFF_DEPRECATED_ROUTES includes /create/wizard', () => {
    expect(SIGNOFF_DEPRECATED_ROUTES).toContain('/create/wizard');
  });

  it('SIGNOFF_DEPRECATED_ROUTES includes /create', () => {
    expect(SIGNOFF_DEPRECATED_ROUTES).toContain('/create');
  });
});

describe('isDeprecatedSignoffRoute', () => {
  it('returns true for /create/wizard', () => {
    expect(isDeprecatedSignoffRoute('/create/wizard')).toBe(true);
  });

  it('returns true for /create', () => {
    expect(isDeprecatedSignoffRoute('/create')).toBe(true);
  });

  it('returns true for sub-paths of deprecated routes', () => {
    expect(isDeprecatedSignoffRoute('/create/wizard/step1')).toBe(true);
  });

  it('returns false for /launch/guided (canonical)', () => {
    expect(isDeprecatedSignoffRoute('/launch/guided')).toBe(false);
  });

  it('returns false for /compliance/setup', () => {
    expect(isDeprecatedSignoffRoute('/compliance/setup')).toBe(false);
  });

  it('returns false for / (home)', () => {
    expect(isDeprecatedSignoffRoute('/')).toBe(false);
  });
});

describe('getCanonicalSignoffRoute', () => {
  it('maps /create/wizard to /launch/guided', () => {
    expect(getCanonicalSignoffRoute('/create/wizard')).toBe('/launch/guided');
  });

  it('maps /create to /launch/guided', () => {
    expect(getCanonicalSignoffRoute('/create')).toBe('/launch/guided');
  });

  it('maps /create/batch to /launch/guided (any /create sub-path)', () => {
    expect(getCanonicalSignoffRoute('/create/batch')).toBe('/launch/guided');
  });

  it('returns null for /launch/guided (already canonical)', () => {
    expect(getCanonicalSignoffRoute('/launch/guided')).toBeNull();
  });

  it('returns null for /operations', () => {
    expect(getCanonicalSignoffRoute('/operations')).toBeNull();
  });
});

describe('auditCanonicalJourneyRoutes', () => {
  it('returns empty array when all paths are canonical', () => {
    const violations = auditCanonicalJourneyRoutes([
      '/launch/guided',
      '/compliance/setup',
      '/operations',
      '/dashboard',
    ]);
    expect(violations).toHaveLength(0);
  });

  it('returns a violation for /create/wizard in canonical paths', () => {
    const violations = auditCanonicalJourneyRoutes(['/launch/guided', '/create/wizard']);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('/create/wizard');
    expect(violations[0]).toContain('/launch/guided');
  });

  it('returns violations for every deprecated path in the list', () => {
    const violations = auditCanonicalJourneyRoutes(['/create', '/create/wizard']);
    expect(violations).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(auditCanonicalJourneyRoutes([])).toHaveLength(0);
  });
});

describe('containsNonRedirectWizardReference', () => {
  it('returns false for a spec that uses /create/wizard only in redirect-compat blocks', () => {
    const source = `
      test.describe('redirect compatibility', () => {
        test('redirects', async ({ page }) => {
          await page.goto('/create/wizard')
        })
      })
    `;
    expect(containsNonRedirectWizardReference(source)).toBe(false);
  });

  it('returns true for a spec with goto /create/wizard outside a redirect block', () => {
    const source = `
      test('canonical flow', async ({ page }) => {
        await page.goto('/create/wizard')
      })
    `;
    expect(containsNonRedirectWizardReference(source)).toBe(true);
  });

  it('returns false for a spec with no wizard reference at all', () => {
    const source = `
      test('guided launch', async ({ page }) => {
        await page.goto('/launch/guided')
      })
    `;
    expect(containsNonRedirectWizardReference(source)).toBe(false);
  });
});

// ===========================================================================
// AC #2: Auth confidence assessment
// ===========================================================================

describe('assessAuthSessionConfidence', () => {
  it('returns no_auth with score 0 for null session', () => {
    const result = assessAuthSessionConfidence(null);
    expect(result.level).toBe('no_auth');
    expect(result.score).toBe(0);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('returns score 100 for a fully valid contract_validated session', () => {
    const result = assessAuthSessionConfidence(
      {
        address: 'BIATECTEST7VALIDADDRESSLONGENOUGHTOPASSSCORING77777777777777',
        email: 'user@biatec.io',
        isConnected: true,
      },
      'contract_validated',
    );
    expect(result.score).toBe(100);
    expect(result.level).toBe('contract_validated');
    expect(result.findings).toHaveLength(0);
  });

  it('penalises short address', () => {
    const result = assessAuthSessionConfidence({
      address: 'SHORT',
      email: 'user@biatec.io',
      isConnected: true,
    });
    expect(result.score).toBeLessThan(100);
    expect(result.findings.some(f => /short/.test(f))).toBe(true);
  });

  it('penalises missing email', () => {
    const result = assessAuthSessionConfidence({
      address: 'BIATECTEST7VALIDADDRESSLONGENOUGHTOPASSSCORING77777777777777',
      email: '',
      isConnected: true,
    });
    expect(result.score).toBeLessThan(100);
    expect(result.findings.some(f => /email/.test(f))).toBe(true);
  });

  it('penalises isConnected: false', () => {
    const result = assessAuthSessionConfidence({
      address: 'BIATECTEST7VALIDADDRESSLONGENOUGHTOPASSSCORING77777777777777',
      email: 'user@biatec.io',
      isConnected: false,
    });
    expect(result.score).toBeLessThan(100);
    expect(result.findings.some(f => /isConnected/.test(f))).toBe(true);
  });

  it('includes a recommendation for raw_seeding even with perfect structure', () => {
    const result = assessAuthSessionConfidence(
      {
        address: 'BIATECTEST7VALIDADDRESSLONGENOUGHTOPASSSCORING77777777777777',
        email: 'user@biatec.io',
        isConnected: true,
      },
      'raw_seeding',
    );
    expect(result.recommendation).toMatch(/withAuth|loginWithCredentials/i);
  });
});

describe('usesCanonicalAuthBootstrap', () => {
  it('returns true when withAuth is called', () => {
    expect(usesCanonicalAuthBootstrap("await withAuth(page)")).toBe(true);
  });

  it('returns true when loginWithCredentials is called', () => {
    expect(usesCanonicalAuthBootstrap("await loginWithCredentials(page, email, pass)")).toBe(true);
  });

  it('returns false for a source that only does raw localStorage seeding', () => {
    const source = `
      localStorage.setItem('algorand_user', JSON.stringify({ address: 'X', email: 'y', isConnected: true }))
    `;
    expect(usesCanonicalAuthBootstrap(source)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(usesCanonicalAuthBootstrap('')).toBe(false);
  });
});

describe('detectRawAuthSeedingPatterns', () => {
  it('returns empty array when no raw seeding patterns exist', () => {
    const source = `
      await withAuth(page)
      await page.goto('/launch/guided')
    `;
    expect(detectRawAuthSeedingPatterns(source)).toHaveLength(0);
  });

  it('detects a single raw setItem call', () => {
    const source = `
      page.addInitScript(() => {
        localStorage.setItem('algorand_user', JSON.stringify(mockUser))
      })
    `;
    const violations = detectRawAuthSeedingPatterns(source);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('raw localStorage auth seeding');
  });

  it('detects multiple raw seeding calls and reports each line', () => {
    const source = [
      "localStorage.setItem('algorand_user', JSON.stringify(user1))",
      "// some other code",
      "localStorage.setItem('algorand_user', JSON.stringify(user2))",
    ].join('\n');
    const violations = detectRawAuthSeedingPatterns(source);
    expect(violations).toHaveLength(2);
  });
});

// ===========================================================================
// AC #3: Accessibility baseline
// ===========================================================================

describe('WCAG_REQUIRED_LANDMARKS', () => {
  it('includes navigation, main, and banner', () => {
    expect(WCAG_REQUIRED_LANDMARKS).toContain('navigation');
    expect(WCAG_REQUIRED_LANDMARKS).toContain('main');
    expect(WCAG_REQUIRED_LANDMARKS).toContain('banner');
  });
});

describe('validateAccessibilityBaseline', () => {
  it('returns pass: true when all landmarks present and no violations', () => {
    const result = validateAccessibilityBaseline(['navigation', 'main', 'banner']);
    expect(result.pass).toBe(true);
    expect(result.missingLandmarks).toHaveLength(0);
    expect(result.summary).toMatch(/PASSED/);
  });

  it('returns pass: false when main landmark is missing', () => {
    const result = validateAccessibilityBaseline(['navigation', 'banner']);
    expect(result.pass).toBe(false);
    expect(result.missingLandmarks).toContain('main');
    expect(result.summary).toMatch(/FAILED/);
  });

  it('returns pass: false when ARIA violations are present', () => {
    const result = validateAccessibilityBaseline(
      ['navigation', 'main', 'banner'],
      ['Button missing accessible name'],
    );
    expect(result.pass).toBe(false);
    expect(result.ariaViolations).toHaveLength(1);
  });

  it('returns pass: false when focus issues are present', () => {
    const result = validateAccessibilityBaseline(
      ['navigation', 'main', 'banner'],
      [],
      ['Focus ring not visible on submit button'],
    );
    expect(result.pass).toBe(false);
    expect(result.focusIssues).toHaveLength(1);
  });

  it('includes all violation types in summary', () => {
    const result = validateAccessibilityBaseline(
      ['navigation'], // missing main + banner
      ['aria issue 1', 'aria issue 2'],
      ['focus issue 1'],
    );
    expect(result.pass).toBe(false);
    expect(result.missingLandmarks).toHaveLength(2);
    expect(result.ariaViolations).toHaveLength(2);
    expect(result.focusIssues).toHaveLength(1);
  });
});

// ===========================================================================
// AC #4: Error message quality
// ===========================================================================

describe('validateSignoffErrorMessage', () => {
  it('returns empty array for a well-formed error message', () => {
    const msg = {
      what: 'Your session has ended.',
      why: 'Sessions expire automatically for security reasons.',
      how: 'Sign in again to continue where you left off.',
    };
    expect(validateSignoffErrorMessage(msg)).toHaveLength(0);
  });

  it('flags empty "what" field', () => {
    const issues = validateSignoffErrorMessage({
      what: '',
      why: 'Sessions expire automatically for security.',
      how: 'Sign in again to continue.',
    });
    expect(issues.some(i => /"what"/.test(i))).toBe(true);
  });

  it('flags short "why" field (< 10 chars)', () => {
    const issues = validateSignoffErrorMessage({
      what: 'Session expired.',
      why: 'Security',
      how: 'Sign in again please.',
    });
    expect(issues.some(i => /"why"/.test(i))).toBe(true);
  });

  it('flags short "how" field', () => {
    const issues = validateSignoffErrorMessage({
      what: 'Session expired.',
      why: 'Sessions expire automatically for security.',
      how: 'Retry',
    });
    expect(issues.some(i => /"how"/.test(i))).toBe(true);
  });

  it('flags raw exception class names in error messages', () => {
    const issues = validateSignoffErrorMessage({
      what: 'Error: AuthenticationException',
      why: 'Sessions expire automatically for security.',
      how: 'Sign in again to continue.',
    });
    expect(issues.some(i => /technical identifiers/i.test(i))).toBe(true);
  });
});

describe('SIGNOFF_ERROR_MESSAGES', () => {
  it('sessionExpired message passes quality validation', () => {
    expect(validateSignoffErrorMessage(SIGNOFF_ERROR_MESSAGES.sessionExpired)).toHaveLength(0);
  });

  it('authRequired message passes quality validation', () => {
    expect(validateSignoffErrorMessage(SIGNOFF_ERROR_MESSAGES.authRequired)).toHaveLength(0);
  });

  it('launchStepIncomplete message passes quality validation', () => {
    expect(validateSignoffErrorMessage(SIGNOFF_ERROR_MESSAGES.launchStepIncomplete)).toHaveLength(0);
  });
});

// ===========================================================================
// AC #5: Sign-off readiness scoring
// ===========================================================================

describe('computeSignoffReadiness', () => {
  const cleanInput = {
    canonicalPaths: ['/launch/guided', '/compliance/setup', '/operations'],
    authBootstrapLevel: 'contract_validated' as const,
    foundLandmarks: ['navigation', 'main', 'banner'],
    arbitraryTimeoutCount: 0,
    newSkipCount: 0,
  };

  it('returns ready: true with score 100 when all dimensions pass', () => {
    const result = computeSignoffReadiness(cleanInput);
    expect(result.ready).toBe(true);
    expect(result.score).toBe(100);
    expect(result.blockers).toHaveLength(0);
    expect(result.summary).toMatch(/READY/);
  });

  it('blocks on deprecated route in canonical paths', () => {
    const result = computeSignoffReadiness({
      ...cleanInput,
      canonicalPaths: ['/create/wizard', '/launch/guided'],
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => b.includes('/create/wizard'))).toBe(true);
    expect(result.score).toBe(80); // loses 20 pts for route violation
  });

  it('blocks on raw_seeding auth bootstrap', () => {
    const result = computeSignoffReadiness({
      ...cleanInput,
      authBootstrapLevel: 'raw_seeding',
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => /raw_seeding/.test(b))).toBe(true);
    expect(result.score).toBe(80);
  });

  it('blocks on missing WCAG landmark', () => {
    const result = computeSignoffReadiness({
      ...cleanInput,
      foundLandmarks: ['navigation', 'banner'], // missing 'main'
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => /main/.test(b))).toBe(true);
  });

  it('blocks on arbitrary timeout count > 0', () => {
    const result = computeSignoffReadiness({
      ...cleanInput,
      arbitraryTimeoutCount: 3,
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => /waitForTimeout/.test(b))).toBe(true);
  });

  it('produces a warning (not blocker) for new test skips', () => {
    const result = computeSignoffReadiness({
      ...cleanInput,
      newSkipCount: 1,
    });
    expect(result.ready).toBe(true); // warnings don't block
    expect(result.warnings).toHaveLength(1);
    expect(result.score).toBe(80); // loses 20 pts for skips
  });

  it('backend_verified auth achieves same score as contract_validated', () => {
    const backendVerified = computeSignoffReadiness({
      ...cleanInput,
      authBootstrapLevel: 'backend_verified',
    });
    const contractValidated = computeSignoffReadiness({
      ...cleanInput,
      authBootstrapLevel: 'contract_validated',
    });
    expect(backendVerified.score).toBe(contractValidated.score);
  });

  it('multiple blockers reduce score cumulatively', () => {
    const result = computeSignoffReadiness({
      canonicalPaths: ['/create/wizard'],
      authBootstrapLevel: 'raw_seeding',
      foundLandmarks: [],
      arbitraryTimeoutCount: 5,
      newSkipCount: 0,
    });
    expect(result.ready).toBe(false);
    expect(result.score).toBe(20); // only newSkipCount = 0 passes (+20 pts); all other 4 dimensions blocked
    expect(result.blockers.length).toBeGreaterThanOrEqual(3);
  });
});
