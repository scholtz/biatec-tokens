<template>
  <div class="space-y-6">
    <!-- Header with Progress Overview -->
    <div class="glass-effect rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="pi pi-shield-check text-biatec-accent"></i>
            Compliance Checklist
          </h2>
          <p class="text-sm text-gray-400 mt-1">MICA-compliant token launch preparation</p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold text-biatec-accent">
            {{ complianceStore.metrics.completionPercentage }}%
          </div>
          <div class="text-xs text-gray-400">
            {{ complianceStore.metrics.completedChecks }} / {{ complianceStore.metrics.totalChecks }} completed
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="relative h-3 bg-gray-700 rounded-full overflow-hidden">
        <div 
          class="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-biatec-accent transition-all duration-500 rounded-full"
          :style="{ width: `${complianceStore.metrics.completionPercentage}%` }"
        ></div>
      </div>

      <!-- Category Progress -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div 
          v-for="category in complianceStore.categoryProgress" 
          :key="category.category"
          class="p-3 bg-white/5 rounded-lg"
        >
          <div class="text-xs text-gray-400 mb-1">{{ getCategoryLabel(category.category) }}</div>
          <div class="flex items-center gap-2">
            <div class="text-lg font-semibold text-white">{{ category.completed }}/{{ category.total }}</div>
            <div class="text-xs text-gray-400">({{ category.percentage }}%)</div>
          </div>
        </div>
      </div>

      <!-- Network Selection -->
      <div class="mt-4 pt-4 border-t border-white/10">
        <label class="text-sm text-gray-300 mb-2 block">Filter by Network:</label>
        <div class="flex gap-2">
          <button
            v-for="network in ['Both', 'VOI', 'Aramid']"
            :key="network"
            @click="complianceStore.setNetwork(network as any)"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              complianceStore.selectedNetwork === network
                ? 'bg-biatec-accent text-gray-900'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            ]"
          >
            {{ network }}
          </button>
        </div>
      </div>
    </div>

    <!-- Checklist by Category -->
    <div 
      v-for="category in categories" 
      :key="category"
      class="glass-effect rounded-xl p-6"
    >
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <i :class="getCategoryIcon(category)" class="text-biatec-accent"></i>
        {{ getCategoryLabel(category) }}
      </h3>

      <div class="space-y-3">
        <div
          v-for="item in getCategoryItems(category)"
          :key="item.id"
          class="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
        >
          <div class="flex items-start gap-3">
            <!-- Checkbox -->
            <div class="flex-shrink-0 pt-1">
              <button
                @click="handleToggle(item.id)"
                :class="[
                  'w-6 h-6 rounded border-2 flex items-center justify-center transition-all',
                  item.completed
                    ? 'bg-biatec-accent border-biatec-accent'
                    : 'border-gray-500 hover:border-biatec-accent'
                ]"
              >
                <i v-if="item.completed" class="pi pi-check text-gray-900 text-sm"></i>
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex-1">
                  <h4 class="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {{ item.label }}
                    <span
                      v-if="item.required"
                      class="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded"
                    >
                      Required
                    </span>
                    <span
                      v-if="item.networks && item.networks.length === 1"
                      class="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded"
                    >
                      {{ item.networks[0] }}
                    </span>
                  </h4>
                  <p class="text-sm text-gray-400 mt-1">{{ item.description }}</p>
                </div>
              </div>

              <!-- Expandable Details -->
              <div v-if="expandedItems[item.id]" class="mt-3 space-y-3">
                <!-- Notes -->
                <div>
                  <label class="text-xs text-gray-400 mb-1 block">Notes:</label>
                  <textarea
                    :value="item.notes || ''"
                    @input="(e) => complianceStore.updateItemNotes(item.id, (e.target as HTMLTextAreaElement).value)"
                    placeholder="Add implementation notes, references, or documentation links..."
                    class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
                    rows="2"
                  ></textarea>
                </div>

                <!-- Document Link -->
                <div>
                  <label class="text-xs text-gray-400 mb-1 block">Document URL:</label>
                  <input
                    type="url"
                    :value="item.documentUrl || ''"
                    @input="(e) => complianceStore.updateItemDocument(item.id, (e.target as HTMLInputElement).value)"
                    placeholder="https://example.com/document.pdf"
                    class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-biatec-accent"
                  />
                </div>
              </div>

              <!-- Toggle Details Button -->
              <button
                @click="toggleExpanded(item.id)"
                class="mt-2 text-xs text-biatec-accent hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <i :class="expandedItems[item.id] ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                {{ expandedItems[item.id] ? 'Hide' : 'Show' }} Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="glass-effect rounded-xl p-6">
      <div class="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div class="text-sm text-gray-400">
          <div v-if="complianceStore.requiredItemsComplete" class="flex items-center gap-2 text-green-400">
            <i class="pi pi-check-circle"></i>
            All required items completed!
          </div>
          <div v-else class="flex items-center gap-2 text-yellow-400">
            <i class="pi pi-exclamation-circle"></i>
            Complete all required items before deployment
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="handleExport"
            class="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
          >
            <i class="pi pi-download"></i>
            Export Summary
          </button>

          <button
            @click="handleReset"
            class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
          >
            <i class="pi pi-refresh"></i>
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useComplianceStore, CHECKLIST_CATEGORIES } from '../stores/compliance'
import { useSubscriptionStore } from '../stores/subscription'

