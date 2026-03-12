<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <!-- Backdrop intercepts pointer/keyboard focus outside the dialog (WCAG SC 2.1.2) -->
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        role="presentation"
        @keydown.esc="closeModal"
      >
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            @click="closeModal"
          ></div>
          <Transition
            enter-active-class="duration-300 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <!--
              WCAG SC 4.1.2 Name, Role, Value:
              - role="dialog" exposes the element as a dialog to AT
              - aria-modal="true" tells AT not to traverse behind the overlay
              - aria-labelledby wires the title for screen-reader announcement
            -->
            <div
              v-if="show"
              ref="dialogEl"
              :class="modalSizeClass"
              class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full mx-4"
              role="dialog"
              aria-modal="true"
              :aria-labelledby="headerId"
              tabindex="-1"
            >
              <div v-if="$slots.header" class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <!-- Give the heading a stable ID so aria-labelledby can reference it -->
                  <div :id="headerId">
                    <slot name="header" />
                  </div>
                  <button
                    @click="closeModal"
                    aria-label="Close dialog"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="px-6 py-4">
                <slot />
              </div>
              <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, useId } from 'vue';

interface Props {
  show: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
});

const emit = defineEmits<{
  close: []
}>();

// Stable IDs for ARIA wiring (Vue 3.5 useId).
const uid = useId()
const headerId = `modal-header-${uid}`

// Ref to the dialog element for focus management.
const dialogEl = ref<HTMLElement | null>(null)

// Track the element that had focus before the dialog opened so we can restore
// it when the dialog closes (WCAG SC 2.4.3 Focus Order).
const previouslyFocused = ref<HTMLElement | null>(null)

watch(
  () => props.show,
  async (opened) => {
    if (opened) {
      previouslyFocused.value = document.activeElement as HTMLElement | null
      await nextTick()
      // Focus first focusable child, or the dialog itself as fallback.
      const focusable = dialogEl.value?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ;(focusable ?? dialogEl.value)?.focus()
    } else {
      previouslyFocused.value?.focus()
    }
  }
)

const modalSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-sm';
    case 'md':
      return 'max-w-md';
    case 'lg':
      return 'max-w-lg';
    case 'xl':
      return 'max-w-2xl';
    default:
      return 'max-w-md';
  }
});

const closeModal = () => {
  emit('close');
};
</script>