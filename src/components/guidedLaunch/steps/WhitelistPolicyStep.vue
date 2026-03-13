<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="text-center mb-6">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-900/50 mb-4">
        <ShieldCheckIcon class="w-7 h-7 text-blue-400" aria-hidden="true" />
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">Whitelist Policy</h2>
      <p class="text-gray-300">
        Define who may hold or receive your token. These rules run before any transfer
        and are managed on your behalf — no blockchain expertise required.
      </p>
    </div>

    <!-- Enable / Disable Toggle -->
    <Card variant="glass" padding="md">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-white" id="whitelist-enable-label">
            Enable transfer restrictions
          </h3>
          <p class="text-sm text-gray-400 mt-1">
            When enabled, only participants who meet your policy rules can hold this token.
            If disabled, the token is freely transferable with no access controls.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="isEnabled"
          aria-labelledby="whitelist-enable-label"
          data-testid="whitelist-enable-toggle"
          @click="toggleEnabled"
          :class="[
            'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            isEnabled ? 'bg-blue-600' : 'bg-gray-600',
          ]"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              isEnabled ? 'translate-x-5' : 'translate-x-0',
            ]"
          ></span>
        </button>
      </div>

      <!-- Info when disabled -->
      <div v-if="!isEnabled" class="mt-4 rounded-lg bg-blue-900/20 border border-blue-700/30 p-3 text-sm text-blue-300">
        <InformationCircleIcon class="w-4 h-4 inline mr-1 -mt-0.5" aria-hidden="true" />
        With no restrictions active, anyone can receive or hold this token. You can add restrictions
        later from the Compliance Dashboard after launch.
      </div>
    </Card>

    <!-- Policy sections shown only when enabled -->
    <template v-if="isEnabled">
      <!-- Allowed Jurisdictions -->
      <Card variant="glass" padding="md">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-base font-semibold text-white">
              Allowed jurisdictions
              <span class="ml-2 text-xs font-normal text-gray-400">(optional)</span>
            </h3>
            <p class="text-sm text-gray-400 mt-0.5">
              If you add countries here, only participants from those countries may hold the token.
              Leave empty to allow all countries not explicitly restricted below.
            </p>
          </div>
        </div>

        <!-- Jurisdiction search -->
        <div class="flex gap-2 mb-3">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              v-model="allowedSearch"
              type="text"
              placeholder="Search countries…"
              aria-label="Search countries to allow"
              data-testid="allowed-jurisdiction-search"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              @keydown.enter.prevent="addFirstAllowedMatch"
            />
          </div>
        </div>

        <!-- Search results dropdown -->
        <ul
          v-if="allowedSearch.trim() && filteredAllowedOptions.length"
          role="listbox"
          aria-label="Countries matching your search"
          class="mb-3 rounded-lg border border-gray-700 bg-gray-800 divide-y divide-gray-700 max-h-48 overflow-y-auto"
        >
          <li
            v-for="country in filteredAllowedOptions"
            :key="country.code"
            role="option"
            :aria-selected="false"
            class="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-700 text-sm"
            @click="addAllowedJurisdiction(country)"
          >
            <span class="text-white">{{ country.name }}</span>
            <span class="text-gray-400 font-mono text-xs">{{ country.code }}</span>
          </li>
        </ul>
        <p
          v-else-if="allowedSearch.trim() && !filteredAllowedOptions.length"
          class="text-sm text-gray-500 mb-3"
        >
          No countries found for "{{ allowedSearch }}"
        </p>

        <!-- Selected allowed jurisdictions -->
        <div v-if="allowedJurisdictions.length" class="flex flex-wrap gap-2">
          <span
            v-for="j in allowedJurisdictions"
            :key="j.code"
            class="inline-flex items-center gap-1.5 rounded-full bg-green-900/40 border border-green-700/50 px-3 py-1 text-sm text-green-300"
            :data-testid="`allowed-tag-${j.code}`"
          >
            {{ j.name }}
            <button
              type="button"
              :aria-label="`Remove ${j.name} from allowed jurisdictions`"
              class="rounded-full hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              @click="removeAllowedJurisdiction(j.code)"
            >
              <XMarkIcon class="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
        <p v-else class="text-sm text-gray-500 italic">No countries added — all countries permitted unless restricted below.</p>
      </Card>

      <!-- Restricted Jurisdictions -->
      <Card variant="glass" padding="md">
        <div class="mb-3">
          <h3 class="text-base font-semibold text-white">
            Restricted jurisdictions
            <span class="ml-2 text-xs font-normal text-gray-400">(optional)</span>
          </h3>
          <p class="text-sm text-gray-400 mt-0.5">
            Participants from these countries will never be able to hold this token,
            even if they meet other requirements.
          </p>
        </div>

        <!-- Jurisdiction search -->
        <div class="flex gap-2 mb-3">
          <div class="relative flex-1">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              v-model="restrictedSearch"
              type="text"
              placeholder="Search countries…"
              aria-label="Search countries to restrict"
              data-testid="restricted-jurisdiction-search"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              @keydown.enter.prevent="addFirstRestrictedMatch"
            />
          </div>
        </div>

        <!-- Search results dropdown -->
        <ul
          v-if="restrictedSearch.trim() && filteredRestrictedOptions.length"
          role="listbox"
          aria-label="Countries matching your search"
          class="mb-3 rounded-lg border border-gray-700 bg-gray-800 divide-y divide-gray-700 max-h-48 overflow-y-auto"
        >
          <li
            v-for="country in filteredRestrictedOptions"
            :key="country.code"
            role="option"
            :aria-selected="false"
            class="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-700 text-sm"
            @click="addRestrictedJurisdiction(country)"
          >
            <span class="text-white">{{ country.name }}</span>
            <span class="text-gray-400 font-mono text-xs">{{ country.code }}</span>
          </li>
        </ul>
        <p
          v-else-if="restrictedSearch.trim() && !filteredRestrictedOptions.length"
          class="text-sm text-gray-500 mb-3"
        >
          No countries found for "{{ restrictedSearch }}"
        </p>

        <!-- Selected restricted jurisdictions -->
        <div v-if="restrictedJurisdictions.length" class="flex flex-wrap gap-2">
          <span
            v-for="j in restrictedJurisdictions"
            :key="j.code"
            class="inline-flex items-center gap-1.5 rounded-full bg-red-900/40 border border-red-700/50 px-3 py-1 text-sm text-red-300"
            :data-testid="`restricted-tag-${j.code}`"
          >
            {{ j.name }}
            <button
              type="button"
              :aria-label="`Remove ${j.name} from restricted jurisdictions`"
              class="rounded-full hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              @click="removeRestrictedJurisdiction(j.code)"
            >
              <XMarkIcon class="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
        <p v-else class="text-sm text-gray-500 italic">No countries restricted — all countries permitted unless explicitly allowed above.</p>
      </Card>

      <!-- Contradiction warning -->
      <div
        v-if="contradictions.length"
        role="alert"
        aria-live="polite"
        data-testid="jurisdiction-contradiction-warning"
        class="rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-4 space-y-1"
      >
        <p class="text-sm font-semibold text-yellow-400 flex items-center gap-2">
          <ExclamationTriangleIcon class="w-4 h-4" aria-hidden="true" />
          Contradictory jurisdiction rules detected
        </p>
        <p class="text-sm text-yellow-300">
          The following countries appear in both the allowed and restricted lists.
          A country cannot be both allowed and restricted — please remove them from one list.
        </p>
        <ul class="text-sm text-yellow-200 list-disc list-inside mt-1">
          <li v-for="c in contradictions" :key="c.code">{{ c.name }} ({{ c.code }})</li>
        </ul>
      </div>

      <!-- Investor Qualification Categories -->
      <Card variant="glass" padding="md">
        <div class="mb-4">
          <h3 class="text-base font-semibold text-white">
            Investor qualification requirements
            <span class="ml-2 text-xs font-normal text-gray-400">(optional)</span>
          </h3>
          <p class="text-sm text-gray-400 mt-0.5">
            Select the investor categories that participants must belong to in order to hold this token.
            Leave all unchecked to impose no qualification requirement.
          </p>
        </div>
        <fieldset>
          <legend class="sr-only">Investor qualification categories</legend>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              v-for="cat in INVESTOR_CATEGORY_OPTIONS"
              :key="cat.value"
              class="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3 cursor-pointer hover:border-blue-600 transition-colors"
              :class="investorCategories.includes(cat.value) ? 'border-blue-600 bg-blue-900/20' : ''"
            >
              <input
                type="checkbox"
                :value="cat.value"
                :checked="investorCategories.includes(cat.value)"
                :aria-describedby="`cat-desc-${cat.value}`"
                class="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-900"
                :data-testid="`category-${cat.value}`"
                @change="toggleCategory(cat.value)"
              />
              <div class="min-w-0">
                <div class="text-sm font-medium text-white">{{ cat.label }}</div>
                <div :id="`cat-desc-${cat.value}`" class="text-xs text-gray-400 mt-0.5">{{ cat.description }}</div>
              </div>
            </label>
          </div>
        </fieldset>
      </Card>

      <!-- Policy Notes -->
      <Card variant="glass" padding="md">
        <h3 class="text-base font-semibold text-white mb-2">
          Compliance notes
          <span class="ml-2 text-xs font-normal text-gray-400">(optional)</span>
        </h3>
        <p class="text-sm text-gray-400 mb-3">
          Add any context about why these rules were chosen. This note is for your compliance team's reference and does not affect enforcement.
        </p>
        <textarea
          v-model="policyNotes"
          rows="3"
          placeholder="e.g. Restricted from US due to SEC regulation. EU accredited investors only per MiFID II."
          aria-label="Compliance notes"
          data-testid="policy-notes"
          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          maxlength="500"
        ></textarea>
        <p class="text-xs text-gray-500 mt-1 text-right">{{ policyNotes.length }} / 500</p>
      </Card>

      <!-- Policy Effect Summary -->
      <Card
        variant="elevated"
        padding="md"
        class="border-2"
        :class="contradictions.length ? 'border-yellow-600' : 'border-blue-600/50'"
        data-testid="policy-summary"
      >
        <h3 class="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <ClipboardDocumentCheckIcon class="w-5 h-5 text-blue-400" aria-hidden="true" />
          Policy effect summary
        </h3>
        <ul class="space-y-2 text-sm">
          <li v-for="line in policySummaryLines" :key="line" class="flex items-start gap-2 text-gray-300">
            <CheckCircleIcon class="w-4 h-4 text-green-400 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{{ line }}</span>
          </li>
        </ul>

        <!-- Policy confirmation checkbox -->
        <div class="mt-4 pt-4 border-t border-gray-700">
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="policyConfirmed"
              aria-describedby="policy-confirm-desc"
              data-testid="policy-confirm-checkbox"
              class="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-900"
            />
            <div>
              <span class="text-sm font-medium text-white">
                I have reviewed the policy effects above and confirm they match my compliance intent
              </span>
              <p id="policy-confirm-desc" class="text-xs text-gray-400 mt-0.5">
                You can update these rules from the Compliance Dashboard at any time after launch.
              </p>
            </div>
          </label>
          <!-- Error when user tries to continue without confirming -->
          <p
            v-show="showConfirmError"
            role="alert"
            data-testid="policy-confirm-error"
            class="mt-2 text-sm text-red-400"
          >
            Please review and confirm the policy summary before continuing.
          </p>
        </div>
      </Card>
    </template>

    <!-- Continue Button -->
    <div class="pt-4 flex justify-end">
      <Button
        variant="primary"
        size="lg"
        :disabled="!canContinue"
        data-testid="whitelist-continue-button"
        @click="handleContinue"
      >
        <CheckIcon class="w-5 h-5 mr-2" aria-hidden="true" />
        Save &amp; Continue
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline'
import Card from '../../ui/Card.vue'
import Button from '../../ui/Button.vue'
import type { WhitelistPolicy, JurisdictionPolicyEntry, InvestorCategory, ValidationResult } from '../../../types/guidedLaunch'
import { useGuidedLaunchStore } from '../../../stores/guidedLaunch'

