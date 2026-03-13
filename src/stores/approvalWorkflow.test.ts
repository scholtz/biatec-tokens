/**
 * Unit Tests: approvalWorkflow Store
 *
 * Tests initial state, computed properties (awaitingMyReview, assignedToTeam,
 * readyForApproval, recentlyCompleted, totalPendingActions) and all actions
 * (initialize, updateItemState, assignItem, addNote).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useApprovalWorkflowStore } from './approvalWorkflow'
import { useAuthStore } from './auth'
import type { WorkItem } from '../types/approvalWorkflow'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: `item-${Math.random().toString(36).slice(2, 7)}`,
  title: 'Test Work Item',
  description: 'Description',
  category: 'compliance_review',
  priority: 'medium',
  state: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  evidenceLinks: [],
  contextPath: '/compliance/setup',
  businessConsequence: 'Business consequence',
  notes: [],
  ...overrides,
})

const recentDate = () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
const oldDate = () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe('approvalWorkflow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Initial state ──────────────────────────────────────────────────────

  it('starts with empty workItems', () => {
    const store = useApprovalWorkflowStore()
    expect(store.workItems).toHaveLength(0)
  })

  it('starts with loading=false', () => {
    const store = useApprovalWorkflowStore()
    expect(store.loading).toBe(false)
  })

  it('starts with error=null', () => {
    const store = useApprovalWorkflowStore()
    expect(store.error).toBeNull()
  })

  // ── initialize / fetchWorkItems ─────────────────────────────────────────

  it('initialize() populates workItems with mock data', async () => {
    const store = useApprovalWorkflowStore()
    vi.runAllTimers()
    const p = store.initialize()
    vi.runAllTimers()
    await p
    expect(store.workItems.length).toBeGreaterThanOrEqual(6)
  })

  it('fetchWorkItems() sets loading to false after completion', async () => {
    const store = useApprovalWorkflowStore()
    vi.runAllTimers()
    const p = store.fetchWorkItems()
    vi.runAllTimers()
    await p
    expect(store.loading).toBe(false)
  })

  it('fetchWorkItems() clears error on success', async () => {
    const store = useApprovalWorkflowStore()
    store.error = 'previous error'
    vi.runAllTimers()
    const p = store.fetchWorkItems()
    vi.runAllTimers()
    await p
    expect(store.error).toBeNull()
  })

  it('fetchWorkItems() populates items with valid structure', async () => {
    const store = useApprovalWorkflowStore()
    vi.runAllTimers()
    const p = store.fetchWorkItems()
    vi.runAllTimers()
    await p
    for (const item of store.workItems) {
      expect(item.id).toBeTruthy()
      expect(item.title).toBeTruthy()
      expect(item.state).toBeTruthy()
      expect(Array.isArray(item.evidenceLinks)).toBe(true)
      expect(Array.isArray(item.notes)).toBe(true)
    }
  })

  // ── awaitingMyReview ───────────────────────────────────────────────────

  it('awaitingMyReview returns items where reviewer matches current user email AND state is pending/in_review', () => {
    const store = useApprovalWorkflowStore()
    const authStore = useAuthStore()
    authStore.user = { address: 'TEST', email: 'me@example.com' }
    authStore.isConnected = true

    store.workItems = [
      makeItem({ state: 'pending', reviewer: 'me@example.com' }),
      makeItem({ state: 'in_review', reviewer: 'me@example.com' }),
      makeItem({ state: 'approved', reviewer: 'me@example.com' }),
      makeItem({ state: 'pending', reviewer: 'other@example.com' }),
    ]

    expect(store.awaitingMyReview).toHaveLength(2)
  })

  it('awaitingMyReview returns empty array when user has no email', () => {
    const store = useApprovalWorkflowStore()
    const authStore = useAuthStore()
    authStore.user = null

    store.workItems = [makeItem({ state: 'pending', reviewer: 'me@example.com' })]
    expect(store.awaitingMyReview).toHaveLength(0)
  })

  it('awaitingMyReview excludes needs_changes state', () => {
    const store = useApprovalWorkflowStore()
    const authStore = useAuthStore()
    authStore.user = { address: 'TEST', email: 'me@example.com' }
    authStore.isConnected = true

    store.workItems = [makeItem({ state: 'needs_changes', reviewer: 'me@example.com' })]
    expect(store.awaitingMyReview).toHaveLength(0)
  })

  // ── assignedToTeam ─────────────────────────────────────────────────────

  it('assignedToTeam includes items with any assignee that are not completed/approved', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [
      makeItem({ state: 'pending', assignee: 'a@example.com' }),
      makeItem({ state: 'in_review', assignee: 'b@example.com' }),
      makeItem({ state: 'needs_changes', assignee: 'c@example.com' }),
      makeItem({ state: 'approved', assignee: 'd@example.com' }),
      makeItem({ state: 'completed', assignee: 'e@example.com' }),
    ]
    expect(store.assignedToTeam).toHaveLength(3)
  })

  it('assignedToTeam excludes items without an assignee', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [makeItem({ state: 'pending', assignee: undefined })]
    expect(store.assignedToTeam).toHaveLength(0)
  })

  // ── readyForApproval ───────────────────────────────────────────────────

  it('readyForApproval returns only in_review items', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [
      makeItem({ state: 'in_review' }),
      makeItem({ state: 'in_review' }),
      makeItem({ state: 'pending' }),
      makeItem({ state: 'approved' }),
    ]
    expect(store.readyForApproval).toHaveLength(2)
  })

  it('readyForApproval returns empty when no in_review items', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [makeItem({ state: 'pending' }), makeItem({ state: 'approved' })]
    expect(store.readyForApproval).toHaveLength(0)
  })

  // ── recentlyCompleted ──────────────────────────────────────────────────

  it('recentlyCompleted includes approved items updated within last 7 days', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [makeItem({ state: 'approved', updatedAt: recentDate() })]
    expect(store.recentlyCompleted).toHaveLength(1)
  })

  it('recentlyCompleted includes completed items updated within last 7 days', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [makeItem({ state: 'completed', updatedAt: recentDate() })]
    expect(store.recentlyCompleted).toHaveLength(1)
  })

  it('recentlyCompleted excludes approved items updated more than 7 days ago', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [makeItem({ state: 'approved', updatedAt: oldDate() })]
    expect(store.recentlyCompleted).toHaveLength(0)
  })

  it('recentlyCompleted excludes pending items', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [makeItem({ state: 'pending', updatedAt: recentDate() })]
    expect(store.recentlyCompleted).toHaveLength(0)
  })

  // ── totalPendingActions ────────────────────────────────────────────────

  it('totalPendingActions counts pending + in_review + needs_changes', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [
      makeItem({ state: 'pending' }),
      makeItem({ state: 'in_review' }),
      makeItem({ state: 'needs_changes' }),
      makeItem({ state: 'approved' }),
      makeItem({ state: 'blocked' }),
      makeItem({ state: 'completed' }),
    ]
    expect(store.totalPendingActions).toBe(3)
  })

  it('totalPendingActions is 0 when all items are terminal', () => {
    const store = useApprovalWorkflowStore()
    store.workItems = [
      makeItem({ state: 'approved' }),
      makeItem({ state: 'completed' }),
    ]
    expect(store.totalPendingActions).toBe(0)
  })

  it('totalPendingActions is 0 when workItems is empty', () => {
    const store = useApprovalWorkflowStore()
    expect(store.totalPendingActions).toBe(0)
  })

  // ── updateItemState ────────────────────────────────────────────────────

  it('updateItemState transitions the item to the new state', () => {
    const store = useApprovalWorkflowStore()
    const item = makeItem({ id: 'fixed-001', state: 'in_review' })
    store.workItems = [item]
    store.updateItemState('fixed-001', 'approved')
    expect(store.workItems[0].state).toBe('approved')
  })

  it('updateItemState updates updatedAt timestamp', () => {
    const store = useApprovalWorkflowStore()
    const before = new Date(Date.now() - 1000).toISOString()
    const item = makeItem({ id: 'fixed-002', state: 'pending', updatedAt: before })
    store.workItems = [item]
    store.updateItemState('fixed-002', 'in_review')
    expect(store.workItems[0].updatedAt > before).toBe(true)
  })

  it('updateItemState does nothing for unknown itemId', () => {
    const store = useApprovalWorkflowStore()
    const item = makeItem({ id: 'exists', state: 'pending' })
    store.workItems = [item]
    store.updateItemState('does-not-exist', 'approved')
    expect(store.workItems[0].state).toBe('pending')
  })

  // ── assignItem ─────────────────────────────────────────────────────────

  it('assignItem sets the assignee for the specified item', () => {
    const store = useApprovalWorkflowStore()
    const item = makeItem({ id: 'assign-001' })
    store.workItems = [item]
    store.assignItem('assign-001', 'new@example.com')
    expect(store.workItems[0].assignee).toBe('new@example.com')
  })

  it('assignItem updates updatedAt timestamp', () => {
    const store = useApprovalWorkflowStore()
    const before = new Date(Date.now() - 1000).toISOString()
    const item = makeItem({ id: 'assign-002', updatedAt: before })
    store.workItems = [item]
    store.assignItem('assign-002', 'a@b.com')
    expect(store.workItems[0].updatedAt > before).toBe(true)
  })

  it('assignItem does nothing for unknown itemId', () => {
    const store = useApprovalWorkflowStore()
    const item = makeItem({ id: 'assign-003', assignee: 'original@example.com' })
    store.workItems = [item]
    store.assignItem('unknown', 'new@example.com')
    expect(store.workItems[0].assignee).toBe('original@example.com')
  })

  // ── addNote ────────────────────────────────────────────────────────────

  it('addNote appends a note to the item notes array', () => {
    const store = useApprovalWorkflowStore()
    const item = makeItem({ id: 'note-001', notes: [] })
    store.workItems = [item]
    store.addNote('note-001', 'First note')
    expect(store.workItems[0].notes).toContain('First note')
  })

  it('addNote appends multiple notes in order', () => {
    const store = useApprovalWorkflowStore()
    const item = makeItem({ id: 'note-002', notes: [] })
    store.workItems = [item]
    store.addNote('note-002', 'Note A')
    store.addNote('note-002', 'Note B')
    expect(store.workItems[0].notes[0]).toBe('Note A')
    expect(store.workItems[0].notes[1]).toBe('Note B')
  })

  it('addNote does nothing for unknown itemId', () => {
    const store = useApprovalWorkflowStore()
    const item = makeItem({ id: 'note-003', notes: [] })
    store.workItems = [item]
    store.addNote('unknown', 'should not appear')
    expect(store.workItems[0].notes).toHaveLength(0)
  })

  // ── Empty state ────────────────────────────────────────────────────────

  it('all computed properties return empty/zero when workItems is empty', () => {
    const store = useApprovalWorkflowStore()
    const authStore = useAuthStore()
    authStore.user = { address: 'X', email: 'me@example.com' }
    authStore.isConnected = true

    expect(store.awaitingMyReview).toHaveLength(0)
    expect(store.assignedToTeam).toHaveLength(0)
    expect(store.readyForApproval).toHaveLength(0)
    expect(store.recentlyCompleted).toHaveLength(0)
    expect(store.totalPendingActions).toBe(0)
  })
})
