<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <transition name="slide-over">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex"
        role="dialog"
        aria-modal="true"
        aria-label="Edit whitelist policy"
      >
        <!-- Overlay -->
        <div
          class="flex-1 bg-black/50 backdrop-blur-sm"
          @click="handleClose"
          aria-hidden="true"
        ></div>

        <!-- Panel -->
        <div class="w-full max-w-xl bg-gray-900 border-l border-gray-700/50 flex flex-col h-full shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="pi pi-pencil text-biatec-accent text-xl" aria-hidden="true"></i>
              <h2 class="text-lg font-semibold text-white">Edit Whitelist Policy</h2>
            </div>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-white transition-colors p-1 rounded"
              aria-label="Close edit panel"
            >
              <i class="pi pi-times text-xl" aria-hidden="true"></i>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-700/50 flex-shrink-0" role="tablist" aria-label="Policy edit sections">
            <button
              v-for="tab in TABS"
              :key="tab.id"
              role="tab"
              :aria-selected="activeTab === tab.id"
              :aria-controls="`tab-panel-${tab.id}`"
              :class="[
                'px-5 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-biatec-accent border-b-2 border-biatec-accent -mb-px'
                  : 'text-gray-400 hover:text-white',
              ]"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Scrollable content -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6" v-if="localDraft">
            <!-- Contradiction warnings -->
            <div
              v-if="contradictions.length > 0"
              class="bg-amber-900/30 border border-amber-700/50 rounded-lg px-4 py-3 space-y-1"
              role="alert"
              aria-live="polite"
            >
              <div class="flex items-center gap-2 text-amber-300 text-sm font-medium mb-1">
                <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                Contradiction detected
              </div>
              <p v-for="(c, i) in contradictions" :key="i" class="text-xs text-amber-400">{{ c }}</p>
            </div>

            <!-- Jurisdictions tab -->
            <div v-show="activeTab === 'jurisdictions'" :id="`tab-panel-jurisdictions`" role="tabpanel">
              <div v-for="listType in JURISDICTION_LISTS" :key="listType.key" class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-medium" :class="listType.titleClass">
                    <i :class="listType.icon" class="pi mr-1.5" aria-hidden="true"></i>
                    {{ listType.label }}
                  </h4>
                  <button
                    @click="toggleAddInput(listType.key)"
                    class="text-xs text-biatec-accent hover:text-biatec-accent/80 flex items-center gap-1"
                    :aria-label="`Add country to ${listType.label}`"
                  >
                    <i class="pi pi-plus text-xs" aria-hidden="true"></i>
                    Add country
                  </button>
                </div>

                <!-- Add country input -->
                <div v-if="activeAddInput === listType.key" class="mb-2 flex gap-2">
                  <input
                    v-model="addCountrySearch"
                    type="text"
                    placeholder="Search country…"
                    class="flex-1 bg-white/5 border border-gray-700/50 rounded-lg px-3 py-1.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-biatec-accent/50"
                    @keydown.enter="addJurisdiction(listType.key)"
                  />
                  <button
                    @click="addJurisdiction(listType.key)"
                    class="px-3 py-1.5 bg-biatec-accent text-white rounded-lg text-sm"
                    aria-label="Confirm add country"
                  >
                    Add
                  </button>
                  <button
                    @click="activeAddInput = null"
                    class="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm"
                    aria-label="Cancel add country"
                  >
                    Cancel
                  </button>
                </div>

                <!-- Country chips -->
                <div class="flex flex-wrap gap-2 min-h-8">
                  <span
                    v-if="getDraftList(listType.key).length === 0"
                    class="text-xs text-gray-600 italic"
                  >
                    None configured
                  </span>
                  <span
                    v-for="j in getDraftList(listType.key)"
                    :key="j.code"
                    :class="listType.chipClass"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  >
                    {{ j.name }} ({{ j.code }})
                    <button
                      @click="removeJurisdiction(listType.key, j.code)"
                      class="hover:opacity-70 transition-opacity ml-0.5"
                      :aria-label="`Remove ${j.name} from ${listType.label}`"
                    >
                      <i class="pi pi-times text-xs" aria-hidden="true"></i>
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <!-- Investor Categories tab -->
            <div v-show="activeTab === 'categories'" :id="`tab-panel-categories`" role="tabpanel">
              <div class="space-y-4">
                <div
                  v-for="(cat, idx) in localDraft.allowedInvestorCategories"
                  :key="cat.category"
                  class="bg-white/5 rounded-lg p-4 border border-gray-700/50"
                >
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-white">{{ cat.label }}</span>
                    <label :for="`cat-toggle-${cat.category}`" class="relative inline-flex items-center cursor-pointer">
                      <input
                        :id="`cat-toggle-${cat.category}`"
                        type="checkbox"
                        class="sr-only"
                        :checked="cat.allowed"
                        @change="toggleCategory(idx)"
                        :aria-label="`Enable ${cat.label}`"
                      />
                      <div
                        :class="cat.allowed ? 'bg-biatec-accent' : 'bg-gray-700'"
                        class="w-10 h-5 rounded-full transition-colors relative"
                      >
                        <div
                          :class="cat.allowed ? 'translate-x-5' : 'translate-x-0.5'"
                          class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                        ></div>
                      </div>
                    </label>
                  </div>

                  <div v-if="cat.allowed" class="flex items-center justify-between text-sm">
                    <label :for="`kyc-toggle-${cat.category}`" class="text-gray-400">KYC Required</label>
                    <label :for="`kyc-toggle-${cat.category}`" class="relative inline-flex items-center cursor-pointer">
                      <input
                        :id="`kyc-toggle-${cat.category}`"
                        type="checkbox"
                        class="sr-only"
                        :checked="cat.kycRequired"
                        @change="toggleKyc(idx)"
                        :aria-label="`Require KYC for ${cat.label}`"
                      />
                      <div
                        :class="cat.kycRequired ? 'bg-biatec-accent' : 'bg-gray-700'"
                        class="w-10 h-5 rounded-full transition-colors relative"
                      >
                        <div
                          :class="cat.kycRequired ? 'translate-x-5' : 'translate-x-0.5'"
                          class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                        ></div>
                      </div>
                    </label>
                  </div>

                  <input
                    v-model="localDraft.allowedInvestorCategories[idx].notes"
                    type="text"
                    :placeholder="`Notes for ${cat.label} (optional)`"
                    class="mt-2 w-full bg-white/5 border border-gray-700/50 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-biatec-accent/50"
                    :aria-label="`Notes for ${cat.label}`"
                  />
                </div>
              </div>
            </div>

            <!-- Settings tab -->
            <div v-show="activeTab === 'settings'" :id="`tab-panel-settings`" role="tabpanel">
              <div class="space-y-5">
                <div>
                  <label for="default-behavior" class="block text-sm font-medium text-gray-300 mb-1.5">
                    Default Behavior
                  </label>
                  <select
                    id="default-behavior"
                    v-model="localDraft.defaultBehavior"
                    class="w-full bg-white/5 border border-gray-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-biatec-accent/50"
                  >
                    <option value="allow_all" class="bg-gray-800">Allow All (unless explicitly blocked)</option>
                    <option value="deny_all" class="bg-gray-800">Deny All (unless explicitly allowed)</option>
                    <option value="allow_by_rule" class="bg-gray-800">Apply Rules (allowed list only)</option>
                  </select>
                </div>

                <div class="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-gray-700/50">
                  <div>
                    <div class="text-sm font-medium text-white">KYC Required</div>
                    <div class="text-xs text-gray-400 mt-0.5">All participants must complete identity verification</div>
                  </div>
                  <label for="kyc-global" class="relative inline-flex items-center cursor-pointer">
                    <input
                      id="kyc-global"
                      type="checkbox"
                      class="sr-only"
                      v-model="localDraft.kycRequired"
                      aria-label="Require KYC globally"
                    />
                    <div
                      :class="localDraft.kycRequired ? 'bg-biatec-accent' : 'bg-gray-700'"
                      class="w-10 h-5 rounded-full transition-colors relative"
                    >
                      <div
                        :class="localDraft.kycRequired ? 'translate-x-5' : 'translate-x-0.5'"
                        class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                      ></div>
                    </div>
                  </label>
                </div>

                <div class="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-gray-700/50">
                  <div>
                    <div class="text-sm font-medium text-white">Accreditation Required</div>
                    <div class="text-xs text-gray-400 mt-0.5">Investors must provide accreditation documentation</div>
                  </div>
                  <label for="accreditation-global" class="relative inline-flex items-center cursor-pointer">
                    <input
                      id="accreditation-global"
                      type="checkbox"
                      class="sr-only"
                      v-model="localDraft.accreditationRequired"
                      aria-label="Require accreditation globally"
                    />
                    <div
                      :class="localDraft.accreditationRequired ? 'bg-biatec-accent' : 'bg-gray-700'"
                      class="w-10 h-5 rounded-full transition-colors relative"
                    >
                      <div
                        :class="localDraft.accreditationRequired ? 'translate-x-5' : 'translate-x-0.5'"
                        class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                      ></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Confirmation / preview step -->
          <div v-if="showPreview && localDraft" class="absolute inset-0 bg-gray-900 z-10 flex flex-col">
            <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-700/50 flex-shrink-0">
              <i class="pi pi-eye text-biatec-accent text-xl" aria-hidden="true"></i>
              <h3 class="text-base font-semibold text-white">Preview Changes</h3>
            </div>
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <p class="text-sm text-gray-400 mb-4">
                You are about to save the following changes to the policy:
              </p>
              <ul class="space-y-2 text-sm" aria-label="Summary of changes">
                <li
                  v-for="(diff, i) in changeSummary"
                  :key="i"
                  class="flex items-start gap-2 text-gray-300"
                >
                  <i class="pi pi-arrow-right text-biatec-accent mt-0.5 flex-shrink-0 text-xs" aria-hidden="true"></i>
                  {{ diff }}
                </li>
                <li v-if="changeSummary.length === 0" class="text-gray-500 italic">
                  No changes detected.
                </li>
              </ul>
            </div>
            <div class="flex gap-3 px-6 py-4 border-t border-gray-700/50 flex-shrink-0">
              <button
                @click="handleConfirmSave"
                :disabled="isSaving"
                class="flex-1 px-4 py-2 bg-biatec-accent text-white rounded-lg hover:bg-biatec-accent/80 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                aria-label="Save policy"
              >
                <i :class="isSaving ? 'pi-spin pi-spinner' : 'pi-save'" class="pi" aria-hidden="true"></i>
                {{ isSaving ? 'Saving…' : 'Save Policy' }}
              </button>
              <button
                @click="showPreview = false"
                class="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
              >
                Back
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 px-6 py-4 border-t border-gray-700/50 flex-shrink-0">
            <button
              @click="handlePreview"
              class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              aria-label="Preview changes"
            >
              Preview Changes
            </button>
            <button
              @click="handleClose"
              class="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useWhitelistPolicyStore } from "../../stores/whitelistPolicy";
