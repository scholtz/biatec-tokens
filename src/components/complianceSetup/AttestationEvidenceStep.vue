<template>
  <div class="attestation-evidence-step">
    <!-- Step Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-3">
        Attestations & Evidence Capture
      </h2>
      <p class="text-gray-300 text-lg">
        Provide formal attestations about your token's compliance and capture supporting evidence.
        This establishes credibility and demonstrates your commitment to regulatory standards.
      </p>
    </div>

    <!-- Issuer Attestations -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-verified mr-2"></i>
        Required Attestations
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Formal declarations about your token's compliance and operational framework.
        These attestations are legally binding and may be shared with regulators.
      </p>

      <div class="space-y-4">
        <div v-for="attestation in formData.attestations" :key="attestation.id" class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div class="flex items-start">
            <input
              type="checkbox"
              v-model="attestation.isAttested"
              :disabled="!attestation.isRequired && !attestation.isAttested"
              class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
              @change="handleAttestationChange(attestation)"
            />
            <div class="ml-3 flex-1">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-white font-medium">{{ getAttestationTitle(attestation.type) }}</h4>
                <span
                  v-if="attestation.isRequired"
                  class="px-2 py-1 bg-red-900/30 text-red-400 text-xs font-medium rounded"
                >
                  Required
                </span>
              </div>
              <p class="text-sm text-gray-400 leading-relaxed">{{ attestation.statement }}</p>
              
              <div v-if="attestation.isAttested" class="mt-3 p-3 bg-green-900/20 border border-green-700 rounded">
                <p class="text-xs text-green-300">
                  <i class="pi pi-check-circle mr-1"></i>
                  Attested {{ attestation.attestedAt ? formatDate(attestation.attestedAt) : 'recently' }}
                  {{ attestation.attestedBy ? `by ${attestation.attestedBy}` : '' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="validationErrors.attestations" class="mt-4 text-sm text-red-400">
        {{ validationErrors.attestations }}
      </p>
    </div>

    <!-- Evidence References -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-book mr-2"></i>
        Supporting Evidence
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Upload or link to documents that support your compliance claims, such as legal opinions,
        regulatory filings, or audit reports.
      </p>

      <div class="mb-6">
        <button
          type="button"
          class="px-4 py-2 bg-biatec-accent hover:bg-biatec-accent/90 text-white rounded-lg transition-colors flex items-center"
          @click="showAddEvidenceDialog = true"
        >
          <i class="pi pi-plus mr-2"></i>
          Add Evidence
        </button>
      </div>

      <div v-if="formData.evidenceReferences.length > 0" class="space-y-3">
        <div v-for="evidence in formData.evidenceReferences" :key="evidence.id" class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <i :class="['mr-2', getEvidenceIcon(evidence.type)]"></i>
                <h4 class="text-white font-medium">{{ evidence.title }}</h4>
              </div>
              <p v-if="evidence.description" class="text-sm text-gray-400 mb-2">{{ evidence.description }}</p>
              <div class="flex items-center text-xs text-gray-500">
                <span class="px-2 py-1 bg-gray-700 rounded mr-2">{{ getEvidenceTypeLabel(evidence.type) }}</span>
                <span>{{ formatDate(evidence.uploadedAt) }}</span>
                <span class="mx-2">•</span>
                <span>by {{ evidence.uploadedBy }}</span>
              </div>
            </div>
            <button
              type="button"
              class="text-red-400 hover:text-red-300 transition-colors"
              @click="removeEvidence(evidence.id)"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <i class="pi pi-inbox text-4xl mb-3"></i>
        <p>No evidence added yet</p>
      </div>
    </div>

    <!-- Compliance Badge Eligibility -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-award mr-2"></i>
        Compliance Badge Eligibility
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Based on your configuration, your token may qualify for a compliance badge that signals
        trust to investors and partners.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p class="text-sm text-gray-400 mb-1">Badge Eligible</p>
          <p class="text-xl font-semibold" :class="formData.complianceBadgeEligible ? 'text-green-400' : 'text-gray-400'">
            {{ formData.complianceBadgeEligible ? 'Yes' : 'Not Yet' }}
          </p>
        </div>

        <div v-if="formData.complianceBadgeLevel" class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p class="text-sm text-gray-400 mb-1">Badge Level</p>
          <p class="text-xl font-semibold text-white capitalize">
            {{ formData.complianceBadgeLevel.replace(/_/g, ' ') }}
          </p>
        </div>
      </div>

      <div v-if="formData.complianceBadgeRationale" class="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p class="text-sm text-blue-300">
          <i class="pi pi-info-circle mr-2"></i>
          {{ formData.complianceBadgeRationale }}
        </p>
      </div>
    </div>

    <!-- Legal Review -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-briefcase mr-2"></i>
        Legal Review
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Has your compliance setup been reviewed by legal counsel? This is recommended for
        regulated tokens and required for MICA compliance.
      </p>

      <div class="space-y-4">
        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.hasLegalReview"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Legal Review Completed</span>
            <p class="text-sm text-gray-400">Our compliance setup has been reviewed by legal counsel</p>
          </div>
        </label>

        <div v-if="formData.hasLegalReview" class="ml-7 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Review Date
            </label>
            <input
              type="date"
              v-model="legalReviewDateString"
              class="w-full md:w-64 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              @change="handleFieldChange"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Review Notes (Optional)
            </label>
            <textarea
              v-model="formData.legalReviewNotes"
              rows="3"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              placeholder="e.g., Reviewed by Smith & Associates, all attestations approved..."
              @change="handleFieldChange"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Audit Trail -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-history mr-2"></i>
        Audit Trail
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Enable audit trail to track all compliance-related actions and maintain a record for regulatory purposes.
      </p>

      <div class="space-y-4">
        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.auditTrailReady"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Enable Audit Trail</span>
            <p class="text-sm text-gray-400">Automatically log all compliance and attestation activities</p>
          </div>
        </label>

        <div v-if="formData.auditTrailReady" class="ml-7">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            v-model="auditTrailStartDateString"
            class="w-full md:w-64 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
            @change="handleFieldChange"
          />
          <p class="text-xs text-gray-500 mt-1">Date from which audit trail becomes active</p>
        </div>
      </div>
    </div>

    <!-- Validation Warnings -->
    <div v-if="warnings.length > 0" class="mb-6">
      <div v-for="warning in warnings" :key="warning.field" class="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg mb-3">
        <div class="flex items-start">
          <i class="pi pi-exclamation-triangle text-yellow-400 mt-1 mr-3"></i>
          <div>
            <p class="text-yellow-300 font-medium">{{ warning.message }}</p>
            <p class="text-yellow-200/80 text-sm mt-1">{{ warning.recommendation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Errors -->
    <div v-if="criticalErrors.length > 0" class="mb-6">
      <div v-for="error in criticalErrors" :key="error.field" class="p-4 bg-red-900/20 border border-red-700 rounded-lg mb-3">
        <div class="flex items-start">
          <i class="pi pi-times-circle text-red-400 mt-1 mr-3"></i>
          <div>
            <p class="text-red-300 font-medium">{{ error.message }}</p>
            <p class="text-red-200/80 text-sm mt-1">{{ error.remediationHint }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Why This Matters -->
    <div class="p-6 bg-blue-900/10 border border-blue-700/30 rounded-xl">
      <h4 class="text-lg font-semibold text-blue-300 mb-3">
        <i class="pi pi-lightbulb mr-2"></i>
        Why This Matters
      </h4>
      <p class="text-gray-300 leading-relaxed mb-3">
        Proper attestations and evidence help you:
      </p>
      <ul class="space-y-2 text-gray-300">
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Demonstrate credibility and commitment to regulatory compliance</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Build trust with investors through transparent documentation</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Prepare for regulatory audits and compliance reviews</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Qualify for higher compliance badges and institutional partnerships</span>
        </li>
      </ul>
    </div>

    <!-- Add Evidence Dialog (Mock) -->
    <div v-if="showAddEvidenceDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="showAddEvidenceDialog = false">
      <div class="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700" @click.stop>
        <h3 class="text-xl font-semibold text-white mb-4">Add Evidence</h3>
        <p class="text-sm text-gray-400 mb-4">This is a placeholder dialog. In production, this would allow file uploads and metadata entry.</p>
        <button
          type="button"
          class="px-4 py-2 bg-biatec-accent hover:bg-biatec-accent/90 text-white rounded-lg transition-colors w-full"
          @click="showAddEvidenceDialog = false"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type {
  AttestationEvidence,
  StepValidation,
  ValidationError,
  ValidationWarning,
  IssuerAttestation,
} from '../../types/complianceSetup'

interface Props {
  modelValue?: AttestationEvidence
}

interface Emits {
  (e: 'update:modelValue', value: AttestationEvidence): void
  (e: 'validation-change', validation: StepValidation): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// UI state
const showAddEvidenceDialog = ref(false)

// Form data
const formData = ref<AttestationEvidence>({
  attestations: [
    {
      id: 'attest_jurisdiction',
      type: 'jurisdiction_declaration',
      statement: 'I declare that this token is issued in accordance with the laws of our registered jurisdiction and complies with all applicable securities regulations.',
      isRequired: true,
      isAttested: false,
    },
    {
      id: 'attest_investor',
      type: 'investor_suitability',
      statement: 'I confirm that investor eligibility requirements have been properly defined and will be enforced for all token holders.',
      isRequired: true,
      isAttested: false,
    },
    {
      id: 'attest_regulatory',
      type: 'regulatory_compliance',
      statement: 'I affirm that our organization has implemented appropriate KYC/AML procedures and will maintain compliance with anti-money laundering regulations.',
      isRequired: true,
      isAttested: false,
    },
    {
      id: 'attest_privacy',
      type: 'data_privacy',
      statement: 'I acknowledge that we will handle investor data in compliance with applicable data protection laws (GDPR, CCPA, etc.) and maintain appropriate security measures.',
      isRequired: true,
      isAttested: false,
    },
  ],
  evidenceReferences: [],
  complianceBadgeEligible: false,
  hasLegalReview: false,
  auditTrailReady: false,
})

// Date helpers
const legalReviewDateString = ref('')
const auditTrailStartDateString = ref('')

// Validation state
const validationErrors = ref<Record<string, string>>({})
const warnings = ref<ValidationWarning[]>([])
const criticalErrors = computed(() => {
  return Object.entries(validationErrors.value).map(([field, message]) => ({
    field,
    message,
    severity: 'critical' as const,
    remediationHint: message,
  }))
})

// Helper functions
const getAttestationTitle = (type: string): string => {
  const titles: Record<string, string> = {
    jurisdiction_declaration: 'Jurisdiction Declaration',
    investor_suitability: 'Investor Suitability Confirmation',
    regulatory_compliance: 'Regulatory Compliance Affirmation',
    data_privacy: 'Data Privacy Acknowledgment',
    other: 'Other Attestation',
  }
  return titles[type] || type
}

const getEvidenceIcon = (type: string): string => {
  const icons: Record<string, string> = {
    legal_opinion: 'pi pi-file-pdf',
    regulatory_filing: 'pi pi-file',
    audit_report: 'pi pi-chart-line',
    policy_document: 'pi pi-book',
    external_link: 'pi pi-external-link',
    other: 'pi pi-paperclip',
  }
  return icons[type] || 'pi pi-file'
}

const getEvidenceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    legal_opinion: 'Legal Opinion',
    regulatory_filing: 'Regulatory Filing',
    audit_report: 'Audit Report',
    policy_document: 'Policy Document',
    external_link: 'External Link',
    other: 'Other',
  }
  return labels[type] || type
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Validate form
const validateForm = (): StepValidation => {
  validationErrors.value = {}
  warnings.value = []

  const errors: ValidationError[] = []
  const warns: ValidationWarning[] = []

  // Check required attestations
  const requiredAttestations = formData.value.attestations.filter(a => a.isRequired)
  const incompleteAttestations = requiredAttestations.filter(a => !a.isAttested)

  if (incompleteAttestations.length > 0) {
    validationErrors.value.attestations = `${incompleteAttestations.length} required attestation(s) not completed`
    errors.push({
      field: 'attestations',
      message: `${incompleteAttestations.length} required attestation(s) not completed`,
      severity: 'critical',
      remediationHint: 'Complete all required attestations to proceed',
    })
  }

  // Badge eligibility calculation
  const attestedCount = formData.value.attestations.filter(a => a.isAttested).length
  const totalRequired = requiredAttestations.length
  formData.value.complianceBadgeEligible = attestedCount >= totalRequired

  if (formData.value.complianceBadgeEligible) {
    if (formData.value.hasLegalReview && formData.value.evidenceReferences.length >= 2) {
      formData.value.complianceBadgeLevel = 'mica_compliant'
      formData.value.complianceBadgeRationale = 'All attestations complete, legal review done, and supporting evidence provided'
    } else if (formData.value.evidenceReferences.length > 0) {
      formData.value.complianceBadgeLevel = 'standard'
      formData.value.complianceBadgeRationale = 'All attestations complete with supporting evidence'
    } else {
      formData.value.complianceBadgeLevel = 'basic'
      formData.value.complianceBadgeRationale = 'All required attestations complete'
    }
  } else {
    formData.value.complianceBadgeLevel = undefined
    formData.value.complianceBadgeRationale = undefined
  }

  // Warnings
  if (formData.value.evidenceReferences.length === 0) {
    const warning: ValidationWarning = {
      field: 'evidenceReferences',
      message: 'No supporting evidence provided',
      recommendation: 'Add supporting documents to strengthen your compliance position',
    }
    warns.push(warning)
    warnings.value.push(warning)
  }

  if (!formData.value.hasLegalReview) {
    const warning: ValidationWarning = {
      field: 'hasLegalReview',
      message: 'Legal review not completed',
      recommendation: 'Consider obtaining legal review for MICA compliance and higher badge levels',
    }
    warns.push(warning)
    warnings.value.push(warning)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warns,
    canProceed: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
  }
}

// Handle attestation change
const handleAttestationChange = (attestation: IssuerAttestation) => {
  if (attestation.isAttested) {
    attestation.attestedAt = new Date()
    attestation.attestedBy = 'Current User' // In production, get from auth store
  } else {
    attestation.attestedAt = undefined
    attestation.attestedBy = undefined
  }
  handleFieldChange()
}

// Handle field changes
const handleFieldChange = () => {
  // Sync date strings to Date objects
  if (legalReviewDateString.value) {
    formData.value.legalReviewDate = new Date(legalReviewDateString.value)
  }
  if (auditTrailStartDateString.value) {
    formData.value.auditTrailStartDate = new Date(auditTrailStartDateString.value)
  }

  emit('update:modelValue', formData.value)
  const validation = validateForm()
  emit('validation-change', validation)
}

// Remove evidence
const removeEvidence = (id: string) => {
  const index = formData.value.evidenceReferences.findIndex(e => e.id === id)
  if (index > -1) {
    formData.value.evidenceReferences.splice(index, 1)
    handleFieldChange()
  }
}

// Initialize from props
onMounted(() => {
  if (props.modelValue) {
    formData.value = { ...formData.value, ...props.modelValue }
    
    // Sync dates to strings
    if (formData.value.legalReviewDate) {
      legalReviewDateString.value = new Date(formData.value.legalReviewDate).toISOString().split('T')[0]
    }
    if (formData.value.auditTrailStartDate) {
      auditTrailStartDateString.value = new Date(formData.value.auditTrailStartDate).toISOString().split('T')[0]
    }
  }
  const validation = validateForm()
  emit('validation-change', validation)
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    formData.value = { ...formData.value, ...newValue }
    const validation = validateForm()
    emit('validation-change', validation)
  }
}, { deep: true })
</script>

<style scoped>
.attestation-evidence-step {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
