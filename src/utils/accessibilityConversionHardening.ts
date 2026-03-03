/**
 * Accessibility Conversion Hardening Utility
 *
 * Provides deterministic helpers for making the guided token launch
 * conversion flow accessible to keyboard and screen-reader users.
 *
 * Goals:
 * - Focus management: correct focus order across multi-step forms
 * - ARIA alerts: structured role="alert" messages (what/why/how)
 * - Landmark config: semantic page structure for screen readers
 * - Keyboard traversal hints: per-step keyboard interaction guidance
 * - Audit helpers: detect common WCAG 2.1 AA violations in a page model
 *
 * Design principles:
 * - All functions are pure (no side effects, no DOM access)
 * - All outputs are deterministic for a given input
 * - Testable without a browser environment
 *
 * WCAG references:
 * - SC 1.3.1 Info and Relationships (aria roles, landmarks)
 * - SC 2.1.1 Keyboard (all functionality via keyboard)
 * - SC 2.4.3 Focus Order (sequential logical focus)
 * - SC 2.4.7 Focus Visible (visible focus indicator)
 * - SC 3.3.1 Error Identification (error described in text)
 * - SC 3.3.3 Error Suggestion (what/why/how recovery)
 * - SC 4.1.2 Name, Role, Value (role="alert" on error containers)
 * - SC 4.1.3 Status Messages (aria-live regions for dynamic updates, WCAG 2.1)
 *
 * Issue: Vision Milestone — Accessibility-first guided launch conversion hardening
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

// ---------------------------------------------------------------------------
// Focus order
// ---------------------------------------------------------------------------

/**
 * Ordered list of focusable element types in a guided launch step.
 * Ordered by standard tab-traversal convention:
 * Skip link → Heading (read-only, not focusable but sets context) →
 * Inputs → Selects → Textareas → Checkboxes → Radios → Buttons.
 */
export type FocusableElementType =
  | 'skip-link'
  | 'heading'
  | 'input'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'link'
  | 'button-secondary'
  | 'button-primary'
  | 'error-summary';

/**
 * Describes one focusable element in a step's focus order.
 */
export interface FocusOrderEntry {
  /** Zero-based tab-index position within the step */
  position: number;
  /** Element type for screen-reader context */
  type: FocusableElementType;
  /** Accessible name that a screen reader would announce */
  accessibleName: string;
  /** True if this element is required to complete the step */
  required: boolean;
  /** Optional description announced after the element name */
  description?: string;
}

/**
 * Returns the expected focus order for a named guided launch step.
 * Each step has a canonical set of focusable elements in tab order.
 *
 * The returned order models the ideal WCAG 2.1 SC 2.4.3 focus sequence.
 * Components should match this order so keyboard users navigate naturally.
 *
 * @param stepId - Identifier for the guided launch step
 * @returns Ordered array of focusable elements for the step
 */
