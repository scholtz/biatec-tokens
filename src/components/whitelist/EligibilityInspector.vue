<template>
  <div class="glass-effect rounded-xl p-6" aria-label="Eligibility inspector">
    <div class="flex items-center gap-2 mb-5">
      <i class="pi pi-search text-biatec-accent text-xl" aria-hidden="true"></i>
      <h3 class="text-lg font-semibold text-white">Eligibility Inspector</h3>
    </div>

    <p class="text-sm text-gray-400 mb-5">
      Check whether a specific jurisdiction and investor category combination is permitted under the current policy.
    </p>

    <!-- Form -->
    <form @submit.prevent="handleCheck" class="space-y-4">
      <!-- Jurisdiction search -->
      <div>
        <label for="jurisdiction-select" class="block text-sm font-medium text-gray-300 mb-1">
          Jurisdiction
        </label>
        <div class="relative">
          <input
            id="jurisdiction-select"
            v-model="jurisdictionSearch"
            type="text"
            placeholder="Search country…"
            class="w-full bg-white/5 border border-gray-700/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-biatec-accent/50 text-sm"
            autocomplete="off"
            aria-autocomplete="list"
            :aria-expanded="showJurisdictionList"
            aria-controls="jurisdiction-options"
            @focus="showJurisdictionList = true"
            @blur="hideList"
          />
          <i class="pi pi-search absolute right-3 top-2.5 text-gray-500 text-sm" aria-hidden="true"></i>
        </div>

        <!-- Dropdown list -->
        <ul
          v-if="showJurisdictionList && filteredJurisdictions.length > 0"
          id="jurisdiction-options"
          role="listbox"
          class="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-gray-800 border border-gray-700/50 rounded-lg shadow-xl"
        >
          <li
            v-for="item in filteredJurisdictions"
            :key="item.code"
            role="option"
            :aria-selected="selectedJurisdictionCode === item.code"
            class="px-3 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer flex items-center gap-2"
            @mousedown.prevent="selectJurisdiction(item)"
          >
            <span class="text-xs bg-white/10 rounded px-1 font-mono">{{ item.code }}</span>
            <span>{{ item.name }}</span>
            <span
              v-if="getJurisdictionStatus(item.code)"
              :class="jurisdictionStatusClass(item.code)"
              class="ml-auto text-xs px-1.5 py-0.5 rounded-full"
            >
              {{ getJurisdictionStatus(item.code) }}
            </span>
          </li>
        </ul>

        <div v-if="selectedJurisdictionCode" class="mt-1 text-xs text-biatec-accent">
          Selected: {{ selectedJurisdictionName }} ({{ selectedJurisdictionCode }})
        </div>
      </div>

      <!-- Investor category select -->
      <div>
        <label for="investor-category" class="block text-sm font-medium text-gray-300 mb-1">
          Investor Category
        </label>
        <select
          id="investor-category"
          v-model="selectedCategory"
          class="w-full bg-white/5 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent/50 text-sm"
        >
          <option value="" disabled class="bg-gray-800">Select category…</option>
          <option
            v-for="cat in policy.allowedInvestorCategories"
            :key="cat.category"
            :value="cat.category"
            class="bg-gray-800"
          >
            {{ cat.label }}
          </option>
        </select>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="!canCheck || isCheckingEligibility"
          class="flex-1 px-4 py-2 bg-biatec-accent text-white rounded-lg hover:bg-biatec-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
          aria-label="Check eligibility"
        >
          <i
            :class="isCheckingEligibility ? 'pi-spin pi-spinner' : 'pi-check-circle'"
            class="pi"
            aria-hidden="true"
          ></i>
          {{ isCheckingEligibility ? 'Checking…' : 'Check Eligibility' }}
        </button>
        <button
          v-if="eligibilityResult"
          type="button"
          @click="handleClear"
          class="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
          aria-label="Clear eligibility result"
        >
          Clear
        </button>
      </div>
    </form>

    <!-- Result panel -->
    <div
      v-if="eligibilityResult"
      class="mt-5 border rounded-xl p-4"
      :class="resultContainerClass"
      aria-live="polite"
      aria-label="Eligibility result"
    >
      <!-- Decision badge -->
      <div class="flex items-center gap-3 mb-4">
        <span
          :class="decisionBadgeClass"
          class="px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
        >
          <i :class="decisionIcon" class="pi mr-1.5" aria-hidden="true"></i>
          {{ eligibilityResult.decision.replace("_", " ") }}
        </span>
        <span class="text-xs text-gray-500">
          {{ eligibilityResult.jurisdictionName }} · {{ categoryLabel(eligibilityResult.investorCategory) }}
        </span>
      </div>

      <!-- Reasons list -->
      <ul class="space-y-2" aria-label="Eligibility reasons">
        <li
          v-for="reason in eligibilityResult.reasons"
          :key="reason.code"
          class="flex items-start gap-2 text-sm"
        >
          <i :class="reasonIcon(reason.severity)" class="pi mt-0.5 flex-shrink-0" aria-hidden="true"></i>
          <span :class="reasonTextClass(reason.severity)">{{ reason.message }}</span>
        </li>
      </ul>

      <div class="mt-3 text-xs text-gray-600">
        Simulated at {{ formattedSimulatedAt }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWhitelistPolicyStore } from "../../stores/whitelistPolicy";
