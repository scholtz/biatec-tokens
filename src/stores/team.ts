/**
 * Team Management Store
 * 
 * Pinia store for managing team members, invitations, and access control
 * in the enterprise compliance dashboard.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  TeamMember,
  TeamInvitation,
  TeamAuditEntry,
  TeamRole,
  InviteMemberRequest,
  UpdateRoleRequest,
} from '../types/team';
import {
  teamManagementService,
  ROLE_DEFINITIONS,
  hasPermission as checkPermission,
  getRoleDefinition,
} from '../services/teamManagement';
import { useAuthStore } from './auth';

export const useTeamStore = defineStore('team', () => {
  // State
  const members = ref<TeamMember[]>([]);
  const invitations = ref<TeamInvitation[]>([]);
  const auditLog = ref<TeamAuditEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const activeMembers = computed(() =>
    members.value.filter((m) => m.status === 'active')
  );

  const pendingInvitations = computed(() =>
    invitations.value.filter((inv) => inv.status === 'pending')
  );

  const totalTeamSize = computed(
    () => activeMembers.value.length + pendingInvitations.value.length
  );

  /**
   * Get the current user's role
   */
  const currentUserRole = computed((): TeamRole | null => {
    const authStore = useAuthStore();
    if (!authStore.user?.email) return null;

    const currentMember = members.value.find(
      (m) => m.email === authStore.user?.email
    );
    return currentMember?.role || null;
  });

  /**
   * Check if current user has permission
   */
  const hasPermission = computed(() => {
    return (permissionId: string): boolean => {
      const role = currentUserRole.value;
      if (!role) return false;
      return checkPermission(role, permissionId);
    };
  });

  /**
   * Check if current user can manage team (owner or admin)
   */
  const canManageTeam = computed(() => {
    const role = currentUserRole.value;
    return role === 'owner' || role === 'admin';
  });

  /**
   * Get role definitions for UI display
   */
  const roleDefinitions = computed(() => ROLE_DEFINITIONS);

  // Actions

  /**
   * Initialize the store by loading team data
   */
  async function initialize() {
    loading.value = true;
    error.value = null;

    try {
      await Promise.all([fetchMembers(), fetchInvitations(), fetchAuditLog()]);
    } catch (err) {
      console.error('Error initializing team store:', err);
      error.value = 'Failed to load team data';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch all team members
   */
  async function fetchMembers() {
    try {
      const response = await teamManagementService.listMembers();
      if (response.success && response.data) {
        members.value = response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch members');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      throw err;
    }
  }

  /**
   * Fetch pending invitations
   */
  async function fetchInvitations() {
    try {
      const response = await teamManagementService.listInvitations();
      if (response.success && response.data) {
        invitations.value = response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch invitations');
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
      throw err;
    }
  }

  /**
   * Fetch audit log
   */
  async function fetchAuditLog() {
    try {
      const response = await teamManagementService.getAuditLog(30);
      if (response.success && response.data) {
        auditLog.value = response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch audit log');
      }
    } catch (err) {
      console.error('Error fetching audit log:', err);
      throw err;
    }
  }

  /**
   * Invite a new team member
   */
  async function inviteMember(request: InviteMemberRequest): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await teamManagementService.inviteMember(request);

      if (response.success && response.data) {
        invitations.value.push(response.data);
        await fetchAuditLog(); // Refresh audit log
        return true;
      } else {
        error.value = response.error?.message || 'Failed to send invitation';
        return false;
      }
    } catch (err) {
      console.error('Error inviting member:', err);
      error.value = 'Failed to send invitation';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Resend an invitation
   */
  async function resendInvitation(invitationId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await teamManagementService.resendInvitation(invitationId);

      if (response.success && response.data) {
        // Update invitation in list
        const index = invitations.value.findIndex((inv) => inv.id === invitationId);
        if (index !== -1) {
          invitations.value[index] = response.data;
        }
        await fetchAuditLog();
        return true;
      } else {
        error.value = response.error?.message || 'Failed to resend invitation';
        return false;
      }
    } catch (err) {
      console.error('Error resending invitation:', err);
      error.value = 'Failed to resend invitation';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Cancel an invitation
   */
  async function cancelInvitation(invitationId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await teamManagementService.cancelInvitation(invitationId);

      if (response.success) {
        // Remove invitation from list
        invitations.value = invitations.value.filter((inv) => inv.id !== invitationId);
        await fetchAuditLog();
        return true;
      } else {
        error.value = response.error?.message || 'Failed to cancel invitation';
        return false;
      }
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      error.value = 'Failed to cancel invitation';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update a team member's role (with optimistic update)
   */
  async function updateMemberRole(request: UpdateRoleRequest): Promise<boolean> {
    loading.value = true;
    error.value = null;

    // Save original state for rollback
    const memberIndex = members.value.findIndex((m) => m.id === request.memberId);
    if (memberIndex === -1) {
      error.value = 'Member not found';
      loading.value = false;
      return false;
    }

    const originalMember = { ...members.value[memberIndex] };

    // Optimistic update
    members.value[memberIndex].role = request.newRole;

    try {
      const response = await teamManagementService.updateMemberRole(request);

      if (response.success && response.data) {
        members.value[memberIndex] = response.data;
        await fetchAuditLog();
        return true;
      } else {
        // Rollback on error
        members.value[memberIndex] = originalMember;
        error.value = response.error?.message || 'Failed to update role';
        return false;
      }
    } catch (err) {
      // Rollback on error
      members.value[memberIndex] = originalMember;
      console.error('Error updating member role:', err);
      error.value = 'Failed to update role';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Remove a team member
   */
  async function removeMember(memberId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await teamManagementService.removeMember(memberId);

      if (response.success) {
        members.value = members.value.filter((m) => m.id !== memberId);
        await fetchAuditLog();
        return true;
      } else {
        error.value = response.error?.message || 'Failed to remove member';
        return false;
      }
    } catch (err) {
      console.error('Error removing member:', err);
      error.value = 'Failed to remove member';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Reset store (for testing)
   */
  function $reset() {
    members.value = [];
    invitations.value = [];
    auditLog.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    members,
    invitations,
    auditLog,
    loading,
    error,

    // Computed
    activeMembers,
    pendingInvitations,
    totalTeamSize,
    currentUserRole,
    hasPermission,
    canManageTeam,
    roleDefinitions,

    // Actions
    initialize,
    fetchMembers,
    fetchInvitations,
    fetchAuditLog,
    inviteMember,
    resendInvitation,
    cancelInvitation,
    updateMemberRole,
    removeMember,
    clearError,
    $reset,

    // Utilities
    getRoleDefinition,
  };
});
