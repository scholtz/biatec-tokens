<template>
  <WizardStep
    title="Token Metadata & Media"
    description="Add metadata and media assets to enrich your token's presentation."
    :validation-errors="errors"
    :show-errors="showErrors"
    help-text="Metadata makes your token more discoverable and trustworthy. Add images, descriptions, and custom attributes."
  >
    <div class="space-y-6">
      <!-- Metadata Input Mode Toggle -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-file-edit text-biatec-accent"></i>
          Metadata Input Method
        </h4>
        <p class="text-sm text-gray-400 mb-4">
          Choose how you'd like to provide metadata for your token.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="inputMode = 'guided'"
            :class="[
              'p-4 rounded-lg border-2 transition-all duration-200',
              inputMode === 'guided'
                ? 'border-biatec-accent bg-biatec-accent/5'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            ]"
          >
            <div class="flex items-start gap-3">
              <i :class="['pi pi-check-circle text-xl mt-1', inputMode === 'guided' ? 'text-biatec-accent' : 'text-gray-600']"></i>
              <div class="text-left">
                <h5 class="text-md font-bold text-gray-900 dark:text-white mb-1">Guided Form</h5>
                <p class="text-sm text-gray-400">Step-by-step form to enter metadata fields</p>
              </div>
            </div>
          </button>

          <button
            @click="inputMode = 'json'"
            :class="[
              'p-4 rounded-lg border-2 transition-all duration-200',
              inputMode === 'json'
                ? 'border-biatec-accent bg-biatec-accent/5'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            ]"
          >
            <div class="flex items-start gap-3">
              <i :class="['pi pi-check-circle text-xl mt-1', inputMode === 'json' ? 'text-biatec-accent' : 'text-gray-600']"></i>
              <div class="text-left">
                <h5 class="text-md font-bold text-gray-900 dark:text-white mb-1">JSON Editor</h5>
                <p class="text-sm text-gray-400">Paste or edit metadata JSON directly</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Guided Form Mode -->
      <div v-if="inputMode === 'guided'" class="space-y-6">
        <!-- Token Image -->
        <div class="glass-effect rounded-xl p-6 border border-white/10">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i class="pi pi-image text-biatec-accent"></i>
            Token Image
          </h4>
          <p class="text-sm text-gray-400 mb-4">
            Add an image URL for your token. This will be displayed in wallets and marketplaces.
          </p>

          <Input
            id="image-url"
            v-model="formData.imageUrl"
            label="Image URL"
            placeholder="https://example.com/token-image.png"
            :error="fieldErrors.imageUrl"
            hint="Must be a valid HTTPS URL pointing to an image (PNG, JPG, GIF, or SVG)"
          />

          <!-- Image Preview -->
          <div v-if="formData.imageUrl && isValidImageUrl" class="mt-4">
            <p class="text-xs text-gray-500 mb-2">Preview:</p>
            <div class="w-32 h-32 border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
              <img
                :src="formData.imageUrl"
                alt="Token image preview"
                class="w-full h-full object-cover"
                @error="handleImageError"
                @load="handleImageLoad"
              />
            </div>
          </div>
        </div>

        <!-- Token Description -->
        <div class="glass-effect rounded-xl p-6 border border-white/10">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i class="pi pi-align-left text-biatec-accent"></i>
            Token Description
          </h4>
          <p class="text-sm text-gray-400 mb-4">
            Provide a detailed description of your token for users and investors.
          </p>

          <div class="space-y-2">
            <label for="token-description" class="block text-sm font-medium text-gray-900 dark:text-white">
              Description
            </label>
            <textarea
              id="token-description"
              v-model="formData.description"
              rows="5"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              placeholder="Describe your token, its purpose, and how it will be used..."
              :class="{ 'border-red-500': fieldErrors.description }"
            ></textarea>
            <p v-if="fieldErrors.description" class="text-sm text-red-400">{{ fieldErrors.description }}</p>
            <p class="text-xs text-gray-500">
              {{ formData.description.length }} / 1000 characters
            </p>
          </div>
        </div>

        <!-- Token Attributes -->
        <div class="glass-effect rounded-xl p-6 border border-white/10">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i class="pi pi-tags text-biatec-accent"></i>
            Custom Attributes
          </h4>
          <p class="text-sm text-gray-400 mb-4">
            Add custom attributes to your token metadata (optional). These can include properties like category, version, or any custom data.
          </p>

          <div class="space-y-3">
            <div
              v-for="(attr, index) in formData.attributes"
              :key="index"
              class="flex gap-3 items-start"
            >
              <Input
                :id="`attr-key-${index}`"
                v-model="attr.trait_type"
                placeholder="Attribute name"
                class="flex-1"
                :error="attributeErrors[index]?.trait_type"
              />
              <Input
                :id="`attr-value-${index}`"
                v-model="attr.value"
                placeholder="Attribute value"
                class="flex-1"
                :error="attributeErrors[index]?.value"
              />
              <button
                @click="removeAttribute(index)"
                class="mt-2 p-2 text-red-400 hover:text-red-300 transition-colors"
                :aria-label="`Remove attribute ${index + 1}`"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>

            <button
              @click="addAttribute"
              class="w-full py-2 px-4 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-biatec-accent hover:border-biatec-accent transition-colors flex items-center justify-center gap-2"
            >
              <i class="pi pi-plus"></i>
              Add Attribute
            </button>
          </div>
        </div>

        <!-- External URL -->
        <div class="glass-effect rounded-xl p-6 border border-white/10">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i class="pi pi-external-link text-biatec-accent"></i>
            External URL
          </h4>
          <p class="text-sm text-gray-400 mb-4">
            Provide a link to your project's website or landing page (optional).
          </p>

          <Input
            id="external-url"
            v-model="formData.url"
            label="Website URL"
            placeholder="https://yourproject.com"
            :error="fieldErrors.url"
            hint="This URL will be displayed alongside your token"
          />
        </div>
      </div>

      <!-- JSON Editor Mode -->
      <div v-else-if="inputMode === 'json'" class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-code text-biatec-accent"></i>
          JSON Metadata Editor
        </h4>
        <p class="text-sm text-gray-400 mb-4">
          Paste or edit your token metadata in JSON format. The schema will be validated automatically.
        </p>

        <div class="space-y-4">
          <div class="space-y-2">
            <label for="json-input" class="block text-sm font-medium text-gray-900 dark:text-white">
              Metadata JSON
            </label>
            <textarea
              id="json-input"
              v-model="jsonInput"
              rows="15"
              class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 font-mono text-sm placeholder-gray-500 focus:ring-2 focus:ring-biatec-accent focus:border-transparent transition-all"
              placeholder='{\n  "name": "My Token",\n  "description": "Token description",\n  "image": "https://...",\n  "properties": {}\n}'
              :class="{ 'border-red-500': jsonError }"
              @input="validateJson"
            ></textarea>
            <div v-if="jsonError" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p class="text-sm text-red-400">
                <i class="pi pi-exclamation-circle mr-2"></i>
                {{ jsonError }}
              </p>
            </div>
            <div v-else-if="jsonValid && jsonInput.trim()" class="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p class="text-sm text-green-400">
                <i class="pi pi-check-circle mr-2"></i>
                Valid JSON metadata
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Metadata Preview -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-eye text-biatec-accent"></i>
          Metadata Preview
        </h4>
        <p class="text-sm text-gray-400 mb-4">
          Preview how your token metadata will appear to users.
        </p>

        <div class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <pre class="text-sm text-gray-300 overflow-x-auto">{{ metadataPreview }}</pre>
        </div>

        <button
          @click="copyMetadata"
          class="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <i class="pi pi-copy"></i>
          Copy Metadata JSON
        </button>
      </div>
    </div>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTokenDraftStore } from '../../../stores/tokenDraft'
