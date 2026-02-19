<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Hero Section -->
        <div class="text-center mb-12">
          <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <SparklesIcon class="w-10 h-10 text-white" />
          </div>
          <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Your Token Opportunity
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore token standards, understand compliance requirements, and launch with confidence.
            Our guided journey helps you make informed decisions for your tokenization needs.
          </p>
        </div>

        <!-- Category Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <CategoryCard
            v-for="category in categories"
            :key="category.id"
            :category="category"
            :selected="selectedCategory === category.id"
            @select="handleCategorySelect"
          />
        </div>

        <!-- Telemetry-Driven Opportunities -->
        <div v-if="opportunities.length > 0" class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              Recommended for You
            </h2>
            <Badge variant="success" size="sm">
              <LightBulbIcon class="w-4 h-4 mr-1" />
              Based on your profile
            </Badge>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <OpportunityCard
              v-for="opportunity in opportunities"
              :key="opportunity.id"
              :opportunity="opportunity"
              @select="handleOpportunitySelect"
            />
          </div>
        </div>

        <!-- Call to Action -->
        <Card variant="glass" padding="lg" class="text-center">
          <div class="max-w-2xl mx-auto">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Compare Standards?
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Use our interactive comparison tool to evaluate token standards based on your specific requirements.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                @click="handleCompareStandards"
              >
                <ChartBarSquareIcon class="w-5 h-5 mr-2" />
                Compare Standards
              </Button>
              <Button
                variant="secondary"
                size="lg"
                @click="handleStartActivation"
                :disabled="!authStore.isAuthenticated"
              >
                <RocketLaunchIcon class="w-5 h-5 mr-2" />
                {{ authStore.isAuthenticated ? 'Start Activation' : 'Sign In to Start' }}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import MainLayout from '../layout/MainLayout.vue';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import Badge from '../components/ui/Badge.vue';
import CategoryCard from '../components/discovery/CategoryCard.vue';
import OpportunityCard from '../components/discovery/OpportunityCard.vue';
import { CompetitiveTelemetryService } from '../services/CompetitiveTelemetryService';
import { analyticsService } from '../services/analytics';
import {
  SparklesIcon,
  ChartBarSquareIcon,
  RocketLaunchIcon,
  LightBulbIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const telemetryService = CompetitiveTelemetryService.getInstance();

const selectedCategory = ref<string | null>(null);

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  standards: string[];
  rwaRelevance: 'high' | 'medium' | 'low';
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  standard: string;
  rwaScore: number;
  complianceScore: number;
  reason: string;
}

const categories = ref<Category[]>([
  {
    id: 'rwa',
    name: 'Real-World Assets',
    description: 'Tokenize real estate, securities, commodities, and other physical assets with full compliance.',
    icon: 'building',
    standards: ['ARC1400', 'ARC200', 'ARC3'],
    rwaRelevance: 'high',
  },
  {
    id: 'defi',
    name: 'DeFi & Utilities',
    description: 'Payment tokens, stablecoins, and utility tokens for decentralized finance applications.',
    icon: 'currency',
    standards: ['ERC20', 'ARC200'],
    rwaRelevance: 'low',
  },
  {
    id: 'nft',
    name: 'NFTs & Collectibles',
    description: 'Unique digital assets, art, collectibles, and membership tokens with rich metadata.',
    icon: 'photo',
    standards: ['ARC3', 'ARC69', 'ARC72', 'ERC721'],
    rwaRelevance: 'medium',
  },
  {
    id: 'governance',
    name: 'Governance Tokens',
    description: 'Voting rights, DAO participation, and community governance mechanisms.',
    icon: 'users',
    standards: ['ARC200', 'ERC20'],
    rwaRelevance: 'low',
  },
]);

const opportunities = ref<Opportunity[]>([]);

const handleCategorySelect = (categoryId: string) => {
  selectedCategory.value = categoryId;
  
  // Track category selection
  analyticsService.trackEvent({
    event: 'discovery_category_selected',
    category: 'Discovery',
    action: 'Category',
    label: categoryId,
    categoryId,
  });

  telemetryService.trackFeatureDiscovery({
    feature: `category_${categoryId}`,
    discovered: true,
    context: 'discovery_journey',
  });
};

const handleOpportunitySelect = (opportunity: Opportunity) => {
  // Track opportunity selection
  analyticsService.trackEvent({
    event: 'discovery_opportunity_selected',
    category: 'Discovery',
    action: 'Opportunity',
    label: opportunity.id,
    opportunityId: opportunity.id,
    standard: opportunity.standard,
    rwaScore: opportunity.rwaScore,
  });

  // Navigate to standards comparison with selected standard highlighted
  router.push({
    name: 'TokenStandards',
    query: { highlight: opportunity.standard },
  });
};

const handleCompareStandards = () => {
  // Track compare CTA
  analyticsService.trackEvent({
    event: 'discovery_compare_cta',
    category: 'Discovery',
    action: 'CTA',
    label: 'compare_standards',
    selectedCategory: selectedCategory.value,
  });

  telemetryService.startJourney('standards_comparison', {
    entryPoint: 'discovery_journey',
    selectedCategory: selectedCategory.value,
  });

  router.push({ name: 'TokenStandards' });
};

const handleStartActivation = () => {
  if (!authStore.isAuthenticated) {
    return;
  }

  // Track activation CTA
  analyticsService.trackEvent({
    event: 'discovery_activation_cta',
    category: 'Discovery',
    action: 'CTA',
    label: 'start_activation',
    selectedCategory: selectedCategory.value,
  });

  telemetryService.startJourney('wallet_activation', {
    entryPoint: 'discovery_journey',
    selectedCategory: selectedCategory.value,
  });

  router.push({ name: 'GuidedLaunch' });
};

const loadOpportunities = () => {
  // Simulate telemetry-driven recommendations
  // In production, this would come from backend analysis
  opportunities.value = [
    {
      id: 'rwa_security',
      title: 'Security Token with Full Compliance',
      description: 'Perfect for real estate, equity, or debt tokenization with built-in regulatory features.',
      standard: 'ARC1400',
      rwaScore: 100,
      complianceScore: 100,
      reason: 'Matches your enterprise profile and compliance requirements',
    },
    {
      id: 'rwa_flexible',
      title: 'Flexible RWA Token',
      description: 'Balance compliance and flexibility with whitelisting and metadata support.',
      standard: 'ARC200',
      rwaScore: 90,
      complianceScore: 95,
      reason: 'Recommended for commodity-backed tokens and stablecoins',
    },
    {
      id: 'nft_compliant',
      title: 'Compliant NFT with Metadata',
      description: 'Rich metadata support with optional compliance features for regulated NFTs.',
      standard: 'ARC3',
      rwaScore: 65,
      complianceScore: 60,
      reason: 'Suitable for fractional real estate or art tokenization',
    },
  ];
};

onMounted(() => {
  // Track journey entry
  analyticsService.trackEvent({
    event: 'discovery_journey_entered',
    category: 'Discovery',
    action: 'Entry',
    label: 'journey_start',
  });

  telemetryService.startJourney('token_discovery', {
    authenticated: authStore.isAuthenticated,
  });

  loadOpportunities();
});
</script>
