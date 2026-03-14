# Screen-Reader Review Workflow
## Biatec Tokens — How to Repeat the Manual Accessibility Review

**Version**: 1.0  
**Audience**: Frontend engineers, QA specialists, release managers, accessibility reviewers  
**Purpose**: Step-by-step instructions for reproducing the structured manual screen-reader
review documented in `SCREEN_READER_REVIEW_ARTIFACT.md`.

---

## Why This Document Exists

The screen-reader evidence recorded in `SCREEN_READER_REVIEW_ARTIFACT.md` was produced
through a structured manual walkthrough. Without clear instructions, that review becomes
one-off tribal knowledge that cannot be repeated or updated reliably. This document turns
the review into a repeatable, verifiable process that any frontend engineer or QA specialist
can follow before each release.

The evidence produced by this workflow supports:

- Product-owner sign-off on accessibility readiness
- Enterprise procurement review claims
- Regression detection when covered journeys are modified

---

## Prerequisites

### Hardware and operating system

| Reviewer OS | Recommended AT | Browser |
|-------------|---------------|---------|
| Windows 10 or 11 | NVDA 2024.x (free) | Google Chrome (latest stable) |
| macOS 13 Sonoma or newer | VoiceOver (built-in) | Safari (latest) |
| iOS 16+ (mobile parity) | VoiceOver (built-in) | Safari |

Performing the review on both Windows/NVDA and macOS/VoiceOver is preferred because
the two AT + browser combinations expose different announcement behaviours. At minimum,
perform the primary review on **NVDA + Chrome** and note any macOS/VoiceOver differences
in the artifact.

### Software

1. **NVDA** (Windows only): Download from https://www.nvaccess.org/download/  
   Version 2024.1 or later is required.
2. **Node.js 20+** and **npm 10+** to run the Biatec Tokens development server.
3. **Chrome** latest stable channel.
4. **Optional — NVDA Speech Viewer**: Enabled in NVDA menu → Tools → Speech Viewer.
   Provides a scrollable log of everything NVDA announces, useful for capturing
   exact text without relying on memory.

---

## Environment Setup

### 1. Start the development server

```bash
# From the repository root
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. Wait for "VITE ready" in the terminal.

### 2. Seed authentication (skip wallet connector prompts)

Biatec Tokens uses email/password authentication only — no wallet connector is needed.
Open `http://localhost:5173` in Chrome and sign in with a test account. If you do not
have a live backend, seed the auth state directly in the browser console:

```javascript
localStorage.setItem('algorand_user', JSON.stringify({
  address: 'TESTADDR7BIATEC7SCREENREADER7REVIEW7AAAAAAAAAAAAAAAAAAAAAAAAAA',
  email: 'reviewer@biatec.io',
  isConnected: true
}));
localStorage.setItem('theme', 'dark');
location.reload();
```

> **Dark mode is required.** Biatec Tokens is a dark-mode-first product. Always review
> in dark mode to ensure colour contrast is measured against the correct background.

### 3. Enable NVDA (Windows) or VoiceOver (macOS)

**NVDA**:
- Launch NVDA (Ctrl + Alt + N or from Start menu).
- NVDA announces "NVDA started".
- Open NVDA Speech Viewer (NVDA menu → Tools → Speech Viewer) for a written log.
- NVDA starts in browse mode by default on web pages.

**VoiceOver (macOS)**:
- Press Cmd + F5 (or triple-click Touch ID on laptops) to toggle VoiceOver on.
- Use VO key (Caps Lock or Ctrl + Option) with arrow keys to navigate.
- Open Rotor with VO + U to access headings and landmarks.

### 4. Set zoom to 100%

Start at 100% browser zoom. Record any overflowing or missing elements. Repeat critical
checks at 200% zoom before marking the review complete.

---

## Review Order

Complete all six journeys in the order below. The order follows the typical operator task
sequence from sign-in through team collaboration.

| # | Journey | Route | Estimated time |
|---|---------|-------|---------------|
| 1 | Sign-in and auth guard recovery | `/` (unauthenticated) | 10 min |
| 2 | Compliance Launch Console overview | `/compliance/launch` | 10 min |
| 3 | Compliance policy dashboard | `/compliance/policy` | 15 min |
| 4 | Compliance setup workspace | `/compliance/setup` | 15 min |
| 5 | Whitelist management | `/compliance/whitelists` | 10 min |
| 6 | Team workspace reviewer queues | `/team/workspace` | 15 min |

