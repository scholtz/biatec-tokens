<template>
  <div
    class="action-explainer"
    :class="{ 'action-explainer--expanded': isExpanded }"
    role="region"
    :aria-label="`Server action explanation for ${actionTitle}`"
  >
    <button
      @click="toggle"
      class="action-explainer-toggle"
      :aria-expanded="isExpanded ? 'true' : 'false'"
      :aria-controls="`explainer-${explainerId}`"
    >
      <span class="toggle-icon" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          :class="{ 'rotate-180': isExpanded }"
        >
          <path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="toggle-label">{{ toggleLabel }}</span>
    </button>
    
    <div
      v-show="isExpanded"
      :id="`explainer-${explainerId}`"
      class="action-explainer-content"
    >
      <div class="explainer-section">
        <h4 class="explainer-heading">What happens when you {{ actionTitle.toLowerCase() }}?</h4>
        <p class="explainer-text">{{ whatHappens }}</p>
      </div>
      
      <div class="explainer-section">
        <h4 class="explainer-heading">Server-side processing</h4>
        <ol class="explainer-steps">
          <li v-for="(step, index) in steps" :key="index" class="explainer-step">
            <span class="step-number">{{ index + 1 }}</span>
            <span class="step-text">{{ step }}</span>
          </li>
        </ol>
      </div>
      
      <div v-if="expectedDuration" class="explainer-section">
        <h4 class="explainer-heading">Expected duration</h4>
        <p class="explainer-text">
          <strong>{{ expectedDuration }}</strong>
          <span v-if="durationNote"> - {{ durationNote }}</span>
        </p>
      </div>
      
      <div v-if="possibleOutcomes" class="explainer-section">
        <h4 class="explainer-heading">Possible outcomes</h4>
        <ul class="explainer-outcomes">
          <li v-for="(outcome, index) in possibleOutcomes" :key="index" class="explainer-outcome">
            <span :class="`outcome-icon outcome-icon--${outcome.type}`" aria-hidden="true">
              {{ getOutcomeIcon(outcome.type) }}
            </span>
            <div class="outcome-content">
              <strong>{{ outcome.title }}</strong>
              <p>{{ outcome.description }}</p>
            </div>
          </li>
        </ul>
      </div>
      
      <div v-if="$slots.additional" class="explainer-section">
        <slot name="additional"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

export interface Outcome {
  type: 'success' | 'partial' | 'error';
  title: string;
  description: string;
}

interface Props {
  actionTitle: string;
  whatHappens: string;
  steps: string[];
  expectedDuration?: string;
  durationNote?: string;
  possibleOutcomes?: Outcome[];
  defaultExpanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: false,
});

const emit = defineEmits<{
  toggle: [isExpanded: boolean];
}>();

const explainerId = ref(`explainer-${Math.random().toString(36).substring(2, 9)}`);
const isExpanded = ref(props.defaultExpanded);

const toggleLabel = computed(() => {
  return isExpanded.value
    ? `Hide details about "${props.actionTitle}"`
    : `Learn what happens when you "${props.actionTitle}"`;
});

function toggle(): void {
  isExpanded.value = !isExpanded.value;
  emit('toggle', isExpanded.value);
}

function getOutcomeIcon(type: string): string {
  const icons: Record<string, string> = {
    success: '✓',
    partial: '⚠',
    error: '✗',
  };
  return icons[type] || '•';
}
</script>

<style scoped>
.action-explainer {
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 0.5rem;
  background-color: var(--color-gray-50, #f9fafb);
  overflow: hidden;
}

.action-explainer--expanded {
  background-color: var(--color-white, #ffffff);
}

.action-explainer-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
  color: var(--color-text-primary, #1f2937);
}

.action-explainer-toggle:hover {
  background-color: var(--color-gray-100, #f3f4f6);
}

.action-explainer-toggle:focus {
  outline: 2px solid var(--color-blue-500, #3b82f6);
  outline-offset: -2px;
}

.toggle-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.toggle-icon svg {
  transition: transform 0.2s;
}

.rotate-180 {
  transform: rotate(180deg);
}

.toggle-label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-blue-600, #2563eb);
}

.action-explainer-content {
  padding: 1rem;
  border-top: 1px solid var(--color-gray-200, #e5e7eb);
}

.explainer-section {
  margin-bottom: 1.5rem;
}

.explainer-section:last-child {
  margin-bottom: 0;
}

.explainer-heading {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  margin: 0 0 0.5rem 0;
}

.explainer-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0;
  line-height: 1.5;
}

.explainer-steps {
  list-style: none;
  padding: 0;
  margin: 0;
}

.explainer-step {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-gray-50, #f9fafb);
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.explainer-step:last-child {
  margin-bottom: 0;
}

.step-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-blue-100, #dbeafe);
  color: var(--color-blue-700, #1d4ed8);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
}

.step-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-primary, #374151);
  line-height: 1.5;
}

.explainer-outcomes {
  list-style: none;
  padding: 0;
  margin: 0;
}

.explainer-outcome {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.explainer-outcome:last-child {
  margin-bottom: 0;
}

.outcome-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: bold;
}

.outcome-icon--success {
  background-color: var(--color-green-100, #d1fae5);
  color: var(--color-green-700, #047857);
}

.outcome-icon--partial {
  background-color: var(--color-yellow-100, #fef3c7);
  color: var(--color-yellow-700, #b45309);
}

.outcome-icon--error {
  background-color: var(--color-red-100, #fee2e2);
  color: var(--color-red-700, #b91c1c);
}

.outcome-content {
  flex: 1;
}

.outcome-content strong {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-primary, #1f2937);
  margin-bottom: 0.25rem;
}

.outcome-content p {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0;
  line-height: 1.5;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .action-explainer {
    background-color: var(--color-gray-800, #1f2937);
    border-color: var(--color-gray-700, #374151);
  }
  
  .action-explainer--expanded {
    background-color: var(--color-gray-800, #1f2937);
  }
  
  .action-explainer-toggle:hover {
    background-color: var(--color-gray-700, #374151);
  }
  
  .action-explainer-content {
    border-top-color: var(--color-gray-700, #374151);
  }
  
  .explainer-step {
    background-color: var(--color-gray-700, #374151);
    border-color: var(--color-gray-600, #4b5563);
  }
}
</style>
