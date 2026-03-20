<template>
  <MainLayout>
    <!-- Skip link (WCAG 2.4.1) -->
    <a
      href="#onboarding-workspace-main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>

    <div
      id="onboarding-workspace-main"
      role="region"
      aria-label="Investor Compliance Onboarding and Review Operations Workspace"
      data-testid="investor-onboarding-workspace"
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    >
      <div class="max-w-5xl mx-auto">

        <!-- ── Page Header ── -->
        <header class="mb-8" data-testid="onboarding-workspace-header">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <ClipboardDocumentListIcon class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  data-testid="onboarding-workspace-heading"
                >
                  Investor Compliance Onboarding
                </h1>
                <p class="text-gray-300 text-sm mt-1">
                  Review investor and issuer onboarding readiness, resolve compliance blockers,
                  and prepare the evidence package for approval handoff.
                </p>
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end gap-1 mt-1">
              <span
                class="text-xs text-gray-400"
                data-testid="onboarding-refreshed-at"
                :aria-label="`Data last refreshed: ${formattedRefreshedAt}`"
              >
                Last refreshed: {{ formattedRefreshedAt }}
              </span>
              <button
                class="text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
                data-testid="refresh-btn"
                aria-label="Refresh onboarding workspace data"
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
          data-testid="loading-state"
          role="status"
          aria-label="Loading onboarding data"
          aria-live="polite"
        >
          <div class="text-center">
            <ArrowPathIcon class="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" aria-hidden="true" />
            <p class="text-gray-300 text-sm">Loading compliance onboarding data…</p>
          </div>
        </div>

        <template v-else>

          <!-- ── Degraded / error state banner ── -->
          <div
            v-if="isDegraded && loadError"
            class="mb-6 rounded-xl border border-red-700 bg-red-950 p-4"
            data-testid="degraded-state-banner"
            role="alert"
            aria-live="assertive"
            aria-label="Compliance data unavailable"
          >
            <div class="flex items-start gap-3">
              <ExclamationCircleIcon class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p class="text-sm font-semibold text-red-200">
                  Compliance data is currently unavailable
                </p>
                <p class="text-xs text-red-300 mt-1">
                  {{ loadError }}
                </p>
                <p class="text-xs text-red-400 mt-2">
                  Launch readiness cannot be confirmed. Do not proceed with launch activities until this
                  workspace shows live, verified data.
                </p>
              </div>
            </div>
          </div>

          <!-- ── Evidence Truth Class Banner ── -->
          <div
            class="mb-6 rounded-xl border p-4"
            :class="evidenceTruthBannerClass(evidenceTruthClass)"
            :data-testid="EVIDENCE_TRUTH_TEST_IDS.BANNER"
            role="status"
            aria-live="polite"
            :aria-label="`Investor onboarding data source: ${EVIDENCE_TRUTH_LABELS[evidenceTruthClass]}`"
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
                  {{ buildProvenanceLabel(evidenceTruthClass, 'Investor Compliance Onboarding') }}
                </p>
              </div>
            </div>
          </div>

          <!-- ── Queue Health Summary Bar ── -->
          <div
            class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-4"
            data-testid="queue-health-summary"
            aria-label="Queue health summary"
            role="region"
          >
            <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Queue Health
            </h2>
            <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div class="flex flex-col items-center rounded-lg bg-gray-700/50 px-3 py-2" data-testid="health-total">
                <dd class="text-xl font-bold text-white">{{ queueHealth.total }}</dd>
                <dt class="text-xs text-gray-400 mt-0.5">Total</dt>
              </div>
              <div class="flex flex-col items-center rounded-lg bg-indigo-900/50 px-3 py-2" data-testid="health-pending-review">
                <dd class="text-xl font-bold text-indigo-300">{{ queueHealth.pendingReview }}</dd>
                <dt class="text-xs text-indigo-400 mt-0.5">Pending Review</dt>
              </div>
              <div class="flex flex-col items-center rounded-lg bg-red-900/50 px-3 py-2" data-testid="health-escalated">
                <dd class="text-xl font-bold text-red-300">{{ queueHealth.escalated }}</dd>
                <dt class="text-xs text-red-400 mt-0.5">Escalated</dt>
              </div>
              <div class="flex flex-col items-center rounded-lg bg-yellow-900/50 px-3 py-2" data-testid="health-overdue">
                <dd class="text-xl font-bold text-yellow-300">{{ queueHealth.overdue }}</dd>
                <dt class="text-xs text-yellow-400 mt-0.5">Overdue</dt>
              </div>
              <div class="flex flex-col items-center rounded-lg bg-green-900/50 px-3 py-2" data-testid="health-ready">
                <dd class="text-xl font-bold text-green-300">{{ queueHealth.readyForApproval }}</dd>
                <dt class="text-xs text-green-400 mt-0.5">Complete</dt>
              </div>
              <div class="flex flex-col items-center rounded-lg bg-blue-900/50 px-3 py-2" data-testid="health-awaiting-docs">
                <dd class="text-xl font-bold text-blue-300">{{ queueHealth.awaitingDocuments }}</dd>
                <dt class="text-xs text-blue-400 mt-0.5">In Progress</dt>
              </div>
            </dl>
          </div>

          <!-- ── Fixture selector (dev/demo — hidden in production) ── -->
          <div
            v-if="isDemoMode"
            class="mb-6 rounded-xl border border-indigo-700 bg-indigo-950 p-4"
            data-testid="demo-fixture-selector"
            role="group"
            aria-label="Demo fixture selector"
          >
            <p class="text-xs font-semibold text-indigo-300 mb-2">
              Demo fixtures — select an onboarding state to preview
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="fixture in fixtureOptions"
                :key="fixture.key"
                type="button"
                :aria-pressed="activeFixture === fixture.key"
                :data-testid="`fixture-btn-${fixture.key}`"
                class="px-3 py-1 text-xs font-medium rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                :class="activeFixture === fixture.key
                  ? 'bg-indigo-700 border-indigo-500 text-white'
                  : 'bg-gray-800 border-white/10 text-gray-300 hover:bg-gray-700'"
                @click="applyFixture(fixture.key)"
              >
                {{ fixture.label }}
              </button>
            </div>
          </div>

          <!-- ── Readiness Posture Banner ── -->
          <section
            class="rounded-2xl border p-6 mb-8 shadow-lg"
            :class="postureCardClass(workspaceState.posture)"
            aria-labelledby="posture-heading"
            data-testid="readiness-posture-banner"
          >
            <div class="flex flex-col sm:flex-row sm:items-start gap-4">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                :class="postureIconBgClass"
                aria-hidden="true"
              >
                <component :is="postureIcon" class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-1 flex-wrap">
                  <h2
                    id="posture-heading"
                    class="text-lg font-semibold text-white"
                    data-testid="posture-label"
                  >
                    Onboarding Readiness
                  </h2>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    :class="postureBadgeClass(workspaceState.posture)"
                    data-testid="posture-badge"
                    role="status"
                    :aria-label="`Readiness posture: ${WORKSPACE_READINESS_POSTURE_LABELS[workspaceState.posture]}`"
                  >
                    {{ WORKSPACE_READINESS_POSTURE_LABELS[workspaceState.posture] }}
                  </span>
                </div>
                <p
                  class="text-sm font-medium mb-1"
                  :class="postureTextClass(workspaceState.posture)"
                  data-testid="posture-headline"
                >
                  {{ workspaceState.headline }}
                </p>
                <p class="text-sm text-gray-300" data-testid="posture-rationale">
                  {{ workspaceState.rationale }}
                </p>

                <!-- Quick stats -->
                <dl
                  class="flex flex-wrap gap-4 mt-4"
                  aria-label="Onboarding statistics"
                  data-testid="posture-stats"
                >
                  <div class="flex flex-col">
                    <dt class="text-xs text-gray-400">Stages complete</dt>
                    <dd
                      class="text-lg font-bold text-white"
                      :aria-label="`${workspaceState.completedStageCount} of ${workspaceState.stages.length} stages complete`"
                    >
                      {{ workspaceState.completedStageCount }} / {{ workspaceState.stages.length }}
                    </dd>
                  </div>
                  <div class="flex flex-col">
                    <dt class="text-xs text-gray-400">Blocked stages</dt>
                    <dd
                      class="text-lg font-bold"
                      :class="workspaceState.blockedStageCount > 0 ? 'text-red-400' : 'text-white'"
                      :aria-label="`${workspaceState.blockedStageCount} stages blocked`"
                    >
                      {{ workspaceState.blockedStageCount }}
                    </dd>
                  </div>
                  <div class="flex flex-col">
                    <dt class="text-xs text-gray-400">Launch blockers</dt>
                    <dd
                      class="text-lg font-bold"
                      :class="workspaceState.totalLaunchBlockers > 0 ? 'text-red-400' : 'text-white'"
                      :aria-label="`${workspaceState.totalLaunchBlockers} launch-blocking issues`"
                    >
                      {{ workspaceState.totalLaunchBlockers }}
                    </dd>
                  </div>
                  <div class="flex flex-col">
                    <dt class="text-xs text-gray-400">Readiness score</dt>
                    <dd
                      class="text-lg font-bold"
                      :class="workspaceState.readinessScore === 100 ? 'text-green-400' : workspaceState.readinessScore >= 60 ? 'text-yellow-400' : 'text-red-400'"
                      :aria-label="`Readiness score: ${workspaceState.readinessScore}%`"
                      data-testid="readiness-score"
                    >
                      {{ workspaceState.readinessScore }}%
                    </dd>
                  </div>
                </dl>

                <!-- Readiness progress bar -->
                <div class="mt-4">
                  <div
                    class="w-full bg-gray-700 rounded-full h-2"
                    role="progressbar"
                    :aria-valuenow="workspaceState.readinessScore"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`Overall onboarding readiness: ${workspaceState.readinessScore}% complete`"
                    data-testid="readiness-progress-bar"
                  >
                    <div
                      class="h-2 rounded-full transition-all duration-700"
                      :class="progressBarColorClass"
                      :style="`width: ${workspaceState.readinessScore}%`"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Critical Blockers Banner ── -->
          <div
            v-if="topBlockers.length > 0"
            class="mb-6 rounded-xl border border-red-700 bg-red-950 p-5"
            role="alert"
            aria-live="assertive"
            data-testid="critical-blockers-banner"
          >
            <div class="flex items-center gap-2 mb-3">
              <ExclamationTriangleIcon class="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
              <h2 class="text-sm font-semibold text-red-300" id="blockers-heading">
                {{ topBlockers.length === 1 ? '1 issue' : `${topBlockers.length} issues` }} require immediate attention
              </h2>
            </div>
            <ol class="space-y-3" aria-labelledby="blockers-heading" data-testid="top-blockers-list">
              <li
                v-for="blocker in topBlockers"
                :key="blocker.id"
                class="flex items-start gap-3"
                :data-testid="`top-blocker-${blocker.id}`"
              >
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 mt-0.5"
                  :class="blockerSeverityBadgeClass(blocker.severity)"
                  :aria-label="`Severity: ${ONBOARDING_BLOCKER_SEVERITY_LABELS[blocker.severity]}`"
                >
                  {{ ONBOARDING_BLOCKER_SEVERITY_LABELS[blocker.severity] }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-red-200" :data-testid="`blocker-title-${blocker.id}`">
                    {{ blocker.title }}
                  </p>
                  <p class="text-xs text-red-300 mt-0.5">{{ blocker.reason }}</p>
                  <div class="flex items-center gap-3 mt-1 flex-wrap">
                    <p class="text-xs text-gray-300 italic">{{ blocker.recommendedAction }}</p>
                    <RouterLink
                      v-if="blocker.remediationPath"
                      :to="blocker.remediationPath"
                      class="text-xs text-teal-400 underline hover:text-teal-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded"
                      :aria-label="`Go to remediation for: ${blocker.title}`"
                      :data-testid="`blocker-remediation-link-${blocker.id}`"
                    >
                      Resolve <span aria-hidden="true">→</span>
                    </RouterLink>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <!-- ── Onboarding Stages ── -->
          <section
            aria-labelledby="stages-heading"
            data-testid="onboarding-stages-section"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2
                id="stages-heading"
                class="text-xl font-semibold text-white"
                data-testid="stages-heading"
              >
                Review Stages
              </h2>

              <!-- ── Navigation buttons ── -->
              <div class="flex items-center gap-2 flex-shrink-0" data-testid="stages-nav-actions">
                <RouterLink
                  to="/compliance/approval"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  data-testid="handoff-to-approval-btn"
                  aria-label="Hand off to approval cockpit"
                >
                  <ArrowRightCircleIcon class="w-4 h-4" aria-hidden="true" />
                  Hand Off to Approval
                </RouterLink>
                <RouterLink
                  to="/compliance/approval"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  data-testid="view-cases-btn"
                  aria-label="View all compliance cases"
                >
                  <ChartBarIcon class="w-4 h-4" aria-hidden="true" />
                  View Cases
                </RouterLink>
              </div>
            </div>

            <!-- ── Filter and Sort Controls ── -->
            <div
              class="rounded-xl border border-gray-700 bg-gray-800/40 p-4 mb-4"
              data-testid="queue-filter-controls"
              role="group"
              aria-label="Filter and sort stages"
            >
              <div class="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                <!-- Status filter chips -->
                <div class="flex items-center gap-2 flex-wrap" data-testid="status-filter-chips">
                  <span class="text-xs text-gray-400 font-medium flex-shrink-0">Status:</span>
                  <button
                    v-for="opt in statusFilterOptions"
                    :key="opt.value"
                    type="button"
                    :aria-pressed="(activeFilter.status ?? []).includes(opt.value)"
                    :data-testid="`status-filter-${opt.value}`"
                    class="px-2 py-0.5 text-xs rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                    :class="(activeFilter.status ?? []).includes(opt.value)
                      ? 'bg-teal-700 border-teal-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'"
                    @click="toggleStatusFilter(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>

                <!-- Overdue only toggle -->
                <label class="flex items-center gap-1.5 cursor-pointer" data-testid="overdue-filter-label">
                  <input
                    type="checkbox"
                    :checked="!!activeFilter.overdueOnly"
                    class="rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-400 focus:ring-offset-gray-800"
                    data-testid="overdue-filter-checkbox"
                    aria-label="Show overdue stages only"
                    @change="activeFilter = { ...activeFilter, overdueOnly: activeFilter.overdueOnly ? undefined : true }"
                  />
                  <span class="text-xs text-gray-300">Overdue only</span>
                </label>

                <!-- Escalated only toggle -->
                <label class="flex items-center gap-1.5 cursor-pointer" data-testid="escalated-filter-label">
                  <input
                    type="checkbox"
                    :checked="!!activeFilter.escalatedOnly"
                    class="rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-400 focus:ring-offset-gray-800"
                    data-testid="escalated-filter-checkbox"
                    aria-label="Show escalated stages only"
                    @change="activeFilter = { ...activeFilter, escalatedOnly: activeFilter.escalatedOnly ? undefined : true }"
                  />
                  <span class="text-xs text-gray-300">Escalated only</span>
                </label>

                <!-- Sort key -->
                <div class="flex items-center gap-2 ml-auto" data-testid="sort-control">
                  <label for="sort-key-select" class="text-xs text-gray-400 font-medium flex-shrink-0">Sort:</label>
                  <select
                    id="sort-key-select"
                    v-model="activeSortKey"
                    class="text-xs bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                    data-testid="sort-key-select"
                    aria-label="Sort stages by"
                  >
                    <option
                      v-for="opt in sortKeyOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>

                <!-- Reset filters & sort -->
                <button
                  v-if="hasActiveFilters || activeSortKey !== 'stage'"
                  type="button"
                  class="text-xs text-teal-400 underline hover:text-teal-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded flex-shrink-0"
                  data-testid="clear-filters-btn"
                  aria-label="Reset all filters and sort order"
                  @click="clearFilters"
                >
                  Reset filters &amp; sort
                </button>
              </div>
            </div>

            <ol
              class="space-y-3"
              aria-label="Onboarding review stages"
              data-testid="stages-list"
            >
              <!-- No results empty state -->
              <li
                v-if="filteredAndSortedStages.length === 0"
                class="rounded-xl border border-gray-700 bg-gray-800/40 p-6 text-center"
                data-testid="stages-empty-state"
              >
                <p class="text-gray-400 text-sm">
                  No stages match the current filters.
                </p>
                <button
                  type="button"
                  class="mt-2 text-xs text-teal-400 underline hover:text-teal-300 focus:outline-none"
                  @click="clearFilters"
                >
                  Clear filters
                </button>
              </li>

              <li
                v-for="(stage, index) in filteredAndSortedStages"
                :key="stage.id"
                class="rounded-xl border bg-gray-800 shadow-sm overflow-hidden"
                :class="stageCardBorderClass(stage.status)"
                :data-testid="`stage-item-${stage.id}`"
              >
                <!-- Stage header (clickable to expand) -->
                <button
                  type="button"
                  class="w-full flex items-center gap-3 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400"
                  :aria-expanded="expandedStageIds.has(stage.id)"
                  :aria-controls="`stage-body-${stage.id}`"
                  :aria-label="`${stage.label}: ${ONBOARDING_STAGE_STATUS_LABELS[stage.status]}. ${stage.summary}`"
                  :data-testid="`stage-header-${stage.id}`"
                  @click="toggleStage(stage.id)"
                >
                  <!-- Step number -->
                  <span
                    class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    :class="stageNumberClass(stage.status)"
                    aria-hidden="true"
                  >
                    <CheckIcon v-if="stage.status === 'complete'" class="w-4 h-4" />
                    <XMarkIcon v-else-if="stage.status === 'blocked'" class="w-4 h-4" />
                    <ExclamationTriangleIcon v-else-if="stage.status === 'stale'" class="w-3.5 h-3.5" />
                    <span v-else>{{ index + 1 }}</span>
                  </span>

                  <!-- Stage label and summary -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-semibold text-white">{{ stage.label }}</span>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="stageStatusBadgeClass(stage.status)"
                        :aria-label="`Status: ${ONBOARDING_STAGE_STATUS_LABELS[stage.status]}`"
                        :data-testid="`stage-status-badge-${stage.id}`"
                      >
                        {{ ONBOARDING_STAGE_STATUS_LABELS[stage.status] }}
                      </span>
                      <span
                        v-if="stage.blockers.length > 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-800 text-red-200"
                        :aria-label="`${stage.blockers.length} blocker${stage.blockers.length > 1 ? 's' : ''}`"
                        :data-testid="`stage-blocker-count-${stage.id}`"
                      >
                        <ExclamationCircleIcon class="w-3 h-3" aria-hidden="true" />
                        {{ stage.blockers.length }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-400 mt-0.5 truncate">{{ stage.summary }}</p>
                    <!-- Next action hint (always visible in card header) -->
                    <p
                      class="text-xs text-teal-400 mt-0.5 truncate"
                      :data-testid="`stage-next-action-${stage.id}`"
                      aria-label="Next action"
                    >
                      <span aria-hidden="true">→ </span>{{ deriveCaseNextAction(stage) }}
                    </p>
                  </div>

                  <!-- Expand/collapse chevron -->
                  <ChevronDownIcon
                    class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                    :class="expandedStageIds.has(stage.id) ? 'rotate-180' : ''"
                    aria-hidden="true"
                  />
                </button>

                <!-- Stage body (expanded) -->
                <div
                  v-show="expandedStageIds.has(stage.id)"
                  :id="`stage-body-${stage.id}`"
                  class="border-t border-gray-700 p-4"
                  :data-testid="`stage-body-${stage.id}`"
                >
                  <p class="text-sm text-gray-300 mb-4">{{ stage.description }}</p>

                  <!-- Assignee (if set) -->
                  <p
                    v-if="stage.assignee"
                    class="text-xs text-gray-400 mb-2"
                    :data-testid="`stage-assignee-${stage.id}`"
                  >
                    <span class="font-medium text-gray-300">Assigned to:</span> {{ stage.assignee }}
                  </p>

                  <!-- Last action timestamp -->
                  <p
                    v-if="stage.lastActionAt"
                    class="text-xs text-gray-500 mb-3"
                    :data-testid="`stage-last-action-${stage.id}`"
                  >
                    Last action: {{ formatActionDate(stage.lastActionAt) }}
                  </p>
                  <p
                    v-else
                    class="text-xs text-gray-500 mb-3 italic"
                    :data-testid="`stage-no-action-${stage.id}`"
                  >
                    No action recorded yet.
                  </p>

                  <!-- Blockers -->
                  <div
                    v-if="stage.blockers.length > 0"
                    class="mb-4"
                    data-testid="stage-blockers-section"
                  >
                    <h3
                      class="text-xs font-semibold text-red-300 uppercase tracking-wide mb-2"
                      :id="`stage-blockers-heading-${stage.id}`"
                    >
                      Blockers ({{ stage.blockers.length }})
                    </h3>
                    <ul
                      class="space-y-3"
                      :aria-labelledby="`stage-blockers-heading-${stage.id}`"
                    >
                      <li
                        v-for="blocker in stage.blockers"
                        :key="blocker.id"
                        class="rounded-lg border border-red-800 bg-red-950/60 p-3"
                        :data-testid="`blocker-item-${blocker.id}`"
                      >
                        <div class="flex items-start gap-2 mb-1">
                          <span
                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0"
                            :class="blockerSeverityBadgeClass(blocker.severity)"
                          >
                            {{ ONBOARDING_BLOCKER_SEVERITY_LABELS[blocker.severity] }}
                          </span>
                          <span
                            v-if="blocker.isLaunchBlocking"
                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-800 text-red-200 flex-shrink-0"
                            aria-label="Launch blocking"
                          >
                            Launch Blocking
                          </span>
                        </div>
                        <p class="text-sm font-medium text-white mt-1" :data-testid="`blocker-title-${blocker.id}`">
                          {{ blocker.title }}
                        </p>
                        <p class="text-xs text-gray-300 mt-1">{{ blocker.reason }}</p>
                        <p class="text-xs text-gray-400 mt-1 italic">
                          <strong class="text-gray-300 not-italic">Action required:</strong>
                          {{ blocker.recommendedAction }}
                        </p>
                        <div
                          v-if="blocker.staleSince"
                          class="flex items-center gap-1.5 mt-2 text-xs text-yellow-300"
                          :data-testid="`blocker-stale-${blocker.id}`"
                        >
                          <ExclamationTriangleIcon class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                          Evidence stale since: {{ formatOnboardingStalenessLabel(blocker.staleSince) }}
                        </div>
                        <RouterLink
                          v-if="blocker.remediationPath"
                          :to="blocker.remediationPath"
                          class="inline-flex items-center gap-1 mt-2 text-xs text-teal-400 underline hover:text-teal-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded"
                          :aria-label="`Resolve: ${blocker.title}`"
                          :data-testid="`blocker-link-${blocker.id}`"
                        >
                          <ArrowTopRightOnSquareIcon class="w-3 h-3" aria-hidden="true" />
                          Resolve this issue
                        </RouterLink>
                      </li>
                    </ul>
                  </div>

                  <!-- No blockers -->
                  <div
                    v-else
                    class="mb-4 flex items-center gap-2 text-xs text-green-300"
                    :data-testid="`stage-no-blockers-${stage.id}`"
                  >
                    <CheckCircleIcon class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    No blockers in this stage.
                  </div>

                  <!-- Evidence links -->
                  <div v-if="stage.evidenceLinks.length > 0" class="mt-2">
                    <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                      Evidence Links
                    </h3>
                    <ul class="flex flex-wrap gap-2">
                      <li
                        v-for="link in stage.evidenceLinks"
                        :key="link.path"
                      >
                        <RouterLink
                          :to="link.path"
                          class="inline-flex items-center gap-1 text-xs text-teal-400 underline hover:text-teal-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded"
                          :data-testid="`evidence-link-${stage.id}`"
                        >
                          <DocumentMagnifyingGlassIcon class="w-3.5 h-3.5" aria-hidden="true" />
                          {{ link.label }}
                        </RouterLink>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>
            </ol>
          </section>

          <!-- ── Approval Handoff Section ── -->
          <section
            class="mt-8 rounded-2xl border p-6"
            :class="workspaceState.posture === 'ready_for_handoff'
              ? 'border-green-700 bg-green-950'
              : 'border-gray-700 bg-gray-800'"
            aria-labelledby="handoff-heading"
            data-testid="approval-handoff-section"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                :class="workspaceState.posture === 'ready_for_handoff' ? 'bg-green-700' : 'bg-gray-700'"
                aria-hidden="true"
              >
                <ArrowRightCircleIcon class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1">
                <h2
                  id="handoff-heading"
                  class="text-base font-semibold text-white mb-1"
                  data-testid="handoff-heading"
                >
                  Approval Handoff
                </h2>
                <p class="text-sm text-gray-300 mb-4" data-testid="handoff-description">
                  <template v-if="workspaceState.posture === 'ready_for_handoff'">
                    The compliance package is ready. Proceed to the release sign-off cockpit
                    to complete the approval process.
                  </template>
                  <template v-else>
                    Complete all onboarding stages and resolve outstanding blockers before
                    handing off to the release sign-off cockpit.
                  </template>
                </p>

                <!-- Handoff CTA -->
                <RouterLink
                  to="/compliance/approval"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  :class="workspaceState.posture === 'ready_for_handoff'
                    ? 'bg-green-600 hover:bg-green-500 text-white focus-visible:ring-green-400'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 focus-visible:ring-gray-400'"
                  :aria-label="workspaceState.posture === 'ready_for_handoff'
                    ? 'Proceed to release sign-off cockpit'
                    : 'View release sign-off cockpit (onboarding not yet complete)'"
                  data-testid="handoff-cta"
                >
                  <ClipboardDocumentCheckIcon class="w-4 h-4" aria-hidden="true" />
                  {{ workspaceState.posture === 'ready_for_handoff' ? 'Proceed to Approval Cockpit' : 'View Approval Cockpit' }}
                </RouterLink>

                <!-- Adjacent workspace links -->
                <div class="flex flex-wrap gap-3 mt-4" data-testid="workspace-nav-links">
                  <RouterLink
                    to="/compliance/evidence"
                    class="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded"
                    aria-label="Review compliance evidence pack"
                    data-testid="nav-link-evidence"
                  >
                    <DocumentMagnifyingGlassIcon class="w-3.5 h-3.5" aria-hidden="true" />
                    Compliance Evidence Pack
                  </RouterLink>
                  <RouterLink
                    to="/compliance/setup"
                    class="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded"
                    aria-label="Go to compliance setup workspace"
                    data-testid="nav-link-setup"
                  >
                    <WrenchScrewdriverIcon class="w-3.5 h-3.5" aria-hidden="true" />
                    Compliance Setup
                  </RouterLink>
                  <RouterLink
                    to="/compliance/reporting"
                    class="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 rounded"
                    aria-label="Go to compliance reporting workspace"
                    data-testid="nav-link-reporting"
                  >
                    <ChartBarIcon class="w-3.5 h-3.5" aria-hidden="true" />
                    Compliance Reporting
                  </RouterLink>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Disclaimer ── -->
          <p
            class="mt-6 text-xs text-gray-500 text-center"
            data-testid="workspace-disclaimer"
          >
            Readiness data is derived from frontend fixtures. Live KYC/AML provider
            integrations will be connected in a future release. This workspace does not
            imply launch authorisation. Backend validation is required before deployment.
          </p>

        </template>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import {
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowRightCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentMagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline'

import {
  type OnboardingWorkspaceState,
  type OnboardingStageStatus,
  type CaseQueueFilter,
  type CaseSortKey,
  type QueueHealthSummary,
  ONBOARDING_STAGE_STATUS_LABELS,
  ONBOARDING_BLOCKER_SEVERITY_LABELS,
  WORKSPACE_READINESS_POSTURE_LABELS,
  deriveOnboardingWorkspaceState,
  getTopOnboardingBlockers,
  postureCardClass,
  postureTextClass,
  postureBadgeClass,
  stageStatusBadgeClass,
  blockerSeverityBadgeClass,
  formatOnboardingStalenessLabel,
  deriveQueueHealth,
  applyQueueFilter,
  sortCases,
  deriveCaseNextAction,
  deriveDegradedState,
  MOCK_ONBOARDING_STAGES_READY,
  MOCK_ONBOARDING_STAGES_BLOCKED,
  MOCK_ONBOARDING_STAGES_PARTIAL,
  MOCK_ONBOARDING_STAGES_STALE,
} from '../utils/investorComplianceOnboarding'
import {
  type EvidenceTruthClass,
  deriveFixtureTruthClass,
  deriveBackendResponseTruthClass,
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

import {
  createComplianceCaseClient,
} from '../lib/api/complianceCaseManagement'

import {
  normaliseCohortReadinessToStages,
  buildDegradedOnboardingStages,
} from '../utils/complianceCaseNormalizer'

import { useAuthStore } from '../stores/auth'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const isLoading = ref(true)
const refreshedAt = ref<Date>(new Date())
const expandedStageIds = ref<Set<string>>(new Set())

/** Error message when live data load fails (null = no error). */
const loadError = ref<string | null>(null)

/** True when the backend could not be reached and we show degraded state. */
const isDegraded = ref(false)

/** Evidence truth classification for the partial-hydration signal banner. */
const evidenceTruthClass = ref<EvidenceTruthClass>('partial_hydration')

/** Show fixture selector in dev / demo environments. */
const isDemoMode = ref(import.meta.env.DEV)

type FixtureKey = 'ready' | 'blocked' | 'partial' | 'stale'
const activeFixture = ref<FixtureKey>('partial')

const fixtureOptions: Array<{ key: FixtureKey; label: string }> = [
  { key: 'ready', label: 'Ready for Handoff' },
  { key: 'partial', label: 'Partially Ready' },
  { key: 'blocked', label: 'Blocked (KYC/AML)' },
  { key: 'stale', label: 'Stale Evidence' },
]

const fixtureStages = {
  ready: MOCK_ONBOARDING_STAGES_READY,
  partial: MOCK_ONBOARDING_STAGES_PARTIAL,
  blocked: MOCK_ONBOARDING_STAGES_BLOCKED,
  stale: MOCK_ONBOARDING_STAGES_STALE,
}

const workspaceState = ref<OnboardingWorkspaceState>(
  deriveOnboardingWorkspaceState(MOCK_ONBOARDING_STAGES_PARTIAL),
)

const authStore = useAuthStore()

// ---------------------------------------------------------------------------
// Queue filter / sort state
// ---------------------------------------------------------------------------

const activeFilter = ref<CaseQueueFilter>({})
const activeSortKey = ref<CaseSortKey>('stage')

const statusFilterOptions: Array<{ value: OnboardingStageStatus; label: string }> = [
  { value: 'blocked', label: 'Blocked' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'stale', label: 'Stale' },
  { value: 'complete', label: 'Complete' },
  { value: 'not_started', label: 'Not Started' },
]

const sortKeyOptions: Array<{ value: CaseSortKey; label: string }> = [
  { value: 'stage', label: 'Stage Order' },
  { value: 'priority', label: 'Priority' },
  { value: 'lastUpdated', label: 'Last Updated' },
  { value: 'waitingDays', label: 'Waiting Days' },
]

function toggleStatusFilter(status: OnboardingStageStatus): void {
  const current = activeFilter.value.status ?? []
  if (current.includes(status)) {
    activeFilter.value = {
      ...activeFilter.value,
      status: current.filter((s) => s !== status),
    }
  } else {
    activeFilter.value = { ...activeFilter.value, status: [...current, status] }
  }
}

function clearFilters(): void {
  activeFilter.value = {}
  activeSortKey.value = 'stage'
}

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const formattedRefreshedAt = computed(() => {
  return refreshedAt.value.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const topBlockers = computed(() => getTopOnboardingBlockers(workspaceState.value.stages, 5))

const queueHealth = computed<QueueHealthSummary>(() =>
  deriveQueueHealth(workspaceState.value.stages),
)

const filteredAndSortedStages = computed(() => {
  const filtered = applyQueueFilter(workspaceState.value.stages, activeFilter.value)
  return sortCases(filtered, activeSortKey.value)
})

const hasActiveFilters = computed(() => {
  const f = activeFilter.value
  return (
    (f.status && f.status.length > 0) ||
    !!f.priority ||
    !!f.assignee ||
    !!f.overdueOnly ||
    !!f.escalatedOnly
  )
})

const postureIcon = computed(() => {
  switch (workspaceState.value.posture) {
    case 'ready_for_handoff':
      return CheckCircleIcon
    case 'blocked':
      return ExclamationTriangleIcon
    case 'stale':
      return ExclamationTriangleIcon
    default:
      return ClipboardDocumentListIcon
  }
})

const postureIconBgClass = computed(() => {
  switch (workspaceState.value.posture) {
    case 'ready_for_handoff':
      return 'bg-green-700'
    case 'blocked':
      return 'bg-red-700'
    case 'stale':
      return 'bg-yellow-700'
    case 'partially_ready':
      return 'bg-blue-700'
    default:
      return 'bg-gray-700'
  }
})

const progressBarColorClass = computed(() => {
  const score = workspaceState.value.readinessScore
  if (score === 100) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stageCardBorderClass(status: OnboardingStageStatus): string {
  switch (status) {
    case 'complete':
      return 'border-green-800'
    case 'blocked':
      return 'border-red-800'
    case 'stale':
      return 'border-yellow-800'
    case 'in_progress':
    case 'pending_review':
      return 'border-blue-800'
    default:
      return 'border-gray-700'
  }
}

function stageNumberClass(status: OnboardingStageStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-green-700 text-white'
    case 'blocked':
      return 'bg-red-700 text-white'
    case 'stale':
      return 'bg-yellow-700 text-white'
    case 'in_progress':
    case 'pending_review':
      return 'bg-blue-700 text-white'
    default:
      return 'bg-gray-700 text-gray-300'
  }
}

function formatActionDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

function toggleStage(stageId: string): void {
  if (expandedStageIds.value.has(stageId)) {
    expandedStageIds.value.delete(stageId)
  } else {
    expandedStageIds.value.add(stageId)
  }
}

function applyFixture(key: FixtureKey): void {
  activeFixture.value = key
  workspaceState.value = deriveOnboardingWorkspaceState(fixtureStages[key])
  refreshedAt.value = new Date()
  loadError.value = null
  isDegraded.value = false
  evidenceTruthClass.value = deriveFixtureTruthClass(true)
}

// ---------------------------------------------------------------------------
// Live data loading (production / authenticated environments)
// ---------------------------------------------------------------------------

/**
 * Attempt to load live cohort readiness data from the compliance case API.
 * Falls back to the deterministic fixture and marks the workspace as degraded
 * when the backend is unavailable or returns an error. Fail-closed: any
 * ambiguous response is treated as degraded rather than silently marking ready.
 */
async function loadLiveData(): Promise<void> {
  const bearerToken = authStore.session || localStorage.getItem('arc76_session')
  const client = createComplianceCaseClient(bearerToken)

  if (!client) {
    // No auth token available — fall back to fixtures gracefully
    loadError.value = null
    isDegraded.value = false
    workspaceState.value = deriveOnboardingWorkspaceState(fixtureStages[activeFixture.value])
    evidenceTruthClass.value = deriveFixtureTruthClass(true)
    return
  }

  try {
    const result = await client.getMonitoringDashboard()

    if (!result.ok) {
      // Backend returned an error — mark degraded, stay fail-closed
      const degraded = deriveDegradedState(result.error.userGuidance)
      loadError.value = degraded.message
      isDegraded.value = degraded.isDegraded
      const degradedStages = buildDegradedOnboardingStages(degraded.message)
      workspaceState.value = deriveOnboardingWorkspaceState(degradedStages)
      evidenceTruthClass.value = 'unavailable'
      return
    }

    const dashboard = result.data

    // If there are cohort summaries, use the first one's readiness data to
    // build the stage model. In a multi-cohort product this would be refined
    // to select the relevant cohort by project/token ID.
    if (dashboard.cohortSummaries && dashboard.cohortSummaries.length > 0) {
      const cohort = dashboard.cohortSummaries[0]
      const liveStages = normaliseCohortReadinessToStages(cohort)
      workspaceState.value = deriveOnboardingWorkspaceState(liveStages)
      loadError.value = null
      isDegraded.value = false
      evidenceTruthClass.value = deriveBackendResponseTruthClass({ isDegraded: false, isPartial: false, isStale: false })
    } else {
      // Empty cohort list — no cases yet, show not_started state gracefully
      workspaceState.value = deriveOnboardingWorkspaceState(
        fixtureStages['partial'].map((s) => ({
          ...s,
          status: 'not_started' as OnboardingStageStatus,
          summary: 'No investor cases have been registered yet.',
          blockers: [],
        })),
      )
      loadError.value = null
      isDegraded.value = false
      evidenceTruthClass.value = deriveFixtureTruthClass(true)
    }
  } catch (err) {
    const degraded = deriveDegradedState(err)
    loadError.value = degraded.message
    isDegraded.value = degraded.isDegraded
    const degradedStages = buildDegradedOnboardingStages(degraded.message)
    workspaceState.value = deriveOnboardingWorkspaceState(degradedStages)
    evidenceTruthClass.value = 'unavailable'
  }
}

async function refresh(): Promise<void> {
  isLoading.value = true
  if (isDemoMode.value) {
    await new Promise<void>((resolve) => setTimeout(resolve, 300))
    workspaceState.value = deriveOnboardingWorkspaceState(fixtureStages[activeFixture.value])
    loadError.value = null
    isDegraded.value = false
  } else {
    await loadLiveData()
  }
  refreshedAt.value = new Date()
  isLoading.value = false
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  if (isDemoMode.value) {
    // Dev/demo: use deterministic fixtures
    setTimeout(() => {
      isLoading.value = false
    }, 150)
  } else {
    // Production: attempt live data load
    await loadLiveData()
    isLoading.value = false

    // Auto-refresh every 5 minutes in live environments
    autoRefreshInterval = setInterval(() => void refresh(), 5 * 60 * 1000)
  }
})

onBeforeUnmount(() => {
  if (autoRefreshInterval !== null) {
    clearInterval(autoRefreshInterval)
  }
})
</script>
