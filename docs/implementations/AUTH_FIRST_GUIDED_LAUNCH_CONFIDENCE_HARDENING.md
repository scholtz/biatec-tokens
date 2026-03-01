# Auth-First Guided Launch Confidence Hardening

**Issue**: Vision: complete auth-first guided launch confidence hardening for enterprise-ready MVP  
**Roadmap**: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md

---

## Business Value

This hardening slice delivers enterprise-grade confidence in the auth-first guided launch experience. Non-crypto-native buyers evaluate Biatec Tokens against compliance reliability and UX predictability, not blockchain feature depth. Deterministic routing, accessible error guidance, and no-wallet-connector UI are the three pillars of trust that drive trial-to-paid conversion.

**Key revenue impact**:
- Prevents auth regressions that break the activation moment (first successful guided token launch)
- Enforces email/password-only mental model — zero wallet-centric UX leakage
- WCAG 2.1 AA compliance satisfies enterprise procurement accessibility requirements

---

## Canonical Route Policy

### Token Creation Routes

| Route | Status | Behaviour |
|-------|--------|-----------|
| `/launch/guided` | ✅ **Canonical** | Primary token creation entry. Requires auth. Structural session validation (address + isConnected). |
| `/create` | ✅ Supported | Advanced token creator. Requires auth. |
| `/create/wizard` | ⛔ **Deprecated** | Redirects to `/launch/guided`. Never a primary CTA or nav target. |

### Route Guard Policy

The router guard (`src/router/index.ts`) applies two distinct validation strategies:

1. **`GuidedTokenLaunch` route** — uses `isIssuanceSessionValid()` for structural session validation:
   - Requires non-empty `address` string
   - Requires `isConnected === true`
   - Stores redirect in `ISSUANCE_RETURN_PATH_KEY` (separate from generic auth redirect key)

2. **All other protected routes** — uses plain truthy check on `algorand_user`:
   - Any non-empty `algorand_user` value is treated as authenticated
   - Stores redirect in `AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH`

This two-tier validation exists because the guided launch is the canonical activation moment. A structurally invalid session (e.g., `isConnected: false`) must be caught before the user lands on the creation form, not discovered mid-step.

### Post-Auth Redirect Continuation

After successful sign-in, the consuming component should:
1. Call `consumeIssuanceReturnPath()` to retrieve and clear the stored issuance path
2. Navigate to the returned path (typically `/launch/guided`)
3. Fall back to `/launch/guided` if `consumeIssuanceReturnPath()` returns `null`

The generic `AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH` is used for all other protected routes and is managed separately.

---

## Navigation Contract

### Guest State Invariants

A guest user (unauthenticated) must always see:
- ✅ "Sign In" button (not "Connect Wallet" or "Not connected")
- ✅ "Guided Launch" link in top nav pointing to `/launch/guided`
- ❌ No wallet-connector UI (WalletConnect, Pera, Defly, MetaMask)
- ❌ No "Not connected" network status in top nav

These invariants are enforced by:
- `src/constants/navItems.ts` — canonical nav item source of truth
- `src/constants/uiCopy.ts` — AUTH_UI_COPY with Sign In / Sign Out labels
- `src/components/layout/Navbar.vue` — no wallet-connector components imported

### Authenticated State Invariants

An authenticated user sees:
- ✅ User menu with email display (not wallet address display)
- ✅ ARC76 account label (not "wallet address")
- ✅ Sign Out option (not "Disconnect")
- ✅ All nav items including Guided Launch

---

## Accessibility Standards (WCAG 2.1 AA)

### GuidedTokenLaunch View

The view (`src/views/GuidedTokenLaunch.vue`) implements:

```html
<!-- WCAG landmark: main content region -->
<main role="main" ...>

<!-- WCAG 1.3.1: Heading hierarchy — h1 identifies the page -->
<h1>Guided Token Launch</h1>

<!-- WCAG 4.1.3: Error messages use live region -->
<div role="alert" aria-live="assertive" ...>
  <!-- User-friendly error with title, description, action -->
</div>

<!-- WCAG 4.1.2: Progress bar with accessible value attributes -->
<div role="progressbar"
     :aria-valuenow="progressPercentage"
     aria-valuemin="0"
     aria-valuemax="100" ...>
</div>

<!-- Step indicator with keyboard-accessible navigation -->
<div role="navigation" aria-label="Issuance progress steps">
  <button :aria-label="`Step N: Title`"
          :aria-current="currentStep === index ? 'step' : undefined">
  </button>
</div>
```

