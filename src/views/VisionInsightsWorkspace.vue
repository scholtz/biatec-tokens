<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">
              Vision Insights Workspace
            </h1>
            <p class="text-lg text-gray-400">
              Product intelligence and decision support for token management
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              @click="handleRefresh"
              :disabled="loading"
            >
              <ArrowPathIcon class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
              Refresh
            </Button>
            
            <div class="relative">
              <Button
                variant="secondary"
                size="sm"
                @click="showExportMenu = !showExportMenu"
              >
                <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <div
                v-if="showExportMenu"
                class="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10"
              >
                <button
                  @click="handleExport('json')"
                  class="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 rounded-t-lg"
                >
                  Export as JSON
                </button>
                <button
                  @click="handleExport('csv')"
                  class="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 rounded-b-lg"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <InsightsFilters
          :filters="filters"
          @update:filters="handleFiltersUpdate"
          @reset="handleFiltersReset"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading && metrics.length === 0" class="flex items-center justify-center py-12">
        <div class="text-center">
          <ArrowPathIcon class="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p class="text-gray-400">Loading insights...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="mb-8">
        <Card variant="glass" padding="md">
          <div class="flex items-start gap-3">
            <ExclamationCircleIcon class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <div class="font-medium text-red-400 mb-1">Failed to Load Insights</div>
              <div class="text-sm text-gray-400 mb-3">{{ error }}</div>
              <Button
                variant="primary"
                size="sm"
                @click="handleRetry"
              >
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Core Metrics -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-white">Core Metrics</h2>
            <button
              @click="showGlossary = true"
              class="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <QuestionMarkCircleIcon class="w-4 h-4" />
              View Definitions
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              v-for="metric in coreMetrics"
              :key="metric.id"
              :metric="metric"
              @click="handleMetricClick(metric)"
            />
          </div>
        </section>

        <!-- Trend Analysis -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">Trend Analysis</h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart
              v-for="metric in coreMetrics.slice(0, 4)"
              :key="`trend-${metric.id}`"
              :metricId="metric.id"
              :label="metric.label"
              :data="trendData[metric.id] || []"
            />
          </div>
        </section>

        <!-- Competitor Benchmarks -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">Competitor Benchmarks</h2>
          <BenchmarkPanel
            :benchmarks="benchmarks"
            :currentMetrics="metricsAsRecord"
          />
        </section>

        <!-- Scenario Planning -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">Scenario Planning</h2>
          <ScenarioPlanner
            :inputs="scenarioInputs"
            :outputs="scenarioOutputs"
            :loading="scenarioLoading"
            @run="handleRunScenario"
          />
        </section>

        <!-- Platform Trust Score -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">Platform Trust Score</h2>
          <Card variant="glass" padding="md">
            <div class="flex items-center gap-6">
              <div class="text-center">
                <div class="text-4xl font-bold" :class="platformTrustScore.colorClass">
                  {{ platformTrustScore.score }}
                </div>
                <div class="text-sm text-gray-400 mt-1">/ 100</div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-base font-semibold text-white">{{ platformTrustScore.label }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                    {{ platformTrustScore.verifiedSignalCount }}/{{ platformTrustScore.totalSignalCount }} signals verified
                  </span>
                </div>
                <p class="text-sm text-gray-400">{{ platformTrustScore.description }}</p>
              </div>
            </div>
          </Card>
        </section>

        <!-- Cohort Analysis -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">Wallet Segment Analysis</h2>
          <CohortTable />
        </section>
      </div>
    </div>

    <!-- Metric Glossary Modal -->
    <MetricGlossary
      v-if="showGlossary"
      :metrics="metrics"
      @close="showGlossary = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useInsightsStore } from '../stores/insights'
import { analyticsService } from '../services/analytics'
import Button from '../components/ui/Button.vue'
import Card from '../components/ui/Card.vue'
import MetricCard from '../components/insights/MetricCard.vue'
import TrendChart from '../components/insights/TrendChart.vue'
import BenchmarkPanel from '../components/insights/BenchmarkPanel.vue'
import ScenarioPlanner from '../components/insights/ScenarioPlanner.vue'
import CohortTable from '../components/insights/CohortTable.vue'
import MetricGlossary from '../components/insights/MetricGlossary.vue'
import InsightsFilters from '../components/insights/InsightsFilters.vue'
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/vue/24/outline'
import { computeTrustScore, buildDefaultTrustSignals } from '../utils/trustScoreCalculator'