const complianceStore = useComplianceStore()
const subscriptionStore = useSubscriptionStore()

const expandedItems = reactive<Record<string, boolean>>({})

const categories = CHECKLIST_CATEGORIES

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'kyc-aml': 'KYC/AML Compliance',
    'jurisdiction': 'Jurisdiction & Regulations',
    'disclosure': 'Disclosure Documents',
    'network-specific': 'Network-Specific Requirements'
  }
  return labels[category] || category
}

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'kyc-aml': 'pi pi-users',
    'jurisdiction': 'pi pi-globe',
    'disclosure': 'pi pi-file',
    'network-specific': 'pi pi-server'
  }
  return icons[category] || 'pi pi-check'
}

const getCategoryItems = (category: string) => {
  return complianceStore.filteredChecklist.filter(item => item.category === category)
}

const toggleExpanded = (itemId: string) => {
  expandedItems[itemId] = !expandedItems[itemId]
}

const handleToggle = (itemId: string) => {
  const wasComplete = complianceStore.checklistItems.find(i => i.id === itemId)?.completed
  complianceStore.toggleCheckItem(itemId)
  
  // Track completion event if all required items are now complete
  if (!wasComplete && complianceStore.requiredItemsComplete) {
    trackCompletionEvent()
  }
}

const trackCompletionEvent = () => {
  // Track analytics event for checklist completion
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'compliance_checklist_completed', {
      event_category: 'compliance',
      event_label: complianceStore.selectedNetwork,
      value: complianceStore.metrics.completionPercentage,
      completion_time: complianceStore.checklistStartedAt 
        ? new Date().getTime() - complianceStore.checklistStartedAt.getTime()
        : 0
    })
  }
  
  // Track in subscription store for reporting
  subscriptionStore.trackGuidanceInteraction()
  
  console.log('Compliance checklist completed', {
    network: complianceStore.selectedNetwork,
    metrics: complianceStore.metrics,
    timestamp: new Date().toISOString()
  })
}

const handleExport = () => {
  const summary = complianceStore.exportChecklistSummary()
  
  // Track export event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'compliance_checklist_exported', {
      event_category: 'compliance',
      event_label: complianceStore.selectedNetwork,
      value: complianceStore.metrics.completionPercentage
    })
  }
  
  // Create downloadable JSON file
  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `compliance-checklist-${complianceStore.selectedNetwork}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  // Show success message
  console.log('Compliance checklist exported successfully')
}

const handleReset = () => {
  if (confirm('Are you sure you want to reset the compliance checklist? This will clear all progress and notes.')) {
    complianceStore.resetChecklist()
    Object.keys(expandedItems).forEach(key => {
      delete expandedItems[key]
    })
  }
}
</script>
