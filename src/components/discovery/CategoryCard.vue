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
    <div class="flex flex-col h-full">
      <div class="flex items-start justify-between mb-4">
        <div
          :class="[
            'w-12 h-12 rounded-xl flex items-center justify-center',
            selected
              ? 'bg-gradient-to-br from-blue-600 to-purple-600'
              : 'bg-gray-200 dark:bg-gray-700',
          ]"
        >
          <component :is="iconComponent" class="w-6 h-6 text-white" />
        </div>
        <Badge
          v-if="category.rwaRelevance === 'high'"
          variant="success"
          size="sm"
        >
          RWA Ready
        </Badge>
      </div>

      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {{ category.name }}
      </h3>

      <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
        {{ category.description }}
      </p>

      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="standard in category.standards"
          :key="standard"
          variant="default"
          size="sm"
        >
          {{ standard }}
        </Badge>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from '../ui/Card.vue';
import Badge from '../ui/Badge.vue';
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  standards: string[];
  rwaRelevance: 'high' | 'medium' | 'low';
}

interface Props {
  category: Category;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

const emit = defineEmits<{
  select: [categoryId: string];
}>();

const iconComponent = computed(() => {
  const iconMap: Record<string, any> = {
    building: BuildingOfficeIcon,
    currency: CurrencyDollarIcon,
    photo: PhotoIcon,
    users: UserGroupIcon,
  };
  return iconMap[props.category.icon] || BuildingOfficeIcon;
});

const handleSelect = () => {
  emit('select', props.category.id);
};
</script>
