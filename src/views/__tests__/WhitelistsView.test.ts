import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import WhitelistsView from '../WhitelistsView.vue'
import { useWhitelistStore } from '../../stores/whitelist'
import type { WhitelistEntry } from '../../types/whitelist'

// Mock components
vi.mock('../../layout/MainLayout.vue', () => ({
  default: {
    name: 'MainLayout',
    template: '<div class="main-layout"><slot /></div>',
  },
}))

vi.mock('../../components/whitelist/WhitelistTable.vue', () => ({
  default: {
    name: 'WhitelistTable',
    template: '<div class="whitelist-table">Whitelist Table</div>',
    props: ['conflicts'],
    emits: ['view-details', 'approve', 'reject'],
  },
}))

vi.mock('../../components/whitelist/WhitelistDetailPanel.vue', () => ({
  default: {
    name: 'WhitelistDetailPanel',
    template: '<div class="whitelist-detail-panel">Detail Panel</div>',
    props: ['entry'],
    emits: ['close', 'updated'],
  },
}))

vi.mock('../../components/whitelist/WhitelistEntryForm.vue', () => ({
  default: {
    name: 'WhitelistEntryForm',
    template: '<div class="whitelist-entry-form">Entry Form</div>',
    emits: ['submit', 'cancel'],
  },
}))

vi.mock('../../components/whitelist/CSVImportDialog.vue', () => ({
  default: {
    name: 'CSVImportDialog',
    template: '<div class="csv-import-dialog">CSV Import</div>',
    props: ['show'],
    emits: ['close'],
  },
}))

vi.mock('../../components/ui/Modal.vue', () => ({
  default: {
    name: 'Modal',
    template: '<div v-if="show" class="modal"><slot /></div>',
    props: ['show', 'size'],
    emits: ['close'],
  },
}))

describe('WhitelistsView', () => {
  let wrapper: VueWrapper
  let whitelistStore: ReturnType<typeof useWhitelistStore>

  const createMockEntry = (id: string): WhitelistEntry => ({
    id,
    name: `Entry ${id}`,
    email: `entry${id}@example.com`,
    entityType: 'individual',
    status: 'approved',
    jurisdictionCode: 'US',
    jurisdictionName: 'United States',
    riskLevel: 'low',
    kycStatus: 'verified',
    accreditationStatus: 'not_required',
    documentationComplete: true,
    documentsUploaded: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin@biatec.io',
    auditTrail: [],
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/compliance/whitelists',
        name: 'WhitelistManagement',
        component: { template: '<div />' },
      },
    ],
  })

  beforeEach(() => {
    wrapper = mount(WhitelistsView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
          router,
        ],
      },
    })

    whitelistStore = useWhitelistStore()
  })

  describe('Component Rendering', () => {
    it('should render the view with correct title', () => {
      expect(wrapper.find('h1').text()).toContain('Whitelist Management')
    })

    it('should display MICA compliance description', () => {
      expect(wrapper.text()).toContain('MICA-compliant investor whitelist')
    })

    it('should render summary cards', () => {
      const cards = wrapper.findAll('.glass-effect')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should show total entries in summary card', async () => {
      whitelistStore.summary = {
        totalEntries: 10,
        approvedCount: 8,
        pendingCount: 2,
        rejectedCount: 0,
        underReviewCount: 0,
        expiredCount: 0,
        jurisdictionsCovered: 5,
        highRiskCount: 1,
        lastUpdated: new Date().toISOString(),
      }

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('10')
    })

    it('should show approved count in summary card', async () => {
      whitelistStore.summary = {
        totalEntries: 10,
        approvedCount: 8,
        pendingCount: 2,
        rejectedCount: 0,
        underReviewCount: 0,
        expiredCount: 0,
        jurisdictionsCovered: 5,
        highRiskCount: 1,
        lastUpdated: new Date().toISOString(),
      }

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('8')
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no entries', () => {
      whitelistStore.entries = []
      whitelistStore.isLoading = false

      wrapper = mount(WhitelistsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                whitelist: {
                  entries: [],
                  isLoading: false,
                },
              },
            }),
            router,
          ],
        },
      })

      expect(wrapper.text()).toContain('No Whitelist Entries Yet')
    })

    it('should show import and add buttons in empty state', () => {
      whitelistStore.entries = []
      whitelistStore.isLoading = false

      wrapper = mount(WhitelistsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                whitelist: {
                  entries: [],
                  isLoading: false,
                },
              },
            }),
            router,
          ],
        },
      })

      expect(wrapper.text()).toContain('Import from CSV')
      expect(wrapper.text()).toContain('Add First Entry')
    })

    it('should show getting started guide in empty state', () => {
      whitelistStore.entries = []
      whitelistStore.isLoading = false

      wrapper = mount(WhitelistsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                whitelist: {
                  entries: [],
                  isLoading: false,
                },
              },
            }),
            router,
          ],
        },
      })

      expect(wrapper.text()).toContain('Getting Started with Whitelist Management')
    })
  })

  describe('Conflict Warnings', () => {
    it('should render without errors', () => {
      // Test that component renders without errors
      expect(wrapper.exists()).toBe(true)
    })

    it('should pass conflicts prop to WhitelistTable', () => {
      const table = wrapper.findComponent({ name: 'WhitelistTable' })
      expect(table.exists()).toBe(true)
      expect(table.props()).toHaveProperty('conflicts')
    })
  })

  describe('Action Buttons', () => {
    it('should have import CSV button', () => {
      const buttons = wrapper.findAll('button')
      const importButton = buttons.find(btn => btn.text().includes('Import CSV'))
      expect(importButton).toBeDefined()
    })

    it('should have add entry button', () => {
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find(btn => btn.text().includes('Add Entry'))
      expect(addButton).toBeDefined()
    })

    it('should open import modal when import button clicked', async () => {
      const buttons = wrapper.findAll('button')
      const importButton = buttons.find(btn => btn.text().includes('Import CSV'))
      
      await importButton?.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showImportModal).toBe(true)
    })

    it('should open create modal when add button clicked', async () => {
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find(btn => btn.text().includes('Add Entry'))
      
      await addButton?.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showCreateModal).toBe(true)
    })
  })

  describe('Data Loading', () => {
    it('should fetch whitelist entries on mount', () => {
      expect(whitelistStore.fetchWhitelistEntries).toHaveBeenCalled()
    })

    it('should fetch whitelist summary on mount', () => {
      expect(whitelistStore.fetchWhitelistSummary).toHaveBeenCalled()
    })

    it('should check jurisdiction conflicts on mount', () => {
      expect(whitelistStore.checkJurisdictionConflicts).toHaveBeenCalled()
    })
  })

  describe('Table Display', () => {
    it('should show whitelist table when entries exist', () => {
      whitelistStore.entries = [createMockEntry('1')]

      wrapper = mount(WhitelistsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                whitelist: {
                  entries: [createMockEntry('1')],
                  isLoading: false,
                },
              },
            }),
            router,
          ],
        },
      })

      expect(wrapper.findComponent({ name: 'WhitelistTable' }).exists()).toBe(true)
    })

    it('should not show empty state when entries exist', () => {
      whitelistStore.entries = [createMockEntry('1')]

      wrapper = mount(WhitelistsView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                whitelist: {
                  entries: [createMockEntry('1')],
                  isLoading: false,
                },
              },
            }),
            router,
          ],
        },
      })

      expect(wrapper.text()).not.toContain('No Whitelist Entries Yet')
    })
  })
})
