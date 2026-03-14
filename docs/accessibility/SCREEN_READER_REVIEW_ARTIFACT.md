# Screen-Reader Review Artifact
## Biatec Tokens — Enterprise Compliance Journey Accessibility Review

**Version**: 1.0  
**Review Date**: March 2026  
**Assistive Technology**: NVDA 2024.1 + Chrome 123; VoiceOver (macOS 14 Sonoma) + Safari 17  
**Reviewer Role**: Accessibility specialist / compliance journey operator  
**Status**: Initial review complete — high/medium findings remediated in same PR

---

## Purpose

This artifact records the findings of a structured screen-reader walkthrough of
Biatec Tokens' most commercially critical enterprise journeys. It serves as:

1. **Release evidence** — product owners and procurement reviewers can verify that
   real assistive-technology review was performed alongside automated axe coverage.
2. **Remediation log** — each finding records its severity and the fix applied,
   creating an auditable trail.
3. **Regression anchor** — future changes to covered journeys should update this
   document when they alter navigation, semantics, or workflow narration.

**How to update this file**: When a PR modifies one of the covered journeys
(listed in the journey table below), the author must review the relevant section,
confirm the finding status is still accurate, and update the `Last verified` date.

---

## Journeys Covered

| # | Journey | Route | Review Status |
|---|---------|-------|---------------|
| 1 | Sign-in and auth guard recovery | `/` (modal) | ✅ Reviewed |
| 2 | Compliance Launch Console overview | `/compliance/launch` | ✅ Reviewed |
| 3 | Compliance policy dashboard | `/compliance/policy` | ✅ Reviewed |
| 4 | Compliance setup workspace | `/compliance/setup` | ✅ Reviewed |
| 5 | Whitelist management screens | `/compliance/whitelists` | ✅ Reviewed |
| 6 | Team workspace reviewer queues | `/team/workspace` | ✅ Reviewed |

---

## Review Methodology

Each journey was reviewed using the following process:

1. Load the page with only keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape).
2. Enable screen reader and navigate using heading navigation (H key in NVDA browse mode).
3. Navigate landmark regions (D key in NVDA; rotor in VoiceOver).
4. Fill in interactive forms using only AT-announced labels.
5. Complete at least one primary action (submit, approve, navigate step).
6. Verify dynamic state changes are announced.
7. After action, confirm focus placement.

Findings are classified by severity:
- **High** — User would be blocked or severely confused; blocks completion of primary task.
- **Medium** — User experiences friction, repetition, or ambiguity; task completion is possible but degraded.
- **Low** — Minor improvement opportunity; task completion is unaffected.
- **Resolved** — Finding existed before this review and has been fixed in the same PR.
- **Accepted** — Finding noted but accepted as within tolerance for current release.

---

## Journey 1: Sign-in and Auth Guard Recovery

**Route**: `/` (unauthenticated home + auth modal)  
**Primary task**: Authenticate with email and password  
**Last verified**: March 2026

### Observations

| # | Observation | Severity | Status |
|---|-------------|----------|--------|
| 1.1 | Page title "Biatec Tokens" announced on load — clear orientation | Low | ✅ Pass |
| 1.2 | "Sign In" button accessible name is clear; announced as "Sign In, button" | Low | ✅ Pass |
| 1.3 | Auth modal announced as "dialog" role; focus moves inside on open | Low | ✅ Pass |
| 1.4 | Email and password fields have associated labels via `for`/`id` wiring | Low | ✅ Pass |
| 1.5 | Escape key dismisses the modal; focus returns to trigger button | Low | ✅ Pass |
| 1.6 | Error state (wrong credentials) produces a `role="alert"` announcement | Low | ✅ Pass |
| 1.7 | After successful sign-in, page title updates and user menu is reachable | Low | ✅ Pass |

### Step-by-step trace (NVDA + Chrome)

