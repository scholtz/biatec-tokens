<template>
  <div class="space-y-6">
    <!-- Metadata Status Badge - Shows quick validation status -->
    <div class="flex items-center gap-3">
      <h3 class="text-lg font-semibold text-white">Metadata Quality</h3>
      <MetadataStatusBadge 
        :validation-result="validationResult"
        :loading="loading"
        :show-score="true"
      />
    </div>

    <!-- Metadata Validation Panel - Shows detailed validation results -->
    <MetadataValidationPanel 
      :validation-result="validationResult"
      :loading="loading"
    />

    <!-- Example: Normalized Metadata Display -->
    <div v-if="normalizedMetadata" class="glass-effect rounded-xl p-6">
      <h3 class="text-xl font-semibold text-white mb-4">Token Information</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left Column: Image and Description -->
        <div class="space-y-4">
          <!-- Token Image with Fallback -->
          <div class="relative w-full h-64 rounded-lg overflow-hidden bg-gradient-to-br from-biatec-accent/20 to-biatec-teal/20">
            <img 
              v-if="normalizedMetadata.imageUrl && normalizedMetadata.imageResolved"
              :src="normalizedMetadata.imageUrl" 
              :alt="normalizedMetadata.title"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <i class="pi pi-image text-6xl text-gray-400"></i>
            </div>
            
            <!-- Image Resolution Status -->
            <div 
              v-if="!normalizedMetadata.imageResolved && normalizedMetadata.imageUrl"
              class="absolute bottom-2 left-2 px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded backdrop-blur-sm"
            >
              <i class="pi pi-exclamation-triangle mr-1"></i>
              Image not resolved
            </div>
          </div>

          <!-- Description -->
          <div>
            <h4 class="text-sm font-semibold text-gray-300 mb-2">Description</h4>
            <p v-if="normalizedMetadata.description" class="text-gray-400 text-sm">
              {{ normalizedMetadata.description }}
            </p>
            <p v-else class="text-gray-500 text-sm italic">
              No description available
            </p>
          </div>

          <!-- External URL -->
          <div v-if="normalizedMetadata.externalUrl">
            <a 
              :href="normalizedMetadata.externalUrl" 
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-biatec-accent hover:text-biatec-teal transition-colors"
            >
              <i class="pi pi-external-link"></i>
              <span class="text-sm">Visit Project Website</span>
            </a>
          </div>
        </div>

        <!-- Right Column: Metadata Fields -->
        <div class="space-y-4">
          <!-- Standard Compliance -->
          <div>
            <h4 class="text-sm font-semibold text-gray-300 mb-2">Standard</h4>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm font-medium">
                {{ normalizedMetadata.standard }}
              </span>
              <a 
                :href="getStandardDocUrl(normalizedMetadata.standard)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-gray-400 hover:text-gray-300"
              >
                <i class="pi pi-info-circle"></i>
              </a>
            </div>
          </div>

          <!-- Creator -->
          <div>
            <h4 class="text-sm font-semibold text-gray-300 mb-2">Creator</h4>
            <p class="text-xs text-gray-400 font-mono break-all">
              {{ normalizedMetadata.creator || 'Unknown' }}
            </p>
          </div>

          <!-- Supply and Decimals -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-semibold text-gray-300 mb-2">Total Supply</h4>
              <p class="text-white font-medium">
                {{ formatSupply(normalizedMetadata.supply, normalizedMetadata.decimals) }}
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-300 mb-2">Decimals</h4>
              <p class="text-white font-medium">{{ normalizedMetadata.decimals }}</p>
            </div>
          </div>

          <!-- Unit Name -->
          <div v-if="normalizedMetadata.unitName">
            <h4 class="text-sm font-semibold text-gray-300 mb-2">Unit Name</h4>
            <p class="text-white font-medium">{{ normalizedMetadata.unitName }}</p>
          </div>

          <!-- Properties/Attributes -->
          <div v-if="Object.keys(normalizedMetadata.properties).length > 0">
            <h4 class="text-sm font-semibold text-gray-300 mb-2">Properties</h4>
            <div class="space-y-2">
              <div 
                v-for="(value, key) in normalizedMetadata.properties" 
                :key="key"
                class="flex justify-between items-center p-2 bg-white/5 rounded"
              >
                <span class="text-xs text-gray-400">{{ key }}</span>
                <span class="text-sm text-white">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MetadataStatusBadge from './MetadataStatusBadge.vue'
import MetadataValidationPanel from './MetadataValidationPanel.vue'
import type { MetadataValidationResult, NormalizedMetadata, MetadataStandard } from '../utils/metadataValidation'

// This is a demonstration component showing how to integrate
// metadata validation into a token detail view

const loading = ref(true)
const validationResult = ref<MetadataValidationResult | null>(null)
const normalizedMetadata = ref<NormalizedMetadata | null>(null)

// Example: Mock data for demonstration
// In real usage, you would:
// 1. Fetch asset metadata using useTokenMetadata()
// 2. Validate it using validateTokenMetadata()
// 3. Normalize it using normalizeMetadata()
// 4. Pass results to the components

onMounted(() => {
  // Simulate loading
  setTimeout(() => {
    // Example validation result
    validationResult.value = {
      isValid: true,
      standard: 'ARC3',
      score: 85,
      issues: [
        { 
          field: 'image_integrity', 
          severity: 'info', 
          message: 'Image integrity hash is recommended for verification' 
        },
        { 
          field: 'image_mimetype', 
          severity: 'info', 
          message: 'Image mimetype is recommended (e.g., image/png, image/jpeg)' 
        }
      ],
      passedChecks: [
        'Has name',
        'Has description',
        'Has valid image URL',
        'Has external URL',
        'Valid ARC3 URL format'
      ],
      summary: 'Valid ARC3 metadata with 2 recommendations'
    }

    // Example normalized metadata
    normalizedMetadata.value = {
      title: 'Example Token',
      description: 'This is a demonstration of the metadata validation and display system for Algorand tokens.',
      imageUrl: 'https://ipfs.io/ipfs/QmExample',
      imageResolved: true,
      externalUrl: 'https://example.com',
      properties: {
        category: 'Utility',
        rarity: 'Common',
        edition: '1/100'
      },
      creator: 'EXAMPLECREATORADDRESS12345678901234567890ABCDEF',
      supply: '1000000',
      decimals: 6,
      unitName: 'DEMO',
      standard: 'ARC3'
    }

    loading.value = false
  }, 1000)
})

const handleImageError = () => {
  if (normalizedMetadata.value) {
    normalizedMetadata.value.imageResolved = false
  }
}

const formatSupply = (supply: string, decimals: number): string => {
  const supplyNum = parseFloat(supply)
  if (isNaN(supplyNum)) return supply

  // Adjust for decimals
  const actualSupply = supplyNum / Math.pow(10, decimals)

  // Format large numbers
  if (actualSupply >= 1000000) {
    return `${(actualSupply / 1000000).toFixed(2)}M`
  } else if (actualSupply >= 1000) {
    return `${(actualSupply / 1000).toFixed(2)}K`
  }

  return actualSupply.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

const getStandardDocUrl = (standard: MetadataStandard): string => {
  switch (standard) {
    case 'ARC3':
      return 'https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md'
    case 'ARC69':
      return 'https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0069.md'
    case 'ARC19':
      return 'https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0019.md'
    case 'ASA':
      return 'https://developer.algorand.org/docs/get-details/asa/'
    default:
      return 'https://developer.algorand.org/'
  }
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
