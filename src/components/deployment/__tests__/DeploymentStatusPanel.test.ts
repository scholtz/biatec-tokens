/**
 * Unit Tests — DeploymentStatusPanel.vue
 *
 * Tests cover:
 * - All 5 lifecycle states render correctly (Pending, Validated, Submitted, Confirmed, Completed)
 * - Failed state with error guidance
 * - Idempotency replay notice visibility
 * - Success section with asset ID and audit trail link
 * - Step indicator visual state (completed / active / pending)
 * - No raw error codes exposed in the UI
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DeploymentStatusPanel from '../DeploymentStatusPanel.vue'
import type { DeploymentLifecycleState } from '../../../lib/api/backendDeploymentContract'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountPanel(props: {
  state: DeploymentLifecycleState
  previousState?: DeploymentLifecycleState
  isIdempotentReplay?: boolean
  assetId?: string
  errorGuidance?: string
  auditTrailUrl?: string
}) {
  return mount(DeploymentStatusPanel, { props })
}

// ---------------------------------------------------------------------------
// Rendering: Pending state
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — Pending state', () => {
  it('renders without throwing', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.exists()).toBe(true)
  })

  it('has data-testid="deployment-status-panel"', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.find('[data-testid="deployment-status-panel"]').exists()).toBe(true)
  })

  it('shows "Preparing deployment" lifecycle label', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Preparing deployment')
  })

  it('shows in-progress spinner icon', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.find('[data-testid="icon-in-progress"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="icon-completed"]').exists()).toBe(false)
  })

  it('does not show idempotency replay notice', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.find('[data-testid="idempotency-replay-notice"]').exists()).toBe(false)
  })

  it('does not show error guidance', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.find('[data-testid="error-guidance"]').exists()).toBe(false)
  })

  it('does not show success section', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.find('[data-testid="success-section"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Rendering: Validated state
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — Validated state', () => {
  it('shows "Parameters validated" lifecycle label', () => {
    const wrapper = mountPanel({ state: 'Validated' })
    expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Parameters validated')
  })

  it('shows Pending step as completed', () => {
    const wrapper = mountPanel({ state: 'Validated' })
    const pendingStep = wrapper.find('[data-testid="step-pending"]')
    expect(pendingStep.exists()).toBe(true)
    // Completed steps use green styling class
    expect(pendingStep.html()).toContain('bg-green-500')
  })
})

// ---------------------------------------------------------------------------
// Rendering: Submitted state
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — Submitted state', () => {
  it('shows "Transaction submitted" lifecycle label', () => {
    const wrapper = mountPanel({ state: 'Submitted' })
    expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Transaction submitted')
  })
})

// ---------------------------------------------------------------------------
// Rendering: Confirmed state
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — Confirmed state', () => {
  it('shows "Transaction confirmed" lifecycle label', () => {
    const wrapper = mountPanel({ state: 'Confirmed' })
    expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Transaction confirmed')
  })
})

// ---------------------------------------------------------------------------
// Rendering: Completed state
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — Completed state', () => {
  it('shows "Deployment complete" lifecycle label', () => {
    const wrapper = mountPanel({ state: 'Completed' })
    expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Deployment complete')
  })

  it('shows checkmark icon', () => {
    const wrapper = mountPanel({ state: 'Completed' })
    expect(wrapper.find('[data-testid="icon-completed"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="icon-in-progress"]').exists()).toBe(false)
  })

  it('shows success section with asset ID when assetId prop provided', () => {
    const wrapper = mountPanel({ state: 'Completed', assetId: '12345678' })
    expect(wrapper.find('[data-testid="success-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="asset-id"]').text()).toBe('12345678')
  })

  it('shows pending-asset guidance when Completed but no assetId (avoids silent state)', () => {
    // When state is Completed but assetId has not been returned, the panel must
    // guide the user to the dashboard rather than silently hiding all status info.
    // This prevents the "Deployment complete" label from implying the user can
    // find their token without any indication of where to look.
    const wrapper = mountPanel({ state: 'Completed' })
    expect(wrapper.find('[data-testid="success-section"]').exists()).toBe(false)
    const pendingAsset = wrapper.find('[data-testid="success-section-pending-asset"]')
    expect(pendingAsset.exists()).toBe(true)
    const msg = wrapper.find('[data-testid="pending-asset-message"]').text()
    expect(msg.trim().length).toBeGreaterThan(0)
    expect(msg.toLowerCase()).toMatch(/dashboard|details|asset id/)
  })

  it('shows audit trail link when auditTrailUrl provided', () => {
    const wrapper = mountPanel({
      state: 'Completed',
      assetId: '99',
      auditTrailUrl: 'https://api.example.com/audit/dep-1',
    })
    const link = wrapper.find('[data-testid="audit-trail-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://api.example.com/audit/dep-1')
    expect(link.text()).toContain('audit trail')
  })

  it('does not show audit trail link when no auditTrailUrl', () => {
    const wrapper = mountPanel({ state: 'Completed', assetId: '99' })
    expect(wrapper.find('[data-testid="audit-trail-link"]').exists()).toBe(false)
  })

  it('marks all non-terminal lifecycle steps as completed', () => {
    const wrapper = mountPanel({ state: 'Completed' })
    const steps = ['pending', 'validated', 'submitted', 'confirmed']
    for (const step of steps) {
      const el = wrapper.find(`[data-testid="step-${step}"]`)
      expect(el.exists()).toBe(true)
      // Completed steps get green indicator
      expect(el.html()).toContain('bg-green-500')
    }
  })
})

// ---------------------------------------------------------------------------
// Rendering: Failed state
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — Failed state', () => {
  it('shows "Deployment failed" lifecycle label', () => {
    const wrapper = mountPanel({ state: 'Failed' })
    expect(wrapper.find('[data-testid="lifecycle-label"]').text()).toContain('Deployment failed')
  })

  it('shows X icon', () => {
    const wrapper = mountPanel({ state: 'Failed' })
    expect(wrapper.find('[data-testid="icon-failed"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="icon-completed"]').exists()).toBe(false)
  })

  it('shows user-friendly error guidance (no raw error codes) when errorGuidance is provided', () => {
    const guidance = 'Your session has expired. Please sign in again to continue.'
    const wrapper = mountPanel({ state: 'Failed', errorGuidance: guidance })
    const errorEl = wrapper.find('[data-testid="error-guidance"]')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toContain(guidance)
    // Must not contain raw error code strings
    expect(errorEl.text()).not.toContain('SessionExpired')
    expect(errorEl.text()).not.toContain('DeriveAddressMismatch')
  })

  it('shows fallback error guidance when errorGuidance prop is absent (negative-path honesty)', () => {
    // When backend provides no errorGuidance, the panel must still show actionable content.
    // Silence here (empty error box) would be misleading — the user needs a next step.
    const wrapper = mountPanel({ state: 'Failed' })
    const errorEl = wrapper.find('[data-testid="error-guidance"]')
    expect(errorEl.exists()).toBe(true)
    const guidanceText = wrapper.find('[data-testid="error-guidance-text"]').text()
    expect(guidanceText.trim().length).toBeGreaterThan(0)
    // Fallback message must suggest a concrete action (dashboard or support)
    expect(guidanceText.toLowerCase()).toMatch(/dashboard|support|contact|try again/)
    // Must not be a raw error code
    expect(guidanceText).not.toMatch(/^error$/i)
    expect(guidanceText).not.toContain('undefined')
  })

  it('does not mark lifecycle steps as completed when Failed with no previousState', () => {
    const wrapper = mountPanel({ state: 'Failed' })
    // All steps remain in pending/default state when no previousState
    const steps = wrapper.findAll('[data-testid^="step-"]')
    for (const step of steps) {
      expect(step.html()).not.toContain('bg-green-500')
    }
  })

  it('shows completed steps up to previousState when Failed', () => {
    // If deployment failed after Confirmed, Pending→Validated→Submitted→Confirmed show green
    const wrapper = mountPanel({ state: 'Failed', previousState: 'Confirmed', errorGuidance: 'Failed at confirmation.' })
    const confirmedStep = wrapper.find('[data-testid="step-confirmed"]')
    const pendingStep = wrapper.find('[data-testid="step-pending"]')
    // Confirmed and earlier steps (which previousState = Confirmed has passed) should be green
    expect(pendingStep.html()).toContain('bg-green-500')
    // The Completed step is beyond previousState, so should not be green
    const completedStep = wrapper.find('[data-testid="step-completed"]')
    expect(completedStep.html()).not.toContain('bg-green-500')
    // confirmedStep itself: STATE_ORDER[Confirmed]=4, STATE_ORDER[Confirmed]=4, 4 >= 4 → true
    expect(confirmedStep.html()).toContain('bg-green-500')
  })
})

// ---------------------------------------------------------------------------
// Idempotency replay notice
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — idempotency replay', () => {
  it('shows replay notice when isIdempotentReplay is true', () => {
    const wrapper = mountPanel({ state: 'Completed', isIdempotentReplay: true, assetId: '777' })
    expect(wrapper.find('[data-testid="idempotency-replay-notice"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="idempotency-replay-notice"]').text()).toContain(
      'already deployed',
    )
  })

  it('does NOT show replay notice when isIdempotentReplay is false', () => {
    const wrapper = mountPanel({ state: 'Completed', isIdempotentReplay: false, assetId: '777' })
    expect(wrapper.find('[data-testid="idempotency-replay-notice"]').exists()).toBe(false)
  })

  it('does NOT show replay notice by default', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.find('[data-testid="idempotency-replay-notice"]').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — accessibility', () => {
  it('has role="region" on the panel', () => {
    const wrapper = mountPanel({ state: 'Pending' })
    expect(wrapper.find('[data-testid="deployment-status-panel"]').attributes('role')).toBe(
      'region',
    )
  })

  it('has aria-label describing lifecycle state', () => {
    const wrapper = mountPanel({ state: 'Completed' })
    const ariaLabel = wrapper.find('[data-testid="deployment-status-panel"]').attributes('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel).toContain('Deployment complete')
  })

  it('error guidance has role="alert" (with explicit errorGuidance)', () => {
    const wrapper = mountPanel({ state: 'Failed', errorGuidance: 'Something went wrong.' })
    expect(wrapper.find('[data-testid="error-guidance"]').attributes('role')).toBe('alert')
  })

  it('error guidance has role="alert" even when no errorGuidance prop provided (fallback message)', () => {
    // The error-guidance alert must always show on Failed state so screen readers
    // announce the failure — relying on lifecycleLabel alone is insufficient for AT.
    const wrapper = mountPanel({ state: 'Failed' })
    expect(wrapper.find('[data-testid="error-guidance"]').attributes('role')).toBe('alert')
  })

  it('idempotency replay notice has role="alert"', () => {
    const wrapper = mountPanel({ state: 'Completed', isIdempotentReplay: true, assetId: '1' })
    expect(wrapper.find('[data-testid="idempotency-replay-notice"]').attributes('role')).toBe('alert')
  })
})

// ---------------------------------------------------------------------------
// All 5 states render without throwing
// ---------------------------------------------------------------------------

describe('DeploymentStatusPanel — all states render', () => {
  const allStates: DeploymentLifecycleState[] = [
    'Pending',
    'Validated',
    'Submitted',
    'Confirmed',
    'Completed',
    'Failed',
  ]

  for (const state of allStates) {
    it(`renders state="${state}" without error`, () => {
      const wrapper = mountPanel({ state })
      expect(wrapper.find('[data-testid="deployment-status-panel"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="lifecycle-label"]').exists()).toBe(true)
    })
  }
})