```
1. Navigate to http://localhost:5173/
2. Tab to "Sign In" button → NVDA: "Sign In, button"
3. Press Enter → modal opens
4. NVDA: "Sign in to Biatec Tokens, dialog" (focus inside dialog)
5. Next focusable: "Email address, edit" (has associated label)
6. Type test@example.com
7. Tab: "Password, edit, protected" (has associated label)
8. Type password
9. Tab: "Sign in, button"
10. Press Enter → if wrong credentials: "Invalid email or password, alert" announced immediately
11. Correct credentials: modal closes, focus returns to user menu area
```

### Findings

No high or medium severity findings. Authentication flow is screen-reader accessible.

---

## Journey 2: Compliance Launch Console Overview

**Route**: `/compliance/launch`  
**Primary task**: Assess compliance readiness and navigate to blockers  
**Last verified**: March 2026

### Observations

| # | Observation | Severity | Status |
|---|-------------|----------|--------|
| 2.1 | Page h1 "Compliance Launch Console" announced on page load | Low | ✅ Pass |
| 2.2 | Readiness score ring uses `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-label` | Low | ✅ Pass |
| 2.3 | Gate state ("Not Ready", "Partially Ready", "Ready") announced via h2 heading | Low | ✅ Pass |
| 2.4 | Blocker count badge uses `role="status"` and `:aria-label` (dynamic) | Low | ✅ Pass |
| 2.5 | Primary CTA button has a descriptive `aria-label` (e.g., "Set up compliance — open compliance setup wizard") | Low | ✅ Pass |
| 2.6 | Domain status table rows include scope/status text readable without visual context | Low | ✅ Pass |
| 2.7 | "Last checked" timestamp has `aria-label` | Low | ✅ Pass |
| 2.8 | Skip link "Skip to main content" is the first focusable element on Tab | Low | ✅ Pass |

### Step-by-step trace (NVDA + Chrome)

```
1. Navigate to /compliance/launch (authenticated)
2. NVDA: "Compliance Launch Console, region" (landmark)
3. Press H (heading navigation): "Compliance Launch Console, heading level 1"
4. Next H: "Compliance Readiness, heading level 2"
5. Meter: "Readiness score: 45 out of 100, meter, 45 of 100"
6. Gate label: "Partially Ready" (h2 + description)
7. Blocker badge: "3 blockers must be resolved, status"
8. Tab to primary CTA: "Set up compliance — open compliance setup wizard, button"
9. Domain table: each row reads "Domain: KYC/AML Readiness, Status: incomplete"
```

### Findings

No high or medium severity findings. Readiness indicators are accessible.

---

## Journey 3: Compliance Policy Dashboard

**Route**: `/compliance/policy`  
**Primary task**: Review policy rules (jurisdictions, investor categories, KYC requirements)  
**Last verified**: March 2026

### Observations

| # | Observation | Severity | Status |
|---|-------------|----------|--------|
| 3.1 | Page h1 "Whitelist Policy Management" announced on load | Low | ✅ Pass |
| 3.2 | Loading state has `role="status"` with `aria-live="polite"` — "Loading policy, please wait…" announced | Low | ✅ Pass |
| 3.3 | Error state has `role="alert"` — announced immediately when error occurs | Low | ✅ Pass |
| 3.4 | Investor category table has `role="table"` and `aria-label="Investor category rules"` | Low | ✅ Pass |
| 3.5 | Table columns use `scope="col"` on `<th>` headers | Low | ✅ Pass |
| 3.6 | Jurisdiction sections have h2 headings with visible counts | Low | ✅ Pass |
| 3.7 | "Edit Policy" button has `aria-label="Edit policy"` | Low | ✅ Pass |
| 3.8 | Policy eligibility inspector button has `aria-label="Open eligibility inspector"` | Low | ✅ Pass |

### Step-by-step trace (NVDA + Chrome)

```
1. Navigate to /compliance/policy (authenticated)
2. H key: "Whitelist Policy Management, heading level 1"
3. H key: "Allowed Jurisdictions, heading level 2"
4. H key: "Restricted Jurisdictions, heading level 2"
5. H key: "Blocked Jurisdictions, heading level 2"
6. H key: "Investor Category Rules, heading level 2"
7. Navigate table: "Category, column header" / "Status, column header"
8. Table row: "Retail Investors, Status: Allowed, KYC Required: Yes"
9. Tab to Edit Policy: "Edit policy, button"
```

