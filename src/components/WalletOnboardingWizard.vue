<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="handleClose">
        <div class="glass-effect rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">
              {{ currentStepInfo.title }}
            </h2>
            <button @click="handleClose" class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>

          <!-- Progress Indicator -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-400">Step {{ currentStep + 1 }} of {{ steps.length }}</span>
              <span class="text-sm text-gray-400">{{ Math.round(((currentStep + 1) / steps.length) * 100) }}%</span>
            </div>
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-biatec-accent to-biatec-teal transition-all duration-500" :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"></div>
            </div>
          </div>

          <!-- Step Content -->
          <div class="mb-8">
            <!-- Step 1: Welcome & Network Education -->
            <div v-if="currentStep === 0" class="space-y-6">
              <div class="text-center">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-wallet text-4xl text-white"></i>
                </div>
                <p class="text-gray-300 text-lg mb-6">Welcome! Let's get you connected to create and manage tokens on Algorand-based networks.</p>
              </div>

              <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                <h3 class="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  Understanding Networks
                </h3>
                <p class="text-gray-300 text-sm mb-4">This platform supports multiple Algorand-based networks, each optimized for different use cases:</p>
                <div class="space-y-3">
                  <div class="flex items-start gap-3">
                    <i class="pi pi-check-circle text-green-400 mt-1"></i>
                    <div>
                      <div class="font-semibold text-white">VOI Mainnet</div>
                      <div class="text-sm text-gray-400">High-performance network with low fees, ideal for DeFi and gaming applications</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <i class="pi pi-check-circle text-green-400 mt-1"></i>
                    <div>
                      <div class="font-semibold text-white">Aramid Mainnet</div>
                      <div class="text-sm text-gray-400">Enterprise-focused network with enhanced compliance features</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 2: Network Selection -->
            <div v-if="currentStep === 1" class="space-y-4">
              <p class="text-gray-300 mb-4">Select the network you want to connect to. You can change this later in settings.</p>

              <div class="space-y-3">
                <button
                  v-for="network in availableNetworks"
                  :key="network.id"
                  @click="selectedNetwork = network.id"
                  :class="[
                    'w-full p-5 rounded-xl text-left transition-all border-2',
                    selectedNetwork === network.id ? 'border-biatec-accent bg-biatec-accent/10' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
                  ]"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <h3 class="text-white font-semibold text-lg">{{ network.displayName }}</h3>
                        <span v-if="!network.isTestnet" class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400"> Mainnet </span>
                        <span v-else class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400"> Testnet </span>
                      </div>
                      <p class="text-sm text-gray-400 mb-3">
                        {{ network.chainType === 'AVM' ? network.genesisId : `Chain ID: ${network.chainId}` }}
                      </p>
                      <div class="text-xs text-gray-500">
                        <i class="pi pi-server text-xs mr-1"></i>
                        {{ network.chainType === 'AVM' ? network.algodUrl : network.rpcUrl }}
                      </div>
                    </div>
                    <div v-if="selectedNetwork === network.id" class="text-biatec-accent">
                      <i class="pi pi-check-circle text-2xl"></i>
                    </div>
                  </div>
                </button>
              </div>

              <div v-if="selectedNetwork" class="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div class="flex items-start gap-3">
                  <i class="pi pi-lightbulb text-purple-400"></i>
                  <div class="text-sm text-gray-300">
                    <strong class="text-purple-400">Recommended:</strong>
                    Choose VOI Mainnet for general token creation and DeFi applications. Select Aramid Mainnet if you need enhanced compliance features for enterprise use.
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: Wallet Selection with Info -->
            <div v-if="currentStep === 2" class="space-y-4">
              <!-- Show authenticated status if Arc76 is already authenticated -->
              <div v-if="isArc76Authenticated" class="p-5 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
                <div class="flex items-start gap-3">
                  <i class="pi pi-check-circle text-green-400 text-2xl"></i>
                  <div class="flex-1">
                    <p class="text-sm text-green-400 font-medium mb-1">Already Authenticated</p>
                    <p class="text-xs text-gray-300 mb-2">Your wallet is already connected via Arc76 authentication.</p>
                    <div class="text-xs text-gray-400 font-mono break-all bg-white/5 p-2 rounded">
                      {{ authStore.account }}
                    </div>
                  </div>
                </div>
              </div>

              <p v-else class="text-gray-300 mb-4">Choose a compatible wallet to connect. Make sure you have it installed and set up.</p>

              <div v-if="isConnecting" class="text-center py-12">
                <div class="relative inline-block">
                  <i class="pi pi-spin pi-spinner text-5xl text-biatec-accent mb-4"></i>
                  <div class="absolute inset-0 blur-xl bg-biatec-accent/20 animate-pulse"></div>
                </div>
                <p class="text-gray-300 text-lg font-medium mb-2">Connecting to wallet...</p>
                <p class="text-sm text-gray-400 mt-2">Please check your wallet app to approve the connection</p>
                <div class="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <i class="pi pi-lock"></i>
                  <span>This connection is secure and encrypted</span>
                </div>
              </div>

              <div v-else-if="connectionError" class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                <div class="flex items-start gap-3">
                  <i class="pi pi-exclamation-triangle text-red-400 text-xl"></i>
                  <div class="flex-1">
                    <p class="text-sm text-red-400 font-medium mb-1">Connection Failed</p>
                    <p class="text-xs text-gray-400 mb-3">{{ connectionError }}</p>
                    <div class="space-y-1 text-xs text-gray-400 mb-3">
                      <p class="font-medium text-gray-300">Quick fixes:</p>
                      <ul class="list-disc list-inside space-y-1 ml-2">
                        <li>Ensure wallet is unlocked and ready</li>
                        <li>Check network compatibility</li>
                        <li>Try a different wallet if issue persists</li>
                      </ul>
                    </div>
                    <button @click="connectionError = null" class="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors">Try again</button>
                  </div>
                </div>
              </div>

              <div v-else-if="!isArc76Authenticated" class="space-y-3">
                <button
                  v-for="wallet in supportedWallets"
                  :key="wallet.id"
                  @click="handleWalletConnect(wallet.id)"
                  class="w-full p-4 rounded-xl text-left transition-all border border-white/10 bg-white/5 hover:bg-white/10 hover:border-biatec-accent/50 group"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-biatec-accent/20 transition-colors">
                      <i :class="wallet.icon" class="text-3xl text-white"></i>
                    </div>
                    <div class="flex-1">
                      <div class="text-white font-semibold mb-1">{{ wallet.name }}</div>
                      <div class="text-sm text-gray-400">{{ wallet.description }}</div>
                      <div class="flex items-center gap-2 mt-1">
                        <span v-for="platform in wallet.platforms" :key="platform" class="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400">
                          {{ platform }}
                        </span>
                      </div>
                    </div>
                    <i class="pi pi-chevron-right text-gray-400 group-hover:text-biatec-accent transition-colors"></i>
                  </div>
                </button>
              </div>

              <div class="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div class="flex items-start gap-3">
                  <i class="pi pi-exclamation-circle text-yellow-400"></i>
                  <div class="text-sm text-gray-300">
                    <strong class="text-yellow-400">Don't have a wallet?</strong>
                    <div class="mt-2 space-y-1">
                      <a href="https://perawallet.app/" target="_blank" class="block text-blue-400 hover:text-blue-300 underline"> Download Pera Wallet → </a>
                      <a href="https://defly.app/" target="_blank" class="block text-blue-400 hover:text-blue-300 underline"> Download Defly Wallet → </a>
                      <a href="https://www.exodus.com/" target="_blank" class="block text-blue-400 hover:text-blue-300 underline"> Download Exodus Wallet → </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: MICA Compliance & Terms -->
            <div v-if="currentStep === 3" class="space-y-6">
              <div class="text-center mb-6">
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-shield-check text-3xl text-white"></i>
                </div>
                <h3 class="text-xl font-semibold text-white mb-2">Terms & Risk Disclosure</h3>
                <p class="text-gray-400 text-sm">Please review and accept the following before proceeding</p>
              </div>

              <div class="bg-white/5 border border-white/10 rounded-xl p-5 max-h-64 overflow-y-auto">
                <h4 class="text-sm font-semibold text-white mb-3">Risk Notice (MICA Compliant)</h4>
                <div class="text-xs text-gray-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>Crypto-assets involve significant risks:</strong>
                  </p>
                  <ul class="list-disc list-inside space-y-1 ml-2">
                    <li>You could lose all the money you invest in crypto-assets.</li>
                    <li>Crypto-asset values are highly volatile and can fluctuate significantly.</li>
                    <li>Crypto-assets are not covered by consumer protection schemes or deposit guarantee schemes.</li>
                    <li>Your crypto-assets may not be covered by the Financial Services Compensation Scheme.</li>
                    <li>You may not be able to sell your crypto-assets easily or at the price you want.</li>
                  </ul>
                  <p class="mt-3">
                    <strong>Important Information:</strong>
                  </p>
                  <ul class="list-disc list-inside space-y-1 ml-2">
                    <li>This platform provides tools for token creation and management on blockchain networks.</li>
                    <li>By using this service, you acknowledge that you understand the risks involved.</li>
                    <li>You are solely responsible for any tokens you create and their compliance with applicable laws.</li>
                    <li>The platform does not provide financial, legal, or tax advice.</li>
                    <li>Always conduct your own research and consult qualified professionals before making decisions.</li>
                  </ul>
                </div>
              </div>

              <!-- Consent Checkboxes -->
              <div class="space-y-3">
                <label class="flex items-start gap-3 p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="checkbox" v-model="hasReadRiskNotice" class="mt-1 w-5 h-5 rounded border-gray-600 text-biatec-accent focus:ring-biatec-accent focus:ring-offset-0" />
                  <span class="text-sm text-gray-300"> I have read and understood the risk notice and acknowledge the risks associated with crypto-assets. </span>
                </label>

                <label class="flex items-start gap-3 p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="checkbox" v-model="hasAcceptedTerms" class="mt-1 w-5 h-5 rounded border-gray-600 text-biatec-accent focus:ring-biatec-accent focus:ring-offset-0" />
                  <span class="text-sm text-gray-300"> I agree to the Terms of Service and Privacy Policy, and confirm I am responsible for compliance with applicable laws. </span>
                </label>
              </div>

              <div v-if="!canProceedFromCompliance" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p class="text-xs text-red-400 flex items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  You must accept both terms to proceed
                </p>
              </div>
            </div>

            <!-- Step 5: Success -->
            <div v-if="currentStep === 4" class="text-center space-y-6 py-8">
              <div class="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                <i class="pi pi-check text-5xl text-white"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white mb-2">You're All Set!</h3>
                <p class="text-gray-300 mb-4">Your wallet is connected and ready to use.</p>
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                  <i class="pi pi-wallet text-biatec-accent"></i>
                  <span class="text-white font-mono text-sm">{{ formattedAddress }}</span>
                </div>
              </div>

              <div class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5">
                <h4 class="text-lg font-semibold text-white mb-3">Next Steps</h4>
                <div class="space-y-3 text-left">
                  <div class="flex items-start gap-3">
                    <i class="pi pi-plus-circle text-blue-400 mt-1"></i>
                    <div>
                      <div class="font-semibold text-white text-sm">Create Your First Token</div>
                      <div class="text-xs text-gray-400">Use our guided wizard to deploy tokens in minutes</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <i class="pi pi-chart-bar text-purple-400 mt-1"></i>
                    <div>
                      <div class="font-semibold text-white text-sm">Explore Dashboard</div>
                      <div class="text-xs text-gray-400">Manage your tokens and monitor activity</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <i class="pi pi-shield-check text-green-400 mt-1"></i>
                    <div>
                      <div class="font-semibold text-white text-sm">Set Up Compliance</div>
                      <div class="text-xs text-gray-400">Configure whitelisting and compliance features</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center justify-between gap-4">
            <button
              v-if="currentStep > 0 && currentStep < steps.length - 1"
              @click="previousStep"
              :disabled="isConnecting"
              class="px-6 py-3 rounded-xl text-white font-medium border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="pi pi-chevron-left mr-2"></i>
              Back
            </button>
            <div v-else></div>

            <div class="flex gap-3">
              <button
                v-if="currentStep < steps.length - 1"
                @click="nextStep"
                :disabled="!canProceedToNextStep"
                class="px-8 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-biatec-accent to-biatec-teal hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ currentStep === 2 ? "Skip for now" : "Continue" }}
                <i class="pi pi-chevron-right ml-2"></i>
              </button>
              <button v-else @click="finishOnboarding" class="px-8 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 transition-opacity">
                Get Started
                <i class="pi pi-check ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet } from "@txnlab/use-wallet-vue";
