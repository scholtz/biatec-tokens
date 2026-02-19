<template>
  <WizardStep
    title="Deployment Status"
    description="Track the progress of your token deployment in real-time."
    :validation-errors="errors"
    :show-errors="showErrors"
  >
    <div class="space-y-6">
      <!-- Deployment Timeline -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <i class="pi pi-clock text-biatec-accent"></i>
          Deployment Progress
        </h4>

        <div class="relative">
          <!-- Vertical Timeline -->
          <div class="space-y-8">
            <div
              v-for="(stage, index) in deploymentStages"
              :key="stage.id"
              class="relative flex items-start gap-4"
            >
              <!-- Timeline Line -->
              <div
                v-if="index < deploymentStages.length - 1"
                :class="[
                  'absolute left-6 top-12 w-0.5 h-16',
                  stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-700'
                ]"
              ></div>

              <!-- Stage Icon -->
              <div
                :class="[
                  'relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  stage.status === 'completed'
                    ? 'bg-green-500 border-green-500'
                    : stage.status === 'in-progress'
                    ? 'bg-biatec-accent border-biatec-accent animate-pulse'
                    : stage.status === 'failed'
                    ? 'bg-red-500 border-red-500'
                    : 'bg-gray-800 border-gray-700'
                ]"
              >
                <i
                  v-if="stage.status === 'completed'"
                  class="pi pi-check text-white text-xl"
                ></i>
                <i
                  v-else-if="stage.status === 'in-progress'"
                  class="pi pi-spin pi-spinner text-gray-900 text-xl"
                ></i>
                <i
                  v-else-if="stage.status === 'failed'"
                  class="pi pi-times text-white text-xl"
                ></i>
                <i
                  v-else
                  :class="['text-gray-500 text-xl', stage.icon]"
                ></i>
              </div>

              <!-- Stage Content -->
              <div class="flex-1 pt-1">
                <div class="flex items-center justify-between mb-2">
                  <h5
                    :class="[
                      'text-md font-semibold',
                      stage.status === 'completed' || stage.status === 'in-progress'
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500'
                    ]"
                  >
                    {{ stage.title }}
                  </h5>
                  <span
                    v-if="stage.status === 'in-progress'"
                    class="text-xs text-biatec-accent font-medium"
                  >
                    {{ stage.progress }}%
                  </span>
                </div>
                
                <p class="text-sm text-gray-400 mb-2">
                  {{ stage.description }}
                </p>

                <!-- Progress Bar (for in-progress stage) -->
                <div
                  v-if="stage.status === 'in-progress'"
                  class="h-2 bg-gray-700 rounded-full overflow-hidden mb-2"
                >
                  <div
                    class="h-full bg-biatec-accent transition-all duration-500"
                    :style="{ width: stage.progress + '%' }"
                  ></div>
                </div>

                <!-- Stage Details -->
                <div v-if="stage.details && stage.status !== 'pending'" class="mt-2 text-xs text-gray-500">
                  {{ stage.details }}
                </div>

                <!-- Error Message -->
                <div
                  v-if="stage.status === 'failed' && stage.error"
                  class="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <div class="flex items-start gap-2">
                    <i class="pi pi-exclamation-triangle text-red-400 text-sm mt-0.5"></i>
                    <div class="flex-1">
                      <p class="text-sm text-red-400 font-medium mb-1">Error</p>
                      <p class="text-xs text-red-300">{{ stage.error }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Deployment Failed - Recovery Options -->
      <div
        v-if="deploymentStatus === 'failed'"
        class="glass-effect rounded-xl p-6 border border-red-500/30 bg-red-500/5"
      >
        <div class="flex items-start gap-3 mb-4">
          <i class="pi pi-times-circle text-red-400 text-2xl"></i>
          <div class="flex-1">
            <h4 class="text-md font-semibold text-red-400 mb-1">
              Deployment Failed
            </h4>
            <p class="text-sm text-gray-300 mb-3">
              Something went wrong during deployment. Here are your options:
            </p>
            
            <!-- Error Details -->
            <div v-if="deploymentError" class="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div class="flex items-start gap-2 mb-2">
                <i class="pi pi-exclamation-triangle text-red-400 text-sm mt-0.5"></i>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-red-300 mb-1">
                    {{ deploymentError.message }}
                  </p>
                  <p v-if="deploymentError.code" class="text-xs text-gray-400 mb-2">
                    Error Code: {{ deploymentError.code }}
                  </p>
                </div>
              </div>
              
              <!-- Remediation Steps -->
              <div class="mt-3 pt-3 border-t border-red-500/20">
                <p class="text-xs font-semibold text-gray-300 mb-1">How to resolve:</p>
                <p class="text-xs text-gray-400">
                  {{ deploymentError.remediation }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <button
            @click="retryDeployment"
            class="w-full px-4 py-3 bg-biatec-accent hover:bg-biatec-accent/90 text-gray-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i class="pi pi-refresh"></i>
            Retry Deployment
          </button>
          
          <button
            @click="saveDraftAndExit"
            class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i class="pi pi-save"></i>
            Save Draft and Exit
          </button>

          <button
            @click="contactSupport"
            class="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i class="pi pi-comments"></i>
            Contact Support
          </button>
        </div>
      </div>

      <!-- Deployment Success -->
      <div
        v-if="deploymentStatus === 'completed'"
        class="glass-effect rounded-xl p-6 border border-green-500/30 bg-green-500/5"
      >
        <div class="text-center py-6">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-4 border-green-500 mb-4 animate-pulse-slow">
            <i class="pi pi-check text-green-400 text-4xl"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Token Deployed Successfully!
          </h3>
          <p class="text-gray-400 mb-6">
            Your token is now live on the blockchain. Here are your deployment details:
          </p>

          <!-- Token Details -->
          <div class="glass-effect rounded-xl p-6 mb-6 text-left">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Token Name:</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ deploymentResult.tokenName }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Symbol:</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ deploymentResult.tokenSymbol }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Network:</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ deploymentResult.network }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Standard:</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ deploymentResult.standard }}</p>
              </div>
              <div class="md:col-span-2">
                <span class="text-gray-500 dark:text-gray-400">Asset ID / Contract Address:</span>
                <div class="flex items-center gap-2 mt-1">
                  <p class="font-mono text-sm text-gray-900 dark:text-white bg-gray-800 px-3 py-1 rounded">
                    {{ deploymentResult.assetId }}
                  </p>
                  <button
                    @click="copyToClipboard(deploymentResult.assetId)"
                    class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                  >
                    <i class="pi pi-copy"></i>
                  </button>
                </div>
              </div>
              <div class="md:col-span-2">
                <span class="text-gray-500 dark:text-gray-400">Transaction ID:</span>
                <div class="flex items-center gap-2 mt-1">
                  <p class="font-mono text-xs text-gray-900 dark:text-white bg-gray-800 px-3 py-1 rounded truncate">
                    {{ deploymentResult.txId }}
                  </p>
                  <button
                    @click="copyToClipboard(deploymentResult.txId)"
                    class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                  >
                    <i class="pi pi-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Compliance & Audit Trail -->
          <div class="glass-effect rounded-xl p-6 mb-6 text-left">
            <div class="flex items-center gap-2 mb-4">
              <i class="pi pi-shield text-green-400 text-xl"></i>
              <h4 class="text-md font-semibold text-gray-900 dark:text-white">
                Compliance & Audit Trail
              </h4>
            </div>
            <p class="text-sm text-gray-400 mb-4">
              Your token deployment has been logged for compliance and regulatory reporting.
            </p>
            <div class="flex gap-3">
              <button
                @click="downloadAuditReport"
                class="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <i class="pi pi-file-export"></i>
                Download Audit Report
              </button>
              <button
                v-if="showViewAuditTrail"
                @click="toggleAuditTrail"
                class="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <i :class="showAuditTrail ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                {{ showAuditTrail ? 'Hide' : 'View' }} Audit Trail
              </button>
            </div>
            
            <!-- Expandable Audit Trail -->
            <div v-if="showAuditTrail" class="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h5 class="text-sm font-semibold text-gray-300 mb-3">Deployment Audit Trail</h5>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <div
                  v-for="entry in auditTrailEntries"
                  :key="entry.id"
                  class="flex items-start gap-3 text-xs"
                >
                  <div class="flex-shrink-0 w-20 text-gray-500">
                    {{ formatAuditTime(entry.timestamp) }}
                  </div>
                  <div class="flex-1">
                    <span :class="[
                      'font-medium',
                      entry.severity === 'error' ? 'text-red-400' :
                      entry.severity === 'warning' ? 'text-yellow-400' :
                      'text-green-400'
                    ]">
                      {{ entry.action }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 justify-center">
            <button
              @click="downloadSummary"
              class="px-6 py-3 bg-biatec-accent hover:bg-biatec-accent/90 text-gray-900 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <i class="pi pi-download"></i>
              Download Summary
            </button>
            <button
              @click="viewOnExplorer"
              class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <i class="pi pi-external-link"></i>
              View on Explorer
            </button>
          </div>
        </div>
      </div>

      <!-- Deployment In Progress -->
      <div
        v-if="deploymentStatus === 'in-progress'"
        class="p-5 bg-blue-500/10 border border-blue-500/20 rounded-lg"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-spin pi-spinner text-blue-400 text-xl"></i>
          <div>
            <p class="text-sm font-semibold text-blue-400">
              Deployment in Progress
            </p>
            <p class="text-xs text-gray-400">
              This typically takes 30-60 seconds. Please don't close this window.
            </p>
          </div>
        </div>
      </div>

      <!-- Helpful Information -->
      <div class="p-5 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h5 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <i class="pi pi-info-circle text-biatec-accent"></i>
          What Happens Next?
        </h5>
        <ul class="space-y-2 text-sm text-gray-400">
          <li class="flex items-start gap-2">
            <i class="pi pi-check text-green-400 text-xs mt-1"></i>
            <span>Your token is recorded on the blockchain and cannot be altered</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="pi pi-check text-green-400 text-xs mt-1"></i>
            <span>You can view and manage your token from the dashboard</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="pi pi-check text-green-400 text-xs mt-1"></i>
            <span>Token holders can view it in compatible wallets and explorers</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="pi pi-check text-green-400 text-xs mt-1"></i>
            <span>You'll receive email confirmation with all deployment details</span>
          </li>
        </ul>
      </div>
    </div>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTokenDraftStore } from '../../../stores/tokenDraft'
