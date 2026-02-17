<template>
  <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:bg-white lg:dark:bg-gray-900 lg:border-r lg:border-gray-200 lg:dark:border-gray-800">
    <div class="flex-1 flex flex-col min-h-0 pt-6">
      <div class="flex-1 flex flex-col overflow-y-auto">
        <nav class="px-4 space-y-1">
          <div class="mb-6">
            <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Actions</h3>
            <div class="mt-3 space-y-1">
              <router-link
                to="/launch/guided"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <PlusCircleIcon class="mr-3 h-5 w-5" />
                Guided Token Launch
              </router-link>
              <router-link
                to="/create"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <PlusCircleIcon class="mr-3 h-5 w-5" />
                Create Token (Advanced)
              </router-link>
              <router-link
                to="/dashboard"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChartBarIcon class="mr-3 h-5 w-5" />
                View Dashboard
              </router-link>
              <router-link
                to="/token-standards"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <CubeIcon class="mr-3 h-5 w-5" />
                Token Standards
              </router-link>
              <router-link
                to="/enterprise-guide"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <BuildingOfficeIcon class="mr-3 h-5 w-5" />
                Enterprise Guide
              </router-link>
              <router-link
                to="/enterprise/onboarding"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-l-2 border-blue-500"
              >
                <BuildingOfficeIcon class="mr-3 h-5 w-5" />
                Onboarding Center
              </router-link>
              <router-link
                to="/compliance-monitoring"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ShieldCheckIcon class="mr-3 h-5 w-5" />
                Compliance Monitoring
              </router-link>
              <router-link
                to="/compliance/whitelists"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <i class="pi pi-users mr-3 text-base"></i>
                Whitelist Management
              </router-link>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Tokens</h3>
            <div class="mt-3 space-y-1">
              <div v-for="standard in tokenStore.tokenStandards" :key="standard.name" class="flex items-center justify-between px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                <div class="flex items-center">
                  <div class="w-2 h-2 rounded-full mr-3" :class="standard.bgClass"></div>
                  {{ standard.name }}
                </div>
                <Badge size="sm">{{ standard.count }}</Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Activity</h3>
            <div class="mt-3 space-y-2">
              <div v-if="recentActivity.length === 0" class="px-3 py-4 text-xs text-gray-500 dark:text-gray-500 text-center">
                <div class="font-medium">No recent activity</div>
                <div class="mt-1">Activity will appear here as you use the platform</div>
              </div>
              <div v-for="activity in recentActivity" :key="activity.id" class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                <div class="font-medium">{{ activity.action }}</div>
                <div class="text-gray-500 dark:text-gray-500">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useTokenStore } from "../../stores/tokens";
import Badge from "../ui/Badge.vue";
import { PlusCircleIcon, ChartBarIcon, CubeIcon, BuildingOfficeIcon, ShieldCheckIcon } from "@heroicons/vue/24/outline";

const tokenStore = useTokenStore();

// Mock data removed per MVP requirements (AC #6)
// TODO: Replace with real activity data from backend API
const recentActivity: Array<{ id: number; action: string; time: string }> = [];
</script>
