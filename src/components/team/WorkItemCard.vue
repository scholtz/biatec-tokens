<template>
  <article
    class="work-item-card bg-gray-800 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-200"
    role="article"
    :aria-labelledby="`work-item-title-${item.id}`"
    :data-testid="`work-item-card-${item.id}`"
  >
    <!-- Header row: category + priority + status -->
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <span
        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-white"
        :data-testid="`category-badge-${item.id}`"
      >
        <i :class="categoryIcon" class="mr-1 text-xs" aria-hidden="true"></i>
        {{ categoryLabel }}
      </span>

      <span
        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        :class="priorityClasses"
        :data-testid="`priority-badge-${item.id}`"
      >
        {{ priorityLabel }}
      </span>

      <ApprovalStatusBadge
        :state="item.state"
        size="sm"
        :data-testid="`status-badge-${item.id}`"
      />
    </div>

    <!-- Title -->
    <h3
      :id="`work-item-title-${item.id}`"
      class="text-white font-semibold text-base mb-1 leading-snug"
      :data-testid="`item-title-${item.id}`"
    >
      {{ item.title }}
    </h3>

    <!-- Description -->
    <p
      class="text-gray-300 text-sm mb-3 line-clamp-2"
      :data-testid="`item-description-${item.id}`"
    >
      {{ item.description }}
    </p>

    <!-- Business consequence -->
    <div
      v-if="item.businessConsequence"
      class="flex items-start gap-2 bg-amber-900 border border-amber-700 rounded-lg px-3 py-2 mb-3"
      :data-testid="`business-consequence-${item.id}`"
    >
      <i class="pi pi-exclamation-circle text-amber-400 text-sm mt-0.5 flex-shrink-0" aria-hidden="true"></i>
      <p class="text-amber-300 text-xs leading-relaxed">{{ item.businessConsequence }}</p>
    </div>

    <!-- Assignee / Reviewer row -->
    <div class="flex flex-wrap gap-4 text-xs text-gray-300 mb-3">
      <span v-if="item.assignee" :data-testid="`assignee-${item.id}`">
        <i class="pi pi-user mr-1" aria-hidden="true"></i>
        <span class="text-gray-300">Assignee:</span> {{ item.assignee }}
      </span>
      <span v-if="item.reviewer" :data-testid="`reviewer-${item.id}`">
        <i class="pi pi-eye mr-1" aria-hidden="true"></i>
        <span class="text-gray-300">Reviewer:</span> {{ item.reviewer }}
      </span>
      <span v-if="item.dueDate" :class="dueDateClasses" :data-testid="`due-date-${item.id}`">
        <i class="pi pi-calendar mr-1" aria-hidden="true"></i>
        Due {{ formatDate(item.dueDate) }}
      </span>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
      <!-- View Details (always visible) -->
      <a
        :href="item.contextPath"
        class="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        :aria-label="`View details for ${item.title}`"
        :data-testid="`view-details-${item.id}`"
      >
        <i class="pi pi-external-link" aria-hidden="true"></i>
        View Details
      </a>

      <span class="flex-1"></span>

      <!-- Request Changes -->
      <button
        v-if="canApprove && item.state === 'in_review'"
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-700 text-white hover:bg-orange-600 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500"
        :aria-label="`Request changes for ${item.title}`"
        :data-testid="`request-changes-btn-${item.id}`"
        @click="emit('requestChanges', item.id)"
      >
        <i class="pi pi-pencil" aria-hidden="true"></i>
        Request Changes
      </button>

      <!-- Approve -->
      <button
        v-if="canApprove && item.state === 'in_review'"
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-700 text-white hover:bg-green-600 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
        :aria-label="`Approve ${item.title}`"
        :data-testid="`approve-btn-${item.id}`"
        @click="emit('approve', item.id)"
      >
        <i class="pi pi-check" aria-hidden="true"></i>
        Approve
      </button>

      <!-- Assign button (when canAssign) -->
      <button
        v-if="canAssign"
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 border border-gray-600 text-white hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
        :aria-label="`Assign ${item.title}`"
        :data-testid="`assign-btn-${item.id}`"
        @click="emit('assign', item)"
      >
        <i class="pi pi-user-plus" aria-hidden="true"></i>
        Assign
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ApprovalStatusBadge from './ApprovalStatusBadge.vue'
import type { WorkItem, WorkItemCategory, WorkItemPriority } from '../../types/approvalWorkflow'

interface Props {
  item: WorkItem
  currentUserEmail?: string
  canApprove?: boolean
  canAssign?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canApprove: false,
  canAssign: false,
})

const emit = defineEmits<{
  approve: [itemId: string]
  requestChanges: [itemId: string]
  assign: [item: WorkItem]
}>()

// ── Category helpers ──────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<WorkItemCategory, string> = {
  whitelist_policy: 'Whitelist Policy',
  launch_readiness: 'Launch Readiness',
  compliance_review: 'Compliance Review',
  issuance_approval: 'Issuance Approval',
  team_access: 'Team Access',
}

const CATEGORY_ICONS: Record<WorkItemCategory, string> = {
  whitelist_policy: 'pi pi-shield',
  launch_readiness: 'pi pi-rocket',
  compliance_review: 'pi pi-file-check',
  issuance_approval: 'pi pi-verified',
  team_access: 'pi pi-users',
}

const categoryLabel = computed(() => CATEGORY_LABELS[props.item.category])
const categoryIcon = computed(() => CATEGORY_ICONS[props.item.category])

// ── Priority helpers ──────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<WorkItemPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const PRIORITY_CLASSES: Record<WorkItemPriority, string> = {
  critical: 'bg-red-800 text-white',
  high: 'bg-orange-700 text-white',
  medium: 'bg-yellow-700 text-white',
  low: 'bg-gray-600 text-white',
}

const priorityLabel = computed(() => PRIORITY_LABELS[props.item.priority])
const priorityClasses = computed(() => PRIORITY_CLASSES[props.item.priority])

// ── Due date ──────────────────────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24
const URGENT_THRESHOLD_DAYS = 3

const dueDateClasses = computed(() => {
  if (!props.item.dueDate) return 'text-gray-300'
  const msUntilDue = new Date(props.item.dueDate).getTime() - Date.now()
  const daysUntilDue = msUntilDue / MS_PER_DAY
  if (daysUntilDue < 0) return 'text-red-400 font-medium'
  if (daysUntilDue <= URGENT_THRESHOLD_DAYS) return 'text-orange-400 font-medium'
  return 'text-gray-300'
})

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}
</script>
