<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">
          Compliance Verification
        </h1>
        <p class="text-lg text-gray-400">
          Complete your KYC and AML verification to enable token issuance
        </p>
      </div>

      <!-- Loading state -->
      <div v-if="loading && !userComplianceState" class="flex items-center justify-center py-12">
        <div class="text-center">
          <ArrowPathIcon class="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p class="text-gray-400">Loading compliance status...</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="mb-8">
        <Card variant="glass" padding="md">
          <div class="flex items-start gap-3 text-red-400">
            <ExclamationCircleIcon class="w-6 h-6 flex-shrink-0" />
            <div>
              <div class="font-medium mb-1">Error Loading Compliance Data</div>
              <div class="text-sm text-gray-400">{{ error }}</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Main content -->
      <div v-else-if="userComplianceState" class="space-y-6">
        <!-- Gating banner -->
        <ComplianceGatingBanner
          :eligibility="currentEligibility"
          @complete-compliance="scrollToDocuments"
          @create-token="navigateToTokenCreation"
          @contact-support="contactSupport"
          @retry-compliance="retryCompliance"
        />

        <!-- Two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main column (2/3 width) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- KYC Progress -->
            <div ref="documentsSection">
              <KYCProgressChecklist
                :documents="userComplianceState.kycDocuments"
                :recent-events="recentEvents"
                :show-timeline="true"
                @upload="handleDocumentUpload"
                @view="handleDocumentView"
              />
            </div>

            <!-- AML Screening -->
            <AMLScreeningStatusPanel
              :screening="userComplianceState.amlScreening"
              :show-technical-details="false"
              @contact-support="contactSupport"
            />

            <!-- Compliance Events Timeline -->
            <Card variant="glass" padding="md">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-white">Verification Timeline</h3>
                  <Badge
                    variant="default"
                    size="sm"
                  >
                    {{ recentEvents.length }} events
                  </Badge>
                </div>

                <div v-if="recentEvents.length === 0" class="text-center py-8 text-gray-500">
                  <ClockIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No events yet. Start your compliance verification to see activity here.</p>
                </div>

                <div v-else class="space-y-4">
                  <div
                    v-for="event in recentEvents"
                    :key="event.id"
                    class="flex gap-4 pb-4 border-b border-gray-700 last:border-0"
                  >
                    <div class="flex-shrink-0">
                      <div class="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                        <component :is="getEventIcon(event.type)" class="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-2">
                        <p class="text-sm text-white">{{ event.description }}</p>
                        <Badge
                          :variant="getEventBadgeVariant(event.actor)"
                          size="sm"
                          class="flex-shrink-0"
                        >
                          {{ event.actor }}
                        </Badge>
                      </div>
                      
                      <p class="text-xs text-gray-500 mt-1">
                        {{ formatEventTimestamp(event.timestamp) }}
                        <span v-if="event.actorId" class="ml-2">• {{ event.actorId }}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <!-- Sidebar (1/3 width) -->
          <div class="space-y-6">
            <!-- Status Overview Card -->
            <Card variant="glass" padding="md">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-white">Status Overview</h3>
                
                <!-- Overall status -->
                <div class="p-3 rounded-lg bg-gray-800/50">
                  <div class="text-xs text-gray-500 mb-1">Current Status</div>
                  <ComplianceStatusBadge
                    :status="complianceStatus"
                    :show-tooltip="false"
                    :animated="complianceStatus === 'pending_review'"
                  />
                </div>

                <!-- Document progress -->
                <div class="p-3 rounded-lg bg-gray-800/50">
                  <div class="text-xs text-gray-500 mb-2">Document Progress</div>
                  <div class="flex items-center gap-3">
                    <div class="flex-1">
                      <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          :style="{ width: `${documentCompletionPercentage}%` }"
                          :class="[
                            'h-full transition-all duration-500',
                            documentCompletionPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                          ]"
                        />
                      </div>
                    </div>
                    <div class="text-sm font-medium text-white">
                      {{ documentCompletionPercentage }}%
                    </div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ completedDocuments.length }} of {{ totalRequiredDocuments }} completed
                  </div>
                </div>

                <!-- AML Status -->
                <div class="p-3 rounded-lg bg-gray-800/50">
                  <div class="text-xs text-gray-500 mb-2">AML Screening</div>
                  <div class="flex items-center gap-2">
                    <component
                      :is="getAMLIcon(userComplianceState.amlScreening.verdict)"
                      :class="['w-4 h-4', getAMLIconColor(userComplianceState.amlScreening.verdict)]"
                    />
                    <span class="text-sm text-white">
                      {{ getAMLLabel(userComplianceState.amlScreening.verdict) }}
                    </span>
                  </div>
                </div>

                <!-- Last updated -->
                <div class="pt-3 border-t border-gray-700 text-xs text-gray-500">
                  Last updated: {{ formatTimestamp(userComplianceState.lastUpdated) }}
                </div>
              </div>
            </Card>

            <!-- Help & Support Card -->
            <Card variant="glass" padding="md">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-white">Need Help?</h3>
                
                <div class="space-y-3 text-sm text-gray-400">
                  <p>
                    Our compliance team is here to assist you with any questions about the verification process.
                  </p>
                  
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <ClockIcon class="w-4 h-4 text-gray-500" />
                      <span>Average review time: 1-3 business days</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <ChatBubbleLeftRightIcon class="w-4 h-4 text-gray-500" />
                      <span>Support available: Mon-Fri, 9am-5pm EST</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    class="w-full"
                    @click="contactSupport"
                  >
                    <ChatBubbleLeftRightIcon class="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </Card>

            <!-- Documentation Link -->
            <Card variant="glass" padding="md">
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-white">
                  <DocumentTextIcon class="w-5 h-5 text-blue-400" />
                  <h4 class="font-medium">Documentation</h4>
                </div>
                
                <p class="text-sm text-gray-400">
                  Learn more about our compliance requirements and MICA alignment.
                </p>

                <Button
                  variant="secondary"
                  size="sm"
                  class="w-full"
                  @click="viewDocumentation"
                >
                  <DocumentTextIcon class="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <!-- Document upload modal -->
      <Modal
        :show="uploadModalOpen"
        @close="uploadModalOpen = false"
      >
        <template #header>
          <h3 class="text-xl font-bold text-white">Upload Document</h3>
        </template>
        <div class="space-y-4">
          <p class="text-gray-400">
            Upload your {{ selectedDocumentType }} document. Supported formats: PDF, JPG, PNG.
          </p>
          
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white"
            @change="handleFileSelected"
          />

          <div class="flex gap-3 justify-end">
            <Button variant="secondary" @click="uploadModalOpen = false">
              Cancel
            </Button>
            <Button
              variant="primary"
              :disabled="!selectedFile || uploading"
              @click="uploadDocument"
            >
              <ArrowUpTrayIcon class="w-4 h-4 mr-2" />
              {{ uploading ? 'Uploading...' : 'Upload' }}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
} from '@heroicons/vue/24/outline'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import Badge from '../components/ui/Badge.vue'
import Modal from '../components/ui/Modal.vue'
import ComplianceGatingBanner from '../components/compliance/ComplianceGatingBanner.vue'
import ComplianceStatusBadge from '../components/compliance/ComplianceStatusBadge.vue'
import KYCProgressChecklist from '../components/compliance/KYCProgressChecklist.vue'
import AMLScreeningStatusPanel from '../components/compliance/AMLScreeningStatusPanel.vue'
import { useComplianceOrchestrationStore } from '../stores/complianceOrchestration'
import { useAuthStore } from '../stores/auth'
import { getAMLVerdictMetadata } from '../utils/complianceStatus'
import type { KYCDocumentType, KYCDocument, ComplianceEventType } from '../types/compliance'

