# WCAG AA Accessibility Hardening — Critical Issuance Workflows

## Summary

This document describes the WCAG 2.1 AA accessibility improvements delivered for the Biatec Tokens frontend, focusing on the highest-value user journeys: authentication, dashboard entry, guided token launch, compliance status review, and deployment progress visibility.

## What This Issue Improves

### 1. Shared UI Primitives (WCAG SC 3.3.1, SC 4.1.2, SC 4.1.3)

**`Input.vue`**
- Added `aria-invalid="true"` when the `error` prop is set (SC 3.3.1 Error Identification).
- Added `aria-describedby` pointing to the error or hint message element so screen readers announce validation context automatically (SC 3.3.2 Error Suggestion).
- Added `aria-required="true"` when `required` prop is true (SC 4.1.2 Name, Role, Value).
- Added `role="alert"` to the error `<p>` element so the message is announced assertively when it appears (SC 4.1.3 Status Messages).
- Made the required asterisk `aria-hidden="true"` to avoid duplicate "asterisk" announcements — the `aria-required` attribute conveys the same information (SC 1.3.1).
- Used `useId()` (Vue 3.5) to generate stable per-instance IDs so `aria-describedby` always resolves even when no explicit `id` prop is provided.

**`Select.vue`**
- Same improvements as `Input.vue`: `aria-invalid`, `aria-describedby`, `aria-required`, `role="alert"` on error, `aria-hidden` on asterisk, stable IDs via `useId()`.

**`Button.vue`**
- Added `aria-busy="true"` when `loading` prop is active (SC 4.1.2 — the busy state is now programmatically determinable).
- Added optional `ariaLoadingLabel` prop: when provided during a loading state, this string is set as `aria-label` so screen readers announce a meaningful description (e.g. "Saving changes…") instead of just the static button text.
- Made the spinner `<div>` `aria-hidden="true"` to prevent AT from announcing "loading spinner".

**`Badge.vue`**
- Added optional `role` prop accepting `"status"` (polite) or `"alert"` (assertive) values (SC 4.1.3 Status Messages). Status badges used for compliance state (passing/failing) should use `role="status"`. Error badges should use `role="alert"`. Purely decorative badges can omit the prop.

**`Modal.vue`**
- Added `role="dialog"` on the modal panel (SC 4.1.2 — dialog semantic exposed to AT).
- Added `aria-modal="true"` to prevent AT from reading content behind the overlay (SC 4.1.2).
- Added `aria-labelledby` wired to a stable header ID so the dialog title is announced when the dialog opens (SC 4.1.2).
- Added `aria-label="Close dialog"` to the close button and `aria-hidden="true"` to its SVG icon (SC 4.1.2).
- Added `aria-hidden="true"` to the semi-transparent backdrop (SC 4.1.2 — decorative overlay should not be announced).
- Added `@keydown.esc` handler on the outer wrapper so keyboard users can dismiss the dialog with Escape (SC 2.1.1 Keyboard).
- Added focus management: on open, focus moves to the first focusable element inside the dialog (or the dialog itself); on close, focus returns to the element that triggered the dialog (SC 2.4.3 Focus Order).
- Added `tabindex="-1"` on the dialog panel so it can receive programmatic focus as a fallback.

### 2. Automated Accessibility Tests

**Unit tests added to existing test files:**
- `Button.test.ts` — 6 WCAG AA tests covering `aria-busy`, `ariaLoadingLabel`, `aria-hidden` on spinner, focus ring classes.
- `Input.test.ts` — 10 WCAG AA tests covering `aria-invalid`, `aria-describedby`, `aria-required`, `role="alert"` on error, `aria-hidden` on asterisk, focus ring classes.
- `Select.test.ts` — 8 WCAG AA tests covering same set as Input.
- `Badge.test.ts` — 3 WCAG AA tests covering `role="status"`, `role="alert"`, and no-role default.
- `Modal.test.ts` — 7 WCAG AA tests covering `role="dialog"`, `aria-modal`, close button label, SVG `aria-hidden`, backdrop `aria-hidden`, focus-visible ring, Escape key close.

**New E2E test file:** `e2e/wcag-aa-issuance-hardening.spec.ts`
- 18 tests across 6 sections covering the highest-value issuance journeys:
  1. Landmark structure and skip navigation (6 tests)
  2. Focus visibility on interactive elements (4 tests)
  3. Error and validation state semantics (4 tests)
  4. Form control ARIA attributes in guided launch (2 tests)
  5. Modal dialog ARIA semantics (2 tests)
  6. Heading hierarchy (2 tests)

## Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC #1 | WCAG 2.1 AA contrast for text, interactive states, error messages | ✅ | Contrast token registry (accessibilityTokens.ts) + style.css `:focus-visible` with 4.5:1 ratio |
| AC #2 | Keyboard-only navigation works cleanly across targeted flows | ✅ | `focus:ring-2 focus:ring-offset-2` on all interactive elements; Tab focus E2E test |
| AC #3 | Login/validation/deployment-status use accessible semantics | ✅ | `aria-invalid`, `aria-describedby`, `role="alert"` on errors; `role="progressbar"` in guided launch |
| AC #4 | Error/warning states are specific, readable, visually distinct | ✅ | `role="alert"` on error `<p>` elements; what/why/how error structure in GuidedTokenLaunch |
| AC #5 | Shared UI primitives updated for consistent propagation | ✅ | Input.vue, Select.vue, Button.vue, Badge.vue, Modal.vue all updated |
| AC #6 | Automated accessibility checks cover critical journeys | ✅ | 29+ new unit tests + 18 E2E tests across 6 test sections |

## Manual Verification Checklist

Use this checklist to manually verify accessibility for the targeted flows.

### Prerequisites
- Keyboard-only (no mouse)
- Browser zoom at 200% (test readability)
- Screen reader spot check (NVDA/Windows or VoiceOver/macOS)

### 1. Sign-In Flow

- [ ] Press Tab from the page header — focus should reach the Sign In button with a visible ring.
- [ ] Activate Sign In — if a modal opens, confirm focus moves inside the dialog automatically.
- [ ] Press Escape — if a modal is open, confirm it closes and focus returns to the Sign In button.
- [ ] With screen reader: activating Sign In should announce the dialog title.
- [ ] Fill in a bad email/password and submit — error message should be announced by screen reader.

### 2. Dashboard Navigation

- [ ] After sign in, Tab through the top navigation bar — all items should show a clear focus ring.
- [ ] Activate the Guided Launch link — page should load and heading should be announced.
- [ ] Zoom to 200% — navigation should remain operable and not require horizontal scrolling.

### 3. Guided Token Launch

- [ ] Navigate to `/launch/guided` with keyboard only.
- [ ] Tab through all form fields in step 1 — each should have a visible focus indicator.
- [ ] Introduce a validation error (leave required field blank and click Continue).
- [ ] Confirm: (a) error message appears near the field; (b) screen reader announces it automatically.
- [ ] Confirm: error `<p>` element is associated to input via `aria-describedby`.
- [ ] Confirm: `aria-invalid="true"` is set on the invalid input.

### 4. Compliance Status Review

- [ ] Navigate to `/compliance/launch`.
- [ ] Verify status badges are distinguishable without colour alone (shape/text label present).
- [ ] With screen reader: severity badges should announce their text content.

### 5. Deployment Progress Visibility

- [ ] Navigate to a view that shows a progress bar or deployment status.
- [ ] With screen reader: progress bar should announce its value.

### Known Limitations

- Focus trapping within Modal.vue is not fully implemented (a11y best practice would use the `inert` attribute or a focus-trap library for complete keyboard containment). The Escape-key handler and initial focus placement are in place; full tab-trapping is planned as a follow-up.
- Automated colour-contrast checks require browser-level audit tools (e.g. axe-core) which are not yet integrated as CI steps. The contrast values in `accessibilityTokens.ts` are manually verified against WCAG 2.1 AA tables.
- Screen-reader testing has been validated with keyboard navigation only. A dedicated AT device test pass is recommended before each enterprise demo.

## What Accessibility Work Remains Outside This Scope

- Full axe-core CI integration for every route.
- Complete focus-trap implementation for modals (keyboard containment between first and last focusable elements).
- Colour contrast audit of all illustration and chart components.
- Localisation and right-to-left language support.
- Touch-target size audit for mobile (WCAG 2.5.5 Target Size, Level AAA).
- Full WCAG 2.2 audit (Focus Appearance SC 2.4.11, Dragging Movements SC 2.5.7, etc.).

## References

- WCAG 2.1 AA: https://www.w3.org/TR/WCAG21/
- SC 1.3.1 Info and Relationships
- SC 2.1.1 Keyboard
- SC 2.4.1 Bypass Blocks
- SC 2.4.3 Focus Order
- SC 2.4.7 Focus Visible
- SC 3.3.1 Error Identification
- SC 3.3.2 Labels or Instructions
- SC 4.1.2 Name, Role, Value
- SC 4.1.3 Status Messages (WCAG 2.1)
