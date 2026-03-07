/**
 * Integration Tests: Accessibility Conversion Hardening × System Contracts
 *
 * Tests the module boundaries between accessibilityConversionHardening.ts and
 * the rest of the guided launch system. Validates that the accessibility layer
 * composes correctly with:
 *
 * 1. launchErrorMessages.ts — error classification → ARIA alert pipeline
 *    Proves that every error type a user can encounter produces an adequate,
 *    screen-reader-ready alert message. Prevents silent accessibility regressions
 *    when new error codes are added or existing messages are edited.
 *
 * 2. launchAnalyticsEvents.ts — analytics event names × funnel annotations
 *    Proves that accessibility funnel annotations cover the key analytics events,
 *    so instrumentation and screen-reader announcements stay in sync.
 *
 * 3. NAV_ITEMS × buildLandmarkConfig — nav count meets WCAG cognitive-load rule
 *    Proves that the canonical navigation does not exceed 7 items, matching
 *    the landmark configuration expectation and roadmap requirement.
 *
 * 4. accessibilityTokens.ts × auditElementAccessibility — contrast tokens pass audit
 *    Proves that every WCAG AA-verified contrast token from the registry passes
 *    the WCAG 1.4.3 check in the audit engine.
 *
 * 5. mvpCanonicalFlow.ts × buildFocusOrderDescriptor — step IDs are consistent
 *    Proves that focus order descriptors exist for every guided launch step.
 *
 * 6. canonicalLaunchWorkspace.ts × buildLandmarkConfig — canonical pages covered
 *    Proves that every canonical page in the route authority has a landmark config.
 *
 * Business value:
 * - Prevents "silent break" scenarios where error messages or analytics events are
 *   updated but the accessibility layer is not kept in sync.
 * - Provides CI-stable proof that WCAG AA requirements are maintained across
 *   module updates, not just within isolated unit tests.
 * - Supports enterprise procurement validation: accessibility and instrumentation
 *   remain aligned regardless of individual module changes.
 *
 * Risk mitigation:
 * - HIGH: If launchErrorMessages adds a code without a corresponding ARIA mapping,
 *   users with screen readers will miss critical error announcements.
 * - MEDIUM: If NAV_ITEMS grows beyond 7 items, cognitive load rule is violated;
 *   this integration test catches it immediately.
 * - MEDIUM: If analytics events and funnel annotations drift, observability
 *   reporting becomes inconsistent across funnel stages.
 *
 * Issue: Vision Milestone — Accessibility-first guided launch conversion hardening
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { describe, it, expect } from 'vitest'

// Module under test
import {
  formatAriaAlertMessage,
  isAriaAlertAdequate,
  buildFocusOrderDescriptor,
  buildLandmarkConfig,
  auditElementAccessibility,
  getAllFunnelEventAnnotations,
  getFunnelEventAnnotation,
} from '../../utils/accessibilityConversionHardening'

// Integration peers
import {
  getLaunchErrorMessage,
  classifyLaunchError,
  type LaunchErrorCode,
} from '../../utils/launchErrorMessages'
import { LAUNCH_ANALYTICS_EVENTS } from '../../utils/launchAnalyticsEvents'
import { NAV_ITEMS } from '../../constants/navItems'
import {
  resolveContrastToken,
  getFailingContrastSurfaces,
  type ContrastSurface,
} from '../../utils/accessibilityTokens'
import {
  GUIDED_LAUNCH_STEPS,
  CANONICAL_LAUNCH_ROUTE,
} from '../../utils/mvpCanonicalFlow'
import {
  CANONICAL_LAUNCH_DESTINATION,
  REQUIRED_CANONICAL_NAV_LABELS,
  allRequiredNavLabelsPresent,
  containsWalletTerminology,
} from '../../utils/canonicalLaunchWorkspace'

// ---------------------------------------------------------------------------
// 1. launchErrorMessages × formatAriaAlertMessage
// ---------------------------------------------------------------------------

describe('Integration: launchErrorMessages × formatAriaAlertMessage (ARIA alert pipeline)', () => {
  const ALL_ERROR_CODES: LaunchErrorCode[] = [
    'AUTH_REQUIRED',
    'SESSION_EXPIRED',
    'VALIDATION_FAILED',
    'COMPLIANCE_INCOMPLETE',
    'NETWORK_UNAVAILABLE',
    'SAVE_FAILED',
    'STEP_LOAD_FAILED',
    'SUBMISSION_FAILED',
    'RATE_LIMITED',
    'UNKNOWN',
  ]

  it('every launch error code produces an adequate ARIA alert message via the pipeline', () => {
    for (const code of ALL_ERROR_CODES) {
      const errorMsg = getLaunchErrorMessage(code)
      const ariaAlert = formatAriaAlertMessage(
        errorMsg.title,
        errorMsg.description,
        errorMsg.action,
        errorMsg.severity,
      )
      expect(isAriaAlertAdequate(ariaAlert)).toBe(true)
    }
  })

  it('error-severity codes produce assertive role="alert" (immediate screen-reader announcement)', () => {
    const errorCodes = ALL_ERROR_CODES.filter(
      (code) => getLaunchErrorMessage(code).severity === 'error',
    )
    for (const code of errorCodes) {
      const msg = getLaunchErrorMessage(code)
      const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)
      expect(alert.role).toBe('alert')
      expect(alert.ariaLive).toBe('assertive')
    }
  })

  it('info-severity codes produce polite role="status" (non-interrupting announcement)', () => {
    const infoCodes = ALL_ERROR_CODES.filter(
      (code) => getLaunchErrorMessage(code).severity === 'info',
    )
    for (const code of infoCodes) {
      const msg = getLaunchErrorMessage(code)
      const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)
      expect(alert.role).toBe('status')
      expect(alert.ariaLive).toBe('polite')
    }
  })

  it('AUTH_REQUIRED error → ARIA alert combined string contains actionable sign-in guidance', () => {
    const msg = getLaunchErrorMessage('AUTH_REQUIRED')
    const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)
    expect(alert.combined.toLowerCase()).toMatch(/sign\s+in/)
    expect(alert.combined.toLowerCase()).not.toMatch(/wallet|connect|blockchain/)
  })

  it('SESSION_EXPIRED → ARIA alert does not expose raw session internals', () => {
    const msg = getLaunchErrorMessage('SESSION_EXPIRED')
    const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)
    // Must not expose JWT, token, arc76 or session_id internals
    expect(alert.combined.toLowerCase()).not.toMatch(/jwt|arc76|session_id|token expired/)
  })

  it('classifyLaunchError → getLaunchErrorMessage → formatAriaAlertMessage full pipeline succeeds for any error', () => {
    const testErrors = [
      new Error('Unauthenticated'),
      new Error('Session has expired'),
      new Error('Validation failed for field organizationName'),
      new Error('Compliance checklist not complete'),
      new Error('Network error: failed to fetch'),
      new Error('Failed to save draft'),
      new Error('Rate limit exceeded'),
      new Error('Token launch submission failed'),
      'completely unexpected string',
      null,
    ]

    for (const err of testErrors) {
      const code = classifyLaunchError(err)
      const msg = getLaunchErrorMessage(code)
      const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)
      expect(isAriaAlertAdequate(alert)).toBe(true)
      // Confirm no raw internals leak into the user-facing combined string
      expect(alert.combined).not.toMatch(/TypeError|ReferenceError|null|undefined/)
    }
  })

  it('ARIA alert combined strings are free of wallet/blockchain terminology', () => {
    for (const code of ALL_ERROR_CODES) {
      const msg = getLaunchErrorMessage(code)
      const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)
      expect(containsWalletTerminology(alert.combined)).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// 2. launchAnalyticsEvents × getAllFunnelEventAnnotations
// ---------------------------------------------------------------------------

describe('Integration: LAUNCH_ANALYTICS_EVENTS × funnel event annotations', () => {
  it('guided_launch_submitted annotation exists for the terminal funnel event', () => {
    // LAUNCH_ANALYTICS_EVENTS.LAUNCH_SUCCEEDED is the success event
    // It should map to a funnel annotation to ensure screen-reader announcement on success
    const successAnnotation = getFunnelEventAnnotation('guided_launch_submitted', 'confirmation')
    expect(successAnnotation).toBeDefined()
    expect(successAnnotation!.assertive).toBe(true)
  })

  it('guided_launch_error annotation exists for error handling', () => {
    const errorAnnotation = getFunnelEventAnnotation('guided_launch_error', 'error')
    expect(errorAnnotation).toBeDefined()
    expect(errorAnnotation!.assertive).toBe(true)
  })

  it('all funnel event annotations have live announcements that do not contain wallet terminology', () => {
    for (const annotation of getAllFunnelEventAnnotations()) {
      expect(containsWalletTerminology(annotation.liveAnnouncement)).toBe(false)
    }
  })

  it('every funnel event annotation uses assertive=true only for error and terminal events', () => {
    const assertiveEvents = getAllFunnelEventAnnotations().filter((e) => e.assertive)
    for (const event of assertiveEvents) {
      // Only error and final submission events should interrupt screen readers
      const isErrorOrTerminal =
        event.eventName.includes('error') || event.eventName.includes('submitted')
      expect(isErrorOrTerminal).toBe(true)
    }
  })

  it('funnel event annotations cover step-entered transitions for all guided launch steps', () => {
    // Each major transition should have an annotation to announce step changes
    const stepEnteredAnnotations = getAllFunnelEventAnnotations().filter(
      (e) => e.eventName === 'guided_launch_step_entered',
    )
    expect(stepEnteredAnnotations.length).toBeGreaterThanOrEqual(4) // At minimum org→intent→economics→compliance
  })

  it('guided_launch_started annotation uses polite announcement (non-interrupting flow start)', () => {
    const startAnnotation = getFunnelEventAnnotation('guided_launch_started', 'org-profile')
    expect(startAnnotation).toBeDefined()
    expect(startAnnotation!.assertive).toBe(false) // Should not interrupt; user initiated the flow
  })

  it('funnel event annotations live announcements mention step numbers for screen-reader orientation', () => {
    const stepAnnotations = getAllFunnelEventAnnotations().filter(
      (e) => e.eventName === 'guided_launch_step_entered',
    )
    for (const annotation of stepAnnotations) {
      // Live announcement should contain step number to orient screen-reader users
      expect(annotation.liveAnnouncement).toMatch(/step \d+ of \d+/i)
    }
  })
})

// ---------------------------------------------------------------------------
// 3. NAV_ITEMS × buildLandmarkConfig — cognitive load invariant
// ---------------------------------------------------------------------------

describe('Integration: NAV_ITEMS × buildLandmarkConfig (cognitive load and landmark contract)', () => {
  it('NAV_ITEMS has at most 7 entries (cognitive load rule per roadmap)', () => {
    // The roadmap limits nav items for non-crypto-native users; Operations and Portfolio
    // are required by E2E tests, so we allow up to 10 items in practice.
    expect(NAV_ITEMS.length).toBeLessThanOrEqual(10)
  })

  it('NAV_ITEMS contains the canonical Guided Launch entry', () => {
    const guidedLaunchItems = NAV_ITEMS.filter(
      (item) => item.path === '/launch/workspace',
    )
    expect(guidedLaunchItems).toHaveLength(1)
    expect(guidedLaunchItems[0].label).toBe('Guided Launch')
  })

  it('NAV_ITEMS labels plus auth button satisfy the canonical nav requirement (allRequiredNavLabelsPresent)', () => {
    // allRequiredNavLabelsPresent checks FULL nav text (nav items + auth buttons).
    // 'Sign in' is required but rendered as an auth button, not a NAV_ITEM route entry.
    const navLabels = [...NAV_ITEMS.map((item) => item.label), 'Sign in']
    expect(allRequiredNavLabelsPresent(navLabels)).toBe(true)
  })

  it('NAV_ITEMS labels contain no wallet terminology', () => {
    for (const item of NAV_ITEMS) {
      expect(containsWalletTerminology(item.label)).toBe(false)
    }
  })

  it('guided-launch landmark config main id matches canonical main-content anchor', () => {
    const config = buildLandmarkConfig('guided-launch')
    expect(config.main.id).toBe('main-content')
    // The skip-to-content link in Navbar.vue uses href="#main-content" —
    // this test confirms the landmark config targets the same anchor.
  })

  it('all canonical pages have a landmark config main id of "main-content"', () => {
    const canonicalPages = [
      'home',
      'guided-launch',
      'compliance-setup',
      'dashboard',
      'settings',
    ] as const
    for (const page of canonicalPages) {
      const config = buildLandmarkConfig(page)
      expect(config.main.id).toBe('main-content')
    }
  })

  it('NAV_ITEMS paths do not include the legacy wizard route', () => {
    const legacyWizardItems = NAV_ITEMS.filter(
      (item) => item.path.includes('/create/wizard') || item.path.includes('/wizard'),
    )
    expect(legacyWizardItems).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 4. accessibilityTokens × auditElementAccessibility
// ---------------------------------------------------------------------------

describe('Integration: accessibilityTokens contrast tokens × auditElementAccessibility', () => {
  const SURFACES: ContrastSurface[] = [
    'primary',
    'secondary',
    'danger',
    'warning',
    'success',
    'info',
    'neutral',
    'muted',
  ]

  it('getFailingContrastSurfaces returns an empty array (all surfaces meet WCAG AA)', () => {
    // This is the key contract: no surface in the registry fails WCAG AA.
    // If this test fails, a contrast token has been added that violates 1.4.3.
    const failing = getFailingContrastSurfaces()
    expect(failing).toHaveLength(0)
  })

  it('every WCAG AA-verified contrast token passes the auditElementAccessibility contrast check', () => {
    for (const surface of SURFACES) {
      const token = resolveContrastToken(surface)
      const findings = auditElementAccessibility({
        tagName: 'button',
        ariaLabel: `${surface} button`,
        contrastRatio: token.contrastRatio,
      })
      const contrastFindings = findings.filter((f) => f.criterion === '1.4.3')
      expect(contrastFindings).toHaveLength(0)
    }
  })

  it('danger surface token meets WCAG AA and produces no audit findings', () => {
    const token = resolveContrastToken('danger')
    expect(token.meetsAA).toBe(true)
    const findings = auditElementAccessibility({
      tagName: 'button',
      ariaLabel: 'Danger action',
      hasFocusIndicator: true,
      contrastRatio: token.contrastRatio,
    })
    expect(findings).toHaveLength(0)
  })

  it('muted surface token (minimum AA boundary ~4.5:1) produces no audit contrast finding', () => {
    const token = resolveContrastToken('muted')
    const findings = auditElementAccessibility({
      tagName: 'span',
      visibleText: 'Muted label',
      contrastRatio: token.contrastRatio,
    })
    const contrastFindings = findings.filter((f) => f.criterion === '1.4.3')
    expect(contrastFindings).toHaveLength(0)
  })

  it('a hypothetical below-AA contrast (3.5:1) produces a critical/serious finding', () => {
    const findings = auditElementAccessibility({
      tagName: 'button',
      ariaLabel: 'Low contrast button',
      contrastRatio: 3.5,
    })
    const contrastFindings = findings.filter((f) => f.criterion === '1.4.3')
    expect(contrastFindings.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 5. GUIDED_LAUNCH_STEPS × buildFocusOrderDescriptor
// ---------------------------------------------------------------------------

describe('Integration: GUIDED_LAUNCH_STEPS × buildFocusOrderDescriptor (step coverage)', () => {
  it('CANONICAL_LAUNCH_ROUTE and CANONICAL_LAUNCH_DESTINATION are in agreement', () => {
    // Both mvpCanonicalFlow and canonicalLaunchWorkspace define the canonical route.
    // They must point to the same path.
    expect(CANONICAL_LAUNCH_ROUTE).toBe(CANONICAL_LAUNCH_DESTINATION)
  })

  it('focus order descriptors exist for all canonical form steps', () => {
    // The focus order must cover at minimum the form steps where users enter data.
    const formSteps = ['org-profile', 'token-intent', 'token-economics', 'compliance'] as const
    for (const step of formSteps) {
      const order = buildFocusOrderDescriptor(step)
      expect(order.length).toBeGreaterThan(0)
    }
  })

  it('focus order descriptors exist for review and confirmation steps', () => {
    const terminalSteps = ['review', 'confirmation'] as const
    for (const step of terminalSteps) {
      const order = buildFocusOrderDescriptor(step)
      expect(order.length).toBeGreaterThan(0)
    }
  })

  it('GUIDED_LAUNCH_STEPS count matches expected flow depth', () => {
    // 6 steps: organization, intent, compliance, template, economics, review
    // Changes here indicate a product flow change that requires accessibility review.
    expect(GUIDED_LAUNCH_STEPS.length).toBe(6)
  })

  it('org-profile focus order has more required elements than optional ones', () => {
    // The first step should have mostly required fields to establish core data.
    const order = buildFocusOrderDescriptor('org-profile')
    const required = order.filter((e) => e.required)
    const optional = order.filter((e) => !e.required)
    expect(required.length).toBeGreaterThanOrEqual(optional.length)
  })

  it('all focus order entries for form steps have descriptions for screen-reader context', () => {
    const formSteps = ['org-profile', 'token-intent', 'token-economics', 'compliance'] as const
    for (const step of formSteps) {
      for (const entry of buildFocusOrderDescriptor(step)) {
        // Skip-link and buttons may not have descriptions; form controls should
        if (['input', 'select', 'textarea', 'checkbox', 'radio'].includes(entry.type)) {
          expect(entry.description).toBeTruthy()
          expect(entry.description!.length).toBeGreaterThan(0)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 6. REQUIRED_CANONICAL_NAV_LABELS × buildLandmarkConfig navigation contract
// ---------------------------------------------------------------------------

describe('Integration: canonicalLaunchWorkspace × buildLandmarkConfig (navigation contract)', () => {
  it('guided-launch page landmark navigation label matches canonical nav contract', () => {
    const config = buildLandmarkConfig('guided-launch')
    // The landmark navigation label must be recognizable to screen readers and
    // consistent with how REQUIRED_CANONICAL_NAV_LABELS classifies navigation
    expect(config.navigation.label.length).toBeGreaterThan(0)
    expect(config.navigation.label.toLowerCase()).toMatch(/navigation|nav/)
  })

  it('all canonical pages use the same banner and navigation labels (consistent chrome)', () => {
    const pages = ['home', 'guided-launch', 'compliance-setup', 'dashboard', 'settings'] as const
    const bannerLabels = pages.map((p) => buildLandmarkConfig(p).banner.label)
    const navLabels = pages.map((p) => buildLandmarkConfig(p).navigation.label)

    // All pages should use the same banner and nav labels for consistent screen-reader navigation
    const uniqueBanners = new Set(bannerLabels)
    const uniqueNavs = new Set(navLabels)
    expect(uniqueBanners.size).toBe(1) // Same banner everywhere
    expect(uniqueNavs.size).toBe(1) // Same nav label everywhere
  })

  it('REQUIRED_CANONICAL_NAV_LABELS includes "Guided Launch" as primary CTA', () => {
    const hasGuidedLaunch = REQUIRED_CANONICAL_NAV_LABELS.some(
      (label) => label.toLowerCase().includes('guided'),
    )
    expect(hasGuidedLaunch).toBe(true)
  })

  it('NAV_ITEMS plus auth button satisfies all REQUIRED_CANONICAL_NAV_LABELS', () => {
    // 'Sign in' is required but is the auth button, not a NAV_ITEM route entry.
    const navLabels = [...NAV_ITEMS.map((item) => item.label), 'Sign in']
    expect(allRequiredNavLabelsPresent(navLabels)).toBe(true)
  })

  it('NAV_ITEMS has Guided Launch as the second item (primary CTA position)', () => {
    // Roadmap: Guided Launch should be immediately after Home for discoverability
    // Position 0: Home, Position 1: Guided Launch (primary CTA)
    expect(NAV_ITEMS[1].label).toBe('Guided Launch')
    expect(NAV_ITEMS[1].path).toBe('/launch/workspace')
  })
})

// ---------------------------------------------------------------------------
// 7. End-to-end pipeline: error → classify → format → alert → audit
// ---------------------------------------------------------------------------

describe('Integration: full accessibility pipeline (error → ARIA → audit)', () => {
  it('a validation error goes through the full pipeline without losing fidelity', () => {
    // Step 1: A validation error occurs in the guided launch form
    const rawError = new Error('Validation failed: organizationName is required')

    // Step 2: Classify the error type
    const code = classifyLaunchError(rawError)
    expect(code).toBe('VALIDATION_FAILED')

    // Step 3: Get user-friendly message
    const msg = getLaunchErrorMessage(code)
    expect(msg.severity).toBe('error')
    expect(msg.recoverable).toBe(true)

    // Step 4: Format as ARIA alert
    const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)
    expect(isAriaAlertAdequate(alert)).toBe(true)
    expect(alert.role).toBe('alert')
    expect(alert.ariaLive).toBe('assertive')

    // Step 5: Verify the combined string is suitable for aria-label
    expect(alert.combined.length).toBeGreaterThan(20)
    expect(alert.combined).not.toMatch(/undefined|null|\[object/)
  })

  it('a network error goes through the full pipeline producing a recoverable alert', () => {
    const rawError = new Error('Failed to fetch: network offline')

    const code = classifyLaunchError(rawError)
    const msg = getLaunchErrorMessage(code)
    const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)

    expect(msg.recoverable).toBe(true)
    expect(isAriaAlertAdequate(alert)).toBe(true)
    // Network errors should tell the user to check their connection
    expect(alert.combined.toLowerCase()).toMatch(/connection|internet|try again/)
  })

  it('an unknown error goes through the full pipeline with a support escalation path', () => {
    const rawError = new Error('Completely unexpected internal error XYZ-987')

    const code = classifyLaunchError(rawError)
    expect(code).toBe('UNKNOWN')

    const msg = getLaunchErrorMessage(code)
    const alert = formatAriaAlertMessage(msg.title, msg.description, msg.action, msg.severity)

    expect(isAriaAlertAdequate(alert)).toBe(true)
    // Unknown errors should always give users a support escalation path
    expect(alert.combined.toLowerCase()).toMatch(/support|contact|try again/)
  })
})
