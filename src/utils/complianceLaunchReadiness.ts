/**
 * Compliance Launch Readiness Adapter
 *
 * Maps compliance setup store state into a typed UI domain model for the
 * Compliance Launch Console. Provides deterministic readiness state derivation,
 * primary action computation, blocker enrichment, and analytics payload building.
 *
 * Design: pure functions only — no side-effects, no store dependencies.
 * The view passes raw store values; the adapter returns immutable UI models.
 *
 * Analytics event contract (stable, versioned):
 *   event name: 'compliance:analytics'
 *   detail: ComplianceAnalyticsPayload
 */

import type { ReadinessAssessment, ComplianceSetupStep } from '../types/complianceSetup'

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** Status of a single compliance domain card. */
export type DomainStatus = 'not_started' | 'needs_attention' | 'ready' | 'blocked'

/** Overall launch gate state derived from all domains. */
export type LaunchGateState = 'not_started' | 'in_review' | 'blocked' | 'ready'

/** The single primary action shown to the user at any given state. */
export type PrimaryAction = 'start_review' | 'resolve_blockers' | 'launch_token'

/** Enriched blocker detail with plain-language "what/why/how" guidance. */
export interface BlockerDetail {
  id: string
  /** Short one-line description of what happened. */
  what: string
  /** Why this matters for compliance. */
  why: string
  /** Actionable next step for the user. */
  how: string
  /** Deep link to the exact remediation step. */
  deepLink: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

/** A single compliance domain (issuer identity, jurisdiction, whitelist, etc.). */
export interface LaunchReadinessDomain {
  id: string
  label: string
  description: string
  status: DomainStatus
  blockers: BlockerDetail[]
  /** Route to the setup step for this domain. */
  deepLink: string
  /** Estimated minutes to complete if not ready. */
  estimatedMinutes?: number
}

/** Full launch readiness model consumed by the view. */
export interface LaunchReadinessModel {
  gate: LaunchGateState
  primaryAction: PrimaryAction
  domains: LaunchReadinessDomain[]
  totalBlockers: number
  readinessScore: number
  lastChecked: Date
  isReadyForDeploy: boolean
}

/** Analytics event payload — stable schema, do not rename fields. */
export interface ComplianceAnalyticsPayload {
  eventName:
    | 'compliance_console_viewed'
    | 'compliance_blocker_opened'
    | 'compliance_blocker_resolved'
    | 'compliance_launch_attempted'
    | 'compliance_launch_succeeded'
    | 'compliance_launch_failed'
  gateState: LaunchGateState
  primaryAction: PrimaryAction
  totalBlockers: number
  readinessScore: number
  domainId?: string
  blockerId?: string
  timestampMs: number
}

// ---------------------------------------------------------------------------
// Domain metadata — maps step IDs to human-readable product language
// ---------------------------------------------------------------------------

interface DomainMeta {
  label: string
  description: string
  deepLink: string
  estimatedMinutes: number
}

const DOMAIN_META: Record<string, DomainMeta> = {
  jurisdiction: {
    label: 'Jurisdiction & Policy',
    description: 'Issuer jurisdiction, distribution geography, and investor constraints must be configured.',
    deepLink: '/compliance/setup?step=jurisdiction',
    estimatedMinutes: 15,
  },
  whitelist: {
    label: 'Whitelist Readiness',
    description: 'Investor eligibility rules and access restrictions must be established.',
    deepLink: '/compliance/setup?step=whitelist',
    estimatedMinutes: 10,
  },
  kyc_aml: {
    label: 'KYC/AML Readiness',
    description: 'Know-your-customer and anti-money-laundering provider configuration must be complete.',
    deepLink: '/compliance/setup?step=kyc_aml',
    estimatedMinutes: 20,
  },
  attestation: {
    label: 'Disclosure Attachments',
    description: 'Required attestations, risk disclosures, and supporting evidence must be provided.',
    deepLink: '/compliance/setup?step=attestation',
    estimatedMinutes: 15,
  },
  summary: {
    label: 'Pre-launch Review',
    description: 'Final readiness summary and sign-off before deployment.',
    deepLink: '/compliance/setup?step=summary',
    estimatedMinutes: 5,
  },
}

// ---------------------------------------------------------------------------
// Blocker enrichment — transforms raw store blockers into product-language guidance
// ---------------------------------------------------------------------------

/**
 * Returns "what / why / how" guidance for a known blocker pattern.
 * Falls back to the raw store message when the pattern is unrecognised.
 */
function enrichBlocker(
  blockerId: string,
  rawTitle: string,
  rawDescription: string,
  stepId: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
): BlockerDetail {
  // Pattern-match step-incomplete blockers
  if (blockerId.includes('_incomplete')) {
    const meta = DOMAIN_META[stepId] ?? DOMAIN_META['summary']
    return {
      id: blockerId,
      what: `${meta.label} not completed`,
      why: 'All required compliance domains must be verified before deployment to prevent non-compliant token issuance.',
      how: `Open the ${meta.label} step, complete all required fields, and resolve any validation warnings.`,
      deepLink: meta.deepLink,
      severity,
    }
  }

  // Jurisdiction-specific patterns
  if (blockerId.includes('jurisdiction')) {
    return {
      id: blockerId,
      what: rawTitle,
      why: 'Jurisdiction rule missing — tokens cannot be issued without a valid issuer and distribution policy.',
      how: 'Navigate to Jurisdiction & Policy and complete the issuer country and regulatory framework fields.',
      deepLink: DOMAIN_META['jurisdiction'].deepLink,
      severity,
    }
  }

  // Whitelist-specific patterns
  if (blockerId.includes('whitelist')) {
    return {
      id: blockerId,
      what: rawTitle,
      why: 'Whitelist export pending — unvetted investors could receive tokens without eligibility checks.',
      how: 'Configure at least one whitelist with investor eligibility rules before proceeding.',
      deepLink: DOMAIN_META['whitelist'].deepLink,
      severity,
    }
  }

  // KYC/AML patterns
  if (blockerId.includes('kyc') || blockerId.includes('aml')) {
    return {
      id: blockerId,
      what: rawTitle,
      why: 'KYC/AML provider not configured — regulatory bodies require verified identity checks for token holders.',
      how: 'Select a KYC provider and specify required document types in the KYC/AML Readiness step.',
      deepLink: DOMAIN_META['kyc_aml'].deepLink,
      severity,
    }
  }

  // Attestation patterns
  if (blockerId.includes('attestation')) {
    return {
      id: blockerId,
      what: rawTitle,
      why: 'Disclosure attachment required — investors must receive mandated risk disclosures before purchase.',
      how: 'Upload or link the required attestation documents in the Disclosure Attachments step.',
      deepLink: DOMAIN_META['attestation'].deepLink,
      severity,
    }
  }

  // Generic fallback — keeps user-guidance standard without exposing raw errors
  return {
    id: blockerId,
    what: rawTitle || 'Compliance requirement not met',
    why: rawDescription || 'This issue must be resolved before the token can be deployed.',
    how: 'Review the compliance setup steps and address any outstanding requirements.',
    deepLink: `/compliance/setup`,
    severity,
  }
}

// ---------------------------------------------------------------------------
// Step → domain status mapping
// ---------------------------------------------------------------------------

function stepToDomainStatus(step: ComplianceSetupStep): DomainStatus {
  if (step.status === 'blocked') return 'blocked'
  if (step.isComplete) return 'ready'
  if (step.status === 'in_progress' || step.status === 'needs_review') return 'needs_attention'
  return 'not_started'
}

// ---------------------------------------------------------------------------
// Primary export: deriveReadinessModel
// ---------------------------------------------------------------------------

/**
 * Derives the full launch readiness model from compliance setup store state.
 *
 * @param steps   - steps array from complianceSetup store
 * @param assessment - calculateReadiness computed from complianceSetup store
 * @returns LaunchReadinessModel consumed by ComplianceLaunchConsole
 */
export function deriveReadinessModel(
  steps: ComplianceSetupStep[],
  assessment: ReadinessAssessment,
): LaunchReadinessModel {
  // Build domain cards
  const domains: LaunchReadinessDomain[] = steps.map((step) => {
    const meta = DOMAIN_META[step.id] ?? {
      label: step.title,
      description: step.description,
      deepLink: `/compliance/setup?step=${step.id}`,
      estimatedMinutes: 15,
    }

    // Collect blockers for this step
    const stepBlockers: BlockerDetail[] = assessment.blockers
      .filter((b) => b.relatedStepId === step.id || b.id.startsWith(`blocker_${step.id}`))
      .map((b) =>
        enrichBlocker(
          b.id,
          b.title,
          b.description,
          step.id,
          b.severity as 'critical' | 'high' | 'medium' | 'low',
        ),
      )

    return {
      id: step.id,
      label: meta.label,
      description: meta.description,
      status: stepToDomainStatus(step),
      blockers: stepBlockers,
      deepLink: meta.deepLink,
      estimatedMinutes: step.isComplete ? undefined : meta.estimatedMinutes,
    }
  })

  const totalBlockers = assessment.blockers.length
  const { readinessScore, isReadyForDeploy } = assessment

  // Derive gate state
  let gate: LaunchGateState
  const allNotStarted = steps.every((s) => s.status === 'not_started' && !s.isComplete)
  if (allNotStarted) {
    gate = 'not_started'
  } else if (isReadyForDeploy) {
    gate = 'ready'
  } else if (totalBlockers > 0) {
    gate = 'blocked'
  } else {
    gate = 'in_review'
  }

  // Derive primary action
  let primaryAction: PrimaryAction
  if (gate === 'not_started') {
    primaryAction = 'start_review'
  } else if (gate === 'ready') {
    primaryAction = 'launch_token'
  } else {
    primaryAction = 'resolve_blockers'
  }

  return {
    gate,
    primaryAction,
    domains,
    totalBlockers,
    readinessScore,
    isReadyForDeploy,
    lastChecked: new Date(),
  }
}

// ---------------------------------------------------------------------------
// Analytics helpers
// ---------------------------------------------------------------------------

/** Build a compliance analytics event payload. */
export function buildComplianceAnalyticsEvent(
  eventName: ComplianceAnalyticsPayload['eventName'],
  model: LaunchReadinessModel,
  extra?: Partial<Pick<ComplianceAnalyticsPayload, 'domainId' | 'blockerId'>>,
): ComplianceAnalyticsPayload {
  return {
    eventName,
    gateState: model.gate,
    primaryAction: model.primaryAction,
    totalBlockers: model.totalBlockers,
    readinessScore: model.readinessScore,
    domainId: extra?.domainId,
    blockerId: extra?.blockerId,
    timestampMs: Date.now(),
  }
}

/** Dispatch a compliance analytics event to the window. */
export function dispatchComplianceAnalytics(payload: ComplianceAnalyticsPayload): void {
  window.dispatchEvent(new CustomEvent('compliance:analytics', { detail: payload }))
}

// ---------------------------------------------------------------------------
// CTA label helpers
// ---------------------------------------------------------------------------

export const PRIMARY_ACTION_LABELS: Record<PrimaryAction, string> = {
  start_review: 'Start Compliance Review',
  resolve_blockers: 'Resolve Blockers',
  launch_token: 'Launch Token',
}

export const GATE_STATE_LABELS: Record<LaunchGateState, string> = {
  not_started: 'Not Started',
  in_review: 'In Review',
  blocked: 'Blocked',
  ready: 'Ready to Launch',
}

export const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  not_started: 'Not Started',
  needs_attention: 'Needs Attention',
  ready: 'Ready',
  blocked: 'Blocked',
}

// ---------------------------------------------------------------------------
// Severity-to-CSS helpers (exported so they can be unit-tested directly)
// ---------------------------------------------------------------------------

/** Returns Tailwind card background/border classes for a blocker by severity. */
export function blockerSeverityCardClass(severity: BlockerDetail['severity']): string {
  if (severity === 'critical') return 'bg-red-950/50 border-red-800/60'
  if (severity === 'high') return 'bg-orange-950/50 border-orange-800/60'
  return 'bg-yellow-950/50 border-yellow-800/60'
}

/** Returns Tailwind link/button classes for a blocker action by severity. */
export function blockerSeverityLinkClass(severity: BlockerDetail['severity']): string {
  if (severity === 'critical') return 'bg-red-600/20 hover:bg-red-600/30 border border-red-700/50 text-red-300 focus-visible:ring-red-400'
  if (severity === 'high') return 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-700/50 text-orange-300 focus-visible:ring-orange-400'
  return 'bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-700/50 text-yellow-300 focus-visible:ring-yellow-400'
}

