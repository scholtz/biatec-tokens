<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="close">
        <div class="glass-effect rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Sign In to Your Account</h2>
            <button @click="close" class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>

          <!-- Network Selection -->
          <div v-if="showNetworkSelector" class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <i class="pi pi-server text-biatec-accent"></i>
              Select Network
            </label>
            <div class="space-y-2">
              <button
                v-for="network in availableNetworks"
                :key="network.id"
                @click="selectedNetwork = network.id"
                :class="[
                  'w-full p-4 rounded-xl text-left transition-all border-2',
                  selectedNetwork === network.id ? 'border-biatec-accent bg-biatec-accent/10 shadow-lg shadow-biatec-accent/20' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <div class="text-white font-semibold">{{ network.displayName }}</div>
                      <span v-if="!network.isTestnet" class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400"> Mainnet </span>
                      <span v-else class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400"> Testnet </span>
                    </div>
                    <div class="text-sm text-gray-400">
                      {{ network.chainType === "AVM" ? network.genesisId : `Chain ID: ${network.chainId}` }}
                    </div>
                  </div>
                  <div v-if="selectedNetwork === network.id" class="text-biatec-accent">
                    <i class="pi pi-check-circle text-xl"></i>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Wallet List -->
          <div class="space-y-3">
            <!-- Loading State -->
            <div v-if="isConnecting || isReconnecting || isSwitchingNetwork" class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
              <p class="text-gray-300 font-medium mb-2">{{ connectionStateMessage }}</p>
              <p class="text-sm text-gray-400">Please approve the authentication request in your wallet app</p>
            </div>

            <!-- Error State -->
            <div v-else-if="hasFailed && error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
              <div class="flex items-start gap-3">
                <i class="pi pi-exclamation-triangle text-red-400"></i>
                <div class="flex-1">
                  <p class="text-sm text-red-400 font-medium">Authentication Failed</p>
                  <p class="text-xs text-gray-400 mt-1">{{ error }}</p>
                  <div v-if="lastError" class="mt-2 text-xs text-gray-500">Error Code: {{ lastError.diagnosticCode }}</div>
                  <div v-if="troubleshootingSteps.length > 0" class="mt-3 space-y-2">
                    <p class="text-xs text-gray-300 font-medium">Troubleshooting:</p>
                    <ul class="text-xs text-gray-400 space-y-1 ml-4 list-disc">
                      <li v-for="(step, index) in troubleshootingSteps" :key="index">{{ step }}</li>
                    </ul>
                  </div>
                  <div class="flex gap-2 mt-3">
                    <button @click="handleRetry" class="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors flex items-center gap-2">
                      <i class="pi pi-refresh"></i>
                      Retry Authentication
                    </button>
                    <button @click="error = null" class="px-3 py-1.5 text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 rounded-lg transition-colors">Dismiss</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Authentication Provider Buttons -->
            <button
              v-for="wallet in availableWallets"
              :key="wallet.id"
              @click="handleConnect(wallet.id)"
              :disabled="isConnecting || isReconnecting || isSwitchingNetwork"
              class="w-full p-4 rounded-xl text-left transition-all border border-white/10 bg-white/5 hover:bg-white/10 hover:border-biatec-accent/50 hover:shadow-lg hover:shadow-biatec-accent/10 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-biatec-accent/20 transition-colors">
                  <i :class="getWalletIcon(wallet.id)" class="text-2xl text-white"></i>
                </div>
                <div class="flex-1">
                  <div class="text-white font-semibold">{{ getWalletName(wallet.id) }}</div>
                  <div class="text-sm text-gray-400">{{ getWalletDescription(wallet.id) }}</div>
                </div>
                <i class="pi pi-chevron-right text-gray-400 group-hover:text-biatec-accent transition-colors"></i>
              </div>
            </button>
          </div>

          <!-- Info & Links -->
          <div class="mt-6 space-y-3">
            <div class="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div class="flex items-start gap-3">
                <i class="pi pi-info-circle text-blue-400"></i>
                <div class="text-sm text-gray-300">
                  <p class="mb-2">By signing in, you agree to our Terms of Service and acknowledge that you've read our Privacy Policy.</p>
                  <p class="text-xs text-gray-400"><strong class="text-blue-400">Security:</strong> We never store your private keys. All transactions require your explicit approval.</p>
                </div>
              </div>
            </div>

            <div class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div class="flex items-start gap-3">
                <i class="pi pi-exclamation-circle text-yellow-400"></i>
                <div class="text-sm text-gray-300">
                  <p class="font-medium text-yellow-400 mb-2">New to self-custody wallets?</p>
                  <div class="space-y-1 text-xs">
                    <p class="mb-2">Download a wallet app to get started with secure, self-custody authentication:</p>
                    <a href="https://perawallet.app/" target="_blank" rel="noopener noreferrer" class="block text-blue-400 hover:text-blue-300 underline"> Download Pera Wallet (Recommended) → </a>
                    <a href="https://defly.app/" target="_blank" rel="noopener noreferrer" class="block text-blue-400 hover:text-blue-300 underline"> Download Defly Wallet → </a>
                    <a href="https://www.exodus.com/" target="_blank" rel="noopener noreferrer" class="block text-blue-400 hover:text-blue-300 underline"> Download Exodus Wallet → </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useWalletManager, NETWORKS, type NetworkId } from "../composables/useWalletManager";
