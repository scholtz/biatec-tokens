<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div class="container-padding section-padding">
      <div class="max-w-7xl mx-auto">
        <!-- Header with Value Proposition -->
        <div class="text-center mb-12">
          <Badge variant="info" size="lg" class="mb-4">Regulated Token Issuance Without Wallets</Badge>
          <h1 class="text-5xl font-bold text-white mb-4">
            Simple, Predictable Pricing for Compliant Token Creation
          </h1>
          <p class="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your compliance needs. No hidden fees, no crypto expertise required.
            Start with a free trial or select a plan to access advanced features.
          </p>
        </div>

        <!-- Billing Interval Toggle -->
        <div class="flex items-center justify-center gap-4 mb-8" data-testid="billing-toggle">
          <span :class="billingInterval === 'month' ? 'text-white font-semibold' : 'text-gray-400'" class="text-sm">Monthly</span>
          <button
            @click="toggleBillingInterval"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            :class="billingInterval === 'year' ? 'bg-blue-600' : 'bg-gray-600'"
            role="switch"
            :aria-checked="billingInterval === 'year'"
            aria-label="Toggle annual billing"
            data-testid="billing-interval-toggle"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform"
              :class="billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
          <span :class="billingInterval === 'year' ? 'text-white font-semibold' : 'text-gray-400'" class="text-sm">
            Annual
            <Badge variant="success" size="sm" class="ml-1.5" data-testid="annual-discount-badge">Save 20%</Badge>
          </span>
        </div>

        <!-- Coupon Code -->
        <div class="flex justify-center mb-8">
          <div class="flex items-center gap-2 w-full max-w-sm" data-testid="coupon-section">
            <input
              v-model="couponInput"
              type="text"
              placeholder="Coupon code"
              class="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              :class="couponStatus === 'valid' ? 'border-green-500' : couponStatus === 'invalid' ? 'border-red-500' : ''"
              data-testid="coupon-input"
              @keyup.enter="handleApplyCoupon"
            />
            <Button
              @click="handleApplyCoupon"
              variant="outline"
              size="sm"
              :loading="couponLoading"
              :disabled="!couponInput.trim()"
              data-testid="coupon-apply-btn"
            >
              Apply
            </Button>
            <button
              v-if="couponStatus === 'valid'"
              @click="handleClearCoupon"
              class="text-gray-400 hover:text-white transition-colors"
              aria-label="Remove coupon"
              data-testid="coupon-clear-btn"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="flex justify-center -mt-5 mb-8" v-if="couponMessage">
          <p
            class="text-sm"
            :class="couponStatus === 'valid' ? 'text-green-400' : 'text-red-400'"
            data-testid="coupon-message"
          >
            {{ couponMessage }}
          </p>
        </div>

        <!-- Current Subscription Status -->
        <div v-if="authStore.isAuthenticated && subscriptionStore.subscription" class="mb-8">
          <Card variant="glass" padding="md">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white mb-1">Current Plan</h3>
                <p class="text-gray-300">
                  {{ getCurrentPlanName() }}
                  <Badge 
                    v-if="subscriptionStore.isActive" 
                    variant="success" 
                    size="sm" 
                    class="ml-2"
                  >
                    Active
                  </Badge>
                </p>
              </div>
              <div v-if="subscriptionStore.currentPeriodEnd" class="text-right">
                <p class="text-sm text-gray-400">Next billing</p>
                <p class="font-medium text-white">
                  {{ formatDate(subscriptionStore.currentPeriodEnd) }}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <!-- Authentication Notice -->
        <div v-if="!authStore.isAuthenticated" class="mb-8">
          <Card variant="glass" padding="md">
            <div class="text-center">
              <ArrowRightOnRectangleIcon class="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-white mb-2">Sign In to Get Started</h3>
              <p class="text-gray-300 mb-4">
                Create your account to start your free trial and explore our platform
              </p>
              <Button
                @click="handleSignIn"
                variant="primary"
                size="lg"
              >
                Sign In or Create Account
              </Button>
            </div>
          </Card>
        </div>

        <!-- Pricing Cards - Three Tiers -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <!-- Basic Plan -->
          <Card variant="default" padding="lg" class="relative flex flex-col" data-testid="plan-card-basic">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">Basic</h3>
              <div class="mb-1">
                <span class="text-5xl font-bold text-white" data-testid="basic-price">${{ getDisplayPrice('basic') }}</span>
                <span class="text-gray-400">/month</span>
              </div>
              <p v-if="billingInterval === 'year'" class="text-sm text-green-400 mb-2" data-testid="basic-annual-note">
                Billed ${{ getAnnualTotal('basic') }}/year
              </p>
              <p class="text-gray-300">Essential tools for small teams</p>
            </div>
            
            <div class="flex-1">
              <ul class="space-y-3 mb-8">
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Up to 10 tokens per month</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Basic standards (ASA, ARC3, ARC19)</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Testnet deployment only</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Basic MICA templates</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Email support (48h)</span>
                </li>
              </ul>
            </div>

            <Button
              @click="handleSelectPlan('basic')"
              variant="outline"
              size="lg"
              full-width
              :loading="loading && selectedTier === 'basic'"
              :disabled="isCurrentPlan('basic')"
              data-testid="select-basic-btn"
            >
              {{ getPlanButtonText('basic') }}
            </Button>
          </Card>

          <!-- Professional Plan - Most Popular -->
          <Card variant="elevated" padding="lg" class="relative flex flex-col border-2 border-blue-500" data-testid="plan-card-professional">
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge variant="info" size="lg" class="px-6 py-2">Most Popular</Badge>
            </div>
            
            <div class="text-center mb-6 mt-2">
              <h3 class="text-2xl font-bold text-white mb-2">Professional</h3>
              <div class="mb-1">
                <span class="text-5xl font-bold text-white" data-testid="professional-price">${{ getDisplayPrice('professional') }}</span>
                <span class="text-gray-400">/month</span>
              </div>
              <p v-if="billingInterval === 'year'" class="text-sm text-green-400 mb-2" data-testid="professional-annual-note">
                Billed ${{ getAnnualTotal('professional') }}/year
              </p>
              <p class="text-gray-300">Advanced features for growing businesses</p>
            </div>
            
            <div class="flex-1">
              <ul class="space-y-3 mb-8">
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Unlimited token creation</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">All AVM + ERC20 standards</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Mainnet & testnet deployment</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Full MICA compliance suite</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">KYC/AML templates included</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">API access & batch deployment</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Priority support (24h)</span>
                </li>
              </ul>
            </div>

            <Button
              @click="handleSelectPlan('professional')"
              variant="primary"
              size="lg"
              full-width
              :loading="loading && selectedTier === 'professional'"
              :disabled="isCurrentPlan('professional')"
              data-testid="select-professional-btn"
            >
              {{ getPlanButtonText('professional') }}
            </Button>
          </Card>

          <!-- Enterprise Plan -->
          <Card variant="default" padding="lg" class="relative flex flex-col border border-purple-500/50" data-testid="plan-card-enterprise">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <div class="mb-1">
                <span class="text-5xl font-bold text-white" data-testid="enterprise-price">${{ getDisplayPrice('enterprise') }}</span>
                <span class="text-gray-400">/month</span>
              </div>
              <p v-if="billingInterval === 'year'" class="text-sm text-green-400 mb-2" data-testid="enterprise-annual-note">
                Billed ${{ getAnnualTotal('enterprise') }}/year
              </p>
              <p class="text-gray-300">Complete solution for regulated issuance</p>
            </div>
            
            <div class="flex-1">
              <ul class="space-y-3 mb-8">
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Unlimited tokens & standards</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">All networks (AVM + EVM mainnet)</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">NFT support (ARC72, ERC721)</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Advanced compliance workflows</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Real-time monitoring & reporting</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Regulatory audit support</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">White-label & custom integrations</span>
                </li>
                <li class="flex items-start">
                  <CheckIcon class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span class="text-gray-300">Dedicated support + account manager</span>
                </li>
              </ul>
            </div>

            <Button
              @click="handleSelectPlan('enterprise')"
              variant="primary"
              size="lg"
              full-width
              :loading="loading && selectedTier === 'enterprise'"
              :disabled="isCurrentPlan('enterprise')"
              data-testid="select-enterprise-btn"
            >
              {{ getPlanButtonText('enterprise') }}
            </Button>
          </Card>
        </div>

        <!-- Feature Comparison Table -->
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-white mb-8 text-center">Detailed Feature Comparison</h2>
          <Card variant="default" padding="none">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-800/50">
                  <tr>
                    <th class="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Feature
                    </th>
                    <th class="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Basic
                    </th>
                    <th class="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Professional
                    </th>
                    <th class="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-700/50">
                  <tr v-for="feature in comparisonFeatures" :key="feature.name" class="hover:bg-gray-800/30">
                    <td class="px-6 py-4 text-sm font-medium text-white">
                      {{ feature.name }}
                    </td>
                    <td class="px-6 py-4 text-center text-sm text-gray-300">
                      <component 
                        v-if="typeof feature.basic === 'boolean'"
                        :is="feature.basic ? CheckIcon : XMarkIcon" 
                        :class="feature.basic ? 'text-green-400' : 'text-gray-600'"
                        class="w-5 h-5 mx-auto"
                      />
                      <span v-else class="text-gray-300">{{ feature.basic }}</span>
                    </td>
                    <td class="px-6 py-4 text-center text-sm text-gray-300">
                      <component 
                        v-if="typeof feature.professional === 'boolean'"
                        :is="feature.professional ? CheckIcon : XMarkIcon" 
                        :class="feature.professional ? 'text-green-400' : 'text-gray-600'"
                        class="w-5 h-5 mx-auto"
                      />
                      <span v-else class="text-gray-300">{{ feature.professional }}</span>
                    </td>
                    <td class="px-6 py-4 text-center text-sm text-gray-300">
                      <component 
                        v-if="typeof feature.enterprise === 'boolean'"
                        :is="feature.enterprise ? CheckIcon : XMarkIcon" 
                        :class="feature.enterprise ? 'text-green-400' : 'text-gray-600'"
                        class="w-5 h-5 mx-auto"
                      />
                      <span v-else class="text-gray-300">{{ feature.enterprise }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <!-- Business Value Section -->
        <div class="mb-16">
          <h2 class="text-3xl font-bold text-white mb-8 text-center">Why Biatec Tokens?</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="glass" padding="lg">
              <div class="text-center">
                <ShieldCheckIcon class="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 class="text-xl font-semibold text-white mb-3">MICA Compliant</h3>
                <p class="text-gray-300">
                  Built-in compliance templates and automated reporting ensure your tokens meet EU regulatory requirements
                </p>
              </div>
            </Card>
            <Card variant="glass" padding="lg">
              <div class="text-center">
                <LockClosedIcon class="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 class="text-xl font-semibold text-white mb-3">No Wallet Required</h3>
                <p class="text-gray-300">
                  Create and deploy tokens without managing crypto wallets or private keys. We handle the blockchain complexity
                </p>
              </div>
            </Card>
            <Card variant="glass" padding="lg">
              <div class="text-center">
                <BoltIcon class="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 class="text-xl font-semibold text-white mb-3">Fast & Reliable</h3>
                <p class="text-gray-300">
                  Deploy your tokens in minutes with our guided wizard. Track deployment status in real-time
                </p>
              </div>
            </Card>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="mb-12">
          <h2 class="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div class="max-w-4xl mx-auto space-y-4">
            <Card
              v-for="faq in faqs"
              :key="faq.question"
              variant="glass"
              padding="md"
              class="cursor-pointer hover:border-blue-500/50 transition-colors"
              @click="faq.open = !faq.open"
            >
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-white">{{ faq.question }}</h3>
                <ChevronDownIcon 
                  :class="{ 'rotate-180': faq.open }"
                  class="w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4"
                />
              </div>
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <p v-if="faq.open" class="mt-3 text-gray-300">{{ faq.answer }}</p>
              </Transition>
            </Card>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="text-center">
          <Card variant="glass" padding="lg">
            <h2 class="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join businesses around the world using Biatec Tokens for regulated token issuance
            </p>
            <div class="flex gap-4 justify-center">
              <Button
                v-if="!authStore.isAuthenticated"
                @click="handleSignIn"
                variant="primary"
                size="lg"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                @click="handleContactSales"
              >
                Contact Sales
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useSubscriptionStore } from '../../stores/subscription'
import { telemetryService } from '../../services/TelemetryService'
import { stripeProducts, ANNUAL_DISCOUNT_PERCENT, getProductByTierAndInterval } from '../../stripe-config'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import {
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  BoltIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()
const loading = ref(false)
const selectedTier = ref<string>('')
const billingInterval = ref<'month' | 'year'>('month')
const couponInput = ref('')
const couponLoading = ref(false)
const couponStatus = ref<'idle' | 'valid' | 'invalid'>('idle')
const couponMessage = ref('')

const toggleBillingInterval = () => {
  billingInterval.value = billingInterval.value === 'month' ? 'year' : 'month'
}

const getDisplayPrice = (tier: 'basic' | 'professional' | 'enterprise'): string => {
  const product = getProductByTierAndInterval(tier, billingInterval.value)
  if (!product) {
    // Fallback: compute from monthly
    const monthly = getProductByTierAndInterval(tier, 'month')
    if (!monthly) return '—'
    const discounted = monthly.price * (1 - ANNUAL_DISCOUNT_PERCENT / 100)
    return discounted.toFixed(2).replace('.00', '')
  }
  const monthlyEquiv = product.interval === 'year' ? product.price / 12 : product.price
  return monthlyEquiv.toFixed(2).replace(/\.00$/, '')
}

const getAnnualTotal = (tier: 'basic' | 'professional' | 'enterprise'): string => {
  const product = getProductByTierAndInterval(tier, 'year')
  if (!product) return '—'
  return product.price.toFixed(2).replace(/\.00$/, '')
}

const handleApplyCoupon = async () => {
  const code = couponInput.value.trim()
  if (!code) return

  couponLoading.value = true
  couponStatus.value = 'idle'
  couponMessage.value = ''

  try {
    const result = await subscriptionStore.validateCoupon(code)
    if (result.valid) {
      couponStatus.value = 'valid'
      couponMessage.value = result.message ?? `Coupon applied: ${result.discountPercent}% off`
    } else {
      couponStatus.value = 'invalid'
      couponMessage.value = result.message ?? 'Invalid coupon code'
    }
  } finally {
    couponLoading.value = false
  }
}

const handleClearCoupon = () => {
  couponInput.value = ''
  couponStatus.value = 'idle'
  couponMessage.value = ''
  subscriptionStore.clearCoupon()
}

const comparisonFeatures = [
  { name: 'Monthly token limit', basic: '10 tokens', professional: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Token Standards', basic: 'ASA, ARC3, ARC19', professional: 'All AVM + ERC20', enterprise: 'All (AVM + EVM)' },
  { name: 'Deployment Networks', basic: 'Testnet only', professional: 'Mainnet + Testnet', enterprise: 'All networks' },
  { name: 'MICA Compliance Templates', basic: true, professional: true, enterprise: true },
  { name: 'KYC/AML Integration', basic: false, professional: true, enterprise: true },
  { name: 'Automated Compliance Monitoring', basic: false, professional: true, enterprise: true },
  { name: 'Real-time Reporting', basic: false, professional: false, enterprise: true },
  { name: 'API Access', basic: false, professional: true, enterprise: true },
  { name: 'Batch Deployment', basic: false, professional: true, enterprise: true },
  { name: 'NFT Support (ARC72, ERC721)', basic: false, professional: false, enterprise: true },
  { name: 'White-label Options', basic: false, professional: false, enterprise: true },
  { name: 'Custom Integrations', basic: false, professional: false, enterprise: true },
  { name: 'Support Response Time', basic: '48 hours', professional: '24 hours', enterprise: '4 hours' },
  { name: 'Dedicated Account Manager', basic: false, professional: false, enterprise: true }
]

const faqs = ref([
  {
    question: 'What is MICA and why does it matter?',
    answer: 'MICA (Markets in Crypto-Assets) is EU regulation that establishes rules for crypto-asset issuance. Our platform ensures your tokens meet these requirements, reducing legal risk and enabling regulated market access.',
    open: false
  },
  {
    question: 'Do I need crypto knowledge to use Biatec Tokens?',
    answer: 'No! Our guided wizard walks you through every step with plain language explanations. You focus on your business requirements while we handle the blockchain complexity.',
    open: false
  },
  {
    question: 'Can I start with a lower tier and upgrade later?',
    answer: 'Absolutely. You can upgrade your plan at any time. Changes take effect immediately, and we prorate any billing differences.',
    open: false
  },
  {
    question: 'What token standards are supported?',
    answer: 'We support AVM standards (ASA, ARC3, ARC19, ARC69, ARC200, ARC72) and EVM standards (ERC20, ERC721). Availability depends on your plan tier.',
    open: false
  },
  {
    question: 'Which blockchain networks can I deploy to?',
    answer: 'Supported networks include Algorand (mainnet & testnet), VOI, Aramid, Ethereum, Arbitrum, Base, and their testnets. Network access depends on your subscription tier.',
    open: false
  },
  {
    question: 'How does wallet-free deployment work?',
    answer: 'We manage the blockchain wallets and private keys securely on your behalf. You authenticate with email/password and we handle all blockchain transactions through our secure infrastructure.',
    open: false
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel anytime. Your access continues until the end of your current billing period, and all your data remains accessible.',
    open: false
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express) through Stripe. Enterprise customers can also arrange invoice billing.',
    open: false
  }
])

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const getCurrentPlanName = () => {
  const product = subscriptionStore.currentProduct
  if (!product) return 'Free Trial'
  return product.name
}

const isCurrentPlan = (tier: string) => {
  const product = subscriptionStore.currentProduct
  return product?.tier === tier
}

const getPlanButtonText = (tier: string) => {
  if (!authStore.isAuthenticated) {
    return 'Sign In to Subscribe'
  }
  if (isCurrentPlan(tier)) {
    return 'Current Plan'
  }
  return 'Select Plan'
}

const handleSignIn = () => {
  // Redirect to home with auth modal
  router.push({ name: 'Home', query: { showAuth: 'true' } })
}

const handleSelectPlan = async (tier: string) => {
  if (!authStore.isAuthenticated) {
    handleSignIn()
    return
  }

  const product = getProductByTierAndInterval(
    tier as 'basic' | 'professional' | 'enterprise',
    billingInterval.value
  ) ?? stripeProducts.find(p => p.tier === tier && p.interval === 'month')

  if (!product) {
    console.error('Product not found for tier:', tier)
    return
  }

  const currentPlan = subscriptionStore.currentProduct?.tier || 'free'
  
  loading.value = true
  selectedTier.value = tier
  
  try {
    // Track plan selection
    telemetryService.trackPlanUpgradeStarted({
      fromPlan: currentPlan,
      toPlan: product.name,
      source: 'pricing_page_enhanced'
    })
    
    // Create checkout session with optional coupon
    const couponCode = subscriptionStore.appliedCoupon?.code
    await subscriptionStore.createCheckoutSession(product.priceId, 'subscription', couponCode)
  } finally {
    loading.value = false
    selectedTier.value = ''
  }
}

const handleContactSales = () => {
  // Open contact/sales form or email
  window.location.href = 'mailto:sales@biatec.io?subject=Enterprise Plan Inquiry'
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await subscriptionStore.fetchSubscription()
  }
})
</script>
