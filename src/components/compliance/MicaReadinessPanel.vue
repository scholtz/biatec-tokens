<template>
  <div class="glass-effect rounded-xl p-6">
    <div class="flex items-start justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <i class="pi pi-shield-check text-biatec-accent"></i>
          MICA Readiness
        </h2>
        <p class="text-sm text-gray-400 mt-1">EU Markets in Crypto-Assets regulation compliance status</p>
      </div>
      <button
        @click="refreshData"
        :disabled="loading"
        class="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        aria-label="Refresh MICA readiness data"
      >
        <i :class="['pi pi-refresh', loading ? 'animate-spin' : '']"></i>
        <span class="text-sm">Refresh</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
        <p class="text-gray-400">Loading MICA readiness data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-3"></i>
      <h3 class="text-lg font-semibold text-red-400 mb-2">Failed to Load MICA Data</h3>
      <p class="text-sm text-gray-400 mb-4">{{ error }}</p>
      <button
        @click="refreshData"
        class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Success State -->
    <div v-else-if="readinessData">
      <!-- Overall Score Card -->
      <div class="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-400 mb-1">Overall Readiness Score</div>
            <div class="flex items-center gap-4">
              <div class="text-5xl font-bold" :class="scoreColor">
                {{ readinessData.overallScore }}
                <span class="text-2xl text-gray-400">/100</span>
              </div>
              <div>
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    statusBadgeClass
                  ]"
                >
                  {{ statusLabel }}
                </span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-400">Last Updated</div>
            <div class="text-white font-medium">{{ formatTimestamp(readinessData.lastUpdated) }}</div>
            <div v-if="readinessData.nextReviewDate" class="text-xs text-gray-500 mt-1">
              Next review: {{ formatDate(readinessData.nextReviewDate) }}
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-4 bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            class="h-full transition-all duration-500"
            :class="progressBarColor"
            :style="{ width: `${readinessData.overallScore}%` }"
          ></div>
        </div>
      </div>

      <!-- Article Status List -->
      <div class="space-y-3">
        <h3 class="text-lg font-semibold text-white mb-4">MICA Article Compliance</h3>
        
        <div
          v-for="article in readinessData.articles"
          :key="article.articleNumber"
          class="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all group"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm font-mono text-gray-400 bg-white/10 px-2 py-1 rounded">
                  {{ article.articleNumber }}
                </span>
                <h4 class="text-white font-medium">{{ article.articleTitle }}</h4>
                <button
                  @click="toggleArticleDetails(article.articleNumber)"
                  class="ml-auto text-gray-400 hover:text-white transition-colors"
                  :aria-label="`Toggle details for ${article.articleTitle}`"
                  :aria-expanded="expandedArticles.has(article.articleNumber)"
                >
                  <i :class="['pi', expandedArticles.has(article.articleNumber) ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                </button>
              </div>
              
              <!-- Article Description (collapsible) -->
              <div v-if="expandedArticles.has(article.articleNumber)" class="mt-3 space-y-2">
                <p class="text-sm text-gray-300 leading-relaxed">{{ article.description }}</p>
                <div v-if="article.notes" class="text-xs text-gray-500 bg-white/5 rounded p-2">
                  <strong>Notes:</strong> {{ article.notes }}
                </div>
                <div class="text-xs text-gray-500">
                  Last checked: {{ formatTimestamp(article.lastChecked) }}
                </div>
              </div>
            </div>
            
            <!-- Status Badge -->
            <div>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                  articleStatusClass(article.status)
                ]"
              >
                {{ articleStatusLabel(article.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="readinessData.articles.length === 0" class="text-center py-8">
          <i class="pi pi-info-circle text-3xl text-gray-500 mb-3"></i>
          <p class="text-gray-400">No MICA article data available</p>
        </div>
      </div>

      <!-- Help Text -->
      <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
          <div class="text-sm text-gray-300">
            <strong class="text-blue-400">What is MICA?</strong>
            <p class="mt-1">
              The Markets in Crypto-Assets (MiCA) regulation is the EU's comprehensive framework for crypto-asset markets.
              This panel shows your token's compliance status for each relevant article, helping you prepare documentation
              for regulators and ensure your token meets EU standards.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State (no data) -->
    <div v-else class="text-center py-12">
      <i class="pi pi-file-excel text-4xl text-gray-500 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-400 mb-2">No MICA Data Available</h3>
      <p class="text-sm text-gray-500">MICA readiness assessment has not been performed yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { MicaReadinessData, MicaArticleStatus } from '../../types/compliance';

const props = defineProps<{
  tokenId?: string;
  network?: string;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const readinessData = ref<MicaReadinessData | null>(null);
const expandedArticles = ref(new Set<string>());

// Mock data for development - replace with actual API call
const loadReadinessData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock MICA readiness data
    readinessData.value = {
      overallScore: 72,
      status: 'good',
      lastUpdated: new Date().toISOString(),
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      articles: [
        {
          articleNumber: 'Art. 15',
          articleTitle: 'Reserve of Assets',
          description: 'Asset-referenced tokens must maintain a reserve of assets to back the token value. The reserve must be properly segregated and custody arrangements must ensure protection of holders\' rights.',
          status: 'compliant',
          lastChecked: new Date().toISOString(),
        },
        {
          articleNumber: 'Art. 30',
          articleTitle: 'Transparency Requirements',
          description: 'Issuers must publish a crypto-asset white paper and notify competent authorities. The white paper must contain clear and comprehensive information about the crypto-asset, the issuer, and associated risks.',
          status: 'partial',
          lastChecked: new Date().toISOString(),
          notes: 'White paper pending final legal review',
        },
        {
          articleNumber: 'Art. 36',
          articleTitle: 'Custody of Crypto-Assets',
          description: 'Safeguarding crypto-assets and cryptographic keys belonging to clients. Custody arrangements must ensure proper segregation and protection against insolvency.',
          status: 'compliant',
          lastChecked: new Date().toISOString(),
        },
        {
          articleNumber: 'Art. 41',
          articleTitle: 'Complaints Handling',
          description: 'Establish and maintain effective and transparent procedures for handling complaints from crypto-asset holders and potential holders.',
          status: 'non_compliant',
          lastChecked: new Date().toISOString(),
          notes: 'Complaints handling procedure needs to be documented and published',
        },
        {
          articleNumber: 'Art. 60',
          articleTitle: 'Prevention of Market Abuse',
          description: 'Measures to prevent market manipulation and insider dealing, including monitoring of suspicious transactions and reporting obligations.',
          status: 'partial',
          lastChecked: new Date().toISOString(),
          notes: 'Transaction monitoring system in implementation phase',
        },
        {
          articleNumber: 'Art. 76',
          articleTitle: 'Conflict of Interest Policy',
          description: 'Maintain and operate effective organizational and administrative arrangements to identify, prevent, manage and disclose conflicts of interest.',
          status: 'compliant',
          lastChecked: new Date().toISOString(),
        },
      ],
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load MICA readiness data';
    console.error('Error loading MICA readiness data:', err);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadReadinessData();
};

const toggleArticleDetails = (articleNumber: string) => {
  if (expandedArticles.value.has(articleNumber)) {
    expandedArticles.value.delete(articleNumber);
  } else {
    expandedArticles.value.add(articleNumber);
  }
};

const scoreColor = computed(() => {
  if (!readinessData.value) return 'text-gray-400';
  const score = readinessData.value.overallScore;
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
});

const progressBarColor = computed(() => {
  if (!readinessData.value) return 'bg-gray-500';
  const score = readinessData.value.overallScore;
  if (score >= 90) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
});

const statusBadgeClass = computed(() => {
  if (!readinessData.value) return '';
  switch (readinessData.value.status) {
    case 'excellent':
      return 'bg-green-500/20 text-green-400 border border-green-500/50';
    case 'good':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
    case 'fair':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    case 'poor':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
    case 'critical':
      return 'bg-red-500/20 text-red-400 border border-red-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
  }
});

const statusLabel = computed(() => {
  if (!readinessData.value) return 'Unknown';
  switch (readinessData.value.status) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'poor':
      return 'Poor';
    case 'critical':
      return 'Critical';
    default:
      return 'Unknown';
  }
});

const articleStatusClass = (status: MicaArticleStatus['status']) => {
  switch (status) {
    case 'compliant':
      return 'bg-green-500/20 text-green-400 border border-green-500/50';
    case 'partial':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    case 'non_compliant':
      return 'bg-red-500/20 text-red-400 border border-red-500/50';
    case 'not_applicable':
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
  }
};

const articleStatusLabel = (status: MicaArticleStatus['status']) => {
  switch (status) {
    case 'compliant':
      return 'Compliant';
    case 'partial':
      return 'Partial';
    case 'non_compliant':
      return 'Non-Compliant';
    case 'not_applicable':
      return 'N/A';
    default:
      return 'Unknown';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
};

onMounted(() => {
  loadReadinessData();
});
</script>
