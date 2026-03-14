<template>
  <MainLayout>
  <div
    class="business-command-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    data-testid="business-command-center"
  >
    <div class="max-w-7xl mx-auto">
      <header class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-4xl font-bold text-white mb-2" data-testid="command-center-heading">
              Operations Command Center
            </h1>
            <p class="text-lg text-gray-300">
              Your post-launch workspace for token operations, compliance, and investor communication.
            </p>
          </div>

          <!-- Role selector -->
          <div class="flex items-center gap-3">
            <label
              for="role-selector"
              class="text-sm font-medium text-gray-300 whitespace-nowrap"
            >
              Viewing as:
            </label>
            <select
              id="role-selector"
              v-model="selectedRole"
              @change="handleRoleChange"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Switch operator role perspective"
              data-testid="role-selector"
            >
              <option value="issuer_operator">Issuer Operator</option>
              <option value="compliance_manager">Compliance Manager</option>
            </select>
          </div>
        </div>

        <!-- Breadcrumb -->
        <nav aria-label="Breadcrumb" class="mt-3">
          <ol class="flex items-center gap-2 text-sm text-gray-300">
            <li>
              <router-link to="/" class="hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
                Home
              </router-link>
            </li>
            <li aria-hidden="true" class="text-gray-600">/</li>
            <li aria-current="page" class="text-gray-200">Operations</li>
          </ol>
        </nav>
      </header>

      <!-- Main content -->
      <div id="command-center-main" tabindex="-1">

        <!-- Status overview bar -->
        <section
          :role="overallSeverityAriaRole"
          :aria-live="overallSeverity === 'action_required' ? 'assertive' : 'polite'"
          aria-atomic="true"
          class="bg-gray-800 rounded-2xl p-4 mb-6 border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          data-testid="status-overview"
        >
          <div class="flex items-center gap-3">
            <span
              :class="[
                'w-3 h-3 rounded-full flex-shrink-0',
                overallSeverity === 'clear' ? 'bg-green-400' :
                overallSeverity === 'review_needed' ? 'bg-yellow-400' :
                'bg-red-400'
              ]"
              aria-hidden="true"
            ></span>
            <div>
              <p class="text-white font-semibold" data-testid="status-label">
                {{ overallSeverityLabel }}
              </p>
              <p class="text-sm text-gray-300">
                {{ priorityCards.length === 0
                  ? 'No outstanding action items for your operations.'
                  : `${relevantCards.length} item${relevantCards.length !== 1 ? 's' : ''} need${relevantCards.length === 1 ? 's' : ''} your attention.`
                }}
              </p>
            </div>
          </div>

          <!-- Status filter -->
          <div class="flex items-center gap-2">
            <label for="status-filter" class="text-sm text-gray-200 whitespace-nowrap">
              Filter:
            </label>
            <select
              id="status-filter"
              v-model="activeFilter"
              @change="handleFilterChange"
              class="px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:border-blue-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Filter action cards by status"
              data-testid="status-filter"
            >
              <option value="all">All items</option>
              <option value="action_required">Action required</option>
              <option value="review_needed">Review needed</option>
              <option value="clear">Clear</option>
            </select>
          </div>
        </section>

        <!-- Priority action cards -->
        <section aria-label="Priority actions" class="mb-8" data-testid="priority-cards-section">
          <h2 class="text-xl font-semibold text-white mb-4 sr-only">Priority actions</h2>

          <!-- Empty state -->
          <div
            v-if="filteredCards.length === 0"
            class="bg-gray-800 rounded-2xl p-10 text-center border border-white/10"
            role="status"
            aria-live="polite"
            data-testid="empty-state"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircleIcon class="w-8 h-8 text-green-400" aria-hidden="true" />
            </div>
            <p class="text-lg font-semibold text-white mb-1">
              {{ activeFilter === 'all'
                ? 'No outstanding items'
                : `No ${getSeverityLabel(activeFilter as StatusSeverity)} items` }}
            </p>
            <p class="text-gray-300 text-sm">
              {{ activeFilter === 'all'
                ? 'Your operations are in good shape. Check back regularly for updates.'
                : 'Try changing the filter to see other items.' }}
            </p>
          </div>

          <!-- Card list -->
          <ul
            v-else
            class="space-y-4"
            aria-label="Operator action items"
          >
            <li
              v-for="card in filteredCards"
              :key="card.id"
              :data-testid="`priority-card-${card.id}`"
            >
              <article
                :role="card.severity === 'action_required' ? 'alert' : 'status'"
                class="bg-gray-800 rounded-2xl border border-white/10 overflow-hidden transition-all duration-200"
                :class="[
                  card.severity === 'action_required' ? 'border-red-500/30' :
                  card.severity === 'review_needed' ? 'border-yellow-500/30' :
                  'border-green-500/30'
                ]"
                :aria-label="`${card.heading}: ${getSeverityLabel(card.severity)}`"
              >
                <!-- Card header (always visible) -->
                <button
                  type="button"
                  class="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset"
                  :aria-expanded="expandedCardId === card.id"
                  :aria-controls="`card-detail-${card.id}`"
                  :data-testid="`card-toggle-${card.id}`"
                  @click="handleCardToggle(card)"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <!-- Severity indicator -->
                    <span
                      :class="[
                        'flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide',
                        card.severity === 'action_required'
                          ? 'bg-red-500/20 text-red-300'
                          : card.severity === 'review_needed'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-green-500/20 text-green-300'
                      ]"
                      :aria-label="`Status: ${getSeverityLabel(card.severity)}`"
                    >
                      {{ getSeverityLabel(card.severity) }}
                    </span>

                    <!-- Heading -->
                    <h3 class="text-base font-semibold text-white truncate">
                      {{ card.heading }}
                    </h3>
                  </div>

                  <!-- Expand/collapse chevron -->
                  <ChevronDownIcon
                    :class="[
                      'w-5 h-5 text-gray-400 flex-shrink-0 ml-3 transition-transform duration-200',
                      expandedCardId === card.id ? 'rotate-180' : ''
                    ]"
                    aria-hidden="true"
                  />
                </button>

                <!-- Expandable detail -->
                <div
                  v-show="expandedCardId === card.id"
                  :id="`card-detail-${card.id}`"
                  class="px-5 pb-5 border-t border-white/10"
                  :data-testid="`card-detail-${card.id}`"
                >
                  <dl class="space-y-3 mt-4">
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wide text-gray-300 mb-1">
                        What happened
                      </dt>
                      <dd class="text-gray-200 text-sm">{{ card.what }}</dd>
                    </div>
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wide text-gray-300 mb-1">
                        Why it matters
                      </dt>
                      <dd class="text-gray-200 text-sm">{{ card.why }}</dd>
                    </div>
                    <div>
                      <dt class="text-xs font-semibold uppercase tracking-wide text-gray-300 mb-1">
                        What to do next
                      </dt>
                      <dd class="text-gray-200 text-sm">{{ card.how }}</dd>
                    </div>
                  </dl>

                  <div class="mt-4">
                    <router-link
                      :to="card.ctaPath"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      :data-testid="`card-cta-${card.id}`"
                      @click="handleCtaClick(card)"
                    >
                      {{ card.ctaLabel }}
                      <ArrowRightIcon class="w-4 h-4" aria-hidden="true" />
                    </router-link>
                  </div>
                </div>
              </article>
            </li>
          </ul>
        </section>

        <!-- Deployment and compliance status surface -->
        <section aria-label="Current status overview" class="mb-8" data-testid="status-surface">
          <h2 class="text-xl font-semibold text-white mb-4">Status overview</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <!-- Deployment status card -->
            <div
              class="bg-gray-800 rounded-2xl p-5 border border-white/10"
              :role="deploymentSeverityAriaRole"
              :aria-label="`Deployment status: ${deploymentStatusLabel}`"
              data-testid="deployment-status-card"
            >
              <div class="flex items-center gap-3 mb-2">
                <ServerStackIcon class="w-5 h-5 text-gray-400" aria-hidden="true" />
                <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Deployment status</h3>
              </div>
              <p
                :class="[
                  'text-2xl font-bold',
                  context.deploymentStatusRaw && mapApiStatusToSeverity(context.deploymentStatusRaw) === 'clear'
                    ? 'text-green-400'
                    : context.deploymentStatusRaw && mapApiStatusToSeverity(context.deploymentStatusRaw) === 'action_required'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                ]"
                data-testid="deployment-status-value"
              >
                {{ deploymentStatusLabel }}
              </p>
              <p class="text-xs text-gray-300 mt-1">
                Based on your most recent token deployment activity.
              </p>
            </div>

            <!-- Compliance status card -->
            <div
              class="bg-gray-800 rounded-2xl p-5 border border-white/10"
              :role="complianceSeverityAriaRole"
              :aria-label="`Compliance status: ${complianceStatusLabel}`"
              data-testid="compliance-status-card"
            >
              <div class="flex items-center gap-3 mb-2">
                <ShieldCheckIcon class="w-5 h-5 text-gray-400" aria-hidden="true" />
                <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Compliance status</h3>
              </div>
              <p
                :class="[
                  'text-2xl font-bold',
                  context.complianceStatusRaw && mapApiStatusToSeverity(context.complianceStatusRaw) === 'clear'
                    ? 'text-green-400'
                    : context.complianceStatusRaw && mapApiStatusToSeverity(context.complianceStatusRaw) === 'action_required'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                ]"
                data-testid="compliance-status-value"
              >
                {{ complianceStatusLabel }}
              </p>
              <p class="text-xs text-gray-300 mt-1">
                Reflects the status of your compliance checkpoints and documentation.
              </p>
            </div>
          </div>
        </section>

        <!-- Stakeholder communication helper -->
        <section
          id="stakeholder"
          aria-label="Stakeholder communication helper"
          class="mb-8"
          data-testid="stakeholder-section"
        >
          <h2 class="text-xl font-semibold text-white mb-4">Investor communication helper</h2>
          <div class="bg-gray-800 rounded-2xl p-6 border border-white/10">
            <p class="text-gray-300 text-sm mb-4">
              Use the template below to send a plain-language status update to your investors and stakeholders.
              The content is based on your current operational status and contains no technical terminology.
            </p>

            <!-- Template subject -->
            <div class="mb-4">
              <label class="block text-xs font-semibold uppercase tracking-wide text-gray-300 mb-1" for="stakeholder-subject">
                Subject line
              </label>
              <div
                id="stakeholder-subject"
                class="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-gray-200 text-sm"
                data-testid="stakeholder-subject"
              >
                {{ stakeholderTemplate.subject }}
              </div>
            </div>

            <!-- Template body -->
            <div class="mb-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">Message body</p>
              <div
                class="space-y-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10"
                data-testid="stakeholder-body"
              >
                <p
                  v-for="(paragraph, idx) in stakeholderTemplate.body"
                  :key="idx"
                  class="text-gray-200 text-sm"
                >
                  {{ paragraph }}
                </p>
              </div>
            </div>

            <!-- Copy action -->
            <button
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Copy stakeholder update to clipboard"
              data-testid="copy-stakeholder-btn"
              @click="handleCopyTemplate"
            >
              <ClipboardDocumentIcon class="w-4 h-4" aria-hidden="true" />
              {{ copyButtonLabel }}
            </button>
          </div>
        </section>

      </div>
    </div>
  </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MainLayout from '../layout/MainLayout.vue';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
} from '@heroicons/vue/24/outline';
import { ServerStackIcon } from '@heroicons/vue/24/outline';
import {
  computePriorityCards,
  buildStakeholderUpdateTemplate,
  buildCommandCenterVisitEvent,
  buildCardOpenEvent,
  buildTaskCompletionEvent,
  buildStatusFilterEvent,
  dispatchCommandCenterEvent,
  mapApiStatusToSeverity,
  getSeverityLabel,
  getSeverityAriaRole,
  EMPTY_COMMAND_CENTER_CONTEXT,
  type OperatorRole,
  type StatusSeverity,
  type PriorityActionCard,
  type CommandCenterContext,
} from '../utils/businessCommandCenter';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const selectedRole = ref<OperatorRole>('issuer_operator');
const expandedCardId = ref<string | null>(null);
const activeFilter = ref<StatusSeverity | 'all'>('all');
const copyButtonLabel = ref('Copy to clipboard');

