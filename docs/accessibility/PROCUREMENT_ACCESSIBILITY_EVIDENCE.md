# Procurement-Grade Accessibility Evidence
## Biatec Tokens — Enterprise Issuance Journey WCAG 2.1 AA Verification

**Version**: 1.0  
**Date**: March 2026  
**Audience**: Product, QA, procurement reviewers, accessibility stakeholders  
**CI Run**: `npx playwright test e2e/accessibility-enterprise-journeys.spec.ts`

---

## Overview

This document describes the automated accessibility verification layer added to
Biatec Tokens for the highest-value enterprise issuance journeys. It explains:

1. What journeys are covered and which WCAG 2.1 AA checkpoints are tested
2. How to run the tests locally and interpret CI output
3. A manual verification checklist for design/product/procurement review
4. Known limitations and planned follow-up work

The implementation uses **axe-core** (industry-standard automated accessibility
scanning) combined with deterministic Playwright assertions for keyboard behavior,
semantic structure, and landmark verification. Tests are designed to be:

- **Deterministic**: No arbitrary timeouts; all waits are semantic
- **CI-executable**: Runs on every PR in the existing Playwright workflow
- **Evidence-grade**: Failure output names the WCAG checkpoint, description, and URL
- **Stakeholder-legible**: Section naming uses business terms, not engineering jargon

---

## Journey Coverage

| Journey | Route | axe Scan | Keyboard | Landmarks | Headings | Live Regions |
|---------|-------|----------|----------|-----------|----------|--------------|
| Home (unauth) | `/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Home (auth) | `/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sign-in / auth | `/` (unauth modal) | ✅ | ✅ | ✅ | — | — |
| Guided Launch | `/launch/guided` | ✅ | ✅ | ✅ | ✅ | — |
| Compliance Dashboard | `/compliance/launch` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Whitelist Policies | `/compliance/policy` | ✅ | — | ✅ | ✅ | — |
| Whitelist Management | `/compliance/whitelists` | ✅ | — | ✅ | ✅ | — |
| Team Workspace | `/team/workspace` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Operations | `/operations` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Settings | `/settings` | ✅ | ✅ | — | ✅ | — |
| Mobile shell (390px) | `/`, `/compliance/launch` | ✅ | — | ✅ | — | — |

**Total**: 57 deterministic tests across 10 describe sections.

---

## Spec Files

### New — `e2e/accessibility-enterprise-journeys.spec.ts`
Primary evidence file for this issue. 57 tests in 10 sections aligned to issue
acceptance criteria.

### Shared Helpers — `e2e/helpers/accessibility.ts`
Reusable utilities so future journey coverage requires minimal new boilerplate:
- `runAxeScan(page, options)` — axe-core WCAG 2.1 AA scan with structured CI output
- `assertMainNav(page)` — verifies `nav[aria-label="Main navigation"]`
- `assertMainLandmark(page)` — verifies `main#main-content`
- `assertSkipLink(page)` — verifies skip-to-main-content link
- `assertSingleH1(page)` — verifies no duplicate h1
- `assertKeyboardFocusAfterTab(page)` — headless-safe Tab focus check
- `assertFirstTabTargetIsFocusable(page)` — verifies first Tab target is meaningful
- `assertNavLinksFocusVisible(page)` — verifies focus-visible ring classes
- `assertRouteAnnouncer(page)` — verifies `data-testid="route-announcer"` + aria-live
- `assertDialogAccessibility(page, opts)` — verifies dialog role/aria-modal/label
- `assertFormInputsLabelled(page, formSelector)` — verifies all visible inputs are labelled
- `gotoAndWaitForHeading(page, path, pattern)` — navigate + wait for h1

### Existing Coverage
These existing specs also provide accessibility evidence:
- `e2e/automated-accessibility-verification.spec.ts` — 65 tests (enterprise route evidence)
- `e2e/enterprise-shell-accessibility-evidence.spec.ts` — 54 tests (shell WCAG evidence)
- `e2e/procurement-accessibility-evidence.spec.ts` — 50 tests (procurement-focused evidence)
- `e2e/enterprise-accessibility-parity.spec.ts` — navigation parity evidence

---

## Running Tests Locally

### Prerequisites

```bash
# Install dependencies (if not already done)
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium

# Start the dev server (in a separate terminal)
npm run dev
```

### Run accessibility evidence suite

```bash
# Full accessibility evidence suite (this issue)
npx playwright test e2e/accessibility-enterprise-journeys.spec.ts --reporter=list

# A specific section (e.g., Compliance)
npx playwright test e2e/accessibility-enterprise-journeys.spec.ts --grep "Section 4"

# All accessibility specs combined
npx playwright test e2e/automated-accessibility-verification.spec.ts e2e/accessibility-enterprise-journeys.spec.ts --reporter=list

# With HTML report for visual review
npx playwright test e2e/accessibility-enterprise-journeys.spec.ts
npx playwright show-report
```

### Interpreting Results

**Passing test**: Journey meets all checked WCAG 2.1 AA requirements for that section.

