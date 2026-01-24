<template>
  <div class="compliance-status-indicator">
    <!-- Compact View (for navbar) -->
    <div v-if="compact" class="flex items-center gap-2">
      <div
        class="px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        :class="statusColor"
        @click="showDetails = !showDetails"
        :title="`Compliance Status: ${statusLabel}`"
      >
        <div class="w-2 h-2 rounded-full" :class="dotColor"></div>
        <span class="text-xs font-medium">{{ statusLabel }}</span>
        <i class="pi pi-chevron-down text-xs" :class="{ 'rotate-180': showDetails }"></i>
      </div>

      <!-- Dropdown Details -->
      <Teleport to="body">
        <Transition name="dropdown">
          <div
            v-if="showDetails"
            class="fixed mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
            :style="dropdownStyle"
            @click.stop
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  Compliance Overview
                </h4>
                <button
                  @click="showDetails = false"
                  class="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>

              <!-- Progress Bar -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Progress</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ metrics.completionPercentage }}%
                  </span>
                </div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-300 rounded-full"
                    :class="progressBarColor"
                    :style="{ width: `${metrics.completionPercentage}%` }"
                  ></div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ metrics.completedChecks }} of {{ metrics.totalChecks }} checks completed
                </div>
              </div>

              <!-- MICA Compliance Badge -->
              <div
                v-if="isMicaReady"
                class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
                  <span class="text-sm font-medium text-green-700 dark:text-green-300">
                    MICA Ready
                  </span>
                </div>
              </div>

              <!-- Category Breakdown -->
              <div class="space-y-2">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Categories
                </div>
                <div
                  v-for="category in categoryBreakdown"
                  :key="category.name"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-gray-700 dark:text-gray-300">
                    {{ category.label }}
                  </span>
                  <span class="text-gray-900 dark:text-white font-medium">
                    {{ category.completed }}/{{ category.total }}
                  </span>
                </div>
              </div>

              <router-link
                to="/compliance"
                @click="showDetails = false"
                class="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                View Full Checklist
              </router-link>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>

    <!-- Full View (for dashboard cards) -->
    <Card v-else class="compliance-card">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Compliance Status
          </h3>
          <Badge :variant="badgeVariant">{{ statusLabel }}</Badge>
        </div>

        <!-- Progress Bar -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Overall Progress</span>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ metrics.completionPercentage }}%
            </span>
          </div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-300 rounded-full"
              :class="progressBarColor"
              :style="{ width: `${metrics.completionPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- MICA Compliance -->
        <div
          v-if="isMicaReady"
          class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <i class="pi pi-shield text-2xl text-green-600 dark:text-green-400"></i>
            <div>
              <div class="font-semibold text-green-700 dark:text-green-300">
                MICA Compliant
              </div>
              <div class="text-sm text-green-600 dark:text-green-400">
                All required EU regulations met
              </div>
            </div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="space-y-3">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Category Breakdown
          </div>
          <div class="space-y-2">
            <div
              v-for="category in categoryBreakdown"
              :key="category.name"
              class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ category.label }}
                </span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ category.completed }}/{{ category.total }}
                </span>
              </div>
              <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 rounded-full"
                  :style="{ width: `${category.percentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <router-link
          to="/compliance"
          class="block w-full text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Manage Compliance
        </router-link>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useComplianceStore } from '../stores/compliance'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'

interface Props {
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const complianceStore = useComplianceStore()
const showDetails = ref(false)
const dropdownStyle = ref({})

// Computed properties
const metrics = computed(() => complianceStore.metrics)
const isMicaReady = computed(() => {
  return metrics.value.completionPercentage === 100
})

const statusLabel = computed(() => {
  const percentage = metrics.value.completionPercentage
  if (percentage === 100) return 'Compliant'
  if (percentage >= 75) return 'Nearly Compliant'
  if (percentage >= 50) return 'In Progress'
  return 'Action Required'
})

const badgeVariant = computed(() => {
  const percentage = metrics.value.completionPercentage
  if (percentage === 100) return 'success'
  if (percentage >= 75) return 'info'
  if (percentage >= 50) return 'warning'
  return 'error'
})

const statusColor = computed(() => {
  const percentage = metrics.value.completionPercentage
  if (percentage === 100) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  if (percentage >= 75) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  if (percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
  return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
})

const dotColor = computed(() => {
  const percentage = metrics.value.completionPercentage
  if (percentage === 100) return 'bg-green-500'
  if (percentage >= 75) return 'bg-blue-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
})

const progressBarColor = computed(() => {
  const percentage = metrics.value.completionPercentage
  if (percentage === 100) return 'bg-green-600 dark:bg-green-500'
  if (percentage >= 75) return 'bg-blue-600 dark:bg-blue-500'
  if (percentage >= 50) return 'bg-yellow-600 dark:bg-yellow-500'
  return 'bg-red-600 dark:bg-red-500'
})

const categoryBreakdown = computed(() => {
  const categoryLabels: Record<string, string> = {
    'kyc-aml': 'KYC/AML',
    'jurisdiction': 'Jurisdiction',
    'disclosure': 'Disclosure',
    'network-specific': 'Network-Specific'
  }
  
  return complianceStore.categoryProgress.map(cat => ({
    name: cat.category,
    label: categoryLabels[cat.category] || cat.category,
    total: cat.total,
    completed: cat.completed,
    percentage: cat.percentage
  }))
})

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (showDetails.value) {
    const target = event.target as HTMLElement
    if (!target.closest('.compliance-status-indicator')) {
      showDetails.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
