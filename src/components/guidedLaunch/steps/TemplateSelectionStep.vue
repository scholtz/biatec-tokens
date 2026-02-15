<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-white mb-2">Select Token Template</h2>
      <p class="text-gray-300">Choose a pre-configured template that matches your use case</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        v-for="template in templates"
        :key="template.id"
        @click="selectTemplate(template)"
        :class="[
          'p-6 rounded-lg border-2 text-left transition-all',
          selectedTemplate?.id === template.id
            ? 'border-blue-500 bg-blue-900/30'
            : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
        ]"
      >
        <div class="flex items-start justify-between mb-3">
          <h3 class="font-bold text-white text-lg">{{ template.name }}</h3>
          <Badge v-if="template.complianceLevel === 'mica_compliant'" variant="success" size="sm">MICA</Badge>
        </div>
        <p class="text-sm text-gray-300 mb-3">{{ template.description }}</p>
        <div class="flex flex-wrap gap-2 mb-3">
          <Badge variant="info" size="sm">{{ template.standard }}</Badge>
          <Badge variant="default" size="sm">{{ formatNetwork(template.network) }}</Badge>
        </div>
        <div class="text-xs text-gray-400">
          <strong>Recommended for:</strong> {{ template.recommendedFor.join(', ') }}
        </div>
      </button>
    </div>

    <Button
      @click="handleSubmit"
      variant="primary"
      size="lg"
      full-width
      :disabled="!selectedTemplate"
    >
      Continue to Economics Settings
      <i class="pi pi-arrow-right ml-2"></i>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGuidedLaunchStore } from '../../../stores/guidedLaunch'
import type { TokenTemplate, ValidationResult } from '../../../types/guidedLaunch'
import Button from '../../ui/Button.vue'
import Badge from '../../ui/Badge.vue'

const guidedLaunchStore = useGuidedLaunchStore()

const emit = defineEmits<{
  complete: [validation: ValidationResult]
  update: [template: TokenTemplate]
}>()

const templates = ref<TokenTemplate[]>([])
const selectedTemplate = ref<TokenTemplate | null>(null)

const formatNetwork = (network: string) => {
  return network.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const selectTemplate = (template: TokenTemplate) => {
  selectedTemplate.value = template
  emit('update', template)
}

const handleSubmit = () => {
  if (!selectedTemplate.value) return
  
  const validation: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }
  
  emit('complete', validation)
}

onMounted(() => {
  templates.value = guidedLaunchStore.getTemplates()
  const existing = guidedLaunchStore.currentForm.selectedTemplate
  if (existing) selectedTemplate.value = existing
})
</script>
