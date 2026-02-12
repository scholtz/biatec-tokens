<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Jurisdiction Rules</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage allowed, restricted, and blocked jurisdictions
          </p>
        </div>
        <Button variant="primary" @click="openCreateModal">
          <i class="pi pi-plus mr-2"></i>
          Create Rule
        </Button>
      </div>
    </div>

    <!-- Rules List -->
    <div class="p-6">
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="rules.length === 0" class="text-center py-12">
        <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-gray-500 dark:text-gray-400">No jurisdiction rules found</p>
        <Button variant="primary" @click="openCreateModal" class="mt-4">
          <i class="pi pi-plus mr-2"></i>
          Create First Rule
        </Button>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="rule in rules"
          :key="rule.id"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ rule.countryName }}
                </h3>
                <Badge :variant="getStatusVariant(rule.status)">
                  {{ formatStatus(rule.status) }}
                </Badge>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  ({{ rule.countryCode }})
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div class="flex items-center text-sm">
                  <i :class="[
                    'pi mr-2',
                    rule.kycRequired ? 'pi-check-circle text-green-600' : 'pi-times-circle text-gray-400'
                  ]"></i>
                  <span class="text-gray-700 dark:text-gray-300">
                    KYC {{ rule.kycRequired ? 'Required' : 'Not Required' }}
                  </span>
                </div>
                <div class="flex items-center text-sm">
                  <i :class="[
                    'pi mr-2',
                    rule.accreditationRequired ? 'pi-check-circle text-green-600' : 'pi-times-circle text-gray-400'
                  ]"></i>
                  <span class="text-gray-700 dark:text-gray-300">
                    Accreditation {{ rule.accreditationRequired ? 'Required' : 'Not Required' }}
                  </span>
                </div>
                <div class="flex items-center text-sm">
                  <i class="pi pi-calendar text-blue-600 dark:text-blue-400 mr-2"></i>
                  <span class="text-gray-700 dark:text-gray-300">
                    Effective: {{ formatDate(rule.effectiveDate) }}
                  </span>
                </div>
              </div>

              <div v-if="rule.restrictionReason" class="mb-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  <span class="font-medium">Restriction Reason:</span> {{ rule.restrictionReason }}
                </p>
              </div>

              <div v-if="rule.notes" class="mb-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  <span class="font-medium">Notes:</span> {{ rule.notes }}
                </p>
              </div>

              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Created {{ formatDate(rule.createdAt) }}</span>
                <span>•</span>
                <span>Updated {{ formatDate(rule.updatedAt) }}</span>
              </div>
            </div>

            <div class="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                @click="openEditModal(rule)"
              >
                <i class="pi pi-pencil"></i>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="confirmDelete(rule)"
              >
                <i class="pi pi-trash text-red-600"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal :show="showFormModal" @close="closeFormModal" size="lg">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ editingRule ? 'Edit Jurisdiction Rule' : 'Create Jurisdiction Rule' }}
        </h3>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            v-model="ruleForm.countryCode"
            label="Country Code"
            placeholder="US"
            required
            :error="formErrors.countryCode"
            hint="ISO 3166-1 alpha-2 code"
          />
          <Input
            v-model="ruleForm.countryName"
            label="Country Name"
            placeholder="United States"
            required
            :error="formErrors.countryName"
          />
        </div>

        <Select
          v-model="ruleForm.status"
          label="Status"
          :options="statusOptions"
          required
          :error="formErrors.status"
        />

        <Input
          v-if="ruleForm.status === 'restricted' || ruleForm.status === 'blocked'"
          v-model="ruleForm.restrictionReason"
          label="Restriction Reason"
          placeholder="Explain why this jurisdiction is restricted/blocked"
          :error="formErrors.restrictionReason"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="ruleForm.kycRequired"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">KYC Required</span>
            </label>
          </div>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="ruleForm.accreditationRequired"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Accreditation Required</span>
            </label>
          </div>
        </div>

        <Input
          v-model="ruleForm.effectiveDate"
          label="Effective Date"
          type="date"
          required
          :error="formErrors.effectiveDate"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (Optional)
          </label>
          <textarea
            v-model="ruleForm.notes"
            rows="3"
            class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Add any additional notes..."
          ></textarea>
        </div>

        <div v-if="formGeneralError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p class="text-sm text-red-800 dark:text-red-300">{{ formGeneralError }}</p>
        </div>
      </form>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <Button variant="outline" @click="closeFormModal">Cancel</Button>
          <Button
            variant="primary"
            @click="handleSubmit"
            :loading="isSubmitting"
          >
            {{ editingRule ? 'Update Rule' : 'Create Rule' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :show="showDeleteModal" @close="showDeleteModal = false" size="md">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Delete Jurisdiction Rule</h3>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete the rule for <strong>{{ deletingRule?.countryName }}</strong>?
          This action cannot be undone.
        </p>
      </div>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <Button variant="outline" @click="showDeleteModal = false">Cancel</Button>
          <Button variant="danger" @click="handleDelete" :loading="isDeleting">Delete</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useWhitelistStore } from '../../stores/whitelist';
import type { JurisdictionRule } from '../../types/whitelist';
import Badge from '../ui/Badge.vue';
import Button from '../ui/Button.vue';
import Modal from '../ui/Modal.vue';
import Input from '../ui/Input.vue';
import Select from '../ui/Select.vue';

const whitelistStore = useWhitelistStore();

const rules = computed(() => whitelistStore.jurisdictionRules);
const isLoading = computed(() => whitelistStore.isLoadingJurisdictions);

const showFormModal = ref(false);
const showDeleteModal = ref(false);
const editingRule = ref<JurisdictionRule | null>(null);
const deletingRule = ref<JurisdictionRule | null>(null);
const isSubmitting = ref(false);
const isDeleting = ref(false);

const ruleForm = reactive({
  countryCode: '',
  countryName: '',
  status: 'allowed' as 'allowed' | 'restricted' | 'blocked' | 'pending_review',
  restrictionReason: '',
  kycRequired: false,
  accreditationRequired: false,
  effectiveDate: '',
  notes: '',
});

const formErrors = reactive({
  countryCode: '',
  countryName: '',
  status: '',
  restrictionReason: '',
  effectiveDate: '',
});

const formGeneralError = ref('');

const statusOptions = [
  { label: 'Allowed', value: 'allowed' },
  { label: 'Restricted', value: 'restricted' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Pending Review', value: 'pending_review' },
];

onMounted(async () => {
  await whitelistStore.fetchJurisdictionRules();
});

function openCreateModal() {
  editingRule.value = null;
  resetForm();
  showFormModal.value = true;
}

function openEditModal(rule: JurisdictionRule) {
  editingRule.value = rule;
  ruleForm.countryCode = rule.countryCode;
  ruleForm.countryName = rule.countryName;
  ruleForm.status = rule.status;
  ruleForm.restrictionReason = rule.restrictionReason || '';
  ruleForm.kycRequired = rule.kycRequired;
  ruleForm.accreditationRequired = rule.accreditationRequired;
  ruleForm.effectiveDate = rule.effectiveDate.split('T')[0];
  ruleForm.notes = rule.notes || '';
  showFormModal.value = true;
}

function closeFormModal() {
  showFormModal.value = false;
  resetForm();
  editingRule.value = null;
}

function resetForm() {
  ruleForm.countryCode = '';
  ruleForm.countryName = '';
  ruleForm.status = 'allowed';
  ruleForm.restrictionReason = '';
  ruleForm.kycRequired = false;
  ruleForm.accreditationRequired = false;
  ruleForm.effectiveDate = new Date().toISOString().split('T')[0];
  ruleForm.notes = '';
  
  Object.keys(formErrors).forEach(key => {
    formErrors[key as keyof typeof formErrors] = '';
  });
  formGeneralError.value = '';
}

function validateForm(): boolean {
  let isValid = true;
  
  Object.keys(formErrors).forEach(key => {
    formErrors[key as keyof typeof formErrors] = '';
  });
  formGeneralError.value = '';

  if (!ruleForm.countryCode.trim()) {
    formErrors.countryCode = 'Country code is required';
    isValid = false;
  } else if (!/^[A-Z]{2}$/.test(ruleForm.countryCode.trim())) {
    formErrors.countryCode = 'Invalid country code format (must be 2 uppercase letters)';
    isValid = false;
  }

  if (!ruleForm.countryName.trim()) {
    formErrors.countryName = 'Country name is required';
    isValid = false;
  }

  if (!ruleForm.status) {
    formErrors.status = 'Status is required';
    isValid = false;
  }

  if ((ruleForm.status === 'restricted' || ruleForm.status === 'blocked') && !ruleForm.restrictionReason.trim()) {
    formErrors.restrictionReason = 'Restriction reason is required for restricted/blocked jurisdictions';
    isValid = false;
  }

  if (!ruleForm.effectiveDate) {
    formErrors.effectiveDate = 'Effective date is required';
    isValid = false;
  }

  return isValid;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  formGeneralError.value = '';

  try {
    const ruleData = {
      countryCode: ruleForm.countryCode.trim().toUpperCase(),
      countryName: ruleForm.countryName.trim(),
      status: ruleForm.status,
      restrictionReason: ruleForm.restrictionReason.trim() || undefined,
      kycRequired: ruleForm.kycRequired,
      accreditationRequired: ruleForm.accreditationRequired,
      effectiveDate: new Date(ruleForm.effectiveDate).toISOString(),
      notes: ruleForm.notes.trim() || undefined,
      tokenPrograms: [],
      createdBy: 'current-user',
    };

    if (editingRule.value) {
      await whitelistStore.updateJurisdictionRule(editingRule.value.id, ruleData);
    } else {
      await whitelistStore.createJurisdictionRule(ruleData);
    }

    closeFormModal();
  } catch (error) {
    formGeneralError.value = error instanceof Error ? error.message : 'Failed to save rule';
  } finally {
    isSubmitting.value = false;
  }
}

function confirmDelete(rule: JurisdictionRule) {
  deletingRule.value = rule;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deletingRule.value) return;

  isDeleting.value = true;

  try {
    await whitelistStore.deleteJurisdictionRule(deletingRule.value.id);
    showDeleteModal.value = false;
    deletingRule.value = null;
  } catch (error) {
    console.error('Failed to delete rule:', error);
  } finally {
    isDeleting.value = false;
  }
}

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    allowed: 'success',
    restricted: 'warning',
    blocked: 'error',
    pending_review: 'info',
  };
  return variants[status] || 'info';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}
</script>
