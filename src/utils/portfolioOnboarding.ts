/**
 * Portfolio Onboarding Utilities
 *
 * Provides deterministic step-state derivation, portfolio continuity delta
 * calculation, and action readiness checks for the guided portfolio onboarding
 * and cross-wallet continuity experience.
 *
 * Business Value: Reduces first-action abandonment by surfacing the right
 * next step for each user state, and accelerates returning-user sessions by
 * highlighting portfolio changes since last visit.
 */

import type { AlgorandUser } from '../stores/auth'
import type { AccountProvisioningStatus } from '../types/accountProvisioning'

// ─── Onboarding step derivation ───────────────────────────────────────────────

export type OnboardingStepId =
  | 'sign_in'
  | 'account_provisioning'
  | 'explore_standards'
  | 'create_first_token'
  | 'configure_compliance'
  | 'deploy_token'
  | 'complete'

export type OnboardingStepStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export interface OnboardingStep {
  id: OnboardingStepId
  title: string
  description: string
  status: OnboardingStepStatus
  /** Route path for the CTA button */
  ctaPath?: string
  ctaLabel?: string
  /** Human-readable explanation for why a step is blocked */
  blockedReason?: string
  /** Remediation action for the user */
  remediationAction?: string
}

export interface UserOnboardingContext {
  isAuthenticated: boolean
  user: AlgorandUser | null
  provisioningStatus?: AccountProvisioningStatus
  hasCreatedToken: boolean
  hasDeployedToken: boolean
  hasConfiguredCompliance: boolean
  tokenCount: number
}

/**
 * Derive deterministic onboarding steps from current user context.
 *
 * Rules are applied in precedence order so only the current blocking step
 * receives the 'in_progress' status; prior steps are 'completed' and future
 * steps are 'pending'.
 */
export function deriveOnboardingSteps(ctx: UserOnboardingContext): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    {
      id: 'sign_in',
      title: 'Sign In',
      description: 'Authenticate with your email and password to unlock all features.',
      status: ctx.isAuthenticated ? 'completed' : 'in_progress',
      ctaPath: '/?showAuth=true',
      ctaLabel: 'Sign In',
    },
    {
      id: 'account_provisioning',
      title: 'Activate Account',
      description: 'Your account is being provisioned. This usually takes under two minutes.',
      status: deriveProvisioningStepStatus(ctx),
      ctaPath: '/settings',
      ctaLabel: 'Check Status',
      blockedReason:
        ctx.provisioningStatus === 'failed'
          ? 'Account provisioning failed. Please contact support.'
          : undefined,
      remediationAction:
        ctx.provisioningStatus === 'suspended'
          ? 'Contact support to reactivate your account.'
          : ctx.provisioningStatus === 'failed'
            ? 'Contact support for provisioning assistance.'
            : undefined,
    },
    {
      id: 'explore_standards',
      title: 'Explore Token Standards',
      description: 'Discover AVM and EVM token standards and find the right fit for your project.',
      status: deriveExploreStepStatus(ctx),
      ctaPath: '/token-standards',
      ctaLabel: 'Explore Standards',
    },
    {
      id: 'create_first_token',
      title: 'Create Your First Token',
      description: 'Use the guided launch to define your token parameters step by step.',
      status: deriveCreateTokenStepStatus(ctx),
      ctaPath: '/launch/guided',
      ctaLabel: 'Start Guided Launch',
      blockedReason: !ctx.isAuthenticated
        ? 'Sign in before creating a token.'
        : ctx.provisioningStatus !== 'active'
          ? 'Your account must be active before creating tokens.'
          : undefined,
      remediationAction: !ctx.isAuthenticated
        ? 'Sign in with your email and password.'
        : ctx.provisioningStatus !== 'active'
          ? 'Wait for account provisioning to complete.'
          : undefined,
    },
    {
      id: 'configure_compliance',
      title: 'Configure Compliance',
      description: 'Set up compliance rules, whitelists, and jurisdiction controls for your tokens.',
      status: deriveComplianceStepStatus(ctx),
      ctaPath: '/compliance/setup',
      ctaLabel: 'Set Up Compliance',
      blockedReason: !ctx.hasCreatedToken ? 'Create a token first.' : undefined,
      remediationAction: !ctx.hasCreatedToken
        ? 'Complete token creation before configuring compliance.'
        : undefined,
    },
    {
      id: 'deploy_token',
      title: 'Deploy Token',
      description: 'Deploy your token to the selected network with one click.',
      status: deriveDeployStepStatus(ctx),
      ctaPath: '/cockpit',
      ctaLabel: 'Open Cockpit',
      blockedReason: !ctx.hasCreatedToken
        ? 'Create and configure a token before deployment.'
        : !ctx.hasConfiguredCompliance
          ? 'Configure compliance settings before deploying.'
          : undefined,
    },
    {
      id: 'complete',
      title: 'Portfolio Ready',
      description: 'Your token portfolio is live. Use the dashboard to monitor and manage it.',
      status: ctx.hasDeployedToken ? 'completed' : 'pending',
      ctaPath: '/dashboard',
      ctaLabel: 'View Dashboard',
    },
  ]

  return steps
}

