<template>
  <WizardStep
    title="Project Setup"
    description="Tell us about your project and organization."
    :validation-errors="errors"
    :show-errors="showErrors"
    help-text="This information helps us ensure your token is properly configured and compliant with regulations."
  >
    <div class="space-y-6">
      <!-- Project Metadata -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-briefcase text-biatec-accent"></i>
          Project Information
        </h4>
        <p class="text-sm text-gray-400 mb-4">
          Provide basic information about your token project. This will be used for compliance and documentation purposes.
        </p>
        
        <div class="space-y-5">
          <!-- Project Name -->
          <Input
            id="project-name"
            v-model="formData.projectName"
            label="Project Name"
            placeholder="e.g., Real Estate Token Initiative"
            required
            :error="fieldErrors.projectName"
            hint="The name of your tokenization project or initiative"
          />

          <!-- Project Description -->
          <div class="space-y-2">
            <label for="project-description" class="block text-sm font-medium text-gray-900 dark:text-white">
              Project Description <span class="text-red-500">*</span>
            </label>
            <textarea
              id="project-description"
              v-model="formData.projectDescription"
              rows="4"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              placeholder="Describe what your token represents and its intended use..."
              :class="{ 'border-red-500': fieldErrors.projectDescription }"
            ></textarea>
            <p v-if="fieldErrors.projectDescription" class="text-sm text-red-400">{{ fieldErrors.projectDescription }}</p>
            <p class="text-xs text-gray-500">Explain what your token represents and how it will be used</p>
          </div>

          <!-- Token Purpose -->
          <div class="space-y-2">
            <label for="token-purpose" class="block text-sm font-medium text-gray-900 dark:text-white">
              Token Purpose <span class="text-red-500">*</span>
            </label>
            <select
              id="token-purpose"
              v-model="formData.tokenPurpose"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              :class="{ 'border-red-500': fieldErrors.tokenPurpose }"
            >
              <option value="">Select token purpose...</option>
              <option value="utility">Utility Token - Access to services or features</option>
              <option value="asset">Asset Token - Represents real-world assets</option>
              <option value="security">Security Token - Investment instrument</option>
              <option value="governance">Governance Token - Voting rights</option>
              <option value="reward">Reward/Loyalty Token - Customer incentives</option>
              <option value="other">Other</option>
            </select>
            <p v-if="fieldErrors.tokenPurpose" class="text-sm text-red-400">{{ fieldErrors.tokenPurpose }}</p>
            <p class="text-xs text-gray-500">Select the primary purpose of your token</p>
          </div>
        </div>
      </div>

      <!-- Token Standard Recommendations (shown after purpose selected) -->
      <div v-if="formData.tokenPurpose && recommendedStandards.length > 0" class="glass-effect rounded-xl p-6 border border-blue-500/30 bg-blue-500/5">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <i class="pi pi-lightbulb text-yellow-400"></i>
          Recommended Token Standards
        </h4>
        <p class="text-sm text-gray-400 mb-4">
          Based on your {{ getPurposeLabel(formData.tokenPurpose) }}, we recommend these token standards:
        </p>
        
        <div class="space-y-3">
          <div
            v-for="(comparison, index) in recommendedStandards.slice(0, 3)"
            :key="comparison.standard"
            class="p-4 rounded-lg border"
            :class="[
              index === 0
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-gray-600 bg-gray-800/30',
            ]"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span v-if="index === 0" class="text-xs font-semibold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                  BEST MATCH
                </span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ comparison.standard }}
                </span>
              </div>
              <span class="text-sm text-gray-400">
                Score: <span class="font-bold text-blue-400">{{ comparison.score }}%</span>
              </span>
            </div>

            <!-- Pros -->
            <div v-if="comparison.pros.length > 0" class="mb-2">
              <ul class="space-y-1">
                <li
                  v-for="(pro, pIndex) in comparison.pros.slice(0, 2)"
                  :key="pIndex"
                  class="text-xs text-green-400 flex items-start gap-1"
                >
                  <span class="mt-0.5">✓</span>
                  <span>{{ pro }}</span>
                </li>
              </ul>
            </div>

            <!-- Info button -->
            <button
              @click="showStandardDetails(comparison.standard)"
              class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Learn more about {{ comparison.standard }} →
            </button>
          </div>
        </div>

        <div class="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <p class="text-xs text-gray-400">
            💡 <strong class="text-gray-300">Tip:</strong> You'll be able to review and select your token standard in the next steps. 
            These recommendations are based on your project's purpose and requirements.
          </p>
        </div>
      </div>

      <!-- Issuer Details -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-building text-biatec-accent"></i>
          Issuer Organization
        </h4>
        <p class="text-sm text-gray-400 mb-4">
          Information about the organization issuing this token.
        </p>
        
        <div class="space-y-5">
          <!-- Organization Name -->
          <Input
            id="organization-name"
            v-model="formData.organizationName"
            label="Organization Name"
            placeholder="e.g., Acme Corporation Ltd."
            required
            :error="fieldErrors.organizationName"
            hint="Legal name of your organization"
          />

          <!-- Organization Type -->
          <div class="space-y-2">
            <label for="organization-type" class="block text-sm font-medium text-gray-900 dark:text-white">
              Organization Type
            </label>
            <select
              id="organization-type"
              v-model="formData.organizationType"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
            >
              <option value="">Select organization type...</option>
              <option value="corporation">Corporation</option>
              <option value="llc">Limited Liability Company (LLC)</option>
              <option value="partnership">Partnership</option>
              <option value="nonprofit">Non-Profit Organization</option>
              <option value="government">Government Entity</option>
              <option value="individual">Individual/Sole Proprietor</option>
            </select>
            <p class="text-xs text-gray-500">Type of legal entity</p>
          </div>

          <!-- Registration Number -->
          <Input
            id="registration-number"
            v-model="formData.registrationNumber"
            label="Registration/Tax ID Number"
            placeholder="e.g., 123456789"
            :error="fieldErrors.registrationNumber"
            hint="Company registration or tax identification number (optional)"
          />

          <!-- Jurisdiction -->
          <Input
            id="jurisdiction"
            v-model="formData.jurisdiction"
            label="Jurisdiction"
            placeholder="e.g., United States, Delaware"
            :error="fieldErrors.jurisdiction"
            hint="Country and state/region where your organization is registered"
          />
        </div>
      </div>

      <!-- Compliance Contact (Optional) -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="pi pi-user text-biatec-accent"></i>
            Compliance Contact
          </h4>
          <span class="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
            Optional
          </span>
        </div>
        <p class="text-sm text-gray-400 mb-4">
          Designate a person responsible for compliance matters related to this token.
        </p>
        
        <div class="space-y-5">
          <!-- Contact Name -->
          <Input
            id="compliance-contact-name"
            v-model="formData.complianceContactName"
            label="Contact Person Name"
            placeholder="e.g., Jane Smith"
            :error="fieldErrors.complianceContactName"
            hint="Name of compliance officer or responsible person"
          />

          <!-- Contact Email -->
          <Input
            id="compliance-contact-email"
            v-model="formData.complianceContactEmail"
            type="email"
            label="Contact Email"
            placeholder="e.g., compliance@example.com"
            :error="fieldErrors.complianceContactEmail"
            hint="Email address for compliance-related inquiries"
          />

          <!-- Contact Phone -->
          <Input
            id="compliance-contact-phone"
            v-model="formData.complianceContactPhone"
            type="tel"
            label="Contact Phone"
            placeholder="e.g., +1 (555) 123-4567"
            :error="fieldErrors.complianceContactPhone"
            hint="Phone number for urgent compliance matters"
          />
        </div>
      </div>

      <!-- Data Protection Notice -->
      <div class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-lock text-blue-400 text-lg mt-0.5"></i>
          <div>
            <h5 class="text-sm font-semibold text-blue-400 mb-1">Data Protection</h5>
            <p class="text-xs text-gray-300">
              All information provided is encrypted and stored securely. We use this data solely for 
              compliance verification and will never share it with third parties without your consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, watch, onErrorCaptured } from 'vue'