/**
 * In a real integration this context would come from the token/compliance store.
 * For the MVP implementation the context is populated from localStorage and
 * basic heuristics so the view can render deterministically without a new API.
 */
const context = ref<CommandCenterContext>(loadContext());

// ---------------------------------------------------------------------------
// Context loader (localStorage + heuristics, no API dependency)
// ---------------------------------------------------------------------------

function loadContext(): CommandCenterContext {
  try {
    const raw = localStorage.getItem('biatec_command_center_context');
    if (raw) {
      return JSON.parse(raw) as CommandCenterContext;
    }
  } catch {
    // fall through to defaults
  }
  return { ...EMPTY_COMMAND_CENTER_CONTEXT };
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

const priorityCards = computed(() =>
  computePriorityCards(selectedRole.value, context.value)
);

const relevantCards = computed(() =>
  priorityCards.value.filter((c) => c.roleRelevant)
);

const filteredCards = computed(() => {
  const cards = relevantCards.value;
  if (activeFilter.value === 'all') return cards;
  return cards.filter((c) => c.severity === activeFilter.value);
});

const overallSeverity = computed<StatusSeverity>(() => {
  const cards = relevantCards.value;
  if (cards.some((c) => c.severity === 'action_required')) return 'action_required';
  if (cards.some((c) => c.severity === 'review_needed')) return 'review_needed';
  return 'clear';
});

const overallSeverityLabel = computed(() => getSeverityLabel(overallSeverity.value));
const overallSeverityAriaRole = computed(() => getSeverityAriaRole(overallSeverity.value));

const deploymentSeverity = computed(() =>
  mapApiStatusToSeverity(context.value.deploymentStatusRaw)
);
const complianceSeverity = computed(() =>
  mapApiStatusToSeverity(context.value.complianceStatusRaw)
);
const deploymentStatusLabel = computed(() => getSeverityLabel(deploymentSeverity.value));
const complianceStatusLabel = computed(() => getSeverityLabel(complianceSeverity.value));
const deploymentSeverityAriaRole = computed(() => getSeverityAriaRole(deploymentSeverity.value));
const complianceSeverityAriaRole = computed(() => getSeverityAriaRole(complianceSeverity.value));

const stakeholderTemplate = computed(() =>
  buildStakeholderUpdateTemplate(context.value)
);

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function handleRoleChange() {
  expandedCardId.value = null;
  dispatchCommandCenterEvent(buildCommandCenterVisitEvent(selectedRole.value));
}

function handleCardToggle(card: PriorityActionCard) {
  if (expandedCardId.value === card.id) {
    expandedCardId.value = null;
  } else {
    expandedCardId.value = card.id;
    dispatchCommandCenterEvent(buildCardOpenEvent(card, selectedRole.value));
  }
}

function handleCtaClick(card: PriorityActionCard) {
  dispatchCommandCenterEvent(buildTaskCompletionEvent(card, selectedRole.value));
}

function handleFilterChange() {
  dispatchCommandCenterEvent(buildStatusFilterEvent(activeFilter.value, selectedRole.value));
}

async function handleCopyTemplate() {
  const text = [
    `Subject: ${stakeholderTemplate.value.subject}`,
    '',
    ...stakeholderTemplate.value.body,
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
    copyButtonLabel.value = 'Copied!';
    setTimeout(() => {
      copyButtonLabel.value = 'Copy to clipboard';
    }, 2000);
  } catch {
    copyButtonLabel.value = 'Copy to clipboard';
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  dispatchCommandCenterEvent(buildCommandCenterVisitEvent(selectedRole.value));
});

// Expose for tests
const _router = useRouter();
void _router;
</script>
