<template>
  <div class="space-y-8">
    <!-- Header Section -->
    <Card variant="glass" padding="lg">
      <div class="text-center max-w-4xl mx-auto">
        <div class="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
          <BuildingOfficeIcon class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Enterprise Token Standard Decision Guide</h2>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Find the optimal token standard for your enterprise requirements. This guide maps regulatory needs, 
          compliance features, and technical capabilities to the right token standard.
        </p>
        <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 text-left">
          <div class="flex items-start space-x-3">
            <InformationCircleIcon class="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="font-semibold text-purple-900 dark:text-purple-200 mb-2">Quick Decision Criteria</h3>
              <p class="text-sm text-purple-800 dark:text-purple-300">
                Select the token standard based on your primary enterprise requirement: 
                <strong>MICA compliance</strong> for regulated assets, 
                <strong>RWA whitelisting</strong> for controlled transfers, 
                <strong>compliance reporting</strong> for audit trails, or 
                <strong>wallet compatibility</strong> for broad adoption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Quick Recommendation Matrix -->
    <Card variant="default" padding="lg">
      <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <CheckBadgeIcon class="w-7 h-7 mr-3 text-green-500" />
        Recommendation Matrix
      </h3>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        Find your primary enterprise requirement below to see the recommended token standards.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b-2 border-gray-300 dark:border-gray-700">
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Enterprise Requirement
              </th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Recommended Standards
              </th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Key Capability
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(rec, index) in recommendations"
              :key="rec.requirement"
              :class="[
                'border-b border-gray-200 dark:border-gray-700',
                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/30'
              ]"
            >
              <td class="px-4 py-4">
                <div class="flex items-center space-x-3">
                  <component :is="rec.icon" class="w-5 h-5 flex-shrink-0" :class="rec.iconColor" />
                  <div>
                    <div class="font-semibold text-gray-900 dark:text-white">{{ rec.requirement }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ rec.description }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="standard in rec.standards"
                    :key="standard"
                    :variant="getStandardBadgeVariant(standard)"
                    size="sm"
                  >
                    {{ standard }}
                  </Badge>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                {{ rec.capability }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Detailed Feature Mapping -->
    <Card variant="default" padding="lg">
      <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <ClipboardDocumentCheckIcon class="w-7 h-7 mr-3 text-blue-500" />
        Enterprise Feature Comparison
      </h3>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        Detailed comparison of enterprise features across token standards.
      </p>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10">
                Feature
              </th>
              <th
                v-for="standard in enterpriseStandards"
                :key="standard.name"
                class="px-6 py-4 text-center min-w-[120px]"
              >
                <div class="flex flex-col items-center space-y-2">
                  <div class="font-semibold text-gray-900 dark:text-white text-sm">{{ standard.name }}</div>
                  <Badge :variant="getStandardBadgeVariant(standard.name)" size="sm">{{ standard.type }}</Badge>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(feature, index) in enterpriseFeatures"
              :key="feature.key"
              :class="[
                'border-b border-gray-200 dark:border-gray-700',
                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/30'
              ]"
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
              <td
                v-for="standard in enterpriseStandards"
                :key="`${standard.name}-${feature.key}`"
                class="px-6 py-4 text-center"
              >
                <div class="flex justify-center items-center">
                  <CheckCircleIcon v-if="hasFeature(standard, feature.key)" class="w-6 h-6 text-green-500" />
                  <MinusCircleIcon v-else-if="feature.optional" class="w-6 h-6 text-yellow-500" />
                  <XCircleIcon v-else class="w-6 h-6 text-gray-300 dark:text-gray-600" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Use Case Guidance -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card
        v-for="useCase in useCaseGuidance"
        :key="useCase.title"
        variant="default"
        hover
      >
        <div class="flex items-start space-x-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="useCase.bgClass">
            <component :is="useCase.icon" class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">{{ useCase.title }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">{{ useCase.description }}</p>
            <div class="space-y-2">
              <div class="text-xs font-semibold text-gray-900 dark:text-white">Recommended Standards:</div>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="standard in useCase.recommended"
                  :key="standard"
                  variant="success"
                  size="sm"
                >
                  {{ standard }}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Call to Action -->
    <Card variant="glass" padding="lg">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Need More Details?</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Explore the comprehensive token standards comparison to dive deeper into features, 
          pros and cons, and technical specifications.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/token-standards">
            <Button variant="primary" size="lg" class="text-lg px-8 py-4">
              <template #icon>
                <ChartBarSquareIcon class="w-6 h-6 mr-2" />
              </template>
              View Full Comparison
            </Button>
          </router-link>
          <router-link to="/create">
            <Button variant="outline" size="lg" class="text-lg px-8 py-4">
              <template #icon>
                <PlusCircleIcon class="w-6 h-6 mr-2" />
              </template>
              Create Token
            </Button>
          </router-link>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTokenStore } from '../stores/tokens';
import Card from './ui/Card.vue';
import Badge from './ui/Badge.vue';
import Button from './ui/Button.vue';
import {
  BuildingOfficeIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ScaleIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CubeIcon,
  ChartBarSquareIcon,
  PlusCircleIcon,
} from '@heroicons/vue/24/outline';

const tokenStore = useTokenStore();

// Import TokenStandard type for type safety
import type { TokenStandard } from '../stores/tokens';

// List of token standards relevant for enterprise use (fungible tokens)
const ENTERPRISE_FUNGIBLE_STANDARDS = ['ASA', 'ARC3FT', 'ARC200', 'ERC20'] as const;

