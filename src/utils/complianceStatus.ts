import type { UserComplianceStatus, AMLScreeningVerdict } from '../types/compliance'

/**
 * Compliance Status Display Metadata
 */
export interface ComplianceStatusMetadata {
  label: string
  color: 'gray' | 'blue' | 'yellow' | 'red' | 'green' | 'orange'
  icon: string // Heroicon name
  description: string
  canRetry: boolean
  requiresAction: boolean
}

/**
 * Map user compliance status to display metadata
 */
export function getComplianceStatusMetadata(
  status: UserComplianceStatus
): ComplianceStatusMetadata {
  const metadata: Record<UserComplianceStatus, ComplianceStatusMetadata> = {
    not_started: {
      label: 'Not Started',
      color: 'gray',
      icon: 'ClockIcon',
      description: 'Compliance verification has not been started',
      canRetry: false,
      requiresAction: true,
    },
    pending_documents: {
      label: 'Documents Pending',
      color: 'blue',
      icon: 'DocumentArrowUpIcon',
      description: 'Awaiting required document uploads',
      canRetry: false,
      requiresAction: true,
    },
    pending_review: {
      label: 'Under Review',
      color: 'yellow',
      icon: 'ClockIcon',
      description: 'Documents submitted and under compliance review',
      canRetry: false,
      requiresAction: false,
    },
    approved: {
      label: 'Approved',
      color: 'green',
      icon: 'CheckCircleIcon',
      description: 'Compliance verification approved',
      canRetry: false,
      requiresAction: false,
    },
    rejected: {
      label: 'Rejected',
      color: 'red',
      icon: 'XCircleIcon',
      description: 'Compliance verification rejected - remediation required',
      canRetry: true,
      requiresAction: true,
    },
    escalated: {
      label: 'Escalated',
      color: 'orange',
      icon: 'ExclamationTriangleIcon',
      description: 'Case escalated for manual compliance review',
      canRetry: false,
      requiresAction: false,
    },
    blocked_by_aml: {
      label: 'AML Block',
      color: 'red',
      icon: 'ShieldExclamationIcon',
      description: 'Blocked due to AML screening findings',
      canRetry: false,
      requiresAction: true,
    },
    expired: {
      label: 'Expired',
      color: 'orange',
      icon: 'ClockIcon',
      description: 'Compliance approval expired - re-verification required',
      canRetry: true,
      requiresAction: true,
    },
  }

  return metadata[status]
}

/**
 * AML Screening Verdict Display Metadata
 */
export interface AMLVerdictMetadata {
  label: string
  color: 'gray' | 'blue' | 'yellow' | 'red' | 'green' | 'orange'
  icon: string
  description: string
  isBlocking: boolean
  requiresAction: boolean
}

/**
 * Map AML screening verdict to display metadata
 */
export function getAMLVerdictMetadata(
  verdict: AMLScreeningVerdict
): AMLVerdictMetadata {
  const metadata: Record<AMLScreeningVerdict, AMLVerdictMetadata> = {
    not_started: {
      label: 'Not Started',
      color: 'gray',
      icon: 'ClockIcon',
      description: 'AML screening has not been initiated',
      isBlocking: false,
      requiresAction: false,
    },
    in_progress: {
      label: 'In Progress',
      color: 'blue',
      icon: 'ArrowPathIcon',
      description: 'AML screening is currently in progress',
      isBlocking: false,
      requiresAction: false,
    },
    clear: {
      label: 'Clear',
      color: 'green',
      icon: 'CheckCircleIcon',
      description: 'No sanctions matches found - cleared',
      isBlocking: false,
      requiresAction: false,
    },
    potential_match: {
      label: 'Potential Match',
      color: 'yellow',
      icon: 'ExclamationTriangleIcon',
      description: 'Possible sanctions match detected - under review',
      isBlocking: true,
      requiresAction: false,
    },
    confirmed_match: {
      label: 'Confirmed Match',
      color: 'red',
      icon: 'ShieldExclamationIcon',
      description: 'Confirmed sanctions list match - blocked',
      isBlocking: true,
      requiresAction: true,
    },
    error: {
      label: 'Screening Error',
      color: 'orange',
      icon: 'ExclamationCircleIcon',
      description: 'Screening service error - temporary issue',
      isBlocking: true,
      requiresAction: false,
    },
    manual_review: {
      label: 'Manual Review',
      color: 'yellow',
      icon: 'UserIcon',
      description: 'Requires manual compliance officer review',
      isBlocking: true,
      requiresAction: false,
    },
  }

  return metadata[verdict]
}

/**
 * Check if status allows token issuance
 */
export function canIssueTokens(status: UserComplianceStatus): boolean {
  return status === 'approved'
}

/**
 * Get user-friendly message for blocked issuance
 */
export function getBlockedIssuanceMessage(
  status: UserComplianceStatus,
  reasons: string[]
): string {
  const metadata = getComplianceStatusMetadata(status)
  
  const baseMessage = `Token issuance is currently unavailable. Status: ${metadata.label}.`
  
  if (reasons.length > 0) {
    return `${baseMessage} ${reasons.join('. ')}.`
  }
  
  return `${baseMessage} ${metadata.description}.`
}

/**
 * Get next action text for user
 */
export function getNextActionText(status: UserComplianceStatus): string {
  const actions: Record<UserComplianceStatus, string> = {
    not_started: 'Start compliance verification to enable token issuance',
    pending_documents: 'Upload required documents to continue',
    pending_review: 'Your documents are being reviewed. Please wait.',
    approved: 'You can now issue tokens',
    rejected: 'Review rejection reasons and resubmit documents',
    escalated: 'Your case is under manual review. We will contact you shortly.',
    blocked_by_aml: 'Contact support for assistance with AML findings',
    expired: 'Your compliance approval has expired. Please re-verify.',
  }

  return actions[status]
}

/**
 * Normalize backend status to frontend enum
 * Handles unknown statuses gracefully with fallback
 */
export function normalizeComplianceStatus(
  backendStatus: string
): UserComplianceStatus {
  const normalized = backendStatus.toLowerCase().replace(/[- ]/g, '_')
  
  const validStatuses: UserComplianceStatus[] = [
    'not_started',
    'pending_documents',
    'pending_review',
    'approved',
    'rejected',
    'escalated',
    'blocked_by_aml',
    'expired',
  ]

  if (validStatuses.includes(normalized as UserComplianceStatus)) {
    return normalized as UserComplianceStatus
  }

  // Fallback for unknown statuses
  console.warn(`Unknown compliance status: ${backendStatus}, defaulting to 'not_started'`)
  return 'not_started'
}

/**
 * Check if status requires immediate user action
 */
export function requiresUserAction(status: UserComplianceStatus): boolean {
  return ['not_started', 'pending_documents', 'rejected', 'blocked_by_aml', 'expired'].includes(status)
}

/**
 * Get estimated time for status completion (in days)
 */
export function getEstimatedCompletionTime(status: UserComplianceStatus): string {
  const estimates: Record<UserComplianceStatus, string> = {
    not_started: 'Start now',
    pending_documents: 'Upload today',
    pending_review: '1-3 business days',
    approved: 'Complete',
    rejected: 'Depends on remediation',
    escalated: '3-5 business days',
    blocked_by_aml: 'Requires manual intervention',
    expired: 'Re-verify within 1-2 days',
  }

  return estimates[status]
}
