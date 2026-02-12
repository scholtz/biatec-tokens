<template>
  <div
    class="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
    :class="badgeClasses"
  >
    <i :class="iconClass"></i>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  riskLevel: 'low' | 'medium' | 'high';
}

const props = defineProps<Props>();

const badgeClasses = computed(() => {
  switch (props.riskLevel) {
    case 'low':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'high':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
});

const iconClass = computed(() => {
  switch (props.riskLevel) {
    case 'low':
      return 'pi pi-check-circle';
    case 'medium':
      return 'pi pi-exclamation-triangle';
    case 'high':
      return 'pi pi-times-circle';
    default:
      return 'pi pi-info-circle';
  }
});

const label = computed(() => {
  switch (props.riskLevel) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    default:
      return 'Unknown';
  }
});
</script>