import { useTokenDraftStore } from '../../../stores/tokenDraft'
import WizardStep from '../WizardStep.vue'
import Input from '../../ui/Input.vue'
import { TokenUseCase } from '../../../types/tokenUtility'
import type { UtilityComparison } from '../../../types/tokenUtility'
import { getUtilityComparisons } from '../../../utils/tokenUtilityRecommendations'

const tokenDraftStore = useTokenDraftStore()

const showErrors = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string>>({})

// Error boundary to prevent unhandled errors from breaking the UI
onErrorCaptured((err, _instance, info) => {
  console.error('Error in ProjectSetupStep:', err, info)
  return false // Prevent error from propagating
})

// Form data
const formData = ref({
  projectName: '',
  projectDescription: '',
  tokenPurpose: '',
  organizationName: '',
  organizationType: '',
  registrationNumber: '',
  jurisdiction: '',
  complianceContactName: '',
  complianceContactEmail: '',
  complianceContactPhone: '',
})

// Map form token purpose to TokenUseCase enum
const mapPurposeToUseCase = (purpose: string): TokenUseCase | null => {
  const mapping: Record<string, TokenUseCase> = {
    'utility': TokenUseCase.UTILITY_TOKEN,
    'asset': TokenUseCase.RWA_TOKEN,
    'security': TokenUseCase.SECURITY_TOKEN,
    'governance': TokenUseCase.GOVERNANCE_TOKEN,
    'reward': TokenUseCase.REWARD_TOKEN,
  }
  return mapping[purpose] || null
}

