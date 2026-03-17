<template>
  <MainLayout>
    <!-- Skip link (WCAG 2.4.1) -->
    <a
      href="#cockpit-ops-main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
    >
      Skip to main content
    </a>

    <div
      id="cockpit-ops-main"
      role="region"
      aria-label="Compliance Operations Cockpit — queue health, ownership, and workflow handoffs"
      :data-testid="COCKPIT_TEST_IDS.ROOT"
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    >
      <div class="max-w-6xl mx-auto">

        <!-- ── Page Header ── -->
        <header class="mb-8" data-testid="cockpit-ops-header">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex items-start gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <ChartBarSquareIcon class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  :data-testid="COCKPIT_TEST_IDS.HEADING"
                >
                  Compliance Operations Cockpit
                </h1>
                <p class="text-gray-300 text-sm mt-1">
                  Role-aware task coordination for investor onboarding, approvals, remediation,
                  and reporting. Identify urgent work, ownership gaps, and downstream blockers.
                </p>
              </div>
            </div>
            <div class="flex-shrink-0 flex flex-col items-end gap-1 mt-1">
              <span
                class="text-xs text-gray-400"
                :data-testid="COCKPIT_TEST_IDS.REFRESHED_AT"
                :aria-label="`Data last refreshed: ${formattedRefreshedAt}`"
              >
                Last refreshed: {{ formattedRefreshedAt }}
              </span>
              <button
                class="text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
                :data-testid="COCKPIT_TEST_IDS.REFRESH_BTN"
                aria-label="Refresh operations cockpit data"
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
          :data-testid="COCKPIT_TEST_IDS.LOADING_STATE"
          role="status"
          aria-label="Loading operations cockpit"
          aria-live="polite"
        >
          <div class="text-center">
            <ArrowPathIcon class="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" aria-hidden="true" />
            <p class="text-gray-300 text-sm">Loading operations cockpit…</p>
          </div>
        </div>

        <template v-else>

          <!-- ── Degraded Alert ── -->
          <div
            v-if="isDegraded"
            role="alert"
            aria-live="assertive"
            :data-testid="COCKPIT_TEST_IDS.DEGRADED_ALERT"
            class="rounded-xl border border-gray-600 bg-gray-800 p-5 mb-8 flex items-start gap-4"
          >
            <ExclamationTriangleIcon class="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p class="font-semibold text-yellow-300">Operations cockpit is operating in degraded mode</p>
              <p class="text-gray-300 text-sm mt-1">
                Some queue metrics or work items may be unavailable or incomplete.
                Queue data shown below is based on available frontend-derived state.
                Contact your platform administrator if this condition persists.
              </p>
            </div>
          </div>

          <!-- ── Posture Banner ── -->
          <section
            class="rounded-2xl border p-6 mb-8 shadow-lg"
            :class="postureBannerClass"
            :data-testid="COCKPIT_TEST_IDS.POSTURE_BANNER"
            aria-labelledby="cockpit-posture-heading"
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
                    id="cockpit-posture-heading"
                    class="text-lg font-semibold text-white"
                    :data-testid="COCKPIT_TEST_IDS.POSTURE_LABEL"
                  >
                    {{ postureLabel }}
                  </h2>
                </div>
                <p class="text-gray-300 text-sm">{{ postureDescription }}</p>
              </div>
            </div>
          </section>

          <!-- ── Role-Aware Summaries (AC #5) ── -->
          <section
            class="rounded-2xl border border-gray-700 bg-gray-800/60 p-6 mb-8 shadow-lg"
            :data-testid="COCKPIT_TEST_IDS.ROLE_SUMMARY_PANEL"
            aria-labelledby="role-summary-heading"
          >
            <h2 id="role-summary-heading" class="text-lg font-semibold text-white mb-2">
              Role-Aware Priorities
            </h2>
            <p class="text-gray-400 text-sm mb-5">
              Tailored operational focus for each team role. Each card highlights the metrics
              most relevant to that persona's responsibilities.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                v-for="card in roleSummaries"
                :key="card.persona"
                :data-testid="COCKPIT_TEST_IDS.ROLE_SUMMARY_CARD"
                :data-persona="card.persona"
                class="rounded-xl border p-4 flex flex-col gap-3 transition-colors"
                :class="roleSummaryCardBorderClass(card.needsAttention)"
              >
                <div>
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 class="text-white font-medium text-sm">{{ card.label }}</h3>
                    <span
                      v-if="card.needsAttention"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-800 text-yellow-100"
                      aria-label="Needs attention"
                    >
                      Needs Attention
                    </span>
                  </div>
                  <p class="text-gray-400 text-xs">{{ card.description }}</p>
                </div>
                <dl class="space-y-2">
                  <div
                    v-for="metric in card.metrics"
                    :key="metric.label"
                    class="flex items-center justify-between"
                  >
                    <dt class="text-xs text-gray-400">{{ metric.label }}</dt>
                    <dd
                      class="text-sm font-bold"
                      :class="roleSummaryMetricClass(metric.severity)"
                      :aria-label="`${metric.label}: ${metric.value}`"
                    >
                      {{ metric.value }}
                    </dd>
                  </div>
                </dl>
                <template v-for="metric in card.metrics" :key="metric.label">
                  <p
                    v-if="metric.prompt"
                    class="text-xs text-gray-500 border-t border-gray-700 pt-2"
                  >
                    {{ metric.prompt }}
                  </p>
                </template>
              </div>
            </div>
          </section>

          <!-- ── Persona / Role Selector (AC #3) ── -->
          <section
            class="rounded-2xl border border-gray-700 bg-gray-800/60 p-6 mb-8 shadow-lg"
            :data-testid="COCKPIT_TEST_IDS.PERSONA_SELECTOR"
            aria-labelledby="persona-selector-heading"
          >
            <h2 id="persona-selector-heading" class="text-lg font-semibold text-white mb-2">
              My Role Perspective
            </h2>
            <p class="text-gray-400 text-sm mb-5">
              Switch to see the worklist items most relevant to your operational role. Each persona
              sees the priority tasks, blockers, and handoffs that match their responsibilities.
            </p>
            <!-- Role tabs -->
            <div
              role="tablist"
              aria-label="Select your operator role to filter the worklist"
              class="flex flex-wrap gap-2"
            >
              <button
                v-for="role in personas"
                :key="role"
                role="tab"
                :aria-selected="activePersona === role"
                :data-testid="COCKPIT_TEST_IDS.PERSONA_TAB"
                :data-persona="role"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                :class="activePersona === role
                  ? 'bg-teal-700 text-white border border-teal-500'
                  : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white'"
                @click="activePersona = role"
              >
                {{ OPERATOR_ROLE_FILTER_LABELS[role] }}
              </button>
            </div>
            <!-- Active persona description -->
            <p
              class="text-gray-400 text-xs mt-4 italic"
              :data-testid="`persona-description-${activePersona}`"
            >
              {{ OPERATOR_ROLE_FILTER_DESCRIPTIONS[activePersona] }}
            </p>
          </section>

          <!-- ── Queue Health Panel ── -->
          <section
            class="rounded-2xl border border-gray-700 bg-gray-800/60 p-6 mb-8 shadow-lg"
            :data-testid="COCKPIT_TEST_IDS.QUEUE_HEALTH_PANEL"
            aria-labelledby="queue-health-heading"
          >
            <h2
              id="queue-health-heading"
              class="text-lg font-semibold text-white mb-5"
            >
              Queue Health Overview
            </h2>

            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <!-- Total -->
              <div
                class="rounded-xl bg-gray-700 p-4 text-center"
                :data-testid="COCKPIT_TEST_IDS.HEALTH_TOTAL"
              >
                <dd class="text-2xl font-bold text-white">{{ queueHealth.total }}</dd>
                <dt class="text-xs text-gray-400 mt-1">Active Items</dt>
              </div>

              <!-- Overdue -->
              <div
                class="rounded-xl p-4 text-center"
                :class="queueHealth.overdue > 0 ? 'bg-red-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.HEALTH_OVERDUE"
              >
                <dd class="text-2xl font-bold" :class="queueHealth.overdue > 0 ? 'text-red-200' : 'text-white'">
                  {{ queueHealth.overdue }}
                </dd>
                <dt class="text-xs mt-1" :class="queueHealth.overdue > 0 ? 'text-red-300' : 'text-gray-400'">
                  Overdue
                </dt>
              </div>

              <!-- Blocked -->
              <div
                class="rounded-xl p-4 text-center"
                :class="queueHealth.blocked > 0 ? 'bg-orange-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.HEALTH_BLOCKED"
              >
                <dd class="text-2xl font-bold" :class="queueHealth.blocked > 0 ? 'text-orange-200' : 'text-white'">
                  {{ queueHealth.blocked }}
                </dd>
                <dt class="text-xs mt-1" :class="queueHealth.blocked > 0 ? 'text-orange-300' : 'text-gray-400'">
                  Blocked
                </dt>
              </div>

              <!-- Approval Ready -->
              <div
                class="rounded-xl p-4 text-center"
                :class="queueHealth.approvalReady > 0 ? 'bg-green-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.HEALTH_APPROVAL_READY"
              >
                <dd class="text-2xl font-bold" :class="queueHealth.approvalReady > 0 ? 'text-green-200' : 'text-white'">
                  {{ queueHealth.approvalReady }}
                </dd>
                <dt class="text-xs mt-1" :class="queueHealth.approvalReady > 0 ? 'text-green-300' : 'text-gray-400'">
                  Approval Ready
                </dt>
              </div>

              <!-- Unassigned -->
              <div
                class="rounded-xl p-4 text-center"
                :class="queueHealth.unassigned > 0 ? 'bg-yellow-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.HEALTH_UNASSIGNED"
              >
                <dd class="text-2xl font-bold" :class="queueHealth.unassigned > 0 ? 'text-yellow-200' : 'text-white'">
                  {{ queueHealth.unassigned }}
                </dd>
                <dt class="text-xs mt-1" :class="queueHealth.unassigned > 0 ? 'text-yellow-300' : 'text-gray-400'">
                  Unassigned
                </dt>
              </div>

              <!-- Assigned to Me -->
              <div
                class="rounded-xl p-4 text-center"
                :class="queueHealth.assignedToMe > 0 ? 'bg-blue-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.HEALTH_ASSIGNED_TO_ME"
              >
                <dd class="text-2xl font-bold" :class="queueHealth.assignedToMe > 0 ? 'text-blue-200' : 'text-white'">
                  {{ queueHealth.assignedToMe }}
                </dd>
                <dt class="text-xs mt-1" :class="queueHealth.assignedToMe > 0 ? 'text-blue-300' : 'text-gray-400'">
                  Assigned to Me
                </dt>
              </div>
            </div>
          </section>

          <!-- ── Item Aging Analysis ── -->
          <section
            class="rounded-2xl border border-gray-700 bg-gray-800/60 p-6 mb-8 shadow-lg"
            :data-testid="COCKPIT_TEST_IDS.AGING_PANEL"
            aria-labelledby="aging-analysis-heading"
          >
            <h2 id="aging-analysis-heading" class="text-lg font-semibold text-white mb-2">
              Item Aging Analysis
            </h2>
            <p class="text-gray-400 text-sm mb-5">
              How long have active items been without progress? Stale and critical items need
              reassignment or escalation to prevent SLA breaches.
              <span v-if="agingBuckets.averageDaysOpen > 0" class="text-gray-300 font-medium">
                Average: {{ agingBuckets.averageDaysOpen.toFixed(1) }} days open.
              </span>
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <!-- Fresh -->
              <div
                class="rounded-xl p-4 text-center"
                :class="agingBuckets.fresh > 0 ? 'bg-green-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.AGING_FRESH"
              >
                <dd class="text-2xl font-bold" :class="agingBuckets.fresh > 0 ? 'text-green-200' : 'text-white'">
                  {{ agingBuckets.fresh }}
                </dd>
                <dt class="text-xs mt-1" :class="agingBuckets.fresh > 0 ? 'text-green-300' : 'text-gray-400'">
                  Fresh (&lt; 24 h)
                </dt>
              </div>

              <!-- Aging -->
              <div
                class="rounded-xl p-4 text-center"
                :class="agingBuckets.aging > 0 ? 'bg-yellow-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.AGING_AGING"
              >
                <dd class="text-2xl font-bold" :class="agingBuckets.aging > 0 ? 'text-yellow-200' : 'text-white'">
                  {{ agingBuckets.aging }}
                </dd>
                <dt class="text-xs mt-1" :class="agingBuckets.aging > 0 ? 'text-yellow-300' : 'text-gray-400'">
                  Aging (1–3 days)
                </dt>
              </div>

              <!-- Stale -->
              <div
                class="rounded-xl p-4 text-center"
                :class="agingBuckets.stale > 0 ? 'bg-orange-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.AGING_STALE"
              >
                <dd class="text-2xl font-bold" :class="agingBuckets.stale > 0 ? 'text-orange-200' : 'text-white'">
                  {{ agingBuckets.stale }}
                </dd>
                <dt class="text-xs mt-1" :class="agingBuckets.stale > 0 ? 'text-orange-300' : 'text-gray-400'">
                  Stale (3–7 days)
                </dt>
              </div>

              <!-- Critical aging -->
              <div
                class="rounded-xl p-4 text-center"
                :class="agingBuckets.critical > 0 ? 'bg-red-900' : 'bg-gray-700'"
                :data-testid="COCKPIT_TEST_IDS.AGING_CRITICAL"
              >
                <dd class="text-2xl font-bold" :class="agingBuckets.critical > 0 ? 'text-red-200' : 'text-white'">
                  {{ agingBuckets.critical }}
                </dd>
                <dt class="text-xs mt-1" :class="agingBuckets.critical > 0 ? 'text-red-300' : 'text-gray-400'">
                  Critical (&gt; 7 days)
                </dt>
              </div>
            </div>

            <!-- Average days open -->
            <p
              v-if="agingBuckets.oldestItemDays > 0"
              class="text-xs text-gray-500 mt-4"
              :data-testid="COCKPIT_TEST_IDS.AGING_AVERAGE"
            >
              Oldest active item: {{ agingBuckets.oldestItemDays.toFixed(1) }} days without action.
              <span v-if="agingBuckets.oldestItemDays > 7" class="text-red-300 font-medium">
                Escalation recommended.
              </span>
            </p>
          </section>

          <!-- ── Worklist Panel ── -->
          <section
            class="rounded-2xl border border-gray-700 bg-gray-800/60 p-6 mb-8 shadow-lg"
            :data-testid="COCKPIT_TEST_IDS.WORKLIST_PANEL"
            aria-labelledby="worklist-heading"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <h2 id="worklist-heading" class="text-lg font-semibold text-white">
                {{ OPERATOR_ROLE_LABELS[activePersona] }} Worklist
              </h2>
              <!-- Filter -->
              <div class="flex items-center gap-2">
                <label for="worklist-filter" class="text-sm text-gray-400 sr-only">
                  Filter by ownership or status
                </label>
                <select
                  id="worklist-filter"
                  v-model="worklistFilter"
                  class="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  :data-testid="COCKPIT_TEST_IDS.FILTER_SELECT"
                  aria-label="Filter work items"
                >
                  <option value="all">All Active Items</option>
                  <option value="assigned_to_me">Assigned to Me</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="overdue">Overdue</option>
                  <option value="blocked">Blocked</option>
                  <option value="awaiting_customer_input">Awaiting Customer Input</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approval_ready">Approval Ready</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="filteredWorkItems.length === 0"
              :data-testid="COCKPIT_TEST_IDS.WORKLIST_EMPTY"
              class="text-center py-10"
              role="status"
              aria-live="polite"
            >
              <CheckCircleIcon class="w-10 h-10 text-green-400 mx-auto mb-3" aria-hidden="true" />
              <p class="text-gray-300 font-medium">No items matching the current filter</p>
              <p class="text-gray-500 text-sm mt-1">
                Adjust the filter or check back later for new assignments.
              </p>
            </div>

            <!-- Work item list -->
            <ul
              v-else
              class="space-y-3"
              role="list"
              aria-label="Work items"
            >
              <li
                v-for="item in filteredWorkItems"
                :key="item.id"
                :data-testid="COCKPIT_TEST_IDS.WORK_ITEM_ROW"
                class="rounded-xl border border-gray-700 bg-gray-900/60 p-4 hover:bg-gray-700/40 transition-colors"
              >
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <!-- Status badge -->
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="workItemStatusBadgeClass(item.status)"
                        :aria-label="`Status: ${WORK_ITEM_STATUS_LABELS[item.status]}`"
                      >
                        {{ WORK_ITEM_STATUS_LABELS[item.status] }}
                      </span>
                      <!-- Ownership badge -->
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="ownershipBadgeClass(item.ownership)"
                        :aria-label="`Ownership: ${OWNERSHIP_STATE_LABELS[item.ownership]}`"
                      >
                        {{ OWNERSHIP_STATE_LABELS[item.ownership] }}
                      </span>
                      <!-- SLA badge -->
                      <span
                        v-if="getItemSlaUrgency(item) !== 'no_deadline'"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="slaUrgencyBadgeClass(getItemSlaUrgency(item))"
                        :aria-label="`SLA: ${SLA_URGENCY_LABELS[getItemSlaUrgency(item)]}`"
                      >
                        {{ SLA_URGENCY_LABELS[getItemSlaUrgency(item)] }}
                      </span>
                      <!-- Launch-blocking badge -->
                      <span
                        v-if="item.isLaunchBlocking"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-200"
                        aria-label="Launch blocking"
                      >
                        Launch Blocking
                      </span>
                    </div>
                    <p class="text-white font-medium text-sm truncate">{{ item.title }}</p>
                    <p v-if="item.note" class="text-gray-400 text-xs mt-0.5 truncate">{{ item.note }}</p>
                    <!-- ── Handoff context (AC #5) ── -->
                    <div
                      :data-testid="COCKPIT_TEST_IDS.WORK_ITEM_HANDOFF_CONTEXT"
                      class="mt-2 pt-2 border-t border-gray-800"
                    >
                      <p class="text-xs text-teal-300 font-medium">
                        Next: {{ getHandoffContext(item).nextAction }}
                      </p>
                      <ul
                        v-if="getHandoffContext(item).missingEvidence.length > 0"
                        class="mt-1 space-y-0.5"
                        aria-label="Missing evidence"
                      >
                        <li
                          v-for="evidence in getHandoffContext(item).missingEvidence"
                          :key="evidence"
                          class="text-xs text-yellow-400 flex items-center gap-1"
                        >
                          <span aria-hidden="true">⚠</span>
                          <span>Missing: {{ evidence }}</span>
                        </li>
                      </ul>
                      <p
                        v-if="getHandoffContext(item).previousStage"
                        class="text-xs text-gray-500 mt-0.5"
                      >
                        Previous stage: {{ COCKPIT_STAGE_LABELS[getHandoffContext(item).previousStage ?? 'onboarding'] }}
                      </p>
                    </div>
                  </div>
                  <div class="flex-shrink-0 flex items-center gap-2">
                    <span class="text-xs text-gray-500 hidden sm:block">
                      {{ COCKPIT_STAGE_LABELS[item.stage] }}
                    </span>
                    <button
                      class="text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded whitespace-nowrap"
                      :data-testid="`view-case-details-${item.id}`"
                      :aria-label="`View case details for: ${item.title}`"
                      @click="openDrillDown(item)"
                    >
                      View details
                    </button>
                    <router-link
                      :to="item.workspacePath"
                      class="text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded whitespace-nowrap"
                      :aria-label="`Open workspace for: ${item.title}`"
                    >
                      Open workspace →
                    </router-link>
                  </div>
                </div>
              </li>
            </ul>
          </section>

          <!-- ── Bottleneck Analysis ── -->
          <section
            class="rounded-2xl border border-gray-700 bg-gray-800/60 p-6 mb-8 shadow-lg"
            :data-testid="COCKPIT_TEST_IDS.BOTTLENECK_PANEL"
            aria-labelledby="bottleneck-heading"
          >
            <h2 id="bottleneck-heading" class="text-lg font-semibold text-white mb-5">
              Stage Bottleneck Analysis
            </h2>
            <p class="text-gray-400 text-sm mb-5">
              Identify which stages are accumulating blocked, overdue, or unassigned items.
              Use this view to prioritize team attention and redistribute workload.
            </p>

            <!-- Empty state -->
            <div
              v-if="stageBottlenecks.length === 0"
              :data-testid="COCKPIT_TEST_IDS.BOTTLENECK_EMPTY"
              class="text-center py-8"
              role="status"
              aria-live="polite"
            >
              <CheckCircleIcon class="w-10 h-10 text-green-400 mx-auto mb-3" aria-hidden="true" />
              <p class="text-gray-300 font-medium">No stage bottlenecks detected</p>
              <p class="text-gray-500 text-sm mt-1">
                All stages are processing within expected parameters.
              </p>
            </div>

            <!-- Bottleneck list -->
            <ul v-else class="space-y-4" role="list" aria-label="Stage bottlenecks">
              <li
                v-for="bottleneck in stageBottlenecks"
                :key="bottleneck.stage"
                class="rounded-xl border border-gray-700 bg-gray-900/50 p-4"
                :data-testid="`bottleneck-stage-${bottleneck.stage}`"
              >
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 class="text-white font-medium text-sm">{{ bottleneck.label }}</h3>
                      <span
                        v-if="bottleneck.hasLaunchBlockers"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-800 text-red-100"
                        aria-label="Contains launch-blocking items"
                      >
                        Launch Blocking
                      </span>
                    </div>
                    <div class="flex gap-4 text-xs text-gray-400 flex-wrap">
                      <span v-if="bottleneck.blockedCount > 0" class="text-red-300">
                        {{ bottleneck.blockedCount }} blocked/overdue
                      </span>
                      <span v-if="bottleneck.dueSoonCount > 0" class="text-yellow-300">
                        {{ bottleneck.dueSoonCount }} due soon
                      </span>
                      <span v-if="bottleneck.unassignedCount > 0" class="text-gray-300">
                        {{ bottleneck.unassignedCount }} unassigned
                      </span>
                    </div>
                  </div>
                  <router-link
                    :to="bottleneck.workspacePath"
                    class="text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded whitespace-nowrap flex-shrink-0"
                    :aria-label="`Go to ${bottleneck.label} workspace`"
                  >
                    Go to workspace →
                  </router-link>
                </div>
              </li>
            </ul>
          </section>

          <!-- ── Downstream Handoff Panel ── -->
          <section
            class="rounded-2xl border border-gray-700 bg-gray-800/60 p-6 mb-8 shadow-lg"
            :data-testid="COCKPIT_TEST_IDS.HANDOFF_PANEL"
            aria-labelledby="handoff-heading"
          >
            <h2 id="handoff-heading" class="text-lg font-semibold text-white mb-5">
              Downstream Handoff Readiness
            </h2>
            <p class="text-gray-400 text-sm mb-5">
              Monitor whether downstream workspaces are ready to receive handoff.
              Click any card to navigate directly to that workspace.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                v-for="handoff in handoffs"
                :key="handoff.id"
                :data-testid="COCKPIT_TEST_IDS.HANDOFF_CARD"
                class="rounded-xl border p-4 flex flex-col gap-3 transition-colors hover:bg-gray-700/30"
                :class="handoffCardBorderClass(handoff.readiness)"
              >
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-white font-medium text-sm flex-1">{{ handoff.label }}</h3>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                    :class="handoffReadinessBadgeClass(handoff.readiness)"
                    :aria-label="`Readiness: ${HANDOFF_READINESS_LABELS[handoff.readiness]}`"
                  >
                    {{ HANDOFF_READINESS_LABELS[handoff.readiness] }}
                  </span>
                </div>
                <p class="text-gray-400 text-xs flex-1">{{ handoff.description }}</p>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex gap-2 text-xs flex-wrap">
                    <span v-if="handoff.blockerCount > 0" class="text-red-300">
                      {{ handoff.blockerCount }} blocker{{ handoff.blockerCount !== 1 ? 's' : '' }}
                    </span>
                    <span v-if="handoff.warningCount > 0" class="text-yellow-300">
                      {{ handoff.warningCount }} warning{{ handoff.warningCount !== 1 ? 's' : '' }}
                    </span>
                    <span
                      v-if="handoff.blockerCount === 0 && handoff.warningCount === 0"
                      class="text-gray-500"
                    >
                      No active issues
                    </span>
                  </div>
                  <router-link
                    :to="handoff.path"
                    class="text-xs text-teal-400 hover:text-teal-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded whitespace-nowrap"
                    :aria-label="`Navigate to ${handoff.label}`"
                  >
                    Open →
                  </router-link>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Disclaimer ── -->
          <p
            class="text-xs text-gray-600 text-center mt-6"
            data-testid="cockpit-disclaimer"
            role="note"
          >
            Queue metrics shown are derived from frontend state for CI/dev preview.
            In production, live data is sourced from the compliance case management API.
          </p>

        </template>
      </div>
    </div>
  </MainLayout>

  <!-- Case Drill-Down Panel -->
  <CaseDrillDownPanel
    v-model="drillDownOpen"
    :item="selectedWorkItem"
    @escalate="openEscalation"
  />

  <!-- Guided Escalation Modal -->
  <EscalationFlowModal
    v-model="escalationOpen"
    :item="escalationItem"
    @submitted="onEscalationSubmitted"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../layout/MainLayout.vue'
import CaseDrillDownPanel from '../components/compliance/CaseDrillDownPanel.vue'
import EscalationFlowModal from '../components/compliance/EscalationFlowModal.vue'
import {
  ChartBarSquareIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/outline'
import {
  COCKPIT_TEST_IDS,
  COCKPIT_POSTURE_LABELS,
  COCKPIT_POSTURE_DESCRIPTIONS,
  COCKPIT_STAGE_LABELS,
  WORK_ITEM_STATUS_LABELS,
  OWNERSHIP_STATE_LABELS,
  SLA_URGENCY_LABELS,
  HANDOFF_READINESS_LABELS,
  OPERATOR_ROLE_LABELS,
  OPERATOR_ROLE_FILTER_LABELS,
  OPERATOR_ROLE_FILTER_DESCRIPTIONS,
  deriveQueueHealth,
  deriveStageBottlenecks,
  deriveCockpitPosture,
  buildDefaultHandoffs,
  deriveRoleSummaries,
  deriveAgingBuckets,
  cockpitPostureBannerClass,
  cockpitPostureIconClass,
  workItemStatusBadgeClass,
  ownershipBadgeClass,
  slaUrgencyBadgeClass,
  handoffReadinessBadgeClass,
  classifySlaUrgency,
  filterWorkItemsByPersona,
  deriveWorkItemHandoffContext,
  MOCK_WORK_ITEMS_DEGRADED,
  MOCK_COCKPIT_REFRESHED_AT,
  type WorkItem,
  type CockpitPosture,
  type HandoffReadiness,
  type OperatorRole,
} from '../utils/complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const isLoading = ref(true)
const isDegraded = ref(false)
const workItems = ref<WorkItem[]>([])
const refreshedAt = ref<string>(MOCK_COCKPIT_REFRESHED_AT)
const worklistFilter = ref<string>('all')
const activePersona = ref<OperatorRole>('compliance_analyst')

// Drill-down and escalation state
const drillDownOpen = ref(false)
const selectedWorkItem = ref<WorkItem | null>(null)
const escalationOpen = ref(false)
const escalationItem = ref<WorkItem | null>(null)

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(async () => {
  await loadData()
})

async function loadData() {
  isLoading.value = true
  isDegraded.value = false
  try {
    // In production this would call the compliance case management API.
    // Using deterministic mock data for CI/dev preview.
    await new Promise<void>((resolve) => setTimeout(resolve, 120))
    workItems.value = MOCK_WORK_ITEMS_DEGRADED
    refreshedAt.value = new Date().toISOString()
  } catch {
    isDegraded.value = true
    workItems.value = []
    refreshedAt.value = MOCK_COCKPIT_REFRESHED_AT
  } finally {
    isLoading.value = false
  }
}

function refresh() {
  loadData()
}

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

const now = computed(() => Date.now())

const queueHealth = computed(() => deriveQueueHealth(workItems.value, now.value))

const agingBuckets = computed(() => deriveAgingBuckets(workItems.value, now.value))

const stageBottlenecks = computed(() => deriveStageBottlenecks(workItems.value, now.value))

const handoffs = computed(() => buildDefaultHandoffs(workItems.value, now.value))

const roleSummaries = computed(() => deriveRoleSummaries(workItems.value, queueHealth.value, now.value))

const posture = computed<CockpitPosture>(() =>
  deriveCockpitPosture(queueHealth.value, !isDegraded.value),
)

const postureLabel = computed(() => COCKPIT_POSTURE_LABELS[posture.value])

const postureDescription = computed(() => COCKPIT_POSTURE_DESCRIPTIONS[posture.value])

const postureBannerClass = computed(() => cockpitPostureBannerClass(posture.value))

const postureIconBgClass = computed(() => cockpitPostureIconClass(posture.value))

const postureIcon = computed(() => {
  switch (posture.value) {
    case 'clear':
      return CheckBadgeIcon
    case 'attention_required':
      return ExclamationCircleIcon
    case 'critical':
      return ShieldExclamationIcon
    case 'degraded':
      return ExclamationTriangleIcon
  }
})

const formattedRefreshedAt = computed(() => {
  try {
    return new Date(refreshedAt.value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Unknown'
  }
})

// ---------------------------------------------------------------------------
// Worklist filtering
// ---------------------------------------------------------------------------

/** All operator role options for the persona selector */
const personas: OperatorRole[] = ['compliance_analyst', 'operations_lead', 'sign_off_approver', 'team_lead']

const filteredWorkItems = computed(() => {
  const active = workItems.value.filter((i) => i.status !== 'complete')
  // Persona filter is always applied; specific status/ownership filters override it
  const personaItems = filterWorkItemsByPersona(workItems.value, activePersona.value)
  switch (worklistFilter.value) {
    case 'assigned_to_me':
      return active.filter((i) => i.ownership === 'assigned_to_me')
    case 'unassigned':
      return active.filter((i) => i.ownership === 'unassigned')
    case 'overdue':
      return active.filter(
        (i) => i.status === 'overdue' || classifySlaUrgency(i.dueAt, now.value) === 'overdue',
      )
    case 'blocked':
      return active.filter((i) => i.status === 'blocked')
    case 'awaiting_customer_input':
      return active.filter((i) => i.ownership === 'blocked_by_external')
    case 'pending_review':
      return active.filter((i) => i.status === 'pending_review')
    case 'approval_ready':
      return active.filter((i) => i.status === 'approval_ready')
    case 'escalated':
      return active.filter((i) => i.status === 'escalated' || i.ownership === 'escalated')
    default:
      return personaItems
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getItemSlaUrgency(item: WorkItem) {
  return classifySlaUrgency(item.dueAt, now.value)
}

function getHandoffContext(item: WorkItem) {
  return deriveWorkItemHandoffContext(item, now.value)
}

function openDrillDown(item: WorkItem) {
  selectedWorkItem.value = item
  drillDownOpen.value = true
}

function openEscalation(item: WorkItem) {
  escalationItem.value = item
  drillDownOpen.value = false
  escalationOpen.value = true
}

function onEscalationSubmitted(_payload: { item: WorkItem; reason: string; note: string; destination: string }) {
  // In production, this would call the compliance case management API.
  // For now, just close the escalation modal after a brief confirmation display.
}

function handoffCardBorderClass(readiness: HandoffReadiness): string {
  switch (readiness) {
    case 'ready':
      return 'border-green-700 bg-green-900/20'
    case 'has_warnings':
      return 'border-yellow-700 bg-yellow-900/20'
    case 'not_ready':
      return 'border-red-700 bg-red-900/20'
    default:
      return 'border-gray-700 bg-gray-900/30'
  }
}

function roleSummaryMetricClass(severity: 'red' | 'yellow' | 'green' | 'gray'): string {
  switch (severity) {
    case 'red':
      return 'text-red-300'
    case 'yellow':
      return 'text-yellow-300'
    case 'green':
      return 'text-green-300'
    default:
      return 'text-gray-300'
  }
}

function roleSummaryCardBorderClass(needsAttention: boolean): string {
  return needsAttention
    ? 'border-yellow-700 bg-yellow-900/10'
    : 'border-gray-700 bg-gray-800/60'
}
</script>
