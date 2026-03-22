/**
 * TelemetrySummaryWidget Tests
 * Verifies null state, holder/transaction metrics, activity trend direction,
 * concentration risk, and timestamp rendering.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TelemetrySummaryWidget from '../TelemetrySummaryWidget.vue'
import type { LifecycleTelemetry } from '../../../types/lifecycleCockpit'

const stubs = {
  Card: { template: '<div class="card"><slot /></div>' },
  Badge: { template: '<span class="badge"><slot /></span>' },
}

function makeTelemetry(overrides: Partial<LifecycleTelemetry> = {}): LifecycleTelemetry {
  return {
    tokenId: 'token-abc',
    totalHolders: 120,
    activeHolders: 80,
    inactiveHolders: 40,
    totalTransactions: 5000,
    transactionsLast24h: 25,
    transactionsLast7d: 175,
    avgTransactionVolume: 100,
    concentrationRisk: {
      severity: 'low',
      topHolderPercentage: 10,
      top5HoldersPercentage: 35,
      top10HoldersPercentage: 55,
      threshold: 80,
      message: 'Concentration within acceptable range',
    },
    activityTrend: {
      direction: 'stable',
      changePercentage: 2,
      period: '7d',
      message: 'Activity is stable',
    },
    lastUpdated: new Date(),
    ...overrides,
  }
}

describe('TelemetrySummaryWidget', () => {
  it('shows no-token state when telemetry is null', () => {
    const w = mount(TelemetrySummaryWidget, { props: { telemetry: null }, global: { stubs } })
    expect(w.text()).toContain('No token deployed yet')
  })

  it('renders total holders', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: { telemetry: makeTelemetry({ totalHolders: 120 }) },
      global: { stubs },
    })
    expect(w.text()).toContain('120')
  })

  it('renders active and inactive holders', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: { telemetry: makeTelemetry({ activeHolders: 80, inactiveHolders: 40 }) },
      global: { stubs },
    })
    expect(w.text()).toContain('80')
    expect(w.text()).toContain('40')
  })

  it('renders total transactions', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: { telemetry: makeTelemetry({ totalTransactions: 5000 }) },
      global: { stubs },
    })
    expect(w.text()).toContain('5,000')
  })

  it('renders transactionsLast24h', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: { telemetry: makeTelemetry({ transactionsLast24h: 25 }) },
      global: { stubs },
    })
    expect(w.text()).toContain('25')
  })

  it('shows increasing trend icon class', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: {
        telemetry: makeTelemetry({
          activityTrend: { direction: 'increasing', changePercentage: 15, period: '7d', message: 'Up' },
        }),
      },
      global: { stubs },
    })
    expect(w.html()).toContain('pi-arrow-up')
  })

  it('shows decreasing trend icon class', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: {
        telemetry: makeTelemetry({
          activityTrend: { direction: 'decreasing', changePercentage: 5, period: '7d', message: 'Down' },
        }),
      },
      global: { stubs },
    })
    expect(w.html()).toContain('pi-arrow-down')
  })

  it('shows stable trend icon class', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: {
        telemetry: makeTelemetry({
          activityTrend: { direction: 'stable', changePercentage: 0, period: '7d', message: 'Stable' },
        }),
      },
      global: { stubs },
    })
    expect(w.html()).toContain('pi-minus')
  })

  it('renders concentration risk top holder percentage', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: {
        telemetry: makeTelemetry({
          concentrationRisk: {
            severity: 'medium',
            topHolderPercentage: 22,
            top5HoldersPercentage: 40,
            top10HoldersPercentage: 60,
            threshold: 80,
            message: 'Watch concentration',
          },
        }),
      },
      global: { stubs },
    })
    expect(w.text()).toContain('22%')
  })

  it('renders activity trend message', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: {
        telemetry: makeTelemetry({
          activityTrend: { direction: 'increasing', changePercentage: 15, period: '7d', message: 'Holding steady' },
        }),
      },
      global: { stubs },
    })
    expect(w.text()).toContain('Holding steady')
  })

  it('shows last updated footer', () => {
    const w = mount(TelemetrySummaryWidget, {
      props: { telemetry: makeTelemetry() },
      global: { stubs },
    })
    expect(w.text()).toContain('Last updated:')
  })
})
