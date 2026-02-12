<template>
  <Modal :show="show" @close="handleClose" size="xl">
    <template #header>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Import Whitelist Entries from CSV</h3>
    </template>

    <div class="space-y-6">
      <!-- Progress Steps -->
      <div class="flex items-center justify-center mb-8">
        <div class="flex items-center w-full max-w-2xl">
          <!-- Step 1 -->
          <div class="flex flex-col items-center">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
              currentStep > 1 ? 'bg-blue-600 text-white' : currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            ]">
              <i v-if="currentStep > 1" class="pi pi-check"></i>
              <span v-else>1</span>
            </div>
            <span :class="[
              'text-xs mt-2',
              currentStep === 1 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            ]">
              Upload File
            </span>
          </div>
          <div class="flex-1 h-1 mx-2" :class="currentStep > 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'"></div>
          <!-- Step 2 -->
          <div class="flex flex-col items-center">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
              currentStep > 2 ? 'bg-blue-600 text-white' : currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            ]">
              <i v-if="currentStep > 2" class="pi pi-check"></i>
              <span v-else>2</span>
            </div>
            <span :class="[
              'text-xs mt-2',
              currentStep === 2 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            ]">
              Validate
            </span>
          </div>
          <div class="flex-1 h-1 mx-2" :class="currentStep > 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'"></div>
          <!-- Step 3 -->
          <div class="flex flex-col items-center">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
              currentStep > 3 ? 'bg-blue-600 text-white' : currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            ]">
              <i v-if="currentStep > 3" class="pi pi-check"></i>
              <span v-else>3</span>
            </div>
            <span :class="[
              'text-xs mt-2',
              currentStep === 3 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            ]">
              Import
            </span>
          </div>
        </div>
      </div>

      <!-- Step 1: File Upload -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          :class="[
            'border-2 border-dashed rounded-xl p-12 text-center transition-all',
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          ]"
        >
          <i class="pi pi-cloud-upload text-6xl text-gray-400 dark:text-gray-500 mb-4"></i>
          <p class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Drag & drop your CSV file here
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">or</p>
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            @change="handleFileSelect"
            class="hidden"
          />
          <Button variant="primary" @click="triggerFileSelect">
            <i class="pi pi-folder-open mr-2"></i>
            Browse Files
          </Button>
        </div>

        <div v-if="selectedFile" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div class="flex items-center">
            <i class="pi pi-file text-blue-600 dark:text-blue-400 text-2xl mr-3"></i>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedFile.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" @click="removeFile">
            <i class="pi pi-times text-red-600"></i>
          </Button>
        </div>

        <!-- CSV Format Help -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">CSV Format Requirements:</h4>
          <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>Required columns: name, email, entityType, jurisdictionCode, riskLevel</li>
            <li>Optional columns: walletAddress, organizationName, notes</li>
            <li>Entity types: individual, institutional, corporate, trust, other</li>
            <li>Risk levels: low, medium, high, critical</li>
            <li>Use ISO 3166-1 alpha-2 codes for jurisdiction (e.g., US, GB, DE)</li>
          </ul>
        </div>
      </div>

      <!-- Step 2: Validation Preview -->
      <div v-if="currentStep === 2" class="space-y-4">
        <div v-if="isValidating" class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Validating CSV file...</p>
        </div>

        <div v-else-if="validationResult">
          <!-- Validation Summary -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rows</span>
                <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ validationResult.totalRows }}</span>
              </div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-green-600 dark:text-green-400">Valid Rows</span>
                <span class="text-2xl font-bold text-green-900 dark:text-green-300">{{ validationResult.validRows }}</span>
              </div>
            </div>
            <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-red-600 dark:text-red-400">Error Rows</span>
                <span class="text-2xl font-bold text-red-900 dark:text-red-300">{{ validationResult.errorRows }}</span>
              </div>
            </div>
          </div>

          <!-- Error List -->
          <div v-if="validationResult.errors.length > 0" class="mb-6">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Validation Errors:</h4>
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-h-60 overflow-y-auto">
              <div
                v-for="error in validationResult.errors"
                :key="`${error.row}-${error.field}`"
                class="px-4 py-3 border-b border-red-200 dark:border-red-800 last:border-b-0"
              >
                <div class="flex items-start">
                  <i class="pi pi-exclamation-circle text-red-600 dark:text-red-400 mt-0.5 mr-2"></i>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-red-900 dark:text-red-300">
                      Row {{ error.row }}, Field: {{ error.field }}
                    </p>
                    <p class="text-sm text-red-700 dark:text-red-400">{{ error.message }}</p>
                    <p class="text-xs text-red-600 dark:text-red-500 mt-1">Value: "{{ error.value }}"</p>
                  </div>
                  <Badge :variant="error.severity === 'error' ? 'error' : 'warning'" size="sm">
                    {{ error.severity }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <!-- Preview Table -->
          <div>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Preview (first 10 valid entries):</h4>
            <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Row</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entity</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jurisdiction</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr
                    v-for="entry in validationResult.preview.slice(0, 10)"
                    :key="entry.row"
                    :class="entry.hasErrors ? 'bg-red-50 dark:bg-red-900/10' : ''"
                  >
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ entry.row }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ entry.name }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ entry.email }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ entry.entityType }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ entry.jurisdictionCode }}</td>
                    <td class="px-4 py-3 text-sm">
                      <Badge :variant="entry.hasErrors ? 'error' : 'success'" size="sm">
                        {{ entry.hasErrors ? 'Error' : 'Valid' }}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Import Options -->
      <div v-if="currentStep === 3" class="space-y-6">
        <div v-if="isImporting" class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Importing entries...</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {{ importProgress }}% complete
          </p>
        </div>

        <div v-else-if="importResult" class="space-y-6">
          <!-- Import Success -->
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <i class="pi pi-check-circle text-6xl text-green-600 dark:text-green-400 mb-4"></i>
            <h3 class="text-xl font-bold text-green-900 dark:text-green-300 mb-2">Import Complete!</h3>
            <p class="text-green-700 dark:text-green-400">
              Successfully imported {{ importResult.successCount }} entries
            </p>
          </div>

          <!-- Import Summary -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Processed</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ importResult.totalProcessed }}</p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <p class="text-sm text-green-600 dark:text-green-400 mb-1">Success</p>
              <p class="text-2xl font-bold text-green-900 dark:text-green-300">{{ importResult.successCount }}</p>
            </div>
            <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <p class="text-sm text-red-600 dark:text-red-400 mb-1">Failed</p>
              <p class="text-2xl font-bold text-red-900 dark:text-red-300">{{ importResult.failureCount }}</p>
            </div>
            <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
              <p class="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Skipped</p>
              <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{{ importResult.skippedCount }}</p>
            </div>
          </div>

          <!-- Import Errors -->
          <div v-if="importResult.errors.length > 0">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Import Errors:</h4>
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-h-60 overflow-y-auto">
              <div
                v-for="(error, index) in importResult.errors"
                :key="index"
                class="px-4 py-3 border-b border-red-200 dark:border-red-800 last:border-b-0"
              >
                <p class="text-sm font-medium text-red-900 dark:text-red-300">Row {{ error.row }}</p>
                <p class="text-sm text-red-700 dark:text-red-400">{{ error.error }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- Import Options -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Options</h4>
            
            <label class="flex items-start">
              <input
                type="checkbox"
                v-model="importOptions.skipDuplicates"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mt-1 mr-3"
              />
              <div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Skip Duplicates</span>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Skip entries with duplicate email addresses
                </p>
              </div>
            </label>

            <label class="flex items-start">
              <input
                type="checkbox"
                v-model="importOptions.autoApprove"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mt-1 mr-3"
              />
              <div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-Approve Low Risk</span>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatically approve entries with low risk level
                </p>
              </div>
            </label>
          </div>

          <!-- Confirmation -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p class="text-sm text-blue-900 dark:text-blue-300">
              You are about to import <strong>{{ validationResult?.validRows }}</strong> entries.
              Please review the options above and click "Start Import" to proceed.
            </p>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <i class="pi pi-exclamation-circle text-red-600 dark:text-red-400 mr-3"></i>
          <p class="text-sm text-red-800 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <Button
          v-if="currentStep > 1 && !isImporting && !importResult"
          variant="outline"
          @click="goBack"
        >
          <i class="pi pi-arrow-left mr-2"></i>
          Back
        </Button>
        <div v-else></div>

        <div class="flex gap-3">
          <Button
            v-if="!importResult"
            variant="outline"
            @click="handleClose"
            :disabled="isValidating || isImporting"
          >
            Cancel
          </Button>
          <Button
            v-if="currentStep === 1"
            variant="primary"
            @click="validateFile"
            :disabled="!selectedFile"
          >
            Next: Validate
            <i class="pi pi-arrow-right ml-2"></i>
          </Button>
          <Button
            v-if="currentStep === 2 && validationResult"
            variant="primary"
            @click="proceedToImport"
            :disabled="validationResult.validRows === 0"
          >
            Next: Import Options
            <i class="pi pi-arrow-right ml-2"></i>
          </Button>
          <Button
            v-if="currentStep === 3 && !isImporting && !importResult"
            variant="primary"
            @click="startImport"
          >
            <i class="pi pi-upload mr-2"></i>
            Start Import
          </Button>
          <Button
            v-if="importResult"
            variant="primary"
            @click="handleClose"
          >
            <i class="pi pi-check mr-2"></i>
            Done
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWhitelistStore } from '../../stores/whitelist';
import type { CsvValidationResult, BulkImportResponse } from '../../types/whitelist';
import Modal from '../ui/Modal.vue';
import Button from '../ui/Button.vue';
import Badge from '../ui/Badge.vue';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  imported: [count: number];
}>();

