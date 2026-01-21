<template>
  <canvas id="gradient-canvas" data-transition-in />
  <RouterView />
  <Toast />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useThemeStore } from "./stores/theme";
import { Gradient } from "whatamesh";
import Toast from "./components/Toast.vue";

let gradient = new Gradient();

const themeStore = useThemeStore();
const callback = (isLight: boolean) => {
  console.log("callback called", isLight);
  if (isLight) {
    document.documentElement.style.setProperty("--bg-color-1", "#ffffff");
    document.documentElement.style.setProperty("--bg-color-2", "#ffffff");
    document.documentElement.style.setProperty("--bg-color-3", "#ffffff");
    document.documentElement.style.setProperty("--bg-color-4", "#ffffff");
  } else {
    document.documentElement.style.setProperty("--bg-color-1", "#043d5d");
    document.documentElement.style.setProperty("--bg-color-2", "#032e46");
    document.documentElement.style.setProperty("--bg-color-3", "#23b684");
    document.documentElement.style.setProperty("--bg-color-4", "#0f595e");
  }
  gradient = new Gradient();
  gradient.initGradient("#gradient-canvas");
};

onMounted(() => {
  themeStore.initTheme(callback);
  console.log("gradient init");
  gradient.initGradient("#gradient-canvas");
  console.log("gradient done");
});
</script>

<style>
:root {
  --bg-color-1: #043d5d;
  --bg-color-2: #032e46;
  --bg-color-3: #23b684;
  --bg-color-4: #0f595e;
}
#gradient-canvas {
  width: 100%;
  height: 100%;
  --gradient-color-1: var(--bg-color-1);
  --gradient-color-2: var(--bg-color-2);
  --gradient-color-3: var(--bg-color-3);
  --gradient-color-4: var(--bg-color-4);
  position: fixed;
  top: 0;
  left: 0;
  z-index: -10000;
}
</style>
