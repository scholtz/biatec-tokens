<template>
  <Card variant="glass" padding="md">
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-white">Wallet Segment Distribution</h3>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left py-2 text-gray-400 font-medium">Segment</th>
              <th class="text-right py-2 text-gray-400 font-medium">Wallets</th>
              <th class="text-right py-2 text-gray-400 font-medium">% of Total</th>
              <th class="text-right py-2 text-gray-400 font-medium">Avg Balance</th>
              <th class="text-right py-2 text-gray-400 font-medium">Activity (30d)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cohort in cohorts"
              :key="cohort.segment"
              class="border-b border-gray-700 hover:bg-gray-800/50"
            >
              <td class="py-3 text-white">
                <div class="flex items-center gap-2">
                  <Badge :variant="cohort.badgeVariant as 'default' | 'success' | 'warning' | 'error' | 'info'" size="sm">
                    {{ cohort.segment }}
                  </Badge>
                </div>
              </td>
              <td class="text-right text-gray-300">
                {{ cohort.walletCount.toLocaleString() }}
              </td>
              <td class="text-right text-gray-300">
                {{ cohort.percentage.toFixed(1) }}%
              </td>
              <td class="text-right text-gray-300">
                {{ formatBalance(cohort.avgBalance) }}
              </td>
              <td class="text-right text-gray-300">
                <div class="flex items-center justify-end gap-1">
                  <div class="w-16 bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-blue-500 rounded-full h-2"
                      :style="{ width: `${cohort.activityScore}%` }"
                    ></div>
                  </div>
                  <span class="text-xs">{{ cohort.activityScore }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-gray-700 font-medium">
              <td class="py-3 text-white">Total</td>
              <td class="text-right text-white">
                {{ totalWallets.toLocaleString() }}
              </td>
              <td class="text-right text-white">100%</td>
              <td class="text-right text-gray-400">-</td>
              <td class="text-right text-gray-400">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="text-xs text-gray-500">
        <p>Activity score represents transaction frequency and volume in the last 30 days</p>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '../ui/Card.vue'
import Badge from '../ui/Badge.vue'

interface CohortData {
  segment: string
  walletCount: number
  percentage: number
  avgBalance: number
  activityScore: number
  badgeVariant: 'default' | 'success' | 'warning' | 'error' | 'info'
}

// Mock data - TODO: fetch from API
const cohorts = computed<CohortData[]>(() => [
  {
    segment: 'Whales',
    walletCount: 12,
    percentage: 1.0,
    avgBalance: 2500000,
    activityScore: 85,
    badgeVariant: 'info',
  },
  {
    segment: 'Institutional',
    walletCount: 45,
    percentage: 3.6,
    avgBalance: 750000,
    activityScore: 72,
    badgeVariant: 'success',
  },
  {
    segment: 'Active',
    walletCount: 342,
    percentage: 27.4,
    avgBalance: 125000,
    activityScore: 68,
    badgeVariant: 'default',
  },
  {
    segment: 'Retail',
    walletCount: 678,
    percentage: 54.4,
    avgBalance: 8500,
    activityScore: 45,
    badgeVariant: 'default',
  },
  {
    segment: 'Dormant',
    walletCount: 170,
    percentage: 13.6,
    avgBalance: 3200,
    activityScore: 8,
    badgeVariant: 'warning',
  },
])

const totalWallets = computed(() => {
  return cohorts.value.reduce((sum, c) => sum + c.walletCount, 0)
})

function formatBalance(balance: number): string {
  if (balance >= 1000000) {
    return `$${(balance / 1000000).toFixed(1)}M`
  } else if (balance >= 1000) {
    return `$${(balance / 1000).toFixed(1)}K`
  } else {
    return `$${balance.toLocaleString()}`
  }
}
</script>
