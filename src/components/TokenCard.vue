<template>
  <div class="token-card glass-effect rounded-xl p-6 hover:shadow-xl transition-all duration-300">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-biatec-accent to-biatec-teal flex items-center justify-center">
          <img v-if="token.imageUrl" :src="token.imageUrl" :alt="token.name" class="w-full h-full object-cover" />
          <i v-else class="pi pi-image text-white text-xl"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white">{{ token.name }}</h3>
          <p class="text-sm text-gray-300">{{ token.symbol }}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="px-2 py-1 text-xs font-medium rounded-full">
          {{ token.standard }}
        </span>
        <span class="px-2 py-1 text-xs font-medium rounded-full">
          {{ token.status }}
        </span>
      </div>
    </div>

    <!-- On-Chain Compliance Badge for VOI/Aramid tokens -->
    <div v-if="isVoiOrAramidToken" class="mb-3">
      <OnChainComplianceBadge
        :token-id="token.id"
        :network="getTokenNetwork()"
        :compliance-score="getComplianceScore()"
        variant="badge"
      />
    </div>

    <!-- MICA Compliance Badge -->
    <div class="mb-3 flex items-center justify-between">
      <span class="text-xs text-gray-400">MICA Readiness:</span>
      <div class="flex items-center gap-2">
        <MicaReadinessBadge :token-id="token.id" size="sm" />
        <button
          @click="showComplianceModal = true"
          class="p-1 rounded text-xs text-biatec-accent hover:bg-biatec-accent/10 transition-colors"
          title="View MICA Checklist"
        >
          <i class="pi pi-list-check"></i>
        </button>
      </div>
    </div>

    <p class="text-gray-300 text-sm mb-4 line-clamp-2">{{ token.description }}</p>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="text-center">
        <p class="text-xs text-gray-400">Type</p>
        <p class="text-sm font-semibold text-white">{{ token.type }}</p>
      </div>
      <div class="text-center">
        <p class="text-xs text-gray-400">Supply</p>
        <p class="text-sm font-semibold text-white">{{ formatSupply(token.supply) }}</p>
      </div>
    </div>

    <div v-if="token.status === 'deployed'" class="space-y-2 mb-4">
      <div v-if="token.assetId" class="flex justify-between items-center text-xs">
        <span class="text-gray-400">Asset ID:</span>
        <span class="text-biatec-accent font-mono">{{ token.assetId }}</span>
      </div>
      <div v-if="token.contractAddress" class="flex justify-between items-center text-xs">
        <span class="text-gray-400">Contract:</span>
        <span class="text-biatec-accent font-mono">{{ token.contractAddress.slice(0, 10) }}...</span>
      </div>
      <div v-if="token.txId" class="flex justify-between items-center text-xs">
        <span class="text-gray-400">Tx ID:</span>
        <span class="text-biatec-accent font-mono">{{ token.txId.slice(0, 10) }}...</span>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-xs text-gray-400">
        {{ formatDate(token.createdAt) }}
      </span>
      <div class="flex items-center space-x-2">
        <router-link
          :to="`/tokens/${token.id}`"
          class="p-2 rounded-lg bg-biatec-accent/20 text-biatec-accent hover:bg-biatec-accent/30 transition-colors"
          title="View Details"
        >
          <i class="pi pi-eye text-sm"></i>
        </router-link>
        <button
          v-if="token.status === 'deployed'"
          @click="copyToClipboard"
          class="p-2 rounded-lg bg-biatec-accent/20 text-biatec-accent hover:bg-biatec-accent/30 transition-colors"
          title="Copy Details"
        >
          <i class="pi pi-copy text-sm"></i>
        </button>
        <button @click="$emit('delete', token.id)" class="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Delete Token">
          <i class="pi pi-trash text-sm"></i>
        </button>
      </div>
    </div>

    <!-- MICA Compliance Modal -->
    <Modal :show="showComplianceModal" @close="showComplianceModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          MICA Compliance - {{ token.name }}
        </h3>
      </template>
      <TokenComplianceChecklist :token-id="token.id" :show-compliance-link="true" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Token } from "../stores/tokens";
import OnChainComplianceBadge from './OnChainComplianceBadge.vue';
import MicaReadinessBadge from './MicaReadinessBadge.vue';
import TokenComplianceChecklist from './TokenComplianceChecklist.vue';
import Modal from './ui/Modal.vue';
import type { Network } from '../types/compliance';
import { isAlgorandBasedToken, calculateComplianceScore, getDefaultNetwork } from '../utils/compliance';

const props = defineProps<{
  token: Token;
}>();

defineEmits<{
  delete: [id: string];
}>();

const showComplianceModal = ref(false);

const isVoiOrAramidToken = computed(() => {
  return isAlgorandBasedToken(props.token.standard);
});

const getTokenNetwork = (): Network => {
  return getDefaultNetwork();
};

const getComplianceScore = (): number => {
  return calculateComplianceScore(props.token);
};

const formatSupply = (supply: number) => {
  if (supply >= 1000000) {
    return (supply / 1000000).toFixed(1) + "M";
  } else if (supply >= 1000) {
    return (supply / 1000).toFixed(1) + "K";
  }
  return supply.toString();
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const copyToClipboard = async () => {
  const details = {
    name: props.token.name,
    symbol: props.token.symbol,
    standard: props.token.standard,
    assetId: props.token.assetId,
    contractAddress: props.token.contractAddress,
    txId: props.token.txId,
  };

  try {
    await navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    // You could show a toast notification here
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
