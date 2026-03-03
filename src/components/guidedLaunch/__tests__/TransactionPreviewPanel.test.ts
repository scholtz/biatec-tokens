/**
 * Unit tests for TransactionPreviewPanel component
 *
 * Validates:
 * - Fee breakdown display
 * - Irreversible action notice
 * - Risk acknowledgment checkbox behavior
 * - validate() method logic
 * - Prop-driven token summary display
 * - Error message display when unacknowledged
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionPreviewPanel from '../TransactionPreviewPanel.vue'

const defaultProps = {
  tokenName: 'My Token',
  tokenStandard: 'ARC3',
  network: 'algorand',
  totalSupply: 1000000,
}

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(TransactionPreviewPanel, {
    props: { ...defaultProps, ...props },
    global: {
      stubs: {
        ExclamationTriangleIcon: { template: '<span />' },
        ShieldExclamationIcon: { template: '<span />' },
      },
    },
  })

describe('TransactionPreviewPanel', () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders the panel', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="transaction-preview-panel"]').exists()).toBe(true)
  })

  it('shows Transaction Preview heading', () => {
    const wrapper = mountPanel()
    expect(wrapper.text()).toContain('Transaction Preview')
  })

  it('shows the irreversible action notice', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="irreversible-notice"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="irreversible-notice"]').text()).toContain('irreversible')
  })

  // ── Fee breakdown ──────────────────────────────────────────────────────────

  it('shows fee breakdown section', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="fee-breakdown"]').exists()).toBe(true)
  })

  it('shows deployment fee', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="fee-deployment"]').text()).toContain('ALGO')
  })

  it('shows compliance fee', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="fee-compliance"]').text()).toContain('ALGO')
  })

  it('shows network fee', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="fee-network"]').text()).toContain('ALGO')
  })

  it('shows total fee', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="fee-total"]').text()).toContain('ALGO')
  })

  // ── Token summary ──────────────────────────────────────────────────────────

  it('shows token name from props', () => {
    const wrapper = mountPanel({ tokenName: 'Loyalty Points' })
    expect(wrapper.find('[data-testid="summary-token-name"]').text()).toBe('Loyalty Points')
  })

  it('shows token standard from props', () => {
    const wrapper = mountPanel({ tokenStandard: 'ARC69' })
    expect(wrapper.find('[data-testid="summary-token-standard"]').text()).toBe('ARC69')
  })

  it('shows network from props', () => {
    const wrapper = mountPanel({ network: 'algorand-testnet' })
    expect(wrapper.find('[data-testid="summary-network"]').text()).toBe('algorand-testnet')
  })

  it('shows formatted total supply', () => {
    const wrapper = mountPanel({ totalSupply: 5000000 })
    const text = wrapper.find('[data-testid="summary-total-supply"]').text()
    expect(text).toContain('5')
    expect(text).toContain('000')
  })

  it('shows em dash when tokenName is empty string', () => {
    const wrapper = mountPanel({ tokenName: '' })
    expect(wrapper.find('[data-testid="summary-token-name"]').text()).toBe('—')
  })

  // ── Risk acknowledgment checkbox ───────────────────────────────────────────

  it('renders risk acknowledgment checkbox unchecked by default', () => {
    const wrapper = mountPanel()
    const checkbox = wrapper.find('[data-testid="risk-acknowledgment-checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
  })

  it('does not show ack error before interaction', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="risk-ack-error"]').exists()).toBe(false)
  })

  it('shows ack error after validate() called with unchecked box', async () => {
    const wrapper = mountPanel()
    const vm = wrapper.vm as unknown as { validate: () => boolean }
    const result = vm.validate()
    expect(result).toBe(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="risk-ack-error"]').exists()).toBe(true)
  })

  it('validate() returns true when checkbox is checked', async () => {
    const wrapper = mountPanel({ acknowledged: true })
    const vm = wrapper.vm as unknown as { validate: () => boolean }
    const result = vm.validate()
    expect(result).toBe(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="risk-ack-error"]').exists()).toBe(false)
  })

  it('emits update:acknowledged true when checkbox is checked', async () => {
    const wrapper = mountPanel()
    const checkbox = wrapper.find('[data-testid="risk-acknowledgment-checkbox"]')
    await checkbox.setValue(true)
    await checkbox.trigger('change')
    const emits = wrapper.emitted('update:acknowledged')
    expect(emits).toBeTruthy()
    expect(emits![emits!.length - 1]).toEqual([true])
  })

  it('clears ack error when checkbox is changed', async () => {
    const wrapper = mountPanel()
    const vm = wrapper.vm as unknown as { validate: () => boolean }
    vm.validate()
    await wrapper.vm.$nextTick()

    const checkbox = wrapper.find('[data-testid="risk-acknowledgment-checkbox"]')
    await checkbox.setValue(true)
    await checkbox.trigger('change')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="risk-ack-error"]').exists()).toBe(false)
  })

  // ── Additional coverage ────────────────────────────────────────────────────

  it('three individual fee rows are visible (deployment, compliance, network)', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="fee-deployment"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="fee-compliance"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="fee-network"]').exists()).toBe(true)
  })

  it('total fee row has data-testid fee-total', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="fee-total"]').exists()).toBe(true)
  })

  it('total fee row text contains ALGO', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="fee-total"]').text()).toContain('ALGO')
  })

  it('token summary grid shows all 4 summary cells', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="summary-token-name"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="summary-token-standard"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="summary-network"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="summary-total-supply"]').exists()).toBe(true)
  })

  it('totalSupply=0 renders "0" in supply cell', () => {
    const wrapper = mountPanel({ totalSupply: 0 })
    expect(wrapper.find('[data-testid="summary-total-supply"]').text()).toBe('0')
  })

  it('totalSupply=1000000 renders localized number in supply cell', () => {
    const wrapper = mountPanel({ totalSupply: 1_000_000 })
    const text = wrapper.find('[data-testid="summary-total-supply"]').text()
    // Number.toLocaleString may use commas or periods depending on locale; just check "1" and "000" are present
    expect(text).toContain('1')
    expect(text).toContain('000')
  })

  it('tokenName="" renders em dash in token name cell', () => {
    const wrapper = mountPanel({ tokenName: '' })
    expect(wrapper.find('[data-testid="summary-token-name"]').text()).toBe('—')
  })

  it('network="" renders em dash in network cell', () => {
    const wrapper = mountPanel({ network: '' })
    expect(wrapper.find('[data-testid="summary-network"]').text()).toBe('—')
  })

  it('risk ack error is NOT shown initially', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="risk-ack-error"]').exists()).toBe(false)
  })

  it('validate() with unchecked box: returns false AND showAckError becomes true', async () => {
    const wrapper = mountPanel()
    const vm = wrapper.vm as unknown as { validate: () => boolean }
    const result = vm.validate()
    await wrapper.vm.$nextTick()
    expect(result).toBe(false)
    expect(wrapper.find('[data-testid="risk-ack-error"]').exists()).toBe(true)
  })

  it('validate() with checked box (acknowledged=true): returns true', () => {
    const wrapper = mountPanel({ acknowledged: true })
    const vm = wrapper.vm as unknown as { validate: () => boolean }
    expect(vm.validate()).toBe(true)
  })

  it('checkbox has id attribute for label association', () => {
    const wrapper = mountPanel()
    const checkbox = wrapper.find('[data-testid="risk-acknowledgment-checkbox"]')
    expect(checkbox.attributes('id')).toBeTruthy()
  })

  it('label has for attribute pointing to checkbox id', () => {
    const wrapper = mountPanel()
    const checkbox = wrapper.find('[data-testid="risk-acknowledgment-checkbox"]')
    const checkboxId = checkbox.attributes('id')
    const label = wrapper.find(`label[for="${checkboxId}"]`)
    expect(label.exists()).toBe(true)
  })

  it('checkbox has type=checkbox', () => {
    const wrapper = mountPanel()
    const checkbox = wrapper.find('[data-testid="risk-acknowledgment-checkbox"]')
    expect(checkbox.attributes('type')).toBe('checkbox')
  })

  it('checkbox has aria-describedby attribute for accessibility hint', () => {
    const wrapper = mountPanel()
    const checkbox = wrapper.find('[data-testid="risk-acknowledgment-checkbox"]')
    expect(checkbox.attributes('aria-describedby')).toBeTruthy()
  })
})
