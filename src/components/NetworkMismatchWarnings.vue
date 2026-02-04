<template>
  <div v-if="warnings.length > 0" class="space-y-3">
    <TransitionGroup name="fade">
      <div
        v-for="(warning, index) in warnings"
        :key="index"
        :class="[
          'p-4 rounded-xl border-2 transition-all duration-300',
          warningClasses[warning.severity],
        ]"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <i
              :class="[
                'text-xl',
                warningIcons[warning.severity],
                warningIconColors[warning.severity],
              ]"
            ></i>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <h4
                :class="[
                  'font-semibold text-sm',
                  warningTitleColors[warning.severity],
                ]"
              >
                {{ warning.title }}
              </h4>
              <span
                v-if="warning.actionRequired"
                class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0"
              >
                Action Required
              </span>
            </div>
            
            <p class="text-sm text-gray-300 mb-2">{{ warning.message }}</p>
            
            <div
              v-if="warning.suggestedAction"
              class="flex items-center gap-2 text-xs font-medium"
              :class="warningSuggestedActionColors[warning.severity]"
            >
              <i class="pi pi-arrow-right"></i>
              <span>{{ warning.suggestedAction }}</span>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { NetworkMismatchWarning } from '../composables/useNetworkValidation'

interface Props {
  warnings: NetworkMismatchWarning[]
}

const props = defineProps<Props>()

const warningClasses = {
  error: 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10',
  warning: 'bg-yellow-500/10 border-yellow-500/50',
  info: 'bg-blue-500/10 border-blue-500/50',
}

const warningIcons = {
  error: 'pi pi-times-circle',
  warning: 'pi pi-exclamation-triangle',
  info: 'pi pi-info-circle',
}

const warningIconColors = {
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

const warningTitleColors = {
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

const warningSuggestedActionColors = {
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.fade-move {
  transition: transform 0.3s ease;
}
</style>