import { useAVMAuthentication } from "algorand-authentication-component-vue";
import { NETWORKS, type NetworkId } from "../composables/useWalletManager";
import { AUTH_STORAGE_KEYS, WALLET_CONNECTION_STATE } from "../constants/auth";

interface Props {
  isOpen: boolean;
  skipWelcome?: boolean;
}

interface Emits {
  (e: "close"): void;
  (e: "complete", data: { address: string; network: NetworkId }): void;
}

const props = withDefaults(defineProps<Props>(), {
  skipWelcome: false,
});

const emit = defineEmits<Emits>();

const wallet = useWallet();
const { authStore } = useAVMAuthentication();

// State
const currentStep = ref(props.skipWelcome ? 1 : 0);
const selectedNetwork = ref<NetworkId>("voi-mainnet");
const isConnecting = ref(false);
const connectionError = ref<string | null>(null);
const hasReadRiskNotice = ref(false);
const hasAcceptedTerms = ref(false);
const connectedAddress = ref<string | null>(null);

// Check if user is already authenticated via Arc76
const isArc76Authenticated = computed(() => authStore.isAuthenticated && !!authStore.account);

// Initialize connectedAddress from Arc76 auth if available
onMounted(() => {
  if (isArc76Authenticated.value) {
    connectedAddress.value = authStore.account;
  }
});

