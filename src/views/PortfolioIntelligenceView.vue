<template>
  <MainLayout>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
      <!-- Page header (WCAG SC 2.4.6: descriptive headings) -->
      <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Intelligence</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Smart insights and watchlist for your token portfolio
          </p>
        </div>
      </div>

      <!-- Onboarding walkthrough -->
      <PortfolioOnboardingWalkthrough
        :is-first-visit="isFirstVisit"
        :has-completed-onboarding="hasCompletedOnboarding"
        @completed="onOnboardingCompleted"
        @skipped="onOnboardingSkipped"
        @replay="onOnboardingReplay"
      />

      <!-- Main content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left column -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Portfolio Summary -->
            <Card variant="glass" padding="lg">
              <PortfolioSummaryPanel
                :summary="summary"
                :loading="loadingPortfolio"
                :error="portfolioError"
                @retry="loadPortfolio"
              />
            </Card>

            <!-- Watchlist -->
            <Card variant="glass" padding="lg">
              <WatchlistModule
                :watchlist="watchlist"
                :available-assets="availableAssets"
                @add="onWatchlistAdd"
                @remove="onWatchlistRemove"
              />
            </Card>
          </div>

          <!-- Right column: Insights -->
          <div class="lg:col-span-2">
            <Card variant="glass" padding="lg">
              <InsightCardsModule
                :insights="visibleInsights"
                :loading="loadingPortfolio"
                @insight-clicked="onInsightClicked"
                @insight-dismissed="onInsightDismissed"
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../components/layout/MainLayout.vue'
import Card from '../components/ui/Card.vue'
import PortfolioSummaryPanel from '../components/portfolio/PortfolioSummaryPanel.vue'
import InsightCardsModule from '../components/portfolio/InsightCardsModule.vue'
import WatchlistModule from '../components/portfolio/WatchlistModule.vue'
import PortfolioOnboardingWalkthrough from '../components/portfolio/PortfolioOnboardingWalkthrough.vue'
import type { PortfolioAsset, PortfolioSummary, PortfolioInsight, WatchlistEntry } from '../types/portfolioIntelligence'
import {
  computePortfolioSummary,
  deriveInsights,
  filterAndSortInsights,
} from '../utils/portfolioIntelligence'
import {
  loadWatchlist,
  saveWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  PORTFOLIO_ONBOARDING_COMPLETED_KEY,
} from '../utils/portfolioWatchlist'
import {
  trackOnboardingStarted,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
  trackInsightClicked,
  trackInsightDismissed,
  trackWatchlistAdded,
  trackWatchlistRemoved,
} from '../utils/portfolioAnalytics'

const ONBOARDING_COMPLETED_KEY = PORTFOLIO_ONBOARDING_COMPLETED_KEY

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockAssets: PortfolioAsset[] = [
  {
    id: 'usdc-algo',
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Algorand',
    balance: 1000,
    valueUsd: 1000,
    price24hChangePct: 0.01,
    isLiquid: true,
    lastActivityAt: new Date(),
  },
  {
    id: 'btc-eth',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    network: 'Ethereum',
    balance: 0.05,
    valueUsd: 3000,
    price24hChangePct: -2.5,
    isLiquid: true,
    lastActivityAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'asa-biatec',
    symbol: 'BIATEC',
    name: 'Biatec Token',
    network: 'Algorand',
    balance: 5000,
    valueUsd: 500,
    price24hChangePct: 25.0,
    isLiquid: false,
    lastActivityAt: new Date(),
  },
]

// ─── State ────────────────────────────────────────────────────────────────────

const loadingPortfolio = ref(false)
const portfolioError = ref<string | undefined>(undefined)
const summary = ref<PortfolioSummary | null>(null)
const allInsights = ref<PortfolioInsight[]>([])
const dismissedInsightIds = ref<Set<string>>(new Set())
const watchlist = ref<WatchlistEntry[]>([])

const isFirstVisit = ref(true)
const hasCompletedOnboarding = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────────────

const availableAssets = computed<PortfolioAsset[]>(() => mockAssets)

const visibleInsights = computed(() => {
  const undismissed = allInsights.value.filter((i) => !dismissedInsightIds.value.has(i.id))
  return filterAndSortInsights(undismissed)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentUserId(): string {
  try {
    const raw = localStorage.getItem('algorand_user')
    if (!raw) return 'anonymous'
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return (parsed.email as string) ?? 'anonymous'
  } catch {
    return 'anonymous'
  }
}

// ─── Portfolio loading ────────────────────────────────────────────────────────

async function loadPortfolio() {
  loadingPortfolio.value = true
  portfolioError.value = undefined
  try {
    // Simulate async load (real implementation would call backend)
    await Promise.resolve()
    summary.value = computePortfolioSummary(mockAssets)
    allInsights.value = deriveInsights(mockAssets, summary.value)
  } catch (err) {
    portfolioError.value = err instanceof Error ? err.message : 'Failed to load portfolio data'
  } finally {
    loadingPortfolio.value = false
  }
}

// ─── Watchlist handlers ───────────────────────────────────────────────────────

function onWatchlistAdd(payload: { assetId: string; symbol: string; name: string; network: string }) {
  watchlist.value = addToWatchlist(watchlist.value, payload)
  saveWatchlist(watchlist.value)
  trackWatchlistAdded(currentUserId(), payload.assetId, payload.network)
}

function onWatchlistRemove(payload: { assetId: string; network: string }) {
  watchlist.value = removeFromWatchlist(watchlist.value, payload.assetId, payload.network)
  saveWatchlist(watchlist.value)
  trackWatchlistRemoved(currentUserId(), payload.assetId, payload.network)
}

// ─── Insight handlers ─────────────────────────────────────────────────────────

function onInsightClicked(insight: PortfolioInsight) {
  trackInsightClicked(currentUserId(), insight.id, insight.type)
}

function onInsightDismissed(insight: PortfolioInsight) {
  dismissedInsightIds.value.add(insight.id)
  trackInsightDismissed(currentUserId(), insight.id)
}

// ─── Onboarding handlers ──────────────────────────────────────────────────────

function onOnboardingCompleted() {
  hasCompletedOnboarding.value = true
  trackOnboardingCompleted(currentUserId())
}

function onOnboardingSkipped() {
  hasCompletedOnboarding.value = true
  trackOnboardingSkipped(currentUserId())
}

function onOnboardingReplay() {
  trackOnboardingStarted(currentUserId())
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Check onboarding state
  const completedState = localStorage.getItem(ONBOARDING_COMPLETED_KEY)
  hasCompletedOnboarding.value = !!completedState
  isFirstVisit.value = !completedState

  // Restore watchlist
  watchlist.value = loadWatchlist()

  // Load portfolio
  await loadPortfolio()
})
</script>