export function buildFocusOrderDescriptor(
  stepId:
    | 'org-profile'
    | 'token-intent'
    | 'token-economics'
    | 'compliance'
    | 'review'
    | 'confirmation',
): FocusOrderEntry[] {
  const BASE_SKIP_LINK: FocusOrderEntry = {
    position: 0,
    type: 'skip-link',
    accessibleName: 'Skip to main content',
    required: false,
    description: 'Bypass navigation and jump to the step form',
  };

  const BACK_BUTTON: FocusOrderEntry = {
    position: 98,
    type: 'button-secondary',
    accessibleName: 'Back',
    required: false,
    description: 'Go to the previous step',
  };

  const CONTINUE_BUTTON: FocusOrderEntry = {
    position: 99,
    type: 'button-primary',
    accessibleName: 'Continue',
    required: true,
    description: 'Proceed to the next step',
  };

  switch (stepId) {
    case 'org-profile':
      return [
        BASE_SKIP_LINK,
        {
          position: 1,
          type: 'input',
          accessibleName: 'Organisation name',
          required: true,
          description: 'Legal name of your organisation',
        },
        {
          position: 2,
          type: 'select',
          accessibleName: 'Organisation type',
          required: true,
          description: 'Select the category that best describes your organisation',
        },
        {
          position: 3,
          type: 'input',
          accessibleName: 'Jurisdiction',
          required: true,
          description: 'Primary operating jurisdiction for compliance purposes',
        },
        CONTINUE_BUTTON,
      ];

    case 'token-intent':
      return [
        BASE_SKIP_LINK,
        {
          position: 1,
          type: 'select',
          accessibleName: 'Token purpose',
          required: true,
          description: 'Intended use case for your token',
        },
        {
          position: 2,
          type: 'input',
          accessibleName: 'Target audience',
          required: false,
          description: 'Who will hold or use this token',
        },
        BACK_BUTTON,
        CONTINUE_BUTTON,
      ];

    case 'token-economics':
      return [
        BASE_SKIP_LINK,
        {
          position: 1,
          type: 'input',
          accessibleName: 'Token name',
          required: true,
          description: 'Human-readable name shown on exchanges and wallets',
        },
        {
          position: 2,
          type: 'input',
          accessibleName: 'Token symbol',
          required: true,
          description: 'Short ticker symbol, e.g. USDT',
        },
        {
          position: 3,
          type: 'input',
          accessibleName: 'Total supply',
          required: true,
          description: 'Maximum number of tokens that will ever exist',
        },
        {
          position: 4,
          type: 'select',
          accessibleName: 'Decimals',
          required: true,
          description: 'Number of decimal places for the token amount',
        },
        BACK_BUTTON,
        CONTINUE_BUTTON,
      ];

    case 'compliance':
      return [
        BASE_SKIP_LINK,
        {
          position: 1,
          type: 'checkbox',
          accessibleName: 'I confirm compliance requirements have been reviewed',
          required: true,
          description: 'Confirms you have reviewed the applicable compliance requirements',
        },
        {
          position: 2,
          type: 'link',
          accessibleName: 'View compliance checklist',
          required: false,
          description: 'Opens the full compliance requirements checklist',
        },
        BACK_BUTTON,
        CONTINUE_BUTTON,
      ];

    case 'review':
      return [
        BASE_SKIP_LINK,
        {
          position: 1,
          type: 'button-secondary',
          accessibleName: 'Edit Organisation Profile',
          required: false,
          description: 'Return to step 1 to edit organisation details',
        },
        {
          position: 2,
          type: 'button-secondary',
          accessibleName: 'Edit Token Details',
          required: false,
          description: 'Return to step 3 to edit token economics',
        },
        BACK_BUTTON,
        {
          position: 99,
          type: 'button-primary',
          accessibleName: 'Launch Token',
          required: true,
          description: 'Submit the token launch request for backend deployment',
        },
      ];

    case 'confirmation':
      return [
        BASE_SKIP_LINK,
        {
          position: 1,
          type: 'button-primary',
          accessibleName: 'Go to Dashboard',
          required: false,
          description: 'View your token in the token dashboard',
        },
        {
          position: 2,
          type: 'button-secondary',
          accessibleName: 'Launch Another Token',
          required: false,
          description: 'Start a new guided token launch',
        },
      ];
  }
}

// ---------------------------------------------------------------------------
// ARIA alert message formatting
// ---------------------------------------------------------------------------

/**
 * Structured ARIA alert message following the what/why/how pattern.
 * Intended to be rendered in a `role="alert"` or `aria-live="polite"` region
 * so screen readers announce it automatically on appearance.
 */
export interface AriaAlertMessage {
  /** Short heading announcing what happened (1–8 words) */
  heading: string;
  /** Body explaining why it matters to the user (1–2 sentences) */
  body: string;
  /** Actionable instruction telling the user what to do next */
  action: string;
  /** Flattened single string suitable for `aria-label` or `aria-description` */
  combined: string;
  /** ARIA role to use on the container element */
  role: 'alert' | 'status';
  /** aria-live value appropriate for the severity */
  ariaLive: 'assertive' | 'polite';
}

