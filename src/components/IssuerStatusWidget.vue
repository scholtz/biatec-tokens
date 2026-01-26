<template>
  <MicaSummaryWidget
    title="Issuer Status"
    subtitle="Issuer verification and credentials"
    icon="pi pi-building"
    :icon-color="getIconColor"
    :last-updated="status?.lastUpdated"
    :has-details="true"
    @view-details="$emit('view-details')"
  >
    <template #content>
      <div v-if="isLoading" class="animate-pulse space-y-2">
        <div class="h-8 bg-white/5 rounded w-24"></div>
        <div class="h-4 bg-white/5 rounded w-32"></div>
      </div>

      <div v-else-if="error" class="text-sm text-red-400">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        {{ error }}
      </div>

      <div v-else-if="status" class="space-y-2">
        <div>
          <div class="text-sm text-gray-400">Status</div>
          <div class="text-2xl font-bold" :class="getStatusColor">
            {{ getStatusLabel }}
          </div>
        </div>

        <div v-if="status.legalName" class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Legal Name</span>
          <span class="text-white font-medium truncate ml-2" :title="status.legalName">
            {{ status.legalName }}
          </span>
        </div>

        <div v-if="status.jurisdiction" class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Jurisdiction</span>
          <span class="text-white font-medium">
            {{ status.jurisdiction }}
          </span>
        </div>

        <div v-if="status.regulatoryLicense" class="flex items-center justify-between text-sm">
          <span class="text-gray-400">License</span>
          <span class="text-white font-medium truncate ml-2" :title="status.regulatoryLicense">
            {{ status.regulatoryLicense }}
          </span>
        </div>

        <div v-if="status.missingFields && status.missingFields.length > 0" class="pt-2 border-t border-white/10">
          <div class="text-xs text-yellow-400 flex items-start gap-1">
            <i class="pi pi-info-circle mt-0.5"></i>
            <span>{{ status.missingFields.length }} field(s) need attention</span>
          </div>
        </div>

        <div v-else-if="status.verifiedAt" class="pt-2 border-t border-white/10">
          <div class="text-xs text-green-400 flex items-center gap-1">
            <i class="pi pi-check-circle"></i>
            <span>Verified {{ formatTimestamp(status.verifiedAt) }}</span>
          </div>
        </div>
      </div>

      <div v-else class="text-sm text-gray-400">
        No issuer data available
      </div>
    </template>
  </MicaSummaryWidget>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import MicaSummaryWidget from "./MicaSummaryWidget.vue";
import { complianceService } from "../services/ComplianceService";
import type { IssuerStatus } from "../types/compliance";

interface Props {
  issuerAddress: string;
}

const props = defineProps<Props>();

defineEmits<{
  "view-details": [];
}>();

const status = ref<IssuerStatus | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const getIconColor = computed(() => {
  if (!status.value) return "blue";
  switch (status.value.status) {
    case "verified":
      return "green";
    case "pending":
      return "yellow";
    case "incomplete":
      return "orange";
    case "rejected":
      return "orange";
    default:
      return "blue";
  }
});

const getStatusColor = computed(() => {
  if (!status.value) return "text-gray-400";
  switch (status.value.status) {
    case "verified":
      return "text-green-400";
    case "pending":
      return "text-yellow-400";
    case "incomplete":
      return "text-orange-400";
    case "rejected":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
});

const getStatusLabel = computed(() => {
  if (!status.value) return "Unknown";
  switch (status.value.status) {
    case "verified":
      return "Verified";
    case "pending":
      return "Pending Review";
    case "incomplete":
      return "Incomplete";
    case "rejected":
      return "Rejected";
    default:
      return "Unknown";
  }
});

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const loadStatus = async () => {
  if (!props.issuerAddress) return;

  isLoading.value = true;
  error.value = null;

  try {
    status.value = await complianceService.getIssuerStatus(props.issuerAddress);
    
    // Track analytics event
    if ((window as any).gtag) {
      (window as any).gtag("event", "compliance_widget_view", {
        widget_type: "issuer_status",
        issuer_address: props.issuerAddress,
      });
    }
  } catch (err) {
    console.error("Failed to load issuer status:", err);
    error.value = "Failed to load status";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadStatus();
});
</script>