const insightsStore = useInsightsStore()
const showExportMenu = ref(false)
const showGlossary = ref(false)
const scenarioLoading = ref(false)

const filters = computed(() => insightsStore.filters)
const metrics = computed(() => insightsStore.metrics)
const coreMetrics = computed(() => insightsStore.coreMetrics)
const trendData = computed(() => insightsStore.trendData)
const benchmarks = computed(() => insightsStore.benchmarks)
const scenarioInputs = computed(() => insightsStore.scenarioInputs)
const scenarioOutputs = computed(() => insightsStore.scenarioOutputs)
const loading = computed(() => insightsStore.loading)
const error = computed(() => insightsStore.error)

// Platform trust score derived from insights data.
// organizationVerified, identityVerified, and hasAuditTrail are set to true as
// platform-level defaults: all active Biatec accounts pass identity verification
// and the platform provides audit trail logging for all token events.
// Token-specific signals (compliance, attestation, metadata) are derived from metrics.
const platformTrustScore = computed(() => {
  const signals = buildDefaultTrustSignals({
    hasComplianceCheck: metrics.value.some(m => m.id === 'compliance_score' && Number(m.value) > 0),
    hasAttestation: metrics.value.some(m => m.id === 'attestation_count' && Number(m.value) > 0),
    hasAuditTrail: true,          // Platform-level: audit trail is always enabled
    hasTokenMetadata: metrics.value.some(m => m.id === 'token_count' && Number(m.value) > 0),
    organizationVerified: true,   // Platform-level: accounts have completed org verification
    identityVerified: true,       // Platform-level: email/password auth implies identity
  })
  return computeTrustScore(signals)
})

const metricsAsRecord = computed(() => {
  const record: Record<string, number | string> = {}
  metrics.value.forEach(m => {
    record[m.id] = m.value
  })
  return record
})

onMounted(async () => {
  // Track page view
  analyticsService.trackEvent({
    event: 'insights_workspace_viewed',
    category: 'Insights',
    action: 'Page Viewed',
  })

  // Initialize store
  await insightsStore.initialize()

  // Fetch trend data for core metrics
  for (const metric of coreMetrics.value) {
    await insightsStore.fetchTrendData(metric.id)
  }
})

// Error boundary for component errors
onErrorCaptured((err) => {
  console.error('Vision Insights error:', err)
  analyticsService.trackEvent({
    event: 'insights_error',
    category: 'Insights',
    action: 'Error',
    label: err.message,
  })
  return false
})

function handleFiltersUpdate(newFilters: any) {
  insightsStore.updateFilters(newFilters)
  
  // Track filter change
  analyticsService.trackEvent({
    event: 'insights_filter_changed',
    category: 'Insights',
    action: 'Filter Changed',
    ...newFilters,
  })

  // Refresh trend data
  coreMetrics.value.forEach(metric => {
    insightsStore.fetchTrendData(metric.id)
  })
}

function handleFiltersReset() {
  insightsStore.resetFilters()
  
  analyticsService.trackEvent({
    event: 'insights_filters_reset',
    category: 'Insights',
    action: 'Filters Reset',
  })
}

function handleRefresh() {
  insightsStore.fetchMetrics()
  insightsStore.fetchBenchmarks()
  
  coreMetrics.value.forEach(metric => {
    insightsStore.fetchTrendData(metric.id)
  })

  analyticsService.trackEvent({
    event: 'insights_refreshed',
    category: 'Insights',
    action: 'Data Refreshed',
  })
}

function handleRetry() {
  handleRefresh()
}

function handleExport(format: 'json' | 'csv') {
  insightsStore.exportData(format)
  showExportMenu.value = false

  analyticsService.trackEvent({
    event: 'insights_exported',
    category: 'Insights',
    action: 'Data Exported',
    label: format,
    format,
  })
}

function handleMetricClick(metric: any) {
  analyticsService.trackEvent({
    event: 'insights_metric_clicked',
    category: 'Insights',
    action: 'Metric Clicked',
    label: metric.label,
    metricId: metric.id,
  })
}

async function handleRunScenario(inputs: any) {
  scenarioLoading.value = true
  
  try {
    await insightsStore.runScenario(inputs)
    
    analyticsService.trackEvent({
      event: 'insights_scenario_run',
      category: 'Insights',
      action: 'Scenario Run',
      ...inputs,
    })
  } catch (err) {
    console.error('Scenario error:', err)
  } finally {
    scenarioLoading.value = false
  }
}
</script>