/**
 * Formats a user-facing error message as an ARIA alert following the
 * what/why/how pattern (WCAG 3.3.3 Error Suggestion).
 *
 * Uses `role="alert"` and `aria-live="assertive"` for error messages
 * (immediate announcement) and `role="status"` with `aria-live="polite"`
 * for success/info messages (non-interrupting announcement).
 *
 * @param heading - What happened (e.g., "Sign in required")
 * @param body    - Why it matters (e.g., "You must sign in to create tokens")
 * @param action  - What to do next (e.g., "Sign in with email and password")
 * @param severity - 'error' uses assertive, anything else uses polite
 * @returns Structured ARIA alert message object
 */
export function formatAriaAlertMessage(
  heading: string,
  body: string,
  action: string,
  severity: 'error' | 'warning' | 'info' | 'success' = 'error',
): AriaAlertMessage {
  const isAssertive = severity === 'error' || severity === 'warning';
  return {
    heading: heading.trim(),
    body: body.trim(),
    action: action.trim(),
    combined: `${heading.trim()}. ${body.trim()} ${action.trim()}`,
    role: isAssertive ? 'alert' : 'status',
    ariaLive: isAssertive ? 'assertive' : 'polite',
  };
}

/**
 * Returns `true` if the ARIA alert message has all required fields populated
 * and is suitable for announcement by a screen reader.
 *
 * A message is considered adequate if:
 * - heading is non-empty
 * - body is non-empty
 * - action is non-empty
 * - combined is longer than the heading alone (not just a repeat)
 */
export function isAriaAlertAdequate(msg: AriaAlertMessage): boolean {
  return (
    msg.heading.length > 0 &&
    msg.body.length > 0 &&
    msg.action.length > 0 &&
    msg.combined.length > msg.heading.length
  );
}

// ---------------------------------------------------------------------------
// Landmark configuration
// ---------------------------------------------------------------------------

/**
 * Describes the semantic landmark structure for a page.
 * Maps to ARIA landmark roles used for screen-reader navigation (Tab key in NVDA/JAWS).
 */
export interface LandmarkConfig {
  /** `<header>` or `role="banner"` element */
  banner: { label: string };
  /** `<nav>` or `role="navigation"` element */
  navigation: { label: string };
  /** `<main>` or `role="main"` element */
  main: { label: string; id: string };
  /** `<footer>` or `role="contentinfo"` element */
  contentInfo: { label: string };
  /** Optional `role="complementary"` regions (sidebars, panels) */
  complementary?: Array<{ label: string }>;
}

/**
 * Returns the canonical landmark configuration for a named page in the
 * guided launch flow. Landmarks must be present and labelled for screen
 * readers to navigate sections efficiently (WCAG 1.3.6 Identify Purpose).
 *
 * @param page - Page identifier within the application
 * @returns Canonical LandmarkConfig for the page
 */
export function buildLandmarkConfig(
  page:
    | 'home'
    | 'guided-launch'
    | 'compliance-setup'
    | 'dashboard'
    | 'settings',
): LandmarkConfig {
  const SHARED_BANNER = { label: 'Biatec Tokens application header' };
  const SHARED_NAV = { label: 'Main navigation' };
  const SHARED_FOOTER = { label: 'Application footer' };

  switch (page) {
    case 'home':
      return {
        banner: SHARED_BANNER,
        navigation: SHARED_NAV,
        main: { label: 'Biatec Tokens home', id: 'main-content' },
        contentInfo: SHARED_FOOTER,
      };

    case 'guided-launch':
      return {
        banner: SHARED_BANNER,
        navigation: SHARED_NAV,
        main: { label: 'Guided token launch', id: 'main-content' },
        contentInfo: SHARED_FOOTER,
        complementary: [{ label: 'Launch step progress' }],
      };

    case 'compliance-setup':
      return {
        banner: SHARED_BANNER,
        navigation: SHARED_NAV,
        main: { label: 'Compliance setup', id: 'main-content' },
        contentInfo: SHARED_FOOTER,
        complementary: [{ label: 'Compliance requirements summary' }],
      };

    case 'dashboard':
      return {
        banner: SHARED_BANNER,
        navigation: SHARED_NAV,
        main: { label: 'Token portfolio dashboard', id: 'main-content' },
        contentInfo: SHARED_FOOTER,
      };

    case 'settings':
      return {
        banner: SHARED_BANNER,
        navigation: SHARED_NAV,
        main: { label: 'Account settings', id: 'main-content' },
        contentInfo: SHARED_FOOTER,
      };
  }
}

