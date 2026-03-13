<template>
  <div
    class="team-workspace min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4"
    data-testid="team-workspace"
  >
    <!-- Skip to main content (WCAG 2.1 AA 2.4.1) -->
    <a
      href="#workspace-main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus-visible:ring-2 focus-visible:ring-blue-400"
      data-testid="skip-to-main"
    >
      Skip to main content
    </a>

    <div class="max-w-7xl mx-auto">
      <!-- ── Page Header ─────────────────────────────────────────────── -->
      <header class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0"
                aria-hidden="true"
              >
                <i class="pi pi-users text-white text-xl"></i>
              </div>
              <div>
                <h1
                  class="text-3xl font-bold text-white"
                  data-testid="workspace-heading"
                >
                  Team Operations Workspace
                </h1>
                <p class="text-gray-400 text-sm mt-1">
                  Collaborate on approvals, policy reviews, and compliance sign-offs across your team.
                </p>
              </div>
            </div>
          </div>

          <!-- Summary bar -->
          <div
            class="flex flex-wrap items-center gap-3"
            aria-label="Workflow summary counts"
            data-testid="summary-bar"
          >
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/60 border border-white/10"
              data-testid="pending-count-badge"
            >
              <span class="w-2 h-2 rounded-full bg-yellow-400" aria-hidden="true"></span>
              <span class="text-sm font-medium text-white">{{ pendingCount }}</span>
              <span class="text-xs text-gray-400">Pending</span>
            </div>
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/60 border border-white/10"
              data-testid="in-review-count-badge"
            >
              <span class="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true"></span>
              <span class="text-sm font-medium text-white">{{ inReviewCount }}</span>
              <span class="text-xs text-gray-400">In Review</span>
            </div>
            <div
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/60 border border-white/10"
              data-testid="completed-count-badge"
            >
              <span class="w-2 h-2 rounded-full bg-green-400" aria-hidden="true"></span>
              <span class="text-sm font-medium text-white">{{ completedCount }}</span>
              <span class="text-xs text-gray-400">Completed</span>
            </div>
          </div>
        </div>
      </header>

      <!-- ── No-role info banner (read-only notice) ───────────────── -->
      <!-- Shown as an informational banner when the user is authenticated but   -->
      <!-- not yet assigned to the team.  They can still view the workspace in   -->
      <!-- read-only mode — actions are disabled by canApprove / canManageTeam.  -->
      <div
        v-if="!hasRole"
        id="no-role-notice"
        class="mb-6 glass-effect rounded-xl p-4 border border-yellow-500/30 flex items-start gap-3"
        role="status"
        data-testid="no-role-message"
        aria-label="Read-only access notice"
      >
        <i class="pi pi-info-circle text-yellow-400 text-xl flex-shrink-0 mt-0.5" aria-hidden="true"></i>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-yellow-300">No Team Role Assigned</p>
          <p class="text-xs text-gray-400 mt-0.5">
            You can view pending work items in read-only mode.
            Contact your organisation owner to be assigned a role before you can approve or request changes.
          </p>
        </div>
        <router-link
          to="/compliance"
          class="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
          aria-label="Go to Compliance Dashboard"
        >
          Compliance Dashboard
        </router-link>
      </div>

      <!-- ── Main content (always shown for authenticated users) ────── -->
      <main
        id="workspace-main"
        aria-label="Team approval workflow"
        :aria-describedby="!hasRole ? 'no-role-notice' : undefined"
      >
        <!-- Loading state -->
        <div
          v-if="workflowStore.loading"
          class="space-y-4"
          role="status"
          aria-label="Loading work items"
          data-testid="loading-state"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="glass-effect rounded-xl p-5 border border-white/10 animate-pulse"
          >
            <div class="flex gap-2 mb-3">
              <div class="h-5 w-24 bg-gray-700 rounded-full"></div>
              <div class="h-5 w-16 bg-gray-700 rounded-full"></div>
            </div>
            <div class="h-5 w-3/4 bg-gray-700 rounded mb-2"></div>
            <div class="h-4 w-full bg-gray-700 rounded"></div>
          </div>
        </div>

        <!-- Error state -->
        <div
          v-else-if="workflowStore.error"
          class="glass-effect rounded-xl p-8 border border-red-500/20 text-center"
          role="alert"
          data-testid="error-state"
        >
          <i class="pi pi-exclamation-triangle text-red-400 text-4xl mb-4" aria-hidden="true"></i>
          <h2 class="text-xl font-semibold text-white mb-2">Failed to Load Work Items</h2>
          <p class="text-gray-400 text-sm mb-4">{{ workflowStore.error }}</p>
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="retry-button"
            @click="handleRetry"
          >
            <i class="pi pi-refresh" aria-hidden="true"></i>
            Retry
          </button>
        </div>

        <!-- Queue sections -->
        <div v-else class="space-y-8">

          <!-- ── 1. Awaiting My Review ──────────────────────────────── -->
          <section
            aria-labelledby="awaiting-review-heading"
            data-testid="awaiting-review-section"
          >
            <div class="flex items-center gap-3 mb-4">
              <h2
                id="awaiting-review-heading"
                class="text-xl font-semibold text-white"
              >
                Awaiting My Review
              </h2>
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                :class="workflowStore.awaitingMyReview.length > 0 ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-400'"
                aria-label="`${workflowStore.awaitingMyReview.length} items awaiting review`"
                data-testid="awaiting-review-count"
              >
                {{ workflowStore.awaitingMyReview.length }}
              </span>
            </div>

            <div
              v-if="workflowStore.awaitingMyReview.length === 0"
              class="text-center py-12 text-gray-500"
              data-testid="empty-state-awaiting"
            >
              <i class="pi pi-inbox text-4xl mb-3" aria-hidden="true"></i>
              <p class="text-sm">No items awaiting your review. Check back later.</p>
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <WorkItemCard
                v-for="item in workflowStore.awaitingMyReview"
                :key="item.id"
                :item="item"
                :current-user-email="currentUserEmail"
                :can-approve="canApprove"
                @approve="handleApprove"
                @request-changes="handleRequestChanges"
                @assign="handleAssign"
              />
            </div>
          </section>

          <!-- ── 2. Assigned to My Team ─────────────────────────────── -->
          <section
            aria-labelledby="assigned-section-heading"
            class="border-t border-white/10 pt-6"
            data-testid="assigned-section"
          >
            <div class="flex items-center gap-3 mb-4">
              <h2
                id="assigned-section-heading"
                class="text-xl font-semibold text-white"
              >
                Assigned to My Team
              </h2>
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                :class="workflowStore.assignedToTeam.length > 0 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'"
                aria-label="`${workflowStore.assignedToTeam.length} items assigned to team`"
                data-testid="assigned-count"
              >
                {{ workflowStore.assignedToTeam.length }}
              </span>
            </div>

            <div
              v-if="workflowStore.assignedToTeam.length === 0"
              class="text-center py-12 text-gray-500"
              data-testid="empty-state-assigned"
            >
              <i class="pi pi-users text-4xl mb-3" aria-hidden="true"></i>
              <p class="text-sm">No active items assigned to the team.</p>
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <WorkItemCard
                v-for="item in workflowStore.assignedToTeam"
                :key="item.id"
                :item="item"
                :current-user-email="currentUserEmail"
                :can-approve="canApprove"
                :can-assign="canManageTeam"
                @approve="handleApprove"
                @request-changes="handleRequestChanges"
                @assign="handleAssign"
              />
            </div>
          </section>

          <!-- ── 3. Ready for Approval ──────────────────────────────── -->
          <section
            aria-labelledby="ready-approval-heading"
            class="border-t border-white/10 pt-6"
            data-testid="ready-approval-section"
          >
            <div class="flex items-center gap-3 mb-4">
              <h2
                id="ready-approval-heading"
                class="text-xl font-semibold text-white"
              >
                Ready for Approval
              </h2>
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                :class="workflowStore.readyForApproval.length > 0 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'"
                aria-label="`${workflowStore.readyForApproval.length} items ready for approval`"
                data-testid="ready-approval-count"
              >
                {{ workflowStore.readyForApproval.length }}
              </span>
            </div>

            <div
              v-if="workflowStore.readyForApproval.length === 0"
              class="text-center py-12 text-gray-500"
              data-testid="empty-state-ready"
            >
              <i class="pi pi-check-circle text-4xl mb-3" aria-hidden="true"></i>
              <p class="text-sm">No items awaiting a final approval decision.</p>
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <WorkItemCard
                v-for="item in workflowStore.readyForApproval"
                :key="item.id"
                :item="item"
                :current-user-email="currentUserEmail"
                :can-approve="canApprove"
                @approve="handleApprove"
                @request-changes="handleRequestChanges"
                @assign="handleAssign"
              />
            </div>
          </section>

          <!-- ── 4. Recently Completed ──────────────────────────────── -->
          <section
            aria-labelledby="completed-section-heading"
            class="border-t border-white/10 pt-6"
            data-testid="completed-section"
          >
            <button
              class="flex items-center gap-3 mb-4 w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              :aria-expanded="completedExpanded"
              aria-controls="completed-items-list"
              data-testid="completed-section-toggle"
              @click="completedExpanded = !completedExpanded"
            >
              <h2
                id="completed-section-heading"
                class="text-xl font-semibold text-white"
              >
                Recently Completed
              </h2>
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-gray-700 text-gray-400"
                data-testid="completed-count"
              >
                {{ workflowStore.recentlyCompleted.length }}
              </span>
              <i
                class="pi ml-auto text-gray-400 transition-transform duration-200"
                :class="completedExpanded ? 'pi-chevron-up' : 'pi-chevron-down'"
                aria-hidden="true"
              ></i>
            </button>

            <div
              v-if="completedExpanded"
              id="completed-items-list"
            >
              <div
                v-if="workflowStore.recentlyCompleted.length === 0"
                class="text-center py-12 text-gray-500"
                data-testid="empty-state-completed"
              >
                <i class="pi pi-history text-4xl mb-3" aria-hidden="true"></i>
                <p class="text-sm">No items completed in the last 7 days.</p>
              </div>

              <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <WorkItemCard
                  v-for="item in workflowStore.recentlyCompleted"
                  :key="item.id"
                  :item="item"
                  :current-user-email="currentUserEmail"
                  :can-approve="false"
                  @approve="handleApprove"
                  @request-changes="handleRequestChanges"
                  @assign="handleAssign"
                />
              </div>
            </div>
          </section>

          <!-- Team members link -->
          <div class="border-t border-white/10 pt-6 text-center">
            <p class="text-gray-500 text-sm mb-2">Need to manage team roles or access?</p>
            <router-link
              to="/compliance"
              class="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              data-testid="team-members-link"
            >
              <i class="pi pi-users" aria-hidden="true"></i>
              Go to Compliance Dashboard → Team &amp; Access
            </router-link>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApprovalWorkflowStore } from '../stores/approvalWorkflow'
