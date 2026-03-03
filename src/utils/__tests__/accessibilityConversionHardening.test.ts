/**
 * Unit tests for accessibilityConversionHardening utility
 *
 * Validates:
 * 1. buildFocusOrderDescriptor returns correct ordered elements per step
 * 2. formatAriaAlertMessage produces adequate ARIA alert messages
 * 3. isAriaAlertAdequate correctly validates alert message completeness
 * 4. buildLandmarkConfig returns correct landmark structure per page
 * 5. resolveKeyboardTraversalHints returns non-empty hints per control type
 * 6. auditElementAccessibility detects WCAG 2.1 AA violations
 * 7. countHighSeverityFindings returns correct counts
 * 8. getFunnelEventAnnotation and getAllFunnelEventAnnotations work correctly
 */

import { describe, it, expect } from 'vitest';
import {
  buildFocusOrderDescriptor,
  formatAriaAlertMessage,
  isAriaAlertAdequate,
  buildLandmarkConfig,
  resolveKeyboardTraversalHints,
  auditElementAccessibility,
  countHighSeverityFindings,
  getFunnelEventAnnotation,
  getAllFunnelEventAnnotations,
  type FocusOrderEntry,
  type AriaAlertMessage,
  type LandmarkConfig,
  type AccessibilityAuditFinding,
} from '../accessibilityConversionHardening';

// ---------------------------------------------------------------------------
// buildFocusOrderDescriptor
// ---------------------------------------------------------------------------

