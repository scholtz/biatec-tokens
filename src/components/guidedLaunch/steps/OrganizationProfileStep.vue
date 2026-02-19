<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <BuildingOfficeIcon class="w-8 h-8 text-blue-400" />
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">Organization Profile</h2>
      <p class="text-gray-300">
        Tell us about your organization to ensure proper regulatory compliance
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6" aria-label="Organization profile form">
      <!-- Organization Name -->
      <div>
        <label for="org-name" class="block text-sm font-medium text-gray-300 mb-2">
          Organization Name <span class="text-red-400" aria-hidden="true">*</span>
        </label>
        <input
          id="org-name"
          v-model="formData.organizationName"
          type="text"
          required
          aria-required="true"
          :aria-invalid="!!fieldErrors.organizationName"
          :aria-describedby="fieldErrors.organizationName ? 'org-name-error' : undefined"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter your organization name"
          @blur="validateField('organizationName')"
        />
        <p v-if="fieldErrors.organizationName" id="org-name-error" role="alert" class="mt-1 text-sm text-red-400">
          {{ fieldErrors.organizationName }}
        </p>
      </div>

      <!-- Organization Type -->
      <div>
        <label for="org-type" class="block text-sm font-medium text-gray-300 mb-2">
          Organization Type <span class="text-red-400" aria-hidden="true">*</span>
        </label>
        <select
          id="org-type"
          v-model="formData.organizationType"
          required
          aria-required="true"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="">Select type...</option>
          <option value="company">Company / Corporation</option>
          <option value="foundation">Foundation</option>
          <option value="dao">DAO</option>
          <option value="individual">Individual</option>
          <option value="other">Other</option>
        </select>
      </div>

      <!-- Registration Number -->
      <div>
        <label for="reg-number" class="block text-sm font-medium text-gray-300 mb-2">
          Registration Number
          <span class="text-gray-500 text-xs ml-2">(Optional but recommended)</span>
        </label>
        <input
          id="reg-number"
          v-model="formData.registrationNumber"
          type="text"
          aria-describedby="reg-number-hint"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Company registration or tax ID"
        />
        <p id="reg-number-hint" class="mt-1 text-xs text-gray-400">
          Required for MICA-compliant tokens
        </p>
      </div>

      <!-- Jurisdiction -->
      <div>
        <label for="jurisdiction" class="block text-sm font-medium text-gray-300 mb-2">
          Jurisdiction <span class="text-red-400" aria-hidden="true">*</span>
        </label>
        <input
          id="jurisdiction"
          v-model="formData.jurisdiction"
          type="text"
          required
          aria-required="true"
          aria-describedby="jurisdiction-hint"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Country or region (e.g., United States, EU)"
        />
        <p id="jurisdiction-hint" class="mt-1 text-xs text-gray-400">
          Where your organization is registered or operates
        </p>
      </div>

      <!-- Website -->
      <div>
        <label for="website" class="block text-sm font-medium text-gray-300 mb-2">
          Website
          <span class="text-gray-500 text-xs ml-2">(Optional)</span>
        </label>
        <input
          id="website"
          v-model="formData.website"
          type="url"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="https://example.com"
        />
      </div>

      <!-- Contact Information Section -->
      <div class="pt-4 border-t border-gray-700">
        <h3 class="text-lg font-semibold text-white mb-4">Contact Information</h3>
        
        <div class="space-y-4">
          <!-- Your Role -->
          <div>
            <label for="contact-role" class="block text-sm font-medium text-gray-300 mb-2">
              Your Role <span class="text-red-400" aria-hidden="true">*</span>
            </label>
            <select
              id="contact-role"
              v-model="formData.role"
              required
              aria-required="true"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select your role...</option>
              <option value="compliance_officer">Compliance Officer</option>
              <option value="cfo_finance">CFO / Finance Manager</option>
              <option value="cto_tech">CTO / Technical Lead</option>
              <option value="product_manager">Product Manager</option>
              <option value="business_owner">Business Owner</option>
              <option value="legal_counsel">Legal Counsel</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Contact Name -->
          <div>
            <label for="contact-name" class="block text-sm font-medium text-gray-300 mb-2">
              Contact Name <span class="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="contact-name"
              v-model="formData.contactName"
              type="text"
              required
              aria-required="true"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Your full name"
            />
          </div>

          <!-- Contact Email -->
          <div>
            <label for="contact-email" class="block text-sm font-medium text-gray-300 mb-2">
              Contact Email <span class="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="contact-email"
              v-model="formData.contactEmail"
              type="email"
              required
              aria-required="true"
              :aria-invalid="!!fieldErrors.contactEmail"
              :aria-describedby="fieldErrors.contactEmail ? 'contact-email-error' : undefined"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="email@example.com"
            />
            <p v-if="fieldErrors.contactEmail" id="contact-email-error" role="alert" class="mt-1 text-sm text-red-400">
              {{ fieldErrors.contactEmail }}
            </p>
          </div>

          <!-- Contact Phone -->
          <div>
            <label for="contact-phone" class="block text-sm font-medium text-gray-300 mb-2">
              Contact Phone
              <span class="text-gray-500 text-xs ml-2">(Optional)</span>
            </label>
            <input
              id="contact-phone"
              v-model="formData.contactPhone"
              type="tel"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <div class="flex items-start">
          <InformationCircleIcon class="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div class="text-sm text-gray-300">
            <strong class="text-white">Why we need this information:</strong>
            Your organization details are used to generate compliant token documentation and ensure proper regulatory classification. This information will be included in token metadata for transparency and trust.
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <Button
        type="submit"
        variant="primary"
        size="lg"
        full-width
        :disabled="!isFormValid"
      >
        Continue to Token Intent
        <i class="pi pi-arrow-right ml-2"></i>
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGuidedLaunchStore } from '../../../stores/guidedLaunch'
import type { OrganizationProfile, ValidationResult } from '../../../types/guidedLaunch'
import { isValidEmail, isRequiredFieldValid } from '../../../utils/formValidation'
import Button from '../../ui/Button.vue'
import { BuildingOfficeIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

const guidedLaunchStore = useGuidedLaunchStore()

// Define emits
const emit = defineEmits<{
  complete: [validation: ValidationResult]
  update: [profile: OrganizationProfile]
}>()

// Form data
const formData = ref<OrganizationProfile>({
  organizationName: '',
  organizationType: 'company',
  registrationNumber: '',
  jurisdiction: '',
  website: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  role: 'business_owner',
})

// Field errors
const fieldErrors = ref<Record<string, string>>({})

// Computed
const isFormValid = computed(() => {
  return (
    isRequiredFieldValid(formData.value.organizationName) &&
    formData.value.organizationType.length > 0 &&
    isRequiredFieldValid(formData.value.jurisdiction) &&
    isRequiredFieldValid(formData.value.contactName) &&
    isRequiredFieldValid(formData.value.contactEmail) &&
    formData.value.role.length > 0 &&
    isValidEmail(formData.value.contactEmail)
  )
})

// Validation
const validateField = (field: keyof OrganizationProfile) => {
  switch (field) {
    case 'organizationName':
      if (!formData.value.organizationName.trim()) {
        fieldErrors.value.organizationName = 'Organization name is required'
      } else {
        delete fieldErrors.value.organizationName
      }
      break
    case 'contactEmail':
      if (!isValidEmail(formData.value.contactEmail)) {
        fieldErrors.value.contactEmail = 'Please enter a valid email address'
      } else {
        delete fieldErrors.value.contactEmail
      }
      break
  }
}

const validateForm = (): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  if (!formData.value.organizationName.trim()) {
    errors.push('Organization name is required')
  }
  if (!formData.value.organizationType) {
    errors.push('Organization type is required')
  }
  if (!formData.value.jurisdiction.trim()) {
    errors.push('Jurisdiction is required')
  }
  if (!formData.value.contactName.trim()) {
    errors.push('Contact name is required')
  }
  if (!formData.value.contactEmail.trim()) {
    errors.push('Contact email is required')
  } else if (!isValidEmail(formData.value.contactEmail)) {
    errors.push('Invalid email format')
  }
  if (!formData.value.role) {
    errors.push('Your role is required')
  }

  // Warnings
  if (!formData.value.registrationNumber) {
    warnings.push('Registration number recommended for compliance')
  }
  if (!formData.value.website) {
    warnings.push('Website recommended for credibility')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Handlers
const handleSubmit = () => {
  const validation = validateForm()
  
  if (validation.isValid) {
    // Emit update
    emit('update', formData.value)
    
    // Emit complete
    emit('complete', validation)
  }
}

// Watch for changes and auto-save
watch(formData, (newData) => {
  emit('update', newData)
}, { deep: true })

// Load existing data on mount
onMounted(() => {
  const existingProfile = guidedLaunchStore.currentForm.organizationProfile
  if (existingProfile) {
    formData.value = { ...existingProfile }
  }
})
</script>