import { useTeamStore } from '../stores/team'
import { useAuthStore } from '../stores/auth'
import WorkItemCard from '../components/team/WorkItemCard.vue'
import type { WorkItem } from '../types/approvalWorkflow'

const workflowStore = useApprovalWorkflowStore()
const teamStore = useTeamStore()
const authStore = useAuthStore()

const completedExpanded = ref(false)

// ── Auth / role helpers ───────────────────────────────────────────────────

const currentUserEmail = computed(() => authStore.user?.email ?? '')

/** User has at least viewer role in the team (any role counts as "has role"). */
const hasRole = computed(() => {
  if (!authStore.isAuthenticated) return false
  return teamStore.currentUserRole !== null
})

/** User can approve items (owner or admin). */
const canApprove = computed(() => {
  const role = teamStore.currentUserRole
  return role === 'owner' || role === 'admin'
})

/** User can manage team assignments. */
const canManageTeam = computed(() => teamStore.canManageTeam)

// ── Summary counts ────────────────────────────────────────────────────────

const pendingCount = computed(
  () => workflowStore.workItems.filter((i) => i.state === 'pending').length,
)

const inReviewCount = computed(
  () => workflowStore.workItems.filter((i) => i.state === 'in_review').length,
)

const completedCount = computed(
  () =>
    workflowStore.workItems.filter(
      (i) => i.state === 'approved' || i.state === 'completed',
    ).length,
)

// ── Action handlers ───────────────────────────────────────────────────────

function handleApprove(itemId: string) {
  workflowStore.updateItemState(itemId, 'approved')
}

function handleRequestChanges(itemId: string) {
  workflowStore.updateItemState(itemId, 'needs_changes')
}

function handleAssign(_item: WorkItem) {
  // TODO: open assign-member modal — tracked in team workspace roadmap (issue #future)
  // The modal will allow selecting a team member email and calling workflowStore.assignItem().
}

function handleRetry() {
  workflowStore.initialize()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([workflowStore.initialize(), teamStore.initialize()])
})
</script>
