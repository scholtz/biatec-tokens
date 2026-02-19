/**
 * Cockpit Status Derivation Utility
 *
 * Deterministic mapping from token state to health indicator status.
 * Each rule is explicit, auditable, and reproducible for identical inputs.
 */

import type { RiskSeverity } from '../types/lifecycleCockpit'

/**
 * Three-tier health status aligned to the cockpit display model.
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical'

export interface TokenHealthState {
  /** Mint policy is valid and not expired */
  mintPolicyValid: boolean
  /** Token metadata is complete (name, symbol, description, imageUrl) */
  metadataComplete: boolean
  /** Percentage of supply held by top holder (0–100) */
  topHolderPct: number
  /** Number of treasury movement anomalies detected */
  treasuryAnomalyCount: number
  /** Whether roles (admin, freeze, clawback) are explicitly set */
  permissionPostureConfigured: boolean
  /** Whether a KYC provider has been configured */
  kycProviderConfigured: boolean
  /** Percentage of holders inactive for 30+ days (0–100) */
  inactiveHolderPct: number
}

export interface DerivedHealthIndicators {
  mintPolicy: HealthStatus
  metadataCompleteness: HealthStatus
  holderConcentration: HealthStatus
  treasuryMovements: HealthStatus
  permissionPosture: HealthStatus
  kycCompliance: HealthStatus
  holderEngagement: HealthStatus
  /** Aggregate status: worst of all individual indicators */
  overall: HealthStatus
}

// ─── Threshold constants ──────────────────────────────────────────────────────

/** Top-holder percentage thresholds */
const CONCENTRATION_CRITICAL_PCT = 40
const CONCENTRATION_WARNING_PCT = 25

/** Inactive-holder percentage thresholds */
const INACTIVITY_CRITICAL_PCT = 60
const INACTIVITY_WARNING_PCT = 40

/** Treasury anomaly count thresholds */
const TREASURY_CRITICAL_COUNT = 5
const TREASURY_WARNING_COUNT = 1

// ─── Individual dimension derivers ───────────────────────────────────────────

/**
 * Derives mint-policy health from a simple boolean.
 * Invalid policy → critical; valid → healthy.
 */
export function deriveMintPolicyStatus(valid: boolean): HealthStatus {
  return valid ? 'healthy' : 'critical'
}

/**
 * Derives metadata completeness health.
 * Missing metadata → critical; complete → healthy.
 */
export function deriveMetadataStatus(complete: boolean): HealthStatus {
  return complete ? 'healthy' : 'critical'
}

/**
 * Derives holder-concentration health from top-holder percentage.
 *  >= CRITICAL_PCT → critical
 *  >= WARNING_PCT  → warning
 *  else            → healthy
 */
export function deriveConcentrationStatus(topHolderPct: number): HealthStatus {
  if (topHolderPct >= CONCENTRATION_CRITICAL_PCT) return 'critical'
  if (topHolderPct >= CONCENTRATION_WARNING_PCT) return 'warning'
  return 'healthy'
}

/**
 * Derives treasury-movement health from anomaly count.
 *  >= CRITICAL_COUNT → critical
 *  >= WARNING_COUNT  → warning
 *  else              → healthy
 */
export function deriveTreasuryStatus(anomalyCount: number): HealthStatus {
  if (anomalyCount >= TREASURY_CRITICAL_COUNT) return 'critical'
  if (anomalyCount >= TREASURY_WARNING_COUNT) return 'warning'
  return 'healthy'
}

/**
 * Derives permission-posture health.
 * Unconfigured roles → critical; configured → healthy.
 */
export function derivePermissionStatus(configured: boolean): HealthStatus {
  return configured ? 'healthy' : 'critical'
}

/**
 * Derives KYC-compliance health.
 * No provider configured → critical; configured → healthy.
 */
export function deriveKycStatus(configured: boolean): HealthStatus {
  return configured ? 'healthy' : 'critical'
}

/**
 * Derives holder-engagement health from inactive-holder percentage.
 *  >= CRITICAL_PCT → critical
 *  >= WARNING_PCT  → warning
 *  else            → healthy
 */
export function deriveEngagementStatus(inactivePct: number): HealthStatus {
  if (inactivePct >= INACTIVITY_CRITICAL_PCT) return 'critical'
  if (inactivePct >= INACTIVITY_WARNING_PCT) return 'warning'
  return 'healthy'
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

/**
 * Computes the worst (most severe) status from a list of statuses.
 * Order of severity: critical > warning > healthy.
 */
export function worstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes('critical')) return 'critical'
  if (statuses.includes('warning')) return 'warning'
  return 'healthy'
}

// ─── Main derivation entry point ─────────────────────────────────────────────

/**
 * Derives all health indicators for a token from its current state.
 * This is the single auditable source of truth for cockpit health signals.
 */
export function deriveHealthIndicators(state: TokenHealthState): DerivedHealthIndicators {
  const mintPolicy = deriveMintPolicyStatus(state.mintPolicyValid)
  const metadataCompleteness = deriveMetadataStatus(state.metadataComplete)
  const holderConcentration = deriveConcentrationStatus(state.topHolderPct)
  const treasuryMovements = deriveTreasuryStatus(state.treasuryAnomalyCount)
  const permissionPosture = derivePermissionStatus(state.permissionPostureConfigured)
  const kycCompliance = deriveKycStatus(state.kycProviderConfigured)
  const holderEngagement = deriveEngagementStatus(state.inactiveHolderPct)

  const overall = worstStatus([
    mintPolicy,
    metadataCompleteness,
    holderConcentration,
    treasuryMovements,
    permissionPosture,
    kycCompliance,
    holderEngagement,
  ])

  return {
    mintPolicy,
    metadataCompleteness,
    holderConcentration,
    treasuryMovements,
    permissionPosture,
    kycCompliance,
    holderEngagement,
    overall,
  }
}

/**
 * Maps a HealthStatus to a RiskSeverity for widgets that use the risk model.
 */
export function healthStatusToRiskSeverity(status: HealthStatus): RiskSeverity {
  switch (status) {
    case 'critical': return 'critical'
    case 'warning': return 'medium'
    case 'healthy': return 'none'
  }
}

/**
 * Returns a human-readable label for a HealthStatus.
 */
export function healthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return 'Healthy'
    case 'warning': return 'Needs Attention'
    case 'critical': return 'Action Required'
  }
}
