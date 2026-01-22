<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="pi pi-shield-check text-biatec-accent"></i>
          RWA Compliance Presets
        </h3>
        <p class="text-sm text-gray-400 mt-1">
          Pre-configured tokens with MICA-aligned compliance features
        </p>
      </div>
      <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
        MICA Compliant
      </span>
    </div>

    <!-- Presets Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <button
        v-for="preset in rwaPresets"
        :key="preset.id"
        @click="selectPreset(preset.id)"
        :class="[
          'p-5 rounded-xl border-2 transition-all duration-200 text-left group',
          selectedPreset === preset.id
            ? 'border-biatec-accent bg-biatec-accent/10'
            : 'border-white/20 hover:border-biatec-accent/50 hover:bg-white/5',
        ]"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900 dark:text-white text-base mb-1 flex items-center gap-2">
              {{ preset.name }}
              <i 
                v-if="selectedPreset === preset.id" 
                class="pi pi-check-circle text-biatec-accent text-sm"
              ></i>
            </h4>
            <p class="text-sm text-gray-400">{{ preset.description }}</p>
          </div>
        </div>

        <!-- Features -->
        <div class="flex flex-wrap gap-2 mb-3">
          <span 
            v-if="preset.rwaFeatures?.whitelistEnabled"
            class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs flex items-center gap-1"
            title="Whitelist enabled for controlled access"
          >
            <i class="pi pi-users"></i>
            Whitelist
          </span>
          <span 
            v-if="preset.rwaFeatures?.transferRestrictions"
            class="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs flex items-center gap-1"
            title="Transfer restrictions for compliance"
          >
            <i class="pi pi-lock"></i>
            Transfer Restrictions
          </span>
          <span 
            v-if="preset.rwaFeatures?.issuerControls"
            class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center gap-1"
            title="Issuer controls for regulatory compliance"
          >
            <i class="pi pi-shield-check"></i>
            Issuer Controls
          </span>
          <span 
            v-if="preset.rwaFeatures?.kycRequired"
            class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1"
            title="KYC/AML verification required"
          >
            <i class="pi pi-verified"></i>
            KYC Required
          </span>
        </div>

        <!-- Network & Standard -->
        <div class="flex items-center gap-2 text-xs">
          <span class="px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
            {{ preset.standard }}
          </span>
          <span class="px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
            {{ preset.network }}
          </span>
        </div>
      </button>
    </div>

    <!-- Selected Preset Details -->
    <div 
      v-if="selectedPreset && currentPreset" 
      class="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl space-y-5"
    >
      <!-- Guidance -->
      <div>
        <h4 class="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
          <i class="pi pi-info-circle"></i>
          Implementation Guidance
        </h4>
        <p class="text-sm text-gray-300">{{ currentPreset.guidance }}</p>
      </div>

      <!-- Compliance Requirements -->
      <div>
        <h4 class="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
          <i class="pi pi-shield-check"></i>
          Legal & Regulatory Compliance
        </h4>
        <p class="text-sm text-gray-300 mb-3">{{ currentPreset.compliance }}</p>
      </div>

      <!-- Compliance Implications -->
      <div v-if="currentPreset.complianceImplications && currentPreset.complianceImplications.length > 0">
        <h4 class="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
          <i class="pi pi-exclamation-triangle"></i>
          Compliance Implications & Requirements
        </h4>
        <div class="space-y-2">
          <div 
            v-for="(implication, idx) in currentPreset.complianceImplications" 
            :key="idx"
            class="flex items-start gap-2 text-xs text-gray-300 bg-black/20 p-3 rounded-lg"
          >
            <i class="pi pi-check-circle text-yellow-400 mt-0.5 flex-shrink-0"></i>
            <span>{{ implication }}</span>
          </div>
        </div>
      </div>

      <!-- RWA Features Summary -->
      <div v-if="currentPreset.rwaFeatures">
        <h4 class="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
          <i class="pi pi-list"></i>
          Enabled Features
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div 
            v-for="(enabled, feature) in currentPreset.rwaFeatures" 
            :key="feature"
            :class="[
              'flex items-center gap-2 text-xs p-2 rounded-lg',
              enabled ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'
            ]"
          >
            <i :class="enabled ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
            <span class="capitalize">{{ formatFeatureName(feature) }}</span>
          </div>
        </div>
      </div>

      <!-- Use Cases -->
      <div>
        <h4 class="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
          <i class="pi pi-briefcase"></i>
          Recommended Use Cases
        </h4>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="useCase in currentPreset.useCases" 
            :key="useCase"
            class="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs"
          >
            {{ useCase }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3 pt-4 border-t border-white/10">
        <button
          @click="$emit('apply-preset', selectedPreset)"
          class="flex-1 btn-primary px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <i class="pi pi-check"></i>
          Apply This Preset
        </button>
        <button
          @click="selectedPreset = null"
          class="px-4 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors text-sm"
        >
          Clear Selection
        </button>
      </div>
    </div>

    <!-- Compliance Warning -->
    <div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-orange-400 mt-1"></i>
        <div class="flex-1">
          <h5 class="text-sm font-semibold text-orange-400 mb-1">Legal Disclaimer</h5>
          <p class="text-xs text-gray-300">
            These presets provide technical compliance features but do not constitute legal advice. 
            You must consult with legal counsel and obtain necessary regulatory authorizations before 
            deploying RWA tokens. Requirements vary by jurisdiction and token classification.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTokenStore } from '../stores/tokens';
import type { TokenTemplate } from '../stores/tokens';

const tokenStore = useTokenStore();
const selectedPreset = ref<string | null>(null);

const rwaPresets = computed(() => tokenStore.rwaTokenTemplates);

const currentPreset = computed(() => {
  if (!selectedPreset.value) return null;
  return rwaPresets.value.find((p: TokenTemplate) => p.id === selectedPreset.value);
});

const selectPreset = (presetId: string) => {
  selectedPreset.value = presetId;
};

const formatFeatureName = (feature: string): string => {
  return feature
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

defineEmits<{
  'apply-preset': [presetId: string]
}>();
</script>
