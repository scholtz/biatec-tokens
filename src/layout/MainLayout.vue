<script setup lang="ts">
import Navbar from "../components/layout/Navbar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
import ApiHealthBanner from "../components/ApiHealthBanner.vue";
import TrialCountdownBanner from "../components/TrialCountdownBanner.vue";
</script>

<template>
  <div class="min-h-screen transition-colors duration-200">
    <Navbar />

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
