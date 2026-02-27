/**
 * Unit tests for Team Management Store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTeamStore } from './team';
import { useAuthStore } from './auth';
import { teamManagementService } from '../services/teamManagement';
import type { TeamMember, TeamInvitation } from '../types/team';

// Mock the team management service
vi.mock('../services/teamManagement', () => {
  const mockService = {
    listMembers: vi.fn(),
    listInvitations: vi.fn(),
    getAuditLog: vi.fn(),
    inviteMember: vi.fn(),
    resendInvitation: vi.fn(),
    cancelInvitation: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    resetMockData: vi.fn(),
  };

  return {
    teamManagementService: mockService,
    ROLE_DEFINITIONS: [
      {
        role: 'owner',
        name: 'Owner',
        description: 'Full control',
        permissions: ['*'],
        complianceActions: [],
      },
      {
        role: 'admin',
        name: 'Administrator',
        description: 'Can manage team',
        permissions: ['team.invite', 'team.remove'],
        complianceActions: [],
      },
    ],
    hasPermission: vi.fn((role: string, permission: string) => {
      if (role === 'owner') return true;
      if (role === 'admin' && permission.startsWith('team.')) return true;
      return false;
    }),
    getRoleDefinition: vi.fn((role: string) => ({
      role,
      name: role,
      description: '',
      permissions: [],
      complianceActions: [],
    })),
  };
});

describe('Team Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const store = useTeamStore();

      expect(store.members).toEqual([]);
      expect(store.invitations).toEqual([]);
      expect(store.auditLog).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should load team data on initialize', async () => {
      const mockMembers: TeamMember[] = [
        {
          id: '1',
          email: 'owner@example.com',
          name: 'Owner',
          role: 'owner',
          status: 'active',
          lastActive: new Date().toISOString(),
        },
      ];

      vi.mocked(teamManagementService.listMembers).mockResolvedValue({
        success: true,
        data: mockMembers,
      });

      vi.mocked(teamManagementService.listInvitations).mockResolvedValue({
        success: true,
        data: [],
      });

      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({
        success: true,
        data: [],
      });

      const store = useTeamStore();
      await store.initialize();

      expect(store.members).toEqual(mockMembers);
      expect(store.invitations).toEqual([]);
      expect(store.auditLog).toEqual([]);
      expect(store.loading).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      vi.mocked(teamManagementService.listMembers).mockRejectedValue(
        new Error('API Error')
      );

      const store = useTeamStore();
      await store.initialize();

      expect(store.error).toBe('Failed to load team data');
      expect(store.loading).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should filter active members', () => {
      const store = useTeamStore();
      store.members = [
        {
          id: '1',
          email: 'active@example.com',
          role: 'admin',
          status: 'active',
        } as TeamMember,
        {
          id: '2',
          email: 'suspended@example.com',
          role: 'viewer',
          status: 'suspended',
        } as TeamMember,
      ];

      expect(store.activeMembers).toHaveLength(1);
      expect(store.activeMembers[0].email).toBe('active@example.com');
    });

    it('should filter pending invitations', () => {
      const store = useTeamStore();
      store.invitations = [
        {
          id: '1',
          email: 'pending@example.com',
          role: 'viewer',
          status: 'pending',
          invitedBy: '1',
          invitedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'cancelled@example.com',
          role: 'viewer',
          status: 'cancelled',
          invitedBy: '1',
          invitedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
      ];

      expect(store.pendingInvitations).toHaveLength(1);
      expect(store.pendingInvitations[0].email).toBe('pending@example.com');
    });

    it('should calculate total team size', () => {
      const store = useTeamStore();
      store.members = [
        { id: '1', email: 'test1@example.com', role: 'owner', status: 'active' } as TeamMember,
        { id: '2', email: 'test2@example.com', role: 'admin', status: 'active' } as TeamMember,
      ];
      store.invitations = [
        {
          id: '3',
          email: 'test3@example.com',
          role: 'viewer',
          status: 'pending',
          invitedBy: '1',
          invitedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
      ];

      expect(store.totalTeamSize).toBe(3);
    });

    it('should identify current user role', () => {
      const authStore = useAuthStore();
      authStore.user = {
        address: 'ABC123',
        email: 'owner@example.com',
        name: 'Owner',
      };

      const store = useTeamStore();
      store.members = [
        {
          id: '1',
          email: 'owner@example.com',
          role: 'owner',
          status: 'active',
        } as TeamMember,
      ];

      expect(store.currentUserRole).toBe('owner');
    });

    it('should allow owner to manage team', () => {
      const authStore = useAuthStore();
      authStore.user = {
        address: 'ABC123',
        email: 'owner@example.com',
      };

      const store = useTeamStore();
      store.members = [
        {
          id: '1',
          email: 'owner@example.com',
          role: 'owner',
          status: 'active',
        } as TeamMember,
      ];

      expect(store.canManageTeam).toBe(true);
    });

    it('should allow admin to manage team', () => {
      const authStore = useAuthStore();
      authStore.user = {
        address: 'ABC123',
        email: 'admin@example.com',
      };

      const store = useTeamStore();
      store.members = [
        {
          id: '1',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
        } as TeamMember,
      ];

      expect(store.canManageTeam).toBe(true);
    });

    it('should not allow viewer to manage team', () => {
      const authStore = useAuthStore();
      authStore.user = {
        address: 'ABC123',
        email: 'viewer@example.com',
      };

      const store = useTeamStore();
      store.members = [
        {
          id: '1',
          email: 'viewer@example.com',
          role: 'viewer',
          status: 'active',
        } as TeamMember,
      ];

      expect(store.canManageTeam).toBe(false);
    });
  });

  describe('Actions - Invite Member', () => {
    it('should successfully invite a member', async () => {
      const mockInvitation: TeamInvitation = {
        id: 'inv-1',
        email: 'newuser@example.com',
        role: 'viewer',
        status: 'pending',
        invitedBy: '1',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      };

      vi.mocked(teamManagementService.inviteMember).mockResolvedValue({
        success: true,
        data: mockInvitation,
      });

      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({
        success: true,
        data: [],
      });

      const store = useTeamStore();
      const success = await store.inviteMember({
        email: 'newuser@example.com',
        role: 'viewer',
      });

      expect(success).toBe(true);
      expect(store.invitations).toHaveLength(1);
      expect(store.invitations[0]).toEqual(mockInvitation);
      expect(store.error).toBeNull();
    });

    it('should handle invitation errors', async () => {
      vi.mocked(teamManagementService.inviteMember).mockResolvedValue({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email already exists',
        },
      });

      const store = useTeamStore();
      const success = await store.inviteMember({
        email: 'existing@example.com',
        role: 'viewer',
      });

      expect(success).toBe(false);
      expect(store.error).toBe('Email already exists');
    });
  });

  describe('Actions - Update Role', () => {
    it('should update member role with optimistic update', async () => {
      const mockMember: TeamMember = {
        id: '1',
        email: 'member@example.com',
        role: 'viewer',
        status: 'active',
      };

      const store = useTeamStore();
      store.members = [mockMember];

      vi.mocked(teamManagementService.updateMemberRole).mockResolvedValue({
        success: true,
        data: { ...mockMember, role: 'admin' },
      });

      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({
        success: true,
        data: [],
      });

      const success = await store.updateMemberRole({
        memberId: '1',
        newRole: 'admin',
      });

      expect(success).toBe(true);
      expect(store.members[0].role).toBe('admin');
    });

    it('should rollback on update failure', async () => {
      const mockMember: TeamMember = {
        id: '1',
        email: 'member@example.com',
        role: 'viewer',
        status: 'active',
      };

      const store = useTeamStore();
      store.members = [mockMember];

      vi.mocked(teamManagementService.updateMemberRole).mockResolvedValue({
        success: false,
        error: {
          code: 'LAST_OWNER',
          message: 'Cannot remove last owner',
        },
      });

      const success = await store.updateMemberRole({
        memberId: '1',
        newRole: 'admin',
      });

      expect(success).toBe(false);
      expect(store.members[0].role).toBe('viewer'); // Rolled back
      expect(store.error).toBe('Cannot remove last owner');
    });
  });

  describe('Actions - Remove Member', () => {
    it('should successfully remove a member', async () => {
      const store = useTeamStore();
      store.members = [
        { id: '1', email: 'test@example.com', role: 'viewer', status: 'active' } as TeamMember,
      ];

      vi.mocked(teamManagementService.removeMember).mockResolvedValue({
        success: true,
      });

      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({
        success: true,
        data: [],
      });

      const success = await store.removeMember('1');

      expect(success).toBe(true);
      expect(store.members).toHaveLength(0);
    });

    it('should handle remove errors', async () => {
      const store = useTeamStore();
      store.members = [
        { id: '1', email: 'owner@example.com', role: 'owner', status: 'active' } as TeamMember,
      ];

      vi.mocked(teamManagementService.removeMember).mockResolvedValue({
        success: false,
        error: {
          code: 'LAST_OWNER',
          message: 'Cannot remove the last owner',
        },
      });

      const success = await store.removeMember('1');

      expect(success).toBe(false);
      expect(store.members).toHaveLength(1); // Not removed
      expect(store.error).toBe('Cannot remove the last owner');
    });
  });

  describe('Actions - Invitation Management', () => {
    it('should resend invitation', async () => {
      const mockInvitation: TeamInvitation = {
        id: 'inv-1',
        email: 'test@example.com',
        role: 'viewer',
        status: 'pending',
        invitedBy: '1',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      };

      const store = useTeamStore();
      store.invitations = [mockInvitation];

      vi.mocked(teamManagementService.resendInvitation).mockResolvedValue({
        success: true,
        data: mockInvitation,
      });

      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({
        success: true,
        data: [],
      });

      const success = await store.resendInvitation('inv-1');

      expect(success).toBe(true);
    });

    it('should cancel invitation', async () => {
      const store = useTeamStore();
      store.invitations = [
        {
          id: 'inv-1',
          email: 'test@example.com',
          role: 'viewer',
          status: 'pending',
          invitedBy: '1',
          invitedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
      ];

      vi.mocked(teamManagementService.cancelInvitation).mockResolvedValue({
        success: true,
      });

      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({
        success: true,
        data: [],
      });

      const success = await store.cancelInvitation('inv-1');

      expect(success).toBe(true);
      expect(store.invitations).toHaveLength(0);
    });
  });

  describe('utility methods', () => {
    it('should clear error with clearError()', () => {
      const store = useTeamStore();
      store.error = 'Some error message';

      store.clearError();

      expect(store.error).toBeNull();
    });

    it('should reset all state with $reset()', async () => {
      const store = useTeamStore();
      store.members = [{
        id: 'm1',
        email: 'test@example.com',
        name: 'Test',
        role: 'viewer',
        status: 'active',
        joinedAt: new Date().toISOString(),
        permissions: [],
      }];
      store.invitations = [{
        id: 'i1',
        email: 'invite@example.com',
        role: 'viewer',
        status: 'pending',
        invitedBy: 'm1',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      }];
      store.error = 'Some error';
      store.loading = true;

      store.$reset();

      expect(store.members).toHaveLength(0);
      expect(store.invitations).toHaveLength(0);
      expect(store.auditLog).toHaveLength(0);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle removeMember error gracefully', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.removeMember).mockRejectedValueOnce(
        new Error('Network error')
      );

      const success = await store.removeMember('m1');

      expect(success).toBe(false);
      expect(store.error).toBe('Failed to remove member');
      expect(store.loading).toBe(false);
    });

    it('should return false when updateMemberRole has no data in response', async () => {
      const store = useTeamStore();
      store.members = [{
        id: 'm1',
        email: 'test@example.com',
        name: 'Test',
        role: 'viewer',
        status: 'active',
        joinedAt: new Date().toISOString(),
        permissions: [],
      }];

      vi.mocked(teamManagementService.updateMemberRole).mockResolvedValue({
        success: true,
        data: undefined as any,
      });

      const success = await store.updateMemberRole({ memberId: 'm1', newRole: 'admin' });

      expect(success).toBe(false);
      expect(store.error).toBeTruthy();
    });

    it('should return false when inviteMember response has no data', async () => {
      const store = useTeamStore();

      vi.mocked(teamManagementService.inviteMember).mockResolvedValue({
        success: false,
        error: { message: 'Email already invited' },
      } as any);

      const success = await store.inviteMember({ email: 'test@test.com', role: 'viewer' } as any);

      expect(success).toBe(false);
      expect(store.error).toBe('Email already invited');
    });

    it('should return false when cancelInvitation response fails', async () => {
      const store = useTeamStore();

      vi.mocked(teamManagementService.cancelInvitation).mockResolvedValue({
        success: false,
        error: { message: 'Cannot cancel' },
      } as any);

      const success = await store.cancelInvitation('inv-1');

      expect(success).toBe(false);
      expect(store.error).toBe('Cannot cancel');
    });

    it('should return false when resendInvitation response fails', async () => {
      const store = useTeamStore();

      vi.mocked(teamManagementService.resendInvitation).mockResolvedValue({
        success: false,
        error: { message: 'Cannot resend' },
      } as any);

      const success = await store.resendInvitation('inv-1');

      expect(success).toBe(false);
      expect(store.error).toBe('Cannot resend');
    });

    it('should return false and set error when resendInvitation throws', async () => {
      const store = useTeamStore();

      vi.mocked(teamManagementService.resendInvitation).mockRejectedValue(new Error('Network error'));

      const success = await store.resendInvitation('inv-1');

      expect(success).toBe(false);
      expect(store.error).toBe('Failed to resend invitation');
    });

    it('should return false and set error when cancelInvitation throws', async () => {
      const store = useTeamStore();

      vi.mocked(teamManagementService.cancelInvitation).mockRejectedValue(new Error('Network error'));

      const success = await store.cancelInvitation('inv-1');

      expect(success).toBe(false);
      expect(store.error).toBe('Failed to cancel invitation');
    });

    it('fetchAuditLog sets auditLog when response.success && response.data', async () => {
      const store = useTeamStore();
      const mockLog = [{ id: 'log-1', action: 'member_invited', actor: 'admin@test.com', timestamp: new Date().toISOString(), details: {} }];
      vi.mocked(teamManagementService.getAuditLog).mockResolvedValueOnce({
        success: true,
        data: mockLog,
      } as any);

      await store.fetchAuditLog();

      expect(store.auditLog).toEqual(mockLog);
    });

    it('fetchAuditLog throws when response.success is false', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.getAuditLog).mockResolvedValueOnce({
        success: false,
        error: { message: 'Unauthorized' },
      } as any);

      await expect(store.fetchAuditLog()).rejects.toThrow('Unauthorized');
    });

    it('cancelInvitation sets error when response.success is false', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.cancelInvitation).mockResolvedValueOnce({
        success: false,
        error: { message: 'Not found' },
      } as any);
      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({ success: true, data: [] } as any);

      const result = await store.cancelInvitation('inv-1');

      expect(result).toBe(false);
      expect(store.error).toBe('Not found');
    });

    it('updateMemberRole returns false when member not found (memberIndex === -1)', async () => {
      const store = useTeamStore();
      // No members in store — memberIndex will be -1
      store.members = [];

      const result = await store.updateMemberRole({ memberId: 'nonexistent', newRole: 'admin' });

      expect(result).toBe(false);
      expect(store.error).toBe('Member not found');
    });

    it('updateMemberRole rolls back and returns false on network error', async () => {
      const store = useTeamStore();
      store.members = [{
        id: 'm-rollback',
        email: 'test@example.com',
        name: 'Test',
        role: 'viewer',
        status: 'active',
        joinedAt: new Date().toISOString(),
        permissions: [],
      }];
      vi.mocked(teamManagementService.updateMemberRole).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({ success: true, data: [] } as any);

      const result = await store.updateMemberRole({ memberId: 'm-rollback', newRole: 'admin' });

      expect(result).toBe(false);
      // Role should be rolled back to 'viewer'
      expect(store.members[0].role).toBe('viewer');
      expect(store.error).toBe('Failed to update role');
    });

    it('fetchMembers throws with fallback message when response.error is undefined', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.listMembers).mockResolvedValueOnce({
        success: false,
      } as any);
      await expect(store.fetchMembers()).rejects.toThrow('Failed to fetch members');
    });

    it('fetchInvitations throws with fallback message when response.error is undefined', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.listInvitations).mockResolvedValueOnce({
        success: false,
      } as any);
      await expect(store.fetchInvitations()).rejects.toThrow('Failed to fetch invitations');
    });

    it('fetchAuditLog throws with fallback message when response.error is undefined', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.getAuditLog).mockResolvedValueOnce({
        success: false,
      } as any);
      await expect(store.fetchAuditLog()).rejects.toThrow('Failed to fetch audit log');
    });

    it('inviteMember returns false with fallback error when response.error is undefined', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.inviteMember).mockResolvedValueOnce({
        success: false,
      } as any);
      const result = await store.inviteMember({ email: 'x@y.com', role: 'viewer', name: 'X' });
      expect(result).toBe(false);
      expect(store.error).toBe('Failed to send invitation');
    });

    it('resendInvitation succeeds but invitation not in list (index === -1)', async () => {
      const store = useTeamStore();
      store.invitations = []; // empty — index will be -1
      const fakeInv = { id: 'inv-new', email: 'a@b.com', role: 'viewer', status: 'pending' };
      vi.mocked(teamManagementService.resendInvitation).mockResolvedValueOnce({
        success: true, data: fakeInv,
      } as any);
      vi.mocked(teamManagementService.getAuditLog).mockResolvedValue({ success: true, data: [] } as any);
      const result = await store.resendInvitation('inv-new');
      expect(result).toBe(true);
    });

    it('cancelInvitation returns false with fallback error when response.error is undefined', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.cancelInvitation).mockResolvedValueOnce({
        success: false,
      } as any);
      const result = await store.cancelInvitation('inv-1');
      expect(result).toBe(false);
      expect(store.error).toBe('Failed to cancel invitation');
    });

    it('currentUserRole returns null when user has no email', () => {
      const store = useTeamStore();
      const authStore = useAuthStore();
      authStore.user = null;
      expect(store.currentUserRole).toBe(null);
    });

    it('currentUserRole returns null when user email not found in members', () => {
      const store = useTeamStore();
      const authStore = useAuthStore();
      authStore.user = { email: 'notfound@example.com' } as any;
      store.members = [];
      expect(store.currentUserRole).toBe(null);
    });

    it('hasPermission returns false when no role', () => {
      const store = useTeamStore();
      const authStore = useAuthStore();
      authStore.user = null;
      expect(store.hasPermission('manage_members')).toBe(false);
    });

    it('removeMember returns false with fallback error when response.error is undefined', async () => {
      const store = useTeamStore();
      vi.mocked(teamManagementService.removeMember).mockResolvedValueOnce({
        success: false,
      } as any);
      const result = await store.removeMember('m-1');
      expect(result).toBe(false);
      expect(store.error).toBe('Failed to remove member');
    });
  });
})
