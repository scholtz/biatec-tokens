<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">

        <!-- Page header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <RocketLaunchIcon class="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Onboarding</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Guided journey from first sign-in to your first deployed token.
              </p>
            </div>
          </div>
        </div>

        <!-- Return-user welcome banner -->
        <div
          v-if="isReturningUser"
          class="mb-6 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center gap-3"
          role="status"
          aria-live="polite"
        >
          <SparklesIcon class="w-5 h-5 text-blue-500 flex-shrink-0" aria-hidden="true" />
          <p class="text-sm text-blue-800 dark:text-blue-200">
            Welcome back! Here's what changed since your last visit.
          </p>
        </div>

        <!-- Main two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left column: guided next step + action readiness -->
          <div class="lg:col-span-1 space-y-6">

            <!-- Guided next step module -->
            <GuidedNextStepModule :steps="onboardingSteps" />

            <!-- Action readiness for the next step CTA -->
            <ActionReadinessIndicator
              :checks="readiness.checks"
              :can-proceed="readiness.canProceed"
            >
              <template #proceed>
                <router-link
                  v-if="nextStep?.ctaPath"
                  :to="nextStep.ctaPath"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ArrowRightIcon class="w-4 h-4" aria-hidden="true" />
                  {{ nextStep?.ctaLabel ?? 'Continue' }}
                </router-link>
              </template>
            </ActionReadinessIndicator>
          </div>

          <!-- Right column: portfolio continuity panel -->
          <div class="lg:col-span-2">
            <PortfolioContinuityPanel
              :deltas="portfolioDeltas"
              :snapshot-captured-at="previousSnapshot?.capturedAt"
              :has-previous-snapshot="!!previousSnapshot"
              :loading="portfolioLoading"
              :error="portfolioError ?? undefined"
            />

            <!-- Quick-action cards (post-onboarding) -->
            <div v-if="onboardingComplete" class="mt-6">
              <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <router-link
                  v-for="action in quickActions"
                  :key="action.label"
                  :to="action.path"
                  class="flex flex-col items-start gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="action.iconBg">
                    <component :is="action.icon" class="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {{ action.label }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ action.description }}</p>
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  RocketLaunchIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CommandLineIcon,
} from '@heroicons/vue/24/outline'
import MainLayout from '../layout/MainLayout.vue'
import GuidedNextStepModule from '../components/onboarding/GuidedNextStepModule.vue'
import PortfolioContinuityPanel from '../components/onboarding/PortfolioContinuityPanel.vue'
import ActionReadinessIndicator from '../components/onboarding/ActionReadinessIndicator.vue'
import { useAuthStore } from '../stores/auth'
import { useTokenStore } from '../stores/tokens'
import type { Token } from '../stores/tokens'
import {
  deriveOnboardingSteps,
  getNextStep,
  calculateOnboardingProgress,
  computePortfolioDeltas,
  savePortfolioSnapshot,
  loadPortfolioSnapshot,
  evaluateActionReadiness,
  buildOnboardingAnalyticsPayload,
  type PortfolioSnapshot,
} from '../utils/portfolioOnboarding'
import { analyticsService } from '../services/analytics'

const authStore = useAuthStore()
const tokenStore = useTokenStore()

// ─── Auth / provisioning context ─────────────────────────────────────────────

const provisioningStatus = computed(
  () => authStore.user?.provisioningStatus ?? 'not_started',
)

// ─── Portfolio state (derived from tokens store) ──────────────────────────────

const portfolioLoading = ref(false)
const portfolioError = ref<string | null>(null)
const previousSnapshot = ref<PortfolioSnapshot | null>(null)

const currentSnapshot = computed<PortfolioSnapshot>(() => ({
  tokenCount: tokenStore.tokens.length,
  deployedCount: tokenStore.tokens.filter((t: Token) => t.status === 'deployed').length,
  complianceScore: 75, // placeholder – would come from complianceStore in production
  capturedAt: new Date().toISOString(),
}))

const portfolioDeltas = computed(() => {
  if (!previousSnapshot.value) return []
  return computePortfolioDeltas(previousSnapshot.value, currentSnapshot.value)
})

// ─── Onboarding step derivation ───────────────────────────────────────────────

const onboardingContext = computed(() => ({
  isAuthenticated: authStore.isAuthenticated,
  user: authStore.user,
  provisioningStatus: provisioningStatus.value,
  hasCreatedToken: tokenStore.tokens.length > 0,
  hasDeployedToken: tokenStore.tokens.some((t: Token) => t.status === 'deployed'),
  hasConfiguredCompliance: false, // placeholder – would come from complianceStore
  tokenCount: tokenStore.tokens.length,
}))

const onboardingSteps = computed(() => deriveOnboardingSteps(onboardingContext.value))
const nextStep = computed(() => getNextStep(onboardingSteps.value))
const progressPercent = computed(() => calculateOnboardingProgress(onboardingSteps.value))
const onboardingComplete = computed(() => progressPercent.value === 100)

// ─── Action readiness ─────────────────────────────────────────────────────────

const readiness = computed(() =>
  evaluateActionReadiness({
    isAuthenticated: authStore.isAuthenticated,
    provisioningStatus: provisioningStatus.value,
    networkValid: true, // simplified – would check active network in production
    requiredFieldsComplete: true,
    estimatedImpactAvailable: true,
  }),
)

// ─── Returning user detection ─────────────────────────────────────────────────

const isReturningUser = computed(() => !!previousSnapshot.value)

// ─── Quick actions (shown after onboarding complete) ─────────────────────────

const quickActions = [
  {
    label: 'Token Dashboard',
    description: 'Monitor all your tokens',
    path: '/dashboard',
    icon: ChartBarIcon,
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
  },
  {
    label: 'Lifecycle Cockpit',
    description: 'Manage token operations',
    path: '/cockpit',
    icon: CommandLineIcon,
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-700',
  },
  {
    label: 'Compliance Setup',
    description: 'Manage whitelists & rules',
    path: '/compliance/setup',
    icon: ShieldCheckIcon,
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  },
]

// ─── Lifecycle ────────────────────────────────────────────────────────────────

const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`

onMounted(async () => {
  portfolioLoading.value = true
  try {
    // Load previous snapshot for continuity
    previousSnapshot.value = loadPortfolioSnapshot()

    // Emit analytics
    const isReturn = !!previousSnapshot.value
    analyticsService.trackEvent(
      buildOnboardingAnalyticsPayload(
        isReturn ? 'return_session_started' : 'onboarding_started',
        sessionId,
        { metadata: { progressPercent: progressPercent.value } },
      ),
    )
    if (isReturn) {
      analyticsService.trackEvent(
        buildOnboardingAnalyticsPayload('continuity_panel_viewed', sessionId),
      )
    }
  } catch (_err) {
    portfolioError.value = 'Unable to load portfolio history.'
  } finally {
    portfolioLoading.value = false
  }

  // Persist current snapshot for next visit
  savePortfolioSnapshot(currentSnapshot.value)
})
</script>
