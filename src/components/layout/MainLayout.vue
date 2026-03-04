<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <header>
      <Navbar />
    </header>
    <main id="main-content" class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import Navbar from "../Navbar.vue";
</script>
