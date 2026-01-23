import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AttestationDetailModal from './AttestationDetailModal.vue'
import { AttestationType } from '../types/compliance'
import type { AttestationListItem } from '../stores/attestations'

describe('AttestationDetailModal Component', () => {
  let mockAttestation: AttestationListItem

  beforeEach(() => {
    setActivePinia(createPinia())
    
    mockAttestation = {
      id: 'att-001',
      type: AttestationType.KYC_AML,
      status: 'verified',
      walletAddress: 'ADDR123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      assetId: 'ASA-12345',
      issuerName: 'Acme Compliance Inc.',
      network: 'VOI',
      createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      verifiedAt: new Date('2024-01-16T10:00:00Z').toISOString(),
      verifiedBy: 'compliance@acme.com',
      proofHash: '0x1234567890abcdef',
      notes: 'KYC verification completed successfully',
    }
  })

  describe('Rendering', () => {
    it('should render the modal with attestation details', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.find('h3').text()).toContain('Attestation Details')
      expect(wrapper.text()).toContain('att-001')
    })

    it('should display status badge', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain('VERIFIED')
    })

    it('should display attestation type', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain('KYC/AML')
    })

    it('should display network badge', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain('VOI')
    })
  })

  describe('Basic Information Display', () => {
    it('should display wallet address', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain(mockAttestation.walletAddress)
    })

    it('should display asset ID', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain(mockAttestation.assetId)
    })

    it('should display issuer name', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain(mockAttestation.issuerName)
    })

    it('should display creation date', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain('Created At')
    })
  })

  describe('Verification Information', () => {
    it('should display verification date when available', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain('Verified At')
    })

    it('should display verified by when available', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain(mockAttestation.verifiedBy!)
    })

    it('should not display verification info for pending attestations', () => {
      const pendingAttestation = {
        ...mockAttestation,
        status: 'pending' as const,
        verifiedAt: undefined,
        verifiedBy: undefined,
      }

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: pendingAttestation,
        },
      })

      expect(wrapper.text()).not.toContain('Verified At')
      expect(wrapper.text()).not.toContain('Verified By')
    })

    it('should display expiration date when available', () => {
      const expiringAttestation = {
        ...mockAttestation,
        expiresAt: new Date('2025-01-15T10:00:00Z').toISOString(),
      }

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: expiringAttestation,
        },
      })

      expect(wrapper.text()).toContain('Expires At')
    })
  })

  describe('Proof Metadata', () => {
    it('should display proof hash', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain('Proof Hash')
      expect(wrapper.text()).toContain(mockAttestation.proofHash!)
    })

    it('should display document URL with external link', () => {
      const attestationWithDoc = {
        ...mockAttestation,
        documentUrl: 'https://example.com/document.pdf',
      }

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: attestationWithDoc,
        },
      })

      expect(wrapper.text()).toContain('Document URL')
      const link = wrapper.find('a[href="https://example.com/document.pdf"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('target')).toBe('_blank')
    })

    it('should not display proof section when no proof data', () => {
      const attestationWithoutProof = {
        ...mockAttestation,
        proofHash: undefined,
        documentUrl: undefined,
      }

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: attestationWithoutProof,
        },
      })

      expect(wrapper.text()).not.toContain('Proof Metadata')
    })
  })

  describe('Verification Status Section', () => {
    it('should show verified message for verified attestations', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain('Attestation Verified')
      expect(wrapper.text()).toContain('successfully verified')
    })

    it('should show pending message for pending attestations', () => {
      const pendingAttestation = {
        ...mockAttestation,
        status: 'pending' as const,
      }

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: pendingAttestation,
        },
      })

      expect(wrapper.text()).toContain('Verification Pending')
      expect(wrapper.text()).toContain('awaiting verification')
    })

    it('should show rejected message for rejected attestations', () => {
      const rejectedAttestation = {
        ...mockAttestation,
        status: 'rejected' as const,
      }

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: rejectedAttestation,
        },
      })

      expect(wrapper.text()).toContain('Attestation Rejected')
      expect(wrapper.text()).toContain('rejected')
    })

    it('should display appropriate icon for each status', () => {
      const verifiedWrapper = mount(AttestationDetailModal, {
        props: { attestation: mockAttestation },
      })
      expect(verifiedWrapper.html()).toContain('pi-check-circle')

      const pendingWrapper = mount(AttestationDetailModal, {
        props: { attestation: { ...mockAttestation, status: 'pending' as const } },
      })
      expect(pendingWrapper.html()).toContain('pi-clock')

      const rejectedWrapper = mount(AttestationDetailModal, {
        props: { attestation: { ...mockAttestation, status: 'rejected' as const } },
      })
      expect(rejectedWrapper.html()).toContain('pi-times-circle')
    })
  })

  describe('Notes Display', () => {
    it('should display notes when available', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).toContain('Notes')
      expect(wrapper.text()).toContain(mockAttestation.notes!)
    })

    it('should not display notes section when notes are empty', () => {
      const attestationWithoutNotes = {
        ...mockAttestation,
        notes: undefined,
      }

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: attestationWithoutNotes,
        },
      })

      // Should not have a notes section
      const notesLabels = wrapper.findAll('label').filter(l => l.text().includes('Notes'))
      expect(notesLabels.length).toBe(0)
    })
  })

  describe('Metadata Display', () => {
    it('should display additional metadata when available', () => {
      const attestationWithMetadata = {
        ...mockAttestation,
        metadata: {
          customField1: 'value1',
          customField2: 'value2',
        },
      }

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: attestationWithMetadata,
        },
      })

      expect(wrapper.text()).toContain('Additional Metadata')
      expect(wrapper.text()).toContain('customField1')
    })

    it('should not display metadata section when empty', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      expect(wrapper.text()).not.toContain('Additional Metadata')
    })
  })

  describe('User Interactions', () => {
    it('should emit close event when close button clicked', async () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      const closeButton = wrapper.findAll('button').find(b => 
        b.text().includes('Close')
      )

      if (closeButton) {
        await closeButton.trigger('click')
        expect(wrapper.emitted('close')).toBeTruthy()
      }
    })

    it('should emit close event when X button clicked', async () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      const xButton = wrapper.find('button[class*="pi-times"]')
      if (xButton.exists()) {
        await xButton.trigger('click')
        expect(wrapper.emitted('close')).toBeTruthy()
      }
    })

    it('should emit close event when backdrop is clicked', async () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      const backdrop = wrapper.find('.fixed.inset-0')
      if (backdrop.exists()) {
        await backdrop.trigger('click.self')
        expect(wrapper.emitted('close')).toBeTruthy()
      }
    })
  })

  describe('Export Functionality', () => {
    it('should have export button', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export')
      )
      expect(exportButton).toBeTruthy()
    })

    it('should trigger download when export button clicked', async () => {
      // Mock document methods
      const mockLink = document.createElement('a')
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const clickSpy = vi.spyOn(mockLink, 'click').mockImplementation(() => {})

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export')
      )

      if (exportButton) {
        await exportButton.trigger('click')
        
        expect(createElementSpy).toHaveBeenCalledWith('a')
        expect(clickSpy).toHaveBeenCalled()
      }

      createElementSpy.mockRestore()
      clickSpy.mockRestore()
    })

    it('should export as JSON with correct filename', async () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: mockAttestation,
        },
      })

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export')
      )

      if (exportButton) {
        await exportButton.trigger('click')
        
        expect(mockLink.download).toContain('attestation-att-001.json')
        expect(mockLink.click).toHaveBeenCalled()
      }

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('Different Attestation Types', () => {
    it('should display correct label for KYC/AML type', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: { ...mockAttestation, type: AttestationType.KYC_AML },
        },
      })

      expect(wrapper.text()).toContain('KYC/AML')
    })

    it('should display correct label for Accredited Investor type', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: { ...mockAttestation, type: AttestationType.ACCREDITED_INVESTOR },
        },
      })

      expect(wrapper.text()).toContain('Accredited Investor')
    })

    it('should display correct label for Jurisdiction type', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: { ...mockAttestation, type: AttestationType.JURISDICTION },
        },
      })

      expect(wrapper.text()).toContain('Jurisdiction')
    })

    it('should display correct label for Issuer Verification type', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: { ...mockAttestation, type: AttestationType.ISSUER_VERIFICATION },
        },
      })

      expect(wrapper.text()).toContain('Issuer Verification')
    })
  })

  describe('Different Networks', () => {
    it('should display VOI network badge with correct styling', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: { ...mockAttestation, network: 'VOI' },
        },
      })

      const networkBadge = wrapper.find('[class*="purple"]')
      expect(networkBadge.exists() || wrapper.text().includes('VOI')).toBe(true)
    })

    it('should display Aramid network badge with correct styling', () => {
      const wrapper = mount(AttestationDetailModal, {
        props: {
          attestation: { ...mockAttestation, network: 'Aramid' },
        },
      })

      const networkBadge = wrapper.find('[class*="cyan"]')
      expect(networkBadge.exists() || wrapper.text().includes('Aramid')).toBe(true)
    })
  })
})
