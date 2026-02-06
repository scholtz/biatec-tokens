import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import TokenCreator from "../views/TokenCreator.vue";
import BatchCreator from "../views/BatchCreator.vue";
import TokenDashboard from "../views/TokenDashboard.vue";
import TokenDetail from "../views/TokenDetail.vue";
import WalletDashboard from "../views/WalletDashboard.vue";
import Settings from "../views/Settings.vue";
import ComplianceDashboard from "../views/ComplianceDashboard.vue";
import ComplianceMonitoringDashboard from "../views/ComplianceMonitoringDashboard.vue";
import AttestationsDashboard from "../views/AttestationsDashboard.vue";
import TokenStandardsView from "../views/TokenStandardsView.vue";
import EnterpriseGuideView from "../views/EnterpriseGuideView.vue";
import Marketplace from "../views/Marketplace.vue";
import AccountSecurity from "../views/AccountSecurity.vue";
import DiscoveryDashboard from "../views/DiscoveryDashboard.vue";
import AllowanceCenter from "../views/AllowanceCenter.vue";
import { AUTH_STORAGE_KEYS, WALLET_CONNECTION_STATE } from "../constants/auth";

// Subscription views
import Pricing from "../views/subscription/Pricing.vue";
import Success from "../views/subscription/Success.vue";
import Cancel from "../views/subscription/Cancel.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
    },
    {
      path: "/create",
      name: "TokenCreator",
      component: TokenCreator,
      meta: { requiresAuth: true },
    },
    {
      path: "/create/batch",
      name: "BatchCreator",
      component: BatchCreator,
      meta: { requiresAuth: true },
    },
    {
      path: "/dashboard",
      name: "TokenDashboard",
      component: TokenDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/account",
      name: "AccountDashboard",
      component: WalletDashboard,
      meta: { requiresAuth: true },
    },
    // Backward compatibility redirect
    {
      path: "/wallet",
      redirect: "/account",
    },
    {
      path: "/tokens/:id",
      name: "TokenDetail",
      component: TokenDetail,
      meta: { requiresAuth: true },
    },
    {
      path: "/token-standards",
      name: "TokenStandards",
      component: TokenStandardsView,
    },
    {
      path: "/enterprise-guide",
      name: "EnterpriseGuide",
      component: EnterpriseGuideView,
    },
    {
      path: "/marketplace",
      name: "Marketplace",
      component: Marketplace,
    },
    {
      path: "/discovery",
      name: "DiscoveryDashboard",
      component: DiscoveryDashboard,
    },
    {
      path: "/settings",
      name: "Settings",
      component: Settings,
      meta: { requiresAuth: true },
    },
    {
      path: "/compliance/:id?",
      name: "ComplianceDashboard",
      component: ComplianceDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/compliance-monitoring",
      name: "ComplianceMonitoringDashboard",
      component: ComplianceMonitoringDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/attestations",
      name: "AttestationsDashboard",
      component: AttestationsDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/account/security",
      name: "AccountSecurity",
      component: AccountSecurity,
      meta: { requiresAuth: true },
    },
    {
      path: "/allowances",
      name: "AllowanceCenter",
      component: AllowanceCenter,
      meta: { requiresAuth: true },
    },
    // Subscription routes
    {
      path: "/subscription/pricing",
      name: "Pricing",
      component: Pricing,
    },
    {
      path: "/subscription/success",
      name: "SubscriptionSuccess",
      component: Success,
      meta: { requiresAuth: true },
    },
    {
      path: "/subscription/cancel",
      name: "SubscriptionCancel",
      component: Cancel,
    },
  ],
});

// Navigation guard for protected routes
router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth) {
    // Allow access to dashboard even without wallet connection (shows empty state)
    if (to.name === "TokenDashboard") {
      next();
      return;
    }

    // Check if user is authenticated by checking localStorage
    const walletConnected = localStorage.getItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED) === WALLET_CONNECTION_STATE.CONNECTED;

    if (!walletConnected) {
      // Store the intended destination
      localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, to.fullPath);

      // Redirect to home with a flag to show sign-in modal (email/password auth)
      next({
        name: "Home",
        query: { showAuth: "true" },
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
