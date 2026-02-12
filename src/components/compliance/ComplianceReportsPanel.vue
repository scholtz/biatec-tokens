<template>
  <div class="glass-effect rounded-xl p-6">
    <div class="flex items-start justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <i class="pi pi-file-pdf text-biatec-accent"></i>
          Compliance Reports
        </h2>
        <p class="text-sm text-gray-400 mt-1">Regulatory reports and compliance documentation</p>
      </div>
      <button
        @click="generateReport"
        :disabled="generating"
        class="px-4 py-2 bg-biatec-accent/20 hover:bg-biatec-accent/30 text-biatec-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        aria-label="Generate new compliance report"
      >
        <i :class="['pi', generating ? 'pi-spin pi-spinner' : 'pi-plus']"></i>
        <span class="text-sm">Generate Report</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
        <p class="text-gray-400">Loading compliance reports...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-3"></i>
      <h3 class="text-lg font-semibold text-red-400 mb-2">Failed to Load Reports</h3>
      <p class="text-sm text-gray-400 mb-4">{{ error }}</p>
      <button
        @click="loadReports"
        class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Reports List -->
    <div v-else-if="reports.length > 0" class="space-y-3">
      <div
        v-for="report in reports"
        :key="report.id"
        class="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all group"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <!-- Report Icon -->
              <div
                :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  reportIconClass(report.type)
                ]"
              >
                <i :class="['pi', reportIcon(report.type), 'text-xl']"></i>
              </div>

              <!-- Report Title & Meta -->
              <div class="flex-1">
                <h3 class="text-white font-medium mb-1">{{ report.title }}</h3>
                <div class="flex items-center gap-3 text-xs text-gray-400">
                  <span class="flex items-center gap-1">
                    <i class="pi pi-calendar"></i>
                    {{ formatPeriod(report.period) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <i class="pi pi-clock"></i>
                    {{ formatTimestamp(report.generatedAt) }}
                  </span>
                  <span v-if="report.size" class="flex items-center gap-1">
                    <i class="pi pi-file"></i>
                    {{ report.size }}
                  </span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      formatBadgeClass(report.format)
                    ]"
                  >
                    {{ report.format.toUpperCase() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Report Actions -->
          <div class="flex items-center gap-2">
            <!-- Status Indicators -->
            <div v-if="report.status === 'generating'" class="flex items-center gap-2 text-blue-400">
              <i class="pi pi-spin pi-spinner"></i>
              <span class="text-sm">Generating...</span>
            </div>

            <div v-else-if="report.status === 'failed'" class="flex items-center gap-2 text-red-400">
              <i class="pi pi-exclamation-triangle"></i>
              <span class="text-sm">Failed</span>
            </div>

            <!-- Download Button -->
            <button
              v-else-if="report.status === 'available'"
              @click="downloadReport(report)"
              :disabled="downloading === report.id"
              class="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              :aria-label="`Download ${report.title}`"
            >
              <i :class="['pi', downloading === report.id ? 'pi-spin pi-spinner' : 'pi-download']"></i>
              <span class="text-sm">Download</span>
            </button>
          </div>
        </div>

        <!-- Error Message for Failed Reports -->
        <div v-if="report.status === 'failed' && report.errorMessage" class="mt-3 bg-red-500/10 border border-red-500/30 rounded p-3">
          <p class="text-sm text-red-400">{{ report.errorMessage }}</p>
          <button
            @click="retryReport(report)"
            class="mt-2 text-sm text-red-400 hover:text-red-300 underline"
          >
            Retry Generation
          </button>
        </div>

        <!-- Progress Bar for Generating Reports -->
        <div v-if="report.status === 'generating'" class="mt-3">
          <div class="bg-white/10 rounded-full h-2 overflow-hidden">
            <div class="bg-blue-500 h-full animate-pulse" style="width: 60%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <i class="pi pi-file-excel text-4xl text-gray-500 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-400 mb-2">No Reports Available</h3>
      <p class="text-sm text-gray-500 mb-6">
        Generate your first compliance report to create regulatory documentation
        and audit evidence.
      </p>
      <button
        @click="generateReport"
        :disabled="generating"
        class="px-6 py-3 bg-biatec-accent/20 hover:bg-biatec-accent/30 text-biatec-accent rounded-lg transition-colors disabled:opacity-50"
      >
        <i :class="['pi', generating ? 'pi-spin pi-spinner' : 'pi-plus', 'mr-2']"></i>
        Generate First Report
      </button>
    </div>

    <!-- Info Box -->
    <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
        <div class="text-sm text-gray-300">
          <strong class="text-blue-400">About Compliance Reports</strong>
          <p class="mt-1">
            Compliance reports provide comprehensive documentation for regulatory audits, including
            whitelist status, transaction history, KYC/AML compliance, and MICA alignment. Reports
            are generated on-demand and include cryptographic signatures for verification.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ComplianceReport } from '../../types/compliance';

const props = defineProps<{
  tokenId?: string;
  network?: string;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const reports = ref<ComplianceReport[]>([]);
const generating = ref(false);
const downloading = ref<string | null>(null);

const loadReports = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock reports data
    reports.value = [
      {
        id: '1',
        title: 'Q1 2026 Compliance Report',
        type: 'quarterly',
        generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        period: {
          startDate: '2026-01-01',
          endDate: '2026-03-31',
        },
        status: 'available',
        format: 'pdf',
        size: '2.4 MB',
        downloadUrl: '/reports/q1-2026.pdf',
      },
      {
        id: '2',
        title: 'February 2026 Monthly Report',
        type: 'monthly',
        generatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        period: {
          startDate: '2026-02-01',
          endDate: '2026-02-28',
        },
        status: 'available',
        format: 'json',
        size: '450 KB',
        downloadUrl: '/reports/feb-2026.json',
      },
      {
        id: '3',
        title: 'January 2026 Monthly Report',
        type: 'monthly',
        generatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        period: {
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        },
        status: 'generating',
        format: 'csv',
      },
      {
        id: '4',
        title: 'MICA Readiness Audit',
        type: 'on_demand',
        generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        period: {
          startDate: '2026-01-01',
          endDate: '2026-02-12',
        },
        status: 'failed',
        format: 'pdf',
        errorMessage: 'Insufficient data: KYC provider integration incomplete',
      },
    ];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load compliance reports';
    console.error('Error loading reports:', err);
  } finally {
    loading.value = false;
  }
};

const generateReport = async () => {
  generating.value = true;

  try {
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Add new report in "generating" state
    const newReport: ComplianceReport = {
      id: `${reports.value.length + 1}`,
      title: 'On-Demand Compliance Report',
      type: 'on_demand',
      generatedAt: new Date().toISOString(),
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
      status: 'generating',
      format: 'pdf',
    };

    reports.value.unshift(newReport);

    // Simulate completion after delay
    setTimeout(() => {
      const report = reports.value.find(r => r.id === newReport.id);
      if (report) {
        report.status = 'available';
        report.size = '1.8 MB';
        report.downloadUrl = '/reports/on-demand.pdf';
      }
    }, 3000);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to generate report';
    console.error('Error generating report:', err);
  } finally {
    generating.value = false;
  }
};

const downloadReport = async (report: ComplianceReport) => {
  downloading.value = report.id;

  try {
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In real implementation, this would trigger file download
    console.log(`Downloading report: ${report.title}`);

    // For demo, just log the action
    alert(`Report "${report.title}" download started`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : `Failed to download report: ${report.title}`;
    console.error('Download error:', err);
  } finally {
    downloading.value = null;
  }
};

const retryReport = async (report: ComplianceReport) => {
  report.status = 'generating';
  report.errorMessage = undefined;

  // Simulate retry
  setTimeout(() => {
    // Randomly succeed or fail for demo
    const success = Math.random() > 0.5;
    report.status = success ? 'available' : 'failed';
    if (success) {
      report.size = '1.5 MB';
      report.downloadUrl = `/reports/${report.id}.pdf`;
    } else {
      report.errorMessage = 'Report generation timeout - please try again later';
    }
  }, 2000);
};

const reportIcon = (type: ComplianceReport['type']) => {
  switch (type) {
    case 'monthly':
      return 'pi-calendar';
    case 'quarterly':
      return 'pi-chart-bar';
    case 'annual':
      return 'pi-calendar-times';
    case 'on_demand':
      return 'pi-file-check';
    default:
      return 'pi-file';
  }
};

const reportIconClass = (type: ComplianceReport['type']) => {
  switch (type) {
    case 'monthly':
      return 'bg-blue-500/20 text-blue-400';
    case 'quarterly':
      return 'bg-purple-500/20 text-purple-400';
    case 'annual':
      return 'bg-green-500/20 text-green-400';
    case 'on_demand':
      return 'bg-yellow-500/20 text-yellow-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

const formatBadgeClass = (format: string) => {
  switch (format) {
    case 'pdf':
      return 'bg-red-500/20 text-red-400';
    case 'json':
      return 'bg-blue-500/20 text-blue-400';
    case 'csv':
      return 'bg-green-500/20 text-green-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

const formatPeriod = (period: { startDate: string; endDate: string }) => {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }
};

onMounted(() => {
  loadReports();
});
</script>
