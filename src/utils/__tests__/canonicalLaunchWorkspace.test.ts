/**
 * Unit Tests: Canonical Launch Workspace Utility
 *
 * Validates the complete canonical launch workspace contract:
 *   AC #1  Non-wallet workspace state derivation is correct for all session states
 *   AC #2  Business-language empty/info-state labels contain no wallet terminology
 *   AC #3  Wallet-era pattern detection rejects all forbidden patterns
 *   AC #4  Accessibility UX state classification correctly identifies violations
 *   AC #5  Analytics funnel events are correctly built for all journey steps
 *   AC #6  Analytics payload validation rejects sensitive fields
 *   AC #7  Compliance error messages follow the what/why/how structure
 *   AC #8  Legacy redirect assertions validate correctly
 *   AC #9  All helpers are deterministic — same input, same output
 *
 * Zero arbitrary timeouts. Zero async I/O. Pure synchronous unit tests.
 *
 * Issue: MVP next step — accessibility-first canonical guided launch and compliance journey
 */

import { describe, it, expect } from 'vitest';
import {
  // Workspace user state
  deriveWorkspaceUserState,
  type WorkspaceSession,
  // State labels
  getGuestLaunchEmptyState,
  getAuthenticatedLaunchReadyState,
  getExpiredSessionState,
  getCompliancePendingState,
  getDeploymentPendingState,
  resolveWorkspaceLabel,
  // Non-wallet enforcement
  FORBIDDEN_WALLET_PATTERNS,
  containsWalletTerminology,
  findWalletPatterns,
  REQUIRED_CANONICAL_NAV_LABELS,
  allRequiredNavLabelsPresent,
  // Accessibility
  buildCompliantAccessibilityState,
  getAccessibilityViolations,
  isAccessibilityCompliant,
  // Analytics
  LAUNCH_FUNNEL_EVENTS,
  buildLaunchStartedEvent,
  buildStepCompletedEvent,
  buildComplianceVisitedEvent,
  buildComplianceCompletedEvent,
  buildDeployRequestEvent,
  validateEventPayload,
  isEventRecentlyEmitted,
  // Compliance errors
  getComplianceErrorMessage,
  classifyComplianceError,
  // Redirects
  LEGACY_WIZARD_REDIRECT_SOURCE,
  CANONICAL_LAUNCH_DESTINATION,
  isValidLegacyRedirect,
  isCanonicalLaunchPath,
  // Route invariants
  COMPLIANCE_AUTH_GATED_ROUTES,
  isComplianceAuthGated,
  LAUNCH_AUTH_REQUIRED_ROUTES,
  isLaunchAuthRequired,
} from '../canonicalLaunchWorkspace';

// ---------------------------------------------------------------------------
// AC #1: Workspace user state derivation
// ---------------------------------------------------------------------------

describe('deriveWorkspaceUserState', () => {
  it('returns "guest" when session is null', () => {
    expect(deriveWorkspaceUserState(null)).toBe('guest');
  });

  it('returns "guest" when session is undefined', () => {
    expect(deriveWorkspaceUserState(undefined)).toBe('guest');
  });

  it('returns "expired" when isConnected is false', () => {
    const session: WorkspaceSession = { address: 'ADDR', email: 'test@x.io', isConnected: false };
    expect(deriveWorkspaceUserState(session)).toBe('expired');
  });

  it('returns "authenticated" when session is valid and connected', () => {
    const session: WorkspaceSession = { address: 'ADDR', email: 'test@x.io', isConnected: true };
    expect(deriveWorkspaceUserState(session)).toBe('authenticated');
  });

  it('returns "guest" when address is empty string', () => {
    const session: WorkspaceSession = { address: '', email: 'test@x.io', isConnected: true };
    expect(deriveWorkspaceUserState(session)).toBe('guest');
  });

  it('returns "guest" when email is empty string', () => {
    const session: WorkspaceSession = { address: 'ADDR', email: '', isConnected: true };
    expect(deriveWorkspaceUserState(session)).toBe('guest');
  });

  it('returns "guest" when isConnected is not a boolean', () => {
    const session = { address: 'ADDR', email: 'test@x.io', isConnected: 'true' as unknown as boolean };
    expect(deriveWorkspaceUserState(session)).toBe('guest');
  });

  it('is deterministic — same input always produces same output', () => {
    const session: WorkspaceSession = { address: 'X', email: 'x@x.io', isConnected: true };
    expect(deriveWorkspaceUserState(session)).toBe(deriveWorkspaceUserState(session));
  });
});

