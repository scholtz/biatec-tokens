<template>
  <div class="team-access-view">
    <!-- Page Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white mb-2">Team & Access</h2>
      <p class="text-gray-400">
        Manage team members and role-based permissions for your compliance dashboard
      </p>
    </div>

    <!-- Access Denied (if user doesn't have permission) -->
    <div
      v-if="!canManageTeam && !loading"
      class="glass-effect rounded-xl p-12 text-center border border-yellow-500/20"
    >
      <i class="pi pi-lock text-yellow-500 text-5xl mb-4"></i>
      <h3 class="text-white font-semibold text-xl mb-2">Access Restricted</h3>
      <p class="text-gray-400 mb-6">
        You don't have permission to manage team members.<br />
        Contact your organization owner or administrator for access.
      </p>
      <Badge variant="warning" size="lg">
        {{ currentUserRole ? formatRoleName(currentUserRole) : 'No Role' }}
      </Badge>
    </div>

    <!-- Main Content (if user has permission) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Members List (Left Column - 2/3 width) -->
      <div class="lg:col-span-2">
        <TeamMembersList
          :members="teamStore.members"
          :pendingInvitations="teamStore.pendingInvitations"
          :loading="teamStore.loading"
          :error="teamStore.error"
          :canManageTeam="canManageTeam"
          @invite-member="openInviteModal"
          @change-role="openRoleModal"
          @remove-member="handleRemoveMember"
          @resend-invitation="handleResendInvitation"
          @cancel-invitation="handleCancelInvitation"
          @retry="handleRetry"
        />
      </div>

      <!-- Audit Activity (Right Column - 1/3 width) -->
      <div class="lg:col-span-1">
        <AuditActivityPanel
          :auditLog="teamStore.auditLog"
          :loading="teamStore.loading"
          @refresh="handleRefreshAudit"
        />
      </div>
    </div>

    <!-- Invite Member Modal -->
    <InviteMemberModal
      :isOpen="showInviteModal"
      :loading="inviteLoading"
      :apiError="inviteError"
      @close="closeInviteModal"
      @submit="handleInviteMember"
    />

    <!-- Role Management Modal -->
    <RoleManagementModal
      :isOpen="showRoleModal"
      :member="selectedMember"
      :loading="roleLoading"
      :apiError="roleError"
      @close="closeRoleModal"
      @submit="handleUpdateRole"
    />

    <!-- Confirmation Modal for Remove Member -->
    <Modal
      :show="showRemoveConfirmation"
      @close="closeRemoveConfirmation"
      size="md"
    >
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Remove Team Member
        </h3>
      </template>
      <template #default>
        <div class="space-y-4">
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start">
            <i class="pi pi-exclamation-triangle text-red-500 text-xl mr-3 mt-0.5"></i>
            <div class="flex-1">
              <p class="text-white font-medium mb-2">Are you sure?</p>
              <p class="text-gray-300 text-sm">
                This will permanently remove
                <span class="font-semibold">{{ memberToRemove?.name || memberToRemove?.email }}</span>
                from the team. They will lose all access to the compliance dashboard.
              </p>
            </div>
          </div>
          <p v-if="removeError" class="text-red-400 text-sm">{{ removeError }}</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button variant="ghost" @click="closeRemoveConfirmation" :disabled="removeLoading">
            Cancel
          </Button>
          <Button variant="danger" @click="confirmRemoveMember" :loading="removeLoading">
            <i class="pi pi-trash mr-2"></i>
            Remove Member
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTeamStore } from '../../stores/team';
import type { TeamMember, TeamInvitation, InviteMemberRequest, TeamRole } from '../../types/team';
import TeamMembersList from './TeamMembersList.vue';
import InviteMemberModal from './InviteMemberModal.vue';
import RoleManagementModal from './RoleManagementModal.vue';
import AuditActivityPanel from './AuditActivityPanel.vue';
import Modal from '../ui/Modal.vue';
import Button from '../ui/Button.vue';
import Badge from '../ui/Badge.vue';