// Standards for broad wallet support including NFTs
const WALLET_COMPATIBLE_STANDARDS = ['ASA', 'ARC3FT', 'ARC3NFT', 'ERC20', 'ERC721'] as const;

// Standards with compliance features (smart contracts for programmability)
const COMPLIANCE_CAPABLE_STANDARDS = ['ARC200', 'ERC20'] as const;

// Recommendation matrix data
const recommendations = [
  {
    requirement: 'MICA Compliance Readiness',
    description: 'Tokens requiring EU MICA regulation compliance',
    icon: ScaleIcon,
    iconColor: 'text-blue-600',
    standards: Array.from(COMPLIANCE_CAPABLE_STANDARDS),
    capability: 'Built-in compliance flags and programmable restrictions'
  },
  {
    requirement: 'RWA Whitelisting',
    description: 'Real-World Assets with restricted transfer capabilities',
    icon: LockClosedIcon,
    iconColor: 'text-purple-600',
    standards: Array.from(COMPLIANCE_CAPABLE_STANDARDS),
    capability: 'Smart contract-based whitelisting and transfer controls'
  },
  {
    requirement: 'Compliance Reporting',
    description: 'Comprehensive audit trails and reporting capabilities',
    icon: DocumentChartBarIcon,
    iconColor: 'text-green-600',
    standards: Array.from(COMPLIANCE_CAPABLE_STANDARDS),
    capability: 'Event logs and on-chain transparency for auditors'
  },
  {
    requirement: 'Broad Wallet Support',
    description: 'Maximum compatibility across wallet providers',
    icon: GlobeAltIcon,
    iconColor: 'text-amber-600',
    standards: Array.from(WALLET_COMPATIBLE_STANDARDS),
    capability: 'Native L1 or widely adopted standards'
  },
];

// Enterprise-relevant standards (fungible tokens for feature comparison)
const enterpriseStandards = computed(() => {
  return tokenStore.tokenStandards.filter(s => 
    ENTERPRISE_FUNGIBLE_STANDARDS.includes(s.name as typeof ENTERPRISE_FUNGIBLE_STANDARDS[number])
  );
});

// Enterprise-focused features
const enterpriseFeatures = [
  {
    key: 'micaCompliant',
    label: 'MICA Compliance Ready',
    description: 'Supports EU MICA regulatory requirements',
    icon: ScaleIcon,
    optional: false,
  },
  {
    key: 'whitelisting',
    label: 'Transfer Whitelisting',
    description: 'Restrict transfers to approved addresses',
    icon: ShieldCheckIcon,
    optional: false,
  },
  {
    key: 'complianceFlags',
    label: 'Compliance Flags',
    description: 'Built-in regulatory compliance features',
    icon: LockClosedIcon,
    optional: false,
  },
  {
    key: 'programmableLogic',
    label: 'Programmable Restrictions',
    description: 'Custom compliance rules via smart contracts',
    icon: CubeIcon,
    optional: false,
  },
  {
    key: 'auditTrail',
    label: 'Comprehensive Audit Trail',
    description: 'Full transaction history for compliance',
    icon: DocumentChartBarIcon,
    optional: false,
  },
  {
    key: 'walletSupport',
    label: 'Broad Wallet Support',
    description: 'Compatible with major wallet providers',
    icon: GlobeAltIcon,
    optional: false,
  },
];

// Use case guidance
const useCaseGuidance = [
  {
    title: 'Regulated Securities',
    description: 'Tokenized equity, bonds, or investment funds requiring full regulatory compliance',
    icon: BuildingLibraryIcon,
    bgClass: 'bg-blue-500',
    recommended: ['ARC200'],
  },
  {
    title: 'Real Estate Tokens',
    description: 'Property tokenization with accredited investor requirements and transfer restrictions',
    icon: BuildingOfficeIcon,
    bgClass: 'bg-purple-500',
    recommended: ['ARC200'],
  },
  {
    title: 'E-Money Tokens',
    description: 'Payment tokens with reserve requirements and redemption rights',
    icon: BanknotesIcon,
    bgClass: 'bg-green-500',
    recommended: ['ARC200', 'ERC20'],
  },
  {
    title: 'Utility Tokens (Compliant)',
    description: 'Platform tokens with optional compliance features for regulated markets',
    icon: GlobeAltIcon,
    bgClass: 'bg-amber-500',
    recommended: ['ARC3FT', 'ARC200'],
  },
];

// Helper functions
const getStandardBadgeVariant = (standardName: string): "default" | "info" | "success" | "warning" | "error" => {
  const standard = tokenStore.tokenStandards.find(s => s.name === standardName);
  return standard?.badgeVariant || 'default';
};

const hasFeature = (standard: TokenStandard, featureKey: string): boolean => {
  // Map enterprise feature keys to standard features where naming differs
  // Currently only 'micaCompliant' maps to the standard 'complianceFlags' feature
  const featureMap: Record<string, string> = {
    'micaCompliant': 'complianceFlags',
  };

  const mappedKey = featureMap[featureKey] || featureKey;
  
  if (!standard.features) return false;
  
  // All blockchain standards provide audit trails via on-chain transparency
  if (featureKey === 'auditTrail') {
    return true;
  }
  
  // Wallet support: native L1 standards plus widely adopted standards
  if (featureKey === 'walletSupport') {
    return standard.features.nativeL1 === true || 
           standard.name === 'ERC20' || 
           standard.name === 'ARC3FT';
  }
  
  return standard.features[mappedKey as keyof typeof standard.features] === true;
};
</script>
