<template>
  <div class="space-y-2">
    <label v-if="label" :for="selectId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1" aria-hidden="true">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      :aria-required="required ? 'true' : undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined"
      :class="selectClasses"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="typeof option === 'string' ? option : option.value"
        :value="typeof option === 'string' ? option : option.value"
      >
        {{ typeof option === 'string' ? option : option.label }}
      </option>
    </select>
    <p v-if="error" :id="`${selectId}-error`" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${selectId}-hint`" class="text-sm text-gray-600 dark:text-gray-400">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

interface Option {
  label: string
  value: string | number
}

interface Props {
  id?: string
  label?: string
  placeholder?: string
  modelValue?: string | number
  options: (string | Option)[]
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

const props = defineProps<Props>()

// Stable per-instance ID for aria-describedby linkage (Vue 3.5 useId).
const generatedId = useId()
const selectId = computed(() => props.id ?? generatedId)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectClasses = computed(() => {
  const base = 'block w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  if (props.error) {
    return `${base} border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`
  }
  
  if (props.disabled) {
    return `${base} border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed`
  }
  
  return `${base} border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`
})
</script>