<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-effect rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="pi pi-shield-check text-biatec-accent"></i>
            MICA Compliance Metadata
            <span v-if="required" class="text-red-400 text-sm">(Required for ARC-200)</span>
          </h2>
          <p class="text-sm text-gray-400 mt-1">
            Regulatory compliance information required under EU Markets in Crypto-Assets regulation
          </p>
        </div>
        <button
          v-if="!required"
          @click="toggleEnabled"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            enabled
              ? 'bg-biatec-accent text-gray-900'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          ]"
        >
          {{ enabled ? 'Enabled' : 'Disabled' }}
        </button>
      </div>

      <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-blue-400 mt-1"></i>
          <div class="text-sm text-gray-300">
            <p class="mb-2">
              <strong class="text-white">MICA Compliance:</strong> The Markets in Crypto-Assets (MiCA) regulation 
              requires token issuers to provide transparency about their legal entity, token purpose, and compliance measures.
            </p>
            <p>
              This information will be stored on-chain and can be used for regulatory reporting and audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Compliance Form (shown when enabled or required) -->
    <div v-if="enabled || required" class="glass-effect rounded-xl p-6">
      <h3 class="text-xl font-semibold text-white mb-6">Issuer Information</h3>

      <div class="space-y-6">
        <!-- Issuer Legal Name -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Issuer Legal Name <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localMetadata.issuerLegalName"
            type="text"
            required
            placeholder="e.g., Acme Token Solutions Ltd."
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @input="emitUpdate"
          />
          <p class="text-xs text-gray-400 mt-1">Full legal name of the entity issuing the token</p>
        </div>

        <!-- Issuer Registration Number -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Registration Number <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localMetadata.issuerRegistrationNumber"
            type="text"
            required
            placeholder="e.g., 12345678"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @input="emitUpdate"
          />
          <p class="text-xs text-gray-400 mt-1">Company registration or equivalent identifier</p>
        </div>

        <!-- Issuer Jurisdiction -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Jurisdiction <span class="text-red-400">*</span>
          </label>
          <select
            v-model="localMetadata.issuerJurisdiction"
            required
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @change="emitUpdate"
          >
            <option value="">Select jurisdiction</option>
            <option value="EU">European Union</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="SG">Singapore</option>
            <option value="CH">Switzerland</option>
            <option value="JP">Japan</option>
            <option value="AE">United Arab Emirates</option>
            <option value="OTHER">Other</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">Legal jurisdiction where issuer is registered</p>
        </div>

        <!-- Regulatory License -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Regulatory License (Optional)
          </label>
          <input
            v-model="localMetadata.regulatoryLicense"
            type="text"
            placeholder="e.g., FCA Reference Number 123456"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @input="emitUpdate"
          />
          <p class="text-xs text-gray-400 mt-1">Financial services license or authorization number</p>
        </div>

        <hr class="border-white/10" />

        <h3 class="text-xl font-semibold text-white mb-6">Token Classification</h3>

        <!-- MICA Token Classification -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Token Classification <span class="text-red-400">*</span>
          </label>
          <select
            v-model="localMetadata.micaTokenClassification"
            required
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @change="emitUpdate"
          >
            <option value="">Select classification</option>
            <option value="utility">Utility Token</option>
            <option value="e-money">E-Money Token</option>
            <option value="asset-referenced">Asset-Referenced Token</option>
            <option value="other">Other</option>
          </select>
          <p class="text-xs text-gray-400 mt-1">Classification under MICA regulation</p>
          
          <!-- Classification guidance -->
          <div v-if="localMetadata.micaTokenClassification" class="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <p class="text-xs text-gray-300">
              <strong class="text-purple-400">{{ getMicaClassificationLabel(localMetadata.micaTokenClassification) }}:</strong>
              {{ getMicaClassificationGuidance(localMetadata.micaTokenClassification) }}
            </p>
          </div>
        </div>

        <!-- Token Purpose -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Token Purpose <span class="text-red-400">*</span>
          </label>
          <textarea
            v-model="localMetadata.tokenPurpose"
            required
            rows="3"
            placeholder="Describe the token's purpose, utility, and rights conferred to holders..."
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @input="emitUpdate"
          ></textarea>
          <p class="text-xs text-gray-400 mt-1">Clear description of token purpose and holder rights (min. 50 characters)</p>
        </div>

        <!-- KYC Required -->
        <div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="localMetadata.kycRequired"
              type="checkbox"
              class="w-5 h-5 text-biatec-accent bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-biatec-accent/20"
              @change="emitUpdate"
            />
            <span class="text-sm font-medium text-gray-300">
              KYC/AML verification required for token holders
            </span>
          </label>
          <p class="text-xs text-gray-400 mt-2 ml-8">Enable this if token transfers require identity verification</p>
        </div>

        <!-- Restricted Jurisdictions -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Restricted Jurisdictions (Optional)
          </label>
          <input
            v-model="restrictedJurisdictionsInput"
            type="text"
            placeholder="e.g., US, CN, KP (comma-separated ISO codes)"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @input="updateRestrictedJurisdictions"
          />
          <p class="text-xs text-gray-400 mt-1">
            List of jurisdictions where token cannot be offered (ISO 3166-1 alpha-2 codes, comma-separated)
          </p>
        </div>

        <hr class="border-white/10" />

        <h3 class="text-xl font-semibold text-white mb-6">Contact & Documentation</h3>

        <!-- Compliance Contact Email -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Compliance Contact Email <span class="text-red-400">*</span>
          </label>
          <input
            v-model="localMetadata.complianceContactEmail"
            type="email"
            required
            placeholder="compliance@example.com"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @input="emitUpdate"
          />
          <p class="text-xs text-gray-400 mt-1">Email for compliance and regulatory inquiries</p>
        </div>

        <!-- Whitepaper URL -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Whitepaper URL (Optional)
          </label>
          <input
            v-model="localMetadata.whitepaperUrl"
            type="url"
            placeholder="https://example.com/whitepaper.pdf"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @input="emitUpdate"
          />
          <p class="text-xs text-gray-400 mt-1">URL to token whitepaper or prospectus</p>
        </div>

        <!-- Terms and Conditions URL -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Terms & Conditions URL (Optional)
          </label>
          <input
            v-model="localMetadata.termsAndConditionsUrl"
            type="url"
            placeholder="https://example.com/terms"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent focus:ring-2 focus:ring-biatec-accent/20"
            @input="emitUpdate"
          />
          <p class="text-xs text-gray-400 mt-1">URL to terms and conditions governing token use</p>
        </div>
      </div>

      <!-- Validation Status -->
      <div v-if="validationErrors.length > 0" class="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-red-400 mt-1"></i>
          <div>
            <p class="text-sm font-semibold text-red-400 mb-2">Validation Errors:</p>
            <ul class="text-xs text-gray-300 space-y-1">
              <li v-for="(error, index) in validationErrors" :key="index" class="flex items-start gap-2">
                <span class="text-red-400">•</span>
                <span>{{ error }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else-if="isValid" class="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div class="flex items-center gap-3">
          <i class="pi pi-check-circle text-green-400"></i>
          <p class="text-sm text-green-400">
            All required MICA compliance fields are complete
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { MicaComplianceMetadata } from '../types/api';
import { 
  getMicaClassificationLabel, 
  getMicaClassificationGuidance, 
  parseRestrictedJurisdictions,
  isValidEmail 
} from '../utils/mica-compliance';

interface Props {
  modelValue?: MicaComplianceMetadata;
  enabled?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false,
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: MicaComplianceMetadata | undefined];
  'update:enabled': [value: boolean];
  'update:valid': [value: boolean];
}>();