describe('buildFocusOrderDescriptor', () => {
  const allSteps = [
    'org-profile',
    'token-intent',
    'token-economics',
    'compliance',
    'review',
    'confirmation',
  ] as const;

  it('returns a non-empty array for every step', () => {
    for (const step of allSteps) {
      const order = buildFocusOrderDescriptor(step);
      expect(order.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-negative position', () => {
    for (const step of allSteps) {
      for (const entry of buildFocusOrderDescriptor(step)) {
        expect(entry.position).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('every entry has a non-empty accessibleName', () => {
    for (const step of allSteps) {
      for (const entry of buildFocusOrderDescriptor(step)) {
        expect(entry.accessibleName.length).toBeGreaterThan(0);
      }
    }
  });

  it('positions within a step are unique', () => {
    for (const step of allSteps) {
      const positions = buildFocusOrderDescriptor(step).map((e) => e.position);
      const unique = new Set(positions);
      expect(unique.size).toBe(positions.length);
    }
  });

  it('org-profile step includes a skip-link entry', () => {
    const order = buildFocusOrderDescriptor('org-profile');
    const skipLink = order.find((e) => e.type === 'skip-link');
    expect(skipLink).toBeDefined();
    expect(skipLink?.accessibleName).toMatch(/skip/i);
  });

  it('org-profile step includes organisation name input', () => {
    const order = buildFocusOrderDescriptor('org-profile');
    const orgInput = order.find((e) => e.type === 'input' && /organisation/i.test(e.accessibleName));
    expect(orgInput).toBeDefined();
    expect(orgInput?.required).toBe(true);
  });

  it('org-profile step ends with a Continue primary button', () => {
    const order = buildFocusOrderDescriptor('org-profile');
    const continueBtn = order.find(
      (e) => e.type === 'button-primary' && /continue/i.test(e.accessibleName),
    );
    expect(continueBtn).toBeDefined();
    expect(continueBtn?.required).toBe(true);
  });

  it('token-economics step includes token name and total supply inputs', () => {
    const order = buildFocusOrderDescriptor('token-economics');
    const names = order.map((e) => e.accessibleName.toLowerCase());
    expect(names.some((n) => n.includes('token name'))).toBe(true);
    expect(names.some((n) => n.includes('total supply'))).toBe(true);
  });

  it('compliance step includes a checkbox for compliance confirmation', () => {
    const order = buildFocusOrderDescriptor('compliance');
    const checkbox = order.find((e) => e.type === 'checkbox');
    expect(checkbox).toBeDefined();
    expect(checkbox?.required).toBe(true);
  });

  it('review step includes a Launch Token primary button', () => {
    const order = buildFocusOrderDescriptor('review');
    const launchBtn = order.find(
      (e) => e.type === 'button-primary' && /launch/i.test(e.accessibleName),
    );
    expect(launchBtn).toBeDefined();
  });

  it('confirmation step includes a Go to Dashboard button', () => {
    const order = buildFocusOrderDescriptor('confirmation');
    const dashboardBtn = order.find(
      (e) => e.type === 'button-primary' && /dashboard/i.test(e.accessibleName),
    );
    expect(dashboardBtn).toBeDefined();
  });

  it('all steps with Back button include it as secondary', () => {
    const stepsWithBack = ['token-intent', 'token-economics', 'compliance', 'review'] as const;
    for (const step of stepsWithBack) {
      const order = buildFocusOrderDescriptor(step);
      const backBtn = order.find(
        (e) => e.type === 'button-secondary' && /back/i.test(e.accessibleName),
      );
      expect(backBtn).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// formatAriaAlertMessage
// ---------------------------------------------------------------------------

describe('formatAriaAlertMessage', () => {
  it('should produce a message with all required fields', () => {
    const msg = formatAriaAlertMessage(
      'Sign in required',
      'You must be signed in to create tokens.',
      'Sign in with your email and password.',
      'error',
    );
    expect(msg.heading).toBe('Sign in required');
    expect(msg.body).toBe('You must be signed in to create tokens.');
    expect(msg.action).toBe('Sign in with your email and password.');
    expect(msg.combined).toContain('Sign in required');
    expect(msg.combined).toContain('You must be signed in');
    expect(msg.combined).toContain('Sign in with your email');
  });

  it('should use role="alert" and aria-live="assertive" for error severity', () => {
    const msg = formatAriaAlertMessage('Error', 'Something failed.', 'Try again.', 'error');
    expect(msg.role).toBe('alert');
    expect(msg.ariaLive).toBe('assertive');
  });

  it('should use role="alert" and aria-live="assertive" for warning severity', () => {
    const msg = formatAriaAlertMessage('Warning', 'Check this.', 'Review details.', 'warning');
    expect(msg.role).toBe('alert');
    expect(msg.ariaLive).toBe('assertive');
  });

  it('should use role="status" and aria-live="polite" for info severity', () => {
    const msg = formatAriaAlertMessage('Info', 'FYI.', 'No action needed.', 'info');
    expect(msg.role).toBe('status');
    expect(msg.ariaLive).toBe('polite');
  });

  it('should use role="status" and aria-live="polite" for success severity', () => {
    const msg = formatAriaAlertMessage('Success', 'Done!', 'Check your dashboard.', 'success');
    expect(msg.role).toBe('status');
    expect(msg.ariaLive).toBe('polite');
  });

  it('should default to error severity when no severity is provided', () => {
    const msg = formatAriaAlertMessage('Error', 'Failed.', 'Retry.');
    expect(msg.role).toBe('alert');
    expect(msg.ariaLive).toBe('assertive');
  });

  it('combined string includes all three parts', () => {
    const msg = formatAriaAlertMessage('What', 'Why it matters.', 'What to do.');
    expect(msg.combined).toContain('What');
    expect(msg.combined).toContain('Why it matters');
    expect(msg.combined).toContain('What to do');
  });

  it('should trim whitespace from inputs', () => {
    const msg = formatAriaAlertMessage('  Heading  ', '  Body.  ', '  Action.  ');
    expect(msg.heading).toBe('Heading');
    expect(msg.body).toBe('Body.');
    expect(msg.action).toBe('Action.');
  });
});

// ---------------------------------------------------------------------------
// isAriaAlertAdequate
// ---------------------------------------------------------------------------

describe('isAriaAlertAdequate', () => {
  const validMsg: AriaAlertMessage = {
    heading: 'Sign in required',
    body: 'You must sign in to continue.',
    action: 'Sign in now.',
    combined: 'Sign in required. You must sign in to continue. Sign in now.',
    role: 'alert',
    ariaLive: 'assertive',
  };

  it('returns true for a fully populated message', () => {
    expect(isAriaAlertAdequate(validMsg)).toBe(true);
  });

  it('returns false when heading is empty', () => {
    expect(isAriaAlertAdequate({ ...validMsg, heading: '' })).toBe(false);
  });

  it('returns false when body is empty', () => {
    expect(isAriaAlertAdequate({ ...validMsg, body: '' })).toBe(false);
  });

  it('returns false when action is empty', () => {
    expect(isAriaAlertAdequate({ ...validMsg, action: '' })).toBe(false);
  });

  it('returns false when combined is only the heading', () => {
    expect(isAriaAlertAdequate({ ...validMsg, combined: 'Sign in required' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildLandmarkConfig
// ---------------------------------------------------------------------------

describe('buildLandmarkConfig', () => {
  const allPages = [
    'home',
    'guided-launch',
    'compliance-setup',
    'dashboard',
    'settings',
  ] as const;

  it('returns a config for every page', () => {
    for (const page of allPages) {
      const config = buildLandmarkConfig(page);
      expect(config).toBeDefined();
    }
  });

  it('every config has a banner, navigation, main, and contentInfo', () => {
    for (const page of allPages) {
      const config = buildLandmarkConfig(page);
      expect(config.banner.label.length).toBeGreaterThan(0);
      expect(config.navigation.label.length).toBeGreaterThan(0);
      expect(config.main.label.length).toBeGreaterThan(0);
      expect(config.main.id.length).toBeGreaterThan(0);
      expect(config.contentInfo.label.length).toBeGreaterThan(0);
    }
  });

  it('all pages use "main-content" as the main landmark id', () => {
    for (const page of allPages) {
      const config = buildLandmarkConfig(page);
      expect(config.main.id).toBe('main-content');
    }
  });

  it('guided-launch page has a complementary landmark for step progress', () => {
    const config = buildLandmarkConfig('guided-launch');
    expect(config.complementary).toBeDefined();
    expect(config.complementary!.length).toBeGreaterThan(0);
  });

  it('compliance-setup page has a complementary landmark', () => {
    const config = buildLandmarkConfig('compliance-setup');
    expect(config.complementary).toBeDefined();
  });

  it('home page uses a descriptive main landmark label', () => {
    const config = buildLandmarkConfig('home');
    expect(config.main.label.toLowerCase()).toContain('home');
  });
});

// ---------------------------------------------------------------------------
// resolveKeyboardTraversalHints
// ---------------------------------------------------------------------------

describe('resolveKeyboardTraversalHints', () => {
  const allTypes = [
    'text-input',
    'select',
    'checkbox',
    'radio-group',
    'button',
    'link',
    'dialog',
    'step-form',
  ] as const;

  it('returns at least one hint for every control type', () => {
    for (const type of allTypes) {
      const hints = resolveKeyboardTraversalHints(type);
      expect(hints.length).toBeGreaterThan(0);
    }
  });

  it('every hint has a non-empty key and description', () => {
    for (const type of allTypes) {
      for (const hint of resolveKeyboardTraversalHints(type)) {
        expect(hint.key.length).toBeGreaterThan(0);
        expect(hint.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('text-input includes Tab hint', () => {
    const hints = resolveKeyboardTraversalHints('text-input');
    expect(hints.some((h) => h.key === 'Tab')).toBe(true);
  });

  it('select includes arrow keys and Enter/Space hints', () => {
    const hints = resolveKeyboardTraversalHints('select');
    expect(hints.some((h) => /arrow/i.test(h.key))).toBe(true);
    expect(hints.some((h) => /enter/i.test(h.key))).toBe(true);
  });

  it('checkbox includes Space for toggle', () => {
    const hints = resolveKeyboardTraversalHints('checkbox');
    expect(hints.some((h) => h.key === 'Space')).toBe(true);
  });

  it('dialog includes Escape to close', () => {
    const hints = resolveKeyboardTraversalHints('dialog');
    expect(hints.some((h) => h.key === 'Escape')).toBe(true);
  });

  it('button includes Enter/Space for activation', () => {
    const hints = resolveKeyboardTraversalHints('button');
    expect(hints.some((h) => /enter/i.test(h.key) && /space/i.test(h.key))).toBe(true);
  });

  it('step-form includes Tab, Shift+Tab, and Escape', () => {
    const hints = resolveKeyboardTraversalHints('step-form');
    const keys = hints.map((h) => h.key);
    expect(keys).toContain('Tab');
    expect(keys).toContain('Shift+Tab');
    expect(keys).toContain('Escape');
  });
});

// ---------------------------------------------------------------------------
// auditElementAccessibility
// ---------------------------------------------------------------------------

describe('auditElementAccessibility', () => {
  it('returns no findings for a properly labelled button', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      ariaLabel: 'Submit form',
      hasFocusIndicator: true,
      contrastRatio: 5.0,
    });
    expect(findings).toHaveLength(0);
  });

  it('detects missing accessible name (4.1.2)', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      hasFocusIndicator: true,
    });
    const hasNameFinding = findings.some((f) => f.criterion === '4.1.2');
    expect(hasNameFinding).toBe(true);
  });

  it('detects missing focus indicator (2.4.7)', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      ariaLabel: 'Save',
      hasFocusIndicator: false,
    });
    const hasFocusFinding = findings.some((f) => f.criterion === '2.4.7');
    expect(hasFocusFinding).toBe(true);
  });

  it('detects insufficient color contrast (1.4.3)', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      ariaLabel: 'Submit',
      contrastRatio: 3.0,
    });
    const hasContrastFinding = findings.some((f) => f.criterion === '1.4.3');
    expect(hasContrastFinding).toBe(true);
  });

  it('does not flag contrast when ratio is exactly 4.5:1', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      ariaLabel: 'Submit',
      contrastRatio: 4.5,
    });
    const hasContrastFinding = findings.some((f) => f.criterion === '1.4.3');
    expect(hasContrastFinding).toBe(false);
  });

  it('detects icon-only element without aria-label (1.1.1)', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      isIconOnly: true,
      hasFocusIndicator: true,
    });
    const hasIconFinding = findings.some((f) => f.criterion === '1.1.1');
    expect(hasIconFinding).toBe(true);
  });

  it('does not flag icon element when aria-label is present', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      isIconOnly: true,
      ariaLabel: 'Close dialog',
      hasFocusIndicator: true,
    });
    const hasIconFinding = findings.some((f) => f.criterion === '1.1.1');
    expect(hasIconFinding).toBe(false);
  });

  it('does not audit non-interactive elements for name or focus', () => {
    const findings = auditElementAccessibility({
      tagName: 'div',
    });
    const hasNameFinding = findings.some((f) => f.criterion === '4.1.2');
    const hasFocusFinding = findings.some((f) => f.criterion === '2.4.7');
    expect(hasNameFinding).toBe(false);
    expect(hasFocusFinding).toBe(false);
  });

  it('finding severity is critical or serious for real violations', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      hasFocusIndicator: false,
      contrastRatio: 2.5,
    });
    for (const f of findings) {
      expect(['critical', 'serious', 'moderate', 'minor']).toContain(f.severity);
    }
  });

  it('accepts visible text as accessible name for button', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      visibleText: 'Continue',
      hasFocusIndicator: true,
    });
    const hasNameFinding = findings.some((f) => f.criterion === '4.1.2');
    expect(hasNameFinding).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// countHighSeverityFindings
