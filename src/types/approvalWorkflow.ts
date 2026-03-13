/**
 * Approval Workflow Types
 *
 * TypeScript types for the enterprise team workspace and collaborative
 * approval workflow system.
 */

/** Lifecycle states for a work item moving through an approval workflow. */
export type ApprovalState =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'needs_changes'
  | 'blocked'
  | 'completed'

/** Business category of a work item. */
export type WorkItemCategory =
  | 'whitelist_policy'
  | 'launch_readiness'
  | 'compliance_review'
  | 'issuance_approval'
  | 'team_access'

/** Urgency level attached to a work item. */
export type WorkItemPriority = 'critical' | 'high' | 'medium' | 'low'

/** A single piece of work that moves through a review / approval lifecycle. */
export interface WorkItem {
  id: string
  title: string
  description: string
  category: WorkItemCategory
  priority: WorkItemPriority
  state: ApprovalState
  /** Email of the team member responsible for completing the work. */
  assignee?: string
  /** Email of the team member performing the review. */
  reviewer?: string
  /** Email of the final approver (typically owner/admin). */
  approver?: string
  /** ISO 8601 date string for the deadline. */
  dueDate?: string
  /** ISO 8601 datetime string for when the item was created. */
  createdAt: string
  /** ISO 8601 datetime string for when the item was last modified. */
  updatedAt: string
  /** URLs pointing to supporting evidence (documents, screenshots, reports). */
  evidenceLinks: string[]
  /** Relative URL to navigate to for the full detail view of this item. */
  contextPath: string
  /** Plain-language explanation of the business risk if this item is not resolved. */
  businessConsequence: string
  /** Free-text notes appended over time by team members. */
  notes: string[]
}

/** A named collection of work items forming a logical review queue. */
export interface WorkQueue {
  id: string
  label: string
  description: string
  items: WorkItem[]
  emptyMessage: string
}

/** Root state shape for the approvalWorkflow Pinia store. */
export interface ApprovalWorkflowState {
  workItems: WorkItem[]
  loading: boolean
  error: string | null
}