// Get purpose label for display
const getPurposeLabel = (purpose: string): string => {
  const labels: Record<string, string> = {
    'utility': 'utility token',
    'asset': 'asset token',
    'security': 'security token',
    'governance': 'governance token',
    'reward': 'reward token',
    'other': 'other purpose',
  }
  return labels[purpose] || 'selected purpose'
}

// Compute recommended standards based on token purpose
const recommendedStandards = computed<UtilityComparison[]>(() => {
  try {
    if (!formData.value.tokenPurpose) {
      return []
    }

    const useCase = mapPurposeToUseCase(formData.value.tokenPurpose)
    if (!useCase) {
      return []
    }

    // Get recommendations with appropriate flags
    return getUtilityComparisons({
      useCase,
      requiresCompliance: formData.value.tokenPurpose === 'asset' || formData.value.tokenPurpose === 'security',
      costSensitive: true, // Default to preferring low-cost options
    })
  } catch (error) {
    console.error('Error computing recommendations:', error)
    return [] // Gracefully return empty array on error
  }
})

// Show standard details (placeholder for future modal)
const showStandardDetails = (standard: string) => {
  // TODO: Could open a modal with full TokenUtilityCard details
  console.log('Show details for standard:', standard)
}

// Load from draft store if available
if (tokenDraftStore.currentDraft?.projectSetup) {
  Object.assign(formData.value, tokenDraftStore.currentDraft.projectSetup)
}

// Validation
const validateField = (field: string): boolean => {
  fieldErrors.value[field] = ''
  
  switch (field) {
    case 'projectName':
      if (!formData.value.projectName.trim()) {
        fieldErrors.value[field] = 'Project name is required'
        return false
      }
      if (formData.value.projectName.length < 3) {
        fieldErrors.value[field] = 'Project name must be at least 3 characters'
        return false
      }
      break
      
    case 'projectDescription':
      if (!formData.value.projectDescription.trim()) {
        fieldErrors.value[field] = 'Project description is required'
        return false
      }
      if (formData.value.projectDescription.length < 20) {
        fieldErrors.value[field] = 'Please provide a more detailed description (at least 20 characters)'
        return false
      }
      break
      
    case 'tokenPurpose':
      if (!formData.value.tokenPurpose) {
        fieldErrors.value[field] = 'Please select a token purpose'
        return false
      }
      break
      
    case 'organizationName':
      if (!formData.value.organizationName.trim()) {
        fieldErrors.value[field] = 'Organization name is required'
        return false
      }
      break
      
    case 'complianceContactEmail':
      if (formData.value.complianceContactEmail && !isValidEmail(formData.value.complianceContactEmail)) {
        fieldErrors.value[field] = 'Please enter a valid email address'
        return false
      }
      break
  }
  
  return true
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateAll = (): boolean => {
  const requiredFields = ['projectName', 'projectDescription', 'tokenPurpose', 'organizationName']
  let isValid = true
  
  requiredFields.forEach(field => {
    if (!validateField(field)) {
      isValid = false
    }
  })
  
  // Also validate optional email if provided
  if (formData.value.complianceContactEmail) {
    if (!validateField('complianceContactEmail')) {
      isValid = false
    }
  }
  
  if (!isValid) {
    errors.value = ['Please fill in all required fields correctly']
    showErrors.value = true
  } else {
    errors.value = []
    showErrors.value = false
  }
  
  return isValid
}

// Watch for changes and save to draft
watch(formData, (newData) => {
  if (tokenDraftStore.currentDraft) {
    tokenDraftStore.currentDraft.projectSetup = { ...newData }
  }
}, { deep: true })

// Step validation
const isValid = computed(() => {
  const requiredFields = ['projectName', 'projectDescription', 'tokenPurpose', 'organizationName']
  return requiredFields.every(field => {
    const value = formData.value[field as keyof typeof formData.value]
    return value && String(value).trim().length > 0
  })
})

defineExpose({
  isValid,
  validateAll,
})
</script>