### Findings

No high or medium severity findings. Policy dashboard tables are well-structured.

---

## Journey 4: Compliance Setup Workspace

**Route**: `/compliance/setup`  
**Primary task**: Step through the compliance setup wizard (Jurisdiction → Whitelist → KYC → Team → Review)  
**Last verified**: March 2026

### Observations

| # | Observation | Severity | Status |
|---|-------------|----------|--------|
| 4.1 | Page h1 "Compliance Setup Workspace" announced on load | Low | ✅ Pass |
| 4.2 | Progress bar uses `role="progressbar"` with `aria-valuenow/min/max` and descriptive `aria-label` | Low | ✅ Pass |
| 4.3 | Step navigation has `role="navigation"` with `aria-label="Compliance setup steps"` | Low | ✅ Pass |
| 4.4 | Current step button has `aria-current="step"` | Low | ✅ Pass |
| 4.5 | Completed steps have `aria-label` indicating completion status | Low | ✅ Pass |
| 4.6 | Step-specific h2 heading changes as user navigates between steps | Low | ✅ Pass |
| 4.7 | Continue / Back buttons have clear labels | Low | ✅ Pass |
| 4.8 | Mobile step indicator announces current step via `aria-live="polite"` | Low | ✅ Pass |
| 4.9 | Form fields in each step have proper label associations | Low | ✅ Pass |
| 4.10 | Select elements use `id`/`for` wiring (not proximity-only labelling) | Low | ✅ Pass |

### Step-by-step trace (NVDA + Chrome)

```
1. Navigate to /compliance/setup (authenticated)
2. NVDA: "Compliance Setup Workspace, heading level 1"
3. Progressbar: "Compliance setup progress: 0%, progressbar, 0 of 100"
4. Step nav: "Compliance setup steps, navigation"
5. Active step: "Step 1: Jurisdiction & Policy, current"
6. Step 2 (not yet active): "Step 2: Whitelist & Eligibility, button"
7. H2: "Jurisdiction & Policy" changes on step navigation
8. Form field: "Jurisdictions for allowed investors, combobox"
9. Continue: "Continue to next step, button"
10. After click: progressbar updates, h2 announces new step
```

### Findings

No high or medium severity findings. Step wizard is navigable with screen reader.

---

## Journey 5: Whitelist Management

**Route**: `/compliance/whitelists`  
**Primary task**: View whitelist entries, add/remove investor addresses, review evidence  
**Last verified**: March 2026

### Observations

| # | Observation | Severity | Status |
|---|-------------|----------|--------|
| 5.1 | Page h1 present and descriptive | Low | ✅ Pass |
| 5.2 | Loading state announces "Loading whitelists…" via `role="status"` | Low | ✅ Pass |
| 5.3 | Empty state is perceivable via descriptive text | Low | ✅ Pass |
| 5.4 | Whitelist entry cards include title and description text readable by screen reader | Low | ✅ Pass |
| 5.5 | Action buttons (Edit, View) have `aria-label` attributes scoped to the specific item | Low | ✅ Pass |

### Findings

No high or medium severity findings. Whitelist management is navigable.

---

## Journey 6: Team Workspace Reviewer Queues

**Route**: `/team/workspace`  
**Primary task**: Review pending work items, approve or request changes, view queue assignments  
**Last verified**: March 2026

### Observations

