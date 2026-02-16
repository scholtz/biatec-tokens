<template>
  <div class="kyc-aml-readiness-step">
    <!-- Step Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-3">
        KYC/AML Readiness & Provider Setup
      </h2>
      <p class="text-gray-300 text-lg">
        Configure identity verification providers and document requirements to ensure your token meets
        Know Your Customer (KYC) and Anti-Money Laundering (AML) compliance standards.
      </p>
    </div>

    <!-- KYC Provider -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-id-card mr-2"></i>
        KYC Provider Configuration
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Connect with a KYC provider to verify investor identities and ensure compliance with customer
        identification requirements.
      </p>

      <div class="mb-6">
        <label class="flex items-start cursor-pointer group mb-4">
          <input
            type="checkbox"
            v-model="formData.kycProviderConfigured"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Enable KYC Provider</span>
            <p class="text-sm text-gray-400">Use a third-party KYC provider for identity verification</p>
          </div>
        </label>

        <div v-if="formData.kycProviderConfigured" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              KYC Provider *
            </label>
            <select
              v-model="formData.kycProviderName"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              @change="handleFieldChange"
            >
              <option value="">Select provider...</option>
              <option v-for="provider in kycProviders" :key="provider.id" :value="provider.name">
                {{ provider.name }}
              </option>
            </select>
            <p v-if="validationErrors.kycProviderName" class="mt-1 text-sm text-red-400">
              {{ validationErrors.kycProviderName }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Provider Status
            </label>
            <select
              v-model="formData.kycProviderStatus"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              @change="handleFieldChange"
            >
              <option value="not_configured">Not Configured</option>
              <option value="configured">Configured</option>
              <option value="connected">Connected</option>
              <option value="ready">Ready</option>
            </select>
          </div>

          <div v-if="formData.kycProviderName" class="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <p class="text-sm text-green-300">
              <i class="pi pi-check-circle mr-2"></i>
              Provider configured: <strong>{{ formData.kycProviderName }}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- AML Provider -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-shield mr-2"></i>
        AML Provider Configuration
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Set up Anti-Money Laundering screening to detect suspicious activity and ensure regulatory compliance.
      </p>

      <div class="mb-6">
        <label class="flex items-start cursor-pointer group mb-4">
          <input
            type="checkbox"
            v-model="formData.amlProviderConfigured"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Enable AML Provider</span>
            <p class="text-sm text-gray-400">Use a third-party AML provider for compliance screening</p>
          </div>
        </label>

        <div v-if="formData.amlProviderConfigured" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              AML Provider *
            </label>
            <select
              v-model="formData.amlProviderName"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              @change="handleFieldChange"
            >
              <option value="">Select provider...</option>
              <option v-for="provider in amlProviders" :key="provider.id" :value="provider.name">
                {{ provider.name }}
              </option>
            </select>
            <p v-if="validationErrors.amlProviderName" class="mt-1 text-sm text-red-400">
              {{ validationErrors.amlProviderName }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Provider Status
            </label>
            <select
              v-model="formData.amlProviderStatus"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              @change="handleFieldChange"
            >
              <option value="not_configured">Not Configured</option>
              <option value="configured">Configured</option>
              <option value="connected">Connected</option>
              <option value="ready">Ready</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Requirements -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-file mr-2"></i>
        Required Documents
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Specify which documents investors must provide during the verification process.
      </p>

      <div class="space-y-3">
        <div v-for="doc in formData.requiredDocuments" :key="doc.id" class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div class="flex items-start justify-between">
            <div class="flex items-start flex-1">
              <input
                type="checkbox"
                v-model="doc.isRequired"
                class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
                @change="handleFieldChange"
              />
              <div class="ml-3 flex-1">
                <p class="text-white font-medium">{{ doc.label }}</p>
                <p class="text-sm text-gray-400 mt-1">{{ doc.description }}</p>
              </div>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium ml-4',
                doc.isCompleted ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'
              ]"
            >
              {{ doc.isCompleted ? 'Uploaded' : 'Pending' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Identity Verification Flow -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-user-edit mr-2"></i>
        Identity Verification Flow
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Choose how investor identities will be verified and approved.
      </p>

      <div class="space-y-3">
        <label class="flex items-start cursor-pointer group">
          <input
            type="radio"
            v-model="formData.identityVerificationFlow"
            value="manual"
            class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Manual Review</span>
            <p class="text-sm text-gray-400">Your team manually reviews each verification</p>
          </div>
        </label>

        <label class="flex items-start cursor-pointer group">
          <input
            type="radio"
            v-model="formData.identityVerificationFlow"
            value="automated"
            class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Automated</span>
            <p class="text-sm text-gray-400">AI-powered automatic verification (faster)</p>
          </div>
        </label>

        <label class="flex items-start cursor-pointer group">
          <input
            type="radio"
            v-model="formData.identityVerificationFlow"
            value="hybrid"
            class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Hybrid</span>
            <p class="text-sm text-gray-400">Automated screening with manual review for edge cases</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Compliance Checks -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-search mr-2"></i>
        Additional Compliance Checks
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Enable additional screening to identify high-risk individuals and ensure regulatory compliance.
      </p>

      <div class="space-y-4">
        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.sanctionsScreeningEnabled"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Sanctions Screening</span>
            <p class="text-sm text-gray-400">Check investors against international sanctions lists (OFAC, UN, EU)</p>
          </div>
        </label>

        <div v-if="formData.sanctionsScreeningEnabled" class="ml-7">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Screening Provider
          </label>
          <input
            type="text"
            v-model="formData.sanctionsScreeningProvider"
            class="w-full md:w-96 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
            placeholder="e.g., Dow Jones, ComplyAdvantage"
            @change="handleFieldChange"
          />
        </div>

        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.pepsCheckEnabled"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">PEPs Screening</span>
            <p class="text-sm text-gray-400">Identify Politically Exposed Persons (higher risk individuals)</p>
          </div>
        </label>

        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.adverseMediaCheckEnabled"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Adverse Media Check</span>
            <p class="text-sm text-gray-400">Screen for negative news and criminal activity</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Readiness Status -->
    <div class="glass-effect rounded-xl p-6 mb-6" :class="readinessStatusClass">
      <h3 class="text-xl font-semibold mb-4" :class="readinessTextClass">
        <i :class="['mr-2', readinessIcon]"></i>
        Readiness Status
      </h3>
      <p class="leading-relaxed mb-4" :class="readinessTextClass">
        {{ readinessStatusText }}
      </p>
      
      <div v-if="formData.blockingIssues.length > 0" class="space-y-2">
        <p class="text-sm font-medium text-red-300">Blocking Issues:</p>
        <ul class="space-y-1">
          <li v-for="(issue, index) in formData.blockingIssues" :key="index" class="text-sm text-red-200/80 flex items-start">
            <i class="pi pi-exclamation-circle mr-2 mt-0.5"></i>
            <span>{{ issue }}</span>
          </li>
        </ul>
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
        Proper KYC/AML readiness helps you:
      </p>
      <ul class="space-y-2 text-gray-300">
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Comply with global financial regulations and prevent money laundering</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Build trust with investors and institutional partners through verified identities</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Reduce fraud and financial crime risks in your token ecosystem</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Qualify for higher compliance badges and access to regulated markets</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type {
  KYCAMLReadiness,
  StepValidation,
  ValidationError,
  ValidationWarning,
} from '../../types/complianceSetup'

interface Props {
  modelValue?: KYCAMLReadiness
}

interface Emits {
  (e: 'update:modelValue', value: KYCAMLReadiness): void
  (e: 'validation-change', validation: StepValidation): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Mock provider data
const kycProviders = [
  { id: 'jumio', name: 'Jumio' },
  { id: 'onfido', name: 'Onfido' },
  { id: 'sumsub', name: 'Sumsub' },
  { id: 'veriff', name: 'Veriff' },
  { id: 'other', name: 'Other' },
]

const amlProviders = [
  { id: 'chainalysis', name: 'Chainalysis' },
  { id: 'elliptic', name: 'Elliptic' },
  { id: 'coinfirm', name: 'Coinfirm' },
  { id: 'comply_advantage', name: 'ComplyAdvantage' },
  { id: 'other', name: 'Other' },
]

// Form data
const formData = ref<KYCAMLReadiness>({
  kycProviderConfigured: false,
  kycProviderStatus: 'not_configured',
  amlProviderConfigured: false,
  amlProviderStatus: 'not_configured',
  requiredDocuments: [
    {
      id: 'gov_id',
      type: 'government_id',
      label: 'Government-Issued ID',
      description: 'Passport, driver\'s license, or national ID card',
      isRequired: true,
      isCompleted: false,
    },
    {
      id: 'proof_address',
      type: 'proof_of_address',
      label: 'Proof of Address',
      description: 'Utility bill, bank statement, or lease agreement (< 3 months old)',
      isRequired: true,
      isCompleted: false,
    },
    {
      id: 'business_reg',
      type: 'business_registration',
      label: 'Business Registration',
      description: 'Certificate of incorporation (for institutional investors)',
      isRequired: false,
      isCompleted: false,
    },
    {
      id: 'tax_id',
      type: 'tax_id',
      label: 'Tax Identification',
      description: 'Tax ID number or equivalent',
      isRequired: false,
      isCompleted: false,
    },
  ],
  completedDocuments: [],
  identityVerificationFlow: 'hybrid',
  identityVerificationStatus: 'not_started',
  sanctionsScreeningEnabled: false,
  pepsCheckEnabled: false,
  adverseMediaCheckEnabled: false,
  overallReadinessStatus: 'not_ready',
  blockingIssues: [],
})

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

// Readiness status computed properties
const readinessStatusClass = computed(() => {
  const status = formData.value.overallReadinessStatus
  if (status === 'ready') return 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/50'
  if (status === 'partially_ready') return 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-700/50'
  return 'bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-700/50'
})

const readinessTextClass = computed(() => {
  const status = formData.value.overallReadinessStatus
  if (status === 'ready') return 'text-green-300'
  if (status === 'partially_ready') return 'text-yellow-300'
  return 'text-red-300'
})

const readinessIcon = computed(() => {
  const status = formData.value.overallReadinessStatus
  if (status === 'ready') return 'pi pi-check-circle'
  if (status === 'partially_ready') return 'pi pi-exclamation-triangle'
  return 'pi pi-times-circle'
})

const readinessStatusText = computed(() => {
  const status = formData.value.overallReadinessStatus
  if (status === 'ready') {
    return 'Your KYC/AML configuration is complete and ready for deployment. All required providers are connected and document requirements are defined.'
  }
  if (status === 'partially_ready') {
    return 'Your KYC/AML configuration is partially complete. Some providers or documents may need additional setup before deployment.'
  }
  return 'Your KYC/AML configuration needs attention. Please configure the required providers and document requirements to proceed.'
})

// Validate form
const validateForm = (): StepValidation => {
  validationErrors.value = {}
  warnings.value = []
  formData.value.blockingIssues = []

  const errors: ValidationError[] = []
  const warns: ValidationWarning[] = []

  // KYC provider validation
  if (formData.value.kycProviderConfigured && !formData.value.kycProviderName) {
    validationErrors.value.kycProviderName = 'KYC provider must be selected'
    errors.push({
      field: 'kycProviderName',
      message: 'KYC provider must be selected',
      severity: 'high',
      remediationHint: 'Select a KYC provider or disable KYC provider configuration',
    })
    formData.value.blockingIssues.push('KYC provider not selected')
  }

  // AML provider validation
  if (formData.value.amlProviderConfigured && !formData.value.amlProviderName) {
    validationErrors.value.amlProviderName = 'AML provider must be selected'
    errors.push({
      field: 'amlProviderName',
      message: 'AML provider must be selected',
      severity: 'high',
      remediationHint: 'Select an AML provider or disable AML provider configuration',
    })
    formData.value.blockingIssues.push('AML provider not selected')
  }

  // Check required documents
  const requiredDocs = formData.value.requiredDocuments.filter(d => d.isRequired)
  if (requiredDocs.length === 0) {
    const warning: ValidationWarning = {
      field: 'requiredDocuments',
      message: 'No required documents specified',
      recommendation: 'Consider requiring at least government ID for investor verification',
    }
    warns.push(warning)
    warnings.value.push(warning)
  }

  // Warnings for incomplete setup
  if (!formData.value.kycProviderConfigured && !formData.value.amlProviderConfigured) {
    const warning: ValidationWarning = {
      field: 'providers',
      message: 'No KYC or AML providers configured',
      recommendation: 'Configure at least one provider to meet compliance requirements',
    }
    warns.push(warning)
    warnings.value.push(warning)
  }

  if (formData.value.sanctionsScreeningEnabled && !formData.value.sanctionsScreeningProvider) {
    const warning: ValidationWarning = {
      field: 'sanctionsScreeningProvider',
      message: 'Sanctions screening enabled but no provider specified',
      recommendation: 'Specify a sanctions screening provider',
    }
    warns.push(warning)
    warnings.value.push(warning)
  }

  // Update overall readiness status
  if (errors.length === 0 && formData.value.kycProviderConfigured && formData.value.amlProviderConfigured) {
    formData.value.overallReadinessStatus = 'ready'
  } else if (errors.length === 0 && (formData.value.kycProviderConfigured || formData.value.amlProviderConfigured)) {
    formData.value.overallReadinessStatus = 'partially_ready'
  } else {
    formData.value.overallReadinessStatus = 'not_ready'
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warns,
    canProceed: true, // Allow proceeding with warnings
  }
}

// Handle field changes
const handleFieldChange = () => {
  emit('update:modelValue', formData.value)
  const validation = validateForm()
  emit('validation-change', validation)
}

// Initialize from props
onMounted(() => {
  if (props.modelValue) {
    formData.value = { ...formData.value, ...props.modelValue }
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
.kyc-aml-readiness-step {
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
