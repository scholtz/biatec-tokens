<template>
  <div class="jurisdiction-policy-step">
    <!-- Step Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-3">
        Jurisdiction & Distribution Policy
      </h2>
      <p class="text-gray-300 text-lg">
        Configure where your token is issued from, who can access it, and which regulatory frameworks apply.
        This helps us ensure your token meets legal requirements in your target markets.
      </p>
    </div>

    <!-- Issuer Jurisdiction -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-map-marker mr-2"></i>
        Issuer Jurisdiction
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Where is your organization legally registered? This determines which regulations apply to your token issuance.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="jurisdiction-country" class="block text-sm font-medium text-gray-300 mb-2">
            Country of Registration *
          </label>
          <select
            id="jurisdiction-country"
            v-model="formData.issuerCountry"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
            @change="handleFieldChange"
          >
            <option value="">Select country...</option>
            <option v-for="country in countries" :key="country.code" :value="country.code">
              {{ country.name }}
            </option>
          </select>
          <p v-if="validationErrors.issuerCountry" class="mt-1 text-sm text-red-400">
            {{ validationErrors.issuerCountry }}
          </p>
        </div>

        <div>
          <label for="jurisdiction-type" class="block text-sm font-medium text-gray-300 mb-2">
            Jurisdiction Type *
          </label>
          <select
            id="jurisdiction-type"
            v-model="formData.issuerJurisdictionType"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
            @change="handleFieldChange"
          >
            <option value="">Select type...</option>
            <option value="eu">European Union</option>
            <option value="us">United States</option>
            <option value="asia_pacific">Asia Pacific</option>
            <option value="middle_east">Middle East</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Distribution Geography -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-globe mr-2"></i>
        Distribution Geography
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Define where your token will be available. This affects compliance requirements and investor eligibility.
      </p>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-3">
          Distribution Scope *
        </label>
        <div class="space-y-3">
          <label class="flex items-start cursor-pointer group">
            <input
              type="radio"
              v-model="formData.distributionScope"
              value="global"
              class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Global</span>
              <p class="text-sm text-gray-400">Available to investors worldwide (subject to restrictions)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer group">
            <input
              type="radio"
              v-model="formData.distributionScope"
              value="regional"
              class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Regional</span>
              <p class="text-sm text-gray-400">Available in specific regions (e.g., EU, Asia Pacific)</p>
            </div>
          </label>

          <label class="flex items-start cursor-pointer group">
            <input
              type="radio"
              v-model="formData.distributionScope"
              value="country_specific"
              class="mt-1 w-4 h-4 text-biatec-accent focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Country-Specific</span>
              <p class="text-sm text-gray-400">Available only in selected countries</p>
            </div>
          </label>
        </div>
        <p v-if="validationErrors.distributionScope" class="mt-2 text-sm text-red-400">
          {{ validationErrors.distributionScope }}
        </p>
      </div>

      <!-- Country Selection (conditional) -->
      <div v-if="formData.distributionScope === 'country_specific'" class="mt-4">
        <label for="allowed-countries" class="block text-sm font-medium text-gray-300 mb-2">
          Allowed Countries *
        </label>
        <p class="text-sm text-gray-400 mb-3">
          Select countries where your token will be available
        </p>
        <select
          id="allowed-countries"
          v-model="formData.allowedCountries"
          multiple
          class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
          size="5"
          @change="handleFieldChange"
        >
          <option v-for="country in countries" :key="country.code" :value="country.code">
            {{ country.name }}
          </option>
        </select>
        <p class="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple countries</p>
        <p v-if="validationErrors.allowedCountries" class="mt-2 text-sm text-red-400">
          {{ validationErrors.allowedCountries }}
        </p>
      </div>
    </div>

    <!-- Investor Constraints -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-users mr-2"></i>
        Target Investors
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Define who can invest in your token. This determines compliance requirements and investor protections.
      </p>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-3">
          Investor Types *
        </label>
        <div class="space-y-3">
          <label v-for="type in investorTypeOptions" :key="type.value" class="flex items-start cursor-pointer group">
            <input
              type="checkbox"
              :value="type.value"
              v-model="formData.investorTypes"
              class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
              @change="handleFieldChange"
            />
            <div class="ml-3">
              <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">{{ type.label }}</span>
              <p class="text-sm text-gray-400">{{ type.description }}</p>
            </div>
          </label>
        </div>
        <p v-if="validationErrors.investorTypes" class="mt-2 text-sm text-red-400">
          {{ validationErrors.investorTypes }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.requiresAccreditation"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">Accreditation Required</span>
            <p class="text-sm text-gray-400">Investors must meet accreditation criteria</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Regulatory Framework -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-shield mr-2"></i>
        Regulatory Framework
      </h3>
      <p class="text-gray-300 mb-4 text-sm">
        Which regulatory frameworks apply to your token? This helps ensure compliance with relevant laws.
      </p>

      <div class="space-y-4">
        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.requiresMICACompliance"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">MICA Compliance</span>
            <p class="text-sm text-gray-400">EU Markets in Crypto-Assets regulation (for EU-based tokens)</p>
            <div v-if="formData.requiresMICACompliance" class="mt-2 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p class="text-sm text-blue-300">
                <i class="pi pi-info-circle mr-2"></i>
                MICA compliance requires additional documentation and legal review
              </p>
            </div>
          </div>
        </label>

        <label class="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.requiresSECCompliance"
            class="mt-1 w-4 h-4 text-biatec-accent rounded focus:ring-2 focus:ring-biatec-accent"
            @change="handleFieldChange"
          />
          <div class="ml-3">
            <span class="text-white font-medium group-hover:text-biatec-accent transition-colors">SEC Compliance</span>
            <p class="text-sm text-gray-400">US Securities and Exchange Commission regulations (for US tokens)</p>
            <div v-if="formData.requiresSECCompliance" class="mt-2 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p class="text-sm text-blue-300">
                <i class="pi pi-info-circle mr-2"></i>
                SEC compliance requires securities law expertise and registration
              </p>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Policy Summary -->
    <div v-if="policySummary" class="glass-effect rounded-xl p-6 mb-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/50">
      <h3 class="text-xl font-semibold text-green-300 mb-4">
        <i class="pi pi-check-circle mr-2"></i>
        Your Policy Summary
      </h3>
      <p class="text-gray-200 leading-relaxed">
        {{ policySummary }}
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
        Clearly defining your jurisdiction and distribution policy helps you:
      </p>
      <ul class="space-y-2 text-gray-300">
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Comply with local and international securities laws</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Avoid regulatory penalties and legal complications</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Build trust with investors through transparent policies</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Qualify for higher compliance badges and institutional adoption</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type {
  JurisdictionPolicy,
  StepValidation,
  ValidationError,
  ValidationWarning,
} from '../../types/complianceSetup'

interface Props {
  modelValue?: JurisdictionPolicy
}

interface Emits {
  (e: 'update:modelValue', value: JurisdictionPolicy): void
  (e: 'validation-change', validation: StepValidation): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form data
const formData = ref<JurisdictionPolicy>({
  issuerCountry: '',
  issuerJurisdictionType: 'other',
  distributionScope: 'global',
  investorTypes: [],
  requiresAccreditation: false,
  regulatoryFramework: 'none',
  requiresMICACompliance: false,
  requiresSECCompliance: false,
})

// Country list (simplified)
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'AE', name: 'United Arab Emirates' },
]

