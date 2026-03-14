# Screen-Reader Review Checklist
## Biatec Tokens — Enterprise Compliance Journey Accessibility

**Version**: 1.0  
**Audience**: QA engineers, developers, accessibility specialists, release managers  
**Related artifact**: `docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md`

---

## Overview

This checklist provides a concise, production-usable set of checks for reviewing
enterprise compliance journey screens with a screen reader and keyboard. It covers
the seven categories most likely to cause problems for non-visual users of the
Biatec Tokens compliance workflow:

1. Headings and document structure
2. Landmark regions
3. Dynamic announcements and live regions
4. Control labels and form accessibility
5. Error handling and validation feedback
6. Focus movement and keyboard operability
7. Dynamic status and queue transitions

Use this checklist alongside the `SCREEN_READER_REVIEW_ARTIFACT.md` to record
findings. Update the artifact with any new observations.

---

## Setup

Before reviewing each journey:

1. **Enable a mainstream screen reader**:
   - Windows: NVDA 2024.x with Chrome (recommended for enterprise reviewers)
   - macOS: VoiceOver (built-in) with Safari
   - iOS: VoiceOver with Safari (for mobile parity if needed)

2. **Disable mouse / pointer interaction** (keyboard-only mode):
   - NVDA: Switch to browse mode (Insert + Esc)
   - VoiceOver: use VO + Arrow keys

3. **Authenticate**: Use email/password login only (no wallet connectors).

4. **Dark mode**: Ensure the app is in dark mode (Biatec Tokens is dark-mode-first).

5. **Zoom level**: Test at 100% browser zoom for initial pass; 200% for overflow check.

---

## Category 1: Headings and Document Structure

Headings orient screen reader users to the page and allow fast navigation.

- [ ] **Single h1**: Every page has exactly one `<h1>` announcing the page title or primary subject.
- [ ] **Logical hierarchy**: Headings descend in order (h1 → h2 → h3), with no skipped levels.
- [ ] **Section headings**: Each major content section has an h2 heading.
- [ ] **No h-in-interactive**: No heading element (`<h1>`–`<h6>`) is nested inside a `<button>`, `<a>`, or other interactive element.
- [ ] **Descriptive heading text**: Headings describe the section content without relying solely on visual position.
- [ ] **Dynamic headings**: When a wizard step changes, the h2 heading updates to describe the new step.

**Navigation shortcut**: Press `H` in NVDA browse mode / VO+CMD+H in VoiceOver to iterate headings.

---

## Category 2: Landmark Regions

Landmarks allow users to jump directly to sections of interest.

- [ ] **Main region**: One `<main>` element (or `role="main"`) per page; not duplicated.
- [ ] **Navigation landmark**: Primary navigation uses `<nav aria-label="Main navigation">`.
- [ ] **Secondary navigation**: Step indicators and breadcrumbs use `<nav>` with distinct `aria-label`.
- [ ] **Content regions**: Complex sections use `<section aria-labelledby="...">` or `role="region" aria-label="..."`.
- [ ] **Skip link**: A "Skip to main content" link is the first focusable element; it targets the `<main>` or primary content region.
- [ ] **No duplicate landmark labels**: If multiple `<nav>` or `<section>` elements exist, each has a unique `aria-label`.

**Navigation shortcut**: Press `D` in NVDA / VO+U → Landmarks in VoiceOver.

---

## Category 3: Dynamic Announcements and Live Regions

Live regions communicate state changes without requiring the user to move focus.

- [ ] **Loading state**: Loading spinners/skeletons have a visually-hidden sibling with `role="status" aria-live="polite"` that says "Loading [content], please wait…"
- [ ] **Success feedback**: After a form submission or action (Approve, Save, Submit), a `role="status" aria-live="polite"` region announces the result.
- [ ] **Error announcements**: Critical errors use `role="alert"` (or `aria-live="assertive"`) for immediate announcement.
- [ ] **Progress updates**: Progress bar `aria-valuenow` updates when wizard step advances.
- [ ] **Queue transitions**: When a work item moves between queues (pending → approved), the change is announced.
- [ ] **Non-spammy**: Announcements are specific and do not repeat on every keystroke or scroll event.
- [ ] **aria-atomic**: Live regions that replace their entire content use `aria-atomic="true"`.

**Verification method**: Use NVDA Speech Viewer (Insert + S then Esc) or macOS Speech to text to capture announcements.

---

## Category 4: Control Labels and Form Accessibility

Every interactive element must have an accessible name that describes its purpose.

### General controls

- [ ] **Button labels**: All buttons have visible text or `aria-label`; no icon-only buttons without accessible names.
- [ ] **Link labels**: All links have meaningful text or `aria-label`; no "click here" or "read more" without context.
- [ ] **Ambiguous buttons**: Buttons scoped to a specific item (Edit, Delete, Approve) include the item name in their `aria-label` (e.g., "Approve Policy Review — Token Issuance").

### Form fields

- [ ] **Label association**: Every `<input>`, `<select>`, and `<textarea>` has an associated `<label>` via `for`/`id` — not proximity or `aria-label` alone.
- [ ] **Select elements**: `<select>` uses `id` attribute and `<label for="...">` — not just visual proximity.
- [ ] **Required fields**: Required fields are announced as required (via `aria-required="true"` or `required` attribute).
- [ ] **Combobox/autocomplete**: Custom dropdowns use `role="combobox"` with `aria-expanded`, `aria-haspopup`, and `aria-autocomplete` as appropriate.

### Count badges / status indicators

