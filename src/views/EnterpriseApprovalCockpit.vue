<template>
  <MainLayout>
    <!-- Skip link (WCAG 2.4.1) -->
    <a
      href="#approval-cockpit-main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>

    <div
      id="approval-cockpit-main"
      role="region"
      aria-label="Enterprise Approval Queue and Release Sign-Off Cockpit"
      data-testid="approval-cockpit"
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    >
      <div class="max-w-5xl mx-auto">

        <!-- ── Page Header ── -->
        <header class="mb-8" data-testid="cockpit-header">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <ClipboardDocumentCheckIcon class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  data-testid="cockpit-heading"
                >
                  Enterprise Approval Queue
                </h1>
                <p class="text-gray-300 text-sm mt-1">
                  Release sign-off cockpit for regulated token launches.
                  Review each approval stage, resolve blockers, and authorize the launch.
                </p>
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end gap-1 mt-1">
              <span
                class="text-xs text-gray-400"
                data-testid="cockpit-refreshed-at"
                :aria-label="`Data last refreshed: ${formattedRefreshedAt}`"
              >
                Last refreshed: {{ formattedRefreshedAt }}
              </span>
              <button
                class="text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                data-testid="refresh-btn"
                aria-label="Refresh approval queue data"
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
          aria-label="Loading approval queue"
          aria-live="polite"
        >
          <div class="text-center">
            <ArrowPathIcon class="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" aria-hidden="true" />
            <p class="text-gray-300 text-sm">Loading approval queue…</p>
          </div>
        </div>

        <template v-else>

          <!-- ── Release Posture Summary ── -->
          <section
            class="rounded-2xl border p-6 mb-8 shadow-lg"
            :class="postureClass"
            aria-labelledby="posture-heading"
            data-testid="release-posture-banner"
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
                    Release Recommendation
                  </h2>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    :class="postureTextClass"
                    data-testid="posture-badge"
                    role="status"
                    :aria-label="`Release posture: ${RELEASE_POSTURE_LABELS[recommendation.posture]}`"
                  >
                    {{ RELEASE_POSTURE_LABELS[recommendation.posture] }}
                  </span>
                </div>
                <p
                  class="text-sm font-medium mb-1"
                  :class="postureTextClass"
                  data-testid="posture-headline"
                >
                  {{ recommendation.headline }}
                </p>
                <p class="text-sm text-gray-300" data-testid="posture-rationale">
                  {{ recommendation.rationale }}
                </p>

                <!-- Quick stats -->
                <dl
                  class="flex flex-wrap gap-4 mt-4"
                  aria-label="Release statistics"
                  data-testid="posture-stats"
                >
                  <div class="flex flex-col">
                    <dt class="text-xs text-gray-400">Stages approved</dt>
                    <dd
                      class="text-lg font-bold text-white"
                      :aria-label="`${recommendation.approvedStageCount} stages approved`"
                    >
                      {{ recommendation.approvedStageCount }} / {{ state.stages.length }}
                    </dd>
                  </div>
                  <div class="flex flex-col">
                    <dt class="text-xs text-gray-400">Stages blocked</dt>
                    <dd
                      class="text-lg font-bold"
                      :class="recommendation.blockedStageCount > 0 ? 'text-red-400' : 'text-white'"
                      :aria-label="`${recommendation.blockedStageCount} stages blocked`"
                    >
                      {{ recommendation.blockedStageCount }}
                    </dd>
                  </div>
                  <div class="flex flex-col">
                    <dt class="text-xs text-gray-400">Critical blockers</dt>
                    <dd
                      class="text-lg font-bold"
                      :class="recommendation.criticalBlockerCount > 0 ? 'text-red-400' : 'text-white'"
                      :aria-label="`${recommendation.criticalBlockerCount} critical blockers`"
                    >
                      {{ recommendation.criticalBlockerCount }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <!-- ── Current Blocking Stage Alert ── -->
          <div
            v-if="blockingStage"
            class="mb-6 rounded-xl border border-yellow-700 bg-yellow-950 p-4 flex items-start gap-3"
            role="alert"
            aria-live="assertive"
            data-testid="blocking-stage-alert"
          >
            <ExclamationTriangleIcon class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p class="text-sm font-semibold text-yellow-300">
                Currently blocking: {{ blockingStage.label }}
              </p>
              <p class="text-xs text-yellow-200 mt-0.5">
                {{ blockingStage.summary }}
              </p>
            </div>
          </div>

          <!-- ── Approval Stages ── -->
          <section
            aria-labelledby="stages-heading"
            data-testid="stages-section"
          >
            <h2
              id="stages-heading"
              class="text-xl font-semibold text-white mb-4"
              data-testid="stages-heading"
            >
              Review Stages
            </h2>

            <ol
              class="space-y-4"
              aria-label="Approval review stages"
              data-testid="stages-list"
            >
              <li
                v-for="(stage, index) in state.stages"
                :key="stage.id"
                :data-testid="`stage-card-${stage.id}`"
              >
                <article
                  class="rounded-2xl border bg-gray-800 shadow-sm overflow-hidden"
                  :class="stageStatusColorClass(stage.status, 'border')"
                  :aria-labelledby="`stage-heading-${stage.id}`"
                >
                  <!-- Stage Header (always visible) -->
                  <div
                    class="flex items-start gap-3 p-5 cursor-pointer"
                    :data-testid="`stage-header-${stage.id}`"
                    @click="toggleStage(stage.id)"
                    @keydown.enter="toggleStage(stage.id)"
                    @keydown.space.prevent="toggleStage(stage.id)"
                    :tabindex="0"
                    role="button"
                    :aria-expanded="expandedStages.has(stage.id)"
                    :aria-controls="`stage-body-${stage.id}`"
                    :aria-label="`Stage ${index + 1}: ${stage.label} — ${STAGE_STATUS_LABELS[stage.status]}. ${expandedStages.has(stage.id) ? 'Collapse' : 'Expand'} details.`"
                  >
                    <!-- Stage number -->
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                      :class="stageNumberClass(stage.status)"
                      aria-hidden="true"
                    >
                      {{ index + 1 }}
                    </div>

                    <!-- Stage info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3
                          :id="`stage-heading-${stage.id}`"
                          class="text-base font-semibold text-white"
                          :data-testid="`stage-label-${stage.id}`"
                        >
                          {{ stage.label }}
                        </h3>
                        <!-- Status badge -->
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          :class="stageStatusColorClass(stage.status, 'badge')"
                          :data-testid="`stage-status-${stage.id}`"
                          role="status"
                          :aria-label="`Status: ${STAGE_STATUS_LABELS[stage.status]}`"
                        >
                          {{ STAGE_STATUS_LABELS[stage.status] }}
                        </span>
                        <!-- Stale evidence indicator -->
                        <span
                          v-if="stageHasStaleEvidence(stage)"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-800 text-orange-200"
                          :data-testid="`stage-stale-${stage.id}`"
                          aria-label="Contains stale evidence"
                        >
                          <ClockIcon class="w-3 h-3" aria-hidden="true" />
                          Stale evidence
                        </span>
                      </div>
                      <!-- Reviewer role -->
                      <p class="text-xs text-gray-400 mb-1" :data-testid="`stage-role-${stage.id}`">
                        <UserCircleIcon class="w-3.5 h-3.5 inline-block mr-1 align-text-bottom" aria-hidden="true" />
                        {{ REVIEWER_ROLE_LABELS[stage.role] }}
                      </p>
                      <!-- Summary -->
                      <p class="text-sm text-gray-300" :data-testid="`stage-summary-${stage.id}`">
                        {{ stage.summary }}
                      </p>
                    </div>

                    <!-- Expand/collapse icon -->
                    <ChevronDownIcon
                      class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform duration-200"
                      :class="{ 'rotate-180': expandedStages.has(stage.id) }"
                      aria-hidden="true"
                    />
                  </div>

                  <!-- Stage Body (expandable) -->
                  <div
                    v-show="expandedStages.has(stage.id)"
                    :id="`stage-body-${stage.id}`"
                    class="border-t border-gray-700 px-5 pb-5 pt-4 space-y-4"
                    :data-testid="`stage-body-${stage.id}`"
                  >
                    <!-- Review scope -->
                    <div>
                      <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Review Scope
                      </h4>
                      <p class="text-sm text-gray-300" :data-testid="`stage-scope-${stage.id}`">
                        {{ stage.reviewScope }}
                      </p>
                    </div>

                    <!-- Blockers -->
                    <div v-if="stage.blockers.length > 0">
                      <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Blockers &amp; Required Actions
                      </h4>
                      <ul
                        class="space-y-3"
                        :aria-label="`Blockers for ${stage.label}`"
                        :data-testid="`stage-blockers-${stage.id}`"
                      >
                        <li
                          v-for="blocker in stage.blockers"
                          :key="blocker.id"
                          class="rounded-lg border p-3"
                          :class="blockerCardClass(blocker.severity)"
                          :data-testid="`blocker-${blocker.id}`"
                        >
                          <div class="flex items-start gap-2 mb-1">
                            <!-- Severity badge -->
                            <span
                              class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0"
                              :class="blockerSeverityBadgeClass(blocker.severity)"
                              :aria-label="`Severity: ${BLOCKER_SEVERITY_LABELS[blocker.severity]}`"
                              :data-testid="`blocker-severity-${blocker.id}`"
                            >
                              {{ BLOCKER_SEVERITY_LABELS[blocker.severity] }}
                            </span>
                            <!-- Launch blocking indicator -->
                            <span
                              v-if="blocker.isLaunchBlocking"
                              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300 flex-shrink-0"
                              aria-label="This blocker prevents launch"
                              :data-testid="`blocker-launch-blocking-${blocker.id}`"
                            >
                              <ExclamationCircleIcon class="w-3 h-3" aria-hidden="true" />
                              Launch blocking
                            </span>
                          </div>

                          <p class="text-sm font-medium text-white mb-0.5" :data-testid="`blocker-title-${blocker.id}`">
                            {{ blocker.title }}
                          </p>
                          <p class="text-xs text-gray-300 mb-1" :data-testid="`blocker-reason-${blocker.id}`">
                            <span class="font-medium text-gray-400">Why: </span>{{ blocker.reason }}
                          </p>
                          <p class="text-xs text-gray-300 mb-1" :data-testid="`blocker-action-${blocker.id}`">
                            <span class="font-medium text-gray-400">Action: </span>{{ blocker.action }}
                          </p>

                          <!-- Stale since label -->
                          <p
                            v-if="blocker.staleSince"
                            class="text-xs text-orange-300 flex items-center gap-1 mb-1"
                            :data-testid="`blocker-stale-${blocker.id}`"
                            :aria-label="`Evidence stale since ${formatStalenessLabel(blocker.staleSince)}`"
                          >
                            <ClockIcon class="w-3 h-3" aria-hidden="true" />
                            Evidence last updated {{ formatStalenessLabel(blocker.staleSince) }}
                          </p>

                          <!-- Evidence link -->
                          <RouterLink
                            v-if="blocker.evidencePath"
                            :to="blocker.evidencePath"
                            class="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                            :data-testid="`blocker-link-${blocker.id}`"
                            :aria-label="`Go to evidence for: ${blocker.title}`"
                          >
                            <ArrowTopRightOnSquareIcon class="w-3 h-3" aria-hidden="true" />
                            View evidence
                          </RouterLink>
                        </li>
                      </ul>
                    </div>

                    <!-- Empty blockers state -->
                    <div
                      v-else
                      class="text-sm text-gray-400 flex items-center gap-2 py-1"
                      :data-testid="`stage-no-blockers-${stage.id}`"
                      aria-label="No blockers for this stage"
                    >
                      <CheckCircleIcon class="w-4 h-4 text-green-400" aria-hidden="true" />
                      No blockers identified for this stage.
                    </div>

                    <!-- Conditions (for conditional approval) -->
                    <div v-if="stage.conditions">
                      <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Approval Conditions
                      </h4>
                      <p
                        class="text-sm text-teal-300 bg-teal-900 rounded-lg p-3"
                        :data-testid="`stage-conditions-${stage.id}`"
                        role="note"
                        :aria-label="`Conditions for ${stage.label}: ${stage.conditions}`"
                      >
                        {{ stage.conditions }}
                      </p>
                    </div>

                    <!-- Evidence links -->
                    <div v-if="stage.evidenceLinks.length > 0">
                      <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Evidence &amp; Reference Links
                      </h4>
                      <ul
                        class="flex flex-wrap gap-2"
                        :aria-label="`Evidence links for ${stage.label}`"
                        :data-testid="`stage-evidence-links-${stage.id}`"
                      >
                        <li
                          v-for="link in stage.evidenceLinks"
                          :key="link.path"
                        >
                          <RouterLink
                            :to="link.path"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors"
                            :data-testid="`evidence-link-${stage.id}-${link.path.replace(/\//g, '-')}`"
                          >
                            <LinkIcon class="w-3 h-3" aria-hidden="true" />
                            {{ link.label }}
                          </RouterLink>
                        </li>
                      </ul>
                    </div>

                    <!-- Status description -->
                    <p
                      class="text-xs text-gray-400 italic"
                      :data-testid="`stage-status-description-${stage.id}`"
                    >
                      {{ STAGE_STATUS_DESCRIPTIONS[stage.status] }}
                    </p>
                  </div>
                </article>
              </li>
            </ol>
          </section>

          <!-- ── Top Blockers Summary ── -->
          <section
            v-if="topBlockers.length > 0"
            class="mt-8 rounded-2xl border border-red-800 bg-red-950 p-6"
            aria-labelledby="top-blockers-heading"
            data-testid="top-blockers-section"
          >
            <div class="flex items-center gap-2 mb-4">
              <XCircleIcon class="w-5 h-5 text-red-400" aria-hidden="true" />
              <h2
                id="top-blockers-heading"
                class="text-base font-semibold text-white"
                data-testid="top-blockers-heading"
              >
                Top Release Blockers
              </h2>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-800 text-red-200"
                :aria-label="`${topBlockers.length} launch-blocking items`"
                data-testid="top-blockers-count"
              >
                {{ topBlockers.length }}
              </span>
            </div>
            <p class="text-sm text-gray-300 mb-4">
              These items are preventing the launch from proceeding. Each must be resolved and re-reviewed before sign-off can be completed.
            </p>
            <ol
              class="space-y-3"
              aria-label="Launch-blocking items ordered by severity"
              data-testid="top-blockers-list"
            >
              <li
                v-for="(blocker, i) in topBlockers"
                :key="blocker.id"
                class="flex items-start gap-3"
                :data-testid="`top-blocker-${blocker.id}`"
              >
                <span
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 bg-red-800 text-red-200"
                  aria-hidden="true"
                >{{ i + 1 }}</span>
                <div>
                  <div class="flex items-center gap-2 flex-wrap mb-0.5">
                    <span class="text-sm font-medium text-white">{{ blocker.title }}</span>
                    <span
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
                      :class="blockerSeverityBadgeClass(blocker.severity)"
                      :aria-label="`Severity: ${BLOCKER_SEVERITY_LABELS[blocker.severity]}`"
                    >
                      {{ BLOCKER_SEVERITY_LABELS[blocker.severity] }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-300">{{ blocker.action }}</p>
                  <RouterLink
                    v-if="blocker.evidencePath"
                    :to="blocker.evidencePath"
                    class="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded mt-1"
                    :data-testid="`top-blocker-link-${blocker.id}`"
                    :aria-label="`Go to evidence for: ${blocker.title}`"
                  >
                    <ArrowTopRightOnSquareIcon class="w-3 h-3" aria-hidden="true" />
                    Resolve issue
                  </RouterLink>
                </div>
              </li>
            </ol>
          </section>

          <!-- ── No Blockers — Ready State ── -->
          <section
            v-else
            class="mt-8 rounded-2xl border border-green-700 bg-green-950 p-6 flex items-center gap-4"
            aria-label="No launch-blocking items"
            data-testid="no-blockers-state"
          >
            <CheckCircleIcon class="w-8 h-8 text-green-400 flex-shrink-0" aria-hidden="true" />
            <div>
              <p class="text-sm font-semibold text-green-300">No launch-blocking items identified</p>
              <p class="text-xs text-gray-300 mt-0.5">
                All review stages are clear of critical blockers. Complete any remaining sign-off stages to finalize the release.
              </p>
            </div>
          </section>

          <!-- ── Remediation Workflow Panel ── -->
          <RemediationTaskPanel
            :workflow="remediationWorkflow"
          />

          <!-- ── Strict Sign-Off Readiness Workspace ── -->
          <SignOffReadinessPanel
            :readiness="signOffReadiness"
          />

          <!-- ── Investor Onboarding Readiness Summary ── -->
          <section
            class="mt-6 rounded-xl border p-5"
            :class="onboardingReadinessLoaded
              ? (onboardingReadinessBlocked ? 'border-red-800 bg-red-950/40' : onboardingReadinessReady ? 'border-green-800 bg-green-950/30' : 'border-gray-700 bg-gray-800/60')
              : 'border-gray-700 bg-gray-800/60'"
            data-testid="onboarding-readiness-summary"
            aria-labelledby="onboarding-summary-heading"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <h2
                id="onboarding-summary-heading"
                class="text-base font-semibold text-white flex items-center gap-2"
              >
                <ClipboardDocumentCheckIcon class="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                Investor Compliance Onboarding
              </h2>
              <RouterLink
                to="/compliance/onboarding"
                class="text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
                data-testid="onboarding-readiness-link"
                aria-label="Open investor compliance onboarding workspace"
              >
                Open workspace →
              </RouterLink>
            </div>

            <!-- Loading skeleton -->
            <div v-if="!onboardingReadinessLoaded" class="animate-pulse space-y-2" aria-busy="true" aria-label="Loading onboarding readiness">
              <div class="h-4 bg-gray-700 rounded w-3/4"></div>
              <div class="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>

            <!-- Loaded state -->
            <template v-else>
              <div class="flex items-center gap-3 mb-2">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="onboardingReadinessReady ? 'bg-green-800 text-green-200' :
                    onboardingReadinessBlocked ? 'bg-red-800 text-red-200' :
                    'bg-yellow-800 text-yellow-200'"
                  data-testid="onboarding-status-badge"
                >
                  {{ onboardingStatusLabel }}
                </span>
                <span class="text-xs text-gray-400" data-testid="onboarding-readiness-score">
                  Readiness: {{ onboardingReadinessScore }}%
                </span>
              </div>
              <p class="text-sm text-gray-300" data-testid="onboarding-readiness-headline">
                {{ onboardingHeadline }}
              </p>
              <div
                v-if="onboardingBlockerTitles.length > 0"
                class="mt-3 space-y-1"
                data-testid="onboarding-blocker-list"
                role="list"
                aria-label="Onboarding blockers"
              >
                <div
                  v-for="title in onboardingBlockerTitles"
                  :key="title"
                  class="flex items-start gap-2 text-xs text-red-300"
                  role="listitem"
                >
                  <ExclamationTriangleIcon class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-400" aria-hidden="true" />
                  {{ title }}
                </div>
              </div>
              <p
                v-if="onboardingDegradedMessage"
                class="mt-2 text-xs text-yellow-300"
                role="alert"
                data-testid="onboarding-degraded-message"
              >
                ⚠ {{ onboardingDegradedMessage }}
              </p>
            </template>
          </section>

          <!-- ── Navigation Links ── -->
          <nav
            aria-label="Related compliance workspaces"
            class="mt-8"
            data-testid="cockpit-nav"
          >
            <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Related Workspaces
            </h2>
            <ul class="flex flex-wrap gap-3" role="list">
              <li v-for="link in workspaceLinks" :key="link.path">
                <RouterLink
                  :to="link.path"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors"
                  :data-testid="`workspace-link-${link.path.replace(/\//g, '-')}`"
                >
                  <component :is="link.icon" class="w-4 h-4" aria-hidden="true" />
                  {{ link.label }}
                </RouterLink>
              </li>
            </ul>
          </nav>

          <!-- ── Heuristic disclaimer ── -->
          <p
            class="mt-6 text-xs text-gray-500 flex items-start gap-1.5"
            data-testid="cockpit-disclaimer"
          >
            <InformationCircleIcon class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            This cockpit presents a frontend-derived workflow model. Approval decisions shown here are not yet backend-enforced. Review stages will be connected to persistent sign-off APIs in a future release.
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
import RemediationTaskPanel from '../components/approval/RemediationTaskPanel.vue'
import SignOffReadinessPanel from '../components/approval/SignOffReadinessPanel.vue'

import {
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  BuildingOfficeIcon,
} from '@heroicons/vue/24/outline'

import {
  type ApprovalCockpitState,
  type ApprovalStage,
  type BlockerSeverity,
  type ApprovalStageStatus,
  type ReleasePosture,
  STAGE_STATUS_LABELS,
  STAGE_STATUS_DESCRIPTIONS,
  REVIEWER_ROLE_LABELS,
  RELEASE_POSTURE_LABELS,
  BLOCKER_SEVERITY_LABELS,
  buildDefaultCockpitState,
  findBlockingStage,
  getTopBlockers,
  stageStatusColorClass,
  releasePostureBannerClass,
  releasePostureTextClass,
  blockerSeverityBadgeClass,
  isEvidenceStale,
  formatStalenessLabel,
} from '../utils/approvalCockpit'

import { deriveRemediationWorkflow } from '../utils/remediationWorkflow'
import { buildDefaultReleaseReadiness } from '../utils/releaseReadiness'
import { createComplianceCaseClient } from '../lib/api/complianceCaseManagement'
import { normaliseCohortReadinessSummary } from '../utils/complianceCaseNormalizer'
import { useAuthStore } from '../stores/auth'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const isLoading = ref(true)
const state = ref<ApprovalCockpitState>(buildDefaultCockpitState())
const expandedStages = ref<Set<string>>(new Set())
let loadTimer: ReturnType<typeof setTimeout> | null = null

// ---------------------------------------------------------------------------
// Onboarding readiness (live data from compliance case API)
// ---------------------------------------------------------------------------

const authStore = useAuthStore()
const onboardingReadinessLoaded = ref(false)
const onboardingReadinessReady = ref(false)
const onboardingReadinessBlocked = ref(false)
const onboardingReadinessScore = ref(0)
const onboardingStatusLabel = ref('Loading…')
const onboardingHeadline = ref('')
const onboardingBlockerTitles = ref<string[]>([])
const onboardingDegradedMessage = ref<string | null>(null)

async function loadOnboardingReadiness(): Promise<void> {
  const bearerToken = authStore.session || localStorage.getItem('arc76_session')
  const client = createComplianceCaseClient(bearerToken)
  if (!client) {
    // No auth token — show a neutral placeholder without claiming ready
    onboardingReadinessLoaded.value = true
    onboardingStatusLabel.value = 'Not Available'
    onboardingHeadline.value = 'Sign in to load live onboarding readiness data.'
    return
  }
  try {
    const result = await client.getMonitoringDashboard()
    if (!result.ok) {
      onboardingReadinessLoaded.value = true
      onboardingReadinessBlocked.value = true
      onboardingStatusLabel.value = 'Data Unavailable'
      onboardingHeadline.value = 'Onboarding readiness cannot be confirmed.'
      onboardingDegradedMessage.value = result.error.userGuidance
      return
    }
    const cohorts = result.data.cohortSummaries
    if (!cohorts || cohorts.length === 0) {
      onboardingReadinessLoaded.value = true
      onboardingStatusLabel.value = 'No Cohorts'
      onboardingHeadline.value = 'No investor cohorts have been registered yet.'
      return
    }
    const summary = normaliseCohortReadinessSummary(cohorts[0])
    onboardingReadinessLoaded.value = true
    onboardingReadinessReady.value = summary.isReadyForHandoff
    onboardingReadinessBlocked.value = summary.hasLaunchBlockers && !summary.isReadyForHandoff
    onboardingReadinessScore.value = summary.readinessScore
    onboardingStatusLabel.value = summary.statusLabel
    onboardingHeadline.value = summary.headline
    onboardingBlockerTitles.value = summary.blockerTitles
    onboardingDegradedMessage.value = null
  } catch (err) {
    onboardingReadinessLoaded.value = true
    onboardingReadinessBlocked.value = true
    onboardingStatusLabel.value = 'Error'
    onboardingHeadline.value = 'Failed to load onboarding readiness data.'
    onboardingDegradedMessage.value =
      err instanceof Error ? err.message : 'Unexpected error loading compliance data.'
  }
}

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const recommendation = computed(() => state.value.recommendation)
const topBlockers = computed(() => getTopBlockers(state.value.stages))
const blockingStage = computed(() => findBlockingStage(state.value.stages))
const remediationWorkflow = computed(() => deriveRemediationWorkflow(state.value.stages))
const signOffReadiness = computed(() => buildDefaultReleaseReadiness())

const formattedRefreshedAt = computed(() => {
  if (!state.value.refreshedAt) return ''
  const d = new Date(state.value.refreshedAt)
  return isNaN(d.getTime()) ? state.value.refreshedAt : d.toLocaleString()
})

const postureClass = computed(() =>
  releasePostureBannerClass(recommendation.value.posture),
)

const postureTextClass = computed(() =>
  releasePostureTextClass(recommendation.value.posture),
)

const postureIcon = computed(() => {
  switch (recommendation.value.posture as ReleasePosture) {
    case 'ready':
      return CheckCircleIcon
    case 'conditionally_ready':
      return ExclamationTriangleIcon
    case 'not_ready':
      return XCircleIcon
  }
})

const postureIconBgClass = computed(() => {
  switch (recommendation.value.posture as ReleasePosture) {
    case 'ready':
      return 'bg-green-700'
    case 'conditionally_ready':
      return 'bg-teal-700'
    case 'not_ready':
      return 'bg-red-700'
  }
})

const workspaceLinks = [
  { label: 'Compliance Launch Console', path: '/compliance/launch', icon: ShieldCheckIcon },
  { label: 'Compliance Setup', path: '/compliance/setup', icon: ShieldExclamationIcon },
  { label: 'Evidence Pack', path: '/compliance/evidence', icon: DocumentTextIcon },
  { label: 'Risk Report Builder', path: '/compliance/risk-report', icon: ShieldExclamationIcon },
  { label: 'Compliance Reporting', path: '/compliance/reporting', icon: DocumentTextIcon },
  { label: 'Operations', path: '/operations', icon: BuildingOfficeIcon },
]

// ---------------------------------------------------------------------------
// Helpers exposed to template
// ---------------------------------------------------------------------------

function stageHasStaleEvidence(stage: ApprovalStage): boolean {
  return stage.blockers.some((b) => isEvidenceStale(b.staleSince))
}

function stageNumberClass(status: ApprovalStageStatus): string {
  const map: Record<ApprovalStageStatus, string> = {
    not_started: 'bg-gray-700 text-gray-400',
    ready_for_review: 'bg-blue-700 text-blue-100',
    in_review: 'bg-indigo-700 text-indigo-100',
    needs_attention: 'bg-yellow-700 text-yellow-100',
    conditionally_approved: 'bg-teal-700 text-teal-100',
    approved: 'bg-green-700 text-green-100',
    blocked: 'bg-red-700 text-red-100',
  }
  return map[status]
}

function blockerCardClass(severity: BlockerSeverity): string {
  switch (severity) {
    case 'critical':
      return 'border-red-800 bg-red-900'
    case 'high':
      return 'border-orange-800 bg-orange-900'
    case 'medium':
      return 'border-yellow-800 bg-yellow-900'
    case 'informational':
      return 'border-gray-700 bg-gray-800'
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function toggleStage(stageId: string): void {
  const current = expandedStages.value
  if (current.has(stageId)) {
    const next = new Set(current)
    next.delete(stageId)
    expandedStages.value = next
  } else {
    expandedStages.value = new Set([...current, stageId])
  }
}

function refresh(): void {
  isLoading.value = true
  if (loadTimer !== null) clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    state.value = buildDefaultCockpitState()
    // Preserve currently expanded stages
    isLoading.value = false
  }, 400)
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  loadTimer = setTimeout(() => {
    state.value = buildDefaultCockpitState()
    isLoading.value = false
  }, 300)
  // Load onboarding readiness from compliance case API (non-blocking)
  void loadOnboardingReadiness()
})

onBeforeUnmount(() => {
  if (loadTimer !== null) clearTimeout(loadTimer)
})

// ---------------------------------------------------------------------------
// Expose for tests
// ---------------------------------------------------------------------------

defineExpose({
  isLoading,
  state,
  expandedStages,
  toggleStage,
  refresh,
  recommendation,
  topBlockers,
  blockingStage,
  remediationWorkflow,
  signOffReadiness,
  stageHasStaleEvidence,
  stageNumberClass,
  blockerCardClass,
  postureIcon,
  postureIconBgClass,
  formattedRefreshedAt,
  // Onboarding readiness
  onboardingReadinessLoaded,
  onboardingReadinessReady,
  onboardingReadinessBlocked,
  onboardingReadinessScore,
  onboardingStatusLabel,
  onboardingHeadline,
  onboardingBlockerTitles,
  onboardingDegradedMessage,
  loadOnboardingReadiness,
})
</script>
