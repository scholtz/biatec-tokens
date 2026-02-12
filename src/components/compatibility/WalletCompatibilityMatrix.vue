<template>
  <div class="wallet-compatibility-matrix">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h3 class="text-2xl font-bold text-white mb-2">
          Wallet Compatibility Matrix
        </h3>
        <p class="text-gray-300">
          How popular Algorand wallets display different token standards.
          Last updated: {{ lastVerified }}
        </p>
      </div>

      <!-- Matrix Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <!-- Table Header -->
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left p-4 text-gray-300 font-semibold">Wallet</th>
              <th 
                v-for="standard in standards" 
                :key="standard" 
                class="text-center p-4 text-gray-300 font-semibold"
              >
                {{ standard }}
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody>
            <tr 
              v-for="wallet in wallets" 
              :key="wallet.id"
              class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <!-- Wallet Name Column -->
              <td class="p-4">
                <div class="flex items-center space-x-3">
                  <div>
                    <div class="font-semibold text-white">{{ wallet.name }}</div>
                    <div class="text-sm text-gray-400">
                      <a 
                        :href="wallet.website" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="hover:text-blue-400 transition-colors"
                      >
                        {{ wallet.website.replace('https://', '') }}
                      </a>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Standard Support Columns -->
              <td 
                v-for="standard in standards" 
                :key="standard" 
                class="text-center p-4"
              >
                <div 
                  v-if="getSupport(wallet.id, standard)"
                  class="inline-flex items-center justify-center"
                >
                  <Badge
                    :variant="getBadgeVariant(getSupport(wallet.id, standard)!.displayQuality)"
                    class="cursor-pointer"
                    @click="showDetails(wallet, standard)"
                  >
                    {{ getQualityLabel(getSupport(wallet.id, standard)!.displayQuality) }}
                  </Badge>
                </div>
                <div v-else class="text-gray-600">
                  —
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="bg-gray-800/50 rounded-lg p-4">
        <h4 class="text-sm font-semibold text-gray-300 mb-3">Display Quality Legend</h4>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="flex items-center space-x-2">
            <Badge variant="success">Excellent</Badge>
            <span class="text-xs text-gray-400">Full support, great UX</span>
          </div>
          <div class="flex items-center space-x-2">
            <Badge variant="info">Good</Badge>
            <span class="text-xs text-gray-400">Supported, minor issues</span>
          </div>
          <div class="flex items-center space-x-2">
            <Badge variant="warning">Partial</Badge>
            <span class="text-xs text-gray-400">Limited support</span>
          </div>
          <div class="flex items-center space-x-2">
            <Badge variant="error">Poor</Badge>
            <span class="text-xs text-gray-400">Minimal/no support</span>
          </div>
          <div class="flex items-center space-x-2">
            <Badge variant="default">None</Badge>
            <span class="text-xs text-gray-400">Not supported</span>
          </div>
        </div>
      </div>

      <!-- Details Modal -->
      <Modal :show="showDetailsModal" @close="closeDetails">
        <template #header>
          <h3 class="text-xl font-bold text-white">
            {{ selectedWallet?.name }} - {{ selectedStandard }} Support
          </h3>
        </template>

        <template #body>
          <div v-if="selectedSupport" class="space-y-4">
            <!-- Support Badge -->
            <div>
              <Badge 
                :variant="getBadgeVariant(selectedSupport.displayQuality)"
                class="text-base px-4 py-2"
              >
                {{ selectedSupport.supported ? 'Supported' : 'Not Supported' }} - 
                {{ getQualityLabel(selectedSupport.displayQuality) }}
              </Badge>
            </div>

            <!-- Behaviors -->
            <div class="space-y-3">
              <div>
                <h4 class="text-sm font-semibold text-gray-300 mb-1">Name Display</h4>
                <p class="text-gray-400 text-sm">{{ selectedSupport.behaviors.nameDisplay }}</p>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-gray-300 mb-1">Unit Display</h4>
                <p class="text-gray-400 text-sm">{{ selectedSupport.behaviors.unitDisplay }}</p>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-gray-300 mb-1">Image Support</h4>
                <p class="text-gray-400 text-sm">{{ selectedSupport.behaviors.imageSupport }}</p>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-gray-300 mb-1">Metadata Fetch</h4>
                <p class="text-gray-400 text-sm">{{ selectedSupport.behaviors.metadataFetch }}</p>
              </div>
              <div v-if="selectedSupport.behaviors.specialNotes">
                <h4 class="text-sm font-semibold text-gray-300 mb-1">Special Notes</h4>
                <p class="text-gray-400 text-sm">{{ selectedSupport.behaviors.specialNotes }}</p>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end">
            <Button variant="secondary" @click="closeDetails">
              Close
            </Button>
          </div>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Badge from '../ui/Badge.vue';
import Button from '../ui/Button.vue';
import Modal from '../ui/Modal.vue';
import { 
  WALLET_COMPATIBILITY, 
  getWalletSupport 
} from '../../types/walletCompatibility';
import type { AlgorandStandard } from '../../types/standardsValidation';
import type { WalletInfo, WalletStandardSupport } from '../../types/walletCompatibility';

const standards = ref<AlgorandStandard[]>(['ARC3', 'ARC19', 'ARC69', 'ASA']);

const wallets = computed(() => Object.values(WALLET_COMPATIBILITY));

const lastVerified = computed(() => {
  const dates = Object.values(WALLET_COMPATIBILITY).map(w => w.lastVerified);
  return dates[0] || 'Unknown';
});

// Modal state
const showDetailsModal = ref(false);
const selectedWallet = ref<WalletInfo | null>(null);
const selectedStandard = ref<AlgorandStandard | null>(null);
const selectedSupport = ref<WalletStandardSupport | null>(null);

function getSupport(walletId: string, standard: AlgorandStandard): WalletStandardSupport | undefined {
  return getWalletSupport(walletId, standard);
}

function getBadgeVariant(quality: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch (quality) {
    case 'excellent':
      return 'success';
    case 'good':
      return 'info';
    case 'partial':
      return 'warning';
    case 'poor':
      return 'error';
    default:
      return 'default';
  }
}

function getQualityLabel(quality: string): string {
  return quality.charAt(0).toUpperCase() + quality.slice(1);
}

function showDetails(wallet: WalletInfo, standard: AlgorandStandard) {
  selectedWallet.value = wallet;
  selectedStandard.value = standard;
  selectedSupport.value = getWalletSupport(wallet.id, standard) || null;
  showDetailsModal.value = true;
}

function closeDetails() {
  showDetailsModal.value = false;
  selectedWallet.value = null;
  selectedStandard.value = null;
  selectedSupport.value = null;
}
</script>


