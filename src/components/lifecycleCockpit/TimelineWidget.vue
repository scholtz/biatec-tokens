<template>
  <Card variant="glass" padding="lg">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <i class="pi pi-history text-2xl text-indigo-400" aria-hidden="true"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-white">Activity Timeline</h3>
            <p class="text-sm text-gray-400">Recent token-affecting actions</p>
          </div>
        </div>

        <!-- Entry count badge -->
        <Badge v-if="timeline && timeline.totalCount > 0" variant="default" size="sm">
          {{ timeline.totalCount }} event{{ timeline.totalCount !== 1 ? 's' : '' }}
        </Badge>
      </div>

      <!-- Loading state -->
      <div v-if="!timeline" class="text-center py-8" aria-live="polite">
        <i class="pi pi-spin pi-spinner text-3xl text-gray-500 mb-2" aria-hidden="true"></i>
        <p class="text-sm text-gray-400">Loading timeline...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="timeline.entries.length === 0" class="text-center py-8">
        <i class="pi pi-clock text-4xl text-gray-500 mb-2" aria-hidden="true"></i>
        <p class="text-sm text-gray-400">No activity recorded yet</p>
        <p class="text-xs text-gray-500 mt-1">Actions will appear here after token operations begin</p>
      </div>

      <!-- Timeline entries grouped by date -->
      <div v-else class="space-y-4" role="feed" aria-label="Token activity timeline">
        <div
          v-for="group in groupedEntries"
          :key="group.dateLabel"
        >
          <!-- Date separator -->
          <div class="flex items-center gap-3 mb-3">
            <div class="h-px flex-1 bg-gray-700" aria-hidden="true"></div>
            <span class="text-xs text-gray-500 font-medium">{{ group.dateLabel }}</span>
            <div class="h-px flex-1 bg-gray-700" aria-hidden="true"></div>
          </div>

          <!-- Entries for this date -->
          <div class="space-y-2">
            <article
              v-for="entry in group.entries"
              :key="entry.id"
              class="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              :class="{ 'cursor-pointer': !!entry.deepLink }"
              @click="entry.deepLink && $emit('navigate', entry.deepLink)"
              :aria-label="`${entry.title} by ${formatActor(entry.actor)} — ${formatTimeFull(entry.timestamp)}`"
            >
              <!-- Category icon -->
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10 mt-0.5"
                :title="categoryMeta(entry.category).label"
                aria-hidden="true"
              >
                <i
                  :class="[categoryMeta(entry.category).icon, categoryMeta(entry.category).colour, 'text-sm']"
                ></i>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-medium text-white truncate">{{ entry.title }}</p>
                  <time
                    :datetime="entry.timestamp.toISOString()"
                    :title="formatTimeFull(entry.timestamp)"
                    class="text-xs text-gray-500 flex-shrink-0 mt-0.5"
                  >
                    {{ formatTime(entry.timestamp) }}
                  </time>
                </div>

                <!-- Impact summary -->
                <p class="text-xs text-gray-400 mt-0.5 line-clamp-2">{{ entry.impactSummary }}</p>

                <!-- Actor -->
                <div class="flex items-center gap-2 mt-1.5">
                  <i class="pi pi-user text-xs text-gray-600" aria-hidden="true"></i>
                  <span class="text-xs text-gray-500">{{ formatActor(entry.actor) }}</span>
                  <span v-if="entry.deepLink" class="text-xs text-indigo-400 flex items-center gap-1 ml-auto">
                    View <i class="pi pi-arrow-right text-[10px]" aria-hidden="true"></i>
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- Truncation notice -->
        <p v-if="timeline.isTruncated" class="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
          Showing {{ timeline.entries.length }} of {{ timeline.totalCount }} events
        </p>
      </div>

      <!-- Last updated footer -->
      <div v-if="timeline" class="text-xs text-gray-600 text-center border-t border-gray-700 pt-3">
        Last updated: {{ formatTimeFull(timeline.lastUpdated) }}
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TimelineData, TimelineEventCategory } from '../../types/lifecycleCockpit'
import {
  formatTimelineTimestamp,
  formatTimelineTimestampFull,
  formatActorDisplay,
  getCategoryMeta,
  groupEntriesByDate,
} from '../../utils/cockpitTimeline'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'

const props = defineProps<{
  timeline: TimelineData | null
}>()

defineEmits<{
  navigate: [deepLink: string]
}>()

const groupedEntries = computed(() => {
  if (!props.timeline) return []
  return groupEntriesByDate(props.timeline.entries)
})

function formatTime(date: Date): string {
  return formatTimelineTimestamp(date)
}

function formatTimeFull(date: Date): string {
  return formatTimelineTimestampFull(date)
}

function formatActor(actor: string): string {
  return formatActorDisplay(actor)
}

function categoryMeta(category: TimelineEventCategory) {
  return getCategoryMeta(category)
}
</script>