import WizardStep from '../WizardStep.vue'
import Input from '../../ui/Input.vue'

const tokenDraftStore = useTokenDraftStore()

// Input mode
const inputMode = ref<'guided' | 'json'>('guided')
const jsonInput = ref('')
const jsonError = ref('')
const jsonValid = ref(false)
const showErrors = ref(false)

// Form data
const formData = ref({
  imageUrl: '',
  description: '',
  url: '',
  attributes: [] as Array<{ trait_type: string; value: string }>,
})

// Field errors
const fieldErrors = ref<Record<string, string>>({})
const attributeErrors = ref<Array<Record<string, string>>>([])

// Image validation
const isValidImageUrl = ref(false)

// Computed
const errors = computed(() => {
  const errs: string[] = []
  if (fieldErrors.value.imageUrl) errs.push(fieldErrors.value.imageUrl)
  if (fieldErrors.value.description) errs.push(fieldErrors.value.description)
  if (fieldErrors.value.url) errs.push(fieldErrors.value.url)
  if (jsonError.value) errs.push(jsonError.value)
  return errs
})

const metadataPreview = computed(() => {
  if (inputMode.value === 'json' && jsonValid.value && jsonInput.value) {
    try {
      return JSON.stringify(JSON.parse(jsonInput.value), null, 2)
    } catch {
      return '{}'
    }
  }

  const metadata: any = {
    name: tokenDraftStore.currentDraft?.name || 'Token Name',
    symbol: tokenDraftStore.currentDraft?.symbol || 'TOKEN',
    description: formData.value.description || '',
  }

  if (formData.value.imageUrl) {
    metadata.image = formData.value.imageUrl
  }

  if (formData.value.url) {
    metadata.external_url = formData.value.url
  }

  if (formData.value.attributes.length > 0) {
    metadata.attributes = formData.value.attributes.filter(
      attr => attr.trait_type && attr.value
    )
  }

  return JSON.stringify(metadata, null, 2)
})

