<template>
  <div class="glass-effect rounded-xl p-6 hover:scale-[1.02] transition-transform">
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-white mb-1">{{ token.name }}</h3>
        <p class="text-sm text-gray-400">{{ token.symbol }} • Asset ID: {{ token.assetId || 'N/A' }}</p>
      </div>
      <RiskIndicatorBadge :risk-level="riskLevel" />
    </div>

    <!-- MICA Readiness -->
    <div class="mb-4 pb-4 border-b border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-400">MICA Readiness</span>
        <Badge :variant="micaVariant">{{ micaStatus }}</Badge>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2">
        <div
          class="rounded-full h-2 transition-all"
          :class="micaBarColor"
          :style="{ width: `${micaScore}%` }"
        ></div>
      </div>
      <p class="text-xs text-gray-500 mt-1">{{ micaScore }}% compliant</p>
    </div>

    <!-- Attestation Coverage -->
    <div class="mb-4 pb-4 border-b border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-400">Attestation Coverage</span>
        <span class="text-sm font-semibold text-white">{{ attestationPercentage }}%</span>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2">
        <div
          class="bg-biatec-accent rounded-full h-2 transition-all"
          :style="{ width: `${attestationPercentage}%` }"
        ></div>
      </div>
      <p class="text-xs text-gray-500 mt-1">
        {{ attestationCount }} of {{ totalAttestationTypes }} attestation types
      </p>
    </div>

    <!-- Audit Trail Coverage -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-400">Audit Trail Coverage</span>
        <Badge :variant="auditVariant">{{ auditCoverage }}%</Badge>
      </div>
      <p class="text-xs text-gray-500">{{ auditEntryCount }} audit entries recorded</p>
    </div>

    <!-- Compliance Gaps -->
    <div v-if="gaps.length > 0" class="mb-4">
      <div class="flex items-center gap-2 text-yellow-400 mb-2">
        <i class="pi pi-exclamation-triangle text-sm"></i>
        <span class="text-sm font-medium">{{ gaps.length }} gap(s) detected</span>
      </div>
      <div class="space-y-1">
        <div
          v-for="(gap, index) in gaps.slice(0, 3)"
          :key="index"
          class="text-xs text-gray-400"
        >
          • {{ gap }}
        </div>
        <button
          v-if="gaps.length > 3"
          @click="$emit('view-details', token.id)"
          class="text-xs text-biatec-accent hover:text-biatec-accent/80 transition-colors"
        >
          View all {{ gaps.length }} gaps →
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        @click="$emit('view-details', token.id)"
        class="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg transition-colors"
      >
        View Details
      </button>
      <button
        @click="$emit('export-evidence', token.id)"
        class="px-3 py-2 bg-biatec-accent/10 hover:bg-biatec-accent/20 text-biatec-accent text-sm rounded-lg transition-colors flex items-center gap-1"
      >
        <i class="pi pi-download text-xs"></i>
        Export
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Badge from '../ui/Badge.vue';
import RiskIndicatorBadge from './RiskIndicatorBadge.vue';
import type { Token } from '../../stores/tokens';

export interface ComplianceGaps {
  missingAttestations: string[];
  incompleteJurisdiction: boolean;
  expiredEvidence: boolean;
  failedValidations: string[];
}

interface Props {
  token: Token;
  gaps?: ComplianceGaps;
  auditEntryCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  gaps: () => ({ missingAttestations: [], incompleteJurisdiction: false, expiredEvidence: false, failedValidations: [] }),
  auditEntryCount: 0,
});

defineEmits<{
  (e: 'view-details', tokenId: string): void;
  (e: 'export-evidence', tokenId: string): void;
}>();

// MICA Readiness Calculation
const micaScore = computed(() => {
  const metadata = props.token.complianceMetadata;
  if (!metadata) return 0;

  let score = 0;
  const maxScore = 100;
  
  // Check various MICA compliance factors
  if (metadata.micaReady) score += 40;
  if (metadata.whitelistRequired) score += 20;
  if (metadata.kycRequired) score += 20;
  if (metadata.jurisdictionRestrictions && metadata.jurisdictionRestrictions.length > 0) score += 10;
  if (metadata.issuerVerified) score += 10;
  
  return Math.min(score, maxScore);
});