const teamStore = useTeamStore();

// Permission check
const canManageTeam = computed(() => teamStore.canManageTeam);
const currentUserRole = computed(() => teamStore.currentUserRole);
const loading = computed(() => teamStore.loading);

// Invite Modal State
const showInviteModal = ref(false);
const inviteLoading = ref(false);
const inviteError = ref<string | null>(null);

// Role Modal State
const showRoleModal = ref(false);
const selectedMember = ref<TeamMember | null>(null);
const roleLoading = ref(false);
const roleError = ref<string | null>(null);

// Remove Member State
const showRemoveConfirmation = ref(false);
const memberToRemove = ref<TeamMember | null>(null);
const removeLoading = ref(false);
const removeError = ref<string | null>(null);

/**
 * Initialize the team store
 */
onMounted(async () => {
  await teamStore.initialize();
});

/**
 * Open invite modal
 */
function openInviteModal() {
  inviteError.value = null;
  showInviteModal.value = true;
}

/**
 * Close invite modal
 */
function closeInviteModal() {
  showInviteModal.value = false;
  inviteError.value = null;
}

/**
 * Handle invite member submission
 */
async function handleInviteMember(request: InviteMemberRequest) {
  inviteLoading.value = true;
  inviteError.value = null;

  const success = await teamStore.inviteMember(request);

  if (!success) {
    inviteError.value = teamStore.error;
  }

  inviteLoading.value = false;

  if (success) {
    closeInviteModal();
  }
}

/**
 * Open role management modal
 */
function openRoleModal(member: TeamMember) {
  selectedMember.value = member;
  roleError.value = null;
  showRoleModal.value = true;
}

/**
 * Close role management modal
 */
function closeRoleModal() {
  showRoleModal.value = false;
  selectedMember.value = null;
  roleError.value = null;
}

/**
 * Handle role update submission
 */
async function handleUpdateRole(memberId: string, newRole: TeamRole) {
  roleLoading.value = true;
  roleError.value = null;

  const success = await teamStore.updateMemberRole({ memberId, newRole });

  if (!success) {
    roleError.value = teamStore.error;
  }

  roleLoading.value = false;

  if (success) {
    closeRoleModal();
  }
}

/**
 * Handle remove member (show confirmation)
 */
function handleRemoveMember(member: TeamMember) {
  memberToRemove.value = member;
  removeError.value = null;
  showRemoveConfirmation.value = true;
}

/**
 * Close remove confirmation modal
 */
function closeRemoveConfirmation() {
  showRemoveConfirmation.value = false;
  memberToRemove.value = null;
  removeError.value = null;
}

/**
 * Confirm remove member
 */
async function confirmRemoveMember() {
  if (!memberToRemove.value) return;

  removeLoading.value = true;
  removeError.value = null;

  const success = await teamStore.removeMember(memberToRemove.value.id);

  if (!success) {
    removeError.value = teamStore.error;
  }

  removeLoading.value = false;

  if (success) {
    closeRemoveConfirmation();
  }
}

/**
 * Handle resend invitation
 */
async function handleResendInvitation(invitation: TeamInvitation) {
  await teamStore.resendInvitation(invitation.id);
}

/**
 * Handle cancel invitation
 */
async function handleCancelInvitation(invitation: TeamInvitation) {
  await teamStore.cancelInvitation(invitation.id);
}

/**
 * Handle refresh audit log
 */
async function handleRefreshAudit() {
  await teamStore.fetchAuditLog();
}

/**
 * Handle retry loading data
 */
async function handleRetry() {
  await teamStore.initialize();
}

/**
 * Format role name for display
 */
function formatRoleName(role: TeamRole): string {
  const roleNames: Record<TeamRole, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    compliance_officer: 'Compliance Officer',
    viewer: 'Viewer',
  };
  return roleNames[role] || role;
}
</script>

<style scoped>
.team-access-view {
  /* Component styles */
}
</style>