### Navbar

```html
<!-- WCAG 4.1.2: Navigation landmark with accessible name -->
<nav role="navigation" aria-label="Main navigation">
```

---

## Error Message Standards

All user-facing error messages in the guided launch flow follow the **what/why/how** format:
- **title**: What happened (plain language, no raw exception text)
- **description**: Why it happened (context, not stack trace)
- **action**: What the user should do next (actionable, specific)

Error messages are provided by `src/utils/launchErrorMessages.ts` and classified by `classifyLaunchError()`. Raw error strings from the backend/network layer are never exposed directly in the UI.

**Example**:
```
❌ BAD:  "TypeError: Cannot read property 'address' of undefined"
✅ GOOD: title: "Session verification failed"
         description: "Your session could not be verified. Please sign in again."
         action: "Click 'Sign In' to refresh your session and continue."
```

---

## Test Coverage

### Unit Tests

| File | Tests | Coverage Area |
|------|-------|---------------|
| `src/router/__tests__/guided-launch-confidence.integration.test.ts` | 57 | All 5 ACs mapped to assertions |
| `src/router/canonical-routes.test.ts` | 57 | NAV_ITEMS, route guard, auth UI copy |
| `src/router/auth-guard.test.ts` | 17 | Guard redirect, auth state, redirect persistence |
| `src/router/route-contract-matrix.test.ts` | 67 | Every protected + public route |
| `src/router/__tests__/login-to-create-token.test.ts` | 27 | Full redirect chain integration |

### Component / Integration Tests

| File | Tests | Coverage Area |
|------|-------|---------------|
| `src/views/__tests__/GuidedTokenLaunch.authfirst.test.ts` | 33 | Error classification, wallet-free nav |
| `src/views/__tests__/GuidedTokenLaunch.component.test.ts` | 46 | Submit, validation, step indicator |
| `src/views/__tests__/confidenceHardening.integration.test.ts` | 58 | Route + session + nav invariants |
| `src/views/__tests__/authFirstNavigation.integration.test.ts` | 23 | Nav rendering invariants |
| `src/views/__tests__/authFirstIssuanceWorkspace.integration.test.ts` | ~200+ | Full issuance workspace |

### E2E Tests (Playwright)

| File | Coverage Area |
|------|---------------|
| `e2e/auth-first-confidence-hardening.spec.ts` | All 6 ACs: routing, nav, redirect, WCAG, errors, semantic waits |
| `e2e/accessibility-auth-launch.spec.ts` | Keyboard navigation, ARIA, heading hierarchy |
| `e2e/accessibility-first-launch.spec.ts` | Canonical launch route, no wallet UI |

---

## Acceptance Criteria Evidence

| AC | Description | Evidence |
|----|-------------|----------|
| AC #1 | All canonical journeys use `/launch/guided` | `CANONICAL_TOKEN_CREATION_ROUTE`, `NAV_ITEMS`, router redirect |
| AC #2 | Top nav deterministic for guest/auth | `AUTH_UI_COPY`, `NAV_ITEMS`, Navbar component |
| AC #3 | Route guards consistent | Router `beforeEach`, `isIssuanceSessionValid`, `storeIssuanceReturnPath` |
| AC #4 | Accessibility expectations met | `role="main"`, `role="alert"`, `role="progressbar"`, `aria-label` on nav |
| AC #5 | Error messages provide user guidance | `launchErrorMessages.ts`, `classifyLaunchError`, what/why/how format |
| AC #6 | No new skip debt | Zero `test.skip()` in confidence hardening suites |
| AC #7 | No fixed-delay waits | Zero `waitForTimeout()` in `auth-first-confidence-hardening.spec.ts` |
| AC #8 | CI passes | All 7387+ unit tests pass; build succeeds |
| AC #9 | Documentation updated | This document + `e2e/README.md` |
| AC #10 | PR links issue | PR description references issue |
