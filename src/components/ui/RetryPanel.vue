<template>
  <div
    class="retry-panel"
    :class="`retry-panel--${severity}`"
    role="alert"
    aria-live="polite"
  >
    <div class="retry-panel-header">
      <div class="retry-icon" aria-hidden="true">
        <svg
          v-if="severity === 'error'"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M15 9l-6 6m0-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <svg
          v-else
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 9v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      
      <div class="retry-panel-title-section">
        <h3 class="retry-panel-title">{{ title }}</h3>
        <p class="retry-panel-subtitle">{{ subtitle }}</p>
      </div>
    </div>
    
    <div class="retry-panel-content">
      <p class="retry-panel-message">{{ message }}</p>
      
      <div v-if="userGuidance" class="retry-panel-guidance">
        <strong>What to do:</strong> {{ userGuidance }}
      </div>
      
      <div v-if="context" class="retry-panel-context">
        <details class="context-details">
          <summary>What you were trying to do</summary>
          <div class="context-content">
            <p v-if="context.action"><strong>Action:</strong> {{ context.action }}</p>
            <p v-if="context.data"><strong>Data:</strong> {{ context.data }}</p>
            <p v-if="context.step"><strong>Step:</strong> {{ context.step }}</p>
          </div>
        </details>
      </div>
      
      <div v-if="retryStrategy" class="retry-panel-strategy">
        <div class="strategy-info">
          <div class="strategy-attempts">
            <span class="strategy-label">Attempts:</span>
            <span class="strategy-value">
              {{ retryStrategy.currentAttempt }} of {{ retryStrategy.maxAttempts }}
            </span>
          </div>
          
          <div v-if="retryStrategy.retryAfterMs" class="strategy-wait">
            <span class="strategy-label">Wait time:</span>
            <span class="strategy-value">
              {{ formatDuration(retryStrategy.retryAfterMs) }}
            </span>
          </div>
        </div>
        
        <div v-if="!retryStrategy.canRetryNow" class="strategy-warning">
          ⚠️ Maximum retry attempts reached. Please contact support if the issue persists.
        </div>
      </div>
    </div>
    
    <div class="retry-panel-actions">
      <button
        v-if="canRetry"
        @click="$emit('retry')"
        class="retry-button"
        :disabled="isRetrying || (retryStrategy && !retryStrategy.canRetryNow)"
        :aria-busy="isRetrying ? 'true' : 'false'"
      >
        <span v-if="isRetrying" class="button-spinner" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" opacity="0.25"/>
            <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
        <span>{{ isRetrying ? 'Retrying...' : 'Try Again' }}</span>
      </button>
      
      <button
        v-if="showCancel"
        @click="$emit('cancel')"
        class="cancel-button"
        :disabled="isRetrying"
      >
        Cancel
      </button>
      
      <button
        v-if="showContactSupport"
        @click="$emit('contact-support')"
        class="support-button"
      >
        Contact Support
      </button>
    </div>
    
    <details v-if="technicalDetails" class="retry-panel-technical">
      <summary>Technical details (for support)</summary>
      <pre class="technical-content">{{ technicalDetails }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { RetryStrategy } from '../../utils/deterministicStateManager';

export interface RetryContext {
  action?: string;
  data?: string;
  step?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  message: string;
  userGuidance?: string;
  context?: RetryContext;
  retryStrategy?: RetryStrategy;
  canRetry?: boolean;
  isRetrying?: boolean;
  showCancel?: boolean;
  showContactSupport?: boolean;
  technicalDetails?: string;
  severity?: 'warning' | 'error';
}

withDefaults(defineProps<Props>(), {
  canRetry: true,
  isRetrying: false,
  showCancel: false,
  showContactSupport: false,
  severity: 'warning',
});

defineEmits<{
  retry: [];
  cancel: [];
  'contact-support': [];
}>();

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
}
</script>

<style scoped>
.retry-panel {
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 2px solid;
}

.retry-panel--warning {
  background-color: var(--color-yellow-50, #fefce8);
  border-color: var(--color-yellow-400, #facc15);
  color: var(--color-yellow-900, #713f12);
}

.retry-panel--error {
  background-color: var(--color-red-50, #fef2f2);
  border-color: var(--color-red-400, #f87171);
  color: var(--color-red-900, #7f1d1d);
}

.retry-panel-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.retry-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.retry-panel-title-section {
  flex: 1;
}

.retry-panel-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.retry-panel-subtitle {
  font-size: 0.875rem;
  opacity: 0.8;
  margin: 0;
}

.retry-panel-content {
  margin-bottom: 1.5rem;
}

.retry-panel-message {
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.retry-panel-guidance {
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.retry-panel-context {
  margin-bottom: 1rem;
}

.context-details summary {
  cursor: pointer;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  font-size: 0.875rem;
  user-select: none;
}

.context-details summary:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.context-details summary:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.context-content {
  padding: 0.75rem 0 0 0;
  font-size: 0.875rem;
}

.context-content p {
  margin: 0.5rem 0;
}

.retry-panel-strategy {
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.strategy-info {
  display: flex;
  gap: 2rem;
  margin-bottom: 0.5rem;
}

.strategy-attempts,
.strategy-wait {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.strategy-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.strategy-value {
  font-size: 0.875rem;
  font-weight: 600;
}

.strategy-warning {
  padding: 0.75rem;
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: 0.25rem;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

.retry-panel-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.retry-button,
.cancel-button,
.support-button {
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
}

.retry-button {
  background-color: var(--color-blue-600, #2563eb);
  color: white;
}

.retry-button:hover:not(:disabled) {
  background-color: var(--color-blue-700, #1d4ed8);
}

.retry-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.retry-button:focus {
  outline: 2px solid var(--color-blue-500, #3b82f6);
  outline-offset: 2px;
}

.button-spinner {
  display: inline-flex;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cancel-button {
  background-color: var(--color-gray-200, #e5e7eb);
  color: var(--color-gray-700, #374151);
}

.cancel-button:hover:not(:disabled) {
  background-color: var(--color-gray-300, #d1d5db);
}

.support-button {
  background-color: var(--color-purple-600, #9333ea);
  color: white;
}

.support-button:hover {
  background-color: var(--color-purple-700, #7e22ce);
}

.retry-panel-technical {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.retry-panel-technical summary {
  cursor: pointer;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  user-select: none;
}

.retry-panel-technical summary:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.technical-content {
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
  .retry-panel--warning {
    background-color: var(--color-yellow-900, #713f12);
    color: var(--color-yellow-100, #fef3c7);
  }
  
  .retry-panel--error {
    background-color: var(--color-red-900, #7f1d1d);
    color: var(--color-red-100, #fee2e2);
  }
}
</style>
