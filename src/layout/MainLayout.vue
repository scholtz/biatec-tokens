<script setup lang="ts">
import Navbar from "../components/layout/Navbar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
import BoltBadge from "../components/ui/BoltBadge.vue";
import ApiHealthBanner from "../components/ApiHealthBanner.vue";
import { AlgorandAuthentication, type INotification } from "algorand-authentication-component-vue";
const onNotification = (notification: INotification) => {
  console.log("Notification received:", notification);
};
</script>

<template>
  <AlgorandAuthentication @notification="onNotification" arc14Realm="BiatecTokens#ARC14">
    <div class="min-h-screen transition-colors duration-200">
      <Navbar />
      
      <!-- API Health Banner -->
      <ApiHealthBanner />

      <div class="flex">
        <Sidebar />
        <main class="flex-1 lg:pl-64">
          <div class="py-6">
            <slot />
          </div>
        </main>
      </div>

      <!-- Footer with Bolt.new badge -->
      <footer class="lg:pl-64 py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-center">
            <BoltBadge />
          </div>
        </div>
      </footer>
    </div>
  </AlgorandAuthentication>
</template>
