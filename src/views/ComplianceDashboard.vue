<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <button @click="$router.back()" class="mb-4 text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
            <i class="pi pi-arrow-left"></i>
            <span>Back</span>
          </button>

          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <i class="pi pi-shield-check text-biatec-accent"></i>
                Compliance Dashboard
              </h1>
              <p class="text-gray-400">MICA-aligned compliance management for RWA tokens on VOI/Aramid</p>
            </div>
          </div>
        </div>

        <!-- MICA Compliance Dashboard Widgets -->
        <div v-if="tokenId" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <WhitelistCoverageWidget :token-id="tokenId" :network="selectedNetwork" @view-details="activeTab = 'whitelist'" />
          <IssuerStatusWidget v-if="issuerAddress" :issuer-address="issuerAddress" @view-details="showIssuerDetails" />
          <KycProviderStatusWidget :network="selectedNetwork" @view-details="showKycProviderDetails" />
          <RwaRiskFlagsWidget :network="selectedNetwork" @view-details="showRiskDetails" />
          <NetworkHealthWidget @view-details="showNetworkHealthDetails" />
          <SubscriptionTierGatingWidget @view-details="showSubscriptionDetails" @upgrade-tier="navigateToUpgrade" />
        </div>

        <!-- Legacy Compliance Status Cards (kept for backward compatibility) -->
        <div v-if="complianceStatus" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="glass-effect rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <i class="pi pi-list text-biatec-accent text-2xl"></i>
            </div>
            <div class="text-2xl font-bold text-white">{{ complianceStatus.whitelistCount }}</div>
            <div class="text-sm text-gray-400">Whitelisted Addresses</div>
          </div>

          <div class="glass-effect rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <i class="pi pi-server text-biatec-accent text-2xl"></i>
            </div>
            <div class="text-2xl font-bold text-white">{{ complianceStatus.network }}</div>
            <div class="text-sm text-gray-400">Network</div>
          </div>

          <div class="glass-effect rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <i class="pi pi-shield-check text-biatec-accent text-2xl"></i>
            </div>
            <div class="text-2xl font-bold text-white">
              <span :class="complianceStatus.whitelistEnabled ? 'text-green-400' : 'text-gray-400'">
                {{ complianceStatus.whitelistEnabled ? "Enabled" : "Disabled" }}
              </span>
            </div>
            <div class="text-sm text-gray-400">Whitelist Status</div>
          </div>

          <div class="glass-effect rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <i class="pi pi-chart-line text-biatec-accent text-2xl"></i>
            </div>
            <div class="text-2xl font-bold text-white">
              {{ complianceStatus.complianceScore || "N/A" }}
              <span v-if="complianceStatus.complianceScore" class="text-sm text-gray-400">/100</span>
            </div>
            <div class="text-sm text-gray-400">Compliance Score</div>
          </div>
        </div>

        <!-- MICA Compliance Summary Dashboard -->
        <div v-if="tokenId" class="mb-8">
          <MicaDashboardSummary :token-id="tokenId" :network="selectedNetwork" @navigate-to-whitelist="activeTab = 'whitelist'" @navigate-to-audit-log="activeTab = 'audit-log'" />
        </div>

        <!-- Compliance Issues Alert -->
        <div v-if="complianceStatus?.issues && complianceStatus.issues.length > 0" class="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <h3 class="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
            <i class="pi pi-exclamation-triangle"></i>
            Compliance Issues Detected
          </h3>
          <div class="space-y-2">
            <div v-for="(issue, index) in complianceStatus.issues" :key="index" class="p-3 bg-white/5 rounded-lg">
              <div class="flex items-start gap-3">
                <span :class="['px-2 py-0.5 text-xs font-medium rounded-full', issueSeverityClass(issue.severity)]">
                  {{ issue.severity.toUpperCase() }}
                </span>
                <div class="flex-1">
                  <div class="text-sm text-white font-medium mb-1">{{ issue.message }}</div>
                  <div class="text-xs text-gray-400">Category: {{ issue.category }} • {{ formatTimestamp(issue.timestamp) }}</div>
                  <div v-if="issue.affectedAddresses && issue.affectedAddresses.length > 0" class="text-xs text-gray-500 mt-1">Affected: {{ issue.affectedAddresses.length }} address(es)</div>
                </div>
              </div>
            </div>
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
        <div>
          <!-- Whitelist Management Tab -->
          <div v-if="activeTab === 'whitelist'">
            <MicaWhitelistManagement :token-id="tokenId" :network="selectedNetwork" />
          </div>

          <!-- Transfer Validation Tab -->
          <div v-if="activeTab === 'validation'">
            <TransferValidationForm :token-id="tokenId" />
          </div>

          <!-- Audit Log Tab -->
          <div v-if="activeTab === 'audit-log'">
            <AuditLogViewer :token-id="tokenId" :network="selectedNetwork" />
          </div>

          <!-- Exports Tab -->
          <div v-if="activeTab === 'exports'">
            <ComplianceExports :token-id="tokenId" :network="selectedNetwork" />
          </div>

          <!-- Attestation Tab -->
          <div v-if="activeTab === 'attestation'">
            <AttestationPanel :token-id="tokenId" :network="selectedNetwork" />
          </div>

          <!-- Checklist Tab -->
          <div v-if="activeTab === 'checklist'">
            <ComplianceChecklist />
          </div>

          <!-- Team & Access Tab -->
          <div v-if="activeTab === 'team-access'">
            <TeamAccessView />
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import MainLayout from "../layout/MainLayout.vue";
import MicaWhitelistManagement from "../components/MicaWhitelistManagement.vue";
import TransferValidationForm from "../components/TransferValidationForm.vue";
import AuditLogViewer from "../components/AuditLogViewer.vue";
import ComplianceChecklist from "../components/ComplianceChecklist.vue";
import MicaDashboardSummary from "../components/MicaDashboardSummary.vue";
import ComplianceExports from "../components/ComplianceExports.vue";
import AttestationPanel from "../components/AttestationPanel.vue";
import TeamAccessView from "../components/team/TeamAccessView.vue";
import WhitelistCoverageWidget from "../components/WhitelistCoverageWidget.vue";
import IssuerStatusWidget from "../components/IssuerStatusWidget.vue";
import KycProviderStatusWidget from "../components/KycProviderStatusWidget.vue";
import RwaRiskFlagsWidget from "../components/RwaRiskFlagsWidget.vue";
import NetworkHealthWidget from "../components/NetworkHealthWidget.vue";
import SubscriptionTierGatingWidget from "../components/SubscriptionTierGatingWidget.vue";
import { complianceService } from "../services/ComplianceService";
import type { ComplianceStatus } from "../types/compliance";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const { account } = useAuthStore();

