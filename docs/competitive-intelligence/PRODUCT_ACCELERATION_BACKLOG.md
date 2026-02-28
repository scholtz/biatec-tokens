# Product Acceleration Backlog

## Overview

This backlog captures frontend product improvements derived from competitive intelligence analysis, issuer journey mapping, and direct product owner feedback. Items are grouped by impact/effort quadrant and include business KPI impact, dependencies, test requirements, and sprint assignment.

**Sprint cadence:** 2-week sprints  
**Scope:** Frontend (Vue 3 + TypeScript + Tailwind) only  
**Baseline:** 7,051+ unit/integration tests passing, E2E coverage in place

---

## Quadrant 1: HIGH IMPACT / LOW EFFORT (Quick Wins)

*These items deliver significant user or revenue benefit with minimal engineering investment. Prioritize for Sprint 1.*

---

### QW-1: Consolidate Creation Routes to Single Canonical Path

**Title:** Redirect `/create` and `/create/wizard` to `/launch/guided`

**Business KPI Impact:**
- **Completion rate:** +5–8% by eliminating split-path confusion
- **Analytics clarity:** 100% of creation funnel data attributable to single path
- **Support tickets:** -20% reduction in "I can't find how to create a token" tickets

**Description:**  
Two creation entry points (`/create`, `/launch/guided`) exist simultaneously. Non-technical issuers get confused about which to use, and funnel analytics are split. Adding Vue Router redirects for legacy routes costs ~30 minutes of dev time and zero design work.

**Dependencies:**
- `src/router/index.ts` — add redirect entries
- Update any hardcoded `/create` links in navbar, marketing sections

**Test Requirements:**
- Unit test: Router redirects `/create` → `/launch/guided` (pass through query params)
- Unit test: Router redirects `/create/wizard` → `/launch/guided`
- E2E test: Navigate to `/create` in browser, verify landing on `/launch/guided`
- E2E test: No 404 response for any legacy creation URL

**Sprint Assignment:** Sprint 1

---

### QW-2: Launch Readiness Score Panel

**Title:** Add `LaunchReadinessPanel` to dashboard and guided flow

**Business KPI Impact:**
- **Time to first token:** -15% by surfacing "next action" clearly
- **Onboarding completion:** +10% by making progress visible and motivating
- **Support tickets:** -15% reduction in "what do I do next?" questions

**Description:**  
The `LaunchReadinessPanel` component and `launchReadiness.ts` utility (implemented in this PR) provide a score-based readiness view. Adding it to the main dashboard and inside the guided flow immediately gives issuers a clear "how far am I?" indicator. The component exists; this item tracks its placement in the UI.

**Dependencies:**
- `LaunchReadinessPanel.vue` (this PR)
- `launchReadiness.ts` (this PR)
- `src/views/TokenDashboard.vue` — embed panel in sidebar or top section
- `src/views/GuidedTokenLaunch.vue` — embed panel in step-level sidebar

**Test Requirements:**
- Component test: Panel renders correctly in TokenDashboard context
- Integration test: Panel reads from compliance store and reflects actual status
- E2E test: Dashboard shows readiness score, clicking "Continue" navigates to correct step

**Sprint Assignment:** Sprint 1

---

### QW-3: Replace Crypto Jargon in User-Facing Copy

**Title:** Audit and replace blockchain-specific language with business terms

**Business KPI Impact:**
- **Onboarding drop-off:** -10% reduction in "not for me" bounce on setup screens
- **Enterprise trust:** Measurable improvement in NPS score (survey)
- **Support tickets:** -10% reduction in "what does X mean?" questions

**Description:**  
Terms like "mint," "burn," "ASA," "ARC-200," "gas fee," and "wallet address" appear in user-facing copy on setup and compliance screens. Replace with: "issue," "retire," "token program," "transfer fee," and "account identifier." No code changes required — only template copy changes.

**Dependencies:**
- Audit of all `<template>` strings in views containing token creation and compliance flows
- Copy review by product owner before merge

**Test Requirements:**
- Unit test: Each changed component renders new copy correctly
- E2E test: Smoke test each changed page for critical text regression
- Automated audit: Run `grep -r "wallet\|mint\|burn\|ARC-\|ASA " src/views/` and reduce count to zero

**Sprint Assignment:** Sprint 1

---

### QW-4: Inline Field Validation in Guided Launch Steps

**Title:** Add real-time validation with business-readable messages to all guided launch fields