Total: approximately 75 minutes for a complete review pass.

---

## Per-Journey Review Steps

For each journey below, follow the universal sequence plus any journey-specific steps.

### Universal sequence (apply to every journey)

1. Navigate to the route.  
2. Note the page title announced on load.  
3. Press **Tab** once — confirm the "Skip to main content" link is the first element announced.  
4. Press **H** (NVDA) / VO+CMD+H (VoiceOver) to iterate headings — record each h1, h2, h3.  
5. Press **D** (NVDA) / VO+U → Landmarks (VoiceOver) — record all landmark regions and labels.  
6. Tab through all interactive controls — record each announced accessible name.  
7. Complete the primary action for the journey (listed per journey below).  
8. Listen for the post-action announcement — confirm it is specific and polite.  
9. Verify focus placement after the action.  
10. Press **Tab** to the last control — confirm no keyboard trap; Escape should work in dialogs.

Record all observations in `SCREEN_READER_REVIEW_ARTIFACT.md` using the severity table in
`SCREEN_READER_REVIEW_CHECKLIST.md`.

---

### Journey 1: Sign-in and auth guard recovery

**Route**: `http://localhost:5173/` (unauthenticated, in a fresh browser session)

**Before this journey**: Clear the seeded auth localStorage so the page shows unauthenticated state:

```javascript
localStorage.removeItem('algorand_user');
location.reload();
```

**Primary task**: Locate and complete the email/password sign-in form.

**Journey-specific steps**:
1. Activate the "Sign In" button (Enter or Space).
2. Verify the auth modal is announced as a `dialog` or `alertdialog`.
3. Confirm focus moves inside the dialog automatically.
4. Navigate to the Email field — verify its label is "Email" (not just placeholder).
5. Navigate to the Password field — verify its label is "Password".
6. Enter invalid credentials and submit — verify a `role="alert"` error is announced.
7. Enter valid credentials and submit.
8. Verify the modal closes and focus returns to a logical element in the authenticated page.

**Key checks**:
- `<dialog>` or `role="dialog"` announced
- Labels via `for`/`id` wiring (not placeholder alone)
- Error message has `role="alert"` (assertive announcement)
- Focus returns to main content area after sign-in

---

### Journey 2: Compliance Launch Console overview

**Route**: `http://localhost:5173/compliance/launch`

**Primary task**: Navigate to the compliance readiness overview and understand the readiness score.

**Journey-specific steps**:
1. Navigate headings — confirm exactly one h1 describes the page purpose.
2. Navigate to the readiness score element — verify `role="meter"` is announced with a percentage.
3. Navigate to the primary CTA (e.g., "Begin Compliance Setup") — confirm it has a descriptive label.
4. Navigate the compliance domain cards — verify each card heading is at h3 or h2 level.

**Key checks**:
- Single h1 (no duplicate h1 from Navbar logo — Navbar must use `<span>`, not `<h1>`)
- Readiness meter announces percentage value
- No "Not connected" or wallet connector text

---

### Journey 3: Compliance policy dashboard

**Route**: `http://localhost:5173/compliance/policy`

**Primary task**: Review the investor category table and understand the allowed/blocked jurisdictions.

**Journey-specific steps**:
1. Navigate to the investor category table using Tab or heading navigation.
2. Verify the table is announced with its `aria-label` ("Investor category rules").
3. Navigate column headers — each should announce its `scope="col"` attribution and label.
4. Navigate table cells — confirm values are readable in row/column order.
5. Navigate the jurisdiction chips — verify jurisdiction names are announced (not just colours).
6. Activate the "Edit Policy" button — confirm it opens the edit panel and focus moves inside.
7. Close the edit panel — verify focus returns to the "Edit Policy" button.

**Key checks**:
- `role="table"` announced with `aria-label`
- `<th scope="col">` headers accessible in reading order
- No colour-only status indicators
- Dialog/panel focus trap and return

---

### Journey 4: Compliance setup workspace

**Route**: `http://localhost:5173/compliance/setup`

**Primary task**: Navigate the wizard steps and understand the current step and progress.