import type { WhitelistPolicy, JurisdictionPolicyEntry } from "../../stores/whitelistPolicy";
import { storeToRefs } from "pinia";

type JurisdictionListKey = "allowedJurisdictions" | "restrictedJurisdictions" | "blockedJurisdictions";

const props = defineProps<{
  policy: WhitelistPolicy;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const store = useWhitelistPolicyStore();
const { isSaving } = storeToRefs(store);

const activeTab = ref<"jurisdictions" | "categories" | "settings">("jurisdictions");
const activeAddInput = ref<JurisdictionListKey | null>(null);
const addCountrySearch = ref("");
const showPreview = ref(false);

// Local mutable copy of draft
const localDraft = ref<WhitelistPolicy | null>(null);

watch(
  () => props.visible,
  (v) => {
    if (v) {
      localDraft.value = JSON.parse(JSON.stringify(props.policy));
      showPreview.value = false;
      activeTab.value = "jurisdictions";
    }
  },
  { immediate: true }
);

const TABS = [
  { id: "jurisdictions" as const, label: "Jurisdictions" },
  { id: "categories" as const, label: "Investor Categories" },
  { id: "settings" as const, label: "Settings" },
];

const JURISDICTION_LISTS: {
  key: JurisdictionListKey;
  label: string;
  icon: string;
  titleClass: string;
  chipClass: string;
}[] = [
  {
    key: "allowedJurisdictions",
    label: "Allowed",
    icon: "pi-check-circle",
    titleClass: "text-green-400",
    chipClass: "bg-green-900/40 text-green-300 border border-green-700/50",
  },
  {
    key: "restrictedJurisdictions",
    label: "Restricted",
    icon: "pi-exclamation-triangle",
    titleClass: "text-amber-400",
    chipClass: "bg-amber-900/40 text-amber-300 border border-amber-700/50",
  },
  {
    key: "blockedJurisdictions",
    label: "Blocked",
    icon: "pi-ban",
    titleClass: "text-red-400",
    chipClass: "bg-red-900/40 text-red-300 border border-red-700/50",
  },
];

// ── Jurisdiction helpers ──────────────────────────────────────────────────────

function getDraftList(key: JurisdictionListKey): JurisdictionPolicyEntry[] {
  return (localDraft.value?.[key] as JurisdictionPolicyEntry[]) ?? [];
}

function toggleAddInput(key: JurisdictionListKey) {
  if (activeAddInput.value === key) {
    activeAddInput.value = null;
  } else {
    activeAddInput.value = key;
    addCountrySearch.value = "";
  }
}

const ALL_JURISDICTIONS = [
  { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" }, { code: "BG", name: "Bulgaria" },
  { code: "CN", name: "China" }, { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czechia" },
  { code: "DE", name: "Germany" }, { code: "DK", name: "Denmark" }, { code: "EE", name: "Estonia" },
  { code: "ES", name: "Spain" }, { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" }, { code: "GR", name: "Greece" }, { code: "HR", name: "Croatia" },
  { code: "HU", name: "Hungary" }, { code: "IE", name: "Ireland" }, { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" }, { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" }, { code: "MT", name: "Malta" }, { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" }, { code: "RO", name: "Romania" },
  { code: "SE", name: "Sweden" }, { code: "SI", name: "Slovenia" }, { code: "SK", name: "Slovakia" },
  { code: "US", name: "United States" },
];

function addJurisdiction(key: JurisdictionListKey) {
  if (!localDraft.value || !addCountrySearch.value.trim()) return;
  const q = addCountrySearch.value.toLowerCase();
  const found = ALL_JURISDICTIONS.find(
    (j) => j.code.toLowerCase() === q || j.name.toLowerCase() === q
  ) ?? {
    // Fallback: create a custom entry from the search text.
    // Uses the first two uppercase characters as an ISO-3166-1-alpha-2-style code.
    // This supports compliance teams who need to add non-standard territories while
    // a definitive jurisdiction list is being built out.
    code: q.toUpperCase().slice(0, 2),
    name: addCountrySearch.value.trim(),
  };

  const list = localDraft.value[key] as JurisdictionPolicyEntry[];
  if (!list.find((j) => j.code === found.code)) {
    list.push({ code: found.code, name: found.name });
  }
  addCountrySearch.value = "";
  activeAddInput.value = null;
}

function removeJurisdiction(key: JurisdictionListKey, code: string) {
  if (!localDraft.value) return;
  (localDraft.value[key] as JurisdictionPolicyEntry[]) = (
    localDraft.value[key] as JurisdictionPolicyEntry[]
  ).filter((j) => j.code !== code);
}

// ── Category helpers ──────────────────────────────────────────────────────────

function toggleCategory(idx: number) {
  if (!localDraft.value) return;
  localDraft.value.allowedInvestorCategories[idx].allowed =
    !localDraft.value.allowedInvestorCategories[idx].allowed;
}

function toggleKyc(idx: number) {
  if (!localDraft.value) return;
  localDraft.value.allowedInvestorCategories[idx].kycRequired =
    !localDraft.value.allowedInvestorCategories[idx].kycRequired;
}

// ── Contradictions ────────────────────────────────────────────────────────────

const contradictions = computed<string[]>(() => {
  if (!localDraft.value) return [];
  const warnings: string[] = [];
  const a = new Set((localDraft.value.allowedJurisdictions as JurisdictionPolicyEntry[]).map((j) => j.code));
  const r = new Set((localDraft.value.restrictedJurisdictions as JurisdictionPolicyEntry[]).map((j) => j.code));
  const b = new Set((localDraft.value.blockedJurisdictions as JurisdictionPolicyEntry[]).map((j) => j.code));

  a.forEach((code) => {
    const jName = (localDraft.value!.allowedJurisdictions as JurisdictionPolicyEntry[]).find((j) => j.code === code)?.name ?? code;
    if (r.has(code)) warnings.push(`${jName} is in both Allowed and Restricted.`);
    if (b.has(code)) warnings.push(`${jName} is in both Allowed and Blocked.`);
  });
  r.forEach((code) => {
    const jName = (localDraft.value!.restrictedJurisdictions as JurisdictionPolicyEntry[]).find((j) => j.code === code)?.name ?? code;
    if (b.has(code)) warnings.push(`${jName} is in both Restricted and Blocked.`);
  });
  return warnings;
});

// ── Change summary / diff ─────────────────────────────────────────────────────

const changeSummary = computed<string[]>(() => {
  if (!localDraft.value) return [];
  const changes: string[] = [];
  const orig = props.policy;
  const draft = localDraft.value;

  const origAllowed = new Set(orig.allowedJurisdictions.map((j) => j.code));
  const draftAllowed = new Set((draft.allowedJurisdictions as JurisdictionPolicyEntry[]).map((j) => j.code));
  (draft.allowedJurisdictions as JurisdictionPolicyEntry[]).forEach((j) => {
    if (!origAllowed.has(j.code)) changes.push(`Add ${j.name} to Allowed list`);
  });
  orig.allowedJurisdictions.forEach((j) => {
    if (!draftAllowed.has(j.code)) changes.push(`Remove ${j.name} from Allowed list`);
  });

  const origBlocked = new Set(orig.blockedJurisdictions.map((j) => j.code));
  const draftBlocked = new Set((draft.blockedJurisdictions as JurisdictionPolicyEntry[]).map((j) => j.code));
  (draft.blockedJurisdictions as JurisdictionPolicyEntry[]).forEach((j) => {
    if (!origBlocked.has(j.code)) changes.push(`Add ${j.name} to Blocked list`);
  });
  orig.blockedJurisdictions.forEach((j) => {
    if (!draftBlocked.has(j.code)) changes.push(`Remove ${j.name} from Blocked list`);
  });

  orig.allowedInvestorCategories.forEach((c, i) => {
    const d = draft.allowedInvestorCategories[i];
    if (d && d.allowed !== c.allowed) {
      changes.push(`${c.label}: ${d.allowed ? "Enable" : "Disable"} participation`);
    }
    if (d && d.kycRequired !== c.kycRequired) {
      changes.push(`${c.label}: ${d.kycRequired ? "Enable" : "Disable"} KYC requirement`);
    }
  });

  if (draft.defaultBehavior !== orig.defaultBehavior)
    changes.push(`Default behavior: ${orig.defaultBehavior} → ${draft.defaultBehavior}`);
  if (draft.kycRequired !== orig.kycRequired)
    changes.push(`Global KYC: ${draft.kycRequired ? "Enabled" : "Disabled"}`);
  if (draft.accreditationRequired !== orig.accreditationRequired)
    changes.push(`Accreditation: ${draft.accreditationRequired ? "Enabled" : "Disabled"}`);

  return changes;
});

// ── Actions ───────────────────────────────────────────────────────────────────

function handlePreview() {
  showPreview.value = true;
}

async function handleConfirmSave() {
  if (!localDraft.value) return;
  store.startEdit();
  store.updateDraft({ ...localDraft.value });
  await store.saveDraft();
  showPreview.value = false;
  emit("saved");
  emit("close");
}

function handleClose() {
  store.cancelEdit();
  emit("close");
}
</script>

<style scoped>
.slide-over-enter-active,
.slide-over-leave-active {
  transition: opacity 0.2s ease;
}
.slide-over-enter-active .bg-gray-900,
.slide-over-leave-active .bg-gray-900 {
  transition: transform 0.25s ease;
}
.slide-over-enter-from {
  opacity: 0;
}
.slide-over-enter-from .bg-gray-900 {
  transform: translateX(100%);
}
.slide-over-leave-to {
  opacity: 0;
}
</style>
