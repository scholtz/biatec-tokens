<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">
          Enterprise Onboarding Command Center
        </h1>
        <p class="text-xl text-gray-300">
          Complete these steps to prepare for compliant token issuance
        </p>
      </div>

      <!-- Progress Overview -->
      <Card variant="glass" padding="lg" class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-white mb-1">Onboarding Progress</h2>
            <p class="text-gray-400">
              {{ completedSteps }} of {{ totalSteps }} steps completed
            </p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold text-blue-400">{{ progressPercentage }}%</div>
            <div class="text-sm text-gray-400">Complete</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="relative pt-1">
          <div class="overflow-hidden h-4 mb-2 text-xs flex rounded-full bg-gray-700">
            <div
              :style="{ width: `${progressPercentage}%` }"
              class="transition-all duration-500 shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-blue-600"
            />
          </div>
        </div>
      </Card>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Steps List (Left Column) -->
        <div class="lg:col-span-2 space-y-4">
          <Card
            v-for="step in steps"
            :key="step.id"
            variant="glass"
            padding="lg"
            :class="[
              'transition-all duration-300',
              selectedStep?.id === step.id ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <div class="flex items-start gap-4">
              <!-- Status Icon -->
              <div class="flex-shrink-0 mt-1">
                <CheckCircleIcon
                  v-if="step.status === 'completed'"
                  class="w-8 h-8 text-green-400"
                />
                <ExclamationCircleIcon
                  v-else-if="step.status === 'needs_action'"
                  class="w-8 h-8 text-yellow-400"
                />
                <ArrowPathIcon
                  v-else-if="step.status === 'in_progress'"
                  class="w-8 h-8 text-blue-400 animate-spin"
                />
                <div
                  v-else
                  class="w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center"
                >
                  <span class="text-sm text-gray-500">{{ step.order }}</span>
                </div>
              </div>

              <!-- Step Content -->
              <div class="flex-1">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h3 class="text-lg font-semibold text-white mb-1">
                      {{ step.title }}
                    </h3>
                    <Badge
                      :variant="getStatusBadgeVariant(step.status)"
                      size="sm"
                      class="mb-2"
                    >
                      {{ getStatusLabel(step.status) }}
                    </Badge>
                  </div>
                  <Button
                    v-if="step.status !== 'completed'"
                    @click="selectStep(step)"
                    variant="ghost"
                    size="sm"
                  >
                    {{ step.status === 'not_started' ? 'Start' : 'Continue' }}
                  </Button>
                </div>

                <p class="text-gray-300 mb-3">{{ step.description }}</p>

                <!-- Step Owner -->
                <div v-if="step.owner" class="flex items-center text-sm text-gray-400 mb-2">
                  <UserIcon class="w-4 h-4 mr-1" />
                  Owner: {{ step.owner }}
                </div>

                <!-- Completion Info -->
                <div
                  v-if="step.completedAt"
                  class="flex items-center text-sm text-gray-400"
                >
                  <ClockIcon class="w-4 h-4 mr-1" />
                  Completed {{ formatDate(step.completedAt) }}
                  <span v-if="step.completedBy" class="ml-2">
                    by {{ step.completedBy }}
                  </span>
                </div>

                <!-- Error Message -->
                <div
                  v-if="step.error"
                  class="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg"
                >
                  <div class="flex items-start">
                    <ExclamationTriangleIcon class="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <div class="text-sm font-semibold text-red-300 mb-1">
                        Action Required
                      </div>
                      <div class="text-sm text-red-200 mb-2">{{ step.error.message }}</div>
                      <div v-if="step.error.remediation" class="text-sm text-gray-300">
                        <strong>Next steps:</strong> {{ step.error.remediation }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Activity Feed & Guidance (Right Column) -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Guidance Panel -->
          <Card variant="elevated" padding="lg">
            <div class="flex items-start mb-4">
              <InformationCircleIcon class="w-6 h-6 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">
                  {{ selectedStep ? selectedStep.title : 'Getting Started' }}
                </h3>
                <p class="text-sm text-gray-300 mb-4">
                  {{ selectedStep ? selectedStep.guidance : 'Select a step to view detailed guidance and compliance requirements.' }}
                </p>

                <!-- Compliance Info -->
                <div
                  v-if="selectedStep?.complianceInfo"
                  class="p-3 bg-blue-900/30 rounded-lg border border-blue-700"
                >
                  <div class="text-xs font-semibold text-blue-300 mb-2">
                    COMPLIANCE NOTE
                  </div>
                  <div class="text-xs text-gray-300">
                    {{ selectedStep.complianceInfo }}
                  </div>
                </div>

                <!-- Support Link -->
                <a
                  href="#"
                  class="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 mt-4"
                >
                  View detailed documentation
                  <ArrowTopRightOnSquareIcon class="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </Card>

          <!-- Activity Feed -->
          <Card variant="glass" padding="lg">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
              <ClockIcon class="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="flex items-start gap-3 pb-3 border-b border-gray-700 last:border-0"
              >
                <div class="flex-shrink-0 mt-1">
                  <div
                    :class="[
                      'w-2 h-2 rounded-full',
                      activity.type === 'completed' ? 'bg-green-400' :
                      activity.type === 'failed' ? 'bg-red-400' :
                      'bg-blue-400'
                    ]"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-white">{{ activity.message }}</p>
                  <div class="flex items-center mt-1 text-xs text-gray-400">
                    <span>{{ activity.actor }}</span>
                    <span class="mx-2">•</span>
                    <span>{{ formatDate(activity.timestamp) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="recentActivities.length === 0" class="text-center py-8">
                <p class="text-gray-400 text-sm">No activity yet</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEnterpriseOnboardingStore } from '../stores/enterpriseOnboarding'
import { useAuthStore } from '../stores/auth'
import { TelemetryService } from '../services/TelemetryService'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import Badge from '../components/ui/Badge.vue'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserIcon,
  ClockIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const onboardingStore = useEnterpriseOnboardingStore()
const authStore = useAuthStore()
const telemetry = TelemetryService.getInstance()

const selectedStep = ref(onboardingStore.steps[0])

const steps = computed(() => onboardingStore.steps)
const recentActivities = computed(() => onboardingStore.recentActivities)
const completedSteps = computed(() => steps.value.filter(s => s.status === 'completed').length)
const totalSteps = computed(() => steps.value.length)
const progressPercentage = computed(() => 
  totalSteps.value > 0 ? Math.round((completedSteps.value / totalSteps.value) * 100) : 0
)

const selectStep = (step: typeof steps.value[0]) => {
  selectedStep.value = step
  
  // Track step selection
  telemetry.track('onboarding_step_viewed', {
    step_id: step.id,
    step_title: step.title,
    step_status: step.status,
  })
}

const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
  switch (status) {
    case 'completed': return 'success'
    case 'needs_action': return 'warning'
    case 'in_progress': return 'info'
    default: return 'default'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'completed': return 'Completed'
    case 'needs_action': return 'Needs Action'
    case 'in_progress': return 'In Progress'
    case 'not_started': return 'Not Started'
    default: return 'Unknown'
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(async () => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Home', query: { showAuth: 'true' } })
    return
  }

  // Initialize store
  await onboardingStore.initialize()

  // Track page view
  telemetry.track('enterprise_onboarding_viewed', {
    completed_steps: completedSteps.value,
    total_steps: totalSteps.value,
    progress_percentage: progressPercentage.value,
  })

  // Select first incomplete step
  const firstIncomplete = steps.value.find(s => s.status !== 'completed')
  if (firstIncomplete) {
    selectedStep.value = firstIncomplete
  }
})
</script>
