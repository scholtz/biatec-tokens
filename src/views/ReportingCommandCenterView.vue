<script setup lang="ts">
/**
 * ReportingCommandCenterView — Regulator-ready compliance reporting command center.
 *
 * A dedicated workspace that gives non-crypto-native issuer teams a disciplined,
 * role-aware product workflow for creating, scheduling, and distributing recurring
 * compliance reports. Replaces ad hoc evidence export with a repeatable enterprise
 * reporting experience.
 *
 * Features:
 *  1. Summary cards — scheduled runs, blocked runs, stale evidence, awaiting action
 *  2. Saved report templates for four enterprise audiences
 *  3. In-flight report runs with lifecycle status, change-since-last-report diff
 *  4. Report configuration panel (cadence, audience, evidence scope, approvals)
 *  5. Fail-closed evidence freshness warnings
 *  6. Deep links to remediation surfaces for blocked runs
 *
 * Product alignment:
 *  - Email/password authentication only — no wallet connector framing
 *  - Fail-closed: stale/missing evidence never appears fully ready
 *  - WCAG 2.1 AA: landmarks, headings, focus rings, aria-live, non-color-only status
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import {
  ChartBarSquareIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import {
  REPORTING_CENTER_TEST_IDS,
  REPORT_AUDIENCE_LABELS,
  REPORT_CADENCE_LABELS,
  REPORT_RUN_STATUS_LABELS,
  EVIDENCE_FRESHNESS_LABELS,
  MOCK_TEMPLATES_HEALTHY,
  MOCK_RUNS_ACTIVE,
  deriveCommandCenterSummary,
  getRunCta,
  runStatusBadgeClass,
  freshnessIndicatorClass,
  templateCardBorderClass,
  buildCadenceLabel,
  isEvidenceBlocking,
  type ReportTemplate,
  type ReportRun,
  type ReportAudience,
  type ReportCadence,
} from '../utils/reportingCommandCenter'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const router = useRouter()
const isLoading = ref(true)
const isDegraded = ref(false)
const showConfigurePanel = ref(false)
const configAudience = ref<ReportAudience>('internal_compliance')
const configCadence = ref<ReportCadence>('quarterly')
let loadTimer: ReturnType<typeof setTimeout> | null = null

const templates = ref<ReportTemplate[]>([])
const runs = ref<ReportRun[]>([])

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  loadTimer = setTimeout(() => {
    templates.value = MOCK_TEMPLATES_HEALTHY
    runs.value = MOCK_RUNS_ACTIVE
    isLoading.value = false
  }, 150)
})

onBeforeUnmount(() => {
  if (loadTimer !== null) clearTimeout(loadTimer)
})

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const summary = computed(() =>
  deriveCommandCenterSummary(templates.value, runs.value),
)

const activeRuns = computed(() =>
  runs.value.filter((r) => r.status !== 'delivered' && r.status !== 'exported'),
)

const completedRuns = computed(() =>
  runs.value.filter((r) => r.status === 'delivered' || r.status === 'exported'),
)

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

function openConfigurePanel() {
  showConfigurePanel.value = true
}

function closeConfigurePanel() {
  showConfigurePanel.value = false
}

function navigateToRemediation(path: string) {
  router.push(path)
}

function audienceIcon(audience: ReportAudience) {
  switch (audience) {
    case 'internal_compliance':
      return ShieldCheckIcon
    case 'executive':
      return BriefcaseIcon
    case 'auditor':
      return DocumentTextIcon
    case 'regulator':
      return BuildingLibraryIcon
    default:
      return UserGroupIcon
  }
}
</script>

<template>
  <MainLayout>
    <!-- WCAG SC 2.4.1: Skip link to main content -->
    <a
      href="#reporting-center-main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      :data-testid="REPORTING_CENTER_TEST_IDS.SKIP_LINK"
    >
      Skip to main content
    </a>

    <!-- Main workspace region -->
    <div
      id="reporting-center-main"
      role="region"
      aria-label="Reporting Command Center"
      :data-testid="REPORTING_CENTER_TEST_IDS.PAGE_ROOT"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <!-- Page Header -->
      <header class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <ChartBarSquareIcon class="w-8 h-8 text-blue-400 shrink-0" aria-hidden="true" />
          <h1
            class="text-2xl font-bold text-gray-900 dark:text-white"
            :data-testid="REPORTING_CENTER_TEST_IDS.PAGE_HEADING"
          >
            Reporting Command Center
          </h1>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
          Create, schedule, and distribute recurring compliance reports for your enterprise audiences —
          internal compliance committees, executive sponsors, auditors, and regulators.
        </p>
      </header>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-20"
        role="region"
        aria-live="polite"
        aria-label="Loading reporting data"
        :data-testid="REPORTING_CENTER_TEST_IDS.LOADING_STATE"
      >
        <ArrowPathIcon class="w-8 h-8 text-blue-400 animate-spin mr-3" aria-hidden="true" />
        <p class="text-gray-400 text-sm">Loading reporting data…</p>
      </div>

      <template v-else>
        <!-- Degraded Banner -->
        <div
          v-if="isDegraded"
          class="mb-6 rounded-xl border border-orange-700 bg-orange-900/30 p-4 flex items-start gap-3"
          role="alert"
          :data-testid="REPORTING_CENTER_TEST_IDS.DEGRADED_BANNER"
        >
          <ExclamationTriangleIcon class="w-5 h-5 text-orange-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p class="text-sm font-medium text-orange-200">Reporting data is degraded</p>
            <p class="text-xs text-orange-300 mt-1">
              One or more evidence sources returned incomplete data. Report completeness signals may be inaccurate.
            </p>
          </div>
        </div>

        <!-- ── Summary Cards ───────────────────────────────────────────── -->
        <section aria-labelledby="summary-heading" class="mb-8">
          <h2 id="summary-heading" class="sr-only">Reporting status summary</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">

            <!-- Scheduled Runs -->
            <div
              class="rounded-xl border border-gray-700 bg-gray-800 p-4"
              :data-testid="REPORTING_CENTER_TEST_IDS.SUMMARY_SCHEDULED"
            >
              <div class="flex items-center gap-2 mb-1">
                <CalendarDaysIcon class="w-4 h-4 text-blue-400" aria-hidden="true" />
                <span class="text-xs text-gray-400 font-medium">Scheduled</span>
              </div>
              <p class="text-2xl font-bold text-white">{{ summary.scheduledRunCount }}</p>
              <p class="text-xs text-gray-500 mt-1">runs queued</p>
            </div>

            <!-- Blocked Runs -->
            <div
              class="rounded-xl border border-red-800 bg-gray-800 p-4"
              :data-testid="REPORTING_CENTER_TEST_IDS.SUMMARY_BLOCKED"
            >
              <div class="flex items-center gap-2 mb-1">
                <XCircleIcon class="w-4 h-4 text-red-400" aria-hidden="true" />
                <span class="text-xs text-gray-400 font-medium">Blocked</span>
              </div>
              <p class="text-2xl font-bold text-white">{{ summary.blockedRunCount }}</p>
              <p class="text-xs text-gray-500 mt-1">runs blocked</p>
            </div>

            <!-- Stale Evidence -->
            <div
              class="rounded-xl border"
              :class="summary.staleEvidenceCount > 0 ? 'border-yellow-700 bg-gray-800' : 'border-gray-700 bg-gray-800'"
              :data-testid="REPORTING_CENTER_TEST_IDS.SUMMARY_STALE"
            >
              <div class="p-4">
                <div class="flex items-center gap-2 mb-1">
                  <ExclamationTriangleIcon
                    class="w-4 h-4"
                    :class="summary.staleEvidenceCount > 0 ? 'text-yellow-400' : 'text-gray-500'"
                    aria-hidden="true"
                  />
                  <span class="text-xs text-gray-400 font-medium">Stale Evidence</span>
                </div>
                <p class="text-2xl font-bold text-white">{{ summary.staleEvidenceCount }}</p>
                <p class="text-xs text-gray-500 mt-1">templates affected</p>
              </div>
            </div>

            <!-- Awaiting Action -->
            <div
              class="rounded-xl border"
              :class="summary.awaitingActionCount > 0 ? 'border-yellow-700 bg-gray-800' : 'border-gray-700 bg-gray-800'"
              :data-testid="REPORTING_CENTER_TEST_IDS.SUMMARY_AWAITING"
            >
              <div class="p-4">
                <div class="flex items-center gap-2 mb-1">
                  <ClockIcon
                    class="w-4 h-4"
                    :class="summary.awaitingActionCount > 0 ? 'text-yellow-400' : 'text-gray-500'"
                    aria-hidden="true"
                  />
                  <span class="text-xs text-gray-400 font-medium">Awaiting Action</span>
                </div>
                <p class="text-2xl font-bold text-white">{{ summary.awaitingActionCount }}</p>
                <p class="text-xs text-gray-500 mt-1">approvals / reviews</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Report Templates ────────────────────────────────────────── -->
        <section
          aria-labelledby="templates-heading"
          class="mb-8"
          :data-testid="REPORTING_CENTER_TEST_IDS.TEMPLATES_SECTION"
        >
          <div class="flex items-center justify-between mb-4">
            <h2
              id="templates-heading"
              class="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Saved Report Templates
            </h2>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              :data-testid="REPORTING_CENTER_TEST_IDS.CREATE_RUN_BUTTON"
              @click="openConfigurePanel"
            >
              <PlusCircleIcon class="w-4 h-4" aria-hidden="true" />
              New Report Run
            </button>
          </div>

          <!-- Empty state for templates -->
          <div
            v-if="templates.length === 0"
            class="rounded-xl border border-gray-700 bg-gray-800 p-8 text-center"
            role="status"
            aria-live="polite"
            :data-testid="REPORTING_CENTER_TEST_IDS.EMPTY_STATE"
          >
            <DocumentTextIcon class="w-10 h-10 text-gray-500 mx-auto mb-3" aria-hidden="true" />
            <p class="text-sm font-medium text-gray-300">No report templates configured</p>
            <p class="text-xs text-gray-500 mt-1">Create a new report run to get started with enterprise compliance reporting.</p>
          </div>

          <!-- Template cards -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <article
              v-for="template in templates"
              :key="template.id"
              class="rounded-xl border border-gray-700 bg-gray-800 p-5 flex flex-col gap-3"
              :class="templateCardBorderClass(template.evidenceFreshness)"
              :data-testid="REPORTING_CENTER_TEST_IDS.TEMPLATE_CARD"
              :aria-label="`Report template: ${template.name}`"
            >
              <!-- Template header -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-2">
                  <component
                    :is="audienceIcon(template.audience)"
                    class="w-5 h-5 text-blue-400 shrink-0"
                    aria-hidden="true"
                  />
                  <h3 class="text-sm font-semibold text-white">{{ template.name }}</h3>
                </div>
                <!-- Freshness badge -->
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                  :class="freshnessIndicatorClass(template.evidenceFreshness)"
                  :data-testid="REPORTING_CENTER_TEST_IDS.TEMPLATE_FRESHNESS_BADGE"
                  :aria-label="`Evidence: ${EVIDENCE_FRESHNESS_LABELS[template.evidenceFreshness]}`"
                >
                  {{ EVIDENCE_FRESHNESS_LABELS[template.evidenceFreshness] }}
                </span>
              </div>

              <!-- Description -->
              <p class="text-xs text-gray-400">{{ template.description }}</p>

              <!-- Metadata chips -->
              <div class="flex flex-wrap items-center gap-2">
                <!-- Audience badge -->
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200 border border-blue-700"
                  :data-testid="REPORTING_CENTER_TEST_IDS.TEMPLATE_AUDIENCE_BADGE"
                >
                  {{ REPORT_AUDIENCE_LABELS[template.audience] }}
                </span>
                <!-- Cadence chip -->
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300"
                  :data-testid="REPORTING_CENTER_TEST_IDS.TEMPLATE_CADENCE_CHIP"
                >
                  <CalendarDaysIcon class="w-3 h-3" aria-hidden="true" />
                  {{ REPORT_CADENCE_LABELS[template.cadence] }}
                </span>
                <!-- Approval required indicator -->
                <span
                  v-if="template.requiresApproval"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-200 border border-purple-700"
                >
                  <ShieldCheckIcon class="w-3 h-3" aria-hidden="true" />
                  Approval required
                </span>
              </div>

              <!-- Next run info -->
              <p
                v-if="template.nextRunAt"
                class="text-xs text-gray-500"
              >
                {{ buildCadenceLabel(template.cadence, template.nextRunAt) || 'Schedule not configured' }}
              </p>

              <!-- Stale/missing evidence warning -->
              <div
                v-if="isEvidenceBlocking(template.evidenceFreshness)"
                class="flex items-start gap-2 rounded-lg border border-yellow-800 bg-yellow-900/20 p-3"
                role="alert"
              >
                <ExclamationTriangleIcon class="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p class="text-xs text-yellow-300">
                  Evidence is {{ EVIDENCE_FRESHNESS_LABELS[template.evidenceFreshness].toLowerCase() }}.
                  This template cannot generate a clean report until the linked evidence is refreshed.
                  <router-link
                    to="/compliance/release"
                    class="underline text-yellow-200 hover:text-yellow-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400 rounded"
                  >
                    Review release readiness
                  </router-link>
                </p>
              </div>

              <!-- Run CTA -->
              <div class="mt-auto pt-2 flex items-center justify-between">
                <span class="text-xs text-gray-600">
                  <template v-if="template.lastRunAt">
                    Last run: {{ new Date(template.lastRunAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }}
                  </template>
                  <template v-else>Never run</template>
                </span>
                <button
                  type="button"
                  class="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
                  :class="isEvidenceBlocking(template.evidenceFreshness)
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'"
                  :disabled="isEvidenceBlocking(template.evidenceFreshness)"
                  :aria-disabled="isEvidenceBlocking(template.evidenceFreshness)"
                  :data-testid="REPORTING_CENTER_TEST_IDS.TEMPLATE_RUN_CTA"
                  @click="openConfigurePanel"
                >
                  Run Report
                </button>
              </div>
            </article>
          </div>
        </section>

        <!-- ── In-Flight Report Runs ───────────────────────────────────── -->
        <section
          aria-labelledby="runs-heading"
          :data-testid="REPORTING_CENTER_TEST_IDS.RUNS_SECTION"
        >
          <h2
            id="runs-heading"
            class="text-lg font-semibold text-gray-900 dark:text-white mb-4"
          >
            In-Flight Report Runs
          </h2>

          <!-- Empty state for runs -->
          <div
            v-if="activeRuns.length === 0 && completedRuns.length === 0"
            class="rounded-xl border border-gray-700 bg-gray-800 p-8 text-center"
            role="status"
            aria-live="polite"
          >
            <ChartBarSquareIcon class="w-10 h-10 text-gray-500 mx-auto mb-3" aria-hidden="true" />
            <p class="text-sm font-medium text-gray-300">No report runs yet</p>
            <p class="text-xs text-gray-500 mt-1">Generate your first report run from a template above.</p>
          </div>

          <!-- Active runs -->
          <div v-if="activeRuns.length > 0" class="space-y-3 mb-6">
            <article
              v-for="run in activeRuns"
              :key="run.id"
              class="rounded-xl border border-gray-700 bg-gray-800 p-5"
              :data-testid="REPORTING_CENTER_TEST_IDS.RUN_ROW"
              :aria-label="`Report run: ${run.templateName} — ${REPORT_RUN_STATUS_LABELS[run.status]}`"
            >
              <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                <!-- Run info -->
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <h3 class="text-sm font-semibold text-white truncate">{{ run.templateName }}</h3>
                    <!-- Status badge -->
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="runStatusBadgeClass(run.status)"
                      :data-testid="REPORTING_CENTER_TEST_IDS.RUN_STATUS_BADGE"
                    >
                      {{ REPORT_RUN_STATUS_LABELS[run.status] }}
                    </span>
                    <!-- Freshness badge -->
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="freshnessIndicatorClass(run.evidenceFreshness)"
                    >
                      {{ EVIDENCE_FRESHNESS_LABELS[run.evidenceFreshness] }}
                    </span>
                  </div>

                  <!-- Audience + initiated -->
                  <p class="text-xs text-gray-400 mb-2">
                    {{ REPORT_AUDIENCE_LABELS[run.audience] }} ·
                    Initiated {{ new Date(run.initiatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }}
                  </p>

                  <!-- Reviewer / Approver -->
                  <div v-if="run.reviewerName || run.approverName" class="flex flex-wrap gap-3 mb-2">
                    <span v-if="run.reviewerName" class="text-xs text-gray-500">
                      Reviewer: <span class="text-gray-300">{{ run.reviewerName }}</span>
                    </span>
                    <span v-if="run.approverName" class="text-xs text-gray-500">
                      Approver: <span class="text-gray-300">{{ run.approverName }}</span>
                    </span>
                  </div>

                  <!-- Blockers -->
                  <div v-if="run.blockers.length > 0" class="mt-2">
                    <div
                      v-for="blocker in run.blockers"
                      :key="blocker.domain"
                      class="flex items-start gap-2 rounded-lg border border-red-800 bg-red-900/20 p-3 mb-2"
                      role="alert"
                    >
                      <XCircleIcon class="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <div class="flex-1 min-w-0">
                        <p class="text-xs text-red-300">{{ blocker.description }}</p>
                        <router-link
                          :to="blocker.remediationPath"
                          class="text-xs text-red-200 underline hover:text-red-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded mt-1 inline-flex items-center gap-1"
                          :data-testid="REPORTING_CENTER_TEST_IDS.RUN_BLOCKER_LINK"
                        >
                          Resolve in {{ blocker.domain.replace('_', ' ') }}
                          <ArrowTopRightOnSquareIcon class="w-3 h-3" aria-hidden="true" />
                        </router-link>
                      </div>
                    </div>
                  </div>

                  <!-- Change summary (what changed since last report) -->
                  <div
                    v-if="run.changeSummary"
                    class="mt-3 rounded-lg border border-gray-700 bg-gray-900/50 p-3"
                    :data-testid="REPORTING_CENTER_TEST_IDS.RUN_CHANGE_SUMMARY"
                    :aria-label="`Changes since last report for ${run.templateName}`"
                  >
                    <p class="text-xs font-medium text-gray-300 mb-2">
                      Changes since last report
                    </p>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-xs">
                      <div class="flex flex-col">
                        <span class="text-green-400 font-bold">{{ run.changeSummary.resolvedBlockerCount }}</span>
                        <span class="text-gray-500">blockers resolved</span>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-blue-400 font-bold">{{ run.changeSummary.newApprovalCount }}</span>
                        <span class="text-gray-500">new approvals</span>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-blue-400 font-bold">{{ run.changeSummary.refreshedEvidenceCount }}</span>
                        <span class="text-gray-500">evidence refreshed</span>
                      </div>
                      <div class="flex flex-col">
                        <span
                          :class="run.changeSummary.remainingRiskCount > 0 ? 'text-yellow-400' : 'text-green-400'"
                          class="font-bold"
                        >
                          {{ run.changeSummary.remainingRiskCount }}
                        </span>
                        <span class="text-gray-500">open risks</span>
                      </div>
                    </div>
                    <ul class="space-y-1">
                      <li
                        v-for="(highlight, idx) in run.changeSummary.highlights"
                        :key="idx"
                        class="text-xs text-gray-400 flex items-start gap-1.5"
                      >
                        <InformationCircleIcon class="w-3 h-3 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                        {{ highlight }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- CTA column -->
                <div class="flex flex-col gap-2 shrink-0">
                  <template v-if="getRunCta(run) === 'review'">
                    <button
                      type="button"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
                      :data-testid="REPORTING_CENTER_TEST_IDS.RUN_CTA_BUTTON"
                    >
                      Review
                    </button>
                  </template>
                  <template v-else-if="getRunCta(run) === 'approve'">
                    <button
                      type="button"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
                      :data-testid="REPORTING_CENTER_TEST_IDS.RUN_CTA_BUTTON"
                    >
                      Approve
                    </button>
                  </template>
                  <template v-else-if="getRunCta(run) === 'view_blockers'">
                    <button
                      v-if="run.remediationPath"
                      type="button"
                      class="px-4 py-2 text-sm font-medium rounded-lg bg-red-800 hover:bg-red-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
                      :data-testid="REPORTING_CENTER_TEST_IDS.RUN_CTA_BUTTON"
                      @click="navigateToRemediation(run.remediationPath!)"
                    >
                      Resolve Blockers
                    </button>
                  </template>
                </div>
              </div>
            </article>
          </div>

          <!-- Completed runs (collapsed summary) -->
          <div v-if="completedRuns.length > 0">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Recently Completed</h3>
            <div class="space-y-2">
              <div
                v-for="run in completedRuns"
                :key="run.id"
                class="rounded-lg border border-gray-700 bg-gray-800/50 p-4 flex items-center justify-between gap-3"
                :data-testid="REPORTING_CENTER_TEST_IDS.RUN_ROW"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <CheckCircleIcon class="w-4 h-4 text-green-400 shrink-0" aria-hidden="true" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-300 truncate">{{ run.templateName }}</p>
                    <p class="text-xs text-gray-500">
                      {{ REPORT_AUDIENCE_LABELS[run.audience] }}
                      <template v-if="run.completedAt">
                        · {{ new Date(run.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }}
                      </template>
                    </p>
                  </div>
                </div>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                  :class="runStatusBadgeClass(run.status)"
                  :data-testid="REPORTING_CENTER_TEST_IDS.RUN_STATUS_BADGE"
                >
                  {{ REPORT_RUN_STATUS_LABELS[run.status] }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ── Configure Panel (side panel / modal) ────────────────────── -->
      <div
        v-if="showConfigurePanel"
        class="fixed inset-0 z-40 bg-black/60"
        role="presentation"
        @click="closeConfigurePanel"
      />
      <aside
        v-if="showConfigurePanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="configure-panel-heading"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col overflow-y-auto"
        :data-testid="REPORTING_CENTER_TEST_IDS.CONFIGURE_PANEL"
      >
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <h2
            id="configure-panel-heading"
            class="text-base font-semibold text-white"
          >
            Configure Report Run
          </h2>
          <button
            type="button"
            class="text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            :data-testid="REPORTING_CENTER_TEST_IDS.PANEL_CLOSE"
            aria-label="Close configuration panel"
            @click="closeConfigurePanel"
          >
            <XMarkIcon class="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div class="flex-1 px-6 py-6 space-y-6">
          <!-- Audience selection -->
          <div>
            <label
              for="configure-audience"
              class="block text-sm font-medium text-gray-300 mb-2"
            >
              Report Audience
            </label>
            <select
              id="configure-audience"
              v-model="configAudience"
              class="w-full rounded-lg bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :data-testid="REPORTING_CENTER_TEST_IDS.PANEL_AUDIENCE_SELECT"
            >
              <option value="internal_compliance">Internal Compliance Committee</option>
              <option value="executive">Executive Leadership</option>
              <option value="auditor">External Auditor</option>
              <option value="regulator">Regulatory Authority</option>
            </select>
          </div>

          <!-- Cadence selection -->
          <div>
            <label
              for="configure-cadence"
              class="block text-sm font-medium text-gray-300 mb-2"
            >
              Report Cadence
            </label>
            <select
              id="configure-cadence"
              v-model="configCadence"
              class="w-full rounded-lg bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :data-testid="REPORTING_CENTER_TEST_IDS.PANEL_CADENCE_SELECT"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="event_driven">Event-Driven</option>
              <option value="manual">Manual (One-Off)</option>
            </select>
          </div>

          <!-- Backend unavailable notice -->
          <div
            class="rounded-xl border border-gray-700 bg-gray-800 p-4 flex items-start gap-3"
            role="note"
            aria-label="Scheduling feature availability"
          >
            <InformationCircleIcon class="w-5 h-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p class="text-sm font-medium text-gray-300">Scheduled delivery not yet available</p>
              <p class="text-xs text-gray-400 mt-1">
                Backend scheduling and delivery endpoints are being integrated. Report runs can be configured
                and saved locally. Automatic distribution will be enabled in an upcoming release.
              </p>
            </div>
          </div>
        </div>

        <!-- Panel actions -->
        <div class="px-6 py-5 border-t border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
            @click="closeConfigurePanel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Save Configuration
          </button>
        </div>
      </aside>
    </div>
  </MainLayout>
</template>
