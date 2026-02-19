<template>
  <div
    class="flex items-start p-4 rounded-lg border"
    :class="statusClasses"
  >
    <div class="flex-shrink-0">
      <component
        :is="iconComponent"
        class="w-6 h-6"
        :class="iconClasses"
      />
    </div>
    <div class="ml-4 flex-1">
      <h3 class="text-sm font-medium" :class="titleClasses">
        {{ title }}
      </h3>
      <p class="mt-1 text-sm" :class="descriptionClasses">
        {{ description }}
      </p>
    </div>
    <div v-if="loading" class="ml-4">
      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  status: boolean;
  title: string;
  description: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const iconComponent = computed(() => {
  if (props.loading) return ClockIcon;
  return props.status ? CheckCircleIcon : XCircleIcon;
});

const statusClasses = computed(() => {
  if (props.loading) {
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  }
  if (props.status) {
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  }
  return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
});

const iconClasses = computed(() => {
  if (props.loading) {
    return 'text-blue-600 dark:text-blue-400';
  }
  if (props.status) {
    return 'text-green-600 dark:text-green-400';
  }
  return 'text-red-600 dark:text-red-400';
});

const titleClasses = computed(() => {
  if (props.loading) {
    return 'text-blue-900 dark:text-blue-200';
  }
  if (props.status) {
    return 'text-green-900 dark:text-green-200';
  }
  return 'text-red-900 dark:text-red-200';
});

const descriptionClasses = computed(() => {
  if (props.loading) {
    return 'text-blue-700 dark:text-blue-300';
  }
  if (props.status) {
    return 'text-green-700 dark:text-green-300';
  }
  return 'text-red-700 dark:text-red-300';
});
</script>
