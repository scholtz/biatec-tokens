/**
 * GuidedNextStepModule Component Tests
 *
 * Covers rendering for all step statuses, progress bar, accessibility
 * attributes, CTA links, and step list display.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuidedNextStepModule from '../GuidedNextStepModule.vue'
import type { OnboardingStep } from '../../../utils/portfolioOnboarding'

// ─── Router-link stub ─────────────────────────────────────────────────────────

const RouterLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function step(
  id: string,
  status: OnboardingStep['status'],
  overrides: Partial<OnboardingStep> = {},
): OnboardingStep {
  return {
    id: id as OnboardingStep['id'],
    title: `Step: ${id}`,
    description: `Description for ${id}`,
    status,
    ctaPath: '/test',
    ctaLabel: 'Do it',
    ...overrides,
  }
}

function makeSteps(statuses: OnboardingStep['status'][]): OnboardingStep[] {
  const ids = ['sign_in', 'account_provisioning', 'explore_standards', 'create_first_token', 'configure_compliance', 'deploy_token', 'complete']
  return statuses.map((s, i) => step(ids[i] ?? `step_${i}`, s))
}

function mountModule(steps: OnboardingStep[]) {
  return mount(GuidedNextStepModule, {
    props: { steps },
    global: { stubs: { RouterLink: RouterLinkStub, 'router-link': RouterLinkStub } },
  })
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('GuidedNextStepModule - rendering', () => {
  it('renders the region heading', () => {
    const wrapper = mountModule(makeSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']))
    expect(wrapper.text()).toContain('Your Next Step')
  })

  it('shows progress percentage in badge', () => {
    const allPending = makeSteps(['pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending'])
    const wrapper = mountModule(allPending)
    expect(wrapper.text()).toContain('0% complete')
  })

  it('shows 100% when all steps are completed', () => {
    const allCompleted = makeSteps(['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed'])
    const wrapper = mountModule(allCompleted)
    expect(wrapper.text()).toContain('100% complete')
  })

  it('renders a progressbar with correct aria-valuenow', () => {
    const steps = makeSteps(['completed', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending'])
    const wrapper = mountModule(steps)
    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('aria-valuenow')).toBe(`${Math.round((1 / 7) * 100)}`)
  })

  it('renders all step titles in the list', () => {
    const steps = makeSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending', 'pending'])
    const wrapper = mountModule(steps)
    steps.forEach((s) => expect(wrapper.text()).toContain(s.title))
  })

  it('renders a CTA link for in_progress step', () => {
    const steps = makeSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending'])
    const wrapper = mountModule(steps)
    const links = wrapper.findAll('a')
    expect(links.length).toBeGreaterThan(0)
  })

  it('does not render CTA for blocked step', () => {
    const steps = [step('sign_in', 'blocked', { ctaPath: '/test', ctaLabel: 'Fix' })]
    const wrapper = mountModule(steps)
    // CTA link should not appear when status is blocked (single blocked step, no completed/in_progress)
    const links = wrapper.findAll('a')
    expect(links.length).toBe(0)
  })
})

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('GuidedNextStepModule - accessibility', () => {
  it('has role="region" and aria-label', () => {
    const wrapper = mountModule(makeSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']))
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toBeTruthy()
  })

  it('marks the current step with aria-current="step"', () => {
    const steps = makeSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending', 'pending'])
    const wrapper = mountModule(steps)
    const currentItem = wrapper.find('[aria-current="step"]')
    expect(currentItem.exists()).toBe(true)
  })

  it('progressbar has aria-valuemin and aria-valuemax', () => {
    const wrapper = mountModule(makeSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']))
    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
  })

  it('blocked step card shows role="alert" for the blocked reason', () => {
    const blockedStep = step('sign_in', 'blocked', { blockedReason: 'Must sign in first.' })
    const wrapper = mountModule([blockedStep])
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Must sign in first.')
  })
})

// ─── Step status classes ──────────────────────────────────────────────────────

describe('GuidedNextStepModule - step list styling', () => {
  it('step list has aria-label', () => {
    const wrapper = mountModule(makeSteps(['in_progress', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']))
    const ol = wrapper.find('ol')
    expect(ol.attributes('aria-label')).toBeTruthy()
  })

  it('renders the correct number of list items', () => {
    const steps = makeSteps(['completed', 'in_progress', 'pending', 'pending', 'pending', 'pending', 'pending'])
    const wrapper = mountModule(steps)
    const items = wrapper.findAll('li')
    expect(items.length).toBe(7)
  })
})

