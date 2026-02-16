<template>
  <div class="flex items-start justify-between gap-3">
    <div class="flex-1">
      <!-- Name & Severity Badge -->
      <div class="flex items-center gap-2 mb-2">
        <span class="text-sm font-semibold text-white">{{ name }}</span>
        <Badge
          :variant="
            indicator.severity === 'critical' ? 'error' :
            indicator.severity === 'high' ? 'error' :
            indicator.severity === 'medium' ? 'warning' :
            indicator.severity === 'low' ? 'default' :
            'success'
          "
          size="sm"
        >
          {{ indicator.severity }}
        </Badge>
      </div>

      <!-- Message -->
      <p class="text-sm text-gray-300 mb-2">{{ indicator.message }}</p>

      <!-- Tooltip (Detailed Info) -->
      <div class="text-xs bg-white/5 border border-white/10 rounded p-2 text-gray-400">
        {{ indicator.tooltip }}
      </div>

      <!-- Value vs Threshold -->
      <div class="flex items-center gap-4 mt-3">
        <div>
          <div class="text-xs text-gray-500">Current</div>
          <div class="text-lg font-bold text-white">
            {{ indicator.value }}{{ indicator.unit }}
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500">Threshold</div>
          <div class="text-lg font-bold text-gray-400">
            {{ indicator.threshold }}{{ indicator.unit }}
          </div>
        </div>
        <div v-if="indicator.trend" class="ml-auto">
          <div class="text-xs text-gray-500">Trend</div>
          <div class="flex items-center gap-1 text-sm">
            <i
              :class="[
                'pi',
                indicator.trend === 'increasing' ? 'pi-arrow-up text-red-400' :
                indicator.trend === 'decreasing' ? 'pi-arrow-down text-green-400' :
                'pi-minus text-gray-400'
              ]"
            ></i>
            <span class="text-white font-medium">{{ indicator.trend }}</span>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          :class="[
            'h-full transition-all duration-500',
            indicator.severity === 'critical' ? 'bg-red-500' :
            indicator.severity === 'high' ? 'bg-orange-500' :
            indicator.severity === 'medium' ? 'bg-yellow-500' :
            indicator.severity === 'low' ? 'bg-blue-500' :
            'bg-green-500'
          ]"
          :style="{ width: `${Math.min((indicator.value / indicator.threshold) * 100, 100)}%` }"
        ></div>
      </div>
    </div>

    <!-- Deep Link Arrow -->
    <i v-if="indicator.deepLink" class="pi pi-arrow-right text-gray-400 mt-1"></i>
  </div>
</template>

<script setup lang="ts">
import type { RiskIndicator } from '../../types/lifecycleCockpit'
import Badge from '../ui/Badge.vue'

defineProps<{
  indicator: RiskIndicator
  name: string
}>()
</script>