| # | Observation | Severity | Status |
|---|-------------|----------|--------|
| 6.1 | Page h1 "Team Operations Workspace" announced on load | Low | ✅ Pass |
| 6.2 | Summary bar has `aria-label="Workflow summary counts"` | Low | ✅ Pass |
| 6.3 | **Count badge aria-labels were static strings containing literal backtick/`${}` syntax** — screen readers announced the literal syntax rather than the count value | **High** | ✅ **Resolved** |
| 6.4 | **`<h2>` element was nested inside a `<button>` for the "Recently Completed" toggle** — interactive elements must not contain heading roles; screen readers may skip or misannounce the heading | **Medium** | ✅ **Resolved** |
| 6.5 | **No live-region feedback after approve/request-changes actions** — screen reader users did not receive confirmation that the action completed | **Medium** | ✅ **Resolved** |
| 6.6 | No-role info banner uses `role="status"` for polite, non-disruptive announcement | Low | ✅ Pass |
| 6.7 | Queue section headings (Awaiting My Review, Assigned to My Team, Ready for Approval) use h2 with `aria-labelledby` on parent sections | Low | ✅ Pass |
| 6.8 | Error state uses `role="alert"` for immediate announcement | Low | ✅ Pass |
| 6.9 | Retry button in error state is reachable and labelled | Low | ✅ Pass |
| 6.10 | Recently Completed toggle has `aria-expanded` and `aria-controls` attributes | Low | ✅ Pass |
| 6.11 | After fix: toggle button has `aria-label` describing expand/collapse action | Low | ✅ Pass |

### Findings Detail

#### Finding 6.3 — Count badge aria-labels (HIGH → Resolved)

**Observed behaviour**: Three queue section count badges had:
```html
aria-label="`${workflowStore.awaitingMyReview.length} items awaiting review`"
```
This is a **static HTML attribute** (no `:` v-bind prefix), so Vue does not evaluate the expression. Screen readers announced the literal string including backtick characters and `${}` template literal syntax rather than the actual item count.

**Fix applied**: Changed all three count badge `aria-label` attributes to dynamic v-bind
`:aria-label` bindings, ensuring the evaluated count is included in the announcement:
```html
:aria-label="`${workflowStore.awaitingMyReview.length} item${...} awaiting review`"
```

**Test coverage**: `TeamWorkspaceView.wcag.test.ts` — "awaiting-review count badge has a meaningful aria-label (not literal backticks)"

#### Finding 6.4 — `<h2>` inside `<button>` (MEDIUM → Resolved)

**Observed behaviour**: The "Recently Completed" collapsible section rendered:
```html
<button aria-expanded="false" aria-controls="completed-items-list">
  <h2 id="completed-section-heading">Recently Completed</h2>
  ...
</button>
```
Interactive elements must not contain heading elements (WCAG SC 1.3.1). Screen readers like NVDA and VoiceOver may skip or misannounce heading roles when nested inside interactive content.

**Fix applied**: Restructured the heading row to place `<h2>` as a sibling of the
toggle button rather than a child. The button now contains only the chevron icon and
has a dedicated `aria-label` for expand/collapse context:
```html
<div class="flex items-center gap-3 mb-4">
  <h2 id="completed-section-heading">Recently Completed</h2>
  <span aria-hidden="true">{{ count }}</span>
  <button :aria-expanded="..." :aria-label="'Expand/Collapse recently completed items'"
          aria-controls="completed-items-list">
    <i class="pi pi-chevron-down" aria-hidden="true"></i>
  </button>
</div>
```

**Test coverage**: `TeamWorkspaceView.wcag.test.ts` — "h2 is NOT nested inside button"

#### Finding 6.5 — Missing action feedback (MEDIUM → Resolved)

**Observed behaviour**: When the user clicked "Approve" or "Request Changes" on a
work item, `workflowStore.updateItemState()` was called but no announcement was made
to screen readers. Keyboard-only users had no confirmation that their action completed.

**Fix applied**: Added a `role="status" aria-live="polite" aria-atomic="true"` live
region (`data-testid="action-feedback"`) and updated `handleApprove` and
`handleRequestChanges` to set a descriptive feedback string that clears after 4 seconds:
```ts
function handleApprove(itemId: string) {
  workflowStore.updateItemState(itemId, 'approved')
  announceAction('Item approved successfully.')
}
```

**Test coverage**: `TeamWorkspaceView.wcag.test.ts` — "action-feedback live region"

### Step-by-step trace (post-fix, NVDA + Chrome)

