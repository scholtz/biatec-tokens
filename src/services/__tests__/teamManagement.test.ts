import { describe, it, expect, beforeEach } from 'vitest';
import {
  ROLE_DEFINITIONS,
  hasPermission,
  getRoleDefinition,
  TeamManagementService,
  teamManagementService,
} from '../teamManagement';
import type { TeamRole } from '../../types/team';

describe('teamManagement', () => {
  // ==================== ROLE_DEFINITIONS ====================
  describe('ROLE_DEFINITIONS', () => {
    it('should export 4 role definitions', () => {
      expect(ROLE_DEFINITIONS).toHaveLength(4);
    });

    it('should include owner role with wildcard permissions', () => {
      const owner = ROLE_DEFINITIONS.find((r) => r.role === 'owner');
      expect(owner).toBeDefined();
      expect(owner?.permissions).toContain('*');
    });

    it('should include admin role with specific permissions', () => {
      const admin = ROLE_DEFINITIONS.find((r) => r.role === 'admin');
      expect(admin).toBeDefined();
      expect(admin?.permissions).toContain('team.invite');
      expect(admin?.permissions).toContain('compliance.view');
    });

    it('should include compliance_officer role with read-only permissions', () => {
      const officer = ROLE_DEFINITIONS.find((r) => r.role === 'compliance_officer');
      expect(officer).toBeDefined();
      expect(officer?.permissions).toContain('compliance.view');
      expect(officer?.permissions).not.toContain('team.invite');
    });

    it('should include viewer role with minimal permissions', () => {
      const viewer = ROLE_DEFINITIONS.find((r) => r.role === 'viewer');
      expect(viewer).toBeDefined();
      expect(viewer?.permissions).toContain('compliance.view');
      expect(viewer?.permissions).toHaveLength(1);
    });

    it('each role definition should have required fields', () => {
      for (const def of ROLE_DEFINITIONS) {
        expect(def.role).toBeTruthy();
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(Array.isArray(def.permissions)).toBe(true);
        expect(Array.isArray(def.complianceActions)).toBe(true);
      }
    });
  });

  // ==================== hasPermission ====================
  describe('hasPermission', () => {
    it('returns true for owner with any permission (wildcard)', () => {
      expect(hasPermission('owner', 'team.invite')).toBe(true);
      expect(hasPermission('owner', 'compliance.view')).toBe(true);
      expect(hasPermission('owner', 'anything.at.all')).toBe(true);
    });

    it('returns true for admin with granted permission', () => {
      expect(hasPermission('admin', 'team.invite')).toBe(true);
      expect(hasPermission('admin', 'compliance.view')).toBe(true);
    });

    it('returns false for admin without a permission', () => {
      // Admin does not have a wildcard '*'
      expect(hasPermission('admin', 'some.unknown.perm')).toBe(false);
    });

    it('returns true for compliance_officer with compliance.view', () => {
      expect(hasPermission('compliance_officer', 'compliance.view')).toBe(true);
    });

    it('returns false for compliance_officer without team.invite', () => {
      expect(hasPermission('compliance_officer', 'team.invite')).toBe(false);
    });

    it('returns true for viewer with compliance.view', () => {
      expect(hasPermission('viewer', 'compliance.view')).toBe(true);
    });

    it('returns false for viewer with compliance.export', () => {
      expect(hasPermission('viewer', 'compliance.export')).toBe(false);
    });

    it('returns false for an unknown role', () => {
      expect(hasPermission('unknown_role' as TeamRole, 'compliance.view')).toBe(false);
    });
  });

  // ==================== getRoleDefinition ====================
  describe('getRoleDefinition', () => {
    it('returns the owner role definition', () => {
      const def = getRoleDefinition('owner');
      expect(def).toBeDefined();
      expect(def?.role).toBe('owner');
    });

    it('returns the admin role definition', () => {
      const def = getRoleDefinition('admin');
      expect(def).toBeDefined();
      expect(def?.name).toBe('Administrator');
    });

    it('returns compliance_officer definition', () => {
      const def = getRoleDefinition('compliance_officer');
      expect(def?.name).toBe('Compliance Officer');
    });

    it('returns viewer definition', () => {
      const def = getRoleDefinition('viewer');
      expect(def?.name).toBe('Viewer');
    });

    it('returns undefined for unknown role', () => {
      const def = getRoleDefinition('nonexistent' as TeamRole);
      expect(def).toBeUndefined();
    });
  });

  // ==================== TeamManagementService (mock) ====================
  describe('TeamManagementService (mock API)', () => {
    let service: TeamManagementService;

    beforeEach(() => {
      service = new TeamManagementService(true);
      service.resetMockData();
    });

    describe('listMembers', () => {
      it('returns success with at least the owner member', async () => {
        const result = await service.listMembers();
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.length).toBeGreaterThanOrEqual(1);
      });

      it('returned members have required fields', async () => {
        const result = await service.listMembers();
        for (const member of result.data!) {
          expect(member.id).toBeTruthy();
          expect(member.email).toBeTruthy();
          expect(member.role).toBeTruthy();
          expect(member.status).toBeTruthy();
        }
      });
    });

    describe('listInvitations', () => {
      it('returns empty array when no invitations', async () => {
        const result = await service.listInvitations();
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });

      it('returns only pending invitations after adding one', async () => {
        await service.inviteMember({ email: 'pending@test.com', role: 'viewer' });
        const result = await service.listInvitations();
        expect(result.success).toBe(true);
        expect(result.data!.some((inv) => inv.email === 'pending@test.com')).toBe(true);
      });
    });

    describe('inviteMember', () => {
      it('successfully invites a new member', async () => {
        const result = await service.inviteMember({ email: 'new@example.com', role: 'viewer' });
        expect(result.success).toBe(true);
        expect(result.data?.email).toBe('new@example.com');
        expect(result.data?.role).toBe('viewer');
        expect(result.data?.status).toBe('pending');
      });

      it('returns error for invalid email', async () => {
        const result = await service.inviteMember({ email: 'not-an-email', role: 'viewer' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_EMAIL');
      });

      it('returns error for empty email', async () => {
        const result = await service.inviteMember({ email: '', role: 'viewer' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_EMAIL');
      });

      it('returns error if email is already a team member', async () => {
        const result = await service.inviteMember({ email: 'owner@example.com', role: 'viewer' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('EMAIL_ALREADY_EXISTS');
      });

      it('returns error if invitation already sent', async () => {
        await service.inviteMember({ email: 'dup@example.com', role: 'viewer' });
        const result = await service.inviteMember({ email: 'dup@example.com', role: 'viewer' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVITATION_ALREADY_SENT');
      });

      it('sets expiry to ~7 days from now', async () => {
        const before = Date.now();
        const result = await service.inviteMember({ email: 'exp@example.com', role: 'viewer' });
        const after = Date.now();
        const expiresAt = new Date(result.data!.expiresAt!).getTime();
        expect(expiresAt).toBeGreaterThan(before + 6 * 24 * 60 * 60 * 1000);
        expect(expiresAt).toBeLessThan(after + 8 * 24 * 60 * 60 * 1000);
      });
    });

    describe('resendInvitation', () => {
      it('returns error for unknown invitation id', async () => {
        const result = await service.resendInvitation('inv-nonexistent');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVITATION_NOT_FOUND');
      });

      it('successfully resends an existing invitation', async () => {
        const invite = await service.inviteMember({ email: 'resend@test.com', role: 'viewer' });
        const invId = invite.data!.id;
        const result = await service.resendInvitation(invId);
        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(invId);
      });
    });

    describe('cancelInvitation', () => {
      it('returns error for unknown invitation', async () => {
        const result = await service.cancelInvitation('inv-unknown');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVITATION_NOT_FOUND');
      });

      it('successfully cancels a pending invitation', async () => {
        const invite = await service.inviteMember({ email: 'cancel@test.com', role: 'viewer' });
        const result = await service.cancelInvitation(invite.data!.id);
        expect(result.success).toBe(true);
      });
    });

    describe('updateMemberRole', () => {
      it('returns error for unknown member', async () => {
        const result = await service.updateMemberRole({ memberId: 'nonexistent', newRole: 'viewer' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('MEMBER_NOT_FOUND');
      });

      it('returns error when demoting last owner', async () => {
        const members = await service.listMembers();
        const owner = members.data!.find((m) => m.role === 'owner')!;
        const result = await service.updateMemberRole({ memberId: owner.id, newRole: 'admin' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('LAST_OWNER');
      });
    });

    describe('removeMember', () => {
      it('returns error for unknown member', async () => {
        const result = await service.removeMember('id-not-exist');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('MEMBER_NOT_FOUND');
      });

      it('returns error when removing the last owner', async () => {
        const members = await service.listMembers();
        const owner = members.data!.find((m) => m.role === 'owner')!;
        const result = await service.removeMember(owner.id);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('LAST_OWNER');
      });
    });

    describe('getAuditLog', () => {
      it('returns empty audit log initially', async () => {
        const result = await service.getAuditLog();
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });

      it('adds audit entries on invite', async () => {
        await service.inviteMember({ email: 'audit@test.com', role: 'viewer' });
        const result = await service.getAuditLog();
        expect(result.success).toBe(true);
        expect(result.data!.length).toBeGreaterThan(0);
        const lastEntry = result.data![0];
        expect(lastEntry.action).toBe('member_invited');
      });

      it('respects the limit parameter', async () => {
        // Add multiple entries
        for (let i = 0; i < 5; i++) {
          await service.inviteMember({ email: `audit${i}@test.com`, role: 'viewer' });
        }
        const result = await service.getAuditLog(3);
        expect(result.data!.length).toBeLessThanOrEqual(3);
      });
    });

    describe('resetMockData', () => {
      it('clears invitations and extra members', async () => {
        await service.inviteMember({ email: 'temp@test.com', role: 'viewer' });
        service.resetMockData();

        const members = await service.listMembers();
        const invitations = await service.listInvitations();
        const auditLog = await service.getAuditLog();

        expect(members.data!.length).toBe(1);
        expect(members.data![0].email).toBe('owner@example.com');
        expect(invitations.data).toEqual([]);
        expect(auditLog.data).toEqual([]);
      });
    });
  });

  // ==================== TeamManagementService (real API path) ====================
  describe('TeamManagementService (real API path)', () => {
    let service: TeamManagementService;

    beforeEach(() => {
      service = new TeamManagementService(false);
    });

    it('listMembers throws when real API not implemented', async () => {
      await expect(service.listMembers()).rejects.toThrow('Backend API not yet implemented');
    });

    it('listInvitations throws when real API not implemented', async () => {
      await expect(service.listInvitations()).rejects.toThrow('Backend API not yet implemented');
    });

    it('inviteMember throws when real API not implemented', async () => {
      await expect(service.inviteMember({ email: 'x@x.com', role: 'viewer' })).rejects.toThrow(
        'Backend API not yet implemented'
      );
    });

    it('resendInvitation throws when real API not implemented', async () => {
      await expect(service.resendInvitation('inv-1')).rejects.toThrow('Backend API not yet implemented');
    });

    it('cancelInvitation throws when real API not implemented', async () => {
      await expect(service.cancelInvitation('inv-1')).rejects.toThrow('Backend API not yet implemented');
    });

    it('updateMemberRole throws when real API not implemented', async () => {
      await expect(service.updateMemberRole({ memberId: '1', newRole: 'viewer' })).rejects.toThrow(
        'Backend API not yet implemented'
      );
    });

    it('removeMember throws when real API not implemented', async () => {
      await expect(service.removeMember('1')).rejects.toThrow('Backend API not yet implemented');
    });

    it('getAuditLog throws when real API not implemented', async () => {
      await expect(service.getAuditLog()).rejects.toThrow('Backend API not yet implemented');
    });
  });

  // ==================== exported singleton ====================
  describe('teamManagementService singleton', () => {
    it('is an instance of TeamManagementService', () => {
      expect(teamManagementService).toBeInstanceOf(TeamManagementService);
    });

    it('uses mock API by default (listMembers succeeds)', async () => {
      const result = await teamManagementService.listMembers();
      expect(result.success).toBe(true);
    });
  });
});
