<template>
  <div class="flex items-center gap-1.5 flex-wrap">
    <!-- MICA Ready Badge -->
    <Tooltip v-if="complianceFlags.micaReady" position="top">
      <Badge variant="success" class="text-xs">
        <i class="pi pi-shield mr-1"></i>
        MICA Ready
      </Badge>
      <template #content>
        <div class="space-y-1">
          <div class="font-semibold">MICA Compliant</div>
          <div class="text-xs opacity-90">
            This token meets Markets in Crypto-Assets (MiCA) EU regulatory requirements.
            Suitable for European markets.
          </div>
        </div>
      </template>
    </Tooltip>

    <!-- Whitelist Required Badge -->
    <Tooltip v-if="complianceFlags.whitelistRequired" position="top">
      <Badge variant="warning" class="text-xs">
        <i class="pi pi-lock mr-1"></i>
        Whitelist
      </Badge>
      <template #content>
        <div class="space-y-1">
          <div class="font-semibold">Whitelist Required</div>
          <div class="text-xs opacity-90">
            Only whitelisted addresses can hold or transfer this token.
            Contact the issuer for whitelist approval.
          </div>
        </div>
      </template>
    </Tooltip>

    <!-- KYC Required Badge -->
    <Tooltip v-if="complianceFlags.kycRequired" position="top">
      <Badge variant="info" class="text-xs">
        <i class="pi pi-user-check mr-1"></i>
        KYC
      </Badge>
      <template #content>
        <div class="space-y-1">
          <div class="font-semibold">KYC Verification Required</div>
          <div class="text-xs opacity-90">
            Know Your Customer verification is required to hold or trade this token.
            Ensures regulatory compliance and anti-money laundering controls.
          </div>
        </div>
      </template>
    </Tooltip>

    <!-- Jurisdiction Restricted Badge -->
    <Tooltip v-if="complianceFlags.jurisdictionRestricted" position="top">
      <Badge variant="warning" class="text-xs">
        <i class="pi pi-globe mr-1"></i>
        Restricted
      </Badge>
      <template #content>
        <div class="space-y-1">
          <div class="font-semibold">Jurisdiction Restricted</div>
          <div class="text-xs opacity-90">
            This token may have geographic or regulatory restrictions.
            Transfers may be blocked based on jurisdiction rules.
          </div>
        </div>
      </template>
    </Tooltip>

    <!-- Transfer Restricted Badge -->
    <Tooltip v-if="complianceFlags.transferRestricted && !complianceFlags.whitelistRequired" position="top">
      <Badge variant="default" class="text-xs">
        <i class="pi pi-ban mr-1"></i>
        Controlled
      </Badge>
      <template #content>
        <div class="space-y-1">
          <div class="font-semibold">Transfer Controls Active</div>
          <div class="text-xs opacity-90">
            Token has issuer-controlled transfer restrictions.
            Issuer can freeze accounts or clawback tokens for compliance.
          </div>
        </div>
      </template>
    </Tooltip>

    <!-- No Compliance Flags (Unrestricted) -->
    <Tooltip v-if="!hasAnyFlags" position="top">
      <Badge variant="default" class="text-xs opacity-75">
        <i class="pi pi-check-circle mr-1"></i>
        Unrestricted
      </Badge>
      <template #content>
        <div class="space-y-1">
          <div class="font-semibold">No Compliance Restrictions</div>
          <div class="text-xs opacity-90">
            This token has no special compliance requirements or transfer restrictions.
            Can be freely transferred between any addresses.
          </div>
        </div>
      </template>
    </Tooltip>

    <!-- Additional Notes -->
    <Tooltip v-if="complianceFlags.notes && hasAnyFlags" position="top">
      <button class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <i class="pi pi-info-circle"></i>
      </button>
      <template #content>
        <div class="space-y-1">
          <div class="font-semibold">Additional Information</div>
          <div class="text-xs opacity-90">
            {{ complianceFlags.notes }}
          </div>
        </div>
      </template>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Badge from './ui/Badge.vue'
import Tooltip from './ui/Tooltip.vue'
import type { ComplianceFlags } from '../composables/useTokenMetadata'

interface Props {
  complianceFlags: ComplianceFlags
}

const props = defineProps<Props>()

const hasAnyFlags = computed(() => {
  return props.complianceFlags.micaReady ||
         props.complianceFlags.whitelistRequired ||
         props.complianceFlags.kycRequired ||
         props.complianceFlags.jurisdictionRestricted ||
         props.complianceFlags.transferRestricted
})
</script>
