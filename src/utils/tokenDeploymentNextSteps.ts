/**
 * Token Deployment Next Steps
 *
 * Maps token deployment outcomes to structured, user-actionable next steps so
 * users always know what to do after a launch attempt — whether it succeeded,
 * needs attention, or failed.
 *
 * Design goals:
 *  - No blockchain jargon; plain business language throughout.
 *  - Every outcome has at least one recovery or progression action.
 *  - Severity is explicit so the UI can style appropriately.
 *
 * Addresses Acceptance Criterion #1:
 *   "Token lifecycle flows provide clear success/failure outcomes with
 *    actionable messaging."
 */

// ─── Outcome types ────────────────────────────────────────────────────────────

export type DeploymentOutcome =
  | 'success'
  | 'partial_success'   // Deployed but optional steps incomplete (e.g. indexing delayed)
  | 'validation_failed' // Pre-deployment validation blocked the launch
  | 'compliance_hold'   // Compliance requirements prevented deployment
  | 'network_error'     // Transient connectivity failure
  | 'rejected'          // Rejected by the network (e.g. invalid token parameters)
  | 'timeout'           // Backend did not respond in time
  | 'unknown'           // Catch-all for unclassified failures

export type NextStepPriority = 'required' | 'recommended' | 'optional'

export interface NextStep {
  id: string
  /** Verb-led imperative label shown on the action button / link */
  label: string
  /** One sentence explaining what this action achieves */
  description: string
  /** Route path for internal navigation, or null for external/modal actions */
  route: string | null
  priority: NextStepPriority
}

export interface DeploymentNextStepsResult {
  outcome: DeploymentOutcome
  /** Heading summarising what happened */
  title: string
  /** One-paragraph user-facing explanation */
  summary: string
  /** Colour class for the result banner */
  colorClass: string
  /** Ordered list of actions the user should take */
  nextSteps: NextStep[]
}

// ─── Token context ────────────────────────────────────────────────────────────

export interface DeploymentContext {
  tokenName?: string
  tokenStandard?: string   // e.g. 'ARC200', 'ERC20', 'ARC1400'
  network?: string
  complianceComplete?: boolean
  isRWA?: boolean          // Real-world-asset token — stricter compliance guidance
}

// ─── Step catalogue ───────────────────────────────────────────────────────────

const STEP_VIEW_DASHBOARD: NextStep = {
  id: 'view-dashboard',
  label: 'View token dashboard',
  description: 'Check your token status, analytics, and management options.',
  route: '/dashboard',
  priority: 'required',
}

const STEP_COMPLETE_COMPLIANCE: NextStep = {
  id: 'complete-compliance',
  label: 'Complete compliance requirements',
  description: 'Finish outstanding compliance steps to meet regulatory obligations.',
  route: '/compliance',
  priority: 'required',
}

const STEP_VIEW_COCKPIT: NextStep = {
  id: 'view-cockpit',
  label: 'Open lifecycle cockpit',
  description: 'Monitor your token\'s health, activity, and operational status.',
  route: '/cockpit',
  priority: 'recommended',
}

const STEP_ADD_ATTESTATION: NextStep = {
  id: 'add-attestation',
  label: 'Add attestation',
  description: 'Attach a verifiable attestation to increase buyer confidence.',
  route: '/attestations',
  priority: 'recommended',
}

const STEP_RETRY_LAUNCH: NextStep = {
  id: 'retry-launch',
  label: 'Retry token launch',
  description: 'Return to the guided launch wizard and try again.',
  route: '/launch/guided',
  priority: 'required',
}

const STEP_CHECK_NETWORK: NextStep = {
  id: 'check-network',
  label: 'Check network status',
  description: 'Verify the target network is operational and try again when available.',
  route: null,
  priority: 'required',
}

const STEP_FIX_VALIDATION: NextStep = {
  id: 'fix-validation',
  label: 'Correct token configuration',
  description: 'Review and fix the highlighted fields, then resubmit.',
  route: '/launch/guided',
  priority: 'required',
}

const STEP_CONTACT_SUPPORT: NextStep = {
  id: 'contact-support',
  label: 'Contact support',
  description: 'Our team can help resolve issues that cannot be fixed automatically.',
  route: null,
  priority: 'optional',
}

const STEP_EXPLORE_LAUNCHPAD: NextStep = {
  id: 'explore-launchpad',
  label: 'Explore the launchpad',
  description: 'Discover tools and resources to grow your token\'s ecosystem.',
  route: '/launchpad',
  priority: 'optional',
}

const STEP_MANAGE_WHITELIST: NextStep = {
  id: 'manage-whitelist',
  label: 'Set up transfer restrictions',
  description: 'Configure whitelist rules required for your token type.',
  route: '/compliance/whitelists',
  priority: 'recommended',
}

// ─── Core mapping function ────────────────────────────────────────────────────

/**
 * Returns a structured next-steps result for a given deployment outcome and
 * token context. Always returns at least one actionable next step.
 */
