<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <TransitionGroup
        name="toast"
        tag="div"
        enter-active-class="transition ease-out duration-300"
        enter-from-class="transform translate-x-full opacity-0"
        enter-to-class="transform translate-x-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="transform translate-x-0 opacity-100"
        leave-to-class="transform translate-x-full opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="toastClasses(toast.type)"
          class="flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg max-w-md"
        >
          <div class="flex-shrink-0">
            <i :class="iconClass(toast.type)" class="text-xl"></i>
          </div>
          <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
          <button
            @click="removeToast(toast.id)"
            class="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, removeToast } = useToast();

const toastClasses = (type: string) => {
  const baseClasses = 'glass-effect backdrop-blur-sm';
  
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
    case 'error':
      return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
    case 'warning':
      return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
    case 'info':
    default:
      return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
  }
};

const iconClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'pi pi-check-circle';
    case 'error':
      return 'pi pi-times-circle';
    case 'warning':
      return 'pi pi-exclamation-triangle';
    case 'info':
    default:
      return 'pi pi-info-circle';
  }
};
</script>

<style scoped>
.toast-move {
  transition: transform 0.3s ease;
}
</style>
