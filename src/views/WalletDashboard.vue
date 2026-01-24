<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header with Account Switcher -->
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Wallet Dashboard
            </h1>
            <p class="text-gray-600 dark:text-gray-300 text-lg">
              Manage your wallet, view balances, and track compliance
            </p>
          </div>
          <AccountSwitcher v-if="isConnected" />
        </div>

        <!-- Not Connected State -->
        <div v-if="!isConnected" class="text-center py-16">
          <Card variant="glass">
            <div class="py-12">
              <i class="pi pi-wallet text-6xl text-gray-400 mb-6"></i>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Connect Your Wallet
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Connect your wallet to access your token balances, view compliance status, 
                and manage your assets across VOI and Aramid networks.
              </p>
              <Button @click="showWalletConnect = true" variant="primary" size="lg">
                <template #icon>
                  <i class="pi pi-wallet mr-2"></i>
                </template>
                Connect Wallet
              </Button>
            </div>
          </Card>
        </div>

        <!-- Connected State -->
        <div v-else class="space-y-8">
          <!-- Network and Compliance Status Row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Network Status Card -->
            <Card variant="glass">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Network Status
                  </h3>
                  <i class="pi pi-wifi text-green-500"></i>
                </div>
                
                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div 
                      class="w-3 h-3 rounded-full"
                      :class="networkInfo?.isTestnet ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'"
                    ></div>
                    <div>
                      <div class="font-semibold text-gray-900 dark:text-white">
                        {{ networkInfo?.displayName }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ networkInfo?.genesisId }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-sm text-gray-600 dark:text-gray-400">
                  <div class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span>Network Type:</span>
                    <Badge :variant="networkInfo?.isTestnet ? 'warning' : 'success'">
                      {{ networkInfo?.isTestnet ? 'Testnet' : 'Mainnet' }}
                    </Badge>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span>API Endpoint:</span>
                    <code class="text-xs">{{ formatUrl(networkInfo?.algodUrl) }}</code>
                  </div>
                </div>

                <Button 
                  @click="showNetworkSwitcher = true" 
                  variant="outline" 
                  class="w-full"
                  size="sm"
                >
                  <template #icon>
                    <i class="pi pi-refresh mr-2"></i>
                  </template>
                  Switch Network
                </Button>
              </div>
            </Card>

            <!-- Compliance Status - Spans 2 columns -->
            <div class="lg:col-span-2">
              <ComplianceStatusIndicator />
            </div>
          </div>

          <!-- Wallet Info and Token Balance Row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Wallet Info -->
            <div>
              <WalletInfo />
            </div>

            <!-- Token Balance Panel - Spans 2 columns -->
            <div class="lg:col-span-2">
              <TokenBalancePanel />
            </div>
          </div>

          <!-- Quick Actions -->
          <Card variant="glass">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  @click="$router.push('/create')" 
                  variant="primary"
                  class="justify-center"
                >
                  <template #icon>
                    <i class="pi pi-plus mr-2"></i>
                  </template>
                  Create Token
                </Button>

                <Button 
                  @click="$router.push('/dashboard')" 
                  variant="outline"
                  class="justify-center"
                >
                  <template #icon>
                    <i class="pi pi-chart-line mr-2"></i>
                  </template>
                  Token Dashboard
                </Button>

                <Button 
                  @click="$router.push('/compliance')" 
                  variant="outline"
                  class="justify-center"
                >
                  <template #icon>
                    <i class="pi pi-shield mr-2"></i>
                  </template>
                  Compliance
                </Button>

                <Button 
                  @click="handleDisconnect" 
                  variant="outline"
                  class="justify-center"
                >
                  <template #icon>
                    <i class="pi pi-sign-out mr-2"></i>
                  </template>
                  Disconnect
                </Button>
              </div>
            </div>
          </Card>

          <!-- Recent Activity (Placeholder) -->
          <Card variant="glass">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h3>
                <Badge variant="info">Coming Soon</Badge>
              </div>
              
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="pi pi-clock text-3xl mb-3"></i>
                <p class="text-sm">Transaction history and activity tracking coming soon</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <WalletConnectModal
      :is-open="showWalletConnect"
      @close="showWalletConnect = false"
    />

    <NetworkSwitcher
      v-if="showNetworkSwitcher"
      @close="showNetworkSwitcher = false"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import Badge from '../components/ui/Badge.vue'
import WalletInfo from '../components/WalletInfo.vue'
import AccountSwitcher from '../components/AccountSwitcher.vue'
import TokenBalancePanel from '../components/TokenBalancePanel.vue'
import ComplianceStatusIndicator from '../components/ComplianceStatusIndicator.vue'
import WalletConnectModal from '../components/WalletConnectModal.vue'
import NetworkSwitcher from '../components/NetworkSwitcher.vue'
import { useWalletManager } from '../composables/useWalletManager'

const router = useRouter()
const { isConnected, networkInfo, disconnect } = useWalletManager()

const showWalletConnect = ref(false)
const showNetworkSwitcher = ref(false)

const formatUrl = (url?: string): string => {
  if (!url) return 'N/A'
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

const handleDisconnect = async () => {
  try {
    await disconnect()
    router.push('/')
  } catch (error) {
    console.error('Failed to disconnect wallet:', error)
  }
}
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