const investorTypeOptions = [
  {
    value: 'retail',
    label: 'Retail Investors',
    description: 'Individual investors with no special qualifications',
  },
  {
    value: 'accredited',
    label: 'Accredited Investors',
    description: 'Individuals or entities meeting income/net worth thresholds',
  },
  {
    value: 'institutional',
    label: 'Institutional Investors',
    description: 'Banks, funds, pension plans, and other large organizations',
  },
  {
    value: 'qualified_purchaser',
    label: 'Qualified Purchasers',
    description: 'High net worth individuals or entities (typically $5M+ in investments)',
  },
  {
    value: 'professional',
    label: 'Professional Investors',
    description: 'Licensed financial professionals and entities',
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

// Policy summary
const policySummary = computed(() => {
  if (!formData.value.issuerCountry || !formData.value.distributionScope || formData.value.investorTypes.length === 0) {
    return ''
  }

  const parts: string[] = []
  
  const country = countries.find(c => c.code === formData.value.issuerCountry)
  if (country) {
    parts.push(`This token will be issued from ${country.name}`)
  }
  
  if (formData.value.distributionScope === 'global') {
    parts.push('and available globally')
  } else if (formData.value.distributionScope === 'regional') {
    parts.push('and available in selected regions')
  } else if (formData.value.allowedCountries && formData.value.allowedCountries.length > 0) {
    parts.push(`and available in ${formData.value.allowedCountries.length} specific ${formData.value.allowedCountries.length === 1 ? 'country' : 'countries'}`)
  }
  
  const investorTypesText = formData.value.investorTypes.map(type => {
    const option = investorTypeOptions.find(o => o.value === type)
    return option?.label.toLowerCase() || type
  }).join(', ')
  
  parts.push(`Target investors: ${investorTypesText}`)
  
  if (formData.value.requiresAccreditation) {
    parts.push('Accreditation required')
  }
  
  const frameworks = []
  if (formData.value.requiresMICACompliance) frameworks.push('MICA')
  if (formData.value.requiresSECCompliance) frameworks.push('SEC')
  if (frameworks.length > 0) {
    parts.push(`Compliance: ${frameworks.join(', ')}`)
  }
  
  return parts.join('. ') + '.'
})

// Validate form
const validateForm = (): StepValidation => {
  validationErrors.value = {}
  warnings.value = []

  const errors: ValidationError[] = []
  const warns: ValidationWarning[] = []

  // Required fields
  if (!formData.value.issuerCountry) {
    validationErrors.value.issuerCountry = 'Issuer country is required'
    errors.push({
      field: 'issuerCountry',
      message: 'Issuer country is required',
      severity: 'critical',
      remediationHint: 'Select the country where your organization is legally registered',
    })
  }

  if (!formData.value.distributionScope) {
    validationErrors.value.distributionScope = 'Distribution scope is required'
    errors.push({
      field: 'distributionScope',
      message: 'Distribution scope is required',
      severity: 'critical',
      remediationHint: 'Specify whether you want global, regional, or country-specific distribution',
    })
  }

  if (!formData.value.investorTypes || formData.value.investorTypes.length === 0) {
    validationErrors.value.investorTypes = 'At least one investor type must be selected'
    errors.push({
      field: 'investorTypes',
      message: 'At least one investor type must be selected',
      severity: 'critical',
      remediationHint: 'Select the types of investors who can purchase this token',
    })
  }

  // Contradictory selections
  if (formData.value.distributionScope === 'country_specific' && (!formData.value.allowedCountries || formData.value.allowedCountries.length === 0)) {
    validationErrors.value.allowedCountries = 'Country-specific distribution requires at least one allowed country'
    errors.push({
      field: 'allowedCountries',
      message: 'Country-specific distribution requires allowed countries',
      severity: 'high',
      remediationHint: 'Specify which countries are allowed, or change distribution scope',
    })
  }

  // Warnings
  if (formData.value.investorTypes.includes('retail') && formData.value.requiresAccreditation) {
    const warning: ValidationWarning = {
      field: 'investorTypes',
      message: 'Retail investors typically do not require accreditation',
      recommendation: 'Consider removing accreditation requirement for retail investors, or restrict to accredited/institutional only',
    }
    warns.push(warning)
    warnings.value.push(warning)
  }

  if (formData.value.requiresMICACompliance && formData.value.issuerJurisdictionType !== 'eu') {
    const warning: ValidationWarning = {
      field: 'requiresMICACompliance',
      message: 'MICA compliance is primarily for EU-based issuers',
      recommendation: 'Verify that MICA compliance is necessary for your jurisdiction',
    }
    warns.push(warning)
    warnings.value.push(warning)
  }

  const validation: StepValidation = {
    isValid: errors.length === 0,
    errors,
    warnings: warns,
    canProceed: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
  }

  return validation
}

// Handle field changes
const handleFieldChange = () => {
  // Update model value
  emit('update:modelValue', formData.value)
  
  // Validate
  const validation = validateForm()
  emit('validation-change', validation)
}

// Initialize from props
onMounted(() => {
  if (props.modelValue) {
    formData.value = { ...formData.value, ...props.modelValue }
  }
  // Initial validation
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
.jurisdiction-policy-step {
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

/* Custom scrollbar for select */
select[multiple] {
  scrollbar-width: thin;
  scrollbar-color: rgba(147, 197, 253, 0.3) rgba(31, 41, 55, 0.5);
}

select[multiple]::-webkit-scrollbar {
  width: 8px;
}

select[multiple]::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 4px;
}

select[multiple]::-webkit-scrollbar-thumb {
  background: rgba(147, 197, 253, 0.3);
  border-radius: 4px;
}

select[multiple]::-webkit-scrollbar-thumb:hover {
  background: rgba(147, 197, 253, 0.5);
}
</style>
