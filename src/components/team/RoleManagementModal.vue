<template>
  <Modal
    :show="isOpen"
    @close="handleClose"
    size="lg"
  >
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Change Team Member Role
      </h3>
    </template>
    <template #default>
      <div class="space-y-6">
        <!-- Member Info -->
        <div v-if="member" class="glass-effect rounded-lg p-4">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-biatec-accent/40 to-purple-500/40 flex items-center justify-center text-white font-semibold"
            >
              {{ getInitials(member.name || member.email) }}
            </div>
            <div>
              <p class="text-white font-medium">{{ member.name || member.email.split('@')[0] }}</p>
              <p class="text-sm text-gray-400">{{ member.email }}</p>
            </div>
          </div>
        </div>

        <!-- Current Role -->
        <div>
          <p class="text-sm text-gray-400 mb-2">Current Role</p>
          <div class="flex items-center space-x-2">
            <Badge
              v-if="member?.role === 'owner'"
              variant="success"
              size="md"
            >
              Owner
            </Badge>
            <Badge
              v-else-if="member?.role === 'admin'"
              variant="info"
              size="md"
            >
              Administrator
            </Badge>
            <Badge
              v-else-if="member?.role === 'compliance_officer'"
              variant="info"
              size="md"
            >
              Compliance Officer
            </Badge>
            <Badge v-else variant="default" size="md">
              Viewer
            </Badge>
          </div>
        </div>

        <!-- New Role Selection -->
        <div>
          <label for="new-role" class="block text-sm font-medium text-white mb-2">
            New Role
            <span class="text-red-400">*</span>
          </label>
          <Select
            id="new-role"
            v-model="selectedRole"
            :options="roleOptions"
            :disabled="loading"
          />
          <div v-if="selectedRoleDef" class="mt-3 p-3 glass-effect rounded-lg">
            <p class="text-sm text-gray-300 mb-2">{{ selectedRoleDef.description }}</p>
            <div class="space-y-1">
              <p class="text-xs font-semibold text-biatec-accent mb-1">Allowed Actions:</p>
              <ul class="space-y-1">
                <li
                  v-for="action in selectedRoleDef.complianceActions"
                  :key="action"
                  class="text-xs text-gray-400 flex items-start"
                >
                  <i class="pi pi-check text-green-400 text-xs mr-2 mt-0.5"></i>
                  <span>{{ action }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Warning for role changes -->
        <div
          v-if="showWarning"
          class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start"
        >
          <i class="pi pi-exclamation-triangle text-yellow-500 mr-3 mt-0.5"></i>
          <div class="flex-1">
            <p class="text-sm text-yellow-300 font-medium mb-1">Important</p>
            <p class="text-sm text-gray-300">
              {{ warningMessage }}
            </p>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="apiError"
          class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start"
        >
          <i class="pi pi-exclamation-circle text-red-500 mr-3 mt-0.5"></i>
          <div class="flex-1">
            <p class="text-sm text-red-300">{{ apiError }}</p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <Button
          variant="ghost"
          @click="handleClose"
          :disabled="loading"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          @click="handleSubmit"
          :disabled="!hasRoleChanged || loading"
          :loading="loading"
        >
          <i class="pi pi-save mr-2"></i>
          Update Role
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { TeamMember, TeamRole } from '../../types/team';
import { ROLE_DEFINITIONS, getRoleDefinition } from '../../services/teamManagement';
import Modal from '../ui/Modal.vue';
import Select from '../ui/Select.vue';
import Button from '../ui/Button.vue';
import Badge from '../ui/Badge.vue';

interface Props {
  isOpen: boolean;
  member: TeamMember | null;
  loading?: boolean;
  apiError?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  apiError: null,
});

const emit = defineEmits<{
  close: [];
  submit: [memberId: string, newRole: TeamRole];
}>();

// Selected role state
const selectedRole = ref<TeamRole>('viewer');

// Role options for select (excluding owner)
const roleOptions = computed(() =>
  ROLE_DEFINITIONS.filter((r) => r.role !== 'owner').map((r) => ({
    value: r.role,
    label: r.name,
  }))
);

// Selected role definition
const selectedRoleDef = computed(() => getRoleDefinition(selectedRole.value));

// Check if role has changed
const hasRoleChanged = computed(() => {
  return props.member && selectedRole.value !== props.member.role;
});

// Warning message based on role change
const showWarning = computed(() => {
  if (!props.member || !hasRoleChanged.value) return false;
  
  const currentRole = props.member.role;
  const newRole = selectedRole.value;
  
  // Downgrading from admin
  if (currentRole === 'admin' && newRole !== 'admin') {
    return true;
  }
  
  // Upgrading to admin
  if (currentRole !== 'admin' && newRole === 'admin') {
    return true;
  }
  
  return false;
});

const warningMessage = computed(() => {
  if (!props.member) return '';
  
  const currentRole = props.member.role;
  const newRole = selectedRole.value;
  
  if (currentRole === 'admin' && newRole !== 'admin') {
    return 'This member will lose the ability to manage team members and compliance settings.';
  }
  
  if (currentRole !== 'admin' && newRole === 'admin') {
    return 'This member will gain the ability to manage team members and all compliance features.';
  }
  
  if (currentRole === 'compliance_officer' && newRole === 'viewer') {
    return 'This member will lose the ability to export compliance reports.';
  }
  
  if (currentRole === 'viewer' && newRole !== 'viewer') {
    return 'This member will gain additional permissions to access compliance features.';
  }
  
  return '';
});

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
 * Handle form submission
 */
function handleSubmit() {
  if (props.member && hasRoleChanged.value) {
    emit('submit', props.member.id, selectedRole.value);
  }
}

/**
 * Handle modal close
 */
function handleClose() {
  if (!props.loading) {
    emit('close');
  }
}

// Watch for member changes to update selected role
watch(
  () => props.member,
  (newMember) => {
    if (newMember) {
      selectedRole.value = newMember.role;
    }
  },
  { immediate: true }
);

// Watch for successful submission (when loading changes from true to false without error)
watch(
  () => [props.loading, props.apiError],
  ([newLoading, newApiError], [oldLoading]) => {
    // Only auto-close if successful and parent hasn't closed modal yet
    if (oldLoading && !newLoading && !newApiError && props.isOpen) {
      // Small delay to show success message before closing
      setTimeout(() => {
        if (props.isOpen) {
          handleClose();
        }
      }, 500);
    }
  }
);
</script>

<style scoped>
/* Component-specific styles */
</style>
