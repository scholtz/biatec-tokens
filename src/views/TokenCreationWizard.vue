<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <WizardContainer
      title="Create Your Token"
      subtitle="A guided, wallet-free experience for compliant token creation"
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
        <!-- Step 1: Authentication Confirmation -->
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

        <!-- Step 3: Token Details -->
        <TokenDetailsStep
          v-if="stepIndex === 2"
          ref="step3Ref"
        />

        <!-- Step 4: Compliance Review -->
        <ComplianceReviewStep
          v-if="stepIndex === 3"
          ref="step4Ref"
        />

        <!-- Step 5: Deployment Status -->
        <DeploymentStatusStep
          v-if="stepIndex === 4"
          ref="step5Ref"
        />
      </template>
    </WizardContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTokenDraftStore } from '../stores/tokenDraft'
import { useSubscriptionStore } from '../stores/subscription'
import { useComplianceStore } from '../stores/compliance'
import WizardContainer from '../components/wizard/WizardContainer.vue'
import AuthenticationConfirmationStep from '../components/wizard/steps/AuthenticationConfirmationStep.vue'
import SubscriptionSelectionStep from '../components/wizard/steps/SubscriptionSelectionStep.vue'
import TokenDetailsStep from '../components/wizard/steps/TokenDetailsStep.vue'
import ComplianceReviewStep from '../components/wizard/steps/ComplianceReviewStep.vue'
import DeploymentStatusStep from '../components/wizard/steps/DeploymentStatusStep.vue'
import type { WizardStep } from '../components/wizard/WizardContainer.vue'

const router = useRouter()
const authStore = useAuthStore()
const tokenDraftStore = useTokenDraftStore()
const subscriptionStore = useSubscriptionStore()
const complianceStore = useComplianceStore()

const step1Ref = ref<InstanceType<typeof AuthenticationConfirmationStep>>()
const step2Ref = ref<InstanceType<typeof SubscriptionSelectionStep>>()
const step3Ref = ref<InstanceType<typeof TokenDetailsStep>>()
const step4Ref = ref<InstanceType<typeof ComplianceReviewStep>>()
const step5Ref = ref<InstanceType<typeof DeploymentStatusStep>>()

const currentStepIndex = ref(0)
const selectedPlan = ref<string>('')

const wizardSteps = computed<WizardStep[]>(() => [
  {
    id: 'authentication',
    title: 'Authentication',
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
    id: 'token-details',
    title: 'Token Details',
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
    id: 'compliance',
    title: 'Compliance',
    isValid: () => {
      return step4Ref.value?.isValid ?? false
    },
  },
  {
    id: 'deployment',
    title: 'Deployment',
    isValid: () => {
      return step5Ref.value?.isValid ?? false
    },
  },
])

const handleStepChange = (stepIndex: number, step: WizardStep) => {
  currentStepIndex.value = stepIndex
  emitAnalyticsEvent('wizard_step_viewed', {
    stepIndex,
    stepId: step.id,
    stepTitle: step.title,
  })
  
  console.log(`[Wizard] Step changed to: ${step.title} (${stepIndex})`)
}

const handlePlanSelected = (plan: string) => {
  selectedPlan.value = plan
  emitAnalyticsEvent('subscription_plan_selected', { plan })
  console.log(`[Wizard] Plan selected: ${plan}`)
}

const handleSaveDraft = () => {
  const draft = tokenDraftStore.currentDraft
  if (draft) {
    tokenDraftStore.saveDraft(draft)
    emitAnalyticsEvent('wizard_draft_saved', {
      currentStep: currentStepIndex.value,
      tokenName: draft.name,
      standard: draft.selectedStandard,
    })
    console.log('[Wizard] Draft saved successfully')
    
    // Show success notification (would use toast in production)
    console.log('[User Notification] Draft saved successfully!')
  }
}

const handleStepValidated = (stepIndex: number, isValid: boolean) => {
  console.log(`[Wizard] Step ${stepIndex} validation: ${isValid ? 'valid' : 'invalid'}`)
}

const handleComplete = async () => {
  const draft = tokenDraftStore.currentDraft
  
  emitAnalyticsEvent('wizard_completed', {
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

const emitAnalyticsEvent = (eventName: string, payload: any) => {
  console.log(`[Analytics] ${eventName}`, payload)
  // In production, this would integrate with analytics provider (Google Analytics, Mixpanel, etc.)
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
  
  // Track wizard start
  emitAnalyticsEvent('wizard_started', {
    userEmail: authStore.user?.email || authStore.arc76email,
    timestamp: new Date().toISOString(),
  })
  
  // Track conversion metrics
  subscriptionStore.trackTokenCreationAttempt()
  
  console.log('[Wizard] Token Creation Wizard initialized')
})
</script>

<style scoped>
/* Additional wizard-specific styles if needed */
</style>
