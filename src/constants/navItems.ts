/**
 * Canonical navigation items - single source of truth for desktop and mobile menus.
 * "Guided Launch" points to /launch/guided (canonical auth-first guided flow).
 * Any change here automatically applies to both desktop and mobile navigation.
 */
export const NAV_ITEMS = [
  { label: "Home", path: "/", routeName: "Home" },
  { label: "Guided Launch", path: "/launch/guided", routeName: "GuidedTokenLaunch" },
  { label: "Dashboard", path: "/dashboard", routeName: "TokenDashboard" },
  { label: "Cockpit", path: "/cockpit", routeName: "LifecycleCockpit" },
  { label: "Marketplace", path: "/marketplace", routeName: "Marketplace" },
  { label: "Attestations", path: "/attestations", routeName: "AttestationsDashboard" },
  { label: "Settings", path: "/settings", routeName: "Settings" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
