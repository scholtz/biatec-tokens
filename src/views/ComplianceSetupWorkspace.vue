<template>
  <main id="main-content" role="main" class="compliance-setup-workspace min-h-screen py-8 px-4 bg-gray-900">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-3">
          Compliance Setup Workspace
        </h1>
        <p class="text-gray-300 text-lg">
          Configure your token's compliance requirements for secure and compliant deployment.
          Complete all steps to ensure your token meets regulatory standards.
        </p>
      </div>

      <!-- Progress Tracker -->
      <div class="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border border-white/10">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-16 h-16 rounded-full bg-gradient-to-br from-biatec-accent to-purple-400 flex items-center justify-center text-2xl font-bold text-gray-900"
              aria-hidden="true"
            >
              {{ completedSteps }}
            </div>
            <div>
              <h3 class="text-xl font-semibold text-white">
                {{ completedSteps }} of {{ totalSteps }} Steps Complete
              </h3>
              <p class="text-gray-300">{{ progressPercentage }}% done</p>
            </div>
          </div>

          <!-- Readiness Score (shown after first step) -->
          <div v-if="currentStepIndex > 0" class="text-right">
            <div
              class="text-3xl font-bold"
              :class="readinessScoreColor"
              :aria-label="`Readiness score: ${readiness.readinessScore} percent`"
            >
              {{ readiness.readinessScore }}%
            </div>
            <p class="text-sm text-gray-300">Readiness Score</p>
          </div>
        </div>

        <!-- Progress Bar — WCAG 2.1 AA: role="progressbar" with aria-valuenow/min/max -->
        <div
          class="w-full bg-gray-700 rounded-full h-3"
          role="progressbar"
          :aria-valuenow="progressPercentage"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Compliance setup progress: ${progressPercentage}% complete`"
        >
          <div
            class="bg-gradient-to-r from-biatec-accent to-purple-400 h-3 rounded-full transition-all duration-500"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>

        <!-- Step Indicators — WCAG: nav landmark with descriptive aria-label -->
        <nav aria-label="Compliance setup steps" class="flex items-center justify-between mt-6">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="flex flex-col items-center flex-1"
          >
            <button
              @click="goToStep(index)"
              :disabled="!canNavigateToStep(index)"
              :aria-label="`${step.isComplete ? 'Completed: ' : ''}Step ${index + 1}: ${step.title}${currentStepIndex === index ? ' (current)' : ''}`"
              :aria-current="currentStepIndex === index ? 'step' : undefined"
              class="focus:outline-none focus-visible:ring-2 focus-visible:ring-biatec-accent focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300 mb-2',
                currentStepIndex === index
                  ? 'bg-biatec-accent text-gray-900 ring-4 ring-biatec-accent/30 scale-110'
                  : step.isComplete
                  ? 'bg-green-500 text-white cursor-pointer hover:scale-105'
                  : step.status === 'blocked'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed',
              ]"
            >
              <i
                v-if="step.isComplete && currentStepIndex !== index"
                class="pi pi-check"
                aria-hidden="true"
              ></i>
              <i
                v-else-if="step.status === 'blocked'"
                class="pi pi-exclamation-triangle"
                aria-hidden="true"
              ></i>
              <span v-else aria-hidden="true">{{ index + 1 }}</span>
            </button>
            <span
              :class="[
                'text-sm font-medium text-center hidden lg:block',
                currentStepIndex === index
                  ? 'text-biatec-accent'
                  : step.isComplete
                  ? 'text-green-400'
                  : step.status === 'blocked'
                  ? 'text-red-400'
                  : 'text-gray-300',
              ]"
            >
              {{ step.title }}
            </span>
          </div>
        </nav>

        <!-- Mobile Current Step Title -->
        <div class="lg:hidden text-center mt-4" aria-live="polite">
          <span class="text-sm font-medium text-biatec-accent">
            {{ currentStep?.title }}
          </span>
        </div>
      </div>

      <!-- Step Content -->
      <div class="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-white/10 mb-6">
        <transition name="fade" mode="out-in">
          <JurisdictionPolicyStep
            v-if="currentStepIndex === 0"
            v-model="setupStore.currentForm.jurisdictionPolicy"
            @validation-change="handleStepValidation"
          />
          <WhitelistEligibilityStep
            v-else-if="currentStepIndex === 1"
            v-model="setupStore.currentForm.whitelistEligibility"
            @validation-change="handleStepValidation"
          />
          <KYCAMLReadinessStep
            v-else-if="currentStepIndex === 2"
            v-model="setupStore.currentForm.kycAMLReadiness"
            @validation-change="handleStepValidation"
          />
          <AttestationEvidenceStep
            v-else-if="currentStepIndex === 3"
            v-model="setupStore.currentForm.attestationEvidence"
            @validation-change="handleStepValidation"
          />
          <ReadinessSummaryStep
            v-else-if="currentStepIndex === 4"
            :readiness="readiness"
            @go-to-step="goToStepById"
          />
        </transition>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between gap-4" role="group" aria-label="Step navigation">
        <button
          v-if="currentStepIndex > 0"
          @click="previousStep"
          aria-label="Go to previous step"
          class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-biatec-accent focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          Previous
        </button>
        <div v-else class="w-32"></div>

        <div class="flex gap-3">
          <button
            @click="saveDraft"
            aria-label="Save progress"
            class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-biatec-accent focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <i class="pi pi-save" aria-hidden="true"></i>
            Save Progress
          </button>

          <button
            v-if="!isLastStep"
            @click="nextStep"
            :disabled="!canProceedToNext"
            :aria-disabled="!canProceedToNext"
            aria-label="Continue to next step"
            :class="[
              'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-biatec-accent focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
              canProceedToNext
                ? 'bg-biatec-accent hover:bg-biatec-accent/90 text-gray-900'
                : 'bg-gray-700 text-gray-300 cursor-not-allowed',
            ]"
          >
            Continue
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
          </button>

          <button
            v-else-if="isLastStep && readiness.isReadyForDeploy"
            @click="completeSetup"
            :disabled="setupStore.isSubmitting"
            aria-label="Complete compliance setup"
            class="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <i class="pi pi-check-circle" aria-hidden="true"></i>
            {{ setupStore.isSubmitting ? 'Submitting...' : 'Complete Setup' }}
          </button>
        </div>
      </div>

      <!-- Help Text -->
      <div class="mt-6 text-center text-gray-300 text-sm">
        <p>
          Your progress is automatically saved. You can return anytime to complete the setup.
        </p>
      </div>
    </div>

    <!-- Success Modal -->
    <Modal :show="showSuccessModal" @close="handleSuccessClose">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <i class="pi pi-check text-white text-2xl"></i>
          </div>
          <h3 class="text-2xl font-bold text-white">Setup Complete!</h3>
        </div>
      </template>

      <div class="py-6">
        <p class="text-gray-300 text-lg mb-4">
          Your compliance setup is complete and ready for deployment.
        </p>

        <div class="bg-gray-800 rounded-xl p-6 mb-6">
          <h4 class="text-lg font-semibold text-white mb-3">Next Steps:</h4>
          <ul class="space-y-2 text-gray-300">
            <li class="flex items-start">
              <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
              <span>Review your token configuration in the dashboard</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
              <span>Complete any remaining KYC/AML provider integrations</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
              <span>Proceed to token deployment when ready</span>
            </li>
          </ul>
        </div>

        <div class="flex gap-3">
          <button
            @click="goToDashboard"
            class="flex-1 px-6 py-3 bg-biatec-accent hover:bg-biatec-accent/90 text-gray-900 rounded-lg font-medium transition-colors duration-200"
          >
            Go to Dashboard
          </button>
          <button
            @click="handleSuccessClose"
            class="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Review Setup
          </button>
        </div>
      </div>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useComplianceSetupStore } from '../stores/complianceSetup'
import JurisdictionPolicyStep from '../components/complianceSetup/JurisdictionPolicyStep.vue'
import WhitelistEligibilityStep from '../components/complianceSetup/WhitelistEligibilityStep.vue'
import KYCAMLReadinessStep from '../components/complianceSetup/KYCAMLReadinessStep.vue'
import AttestationEvidenceStep from '../components/complianceSetup/AttestationEvidenceStep.vue'
import ReadinessSummaryStep from '../components/complianceSetup/ReadinessSummaryStep.vue'
import Modal from '../components/ui/Modal.vue'
import type { StepValidation } from '../types/complianceSetup'

const router = useRouter()
const setupStore = useComplianceSetupStore()

// State
const currentStepValidation = ref<StepValidation | null>(null)
const showSuccessModal = ref(false)

// Computed
const steps = computed(() => setupStore.currentForm.steps)
const currentStep = computed(() => setupStore.currentStep)
const currentStepIndex = computed(() => setupStore.currentForm.currentStepIndex)
const totalSteps = computed(() => setupStore.totalSteps)
const completedSteps = computed(() => setupStore.completedSteps)
const progressPercentage = computed(() => setupStore.progressPercentage)
const readiness = computed(() => setupStore.calculateReadiness)

const isLastStep = computed(() => currentStepIndex.value === totalSteps.value - 1)

const canProceedToNext = computed(() => {
  if (!currentStepValidation.value) return false
  return currentStepValidation.value.canProceed
})

const canNavigateToStep = (index: number): boolean => {
  // Can always go back to previous steps
  if (index < currentStepIndex.value) return true
  
  // Can only go forward one step at a time
  if (index === currentStepIndex.value + 1) {
    return canProceedToNext.value
  }
  
  // Can go to current step
  if (index === currentStepIndex.value) return true
  
  // Can go to completed steps
  return steps.value[index]?.isComplete || false
}

const readinessScoreColor = computed(() => {
  const score = readiness.value.readinessScore
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
})

// Methods
const goToStep = (index: number) => {
  if (canNavigateToStep(index)) {
    setupStore.goToStep(index)
  }
}

const goToStepById = (stepId: string) => {
  const index = steps.value.findIndex(s => s.id === stepId)
  if (index !== -1) {
    goToStep(index)
  }
}

const previousStep = () => {
  if (currentStepIndex.value > 0) {
    setupStore.goToStep(currentStepIndex.value - 1)
  }
}

const nextStep = () => {
  if (canProceedToNext.value && !isLastStep.value) {
    // Mark current step as complete
    if (currentStepValidation.value) {
      setupStore.completeStep(currentStep.value.id, currentStepValidation.value)
    }
    
    // Move to next step
    setupStore.goToStep(currentStepIndex.value + 1)
  }
}

const saveDraft = () => {
  const saved = setupStore.saveDraft()
  if (saved) {
    // TODO: Show success toast
    console.log('Draft saved successfully')
  }
}

const handleStepValidation = (validation: StepValidation) => {
  currentStepValidation.value = validation
  
  // Update step validation in store
  if (currentStep.value) {
    setupStore.completeStep(currentStep.value.id, validation)
  }
}

const completeSetup = async () => {
  try {
    await setupStore.submitSetup()
    showSuccessModal.value = true
  } catch (error) {
    console.error('Failed to complete setup:', error)
    // TODO: Show error toast
  }
}

const handleSuccessClose = () => {
  showSuccessModal.value = false
}

const goToDashboard = () => {
  router.push('/compliance')
}

// Load existing draft synchronously during setup — BEFORE child components mount.
// This is critical because child step components emit 'validation-change' in their
// own onMounted hooks, which triggers completeStep → saveDraft in the parent handler.
// Since Vue 3 fires child onMounted BEFORE parent onMounted, calling loadDraft() in
// the parent's onMounted is too late: the child's save already overwrites any
// pre-seeded draft. Calling loadDraft() here (in the setup() phase) ensures the
// correct currentStepIndex is in place BEFORE any child component mounts or emits.
setupStore.loadDraft()
</script>

<style scoped>
.compliance-setup-workspace {
  animation: fade-in 0.5s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
