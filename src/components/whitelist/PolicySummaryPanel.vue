<template>
  <div class="glass-effect rounded-xl p-6" role="region" aria-label="Policy summary panel">
    <!-- Screen-reader loading announcement (sr-only) -->
    <div v-if="loading" class="sr-only" role="status" aria-live="polite">Loading policy summary, please wait…</div>
    <!-- Loading skeleton — aria-hidden: purely visual, no meaningful content for AT -->
    <div v-if="loading" class="animate-pulse space-y-3" aria-hidden="true">
      <div class="h-4 bg-white/10 rounded w-3/4"></div>
      <div class="h-4 bg-white/10 rounded w-full"></div>
      <div class="h-4 bg-white/10 rounded w-5/6"></div>
      <div class="flex gap-4 mt-4">
        <div class="h-10 bg-white/10 rounded w-1/3"></div>
        <div class="h-10 bg-white/10 rounded w-1/3"></div>
        <div class="h-10 bg-white/10 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Loaded state -->
    <div v-else>
      <!-- Header row -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-2">
          <i class="pi pi-shield text-biatec-accent text-xl" aria-hidden="true"></i>
          <h2 class="text-lg font-semibold text-white">Policy Summary</h2>
        </div>
        <!-- Health badge -->
        <span :class="healthBadgeClass" class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
          {{ healthLabel }}
        </span>
      </div>

      <!-- Plain-language summary -->
      <p class="text-gray-300 text-sm leading-relaxed mb-5">{{ policy.summary }}</p>

      <!-- Key metrics -->
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="bg-gray-800 rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-green-400">{{ policy.allowedJurisdictions.length }}</div>
          <div class="text-xs text-gray-400 mt-1">Allowed Regions</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-red-400">{{ policy.blockedJurisdictions.length }}</div>
          <div class="text-xs text-gray-400 mt-1">Blocked Regions</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-biatec-accent">{{ enabledCategoriesCount }}</div>
          <div class="text-xs text-gray-400 mt-1">Active Categories</div>
        </div>
      </div>

      <!-- Gap warnings -->
      <div v-if="policy.gaps.length > 0" class="mb-4 space-y-2">
        <div
          v-for="gap in policy.gaps"
          :key="gap.id"
          :class="gap.severity === 'error' ? 'bg-red-800 border-red-700' : 'bg-amber-800 border-amber-700'"
          class="flex items-start gap-2 border rounded-lg px-3 py-2 text-sm"
        >
          <i
            :class="gap.severity === 'error' ? 'pi-times-circle text-red-400' : 'pi-exclamation-triangle text-amber-400'"
            class="pi mt-0.5 flex-shrink-0"
            aria-hidden="true"
          ></i>
          <span :class="gap.severity === 'error' ? 'text-red-200' : 'text-amber-200'">{{ gap.message }}</span>
        </div>
      </div>

      <!-- Last updated footer -->
      <div class="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-700/50 pt-3">
        <i class="pi pi-clock" aria-hidden="true"></i>
        <span>Last updated {{ lastUpdatedText }} by {{ policy.lastUpdatedByEmail }}</span>
      </div>

      <!-- Expandable explanation -->
      <div class="mt-3">
        <button
          @click="expanded = !expanded"
          class="text-xs text-biatec-accent hover:text-biatec-accent/80 transition-colors flex items-center gap-1"
          :aria-expanded="expanded"
          aria-controls="policy-explanation"
        >
          <i :class="expanded ? 'pi-chevron-up' : 'pi-chevron-down'" class="pi text-xs" aria-hidden="true"></i>
          {{ expanded ? 'Hide' : 'Show' }} how this policy works
        </button>
        <div
          v-show="expanded"
          id="policy-explanation"
          class="mt-3 text-xs text-gray-400 leading-relaxed bg-gray-800 rounded-lg p-3 space-y-2"
        >
          <p>
            <strong class="text-gray-300">Default behavior:</strong>
            {{ defaultBehaviorLabel }}
          </p>
          <p>
            <strong class="text-gray-300">KYC required:</strong>
            {{ policy.kycRequired ? 'Yes — all participants must complete identity verification.' : 'No — KYC is optional or managed externally.' }}
          </p>
          <p>
            <strong class="text-gray-300">Accreditation:</strong>
            {{ policy.accreditationRequired ? 'Required — investors must provide accreditation documentation.' : 'Not required for this token.' }}
          </p>
          <p v-if="policy.restrictedJurisdictions.length > 0">
            <strong class="text-gray-300">Under review:</strong>
            {{ policy.restrictedJurisdictions.map(j => j.name).join(', ') }} — eligibility decisions require manual operator review.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { WhitelistPolicy } from "../../stores/whitelistPolicy";

const props = defineProps<{
  policy: WhitelistPolicy;
  loading?: boolean;
}>();

const expanded = ref(false);

const enabledCategoriesCount = computed(
  () => props.policy.allowedInvestorCategories.filter((c) => c.allowed).length
);

const healthBadgeClass = computed(() => {
  const errors = props.policy.gaps.filter((g) => g.severity === "error").length;
  const warnings = props.policy.gaps.filter((g) => g.severity === "warning").length;
  if (errors > 0) return "bg-red-800 text-red-200 border border-red-700";
  if (warnings > 0) return "bg-amber-800 text-amber-200 border border-amber-700";
  return "bg-green-800 text-green-200 border border-green-700";
});

const healthLabel = computed(() => {
  const errors = props.policy.gaps.filter((g) => g.severity === "error").length;
  const warnings = props.policy.gaps.filter((g) => g.severity === "warning").length;
  if (errors > 0) return "Critical";
  if (warnings > 0) return "Warnings";
  return "Healthy";
});

const lastUpdatedText = computed(() => {
  try {
    const updatedAt = new Date(props.policy.lastUpdatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updatedAt.getTime();
    if (diffMs < 0) return "recently (clock skew detected)"; // future date guard
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month ago";
    if (diffMonths < 12) return `${diffMonths} months ago`;
    return `${Math.floor(diffMonths / 12)} year(s) ago`;
  } catch {
    return "unknown";
  }
});

const defaultBehaviorLabel = computed(() => {
  const labels: Record<string, string> = {
    allow_all: "Allow All — every jurisdiction is permitted unless explicitly blocked.",
    deny_all: "Deny All — no jurisdiction is permitted unless explicitly allowed.",
    allow_by_rule:
      "Apply Rules — only jurisdictions on the allowed list may participate; all others are denied.",
  };
  return labels[props.policy.defaultBehavior] ?? props.policy.defaultBehavior;
});
</script>
