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
import WhitelistPolicyDashboard from "../views/WhitelistPolicyDashboard.vue";
import ComplianceOrchestrationView from "../views/ComplianceOrchestrationView.vue";
import VisionInsightsWorkspace from "../views/VisionInsightsWorkspace.vue";
import GuidedTokenLaunch from "../views/GuidedTokenLaunch.vue";
import GuidedLaunchWorkspace from "../views/GuidedLaunchWorkspace.vue";
import ComplianceSetupWorkspace from "../views/ComplianceSetupWorkspace.vue";
import ComplianceLaunchConsole from "../views/ComplianceLaunchConsole.vue";
import LifecycleCockpit from "../views/LifecycleCockpit.vue";
import TokenDiscoveryJourney from "../views/TokenDiscoveryJourney.vue";
import WalletActivationJourney from "../views/WalletActivationJourney.vue";
import GuidedPortfolioOnboarding from "../views/GuidedPortfolioOnboarding.vue";
import PortfolioIntelligenceView from "../views/PortfolioIntelligenceView.vue";
import PortfolioLaunchpad from "../views/PortfolioLaunchpad.vue";
import BusinessCommandCenter from "../views/BusinessCommandCenter.vue";
import TeamWorkspaceView from "../views/TeamWorkspaceView.vue";
import ComplianceEvidencePackView from "../views/ComplianceEvidencePackView.vue";
import ComplianceReportingWorkspace from "../views/ComplianceReportingWorkspace.vue";
import EnterpriseRiskReportBuilder from "../views/EnterpriseRiskReportBuilder.vue";
import EnterpriseApprovalCockpit from "../views/EnterpriseApprovalCockpit.vue";
import InvestorComplianceOnboardingWorkspace from "../views/InvestorComplianceOnboardingWorkspace.vue";
import ComplianceOperationsCockpit from "../views/ComplianceOperationsCockpit.vue";
import ComplianceNotificationCenter from "../views/ComplianceNotificationCenter.vue";
import ReleaseEvidenceCenterView from "../views/ReleaseEvidenceCenterView.vue";
import ReportingCommandCenterView from "../views/ReportingCommandCenterView.vue";
import WhiteLabelBrandingWorkspace from "../views/WhiteLabelBrandingWorkspace.vue";
import { AUTH_STORAGE_KEYS } from "../constants/auth";
import { isIssuanceSessionValid, storeIssuanceReturnPath } from "../utils/authFirstIssuanceWorkspace";