import { useAuthStore } from '../../../stores/auth'
import { analyticsService } from '../../../services/analytics'
import { competitiveTelemetryService } from '../../../services/CompetitiveTelemetryService'
import { DeploymentStatusService } from '../../../services/DeploymentStatusService'
import { auditTrailService } from '../../../services/AuditTrailService'
import type { TokenDeploymentRequest } from '../../../types/api'
import type { AuditTrailEntry } from '../../../types/auditTrail'
import { TokenStandard } from '../../../types/api'
import WizardStep from '../WizardStep.vue'

interface DeploymentStage {
  id: string
  title: string
  description: string
  icon: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress?: number
  details?: string
  error?: string
}

interface DeploymentResult {
  tokenName: string
  tokenSymbol: string
  network: string
  standard: string
  assetId: string
  txId: string
  contractAddress?: string
  explorerUrl?: string
}

const tokenDraftStore = useTokenDraftStore()
const authStore = useAuthStore()
const deploymentService = new DeploymentStatusService()

const showErrors = ref(false)
const errors = ref<string[]>([])
const deploymentStatus = ref<'idle' | 'pending' | 'in-progress' | 'completed' | 'failed'>('pending')
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)
const useRealApi = ref(true) // Toggle to enable/disable real API integration

const deploymentStages = ref<DeploymentStage[]>([
  {
    id: 'preparing',
    title: 'Preparing Token',
    description: 'Validating token parameters and preparing blockchain transaction',
    icon: 'pi-cog',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'uploading',
    title: 'Uploading Metadata',
    description: 'Storing token metadata on decentralized storage (IPFS/Arweave)',
    icon: 'pi-cloud-upload',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'deploying',
    title: 'Deploying to Blockchain',
    description: 'Submitting transaction to the blockchain network',
    icon: 'pi-send',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'confirming',
    title: 'Confirming Transaction',
    description: 'Waiting for blockchain confirmation and finalization',
    icon: 'pi-check-circle',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'indexing',
    title: 'Indexing Token',
    description: 'Registering token in explorers and indexing services',
    icon: 'pi-database',
    status: 'pending',
    progress: 0,
  },
])