export function getDeploymentNextSteps(
  outcome: DeploymentOutcome,
  context: DeploymentContext = {},
): DeploymentNextStepsResult {
  const name = context.tokenName ? `"${context.tokenName}"` : 'Your token'

  switch (outcome) {
    case 'success':
      return buildSuccessResult(name, context)

    case 'partial_success':
      return buildPartialSuccessResult(name, context)

    case 'validation_failed':
      return {
        outcome,
        title: 'Configuration needs attention',
        summary: `${name} could not be launched because one or more required fields are incomplete or invalid. Review the highlighted issues and resubmit.`,
        colorClass: 'text-amber-400',
        nextSteps: [
          STEP_FIX_VALIDATION,
          STEP_CONTACT_SUPPORT,
        ],
      }

    case 'compliance_hold':
      return {
        outcome,
        title: 'Compliance hold',
        summary: `${name} is on hold because outstanding compliance requirements must be completed before deployment. This protects you from regulatory risk.`,
        colorClass: 'text-amber-400',
        nextSteps: [
          STEP_COMPLETE_COMPLIANCE,
          STEP_RETRY_LAUNCH,
          STEP_CONTACT_SUPPORT,
        ],
      }

    case 'network_error':
      return {
        outcome,
        title: 'Network connectivity issue',
        summary: `The deployment request could not reach the network. This is usually a temporary issue. Wait a moment and try again.`,
        colorClass: 'text-red-400',
        nextSteps: [
          STEP_CHECK_NETWORK,
          STEP_RETRY_LAUNCH,
          STEP_CONTACT_SUPPORT,
        ],
      }

    case 'rejected':
      return {
        outcome,
        title: 'Deployment rejected',
        summary: `${name} was rejected by the network. This typically means a parameter (supply, symbol, or standard) is not accepted by the target network's rules.`,
        colorClass: 'text-red-400',
        nextSteps: [
          STEP_FIX_VALIDATION,
          STEP_RETRY_LAUNCH,
          STEP_CONTACT_SUPPORT,
        ],
      }

    case 'timeout':
      return {
        outcome,
        title: 'Deployment timed out',
        summary: `The network did not confirm the deployment in the expected time. The transaction may still complete — check your dashboard before retrying.`,
        colorClass: 'text-amber-400',
        nextSteps: [
          STEP_VIEW_DASHBOARD,
          STEP_RETRY_LAUNCH,
          STEP_CONTACT_SUPPORT,
        ],
      }

    case 'unknown':
    default:
      return {
        outcome: 'unknown',
        title: 'Something went wrong',
        summary: `An unexpected error occurred during deployment. Your configuration has been saved. Try again or contact support if the issue persists.`,
        colorClass: 'text-red-400',
        nextSteps: [
          STEP_RETRY_LAUNCH,
          STEP_CONTACT_SUPPORT,
        ],
      }
  }
}

function buildSuccessResult(
  name: string,
  context: DeploymentContext,
): DeploymentNextStepsResult {
  // ARC1400 is the compliant securities standard — always treated as RWA-class
  // regardless of the explicit `isRWA` flag, since it requires the same steps.
  const isRwaClass = context.isRWA || context.tokenStandard === 'ARC1400'
  const steps: NextStep[] = [STEP_VIEW_DASHBOARD, STEP_VIEW_COCKPIT]

  // RWA tokens need compliance and attestation more urgently
  if (isRwaClass) {
    steps.splice(1, 0, STEP_COMPLETE_COMPLIANCE)
    steps.push(STEP_ADD_ATTESTATION)
    steps.push(STEP_MANAGE_WHITELIST)
  } else {
    if (!context.complianceComplete) {
      steps.push(STEP_COMPLETE_COMPLIANCE)
    }
    steps.push(STEP_ADD_ATTESTATION)
    steps.push(STEP_EXPLORE_LAUNCHPAD)
  }

  return {
    outcome: 'success',
    title: 'Token deployed successfully',
    summary: `${name} is now live on ${context.network ?? 'the network'}. Your token is ready for distribution, compliance configuration, and lifecycle management.`,
    colorClass: 'text-green-400',
    nextSteps: steps,
  }
}

function buildPartialSuccessResult(
  name: string,
  context: DeploymentContext,
): DeploymentNextStepsResult {
  // ARC1400 is always treated as RWA-class — same as buildSuccessResult.
  const isRwaClass = context.isRWA || context.tokenStandard === 'ARC1400'
  return {
    outcome: 'partial_success',
    title: 'Token deployed — some steps pending',
    summary: `${name} was deployed but one or more optional post-deployment steps (such as indexing or metadata confirmation) are still in progress. Your token is functional and the pending steps will complete automatically.`,
    colorClass: 'text-blue-400',
    nextSteps: [
      STEP_VIEW_DASHBOARD,
      ...(isRwaClass ? [STEP_COMPLETE_COMPLIANCE, STEP_ADD_ATTESTATION] : [STEP_ADD_ATTESTATION]),
      STEP_VIEW_COCKPIT,
    ],
  }
}

// ─── Classification helper ────────────────────────────────────────────────────

/**
 * Maps a raw error to a DeploymentOutcome for use with getDeploymentNextSteps.
 */
export function classifyDeploymentError(error: unknown): DeploymentOutcome {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required field')) {
    return 'validation_failed'
  }
  if (msg.includes('compliance') || msg.includes('kyc') || msg.includes('hold')) {
    return 'compliance_hold'
  }
  if (
    msg.includes('network') || msg.includes('offline') ||
    msg.includes('fetch') || msg.includes('connection')
  ) {
    return 'network_error'
  }
  if (msg.includes('reject') || msg.includes('refused') || msg.includes('invalid parameter')) {
    return 'rejected'
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'timeout'
  }
  return 'unknown'
}
