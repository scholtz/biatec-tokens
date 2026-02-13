<template>
  <WizardStep
    title="Standards & Compatibility"
    description="Verify your token meets standards requirements and understand wallet compatibility."
    :validation-errors="errors"
    :show-errors="showErrors"
    help-text="This step ensures your token configuration follows best practices for the selected standard and will display correctly in popular wallets."
  >
    <div class="space-y-6">
      <!-- Readiness Score Card -->
      <div :class="['glass-effect rounded-xl p-6 border', getReadinessColorClass(validationResult?.readiness.level || 'critical')]">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h4 class="text-2xl font-bold text-white mb-2">Readiness Score: {{ validationResult?.readiness.score || 0 }}/100</h4>
            <Badge :variant="getReadinessVariant(validationResult?.readiness.level || 'critical')" class="text-base px-4 py-2">
              {{ getReadinessLabel(validationResult?.readiness.level || "critical") }}
            </Badge>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-400">Standard</p>
            <p class="text-xl font-bold text-white">{{ selectedStandard || "ASA" }}</p>
          </div>
        </div>

        <p class="text-gray-300">
          {{ validationResult?.summary || "Validating your token configuration..." }}
        </p>
      </div>

      <!-- Issues List -->
      <div v-if="hasIssues" class="space-y-4">
        <!-- Blockers -->
        <div v-if="validationResult?.readiness.issues?.blockers?.length" class="glass-effect rounded-xl p-6 border border-red-500/30">
          <h4 class="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <i class="pi pi-times-circle"></i>
            Blocking Issues ({{ validationResult.readiness.issues.blockers.length }})
          </h4>
          <div class="space-y-3">
            <div v-for="issue in validationResult.readiness.issues.blockers" :key="issue.id" class="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <div class="flex items-start gap-3">
                <i class="pi pi-exclamation-triangle text-red-400 mt-1"></i>
                <div class="flex-1">
                  <h5 class="font-semibold text-white mb-1">{{ issue.message }}</h5>
                  <p class="text-sm text-gray-300 mb-2">{{ issue.details }}</p>
                  <div v-if="issue.remediation" class="bg-gray-800/50 rounded p-3">
                    <p class="text-xs text-gray-400 mb-1">✓ Fix:</p>
                    <p class="text-sm text-green-400">{{ issue.remediation }}</p>
                  </div>
                  <div v-if="issue.userStory" class="mt-2">
                    <button @click="showUserStory(issue)" class="text-xs text-blue-400 hover:text-blue-300 underline">Why does this matter?</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Major Issues -->
        <div v-if="validationResult?.readiness.issues?.major?.length" class="glass-effect rounded-xl p-6 border border-orange-500/30">
          <h4 class="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
            <i class="pi pi-exclamation-circle"></i>
            Major Warnings ({{ validationResult.readiness.issues.major.length }})
          </h4>
          <div class="space-y-3">
            <div v-for="issue in validationResult.readiness.issues.major" :key="issue.id" class="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
              <div class="flex items-start gap-3">
                <i class="pi pi-info-circle text-orange-400 mt-1"></i>
                <div class="flex-1">
                  <h5 class="font-semibold text-white mb-1">{{ issue.message }}</h5>
                  <p class="text-sm text-gray-300 mb-2">{{ issue.details }}</p>
                  <div v-if="issue.remediation" class="bg-gray-800/50 rounded p-3">
                    <p class="text-xs text-gray-400 mb-1">💡 Recommendation:</p>
                    <p class="text-sm text-blue-400">{{ issue.remediation }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Minor Issues -->
        <div v-if="validationResult?.readiness.issues?.minor?.length" class="glass-effect rounded-xl p-6 border border-yellow-500/30">
          <h4 class="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            <i class="pi pi-info-circle"></i>
            Minor Recommendations ({{ validationResult.readiness.issues.minor.length }})
          </h4>
          <div class="space-y-2">
            <div v-for="issue in validationResult.readiness.issues.minor" :key="issue.id" class="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
              <p class="text-sm text-white">{{ issue.message }}</p>
              <p v-if="issue.details" class="text-xs text-gray-400 mt-1">{{ issue.details }}</p>
            </div>
          </div>
        </div>

        <!-- Risk Acknowledgment -->
        <div v-if="validationResult?.readiness.requiresAcknowledgment && !validationResult.readiness.shouldBlock">
          <div class="glass-effect rounded-xl p-6 border border-white/10">
            <h4 class="text-lg font-semibold text-white mb-4">Risk Acknowledgment</h4>
            <div class="flex items-start gap-3 mb-4">
              <input id="risk-ack" v-model="riskAcknowledged" type="checkbox" class="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-biatec-accent focus:ring-biatec-accent" />
              <label for="risk-ack" class="text-sm text-gray-300">
                I understand that my token has {{ (validationResult?.readiness.issues?.major.length || 0) + (validationResult?.readiness.issues?.minor.length || 0) }}
                warning(s) and may not display correctly in some wallets. I accept the risk and want to proceed.
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Passed Checks -->
      <div v-if="validationResult?.readiness.passedChecks?.length" class="glass-effect rounded-xl p-6 border border-green-500/30">
        <h4 class="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
          <i class="pi pi-check-circle"></i>
          Passed Checks ({{ validationResult.readiness.passedChecks.length }})
        </h4>
        <ul class="space-y-2">
          <li v-for="(check, index) in validationResult.readiness.passedChecks" :key="index" class="flex items-center gap-2 text-sm text-gray-300">
            <i class="pi pi-check text-green-400"></i>
            {{ check }}
          </li>
        </ul>
      </div>

      <!-- Wallet Compatibility Preview -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i class="pi pi-wallet text-biatec-accent"></i>
          Wallet Behavior Preview
        </h4>
        <p class="text-sm text-gray-400 mb-4">How your token will likely appear in popular Algorand wallets:</p>

        <div class="space-y-4">
          <div v-for="wallet in previewWallets" :key="wallet.id" class="bg-gray-800/50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-semibold text-white">{{ wallet.name }}</h5>
              <Badge :variant="wallet.supportVariant">
                {{ wallet.supportLabel }}
              </Badge>
            </div>
            <p class="text-xs text-gray-400 mb-2">{{ wallet.behavior }}</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-gray-500">Name: </span>
                <span class="text-gray-300">{{ wallet.nameDisplay }}</span>
              </div>
              <div>
                <span class="text-gray-500">Image: </span>
                <span class="text-gray-300">{{ wallet.imageSupport }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-700">
          <button @click="showCompatibilityMatrix = true" class="text-sm text-biatec-accent hover:text-biatec-accent/80 underline">View Full Compatibility Matrix →</button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Modal :show="showUserStoryModal" @close="closeUserStory">
      <template #header>
        <h3 class="text-xl font-bold text-white">Why This Matters</h3>
      </template>
      <template #body>
        <div v-if="selectedIssue" class="space-y-4">
          <div class="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <p class="text-sm text-gray-300">{{ selectedIssue.userStory }}</p>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-300 mb-2">Technical Context</h4>
            <p class="text-sm text-gray-400">{{ selectedIssue.details }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <Button variant="secondary" @click="closeUserStory">Close</Button>
        </div>
      </template>
    </Modal>

    <Modal :show="showCompatibilityMatrix" @close="showCompatibilityMatrix = false" size="xl">
      <template #header>
        <h3 class="text-xl font-bold text-white">Wallet Compatibility Matrix</h3>
      </template>
      <template #body>
        <WalletCompatibilityMatrix />
      </template>
      <template #footer>
        <div class="flex justify-end">
          <Button variant="secondary" @click="showCompatibilityMatrix = false">Close</Button>
        </div>
      </template>
    </Modal>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import WizardStep from "../WizardStep.vue";
import Badge from "../../ui/Badge.vue";
import Button from "../../ui/Button.vue";
import Modal from "../../ui/Modal.vue";
import WalletCompatibilityMatrix from "../../compatibility/WalletCompatibilityMatrix.vue";
import { useTokenDraftStore } from "../../../stores/tokenDraft";
import { validateStandard } from "../../../services/standardsValidator";
import { getWalletSupport } from "../../../types/walletCompatibility";
import type { StandardsValidationResult, ValidationIssue, AlgorandStandard } from "../../../types/standardsValidation";
import type { MetadataValidationRequest } from "../../../types/standardsValidation";

const draftStore = useTokenDraftStore();

// Validation state
const validationResult = ref<StandardsValidationResult | null>(null);
const showErrors = ref(false);
const riskAcknowledged = ref(false);
const errors = ref<string[]>([]);

// Modal state
const showUserStoryModal = ref(false);
const selectedIssue = ref<ValidationIssue | null>(null);
const showCompatibilityMatrix = ref(false);

// Get selected standard from draft
const selectedStandard = computed<AlgorandStandard>(() => {
  const draft = draftStore.currentDraft;
  const std = draft?.selectedStandard || "ASA";

  // Map to AlgorandStandard type
  if (std === "ARC3" || std === "ARC3FT" || std === "ARC3NFT" || std === "ARC3FNFT") {
    return "ARC3";
  } else if (std === "ARC19") {
    return "ARC19";
  } else if (std === "ARC69") {
    return "ARC69";
  }
  return "ASA";
});

// Check if there are any issues
const hasIssues = computed(() => {
  if (!validationResult.value || !validationResult.value.readiness.issues) return false;
  const issues = validationResult.value.readiness.issues;
  return (issues.blockers?.length || 0) > 0 || (issues.major?.length || 0) > 0 || (issues.minor?.length || 0) > 0;
});

// Check if step is valid
const isValid = computed(() => {
  if (!validationResult.value) return false;

  // Blocker issues prevent progression
  if (validationResult.value.readiness.shouldBlock) return false;

  // If acknowledgment required, must be checked
  if (validationResult.value.readiness.requiresAcknowledgment && !riskAcknowledged.value) {
    return false;
  }

  return true;
});

// Wallet preview
const previewWallets = computed(() => {
  const draft = draftStore.currentDraft;
  if (!draft) return [];

  const wallets = ["pera", "defly", "lute"];
  return wallets.map((walletId) => {
    const support = getWalletSupport(walletId, selectedStandard.value);
    if (!support) {
      return {
        id: walletId,
        name: walletId.charAt(0).toUpperCase() + walletId.slice(1),
        supportLabel: "Unknown",
        supportVariant: "default" as const,
        behavior: "Support information not available",
        nameDisplay: draft.name || "Token Name",
        imageSupport: "Unknown",
      };
    }

    return {
      id: walletId,
      name: walletId === "pera" ? "Pera Wallet" : walletId === "defly" ? "Defly Wallet" : "Lute Wallet",
      supportLabel: support.displayQuality.charAt(0).toUpperCase() + support.displayQuality.slice(1),
      supportVariant: getBadgeVariant(support.displayQuality),
      behavior: support.behaviors.specialNotes || support.behaviors.metadataFetch,
      nameDisplay: support.behaviors.nameDisplay,
      imageSupport: support.behaviors.imageSupport.split(".")[0],
    };
  });
});

function getBadgeVariant(quality: string): "default" | "info" | "success" | "warning" | "error" {
  switch (quality) {
    case "excellent":
      return "success";
    case "good":
      return "info";
    case "partial":
      return "warning";
    case "poor":
      return "error";
    default:
      return "default";
  }
}

function getReadinessColorClass(level: string): string {
  switch (level) {
    case "excellent":
      return "border-green-500/30 bg-green-500/5";
    case "good":
      return "border-blue-500/30 bg-blue-500/5";
    case "fair":
      return "border-yellow-500/30 bg-yellow-500/5";
    case "poor":
      return "border-orange-500/30 bg-orange-500/5";
    case "critical":
      return "border-red-500/30 bg-red-500/5";
    default:
      return "border-white/10";
  }
}

function getReadinessVariant(level: string): "default" | "info" | "success" | "warning" | "error" {
  switch (level) {
    case "excellent":
      return "success";
    case "good":
      return "info";
    case "fair":
      return "warning";
    case "poor":
    case "critical":
      return "error";
    default:
      return "default";
  }
}

function getReadinessLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function showUserStory(issue: ValidationIssue) {
  selectedIssue.value = issue;
  showUserStoryModal.value = true;
}

function closeUserStory() {
  showUserStoryModal.value = false;
  selectedIssue.value = null;
}

function performValidation() {
  const draft = draftStore.currentDraft;
  if (!draft) return;

  const request: MetadataValidationRequest = {
    standard: selectedStandard.value,
    metadataUrl: draft.url,
    tokenConfig: {
      name: draft.name,
      unitName: draft.symbol,
      decimals: draft.decimals || 0,
      total: draft.supply || 0,
      url: draft.url,
    },
  };

  validationResult.value = validateStandard(selectedStandard.value, request);

  // Update errors array for wizard validation
  if (validationResult.value?.readiness?.shouldBlock) {
    errors.value = validationResult.value.readiness.issues.blockers.map((i) => i.message);
  } else {
    errors.value = [];
  }
}

const validateAll = () => {
  showErrors.value = true;
  performValidation();
  return isValid.value;
};

// Watch for changes in draft to re-validate
watch(
  () => draftStore.currentDraft,
  () => {
    performValidation();
  },
  { deep: true },
);

onMounted(() => {
  performValidation();
});

defineExpose({
  isValid,
  validateAll,
});
</script>
