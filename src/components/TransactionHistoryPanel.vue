<template>
  <div class="transaction-history-panel">
    <div class="panel-header">
      <div class="header-content">
        <i class="pi pi-history text-2xl text-blue-400"></i>
        <div>
          <h3 class="text-lg font-semibold text-white">Transaction History</h3>
          <p class="text-sm text-gray-400">Monitor your recent blockchain transactions</p>
        </div>
      </div>
      <div class="header-actions">
        <button
          @click="handleRefresh"
          :disabled="isRefreshing"
          class="icon-button"
          aria-label="Refresh transaction history"
        >
          <i :class="isRefreshing ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        </button>
        <button
          @click="$emit('close')"
          class="icon-button"
          aria-label="Close transaction history"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label class="filter-label">Status:</label>
        <select v-model="statusFilter" class="filter-select">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Type:</label>
        <select v-model="typeFilter" class="filter-select">
          <option value="all">All</option>
          <option value="token_creation">Token Creation</option>
          <option value="token_transfer">Transfer</option>
          <option value="token_deployment">Deployment</option>
          <option value="network_switch">Network Switch</option>
        </select>
      </div>
    </div>

    <!-- Transaction List -->
    <div class="panel-content">
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-400 mb-4"></i>
        <p class="text-gray-400">Loading transactions...</p>
      </div>

      <div v-else-if="filteredTransactions.length === 0" class="empty-state">
        <i class="pi pi-inbox text-5xl text-gray-600 mb-4"></i>
        <h4 class="text-lg font-semibold text-gray-400 mb-2">No Transactions Found</h4>
        <p class="text-sm text-gray-500">
          {{ statusFilter !== 'all' || typeFilter !== 'all' 
            ? 'Try adjusting your filters' 
            : 'Your transactions will appear here once you start using the platform'
          }}
        </p>
      </div>

      <div v-else class="transaction-list">
        <div
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          class="transaction-item"
          @click="handleTransactionClick(transaction)"
          role="button"
          tabindex="0"
          @keydown.enter="handleTransactionClick(transaction)"
          @keydown.space.prevent="handleTransactionClick(transaction)"
        >
          <!-- Status Icon -->
          <div :class="['status-icon', `status-${transaction.status}`]">
            <i :class="getStatusIcon(transaction.status)" aria-hidden="true"></i>
          </div>

          <!-- Transaction Details -->
          <div class="transaction-details">
            <div class="transaction-header">
              <h4 class="transaction-type">{{ formatTransactionType(transaction.type) }}</h4>
              <span :class="['status-badge', `badge-${transaction.status}`]">
                {{ formatStatus(transaction.status) }}
              </span>
            </div>
            
            <div class="transaction-meta">
              <span class="meta-item">
                <i class="pi pi-calendar text-xs mr-1"></i>
                {{ formatTimestamp(transaction.timestamp) }}
              </span>
              <span v-if="transaction.network" class="meta-item">
                <i class="pi pi-server text-xs mr-1"></i>
                {{ transaction.network }}
              </span>
              <span v-if="transaction.amount" class="meta-item">
                <i class="pi pi-dollar text-xs mr-1"></i>
                {{ transaction.amount }}
              </span>
            </div>

            <!-- Transaction Hash -->
            <div v-if="transaction.hash" class="transaction-hash">
              <span class="hash-label">TX:</span>
              <span class="hash-value">{{ formatHash(transaction.hash) }}</span>
              <button
                @click.stop="copyHash(transaction.hash)"
                class="copy-button"
                aria-label="Copy transaction hash"
              >
                <i :class="copiedHash === transaction.hash ? 'pi pi-check' : 'pi pi-copy'"></i>
              </button>
            </div>

            <!-- Error Message -->
            <div v-if="transaction.status === 'failed' && transaction.error" class="error-message">
              <i class="pi pi-exclamation-circle text-xs mr-1"></i>
              <span>{{ transaction.error }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="transaction-actions">
            <a
              v-if="transaction.explorerUrl"
              :href="transaction.explorerUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
              class="action-link"
              aria-label="View on block explorer"
            >
              <i class="pi pi-external-link"></i>
            </a>
            <button
              v-if="transaction.status === 'pending'"
              @click.stop="handleCheckStatus(transaction)"
              class="action-button"
              aria-label="Check transaction status"
            >
              <i class="pi pi-refresh"></i>
            </button>
            <button
              v-if="transaction.status === 'failed'"
              @click.stop="handleRetry(transaction)"
              class="action-button retry"
              aria-label="Retry transaction"
            >
              <i class="pi pi-replay"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="previousPage"
        :disabled="currentPage === 1"
        class="pagination-button"
        aria-label="Previous page"
      >
        <i class="pi pi-chevron-left"></i>
      </button>
      <span class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="pagination-button"
        aria-label="Next page"
      >
        <i class="pi pi-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

export interface Transaction {
  id: string;
  type: 'token_creation' | 'token_transfer' | 'token_deployment' | 'network_switch' | 'other';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  hash?: string;
  network?: string;
  amount?: string;
  error?: string;
  explorerUrl?: string;
}

interface Props {
  transactions?: Transaction[];
  isLoading?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'refresh'): void;
  (e: 'transaction-click', transaction: Transaction): void;
  (e: 'check-status', transaction: Transaction): void;
  (e: 'retry', transaction: Transaction): void;
}

