<template>
  <div class="wizard-container min-h-screen px-4 py-8">
    <div class="max-w-5xl mx-auto">
      <!-- Wizard Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {{ title }}
        </h1>
        <p class="text-gray-600 dark:text-gray-300 text-lg">
          {{ subtitle }}
        </p>
      </div>

      <!-- Step Progress Indicator -->
      <div class="glass-effect rounded-2xl p-6 mb-8 shadow-lg border border-white/10">
        <div class="flex items-center justify-between mb-4">
          <div 
            v-for="(step, index) in steps" 
            :key="step.id"
            class="flex items-center"
            :class="{ 'flex-1': index < steps.length - 1 }"
          >
            <!-- Step Circle -->
            <div class="flex flex-col items-center">
              <button
                @click="goToStep(index)"
                :disabled="!canNavigateToStep(index)"
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300',
                  currentStepIndex === index
                    ? 'bg-biatec-accent text-gray-900 ring-4 ring-biatec-accent/30 scale-110'
                    : isStepCompleted(index)
                    ? 'bg-green-500 text-white cursor-pointer hover:scale-105'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed',
                ]"
                :aria-label="`Step ${index + 1}: ${step.title}`"
                :aria-current="currentStepIndex === index ? 'step' : undefined"
              >
                <i v-if="isStepCompleted(index) && currentStepIndex !== index" class="pi pi-check"></i>
                <span v-else>{{ index + 1 }}</span>
              </button>
              <span 
                :class="[
                  'mt-2 text-sm font-medium hidden md:block',
                  currentStepIndex === index
                    ? 'text-biatec-accent'
                    : isStepCompleted(index)
                    ? 'text-green-400'
                    : 'text-gray-500'
                ]"
              >
                {{ step.title }}
              </span>
            </div>

            <!-- Connector Line -->
            <div 
              v-if="index < steps.length - 1"
              :class="[
                'flex-1 h-1 mx-2 transition-all duration-300',
                isStepCompleted(index)
                  ? 'bg-green-500'
                  : 'bg-gray-700'
              ]"
            ></div>
          </div>
        </div>

        <!-- Mobile Step Title -->
        <div class="md:hidden text-center mt-4">
          <span class="text-sm font-medium text-biatec-accent">
            {{ steps[currentStepIndex]?.title }}
          </span>
        </div>
      </div>

      <!-- Step Content Container -->
      <div class="glass-effect rounded-2xl p-8 shadow-2xl border border-white/10 mb-6">
        <slot :current-step="currentStep" :step-index="currentStepIndex" />
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between gap-4">
        <button
          v-if="currentStepIndex > 0"
          @click="previousStep"
          class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          :aria-label="'Go back to ' + steps[currentStepIndex - 1]?.title"
        >
          <i class="pi pi-arrow-left"></i>
          Previous
        </button>
        <div v-else class="w-32"></div>

        <div class="flex gap-3">
          <button
            v-if="showSaveDraft && currentStepIndex > 0"
            @click="saveDraft"
            class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <i class="pi pi-save"></i>
            Save Draft
          </button>

          <button
            v-if="!isLastStep"
            @click="nextStep"
            :disabled="!canProceedToNext"
            :class="[
              'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
              canProceedToNext
                ? 'bg-biatec-accent hover:bg-biatec-accent/90 text-gray-900'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            ]"
            :aria-label="'Continue to ' + steps[currentStepIndex + 1]?.title"
          >
            Continue
            <i class="pi pi-arrow-right"></i>
          </button>

          <button
            v-else-if="isLastStep && !isComplete"
            @click="completeWizard"
            :disabled="!canComplete"
            :class="[
              'px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
              canComplete
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            ]"
          >
            <i class="pi pi-check"></i>
            Complete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface WizardStep {
  id: string
  title: string
  component?: any
  isValid?: () => boolean
  canNavigate?: boolean
}

interface Props {
  title: string
  subtitle: string
  steps: WizardStep[]
  initialStep?: number
  showSaveDraft?: boolean
  autoSave?: boolean
}

interface Emits {
  (e: 'step-change', stepIndex: number, step: WizardStep): void
  (e: 'complete'): void
  (e: 'save-draft'): void
  (e: 'step-validated', stepIndex: number, isValid: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  initialStep: 0,
  showSaveDraft: true,
  autoSave: true,
})

const emit = defineEmits<Emits>()

const currentStepIndex = ref(props.initialStep)
const completedSteps = ref<Set<number>>(new Set())
const isComplete = ref(false)

const currentStep = computed(() => props.steps[currentStepIndex.value])
const isLastStep = computed(() => currentStepIndex.value === props.steps.length - 1)

const isStepCompleted = (index: number): boolean => {
  return completedSteps.value.has(index)
}

const canNavigateToStep = (index: number): boolean => {
  // Can always go back to completed steps
  if (isStepCompleted(index)) return true
  
  // Can only go forward one step at a time
  return index <= currentStepIndex.value + 1
}

const canProceedToNext = computed(() => {
  const step = currentStep.value
  if (!step) return false
  
  // If step has validation function, use it
  if (step.isValid) {
    return step.isValid()
  }
  
  // By default, allow proceeding
  return true
})

const canComplete = computed(() => {
  // All previous steps must be valid
  return props.steps.every((step) => {
    if (step.isValid) {
      return step.isValid()
    }
    return true
  })
})

const goToStep = (index: number) => {
  if (!canNavigateToStep(index)) return
  
  currentStepIndex.value = index
  emit('step-change', index, props.steps[index])
}

const nextStep = () => {
  if (!canProceedToNext.value || isLastStep.value) return
  
  // Mark current step as completed
  completedSteps.value.add(currentStepIndex.value)
  
  // Move to next step
  currentStepIndex.value++
  emit('step-change', currentStepIndex.value, currentStep.value)
  
  // Auto-save if enabled
  if (props.autoSave) {
    saveDraft()
  }
}

const previousStep = () => {
  if (currentStepIndex.value <= 0) return
  
  currentStepIndex.value--
  emit('step-change', currentStepIndex.value, currentStep.value)
}

const saveDraft = () => {
  emit('save-draft')
}

const completeWizard = () => {
  if (!canComplete.value) return
  
  completedSteps.value.add(currentStepIndex.value)
  isComplete.value = true
  emit('complete')
}

// Watch for step validation changes
watch(
  () => canProceedToNext.value,
  (isValid) => {
    emit('step-validated', currentStepIndex.value, isValid)
  }
)

// Expose methods for parent components
defineExpose({
  goToStep,
  nextStep,
  previousStep,
  currentStepIndex,
  isStepCompleted,
})
</script>

<style scoped>
.wizard-container {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
