<script setup lang="ts">
/**
 * Compliance Evidence Pack Workspace
 *
 * Regulator-ready workspace that aggregates and presents release-critical evidence
 * for enterprise operators. Designed for compliance managers, auditors, and
 * operations staff who need to review, assemble, and export evidence bundles
 * without navigating raw CI logs or engineering dashboards.
 *
 * Product definition alignment:
 *  - Email/password authentication only — no wallet connector framing
 *  - Backend-managed token deployment
 *  - Operator-friendly language: "deployment proof", "policy approval", "audit trail"
 *  - WCAG 2.1 AA: landmarks, headings, focus rings, non-color-only status, aria-live
 *
 * Evidence sections:
 *  1. Release Readiness Summary  — overall gate state at a glance
 *  2. Accessibility Sign-off     — WCAG/accessibility evidence status
 *  3. Backend Sign-off           — strict backend deployment verification
 *  4. Policy Review              — whitelist / compliance policy health
 *  5. Team Approvals             — operator review and sign-off state
 *  6. Audit Trail                — timestamped evidence record
 *  7. Export Bundle              — JSON / CSV download actions
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/vue/24/outline'
import {
  STATUS_LABELS,
  STATUS_DESCRIPTIONS,
  RELEASE_GRADE_LABEL,
  PERMISSIVE_GRADE_LABEL,
  type EvidenceStatus,
  type EvidenceSection,
} from '../utils/complianceEvidencePack'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const router = useRouter()
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const expandedSections = ref<Set<string>>(new Set())
const exportStatus = ref<'idle' | 'exporting' | 'success' | 'error'>('idle')
const lastRefreshed = ref<string | null>(null)
// Timeout handles for cleanup on unmount (prevent state updates on unmounted component)
let exportResetTimeout: ReturnType<typeof setTimeout> | null = null

// ---------------------------------------------------------------------------
// Evidence data — in a production build this would come from a backend API or
// workflow-fed store. Here we derive a realistic mock from localStorage /
// complianceSetup state to demonstrate the data-driven pattern.
// ---------------------------------------------------------------------------

const evidenceSections = ref<EvidenceSection[]>([])

function buildTimestamp(offsetMinutes = 0): string {
  const d = new Date(Date.now() - offsetMinutes * 60 * 1000)
  return d.toISOString()
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Not recorded'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function loadEvidenceData(): void {
  // Derive evidence state from localStorage/session. Real production implementation
  // would call backend endpoints (e.g. /api/v1/compliance/evidence-pack).
  const complianceRaw = localStorage.getItem('biatec_compliance_setup')
  const complianceData = complianceRaw ? JSON.parse(complianceRaw) : null
  const hasComplianceSetup = !!complianceData?.currentForm?.currentStepIndex

  const strictSignoffRaw = localStorage.getItem('biatec_strict_signoff')
  const strictSignoff = strictSignoffRaw ? JSON.parse(strictSignoffRaw) : null

  const accessibilityRaw = localStorage.getItem('biatec_accessibility_evidence')
  const accessibilityData = accessibilityRaw ? JSON.parse(accessibilityRaw) : null

  const teamApprovalsRaw = localStorage.getItem('biatec_team_approvals')
  const teamApprovals = teamApprovalsRaw ? JSON.parse(teamApprovalsRaw) : null

  evidenceSections.value = [
    // 1. Accessibility Sign-off
    {
      id: 'accessibility',
      title: 'Accessibility Evidence',
      status: accessibilityData?.passed === true ? 'ready'
        : accessibilityData ? 'warning'
        : 'pending',
      releaseGrade: true,
      summary: accessibilityData?.passed === true
        ? 'WCAG 2.1 AA sign-off recorded. All critical and serious axe violations resolved.'
        : 'Accessibility evidence not yet recorded for this release cycle.',
      details: accessibilityData?.passed === true ? [
        'Automated axe-core scan: 0 critical, 0 serious violations',
        'Keyboard navigation: verified across all primary flows',
        'Colour contrast: all text meets 4.5:1 AA ratio',
        'Screen-reader landmark structure: validated',
      ] : [
        'Run the accessibility evidence workflow to generate sign-off.',
        'Visit Compliance → Accessibility section for details.',
      ],
      timestamp: accessibilityData?.timestamp ?? buildTimestamp(120),
      actionLabel: 'View Accessibility Details',
      actionPath: '/compliance/launch',
    },

    // 2. Backend Deployment Sign-off
    {
      id: 'backend-signoff',
      title: 'Backend Deployment Sign-off',
      status: strictSignoff?.state === 'Completed' ? 'ready'
        : strictSignoff?.state === 'Failed' ? 'failed'
        : strictSignoff ? 'warning'
        : 'pending',
      releaseGrade: true,
      summary: strictSignoff?.state === 'Completed'
        ? `Strict backend deployment verified. Asset ID: ${strictSignoff.assetId ?? 'N/A'}`
        : 'Strict backend sign-off has not been completed for this release.',
      details: strictSignoff?.state === 'Completed' ? [
        `Deployment state: ${strictSignoff.state}`,
        `Asset identifier: ${strictSignoff.assetId ?? 'Not yet assigned'}`,
        `Idempotency key: ${strictSignoff.idempotencyKey ?? 'N/A'}`,
        'Backend-managed deployment — no wallet signing required',
      ] : [
        'Complete a strict backend deployment run to record sign-off evidence.',
        'No wallet connection is required — deployment is managed server-side.',
      ],
      timestamp: strictSignoff?.completedAt ?? null,
      actionLabel: 'View Backend Sign-off',
      actionPath: '/compliance/launch',
    },

    // 3. Compliance Policy Review
    {
      id: 'policy-review',
      title: 'Compliance Policy Review',
      status: hasComplianceSetup ? 'ready' : 'pending',
      releaseGrade: true,
      summary: hasComplianceSetup
        ? 'Compliance setup workspace completed. Policy review is on record.'
        : 'Compliance policy setup has not been completed.',
      details: hasComplianceSetup ? [
        'Jurisdiction policy: configured',
        'Whitelist eligibility: defined',
        'KYC/AML readiness: assessed',
        'Attestation records: referenced',
      ] : [
        'Complete the Compliance Setup Workspace to generate policy evidence.',
        'Navigate to Compliance → Setup to begin.',
      ],
      timestamp: hasComplianceSetup ? buildTimestamp(30) : null,
      actionLabel: 'Open Compliance Setup',
      actionPath: '/compliance/setup',
    },

    // 4. Team Approvals
    {
      id: 'team-approvals',
      title: 'Team Approvals',
      status: teamApprovals?.approved === true ? 'ready'
        : teamApprovals ? 'warning'
        : 'pending',
      releaseGrade: false, // Approvals supplement evidence but are not strictly release-grade on their own
      summary: teamApprovals?.approved === true
        ? `Approved by ${teamApprovals.approver ?? 'operator'} on ${formatTimestamp(teamApprovals.approvedAt)}.`
        : 'No operator approval recorded for this release cycle.',
      details: teamApprovals?.approved === true ? [
        `Approver: ${teamApprovals.approver ?? 'Operator'}`,
        `Approval date: ${formatTimestamp(teamApprovals.approvedAt)}`,
        'Review type: Release readiness sign-off',
      ] : [
        'An operator review and approval has not been recorded.',
        'Visit the Team Workspace to complete the approval flow.',
      ],
      timestamp: teamApprovals?.approvedAt ?? null,
      actionLabel: 'Open Team Workspace',
      actionPath: '/team/workspace',
    },

    // 5. Audit Trail
    {
      id: 'audit-trail',
      title: 'Audit Trail',
      status: 'ready',
      releaseGrade: true,
      summary: 'Activity log is maintained for all compliance-relevant operator actions.',
      details: [
        'Evidence pack workspace opened — timestamped',
        'Compliance setup session recorded',
        'Policy configuration changes logged',
        'Export requests tracked per session',
      ],
      timestamp: buildTimestamp(0),
      actionLabel: 'View Full Audit Trail',
      actionPath: '/attestations',
    },
  ]
}

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const overallStatus = computed<EvidenceStatus>(() => {
  const statuses = evidenceSections.value.map((s) => s.status)
  if (statuses.includes('failed')) return 'failed'
  if (statuses.includes('unavailable')) return 'warning'
  if (statuses.includes('warning')) return 'warning'
  if (statuses.includes('pending')) return 'pending'
  return 'ready'
})

const releaseGradeSections = computed(() =>
  evidenceSections.value.filter((s) => s.releaseGrade),
)

const releaseGradeReadyCount = computed(
  () => releaseGradeSections.value.filter((s) => s.status === 'ready').length,
)

const exportAvailable = computed(
  () => !isLoading.value && loadError.value === null,
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusIcon(status: EvidenceStatus) {
  switch (status) {
    case 'ready': return CheckCircleIcon
    case 'warning': return ExclamationTriangleIcon
    case 'failed': return XCircleIcon
    case 'pending': return ClockIcon
    case 'unavailable': return InformationCircleIcon
  }
}

function statusBgClass(status: EvidenceStatus): string {
  switch (status) {
    case 'ready': return 'bg-green-800 text-green-100 border-green-700'
    case 'warning': return 'bg-yellow-700 text-yellow-100 border-yellow-600'
    case 'failed': return 'bg-red-800 text-red-100 border-red-700'
    case 'pending': return 'bg-gray-600 text-gray-100 border-gray-500'
    case 'unavailable': return 'bg-gray-700 text-gray-200 border-gray-600'
  }
}

function sectionIconClass(status: EvidenceStatus): string {
  switch (status) {
    case 'ready': return 'text-green-400'
    case 'warning': return 'text-yellow-400'
    case 'failed': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

function summaryBannerClass(status: EvidenceStatus): string {
  switch (status) {
    case 'ready': return 'border-green-700 bg-green-900/20'
    case 'warning': return 'border-yellow-600 bg-yellow-900/20'
    case 'failed': return 'border-red-700 bg-red-900/20'
    default: return 'border-gray-600 bg-gray-800'
  }
}

function toggleSection(id: string): void {
  if (expandedSections.value.has(id)) {
    expandedSections.value.delete(id)
  } else {
    expandedSections.value.add(id)
  }
}

function isSectionExpanded(id: string): boolean {
  return expandedSections.value.has(id)
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function buildEvidenceBundle() {
  return {
    exportedAt: new Date().toISOString(),
    workspaceVersion: '1.0',
    overallStatus: overallStatus.value,
    overallStatusLabel: STATUS_LABELS[overallStatus.value],
    releaseGradeSectionsTotal: releaseGradeSections.value.length,
    releaseGradeSectionsReady: releaseGradeReadyCount.value,
    sections: evidenceSections.value.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      statusLabel: STATUS_LABELS[s.status],
      releaseGrade: s.releaseGrade,
      gradeLabel: s.releaseGrade ? RELEASE_GRADE_LABEL : PERMISSIVE_GRADE_LABEL,
      summary: s.summary,
      details: s.details,
      timestamp: s.timestamp,
    })),
  }
}

function downloadBlob(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportJSON(): void {
  exportStatus.value = 'exporting'
  try {
    const bundle = buildEvidenceBundle()
    const content = JSON.stringify(bundle, null, 2)
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    downloadBlob(content, 'application/json', `compliance-evidence-pack-${ts}.json`)
    exportStatus.value = 'success'
    if (exportResetTimeout) clearTimeout(exportResetTimeout)
    exportResetTimeout = setTimeout(() => { exportStatus.value = 'idle' }, 3000)
  } catch {
    exportStatus.value = 'error'
  }
}

function exportCSV(): void {
  exportStatus.value = 'exporting'
  try {
    const bundle = buildEvidenceBundle()
    const rows = [
      ['Section', 'Status', 'Status Label', 'Release Grade', 'Grade Label', 'Summary', 'Timestamp'],
      ...bundle.sections.map((s) => [
        s.title,
        s.status,
        s.statusLabel,
        s.releaseGrade ? 'Yes' : 'No',
        s.gradeLabel,
        `"${s.summary.replace(/"/g, '""')}"`,
        s.timestamp ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    downloadBlob(csv, 'text/csv', `compliance-evidence-pack-${ts}.csv`)
    exportStatus.value = 'success'
    if (exportResetTimeout) clearTimeout(exportResetTimeout)
    exportResetTimeout = setTimeout(() => { exportStatus.value = 'idle' }, 3000)
  } catch {
    exportStatus.value = 'error'
  }
}

function navigateTo(path: string | null): void {
  if (path) router.push(path)
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onBeforeUnmount(() => {
  if (exportResetTimeout) clearTimeout(exportResetTimeout)
})

onMounted(() => {
  try {
    loadEvidenceData()
    lastRefreshed.value = new Date().toISOString()
  } catch (err) {
    loadError.value = 'Unable to load evidence data. Please try refreshing the page.'
    console.error('[ComplianceEvidencePackView] loadEvidenceData failed:', err)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <MainLayout>
    <!-- Secondary in-page skip link (WCAG 2.4.1) -->
    <a
      href="#evidence-main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      Skip to evidence pack content
    </a>

    <div
      id="evidence-main"
      role="region"
      aria-label="Compliance Evidence Pack Workspace"
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
      data-testid="evidence-pack-workspace"
    >
      <div class="max-w-5xl mx-auto">

        <!-- ── Page Header ── -->
        <header class="mb-8" data-testid="evidence-pack-header">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <ClipboardDocumentCheckIcon class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  data-testid="evidence-pack-heading"
                >
                  Compliance Evidence Pack
                </h1>
                <p class="text-gray-300 text-sm mt-1">
                  Review, inspect, and export your release-grade compliance evidence bundle.
                  Designed for procurement review, legal sign-off, and internal audit.
                </p>
              </div>
            </div>

            <!-- Last refreshed -->
            <div
              class="flex-shrink-0 text-xs text-gray-400 sm:text-right mt-1"
              data-testid="last-refreshed"
              aria-label="Evidence last refreshed time"
            >
              <span v-if="lastRefreshed">
                Last refreshed: {{ new Date(lastRefreshed).toLocaleString() }}
              </span>
            </div>
          </div>

          <!-- Help text — explains what qualifies as release-grade evidence -->
          <div
            class="mt-4 p-4 rounded-xl bg-blue-900/20 border border-blue-700 text-sm text-blue-200"
            role="note"
            aria-label="Evidence pack description"
            data-testid="evidence-pack-description"
          >
            <InformationCircleIcon class="w-4 h-4 inline mr-1.5 align-middle" aria-hidden="true" />
            <strong>What is this?</strong>
            Release-grade evidence is formally verified material that meets procurement and audit standards.
            Developer-feedback evidence (permissive CI runs, informational checks) is clearly distinguished
            and <em>cannot substitute</em> for release-grade sign-off. Export actions produce a machine-readable
            bundle you can share with legal, compliance, or procurement teams.
          </div>
        </header>

        <!-- ── Loading State ── -->
        <div
          v-if="isLoading"
          role="status"
          aria-label="Loading compliance evidence"
          class="flex items-center justify-center py-24"
          data-testid="evidence-loading"
        >
          <div class="text-center">
            <div class="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4" aria-hidden="true"></div>
            <p class="text-gray-300 text-sm">Loading compliance evidence…</p>
          </div>
        </div>

        <!-- ── Error State ── -->
        <div
          v-else-if="loadError"
          role="alert"
          class="rounded-xl bg-red-900/30 border border-red-700 p-6 mb-6"
          data-testid="evidence-error"
        >
          <div class="flex items-start gap-3">
            <XCircleIcon class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 class="text-white font-semibold">Unable to Load Evidence</h2>
              <p class="text-red-200 text-sm mt-1">{{ loadError }}</p>
            </div>
          </div>
        </div>

        <!-- ── Main Content ── -->
        <template v-else>

          <!-- ── Release Readiness Summary Banner ── -->
          <section
            class="rounded-2xl p-6 mb-6 border shadow-lg"
            :class="summaryBannerClass(overallStatus)"
            aria-labelledby="readiness-summary-heading"
            data-testid="readiness-summary-banner"
            role="region"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex items-center gap-4">
                <!-- Status icon -->
                <div
                  class="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-4"
                  :class="{
                    'border-green-500 bg-green-900': overallStatus === 'ready',
                    'border-yellow-500 bg-yellow-900': overallStatus === 'warning',
                    'border-red-500 bg-red-900': overallStatus === 'failed',
                    'border-gray-500 bg-gray-800': overallStatus === 'pending' || overallStatus === 'unavailable',
                  }"
                  role="img"
                  :aria-label="`Overall release readiness: ${STATUS_LABELS[overallStatus]}`"
                  data-testid="overall-status-icon"
                >
                  <component
                    :is="statusIcon(overallStatus)"
                    class="w-8 h-8"
                    :class="sectionIconClass(overallStatus)"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h2
                    id="readiness-summary-heading"
                    class="text-xl font-bold text-white"
                    data-testid="overall-status-label"
                  >
                    {{ STATUS_LABELS[overallStatus] }}
                  </h2>
                  <p
                    class="text-sm text-gray-300 mt-0.5"
                    data-testid="overall-status-description"
                    aria-live="polite"
                  >
                    {{ STATUS_DESCRIPTIONS[overallStatus] }}
                  </p>

                  <!-- Release-grade progress -->
                  <div
                    class="mt-2 text-xs font-medium"
                    :class="{
                      'text-green-300': releaseGradeReadyCount === releaseGradeSections.length,
                      'text-yellow-300': releaseGradeReadyCount > 0 && releaseGradeReadyCount < releaseGradeSections.length,
                      'text-red-300': releaseGradeReadyCount === 0,
                    }"
                    role="status"
                    data-testid="release-grade-progress"
                  >
                    {{ releaseGradeReadyCount }} of {{ releaseGradeSections.length }} release-grade evidence sections ready
                  </div>
                </div>
              </div>

              <!-- Export actions -->
              <div
                class="flex flex-col sm:flex-row gap-2 flex-shrink-0"
                data-testid="export-actions"
              >
                <button
                  :disabled="!exportAvailable"
                  @click="exportJSON"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="exportAvailable
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-400'"
                  :aria-label="exportAvailable ? 'Export evidence bundle as JSON' : 'Export not available — evidence still loading'"
                  data-testid="export-json-button"
                >
                  <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
                  Export JSON
                </button>
                <button
                  :disabled="!exportAvailable"
                  @click="exportCSV"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="exportAvailable
                    ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                    : 'bg-gray-700 text-gray-400'"
                  :aria-label="exportAvailable ? 'Export evidence bundle as CSV' : 'Export not available — evidence still loading'"
                  data-testid="export-csv-button"
                >
                  <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
                  Export CSV
                </button>
              </div>
            </div>

            <!-- Export status feedback -->
            <div
              v-if="exportStatus !== 'idle'"
              role="status"
              aria-live="polite"
              class="mt-3 text-sm"
              :class="{
                'text-blue-300': exportStatus === 'exporting',
                'text-green-300': exportStatus === 'success',
                'text-red-300': exportStatus === 'error',
              }"
              data-testid="export-status-message"
            >
              <span v-if="exportStatus === 'exporting'">Preparing evidence bundle…</span>
              <span v-else-if="exportStatus === 'success'">Evidence bundle downloaded successfully.</span>
              <span v-else-if="exportStatus === 'error'">Export failed. Please try again.</span>
            </div>
          </section>

          <!-- ── Grade Distinction Notice ── -->
          <div
            class="mb-6 p-4 rounded-xl bg-gray-800 border border-gray-600 text-sm text-gray-300"
            role="note"
            aria-label="Evidence grade explanation"
            data-testid="grade-distinction-notice"
          >
            <div class="flex items-start gap-2">
              <InformationCircleIcon class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span class="font-semibold text-white">Evidence grading:</span>
                Sections labelled
                <span class="inline-flex items-center px-2 py-0.5 rounded bg-blue-800 text-blue-100 text-xs font-medium mx-1" aria-label="Release-Grade badge">Release-Grade</span>
                are formally verified and suitable for procurement or audit review.
                Sections labelled
                <span class="inline-flex items-center px-2 py-0.5 rounded bg-gray-600 text-gray-200 text-xs font-medium mx-1" aria-label="Developer Feedback badge">Developer Feedback</span>
                provide supplemental context but are
                <strong class="text-white">not</strong> equivalent to release sign-off.
              </div>
            </div>
          </div>

          <!-- ── Evidence Sections ── -->
          <section
            aria-label="Evidence sections"
            data-testid="evidence-sections"
          >
            <h2 class="text-lg font-semibold text-white mb-4" data-testid="evidence-sections-heading">
              Evidence by Section
            </h2>

            <div class="space-y-4">
              <article
                v-for="section in evidenceSections"
                :key="section.id"
                class="rounded-xl border bg-gray-800 shadow-sm"
                :class="{
                  'border-green-700': section.status === 'ready',
                  'border-yellow-600': section.status === 'warning',
                  'border-red-700': section.status === 'failed',
                  'border-gray-600': section.status === 'pending' || section.status === 'unavailable',
                }"
                :data-testid="`evidence-section-${section.id}`"
                :aria-labelledby="`section-heading-${section.id}`"
              >
                <!-- Section header (always visible) -->
                <div class="p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3 flex-1 min-w-0">
                      <!-- Status icon -->
                      <component
                        :is="statusIcon(section.status)"
                        class="w-5 h-5 flex-shrink-0 mt-0.5"
                        :class="sectionIconClass(section.status)"
                        aria-hidden="true"
                      />

                      <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <h3
                            :id="`section-heading-${section.id}`"
                            class="text-white font-semibold text-sm"
                            :data-testid="`section-title-${section.id}`"
                          >
                            {{ section.title }}
                          </h3>

                          <!-- Status badge -->
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                            :class="statusBgClass(section.status)"
                            :aria-label="`Status: ${STATUS_LABELS[section.status]}`"
                            :data-testid="`section-status-badge-${section.id}`"
                          >
                            {{ STATUS_LABELS[section.status] }}
                          </span>

                          <!-- Grade badge -->
                          <span
                            v-if="section.releaseGrade"
                            class="inline-flex items-center px-2 py-0.5 rounded bg-blue-800 text-blue-100 text-xs font-medium"
                            aria-label="Release-grade evidence"
                            :data-testid="`section-grade-badge-${section.id}`"
                          >
                            Release-Grade
                          </span>
                          <span
                            v-else
                            class="inline-flex items-center px-2 py-0.5 rounded bg-gray-600 text-gray-200 text-xs font-medium"
                            aria-label="Developer feedback — not release sign-off"
                          >
                            Developer Feedback
                          </span>
                        </div>

                        <p
                          class="text-gray-300 text-xs mt-1"
                          :data-testid="`section-summary-${section.id}`"
                        >
                          {{ section.summary }}
                        </p>

                        <!-- Timestamp -->
                        <p
                          v-if="section.timestamp"
                          class="text-gray-500 text-xs mt-0.5"
                          :aria-label="`Evidence recorded: ${formatTimestamp(section.timestamp)}`"
                          :data-testid="`section-timestamp-${section.id}`"
                        >
                          <ClockIcon class="w-3 h-3 inline mr-1" aria-hidden="true" />
                          {{ formatTimestamp(section.timestamp) }}
                        </p>
                      </div>
                    </div>

                    <!-- Expand/collapse toggle -->
                    <button
                      @click="toggleSection(section.id)"
                      class="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      :aria-expanded="isSectionExpanded(section.id)"
                      :aria-controls="`section-details-${section.id}`"
                      :aria-label="`${isSectionExpanded(section.id) ? 'Collapse' : 'Expand'} ${section.title} details`"
                      :data-testid="`section-toggle-${section.id}`"
                    >
                      <ChevronUpIcon v-if="isSectionExpanded(section.id)" class="w-4 h-4" aria-hidden="true" />
                      <ChevronDownIcon v-else class="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <!-- Section details (expanded) -->
                <div
                  v-if="isSectionExpanded(section.id)"
                  :id="`section-details-${section.id}`"
                  class="border-t border-gray-700 px-4 pb-4 pt-3"
                  :data-testid="`section-details-${section.id}`"
                >
                  <ul
                    class="space-y-1.5"
                    aria-label="Evidence detail items"
                  >
                    <li
                      v-for="(detail, idx) in section.details"
                      :key="idx"
                      class="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0 mt-1.5" aria-hidden="true"></span>
                      {{ detail }}
                    </li>
                  </ul>

                  <!-- Action link -->
                  <button
                    v-if="section.actionLabel && section.actionPath"
                    @click="navigateTo(section.actionPath)"
                    class="mt-3 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                    :aria-label="`${section.actionLabel} — opens ${section.title} details`"
                    :data-testid="`section-action-${section.id}`"
                  >
                    {{ section.actionLabel }} →
                  </button>
                </div>
              </article>
            </div>
          </section>

          <!-- ── Export Bundle Contents Table ── -->
          <section
            class="mt-8 rounded-xl border border-gray-600 bg-gray-800 overflow-hidden"
            aria-labelledby="export-table-heading"
            data-testid="export-bundle-table"
          >
            <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h2
                id="export-table-heading"
                class="text-sm font-semibold text-white"
              >
                Export Bundle Contents
              </h2>
              <span class="text-xs text-gray-400">
                {{ evidenceSections.length }} sections · {{ releaseGradeReadyCount }} release-grade ready
              </span>
            </div>
            <div class="overflow-x-auto">
              <table
                class="w-full text-sm"
                aria-label="Compliance evidence bundle summary"
              >
                <thead class="bg-gray-900">
                  <tr>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Section</th>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade</th>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Last Updated</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                  <tr
                    v-for="section in evidenceSections"
                    :key="section.id"
                    :data-testid="`table-row-${section.id}`"
                  >
                    <td class="px-4 py-3 text-gray-200 font-medium">{{ section.title }}</td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center gap-1 text-xs font-medium"
                        :class="sectionIconClass(section.status)"
                      >
                        <component :is="statusIcon(section.status)" class="w-3.5 h-3.5" aria-hidden="true" />
                        {{ STATUS_LABELS[section.status] }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        v-if="section.releaseGrade"
                        class="inline-flex px-2 py-0.5 rounded text-xs bg-blue-800 text-blue-100"
                      >
                        Release-Grade
                      </span>
                      <span
                        v-else
                        class="inline-flex px-2 py-0.5 rounded text-xs bg-gray-600 text-gray-300"
                      >
                        Dev Feedback
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                      {{ formatTimestamp(section.timestamp) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ── Navigation links ── -->
          <nav
            class="mt-6 flex flex-wrap gap-3"
            aria-label="Related compliance sections"
            data-testid="related-links-nav"
          >
            <router-link
              to="/compliance/launch"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
            >
              Compliance Launch Console
            </router-link>
            <router-link
              to="/compliance/setup"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
            >
              Compliance Setup
            </router-link>
            <router-link
              to="/compliance/policy"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
            >
              Whitelist Policy
            </router-link>
            <router-link
              to="/attestations"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
            >
              Attestations Dashboard
            </router-link>
            <router-link
              to="/compliance/reporting"
              class="text-sm text-teal-400 hover:text-teal-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
              data-testid="reporting-workspace-link"
            >
              Compliance Reporting Workspace
            </router-link>
          </nav>

        </template>
      </div>
    </div>
  </MainLayout>
</template>
