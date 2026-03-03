# Guided Launch — User Impact for Non-Technical Users

> **Audience**: Product managers, business stakeholders, non-crypto-native users.
> **Purpose**: Explains every feature added in this PR in plain language — no blockchain jargon.

---

## Problem We Are Solving

**For users who are not blockchain experts**, launching a digital token (a digital asset that
represents loyalty points, access rights, or business value) used to be confusing and risky
because:

- There was no clear step-by-step guide, so users could not tell what they had done or what was
  still left to do.
- Errors were shown in technical language that required blockchain expertise to understand.
- If a user was interrupted mid-way (e.g., browser refresh, session timeout), their work was
  lost with no recovery path.
- The system did not prevent users from submitting incomplete or invalid configurations,
  leading to failed deployments and support tickets.
- There was no visible confirmation of what the system was going to do before the user
  committed to the action.

---

## What We Built

### 1. Transaction Preview Panel

**What it is (plain English):**
Before your token deployment is submitted, you now see a clear summary panel showing:
- The token name, symbol, and total number of tokens being created
- The network where the token will be deployed (e.g., "Algorand Mainnet" — displayed in
  plain business language, never as a technical chain ID)
- The compliance settings you chose
- An estimated fee for the deployment

This is similar to the "Order Summary" step in an e-commerce checkout — you can review
everything before confirming.

**User impact:**
- Reduces the number of "I made a mistake and can't undo it" support tickets.
- Builds trust for enterprise buyers who need to present a deployment plan to their legal or
  finance teams before committing.
- Increases conversion on the final submission step (users who see a clear summary are less
  likely to abandon).

**Before / After:**
| Before | After |
|--------|-------|
| User clicked "Submit" without a confirmation screen | User sees a full summary and can go back to edit |
| Fee only visible in network explorer after submission | Fee estimate shown before submission |
| Technical error codes if something was wrong | Plain-language explanation of what needs to be fixed |

---

### 2. State Machine — Deterministic Step Progress

**What it is:**
The launch wizard now uses a deterministic state machine. Each step (Organization Profile,
Token Intent, Compliance, Template, Economics, Review) has a clear status: not started,
in progress, complete, or has an error.

**Why this matters to non-technical users:**
- Users always know which step they are on and how far they have to go.
- The system prevents users from submitting a form that is not yet ready — the "Submit"
  button only becomes active when all required information is provided.
- If a user accidentally skips a required field, the specific blocker is shown in plain
  language (e.g., "Compliance Requirements is required but not complete") — not a raw
  validation error.

**User impact:**
- Non-technical users can confidently navigate a multi-step form without needing a guide.
- The readiness score shows a percentage, giving users a progress indicator similar to a
  LinkedIn profile completeness score.
- Enterprise users completing compliance steps (KYC, AML, legal review) can see exactly
  which compliance items are still outstanding.

---

### 3. Draft Persistence — Never Lose Your Work

**What it is:**
Every change you make in the guided launch wizard is automatically saved as a draft.
If you close the browser, refresh the page, or are interrupted, your progress is saved
and automatically restored the next time you visit.

**User impact:**
- For enterprise users with long compliance review cycles, this means a compliance officer
  can fill in half the form, save it, and hand it to a legal reviewer — without the data
  being lost.
- Reduces abandonment caused by accidental navigation or browser reloads.
- The system validates the draft version; if the form structure has changed between product
  updates, the old draft is safely cleared instead of causing a confusing error.

---

### 4. Session Recovery Banner

**What it is:**
If your login session expires while you are in the middle of filling in a launch form, the
system:
1. Saves where you were.
2. Redirects you to the sign-in page.
3. After you sign in again, brings you back to exactly where you left off.

There is no data loss and no need to start over.

**User impact:**
- Eliminates the frustrating "my work disappeared when I had to log in again" scenario.
- Enterprise users with strict session timeouts (common in regulated industries) can work
  safely without fear of losing progress.

---

### 5. Typed Analytics Events

**What it is:**
Every meaningful user action in the launch wizard (entering a step, completing compliance,
acknowledging risk) emits a structured analytics event. These events use stable, readable
names like `launch:step_entered` and `launch:risk_acknowledged`.

**Why this matters to non-technical users:**
You as a product manager or business stakeholder can now see:
- Which steps have the highest drop-off rate (i.e., where users give up).
- How long users spend on each step.
- How often the risk acknowledgement is the final blocker before submission.

**User impact:**
- Enables data-driven improvements to the onboarding flow.
- Supports A/B testing of step order and form field layout.
- Compliance-relevant events (risk acknowledged, KYC step entered) can be used as audit
  trail data for enterprise customers.

---

### 6. Launch Preflight Validator

**What it is:**
Before a deployment is submitted, a checklist of required conditions is validated. Each
check has a status (pass / warning / fail) and a plain-language message. For example:

- ✅ `Network "algorand" is ready for deployment.`
- ❌ `Token name is missing or too short (minimum 2 characters).`
- ⚠️ `Some compliance requirements are not yet complete. Review them before proceeding.`

