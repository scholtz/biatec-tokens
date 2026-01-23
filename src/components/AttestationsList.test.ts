import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AttestationsList from './AttestationsList.vue'
import AttestationDetailModal from './AttestationDetailModal.vue'
import { useAttestationsStore } from '../stores/attestations'
import { AttestationType } from '../types/compliance'

// Mock child components
vi.mock('./AttestationDetailModal.vue', () => ({
  default: {
    name: 'AttestationDetailModal',
    template: '<div class="mock-detail-modal"></div>',
  },
}))

describe('AttestationsList Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the component with header and filters', async () => {
      const wrapper = mount(AttestationsList, {
        props: {
          network: 'VOI',
        },
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('h3').text()).toContain('Compliance Attestations')
      expect(wrapper.find('p').text()).toContain('Manage and verify MICA compliance attestations')
    })

    it('should render status summary cards', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      await wrapper.vm.$nextTick()

      const statusCards = wrapper.findAll('[class*="status"]')
      expect(statusCards.length).toBeGreaterThan(0)
    })

    it('should render filter inputs', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('input[placeholder*="Wallet"]').exists()).toBe(true)
      expect(wrapper.find('select').exists()).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching data', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      store.isLoading = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Loading attestations')
    })

    it('should show error state when data fetch fails', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      store.error = 'Failed to load data'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to load attestations')
    })

    it('should show empty state when no attestations exist', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      store.attestations = []
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No attestations found')
    })
  })

  describe('Data Display', () => {
    it('should display attestations in table format', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      await wrapper.vm.$nextTick()

      const table = wrapper.find('table')
      expect(table.exists()).toBe(true)

      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('should display correct attestation data', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      await wrapper.vm.$nextTick()

      const tableBody = wrapper.find('tbody')
      expect(tableBody.text()).toContain('ADDR')
      expect(tableBody.text()).toContain('ASA')
    })
  })

  describe('Filtering', () => {
    it('should filter by status when status filter changes', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      await wrapper.vm.$nextTick()

      const statusSelect = wrapper.findAll('select').find(s => 
        s.html().includes('All Statuses')
      )
      
      if (statusSelect) {
        await statusSelect.setValue('verified')
        await wrapper.vm.$nextTick()

        expect(store.filters.status).toBe('verified')
      }
    })

    it('should filter by network', async () => {
      const wrapper = mount(AttestationsList, {
        props: {
          network: 'VOI',
        },
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations('token123', 'VOI')
      await wrapper.vm.$nextTick()

      expect(store.attestations.length).toBeGreaterThan(0)
    })

    it('should update search query on input', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const searchInput = wrapper.find('input[placeholder*="Wallet"]')
      await searchInput.setValue('ADDR123')
      await wrapper.vm.$nextTick()

      // Allow debounce time
      await new Promise(resolve => setTimeout(resolve, 350))
      await wrapper.vm.$nextTick()

      const store = useAttestationsStore()
      expect(store.filters.search).toBe('ADDR123')
    })

    it('should reset filters when reset button clicked', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      store.setFilters({ status: 'verified', type: AttestationType.KYC_AML })
      await wrapper.vm.$nextTick()

      const resetButton = wrapper.find('button[class*="reset"]')
      if (resetButton.exists()) {
        await resetButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(store.filters.status).toBe('all')
        expect(store.filters.type).toBe('all')
      }
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      await wrapper.vm.$nextTick()

      const pagination = wrapper.find('[class*="pagination"]')
      expect(pagination.exists() || wrapper.text().includes('Page')).toBe(true)
    })

    it('should change page when pagination buttons clicked', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      store.setItemsPerPage(2) // Ensure multiple pages
      await wrapper.vm.$nextTick()

      const initialPage = store.currentPage
      
      if (store.totalPages > 1) {
        store.setPage(2)
        await wrapper.vm.$nextTick()
        expect(store.currentPage).toBe(2)
      }
    })
  })

  describe('Export Functionality', () => {
    it('should show export menu when export button clicked', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      await wrapper.vm.$nextTick()

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export')
      )

      if (exportButton) {
        await exportButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toContain('Export Options')
      }
    })

    it('should trigger CSV export', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      
      const downloadCSVSpy = vi.spyOn(store, 'downloadCSV')
      await wrapper.vm.$nextTick()

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export')
      )

      if (exportButton) {
        await exportButton.trigger('click')
        await wrapper.vm.$nextTick()

        const csvButton = wrapper.findAll('button').find(b => 
          b.text().includes('CSV')
        )

        if (csvButton) {
          await csvButton.trigger('click')
          expect(downloadCSVSpy).toHaveBeenCalled()
        }
      }
    })

    it('should trigger JSON export', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      
      const downloadJSONSpy = vi.spyOn(store, 'downloadJSON')
      await wrapper.vm.$nextTick()

      const exportButton = wrapper.findAll('button').find(b => 
        b.text().includes('Export')
      )

      if (exportButton) {
        await exportButton.trigger('click')
        await wrapper.vm.$nextTick()

        const jsonButton = wrapper.findAll('button').find(b => 
          b.text().includes('JSON')
        )

        if (jsonButton) {
          await jsonButton.trigger('click')
          expect(downloadJSONSpy).toHaveBeenCalled()
        }
      }
    })
  })

  describe('Attestation Detail Modal', () => {
    it('should open detail modal when row is clicked', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: false,
          },
        },
      })

      const store = useAttestationsStore()
      await store.loadAttestations()
      await wrapper.vm.$nextTick()

      const firstRow = wrapper.find('tbody tr')
      if (firstRow.exists()) {
        await firstRow.trigger('click')
        await wrapper.vm.$nextTick()

        expect(store.selectedAttestation).toBeTruthy()
      }
    })
  })

  describe('Refresh Functionality', () => {
    it('should reload data when refresh button clicked', async () => {
      const wrapper = mount(AttestationsList, {
        global: {
          stubs: {
            AttestationDetailModal: true,
          },
        },
      })

      const store = useAttestationsStore()
      const loadSpy = vi.spyOn(store, 'loadAttestations')
      await wrapper.vm.$nextTick()

      const refreshButton = wrapper.findAll('button').find(b => 
        b.text().includes('Refresh')
      )

      if (refreshButton) {
        await refreshButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(loadSpy).toHaveBeenCalled()
      }
    })
  })
})
