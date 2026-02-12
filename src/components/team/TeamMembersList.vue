<template>
  <div class="team-members-list">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-white">Team Members</h3>
        <p class="text-sm text-gray-400 mt-1">
          {{ activeMembers.length }} active member{{ activeMembers.length !== 1 ? 's' : '' }}
          <span v-if="pendingInvitations.length > 0" class="text-biatec-accent">
            • {{ pendingInvitations.length }} pending invitation{{ pendingInvitations.length !== 1 ? 's' : '' }}
          </span>
        </p>
      </div>
      <Button
        v-if="canManageTeam"
        variant="primary"
        size="md"
        @click="$emit('invite-member')"
      >
        <i class="pi pi-user-plus mr-2"></i>
        Invite Member
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="glass-effect rounded-xl p-8 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-biatec-accent mx-auto mb-4"></div>
      <p class="text-gray-400">Loading team members...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="glass-effect rounded-xl p-6 border border-red-500/20">
      <div class="flex items-start">
        <i class="pi pi-exclamation-triangle text-red-500 text-xl mr-3 mt-0.5"></i>
        <div class="flex-1">
          <h4 class="text-white font-semibold mb-1">Error Loading Team</h4>
          <p class="text-gray-400 text-sm">{{ error }}</p>
        </div>
        <Button variant="ghost" size="sm" @click="$emit('retry')">
          Retry
        </Button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="members.length === 0"
      class="glass-effect rounded-xl p-12 text-center"
    >
      <i class="pi pi-users text-gray-600 text-5xl mb-4"></i>
      <h4 class="text-white font-semibold mb-2">No Team Members Yet</h4>
      <p class="text-gray-400 mb-6">
        Invite team members to collaborate on compliance tasks
      </p>
      <Button v-if="canManageTeam" variant="primary" @click="$emit('invite-member')">
        <i class="pi pi-user-plus mr-2"></i>
        Invite Your First Member
      </Button>
    </div>

    <!-- Members List -->
    <div v-else class="space-y-4">
      <!-- Active Members -->
      <div
        v-for="member in activeMembers"
        :key="member.id"
        class="glass-effect rounded-xl p-4 hover:bg-white/5 transition-all duration-200"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4 flex-1">
            <!-- Avatar -->
            <div
              class="w-12 h-12 rounded-full bg-gradient-to-br from-biatec-accent/40 to-purple-500/40 flex items-center justify-center text-white font-semibold text-lg"
            >
              {{ getInitials(member.name || member.email) }}
            </div>

            <!-- Member Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <h4 class="text-white font-medium truncate">
                  {{ member.name || member.email.split('@')[0] }}
                </h4>
                <Badge v-if="member.role === 'owner'" variant="success" size="sm">
                  Owner
                </Badge>
                <Badge
                  v-else-if="member.role === 'admin'"
                  variant="info"
                  size="sm"
                >
                  Admin
                </Badge>
                <Badge
                  v-else-if="member.role === 'compliance_officer'"
                  variant="info"
                  size="sm"
                >
                  Compliance Officer
                </Badge>
                <Badge v-else variant="default" size="sm">
                  Viewer
                </Badge>
              </div>
              <div class="flex items-center space-x-4 mt-1">
                <p class="text-sm text-gray-400 truncate">{{ member.email }}</p>
                <p v-if="member.lastActive" class="text-xs text-gray-500">
                  Active {{ formatRelativeTime(member.lastActive) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="canManageTeam && !isCurrentUser(member)" class="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('change-role', member)"
              :disabled="loading"
            >
              <i class="pi pi-pencil mr-2"></i>
              Change Role
            </Button>
            <Button
              variant="danger"
              size="sm"
              @click="$emit('remove-member', member)"
              :disabled="loading"
            >
              <i class="pi pi-trash"></i>
            </Button>
          </div>
          <div v-else-if="isCurrentUser(member)" class="text-sm text-gray-500">
            (You)
          </div>
        </div>
      </div>

      <!-- Pending Invitations -->
      <div v-if="pendingInvitations.length > 0" class="mt-8">
        <h4 class="text-white font-semibold mb-4 flex items-center">
          <i class="pi pi-clock mr-2 text-biatec-accent"></i>
          Pending Invitations
        </h4>
        <div
          v-for="invitation in pendingInvitations"
          :key="invitation.id"
          class="glass-effect rounded-xl p-4 border border-biatec-accent/20 hover:bg-white/5 transition-all duration-200"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1">
              <!-- Avatar -->
              <div
                class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400"
              >
                <i class="pi pi-envelope text-xl"></i>
              </div>

              <!-- Invitation Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <p class="text-white font-medium truncate">{{ invitation.email }}</p>
                  <Badge variant="warning" size="sm">Invited</Badge>
                  <Badge
                    v-if="invitation.role === 'admin'"
                    variant="info"
                    size="sm"
                  >
                    Admin
                  </Badge>
                  <Badge
                    v-else-if="invitation.role === 'compliance_officer'"
                    variant="info"
                    size="sm"
                  >
                    Compliance Officer
                  </Badge>
                  <Badge v-else variant="default" size="sm">
                    Viewer
                  </Badge>
                </div>
                <p class="text-sm text-gray-400 mt-1">
                  Invited {{ formatRelativeTime(invitation.invitedAt) }}
                  <span v-if="invitation.note" class="text-gray-500 ml-2">
                    • {{ invitation.note }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="canManageTeam" class="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                @click="$emit('resend-invitation', invitation)"
                :disabled="loading"
              >
                <i class="pi pi-send mr-2"></i>
                Resend
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click="$emit('cancel-invitation', invitation)"
                :disabled="loading"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TeamMember, TeamInvitation } from '../../types/team';
import Button from '../ui/Button.vue';
import Badge from '../ui/Badge.vue';
import { useAuthStore } from '../../stores/auth';

interface Props {
  members: TeamMember[];
  pendingInvitations: TeamInvitation[];
  loading?: boolean;
  error?: string | null;
  canManageTeam?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  canManageTeam: false,
});

defineEmits<{
  'invite-member': [];
  'change-role': [member: TeamMember];
  'remove-member': [member: TeamMember];
  'resend-invitation': [invitation: TeamInvitation];
  'cancel-invitation': [invitation: TeamInvitation];
  retry: [];
}>();

const authStore = useAuthStore();

const activeMembers = computed(() =>
  props.members.filter((m) => m.status === 'active')
);

/**
 * Check if a member is the current user
 */
function isCurrentUser(member: TeamMember): boolean {
  return member.email === authStore.user?.email;
}

/**
 * Get initials from name or email
 */
function getInitials(nameOrEmail: string): string {
  if (nameOrEmail.includes('@')) {
    return nameOrEmail.charAt(0).toUpperCase();
  }
  const parts = nameOrEmail.split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

/**
 * Format relative time (e.g., "5 minutes ago")
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}
</script>

<style scoped>
.team-members-list {
  /* Component styles */
}
</style>
