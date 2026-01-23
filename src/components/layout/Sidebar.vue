<template>
  <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:bg-white lg:dark:bg-gray-900 lg:border-r lg:border-gray-200 lg:dark:border-gray-800">
    <div class="flex-1 flex flex-col min-h-0 pt-6">
      <div class="flex-1 flex flex-col overflow-y-auto">
        <nav class="px-4 space-y-1">
          <div class="mb-6">
            <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Actions</h3>
            <div class="mt-3 space-y-1">
              <router-link
                to="/create"
                class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <PlusCircleIcon class="mr-3 h-5 w-5" />
                Create Token
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
import { PlusCircleIcon, ChartBarIcon, CubeIcon, BuildingOfficeIcon } from "@heroicons/vue/24/outline";

const tokenStore = useTokenStore();

const recentActivity = [
  { id: 1, action: "Token created", time: "2 minutes ago" },
  { id: 2, action: "Deployment successful", time: "5 minutes ago" },
  { id: 3, action: "Settings updated", time: "1 hour ago" },
];
</script>
