<template>
  <div class="glass-effect rounded-xl p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-white flex items-center gap-2">
        <i class="pi pi-exclamation-triangle text-yellow-400"></i>
        Compliance Gaps
      </h2>
      <Badge v-if="totalGaps > 0" variant="warning">{{ totalGaps }} gap(s)</Badge>
      <Badge v-else variant="success">No gaps</Badge>
    </div>

    <!-- Empty State -->
    <div v-if="totalGaps === 0" class="text-center py-8">
      <i class="pi pi-check-circle text-5xl text-green-400 mb-4"></i>
      <h3 class="text-lg font-semibold text-white mb-2">All Clear!</h3>
      <p class="text-gray-400">No compliance gaps detected. Your tokens meet all requirements.</p>
    </div>

    <!-- Gaps List -->
    <div v-else class="space-y-4">
      <div
        v-for="(gap, index) in sortedGaps"
        :key="index"
        class="p-4 rounded-lg border"
        :class="getSeverityClasses(gap.severity)"
      >
        <div class="flex items-start gap-3">
          <i :class="getSeverityIcon(gap.severity)" class="text-xl mt-0.5"></i>
          <div class="flex-1">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h4 class="font-semibold mb-1" :class="getSeverityTextColor(gap.severity)">
                  {{ gap.title }}
                </h4>
                <p class="text-sm text-gray-400">{{ gap.description }}</p>
              </div>
              <Badge :variant="getSeverityBadgeVariant(gap.severity)" size="sm">
                {{ gap.severity }}
              </Badge>
            </div>

            <!-- Affected Tokens -->
            <div v-if="gap.affectedTokens && gap.affectedTokens.length > 0" class="mb-3">
              <p class="text-xs text-gray-500 mb-1">Affected tokens:</p>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tokenId in gap.affectedTokens.slice(0, 5)"
                  :key="tokenId"
                  class="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400"
                >
                  {{ getTokenName(tokenId) }}
                </span>
                <span
                  v-if="gap.affectedTokens.length > 5"
                  class="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400"
                >
                  +{{ gap.affectedTokens.length - 5 }} more
                </span>
              </div>
            </div>

            <!-- Remediation Guidance -->
            <div class="bg-white/5 rounded-lg p-3">
              <div class="flex items-start gap-2 mb-2">
                <i class="pi pi-lightbulb text-biatec-accent text-sm mt-0.5"></i>
                <h5 class="text-sm font-semibold text-white">How to fix:</h5>
              </div>
              <p class="text-sm text-gray-300">{{ gap.remediation }}</p>
              <button
                v-if="gap.actionUrl"
                @click="navigateToAction(gap.actionUrl)"
                class="mt-3 px-3 py-1.5 bg-biatec-accent hover:bg-biatec-accent/80 text-white text-sm rounded-lg transition-colors"
              >
                {{ gap.actionLabel || 'Take Action' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Badge from '../ui/Badge.vue';

export interface ComplianceGap {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  remediation: string;
  affectedTokens?: string[];
  actionUrl?: string;
  actionLabel?: string;
  detectedAt: string;
}

interface Props {
  gaps: ComplianceGap[];
  tokenNameMap?: Record<string, string>;
}

const props = defineProps<Props>();

const router = useRouter();

const totalGaps = computed(() => props.gaps.length);

const sortedGaps = computed(() => {
  // Sort by severity: critical > high > medium > low
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...props.gaps].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
});

const getSeverityClasses = (severity: ComplianceGap['severity']) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/30';
    case 'high':
      return 'bg-orange-500/10 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/10 border-blue-500/30';
    default:
      return 'bg-gray-500/10 border-gray-500/30';
  }
};

const getSeverityIcon = (severity: ComplianceGap['severity']) => {
  switch (severity) {
    case 'critical':
      return 'pi pi-times-circle text-red-400';
    case 'high':
      return 'pi pi-exclamation-circle text-orange-400';
    case 'medium':
      return 'pi pi-exclamation-triangle text-yellow-400';
    case 'low':
      return 'pi pi-info-circle text-blue-400';
    default:
      return 'pi pi-info-circle text-gray-400';
  }
};

const getSeverityTextColor = (severity: ComplianceGap['severity']) => {
  switch (severity) {
    case 'critical':
      return 'text-red-400';
    case 'high':
      return 'text-orange-400';
    case 'medium':
      return 'text-yellow-400';
    case 'low':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

const getSeverityBadgeVariant = (severity: ComplianceGap['severity']): 'error' | 'warning' | 'info' => {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
};

const getTokenName = (tokenId: string) => {
  return props.tokenNameMap?.[tokenId] || tokenId;
};

const navigateToAction = (url: string) => {
  if (url.startsWith('/')) {
    router.push(url);
  } else {
    window.open(url, '_blank');
  }
};
</script>
