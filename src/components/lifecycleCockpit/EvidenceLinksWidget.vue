<template>
  <Card variant="glass" padding="lg">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
            <i class="pi pi-file text-2xl text-gray-400"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-white">Evidence Traceability</h3>
            <p class="text-sm text-gray-400">Compliance documentation links</p>
          </div>
        </div>
      </div>

      <!-- No Evidence State -->
      <div v-if="traces.length === 0" class="text-center py-8">
        <i class="pi pi-info-circle text-4xl text-gray-500 mb-2"></i>
        <p class="text-sm text-gray-400">No evidence traces available</p>
      </div>

      <!-- Evidence Traces -->
      <div v-else class="space-y-3">
        <div
          v-for="trace in traces"
          :key="trace.signalId"
          class="bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <!-- Signal Info -->
          <div class="flex items-center gap-2 mb-3">
            <Badge
              :variant="
                trace.signalType === 'blocker' ? 'error' :
                trace.signalType === 'warning' ? 'warning' :
                trace.signalType === 'risk' ? 'warning' :
                'default'
              "
              size="sm"
            >
              {{ trace.signalType }}
            </Badge>
            <span class="text-sm text-gray-400">Signal ID: {{ trace.signalId }}</span>
          </div>

          <!-- Evidence References -->
          <div class="space-y-2">
            <div class="text-xs text-gray-500 mb-2">Evidence References:</div>
            <div
              v-for="ref in trace.evidenceRefs"
              :key="ref.id"
              class="bg-white/5 border border-white/10 rounded p-3 hover:bg-white/10 transition-colors cursor-pointer"
              @click="handleEvidenceClick(ref)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <i
                      :class="[
                        'pi text-sm',
                        ref.type === 'document' ? 'pi-file-pdf text-red-400' :
                        ref.type === 'transaction' ? 'pi-receipt text-blue-400' :
                        ref.type === 'attestation' ? 'pi-shield-check text-green-400' :
                        'pi-list text-gray-400'
                      ]"
                    ></i>
                    <span class="text-sm font-medium text-white">{{ ref.title }}</span>
                  </div>
                  
                  <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span>{{ formatType(ref.type) }}</span>
                    <span>•</span>
                    <span>{{ formatTimestamp(ref.timestamp) }}</span>
                    <span v-if="ref.provider">•</span>
                    <span v-if="ref.provider">{{ ref.provider }}</span>
                  </div>
                </div>
                
                <i class="pi pi-external-link text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { EvidenceTrace, EvidenceReference } from '../../types/lifecycleCockpit'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'

defineProps<{
  traces: EvidenceTrace[]
}>()

const emit = defineEmits<{
  'evidence-viewed': [evidenceId: string]
}>()

function handleEvidenceClick(ref: EvidenceReference) {
  emit('evidence-viewed', ref.id)
  
  // Open evidence URL
  if (ref.url.startsWith('/')) {
    // Internal route
    window.location.href = ref.url
  } else {
    // External link
    window.open(ref.url, '_blank')
  }
}

function formatType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>
