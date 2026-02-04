<template>
  <Teleport to="body">
    <Transition name="checklist">
      <div
        v-if="visible && !onboardingStore.isOnboardingComplete"
        class="fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)]"
        role="complementary"
        aria-label="Onboarding checklist"
        data-testid="onboarding-checklist"
      >
        <div class="glass-effect rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-white font-bold text-lg flex items-center gap-2">
                <i class="pi pi-check-square"></i>
                Getting Started
              </h3>
              <button
                @click="toggleMinimize"
                class="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                :aria-label="isMinimized ? 'Expand checklist' : 'Minimize checklist'"
                data-testid="checklist-toggle-button"
              >
                <i :class="isMinimized ? 'pi pi-window-maximize' : 'pi pi-window-minimize'"></i>
              </button>
            </div>
            
            <!-- Progress Bar -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-white/90 text-sm">
                <span>{{ onboardingStore.completedSteps }} of {{ onboardingStore.totalSteps }} completed</span>
                <span class="font-semibold">{{ onboardingStore.progressPercentage }}%</span>
              </div>
              <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  class="h-full bg-white transition-all duration-500"
                  :style="{ width: `${onboardingStore.progressPercentage}%` }"
                  role="progressbar"
                  :aria-valuenow="onboardingStore.progressPercentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>

          <!-- Checklist Items (collapsible) -->
          <Transition name="expand">
            <div v-if="!isMinimized" class="p-4 space-y-3 max-h-96 overflow-y-auto">
              <button
                v-for="(step, index) in onboardingStore.steps"
                :key="step.id"
                @click="handleStepClick(step)"
                class="w-full text-left p-3 rounded-xl transition-all"
                :class="[
                  step.completed
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10',
                  !step.completed && 'cursor-pointer'
                ]"
                :aria-label="`${step.title} - ${step.completed ? 'completed' : 'not completed'}`"
                :data-testid="`checklist-step-${step.id}`"
              >
                <div class="flex items-start gap-3">
                  <!-- Step Icon -->
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    :class="
                      step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-gray-400'
                    "
                  >
                    <i v-if="step.completed" class="pi pi-check text-sm"></i>
                    <span v-else class="text-sm font-semibold">{{ index + 1 }}</span>
                  </div>

                  <!-- Step Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h4
                        class="font-semibold text-sm"
                        :class="
                          step.completed
                            ? 'text-green-400'
                            : 'text-gray-900 dark:text-white'
                        "
                      >
                        {{ step.title }}
                      </h4>
                      <span
                        v-if="step.optional"
                        class="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400"
                      >
                        Optional
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      {{ step.description }}
                    </p>
                  </div>

                  <!-- Arrow for incomplete steps -->
                  <i
                    v-if="!step.completed"
                    class="pi pi-chevron-right text-gray-400 mt-1"
                  ></i>
                </div>
              </button>

              <!-- Complete Button -->
              <button
                v-if="onboardingStore.completedSteps >= 3"
                @click="handleComplete"
                class="w-full mt-4 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <i class="pi pi-check-circle mr-2"></i>
                Mark as Complete
              </button>
            </div>
          </Transition>

          <!-- Footer (always visible) -->
          <div
            v-if="!isMinimized"
            class="px-4 py-3 bg-white/5 border-t border-white/10 text-xs text-gray-500 dark:text-gray-400 text-center"
          >
            You can dismiss this anytime from Settings
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '../stores/onboarding'
import { telemetryService } from '../services/TelemetryService'
import type { OnboardingStep } from '../stores/onboarding'

const router = useRouter()
const onboardingStore = useOnboardingStore()

const visible = ref(true)
const isMinimized = ref(false)

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const handleStepClick = (step: OnboardingStep) => {
  if (step.completed) return

  // Track the step click
  telemetryService.trackOnboardingStepCompleted({
    stepId: step.id,
    stepTitle: step.title,
    stepNumber: onboardingStore.steps.findIndex(s => s.id === step.id) + 1,
    totalSteps: onboardingStore.totalSteps,
  })

  // Navigate based on step
  switch (step.id) {
    case 'welcome':
      // Already seen if they can click this
      onboardingStore.markStepComplete('welcome')
      break
    case 'connect-wallet':
      // Show wallet connection wizard
      onboardingStore.markStepComplete('connect-wallet')
      router.push({ name: 'Home', query: { showOnboarding: 'true' } })
      break
    case 'select-standards':
      // Navigate to discovery with standard selection
      router.push({ name: 'DiscoveryDashboard' })
      break
    case 'save-filters':
      // Navigate to discovery to save filters
      router.push({ name: 'DiscoveryDashboard' })
      break
    case 'explore-tokens':
      // Navigate to marketplace or discovery
      router.push({ name: 'Marketplace' })
      break
  }
}

const handleComplete = () => {
  telemetryService.trackOnboardingCompleted()
  onboardingStore.completeOnboarding()
  visible.value = false
}

// Watch for onboarding visibility changes
watch(() => onboardingStore.isOnboardingVisible, (newValue) => {
  if (!newValue && !isMinimized.value) {
    visible.value = true
  }
})

// Initialize onboarding state
onboardingStore.initialize()
</script>

<style scoped>
.checklist-enter-active,
.checklist-leave-active {
  transition: all 0.3s ease;
}

.checklist-enter-from,
.checklist-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
