<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-effect rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="pi pi-verified text-biatec-accent"></i>
            Wallet Attestation (Optional)
          </h2>
          <p class="text-sm text-gray-400 mt-1">
            Add compliance attestations for regulated token deployments
          </p>
        </div>
        <button
          @click="toggleAttestationEnabled"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            attestationEnabled
              ? 'bg-biatec-accent text-gray-900'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          ]"
        >
          {{ attestationEnabled ? 'Enabled' : 'Disabled' }}
        </button>
      </div>

      <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-blue-400 mt-1"></i>
          <div class="text-sm text-gray-300">
            <p class="mb-2">
              <strong class="text-white">Optional Feature:</strong> Wallet attestations provide proof of
              KYC/AML compliance, accredited investor status, or jurisdiction approval for your token deployment.
            </p>
            <p>
              This is particularly useful for RWA tokens, security tokens, or any regulated asset requiring
              compliance documentation for audit trails and MICA requirements.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Attestation Form (shown when enabled) -->
    <div v-if="attestationEnabled" class="glass-effect rounded-xl p-6">
      <h3 class="text-xl font-semibold text-white mb-4">Add Attestations</h3>

      <!-- Existing Attestations List -->
      <div v-if="attestations.length > 0" class="mb-6 space-y-3">
        <div
          v-for="(attestation, index) in attestations"
          :key="index"
          class="p-4 bg-white/5 rounded-lg border border-white/10"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium text-white">{{ getAttestationTypeLabelLocal(attestation.type) }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 text-xs rounded-full',
                    attestation.status === 'verified'
                      ? 'bg-green-500/20 text-green-400'
                      : attestation.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  ]"
                >
                  {{ attestation.status }}
                </span>
              </div>
              <div v-if="attestation.proofHash" class="text-xs text-gray-400 mb-1">
                <span class="text-gray-500">Proof Hash:</span>
                <code class="ml-2 text-gray-300">{{ attestation.proofHash }}</code>
              </div>
              <div v-if="attestation.notes" class="text-xs text-gray-400">
                <span class="text-gray-500">Notes:</span> {{ attestation.notes }}
              </div>
            </div>
            <button
              @click="removeAttestation(index)"
              class="text-red-400 hover:text-red-300 transition-colors"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- New Attestation Form -->
      <div class="space-y-4">
        <!-- Attestation Type -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Attestation Type
          </label>
          <select
            v-model="newAttestation.type"
            class="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-biatec-accent"
          >
            <option value="kyc_aml">KYC/AML Verification</option>
            <option value="accredited_investor">Accredited Investor Status</option>
            <option value="jurisdiction">Jurisdiction Approval</option>
            <option value="issuer_verification">Issuer Verification</option>
            <option value="other">Other</option>
          </select>
        </div>

        <!-- Proof Hash -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Proof Hash (Optional)
            <span class="text-xs text-gray-400 ml-2">
              SHA-256 hash of verification document or on-chain proof
            </span>
          </label>
          <input
            v-model="newAttestation.proofHash"
            type="text"
            placeholder="e.g., 0x1234567890abcdef..."
            class="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-biatec-accent"
          />
        </div>

        <!-- Document Upload (Simulated) -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Off-Chain Verification Document (Optional)
            <span class="text-xs text-gray-400 ml-2">Upload proof for audit trail</span>
          </label>
          <div
            class="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-biatec-accent/50 transition-colors cursor-pointer"
            @click="triggerFileUpload"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="handleFileUpload"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <i class="pi pi-cloud-upload text-3xl text-gray-400 mb-2"></i>
            <p class="text-sm text-gray-300">
              {{ uploadedFileName || 'Click to upload document (PDF, JPG, PNG, DOC)' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
          <textarea
            v-model="newAttestation.notes"
            rows="3"
            placeholder="Additional information about this attestation..."
            class="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-biatec-accent resize-none"
          ></textarea>
        </div>

        <!-- Add Attestation Button -->
        <button
          @click="addAttestation"
          :disabled="!isNewAttestationValid"
          :class="[
            'w-full px-4 py-3 rounded-lg font-medium transition-all',
            isNewAttestationValid
              ? 'bg-biatec-accent text-gray-900 hover:bg-biatec-accent/90'
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
          ]"
        >
          <i class="pi pi-plus mr-2"></i>
          Add Attestation
        </button>
      </div>
    </div>

    <!-- Compliance Summary (shown when attestations exist) -->
    <div v-if="attestationEnabled && attestations.length > 0" class="glass-effect rounded-xl p-6">
      <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <i class="pi pi-check-circle text-green-400"></i>
        Compliance Summary
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
          <div class="flex items-center gap-3">
            <i class="pi pi-shield-check text-green-400 text-2xl"></i>
            <div>
              <div class="text-sm text-gray-400">KYC/AML</div>
              <div class="text-lg font-semibold text-white">
                {{ hasAttestationType(AttestationType.KYC_AML) ? 'Added' : 'Not Added' }}
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
          <div class="flex items-center gap-3">
            <i class="pi pi-user-plus text-blue-400 text-2xl"></i>
            <div>
              <div class="text-sm text-gray-400">Accredited Investor</div>
              <div class="text-lg font-semibold text-white">
                {{ hasAttestationType(AttestationType.ACCREDITED_INVESTOR) ? 'Added' : 'Not Added' }}
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
          <div class="flex items-center gap-3">
            <i class="pi pi-globe text-purple-400 text-2xl"></i>
            <div>
              <div class="text-sm text-gray-400">Jurisdiction</div>
              <div class="text-lg font-semibold text-white">
                {{ hasAttestationType(AttestationType.JURISDICTION) ? 'Added' : 'Not Added' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div class="flex items-center gap-3">
          <i class="pi pi-info-circle text-blue-400"></i>
          <div class="text-sm text-gray-300">
            <strong class="text-white">{{ attestations.length }}</strong> attestation(s) will be stored with your
            token for audit trail and compliance reporting.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { WalletAttestation, AttestationType } from '../types/compliance';
import { getAttestationTypeLabel } from '../utils/attestation';

// Props
interface Props {
  modelValue?: WalletAttestation[];
  enabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  enabled: false,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: WalletAttestation[]];
  'update:enabled': [value: boolean];
}>();

// State
const attestationEnabled = ref(props.enabled);
const attestations = ref<WalletAttestation[]>([...props.modelValue]);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadedFileName = ref<string>('');

// New attestation form
const newAttestation = ref<{
  type: AttestationType;
  proofHash?: string;
  documentUrl?: string;
  notes?: string;
}>({
  type: AttestationType.KYC_AML,
  proofHash: '',
  documentUrl: '',
  notes: '',
});

// Computed
const isNewAttestationValid = computed(() => {
  return newAttestation.value.type && (newAttestation.value.proofHash || newAttestation.value.documentUrl);
});

// Methods
const toggleAttestationEnabled = () => {
  attestationEnabled.value = !attestationEnabled.value;
  emit('update:enabled', attestationEnabled.value);
};

const addAttestation = () => {
  if (!isNewAttestationValid.value) return;

  const attestation: WalletAttestation = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type: newAttestation.value.type,
    proofHash: newAttestation.value.proofHash || undefined,
    documentUrl: newAttestation.value.documentUrl || undefined,
    status: 'pending',
    notes: newAttestation.value.notes || undefined,
    metadata: {
      createdAt: new Date().toISOString(),
    },
  };

  attestations.value.push(attestation);
  emit('update:modelValue', attestations.value);

  // Reset form
  newAttestation.value = {
    type: AttestationType.KYC_AML,
    proofHash: '',
    documentUrl: '',
    notes: '',
  };
  uploadedFileName.value = '';
};

const removeAttestation = (index: number) => {
  attestations.value.splice(index, 1);
  emit('update:modelValue', attestations.value);
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // In a real app, you'd upload to secure storage (IPFS, AWS S3, etc.)
    // For now, we'll simulate it with a local URL and store the filename
    uploadedFileName.value = file.name;
    newAttestation.value.documentUrl = URL.createObjectURL(file);
  }
};

const getAttestationTypeLabelLocal = (type: AttestationType): string => {
  return getAttestationTypeLabel(type);
};

const hasAttestationType = (type: AttestationType): boolean => {
  return attestations.value.some((att: WalletAttestation) => att.type === type);
};
</script>
