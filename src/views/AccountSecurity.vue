<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <i class="pi pi-shield text-white text-2xl"></i>
            </div>
            <div>
              <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Account Security Center</h1>
              <p class="text-gray-400 text-lg mt-1">Manage recovery, monitor activity, and maintain audit compliance</p>
            </div>
          </div>
        </div>

        <!-- Account Recovery Panel -->
        <Card variant="glass" class="mb-8">
          <template #header>
            <div class="flex items-center gap-3">
              <i class="pi pi-key text-blue-500 text-xl"></i>
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Account Recovery</h2>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-gray-300 text-base">
              Your account uses self-custody security, meaning you maintain complete control of your private keys.
              Recovery options are available to help you regain access if needed.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div
                v-for="option in recoveryOptions"
                :key="option.id"
                class="glass-effect rounded-xl p-6 border border-white/10 transition-all duration-200"
                :class="option.available ? 'hover:border-blue-500/50 hover:shadow-lg' : 'opacity-60'"
              >
                <h3 class="text-lg font-semibold text-white mb-2">{{ option.title }}</h3>
                <p class="text-gray-400 text-sm mb-4">{{ option.description }}</p>
                <Button
                  :variant="option.available ? 'primary' : 'secondary'"
                  size="sm"
                  :disabled="!option.available"
                  @click="handleRecoveryAction(option)"
                  fullWidth
                >
                  {{ option.actionLabel }}
                </Button>
              </div>
            </div>

            <div class="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div class="flex items-start gap-3">
                <i class="pi pi-info-circle text-blue-400 mt-1"></i>
                <div class="text-sm text-gray-300">
                  <strong class="text-white">Important:</strong> Your private keys are encrypted with your password and never leave your device.
                  Email recovery allows you to reset your password and regain access, but always keep a secure backup of your seed phrase.
                </div>
              </div>
            </div>
          </div>
        </Card>

        <!-- Account Activity Timeline -->
        <Card variant="glass" class="mb-8">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i class="pi pi-history text-purple-500 text-xl"></i>
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Account Activity</h2>
              </div>
              <div class="flex items-center gap-2">
                <select
                  v-model="activityFilter"
                  @change="handleActivityFilterChange"
                  class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Events</option>
                  <option value="login">Login Events</option>
                  <option value="logout">Logout Events</option>
                  <option value="network_switch">Network Changes</option>
                  <option value="token_deployment_success">Successful Deployments</option>
                  <option value="token_deployment_failure">Failed Deployments</option>
                  <option value="plan_change">Plan Changes</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="refreshActivity"
                  :loading="securityStore.isLoadingActivity"
                >
                  <template #icon>
                    <i class="pi pi-refresh"></i>
                  </template>
                </Button>
              </div>
            </div>
          </template>

          <div v-if="securityStore.activityError" class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
            <div class="flex items-start gap-3">
              <i class="pi pi-exclamation-triangle text-yellow-400"></i>
              <div class="text-sm text-gray-300">
                {{ securityStore.activityError }}
              </div>
            </div>
          </div>

          <div v-if="securityStore.isLoadingActivity && filteredActivity.length === 0" class="text-center py-12">
            <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-gray-400">Loading activity...</p>
          </div>

          <div v-else-if="filteredActivity.length === 0" class="text-center py-12">
            <i class="pi pi-inbox text-gray-500 text-5xl mb-4"></i>
            <p class="text-gray-400 text-lg">No activity events found</p>
            <p class="text-gray-500 text-sm mt-2">Activity will appear here as you use the platform</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="event in displayedActivity"
              :key="event.id"
              class="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                :class="getEventIconClasses(event.type, event.status)"
              >
                <i :class="getEventIcon(event.type)"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h4 class="text-white font-medium">{{ event.description }}</h4>
                    <div class="flex items-center gap-2 mt-1">
                      <Badge :variant="getStatusVariant(event.status)" size="sm">
                        {{ event.status }}
                      </Badge>
                      <span class="text-gray-500 text-xs">{{ formatTimestamp(event.timestamp) }}</span>
                    </div>
                  </div>
                  <button
                    v-if="event.metadata"
                    @click="toggleEventDetails(event.id)"
                    class="text-gray-400 hover:text-white transition-colors"
                  >
                    <i :class="expandedEvents.has(event.id) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                  </button>
                </div>
                <div v-if="expandedEvents.has(event.id) && event.metadata" class="mt-3 p-3 bg-black/20 rounded border border-white/10">
                  <div class="text-xs space-y-1">
                    <div v-if="event.metadata.network" class="flex justify-between">
                      <span class="text-gray-500">Network:</span>
                      <span class="text-gray-300">{{ event.metadata.network }}</span>
                    </div>
                    <div v-if="event.metadata.correlationId" class="flex justify-between">
                      <span class="text-gray-500">Correlation ID:</span>
                      <span class="text-gray-300 font-mono text-xs">{{ event.metadata.correlationId }}</span>
                    </div>
                    <div v-if="event.metadata.errorMessage" class="flex justify-between">
                      <span class="text-gray-500">Error:</span>
                      <span class="text-red-300">{{ event.metadata.errorMessage }}</span>
                    </div>
                    <div v-if="event.metadata.tokenStandard" class="flex justify-between">
                      <span class="text-gray-500">Token Standard:</span>
                      <span class="text-gray-300">{{ event.metadata.tokenStandard }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <template #footer v-if="filteredActivity.length > displayLimit">
            <div class="text-center">
              <Button
                variant="ghost"
                @click="loadMoreActivity"
              >
                Load More ({{ filteredActivity.length - displayLimit }} remaining)
              </Button>
            </div>
          </template>
        </Card>

        <!-- Transaction History -->
        <Card variant="glass" class="mb-8">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i class="pi pi-list text-green-500 text-xl"></i>
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Transaction History</h2>
              </div>
              <div class="flex items-center gap-2">
                <select
                  v-model="txNetworkFilter"
                  @change="handleTransactionFilterChange"
                  class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="all">All Networks</option>
                  <option value="algorand-mainnet">Algorand Mainnet</option>
                  <option value="algorand-testnet">Algorand Testnet</option>
                  <option value="voi">VOI Network</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="refreshTransactions"
                  :loading="securityStore.isLoadingTransactions"
                >
                  <template #icon>
                    <i class="pi pi-refresh"></i>
                  </template>
                </Button>
              </div>
            </div>
          </template>

          <div v-if="securityStore.transactionError" class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div class="flex items-start gap-3">
              <i class="pi pi-info-circle text-blue-400"></i>
              <div class="text-sm text-gray-300">
                {{ securityStore.transactionError }}
              </div>
            </div>
          </div>

          <div v-else-if="securityStore.isLoadingTransactions" class="text-center py-12">
            <div class="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-gray-400">Loading transactions...</p>
          </div>

          <div v-else class="text-center py-12">
            <i class="pi pi-database text-gray-500 text-5xl mb-4"></i>
            <p class="text-gray-400 text-lg">Transaction history will be available soon</p>
            <p class="text-gray-500 text-sm mt-2">We're building comprehensive transaction tracking for all supported networks</p>
          </div>
        </Card>

        <!-- Audit Trail Export -->
        <Card variant="glass">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i class="pi pi-download text-orange-500 text-xl"></i>
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Audit Trail Export</h2>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-gray-300 text-base">
              Export your complete activity and transaction history for compliance, reporting, or backup purposes.
              Exports include timestamps, event details, and correlation IDs for full auditability.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 class="text-white font-medium mb-2">Export as JSON</h3>
                <p class="text-gray-400 text-sm mb-4">
                  Machine-readable format with complete event metadata, ideal for programmatic processing and integration.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  @click="handleExport('json')"
                  :loading="securityStore.isExporting"
                  :disabled="filteredActivity.length === 0"
                  fullWidth
                >
                  <template #icon>
                    <i class="pi pi-file"></i>
                  </template>
                  Export JSON
                </Button>
              </div>

              <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 class="text-white font-medium mb-2">Export as CSV</h3>
                <p class="text-gray-400 text-sm mb-4">
                  Spreadsheet-compatible format for easy analysis, sharing with your team, or importing into other tools.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  @click="handleExport('csv')"
                  :loading="securityStore.isExporting"
                  :disabled="filteredActivity.length === 0"
                  fullWidth
                >
                  <template #icon>
                    <i class="pi pi-table"></i>
                  </template>
                  Export CSV
                </Button>
              </div>
            </div>

            <div class="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div class="flex items-start gap-3">
                <i class="pi pi-shield text-purple-400 mt-1"></i>
                <div class="text-sm text-gray-300">
                  <strong class="text-white">Compliance Ready:</strong> All exports include ISO 8601 timestamps, event correlation IDs,
                  and complete audit trails that meet regulatory requirements. Your data remains private and is never shared with third parties.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Recovery Modal (placeholder) -->
    <Modal :show="showRecoveryModal" @close="showRecoveryModal = false">
      <template #header>
        <h3 class="text-xl font-semibold text-white">Account Recovery</h3>
      </template>
      <div class="space-y-4">
        <p class="text-gray-300">
          Recovery functionality for <strong class="text-white">{{ selectedRecovery?.title }}</strong> will guide you through the process
          of regaining access to your account.
        </p>
        <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p class="text-sm text-gray-300">
            This feature is ready for backend integration. When the recovery API is available, users will be able to:
          </p>
          <ul class="list-disc list-inside text-sm text-gray-400 mt-2 space-y-1">
            <li>Request recovery emails with secure time-limited tokens</li>
            <li>Verify identity through multiple authentication factors</li>
            <li>Reset passwords while maintaining wallet security</li>
            <li>Access and backup seed phrases with proper authorization</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showRecoveryModal = false">
            Close
          </Button>
        </div>
      </template>
    </Modal>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSecurityStore, ActivityEventType, type RecoveryOption, type ExportFormat } from '../stores/security'