// ---------------------------------------------------------------------------
// AC #2: Business-language state labels — no wallet terminology
// ---------------------------------------------------------------------------

describe('workspace state labels — no wallet terminology', () => {
  const labelFunctions = [
    { name: 'getGuestLaunchEmptyState', fn: getGuestLaunchEmptyState },
    { name: 'getAuthenticatedLaunchReadyState', fn: getAuthenticatedLaunchReadyState },
    { name: 'getExpiredSessionState', fn: getExpiredSessionState },
    { name: 'getCompliancePendingState', fn: getCompliancePendingState },
    { name: 'getDeploymentPendingState', fn: getDeploymentPendingState },
  ];

  for (const { name, fn } of labelFunctions) {
    it(`${name}: heading contains no wallet terminology`, () => {
      const label = fn();
      expect(containsWalletTerminology(label.heading)).toBe(false);
    });

    it(`${name}: description contains no wallet terminology`, () => {
      const label = fn();
      expect(containsWalletTerminology(label.description)).toBe(false);
    });

    it(`${name}: ctaLabel contains no wallet terminology`, () => {
      const label = fn();
      expect(containsWalletTerminology(label.ctaLabel)).toBe(false);
    });

    it(`${name}: heading is ≤60 characters`, () => {
      const label = fn();
      expect(label.heading.length).toBeLessThanOrEqual(60);
    });

    it(`${name}: has valid ariaRole`, () => {
      const label = fn();
      expect(['status', 'alert', 'region']).toContain(label.ariaRole);
    });

    it(`${name}: has valid ariaLive`, () => {
      const label = fn();
      expect(['polite', 'assertive', 'off']).toContain(label.ariaLive);
    });
  }

  it('getExpiredSessionState uses alert role and assertive live region', () => {
    const label = getExpiredSessionState();
    expect(label.ariaRole).toBe('alert');
    expect(label.ariaLive).toBe('assertive');
  });

  it('getGuestLaunchEmptyState CTA is "Sign in"', () => {
    const label = getGuestLaunchEmptyState();
    expect(label.ctaLabel).toBe('Sign in');
  });
});

// ---------------------------------------------------------------------------
// resolveWorkspaceLabel
// ---------------------------------------------------------------------------

describe('resolveWorkspaceLabel', () => {
  it('returns guest empty state for "guest" user', () => {
    const label = resolveWorkspaceLabel('guest');
    expect(label.ctaLabel).toBe('Sign in');
  });

  it('returns expired state for "expired" user', () => {
    const label = resolveWorkspaceLabel('expired');
    expect(label.ariaRole).toBe('alert');
  });

  it('returns authenticated launch ready state by default', () => {
    const label = resolveWorkspaceLabel('authenticated');
    expect(label.ctaLabel).toBe('Start guided launch');
  });

  it('returns compliance pending state for "compliance" context', () => {
    const label = resolveWorkspaceLabel('authenticated', 'compliance');
    expect(label.ctaLabel).toBe('Continue compliance setup');
  });

  it('returns deployment pending state for "deployment" context', () => {
    const label = resolveWorkspaceLabel('authenticated', 'deployment');
    expect(label.ctaLabel).toBe('View deployment status');
  });

  it('is deterministic', () => {
    expect(resolveWorkspaceLabel('authenticated', 'launch')).toEqual(
      resolveWorkspaceLabel('authenticated', 'launch'),
    );
  });
});