**Journey-specific steps**:
1. Note the progress bar — verify `role="progressbar"` with `aria-valuenow` is announced.
2. Navigate wizard step buttons — verify `aria-current="step"` is on the active step.
3. Complete a wizard step form — verify all labels are announced and required fields are identified.
4. Move to the next step — verify the h2 heading updates to describe the new step.
5. Navigate the readiness summary — verify completeness percentages are announced.

**Key checks**:
- `role="progressbar"` with correct `aria-valuenow` (at initial state this is 0 — the element is in DOM even if visually zero-width)
- `aria-current="step"` on the active wizard step button
- Step heading (h2) updates when step changes
- Form labels are `for`/`id` associated (not proximity only)

---

### Journey 5: Whitelist management

**Route**: `http://localhost:5173/compliance/whitelists`

**Primary task**: Review the list of whitelist entries and understand the associated policy status.

**Journey-specific steps**:
1. Navigate headings — confirm h1 announces the whitelist management page title.
2. Tab to the "Add Entry" or equivalent primary action — verify the button label is descriptive.
3. Navigate the whitelist list — verify each entry has an announced name and status.
4. If a table is present, navigate column headers — verify `scope="col"` headers announce each column.
5. Activate a row action button (Edit, Delete) — confirm the button label includes the entry name.

**Key checks**:
- Single unambiguous h1
- Row action buttons include item identifier in accessible name
- Status values are text (not colour-only)
- Table headers present with `scope="col"` if tabular data is used

---

### Journey 6: Team workspace reviewer queues

**Route**: `http://localhost:5173/team/workspace`

**Primary task**: Understand the queue sections, review a work item, and approve it.

**Journey-specific steps**:
1. Navigate headings — locate the three queue section headings (Awaiting Review, Assigned, Ready for Approval).
2. Navigate to the count badges next to each section heading — verify the announced value includes a meaningful description (e.g., "3 items awaiting review") and does NOT contain literal backtick characters or dollar-brace variable placeholders such as `${count}` (which would appear if the `aria-label` attribute is static and unresolved).
3. Navigate to the "Recently Completed" collapsible section — verify the `<h2>` heading is announced separately from the toggle button.
4. Activate the toggle button — verify `aria-expanded` state change is announced.
5. Navigate to a work item card — activate the "Approve" button.
6. Listen for the polite announcement from the `role="status"` live region confirming the action.
7. Verify focus after approval — confirm it moves to a logical element (the next card or section).

**Key checks**:
- Count badge announces evaluated number, not literal template syntax (`3 items`, not backtick strings)
- `<h2>` is NOT nested inside `<button>` (WCAG SC 1.3.1)
- Action feedback uses `role="status" aria-live="polite"` (not `role="alert"`)
- `aria-expanded` reflects collapsed/expanded state of the toggle

---

## Recording Findings

### When to record a finding

Record an observation in `SCREEN_READER_REVIEW_ARTIFACT.md` for **every** journey step that:
- Produces an unexpected or incorrect announcement (any severity)
- Requires a correction to the existing evidence ("Last verified" date update)
- Reveals a new usability issue not previously documented

### Severity classification

| Severity | Definition | Required action before closing |
|----------|-----------|-------------------------------|
| **High** | User cannot complete primary task using AT alone | Must be fixed in the same PR |
| **Medium** | Task completion degraded; confusion or extra steps | Fix in same PR or tracked follow-up issue |
| **Low** | Minor friction; task completion unaffected | Log in artifact; address when feasible |
| **Pass** | Meets WCAG criteria and provides good experience | Document as confirmation |

### How to update the artifact

1. Open `docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md`.
2. Locate the journey section matching your finding (e.g., "Journey 6: Team Workspace").
3. Add a new row to the Observations table with:
   - A sequential ID (e.g., `6.6`)
   - A one-line description of the observation
   - Severity (High / Medium / Low / Pass)
   - Status (⚠️ Open / ✅ Resolved / Accepted)
4. If High or Medium, add a finding detail block below the table with:
   - Observed behaviour (exact AT announcement or absence of announcement)
   - WCAG criterion affected
   - Fix applied (brief code description)
   - Unit or E2E test added to prevent regression
5. Update the journey's `Last verified` date to the current date.
6. If you fixed a High or Medium finding, add the fix to the Automated Test Coverage Map.

### Mapping findings to automated tests

Every High or Medium finding that is fixed should have a corresponding unit or E2E test
that prevents regression. Add a row to the **Automated Test Coverage Map** table in
`SCREEN_READER_REVIEW_ARTIFACT.md` with:

