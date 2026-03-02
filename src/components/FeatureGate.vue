<template>
  <slot v-if="hasAccess" />
  <div
    v-else
    class="relative rounded-xl overflow-hidden"
    :class="wrapperClass"
    data-testid="feature-gate"
  >
    <!-- Blurred preview of content when showPreview is enabled -->
    <div v-if="showPreview" class="pointer-events-none select-none opacity-30 blur-sm" aria-hidden="true">
      <slot />
    </div>

    <!-- Lock overlay -->
    <div
      class="flex flex-col items-center justify-center gap-3 text-center p-6"
      :class="showPreview ? 'absolute inset-0 bg-gray-900/80' : ''"
      data-testid="feature-gate-overlay"
    >
      <LockClosedIcon class="w-8 h-8 text-gray-400" />
      <div>
        <p class="font-semibold text-white mb-1" data-testid="feature-gate-title">
          {{ title || defaultTitle }}
        </p>
        <p class="text-sm text-gray-400" data-testid="feature-gate-description">
          {{ description || defaultDescription }}
        </p>
      </div>
      <router-link
        to="/subscription/pricing"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        data-testid="feature-gate-upgrade-cta"
      >
        <ArrowUpCircleIcon class="w-4 h-4" />
        {{ ctaText || defaultCtaText }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSubscriptionStore } from '../stores/subscription'
import { LockClosedIcon, ArrowUpCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  requiredTier: 'basic' | 'professional' | 'enterprise'
  title?: string
  description?: string
  ctaText?: string
  showPreview?: boolean
  wrapperClass?: string
}>()

const subscriptionStore = useSubscriptionStore()

const hasAccess = computed(() => subscriptionStore.hasFeatureAccess(props.requiredTier))

const tierLabel = computed(() => {
  const labels: Record<string, string> = {
    basic: 'Basic',
    professional: 'Professional',
    enterprise: 'Enterprise',
  }
  return labels[props.requiredTier] ?? props.requiredTier
})

const defaultTitle = computed(() => `${tierLabel.value} Plan Required`)

const defaultDescription = computed(
  () => `This feature is available on the ${tierLabel.value} plan and above.`
)

const defaultCtaText = computed(() => `Upgrade to ${tierLabel.value}`)
</script>