// ---------------------------------------------------------------------------
// Emit interface
// ---------------------------------------------------------------------------
const emit = defineEmits<{
  complete: [validation: ValidationResult]
  update: [policy: WhitelistPolicy]
}>()

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
const store = useGuidedLaunchStore()

// ---------------------------------------------------------------------------
// Country reference data
// ---------------------------------------------------------------------------
interface CountryOption {
  code: string
  name: string
}

const COUNTRIES: CountryOption[] = [
  { code: 'AD', name: 'Andorra' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AT', name: 'Austria' },
  { code: 'AU', name: 'Australia' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CN', name: 'China' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DE', name: 'Germany' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'ES', name: 'Spain' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HR', name: 'Croatia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IN', name: 'India' },
  { code: 'IR', name: 'Iran' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KY', name: 'Cayman Islands' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'LV', name: 'Latvia' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ZA', name: 'South Africa' },
]

// ---------------------------------------------------------------------------
// Investor category options
// ---------------------------------------------------------------------------
const INVESTOR_CATEGORY_OPTIONS: { value: InvestorCategory; label: string; description: string }[] = [
  {
    value: 'accredited_investor',
    label: 'Accredited investor',
    description: 'Meets minimum income or net worth thresholds (SEC / ESMA definition)',
  },
  {
    value: 'professional_investor',
    label: 'Professional investor',
    description: 'Classified as professional under MiFID II or equivalent local law',
  },
  {
    value: 'qualified_purchaser',
    label: 'Qualified purchaser',
    description: 'Holds $5M+ in investments under US Investment Company Act definition',
  },
  {
    value: 'retail_investor',
    label: 'Retail investor',
    description: 'No additional qualification required — open to general public',
  },
  {
    value: 'institutional_investor',
    label: 'Institutional investor',
    description: 'Banks, funds, insurance companies, and other regulated entities',
  },
  {
    value: 'employees_only',
    label: 'Employees only',
    description: 'Restricted to current employees of the issuing organisation',
  },
  {
    value: 'partners_only',
    label: 'Partners / business associates',
    description: 'Restricted to verified business partners or affiliates',
  },
]

// ---------------------------------------------------------------------------
// Local state
// ---------------------------------------------------------------------------
const isEnabled = ref(false)
const allowedJurisdictions = ref<JurisdictionPolicyEntry[]>([])
const restrictedJurisdictions = ref<JurisdictionPolicyEntry[]>([])
const investorCategories = ref<InvestorCategory[]>([])
const policyNotes = ref('')
const policyConfirmed = ref(false)
const allowedSearch = ref('')
const restrictedSearch = ref('')
const showConfirmError = ref(false)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

/** Countries that can be added to the allowed list (not already in either list) */
const filteredAllowedOptions = computed(() => {
  const q = allowedSearch.value.trim().toLowerCase()
  if (!q) return []
  const alreadyAdded = new Set([
    ...allowedJurisdictions.value.map(j => j.code),
    ...restrictedJurisdictions.value.map(j => j.code),
  ])
  return COUNTRIES.filter(
    c =>
      !alreadyAdded.has(c.code) &&
      (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)),
  ).slice(0, 8)
})

/** Countries that can be added to the restricted list (not already in either list) */
const filteredRestrictedOptions = computed(() => {
  const q = restrictedSearch.value.trim().toLowerCase()
  if (!q) return []
  const alreadyAdded = new Set([
    ...allowedJurisdictions.value.map(j => j.code),
    ...restrictedJurisdictions.value.map(j => j.code),
  ])
  return COUNTRIES.filter(
    c =>
      !alreadyAdded.has(c.code) &&
      (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)),
  ).slice(0, 8)
})

