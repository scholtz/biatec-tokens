<template>
  <Modal :show="isOpen" @close="handleClose">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-biatec-accent/20 flex items-center justify-center">
          <i class="pi pi-check-circle text-biatec-accent text-xl"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Review Deployment</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Confirm your token details before deploying</p>
        </div>
      </div>
    </template>

    <!-- Deployment Summary -->
    <div class="space-y-4">
      <!-- Network Information -->
      <div class="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h4 class="text-sm font-semibold text-blue-400 mb-1 flex items-center gap-2">
              <i class="pi pi-server"></i>
              Target Network
            </h4>
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ networkDisplayName }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ networkGenesisId }}</p>
          </div>
          <span
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="isTestnet ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'"
          >
            {{ isTestnet ? "Testnet" : "Mainnet" }}
          </span>
        </div>

        <!-- Fee Breakdown -->
        <div class="space-y-2 pt-3 border-t border-blue-500/20">
          <h5 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Fees</h5>
          <div class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Creation Fee:</span>
              <span class="font-mono font-semibold text-gray-900 dark:text-white">{{ fees.creation }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Transaction Fee:</span>
              <span class="font-mono font-semibold text-gray-900 dark:text-white">{{ fees.transaction }}</span>
            </div>
            <div class="flex items-center justify-between text-sm pt-2 border-t border-blue-500/20">
              <span class="text-gray-900 dark:text-white font-semibold">Total Estimated Cost:</span>
              <span class="font-mono font-bold text-biatec-accent">{{ totalFee }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Token Details -->
      <div class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <i class="pi pi-info-circle text-biatec-accent"></i>
          Token Details
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ tokenName }}</p>
          </div>
          <div class="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Symbol</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ tokenSymbol }}</p>
          </div>
          <div class="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Standard</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ standard }}</p>
          </div>
          <div class="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ tokenType }}</p>
          </div>
          <div class="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Supply</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ formattedSupply }}</p>
          </div>
          <div v-if="decimals !== undefined" class="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Decimals</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ decimals }}</p>
          </div>
        </div>
      </div>

      <!-- Compliance Status (if applicable) -->
      <div v-if="hasCompliance" class="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
        <h4 class="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
          <i class="pi pi-shield-check"></i>
          MICA Compliance Status
        </h4>
        <div class="space-y-1 text-xs">
          <div v-if="attestationsCount > 0" class="flex items-center gap-2">
            <i class="pi pi-check text-green-500"></i>
            <span class="text-gray-300">{{ attestationsCount }} attestation(s) included</span>
          </div>
          <div v-if="hasComplianceMetadata" class="flex items-center gap-2">
            <i class="pi pi-check text-green-500"></i>
            <span class="text-gray-300">MICA compliance metadata attached</span>
          </div>
          <p class="text-gray-400 mt-2">This token deployment includes regulatory compliance information for audit trail purposes.</p>
        </div>
      </div>

      <!-- Important Warnings -->
      <div class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-yellow-400 text-lg mt-0.5"></i>
          <div class="flex-1 space-y-2">
            <p class="text-sm font-semibold text-yellow-400">Important Reminders</p>
            <ul class="text-xs text-gray-300 space-y-1 ml-4 list-disc">
              <li>Deployment is irreversible once confirmed</li>
              <li>Ensure you have sufficient funds to cover fees</li>
              <li>Your wallet will prompt you to sign the transaction</li>
              <li>Network congestion may affect deployment time</li>
              <li v-if="!isTestnet">You're deploying to mainnet - real assets will be used</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Deployment Checklist -->
      <div class="space-y-2">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Pre-Deployment Checklist</h4>
        <div class="space-y-2">
          <label
            class="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
          >
            <input type="checkbox" v-model="checklist.reviewedDetails" class="w-4 h-4 text-biatec-accent border-gray-300 rounded focus:ring-biatec-accent" />
            <span class="text-sm text-gray-700 dark:text-gray-300">I have reviewed all token details</span>
          </label>
          <label
            class="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
          >
            <input type="checkbox" v-model="checklist.confirmedNetwork" class="w-4 h-4 text-biatec-accent border-gray-300 rounded focus:ring-biatec-accent" />
            <span class="text-sm text-gray-700 dark:text-gray-300">I confirm the target network is correct</span>
          </label>
          <label
            class="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
          >
            <input type="checkbox" v-model="checklist.understoodFees" class="w-4 h-4 text-biatec-accent border-gray-300 rounded focus:ring-biatec-accent" />
            <span class="text-sm text-gray-700 dark:text-gray-300">I understand the fees involved</span>
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          @click="handleClose"
          :disabled="isDeploying"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          @click="handleConfirm"
          :disabled="!canConfirm || isDeploying"
          class="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-biatec-accent to-purple-600 rounded-lg hover:shadow-lg hover:shadow-biatec-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <i v-if="isDeploying" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-check"></i>
          <span>{{ isDeploying ? "Deploying..." : "Confirm & Deploy" }}</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import Modal from "./ui/Modal.vue";

interface Props {
  isOpen: boolean;
  tokenName: string;
  tokenSymbol: string;
  standard: string;
  tokenType: "FT" | "NFT";
  supply: number;
  decimals?: number;
  networkDisplayName: string;
  networkGenesisId: string;
  isTestnet: boolean;
  fees: {
    creation: string;
    transaction: string;
    description?: string;
  };
  attestationsCount?: number;
  hasComplianceMetadata?: boolean;
  isDeploying?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  attestationsCount: 0,
  hasComplianceMetadata: false,
  isDeploying: false,
});

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const checklist = ref({
  reviewedDetails: false,
  confirmedNetwork: false,
  understoodFees: false,
});

const formattedSupply = computed(() => {
  return props.supply.toLocaleString("en-US");
});

const totalFee = computed(() => {
  // Extract numeric values from fee strings and calculate total
  const creationValue = parseFloat(props.fees.creation.replace(/[^0-9.]/g, "")) || 0;
  const transactionValue = parseFloat(props.fees.transaction.replace(/[^0-9.]/g, "")) || 0;
  const total = creationValue + transactionValue;

  // Extract unit from creation fee (e.g., "VOI", "ALGO")
  const unit = props.fees.creation.replace(/[0-9.\s]/g, "").trim() || "";

  return `${total.toFixed(4)} ${unit}`;
});

const hasCompliance = computed(() => {
  return props.attestationsCount > 0 || props.hasComplianceMetadata;
});

const canConfirm = computed(() => {
  return checklist.value.reviewedDetails && checklist.value.confirmedNetwork && checklist.value.understoodFees;
});

const handleClose = () => {
  if (!props.isDeploying) {
    resetChecklist();
    emit("close");
  }
};

const handleConfirm = () => {
  if (canConfirm.value && !props.isDeploying) {
    emit("confirm");
  }
};

const resetChecklist = () => {
  checklist.value = {
    reviewedDetails: false,
    confirmedNetwork: false,
    understoodFees: false,
  };
};
</script>
