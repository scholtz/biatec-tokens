<template>
  <div class="inline-flex items-center gap-2">
    <span 
      :class="badgeClasses" 
      :title="tooltip"
      class="px-3 py-1 text-sm font-medium rounded-full border transition-colors"
    >
      <i :class="iconClass" class="mr-1.5"></i>
      {{ badgeText }}
    </span>
    
    <!-- Optional quality score display -->
    <span 
      v-if="showScore && validationResult" 
      :class="scoreClasses"
      class="px-2 py-0.5 text-xs font-semibold rounded"
      :title="`Quality Score: ${validationResult.score}/100`"
    >
      {{ validationResult.score }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MetadataValidationResult } from '../utils/metadataValidation'
import { getScoreColorClass, getScoreBadgeLabel } from '../utils/metadataValidation'

interface Props {
  validationResult: MetadataValidationResult | null
  loading?: boolean
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showScore: true,
  size: 'md'
})

const badgeText = computed(() => {
  if (props.loading) return 'Validating...'
  if (!props.validationResult) return 'No Metadata'
  
  if (props.validationResult.isValid && props.validationResult.issues.length === 0) {
    return `${props.validationResult.standard}: Valid`
  }
  
  if (props.validationResult.isValid) {
    return `${props.validationResult.standard}: ${getScoreBadgeLabel(props.validationResult.score)}`
  }
  
  return `${props.validationResult.standard}: Issues`
})

const badgeClasses = computed(() => {
  if (props.loading) {
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30 animate-pulse'
  }
  
  if (!props.validationResult) {
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
  
  const score = props.validationResult.score
  
  if (score >= 90) {
    return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
  }
  
  if (score >= 70) {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
  }
  
  if (score >= 50) {
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30'
  }
  
  return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
})

const iconClass = computed(() => {
  if (props.loading) return 'pi pi-spin pi-spinner'
  if (!props.validationResult) return 'pi pi-times-circle'
  
  const score = props.validationResult.score
  
  if (score >= 90) return 'pi pi-check-circle'
  if (score >= 50) return 'pi pi-exclamation-triangle'
  return 'pi pi-times-circle'
})

const scoreClasses = computed(() => {
  if (!props.validationResult) return 'bg-gray-500/20 text-gray-400'
  return getScoreColorClass(props.validationResult.score)
})

const tooltip = computed(() => {
  if (props.loading) return 'Validating metadata...'
  if (!props.validationResult) return 'No metadata available'
  return props.validationResult.summary
})
</script>
