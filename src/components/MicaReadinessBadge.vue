<template>
  <Badge :variant="badgeVariant" :size="size">
    <i :class="iconClass" class="mr-1"></i>
    {{ status }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Badge from './ui/Badge.vue'
import { useTokenComplianceStore, type MicaReadinessStatus } from '../stores/tokenCompliance'

interface Props {
  tokenId: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const complianceStore = useTokenComplianceStore()

const status = computed<MicaReadinessStatus>(() => {
  return complianceStore.getReadinessStatus(props.tokenId)
})

const badgeVariant = computed(() => {
  return complianceStore.getReadinessBadgeVariant(status.value)
})

const iconClass = computed(() => {
  switch (status.value) {
    case 'Ready':
      return 'pi pi-check-circle'
    case 'At Risk':
      return 'pi pi-exclamation-triangle'
    case 'Incomplete':
      return 'pi pi-times-circle'
  }
})
</script>