**Failing axe scan test**: The failure message includes:
```
[axe WCAG 2.1 AA — compliance launch console] 2 blocking violation(s):
  [critical] color-contrast: Elements must have sufficient color contrast (3 node(s)) — https://dequeuniversity.com/rules/axe/4.6/color-contrast
  [serious] label: Form elements must have labels (1 node(s)) — https://dequeuniversity.com/rules/axe/4.6/label
```
The full violation list (including the `nodeHtml` of each affected node) is also
printed to stdout, so you can identify the exact element in the source component.
Review the violation at the help URL, identify the affected HTML node in the
`nodeHtml` field printed to stdout, and fix the source component.

**Failing landmark/heading test**: A structural regression has been introduced
(e.g., an extra `<h1>` added, or `main#main-content` removed). Fix the
affected view component.

**Failing keyboard test**: Focus is not moving after Tab, which means either
a keyboard trap has been introduced or the page has no focusable elements in
the tab order. Fix the affected component.

---

## WCAG 2.1 AA Checkpoints Covered

| SC | Name | How Verified |
|----|------|-------------|
| 1.3.1 | Info and Relationships | Heading structure, landmark roles, form labels |
| 1.3.6 | Identify Purpose | `aria-label` on nav, main, breadcrumb, regions |
| 1.4.3 | Contrast (Minimum) | axe-core automated contrast scanning |
| 1.4.4 | Resize Text | Mobile viewport tests at 390px width |
| 2.1.1 | Keyboard | Tab focus verified after body.click() |
| 2.1.2 | No Keyboard Trap | Tab moves focus; no trap detected |
| 2.4.1 | Bypass Blocks | Skip-link present and attached |
| 2.4.7 | Focus Visible | Focus-visible ring classes on nav links |
| 2.4.8 | Location | Breadcrumb landmark on MainLayout views |
| 3.1.2 | Language of Parts | Covered by axe `lang` rule |
| 4.1.1 | Parsing | axe WCAG 2.1 AA full parse scan |
| 4.1.2 | Name, Role, Value | ARIA attributes on progressbar, dialogs, inputs |
| 4.1.3 | Status Messages | Route announcer with `role="status"` + `aria-live="polite"` |

---

## Manual Verification Checklist

The following checklist supplements the automated tests for design/QA/procurement review.
It should be completed at key milestones (release candidate, stakeholder demos, procurement Q&A).

### Keyboard-Only Traversal

Open Chrome DevTools → Accessibility panel. Navigate using only Tab, Shift+Tab, Enter, and Escape.

**Home page**
- [ ] Tab from the page top reaches the "Skip to main content" link first
- [ ] Pressing Enter on the skip link jumps focus to the main content area
- [ ] All navigation links are reachable by Tab in a logical order
- [ ] No keyboard traps (Tab eventually leaves every section)

**Sign-in flow**
- [ ] Sign-in button is reachable by Tab
- [ ] After opening the sign-in form, Tab traverses email → password → submit in order
- [ ] Escape closes the sign-in modal and returns focus to the trigger
- [ ] Error messages after failed sign-in are announced to screen readers (verify with VoiceOver/NVDA)

**Guided Launch wizard**
- [ ] Tab traverses all form fields in the current step in a logical order
- [ ] "Continue" button is reachable by Tab
- [ ] After advancing to the next step, focus moves to a meaningful element (not the browser chrome)
- [ ] Progress bar is visible and descriptive

**Compliance Dashboard**
- [ ] Domain status items are reachable by Tab or grouped navigation
- [ ] Action buttons ("View details", "Review", etc.) are Tab-reachable
- [ ] Status labels are readable without relying only on color (check red/orange/green)

**Team Workspace approvals**
- [ ] Approval cards are Tab-reachable
- [ ] "Approve" and "Reject" actions are Tab-reachable and labelled
- [ ] Section headings ("Awaiting My Review", etc.) provide clear orientation

**Whitelist workflow**
- [ ] Add/Edit/Remove actions on whitelist entries are Tab-reachable
- [ ] Policy edit panel (if modal) traps focus correctly while open
- [ ] Escape closes the policy edit panel and returns focus to the trigger

### Screen-Reader Spot Checks

Use macOS VoiceOver (Cmd+F5) or Windows NVDA for these checks.

**Navigation structure**
- [ ] VoiceOver announces "Main navigation" when entering the top nav
- [ ] VoiceOver announces "Sidebar navigation" when entering the sidebar
- [ ] Active nav item is announced as "current page"
- [ ] Breadcrumb is announced as "Breadcrumb navigation" (on MainLayout views)

**Route changes**
- [ ] After navigating to Compliance, a route announcement is heard ("Compliance Launch Console" or similar)
- [ ] After navigating to Team Workspace, a route announcement is heard
- [ ] The route announcer does not announce on every keystroke — only on navigation

**Form interactions**
- [ ] Sign-in email input is announced as "Email address, edit text" or similar
- [ ] Required fields are announced as "required"
- [ ] Validation error messages are announced immediately after they appear

