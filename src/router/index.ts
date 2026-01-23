import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import TokenCreator from "../views/TokenCreator.vue";
import TokenDashboard from "../views/TokenDashboard.vue";
import TokenDetail from "../views/TokenDetail.vue";
import Settings from "../views/Settings.vue";
import ComplianceDashboard from "../views/ComplianceDashboard.vue";
import AttestationsDashboard from "../views/AttestationsDashboard.vue";
import TokenStandardsView from "../views/TokenStandardsView.vue";
import EnterpriseGuideView from "../views/EnterpriseGuideView.vue";

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
      path: "/attestations",
      name: "AttestationsDashboard",
      component: AttestationsDashboard,
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

export default router;