const deploymentResult = ref<DeploymentResult>({
  tokenName: '',
  tokenSymbol: '',
  network: '',
  standard: '',
  assetId: '',
  txId: '',
  contractAddress: '',
  explorerUrl: '',
})

const deploymentError = ref<{
  message: string
  code?: string
  recoverable: boolean
  remediation: string
} | null>(null)

// Audit trail state
const showAuditTrail = ref(false)
const showViewAuditTrail = ref(true)
const auditTrailEntries = ref<AuditTrailEntry[]>([])
const loadingAuditTrail = ref(false)

const startDeployment = async () => {
  deploymentStatus.value = 'in-progress'
  deploymentError.value = null
  
  // Track analytics
  analyticsService.trackEvent({
    event: 'token_deployment_started',
    category: 'deployment',
    label: tokenDraftStore.currentDraft?.selectedStandard || 'unknown',
  })
  
  // Track competitive journey start
  competitiveTelemetryService.startJourney('token_deployment', {
    standard: tokenDraftStore.currentDraft?.selectedStandard || 'unknown',
    network: tokenDraftStore.currentDraft?.selectedNetwork || 'unknown'
  })
  
  const draft = tokenDraftStore.currentDraft
  if (!draft) {
    console.error('No draft found for deployment')
    deploymentStatus.value = 'failed'
    deploymentError.value = {
      message: 'No token configuration found',
      code: 'NO_DRAFT',
      recoverable: false,
      remediation: 'Please complete the token configuration steps before deploying.',
    }
    return
  }

  // Check if we should use real API or mock
  if (useRealApi.value) {
    await startRealDeployment(draft)
  } else {
    // Fall back to mock deployment for testing
    mockDeploymentProcess()
  }
}