// Steps configuration
const steps = [
  { id: "welcome", title: "Welcome to Biatec Tokens" },
  { id: "network", title: "Select Your Network" },
  { id: "wallet", title: "Connect Your Wallet" },
  { id: "compliance", title: "Terms & Risk Disclosure" },
  { id: "success", title: "Successfully Connected" },
];

const currentStepInfo = computed(() => steps[currentStep.value]);

const availableNetworks = computed(() => Object.values(NETWORKS));

const supportedWallets = computed(() => {
  const walletInfo = [
    { id: "pera", name: "Pera Wallet", description: "Most popular Algorand wallet", icon: "pi pi-mobile", platforms: ["iOS", "Android", "Web"] },
    { id: "defly", name: "Defly Wallet", description: "Feature-rich DeFi wallet", icon: "pi pi-wallet", platforms: ["iOS", "Android", "Web"] },
    { id: "exodus", name: "Exodus Wallet", description: "Multi-chain wallet solution", icon: "pi pi-globe", platforms: ["Desktop", "Mobile"] },
    { id: "biatec", name: "Biatec Wallet", description: "Enterprise wallet solution", icon: "pi pi-building", platforms: ["Web", "Enterprise"] },
    { id: "kibisis", name: "Kibisis", description: "Browser extension wallet", icon: "pi pi-window-maximize", platforms: ["Browser"] },
    { id: "lute", name: "Lute Wallet", description: "Lightweight wallet", icon: "pi pi-credit-card", platforms: ["Web"] },
  ];

  // Filter to only show available wallets
  const availableWalletIds = wallet.wallets.value.filter((w) => w.isActive).map((w) => w.id as string);

  return walletInfo.filter((w) => availableWalletIds.includes(w.id));
});