const whitelistStore = useWhitelistStore();

const currentStep = ref(1);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const isValidating = ref(false);
const validationResult = ref<CsvValidationResult | null>(null);

const isImporting = ref(false);
const importProgress = ref(0);
const importResult = ref<BulkImportResponse | null>(null);

const importOptions = ref({
  skipDuplicates: true,
  autoApprove: false,
});

const error = ref('');

function triggerFileSelect() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectFile(target.files[0]);
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectFile(event.dataTransfer.files[0]);
  }
}

function selectFile(file: File) {
  if (!file.name.endsWith('.csv')) {
    error.value = 'Please select a CSV file';
    return;
  }
  selectedFile.value = file;
  error.value = '';
}

function removeFile() {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function validateFile() {
  if (!selectedFile.value) return;

  isValidating.value = true;
  error.value = '';

  try {
    const result = await whitelistStore.validateCsv(selectedFile.value);
    if (result) {
      validationResult.value = result;
      currentStep.value = 2;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to validate CSV';
  } finally {
    isValidating.value = false;
  }
}

function proceedToImport() {
  currentStep.value = 3;
}

async function startImport() {
  if (!validationResult.value) return;

  isImporting.value = true;
  importProgress.value = 0;
  error.value = '';

  try {
    // Simulate progress
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += 10;
      }
    }, 200);

    const result = await whitelistStore.bulkImport({
      entries: validationResult.value.preview.filter(p => !p.hasErrors).map(p => ({
        name: p.name,
        email: p.email,
        walletAddress: p.walletAddress,
        organizationName: p.organizationName,
        entityType: p.entityType,
        jurisdictionCode: p.jurisdictionCode,
        jurisdictionName: '',
        riskLevel: 'low',
        kycStatus: 'not_started',
        accreditationStatus: 'not_required',
        documentationComplete: false,
        documentsUploaded: [],
        status: 'pending',
        createdBy: 'current-user',
      })),
      skipDuplicates: importOptions.value.skipDuplicates,
      autoApprove: importOptions.value.autoApprove,
    });

    clearInterval(progressInterval);
    importProgress.value = 100;

    if (result) {
      importResult.value = result;
      emit('imported', result.successCount);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to import entries';
  } finally {
    isImporting.value = false;
  }
}

function goBack() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function handleClose() {
  if (isValidating.value || isImporting.value) {
    return;
  }

  // Reset state
  currentStep.value = 1;
  selectedFile.value = null;
  validationResult.value = null;
  importResult.value = null;
  importProgress.value = 0;
  error.value = '';

  emit('close');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
</script>
