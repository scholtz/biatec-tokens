<template>
  <WizardStep
    title="Review & Confirm Deployment"
    description="Review your token configuration before deploying to the blockchain."
    :validation-errors="errors"
    :show-errors="showErrors"
    help-text="Please carefully review all information. Once deployed, some settings cannot be changed."
  >
    <div class="space-y-6">
      <!-- Important Notice -->
      <div class="p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-yellow-400 text-xl mt-0.5"></i>
          <div>
            <h5 class="text-sm font-semibold text-yellow-400 mb-2">Important: Review Before Deployment</h5>
            <p class="text-sm text-gray-300">
              Please verify all information below is correct. Once your token is deployed to the blockchain, 
              certain settings (like token symbol and total supply) cannot be modified.
            </p>
          </div>
        </div>
      </div>

      <!-- Configuration Summary -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-file-check text-biatec-accent"></i>
          Configuration Summary
        </h4>

        <div class="space-y-4">
          <!-- Project Information -->
          <div class="pb-4 border-b border-gray-700">
            <h5 class="text-sm font-semibold text-gray-400 mb-3">Project Information</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-xs text-gray-500">Project Name</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ (projectSetup as any).projectName || 'Not specified' }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-500">Organization</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ (projectSetup as any).organizationName || 'Not specified' }}</p>
              </div>
              <div class="md:col-span-2">
                <span class="text-xs text-gray-500">Purpose</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ formatPurpose((projectSetup as any).tokenPurpose) }}</p>
              </div>
            </div>
          </div>

          <!-- Token Details -->
          <div class="pb-4 border-b border-gray-700">
            <h5 class="text-sm font-semibold text-gray-400 mb-3">Token Details</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-xs text-gray-500">Token Name</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ (tokenDetails as any).name || 'Not specified' }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-500">Token Symbol</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1 font-mono">{{ (tokenDetails as any).symbol || 'Not specified' }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-500">Network</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ formatNetwork((tokenDetails as any).selectedNetwork) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-500">Token Standard</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ formatStandard((tokenDetails as any).selectedStandard) }}</p>
              </div>
              <div v-if="(tokenDetails as any).totalSupply" class="md:col-span-2">
                <span class="text-xs text-gray-500">Total Supply</span>
                <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ formatNumber((tokenDetails as any).totalSupply) }} tokens</p>
              </div>
            </div>
          </div>

          <!-- Compliance Status -->
          <div class="pb-4 border-b border-gray-700">
            <h5 class="text-sm font-semibold text-gray-400 mb-3">Compliance Status</h5>
            <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div class="flex items-center gap-3">
                <div :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  complianceScore >= 80 ? 'bg-green-500/20' :
                  complianceScore >= 50 ? 'bg-yellow-500/20' :
                  'bg-red-500/20'
                ]">
                  <i :class="[
                    'pi pi-shield text-xl',
                    complianceScore >= 80 ? 'text-green-400' :
                    complianceScore >= 50 ? 'text-yellow-400' :
                    'text-red-400'
                  ]"></i>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">MICA Readiness</p>
                  <p class="text-xs text-gray-500">Compliance score based on completed requirements</p>
                </div>
              </div>
              <div :class="[
                'px-4 py-2 rounded-full text-sm font-semibold',
                complianceScore >= 80 ? 'bg-green-500/20 text-green-400' :
                complianceScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              ]">
                {{ complianceScore }}%
              </div>
            </div>
          </div>

          <!-- Subscription Plan -->
          <div>
            <h5 class="text-sm font-semibold text-gray-400 mb-3">Subscription Plan</h5>
            <div class="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div class="flex items-center gap-3">
                <i class="pi pi-credit-card text-biatec-accent text-xl"></i>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedPlan || 'Not selected' }}</p>
                  <p class="text-xs text-gray-500">Your current subscription plan</p>
                </div>
              </div>
              <span v-if="subscriptionStore.isActive" class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Plan Limitations & Restrictions -->
      <div v-if="planLimitations.length > 0" class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-info-circle text-biatec-accent"></i>
          Plan Limitations
        </h4>
        <div class="space-y-2">
          <div v-for="(limitation, index) in planLimitations" :key="index" class="flex items-start gap-2 text-sm">
            <i class="pi pi-circle-fill text-gray-500 text-xs mt-1.5"></i>
            <p class="text-gray-300">{{ limitation }}</p>
          </div>
        </div>
      </div>

      <!-- Estimated Costs (if applicable) -->
      <div v-if="showCosts" class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-dollar text-biatec-accent"></i>
          Estimated Costs
        </h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Token Creation</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Included in plan</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Deployment (Backend Managed)</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">No additional fees</span>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-gray-700">
            <span class="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
            <span class="text-lg font-bold text-biatec-accent">$0.00</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-3">
          All blockchain transaction fees are covered by your subscription. No hidden costs.
        </p>
      </div>

      <!-- Network Confirmation -->
      <div class="p-5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <i class="pi pi-globe text-blue-400 text-xl mt-0.5"></i>
          <div>
            <h5 class="text-sm font-semibold text-blue-400 mb-2">Deployment Network</h5>
            <p class="text-sm text-gray-300 mb-3">
              Your token will be deployed to: <strong class="text-blue-400">{{ formatNetwork((tokenDetails as any).selectedNetwork) }}</strong>
            </p>
            <p class="text-xs text-gray-400">
              {{ isMainnet ? 'This is a mainnet deployment. Your token will be live and publicly accessible.' : 'This is a testnet deployment for testing purposes.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Confirmation Checkbox -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <input
              id="confirm-information"
              v-model="confirmations.informationCorrect"
              type="checkbox"
              class="mt-1 w-5 h-5 rounded border-gray-700 bg-gray-800 text-biatec-accent focus:ring-biatec-accent focus:ring-offset-0"
            />
            <label for="confirm-information" class="flex-1 text-sm text-gray-300 cursor-pointer">
              I confirm that all information provided is accurate and complete to the best of my knowledge.
            </label>
          </div>

          <div class="flex items-start gap-3">
            <input
              id="confirm-compliance"
              v-model="confirmations.understandCompliance"
              type="checkbox"
              class="mt-1 w-5 h-5 rounded border-gray-700 bg-gray-800 text-biatec-accent focus:ring-biatec-accent focus:ring-offset-0"
            />
            <label for="confirm-compliance" class="flex-1 text-sm text-gray-300 cursor-pointer">
              I understand my compliance responsibilities and that I am responsible for ensuring this token complies with applicable laws and regulations.
            </label>
          </div>

          <div class="flex items-start gap-3">
            <input
              id="confirm-deployment"
              v-model="confirmations.readyToDeploy"
              type="checkbox"
              class="mt-1 w-5 h-5 rounded border-gray-700 bg-gray-800 text-biatec-accent focus:ring-biatec-accent focus:ring-offset-0"
            />
            <label for="confirm-deployment" class="flex-1 text-sm text-gray-300 cursor-pointer">
              I am ready to deploy this token and understand that certain settings cannot be changed after deployment.
            </label>
          </div>
        </div>
      </div>
    </div>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTokenDraftStore } from '../../../stores/tokenDraft'
import { useSubscriptionStore } from '../../../stores/subscription'
import { useComplianceStore } from '../../../stores/compliance'
import WizardStep from '../WizardStep.vue'

const tokenDraftStore = useTokenDraftStore()
const subscriptionStore = useSubscriptionStore()
const complianceStore = useComplianceStore()

const showErrors = ref(false)
const errors = ref<string[]>([])

// Confirmations
const confirmations = ref({
  informationCorrect: false,
  understandCompliance: false,
  readyToDeploy: false,
})

// Extract data from draft store
const projectSetup = computed(() => tokenDraftStore.currentDraft?.projectSetup || {})
const tokenDetails = computed(() => tokenDraftStore.currentDraft || {})
const selectedPlan = computed(() => subscriptionStore.currentProduct?.name || 'Basic')
const complianceScore = computed(() => complianceStore.metrics.completionPercentage || 0)

// Network and standard formatting
const formatNetwork = (network: string | undefined): string => {
  const networkMap: Record<string, string> = {
    'algorand-mainnet': 'Algorand Mainnet',
    'algorand-testnet': 'Algorand Testnet',
    'voi-testnet': 'VOI Testnet',
    'aramid-testnet': 'Aramid Testnet',
    'ethereum-mainnet': 'Ethereum Mainnet',
    'ethereum-sepolia': 'Ethereum Sepolia Testnet',
    'arbitrum-mainnet': 'Arbitrum One',
    'base-mainnet': 'Base',
  }
  return networkMap[network || ''] || network || 'Not selected'
}

const formatStandard = (standard: string | undefined): string => {
  const standardMap: Record<string, string> = {
    'asa': 'ASA (Algorand Standard Asset)',
    'arc3': 'ARC3 (NFT with Metadata)',
    'arc19': 'ARC19 (Tradable NFT)',
    'arc69': 'ARC69 (Mutable NFT)',
    'arc200': 'ARC200 (Smart Contract Token)',
    'arc72': 'ARC72 (Advanced NFT)',
    'erc20': 'ERC20 (Fungible Token)',
    'erc721': 'ERC721 (NFT)',
  }
  return standardMap[standard || ''] || standard || 'Not selected'
}

const formatPurpose = (purpose: string | undefined): string => {
  const purposeMap: Record<string, string> = {
    'utility': 'Utility Token - Access to services or features',
    'asset': 'Asset Token - Represents real-world assets',
    'security': 'Security Token - Investment instrument',
    'governance': 'Governance Token - Voting rights',
    'reward': 'Reward/Loyalty Token - Customer incentives',
    'other': 'Other',
  }
  return purposeMap[purpose || ''] || 'Not specified'
}

const formatNumber = (num: number | string | undefined): string => {
  if (!num) return '0'
  return Number(num).toLocaleString()
}

// Check if mainnet
const isMainnet = computed(() => {
  const network = (tokenDetails.value as any).selectedNetwork
  return network?.includes('mainnet') || false
})

// Plan limitations
const planLimitations = computed(() => {
  const limitations: string[] = []
  const plan = selectedPlan.value.toLowerCase()
  
  if (plan === 'basic') {
    limitations.push('Up to 5 token deployments per month')
    limitations.push('Standard token templates only')
    limitations.push('Email support (48-hour response time)')
  } else if (plan === 'professional') {
    limitations.push('Up to 25 token deployments per month')
    limitations.push('Priority email support (24-hour response time)')
  }
  
  if (!subscriptionStore.isActive) {
    limitations.push('Subscription activation required before deployment')
  }
  
  return limitations
})

// Show costs section (could be expanded based on plan)
const showCosts = computed(() => true)

// Validation
const isValid = computed(() => {
  return confirmations.value.informationCorrect &&
         confirmations.value.understandCompliance &&
         confirmations.value.readyToDeploy
})

const validateAll = (): boolean => {
  if (!isValid.value) {
    errors.value = ['Please confirm all checkboxes to proceed with deployment']
    showErrors.value = true
    return false
  }
  
  errors.value = []
  showErrors.value = false
  return true
}

defineExpose({
  isValid,
  validateAll,
})
</script>
