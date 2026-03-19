<script setup lang="ts">
/**
 * Release Evidence Center — Regulator-ready release sign-off workspace.
 *
 * A dedicated workspace that aggregates all release-readiness signals into one
 * operator-facing view for compliance leads, business approvers, and enterprise
 * operators.  Integrates:
 *
 *  1. Strict sign-off readiness hero (overall status + headline)
 *  2. Evidence artifact inventory (evidence dimensions by category)
 *  3. Environment diagnostics (configuration dependencies)
 *  4. Next actions / blockers panel (severity-ordered)
 *  5. Approval handoff summary
 *  6. Export action (download evidence summary)
 *
 * Product alignment:
 *  - Email/password authentication only — no wallet connector framing
 *  - Operator-friendly language, not CI/engineering jargon
 *  - Fail-closed: never implies readiness when protected evidence is absent
 *  - WCAG 2.1 AA: landmarks, headings, focus rings, non-color-only status, aria-live
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import SignOffReadinessPanel from '../components/approval/SignOffReadinessPanel.vue'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'
import {
  buildDefaultReleaseReadiness,
  RELEASE_CENTER_TEST_IDS,
  SIGN_OFF_READINESS_LABELS,
  OWNER_DOMAIN_DISPLAY_NAMES,
  dimensionCardBorderClass,
  dimensionCardBgClass,
  readinessStateBadgeClass,
  type ReleaseReadinessState,
  type SignOffReadinessState,
} from '../utils/releaseReadiness'
import {
  type EvidenceTruthClass,
  deriveFixtureTruthClass,
  evidenceTruthBannerClass,
  evidenceTruthTitleClass,
  evidenceTruthBodyClass,
  evidenceTruthBadgeClass,
  EVIDENCE_TRUTH_LABELS,
  EVIDENCE_TRUTH_DESCRIPTIONS,
  EVIDENCE_TRUTH_NEXT_ACTIONS,
  EVIDENCE_TRUTH_TEST_IDS,
  buildProvenanceLabel,
} from '../utils/evidenceTruthfulness'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const router = useRouter()
const isLoading = ref(true)
const isDegraded = ref(false)
const loadError = ref<string | null>(null)
const exportStatus = ref<'idle' | 'exporting' | 'success' | 'error'>('idle')
const lastRefreshed = ref<string | null>(null)
let exportResetTimeout: ReturnType<typeof setTimeout> | null = null

const readiness = ref<ReleaseReadinessState>(buildDefaultReleaseReadiness())
const evidenceTruthClass = ref<EvidenceTruthClass>('partial_hydration')

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const formattedRefreshedAt = computed(() => {
  if (!lastRefreshed.value) return 'Not yet refreshed'
  try {
    return new Date(lastRefreshed.value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return lastRefreshed.value
  }
})

const launchCriticalDimensions = computed(() =>
  readiness.value.dimensions.filter((d) => d.isLaunchCritical),
)

const advisoryDimensions = computed(() =>
  readiness.value.dimensions.filter((d) => !d.isLaunchCritical),
)

const requiredConfigDeps = computed(() =>
  readiness.value.configDependencies.filter((c) => c.isRequired),
)

const optionalConfigDeps = computed(() =>
  readiness.value.configDependencies.filter((c) => !c.isRequired),
)

const hasNextActions = computed(() => readiness.value.nextActions.length > 0)

const overallIsBlocking = computed(() => {
  const s = readiness.value.overallState
  return s === 'missing_evidence' || s === 'configuration_blocked' || s === 'stale_evidence'
})

const approvalHandoffReady = computed(
  () =>
    !overallIsBlocking.value &&
    readiness.value.launchBlockingCount === 0 &&
    readiness.value.missingConfigCount === 0,
)

const exportStatusMessage = computed(() => {
  switch (exportStatus.value) {
    case 'exporting':
      return 'Preparing evidence summary…'
    case 'success':
      return 'Evidence summary downloaded successfully.'
    case 'error':
      return 'Export failed — please try again.'
    default:
      return null
  }
})

// ---------------------------------------------------------------------------
// State icon helpers
// ---------------------------------------------------------------------------

function stateIcon(state: SignOffReadinessState) {
  switch (state) {
    case 'ready':
      return CheckCircleIcon
    case 'advisory_follow_up':
      return InformationCircleIcon
    case 'stale_evidence':
      return ExclamationTriangleIcon
    case 'missing_evidence':
      return XCircleIcon
    case 'configuration_blocked':
      return WrenchScrewdriverIcon
  }
}

function dimensionStateLabel(state: SignOffReadinessState): string {
  return SIGN_OFF_READINESS_LABELS[state]
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadData(): void {
  try {
    readiness.value = buildDefaultReleaseReadiness()
    isDegraded.value = false
    loadError.value = null
    evidenceTruthClass.value = deriveFixtureTruthClass(true)
  } catch (err) {
    isDegraded.value = true
    loadError.value = err instanceof Error ? err.message : 'Unknown error'
    evidenceTruthClass.value = 'unavailable'
  }
  lastRefreshed.value = new Date().toISOString()
}

function refresh(): void {
  isLoading.value = true
  setTimeout(() => {
    loadData()
    isLoading.value = false
  }, 300)
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function handleExport(): void {
  exportStatus.value = 'exporting'
  try {
    const summary = {
      exportedAt: new Date().toISOString(),
      overallState: readiness.value.overallState,
      headline: readiness.value.headline,
      rationale: readiness.value.rationale,
      launchBlockingCount: readiness.value.launchBlockingCount,
      staleCount: readiness.value.staleCount,
      missingConfigCount: readiness.value.missingConfigCount,
      lastProtectedRunAt: readiness.value.lastProtectedRunAt,
      lastRunSucceeded: readiness.value.lastRunSucceeded,
      dimensions: readiness.value.dimensions.map((d) => ({
        id: d.id,
        title: d.title,
        state: d.state,
        isLaunchCritical: d.isLaunchCritical,
        lastEvidenceAt: d.lastEvidenceAt,
        freshnessLabel: d.freshnessLabel,
        ownerDomain: d.ownerDomain,
        nextActionSummary: d.nextActionSummary,
      })),
      configDependencies: readiness.value.configDependencies.map((c) => ({
        id: c.id,
        label: c.label,
        isConfigured: c.isConfigured,
        isRequired: c.isRequired,
        ownerDomain: c.ownerDomain,
      })),
      nextActions: readiness.value.nextActions.map((a) => ({
        id: a.id,
        summary: a.summary,
        explanation: a.explanation,
        ownerDomain: a.ownerDomain,
        isLaunchBlocking: a.isLaunchBlocking,
      })),
    }
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `release-evidence-summary-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    exportStatus.value = 'success'
  } catch {
    exportStatus.value = 'error'
  }
  exportResetTimeout = setTimeout(() => {
    exportStatus.value = 'idle'
  }, 4000)
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

function navigateTo(path: string): void {
  if (path) router.push(path)
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  setTimeout(() => {
    loadData()
    isLoading.value = false
  }, 150)
})

onBeforeUnmount(() => {
  if (exportResetTimeout !== null) {
    clearTimeout(exportResetTimeout)
  }
})
</script>

<template>
  <MainLayout>
    <!-- Skip link (WCAG 2.4.1) -->
    <a
      href="#release-center-main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>

    <div
      id="release-center-main"
      role="region"
      aria-label="Release Evidence Center — sign-off readiness and regulator evidence"
      :data-testid="RELEASE_CENTER_TEST_IDS.ROOT"
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    >
      <div class="max-w-6xl mx-auto">

        <!-- ── Page Header ── -->
        <header class="mb-8" data-testid="release-center-header">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <ShieldCheckIcon class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  :data-testid="RELEASE_CENTER_TEST_IDS.HEADING"
                >
                  Release Evidence Center
                </h1>
                <p class="text-gray-300 text-sm mt-1">
                  Regulator-ready view of sign-off readiness, protected evidence, environment
                  diagnostics, and launch blockers for enterprise operators and approvers.
                </p>
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end gap-1 mt-1">
              <span
                class="text-xs text-gray-400"
                :data-testid="RELEASE_CENTER_TEST_IDS.REFRESHED_AT"
                :aria-label="`Evidence center last refreshed: ${formattedRefreshedAt}`"
              >
                Last refreshed: {{ formattedRefreshedAt }}
              </span>
              <button
                class="text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                :data-testid="RELEASE_CENTER_TEST_IDS.REFRESH_BTN"
                aria-label="Refresh release evidence center data"
                @click="refresh"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <!-- ── Loading State ── -->
        <div
          v-if="isLoading"
          class="flex items-center justify-center py-20"
          :data-testid="RELEASE_CENTER_TEST_IDS.LOADING"
          role="status"
          aria-label="Loading release evidence center"
          aria-live="polite"
        >
          <div class="text-center">
            <ArrowPathIcon class="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" aria-hidden="true" />
            <p class="text-gray-300 text-sm">Loading release evidence center…</p>
          </div>
        </div>

        <template v-else>

          <!-- ── Degraded Alert ── -->
          <div
            v-if="isDegraded"
            role="alert"
            aria-live="assertive"
            :data-testid="RELEASE_CENTER_TEST_IDS.DEGRADED_ALERT"
            class="rounded-xl border border-orange-700 bg-orange-950 p-5 mb-8 flex items-start gap-4"
          >
            <ExclamationTriangleIcon class="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p class="font-semibold text-orange-200">Release evidence center is operating in degraded mode</p>
              <p class="text-gray-300 text-sm mt-1">
                Some evidence data may be unavailable or incomplete. The view below reflects the
                best available information. Contact your platform administrator if this persists.
                <template v-if="loadError">
                  <span class="block mt-1 text-orange-300 font-mono text-xs">{{ loadError }}</span>
                </template>
              </p>
            </div>
          </div>

          <!-- ── Sign-Off Readiness Panel (hero) ── -->
          <div :data-testid="RELEASE_CENTER_TEST_IDS.READINESS_PANEL">
            <SignOffReadinessPanel :readiness="readiness" />
          </div>

          <!-- ── Evidence Truth Class Banner (AC #2 fail-closed) ── -->
          <div
            class="mt-6 mb-6 rounded-xl border p-4"
            :class="evidenceTruthBannerClass(evidenceTruthClass)"
            :data-testid="EVIDENCE_TRUTH_TEST_IDS.BANNER"
            role="status"
            aria-live="polite"
            :aria-label="`Evidence data source: ${EVIDENCE_TRUTH_LABELS[evidenceTruthClass]}`"
          >
            <div class="flex items-start gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <p class="text-sm font-semibold" :class="evidenceTruthTitleClass(evidenceTruthClass)" :data-testid="EVIDENCE_TRUTH_TEST_IDS.TITLE">
                    Data Provenance:
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ml-1"
                      :class="evidenceTruthBadgeClass(evidenceTruthClass)"
                      :data-testid="EVIDENCE_TRUTH_TEST_IDS.BADGE"
                    >{{ EVIDENCE_TRUTH_LABELS[evidenceTruthClass] }}</span>
                  </p>
                </div>
                <p class="text-xs" :class="evidenceTruthBodyClass(evidenceTruthClass)" :data-testid="EVIDENCE_TRUTH_TEST_IDS.DESCRIPTION">
                  {{ EVIDENCE_TRUTH_DESCRIPTIONS[evidenceTruthClass] }}
                </p>
                <p
                  v-if="evidenceTruthClass !== 'backend_confirmed'"
                  class="text-xs mt-1.5 font-medium"
                  :class="evidenceTruthTitleClass(evidenceTruthClass)"
                  :data-testid="EVIDENCE_TRUTH_TEST_IDS.NEXT_ACTION"
                >
                  Next action: {{ EVIDENCE_TRUTH_NEXT_ACTIONS[evidenceTruthClass] }}
                </p>
                <p
                  class="text-xs mt-1 opacity-70"
                  :class="evidenceTruthBodyClass(evidenceTruthClass)"
                  :data-testid="EVIDENCE_TRUTH_TEST_IDS.PROVENANCE_LABEL"
                >
                  {{ buildProvenanceLabel(evidenceTruthClass, 'Release Evidence Center') }}
                </p>
              </div>
            </div>
          </div>

          <!-- ── Permissive vs Protected Distinction Notice ── -->
          <div
            class="mt-6 rounded-xl border border-indigo-700 bg-indigo-950 px-5 py-4 flex items-start gap-3"
            data-testid="grade-distinction-notice"
            role="note"
            aria-label="Evidence grade distinction"
          >
            <InformationCircleIcon class="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p class="text-sm text-indigo-200">
              <span class="font-semibold">Protected backend evidence</span> (required for release authorization)
              is distinct from <span class="font-semibold">permissive developer-mode evidence</span>
              (used for internal feedback only). This center shows protected evidence only.
              Developer-mode results are not valid for regulatory sign-off.
            </p>
          </div>

          <!-- ── Evidence Artifact Inventory ── -->
          <section
            class="mt-8"
            :data-testid="RELEASE_CENTER_TEST_IDS.DIMENSIONS_SECTION"
            aria-labelledby="dimensions-heading"
          >
            <h2
              id="dimensions-heading"
              class="text-xl font-semibold text-white mb-1"
            >
              Evidence Artifact Inventory
            </h2>
            <p class="text-sm text-gray-400 mb-5">
              Each evidence dimension is independently assessed against the 30-day freshness window.
              All launch-critical dimensions must reach <em>Ready</em> state before release authorization.
            </p>

            <!-- Launch-critical dimensions -->
            <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Launch-Critical Evidence
            </h3>
            <div class="grid gap-4 sm:grid-cols-2 mb-6">
              <div
                v-for="dim in launchCriticalDimensions"
                :key="dim.id"
                class="rounded-xl border p-5 transition-shadow hover:shadow-lg"
                :class="[dimensionCardBorderClass(dim.state), dimensionCardBgClass(dim.state)]"
                :data-testid="RELEASE_CENTER_TEST_IDS.DIMENSION_CARD(dim.id)"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex items-center gap-2">
                    <component
                      :is="stateIcon(dim.state)"
                      class="w-5 h-5 flex-shrink-0"
                      :class="{
                        'text-green-400': dim.state === 'ready',
                        'text-teal-400': dim.state === 'advisory_follow_up',
                        'text-orange-400': dim.state === 'stale_evidence',
                        'text-red-400': dim.state === 'missing_evidence',
                        'text-yellow-400': dim.state === 'configuration_blocked',
                      }"
                      aria-hidden="true"
                    />
                    <span class="font-semibold text-white text-sm">{{ dim.title }}</span>
                  </div>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0"
                    :class="readinessStateBadgeClass(dim.state)"
                    :data-testid="RELEASE_CENTER_TEST_IDS.DIMENSION_BADGE(dim.id)"
                    :aria-label="`${dim.title} status: ${dimensionStateLabel(dim.state)}`"
                    role="status"
                  >
                    {{ dimensionStateLabel(dim.state) }}
                  </span>
                </div>
                <p class="text-xs text-gray-300 mb-3">{{ dim.description }}</p>
                <dl class="flex items-center gap-5 text-xs">
                  <div>
                    <dt class="text-gray-500">Last evidence</dt>
                    <dd class="text-gray-300 font-medium">{{ dim.freshnessLabel }}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">Owner</dt>
                    <dd class="text-gray-300 font-medium">{{ OWNER_DOMAIN_DISPLAY_NAMES[dim.ownerDomain] }}</dd>
                  </div>
                </dl>
                <div v-if="dim.state !== 'ready'" class="mt-3 p-2.5 rounded-lg bg-black/20">
                  <p class="text-xs text-gray-300">
                    <span class="font-semibold text-gray-200">Next action:</span>
                    {{ dim.nextActionSummary }}
                  </p>
                </div>
                <button
                  v-if="dim.evidencePath"
                  class="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                  :aria-label="`Navigate to ${dim.title} workspace`"
                  @click="navigateTo(dim.evidencePath)"
                >
                  <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" aria-hidden="true" />
                  Open workspace
                </button>
              </div>
            </div>

            <!-- Advisory dimensions -->
            <template v-if="advisoryDimensions.length > 0">
              <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Advisory Evidence
              </h3>
              <div class="grid gap-4 sm:grid-cols-2">
                <div
                  v-for="dim in advisoryDimensions"
                  :key="dim.id"
                  class="rounded-xl border p-5 transition-shadow hover:shadow-lg"
                  :class="[dimensionCardBorderClass(dim.state), dimensionCardBgClass(dim.state)]"
                  :data-testid="RELEASE_CENTER_TEST_IDS.DIMENSION_CARD(dim.id)"
                >
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <div class="flex items-center gap-2">
                      <component
                        :is="stateIcon(dim.state)"
                        class="w-5 h-5 flex-shrink-0"
                        :class="{
                          'text-green-400': dim.state === 'ready',
                          'text-teal-400': dim.state === 'advisory_follow_up',
                          'text-orange-400': dim.state === 'stale_evidence',
                          'text-red-400': dim.state === 'missing_evidence',
                          'text-yellow-400': dim.state === 'configuration_blocked',
                        }"
                        aria-hidden="true"
                      />
                      <span class="font-semibold text-white text-sm">{{ dim.title }}</span>
                    </div>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0"
                      :class="readinessStateBadgeClass(dim.state)"
                      :data-testid="RELEASE_CENTER_TEST_IDS.DIMENSION_BADGE(dim.id)"
                      :aria-label="`${dim.title} status: ${dimensionStateLabel(dim.state)}`"
                      role="status"
                    >
                      {{ dimensionStateLabel(dim.state) }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-300 mb-3">{{ dim.description }}</p>
                  <dl class="flex items-center gap-5 text-xs">
                    <div>
                      <dt class="text-gray-500">Last evidence</dt>
                      <dd class="text-gray-300 font-medium">{{ dim.freshnessLabel }}</dd>
                    </div>
                    <div>
                      <dt class="text-gray-500">Owner</dt>
                      <dd class="text-gray-300 font-medium">{{ OWNER_DOMAIN_DISPLAY_NAMES[dim.ownerDomain] }}</dd>
                    </div>
                  </dl>
                  <div v-if="dim.state !== 'ready'" class="mt-3 p-2.5 rounded-lg bg-black/20">
                    <p class="text-xs text-gray-300">
                      <span class="font-semibold text-gray-200">Next action:</span>
                      {{ dim.nextActionSummary }}
                    </p>
                  </div>
                  <button
                    v-if="dim.evidencePath"
                    class="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                    :aria-label="`Navigate to ${dim.title} workspace`"
                    @click="navigateTo(dim.evidencePath)"
                  >
                    <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" aria-hidden="true" />
                    Open workspace
                  </button>
                </div>
              </div>
            </template>
          </section>

          <!-- ── Environment Diagnostics ── -->
          <section
            class="mt-8 rounded-2xl border border-gray-700 bg-gray-800/60 p-6 shadow-lg"
            :data-testid="RELEASE_CENTER_TEST_IDS.ENV_DIAG_SECTION"
            aria-labelledby="env-diag-heading"
          >
            <div class="flex items-center gap-3 mb-1">
              <WrenchScrewdriverIcon class="w-5 h-5 text-gray-400" aria-hidden="true" />
              <h2
                id="env-diag-heading"
                class="text-lg font-semibold text-white"
              >
                Environment Diagnostics
              </h2>
            </div>
            <p class="text-sm text-gray-400 mb-5">
              Required credentials and configuration for the protected sign-off lane.
              Missing required items block the strict run from executing.
            </p>

            <!-- Required dependencies -->
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Required Configuration
            </h3>
            <ul class="space-y-3 mb-5" aria-label="Required configuration dependencies">
              <li
                v-for="dep in requiredConfigDeps"
                :key="dep.id"
                class="flex items-start gap-3 rounded-xl border p-4"
                :class="dep.isConfigured
                  ? 'border-green-700 bg-green-950'
                  : 'border-red-700 bg-red-950'"
                :data-testid="RELEASE_CENTER_TEST_IDS.ENV_DEP_CARD(dep.id)"
              >
                <component
                  :is="dep.isConfigured ? CheckCircleIcon : XCircleIcon"
                  class="w-5 h-5 flex-shrink-0 mt-0.5"
                  :class="dep.isConfigured ? 'text-green-400' : 'text-red-400'"
                  aria-hidden="true"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-white text-sm">{{ dep.label }}</span>
                    <span
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                      :class="dep.isConfigured ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'"
                      :aria-label="`${dep.label}: ${dep.isConfigured ? 'Configured' : 'Not configured'}`"
                    >
                      {{ dep.isConfigured ? 'Configured' : 'Not configured' }}
                    </span>
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      Required
                    </span>
                  </div>
                  <p class="text-xs text-gray-300 mt-1">{{ dep.description }}</p>
                  <p class="text-xs text-gray-500 mt-1">
                    Owner: {{ OWNER_DOMAIN_DISPLAY_NAMES[dep.ownerDomain] }}
                  </p>
                </div>
              </li>
            </ul>

            <!-- Optional dependencies -->
            <template v-if="optionalConfigDeps.length > 0">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Optional Configuration
              </h3>
              <ul class="space-y-3" aria-label="Optional configuration dependencies">
                <li
                  v-for="dep in optionalConfigDeps"
                  :key="dep.id"
                  class="flex items-start gap-3 rounded-xl border p-4"
                  :class="dep.isConfigured
                    ? 'border-green-700 bg-green-950'
                    : 'border-gray-600 bg-gray-700'"
                  :data-testid="RELEASE_CENTER_TEST_IDS.ENV_DEP_CARD(dep.id)"
                >
                  <component
                    :is="dep.isConfigured ? CheckCircleIcon : InformationCircleIcon"
                    class="w-5 h-5 flex-shrink-0 mt-0.5"
                    :class="dep.isConfigured ? 'text-green-400' : 'text-gray-400'"
                    aria-hidden="true"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-white text-sm">{{ dep.label }}</span>
                      <span
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                        :class="dep.isConfigured ? 'bg-green-800 text-green-200' : 'bg-gray-600 text-gray-300'"
                      >
                        {{ dep.isConfigured ? 'Configured' : 'Not configured' }}
                      </span>
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                        Optional
                      </span>
                    </div>
                    <p class="text-xs text-gray-300 mt-1">{{ dep.description }}</p>
                    <p class="text-xs text-gray-500 mt-1">
                      Owner: {{ OWNER_DOMAIN_DISPLAY_NAMES[dep.ownerDomain] }}
                    </p>
                  </div>
                </li>
              </ul>
            </template>
          </section>

          <!-- ── Next Actions / Blockers ── -->
          <section
            v-if="hasNextActions"
            class="mt-8 rounded-2xl border border-gray-700 bg-gray-800/60 p-6 shadow-lg"
            :data-testid="RELEASE_CENTER_TEST_IDS.NEXT_ACTIONS_SECTION"
            aria-labelledby="next-actions-heading"
          >
            <div class="flex items-center gap-3 mb-1">
              <ExclamationTriangleIcon class="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h2
                id="next-actions-heading"
                class="text-lg font-semibold text-white"
              >
                Release Blockers &amp; Next Actions
              </h2>
            </div>
            <p class="text-sm text-gray-400 mb-5">
              The following items must be resolved before launch authorization can proceed.
              Items are ordered by impact and ownership.
            </p>

            <ol class="space-y-4" aria-label="Release blockers and next actions">
              <li
                v-for="(action, idx) in readiness.nextActions"
                :key="action.id"
                class="flex items-start gap-4 rounded-xl border p-5"
                :class="action.isLaunchBlocking
                  ? 'border-red-700 bg-red-950'
                  : 'border-gray-600 bg-gray-700'"
                :data-testid="RELEASE_CENTER_TEST_IDS.NEXT_ACTION_ITEM(action.id)"
              >
                <span
                  class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                  :class="action.isLaunchBlocking ? 'bg-red-700 text-red-100' : 'bg-gray-600 text-gray-200'"
                  aria-hidden="true"
                >
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="font-semibold text-white text-sm">{{ action.summary }}</span>
                    <span
                      v-if="action.isLaunchBlocking"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-800 text-red-200"
                      role="status"
                      aria-label="Launch blocking"
                    >
                      Launch Blocking
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-600 text-gray-300"
                      role="status"
                      aria-label="Advisory"
                    >
                      Advisory
                    </span>
                  </div>
                  <p class="text-sm text-gray-300">{{ action.explanation }}</p>
                  <p class="text-xs text-gray-500 mt-1">
                    Owner: {{ OWNER_DOMAIN_DISPLAY_NAMES[action.ownerDomain] }}
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <!-- ── No Actions / All Clear ── -->
          <section
            v-else
            class="mt-8 rounded-2xl border border-green-700 bg-green-950 p-6 shadow-lg"
            data-testid="release-no-blockers"
            aria-labelledby="no-blockers-heading"
          >
            <div class="flex items-center gap-3">
              <CheckCircleIcon class="w-6 h-6 text-green-400" aria-hidden="true" />
              <h2
                id="no-blockers-heading"
                class="text-lg font-semibold text-green-200"
              >
                No Release Blockers
              </h2>
            </div>
            <p class="text-sm text-green-300 mt-2">
              All required evidence is present, fresh, and validated. No launch-blocking items
              remain. You may proceed to the approval handoff.
            </p>
          </section>

          <!-- ── Approval Handoff Summary ── -->
          <section
            class="mt-8 rounded-2xl border p-6 shadow-lg"
            :class="approvalHandoffReady
              ? 'border-green-700 bg-green-950'
              : 'border-gray-700 bg-gray-800/60'"
            :data-testid="RELEASE_CENTER_TEST_IDS.APPROVAL_HANDOFF_SECTION"
            aria-labelledby="approval-handoff-heading"
          >
            <div class="flex items-start gap-4 mb-4">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="approvalHandoffReady ? 'bg-green-800' : 'bg-gray-700'"
                aria-hidden="true"
              >
                <ClipboardDocumentCheckIcon
                  class="w-5 h-5"
                  :class="approvalHandoffReady ? 'text-green-300' : 'text-gray-400'"
                />
              </div>
              <div>
                <h2
                  id="approval-handoff-heading"
                  class="text-lg font-semibold text-white"
                >
                  Approval Handoff Summary
                </h2>
                <p class="text-sm mt-1"
                  :class="approvalHandoffReady ? 'text-green-300' : 'text-gray-400'"
                >
                  {{
                    approvalHandoffReady
                      ? 'Prerequisites are met. The evidence package is ready to present to approvers for formal sign-off.'
                      : 'Prerequisites are not yet complete. Resolve the blocking items above before submitting for approval.'
                  }}
                </p>
              </div>
            </div>

            <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="rounded-xl bg-black/20 p-4 text-center">
                <dt class="text-xs text-gray-500 mb-1">Launch Blocking</dt>
                <dd
                  class="text-2xl font-bold"
                  :class="readiness.launchBlockingCount > 0 ? 'text-red-400' : 'text-green-400'"
                  :aria-label="`${readiness.launchBlockingCount} launch-blocking items`"
                >
                  {{ readiness.launchBlockingCount }}
                </dd>
              </div>
              <div class="rounded-xl bg-black/20 p-4 text-center">
                <dt class="text-xs text-gray-500 mb-1">Stale Evidence</dt>
                <dd
                  class="text-2xl font-bold"
                  :class="readiness.staleCount > 0 ? 'text-orange-400' : 'text-green-400'"
                  :aria-label="`${readiness.staleCount} stale evidence items`"
                >
                  {{ readiness.staleCount }}
                </dd>
              </div>
              <div class="rounded-xl bg-black/20 p-4 text-center">
                <dt class="text-xs text-gray-500 mb-1">Config Missing</dt>
                <dd
                  class="text-2xl font-bold"
                  :class="readiness.missingConfigCount > 0 ? 'text-yellow-400' : 'text-green-400'"
                  :aria-label="`${readiness.missingConfigCount} missing configuration items`"
                >
                  {{ readiness.missingConfigCount }}
                </dd>
              </div>
              <div class="rounded-xl bg-black/20 p-4 text-center">
                <dt class="text-xs text-gray-500 mb-1">Last Protected Run</dt>
                <dd
                  class="text-sm font-medium text-gray-300"
                  :aria-label="`Last protected run: ${readiness.lastProtectedRunLabel}`"
                >
                  {{ readiness.lastProtectedRunLabel }}
                </dd>
              </div>
            </dl>

            <div class="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                :class="approvalHandoffReady
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'"
                :disabled="!approvalHandoffReady"
                :aria-disabled="!approvalHandoffReady"
                aria-label="Go to approval queue"
                data-testid="approval-queue-link"
                @click="approvalHandoffReady && navigateTo('/compliance/approval')"
              >
                Go to Approval Queue
              </button>
              <button
                class="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                aria-label="Go to compliance operations cockpit"
                data-testid="operations-cockpit-link"
                @click="navigateTo('/compliance/operations')"
              >
                Operations Cockpit
              </button>
            </div>
          </section>

          <!-- ── Export Section ── -->
          <section
            class="mt-8 rounded-2xl border border-gray-700 bg-gray-800/60 p-6 shadow-lg"
            :data-testid="RELEASE_CENTER_TEST_IDS.EXPORT_SECTION"
            aria-labelledby="export-heading"
          >
            <div class="flex items-center gap-3 mb-1">
              <ArrowDownTrayIcon class="w-5 h-5 text-gray-400" aria-hidden="true" />
              <h2
                id="export-heading"
                class="text-lg font-semibold text-white"
              >
                Export Evidence Summary
              </h2>
            </div>
            <p class="text-sm text-gray-400 mb-5">
              Download a JSON evidence summary suitable for audit preparation, regulator
              conversations, or offline review. This export reflects the current assessed
              readiness posture and is not a substitute for formal audit artifacts.
            </p>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                :disabled="exportStatus === 'exporting'"
                :aria-disabled="exportStatus === 'exporting'"
                :aria-label="exportStatus === 'exporting' ? 'Exporting evidence summary, please wait' : 'Download evidence summary as JSON'"
                :data-testid="RELEASE_CENTER_TEST_IDS.EXPORT_BTN"
                @click="handleExport"
              >
                <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
                {{ exportStatus === 'exporting' ? 'Exporting…' : 'Download Evidence Summary' }}
              </button>

              <p
                v-if="exportStatusMessage"
                class="text-sm"
                :class="{
                  'text-green-400': exportStatus === 'success',
                  'text-red-400': exportStatus === 'error',
                  'text-gray-400': exportStatus === 'exporting',
                }"
                :data-testid="RELEASE_CENTER_TEST_IDS.EXPORT_STATUS"
                role="status"
                aria-live="polite"
              >
                {{ exportStatusMessage }}
              </p>
            </div>
          </section>

        </template>
      </div>
    </div>
  </MainLayout>
</template>
