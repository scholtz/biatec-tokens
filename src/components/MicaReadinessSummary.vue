<template>
  <div class="space-y-6">
    <!-- Summary Card Header -->
    <div class="glass-effect rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            <i class="pi pi-shield-check text-biatec-accent"></i>
            MICA Readiness Dashboard
          </h2>
          <p class="text-sm text-gray-400 mt-1">
            Enterprise compliance overview for VOI and Aramid networks
          </p>
        </div>
        <button
          v-if="!isLoading"
          @click="refreshData"
          :disabled="isRefreshing"
          class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <i :class="['pi pi-refresh', isRefreshing && 'animate-spin']"></i>
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <!-- Network Tabs -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="network in networks"
          :key="network"
          @click="selectedNetwork = network"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            selectedNetwork === network
              ? 'bg-biatec-accent text-gray-900'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          ]"
        >
          {{ network }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="glass-effect rounded-xl p-6 animate-pulse">
        <div class="h-32 bg-white/5 rounded"></div>
      </div>
    </div>

    <!-- Network Summary Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Overall Readiness Score -->
      <div class="glass-effect rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', readinessScoreBgClass]">
              <i :class="['pi pi-chart-pie text-2xl', readinessScoreColor]"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Readiness Score</h3>
              <p class="text-sm text-gray-400">{{ selectedNetwork }} Network</p>
            </div>
          </div>
        </div>
        <div class="mb-3">
          <div :class="['text-4xl font-bold', readinessScoreColor]">
            {{ networkSummary.readinessScore }}%
          </div>
          <p class="text-sm text-gray-400 mt-1">{{ readinessLabel }}</p>
        </div>
        <div class="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            :class="['absolute inset-y-0 left-0 rounded-full transition-all duration-500', readinessScoreGradient]"
            :style="{ width: `${networkSummary.readinessScore}%` }"
          ></div>
        </div>
      </div>

      <!-- Audit Export Availability -->
      <div class="glass-effect rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <i class="pi pi-download text-2xl text-purple-400"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Audit Exports</h3>
              <p class="text-sm text-gray-400">Available Reports</p>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Ready for Download</span>
            <span class="text-white font-semibold">{{ networkSummary.auditExports.ready }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">In Progress</span>
            <span class="text-yellow-400 font-semibold">{{ networkSummary.auditExports.pending }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Total Generated</span>
            <span class="text-gray-300 font-semibold">{{ networkSummary.auditExports.total }}</span>
          </div>
        </div>
        <button
          v-if="networkSummary.auditExports.ready > 0"
          @click="navigateToExports"
          class="mt-4 w-full px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <i class="pi pi-folder-open"></i>
          View Exports
        </button>
      </div>

      <!-- Whitelist Coverage -->
      <div class="glass-effect rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', whitelistCoverageBgClass]">
              <i :class="['pi pi-users text-2xl', whitelistCoverageColor]"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">Whitelist Coverage</h3>
              <p class="text-sm text-gray-400">KYC Verified Addresses</p>
            </div>
          </div>
        </div>
        <div class="mb-3">
          <div class="text-4xl font-bold text-white">
            {{ networkSummary.whitelistCoverage.percentage }}%
          </div>
          <p class="text-sm text-gray-400 mt-1">
            {{ networkSummary.whitelistCoverage.verified }} / {{ networkSummary.whitelistCoverage.total }} verified
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <i :class="[networkSummary.whitelistCoverage.percentage >= 70 ? 'pi pi-check-circle text-green-400' : 'pi pi-exclamation-circle text-yellow-400']"></i>
          <span :class="[networkSummary.whitelistCoverage.percentage >= 70 ? 'text-green-400' : 'text-yellow-400']">
            {{ networkSummary.whitelistCoverage.percentage >= 70 ? 'Enterprise Ready' : 'Action Required' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Detailed Breakdown -->
    <div v-if="!isLoading" class="glass-effect rounded-xl p-6">
      <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <i class="pi pi-list-check text-biatec-accent"></i>
        Compliance Requirements Breakdown
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="requirement in complianceRequirements"
          :key="requirement.label"
          class="p-4 bg-white/5 rounded-lg border border-white/10"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <i :class="[requirement.met ? 'pi pi-check-circle text-green-400' : 'pi pi-times-circle text-red-400']"></i>
              <span class="text-sm font-medium text-white">{{ requirement.label }}</span>
            </div>
            <span
              :class="[
                'px-2 py-0.5 text-xs rounded-full',
                requirement.status === 'compliant' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                requirement.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                'bg-red-500/20 text-red-400 border border-red-500/50'
              ]"
            >
              {{ requirement.status }}
            </span>
          </div>
          <p class="text-xs text-gray-400 mb-2">{{ requirement.description }}</p>
          <div v-if="requirement.actionRequired" class="mt-2">
            <button
              @click="handleAction(requirement.action)"
              class="text-xs text-biatec-accent hover:text-biatec-accent/80 transition-colors flex items-center gap-1"
            >
              {{ requirement.actionLabel }} <i class="pi pi-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Sources Documentation -->
    <div class="glass-effect rounded-xl p-6">
      <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <i class="pi pi-info-circle text-biatec-accent"></i>
        Data Sources & Enterprise Documentation
      </h3>
      
      <div class="space-y-4">
        <!-- On-Chain Signals -->
        <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <i class="pi pi-link text-blue-400"></i>
            On-Chain Signals
          </h4>
          <ul class="text-xs text-gray-400 space-y-1">
            <li class="flex items-start gap-2">
              <i class="pi pi-arrow-right text-blue-400 mt-0.5"></i>
              <span>Direct smart contract state queries from {{ selectedNetwork }} blockchain</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-arrow-right text-blue-400 mt-0.5"></i>
              <span>Real-time whitelist contract verification (ARC-1400 compatible)</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-arrow-right text-blue-400 mt-0.5"></i>
              <span>Transfer restriction logic audited via on-chain code inspection</span>
            </li>
          </ul>
        </div>

        <!-- Whitelisting Sources -->
        <div class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h4 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <i class="pi pi-shield-check text-green-400"></i>
            Whitelisting & Audit Sources
          </h4>
          <ul class="text-xs text-gray-400 space-y-1">
            <li class="flex items-start gap-2">
              <i class="pi pi-arrow-right text-green-400 mt-0.5"></i>
              <span>Integrated KYC provider APIs (Sumsub, Onfido compatible)</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-arrow-right text-green-400 mt-0.5"></i>
              <span>Internal compliance database with encrypted PII storage</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-arrow-right text-green-400 mt-0.5"></i>
              <span>Immutable audit logs stored on-chain and in secure cloud storage</span>
            </li>
          </ul>
        </div>

        <!-- Enterprise UX Copy -->
        <div class="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h4 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <i class="pi pi-building text-purple-400"></i>
            Enterprise Procurement Alignment
          </h4>
          <p class="text-xs text-gray-400 mb-3">
            This platform is designed for institutional-grade token management, meeting the stringent requirements of enterprise procurement teams:
          </p>
          <ul class="text-xs text-gray-400 space-y-1">
            <li class="flex items-start gap-2">
              <i class="pi pi-check text-purple-400 mt-0.5"></i>
              <span><strong>MICA-Ready:</strong> Pre-configured compliance frameworks for Markets in Crypto-Assets regulation</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-check text-purple-400 mt-0.5"></i>
              <span><strong>Audit-First:</strong> Comprehensive logging and export capabilities for regulatory reviews</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-check text-purple-400 mt-0.5"></i>
              <span><strong>White-Glove Support:</strong> Dedicated compliance assistance for enterprise customers</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="pi pi-check text-purple-400 mt-0.5"></i>
              <span><strong>SOC 2 Compatible:</strong> Security controls aligned with enterprise security standards</span>
            </li>
          </ul>
        </div>

        <!-- Market Reference -->
        <div class="p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
          <h4 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <i class="pi pi-chart-line text-gray-400"></i>
            Market Positioning
          </h4>
          <p class="text-xs text-gray-400">
            <strong>Competitive Differentiation:</strong> Unlike general-purpose blockchain platforms (Ethereum, Polygon) or DeFi-focused solutions, 
            Biatec Tokens prioritizes regulatory compliance and enterprise adoption. Our dashboard provides transparency into compliance status 
            that institutional investors and enterprise procurement teams require, inspired by leading RWA platforms like Polymath, Securitize, 
            and Tokeny, but optimized for the Algorand ecosystem (VOI/Aramid) with superior transaction costs and performance.
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="glass-effect rounded-xl p-6">
      <h3 class="text-xl font-semibold text-white mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <button
          @click="navigateToCompliance"
          class="px-4 py-3 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <i class="pi pi-shield-check"></i>
          Full Compliance Dashboard
        </button>
        <button
          @click="navigateToAttestations"
          class="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <i class="pi pi-verified"></i>
          Attestations
        </button>
        <button
          @click="navigateToExports"
          class="px-4 py-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <i class="pi pi-download"></i>
          Export Reports
        </button>
        <button
          @click="navigateToGuide"
          class="px-4 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <i class="pi pi-book"></i>
          Enterprise Guide
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Network } from '../types/compliance';

const router = useRouter();

interface NetworkSummary {
  readinessScore: number;
  auditExports: {
    ready: number;
    pending: number;
    total: number;
  };
  whitelistCoverage: {
    percentage: number;
    verified: number;
    total: number;
  };
}

interface ComplianceRequirement {
  label: string;
  description: string;
  met: boolean;
  status: 'compliant' | 'partial' | 'non-compliant';
  actionRequired: boolean;
  actionLabel?: string;
  action?: string;
}

const networks: Network[] = ['VOI', 'Aramid'];
const selectedNetwork = ref<Network>('VOI');
const isLoading = ref(false);
const isRefreshing = ref(false);

// Mock data - in production, this would come from API
const networkData = ref<Record<Network, NetworkSummary>>({
  VOI: {
    readinessScore: 75,
    auditExports: {
      ready: 3,
      pending: 1,
      total: 12
    },
    whitelistCoverage: {
      percentage: 68,
      verified: 856,
      total: 1258
    }
  },
  Aramid: {
    readinessScore: 82,
    auditExports: {
      ready: 5,
      pending: 0,
      total: 18
    },
    whitelistCoverage: {
      percentage: 85,
      verified: 642,
      total: 755
    }
  }
});

const networkSummary = computed(() => networkData.value[selectedNetwork.value]);

const readinessScoreColor = computed(() => {
  const score = networkSummary.value.readinessScore;
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
});

const readinessScoreBgClass = computed(() => {
  const score = networkSummary.value.readinessScore;
  if (score >= 80) return 'bg-green-500/10';
  if (score >= 60) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
});

const readinessScoreGradient = computed(() => {
  const score = networkSummary.value.readinessScore;
  if (score >= 80) return 'bg-gradient-to-r from-green-500 to-emerald-500';
  if (score >= 60) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
  return 'bg-gradient-to-r from-red-500 to-rose-500';
});

const readinessLabel = computed(() => {
  const score = networkSummary.value.readinessScore;
  if (score >= 80) return 'Enterprise Ready';
  if (score >= 60) return 'Good Progress';
  return 'Needs Attention';
});

const whitelistCoverageColor = computed(() => {
  const percentage = networkSummary.value.whitelistCoverage.percentage;
  if (percentage >= 70) return 'text-green-400';
  if (percentage >= 50) return 'text-yellow-400';
  return 'text-red-400';
});

const whitelistCoverageBgClass = computed(() => {
  const percentage = networkSummary.value.whitelistCoverage.percentage;
  if (percentage >= 70) return 'bg-green-500/10';
  if (percentage >= 50) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
});

const complianceRequirements = computed<ComplianceRequirement[]>(() => {
  const score = networkSummary.value.readinessScore;
  
  return [
    {
      label: 'Token Whitepaper',
      description: 'Comprehensive documentation of token economics',
      met: score > 60,
      status: score > 60 ? 'compliant' : 'non-compliant',
      actionRequired: score <= 60,
      actionLabel: 'Upload Document',
      action: 'upload-whitepaper'
    },
    {
      label: 'KYC/AML Policy',
      description: 'Know Your Customer procedures documented',
      met: score > 50,
      status: score > 50 ? 'compliant' : 'non-compliant',
      actionRequired: score <= 50,
      actionLabel: 'Configure KYC',
      action: 'configure-kyc'
    },
    {
      label: 'Transfer Restrictions',
      description: 'Whitelist-based transfer controls active',
      met: score > 40,
      status: score > 40 ? 'compliant' : 'partial',
      actionRequired: score <= 40,
      actionLabel: 'Enable Whitelist',
      action: 'enable-whitelist'
    },
    {
      label: 'Audit Trail',
      description: 'Comprehensive logging of all compliance actions',
      met: score > 70,
      status: score > 70 ? 'compliant' : 'partial',
      actionRequired: score <= 70,
      actionLabel: 'View Audit Logs',
      action: 'view-audit'
    }
  ];
});

const refreshData = async () => {
  isRefreshing.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  isRefreshing.value = false;
  console.log('Data refreshed');
};

const handleAction = (action?: string) => {
  switch (action) {
    case 'upload-whitepaper':
      console.log('Navigate to document upload');
      break;
    case 'configure-kyc':
      navigateToCompliance();
      break;
    case 'enable-whitelist':
      navigateToCompliance();
      break;
    case 'view-audit':
      navigateToCompliance();
      break;
  }
};

const navigateToCompliance = () => {
  router.push({ name: 'ComplianceDashboard', query: { network: selectedNetwork.value } });
};

const navigateToAttestations = () => {
  router.push({ name: 'AttestationsDashboard' });
};

const navigateToExports = () => {
  router.push({ name: 'ComplianceDashboard', query: { tab: 'exports' } });
};

const navigateToGuide = () => {
  router.push({ name: 'EnterpriseGuide' });
};

onMounted(() => {
  // Load initial data
  console.log('MICA Readiness Summary loaded');
});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