import { WalletConnectionState } from "../composables/walletState";

interface Props {
  isOpen: boolean;
  showNetworkSelector?: boolean;
  defaultNetwork?: NetworkId;
}

interface Emits {
  (e: "close"): void;
  (e: "connected", data: { address: string; walletId: string; network: NetworkId }): void;
  (e: "error", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  showNetworkSelector: true,
  defaultNetwork: "voi-mainnet" as NetworkId,
});

const emit = defineEmits<Emits>();

const walletManager = useWalletManager();
const selectedNetwork = ref<NetworkId>(props.defaultNetwork);

const availableNetworks = computed(() => Object.values(NETWORKS));

const availableWallets = computed(() => {
  return walletManager.walletManager?.wallets?.value?.filter((w: any) => w.isActive) || [];
});

// Computed state flags
const isConnecting = computed(
  () => walletManager.walletState.value.connectionState === WalletConnectionState.CONNECTING || walletManager.walletState.value.connectionState === WalletConnectionState.DETECTING,
);

const isReconnecting = computed(() => walletManager.walletState.value.connectionState === WalletConnectionState.RECONNECTING);

const isSwitchingNetwork = computed(() => walletManager.walletState.value.connectionState === WalletConnectionState.SWITCHING_NETWORK);

const hasFailed = computed(() => walletManager.walletState.value.connectionState === WalletConnectionState.FAILED);

const error = computed(() => walletManager.walletState.value.error);
const lastError = computed(() => walletManager.walletState.value.lastError);

// Connection state message
const connectionStateMessage = computed(() => {
  const state = walletManager.walletState.value.connectionState;
  switch (state) {
    case WalletConnectionState.DETECTING:
      return "Detecting authentication provider...";
    case WalletConnectionState.CONNECTING:
      return "Signing in...";
    case WalletConnectionState.RECONNECTING:
      return "Reconnecting...";
    case WalletConnectionState.SWITCHING_NETWORK:
      return "Switching network...";
    case WalletConnectionState.FETCHING_BALANCE:
      return "Loading account details...";
    default:
      return "Please approve the authentication request in your wallet app";
  }
});

// Get troubleshooting steps if there's an error
const troubleshootingSteps = computed(() => {
  if (!lastError.value) return [];
  return walletManager.getTroubleshootingSteps!(lastError.value.type);
});

const getWalletName = (walletId: string): string => {
  const names: Record<string, string> = {
    pera: "Pera Wallet",
    defly: "Defly Wallet",
    exodus: "Exodus Wallet",
    biatec: "Biatec Wallet",
    kibisis: "Kibisis",
    lute: "Lute Wallet",
    walletconnect: "WalletConnect",
    kmd: "KMD",
  };
  return names[walletId] || walletId;
};

const getWalletDescription = (walletId: string): string => {
  const descriptions: Record<string, string> = {
    pera: "Mobile and web wallet",
    defly: "Feature-rich wallet",
    exodus: "Multi-chain wallet",
    biatec: "Enterprise wallet solution",
    kibisis: "Browser extension",
    lute: "Lightweight wallet",
    walletconnect: "Connect via QR code",
    kmd: "Local development",
  };
  return descriptions[walletId] || "Sign in with wallet";
};

const getWalletIcon = (walletId: string): string => {
  const icons: Record<string, string> = {
    pera: "pi pi-mobile",
    defly: "pi pi-wallet",
    exodus: "pi pi-globe",
    biatec: "pi pi-building",
    kibisis: "pi pi-window-maximize",
    lute: "pi pi-credit-card",
    walletconnect: "pi pi-qrcode",
    kmd: "pi pi-server",
  };
  return icons[walletId] || "pi pi-wallet";
};

const handleConnect = async (walletId: string) => {
  try {
    // Save selected network to localStorage before connecting
    localStorage.setItem("selected_network", selectedNetwork.value);

    // Switch network if different from current
    if (selectedNetwork.value !== walletManager.currentNetwork.value) {
      await walletManager.switchNetwork(selectedNetwork.value);
    }

    // Connect wallet
    await walletManager.connect(walletId);

    // Get active account after connection
    const activeAddress = walletManager.activeAddress.value;

    if (!activeAddress) {
      throw new Error("No account selected");
    }

    emit("connected", {
      address: activeAddress,
      walletId: walletId,
      network: selectedNetwork.value,
    });

    close();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
    emit("error", errorMessage);
    console.error("Wallet connection error:", err);
  }
};

const handleRetry = async () => {
  if (walletManager.walletState.value.activeWallet) {
    await walletManager.retryConnection(walletManager.walletState.value.activeWallet);
  }
};

const close = () => {
  if (!isConnecting.value) {
    emit("close");
  }
};

// Watch for network changes
watch(
  () => props.defaultNetwork,
  (newNetwork) => {
    if (newNetwork) {
      selectedNetwork.value = newNetwork;
    }
  },
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
}
</style>
