<template>
  <Card variant="default" hover clickable @click="handleSelect">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ opportunity.title }}
          </h3>
          <Badge variant="info" size="sm">
            {{ opportunity.standard }}
          </Badge>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            RWA Score
          </div>
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ opportunity.rwaScore }}
          </div>
        </div>
      </div>

      <!-- Description -->
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
        {{ opportunity.description }}
      </p>

      <!-- Scores -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Compliance
          </div>
          <div class="flex items-center">
            <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
              <div
                class="bg-green-500 h-2 rounded-full"
                :style="{ width: `${opportunity.complianceScore}%` }"
              />
            </div>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ opportunity.complianceScore }}%
            </span>
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            RWA Fit
          </div>
          <div class="flex items-center">
            <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
              <div
                class="bg-blue-500 h-2 rounded-full"
                :style="{ width: `${opportunity.rwaScore}%` }"
              />
            </div>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ opportunity.rwaScore }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Reason -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div class="flex items-start space-x-2">
          <LightBulbIcon class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-blue-800 dark:text-blue-300">
            {{ opportunity.reason }}
          </p>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-4">
        <Button variant="secondary" size="sm" class="w-full">
          Learn More
          <ArrowRightIcon class="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from '../ui/Card.vue';
import Button from '../ui/Button.vue';
import Badge from '../ui/Badge.vue';
import { LightBulbIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  standard: string;
  rwaScore: number;
  complianceScore: number;
  reason: string;
}

interface Props {
  opportunity: Opportunity;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [opportunity: Opportunity];
}>();

const handleSelect = () => {
  emit('select', props.opportunity);
};
</script>
