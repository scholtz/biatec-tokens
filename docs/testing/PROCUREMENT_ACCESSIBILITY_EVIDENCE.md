# Procurement-Grade Accessibility Evidence

## Overview

This document describes the automated and manual accessibility verification evidence for Biatec Tokens' highest-value enterprise user journeys. It serves as the primary reference for procurement reviewers, compliance stakeholders, and accessibility auditors evaluating Biatec as an enterprise platform.

**Status:** Active — automated evidence verified in CI  
**Last Updated:** March 2026  
**Related PR:** #620 (Add procurement-grade accessibility evidence)  
**Automated Spec:** `e2e/procurement-accessibility-evidence.spec.ts`  
**Prior Evidence:** `e2e/automated-accessibility-verification.spec.ts`, `e2e/enterprise-shell-accessibility-evidence.spec.ts`

---

## Automated Coverage Summary

### axe-core WCAG 2.1 AA Scans

The `procurement-accessibility-evidence.spec.ts` spec runs automated axe-core scans on all six highest-value routes. Each scan covers WCAG 2.1 Level A and AA success criteria (`wcag2a`, `wcag2aa`, `wcag21aa` tag sets).

| Route | Path | axe Scan | Notes |
|---|---|---|---|
| Home (unauthenticated) | `/` | ✅ | Sign-in surface, landing entry module |
| Home (authenticated) | `/` | ✅ | Dashboard, feature cards, nav |
| Guided Launch | `/launch/guided` | ✅ | Standalone wizard — no MainLayout nav |
| Compliance Launch Console | `/compliance/launch` | ✅ | Readiness, domain status, blockers |
| Compliance Setup Workspace | `/compliance/setup` | ✅ | Multi-step compliance setup |
| Team Workspace | `/team/workspace` | ✅ | Approval workflow, work items |
| Operations | `/operations` | ✅ | Business command center |
| Settings | `/settings` | ✅ | Form inputs, toggles, save |

**Violation threshold:** Only `critical` and `serious` impact violations cause test failure. `moderate` and `minor` violations are logged to CI artifacts for review.

### Enterprise Trust Surface Assertions

In addition to axe-core scans, the spec verifies accessibility patterns on specific trust surfaces that enterprise decision-makers interact with:

| Surface | Test Coverage |
|---|---|
| Compliance readiness meter (`role="meter"`) | aria-label, ARIA meter semantics |
| Compliance blocker count (`role="status"`) | role=status verified |
| Compliance domain status items | aria-label per domain verified |
| Compliance review summary | role=contentinfo / aria-label verified |
| Team Workspace approval sections | aria-labelledby for each section |
| Team Workspace loading/error state | role=status / role=alert verified |
| Team Workspace completed items toggle | aria-expanded verified |
| Operations breadcrumb | aria-label="Breadcrumb", aria-current="page" scoped |
| Operations live regions | aria-live / role=status count > 0 |
| Settings form inputs | label association (for / aria-label / aria-labelledby) |
| Guided Launch progress bar | role=progressbar, aria-valuenow/min/max |
| Guided Launch error banner | role=alert in DOM (even when empty) |
| Shell route announcer | aria-live="polite", aria-atomic="true" |

### Keyboard-Only Access Verification

The spec verifies that all critical enterprise routes are keyboard-navigable:

| Route | Tab Focus Test | Focus-Visible Ring | Skip Link |
|---|---|---|---|
| Home | ✅ | ✅ (desktop nav links) | ✅ (first Tab target) |
| Team Workspace | ✅ | (inherited from shell) | (inherited from shell) |
| Compliance Launch Console | ✅ | (inherited from shell) | (inherited from shell) |

**Note:** Keyboard tests use `body.click()` before `Tab` in headless mode (required per Section 7l of contributor guidelines).

### Shell / Navigation Accessibility

Evidence from three overlapping specs:

1. `enterprise-shell-accessibility-evidence.spec.ts` — 54 tests covering mobile menu keyboard, skip-link, user menu ARIA, desktop nav focus-visible rings, no-wallet UI, semantic structure
2. `automated-accessibility-verification.spec.ts` — 10 sections covering per-route WCAG assertions for all 6 enterprise routes
3. `procurement-accessibility-evidence.spec.ts` — axe-core WCAG 2.1 AA scans plus trust-surface ARIA verification

---

## Manual Screen-Reader Review Guidance

### How to Conduct a Screen-Reader Review

The following screen-reader environments are recommended for manual review:

| Platform | Screen Reader | Browser |
|---|---|---|
| macOS | VoiceOver (built-in) | Safari or Chrome |
| Windows | NVDA (free) | Firefox or Chrome |
| Windows | JAWS (enterprise) | Chrome or Edge |
| iOS | VoiceOver (built-in) | Safari |
| Android | TalkBack (built-in) | Chrome |

**Recommended review path:** Follow the business-user onboarding journey described below.

---

### Journey 1: Sign In and Shell Navigation

