/**
 * Unit Tests: ApprovalStatusBadge
 *
 * Tests every approval state, size variant, color class, icon, and
 * WCAG role attributes (role="status" vs role="alert").
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ApprovalStatusBadge from '../ApprovalStatusBadge.vue'
import type { ApprovalState } from '../../../types/approvalWorkflow'

const ALL_STATES: ApprovalState[] = [
  'pending',
  'in_review',
  'approved',
  'needs_changes',
  'blocked',
  'completed',
]

describe('ApprovalStatusBadge', () => {
  // ── Label rendering ──────────────────────────────────────────────────────

  it('renders "Pending Review" for state=pending', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'pending' } })
    expect(w.text()).toContain('Pending Review')
  })

  it('renders "In Review" for state=in_review', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'in_review' } })
    expect(w.text()).toContain('In Review')
  })

  it('renders "Approved" for state=approved', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'approved' } })
    expect(w.text()).toContain('Approved')
  })

  it('renders "Needs Changes" for state=needs_changes', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'needs_changes' } })
    expect(w.text()).toContain('Needs Changes')
  })

  it('renders "Blocked" for state=blocked', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'blocked' } })
    expect(w.text()).toContain('Blocked')
  })

  it('renders "Completed" for state=completed', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'completed' } })
    expect(w.text()).toContain('Completed')
  })

  // ── Color classes ────────────────────────────────────────────────────────

  it('applies yellow color classes for pending state', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'pending' } })
    expect(w.find('span').classes().join(' ')).toContain('yellow')
  })

  it('applies blue color classes for in_review state', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'in_review' } })
    expect(w.find('span').classes().join(' ')).toContain('blue')
  })

  it('applies green color classes for approved state', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'approved' } })
    expect(w.find('span').classes().join(' ')).toContain('green')
  })

  it('applies orange color classes for needs_changes state', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'needs_changes' } })
    expect(w.find('span').classes().join(' ')).toContain('orange')
  })

  it('applies red color classes for blocked state', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'blocked' } })
    expect(w.find('span').classes().join(' ')).toContain('red')
  })

  it('applies gray color classes for completed state', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'completed' } })
    expect(w.find('span').classes().join(' ')).toContain('gray')
  })

  // ── WCAG role attributes ──────────────────────────────────────────────────

  it('sets role="alert" for blocked state (WCAG SC 4.1.3)', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'blocked' } })
    expect(w.find('span').attributes('role')).toBe('alert')
  })

  it('sets role="alert" for needs_changes state (WCAG SC 4.1.3)', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'needs_changes' } })
    expect(w.find('span').attributes('role')).toBe('alert')
  })

  it.each(['pending', 'in_review', 'approved', 'completed'] as ApprovalState[])(
    'sets role="status" for non-error state %s',
    (state) => {
      const w = mount(ApprovalStatusBadge, { props: { state } })
      expect(w.find('span').attributes('role')).toBe('status')
    },
  )

  it('has aria-label describing the approval status', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'approved' } })
    expect(w.find('span').attributes('aria-label')).toContain('Approved')
  })

  // ── Size variants ────────────────────────────────────────────────────────

  it('applies sm size classes when size=sm', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'pending', size: 'sm' } })
    const cls = w.find('span').classes().join(' ')
    expect(cls).toContain('text-xs')
  })

  it('applies md size classes by default (size=md)', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'pending' } })
    const cls = w.find('span').classes().join(' ')
    expect(cls).toContain('text-sm')
  })

  it('applies lg size classes when size=lg', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'pending', size: 'lg' } })
    const cls = w.find('span').classes().join(' ')
    expect(cls).toContain('text-base')
  })

  // ── Icon rendering ────────────────────────────────────────────────────────

  it('renders an icon element with pi prefix class', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'pending' } })
    const icon = w.find('i')
    expect(icon.exists()).toBe(true)
    expect(icon.classes().some((c) => c.startsWith('pi'))).toBe(true)
  })

  it('renders aria-hidden="true" on the icon to hide it from screen readers', () => {
    const w = mount(ApprovalStatusBadge, { props: { state: 'in_review' } })
    expect(w.find('i').attributes('aria-hidden')).toBe('true')
  })

  // ── All states render without throwing ───────────────────────────────────

  it.each(ALL_STATES)('mounts without error for state %s', (state) => {
    expect(() => mount(ApprovalStatusBadge, { props: { state } })).not.toThrow()
  })
})
