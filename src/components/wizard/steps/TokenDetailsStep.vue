<template>
  <WizardStep
    title="Configure Your Token"
    description="Choose the network, token standard, and provide basic information for your token."
    :validation-errors="errors"
    :show-errors="showErrors"
    help-text="Don't worry about the technical details - we'll explain everything in plain language."
  >
    <div class="space-y-8">
      <!-- Network Selection -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-globe text-biatec-accent"></i>
          Choose Your Network
        </h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Think of this as choosing where your token will live. Each network has different strengths.
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="network in networks"
            :key="network.name"
            :class="[
              'relative p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105',
              formData.selectedNetwork === network.name
                ? 'border-biatec-accent bg-biatec-accent/5'
                : 'border-gray-700 bg-gray-800/50'
            ]"
            @click="selectNetwork(network.name)"
          >
            <div v-if="formData.selectedNetwork === network.name" class="absolute top-3 right-3">
              <i class="pi pi-check-circle text-biatec-accent text-xl"></i>
            </div>
            
            <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {{ network.displayName }}
            </h5>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {{ network.description }}
            </p>
            
            <div class="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <i class="pi pi-dollar text-green-400"></i>
                <span>Creation: {{ network.fees.creation }}</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="pi pi-check text-blue-400 mt-0.5"></i>
                <span>Best for: {{ network.bestFor.slice(0, 2).join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Token Standard Selection -->
      <div v-if="formData.selectedNetwork" class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-box text-biatec-accent"></i>
          Choose Token Type
        </h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This determines what your token can do. Most users start with a standard utility token.
        </p>
        
        <div class="space-y-3">
          <div
            v-for="standard in availableStandards"
            :key="standard.value"
            :class="[
              'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
              formData.selectedStandard === standard.value
                ? 'border-biatec-accent bg-biatec-accent/5'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            ]"
            @click="selectStandard(standard.value)"
          >
            <div class="flex items-start gap-3">
              <div v-if="formData.selectedStandard === standard.value" class="flex-shrink-0 mt-1">
                <i class="pi pi-check-circle text-biatec-accent text-xl"></i>
              </div>
              <div v-else class="flex-shrink-0 mt-1">
                <i class="pi pi-circle text-gray-600 text-xl"></i>
              </div>
              
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h5 class="text-md font-bold text-gray-900 dark:text-white">
                    {{ standard.name }}
                  </h5>
                  <span :class="[
                    'px-2 py-0.5 rounded text-xs font-medium',
                    standard.type === 'Fungible' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  ]">
                    {{ standard.type }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ standard.description }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500">
                  <strong>Best for:</strong> {{ standard.useWhen[0] }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Glossary Tooltip -->
        <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <details class="cursor-pointer">
            <summary class="text-sm font-medium text-blue-400 select-none">
              What do these terms mean?
            </summary>
            <div class="mt-2 space-y-2 text-xs text-gray-400">
              <p><strong>Fungible:</strong> Each token is identical and interchangeable (like regular currency).</p>
              <p><strong>NFT:</strong> Non-Fungible Token - each token is unique and represents a specific item.</p>
              <p><strong>Metadata:</strong> Additional information like images, descriptions, and properties.</p>
              <p><strong>Smart Contract:</strong> Programmable rules that control how your token works.</p>
            </div>
          </details>
        </div>
      </div>

      <!-- Token Details Form -->
      <div v-if="formData.selectedStandard" class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-info-circle text-biatec-accent"></i>
          Token Information
        </h4>
        
        <div class="space-y-5">
          <!-- Token Name -->
          <Input
            id="token-name"
            v-model="formData.name"
            label="Token Name"
            placeholder="e.g., My Awesome Token"
            required
            :error="fieldErrors.name"
            hint="The full name of your token (e.g., Bitcoin, Ethereum)"
          />

          <!-- Token Symbol -->
          <Input
            id="token-symbol"
            v-model="formData.symbol"
            label="Token Symbol"
            placeholder="e.g., MAT"
            required
            :error="fieldErrors.symbol"
            hint="A short abbreviation for your token (3-5 characters recommended)"
          />

          <!-- Token Description -->
          <div class="space-y-2">
            <label for="token-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
              <span class="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="token-description"
              v-model="formData.description"
              rows="3"
              placeholder="Explain what your token is for and how it will be used..."
              :class="[
                'w-full px-4 py-2 rounded-lg border bg-gray-800 text-white placeholder-gray-500',
                fieldErrors.description ? 'border-red-500' : 'border-gray-700 focus:border-biatec-accent'
              ]"
            />
            <p v-if="fieldErrors.description" class="text-sm text-red-600 dark:text-red-400">
              {{ fieldErrors.description }}
            </p>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">
              Explain what your token does in plain language
            </p>
          </div>

          <!-- Token Supply -->
          <Input
            id="token-supply"
            v-model="formData.supply"
            type="number"
            label="Total Supply"
            placeholder="e.g., 1000000"
            required
            :error="fieldErrors.supply"
            hint="How many tokens will exist in total"
          />

          <!-- Decimals (for fungible tokens) -->
          <div v-if="isNFT === false">
            <Input
              id="token-decimals"
              v-model.number="formData.decimals"
              type="number"
              label="Decimals"
              placeholder="e.g., 6"
              required
              :error="fieldErrors.decimals"
              hint="How divisible your token is (6 = divisible by 1,000,000). Use 0 for whole numbers only."
            />
            <div class="mt-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p class="text-xs text-gray-400">
                <strong>Example:</strong> With {{ formData.decimals || 0 }} decimals, 
                the smallest unit is {{ (1 / Math.pow(10, formData.decimals || 0)).toFixed(formData.decimals || 0) }} tokens.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Preview -->
      <div v-if="isFormComplete" class="glass-effect rounded-xl p-6 border border-biatec-accent/30 bg-gradient-to-br from-biatec-accent/5 to-transparent">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-check-circle text-green-400"></i>
          Summary
        </h4>
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Network:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.selectedNetwork }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Standard:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.selectedStandard }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Name:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.name }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Symbol:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.symbol }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Supply:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ parseFloat(formData.supply).toLocaleString() }}</p>
          </div>
          <div v-if="isNFT === false">
            <span class="text-gray-500 dark:text-gray-400">Decimals:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ formData.decimals }}</p>
          </div>
        </div>
      </div>
    </div>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTokenDraftStore } from '../../../stores/tokenDraft'