/**
 * Return the single next actionable step (first non-completed step).
 */
export function getNextStep(steps: OnboardingStep[]): OnboardingStep | null {
  return steps.find((s) => s.status === 'in_progress' || s.status === 'blocked') ?? null
}

/**
 * Calculate overall onboarding progress as a percentage (0–100).
 */
export function calculateOnboardingProgress(steps: OnboardingStep[]): number {
  const completed = steps.filter((s) => s.status === 'completed').length
  return Math.round((completed / steps.length) * 100)
}

// ─── Private step-status derivers ────────────────────────────────────────────

function deriveProvisioningStepStatus(ctx: UserOnboardingContext): OnboardingStepStatus {
  if (!ctx.isAuthenticated) return 'pending'
  if (ctx.provisioningStatus === 'active') return 'completed'
  if (ctx.provisioningStatus === 'failed' || ctx.provisioningStatus === 'suspended')
    return 'blocked'
  if (ctx.provisioningStatus === 'provisioning') return 'in_progress'
  return 'in_progress' // not_started → treat as in_progress to prompt action
}

function deriveExploreStepStatus(ctx: UserOnboardingContext): OnboardingStepStatus {
  if (!ctx.isAuthenticated) return 'pending'
  if (ctx.provisioningStatus !== 'active') return 'pending'
  // Considered explored once user has created at least one token (proxy)
  if (ctx.hasCreatedToken) return 'completed'
  return 'in_progress'
}

function deriveCreateTokenStepStatus(ctx: UserOnboardingContext): OnboardingStepStatus {
  if (!ctx.isAuthenticated) return 'blocked'
  if (ctx.provisioningStatus !== 'active') return 'blocked'
  if (ctx.hasCreatedToken) return 'completed'
  return 'in_progress'
}

function deriveComplianceStepStatus(ctx: UserOnboardingContext): OnboardingStepStatus {
  if (!ctx.hasCreatedToken) return 'blocked'
  if (ctx.hasConfiguredCompliance) return 'completed'
  return 'in_progress'
}

function deriveDeployStepStatus(ctx: UserOnboardingContext): OnboardingStepStatus {
  if (!ctx.hasCreatedToken || !ctx.hasConfiguredCompliance) return 'blocked'
  if (ctx.hasDeployedToken) return 'completed'
  return 'in_progress'
}

// ─── Storage key ─────────────────────────────────────────────────────────────

const PORTFOLIO_SNAPSHOT_KEY = 'biatec_portfolio_snapshot'

// ─── Portfolio continuity deltas ──────────────────────────────────────────────

export interface PortfolioSnapshot {
  tokenCount: number
  deployedCount: number
  complianceScore: number
  /** ISO timestamp of when this snapshot was taken */
  capturedAt: string
}

export interface PortfolioDelta {
  indicator: string
  previous: number
  current: number
  change: number
  direction: 'up' | 'down' | 'unchanged'
  /** Formatted change string e.g. "+2", "-1", "0" */
  formattedChange: string
  /** True when the change is favourable for the user */
  isPositive: boolean
  lastUpdated: string
}

/**
 * Compute "since last visit" deltas between a previous snapshot and the
 * current portfolio values. Returns at least three meaningful indicators.
 * Returns an empty array if there is no prior snapshot (first visit).
 */
export function computePortfolioDeltas(
  previous: PortfolioSnapshot | null,
  current: PortfolioSnapshot,
): PortfolioDelta[] {
  if (!previous) return []
  return [
    buildDelta('Tokens Created', previous.tokenCount, current.tokenCount, current.capturedAt, (n) => n > 0),
    buildDelta('Deployed Tokens', previous.deployedCount, current.deployedCount, current.capturedAt, (n) => n > 0),
    buildDelta('Compliance Score', previous.complianceScore, current.complianceScore, current.capturedAt, (n) => n > 0),
  ]
}

function buildDelta(
  indicator: string,
  previous: number,
  current: number,
  lastUpdated: string,
  isPositiveFn: (change: number) => boolean,
): PortfolioDelta {
  const change = current - previous
  const direction: PortfolioDelta['direction'] =
    change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged'
  return {
    indicator,
    previous,
    current,
    change,
    direction,
    formattedChange: change > 0 ? `+${change}` : String(change),
    isPositive: isPositiveFn(change),
    lastUpdated,
  }
}

/**
 * Persist the current portfolio state as a snapshot in localStorage for
 * continuity on the next visit.
 */
