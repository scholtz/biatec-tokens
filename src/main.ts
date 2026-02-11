import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import { useAuthStore } from "./stores/auth";
import { Buffer } from "buffer";

// @ts-ignore
window.Buffer = Buffer;

// fix old wallet connect library
// @ts-ignore
window.global ||= window;
// fix new wallet connect library
// @ts-ignore
window.process = {
  env: {},
  version: "",
};
// Tailwind CSS
import "./style.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize critical stores and wait for them to complete before mounting
// This ensures components have access to auth and subscription state immediately on render
// Wrapped in async IIFE to use await at top level
// CRITICAL: Without awaiting initialization, components check store state before it loads,
// causing E2E tests to fail with "element not visible" timeouts (see PR #364 root cause analysis)
(async () => {
  const authStore = useAuthStore();
  await authStore.initialize();

  // Also initialize subscription store to ensure subscription status is available
  // This prevents race conditions where components check subscription before store loads
  const { useSubscriptionStore } = await import("./stores/subscription");
  const subscriptionStore = useSubscriptionStore();
  await subscriptionStore.fetchSubscription();

  app.mount("#app");
})();