- The finding ID (e.g., `6.3`)
- The test file (e.g., `TeamWorkspaceView.wcag.test.ts`)
- The test description (the `it()` string)

This connection between manual evidence and automated regression tests is what makes the
evidence package durable rather than one-off.

---

## After the Review

### Update the release evidence

1. Open `docs/accessibility/SCREEN_READER_RELEASE_EVIDENCE.md`.
2. Update the "Review date" in the evidence summary table for each journey reviewed.
3. If new findings were introduced and resolved, update the "What Was Found and Fixed" section.
4. If findings remain open (accepted or deferred), update the "Known Risks" section.

### Verify automated tests pass

Run the full unit test suite to confirm that any fixes introduced by the review have not
broken existing behaviour:

```bash
npm test
```

Run the accessibility-specific E2E tests (requires a running dev server):

```bash
npm run dev &
npx playwright test e2e/screen-reader-review-evidence.spec.ts --reporter=list
npx playwright test e2e/accessibility-enterprise-journeys.spec.ts --reporter=list
npx playwright test e2e/automated-accessibility-verification.spec.ts --reporter=list
```

All tests must pass before the review is considered complete and the evidence is ready
for product-owner sign-off.

### Check coverage of the Automated Test Coverage Map

Confirm that every finding with status `✅ Resolved` in the artifact has at least one
corresponding automated test. If a finding's unit or E2E test is missing, add it before
the review cycle closes.

---

## Frequency and Triggers

| Trigger | Required action |
|---------|----------------|
| Any PR that modifies a covered journey view | Author re-reviews affected journey steps, updates `Last verified` date |
| Major UI refactor touching navigation, headings, or dialogs | Full six-journey review pass |
| New enterprise journey added to product | Add journey to artifact, checklist, and this workflow |
| Before each major release | Full six-journey review pass (or confirm no covered views changed since last pass) |
| NVDA or VoiceOver major version released | Spot-check high-risk surfaces (modals, tables, live regions) for announcement changes |

---

## Relationship to Automated Coverage

This manual workflow is intentionally *additive* to, not a replacement for, the automated
Playwright accessibility coverage. The relationship is:

| Layer | Files | What it catches |
|-------|-------|----------------|
| **Automated (axe-core)** | `accessibility-enterprise-journeys.spec.ts`, `automated-accessibility-verification.spec.ts` | Missing labels, contrast failures, duplicate landmarks, missing role attributes |
| **Automated (unit)** | `TeamWorkspaceView.wcag.test.ts`, `ComplianceLaunchConsole.test.ts`, etc. | Regression prevention for specific ARIA attributes (aria-label, role, aria-valuenow) |
| **Manual (this workflow)** | `SCREEN_READER_REVIEW_ARTIFACT.md` | Announcement order, cognitive clarity, focus placement, dynamic state narration, reading flow semantics |

Do not reduce automated coverage when adding manual evidence. The two layers are
complementary — automated tests prevent regressions, manual review surfaces usability
nuances that tools cannot detect.

---

## Related Files

| File | Purpose |
|------|---------|
| `docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md` | Findings record from all six journeys |
| `docs/accessibility/SCREEN_READER_REVIEW_CHECKLIST.md` | Concise per-page checklist (category-based) |
| `docs/accessibility/SCREEN_READER_RELEASE_EVIDENCE.md` | Release summary for product-owner sign-off |
| `docs/accessibility/PROCUREMENT_ACCESSIBILITY_EVIDENCE.md` | Automated evidence package (axe, unit, E2E) |
| `docs/accessibility/UX_ACCESSIBILITY_CONVENTIONS.md` | Developer conventions for WCAG 2.1 AA |
| `e2e/screen-reader-review-evidence.spec.ts` | E2E regression tests for findings 6.3–6.5 |
| `e2e/accessibility-enterprise-journeys.spec.ts` | Broad axe-based E2E accessibility coverage |
| `src/views/__tests__/TeamWorkspaceView.wcag.test.ts` | Unit WCAG tests (findings 6.3–6.5) |
| `src/views/__tests__/WhitelistPolicyDashboard.test.ts` | Unit WCAG tests (finding 3.5 — table headers) |

---

*Maintained by: Biatec frontend team*  
*First review cycle: March 2026*  
*Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md*
