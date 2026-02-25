/**
 * Portfolio Intelligence Utilities
 *
 * Deterministic computation of portfolio summaries, insight derivation,
 * filtering, and formatting helpers.
 */

import type {
  PortfolioAsset,
  PortfolioSummary,
  PortfolioInsight,
  AllocationCategory,
} from '../types/portfolioIntelligence'

// ─── Summary computation ──────────────────────────────────────────────────────

export function computePortfolioSummary(assets: PortfolioAsset[]): PortfolioSummary {
  if (assets.length === 0) {
    return {
      totalValueUsd: 0,
      change24hUsd: 0,
      change24hPct: 0,
      allocationByCategory: [],
      assetCount: 0,
      capturedAt: new Date(),
    }
  }

  const totalValueUsd = assets.reduce((sum, a) => sum + a.valueUsd, 0)

  // Estimate 24h change: sum of (asset value * change pct / 100) for assets that have a change
  const change24hUsd = assets.reduce((sum, a) => {
    if (a.price24hChangePct === null) return sum
    const prevValue = a.valueUsd / (1 + a.price24hChangePct / 100)
    return sum + (a.valueUsd - prevValue)
  }, 0)

  const change24hPct = totalValueUsd > 0 ? (change24hUsd / (totalValueUsd - change24hUsd)) * 100 : 0

  return {
    totalValueUsd,
    change24hUsd,
    change24hPct,
    allocationByCategory: categorizeAssets(assets),
    assetCount: assets.length,
    capturedAt: new Date(),
  }
}

// ─── Insight derivation ───────────────────────────────────────────────────────

const CONCENTRATION_THRESHOLD = 0.6   // 60%
const MOVEMENT_THRESHOLD = 20          // 20% price change
const DORMANT_DAYS = 90               // 90 days inactivity
const LOW_LIQUIDITY_THRESHOLD = 0.1   // 10% allocation

export function deriveInsights(
  assets: PortfolioAsset[],
  summary: PortfolioSummary,
): PortfolioInsight[] {
  if (assets.length === 0) return []

  const insights: PortfolioInsight[] = []
  const total = summary.totalValueUsd

  // Rule 1: Concentration risk — any single asset > 60% of portfolio
  if (total > 0) {
    for (const asset of assets) {
      const pct = asset.valueUsd / total
      if (pct > CONCENTRATION_THRESHOLD) {
        insights.push({
          id: `concentration-${asset.id}`,
          type: 'concentration_risk',
          severity: 'critical',
          title: 'Concentration Risk Detected',
          description: `${asset.symbol} represents ${formatPct(pct * 100)} of your portfolio. Consider diversifying to reduce risk.`,
          actionLabel: 'Explore Diversification',
          actionPath: '/portfolio',
          affectedAssets: [asset.id],
          priority: 1,
          dismissible: true,
        })
      }
    }
  }

  // Rule 2: Unusual movement — any asset changed > 20% in 24h
  for (const asset of assets) {
    if (asset.price24hChangePct !== null && Math.abs(asset.price24hChangePct) > MOVEMENT_THRESHOLD) {
      insights.push({
        id: `movement-${asset.id}`,
        type: 'unusual_movement',
        severity: 'warning',
        title: 'Unusual Price Movement',
        description: `${asset.symbol} has moved ${formatPct(asset.price24hChangePct)} in the last 24 hours.`,
        affectedAssets: [asset.id],
        priority: 2,
        dismissible: true,
      })
    }
  }

  // Rule 3: Dormant holdings — any asset with lastActivityAt > 90 days ago
  const ninetyDaysAgo = new Date(Date.now() - DORMANT_DAYS * 24 * 60 * 60 * 1000)
  for (const asset of assets) {
    if (asset.lastActivityAt !== null && asset.lastActivityAt < ninetyDaysAgo) {
      insights.push({
        id: `dormant-${asset.id}`,
        type: 'dormant_holdings',
        severity: 'info',
        title: 'Dormant Holding Detected',
        description: `${asset.symbol} has had no activity for over ${DORMANT_DAYS} days. Review if this position is intentional.`,
        affectedAssets: [asset.id],
        priority: 4,
        dismissible: true,
      })
    }
  }

  // Rule 4: Diversification opportunity — only 1-2 assets in portfolio
  if (assets.length <= 2) {
    insights.push({
      id: 'diversification-opportunity',
      type: 'diversification_opportunity',
      severity: 'info',
      title: 'Diversification Opportunity',
      description: `Your portfolio has only ${assets.length} asset${assets.length === 1 ? '' : 's'}. Adding more assets can reduce concentration risk.`,
      actionLabel: 'Explore Tokens',
      actionPath: '/dashboard',
      affectedAssets: assets.map((a) => a.id),
      priority: 5,
      dismissible: true,
    })
  }

  // Rule 5: Low liquidity warning — any illiquid asset with > 10% allocation
  if (total > 0) {
    for (const asset of assets) {
      if (!asset.isLiquid && asset.valueUsd / total > LOW_LIQUIDITY_THRESHOLD) {
        insights.push({
          id: `low-liquidity-${asset.id}`,
          type: 'low_liquidity_warning',
          severity: 'warning',
          title: 'Low Liquidity Asset',
          description: `${asset.symbol} is illiquid and represents ${formatPct((asset.valueUsd / total) * 100)} of your portfolio. This may limit your ability to exit quickly.`,
          affectedAssets: [asset.id],
          priority: 3,
          dismissible: true,
        })
      }
    }
  }

  return insights
}

// ─── Filtering and sorting ────────────────────────────────────────────────────

export function filterAndSortInsights(
  insights: PortfolioInsight[],
  maxCount?: number,
): PortfolioInsight[] {
  const sorted = [...insights].sort((a, b) => a.priority - b.priority)
  return maxCount !== undefined ? sorted.slice(0, maxCount) : sorted
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatPortfolioValue(usd: number): string {
  const absValue = Math.abs(usd)
  const sign = usd < 0 ? '-' : ''
  return `${sign}$${absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatPct(pct: number, digits = 2): string {
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(digits)}%`
}

// ─── Asset categorization ─────────────────────────────────────────────────────

export function categorizeAssets(assets: PortfolioAsset[]): AllocationCategory[] {
  if (assets.length === 0) return []

  const total = assets.reduce((sum, a) => sum + a.valueUsd, 0)

  const networkMap = new Map<string, { valueUsd: number; count: number }>()
  for (const asset of assets) {
    const existing = networkMap.get(asset.network)
    if (existing) {
      existing.valueUsd += asset.valueUsd
      existing.count++
    } else {
      networkMap.set(asset.network, { valueUsd: asset.valueUsd, count: 1 })
    }
  }

  const categories: AllocationCategory[] = []
  for (const [network, data] of networkMap.entries()) {
    categories.push({
      label: network,
      valueUsd: data.valueUsd,
      pct: total > 0 ? (data.valueUsd / total) * 100 : 0,
      assetCount: data.count,
    })
  }

  return categories.sort((a, b) => b.valueUsd - a.valueUsd)
}
