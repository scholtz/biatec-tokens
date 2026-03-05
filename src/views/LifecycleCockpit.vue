<template>
  <main id="main-content" role="main" class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-4xl font-bold text-white mb-2">
              Token Lifecycle Cockpit
            </h1>
            <p class="text-xl text-gray-300">
              Competitive intelligence and operational command center
            </p>
          </div>
          
          <!-- Role Selector (for demo/testing) -->
          <div class="flex items-center gap-4">
            <select
              v-model="selectedRole"
              @change="handleRoleChange"
              class="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="issuer_admin">Issuer Admin</option>
              <option value="compliance">Compliance</option>
              <option value="operations">Operations</option>
              <option value="treasury">Treasury</option>
            </select>
            
            <Button
              @click="handleRefresh"
              variant="ghost"
              size="sm"
              :disabled="cockpitStore.isLoading"
            >
              <i :class="['pi pi-refresh mr-2', cockpitStore.isLoading ? 'animate-spin' : '']"></i>
              Refresh
            </Button>
          </div>
        </div>
        
        <!-- Last Updated -->
        <div v-if="cockpitStore.lastRefresh" class="text-sm text-gray-400">
          Last updated: {{ formatTimestamp(cockpitStore.lastRefresh) }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="cockpitStore.isLoading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-5xl text-blue-500 mb-4"></i>
          <p class="text-xl text-gray-300">Loading cockpit data...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="cockpitStore.error" class="glass-effect rounded-2xl p-8 text-center">
        <i class="pi pi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
        <h3 class="text-2xl font-bold text-white mb-2">Failed to Load Cockpit</h3>
        <p class="text-gray-400 mb-6">{{ cockpitStore.error }}</p>
        <Button @click="handleRefresh" variant="primary">
          Try Again
        </Button>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Launch Readiness & Telemetry Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Readiness Status Widget -->
          <ReadinessStatusWidget
            v-if="cockpitStore.rolePermissions.canViewReadiness"
            :status="cockpitStore.readinessStatus"
            @navigate="handleNavigate"
          />
          
          <!-- Telemetry Summary Widget -->
          <TelemetrySummaryWidget
            v-if="cockpitStore.rolePermissions.canViewTelemetry"
            :telemetry="cockpitStore.telemetry"
          />
        </div>

        <!-- Guided Actions Widget (Full Width) -->
        <GuidedActionsWidget
          v-if="cockpitStore.rolePermissions.canViewActions"
          :actions="cockpitStore.prioritizedActions"
          :can-complete="cockpitStore.rolePermissions.canCompleteActions"
          @action-selected="handleActionSelected"
          @action-completed="handleActionCompleted"
          @navigate="handleNavigate"
        />

        <!-- Wallet Diagnostics & Risk Indicators Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Wallet Diagnostics Widget -->
          <WalletDiagnosticsWidget
            v-if="cockpitStore.rolePermissions.canViewWalletDiagnostics"
            :diagnostics="cockpitStore.walletDiagnostics"
            @navigate="handleNavigate"
          />
          
          <!-- Risk Indicators Widget -->
          <RiskIndicatorsWidget
            v-if="cockpitStore.rolePermissions.canViewRiskIndicators"
            :indicators="cockpitStore.riskIndicators"
            @navigate="handleNavigate"
          />
        </div>

        <!-- Evidence Links Widget (if visible) -->
        <EvidenceLinksWidget
          v-if="cockpitStore.rolePermissions.canViewEvidence"
          :traces="cockpitStore.evidenceTraces"
          @evidence-viewed="handleEvidenceViewed"
        />

        <!-- Activity Timeline Widget (Full Width) -->
        <TimelineWidget
          :timeline="cockpitStore.timeline"
          @navigate="handleNavigate"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLifecycleCockpitStore } from '../stores/lifecycleCockpit'
import type { UserRole } from '../types/lifecycleCockpit'
import { dispatchCockpitEvent } from '../utils/cockpitAnalytics'
import { useAuthStore } from '../stores/auth'
import Button from '../components/ui/Button.vue'
import ReadinessStatusWidget from '../components/lifecycleCockpit/ReadinessStatusWidget.vue'
import TelemetrySummaryWidget from '../components/lifecycleCockpit/TelemetrySummaryWidget.vue'
import GuidedActionsWidget from '../components/lifecycleCockpit/GuidedActionsWidget.vue'
import WalletDiagnosticsWidget from '../components/lifecycleCockpit/WalletDiagnosticsWidget.vue'
import RiskIndicatorsWidget from '../components/lifecycleCockpit/RiskIndicatorsWidget.vue'
import EvidenceLinksWidget from '../components/lifecycleCockpit/EvidenceLinksWidget.vue'
import TimelineWidget from '../components/lifecycleCockpit/TimelineWidget.vue'

const router = useRouter()
const cockpitStore = useLifecycleCockpitStore()
const authStore = useAuthStore()
const selectedRole = ref<UserRole>('issuer_admin')

/** Anonymised user identifier for analytics (never exposes raw address/email) */
const anonymousUserId = (): string => {
  const raw = authStore.account ?? 'anonymous'
  // Simple hash-like truncation — in production use a proper anonymisation layer
  return `u_${raw.slice(0, 8)}`
}

onMounted(async () => {
  // Track page view via privacy-safe utility
  dispatchCockpitEvent('page_view', anonymousUserId())
  
  // Initialize cockpit data
  await cockpitStore.initialize()
})

function handleRoleChange() {
  cockpitStore.setUserRole(selectedRole.value)
  // role_changed is not in the CockpitAnalyticsEvent schema; log locally only
  console.log('[Cockpit] role_changed', { role: selectedRole.value })
}

async function handleRefresh() {
  await cockpitStore.refresh()
  dispatchCockpitEvent('page_view', anonymousUserId(), { refreshed: true })
}

function handleNavigate(deepLink: string) {
  if (deepLink.startsWith('/')) {
    router.push(deepLink)
  } else if (deepLink.startsWith('http')) {
    window.open(deepLink, '_blank')
  }
}

function handleActionSelected(actionId: string) {
  dispatchCockpitEvent('action_selected', anonymousUserId(), { actionId })
}

function handleActionCompleted(actionId: string) {
  cockpitStore.updateActionStatus(actionId, 'completed')
  dispatchCockpitEvent('action_completed', anonymousUserId(), { actionId })
}

function handleEvidenceViewed(evidenceId: string) {
  dispatchCockpitEvent('evidence_viewed', anonymousUserId(), { evidenceId })
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}
</script>