const props = withDefaults(defineProps<Props>(), {
  transactions: () => [],
  isLoading: false,
});

const emit = defineEmits<Emits>();

const statusFilter = ref<'all' | 'pending' | 'confirmed' | 'failed'>('all');
const typeFilter = ref<'all' | 'token_creation' | 'token_transfer' | 'token_deployment' | 'network_switch'>('all');
const currentPage = ref(1);
const itemsPerPage = 10;
const isRefreshing = ref(false);
const copiedHash = ref<string | null>(null);

// Filtered transactions
const filteredTransactions = computed(() => {
  let filtered = props.transactions;

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(tx => tx.status === statusFilter.value);
  }

  if (typeFilter.value !== 'all') {
    filtered = filtered.filter(tx => tx.type === typeFilter.value);
  }

  // Apply pagination
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filtered.slice(start, end);
});

// Total pages
const totalPages = computed(() => {
  let filtered = props.transactions;

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(tx => tx.status === statusFilter.value);
  }

  if (typeFilter.value !== 'all') {
    filtered = filtered.filter(tx => tx.type === typeFilter.value);
  }

  return Math.ceil(filtered.length / itemsPerPage);
});

// Get status icon
const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'pi pi-check-circle';
    case 'pending':
      return 'pi pi-spin pi-spinner';
    case 'failed':
      return 'pi pi-times-circle';
    default:
      return 'pi pi-circle';
  }
};

// Format transaction type
const formatTransactionType = (type: string): string => {
  const types: Record<string, string> = {
    token_creation: 'Token Creation',
    token_transfer: 'Token Transfer',
    token_deployment: 'Token Deployment',
    network_switch: 'Network Switch',
    other: 'Transaction',
  };
  return types[type] || 'Transaction';
};

// Format status
const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Format timestamp
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString();
};

// Format hash
const formatHash = (hash: string): string => {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};

// Copy hash to clipboard
const copyHash = async (hash: string) => {
  try {
    await navigator.clipboard.writeText(hash);
    copiedHash.value = hash;
    setTimeout(() => {
      copiedHash.value = null;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy hash:', error);
  }
};

// Handle refresh
const handleRefresh = async () => {
  isRefreshing.value = true;
  emit('refresh');
  setTimeout(() => {
    isRefreshing.value = false;
  }, 1000);
};

// Handle transaction click
const handleTransactionClick = (transaction: Transaction) => {
  emit('transaction-click', transaction);
};

// Handle check status
const handleCheckStatus = (transaction: Transaction) => {
  emit('check-status', transaction);
};

// Handle retry
const handleRetry = (transaction: Transaction) => {
  emit('retry', transaction);
};

// Pagination
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};
</script>

<style scoped>
.transaction-history-panel {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  max-width: 56rem;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filters-section {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.filter-label {
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
  white-space: nowrap;
}

.filter-select {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(59, 130, 246, 0.3);
}

.filter-select:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.transaction-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(4px);
}

.transaction-item:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.status-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  font-size: 1.25rem;
}

.status-icon.status-confirmed {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-icon.status-pending {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-icon.status-failed {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.transaction-details {
  flex: 1;
  min-width: 0;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.transaction-type {
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.badge-confirmed {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.badge-pending {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.badge-failed {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.transaction-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #9ca3af;
}

.transaction-hash {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.375rem;
}

.hash-label {
  color: #9ca3af;
  font-weight: 500;
}

.hash-value {
  color: #d1d5db;
  font-family: 'Courier New', monospace;
  flex: 1;
}

.copy-button {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.375rem;
  color: #fca5a5;
  font-size: 0.75rem;
}

.transaction-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.action-link,
.action-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-link:hover,
.action-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-button.retry {
  color: #f59e0b;
}

.action-button.retry:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.pagination-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.pagination-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* Scrollbar styling */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