// ---------------------------------------------------------------------------
// Keyboard traversal hints
// ---------------------------------------------------------------------------

/**
 * Keyboard interaction hint for an interactive control in the guided launch flow.
 * Follows the ARIA Authoring Practices Guide keyboard interaction model.
 */
export interface KeyboardTraversalHint {
  /** Key or key combination (e.g., "Enter", "Space", "Tab", "Shift+Tab") */
  key: string;
  /** Human-readable description of the action performed by the key */
  description: string;
}

/**
 * Returns keyboard traversal hints for a given control type.
 * Follows ARIA Authoring Practices (APG) keyboard interaction patterns.
 *
 * @param controlType - The type of interactive control
 * @returns Array of keyboard hints for the control
 */
export function resolveKeyboardTraversalHints(
  controlType:
    | 'text-input'
    | 'select'
    | 'checkbox'
    | 'radio-group'
    | 'button'
    | 'link'
    | 'dialog'
    | 'step-form',
): KeyboardTraversalHint[] {
  const TAB = { key: 'Tab', description: 'Move focus to the next interactive control' };
  const SHIFT_TAB = {
    key: 'Shift+Tab',
    description: 'Move focus to the previous interactive control',
  };

  switch (controlType) {
    case 'text-input':
      return [
        TAB,
        SHIFT_TAB,
        { key: 'Character keys', description: 'Type text into the field' },
      ];

    case 'select':
      return [
        TAB,
        SHIFT_TAB,
        { key: 'Arrow Up / Arrow Down', description: 'Move between options in the dropdown' },
        { key: 'Enter / Space', description: 'Open the dropdown or select the focused option' },
        { key: 'Escape', description: 'Close the dropdown without changing selection' },
        { key: 'Home / End', description: 'Jump to the first or last option' },
      ];

    case 'checkbox':
      return [
        TAB,
        SHIFT_TAB,
        { key: 'Space', description: 'Toggle the checkbox on or off' },
      ];

    case 'radio-group':
      return [
        TAB,
        SHIFT_TAB,
        { key: 'Arrow Up / Arrow Down', description: 'Move between radio options in the group' },
        { key: 'Space', description: 'Select the focused radio option' },
      ];

    case 'button':
      return [
        TAB,
        SHIFT_TAB,
        { key: 'Enter / Space', description: 'Activate the button' },
      ];

    case 'link':
      return [
        TAB,
        SHIFT_TAB,
        { key: 'Enter', description: 'Follow the link' },
      ];

    case 'dialog':
      return [
        { key: 'Tab', description: 'Move focus within the dialog (trapped to dialog content)' },
        { key: 'Shift+Tab', description: 'Move focus backwards within the dialog' },
        { key: 'Escape', description: 'Close the dialog and return focus to the trigger element' },
      ];

    case 'step-form':
      return [
        TAB,
        SHIFT_TAB,
        { key: 'Enter', description: 'Submit the current form step or activate the focused button' },
        { key: 'Escape', description: 'Cancel changes and return to the previous step (if available)' },
        {
          key: 'F6',
          description: 'Move focus between page regions (banner, navigation, main, footer)',
        },
      ];
  }
}

// ---------------------------------------------------------------------------
// Accessibility audit helpers
// ---------------------------------------------------------------------------

/**
 * Severity of an accessibility audit finding.
 */
export type AuditFindingSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * A single finding from an accessibility audit.
 */
