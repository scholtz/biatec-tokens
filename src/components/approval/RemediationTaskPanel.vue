<template>
  <!-- Remediation Workflow Panel — enterprise launch-operations console -->
  <section
    aria-labelledby="remediation-panel-heading"
    data-testid="remediation-task-panel"
    class="mt-8 rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden"
  >
    <!-- Panel header -->
    <div
      class="flex items-start gap-3 px-6 py-5 border-b border-gray-700 bg-gray-850"
      data-testid="remediation-panel-header"
    >
      <div
        class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center flex-shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <WrenchScrewdriverIcon class="w-5 h-5 text-white" />
      </div>
      <div class="flex-1 min-w-0">
        <h2
          id="remediation-panel-heading"
          class="text-lg font-semibold text-white"
          data-testid="remediation-panel-title"
        >
          Remediation Workflow
        </h2>
        <p class="text-sm text-gray-400 mt-0.5">
          Follow-up actions required to move from blocked status to launch readiness.
          Blocking items must be resolved before sign-off can proceed.
        </p>
      </div>

      <!-- Summary stats -->
      <dl
        class="flex-shrink-0 flex items-start gap-5 text-right"
        aria-label="Remediation statistics"
        data-testid="remediation-stats"
      >
        <div class="flex flex-col">
          <dt class="text-xs text-gray-500">Blocking</dt>
          <dd
            class="text-lg font-bold"
            :class="workflow.launchBlockingCount > 0 ? 'text-red-400' : 'text-white'"
            :aria-label="`${workflow.launchBlockingCount} launch-blocking items`"
            data-testid="remediation-blocking-count"
          >
            {{ workflow.launchBlockingCount }}
          </dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-xs text-gray-500">Stale evidence</dt>
          <dd
            class="text-lg font-bold"
            :class="workflow.staleEvidenceCount > 0 ? 'text-orange-400' : 'text-white'"
            :aria-label="`${workflow.staleEvidenceCount} items with stale evidence`"
            data-testid="remediation-stale-count"
          >
            {{ workflow.staleEvidenceCount }}
          </dd>
        </div>
        <div v-if="workflow.unassignedCount > 0" class="flex flex-col">
          <dt class="text-xs text-gray-500">Unassigned</dt>
          <dd
            class="text-lg font-bold text-yellow-400"
            :aria-label="`${workflow.unassignedCount} items without an owner`"
            data-testid="remediation-unassigned-count"
          >
            {{ workflow.unassignedCount }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Workflow handoff notice -->
    <div
      v-if="handoffSummary"
      class="mx-6 mt-5 rounded-xl border border-blue-700 bg-blue-950 px-4 py-3 flex items-start gap-2"
      role="note"
      aria-label="Reviewer handoff notice"
      data-testid="handoff-notice"
    >
      <ArrowsRightLeftIcon class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-sm text-blue-300">
        <span class="font-semibold">Handoff dependency: </span>{{ handoffSummary }}
      </p>
    </div>

    <!-- Empty state -->
    <div
      v-if="workflow.allTasks.length === 0"
      class="px-6 py-10 flex flex-col items-center gap-3 text-center"
      data-testid="remediation-empty-state"
    >
      <CheckCircleIcon class="w-10 h-10 text-green-400" aria-hidden="true" />
      <p class="text-sm font-semibold text-green-300">No remediation tasks identified</p>
      <p class="text-xs text-gray-400 max-w-sm">
        All approval stages are clear of blockers. No follow-up actions are currently required.
        Complete any remaining sign-off stages to finalize the release.
      </p>
    </div>

    <!-- Stage groups -->
    <div
      v-else
      class="divide-y divide-gray-800"
      data-testid="remediation-stage-groups"
    >
      <div
        v-for="group in workflow.stageGroups"
        :key="group.stageId"
        :data-testid="`remediation-group-${group.stageId}`"
      >
        <!-- Only show groups that have tasks -->
        <template v-if="group.blockingTasks.length > 0 || group.advisoryTasks.length > 0">

          <!-- Group header — collapsible -->
          <div
            class="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-inset transition-colors"
            role="button"
            :tabindex="0"
            :aria-expanded="expandedGroups.has(group.stageId)"
            :aria-controls="`remediation-group-body-${group.stageId}`"
            :aria-label="`${group.stageLabel}: ${group.blockingTasks.length} blocking, ${group.advisoryTasks.length} advisory. ${expandedGroups.has(group.stageId) ? 'Collapse' : 'Expand'}.`"
            :data-testid="`remediation-group-header-${group.stageId}`"
            @click="toggleGroup(group.stageId)"
            @keydown.enter="toggleGroup(group.stageId)"
            @keydown.space.prevent="toggleGroup(group.stageId)"
          >
            <!-- Owner domain pill -->
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-800 text-indigo-200 flex-shrink-0"
              :data-testid="`remediation-group-owner-${group.stageId}`"
              :aria-label="`Owner: ${OWNER_DOMAIN_LABELS[group.ownerDomain]}`"
            >
              {{ OWNER_DOMAIN_LABELS[group.ownerDomain] }}
            </span>

            <!-- Stage label -->
            <h3
              class="text-sm font-semibold text-white flex-1"
              :data-testid="`remediation-group-label-${group.stageId}`"
            >
              {{ group.stageLabel }}
            </h3>

            <!-- Task count badges -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                v-if="group.blockingTasks.length > 0"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-800 text-red-200"
                :aria-label="`${group.blockingTasks.length} launch-blocking task${group.blockingTasks.length === 1 ? '' : 's'}`"
                :data-testid="`remediation-group-blocking-count-${group.stageId}`"
              >
                {{ group.blockingTasks.length }} blocking
              </span>
              <span
                v-if="group.advisoryTasks.length > 0"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-300"
                :aria-label="`${group.advisoryTasks.length} advisory task${group.advisoryTasks.length === 1 ? '' : 's'}`"
                :data-testid="`remediation-group-advisory-count-${group.stageId}`"
              >
                {{ group.advisoryTasks.length }} advisory
              </span>
              <!-- Handoff indicator -->
              <span
                v-if="group.handoffState !== 'no_handoff'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-800 text-blue-200"
                :aria-label="`Handoff: ${HANDOFF_STATE_LABELS[group.handoffState]}`"
                :data-testid="`remediation-group-handoff-${group.stageId}`"
              >
                <ArrowsRightLeftIcon class="w-3 h-3" aria-hidden="true" />
                {{ HANDOFF_STATE_LABELS[group.handoffState] }}
              </span>
            </div>

            <!-- Expand / collapse chevron -->
            <ChevronDownIcon
              class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': expandedGroups.has(group.stageId) }"
              aria-hidden="true"
            />
          </div>

          <!-- Group body — expandable via v-show -->
          <div
            v-show="expandedGroups.has(group.stageId)"
            :id="`remediation-group-body-${group.stageId}`"
            class="px-6 pb-5 space-y-3"
            :data-testid="`remediation-group-body-${group.stageId}`"
          >

            <!-- Handoff note for this stage -->
            <div
              v-if="group.handoffSummary"
              class="rounded-lg border border-blue-700 bg-blue-950 px-3 py-2 flex items-start gap-2 mt-3"
              role="note"
              :data-testid="`remediation-handoff-note-${group.stageId}`"
            >
              <ArrowsRightLeftIcon class="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-xs text-blue-300">{{ group.handoffSummary }}</p>
            </div>

            <!-- Blocking tasks -->
            <div v-if="group.blockingTasks.length > 0" class="mt-3">
              <h4
                class="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1"
                :data-testid="`remediation-blocking-heading-${group.stageId}`"
              >
                <ExclamationCircleIcon class="w-3.5 h-3.5" aria-hidden="true" />
                Launch-Blocking Actions
              </h4>
              <ul
                class="space-y-3"
                :aria-label="`Launch-blocking actions for ${group.stageLabel}`"
                :data-testid="`remediation-blocking-list-${group.stageId}`"
              >
                <li
                  v-for="task in group.blockingTasks"
                  :key="task.id"
                  :data-testid="`remediation-task-${task.id}`"
                >
                  <RemediationTaskCard
                    :task="task"
                    :data-testid="`remediation-task-card-${task.id}`"
                  />
                </li>
              </ul>
            </div>

            <!-- Advisory tasks -->
            <div v-if="group.advisoryTasks.length > 0" class="mt-3">
              <h4
                class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1"
                :data-testid="`remediation-advisory-heading-${group.stageId}`"
              >
                <InformationCircleIcon class="w-3.5 h-3.5" aria-hidden="true" />
                Follow-Up Items
              </h4>
              <ul
                class="space-y-3"
                :aria-label="`Follow-up items for ${group.stageLabel}`"
                :data-testid="`remediation-advisory-list-${group.stageId}`"
              >
                <li
                  v-for="task in group.advisoryTasks"
                  :key="task.id"
                  :data-testid="`remediation-task-${task.id}`"
                >
                  <RemediationTaskCard :task="task" />
                </li>
              </ul>
            </div>

          </div>
        </template>
      </div>
    </div>

    <!-- Panel footer disclaimer -->
    <div
      class="px-6 py-4 border-t border-gray-800 flex items-start gap-1.5"
      data-testid="remediation-panel-disclaimer"
    >
      <InformationCircleIcon class="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-xs text-gray-500">
        Remediation tasks are derived from the current approval stage blockers.
        Resolving a task requires updating the underlying evidence or configuration in the linked workspace,
        then refreshing the approval queue. Stale evidence must be refreshed before it can support launch sign-off.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ArrowsRightLeftIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

import {
  type RemediationWorkflowState,
  OWNER_DOMAIN_LABELS,
  HANDOFF_STATE_LABELS,
  getWorkflowHandoffSummary,
} from '../../utils/remediationWorkflow'

import RemediationTaskCard from './RemediationTaskCard.vue'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const props = defineProps<{
  workflow: RemediationWorkflowState
}>()

// ---------------------------------------------------------------------------
// Local state
// ---------------------------------------------------------------------------

/** Which stage groups are currently expanded */
const expandedGroups = ref<Set<string>>(new Set(
  // Auto-expand groups that have blocking tasks
  props.workflow.stageGroups
    .filter((g) => g.blockingTasks.length > 0)
    .map((g) => g.stageId),
))

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const handoffSummary = computed(() => getWorkflowHandoffSummary(props.workflow))

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function toggleGroup(stageId: string): void {
  const current = expandedGroups.value
  if (current.has(stageId)) {
    const next = new Set(current)
    next.delete(stageId)
    expandedGroups.value = next
  } else {
    expandedGroups.value = new Set([...current, stageId])
  }
}

// ---------------------------------------------------------------------------
// Expose for tests
// ---------------------------------------------------------------------------

defineExpose({
  expandedGroups,
  toggleGroup,
  handoffSummary,
})
</script>
