/**
 * Canonical navigation items - single source of truth for desktop and mobile menus.
 * "Guided Launch" points to /launch/guided (canonical auth-first guided flow).
 * Any change here automatically applies to both desktop and mobile navigation.
 *
 * Ordered by non-technical user workflow:
 *   Home → Guided Launch (primary CTA) → Dashboard → Cockpit → Compliance → Pricing → Settings
 * Maximum 7 items per roadmap guidance (cognitive-load reduction for non-crypto-native users).
 */
export const NAV_ITEMS = [
  { label: "Home", path: "/", routeName: "Home" },
  { label: "Guided Launch", path: "/launch/guided", routeName: "GuidedTokenLaunch" },
  { label: "Dashboard", path: "/dashboard", routeName: "TokenDashboard" },
  { label: "Cockpit", path: "/cockpit", routeName: "LifecycleCockpit" },
  { label: "Compliance", path: "/compliance/setup", routeName: "ComplianceSetupWorkspace" },
  { label: "Pricing", path: "/subscription/pricing", routeName: "Pricing" },
  { label: "Settings", path: "/settings", routeName: "Settings" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
