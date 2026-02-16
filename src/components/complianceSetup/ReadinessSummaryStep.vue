<template>
  <div class="readiness-summary-step">
    <!-- Step Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-3">
        Compliance Readiness Summary
      </h2>
      <p class="text-gray-300 text-lg">
        Review your complete compliance configuration and resolve any blockers before deploying your token.
        This summary provides a final check to ensure you're ready for launch.
      </p>
    </div>

    <!-- Overall Readiness Score -->
    <div class="glass-effect rounded-xl p-8 mb-6 text-center" :class="readinessScoreClass">
      <div class="mb-4">
        <div class="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4" :class="readinessScoreBgClass">
          <span class="text-5xl font-bold" :class="readinessScoreTextClass">
            {{ readiness.readinessScore }}
          </span>
        </div>
      </div>
      <h3 class="text-2xl font-semibold mb-2" :class="readinessScoreTextClass">
        {{ readinessStatusText }}
      </h3>
      <p class="text-gray-300 max-w-2xl mx-auto">
        {{ readinessDescription }}
      </p>
    </div>

    <!-- Risk Assessment -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="glass-effect rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          Risk Level
        </h4>
        <div class="flex items-center">
          <span class="text-3xl font-bold" :class="riskLevelColor">
            {{ readiness.overallRisk.toUpperCase() }}
          </span>
        </div>
      </div>

      <div class="glass-effect rounded-xl p-6">
        <h4 class="text-lg font-semibold text-white mb-4">
          <i class="pi pi-clock mr-2"></i>
          Time to Ready
        </h4>
        <div class="flex items-center">
          <span class="text-3xl font-bold text-white">
            {{ readiness.estimatedTimeToReady || 'Ready Now' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Step-by-Step Status -->
    <div class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-list-check mr-2"></i>
        Configuration Status
      </h3>

      <div class="space-y-4">
        <div v-for="(status, key) in stepStatuses" :key="key" class="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
          <div class="flex items-center">
            <i :class="['text-2xl mr-4', status.ready ? 'pi pi-check-circle text-green-400' : 'pi pi-times-circle text-red-400']"></i>
            <div>
              <h4 class="text-white font-medium">{{ status.title }}</h4>
              <p class="text-sm text-gray-400">{{ status.description }}</p>
            </div>
          </div>
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium',
              status.ready ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            ]"
          >
            {{ status.ready ? 'Complete' : 'Incomplete' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Blockers -->
    <div v-if="readiness.blockers.length > 0" class="mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-ban mr-2"></i>
        Blocking Issues ({{ readiness.blockers.length }})
      </h3>

      <div class="space-y-3">
        <div v-for="blocker in readiness.blockers" :key="blocker.id" class="glass-effect rounded-xl p-6" :class="getBlockerClass(blocker.severity)">
          <div class="flex items-start">
            <i :class="['text-2xl mt-1 mr-4', getBlockerIcon(blocker.severity)]"></i>
            <div class="flex-1">
              <div class="flex items-start justify-between mb-2">
                <h4 class="text-lg font-semibold" :class="getBlockerTextClass(blocker.severity)">
                  {{ blocker.title }}
                </h4>
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium uppercase ml-4',
                    getBlockerBadgeClass(blocker.severity)
                  ]"
                >
                  {{ blocker.severity }}
                </span>
              </div>
              <p class="text-sm text-gray-300 mb-3">{{ blocker.description }}</p>
              
              <div class="bg-gray-900/50 rounded-lg p-4">
                <p class="text-sm font-medium text-white mb-2">
                  <i class="pi pi-wrench mr-2"></i>
                  How to Fix:
                </p>
                <ul class="space-y-1">
                  <li v-for="(step, index) in blocker.remediationSteps" :key="index" class="text-sm text-gray-300 flex items-start">
                    <span class="text-biatec-accent mr-2">{{ index + 1 }}.</span>
                    <span>{{ step }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="blocker.relatedStepId" class="mt-4">
                <button
                  type="button"
                  class="px-4 py-2 bg-biatec-accent hover:bg-biatec-accent/90 text-white rounded-lg transition-colors text-sm"
                  @click="$emit('go-to-step', blocker.relatedStepId)"
                >
                  <i class="pi pi-arrow-right mr-2"></i>
                  Go to {{ getStepTitle(blocker.relatedStepId) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="readiness.warnings.length > 0" class="mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        Warnings ({{ readiness.warnings.length }})
      </h3>

      <div class="space-y-3">
        <div v-for="warning in readiness.warnings" :key="warning.field" class="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <div class="flex items-start">
            <i class="pi pi-exclamation-triangle text-yellow-400 mt-1 mr-3"></i>
            <div>
              <p class="text-yellow-300 font-medium">{{ warning.message }}</p>
              <p class="text-yellow-200/80 text-sm mt-1">{{ warning.recommendation }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Next Actions -->
    <div v-if="readiness.nextActions.length > 0" class="glass-effect rounded-xl p-6 mb-6">
      <h3 class="text-xl font-semibold text-white mb-4">
        <i class="pi pi-arrow-circle-right mr-2"></i>
        Recommended Next Actions
      </h3>

      <div class="space-y-3">
        <div v-for="action in readiness.nextActions" :key="action.id" class="flex items-start p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-medium uppercase mr-3',
                  getPriorityClass(action.priority)
                ]"
              >
                {{ action.priority }}
              </span>
              <h4 class="text-white font-medium">{{ action.title }}</h4>
            </div>
            <p class="text-sm text-gray-400 mb-2">{{ action.description }}</p>
            <div class="flex items-center text-xs text-gray-500">
              <i class="pi pi-clock mr-1"></i>
              <span>Est. {{ action.estimatedMinutes }} minutes</span>
            </div>
          </div>
          <i class="pi pi-chevron-right text-gray-500 mt-2"></i>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div v-if="readiness.recommendations.length > 0" class="p-6 bg-blue-900/10 border border-blue-700/30 rounded-xl mb-6">
      <h4 class="text-lg font-semibold text-blue-300 mb-3">
        <i class="pi pi-lightbulb mr-2"></i>
        Recommendations
      </h4>
      <ul class="space-y-2 text-gray-300">
        <li v-for="(rec, index) in readiness.recommendations" :key="index" class="flex items-start">
          <i class="pi pi-check text-blue-400 mr-2 mt-1"></i>
          <span>{{ rec }}</span>
        </li>
      </ul>
    </div>

    <!-- Deploy Readiness -->
    <div v-if="readiness.isReadyForDeploy" class="glass-effect rounded-xl p-8 text-center bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/50">
      <i class="pi pi-check-circle text-6xl text-green-400 mb-4"></i>
      <h3 class="text-2xl font-semibold text-green-300 mb-3">
        Ready for Deployment
      </h3>
      <p class="text-gray-200 mb-6 max-w-2xl mx-auto">
        Your compliance configuration is complete and ready for token deployment. You may proceed with confidence.
      </p>
      <button
        type="button"
        class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
        @click="$emit('proceed-to-deploy')"
      >
        <i class="pi pi-rocket mr-2"></i>
        Proceed to Deploy
      </button>
    </div>

    <!-- Why This Matters -->
    <div class="p-6 bg-blue-900/10 border border-blue-700/30 rounded-xl">
      <h4 class="text-lg font-semibold text-blue-300 mb-3">
        <i class="pi pi-lightbulb mr-2"></i>
        Why This Matters
      </h4>
      <p class="text-gray-300 leading-relaxed mb-3">
        A thorough readiness review helps you:
      </p>
      <ul class="space-y-2 text-gray-300">
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Avoid costly compliance mistakes and regulatory penalties</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Launch with confidence knowing you meet all requirements</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Build trust with investors and partners from day one</span>
        </li>
        <li class="flex items-start">
          <i class="pi pi-check text-green-400 mr-2 mt-1"></i>
          <span>Position your token for long-term success and institutional adoption</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReadinessAssessment } from '../../types/complianceSetup'

interface Props {
  readiness: ReadinessAssessment
}

interface Emits {
  (e: 'go-to-step', stepId: string): void
  (e: 'proceed-to-deploy'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Readiness score styling
const readinessScoreClass = computed(() => {
  const score = props.readiness.readinessScore
  if (score >= 80) return 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/50'
  if (score >= 50) return 'bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-700/50'
  return 'bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-700/50'
})

const readinessScoreBgClass = computed(() => {
  const score = props.readiness.readinessScore
  if (score >= 80) return 'bg-green-900/30 border-2 border-green-700'
  if (score >= 50) return 'bg-yellow-900/30 border-2 border-yellow-700'
  return 'bg-red-900/30 border-2 border-red-700'
})

const readinessScoreTextClass = computed(() => {
  const score = props.readiness.readinessScore
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
})

const readinessStatusText = computed(() => {
  const score = props.readiness.readinessScore
  if (score >= 80) return 'Excellent Readiness'
  if (score >= 50) return 'Partially Ready'
  return 'Needs Attention'
})

const readinessDescription = computed(() => {
  const score = props.readiness.readinessScore
  if (score >= 80) return 'Your compliance configuration is comprehensive and ready for deployment.'
  if (score >= 50) return 'Your compliance configuration is partially complete. Address warnings to improve readiness.'
  return 'Your compliance configuration has critical gaps. Please resolve blockers before deployment.'
})

// Risk level styling
const riskLevelColor = computed(() => {
  const risk = props.readiness.overallRisk
  if (risk === 'none' || risk === 'low') return 'text-green-400'
  if (risk === 'medium') return 'text-yellow-400'
  return 'text-red-400'
})

// Step statuses
const stepStatuses = computed(() => ({
  jurisdiction: {
    title: 'Jurisdiction & Policy',
    description: 'Issuer location and distribution rules configured',
    ready: props.readiness.jurisdictionReady,
  },
  whitelist: {
    title: 'Whitelist & Eligibility',
    description: 'Investor eligibility and access restrictions defined',
    ready: props.readiness.whitelistReady,
  },
  kycAml: {
    title: 'KYC/AML Readiness',
    description: 'Identity verification providers configured',
    ready: props.readiness.kycAMLReady,
  },
  attestation: {
    title: 'Attestation & Evidence',
    description: 'Compliance attestations and supporting evidence provided',
    ready: props.readiness.attestationReady,
  },
}))

// Blocker styling functions
const getBlockerClass = (severity: string): string => {
  if (severity === 'critical') return 'border-red-700 bg-red-900/10'
  if (severity === 'high') return 'border-orange-700 bg-orange-900/10'
  if (severity === 'medium') return 'border-yellow-700 bg-yellow-900/10'
  return 'border-blue-700 bg-blue-900/10'
}

const getBlockerIcon = (severity: string): string => {
  if (severity === 'critical' || severity === 'high') return 'pi pi-times-circle text-red-400'
  if (severity === 'medium') return 'pi pi-exclamation-triangle text-yellow-400'
  return 'pi pi-info-circle text-blue-400'
}

const getBlockerTextClass = (severity: string): string => {
  if (severity === 'critical') return 'text-red-300'
  if (severity === 'high') return 'text-orange-300'
  if (severity === 'medium') return 'text-yellow-300'
  return 'text-blue-300'
}

const getBlockerBadgeClass = (severity: string): string => {
  if (severity === 'critical') return 'bg-red-900/30 text-red-400'
  if (severity === 'high') return 'bg-orange-900/30 text-orange-400'
  if (severity === 'medium') return 'bg-yellow-900/30 text-yellow-400'
  return 'bg-blue-900/30 text-blue-400'
}

const getPriorityClass = (priority: string): string => {
  if (priority === 'critical') return 'bg-red-900/30 text-red-400'
  if (priority === 'high') return 'bg-orange-900/30 text-orange-400'
  if (priority === 'medium') return 'bg-yellow-900/30 text-yellow-400'
  return 'bg-blue-900/30 text-blue-400'
}

const getStepTitle = (stepId: string): string => {
  const titles: Record<string, string> = {
    jurisdiction: 'Jurisdiction & Policy',
    whitelist: 'Whitelist & Eligibility',
    kyc_aml: 'KYC/AML Readiness',
    attestation: 'Attestation & Evidence',
  }
  return titles[stepId] || 'Step'
}
</script>

<style scoped>
.readiness-summary-step {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
