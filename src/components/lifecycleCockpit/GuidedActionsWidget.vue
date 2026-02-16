<template>
  <Card variant="glass" padding="lg">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <i class="pi pi-list-check text-2xl text-green-400"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-white">Guided Next Actions</h3>
            <p class="text-sm text-gray-400">Prioritized action queue</p>
          </div>
        </div>
        
        <!-- Critical Count Badge -->
        <Badge v-if="criticalCount > 0" variant="error" size="lg">
          {{ criticalCount }} Critical
        </Badge>
      </div>

      <!-- No Actions State -->
      <div v-if="actions.length === 0" class="text-center py-8">
        <i class="pi pi-check-circle text-5xl text-green-500 mb-2"></i>
        <p class="text-lg text-white font-semibold">All caught up!</p>
        <p class="text-sm text-gray-400 mt-1">No pending actions at this time</p>
      </div>

      <!-- Actions List -->
      <div v-else class="space-y-3">
        <div
          v-for="action in displayedActions"
          :key="action.id"
          :class="[
            'border rounded-lg p-4 transition-all cursor-pointer hover:scale-[1.02]',
            action.priority === 'critical' ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' :
            action.priority === 'high' ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20' :
            action.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20' :
            'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
          ]"
          @click="handleActionClick(action)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <!-- Priority Badge & Title -->
              <div class="flex items-center gap-2 mb-2">
                <Badge
                  :variant="
                    action.priority === 'critical' ? 'error' :
                    action.priority === 'high' ? 'warning' :
                    action.priority === 'medium' ? 'warning' :
                    'default'
                  "
                  size="sm"
                >
                  {{ action.priority }}
                </Badge>
                <span class="text-sm font-semibold text-white">{{ action.title }}</span>
              </div>

              <!-- Description -->
              <p class="text-sm text-gray-300 mb-2">{{ action.description }}</p>

              <!-- Rationale -->
              <div class="text-xs text-gray-400 mb-2">
                <span class="font-medium">Why:</span> {{ action.rationale }}
              </div>

              <!-- Expected Impact -->
              <div class="text-xs text-gray-400 mb-3">
                <span class="font-medium">Impact:</span> {{ action.expectedImpact }}
              </div>

              <!-- Meta Info -->
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span v-if="action.estimatedTime" class="flex items-center gap-1">
                  <i class="pi pi-clock"></i>
                  {{ action.estimatedTime }}
                </span>
                <span v-if="action.assignedRole" class="flex items-center gap-1">
                  <i class="pi pi-user"></i>
                  {{ formatRole(action.assignedRole) }}
                </span>
                <span class="flex items-center gap-1">
                  <i class="pi pi-tag"></i>
                  {{ action.category }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-2">
              <button
                @click.stop="$emit('navigate', action.deepLink)"
                class="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>View</span>
                <i class="pi pi-arrow-right"></i>
              </button>
              
              <button
                v-if="canComplete"
                @click.stop="handleComplete(action.id)"
                class="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
              >
                Mark Done
              </button>
            </div>
          </div>
        </div>

        <!-- Show More Button -->
        <button
          v-if="actions.length > displayLimit && !showAll"
          @click="showAll = true"
          class="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Show {{ actions.length - displayLimit }} more actions
        </button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GuidedAction } from '../../types/lifecycleCockpit'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'

const props = defineProps<{
  actions: GuidedAction[]
  canComplete: boolean
}>()

const emit = defineEmits<{
  'action-selected': [actionId: string]
  'action-completed': [actionId: string]
  navigate: [deepLink: string]
}>()

const showAll = ref(false)
const displayLimit = 5

const criticalCount = computed(() => 
  props.actions.filter(a => a.priority === 'critical').length
)

const displayedActions = computed(() => 
  showAll.value ? props.actions : props.actions.slice(0, displayLimit)
)

function handleActionClick(action: GuidedAction) {
  emit('action-selected', action.id)
}

function handleComplete(actionId: string) {
  emit('action-completed', actionId)
}

function formatRole(role: string): string {
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
</script>
