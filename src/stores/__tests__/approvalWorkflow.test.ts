/**
 * Unit Tests: approvalWorkflow store
 *
 * Tests for the approval workflow Pinia store that powers the Enterprise
 * Team Workspace.
 *
 * Coverage targets:
 *  - initialize / fetchWorkItems populates mock data
 *  - Computed: awaitingMyReview, assignedToTeam, readyForApproval,
 *              recentlyCompleted, totalPendingActions
 *  - Actions:  updateItemState, assignItem, addNote
 *  - Loading / error states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useApprovalWorkflowStore } from '../approvalWorkflow'
import { useAuthStore } from '../auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore() {
  return useApprovalWorkflowStore()
}

function seedUser(email: string) {
  const auth = useAuthStore()
  // @ts-expect-error direct state mutation for tests
  auth.user = { email, address: 'TESTADDRESS', isConnected: true }
  // @ts-expect-error
  auth.isConnected = true
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('approvalWorkflow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── initialize / fetchWorkItems ────────────────────────────────────────────

  describe('initialize', () => {
    it('populates workItems with mock data after initialize()', async () => {
      const store = makeStore()
      expect(store.workItems).toHaveLength(0)
      await store.initialize()
      expect(store.workItems.length).toBeGreaterThan(0)
    })

    it('sets loading to false after initialize()', async () => {
      const store = makeStore()
      await store.initialize()
      expect(store.loading).toBe(false)
    })

    it('clears error after successful initialize()', async () => {
      const store = makeStore()
      // @ts-expect-error test mutation
      store.error = 'previous error'
      await store.initialize()
      expect(store.error).toBeNull()
    })

    it('loads at least 8 mock work items', async () => {
      const store = makeStore()
      await store.initialize()
      expect(store.workItems.length).toBeGreaterThanOrEqual(8)
    })

    it('each work item has required fields', async () => {
      const store = makeStore()
      await store.initialize()
      for (const item of store.workItems) {
        expect(item.id).toBeTruthy()
        expect(item.title).toBeTruthy()
        expect(item.state).toBeTruthy()
        expect(item.category).toBeTruthy()
        expect(item.priority).toBeTruthy()
      }
    })
  })

  // ── awaitingMyReview ───────────────────────────────────────────────────────

  describe('awaitingMyReview', () => {
    it('returns empty array when no user is authenticated', async () => {
      const store = makeStore()
      await store.initialize()
      // auth store user is null by default
      expect(store.awaitingMyReview).toHaveLength(0)
    })

    it('returns items where reviewer matches current user email and state is pending/in_review', async () => {
      const store = makeStore()
      await store.initialize()
      seedUser('test@biatec.io')
      // items wi-001, wi-002, wi-003, wi-004 have reviewer=test@biatec.io and state pending/in_review
      expect(store.awaitingMyReview.length).toBeGreaterThanOrEqual(2)
    })

    it('excludes items where state is approved/completed/blocked/needs_changes', async () => {
      const store = makeStore()
      await store.initialize()
      seedUser('test@biatec.io')
      for (const item of store.awaitingMyReview) {
        expect(['pending', 'in_review']).toContain(item.state)
      }
    })

    it('excludes items where reviewer does not match current user', async () => {
      const store = makeStore()
      await store.initialize()
      seedUser('other@biatec.io')
      for (const item of store.awaitingMyReview) {
        expect(item.reviewer).toBe('other@biatec.io')
      }
    })
  })

  // ── assignedToTeam ─────────────────────────────────────────────────────────

  describe('assignedToTeam', () => {
    it('returns items that have any assignee and are not terminal', async () => {
      const store = makeStore()
      await store.initialize()
      for (const item of store.assignedToTeam) {
        expect(item.assignee).toBeTruthy()
        expect(['approved', 'completed']).not.toContain(item.state)
      }
    })

    it('excludes items without an assignee', async () => {
      const store = makeStore()
      await store.initialize()
      // Manually remove assignee from one item
      store.workItems[0].assignee = undefined
      for (const item of store.assignedToTeam) {
        expect(item.assignee).toBeTruthy()
      }
    })

    it('returns non-empty list with mock data', async () => {
      const store = makeStore()
      await store.initialize()
      expect(store.assignedToTeam.length).toBeGreaterThan(0)
    })
  })

  // ── readyForApproval ───────────────────────────────────────────────────────

  describe('readyForApproval', () => {
    it('returns only items with state in_review', async () => {
      const store = makeStore()
      await store.initialize()
      for (const item of store.readyForApproval) {
        expect(item.state).toBe('in_review')
      }
    })

    it('returns non-empty list with mock data (wi-001 and wi-002 are in_review)', async () => {
      const store = makeStore()
      await store.initialize()
      expect(store.readyForApproval.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── recentlyCompleted ──────────────────────────────────────────────────────

  describe('recentlyCompleted', () => {
    it('returns items with state approved or completed', async () => {
      const store = makeStore()
      await store.initialize()
      for (const item of store.recentlyCompleted) {
        expect(['approved', 'completed']).toContain(item.state)
      }
    })

    it('returns non-empty list with mock data (wi-007 and wi-008 are terminal)', async () => {
      const store = makeStore()
      await store.initialize()
      expect(store.recentlyCompleted.length).toBeGreaterThanOrEqual(2)
    })

    it('excludes items updated more than 7 days ago', async () => {
      const store = makeStore()
      await store.initialize()
      // Push an item with old updatedAt
      store.workItems.push({
        id: 'wi-old',
        title: 'Old item',
        description: 'Very old',
        category: 'compliance_review',
        priority: 'low',
        state: 'approved',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        evidenceLinks: [],
        contextPath: '/compliance/setup',
        businessConsequence: 'none',
        notes: [],
      })
      const ids = store.recentlyCompleted.map((i) => i.id)
      expect(ids).not.toContain('wi-old')
    })
  })

  // ── totalPendingActions ────────────────────────────────────────────────────

  describe('totalPendingActions', () => {
    it('counts items with state pending, in_review, or needs_changes', async () => {
      const store = makeStore()
      await store.initialize()
      const expected = store.workItems.filter((i) =>
        ['pending', 'in_review', 'needs_changes'].includes(i.state),
      ).length
      expect(store.totalPendingActions).toBe(expected)
    })

    it('returns 0 for an empty store', () => {
      const store = makeStore()
      expect(store.totalPendingActions).toBe(0)
    })
  })

  // ── updateItemState ────────────────────────────────────────────────────────

  describe('updateItemState', () => {
    it('changes the state of the target item', async () => {
      const store = makeStore()
      await store.initialize()
      store.updateItemState('wi-001', 'approved')
      const item = store.workItems.find((i) => i.id === 'wi-001')
      expect(item?.state).toBe('approved')
    })

    it('updates updatedAt timestamp', async () => {
      const store = makeStore()
      await store.initialize()
      const before = store.workItems.find((i) => i.id === 'wi-001')!.updatedAt
      await new Promise((r) => setTimeout(r, 5))
      store.updateItemState('wi-001', 'approved')
      const after = store.workItems.find((i) => i.id === 'wi-001')!.updatedAt
      expect(after >= before).toBe(true)
    })

    it('does nothing for an unknown item id', async () => {
      const store = makeStore()
      await store.initialize()
      const countBefore = store.workItems.filter((i) => i.state === 'approved').length
      store.updateItemState('nonexistent-id', 'approved')
      const countAfter = store.workItems.filter((i) => i.state === 'approved').length
      expect(countAfter).toBe(countBefore)
    })
  })

  // ── assignItem ─────────────────────────────────────────────────────────────

  describe('assignItem', () => {
    it('sets assignee on the target item', async () => {
      const store = makeStore()
      await store.initialize()
      store.assignItem('wi-001', 'newperson@biatec.io')
      const item = store.workItems.find((i) => i.id === 'wi-001')
      expect(item?.assignee).toBe('newperson@biatec.io')
    })

    it('does nothing for unknown item id', async () => {
      const store = makeStore()
      await store.initialize()
      expect(() => store.assignItem('bad-id', 'x@y.com')).not.toThrow()
    })
  })

  // ── addNote ────────────────────────────────────────────────────────────────

  describe('addNote', () => {
    it('appends a note to the item notes array', async () => {
      const store = makeStore()
      await store.initialize()
      const item = store.workItems.find((i) => i.id === 'wi-002')!
      const before = item.notes.length
      store.addNote('wi-002', 'New compliance note.')
      expect(item.notes.length).toBe(before + 1)
      expect(item.notes[item.notes.length - 1]).toBe('New compliance note.')
    })

    it('does nothing for unknown item id', async () => {
      const store = makeStore()
      await store.initialize()
      expect(() => store.addNote('bad-id', 'note')).not.toThrow()
    })
  })
})
