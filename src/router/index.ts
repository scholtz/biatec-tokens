import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import TokenCreator from "../views/TokenCreator.vue";
import BatchCreator from "../views/BatchCreator.vue";
import TokenDashboard from "../views/TokenDashboard.vue";
import TokenDetail from "../views/TokenDetail.vue";
import Settings from "../views/Settings.vue";
import ComplianceDashboard from "../views/ComplianceDashboard.vue";
import ComplianceMonitoringDashboard from "../views/ComplianceMonitoringDashboard.vue";
import AttestationsDashboard from "../views/AttestationsDashboard.vue";
import TokenStandardsView from "../views/TokenStandardsView.vue";
import EnterpriseGuideView from "../views/EnterpriseGuideView.vue";
import Marketplace from "../views/Marketplace.vue";
import AccountSecurity from "../views/AccountSecurity.vue";
import DiscoveryDashboard from "../views/DiscoveryDashboard.vue";
// TokenCreationWizard removed - legacy /create/wizard route now redirects to /launch/guided
import OnboardingFlow from "../views/OnboardingFlow.vue";
import EnterpriseOnboardingCommandCenter from "../views/EnterpriseOnboardingCommandCenter.vue";
import WhitelistsView from "../views/WhitelistsView.vue";
import ComplianceOrchestrationView from "../views/ComplianceOrchestrationView.vue";
import VisionInsightsWorkspace from "../views/VisionInsightsWorkspace.vue";
import GuidedTokenLaunch from "../views/GuidedTokenLaunch.vue";
import ComplianceSetupWorkspace from "../views/ComplianceSetupWorkspace.vue";
import LifecycleCockpit from "../views/LifecycleCockpit.vue";
import TokenDiscoveryJourney from "../views/TokenDiscoveryJourney.vue";
import WalletActivationJourney from "../views/WalletActivationJourney.vue";
import { AUTH_STORAGE_KEYS } from "../constants/auth";

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
      path: "/create/wizard",
      redirect: "/launch/guided", // Legacy route - redirect to auth-first guided launch
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
      path: "/discovery/journey",
      name: "TokenDiscoveryJourney",
      component: TokenDiscoveryJourney,
    },
    {
      path: "/activation/wallet",
      name: "WalletActivationJourney",
      component: WalletActivationJourney,
      meta: { requiresAuth: true },
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
      path: "/compliance/orchestration",
      name: "ComplianceOrchestration",
      component: ComplianceOrchestrationView,
      meta: { requiresAuth: true },
    },
    {
      path: "/compliance-monitoring",
      name: "ComplianceMonitoringDashboard",
      component: ComplianceMonitoringDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/compliance/whitelists",
      name: "WhitelistManagement",
      component: WhitelistsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/compliance/setup",
      name: "ComplianceSetupWorkspace",
      component: ComplianceSetupWorkspace,
      meta: { requiresAuth: true },
    },
    {
      path: "/attestations",
      name: "AttestationsDashboard",
      component: AttestationsDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/insights",
      name: "VisionInsightsWorkspace",
      component: VisionInsightsWorkspace,
      meta: { requiresAuth: true },
    },
    // Guided Token Launch
    {
      path: "/launch/guided",
      name: "GuidedTokenLaunch",
      component: GuidedTokenLaunch,
      meta: { requiresAuth: true },
    },
    // Lifecycle Cockpit
    {
      path: "/cockpit",
      name: "LifecycleCockpit",
      component: LifecycleCockpit,
      meta: { requiresAuth: true },
    },
    {
      path: "/account/security",
      name: "AccountSecurity",
      component: AccountSecurity,
      meta: { requiresAuth: true },
    },
    // Onboarding route
    {
      path: "/onboarding",
      name: "OnboardingFlow",
      component: OnboardingFlow,
      meta: { requiresAuth: true },
    },
    // Enterprise Onboarding Command Center
    {
      path: "/enterprise/onboarding",
      name: "EnterpriseOnboardingCommandCenter",
      component: EnterpriseOnboardingCommandCenter,
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

    // Check if user is authenticated using wallet-free architecture (email/password ARC76)
    // Per business-owner-roadmap.md: "no wallet connectors anywhere"
    const algorandUser = localStorage.getItem("algorand_user");
    const isAuthenticated = !!algorandUser;

    if (!isAuthenticated) {
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
