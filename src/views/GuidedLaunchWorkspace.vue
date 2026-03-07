<template>
  <div
    class="guided-launch-workspace min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    data-testid="guided-launch-workspace"
  >
    <!-- Skip to main content (WCAG 2.1 AA 2.4.1) -->
    <a
      href="#workspace-main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      Skip to main content
    </a>

    <div class="max-w-7xl mx-auto">
      <!-- Page Header -->
      <header class="mb-8" data-testid="workspace-header">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0"
                aria-hidden="true"
              >
                <RocketLaunchIcon class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  data-testid="workspace-heading"
                >
                  Guided Launch Workspace
                </h1>
                <p class="text-gray-400 text-sm mt-1">
                  Your step-by-step control centre for a confident, compliant token launch.
                </p>
              </div>
            </div>
          </div>

          <!-- Readiness Status Chip -->
          <div
            class="flex items-center gap-3"
            data-testid="readiness-chip-container"
          >
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              :class="readinessLabel.colorClass"
              :aria-label="readinessLabel.ariaLabel"
              role="status"
              data-testid="readiness-chip"
            >
              <span class="w-2 h-2 rounded-full" :class="readinessDotClass" aria-hidden="true"></span>
              {{ readinessLabel.label }}
            </div>
          </div>
        </div>

        <!-- Readiness description -->
        <p
          class="mt-3 text-gray-300 text-sm max-w-2xl"
          data-testid="readiness-description"
          aria-live="polite"
        >
          {{ readinessLabel.description }}
        </p>
      </header>

      <!-- Three-panel layout: sidebar | main content | help rail -->
      <div class="flex flex-col lg:flex-row gap-6">

        <!-- ── Left Panel: Progress Sidebar ── -->
        <aside
          class="lg:w-72 flex-shrink-0"
          aria-label="Launch prerequisites checklist"
          data-testid="prerequisites-sidebar"
        >
          <div class="glass-effect rounded-2xl p-5 shadow-lg border border-white/10 sticky top-6">
            <!-- Progress summary -->
            <div class="mb-5">
              <div class="flex items-center justify-between mb-2">
                <h2 class="text-base font-semibold text-white">Prerequisites</h2>
                <span class="text-sm text-gray-400" aria-label="Progress summary">
                  {{ progress.completedRequired }}/{{ progress.totalRequired }}
                </span>
              </div>

              <!-- Progress bar (WCAG: role="progressbar") -->
              <div
                class="w-full bg-gray-700 rounded-full h-2"
                role="progressbar"
                :aria-valuenow="progress.percentComplete"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`Overall prerequisite progress: ${progress.percentComplete}% complete`"
              >
                <div
                  class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  :style="{ width: `${progress.percentComplete}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ progress.percentComplete }}% complete</p>
            </div>

            <!-- Checklist items nav -->
            <nav aria-label="Checklist steps" data-testid="checklist-nav">
              <ul class="space-y-2" role="list">
                <li
                  v-for="item in checklistItems"
                  :key="item.id"
                  data-testid="checklist-item"
                >
                  <button
                    class="w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 flex items-center gap-3"
                    :class="checklistItemButtonClass(item)"
                    :aria-label="`${getChecklistItemStatusLabel(item.status ?? 'locked')}: ${item.title}`"
                    :aria-current="activeItemId === item.id ? 'true' : undefined"
                    :disabled="item.status === 'locked'"
                    @click="selectItem(item)"
                    @keydown.enter="selectItem(item)"
                  >
                    <!-- Status icon -->
                    <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full" :class="checklistIconClass(item)" aria-hidden="true">
                      <CheckIcon v-if="item.status === 'complete'" class="w-3.5 h-3.5" />
                      <ExclamationTriangleIcon v-else-if="item.status === 'blocked'" class="w-3.5 h-3.5" />
                      <LockClosedIcon v-else-if="item.status === 'locked'" class="w-3 h-3" />
                      <span v-else-if="item.status === 'in_progress'" class="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                      <span v-else class="w-2 h-2 rounded-full bg-current"></span>
                    </span>
                    <span class="text-sm truncate">{{ item.title }}</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        <!-- ── Centre Panel: Task Content ── -->
        <main
          id="workspace-main"
          class="flex-1 min-w-0"
          data-testid="workspace-main"
          tabindex="-1"
        >
          <!-- Active checklist item detail card -->
          <div
            v-if="activeItem && activeItem.status !== 'locked'"
            class="glass-effect rounded-2xl p-6 shadow-lg border border-white/10 mb-6"
            data-testid="active-item-card"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  :class="activeItemIconContainerClass"
                  aria-hidden="true"
                >
                  <CheckIcon v-if="activeItem.status === 'complete'" class="w-5 h-5 text-white" />
                  <ExclamationTriangleIcon v-else-if="activeItem.status === 'blocked'" class="w-5 h-5 text-white" />
                  <ArrowRightIcon v-else class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white" data-testid="active-item-title">
                    {{ activeItem.title }}
                  </h2>
                  <span
                    class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                    :class="statusBadgeClass(activeItem.status ?? 'locked')"
                    data-testid="active-item-status-badge"
                  >
                    {{ getChecklistItemStatusLabel(activeItem.status ?? 'locked') }}
                  </span>
                </div>
              </div>
              <span class="text-xs text-gray-500 hidden sm:block flex-shrink-0 ml-4">
                ⏱ {{ activeItem.estimatedTime }}
              </span>
            </div>

            <p class="text-gray-300 text-sm mb-5 leading-relaxed" data-testid="active-item-description">
              {{ activeItem.description }}
            </p>

            <!-- Blocked reason banner -->
            <div
              v-if="activeItem.status === 'blocked' && activeItem.blockReason"
              class="mb-5 rounded-xl p-4 bg-amber-900/30 border border-amber-700/50 flex items-start gap-3"
              role="alert"
              data-testid="block-reason-banner"
            >
              <ExclamationTriangleIcon class="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p class="text-sm font-semibold text-amber-300">Action required</p>
                <p class="text-sm text-amber-200 mt-1">{{ activeItem.blockReason }}</p>
              </div>
            </div>

            <!-- CTA button -->
            <div class="flex flex-wrap items-center gap-3" data-testid="active-item-cta-area">
              <a
                v-if="activeItem.status !== 'complete'"
                :href="activeItem.ctaPath"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                :data-testid="`cta-${activeItem.id}`"
                @click="handleCtaClick(activeItem)"
              >
                {{ activeItem.ctaLabel }}
                <ArrowRightIcon class="w-4 h-4" aria-hidden="true" />
              </a>

              <button
                v-if="activeItem.status === 'available' || activeItem.status === 'in_progress'"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                @click="markItemComplete(activeItem.id)"
                :data-testid="`mark-complete-${activeItem.id}`"
              >
                <CheckIcon class="w-4 h-4" aria-hidden="true" />
                Mark as complete
              </button>
            </div>
          </div>

          <!-- Locked item placeholder -->
          <div
            v-else-if="activeItem && activeItem.status === 'locked'"
            class="glass-effect rounded-2xl p-6 shadow-lg border border-white/10 mb-6 opacity-75"
            data-testid="locked-item-card"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <LockClosedIcon class="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-400">{{ activeItem.title }}</h2>
                <span class="text-xs text-gray-500">Locked — complete the prerequisites first</span>
              </div>
            </div>
            <p class="text-gray-500 text-sm mb-4">{{ activeItem.description }}</p>
            <div
              v-if="activeItem.blockReason"
              class="rounded-xl p-3 bg-gray-800/60 border border-gray-700"
              role="note"
              data-testid="locked-reason-note"
            >
              <p class="text-sm text-gray-400">{{ activeItem.blockReason }}</p>
            </div>
          </div>

          <!-- Default empty state when no item selected -->
          <div
            v-else
            class="glass-effect rounded-2xl p-8 shadow-lg border border-white/10 mb-6 text-center"
            data-testid="empty-state"
          >
            <RocketLaunchIcon class="w-12 h-12 text-gray-600 mx-auto mb-4" aria-hidden="true" />
            <h2 class="text-lg font-semibold text-gray-300 mb-2">Select a prerequisite to begin</h2>
            <p class="text-gray-500 text-sm">
              Choose a step from the checklist on the left to view its details and take action.
            </p>
          </div>

          <!-- ── Simulation Panel ── -->
          <section
            class="glass-effect rounded-2xl p-6 shadow-lg border border-white/10"
            aria-labelledby="simulation-heading"
            data-testid="simulation-panel"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <BeakerIcon class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 id="simulation-heading" class="text-lg font-bold text-white" data-testid="simulation-heading">
                    Launch Simulation
                  </h2>
                  <p class="text-xs text-gray-400 mt-0.5">
                    Dry-run your token launch before committing to the blockchain.
                  </p>
                </div>
              </div>

              <div
                v-if="simulation.lastRunAt"
                class="text-xs text-gray-500 text-right hidden sm:block"
              >
                Last run:<br>
                <time :datetime="simulation.lastRunAt">{{ formatSimulationTime(simulation.lastRunAt) }}</time>
              </div>
            </div>

            <!-- Simulation idle state -->
            <div v-if="simulation.phase === 'idle'" data-testid="simulation-idle">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                <div class="rounded-xl bg-gray-800/50 border border-gray-700/50 p-3 text-center">
                  <p class="text-xs text-gray-500 mb-1">Estimated duration</p>
                  <p class="text-sm font-semibold text-white">{{ simulation.estimatedDurationLabel }}</p>
                </div>
                <div class="rounded-xl bg-gray-800/50 border border-gray-700/50 p-3 text-center">
                  <p class="text-xs text-gray-500 mb-1">Checks performed</p>
                  <p class="text-sm font-semibold text-white">12 validations</p>
                </div>
                <div class="rounded-xl bg-gray-800/50 border border-gray-700/50 p-3 text-center col-span-2 sm:col-span-1">
                  <p class="text-xs text-gray-500 mb-1">Environment</p>
                  <p class="text-sm font-semibold text-white">Sandbox (safe)</p>
                </div>
              </div>

              <!-- Prerequisite gating message -->
              <div
                v-if="!simulation.canStart"
                class="rounded-xl p-4 bg-gray-800/60 border border-gray-700 mb-5"
                role="note"
                data-testid="simulation-gated-notice"
              >
                <p class="text-sm text-gray-400">
                  Complete all prerequisite steps — including <strong class="text-gray-300">Legal Confirmations</strong> — before running the simulation.
                </p>
              </div>

              <button
                :disabled="!simulation.canStart"
                @click="startSimulation"
                class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                :class="simulation.canStart
                  ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'"
                :aria-disabled="!simulation.canStart"
                data-testid="start-simulation-btn"
              >
                <BeakerIcon class="w-4 h-4" aria-hidden="true" />
                Start Simulation
              </button>
            </div>

            <!-- Simulation running state -->
            <div v-else-if="simulation.phase === 'running'" class="flex items-center gap-4 py-4" data-testid="simulation-running">
              <div class="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" aria-hidden="true"></div>
              <div>
                <p class="text-white font-semibold">Simulation in progress…</p>
                <p class="text-gray-400 text-sm">Validating token parameters and compliance configuration.</p>
              </div>
            </div>

            <!-- Simulation success state -->
            <div
              v-else-if="simulation.phase === 'success'"
              class="rounded-xl p-5 bg-green-900/30 border border-green-700/50"
              role="status"
              aria-live="polite"
              data-testid="simulation-success"
            >
              <div class="flex items-start gap-3 mb-3">
                <CheckCircleIcon class="w-6 h-6 text-green-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p class="font-semibold text-green-300">{{ simulationOutcome.heading }}</p>
                  <p class="text-sm text-green-200 mt-1">{{ simulationOutcome.body }}</p>
                </div>
              </div>
              <button
                @click="resetSimulation"
                class="text-sm text-green-400 underline hover:text-green-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                data-testid="reset-simulation-btn"
              >
                Run again
              </button>
            </div>

            <!-- Simulation failed state -->
            <div
              v-else-if="simulation.phase === 'failed'"
              class="rounded-xl p-5 bg-red-900/30 border border-red-700/50"
              role="alert"
              data-testid="simulation-failed"
            >
              <div class="flex items-start gap-3 mb-3">
                <XCircleIcon class="w-6 h-6 text-red-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p class="font-semibold text-red-300">{{ simulationOutcome.heading }}</p>
                  <p class="text-sm text-red-200 mt-1">{{ simulationOutcome.body }}</p>
                </div>
              </div>
              <div v-if="simulationOutcome.remediation?.length" class="mt-3">
                <p class="text-sm font-semibold text-red-300 mb-2">To resolve this issue:</p>
                <ol class="list-decimal list-inside space-y-1">
                  <li
                    v-for="(step, i) in simulationOutcome.remediation"
                    :key="i"
                    class="text-sm text-red-200"
                  >
                    {{ step }}
                  </li>
                </ol>
              </div>
              <button
                @click="resetSimulation"
                class="mt-4 text-sm text-red-400 underline hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                data-testid="retry-simulation-btn"
              >
                Retry simulation
              </button>
            </div>
          </section>
        </main>

        <!-- ── Right Panel: Contextual Help Rail ── -->
        <aside
          class="lg:w-64 flex-shrink-0 hidden lg:block"
          aria-label="Contextual help"
          data-testid="help-rail"
        >
          <div class="glass-effect rounded-2xl p-5 shadow-lg border border-white/10 sticky top-6 space-y-5">
            <h2 class="text-sm font-semibold text-white" id="help-heading">Help & Guidance</h2>

            <!-- Next recommended action -->
            <div
              v-if="progress.nextActionItem"
              class="rounded-xl bg-blue-900/20 border border-blue-800/40 p-4"
              aria-labelledby="next-action-heading"
              data-testid="next-action-card"
            >
              <h3 id="next-action-heading" class="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">
                Recommended next step
              </h3>
              <p class="text-sm text-white font-medium">{{ progress.nextActionItem.title }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ progress.nextActionItem.estimatedTime }}</p>
            </div>

            <!-- FAQ / tips -->
            <div>
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Frequently asked
              </h3>
              <ul class="space-y-3" role="list">
                <li>
                  <details class="group">
                    <summary
                      class="text-sm text-gray-300 cursor-pointer hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded list-none flex items-center gap-1"
                    >
                      <ChevronRightIcon class="w-3.5 h-3.5 text-gray-500 group-open:rotate-90 transition-transform" aria-hidden="true" />
                      What is a simulation?
                    </summary>
                    <p class="mt-2 text-xs text-gray-400 pl-4 leading-relaxed">
                      A simulation validates your token parameters in a safe sandbox environment — no blockchain transaction is submitted and no cost is incurred.
                    </p>
                  </details>
                </li>
                <li>
                  <details class="group">
                    <summary
                      class="text-sm text-gray-300 cursor-pointer hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded list-none flex items-center gap-1"
                    >
                      <ChevronRightIcon class="w-3.5 h-3.5 text-gray-500 group-open:rotate-90 transition-transform" aria-hidden="true" />
                      Can I skip steps?
                    </summary>
                    <p class="mt-2 text-xs text-gray-400 pl-4 leading-relaxed">
                      Some steps are required for compliance reasons and cannot be skipped. Optional steps are clearly labelled.
                    </p>
                  </details>
                </li>
                <li>
                  <details class="group">
                    <summary
                      class="text-sm text-gray-300 cursor-pointer hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded list-none flex items-center gap-1"
                    >
                      <ChevronRightIcon class="w-3.5 h-3.5 text-gray-500 group-open:rotate-90 transition-transform" aria-hidden="true" />
                      Is my progress saved?
                    </summary>
                    <p class="mt-2 text-xs text-gray-400 pl-4 leading-relaxed">
                      Yes. Your progress is automatically saved as you complete each step. You can return at any time to continue.
                    </p>
                  </details>
                </li>
              </ul>
            </div>

            <!-- Support link -->
            <div class="pt-2 border-t border-white/10">
              <p class="text-xs text-gray-500 mb-2">Need expert support?</p>
              <a
                href="mailto:support@biatec.io"
                class="text-sm text-blue-400 hover:text-blue-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                data-testid="support-link"
              >
                Contact our team →
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  RocketLaunchIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ArrowRightIcon,
  BeakerIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline';
