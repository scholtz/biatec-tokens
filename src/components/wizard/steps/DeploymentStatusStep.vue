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
          <div>
            <h4 class="text-md font-semibold text-red-400 mb-1">
              Deployment Failed
            </h4>
            <p class="text-sm text-gray-300">
              Something went wrong during deployment. Here are your options:
            </p>
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
}

const tokenDraftStore = useTokenDraftStore()

const showErrors = ref(false)
const errors = ref<string[]>([])
const deploymentStatus = ref<'pending' | 'in-progress' | 'completed' | 'failed'>('pending')
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)

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
})

const startDeployment = () => {
  deploymentStatus.value = 'in-progress'
  console.log('[Analytics] Token deployment started')
  
  // Mock deployment process with stages
  mockDeploymentProcess()
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
  // Reset all stages
  deploymentStages.value.forEach(stage => {
    stage.status = 'pending'
    stage.progress = 0
    stage.details = undefined
    stage.error = undefined
  })
  
  startDeployment()
}

const saveDraftAndExit = () => {
  console.log('[Analytics] User saved draft and exited after deployment failure')
  // Emit event to parent to handle navigation
}

const contactSupport = () => {
  console.log('[Analytics] User contacted support for deployment issue')
  // Open support dialog or redirect to support page
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  console.log('Copied to clipboard:', text)
  // Show toast notification
}

const downloadSummary = () => {
  const summary = {
    ...deploymentResult.value,
    deployedAt: new Date().toISOString(),
    complianceScore: 85, // Mock compliance score
  }
  
  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `token-deployment-${deploymentResult.value.tokenSymbol}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  console.log('[Analytics] Deployment summary downloaded')
}

const viewOnExplorer = () => {
  const explorerUrls: Record<string, string> = {
    VOI: `https://voi.observer/asset/${deploymentResult.value.assetId}`,
    Aramid: `https://aramid.observer/asset/${deploymentResult.value.assetId}`,
    Ethereum: `https://etherscan.io/token/${deploymentResult.value.assetId}`,
  }
  
  const url = explorerUrls[deploymentResult.value.network] || '#'
  window.open(url, '_blank')
  
  console.log('[Analytics] Viewed token on explorer')
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
