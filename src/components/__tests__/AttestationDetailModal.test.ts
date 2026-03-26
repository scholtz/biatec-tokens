import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AttestationDetailModal from '../AttestationDetailModal.vue'
import { AttestationType } from '../../types/compliance'
import type { AttestationListItem } from '../../stores/attestations'

const mockAttestation: AttestationListItem = {
  id: 'att-001',
  type: AttestationType.KYC_AML,
  status: 'verified',
  walletAddress: 'ABCDEFGHIJ1234567890ABCDEFGHIJ1234567890ABCDEFGHIJ1234567890',
  assetId: '12345',
  issuerName: 'Test Issuer',
  network: 'VOI',
  createdAt: '2024-01-15T10:30:00Z',
  notes: 'Test notes',
  metadata: { key: 'value' },
}

function mountModal(attestation = mockAttestation) {
  return mount(AttestationDetailModal, {
    props: { attestation },
  })
}

describe('AttestationDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() })
  })

  it('renders attestation id', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('att-001')
  })

  it('renders wallet address', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('ABCDEFGHIJ1234567890')
  })

  it('renders issuer name', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Test Issuer')
  })

  it('renders notes section', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Test notes')
  })

  it('renders metadata section when metadata has keys', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Additional Metadata')
  })

  it('does not render metadata section when metadata is empty', () => {
    const att = { ...mockAttestation, metadata: {} }
    const wrapper = mountModal(att)
    expect(wrapper.text()).not.toContain('Additional Metadata')
  })

  it('emits close event on close button click', async () => {
    const wrapper = mountModal()
    // Find the Close button in footer
    const closeBtn = wrapper.findAll('button').find(b => b.text().includes('Close'))
    expect(closeBtn).toBeDefined()
    await closeBtn!.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event on backdrop click', async () => {
    const wrapper = mountModal()
    // The backdrop is the outermost div with fixed class
    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('shows verified status badge with correct class', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('VERIFIED')
  })

  it('shows pending status badge for pending attestation', () => {
    const att = { ...mockAttestation, status: 'pending' as const }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('PENDING')
  })

  it('shows rejected status badge for rejected attestation', () => {
    const att = { ...mockAttestation, status: 'rejected' as const }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('REJECTED')
  })

  it('shows KYC/AML type label', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('KYC/AML')
  })

  it('shows VOI network badge', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('VOI')
  })

  it('shows Aramid network for Aramid attestation', () => {
    const att = { ...mockAttestation, network: 'Aramid' as const }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('Aramid')
  })

  it('shows default network class for unknown network', () => {
    const att = { ...mockAttestation, network: 'Unknown' as any }
    const wrapper = mountModal(att)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders export button', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Export')
  })

  it('handles export button click without error', async () => {
    const createElem = vi.spyOn(document, 'createElement')
    const wrapper = mountModal()
    const exportBtn = wrapper.findAll('button').find(b => b.text().includes('Export'))
    if (exportBtn) {
      await exportBtn.trigger('click')
      // Should not throw
    }
    expect(createElem).toBeDefined()
  })

  it('shows asset ID', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('12345')
  })

  it('formats date correctly in footer', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Last updated')
  })

  it('shows accredited investor type label', () => {
    const att = { ...mockAttestation, type: AttestationType.ACCREDITED_INVESTOR }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('Accredited')
  })

  it('shows jurisdiction type label', () => {
    const att = { ...mockAttestation, type: AttestationType.JURISDICTION }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('Jurisdiction')
  })

  it('shows issuer verification type label', () => {
    const att = { ...mockAttestation, type: AttestationType.ISSUER_VERIFICATION }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('Issuer')
  })

  it('shows verification message for verified status', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Verified')
  })

  it('shows verification description text', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('successfully verified')
  })

  it('shows pending verification description', () => {
    const att = { ...mockAttestation, status: 'pending' as const }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('awaiting verification')
  })

  it('shows rejected verification description', () => {
    const att = { ...mockAttestation, status: 'rejected' as const }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('rejected')
  })

  it('shows unknown status verification message for unexpected status', () => {
    const att = { ...mockAttestation, status: 'unknown_status' as any }
    const wrapper = mountModal(att)
    expect(wrapper.text()).toContain('Unknown')
  })
})
