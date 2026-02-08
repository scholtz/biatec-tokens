<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Progress Header -->
      <div class="mb-8 text-center">
        <h1 class="text-4xl font-bold text-white mb-2">Welcome to Biatec Tokens</h1>
        <p class="text-xl text-gray-300 mb-6">
          Let's set up your account and get you started with compliant token creation
        </p>
        
        <!-- Progress Bar -->
        <div class="relative pt-1">
          <div class="flex mb-2 items-center justify-between">
            <div>
              <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-400 bg-blue-900/50">
                Step {{ currentStep + 1 }} of {{ totalSteps }}
              </span>
            </div>
            <div class="text-right">
              <span class="text-xs font-semibold inline-block text-blue-400">
                {{ Math.round((currentStep / totalSteps) * 100) }}% Complete
              </span>
            </div>
          </div>
          <div class="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-700">
            <div 
              :style="{ width: `${(currentStep / totalSteps) * 100}%` }" 
              class="transition-all duration-500 shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-blue-600"
            />
          </div>
        </div>
      </div>

      <!-- Steps Container -->
      <Card variant="glass" padding="lg">
        <!-- Step 1: Welcome & Role Selection -->
        <div v-if="currentStep === 0" class="space-y-6">
          <div class="text-center mb-8">
            <ShieldCheckIcon class="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 class="text-2xl font-bold text-white mb-3">Tell Us About Yourself</h2>
            <p class="text-gray-300">
              Help us tailor your experience by sharing a bit about your role and needs
            </p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Organization Name <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formData.organizationName"
                type="text"
                class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter your organization name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Your Role <span class="text-red-400">*</span>
              </label>
              <select
                v-model="formData.role"
                class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
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

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                What do you want to create? <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  v-for="option in tokenTypeOptions"
                  :key="option.value"
                  @click="formData.intendedTokenType = option.value"
                  :class="[
                    'p-4 rounded-lg border-2 text-left transition-all',
                    formData.intendedTokenType === option.value
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  ]"
                >
                  <div class="font-semibold text-white mb-1">{{ option.label }}</div>
                  <div class="text-sm text-gray-400">{{ option.description }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Compliance & Networks -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="text-center mb-8">
            <DocumentCheckIcon class="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 class="text-2xl font-bold text-white mb-3">Compliance & Network Preferences</h2>
            <p class="text-gray-300">
              Select the networks you plan to deploy to and your compliance requirements
            </p>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">
                Deployment Networks <span class="text-red-400">*</span>
                <span class="text-xs text-gray-400 ml-2">(Select all that apply)</span>
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label
                  v-for="network in networkOptions"
                  :key="network.value"
                  class="flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all"
                  :class="[
                    formData.selectedNetworks.includes(network.value)
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  ]"
                >
                  <input
                    type="checkbox"
                    :value="network.value"
                    v-model="formData.selectedNetworks"
                    class="mt-1 mr-3"
                  />
                  <div class="flex-1">
                    <div class="font-semibold text-white mb-1">{{ network.label }}</div>
                    <div class="text-sm text-gray-400">{{ network.description }}</div>
                    <Badge
                      v-if="network.requiresPlan"
                      :variant="network.requiresPlan === 'professional' ? 'info' : 'warning'"
                      size="sm"
                      class="mt-2"
                    >
                      {{ network.requiresPlan === 'professional' ? 'Pro+' : 'Enterprise' }}
                    </Badge>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Compliance Requirements
              </label>
              <div class="space-y-3">
                <label class="flex items-center p-3 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50">
                  <input
                    type="checkbox"
                    v-model="formData.requiresMICA"
                    class="mr-3"
                  />
                  <span class="text-white">MICA Compliance (EU Regulation)</span>
                </label>
                <label class="flex items-center p-3 rounded-lg bg-gray-800/30 cursor-pointer hover:bg-gray-800/50">
                  <input
                    type="checkbox"
                    v-model="formData.requiresKYC"
                    class="mr-3"
                  />
                  <span class="text-white">KYC/AML Requirements</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Plan Recommendation -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="text-center mb-8">
            <SparklesIcon class="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 class="text-2xl font-bold text-white mb-3">Recommended Plan</h2>
            <p class="text-gray-300">
              Based on your selections, we recommend the following plan
            </p>
          </div>

          <!-- Recommended Plan Card -->
          <Card variant="elevated" padding="lg" class="border-2 border-blue-500">
            <div class="flex items-start justify-between mb-6">
              <div>
                <h3 class="text-2xl font-bold text-white mb-2">{{ recommendedPlan.name }}</h3>
                <p class="text-gray-300">{{ recommendedPlan.description }}</p>
              </div>
              <Badge variant="info" size="lg">Recommended</Badge>
            </div>
            
            <div class="mb-6">
              <span class="text-4xl font-bold text-white">${{ recommendedPlan.price }}</span>
              <span class="text-gray-400">/month</span>
            </div>

            <div class="space-y-3 mb-6">
              <h4 class="font-semibold text-white mb-3">Includes:</h4>
              <div
                v-for="feature in recommendedPlan.features"
                :key="feature"
                class="flex items-start"
              >
                <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <span class="text-gray-300">{{ feature }}</span>
              </div>
            </div>

            <div class="bg-blue-900/30 rounded-lg p-4 mb-6">
              <div class="flex items-start">
                <InformationCircleIcon class="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-sm text-gray-300">
                    <strong class="text-white">Why this plan?</strong> Based on your need for
                    <span v-if="formData.requiresMICA" class="text-blue-400">MICA compliance</span>
                    <span v-if="formData.requiresMICA && formData.requiresKYC">, </span>
                    <span v-if="formData.requiresKYC" class="text-blue-400">KYC/AML</span>
                    and deployment to
                    <span class="text-blue-400">{{ formData.selectedNetworks.length }} network(s)</span>,
                    this plan provides the necessary features and support.
                  </p>
                </div>
              </div>
            </div>

            <Button
              @click="handleSelectRecommendedPlan"
              variant="primary"
              size="lg"
              full-width
              :loading="loading"
            >
              Start with {{ recommendedPlan.name }}
            </Button>
          </Card>

          <!-- Alternative Plans -->
          <div class="text-center">
            <button
              @click="viewAllPlans"
              class="text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all pricing plans →
            </button>
          </div>
        </div>

        <!-- Step 4: Next Steps -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="text-center mb-8">
            <CheckCircleIcon class="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 class="text-2xl font-bold text-white mb-3">You're All Set!</h2>
            <p class="text-gray-300">
              Your account is configured. Let's create your first token.
            </p>
          </div>

          <div class="space-y-4">
            <Card variant="glass" padding="md">
              <div class="flex items-center">
                <CheckIcon class="w-6 h-6 text-green-400 mr-3" />
                <div class="flex-1">
                  <div class="font-semibold text-white">Account Setup Complete</div>
                  <div class="text-sm text-gray-400">Organization and preferences saved</div>
                </div>
              </div>
            </Card>

            <Card variant="glass" padding="md">
              <div class="flex items-center">
                <CheckIcon class="w-6 h-6 text-green-400 mr-3" />
                <div class="flex-1">
                  <div class="font-semibold text-white">Compliance Templates Ready</div>
                  <div class="text-sm text-gray-400">MICA and regulatory templates loaded</div>
                </div>
              </div>
            </Card>

            <Card variant="glass" padding="md">
              <div class="flex items-center">
                <SparklesIcon class="w-6 h-6 text-purple-400 mr-3" />
                <div class="flex-1">
                  <div class="font-semibold text-white">Ready to Create Tokens</div>
                  <div class="text-sm text-gray-400">Guided wizard will walk you through each step</div>
                </div>
              </div>
            </Card>
          </div>

          <div class="pt-6">
            <Button
              @click="startTokenCreation"
              variant="primary"
              size="lg"
              full-width
            >
              Create Your First Token
            </Button>
            <Button
              @click="goToDashboard"
              variant="ghost"
              size="lg"
              full-width
              class="mt-3"
            >
              Explore Dashboard First
            </Button>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div v-if="currentStep < 3" class="flex justify-between pt-8 mt-8 border-t border-gray-700">
          <Button
            v-if="currentStep > 0"
            @click="previousStep"
            variant="ghost"
          >
            ← Back
          </Button>
          <div v-else />
          
          <Button
            @click="nextStep"
            variant="primary"
            :disabled="!canProceed"
          >
            {{ currentStep === 2 ? 'Continue' : 'Next Step' }} →
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '../stores/onboarding'
import { useAuthStore } from '../stores/auth'
import { stripeProducts } from '../stripe-config'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import Badge from '../components/ui/Badge.vue'
import {
  ShieldCheckIcon,
  DocumentCheckIcon,
  SparklesIcon,
  CheckIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const onboardingStore = useOnboardingStore()
const authStore = useAuthStore()

const currentStep = ref(0)
const totalSteps = 4
const loading = ref(false)

interface OnboardingFormData {
  organizationName: string
  role: string
  intendedTokenType: string
  selectedNetworks: string[]
  requiresMICA: boolean
  requiresKYC: boolean
}

const formData = ref<OnboardingFormData>({
  organizationName: '',
  role: '',
  intendedTokenType: '',
  selectedNetworks: [],
  requiresMICA: false,
  requiresKYC: false
})

const tokenTypeOptions = [
  {
    value: 'fungible',
    label: 'Fungible Token',
    description: 'Standard tokens like loyalty points or utility tokens'
  },
  {
    value: 'nft',
    label: 'NFT Collection',
    description: 'Non-fungible tokens for art, collectibles, or certificates'
  },
  {
    value: 'security',
    label: 'Security Token',
    description: 'Regulated tokens representing real-world assets'
  },
  {
    value: 'utility',
    label: 'Utility Token',
    description: 'Tokens that provide access to products or services'
  }
]

const networkOptions = [
  {
    value: 'algorand_testnet',
    label: 'Algorand Testnet',
    description: 'Test your tokens on Algorand',
    requiresPlan: null
  },
  {
    value: 'algorand_mainnet',
    label: 'Algorand Mainnet',
    description: 'Production deployment on Algorand',
    requiresPlan: 'professional'
  },
  {
    value: 'voi',
    label: 'VOI Network',
    description: 'Deploy to VOI blockchain',
    requiresPlan: 'professional'
  },
  {
    value: 'ethereum_sepolia',
    label: 'Ethereum Sepolia',
    description: 'Test on Ethereum testnet',
    requiresPlan: 'professional'
  },
  {
    value: 'ethereum_mainnet',
    label: 'Ethereum Mainnet',
    description: 'Production Ethereum deployment',
    requiresPlan: 'enterprise'
  },
  {
    value: 'arbitrum',
    label: 'Arbitrum',
    description: 'Layer 2 scaling solution',
    requiresPlan: 'enterprise'
  }
]

const recommendedPlan = computed(() => {
  // Logic to determine recommended plan based on user selections
  const hasMainnetNeeds = formData.value.selectedNetworks.some(n => 
    n.includes('mainnet') && !n.includes('testnet')
  )
  const hasEnterpriseNeeds = formData.value.selectedNetworks.some(n => 
    ['ethereum_mainnet', 'arbitrum', 'base'].includes(n)
  )
  const needsAdvancedCompliance = formData.value.requiresMICA && formData.value.requiresKYC

  if (hasEnterpriseNeeds || (needsAdvancedCompliance && hasMainnetNeeds)) {
    return stripeProducts.find(p => p.tier === 'enterprise') || stripeProducts[2]
  } else if (hasMainnetNeeds || needsAdvancedCompliance) {
    return stripeProducts.find(p => p.tier === 'professional') || stripeProducts[1]
  } else {
    return stripeProducts.find(p => p.tier === 'basic') || stripeProducts[0]
  }
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return formData.value.organizationName.trim() !== '' &&
             formData.value.role !== '' &&
             formData.value.intendedTokenType !== ''
    case 1:
      return formData.value.selectedNetworks.length > 0
    case 2:
      return true
    default:
      return true
  }
})

