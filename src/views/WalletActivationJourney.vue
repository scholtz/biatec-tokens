<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Progress Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Wallet Activation Journey
            </h1>
            <Badge :variant="currentStepBadgeVariant" size="lg">
              Step {{ currentStep }} of {{ totalSteps }}
            </Badge>
          </div>
          
          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              :style="{ width: `${progressPercentage}%` }"
            />
          </div>
        </div>

        <!-- Step Content -->
        <Card variant="default" padding="lg">
          <!-- Step 1: Welcome & Context -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div class="text-center">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <RocketLaunchIcon class="w-8 h-8 text-white" />
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Your Token Journey
              </h2>
              <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                We'll guide you through activating your account and preparing for your first token deployment.
                This process takes about 5 minutes.
              </p>
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 class="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center">
                <InformationCircleIcon class="w-5 h-5 mr-2" />
                What You'll Need
              </h3>
              <ul class="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li class="flex items-start">
                  <CheckCircleIcon class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>An authenticated account (you're already signed in!)</span>
                </li>
                <li class="flex items-start">
                  <CheckCircleIcon class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>About 5 minutes to complete the setup</span>
                </li>
                <li class="flex items-start">
                  <CheckCircleIcon class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Clear understanding of your token requirements</span>
                </li>
              </ul>
            </div>

            <div class="flex justify-end">
              <Button variant="primary" size="lg" @click="nextStep">
                Get Started
                <ArrowRightIcon class="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          <!-- Step 2: Account Readiness Check -->
          <div v-else-if="currentStep === 2" class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Account Readiness Check
            </h2>

            <div class="space-y-4">
              <ReadinessCheckItem
                :status="accountReadiness.authenticated"
                title="Authentication"
                description="Your account is authenticated and secure"
              />
              <ReadinessCheckItem
                :status="accountReadiness.provisioned"
                title="Account Provisioning"
                :description="provisioningStatusMessage"
                :loading="checkingProvisioning"
              />
              <ReadinessCheckItem
                :status="accountReadiness.canDeploy"
                title="Deployment Ready"
                description="Your account can deploy tokens to the blockchain"
              />
            </div>

            <div v-if="!isAccountReady" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
              <h3 class="font-semibold text-yellow-900 dark:text-yellow-200 mb-3 flex items-center">
                <ExclamationTriangleIcon class="w-5 h-5 mr-2" />
                Action Required
              </h3>
              <p class="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
                {{ accountReadinessMessage }}
              </p>
              <Button variant="secondary" size="sm" @click="retryProvisioningCheck">
                <ArrowPathIcon class="w-4 h-4 mr-2" />
                Retry Check
              </Button>
            </div>

            <div class="flex justify-between">
              <Button variant="secondary" @click="previousStep">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                Back
              </Button>
              <Button
                variant="primary"
                @click="nextStep"
                :disabled="!isAccountReady"
              >
                Continue
                <ArrowRightIcon class="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          <!-- Step 3: Choose Action -->
          <div v-else-if="currentStep === 3" class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Your Next Step
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionCard
                title="Launch Guided Token Creation"
                description="Step-by-step wizard to create your first compliant token with full guidance."
                icon="rocket"
                :selected="selectedAction === 'guided'"
                @select="selectedAction = 'guided'"
              />
              <ActionCard
                title="Compare Token Standards"
                description="Explore and compare different token standards to find the best fit for your needs."
                icon="compare"
                :selected="selectedAction === 'compare'"
                @select="selectedAction = 'compare'"
              />
            </div>

            <div class="flex justify-between">
              <Button variant="secondary" @click="previousStep">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                Back
              </Button>
              <Button
                variant="primary"
                @click="completeActivation"
                :disabled="!selectedAction"
              >
                {{ selectedAction === 'guided' ? 'Start Creation' : 'View Comparison' }}
                <ArrowRightIcon class="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          <!-- Step 4: Success -->
          <div v-else-if="currentStep === 4" class="space-y-6 text-center">
            <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
              <CheckCircleIcon class="w-12 h-12 text-white" />
            </div>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Activation Complete!
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your account is ready for token deployment. You're all set to create compliant tokens.
            </p>

            <div class="flex justify-center">
              <Button variant="primary" size="lg" @click="navigateToAction">
                Continue to {{ selectedAction === 'guided' ? 'Token Creation' : 'Standards Comparison' }}
                <ArrowRightIcon class="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </Card>

        <!-- Help Section -->
        <Card variant="glass" padding="md" class="mt-8">
          <div class="flex items-start space-x-3">
            <QuestionMarkCircleIcon class="w-6 h-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                Need Help?
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Our support team is here to help you through the activation process.
                <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import MainLayout from '../layout/MainLayout.vue';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import Badge from '../components/ui/Badge.vue';
import ReadinessCheckItem from '../components/walletActivation/ReadinessCheckItem.vue';
import ActionCard from '../components/walletActivation/ActionCard.vue';
import { CompetitiveTelemetryService } from '../services/CompetitiveTelemetryService';
import { analyticsService } from '../services/analytics';
import { saveCheckpoint, loadCheckpoint, clearCheckpoint, isCheckpointResumable } from '../utils/walletActivationCheckpoint';
import {
  RocketLaunchIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const telemetryService = CompetitiveTelemetryService.getInstance();

const currentStep = ref(1);
const totalSteps = 4;
const JOURNEY_ID = 'wallet_activation';
const selectedAction = ref<'guided' | 'compare' | null>(null);
const checkingProvisioning = ref(false);

interface AccountReadiness {
  authenticated: boolean;
  provisioned: boolean;
  canDeploy: boolean;
}

const accountReadiness = ref<AccountReadiness>({
  authenticated: false,
  provisioned: false,
  canDeploy: false,
});

const progressPercentage = computed(() => {
  return (currentStep.value / totalSteps) * 100;
});

const currentStepBadgeVariant = computed<'success' | 'info'>(() => {
  if (currentStep.value === totalSteps) return 'success';
  return 'info';
});

const isAccountReady = computed(() => {
  return (
    accountReadiness.value.authenticated &&
    accountReadiness.value.provisioned &&
    accountReadiness.value.canDeploy
  );
});

const provisioningStatusMessage = computed(() => {
  if (!accountReadiness.value.authenticated) {
    return 'Please sign in to continue';
  }
  if (checkingProvisioning.value) {
    return 'Checking account provisioning status...';
  }
  if (!accountReadiness.value.provisioned) {
    return 'Account needs to be provisioned';
  }
  return 'Account is properly provisioned';
});

const accountReadinessMessage = computed(() => {
  if (!accountReadiness.value.authenticated) {
    return 'Please sign in to continue with activation.';
  }
  if (!accountReadiness.value.provisioned) {
    return 'Your account needs to be provisioned. This happens automatically when you first authenticate.';
  }
  if (!accountReadiness.value.canDeploy) {
    return 'Your account is not yet ready for token deployment. Please contact support.';
  }
  return '';
});

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
    
    // Persist progress so the journey can be resumed if interrupted
    saveCheckpoint(JOURNEY_ID, currentStep.value, totalSteps, [currentStep.value - 1]);

    // Track milestone
    analyticsService.trackEvent({
      event: 'wallet_activation_step',
      category: 'WalletActivation',
      action: 'Step',
      label: `step_${currentStep.value}`,
      step: currentStep.value,
    });

    telemetryService.trackMilestone({
      journey: 'wallet_activation',
      milestone: `step_${currentStep.value}`,
      timestamp: new Date(),
    });
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const checkAccountReadiness = async () => {
  checkingProvisioning.value = true;
  
  try {
    accountReadiness.value.authenticated = authStore.isAuthenticated;
    accountReadiness.value.provisioned = authStore.isAccountReady;
    accountReadiness.value.canDeploy = authStore.user?.canDeploy === true;

    // Track readiness check
    analyticsService.trackEvent({
      event: 'wallet_readiness_checked',
      category: 'WalletActivation',
      action: 'Check',
      label: 'readiness',
      isReady: isAccountReady.value,
      authenticated: accountReadiness.value.authenticated,
      provisioned: accountReadiness.value.provisioned,
      canDeploy: accountReadiness.value.canDeploy,
    });
  } catch (error) {
    console.error('Error checking account readiness:', error);
    
    // Track error
    analyticsService.trackEvent({
      event: 'wallet_readiness_error',
      category: 'WalletActivation',
      action: 'Error',
      label: 'readiness_check',
    });

    telemetryService.trackErrorRecovery({
      errorType: 'readiness_check_failed',
      stage: 'account_validation',
      recovered: false,
      recoveryMethod: 'abandon',
    });
  } finally {
    checkingProvisioning.value = false;
  }
};

const retryProvisioningCheck = async () => {
  await checkAccountReadiness();
};

const completeActivation = () => {
  currentStep.value = 4;
  
  // Clear checkpoint on successful completion
  clearCheckpoint(JOURNEY_ID);

  // Track activation completion
  analyticsService.trackEvent({
    event: 'wallet_activation_complete',
    category: 'WalletActivation',
    action: 'Complete',
    label: selectedAction.value || 'unknown',
    selectedAction: selectedAction.value,
  });

  telemetryService.trackMilestone({
    journey: 'wallet_activation',
    milestone: 'completion',
    timestamp: new Date(),
    metadata: {
      selectedAction: selectedAction.value,
    },
  });
};

const navigateToAction = () => {
  if (selectedAction.value === 'guided') {
    router.push({ name: 'GuidedLaunch' });
  } else {
    router.push({ name: 'TokenStandards' });
  }
};

onMounted(async () => {
  // Restore checkpoint if journey was interrupted
  const checkpointResult = loadCheckpoint(JOURNEY_ID);
  if (isCheckpointResumable(checkpointResult) && checkpointResult.checkpoint) {
    currentStep.value = checkpointResult.checkpoint.step;
  }

  // Track journey start
  analyticsService.trackEvent({
    event: 'wallet_activation_started',
    category: 'WalletActivation',
    action: 'Start',
    label: 'journey_entry',
  });

  telemetryService.startJourney('wallet_activation', {
    authenticated: authStore.isAuthenticated,
  });

  // Check account readiness immediately
  await checkAccountReadiness();
});
</script>