**Business KPI Impact:**
- **Form completion rate:** +8% by surfacing errors before submission
- **Time-to-complete:** -12% by eliminating "fill, submit, fix, resubmit" loops
- **Error support tickets:** -25% by making errors self-explanatory

**Description:**  
Currently, validation errors appear only on form submission. Adding `@blur` and `@input` validation to the 15+ fields in the guided launch steps eliminates the common pattern of users submitting incomplete forms and receiving batch error lists. Each error message must be specific and actionable.

**Dependencies:**
- `src/views/GuidedTokenLaunch.vue` and step sub-components
- `src/utils/formValidation.ts` — extend with new message formats
- Design: error state styling (amber border, message below field)

**Test Requirements:**
- Unit test (per field): Error message appears on blur with invalid input
- Unit test (per field): Error message clears when valid input entered
- Unit test: No error shown before first interaction
- Integration test: Submit with all-invalid fields shows all errors
- E2E test: Fill in valid name, tab to next field → no error shown

**Sprint Assignment:** Sprint 1

---

### QW-5: Auth-First Route Guard with Context Preservation

**Title:** Preserve user's in-progress context when session expires during guided flow

**Business KPI Impact:**
- **Re-engagement rate:** +20% by not losing user's work on session expiry
- **Abandonment prevention:** Reduces "started but didn't finish" rate for multi-session users
- **User frustration:** Eliminates highest-rated pain point in NPS comments

**Description:**  
When a session expires while a user is on a guided launch step, all entered data is lost. Implement `sessionStorage` serialization of form state before the auth redirect, and restore it after re-authentication.

**Dependencies:**
- `src/router/index.ts` — auth guard to serialize state
- `src/stores/guidedLaunch.ts` — serializable state snapshot
- `src/views/GuidedTokenLaunch.vue` — restore state on mount if snapshot exists

**Test Requirements:**
- Unit test: Auth guard serializes form state to sessionStorage before redirect
- Unit test: On mount, form state is restored from sessionStorage if present
- Integration test: Simulate session expiry → re-auth → verify form data restored
- E2E test: Fill step 2, simulate expiry, re-auth, verify step 2 data present

**Sprint Assignment:** Sprint 1

---

## Quadrant 2: HIGH IMPACT / HIGH EFFORT (Major Investments)

*These items require significant engineering time but deliver core product differentiation. Target for Sprint 2 or dedicated sprint.*

---

### MI-1: Compliance Status Real-Time Dashboard

**Title:** Build a live compliance status dashboard with 5-status model and audit trail

**Business KPI Impact:**
- **Enterprise deal close rate:** +15% by meeting procurement requirement for audit visibility
- **Compliance renewal rate:** +30% by surfacing renewal deadlines proactively
- **Support tickets:** -40% reduction in "what's my compliance status?" inquiries

**Description:**  
Implement the full 5-status compliance model (`not_started`, `in_progress`, `needs_attention`, `ready`, `compliant`) across all compliance checklist items, with real-time status updates, inline guidance text, and an audit trail view. This connects to the backend compliance API and renders with the visual indicator system defined in `COMPLIANCE_UX_SPECIFICATION.md`.

**Dependencies:**
- Backend compliance status API endpoint
- `src/stores/compliance.ts` — extend with status model
- `src/views/ComplianceDashboard.vue` — major refactor
- `src/components/ComplianceStatusIndicator.vue` — extend with all 5 states
- `docs/competitive-intelligence/COMPLIANCE_UX_SPECIFICATION.md` — design reference

**Test Requirements:**
- Unit tests (25+): Status computation, transitions, label rendering per status
- Integration tests (15+): Compliance store + status indicator sync
- Component tests (10+): StatusIndicator renders correct icon/color per status
- E2E tests (8+): Full compliance flow for each status transition
- Accessibility: All status indicators pass WCAG 2.1 AA automated audit

**Sprint Assignment:** Sprint 2

---

### MI-2: Compliance Certificate Export

**Title:** Generate downloadable compliance certificate package for regulatory submission

**Business KPI Impact:**
- **Enterprise deal enablement:** Required by procurement teams at 60%+ of enterprise prospects
- **Revenue impact:** Unlocks $299/month tier deals blocked by missing audit capability
- **Regulatory alignment:** Meets MICA Article 19 issuer disclosure requirements

