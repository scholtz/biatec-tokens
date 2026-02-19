/**
 * Cockpit Recommendation Engine
 *
 * Deterministic, ordered next-best-action recommendations derived from
 * token state. Rules have explicit precedence so identical inputs always
 * produce identical output.
 *
 * Precedence (highest first):
 *   1. Critical compliance blockers (KYC, metadata)
 *   2. Permission-posture risks
 *   3. Concentration / treasury anomaly warnings
 *   4. Engagement / operational optimisations
 */

import type { GuidedAction, UserRole } from '../types/lifecycleCockpit'
import type { TokenHealthState } from './cockpitStatusDerivation'

// ─── Rule definitions ─────────────────────────────────────────────────────────

export interface RecommendationRule {
  id: string
  /** Lower number = higher precedence */
  precedence: number
  /** Returns true when this rule fires */
  condition: (state: TokenHealthState) => boolean
  /** Factory producing the recommended action */
  build: (state: TokenHealthState) => Omit<GuidedAction, 'createdAt'>
}

const RULES: RecommendationRule[] = [
  // ── P1: KYC not configured ──────────────────────────────────────────────────
  {
    id: 'kyc_not_configured',
    precedence: 10,
    condition: (s) => !s.kycProviderConfigured,
    build: () => ({
      id: 'rec-kyc-setup',
      priority: 'critical',
      status: 'pending',
      title: 'Configure KYC Provider',
      description: 'A KYC/AML provider is required before your token can be launched.',
      rationale: 'MiCA and FATF regulations require identity verification for token holders.',
      expectedImpact: 'Unblocks token launch and ensures regulatory compliance.',
      deepLink: '/compliance/setup?step=kyc_aml',
      category: 'compliance',
      estimatedTime: '10 minutes',
      assignedRole: 'compliance' as UserRole,
    }),
  },

  // ── P2: Metadata incomplete ─────────────────────────────────────────────────
  {
    id: 'metadata_incomplete',
    precedence: 20,
    condition: (s) => !s.metadataComplete,
    build: () => ({
      id: 'rec-metadata-complete',
      priority: 'critical',
      status: 'pending',
      title: 'Complete Token Metadata',
      description: 'Required metadata fields (name, symbol, description, image) are missing.',
      rationale: 'Incomplete metadata prevents listing on marketplaces and reduces investor trust.',
      expectedImpact: 'Enables marketplace listing and improves discoverability.',
      deepLink: '/create',
      category: 'setup',
      estimatedTime: '5 minutes',
      assignedRole: 'issuer_admin' as UserRole,
    }),
  },

  // ── P3: Mint policy invalid ─────────────────────────────────────────────────
  {
    id: 'mint_policy_invalid',
    precedence: 30,
    condition: (s) => !s.mintPolicyValid,
    build: () => ({
      id: 'rec-mint-policy',
      priority: 'critical',
      status: 'pending',
      title: 'Fix Mint Policy',
      description: 'The mint policy is invalid or expired.',
      rationale: 'An invalid mint policy can block token operations and reduce holder trust.',
      expectedImpact: 'Restores full token operability and holder confidence.',
      deepLink: '/tokens',
      category: 'operations',
      estimatedTime: '15 minutes',
      assignedRole: 'issuer_admin' as UserRole,
    }),
  },

  // ── P4: Permission posture unconfigured ─────────────────────────────────────
  {
    id: 'permissions_unconfigured',
    precedence: 40,
    condition: (s) => !s.permissionPostureConfigured,
    build: () => ({
      id: 'rec-permissions',
      priority: 'high',
      status: 'pending',
      title: 'Configure Role Permissions',
      description: 'Admin, freeze, and clawback roles are not fully configured.',
      rationale:
        'Unconfigured roles are a security risk and may violate audit requirements.',
      expectedImpact: 'Reduces security exposure and satisfies enterprise audit requirements.',
      deepLink: '/settings',
      category: 'setup',
      estimatedTime: '10 minutes',
      assignedRole: 'issuer_admin' as UserRole,
    }),
  },

  // ── P5: High holder concentration ──────────────────────────────────────────
  {
    id: 'high_concentration',
    precedence: 50,
    condition: (s) => s.topHolderPct >= 40,
    build: (s) => ({
      id: 'rec-concentration',
      priority: 'high',
      status: 'pending',
      title: 'Address Holder Concentration',
      description: `Top holder controls ${s.topHolderPct.toFixed(1)}% of supply — above the 40% critical threshold.`,
      rationale:
        'High concentration increases market-manipulation risk and may deter institutional investors.',
      expectedImpact: 'Improves token credibility and reduces market risk.',
      deepLink: '/cockpit',
      category: 'risk',
      estimatedTime: '30 minutes',
      assignedRole: 'treasury' as UserRole,
    }),
  },

  // ── P6: Moderate holder concentration ──────────────────────────────────────
  {
    id: 'moderate_concentration',
    precedence: 60,
    condition: (s) => s.topHolderPct >= 25 && s.topHolderPct < 40,
    build: (s) => ({
      id: 'rec-concentration-warn',
      priority: 'medium',
      status: 'pending',
      title: 'Monitor Holder Concentration',
      description: `Top holder controls ${s.topHolderPct.toFixed(1)}% of supply — approaching the 40% threshold.`,
      rationale: 'Proactive monitoring helps prevent concentration from reaching critical levels.',
      expectedImpact: 'Enables early intervention before concentration becomes a blocking issue.',
      deepLink: '/cockpit',
      category: 'risk',
      estimatedTime: '5 minutes',
      assignedRole: 'treasury' as UserRole,
    }),
  },

  // ── P7: Treasury anomalies (critical) ──────────────────────────────────────
  {
    id: 'treasury_anomalies_critical',
    precedence: 70,
    condition: (s) => s.treasuryAnomalyCount >= 5,
    build: (s) => ({
      id: 'rec-treasury-critical',
      priority: 'critical',
      status: 'pending',
      title: 'Investigate Treasury Anomalies',
      description: `${s.treasuryAnomalyCount} unusual treasury movements detected requiring urgent review.`,
      rationale: 'Multiple anomalies may indicate operational errors or potential fraud.',
      expectedImpact: 'Prevents financial loss and ensures compliance audit trail integrity.',
      deepLink: '/compliance',
      category: 'risk',
      estimatedTime: '20 minutes',
      assignedRole: 'compliance' as UserRole,
    }),
  },

  // ── P8: Treasury anomalies (warning) ───────────────────────────────────────
  {
    id: 'treasury_anomalies_warning',
    precedence: 80,
    condition: (s) => s.treasuryAnomalyCount >= 1 && s.treasuryAnomalyCount < 5,
    build: (s) => ({
      id: 'rec-treasury-warn',
      priority: 'high',
      status: 'pending',
      title: 'Review Treasury Movement',
      description: `${s.treasuryAnomalyCount} unusual treasury movement${s.treasuryAnomalyCount > 1 ? 's' : ''} detected.`,
      rationale: 'Unusual movements should be reviewed to maintain audit trail accuracy.',
      expectedImpact: 'Maintains compliance posture and stakeholder trust.',
      deepLink: '/compliance',
      category: 'risk',
      estimatedTime: '10 minutes',
      assignedRole: 'compliance' as UserRole,
    }),
  },

  // ── P9: High holder inactivity ──────────────────────────────────────────────
  {
    id: 'high_inactivity',
    precedence: 90,
    condition: (s) => s.inactiveHolderPct >= 60,
    build: (s) => ({
      id: 'rec-inactivity-high',
      priority: 'high',
      status: 'pending',
      title: 'Re-Engage Inactive Holders',
      description: `${s.inactiveHolderPct.toFixed(1)}% of holders have been inactive for 30+ days.`,
      rationale:
        'High inactivity signals low utility and can negatively impact token valuation.',
      expectedImpact: 'Improving engagement increases on-chain activity and token value signals.',
      deepLink: '/dashboard',
      category: 'operations',
      estimatedTime: '60 minutes',
      assignedRole: 'operations' as UserRole,
    }),
  },

  // ── P10: Moderate holder inactivity ─────────────────────────────────────────
  {
    id: 'moderate_inactivity',
    precedence: 100,
    condition: (s) => s.inactiveHolderPct >= 40 && s.inactiveHolderPct < 60,
    build: (s) => ({
      id: 'rec-inactivity-moderate',
      priority: 'medium',
      status: 'pending',
      title: 'Monitor Holder Engagement',
      description: `${s.inactiveHolderPct.toFixed(1)}% of holders are inactive — approaching the high-risk threshold.`,
      rationale: 'Early engagement campaigns prevent inactivity from reaching critical levels.',
      expectedImpact: 'Maintains healthy on-chain activity metrics.',
      deepLink: '/dashboard',
      category: 'operations',
      estimatedTime: '15 minutes',
      assignedRole: 'operations' as UserRole,
    }),
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates deterministic, ordered next-best-action recommendations from token
 * state. Rules are evaluated in precedence order; the result list preserves
 * that order so identical inputs always produce identical outputs.
 *
 * @param state  Current token health state
 * @param limit  Maximum number of recommendations to return (default: all)
 */
export function generateRecommendations(
  state: TokenHealthState,
  limit?: number,
): GuidedAction[] {
  const sorted = [...RULES].sort((a, b) => a.precedence - b.precedence)

  const fired = sorted
    .filter((rule) => rule.condition(state))
    .map((rule) => ({
      ...rule.build(state),
      createdAt: new Date(),
    }))

  return limit !== undefined ? fired.slice(0, limit) : fired
}

/**
 * Returns the single highest-priority recommendation, or null if none apply.
 */
export function topRecommendation(state: TokenHealthState): GuidedAction | null {
  const recs = generateRecommendations(state, 1)
  return recs[0] ?? null
}

/**
 * Returns all rules that are currently active for a given state.
 * Useful for testing and debugging.
 */
export function activeRuleIds(state: TokenHealthState): string[] {
  return RULES.filter((r) => r.condition(state)).map((r) => r.id)
}
