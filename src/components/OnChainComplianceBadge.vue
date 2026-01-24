<template>
  <div>
    <!-- Badge Display -->
    <div 
      :class="[
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all',
        badgeClasses,
        showDetails ? 'ring-2 ring-offset-2 ring-offset-gray-900' : 'hover:opacity-80'
      ]"
      @click="showDetails = !showDetails"
      :title="badgeTitle"
    >
      <i :class="[badgeIcon, 'text-sm']"></i>
      <span class="text-xs font-semibold">{{ badgeLabel }}</span>
      <i v-if="hasArtifacts" class="pi pi-chevron-down text-xs transition-transform" :class="{ 'rotate-180': showDetails }"></i>
    </div>

    <!-- Drill-down Details Modal -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showDetails" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="showDetails = false">
          <div class="glass-effect rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" @click.stop>
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
              <div>
                <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                  <i :class="[badgeIcon, 'text-biatec-accent']"></i>
                  On-Chain Compliance Status
                </h2>
                <p class="text-sm text-gray-400 mt-1">
                  {{ tokenId }} on {{ network }}
                </p>
              </div>
              <button @click="showDetails = false" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <i class="pi pi-times text-gray-400"></i>
              </button>
            </div>

            <!-- Compliance Score -->
            <div class="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-300">MICA Readiness Score</span>
                <span :class="['text-2xl font-bold', scoreColor]">{{ complianceScore }}%</span>
              </div>
              <div class="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  :class="['absolute inset-y-0 left-0 rounded-full transition-all duration-500', scoreGradient]"
                  :style="{ width: `${complianceScore}%` }"
                ></div>
              </div>
            </div>

            <!-- On-Chain Signals -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i class="pi pi-link text-biatec-accent"></i>
                On-Chain Signals
              </h3>
              <div class="space-y-2">
                <div 
                  v-for="signal in onChainSignals" 
                  :key="signal.label"
                  class="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div class="flex items-center gap-2">
                    <i :class="[signal.verified ? 'pi pi-check-circle text-green-400' : 'pi pi-times-circle text-gray-500']"></i>
                    <span :class="[signal.verified ? 'text-white' : 'text-gray-400', 'text-sm']">{{ signal.label }}</span>
                  </div>
                  <span v-if="signal.value" class="text-xs text-gray-400 font-mono">{{ signal.value }}</span>
                </div>
              </div>
            </div>

            <!-- Required Artifacts -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i class="pi pi-file-check text-biatec-accent"></i>
                Required Artifacts
              </h3>
              <div class="space-y-3">
                <div 
                  v-for="artifact in requiredArtifacts" 
                  :key="artifact.type"
                  class="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-medium text-white">{{ artifact.label }}</span>
                        <span
                          :class="[
                            'px-2 py-0.5 text-xs rounded-full',
                            artifact.status === 'verified' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                            artifact.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                          ]"
                        >
                          {{ artifact.status }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-400">{{ artifact.description }}</p>
                    </div>
                  </div>
                  
                  <div v-if="artifact.link" class="mt-2">
                    <a 
                      :href="artifact.link" 
                      target="_blank" 
                      class="text-xs text-biatec-accent hover:text-biatec-accent/80 transition-colors flex items-center gap-1"
                    >
                      View Artifact <i class="pi pi-external-link"></i>
                    </a>
                  </div>
                  
                  <div v-if="artifact.hash" class="mt-2 text-xs">
                    <span class="text-gray-500">Hash: </span>
                    <span class="text-gray-400 font-mono">{{ artifact.hash }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Sources -->
            <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <i class="pi pi-info-circle text-blue-400"></i>
                Data Sources
              </h4>
              <ul class="text-xs text-gray-400 space-y-1">
                <li v-for="source in dataSources" :key="source" class="flex items-start gap-2">
                  <i class="pi pi-arrow-right text-blue-400 mt-0.5"></i>
                  <span>{{ source }}</span>
                </li>
              </ul>
            </div>

            <!-- Actions -->
            <div class="mt-6 flex items-center gap-3">
              <button
                @click="navigateToCompliance"
                class="flex-1 px-4 py-2 bg-biatec-accent text-gray-900 rounded-lg hover:bg-biatec-teal transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <i class="pi pi-shield-check"></i>
                Manage Compliance
              </button>
              <button
                @click="exportArtifacts"
                class="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
              >
                <i class="pi pi-download"></i>
                Export
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Network } from '../types/compliance';

interface Props {
  tokenId: string;
  network: Network;
  complianceScore?: number;
  variant?: 'badge' | 'full';
}

interface OnChainSignal {
  label: string;
  verified: boolean;
  value?: string;
}

interface RequiredArtifact {
  type: string;
  label: string;
  description: string;
  status: 'verified' | 'pending' | 'missing';
  link?: string;
  hash?: string;
}

const props = withDefaults(defineProps<Props>(), {
  complianceScore: 0,
  variant: 'badge'
});

const router = useRouter();
const showDetails = ref(false);

// Compute badge display properties
const badgeClasses = computed(() => {
  if (props.complianceScore >= 80) {
    return 'bg-green-500/20 text-green-400 border border-green-500/50 ring-green-500';
  } else if (props.complianceScore >= 50) {
    return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 ring-yellow-500';
  } else {
    return 'bg-red-500/20 text-red-400 border border-red-500/50 ring-red-500';
  }
});

const badgeIcon = computed(() => {
  if (props.complianceScore >= 80) {
    return 'pi pi-shield-check';
  } else if (props.complianceScore >= 50) {
    return 'pi pi-exclamation-triangle';
  } else {
    return 'pi pi-shield-x';
  }
});

const badgeLabel = computed(() => {
  if (props.complianceScore >= 80) {
    return 'MICA Ready';
  } else if (props.complianceScore >= 50) {
    return 'Partial Compliance';
  } else {
    return 'Non-Compliant';
  }
});

const badgeTitle = computed(() => {
  return `MICA Compliance Score: ${props.complianceScore}% - Click for details`;
});

const scoreColor = computed(() => {
  if (props.complianceScore >= 80) return 'text-green-400';
  if (props.complianceScore >= 50) return 'text-yellow-400';
  return 'text-red-400';
});

const scoreGradient = computed(() => {
  if (props.complianceScore >= 80) return 'bg-gradient-to-r from-green-500 to-emerald-500';
  if (props.complianceScore >= 50) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
  return 'bg-gradient-to-r from-red-500 to-rose-500';
});

// Mock data for on-chain signals (in production, this would come from API/blockchain)
const onChainSignals = computed<OnChainSignal[]>(() => {
  const isVoiOrAramid = props.network === 'VOI' || props.network === 'Aramid';
  
  return [
    {
      label: 'Whitelist Contract Deployed',
      verified: isVoiOrAramid && props.complianceScore > 30,
      value: isVoiOrAramid ? 'App ID: 12345' : undefined
    },
    {
      label: 'Transfer Restrictions Active',
      verified: isVoiOrAramid && props.complianceScore > 40,
      value: undefined
    },
    {
      label: 'KYC Registry Linked',
      verified: props.complianceScore > 60,
      value: props.complianceScore > 60 ? '856 verified' : undefined
    },
    {
      label: 'Issuer Controls Configured',
      verified: props.complianceScore > 50,
      value: undefined
    },
    {
      label: 'Audit Trail Enabled',
      verified: props.complianceScore > 70,
      value: undefined
    }
  ];
});

// Mock data for required artifacts (in production, this would come from API)
const requiredArtifacts = computed<RequiredArtifact[]>(() => {
  const baseArtifacts: RequiredArtifact[] = [
    {
      type: 'whitepaper',
      label: 'Token Whitepaper',
      description: 'Comprehensive documentation of token economics and use case',
      status: props.complianceScore > 70 ? 'verified' : props.complianceScore > 40 ? 'pending' : 'missing',
      // TODO: Integrate with actual document storage service
      link: undefined,
      hash: props.complianceScore > 70 ? '0x7a8f...' : undefined
    },
    {
      type: 'legal-opinion',
      label: 'Legal Opinion',
      description: 'Third-party legal assessment of regulatory compliance',
      status: props.complianceScore > 80 ? 'verified' : props.complianceScore > 50 ? 'pending' : 'missing',
      // TODO: Integrate with actual document storage service
      link: undefined,
      hash: props.complianceScore > 80 ? '0x9bc2...' : undefined
    },
    {
      type: 'kyc-policy',
      label: 'KYC/AML Policy',
      description: 'Know Your Customer and Anti-Money Laundering procedures',
      status: props.complianceScore > 60 ? 'verified' : props.complianceScore > 30 ? 'pending' : 'missing',
      // TODO: Integrate with actual document storage service
      link: undefined,
      hash: props.complianceScore > 60 ? '0x3def...' : undefined
    },
    {
      type: 'issuer-disclosure',
      label: 'Issuer Disclosure',
      description: 'Detailed information about token issuer and governance',
      status: props.complianceScore > 65 ? 'verified' : props.complianceScore > 35 ? 'pending' : 'missing',
      // TODO: Integrate with actual document storage service
      link: undefined,
      hash: props.complianceScore > 65 ? '0x5a1b...' : undefined
    }
  ];
  
  return baseArtifacts;
});

const hasArtifacts = computed(() => requiredArtifacts.value.length > 0);

const dataSources = computed(() => {
  const sources = [
    `${props.network} blockchain on-chain data`,
    'Token smart contract verification',
    'Whitelisting contract state'
  ];
  
  if (props.complianceScore > 60) {
    sources.push('Third-party KYC provider integration');
  }
  
  if (props.complianceScore > 70) {
    sources.push('Regulatory audit trail database');
  }
  
  return sources;
});

const navigateToCompliance = () => {
  showDetails.value = false;
  router.push({ 
    name: 'ComplianceDashboard', 
    params: { id: props.tokenId }, 
    query: { network: props.network } 
  });
};

const exportArtifacts = () => {
  // Mock export functionality
  const exportData = {
    tokenId: props.tokenId,
    network: props.network,
    complianceScore: props.complianceScore,
    onChainSignals: onChainSignals.value,
    requiredArtifacts: requiredArtifacts.value,
    exportedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `compliance-artifacts-${props.tokenId}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('Compliance artifacts exported successfully');
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.rotate-180 {
  transform: rotate(180deg);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
