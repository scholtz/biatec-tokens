<template>
  <div class="wizard-step">
    <!-- Step Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ title }}
      </h2>
      <p v-if="description" class="text-gray-600 dark:text-gray-400">
        {{ description }}
      </p>
    </div>

    <!-- Validation Error Summary -->
    <div
      v-if="showErrors && validationErrors.length > 0"
      role="alert"
      class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-red-400 text-lg mt-0.5"></i>
        <div class="flex-1">
          <p class="text-sm font-semibold text-red-400 mb-2">
            Please fix the following errors:
          </p>
          <ul class="space-y-1">
            <li
              v-for="(error, index) in validationErrors"
              :key="index"
              class="text-sm text-red-300"
            >
              • {{ error }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="wizard-step-content">
      <slot />
    </div>

    <!-- Help Text -->
    <div v-if="helpText" class="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
        <p class="text-sm text-blue-300">
          {{ helpText }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  helpText?: string
  validationErrors?: string[]
  showErrors?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  validationErrors: () => [],
  showErrors: false,
})
</script>

<style scoped>
.wizard-step {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
