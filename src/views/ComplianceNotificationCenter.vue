<template>
  <MainLayout>
    <!-- Skip link (WCAG 2.4.1) -->
    <a
      href="#notification-center-main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>

    <div
      id="notification-center-main"
      role="region"
      aria-label="Compliance Notification Center — prioritized compliance events, timelines, and operator guidance"
      :data-testid="TEST_IDS.ROOT"
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    >
      <div class="max-w-6xl mx-auto">

        <!-- ── Page Header ── -->
        <header class="mb-8">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <BellAlertIcon class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  :data-testid="TEST_IDS.HEADING"
                >
                  Compliance Notification Center
                </h1>
                <p
                  class="text-gray-300 text-sm mt-1"
                  :data-testid="TEST_IDS.DESCRIPTION"
                >
                  Prioritized compliance events, case timelines, and operator guidance.
                  Monitor investor onboarding, sanctions escalations, evidence readiness,
                  and delivery status in one workspace.
                </p>
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end gap-1 mt-1">
              <span
                class="text-xs text-gray-400"
                :data-testid="TEST_IDS.LAST_UPDATED"
                :aria-label="`Data last refreshed: ${formattedRefreshedAt}`"
              >
                Last refreshed: {{ formattedRefreshedAt }}
              </span>
              <button
                class="text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                :data-testid="TEST_IDS.REFRESH_BUTTON"
                @click="handleRefresh"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <!-- ── Loading State ── -->
        <div
          v-if="isLoading"
          :data-testid="TEST_IDS.LOADING_STATE"
          class="flex items-center justify-center py-16"
          role="status"
          aria-live="polite"
        >
          <div class="text-center">
            <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" role="presentation"></div>
            <p class="text-gray-400 text-sm">Loading compliance events…</p>
          </div>
        </div>

        <template v-else>
          <!-- ── Feed Health Banner ── -->
          <div
            v-if="centerState.feedHealth !== 'healthy'"
            :data-testid="TEST_IDS.FEED_HEALTH_BANNER"
            :class="['rounded-lg border px-4 py-3 mb-6', feedHealthBannerClass(centerState.feedHealth)]"
            :role="centerState.feedHealth === 'unavailable' ? 'alert' : 'status'"
            :aria-live="centerState.feedHealth === 'unavailable' ? 'assertive' : 'polite'"
          >
            <div class="flex items-start gap-3">
              <ExclamationTriangleIcon v-if="centerState.feedHealth === 'unavailable'" class="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <InformationCircleIcon v-else class="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-sm font-medium">{{ centerState.feedHealthMessage }}</p>
            </div>
          </div>

          <!-- ── Queue Summary ── -->
          <section
            :data-testid="TEST_IDS.QUEUE_SUMMARY"
            class="mb-8"
            aria-label="Queue summary"
          >
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div
                class="rounded-lg bg-gray-800/60 border border-gray-700 p-4 text-center"
                :data-testid="TEST_IDS.QUEUE_TOTAL"
              >
                <dd class="text-2xl font-bold text-white">{{ centerState.queueSummary.total }}</dd>
                <dt class="text-xs text-gray-400 mt-1">Total Events</dt>
              </div>
              <div
                class="rounded-lg bg-gray-800/60 border border-gray-700 p-4 text-center"
                :data-testid="TEST_IDS.QUEUE_UNREAD"
              >
                <dd class="text-2xl font-bold text-indigo-400">{{ centerState.queueSummary.unread }}</dd>
                <dt class="text-xs text-gray-400 mt-1">Unread</dt>
              </div>
              <div
                class="rounded-lg bg-gray-800/60 border border-gray-700 p-4 text-center"
                :data-testid="TEST_IDS.QUEUE_BLOCKED"
              >
                <dd class="text-2xl font-bold text-red-400">{{ centerState.queueSummary.blocked }}</dd>
                <dt class="text-xs text-gray-400 mt-1">Blocked</dt>
              </div>
              <div
                class="rounded-lg bg-gray-800/60 border border-gray-700 p-4 text-center"
                :data-testid="TEST_IDS.QUEUE_ACTION_NEEDED"
              >
                <dd class="text-2xl font-bold text-orange-400">{{ centerState.queueSummary.actionNeeded }}</dd>
                <dt class="text-xs text-gray-400 mt-1">Action Needed</dt>
              </div>
              <div
                class="rounded-lg bg-gray-800/60 border border-gray-700 p-4 text-center"
                :data-testid="TEST_IDS.QUEUE_WAITING"
              >
                <dd class="text-2xl font-bold text-yellow-400">{{ centerState.queueSummary.waitingOnProvider }}</dd>
                <dt class="text-xs text-gray-400 mt-1">Waiting on Provider</dt>
              </div>
              <div
                class="rounded-lg bg-gray-800/60 border border-gray-700 p-4 text-center"
                :data-testid="TEST_IDS.QUEUE_STALE"
              >
                <dd class="text-2xl font-bold text-amber-400">{{ centerState.queueSummary.staleCount }}</dd>
                <dt class="text-xs text-gray-400 mt-1">Stale</dt>
              </div>
            </div>
          </section>

          <!-- ── Filters ── -->
          <section class="mb-6" aria-label="Event filters">
            <div class="flex flex-wrap gap-3">
              <div>
                <label for="filter-category" class="sr-only">Filter by category</label>
                <select
                  id="filter-category"
                  v-model="filters.category"
                  :data-testid="TEST_IDS.FILTER_CATEGORY"
                  class="rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <option value="all">All Categories</option>
                  <option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </div>
              <div>
                <label for="filter-severity" class="sr-only">Filter by severity</label>
                <select
                  id="filter-severity"
                  v-model="filters.severity"
                  :data-testid="TEST_IDS.FILTER_SEVERITY"
                  class="rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <option value="all">All Severities</option>
                  <option v-for="(label, key) in SEVERITY_LABELS" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </div>
              <div>
                <label for="filter-freshness" class="sr-only">Filter by freshness</label>
                <select
                  id="filter-freshness"
                  v-model="filters.freshness"
                  :data-testid="TEST_IDS.FILTER_FRESHNESS"
                  class="rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <option value="all">All Freshness</option>
                  <option v-for="(label, key) in FRESHNESS_LABELS" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </div>
              <div>
                <label for="filter-read-state" class="sr-only">Filter by read state</label>
                <select
                  id="filter-read-state"
                  v-model="filters.readState"
                  :data-testid="TEST_IDS.FILTER_READ_STATE"
                  class="rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <option value="all">All States</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
          </section>

          <!-- ── Main Content: Events & Timeline ── -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Event List (2/3 width on desktop) -->
            <section
              class="lg:col-span-2"
              aria-label="Compliance events"
            >
              <!-- Empty state -->
              <div
                v-if="filteredEvents.length === 0"
                :data-testid="TEST_IDS.EMPTY_STATE"
                class="rounded-xl bg-gray-800/40 border border-gray-700 p-8 text-center"
                role="status"
                aria-live="polite"
              >
                <InboxIcon class="w-12 h-12 text-gray-500 mx-auto mb-3" aria-hidden="true" />
                <p class="text-gray-300 font-medium mb-1">
                  {{ centerState.feedHealth === 'unavailable' ? 'Event feed unavailable' : 'No matching events' }}
                </p>
                <p class="text-gray-500 text-sm">
                  {{ centerState.feedHealth === 'unavailable'
                    ? 'The compliance event feed is currently unreachable. This does not mean there are no events — it means the system cannot confirm the current state. Contact your administrator.'
                    : 'Try adjusting filters to see more compliance activity, or check back later for new events.'
                  }}
                </p>
              </div>

              <!-- Event items -->
              <ul
                v-else
                :data-testid="TEST_IDS.EVENT_LIST"
                class="space-y-3"
                role="list"
                aria-label="Compliance event list"
              >
                <li
                  v-for="event in filteredEvents"
                  :key="event.id"
                  :data-testid="TEST_IDS.EVENT_ITEM"
                  :class="[
                    'rounded-xl border p-4 transition-all duration-200',
                    event.readState === 'unread'
                      ? 'bg-gray-800/80 border-gray-600 shadow-md'
                      : 'bg-gray-800/40 border-gray-700',
                  ]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <!-- Unread indicator -->
                        <span
                          v-if="event.readState === 'unread'"
                          class="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"
                          aria-label="Unread"
                        ></span>
                        <!-- Severity badge -->
                        <span
                          :data-testid="TEST_IDS.EVENT_SEVERITY_BADGE"
                          :class="['text-xs font-medium rounded-full px-2 py-0.5', severityBadgeClass(event.severity)]"
                          role="status"
                        >
                          {{ SEVERITY_LABELS[event.severity] }}
                        </span>
                        <!-- Category label -->
                        <span class="text-xs text-gray-400">
                          {{ CATEGORY_LABELS[event.category] }}
                        </span>
                        <!-- Launch blocking -->
                        <span
                          v-if="event.isLaunchBlocking"
                          :data-testid="TEST_IDS.EVENT_LAUNCH_BLOCKING"
                          class="text-xs font-semibold text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full"
                          role="alert"
                        >
                          Blocks Issuance
                        </span>
                      </div>
                      <h3 class="text-white font-medium text-sm">{{ event.title }}</h3>
                      <p class="text-gray-400 text-xs mt-1">{{ event.description }}</p>
                      <!-- Next action -->
                      <p v-if="event.nextAction" class="text-indigo-300 text-xs mt-2 font-medium">
                        → {{ event.nextAction }}
                      </p>
                    </div>
                    <div class="flex flex-col items-end gap-2 flex-shrink-0">
                      <span class="text-xs text-gray-500 whitespace-nowrap">
                        {{ formatRelativeTime(event.timestamp) }}
                      </span>
                      <span class="text-xs text-gray-500">{{ event.actor }}</span>
                      <!-- Drill-down link -->
                      <router-link
                        v-if="event.drillDownPath"
                        :to="event.drillDownPath"
                        :data-testid="TEST_IDS.EVENT_DRILL_DOWN"
                        class="text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                        :aria-label="`View details for ${event.title}`"
                      >
                        View details →
                      </router-link>
                    </div>
                  </div>
                </li>
              </ul>
            </section>

            <!-- Timeline Panel (1/3 width on desktop) -->
            <aside
              class="lg:col-span-1"
              aria-label="Event timeline"
            >
              <div class="rounded-xl bg-gray-800/40 border border-gray-700 p-5">
                <h2
                  class="text-white font-semibold text-lg mb-4"
                  :data-testid="TEST_IDS.TIMELINE_ROOT"
                >
                  Event Timeline
                </h2>

                <div v-if="timelineGroups.length === 0" class="text-center py-6">
                  <p class="text-gray-500 text-sm">No timeline events available.</p>
                </div>

                <div v-else class="space-y-6">
                  <div
                    v-for="group in timelineGroups"
                    :key="group.dateKey"
                    :data-testid="TEST_IDS.TIMELINE_GROUP"
                  >
                    <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      {{ group.dateLabel }}
                    </h3>
                    <div class="relative pl-6">
                      <!-- Vertical line -->
                      <div class="absolute left-2 top-0 bottom-0 w-px bg-gray-700" aria-hidden="true"></div>
                      <ul class="space-y-4" role="list">
                        <li
                          v-for="entry in group.entries"
                          :key="entry.id"
                          :data-testid="TEST_IDS.TIMELINE_ENTRY"
                          class="relative"
                        >
                          <!-- Dot -->
                          <div
                            :class="[
                              'absolute -left-4 top-1 w-3 h-3 rounded-full border-2',
                              timelineDotClass(entry.severity),
                            ]"
                            aria-hidden="true"
                          ></div>
                          <div>
                            <p class="text-sm font-medium text-gray-200">{{ entry.transition }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">{{ entry.description }}</p>
                            <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>{{ entry.actor }}</span>
                              <span>·</span>
                              <span>{{ formatRelativeTime(entry.timestamp) }}</span>
                            </div>
                            <p
                              v-if="entry.nextAction"
                              class="text-xs text-indigo-300 mt-1 font-medium"
                            >
                              → {{ entry.nextAction }}
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </template>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * ComplianceNotificationCenter.vue
 *
 * Enterprise compliance notification center providing prioritized events,
 * case timelines, queue health summaries, and drill-down navigation.
 *
 * Fail-closed: degraded/stale/unavailable feed states are explicitly communicated.
 * Accessibility: WCAG 2.1 AA — landmarks, labels, keyboard traversal, aria-live.
 */
import { ref, computed, onMounted, reactive } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import {
  BellAlertIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  InboxIcon,
} from '@heroicons/vue/24/outline'
import {
  NOTIFICATION_CENTER_TEST_IDS as TEST_IDS,
  SEVERITY_LABELS,
  CATEGORY_LABELS,
  FRESHNESS_LABELS,
  DEFAULT_FILTERS,
  buildMockEventsMixed,
  buildMockTimelineEntries,
  deriveNotificationCenterState,
  filterEvents,
  groupTimelineByDate,
  formatRelativeTime,
  severityBadgeClass,
  feedHealthBannerClass,
  type NotificationFilters,
  type EventSeverity,
  type NotificationCenterState,
} from '../utils/complianceNotificationCenter'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const isLoading = ref(true)
const filters = reactive<NotificationFilters>({ ...DEFAULT_FILTERS })

// Simulated refresh timestamp (will be replaced by real API later)
const lastRefreshedAt = ref<string | null>(null)
const centerState = ref<NotificationCenterState>({
  feedHealth: 'unavailable',
  lastRefreshedAt: null,
  events: [],
  queueSummary: {
    total: 0,
    unread: 0,
    blocked: 0,
    actionNeeded: 0,
    waitingOnProvider: 0,
    reviewComplete: 0,
    staleCount: 0,
    oldestUnresolvedDays: 0,
  },
  feedHealthMessage: 'Loading compliance events…',
})

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const formattedRefreshedAt = computed(() => {
  if (!lastRefreshedAt.value) return 'Not available'
  return formatRelativeTime(lastRefreshedAt.value)
})

const filteredEvents = computed(() => filterEvents(centerState.value.events, filters))

const timelineGroups = computed(() => groupTimelineByDate(buildMockTimelineEntries()))

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

function timelineDotClass(severity: EventSeverity): string {
  switch (severity) {
    case 'blocked':
      return 'bg-red-500 border-red-400'
    case 'action_needed':
      return 'bg-orange-500 border-orange-400'
    case 'waiting_on_provider':
      return 'bg-yellow-500 border-yellow-400'
    case 'review_complete':
      return 'bg-green-500 border-green-400'
    case 'informational':
      return 'bg-blue-500 border-blue-400'
  }
}

function loadEvents(): void {
  isLoading.value = true
  // Simulate async data load (will be replaced by real API call)
  setTimeout(() => {
    lastRefreshedAt.value = new Date().toISOString()
    centerState.value = deriveNotificationCenterState(
      buildMockEventsMixed(),
      lastRefreshedAt.value,
    )
    isLoading.value = false
  }, 150)
}

function handleRefresh(): void {
  loadEvents()
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  loadEvents()
})
</script>