/** Countries that appear in both allowed and restricted (contradiction) */
const contradictions = computed(() => {
  const allowedCodes = new Set(allowedJurisdictions.value.map(j => j.code))
  return restrictedJurisdictions.value.filter(j => allowedCodes.has(j.code))
})

/** Human-readable lines explaining the active policy */
const policySummaryLines = computed(() => {
  const lines: string[] = []

  if (!isEnabled.value) {
    lines.push('No transfer restrictions — the token is freely transferable.')
    return lines
  }

  if (allowedJurisdictions.value.length > 0) {
    const names = allowedJurisdictions.value.map(j => j.name).join(', ')
    lines.push(`Participants must be located in: ${names}.`)
  } else {
    lines.push('All countries are permitted unless explicitly restricted below.')
  }

  if (restrictedJurisdictions.value.length > 0) {
    const names = restrictedJurisdictions.value.map(j => j.name).join(', ')
    lines.push(`Participants from the following countries are blocked: ${names}.`)
  }

  if (investorCategories.value.length > 0) {
    const labels = investorCategories.value.map(v => {
      const opt = INVESTOR_CATEGORY_OPTIONS.find(o => o.value === v)
      return opt ? opt.label : v
    })
    lines.push(`Participants must qualify as: ${labels.join(' or ')}.`)
  } else {
    lines.push('No investor qualification requirement.')
  }

  if (policyNotes.value.trim()) {
    lines.push(`Compliance note: "${policyNotes.value.trim()}"`)
  }

  return lines
})

