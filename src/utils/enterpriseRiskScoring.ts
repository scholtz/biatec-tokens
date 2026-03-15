/**
 * Enterprise Risk Scoring and Custom Compliance Report Builder
 *
 * Derives a structured, explainable risk assessment from existing compliance
 * evidence (ComplianceReportBundle) and supports audience-specific report
 * presets for operator, executive, and procurement/legal review.
 *
 * Score model (0–100, higher = higher risk):
 *   KYC/AML blockers        max 30
 *   Whitelist blockers       max 25
 *   Jurisdiction gaps        max 20
 *   Evidence failures        max 15
 *   Investor eligibility     max 10
 *
 * The score is heuristic: it is computed from frontend-accessible evidence
 * and should not be treated as a certified regulatory assessment.
 */

import type {
  ComplianceReportBundle,
  EvidenceStatus,
} from './complianceEvidencePack'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskBand = 'critical' | 'high' | 'medium' | 'low' | 'minimal'

export type ReportPreset = 'operator' | 'executive' | 'procurement'

export interface RiskFactor {
  /** Stable identifier for the factor. */
  id: string
  /** Short label shown in the UI. */
  label: string
  /** Plain-language explanation of why this factor contributes to risk. */
  description: string
  /** Numeric contribution to the overall risk score (0–100). */
  score: number
  /** Risk band for this factor. */
  band: RiskBand
  /** Specific action that would reduce this factor's contribution. */
  recommendation: string
  /** Router path to the evidence or configuration surface, if applicable. */
  evidencePath: string | null
  /** Whether the underlying evidence is stale (older than STALE_DAYS_THRESHOLD). */
  isStale: boolean
  /** Days since the evidence was last refreshed, or null if not known. */
  staleDays: number | null
}

export interface RiskAssessment {
  /** Overall risk score 0–100 (higher = higher risk). */
  overallScore: number
  /** Risk band for the overall score. */
  overallBand: RiskBand
  /** All individual risk factors, sorted by score descending. */
  factors: RiskFactor[]
  /** Top three factors by score — most important for executive view. */
  topFactors: RiskFactor[]
  /** Ordered recommended actions (highest priority first). */
  recommendedActions: string[]
  /** ISO timestamp when the assessment was computed. */
  assessedAt: string
  /** Always true — the score is derived from available evidence, not certified. */
  isHeuristic: boolean
  /** Evidence sources that could not be read (missing or corrupt data). */
  incompleteSources: string[]
}

export interface ReportSectionDef {
  id: string
  label: string
  description: string
  /** Which presets show this section by default. */
  defaultForPresets: ReportPreset[]
  /** Whether the section requires evidence that may be unavailable. */
  requiresEvidence: boolean
}

export interface IncludedSection {
  def: ReportSectionDef
  included: boolean
  /** Reason the section is unavailable/omitted, if applicable. */
  omitReason: string | null
  content: SectionContent
}

export type SectionContent =
  | RiskOverviewContent
  | TopRisksContent
  | RecommendationsContent
  | JurisdictionContent
  | KycAmlContent
  | WhitelistContent
  | InvestorEligibilityContent
  | EvidenceInventoryContent
  | StaleEvidenceContent
  | AuditTrailContent

export interface RiskOverviewContent {
  type: 'risk-overview'
  overallScore: number
  overallBand: RiskBand
  readinessScore: number
  overallStatus: EvidenceStatus
  heuristicDisclaimer: string
}

export interface TopRisksContent {
  type: 'top-risks'
  factors: RiskFactor[]
}

export interface RecommendationsContent {
  type: 'recommendations'
  actions: string[]
}

export interface JurisdictionContent {
  type: 'jurisdiction-coverage'
  configured: boolean
  permitted: number
  restricted: number
  jurisdictions: string[]
  staleSince: string | null
  isStale: boolean
}

export interface KycAmlContent {
  type: 'kyc-aml-status'
  status: EvidenceStatus
  kycRequired: boolean
  amlRequired: boolean
  providerConfigured: boolean
  pendingReviewCount: number
  staleSince: string | null
  isStale: boolean
}

export interface WhitelistContent {
  type: 'whitelist-posture'
  status: EvidenceStatus
  whitelistRequired: boolean
  approvedCount: number
  pendingCount: number
  activeId: string | null
  staleSince: string | null
  isStale: boolean
}

export interface InvestorEligibilityContent {
  type: 'investor-eligibility'
  status: EvidenceStatus
  accreditedRequired: boolean
  retailPermitted: boolean
  categories: string[]
  staleSince: string | null
  isStale: boolean
}