import {
  buildDefaultWorkspaceChecklist,
  deriveChecklistStatuses,
  deriveWorkspaceReadinessLevel,
  getReadinessLevelLabel,
  getChecklistItemStatusLabel,
  deriveSimulationState,
  getSimulationOutcomeMessage,
  computeWorkspaceProgress,
  buildWorkspaceEnteredEvent,
  buildChecklistItemStartedEvent,
  buildChecklistItemCompletedEvent,
  buildBlockedStateViewedEvent,
  buildSimulationStartedEvent,
  buildSimulationCompletedEvent,
  type WorkspaceChecklistItem,
  type ChecklistItemStatus,
  type SimulationState,
  type WorkspaceAnalyticsEventPayload,
} from '../utils/guidedLaunchWorkspace';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** IDs of completed prerequisites (persisted to localStorage) */
const completedIds = ref<Set<string>>(new Set());
/** IDs of items currently in progress */
const inProgressIds = ref<Set<string>>(new Set());
/** IDs of externally blocked items */
const blockedIds = ref<Set<string>>(new Set());
/** Currently focused/selected checklist item */
const activeItemId = ref<string | null>(null);
/** Simulation phase and metadata */
const simulationPhase = ref<SimulationState['phase']>('idle');
const simulationResultMessage = ref<string | undefined>(undefined);
const simulationRemediationSteps = ref<string[] | undefined>(undefined);
const simulationLastRunAt = ref<string | undefined>(undefined);

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'biatec_workspace_checklist_v1';

