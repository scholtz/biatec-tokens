<template>
  <!-- Guided Escalation Flow Modal -->
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 bg-black/70"
      aria-hidden="true"
      @click="cancel"
    />

    <!-- Modal -->
    <div
      v-if="modelValue"
      :data-testid="ESCALATION_MODAL_TEST_IDS.MODAL"
      role="dialog"
      aria-modal="true"
      :aria-label="`Escalate case: ${item?.title ?? ''}`"
      aria-labelledby="escalation-modal-title"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div class="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        <!-- Header -->
        <header class="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-700">
          <div>
            <h2
              id="escalation-modal-title"
              class="text-lg font-semibold text-white"
            >
              Escalate Case
            </h2>
            <p class="text-sm text-gray-400 mt-1 truncate max-w-xs">{{ item?.title }}</p>
          </div>
          <button
            :data-testid="ESCALATION_MODAL_TEST_IDS.CLOSE_BTN"
            class="flex-shrink-0 text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded p-1"
            aria-label="Close escalation dialog"
            @click="cancel"
          >
            <XMarkIcon class="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <!-- Confirmation banner (post-submit) -->
        <div
          v-if="submitted"
          :data-testid="ESCALATION_MODAL_TEST_IDS.CONFIRMATION_BANNER"
          role="status"
          aria-live="polite"
          class="px-6 py-5 flex flex-col items-center justify-center gap-4 flex-1"
        >
          <div class="w-14 h-14 rounded-full bg-green-800 flex items-center justify-center">
            <CheckCircleIcon class="w-7 h-7 text-green-300" aria-hidden="true" />
          </div>
          <div class="text-center">
            <p class="text-white font-semibold text-base">Escalation submitted</p>
            <p class="text-gray-400 text-sm mt-1">
              This case has been marked for escalation to
              <strong class="text-white">{{ selectedOption?.suggestedDestination }}</strong>.
            </p>
            <p v-if="note.trim()" class="text-gray-500 text-xs mt-2 italic">"{{ note }}"</p>
          </div>
          <button
            class="mt-2 px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            @click="cancel"
          >
            Close
          </button>
        </div>

        <!-- Form -->
        <div v-else class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <!-- Intro text -->
          <p class="text-sm text-gray-300 leading-relaxed">
            Select a reason for escalation. The system will record the escalation and route
            it to the appropriate team. Adding a structured note helps the recipient act quickly.
          </p>

          <!-- Reason selector -->
          <div>
            <label
              for="escalation-reason"
              class="block text-sm font-medium text-white mb-2"
            >
              Escalation Reason <span class="text-red-400" aria-hidden="true">*</span>
            </label>
            <select
              id="escalation-reason"
              v-model="selectedReason"
              :data-testid="ESCALATION_MODAL_TEST_IDS.REASON_SELECT"
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-required="true"
              :aria-describedby="selectedReason ? 'escalation-reason-desc' : undefined"
            >
              <option
                v-for="option in options"
                :key="option.reason"
                :value="option.reason"
                :data-testid="ESCALATION_MODAL_TEST_IDS.REASON_OPTION"
              >
                {{ option.label }}{{ option.isDefault ? ' (Suggested)' : '' }}
              </option>
            </select>
          </div>

          <!-- Reason description -->
          <div
            v-if="selectedOption"
            id="escalation-reason-desc"
            class="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-3"
          >
            <p
              :data-testid="ESCALATION_MODAL_TEST_IDS.REASON_DESCRIPTION"
              class="text-sm text-gray-300"
            >
              {{ selectedOption.description }}
            </p>
            <p
              :data-testid="ESCALATION_MODAL_TEST_IDS.DESTINATION_DISPLAY"
              class="text-xs text-teal-300 mt-2"
            >
              Suggested recipient:
              <strong>{{ selectedOption.suggestedDestination }}</strong>
            </p>
          </div>

          <!-- Note textarea -->
          <div>
            <label
              for="escalation-note"
              class="block text-sm font-medium text-white mb-2"
            >
              Escalation Note <span class="text-gray-500 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              id="escalation-note"
              v-model="note"
              :data-testid="ESCALATION_MODAL_TEST_IDS.NOTE_INPUT"
              rows="3"
              maxlength="500"
              placeholder="Add context for the receiving team (e.g., investor responded but documents are expired, or AML provider returned an inconclusive result)."
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              aria-label="Escalation note"
            />
            <p class="text-xs text-gray-600 mt-1 text-right">{{ note.length }}/500</p>
          </div>

        </div>

        <!-- Footer actions -->
        <footer
          v-if="!submitted"
          class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0"
        >
          <button
            :data-testid="ESCALATION_MODAL_TEST_IDS.CANCEL_BTN"
            class="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            :data-testid="ESCALATION_MODAL_TEST_IDS.SUBMIT_BTN"
            :disabled="!selectedReason"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            :aria-disabled="!selectedReason"
            @click="submit"
          >
            <ArrowUpRightIcon class="w-4 h-4" aria-hidden="true" />
            Submit Escalation
          </button>
        </footer>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XMarkIcon, ArrowUpRightIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import {
  ESCALATION_MODAL_TEST_IDS,
  buildEscalationOptions,
  getDefaultEscalationReason,
  type EscalationReason,
  type EscalationOption,
} from '../../utils/caseDrillDown'
import type { WorkItem } from '../../utils/complianceOperationsCockpit'

// ---------------------------------------------------------------------------
// Props / emits
// ---------------------------------------------------------------------------

const props = defineProps<{
  modelValue: boolean
  item: WorkItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: [payload: { item: WorkItem; reason: EscalationReason; note: string; destination: string }]
}>()

// ---------------------------------------------------------------------------
// Local state
// ---------------------------------------------------------------------------

const selectedReason = ref<EscalationReason>('other')
const note = ref('')
const submitted = ref(false)

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const options = computed<EscalationOption[]>(() =>
  props.item ? buildEscalationOptions(props.item) : [],
)

const selectedOption = computed<EscalationOption | undefined>(() =>
  options.value.find((o) => o.reason === selectedReason.value),
)

// Reset state when item changes or modal opens
watch(
  () => [props.item, props.modelValue] as const,
  ([newItem, open]) => {
    if (open && newItem) {
      selectedReason.value = getDefaultEscalationReason(newItem)
      note.value = ''
      submitted.value = false
    }
  },
  { immediate: true },
)

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function submit() {
  if (!props.item || !selectedReason.value) return
  emit('submitted', {
    item: props.item,
    reason: selectedReason.value,
    note: note.value.trim(),
    destination: selectedOption.value?.suggestedDestination ?? 'Operations Lead',
  })
  submitted.value = true
}

function cancel() {
  submitted.value = false
  emit('update:modelValue', false)
}
</script>