import { useTokenStore } from '../../../stores/tokens'
import WizardStep from '../WizardStep.vue'
import Input from '../../ui/Input.vue'
import type { NetworkId } from '../../../composables/useWalletManager'

const tokenDraftStore = useTokenDraftStore()
const tokensStore = useTokenStore()

const showErrors = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string>>({})

interface FormData {
  name: string
  symbol: string
  description: string
  supply: string
  decimals: number
  selectedNetwork: string | null
  selectedStandard: string
}

const formData = ref<FormData>({
  name: '',
  symbol: '',
  description: '',
  supply: '',
  decimals: 6,
  selectedNetwork: null,
  selectedStandard: '',
})

const networks = computed(() => tokensStore.networkGuidance)

const availableStandards = computed(() => {
  if (!formData.value.selectedNetwork) return []
  
  const isEVM = formData.value.selectedNetwork === 'Ethereum' || 
                formData.value.selectedNetwork === 'Arbitrum' || 
                formData.value.selectedNetwork === 'Base'
  
  if (isEVM) {
    return [
      {
        value: 'ERC20',
        name: 'ERC-20 (Standard Token)',
        type: 'Fungible',
        description: 'The most common token standard on Ethereum networks. Perfect for currencies, points, and rewards.',
        useWhen: ['You want a standard cryptocurrency or utility token that works with all Ethereum wallets']
      },
      {
        value: 'ERC721',
        name: 'ERC-721 (NFT)',
        type: 'NFT',
        description: 'Non-fungible tokens for unique digital items like art, collectibles, or certificates.',
        useWhen: ['You want to create unique digital items that are one-of-a-kind or limited edition']
      }
    ]
  }
  
  // AVM networks (Algorand, VOI, Aramid)
  return [
    {
      value: 'ASA',
      name: 'ASA (Simple Token)',
      type: 'Fungible',
      description: 'Basic token without extra features. Fast, cheap, and simple.',
      useWhen: ['You need a basic token without images or detailed information']
    },
    {
      value: 'ARC3FT',
      name: 'ARC-3 (Token with Info)',
      type: 'Fungible',
      description: 'Token with logo, description, and detailed information. Best for consumer-facing tokens.',
      useWhen: ['You want your token to have a logo and show up nicely in wallets']
    },
    {
      value: 'ARC200',
      name: 'ARC-200 (Smart Token)',
      type: 'Fungible',
      description: 'Advanced token with programmable features and custom logic.',
      useWhen: ['You need advanced features like custom rules or programmable behavior']
    },
    {
      value: 'ARC3NFT',
      name: 'ARC-3 NFT (Collectible)',
      type: 'NFT',
      description: 'Non-fungible token for unique digital items with metadata.',
      useWhen: ['You want to create unique digital collectibles or art']
    },
    {
      value: 'ARC72',
      name: 'ARC-72 NFT (Advanced)',
      type: 'NFT',
      description: 'Advanced NFT standard with smart contract features.',
      useWhen: ['You need programmable NFTs with custom behavior']
    }
  ]
})

const isNFT = computed(() => {
  const standard = formData.value.selectedStandard
  return standard.includes('NFT') || standard === 'ERC721' || standard === 'ARC72' || standard.includes('ARC19') || standard.includes('ARC69')
})

const isFormComplete = computed(() => {
  return (
    formData.value.selectedNetwork !== null &&
    formData.value.selectedStandard !== '' &&
    formData.value.name !== '' &&
    formData.value.symbol !== '' &&
    formData.value.description !== '' &&
    formData.value.supply !== '' &&
    parseFloat(formData.value.supply) > 0 &&
    (isNFT.value || formData.value.decimals >= 0)
  )
})