export interface AccessibilityAuditFinding {
  /** WCAG Success Criterion identifier (e.g., "1.4.3", "2.1.1") */
  criterion: string;
  /** Short description of the violation */
  issue: string;
  /** Why this matters for affected users */
  impact: string;
  /** Concrete remediation recommendation */
  recommendation: string;
  /** Severity classification */
  severity: AuditFindingSeverity;
}

/**
 * Describes the model of an interactive element for audit purposes.
 * No DOM access is performed; callers describe the element properties.
 */
export interface ElementAuditModel {
  /** Element tag name (e.g., "button", "input", "a") */
  tagName: string;
  /** aria-label attribute value (if present) */
  ariaLabel?: string;
  /** aria-labelledby attribute value (if present) */
  ariaLabelledby?: string;
  /** visible text content */
  visibleText?: string;
  /** role attribute value (if explicit) */
  role?: string;
  /** Whether the element has an associated visible focus indicator */
  hasFocusIndicator?: boolean;
  /** color contrast ratio of the element's text (if applicable) */
  contrastRatio?: number;
  /** Whether the element is an image-only element without alt text */
  isIconOnly?: boolean;
}

/**
 * Audits an element model for WCAG 2.1 AA violations.
 * Returns an array of findings. An empty array means no violations detected.
 *
 * Checks performed:
 * - Interactive elements must have an accessible name (SC 4.1.2)
 * - Focus indicators must be present (SC 2.4.7)
 * - Contrast ratio must be ≥ 4.5:1 for normal text (SC 1.4.3)
 * - Icon-only buttons must have aria-label (SC 1.1.1 / 4.1.2)
 *
 * @param element - Element model to audit
 * @returns Array of WCAG 2.1 AA findings
 */
export function auditElementAccessibility(
  element: ElementAuditModel,
): AccessibilityAuditFinding[] {
  const findings: AccessibilityAuditFinding[] = [];
  const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(
    element.tagName.toLowerCase(),
  );

  // SC 4.1.2 — Name, Role, Value: interactive elements need accessible names
  if (isInteractive) {
    const hasAccessibleName =
      (element.ariaLabel && element.ariaLabel.trim().length > 0) ||
      (element.ariaLabelledby && element.ariaLabelledby.trim().length > 0) ||
      (element.visibleText && element.visibleText.trim().length > 0);

    if (!hasAccessibleName) {
      findings.push({
        criterion: '4.1.2',
        issue: `<${element.tagName}> has no accessible name`,
        impact: 'Screen reader users cannot identify the purpose of this control',
        recommendation:
          'Add an aria-label attribute, associate a <label> element, or ensure visible text content',
        severity: 'critical',
      });
    }
  }

  // SC 2.4.7 — Focus Visible: keyboard-focusable elements need visible focus
  if (isInteractive && element.hasFocusIndicator === false) {
    findings.push({
      criterion: '2.4.7',
      issue: `<${element.tagName}> has no visible focus indicator`,
      impact: 'Keyboard users cannot see which element is currently focused',
      recommendation:
        'Add a visible :focus-visible outline. Avoid outline: none without a replacement indicator',
      severity: 'serious',
    });
  }

  // SC 1.4.3 — Contrast: text must meet 4.5:1 minimum ratio
  if (element.contrastRatio !== undefined && element.contrastRatio < 4.5) {
    findings.push({
      criterion: '1.4.3',
      issue: `Text contrast ratio ${element.contrastRatio.toFixed(2)}:1 is below WCAG AA minimum (4.5:1)`,
      impact: 'Users with low vision cannot read this text',
      recommendation:
        'Use a foreground/background combination with contrast ≥ 4.5:1. See accessibilityTokens.ts for verified pairs',
      severity: 'serious',
    });
  }

  // SC 1.1.1 / 4.1.2 — Icon-only buttons need a text alternative
  if (element.isIconOnly && !element.ariaLabel && !element.ariaLabelledby) {
    findings.push({
      criterion: '1.1.1',
      issue: 'Icon-only interactive element has no text alternative',
      impact: 'Screen reader users cannot understand the action this control performs',
      recommendation: 'Add aria-label="descriptive action name" to icon-only buttons',
      severity: 'critical',
    });
  }

  return findings;
}

