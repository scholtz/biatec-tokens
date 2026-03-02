/**
 * Trust Score Calculator
 *
 * Computes a trust score (0–100) for a token issuer or token listing based on
 * multiple trust signal dimensions. Higher scores indicate greater transparency,
 * compliance coverage, and verification depth.
 */

export type TrustLevel = 'unverified' | 'basic' | 'verified' | 'trusted'

export interface TrustSignal {
  id: string
  name: string
  description: string
  weight: number   // Relative importance; weights are normalised during computation
  present: boolean
  verifiedAt?: Date
}

export interface TrustScore {
  score: number              // 0–100
  level: TrustLevel
  signals: TrustSignal[]
  verifiedSignalCount: number
  totalSignalCount: number
  label: string
  colorClass: string
  description: string
}

export interface TokenTrustData {
  hasComplianceCheck?: boolean
  hasAttestation?: boolean
  hasAuditTrail?: boolean
  hasWhitelist?: boolean
  hasLegalDocumentation?: boolean
  identityVerified?: boolean
  organizationVerified?: boolean
  hasTokenMetadata?: boolean
  metadataIpfsAnchored?: boolean
}

/** Minimum score required to reach each trust level. */
const TRUST_LEVEL_THRESHOLDS: Record<TrustLevel, number> = {
  unverified: 0,
  basic: 25,
  verified: 55,
  trusted: 80,
}

/**
 * Build the default trust signals from token data.
 */
export function buildDefaultTrustSignals(data: TokenTrustData): TrustSignal[] {
  return [
    {
      id: 'compliance-check',
      name: 'Compliance Verification',
      description: 'Token has completed the MICA/regulatory compliance check.',
      weight: 25,
      present: data.hasComplianceCheck === true,
    },
    {
      id: 'identity-verified',
      name: 'Identity Verification',
      description: 'Issuer identity has been verified by an authorised procedure.',
      weight: 20,
      present: data.identityVerified === true,
    },
    {
      id: 'organization-verified',
      name: 'Organization Verification',
      description: 'Issuing organization has been registered and verified.',
      weight: 15,
      present: data.organizationVerified === true,
    },
    {
      id: 'attestation',
      name: 'Compliance Attestation',
      description: 'Token has a valid compliance attestation on record.',
      weight: 15,
      present: data.hasAttestation === true,
    },
    {
      id: 'audit-trail',
      name: 'Audit Trail',
      description: 'A complete audit trail exists for all token lifecycle events.',
      weight: 10,
      present: data.hasAuditTrail === true,
    },
    {
      id: 'token-metadata',
      name: 'Token Metadata',
      description: 'Complete token metadata (name, description, media) is present.',
      weight: 8,
      present: data.hasTokenMetadata === true,
    },
    {
      id: 'whitelist',
      name: 'Investor Whitelist',
      description: 'An approved investor list is in place for access control.',
      weight: 5,
      present: data.hasWhitelist === true,
    },
    {
      id: 'legal-documentation',
      name: 'Legal Documentation',
      description: 'Required legal and prospectus documents have been uploaded.',
      weight: 2,
      present: data.hasLegalDocumentation === true,
    },
  ]
}

/**
 * Compute the trust score from a list of trust signals.
 * Returns a score between 0 and 100.
 */
export function computeTrustScore(signals: TrustSignal[]): TrustScore {
  if (signals.length === 0) {
    return {
      score: 0,
      level: 'unverified',
      signals: [],
      verifiedSignalCount: 0,
      totalSignalCount: 0,
      label: getTrustLevelLabel('unverified'),
      colorClass: getTrustLevelColor('unverified'),
      description: getTrustLevelDescription('unverified'),
    }
  }

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0)
  const earnedWeight = signals.filter((s) => s.present).reduce((sum, s) => sum + s.weight, 0)

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0
  const level = getTrustLevel(score)
  const verifiedSignalCount = signals.filter((s) => s.present).length

  return {
    score,
    level,
    signals,
    verifiedSignalCount,
    totalSignalCount: signals.length,
    label: getTrustLevelLabel(level),
    colorClass: getTrustLevelColor(level),
    description: getTrustLevelDescription(level),
  }
}

/**
 * Determine trust level from a numeric score.
 */
export function getTrustLevel(score: number): TrustLevel {
  if (score >= TRUST_LEVEL_THRESHOLDS.trusted) return 'trusted'
  if (score >= TRUST_LEVEL_THRESHOLDS.verified) return 'verified'
  if (score >= TRUST_LEVEL_THRESHOLDS.basic) return 'basic'
  return 'unverified'
}

/**
 * Get the human-readable label for a trust level.
 */
export function getTrustLevelLabel(level: TrustLevel): string {
  const labels: Record<TrustLevel, string> = {
    unverified: 'Unverified',
    basic: 'Basic',
    verified: 'Verified',
    trusted: 'Trusted',
  }
  return labels[level]
}

/**
 * Get the Tailwind CSS color class for a trust level.
 */
export function getTrustLevelColor(level: TrustLevel): string {
  const colors: Record<TrustLevel, string> = {
    unverified: 'text-gray-400',
    basic: 'text-amber-400',
    verified: 'text-blue-400',
    trusted: 'text-green-400',
  }
  return colors[level]
}

/**
 * Get the human-readable description for a trust level.
 */
export function getTrustLevelDescription(level: TrustLevel): string {
  const descriptions: Record<TrustLevel, string> = {
    unverified: 'No verification signals detected. Buyers should exercise caution.',
    basic: 'Basic verification steps completed. Additional verification is recommended for institutional investors.',
    verified: 'Core verification steps are complete. This token meets standard compliance requirements.',
    trusted: 'All trust signals are verified. This token represents the highest standard of compliance and transparency.',
  }
  return descriptions[level]
}

/**
 * Get the recommended next action to improve the trust score.
 * Returns the highest-weight absent signal, or null if all signals are present.
 */
export function getTrustImprovementAction(signals: TrustSignal[]): TrustSignal | null {
  const absent = signals.filter((s) => !s.present).sort((a, b) => b.weight - a.weight)
  return absent.length > 0 ? absent[0] : null
}