const selectNetwork = (network: string) => {
  formData.value.selectedNetwork = network
  formData.value.selectedStandard = '' // Reset standard when network changes
  fieldErrors.value.selectedNetwork = ''
  validateField('selectedNetwork')
}

const selectStandard = (standard: string) => {
  formData.value.selectedStandard = standard
  fieldErrors.value.selectedStandard = ''
  
  // Set default decimals based on standard
  if (isNFT.value) {
    formData.value.decimals = 0
  } else if (formData.value.decimals === 0) {
    formData.value.decimals = 6
  }
  
  validateField('selectedStandard')
}

const validateField = (field: keyof FormData) => {
  switch (field) {
    case 'selectedNetwork':
      if (!formData.value.selectedNetwork) {
        fieldErrors.value.selectedNetwork = 'Please select a network'
      } else {
        delete fieldErrors.value.selectedNetwork
      }
      break
    case 'selectedStandard':
      if (!formData.value.selectedStandard) {
        fieldErrors.value.selectedStandard = 'Please select a token standard'
      } else {
        delete fieldErrors.value.selectedStandard
      }
      break
    case 'name':
      if (!formData.value.name || formData.value.name.trim() === '') {
        fieldErrors.value.name = 'Token name is required'
      } else if (formData.value.name.length > 50) {
        fieldErrors.value.name = 'Token name must be 50 characters or less'
      } else {
        delete fieldErrors.value.name
      }
      break
    case 'symbol':
      if (!formData.value.symbol || formData.value.symbol.trim() === '') {
        fieldErrors.value.symbol = 'Token symbol is required'
      } else if (formData.value.symbol.length > 10) {
        fieldErrors.value.symbol = 'Token symbol must be 10 characters or less'
      } else {
        delete fieldErrors.value.symbol
      }
      break
    case 'description':
      if (!formData.value.description || formData.value.description.trim() === '') {
        fieldErrors.value.description = 'Token description is required'
      } else if (formData.value.description.length < 10) {
        fieldErrors.value.description = 'Description must be at least 10 characters'
      } else {
        delete fieldErrors.value.description
      }
      break
    case 'supply':
      if (formData.value.supply === '' || parseFloat(formData.value.supply) <= 0) {
        fieldErrors.value.supply = 'Supply must be greater than 0'
      } else {
        delete fieldErrors.value.supply
      }
      break
    case 'decimals':
      if (formData.value.decimals < 0 || formData.value.decimals > 18) {
        fieldErrors.value.decimals = 'Decimals must be between 0 and 18'
      } else {
        delete fieldErrors.value.decimals
      }
      break
  }
  updateValidationErrors()
}

const validateAll = () => {
  fieldErrors.value = {}
  
  if (!formData.value.selectedNetwork) {
    fieldErrors.value.selectedNetwork = 'Please select a network'
  }
  if (!formData.value.selectedStandard) {
    fieldErrors.value.selectedStandard = 'Please select a token standard'
  }
  
  validateField('name')
  validateField('symbol')
  validateField('description')
  validateField('supply')
  if (!isNFT.value) {
    validateField('decimals')
  }
  
  updateValidationErrors()
  return Object.keys(fieldErrors.value).length === 0
}

const updateValidationErrors = () => {
  errors.value = Object.values(fieldErrors.value)
  showErrors.value = errors.value.length > 0
}

const isValid = computed(() => {
  return isFormComplete.value && Object.keys(fieldErrors.value).length === 0
})

// Watch form changes and save to draft store
watch(
  formData,
  (newData) => {
    // Map display network name to NetworkId
    let networkId: NetworkId | undefined
    if (newData.selectedNetwork === 'VOI') {
      networkId = 'voi-mainnet'
    } else if (newData.selectedNetwork === 'Aramid') {
      networkId = 'aramidmain'
    }
    
    tokenDraftStore.updateDraft({
      name: newData.name,
      symbol: newData.symbol,
      description: newData.description,
      supply: newData.supply ? parseFloat(newData.supply) : null,
      decimals: newData.decimals,
      selectedNetwork: networkId,
      selectedStandard: newData.selectedStandard,
    })
  },
  { deep: true }
)

// Load draft on mount
onMounted(() => {
  const draft = tokenDraftStore.currentDraft
  if (draft) {
    // Map NetworkId to display name
    let displayNetwork: string | null = null
    if (draft.selectedNetwork === 'voi-mainnet') {
      displayNetwork = 'VOI'
    } else if (draft.selectedNetwork === 'aramidmain') {
      displayNetwork = 'Aramid'
    }
    
    formData.value = {
      name: draft.name || '',
      symbol: draft.symbol || '',
      description: draft.description || '',
      supply: draft.supply?.toString() || '',
      decimals: draft.decimals || 6,
      selectedNetwork: displayNetwork,
      selectedStandard: draft.selectedStandard || '',
    }
  } else {
    tokenDraftStore.initializeDraft()
  }
})

defineExpose({
  isValid,
  validateAll,
})
</script>
