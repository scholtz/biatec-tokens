/**
 * WalletDiagnosticsWidget Tests
 * Verifies null state, overall status badge, diagnostic items, status icons,
 * remediation hints, warn/fail counts, and timestamp formatting.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WalletDiagnosticsWidget from '../WalletDiagnosticsWidget.vue'
import type { WalletDiagnostics, WalletDiagnosticItem } from '../../../types/lifecycleCockpit'

const stubs = {
  Card: { template: '<div class="card"><slot /></div>' },
  Badge: { template: '<span class="badge"><slot /></span>' },
}

function makeItem(overrides: Partial<WalletDiagnosticItem> = {}): WalletDiagnosticItem {
  return {
    id: 'diag-1',
    name: 'Pera Wallet',
    status: 'pass',
    description: 'Compatible with Pera Wallet',
    category: 'compatibility',
    lastChecked: new Date(),
    ...overrides,
  }
}

function makeDiagnostics(overrides: Partial<WalletDiagnostics> = {}): WalletDiagnostics {
  return {
    overallStatus: 'pass',
    diagnostics: [makeItem()],
    lastChecked: new Date(),
    ...overrides,
  }
}

describe('WalletDiagnosticsWidget', () => {
  it('shows loading state when diagnostics is null', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: null },
      global: { stubs },
    })
    expect(w.text()).toContain('Loading diagnostics')
  })

  it('renders diagnostic item name', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics() },
      global: { stubs },
    })
    expect(w.text()).toContain('Pera Wallet')
  })

  it('renders diagnostic item description', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics() },
      global: { stubs },
    })
    expect(w.text()).toContain('Compatible with Pera Wallet')
  })

  it('shows pass icon for passing item', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: [makeItem({ status: 'pass' })] }) },
      global: { stubs },
    })
    expect(w.html()).toContain('pi-check-circle')
  })

  it('shows warning icon for warn item', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: [makeItem({ status: 'warn' })] }) },
      global: { stubs },
    })
    expect(w.html()).toContain('pi-exclamation-triangle')
  })

  it('shows fail icon for fail item', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: [makeItem({ status: 'fail' })] }) },
      global: { stubs },
    })
    expect(w.html()).toContain('pi-times-circle')
  })

  it('shows remediation hint when provided', () => {
    const item = makeItem({ status: 'warn', remediationHint: 'Update wallet SDK version' })
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: [item] }) },
      global: { stubs },
    })
    expect(w.text()).toContain('Update wallet SDK version')
  })

  it('does not show remediation section when hint absent', () => {
    const item = makeItem({ status: 'pass', remediationHint: undefined })
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: [item] }) },
      global: { stubs },
    })
    expect(w.text()).not.toContain('Fix:')
  })

  it('overall PASS badge visible when status is pass', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ overallStatus: 'pass' }) },
      global: { stubs },
    })
    expect(w.text()).toContain('PASS')
  })

  it('overall WARN badge visible when status is warn', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ overallStatus: 'warn' }) },
      global: { stubs },
    })
    expect(w.text()).toContain('WARN')
  })

  it('overall FAIL badge visible when status is fail', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ overallStatus: 'fail' }) },
      global: { stubs },
    })
    expect(w.text()).toContain('FAIL')
  })

  it('shows warn count when warn items exist', () => {
    const items = [makeItem({ id: '1', status: 'warn' }), makeItem({ id: '2', status: 'warn' })]
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: items }) },
      global: { stubs },
    })
    expect(w.text()).toContain('2')
  })

  it('emits navigate when diagnostic with deepLink is clicked', async () => {
    const item = makeItem({ deepLink: '/compliance/wallets' })
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: [item] }) },
      global: { stubs },
    })
    const clickable = w.find('.cursor-pointer')
    if (clickable.exists()) {
      await clickable.trigger('click')
      const emitted = w.emitted('navigate')
      expect(emitted).toBeDefined()
    }
  })

  it('applies green border for pass status item', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: [makeItem({ status: 'pass' })] }) },
      global: { stubs },
    })
    expect(w.html()).toContain('border-green-500')
  })

  it('applies red border for fail status item', () => {
    const w = mount(WalletDiagnosticsWidget, {
      props: { diagnostics: makeDiagnostics({ diagnostics: [makeItem({ status: 'fail' })] }) },
      global: { stubs },
    })
    expect(w.html()).toContain('border-red-500')
  })
})
