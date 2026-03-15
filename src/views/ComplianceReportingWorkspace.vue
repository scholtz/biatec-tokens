<template>
  <MainLayout>
    <!-- Skip link (WCAG 2.4.1) -->
    <a
      href="#reporting-main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>

    <div
      id="reporting-main"
      role="region"
      aria-label="Compliance Reporting Workspace"
      data-testid="compliance-reporting-workspace"
    >
      <div class="max-w-6xl mx-auto py-8 px-4">

        <!-- Page Header -->
        <header class="mb-8" data-testid="reporting-header">
          <div class="flex items-start gap-3 mb-2">
            <ClipboardDocumentCheckIcon class="w-8 h-8 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h1 class="text-2xl font-bold text-white" data-testid="reporting-heading">
                Compliance Reporting Workspace
              </h1>
              <p class="text-gray-300 text-sm mt-1">
                Review launch-level compliance evidence and export a regulator-ready summary.
              </p>
            </div>
          </div>
        </header>

        <!-- Loading state -->
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

          <!-- ── Audience Preset Selector ── -->
          <section
            class="mb-6"
            aria-labelledby="audience-preset-heading"
            data-testid="audience-preset-section"
          >
            <h2 id="audience-preset-heading" class="sr-only">Report audience</h2>
            <div
              role="group"
              aria-label="Select report audience"
              class="flex flex-wrap gap-2"
              data-testid="audience-preset-buttons"
            >
              <button
                v-for="preset in (['all', 'compliance', 'procurement', 'executive'] as AudiencePreset[])"
                :key="preset"
                type="button"
                :aria-pressed="selectedAudience === preset"
                :data-testid="`audience-btn-${preset}`"
                class="px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                :class="selectedAudience === preset
                  ? 'bg-blue-700 border-blue-500 text-white'
                  : 'bg-gray-800 border-white/10 text-gray-300 hover:bg-gray-700 hover:text-white'"
                @click="selectedAudience = preset"
              >
                {{ AUDIENCE_PRESET_LABELS[preset] }}
              </button>
            </div>
            <p class="mt-2 text-xs text-gray-400" data-testid="audience-preset-description">
              {{ audienceDescription }}
            </p>
          </section>

          <!-- ── Overall Readiness Banner ── -->
          <section
            class="mb-6 rounded-2xl border p-6 shadow-lg"
            :class="overallBannerClass"
            aria-labelledby="overall-status-heading"
            data-testid="overall-status-banner"
          >
            <div class="flex flex-col sm:flex-row sm:items-start gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <component :is="overallStatusIcon" class="w-5 h-5 flex-shrink-0" :class="overallIconClass" aria-hidden="true" />
                  <h2 id="overall-status-heading" class="text-base font-semibold text-white">
                    Overall Compliance Status
                  </h2>
                </div>
                <p class="text-sm font-medium mb-2" :class="overallLabelClass" data-testid="overall-status-label">
                  {{ OVERALL_STATUS_LABEL[bundle.overallStatus] }}
                </p>

                <!-- Readiness score meter -->
                <div class="mb-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-gray-400">Readiness Score</span>
                    <span class="text-xs font-bold" :class="scoreTextClass" data-testid="readiness-score-value">
                      {{ bundle.readinessScore }}%
                    </span>
                  </div>
                  <div class="h-2 bg-gray-700 rounded-full overflow-hidden" role="progressbar" :aria-valuenow="bundle.readinessScore" aria-valuemin="0" aria-valuemax="100">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="scoreBarClass"
                      :style="{ width: bundle.readinessScore + '%' }"
                      data-testid="readiness-score-bar"
                    />
                  </div>
                </div>

                <!-- Blockers list -->
                <ul
                  v-if="blockers.length > 0"
                  class="mt-3 space-y-1"
                  data-testid="blockers-list"
                  aria-label="Active compliance blockers"
                >
                  <li
                    v-for="blocker in blockers"
                    :key="blocker"
                    class="flex items-start gap-1.5 text-xs text-red-300"
                  >
                    <ExclamationTriangleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
                    {{ blocker }}
                  </li>
                </ul>

                <!-- What to do next guidance -->
                <div
                  v-if="bundle.overallStatus !== 'ready'"
                  class="mt-3 p-3 bg-black/20 rounded-lg border border-white/10"
                  data-testid="next-steps-guidance"
                >
                  <p class="text-xs font-medium text-yellow-300 mb-1 flex items-center gap-1">
                    <InformationCircleIcon class="w-3.5 h-3.5" aria-hidden="true" />
                    What to do next
                  </p>
                  <p class="text-xs text-gray-300">{{ nextStepsText }}</p>
                </div>
              </div>

              <div class="flex-shrink-0 text-right">
                <p class="text-xs text-gray-400">Generated</p>
                <p class="text-xs text-gray-300 mt-0.5" data-testid="generated-at">{{ formattedGeneratedAt }}</p>
              </div>
            </div>
          </section>

          <!-- ── Jurisdiction Coverage ── -->
          <section
            v-if="isSectionVisible('jurisdiction')"
            class="mb-6 bg-gray-800 rounded-2xl border border-white/10 p-6 shadow-lg"
            aria-labelledby="jurisdiction-heading"
            data-testid="jurisdiction-section"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 id="jurisdiction-heading" class="text-base font-semibold text-white flex items-center gap-2">
                <GlobeAltIcon class="w-4 h-4 text-blue-400" aria-hidden="true" />
                Jurisdiction Coverage
              </h2>
              <span
                class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                :class="bundle.jurisdiction.configured ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'"
                data-testid="jurisdiction-configured-badge"
              >
                <component :is="bundle.jurisdiction.configured ? CheckCircleIcon : ExclamationTriangleIcon" class="w-3 h-3" aria-hidden="true" />
                {{ bundle.jurisdiction.configured ? 'Configured' : 'Not Configured' }}
              </span>
            </div>

            <div v-if="bundle.jurisdiction.configured" class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-900/50 rounded-lg p-3">
                  <p class="text-xs text-gray-400 mb-0.5">Permitted Jurisdictions</p>
                  <p class="text-lg font-bold text-green-400" data-testid="permitted-count">{{ bundle.jurisdiction.permittedCount }}</p>
                </div>
                <div class="bg-gray-900/50 rounded-lg p-3">
                  <p class="text-xs text-gray-400 mb-0.5">Restricted Jurisdictions</p>
                  <p class="text-lg font-bold text-red-400" data-testid="restricted-count">{{ bundle.jurisdiction.restrictedCount }}</p>
                </div>
              </div>
              <div v-if="bundle.jurisdiction.jurisdictions.length > 0" class="flex flex-wrap gap-1.5" data-testid="jurisdiction-list">
                <span
                  v-for="jur in bundle.jurisdiction.jurisdictions.slice(0, 8)"
                  :key="jur"
                  class="text-xs px-2 py-0.5 bg-gray-700 text-gray-200 rounded"
                >{{ jur }}</span>
                <span
                  v-if="bundle.jurisdiction.jurisdictions.length > 8"
                  class="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded"
                >+{{ bundle.jurisdiction.jurisdictions.length - 8 }} more</span>
              </div>
            </div>
            <div v-else class="py-3">
              <p class="text-sm text-gray-400" data-testid="jurisdiction-empty">
                No jurisdiction configuration found. Configure jurisdictions in Compliance Setup.
              </p>
            </div>

            <FreshnessIndicator :stale-since="bundle.jurisdiction.staleSince" />

            <router-link
              to="/compliance/setup"
              class="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="jurisdiction-setup-link"
            >
              Edit in Compliance Setup
              <ArrowRightIcon class="w-3 h-3" aria-hidden="true" />
            </router-link>
          </section>

          <!-- ── Investor Eligibility ── -->
          <section
            v-if="isSectionVisible('investor_eligibility')"
            class="mb-6 bg-gray-800 rounded-2xl border border-white/10 p-6 shadow-lg"
            aria-labelledby="investor-eligibility-heading"
            data-testid="investor-eligibility-section"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 id="investor-eligibility-heading" class="text-base font-semibold text-white flex items-center gap-2">
                <UserGroupIcon class="w-4 h-4 text-purple-400" aria-hidden="true" />
                Investor Eligibility
              </h2>
              <StatusBadge :status="bundle.investorEligibility.status" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div class="flex items-center gap-2 text-sm">
                <component
                  :is="bundle.investorEligibility.accreditedRequired ? CheckCircleIcon : MinusCircleIcon"
                  class="w-4 h-4 flex-shrink-0"
                  :class="bundle.investorEligibility.accreditedRequired ? 'text-yellow-400' : 'text-gray-500'"
                  aria-hidden="true"
                />
                <span class="text-gray-300">
                  Accredited investors {{ bundle.investorEligibility.accreditedRequired ? 'required' : 'not required' }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <component
                  :is="bundle.investorEligibility.retailPermitted ? CheckCircleIcon : XCircleIcon"
                  class="w-4 h-4 flex-shrink-0"
                  :class="bundle.investorEligibility.retailPermitted ? 'text-green-400' : 'text-red-400'"
                  aria-hidden="true"
                />
                <span class="text-gray-300">
                  Retail investors {{ bundle.investorEligibility.retailPermitted ? 'permitted' : 'not permitted' }}
                </span>
              </div>
            </div>

            <div v-if="bundle.investorEligibility.eligibilityCategories.length > 0" class="flex flex-wrap gap-1.5 mb-3" data-testid="eligibility-categories">
              <span
                v-for="cat in bundle.investorEligibility.eligibilityCategories"
                :key="cat"
                class="text-xs px-2 py-0.5 bg-purple-900/40 text-purple-200 rounded"
              >{{ cat }}</span>
            </div>

            <FreshnessIndicator :stale-since="bundle.investorEligibility.staleSince" />
          </section>

          <!-- ── KYC / AML Review Status ── -->
          <section
            v-if="isSectionVisible('kyc_aml')"
            class="mb-6 bg-gray-800 rounded-2xl border border-white/10 p-6 shadow-lg"
            aria-labelledby="kyc-aml-heading"
            data-testid="kyc-aml-section"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 id="kyc-aml-heading" class="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheckIcon class="w-4 h-4 text-green-400" aria-hidden="true" />
                KYC / AML Review Status
              </h2>
              <StatusBadge :status="bundle.kycAml.status" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div class="flex items-center gap-2 text-sm">
                <component
                  :is="bundle.kycAml.kycRequired ? CheckCircleIcon : MinusCircleIcon"
                  class="w-4 h-4 flex-shrink-0"
                  :class="bundle.kycAml.kycRequired ? 'text-yellow-400' : 'text-gray-500'"
                  aria-hidden="true"
                />
                <span class="text-gray-300">KYC {{ bundle.kycAml.kycRequired ? 'required' : 'not required' }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <component
                  :is="bundle.kycAml.amlRequired ? CheckCircleIcon : MinusCircleIcon"
                  class="w-4 h-4 flex-shrink-0"
                  :class="bundle.kycAml.amlRequired ? 'text-yellow-400' : 'text-gray-500'"
                  aria-hidden="true"
                />
                <span class="text-gray-300">AML {{ bundle.kycAml.amlRequired ? 'required' : 'not required' }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <component
                  :is="bundle.kycAml.providerConfigured ? CheckCircleIcon : ExclamationTriangleIcon"
                  class="w-4 h-4 flex-shrink-0"
                  :class="bundle.kycAml.providerConfigured ? 'text-green-400' : 'text-yellow-400'"
                  aria-hidden="true"
                />
                <span class="text-gray-300">Provider {{ bundle.kycAml.providerConfigured ? 'configured' : 'not configured' }}</span>
              </div>
            </div>

            <div v-if="bundle.kycAml.pendingReviewCount > 0" class="flex items-center gap-2 text-sm text-yellow-300 mb-3">
              <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span data-testid="kyc-pending-count">{{ bundle.kycAml.pendingReviewCount }} review{{ bundle.kycAml.pendingReviewCount !== 1 ? 's' : '' }} pending</span>
            </div>

            <FreshnessIndicator :stale-since="bundle.kycAml.staleSince" />
          </section>

          <!-- ── Whitelist Posture ── -->
          <section
            v-if="isSectionVisible('whitelist')"
            class="mb-6 bg-gray-800 rounded-2xl border border-white/10 p-6 shadow-lg"
            aria-labelledby="whitelist-heading"
            data-testid="whitelist-section"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 id="whitelist-heading" class="text-base font-semibold text-white flex items-center gap-2">
                <ListBulletIcon class="w-4 h-4 text-indigo-400" aria-hidden="true" />
                Whitelist Posture
              </h2>
              <StatusBadge :status="bundle.whitelist.status" />
            </div>

            <div class="mb-3">
              <div class="flex items-center gap-2 text-sm mb-2">
                <component
                  :is="bundle.whitelist.whitelistRequired ? CheckCircleIcon : MinusCircleIcon"
                  class="w-4 h-4 flex-shrink-0"
                  :class="bundle.whitelist.whitelistRequired ? 'text-indigo-400' : 'text-gray-500'"
                  aria-hidden="true"
                />
                <span class="text-gray-300">Whitelist {{ bundle.whitelist.whitelistRequired ? 'required' : 'not required' }}</span>
              </div>

              <div v-if="bundle.whitelist.whitelistRequired" class="grid grid-cols-2 gap-4 mt-3">
                <div class="bg-gray-900/50 rounded-lg p-3">
                  <p class="text-xs text-gray-400 mb-0.5">Approved Investors</p>
                  <p class="text-lg font-bold text-green-400" data-testid="approved-investor-count">{{ bundle.whitelist.approvedInvestorCount }}</p>
                </div>
                <div class="bg-gray-900/50 rounded-lg p-3">
                  <p class="text-xs text-gray-400 mb-0.5">Pending Investors</p>
                  <p class="text-lg font-bold text-yellow-400" data-testid="pending-investor-count">{{ bundle.whitelist.pendingInvestorCount }}</p>
                </div>
              </div>

              <div v-if="bundle.whitelist.activeWhitelistId" class="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <span>Active whitelist:</span>
                <code class="text-gray-200 bg-gray-700 px-1.5 py-0.5 rounded" data-testid="active-whitelist-id">{{ bundle.whitelist.activeWhitelistId }}</code>
              </div>
            </div>

            <FreshnessIndicator :stale-since="bundle.whitelist.staleSince" />

            <router-link
              to="/compliance/policy"
              class="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="whitelist-policy-link"
            >
              Manage in Whitelist Policy
              <ArrowRightIcon class="w-3 h-3" aria-hidden="true" />
            </router-link>
          </section>

          <!-- ── Evidence Summary ── -->
          <section
            v-if="isSectionVisible('evidence')"
            class="mb-6 bg-gray-800 rounded-2xl border border-white/10 p-6 shadow-lg"
            aria-labelledby="evidence-summary-heading"
            data-testid="evidence-summary-section"
          >
            <h2 id="evidence-summary-heading" class="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <DocumentMagnifyingGlassIcon class="w-4 h-4 text-cyan-400" aria-hidden="true" />
              Evidence Summary
            </h2>

            <div v-if="bundle.evidenceSections.length > 0" class="overflow-x-auto mb-4">
              <table class="w-full text-sm" aria-label="Evidence sections summary">
                <thead>
                  <tr class="border-b border-white/10">
                    <th scope="col" class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-2 pr-4">Section</th>
                    <th scope="col" class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-2 pr-4">Status</th>
                    <th scope="col" class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-2 hidden sm:table-cell">Grade</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-700/50">
                  <tr v-for="sec in bundle.evidenceSections" :key="sec.id">
                    <td class="py-2.5 pr-4 text-gray-200 font-medium">{{ sec.title }}</td>
                    <td class="py-2.5 pr-4">
                      <span class="inline-flex items-center gap-1 text-xs" :class="sectionStatusClass(sec.status)">
                        <component :is="sectionStatusIcon(sec.status)" class="w-3.5 h-3.5" aria-hidden="true" />
                        {{ STATUS_LABELS[sec.status] }}
                      </span>
                    </td>
                    <td class="py-2.5 text-xs text-gray-400 hidden sm:table-cell">
                      {{ sec.releaseGrade ? 'Release-Grade' : 'Dev Feedback' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="py-3 text-sm text-gray-400" data-testid="evidence-empty">
              No evidence sections loaded. Visit the Evidence Pack to collect evidence.
            </div>

            <router-link
              to="/compliance/evidence"
              class="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="evidence-pack-link"
            >
              Open Compliance Evidence Pack
              <ArrowRightIcon class="w-3 h-3" aria-hidden="true" />
            </router-link>
          </section>

          <!-- ── Approval History ── -->
          <section
            v-if="isSectionVisible('approval_history')"
            class="mb-6 bg-gray-800 rounded-2xl border border-white/10 p-6 shadow-lg"
            aria-labelledby="approval-history-heading"
            data-testid="approval-history-section"
          >
            <button
              type="button"
              class="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              :aria-expanded="approvalHistoryExpanded"
              :aria-label="approvalHistoryToggleLabel"
              data-testid="approval-history-toggle"
              @click="approvalHistoryExpanded = !approvalHistoryExpanded"
            >
              <h2 id="approval-history-heading" class="text-base font-semibold text-white flex items-center gap-2">
                <QueueListIcon class="w-4 h-4 text-violet-400" aria-hidden="true" />
                Approval Stage History
              </h2>
              <span class="text-gray-400 text-xs flex items-center gap-1">
                <span v-if="approvalSummary">
                  {{ approvalSummary.approvedCount }}/{{ approvalSummary.totalStages }} signed off
                </span>
                <span v-else class="text-gray-500">No stages recorded</span>
                <svg
                  :class="approvalHistoryExpanded ? 'rotate-180' : ''"
                  class="w-4 h-4 transition-transform duration-200"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </span>
            </button>

            <!-- Collapsed summary metrics -->
            <div
              v-if="approvalSummary"
              class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
              data-testid="approval-summary-metrics"
            >
              <div class="bg-gray-900/50 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-400 mb-0.5">Approved</p>
                <p class="text-lg font-bold text-green-400" data-testid="approval-approved-count">{{ approvalSummary.approvedCount }}</p>
              </div>
              <div class="bg-gray-900/50 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-400 mb-0.5">Conditional</p>
                <p class="text-lg font-bold text-blue-400" data-testid="approval-conditional-count">{{ approvalSummary.conditionalCount }}</p>
              </div>
              <div class="bg-gray-900/50 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-400 mb-0.5">Blocked</p>
                <p class="text-lg font-bold text-red-400" data-testid="approval-blocked-count">{{ approvalSummary.blockedCount }}</p>
              </div>
              <div class="bg-gray-900/50 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-400 mb-0.5">Pending</p>
                <p class="text-lg font-bold text-yellow-400" data-testid="approval-pending-count">{{ approvalSummary.pendingCount }}</p>
              </div>
            </div>
            <div v-else class="mt-3 text-sm text-gray-400" data-testid="approval-history-empty">
              No approval stages have been recorded yet.
              <router-link
                to="/compliance/approval"
                class="inline ml-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                data-testid="approval-queue-link"
              >Open Approval Queue</router-link>
            </div>

            <!-- Expanded stage entries -->
            <div
              v-if="approvalHistoryExpanded && approvalSummary && approvalSummary.entries.length > 0"
              class="mt-4 space-y-3"
              data-testid="approval-history-entries"
            >
              <div
                v-for="entry in approvalSummary.entries"
                :key="entry.id"
                class="bg-gray-900/60 rounded-xl p-4 border border-white/5"
                :data-testid="`approval-entry-${entry.id}`"
              >
                <div class="flex items-start justify-between gap-3 mb-1">
                  <div class="flex items-center gap-2">
                    <UserCircleIcon class="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <span class="text-sm font-medium text-white">{{ entry.label }}</span>
                  </div>
                  <span
                    class="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    :class="approvalOutcomeBadgeClass(entry.outcome)"
                  >{{ APPROVAL_OUTCOME_LABELS[entry.outcome] }}</span>
                </div>
                <p class="text-xs text-gray-400 ml-6 mb-1">{{ entry.reviewerRole }}</p>
                <p v-if="entry.summary" class="text-xs text-gray-300 ml-6">{{ entry.summary }}</p>
                <p
                  v-if="entry.conditions"
                  class="mt-1.5 ml-6 text-xs text-blue-300 flex items-start gap-1"
                >
                  <InformationCircleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  Conditions: {{ entry.conditions }}
                </p>
                <p
                  v-if="entry.actionedAt"
                  class="mt-1.5 ml-6 flex items-center gap-1 text-xs text-gray-500"
                >
                  <ClockIcon class="w-3 h-3" aria-hidden="true" />
                  {{ new Date(entry.actionedAt).toLocaleString() }}
                </p>
              </div>
            </div>

            <router-link
              to="/compliance/approval"
              class="mt-4 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="nav-approval-queue"
            >
              Open Approval Queue
              <ArrowRightIcon class="w-3 h-3" aria-hidden="true" />
            </router-link>
          </section>

          <!-- ── Export Package Readiness ── -->
          <section
            v-if="isSectionVisible('export')"
            class="mb-6 rounded-2xl border p-6 shadow-lg"
            :class="exportReadinessBannerClass"
            aria-labelledby="export-readiness-heading"
            data-testid="export-readiness-section"
          >
            <div class="flex items-start gap-2 mb-2">
              <CheckBadgeIcon class="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div class="flex-1 min-w-0">
                <h2 id="export-readiness-heading" class="text-base font-semibold text-white">
                  Export Package Readiness
                </h2>
                <p class="text-sm font-medium mt-0.5" data-testid="export-readiness-label">
                  {{ exportReadiness.headline }}
                </p>
              </div>
            </div>
            <p class="text-xs text-gray-300 mb-4" data-testid="export-readiness-rationale">
              {{ exportReadiness.rationale }}
            </p>

            <!-- Checklist -->
            <ul
              class="space-y-2"
              aria-label="Export package checklist"
              data-testid="export-readiness-checklist"
            >
              <li
                v-for="item in exportReadiness.checklist"
                :key="item.id"
                class="flex items-start gap-2.5 text-sm"
                :data-testid="`checklist-item-${item.id}`"
              >
                <component
                  :is="item.isPresent ? CheckCircleIcon : (item.isBlocked || item.isRequiredForExternal) ? XCircleIcon : MinusCircleIcon"
                  class="w-4 h-4 flex-shrink-0 mt-0.5"
                  :class="item.isPresent ? 'text-green-400' : item.isBlocked ? 'text-red-500' : item.isRequiredForExternal ? 'text-red-400' : 'text-gray-500'"
                  :aria-label="item.isPresent ? 'Present' : (item.isBlocked ? 'Blocked — active failure' : (item.isRequiredForExternal ? 'Missing — required' : 'Optional — not present'))"
                />
                <div class="flex-1 min-w-0">
                  <span
                    :class="item.isPresent ? 'text-gray-200' : (item.isBlocked ? 'text-red-300 font-semibold' : (item.isRequiredForExternal ? 'text-red-300' : 'text-gray-400'))"
                    class="font-medium"
                  >{{ item.label }}</span>
                  <span
                    v-if="item.isBlocked && !item.isPresent"
                    class="ml-2 text-xs bg-red-900 text-red-200 px-1.5 py-0.5 rounded font-medium"
                    data-testid="checklist-blocked-badge"
                  >Blocked</span>
                  <span
                    v-if="item.isStale"
                    class="ml-2 text-xs text-yellow-400 font-medium"
                  >[Stale]</span>
                  <span
                    v-if="!item.isPresent && !item.isBlocked && !item.isRequiredForExternal"
                    class="ml-2 text-xs text-gray-500"
                  >Optional</span>
                  <p
                    v-if="!item.isPresent && item.remediationHint"
                    class="mt-0.5 text-xs text-gray-400"
                    :data-testid="`checklist-hint-${item.id}`"
                  >{{ item.remediationHint }}</p>
                </div>
              </li>
            </ul>

            <!-- Export description -->
            <p class="mt-4 text-xs text-gray-400 italic">
              {{ EXPORT_READINESS_DESCRIPTIONS[exportReadiness.status] }}
            </p>
          </section>

          <!-- ── Export Actions ── -->
          <section
            class="mb-6 bg-gray-800 rounded-2xl border border-white/10 p-6 shadow-lg"
            aria-labelledby="export-heading"
            data-testid="export-actions-section"
          >
            <h2 id="export-heading" class="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowDownTrayIcon class="w-4 h-4 text-teal-400" aria-hidden="true" />
              Export Compliance Report
            </h2>

            <p class="text-xs text-gray-400 mb-4">
              Export is tailored to the <strong class="text-gray-200">{{ AUDIENCE_PRESET_LABELS[selectedAudience] }}</strong> audience.
              Use the audience selector at the top of the page to generate an export scoped to compliance, procurement, or executive review.
            </p>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                data-testid="export-json-button"
                @click="exportJson"
              >
                <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
                Export JSON
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                data-testid="export-text-button"
                @click="exportText"
              >
                <DocumentTextIcon class="w-4 h-4" aria-hidden="true" />
                Export Text Report
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                data-testid="copy-clipboard-button"
                :aria-label="clipboardButtonLabel"
                @click="copyToClipboard"
              >
                <component :is="clipboardCopied ? CheckCircleIcon : ClipboardDocumentIcon" class="w-4 h-4" aria-hidden="true" />
                {{ clipboardCopied ? 'Copied!' : 'Copy to Clipboard' }}
              </button>
            </div>

            <p class="mt-3 text-xs text-gray-400 flex items-center gap-1">
              <PrinterIcon class="w-3.5 h-3.5" aria-hidden="true" />
              Use your browser's print function to produce a printer-friendly version of this page.
            </p>
          </section>

          <!-- ── Workspace Navigation ── -->
          <nav
            class="mt-6 p-4 bg-gray-800/60 rounded-xl border border-white/10 flex flex-wrap gap-3"
            aria-label="Compliance workspace navigation"
            data-testid="workspace-nav"
          >
            <router-link
              to="/compliance/launch"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="nav-launch-console"
            >
              Launch Console
            </router-link>
            <router-link
              to="/compliance/setup"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="nav-setup"
            >
              Compliance Setup
            </router-link>
            <router-link
              to="/compliance/evidence"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="nav-evidence"
            >
              Evidence Pack
            </router-link>
            <router-link
              to="/compliance/policy"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="nav-policy"
            >
              Whitelist Policy
            </router-link>
            <router-link
              to="/compliance/risk-report"
              class="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              data-testid="nav-risk-report"
            >
              Risk Report Builder
            </router-link>
          </nav>

        </template>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * Compliance Reporting Workspace
 *
 * Aggregates jurisdiction, KYC/AML, whitelist, and investor-eligibility data
 * from localStorage into a single regulator-ready reporting view. Supports
 * audience-aware report presets (compliance, procurement, executive), an
 * export package readiness checklist, approval history, and JSON/text/clipboard
 * export formats.
 *
 * WCAG 2.1 AA: landmarks, headings, aria-labelledby, non-color-only status,
 * skip link, keyboard navigation.
 */

import { ref, computed, onMounted, onBeforeUnmount, defineComponent, h } from 'vue'
import MainLayout from '../layout/MainLayout.vue'
import {
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  PrinterIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ListBulletIcon,
  MinusCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
  UserCircleIcon,
  QueueListIcon,
} from '@heroicons/vue/24/outline'
import {
  STATUS_LABELS,
  OVERALL_STATUS_LABEL,
  type EvidenceStatus,
  type ComplianceReportBundle,
  type JurisdictionSummary,
  type KYCAMLSummary,
  type WhitelistSummary,
  type InvestorEligibilitySummary,
} from '../utils/complianceEvidencePack'
import {
  AUDIENCE_PRESET_LABELS,
  AUDIENCE_PRESET_DESCRIPTIONS,
  AUDIENCE_SECTION_PRIORITIES,
  APPROVAL_OUTCOME_LABELS,
  EXPORT_READINESS_DESCRIPTIONS,
  deriveApprovalHistorySummary,
  deriveExportPackageReadiness,
  buildAudienceReportText,
  exportReadinessStatusClass,
  approvalOutcomeBadgeClass,
  type AudiencePreset,
  type ApprovalHistorySummary,
  type ExportPackageReadiness,
} from '../utils/complianceReportingWorkspace'

// ---------------------------------------------------------------------------
// Sub-components (inline for simplicity)
// ---------------------------------------------------------------------------

const FreshnessIndicator = defineComponent({
  props: { staleSince: { type: String as () => string | null, default: null } },
  setup(props) {
    return () => {
      if (!props.staleSince) return null
      const stale = isStale(props.staleSince)
      if (!stale) return null
      return h('p', {
        class: 'mt-2 flex items-center gap-1 text-xs text-yellow-400',
        'data-testid': 'freshness-warning',
      }, [
        h(ExclamationTriangleIcon, { class: 'w-3.5 h-3.5', 'aria-hidden': 'true' }),
        `Stale evidence — last updated ${formatRelativeTime(props.staleSince)}`,
      ])
    }
  },
})

const StatusBadge = defineComponent({
  props: { status: { type: String as () => EvidenceStatus, required: true } },
  setup(props) {
    return () => {
      const classes: Record<EvidenceStatus, string> = {
        ready: 'bg-green-900/50 text-green-300',
        warning: 'bg-yellow-900/50 text-yellow-300',
        failed: 'bg-red-900/50 text-red-300',
        pending: 'bg-gray-700 text-gray-300',
        unavailable: 'bg-gray-700 text-gray-400',
      }
      const icons: Record<EvidenceStatus, typeof CheckCircleIcon> = {
        ready: CheckCircleIcon,
        warning: ExclamationTriangleIcon,
        failed: XCircleIcon,
        pending: ArrowPathIcon,
        unavailable: MinusCircleIcon,
      }
      return h('span', { class: `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${classes[props.status]}` }, [
        h(icons[props.status], { class: 'w-3 h-3', 'aria-hidden': 'true' }),
        STATUS_LABELS[props.status],
      ])
    }
  },
})

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours

function isStale(timestamp: string | null): boolean {
  if (!timestamp) return false
  return Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS
}

function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'unknown'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const mins = Math.floor(diffMs / (1000 * 60))
  return `${mins} minute${mins !== 1 ? 's' : ''} ago`
}

function buildDefaultBundle(): ComplianceReportBundle {
  return {
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
  }
}

function computeOverallStatus(
  kycStatus: EvidenceStatus,
  whitelistStatus: EvidenceStatus,
  eligibilityStatus: EvidenceStatus,
  jurisdictionConfigured: boolean,
): EvidenceStatus {
  const statuses = [kycStatus, whitelistStatus, eligibilityStatus]
  if (statuses.includes('failed')) return 'failed'
  if (!jurisdictionConfigured) return 'warning'
  if (statuses.includes('warning')) return 'warning'
  if (statuses.every((s) => s === 'ready')) return 'ready'
  if (statuses.includes('unavailable')) return 'unavailable'
  return 'pending'
}

function computeReadinessScore(
  jurisdiction: JurisdictionSummary,
  kycAml: KYCAMLSummary,
  whitelist: WhitelistSummary,
  eligibility: InvestorEligibilitySummary,
): number {
  let score = 0
  if (jurisdiction.configured) score += 25
  if (kycAml.status === 'ready') score += 25
  else if (kycAml.status === 'warning') score += 15
  if (whitelist.status === 'ready') score += 25
  else if (whitelist.status === 'warning') score += 15
  if (eligibility.status === 'ready') score += 25
  else if (eligibility.status === 'warning') score += 15
  return score
}

// ---------------------------------------------------------------------------
// localStorage data loading
// ---------------------------------------------------------------------------

interface ComplianceSetupData {
  updatedAt?: string
  allowedJurisdictions?: Array<{ code: string; name: string }>
  restrictedJurisdictions?: Array<{ code: string; name: string }>
  kycRequired?: boolean
  amlRequired?: boolean
  kycProvider?: string
  accreditationRequired?: boolean
  retailPermitted?: boolean
  eligibilityCategories?: string[]
}

interface WhitelistSetupData {
  updatedAt?: string
  whitelistEnabled?: boolean
  activeWhitelistId?: string
  approvedInvestors?: unknown[]
  pendingInvestors?: unknown[]
}

interface KycAmlData {
  updatedAt?: string
  pendingReviews?: unknown[]
  providerConfigured?: boolean
}

function safeParseJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function loadBundle(): ComplianceReportBundle {
  const bundle = buildDefaultBundle()

  const setup = safeParseJson<ComplianceSetupData>('biatec_compliance_setup')
  const whitelistData = safeParseJson<WhitelistSetupData>('biatec_whitelist_setup')
  const kycData = safeParseJson<KycAmlData>('biatec_kyc_aml_setup')

  // Jurisdiction
  if (setup) {
    const allowed = setup.allowedJurisdictions ?? []
    const restricted = setup.restrictedJurisdictions ?? []
    bundle.jurisdiction = {
      configured: allowed.length > 0 || restricted.length > 0,
      jurisdictions: allowed.map((j) => j.name ?? j.code),
      permittedCount: allowed.length,
      restrictedCount: restricted.length,
      staleSince: setup.updatedAt ?? null,
    }
    bundle.investorEligibility = {
      status: (setup.accreditationRequired !== undefined || setup.retailPermitted !== undefined) ? 'ready' : 'pending',
      accreditedRequired: setup.accreditationRequired ?? false,
      retailPermitted: setup.retailPermitted !== false,
      eligibilityCategories: setup.eligibilityCategories ?? [],
      staleSince: setup.updatedAt ?? null,
    }
    bundle.kycAml = {
      ...bundle.kycAml,
      kycRequired: setup.kycRequired ?? false,
      amlRequired: setup.amlRequired ?? false,
      providerConfigured: !!(setup.kycProvider),
    }
  }

  // KYC/AML additional data
  if (kycData) {
    bundle.kycAml = {
      ...bundle.kycAml,
      providerConfigured: kycData.providerConfigured ?? bundle.kycAml.providerConfigured,
      pendingReviewCount: Array.isArray(kycData.pendingReviews) ? kycData.pendingReviews.length : 0,
      staleSince: kycData.updatedAt ?? null,
    }
  }

  // Derive KYC/AML status
  if (setup || kycData) {
    const kycIssue = bundle.kycAml.kycRequired && !bundle.kycAml.providerConfigured
    bundle.kycAml.status = bundle.kycAml.pendingReviewCount > 0 ? 'warning'
      : kycIssue ? 'failed'
      : 'ready'
  }

  // Whitelist
  if (whitelistData) {
    const approved = Array.isArray(whitelistData.approvedInvestors) ? whitelistData.approvedInvestors.length : 0
    const pending = Array.isArray(whitelistData.pendingInvestors) ? whitelistData.pendingInvestors.length : 0
    // A required whitelist with zero approved investors is a hard blocker — status is 'failed', not 'warning'.
    // This is a fail-closed rule: the platform must not report non-blocking readiness when no investors
    // can legally participate. Release sign-off MUST be blocked in this state.
    bundle.whitelist = {
      status: whitelistData.whitelistEnabled && approved === 0 ? 'failed' : 'ready',
      whitelistRequired: whitelistData.whitelistEnabled ?? false,
      approvedInvestorCount: approved,
      pendingInvestorCount: pending,
      activeWhitelistId: whitelistData.activeWhitelistId ?? null,
      staleSince: whitelistData.updatedAt ?? null,
    }
  }

  bundle.overallStatus = computeOverallStatus(
    bundle.kycAml.status,
    bundle.whitelist.status,
    bundle.investorEligibility.status,
    bundle.jurisdiction.configured,
  )
  bundle.readinessScore = computeReadinessScore(
    bundle.jurisdiction,
    bundle.kycAml,
    bundle.whitelist,
    bundle.investorEligibility,
  )

  return bundle
}

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

function downloadBlob(content: string, filename: string, mimeType: string): void {
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

// ---------------------------------------------------------------------------
// Approval summary loading (localStorage mock — backend-ready)
// ---------------------------------------------------------------------------

interface StoredApprovalStage {
  id: string
  label: string
  role?: string
  status: string
  lastActionAt?: string | null
  conditions?: string | null
  summary?: string
  blockers?: Array<{ isLaunchBlocking?: boolean }>
}

function loadApprovalSummary(): ApprovalHistorySummary | null {
  try {
    const raw = localStorage.getItem('biatec_approval_stages')
    if (!raw) return null
    const stages = JSON.parse(raw) as StoredApprovalStage[]
    if (!Array.isArray(stages) || stages.length === 0) return null
    return deriveApprovalHistorySummary(
      stages.map((s) => ({
        id: s.id,
        label: s.label,
        role: s.role ?? 'compliance_operator',
        status: s.status,
        lastActionAt: s.lastActionAt ?? null,
        conditions: s.conditions ?? null,
        summary: s.summary ?? '',
        blockers: (s.blockers ?? []).map((b) => ({ isLaunchBlocking: b.isLaunchBlocking ?? false })),
      })),
    )
  } catch (err) {
    console.warn('[ComplianceReportingWorkspace] Failed to parse biatec_approval_stages from localStorage:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Component state
// ---------------------------------------------------------------------------

const isLoading = ref(true)
const bundle = ref<ComplianceReportBundle>(buildDefaultBundle())
const clipboardCopied = ref(false)
let clipboardTimer: ReturnType<typeof setTimeout> | null = null

/** Currently selected audience preset */
const selectedAudience = ref<AudiencePreset>('all')

/** Approval history — populated from localStorage mock data (backend-ready) */
const approvalSummary = ref<ApprovalHistorySummary | null>(null)

/** Whether approval history section is expanded */
const approvalHistoryExpanded = ref(false)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const overallBannerClass = computed((): string => {
  const map: Record<EvidenceStatus, string> = {
    ready: 'bg-green-900/30 border-green-700/50',
    warning: 'bg-yellow-900/30 border-yellow-700/50',
    failed: 'bg-red-900/30 border-red-700/50',
    pending: 'bg-gray-800 border-white/10',
    unavailable: 'bg-gray-800 border-white/10',
  }
  return map[bundle.value.overallStatus]
})

const overallStatusIcon = computed(() => {
  const map: Record<EvidenceStatus, typeof CheckCircleIcon> = {
    ready: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    failed: XCircleIcon,
    pending: ArrowPathIcon,
    unavailable: MinusCircleIcon,
  }
  return map[bundle.value.overallStatus]
})

const overallIconClass = computed((): string => {
  const map: Record<EvidenceStatus, string> = {
    ready: 'text-green-400',
    warning: 'text-yellow-400',
    failed: 'text-red-400',
    pending: 'text-gray-400',
    unavailable: 'text-gray-500',
  }
  return map[bundle.value.overallStatus]
})

const overallLabelClass = computed((): string => {
  const map: Record<EvidenceStatus, string> = {
    ready: 'text-green-300',
    warning: 'text-yellow-300',
    failed: 'text-red-300',
    pending: 'text-gray-300',
    unavailable: 'text-gray-400',
  }
  return map[bundle.value.overallStatus]
})

const scoreTextClass = computed((): string => {
  const s = bundle.value.readinessScore
  if (s >= 75) return 'text-green-400'
  if (s >= 50) return 'text-yellow-400'
  return 'text-red-400'
})

const scoreBarClass = computed((): string => {
  const s = bundle.value.readinessScore
  if (s >= 75) return 'bg-green-500'
  if (s >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
})

const blockers = computed((): string[] => {
  const result: string[] = []
  if (!bundle.value.jurisdiction.configured)
    result.push('Jurisdiction coverage not configured')
  if (bundle.value.kycAml.status === 'failed')
    result.push('KYC/AML provider not configured for required KYC')
  if (bundle.value.whitelist.status === 'failed')
    result.push('Whitelist required but no approved investors')
  if (bundle.value.kycAml.pendingReviewCount > 0)
    result.push(`${bundle.value.kycAml.pendingReviewCount} KYC review(s) pending`)
  return result
})

const nextStepsText = computed((): string => {
  switch (bundle.value.overallStatus) {
    case 'failed':
      return 'Resolve all critical blockers listed above, then re-run compliance checks before proceeding to launch sign-off.'
    case 'warning':
      return 'Review flagged items above, update configuration in Compliance Setup, and confirm all evidence is current before export.'
    case 'pending':
      return 'Complete the Compliance Setup workflow to populate all required fields, then return here to review and export the report.'
    default:
      return 'Review the evidence details and export the report for regulator or audit submission.'
  }
})

const formattedGeneratedAt = computed((): string => {
  try {
    return new Date(bundle.value.generatedAt).toLocaleString()
  } catch {
    return bundle.value.generatedAt
  }
})

const clipboardButtonLabel = computed((): string =>
  clipboardCopied.value ? 'Compliance summary copied to clipboard' : 'Copy compliance summary to clipboard',
)

// ---------------------------------------------------------------------------
// Audience-preset computed
// ---------------------------------------------------------------------------

const audienceDescription = computed((): string => AUDIENCE_PRESET_DESCRIPTIONS[selectedAudience.value])

const visibleSections = computed((): string[] => AUDIENCE_SECTION_PRIORITIES[selectedAudience.value])

function isSectionVisible(sectionId: string): boolean {
  return visibleSections.value.includes(sectionId)
}

// ---------------------------------------------------------------------------
// Export package readiness (derived)
// ---------------------------------------------------------------------------

const exportReadiness = computed((): ExportPackageReadiness =>
  deriveExportPackageReadiness(bundle.value, approvalSummary.value),
)

const exportReadinessBannerClass = computed((): string =>
  exportReadinessStatusClass(exportReadiness.value.status),
)

// ---------------------------------------------------------------------------
// Approval history computed
// ---------------------------------------------------------------------------

const approvalHistoryToggleLabel = computed((): string =>
  approvalHistoryExpanded.value ? 'Collapse approval history' : 'Expand approval history',
)

// ---------------------------------------------------------------------------
// Export actions
// ---------------------------------------------------------------------------

function exportJson(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  downloadBlob(
    JSON.stringify({ ...bundle.value, generatedAt: new Date().toISOString(), audience: selectedAudience.value }, null, 2),
    `compliance-report-${timestamp}.json`,
    'application/json',
  )
}

function exportText(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const text = buildAudienceReportText(
    { ...bundle.value, generatedAt: new Date().toISOString() },
    selectedAudience.value,
    approvalSummary.value,
    exportReadiness.value,
  )
  downloadBlob(text, `compliance-report-${timestamp}.txt`, 'text/plain')
}

async function copyToClipboard(): Promise<void> {
  const text = buildAudienceReportText(
    { ...bundle.value, generatedAt: new Date().toISOString() },
    selectedAudience.value,
    approvalSummary.value,
    exportReadiness.value,
  )
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for environments without clipboard API
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  clipboardCopied.value = true
  if (clipboardTimer) clearTimeout(clipboardTimer)
  clipboardTimer = setTimeout(() => { clipboardCopied.value = false }, 2500)
}

// ---------------------------------------------------------------------------
// Section status helpers
// ---------------------------------------------------------------------------

function sectionStatusClass(status: EvidenceStatus): string {
  const map: Record<EvidenceStatus, string> = {
    ready: 'text-green-300',
    warning: 'text-yellow-300',
    failed: 'text-red-300',
    pending: 'text-gray-400',
    unavailable: 'text-gray-500',
  }
  return map[status]
}

function sectionStatusIcon(status: EvidenceStatus): typeof CheckCircleIcon {
  const map: Record<EvidenceStatus, typeof CheckCircleIcon> = {
    ready: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    failed: XCircleIcon,
    pending: ArrowPathIcon,
    unavailable: MinusCircleIcon,
  }
  return map[status]
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  bundle.value = loadBundle()
  approvalSummary.value = loadApprovalSummary()
  isLoading.value = false
})

onBeforeUnmount(() => {
  if (clipboardTimer) clearTimeout(clipboardTimer)
})
</script>
