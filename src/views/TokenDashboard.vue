<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Token Dashboard</h1>
          <p class="text-gray-300 text-lg">Monitor and manage your deployed tokens</p>
        </div>

        <!-- MICA Readiness Summary -->
        <div class="mb-8">
          <MicaReadinessSummary />
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="glass-effect rounded-xl p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-400">Total Tokens</h3>
              <i class="pi pi-chart-line text-biatec-accent"></i>
            </div>
            <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ totalTokens }}</div>
            <div class="text-sm text-gray-400 mt-1">Across all standards</div>
          </div>

          <div class="glass-effect rounded-xl p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-400">Deployed</h3>
              <i class="pi pi-check-circle text-green-400"></i>
            </div>
            <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ deployedTokens }}</div>
            <div class="text-sm text-gray-400 mt-1">Successfully deployed</div>
          </div>

          <div class="glass-effect rounded-xl p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-400">Deploying</h3>
              <i class="pi pi-spin pi-spinner text-yellow-400"></i>
            </div>
            <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ deployingTokens }}</div>
            <div class="text-sm text-gray-400 mt-1">In progress</div>
          </div>

          <div class="glass-effect rounded-xl p-6 cursor-pointer hover:border-biatec-accent/50 transition-colors" @click="navigateToCompliance">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-400">MICA Compliance</h3>
              <i class="pi pi-shield-check text-biatec-accent"></i>
            </div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">Enterprise</div>
            <div class="text-sm text-biatec-accent mt-1 flex items-center gap-1">
              Manage Compliance
              <i class="pi pi-arrow-right text-xs"></i>
            </div>
          </div>
        </div>

        <!-- Filters and Actions -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <div class="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-4">
              <select v-model="selectedStandardFilter" class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-biatec-accent">
                <option value="">All Standards</option>
                <option value="ASA">ASA</option>
                <option value="ARC3FT">ARC3 FT</option>
                <option value="ARC3NFT">ARC3 NFT</option>
                <option value="ARC3FNFT">ARC3 Fractional NFT</option>
                <option value="ARC19">ARC19</option>
                <option value="ARC69">ARC69</option>
                <option value="ARC200">ARC200</option>
                <option value="ARC72">ARC72</option>
                <option value="ERC20">ERC20</option>
                <option value="ERC721">ERC721</option>
              </select>

              <select v-model="selectedStatusFilter" class="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-biatec-accent">
                <option value="">All Status</option>
                <option value="created">Created</option>
                <option value="deploying">Deploying</option>
                <option value="deployed">Deployed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div class="flex items-center space-x-4">
              <button @click="refreshTokens" class="px-4 py-2 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors">
                <i class="pi pi-sync mr-2"></i>
                Refresh
              </button>
              <router-link to="/create" class="btn-primary px-4 py-2 rounded-lg text-gray-900 dark:text-white font-medium flex items-center space-x-2">
                <i class="pi pi-plus"></i>
                <span>Create Token</span>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Tokens Grid -->
        <div v-if="filteredTokens.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TokenCard v-for="token in filteredTokens" :key="token.id" :token="token" @delete="deleteToken" />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="glass-effect rounded-xl p-12 max-w-md mx-auto">
            <i class="pi pi-coins text-6xl text-gray-400 mb-6"></i>
            <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">No Tokens Found</h3>
            <p class="text-gray-300 mb-6">
              {{ tokens.length === 0 ? "Create your first token to get started" : "No tokens match your current filters" }}
            </p>
            <router-link to="/create" class="btn-primary px-6 py-3 rounded-xl text-gray-900 dark:text-white font-medium inline-flex items-center space-x-2">
              <i class="pi pi-plus"></i>
              <span>Create Token</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useTokenStore } from "../stores/tokens";
import TokenCard from "../components/TokenCard.vue";
import MainLayout from "../layout/MainLayout.vue";
import MicaReadinessSummary from "../components/MicaReadinessSummary.vue";

const router = useRouter();
const tokenStore = useTokenStore();

const selectedStandardFilter = ref("");
const selectedStatusFilter = ref("");

const tokens = computed(() => tokenStore.tokens);
const totalTokens = computed(() => tokenStore.totalTokens);
const deployedTokens = computed(() => tokenStore.deployedTokens);
const deployingTokens = computed(() => tokens.value.filter((t) => t.status === "deploying").length);

const filteredTokens = computed(() => {
  let filtered = tokens.value;

  if (selectedStandardFilter.value) {
    filtered = filtered.filter((token) => token.standard === selectedStandardFilter.value);
  }

  if (selectedStatusFilter.value) {
    filtered = filtered.filter((token) => token.status === selectedStatusFilter.value);
  }

  // Sort by creation date (newest first)
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
});

const deleteToken = (tokenId: string) => {
  if (confirm("Are you sure you want to delete this token?")) {
    tokenStore.deleteToken(tokenId);
  }
};

const refreshTokens = () => {
  // In a real app, this would fetch the latest data from the API
  console.log("Refreshing tokens...");
};

const navigateToCompliance = () => {
  // Navigate to compliance dashboard
  router.push({ name: 'ComplianceDashboard' });
};
</script>
