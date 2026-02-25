<template>
  <div
    v-if="showWalkthrough"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    :aria-label="`Portfolio onboarding step ${currentStep + 1} of ${steps.length}`"
  >
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-6">
      <!-- Step indicators -->
      <div class="flex gap-1.5 mb-6">
        <div
          v-for="(_, i) in steps"
          :key="i"
          class="h-1 flex-1 rounded-full transition-all duration-300"
          :class="i <= currentStep ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'"
        ></div>
      </div>

      <!-- Step content -->
      <div class="mb-6">
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
          <span class="text-2xl" aria-hidden="true">{{ steps[currentStep].icon }}</span>
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ steps[currentStep].title }}</h2>
        <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{{ steps[currentStep].description }}</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between gap-3">
        <button
          @click="handleSkip"
          class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Skip onboarding walkthrough"
        >
          Skip tour
        </button>

        <div class="flex gap-2">
          <button
            v-if="currentStep > 0"
            @click="currentStep--"
            class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            v-if="currentStep < steps.length - 1"
            @click="currentStep++"
            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Next
          </button>
          <button
            v-else
            @click="handleComplete"
            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PORTFOLIO_ONBOARDING_COMPLETED_KEY } from '../../utils/portfolioWatchlist'

const ONBOARDING_COMPLETED_KEY = PORTFOLIO_ONBOARDING_COMPLETED_KEY

interface Props {
  isFirstVisit: boolean
  hasCompletedOnboarding: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  completed: []
  skipped: []
  replay: []
}>()

const currentStep = ref(0)

const steps = [
  {
    icon: '📊',
    title: 'Portfolio Summary',
    description: 'See your total portfolio value, 24h change, and allocation breakdown across all your networks at a glance.',
  },
  {
    icon: '💡',
    title: 'Smart Insights',
    description: 'Automated insights detect concentration risks, unusual price movements, dormant holdings, and low-liquidity warnings.',
  },
  {
    icon: '📌',
    title: 'Watchlist',
    description: 'Pin your most important assets for quick access. Your watchlist is saved locally and persists across sessions.',
  },
]

const showWalkthrough = computed(
  () => props.isFirstVisit && !props.hasCompletedOnboarding,
)

onMounted(() => {
  if (showWalkthrough.value) {
    emit('replay')
  }
})

function handleComplete() {
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
  emit('completed')
}

function handleSkip() {
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'skipped')
  emit('skipped')
}
</script>
