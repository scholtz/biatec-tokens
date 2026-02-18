<template>
  <div class="state-timeline" role="region" aria-label="Execution timeline">
    <div class="timeline-header">
      <h3 class="timeline-title">{{ title }}</h3>
      <p v-if="subtitle" class="timeline-subtitle">{{ subtitle }}</p>
    </div>
    
    <div class="timeline-container">
      <div
        v-for="(item, index) in timelineItems"
        :key="item.id"
        class="timeline-item"
        :class="[
          `timeline-item--${item.status}`,
          { 'timeline-item--current': item.isCurrent }
        ]"
        role="article"
        :aria-label="`Step ${index + 1}: ${item.title} - ${item.status}`"
      >
        <div class="timeline-indicator">
          <div class="timeline-dot" :aria-hidden="true"></div>
          <div v-if="index < timelineItems.length - 1" class="timeline-line"></div>
        </div>
        
        <div class="timeline-content">
          <div class="timeline-step-header">
            <span class="timeline-step-title">{{ item.title }}</span>
            <span class="timeline-step-timestamp" :aria-label="`Timestamp: ${formatTimestamp(item.timestamp)}`">
              {{ formatTimestamp(item.timestamp) }}
            </span>
          </div>
          
          <p class="timeline-step-message">{{ item.message }}</p>
          
          <div v-if="item.userGuidance" class="timeline-step-guidance">
            <span class="guidance-icon" aria-hidden="true">💡</span>
            <span>{{ item.userGuidance }}</span>
          </div>
          
          <div v-if="item.nextAction" class="timeline-step-action">
            <span class="action-icon" aria-hidden="true">➜</span>
            <span>{{ item.nextAction }}</span>
          </div>
          
          <button
            v-if="item.technicalDetails && !expandedItems[item.id]"
            @click="toggleExpand(item.id)"
            class="timeline-toggle-details"
            :aria-expanded="expandedItems[item.id] ? 'true' : 'false'"
            :aria-controls="`details-${item.id}`"
          >
            Show technical details
          </button>
          
          <div
            v-if="item.technicalDetails && expandedItems[item.id]"
            :id="`details-${item.id}`"
            class="timeline-technical-details"
            role="region"
            :aria-label="`Technical details for ${item.title}`"
          >
            <pre>{{ item.technicalDetails }}</pre>
            <button
              @click="toggleExpand(item.id)"
              class="timeline-toggle-details"
              :aria-expanded="'true'"
            >
              Hide technical details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface TimelineItem {
  id: string;
  title: string;
  message: string;
  userGuidance?: string;
  nextAction?: string;
  timestamp: string;
  status: 'pending' | 'in-progress' | 'success' | 'error' | 'warning';
  isCurrent?: boolean;
  technicalDetails?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  timelineItems: TimelineItem[];
}

defineProps<Props>();

const expandedItems = ref<Record<string, boolean>>({});

function toggleExpand(itemId: string): void {
  expandedItems.value[itemId] = !expandedItems.value[itemId];
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
}
</script>

<style scoped>
.state-timeline {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.timeline-header {
  margin-bottom: 1.5rem;
}

.timeline-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  margin: 0 0 0.5rem 0;
}

.timeline-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0;
}

.timeline-container {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  position: relative;
  padding-bottom: 2rem;
}

.timeline-item--current .timeline-content {
  border: 2px solid var(--color-primary, #3b82f6);
  background-color: var(--color-primary-light, #eff6ff);
}

.timeline-indicator {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-gray-300, #d1d5db);
  background-color: var(--color-white, #ffffff);
  z-index: 1;
}

.timeline-item--pending .timeline-dot {
  background-color: var(--color-gray-100, #f3f4f6);
  border-color: var(--color-gray-300, #d1d5db);
}

.timeline-item--in-progress .timeline-dot {
  background-color: var(--color-blue-500, #3b82f6);
  border-color: var(--color-blue-600, #2563eb);
  animation: pulse 2s infinite;
}

.timeline-item--success .timeline-dot {
  background-color: var(--color-green-500, #10b981);
  border-color: var(--color-green-600, #059669);
}

.timeline-item--error .timeline-dot {
  background-color: var(--color-red-500, #ef4444);
  border-color: var(--color-red-600, #dc2626);
}

.timeline-item--warning .timeline-dot {
  background-color: var(--color-yellow-500, #f59e0b);
  border-color: var(--color-yellow-600, #d97706);
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 2rem;
  background-color: var(--color-gray-200, #e5e7eb);
}

.timeline-item--in-progress .timeline-line,
.timeline-item--success .timeline-line {
  background-color: var(--color-blue-300, #93c5fd);
}

.timeline-content {
  flex: 1;
  background-color: var(--color-white, #ffffff);
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 0.5rem;
  padding: 1rem;
}

.timeline-step-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.timeline-step-title {
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
  font-size: 1rem;
}

.timeline-step-timestamp {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  white-space: nowrap;
}

.timeline-step-message {
  color: var(--color-text-primary, #374151);
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
}

.timeline-step-guidance,
.timeline-step-action {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

.timeline-step-guidance {
  background-color: var(--color-blue-50, #eff6ff);
  border: 1px solid var(--color-blue-200, #bfdbfe);
  color: var(--color-blue-900, #1e3a8a);
}

.timeline-step-action {
  background-color: var(--color-purple-50, #faf5ff);
  border: 1px solid var(--color-purple-200, #e9d5ff);
  color: var(--color-purple-900, #581c87);
}

.guidance-icon,
.action-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.timeline-toggle-details {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-gray-100, #f3f4f6);
  border: 1px solid var(--color-gray-300, #d1d5db);
  border-radius: 0.375rem;
  color: var(--color-gray-700, #374151);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.timeline-toggle-details:hover {
  background-color: var(--color-gray-200, #e5e7eb);
}

.timeline-toggle-details:focus {
  outline: 2px solid var(--color-blue-500, #3b82f6);
  outline-offset: 2px;
}

.timeline-technical-details {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-gray-50, #f9fafb);
  border: 1px solid var(--color-gray-200, #e5e7eb);
  border-radius: 0.375rem;
}

.timeline-technical-details pre {
  margin: 0;
  padding: 0.5rem;
  background-color: var(--color-gray-900, #111827);
  color: var(--color-green-400, #4ade80);
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .timeline-title {
    color: var(--color-text-primary, #f9fafb);
  }
  
  .timeline-content {
    background-color: var(--color-gray-800, #1f2937);
    border-color: var(--color-gray-700, #374151);
  }
  
  .timeline-item--current .timeline-content {
    background-color: var(--color-gray-800, #1f2937);
  }
  
  .timeline-step-title,
  .timeline-step-message {
    color: var(--color-text-primary, #f9fafb);
  }
}
</style>