// Subscription views
import Pricing from "../views/subscription/Pricing.vue";
import Success from "../views/subscription/Success.vue";
import Cancel from "../views/subscription/Cancel.vue";
import SubscriptionManagement from "../views/subscription/SubscriptionManagement.vue";
import BillingHistory from "../views/subscription/BillingHistory.vue";
import UsageTracking from "../views/subscription/UsageTracking.vue";

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
      path: "/compliance/policy",
      name: "WhitelistPolicyDashboard",
      component: WhitelistPolicyDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: "/compliance/setup",
      name: "ComplianceSetupWorkspace",
      component: ComplianceSetupWorkspace,
      meta: { requiresAuth: true },
    },
    // Compliance Launch Console — single orchestration page for regulated token issuance
    {
      path: "/compliance/launch",
      name: "ComplianceLaunchConsole",
      component: ComplianceLaunchConsole,
      meta: { requiresAuth: true },
    },
    // Compliance Evidence Pack Workspace — regulator-ready evidence review and export
    {
      path: "/compliance/evidence",
      name: "ComplianceEvidencePack",
      component: ComplianceEvidencePackView,
      meta: { requiresAuth: true, title: "Compliance Evidence Pack" },
    },
    // Release Evidence Center — integrated sign-off readiness, evidence inventory, diagnostics, and blockers
    {
      path: "/compliance/release",
      name: "ReleaseEvidenceCenter",
      component: ReleaseEvidenceCenterView,
      meta: { requiresAuth: true, title: "Release Evidence Center" },
    },
    // Compliance Reporting Workspace — enterprise compliance reporting and release evidence
    {
      path: "/compliance/reporting",
      name: "ComplianceReportingWorkspace",
      component: ComplianceReportingWorkspace,
      meta: { requiresAuth: true, title: "Compliance Reporting Workspace" },
    },
    // Enterprise Risk Report Builder — configurable risk scoring and custom compliance reports
    {
      path: "/compliance/risk-report",
      name: "EnterpriseRiskReportBuilder",
      component: EnterpriseRiskReportBuilder,
      meta: { requiresAuth: true, title: "Enterprise Risk Report Builder" },
    },
    // Enterprise Approval Queue — release sign-off cockpit for regulated token launches
    {
      path: "/compliance/approval",
      name: "EnterpriseApprovalCockpit",
      component: EnterpriseApprovalCockpit,
      meta: { requiresAuth: true, title: "Enterprise Approval Queue" },
    },
    // Investor Compliance Onboarding — onboarding readiness, KYC/AML review, jurisdiction checks
    {
      path: "/compliance/onboarding",
      name: "InvestorComplianceOnboarding",
      component: InvestorComplianceOnboardingWorkspace,
      meta: { requiresAuth: true, title: "Investor Compliance Onboarding" },
    },
    // Compliance Operations Cockpit — role-aware task coordination, SLA monitoring, workflow handoffs
    {
      path: "/compliance/operations",
      name: "ComplianceOperationsCockpit",
      component: ComplianceOperationsCockpit,
      meta: { requiresAuth: true, title: "Compliance Operations Cockpit" },
    },
    // Compliance Notification Center — prioritized events, case timelines, queue health
    {
      path: "/compliance/notifications",
      name: "ComplianceNotificationCenter",
      component: ComplianceNotificationCenter,
      meta: { requiresAuth: true, title: "Compliance Notification Center" },
    },
    // Reporting Command Center — scheduled recurring compliance reporting for enterprise audiences
    {
      path: "/compliance/reporting-center",
      name: "ReportingCommandCenter",
      component: ReportingCommandCenterView,
      meta: { requiresAuth: true, title: "Reporting Command Center" },
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
    // Guided Launch Workspace — orchestration layer: readiness, prerequisites, simulation
    {
      path: "/launch/workspace",
      name: "GuidedLaunchWorkspace",
      component: GuidedLaunchWorkspace,
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
    // Guided Portfolio Onboarding
    {
      path: "/portfolio/onboarding",
      name: "GuidedPortfolioOnboarding",
      component: GuidedPortfolioOnboarding,
      meta: { requiresAuth: true },
    },
    // Portfolio Launchpad – discovery-to-action journey
    {
      path: "/launchpad",
      name: "PortfolioLaunchpad",
      component: PortfolioLaunchpad,
    },
    // Portfolio Intelligence
    {
      path: "/portfolio",
      name: "PortfolioIntelligence",
      component: PortfolioIntelligenceView,
      meta: { requiresAuth: true },
    },
    // Enterprise Onboarding Command Center
    {
      path: "/enterprise/onboarding",
      name: "EnterpriseOnboardingCommandCenter",
      component: EnterpriseOnboardingCommandCenter,
      meta: { requiresAuth: true },
    },
    // Business Command Center — canonical post-launch operations route
    {
      path: "/operations",
      name: "BusinessCommandCenter",
      component: BusinessCommandCenter,
      meta: { requiresAuth: true },
    },
    // Team Operations Workspace — collaborative approval workflow
    {
      path: "/team/workspace",
      name: "TeamWorkspace",
      component: TeamWorkspaceView,
      meta: { requiresAuth: true },
    },
    // Legacy operations path — redirect to canonical command center
    {
      path: "/operations/legacy",
      redirect: "/operations",
    },
    // Subscription routes
    // /subscribe is a convenience alias for the pricing page (referenced in AC #1)
    {
      path: "/subscribe",
      redirect: "/subscription/pricing",
    },
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
    {
      path: "/account/subscription",
      name: "SubscriptionManagement",
      component: SubscriptionManagement,
      meta: { requiresAuth: true },
    },
    {
      path: "/account/billing",
      name: "BillingHistory",
      component: BillingHistory,
      meta: { requiresAuth: true },
    },
    {
      path: "/account/usage",
      name: "UsageTracking",
      component: UsageTracking,
      meta: { requiresAuth: true },
    },
    // White-Label Branding Workspace — enterprise brand configuration
    {
      path: "/enterprise/branding",
      name: "WhiteLabelBrandingWorkspace",
      component: WhiteLabelBrandingWorkspace,
      meta: { requiresAuth: true },
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

    // For the canonical issuance route, use structural session validation from
    // authFirstIssuanceWorkspace to verify the session object is well-formed
    // (address non-empty + isConnected true), not just truthy.
    const isAuthenticated = to.name === "GuidedTokenLaunch"
      ? isIssuanceSessionValid(algorandUser)
      : !!algorandUser;

    if (!isAuthenticated) {
      // For the issuance route, store the return path in the issuance-specific key
      // so post-auth redirect can resume the exact step the user was on.
      if (to.name === "GuidedTokenLaunch") {
        storeIssuanceReturnPath(to.fullPath);
      } else {
        // Store the intended destination in the generic auth redirect key
        localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, to.fullPath);
      }

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
