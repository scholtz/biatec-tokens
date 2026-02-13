<template>
  <Card variant="glass" padding="md">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white">KYC Document Checklist</h3>
          <p class="text-sm text-gray-400 mt-1">
            Complete all required documents to proceed
          </p>
        </div>
        
        <!-- Progress indicator -->
        <div class="text-right">
          <div class="text-2xl font-bold text-white">
            {{ completionPercentage }}%
          </div>
          <div class="text-xs text-gray-400">Complete</div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="relative pt-1">
        <div class="overflow-hidden h-2 text-xs flex rounded-full bg-gray-700">
          <div
            :style="{ width: `${completionPercentage}%` }"
            :class="[
              'transition-all duration-500 shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center',
              completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            ]"
          />
        </div>
      </div>

      <!-- Document list -->
      <div class="space-y-3">
        <div
          v-for="doc in documents"
          :key="doc.type"
          :class="[
            'p-4 rounded-lg border transition-all',
            getDocumentCardClasses(doc.status)
          ]"
        >
          <div class="flex items-start justify-between gap-4">
            <!-- Document info -->
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <!-- Status icon -->
                <component
                  :is="getStatusIcon(doc.status)"
                  :class="['w-5 h-5', getIconColor(doc.status)]"
                />
                
                <!-- Document label -->
                <h4 class="font-medium text-white">
                  {{ doc.label }}
                  <span v-if="doc.required" class="text-red-400 ml-1">*</span>
                </h4>
              </div>
              
              <p class="text-sm text-gray-400">{{ doc.description }}</p>
              
              <!-- Status details -->
              <div v-if="doc.status !== 'not_uploaded'" class="text-xs text-gray-500">
                <div v-if="doc.uploadedAt" class="flex items-center gap-1">
                  <ClockIcon class="w-3 h-3" />
                  <span>Uploaded {{ formatDate(doc.uploadedAt) }}</span>
                </div>
                
                <div v-if="doc.rejectionReason" class="mt-1 text-red-400">
                  <ExclamationCircleIcon class="w-3 h-3 inline mr-1" />
                  {{ doc.rejectionReason }}
                </div>
                
                <div v-if="doc.expiresAt" class="mt-1 text-yellow-400">
                  <ExclamationTriangleIcon class="w-3 h-3 inline mr-1" />
                  Expires {{ formatDate(doc.expiresAt) }}
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-col gap-2">
              <Button
                v-if="doc.status === 'not_uploaded' || doc.status === 'rejected'"
                variant="primary"
                size="sm"
                @click="$emit('upload', doc.type)"
              >
                <DocumentArrowUpIcon class="w-4 h-4 mr-1" />
                {{ doc.status === 'rejected' ? 'Reupload' : 'Upload' }}
              </Button>
              
              <Button
                v-if="doc.status === 'uploaded' || doc.status === 'under_review'"
                variant="secondary"
                size="sm"
                disabled
              >
                <ClockIcon class="w-4 h-4 mr-1" />
                Under Review
              </Button>
              
              <Button
                v-if="doc.status === 'approved'"
                variant="secondary"
                size="sm"
                @click="$emit('view', doc)"
              >
                <EyeIcon class="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline toggle -->
      <div v-if="showTimeline" class="pt-4 border-t border-gray-700">
        <button
          @click="timelineExpanded = !timelineExpanded"
          class="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          <component :is="timelineExpanded ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4" />
          <span>{{ timelineExpanded ? 'Hide' : 'Show' }} Verification Timeline</span>
        </button>
        
        <!-- Timeline content -->
        <div v-if="timelineExpanded" class="mt-4 space-y-3">
          <div
            v-for="event in recentEvents"
            :key="event.id"
            class="flex gap-3 text-sm"
          >
            <div class="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
            <div class="flex-1">
              <p class="text-gray-300">{{ event.description }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ formatDate(event.timestamp) }} • {{ event.actor }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import type { KYCDocument, KYCDocumentType, ComplianceEvent } from '../../types/compliance'

interface Props {
  documents: KYCDocument[]
  recentEvents?: ComplianceEvent[]
  showTimeline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recentEvents: () => [],
  showTimeline: true,
})

defineEmits<{
  upload: [type: KYCDocumentType]
  view: [doc: KYCDocument]
}>()

const timelineExpanded = ref(false)

const completionPercentage = computed(() => {
  const requiredDocs = props.documents.filter(doc => doc.required)
  if (requiredDocs.length === 0) return 0
  
  const completed = requiredDocs.filter(doc => doc.status === 'approved').length
  return Math.round((completed / requiredDocs.length) * 100)
})

const getDocumentCardClasses = (status: string): string => {
  const classes: Record<string, string> = {
    not_uploaded: 'border-gray-700 bg-gray-800/30',
    uploaded: 'border-blue-700 bg-blue-900/20',
    under_review: 'border-yellow-700 bg-yellow-900/20',
    approved: 'border-green-700 bg-green-900/20',
    rejected: 'border-red-700 bg-red-900/20',
    expired: 'border-orange-700 bg-orange-900/20',
  }
  
  return classes[status] || classes.not_uploaded
}

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    not_uploaded: ClockIcon,
    uploaded: ClockIcon,
    under_review: ClockIcon,
    approved: CheckCircleIcon,
    rejected: XCircleIcon,
    expired: ExclamationTriangleIcon,
  }
  
  return icons[status] || ClockIcon
}

const getIconColor = (status: string): string => {
  const colors: Record<string, string> = {
    not_uploaded: 'text-gray-400',
    uploaded: 'text-blue-400',
    under_review: 'text-yellow-400',
    approved: 'text-green-400',
    rejected: 'text-red-400',
    expired: 'text-orange-400',
  }
  
  return colors[status] || 'text-gray-400'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return hours === 0 ? 'Just now' : `${hours}h ago`
  } else if (diffInHours < 168) {
    const days = Math.floor(diffInHours / 24)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}
</script>
