/**
 * Unit Tests: Onboarding Accessibility Closure Validation
 *
 * Tests the closure-layer utility that validates all acceptance criteria
 * for the auth-first onboarding and accessibility milestone.
 *
 * Business value:
 * These tests provide CI-stable proof that the routing configuration, session
 * state derivation, accessibility requirements, and error guidance are
 * correct at the configuration level — BEFORE any E2E run.
 *
 * AC coverage:
 *   AC #1  Token creation and compliance entry points require auth
 *   AC #2  Guided launch is canonical; no legacy wizard in guest paths
 *   AC #3  /create/wizard not in active guest paths
 *   AC #4  Accessibility requirement mapping for critical routes
 *   AC #6  Error guidance is user-comprehensible with no tech jargon
 *   AC #7  Each test includes business-risk description for traceability
 *
 * Issue: Frontend next milestone — deterministic auth-first onboarding
 *        and accessibility closure (#477)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TOKEN_CREATION_ENTRY_POINTS,
  COMPLIANCE_ENTRY_POINTS,
  FORBIDDEN_WALLET_PHRASES,
  allTokenCreationEntryPointsRequireAuth,
  allComplianceEntryPointsRequireAuth,
  getUnprotectedCreationPaths,
  deriveSessionState,
  isSessionActive,
  buildOnboardingClosureJourney,
  countJourneyAuthGatedSteps,
  contentContainsForbiddenWalletPhrase,
  findForbiddenWalletPhrases,
  getRouteAccessibilityRequirements,
  getAccessibilityAuditRoutes,
  getOnboardingErrorGuidance,
  classifyOnboardingError,
  getClosureAcceptanceCriteria,
  validateClosureMilestone,
  type OnboardingErrorCategory,
} from '../onboardingClosureValidation';

describe('Token creation entry points (AC #1)', () => {
  it('all known token creation entry points are listed', () => {
    // Business risk: missing an entry point means unauthenticated users could
    // access token creation without being challenged — direct revenue/security risk.
    expect(TOKEN_CREATION_ENTRY_POINTS).toContain('/create');
    expect(TOKEN_CREATION_ENTRY_POINTS).toContain('/launch/guided');
    expect(TOKEN_CREATION_ENTRY_POINTS).toContain('/create/batch');
  });

  it('all token creation entry points require authentication', () => {
    // Business risk: any unprotected creation path allows anonymous token creation,
    // violating compliance requirements and subscription enforcement.
    expect(allTokenCreationEntryPointsRequireAuth()).toBe(true);
  });

  it('no token creation paths are guest-accessible', () => {
    // Business risk: guest access to create routes allows bypassing subscription
    // and onboarding gates — critical for revenue protection.
    const unprotected = getUnprotectedCreationPaths();
    expect(unprotected).toHaveLength(0);
  });

  it('all compliance entry points require authentication', () => {
    // Business risk: unauthenticated compliance access would expose sensitive
    // regulatory data and bypass MICA compliance requirements.
    expect(allComplianceEntryPointsRequireAuth()).toBe(true);
  });

  it('COMPLIANCE_ENTRY_POINTS includes all critical compliance paths', () => {
    expect(COMPLIANCE_ENTRY_POINTS).toContain('/compliance/setup');
    expect(COMPLIANCE_ENTRY_POINTS).toContain('/compliance/orchestration');
    expect(COMPLIANCE_ENTRY_POINTS).toContain('/compliance/whitelists');
    expect(COMPLIANCE_ENTRY_POINTS).toContain('/compliance-monitoring');
  });
});

describe('Session state derivation (AC #1 — expired session handling)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns unauthenticated when no user is stored', () => {
    // Business risk: incorrectly treating a missing session as authenticated
    // would bypass all auth gates, creating critical security vulnerability.
    const state = deriveSessionState();
    expect(state).toBe('unauthenticated');
  });

  it('returns authenticated for a valid connected user', () => {
    localStorage.setItem(
      'algorand_user',
      JSON.stringify({ address: 'TEST_ADDR', email: 'test@ex.com', isConnected: true }),
    );
    const state = deriveSessionState();
    expect(state).toBe('authenticated');
  });

  it('returns session_expired when isConnected is false', () => {
    // Business risk: expired sessions must be correctly identified so users
    // are shown "sign in again" guidance, not a generic auth error.
    localStorage.setItem(
      'algorand_user',
      JSON.stringify({ address: 'TEST_ADDR', email: 'test@ex.com', isConnected: false }),
    );
    const state = deriveSessionState();
    expect(state).toBe('session_expired');
  });

  it('returns invalid for malformed JSON', () => {
    localStorage.setItem('algorand_user', 'not-json-{{{');
    const state = deriveSessionState();
    expect(state).toBe('invalid');
  });

  it('returns invalid for missing required fields', () => {
    localStorage.setItem('algorand_user', JSON.stringify({ address: 'TEST_ADDR' })); // missing email
    const state = deriveSessionState();
    expect(state).toBe('invalid');
  });

  it('isSessionActive returns true only for authenticated state', () => {
    // Business risk: isSessionActive drives routing decisions — must be reliable.
    localStorage.setItem(
      'algorand_user',
      JSON.stringify({ address: 'TEST_ADDR', email: 'test@ex.com', isConnected: true }),
    );
    expect(isSessionActive()).toBe(true);
  });

  it('isSessionActive returns false for unauthenticated state', () => {
    expect(isSessionActive()).toBe(false);
  });
});

describe('Onboarding journey model (AC #1 — deterministic redirect chain)', () => {
  it('builds a journey with at least 4 steps', () => {
    // Business risk: a shorter journey may omit the auth-gate step, creating
    // a documentation gap in the product demo flow.
    const journey = buildOnboardingClosureJourney();
    expect(journey.length).toBeGreaterThanOrEqual(4);
  });

  it('journey includes a homepage step that does not require auth', () => {
    const journey = buildOnboardingClosureJourney();
    const homepage = journey.find((s) => s.path === '/');
    expect(homepage).toBeDefined();
    expect(homepage!.requiresAuth).toBe(false);
  });

  it('journey includes a guided launch step that requires auth', () => {
    const journey = buildOnboardingClosureJourney();
    const launchSteps = journey.filter((s) => s.path === '/launch/guided');
    expect(launchSteps.some((s) => s.requiresAuth)).toBe(true);
  });

  it('journey includes an auth redirect step', () => {
    const journey = buildOnboardingClosureJourney();
    const redirectStep = journey.find((s) => s.isRedirect);
    expect(redirectStep).toBeDefined();
  });

  it('countJourneyAuthGatedSteps returns at least 1', () => {
    // Business risk: zero auth-gated steps would mean the journey has no
    // authentication requirement — a critical regression.
    expect(countJourneyAuthGatedSteps()).toBeGreaterThanOrEqual(1);
  });
});

describe('Wallet phrase detection (AC #3 — no wallet-era language)', () => {
  it('detects "not connected" in content', () => {
    // Business risk: "not connected" is wallet-era language that confuses
    // non-crypto users who have email/password accounts.
    expect(contentContainsForbiddenWalletPhrase('User is not connected to network')).toBe(true);
  });

  it('detects "WalletConnect" in content', () => {
    expect(contentContainsForbiddenWalletPhrase('Sign in with WalletConnect to continue')).toBe(
      true,
    );
  });

  it('returns false for clean auth-first content', () => {
    expect(contentContainsForbiddenWalletPhrase('Sign in with your email to continue')).toBe(
      false,
    );
  });

  it('returns empty array for clean content', () => {
    const found = findForbiddenWalletPhrases('Please sign in to access your account');
    expect(found).toHaveLength(0);
  });

  it('returns all matching phrases for multi-violation content', () => {
    const found = findForbiddenWalletPhrases(
      'Connect wallet or use WalletConnect — not connected?',
    );
    expect(found.length).toBeGreaterThan(1);
  });

  it('FORBIDDEN_WALLET_PHRASES includes the critical patterns', () => {
    expect(FORBIDDEN_WALLET_PHRASES).toContain('not connected');
    expect(FORBIDDEN_WALLET_PHRASES).toContain('WalletConnect');
    expect(FORBIDDEN_WALLET_PHRASES).toContain('connect wallet');
  });
});

describe('Accessibility requirement mapping (AC #4)', () => {
  it('homepage has defined accessibility requirements', () => {
    // Business risk: missing WCAG requirements on high-traffic routes creates
    // legal compliance risk and excludes users with assistive technology.
    const req = getRouteAccessibilityRequirements('/');
    expect(req).not.toBeNull();
    expect(req!.requiresNavLandmark).toBe(true);
    expect(req!.requiresPageTitle).toBe(true);
  });

  it('/launch/guided requires focus management on load', () => {
    // Business risk: without focus management, keyboard users cannot navigate
    // form steps — a WCAG 2.1 AA failure.
    const req = getRouteAccessibilityRequirements('/launch/guided');
    expect(req!.requiresFocusManagement).toBe(true);
  });

  it('/compliance/setup requires all core landmarks', () => {
    const req = getRouteAccessibilityRequirements('/compliance/setup');
    expect(req!.requiresNavLandmark).toBe(true);
    expect(req!.requiresMainLandmark).toBe(true);
    expect(req!.requiresPageTitle).toBe(true);
  });

  it('returns null for unrecognized routes', () => {
    const req = getRouteAccessibilityRequirements('/some/unknown/path');
    expect(req).toBeNull();
  });

  it('getAccessibilityAuditRoutes returns all critical routes', () => {
    const routes = getAccessibilityAuditRoutes();
    expect(routes).toContain('/');
    expect(routes).toContain('/launch/guided');
    expect(routes).toContain('/compliance/setup');
  });

  it('WCAG criteria 2.1.1 (Keyboard) is required for guided launch', () => {
    const req = getRouteAccessibilityRequirements('/launch/guided');
    expect(req!.wcagCriteria).toContain('2.1.1');
  });
});

describe('Error guidance quality (AC #6 — user-comprehensible messages)', () => {
  const categories: OnboardingErrorCategory[] = [
    'auth_required',
    'session_expired',
    'compliance_blocked',
    'network_error',
    'unknown',
  ];

  it.each(categories)('%s guidance has a non-empty title', (category) => {
    // Business risk: empty titles leave users with no context about what happened.
    const guidance = getOnboardingErrorGuidance(category);
    expect(guidance.title.length).toBeGreaterThan(0);
  });

  it.each(categories)('%s guidance has a non-empty primary action', (category) => {
    // Business risk: missing actions leave users stranded — direct conversion risk.
    const guidance = getOnboardingErrorGuidance(category);
    expect(guidance.primaryAction.length).toBeGreaterThan(0);
  });

  it.each(categories)('%s guidance title contains no raw technical terms', (category) => {
    // Business risk: technical jargon ("error", "exception", "stack trace") in
    // user-facing messages creates confusion and support tickets.
    const guidance = getOnboardingErrorGuidance(category);
    expect(guidance.title).not.toMatch(/error|exception|http|stack|trace/i);
  });

  it('auth_required guidance prompts to Sign In', () => {
    const guidance = getOnboardingErrorGuidance('auth_required');
    expect(guidance.primaryAction.toLowerCase()).toMatch(/sign in/i);
  });

  it('session_expired guidance is self-recoverable', () => {
    const guidance = getOnboardingErrorGuidance('session_expired');
    expect(guidance.selfRecoverable).toBe(true);
  });
});

describe('Error classification (AC #6)', () => {
  it('classifies auth-related errors correctly', () => {
    expect(classifyOnboardingError('Unauthorized: auth required')).toBe('auth_required');
    expect(classifyOnboardingError(new Error('Please sign in to access'))).toBe('auth_required');
  });

  it('classifies session-expired errors correctly', () => {
    expect(classifyOnboardingError('Session expired, please log in again')).toBe('session_expired');
    expect(classifyOnboardingError('Token timeout detected')).toBe('session_expired');
  });

  it('classifies compliance-blocked errors correctly', () => {
    expect(classifyOnboardingError('Compliance check incomplete')).toBe('compliance_blocked');
  });

  it('classifies network errors correctly', () => {
    expect(classifyOnboardingError('Network fetch failed')).toBe('network_error');
    expect(classifyOnboardingError('Connection lost')).toBe('network_error');
  });

  it('classifies unknown errors as unknown', () => {
    expect(classifyOnboardingError('Something totally unexpected')).toBe('unknown');
  });

  it('handles null/undefined gracefully', () => {
    expect(classifyOnboardingError(null)).toBe('unknown');
    expect(classifyOnboardingError(undefined)).toBe('unknown');
  });
});

describe('Closure milestone completeness (AC #7 — traceability)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('getClosureAcceptanceCriteria returns multiple ACs with IDs', () => {
    // Validates that the closure milestone has documented ACs to trace.
    const acs = getClosureAcceptanceCriteria();
    expect(acs.length).toBeGreaterThanOrEqual(6);
    acs.forEach((ac) => {
      expect(ac.id).toBeTruthy();
      expect(ac.description).toBeTruthy();
    });
  });

  it('validateClosureMilestone returns no failures for correct configuration', () => {
    // Business risk: any AC failure here means the configuration is incomplete,
    // which would fail product owner sign-off criteria.
    const failures = validateClosureMilestone();
    expect(failures).toHaveLength(0);
  });

  it('each closure AC has a validate function', () => {
    const acs = getClosureAcceptanceCriteria();
    acs.forEach((ac) => {
      expect(typeof ac.validate).toBe('function');
    });
  });

  it('AC IDs are unique', () => {
    const acs = getClosureAcceptanceCriteria();
    const ids = acs.map((ac) => ac.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