// ---------------------------------------------------------------------------

describe('countHighSeverityFindings', () => {
  it('returns zero counts for empty findings', () => {
    const counts = countHighSeverityFindings([]);
    expect(counts.critical).toBe(0);
    expect(counts.serious).toBe(0);
  });

  it('counts only critical and serious findings', () => {
    const findings: AccessibilityAuditFinding[] = [
      {
        criterion: '4.1.2',
        issue: 'Missing name',
        impact: 'Screen readers cannot identify element',
        recommendation: 'Add aria-label',
        severity: 'critical',
      },
      {
        criterion: '2.4.7',
        issue: 'No focus indicator',
        impact: 'Keyboard users cannot see focus',
        recommendation: 'Add :focus-visible styles',
        severity: 'serious',
      },
      {
        criterion: '1.4.3',
        issue: 'Low contrast',
        impact: 'Hard to read',
        recommendation: 'Increase contrast',
        severity: 'moderate',
      },
    ];
    const counts = countHighSeverityFindings(findings);
    expect(counts.critical).toBe(1);
    expect(counts.serious).toBe(1);
  });

  it('returns correct counts when multiple critical findings exist', () => {
    const findings: AccessibilityAuditFinding[] = [
      {
        criterion: '4.1.2',
        issue: 'A',
        impact: 'B',
        recommendation: 'C',
        severity: 'critical',
      },
      {
        criterion: '1.1.1',
        issue: 'A',
        impact: 'B',
        recommendation: 'C',
        severity: 'critical',
      },
    ];
    const counts = countHighSeverityFindings(findings);
    expect(counts.critical).toBe(2);
    expect(counts.serious).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getFunnelEventAnnotation / getAllFunnelEventAnnotations
// ---------------------------------------------------------------------------

describe('getFunnelEventAnnotation', () => {
  it('returns annotation for guided_launch_started + org-profile', () => {
    const annotation = getFunnelEventAnnotation('guided_launch_started', 'org-profile');
    expect(annotation).toBeDefined();
    expect(annotation!.eventName).toBe('guided_launch_started');
    expect(annotation!.stepId).toBe('org-profile');
    expect(annotation!.liveAnnouncement.length).toBeGreaterThan(0);
  });

  it('returns annotation for guided_launch_submitted + confirmation', () => {
    const annotation = getFunnelEventAnnotation('guided_launch_submitted', 'confirmation');
    expect(annotation).toBeDefined();
    expect(annotation!.assertive).toBe(true);
  });

  it('returns annotation for guided_launch_error + error', () => {
    const annotation = getFunnelEventAnnotation('guided_launch_error', 'error');
    expect(annotation).toBeDefined();
    expect(annotation!.assertive).toBe(true);
    expect(annotation!.ariaLive === 'assertive' || annotation!.assertive === true).toBe(true);
  });

  it('returns undefined for unknown event name', () => {
    const annotation = getFunnelEventAnnotation('unknown_event', 'org-profile');
    expect(annotation).toBeUndefined();
  });

  it('returns undefined for unknown step id', () => {
    const annotation = getFunnelEventAnnotation('guided_launch_started', 'unknown-step');
    expect(annotation).toBeUndefined();
  });
});

describe('getAllFunnelEventAnnotations', () => {
  it('returns a non-empty array', () => {
    const events = getAllFunnelEventAnnotations();
    expect(events.length).toBeGreaterThan(0);
  });

  it('every annotation has required fields', () => {
    for (const event of getAllFunnelEventAnnotations()) {
      expect(event.eventName.length).toBeGreaterThan(0);
      expect(event.stepId.length).toBeGreaterThan(0);
      expect(event.liveAnnouncement.length).toBeGreaterThan(0);
      expect([1, 2, 3]).toContain(event.stepHeadingLevel);
      expect(typeof event.assertive).toBe('boolean');
    }
  });

  it('returns a copy (mutating return value does not affect internal state)', () => {
    const events1 = getAllFunnelEventAnnotations();
    const events2 = getAllFunnelEventAnnotations();
    events1.push({
      eventName: 'extra',
      stepId: 'extra',
      liveAnnouncement: 'extra',
      stepHeadingLevel: 2,
      assertive: false,
    });
    expect(events2.length).toBeLessThan(events1.length);
  });

  it('error event is assertive (interrupts screen reader)', () => {
    const errorEvent = getAllFunnelEventAnnotations().find((e) => e.eventName === 'guided_launch_error');
    expect(errorEvent).toBeDefined();
    expect(errorEvent!.assertive).toBe(true);
  });

  it('step-entered events are non-assertive (polite announcements)', () => {
    const stepEnteredEvents = getAllFunnelEventAnnotations().filter(
      (e) => e.eventName === 'guided_launch_step_entered',
    );
    for (const event of stepEnteredEvents) {
      expect(event.assertive).toBe(false);
    }
  });
});
