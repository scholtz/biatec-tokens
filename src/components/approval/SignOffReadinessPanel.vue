<template>
  <!-- Strict Sign-Off Readiness Workspace -->
  <section
    aria-labelledby="sign-off-readiness-heading"
    data-testid="sign-off-readiness-panel"
    class="mt-8 rounded-2xl border bg-gray-900 overflow-hidden"
    :class="bannerBorderClass"
  >
    <!-- Panel header / overall summary banner -->
    <div
      class="flex items-start gap-4 px-6 py-5 border-b"
      :class="[bannerBgClass, bannerBorderClass]"
      data-testid="readiness-summary-banner"
      role="region"
      :aria-label="`Release readiness: ${SIGN_OFF_READINESS_LABELS[readiness.overallState]}`"
    >
      <!-- State icon -->
      <div
        class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        :class="bannerIconBgClass"
        aria-hidden="true"
      >
        <component :is="stateIcon" class="w-6 h-6 text-white" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 flex-wrap mb-1">
          <h2
            id="sign-off-readiness-heading"
            class="text-lg font-semibold text-white"
            data-testid="readiness-heading"
          >
            Strict Sign-Off Readiness
          </h2>

          <!-- Overall state badge -->
          <span
            class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
            :class="stateBadgeClass"
            :aria-label="`Overall readiness: ${SIGN_OFF_READINESS_LABELS[readiness.overallState]}`"
            role="status"
            data-testid="readiness-state-badge"
          >
            {{ SIGN_OFF_READINESS_LABELS[readiness.overallState] }}
          </span>
        </div>

        <!-- Headline -->
        <p
          class="text-sm font-medium"
          :class="bannerTextClass"
          data-testid="readiness-headline"
        >
          {{ readiness.headline }}
        </p>

        <!-- Rationale -->
        <p
          class="text-xs text-gray-400 mt-1"
          data-testid="readiness-rationale"
        >
          {{ readiness.rationale }}
        </p>
      </div>

      <!-- Stats panel -->
      <dl
        class="flex-shrink-0 flex items-start gap-5 text-right"
        aria-label="Sign-off readiness statistics"
        data-testid="readiness-stats"
      >
        <div class="flex flex-col">
          <dt class="text-xs text-gray-500">Blocking</dt>
          <dd
            class="text-xl font-bold"
            :class="readiness.launchBlockingCount > 0 ? 'text-red-400' : 'text-white'"
            :aria-label="`${readiness.launchBlockingCount} launch-blocking evidence gaps`"
            data-testid="readiness-blocking-count"
          >
            {{ readiness.launchBlockingCount }}
          </dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-xs text-gray-500">Stale</dt>
          <dd
            class="text-xl font-bold"
            :class="readiness.staleCount > 0 ? 'text-orange-400' : 'text-white'"
            :aria-label="`${readiness.staleCount} dimensions with stale evidence`"
            data-testid="readiness-stale-count"
          >
            {{ readiness.staleCount }}
          </dd>
        </div>
        <div v-if="readiness.missingConfigCount > 0" class="flex flex-col">
          <dt class="text-xs text-gray-500">Config gaps</dt>
          <dd
            class="text-xl font-bold text-yellow-400"
            :aria-label="`${readiness.missingConfigCount} missing required configuration items`"
            data-testid="readiness-config-count"
          >
            {{ readiness.missingConfigCount }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Last protected run bar -->
    <div
      class="flex items-center gap-2 px-6 py-3 border-b border-gray-700 bg-gray-850 text-xs"
      data-testid="last-run-bar"
    >
      <ClockIcon class="w-3.5 h-3.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
      <span class="text-gray-400">Last protected sign-off run:</span>
      <span
        class="font-medium"
        :class="lastRunLabelClass"
        data-testid="last-run-label"
        :aria-label="`Last protected sign-off evidence is ${readiness.lastProtectedRunLabel}`"
      >
        {{ readiness.lastProtectedRunLabel }}
      </span>
      <span
        v-if="readiness.lastRunSucceeded !== null"
        class="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold"
        :class="readiness.lastRunSucceeded ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'"
        :aria-label="`Last run status: ${readiness.lastRunSucceeded ? 'succeeded' : 'failed'}`"
        data-testid="last-run-status"
      >
        {{ readiness.lastRunSucceeded ? 'Succeeded' : 'Failed' }}
      </span>
      <span
        v-else
        class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-gray-700 text-gray-300"
        aria-label="Last run status: No run recorded"
        data-testid="last-run-status"
      >
        No run recorded
      </span>
    </div>

    <!-- Configuration blocked alert -->
    <div
      v-if="readiness.missingConfigCount > 0"
      class="mx-6 mt-5 rounded-xl border border-yellow-700 bg-yellow-950 px-4 py-3 flex items-start gap-3"
      role="alert"
      aria-label="Configuration dependency alert"
      data-testid="config-blocked-alert"
    >
      <ExclamationTriangleIcon class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-yellow-300">
          Configuration Blocked — Protected Run Cannot Execute
        </p>
        <p class="text-xs text-gray-300 mt-1">
          {{ readiness.missingConfigCount }} required environment
          {{ readiness.missingConfigCount === 1 ? 'dependency is' : 'dependencies are' }} not
          configured. The strict sign-off lane will not run until these are resolved. This is an
          operational gap, not a missing product feature.
        </p>

        <!-- Config dependency list -->
        <ul
          class="mt-3 space-y-1.5"
          aria-label="Missing configuration dependencies"
          data-testid="config-dep-list"
        >
          <li
            v-for="dep in blockedConfigDeps"
            :key="dep.id"
            class="flex items-start gap-2 text-xs"
            :data-testid="`config-dep-${dep.id}`"
          >
            <XCircleIcon class="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span class="font-medium text-yellow-200">{{ dep.label }}</span>
              <span class="text-gray-400 ml-1">— {{ dep.description }}</span>
              <span
                class="ml-1 text-gray-500"
                :aria-label="`Owner: ${dep.ownerDomain}`"
              >
                (Owned by: {{ ownerDomainDisplayName(dep.ownerDomain) }})
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Evidence dimensions grid -->
    <div class="p-6 pt-5">
      <h3
        class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4"
        id="evidence-dimensions-heading"
        data-testid="dimensions-heading"
      >
        Evidence Dimensions
      </h3>

      <ul
        class="space-y-3"
        aria-labelledby="evidence-dimensions-heading"
        data-testid="dimensions-list"
        role="list"
      >
        <li
          v-for="dim in readiness.dimensions"
          :key="dim.id"
          class="rounded-xl border p-4"
          :class="[dimensionBorderClass(dim.state), dimensionBgClass(dim.state)]"
          :data-testid="`dimension-card-${dim.id}`"
        >
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Dimension title -->
              <span
                class="text-sm font-semibold text-white"
                :data-testid="`dimension-title-${dim.id}`"
              >
                {{ dim.title }}
              </span>

              <!-- Launch-critical badge -->
              <span
                v-if="dim.isLaunchCritical"
                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-red-800 text-red-200"
                aria-label="Launch-critical dimension"
                :data-testid="`dimension-critical-badge-${dim.id}`"
              >
                Launch-Critical
              </span>

              <!-- State badge -->
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
                :class="stateBadgeFor(dim.state)"
                :aria-label="`Evidence state: ${SIGN_OFF_READINESS_LABELS[dim.state]}`"
                :data-testid="`dimension-state-${dim.id}`"
              >
                {{ SIGN_OFF_READINESS_LABELS[dim.state] }}
              </span>
            </div>

            <!-- Freshness label -->
            <span
              class="text-xs text-gray-400 flex-shrink-0"
              :aria-label="`Evidence age: ${dim.freshnessLabel}`"
              :data-testid="`dimension-freshness-${dim.id}`"
            >
              <ClockIcon class="w-3 h-3 inline mr-0.5" aria-hidden="true" />
              {{ dim.freshnessLabel }}
            </span>
          </div>

          <p
            class="text-xs text-gray-400 mt-2"
            :data-testid="`dimension-description-${dim.id}`"
          >
            {{ dim.description }}
          </p>

          <!-- Next action hint -->
          <div class="flex items-start justify-between gap-3 mt-2 flex-wrap">
            <p
              class="text-xs text-gray-300 flex items-start gap-1"
              :data-testid="`dimension-action-${dim.id}`"
            >
              <ArrowRightIcon class="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-500" aria-hidden="true" />
              {{ dim.nextActionSummary }}
            </p>

            <RouterLink
              v-if="dim.evidencePath && dim.state !== 'ready'"
              :to="dim.evidencePath"
              class="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded flex-shrink-0"
              :aria-label="`Open evidence workspace for: ${dim.title}`"
              :data-testid="`dimension-link-${dim.id}`"
            >
              <ArrowTopRightOnSquareIcon class="w-3 h-3" aria-hidden="true" />
              View evidence
            </RouterLink>
          </div>
        </li>
      </ul>
    </div>

    <!-- Next actions section -->
    <div
      v-if="readiness.nextActions.length > 0"
      class="px-6 pb-5 border-t border-gray-700 pt-5"
      data-testid="next-actions-section"
    >
      <h3
        class="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4"
        id="next-actions-heading"
        data-testid="next-actions-heading"
      >
        Next Actions
      </h3>

      <ol
        class="space-y-3"
        aria-labelledby="next-actions-heading"
        data-testid="next-actions-list"
      >
        <li
          v-for="(action, idx) in readiness.nextActions"
          :key="action.id"
          class="rounded-xl border p-4 flex items-start gap-3"
          :class="action.isLaunchBlocking ? 'border-red-800 bg-red-950' : 'border-gray-700 bg-gray-850'"
          :data-testid="`next-action-${action.id}`"
          :aria-label="`Step ${idx + 1}: ${action.summary}`"
        >
          <!-- Step number -->
          <span
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
            :class="action.isLaunchBlocking ? 'bg-red-700 text-red-100' : 'bg-gray-700 text-gray-200'"
            aria-hidden="true"
          >
            {{ idx + 1 }}
          </span>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span
                class="text-sm font-semibold text-white"
                :data-testid="`next-action-title-${action.id}`"
              >
                {{ action.summary }}
              </span>

              <!-- Blocking badge -->
              <span
                v-if="action.isLaunchBlocking"
                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-red-800 text-red-200"
                aria-label="This action is launch-blocking"
                :data-testid="`next-action-blocking-${action.id}`"
              >
                Launch-Blocking
              </span>

              <!-- Owner domain badge -->
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-gray-700 text-gray-300"
                :aria-label="`Action owner: ${OWNER_DOMAIN_NEXT_ACTION_LABELS[action.ownerDomain]}`"
                :data-testid="`next-action-owner-${action.id}`"
              >
                {{ ownerDomainDisplayName(action.ownerDomain) }}
              </span>
            </div>

            <p
              class="text-xs text-gray-300"
              :data-testid="`next-action-explanation-${action.id}`"
            >
              {{ action.explanation }}
            </p>

            <RouterLink
              v-if="action.actionPath"
              :to="action.actionPath"
              class="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded mt-1.5"
              :aria-label="`Take action: ${action.summary}`"
              :data-testid="`next-action-link-${action.id}`"
            >
              <ArrowTopRightOnSquareIcon class="w-3 h-3" aria-hidden="true" />
              Take action
            </RouterLink>
          </div>
        </li>
      </ol>
    </div>

    <!-- Distinguishing notice: product vs evidence -->
    <div
      class="mx-6 mb-5 mt-2 rounded-xl border border-blue-800 bg-blue-950 px-4 py-3 flex items-start gap-3"
      role="note"
      aria-label="Product functionality versus release evidence notice"
      data-testid="product-vs-evidence-notice"
    >
      <InformationCircleIcon class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p class="text-xs font-semibold text-blue-300">
          Product Functionality Is Delivered — Evidence Is Pending
        </p>
        <p class="text-xs text-gray-400 mt-1">
          The Biatec Tokens platform features, compliance workflows, and approval tooling are
          implemented and operational. The sign-off evidence gaps above are operational proof
          requirements, not missing product behavior. Once the protected backend lane is configured
          and executed, these dimensions will resolve automatically.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

import type { ReleaseReadinessState, SignOffReadinessState } from '../../utils/releaseReadiness'
import {
  SIGN_OFF_READINESS_LABELS,
  OWNER_DOMAIN_NEXT_ACTION_LABELS,
  ownerDomainDisplayName,
  readinessStateBadgeClass,
  dimensionCardBorderClass,
  dimensionCardBgClass,
  readinessBannerClass,
  readinessBannerTextClass,
} from '../../utils/releaseReadiness'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const props = defineProps<{
  readiness: ReleaseReadinessState
}>()

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const blockedConfigDeps = computed(() =>
  props.readiness.configDependencies.filter((c) => !c.isConfigured && c.isRequired),
)

const bannerBorderClass = computed(() => {
  const combined = readinessBannerClass(props.readiness.overallState)
  return combined.split(' ').find((c) => c.startsWith('border-')) ?? 'border-gray-700'
})

const bannerBgClass = computed(() => {
  const combined = readinessBannerClass(props.readiness.overallState)
  return combined.split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-gray-850'
})

const bannerTextClass = computed(() =>
  readinessBannerTextClass(props.readiness.overallState),
)

const stateBadgeClass = computed(() =>
  readinessStateBadgeClass(props.readiness.overallState),
)

const bannerIconBgClass = computed(() => {
  switch (props.readiness.overallState) {
    case 'ready':
      return 'bg-green-700'
    case 'advisory_follow_up':
      return 'bg-teal-700'
    case 'stale_evidence':
      return 'bg-orange-700'
    case 'missing_evidence':
      return 'bg-red-700'
    case 'configuration_blocked':
      return 'bg-yellow-700'
  }
})

const stateIcon = computed(() => {
  switch (props.readiness.overallState) {
    case 'ready':
      return ShieldCheckIcon
    case 'advisory_follow_up':
      return ExclamationCircleIcon
    case 'stale_evidence':
      return ClockIcon
    case 'missing_evidence':
      return XCircleIcon
    case 'configuration_blocked':
      return ExclamationTriangleIcon
  }
})

const lastRunLabelClass = computed(() => {
  if (!props.readiness.lastProtectedRunAt) return 'text-red-400'
  return props.readiness.lastRunSucceeded ? 'text-green-400' : 'text-red-400'
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dimensionBorderClass(state: SignOffReadinessState): string {
  return dimensionCardBorderClass(state)
}

function dimensionBgClass(state: SignOffReadinessState): string {
  return dimensionCardBgClass(state)
}

function stateBadgeFor(state: SignOffReadinessState): string {
  return readinessStateBadgeClass(state)
}
</script>
