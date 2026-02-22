<template>
  <div
    class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm"
    role="region"
    aria-label="Guided next step"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
          <MapIcon class="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">Your Next Step</h2>
      </div>
      <Badge :variant="progressBadgeVariant" size="sm" aria-label="Onboarding progress">
        {{ progressPercent }}% complete
      </Badge>
    </div>

    <!-- Progress bar -->
    <div class="mb-5">
      <div
        class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Current next step -->
    <div v-if="nextStep" class="mb-5">
      <div
        class="rounded-xl p-4"
        :class="nextStepCardClass"
      >
        <div class="flex items-start gap-3">
          <component
            :is="nextStepIcon"
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            :class="nextStepIconClass"
            aria-hidden="true"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold mb-1" :class="nextStepTitleClass">
              {{ nextStep.title }}
            </p>
            <p class="text-sm leading-relaxed" :class="nextStepDescClass">
              {{ nextStep.description }}
            </p>
            <p
              v-if="nextStep.blockedReason"
              class="text-sm mt-2 text-red-700 dark:text-red-400"
              role="alert"
            >
              <ExclamationTriangleIcon class="w-4 h-4 inline mr-1" aria-hidden="true" />
              {{ nextStep.blockedReason }}
            </p>
            <p v-if="nextStep.remediationAction" class="text-xs mt-1 text-gray-500 dark:text-gray-400">
              {{ nextStep.remediationAction }}
            </p>
          </div>
        </div>
        <!-- CTA -->
        <div v-if="nextStep.ctaPath && nextStep.status !== 'blocked'" class="mt-3 flex justify-end">
          <router-link
            :to="nextStep.ctaPath"
            class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            {{ nextStep.ctaLabel ?? 'Continue' }}
            <ArrowRightIcon class="w-4 h-4" aria-hidden="true" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- All steps mini-list -->
    <ol class="space-y-2" aria-label="Onboarding steps">
      <li
        v-for="step in steps"
        :key="step.id"
        class="flex items-center gap-3"
        :aria-current="step.id === nextStep?.id ? 'step' : undefined"
      >
        <span class="flex-shrink-0">
          <CheckCircleIcon
            v-if="step.status === 'completed'"
            class="w-5 h-5 text-green-500"
            aria-label="Completed"
          />
          <ExclamationCircleIcon
            v-else-if="step.status === 'blocked'"
            class="w-5 h-5 text-red-400"
            aria-label="Blocked"
          />
          <div
            v-else-if="step.status === 'in_progress'"
            class="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
            aria-label="In progress"
          >
            <div class="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div
            v-else
            class="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"
            aria-label="Pending"
          />
        </span>
        <span
          class="text-sm"
          :class="{
            'text-gray-900 dark:text-white font-medium': step.status === 'in_progress',
            'text-green-700 dark:text-green-400': step.status === 'completed',
            'text-red-600 dark:text-red-400': step.status === 'blocked',
            'text-gray-400 dark:text-gray-500': step.status === 'pending',
          }"
        >
          {{ step.title }}
        </span>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline'
import { MapIcon } from '@heroicons/vue/24/solid'
import Badge from '../ui/Badge.vue'
import type { OnboardingStep } from '../../utils/portfolioOnboarding'
import {
  getNextStep,
  calculateOnboardingProgress,
} from '../../utils/portfolioOnboarding'

interface Props {
  steps: OnboardingStep[]
}

const props = defineProps<Props>()

const nextStep = computed(() => getNextStep(props.steps))
const progressPercent = computed(() => calculateOnboardingProgress(props.steps))

const progressBadgeVariant = computed(() => {
  if (progressPercent.value >= 100) return 'success'
  if (progressPercent.value >= 50) return 'info'
  return 'default'
})

const nextStepCardClass = computed(() => {
  if (!nextStep.value) return ''
  switch (nextStep.value.status) {
    case 'in_progress':
      return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
    case 'blocked':
      return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
    default:
      return 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
  }
})

const nextStepIcon = computed(() => {
  if (!nextStep.value) return CheckCircleIcon
  return nextStep.value.status === 'blocked' ? ExclamationTriangleIcon : ArrowRightIcon
})

const nextStepIconClass = computed(() => {
  if (!nextStep.value) return ''
  return nextStep.value.status === 'blocked'
    ? 'text-red-500'
    : 'text-blue-500'
})

const nextStepTitleClass = computed(() => {
  if (!nextStep.value) return ''
  return nextStep.value.status === 'blocked'
    ? 'text-red-800 dark:text-red-200'
    : 'text-blue-900 dark:text-blue-100'
})

const nextStepDescClass = computed(() => {
  if (!nextStep.value) return ''
  return nextStep.value.status === 'blocked'
    ? 'text-red-700 dark:text-red-300'
    : 'text-blue-800 dark:text-blue-200'
})
</script>