**Description:**  
Generate a PDF compliance certificate containing: issuer details, token parameters, compliance checklist results with verification dates, attestation signatures, and Biatec verification seal. Certificate must be auditor-ready (structured format matching regulatory requirements).

**Dependencies:**
- PDF generation library (e.g., `jspdf` or backend PDF generation endpoint)
- Backend: certificate generation API with signed data
- `src/components/ComplianceExports.vue` — extend with certificate generation
- Compliance data store — must expose all required fields

**Test Requirements:**
- Unit tests (15+): Certificate data assembly, field validation, format correctness
- Integration tests (10+): Export flow with backend API
- E2E tests (5+): Download certificate, verify it opens and contains required fields
- Security test: Certificate data does not include PII beyond what's required

**Sprint Assignment:** Sprint 2

---

### MI-3: Multi-Step Progress Persistence with Draft Recovery

**Title:** Implement robust draft save/recovery for the guided token creation flow

**Business KPI Impact:**
- **Completion rate:** +18% by enabling multi-session completion
- **Enterprise adoption:** Enterprise buyers require ability to delegate steps to different team members
- **Time to first token:** -25% for complex tokens (asset managers have 30+ minute setup time)

**Description:**  
The guided launch flow currently does not persist progress between sessions. Implement a draft system that: auto-saves every field change, persists to backend (not just localStorage), supports multiple named drafts, and allows delegation (share draft link with team member for completion).

**Dependencies:**
- Backend: Draft save/restore API endpoints
- `src/stores/guidedLaunch.ts` — major refactor with draft management
- `src/views/GuidedTokenLaunch.vue` — draft recovery on mount
- `src/views/DraftList.vue` — new view for managing saved drafts

**Test Requirements:**
- Unit tests (25+): Draft serialization, deserialization, field-level change tracking
- Integration tests (15+): Backend draft save/restore round-trip
- Component tests (10+): Draft list renders, delete, resume actions
- E2E tests (10+): Complete step 1, close browser, return, verify step 1 data present

**Sprint Assignment:** Sprint 2

---

### MI-4: Investor Whitelist Management with Verification Status

**Title:** Rebuild whitelist management with investor verification status integration

**Business KPI Impact:**
- **Compliance confidence:** Eliminates "I don't know if my investors are verified" anxiety
- **Enterprise readiness:** Required for institutional tokens with accredited investor restrictions
- **Support reduction:** -35% reduction in whitelist-related support tickets

**Description:**  
Current whitelist management is a basic add/remove interface. Rebuild with: per-investor verification status (`verified`, `pending`, `failed`), bulk CSV import with format validation, automated email notification to added investors, and inline status filtering. Connect to KYC verification service for real-time status.

**Dependencies:**
- Backend: Investor verification status API
- `src/views/WhitelistManagement.vue` — major refactor
- `src/components/MicaWhitelistManagement.vue` — extend
- KYC service integration
- Email notification system

**Test Requirements:**
- Unit tests (20+): Verification status display, filtering, bulk import validation
- Integration tests (15+): KYC service status sync, email notification trigger
- Component tests (10+): Investor list renders with correct status icons
- E2E tests (8+): Add investor, verify status shows "pending", mock verification, verify shows "verified"
- Accessibility: Table meets WCAG 2.1 AA keyboard navigation

**Sprint Assignment:** Sprint 2

---

## Quadrant 3: LOW IMPACT / LOW EFFORT (Nice-to-Have)

*Improve polish and experience quality without significant business upside. Include in sprints when capacity allows.*

---

### NH-1: Dark Mode Toggle with Preference Persistence

**Title:** Add accessible dark/light mode toggle with localStorage persistence

**Business KPI Impact:**
- **User satisfaction:** Minor NPS improvement (~+2 points in developer segment)
- **Accessibility:** Supports users with photosensitivity

**Description:**  
Dark mode is already the default. Add a toggle component to the account menu that persists the user's preference via `localStorage` and respects `prefers-color-scheme` system setting as default.

**Dependencies:**
- `src/stores/theme.ts` — extend with toggle action
- `src/components/layout/Navbar.vue` — add toggle button

**Test Requirements:**
- Unit test: Theme store toggles correctly
- Unit test: Preference persists across reload
- E2E test: Toggle changes theme, refresh, verify preference retained

**Sprint Assignment:** Sprint 2 (if capacity allows)

---

### NH-2: Token Creation Completion Celebration

**Title:** Add subtle success animation after token deployment confirmation

