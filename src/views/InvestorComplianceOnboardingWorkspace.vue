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
                      Resolve →
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
            <h2
              id="stages-heading"
              class="text-xl font-semibold text-white mb-4"
              data-testid="stages-heading"
            >
              Review Stages
            </h2>

            <ol
              class="space-y-3"
              aria-label="Onboarding review stages"
              data-testid="stages-list"
            >
              <li
                v-for="(stage, index) in workspaceState.stages"
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
  MOCK_ONBOARDING_STAGES_READY,
  MOCK_ONBOARDING_STAGES_BLOCKED,
  MOCK_ONBOARDING_STAGES_PARTIAL,
  MOCK_ONBOARDING_STAGES_STALE,
} from '../utils/investorComplianceOnboarding'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const isLoading = ref(true)
const refreshedAt = ref<Date>(new Date())
const expandedStageIds = ref<Set<string>>(new Set())

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
}

function refresh(): void {
  isLoading.value = true
  setTimeout(() => {
    workspaceState.value = deriveOnboardingWorkspaceState(fixtureStages[activeFixture.value])
    refreshedAt.value = new Date()
    isLoading.value = false
  }, 300)
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // Simulate async data load
  setTimeout(() => {
    isLoading.value = false
  }, 150)

  // Auto-refresh every 5 minutes in non-demo environments
  if (!import.meta.env.DEV) {
    autoRefreshInterval = setInterval(refresh, 5 * 60 * 1000)
  }
})

onBeforeUnmount(() => {
  if (autoRefreshInterval !== null) {
    clearInterval(autoRefreshInterval)
  }
})
</script>