**Goal:** Verify that a screen reader user can understand and navigate the application shell from the home page.

**Steps:**
1. Open `https://tokens.biatec.io/` with screen reader active.
2. Verify page title is announced correctly (WCAG SC 2.4.2).
3. Tab to the "Skip to main content" link — verify it is announced and functional.
4. Navigate to main content via the skip link — verify focus lands on main content area.
5. Navigate the primary nav (Navbar) using Tab and arrow keys.
6. Verify each nav item has a meaningful accessible name.
7. On mobile viewport (375px), open the hamburger menu — verify:
   - `aria-expanded` is announced as `expanded`/`collapsed`
   - Menu items are reachable via Tab
   - Escape key closes the menu and restores focus to the toggle
8. Verify the user menu button announces its accessible name.
9. Open user menu — verify `role=menu` items are navigable with arrow keys.

**Expected SR output examples:**
- Skip link: *"Skip to main content, link"*
- Nav landmark: *"Main navigation, navigation"*
- Sidebar: *"Sidebar navigation, navigation"*
- Mobile menu toggle: *"Open navigation menu, button"* or *"Close navigation menu, button"*
- Page transition (route announcer): *"Navigated to Operations"*

**Pass criteria:**
- All nav destinations are announced with meaningful names
- Skip link reaches main content on activation
- Mobile menu closes on Escape and focus returns to trigger
- Route announcer fires politely on navigation

---

### Journey 2: Guided Token Launch Wizard

**Goal:** Verify that an enterprise operator can understand and complete the guided token launch wizard with a screen reader.

**Steps:**
1. Navigate to `/launch/guided` while authenticated.
2. Verify h1 heading is announced (WCAG SC 1.3.1).
3. Verify the step indicator navigation is announced as a landmark.
4. Verify the progress bar conveys current progress: *"Progress bar, X of 100"* or equivalent.
5. Navigate through each form field:
   - Verify each input/select has a spoken label (WCAG SC 1.3.1)
   - Verify required fields are announced as required
   - Verify validation errors are announced via `role=alert` or `aria-live`
6. Tab to the "Continue" button — verify it is announced and keyboard-activatable.
7. Trigger a validation error — verify error message is announced via live region.

**Expected SR output examples:**
- Heading: *"Token Launch Wizard, heading level 1"*
- Step nav: *"Step progress, navigation"*
- Progress bar: *"0 percent, progress bar"*
- Error: *"[Error message text], alert"* (announced immediately)

**Pass criteria:**
- Each step heading is clear and descriptive
- Progress bar state is communicated to SR users
- Validation errors are announced without requiring focus change
- Continue button is labeled and reachable

---

### Journey 3: Compliance Policy Review

**Goal:** Verify that a compliance officer can review token compliance status and understand readiness decisions.

**Steps:**
1. Navigate to `/compliance/launch` while authenticated.
2. Verify h1 heading announces the compliance view name.
3. Navigate to the readiness banner — verify overall readiness score is readable.
4. Navigate to domain status items:
   - Verify each domain announces its label and status (e.g., *"Identity: compliant"*)
   - Verify blockers are announced via `role=alert` or `aria-live`
5. Navigate to the compliance actions — verify CTA button labels make sense without context.
6. Navigate to the review summary section — verify it is discoverable as a distinct region.

**Expected SR output examples:**
- Readiness meter: *"Overall compliance readiness: 85% complete, meter"*
- Domain item: *"Identity: compliant"*
- Blocker count: *"2 blockers must be resolved, status"*
- Primary CTA: *"Launch Token — all compliance requirements are met, button"*

**Pass criteria:**
- Compliance decisions are understandable without visual context
- Domain status labels are complete and unambiguous
- Blockers are surfaced via appropriate live regions
- Actions are self-describing in isolation

---

### Journey 4: Team Workspace Approval Workflow

**Goal:** Verify that a team operator can navigate and understand the approval workflow with a screen reader.

**Steps:**
1. Navigate to `/team/workspace` while authenticated.
2. Verify h1 heading is announced.
3. Navigate the workflow summary counts — verify counts are labeled.
4. Navigate to "Awaiting My Review" section:
   - Verify section heading is present and announced
   - Verify work item cards are navigable and have accessible names
   - Verify approval/review action buttons have self-describing labels
5. Navigate to the "Completed" section toggle — verify `aria-expanded` state is announced.
6. Expand the completed section — verify items are accessible.

**Expected SR output examples:**
- Summary: *"Workflow summary counts, region"* then *"3 items awaiting review"*
- Section: *"Awaiting My Review, heading level 2"*
- Toggle: *"Show completed (N), expanded, button"*

**Pass criteria:**
- Workflow sections are distinct and discoverable
- Work item counts and statuses are communicated to SR users
- Toggle state (expanded/collapsed) is announced on change
- Action buttons are self-describing

---

### Journey 5: Settings and Account Configuration

**Goal:** Verify that enterprise operators can configure settings using a screen reader.