**Business KPI Impact:**
- **Emotional reward:** Increases likelihood of social sharing ("I just issued my first token!")
- **Product virality:** Minimal — but positive moment in user journey

**Description:**  
After deployment confirmation, show a brief celebration animation (confetti or success badge with brand colors) before transitioning to the token detail page. Dismissible, accessible, and skippable for keyboard users.

**Dependencies:**
- `src/views/GuidedTokenLaunch.vue` — deployment success state
- Animation library or CSS keyframes

**Test Requirements:**
- Unit test: Success state renders animation component
- E2E test: After mock deployment, success animation appears and auto-dismisses

**Sprint Assignment:** Sprint 2 (if capacity allows)

---

## Quadrant 4: LOW IMPACT / HIGH EFFORT (Deprioritize)

*These items require significant investment but deliver marginal business return at this stage. Document for future consideration, do not schedule now.*

---

### DP-1: Token Secondary Market Preview

**Title:** Build an investor-facing secondary market preview panel showing token trade history

**Business KPI Impact:**
- **Revenue impact:** Negligible at MVP stage (no secondary market exists)
- **Future relevance:** High — but only after token issuance volume reaches 50+ tokens

**Description:**  
Would require building a mock or live secondary market data panel showing bid/ask, volume, and trade history for issued tokens. Irrelevant until there is sufficient token volume to generate meaningful data.

**Dependencies:**
- Market data API (not yet available)
- Major new view development
- Backend trading infrastructure

**Deprioritization Reason:** Zero business impact at current scale. Revisit when token volume exceeds 50 active tokens and secondary trading infrastructure is live.

---

### DP-2: Embedded Regulatory News Feed

**Title:** Pull live regulatory news and filter by user's jurisdiction and token type

**Business KPI Impact:**
- **Engagement:** Moderate increase in daily active usage — but not tied to revenue
- **Support reduction:** Marginal

**Description:**  
Would require integrating a regulatory news API, building a relevance filtering system by jurisdiction and token type, and maintaining a curated news source list. High maintenance burden with unclear ROI vs. simply linking to external regulatory sources.

**Dependencies:**
- Regulatory news API (licensing cost unclear)
- Content curation workflow (ongoing)
- Jurisdiction/token-type filtering engine

**Deprioritization Reason:** High maintenance, ambiguous ROI, not core to token issuance value proposition. Revisit if content strategy becomes a growth channel.

---

## Backlog Summary

| ID | Title | Impact | Effort | Sprint |
|----|-------|--------|--------|--------|
| QW-1 | Consolidate creation routes | HIGH | LOW | Sprint 1 |
| QW-2 | Launch Readiness Score Panel | HIGH | LOW | Sprint 1 |
| QW-3 | Replace crypto jargon in copy | HIGH | LOW | Sprint 1 |
| QW-4 | Inline field validation | HIGH | LOW | Sprint 1 |
| QW-5 | Auth-first context preservation | HIGH | LOW | Sprint 1 |
| MI-1 | Compliance status dashboard | HIGH | HIGH | Sprint 2 |
| MI-2 | Compliance certificate export | HIGH | HIGH | Sprint 2 |
| MI-3 | Draft persistence and recovery | HIGH | HIGH | Sprint 2 |
| MI-4 | Investor whitelist with verification | HIGH | HIGH | Sprint 2 |
| NH-1 | Dark mode toggle | LOW | LOW | Capacity |
| NH-2 | Deployment celebration | LOW | LOW | Capacity |
| DP-1 | Secondary market preview | LOW | HIGH | Deprioritize |
| DP-2 | Regulatory news feed | LOW | HIGH | Deprioritize |

---

## Sprint 1 Commitment

**Items:** QW-1, QW-2, QW-3, QW-4, QW-5  
**Estimated engineering days:** 12–15 days  
**Test count target:** +80 tests (unit + integration + E2E)  
**KPI targets:**
- Completion rate improvement: +8–10%
- Support ticket reduction: -15%
- Time-to-first-token: -15%

## Sprint 2 Commitment

**Items:** MI-1, MI-2, MI-3, MI-4 (1–2 items per sprint based on size)  
**Estimated engineering days:** 35–45 days total (across 2 sprints)  
**Test count target:** +150 tests per sprint  
**KPI targets:**
- Enterprise deal close rate: +15%
- Compliance confidence score: measurable improvement in post-onboarding survey

---

*Last updated: 2025 | Product Management*