export interface EvidenceInventoryContent {
  type: 'evidence-inventory'
  sections: Array<{
    id: string
    title: string
    status: EvidenceStatus
    releaseGrade: boolean
    summary: string
  }>
}

export interface StaleEvidenceContent {
  type: 'stale-evidence'
  staleItems: Array<{
    label: string
    staleSince: string
    staleDays: number
    path: string | null
  }>
}

export interface AuditTrailContent {
  type: 'audit-trail'
  generatedAt: string
  assessedAt: string
  launchName: string | null
  bundleVersion: string
}

export interface CustomReportPayload {
  preset: ReportPreset
  presetLabel: string
  generatedAt: string
  launchName: string | null
  riskAssessment: RiskAssessment
  includedSections: IncludedSection[]
  exportVersion: '2.0'
  heuristicDisclaimer: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Evidence older than this many days is considered stale. */
export const STALE_DAYS_THRESHOLD = 30

export const RISK_BAND_LABELS: Record<RiskBand, string> = {
  critical: 'Critical Risk',
  high: 'High Risk',
  medium: 'Medium Risk',
  low: 'Low Risk',
  minimal: 'Minimal Risk',
}

export const RISK_BAND_DESCRIPTIONS: Record<RiskBand, string> = {
  critical:
    'Critical blockers are present. Release sign-off is not possible until these are resolved.',
  high: 'Significant gaps remain. Release requires operator review and remediation of high-priority items.',
  medium:
    'Moderate issues exist. These should be resolved before procurement or legal sign-off.',
  low: 'Minor gaps remain. Most evidence is in place; remaining items are informational.',
  minimal: 'All major evidence sources are present and current. Ready for review.',
}

export const PRESET_LABELS: Record<ReportPreset, string> = {
  operator: 'Operator Review',
  executive: 'Executive Summary',
  procurement: 'Procurement / Legal Review',
}

export const PRESET_DESCRIPTIONS: Record<ReportPreset, string> = {
  operator:
    'Full technical detail for compliance operators. Includes all evidence sections, stale-evidence markers, and configuration links.',
  executive:
    'Concise summary for executive sponsors. Shows overall risk band, top three risk factors, and recommended next actions.',
  procurement:
    'Compliance-focused view for procurement and legal teams. Includes jurisdiction coverage, KYC/AML status, whitelist posture, investor eligibility, and stale-evidence warnings.',
}

export const HEURISTIC_DISCLAIMER =
  'This risk assessment is computed from frontend-accessible compliance evidence and is intended as an operational decision aid. It does not constitute a certified regulatory assessment. Scores and bandings are heuristic and should be reviewed by a qualified compliance professional before use in formal sign-off documentation.'

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

export const REPORT_SECTION_DEFS: ReportSectionDef[] = [
  {
    id: 'risk-overview',
    label: 'Risk Overview',
    description: 'Overall risk score, band, and readiness snapshot.',
    defaultForPresets: ['operator', 'executive', 'procurement'],
    requiresEvidence: false,
  },
  {
    id: 'top-risks',
    label: 'Top Risk Factors',
    description: 'The three highest-contributing risk factors with explanations.',
    defaultForPresets: ['operator', 'executive', 'procurement'],
    requiresEvidence: false,
  },
  {
    id: 'recommendations',
    label: 'Recommended Next Actions',
    description: 'Prioritized actions to reduce risk, ordered by impact.',
    defaultForPresets: ['operator', 'executive', 'procurement'],
    requiresEvidence: false,
  },
  {
    id: 'jurisdiction-coverage',
    label: 'Jurisdiction Coverage',
    description: 'Permitted and restricted jurisdictions with freshness status.',
    defaultForPresets: ['operator', 'procurement'],
    requiresEvidence: true,
  },
  {
    id: 'kyc-aml-status',
    label: 'KYC / AML Status',
    description: 'Identity verification and anti-money-laundering readiness.',
    defaultForPresets: ['operator', 'procurement'],
    requiresEvidence: true,
  },
  {
    id: 'whitelist-posture',
    label: 'Whitelist Posture',
    description: 'Approved and pending investor whitelist status.',
    defaultForPresets: ['operator', 'procurement'],
    requiresEvidence: true,
  },
  {
    id: 'investor-eligibility',
    label: 'Investor Eligibility',
    description: 'Accreditation requirements and retail investor permissions.',
    defaultForPresets: ['operator', 'procurement'],
    requiresEvidence: true,
  },
  {
    id: 'evidence-inventory',
    label: 'Evidence Inventory',
    description: 'Full list of evidence sections with release-grade status.',
    defaultForPresets: ['operator'],
    requiresEvidence: true,
  },
  {
    id: 'stale-evidence',
    label: 'Stale Evidence Markers',
    description: `Evidence items that have not been refreshed in more than ${STALE_DAYS_THRESHOLD} days.`,
    defaultForPresets: ['operator', 'procurement'],
    requiresEvidence: true,
  },
  {
    id: 'audit-trail',
    label: 'Audit Trail',
    description: 'Report generation timestamps and version identifiers.',
    defaultForPresets: ['operator', 'executive', 'procurement'],
    requiresEvidence: false,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse an ISO timestamp and return the number of days since that date.
 * Returns null if the timestamp is null or unparseable.
 */
export function daysSince(iso: string | null): number | null {
  if (!iso) return null
  try {
    const ts = new Date(iso).getTime()
    if (isNaN(ts)) return null
    const ms = Date.now() - ts
    return Math.floor(ms / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

/**
 * Classify a numeric risk score into a RiskBand.
 */
export function scoreToBand(score: number): RiskBand {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  if (score >= 20) return 'low'
  return 'minimal'
}

/**
 * Clamp a numeric value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ---------------------------------------------------------------------------
// Risk factor derivation
// ---------------------------------------------------------------------------

/**
 * Derive KYC/AML risk factors from the KYC/AML summary.
 * Maximum contribution: 30 points.
 */
export function deriveKycAmlFactors(
  bundle: ComplianceReportBundle,
): { factors: RiskFactor[]; incompleteSources: string[] } {
  const factors: RiskFactor[] = []
  const incompleteSources: string[] = []

  const { kycAml } = bundle

  if (kycAml.status === 'unavailable') {
    incompleteSources.push('KYC/AML status')
    return { factors, incompleteSources }
  }

  const staleDays = daysSince(kycAml.staleSince)
  const isStale = staleDays !== null && staleDays > STALE_DAYS_THRESHOLD

  if (kycAml.kycRequired && !kycAml.providerConfigured) {
    factors.push({
      id: 'kyc-no-provider',
      label: 'KYC Provider Not Configured',
      description:
        'KYC verification is required by policy but no identity verification provider is configured. Investor onboarding cannot proceed.',
      score: 25,
      band: 'critical',
      recommendation:
        'Configure a KYC provider in the Compliance Setup workspace before attempting investor onboarding.',
      evidencePath: '/compliance/setup',
      isStale: false,
      staleDays: null,
    })
  }

  if (kycAml.amlRequired && !kycAml.providerConfigured) {
    factors.push({
      id: 'aml-no-provider',
      label: 'AML Screening Not Configured',
      description:
        'AML screening is required by policy but the screening provider is not configured. Regulated launches cannot proceed without AML verification.',
      score: 20,
      band: 'high',
      recommendation:
        'Enable AML screening configuration in the Compliance Setup workspace.',
      evidencePath: '/compliance/setup',
      isStale: false,
      staleDays: null,
    })
  }

  if (kycAml.pendingReviewCount > 0) {
    factors.push({
      id: 'kyc-pending-reviews',
      label: `${kycAml.pendingReviewCount} KYC Review${kycAml.pendingReviewCount > 1 ? 's' : ''} Pending`,
      description: `${kycAml.pendingReviewCount} investor identity verification record${kycAml.pendingReviewCount > 1 ? 's are' : ' is'} awaiting manual review. Unresolved reviews block investor access.`,
      score: clamp(kycAml.pendingReviewCount * 3, 3, 10),
      band: kycAml.pendingReviewCount > 3 ? 'high' : 'medium',
      recommendation:
        'Complete pending KYC reviews in the Compliance Monitoring dashboard.',
      evidencePath: '/compliance-monitoring',
      isStale: false,
      staleDays: null,
    })
  }

  if (isStale && staleDays !== null) {
    factors.push({
      id: 'kyc-stale',
      label: 'KYC/AML Evidence Is Stale',
      description: `KYC/AML records have not been refreshed in ${staleDays} days. Evidence older than ${STALE_DAYS_THRESHOLD} days may not reflect the current compliance posture and can reduce sign-off confidence.`,
      score: 15,
      band: 'high',
      recommendation:
        'Refresh KYC/AML records and re-run the compliance evidence collection.',
      evidencePath: '/compliance/evidence',
      isStale: true,
      staleDays,
    })
  }

  return { factors, incompleteSources }
}

/**
 * Derive whitelist risk factors.
 * Maximum contribution: 25 points.
 */
export function deriveWhitelistFactors(
  bundle: ComplianceReportBundle,
): { factors: RiskFactor[]; incompleteSources: string[] } {
  const factors: RiskFactor[] = []
  const incompleteSources: string[] = []

  const { whitelist } = bundle

  if (whitelist.status === 'unavailable') {
    incompleteSources.push('Whitelist status')
    return { factors, incompleteSources }
  }

  const staleDays = daysSince(whitelist.staleSince)
  const isStale = staleDays !== null && staleDays > STALE_DAYS_THRESHOLD

  if (whitelist.whitelistRequired && !whitelist.activeWhitelistId) {
    factors.push({
      id: 'whitelist-no-active',
      label: 'No Active Whitelist',
      description:
        'A whitelist is required by policy but no active whitelist is configured. Investor transfers are blocked until a whitelist is activated.',
      score: 25,
      band: 'critical',
      recommendation:
        'Create and activate an investor whitelist in Whitelist Management.',
      evidencePath: '/compliance/whitelists',
      isStale: false,
      staleDays: null,
    })
  } else if (whitelist.whitelistRequired && whitelist.approvedInvestorCount === 0) {
    factors.push({
      id: 'whitelist-empty',
      label: 'Whitelist Has No Approved Investors',
      description:
        'An active whitelist exists but has zero approved investors. No investor can participate until at least one investor is approved.',
      score: 20,
      band: 'high',
      recommendation:
        'Add and approve at least one investor in the Whitelist Management workspace.',
      evidencePath: '/compliance/whitelists',
      isStale: false,
      staleDays: null,
    })
  }

  if (isStale && staleDays !== null) {
    factors.push({
      id: 'whitelist-stale',
      label: 'Whitelist Records Are Stale',
      description: `Whitelist records have not been refreshed in ${staleDays} days. Stale investor lists may not reflect current eligibility and can trigger auditor queries.`,
      score: 10,
      band: 'medium',
      recommendation: 'Review and refresh whitelist records in Whitelist Management.',
      evidencePath: '/compliance/whitelists',
      isStale: true,
      staleDays,
    })
  }

  return { factors, incompleteSources }
}

/**
 * Derive jurisdiction risk factors.
 * Maximum contribution: 20 points.
 */
export function deriveJurisdictionFactors(
  bundle: ComplianceReportBundle,
): { factors: RiskFactor[]; incompleteSources: string[] } {
  const factors: RiskFactor[] = []
  const incompleteSources: string[] = []

  const { jurisdiction } = bundle

  if (!jurisdiction.configured) {
    factors.push({
      id: 'jurisdiction-not-configured',
      label: 'Jurisdiction Policy Not Configured',
      description:
        'No jurisdiction policy is in place. Without a jurisdiction policy, the token cannot restrict or permit investors by geography, creating regulatory exposure in restricted markets.',
      score: 20,
      band: 'high',
      recommendation:
        'Define jurisdiction policy in the Compliance Setup workspace.',
      evidencePath: '/compliance/setup',
      isStale: false,
      staleDays: null,
    })
    return { factors, incompleteSources }
  }

  if (jurisdiction.permittedCount === 0) {
    factors.push({
      id: 'jurisdiction-no-permitted',
      label: 'No Permitted Jurisdictions Defined',
      description:
        'Jurisdiction policy is configured but no jurisdictions are explicitly permitted. This may block all investor participation.',
      score: 15,
      band: 'high',
      recommendation:
        'Add at least one permitted jurisdiction in the Compliance Setup workspace.',
      evidencePath: '/compliance/setup',
      isStale: false,
      staleDays: null,
    })
  }

  const staleDays = daysSince(jurisdiction.staleSince)
  const isStale = staleDays !== null && staleDays > STALE_DAYS_THRESHOLD

  if (isStale && staleDays !== null) {
    factors.push({
      id: 'jurisdiction-stale',
      label: 'Jurisdiction Evidence Is Stale',
      description: `Jurisdiction configuration has not been reviewed in ${staleDays} days. Outdated jurisdiction records may not reflect regulatory changes in relevant markets.`,
      score: 10,
      band: 'medium',
      recommendation: 'Review and re-confirm jurisdiction policy in the Compliance Setup workspace.',
      evidencePath: '/compliance/setup',
      isStale: true,
      staleDays,
    })
  }

  return { factors, incompleteSources }
}

/**
 * Derive evidence section risk factors (failed and pending evidence).
 * Maximum contribution: 15 points.
 */
export function deriveEvidenceFactors(
  bundle: ComplianceReportBundle,
): { factors: RiskFactor[]; incompleteSources: string[] } {
  const factors: RiskFactor[] = []
  const incompleteSources: string[] = []

  let evidenceScore = 0
  const failedSections = bundle.evidenceSections.filter(s => s.status === 'failed')
  const pendingSections = bundle.evidenceSections.filter(s => s.status === 'pending')

  if (failedSections.length > 0) {
    const contribution = clamp(failedSections.length * 5, 5, 15)
    evidenceScore += contribution
    factors.push({
      id: 'evidence-failed-sections',
      label: `${failedSections.length} Evidence Section${failedSections.length > 1 ? 's' : ''} Failed`,
      description: `${failedSections.map(s => s.title).join(', ')} ${failedSections.length > 1 ? 'are' : 'is'} missing required evidence. Failed sections cannot be included in a release-grade evidence package.`,
      score: contribution,
      band: 'high',
      recommendation:
        'Resolve missing evidence in the Compliance Evidence Pack workspace.',
      evidencePath: '/compliance/evidence',
      isStale: false,
      staleDays: null,
    })
  }

  if (pendingSections.length > 0 && evidenceScore < 15) {
    const contribution = clamp(pendingSections.length * 3, 3, 15 - evidenceScore)
    if (contribution > 0) {
      factors.push({
        id: 'evidence-pending-sections',
        label: `${pendingSections.length} Evidence Section${pendingSections.length > 1 ? 's' : ''} Pending`,
        description: `${pendingSections.map(s => s.title).join(', ')} ${pendingSections.length > 1 ? 'are' : 'is'} still collecting evidence. Pending sections are not available for release-grade sign-off.`,
        score: contribution,
        band: 'medium',
        recommendation:
          'Wait for pending evidence collection to complete or trigger a manual refresh.',
        evidencePath: '/compliance/evidence',
        isStale: false,
        staleDays: null,
      })
    }
  }

  return { factors, incompleteSources }
}

/**
 * Derive investor eligibility risk factors.
 * Maximum contribution: 10 points.
 */
export function deriveInvestorEligibilityFactors(
  bundle: ComplianceReportBundle,
): { factors: RiskFactor[]; incompleteSources: string[] } {
  const factors: RiskFactor[] = []
  const incompleteSources: string[] = []

  const { investorEligibility } = bundle

  if (investorEligibility.status === 'unavailable') {
    incompleteSources.push('Investor eligibility status')
    return { factors, incompleteSources }
  }

  if (investorEligibility.status === 'failed') {
    factors.push({
      id: 'investor-eligibility-failed',
      label: 'Investor Eligibility Not Configured',
      description:
        'Investor eligibility requirements are not configured. Without eligibility rules, the token cannot enforce accreditation or retail investor restrictions.',
      score: 10,
      band: 'medium',
      recommendation:
        'Configure investor eligibility requirements in the Compliance Setup workspace.',
      evidencePath: '/compliance/setup',
      isStale: false,
      staleDays: null,
    })
    return { factors, incompleteSources }
  }

  const staleDays = daysSince(investorEligibility.staleSince)
  const isStale = staleDays !== null && staleDays > STALE_DAYS_THRESHOLD

  if (isStale && staleDays !== null) {
    factors.push({
      id: 'investor-eligibility-stale',
      label: 'Investor Eligibility Evidence Is Stale',
      description: `Investor eligibility records have not been reviewed in ${staleDays} days. Stale eligibility configuration may not reflect current requirements.`,
      score: 5,
      band: 'medium',
      recommendation:
        'Review and refresh investor eligibility configuration in the Compliance Setup workspace.',
      evidencePath: '/compliance/setup',
      isStale: true,
      staleDays,
    })
  }

  return { factors, incompleteSources }
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Compute a complete RiskAssessment from a ComplianceReportBundle.
 *
 * The result is heuristic: it reflects the current state of frontend-accessible
 * evidence and should be reviewed by a qualified compliance professional.
 */
export function computeRiskAssessment(bundle: ComplianceReportBundle): RiskAssessment {
  const allFactors: RiskFactor[] = []
  const incompleteSources: string[] = []

  const kycResult = deriveKycAmlFactors(bundle)
  const whitelistResult = deriveWhitelistFactors(bundle)
  const jurisdictionResult = deriveJurisdictionFactors(bundle)
  const evidenceResult = deriveEvidenceFactors(bundle)
  const eligibilityResult = deriveInvestorEligibilityFactors(bundle)

  allFactors.push(
    ...kycResult.factors,
    ...whitelistResult.factors,
    ...jurisdictionResult.factors,
    ...evidenceResult.factors,
    ...eligibilityResult.factors,
  )
  incompleteSources.push(
    ...kycResult.incompleteSources,
    ...whitelistResult.incompleteSources,
    ...jurisdictionResult.incompleteSources,
    ...evidenceResult.incompleteSources,
    ...eligibilityResult.incompleteSources,
  )

  // Sort by score descending
  allFactors.sort((a, b) => b.score - a.score)

  // Cap total score at 100
  const rawScore = allFactors.reduce((sum, f) => sum + f.score, 0)
  const overallScore = clamp(rawScore, 0, 100)
  const overallBand = scoreToBand(overallScore)

  const topFactors = allFactors.slice(0, 3)

  // Recommendations: de-duplicate by recommendation text, highest score first
  const seen = new Set<string>()
  const recommendedActions: string[] = []
  for (const factor of allFactors) {
    if (!seen.has(factor.recommendation)) {
      seen.add(factor.recommendation)
      recommendedActions.push(factor.recommendation)
    }
  }

  return {
    overallScore,
    overallBand,
    factors: allFactors,
    topFactors,
    recommendedActions,
    assessedAt: new Date().toISOString(),
    isHeuristic: true,
    incompleteSources,
  }
}

// ---------------------------------------------------------------------------
// Section content builders
// ---------------------------------------------------------------------------

function buildSectionContent(
  sectionId: string,
  bundle: ComplianceReportBundle,
  assessment: RiskAssessment,
): SectionContent {
  switch (sectionId) {
    case 'risk-overview':
      return {
        type: 'risk-overview',
        overallScore: assessment.overallScore,
        overallBand: assessment.overallBand,
        readinessScore: bundle.readinessScore,
        overallStatus: bundle.overallStatus,
        heuristicDisclaimer: HEURISTIC_DISCLAIMER,
      } satisfies RiskOverviewContent

    case 'top-risks':
      return {
        type: 'top-risks',
        factors: assessment.topFactors,
      } satisfies TopRisksContent

    case 'recommendations':
      return {
        type: 'recommendations',
        actions: assessment.recommendedActions,
      } satisfies RecommendationsContent

    case 'jurisdiction-coverage':
      return {
        type: 'jurisdiction-coverage',
        configured: bundle.jurisdiction.configured,
        permitted: bundle.jurisdiction.permittedCount,
        restricted: bundle.jurisdiction.restrictedCount,
        jurisdictions: bundle.jurisdiction.jurisdictions,
        staleSince: bundle.jurisdiction.staleSince,
        isStale: (daysSince(bundle.jurisdiction.staleSince) ?? 0) > STALE_DAYS_THRESHOLD,
      } satisfies JurisdictionContent

    case 'kyc-aml-status':
      return {
        type: 'kyc-aml-status',
        status: bundle.kycAml.status,
        kycRequired: bundle.kycAml.kycRequired,
        amlRequired: bundle.kycAml.amlRequired,
        providerConfigured: bundle.kycAml.providerConfigured,
        pendingReviewCount: bundle.kycAml.pendingReviewCount,
        staleSince: bundle.kycAml.staleSince,
        isStale: (daysSince(bundle.kycAml.staleSince) ?? 0) > STALE_DAYS_THRESHOLD,
      } satisfies KycAmlContent

    case 'whitelist-posture':
      return {
        type: 'whitelist-posture',
        status: bundle.whitelist.status,
        whitelistRequired: bundle.whitelist.whitelistRequired,
        approvedCount: bundle.whitelist.approvedInvestorCount,
        pendingCount: bundle.whitelist.pendingInvestorCount,
        activeId: bundle.whitelist.activeWhitelistId,
        staleSince: bundle.whitelist.staleSince,
        isStale: (daysSince(bundle.whitelist.staleSince) ?? 0) > STALE_DAYS_THRESHOLD,
      } satisfies WhitelistContent

    case 'investor-eligibility':
      return {
        type: 'investor-eligibility',
        status: bundle.investorEligibility.status,
        accreditedRequired: bundle.investorEligibility.accreditedRequired,
        retailPermitted: bundle.investorEligibility.retailPermitted,
        categories: bundle.investorEligibility.eligibilityCategories,
        staleSince: bundle.investorEligibility.staleSince,
        isStale: (daysSince(bundle.investorEligibility.staleSince) ?? 0) > STALE_DAYS_THRESHOLD,
      } satisfies InvestorEligibilityContent

    case 'evidence-inventory':
      return {
        type: 'evidence-inventory',
        sections: bundle.evidenceSections.map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          releaseGrade: s.releaseGrade,
          summary: s.summary,
        })),
      } satisfies EvidenceInventoryContent

    case 'stale-evidence': {
      const staleItems: StaleEvidenceContent['staleItems'] = []
      const checkStaleness = (
        label: string,
        staleSince: string | null,
        path: string | null,
      ) => {
        const days = daysSince(staleSince)
        if (days !== null && days > STALE_DAYS_THRESHOLD && staleSince) {
          staleItems.push({ label, staleSince, staleDays: days, path })
        }
      }
      checkStaleness('KYC/AML Records', bundle.kycAml.staleSince, '/compliance-monitoring')
      checkStaleness('Whitelist Records', bundle.whitelist.staleSince, '/compliance/whitelists')
      checkStaleness('Jurisdiction Policy', bundle.jurisdiction.staleSince, '/compliance/setup')
      checkStaleness(
        'Investor Eligibility',
        bundle.investorEligibility.staleSince,
        '/compliance/setup',
      )
      return { type: 'stale-evidence', staleItems } satisfies StaleEvidenceContent
    }

    case 'audit-trail':
      return {
        type: 'audit-trail',
        generatedAt: bundle.generatedAt,
        assessedAt: assessment.assessedAt,
        launchName: bundle.launchName,
        bundleVersion: bundle.exportVersion,
      } satisfies AuditTrailContent

    default:
      return {
        type: 'risk-overview',
        overallScore: 0,
        overallBand: 'minimal',
        readinessScore: 0,
        overallStatus: 'unavailable',
        heuristicDisclaimer: HEURISTIC_DISCLAIMER,
      } satisfies RiskOverviewContent
  }
}

// ---------------------------------------------------------------------------
// Report composition
// ---------------------------------------------------------------------------

/**
 * Build a list of IncludedSection objects for a given preset, respecting
 * operator overrides.
 *
 * @param preset       The selected report preset.
 * @param bundle       The compliance report bundle to draw content from.
 * @param assessment   The computed risk assessment.
 * @param overrides    Map of sectionId → included (true/false) for operator customisation.
 */
export function buildReportSections(
  preset: ReportPreset,
  bundle: ComplianceReportBundle,
  assessment: RiskAssessment,
  overrides: Map<string, boolean> = new Map(),
): IncludedSection[] {
  return REPORT_SECTION_DEFS.map(def => {
    const defaultOn = def.defaultForPresets.includes(preset)
    const operatorOverride = overrides.get(def.id)
    const included = operatorOverride !== undefined ? operatorOverride : defaultOn

    let omitReason: string | null = null
    if (!included && !defaultOn) {
      omitReason = `Not included in the ${PRESET_LABELS[preset]} preset by default.`
    } else if (!included && defaultOn) {
      omitReason = 'Excluded by operator during report customisation.'
    }

    const content = included
      ? buildSectionContent(def.id, bundle, assessment)
      : buildSectionContent(def.id, bundle, assessment) // still build for omit reference

    return { def, included, omitReason, content }
  })
}

/**
 * Assemble the final export payload for a custom compliance report.
 */
export function buildCustomReportPayload(
  preset: ReportPreset,
  bundle: ComplianceReportBundle,
  assessment: RiskAssessment,
  overrides: Map<string, boolean> = new Map(),
): CustomReportPayload {
  const sections = buildReportSections(preset, bundle, assessment, overrides)
  return {
    preset,
    presetLabel: PRESET_LABELS[preset],
    generatedAt: new Date().toISOString(),
    launchName: bundle.launchName,
    riskAssessment: assessment,
    includedSections: sections,
    exportVersion: '2.0',
    heuristicDisclaimer: HEURISTIC_DISCLAIMER,
  }
}

/**
 * Format the custom report as a human-readable text for sharing or printing.
 */
export function formatReportAsText(payload: CustomReportPayload): string {
  const lines: string[] = []
  const divider = '─'.repeat(64)

  lines.push('BIATEC TOKENS — CUSTOM COMPLIANCE REPORT')
  lines.push(divider)
  lines.push(`Preset:         ${payload.presetLabel}`)
  lines.push(`Launch:         ${payload.launchName ?? 'Not specified'}`)
  lines.push(`Generated:      ${new Date(payload.generatedAt).toLocaleString()}`)
  lines.push(`Risk Band:      ${RISK_BAND_LABELS[payload.riskAssessment.overallBand]} (${payload.riskAssessment.overallScore}/100)`)
  lines.push('')
  lines.push('DISCLAIMER')
  lines.push(payload.heuristicDisclaimer)
  lines.push('')

  for (const section of payload.includedSections) {
    if (!section.included) {
      lines.push(`[SECTION OMITTED: ${section.def.label}]`)
      if (section.omitReason) lines.push(`  Reason: ${section.omitReason}`)
      lines.push('')
      continue
    }

    lines.push(`${section.def.label.toUpperCase()}`)
    lines.push(divider)

    const c = section.content
    switch (c.type) {
      case 'risk-overview':
        lines.push(`Overall Risk Score: ${c.overallScore}/100`)
        lines.push(`Risk Band:          ${RISK_BAND_LABELS[c.overallBand]}`)
        lines.push(`Readiness Score:    ${c.readinessScore}%`)
        break
      case 'top-risks':
        if (c.factors.length === 0) {
          lines.push('No significant risk factors identified.')
        } else {
          c.factors.forEach((f, i) => {
            lines.push(`${i + 1}. ${f.label} (${RISK_BAND_LABELS[f.band]}, score: ${f.score})`)
            lines.push(`   ${f.description}`)
            lines.push(`   Action: ${f.recommendation}`)
            if (f.isStale && f.staleDays !== null) {
              lines.push(`   ⚠ Evidence is ${f.staleDays} days old.`)
            }
          })
        }
        break
      case 'recommendations':
        if (c.actions.length === 0) {
          lines.push('No actions required.')
        } else {
          c.actions.forEach((a, i) => lines.push(`${i + 1}. ${a}`))
        }
        break
      case 'jurisdiction-coverage':
        lines.push(`Configured:   ${c.configured ? 'Yes' : 'No'}`)
        lines.push(`Permitted:    ${c.permitted}`)
        lines.push(`Restricted:   ${c.restricted}`)
        if (c.isStale) lines.push('⚠ Evidence is stale — review recommended.')
        break
      case 'kyc-aml-status':
        lines.push(`Status:               ${c.status}`)
        lines.push(`KYC Required:         ${c.kycRequired ? 'Yes' : 'No'}`)
        lines.push(`AML Required:         ${c.amlRequired ? 'Yes' : 'No'}`)
        lines.push(`Provider Configured:  ${c.providerConfigured ? 'Yes' : 'No'}`)
        lines.push(`Pending Reviews:      ${c.pendingReviewCount}`)
        if (c.isStale) lines.push('⚠ Evidence is stale — review recommended.')
        break
      case 'whitelist-posture':
        lines.push(`Status:               ${c.status}`)
        lines.push(`Whitelist Required:   ${c.whitelistRequired ? 'Yes' : 'No'}`)
        lines.push(`Approved Investors:   ${c.approvedCount}`)
        lines.push(`Pending Investors:    ${c.pendingCount}`)
        if (c.isStale) lines.push('⚠ Evidence is stale — review recommended.')
        break
      case 'investor-eligibility':
        lines.push(`Status:               ${c.status}`)
        lines.push(`Accredited Required:  ${c.accreditedRequired ? 'Yes' : 'No'}`)
        lines.push(`Retail Permitted:     ${c.retailPermitted ? 'Yes' : 'No'}`)
        if (c.categories.length > 0) lines.push(`Categories:           ${c.categories.join(', ')}`)
        if (c.isStale) lines.push('⚠ Evidence is stale — review recommended.')
        break
      case 'evidence-inventory':
        c.sections.forEach(s => {
          lines.push(
            `  ${s.releaseGrade ? '[Release-Grade]' : '[Dev Feedback]'} ${s.title}: ${s.status}`,
          )
          lines.push(`    ${s.summary}`)
        })
        break
      case 'stale-evidence':
        if (c.staleItems.length === 0) {
          lines.push('No stale evidence items found.')
        } else {
          c.staleItems.forEach(item => {
            lines.push(`  ⚠ ${item.label}: ${item.staleDays} days old (since ${item.staleSince})`)
          })
        }
        break
      case 'audit-trail':
        lines.push(`Report Generated:   ${c.generatedAt}`)
        lines.push(`Assessment At:      ${c.assessedAt}`)
        lines.push(`Bundle Version:     ${c.bundleVersion}`)
        if (c.launchName) lines.push(`Launch Name:        ${c.launchName}`)
        break
    }
    lines.push('')
  }

  lines.push(divider)
  lines.push('END OF REPORT')

  return lines.join('\n')
}
