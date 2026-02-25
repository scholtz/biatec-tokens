// Core portfolio data structures

export interface PortfolioAsset {
  id: string
  symbol: string
  name: string
  network: string
  balance: number
  valueUsd: number
  price24hChangePct: number | null
  isLiquid: boolean
  lastActivityAt: Date | null
}

export interface PortfolioSummary {
  totalValueUsd: number
  change24hUsd: number
  change24hPct: number
  allocationByCategory: AllocationCategory[]
  assetCount: number
  capturedAt: Date
}

export interface AllocationCategory {
  label: string
  valueUsd: number
  pct: number
  assetCount: number
}

export type InsightType =
  | 'concentration_risk'
  | 'unusual_movement'
  | 'dormant_holdings'
  | 'diversification_opportunity'
  | 'high_performer'
  | 'low_liquidity_warning'

export type InsightSeverity = 'info' | 'warning' | 'critical'

export interface PortfolioInsight {
  id: string
  type: InsightType
  severity: InsightSeverity
  title: string
  description: string
  actionLabel?: string
  actionPath?: string
  affectedAssets: string[]
  /** Lower number = higher priority */
  priority: number
  dismissible: boolean
}

export interface WatchlistEntry {
  assetId: string
  symbol: string
  name: string
  network: string
  addedAt: Date
}

export interface PortfolioAnalyticsEvent {
  eventType: PortfolioEventType
  userId: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export type PortfolioEventType =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'onboarding_replayed'
  | 'insight_viewed'
  | 'insight_clicked'
  | 'insight_dismissed'
  | 'watchlist_asset_added'
  | 'watchlist_asset_removed'
  | 'summary_tooltip_opened'
  | 'cta_clicked'