const nextStep = () => {
  if (canProceed.value && currentStep.value < totalSteps - 1) {
    currentStep.value++
    
    // Track step completion
    if (currentStep.value === 1) {
      onboardingStore.markStepComplete('welcome')
    } else if (currentStep.value === 2) {
      onboardingStore.setPreferredChains(formData.value.selectedNetworks)
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleSelectRecommendedPlan = async () => {
  loading.value = true
  try {
    // Save onboarding data
    await saveOnboardingData()
    
    // Move to final step
    currentStep.value = 3
    onboardingStore.completeOnboarding()
  } finally {
    loading.value = false
  }
}

const saveOnboardingData = async () => {
  // In a real implementation, this would save to backend
  // For now, just save to localStorage
  localStorage.setItem('biatec_onboarding_data', JSON.stringify(formData.value))
}

const viewAllPlans = () => {
  router.push('/subscription/pricing')
}

const startTokenCreation = () => {
  router.push('/create/wizard')
}

const goToDashboard = () => {
  router.push('/dashboard')
}

onMounted(() => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Home', query: { showAuth: 'true' } })
    return
  }

  // Initialize onboarding store
  onboardingStore.initialize()
  
  // Check if onboarding is already complete
  if (onboardingStore.isOnboardingComplete) {
    router.push('/dashboard')
  }
})
</script>
