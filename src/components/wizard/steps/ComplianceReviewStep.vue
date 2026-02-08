<template>
  <WizardStep
    title="Compliance Review"
    description="Ensure your token meets regulatory requirements and best practices."
    :validation-errors="errors"
    :show-errors="showErrors"
    help-text="Compliance helps protect you and your users. We'll guide you through the essentials."
  >
    <div class="space-y-6">
      <!-- MICA Readiness Summary -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="pi pi-shield text-biatec-accent"></i>
            MICA Compliance Readiness
          </h4>
          <div :class="[
            'px-4 py-2 rounded-full text-sm font-semibold',
            complianceScore >= 80 ? 'bg-green-500/20 text-green-400' :
            complianceScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          ]">
            {{ complianceScore }}% Ready
          </div>
        </div>

        <div class="mb-4">
          <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              :class="[
                'h-full transition-all duration-500',
                complianceScore >= 80 ? 'bg-green-500' :
                complianceScore >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              ]"
              :style="{ width: complianceScore + '%' }"
            ></div>
          </div>
        </div>

        <p class="text-sm text-gray-400 mb-4">
          MICA (Markets in Crypto-Assets) is EU regulation for digital assets. 
          Even if you're not in the EU, following these guidelines helps ensure responsible token creation.
        </p>

        <!-- Compliance Badges -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            v-for="category in categoryProgress"
            :key="category.category"
            class="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-center"
          >
            <div :class="[
              'text-2xl font-bold mb-1',
              category.percentage === 100 ? 'text-green-400' :
              category.percentage >= 50 ? 'text-yellow-400' :
              'text-gray-400'
            ]">
              {{ category.completed }}/{{ category.total }}
            </div>
            <div class="text-xs text-gray-500 capitalize">
              {{ formatCategoryName(category.category) }}
            </div>
          </div>
        </div>
      </div>

      <!-- What is MICA? Info -->
      <div class="p-5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <details class="cursor-pointer">
          <summary class="text-sm font-semibold text-blue-400 select-none flex items-center gap-2">
            <i class="pi pi-question-circle"></i>
            What is MICA and why does it matter?
          </summary>
          <div class="mt-3 space-y-2 text-sm text-gray-300">
            <p>
              <strong>MICA (Markets in Crypto-Assets Regulation)</strong> is the European Union's 
              comprehensive framework for regulating digital assets. It aims to:
            </p>
            <ul class="list-disc list-inside space-y-1 ml-4 text-xs text-gray-400">
              <li>Protect consumers and investors</li>
              <li>Prevent market manipulation and abuse</li>
              <li>Ensure transparency and disclosure</li>
              <li>Combat money laundering and terrorist financing</li>
            </ul>
            <p class="text-xs text-gray-400">
              Even if you're not operating in Europe, MICA compliance demonstrates best practices 
              and can help you comply with similar regulations in other jurisdictions.
            </p>
          </div>
        </details>
      </div>

      <!-- Compliance Checklist by Category -->
      <div class="glass-effect rounded-xl p-6 border border-white/10">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="pi pi-list-check text-biatec-accent"></i>
          Compliance Requirements
        </h4>

        <!-- Category Tabs -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              selectedCategory === category
                ? 'bg-biatec-accent text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            ]"
          >
            {{ formatCategoryName(category) }}
          </button>
        </div>

        <!-- Checklist Items -->
        <div class="space-y-3">
          <div
            v-for="item in filteredChecklistItems"
            :key="item.id"
            class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            <div class="flex items-start gap-3">
              <button
                @click="toggleCheckItem(item.id)"
                :class="[
                  'flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all mt-0.5',
                  item.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-600 hover:border-gray-500'
                ]"
                :aria-label="item.completed ? 'Mark as incomplete' : 'Mark as complete'"
              >
                <i v-if="item.completed" class="pi pi-check text-white text-xs"></i>
              </button>
              
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h5 class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ item.label }}
                  </h5>
                  <span
                    v-if="item.required"
                    class="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium"
                  >
                    Required
                  </span>
                </div>
                <p class="text-sm text-gray-400 mb-2">
                  {{ item.description }}
                </p>
                
                <!-- Glossary for technical terms -->
                <div v-if="hasGlossaryTerms(item.label)" class="mt-2">
                  <button
                    @click="toggleGlossary(item.id)"
                    class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <i class="pi pi-info-circle"></i>
                    {{ expandedGlossary[item.id] ? 'Hide' : 'Show' }} explanation
                  </button>
                  <div v-if="expandedGlossary[item.id]" class="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-gray-300">
                    {{ getGlossaryExplanation(item.label) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Acknowledgment (if not all required items complete) -->
      <div v-if="!allRequiredComplete" class="glass-effect rounded-xl p-6 border border-yellow-500/30 bg-yellow-500/5">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-yellow-400 text-xl mt-0.5"></i>
          <div class="flex-1">
            <h4 class="text-md font-semibold text-yellow-400 mb-2">
              Compliance Requirements Not Met
            </h4>
            <p class="text-sm text-gray-300 mb-4">
              You haven't completed all required compliance checks. While you can proceed, 
              we strongly recommend completing these requirements to ensure regulatory compliance.
            </p>
            
            <div class="flex items-start gap-2">
              <input
                id="acknowledge-risk"
                v-model="riskAcknowledged"
                type="checkbox"
                class="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-biatec-accent focus:ring-biatec-accent"
              />
              <label for="acknowledge-risk" class="text-sm text-gray-300 cursor-pointer">
                I understand the risks and acknowledge that my token may not be fully compliant 
                with MICA and other regulations. I will consult with legal counsel as needed.
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Compliance Complete -->
      <div v-else class="glass-effect rounded-xl p-6 border border-green-500/30 bg-green-500/5">
        <div class="flex items-center gap-3">
          <i class="pi pi-check-circle text-green-400 text-2xl"></i>
          <div>
            <h4 class="text-md font-semibold text-green-400 mb-1">
              All Required Checks Complete
            </h4>
            <p class="text-sm text-gray-300">
              Your token configuration meets the essential compliance requirements. 
              You're ready to proceed to deployment!
            </p>
          </div>
        </div>
      </div>

      <!-- Help Resources -->
      <div class="p-5 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h5 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <i class="pi pi-book text-biatec-accent"></i>
          Need Help with Compliance?
        </h5>
        <div class="space-y-2 text-sm text-gray-400">
          <a href="#" class="flex items-center gap-2 hover:text-biatec-accent transition-colors">
            <i class="pi pi-external-link text-xs"></i>
            Read our MICA Compliance Guide
          </a>
          <a href="#" class="flex items-center gap-2 hover:text-biatec-accent transition-colors">
            <i class="pi pi-external-link text-xs"></i>
            Download Compliance Checklist
          </a>
          <a href="#" class="flex items-center gap-2 hover:text-biatec-accent transition-colors">
            <i class="pi pi-external-link text-xs"></i>
            Find Legal Counsel in Your Jurisdiction
          </a>
        </div>
      </div>
    </div>
  </WizardStep>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComplianceStore } from '../../../stores/compliance'
import WizardStep from '../WizardStep.vue'

const complianceStore = useComplianceStore()

const showErrors = ref(false)
const errors = ref<string[]>([])
const selectedCategory = ref<string>('kyc-aml')
const riskAcknowledged = ref(false)
const expandedGlossary = ref<Record<string, boolean>>({})

const categories = ['kyc-aml', 'jurisdiction', 'disclosure', 'network-specific']

const complianceScore = computed(() => {
  return complianceStore.metrics.completionPercentage
})

const categoryProgress = computed(() => {
  return complianceStore.categoryProgress
})

const filteredChecklistItems = computed(() => {
  return complianceStore.filteredChecklist.filter(
    item => item.category === selectedCategory.value
  )
})

const allRequiredComplete = computed(() => {
  return complianceStore.requiredItemsComplete
})

const toggleCheckItem = (itemId: string) => {
  complianceStore.toggleCheckItem(itemId)
  validateCompliance()
}

const toggleGlossary = (itemId: string) => {
  expandedGlossary.value[itemId] = !expandedGlossary.value[itemId]
}

const formatCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    'kyc-aml': 'KYC/AML',
    'jurisdiction': 'Jurisdiction',
    'disclosure': 'Disclosure',
    'network-specific': 'Network'
  }
  return names[category] || category
}