const isValid = computed(() => {
  if (inputMode.value === 'json') {
    return jsonValid.value && jsonInput.value.trim() !== ''
  }

  // Guided mode: at least description or image required
  return !!(formData.value.description || formData.value.imageUrl)
})

// Methods
const validateField = (field: string, value: string): string => {
  switch (field) {
    case 'imageUrl':
      if (value && !value.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        return 'Please provide a valid image URL (HTTPS recommended)'
      }
      break
    case 'url':
      if (value && !value.match(/^https?:\/\/.+/i)) {
        return 'Please provide a valid URL'
      }
      break
    case 'description':
      if (value && value.length > 1000) {
        return 'Description must be less than 1000 characters'
      }
      break
  }
  return ''
}

const validateAll = () => {
  showErrors.value = true
  fieldErrors.value = {}

  if (inputMode.value === 'guided') {
    const imageError = validateField('imageUrl', formData.value.imageUrl)
    const urlError = validateField('url', formData.value.url)
    const descError = validateField('description', formData.value.description)

    if (imageError) fieldErrors.value.imageUrl = imageError
    if (urlError) fieldErrors.value.url = urlError
    if (descError) fieldErrors.value.description = descError

    // Validate attributes
    attributeErrors.value = formData.value.attributes.map(attr => {
      const errors: Record<string, string> = {}
      if (attr.trait_type && !attr.value) {
        errors.value = 'Value is required'
      }
      if (attr.value && !attr.trait_type) {
        errors.trait_type = 'Name is required'
      }
      return errors
    })
  } else {
    validateJson()
  }

  return isValid.value
}

const validateJson = () => {
  if (!jsonInput.value.trim()) {
    jsonError.value = 'JSON metadata is required'
    jsonValid.value = false
    return
  }

  try {
    const parsed = JSON.parse(jsonInput.value)
    
    // Basic schema validation
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      jsonError.value = 'Metadata must be a JSON object'
      jsonValid.value = false
      return
    }

    jsonError.value = ''
    jsonValid.value = true
  } catch (e: any) {
    jsonError.value = `Invalid JSON: ${e.message}`
    jsonValid.value = false
  }
}

const handleImageError = () => {
  isValidImageUrl.value = false
  fieldErrors.value.imageUrl = 'Failed to load image. Please check the URL.'
}

const handleImageLoad = () => {
  isValidImageUrl.value = true
  delete fieldErrors.value.imageUrl
}

const addAttribute = () => {
  formData.value.attributes.push({ trait_type: '', value: '' })
}

const removeAttribute = (index: number) => {
  formData.value.attributes.splice(index, 1)
  attributeErrors.value.splice(index, 1)
}

const copyMetadata = async () => {
  try {
    await navigator.clipboard.writeText(metadataPreview.value)
    console.log('[MetadataStep] Metadata copied to clipboard')
  } catch (error) {
    console.error('[MetadataStep] Failed to copy metadata:', error)
  }
}

const saveToDraft = () => {
  if (!tokenDraftStore.currentDraft) return

  const updatedDraft = {
    ...tokenDraftStore.currentDraft,
    imageUrl: formData.value.imageUrl,
    description: formData.value.description,
    url: formData.value.url,
    attributes: formData.value.attributes.filter(
      attr => attr.trait_type && attr.value
    ),
  }

  tokenDraftStore.saveDraft(updatedDraft)
}

// Watch for changes to save to draft
watch(formData, () => {
  saveToDraft()
}, { deep: true })

watch(inputMode, (newMode) => {
  if (newMode === 'json') {
    // Populate JSON from form data
    jsonInput.value = metadataPreview.value
    validateJson()
  } else {
    // Parse JSON back to form if valid
    if (jsonValid.value && jsonInput.value) {
      try {
        const parsed = JSON.parse(jsonInput.value)
        if (parsed.image) formData.value.imageUrl = parsed.image
        if (parsed.description) formData.value.description = parsed.description
        if (parsed.external_url) formData.value.url = parsed.external_url
        if (parsed.attributes) formData.value.attributes = parsed.attributes
      } catch {
        // Ignore parsing errors when switching modes
      }
    }
  }
})

// Load from draft on mount
onMounted(() => {
  const draft = tokenDraftStore.currentDraft
  if (draft) {
    formData.value.imageUrl = draft.imageUrl || ''
    formData.value.description = draft.description || ''
    formData.value.url = draft.url || ''
    formData.value.attributes = draft.attributes || []
  }
})

// Expose for parent
defineExpose({
  isValid,
  validateAll,
})
</script>

<style scoped>
/* Additional styles if needed */
</style>