const formattedAddress = computed(() => {
  if (!connectedAddress.value) return "";
  return `${connectedAddress.value.slice(0, 6)}...${connectedAddress.value.slice(-4)}`;
});

const canProceedToNextStep = computed(() => {
  if (currentStep.value === 0) return true; // Welcome step
  if (currentStep.value === 1) return !!selectedNetwork.value; // Network selection
  if (currentStep.value === 2) return true; // Can skip wallet connection
  if (currentStep.value === 3) return canProceedFromCompliance.value; // Compliance
  return true;
});

const canProceedFromCompliance = computed(() => {
  return hasReadRiskNotice.value && hasAcceptedTerms.value;
});

// Methods
const nextStep = () => {
  if (currentStep.value < steps.length - 1 && canProceedToNextStep.value) {
    currentStep.value++;

    // Skip wallet connection step (step 2) if already authenticated via Arc76
    if (currentStep.value === 2 && isArc76Authenticated.value) {
      currentStep.value = 3; // Move to compliance step
    }

    // If skipping wallet connection (step 2), move directly to success
    if (currentStep.value === 3 && !connectedAddress.value) {
      // Skip compliance and go to success if no wallet connected
      currentStep.value = 4;
    }
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const handleWalletConnect = async (walletId: string) => {
  isConnecting.value = true;
  connectionError.value = null;

  try {
    const walletToConnect = wallet.wallets.value.find((w) => w.id === walletId);

    if (!walletToConnect) {
      throw new Error("Wallet not found");
    }

    await walletToConnect.connect();

    const activeAccount = wallet.activeAccount.value;

    if (!activeAccount) {
      throw new Error("No account selected after connection");
    }

    connectedAddress.value = activeAccount.address;

    // Store network preference and wallet info
    localStorage.setItem(AUTH_STORAGE_KEYS.SELECTED_NETWORK, selectedNetwork.value);
    localStorage.setItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED, WALLET_CONNECTION_STATE.CONNECTED);
    localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID, walletId);

    // Move to next step (compliance)
    currentStep.value = 3;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
    connectionError.value = errorMessage;
    console.error("Wallet connection error:", err);
  } finally {
    isConnecting.value = false;
  }
};

const finishOnboarding = () => {
  // Always emit complete, even if no wallet was connected
  emit("complete", {
    address: connectedAddress.value || "",
    network: selectedNetwork.value,
  });

  // Mark onboarding as completed
  localStorage.setItem(AUTH_STORAGE_KEYS.ONBOARDING_COMPLETED, WALLET_CONNECTION_STATE.CONNECTED);

  emit("close");
};

const handleClose = () => {
  // Don't allow closing during wallet connection
  const isWalletStep = currentStep.value === 2;
  if (!isConnecting.value && !isWalletStep) {
    emit("close");
  }
};
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
  transform: scale(0.95);
}

/* Custom scrollbar for content */
.max-h-64::-webkit-scrollbar {
  width: 6px;
}

.max-h-64::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.max-h-64::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.max-h-64::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
