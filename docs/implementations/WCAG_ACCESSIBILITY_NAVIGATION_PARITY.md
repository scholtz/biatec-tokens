# WCAG AA Accessibility and Navigation Parity — Implementation Notes

## Overview

This document describes the accessibility and navigation parity rules that govern the Biatec Tokens
frontend. All future feature work should follow these rules to maintain WCAG 2.1 AA compliance and
consistent cross-device navigation.

## Navigation Source of Truth

### Canonical File

`src/constants/navItems.ts` is the **single source of truth** for all top-level authenticated
navigation. Any change to the destination list, labels, or ordering must be made in this file; both
`Navbar.vue` (desktop + mobile) and any future navigation surface consume `NAV_ITEMS` directly.

### Why This Matters

Before this rule was introduced, `Navbar.vue` maintained a separate array from any mobile or sidebar
navigation, creating the risk of desktop/mobile divergence. `navItems.ts` eliminates that risk.

### Current Canonical Destinations (ordered by enterprise workflow)

| # | Label | Path | Route Name |
|---|-------|------|------------|
| 1 | Home | `/` | `Home` |
| 2 | Guided Launch | `/launch/workspace` | `GuidedLaunchWorkspace` |
| 3 | Dashboard | `/dashboard` | `TokenDashboard` |
| 4 | Portfolio | `/portfolio` | `PortfolioIntelligence` |
| 5 | Operations | `/operations` | `BusinessCommandCenter` |
| 6 | Compliance | `/compliance/launch` | `ComplianceLaunchConsole` |
| 7 | Settings | `/settings` | `Settings` |

**WCAG AC#5 note**: The top-level count is ≤ 7. Research shows 7 ± 2 items is the cognitive load
boundary for navigation menus. Going beyond 7 requires explicit product justification.

### Responsive Exception Policy

Desktop and mobile **must** expose identical destinations. The only allowed exceptions are:

1. Items visually reordered for smaller viewports (but still present and labelled identically).
2. Items hidden only in the smallest viewports (`sm:`) when a mobile-specific equivalent entry
   exists at the same semantic level.

Any exception **must** be documented here with a product-owner rationale.

---

## WCAG 2.1 AA Accessibility Rules

### SC 2.4.1 — Bypass Blocks (Skip Link)

Every page that uses `MainLayout.vue` or `src/layout/MainLayout.vue` provides a skip-to-main-content
link. The link is:

- Positioned as the first focusable element in the `<Navbar>` template.
- Hidden visually until keyboard-focused (`sr-only focus:not-sr-only`).
- Targets `#main-content` — the `<main id="main-content">` element in both layout files.

Do **not** add landmarks that shift the DOM position of `#main-content` without updating the skip
link target.

### SC 1.3.1 — Info and Relationships (Semantic Structure)

All navigation landmarks must have a unique `aria-label` to disambiguate them for assistive
technologies. Current landmarks:

| Element | `aria-label` | Notes |
|---------|-------------|-------|
| `<nav>` in Navbar | `"Main navigation"` | Primary authenticated nav |
| `<nav>` in Sidebar | `"Sidebar navigation"` | Supplemental desktop quick-actions |
| `<aside>` in Sidebar | `"Supplemental navigation"` | Outer region label |

**Rule**: Never add a `<nav>` element without an `aria-label`. Asserting `nav[aria-label="Main
navigation"]` in E2E tests must remain `toHaveCount(1)` — adding a second labeled `<nav>` to a
shared layout will break those assertions (see Section 7k of copilot instructions).

### SC 2.4.7 — Focus Visible

Every interactive element (links, buttons, inputs, selects) **must** display a visible focus ring
when navigated to via keyboard. The standard pattern is:

```html
class="... focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
```

For elements inside colored containers where `ring-offset-2` would show a white gap that breaks the
visual design, use `focus-visible:ring-inset` instead:

```html
class="... focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
```

**Never** use `focus:outline-none` alone — that removes the visible focus indicator entirely.

A global `:focus-visible` CSS rule in `src/style.css` provides a system-level fallback for any
element that lacks the Tailwind class.

### SC 4.1.2 — Name, Role, Value

#### Active Route Indicator

Navigation links must communicate the current page to assistive technologies using `aria-current`:

```html
:aria-current="isActive(item.path) ? 'page' : undefined"
```

Do not set `aria-current="false"` on inactive items — omit the attribute entirely.

#### Icons

All decorative icons (SVG icons from `@heroicons/vue`) **must** have `aria-hidden="true"` so screen
readers skip them. The icon's parent link/button text provides the accessible name.

```html
<SomeIcon class="w-5 h-5 mr-2" aria-hidden="true" />
```

Do **not** use icon fonts (e.g., `<i class="pi pi-users">`) because they are not reliably hidden
from screen readers across all platforms. Use SVG icons from `@heroicons/vue` instead.

#### Interactive Menus

Dropdown/popover menus must expose:
- `aria-haspopup="menu"` on the trigger button.
- `aria-expanded={boolean}` on the trigger button (dynamic, bound to menu visibility state).
- `role="menu"` on the container.
- `role="menuitem"` on each item.

### SC 1.4.3 — Contrast (Minimum, 4.5:1 for normal text)

Color choices for text on backgrounds must meet WCAG AA minimums:

