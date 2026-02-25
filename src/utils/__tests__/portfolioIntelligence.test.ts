/**
 * portfolioIntelligence utility tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  computePortfolioSummary,
  deriveInsights,
  filterAndSortInsights,
  formatPortfolioValue,
  formatPct,
  categorizeAssets,
} from '../portfolioIntelligence'
import type { PortfolioAsset, PortfolioSummary } from '../../../types/portfolioIntelligence'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const liquid = (overrides: Partial<PortfolioAsset> = {}): PortfolioAsset => ({
  id: 'asset-1',
  symbol: 'USDC',
  name: 'USD Coin',
  network: 'Algorand',
  balance: 100,
  valueUsd: 100,
  price24hChangePct: 0,
  isLiquid: true,
  lastActivityAt: new Date(),
  ...overrides,
})

// ─── computePortfolioSummary ──────────────────────────────────────────────────

describe('computePortfolioSummary', () => {
  it('returns zeros for empty array', () => {
    const s = computePortfolioSummary([])
    expect(s.totalValueUsd).toBe(0)
    expect(s.assetCount).toBe(0)
    expect(s.change24hPct).toBe(0)
    expect(s.allocationByCategory).toHaveLength(0)
  })

  it('returns correct total for single asset', () => {
    const s = computePortfolioSummary([liquid({ valueUsd: 500 })])
    expect(s.totalValueUsd).toBe(500)
    expect(s.assetCount).toBe(1)
  })

  it('sums total correctly for multiple assets', () => {
    const assets = [liquid({ valueUsd: 200 }), liquid({ id: 'a2', valueUsd: 800 })]
    const s = computePortfolioSummary(assets)
    expect(s.totalValueUsd).toBe(1000)
    expect(s.assetCount).toBe(2)
  })

  it('handles negative 24h change', () => {
    const asset = liquid({ valueUsd: 900, price24hChangePct: -10 })
    const s = computePortfolioSummary([asset])
    expect(s.change24hPct).toBeLessThan(0)
  })

  it('handles zero balance asset', () => {
    const asset = liquid({ valueUsd: 0, balance: 0 })
    const s = computePortfolioSummary([asset])
    expect(s.totalValueUsd).toBe(0)
  })

  it('skips null price change in calculation', () => {
    const asset = liquid({ price24hChangePct: null, valueUsd: 100 })
    const s = computePortfolioSummary([asset])
    expect(s.change24hUsd).toBe(0)
  })

  it('capturedAt is a Date', () => {
    const s = computePortfolioSummary([liquid()])
    expect(s.capturedAt).toBeInstanceOf(Date)
  })

  it('allocationByCategory groups by network', () => {
    const assets = [
      liquid({ network: 'Algorand', valueUsd: 300 }),
      liquid({ id: 'a2', network: 'Ethereum', valueUsd: 700 }),
    ]
    const s = computePortfolioSummary(assets)
    expect(s.allocationByCategory).toHaveLength(2)
  })

  it('change24hPct is 0 when totalValueUsd is 0', () => {
    const asset = liquid({ valueUsd: 0, price24hChangePct: null })
    const s = computePortfolioSummary([asset])
    expect(s.change24hPct).toBe(0)
  })
})

// ─── deriveInsights ───────────────────────────────────────────────────────────

function makeSummary(assets: PortfolioAsset[]): PortfolioSummary {
  return computePortfolioSummary(assets)
}

describe('deriveInsights', () => {
  it('returns empty for empty assets', () => {
    const s = makeSummary([])
    expect(deriveInsights([], s)).toHaveLength(0)
  })

  describe('Rule 1: concentration risk', () => {
    it('fires when single asset > 60% of portfolio', () => {
      const assets = [
        liquid({ id: 'big', valueUsd: 700 }),
        liquid({ id: 'small', valueUsd: 300 }),
      ]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      const concIns = insights.filter((i) => i.type === 'concentration_risk')
      expect(concIns).toHaveLength(1)
      expect(concIns[0].severity).toBe('critical')
    })

    it('does not fire when no asset exceeds 60%', () => {
      const assets = [
        liquid({ id: 'a', valueUsd: 500 }),
        liquid({ id: 'b', valueUsd: 500 }),
      ]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'concentration_risk')).toHaveLength(0)
    })

    it('identifies the correct affected asset', () => {
      const assets = [
        liquid({ id: 'dominant', symbol: 'DOM', valueUsd: 800 }),
        liquid({ id: 'minor', valueUsd: 200 }),
      ]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      const c = insights.find((i) => i.type === 'concentration_risk')
      expect(c?.affectedAssets).toContain('dominant')
    })
  })

  describe('Rule 2: unusual movement', () => {
    it('fires when asset changed > 20% positive', () => {
      const assets = [liquid({ price24hChangePct: 25 })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'unusual_movement')).toHaveLength(1)
    })

    it('fires when asset changed > 20% negative', () => {
      const assets = [liquid({ price24hChangePct: -21 })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'unusual_movement')).toHaveLength(1)
    })

    it('does not fire for change <= 20%', () => {
      const assets = [liquid({ price24hChangePct: 15 })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'unusual_movement')).toHaveLength(0)
    })

    it('skips assets with null price change', () => {
      const assets = [liquid({ price24hChangePct: null })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'unusual_movement')).toHaveLength(0)
    })

    it('has warning severity', () => {
      const assets = [liquid({ price24hChangePct: 30 })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      const m = insights.find((i) => i.type === 'unusual_movement')
      expect(m?.severity).toBe('warning')
    })
  })

  describe('Rule 3: dormant holdings', () => {
    it('fires when lastActivityAt > 90 days ago', () => {
      const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
      const assets = [liquid({ lastActivityAt: old })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'dormant_holdings')).toHaveLength(1)
    })

    it('does not fire for recently active asset', () => {
      const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const assets = [liquid({ lastActivityAt: recent })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'dormant_holdings')).toHaveLength(0)
    })

    it('gracefully handles null lastActivityAt', () => {
      const assets = [liquid({ lastActivityAt: null })]
      const s = makeSummary(assets)
      expect(() => deriveInsights(assets, s)).not.toThrow()
    })

    it('has info severity', () => {
      const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
      const assets = [liquid({ lastActivityAt: old })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      const d = insights.find((i) => i.type === 'dormant_holdings')
      expect(d?.severity).toBe('info')
    })
  })

  describe('Rule 4: diversification opportunity', () => {
    it('fires when only 1 asset in portfolio', () => {
      const assets = [liquid()]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'diversification_opportunity')).toHaveLength(1)
    })

    it('fires when only 2 assets in portfolio', () => {
      const assets = [liquid({ id: 'a' }), liquid({ id: 'b' })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'diversification_opportunity')).toHaveLength(1)
    })

    it('does not fire with 3+ assets', () => {
      const assets = [liquid({ id: 'a' }), liquid({ id: 'b' }), liquid({ id: 'c' })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'diversification_opportunity')).toHaveLength(0)
    })

    it('has info severity', () => {
      const assets = [liquid()]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      const d = insights.find((i) => i.type === 'diversification_opportunity')
      expect(d?.severity).toBe('info')
    })
  })

  describe('Rule 5: low liquidity warning', () => {
    it('fires when illiquid asset > 10% of portfolio', () => {
      const assets = [
        liquid({ id: 'illiquid', isLiquid: false, valueUsd: 500 }),
        liquid({ id: 'liquid', isLiquid: true, valueUsd: 500 }),
      ]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'low_liquidity_warning')).toHaveLength(1)
    })

    it('does not fire for liquid assets', () => {
      const assets = [liquid({ isLiquid: true, valueUsd: 500 }), liquid({ id: 'b', valueUsd: 500 })]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'low_liquidity_warning')).toHaveLength(0)
    })

    it('does not fire for illiquid asset < 10% of portfolio', () => {
      const assets = [
        liquid({ id: 'illiquid', isLiquid: false, valueUsd: 50 }),
        liquid({ id: 'big', isLiquid: true, valueUsd: 950 }),
      ]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      expect(insights.filter((i) => i.type === 'low_liquidity_warning')).toHaveLength(0)
    })

    it('has warning severity', () => {
      const assets = [
        liquid({ id: 'illiquid', isLiquid: false, valueUsd: 500 }),
        liquid({ id: 'liquid', valueUsd: 500 }),
      ]
      const s = makeSummary(assets)
      const insights = deriveInsights(assets, s)
      const liq = insights.find((i) => i.type === 'low_liquidity_warning')
      expect(liq?.severity).toBe('warning')
    })
  })

  it('multiple rules can fire together', () => {
    const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
    const assets = [
      liquid({ id: 'big', valueUsd: 700, price24hChangePct: 30, isLiquid: false, lastActivityAt: old }),
      liquid({ id: 'small', valueUsd: 300 }),
    ]
    const s = makeSummary(assets)
    const insights = deriveInsights(assets, s)
    expect(insights.length).toBeGreaterThan(1)
  })
})

// ─── filterAndSortInsights ────────────────────────────────────────────────────

describe('filterAndSortInsights', () => {
  const makeInsight = (priority: number, id = `ins-${priority}`) => ({
    id,
    type: 'concentration_risk' as const,
    severity: 'info' as const,
    title: 'T',
    description: 'D',
    affectedAssets: [],
    priority,
    dismissible: true,
  })

  it('sorts by priority ascending (lower = first)', () => {
    const result = filterAndSortInsights([makeInsight(3), makeInsight(1), makeInsight(2)])
    expect(result.map((i) => i.priority)).toEqual([1, 2, 3])
  })

  it('limits results with maxCount', () => {
    const result = filterAndSortInsights([makeInsight(1), makeInsight(2), makeInsight(3)], 2)
    expect(result).toHaveLength(2)
  })

  it('returns all when maxCount undefined', () => {
    const result = filterAndSortInsights([makeInsight(1), makeInsight(2)])
    expect(result).toHaveLength(2)
  })

  it('returns empty for empty input', () => {
    expect(filterAndSortInsights([])).toHaveLength(0)
  })
})

// ─── formatPortfolioValue ─────────────────────────────────────────────────────

describe('formatPortfolioValue', () => {
  it('formats zero', () => {
    expect(formatPortfolioValue(0)).toBe('$0.00')
  })

  it('formats small value', () => {
    expect(formatPortfolioValue(5)).toBe('$5.00')
  })

  it('formats thousands with comma', () => {
    expect(formatPortfolioValue(1000)).toBe('$1,000.00')
  })

  it('formats millions', () => {
    expect(formatPortfolioValue(1000000)).toBe('$1,000,000.00')
  })

  it('formats negative values', () => {
    const result = formatPortfolioValue(-500)
    expect(result).toContain('-')
    expect(result).toContain('500')
  })

  it('formats decimal values', () => {
    expect(formatPortfolioValue(1234.56)).toBe('$1,234.56')
  })
})

// ─── formatPct ────────────────────────────────────────────────────────────────

describe('formatPct', () => {
  it('formats positive with + sign', () => {
    expect(formatPct(5)).toBe('+5.00%')
  })

  it('formats negative', () => {
    expect(formatPct(-3)).toBe('-3.00%')
  })

  it('formats zero', () => {
    expect(formatPct(0)).toBe('0.00%')
  })

  it('respects custom digits', () => {
    expect(formatPct(5, 1)).toBe('+5.0%')
  })

  it('handles large percentage', () => {
    expect(formatPct(100)).toBe('+100.00%')
  })
})

// ─── categorizeAssets ──────────────────────────────────────────────────────────

describe('categorizeAssets', () => {
  it('returns empty for no assets', () => {
    expect(categorizeAssets([])).toHaveLength(0)
  })

  it('groups by network', () => {
    const assets = [
      liquid({ network: 'Algorand', valueUsd: 400 }),
      liquid({ id: 'a2', network: 'Algorand', valueUsd: 100 }),
      liquid({ id: 'a3', network: 'Ethereum', valueUsd: 500 }),
    ]
    const cats = categorizeAssets(assets)
    expect(cats).toHaveLength(2)
    const algo = cats.find((c) => c.label === 'Algorand')
    expect(algo?.valueUsd).toBe(500)
    expect(algo?.assetCount).toBe(2)
  })

  it('calculates correct percentages', () => {
    const assets = [
      liquid({ network: 'Algorand', valueUsd: 250 }),
      liquid({ id: 'a2', network: 'Ethereum', valueUsd: 750 }),
    ]
    const cats = categorizeAssets(assets)
    const algo = cats.find((c) => c.label === 'Algorand')
    expect(algo?.pct).toBeCloseTo(25, 1)
    const eth = cats.find((c) => c.label === 'Ethereum')
    expect(eth?.pct).toBeCloseTo(75, 1)
  })

  it('handles single network', () => {
    const assets = [liquid({ network: 'VOI' }), liquid({ id: 'b', network: 'VOI' })]
    const cats = categorizeAssets(assets)
    expect(cats).toHaveLength(1)
    expect(cats[0].label).toBe('VOI')
  })

  it('sorts by value descending', () => {
    const assets = [
      liquid({ network: 'X', valueUsd: 100 }),
      liquid({ id: 'b', network: 'Y', valueUsd: 900 }),
    ]
    const cats = categorizeAssets(assets)
    expect(cats[0].label).toBe('Y')
  })
})
