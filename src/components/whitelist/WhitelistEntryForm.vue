<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      {{ isEdit ? 'Edit Whitelist Entry' : 'Create Whitelist Entry' }}
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Personal Information -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-user text-blue-600 dark:text-blue-400 mr-2"></i>
          Personal Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            v-model="formData.name"
            label="Full Name"
            placeholder="John Doe"
            required
            :error="errors.name"
          />
          <Input
            v-model="formData.email"
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            required
            :error="errors.email"
          />
        </div>
      </section>

      <!-- Entity Information -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-building text-purple-600 dark:text-purple-400 mr-2"></i>
          Entity Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            v-model="formData.entityType"
            label="Entity Type"
            :options="entityTypeOptions"
            required
            :error="errors.entityType"
          />
          <Input
            v-model="formData.organizationName"
            label="Organization Name"
            placeholder="Acme Corporation"
            :error="errors.organizationName"
          />
        </div>
      </section>

      <!-- Blockchain & Jurisdiction -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-globe text-green-600 dark:text-green-400 mr-2"></i>
          Blockchain & Jurisdiction
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            v-model="formData.walletAddress"
            label="Wallet Address (Optional)"
            placeholder="0x... or algorand address"
            :error="errors.walletAddress"
            hint="Leave empty if not available yet"
          />
          <Select
            v-model="formData.jurisdictionCode"
            label="Jurisdiction"
            :options="jurisdictionOptions"
            required
            :error="errors.jurisdictionCode"
            placeholder="Select jurisdiction"
          />
        </div>
      </section>

      <!-- Risk Assessment -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mr-2"></i>
          Risk Assessment
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            v-model="formData.riskLevel"
            label="Risk Level"
            :options="riskLevelOptions"
            required
            :error="errors.riskLevel"
          />
        </div>
      </section>

      <!-- Notes -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <i class="pi pi-comment text-gray-600 dark:text-gray-400 mr-2"></i>
          Additional Notes
        </h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (Optional)
          </label>
          <textarea
            v-model="formData.notes"
            rows="4"
            class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Add any additional notes or comments..."
          ></textarea>
        </div>
      </section>

      <!-- Error Summary -->
      <div v-if="generalError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <i class="pi pi-exclamation-circle text-red-600 dark:text-red-400 mr-3"></i>
          <p class="text-sm text-red-800 dark:text-red-300">{{ generalError }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          <i class="pi pi-check mr-2"></i>
          {{ isEdit ? 'Update Entry' : 'Create Entry' }}
        </Button>
        <Button
          type="button"
          variant="outline"
          @click="handleCancel"
          :disabled="isSubmitting"
        >
          <i class="pi pi-times mr-2"></i>
          Cancel
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import type { CreateWhitelistEntryRequest, EntityType, RiskLevel } from '../../types/whitelist';
import Input from '../ui/Input.vue';
import Select from '../ui/Select.vue';
import Button from '../ui/Button.vue';

interface Props {
  initialData?: Partial<CreateWhitelistEntryRequest>;
  isEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
});

const emit = defineEmits<{
  submit: [data: CreateWhitelistEntryRequest];
  cancel: [];
}>();

const formData = reactive<CreateWhitelistEntryRequest>({
  name: '',
  email: '',
  walletAddress: '',
  organizationName: '',
  entityType: 'individual' as EntityType,
  jurisdictionCode: '',
  riskLevel: 'low' as RiskLevel,
  notes: '',
});

const errors = reactive<Record<string, string>>({
  name: '',
  email: '',
  walletAddress: '',
  organizationName: '',
  entityType: '',
  jurisdictionCode: '',
  riskLevel: '',
});

const generalError = ref('');
const isSubmitting = ref(false);

const entityTypeOptions = [
  { label: 'Individual', value: 'individual' },
  { label: 'Institutional', value: 'institutional' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Trust', value: 'trust' },
  { label: 'Other', value: 'other' },
];

const jurisdictionOptions = [
  { label: 'United States (US)', value: 'US' },
  { label: 'United Kingdom (GB)', value: 'GB' },
  { label: 'Germany (DE)', value: 'DE' },
  { label: 'France (FR)', value: 'FR' },
  { label: 'Switzerland (CH)', value: 'CH' },
  { label: 'Singapore (SG)', value: 'SG' },
  { label: 'United Arab Emirates (AE)', value: 'AE' },
  { label: 'Canada (CA)', value: 'CA' },
  { label: 'Australia (AU)', value: 'AU' },
  { label: 'Japan (JP)', value: 'JP' },
  { label: 'South Korea (KR)', value: 'KR' },
  { label: 'Hong Kong (HK)', value: 'HK' },
  { label: 'Netherlands (NL)', value: 'NL' },
  { label: 'Spain (ES)', value: 'ES' },
  { label: 'Italy (IT)', value: 'IT' },
  { label: 'Other', value: 'OTHER' },
];

const riskLevelOptions = [
  { label: 'Low Risk', value: 'low' },
  { label: 'Medium Risk', value: 'medium' },
  { label: 'High Risk', value: 'high' },
  { label: 'Critical Risk', value: 'critical' },
];

onMounted(() => {
  if (props.initialData) {
    Object.assign(formData, props.initialData);
  }
});

watch(() => props.initialData, (newData) => {
  if (newData) {
    Object.assign(formData, newData);
  }
}, { deep: true });

function validateForm(): boolean {
  let isValid = true;
  generalError.value = '';
  
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key] = '';
  });

  // Name validation
  if (!formData.name.trim()) {
    errors.name = 'Name is required';
    isValid = false;
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
    isValid = false;
  }

  // Email validation
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format';
    isValid = false;
  }

  // Entity type validation
  if (!formData.entityType) {
    errors.entityType = 'Entity type is required';
    isValid = false;
  }

  // Jurisdiction validation
  if (!formData.jurisdictionCode) {
    errors.jurisdictionCode = 'Jurisdiction is required';
    isValid = false;
  }

  // Risk level validation
  if (!formData.riskLevel) {
    errors.riskLevel = 'Risk level is required';
    isValid = false;
  }

  // Wallet address validation (if provided)
  if (formData.walletAddress && formData.walletAddress.trim()) {
    const address = formData.walletAddress.trim();
    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
    const isAlgoAddress = /^[A-Z2-7]{58}$/.test(address);
    
    if (!isEthAddress && !isAlgoAddress) {
      errors.walletAddress = 'Invalid wallet address format (must be Ethereum or Algorand address)';
      isValid = false;
    }
  }

  if (!isValid) {
    generalError.value = 'Please fix the errors above before submitting';
  }

  return isValid;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  generalError.value = '';

  try {
    // Clean up data before submitting
    const submitData: CreateWhitelistEntryRequest = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      walletAddress: formData.walletAddress?.trim() || undefined,
      organizationName: formData.organizationName?.trim() || undefined,
      entityType: formData.entityType,
      jurisdictionCode: formData.jurisdictionCode,
      riskLevel: formData.riskLevel,
      notes: formData.notes?.trim() || undefined,
    };

    emit('submit', submitData);
  } catch (error) {
    generalError.value = error instanceof Error ? error.message : 'An unexpected error occurred';
  } finally {
    isSubmitting.value = false;
  }
}

function handleCancel() {
  emit('cancel');
}
</script>
