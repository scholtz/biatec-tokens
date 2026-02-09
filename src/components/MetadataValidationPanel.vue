<template>
  <div class="glass-effect rounded-xl p-6">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <i class="pi pi-shield-check text-biatec-accent"></i>
      Metadata Validation
    </h3>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <i class="pi pi-spin pi-spinner text-3xl text-biatec-accent mb-3"></i>
      <p class="text-gray-400">Validating metadata...</p>
    </div>

    <!-- No Validation Result -->
    <div v-else-if="!validationResult" class="text-center py-8">
      <i class="pi pi-info-circle text-3xl text-gray-400 mb-3"></i>
      <p class="text-gray-400">No metadata validation available</p>
    </div>

    <!-- Validation Result -->
    <div v-else class="space-y-4">
      <!-- Overall Status -->
      <div class="flex items-center justify-between p-4 rounded-lg border" :class="statusBorderClass">
        <div>
          <p class="text-sm font-medium text-white mb-1">Validation Status</p>
          <p class="text-xs text-gray-400">{{ validationResult.summary }}</p>
        </div>
        <div class="text-right">
          <div :class="scoreColorClass" class="text-2xl font-bold px-3 py-1 rounded">
            {{ validationResult.score }}
          </div>
          <p class="text-xs text-gray-400 mt-1">Quality Score</p>
        </div>
      </div>

      <!-- Passed Checks -->
      <div v-if="validationResult.passedChecks.length > 0" class="space-y-2">
        <h4 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <i class="pi pi-check-circle text-green-400"></i>
          Passed Checks ({{ validationResult.passedChecks.length }})
        </h4>
        <div class="space-y-1">
          <div 
            v-for="(check, index) in validationResult.passedChecks" 
            :key="index"
            class="flex items-center gap-2 text-sm p-2 bg-green-500/10 rounded border border-green-500/20"
          >
            <i class="pi pi-check text-green-400 text-xs"></i>
            <span class="text-gray-300">{{ check }}</span>
          </div>
        </div>
      </div>

      <!-- Issues -->
      <div v-if="validationResult.issues.length > 0" class="space-y-2">
        <h4 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-yellow-400"></i>
          Issues Found ({{ validationResult.issues.length }})
        </h4>
        <div class="space-y-1">
          <div 
            v-for="(issue, index) in validationResult.issues" 
            :key="index"
            class="p-3 rounded border"
            :class="getIssueBorderClass(issue.severity)"
          >
            <div class="flex items-start gap-2">
              <i :class="getIssueIcon(issue.severity)" class="mt-0.5"></i>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium text-gray-400">{{ issue.field }}</span>
                  <span 
                    :class="getSeverityBadgeClass(issue.severity)"
                    class="px-2 py-0.5 text-xs font-semibold rounded"
                  >
                    {{ issue.severity }}
                  </span>
                </div>
                <p class="text-sm text-gray-300">{{ issue.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Issues -->
      <div v-else class="text-center py-6 bg-green-500/10 rounded-lg border border-green-500/20">
        <i class="pi pi-check-circle text-3xl text-green-400 mb-2"></i>
        <p class="text-sm text-green-300 font-medium">No validation issues found!</p>
        <p class="text-xs text-gray-400 mt-1">This token meets all {{ validationResult.standard }} metadata requirements.</p>
      </div>

      <!-- Metadata Standard Info -->
      <div class="mt-4 p-3 bg-blue-500/10 rounded border border-blue-500/20">
        <div class="flex items-start gap-2">
          <i class="pi pi-info-circle text-blue-400 mt-0.5"></i>
          <div>
            <p class="text-xs font-medium text-blue-300 mb-1">
              About {{ validationResult.standard }} Standard
            </p>
            <p class="text-xs text-gray-400">
              {{ getStandardDescription(validationResult.standard) }}
            </p>
            <a 
              :href="getStandardDocumentationUrl(validationResult.standard)" 
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-blue-400 hover:text-blue-300 underline mt-1 inline-flex items-center gap-1"
            >
              Learn more about {{ validationResult.standard }}
              <i class="pi pi-external-link text-xs"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MetadataValidationResult, MetadataStandard } from '../utils/metadataValidation'
import { getScoreColorClass } from '../utils/metadataValidation'

interface Props {
  validationResult: MetadataValidationResult | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const statusBorderClass = computed(() => {
  if (!props.validationResult) return 'border-gray-500/30'
  
  const score = props.validationResult.score
  if (score >= 90) return 'border-green-500/30 bg-green-500/5'
  if (score >= 70) return 'border-yellow-500/30 bg-yellow-500/5'
  if (score >= 50) return 'border-orange-500/30 bg-orange-500/5'
  return 'border-red-500/30 bg-red-500/5'
})

const scoreColorClass = computed(() => {
  if (!props.validationResult) return 'text-gray-400'
  return getScoreColorClass(props.validationResult.score)
})

const getIssueBorderClass = (severity: string): string => {
  switch (severity) {
    case 'error':
      return 'border-red-500/30 bg-red-500/5'
    case 'warning':
      return 'border-yellow-500/30 bg-yellow-500/5'
    case 'info':
      return 'border-blue-500/30 bg-blue-500/5'
    default:
      return 'border-gray-500/30 bg-gray-500/5'
  }
}

const getIssueIcon = (severity: string): string => {
  switch (severity) {
    case 'error':
      return 'pi pi-times-circle text-red-400'
    case 'warning':
      return 'pi pi-exclamation-triangle text-yellow-400'
    case 'info':
      return 'pi pi-info-circle text-blue-400'
    default:
      return 'pi pi-circle text-gray-400'
  }
}

const getSeverityBadgeClass = (severity: string): string => {
  switch (severity) {
    case 'error':
      return 'bg-red-500/20 text-red-300'
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-300'
    case 'info':
      return 'bg-blue-500/20 text-blue-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

const getStandardDescription = (standard: MetadataStandard): string => {
  switch (standard) {
    case 'ARC3':
      return 'ARC3 is the standard for Algorand fungible and non-fungible tokens with rich metadata stored off-chain (typically on IPFS).'
    case 'ARC69':
      return 'ARC69 is a lightweight alternative to ARC3 that stores metadata directly in the transaction note field, making it fully on-chain.'
    case 'ARC19':
      return 'ARC19 enables dynamic NFT metadata by using templated IPFS URLs that include the asset ID placeholder.'
    case 'ASA':
      return 'Standard Algorand Standard Asset with basic on-chain properties. No extended metadata standard.'
    default:
      return 'Unknown metadata standard.'
  }
}

const getStandardDocumentationUrl = (standard: MetadataStandard): string => {
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
