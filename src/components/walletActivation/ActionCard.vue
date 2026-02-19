<template>
  <Card
    :variant="selected ? 'default' : 'glass'"
    hover
    clickable
    @click="handleSelect"
    :class="[
      'transition-all duration-300',
      selected ? 'ring-2 ring-blue-500 shadow-xl' : '',
    ]"
  >
    <div class="flex flex-col items-center text-center p-4">
      <div
        :class="[
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
          selected
            ? 'bg-gradient-to-br from-blue-600 to-purple-600'
            : 'bg-gray-200 dark:bg-gray-700',
        ]"
      >
        <component :is="iconComponent" class="w-8 h-8 text-white" />
      </div>

      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {{ title }}
      </h3>

      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ description }}
      </p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from '../ui/Card.vue';
import {
  RocketLaunchIcon,
  ChartBarSquareIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  title: string;
  description: string;
  icon: 'rocket' | 'compare';
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

const emit = defineEmits<{
  select: [];
}>();

const iconComponent = computed(() => {
  return props.icon === 'rocket' ? RocketLaunchIcon : ChartBarSquareIcon;
});

const handleSelect = () => {
  emit('select');
};
</script>
