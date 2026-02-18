<template>
  <div
    class="state-message"
    :class="[`state-message--${state.type}`, { 'state-message--compact': compact }]"
    role="alert"
    :aria-live="state.type === 'fatal-error' || state.type === 'retryable-failure' ? 'assertive' : 'polite'"
  >
    <div class="state-message-icon" aria-hidden="true">
      <component :is="getIcon()" />
    </div>
    
    <div class="state-message-content">
      <div class="state-message-header">
        <h4 class="state-message-title">{{ getTitle() }}</h4>
        <span v-if="!compact && state.timestamp" class="state-message-timestamp">
          {{ formatTimestamp(state.timestamp) }}
        </span>
      </div>
      
      <p class="state-message-text">{{ state.message }}</p>
      
      <div v-if="state.userGuidance" class="state-message-guidance">
        {{ state.userGuidance }}
      </div>
      
      <div v-if="state.nextAction" class="state-message-next-action">
        <strong>Next step:</strong> {{ state.nextAction }}
      </div>
      
      <div v-if="state.retryStrategy && state.retryStrategy.canRetryNow" class="state-message-retry">
        <div class="retry-info">
          <span>Attempt {{ state.retryStrategy.currentAttempt }} of {{ state.retryStrategy.maxAttempts }}</span>
          <span v-if="state.retryStrategy.retryAfterMs">
            Wait {{ Math.ceil(state.retryStrategy.retryAfterMs / 1000) }}s before retry
          </span>
        </div>
        <slot name="retry-button"></slot>
      </div>
      
      <details v-if="state.technicalDetails" class="state-message-details">
        <summary>Technical details</summary>
        <pre class="technical-details-content">{{ state.technicalDetails }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeterministicState } from '../../utils/deterministicStateManager';

interface Props {
  state: DeterministicState;
  compact?: boolean;
}

const props = defineProps<Props>();

function getIcon() {
  const icons: Record<string, string> = {
    loading: 'IconLoading',
    empty: 'IconEmpty',
    success: 'IconSuccess',
    'partial-failure': 'IconWarning',
    'retryable-failure': 'IconError',
    'fatal-error': 'IconFatalError',
  };
  
  // Simple inline SVG components for each state
  const IconLoading = {
    template: `
      <svg class="icon-loading" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
  };
  
  const IconEmpty = {
    template: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
  };
  
  const IconSuccess = {
    template: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  };
  
  const IconWarning = {
    template: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 9v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
  };
  
  const IconError = {
    template: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M15 9l-6 6m0-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
  };
  
  const IconFatalError = {
    template: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 20h20L12 2z" fill="currentColor" opacity="0.1"/>
        <path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 9v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
  };
  
  const components: Record<string, any> = {
    IconLoading,
    IconEmpty,
    IconSuccess,
    IconWarning,
    IconError,
    IconFatalError,
  };
  
  return components[icons[props.state.type]] || IconEmpty;
}

function getTitle(): string {
  const titles: Record<string, string> = {
    loading: 'Loading',
    empty: 'No Data',
    success: 'Success',
    'partial-failure': 'Partial Success',
    'retryable-failure': 'Temporary Issue',
    'fatal-error': 'Error',
  };
  
  return titles[props.state.type] || 'Status';
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
}
</script>

<style scoped>
.state-message {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
  background-color: var(--color-white, #ffffff);
}

.state-message--compact {
  padding: 0.75rem;
}

.state-message--loading {
  border-color: var(--color-blue-300, #93c5fd);
  background-color: var(--color-blue-50, #eff6ff);
  color: var(--color-blue-900, #1e3a8a);
}

.state-message--empty {
  border-color: var(--color-gray-300, #d1d5db);
  background-color: var(--color-gray-50, #f9fafb);
  color: var(--color-gray-700, #374151);
}

.state-message--success {
  border-color: var(--color-green-300, #86efac);
  background-color: var(--color-green-50, #f0fdf4);
  color: var(--color-green-900, #14532d);
}

.state-message--partial-failure {
  border-color: var(--color-yellow-300, #fcd34d);
  background-color: var(--color-yellow-50, #fefce8);
  color: var(--color-yellow-900, #713f12);
}

.state-message--retryable-failure {
  border-color: var(--color-orange-300, #fdba74);
  background-color: var(--color-orange-50, #fff7ed);
  color: var(--color-orange-900, #7c2d12);
}

.state-message--fatal-error {
  border-color: var(--color-red-300, #fca5a5);
  background-color: var(--color-red-50, #fef2f2);
  color: var(--color-red-900, #7f1d1d);
}

.state-message-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.state-message-content {
  flex: 1;
  min-width: 0;
}

.state-message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.state-message-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.state-message-timestamp {
  font-size: 0.75rem;
  opacity: 0.7;
  white-space: nowrap;
}

.state-message-text {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
}

.state-message-guidance {
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.state-message-next-action {
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.state-message-retry {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.retry-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.state-message-details {
  margin-top: 0.75rem;
  font-size: 0.875rem;
}

.state-message-details summary {
  cursor: pointer;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  user-select: none;
}

.state-message-details summary:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.state-message-details summary:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.technical-details-content {
  margin: 0.5rem 0 0 0;
  padding: 0.75rem;
  background-color: var(--color-gray-900, #111827);
  color: var(--color-green-400, #4ade80);
  border-radius: 0.375rem;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .state-message {
    background-color: var(--color-gray-800, #1f2937);
  }
  
  .state-message-guidance {
    background-color: rgba(0, 0, 0, 0.2);
  }
}
</style>
