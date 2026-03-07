/**
 * Canonical navigation items - single source of truth for desktop and mobile menus.
 * "Guided Launch" points to /launch/workspace (the Guided Launch Workspace — the
 * readiness/prerequisites/simulation control centre). From there, users proceed to
 * /launch/guided (the token-parameter wizard) as an in-workspace action.
 * Any change here automatically applies to both desktop and mobile navigation.
 *
 * Ordered by non-technical user workflow:
 *   Home → Guided Launch (primary CTA) → Dashboard → Portfolio → Operations → Compliance → Settings
 *
 * WCAG AC5: top-level count is ≤7 to reduce cognitive load.
 * "Pricing" is intentionally excluded from the primary nav — it is already accessible via the
 * user-account dropdown (the "Subscription" link shown when authenticated) so enterprise users
 * are not overloaded with marketing links in the primary task bar. Pricing is still reachable
 * at /subscription/pricing for unauthenticated users who navigate directly.
 * This satisfies AC5 (7 or fewer top-level items).
 */
export const NAV_ITEMS = [
  { label: "Home", path: "/", routeName: "Home" },
  { label: "Guided Launch", path: "/launch/workspace", routeName: "GuidedLaunchWorkspace" },
  { label: "Dashboard", path: "/dashboard", routeName: "TokenDashboard" },
  { label: "Portfolio", path: "/portfolio", routeName: "PortfolioIntelligence" },
  { label: "Operations", path: "/operations", routeName: "BusinessCommandCenter" },
  { label: "Compliance", path: "/compliance/launch", routeName: "ComplianceLaunchConsole" },
  { label: "Settings", path: "/settings", routeName: "Settings" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
