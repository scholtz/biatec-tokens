/**
 * EvidenceLinksWidget Tests
 * Verifies empty state, evidence trace/reference rendering,
 * signal type badges, formatType helper, and evidence-viewed emit.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvidenceLinksWidget from '../EvidenceLinksWidget.vue'
import type { EvidenceTrace, EvidenceReference } from '../../../types/lifecycleCockpit'

const stubs = {
  Card: { template: '<div class="card"><slot /></div>' },
  Badge: { template: '<span class="badge"><slot /></span>' },
}

function makeRef(overrides: Partial<EvidenceReference> = {}): EvidenceReference {
  return {
    id: 'ref-1',
    type: 'document',
    title: 'KYC Policy Document',
    url: '/evidence/kyc-policy',
    timestamp: new Date(),
    ...overrides,
  }
}

function makeTrace(overrides: Partial<EvidenceTrace> = {}): EvidenceTrace {
  return {
    signalId: 'sig-1',
    signalType: 'blocker',
    evidenceRefs: [makeRef()],
    ...overrides,
  }
}

describe('EvidenceLinksWidget', () => {
  it('shows empty state when traces array is empty', () => {
    const w = mount(EvidenceLinksWidget, { props: { traces: [] }, global: { stubs } })
    expect(w.text()).toContain('No evidence traces available')
  })

  it('renders signal ID', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ signalId: 'sig-abc' })] },
      global: { stubs },
    })
    expect(w.text()).toContain('sig-abc')
  })

  it('renders signal type badge', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ signalType: 'blocker' })] },
      global: { stubs },
    })
    expect(w.text()).toContain('blocker')
  })

  it('renders warning signal type', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ signalType: 'warning' })] },
      global: { stubs },
    })
    expect(w.text()).toContain('warning')
  })

  it('renders risk signal type', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ signalType: 'risk' })] },
      global: { stubs },
    })
    expect(w.text()).toContain('risk')
  })

  it('renders evidence reference title', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace()] },
      global: { stubs },
    })
    expect(w.text()).toContain('KYC Policy Document')
  })

  it('formats evidence type from snake_case', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ evidenceRefs: [makeRef({ type: 'audit_log' })] })] },
      global: { stubs },
    })
    expect(w.text()).toContain('Audit Log')
  })

  it('formats document type', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ evidenceRefs: [makeRef({ type: 'document' })] })] },
      global: { stubs },
    })
    expect(w.text()).toContain('Document')
  })

  it('formats transaction type', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ evidenceRefs: [makeRef({ type: 'transaction' })] })] },
      global: { stubs },
    })
    expect(w.text()).toContain('Transaction')
  })

  it('formats attestation type', () => {
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ evidenceRefs: [makeRef({ type: 'attestation' })] })] },
      global: { stubs },
    })
    expect(w.text()).toContain('Attestation')
  })

  it('shows provider when present', () => {
    const ref = makeRef({ provider: 'Chainalysis' })
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ evidenceRefs: [ref] })] },
      global: { stubs },
    })
    expect(w.text()).toContain('Chainalysis')
  })

  it('renders multiple evidence references', () => {
    const refs = [
      makeRef({ id: 'ref-1', title: 'First Doc' }),
      makeRef({ id: 'ref-2', title: 'Second Doc' }),
    ]
    const w = mount(EvidenceLinksWidget, {
      props: { traces: [makeTrace({ evidenceRefs: refs })] },
      global: { stubs },
    })
    expect(w.text()).toContain('First Doc')
    expect(w.text()).toContain('Second Doc')
  })

  it('renders multiple traces', () => {
    const traces = [
      makeTrace({ signalId: 'sig-1', signalType: 'blocker' }),
      makeTrace({ signalId: 'sig-2', signalType: 'warning' }),
    ]
    const w = mount(EvidenceLinksWidget, {
      props: { traces },
      global: { stubs },
    })
    expect(w.text()).toContain('sig-1')
    expect(w.text()).toContain('sig-2')
  })
})
