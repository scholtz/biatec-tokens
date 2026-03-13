<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Settings</h1>
          <p class="text-gray-300 text-lg">Configure your development environment and network settings</p>
        </div>

        <!-- Network Configuration -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Network Configuration</h2>

          <div class="space-y-6">
            <!-- Network Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-3">Active Network</label>
              <div class="flex space-x-4">
                <label v-for="network in networks" :key="network" class="flex items-center space-x-2">
                  <input v-model="settings.network" :value="network" type="radio" class="w-4 h-4 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500" />
                  <span class="text-gray-900 dark:text-white capitalize">{{ network }}</span>
                </label>
              </div>
            </div>

            <!-- Algorand Configuration -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Algod URL</label>
                <input
                  v-model="currentNetworkConfig.algodUrl"
                  type="url"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="https://testnet-api.algonode.cloud"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Algod Token</label>
                <input
                  v-model="currentNetworkConfig.algodToken"
                  type="password"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Optional API token"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Indexer URL</label>
                <input
                  v-model="currentNetworkConfig.indexerUrl"
                  type="url"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="https://testnet-idx.algonode.cloud"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Indexer Token</label>
                <input
                  v-model="currentNetworkConfig.indexerToken"
                  type="password"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Optional API token"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- EVM Configuration -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">EVM Configuration</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">RPC URL</label>
              <input
                v-model="settings.evmRpcUrl"
                type="url"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="https://ethereum-sepolia.blockpi.network/v1/rpc/public"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Chain ID</label>
              <input
                v-model.number="settings.evmChainId"
                type="number"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="11155111"
              />
            </div>
          </div>
        </div>

        <!-- Developer Tools -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Developer Tools</h2>

          <div class="space-y-6">
            <!-- Demo Mode -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Demo Mode</h3>
                <p class="text-sm text-gray-300">Mock all blockchain interactions for testing purposes</p>
              </div>
              <button
                @click="settingsStore.toggleDemoMode()"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  settings.demoMode ? 'bg-biatec-accent' : 'bg-gray-600',
                ]"
              >
                <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', settings.demoMode ? 'translate-x-6' : 'translate-x-1']" />
              </button>
            </div>

            <!-- Custom Headers -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Custom Headers (JSON)</label>
              <textarea
                v-model="customHeaders"
                rows="3"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder='{"X-API-Key": "your-api-key"}'
              ></textarea>
            </div>

            <!-- Test Connection -->
            <div class="flex items-center space-x-4">
              <button
                @click="testConnection"
                :disabled="isTestingConnection"
                class="px-6 py-3 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i v-if="isTestingConnection" class="pi pi-spin pi-spinner mr-2"></i>
                <i v-else class="pi pi-link mr-2"></i>
                Test Connection
              </button>
              <div v-if="connectionStatus" class="flex items-center space-x-2">
                <i :class="connectionStatus.success ? 'pi pi-check-circle text-green-400' : 'pi pi-times-circle text-red-400'"></i>
                <span :class="connectionStatus.success ? 'text-green-400' : 'text-red-400'">
                  {{ connectionStatus.message }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Import/Export -->
        <div class="glass-effect rounded-xl p-6 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Import/Export Settings</h2>

          <div class="space-y-4">
            <div class="flex items-center space-x-4">
              <button @click="exportSettings" class="px-6 py-3 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors">
                <i class="pi pi-download mr-2"></i>
                Export Settings
              </button>
              <button @click="importInput?.click()" class="px-6 py-3 bg-biatec-accent/20 text-biatec-accent rounded-lg hover:bg-biatec-accent/30 transition-colors">
                <i class="pi pi-upload mr-2"></i>
                Import Settings
              </button>
            </div>
            <input ref="importInput" type="file" accept=".json" @change="importSettings" class="hidden" />
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
          <button @click="saveSettings" class="btn-primary px-8 py-3 rounded-xl text-gray-900 dark:text-white font-semibold flex items-center space-x-2">
            <i class="pi pi-save"></i>
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useSettingsStore } from "../stores/settings";
import MainLayout from "../layout/MainLayout.vue";

const settingsStore = useSettingsStore();
const importInput = ref<HTMLInputElement>();

const networks = ["mainnet", "testnet", "dockernet"];
const isTestingConnection = ref(false);
const connectionStatus = ref<{ success: boolean; message: string } | null>(null);
const customHeaders = ref("");

const settings = computed(() => settingsStore.settings);
const currentNetworkConfig = computed(() => settings.value.networkConfigs[settings.value.network]);

const testConnection = async () => {
  isTestingConnection.value = true;
  connectionStatus.value = null;

  try {
    // Mock connection test
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate random success/failure for demo
    const success = Math.random() > 0.3;
    connectionStatus.value = {
      success,
      message: success ? "Connection successful" : "Connection failed - check your settings",
    };
  } catch (error) {
    connectionStatus.value = {
      success: false,
      message: "Connection failed",
    };
  } finally {
    isTestingConnection.value = false;
  }
};

const exportSettings = () => {
  try {
    const settingsJson = settingsStore.exportSettings();
    const blob = new Blob([settingsJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "biatec-tokens-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export settings:", error);
  }
};

const importSettings = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const settingsJson = e.target?.result as string;
      const success = settingsStore.importSettings(settingsJson);
      if (success) {
        console.log("Settings imported successfully");
      } else {
        console.error("Failed to import settings");
      }
    } catch (error) {
      console.error("Failed to import settings:", error);
    }
  };
  reader.readAsText(file);
};

const saveSettings = () => {
  // Parse custom headers
  if (customHeaders.value) {
    try {
      const headers = JSON.parse(customHeaders.value);
      currentNetworkConfig.value.headers = headers;
    } catch (error) {
      console.error("Invalid JSON in custom headers:", error);
    }
  }

  console.log("Settings saved successfully");
};
</script>
