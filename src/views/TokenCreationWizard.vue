<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <!-- Compliance gating banner (if blocked) -->
    <div v-if="!isEligibleForIssuance && !loading" class="max-w-7xl mx-auto px-4 py-8">
      <ComplianceGatingBanner
        :eligibility="complianceEligibility"
        @complete-compliance="navigateToCompliance"
        @contact-support="contactSupport"
        @retry-compliance="retryCompliance"
      />
    </div>

    <!-- Wizard (if eligible or loading) -->
    <WizardContainer
      v-if="isEligibleForIssuance || loading"
      title="Create Your Token"
      subtitle="A guided experience for compliant token creation"
      :steps="wizardSteps"
      :initial-step="0"
      :show-save-draft="true"
      :auto-save="true"
      @step-change="handleStepChange"
      @complete="handleComplete"
      @save-draft="handleSaveDraft"
      @step-validated="handleStepValidated"
    >
      <template #default="{ stepIndex }">
        <!-- Step 1: Authentication & Welcome -->
        <AuthenticationConfirmationStep
          v-if="stepIndex === 0"
          ref="step1Ref"
        />

        <!-- Step 2: Subscription Selection -->
        <SubscriptionSelectionStep
          v-if="stepIndex === 1"
          ref="step2Ref"
          @plan-selected="handlePlanSelected"
        />

        <!-- Step 3: Project Setup (NEW) -->
        <ProjectSetupStep
          v-if="stepIndex === 2"
          ref="step3Ref"
        />

        <!-- Step 4: Token Details -->
        <TokenDetailsStep
          v-if="stepIndex === 3"
          ref="step4Ref"
        />

        <!-- Step 5: Compliance Review -->
        <ComplianceReviewStep
          v-if="stepIndex === 4"
          ref="step5Ref"
        />

        <!-- Step 6: Metadata & Media (NEW) -->
        <MetadataStep
          v-if="stepIndex === 5"
          ref="step6Ref"
        />

        <!-- Step 7: Standards & Compatibility (NEW) -->
        <StandardsCompatibilityStep
          v-if="stepIndex === 6"
          ref="step7Ref"
        />

        <!-- Step 8: Deployment Review -->
        <DeploymentReviewStep
          v-if="stepIndex === 7"
          ref="step8Ref"
        />

        <!-- Step 9: Deployment Status -->
        <DeploymentStatusStep
          v-if="stepIndex === 8"
          ref="step9Ref"
        />
      </template>
    </WizardContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTokenDraftStore } from '../stores/tokenDraft'
import { useSubscriptionStore } from '../stores/subscription'
import { useComplianceStore } from '../stores/compliance'
import { useComplianceOrchestrationStore } from '../stores/complianceOrchestration'
import { analyticsService } from '../services/analytics'
import WizardContainer from '../components/wizard/WizardContainer.vue'
import AuthenticationConfirmationStep from '../components/wizard/steps/AuthenticationConfirmationStep.vue'
import SubscriptionSelectionStep from '../components/wizard/steps/SubscriptionSelectionStep.vue'
import ProjectSetupStep from '../components/wizard/steps/ProjectSetupStep.vue'
import TokenDetailsStep from '../components/wizard/steps/TokenDetailsStep.vue'
import ComplianceReviewStep from '../components/wizard/steps/ComplianceReviewStep.vue'
import MetadataStep from '../components/wizard/steps/MetadataStep.vue'
import StandardsCompatibilityStep from '../components/wizard/steps/StandardsCompatibilityStep.vue'
import DeploymentReviewStep from '../components/wizard/steps/DeploymentReviewStep.vue'
import DeploymentStatusStep from '../components/wizard/steps/DeploymentStatusStep.vue'
import ComplianceGatingBanner from '../components/compliance/ComplianceGatingBanner.vue'
import type { WizardStep } from '../components/wizard/WizardContainer.vue'

const router = useRouter()
const authStore = useAuthStore()
const tokenDraftStore = useTokenDraftStore()
const subscriptionStore = useSubscriptionStore()
const complianceStore = useComplianceStore()
const complianceOrchestrationStore = useComplianceOrchestrationStore()

const loading = ref(true)

// Compliance eligibility check
const isEligibleForIssuance = computed(() => 
  complianceOrchestrationStore.isEligibleForIssuance
)

const complianceEligibility = computed(() => 
  complianceOrchestrationStore.checkIssuanceEligibility()
)

const step1Ref = ref<InstanceType<typeof AuthenticationConfirmationStep>>()
const step2Ref = ref<InstanceType<typeof SubscriptionSelectionStep>>()
const step3Ref = ref<InstanceType<typeof ProjectSetupStep>>()
const step4Ref = ref<InstanceType<typeof TokenDetailsStep>>()
const step5Ref = ref<InstanceType<typeof ComplianceReviewStep>>()
const step6Ref = ref<InstanceType<typeof MetadataStep>>()
const step7Ref = ref<InstanceType<typeof StandardsCompatibilityStep>>()
const step8Ref = ref<InstanceType<typeof DeploymentReviewStep>>()
const step9Ref = ref<InstanceType<typeof DeploymentStatusStep>>()

const currentStepIndex = ref(0)
const selectedPlan = ref<string>('')

