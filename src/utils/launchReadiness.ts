/**
 * Launch Readiness Utility
 *
 * Provides utilities for computing an issuer's readiness to launch a token.
 * All labels and descriptions use plain business language — no blockchain jargon.
 */

/**
 * Readiness status for an individual setup step or the overall issuer launch readiness.
 * - `not_started`: The step has not been started yet.
 * - `in_progress`: The step has been started but is not yet complete.
 * - `needs_attention`: The step has an issue requiring the issuer to take action.
 * - `ready`: The step is complete and verified.
 * - `blocked`: The step cannot proceed due to a dependency or system issue.
 */
export type ReadinessStatus = 'not_started' | 'in_progress' | 'needs_attention' | 'ready' | 'blocked'

export interface ReadinessItem {
  id: string
  label: string
  description: string
  status: ReadinessStatus
  estimatedMinutes?: number
  actionLabel?: string
  actionRoute?: string
  isRequired: boolean
  order: number
}

export interface IssuerReadinessReport {
  items: ReadinessItem[]
  overallStatus: ReadinessStatus
  completedCount: number
  totalCount: number
  requiredCompletedCount: number
  requiredTotalCount: number
  readinessScore: number
  estimatedMinutesRemaining: number
  canProceedToLaunch: boolean
  nextActionItem: ReadinessItem | null
}

/**
 * Priority order for resolving the overall status and finding the next action item.
 * Items earlier in the array have higher priority, meaning a single `blocked` required
 * item overrides everything, then `needs_attention`, and so on. `ready` items are at
 * the end because completed steps need no further action.
 */
const STATUS_ORDER: ReadinessStatus[] = ['blocked', 'needs_attention', 'in_progress', 'not_started', 'ready']

/**
 * Compute overall readiness report from a list of readiness items.
 */
export function computeOverallReadiness(items: ReadinessItem[]): IssuerReadinessReport {
  if (items.length === 0) {
    return {
      items: [],
      overallStatus: 'not_started',
      completedCount: 0,
      totalCount: 0,
      requiredCompletedCount: 0,
      requiredTotalCount: 0,
      readinessScore: 0,
      estimatedMinutesRemaining: 0,
      canProceedToLaunch: false,
      nextActionItem: null,
    }
  }

  const requiredItems = items.filter((i) => i.isRequired)
  const completedItems = items.filter((i) => i.status === 'ready')
  const requiredCompleted = requiredItems.filter((i) => i.status === 'ready')

  const hasBlockedRequired = requiredItems.some((i) => i.status === 'blocked')
  const hasAnyBlocked = items.some((i) => i.status === 'blocked')
  const hasNeedsAttention = items.some((i) => i.status === 'needs_attention')
  const hasInProgress = items.some((i) => i.status === 'in_progress')
  const allReady = items.every((i) => i.status === 'ready')
  const allRequiredReady = requiredItems.every((i) => i.status === 'ready')

  let overallStatus: ReadinessStatus
  if (hasAnyBlocked) {
    overallStatus = 'blocked'
  } else if (hasNeedsAttention) {
    overallStatus = 'needs_attention'
  } else if (hasInProgress) {
    overallStatus = 'in_progress'
  } else if (allReady) {
    overallStatus = 'ready'
  } else {
    overallStatus = 'not_started'
  }

  const readinessScore = items.length > 0 ? Math.round((completedItems.length / items.length) * 100) : 0

  const estimatedMinutesRemaining = items
    .filter((i) => i.status !== 'ready')
    .reduce((sum, i) => sum + (i.estimatedMinutes ?? 0), 0)

  const canProceedToLaunch = allRequiredReady && !hasBlockedRequired

  // Next action item: first non-ready item in order, prioritizing blocked/needs_attention
  const sortedByPriority = [...items]
    .filter((i) => i.status !== 'ready')
    .sort((a, b) => {
      const aPriority = STATUS_ORDER.indexOf(a.status)
      const bPriority = STATUS_ORDER.indexOf(b.status)
      if (aPriority !== bPriority) return aPriority - bPriority
      return a.order - b.order
    })

  const nextActionItem = sortedByPriority.length > 0 ? sortedByPriority[0] : null

  return {
    items,
    overallStatus,
    completedCount: completedItems.length,
    totalCount: items.length,
    requiredCompletedCount: requiredCompleted.length,
    requiredTotalCount: requiredItems.length,
    readinessScore,
    estimatedMinutesRemaining,
    canProceedToLaunch,
    nextActionItem,
  }
}

