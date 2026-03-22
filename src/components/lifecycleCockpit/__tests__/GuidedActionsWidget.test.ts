/**
 * GuidedActionsWidget Tests
 * Verifies empty state, action list rendering, critical count badge,
 * show-more behaviour, emit events, and role/time formatting.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuidedActionsWidget from '../GuidedActionsWidget.vue'
import type { GuidedAction } from '../../../types/lifecycleCockpit'

const stubs = {
  Card: { template: '<div class="card"><slot /></div>' },
  Badge: { template: '<span class="badge"><slot /></span>' },
}

function makeAction(overrides: Partial<GuidedAction> = {}): GuidedAction {
  return {
    id: 'action-1',
    priority: 'medium',
    status: 'pending',
    title: 'Configure KYC',
    description: 'Set up KYC provider',
    rationale: 'Required for compliance',
    expectedImpact: 'Enables compliant onboarding',
    deepLink: '/compliance/kyc',
    category: 'compliance',
    createdAt: new Date(),
    ...overrides,
  }
}

describe('GuidedActionsWidget', () => {
  it('shows empty state when no actions', () => {
    const w = mount(GuidedActionsWidget, { props: { actions: [] }, global: { stubs } })
    expect(w.text()).toContain('All caught up!')
  })

  it('hides critical badge when no critical actions', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction({ priority: 'medium' })] },
      global: { stubs },
    })
    expect(w.text()).not.toContain('Critical')
  })

  it('shows critical badge when critical actions present', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction({ priority: 'critical' })] },
      global: { stubs },
    })
    expect(w.text()).toContain('1 Critical')
  })

  it('renders action title and description', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction()] },
      global: { stubs },
    })
    expect(w.text()).toContain('Configure KYC')
    expect(w.text()).toContain('Set up KYC provider')
  })

  it('renders rationale and expected impact', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction()] },
      global: { stubs },
    })
    expect(w.text()).toContain('Required for compliance')
    expect(w.text()).toContain('Enables compliant onboarding')
  })

  it('shows estimated time when provided', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction({ estimatedTime: '5 minutes' })] },
      global: { stubs },
    })
    expect(w.text()).toContain('5 minutes')
  })

  it('formats assigned role from snake_case', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction({ assignedRole: 'compliance_officer' as any })] },
      global: { stubs },
    })
    expect(w.text()).toContain('Compliance Officer')
  })

  it('emits action-selected when action item clicked', async () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction({ id: 'act-42' })] },
      global: { stubs },
    })
    // Click the action row (first div with cursor-pointer class)
    const rows = w.findAll('.cursor-pointer')
    expect(rows.length).toBeGreaterThan(0)
    await rows[0].trigger('click')
    const emitted = w.emitted('action-selected')
    expect(emitted).toBeDefined()
  })

  it('limits displayed actions to 5 by default', () => {
    const actions = Array.from({ length: 8 }, (_, i) =>
      makeAction({ id: `action-${i}`, title: `Action ${i}` }),
    )
    const w = mount(GuidedActionsWidget, { props: { actions }, global: { stubs } })
    // 5 action titles visible (show-more hides the rest)
    const displayed = actions.slice(0, 5)
    expect(w.text()).toContain(displayed[0].title)
    expect(w.text()).not.toContain('Action 7')
  })

  it('shows show-more button when more than 5 actions exist', () => {
    const actions = Array.from({ length: 6 }, (_, i) =>
      makeAction({ id: `action-${i}`, title: `Action ${i}` }),
    )
    const w = mount(GuidedActionsWidget, { props: { actions }, global: { stubs } })
    expect(w.text()).toContain('Show')
  })

  it('applies correct border colour for high priority', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction({ priority: 'high' })] },
      global: { stubs },
    })
    expect(w.html()).toContain('border-orange-500')
  })

  it('applies correct border colour for critical priority', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction({ priority: 'critical' })] },
      global: { stubs },
    })
    expect(w.html()).toContain('border-red-500')
  })

  it('applies correct border colour for low priority', () => {
    const w = mount(GuidedActionsWidget, {
      props: { actions: [makeAction({ priority: 'low' })] },
      global: { stubs },
    })
    expect(w.html()).toContain('border-blue-500')
  })
})