export function savePortfolioSnapshot(snapshot: PortfolioSnapshot): void {
  try {
    localStorage.setItem(PORTFOLIO_SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // Storage errors should never block UX
  }
}

/**
 * Load the previously persisted portfolio snapshot. Returns null when none exists.
 */
export function loadPortfolioSnapshot(): PortfolioSnapshot | null {
  try {
    const raw = localStorage.getItem(PORTFOLIO_SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PortfolioSnapshot
  } catch {
    return null
  }
}

// ─── Action readiness indicators ──────────────────────────────────────────────

export type ReadinessCheckStatus = 'pass' | 'fail' | 'warning'

export interface ReadinessCheck {
  id: string
  label: string
  status: ReadinessCheckStatus
  /** Explanation shown to the user when status is 'fail' or 'warning' */
  message?: string
  /** Remediation route path or action label */
  remediationPath?: string
  remediationLabel?: string
}

export interface ActionReadinessState {
  canProceed: boolean
  checks: ReadinessCheck[]
  /** Count of failing checks that block the action */
  blockingCount: number
}

export interface ActionReadinessContext {
  isAuthenticated: boolean
  provisioningStatus?: AccountProvisioningStatus
  networkValid: boolean
  requiredFieldsComplete: boolean
  estimatedImpactAvailable: boolean
}

/**
 * Evaluate action readiness checks for a token action entry point.
 * Returns explicit pass/fail/warning status for each precondition, and a
 * top-level `canProceed` flag.
 */
export function evaluateActionReadiness(ctx: ActionReadinessContext): ActionReadinessState {
  const checks: ReadinessCheck[] = [
    {
      id: 'auth',
      label: 'Authenticated',
      status: ctx.isAuthenticated ? 'pass' : 'fail',
      message: ctx.isAuthenticated ? undefined : 'You must be signed in to perform this action.',
      remediationPath: '/?showAuth=true',
      remediationLabel: 'Sign In',
    },
    {
      id: 'provisioning',
      label: 'Account Active',
      status:
        ctx.provisioningStatus === 'active'
          ? 'pass'
          : ctx.provisioningStatus === 'provisioning'
            ? 'warning'
            : 'fail',
      message:
        ctx.provisioningStatus !== 'active'
          ? ctx.provisioningStatus === 'provisioning'
            ? 'Account provisioning is in progress. Some actions may be limited.'
            : 'Account is not active. Contact support.'
          : undefined,
      remediationPath: '/settings',
      remediationLabel: 'Check Account Status',
    },
    {
      id: 'network',
      label: 'Network Valid',
      status: ctx.networkValid ? 'pass' : 'fail',
      message: ctx.networkValid ? undefined : 'The selected network is currently unavailable.',
      remediationLabel: 'Select a Different Network',
    },
    {
      id: 'fields',
      label: 'Required Fields Complete',
      status: ctx.requiredFieldsComplete ? 'pass' : 'warning',
      message: ctx.requiredFieldsComplete
        ? undefined
        : 'Some required fields are not yet filled in.',
    },
    {
      id: 'impact',
      label: 'Impact Estimate Available',
      status: ctx.estimatedImpactAvailable ? 'pass' : 'warning',
      message: ctx.estimatedImpactAvailable
        ? undefined
        : 'Impact estimate could not be calculated. Proceed with caution.',
    },
  ]

  const blockingCount = checks.filter((c) => c.status === 'fail').length

  return {
    canProceed: blockingCount === 0,
    checks,
    blockingCount,
  }
}

// ─── Analytics events ─────────────────────────────────────────────────────────

export type OnboardingAnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_step_blocked'
  | 'continuity_panel_viewed'
  | 'action_readiness_checked'
  | 'first_action_initiated'
  | 'first_action_succeeded'
  | 'return_session_started'
  | 'wallet_connected'

export interface OnboardingAnalyticsPayload {
  event: OnboardingAnalyticsEvent
  stepId?: OnboardingStepId
  userId?: string
  sessionId: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * Build a typed analytics payload for a portfolio onboarding event.
 * Sensitive user fields are never included.
 */
export function buildOnboardingAnalyticsPayload(
  event: OnboardingAnalyticsEvent,
  sessionId: string,
  opts?: {
    stepId?: OnboardingStepId
    /** Pass only a non-sensitive identifier such as a pseudonymous user ID */
    userId?: string
    metadata?: Record<string, unknown>
  },
): OnboardingAnalyticsPayload {
  return {
    event,
    sessionId,
    timestamp: new Date().toISOString(),
    stepId: opts?.stepId,
    userId: opts?.userId,
    metadata: opts?.metadata,
  }
}

/**
 * Format a portfolio snapshot timestamp for user-facing display.
 * Returns a relative label such as "Just now", "5 minutes ago", or a
 * formatted date for older snapshots.
 */
export function formatSnapshotAge(capturedAt: string): string {
  const now = Date.now()
  const then = new Date(capturedAt).getTime()
  const diffMs = now - then

  if (diffMs < 60_000) return 'Just now'
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} minutes ago`
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} hours ago`
  return new Date(capturedAt).toLocaleDateString()
}