**User impact:**
- Users never submit a deployment that will fail for a known reason — they are shown the
  issue before it can happen.
- Advisory warnings (compliance items, identity verification) do not block deployment but
  make the user aware of outstanding items.

---

## Scenario Walkthroughs

### Happy Path (First-Time User)

1. User navigates to `/launch/guided` (must be signed in with email/password — no wallet
   required).
2. The wizard opens at **Step 1: Organization Profile**. All fields are labelled clearly
   with an email field for the contact person.
3. User fills in organization name, type, jurisdiction, and contact details. Progress bar
   updates to ~17%.
4. User advances to **Step 2: Token Intent** — what the token is for, who holds it, where
   it will be used.
5. User advances through Compliance, Template Selection, and Economics.
6. At **Step 6: Review & Submit**, the Transaction Preview Panel shows a full summary.
7. User clicks Submit. Deployment is handled server-side. No wallet popup, no transaction
   signing in the browser.

---

### Invalid Input (Validation Correction Path)

1. User attempts to advance past **Step 1** with an empty organization name.
2. The step is marked invalid; the "Continue" button is greyed out.
3. A blocker message appears: `"Organization Profile is required but not complete"`.
4. User fixes the name and the step becomes valid; they can proceed.
5. If the user enters an invalid token symbol (e.g., lowercase `mytkn` instead of `MYTKN`),
   the preflight validator shows: `"Token symbol must be 1–10 uppercase letters or digits"`.

---

### Interrupted Session (Recovery Path)

1. User is on Step 3 (Compliance) when their login session expires.
2. The system saves their current position (`/launch/guided?step=2`) and redirects them to
   the sign-in page.
3. User signs in again.
4. The system restores the return path and navigates them back to Step 3 — all their
   previously filled-in data is intact (restored from the auto-saved draft).

---

### Network / Account Mismatch

1. A user who accidentally changes their account mid-flow (unlikely with email/password
   auth but possible in testing) sees a recovery prompt.
2. The wallet network recovery integration detects the mismatch and offers to reset the
   session or continue with the new account.
3. The draft is preserved so no data is lost if the user chooses to continue.

---

## Test Evidence Table

| Scenario | Test File | Tests | Status |
|---|---|---|---|
| Happy path — step progression | `src/stores/__tests__/guidedLaunchStateMachine.test.ts` | 45 | ✅ |
| Invalid input — validation boundary | `src/stores/__tests__/guidedLaunchValidationBoundary.test.ts` | 28 | ✅ |
| ARC76 session contract (auth contract) | `src/stores/__tests__/guidedLaunchARC76SessionIntegration.test.ts` | 48 | ✅ |
| Session gate — `isIssuanceSessionValid` | `src/stores/__tests__/guidedLaunchARC76SessionIntegration.test.ts` | included above | ✅ |
| Draft resilience (invalid JSON, version mismatch) | `src/stores/__tests__/guidedLaunchValidationBoundary.test.ts` | included above | ✅ |
| Analytics event constants | `src/views/__tests__/guidedLaunchAnalyticsEmissions.integration.test.ts` | 52 | ✅ |
| Wallet/network recovery | `src/stores/__tests__/walletNetworkRecoveryIntegration.test.ts` | 53 | ✅ |
| Transaction Preview Panel | `src/components/guidedLaunch/__tests__/TransactionPreviewPanel.test.ts` | 34 | ✅ |
| Preflight validator boundaries | `src/utils/__tests__/launchPreflightValidator.test.ts` | 43 | ✅ |
| E2E happy path + no wallet UI | `e2e/conversion-first-guided-launch.spec.ts` | 24 | ✅ |

**Total: 327+ tests across unit, integration, and E2E layers.**

---

## No Wallet Connectors — Explicit Statement

This PR does not introduce any wallet connector UI. All authentication is email/password
only. The ARC76 blockchain address is derived server-side from the user's credentials.
Users never see "Connect Wallet", "MetaMask", "WalletConnect", or "Pera Wallet" in any
part of this flow.

This is enforced by:
- E2E tests that explicitly assert no wallet connector text appears.
- The `isIssuanceSessionValid` gate, which relies on an email-derived address — not a
  wallet signing event.
- The `describeSessionFailure` helper, which uses "your account" language, not "your wallet".

---

## Business Value Summary

| Dimension | Impact |
|---|---|
| **Onboarding conversion** | Structured wizard + preflight validator reduce abandonment at the token configuration stage |
| **Support efficiency** | Plain-language error messages and draft recovery reduce "I lost my work" and "what does this error mean" tickets |
| **Enterprise trust** | Transaction Preview Panel and compliance step determinism meet procurement and legal review requirements |
| **Regulatory confidence** | Typed compliance events (`launch:risk_acknowledged`) provide audit evidence for MICA/KYC-adjacent workflows |
| **Developer confidence** | 327+ deterministic tests with zero localStorage-seeding shortcuts provide a regression safety net |
