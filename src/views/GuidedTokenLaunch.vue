<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-3">
          Guided Token Launch
        </h1>
        <p class="text-xl text-gray-300">
          Create your compliant token in under 30 minutes
        </p>
        <p class="text-sm text-gray-400 mt-2">
          Email/password authentication • No blockchain expertise required
        </p>
      </div>

      <!-- Progress Overview -->
      <Card variant="glass" padding="md" class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="text-2xl font-bold text-white">
              {{ progressPercentage }}%
            </div>
            <div class="text-sm text-gray-300">
              {{ completedSteps }} of {{ totalSteps }} steps complete
            </div>
          </div>
          <Button
            v-if="currentStep > 0"
            @click="handleSaveDraft"
            variant="ghost"
            size="sm"
            :disabled="isSaving"
          >
            <i class="pi pi-save mr-2"></i>
            {{ isSaving ? 'Saving...' : 'Save Draft' }}
          </Button>
        </div>
        
        <!-- Progress Bar -->
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div
            class="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </Card>

      <!-- Step Indicator -->
      <div class="mb-8 overflow-x-auto">
        <div class="flex items-center gap-2 min-w-max">
          <div
            v-for="(step, index) in stepStatuses"
            :key="step.id"
            class="flex items-center"
          >
            <!-- Step Circle -->
            <button
              @click="handleStepNavigation(index)"
              :disabled="!canNavigateToStep(index)"
              :class="[
                'relative w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                currentStep === index
                  ? 'bg-blue-500 text-white ring-4 ring-blue-500/30 scale-110'
                  : step.isComplete
                  ? 'bg-green-500 text-white hover:scale-105'
                  : 'bg-gray-700 text-gray-400',
                !canNavigateToStep(index) && 'cursor-not-allowed opacity-50'
              ]"
              :aria-label="`Step ${index + 1}: ${step.title}`"
              :aria-current="currentStep === index ? 'step' : undefined"
            >
              <CheckIcon v-if="step.isComplete && currentStep !== index" class="w-5 h-5" />
              <span v-else>{{ index + 1 }}</span>
              
              <!-- Validation Error Indicator -->
              <div
                v-if="step.validation && !step.validation.isValid && step.isComplete"
                class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <ExclamationTriangleIcon class="w-3 h-3 text-white" />
              </div>
            </button>

            <!-- Step Label (Hidden on mobile) -->
            <div class="hidden md:block ml-2 mr-4">
              <div :class="[
                'text-sm font-medium',
                currentStep === index ? 'text-blue-400' : step.isComplete ? 'text-green-400' : 'text-gray-500'
              ]">
                {{ step.title }}
              </div>
              <div v-if="step.isOptional" class="text-xs text-gray-500">Optional</div>
            </div>

            <!-- Connector Line -->
            <div
              v-if="index < stepStatuses.length - 1"
              :class="[
                'hidden md:block w-12 h-1 transition-all duration-300',
                step.isComplete ? 'bg-green-500' : 'bg-gray-700'
              ]"
            ></div>
          </div>
        </div>
        
        <!-- Mobile Step Title -->
        <div class="md:hidden text-center mt-4">
          <div class="text-sm font-medium text-blue-400">
            {{ stepStatuses[currentStep]?.title }}
          </div>
          <div v-if="stepStatuses[currentStep]?.isOptional" class="text-xs text-gray-500">
            Optional Step
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <Card variant="glass" padding="lg" class="mb-6">
        <!-- Step 0: Organization Profile -->
        <OrganizationProfileStep
          v-if="currentStep === 0"
          @complete="handleStepComplete"
          @update="handleOrganizationUpdate"
        />

        <!-- Step 1: Token Intent -->
        <TokenIntentStep
          v-if="currentStep === 1"
          @complete="handleStepComplete"
          @update="handleIntentUpdate"
        />

        <!-- Step 2: Compliance Readiness -->
        <ComplianceReadinessStep
          v-if="currentStep === 2"
          @complete="handleStepComplete"
          @update="handleComplianceUpdate"
        />

        <!-- Step 3: Template Selection -->
        <TemplateSelectionStep
          v-if="currentStep === 3"
          @complete="handleStepComplete"
          @update="handleTemplateUpdate"
        />

        <!-- Step 4: Economics Settings (Optional) -->
        <EconomicsSettingsStep
          v-if="currentStep === 4"
          @complete="handleStepComplete"
          @update="handleEconomicsUpdate"
        />

        <!-- Step 5: Review & Submit -->
        <ReviewSubmitStep
          v-if="currentStep === 5"
          :readiness-score="readinessScore"
          :form-data="currentForm"
          :is-submitting="isSubmitting"
          @submit="handleSubmit"
        />
      </Card>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between gap-4">
        <Button
          v-if="currentStep > 0"
          @click="handlePrevious"
          variant="ghost"
          size="lg"
        >
          <i class="pi pi-arrow-left mr-2"></i>
          Previous
        </Button>
        <div v-else></div>

        <div class="flex gap-3">
          <Button
            v-if="currentStep < totalSteps - 1"
            @click="handleNext"
            variant="primary"
            size="lg"
            :disabled="!canProceedToNext"
          >
            Continue
            <i class="pi pi-arrow-right ml-2"></i>
          </Button>
        </div>
      </div>

      <!-- Readiness Score Card (Sticky on desktop) -->
      <div class="hidden lg:block fixed right-8 top-24 w-80">
        <ReadinessScoreCard
          :score="readinessScore"
          :current-step="currentStep"
          :total-steps="totalSteps"
        />
      </div>
    </div>

    <!-- Success Modal -->
    <Modal :show="showSuccessModal" @close="handleCloseSuccessModal">
      <template #header>
        <div class="flex items-center gap-3">
          <CheckCircleIcon class="w-8 h-8 text-green-500" />
          <h3 class="text-xl font-bold text-white">Launch Submitted Successfully!</h3>
        </div>
      </template>
      <template #default>
        <div class="space-y-4">
          <p class="text-gray-300">
            Your token launch has been queued for deployment. You'll receive updates via email as deployment progresses.
          </p>
          
          <div v-if="submissionResponse" class="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-400">Submission ID:</span>
              <span class="text-white font-mono">{{ submissionResponse.submissionId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Status:</span>
              <Badge variant="info">{{ submissionResponse.deploymentStatus }}</Badge>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Estimated Time:</span>
              <span class="text-white">{{ submissionResponse.estimatedCompletionTime }}</span>
            </div>
          </div>

          <div v-if="submissionResponse?.nextSteps" class="space-y-2">
            <h4 class="font-semibold text-white">Next Steps:</h4>
            <ul class="list-disc list-inside space-y-1 text-gray-300">
              <li v-for="(step, index) in submissionResponse.nextSteps" :key="index">
                {{ step }}
              </li>
            </ul>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-3 justify-end">
          <Button @click="handleViewDashboard" variant="primary">
            View Dashboard
          </Button>
          <Button @click="handleCloseSuccessModal" variant="ghost">
            Close
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useGuidedLaunchStore } from '../stores/guidedLaunch'
import { useAuthStore } from '../stores/auth'
import type {
  OrganizationProfile,
  TokenIntent,
  ComplianceReadiness,
  TokenTemplate,
  TokenEconomics,
  ValidationResult,
  LaunchSubmissionResponse,
} from '../types/guidedLaunch'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import Badge from '../components/ui/Badge.vue'
import Modal from '../components/ui/Modal.vue'
import { CheckIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { launchTelemetryService } from '../services/launchTelemetry'

// Lazy load step components
import OrganizationProfileStep from '../components/guidedLaunch/steps/OrganizationProfileStep.vue'
import TokenIntentStep from '../components/guidedLaunch/steps/TokenIntentStep.vue'
import ComplianceReadinessStep from '../components/guidedLaunch/steps/ComplianceReadinessStep.vue'
import TemplateSelectionStep from '../components/guidedLaunch/steps/TemplateSelectionStep.vue'
import EconomicsSettingsStep from '../components/guidedLaunch/steps/EconomicsSettingsStep.vue'
import ReviewSubmitStep from '../components/guidedLaunch/steps/ReviewSubmitStep.vue'
import ReadinessScoreCard from '../components/guidedLaunch/ReadinessScoreCard.vue'

const router = useRouter()
const guidedLaunchStore = useGuidedLaunchStore()
const authStore = useAuthStore()

// Local state
const isSaving = ref(false)
const showSuccessModal = ref(false)
const submissionResponse = ref<LaunchSubmissionResponse | null>(null)

// Computed from store
const currentStep = computed(() => guidedLaunchStore.currentStep)
const totalSteps = computed(() => guidedLaunchStore.totalSteps)
const completedSteps = computed(() => guidedLaunchStore.completedSteps)
const progressPercentage = computed(() => guidedLaunchStore.progressPercentage)
const stepStatuses = computed(() => guidedLaunchStore.stepStatuses)
const readinessScore = computed(() => guidedLaunchStore.readinessScore)
const currentForm = computed(() => guidedLaunchStore.currentForm)
const isSubmitting = computed(() => guidedLaunchStore.isSubmitting)

const canProceedToNext = computed(() => {
  const step = stepStatuses.value[currentStep.value]
  return step?.isValid || step?.isOptional || false
})

const canNavigateToStep = (stepIndex: number) => {
  // Can always go back to previous steps
  if (stepIndex < currentStep.value) return true
  
  // Can't skip ahead more than 1 step
  if (stepIndex > currentStep.value + 1) return false
  
  // Can proceed if current step is valid or optional
  return canProceedToNext.value
}

// Handlers
const handleStepNavigation = (stepIndex: number) => {
  if (canNavigateToStep(stepIndex)) {
    guidedLaunchStore.goToStep(stepIndex)
  }
}

const handlePrevious = () => {
  if (currentStep.value > 0) {
    guidedLaunchStore.goToStep(currentStep.value - 1)
  }
}

const handleNext = () => {
  if (canProceedToNext.value && currentStep.value < totalSteps.value - 1) {
    guidedLaunchStore.goToStep(currentStep.value + 1)
  }
}

const handleSaveDraft = async () => {
  isSaving.value = true
  try {
    guidedLaunchStore.saveDraft()
    // Show brief success indication
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isSaving.value = false
  }
}

const handleStepComplete = (validation: ValidationResult) => {
  guidedLaunchStore.completeStep(currentStep.value, validation)
  
  // Auto-advance if valid and not last step
  if (validation.isValid && currentStep.value < totalSteps.value - 1) {
    setTimeout(() => {
      handleNext()
    }, 300)
  }
}

const handleOrganizationUpdate = (profile: OrganizationProfile) => {
  guidedLaunchStore.setOrganizationProfile(profile)
}

const handleIntentUpdate = (intent: TokenIntent) => {
  guidedLaunchStore.setTokenIntent(intent)
}

const handleComplianceUpdate = (compliance: ComplianceReadiness) => {
  guidedLaunchStore.setComplianceReadiness(compliance)
}

const handleTemplateUpdate = (template: TokenTemplate) => {
  guidedLaunchStore.setSelectedTemplate(template)
}

const handleEconomicsUpdate = (economics: TokenEconomics) => {
  guidedLaunchStore.setTokenEconomics(economics)
}

const handleSubmit = async () => {
  try {
    const userEmail = authStore.user?.email || ''
    const response = await guidedLaunchStore.submitLaunch(userEmail)
    submissionResponse.value = response
    showSuccessModal.value = true
  } catch (error) {
    console.error('Launch submission failed:', error)
    // Error handling is done in the store
  }
}

const handleViewDashboard = () => {
  router.push('/dashboard')
}

const handleCloseSuccessModal = () => {
  showSuccessModal.value = false
  router.push('/dashboard')
}

// Lifecycle
onMounted(() => {
  // Check authentication
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Home', query: { showAuth: 'true' } })
    return
  }

  // Initialize telemetry (email/password authentication only - no wallet addresses)
  const userId = authStore.user?.email || 'unknown'
  guidedLaunchStore.initializeTelemetry(userId)

  // Load draft if exists
  const hasDraft = guidedLaunchStore.loadDraft()
  
  // Start flow tracking if new
  if (!hasDraft) {
    guidedLaunchStore.startFlow(document.referrer, 'direct')
  }
})

onBeforeUnmount(() => {
  // Track abandonment if not submitted
  if (!currentForm.value.isSubmitted && completedSteps.value > 0) {
    const lastStep = stepStatuses.value[currentStep.value]
    if (lastStep) {
      launchTelemetryService.trackFlowAbandoned(
        lastStep.id,
        completedSteps.value,
        totalSteps.value
      )
    }
  }
})
</script>
