<template>
  <!-- Individual remediation task card -->
  <article
    class="rounded-xl border p-4"
    :class="cardClass"
    :aria-labelledby="`task-title-${task.id}`"
    :data-testid="`task-card-inner-${task.id}`"
  >
    <!-- Task header row -->
    <div class="flex items-start gap-2 mb-2 flex-wrap">
      <!-- Urgency badge -->
      <span
        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0"
        :class="urgencyClass"
        :aria-label="`Urgency: ${REMEDIATION_URGENCY_LABELS[task.urgency]}`"
        :data-testid="`task-urgency-${task.id}`"
      >
        {{ REMEDIATION_URGENCY_LABELS[task.urgency] }}
      </span>

      <!-- Launch blocking indicator -->
      <span
        v-if="task.isLaunchBlocking"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300 flex-shrink-0"
        aria-label="This action is required before launch"
        :data-testid="`task-blocking-badge-${task.id}`"
      >
        <ExclamationCircleIcon class="w-3 h-3" aria-hidden="true" />
        Launch blocking
      </span>

      <!-- Evidence freshness badge -->
      <span
        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
        :class="freshnessClass"
        :aria-label="`Evidence: ${EVIDENCE_FRESHNESS_LABELS[task.evidenceFreshness]}`"
        :data-testid="`task-freshness-${task.id}`"
      >
        <ClockIcon v-if="task.evidenceFreshness === 'stale'" class="w-3 h-3" aria-hidden="true" />
        <ExclamationTriangleIcon v-else-if="task.evidenceFreshness === 'missing'" class="w-3 h-3" aria-hidden="true" />
        <CheckIcon v-else class="w-3 h-3" aria-hidden="true" />
        {{ EVIDENCE_FRESHNESS_LABELS[task.evidenceFreshness] }}
      </span>

      <!-- Owner domain badge -->
      <span
        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-900 text-indigo-300 flex-shrink-0"
        :aria-label="`Owner: ${OWNER_DOMAIN_LABELS[task.ownerDomain]}`"
        :data-testid="`task-owner-${task.id}`"
      >
        <UserCircleIcon class="w-3 h-3 mr-1" aria-hidden="true" />
        {{ OWNER_DOMAIN_LABELS[task.ownerDomain] }}
      </span>
    </div>

    <!-- Task title -->
    <h4
      :id="`task-title-${task.id}`"
      class="text-sm font-semibold text-white mb-1"
      :data-testid="`task-title-${task.id}`"
    >
      {{ task.title }}
    </h4>

    <!-- Action summary -->
    <p
      class="text-xs text-gray-300 mb-1"
      :data-testid="`task-action-${task.id}`"
    >
      <span class="font-medium text-gray-400">Action: </span>{{ task.actionSummary }}
    </p>

    <!-- Impact statement -->
    <p
      class="text-xs text-gray-400 mb-2"
      :data-testid="`task-impact-${task.id}`"
    >
      {{ task.impactStatement }}
    </p>

    <!-- Stale evidence explanation (expanded) -->
    <div
      v-if="task.evidenceFreshness === 'stale' && task.stalenessExplanation"
      class="rounded-lg border border-orange-700 bg-orange-950 px-3 py-2 mb-2 flex items-start gap-1.5"
      role="note"
      :aria-label="`Stale evidence warning for: ${task.title}`"
      :data-testid="`task-stale-explanation-${task.id}`"
    >
      <ClockIcon class="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-xs text-orange-300">{{ task.stalenessExplanation }}</p>
    </div>

    <!-- Missing evidence explanation -->
    <div
      v-else-if="task.evidenceFreshness === 'missing' && task.isLaunchBlocking"
      class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 mb-2 flex items-start gap-1.5"
      role="note"
      :aria-label="`Missing evidence warning for: ${task.title}`"
      :data-testid="`task-missing-evidence-${task.id}`"
    >
      <ExclamationTriangleIcon class="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-xs text-gray-300">{{ EVIDENCE_FRESHNESS_EXPLANATIONS.missing }}</p>
    </div>

    <!-- Handoff note (if this task is blocked by another team) -->
    <div
      v-if="task.handoffNote && task.handoffState !== 'no_handoff'"
      class="rounded-lg border border-blue-700 bg-blue-950 px-3 py-2 mb-2 flex items-start gap-1.5"
      role="note"
      :data-testid="`task-handoff-note-${task.id}`"
    >
      <ArrowsRightLeftIcon class="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p class="text-xs text-blue-300">
        <span class="font-semibold">{{ HANDOFF_STATE_LABELS[task.handoffState] }}: </span>
        {{ task.handoffNote }}
      </p>
    </div>

    <!-- Remediation link -->
    <RouterLink
      v-if="task.remediationPath"
      :to="task.remediationPath"
      class="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
      :aria-label="`Go to remediation workspace for: ${task.title}`"
      :data-testid="`task-remediation-link-${task.id}`"
    >
      <ArrowTopRightOnSquareIcon class="w-3 h-3" aria-hidden="true" />
      Resolve in workspace
    </RouterLink>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import {
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  UserCircleIcon,
  ArrowsRightLeftIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/vue/24/outline'

import {
  type RemediationTask,
  REMEDIATION_URGENCY_LABELS,
  EVIDENCE_FRESHNESS_LABELS,
  EVIDENCE_FRESHNESS_EXPLANATIONS,
  OWNER_DOMAIN_LABELS,
  HANDOFF_STATE_LABELS,
  urgencyBadgeClass,
  taskCardClass,
  freshnessBadgeClass,
} from '../../utils/remediationWorkflow'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const props = defineProps<{
  task: RemediationTask
}>()

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const cardClass = computed(() => taskCardClass(props.task.urgency, props.task.isLaunchBlocking))
const urgencyClass = computed(() => urgencyBadgeClass(props.task.urgency))
const freshnessClass = computed(() => freshnessBadgeClass(props.task.evidenceFreshness))
</script>
