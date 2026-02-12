/**
 * Team management types for enterprise compliance dashboard
 * 
 * This module defines the data structures for role-based access control (RBAC)
 * in the enterprise compliance dashboard. It supports multi-user team management
 * with granular permissions for compliance operations.
 */

/**
 * Role types for team members
 * 
 * - Owner: Full control, can manage all aspects including billing and team
 * - Admin: Can manage team members and all compliance features
 * - Compliance Officer: Read-only monitoring and reporting access
 * - Viewer: Read-only access to compliance data
 */
export type TeamRole = 'owner' | 'admin' | 'compliance_officer' | 'viewer';

/**
 * Status of a team member or invitation
 */
export type MemberStatus = 'active' | 'invited' | 'suspended';

/**
 * Team member representation
 */
export interface TeamMember {
  id: string;
  email: string;
  name?: string;
  role: TeamRole;
  status: MemberStatus;
  lastActive?: string; // ISO 8601 timestamp
  invitedAt?: string; // ISO 8601 timestamp
  invitedBy?: string; // User ID who sent the invitation
  joinedAt?: string; // ISO 8601 timestamp
  avatar?: string; // Optional avatar URL
}

/**
 * Invitation for a new team member
 */
export interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  note?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedBy: string; // User ID
  invitedAt: string; // ISO 8601 timestamp
  expiresAt: string; // ISO 8601 timestamp
}

/**
 * Audit log entry for team access changes
 */
export interface TeamAuditEntry {
  id: string;
  timestamp: string; // ISO 8601 timestamp
  action: TeamAuditAction;
  actor: {
    id: string;
    email: string;
    name?: string;
  };
  target?: {
    id: string;
    email: string;
    name?: string;
  };
  details?: Record<string, any>;
}

/**
 * Types of audit actions
 */
export type TeamAuditAction =
  | 'member_invited'
  | 'invitation_resent'
  | 'invitation_cancelled'
  | 'member_joined'
  | 'role_changed'
  | 'member_suspended'
  | 'member_reactivated'
  | 'member_removed';

/**
 * Permission definition
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'team' | 'audit' | 'export';
}

/**
 * Role definition with permissions
 */
export interface RoleDefinition {
  role: TeamRole;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  complianceActions: string[]; // Human-readable compliance actions
}

/**
 * Request to invite a new team member
 */
export interface InviteMemberRequest {
  email: string;
  role: TeamRole;
  note?: string;
}

/**
 * Request to update a team member's role
 */
export interface UpdateRoleRequest {
  memberId: string;
  newRole: TeamRole;
}

/**
 * Response from team API operations
 */
export interface TeamApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
