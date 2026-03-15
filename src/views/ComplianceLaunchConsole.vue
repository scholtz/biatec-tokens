<template>
  <MainLayout>
  <!-- Secondary in-page skip link to console content (WCAG 2.4.1) -->
  <a
    href="#console-main"
    class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus-visible:ring-2 focus-visible:ring-blue-400"
  >
    Skip to main content
  </a>
  <div
    id="console-main"
    role="region"
    aria-label="Compliance Launch Console"
    class="compliance-launch-console min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    data-testid="compliance-launch-console"
  >
    <div class="max-w-5xl mx-auto">

      <!-- ── Page Header ── -->
      <header class="mb-8" data-testid="console-header">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="flex items-start gap-3">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <ShieldCheckIcon class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1
                class="text-3xl font-bold text-white"
                data-testid="console-heading"
              >
                Compliance Launch Console
              </h1>
              <p class="text-gray-300 text-sm mt-1">
                Complete your compliance readiness before deploying a regulated token.
              </p>
            </div>
          </div>

          <!-- Last checked timestamp -->
          <div
            class="flex-shrink-0 text-xs text-gray-300 sm:text-right mt-1"
            data-testid="last-checked"
            aria-label="Last readiness check time"
          >
            Last checked: {{ formattedLastChecked }}
          </div>
        </div>
      </header>

      <!-- ── Launch Readiness Banner ── -->
      <section
        class="bg-gray-800 rounded-2xl p-6 mb-6 border shadow-lg"
        :class="bannerBorderClass"
        aria-labelledby="readiness-banner-heading"
        data-testid="readiness-banner"
        role="region"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <!-- Readiness score ring -->
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 border-4"
              :class="scoreRingClass"
              :aria-label="`Readiness score: ${readiness.readinessScore} out of 100`"
              role="meter"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="readiness.readinessScore"
              data-testid="readiness-score"
            >
              {{ readiness.readinessScore }}
            </div>

            <div>
              <h2
                id="readiness-banner-heading"
                class="text-lg font-semibold text-white"
                data-testid="gate-state-label"
              >
                {{ GATE_STATE_LABELS[readiness.gate] }}
              </h2>
              <p
                class="text-sm text-gray-300 mt-0.5"
                data-testid="gate-state-description"
                aria-live="polite"
              >
                {{ gateStateDescription }}
              </p>

              <!-- Blocker count badge -->
              <div
                v-if="readiness.totalBlockers > 0"
                class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-red-800 text-xs font-medium text-white"
                role="status"
                :aria-label="`${readiness.totalBlockers} blocker${readiness.totalBlockers > 1 ? 's' : ''} must be resolved`"
                data-testid="blocker-count-badge"
              >
                <ExclamationCircleIcon class="w-3.5 h-3.5" aria-hidden="true" />
                {{ readiness.totalBlockers }} blocker{{ readiness.totalBlockers > 1 ? 's' : '' }} to resolve
              </div>
            </div>
          </div>

          <!-- Primary CTA -->
          <div class="flex-shrink-0" data-testid="primary-cta-container">
            <button
              v-if="readiness.primaryAction !== 'launch_token'"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              :class="primaryCtaClass"
              :aria-label="primaryCtaAriaLabel"
              data-testid="primary-cta-button"
              @click="handlePrimaryCta"
            >
              <component :is="primaryCtaIcon" class="w-5 h-5" aria-hidden="true" />
              {{ PRIMARY_ACTION_LABELS[readiness.primaryAction] }}
            </button>

            <button
              v-else
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 shadow-lg shadow-green-900/30"
              aria-label="Launch Token — all compliance requirements are met"
              data-testid="launch-token-button"
              @click="handleLaunchToken"
            >
              <RocketLaunchIcon class="w-5 h-5" aria-hidden="true" />
              {{ PRIMARY_ACTION_LABELS['launch_token'] }}
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mt-5">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs text-gray-300">Compliance readiness</span>
            <span class="text-xs font-medium" :class="scoreTextClass" data-testid="readiness-percent">
              {{ readiness.readinessScore }}%
            </span>
          </div>
          <div
            class="w-full bg-gray-700 rounded-full h-2"
            role="progressbar"
            :aria-valuenow="readiness.readinessScore"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`Overall compliance readiness: ${readiness.readinessScore}% complete`"
            data-testid="readiness-progress-bar"
          >
            <div
              class="h-2 rounded-full transition-all duration-700"
              :class="progressBarClass"
              :style="{ width: `${readiness.readinessScore}%` }"
            ></div>
          </div>
        </div>
      </section>

      <!-- ── Domain Status Cards ── -->
      <section
        aria-labelledby="domains-heading"
        data-testid="domains-section"
      >
        <h2
          id="domains-heading"
          class="text-base font-semibold text-gray-300 mb-4"
        >
          Compliance Domains
        </h2>

        <div class="grid grid-cols-1 gap-4">
          <article
            v-for="domain in readiness.domains"
            :key="domain.id"
            class="bg-gray-800 rounded-xl border shadow-md transition-shadow duration-200"
            :class="domainCardBorderClass(domain.status)"
            :data-testid="`domain-card-${domain.id}`"
            :aria-label="`${domain.label}: ${DOMAIN_STATUS_LABELS[domain.status]}`"
          >
            <!-- Card header (always visible) -->
            <div
              class="flex items-center justify-between p-4 cursor-pointer select-none"
              :data-testid="`domain-header-${domain.id}`"
              @click="toggleDomain(domain.id)"
            >
              <div class="flex items-center gap-3 min-w-0">
                <!-- Status icon -->
                <span
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="domainIconContainerClass(domain.status)"
                  aria-hidden="true"
                >
                  <CheckCircleIcon v-if="domain.status === 'ready'" class="w-4.5 h-4.5" />
                  <ExclamationCircleIcon v-else-if="domain.status === 'blocked'" class="w-4.5 h-4.5" />
                  <ExclamationTriangleIcon v-else-if="domain.status === 'needs_attention'" class="w-4.5 h-4.5" />
                  <MinusCircleIcon v-else class="w-4.5 h-4.5" />
                </span>

                <div class="min-w-0">
                  <h3 class="text-sm font-semibold text-white truncate" :data-testid="`domain-label-${domain.id}`">
                    {{ domain.label }}
                  </h3>
                  <p class="text-xs text-gray-300 mt-0.5 line-clamp-1">{{ domain.description }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 flex-shrink-0 ml-3">
                <!-- Status badge -->
                <span
                  class="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="domainStatusBadgeClass(domain.status)"
                  :aria-label="`Status: ${DOMAIN_STATUS_LABELS[domain.status]}`"
                  :data-testid="`domain-status-badge-${domain.id}`"
                >
                  {{ DOMAIN_STATUS_LABELS[domain.status] }}
                </span>

                <!-- Expand/collapse chevron -->
                <ChevronDownIcon
                  class="w-4 h-4 text-gray-500 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedDomains.has(domain.id) }"
                  aria-hidden="true"
                />
              </div>
            </div>

            <!-- Expanded blocker detail panel -->
            <div
              v-if="expandedDomains.has(domain.id)"
              class="border-t px-4 pb-4"
              :class="domainExpandBorderClass(domain.status)"
              :data-testid="`domain-detail-${domain.id}`"
              role="region"
              :aria-label="`${domain.label} details`"
            >
              <!-- No blockers state -->
              <div
                v-if="domain.blockers.length === 0 && domain.status !== 'not_started'"
                class="pt-4 flex items-center gap-2 text-sm text-green-400"
                data-testid="no-blockers-message"
              >
                <CheckCircleIcon class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                No blockers — this domain is on track.
              </div>

              <!-- Not started state -->
              <div
                v-else-if="domain.status === 'not_started'"
                class="pt-4"
                data-testid="not-started-guidance"
              >
                <p class="text-sm text-gray-300">
                  This domain has not been configured yet.
                  {{ domain.estimatedMinutes ? `Estimated time: ${domain.estimatedMinutes} minutes.` : '' }}
                </p>
                <router-link
                  :to="domain.deepLink"
                  class="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-700/50 text-blue-300 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  :data-testid="`domain-setup-link-${domain.id}`"
                  @click="emitDomainAnalytics(domain)"
                >
                  <ArrowRightIcon class="w-4 h-4" aria-hidden="true" />
                  Start {{ domain.label }}
                </router-link>
              </div>

              <!-- Blocker list -->
              <ul
                v-else-if="domain.blockers.length > 0"
                class="pt-4 space-y-4"
                role="list"
                :aria-label="`Blockers for ${domain.label}`"
              >
                <li
                  v-for="blocker in domain.blockers"
                  :key="blocker.id"
                  class="rounded-xl p-4 border"
                  :class="blockerCardClass(blocker.severity)"
                  :data-testid="`blocker-${blocker.id}`"
                >
                  <!-- What happened -->
                  <p class="text-sm font-semibold text-white mb-1" :data-testid="`blocker-what-${blocker.id}`">
                    {{ blocker.what }}
                  </p>

                  <!-- Why this matters -->
                  <div class="mb-2">
                    <span class="text-xs font-medium text-gray-300 uppercase tracking-wide">Why this matters</span>
                    <p class="text-sm text-gray-300 mt-0.5" :data-testid="`blocker-why-${blocker.id}`">
                      {{ blocker.why }}
                    </p>
                  </div>

                  <!-- How to fix -->
                  <div class="mb-3">
                    <span class="text-xs font-medium text-gray-300 uppercase tracking-wide">How to fix</span>
                    <p class="text-sm text-gray-300 mt-0.5" :data-testid="`blocker-how-${blocker.id}`">
                      {{ blocker.how }}
                    </p>
                  </div>

                  <!-- Remediation link -->
                  <router-link
                    :to="blocker.deepLink"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                    :class="blockerLinkClass(blocker.severity)"
                    :data-testid="`blocker-link-${blocker.id}`"
                    @click="emitBlockerAnalytics(domain, blocker)"
                  >
                    Fix this now
                    <ArrowRightIcon class="w-3.5 h-3.5" aria-hidden="true" />
                  </router-link>
                </li>
              </ul>

              <!-- Ready domain with no blockers -->
              <div
                v-else-if="domain.status === 'ready'"
                class="pt-4 flex items-start gap-3"
                data-testid="ready-domain-summary"
              >
                <CheckCircleIcon class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p class="text-sm font-medium text-green-300">Domain complete</p>
                  <p class="text-xs text-gray-300 mt-0.5">
                    {{ domain.description }}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- ── Evidence & Review Summary ── -->
      <footer
        class="mt-8 bg-gray-800 rounded-xl border border-white/10 p-5 shadow-md"
        data-testid="evidence-summary"
        role="contentinfo"
        aria-label="Compliance review summary"
      >
        <h2 class="text-sm font-semibold text-gray-300 mb-3">Review Summary</h2>
        <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <dt class="text-xs text-gray-300">Total Domains</dt>
            <dd class="text-lg font-bold text-white mt-0.5" data-testid="summary-total-domains">
              {{ readiness.domains.length }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-300">Ready</dt>
            <dd class="text-lg font-bold text-green-400 mt-0.5" data-testid="summary-ready-count">
              {{ readyCount }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-300">Blockers</dt>
            <dd class="text-lg font-bold text-red-400 mt-0.5" data-testid="summary-blocker-count">
              {{ readiness.totalBlockers }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-300">Readiness Score</dt>
            <dd class="text-lg font-bold mt-0.5" :class="scoreTextClass" data-testid="summary-score">
              {{ readiness.readinessScore }}%
            </dd>
          </div>
        </dl>

        <div class="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-gray-300">
            Last assessment: {{ formattedLastChecked }}
          </p>
          <router-link
            to="/compliance/setup"
            class="inline-flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
            data-testid="open-full-setup-link"
          >
            Open full compliance setup
            <ArrowRightIcon class="w-3.5 h-3.5" aria-hidden="true" />
          </router-link>
          <router-link
            to="/compliance/reporting"
            class="inline-flex items-center gap-2 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
            data-testid="reporting-workspace-link"
          >
            View Full Compliance Report
            <ArrowRightIcon class="w-3.5 h-3.5" aria-hidden="true" />
          </router-link>
        </div>
      </footer>

    </div>
  </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import {
  ShieldCheckIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  PlayIcon,
} from '@heroicons/vue/24/outline'
import { useComplianceSetupStore } from '../stores/complianceSetup'
import {
  deriveReadinessModel,
  buildComplianceAnalyticsEvent,
  dispatchComplianceAnalytics,
  PRIMARY_ACTION_LABELS,
  GATE_STATE_LABELS,
  DOMAIN_STATUS_LABELS,
  blockerSeverityCardClass,
  blockerSeverityLinkClass,
} from '../utils/complianceLaunchReadiness'
import type {
  LaunchReadinessDomain,
  BlockerDetail,
  DomainStatus,
} from '../utils/complianceLaunchReadiness'

// ---------------------------------------------------------------------------
// Store & router
// ---------------------------------------------------------------------------
const complianceStore = useComplianceSetupStore()
const router = useRouter()

// ---------------------------------------------------------------------------
// Reactive state
// ---------------------------------------------------------------------------
/** Track which domain cards are expanded. */
const expandedDomains = ref<Set<string>>(new Set())

// ---------------------------------------------------------------------------
// Derived readiness model
// ---------------------------------------------------------------------------
const readiness = computed(() =>
  deriveReadinessModel(
    complianceStore.currentForm.steps,
    complianceStore.calculateReadiness,
  ),
)

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
const formattedLastChecked = computed(() => {
  try {
    return readiness.value.lastChecked.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
})

const readyCount = computed(
  () => readiness.value.domains.filter((d) => d.status === 'ready').length,
)

const gateStateDescription = computed(() => {
  switch (readiness.value.gate) {
    case 'not_started':
      return 'Begin your compliance review to unlock deployment.'
    case 'in_review':
      return 'Review in progress — complete remaining domains to proceed.'
    case 'blocked':
      return `${readiness.value.totalBlockers} blocker${readiness.value.totalBlockers > 1 ? 's' : ''} must be resolved before you can launch.`
    case 'ready':
      return 'All compliance requirements are met. You may proceed to launch.'
    default:
      return ''
  }
})

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------
const bannerBorderClass = computed(() => {
  switch (readiness.value.gate) {
    case 'ready':
      return 'border-green-700/50'
    case 'blocked':
      return 'border-red-700/50'
    case 'in_review':
      return 'border-yellow-700/50'
    default:
      return 'border-white/10'
  }
})

const scoreRingClass = computed(() => {
  const score = readiness.value.readinessScore
  if (score >= 80) return 'border-green-500 text-green-200 bg-green-800'
  if (score >= 60) return 'border-yellow-500 text-yellow-200 bg-yellow-800'
  if (score > 0) return 'border-red-500 text-red-200 bg-red-800'
  return 'border-gray-600 text-gray-300 bg-gray-800'
})

const scoreTextClass = computed(() => {
  const score = readiness.value.readinessScore
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score > 0) return 'text-red-400'
  return 'text-gray-400'
})

const progressBarClass = computed(() => {
  const score = readiness.value.readinessScore
  if (score >= 80) return 'bg-gradient-to-r from-green-500 to-teal-500'
  if (score >= 60) return 'bg-gradient-to-r from-yellow-500 to-amber-500'
  if (score > 0) return 'bg-gradient-to-r from-red-500 to-orange-500'
  return 'bg-gray-600'
})

const primaryCtaClass = computed(() => {
  if (readiness.value.primaryAction === 'start_review') {
    return 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-400'
  }
  return 'bg-amber-600 hover:bg-amber-500 text-white focus-visible:ring-amber-400'
})

const primaryCtaIcon = computed(() => {
  if (readiness.value.primaryAction === 'start_review') return PlayIcon
  return ExclamationCircleIcon
})

const primaryCtaAriaLabel = computed(() => {
  if (readiness.value.primaryAction === 'start_review') {
    return 'Start Compliance Review — begin completing compliance domains'
  }
  return `Resolve ${readiness.value.totalBlockers} blocker${readiness.value.totalBlockers > 1 ? 's' : ''} before launch`
})

function domainCardBorderClass(status: DomainStatus): string {
  switch (status) {
    case 'ready':
      return 'border-green-800/50'
    case 'blocked':
      return 'border-red-800/50'
    case 'needs_attention':
      return 'border-yellow-800/50'
    default:
      return 'border-white/10'
  }
}

function domainIconContainerClass(status: DomainStatus): string {
  switch (status) {
    case 'ready':
      return 'bg-green-800 text-green-100'
    case 'blocked':
      return 'bg-red-800 text-white'
    case 'needs_attention':
      return 'bg-yellow-800 text-yellow-100'
    default:
      return 'bg-gray-700 text-gray-400'
  }
}

function domainStatusBadgeClass(status: DomainStatus): string {
  switch (status) {
    case 'ready':
      return 'bg-green-800 text-white'
    case 'blocked':
      return 'bg-red-800 text-white'
    case 'needs_attention':
      return 'bg-yellow-800 text-white'
    default:
      return 'bg-gray-800 text-gray-400 border border-gray-700'
  }
}

function domainExpandBorderClass(status: DomainStatus): string {
  switch (status) {
    case 'ready':
      return 'border-green-900/40'
    case 'blocked':
      return 'border-red-900/40'
    case 'needs_attention':
      return 'border-yellow-900/40'
    default:
      return 'border-white/10'
  }
}

function blockerCardClass(severity: BlockerDetail['severity']): string {
  return blockerSeverityCardClass(severity)
}

function blockerLinkClass(severity: BlockerDetail['severity']): string {
  return blockerSeverityLinkClass(severity)
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

function toggleDomain(domainId: string): void {
  if (expandedDomains.value.has(domainId)) {
    expandedDomains.value.delete(domainId)
  } else {
    expandedDomains.value.add(domainId)
    // Emit analytics when a user opens a blocker detail
    const domain = readiness.value.domains.find((d) => d.id === domainId)
    if (domain && domain.blockers.length > 0) {
      dispatchComplianceAnalytics(
        buildComplianceAnalyticsEvent('compliance_blocker_opened', readiness.value, {
          domainId,
        }),
      )
    }
  }
}

function handlePrimaryCta(): void {
  router.push('/compliance/setup')
}

function handleLaunchToken(): void {
  dispatchComplianceAnalytics(
    buildComplianceAnalyticsEvent('compliance_launch_attempted', readiness.value),
  )
  router.push('/launch/guided')
}

function emitDomainAnalytics(domain: LaunchReadinessDomain): void {
  dispatchComplianceAnalytics(
    buildComplianceAnalyticsEvent('compliance_blocker_opened', readiness.value, {
      domainId: domain.id,
    }),
  )
}

function emitBlockerAnalytics(domain: LaunchReadinessDomain, blocker: BlockerDetail): void {
  dispatchComplianceAnalytics(
    buildComplianceAnalyticsEvent('compliance_blocker_resolved', readiness.value, {
      domainId: domain.id,
      blockerId: blocker.id,
    }),
  )
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  // Load persisted compliance draft so readiness derives from real state
  complianceStore.loadDraft()

  // Emit view analytics
  dispatchComplianceAnalytics(
    buildComplianceAnalyticsEvent('compliance_console_viewed', readiness.value),
  )
})
</script>
