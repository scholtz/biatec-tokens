<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="subscriptionStore.isInTrial && !dismissed"
      class="w-full px-4 py-2.5 flex items-center justify-between gap-4 text-sm"
      :class="bannerClass"
      data-testid="trial-countdown-banner"
      role="banner"
      aria-label="Free trial countdown"
    >
      <div class="flex items-center gap-2 min-w-0">
        <ClockIcon class="w-4 h-4 flex-shrink-0" />
        <span class="font-medium truncate" data-testid="trial-days-text">
          {{ trialMessage }}
        </span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <router-link
          to="/subscription/pricing"
          class="font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap"
          data-testid="trial-upgrade-link"
        >
          Add Payment Method
        </router-link>
        <button
          @click="dismissBanner"
          class="ml-2 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss trial banner"
          data-testid="trial-banner-dismiss"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSubscriptionStore } from '../stores/subscription'
import { ClockIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const subscriptionStore = useSubscriptionStore()

// Persist dismissed state per session so banner reappears on next login
const DISMISSED_KEY = 'trial_banner_dismissed_until'
const isDismissedInSession = (): boolean => {
  try {
    const until = sessionStorage.getItem(DISMISSED_KEY)
    return !!until && new Date(until) > new Date()
  } catch {
    return false
  }
}

const dismissed = ref(isDismissedInSession())

const dismissBanner = () => {
  dismissed.value = true
  try {
    // Dismiss until end of day so it can reappear next day if still in trial
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)
    sessionStorage.setItem(DISMISSED_KEY, endOfDay.toISOString())
  } catch {
    // sessionStorage may not be available in all environments
  }
}

const daysRemaining = computed(() => subscriptionStore.trialDaysRemaining)

const trialMessage = computed(() => {
  const days = daysRemaining.value
  if (days === 0) return 'Your free trial expires today!'
  if (days === 1) return '1 day left in your free trial'
  return `${days} days left in your free trial`
})

const bannerClass = computed(() => {
  const days = daysRemaining.value
  if (days <= 3) {
    return 'bg-red-600 text-white'
  }
  if (days <= 7) {
    return 'bg-yellow-500 text-yellow-950'
  }
  return 'bg-blue-600 text-white'
})
</script>
