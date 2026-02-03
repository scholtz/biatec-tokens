<template>
  <div class="min-h-screen flex items-center justify-center container-padding">
    <div class="max-w-md w-full">
      <Card variant="elevated" padding="lg">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <CheckCircleIcon class="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for your subscription. Your account has been upgraded and you now have access to all premium features.
          </p>
          
          <div class="space-y-4">
            <Button
              @click="$router.push('/dashboard')"
              variant="primary"
              size="lg"
              full-width
            >
              Go to Dashboard
            </Button>
            
            <Button
              @click="$router.push('/create')"
              variant="outline"
              size="lg"
              full-width
            >
              Create Your First Token
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSubscriptionStore } from '../../stores/subscription'
import { telemetryService } from '../../services/TelemetryService'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

const subscriptionStore = useSubscriptionStore()

onMounted(async () => {
  // Refresh subscription data after successful payment
  await subscriptionStore.fetchSubscription()
  
  // Track upgrade completion
  const currentPlan = subscriptionStore.currentProduct?.name || 'premium'
  telemetryService.trackPlanUpgradeCompleted({
    fromPlan: 'free',
    toPlan: currentPlan
  })
})
</script>