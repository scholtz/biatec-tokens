<template>
  <div class="trust-panel" role="complementary" aria-label="Platform trust and comparison information">
    <div class="trust-panel-header">
      <div class="trust-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 4L4 10v8c0 7.5 5.2 14.5 12 16 6.8-1.5 12-8.5 12-16v-8L16 4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 16l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="trust-panel-title">{{ title }}</h3>
    </div>
    
    <p class="trust-panel-description">{{ description }}</p>
    
    <div class="trust-benefits">
      <div
        v-for="(benefit, index) in benefits"
        :key="index"
        class="trust-benefit"
      >
        <div class="benefit-icon" aria-hidden="true">✓</div>
        <div class="benefit-content">
          <strong class="benefit-title">{{ benefit.title }}</strong>
          <p class="benefit-description">{{ benefit.description }}</p>
        </div>
      </div>
    </div>
    
    <div v-if="showComparison" class="trust-comparison">
      <button
        @click="toggleComparison"
        class="comparison-toggle"
        :aria-expanded="comparisonExpanded ? 'true' : 'false'"
        aria-controls="comparison-content"
      >
        <span>{{ comparisonExpanded ? 'Hide' : 'Show' }} comparison with wallet-based platforms</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          :class="{ 'rotate-180': comparisonExpanded }"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div
        v-show="comparisonExpanded"
        id="comparison-content"
        class="comparison-content"
      >
        <div class="comparison-table">
          <div class="comparison-header">
            <div class="comparison-feature">Feature</div>
            <div class="comparison-column comparison-column--biatec">Biatec (Auth-First)</div>
            <div class="comparison-column comparison-column--wallet">Wallet-Based Platforms</div>
          </div>
          
          <div
            v-for="(item, index) in comparisonItems"
            :key="index"
            class="comparison-row"
          >
            <div class="comparison-feature">{{ item.feature }}</div>
            <div class="comparison-column comparison-column--biatec">
              <span class="comparison-value" :class="item.biatecAdvantage ? 'comparison-value--good' : ''">
                {{ item.biatec }}
              </span>
            </div>
            <div class="comparison-column comparison-column--wallet">
              <span class="comparison-value">{{ item.wallet }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="$slots.additional" class="trust-panel-additional">
      <slot name="additional"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { trackTrustPanelInteraction } from '../services/executionTimelineTelemetry';

export interface TrustBenefit {
  title: string;
  description: string;
}

export interface ComparisonItem {
  feature: string;
  biatec: string;
  wallet: string;
  biatecAdvantage?: boolean;
}

interface Props {
  title?: string;
  description?: string;
  benefits?: TrustBenefit[];
  showComparison?: boolean;
  comparisonItems?: ComparisonItem[];
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Simplified, Enterprise-Ready Token Issuance',
  description: 'Biatec provides a trust-first authentication experience that eliminates wallet complexity while maintaining enterprise-grade security and compliance.',
  benefits: () => [
    {
      title: 'No Wallet Required',
      description: 'Sign in with email and password. No browser extensions, no seed phrases to manage.',
    },
    {
      title: 'Backend Token Deployment',
      description: 'Tokens are deployed server-side with institutional-grade security. No manual transaction signing.',
    },
    {
      title: 'Compliance-First Workflow',
      description: 'Built-in regulatory compliance checks ensure your tokens meet MICA and other requirements.',
    },
    {
      title: 'Predictable Execution',
      description: 'Deterministic state transitions and clear feedback at every step. No guessing what happens next.',
    },
  ],
  showComparison: true,
  comparisonItems: () => [
    {
      feature: 'Authentication',
      biatec: 'Email & Password',
      wallet: 'Browser Wallet Required',
      biatecAdvantage: true,
    },
    {
      feature: 'Onboarding Time',
      biatec: '< 2 minutes',
      wallet: '10-30 minutes (wallet setup)',
      biatecAdvantage: true,
    },
    {
      feature: 'Token Deployment',
      biatec: 'Automated (Backend)',
      wallet: 'Manual Transaction Signing',
      biatecAdvantage: true,
    },
    {
      feature: 'Compliance Validation',
      biatec: 'Built-in MICA Checks',
      wallet: 'Manual / External',
      biatecAdvantage: true,
    },
    {
      feature: 'Error Recovery',
      biatec: 'Automatic Retry with Guidance',
      wallet: 'Manual Troubleshooting',
      biatecAdvantage: true,
    },
    {
      feature: 'Enterprise Support',
      biatec: 'Full Support Included',
      wallet: 'Community Forums',
      biatecAdvantage: true,
    },
  ],
});

const comparisonExpanded = ref(false);

function toggleComparison(): void {
  comparisonExpanded.value = !comparisonExpanded.value;
  
  if (comparisonExpanded.value) {
    trackTrustPanelInteraction('compare-clicked', 'auth-first-vs-wallet');
  }
}
</script>

<style scoped>
.trust-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.trust-panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.trust-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.9);
}

.trust-panel-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.trust-panel-description {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  opacity: 0.95;
}

.trust-benefits {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.trust-benefit {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
}

.benefit-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.benefit-content {
  flex: 1;
}

.benefit-title {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.benefit-description {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.5;
}

.trust-comparison {
  margin-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 1.5rem;
}

.comparison-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.comparison-toggle:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.comparison-toggle:focus {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

.comparison-toggle svg {
  transition: transform 0.2s;
}

.rotate-180 {
  transform: rotate(180deg);
}

.comparison-content {
  margin-top: 1rem;
}

.comparison-table {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

.comparison-header {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: rgba(0, 0, 0, 0.2);
  font-weight: 600;
  font-size: 0.875rem;
}

.comparison-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
}

.comparison-feature {
  font-weight: 500;
}

.comparison-column {
  text-align: left;
}

.comparison-value {
  display: inline-block;
}

.comparison-value--good {
  font-weight: 600;
  position: relative;
}

.comparison-value--good::before {
  content: '✓ ';
  color: rgba(167, 243, 208, 1);
  font-weight: bold;
}

.trust-panel-additional {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

/* Responsive design */
@media (max-width: 768px) {
  .comparison-header,
  .comparison-row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  
  .comparison-column {
    padding-left: 1rem;
  }
  
  .comparison-feature {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
}
</style>
