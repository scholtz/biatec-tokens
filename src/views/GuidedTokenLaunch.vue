<template>
  <main
    id="main-content"
    role="main"
    class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    :data-testid="ISSUANCE_TEST_IDS.WORKSPACE_SHELL"
  >
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

      <!-- Error Banner: always in DOM for aria-live region subscription (WCAG 4.1.3), shown via v-show -->
      <div
        v-show="submissionErrorMessage"
        role="alert"
        aria-live="assertive"
        :data-testid="ISSUANCE_TEST_IDS.ERROR_BANNER"
        class="mb-6 rounded-lg border p-4 flex items-start gap-3"
        :class="submissionErrorMessage?.severity === 'error'
          ? 'bg-red-900/30 border-red-700/50'
          : submissionErrorMessage?.severity === 'warning'
          ? 'bg-yellow-900/30 border-yellow-700/50'
          : 'bg-blue-900/30 border-blue-700/50'"
      >
        <ExclamationTriangleIcon
          class="w-5 h-5 flex-shrink-0 mt-0.5"
          :class="submissionErrorMessage?.severity === 'error'
            ? 'text-red-400'
            : submissionErrorMessage?.severity === 'warning'
            ? 'text-yellow-400'
            : 'text-blue-400'"
          aria-hidden="true"
        />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-white">{{ submissionErrorMessage?.title }}</p>
          <p class="text-sm text-gray-300 mt-0.5">{{ submissionErrorMessage?.description }}</p>
          <p class="text-sm text-gray-400 mt-1">{{ submissionErrorMessage?.action }}</p>
        </div>
        <button
          @click="clearSubmissionError"
          class="flex-shrink-0 p-1 rounded text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Dismiss error"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
          </svg>
        </button>
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
            :data-testid="ISSUANCE_TEST_IDS.SAVE_DRAFT_BUTTON"
          >
            <i class="pi pi-save mr-2"></i>
            {{ isSaving ? 'Saving...' : 'Save Draft' }}
          </Button>
        </div>
        
        <!-- Progress Bar -->
        <div class="w-full bg-gray-700 rounded-full h-2" :data-testid="ISSUANCE_TEST_IDS.PROGRESS_BAR">
          <div
            class="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            :style="{ width: `${progressPercentage}%` }"
            role="progressbar"
            :data-testid="ISSUANCE_TEST_IDS.PROGRESS_PERCENTAGE"
            :aria-valuenow="progressPercentage"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </Card>

      <!-- Step Indicator -->
      <div class="mb-8 overflow-x-auto" :data-testid="ISSUANCE_TEST_IDS.STEP_INDICATOR" role="navigation" aria-label="Issuance progress steps">
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
              :data-testid="`${ISSUANCE_TEST_IDS.STEP_BUTTON_PREFIX}${index}`"
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
          :data-testid="ISSUANCE_TEST_IDS.BACK_BUTTON"
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
            :data-testid="ISSUANCE_TEST_IDS.CONTINUE_BUTTON"
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

          <!-- Post-deployment actionable guidance from tokenDeploymentNextSteps -->
          <div
            v-if="deploymentNextStepsResult.nextSteps.length"
            class="space-y-2 border-t border-gray-700 pt-3"
            data-testid="deployment-next-steps"
          >
            <h4 class="font-semibold text-white text-sm">Recommended Actions:</h4>
            <ul class="space-y-1">
              <li
                v-for="step in deploymentNextStepsResult.nextSteps.slice(0, 3)"
                :key="step.id"
                class="text-sm text-gray-300 flex items-start gap-2"
              >
                <span class="mt-0.5 text-blue-400 shrink-0">›</span>
                <span>{{ step.label }} — {{ step.description }}</span>
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
  </main>
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
import { competitiveTelemetryService } from '../services/CompetitiveTelemetryService'
import { getLaunchErrorMessage, classifyLaunchError } from '../utils/launchErrorMessages'
import { ISSUANCE_TEST_IDS, consumeIssuanceReturnPath } from '../utils/authFirstIssuanceWorkspace'
import { validatePreflightChecks } from '../utils/launchPreflightValidator'
import { getDeploymentNextSteps } from '../utils/tokenDeploymentNextSteps'

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
const deploymentNextStepsResult = ref(getDeploymentNextSteps('success'))

// Computed from store
const currentStep = computed(() => guidedLaunchStore.currentStep)
const totalSteps = computed(() => guidedLaunchStore.totalSteps)
const completedSteps = computed(() => guidedLaunchStore.completedSteps)
const progressPercentage = computed(() => guidedLaunchStore.progressPercentage)
const stepStatuses = computed(() => guidedLaunchStore.stepStatuses)
const readinessScore = computed(() => guidedLaunchStore.readinessScore)
const currentForm = computed(() => guidedLaunchStore.currentForm)
const isSubmitting = computed(() => guidedLaunchStore.isSubmitting)