- [ ] **Dynamic aria-label**: Count badges that display a number use `:aria-label` (v-bind, not static `aria-label`) so the evaluated value is announced — not literal template syntax.
- [ ] **Decorative dots**: Colour dots or icons used purely for decoration have `aria-hidden="true"`.

---

## Category 5: Error Handling and Validation Feedback

Errors and blockers must be announced clearly and tied to the relevant controls.

- [ ] **Error role**: Form-level errors use `role="alert"` for immediate announcement.
- [ ] **Field-level errors**: Validation messages are associated with their field via `aria-describedby`.
- [ ] **Blocker summaries**: Compliance blocker sections have a heading and `role="status"` or `role="alert"` depending on severity.
- [ ] **Error recovery**: After an error, focus moves to the error message or the first invalid field so the user does not have to search for it.
- [ ] **No opaque status**: Errors do not say only "Something went wrong" — they describe what happened and what action the user should take.

---

## Category 6: Focus Movement and Keyboard Operability

Screen reader users navigate almost exclusively by keyboard; focus management is critical.

- [ ] **Tab order**: Tab key moves through interactive elements in a logical reading order.
- [ ] **Visible focus**: Every focusable element shows a visible focus ring (WCAG SC 2.4.7).
- [ ] **No keyboard traps**: Focus can always move out of modals, drawers, and popups using Escape or Tab.
- [ ] **Focus after action**: After an action that removes an element (close modal, approve item), focus moves to a logical next element — not lost.
- [ ] **Collapsible sections**: Expand/collapse buttons have `aria-expanded` and `aria-controls`; focus stays on the button after toggle.
- [ ] **Modal/dialog**: When a dialog opens, focus moves inside it; when it closes, focus returns to the trigger.
- [ ] **Skip navigation**: The skip link correctly bypasses the navigation and moves focus to the main content area.

**Verification method**: Tab through entire page — every focusable element must receive focus and show a ring.

---

## Category 7: Dynamic Status and Queue Transitions

These checks are specific to the compliance and team workflow surfaces.

- [ ] **Queue section labels**: Each queue section (Awaiting Review, Assigned, Ready for Approval) has an h2 heading and `section[aria-labelledby]` wrapping.
- [ ] **Approval feedback**: After Approve or Request Changes, the user receives a polite announcement ("Item approved successfully.").
- [ ] **Empty queue state**: When a queue section is empty, the empty-state message is perceivable (not just visually styled).
- [ ] **Readiness score**: The compliance readiness score element uses `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and a descriptive `aria-label`.
- [ ] **Gate state**: The compliance gate state label (Not Ready / Partially Ready / Ready) is announced when navigating to the banner region.
- [ ] **Step progress**: Wizard step changes are reflected in the progressbar `aria-valuenow` and step navigation `aria-current="step"`.
- [ ] **No wallet jargon**: No wallet connector terminology, "Not connected" status, or blockchain-native copy appears in enterprise workflow narration.

---

## Quick Verification Sequence (per page, ~10 minutes)

1. Open the page. Note the first announcement.
2. Press Tab once — confirm skip link is announced.
3. Press H repeatedly — record h1 through h3 heading structure.
4. Press D — list all landmark regions.
5. Tab through all interactive controls — confirm each has an announced accessible name.
6. Complete the primary action for the journey (approve, submit, navigate step).
7. Listen for the action feedback announcement.
8. Verify focus placement after action completes.
9. Tab to the last focusable element — confirm no keyboard trap.
10. Mark findings in `SCREEN_READER_REVIEW_ARTIFACT.md`.

---

## Severity Classification

| Severity | Definition | Required action |
|----------|-----------|----------------|
| **High** | User cannot complete primary task using screen reader alone | Must be fixed before release |
| **Medium** | Task completion degraded; user experiences confusion or repetition | Fix in same PR or create tracked follow-up |
| **Low** | Minor friction or improvement opportunity | Log in artifact; address when feasible |
| **Pass** | Meets WCAG SC and provides good user experience | Document as confirmation |

---

## Common Anti-Patterns (Do Not Introduce)

These patterns have been found in similar products and must not be introduced:

| Anti-pattern | Why it fails | Correct pattern |
|-------------|-------------|----------------|
| `aria-label="...template literal..."` (static, no `:`) | Screen reader announces literal backticks and `${}` syntax | Use `:aria-label="..."` (v-bind dynamic) |
| `<h2>` or other heading inside `<button>` | Heading role may not be announced; interactive element contains non-interactive semantics | Put h2 as sibling; give button `aria-label` |
| Action without feedback | Screen reader user does not know action succeeded | Add `role="status" aria-live="polite"` region |
| `role="alert"` for loading states | Alert is assertive; interrupts the user mid-sentence | Use `role="status"` (polite) for loading |
| `aria-label` on decorative icons without `aria-hidden` | Icon description is announced as separate element | Add `aria-hidden="true"` to decorative `<i>` and `<svg>` |
| `<select>` with no `for`/`id` label wiring | axe `select-name` fires; AT cannot identify the field | Add `id` to `<select>` and `for` to `<label>` |
| `bg-opacity-*` or `bg-white/10` on text containers | axe cannot compute contrast through semi-transparent backgrounds | Use solid colour equivalents |
| Missing action button scoping | "Approve, button" without item name is ambiguous in a list of items | Include item name: "Approve Policy Review, button" |

---

*Maintained by: Biatec frontend team*  
*Related: `docs/accessibility/SCREEN_READER_REVIEW_ARTIFACT.md`*  
*Related: `docs/accessibility/SCREEN_READER_RELEASE_EVIDENCE.md`*