import { telemetryService } from '../services/TelemetryService'
import MainLayout from '../layout/MainLayout.vue'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import Badge from '../components/ui/Badge.vue'
import Modal from '../components/ui/Modal.vue'

// Store
const securityStore = useSecurityStore()

// State
const activityFilter = ref<string>('all')
const txNetworkFilter = ref<string>('all')
const displayLimit = ref(20)
const expandedEvents = ref<Set<string>>(new Set())
const showRecoveryModal = ref(false)
const selectedRecovery = ref<RecoveryOption | null>(null)

// Computed
const recoveryOptions = computed(() => securityStore.getRecoveryOptions())

const filteredActivity = computed(() => {
  if (activityFilter.value === 'all') {
    return securityStore.activityEvents
  }
  return securityStore.activityEvents.filter(event => event.type === activityFilter.value)
})

const displayedActivity = computed(() => {
  return filteredActivity.value.slice(0, displayLimit.value)
})

// Methods
function getEventIcon(type: ActivityEventType): string {
  const icons: Record<ActivityEventType, string> = {
    [ActivityEventType.LOGIN]: 'pi pi-sign-in',
    [ActivityEventType.LOGOUT]: 'pi pi-sign-out',
    [ActivityEventType.NETWORK_SWITCH]: 'pi pi-sync',
    [ActivityEventType.TOKEN_DEPLOYMENT_SUCCESS]: 'pi pi-check-circle',
    [ActivityEventType.TOKEN_DEPLOYMENT_FAILURE]: 'pi pi-times-circle',
    [ActivityEventType.PLAN_CHANGE]: 'pi pi-shopping-cart',
    [ActivityEventType.WALLET_CONNECT]: 'pi pi-wallet',
    [ActivityEventType.WALLET_DISCONNECT]: 'pi pi-power-off',
    [ActivityEventType.SECURITY_CENTER_VIEWED]: 'pi pi-eye',
    [ActivityEventType.RECOVERY_STARTED]: 'pi pi-key',
    [ActivityEventType.AUDIT_EXPORT_STARTED]: 'pi pi-download',
    [ActivityEventType.AUDIT_EXPORT_COMPLETED]: 'pi pi-check',
  }
  return icons[type] || 'pi pi-info-circle'
}

