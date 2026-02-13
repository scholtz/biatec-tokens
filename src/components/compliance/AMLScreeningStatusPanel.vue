<template>
  <Card variant="glass" padding="md">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'p-2 rounded-lg',
              verdictMetadata.isBlocking ? 'bg-red-900/30' : 'bg-green-900/30'
            ]"
          >
            <ShieldCheckIcon
              :class="[
                'w-6 h-6',
                verdictMetadata.isBlocking ? 'text-red-400' : 'text-green-400'
              ]"
            />
          </div>
          
          <div>
            <h3 class="text-lg font-semibold text-white">AML Screening Status</h3>
            <p class="text-sm text-gray-400 mt-0.5">
              Anti-money laundering and sanctions screening
            </p>
          </div>
        </div>
      </div>

      <!-- Status indicator -->
      <div
        :class="[
          'p-4 rounded-lg border',
          getVerdictCardClasses(screening.verdict)
        ]"
      >
        <div class="flex items-start gap-3">
          <component
            :is="verdictIcon"
            :class="['w-5 h-5 flex-shrink-0', getVerdictIconColor(screening.verdict)]"
          />
          
          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-2">
              <span class="font-medium text-white">{{ verdictMetadata.label }}</span>
              <Badge
                v-if="verdictMetadata.isBlocking"
                variant="error"
                size="sm"
              >
                Blocking
              </Badge>
            </div>
            
            <p class="text-sm text-gray-400">{{ verdictMetadata.description }}</p>
            
            <!-- Screening details -->
            <div v-if="screening.screenedAt" class="text-xs text-gray-500 flex items-center gap-1">
              <ClockIcon class="w-3 h-3" />
              <span>Screened {{ formatDate(screening.screenedAt) }}</span>
              <span v-if="screening.provider" class="ml-2">• Provider: {{ screening.provider }}</span>
            </div>
          </div>
        </div>

        <!-- Match details -->
        <div v-if="screening.matchDetails && screening.matchDetails.length > 0" class="mt-4 space-y-2">
          <div class="text-sm font-medium text-red-400">Screening Matches Detected:</div>
          <div
            v-for="(match, index) in screening.matchDetails"
            :key="index"
            class="p-3 rounded bg-red-900/20 border border-red-800"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-white">{{ match.listName }}</span>
              <span class="text-xs text-gray-400">{{ match.matchScore }}% confidence</span>
            </div>
            <div class="text-xs text-gray-400">
              Matched fields: {{ match.matchedFields.join(', ') }}
            </div>
          </div>
        </div>

        <!-- Processing error -->
        <div v-if="screening.processingError" class="mt-4 p-3 rounded bg-orange-900/20 border border-orange-800">
          <div class="flex items-start gap-2">
            <ExclamationCircleIcon class="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-orange-300">
              <div class="font-medium mb-1">Screening Error</div>
              <div class="text-xs text-gray-400">{{ screening.processingError }}</div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="screening.notes" class="mt-4 p-3 rounded bg-gray-800/50 border border-gray-700">
          <div class="text-xs text-gray-400">
            <span class="font-medium text-gray-300">Notes:</span> {{ screening.notes }}
          </div>
        </div>
      </div>

      <!-- Action guidance -->
      <div
        v-if="verdictMetadata.requiresAction"
        class="p-4 rounded-lg bg-blue-900/20 border border-blue-800"
      >
        <div class="flex items-start gap-3">
          <InformationCircleIcon class="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div class="flex-1 text-sm">
            <div class="font-medium text-blue-300 mb-1">Action Required</div>
            <p class="text-gray-400 mb-3">
              {{ getActionGuidance(screening.verdict) }}
            </p>
            <Button
              variant="primary"
              size="sm"
              @click="$emit('contact-support')"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>

      <!-- Technical details toggle -->
      <div v-if="showTechnicalDetails">
        <button
          @click="detailsExpanded = !detailsExpanded"
          class="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          <component :is="detailsExpanded ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4" />
          <span>{{ detailsExpanded ? 'Hide' : 'Show' }} Technical Details</span>
        </button>
        
        <div v-if="detailsExpanded" class="mt-3 p-3 rounded bg-gray-800/50 border border-gray-700">
          <pre class="text-xs text-gray-400 overflow-auto">{{ JSON.stringify(screening, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import Badge from '../ui/Badge.vue'
import type { AMLScreeningResult, AMLScreeningVerdict } from '../../types/compliance'
import { getAMLVerdictMetadata } from '../../utils/complianceStatus'

interface Props {
  screening: AMLScreeningResult
  showTechnicalDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTechnicalDetails: false,
})

defineEmits<{
  'contact-support': []
}>()

const detailsExpanded = ref(false)

const verdictMetadata = computed(() => getAMLVerdictMetadata(props.screening.verdict))

const verdictIcon = computed(() => {
  const icons: Record<AMLScreeningVerdict, any> = {
    not_started: ClockIcon,
    in_progress: ArrowPathIcon,
    clear: CheckCircleIcon,
    potential_match: ExclamationTriangleIcon,
    confirmed_match: ExclamationTriangleIcon,
    error: ExclamationCircleIcon,
    manual_review: ClockIcon,
  }
  
  return icons[props.screening.verdict] || ClockIcon
})

const getVerdictCardClasses = (verdict: AMLScreeningVerdict): string => {
  const classes: Record<AMLScreeningVerdict, string> = {
    not_started: 'border-gray-700 bg-gray-800/30',
    in_progress: 'border-blue-700 bg-blue-900/20',
    clear: 'border-green-700 bg-green-900/20',
    potential_match: 'border-yellow-700 bg-yellow-900/20',
    confirmed_match: 'border-red-700 bg-red-900/20',
    error: 'border-orange-700 bg-orange-900/20',
    manual_review: 'border-yellow-700 bg-yellow-900/20',
  }
  
  return classes[verdict] || classes.not_started
}

const getVerdictIconColor = (verdict: AMLScreeningVerdict): string => {
  const colors: Record<AMLScreeningVerdict, string> = {
    not_started: 'text-gray-400',
    in_progress: 'text-blue-400 animate-spin',
    clear: 'text-green-400',
    potential_match: 'text-yellow-400',
    confirmed_match: 'text-red-400',
    error: 'text-orange-400',
    manual_review: 'text-yellow-400',
  }
  
  return colors[verdict] || 'text-gray-400'
}

const getActionGuidance = (verdict: AMLScreeningVerdict): string => {
  const guidance: Record<AMLScreeningVerdict, string> = {
    not_started: 'AML screening will begin automatically once your documents are submitted.',
    in_progress: 'Screening is in progress. This typically takes a few minutes.',
    clear: 'Your screening is clear. No action needed.',
    potential_match: 'A potential match was detected in our screening. Our compliance team will review your case shortly.',
    confirmed_match: 'A sanctions list match was confirmed. Please contact our support team for assistance with this finding.',
    error: 'We encountered an error during screening. Our team has been notified and will retry the screening automatically.',
    manual_review: 'Your case requires manual review by our compliance team. We will contact you within 1-2 business days.',
  }
  
  return guidance[verdict] || ''
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60)
    return minutes === 0 ? 'Just now' : `${minutes}m ago`
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return `${hours}h ago`
  } else if (diffInHours < 168) {
    const days = Math.floor(diffInHours / 24)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}
</script>
