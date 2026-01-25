<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header with Back Button -->
        <div class="mb-8">
          <button @click="$router.back()" class="mb-4 text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
            <i class="pi pi-arrow-left"></i>
            <span>Back to Dashboard</span>
          </button>

          <div v-if="token" class="flex items-start justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-biatec-accent to-biatec-teal flex items-center justify-center">
                <img v-if="token.imageUrl" :src="token.imageUrl" :alt="token.name" class="w-full h-full object-cover" />
                <i v-else class="pi pi-coins text-white text-2xl"></i>
              </div>
              <div>
                <h1 class="text-4xl font-bold text-white mb-2">{{ token.name }}</h1>
                <p class="text-gray-400">{{ token.symbol }} • {{ token.standard }}</p>
                <!-- On-Chain Compliance Badge for VOI/Aramid tokens -->
                <div v-if="isVoiOrAramidToken" class="mt-2">
                  <OnChainComplianceBadge :token-id="tokenId" :network="getTokenNetwork()" :compliance-score="getComplianceScore()" />
                </div>
              </div>
            </div>
            <span :class="statusClass(token.status)" class="px-3 py-1 text-sm font-medium rounded-full">
              {{ token.status }}
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="mb-8">
          <div class="border-b border-gray-700">
            <nav class="-mb-px flex space-x-8">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  activeTab === tab.id ? 'border-biatec-accent text-white' : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2',
                ]"
              >
                <i :class="tab.icon"></i>
                <span>{{ tab.label }}</span>
              </button>
            </nav>
          </div>
        </div>

        <!-- Tab Content -->
        <div v-if="token">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="space-y-6">
            <div class="glass-effect rounded-xl p-6">
              <h3 class="text-xl font-semibold text-white mb-4">Token Details</h3>
              <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt class="text-sm text-gray-400">Type</dt>
                  <dd class="text-white font-medium">{{ token.type }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400">Total Supply</dt>
                  <dd class="text-white font-medium">{{ token.supply.toLocaleString("en-US") }}</dd>
                </div>
                <div v-if="token.decimals !== undefined">
                  <dt class="text-sm text-gray-400">Decimals</dt>
                  <dd class="text-white font-medium">{{ token.decimals }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-gray-400">Created At</dt>
                  <dd class="text-white font-medium">{{ formatDate(token.createdAt) }}</dd>
                </div>
                <div v-if="token.assetId" class="md:col-span-2">
                  <dt class="text-sm text-gray-400">Asset ID</dt>
                  <dd class="text-white font-medium font-mono">{{ token.assetId }}</dd>
                </div>
                <div v-if="token.contractAddress" class="md:col-span-2">
                  <dt class="text-sm text-gray-400">Contract Address</dt>
                  <dd class="text-white font-medium font-mono break-all">{{ token.contractAddress }}</dd>
                </div>
                <div v-if="token.txId" class="md:col-span-2">
                  <dt class="text-sm text-gray-400">Transaction ID</dt>
                  <dd class="text-white font-medium font-mono break-all">{{ token.txId }}</dd>
                </div>
              </dl>
            </div>

            <div v-if="token.description" class="glass-effect rounded-xl p-6">
              <h3 class="text-xl font-semibold text-white mb-4">Description</h3>
              <p class="text-gray-300">{{ token.description }}</p>
            </div>

            <div v-if="token.attributes && token.attributes.length > 0" class="glass-effect rounded-xl p-6">
              <h3 class="text-xl font-semibold text-white mb-4">Attributes</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div v-for="attr in token.attributes" :key="attr.trait_type" class="bg-white/5 rounded-lg p-3">
                  <dt class="text-xs text-gray-400 mb-1">{{ attr.trait_type }}</dt>
                  <dd class="text-white font-medium">{{ attr.value }}</dd>
                </div>
              </div>
            </div>

            <!-- Attestation Metadata -->
            <div v-if="token.attestationMetadata && token.attestationMetadata.enabled" class="glass-effect rounded-xl p-6">
              <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <i class="pi pi-verified text-biatec-accent"></i>
                Wallet Attestation & Compliance
              </h3>

              <!-- Compliance Summary -->
              <div v-if="token.attestationMetadata.complianceSummary" class="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
                <div class="flex items-center gap-2 mb-3">
                  <i class="pi pi-info-circle text-blue-400"></i>
                  <span class="text-sm font-semibold text-white">Compliance Status</span>
                  <span
                    :class="[
                      'ml-auto px-2 py-1 text-xs rounded-full',
                      token.attestationMetadata.complianceSummary.overallStatus === 'compliant'
                        ? 'bg-green-500/20 text-green-400'
                        : token.attestationMetadata.complianceSummary.overallStatus === 'partial'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400',
                    ]"
                  >
                    {{ token.attestationMetadata.complianceSummary.overallStatus }}
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div class="flex items-center gap-2 text-sm">
                    <i :class="['pi', token.attestationMetadata.complianceSummary.kycCompliant ? 'pi-check-circle text-green-400' : 'pi-times-circle text-gray-500']"></i>
                    <span :class="token.attestationMetadata.complianceSummary.kycCompliant ? 'text-white' : 'text-gray-400'"> KYC/AML Verified </span>
                  </div>

                  <div class="flex items-center gap-2 text-sm">
                    <i :class="['pi', token.attestationMetadata.complianceSummary.accreditedInvestor ? 'pi-check-circle text-green-400' : 'pi-times-circle text-gray-500']"></i>
                    <span :class="token.attestationMetadata.complianceSummary.accreditedInvestor ? 'text-white' : 'text-gray-400'"> Accredited Investor </span>
                  </div>

                  <div class="flex items-center gap-2 text-sm">
                    <i :class="['pi', token.attestationMetadata.complianceSummary.jurisdictionApproved ? 'pi-check-circle text-green-400' : 'pi-times-circle text-gray-500']"></i>
                    <span :class="token.attestationMetadata.complianceSummary.jurisdictionApproved ? 'text-white' : 'text-gray-400'"> Jurisdiction Approved </span>
                  </div>
                </div>
              </div>

              <!-- Attestations List -->
              <div class="space-y-3">
                <h4 class="text-sm font-semibold text-gray-300 mb-3">Attestations ({{ token.attestationMetadata.attestations.length }})</h4>
                <div v-for="attestation in token.attestationMetadata.attestations" :key="attestation.id" class="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-file-check text-biatec-accent"></i>
                      <span class="text-sm font-medium text-white">{{ getAttestationTypeLabelLocal(attestation.type) }}</span>
                    </div>
                    <span
                      :class="[
                        'px-2 py-0.5 text-xs rounded-full',
                        attestation.status === 'verified' ? 'bg-green-500/20 text-green-400' : attestation.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400',
                      ]"
                    >
                      {{ attestation.status }}
                    </span>
                  </div>

                  <dl class="space-y-2 text-xs">
                    <div v-if="attestation.proofHash">
                      <dt class="text-gray-400 inline">Proof Hash:</dt>
                      <dd class="text-gray-300 inline ml-2 font-mono">{{ attestation.proofHash }}</dd>
                    </div>

                    <div v-if="attestation.documentUrl">
                      <dt class="text-gray-400 inline">Document:</dt>
                      <dd class="text-gray-300 inline ml-2">
                        <a :href="attestation.documentUrl" target="_blank" class="text-biatec-accent hover:underline"> View Document <i class="pi pi-external-link text-xs"></i> </a>
                      </dd>
                    </div>

                    <div v-if="attestation.verifiedAt">
                      <dt class="text-gray-400 inline">Verified:</dt>
                      <dd class="text-gray-300 inline ml-2">
                        {{ formatDate(new Date(attestation.verifiedAt)) }}
                        <span v-if="attestation.verifiedBy" class="text-gray-400">by {{ attestation.verifiedBy }}</span>
                      </dd>
                    </div>

                    <div v-if="attestation.expiresAt">
                      <dt class="text-gray-400 inline">Expires:</dt>
                      <dd class="text-gray-300 inline ml-2">{{ formatDate(new Date(attestation.expiresAt)) }}</dd>
                    </div>

                    <div v-if="attestation.notes">
                      <dt class="text-gray-400">Notes:</dt>
                      <dd class="text-gray-300 mt-1">{{ attestation.notes }}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <!-- Metadata Timestamps -->
              <div class="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
                <div class="flex justify-between">
                  <span>Attestation Created: {{ formatDate(new Date(token.attestationMetadata.createdAt)) }}</span>
                  <span>Last Updated: {{ formatDate(new Date(token.attestationMetadata.updatedAt)) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Whitelist Tab -->
          <div v-if="activeTab === 'whitelist'">
            <WhitelistManagement :token-id="tokenId" />
          </div>

          <!-- Compliance Tab -->
          <div v-if="activeTab === 'compliance'">
            <div class="space-y-6">
              <div class="glass-effect rounded-xl p-6">
                <h3 class="text-xl font-semibold text-white mb-4">Quick Access</h3>
                <p class="text-gray-400 mb-4">Access the full compliance dashboard with whitelist management, transfer validation, and audit logs.</p>
                <router-link
                  :to="`/compliance/${tokenId}?network=VOI`"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-biatec-accent text-gray-900 rounded-lg hover:bg-biatec-teal transition-colors font-medium"
                >
                  <i class="pi pi-shield-check"></i>
                  Open Compliance Dashboard
                </router-link>
              </div>

              <ComplianceChecklist />
            </div>
          </div>

          <!-- Audit Trail Tab -->
          <div v-if="activeTab === 'audit'">
            <!-- Note: network prop is intentionally omitted to show audit logs from all networks.
                 Users can filter by network using the dropdown in AuditLogViewer. -->
            <AuditLogViewer :token-id="tokenId" />
          </div>
        </div>

        <!-- Loading State -->
        <div v-else class="glass-effect rounded-xl p-12 text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
          <p class="text-gray-400">Loading token details...</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useTokenStore } from "../stores/tokens";
import MainLayout from "../layout/MainLayout.vue";
import WhitelistManagement from "../components/WhitelistManagement.vue";
import ComplianceChecklist from "../components/ComplianceChecklist.vue";
import AuditLogViewer from "../components/AuditLogViewer.vue";
import OnChainComplianceBadge from "../components/OnChainComplianceBadge.vue";
import type { AttestationType, Network } from "../types/compliance";
import { getAttestationTypeLabel } from "../utils/attestation";
import { isAlgorandBasedToken, calculateComplianceScore, getDefaultNetwork } from "../utils/compliance";

const route = useRoute();
const tokenStore = useTokenStore();

const tokenId = computed(() => route.params.id as string);
const token = computed(() => tokenStore.tokens.find((t) => t.id === tokenId.value));

const activeTab = ref("overview");

const tabs = [
  { id: "overview", label: "Overview", icon: "pi pi-info-circle" },
  { id: "whitelist", label: "Whitelist", icon: "pi pi-list" },
  { id: "compliance", label: "Compliance", icon: "pi pi-shield-check" },
  { id: "audit", label: "Audit Trail", icon: "pi pi-history" },
];

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getAttestationTypeLabelLocal = (type: AttestationType): string => {
  return getAttestationTypeLabel(type);
};

const statusClass = (status: string) => {
  switch (status) {
    case "deployed":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "deploying":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "failed":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "created":
    default:
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  }
};

const isVoiOrAramidToken = computed(() => {
  if (!token.value) return false;
  return isAlgorandBasedToken(token.value.standard);
});

const getTokenNetwork = (): Network => {
  return getDefaultNetwork();
};

const getComplianceScore = (): number => {
  if (!token.value) return 0;
  return calculateComplianceScore(token.value);
};

onMounted(() => {
  // If the token is not found, redirect back to dashboard
  if (!token.value) {
    console.error("Token not found");
    // In a real app, you might want to fetch the token from the API here
  }
});
</script>