/**
 * Get the plain-language label for a readiness status.
 */
export function getReadinessStatusLabel(status: ReadinessStatus): string {
  const labels: Record<ReadinessStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    needs_attention: 'Needs Your Attention',
    ready: 'Complete',
    blocked: 'Action Required',
  }
  return labels[status]
}

/**
 * Get the plain-language description for a readiness status.
 */
export function getReadinessStatusDescription(status: ReadinessStatus): string {
  const descriptions: Record<ReadinessStatus, string> = {
    not_started: "You haven't started this step yet. Complete it to move your token launch forward.",
    in_progress: "You've begun this step. Finish it to keep your launch on track.",
    needs_attention: 'This step needs an update or correction before you can proceed.',
    ready: "This step is complete. No further action needed unless circumstances change.",
    blocked: 'This step cannot be completed until another required action is finished first.',
  }
  return descriptions[status]
}

/**
 * Get the Tailwind CSS color class for a readiness status.
 */
export function getReadinessStatusColor(status: ReadinessStatus): string {
  const colors: Record<ReadinessStatus, string> = {
    not_started: 'text-gray-400',
    in_progress: 'text-blue-400',
    needs_attention: 'text-amber-400',
    ready: 'text-green-400',
    blocked: 'text-red-400',
  }
  return colors[status]
}

/**
 * Build the default readiness checklist for a new issuer.
 * Returns items in the recommended completion order.
 */
export function buildDefaultReadinessItems(): ReadinessItem[] {
  return [
    {
      id: 'organization-profile',
      label: 'Organization Profile',
      description: 'Provide your company name, legal entity type, and primary contact details.',
      status: 'not_started',
      estimatedMinutes: 15,
      actionLabel: 'Set Up Profile',
      actionRoute: '/settings/organization',
      isRequired: true,
      order: 1,
    },
    {
      id: 'legal-documentation',
      label: 'Legal Documentation',
      description: 'Upload your company registration certificate and any required legal agreements.',
      status: 'not_started',
      estimatedMinutes: 30,
      actionLabel: 'Upload Documents',
      actionRoute: '/settings/documents',
      isRequired: true,
      order: 2,
    },
    {
      id: 'identity-verification',
      label: 'Identity Verification',
      description: 'Verify your identity as authorized signatory using a government-issued ID.',
      status: 'not_started',
      estimatedMinutes: 20,
      actionLabel: 'Verify Identity',
      actionRoute: '/settings/verification',
      isRequired: true,
      order: 3,
    },
    {
      id: 'token-type-selection',
      label: 'Token Type Selection',
      description: 'Choose the type of token that best represents your financial instrument.',
      status: 'not_started',
      estimatedMinutes: 5,
      actionLabel: 'Choose Token Type',
      actionRoute: '/launch/guided',
      isRequired: true,
      order: 4,
    },
    {
      id: 'token-configuration',
      label: 'Token Configuration',
      description: 'Set your token name, supply, and ownership rules.',
      status: 'not_started',
      estimatedMinutes: 10,
      actionLabel: 'Configure Token',
      actionRoute: '/launch/guided',
      isRequired: true,
      order: 5,
    },
    {
      id: 'compliance-requirements',
      label: 'Compliance Requirements',
      description: 'Complete the regulatory checklist applicable to your token and jurisdiction.',
      status: 'not_started',
      estimatedMinutes: 25,
      actionLabel: 'Complete Compliance',
      actionRoute: '/compliance',
      isRequired: true,
      order: 6,
    },
    {
      id: 'investor-whitelist',
      label: 'Approved Investor List',
      description:
        'Add the investors who are authorized to hold your token. You can add more after launch.',
      status: 'not_started',
      estimatedMinutes: 10,
      actionLabel: 'Manage Investors',
      actionRoute: '/launch/guided',
      isRequired: false,
      order: 7,
    },
    {
      id: 'terms-disclosure-review',
      label: 'Terms and Disclosure Review',
      description:
        'Review and confirm the terms of your token issuance and required investor disclosures.',
      status: 'not_started',
      estimatedMinutes: 5,
      actionLabel: 'Review Terms',
      actionRoute: '/launch/guided',
      isRequired: true,
      order: 8,
    },
  ]
}
