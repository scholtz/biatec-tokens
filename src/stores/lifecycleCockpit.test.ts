/**
 * Lifecycle Cockpit Store Tests
 * 
 * Tests for the lifecycle cockpit state management including
 * role permissions, action prioritization, and data loading.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLifecycleCockpitStore } from './lifecycleCockpit'
import type { UserRole } from '../types/lifecycleCockpit'

describe('useLifecycleCockpitStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have default initial state', () => {
      const store = useLifecycleCockpitStore()
      
      expect(store.userRole).toBe('issuer_admin')
      expect(store.readinessStatus).toBeNull()
      expect(store.telemetry).toBeNull()
      expect(store.actions).toEqual([])
      expect(store.walletDiagnostics).toBeNull()
      expect(store.riskIndicators).toBeNull()
      expect(store.evidenceTraces).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.lastRefresh).toBeNull()
      expect(store.error).toBeNull()
    })
  })

  describe('Role Permissions', () => {
    it('should return correct permissions for issuer_admin role', () => {
      const store = useLifecycleCockpitStore()
      store.setUserRole('issuer_admin')
      
      expect(store.rolePermissions).toEqual({
        role: 'issuer_admin',
        canViewReadiness: true,
        canViewTelemetry: true,
        canViewActions: true,
        canViewWalletDiagnostics: true,
        canViewRiskIndicators: true,
        canViewEvidence: true,
        canCompleteActions: true,
        canExportReports: true,
      })
    })

    it('should return correct permissions for compliance role', () => {
      const store = useLifecycleCockpitStore()
      store.setUserRole('compliance')
      
      expect(store.rolePermissions).toEqual({
        role: 'compliance',
        canViewReadiness: true,
        canViewTelemetry: false,
        canViewActions: true,
        canViewWalletDiagnostics: false,
        canViewRiskIndicators: true,
        canViewEvidence: true,
        canCompleteActions: true,
        canExportReports: true,
      })
    })

    it('should return correct permissions for operations role', () => {
      const store = useLifecycleCockpitStore()
      store.setUserRole('operations')
      
      expect(store.rolePermissions).toEqual({
        role: 'operations',
        canViewReadiness: false,
        canViewTelemetry: true,
        canViewActions: true,
        canViewWalletDiagnostics: true,
        canViewRiskIndicators: true,
        canViewEvidence: false,
        canCompleteActions: false,
        canExportReports: true,
      })
    })

    it('should return correct permissions for treasury role', () => {
      const store = useLifecycleCockpitStore()
      store.setUserRole('treasury')
      
      expect(store.rolePermissions).toEqual({
        role: 'treasury',
        canViewReadiness: false,
        canViewTelemetry: true,
        canViewActions: false,
        canViewWalletDiagnostics: false,
        canViewRiskIndicators: true,
        canViewEvidence: false,
        canCompleteActions: false,
        canExportReports: true,
      })
    })

    it('should update role when setUserRole is called', () => {
      const store = useLifecycleCockpitStore()
      
      store.setUserRole('compliance')
      expect(store.userRole).toBe('compliance')
      expect(store.rolePermissions.canViewEvidence).toBe(true)
      
      store.setUserRole('treasury')
      expect(store.userRole).toBe('treasury')
      expect(store.rolePermissions.canViewEvidence).toBe(false)
    })
  })

  describe('Action Prioritization', () => {
    it('should prioritize actions correctly', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      const priorities = store.prioritizedActions.map(a => a.priority)
      
      // Actions should be sorted by priority (critical first)
      for (let i = 0; i < priorities.length - 1; i++) {
        const currentPriorityIndex = ['critical', 'high', 'medium', 'low'].indexOf(priorities[i])
        const nextPriorityIndex = ['critical', 'high', 'medium', 'low'].indexOf(priorities[i + 1])
        expect(currentPriorityIndex).toBeLessThanOrEqual(nextPriorityIndex)
      }
    })

    it('should only include pending and in_progress actions', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      store.actions.push({
        id: 'completed-action',
        priority: 'critical',
        status: 'completed',
        title: 'Completed Action',
        description: 'This is completed',
        rationale: 'Test',
        expectedImpact: 'None',
        deepLink: '/test',
        category: 'setup',
        createdAt: new Date(),
        completedAt: new Date(),
      })
      
      const pendingActionIds = store.prioritizedActions.map(a => a.id)
      expect(pendingActionIds).not.toContain('completed-action')
    })

    it('should sort actions by creation date when priority is equal', async () => {
      const store = useLifecycleCockpitStore()
      
      const oldDate = new Date('2024-01-01')
      const newDate = new Date('2024-01-02')
      
      store.actions = [
        {
          id: 'newer',
          priority: 'high',
          status: 'pending',
          title: 'Newer Action',
          description: 'Created later',
          rationale: 'Test',
          expectedImpact: 'Test',
          deepLink: '/test',
          category: 'setup',
          createdAt: newDate,
        },
        {
          id: 'older',
          priority: 'high',
          status: 'pending',
          title: 'Older Action',
          description: 'Created earlier',
          rationale: 'Test',
          expectedImpact: 'Test',
          deepLink: '/test',
          category: 'setup',
          createdAt: oldDate,
        },
      ]
      
      expect(store.prioritizedActions[0].id).toBe('older')
      expect(store.prioritizedActions[1].id).toBe('newer')
    })

    it('should count critical actions correctly', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      const criticalCount = store.actions.filter(
        a => a.priority === 'critical' && a.status === 'pending'
      ).length
      
      expect(store.criticalActionsCount).toBe(criticalCount)
    })
  })

  describe('Action Status Updates', () => {
    it('should update action status', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      const actionId = store.actions[0]?.id
      if (actionId) {
        store.updateActionStatus(actionId, 'completed')
        
        const updatedAction = store.actions.find(a => a.id === actionId)
        expect(updatedAction?.status).toBe('completed')
        expect(updatedAction?.completedAt).toBeInstanceOf(Date)
      }
    })

    it('should not update non-existent action', () => {
      const store = useLifecycleCockpitStore()
      
      store.updateActionStatus('non-existent-id', 'completed')
      
      // Should not throw error
      expect(true).toBe(true)
    })
  })

  describe('Data Initialization', () => {
    it('should initialize with loading state', async () => {
      const store = useLifecycleCockpitStore()
      
      const initPromise = store.initialize()
      expect(store.isLoading).toBe(true)
      
      await initPromise
      expect(store.isLoading).toBe(false)
    })

    it('should set lastRefresh after initialization', async () => {
      const store = useLifecycleCockpitStore()
      
      expect(store.lastRefresh).toBeNull()
      await store.initialize()
      expect(store.lastRefresh).toBeInstanceOf(Date)
    })

    it('should load readiness status', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      expect(store.readinessStatus).not.toBeNull()
      expect(store.readinessStatus?.overallScore).toBeGreaterThanOrEqual(0)
      expect(store.readinessStatus?.overallScore).toBeLessThanOrEqual(100)
    })

    it('should load actions', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      expect(store.actions.length).toBeGreaterThan(0)
    })

    it('should load wallet diagnostics', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      expect(store.walletDiagnostics).not.toBeNull()
      expect(store.walletDiagnostics?.overallStatus).toBeDefined()
    })

    it('should not load telemetry without tokenId', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      expect(store.telemetry).toBeNull()
    })

    it('should load telemetry with tokenId', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize('test-token-id')
      
      expect(store.telemetry).not.toBeNull()
      expect(store.telemetry?.tokenId).toBe('test-token-id')
    })

    it('should load risk indicators with tokenId', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize('test-token-id')
      
      expect(store.riskIndicators).not.toBeNull()
      expect(store.riskIndicators?.concentration).toBeDefined()
    })
  })

  describe('Launch Readiness', () => {
    it('should return correct launch ready status', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      expect(typeof store.isLaunchReady).toBe('boolean')
      expect(store.isLaunchReady).toBe(store.readinessStatus?.isLaunchReady)
    })
  })

  describe('Refresh', () => {
    it('should refresh all data', async () => {
      const store = useLifecycleCockpitStore()
      await store.initialize()
      
      const firstRefresh = store.lastRefresh
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await store.refresh()
      
      expect(store.lastRefresh).not.toEqual(firstRefresh)
    })

    it('should refresh with tokenId', async () => {
      const store = useLifecycleCockpitStore()
      await store.refresh('new-token-id')
      
      expect(store.telemetry?.tokenId).toBe('new-token-id')
    })
  })

  describe('Error Handling', () => {
    it('should clear error on successful initialization', async () => {
      const store = useLifecycleCockpitStore()
      store.error = 'Previous error'
      
      await store.initialize()
      
      expect(store.error).toBeNull()
    })
  })

  describe('rolePermissions - additional role coverage', () => {
    it('should return correct permissions for treasury role', () => {
      const store = useLifecycleCockpitStore()
      store.setUserRole('treasury')
      
      const perms = store.rolePermissions
      expect(perms.canViewReadiness).toBe(false)
      expect(perms.canViewTelemetry).toBe(true)
      expect(perms.canViewActions).toBe(false)
      expect(perms.canViewWalletDiagnostics).toBe(false)
      expect(perms.canViewRiskIndicators).toBe(true)
      expect(perms.canViewEvidence).toBe(false)
      expect(perms.canCompleteActions).toBe(false)
      expect(perms.canExportReports).toBe(true)
    })

    it('should return restricted permissions for unknown/default role', () => {
      const store = useLifecycleCockpitStore()
      // Force an invalid role to trigger the default case
      store.userRole = 'unknown_role' as any
      
      const perms = store.rolePermissions
      expect(perms.canViewReadiness).toBe(false)
      expect(perms.canViewTelemetry).toBe(false)
      expect(perms.canViewActions).toBe(false)
      expect(perms.canCompleteActions).toBe(false)
      expect(perms.canExportReports).toBe(false)
    })
  })

  describe('prioritizedActions - in_progress status filter', () => {
    it('should include in_progress actions in prioritized list', async () => {
      const store = useLifecycleCockpitStore()
      
      store.actions = [
        {
          id: 'in-prog-action',
          priority: 'high',
          status: 'in_progress',
          title: 'In Progress Action',
          description: 'This is in progress',
          rationale: 'Test',
          expectedImpact: 'Something',
          deepLink: '/test',
          category: 'setup',
          createdAt: new Date(),
        },
      ]
      
      const prioritized = store.prioritizedActions
      expect(prioritized.some(a => a.id === 'in-prog-action')).toBe(true)
    })
  })

  describe('updateActionStatus - edge cases', () => {
    it('should not throw when action id not found', () => {
      const store = useLifecycleCockpitStore()
      store.actions = []
      expect(() => store.updateActionStatus('non-existent', 'completed')).not.toThrow()
    })

    it('should update action to in_progress without setting completedAt', () => {
      const store = useLifecycleCockpitStore()
      store.actions = [
        {
          id: 'action-1',
          priority: 'high',
          status: 'pending',
          title: 'Action 1',
          description: 'Test',
          rationale: 'Test',
          expectedImpact: 'Test',
          deepLink: '/test',
          category: 'setup',
          createdAt: new Date(),
        },
      ]
      
      store.updateActionStatus('action-1', 'in_progress')
      const action = store.actions.find(a => a.id === 'action-1')
      expect(action?.status).toBe('in_progress')
      expect(action?.completedAt).toBeUndefined()
    })
  })

  describe('isLaunchReady - null state', () => {
    it('should return false when readinessStatus is null', () => {
      const store = useLifecycleCockpitStore()
      expect(store.readinessStatus).toBeNull()
      expect(store.isLaunchReady).toBe(false)
    })
  })

  describe('criticalActionsCount', () => {
    it('should count only critical pending actions', () => {
      const store = useLifecycleCockpitStore()
      store.actions = [
        {
          id: 'crit-1',
          priority: 'critical',
          status: 'pending',
          title: 'Critical 1',
          description: 'Test',
          rationale: 'Test',
          expectedImpact: 'Test',
          deepLink: '/test',
          category: 'setup',
          createdAt: new Date(),
        },
        {
          id: 'crit-completed',
          priority: 'critical',
          status: 'completed',
          title: 'Critical Done',
          description: 'Test',
          rationale: 'Test',
          expectedImpact: 'Test',
          deepLink: '/test',
          category: 'setup',
          createdAt: new Date(),
        },
        {
          id: 'high-1',
          priority: 'high',
          status: 'pending',
          title: 'High 1',
          description: 'Test',
          rationale: 'Test',
          expectedImpact: 'Test',
          deepLink: '/test',
          category: 'setup',
          createdAt: new Date(),
        },
      ]
      
      expect(store.criticalActionsCount).toBe(1)
    })
  })
});
