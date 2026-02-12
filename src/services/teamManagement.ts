/**
 * Team Management API Service
 * 
 * This service provides the interface for team management operations in the
 * enterprise compliance dashboard. It includes a mock implementation for
 * development and testing, with a clear contract for future backend integration.
 */

import type {
  TeamMember,
  TeamInvitation,
  TeamAuditEntry,
  RoleDefinition,
  InviteMemberRequest,
  UpdateRoleRequest,
  TeamApiResponse,
  TeamRole,
} from '../types/team';

/**
 * Role definitions with permissions and compliance actions
 */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'owner',
    name: 'Owner',
    description: 'Full control over organization, team, and compliance settings',
    permissions: ['*'], // All permissions
    complianceActions: [
      'View all compliance data',
      'Export audit reports and evidence',
      'Approve attestations',
      'Manage whitelist',
      'Configure compliance rules',
      'Manage team members',
      'View audit logs',
    ],
  },
  {
    role: 'admin',
    name: 'Administrator',
    description: 'Can manage team members and all compliance features',
    permissions: [
      'team.invite',
      'team.remove',
      'team.update_role',
      'compliance.view',
      'compliance.export',
      'compliance.approve',
      'audit.view',
      'whitelist.manage',
    ],
    complianceActions: [
      'View all compliance data',
      'Export audit reports and evidence',
      'Approve attestations',
      'Manage whitelist',
      'Configure compliance rules',
      'Invite team members',
      'View audit logs',
    ],
  },
  {
    role: 'compliance_officer',
    name: 'Compliance Officer',
    description: 'Read-only monitoring and reporting access for compliance data',
    permissions: ['compliance.view', 'compliance.export', 'audit.view'],
    complianceActions: [
      'View compliance dashboard',
      'Export compliance reports',
      'View audit logs',
      'Monitor whitelist status',
      'View attestations (read-only)',
    ],
  },
  {
    role: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to compliance data and dashboards',
    permissions: ['compliance.view'],
    complianceActions: [
      'View compliance dashboard',
      'View whitelist status (read-only)',
      'View attestations (read-only)',
    ],
  },
];

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: TeamRole, permissionId: string): boolean {
  const roleDef = ROLE_DEFINITIONS.find((r) => r.role === role);
  if (!roleDef) return false;
  
  // Owner has all permissions
  if (roleDef.permissions.includes('*')) return true;
  
  return roleDef.permissions.includes(permissionId);
}

/**
 * Get role definition by role type
 */
export function getRoleDefinition(role: TeamRole): RoleDefinition | undefined {
  return ROLE_DEFINITIONS.find((r) => r.role === role);
}

// ==================== MOCK DATA ====================
// This data is used for development and testing
// Replace with actual API calls when backend is ready

let mockMembers: TeamMember[] = [
  {
    id: '1',
    email: 'owner@example.com',
    name: 'Alice Owner',
    role: 'owner',
    status: 'active',
    lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
  },
];

let mockInvitations: TeamInvitation[] = [];

let mockAuditLog: TeamAuditEntry[] = [
  {
    id: 'audit-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    action: 'member_joined',
    actor: {
      id: '1',
      email: 'owner@example.com',
      name: 'Alice Owner',
    },
  },
];

/**
 * Team Management Service
 */
export class TeamManagementService {
  private useMockApi: boolean;

  constructor(useMockApi = true) {
    this.useMockApi = useMockApi;
  }