function loadPersistedState(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        completedIds?: string[];
        inProgressIds?: string[];
        blockedIds?: string[];
        simulationPhase?: SimulationState['phase'];
        simulationLastRunAt?: string;
      };
      completedIds.value = new Set(parsed.completedIds ?? []);
      inProgressIds.value = new Set(parsed.inProgressIds ?? []);
      blockedIds.value = new Set(parsed.blockedIds ?? []);
      simulationPhase.value = parsed.simulationPhase ?? 'idle';
      simulationLastRunAt.value = parsed.simulationLastRunAt;
    }
  } catch {
    // Corrupt storage — start fresh
  }
}

function persistState(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completedIds: [...completedIds.value],
        inProgressIds: [...inProgressIds.value],
        blockedIds: [...blockedIds.value],
        simulationPhase: simulationPhase.value,
        simulationLastRunAt: simulationLastRunAt.value,
      }),
    );
  } catch {
    // Storage unavailable — silently continue
  }
}

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const checklistItems = computed<WorkspaceChecklistItem[]>(() =>
  deriveChecklistStatuses(
    buildDefaultWorkspaceChecklist(),
    completedIds.value,
    inProgressIds.value,
    blockedIds.value,
  ),
);

const readinessLevel = computed(() => deriveWorkspaceReadinessLevel(checklistItems.value));
const readinessLabel = computed(() => getReadinessLevelLabel(readinessLevel.value));
const progress = computed(() => computeWorkspaceProgress(checklistItems.value));

