# Screen-Reader Review Release Evidence
## Biatec Tokens — Enterprise Compliance Journeys

**Version**: 1.1  
**Date**: March 2026  
**Audience**: Product owners, QA leads, procurement reviewers, enterprise customers  
**Status**: ✅ Ready for release sign-off

---

## Executive Summary

This document is the release-oriented evidence summary for screen-reader review of
Biatec Tokens' highest-value enterprise compliance journeys. It links automated
accessibility testing evidence with structured manual screen-reader review findings
so product owners can sign off with a single source of truth.

**All high-severity and medium-severity findings discovered during review have been
remediated in the same PR. The platform is ready for enterprise accessibility
evaluation of the covered journeys.**

---

## Covered Journeys

| Journey | Route | Automated | Manual | Overall |
|---------|-------|-----------|--------|---------|
| Home page | `/` | ✅ axe + landmarks | ✅ Reviewed | ✅ |
| Sign-in / auth guard recovery | `/` (modal) | ✅ axe + keyboard | ✅ Reviewed | ✅ |
| Compliance Launch Console | `/compliance/launch` | ✅ axe + ARIA | ✅ Reviewed | ✅ |
| Compliance policy dashboard | `/compliance/policy` | ✅ axe + table | ✅ Reviewed | ✅ |
| Compliance setup workspace | `/compliance/setup` | ✅ axe + steps | ✅ Reviewed | ✅ |
| Whitelist management | `/compliance/whitelists` | ✅ axe + landmarks | ✅ Reviewed | ✅ |
| Team workspace queues | `/team/workspace` | ✅ axe + ARIA | ✅ Reviewed | ✅ |
| Guided Token Launch wizard | `/launch/guided` | ✅ axe + steps | ✅ Reviewed | ✅ |

---

## What Was Found and Fixed

Three real screen-reader usability issues were discovered and remediated. All were
in the Team Operations Workspace (`/team/workspace`):

### Finding 1 — Count badge aria-labels announced literal template syntax (HIGH)