// ---------------------------------------------------------------------------
// AC #3: Wallet-era pattern detection
// ---------------------------------------------------------------------------

describe('containsWalletTerminology', () => {
  const walletPhrases = [
    'Connect Wallet',
    'WalletConnect',
    'Wallet Connect',
    'Not Connected',
    'Wallet Required',
    'No Wallet',
    'Network Required',
    'Select Network',
    'Switch Network',
    'MetaMask',
    'Pera Wallet',
    'Defly',
  ];

  for (const phrase of walletPhrases) {
    it(`detects wallet phrase: "${phrase}"`, () => {
      expect(containsWalletTerminology(phrase)).toBe(true);
    });
  }

  it('accepts clean business-language text', () => {
    expect(containsWalletTerminology('Sign in to start your token launch')).toBe(false);
    expect(containsWalletTerminology('Create Token')).toBe(false);
    expect(containsWalletTerminology('Compliance setup in progress')).toBe(false);
    expect(containsWalletTerminology('Dashboard')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(containsWalletTerminology('connect wallet')).toBe(true);
    expect(containsWalletTerminology('CONNECT WALLET')).toBe(true);
  });
});

describe('findWalletPatterns', () => {
  it('returns empty array for clean text', () => {
    expect(findWalletPatterns('Sign in')).toHaveLength(0);
  });

  it('returns matching patterns for polluted text', () => {
    const found = findWalletPatterns('Please Connect Wallet to continue');
    expect(found.length).toBeGreaterThan(0);
  });

  it('returns multiple patterns when multiple match', () => {
    const found = findWalletPatterns('Connect Wallet using MetaMask');
    expect(found.length).toBeGreaterThanOrEqual(2);
  });
});

describe('FORBIDDEN_WALLET_PATTERNS', () => {
  it('contains at least 10 forbidden patterns', () => {
    expect(FORBIDDEN_WALLET_PATTERNS.length).toBeGreaterThanOrEqual(10);
  });

  it('all patterns are RegExp instances', () => {
    for (const pattern of FORBIDDEN_WALLET_PATTERNS) {
      expect(pattern).toBeInstanceOf(RegExp);
    }
  });
});

describe('allRequiredNavLabelsPresent', () => {
  it('returns true when all required labels are present', () => {
    expect(allRequiredNavLabelsPresent(['Home', 'Guided Launch', 'Sign in', 'Dashboard'])).toBe(true);
  });

  it('returns false when "Guided Launch" is missing', () => {
    expect(allRequiredNavLabelsPresent(['Home', 'Sign in'])).toBe(false);
  });

  it('returns false when "Sign in" is missing', () => {
    expect(allRequiredNavLabelsPresent(['Home', 'Guided Launch'])).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(allRequiredNavLabelsPresent(['guided launch', 'sign in'])).toBe(true);
  });

  it('REQUIRED_CANONICAL_NAV_LABELS contains expected items', () => {
    expect(REQUIRED_CANONICAL_NAV_LABELS).toContain('Guided Launch');
    expect(REQUIRED_CANONICAL_NAV_LABELS).toContain('Sign in');
  });
});

// ---------------------------------------------------------------------------
// AC #4: Accessibility UX state classification
// ---------------------------------------------------------------------------

describe('buildCompliantAccessibilityState', () => {
  it('returns a fully compliant state object', () => {
    const state = buildCompliantAccessibilityState();
    expect(state.meetsBaselineAA).toBe(true);
    expect(state.primaryCtaKeyboardReachable).toBe(true);
    expect(state.focusIndicatorsVisible).toBe(true);
    expect(state.semanticHeadingsPresent).toBe(true);
    expect(state.errorsUseAlertRole).toBe(true);
    expect(state.stepProgressAnnounced).toBe(true);
    expect(state.iconsAccessible).toBe(true);
  });
});

describe('getAccessibilityViolations', () => {
  it('returns empty array for a fully compliant state', () => {
    const state = buildCompliantAccessibilityState();
    expect(getAccessibilityViolations(state)).toHaveLength(0);
  });

  it('reports missing keyboard reachability', () => {
    const state = { ...buildCompliantAccessibilityState(), primaryCtaKeyboardReachable: false };
    const violations = getAccessibilityViolations(state);
    expect(violations.some((v) => v.includes('keyboard'))).toBe(true);
  });

  it('reports missing focus indicators', () => {
    const state = { ...buildCompliantAccessibilityState(), focusIndicatorsVisible: false };
    const violations = getAccessibilityViolations(state);
    expect(violations.some((v) => v.includes('Focus indicators'))).toBe(true);
  });

  it('reports missing semantic headings', () => {
    const state = { ...buildCompliantAccessibilityState(), semanticHeadingsPresent: false };
    const violations = getAccessibilityViolations(state);
    expect(violations.some((v) => v.includes('headings'))).toBe(true);
  });

  it('reports missing alert role for errors', () => {
    const state = { ...buildCompliantAccessibilityState(), errorsUseAlertRole: false };
    const violations = getAccessibilityViolations(state);
    expect(violations.some((v) => v.includes('alert'))).toBe(true);
  });

  it('reports missing step progress announcement', () => {
    const state = { ...buildCompliantAccessibilityState(), stepProgressAnnounced: false };
    const violations = getAccessibilityViolations(state);
    expect(violations.some((v) => v.includes('progress'))).toBe(true);
  });

  it('reports missing icon accessibility', () => {
    const state = { ...buildCompliantAccessibilityState(), iconsAccessible: false };
    const violations = getAccessibilityViolations(state);
    expect(violations.some((v) => v.includes('Icons'))).toBe(true);
  });

  it('reports all violations when all criteria fail', () => {
    const state = {
      primaryCtaKeyboardReachable: false,
      focusIndicatorsVisible: false,
      semanticHeadingsPresent: false,
      errorsUseAlertRole: false,
      stepProgressAnnounced: false,
      iconsAccessible: false,
      meetsBaselineAA: false,
    };
    expect(getAccessibilityViolations(state)).toHaveLength(6);
  });
});

describe('isAccessibilityCompliant', () => {
  it('returns true for a fully compliant state', () => {
    expect(isAccessibilityCompliant(buildCompliantAccessibilityState())).toBe(true);
  });

  it('returns false for a state with any violation', () => {
    const state = { ...buildCompliantAccessibilityState(), focusIndicatorsVisible: false };
    expect(isAccessibilityCompliant(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #5: Analytics funnel event builders
// ---------------------------------------------------------------------------

describe('LAUNCH_FUNNEL_EVENTS constants', () => {
  it('defines all five required funnel events', () => {
    expect(LAUNCH_FUNNEL_EVENTS.LAUNCH_STARTED).toBe('launch_started');
    expect(LAUNCH_FUNNEL_EVENTS.LAUNCH_STEP_COMPLETED).toBe('launch_step_completed');
    expect(LAUNCH_FUNNEL_EVENTS.COMPLIANCE_CHECK_VISITED).toBe('compliance_check_visited');
    expect(LAUNCH_FUNNEL_EVENTS.COMPLIANCE_CHECK_COMPLETED).toBe('compliance_check_completed');
    expect(LAUNCH_FUNNEL_EVENTS.DEPLOY_REQUEST_SUBMITTED).toBe('deploy_request_submitted');
  });
});

describe('buildLaunchStartedEvent', () => {
  it('sets event to launch_started', () => {
    const event = buildLaunchStartedEvent();
    expect(event.event).toBe('launch_started');
  });

  it('includes a valid ISO 8601 timestamp', () => {
    const event = buildLaunchStartedEvent();
    expect(() => new Date(event.timestamp)).not.toThrow();
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
  });

  it('includes planContext when provided', () => {
    const event = buildLaunchStartedEvent({ planContext: 'professional' });
    expect(event.planContext).toBe('professional');
  });

  it('includes sessionId when provided', () => {
    const event = buildLaunchStartedEvent({ sessionId: 'sess_abc123' });
    expect(event.sessionId).toBe('sess_abc123');
  });

  it('omits planContext when not provided', () => {
    const event = buildLaunchStartedEvent();
    expect(event.planContext).toBeUndefined();
  });
});

describe('buildStepCompletedEvent', () => {
  it('sets event to launch_step_completed', () => {
    const event = buildStepCompletedEvent(0, 'organization');
    expect(event.event).toBe('launch_step_completed');
  });

  it('records the step index', () => {
    const event = buildStepCompletedEvent(2, 'compliance');
    expect(event.stepIndex).toBe(2);
  });

  it('normalises step name to kebab-case', () => {
    const event = buildStepCompletedEvent(1, 'Token Intent');
    expect(event.stepName).toBe('token-intent');
  });

  it('lowercases the step name', () => {
    const event = buildStepCompletedEvent(0, 'Organization');
    expect(event.stepName).toBe('organization');
  });

  it('includes optional planContext', () => {
    const event = buildStepCompletedEvent(0, 'org', { planContext: 'enterprise' });
    expect(event.planContext).toBe('enterprise');
  });
});

describe('buildComplianceVisitedEvent', () => {
  it('sets event to compliance_check_visited', () => {
    const event = buildComplianceVisitedEvent();
    expect(event.event).toBe('compliance_check_visited');
  });

  it('has no stepIndex', () => {
    const event = buildComplianceVisitedEvent();
    expect(event.stepIndex).toBeUndefined();
  });
});

describe('buildComplianceCompletedEvent', () => {
  it('sets event to compliance_check_completed', () => {
    const event = buildComplianceCompletedEvent();
    expect(event.event).toBe('compliance_check_completed');
  });
});

describe('buildDeployRequestEvent', () => {
  it('sets event to deploy_request_submitted', () => {
    const event = buildDeployRequestEvent();
    expect(event.event).toBe('deploy_request_submitted');
  });

  it('includes plan context when provided', () => {
    const event = buildDeployRequestEvent({ planContext: 'basic' });
    expect(event.planContext).toBe('basic');
  });
});

// ---------------------------------------------------------------------------
// AC #6: Analytics payload validation
// ---------------------------------------------------------------------------

describe('validateEventPayload', () => {
  it('returns empty array for a clean event', () => {
    const event = buildLaunchStartedEvent({ planContext: 'trial', sessionId: 'sess_xyz' });
    expect(validateEventPayload(event)).toHaveLength(0);
  });

  it('does not flag a clean payload with a safe sessionId', () => {
    const event = buildLaunchStartedEvent({ sessionId: 'sess-abc-xyz-001' });
    expect(validateEventPayload(event)).toHaveLength(0);
  });

  it('flags sensitive key directly in the payload', () => {
    const event = { ...buildLaunchStartedEvent(), password: 'secret' } as unknown as ReturnType<typeof buildLaunchStartedEvent>;
    const violations = validateEventPayload(event);
    expect(violations.some((v) => v.includes('password'))).toBe(true);
  });

  it('all standard events pass validation', () => {
    const events = [
      buildLaunchStartedEvent(),
      buildStepCompletedEvent(0, 'organization'),
      buildComplianceVisitedEvent(),
      buildComplianceCompletedEvent(),
      buildDeployRequestEvent(),
    ];
    for (const event of events) {
      expect(validateEventPayload(event)).toHaveLength(0);
    }
  });
});

describe('isEventRecentlyEmitted', () => {
  it('returns true for an event just emitted', () => {
    const event = buildLaunchStartedEvent();
    expect(isEventRecentlyEmitted(event, 5000, Date.now())).toBe(true);
  });

  it('returns false for a stale event older than maxAgeMs', () => {
    const event = buildLaunchStartedEvent();
    // Simulate 10 seconds in the future as "now"
    expect(isEventRecentlyEmitted(event, 5000, Date.now() + 10000)).toBe(false);
  });

  it('returns false for an event with an invalid timestamp', () => {
    const event = { ...buildLaunchStartedEvent(), timestamp: 'not-a-date' };
    expect(isEventRecentlyEmitted(event)).toBe(false);
  });

  it('returns false for a future-dated event', () => {
    const event = { ...buildLaunchStartedEvent(), timestamp: new Date(Date.now() + 60000).toISOString() };
    expect(isEventRecentlyEmitted(event, 5000, Date.now())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #7: Compliance error messages (what/why/how)
// ---------------------------------------------------------------------------

describe('getComplianceErrorMessage', () => {
  const codes = [
    'JURISDICTION_REQUIRED',
    'KYC_INCOMPLETE',
    'DOCUMENT_MISSING',
    'RISK_ASSESSMENT_PENDING',
    'WHITELIST_REQUIRED',
    'AML_CHECK_FAILED',
    'COMPLIANCE_EXPIRED',
    'DUPLICATE_SUBMISSION',
    'COMPLIANCE_UNKNOWN',
  ] as const;

  for (const code of codes) {
    it(`${code}: has non-empty title`, () => {
      expect(getComplianceErrorMessage(code).title).toBeTruthy();
    });

    it(`${code}: has non-empty description (why)`, () => {
      expect(getComplianceErrorMessage(code).description).toBeTruthy();
    });

    it(`${code}: has non-empty action (what to do next)`, () => {
      expect(getComplianceErrorMessage(code).action).toBeTruthy();
    });

    it(`${code}: has valid severity`, () => {
      expect(['error', 'warning', 'info']).toContain(getComplianceErrorMessage(code).severity);
    });

    it(`${code}: selfServiceable is a boolean`, () => {
      expect(typeof getComplianceErrorMessage(code).selfServiceable).toBe('boolean');
    });
  }

  it('AML_CHECK_FAILED is not self-serviceable', () => {
    expect(getComplianceErrorMessage('AML_CHECK_FAILED').selfServiceable).toBe(false);
  });

  it('DUPLICATE_SUBMISSION is not self-serviceable', () => {
    expect(getComplianceErrorMessage('DUPLICATE_SUBMISSION').selfServiceable).toBe(false);
  });

  it('JURISDICTION_REQUIRED is self-serviceable', () => {
    expect(getComplianceErrorMessage('JURISDICTION_REQUIRED').selfServiceable).toBe(true);
  });
});

describe('classifyComplianceError', () => {
  it('classifies jurisdiction error', () => {
    expect(classifyComplianceError(new Error('jurisdiction not selected'))).toBe('JURISDICTION_REQUIRED');
  });

  it('classifies KYC error', () => {
    expect(classifyComplianceError(new Error('KYC verification required'))).toBe('KYC_INCOMPLETE');
  });

  it('classifies document error', () => {
    expect(classifyComplianceError(new Error('document upload missing'))).toBe('DOCUMENT_MISSING');
  });

  it('classifies risk assessment error', () => {
    expect(classifyComplianceError(new Error('risk disclosure not completed'))).toBe('RISK_ASSESSMENT_PENDING');
  });

  it('classifies whitelist error', () => {
    expect(classifyComplianceError(new Error('whitelist not configured'))).toBe('WHITELIST_REQUIRED');
  });

  it('classifies AML error', () => {
    expect(classifyComplianceError(new Error('AML screening failed'))).toBe('AML_CHECK_FAILED');
  });

  it('classifies expiry error', () => {
    expect(classifyComplianceError(new Error('compliance has expired'))).toBe('COMPLIANCE_EXPIRED');
  });

  it('classifies duplicate error', () => {
    expect(classifyComplianceError(new Error('duplicate submission already exists'))).toBe('DUPLICATE_SUBMISSION');
  });

  it('falls back to COMPLIANCE_UNKNOWN for unknown errors', () => {
    expect(classifyComplianceError(new Error('something completely unknown'))).toBe('COMPLIANCE_UNKNOWN');
  });

  it('handles string inputs', () => {
    expect(classifyComplianceError('kyc incomplete')).toBe('KYC_INCOMPLETE');
  });

  it('handles non-Error objects', () => {
    expect(classifyComplianceError({ message: 'weird error' })).toBe('COMPLIANCE_UNKNOWN');
  });
});

// ---------------------------------------------------------------------------
// AC #8: Legacy redirect assertions
// ---------------------------------------------------------------------------

describe('isValidLegacyRedirect', () => {
  it('returns true for the legacy-to-canonical redirect pair', () => {
    expect(isValidLegacyRedirect('/create/wizard', '/launch/guided')).toBe(true);
  });

  it('returns false for unknown source paths', () => {
    expect(isValidLegacyRedirect('/unknown', '/launch/guided')).toBe(false);
  });

  it('returns false for incorrect destination', () => {
    expect(isValidLegacyRedirect('/create/wizard', '/create')).toBe(false);
  });

  it('LEGACY_WIZARD_REDIRECT_SOURCE is /create/wizard', () => {
    expect(LEGACY_WIZARD_REDIRECT_SOURCE).toBe('/create/wizard');
  });

  it('CANONICAL_LAUNCH_DESTINATION is /launch/guided', () => {
    expect(CANONICAL_LAUNCH_DESTINATION).toBe('/launch/guided');
  });
});

describe('isCanonicalLaunchPath', () => {
  it('returns true for /launch/guided', () => {
    expect(isCanonicalLaunchPath('/launch/guided')).toBe(true);
  });

  it('returns false for /create/wizard', () => {
    expect(isCanonicalLaunchPath('/create/wizard')).toBe(false);
  });

  it('returns false for /create', () => {
    expect(isCanonicalLaunchPath('/create')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC #9: Route coverage invariants
// ---------------------------------------------------------------------------

describe('COMPLIANCE_AUTH_GATED_ROUTES', () => {
  it('contains expected compliance routes', () => {
    expect(COMPLIANCE_AUTH_GATED_ROUTES).toContain('/compliance/setup');
    expect(COMPLIANCE_AUTH_GATED_ROUTES).toContain('/compliance/orchestration');
    expect(COMPLIANCE_AUTH_GATED_ROUTES).toContain('/compliance-monitoring');
    expect(COMPLIANCE_AUTH_GATED_ROUTES).toContain('/compliance/whitelists');
  });
});

describe('isComplianceAuthGated', () => {
  it('returns true for all compliance auth-gated routes', () => {
    for (const route of COMPLIANCE_AUTH_GATED_ROUTES) {
      expect(isComplianceAuthGated(route)).toBe(true);
    }
  });

  it('returns false for non-compliance routes', () => {
    expect(isComplianceAuthGated('/')).toBe(false);
    expect(isComplianceAuthGated('/launch/guided')).toBe(false);
  });
});

describe('LAUNCH_AUTH_REQUIRED_ROUTES', () => {
  it('contains expected launch routes', () => {
    expect(LAUNCH_AUTH_REQUIRED_ROUTES).toContain('/launch/guided');
    expect(LAUNCH_AUTH_REQUIRED_ROUTES).toContain('/create');
    expect(LAUNCH_AUTH_REQUIRED_ROUTES).toContain('/create/batch');
  });
});

describe('isLaunchAuthRequired', () => {
  it('returns true for all launch auth-required routes', () => {
    for (const route of LAUNCH_AUTH_REQUIRED_ROUTES) {
      expect(isLaunchAuthRequired(route)).toBe(true);
    }
  });

  it('returns false for the home route', () => {
    expect(isLaunchAuthRequired('/')).toBe(false);
  });

  it('returns false for /create/wizard (legacy redirect, not a direct route)', () => {
    expect(isLaunchAuthRequired('/create/wizard')).toBe(false);
  });
});
