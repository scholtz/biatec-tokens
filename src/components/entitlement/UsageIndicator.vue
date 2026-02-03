<script setup lang="ts">
/**
 * UsageIndicator Component
 * Shows current usage against limits with visual progress bar
 */

import { computed } from "vue";
import { entitlementService } from "../../services/EntitlementService";
import type { UsageLimits } from "../../types/entitlement";
import Badge from "../ui/Badge.vue";

interface Props {
  limitKey: keyof UsageLimits;
  label: string;
  showPercentage?: boolean;
  showUpgradePrompt?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPercentage: true,
  showUpgradePrompt: true,
});

const emit = defineEmits<{
  upgrade: [];
}>();

const entitlement = computed(() => entitlementService.getEntitlement());

const limit = computed(() => {
  if (!entitlement.value) return null;
  return entitlement.value.limits[props.limitKey];
});

const current = computed(() => {
  if (!entitlement.value) return 0;
  const mapping: Record<keyof UsageLimits, 'tokensThisMonth' | 'deploymentsToday' | 'whitelistAddresses' | 'attestationsThisMonth' | 'apiCallsToday'> = {
    tokensPerMonth: "tokensThisMonth",
    deploymentPerDay: "deploymentsToday",
    whitelistAddresses: "whitelistAddresses",
    attestationsPerMonth: "attestationsThisMonth",
    apiCallsPerDay: "apiCallsToday",
  };
  const usageKey = mapping[props.limitKey];
  return entitlement.value.usage[usageKey] as number;
});

const percentage = computed(() => {
  if (limit.value === null) return 0; // Unlimited
  if (limit.value === 0) return 100;
  return Math.min(((current.value as number) / limit.value) * 100, 100);
});

const isUnlimited = computed(() => limit.value === null);

const isNearLimit = computed(() => percentage.value >= 80);

const isAtLimit = computed(() => percentage.value >= 100);

const statusColor = computed(() => {
  if (isUnlimited.value) return "gray";
  if (isAtLimit.value) return "red";
  if (isNearLimit.value) return "yellow";
  return "green";
});

const displayText = computed(() => {
  if (isUnlimited.value) {
    return `${current.value} / Unlimited`;
  }
  return `${current.value} / ${limit.value}`;
});

const handleUpgradeClick = () => {
  emit("upgrade");
};
</script>

<template>
  <div class="usage-indicator">
    <div class="usage-indicator__header">
      <span class="usage-indicator__label">{{ label }}</span>
      <div class="usage-indicator__value">
        <span class="usage-indicator__text">{{ displayText }}</span>
        <Badge v-if="isUnlimited" variant="success" size="sm">Unlimited</Badge>
        <Badge v-else-if="isAtLimit" variant="error" size="sm">Limit Reached</Badge>
        <Badge v-else-if="isNearLimit" variant="warning" size="sm">
          {{ percentage.toFixed(0) }}%
        </Badge>
        <Badge v-else variant="default" size="sm">
          {{ percentage.toFixed(0) }}%
        </Badge>
      </div>
    </div>

    <!-- Progress bar (only show if not unlimited) -->
    <div v-if="!isUnlimited" class="usage-indicator__progress">
      <div
        class="usage-indicator__progress-bar"
        :class="`usage-indicator__progress-bar--${statusColor}`"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>

    <!-- Warning message -->
    <div v-if="isAtLimit && showUpgradePrompt" class="usage-indicator__warning">
      <p class="usage-indicator__warning-text">
        You've reached your limit for {{ label.toLowerCase() }}.
        <button @click="handleUpgradeClick" class="usage-indicator__upgrade-link">
          Upgrade your plan
        </button>
        to continue.
      </p>
    </div>
    <div v-else-if="isNearLimit && showUpgradePrompt" class="usage-indicator__info">
      <p class="usage-indicator__info-text">
        You're approaching your limit for {{ label.toLowerCase() }}.
        Consider
        <button @click="handleUpgradeClick" class="usage-indicator__upgrade-link">
          upgrading your plan
        </button>
        for more capacity.
      </p>
    </div>
  </div>
</template>

<style scoped>
.usage-indicator {
  @apply space-y-2;
}

.usage-indicator__header {
  @apply flex items-center justify-between;
}

.usage-indicator__label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.usage-indicator__value {
  @apply flex items-center gap-2;
}

.usage-indicator__text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.usage-indicator__progress {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.usage-indicator__progress-bar {
  @apply h-full transition-all duration-300 ease-in-out;
}

.usage-indicator__progress-bar--green {
  @apply bg-green-500;
}

.usage-indicator__progress-bar--yellow {
  @apply bg-yellow-500;
}

.usage-indicator__progress-bar--red {
  @apply bg-red-500;
}

.usage-indicator__progress-bar--gray {
  @apply bg-gray-400;
}

.usage-indicator__warning {
  @apply p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg;
}

.usage-indicator__warning-text {
  @apply text-sm text-red-700 dark:text-red-400;
}

.usage-indicator__info {
  @apply p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg;
}

.usage-indicator__info-text {
  @apply text-sm text-yellow-700 dark:text-yellow-400;
}

.usage-indicator__upgrade-link {
  @apply font-medium underline hover:no-underline;
}
</style>
