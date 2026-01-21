<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header with Back Button -->
        <div class="mb-8">
          <button
            @click="$router.back()"
            class="mb-4 text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
          >
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
              </div>
            </div>
            <span
              :class="statusClass(token.status)"
              class="px-3 py-1 text-sm font-medium rounded-full"
            >
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
                  activeTab === tab.id
                    ? 'border-biatec-accent text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2'
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
                  <dd class="text-white font-medium">{{ token.supply.toLocaleString() }}</dd>
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
          </div>

          <!-- Whitelist Tab -->
          <div v-if="activeTab === 'whitelist'">
            <WhitelistManagement :token-id="tokenId" />
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTokenStore } from '../stores/tokens';
import MainLayout from '../layout/MainLayout.vue';
import WhitelistManagement from '../components/WhitelistManagement.vue';

const route = useRoute();
const tokenStore = useTokenStore();

const tokenId = computed(() => route.params.id as string);
const token = computed(() => tokenStore.tokens.find(t => t.id === tokenId.value));

const activeTab = ref('overview');

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'pi pi-info-circle' },
  { id: 'whitelist', label: 'Whitelist', icon: 'pi pi-list' },
];

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const statusClass = (status: string) => {
  switch (status) {
    case 'deployed':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'deploying':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'failed':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'created':
    default:
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  }
};

onMounted(() => {
  // If the token is not found, redirect back to dashboard
  if (!token.value) {
    console.error('Token not found');
    // In a real app, you might want to fetch the token from the API here
  }
});
</script>
