/**
 * Component Tests: RemediationTaskCard
 *
 * Validates individual task card rendering:
 *  - Urgency badge displays correct label
 *  - Launch-blocking badge renders when task is launch-blocking
 *  - Evidence freshness badge renders with correct label
 *  - Owner domain badge renders
 *  - Title and action summary render
 *  - Stale evidence explanation block renders when stale
 *  - Missing evidence block renders for launch-blocking missing tasks
 *  - Handoff note renders when handoffState != no_handoff
 *  - Remediation link renders when remediationPath is set
 *  - WCAG: aria-labels on badges, no-color-only signaling
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RemediationTaskCard from '../RemediationTaskCard.vue'
import type { RemediationTask } from '../../../utils/remediationWorkflow'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<RemediationTask> = {}): RemediationTask {
  return {
    id: 'task-kyc',
    stageId: 'compliance-review',
    title: 'Refresh KYC Evidence Package',
    description: 'The KYC evidence package is outdated.',
    actionSummary: 'Update the KYC/AML compliance package and re-upload to the evidence workspace.',
    impactStatement: 'This blocks the Compliance Review stage from proceeding.',
    ownerDomain: 'compliance',
    urgency: 'high',
    isLaunchBlocking: true,
    isHardBlocker: true,
    evidenceFreshness: 'missing',
    lastEvidenceAt: null,
    stalenessLabel: null,
    dependsOn: [],
    handoffState: 'no_handoff',
    handoffNote: null,
    remediationPath: '/compliance/evidence',
    stalenessExplanation: null,
    ...overrides,
  }
}

const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })

async function mountCard(task: RemediationTask) {
  const wrapper = mount(RemediationTaskCard, {
    props: { task },
    global: { plugins: [router] },
  })
  await router.isReady()
  return wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RemediationTaskCard', () => {
  describe('urgency badge', () => {
    it('renders urgency badge with correct label for high urgency', async () => {
      const wrapper = await mountCard(makeTask({ urgency: 'high' }))
      const badge = wrapper.find('[data-testid="task-urgency-task-kyc"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('High')
    })

    it('renders urgency badge with correct label for critical urgency', async () => {
      const wrapper = await mountCard(makeTask({ urgency: 'critical' }))
      const badge = wrapper.find('[data-testid="task-urgency-task-kyc"]')
      expect(badge.text()).toBe('Critical')
    })

    it('renders urgency badge with correct label for advisory', async () => {
      const wrapper = await mountCard(makeTask({ urgency: 'advisory' }))
      const badge = wrapper.find('[data-testid="task-urgency-task-kyc"]')
      expect(badge.text()).toBe('Advisory')
    })

    it('urgency badge has aria-label', async () => {
      const wrapper = await mountCard(makeTask({ urgency: 'high' }))
      const badge = wrapper.find('[data-testid="task-urgency-task-kyc"]')
      const label = badge.attributes('aria-label')
      expect(label).toContain('High')
    })
  })

  describe('launch-blocking badge', () => {
    it('renders blocking badge when isLaunchBlocking is true', async () => {
      const wrapper = await mountCard(makeTask({ isLaunchBlocking: true }))
      const badge = wrapper.find('[data-testid="task-blocking-badge-task-kyc"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('Launch blocking')
    })

    it('does not render blocking badge when isLaunchBlocking is false', async () => {
      const wrapper = await mountCard(makeTask({ isLaunchBlocking: false }))
      const badge = wrapper.find('[data-testid="task-blocking-badge-task-kyc"]')
      expect(badge.exists()).toBe(false)
    })
  })

  describe('evidence freshness badge', () => {
    it('renders fresh badge for fresh evidence', async () => {
      const wrapper = await mountCard(makeTask({ evidenceFreshness: 'fresh' }))
      const badge = wrapper.find('[data-testid="task-freshness-task-kyc"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('current')
    })

    it('renders stale badge for stale evidence', async () => {
      const wrapper = await mountCard(makeTask({ evidenceFreshness: 'stale' }))
      const badge = wrapper.find('[data-testid="task-freshness-task-kyc"]')
      expect(badge.text()).toContain('stale')
    })

    it('renders missing badge for missing evidence', async () => {
      const wrapper = await mountCard(makeTask({ evidenceFreshness: 'missing' }))
      const badge = wrapper.find('[data-testid="task-freshness-task-kyc"]')
      expect(badge.text()).toContain('No evidence')
    })

    it('freshness badge has aria-label', async () => {
      const wrapper = await mountCard(makeTask({ evidenceFreshness: 'stale' }))
      const badge = wrapper.find('[data-testid="task-freshness-task-kyc"]')
      const label = badge.attributes('aria-label')
      expect(label).toContain('stale')
    })
  })

  describe('owner domain badge', () => {
    it('renders owner domain badge with correct label', async () => {
      const wrapper = await mountCard(makeTask({ ownerDomain: 'legal' }))
      const badge = wrapper.find('[data-testid="task-owner-task-kyc"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('Legal')
    })

    it('owner badge has aria-label', async () => {
      const wrapper = await mountCard(makeTask({ ownerDomain: 'compliance' }))
      const badge = wrapper.find('[data-testid="task-owner-task-kyc"]')
      const label = badge.attributes('aria-label')
      expect(label).toContain('Compliance')
    })
  })

  describe('task content', () => {
    it('renders the task title', async () => {
      const wrapper = await mountCard(makeTask({ title: 'Update KYC Package' }))
      const title = wrapper.find('[data-testid="task-title-task-kyc"]')
      expect(title.exists()).toBe(true)
      expect(title.text()).toContain('Update KYC Package')
    })

    it('renders the action summary', async () => {
      const wrapper = await mountCard(makeTask({ actionSummary: 'Refresh the evidence and re-upload.' }))
      const action = wrapper.find('[data-testid="task-action-task-kyc"]')
      expect(action.exists()).toBe(true)
      expect(action.text()).toContain('Refresh the evidence and re-upload.')
    })

    it('renders the impact statement', async () => {
      const wrapper = await mountCard(makeTask({ impactStatement: 'This blocks the launch.' }))
      const impact = wrapper.find('[data-testid="task-impact-task-kyc"]')
      expect(impact.exists()).toBe(true)
      expect(impact.text()).toContain('This blocks the launch.')
    })

    it('task title element has id for aria-labelledby', async () => {
      const wrapper = await mountCard(makeTask())
      const title = wrapper.find('[data-testid="task-title-task-kyc"]')
      expect(title.attributes('id')).toBe('task-title-task-kyc')
    })
  })

  describe('stale evidence explanation', () => {
    it('renders stale explanation block when stale and explanation is set', async () => {
      const wrapper = await mountCard(makeTask({
        evidenceFreshness: 'stale',
        stalenessExplanation: 'Evidence was last updated 45 days ago.',
      }))
      const block = wrapper.find('[data-testid="task-stale-explanation-task-kyc"]')
      expect(block.exists()).toBe(true)
      expect(block.text()).toContain('45 days ago')
    })

    it('does not render stale block when evidence is fresh', async () => {
      const wrapper = await mountCard(makeTask({ evidenceFreshness: 'fresh' }))
      const block = wrapper.find('[data-testid="task-stale-explanation-task-kyc"]')
      expect(block.exists()).toBe(false)
    })
  })

  describe('missing evidence block', () => {
    it('renders missing evidence block for launch-blocking tasks with missing evidence', async () => {
      const wrapper = await mountCard(makeTask({ evidenceFreshness: 'missing', isLaunchBlocking: true }))
      const block = wrapper.find('[data-testid="task-missing-evidence-task-kyc"]')
      expect(block.exists()).toBe(true)
    })

    it('does not render missing evidence block when evidence is present', async () => {
      const wrapper = await mountCard(makeTask({ evidenceFreshness: 'fresh' }))
      const block = wrapper.find('[data-testid="task-missing-evidence-task-kyc"]')
      expect(block.exists()).toBe(false)
    })

    it('does not render missing evidence block when missing but NOT launch-blocking', async () => {
      // The v-else-if requires both missing AND isLaunchBlocking
      const wrapper = await mountCard(makeTask({ evidenceFreshness: 'missing', isLaunchBlocking: false }))
      const block = wrapper.find('[data-testid="task-missing-evidence-task-kyc"]')
      expect(block.exists()).toBe(false)
    })
  })

  describe('handoff note', () => {
    it('renders handoff note when handoffState is not no_handoff', async () => {
      const wrapper = await mountCard(makeTask({
        handoffState: 'waiting_on_compliance',
        handoffNote: 'Legal is waiting for Compliance to resolve blockers.',
      }))
      const note = wrapper.find('[data-testid="task-handoff-note-task-kyc"]')
      expect(note.exists()).toBe(true)
      expect(note.text()).toContain('Legal is waiting for Compliance')
    })

    it('does not render handoff note when handoffState is no_handoff', async () => {
      const wrapper = await mountCard(makeTask({ handoffState: 'no_handoff', handoffNote: null }))
      const note = wrapper.find('[data-testid="task-handoff-note-task-kyc"]')
      expect(note.exists()).toBe(false)
    })
  })

  describe('remediation link', () => {
    it('renders link when remediationPath is set', async () => {
      const wrapper = await mountCard(makeTask({ remediationPath: '/compliance/evidence' }))
      const link = wrapper.find('[data-testid="task-remediation-link-task-kyc"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toContain('/compliance/evidence')
    })

    it('does not render link when remediationPath is null', async () => {
      const wrapper = await mountCard(makeTask({ remediationPath: null }))
      const link = wrapper.find('[data-testid="task-remediation-link-task-kyc"]')
      expect(link.exists()).toBe(false)
    })

    it('remediation link has aria-label describing the action', async () => {
      const wrapper = await mountCard(makeTask({ remediationPath: '/compliance/evidence' }))
      const link = wrapper.find('[data-testid="task-remediation-link-task-kyc"]')
      const label = link.attributes('aria-label')
      expect(label).toContain('Refresh KYC Evidence Package')
    })
  })

  describe('article semantics', () => {
    it('card is wrapped in an article element', async () => {
      const wrapper = await mountCard(makeTask())
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
    })

    it('article has aria-labelledby pointing to the task title', async () => {
      const wrapper = await mountCard(makeTask())
      const article = wrapper.find('article')
      expect(article.attributes('aria-labelledby')).toBe('task-title-task-kyc')
    })
  })
})
