<template>
  <aside
    class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:bg-white lg:dark:bg-gray-900 lg:border-r lg:border-gray-200 lg:dark:border-gray-800"
    aria-label="Supplemental navigation"
  >
    <div class="flex-1 flex flex-col min-h-0 pt-6">
      <div class="flex-1 flex flex-col overflow-y-auto">
        <!-- WCAG SC 1.3.1: nav landmark with explicit label disambiguates from Main navigation -->
        <nav class="px-4 space-y-1" aria-label="Sidebar navigation">
          <div class="mb-6">
            <h3 class="px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Quick Actions</h3>
            <div class="mt-3 space-y-1">
              <!-- WCAG SC 2.4.7: focus-visible rings on all interactive links -->
              <!-- WCAG SC 4.1.2: aria-current="page" on active route -->
              <router-link
                to="/launch/workspace"
                :aria-current="isActive('/launch/workspace') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/launch/workspace')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <PlusCircleIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Guided Token Launch
              </router-link>
              <router-link
                to="/launch/guided"
                :aria-current="isActive('/launch/guided') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/launch/guided')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <PlusCircleIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Create Token
              </router-link>
              <router-link
                to="/dashboard"
                :aria-current="isActive('/dashboard') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/dashboard')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <ChartBarIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                View Dashboard
              </router-link>
              <router-link
                to="/token-standards"
                :aria-current="isActive('/token-standards') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/token-standards')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <CubeIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Token Standards
              </router-link>
              <router-link
                to="/enterprise-guide"
                :aria-current="isActive('/enterprise-guide') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/enterprise-guide')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <BuildingOfficeIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Enterprise Guide
              </router-link>
              <router-link
                to="/enterprise/onboarding"
                :aria-current="isActive('/enterprise/onboarding') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-2 border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/enterprise/onboarding')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'"
              >
                <BuildingOfficeIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Onboarding Center
              </router-link>
              <router-link
                to="/compliance/evidence"
                :aria-current="isActive('/compliance/evidence') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance/evidence')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <ClipboardDocumentCheckIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Release Evidence
              </router-link>
              <router-link
                to="/compliance/release"
                :aria-current="isActive('/compliance/release') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance/release')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <ShieldCheckIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Sign-off Readiness
              </router-link>
              <router-link
                to="/compliance/onboarding"
                :aria-current="isActive('/compliance/onboarding') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance/onboarding')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <UsersIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Investor Onboarding
              </router-link>
              <router-link
                to="/compliance/reporting"
                :aria-current="isActive('/compliance/reporting') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance/reporting')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <ClipboardDocumentListIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Compliance Reporting
              </router-link>
              <router-link
                to="/compliance/risk-report"
                :aria-current="isActive('/compliance/risk-report') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance/risk-report')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <ShieldExclamationIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Risk Report Builder
              </router-link>
              <router-link
                to="/compliance/approval"
                :aria-current="isActive('/compliance/approval') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance/approval')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <ClipboardDocumentListIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Approval Queue
              </router-link>
              <router-link
                to="/compliance/operations"
                :aria-current="isActive('/compliance/operations') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance/operations')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <ChartBarSquareIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Operations Cockpit
              </router-link>
              <router-link
                to="/compliance-monitoring"
                :aria-current="isActive('/compliance-monitoring') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance-monitoring')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <ShieldCheckIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Compliance Monitoring
              </router-link>
              <router-link
                to="/compliance/whitelists"
                :aria-current="isActive('/compliance/whitelists') ? 'page' : undefined"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                :class="isActive('/compliance/whitelists')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'"
              >
                <UsersIcon class="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                Whitelist Management
              </router-link>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Your Tokens</h3>
            <div class="mt-3 space-y-1">
              <div v-for="standard in tokenStore.tokenStandards" :key="standard.name" class="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                <div class="flex items-center">
                  <!-- WCAG SC 1.4.11: status dots use background color only; aria-hidden to prevent redundancy -->
                  <div class="w-2 h-2 rounded-full mr-3 shrink-0" :class="standard.bgClass" aria-hidden="true"></div>
                  {{ standard.name }}
                </div>
                <Badge size="sm">{{ standard.count }}</Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 class="px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Recent Activity</h3>
            <div class="mt-3 space-y-2">
              <div v-if="recentActivity.length === 0" class="px-3 py-4 text-xs text-gray-600 dark:text-gray-400 text-center" role="status" aria-live="polite">
                <div class="font-medium">No recent activity</div>
                <div class="mt-1">Activity will appear here as you use the platform</div>
              </div>
              <div v-for="activity in recentActivity" :key="activity.id" class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                <div class="font-medium">{{ activity.action }}</div>
                <div class="text-gray-600 dark:text-gray-400">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { useTokenStore } from "../../stores/tokens";
import Badge from "../ui/Badge.vue";
import { PlusCircleIcon, ChartBarIcon, CubeIcon, BuildingOfficeIcon, ShieldCheckIcon, ShieldExclamationIcon, UsersIcon, ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, ChartBarSquareIcon } from "@heroicons/vue/24/outline";

const route = useRoute();
const tokenStore = useTokenStore();

/** WCAG SC 4.1.2: aria-current="page" helper for active route detection. */
const isActive = (path: string): boolean => route.path === path;

// Mock data removed per MVP requirements (AC #6)
// TODO: Replace with real activity data from backend API
const recentActivity: Array<{ id: number; action: string; time: string }> = [];
</script>