const tokenId = computed(() => (route.params.id as string) || (route.query.tokenId as string));
const selectedNetwork = computed(() => (route.query.network as string) || "VOI");
const issuerAddress = computed(() => account || "");
const activeTab = ref("whitelist");
const complianceStatus = ref<ComplianceStatus | null>(null);
const isLoadingStatus = ref(false);

const tabs = [
  { id: "whitelist", label: "Whitelist Management", icon: "pi pi-users" },
  { id: "validation", label: "Transfer Validation", icon: "pi pi-shield-check" },
  { id: "audit-log", label: "Audit Log", icon: "pi pi-list" },
  { id: "exports", label: "Compliance Exports", icon: "pi pi-download" },
  { id: "attestation", label: "Attestation", icon: "pi pi-file-check" },
  { id: "checklist", label: "Compliance Checklist", icon: "pi pi-check-square" },
  { id: "team-access", label: "Team & Access", icon: "pi pi-id-card" },
];

const loadComplianceStatus = async () => {
  if (!tokenId.value) return;

  isLoadingStatus.value = true;

  try {
    complianceStatus.value = await complianceService.getComplianceStatus(tokenId.value, selectedNetwork.value);
  } catch (err) {
    console.error("Failed to load compliance status:", err);
    // Set default values if API call fails
    complianceStatus.value = {
      tokenId: tokenId.value,
      network: selectedNetwork.value as "VOI" | "Aramid",
      whitelistEnabled: true,
      whitelistCount: 0,
    };
  } finally {
    isLoadingStatus.value = false;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const issueSeverityClass = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-500/20 text-red-400 border border-red-500/50";
    case "high":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/50";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
    case "low":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/50";
    default:
      return "bg-gray-500/20 text-gray-400 border border-gray-500/50";
  }
};

// Widget navigation handlers
const showIssuerDetails = () => {
  // Navigate to issuer profile or show details modal
  console.log("Show issuer details");
  // Could open a modal or navigate to issuer profile page
};

const showRiskDetails = () => {
  // Navigate to risk management view
  console.log("Show risk details");
  // Could open a modal with detailed risk information
};

const showKycProviderDetails = () => {
  // Navigate to KYC provider configuration or show details modal
  console.log("Show KYC provider details");
  router.push({ path: "/settings", query: { tab: "kyc-providers" } });
};

const showNetworkHealthDetails = () => {
  // Navigate to network health dashboard
  console.log("Show network health details");
  // Could open a modal with network status details
};

const showSubscriptionDetails = () => {
  // Navigate to subscription/pricing page
  router.push({ path: "/subscription/pricing" });
};

const navigateToUpgrade = () => {
  // Navigate to subscription upgrade flow
  router.push({ path: "/subscription/pricing", query: { action: "upgrade" } });
};

onMounted(() => {
  loadComplianceStatus();
});
</script>