const hasGlossaryTerms = (label: string): boolean => {
  const glossaryTerms = ['KYC', 'AML', 'MICA', 'UBO', 'GDPR', 'OFAC', 'Sanctions']
  return glossaryTerms.some(term => label.includes(term))
}

const getGlossaryExplanation = (label: string): string => {
  if (label.includes('KYC')) {
    return 'KYC (Know Your Customer) is the process of verifying the identity of your users. This typically involves collecting identification documents, proof of address, and other personal information to ensure users are who they claim to be.'
  }
  if (label.includes('AML')) {
    return 'AML (Anti-Money Laundering) procedures are designed to prevent criminals from disguising illegally obtained funds as legitimate income. This includes monitoring transactions, reporting suspicious activities, and maintaining detailed records.'
  }
  if (label.includes('MICA')) {
    return 'MICA (Markets in Crypto-Assets) is the EU\'s regulatory framework for digital assets. It classifies tokens into categories (utility, e-money, asset-referenced) and sets requirements for authorization, disclosure, and consumer protection.'
  }
  if (label.includes('UBO')) {
    return 'UBO (Ultimate Beneficial Owner) refers to the natural person who ultimately owns or controls an entity. For institutional token holders, you need to identify who really controls the organization, even if ownership is through multiple layers.'
  }
  if (label.includes('GDPR')) {
    return 'GDPR (General Data Protection Regulation) is the EU\'s data privacy law. It gives individuals control over their personal data and requires organizations to handle data responsibly, including the right to access, correct, and delete personal information.'
  }
  if (label.includes('OFAC')) {
    return 'OFAC (Office of Foreign Assets Control) is a U.S. Treasury department that enforces economic sanctions. Checking against OFAC lists ensures you\'re not doing business with sanctioned individuals, entities, or countries.'
  }
  if (label.includes('Sanctions')) {
    return 'Sanctions are restrictions imposed by governments to prevent transactions with certain individuals, organizations, or countries. Screening for sanctioned addresses helps ensure compliance with international regulations and prevents illegal activities.'
  }
  return 'Compliance explanation not available.'
}

const validateCompliance = () => {
  errors.value = []
  
  if (!allRequiredComplete.value && !riskAcknowledged.value) {
    errors.value.push('Please complete all required compliance checks or acknowledge the risks')
  }
  
  showErrors.value = errors.value.length > 0
}

const isValid = computed(() => {
  // Step is valid if all required items are complete OR user has acknowledged risks
  return allRequiredComplete.value || riskAcknowledged.value
})

onMounted(() => {
  // Emit analytics event
  console.log('[Analytics] Compliance review step viewed')
})

defineExpose({
  isValid,
})
</script>
