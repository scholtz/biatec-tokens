<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8" data-testid="whitelist-policy-dashboard">
      <div class="max-w-7xl mx-auto">

        <!-- Back button + Header -->
        <div class="mb-8">
          <button
            @click="$router.back()"
            class="mb-4 text-gray-400 hover:text-white transition-colors flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
            aria-label="Go back"
            data-testid="back-button"
          >
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            <span>Back</span>
          </button>

          <div class="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <i class="pi pi-shield text-biatec-accent text-2xl" aria-hidden="true"></i>
                Whitelist Policy Management
              </h1>
              <p class="text-gray-400">
                Manage the rules that govern investor participation — jurisdictions, categories, and compliance requirements.
              </p>
            </div>

            <div v-if="!isLoading && hasPolicy" class="flex gap-3 flex-wrap">
              <button
                @click="toggleEligibilityInspector"
                class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                :aria-expanded="showEligibilityInspector"
                aria-controls="eligibility-inspector-container"
                aria-label="Open eligibility inspector"
                data-testid="review-eligibility-button"
              >
                <i class="pi pi-search" aria-hidden="true"></i>
                Review Eligibility
              </button>
              <button
                @click="openEditPanel"
                class="px-4 py-2 bg-biatec-accent text-white rounded-lg hover:bg-biatec-accent/80 transition-colors flex items-center gap-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                aria-label="Edit policy"
                data-testid="edit-policy-button"
              >
                <i class="pi pi-pencil" aria-hidden="true"></i>
                Edit Policy
              </button>
            </div>
          </div>
        </div>

        <!-- Loading skeleton -->
        <!-- Screen-reader announcement for loading state -->
        <div v-if="isLoading" class="sr-only" role="status" aria-live="polite">Loading policy, please wait…</div>
        <!-- Visual skeleton — aria-hidden: no meaningful content for AT (bg-white/10 skips axe contrast check) -->
        <div v-if="isLoading" class="space-y-6 animate-pulse" aria-hidden="true">
          <div class="glass-effect rounded-xl p-6">
            <div class="h-5 bg-white/10 rounded w-1/3 mb-3"></div>
            <div class="h-4 bg-white/10 rounded w-full mb-2"></div>
            <div class="h-4 bg-white/10 rounded w-5/6 mb-4"></div>
            <div class="grid grid-cols-3 gap-3">
              <div class="h-12 bg-white/10 rounded"></div>
              <div class="h-12 bg-white/10 rounded"></div>
              <div class="h-12 bg-white/10 rounded"></div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="i in 3" :key="i" class="glass-effect rounded-xl p-5 h-40"></div>
          </div>
        </div>

        <!-- Error state -->
        <div
          v-else-if="error"
          class="glass-effect rounded-xl p-8 border border-red-700/50 text-center"
          role="alert"
          aria-label="Error loading policy"
        >
          <i class="pi pi-exclamation-circle text-red-400 text-4xl mb-4" aria-hidden="true"></i>
          <h2 class="text-xl font-semibold text-white mb-2">Unable to Load Policy</h2>
          <p class="text-gray-400 mb-6">{{ error }}</p>
          <button
            @click="retryFetch"
            class="px-5 py-2 bg-biatec-accent text-white rounded-lg hover:bg-biatec-accent/80 transition-colors"
            aria-label="Retry loading policy"
            data-testid="retry-button"
          >
            <i class="pi pi-refresh mr-2" aria-hidden="true"></i>
            Retry
          </button>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!hasPolicy"
          class="glass-effect rounded-xl p-12 text-center"
          data-testid="empty-state"
        >
          <i class="pi pi-shield text-gray-600 text-5xl mb-5" aria-hidden="true"></i>
          <h2 class="text-xl font-semibold text-white mb-3">No Policy Configured</h2>
          <p class="text-gray-400 max-w-md mx-auto mb-6">
            Your token doesn't have a whitelist policy yet. Configure who can participate by setting up allowed jurisdictions and investor categories.
          </p>
          <button
            @click="initializePolicy"
            class="px-6 py-2.5 bg-biatec-accent text-white rounded-lg hover:bg-biatec-accent/80 transition-colors font-medium"
            aria-label="Set up whitelist policy"
            data-testid="setup-policy-button"
          >
            <i class="pi pi-plus mr-2" aria-hidden="true"></i>
            Set Up Policy
          </button>
        </div>

        <!-- Policy loaded -->
        <div v-else-if="policy" class="space-y-6">

          <!-- Executive summary + metadata row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
              <PolicySummaryPanel :policy="policy" :loading="isLoading" />
            </div>
            <div>
              <PolicyAuditCard :policy="policy" />
            </div>
          </div>

          <!-- Jurisdiction grids -->
          <section aria-labelledby="jurisdictions-heading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <h2 id="jurisdictions-heading" class="sr-only">Jurisdiction Rules</h2>
            <!-- Allowed -->
            <div
              class="glass-effect rounded-xl p-5"
              data-testid="allowed-jurisdictions-panel"
              role="region"
              aria-labelledby="allowed-regions-heading"
            >
              <div class="flex items-center gap-2 mb-3">
                <i class="pi pi-check-circle text-green-400" aria-hidden="true"></i>
                <h3 id="allowed-regions-heading" class="text-sm font-semibold text-green-400">Allowed Regions</h3>
                <span
                  class="ml-auto text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full"
                  :aria-label="`${policy.allowedJurisdictions.length} allowed region${policy.allowedJurisdictions.length !== 1 ? 's' : ''}`"
                >
                  {{ policy.allowedJurisdictions.length }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2" role="list" :aria-label="`Allowed regions list (${policy.allowedJurisdictions.length})`">
                <span
                  v-if="policy.allowedJurisdictions.length === 0"
                  class="text-xs text-gray-300 italic"
                  role="listitem"
                >None configured</span>
                <span
                  v-for="j in policy.allowedJurisdictions"
                  :key="j.code"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-800 text-green-200 border border-green-700"
                  :title="j.reason"
                  role="listitem"
                >
                  {{ j.name }}
                </span>
              </div>
            </div>

            <!-- Restricted -->
            <div
              class="glass-effect rounded-xl p-5"
              data-testid="restricted-jurisdictions-panel"
              role="region"
              aria-labelledby="restricted-regions-heading"
            >
              <div class="flex items-center gap-2 mb-3">
                <i class="pi pi-exclamation-triangle text-amber-400" aria-hidden="true"></i>
                <h3 id="restricted-regions-heading" class="text-sm font-semibold text-amber-400">Restricted Regions</h3>
                <span
                  class="ml-auto text-xs bg-amber-800 text-amber-200 px-2 py-0.5 rounded-full"
                  :aria-label="`${policy.restrictedJurisdictions.length} restricted region${policy.restrictedJurisdictions.length !== 1 ? 's' : ''}`"
                >
                  {{ policy.restrictedJurisdictions.length }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2" role="list" :aria-label="`Restricted regions list (${policy.restrictedJurisdictions.length})`">
                <span
                  v-if="policy.restrictedJurisdictions.length === 0"
                  class="text-xs text-gray-300 italic"
                  role="listitem"
                >None</span>
                <span
                  v-for="j in policy.restrictedJurisdictions"
                  :key="j.code"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-800 text-amber-200 border border-amber-700"
                  :title="j.reason"
                  role="listitem"
                >
                  {{ j.name }}
                </span>
              </div>
            </div>

            <!-- Blocked -->
            <div
              class="glass-effect rounded-xl p-5"
              data-testid="blocked-jurisdictions-panel"
              role="region"
              aria-labelledby="blocked-regions-heading"
            >
              <div class="flex items-center gap-2 mb-3">
                <i class="pi pi-ban text-red-400" aria-hidden="true"></i>
                <h3 id="blocked-regions-heading" class="text-sm font-semibold text-red-400">Blocked Regions</h3>
                <span
                  class="ml-auto text-xs bg-red-800 text-red-200 px-2 py-0.5 rounded-full"
                  :aria-label="`${policy.blockedJurisdictions.length} blocked region${policy.blockedJurisdictions.length !== 1 ? 's' : ''}`"
                >
                  {{ policy.blockedJurisdictions.length }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2" role="list" :aria-label="`Blocked regions list (${policy.blockedJurisdictions.length})`">
                <span
                  v-if="policy.blockedJurisdictions.length === 0"
                  class="text-xs text-gray-300 italic"
                  role="listitem"
                >None</span>
                <span
                  v-for="j in policy.blockedJurisdictions"
                  :key="j.code"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-800 text-red-200 border border-red-700"
                  :title="j.reason"
                  role="listitem"
                >
                  {{ j.name }}
                </span>
              </div>
            </div>
          </section>

          <!-- Investor Categories -->
          <div class="glass-effect rounded-xl p-6">
            <h3 class="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <i class="pi pi-users text-biatec-accent" aria-hidden="true"></i>
              Investor Categories
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm" role="table" aria-label="Investor category rules">
                <thead>
                  <tr class="text-left text-gray-300 border-b border-gray-700/50">
                    <th scope="col" class="pb-3 font-medium">Category</th>
                    <th scope="col" class="pb-3 font-medium">Status</th>
                    <th scope="col" class="pb-3 font-medium">KYC Required</th>
                    <th scope="col" class="pb-3 font-medium hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-700/30">
                  <tr v-for="cat in policy.allowedInvestorCategories" :key="cat.category" class="py-3">
                    <td class="py-3 text-white font-medium">{{ cat.label }}</td>
                    <td class="py-3">
                      <!-- Status badge: icon + text ensures status is not color-only (WCAG SC 1.4.1) -->
                      <span
                        :class="cat.allowed
                          ? 'bg-green-800 text-green-200 border border-green-700'
                          : 'bg-red-800 text-red-200 border border-red-700'"
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        :aria-label="cat.allowed ? 'Status: Allowed' : 'Status: Denied'"
                      >
                        <i
                          :class="cat.allowed ? 'pi-check-circle' : 'pi-times-circle'"
                          class="pi text-xs"
                          aria-hidden="true"
                        ></i>
                        {{ cat.allowed ? 'Allowed' : 'Denied' }}
                      </span>
                    </td>
                    <td class="py-3">
                      <!-- KYC indicator: icon + text so requirement is not color-only (WCAG SC 1.4.1) -->
                      <span
                        class="inline-flex items-center gap-1"
                        :class="cat.kycRequired ? 'text-amber-400' : 'text-gray-300'"
                      >
                        <i
                          :class="cat.kycRequired ? 'pi-id-card' : 'pi-minus-circle'"
                          class="pi text-xs"
                          aria-hidden="true"
                        ></i>
                        {{ cat.kycRequired ? 'Required' : 'Optional' }}
                      </span>
                    </td>
                    <td class="py-3 text-gray-400 hidden md:table-cell">{{ cat.notes ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Policy Gaps -->
          <div v-if="hasGaps" class="glass-effect rounded-xl p-6 border border-amber-700/30">
            <h3 class="text-base font-semibold text-amber-300 mb-4 flex items-center gap-2">
              <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
              Policy Gaps &amp; Warnings
            </h3>
            <ul class="space-y-2">
              <li
                v-for="gap in policy.gaps"
                :key="gap.id"
                :class="gap.severity === 'error' ? 'border-red-700 bg-red-800' : 'border-amber-700 bg-amber-800'"
                class="flex items-start gap-3 border rounded-lg px-4 py-3 text-sm"
              >
                <i
                  :class="gap.severity === 'error' ? 'pi-times-circle text-red-400' : 'pi-exclamation-triangle text-amber-400'"
                  class="pi mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                ></i>
                <span :class="gap.severity === 'error' ? 'text-red-200' : 'text-amber-200'">{{ gap.message }}</span>
              </li>
            </ul>
          </div>

          <!-- Eligibility Inspector (shown on demand) -->
          <!-- sr-only live announcement for screen readers when inspector is toggled -->
          <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {{ showEligibilityInspector ? 'Eligibility inspector expanded.' : '' }}
          </div>
          <div
            v-if="showEligibilityInspector"
            id="eligibility-inspector-container"
            data-testid="eligibility-inspector-container"
          >
            <EligibilityInspector :policy="policy" />
          </div>
        </div>

      </div>
    </div>

    <!-- Edit Panel (slide-over) -->
    <PolicyEditPanel
      v-if="policy"
      :policy="policy"
      :visible="showEditPanel"
      @close="showEditPanel = false"
      @saved="handlePolicySaved"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import MainLayout from "../layout/MainLayout.vue";
import PolicySummaryPanel from "../components/whitelist/PolicySummaryPanel.vue";
import PolicyAuditCard from "../components/whitelist/PolicyAuditCard.vue";
import EligibilityInspector from "../components/whitelist/EligibilityInspector.vue";
import PolicyEditPanel from "../components/whitelist/PolicyEditPanel.vue";
import { useWhitelistPolicyStore } from "../stores/whitelistPolicy";

const store = useWhitelistPolicyStore();
const { policy, isLoading, error, hasPolicy, hasGaps } = storeToRefs(store);

const showEligibilityInspector = ref(false);
const showEditPanel = ref(false);

// Default token ID — in a production multi-token scenario this would come from route params
const TOKEN_ID = "token-001";

onMounted(() => {
  store.fetchPolicy(TOKEN_ID);
});

function retryFetch() {
  store.fetchPolicy(TOKEN_ID);
}

function initializePolicy() {
  store.fetchPolicy(TOKEN_ID);
}

function toggleEligibilityInspector() {
  showEligibilityInspector.value = !showEligibilityInspector.value;
}

function openEditPanel() {
  showEditPanel.value = true;
}

function handlePolicySaved() {
  showEditPanel.value = false;
}
</script>