const simulation = computed<SimulationState>(() =>
  deriveSimulationState(
    checklistItems.value,
    simulationPhase.value,
    simulationResultMessage.value,
    simulationRemediationSteps.value,
    simulationLastRunAt.value,
  ),
);

const simulationOutcome = computed(() => getSimulationOutcomeMessage(simulation.value.phase));

const activeItem = computed<WorkspaceChecklistItem | null>(() => {
  if (!activeItemId.value) return null;
  return checklistItems.value.find((i) => i.id === activeItemId.value) ?? null;
});

const readinessDotClass = computed(() => {
  switch (readinessLevel.value) {
    case 'ready_to_launch':    return 'bg-green-400';
    case 'ready_to_simulate':  return 'bg-blue-400';
    case 'needs_attention':    return 'bg-amber-400';
    default:                   return 'bg-gray-500';
  }
});

const activeItemIconContainerClass = computed(() => {
  switch (activeItem.value?.status) {
    case 'complete': return 'bg-green-700';
    case 'blocked':  return 'bg-amber-700';
    default:         return 'bg-blue-700';
  }
});

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

function checklistItemButtonClass(item: WorkspaceChecklistItem): string {
  const base = 'w-full text-left px-3 py-2 rounded-lg transition-colors duration-200';
  if (activeItemId.value === item.id) {
    return `${base} bg-blue-900/40 border border-blue-700/50`;
  }
  switch (item.status) {
    case 'complete':    return `${base} text-green-300 hover:bg-green-900/20`;
    case 'blocked':     return `${base} text-amber-300 hover:bg-amber-900/20`;
    case 'locked':      return `${base} text-gray-600 cursor-not-allowed`;
    case 'in_progress': return `${base} text-blue-300 hover:bg-blue-900/20`;
    default:            return `${base} text-gray-300 hover:bg-gray-700/50`;
  }
}

