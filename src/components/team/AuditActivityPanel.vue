<template>
  <div class="audit-activity-panel">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <i class="pi pi-history text-biatec-accent text-xl"></i>
        <div>
          <h3 class="text-lg font-semibold text-white">Access Activity</h3>
          <p class="text-sm text-gray-400">Recent team access changes</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" @click="$emit('refresh')" :disabled="loading">
        <i class="pi pi-refresh" :class="{ 'animate-spin': loading }"></i>
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="glass-effect rounded-lg p-4 animate-pulse"
      >
        <div class="flex items-start space-x-3">
          <div class="w-8 h-8 bg-white/10 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-white/10 rounded w-3/4"></div>
            <div class="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="auditLog.length === 0"
      class="glass-effect rounded-xl p-8 text-center"
    >
      <i class="pi pi-info-circle text-gray-600 text-4xl mb-3"></i>
      <p class="text-gray-400">No activity recorded yet</p>
    </div>

    <!-- Audit Log Entries -->
    <div v-else class="space-y-3">
      <div
        v-for="entry in auditLog"
        :key="entry.id"
        class="glass-effect rounded-lg p-4 hover:bg-white/5 transition-all duration-200"
      >
        <div class="flex items-start space-x-3">
          <!-- Icon -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            :class="getActionIconClass(entry.action)"
          >
            <i :class="getActionIcon(entry.action)" class="text-sm"></i>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium">
                  {{ getActionDescription(entry) }}
                </p>
                <div class="flex items-center space-x-2 mt-1">
                  <p class="text-xs text-gray-400">
                    {{ formatRelativeTime(entry.timestamp) }}
                  </p>
                  <span class="text-gray-600">•</span>
                  <p class="text-xs text-gray-500">
                    {{ entry.actor.name || entry.actor.email }}
                  </p>
                </div>
              </div>
              <Badge :variant="getActionBadgeVariant(entry.action)" size="sm">
                {{ getActionLabel(entry.action) }}
              </Badge>
            </div>

            <!-- Additional Details -->
            <div v-if="entry.details && hasRelevantDetails(entry)" class="mt-2 text-xs text-gray-500">
              <span v-if="entry.details.oldRole && entry.details.newRole">
                {{ formatRoleName(entry.details.oldRole) }} → {{ formatRoleName(entry.details.newRole) }}
              </span>
              <span v-else-if="entry.details.role">
                Role: {{ formatRoleName(entry.details.role) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamAuditEntry, TeamAuditAction } from '../../types/team';
import Button from '../ui/Button.vue';
import Badge from '../ui/Badge.vue';

interface Props {
  auditLog: TeamAuditEntry[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<{
  refresh: [];
}>();

/**
 * Get icon class for action type
 */
function getActionIcon(action: TeamAuditAction): string {
  const iconMap: Record<TeamAuditAction, string> = {
    member_invited: 'pi pi-send',
    invitation_resent: 'pi pi-refresh',
    invitation_cancelled: 'pi pi-times',
    member_joined: 'pi pi-user-plus',
    role_changed: 'pi pi-pencil',
    member_suspended: 'pi pi-pause',
    member_reactivated: 'pi pi-play',
    member_removed: 'pi pi-user-minus',
  };
  return iconMap[action] || 'pi pi-info-circle';
}

/**
 * Get icon container class for action type
 */
function getActionIconClass(action: TeamAuditAction): string {
  const classMap: Record<TeamAuditAction, string> = {
    member_invited: 'bg-blue-500/20 text-blue-400',
    invitation_resent: 'bg-blue-500/20 text-blue-400',
    invitation_cancelled: 'bg-gray-500/20 text-gray-400',
    member_joined: 'bg-green-500/20 text-green-400',
    role_changed: 'bg-yellow-500/20 text-yellow-400',
    member_suspended: 'bg-orange-500/20 text-orange-400',
    member_reactivated: 'bg-green-500/20 text-green-400',
    member_removed: 'bg-red-500/20 text-red-400',
  };
  return classMap[action] || 'bg-gray-500/20 text-gray-400';
}

/**
 * Get badge variant for action type
 */
function getActionBadgeVariant(action: TeamAuditAction): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (['member_joined', 'member_reactivated'].includes(action)) return 'success';
  if (['role_changed', 'member_suspended'].includes(action)) return 'warning';
  if (['member_removed'].includes(action)) return 'error';
  if (['member_invited', 'invitation_resent'].includes(action)) return 'info';
  return 'default';
}

/**
 * Get human-readable label for action type
 */
function getActionLabel(action: TeamAuditAction): string {
  const labelMap: Record<TeamAuditAction, string> = {
    member_invited: 'Invited',
    invitation_resent: 'Resent',
    invitation_cancelled: 'Cancelled',
    member_joined: 'Joined',
    role_changed: 'Role Changed',
    member_suspended: 'Suspended',
    member_reactivated: 'Reactivated',
    member_removed: 'Removed',
  };
  return labelMap[action] || 'Unknown';
}

/**
 * Get human-readable description for audit entry
 */
function getActionDescription(entry: TeamAuditEntry): string {
  const target = entry.target
    ? (entry.target.name || entry.target.email)
    : '';

  switch (entry.action) {
    case 'member_invited':
      return `Invited ${target} to join the team`;
    case 'invitation_resent':
      return `Resent invitation to ${target}`;
    case 'invitation_cancelled':
      return `Cancelled invitation for ${target}`;
    case 'member_joined':
      return `${entry.actor.name || entry.actor.email} joined the team`;
    case 'role_changed':
      return `Changed ${target}'s role`;
    case 'member_suspended':
      return `Suspended ${target}`;
    case 'member_reactivated':
      return `Reactivated ${target}`;
    case 'member_removed':
      return `Removed ${target} from the team`;
    default:
      return 'Unknown action';
  }
}

/**
 * Check if entry has relevant details to display
 */
function hasRelevantDetails(entry: TeamAuditEntry): boolean {
  return !!(
    entry.details &&
    (entry.details.oldRole || entry.details.newRole || entry.details.role)
  );
}

/**
 * Format role name for display
 */
function formatRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    compliance_officer: 'Compliance Officer',
    viewer: 'Viewer',
  };
  return roleNames[role] || role;
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
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
</script>

<style scoped>
.audit-activity-panel {
  /* Component styles */
}
</style>
