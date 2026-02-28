/**
 * Portfolio Launchpad Store
 *
 * Manages the full discovery-to-action state machine for the Portfolio
 * Launchpad feature:
 *
 *   discover → evaluate → simulate → execute → confirm
 *
 * Each stage maps to a deterministic UI contract so the view layer never
 * needs to derive state from raw booleans.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MarketplaceToken } from './marketplace'

// ─── Stage enum ───────────────────────────────────────────────────────────────

export type LaunchpadStage = 'discover' | 'evaluate' | 'simulate' | 'execute' | 'confirm'

export const LAUNCHPAD_STAGES: LaunchpadStage[] = [
  'discover',
  'evaluate',
  'simulate',
  'execute',
  'confirm',
]

// ─── Simulation result ────────────────────────────────────────────────────────

export interface SimulationResult {
  tokenId: string
  estimatedFee: number
  estimatedFeeDisplay: string
  estimatedOutcome: string
  constraints: string[]
  warnings: string[]
  durationMs: number
  isStale: boolean
  simulatedAt: Date
}

// ─── Launchpad token card data ─────────────────────────────────────────────────

export interface LaunchpadToken extends MarketplaceToken {
  /** Short utility summary shown on the discovery card */
  utilitySummary?: string
  /** 0-100 trust score based on compliance + issuer verification */
  trustScore?: number
  /** Liquidity indicator: high | medium | low | unknown */
  liquidityIndicator?: 'high' | 'medium' | 'low' | 'unknown'
  /** Human-readable wallet compatibility note */
  walletCompatibility?: string
  /** Primary CTA label */
  actionLabel?: string
  /** Whether the token is featured / promoted */
  isFeatured?: boolean
  /** External help/risk info URL */
  helpUrl?: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePortfolioLaunchpadStore = defineStore('portfolioLaunchpad', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const stage = ref<LaunchpadStage>('discover')

  const tokens = ref<LaunchpadToken[]>([])
  const selectedTokenId = ref<string | null>(null)
  const simulation = ref<SimulationResult | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const simulationLoading = ref(false)
  const simulationError = ref<string | null>(null)
  const actionLoading = ref(false)
  const actionError = ref<string | null>(null)
  const actionTxId = ref<string | null>(null)

  // ── Computed ───────────────────────────────────────────────────────────────

  const selectedToken = computed<LaunchpadToken | null>(() =>
    tokens.value.find((t) => t.id === selectedTokenId.value) ?? null,
  )

  const featuredTokens = computed<LaunchpadToken[]>(() =>
    tokens.value.filter((t) => t.isFeatured),
  )

  const stageIndex = computed<number>(() => LAUNCHPAD_STAGES.indexOf(stage.value))

  const canAdvance = computed<boolean>(() => {
    switch (stage.value) {
      case 'discover':
        return selectedTokenId.value !== null
      case 'evaluate':
        return selectedTokenId.value !== null
      case 'simulate':
        return simulation.value !== null && !simulation.value.isStale
      case 'execute':
        return !actionLoading.value && actionError.value === null
      default:
        return false
    }
  })

  const isComplete = computed<boolean>(() => stage.value === 'confirm' && actionTxId.value !== null)

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Load (or reload) the featured token opportunities. */
  async function fetchTokens(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      // In production this calls the token metadata API.
      // For now we seed with representative demo data that mirrors the
      // MarketplaceToken schema so real API integration is a drop-in.
      await _loadDemoTokens()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load token opportunities'
    } finally {
      loading.value = false
    }
  }

  /** Select a token and advance to the evaluate stage. */
  function selectToken(tokenId: string): void {
    selectedTokenId.value = tokenId
    simulation.value = null
    simulationError.value = null
    actionError.value = null
    actionTxId.value = null
    stage.value = 'evaluate'
  }

  /** Return to the discover stage and clear selection. */
  function deselectToken(): void {
    selectedTokenId.value = null
    simulation.value = null
    simulationError.value = null
    actionError.value = null
    actionTxId.value = null
    stage.value = 'discover'
  }

  /** Advance to simulate stage and run the pre-action simulation. */
  async function runSimulation(): Promise<void> {
    if (!selectedToken.value) return
    stage.value = 'simulate'
    simulationLoading.value = true
    simulationError.value = null
    const t0 = Date.now()
    try {
      await _simulateToken(selectedToken.value, t0)
    } catch (err) {
      simulationError.value = err instanceof Error ? err.message : 'Simulation failed'
    } finally {
      simulationLoading.value = false
    }
  }

  /** Advance to execute stage (wallet connect + submit action). */
  function proceedToExecute(): void {
    if (stage.value !== 'simulate') return
    stage.value = 'execute'
  }

  /** Submit the action (calls underlying tx pipeline). */
  async function submitAction(amount: number = 1): Promise<void> {
    if (!selectedToken.value) return
    actionLoading.value = true
    actionError.value = null
    actionTxId.value = null
    try {
      const txId = await _submitTokenAction(selectedToken.value, amount)
      actionTxId.value = txId
      stage.value = 'confirm'
    } catch (err) {
      actionError.value = err instanceof Error ? err.message : 'Action failed. Please try again.'
    } finally {
      actionLoading.value = false
    }
  }

  /** Retry after a failed action. */
  function retryAction(): void {
    actionError.value = null
    actionTxId.value = null
  }

  /** Reset the entire launchpad to initial state. */
  function reset(): void {
    stage.value = 'discover'
    selectedTokenId.value = null
    simulation.value = null
    loading.value = false
    error.value = null
    simulationLoading.value = false
    simulationError.value = null
    actionLoading.value = false
    actionError.value = null
    actionTxId.value = null
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  async function _loadDemoTokens(): Promise<void> {
    // Simulates async fetch; replaced by real API call in production.
    await Promise.resolve()
    tokens.value = [
      {
        id: 'usdc-algo',
        name: 'USD Coin (Algorand)',
        symbol: 'USDC',
        standard: 'ASA',
        network: 'Algorand Mainnet',
        status: 'active',
        isFeatured: true,
        trustScore: 95,
        liquidityIndicator: 'high',
        utilitySummary: 'Fully backed stablecoin for payments, DeFi, and cross-border transfers.',
        walletCompatibility: 'Compatible with all Algorand-native wallets',
        actionLabel: 'Acquire USDC',
        helpUrl: 'https://docs.biatec.io/tokens/usdc',
        complianceStatus: 'compliant',
        isMicaCompliant: true,
        issuerType: 'enterprise',
      },
      {
        id: 'arc200-biatec',
        name: 'Biatec Token',
        symbol: 'BIATEC',
        standard: 'ARC200',
        network: 'Algorand Mainnet',
        status: 'active',
        isFeatured: true,
        trustScore: 82,
        liquidityIndicator: 'medium',
        utilitySummary: 'Utility token granting platform fee discounts and governance rights.',
        walletCompatibility: 'Compatible with ARC200-aware wallets',
        actionLabel: 'Explore BIATEC',
        helpUrl: 'https://docs.biatec.io/tokens/biatec',
        complianceStatus: 'compliant',
        issuerType: 'company',
      },
      {
        id: 'rwa-property-01',
        name: 'RWA Property Fund I',
        symbol: 'RWAP1',
        standard: 'ARC3',
        network: 'Algorand Mainnet',
        status: 'active',
        isFeatured: false,
        trustScore: 71,
        liquidityIndicator: 'low',
        utilitySummary: 'Fractional ownership of a diversified real-estate portfolio.',
        walletCompatibility: 'KYC wallet required',
        actionLabel: 'Evaluate RWAP1',
        helpUrl: 'https://docs.biatec.io/tokens/rwa-property',
        complianceStatus: 'partial',
        kycRequired: true,
        issuerType: 'company',
      },
    ]
  }

  async function _simulateToken(token: LaunchpadToken, t0: number): Promise<void> {
    await Promise.resolve()
    const durationMs = Date.now() - t0
    const fee = token.standard === 'ERC20' ? 0.005 : 0.001
    simulation.value = {
      tokenId: token.id,
      estimatedFee: fee,
      estimatedFeeDisplay: `${fee} ALGO`,
      estimatedOutcome: `You will receive ${token.symbol} tokens in your wallet after confirmation.`,
      constraints: token.kycRequired ? ['KYC verification required before transfer'] : [],
      warnings: token.liquidityIndicator === 'low'
        ? ['Low liquidity – expect wider spreads and slower fills']
        : [],
      durationMs,
      isStale: false,
      simulatedAt: new Date(),
    }
  }

  async function _submitTokenAction(_token: LaunchpadToken, _amount: number): Promise<string> {
    await Promise.resolve()
    // Returns a mock tx ID; wired to real wallet pipeline in production.
    return `TX${Date.now()}`
  }

  // ── Expose ─────────────────────────────────────────────────────────────────

  return {
    // State
    stage,
    tokens,
    selectedTokenId,
    simulation,
    loading,
    error,
    simulationLoading,
    simulationError,
    actionLoading,
    actionError,
    actionTxId,
    // Computed
    selectedToken,
    featuredTokens,
    stageIndex,
    canAdvance,
    isComplete,
    // Actions
    fetchTokens,
    selectToken,
    deselectToken,
    runSimulation,
    proceedToExecute,
    submitAction,
    retryAction,
    reset,
  }
})