const micaStatus = computed(() => {
  if (micaScore.value >= 90) return 'MICA Ready';
  if (micaScore.value >= 70) return 'Partially Compliant';
  if (micaScore.value >= 50) return 'In Progress';
  return 'Non-Compliant';
});

const micaVariant = computed<'success' | 'warning' | 'info' | 'error'>(() => {
  if (micaScore.value >= 90) return 'success';
  if (micaScore.value >= 70) return 'warning';
  if (micaScore.value >= 50) return 'info';
  return 'error';
});

const micaBarColor = computed(() => {
  if (micaScore.value >= 90) return 'bg-green-500';
  if (micaScore.value >= 70) return 'bg-yellow-500';
  if (micaScore.value >= 50) return 'bg-blue-500';
  return 'bg-red-500';
});

// Attestation Coverage Calculation
const totalAttestationTypes = 5; // KYC/AML, Accredited Investor, Jurisdiction, Issuer Verification, Other

const attestationCount = computed(() => {
  const attestations = props.token.attestationMetadata?.attestations || [];
  const uniqueTypes = new Set(attestations.filter(a => a.status === 'verified').map(a => a.type));
  return uniqueTypes.size;
});

const attestationPercentage = computed(() => {
  return Math.round((attestationCount.value / totalAttestationTypes) * 100);
});

// Audit Trail Coverage
const auditCoverage = computed(() => {
  // Audit coverage is based on the number of audit entries relative to expected entries
  // For simplicity, we'll use a formula: min(auditEntryCount / 10 * 100, 100)
  // This means 10+ audit entries = 100% coverage
  return Math.min(Math.round((props.auditEntryCount / 10) * 100), 100);
});

const auditVariant = computed<'success' | 'warning' | 'error'>(() => {
  if (auditCoverage.value >= 80) return 'success';
  if (auditCoverage.value >= 50) return 'warning';
  return 'error';
});

// Risk Level Calculation
const riskLevel = computed<'low' | 'medium' | 'high'>(() => {
  // Deterministic risk scoring based on:
  // - MICA score (40% weight)
  // - Attestation coverage (30% weight)
  // - Audit coverage (20% weight)
  // - Number of gaps (10% weight)
  
  const micaWeight = micaScore.value * 0.4;
  const attestationWeight = attestationPercentage.value * 0.3;
  const auditWeight = auditCoverage.value * 0.2;
  const gapWeight = Math.max(0, 100 - (gapList.value.length * 10)) * 0.1;
  
  const overallScore = micaWeight + attestationWeight + auditWeight + gapWeight;
  
  if (overallScore >= 80) return 'low';
  if (overallScore >= 50) return 'medium';
  return 'high';
});

// Compliance Gaps List
const gapList = computed(() => {
  const gaps: string[] = [];
  
  // Missing attestations
  if (props.gaps.missingAttestations.length > 0) {
    gaps.push(`Missing ${props.gaps.missingAttestations.length} required attestation(s)`);
  }
  
  // Incomplete jurisdiction
  if (props.gaps.incompleteJurisdiction) {
    gaps.push('Jurisdiction restrictions not fully configured');
  }
  
  // Expired evidence
  if (props.gaps.expiredEvidence) {
    gaps.push('Some attestation evidence has expired');
  }
  
  // Failed validations
  if (props.gaps.failedValidations.length > 0) {
    gaps.push(`${props.gaps.failedValidations.length} validation check(s) failed`);
  }
  
  // Check for missing MICA compliance fields
  const metadata = props.token.complianceMetadata;
  if (metadata) {
    if (!metadata.whitelistRequired && !metadata.kycRequired) {
      gaps.push('No compliance controls configured');
    }
    if (!metadata.issuerVerified) {
      gaps.push('Issuer verification pending');
    }
  } else {
    gaps.push('Compliance metadata not initialized');
  }
  
  return gaps;
});

const gaps = computed(() => gapList.value);
</script>
