<template>
  <WizardStep
    title="Configure Your Token"
    description="Choose the network, token standard, and provide basic information for your token."
    :validation-errors="errors"
    :show-errors="showErrors"
    help-text="Don't worry about the technical details - we'll explain everything in plain language."
  >
    <div class="space-y-8">
      <!-- Network Selection -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-globe text-biatec-accent"></i>
          Choose Your Network
        </h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Think of this as choosing where your token will live. Each network has different strengths.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="network in networks"
            :key="network.name"
            :class="[
              'relative p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105',
              formData.selectedNetwork === network.name ? 'border-biatec-accent bg-biatec-accent/5' : 'border-gray-700 bg-gray-800/50',
            ]"
            @click="selectNetwork(network.name)"
          >
            <div v-if="formData.selectedNetwork === network.name" class="absolute top-3 right-3">
              <i class="pi pi-check-circle text-biatec-accent text-xl"></i>
            </div>

            <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {{ network.displayName }}
            </h5>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {{ network.description }}
            </p>

            <div class="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <i class="pi pi-dollar text-green-400"></i>
                <span>Creation: {{ network.fees.creation }}</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="pi pi-check text-blue-400 mt-0.5"></i>
                <span>Best for: {{ network.bestFor.slice(0, 2).join(", ") }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Token Standard Selection -->
      <div v-if="formData.selectedNetwork" class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-box text-biatec-accent"></i>
          Choose Token Type
        </h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">This determines what your token can do. Most users start with a standard utility token.</p>

        <div class="space-y-3">
          <div
            v-for="standard in availableStandards"
            :key="standard.value"
            :class="[
              'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
              formData.selectedStandard === standard.value ? 'border-biatec-accent bg-biatec-accent/5' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
            ]"
            @click="selectStandard(standard.value)"
          >
            <div class="flex items-start gap-3">
              <div v-if="formData.selectedStandard === standard.value" class="flex-shrink-0 mt-1">
                <i class="pi pi-check-circle text-biatec-accent text-xl"></i>
              </div>
              <div v-else class="flex-shrink-0 mt-1">
                <i class="pi pi-circle text-gray-600 text-xl"></i>
              </div>

              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h5 class="text-md font-bold text-gray-900 dark:text-white">
                    {{ standard.name }}
                  </h5>
                  <span :class="['px-2 py-0.5 rounded text-xs font-medium', standard.type === 'Fungible' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400']">
                    {{ standard.type }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ standard.description }}
                </p>
                <div class="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                  <p><strong>Best for:</strong> {{ standard.useWhen[0] }}</p>
                  <button @click.stop="openLearnMore(standard)" class="text-biatec-accent hover:text-biatec-accent/80 underline font-medium">Learn more about this standard →</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compliance Guidance Banner -->
        <div v-if="formData.selectedStandard && shouldShowComplianceBanner" class="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-yellow-500 text-xl mt-0.5"></i>
            <div class="flex-1">
              <h5 class="text-sm font-semibold text-yellow-500 mb-1">Compliance Considerations</h5>
              <p class="text-xs text-gray-300 mb-2">
                {{ currentStandardComplianceNote }}
              </p>
              <p class="text-xs text-gray-400">
                For regulated assets, ensure issuer documentation, legal opinions, and transfer restrictions are aligned with applicable regulations.
                <a
                  href="https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md"
                  target="_blank"
                  class="text-biatec-accent hover:text-biatec-accent/80 underline"
                >
                  View compliance roadmap
                </a>
              </p>
            </div>
          </div>
        </div>

        <!-- Glossary Tooltip -->
        <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <details class="cursor-pointer">
            <summary class="text-sm font-medium text-blue-400 select-none">What do these terms mean?</summary>
            <div class="mt-2 space-y-2 text-xs text-gray-400">
              <p><strong>Fungible:</strong> Each token is identical and interchangeable (like regular currency).</p>
              <p><strong>NFT:</strong> Non-Fungible Token - each token is unique and represents a specific item.</p>
              <p><strong>Metadata:</strong> Additional information like images, descriptions, and properties.</p>
              <p><strong>Smart Contract:</strong> Programmable rules that control how your token works.</p>
            </div>
          </details>
        </div>
      </div>

      <!-- Token Details Form -->
      <div v-if="formData.selectedStandard" class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-info-circle text-biatec-accent"></i>
          Token Information
        </h4>

        <div class="space-y-5">
          <!-- Token Name -->
          <Input
            id="token-name"
            v-model="formData.name"
            label="Token Name"
            placeholder="e.g., My Awesome Token"
            required
            :error="fieldErrors.name"
            hint="The full name of your token (e.g., Bitcoin, Ethereum)"
          />

          <!-- Token Symbol -->
          <Input
            id="token-symbol"
            v-model="formData.symbol"
            label="Token Symbol"
            placeholder="e.g., MAT"
            required
            :error="fieldErrors.symbol"
            hint="A short abbreviation for your token (3-5 characters recommended)"
          />

          <!-- Token Description -->
          <div class="space-y-2">
            <label for="token-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
              <span class="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="token-description"
              v-model="formData.description"
              rows="3"
              placeholder="Explain what your token is for and how it will be used..."
              :class="['w-full px-4 py-2 rounded-lg border bg-gray-800 text-white placeholder-gray-500', fieldErrors.description ? 'border-red-500' : 'border-gray-700 focus:border-biatec-accent']"
            />
            <p v-if="fieldErrors.description" class="text-sm text-red-600 dark:text-red-400">
              {{ fieldErrors.description }}
            </p>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">Explain what your token does in plain language</p>
          </div>

          <!-- Token Supply -->
          <Input
            id="token-supply"
            v-model="formData.supply"
            type="number"
            label="Total Supply"
            placeholder="e.g., 1000000"
            required
            :error="fieldErrors.supply"
            hint="How many tokens will exist in total"
          />

          <!-- Decimals (for fungible tokens) -->
          <div v-if="isNFT === false">
            <Input
              id="token-decimals"
              v-model.number="formData.decimals"
              type="number"
              label="Decimals"
              placeholder="e.g., 6"
              required
              :error="fieldErrors.decimals"
              hint="How divisible your token is (6 = divisible by 1,000,000). Use 0 for whole numbers only."
            />
            <div class="mt-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p class="text-xs text-gray-400">
                <strong>Example:</strong> With {{ formData.decimals || 0 }} decimals, the smallest unit is {{ (1 / Math.pow(10, formData.decimals || 0)).toFixed(formData.decimals || 0) }} tokens.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Preview -->
      <div v-if="isFormComplete" class="glass-effect rounded-xl p-6 border border-biatec-accent/30 bg-gradient-to-br from-biatec-accent/5 to-transparent">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-check-circle text-green-400"></i>
          Summary
        </h4>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Network:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.selectedNetwork }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Standard:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.selectedStandard }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Name:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.name }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Symbol:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.symbol }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Supply:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ parseFloat(formData.supply).toLocaleString() }}</p>
          </div>
          <div v-if="isNFT === false">
            <span class="text-gray-500 dark:text-gray-400">Decimals:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.decimals }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Learn More Modal -->
    <div v-if="showLearnMoreModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="closeLearnMore">
      <div class="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-2xl font-bold text-white mb-2">
                {{ selectedStandardForModal?.name }}
              </h3>
              <span
                :class="['inline-block px-3 py-1 rounded text-sm font-medium', selectedStandardForModal?.type === 'Fungible' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400']"
              >
                {{ selectedStandardForModal?.type }}
              </span>
            </div>
            <button @click="closeLearnMore" class="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
              <i class="pi pi-times text-2xl"></i>
            </button>
          </div>

          <!-- Description -->
          <div class="space-y-4 text-gray-300">
            <p class="text-base">{{ selectedStandardForModal?.description }}</p>

            <!-- Business Context -->
            <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 class="text-sm font-semibold text-blue-400 mb-2">Business Context</h4>
              <p class="text-sm text-gray-300">{{ selectedStandardForModal?.businessContext }}</p>
            </div>

            <!-- Use Cases -->
            <div>
              <h4 class="text-sm font-semibold text-white mb-3">Common Use Cases</h4>
              <ul class="space-y-2">
                <li v-for="(useCase, index) in selectedStandardForModal?.useWhen" :key="index" class="flex items-start gap-3">
                  <i class="pi pi-check-circle text-green-400 text-lg mt-0.5"></i>
                  <span class="text-sm text-gray-300">{{ useCase }}</span>
                </li>
              </ul>
            </div>

            <!-- Compliance Note -->
            <div v-if="selectedStandardForModal?.complianceNote" class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h4 class="text-sm font-semibold text-yellow-500 mb-2 flex items-center gap-2">
                <i class="pi pi-info-circle"></i>
                Compliance Considerations
              </h4>
              <p class="text-xs text-gray-300">{{ selectedStandardForModal?.complianceNote }}</p>
            </div>

            <!-- Action Button -->
            <div class="pt-4 border-t border-white/10">
              <button @click="selectStandardFromModal" class="w-full py-3 bg-biatec-accent hover:bg-biatec-accent/80 text-white font-semibold rounded-lg transition-colors">
                Select {{ selectedStandardForModal?.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upgrade Modal -->
    <UpgradePromptModal
      :show="showUpgradeModal"
      :feature="upgradeFeature"
      :required-plan="upgradeRequired || 'Professional Plan'"
      :description="upgradeDescription"
      :benefits="upgradeBenefits"
      :comparison-items="upgradeComparisonItems"
      :show-comparison="true"
      @close="showUpgradeModal = false"
      @upgrade="showUpgradeModal = false"
    />
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useTokenDraftStore } from "../../../stores/tokenDraft";
import { useTokenStore } from "../../../stores/tokens";
import { usePlanGating } from "../../../composables/usePlanGating";
import WizardStep from "../WizardStep.vue";
import Input from "../../ui/Input.vue";
import UpgradePromptModal from "../../UpgradePromptModal.vue";
import { NetworkId } from "../../../stores/network";

const tokenDraftStore = useTokenDraftStore();
const tokensStore = useTokenStore();
const planGating = usePlanGating();

const showErrors = ref(false);
const errors = ref<string[]>([]);
const fieldErrors = ref<Record<string, string>>({});

// Learn More modal state
const showLearnMoreModal = ref(false);
const selectedStandardForModal = ref<any>(null);

// Upgrade modal state
const showUpgradeModal = ref(false);
const upgradeFeature = ref("");
const upgradeRequired = ref<"Basic Plan" | "Professional Plan" | "Enterprise Plan" | null>(null);
const upgradeDescription = ref("");
const upgradeBenefits = ref<string[]>([]);
const upgradeComparisonItems = ref<Array<{ feature: string; current: boolean }>>([]);

// Compliance banner logic
const shouldShowComplianceBanner = computed(() => {
  const standard = formData.value.selectedStandard;
  // Show for ARC200 (smart tokens with compliance features) and ERC20 (may be securities)
  return standard === "ARC200" || standard === "ERC20" || standard === "ERC721" || standard.includes("NFT");
});

const currentStandardComplianceNote = computed(() => {
  const selected = availableStandards.value.find((s) => s.value === formData.value.selectedStandard);
  return selected?.complianceNote || "";
});
interface FormData {
  name: string;
  symbol: string;
  description: string;
  supply: string;
  decimals: number;
  selectedNetwork: string | null;
  selectedStandard: string;
}

const formData = ref<FormData>({
  name: "",
  symbol: "",
  description: "",
  supply: "",
  decimals: 6,
  selectedNetwork: null,
  selectedStandard: "",
});

const networks = computed(() => tokensStore.networkGuidance);

const availableStandards = computed(() => {
  if (!formData.value.selectedNetwork) return [];

  const isEVM = formData.value.selectedNetwork === "Ethereum" || formData.value.selectedNetwork === "Arbitrum" || formData.value.selectedNetwork === "Base";

  if (isEVM) {
    return [
      {
        value: "ERC20",
        name: "ERC-20 (Fungible Token)",
        type: "Fungible",
        description: "Standard fungible token for currencies, points, and rewards. Works with all Ethereum wallets and DeFi protocols.",
        useWhen: ["Creating a utility token or cryptocurrency", "Building a payment or rewards system", "Integrating with Ethereum DeFi ecosystem", "Need maximum wallet and exchange compatibility"],
        businessContext: "Perfect for company shares, loyalty points, platform currencies, or any asset where each unit is identical and interchangeable.",
        complianceNote: "May require securities registration depending on token rights and distribution. Consult legal counsel for security token considerations.",
      },
      {
        value: "ERC721",
        name: "ERC-721 (NFT)",
        type: "NFT",
        description: "Non-fungible tokens for unique digital items like art, collectibles, or certificates. Each token is one-of-a-kind.",
        useWhen: ["Creating unique digital art or collectibles", "Issuing certificates or credentials", "Building gaming assets with unique properties", "Tokenizing real-world unique assets"],
        businessContext: "Best for digital art, event tickets, membership cards, real estate deeds, or any asset where uniqueness and provenance matter.",
        complianceNote: "Generally outside core securities regulations unless representing ownership rights. Ensure intellectual property rights are clear.",
      },
    ];
  }

  // AVM networks (Algorand, VOI, Aramid)
  return [
    {
      value: "ASA",
      name: "ASA (Simple Token)",
      type: "Fungible",
      description: "Basic fungible token without metadata. Fast, cheap, and simple. Native Layer-1 asset.",
      useWhen: [
        "Need a basic token without images or branding",
        "Cost efficiency is the top priority",
        "Building internal accounting or tracking systems",
        "Metadata and visual identity not required",
      ],
      businessContext: "Ideal for internal company tokens, simple point systems, or backend accounting where visual presentation is not important.",
      complianceNote: "Utility tokens generally have lighter regulatory requirements. Ensure clear disclosure of token purpose and limitations.",
    },
    {
      value: "ARC3FT",
      name: "ARC-3 (Branded Token)",
      type: "Fungible",
      description: "Fungible token with logo, description, and rich metadata. Best for consumer-facing tokens that need visual identity.",
      useWhen: ["Your token needs a logo and branding", "Building consumer-facing applications", "Want tokens to display properly in wallets", "Marketing and visual identity are important"],
      businessContext: "Perfect for customer loyalty programs, branded currencies, membership tokens, or any consumer-facing asset requiring visual recognition.",
      complianceNote: "Same as ASA for regulatory purposes. Metadata does not change compliance obligations but improves user experience.",
    },
    {
      value: "ARC200",
      name: "ARC-200 (Smart Token)",
      type: "Fungible",
      description: "Advanced programmable token with custom logic. Similar to ERC-20 with smart contract features like access control and custom rules.",
      useWhen: ["Need programmable features or custom rules", "Require access control or whitelisting", "Building complex tokenomics or vesting", "Need compatibility with ERC-20 patterns"],
      businessContext: "Best for regulated securities, governance tokens with voting logic, tokens with transfer restrictions, or any asset requiring programmable behavior.",
      complianceNote: "Programmable controls enable compliance features like whitelisting and transfer restrictions. Useful for security tokens requiring regulatory controls.",
    },
    {
      value: "ARC3NFT",
      name: "ARC-3 NFT (Collectible)",
      type: "NFT",
      description: "Non-fungible token for unique digital items with full metadata support. Each token is unique with supply of 1.",
      useWhen: ["Creating unique digital collectibles or art", "Issuing certificates or credentials", "Building limited-edition items", "Each asset is one-of-a-kind"],
      businessContext: "Ideal for digital art, event tickets, certificates of authenticity, membership cards, or any unique asset requiring proof of ownership.",
      complianceNote: "NFTs generally outside core securities regulations. Ensure intellectual property rights and consumer protection compliance.",
    },
    {
      value: "ARC72",
      name: "ARC-72 NFT (Programmable)",
      type: "NFT",
      description: "Advanced NFT with smart contract features, mutable metadata, and royalty support. Similar to ERC-721 with additional capabilities.",
      useWhen: ["Need NFTs with dynamic or updatable content", "Building gaming assets that evolve", "Require royalty mechanisms for secondary sales", "Need programmable NFT behavior"],
      businessContext: "Perfect for gaming items that level up, evolving art, NFTs with royalty requirements, or collectibles needing programmable features.",
      complianceNote: "Smart contract features enable compliance controls. Consider securities implications if NFT represents fractional ownership or investment rights.",
    },
  ];
});

const isNFT = computed(() => {
  const standard = formData.value.selectedStandard;
  return standard.includes("NFT") || standard === "ERC721" || standard === "ARC72" || standard.includes("ARC19") || standard.includes("ARC69");
});

const isFormComplete = computed(() => {
  return (
    formData.value.selectedNetwork !== null &&
    formData.value.selectedStandard !== "" &&
    formData.value.name !== "" &&
    formData.value.symbol !== "" &&
    formData.value.description !== "" &&
    formData.value.supply !== "" &&
    parseFloat(formData.value.supply) > 0 &&
    (isNFT.value || formData.value.decimals >= 0)
  );
});

const selectNetwork = (network: string) => {
  // Check plan access
  const accessCheck = planGating.checkNetworkAccess(network);

  if (!accessCheck.isAllowed && accessCheck.requiredPlan) {
    // Show upgrade modal
    upgradeFeature.value = `${network} Network`;
    upgradeRequired.value = accessCheck.requiredPlan;
    upgradeDescription.value = accessCheck.reason;
    upgradeBenefits.value = planGating.getUpgradeBenefits(accessCheck.requiredPlan);
    upgradeComparisonItems.value = planGating.getComparisonItems(upgradeFeature.value);
    showUpgradeModal.value = true;
    return;
  }

  formData.value.selectedNetwork = network;
  formData.value.selectedStandard = ""; // Reset standard when network changes
  fieldErrors.value.selectedNetwork = "";
  validateField("selectedNetwork");
};

const selectStandard = (standard: string) => {
  // Check plan access
  const accessCheck = planGating.checkStandardAccess(standard);

  if (!accessCheck.isAllowed && accessCheck.requiredPlan) {
    // Show upgrade modal
    upgradeFeature.value = `${standard} Token Standard`;
    upgradeRequired.value = accessCheck.requiredPlan;
    upgradeDescription.value = accessCheck.reason;
    upgradeBenefits.value = planGating.getUpgradeBenefits(accessCheck.requiredPlan);
    upgradeComparisonItems.value = planGating.getComparisonItems(upgradeFeature.value);
    showUpgradeModal.value = true;
    return;
  }

  formData.value.selectedStandard = standard;
  fieldErrors.value.selectedStandard = "";

  // Set default decimals based on standard
  if (isNFT.value) {
    formData.value.decimals = 0;
  } else if (formData.value.decimals === 0) {
    formData.value.decimals = 6;
  }

  validateField("selectedStandard");
};

const openLearnMore = (standard: any) => {
  selectedStandardForModal.value = standard;
  showLearnMoreModal.value = true;
};

const closeLearnMore = () => {
  showLearnMoreModal.value = false;
  selectedStandardForModal.value = null;
};

const selectStandardFromModal = () => {
  if (selectedStandardForModal.value) {
    selectStandard(selectedStandardForModal.value.value);
    closeLearnMore();
  }
};

const validateField = (field: keyof FormData) => {
  switch (field) {
    case "selectedNetwork":
      if (!formData.value.selectedNetwork) {
        fieldErrors.value.selectedNetwork = "Please select a network";
      } else {
        delete fieldErrors.value.selectedNetwork;
      }
      break;
    case "selectedStandard":
      if (!formData.value.selectedStandard) {
        fieldErrors.value.selectedStandard = "Please select a token standard";
      } else {
        delete fieldErrors.value.selectedStandard;
      }
      break;
    case "name":
      if (!formData.value.name || formData.value.name.trim() === "") {
        fieldErrors.value.name = "Token name is required";
      } else if (formData.value.name.length > 50) {
        fieldErrors.value.name = "Token name must be 50 characters or less";
      } else {
        delete fieldErrors.value.name;
      }
      break;
    case "symbol":
      if (!formData.value.symbol || formData.value.symbol.trim() === "") {
        fieldErrors.value.symbol = "Token symbol is required";
      } else if (formData.value.symbol.length > 10) {
        fieldErrors.value.symbol = "Token symbol must be 10 characters or less";
      } else {
        delete fieldErrors.value.symbol;
      }
      break;
    case "description":
      if (!formData.value.description || formData.value.description.trim() === "") {
        fieldErrors.value.description = "Token description is required";
      } else if (formData.value.description.length < 10) {
        fieldErrors.value.description = "Description must be at least 10 characters";
      } else {
        delete fieldErrors.value.description;
      }
      break;
    case "supply":
      if (formData.value.supply === "" || parseFloat(formData.value.supply) <= 0) {
        fieldErrors.value.supply = "Supply must be greater than 0";
      } else {
        delete fieldErrors.value.supply;
      }
      break;
    case "decimals":
      if (formData.value.decimals < 0 || formData.value.decimals > 18) {
        fieldErrors.value.decimals = "Decimals must be between 0 and 18";
      } else {
        delete fieldErrors.value.decimals;
      }
      break;
  }
  updateValidationErrors();
};

const validateAll = () => {
  fieldErrors.value = {};

  if (!formData.value.selectedNetwork) {
    fieldErrors.value.selectedNetwork = "Please select a network";
  }
  if (!formData.value.selectedStandard) {
    fieldErrors.value.selectedStandard = "Please select a token standard";
  }

  validateField("name");
  validateField("symbol");
  validateField("description");
  validateField("supply");
  if (!isNFT.value) {
    validateField("decimals");
  }

  updateValidationErrors();
  return Object.keys(fieldErrors.value).length === 0;
};

const updateValidationErrors = () => {
  errors.value = Object.values(fieldErrors.value);
  showErrors.value = errors.value.length > 0;
};

const isValid = computed(() => {
  return isFormComplete.value && Object.keys(fieldErrors.value).length === 0;
});

// Watch form changes and save to draft store
watch(
  formData,
  (newData) => {
    // Map display network name to NetworkId
    let networkId: NetworkId | undefined;
    if (newData.selectedNetwork === "VOI") {
      networkId = "voi-mainnet";
    } else if (newData.selectedNetwork === "Aramid") {
      networkId = "aramidmain";
    }

    tokenDraftStore.updateDraft({
      name: newData.name,
      symbol: newData.symbol,
      description: newData.description,
      supply: newData.supply ? parseFloat(newData.supply) : null,
      decimals: newData.decimals,
      selectedNetwork: networkId,
      selectedStandard: newData.selectedStandard,
    });
  },
  { deep: true },
);

// Load draft on mount
onMounted(() => {
  const draft = tokenDraftStore.currentDraft;
  if (draft) {
    // Map NetworkId to display name
    let displayNetwork: string | null = null;
    if (draft.selectedNetwork === "voi-mainnet") {
      displayNetwork = "VOI";
    } else if (draft.selectedNetwork === "aramidmain") {
      displayNetwork = "Aramid";
    }

    formData.value = {
      name: draft.name || "",
      symbol: draft.symbol || "",
      description: draft.description || "",
      supply: draft.supply?.toString() || "",
      decimals: draft.decimals || 6,
      selectedNetwork: displayNetwork,
      selectedStandard: draft.selectedStandard || "",
    };
  } else {
    tokenDraftStore.initializeDraft();
  }
});

defineExpose({
  isValid,
  validateAll,
});
</script>