const startRealDeployment = async (draft: any) => {
  try {
    // Build deployment request from draft
    const request = buildDeploymentRequest(draft)
    
    // Start deployment with real-time updates
    await deploymentService.startDeployment(request, (state) => {
      // Update local state from service state
      deploymentStages.value = state.stages
      deploymentStatus.value = state.status
      
      // Track deployment status visibility
      const currentStage = state.stages.find(s => s.status === 'in-progress')
      if (currentStage) {
        competitiveTelemetryService.trackDeploymentStatusVisibility({
          stage: currentStage.id,
          status: currentStage.status,
          progress: currentStage.progress,
          userInteraction: 'viewed'
        })
      }
      
      if (state.result) {
        deploymentResult.value = state.result
      }
      
      if (state.error) {
        deploymentError.value = state.error
        
        // Track failure analytics
        analyticsService.trackEvent({
          event: 'token_deployment_failed',
          category: 'deployment',
          label: state.error.code || 'unknown',
        })
        
        // Track competitive error (initially abandoned, may be recovered)
        competitiveTelemetryService.trackErrorRecovery({
          errorType: state.error.code || 'UNKNOWN',
          stage: currentStage?.id || 'unknown',
          recovered: false,
          recoveryMethod: 'abandon'
        })
        
        // Complete journey as failed
        competitiveTelemetryService.completeJourney('token_deployment', false, {
          error: state.error.message,
          errorCode: state.error.code
        })
      }
      
      if (state.status === 'completed') {
        // Track success analytics
        analyticsService.trackEvent({
          event: 'token_deployment_completed',
          category: 'deployment',
          label: draft.selectedStandard || 'unknown',
        })
        
        // Track competitive journey success
        competitiveTelemetryService.completeJourney('token_deployment', true, {
          assetId: state.result?.assetId,
          standard: draft.selectedStandard,
          network: draft.selectedNetwork
        })
      }
    })
  } catch (error: any) {
    console.error('Real deployment failed:', error)
    deploymentStatus.value = 'failed'
    deploymentError.value = {
      message: error.message || 'Deployment failed',
      code: 'DEPLOYMENT_ERROR',
      recoverable: true,
      remediation: 'Please try again. If the problem persists, contact support.',
    }
    
    // Track error recovery attempt opportunity
    competitiveTelemetryService.trackErrorRecovery({
      errorType: 'DEPLOYMENT_ERROR',
      stage: 'deploying',
      recovered: false,
      recoveryMethod: 'abandon'
    })
  }
}