  /**
   * List all team members
   */
  async listMembers(): Promise<TeamApiResponse<TeamMember[]>> {
    if (this.useMockApi) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        data: [...mockMembers],
      };
    }

    // TODO: Implement actual API call
    // const response = await fetch('/api/team/members');
    // return response.json();
    throw new Error('Backend API not yet implemented');
  }

  /**
   * List pending invitations
   */
  async listInvitations(): Promise<TeamApiResponse<TeamInvitation[]>> {
    if (this.useMockApi) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        success: true,
        data: mockInvitations.filter((inv) => inv.status === 'pending'),
      };
    }

    throw new Error('Backend API not yet implemented');
  }

  /**
   * Invite a new team member
   */
  async inviteMember(request: InviteMemberRequest): Promise<TeamApiResponse<TeamInvitation>> {
    if (this.useMockApi) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Validate email
      if (!request.email || !request.email.includes('@')) {
        return {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please provide a valid email address',
          },
        };
      }

      // Check if email already exists
      const existingMember = mockMembers.find((m) => m.email === request.email);
      if (existingMember) {
        return {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'A team member with this email already exists',
          },
        };
      }

      const existingInvitation = mockInvitations.find(
        (inv) => inv.email === request.email && inv.status === 'pending'
      );
      if (existingInvitation) {
        return {
          success: false,
          error: {
            code: 'INVITATION_ALREADY_SENT',
            message: 'An invitation has already been sent to this email',
          },
        };
      }

      // Create invitation
      const invitation: TeamInvitation = {
        id: `inv-${Date.now()}`,
        email: request.email,
        role: request.role,
        note: request.note,
        status: 'pending',
        invitedBy: '1', // Current user (mocked)
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days
      };

      mockInvitations.push(invitation);

      // Add audit entry
      mockAuditLog.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'member_invited',
        actor: {
          id: '1',
          email: 'owner@example.com',
          name: 'Alice Owner',
        },
        target: {
          id: invitation.id,
          email: invitation.email,
        },
        details: { role: request.role },
      });

      return {
        success: true,
        data: invitation,
      };
    }

    throw new Error('Backend API not yet implemented');
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(invitationId: string): Promise<TeamApiResponse<TeamInvitation>> {
    if (this.useMockApi) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const invitation = mockInvitations.find((inv) => inv.id === invitationId);
      if (!invitation) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Invitation not found',
          },
        };
      }

      // Update invitation timestamps
      invitation.invitedAt = new Date().toISOString();
      invitation.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

      // Add audit entry
      mockAuditLog.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'invitation_resent',
        actor: {
          id: '1',
          email: 'owner@example.com',
          name: 'Alice Owner',
        },
        target: {
          id: invitation.id,
          email: invitation.email,
        },
      });

      return {
        success: true,
        data: invitation,
      };
    }

    throw new Error('Backend API not yet implemented');
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<TeamApiResponse<void>> {
    if (this.useMockApi) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const invitation = mockInvitations.find((inv) => inv.id === invitationId);
      if (!invitation) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Invitation not found',
          },
        };
      }

      invitation.status = 'cancelled';

      // Add audit entry
      mockAuditLog.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'invitation_cancelled',
        actor: {
          id: '1',
          email: 'owner@example.com',
          name: 'Alice Owner',
        },
        target: {
          id: invitation.id,
          email: invitation.email,
        },
      });

      return {
        success: true,
      };
    }

    throw new Error('Backend API not yet implemented');
  }

  /**
   * Update a team member's role
   */
  async updateMemberRole(request: UpdateRoleRequest): Promise<TeamApiResponse<TeamMember>> {
    if (this.useMockApi) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const member = mockMembers.find((m) => m.id === request.memberId);
      if (!member) {
        return {
          success: false,
          error: {
            code: 'MEMBER_NOT_FOUND',
            message: 'Team member not found',
          },
        };
      }

      // Prevent removing the last owner
      if (member.role === 'owner' && request.newRole !== 'owner') {
        const ownerCount = mockMembers.filter((m) => m.role === 'owner').length;
        if (ownerCount <= 1) {
          return {
            success: false,
            error: {
              code: 'LAST_OWNER',
              message: 'Cannot change role of the last owner. Assign another owner first.',
            },
          };
        }
      }

      const oldRole = member.role;
      member.role = request.newRole;

      // Add audit entry
      mockAuditLog.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'role_changed',
        actor: {
          id: '1',
          email: 'owner@example.com',
          name: 'Alice Owner',
        },
        target: {
          id: member.id,
          email: member.email,
          name: member.name,
        },
        details: { oldRole, newRole: request.newRole },
      });

      return {
        success: true,
        data: member,
      };
    }

    throw new Error('Backend API not yet implemented');
  }

  /**
   * Remove a team member
   */
  async removeMember(memberId: string): Promise<TeamApiResponse<void>> {
    if (this.useMockApi) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const memberIndex = mockMembers.findIndex((m) => m.id === memberId);
      if (memberIndex === -1) {
        return {
          success: false,
          error: {
            code: 'MEMBER_NOT_FOUND',
            message: 'Team member not found',
          },
        };
      }

      const member = mockMembers[memberIndex];

      // Prevent removing the last owner
      if (member.role === 'owner') {
        const ownerCount = mockMembers.filter((m) => m.role === 'owner').length;
        if (ownerCount <= 1) {
          return {
            success: false,
            error: {
              code: 'LAST_OWNER',
              message: 'Cannot remove the last owner',
            },
          };
        }
      }

      mockMembers.splice(memberIndex, 1);

      // Add audit entry
      mockAuditLog.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'member_removed',
        actor: {
          id: '1',
          email: 'owner@example.com',
          name: 'Alice Owner',
        },
        target: {
          id: member.id,
          email: member.email,
          name: member.name,
        },
      });

      return {
        success: true,
      };
    }

    throw new Error('Backend API not yet implemented');
  }

  /**
   * Get audit log for team access changes
   * @param limit Number of entries to return (default: 30)
   */
  async getAuditLog(limit = 30): Promise<TeamApiResponse<TeamAuditEntry[]>> {
    if (this.useMockApi) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        success: true,
        data: mockAuditLog.slice(0, limit),
      };
    }

    throw new Error('Backend API not yet implemented');
  }

  /**
   * Reset mock data (for testing purposes)
   */
  resetMockData(): void {
    if (this.useMockApi) {
      mockMembers = [
        {
          id: '1',
          email: 'owner@example.com',
          name: 'Alice Owner',
          role: 'owner',
          status: 'active',
          lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        },
      ];
      mockInvitations = [];
      mockAuditLog = [];
    }
  }
}

// Export singleton instance with mock API enabled by default
export const teamManagementService = new TeamManagementService(true);
