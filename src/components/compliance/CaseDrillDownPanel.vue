<template>
  <!-- Case Drill-Down Panel — evidence-linked detail for a compliance work item -->
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="modelValue"
      class="fixed inset-0 z-40 bg-black/60"
      aria-hidden="true"
      @click="close"
    />

    <!-- Slide-over panel -->
    <aside
      v-if="modelValue"
      :data-testid="DRILL_DOWN_TEST_IDS.PANEL"
      role="dialog"
      aria-modal="true"
      :aria-label="`Case detail: ${item?.title ?? 'Loading'}`"
      class="fixed inset-y-0 right-0 z-50 w-full max-w-2xl flex flex-col bg-gray-900 shadow-2xl overflow-hidden"
    >
      <!-- ── Header ── -->
      <header class="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-700 flex-shrink-0">
        <div class="flex-1 min-w-0">
          <h2
            :data-testid="DRILL_DOWN_TEST_IDS.CASE_HEADLINE"
            class="text-lg font-semibold text-white truncate"
          >
            {{ item?.title ?? 'Case Detail' }}
          </h2>
          <!-- Quick-status row -->
          <div class="flex flex-wrap gap-2 mt-2">
            <span
              v-if="state"
              :data-testid="DRILL_DOWN_TEST_IDS.CASE_STAGE_BADGE"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200"
              :aria-label="`Stage: ${COCKPIT_STAGE_LABELS[item!.stage]}`"
            >
              {{ COCKPIT_STAGE_LABELS[item!.stage] }}
            </span>
            <span
              v-if="state"
              :data-testid="DRILL_DOWN_TEST_IDS.CASE_STATUS_BADGE"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="workItemStatusBadgeClass(item!.status)"
              :aria-label="`Status: ${WORK_ITEM_STATUS_LABELS[item!.status]}`"
            >
              {{ WORK_ITEM_STATUS_LABELS[item!.status] }}
            </span>
            <span
              v-if="state && slaBadge"
              :data-testid="DRILL_DOWN_TEST_IDS.CASE_SLA_BADGE"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="slaBadge.class"
              :aria-label="`SLA: ${slaBadge.label}`"
            >
              {{ slaBadge.label }}
            </span>
            <span
              v-if="state"
              :data-testid="DRILL_DOWN_TEST_IDS.CASE_OWNERSHIP_BADGE"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="ownershipBadgeClass(item!.ownership)"
              :aria-label="`Ownership: ${OWNERSHIP_STATE_LABELS[item!.ownership]}`"
            >
              {{ OWNERSHIP_STATE_LABELS[item!.ownership] }}
            </span>
          </div>
        </div>
        <button
          :data-testid="DRILL_DOWN_TEST_IDS.PANEL_CLOSE_BTN"
          class="flex-shrink-0 text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded p-1"
          aria-label="Close case detail panel"
          @click="close"
        >
          <XMarkIcon class="w-6 h-6" aria-hidden="true" />
        </button>
      </header>

      <!-- ── Scrollable body ── -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-8">

        <!-- Loading indicator for live backend fetch -->
        <div
          v-if="liveLoading"
          :data-testid="DRILL_DOWN_TEST_IDS.LIVE_LOADING"
          class="flex items-center gap-2 text-xs text-gray-400"
          role="status"
          aria-live="polite"
        >
          <ArrowPathIcon class="w-4 h-4 animate-spin text-teal-400" aria-hidden="true" />
          Loading live backend data…
        </div>

        <!-- Data-provenance badge -->
        <div
          v-if="!liveLoading"
          :data-testid="DRILL_DOWN_TEST_IDS.DATA_SOURCE_BADGE"
          :class="['inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium', dataSourceBadgeClass(displaySource, displayIsDegraded)]"
          :aria-label="`Data source: ${dataSourceLabel(displaySource, displayIsDegraded)}`"
        >
          {{ dataSourceLabel(displaySource, displayIsDegraded) }}
        </div>

        <!-- Degraded notice -->
        <div
          v-if="displayIsDegraded"
          :data-testid="DRILL_DOWN_TEST_IDS.DEGRADED_NOTICE"
          role="alert"
          aria-live="assertive"
          class="rounded-xl border border-yellow-700 bg-yellow-900/20 p-4 flex items-start gap-3"
        >
          <ExclamationTriangleIcon class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p class="font-semibold text-yellow-300 text-sm">Evidence data is partially unavailable</p>
            <p class="text-yellow-200/80 text-xs mt-1">
              {{ displayDegradedReason ?? 'Some evidence records could not be retrieved.' }}
              Do not treat this case as ready until all data is confirmed with your platform administrator.
            </p>
          </div>
        </div>

        <!-- Next action box -->
        <section
          :data-testid="DRILL_DOWN_TEST_IDS.NEXT_ACTION_BOX"
          aria-labelledby="drill-next-action-heading"
          class="rounded-xl border border-teal-700 bg-teal-900/20 p-4"
        >
          <h3
            id="drill-next-action-heading"
            class="text-sm font-semibold text-teal-300 mb-1 flex items-center gap-2"
          >
            <ArrowRightCircleIcon class="w-4 h-4" aria-hidden="true" />
            Next Action
          </h3>
          <p class="text-white text-sm leading-relaxed">{{ state?.nextAction }}</p>
        </section>

        <!-- Active blockers -->
        <section
          v-if="state && state.blockerSummary.length > 0"
          aria-labelledby="drill-blockers-heading"
        >
          <h3
            id="drill-blockers-heading"
            class="text-sm font-semibold text-white mb-3 flex items-center gap-2"
          >
            <ExclamationCircleIcon class="w-4 h-4 text-red-400" aria-hidden="true" />
            Active Blockers
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-900 text-red-200">
              {{ state.blockerSummary.length }}
            </span>
          </h3>
          <ul
            :data-testid="DRILL_DOWN_TEST_IDS.BLOCKER_LIST"
            class="space-y-2"
            aria-label="Active case blockers"
          >
            <li
              v-for="(blocker, idx) in state.blockerSummary"
              :key="idx"
              :data-testid="DRILL_DOWN_TEST_IDS.BLOCKER_ITEM"
              class="flex items-start gap-2 rounded-lg bg-red-900/20 border border-red-800/40 px-3 py-2"
            >
              <span class="text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true">⚠</span>
              <span class="text-red-200 text-sm">{{ blocker }}</span>
            </li>
          </ul>
        </section>

        <!-- ── Timeline ── -->
        <section
          :data-testid="DRILL_DOWN_TEST_IDS.TIMELINE_SECTION"
          aria-labelledby="drill-timeline-heading"
        >
          <h3
            id="drill-timeline-heading"
            class="text-sm font-semibold text-white mb-4 flex items-center gap-2"
          >
            <ClockIcon class="w-4 h-4 text-gray-400" aria-hidden="true" />
            Case Timeline
          </h3>

          <p
            v-if="!state || state.timeline.length === 0"
            :data-testid="DRILL_DOWN_TEST_IDS.TIMELINE_EMPTY"
            class="text-gray-500 text-sm"
          >
            No timeline events recorded for this case.
          </p>

          <ol
            v-else
            class="relative border-l border-gray-700 ml-2 space-y-5"
            aria-label="Case timeline"
          >
            <li
              v-for="event in state.timeline"
              :key="event.id"
              :data-testid="DRILL_DOWN_TEST_IDS.TIMELINE_EVENT"
              :data-event-type="event.type"
              class="ml-6"
            >
              <!-- Dot -->
              <span
                class="absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-gray-900"
                :class="timelineEventDotClass(event.type)"
                aria-hidden="true"
              />
              <div class="flex items-start justify-between gap-2 flex-wrap">
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium"
                    :class="event.isSignificant ? 'text-white' : 'text-gray-300'"
                  >
                    {{ event.summary }}
                  </p>
                  <p v-if="event.detail" class="text-xs text-gray-500 mt-0.5">{{ event.detail }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <time
                    :datetime="event.timestamp"
                    class="text-xs text-gray-500"
                    :aria-label="`Event time: ${formatTimestamp(event.timestamp)}`"
                  >
                    {{ formatTimestamp(event.timestamp) }}
                  </time>
                  <p class="text-xs text-gray-600 mt-0.5">{{ event.actor }}</p>
                </div>
              </div>
            </li>
          </ol>
        </section>

        <!-- ── Evidence Groups ── -->
        <section
          :data-testid="DRILL_DOWN_TEST_IDS.EVIDENCE_SECTION"
          aria-labelledby="drill-evidence-heading"
        >
          <h3
            id="drill-evidence-heading"
            class="text-sm font-semibold text-white mb-4 flex items-center gap-2"
          >
            <DocumentCheckIcon class="w-4 h-4 text-gray-400" aria-hidden="true" />
            Evidence &amp; Compliance Artifacts
          </h3>
          <p class="text-xs text-gray-500 mb-4">
            {{ evidenceReadinessLabel }}
          </p>

          <div class="space-y-3">
            <div
              v-for="group in state?.evidenceGroups"
              :key="group.category"
              :data-testid="DRILL_DOWN_TEST_IDS.EVIDENCE_GROUP"
              :data-category="group.category"
              class="rounded-xl border overflow-hidden"
              :class="evidenceGroupBorderClass(group.overallStatus)"
            >
              <!-- Group header (toggle) -->
              <button
                :data-testid="DRILL_DOWN_TEST_IDS.EVIDENCE_GROUP_TOGGLE"
                class="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                :aria-expanded="expandedGroups.has(group.category)"
                :aria-controls="`evidence-group-body-${group.category}`"
                @click="toggleGroup(group.category)"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="evidenceStatusBadgeClass(group.overallStatus)"
                    :aria-label="`Overall status: ${EVIDENCE_STATUS_LABELS[group.overallStatus]}`"
                  >
                    {{ EVIDENCE_STATUS_LABELS[group.overallStatus] }}
                  </span>
                  <span class="text-sm font-medium text-white">{{ group.label }}</span>
                </div>
                <ChevronDownIcon
                  class="w-4 h-4 text-gray-400 transition-transform flex-shrink-0"
                  :class="expandedGroups.has(group.category) ? 'rotate-180' : ''"
                  aria-hidden="true"
                />
              </button>

              <!-- Group body -->
              <div
                v-if="expandedGroups.has(group.category)"
                :id="`evidence-group-body-${group.category}`"
                class="border-t border-gray-700 px-4 py-3 space-y-2"
              >
                <p class="text-xs text-gray-500 mb-2">{{ group.description }}</p>
                <ul class="space-y-2" :aria-label="`${group.label} evidence items`">
                  <li
                    v-for="item in group.items"
                    :key="item.id"
                    :data-testid="DRILL_DOWN_TEST_IDS.EVIDENCE_ITEM"
                    :data-status="item.status"
                    class="flex items-start justify-between gap-3"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-white">{{ item.label }}</p>
                      <p v-if="item.note" class="text-xs text-gray-500 mt-0.5">{{ item.note }}</p>
                      <p
                        v-if="item.lastUpdatedAt"
                        class="text-xs text-gray-600 mt-0.5"
                      >
                        Updated: {{ formatTimestamp(item.lastUpdatedAt) }}
                      </p>
                    </div>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                      :class="evidenceStatusBadgeClass(item.status)"
                      :aria-label="`${item.label}: ${EVIDENCE_STATUS_LABELS[item.status]}`"
                    >
                      {{ EVIDENCE_STATUS_LABELS[item.status] }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Approval History ── -->
        <section
          :data-testid="DRILL_DOWN_TEST_IDS.APPROVAL_HISTORY_SECTION"
          aria-labelledby="drill-approval-history-heading"
        >
          <h3
            id="drill-approval-history-heading"
            class="text-sm font-semibold text-white mb-4 flex items-center gap-2"
          >
            <UserCheckIcon class="w-4 h-4 text-gray-400" aria-hidden="true" />
            Approval &amp; Decision History
          </h3>

          <p
            v-if="!state || state.approvalHistory.length === 0"
            :data-testid="DRILL_DOWN_TEST_IDS.APPROVAL_HISTORY_EMPTY"
            class="text-gray-500 text-sm"
          >
            No approval decisions recorded for this case yet.
          </p>

          <ol
            v-else
            class="space-y-3"
            aria-label="Approval decision history"
          >
            <li
              v-for="record in state.approvalHistory"
              :key="record.id"
              :data-testid="DRILL_DOWN_TEST_IDS.APPROVAL_RECORD"
              :data-decision="record.decision"
              class="rounded-xl border border-gray-700 bg-gray-800/60 p-4"
            >
              <div class="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div>
                  <p class="text-sm font-medium text-white">{{ record.actor }}</p>
                  <p class="text-xs text-gray-400">{{ record.role }}</p>
                </div>
                <div class="text-right">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="approvalDecisionBadgeClass(record.decision)"
                    :aria-label="`Decision: ${APPROVAL_DECISION_LABELS[record.decision]}`"
                  >
                    {{ APPROVAL_DECISION_LABELS[record.decision] }}
                  </span>
                  <time
                    :datetime="record.timestamp"
                    class="block text-xs text-gray-500 mt-1"
                  >
                    {{ formatTimestamp(record.timestamp) }}
                  </time>
                </div>
              </div>
              <p v-if="record.note" class="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
                {{ record.note }}
              </p>
            </li>
          </ol>
        </section>

      </div>

      <!-- ── Footer actions ── -->
      <footer class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0 bg-gray-900">
        <router-link
          v-if="item"
          :to="item.workspacePath"
          :data-testid="DRILL_DOWN_TEST_IDS.OPEN_WORKSPACE_LINK"
          class="text-sm text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
          :aria-label="`Open full workspace for: ${item.title}`"
          @click="close"
        >
          Open workspace →
        </router-link>
        <button
          v-if="item"
          :data-testid="DRILL_DOWN_TEST_IDS.ESCALATE_BTN"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          :aria-label="`Initiate escalation for: ${item.title}`"
          @click="emit('escalate', item)"
        >
          <ArrowUpRightIcon class="w-4 h-4" aria-hidden="true" />
          Escalate Case
        </button>
      </footer>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ArrowRightCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ChevronDownIcon,
  ArrowUpRightIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import { CheckBadgeIcon as UserCheckIcon } from '@heroicons/vue/24/solid'
import {
  DRILL_DOWN_TEST_IDS,
  deriveCaseDrillDown,
  evidenceStatusBadgeClass,
  approvalDecisionBadgeClass,
  timelineEventDotClass,
  deriveEvidenceReadinessLabel,
  EVIDENCE_STATUS_LABELS,
  APPROVAL_DECISION_LABELS,
  type EvidenceCategory,
  type CaseDrillDownState,
} from '../../utils/caseDrillDown'
import {
  COCKPIT_STAGE_LABELS,
  OWNERSHIP_STATE_LABELS,
  WORK_ITEM_STATUS_LABELS,
  workItemStatusBadgeClass,
  ownershipBadgeClass,
  slaUrgencyBadgeClass,
  classifySlaUrgency,
  SLA_URGENCY_LABELS,
  type WorkItem,
} from '../../utils/complianceOperationsCockpit'
import {
  loadLiveCaseDrillDown,
  dataSourceLabel,
  dataSourceBadgeClass,
  type DataSource,
} from '../../utils/liveComplianceIntegration'

// ---------------------------------------------------------------------------
// Props / emits
// ---------------------------------------------------------------------------

const props = defineProps<{
  /** Whether the panel is visible */
  modelValue: boolean
  /** The work item to show detail for */
  item: WorkItem | null
  /** Bearer token for live backend calls. Null = mock mode. */
  bearerToken?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  escalate: [item: WorkItem]
}>()

// ---------------------------------------------------------------------------
// Live backend state
// ---------------------------------------------------------------------------

const liveState = ref<CaseDrillDownState | null>(null)
const liveSource = ref<DataSource>('mock')
const liveIsDegraded = ref(false)
const liveDegradedReason = ref<string | null>(null)
const liveLoading = ref(false)

async function fetchLiveState(item: WorkItem) {
  if (!item) return
  liveLoading.value = true
  try {
    const result = await loadLiveCaseDrillDown(item.id, item, props.bearerToken)
    liveState.value = result.data
    liveSource.value = result.source
    // Only mark as degraded when the backend was actually attempted and had issues.
    // When source='mock' it means we are in demo mode (no token) — not a backend failure.
    liveIsDegraded.value = result.isDegraded && result.source === 'live'
    liveDegradedReason.value = result.isDegraded && result.source === 'live' ? result.degradedReason : null
  } catch {
    liveState.value = null
    liveSource.value = 'mock'
    liveIsDegraded.value = true
    liveDegradedReason.value = 'Case detail could not be loaded from backend.'
  } finally {
    liveLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

/** Merged state: live backend data takes precedence; fall back to mock derivation */
const state = computed<CaseDrillDownState | null>(() => {
  if (!props.item) return null
  if (liveState.value) return liveState.value
  return deriveCaseDrillDown(props.item, Date.now())
})

const displaySource = computed<DataSource>(() =>
  liveState.value ? liveSource.value : 'mock',
)

const displayIsDegraded = computed(() =>
  liveIsDegraded.value || (state.value?.isDegraded ?? false),
)

const displayDegradedReason = computed(() =>
  liveDegradedReason.value ?? (displayIsDegraded.value ? 'Evidence data is partially unavailable' : null),
)

const expandedGroups = ref<Set<EvidenceCategory>>(new Set())

// Expand all groups on open; fetch live backend data when item changes
watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      expandedGroups.value = new Set<EvidenceCategory>([
        'identity_kyc',
        'aml_sanctions',
      ])
      liveState.value = null
      fetchLiveState(newItem)
    } else {
      expandedGroups.value = new Set()
      liveState.value = null
    }
  },
  { immediate: true },
)

const slaBadge = computed(() => {
  if (!props.item) return null
  const urgency = classifySlaUrgency(props.item.dueAt)
  if (urgency === 'no_deadline') return null
  return {
    label: SLA_URGENCY_LABELS[urgency],
    class: slaUrgencyBadgeClass(urgency),
  }
})

const evidenceReadinessLabel = computed(() =>
  state.value ? deriveEvidenceReadinessLabel(state.value.evidenceGroups) : '',
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function close() {
  emit('update:modelValue', false)
}

function toggleGroup(category: EvidenceCategory) {
  const s = new Set(expandedGroups.value)
  if (s.has(category)) {
    s.delete(category)
  } else {
    s.add(category)
  }
  expandedGroups.value = s
}

function evidenceGroupBorderClass(status: import('../../utils/caseDrillDown').EvidenceStatus): string {
  switch (status) {
    case 'available':
      return 'border-green-800 bg-green-900/10'
    case 'missing':
      return 'border-red-800 bg-red-900/10'
    case 'stale':
      return 'border-yellow-800 bg-yellow-900/10'
    case 'degraded':
      return 'border-gray-700 bg-gray-800/60'
  }
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>
