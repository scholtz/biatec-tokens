<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div class="glass-effect rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-semibold text-white flex items-center gap-2">
            <i class="pi pi-verified text-biatec-accent"></i>
            Attestation Details
          </h3>
          <p class="text-sm text-gray-400 mt-1">ID: {{ attestation.id }}</p>
        </div>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-white transition-colors p-2"
        >
          <i class="pi pi-times text-xl"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-6">
          <!-- Status Badge -->
          <div class="flex items-center gap-4">
            <span
              :class="getStatusClass(attestation.status)"
              class="px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {{ attestation.status.toUpperCase() }}
            </span>
            <span class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
              {{ getAttestationTypeLabel(attestation.type) }}
            </span>
            <span :class="getNetworkClass(attestation.network)" class="px-3 py-1 rounded text-sm font-medium">
              {{ attestation.network }}
            </span>
          </div>

          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Wallet Address
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p class="text-white font-mono text-sm break-all">
                    {{ attestation.walletAddress }}
                  </p>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Asset ID
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p class="text-white font-mono text-sm break-all">
                    {{ attestation.assetId }}
                  </p>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Issuer
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p class="text-white text-sm">
                    {{ attestation.issuerName }}
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Created At
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p class="text-white text-sm">
                    {{ formatDate(attestation.createdAt) }}
                  </p>
                </div>
              </div>

              <div v-if="attestation.verifiedAt">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Verified At
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p class="text-white text-sm">
                    {{ formatDate(attestation.verifiedAt) }}
                  </p>
                </div>
              </div>

              <div v-if="attestation.verifiedBy">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Verified By
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p class="text-white text-sm">
                    {{ attestation.verifiedBy }}
                  </p>
                </div>
              </div>

              <div v-if="attestation.expiresAt">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Expires At
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p class="text-white text-sm">
                    {{ formatDate(attestation.expiresAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Proof Metadata -->
          <div v-if="attestation.proofHash || attestation.documentUrl">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i class="pi pi-shield-check text-biatec-accent"></i>
              Proof Metadata
            </h4>
            <div class="space-y-4">
              <div v-if="attestation.proofHash">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Proof Hash
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p class="text-white font-mono text-sm break-all">
                    {{ attestation.proofHash }}
                  </p>
                </div>
              </div>

              <div v-if="attestation.documentUrl">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Document URL
                </label>
                <div class="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                  <p class="text-white text-sm truncate flex-1">
                    {{ attestation.documentUrl }}
                  </p>
                  <a
                    :href="attestation.documentUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ml-2 text-biatec-accent hover:text-biatec-accent/80 transition-colors"
                  >
                    <i class="pi pi-external-link"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Verification Status -->
          <div>
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i class="pi pi-check-circle text-biatec-accent"></i>
              Verification Status
            </h4>
            <div class="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
              <div class="flex items-start gap-3">
                <i
                  :class="[
                    'pi text-xl',
                    attestation.status === 'verified'
                      ? 'pi-check-circle text-green-400'
                      : attestation.status === 'pending'
                      ? 'pi-clock text-yellow-400'
                      : 'pi-times-circle text-red-400'
                  ]"
                ></i>
                <div>
                  <p class="text-white font-medium">
                    {{ getVerificationMessage(attestation.status) }}
                  </p>
                  <p class="text-sm text-gray-400 mt-1">
                    {{ getVerificationDescription(attestation.status, attestation.type) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="attestation.notes">
            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Notes
            </label>
            <div class="p-4 bg-white/5 rounded-lg border border-white/10">
              <p class="text-white text-sm whitespace-pre-wrap">
                {{ attestation.notes }}
              </p>
            </div>
          </div>

          <!-- Metadata -->
          <div v-if="attestation.metadata && Object.keys(attestation.metadata).length > 0">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i class="pi pi-info-circle text-biatec-accent"></i>
              Additional Metadata
            </h4>
            <div class="p-4 bg-white/5 rounded-lg border border-white/10">
              <pre class="text-white text-sm overflow-auto">{{ JSON.stringify(attestation.metadata, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-4 border-t border-white/10 flex items-center justify-between">
        <div class="text-sm text-gray-400">
          Last updated: {{ formatDate(attestation.createdAt) }}
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="handleExportAttestation"
            class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <i class="pi pi-download"></i>
            Export
          </button>
          <button
            @click="handleClose"
            class="px-4 py-2 bg-biatec-accent hover:bg-biatec-accent/80 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AttestationType } from '../types/compliance'
import { getAttestationTypeLabel } from '../utils/attestation'
import type { AttestationListItem } from '../stores/attestations'

interface Props {
  attestation: AttestationListItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}

const handleExportAttestation = () => {
  const data = JSON.stringify(props.attestation, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `attestation-${props.attestation.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'verified':
      return 'bg-green-500/20 text-green-400 border border-green-500/50'
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border border-red-500/50'
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
  }
}

const getNetworkClass = (network: string) => {
  switch (network) {
    case 'VOI':
      return 'bg-purple-500/20 text-purple-400'
    case 'Aramid':
      return 'bg-cyan-500/20 text-cyan-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

const getVerificationMessage = (status: string) => {
  switch (status) {
    case 'verified':
      return 'Attestation Verified'
    case 'pending':
      return 'Verification Pending'
    case 'rejected':
      return 'Attestation Rejected'
    default:
      return 'Status Unknown'
  }
}

const getVerificationDescription = (status: string, type: AttestationType) => {
  const typeLabel = getAttestationTypeLabel(type)
  
  switch (status) {
    case 'verified':
      return `This ${typeLabel} attestation has been successfully verified and is compliant with MICA requirements.`
    case 'pending':
      return `This ${typeLabel} attestation is awaiting verification. Further documentation may be required.`
    case 'rejected':
      return `This ${typeLabel} attestation was rejected. Please review the notes for more information.`
    default:
      return `The verification status of this ${typeLabel} attestation is unknown.`
  }
}
</script>