const enabled = ref(false);

watch(
  () => [props.enabled, props.required],
  () => {
    enabled.value = props.required || !!props.enabled;
  },
  { immediate: true }
);
const restrictedJurisdictionsInput = ref('');

const localMetadata = ref<MicaComplianceMetadata>({
  issuerLegalName: '',
  issuerRegistrationNumber: '',
  issuerJurisdiction: '',
  regulatoryLicense: '',
  micaTokenClassification: 'utility' as const,
  tokenPurpose: '',
  kycRequired: false,
  restrictedJurisdictions: [],
  complianceContactEmail: '',
  whitepaperUrl: '',
  termsAndConditionsUrl: '',
});

// Initialize from props if provided
if (props.modelValue) {
  localMetadata.value = { ...props.modelValue };
  restrictedJurisdictionsInput.value = props.modelValue.restrictedJurisdictions?.join(', ') || '';
}

const syncFromProps = (value?: MicaComplianceMetadata): void => {
  if (value) {
    localMetadata.value = { ...value };
    restrictedJurisdictionsInput.value = value.restrictedJurisdictions?.join(', ') || '';
  } else {
    // Reset to defaults when modelValue is cleared
    localMetadata.value = {
      issuerLegalName: '',
      issuerRegistrationNumber: '',
      issuerJurisdiction: '',
      regulatoryLicense: '',
      micaTokenClassification: 'utility',
      tokenPurpose: '',
      kycRequired: false,
      restrictedJurisdictions: [],
      complianceContactEmail: '',
      whitepaperUrl: '',
      termsAndConditionsUrl: '',
    };
    restrictedJurisdictionsInput.value = '';
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    syncFromProps(newValue);
  }
);
const validationErrors = computed(() => {
  const errors: string[] = [];
  
  if (!enabled.value && !props.required) {
    return errors;
  }

  if (!localMetadata.value.issuerLegalName?.trim()) {
    errors.push('Issuer legal name is required');
  }

  if (!localMetadata.value.issuerRegistrationNumber?.trim()) {
    errors.push('Registration number is required');
  }

  if (!localMetadata.value.issuerJurisdiction?.trim()) {
    errors.push('Jurisdiction is required');
  }

  if (!localMetadata.value.micaTokenClassification) {
    errors.push('Token classification is required');
  }

  if (!localMetadata.value.tokenPurpose?.trim()) {
    errors.push('Token purpose is required');
  } else if (localMetadata.value.tokenPurpose.trim().length < 50) {
    errors.push('Token purpose must be at least 50 characters');
  }

  if (!localMetadata.value.complianceContactEmail?.trim()) {
    errors.push('Compliance contact email is required');
  } else if (!isValidEmail(localMetadata.value.complianceContactEmail)) {
    errors.push('Invalid email format');
  }

  return errors;
});

const isValid = computed(() => {
  return validationErrors.value.length === 0 && (enabled.value || props.required);
});

watch(isValid, (newValue) => {
  emit('update:valid', newValue);
});

function toggleEnabled() {
  enabled.value = !enabled.value;
  emit('update:enabled', enabled.value);
  if (!enabled.value) {
    emit('update:modelValue', undefined);
  } else {
    emitUpdate();
  }
}

function updateRestrictedJurisdictions() {
  const { valid, invalid } = parseRestrictedJurisdictions(restrictedJurisdictionsInput.value);
  
  // Show warning if there are invalid codes (in production, this could be a toast notification)
  if (invalid.length > 0) {
    console.warn(`Invalid jurisdiction codes: ${invalid.join(', ')}`);
  }
  
  localMetadata.value.restrictedJurisdictions = valid;
  emitUpdate();
}

function emitUpdate() {
  if (enabled.value || props.required) {
    emit('update:modelValue', localMetadata.value);
  }
}
</script>
