<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-white mb-2">Review & Submit</h2>
      <p class="text-gray-300">Review your configuration before launching</p>
    </div>

    <!-- Readiness Score -->
    <Card variant="elevated" padding="md" class="border-2" :class="readinessScore.blockers.length === 0 ? 'border-green-500' : 'border-yellow-500'">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">Readiness Score</h3>
        <div class="text-3xl font-bold" :class="readinessScore.blockers.length === 0 ? 'text-green-400' : 'text-yellow-400'">
          {{ readinessScore.overallScore }}%
        </div>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Required Steps:</span>
          <span class="text-white">{{ readinessScore.requiredStepsComplete }} / {{ readinessScore.totalRequiredSteps }}</span>
        </div>
        <div v-if="readinessScore.blockers.length > 0" class="bg-red-900/30 border border-red-700/50 rounded p-3 space-y-1">
          <p class="text-sm font-semibold text-red-400">Blockers:</p>
          <ul class="text-sm text-red-300 list-disc list-inside">
            <li v-for="(blocker, i) in readinessScore.blockers" :key="i">{{ blocker }}</li>
          </ul>
        </div>
        <div v-if="readinessScore.warnings.length > 0" class="bg-yellow-900/30 border border-yellow-700/50 rounded p-3 space-y-1">
          <p class="text-sm font-semibold text-yellow-400">Warnings:</p>
          <ul class="text-sm text-yellow-300 list-disc list-inside">
            <li v-for="(warning, i) in readinessScore.warnings" :key="i">{{ warning }}</li>
          </ul>
        </div>
      </div>
    </Card>

    <!-- Organization Profile Summary -->
    <Card v-if="formData.organizationProfile" variant="glass" padding="md">
      <h3 class="font-semibold text-white mb-3">Organization Profile</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div><span class="text-gray-400">Name:</span><span class="text-white ml-2">{{ formData.organizationProfile.organizationName }}</span></div>
        <div><span class="text-gray-400">Type:</span><span class="text-white ml-2">{{ formData.organizationProfile.organizationType }}</span></div>
        <div><span class="text-gray-400">Jurisdiction:</span><span class="text-white ml-2">{{ formData.organizationProfile.jurisdiction }}</span></div>
        <div><span class="text-gray-400">Contact:</span><span class="text-white ml-2">{{ formData.organizationProfile.contactEmail }}</span></div>
      </div>
    </Card>

    <!-- Token Intent Summary -->
    <Card v-if="formData.tokenIntent" variant="glass" padding="md">
      <h3 class="font-semibold text-white mb-3">Token Intent</h3>
      <div class="space-y-2 text-sm">
        <div><span class="text-gray-400">Purpose:</span><p class="text-white mt-1">{{ formData.tokenIntent.tokenPurpose }}</p></div>
        <div><span class="text-gray-400">Utility Type:</span><Badge variant="info" class="ml-2">{{ formData.tokenIntent.utilityType }}</Badge></div>
      </div>
    </Card>

    <!-- Template Summary -->
    <Card v-if="formData.selectedTemplate" variant="glass" padding="md">
      <h3 class="font-semibold text-white mb-3">Selected Template</h3>
      <div class="space-y-2">
        <div class="text-white font-medium">{{ formData.selectedTemplate.name }}</div>
        <div class="flex gap-2">
          <Badge variant="info">{{ formData.selectedTemplate.standard }}</Badge>
          <Badge variant="default">{{ formData.selectedTemplate.network }}</Badge>
        </div>
      </div>
    </Card>

    <!-- Transaction Preview Panel -->
    <TransactionPreviewPanel
      ref="txPreviewRef"
      v-model:acknowledged="riskAcknowledged"
      :token-name="formData.selectedTemplate?.name ?? ''"
      :token-standard="formData.selectedTemplate?.standard ?? ''"
      :network="formData.selectedTemplate?.network ?? ''"
      :total-supply="Number(formData.tokenEconomics?.totalSupply ?? 0)"
      data-testid="review-transaction-preview"
    />

    <!-- Submit Button -->
    <div class="pt-6 border-t border-gray-700">
      <Button
        @click="handleSubmit"
        variant="primary"
        size="lg"
        full-width
        :disabled="!canSubmit || isSubmitting"
        :loading="isSubmitting"
      >
        <CheckIcon class="w-5 h-5 mr-2" />
        {{ isSubmitting ? 'Submitting...' : 'Submit Token Launch' }}
      </Button>
      <p v-if="props.readinessScore.blockers.length > 0" class="mt-3 text-center text-sm text-red-400">
        Please resolve all blockers before submitting
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReadinessScore, GuidedLaunchForm } from '../../../types/guidedLaunch'
import Card from '../../ui/Card.vue'
import Button from '../../ui/Button.vue'
import Badge from '../../ui/Badge.vue'
import TransactionPreviewPanel from '../TransactionPreviewPanel.vue'
import { CheckIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  readinessScore: ReadinessScore
  formData: GuidedLaunchForm
  isSubmitting: boolean
}>()

const emit = defineEmits<{ submit: [] }>()

const txPreviewRef = ref<InstanceType<typeof TransactionPreviewPanel> | null>(null)
const riskAcknowledged = ref(false)

const canSubmit = computed(() => props.readinessScore.blockers.length === 0 && riskAcknowledged.value)

const handleSubmit = () => {
  if (!txPreviewRef.value?.validate()) return
  if (canSubmit.value) {
    emit('submit')
  }
}
</script>
