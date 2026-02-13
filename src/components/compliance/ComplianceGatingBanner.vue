<template>
  <div
    :class="[
      'rounded-lg border-2 p-6 transition-all',
      isBlocked ? 'border-red-700 bg-red-900/20' : 'border-green-700 bg-green-900/20'
    ]"
  >
    <div class="flex items-start gap-4">
      <!-- Icon -->
      <div
        :class="[
          'p-3 rounded-lg flex-shrink-0',
          isBlocked ? 'bg-red-900/50' : 'bg-green-900/50'
        ]"
      >
        <component
          :is="isBlocked ? ShieldExclamationIcon : CheckCircleIcon"
          :class="[
            'w-8 h-8',
            isBlocked ? 'text-red-400' : 'text-green-400'
          ]"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 space-y-3">
        <!-- Title -->
        <div>
          <h3 class="text-xl font-bold text-white">
            {{ isBlocked ? 'Token Issuance Unavailable' : 'Ready for Token Issuance' }}
          </h3>
          <p class="text-sm text-gray-400 mt-1">
            {{ isBlocked ? 'Complete compliance requirements to enable token creation' : 'Your compliance verification is approved' }}
          </p>
        </div>

        <!-- Status badge -->
        <div>
          <ComplianceStatusBadge
            :status="eligibility.status"
            :show-tooltip="true"
          />
        </div>

        <!-- Reasons (if blocked) -->
        <div v-if="isBlocked && eligibility.reasons.length > 0" class="space-y-2">
          <div class="text-sm font-medium text-gray-300">Reasons:</div>
          <ul class="space-y-1">
            <li
              v-for="(reason, index) in eligibility.reasons"
              :key="index"
              class="flex items-start gap-2 text-sm text-gray-400"
            >
              <ExclamationCircleIcon class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{{ reason }}</span>
            </li>
          </ul>
        </div>

        <!-- Next actions -->
        <div v-if="eligibility.nextActions.length > 0" class="space-y-2">
          <div class="text-sm font-medium text-gray-300">Next Steps:</div>
          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="action in eligibility.nextActions"
              :key="action.type"
              :class="[
                'p-3 rounded-lg border',
                action.priority === 'high' ? 'border-red-700 bg-red-900/10' :
                action.priority === 'medium' ? 'border-yellow-700 bg-yellow-900/10' :
                'border-gray-700 bg-gray-800/30'
              ]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-white">{{ action.title }}</span>
                    <Badge
                      v-if="action.priority === 'high'"
                      variant="error"
                      size="sm"
                    >
                      High Priority
                    </Badge>
                  </div>
                  <p class="text-xs text-gray-400">{{ action.description }}</p>
                  
                  <div v-if="action.dueDate" class="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <ClockIcon class="w-3 h-3" />
                    <span>Due: {{ formatDate(action.dueDate) }}</span>
                  </div>
                </div>

                <Button
                  v-if="action.actionUrl"
                  variant="primary"
                  size="sm"
                  @click="handleAction(action)"
                >
                  <ArrowRightIcon class="w-4 h-4 mr-1" />
                  {{ getActionButtonText(action.type) }}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA buttons -->
        <div class="flex flex-wrap gap-3 pt-2">
          <Button
            v-if="isBlocked && showCompleteButton"
            variant="primary"
            @click="$emit('complete-compliance')"
          >
            <DocumentCheckIcon class="w-5 h-5 mr-2" />
            Complete Compliance
          </Button>

          <Button
            v-if="!isBlocked && showCreateTokenButton"
            variant="primary"
            @click="$emit('create-token')"
          >
            <SparklesIcon class="w-5 h-5 mr-2" />
            Create Token
          </Button>

          <Button
            v-if="showContactSupport"
            variant="secondary"
            @click="$emit('contact-support')"
          >
            <ChatBubbleLeftRightIcon class="w-5 h-5 mr-2" />
            Contact Support
          </Button>

          <Button
            v-if="eligibility.canRetry && showRetryButton"
            variant="secondary"
            @click="$emit('retry-compliance')"
          >
            <ArrowPathIcon class="w-5 h-5 mr-2" />
            Retry Verification
          </Button>
        </div>

        <!-- Additional help text -->
        <div v-if="showHelpText" class="pt-3 border-t border-gray-700">
          <div class="flex items-start gap-2 text-xs text-gray-500">
            <InformationCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              {{ isBlocked 
                ? 'Our compliance verification process typically completes within 1-3 business days. You will receive email notifications about your status.' 
                : 'Your compliance approval is valid for 12 months. We will notify you before it expires.' 
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ShieldExclamationIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  DocumentCheckIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'
import Button from '../ui/Button.vue'
import Badge from '../ui/Badge.vue'
import ComplianceStatusBadge from './ComplianceStatusBadge.vue'
import type { IssuanceEligibility, RemediationAction, RemediationActionType } from '../../types/compliance'

interface Props {
  eligibility: IssuanceEligibility
  showCompleteButton?: boolean
  showCreateTokenButton?: boolean
  showContactSupport?: boolean
  showRetryButton?: boolean
  showHelpText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCompleteButton: true,
  showCreateTokenButton: true,
  showContactSupport: true,
  showRetryButton: true,
  showHelpText: true,
})

const emit = defineEmits<{
  'complete-compliance': []
  'create-token': []
  'contact-support': []
  'retry-compliance': []
  'action-clicked': [action: RemediationAction]
}>()

const isBlocked = computed(() => !props.eligibility.eligible)

const handleAction = (action: RemediationAction) => {
  emit('action-clicked', action)
  
  if (action.actionUrl) {
    window.location.href = action.actionUrl
  }
}

const getActionButtonText = (actionType: RemediationActionType): string => {
  const labels: Record<RemediationActionType, string> = {
    upload_document: 'Upload',
    resubmit_document: 'Resubmit',
    contact_support: 'Contact',
    provide_additional_info: 'Provide Info',
    wait_for_review: 'View Status',
    acknowledge_block: 'Acknowledge',
  }
  
  return labels[actionType] || 'Take Action'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}
</script>
