<template>
  <div class="inline-flex items-center gap-2">
    <span
      :class="[
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all',
        badgeClasses
      ]"
      :title="metadata.description"
    >
      <component
        :is="iconComponent"
        :class="['w-4 h-4', animated ? 'animate-pulse' : '']"
      />
      <span>{{ metadata.label }}</span>
    </span>
    
    <!-- Optional tooltip for detailed info -->
    <div
      v-if="showTooltip"
      class="relative group"
    >
      <button
        type="button"
        class="text-gray-400 hover:text-gray-300 transition-colors"
        @click="tooltipOpen = !tooltipOpen"
      >
        <InformationCircleIcon class="w-5 h-5" />
      </button>
      
      <!-- Tooltip content -->
      <div
        v-if="tooltipOpen"
        class="absolute z-50 w-64 p-3 mt-2 text-sm bg-gray-800 border border-gray-700 rounded-lg shadow-xl left-1/2 -translate-x-1/2"
      >
        <div class="space-y-2">
          <p class="text-gray-300">{{ metadata.description }}</p>
          
          <div v-if="metadata.requiresAction" class="pt-2 border-t border-gray-700">
            <p class="text-blue-400 font-medium">Action Required</p>
            <p class="text-gray-400 text-xs mt-1">{{ nextActionText }}</p>
          </div>
          
          <div v-if="estimatedTime" class="pt-2 border-t border-gray-700">
            <p class="text-gray-400 text-xs">
              <span class="font-medium">Estimated:</span> {{ estimatedTime }}
            </p>
          </div>
        </div>
        
        <!-- Close button -->
        <button
          @click="tooltipOpen = false"
          class="absolute top-1 right-1 text-gray-500 hover:text-gray-300"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  DocumentArrowUpIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import type { UserComplianceStatus } from '../../types/compliance'
import {
  getComplianceStatusMetadata,
  getNextActionText,
  getEstimatedCompletionTime,
} from '../../utils/complianceStatus'

interface Props {
  status: UserComplianceStatus
  showTooltip?: boolean
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTooltip: false,
  animated: false,
})

const tooltipOpen = ref(false)

const metadata = computed(() => getComplianceStatusMetadata(props.status))
const nextActionText = computed(() => getNextActionText(props.status))
const estimatedTime = computed(() => getEstimatedCompletionTime(props.status))

const badgeClasses = computed(() => {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-700/50 text-gray-300 border border-gray-600',
    blue: 'bg-blue-900/50 text-blue-300 border border-blue-700',
    yellow: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
    red: 'bg-red-900/50 text-red-300 border border-red-700',
    green: 'bg-green-900/50 text-green-300 border border-green-700',
    orange: 'bg-orange-900/50 text-orange-300 border border-orange-700',
  }
  
  return colorClasses[metadata.value.color] || colorClasses.gray
})

const iconComponent = computed(() => {
  const icons: Record<string, any> = {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    DocumentArrowUpIcon,
    ExclamationCircleIcon,
  }
  
  return icons[metadata.value.icon] || ClockIcon
})
</script>