/** Whether the step can be submitted */
const canContinue = computed(() => {
  if (!isEnabled.value) return true
  if (contradictions.value.length > 0) return false
  return policyConfirmed.value
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const buildPolicy = (): WhitelistPolicy => ({
  isEnabled: isEnabled.value,
  allowedJurisdictions: allowedJurisdictions.value,
  restrictedJurisdictions: restrictedJurisdictions.value,
  investorCategories: investorCategories.value,
  policyNotes: policyNotes.value.trim() || undefined,
  policyConfirmed: policyConfirmed.value,
})

const emitUpdate = () => {
  emit('update', buildPolicy())
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
const toggleEnabled = () => {
  isEnabled.value = !isEnabled.value
  emitUpdate()
}

const addAllowedJurisdiction = (country: CountryOption) => {
  allowedJurisdictions.value.push({ code: country.code, name: country.name })
  allowedSearch.value = ''
  emitUpdate()
}

const removeAllowedJurisdiction = (code: string) => {
  allowedJurisdictions.value = allowedJurisdictions.value.filter(j => j.code !== code)
  emitUpdate()
}

const addFirstAllowedMatch = () => {
  if (filteredAllowedOptions.value.length) {
    addAllowedJurisdiction(filteredAllowedOptions.value[0])
  }
}

const addRestrictedJurisdiction = (country: CountryOption) => {
  restrictedJurisdictions.value.push({ code: country.code, name: country.name })
  restrictedSearch.value = ''
  emitUpdate()
}

const removeRestrictedJurisdiction = (code: string) => {
  restrictedJurisdictions.value = restrictedJurisdictions.value.filter(j => j.code !== code)
  emitUpdate()
}

const addFirstRestrictedMatch = () => {
  if (filteredRestrictedOptions.value.length) {
    addRestrictedJurisdiction(filteredRestrictedOptions.value[0])
  }
}

const toggleCategory = (value: InvestorCategory) => {
  const idx = investorCategories.value.indexOf(value)
  if (idx >= 0) {
    investorCategories.value.splice(idx, 1)
  } else {
    investorCategories.value.push(value)
  }
  emitUpdate()
}

const handleContinue = () => {
  // If disabled — step is always valid
  if (!isEnabled.value) {
    const policy = buildPolicy()
    store.setWhitelistPolicy(policy)
    emit('complete', { isValid: true, errors: [], warnings: [] })
    return
  }

  // Contradiction check
  if (contradictions.value.length) {
    showConfirmError.value = false
    return
  }

  // Confirmation required
  if (!policyConfirmed.value) {
    showConfirmError.value = true
    return
  }

  showConfirmError.value = false
  const policy = buildPolicy()
  store.setWhitelistPolicy(policy)
  emit('complete', { isValid: true, errors: [], warnings: [] })
}

// ---------------------------------------------------------------------------
// Lifecycle: restore from draft
// ---------------------------------------------------------------------------
onMounted(() => {
  const saved = store.currentForm.whitelistPolicy
  if (!saved) return

  isEnabled.value = saved.isEnabled
  allowedJurisdictions.value = saved.allowedJurisdictions ?? []
  restrictedJurisdictions.value = saved.restrictedJurisdictions ?? []
  investorCategories.value = saved.investorCategories ?? []
  policyNotes.value = saved.policyNotes ?? ''
  policyConfirmed.value = saved.policyConfirmed ?? false
})
</script>
