/**
 * Approval Workflow Store
 *
 * Manages the enterprise team workspace approval queue.  Work items are
 * loaded from a mock adapter so the store can be wired to a real backend
 * without changing the component layer.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { WorkItem, ApprovalState } from '../types/approvalWorkflow'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const sevenDaysAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

const daysFromNow = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    id: 'wi-001',
    title: 'Whitelist Policy Review — APAC Institutional',
    description:
      'Review and approve the updated whitelist policy for APAC institutional investors.  Policy includes jurisdiction exclusions for high-risk regions and enhanced KYC tiers.',
    category: 'whitelist_policy',
    priority: 'critical',
    state: 'in_review',
    assignee: 'compliance@biatec.io',
    reviewer: 'test@biatec.io',
    approver: 'owner@biatec.io',
    dueDate: daysFromNow(2),
    createdAt: sevenDaysAgo(),
    updatedAt: new Date().toISOString(),
    evidenceLinks: ['/docs/whitelist-policy-v3.pdf'],
    contextPath: '/compliance/policy',
    businessConsequence:
      'Without approval, APAC investors cannot be onboarded, blocking the Q3 launch milestone.',
    notes: ['Initial policy drafted and uploaded.', 'Legal sign-off received on jurisdiction list.'],
  },
  {
    id: 'wi-002',
    title: 'Token Issuance Approval — Series A Utility Token',
    description:
      'Final approval gate for the Series A utility token before backend deployment is triggered.  All compliance checks must be green.',
    category: 'issuance_approval',
    priority: 'critical',
    state: 'in_review',
    assignee: 'finance@biatec.io',
    reviewer: 'test@biatec.io',
    approver: 'owner@biatec.io',
    dueDate: daysFromNow(3),
    createdAt: sevenDaysAgo(),
    updatedAt: new Date().toISOString(),
    evidenceLinks: [],
    contextPath: '/launch/guided',
    businessConsequence:
      'Deployment is blocked until this approval is granted.  Each day of delay costs an estimated €4,000 in opportunity cost.',
    notes: [],
  },
  {
    id: 'wi-003',
    title: 'Launch Readiness Checklist Sign-Off',
    description:
      'Confirm that all launch prerequisites are complete: KYC provider configured, whitelist active, legal disclaimer accepted, and backend deployment contract validated.',
    category: 'launch_readiness',
    priority: 'high',
    state: 'pending',
    assignee: 'ops@biatec.io',
    reviewer: 'test@biatec.io',
    dueDate: daysFromNow(5),
    createdAt: sevenDaysAgo(),
    updatedAt: new Date().toISOString(),
    evidenceLinks: [],
    contextPath: '/launch/workspace',
    businessConsequence:
      'Incomplete readiness blocks investor onboarding and may create regulatory exposure.',
    notes: ['KYC provider contract signed.'],
  },
  {
    id: 'wi-004',
    title: 'Annual Compliance Review — MICA Article 68',
    description:
      'Conduct annual review of MICA Article 68 obligations.  Document evidence of ongoing compliance with white paper disclosure requirements.',
    category: 'compliance_review',
    priority: 'high',
    state: 'pending',
    assignee: 'legal@biatec.io',
    reviewer: 'test@biatec.io',
    dueDate: daysFromNow(14),
    createdAt: sevenDaysAgo(),
    updatedAt: new Date().toISOString(),
    evidenceLinks: [],
    contextPath: '/compliance/setup',
    businessConsequence:
      'Non-compliance with MICA Article 68 can result in regulatory sanctions and licence suspension.',
    notes: [],
  },
  {
    id: 'wi-005',
    title: 'Team Access Review — Q3 Quarterly Audit',
    description:
      'Quarterly access review to verify that all active team members have appropriate roles and that no former employees retain access.',
    category: 'team_access',
    priority: 'medium',
    state: 'needs_changes',
    assignee: 'admin@biatec.io',
    reviewer: 'test@biatec.io',
    dueDate: daysFromNow(7),
    createdAt: sevenDaysAgo(),
    updatedAt: new Date().toISOString(),
    evidenceLinks: [],
    contextPath: '/compliance/setup',
    businessConsequence:
      'Excess access privileges increase the blast radius of a potential security incident.',
    notes: ['Found 2 former contractors still listed as active.'],
  },
  {
    id: 'wi-006',
    title: 'Whitelist Jurisdiction Expansion — EU Retail',
    description:
      'Add EU retail investor tier to the whitelist policy.  Requires separate KYC flow and minimum investment limits per MiCA retail provisions.',
    category: 'whitelist_policy',
    priority: 'medium',
    state: 'blocked',
    assignee: 'compliance@biatec.io',
    reviewer: 'owner@biatec.io',
    dueDate: daysFromNow(21),
    createdAt: sevenDaysAgo(),
    updatedAt: new Date().toISOString(),
    evidenceLinks: [],
    contextPath: '/compliance/policy',
    businessConsequence:
      'EU retail investors cannot participate until this is unblocked, limiting addressable market.',
    notes: ['Blocked pending legal opinion on retail threshold amounts.'],
  },
  {
    id: 'wi-007',
    title: 'Compliance Review Completed — Initial Launch Package',
    description:
      'Full compliance review of the initial token launch package including white paper, KYC setup, and whitelist policy.',
    category: 'compliance_review',
    priority: 'low',
    state: 'approved',
    assignee: 'compliance@biatec.io',
    reviewer: 'owner@biatec.io',
    approver: 'owner@biatec.io',
    createdAt: sevenDaysAgo(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    evidenceLinks: ['/docs/launch-compliance-package.pdf'],
    contextPath: '/compliance/setup',
    businessConsequence: 'Resolved — initial launch compliance verified.',
    notes: ['All checks passed.  Package archived for audit purposes.'],
  },
  {
    id: 'wi-008',
    title: 'Issuance Approval — Seed Round Security Token',
    description:
      'Approval for the seed round security token deployment.  All investor accreditation documents verified.',
    category: 'issuance_approval',
    priority: 'low',
    state: 'completed',
    assignee: 'finance@biatec.io',
    reviewer: 'owner@biatec.io',
    approver: 'owner@biatec.io',
    createdAt: sevenDaysAgo(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    evidenceLinks: [],
    contextPath: '/launch/guided',
    businessConsequence: 'Resolved — seed round token live on Algorand mainnet.',
    notes: ['Deployed successfully.  Asset ID recorded in audit log.'],
  },
]

// ---------------------------------------------------------------------------
// Store definition
// ---------------------------------------------------------------------------

export const useApprovalWorkflowStore = defineStore('approvalWorkflow', () => {
  const workItems = ref<WorkItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Items where the current user is the reviewer AND state requires review action. */
  const awaitingMyReview = computed<WorkItem[]>(() => {
    const authStore = useAuthStore()
    const email = authStore.user?.email
    if (!email) return []
    return workItems.value.filter(
      (item) =>
        item.reviewer === email &&
        (item.state === 'pending' || item.state === 'in_review'),
    )
  })

  /** Items assigned to any team member that are not yet finished. */
  const assignedToTeam = computed<WorkItem[]>(() =>
    workItems.value.filter(
      (item) =>
        item.assignee !== undefined &&
        item.state !== 'completed' &&
        item.state !== 'approved',
    ),
  )

  /** Items that are actively in-review and ready for a final approval decision. */
  const readyForApproval = computed<WorkItem[]>(() =>
    workItems.value.filter((item) => item.state === 'in_review'),
  )

  /** Items that reached a terminal approved/completed state within the last 7 days. */
  const recentlyCompleted = computed<WorkItem[]>(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return workItems.value.filter(
      (item) =>
        (item.state === 'approved' || item.state === 'completed') &&
        new Date(item.updatedAt).getTime() >= cutoff,
    )
  })

  /** Total count of work items that require some action (not terminal / not blocked). */
  const totalPendingActions = computed<number>(() =>
    workItems.value.filter(
      (item) =>
        item.state === 'pending' ||
        item.state === 'in_review' ||
        item.state === 'needs_changes',
    ).length,
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Seed the store with mock work items (called on view mount). */
  async function initialize() {
    await fetchWorkItems()
  }

  /** Load work items via mock adapter (swap for real HTTP call when backend ready). */
  async function fetchWorkItems() {
    loading.value = true
    error.value = null
    try {
      // Simulate async fetch latency
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
      workItems.value = [...MOCK_WORK_ITEMS]
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load work items.'
    } finally {
      loading.value = false
    }
  }

  /** Transition a work item to a new approval state. */
  function updateItemState(itemId: string, newState: ApprovalState) {
    const item = workItems.value.find((i) => i.id === itemId)
    if (!item) return
    item.state = newState
    item.updatedAt = new Date().toISOString()
  }

  /** Assign (or reassign) a work item to a team member identified by email. */
  function assignItem(itemId: string, assignee: string) {
    const item = workItems.value.find((i) => i.id === itemId)
    if (!item) return
    item.assignee = assignee
    item.updatedAt = new Date().toISOString()
  }

  /** Append a free-text note to a work item's notes array. */
  function addNote(itemId: string, note: string) {
    const item = workItems.value.find((i) => i.id === itemId)
    if (!item) return
    item.notes.push(note)
    item.updatedAt = new Date().toISOString()
  }

  return {
    // state
    workItems,
    loading,
    error,
    // computed
    awaitingMyReview,
    assignedToTeam,
    readyForApproval,
    recentlyCompleted,
    totalPendingActions,
    // actions
    initialize,
    fetchWorkItems,
    updateItemState,
    assignItem,
    addNote,
  }
})