const wizardSteps = computed<WizardStep[]>(() => [
  {
    id: 'welcome',
    title: 'Welcome',
    isValid: () => {
      return step1Ref.value?.isValid ?? true
    },
  },
  {
    id: 'subscription',
    title: 'Subscription',
    isValid: () => {
      return step2Ref.value?.isValid ?? false
    },
  },
  {
    id: 'project-setup',
    title: 'Project Setup',
    isValid: () => {
      const step3 = step3Ref.value
      if (!step3) return false
      
      // Validate the step before checking isValid
      if (step3.validateAll) {
        step3.validateAll()
      }
      
      return step3.isValid ?? false
    },
  },
  {
    id: 'token-details',
    title: 'Token Details',
    isValid: () => {
      const step4 = step4Ref.value
      if (!step4) return false
      
      // Validate the step before checking isValid
      if (step4.validateAll) {
        step4.validateAll()
      }
      
      return step4.isValid ?? false
    },
  },
  {
    id: 'compliance',
    title: 'Compliance',
    isValid: () => {
      return step5Ref.value?.isValid ?? false
    },
  },
  {
    id: 'metadata',
    title: 'Metadata',
    isValid: () => {
      const step6 = step6Ref.value
      if (!step6) return false
      
      // Validate the step before checking isValid
      if (step6.validateAll) {
        step6.validateAll()
      }
      
      return step6.isValid ?? false
    },
  },
  {
    id: 'standards',
    title: 'Standards',
    isValid: () => {
      const step7 = step7Ref.value
      if (!step7) return false
      
      // Validate the step before checking isValid
      if (step7.validateAll) {
        step7.validateAll()
      }
      
      return step7.isValid ?? false
    },
  },
  {
    id: 'review',
    title: 'Review',
    isValid: () => {
      const step8 = step8Ref.value
      if (!step8) return false
      
      // Validate the step before checking isValid
      if (step8.validateAll) {
        step8.validateAll()
      }
      
      return step8.isValid ?? false
    },
  },
  {
    id: 'deployment',
    title: 'Deployment',
    isValid: () => {
      return step9Ref.value?.isValid ?? false
    },
  },
])

const handleStepChange = (stepIndex: number, step: WizardStep) => {
  currentStepIndex.value = stepIndex
  
  // Track with analytics service
  analyticsService.trackWizardStepViewed({
    stepIndex,
    stepId: step.id,
    stepTitle: step.title,
  })
  
  console.log(`[Wizard] Step changed to: ${step.title} (${stepIndex})`)
}

const handlePlanSelected = (plan: string) => {
  selectedPlan.value = plan
  
  // Track with analytics service
  analyticsService.trackPlanSelected(plan)
  
  console.log(`[Wizard] Plan selected: ${plan}`)
}

const handleSaveDraft = () => {
  const draft = tokenDraftStore.currentDraft
  if (draft) {
    tokenDraftStore.saveDraft(draft)
    
    // Track with analytics service
    analyticsService.trackDraftSaved({
      stepIndex: currentStepIndex.value,
      tokenName: draft.name,
    })
    
    console.log('[Wizard] Draft saved successfully')
    
    // Show success notification (would use toast in production)
    console.log('[User Notification] Draft saved successfully!')
  }
}

const handleStepValidated = (stepIndex: number, isValid: boolean) => {
  console.log(`[Wizard] Step ${stepIndex} validation: ${isValid ? 'valid' : 'invalid'}`)
  
  // Track validation errors
  if (!isValid && stepIndex < wizardSteps.value.length) {
    analyticsService.trackWizardValidationError({
      stepIndex,
      stepId: wizardSteps.value[stepIndex].id,
      stepTitle: wizardSteps.value[stepIndex].title,
      errors: ['Validation failed'], // Could be more specific
    })
  }
}

const handleComplete = async () => {
  const draft = tokenDraftStore.currentDraft
  
  // Track with analytics service
  analyticsService.trackWizardCompleted({
    tokenName: draft?.name,
    tokenSymbol: draft?.symbol,
    standard: draft?.selectedStandard,
    network: draft?.selectedNetwork,
    complianceScore: complianceStore.metrics.completionPercentage,
    selectedPlan: selectedPlan.value,
  })
  
  console.log('[Wizard] Wizard completed successfully')
  
  // Track token creation success in subscription store
  if (draft) {
    subscriptionStore.trackTokenCreationSuccess(
      draft.selectedStandard || '',
      undefined,
      draft.selectedNetwork
    )
  }
  
  // Clear draft after successful deployment
  tokenDraftStore.clearDraft()
  
  // Show success message
  console.log('[User Notification] Congratulations! Your token has been created successfully.')
  
  // Redirect to token dashboard
  await router.push('/dashboard')
}

onMounted(async () => {
  // Check authentication
  if (!authStore.isAuthenticated) {
    console.warn('[Wizard] User not authenticated, redirecting to home')
    await router.push({
      name: 'Home',
      query: { showAuth: 'true' },
    })
    return
  }
  
  // Initialize draft store
  tokenDraftStore.initializeDraft()
  
  // Fetch subscription status
  await subscriptionStore.fetchSubscription()
  
  // Track wizard start with analytics service
  analyticsService.trackWizardStarted(
    authStore.user?.email || authStore.arc76email || undefined
  )
  
  // Track conversion metrics
  subscriptionStore.trackTokenCreationAttempt()
  
  console.log('[Wizard] Token Creation Wizard initialized')
})

// Track abandonment on unmount
onBeforeUnmount(() => {
  // If wizard wasn't completed, track abandonment
  const draft = tokenDraftStore.currentDraft
  if (draft && !draft.createdAt) {
    analyticsService.trackWizardAbandoned(
      currentStepIndex.value,
      wizardSteps.value.length
    )
  }
})

// Navigation methods for compliance gating
const navigateToCompliance = () => {
  router.push('/compliance/orchestration')
}

const contactSupport = () => {
  window.open('mailto:support@biatec.io?subject=Token Issuance Support', '_blank')
}

const retryCompliance = async () => {
  if (authStore.user) {
    await complianceOrchestrationStore.initializeComplianceState(
      authStore.user.address,
      authStore.user.email || ''
    )
  }
}
</script>

<style scoped>
/* Additional wizard-specific styles if needed */
</style>
