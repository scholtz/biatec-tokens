<template>
  <Card variant="glass" padding="lg">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <i class="pi pi-wallet text-2xl text-indigo-400"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-white">Wallet Diagnostics</h3>
            <p class="text-sm text-gray-400">Compatibility & UX assessment</p>
          </div>
        </div>
        
        <!-- Overall Status Badge -->
        <Badge
          v-if="diagnostics"
          :variant="
            diagnostics.overallStatus === 'pass' ? 'success' :
            diagnostics.overallStatus === 'warn' ? 'warning' :
            'error'
          "
          size="lg"
        >
          {{ diagnostics.overallStatus.toUpperCase() }}
        </Badge>
      </div>

      <!-- Loading State -->
      <div v-if="!diagnostics" class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-3xl text-gray-500 mb-2"></i>
        <p class="text-sm text-gray-400">Loading diagnostics...</p>
      </div>

      <!-- Diagnostics List -->
      <div v-else class="space-y-3">
        <div
          v-for="item in diagnostics.diagnostics"
          :key="item.id"
          :class="[
            'border rounded-lg p-4 transition-all',
            item.status === 'pass' ? 'bg-green-500/10 border-green-500/30' :
            item.status === 'warn' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-red-500/10 border-red-500/30',
            item.deepLink ? 'cursor-pointer hover:scale-[1.02]' : ''
          ]"
          @click="item.deepLink && $emit('navigate', item.deepLink)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <!-- Status Icon & Name -->
              <div class="flex items-center gap-2 mb-2">
                <i
                  :class="[
                    'pi text-lg',
                    item.status === 'pass' ? 'pi-check-circle text-green-400' :
                    item.status === 'warn' ? 'pi-exclamation-triangle text-yellow-400' :
                    'pi-times-circle text-red-400'
                  ]"
                ></i>
                <span class="text-sm font-semibold text-white">{{ item.name }}</span>
                <Badge
                  :variant="item.status === 'pass' ? 'success' : item.status === 'warn' ? 'warning' : 'error'"
                  size="sm"
                >
                  {{ item.status }}
                </Badge>
              </div>

              <!-- Description -->
              <p class="text-sm text-gray-300 mb-2">{{ item.description }}</p>

              <!-- Remediation Hint (for warn/fail) -->
              <div
                v-if="item.remediationHint"
                class="text-xs bg-white/5 border border-white/10 rounded p-2 mt-2"
              >
                <span class="font-medium text-blue-400">Fix: </span>
                <span class="text-gray-300">{{ item.remediationHint }}</span>
              </div>

              <!-- Category & Last Checked -->
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                  <i class="pi pi-tag"></i>
                  {{ item.category }}
                </span>
                <span class="flex items-center gap-1">
                  <i class="pi pi-clock"></i>
                  {{ formatTimestamp(item.lastChecked) }}
                </span>
              </div>
            </div>

            <!-- Arrow Icon (if clickable) -->
            <i v-if="item.deepLink" class="pi pi-arrow-right text-gray-400"></i>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-400">{{ passCount }}</div>
            <div class="text-xs text-gray-400">Passing</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-yellow-400">{{ warnCount }}</div>
            <div class="text-xs text-gray-400">Warnings</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-400">{{ failCount }}</div>
            <div class="text-xs text-gray-400">Failing</div>
          </div>
        </div>

        <!-- Next Check -->
        <div v-if="diagnostics.nextCheck" class="text-xs text-gray-500 text-center">
          Next check: {{ formatDate(diagnostics.nextCheck) }}
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WalletDiagnostics } from '../../types/lifecycleCockpit'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'

const props = defineProps<{
  diagnostics: WalletDiagnostics | null
}>()

defineEmits<{
  navigate: [deepLink: string]
}>()

const passCount = computed(() => 
  props.diagnostics?.diagnostics.filter(d => d.status === 'pass').length ?? 0
)

const warnCount = computed(() => 
  props.diagnostics?.diagnostics.filter(d => d.status === 'warn').length ?? 0
)

const failCount = computed(() => 
  props.diagnostics?.diagnostics.filter(d => d.status === 'fail').length ?? 0
)

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  return `${Math.floor(hours / 24)}d ago`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>
