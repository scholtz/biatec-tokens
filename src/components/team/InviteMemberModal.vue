<template>
  <Modal
    :show="isOpen"
    @close="handleClose"
    size="lg"
  >
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Invite Team Member
      </h3>
    </template>
    <template #default>
      <div class="space-y-6">
        <!-- Email Input -->
        <div>
          <label for="invite-email" class="block text-sm font-medium text-white mb-2">
            Email Address
            <span class="text-red-400">*</span>
          </label>
          <Input
            id="invite-email"
            v-model="formData.email"
            type="email"
            placeholder="colleague@example.com"
            :error="errors.email"
            :disabled="loading"
            @blur="validateEmail"
          />
          <p v-if="errors.email" class="text-red-400 text-sm mt-1">
            {{ errors.email }}
          </p>
        </div>

        <!-- Role Selection -->
        <div>
          <label for="invite-role" class="block text-sm font-medium text-white mb-2">
            Role
            <span class="text-red-400">*</span>
          </label>
          <Select
            id="invite-role"
            v-model="formData.role"
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

        <!-- Optional Note -->
        <div>
          <label for="invite-note" class="block text-sm font-medium text-white mb-2">
            Personal Note (Optional)
          </label>
          <textarea
            id="invite-note"
            v-model="formData.note"
            rows="3"
            placeholder="Add a personal message to the invitation..."
            class="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-biatec-accent focus:border-transparent resize-none"
            :disabled="loading"
          />
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

        <!-- Success Message -->
        <div
          v-if="successMessage"
          class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start"
        >
          <i class="pi pi-check-circle text-green-500 mr-3 mt-0.5"></i>
          <div class="flex-1">
            <p class="text-sm text-green-300">{{ successMessage }}</p>
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
          :disabled="!isFormValid || loading"
          :loading="loading"
        >
          <i class="pi pi-send mr-2"></i>
          Send Invitation
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { InviteMemberRequest } from '../../types/team';
import { ROLE_DEFINITIONS, getRoleDefinition } from '../../services/teamManagement';
import Modal from '../ui/Modal.vue';
import Input from '../ui/Input.vue';
import Select from '../ui/Select.vue';
import Button from '../ui/Button.vue';

interface Props {
  isOpen: boolean;
  loading?: boolean;
  apiError?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  apiError: null,
});

const emit = defineEmits<{
  close: [];
  submit: [request: InviteMemberRequest];
}>();

// Form state
const formData = ref<InviteMemberRequest>({
  email: '',
  role: 'viewer',
  note: '',
});

const errors = ref<Record<string, string>>({});
const successMessage = ref<string | null>(null);

// Role options for select
const roleOptions = computed(() =>
  ROLE_DEFINITIONS.filter((r) => r.role !== 'owner').map((r) => ({
    value: r.role,
    label: r.name,
  }))
);

// Selected role definition
const selectedRoleDef = computed(() => getRoleDefinition(formData.value.role));

// Form validation
const isFormValid = computed(() => {
  return (
    formData.value.email &&
    !errors.value.email &&
    formData.value.role
  );
});

/**
 * Validate email format
 */
function validateEmail() {
  errors.value.email = '';
  
  if (!formData.value.email) {
    errors.value.email = 'Email is required';
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.value.email)) {
    errors.value.email = 'Please enter a valid email address';
    return false;
  }
  
  return true;
}

/**
 * Handle form submission
 */
async function handleSubmit() {
  // Validate email
  if (!validateEmail()) {
    return;
  }
  
  // Clear previous messages
  successMessage.value = null;
  
  // Emit submit event
  emit('submit', {
    email: formData.value.email.trim(),
    role: formData.value.role,
    note: formData.value.note?.trim() || undefined,
  });
}

/**
 * Handle modal close
 */
function handleClose() {
  // Reset form if not loading
  if (!props.loading) {
    resetForm();
    emit('close');
  }
}

/**
 * Reset form to initial state
 */
function resetForm() {
  formData.value = {
    email: '',
    role: 'viewer',
    note: '',
  };
  errors.value = {};
  successMessage.value = null;
}

// Watch for successful submission (when loading changes from true to false without error)
watch(
  () => [props.loading, props.apiError],
  ([newLoading, newApiError], [oldLoading]) => {
    // Display success message and auto-close on successful submission
    if (oldLoading && !newLoading && !newApiError) {
      // Successful submission
      successMessage.value = 'Invitation sent successfully!';
      
      // Auto-close after showing success message (configurable via behavior)
      setTimeout(() => {
        if (props.isOpen) {
          handleClose();
        }
      }, 1500);
    }
  }
);
</script>

<style scoped>
/* Component-specific styles */
</style>