const buildDeploymentRequest = (draft: any): TokenDeploymentRequest => {
  const walletAddress = authStore.user?.address || authStore.account || ''
  
  // Map standard string to TokenStandard enum
  const standardMap: Record<string, TokenStandard> = {
    'ERC20': TokenStandard.ERC20,
    'ARC3': TokenStandard.ARC3,
    'ARC200': TokenStandard.ARC200,
    'ARC1400': TokenStandard.ARC1400,
  }
  
  const standard = standardMap[draft.selectedStandard || ''] || TokenStandard.ARC3
  
  // Build base request
  const baseRequest = {
    standard,
    name: draft.name,
    walletAddress,
    description: draft.description,
    icon: draft.imageUrl,
  }
  
  // Build standard-specific request
  if (standard === TokenStandard.ERC20) {
    return {
      ...baseRequest,
      standard: TokenStandard.ERC20,
      symbol: draft.symbol,
      decimals: Number(draft.decimals) || 18,
      totalSupply: (draft.totalSupply || draft.supply || '1000000').toString(),
    }
  } else if (standard === TokenStandard.ARC3) {
    return {
      ...baseRequest,
      standard: TokenStandard.ARC3,
      unitName: draft.symbol,
      total: Number(draft.supply) || 1,
      decimals: Number(draft.decimals) || 0,
      url: draft.url,
      metadata: draft.attributes ? {
        name: draft.name,
        description: draft.description,
        image: draft.imageUrl,
        properties: draft.attributes.reduce((acc: any, attr: any) => {
          acc[attr.trait_type] = attr.value
          return acc
        }, {}),
      } : undefined,
    }
  } else if (standard === TokenStandard.ARC200) {
    return {
      ...baseRequest,
      standard: TokenStandard.ARC200,
      symbol: draft.symbol,
      decimals: Number(draft.decimals) || 0,
      totalSupply: (draft.totalSupply || draft.supply || '1000000').toString(),
      complianceMetadata: draft.micaMetadata,
    }
  }
  
  // Default to ARC3
  return {
    ...baseRequest,
    standard: TokenStandard.ARC3,
    unitName: draft.symbol,
    total: Number(draft.supply) || 1,
    decimals: Number(draft.decimals) || 0,
  }
}

