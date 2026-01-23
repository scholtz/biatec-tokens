<template>
  <MainLayout>
    <div class="container-padding">
      <div class="max-w-7xl mx-auto">
        <!-- Page Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Token Standards</h1>
            <router-link to="/enterprise-guide">
              <Button variant="outline" size="md">
                <template #icon>
                  <BuildingOfficeIcon class="w-5 h-5 mr-2" />
                </template>
                Enterprise Guide
              </Button>
            </router-link>
          </div>
          <p class="text-gray-600 dark:text-gray-300 text-lg">
            Comprehensive comparison of supported token standards across Algorand-based networks (VOI, Aramid) and Ethereum
          </p>
        </div>

        <!-- Standards Comparison Component -->
        <TokenStandardsComparison />

        <!-- Network Guidance Section -->
        <div class="mt-12 space-y-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Network Guidance</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              v-for="network in tokenStore.networkGuidance"
              :key="network.name"
              variant="glass"
              padding="lg"
            >
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{{ network.displayName }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">{{ network.description }}</p>
              
              <div class="space-y-4">
                <!-- Fees -->
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <CurrencyDollarIcon class="w-4 h-4 mr-2 text-blue-500" />
                    Fee Structure
                  </h4>
                  <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1 pl-6">
                    <p><strong>Creation:</strong> {{ network.fees.creation }}</p>
                    <p><strong>Transaction:</strong> {{ network.fees.transaction }}</p>
                    <p class="text-xs italic">{{ network.fees.description }}</p>
                  </div>
                </div>

                <!-- Metadata Hosting -->
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <ServerIcon class="w-4 h-4 mr-2 text-purple-500" />
                    Metadata Hosting
                  </h4>
                  <div class="text-xs text-gray-600 dark:text-gray-400 pl-6">
                    <div class="flex flex-wrap gap-2 mb-2">
                      <Badge
                        v-for="provider in network.metadataHosting.recommended"
                        :key="provider"
                        variant="info"
                        size="sm"
                      >
                        {{ provider }}
                      </Badge>
                    </div>
                    <p class="text-xs italic">{{ network.metadataHosting.description }}</p>
                  </div>
                </div>

                <!-- Compliance -->
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <ShieldCheckIcon class="w-4 h-4 mr-2 text-green-500" />
                    Compliance Considerations
                  </h4>
                  <div class="text-xs text-gray-600 dark:text-gray-400 pl-6">
                    <ul class="space-y-1 mb-2">
                      <li v-for="consideration in network.compliance.considerations" :key="consideration" class="flex items-start">
                        <span class="mr-1">•</span>
                        <span>{{ consideration }}</span>
                      </li>
                    </ul>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2 mt-2">
                      <p class="text-xs"><strong>MICA Relevance:</strong> {{ network.compliance.micaRelevance }}</p>
                    </div>
                  </div>
                </div>

                <!-- Best For -->
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <CheckBadgeIcon class="w-4 h-4 mr-2 text-amber-500" />
                    Best For
                  </h4>
                  <div class="flex flex-wrap gap-2 pl-6">
                    <Badge
                      v-for="useCase in network.bestFor"
                      :key="useCase"
                      variant="success"
                      size="sm"
                    >
                      {{ useCase }}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- Call to Action -->
        <Card variant="glass" padding="lg" class="mt-12">
          <div class="text-center">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Create Your Token?</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Choose the right token standard for your use case and deploy in under 60 seconds with our streamlined creation wizard.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <router-link to="/create">
                <Button variant="primary" size="lg" class="text-lg px-8 py-4">
                  <template #icon>
                    <PlusCircleIcon class="w-6 h-6 mr-2" />
                  </template>
                  Create Token
                </Button>
              </router-link>
              <router-link to="/dashboard">
                <Button variant="outline" size="lg" class="text-lg px-8 py-4">
                  <template #icon>
                    <ChartBarIcon class="w-6 h-6 mr-2" />
                  </template>
                  View Dashboard
                </Button>
              </router-link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { useTokenStore } from '../stores/tokens';
import MainLayout from '../layout/MainLayout.vue';
import TokenStandardsComparison from '../components/TokenStandardsComparison.vue';
import Card from '../components/ui/Card.vue';
import Badge from '../components/ui/Badge.vue';
import Button from '../components/ui/Button.vue';
import {
  CurrencyDollarIcon,
  ServerIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  PlusCircleIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
} from '@heroicons/vue/24/outline';

const tokenStore = useTokenStore();
</script>
