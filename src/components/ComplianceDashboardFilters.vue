<template>
  <Card variant="glass" class="compliance-dashboard-filters">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-blue-500/20">
            <i class="pi pi-filter text-blue-400 text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Compliance Filters
            </h3>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Filter tokens by regulatory requirements
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Badge v-if="hasActiveFilters" variant="info" class="text-xs">
            {{ activeFilterCount }} active
          </Badge>
          <button
            @click="togglePanel"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :title="isExpanded ? 'Collapse filters' : 'Expand filters'"
          >
            <i :class="['pi text-sm', isExpanded ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
          </button>
        </div>
      </div>

      <!-- Filter Panel (Collapsible) -->
      <div v-show="isExpanded" class="space-y-4">
        <!-- Regulatory Impact Notice -->
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
            <div class="text-xs text-blue-700 dark:text-blue-300">
              <strong>Regulatory Impact:</strong> These filters help you identify tokens that comply with 
              <strong>MiCA</strong> (Markets in Crypto-Assets) regulations and other jurisdiction requirements. 
              Whitelist-required tokens may restrict transfers to approved addresses only.
            </div>
          </div>
        </div>

        <!-- Filters Grid -->
        <div class="p-4 bg-white/5 dark:bg-gray-800/30 rounded-lg space-y-3">
          <!-- Network Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <i class="pi pi-globe mr-1 text-xs"></i>
              Network
            </label>
            <select
              :value="filters.network"
              @change="setFilter('network', ($event.target as HTMLSelectElement).value)"
              class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="all">All Networks</option>
              <option value="VOI">VOI Network</option>
              <option value="Aramid">Aramid Network</option>
            </select>
          </div>

          <!-- MICA Readiness Filter -->
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <i class="pi pi-shield text-green-600 dark:text-green-400"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    MICA Ready
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">
                    Meets EU MiCA regulatory standards
                  </div>
                </div>
              </label>
            </div>
            <div class="flex gap-1">
              <button
                @click="setFilter('micaReady', null)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.micaReady === null
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                All
              </button>
              <button
                @click="setFilter('micaReady', true)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.micaReady === true
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Yes
              </button>
              <button
                @click="setFilter('micaReady', false)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.micaReady === false
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                No
              </button>
            </div>
          </div>

          <!-- Whitelist Required Filter -->
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <i class="pi pi-lock text-yellow-600 dark:text-yellow-400"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    Whitelist Required
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">
                    Transfers restricted to approved addresses
                  </div>
                </div>
              </label>
            </div>
            <div class="flex gap-1">
              <button
                @click="setFilter('whitelistRequired', null)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.whitelistRequired === null
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                All
              </button>
              <button
                @click="setFilter('whitelistRequired', true)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.whitelistRequired === true
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Required
              </button>
              <button
                @click="setFilter('whitelistRequired', false)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.whitelistRequired === false
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Not Required
              </button>
            </div>
          </div>

          <!-- KYC Required Filter -->
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <i class="pi pi-user-check text-blue-600 dark:text-blue-400"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    KYC Required
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">
                    Know Your Customer verification needed
                  </div>
                </div>
              </label>
            </div>
            <div class="flex gap-1">
              <button
                @click="setFilter('kycRequired', null)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.kycRequired === null
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                All
              </button>
              <button
                @click="setFilter('kycRequired', true)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.kycRequired === true
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Required
              </button>
              <button
                @click="setFilter('kycRequired', false)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.kycRequired === false
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Not Required
              </button>
            </div>
          </div>

          <!-- Jurisdiction Restricted Filter -->
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <i class="pi pi-map-marker text-orange-600 dark:text-orange-400"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    Jurisdiction Restricted
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">
                    Geographic or regulatory restrictions
                  </div>
                </div>
              </label>
            </div>
            <div class="flex gap-1">
              <button
                @click="setFilter('jurisdictionRestricted', null)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.jurisdictionRestricted === null
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                All
              </button>
              <button
                @click="setFilter('jurisdictionRestricted', true)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.jurisdictionRestricted === true
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Restricted
              </button>
              <button
                @click="setFilter('jurisdictionRestricted', false)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.jurisdictionRestricted === false
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Unrestricted
              </button>
            </div>
          </div>

          <!-- Transfer Restricted Filter -->
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <i class="pi pi-ban text-red-600 dark:text-red-400"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    Transfer Controls
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">
                    Freeze or clawback controls enabled
                  </div>
                </div>
              </label>
            </div>
            <div class="flex gap-1">
              <button
                @click="setFilter('transferRestricted', null)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.transferRestricted === null
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                All
              </button>
              <button
                @click="setFilter('transferRestricted', true)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.transferRestricted === true
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Controlled
              </button>
              <button
                @click="setFilter('transferRestricted', false)"
                :class="[
                  'px-3 py-1 text-xs rounded transition-colors',
                  filters.transferRestricted === false
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                Unrestricted
              </button>
            </div>
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="flex justify-between items-center pt-2">
          <button
            v-if="hasActiveFilters"
            @click="handleReset"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
          >
            <i class="pi pi-times text-xs"></i>
            Clear All Filters
          </button>
          <div v-else class="text-sm text-gray-500 dark:text-gray-400">
            No filters active
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import { useComplianceDashboardStore } from '../stores/complianceDashboard'

const store = useComplianceDashboardStore()

const filters = computed(() => store.filters)
const hasActiveFilters = computed(() => store.hasActiveFilters)
const activeFilterCount = computed(() => store.activeFilterCount)
const isExpanded = computed(() => store.isFilterPanelExpanded)

const setFilter = (key: string, value: any) => {
  store.setFilter(key as any, value)
}

const handleReset = () => {
  store.resetFilters()
}

const togglePanel = () => {
  store.toggleFilterPanel()
}
</script>

<style scoped>
.compliance-dashboard-filters {
  transition: all 0.3s ease;
}

/* Custom button styles */
button {
  font-weight: 500;
}

/* Smooth transitions for filter buttons */
button[class*="px-3"] {
  transition: all 0.2s ease;
}
</style>