**Steps:**
1. Navigate to `/settings` while authenticated.
2. Verify h1 heading is announced.
3. Tab through form inputs — verify each has a spoken label.
4. Navigate to the "Active Network" radio group — verify `<fieldset>` and `<legend>` are announced.
5. Find the "Demo Mode" toggle — verify current pressed state is announced.
6. Navigate to the "Save Settings" button — verify it is labeled and reachable.

**Expected SR output examples:**
- Input: *"Algod URL, text field"*
- Radio group: *"Active Network, group"* then *"Algorand Mainnet, radio button, 1 of 4"*
- Toggle: *"Demo Mode, toggle button, pressed"* or *"not pressed"*
- Save: *"Save Settings, button"*

**Pass criteria:**
- All form inputs have spoken labels
- Radio group uses fieldset+legend
- Toggle button communicates current state
- Save button is reachable by keyboard and self-describing

---

## Coverage Boundary

### What is Automated

| Category | Coverage |
|---|---|
| WCAG 2.1 AA axe-core violations (critical/serious) | ✅ All 6 enterprise routes + home |
| Landmark structure (nav, main, header, aside) | ✅ Verified per route |
| Heading hierarchy (single h1, no duplicates) | ✅ Per route |
| Skip-to-main-content link | ✅ Present and targets #main-content |
| Route announcer (aria-live=polite, aria-atomic) | ✅ Verified on MainLayout routes |
| ARIA attributes on trust surfaces (meter, status, alert, progressbar) | ✅ Per surface |
| Keyboard Tab focus reachability | ✅ Per route |
| Focus-visible ring on nav links | ✅ Desktop nav items |
| Wallet-free UI (nav text scan) | ✅ Per route |
| Mobile menu keyboard/Escape behavior | ✅ (enterprise-shell-accessibility-evidence.spec.ts) |

### What Requires Manual Review

| Category | Status | Guidance |
|---|---|---|
| Screen reader pronunciation of custom content | Manual | See Journeys 1–5 above |
| Focus order within complex forms (step-by-step correctness) | Manual | Review Guided Launch with VoiceOver/NVDA |
| Color contrast ratios (beyond axe-core automated check) | Partially automated (axe) | Review dark-mode compliance panels manually |
| Cognitive load and understandability for non-technical operators | Manual | Review Compliance and Team Workspace journeys |
| Touch-only and mobile screen reader (iOS VoiceOver + Safari) | Manual | Swipe navigation on 375px viewport |
| Animation and motion preferences | Manual | Verify `prefers-reduced-motion` media query respected |
| Timeout and session warning accessibility | Manual | Verify any session expiry dialogs are announced |

### Known Limitations and Technical Notes

1. **axe-core false positives:** The axe-core color-contrast rule can produce false positives for text rendered inside CSS gradient clips (`bg-clip-text text-transparent`). Biatec's branding uses this pattern for hero text. Visual inspection confirms legibility, but axe may flag these depending on browser rendering. These are excluded from CI failure by the `critical/serious` impact filter (they typically report as `moderate`).

2. **Dynamic data states:** axe-core scans run immediately after page load. Some compliance domain statuses, approval counts, and readiness scores require async data fetch to populate. Scans may see loading-state UI rather than loaded UI. This is intentional — loading states must also be accessible.

3. **Standalone wizard view:** `/launch/guided` (GuidedTokenLaunch.vue) does not use MainLayout. It has its own `<main>` and step-indicator nav. Tests on this route must not assert `nav[aria-label="Main navigation"]` — that landmark only exists on MainLayout-wrapped views.

4. **Contrast ratios:** Tailwind CSS classes use known contrast-safe colors. Dark mode (`bg-gray-900`/`text-white`) passes AA at all standard sizes. Trust surface badge colors (green, amber, red) are tested by axe-core's color-contrast rule automatically.

---

## Business Value

This accessibility evidence layer directly reduces the following commercial risks:

1. **Procurement friction:** Enterprise buyers now have automated WCAG 2.1 AA evidence they can include in accessibility statements and vendor assessments.
2. **Demo and trial confidence:** Compliance teams, operations managers, and accessibility reviewers who join evaluations after initial discovery can verify the product meets their requirements.
3. **Support cost reduction:** Stronger landmarks, clearer live-region announcements, and verified contrast patterns reduce confusion and misnavigation by non-technical operators.
4. **Regression prevention:** axe-core scans run in CI on every push, so future feature additions cannot silently break accessibility on the highest-value routes.
5. **Platform credibility:** The combination of automated CI evidence and structured manual review guidance positions Biatec as an accessibility-conscious regulated platform — consistent with its democratization mission.

---

## Updating This Document

When adding new routes or enterprise UI surfaces:

1. Add the route to `e2e/procurement-accessibility-evidence.spec.ts` with an axe scan section.
2. Add the route to `e2e/global-setup.ts` pre-warmup list.
3. Add manual review guidance for any new high-value user journeys.
4. Update the automated coverage table above.
5. Note any known limitations or exclusions in the "Known Limitations" section.