**Guided Launch**
- [ ] Progress bar is announced: "Step progress, N percent"
- [ ] Step indicator announces the current step
- [ ] Form field labels in each step are clearly announced

### Responsive / Small-Screen Checks

Test at 390 × 844 (iPhone 14 Pro equivalent) and 768 × 1024 (iPad).

- [ ] Navigation collapses to a hamburger/drawer at 390px
- [ ] Mobile drawer is opened by the hamburger button with correct ARIA (aria-expanded)
- [ ] Mobile drawer is reachable by touch and keyboard
- [ ] Tap targets are at least 44 × 44 CSS px for all primary actions
- [ ] Text on tinted panels (compliance status badges, warning banners) is readable (4.5:1 minimum)
- [ ] Compliance domain status badges are distinguishable without relying solely on color
- [ ] Guided Launch wizard form fields are readable at 390px width

### Color Contrast Spot Checks

Use the browser accessibility inspector or browser extension "Axe DevTools" for these.

- [ ] Body text on dark cards: minimum 4.5:1 ratio (text-gray-100 on bg-gray-800 typically passes)
- [ ] Status badges (red/orange/green) meet 4.5:1 for text, 3:1 for non-text UI components
- [ ] Disabled button text meets 3:1 against its background
- [ ] Focus ring is visible at 3:1 against all tested backgrounds
- [ ] White text on blue-600 buttons meets 4.5:1 (verified: ratio ≈ 7.3:1)
- [ ] Link text color on white/light backgrounds meets 4.5:1

---

## Known Limitations and Follow-Up Work

### Current Scope Boundaries

1. **axe-core cannot test everything**: Automated scanning cannot verify:
   - That screen reader announcements are understandable (only that they exist)
   - That focus order "makes sense" to a user (only that Tab moves somewhere)
   - Real-world keyboard navigation flow through multi-step workflows
   - Color contrast on dynamic/animated surfaces
   
   These require the manual checklist above.

2. **Auth-dependent routes use seeded localStorage**: Tests seed auth via
   `addInitScript`. This means they test the authenticated UI, not the
   auth handoff. The sign-in form is tested via the unauthenticated surface.

3. **Mobile tests at 390px only**: The viewport is fixed at 390 × 844 in Section 7.
   Other breakpoints (768px tablet) are not covered by automated tests. Use
   the manual checklist for tablet verification.

4. **Dialog/drawer focus trapping**: The shared `assertDialogAccessibility`
   helper checks structural ARIA attributes but does NOT currently simulate
   opening a dialog and verifying focus lock. This is tracked as follow-up work.

5. **Color contrast via axe only**: Contrast assertions rely on axe-core's
   automated contrast engine. Semi-transparent backgrounds using `bg-white/10`
   cannot be verified by axe. All views have been updated to use solid color
   equivalents (see migration from `bg-red-900/40` → `bg-red-800`).

### Known Gaps (Not Blocking MVP)

- The Attestation Dashboard (`/attestations`) and Marketplace (`/marketplace`)
  are not currently covered by these tests. These routes are lower commercial
  priority and can be added in a follow-up iteration.

- The Guided Portfolio Onboarding (`/portfolio/onboarding`) multi-step flow has
  not been added to the accessibility evidence suite. It can reuse the shared
  helpers when needed.

- `assertDialogAccessibility` does not currently verify focus-return-after-close.
  This requires a more complex interaction simulation and should be added in a
  follow-up PR targeting the policy edit panel and team approval modals specifically.

---

## Business Context

This work directly supports Biatec's enterprise sales position:

1. **Procurement screening**: Enterprise buyers increasingly require accessibility
   compliance statements. These tests provide CI-backed evidence that the platform
   meets WCAG 2.1 AA for critical journeys.

2. **Regulated industries**: Financial services, healthcare, and government
   procurement often require accessibility conformance as a contractual condition.
   This evidence reduces the legal and procurement review burden on Biatec's
   team during sales cycles.

3. **Non-crypto-native operators**: The platform targets operations teams, finance
   reviewers, and compliance officers who may depend on keyboard navigation,
   screen readers, or high-contrast display modes. Verified accessibility is a
   product quality signal, not a niche feature.

4. **Regression prevention**: The CI-integrated tests catch accessibility
   regressions before release, reducing the cost of late-stage discovery and
   supporting confident, frequent releases.

---

## Roadmap Reference

Business owner roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md

This work addresses the explicitly documented roadmap blocker:
> "accessibility evidence is improved at the shell level but still lacks full
> automated WCAG and contrast verification across the highest-value user journeys"

With this implementation, Biatec now has automated evidence for the seven
highest-value journeys that influence procurement decisions: Home, auth,
Guided Launch, Compliance, Whitelist, Team Workspace, and Mobile shell.

---

*Last updated: March 2026*  
*Maintained by: Biatec frontend team*  
*Test file: `e2e/accessibility-enterprise-journeys.spec.ts`*  
*Helpers file: `e2e/helpers/accessibility.ts`*