/**
 * Returns the count of critical and serious findings from an audit.
 * Convenience helper for quick pass/fail gate evaluation.
 *
 * @param findings - Array of audit findings
 * @returns Object with `critical` and `serious` counts
 */
export function countHighSeverityFindings(
  findings: AccessibilityAuditFinding[],
): { critical: number; serious: number } {
  return {
    critical: findings.filter((f) => f.severity === 'critical').length,
    serious: findings.filter((f) => f.severity === 'serious').length,
  };
}

// ---------------------------------------------------------------------------
// Funnel event accessibility annotations
// ---------------------------------------------------------------------------

/**
 * An accessibility-annotated funnel event for the guided launch flow.
 * Extends analytics events with the ARIA context that the UX layer should
 * attach when emitting events (e.g., the current landmark, the active step).
 */
export interface AccessibilityAnnotatedFunnelEvent {
  /** Analytics event name */
  eventName: string;
  /** Step ID within the guided launch flow */
  stepId: string;
  /** ARIA live region announcement to make when this event fires */
  liveAnnouncement: string;
  /** Heading level of the step (for heading hierarchy validation) */
  stepHeadingLevel: 1 | 2 | 3;
  /** Whether to use assertive (true) or polite (false) announcement */
  assertive: boolean;
}

/** Canonical funnel events for the guided launch accessibility layer */
const GUIDED_LAUNCH_FUNNEL_EVENTS: AccessibilityAnnotatedFunnelEvent[] = [
  {
    eventName: 'guided_launch_started',
    stepId: 'org-profile',
    liveAnnouncement: 'Guided token launch started. Step 1 of 6: Organisation Profile.',
    stepHeadingLevel: 1,
    assertive: false,
  },
  {
    eventName: 'guided_launch_step_entered',
    stepId: 'token-intent',
    liveAnnouncement: 'Step 2 of 6: Token Intent. Describe the purpose of your token.',
    stepHeadingLevel: 2,
    assertive: false,
  },
  {
    eventName: 'guided_launch_step_entered',
    stepId: 'token-economics',
    liveAnnouncement: 'Step 3 of 6: Token Economics. Define your token supply and parameters.',
    stepHeadingLevel: 2,
    assertive: false,
  },
  {
    eventName: 'guided_launch_step_entered',
    stepId: 'compliance',
    liveAnnouncement: 'Step 4 of 6: Compliance. Review and confirm compliance requirements.',
    stepHeadingLevel: 2,
    assertive: false,
  },
  {
    eventName: 'guided_launch_step_entered',
    stepId: 'review',
    liveAnnouncement: 'Step 5 of 6: Review. Check all details before launching your token.',
    stepHeadingLevel: 2,
    assertive: false,
  },
  {
    eventName: 'guided_launch_submitted',
    stepId: 'confirmation',
    liveAnnouncement:
      'Token launch request submitted. You will be notified when deployment is complete.',
    stepHeadingLevel: 1,
    assertive: true,
  },
  {
    eventName: 'guided_launch_error',
    stepId: 'error',
    liveAnnouncement: 'An error occurred. Please review the message below and try again.',
    stepHeadingLevel: 2,
    assertive: true,
  },
];

/**
 * Returns the accessibility-annotated funnel event for a given event name
 * and step ID. Returns `undefined` if no matching event is found.
 *
 * @param eventName - Analytics event name
 * @param stepId    - Guided launch step identifier
 * @returns Matching event annotation or undefined
 */
export function getFunnelEventAnnotation(
  eventName: string,
  stepId: string,
): AccessibilityAnnotatedFunnelEvent | undefined {
  return GUIDED_LAUNCH_FUNNEL_EVENTS.find(
    (e) => e.eventName === eventName && e.stepId === stepId,
  );
}

/**
 * Returns all accessibility-annotated funnel events for the guided launch flow.
 */
export function getAllFunnelEventAnnotations(): AccessibilityAnnotatedFunnelEvent[] {
  return [...GUIDED_LAUNCH_FUNNEL_EVENTS];
}
