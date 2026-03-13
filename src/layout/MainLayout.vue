<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import Navbar from "../components/layout/Navbar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
import ApiHealthBanner from "../components/ApiHealthBanner.vue";
import TrialCountdownBanner from "../components/TrialCountdownBanner.vue";

const route = useRoute();

/**
 * Route announcement text for the aria-live region.
 * Updated on every route change so screen-reader users are informed of
 * page transitions — WCAG SC 4.1.3 (Status Messages) and best practice
 * for SPA route-change accessibility.
 */
const routeAnnouncement = ref("");
let announceTimer: ReturnType<typeof setTimeout> | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAnnouncement(title: unknown): void {
  // Cancel any pending timers so rapid navigations do not stack
  if (announceTimer !== null) clearTimeout(announceTimer);
  if (clearTimer !== null) clearTimeout(clearTimer);

  // Brief delay lets the new page heading render so AT reads the live
  // region announcement AFTER the new content is in the DOM.
  announceTimer = setTimeout(() => {
    routeAnnouncement.value = title ? `Navigated to ${String(title)}` : "Page changed";
    // Clear after a short interval so duplicate navigations to the same
    // route still trigger a fresh announcement.
    clearTimer = setTimeout(() => {
      routeAnnouncement.value = "";
    }, 2000);
  }, 100);
}

watch(() => route.meta?.title ?? route.name ?? route.path, scheduleAnnouncement);

onUnmounted(() => {
  if (announceTimer !== null) clearTimeout(announceTimer);
  if (clearTimer !== null) clearTimeout(clearTimer);
});
</script>

<template>
  <div class="min-h-screen transition-colors duration-200">
    <!-- Route-change announcer — WCAG SC 4.1.3: Status messages announced by AT without focus change -->
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
      data-testid="route-announcer"
    >{{ routeAnnouncement }}</div>

    <header>
      <Navbar />
    </header>

    <!-- Trial Countdown Banner -->
    <TrialCountdownBanner />

    <!-- API Health Banner -->
    <ApiHealthBanner />

    <div class="flex">
      <Sidebar />
      <main id="main-content" class="flex-1 lg:pl-64">
        <div class="py-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