| Tailwind Class | Hex | On White (Light) | On Gray-900 (Dark) | WCAG AA? |
|---|---|---|---|---|
| `text-gray-900` | `#111827` | 18.1:1 | — | ✅ |
| `text-gray-800` | `#1f2937` | 14.7:1 | — | ✅ |
| `text-gray-700` | `#374151` | 10.7:1 | — | ✅ |
| `text-gray-600` | `#4b5563` | 7.0:1 | — | ✅ |
| `text-gray-500` | `#6b7280` | 4.5:1 | — | ⚠️ borderline |
| `text-gray-400` | `#9ca3af` | 2.9:1 | — | ❌ |
| `dark:text-gray-300` | `#d1d5db` | — | 7.8:1 | ✅ |
| `dark:text-gray-400` | `#9ca3af` | — | 4.5:1 | ⚠️ borderline |

**Rule for section headings and secondary UI text**: Use `text-gray-600 dark:text-gray-400` instead
of `text-gray-500 dark:text-gray-400`. The `gray-500` value on light backgrounds is technically
4.5:1 but becomes non-compliant on tinted or off-white surfaces. Prefer `gray-600` for a reliable
margin.

**Avoid `text-gray-400`** entirely for meaningful text on light backgrounds — it fails WCAG AA.

### SC 4.1.3 — Status Messages

Dynamic status regions that update without page reload must expose content to screen readers via
ARIA live regions:

- Empty state containers should have `role="status" aria-live="polite"`.
- Error alert regions should have `role="alert"` (implicit `aria-live="assertive"`).
- Use `v-show` (not `v-if`) for ARIA live regions so the element is always present in the DOM.

---

## Keyboard Navigation

### Tab Order

Tab order follows DOM order. The application's top-to-bottom DOM order is:

1. Skip link (first focusable element)
2. Navbar logo (router-link)
3. Desktop nav items (hidden on mobile)
4. Theme toggle button
5. Subscription status (display only)
6. Sign In button **or** User Account button
7. Mobile menu button (visible on mobile only)
8. Sidebar links (desktop only, fixed-position)
9. Main content area

### Escape Key Handling

Any component that opens a modal, dropdown, or drawer must close on `Escape`. The `EmailAuthModal`
and the Navbar user dropdown implement this pattern.

### Trapping Focus in Modals

Modal dialogs (`EmailAuthModal`) must trap focus within the modal while open so keyboard users
cannot inadvertently navigate behind the overlay.

---

## Testing

### Unit Tests

| File | What It Tests |
|------|---------------|
| `src/components/layout/__tests__/Navbar.navigation-parity.test.ts` | Desktop/mobile same array, all 7 canonical items |
| `src/components/layout/__tests__/Navbar.layout.branch.test.ts` | handleAuthSuccess, formatAddress, sign-out branches |
| `src/components/__tests__/Navbar.navigation-parity.test.ts` | NAV_ITEMS used for both slots |
| `src/components/layout/Sidebar.test.ts` | Sidebar WCAG attributes: aria-label, aria-current, focus rings, aria-hidden icons, contrast classes |

### E2E Tests

| File | What It Tests |
|------|---------------|
| `e2e/navigation-parity-wcag.spec.ts` | Skip link, Main nav landmark, same nav items desktop/mobile |
| `e2e/enterprise-accessibility-parity.spec.ts` | Full AC coverage: landmarks, sign-in ARIA, keyboard navigation, screen-reader basics |
| `e2e/canonical-launch-aa-hardening.spec.ts` | Canonical Guided Launch route, no wizard/create legacy links in nav |

---

## Intentional Responsive Exceptions

None at this time. All 7 canonical destinations are present in both desktop and mobile nav.

---

## Change Log

| Date | Change | Rationale |
|------|--------|-----------|
| 2026-03-12 | Added `focus-visible:ring-2` to all Sidebar navigation links | WCAG SC 2.4.7 — links lacked keyboard focus indicators |
| 2026-03-12 | Added `aria-current="page"` binding to Sidebar links | WCAG SC 4.1.2 — active route not communicated to AT |
| 2026-03-12 | Added `aria-hidden="true"` to all Sidebar icons | WCAG SC 1.1.1 — decorative icons were readable by screen readers |
| 2026-03-12 | Replaced `<i class="pi pi-users">` with `UsersIcon` SVG | WCAG SC 1.1.1 — icon fonts unreliable for screen readers |
| 2026-03-12 | Changed section heading color from `text-gray-500` to `text-gray-600` | WCAG SC 1.4.3 — `gray-500` is borderline on tinted surfaces |
| 2026-03-12 | Added `role="status" aria-live="polite"` to Sidebar empty-state | WCAG SC 4.1.3 — status not announced to screen readers |
| 2026-03-12 | Added `aside aria-label="Supplemental navigation"` | WCAG SC 1.3.6 — region role requires accessible name |
| 2026-03-12 | Sidebar nav uses `aria-label="Sidebar navigation"` only (no `aria-labelledby`) | WCAG SC 1.3.1 — `aria-labelledby` was pointing to section heading not nav heading; `aria-label` is more precise |
| 2026-03-12 | Added global `:focus-visible` CSS rule in `style.css` | WCAG SC 2.4.7 — system-level fallback for missing per-element rings |
