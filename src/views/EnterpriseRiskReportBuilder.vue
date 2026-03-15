<template>
  <MainLayout>
    <!-- Skip link (WCAG 2.4.1) -->
    <a
      href="#risk-report-main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>

    <div
      id="risk-report-main"
      role="region"
      aria-label="Enterprise Risk Report Builder"
      data-testid="enterprise-risk-report-builder"
    >
      <div class="max-w-6xl mx-auto py-8 px-4">

        <!-- Page Header -->
        <header class="mb-8" data-testid="risk-report-header">
          <div class="flex items-start gap-3 mb-2">
            <ShieldExclamationIcon class="w-8 h-8 text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h1 class="text-2xl font-bold text-white" data-testid="risk-report-heading">
                Enterprise Risk Report Builder
              </h1>
              <p class="text-gray-300 text-sm mt-1">
                Configure an audience-specific compliance report, review explainable risk scoring, and export a tailored summary for operator, executive, or procurement review.
              </p>
            </div>
          </div>
        </header>

        <!-- Loading -->
        <div
          v-if="isLoading"
          class="flex items-center justify-center py-20"
          data-testid="loading-state"
          aria-live="polite"
          aria-label="Loading compliance data"
        >
          <div class="text-center">
            <ArrowPathIcon class="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" aria-hidden="true" />
            <p class="text-gray-300 text-sm">Loading compliance data…</p>
          </div>
        </div>

        <template v-else>

          <!-- ── Risk Score Banner ── -->
          <section
            class="mb-6 rounded-2xl border p-6 shadow-lg"
            :class="riskBannerClass"
            aria-labelledby="risk-score-heading"
            data-testid="risk-score-banner"
          >
            <div class="flex flex-col sm:flex-row sm:items-start gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <component :is="riskBandIcon" class="w-5 h-5 flex-shrink-0" :class="riskBandIconClass" aria-hidden="true" />
                  <h2 id="risk-score-heading" class="text-base font-semibold text-white">
                    Overall Risk Assessment
                  </h2>
                </div>
                <p class="text-sm font-semibold mb-1" :class="riskBandTextClass" data-testid="risk-band-label">
                  {{ RISK_BAND_LABELS[assessment.overallBand] }}
                </p>
                <p class="text-xs text-gray-400 mb-3" data-testid="risk-band-description">
                  {{ RISK_BAND_DESCRIPTIONS[assessment.overallBand] }}
                </p>

                <!-- Risk score meter -->
                <div class="mb-2">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-gray-400">Risk Score (higher = higher risk)</span>
                    <span class="text-xs font-bold" :class="riskBandTextClass" data-testid="risk-score-value">
                      {{ assessment.overallScore }}/100
                    </span>
                  </div>
                  <div
                    class="h-2 bg-gray-700 rounded-full overflow-hidden"
                    role="progressbar"
                    :aria-valuenow="assessment.overallScore"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`Risk score: ${assessment.overallScore} out of 100`"
                    data-testid="risk-score-bar"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="riskScoreBarClass"
                      :style="{ width: `${assessment.overallScore}%` }"
                    />
                  </div>
                </div>

                <!-- Heuristic disclaimer -->
                <p class="text-xs text-gray-500 mt-2" data-testid="heuristic-disclaimer">
                  <InformationCircleIcon class="w-3 h-3 inline-block mr-1 align-text-bottom" aria-hidden="true" />
                  Heuristic score — not a certified regulatory assessment.
                  <button
                    type="button"
                    class="underline text-gray-400 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
                    @click="showDisclaimerModal = true"
                    aria-label="View full heuristic score disclaimer"
                    data-testid="disclaimer-btn"
                  >
                    Learn more
                  </button>
                </p>
              </div>

              <!-- Readiness crossref -->
              <div class="sm:text-right">
                <div class="text-xs text-gray-400 mb-1">Readiness Score</div>
                <div class="text-2xl font-bold text-white" data-testid="readiness-score-crossref">
                  {{ bundle.readinessScore }}%
                </div>
                <div class="text-xs text-gray-400">compliance readiness</div>
              </div>
            </div>

            <!-- Incomplete sources notice -->
            <div
              v-if="assessment.incompleteSources.length > 0"
              class="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg"
              role="status"
              aria-label="Incomplete evidence sources"
              data-testid="incomplete-sources-notice"
            >
              <p class="text-xs text-yellow-200 font-medium flex items-start gap-1">
                <ExclamationTriangleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                Some evidence sources could not be read:
                {{ assessment.incompleteSources.join(', ') }}.
                The risk score may understate the actual risk.
              </p>
            </div>
          </section>

          <!-- ── Top Risk Factors ── -->
          <section
            class="mb-6 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg"
            aria-labelledby="top-risks-heading"
            data-testid="top-risks-section"
          >
            <h2 id="top-risks-heading" class="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <FireIcon class="w-5 h-5 text-orange-400" aria-hidden="true" />
              Top Risk Factors
            </h2>

            <div v-if="assessment.factors.length === 0" class="text-sm text-green-400 flex items-center gap-2" data-testid="no-risk-factors">
              <CheckCircleIcon class="w-5 h-5" aria-hidden="true" />
              No significant risk factors identified. All key evidence is present and current.
            </div>

            <ol v-else class="space-y-4" aria-label="Risk factors ordered by severity">
              <li
                v-for="(factor, index) in assessment.factors"
                :key="factor.id"
                class="p-4 rounded-xl border"
                :class="riskFactorCardClass(factor.band)"
                :data-testid="`risk-factor-${factor.id}`"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    :class="riskFactorNumberClass(factor.band)"
                    aria-hidden="true"
                  >{{ index + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="text-sm font-semibold text-white">{{ factor.label }}</span>
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        :class="riskBandBadgeClass(factor.band)"
                      >
                        <component :is="riskBandSmallIcon(factor.band)" class="w-3 h-3" aria-hidden="true" />
                        {{ RISK_BAND_LABELS[factor.band] }}
                      </span>
                      <span v-if="factor.isStale" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-900 text-yellow-300">
                        <ClockIcon class="w-3 h-3" aria-hidden="true" />
                        Stale ({{ factor.staleDays }}d)
                      </span>
                    </div>
                    <p class="text-xs text-gray-300 mb-2">{{ factor.description }}</p>
                    <div class="flex items-start gap-1 text-xs">
                      <ArrowRightCircleIcon class="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span class="text-blue-300">
                        <strong class="text-blue-200">Action:</strong> {{ factor.recommendation }}
                        <router-link
                          v-if="factor.evidencePath"
                          :to="factor.evidencePath"
                          class="ml-1 underline text-blue-400 hover:text-blue-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
                          :aria-label="`Go to ${factor.label} evidence`"
                        >
                          Go →
                        </router-link>
                      </span>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="text-lg font-bold" :class="riskBandTextClass" data-testid="factor-score">
                      {{ factor.score }}
                    </div>
                    <div class="text-xs text-gray-500">pts</div>
                  </div>
                </div>
              </li>
            </ol>
          </section>

          <!-- ── Recommended Actions ── -->
          <section
            v-if="assessment.recommendedActions.length > 0"
            class="mb-6 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg"
            aria-labelledby="recommendations-heading"
            data-testid="recommendations-section"
          >
            <h2 id="recommendations-heading" class="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <LightBulbIcon class="w-5 h-5 text-yellow-400" aria-hidden="true" />
              Recommended Next Actions
            </h2>
            <ol class="space-y-2" aria-label="Recommended actions ordered by priority">
              <li
                v-for="(action, i) in assessment.recommendedActions"
                :key="i"
                class="flex items-start gap-2 text-sm text-gray-200"
                :data-testid="`recommendation-${i}`"
              >
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-900 border border-blue-600 flex items-center justify-center text-xs font-bold text-blue-300" aria-hidden="true">
                  {{ i + 1 }}
                </span>
                {{ action }}
              </li>
            </ol>
          </section>

          <!-- ── Report Preset Selector ── -->
          <section
            class="mb-6 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg"
            aria-labelledby="preset-selector-heading"
            data-testid="preset-selector-section"
          >
            <h2 id="preset-selector-heading" class="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Cog6ToothIcon class="w-5 h-5 text-gray-400" aria-hidden="true" />
              Report Preset
            </h2>
            <p class="text-xs text-gray-400 mb-4">
              Select the audience for this report. Each preset determines which sections are included by default. You can further customise sections below.
            </p>

            <div class="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Report preset selection">
              <button
                v-for="p in PRESETS"
                :key="p.id"
                type="button"
                role="radio"
                :aria-checked="selectedPreset === p.id"
                :aria-describedby="`preset-desc-${p.id}`"
                :data-testid="`preset-btn-${p.id}`"
                class="text-left p-4 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="selectedPreset === p.id
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'"
                @click="selectPreset(p.id)"
              >
                <div class="flex items-center gap-2 mb-1">
                  <component :is="p.icon" class="w-4 h-4 flex-shrink-0" :class="selectedPreset === p.id ? 'text-blue-400' : 'text-gray-400'" aria-hidden="true" />
                  <span class="text-sm font-medium">{{ p.label }}</span>
                  <span v-if="selectedPreset === p.id" class="ml-auto">
                    <CheckCircleIcon class="w-4 h-4 text-blue-400" aria-hidden="true" />
                  </span>
                </div>
                <p :id="`preset-desc-${p.id}`" class="text-xs text-gray-400 mt-1">{{ p.description }}</p>
              </button>
            </div>
          </section>

          <!-- ── Section Inclusion Controls ── -->
          <section
            class="mb-6 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg"
            aria-labelledby="section-controls-heading"
            data-testid="section-controls-section"
          >
            <h2 id="section-controls-heading" class="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <AdjustmentsHorizontalIcon class="w-5 h-5 text-gray-400" aria-hidden="true" />
              Report Sections
            </h2>
            <p class="text-xs text-gray-400 mb-4">
              Toggle sections to include or exclude them from the exported report. Sections that are excluded will be labeled as omitted in the output.
            </p>

            <ul class="space-y-2" aria-label="Report section toggles">
              <li
                v-for="def in REPORT_SECTION_DEFS"
                :key="def.id"
                class="flex items-center justify-between p-3 rounded-lg bg-gray-700/30"
                :data-testid="`section-toggle-row-${def.id}`"
              >
                <div>
                  <p class="text-sm font-medium text-white">{{ def.label }}</p>
                  <p class="text-xs text-gray-400">{{ def.description }}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="isSectionIncluded(def.id)"
                  :aria-label="`${isSectionIncluded(def.id) ? 'Exclude' : 'Include'} ${def.label} section`"
                  :data-testid="`section-toggle-${def.id}`"
                  class="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                  :class="isSectionIncluded(def.id) ? 'bg-blue-600' : 'bg-gray-600'"
                  @click="toggleSection(def.id)"
                >
                  <span
                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition"
                    :class="isSectionIncluded(def.id) ? 'translate-x-4' : 'translate-x-0'"
                    aria-hidden="true"
                  />
                </button>
              </li>
            </ul>
          </section>

          <!-- ── Export Actions ── -->
          <section
            class="mb-6 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg"
            aria-labelledby="export-heading"
            data-testid="export-section"
          >
            <h2 id="export-heading" class="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <ArrowDownTrayIcon class="w-5 h-5 text-gray-400" aria-hidden="true" />
              Export Report
            </h2>
            <p class="text-xs text-gray-400 mb-4">
              Download or copy the report for sharing with stakeholders.
              The selected preset ({{ PRESET_LABELS[selectedPreset] }}) and section configuration will be reflected in the output.
            </p>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                :disabled="exportStatus === 'exporting'"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="exportStatus === 'exporting'
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-600 text-white'"
                aria-label="Export report as JSON file"
                data-testid="export-json-btn"
                @click="exportJson"
              >
                <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
                Download JSON
              </button>

              <button
                type="button"
                :disabled="exportStatus === 'exporting'"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="exportStatus === 'exporting'
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'"
                aria-label="Export report as plain text file"
                data-testid="export-text-btn"
                @click="exportText"
              >
                <DocumentTextIcon class="w-4 h-4" aria-hidden="true" />
                Download Text
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Copy report to clipboard"
                data-testid="copy-clipboard-btn"
                @click="copyToClipboard"
              >
                <ClipboardDocumentCheckIcon class="w-4 h-4" aria-hidden="true" />
                Copy to Clipboard
              </button>
            </div>

            <!-- Export feedback -->
            <div
              v-if="exportStatus !== 'idle'"
              role="status"
              aria-live="polite"
              class="mt-3 flex items-center gap-2 text-sm"
              :class="exportStatus === 'success' ? 'text-green-400' : exportStatus === 'error' ? 'text-red-400' : 'text-gray-400'"
              data-testid="export-status-message"
            >
              <CheckCircleIcon v-if="exportStatus === 'success'" class="w-4 h-4" aria-hidden="true" />
              <XCircleIcon v-else-if="exportStatus === 'error'" class="w-4 h-4" aria-hidden="true" />
              <ArrowPathIcon v-else class="w-4 h-4 animate-spin" aria-hidden="true" />
              {{ exportStatusMessage }}
            </div>
          </section>

          <!-- ── Workspace Navigation ── -->
          <nav
            aria-label="Compliance workspace navigation"
            class="mb-6"
            data-testid="workspace-nav"
          >
            <h2 class="sr-only">Related workspaces</h2>
            <div class="flex flex-wrap gap-3">
              <router-link
                to="/compliance/reporting"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                data-testid="nav-link-reporting"
              >
                <ClipboardDocumentCheckIcon class="w-4 h-4" aria-hidden="true" />
                Reporting Workspace
              </router-link>
              <router-link
                to="/compliance/launch"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                data-testid="nav-link-launch"
              >
                Launch Console
              </router-link>
              <router-link
                to="/compliance/evidence"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                data-testid="nav-link-evidence"
              >
                Evidence Pack
              </router-link>
              <router-link
                to="/compliance/setup"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                data-testid="nav-link-setup"
              >
                Compliance Setup
              </router-link>
            </div>
          </nav>

        </template>
      </div>
    </div>

    <!-- Disclaimer Modal -->
    <Teleport to="body">
      <div
        v-if="showDisclaimerModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-modal-title"
        data-testid="disclaimer-modal"
        @keydown.esc="showDisclaimerModal = false"
      >
        <div class="absolute inset-0 bg-black/60" @click="showDisclaimerModal = false" aria-hidden="true" />
        <div class="relative bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl max-w-lg w-full p-6">
          <h3 id="disclaimer-modal-title" class="text-base font-semibold text-white mb-3">
            Risk Score Disclaimer
          </h3>
          <p class="text-sm text-gray-300 leading-relaxed">{{ HEURISTIC_DISCLAIMER }}</p>
          <button
            type="button"
            class="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-blue-700 hover:bg-blue-600 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            data-testid="close-disclaimer-btn"
            @click="showDisclaimerModal = false"
          >
            Close
          </button>
        </div>
      </div>
    </Teleport>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * Enterprise Risk Report Builder
 *
 * Extends the compliance reporting workspace with:
 *  - Explainable risk scoring (heuristic, 0–100, higher = higher risk)
 *  - Three audience-specific report presets: operator, executive, procurement
 *  - Section inclusion/exclusion controls
 *  - JSON, text, and clipboard export
 *  - WCAG 2.1 AA: landmarks, headings, accessible names, non-color-only status,
 *    keyboard navigation, focus rings, aria-live regions
 */

import { ref, computed, onMounted, onBeforeUnmount, type Component } from 'vue'
import MainLayout from '../layout/MainLayout.vue'
import {
  ShieldExclamationIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ArrowRightCircleIcon,
  FireIcon,
  LightBulbIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  PresentationChartBarIcon,
  BriefcaseIcon,
} from '@heroicons/vue/24/outline'

import {
  REPORT_SECTION_DEFS,
  PRESET_LABELS,
  PRESET_DESCRIPTIONS,
  RISK_BAND_LABELS,
  RISK_BAND_DESCRIPTIONS,
  HEURISTIC_DISCLAIMER,
  computeRiskAssessment,
  buildCustomReportPayload,
  formatReportAsText,
  daysSince,
  type RiskAssessment,
  type ReportPreset,
  type RiskBand,
} from '../utils/enterpriseRiskScoring'

import {
  type ComplianceReportBundle,
} from '../utils/complianceEvidencePack'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const isLoading = ref(true)
const showDisclaimerModal = ref(false)
const exportStatus = ref<'idle' | 'exporting' | 'success' | 'error'>('idle')
const exportStatusMessage = ref('')
let exportResetTimeout: ReturnType<typeof setTimeout> | null = null

const selectedPreset = ref<ReportPreset>('operator')
const sectionOverrides = ref<Map<string, boolean>>(new Map())

// ---------------------------------------------------------------------------
// Bundle + assessment
// ---------------------------------------------------------------------------

const bundle = ref<ComplianceReportBundle>({
  generatedAt: new Date().toISOString(),
  launchName: null,
  overallStatus: 'pending',
  readinessScore: 0,
  jurisdiction: {
    configured: false,
    jurisdictions: [],
    restrictedCount: 0,
    permittedCount: 0,
    staleSince: null,
  },
  kycAml: {
    status: 'pending',
    kycRequired: false,
    amlRequired: false,
    providerConfigured: false,
    pendingReviewCount: 0,
    staleSince: null,
  },
  whitelist: {
    status: 'pending',
    whitelistRequired: false,
    approvedInvestorCount: 0,
    pendingInvestorCount: 0,
    activeWhitelistId: null,
    staleSince: null,
  },
  investorEligibility: {
    status: 'pending',
    accreditedRequired: false,
    retailPermitted: true,
    eligibilityCategories: [],
    staleSince: null,
  },
  evidenceSections: [],
  exportVersion: '1.0',
})

const assessment = ref<RiskAssessment>(computeRiskAssessment(bundle.value))

// ---------------------------------------------------------------------------
// Preset definitions (for UI rendering)
// ---------------------------------------------------------------------------

const PRESETS: Array<{ id: ReportPreset; label: string; description: string; icon: Component }> = [
  {
    id: 'operator',
    label: PRESET_LABELS.operator,
    description: PRESET_DESCRIPTIONS.operator,
    icon: UserIcon,
  },
  {
    id: 'executive',
    label: PRESET_LABELS.executive,
    description: PRESET_DESCRIPTIONS.executive,
    icon: PresentationChartBarIcon,
  },
  {
    id: 'procurement',
    label: PRESET_LABELS.procurement,
    description: PRESET_DESCRIPTIONS.procurement,
    icon: BriefcaseIcon,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// daysSince is imported from ../utils/enterpriseRiskScoring (includes isNaN guard)

function buildTimestamp(offsetMinutes = 0): string {
  const d = new Date(Date.now() - offsetMinutes * 60 * 1000)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadBundle(): void {
  try {
    const complianceRaw = localStorage.getItem('biatec_compliance_setup')
    const complianceData = complianceRaw ? JSON.parse(complianceRaw) : null
    const form = complianceData?.currentForm ?? {}

    const whitelistRaw = localStorage.getItem('biatec_whitelist_setup')
    const whitelistData = whitelistRaw ? JSON.parse(whitelistRaw) : null

    const kycRaw = localStorage.getItem('biatec_kyc_aml_setup')
    const kycData = kycRaw ? JSON.parse(kycRaw) : null

    // --- Jurisdiction ---
    const juris = form.jurisdictions ?? []
    const restrictedList: string[] = form.restrictedJurisdictions ?? []
    const jurisdictionStaleSince = form.jurisdictionLastUpdated ?? null

    bundle.value.jurisdiction = {
      configured: juris.length > 0 || form.defaultBehavior === 'deny',
      jurisdictions: juris,
      permittedCount: juris.filter((j: string) => !restrictedList.includes(j)).length,
      restrictedCount: restrictedList.length,
      staleSince: jurisdictionStaleSince,
    }

    // --- KYC/AML ---
    const kycRequired: boolean = form.kycRequired ?? kycData?.kycRequired ?? false
    const amlRequired: boolean = form.amlRequired ?? kycData?.amlRequired ?? false
    const providerConfigured: boolean =
      !!(form.kycProvider ?? kycData?.provider) ||
      (!kycRequired && !amlRequired)
    const pendingReviewCount: number = kycData?.pendingCount ?? 0
    const kycStaleSince: string | null = kycData?.lastUpdated ?? form.kycLastUpdated ?? null

    bundle.value.kycAml = {
      status:
        kycRequired && !providerConfigured
          ? 'failed'
          : kycStaleSince && (daysSince(kycStaleSince) ?? 0) > 30
            ? 'warning'
            : (kycRequired || amlRequired) && providerConfigured
              ? 'ready'
              : 'pending',
      kycRequired,
      amlRequired,
      providerConfigured,
      pendingReviewCount,
      staleSince: kycStaleSince,
    }

    // --- Whitelist ---
    const whitelistRequired: boolean =
      form.whitelistRequired ?? whitelistData?.required ?? false
    const approvedCount: number = whitelistData?.approvedCount ?? 0
    const pendingCount: number = whitelistData?.pendingCount ?? 0
    const activeId: string | null = whitelistData?.activeId ?? null
    const whitelistStaleSince: string | null = whitelistData?.lastUpdated ?? null

    bundle.value.whitelist = {
      status:
        whitelistRequired && !activeId
          ? 'failed'
          : whitelistRequired && approvedCount === 0
            ? 'failed'
            : whitelistRequired && (daysSince(whitelistStaleSince) ?? 0) > 30
              ? 'warning'
              : whitelistRequired
                ? 'ready'
                : 'pending',
      whitelistRequired,
      approvedInvestorCount: approvedCount,
      pendingInvestorCount: pendingCount,
      activeWhitelistId: activeId,
      staleSince: whitelistStaleSince,
    }

    // --- Investor eligibility ---
    const accreditedRequired: boolean = form.accreditationRequired ?? false
    const retailPermitted: boolean = form.retailPermitted ?? true
    const categories: string[] = form.eligibilityCategories ?? []
    const eligStaleSince: string | null = form.eligibilityLastUpdated ?? null

    bundle.value.investorEligibility = {
      status:
        !accreditedRequired && !form.eligibilityCategories
          ? 'pending'
          : eligStaleSince && (daysSince(eligStaleSince) ?? 0) > 30
            ? 'warning'
            : 'ready',
      accreditedRequired,
      retailPermitted,
      eligibilityCategories: categories,
      staleSince: eligStaleSince,
    }

    // --- Evidence sections (simplified from evidence pack view) ---
    bundle.value.evidenceSections = [
      {
        id: 'accessibility',
        title: 'Accessibility Sign-off',
        status: localStorage.getItem('biatec_accessibility_evidence') ? 'ready' : 'pending',
        releaseGrade: true,
        summary: 'WCAG 2.1 AA accessibility compliance evidence.',
        details: [],
        timestamp: buildTimestamp(60),
        actionLabel: null,
        actionPath: null,
      },
      {
        id: 'backend-deployment',
        title: 'Backend Deployment Sign-off',
        status: localStorage.getItem('biatec_strict_signoff') ? 'ready' : 'pending',
        releaseGrade: true,
        summary: 'Strict backend deployment verification.',
        details: [],
        timestamp: buildTimestamp(30),
        actionLabel: null,
        actionPath: null,
      },
    ]

    // --- Overall status & readiness ---
    const statuses = [
      bundle.value.kycAml.status,
      bundle.value.whitelist.status,
      bundle.value.investorEligibility.status,
      bundle.value.jurisdiction.configured ? 'ready' : 'failed',
    ] as const

    const hasFailed = statuses.some(s => s === 'failed')
    const hasWarning = statuses.some(s => s === 'warning')
    const hasPending = statuses.some(s => s === 'pending')

    bundle.value.overallStatus = hasFailed
      ? 'failed'
      : hasWarning
        ? 'warning'
        : hasPending
          ? 'pending'
          : 'ready'

    // Readiness: invert risk score (100 - riskScore = readiness)
    const riskResult = computeRiskAssessment(bundle.value)
    bundle.value.readinessScore = Math.max(0, 100 - riskResult.overallScore)
    bundle.value.generatedAt = new Date().toISOString()

    // --- Run final assessment ---
    assessment.value = computeRiskAssessment(bundle.value)
  } catch {
    // On any parse error, keep defaults
  }
}

// ---------------------------------------------------------------------------
// Preset and section controls
// ---------------------------------------------------------------------------

function selectPreset(preset: ReportPreset): void {
  selectedPreset.value = preset
  // Reset overrides when switching preset so the new preset's defaults apply
  sectionOverrides.value = new Map()
}

function isSectionIncluded(sectionId: string): boolean {
  const override = sectionOverrides.value.get(sectionId)
  if (override !== undefined) return override
  return (
    REPORT_SECTION_DEFS.find(d => d.id === sectionId)?.defaultForPresets.includes(
      selectedPreset.value,
    ) ?? false
  )
}

function toggleSection(sectionId: string): void {
  const current = isSectionIncluded(sectionId)
  sectionOverrides.value.set(sectionId, !current)
  // Trigger reactivity
  sectionOverrides.value = new Map(sectionOverrides.value)
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function buildPayload() {
  return buildCustomReportPayload(
    selectedPreset.value,
    bundle.value,
    assessment.value,
    sectionOverrides.value,
  )
}

function exportJson(): void {
  exportStatus.value = 'exporting'
  exportStatusMessage.value = 'Preparing JSON export…'
  try {
    const payload = buildPayload()
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `biatec-risk-report-${selectedPreset.value}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    exportStatus.value = 'success'
    exportStatusMessage.value = 'JSON report downloaded.'
  } catch {
    exportStatus.value = 'error'
    exportStatusMessage.value = 'Export failed. Please try again.'
  }
  scheduleExportReset()
}

function exportText(): void {
  exportStatus.value = 'exporting'
  exportStatusMessage.value = 'Preparing text export…'
  try {
    const payload = buildPayload()
    const text = formatReportAsText(payload)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `biatec-risk-report-${selectedPreset.value}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    exportStatus.value = 'success'
    exportStatusMessage.value = 'Text report downloaded.'
  } catch {
    exportStatus.value = 'error'
    exportStatusMessage.value = 'Export failed. Please try again.'
  }
  scheduleExportReset()
}

async function copyToClipboard(): Promise<void> {
  exportStatus.value = 'exporting'
  exportStatusMessage.value = 'Copying to clipboard…'
  try {
    const payload = buildPayload()
    const text = formatReportAsText(payload)
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    exportStatus.value = 'success'
    exportStatusMessage.value = 'Report copied to clipboard.'
  } catch {
    exportStatus.value = 'error'
    exportStatusMessage.value = 'Clipboard access denied. Try downloading instead.'
  }
  scheduleExportReset()
}

function scheduleExportReset(): void {
  if (exportResetTimeout !== null) clearTimeout(exportResetTimeout)
  exportResetTimeout = setTimeout(() => {
    exportStatus.value = 'idle'
    exportStatusMessage.value = ''
  }, 4000)
}

// ---------------------------------------------------------------------------
// Risk band visual helpers
// ---------------------------------------------------------------------------

const riskBandIcon = computed(() => {
  switch (assessment.value.overallBand) {
    case 'critical':
    case 'high':
      return XCircleIcon
    case 'medium':
      return ExclamationTriangleIcon
    default:
      return CheckCircleIcon
  }
})

const riskBandIconClass = computed(() => bandIconClass(assessment.value.overallBand))

const riskBandTextClass = computed(() => bandTextClass(assessment.value.overallBand))

const riskBannerClass = computed((): string => {
  switch (assessment.value.overallBand) {
    case 'critical':
      return 'border-red-700 bg-red-950'
    case 'high':
      return 'border-orange-700 bg-orange-950'
    case 'medium':
      return 'border-yellow-700 bg-yellow-950'
    case 'low':
      return 'border-blue-700 bg-blue-950'
    default:
      return 'border-green-700 bg-green-950'
  }
})

const riskScoreBarClass = computed((): string => {
  switch (assessment.value.overallBand) {
    case 'critical':
      return 'bg-red-500'
    case 'high':
      return 'bg-orange-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-blue-500'
    default:
      return 'bg-green-500'
  }
})

function bandTextClass(band: RiskBand): string {
  switch (band) {
    case 'critical':
      return 'text-red-400'
    case 'high':
      return 'text-orange-400'
    case 'medium':
      return 'text-yellow-400'
    case 'low':
      return 'text-blue-400'
    default:
      return 'text-green-400'
  }
}

function bandIconClass(band: RiskBand): string {
  return bandTextClass(band)
}

function riskFactorCardClass(band: RiskBand): string {
  switch (band) {
    case 'critical':
      return 'border-red-800 bg-red-900/20'
    case 'high':
      return 'border-orange-800 bg-orange-900/20'
    case 'medium':
      return 'border-yellow-800 bg-yellow-900/20'
    case 'low':
      return 'border-blue-800 bg-blue-900/20'
    default:
      return 'border-green-800 bg-green-900/20'
  }
}

function riskFactorNumberClass(band: RiskBand): string {
  switch (band) {
    case 'critical':
      return 'bg-red-800 text-red-200'
    case 'high':
      return 'bg-orange-800 text-orange-200'
    case 'medium':
      return 'bg-yellow-800 text-yellow-200'
    case 'low':
      return 'bg-blue-800 text-blue-200'
    default:
      return 'bg-green-800 text-green-200'
  }
}

function riskBandBadgeClass(band: RiskBand): string {
  switch (band) {
    case 'critical':
      return 'bg-red-800 text-red-200'
    case 'high':
      return 'bg-orange-800 text-orange-200'
    case 'medium':
      return 'bg-yellow-800 text-yellow-200'
    case 'low':
      return 'bg-blue-800 text-blue-200'
    default:
      return 'bg-green-800 text-green-200'
  }
}

function riskBandSmallIcon(band: RiskBand) {
  switch (band) {
    case 'critical':
    case 'high':
      return XCircleIcon
    case 'medium':
      return ExclamationTriangleIcon
    default:
      return CheckCircleIcon
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  setTimeout(() => {
    loadBundle()
    isLoading.value = false
  }, 300)
})

onBeforeUnmount(() => {
  if (exportResetTimeout !== null) clearTimeout(exportResetTimeout)
})

// Expose for tests
defineExpose({
  showDisclaimerModal,
  loadBundle,
  selectPreset,
  toggleSection,
  isSectionIncluded,
  exportJson,
  exportText,
  buildPayload,
})
</script>