import type { WhitelistPolicy, EligibilityReasonSeverity } from "../../stores/whitelistPolicy";
import { storeToRefs } from "pinia";

const props = defineProps<{
  policy: WhitelistPolicy;
}>();

const store = useWhitelistPolicyStore();
const { eligibilityResult, isCheckingEligibility } = storeToRefs(store);

// Form state
const jurisdictionSearch = ref("");
const selectedJurisdictionCode = ref("");
const selectedJurisdictionName = ref("");
const selectedCategory = ref("");
const showJurisdictionList = ref(false);

// All known jurisdictions (policy lists + common extras)
const ALL_JURISDICTIONS = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "CN", name: "China" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DE", name: "Germany" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "ES", name: "Spain" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "GR", name: "Greece" },
  { code: "HR", name: "Croatia" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SE", name: "Sweden" },
  { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" },
  { code: "US", name: "United States" },
];

const filteredJurisdictions = computed(() => {
  const q = jurisdictionSearch.value.toLowerCase();
  if (!q) return ALL_JURISDICTIONS;
  return ALL_JURISDICTIONS.filter(
    (j) => j.name.toLowerCase().includes(q) || j.code.toLowerCase().includes(q)
  );
});

function getJurisdictionStatus(code: string): string {
  if (props.policy.blockedJurisdictions.find((j) => j.code === code)) return "Blocked";
  if (props.policy.restrictedJurisdictions.find((j) => j.code === code)) return "Restricted";
  if (props.policy.allowedJurisdictions.find((j) => j.code === code)) return "Allowed";
  return "";
}

function jurisdictionStatusClass(code: string): string {
  const status = getJurisdictionStatus(code);
  if (status === "Blocked") return "bg-red-900/50 text-red-300";
  if (status === "Restricted") return "bg-amber-900/50 text-amber-300";
  if (status === "Allowed") return "bg-green-900/50 text-green-300";
  return "";
}

function selectJurisdiction(item: { code: string; name: string }) {
  selectedJurisdictionCode.value = item.code;
  selectedJurisdictionName.value = item.name;
  jurisdictionSearch.value = item.name;
  showJurisdictionList.value = false;
}

function hideList() {
  // Small delay to allow mousedown on a list option to fire before blur hides the list.
  // This prevents the dropdown from disappearing before the click is registered.
  const DROPDOWN_HIDE_DELAY_MS = 150;
  setTimeout(() => {
    showJurisdictionList.value = false;
  }, DROPDOWN_HIDE_DELAY_MS);
}

const canCheck = computed(
  () => selectedJurisdictionCode.value !== "" && selectedCategory.value !== ""
);

async function handleCheck() {
  if (!canCheck.value) return;
  await store.checkEligibility({
    jurisdictionCode: selectedJurisdictionCode.value,
    investorCategory: selectedCategory.value,
  });
}

function handleClear() {
  store.clearEligibility();
  jurisdictionSearch.value = "";
  selectedJurisdictionCode.value = "";
  selectedJurisdictionName.value = "";
  selectedCategory.value = "";
}

function categoryLabel(category: string): string {
  const rule = props.policy.allowedInvestorCategories.find((c) => c.category === category);
  return rule?.label ?? category;
}

// Result styling
const resultContainerClass = computed(() => {
  switch (eligibilityResult.value?.decision) {
    case "allowed":
      return "bg-green-900/20 border-green-700/50";
    case "denied":
      return "bg-red-900/20 border-red-700/50";
    case "requires_review":
      return "bg-amber-900/20 border-amber-700/50";
    default:
      return "bg-white/5 border-gray-700/50";
  }
});

const decisionBadgeClass = computed(() => {
  switch (eligibilityResult.value?.decision) {
    case "allowed":
      return "bg-green-700/60 text-green-200";
    case "denied":
      return "bg-red-700/60 text-red-200";
    case "requires_review":
      return "bg-amber-700/60 text-amber-200";
    default:
      return "bg-gray-700 text-gray-200";
  }
});

const decisionIcon = computed(() => {
  switch (eligibilityResult.value?.decision) {
    case "allowed":
      return "pi-check-circle";
    case "denied":
      return "pi-times-circle";
    case "requires_review":
      return "pi-exclamation-triangle";
    default:
      return "pi-question-circle";
  }
});

function reasonIcon(severity: EligibilityReasonSeverity): string {
  if (severity === "blocking") return "pi-times-circle text-red-400";
  if (severity === "warning") return "pi-exclamation-triangle text-amber-400";
  return "pi-info-circle text-blue-400";
}

function reasonTextClass(severity: EligibilityReasonSeverity): string {
  if (severity === "blocking") return "text-red-300";
  if (severity === "warning") return "text-amber-300";
  return "text-gray-300";
}

const formattedSimulatedAt = computed(() => {
  if (!eligibilityResult.value) return "";
  try {
    return new Date(eligibilityResult.value.simulatedAt).toLocaleTimeString();
  } catch {
    return "";
  }
});
</script>
