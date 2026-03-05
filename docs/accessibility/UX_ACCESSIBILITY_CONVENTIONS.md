# UX Accessibility Conventions

**Biatec Tokens — WCAG 2.1 AA Compliance Guide**

This document defines the accessibility contracts, navigation conventions, and deterministic
UX state patterns required across all frontend views. These conventions support enterprise
adoption, procurement requirements, and MICA-aligned compliance positioning.

---

## WCAG 2.1 AA Requirements

### 1. Skip-to-Main-Content Link (SC 2.4.1)

Every page must include a visually-hidden skip link that becomes visible on keyboard focus.
Implemented in `src/components/layout/Navbar.vue`:

```html
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] ..."
>
  Skip to main content
</a>
```

All full-page views that do **not** use `MainLayout` must define their own skip target:

```html
<main id="main-content" role="main" ...>
```

Views that **do** use `src/components/layout/MainLayout.vue` (via `import MainLayout from "../components/layout/MainLayout.vue"`)
or `src/layout/MainLayout.vue` (via `import MainLayout from "../layout/MainLayout.vue"`)
inherit `id="main-content"` automatically from the layout's `<main>` element. Both layout
variants include this target.

### 2. Focus Indicators (SC 2.4.7)

All interactive elements must have visible focus indicators. Use `focus-visible` to avoid
showing focus rings on mouse interactions:

```html
class="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
```

Do **not** use `outline: none` or `focus:outline-none` alone without a `focus-visible:ring-*`
replacement.

### 3. Semantic Navigation Landmarks (SC 1.3.6)

- **Primary nav**: `<nav role="navigation" aria-label="Main navigation">` — exactly once per page.
- **Sidebar nav**: `<nav aria-label="Sidebar navigation">` — present only in pages that use the sidebar layout.
- **Step navigators**: Use `<nav aria-label="...steps">` or a `<div role="navigation" aria-label="...steps">` for wizard progress indicators.
- **Breadcrumbs**: `<nav aria-label="Breadcrumb">`.

There should be only **one** `nav[aria-label="Main navigation"]` on any page.

### 4. Progress Bars (SC 4.1.2)

Progress bars must use `role="progressbar"` with numeric ARIA attributes:

```html
<div
  role="progressbar"
  :aria-valuenow="progressPercentage"
  aria-valuemin="0"
  aria-valuemax="100"
  :aria-label="`Setup progress: ${progressPercentage}% complete`"
>
```

### 5. Form Labels (SC 1.3.1, SC 3.3.2)

Every form input must have an associated `<label>` (using `for`/`id`) or `aria-label`.
Placeholder text alone is not an acceptable substitute for a label.

### 6. Error Communication (SC 3.3.1, SC 4.1.3)

- Error containers must use `role="alert"` and `aria-live="assertive"` for immediate announcement.
- Error messages must be plain language and include a corrective action. No raw error codes.
- Example: ✅ "Submission failed — please check your network connection and try again."
  ❌ "Error 503: upstream timeout"

### 7. Buttons and Controls (SC 4.1.2)

- Every icon-only button must have `aria-label` describing its action.
- `aria-disabled` must mirror the HTML `disabled` attribute for disabled buttons.
- Mobile menu toggle: `aria-expanded`, `aria-controls`, `aria-label` (e.g., "Open navigation menu").

---

## Navigation Architecture

### Single Source of Truth

All top-level navigation items are defined in `src/constants/navItems.ts`. Both desktop and
mobile navigation render from this same `NAV_ITEMS` array, guaranteeing parity.

```ts
export const NAV_ITEMS = [
  { label: "Home",          path: "/",                 routeName: "Home" },
  { label: "Guided Launch", path: "/launch/guided",    routeName: "GuidedTokenLaunch" },
  { label: "Dashboard",     path: "/dashboard",        routeName: "TokenDashboard" },
  { label: "Portfolio",     path: "/portfolio",        routeName: "PortfolioIntelligence" },
  { label: "Operations",    path: "/operations",       routeName: "BusinessCommandCenter" },
  { label: "Compliance",    path: "/compliance/setup", routeName: "ComplianceSetupWorkspace" },
  { label: "Pricing",       path: "/subscription/pricing", routeName: "Pricing" },
  { label: "Settings",      path: "/settings",         routeName: "Settings" },
] as const;
```

To add a navigation item, edit `navItems.ts` only. The Navbar automatically reflects the change
on both desktop and mobile.

### Auth-First Routing

Unauthenticated users are redirected to the home page with `?showAuth=true` query param for
any route that requires authentication. The `Guided Launch` entry in the nav is the canonical
create-token flow entry point.

### Cognitive Load

Top-level navigation is capped at ≤ 10 items. Items are ordered by non-technical user workflow:
Home → Create (Guided Launch) → Monitor (Dashboard, Portfolio, Operations) → Govern (Compliance)
→ Account (Pricing, Settings).

---

## Deterministic UX State Contracts

All async data-loading views must implement explicit states. No silent failures.

| State   | Required UI                              | Example                               |
|---------|------------------------------------------|---------------------------------------|
| Loading | Spinner or skeleton with `aria-busy`     | `<i class="pi pi-spin pi-spinner">` + `aria-busy="true"` on container |
| Empty   | Descriptive empty-state message          | "No tokens yet — create your first"   |
| Error   | `role="alert"` banner with plain-language message | "Could not load tokens — try refreshing" |
| Success | Clear confirmation with next action      | "Setup complete — go to Dashboard"    |

Inline transitions must not hide state changes from screen readers. Use `aria-live="polite"` for
non-critical updates and `aria-live="assertive"` for errors.

---

## E2E Test Conventions

### Load State

**Never** use `waitForLoadState('networkidle')` in E2E tests. Vite's HMR SSE connection keeps the
network perpetually active, preventing networkidle from resolving. Use `'load'` instead:

```ts
await page.goto('/compliance/setup');
await page.waitForLoadState('load');   // ✅ SSE-safe
// await page.waitForLoadState('networkidle');  // ❌ hangs with Vite HMR
```

### Wallet-Pattern Assertions

Use specific brand names with word boundaries to avoid false positives on product copy:

```ts
// ✅ Correct — \bPera\b won't match "operations"
expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i);

// ❌ Wrong — /Pera/i matches "o-pera-tions"
expect(navText).not.toMatch(/Pera/i);
```

### Accessibility in E2E

Use role-based selectors to validate accessibility contracts:

```ts
// WCAG: main landmark must exist
const main = page.getByRole('main');
await expect(main).toBeVisible();

// WCAG: primary nav with aria-label
const nav = page.locator('nav[aria-label="Main navigation"]');
await expect(nav).toHaveCount(1);

// WCAG: progress bar with aria-valuenow
const progressBar = page.locator('[role="progressbar"]');
await expect(progressBar).toHaveAttribute('aria-valuenow');
```

---

## Related Test Files

| Test File | Coverage |
|-----------|---------|
| `e2e/navigation-parity-wcag.spec.ts` | Nav parity, WCAG landmarks, no-wallet-UI |
| `e2e/accessibility-auth-launch.spec.ts` | Auth form a11y, keyboard traversal, heading structure |
| `src/components/layout/__tests__/Navbar.layout.branch.test.ts` | Skip link, aria-label, focus indicators |
| `src/components/layout/__tests__/Navbar.navigation-parity.test.ts` | Desktop/mobile parity, canonical destinations |

---

*Last updated: 2026-03-05 — aligned with MVP UX hardening (WCAG AA, nav parity, deterministic states)*