function getEventIconClasses(_type: ActivityEventType, status: string): string {
  if (status === 'failure') {
    return 'bg-red-500/20 text-red-400'
  }
  if (status === 'success') {
    return 'bg-green-500/20 text-green-400'
  }
  if (status === 'pending') {
    return 'bg-yellow-500/20 text-yellow-400'
  }
  return 'bg-blue-500/20 text-blue-400'
}

function getStatusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const variants: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    success: 'success',
    failure: 'error',
    pending: 'warning',
    info: 'info',
  }
  return variants[status] || 'default'
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    
    // Use invariant culture format: DD. MM. YYYY, HH:MM
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}. ${month}. ${year}, ${hours}:${minutes}`
  } catch {
    return 'Invalid Date'
  }
}

function toggleEventDetails(eventId: string): void {
  if (expandedEvents.value.has(eventId)) {
    expandedEvents.value.delete(eventId)
  } else {
    expandedEvents.value.add(eventId)
  }
}

function handleActivityFilterChange(): void {
  telemetryService.trackActivityFilterApplied({
    filterType: 'activity',
    filterValue: activityFilter.value,
  })
}

function handleTransactionFilterChange(): void {
  telemetryService.trackActivityFilterApplied({
    filterType: 'transaction_network',
    filterValue: txNetworkFilter.value,
  })
  securityStore.fetchTransactionHistory({ network: txNetworkFilter.value !== 'all' ? txNetworkFilter.value : undefined })
}

async function refreshActivity(): Promise<void> {
  await securityStore.fetchActivityEvents(true)
}

async function refreshTransactions(): Promise<void> {
  await securityStore.fetchTransactionHistory({ network: txNetworkFilter.value !== 'all' ? txNetworkFilter.value : undefined })
}

function loadMoreActivity(): void {
  displayLimit.value += 20
}

function handleRecoveryAction(option: RecoveryOption): void {
  if (!option.available) return
  
  selectedRecovery.value = option
  showRecoveryModal.value = true
  
  telemetryService.trackRecoveryStarted({
    recoveryType: option.id,
  })
  
  securityStore.addActivityEvent({
    type: ActivityEventType.RECOVERY_STARTED,
    timestamp: new Date().toISOString(),
    description: `Started ${option.title} process`,
    status: 'info',
    metadata: {
      recoveryType: option.id,
    },
  })
}

async function handleExport(format: ExportFormat): Promise<void> {
  const startTime = Date.now()
  
  telemetryService.trackAuditExportStarted({ format })
  
  securityStore.addActivityEvent({
    type: ActivityEventType.AUDIT_EXPORT_STARTED,
    timestamp: new Date().toISOString(),
    description: `Started audit trail export as ${format.toUpperCase()}`,
    status: 'pending',
    metadata: { format },
  })
  
  try {
    await securityStore.exportAuditTrail(format)
    
    const durationMs = Date.now() - startTime
    telemetryService.trackAuditExportCompleted({
      format,
      durationMs,
      recordCount: filteredActivity.value.length,
    })
  } catch (error) {
    console.error('Export failed:', error)
    securityStore.addActivityEvent({
      type: ActivityEventType.AUDIT_EXPORT_COMPLETED,
      timestamp: new Date().toISOString(),
      description: `Failed to export audit trail as ${format.toUpperCase()}`,
      status: 'failure',
      metadata: {
        format,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  }
}

// Lifecycle
onMounted(async () => {
  // Track security center view
  telemetryService.trackSecurityCenterViewed()
  
  securityStore.addActivityEvent({
    type: ActivityEventType.SECURITY_CENTER_VIEWED,
    timestamp: new Date().toISOString(),
    description: 'Viewed Account Security Center',
    status: 'info',
  })
  
  // Load activity and transaction data
  await Promise.all([
    securityStore.fetchActivityEvents(),
    securityStore.fetchTransactionHistory(),
  ])
})
</script>

<style scoped>
/* Additional custom styles if needed */
.glass-effect {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}
</style>