const router = useRouter()
const complianceStore = useComplianceOrchestrationStore()
const authStore = useAuthStore()

const {
  userComplianceState,
  loading,
  error,
  complianceStatus,
  completedDocuments,
  documentCompletionPercentage,
  recentEvents,
} = complianceStore

// Local state
const uploadModalOpen = ref(false)
const selectedDocumentType = ref<string>('')
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const documentsSection = ref<HTMLElement | null>(null)

// Error handling
onErrorCaptured((err, instance, info) => {
  console.error('[ComplianceOrchestrationView] Error captured:', {
    error: err,
    component: instance?.$options?.name || 'Unknown',
    info
  })
  // Prevent error from propagating and crashing the app
  return false
})

// Computed
const currentEligibility = computed(() => {
  try {
    return complianceStore.checkIssuanceEligibility()
  } catch (err) {
    console.error('[ComplianceOrchestrationView] Error checking eligibility:', err)
    return {
      eligible: false,
      status: 'not_started' as const,
      reasons: ['Error checking compliance status. Please contact support.'],
      nextActions: [],
      canRetry: true
    }
  }
})

const totalRequiredDocuments = computed(() => {
  if (!userComplianceState) return 0
  try {
    return userComplianceState.kycDocuments.filter(doc => doc.required).length
  } catch (err) {
    console.error('[ComplianceOrchestrationView] Error calculating required documents:', err)
    return 0
  }
})

