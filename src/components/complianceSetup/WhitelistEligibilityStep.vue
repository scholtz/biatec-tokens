<template>
  <div class="whitelist-eligibility-step">
    <!-- Step Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-3">
        Whitelist & Investor Eligibility
      </h2>
      <p class="text-gray-300 text-lg">
        Control who can access your token through whitelist restrictions and investor eligibility rules.
        This helps you manage compliance and protect your organization from unauthorized participants.
      </p>
    </div>

    <!-- Whitelist Requirement -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-list mr-2"></i>
        Whitelist Configuration
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        A whitelist restricts token access to pre-approved addresses. This is essential for regulatory compliance
        and investor protection in many jurisdictions.
      </p>

      <div class="mb-6">
        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.whitelistRequired"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Require Whitelist</span>
            <p class="text-sm text-gray-400">Only whitelisted addresses can hold or transfer this token</p>
          </div>
        </label>
      </div>

      <!-- Whitelist Selection (conditional) -->
      <div v-if="formData.whitelistRequired" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Select Whitelist *
          </label>
          <select
            v-model="formData.whitelistId"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
            @change="handleFieldChange"
          >
            <option value="">Select existing whitelist...</option>
            <option v-for="whitelist in availableWhitelists" :key="whitelist.id" :value="whitelist.id">
              {{ whitelist.name }} ({{ whitelist.memberCount }} members)
            </option>
          </select>
          <p v-if="validationErrors.whitelistId" class="mt-1 text-sm text-red-400">
            {{ validationErrors.whitelistId }}
          </p>
          <p class="text-xs text-gray-500 mt-2">
            <i class="pi pi-info-circle mr-1"></i>
            Create and manage whitelists in the Whitelist Management section
          </p>
        </div>

        <div v-if="formData.whitelistId && selectedWhitelist" class="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p class="text-sm text-blue-300 mb-2">
            <i class="pi pi-check-circle mr-2"></i>
            <strong>{{ selectedWhitelist.name }}</strong>
          </p>
          <p class="text-sm text-blue-200/80">
            {{ selectedWhitelist.memberCount }} members • Created {{ formatDate(selectedWhitelist.createdAt) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Access Restrictions -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-lock mr-2"></i>
        Access Restrictions
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Define how investors can access your token and what verification they need to complete.
      </p>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">
          Restriction Type *
        </label>
        <div class="space-y-3">
          <label class="flex items-start cursor-pointer group">
            <input
              type="radio"
              v-model="formData.restrictionType"
              value="none"
              class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">No Restrictions</span>
              <p class="text-sm text-gray-400">Open access - anyone can hold and transfer</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer group">
            <input
              type="radio"
              v-model="formData.restrictionType"
              value="kyc_required"
              class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">KYC Required</span>
              <p class="text-sm text-gray-400">Investors must complete KYC verification</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer group">
            <input
              type="radio"
              v-model="formData.restrictionType"
              value="whitelist_only"
              class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Whitelist Only</span>
              <p class="text-sm text-gray-400">Only whitelisted addresses can participate</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer group">
            <input
              type="radio"
              v-model="formData.restrictionType"
              value="custom"
              class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Custom Rules</span>
              <p class="text-sm text-gray-400">Define custom eligibility criteria</p>
            </div>
          </label>
        </div>
        <p v-if="validationErrors.restrictionType" class="mt-2 text-sm text-red-400">
          {{ validationErrors.restrictionType }}
        </p>
      </div>

      <!-- Verification Requirements -->
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-white">Verification Requirements</h4>
        
        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.requiresKYC"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">KYC Verification</span>
            <p class="text-sm text-gray-400">Know Your Customer identity verification</p>
          </div>
        </label>

        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.requiresAML"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">AML Screening</span>
            <p class="text-sm text-gray-400">Anti-Money Laundering compliance checks</p>
          </div>
        </label>

        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.requiresAccreditationProof"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Accreditation Proof</span>
            <p class="text-sm text-gray-400">Investors must provide proof of accredited status</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Transfer Restrictions -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-ban mr-2"></i>
        Transfer & Trading Rules
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Control how tokens can be transferred between holders and whether secondary trading is allowed.
      </p>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">
          Transfer Restrictions
        </label>
        <div class="space-y-3">
          <label v-for="restriction in transferRestrictionOptions" :key="restriction.value" class="flex items-start cursor-pointer group">
            <input
              type="checkbox"
              :value="restriction.value"
              v-model="formData.transferRestrictions"
              class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">{{ restriction.label }}</span>
              <p class="text-sm text-gray-400">{{ restriction.description }}</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Lock-up Period -->
      <div class="mb-6">
        <label class="flex items-start cursor-pointer group mb-4">
          <input
            type="checkbox"
            v-model="formData.hasLockupPeriod"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Lock-up Period</span>
            <p class="text-sm text-gray-400">Tokens cannot be transferred for a specified period after acquisition</p>
          </div>
        </label>

        <div v-if="formData.hasLockupPeriod" class="ml-7">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Lock-up Duration (Days) *
          </label>
          <input
            type="number"
            v-model.number="formData.lockupDurationDays"
            min="1"
            max="3650"
            class="w-full md:w-64 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
            placeholder="e.g., 180"
            @change="handleFieldChange"
          />
          <p v-if="validationErrors.lockupDurationDays" class="mt-1 text-sm text-red-400">
            {{ validationErrors.lockupDurationDays }}
          </p>
        </div>
      </div>

      <!-- Secondary Trading -->
      <div>
        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.allowSecondaryTrading"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Allow Secondary Trading</span>
            <p class="text-sm text-gray-400">Tokens can be traded on secondary markets after initial sale</p>
          </div>
        </label>

        <div v-if="formData.allowSecondaryTrading" class="mt-4 ml-7">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Secondary Trading Restrictions (Optional)
          </label>
          <textarea
            v-model="formData.secondaryTradingRestrictions"
            rows="3"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
            placeholder="e.g., Only on regulated exchanges, KYC required for all traders..."
            @change="handleFieldChange"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Configuration Summary -->
    <div v-if="configSummary" class="glass-effect rounded-xl p-6 mb-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/50">
      <h3 class="text-xl font-semibold text-green-300 mb-4">
        <i class="pi pi-check-circle mr-2"></i>
        Your Configuration Summary
      </h3>
      <p class="text-gray-200 leading-relaxed">
        {{ configSummary }}
      </p>
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
        Proper whitelist and eligibility controls help you:
      </p>
      <ul class="space-y-2 text-gray-300">
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Prevent unauthorized access and ensure only verified investors participate</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Comply with securities regulations and investor protection laws</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Reduce fraud and money laundering risks through identity verification</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Maintain control over token distribution and secondary markets</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type {
  WhitelistEligibility,
  StepValidation,
  ValidationError,
  ValidationWarning,
  TransferRestriction,
} from '../../types/complianceSetup'

interface Props {
  modelValue?: WhitelistEligibility
}

interface Emits {
  (e: 'update:modelValue', value: WhitelistEligibility): void
  (e: 'validation-change', validation: StepValidation): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Mock whitelist data (replace with actual API call)
const availableWhitelists = ref([
  { id: 'wl_1', name: 'Accredited Investors', memberCount: 45, createdAt: new Date('2024-01-15') },
  { id: 'wl_2', name: 'Institutional Partners', memberCount: 12, createdAt: new Date('2024-02-01') },
  { id: 'wl_3', name: 'Beta Testers', memberCount: 120, createdAt: new Date('2024-03-10') },
])

// Form data
const formData = ref<WhitelistEligibility>({
  whitelistRequired: false,
  restrictionType: 'none',
  requiresKYC: false,
  requiresAML: false,
  requiresAccreditationProof: false,
  allowedInvestorTypes: [],
  transferRestrictions: [],
  hasLockupPeriod: false,
  allowSecondaryTrading: true,
})

const transferRestrictionOptions = [
  {
    value: 'no_restrictions' as TransferRestriction,
    label: 'No Restrictions',
    description: 'Tokens can be freely transferred',
  },
  {
    value: 'issuer_approval_required' as TransferRestriction,
    label: 'Issuer Approval Required',
    description: 'Each transfer must be approved by the issuer',
  },
  {
    value: 'whitelist_only' as TransferRestriction,
    label: 'Whitelist Only',
    description: 'Transfers only between whitelisted addresses',
  },
  {
    value: 'time_locked' as TransferRestriction,
    label: 'Time-Locked',
    description: 'Transfers locked until specific date/time',
  },
  {
    value: 'amount_limited' as TransferRestriction,
    label: 'Amount Limited',
    description: 'Maximum transfer amount per transaction',
  },
]

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

// Selected whitelist
const selectedWhitelist = computed(() => {
  if (!formData.value.whitelistId) return null
  return availableWhitelists.value.find(w => w.id === formData.value.whitelistId) || null
})

// Configuration summary
const configSummary = computed(() => {
  const parts: string[] = []

  if (formData.value.whitelistRequired && formData.value.whitelistName) {
    parts.push(`Whitelist "${formData.value.whitelistName}" is required`)
  } else if (!formData.value.whitelistRequired) {
    parts.push('No whitelist required')
  }

  const restrictionLabels: Record<string, string> = {
    none: 'No access restrictions',
    kyc_required: 'KYC verification required',
    whitelist_only: 'Whitelist-only access',
    custom: 'Custom eligibility rules',
  }
  parts.push(restrictionLabels[formData.value.restrictionType])

  const verifications = []
  if (formData.value.requiresKYC) verifications.push('KYC')
  if (formData.value.requiresAML) verifications.push('AML')
  if (formData.value.requiresAccreditationProof) verifications.push('Accreditation proof')
  if (verifications.length > 0) {
    parts.push(`Required: ${verifications.join(', ')}`)
  }

  if (formData.value.hasLockupPeriod && formData.value.lockupDurationDays) {
    parts.push(`Lock-up period: ${formData.value.lockupDurationDays} days`)
  }

  if (formData.value.allowSecondaryTrading) {
    parts.push('Secondary trading allowed')
  } else {
    parts.push('Secondary trading not allowed')
  }

  return parts.length > 0 ? parts.join('. ') + '.' : ''
})

// Validate form
const validateForm = (): StepValidation => {
  validationErrors.value = {}
  warnings.value = []

  const errors: ValidationError[] = []
  const warns: ValidationWarning[] = []

  // Whitelist consistency
  if (formData.value.whitelistRequired && !formData.value.whitelistId) {
    validationErrors.value.whitelistId = 'Whitelist is required but not selected'
    errors.push({
      field: 'whitelistId',
      message: 'Whitelist is required but not selected',
      severity: 'critical',
      remediationHint: 'Create or select a whitelist to continue',
    })
  }

  // Restriction type consistency
  if (formData.value.restrictionType === 'whitelist_only' && !formData.value.whitelistRequired) {
    validationErrors.value.restrictionType = 'Whitelist-only restriction requires whitelist to be enabled'
    errors.push({
      field: 'restrictionType',
      message: 'Whitelist-only restriction requires whitelist to be enabled',
      severity: 'high',
      remediationHint: 'Enable whitelist requirement or change restriction type',
    })
  }

  // Lock-up validation
  if (formData.value.hasLockupPeriod && !formData.value.lockupDurationDays) {
    validationErrors.value.lockupDurationDays = 'Lock-up duration is required'
    errors.push({
      field: 'lockupDurationDays',
      message: 'Lock-up duration is required',
      severity: 'high',
      remediationHint: 'Specify lock-up duration in days or disable lock-up period',
    })
  }

  // Warnings
  if (formData.value.requiresKYC && !formData.value.whitelistRequired) {
    const warning: ValidationWarning = {
      field: 'whitelistRequired',
      message: 'KYC requirements typically work best with a whitelist',
      recommendation: 'Consider enabling whitelist to manage KYC-verified investors',
    }
    warns.push(warning)
    warnings.value.push(warning)
  }

  if (!formData.value.requiresKYC && !formData.value.requiresAML && formData.value.restrictionType !== 'none') {
    const warning: ValidationWarning = {
      field: 'requiresKYC',
      message: 'Access restrictions without KYC/AML may be insufficient for compliance',
      recommendation: 'Consider adding KYC or AML verification to strengthen compliance',
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

// Handle field changes
const handleFieldChange = () => {
  // Update whitelist name if selected
  if (formData.value.whitelistId) {
    const whitelist = availableWhitelists.value.find(w => w.id === formData.value.whitelistId)
    if (whitelist) {
      formData.value.whitelistName = whitelist.name
    }
  }

  emit('update:modelValue', formData.value)
  const validation = validateForm()
  emit('validation-change', validation)
}

// Format date helper
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
.whitelist-eligibility-step {
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