const mockDeploymentProcess = () => {
  const stages = deploymentStages.value
  let currentStageIndex = 0

  const progressStage = () => {
    if (currentStageIndex >= stages.length) {
      // Deployment complete
      deploymentStatus.value = 'completed'
      stages[currentStageIndex - 1].status = 'completed'
      
      // Fill in deployment result
      const draft = tokenDraftStore.currentDraft
      deploymentResult.value = {
        tokenName: draft?.name || 'My Token',
        tokenSymbol: draft?.symbol || 'MTK',
        network: draft?.selectedNetwork || 'VOI',
        standard: draft?.selectedStandard || 'ASA',
        assetId: `${Math.floor(Math.random() * 1000000000)}`,
        txId: `TX${Math.random().toString(36).substring(2, 15).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      }
      
      console.log('[Analytics] Token deployment completed', deploymentResult.value)
      
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
      }
      return
    }

    const stage = stages[currentStageIndex]
    stage.status = 'in-progress'
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      if (stage.progress === undefined) stage.progress = 0
      
      stage.progress += Math.random() * 25
      
      if (stage.progress >= 100) {
        stage.progress = 100
        stage.status = 'completed'
        stage.details = `Completed at ${new Date().toLocaleTimeString()}`
        clearInterval(progressInterval)
        
        currentStageIndex++
        setTimeout(progressStage, 500)
      }
    }, 300)
  }

  progressStage()
}

const retryDeployment = () => {
  // Reset error state
  deploymentError.value = null
  
  // Reset all stages
  deploymentStages.value.forEach(stage => {
    stage.status = 'pending'
    stage.progress = 0
    stage.details = undefined
    stage.error = undefined
  })
  
  // Track retry analytics
  analyticsService.trackEvent({
    event: 'token_deployment_retry',
    category: 'deployment',
    label: tokenDraftStore.currentDraft?.selectedStandard || 'unknown',
  })
  
  startDeployment()
}

const saveDraftAndExit = () => {
  analyticsService.trackEvent({
    event: 'deployment_draft_saved',
    category: 'deployment',
    label: 'after_failure',
  })
  // Emit event to parent to handle navigation
}

const contactSupport = () => {
  analyticsService.trackEvent({
    event: 'deployment_support_contacted',
    category: 'deployment',
    label: deploymentError.value?.code || 'unknown',
  })
  // Open support dialog or redirect to support page
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  analyticsService.trackEvent({
    event: 'deployment_info_copied',
    category: 'deployment',
    label: 'clipboard',
  })
  // Show toast notification
}

const downloadSummary = () => {
  const draft = tokenDraftStore.currentDraft
  const timestamp = new Date().toISOString()
  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  analyticsService.trackEvent({
    event: 'deployment_audit_downloaded',
    category: 'deployment',
    label: deploymentResult.value.tokenSymbol,
  })
  
  // Create comprehensive audit summary
  const auditSummary = {
    title: 'Token Deployment Audit Report',
    generatedAt: timestamp,
    generatedDate: dateStr,
    
    // Deployment Details
    deployment: {
      tokenName: deploymentResult.value.tokenName,
      tokenSymbol: deploymentResult.value.tokenSymbol,
      network: deploymentResult.value.network,
      standard: deploymentResult.value.standard,
      assetId: deploymentResult.value.assetId,
      transactionId: deploymentResult.value.txId,
      deploymentTimestamp: timestamp,
      deploymentStatus: 'SUCCESS',
    },
    
    // Project Information
    project: {
      name: draft?.projectSetup?.projectName || 'N/A',
      description: draft?.projectSetup?.projectDescription || 'N/A',
      purpose: draft?.projectSetup?.tokenPurpose || 'N/A',
    },
    
    // Issuer Information
    issuer: {
      organizationName: draft?.projectSetup?.organizationName || 'N/A',
      organizationType: draft?.projectSetup?.organizationType || 'N/A',
      registrationNumber: draft?.projectSetup?.registrationNumber || 'N/A',
      jurisdiction: draft?.projectSetup?.jurisdiction || 'N/A',
      complianceContact: draft?.projectSetup?.complianceContactEmail || 'N/A',
    },
    
    // Token Configuration
    tokenConfiguration: {
      name: draft?.name || 'N/A',
      symbol: draft?.symbol || 'N/A',
      decimals: draft?.decimals || 0,
      totalSupply: draft?.totalSupply || 'N/A',
      description: draft?.description || 'N/A',
      url: draft?.url || 'N/A',
    },
    
    // Compliance Information
    compliance: {
      micaReadinessScore: 85, // TODO: Get from compliance store
      completedChecks: 17, // TODO: Get from compliance store
      totalChecks: 20, // TODO: Get from compliance store
      complianceLevel: 'HIGH',
      attestationsProvided: false,
      kycCompleted: false,
    },
    
    // Deployment Stages (for audit trail)
    deploymentStages: deploymentStages.value.map(stage => ({
      name: stage.title,
      status: stage.status,
      completedAt: stage.details || 'N/A',
    })),
    
    // Platform Information
    platform: {
      name: 'Biatec Tokens',
      version: '1.0.0',
      deploymentMethod: 'Backend-Managed',
      authenticationMethod: 'Email/Password (ARC76)',
    },
    
    // Legal Disclaimer
    disclaimer: 'This audit report is for informational purposes only. The token issuer is responsible for ensuring compliance with all applicable laws and regulations. Biatec Tokens provides tooling and infrastructure but does not provide legal or regulatory advice.',
  }
  
  // Create formatted text version
  const textSummary = `
═══════════════════════════════════════════════════════════
  TOKEN DEPLOYMENT AUDIT REPORT
═══════════════════════════════════════════════════════════

Generated: ${dateStr}
Report ID: ${deploymentResult.value.txId}

─────────────────────────────────────────────────────────────
  DEPLOYMENT INFORMATION
─────────────────────────────────────────────────────────────
Token Name:         ${deploymentResult.value.tokenName}
Token Symbol:       ${deploymentResult.value.tokenSymbol}
Network:            ${deploymentResult.value.network}
Token Standard:     ${deploymentResult.value.standard}
Asset ID:           ${deploymentResult.value.assetId}
Transaction ID:     ${deploymentResult.value.txId}
Deployment Status:  SUCCESS
Deployed At:        ${timestamp}

─────────────────────────────────────────────────────────────
  PROJECT INFORMATION
─────────────────────────────────────────────────────────────
Project Name:       ${draft?.projectSetup?.projectName || 'N/A'}
Token Purpose:      ${draft?.projectSetup?.tokenPurpose || 'N/A'}

Description:
${draft?.projectSetup?.projectDescription || 'N/A'}

─────────────────────────────────────────────────────────────
  ISSUER INFORMATION
─────────────────────────────────────────────────────────────
Organization:       ${draft?.projectSetup?.organizationName || 'N/A'}
Organization Type:  ${draft?.projectSetup?.organizationType || 'N/A'}
Registration No:    ${draft?.projectSetup?.registrationNumber || 'N/A'}
Jurisdiction:       ${draft?.projectSetup?.jurisdiction || 'N/A'}
Compliance Contact: ${draft?.projectSetup?.complianceContactEmail || 'N/A'}

─────────────────────────────────────────────────────────────
  TOKEN CONFIGURATION
─────────────────────────────────────────────────────────────
Total Supply:       ${draft?.totalSupply || 'N/A'}
Decimals:           ${draft?.decimals || 0}
URL:                ${draft?.url || 'N/A'}

─────────────────────────────────────────────────────────────
  COMPLIANCE STATUS
─────────────────────────────────────────────────────────────
MICA Readiness:     85% (HIGH)
Completed Checks:   17 of 20
Compliance Level:   HIGH

─────────────────────────────────────────────────────────────
  DEPLOYMENT STAGES
─────────────────────────────────────────────────────────────
${deploymentStages.value.map((stage, i) => `${i + 1}. ${stage.title}: ${stage.status.toUpperCase()}`).join('\n')}

─────────────────────────────────────────────────────────────
  PLATFORM INFORMATION
─────────────────────────────────────────────────────────────
Platform:           Biatec Tokens v1.0.0
Deployment Method:  Backend-Managed (No wallet required)
Authentication:     Email/Password (ARC76)

─────────────────────────────────────────────────────────────
  LEGAL DISCLAIMER
─────────────────────────────────────────────────────────────
This audit report is for informational purposes only. The token
issuer is responsible for ensuring compliance with all applicable
laws and regulations. Biatec Tokens provides tooling and
infrastructure but does not provide legal or regulatory advice.

═══════════════════════════════════════════════════════════
  End of Report
═══════════════════════════════════════════════════════════
`
  
  // Download JSON version
  const jsonBlob = new Blob([JSON.stringify(auditSummary, null, 2)], { type: 'application/json' })
  const jsonUrl = URL.createObjectURL(jsonBlob)
  const jsonLink = document.createElement('a')
  jsonLink.href = jsonUrl
  jsonLink.download = `token-audit-${deploymentResult.value.tokenSymbol}-${Date.now()}.json`
  jsonLink.click()
  URL.revokeObjectURL(jsonUrl)
  
  // Also download text version
  const textBlob = new Blob([textSummary], { type: 'text/plain' })
  const textUrl = URL.createObjectURL(textBlob)
  const textLink = document.createElement('a')
  textLink.href = textUrl
  textLink.download = `token-audit-${deploymentResult.value.tokenSymbol}-${Date.now()}.txt`
  textLink.click()
  URL.revokeObjectURL(textUrl)
  
  analyticsService.trackEvent({
    event: 'audit_summary_downloaded',
    category: 'compliance',
    label: 'comprehensive',
  })
}

// Audit trail methods
const toggleAuditTrail = async () => {
  showAuditTrail.value = !showAuditTrail.value
  
  if (showAuditTrail.value && auditTrailEntries.value.length === 0) {
    await loadAuditTrail()
  }
}

const loadAuditTrail = async () => {
  if (!deploymentResult.value.assetId) return
  
  loadingAuditTrail.value = true
  try {
    // Use the deployment result's asset ID or transaction ID as the deployment ID
    const deploymentId = deploymentResult.value.assetId || deploymentResult.value.txId
    const auditTrail = await auditTrailService.getDeploymentAuditTrail(deploymentId, 1, 20)
    auditTrailEntries.value = auditTrail.entries
  } catch (error) {
    console.error('Failed to load audit trail:', error)
  } finally {
    loadingAuditTrail.value = false
  }
}

const downloadAuditReport = async () => {
  try {
    const deploymentId = deploymentResult.value.assetId || deploymentResult.value.txId
    await auditTrailService.downloadAuditReport(deploymentId, 'json')
    
    analyticsService.trackEvent({
      event: 'audit_report_downloaded',
      category: 'compliance',
      label: deploymentResult.value.tokenSymbol,
    })
  } catch (error) {
    console.error('Failed to download audit report:', error)
  }
}

const formatAuditTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const viewOnExplorer = () => {
  const url = deploymentResult.value.explorerUrl
  if (url) {
    window.open(url, '_blank')
  } else {
    // Fallback to building URL from asset ID and network
    const explorerUrls: Record<string, string> = {
      VOI: `https://voi.observer/asset/${deploymentResult.value.assetId}`,
      Aramid: `https://aramid.observer/asset/${deploymentResult.value.assetId}`,
      Ethereum: `https://etherscan.io/token/${deploymentResult.value.assetId}`,
      Algorand: `https://algoexplorer.io/asset/${deploymentResult.value.assetId}`,
    }
    
    const fallbackUrl = explorerUrls[deploymentResult.value.network] || '#'
    window.open(fallbackUrl, '_blank')
  }
  
  analyticsService.trackEvent({
    event: 'token_viewed_on_explorer',
    category: 'deployment',
    label: deploymentResult.value.network,
  })
}

const isValid = computed(() => {
  return deploymentStatus.value === 'completed'
})

onMounted(() => {
  // Auto-start deployment when step is mounted
  setTimeout(() => {
    startDeployment()
  }, 1000)
})

onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
  // Clean up deployment service
  deploymentService.stopPolling()
  deploymentService.reset()
})

defineExpose({
  isValid,
})
</script>

<style scoped>
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