// Lifecycle
onMounted(async () => {
  try {
    // Initialize compliance state for current user
    if (authStore.user) {
      await complianceStore.initializeComplianceState(
        authStore.user.address,
        authStore.user.email || ''
      )
    }
  } catch (err) {
    console.error('[ComplianceOrchestrationView] Initialization error:', err)
    // Error will be shown in error state from store
  }
})

// Methods
const handleDocumentUpload = (documentType: KYCDocumentType) => {
  selectedDocumentType.value = documentType
  uploadModalOpen.value = true
  selectedFile.value = null
}

const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

const uploadDocument = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  try {
    await complianceStore.uploadKYCDocument(
      selectedDocumentType.value as KYCDocumentType,
      selectedFile.value
    )
    
    uploadModalOpen.value = false
    selectedFile.value = null
    selectedDocumentType.value = ''
  } catch (err) {
    console.error('Upload failed:', err)
  } finally {
    uploading.value = false
  }
}

const handleDocumentView = (doc: KYCDocument) => {
  // TODO: Implement document viewer
  console.log('View document:', doc)
}

const scrollToDocuments = () => {
  documentsSection.value?.scrollIntoView({ behavior: 'smooth' })
}

const navigateToTokenCreation = () => {
  router.push('/create/wizard')
}

const contactSupport = () => {
  // TODO: Implement support contact
  window.open('mailto:support@biatec.io?subject=Compliance Support Request', '_blank')
}

const retryCompliance = async () => {
  // Reload compliance state
  if (authStore.user) {
    await complianceStore.initializeComplianceState(
      authStore.user.address,
      authStore.user.email || ''
    )
  }
}

const viewDocumentation = () => {
  router.push('/enterprise-guide')
}

const getEventIcon = (eventType: ComplianceEventType) => {
  const icons: Record<ComplianceEventType, any> = {
    compliance_started: ClockIcon,
    document_uploaded: DocumentArrowUpIcon,
    document_rejected: ExclamationCircleIcon,
    kyc_review_started: ClockIcon,
    kyc_approved: CheckCircleIcon,
    kyc_rejected: ExclamationCircleIcon,
    aml_screening_started: ShieldCheckIcon,
    aml_screening_completed: ShieldCheckIcon,
    aml_match_detected: ExclamationCircleIcon,
    case_escalated: ExclamationCircleIcon,
    compliance_approved: CheckCircleIcon,
    compliance_rejected: ExclamationCircleIcon,
    compliance_expired: ClockIcon,
    issuance_attempted: DocumentArrowUpIcon,
    issuance_blocked: ExclamationCircleIcon,
    remediation_requested: DocumentArrowUpIcon,
  }
  
  return icons[eventType] || ClockIcon
}

const getEventBadgeVariant = (actor: string): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  const variants: Record<string, any> = {
    user: 'info',
    system: 'default',
    admin: 'success',
    provider: 'default',
  }
  
  return variants[actor] || 'default'
}

const getAMLIcon = (verdict: string) => {
  const metadata = getAMLVerdictMetadata(verdict as any)
  return metadata.isBlocking ? ExclamationCircleIcon : CheckCircleIcon
}

const getAMLIconColor = (verdict: string): string => {
  const metadata = getAMLVerdictMetadata(verdict as any)
  return metadata.isBlocking ? 'text-red-400' : 'text-green-400'
}

const getAMLLabel = (verdict: string): string => {
  const metadata = getAMLVerdictMetadata(verdict as any)
  return metadata.label
}

const formatEventTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Initialize compliance state on component mount
onMounted(async () => {
  try {
    if (authStore.user) {
      await complianceStore.initializeComplianceState(
        authStore.user.address,
        authStore.user.email || ''
      )
    }
  } catch (err) {
    console.error('[ComplianceOrchestrationView] Failed to initialize compliance state:', err)
  }
})
</script>
