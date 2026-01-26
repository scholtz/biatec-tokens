<template>
  <div class="space-y-4">
    <!-- Header with Progress -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">MICA Compliance Checklist</h3>
        <p class="text-sm text-gray-400">{{ completionPercentage }}% Complete</p>
      </div>
      <MicaReadinessBadge :token-id="tokenId" size="lg" />
    </div>

    <!-- Progress Bar -->
    <div class="relative h-2 bg-gray-700 rounded-full overflow-hidden">
      <div 
        class="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-biatec-accent transition-all duration-500 rounded-full"
        :style="{ width: `${completionPercentage}%` }"
      ></div>
    </div>

    <!-- Checklist Items -->
    <div class="space-y-2">
      <div
        v-for="item in compliance.checklist"
        :key="item.id"
        class="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
      >
        <!-- Checkbox -->
        <button
          @click="toggleItem(item.id)"
          :class="[
            'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5',
            item.completed
              ? 'bg-biatec-accent border-biatec-accent'
              : 'border-gray-500 hover:border-biatec-accent'
          ]"
        >
          <i v-if="item.completed" class="pi pi-check text-gray-900 text-xs"></i>
        </button>

        <!-- Label -->
        <div class="flex-1 min-w-0">
          <label 
            :class="[
              'text-sm cursor-pointer',
              item.completed ? 'text-gray-400 line-through' : 'text-gray-300'
            ]"
            @click="toggleItem(item.id)"
          >
            {{ item.label }}
          </label>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 pt-2">
      <button
        v-if="showResetButton && hasAnyCompleted"
        @click="handleReset"
        class="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
      >
        <i class="pi pi-refresh mr-2"></i>
        Reset
      </button>
      <button
        v-if="showComplianceLink"
        @click="navigateToCompliance"
        class="px-4 py-2 text-sm bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors"
      >
        <i class="pi pi-arrow-right mr-2"></i>
        View Full Compliance Dashboard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTokenComplianceStore } from '../stores/tokenCompliance'
import MicaReadinessBadge from './MicaReadinessBadge.vue'

interface Props {
  tokenId: string
  showResetButton?: boolean
  showComplianceLink?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showResetButton: true,
  showComplianceLink: true
})

const router = useRouter()
const complianceStore = useTokenComplianceStore()

const compliance = computed(() => complianceStore.getTokenCompliance(props.tokenId))
const completionPercentage = computed(() => complianceStore.getCompletionPercentage(props.tokenId))

const hasAnyCompleted = computed(() => {
  return compliance.value.checklist.some(item => item.completed)
})

const toggleItem = (itemId: string) => {
  complianceStore.toggleChecklistItem(props.tokenId, itemId)
}

const handleReset = () => {
  if (confirm('Are you sure you want to reset the compliance checklist for this token?')) {
    complianceStore.resetTokenCompliance(props.tokenId)
  }
}

const navigateToCompliance = () => {
  router.push({ name: 'ComplianceDashboard' })
}
</script>