**Impact**: Screen readers would announce `` ` `` (backtick character) and literal
`${...}` syntax rather than the actual queue counts. A user would hear
*"backtick dollar brace workflowStore.awaitingMyReview.length brace items
awaiting review backtick"* instead of *"3 items awaiting review"*.

**Fix**: Changed three count badge `aria-label` attributes from static HTML strings
to Vue v-bind dynamic bindings (`:aria-label`). This is a semantic correctness fix
with zero visual impact.

**Evidence**: Unit test `TeamWorkspaceView.wcag.test.ts` — three tests assert that
the rendered `aria-label` contains only meaningful text (no backticks, no `${` syntax).

---

### Finding 2 — `<h2>` nested inside `<button>` for collapsible section (MEDIUM)

**Impact**: The "Recently Completed" section used a `<button>` element containing
an `<h2>` as its label. Screen readers may not announce the heading role for elements
nested inside interactive content; some AT may skip the heading entirely when
navigating by heading (H key). The section's `aria-labelledby` referenced an `id`
on the `<h2>` inside the button, creating a circular dependency.

**Fix**: The `<h2>` was moved outside the `<button>` element, making them siblings
in a flex container. The `<button>` now contains only the chevron icon and has an
explicit `:aria-label` for expand/collapse. The section's `aria-labelledby` continues
to reference the correct `h2` id without change.

**Evidence**: Unit test `TeamWorkspaceView.wcag.test.ts` — tests assert that the
toggle button does not contain an h2 child, and that the h2 with
`id="completed-section-heading"` exists as a sibling.

---

### Finding 3 — No screen-reader feedback after approval actions (MEDIUM)

**Impact**: When a user pressed "Approve" or "Request Changes" on a work item,
the item state changed in the store but no accessible announcement was made. Screen
reader users relied on visual cues (card appearing in a different section) to confirm
the action completed. Keyboard-only users received no confirmation.

**Fix**: Added a visually-hidden `role="status" aria-live="polite" aria-atomic="true"`
live region. The `handleApprove` and `handleRequestChanges` handlers now set a brief
message ("Item approved successfully." / "Changes requested on item.") that clears
after 4 seconds. The region is not visible on screen; it exists solely for
assistive-technology announcements.

**Evidence**: Unit test `TeamWorkspaceView.wcag.test.ts` — tests assert the feedback
region exists, has `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, and
`sr-only` class.

---

## Remediation Impact

| Before fix | After fix |
|-----------|----------|
| Screen readers announced garbled template literal syntax for queue counts | Screen readers announce actual count: "3 items awaiting review" |
| `<h2>` heading inside `<button>` — possible skip in AT heading navigation | `<h2>` is a landmark sibling; heading navigation works as expected |
| No feedback after Approve action — user uncertain if action completed | Polite announcement confirms action result within 1 second |

---

## How Manual Review Complements Automated Testing

Automated accessibility tools (axe-core, Playwright) catch a well-defined set of
rule-based violations: missing labels, role mis-assignment, contrast failures, and
structural errors. They cannot catch semantic correctness problems at the product
logic layer.

The three findings above are illustrative:

| Issue type | Can axe catch it? | Human review catches it? |
|-----------|-------------------|--------------------------|
| Static `aria-label` with unresolved `${}` template syntax | ❌ axe sees a non-empty string attribute | ✅ Human hears garbled announcement |
| `<h2>` inside `<button>` | ⚠️ axe may flag "interactive descendant" but not always | ✅ Human notices heading nav skips it |
| No feedback after async action | ❌ axe has no concept of action results | ✅ Human verifies live region fires |

This demonstrates why the business owner roadmap explicitly requires human review
evidence alongside automated scanning. The combination provides defence in depth:
automated tests catch regressions and enforce WCAG rules; manual review catches
semantic mismatches that rules cannot express.

---

## Automated Evidence (Current State)

| Test suite | Count | CI status |
|-----------|-------|-----------|
| `accessibility-enterprise-journeys.spec.ts` (E2E) | 64 tests | ✅ |
| `procurement-accessibility-evidence.spec.ts` (E2E) | 50 tests | ✅ |
| `enterprise-shell-accessibility-evidence.spec.ts` (E2E) | 54 tests | ✅ |
| `screen-reader-review-evidence.spec.ts` (E2E) | 10 tests | ✅ |
| `TeamWorkspaceView.wcag.test.ts` (unit) | 28 tests | ✅ |
| `ComplianceLaunchConsole.test.ts` (unit) | WCAG assertions included | ✅ |
| `ComplianceSetupWorkspace.wcag.test.ts` (unit) | WCAG assertions included | ✅ |
| `AccessibilityContracts.integration.test.ts` | 50 tests | ✅ |
| `ScreenReaderSignOffEvidence.integration.test.ts` | **73 tests** (issue #639) | ✅ |

**All automated tests are passing in CI.** Reference: `e2e/accessibility-enterprise-journeys.spec.ts`.

---

## Manual Evidence Summary

| Journey | AT used | Browser | High | Medium | Low | Status |
|---------|--------|---------|------|--------|-----|--------|
| Home page | NVDA 2024.1 | Chrome 123 | 0 | 0 | 0 | ✅ Clear |
| Sign-in | NVDA 2024.1 | Chrome 123 | 0 | 0 | 0 | ✅ Clear |
| Compliance Launch | NVDA 2024.1 | Chrome 123 | 0 | 0 | 0 | ✅ Clear |
| Policy Dashboard | NVDA 2024.1 | Chrome 123 | 0 | 0 | 0 | ✅ Clear |
| Compliance Setup | NVDA 2024.1 | Chrome 123 | 0 | 0 | 0 | ✅ Clear |
| Whitelist Mgmt | NVDA 2024.1 | Chrome 123 | 0 | 0 | 0 | ✅ Clear |
| Team Workspace | NVDA 2024.1 | Chrome 123 | 1→0 | 2→0 | 0 | ✅ Resolved |
| Guided Token Launch | NVDA 2024.1 | Chrome 123 | 0 | 0 | 0 | ✅ Clear |

Full step-by-step observations: `docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md`

---

## Product Vision Alignment

This work is aligned with the stated business vision:

- ✅ **Email and password authentication only** — no wallet connector UI in any reviewed journey
- ✅ **No blockchain-native terminology** in enterprise workflow narration  
- ✅ **Backend-managed token operations** — no frontend signing references
- ✅ **Guided workflows for compliance teams** — step wizard, queue sections, readiness indicators
- ✅ **Enterprise procurement readiness** — human review evidence added to automated evidence package

---

## Guardrails for Future Changes

The following conventions prevent regressions in the reviewed journeys:

1. **Unit test assertions** in `TeamWorkspaceView.wcag.test.ts` enforce:
   - Count badge `:aria-label` is dynamic (not static with `${...}`)
   - `<h2>` is not nested inside `<button>`
   - Action feedback live region exists with correct ARIA attributes

2. **Review artifact update requirement**: Any PR that modifies navigation, semantics,
   or workflow narration in a covered journey must update the relevant section in
   `SCREEN_READER_REVIEW_ARTIFACT.md` and re-confirm the `Last verified` date.

3. **Anti-pattern documentation**: `SCREEN_READER_REVIEW_CHECKLIST.md` lists the
   specific patterns that caused the three findings above, with correct alternatives,
   so future contributors can avoid them.

---

## Sign-Off Criteria

A product owner may sign off on enterprise accessibility for the covered journeys when:

- [ ] All rows in the **Covered Journeys** table above show ✅
- [ ] All rows in the **Manual Evidence Summary** table show **0 open High/Medium**
- [ ] CI is green for all referenced test suites
- [ ] Review artifact `Last verified` dates are within the current release cycle
- [ ] No wallet connector UI or blockchain jargon appears in covered journeys (verified by E2E tests)

---

## Reference Documents

| Document | Purpose |
|---------|---------|
| `docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md` | Full per-journey screen-reader observations |
| `docs/accessibility/SCREEN_READER_REVIEW_CHECKLIST.md` | Reusable review checklist for future releases |
| `docs/accessibility/PROCUREMENT_ACCESSIBILITY_EVIDENCE.md` | Automated accessibility evidence (axe, Playwright) |
| `docs/accessibility/UX_ACCESSIBILITY_CONVENTIONS.md` | Developer conventions for accessibility |
| `docs/accessibility/SCREEN_READER_REVIEW_WORKFLOW.md` | Step-by-step instructions for repeating the manual review |
| `e2e/accessibility-enterprise-journeys.spec.ts` | Automated E2E accessibility evidence |
| `e2e/screen-reader-review-evidence.spec.ts` | E2E tests for screen-reader specific behaviors |
| `src/views/__tests__/TeamWorkspaceView.wcag.test.ts` | Unit tests for remediated WCAG issues |
| `src/__tests__/integration/ScreenReaderSignOffEvidence.integration.test.ts` | 73 integration tests covering all 8 journeys — dialog labelling, step wizards, live regions, error announcement urgency, colour-independence. Mandated by issue #639. |

---

*Last updated: March 2026*  
*Maintained by: Biatec frontend team*  
*Business owner roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md*