function checklistIconClass(item: WorkspaceChecklistItem): string {
  switch (item.status) {
    case 'complete':    return 'bg-green-600 text-white';
    case 'blocked':     return 'bg-amber-600 text-white';
    case 'locked':      return 'bg-gray-700 text-gray-500';
    case 'in_progress': return 'bg-blue-600 text-white';
    default:            return 'bg-gray-600 text-gray-300';
  }
}

function statusBadgeClass(status: ChecklistItemStatus): string {
  switch (status) {
    case 'complete':    return 'bg-green-900/50 text-green-300';
    case 'blocked':     return 'bg-amber-900/50 text-amber-300';
    case 'locked':      return 'bg-gray-800 text-gray-500';
    case 'in_progress': return 'bg-blue-900/50 text-blue-300';
    default:            return 'bg-gray-800 text-gray-400';
  }
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

function selectItem(item: WorkspaceChecklistItem): void {
  if (item.status === 'locked') {
    // Still allow viewing locked item details via keyboard/click
    activeItemId.value = item.id;
    return;
  }

  activeItemId.value = item.id;

  if (item.status === 'blocked') {
    emitAnalytics(buildBlockedStateViewedEvent(item.id));
    return;
  }

  if (item.status === 'available') {
    inProgressIds.value = new Set([...inProgressIds.value, item.id]);
    persistState();
    emitAnalytics(buildChecklistItemStartedEvent(item.id));
  }
}

function handleCtaClick(item: WorkspaceChecklistItem): void {
  emitAnalytics(buildChecklistItemStartedEvent(item.id));
  // Navigation handled by the <a> href
}

function markItemComplete(itemId: string): void {
  completedIds.value = new Set([...completedIds.value, itemId]);
  inProgressIds.value.delete(itemId);
  inProgressIds.value = new Set(inProgressIds.value);
  persistState();
  emitAnalytics(buildChecklistItemCompletedEvent(itemId));

  // Advance to next available item
  const nextItem = checklistItems.value.find(
    (i) => i.id !== itemId && (i.status === 'available' || i.status === 'in_progress'),
  );
  if (nextItem) {
    activeItemId.value = nextItem.id;
  }
}

function startSimulation(): void {
  if (!simulation.value.canStart) return;
  simulationPhase.value = 'running';
  persistState();
  emitAnalytics(buildSimulationStartedEvent());

  // Simulate async operation (mock 1.5s delay → success)
  setTimeout(() => {
    // Deterministic success in demo mode; real implementation calls backend API
    simulationPhase.value = 'success';
    simulationResultMessage.value = getSimulationOutcomeMessage('success').body;
    simulationLastRunAt.value = new Date().toISOString();
    // Mark simulation checklist item complete
    completedIds.value = new Set([...completedIds.value, 'launch_simulation']);
    persistState();
    emitAnalytics(buildSimulationCompletedEvent('success'));
  }, 1500);
}

function resetSimulation(): void {
  simulationPhase.value = 'idle';
  simulationResultMessage.value = undefined;
  simulationRemediationSteps.value = undefined;
  // Remove simulation from completed so user can re-run
  const updated = new Set(completedIds.value);
  updated.delete('launch_simulation');
  completedIds.value = updated;
  persistState();
}

function formatSimulationTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Analytics (fire-and-forget; no PII)
// ---------------------------------------------------------------------------

function emitAnalytics(payload: WorkspaceAnalyticsEventPayload): void {
  // In production this would route to the telemetry service.
  // Here we emit a custom DOM event so integration tests can assert on it.
  try {
    window.dispatchEvent(new CustomEvent('workspace:analytics', { detail: payload }));
  } catch {
    // Silently ignore if event dispatch fails
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  loadPersistedState();

  // Select first available item on initial load
  const firstAvailable = checklistItems.value.find(
    (i) => i.status === 'available' || i.status === 'in_progress',
  );
  if (firstAvailable) {
    activeItemId.value = firstAvailable.id;
  }

  // Emit workspace-entered analytics event
  emitAnalytics(buildWorkspaceEnteredEvent(readinessLevel.value));
});
</script>

<style scoped>
.glass-effect {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>
