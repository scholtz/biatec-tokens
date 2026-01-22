<template>
  <div class="glass-effect rounded-xl p-6 hover:shadow-lg transition-all">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div 
          :class="[
            'w-12 h-12 rounded-lg flex items-center justify-center',
            iconBgClass
          ]"
        >
          <i :class="[icon, 'text-2xl', iconColorClass]"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
          <p class="text-sm text-gray-400">{{ subtitle }}</p>
        </div>
      </div>
      <button
        v-if="hasDetails"
        @click="$emit('view-details')"
        class="text-gray-400 hover:text-biatec-accent transition-colors"
        title="View details"
      >
        <i class="pi pi-chevron-right"></i>
      </button>
    </div>

    <div class="space-y-3">
      <slot name="content">
        <!-- Default content slot -->
        <div v-if="value" class="text-3xl font-bold text-white">
          {{ value }}
        </div>
        <div v-if="description" class="text-sm text-gray-400">
          {{ description }}
        </div>
      </slot>

      <slot name="metrics">
        <!-- Additional metrics slot -->
      </slot>
    </div>

    <div v-if="lastUpdated" class="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
      Last updated: {{ formatTimestamp(lastUpdated) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink';
  value?: string | number;
  description?: string;
  lastUpdated?: string;
  hasDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'blue',
  hasDetails: false,
});

defineEmits<{
  'view-details': [];
}>();

const iconColorClass = computed(() => {
  const colors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400',
  };
  return colors[props.iconColor];
});

const iconBgClass = computed(() => {
  const backgrounds = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    yellow: 'bg-yellow-500/10',
    purple: 'bg-purple-500/10',
    orange: 'bg-orange-500/10',
    pink: 'bg-pink-500/10',
  };
  return backgrounds[props.iconColor];
});

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
</script>
