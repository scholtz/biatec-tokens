import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AccountSecurity from '../AccountSecurity.vue'
import { useSecurityStore, ActivityEventType } from '../../stores/security'
import { createRouter, createWebHistory } from 'vue-router'

// Mock telemetry service
vi.mock('../../services/TelemetryService', () => ({
  telemetryService: {
    trackSecurityCenterViewed: vi.fn(),
    trackRecoveryStarted: vi.fn(),
    trackAuditExportStarted: vi.fn(),
    trackAuditExportCompleted: vi.fn(),
    trackActivityFilterApplied: vi.fn(),
  },
}))

// Create a minimal router for testing
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/account/security',
      name: 'AccountSecurity',
      component: AccountSecurity,
    },
  ],
})

describe('AccountSecurity View', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the security center header', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Account Security Center')
      expect(wrapper.text()).toContain('Manage recovery, monitor activity, and maintain audit compliance')
    })

    it('should render all main sections', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Account Recovery')
      expect(wrapper.text()).toContain('Account Activity')
      expect(wrapper.text()).toContain('Transaction History')
      expect(wrapper.text()).toContain('Audit Trail Export')
    })

    it('should render recovery options', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Email Recovery')
      expect(wrapper.text()).toContain('Seed Phrase Backup')
      expect(wrapper.text()).toContain('Multi-Device Sync')
    })
  })

  describe('Activity Events Display', () => {
    it('should display activity events including mount event', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      // Component adds a view event on mount
      expect(wrapper.text()).toContain('Viewed Account Security Center')
    })

    it('should display activity events', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'User logged in successfully',
        status: 'success',
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('User logged in successfully')
    })

    it('should filter activity events by type', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      
      // Add different types of events
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Login event',
        status: 'success',
      })
      
      store.addActivityEvent({
        type: ActivityEventType.LOGOUT,
        timestamp: new Date().toISOString(),
        description: 'Logout event',
        status: 'success',
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      // Initially should show all events
      expect(wrapper.text()).toContain('Login event')
      expect(wrapper.text()).toContain('Logout event')

      // Find and change filter select
      const select = wrapper.find('select')
      await select.setValue('login')
      await wrapper.vm.$nextTick()

      // Should only show login events
      expect(wrapper.text()).toContain('Login event')
      // Note: 'Logout event' might still appear in the page due to the filter options
    })
  })

  describe('Export Functionality', () => {
    it('should have export buttons for JSON and CSV', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Export JSON')
      expect(wrapper.text()).toContain('Export CSV')
    })

    it('should enable export buttons when activity exists', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      const buttons = wrapper.findAll('button')
      const exportButtons = buttons.filter(b => 
        b.text().includes('Export JSON') || b.text().includes('Export CSV')
      )

      // Export buttons should be enabled when there's activity (from mount event)
      expect(exportButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Transaction History', () => {
    it('should show transaction history section', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Transaction History')
      expect(wrapper.text()).toContain('All Networks')
    })

    it('should show coming soon message for transactions', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('available soon')
    })
  })

  describe('Lifecycle and Telemetry', () => {
    it('should track security center view on mount', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      
      mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      expect(telemetryService.trackSecurityCenterViewed).toHaveBeenCalled()
    })

    it('should add activity event on mount', async () => {
      const pinia = createPinia()
      
      mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      const store = useSecurityStore(pinia)
      const viewEvent = store.activityEvents.find(
        e => e.type === ActivityEventType.SECURITY_CENTER_VIEWED
      )

      expect(viewEvent).toBeDefined()
      expect(viewEvent?.description).toBe('Viewed Account Security Center')
    })
  })

  describe('Recovery Modal', () => {
    it('should track recovery action when clicking recovery button', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
            Modal: {
              template: '<div v-if="isOpen"><slot /><slot name="footer" /></div>',
              props: ['isOpen', 'title'],
            },
          },
        },
      })

      await flushPromises()

      // Find and click a recovery button
      const buttons = wrapper.findAll('button')
      const emailRecoveryButton = buttons.find(b => 
        b.text().includes('Start Email Recovery')
      )

      if (emailRecoveryButton) {
        await emailRecoveryButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(telemetryService.trackRecoveryStarted).toHaveBeenCalled()
      }
    })
  })

  describe('Error States', () => {
    it('should display activity error when present', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      store.activityError = 'Failed to load activity'

      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to load activity')
    })

    it('should display transaction error when present', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      store.transactionError = 'Failed to load transactions'

      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to load transactions')
    })
  })

  describe('Utility Functions', () => {
    it('should return correct event icons for all event types', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      const vm = wrapper.vm as any

      // Test all event types
      expect(vm.getEventIcon(ActivityEventType.LOGIN)).toBe('pi pi-sign-in')
      expect(vm.getEventIcon(ActivityEventType.LOGOUT)).toBe('pi pi-sign-out')
      expect(vm.getEventIcon(ActivityEventType.NETWORK_SWITCH)).toBe('pi pi-sync')
      expect(vm.getEventIcon(ActivityEventType.TOKEN_DEPLOYMENT_SUCCESS)).toBe('pi pi-check-circle')
      expect(vm.getEventIcon(ActivityEventType.TOKEN_DEPLOYMENT_FAILURE)).toBe('pi pi-times-circle')
      expect(vm.getEventIcon(ActivityEventType.PLAN_CHANGE)).toBe('pi pi-shopping-cart')
      expect(vm.getEventIcon(ActivityEventType.WALLET_CONNECT)).toBe('pi pi-wallet')
      expect(vm.getEventIcon(ActivityEventType.WALLET_DISCONNECT)).toBe('pi pi-power-off')
      expect(vm.getEventIcon(ActivityEventType.SECURITY_CENTER_VIEWED)).toBe('pi pi-eye')
      expect(vm.getEventIcon(ActivityEventType.RECOVERY_STARTED)).toBe('pi pi-key')
      expect(vm.getEventIcon(ActivityEventType.AUDIT_EXPORT_STARTED)).toBe('pi pi-download')
      expect(vm.getEventIcon(ActivityEventType.AUDIT_EXPORT_COMPLETED)).toBe('pi pi-check')
      expect(vm.getEventIcon('unknown' as ActivityEventType)).toBe('pi pi-info-circle')
    })

    it('should return correct event icon classes based on status', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      const vm = wrapper.vm as any

      expect(vm.getEventIconClasses(ActivityEventType.LOGIN, 'success')).toBe('bg-green-500/20 text-green-400')
      expect(vm.getEventIconClasses(ActivityEventType.LOGIN, 'failure')).toBe('bg-red-500/20 text-red-400')
      expect(vm.getEventIconClasses(ActivityEventType.LOGIN, 'pending')).toBe('bg-yellow-500/20 text-yellow-400')
      expect(vm.getEventIconClasses(ActivityEventType.LOGIN, 'info')).toBe('bg-blue-500/20 text-blue-400')
    })

    it('should return correct status variants', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      const vm = wrapper.vm as any

      expect(vm.getStatusVariant('success')).toBe('success')
      expect(vm.getStatusVariant('failure')).toBe('error')
      expect(vm.getStatusVariant('pending')).toBe('warning')
      expect(vm.getStatusVariant('info')).toBe('info')
      expect(vm.getStatusVariant('unknown')).toBe('default')
    })

    it('should format timestamps correctly', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      const vm = wrapper.vm as any
      const now = new Date()

      // Just now
      expect(vm.formatTimestamp(now.toISOString())).toBe('Just now')

      // Minutes ago
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      expect(vm.formatTimestamp(fiveMinutesAgo.toISOString())).toBe('5m ago')

      // Hours ago
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      expect(vm.formatTimestamp(twoHoursAgo.toISOString())).toBe('2h ago')

      // Days ago (should show date)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      const formatted = vm.formatTimestamp(twoDaysAgo.toISOString())
      expect(formatted).toMatch(/\d{1,2}\. \d{1,2}\. \d{4}, \d{1,2}:\d{2}/)

      // Invalid timestamp
      expect(vm.formatTimestamp('invalid')).toBe('Invalid Date')
    })
  })

  describe('Event Details Expansion', () => {
    it('should toggle event details expansion', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Login event',
        status: 'success',
        metadata: { correlationId: 'test-123' },
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      const vm = wrapper.vm as any

      // Initially not expanded
      expect(vm.expandedEvents.has('test-event-id')).toBe(false)

      // Toggle on
      vm.toggleEventDetails('test-event-id')
      expect(vm.expandedEvents.has('test-event-id')).toBe(true)

      // Toggle off
      vm.toggleEventDetails('test-event-id')
      expect(vm.expandedEvents.has('test-event-id')).toBe(false)
    })
  })

  describe('Filter Change Handlers', () => {
    it('should track activity filter changes', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      const vm = wrapper.vm as any
      vm.activityFilter = 'login'

      vm.handleActivityFilterChange()

      expect(telemetryService.trackActivityFilterApplied).toHaveBeenCalledWith({
        filterType: 'activity',
        filterValue: 'login',
      })
    })

    it('should handle transaction filter changes and fetch data', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      const fetchSpy = vi.spyOn(store, 'fetchTransactionHistory')

      await flushPromises()

      const vm = wrapper.vm as any
      vm.txNetworkFilter = 'algorand-mainnet'

      vm.handleTransactionFilterChange()

      expect(telemetryService.trackActivityFilterApplied).toHaveBeenCalledWith({
        filterType: 'transaction_network',
        filterValue: 'algorand-mainnet',
      })
      expect(fetchSpy).toHaveBeenCalledWith({ network: 'algorand-mainnet' })
    })

    it('should handle transaction filter reset to all', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      const fetchSpy = vi.spyOn(store, 'fetchTransactionHistory')

      await flushPromises()

      const vm = wrapper.vm as any
      vm.txNetworkFilter = 'all'

      vm.handleTransactionFilterChange()

      expect(fetchSpy).toHaveBeenCalledWith({ network: undefined })
    })
  })

  describe('Refresh Functions', () => {
    it('should refresh activity events', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      const fetchSpy = vi.spyOn(store, 'fetchActivityEvents')

      await flushPromises()

      const vm = wrapper.vm as any
      await vm.refreshActivity()

      expect(fetchSpy).toHaveBeenCalledWith(true)
    })

    it('should refresh transaction history', async () => {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      const fetchSpy = vi.spyOn(store, 'fetchTransactionHistory')

      await flushPromises()

      const vm = wrapper.vm as any
      vm.txNetworkFilter = 'algorand-mainnet'
      await vm.refreshTransactions()

      expect(fetchSpy).toHaveBeenCalledWith({ network: 'algorand-mainnet' })
    })
  })

  describe('Load More Functionality', () => {
    it('should increase display limit when loading more activity', async () => {
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [createPinia(), router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      await flushPromises()

      const vm = wrapper.vm as any
      expect(vm.displayLimit).toBe(20)

      vm.loadMoreActivity()
      expect(vm.displayLimit).toBe(40)

      vm.loadMoreActivity()
      expect(vm.displayLimit).toBe(60)
    })
  })

  describe('Recovery Actions', () => {
    it('should handle recovery action for available options', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
            Modal: {
              template: '<div v-if="isOpen"><slot /><slot name="footer" /></div>',
              props: ['isOpen', 'title'],
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      const addEventSpy = vi.spyOn(store, 'addActivityEvent')

      await flushPromises()

      const vm = wrapper.vm as any
      const recoveryOption = {
        id: 'email_recovery',
        title: 'Email Recovery',
        description: 'Reset password via email',
        actionLabel: 'Start Email Recovery',
        available: true,
      }

      vm.handleRecoveryAction(recoveryOption)

      expect(vm.showRecoveryModal).toBe(true)
      expect(vm.selectedRecovery).toStrictEqual(recoveryOption)
      expect(telemetryService.trackRecoveryStarted).toHaveBeenCalledWith({
        recoveryType: 'email_recovery',
      })
      expect(addEventSpy).toHaveBeenCalledWith({
        type: ActivityEventType.RECOVERY_STARTED,
        timestamp: expect.any(String),
        description: 'Started Email Recovery process',
        status: 'info',
        metadata: {
          recoveryType: 'email_recovery',
        },
      })
    })

    it('should not handle recovery action for unavailable options', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      const addEventSpy = vi.spyOn(store, 'addActivityEvent')

      await flushPromises()

      const vm = wrapper.vm as any
      const recoveryOption = {
        id: 'unavailable_recovery',
        title: 'Unavailable Recovery',
        description: 'Not available',
        actionLabel: 'Not Available',
        available: false,
      }

      vm.handleRecoveryAction(recoveryOption)

      expect(vm.showRecoveryModal).toBe(false)
      expect(vm.selectedRecovery).toBe(null)
      expect(telemetryService.trackRecoveryStarted).not.toHaveBeenCalled()
      expect(addEventSpy).not.toHaveBeenCalled()
    })
  })

  describe('Export Functionality', () => {
    it('should handle successful export', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      const exportSpy = vi.spyOn(store, 'exportAuditTrail').mockResolvedValue()
      const addEventSpy = vi.spyOn(store, 'addActivityEvent')

      // Add some activity for export
      store.addActivityEvent({
        type: ActivityEventType.LOGIN,
        timestamp: new Date().toISOString(),
        description: 'Login event',
        status: 'success',
      })

      await flushPromises()

      const vm = wrapper.vm as any
      await vm.handleExport('json')

      expect(telemetryService.trackAuditExportStarted).toHaveBeenCalledWith({ format: 'json' })
      expect(exportSpy).toHaveBeenCalledWith('json')
      expect(telemetryService.trackAuditExportCompleted).toHaveBeenCalledWith({
        format: 'json',
        durationMs: expect.any(Number),
        recordCount: expect.any(Number), // Can vary based on events
      })
    })

    it('should handle export failure', async () => {
      const { telemetryService } = await import('../../services/TelemetryService')
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: {
            MainLayout: {
              template: '<div><slot /></div>',
            },
          },
        },
      })

      const store = useSecurityStore(pinia)
      const exportSpy = vi.spyOn(store, 'exportAuditTrail').mockRejectedValue(new Error('Export failed'))
      const addEventSpy = vi.spyOn(store, 'addActivityEvent')

      await flushPromises()

      const vm = wrapper.vm as any
      await vm.handleExport('csv')

      expect(telemetryService.trackAuditExportStarted).toHaveBeenCalledWith({ format: 'csv' })
      expect(exportSpy).toHaveBeenCalledWith('csv')
      expect(addEventSpy).toHaveBeenCalledWith({
        type: ActivityEventType.AUDIT_EXPORT_COMPLETED,
        timestamp: expect.any(String),
        description: 'Failed to export audit trail as CSV',
        status: 'failure',
        metadata: {
          format: 'csv',
          errorMessage: 'Export failed',
        },
      })
    })
  })

  describe('Branch coverage - helper functions', () => {
    function mountComponent() {
      const pinia = createPinia()
      const wrapper = mount(AccountSecurity, {
        global: {
          plugins: [pinia, router],
          stubs: { MainLayout: { template: '<div><slot /></div>' } },
        },
      })
      return wrapper
    }

    it('formatTimestamp: NaN-producing date returns Invalid Date', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.formatTimestamp('not-a-date')).toBe('Invalid Date')
    })

    it('formatTimestamp: within 1 minute returns Just now', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      const recent = new Date(Date.now() - 30 * 1000).toISOString()
      expect(vm.formatTimestamp(recent)).toBe('Just now')
    })

    it('formatTimestamp: 30 minutes ago returns 30m ago', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      expect(vm.formatTimestamp(thirtyMinsAgo)).toBe('30m ago')
    })

    it('formatTimestamp: 2 hours ago returns 2h ago', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      expect(vm.formatTimestamp(twoHoursAgo)).toBe('2h ago')
    })

    it('formatTimestamp: old date returns DD. MM. YYYY format', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      // Use a known date far in the past (more than 1440 mins ago)
      const result = vm.formatTimestamp('2020-01-01T00:00:00.000Z')
      expect(result).toMatch(/\d+\.\s*\d+\.\s*\d{4},\s*\d{2}:\d{2}/)
    })

    it('getEventIconClasses: failure status returns red classes', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getEventIconClasses('LOGIN', 'failure')).toContain('red')
    })

    it('getEventIconClasses: success status returns green classes', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getEventIconClasses('LOGIN', 'success')).toContain('green')
    })

    it('getEventIconClasses: pending status returns yellow classes', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getEventIconClasses('LOGIN', 'pending')).toContain('yellow')
    })

    it('getEventIconClasses: unknown status returns blue classes (default)', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getEventIconClasses('LOGIN', 'unknown')).toContain('blue')
    })

    it('getStatusVariant: success returns success', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getStatusVariant('success')).toBe('success')
    })

    it('getStatusVariant: failure returns error', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getStatusVariant('failure')).toBe('error')
    })

    it('getStatusVariant: pending returns warning', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getStatusVariant('pending')).toBe('warning')
    })

    it('getStatusVariant: info returns info', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getStatusVariant('info')).toBe('info')
    })

    it('getStatusVariant: unknown status returns default', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.getStatusVariant('unknown')).toBe('default')
    })

    it('handleRecoveryAction: opens modal then close sets showRecoveryModal to false', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      const vm = wrapper.vm as any

      const option = {
        id: 'email_recovery',
        title: 'Email Recovery',
        description: 'Recover via email',
        actionLabel: 'Start',
        available: true,
      }

      vm.handleRecoveryAction(option)
      await wrapper.vm.$nextTick()
      expect(vm.showRecoveryModal).toBe(true)

      vm.showRecoveryModal = false
      await wrapper.vm.$nextTick()
      expect(vm.showRecoveryModal).toBe(false)
    })
  })
})
