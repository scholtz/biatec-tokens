import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface InsightsFilters {
  timeframe: '7d' | '30d' | '90d' | '1y' | 'all'
  networks: string[]
  tokenIds: string[]
  walletSegment: 'all' | 'whales' | 'retail' | 'institutional' | 'active' | 'dormant'
}

export interface MetricData {
  id: string
  label: string
  value: number | string
  change: number // percentage change
  trend: 'up' | 'down' | 'stable'
  definition: string
  timestamp: string
}

export interface TrendDataPoint {
  timestamp: string
  value: number
  label?: string
}

export interface CompetitorBenchmark {
  id: string
  name: string
  metrics: Record<string, number>
  source: string
  lastUpdated: string
}

export interface ScenarioInput {
  campaignLift: number // percentage
  liquidityContribution: number // dollar amount
  retentionChange: number // percentage
}

export interface ScenarioOutput {
  projectedAdoption: number
  projectedVolume: number
  projectedRetention: number
  confidenceRange: {
    low: number
    high: number
  }
}

const INSIGHTS_FILTERS_STORAGE_KEY = 'biatec_insights_filters'

export const useInsightsStore = defineStore('insights', () => {
  // State
  const filters = ref<InsightsFilters>({
    timeframe: '30d',
    networks: [],
    tokenIds: [],
    walletSegment: 'all',
  })

  const metrics = ref<MetricData[]>([])
  const trendData = ref<Record<string, TrendDataPoint[]>>({})
  const benchmarks = ref<CompetitorBenchmark[]>([])
  const scenarioInputs = ref<ScenarioInput>({
    campaignLift: 0,
    liquidityContribution: 0,
    retentionChange: 0,
  })
  const scenarioOutputs = ref<ScenarioOutput | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const featureEnabled = ref(true) // Feature flag, will be configurable

  // Computed
  const hasActiveFilters = computed(() => {
    return (
      filters.value.networks.length > 0 ||
      filters.value.tokenIds.length > 0 ||
      filters.value.walletSegment !== 'all'
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.networks.length > 0) count++
    if (filters.value.tokenIds.length > 0) count++
    if (filters.value.walletSegment !== 'all') count++
    return count
  })

  const coreMetrics = computed(() => {
    // Return the 5 core metrics as specified in acceptance criteria
    return metrics.value.filter(m => 
      ['adoption', 'retention', 'txQuality', 'liquidityHealth', 'concentrationRisk'].includes(m.id)
    )
  })

  // Actions
  function updateFilters(newFilters: Partial<InsightsFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    saveFiltersToStorage()
    // Trigger data refresh
    fetchMetrics()
  }

  function resetFilters() {
    filters.value = {
      timeframe: '30d',
      networks: [],
      tokenIds: [],
      walletSegment: 'all',
    }
    saveFiltersToStorage()
    fetchMetrics()
  }

  function saveFiltersToStorage() {
    try {
      localStorage.setItem(INSIGHTS_FILTERS_STORAGE_KEY, JSON.stringify(filters.value))
    } catch (e) {
      console.warn('Failed to save insights filters to localStorage:', e)
    }
  }

  function loadFiltersFromStorage() {
    try {
      const saved = localStorage.getItem(INSIGHTS_FILTERS_STORAGE_KEY)
      if (saved) {
        filters.value = JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load insights filters from localStorage:', e)
    }
  }

  async function fetchMetrics() {
    loading.value = true
    error.value = null

    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.get('/insights/metrics', { params: filters.value })
      // metrics.value = response.data

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500))
      metrics.value = generateMockMetrics()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch metrics'
      console.error('Error fetching metrics:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchTrendData(metricId: string) {
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.get(`/insights/trends/${metricId}`, { params: filters.value })
      // trendData.value[metricId] = response.data

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 300))
      trendData.value[metricId] = generateMockTrendData(metricId)
    } catch (e) {
      console.error(`Error fetching trend data for ${metricId}:`, e)
    }
  }

  async function fetchBenchmarks() {
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.get('/insights/benchmarks')
      // benchmarks.value = response.data

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 400))
      benchmarks.value = generateMockBenchmarks()
    } catch (e) {
      console.error('Error fetching benchmarks:', e)
    }
  }

  async function runScenario(inputs: ScenarioInput) {
    scenarioInputs.value = inputs
    
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.post('/insights/scenario', inputs)
      // scenarioOutputs.value = response.data

      // Mock calculation for now
      await new Promise(resolve => setTimeout(resolve, 600))
      scenarioOutputs.value = calculateMockScenario(inputs)
    } catch (e) {
      console.error('Error running scenario:', e)
      throw e
    }
  }

  function exportData(format: 'csv' | 'json') {
    const data = {
      filters: filters.value,
      metrics: metrics.value,
      benchmarks: benchmarks.value,
      scenario: scenarioOutputs.value,
      exportedAt: new Date().toISOString(),
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `insights-export-${Date.now()}.json`)
    } else {
      const csv = convertToCSV(data)
      const blob = new Blob([csv], { type: 'text/csv' })
      downloadBlob(blob, `insights-export-${Date.now()}.csv`)
    }
  }

  // Helper functions
  function generateMockMetrics(): MetricData[] {
    return [
      {
        id: 'adoption',
        label: 'Token Adoption Rate',
        value: '1,247',
        change: 12.5,
        trend: 'up',
        definition: 'Number of unique wallet addresses holding the token over the selected timeframe',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'retention',
        label: 'User Retention',
        value: '68%',
        change: -2.3,
        trend: 'down',
        definition: 'Percentage of token holders who remain active after 30 days',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'txQuality',
        label: 'Transaction Quality Score',
        value: '7.8/10',
        change: 5.2,
        trend: 'up',
        definition: 'Composite score based on transaction volume, frequency, and purpose distribution',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'liquidityHealth',
        label: 'Liquidity Health',
        value: 'Good',
        change: 0,
        trend: 'stable',
        definition: 'Assessment of available liquidity across DEXs and CEXs based on depth and spread',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'concentrationRisk',
        label: 'Concentration Risk',
        value: 'Medium',
        change: -8.1,
        trend: 'down',
        definition: 'Risk score based on token distribution among holders (lower is better)',
        timestamp: new Date().toISOString(),
      },
    ]
  }

  function generateMockTrendData(_metricId: string): TrendDataPoint[] {
    const points: TrendDataPoint[] = []
    const days = filters.value.timeframe === '7d' ? 7 : 
                 filters.value.timeframe === '30d' ? 30 : 
                 filters.value.timeframe === '90d' ? 90 : 365
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      points.push({
        timestamp: date.toISOString(),
        value: Math.random() * 100 + 50,
        label: date.toLocaleDateString(),
      })
    }
    
    return points
  }

  function generateMockBenchmarks(): CompetitorBenchmark[] {
    return [
      {
        id: 'competitor-1',
        name: 'Similar Token A',
        metrics: {
          adoption: 2100,
          retention: 72,
          txQuality: 8.2,
        },
        source: 'DeFi Pulse',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'competitor-2',
        name: 'Similar Token B',
        metrics: {
          adoption: 890,
          retention: 65,
          txQuality: 7.5,
        },
        source: 'CoinGecko',
        lastUpdated: new Date().toISOString(),
      },
    ]
  }

  function calculateMockScenario(inputs: ScenarioInput): ScenarioOutput {
    const baseAdoption = 1247
    const baseVolume = 50000
    const baseRetention = 68

    const projectedAdoption = baseAdoption * (1 + inputs.campaignLift / 100)
    const projectedVolume = baseVolume + inputs.liquidityContribution
    const projectedRetention = baseRetention + inputs.retentionChange

    return {
      projectedAdoption: Math.round(projectedAdoption),
      projectedVolume: Math.round(projectedVolume),
      projectedRetention: Math.round(projectedRetention * 10) / 10,
      confidenceRange: {
        low: Math.round(projectedAdoption * 0.85),
        high: Math.round(projectedAdoption * 1.15),
      },
    }
  }

  function convertToCSV(data: any): string {
    let csv = 'Metric,Value,Change,Trend\n'
    
    data.metrics.forEach((m: MetricData) => {
      csv += `"${m.label}","${m.value}",${m.change},${m.trend}\n`
    })

    csv += '\nBenchmarks\n'
    csv += 'Competitor,Adoption,Retention,Transaction Quality\n'
    data.benchmarks.forEach((b: CompetitorBenchmark) => {
      csv += `"${b.name}",${b.metrics.adoption || ''},${b.metrics.retention || ''},${b.metrics.txQuality || ''}\n`
    })

    return csv
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Initialize
  function initialize() {
    loadFiltersFromStorage()
    fetchMetrics()
    fetchBenchmarks()
  }

  return {
    // State
    filters,
    metrics,
    trendData,
    benchmarks,
    scenarioInputs,
    scenarioOutputs,
    loading,
    error,
    featureEnabled,

    // Computed
    hasActiveFilters,
    activeFilterCount,
    coreMetrics,

    // Actions
    updateFilters,
    resetFilters,
    saveFiltersToStorage,
    loadFiltersFromStorage,
    fetchMetrics,
    fetchTrendData,
    fetchBenchmarks,
    runScenario,
    exportData,
    initialize,
  }
})