// Error banner: maps store submissionError to user-friendly message via launchErrorMessages
const submissionErrorMessage = computed(() => {
  const rawError = currentForm.value.submissionError
  if (!rawError) return null
  const code = classifyLaunchError(rawError)
  return getLaunchErrorMessage(code)
})

const clearSubmissionError = () => {
  currentForm.value.submissionError = ''
}

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
  
  // Track milestone completion
  const currentStepData = stepStatuses.value[currentStep.value]
  if (currentStepData) {
    competitiveTelemetryService.trackMilestone({
      journey: 'token_creation',
      milestone: currentStepData.id,
      timestamp: new Date(),
      metadata: {
        stepNumber: currentStep.value + 1,
        isValid: validation.isValid,
        totalSteps: totalSteps.value
      }
    })
  }
  
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
    const form = guidedLaunchStore.currentForm

    // Run preflight validation before submitting.
    // Advisory-only in this phase: the wizard step validation already enforces
    // required fields per step. Preflight runs a cross-cutting check and logs
    // issues for observability; the store's submitLaunch handles final server-side
    // validation and will surface errors from the backend if any remain.
    const preflight = validatePreflightChecks({
      tokenName: form.selectedTemplate?.name,
      totalSupply: form.tokenEconomics?.totalSupply !== undefined ? Number(form.tokenEconomics.totalSupply) : undefined,
      network: form.selectedTemplate?.network,
      templateSelected: !!form.selectedTemplate,
      organizationVerified: !!form.organizationProfile?.organizationName,
      complianceComplete: completedSteps.value >= 4,
    })
    if (!preflight.passed) {
      console.warn('[Preflight] Advisory check failed (proceeding to backend validation):', preflight.summary)
    }

    const response = await guidedLaunchStore.submitLaunch(userEmail)
    submissionResponse.value = response
    showSuccessModal.value = true

    // Build post-deployment next steps guidance for the success modal.
    // The utility handles ARC1400 → RWA classification internally.
    const isRWA = form.tokenIntent?.tokenPurpose === 'rwa'
    deploymentNextStepsResult.value = getDeploymentNextSteps('success', {
      tokenName: form.selectedTemplate?.name,
      tokenStandard: form.selectedTemplate?.id,
      network: form.selectedTemplate?.network,
      complianceComplete: completedSteps.value >= 4,
      isRWA,
    })
    
    // Track successful journey completion
    competitiveTelemetryService.completeJourney('token_creation', true, {
      submissionId: response.submissionId,
      deploymentStatus: response.deploymentStatus,
      template: guidedLaunchStore.currentForm.selectedTemplate?.id,
      completedSteps: completedSteps.value
    })
  } catch (error) {
    console.error('Launch submission failed:', error)
    
    // Track failed journey
    competitiveTelemetryService.completeJourney('token_creation', false, {
      error: error instanceof Error ? error.message : 'Unknown error',
      abandonedAtStep: currentStep.value,
      completedSteps: completedSteps.value
    })
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

  // Consume any issuance-specific return path stored by the router guard
  // (set when an unauthenticated user tried to access /launch/guided).
  // consumeIssuanceReturnPath() atomically reads AND removes the key, so no
  // infinite-redirect risk — a second onMounted call always receives null.
  const savedIssuancePath = consumeIssuanceReturnPath()
  if (savedIssuancePath && savedIssuancePath !== router.currentRoute.value.fullPath) {
    router.replace(savedIssuancePath)
    return
  }

  // Initialize telemetry (email/password authentication only - no wallet addresses)
  const userId = authStore.user?.email || 'unknown'
  guidedLaunchStore.initializeTelemetry(userId)
  
  // Load draft if exists (do this first to check if user has draft)
  const hasDraft = guidedLaunchStore.loadDraft()
  
  // Start competitive journey tracking
  competitiveTelemetryService.startJourney('token_creation', {
    userType: hasDraft ? 'returning' : 'new',
    source: document.referrer || 'direct',
    standard: guidedLaunchStore.currentForm.selectedTemplate?.standard || 'unknown'
  })
  
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
      
      // Track competitive journey abandonment
      competitiveTelemetryService.completeJourney('token_creation', false, {
        reason: 'user_navigated_away',
        abandonedAtStep: currentStep.value,
        completedSteps: completedSteps.value,
        progressPercentage: progressPercentage.value
      })
    }
  }
})
</script>
