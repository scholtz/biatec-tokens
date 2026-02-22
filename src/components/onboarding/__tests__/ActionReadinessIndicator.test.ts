/**
 * ActionReadinessIndicator Component Tests
 *
 * Covers pass/fail/warning check rendering, can-proceed / blocked states,
 * remediation links, badge variants, and accessibility attributes.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActionReadinessIndicator from '../ActionReadinessIndicator.vue'
import type { ReadinessCheck } from '../../../utils/portfolioOnboarding'

// ─── Router-link stub ─────────────────────────────────────────────────────────

const RouterLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function check(
  id: string,
  status: ReadinessCheck['status'],
  overrides: Partial<ReadinessCheck> = {},
): ReadinessCheck {
  return {
    id,
    label: `Check: ${id}`,
    status,
    ...overrides,
  }
}

function mountIndicator(checks: ReadinessCheck[], canProceed: boolean) {
  return mount(ActionReadinessIndicator, {
    props: { checks, canProceed },
    global: { stubs: { RouterLink: RouterLinkStub, 'router-link': RouterLinkStub } },
  })
}

const allPassChecks: ReadinessCheck[] = [
  check('auth', 'pass'),
  check('provisioning', 'pass'),
  check('network', 'pass'),
  check('fields', 'pass'),
  check('impact', 'pass'),
]

// ─── Ready state ─────────────────────────────────────────────────────────────

describe('ActionReadinessIndicator - ready state', () => {
  it('shows "Ready to Proceed" heading when canProceed=true', () => {
    const wrapper = mountIndicator(allPassChecks, true)
    expect(wrapper.text()).toContain('Ready to Proceed')
  })

  it('shows badge with pass count', () => {
    const wrapper = mountIndicator(allPassChecks, true)
    expect(wrapper.text()).toContain('5/5 checks passed')
  })

  it('renders all check labels', () => {
    const wrapper = mountIndicator(allPassChecks, true)
    allPassChecks.forEach((c) => expect(wrapper.text()).toContain(c.label))
  })
})

// ─── Blocked state ────────────────────────────────────────────────────────────

describe('ActionReadinessIndicator - blocked state', () => {
  it('shows "Action Blocked" heading when canProceed=false', () => {
    const failChecks = [check('auth', 'fail', { message: 'Sign in first.' }), ...allPassChecks.slice(1)]
    const wrapper = mountIndicator(failChecks, false)
    expect(wrapper.text()).toContain('Action Blocked')
  })

  it('shows the failure message for a failed check', () => {
    const failChecks = [check('auth', 'fail', { message: 'You are not signed in.' })]
    const wrapper = mountIndicator(failChecks, false)
    expect(wrapper.text()).toContain('You are not signed in.')
  })

  it('shows remediation link for failed checks with remediationPath', () => {
    const failChecks = [
      check('auth', 'fail', {
        message: 'Sign in required.',
        remediationPath: '/?showAuth=true',
        remediationLabel: 'Sign In',
      }),
    ]
    const wrapper = mountIndicator(failChecks, false)
    const links = wrapper.findAll('a')
    expect(links.some((l) => l.text().includes('Sign In'))).toBe(true)
  })

  it('does not show remediation link for passing checks', () => {
    const wrapper = mountIndicator(allPassChecks, true)
    // No links should exist (no failing checks)
    expect(wrapper.findAll('a').length).toBe(0)
  })
})

// ─── Warning state ────────────────────────────────────────────────────────────

describe('ActionReadinessIndicator - warning state', () => {
  it('shows warning message for warning checks', () => {
    const warnChecks = [
      ...allPassChecks.slice(0, 2),
      check('fields', 'warning', { message: 'Some fields are incomplete.' }),
      ...allPassChecks.slice(3),
    ]
    const wrapper = mountIndicator(warnChecks, true) // warnings don't block
    expect(wrapper.text()).toContain('Some fields are incomplete.')
  })

  it('does not show remediation link for warning checks (no remediationPath)', () => {
    const warnChecks = [
      check('fields', 'warning', { message: 'Incomplete fields.' }),
    ]
    const wrapper = mountIndicator(warnChecks, true)
    expect(wrapper.findAll('a').length).toBe(0)
  })
})

// ─── Pass count badge ─────────────────────────────────────────────────────────

describe('ActionReadinessIndicator - pass count', () => {
  it('shows correct pass count when some checks fail', () => {
    const mixed = [
      check('auth', 'pass'),
      check('provisioning', 'fail'),
      check('network', 'pass'),
    ]
    const wrapper = mountIndicator(mixed, false)
    expect(wrapper.text()).toContain('2/3 checks passed')
  })
})

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('ActionReadinessIndicator - accessibility', () => {
  it('has role="region" with aria-label', () => {
    const wrapper = mountIndicator(allPassChecks, true)
    const region = wrapper.find('[role="region"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('aria-label')).toBeTruthy()
  })

  it('check list has aria-label', () => {
    const wrapper = mountIndicator(allPassChecks, true)
    const ul = wrapper.find('ul')
    expect(ul.attributes('aria-label')).toBeTruthy()
  })
})
