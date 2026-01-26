<template>
  <div class="space-y-8">
    <!-- Business Value Section -->
    <Card variant="glass" padding="lg">
      <div class="text-center max-w-4xl mx-auto">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
          <ChartBarSquareIcon class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Token Standards Comparison</h2>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">Compare features across multiple token standards to make informed decisions for your enterprise tokenization needs.</p>
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-left">
          <div class="flex items-start space-x-3">
            <InformationCircleIcon class="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="font-semibold text-blue-900 dark:text-blue-200 mb-2">Enterprise Value</h3>
              <p class="text-sm text-blue-800 dark:text-blue-300">
                This comparison matrix helps enterprise buyers evaluate token standard suitability for their specific use cases. Features like <strong>whitelisting</strong> and
                <strong>compliance flags</strong> are critical for regulated environments, while <strong>metadata support</strong> and <strong>programmable logic</strong> enable sophisticated business
                models. Choose the right standard to ensure regulatory compliance, operational efficiency, and future scalability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Network Filter -->
    <div class="flex items-center justify-center space-x-4">
      <button
        v-for="filter in networkFilters"
        :key="filter.value"
        @click="selectedNetwork = filter.value"
        :class="[
          'px-6 py-3 rounded-lg font-medium transition-all duration-200',
          selectedNetwork === filter.value
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500',
        ]"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Comparison Matrix -->
    <Card variant="default" padding="none">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10">Feature</th>
              <th v-for="standard in filteredStandards" :key="standard.name" class="px-6 py-4 text-center min-w-[140px]">
                <div class="flex flex-col items-center space-y-2">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="standard.bgClass">
                    <component :is="standard.icon" class="w-5 h-5 text-white" />
                  </div>
                  <div class="font-semibold text-gray-900 dark:text-white text-sm">{{ standard.name }}</div>
                  <Badge :variant="standard.badgeVariant" size="sm">{{ standard.type }}</Badge>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(feature, index) in featureRows"
              :key="feature.key"
              :class="['border-b border-gray-200 dark:border-gray-700', index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/30']"
            >
              <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white sticky left-0 z-10" :class="index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/30'">
                <div class="flex items-center space-x-2">
                  <component :is="feature.icon" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span>{{ feature.label }}</span>
                </div>
                <div v-if="feature.description" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ feature.description }}
                </div>
              </td>
              <td v-for="standard in filteredStandards" :key="`${standard.name}-${feature.key}`" class="px-6 py-4 text-center">
                <div v-if="getFeatureValue(standard, feature.key)" class="flex justify-center">
                  <CheckCircleIcon class="w-6 h-6 text-green-500" />
                </div>
                <div v-else class="flex justify-center">
                  <XCircleIcon class="w-6 h-6 text-gray-300 dark:text-gray-600" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Standards Details Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card v-for="standard in filteredStandards" :key="standard.name" variant="default" hover>
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="standard.bgClass">
            <component :is="standard.icon" class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ standard.name }}</h3>
              <Badge :variant="standard.badgeVariant" size="sm">{{ standard.type }}</Badge>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">{{ standard.detailedDescription }}</p>

            <div class="space-y-3">
              <div>
                <h4 class="text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center">
                  <CheckCircleIcon class="w-3 h-3 mr-1" />
                  Pros
                </h4>
                <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li v-for="pro in standard.pros" :key="pro" class="flex items-start">
                    <span class="mr-1">•</span>
                    <span>{{ pro }}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 class="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center">
                  <ExclamationCircleIcon class="w-3 h-3 mr-1" />
                  Cons
                </h4>
                <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li v-for="con in standard.cons" :key="con" class="flex items-start">
                    <span class="mr-1">•</span>
                    <span>{{ con }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useTokenStore, type TokenStandard } from "../stores/tokens";
import Card from "./ui/Card.vue";
import Badge from "./ui/Badge.vue";
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChartBarSquareIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  LockClosedIcon,
  SparklesIcon,
  BoltIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/outline";

const tokenStore = useTokenStore();

const networkFilters = [
  { label: "All Networks", value: "all" },
  { label: "AVM Chains (Algorand, VOI, Aramid)", value: "AVM" },
  { label: "EVM Chains (Ethereum, Arbitrum, Base)", value: "EVM" },
];

const selectedNetwork = ref("all");

const filteredStandards = computed(() => {
  if (selectedNetwork.value === "all") {
    return tokenStore.tokenStandards;
  }
  return tokenStore.tokenStandards.filter((s) => s.network === selectedNetwork.value);
});

const featureRows = [
  {
    key: "metadataSupport",
    label: "Metadata Support",
    description: "Rich token information and visual assets",
    icon: DocumentTextIcon,
  },
  {
    key: "smartContract",
    label: "Smart Contract",
    description: "Programmable token logic",
    icon: CodeBracketIcon,
  },
  {
    key: "whitelisting",
    label: "Whitelisting",
    description: "Restrict transfers to approved addresses",
    icon: ShieldCheckIcon,
  },
  {
    key: "complianceFlags",
    label: "Compliance Flags",
    description: "Built-in regulatory compliance features",
    icon: LockClosedIcon,
  },
  {
    key: "royalties",
    label: "Royalty Support",
    description: "Automatic creator royalties on transfers",
    icon: SparklesIcon,
  },
  {
    key: "mutableMetadata",
    label: "Mutable Metadata",
    description: "Update token metadata after creation",
    icon: ArrowPathIcon,
  },
  {
    key: "programmableLogic",
    label: "Programmable Logic",
    description: "Custom tokenomics and transfer rules",
    icon: CodeBracketIcon,
  },
  {
    key: "nativeL1",
    label: "Native Layer-1",
    description: "Built into blockchain protocol",
    icon: BoltIcon,
  },
];

const getFeatureValue = (standard: TokenStandard, featureKey: string) => {
  if (!standard.features) return false;
  return standard.features[featureKey as keyof typeof standard.features] === true;
};
</script>
