<script setup lang="ts">
/**
 * FeatureGate Component
 * Conditionally renders content based on entitlement access
 * Shows upgrade prompts when feature is not accessible
 */

import { computed } from "vue";
import { useRouter } from "vue-router";
import { entitlementService } from "../../services/EntitlementService";
import { FeatureFlag } from "../../types/entitlement";
import Button from "../ui/Button.vue";
import Modal from "../ui/Modal.vue";
import { ref } from "vue";

interface Props {
  feature: FeatureFlag;
  showUpgradePrompt?: boolean;
  fallbackMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showUpgradePrompt: true,
  fallbackMessage: "This feature is not available on your current plan.",
});

const router = useRouter();
const showModal = ref(false);

// Check feature access
const accessResult = computed(() => {
  return entitlementService.checkFeatureAccess(props.feature);
});

const isAllowed = computed(() => accessResult.value.allowed);

// Get upgrade prompt if not allowed
const upgradePrompt = computed(() => {
  if (isAllowed.value) return null;
  return entitlementService.getUpgradePrompt(props.feature);
});

const handleUpgrade = () => {
  if (upgradePrompt.value) {
    router.push(upgradePrompt.value.ctaLink);
  }
};

const openUpgradeModal = () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};
</script>

<template>
  <div class="feature-gate">
    <!-- Render content if allowed -->
    <div v-if="isAllowed" class="feature-gate__content">
      <slot></slot>
    </div>

    <!-- Show upgrade prompt if not allowed -->
    <div v-else-if="showUpgradePrompt" class="feature-gate__blocked">
      <div class="feature-gate__message">
        <div class="feature-gate__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-12 h-12"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h3 class="feature-gate__title">Feature Locked</h3>
        <p class="feature-gate__description">
          {{ accessResult.reason || fallbackMessage }}
        </p>
        <div class="feature-gate__actions">
          <Button @click="openUpgradeModal" variant="primary">
            View Upgrade Options
          </Button>
          <Button @click="$router.push('/subscription')" variant="outline">
            View Plans
          </Button>
        </div>
      </div>

      <!-- Upgrade modal -->
      <Modal v-if="upgradePrompt" :show="showModal" @close="closeModal">
        <template #header>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ upgradePrompt.title }}
          </h2>
        </template>

        <template #body>
          <div class="space-y-4">
            <p class="text-gray-700 dark:text-gray-300">
              {{ upgradePrompt.message }}
            </p>

            <div v-if="upgradePrompt.features.length > 0" class="mt-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Features included:
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="(feature, index) in upgradePrompt.features"
                  :key="index"
                  class="flex items-start"
                >
                  <svg
                    class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="text-gray-700 dark:text-gray-300">{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex gap-3 justify-end">
            <Button @click="closeModal" variant="outline">
              Maybe Later
            </Button>
            <Button @click="handleUpgrade" variant="primary">
              {{ upgradePrompt.ctaText }}
            </Button>
          </div>
        </template>
      </Modal>
    </div>

    <!-- Just show message if prompt is disabled -->
    <div v-else class="feature-gate__simple-message">
      <p class="text-gray-600 dark:text-gray-400">
        {{ accessResult.reason || fallbackMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
@reference "../../style.css";

.feature-gate {
  @apply w-full;
}

.feature-gate__content {
  @apply w-full;
}

.feature-gate__blocked {
  @apply rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center;
}

.feature-gate__message {
  @apply max-w-md mx-auto space-y-4;
}

.feature-gate__icon {
  @apply w-12 h-12 mx-auto text-gray-400 dark:text-gray-500;
}

.feature-gate__title {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100;
}

.feature-gate__description {
  @apply text-gray-600 dark:text-gray-400;
}

.feature-gate__actions {
  @apply flex gap-3 justify-center mt-6;
}

.feature-gate__simple-message {
  @apply p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}
</style>
