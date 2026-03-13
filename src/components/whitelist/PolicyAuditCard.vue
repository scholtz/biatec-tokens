<template>
  <div class="glass-effect rounded-xl p-6" aria-label="Policy audit information">
    <div class="flex items-center gap-2 mb-4">
      <i class="pi pi-history text-biatec-accent text-xl" aria-hidden="true"></i>
      <h3 class="text-base font-semibold text-white">Audit Trail</h3>
    </div>

    <dl class="space-y-3">
      <div class="flex items-center justify-between">
        <dt class="text-sm text-gray-400">Policy Version</dt>
        <dd class="text-sm font-medium text-white">v{{ policy.version }}</dd>
      </div>

      <div class="flex items-center justify-between">
        <dt class="text-sm text-gray-400">Review Status</dt>
        <dd>
          <span :class="reviewStatusClass" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {{ reviewStatusLabel }}
          </span>
        </dd>
      </div>

      <div class="flex items-start justify-between gap-4">
        <dt class="text-sm text-gray-400 flex-shrink-0">Last Updated</dt>
        <dd class="text-sm text-gray-300 text-right">
          <div>{{ formattedLastUpdated }}</div>
          <div class="text-xs text-gray-500 mt-0.5">by {{ policy.lastUpdatedByEmail }}</div>
        </dd>
      </div>

      <div class="flex items-start justify-between gap-4">
        <dt class="text-sm text-gray-400 flex-shrink-0">Created</dt>
        <dd class="text-sm text-gray-300 text-right">{{ formattedCreatedAt }}</dd>
      </div>

      <div class="flex items-center justify-between border-t border-gray-700/50 pt-3">
        <dt class="text-sm text-gray-400">Status</dt>
        <dd>
          <span :class="statusClass" class="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize">
            {{ policy.status.replace("_", " ") }}
          </span>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { WhitelistPolicy } from "../../stores/whitelistPolicy";

const props = defineProps<{
  policy: WhitelistPolicy;
}>();

const reviewStatusClass = computed(() => {
  const map: Record<string, string> = {
    approved: "bg-green-900/50 text-green-300",
    pending_review: "bg-amber-900/50 text-amber-300",
    changes_requested: "bg-red-900/50 text-red-300",
  };
  return map[props.policy.reviewStatus] ?? "bg-gray-700 text-gray-300";
});

const reviewStatusLabel = computed(() => {
  const map: Record<string, string> = {
    approved: "Approved ✓",
    pending_review: "Pending Review",
    changes_requested: "Changes Requested",
  };
  return map[props.policy.reviewStatus] ?? props.policy.reviewStatus;
});

const statusClass = computed(() => {
  const map: Record<string, string> = {
    active: "bg-green-900/50 text-green-300",
    draft: "bg-gray-700 text-gray-300",
    pending_review: "bg-amber-900/50 text-amber-300",
  };
  return map[props.policy.status] ?? "bg-gray-700 text-gray-300";
});

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

const formattedLastUpdated = computed(() => formatDate(props.policy.lastUpdatedAt));
const formattedCreatedAt = computed(() => formatDate(props.policy.createdAt));
</script>
