<template>
  <Modal
    :show="true"
    @close="$emit('close')"
    size="lg"
  >
    <template #header>
      <h2 class="text-xl font-semibold text-white">Metric Definitions</h2>
    </template>

    <div class="space-y-4 max-h-96 overflow-y-auto">
      <div
        v-for="metric in metrics"
        :key="metric.id"
        class="pb-4 border-b border-gray-700 last:border-0"
      >
        <div class="flex items-start justify-between mb-2">
          <h4 class="text-sm font-medium text-white">{{ metric.label }}</h4>
          <Badge variant="default" size="sm">{{ metric.id }}</Badge>
        </div>
        <p class="text-sm text-gray-400">{{ metric.definition }}</p>
        
        <div v-if="metric.value" class="mt-2 text-xs text-gray-500">
          Current value: <span class="text-white font-medium">{{ metric.value }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="secondary" @click="$emit('close')">
        Close
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from '../ui/Modal.vue'
import Button from '../ui/Button.vue'
import Badge from '../ui/Badge.vue'
import type { MetricData } from '../../stores/insights'

interface Props {
  metrics: MetricData[]
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