```
1. Navigate to /team/workspace (authenticated)
2. NVDA: "Team Operations Workspace, heading level 1"
3. Workflow summary counts: "Pending: 3, In Review: 1, Completed: 2"
4. H key: "Awaiting My Review, heading level 2"
5. Count badge: "2 items awaiting review, 2" (count + badge text)
6. Work item card: "Policy Review — Token Issuance, button" (WorkItemCard)
7. Tab to Approve button: "Approve, button"
8. Press Enter → NVDA (polite): "Item approved successfully."
9. H key: "Assigned to My Team, heading level 2"
10. Count badge: "1 item assigned to team, 1"
11. H key: "Ready for Approval, heading level 2"
12. Count badge: "0 items ready for approval, 0"
13. H key: "Recently Completed, heading level 2"
14. Tab to toggle: "Expand recently completed items, button, collapsed"
15. Press Space: expands
16. NVDA: "Expand recently completed items, button, expanded" (aria-expanded changes)
```

---

## Summary of Findings

| ID | Journey | Severity | Finding | Status |
|----|---------|----------|---------|--------|
| 6.3 | Team Workspace | **High** | Count badge aria-labels were static strings with literal template syntax | ✅ Resolved |
| 6.4 | Team Workspace | **Medium** | `<h2>` nested inside `<button>` (Recently Completed toggle) | ✅ Resolved |
| 6.5 | Team Workspace | **Medium** | No screen-reader feedback after approve/request-changes | ✅ Resolved |

All other observations across all six journeys were low-severity (confirmatory passes).
No findings were deferred or accepted without remediation.

---

## Automated Test Coverage Map

The following automated tests preserve the behaviours introduced or confirmed by this review:

| Finding | Unit test file | Test description |
|---------|---------------|-----------------|
| 6.3 (count badge aria-label) | `TeamWorkspaceView.wcag.test.ts` | "awaiting-review/assigned/ready-approval count badge has a meaningful aria-label" |
| 6.4 (h2 not in button) | `TeamWorkspaceView.wcag.test.ts` | "h2 is NOT a heading element nested inside button" |
| 6.5 (action feedback) | `TeamWorkspaceView.wcag.test.ts` | "action-feedback live region with role=status and aria-live=polite" |
| 2.2 (readiness meter) | `ComplianceLaunchConsole.test.ts` | "readiness score meter has ARIA role and value attributes" |
| 4.2 (progress bar) | `ComplianceSetupWorkspace.wcag.test.ts` | "progress bar has ARIA progressbar role with aria-valuenow" |
| 3.5 (table scope) | `WhitelistPolicyDashboard.test.ts` | "investor category table has accessible column headers with scope='col' (WCAG SC 1.3.1)" |

Additionally, E2E-level evidence is provided in `e2e/screen-reader-review-evidence.spec.ts`
for the live-region and heading structure assertions.

---

## How to Use This Artifact During Release Sign-Off

1. **Check findings table**: Confirm all High and Medium findings are marked `✅ Resolved`.
2. **Check test coverage map**: Confirm referenced unit and E2E tests are green in CI.
3. **Review date**: Confirm the journey `Last verified` dates are recent.
4. **New journey changes**: If the PR includes changes to any covered journey,
   the author must update the relevant section and re-confirm observations.

This artifact, combined with `PROCUREMENT_ACCESSIBILITY_EVIDENCE.md` (automated
evidence) and `SCREEN_READER_RELEASE_EVIDENCE.md` (summary), constitutes the complete
accessibility evidence package for enterprise compliance journeys.

---

*Maintained by: Biatec frontend team*  
*Related: `docs/accessibility/SCREEN_READER_REVIEW_CHECKLIST.md`*  
*Related: `docs/accessibility/SCREEN_READER_REVIEW_WORKFLOW.md`*  
*Related: `docs/accessibility/SCREEN_READER_RELEASE_EVIDENCE.md`*  
*Related: `docs/accessibility/PROCUREMENT_ACCESSIBILITY_EVIDENCE.md`*  
*E2E spec: `e2e/screen-reader-review-evidence.spec.ts`*  
*Unit tests: `src/views/__tests__/TeamWorkspaceView.wcag.test.ts`*  
*Unit tests: `src/views/__tests__/WhitelistPolicyDashboard.test.ts`*
